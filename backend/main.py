import os
import re
import sys
import threading
import subprocess
from datetime import datetime, timezone
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

import io
import anthropic
import pypdf
from fastapi import FastAPI, Query, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langdetect import detect, LangDetectException, DetectorFactory
DetectorFactory.seed = 0  # deterministic results
from deep_translator import GoogleTranslator

from db import supabase
import auth as _auth

import logging
logger = logging.getLogger(__name__)

# Embeddings are optional — degrade gracefully if key not configured yet
_EMBEDDINGS_READY = bool(os.getenv("OPENAI_API_KEY", "").strip().startswith("sk-"))
if _EMBEDDINGS_READY:
    from embeddings import embed_article, embed_pending_articles, search_chunks

PIPELINE_DIR = os.path.normpath(
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ai-policy-pipeline")
)

_refresh: dict = {"running": False, "started_at": None, "finished_at": None, "error": None}

MANAGER_EMAIL = "karla.bailey@iitelsolutions.com"
MANAGER_PASSWORD = "iitel123"


def _run_crawl() -> None:
    _refresh["running"] = True
    _refresh["started_at"] = datetime.now(timezone.utc).isoformat()
    _refresh["error"] = None
    try:
        subprocess.run(
            [sys.executable, "run.py"],
            cwd=PIPELINE_DIR,
            env={**os.environ},
            check=True,
            timeout=7200,  # 2-hour hard cap
        )
        # Embed any articles that were just added (skips already-embedded ones)
        if _EMBEDDINGS_READY:
            try:
                embed_pending_articles()
            except Exception as exc:
                _refresh["error"] = (_refresh.get("error") or "") + f" | Embedding error: {exc}"
    except subprocess.CalledProcessError as exc:
        _refresh["error"] = f"Pipeline exited with code {exc.returncode}"
    except Exception as exc:
        _refresh["error"] = str(exc)
    finally:
        _refresh["running"] = False
        _refresh["finished_at"] = datetime.now(timezone.utc).isoformat()


app = FastAPI(title="AI Policy API", version="1.0.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend URL before going to production
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)

# Import built-in source list from the pipeline config
import sys as _sys
_sys.path.insert(0, PIPELINE_DIR)
try:
    from config.sources import SOURCES as _BUILTIN_SOURCES  # type: ignore[import]
except Exception:
    _BUILTIN_SOURCES = []

_STOPWORDS = {
    "what", "does", "have", "this", "that", "with", "from", "they", "about",
    "will", "would", "could", "should", "which", "where", "when", "how",
    "are", "the", "and", "for", "not", "but", "can", "tell", "give", "show",
    "please", "your", "their", "there", "been", "being", "some", "more",
}

SYSTEM_PROMPT = (
    "You are an expert AI policy analyst. Answer questions about AI ethics policies, "
    "regulations, and guidelines from around the world using only the policy documents "
    "provided in the context below. When referencing a specific policy, cite the source "
    "name and URL. If the provided documents don't contain enough information to answer "
    "the question fully, say so clearly rather than speculating."
)


# ── Auth helpers ──────────────────────────────────────────────────────────────

def _get_current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        return _auth.decode_token(authorization.split(" ", 1)[1])
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


def _require_manager(user: dict = Depends(_get_current_user)) -> dict:
    if not user.get("is_manager"):
        raise HTTPException(status_code=403, detail="Manager access required")
    return user


def _detect_by_script(text: str) -> str | None:
    """Return a language code if the text contains unambiguous non-Latin script characters."""
    for c in text:
        o = ord(c)
        if 0x3040 <= o <= 0x309F or 0x30A0 <= o <= 0x30FF:
            return 'ja'   # Hiragana / Katakana → Japanese
        if 0xAC00 <= o <= 0xD7AF:
            return 'ko'   # Hangul → Korean
        if 0x4E00 <= o <= 0x9FFF:
            return 'zh'   # CJK (no kana found yet) → Chinese
        if 0x0600 <= o <= 0x06FF:
            return 'ar'   # Arabic
        if 0x0900 <= o <= 0x097F:
            return 'hi'   # Devanagari → Hindi
        if 0x0E00 <= o <= 0x0E7F:
            return 'th'   # Thai
    return None


def _detect_language(title: str, content: str = "") -> str:
    """Detect language using script analysis first, langdetect second."""
    title_s = (title or "").strip()
    # 1. Script detection on title — fast and never wrong for CJK/Arabic/etc.
    if title_s:
        lang = _detect_by_script(title_s)
        if lang:
            return lang

    # 2. Script detection on a clean content sample
    content_s = (content or "")[:500].strip()
    if content_s and not _is_garbled(content_s):
        lang = _detect_by_script(content_s)
        if lang:
            return lang

    # 3. langdetect for Latin-script languages (French, Spanish, German, etc.)
    #    Try title first — it's reliable; avoid garbled content.
    for sample, min_len in ((title_s, 15), (content_s if not _is_garbled(content_s) else "", 60)):
        if not sample or len(sample) < min_len:
            continue
        try:
            lang = detect(sample)
            if lang and lang != "en":
                return lang
        except LangDetectException:
            continue

    return "en"


def _is_garbled(text: str) -> bool:
    """True when content has too many broken encoding bytes to be readable."""
    if not text or len(text) < 20:
        return False
    sample = text[:300]
    non_ascii = sum(1 for c in sample if 0x7F < ord(c) < 0x0100)
    return non_ascii / len(sample) > 0.35


def _fix_encoding(text: str | None) -> str:
    """Repair mojibake: UTF-8 bytes that were stored decoded as Latin-1."""
    if not text:
        return text or ""
    try:
        return text.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


def _clean_content(text: str) -> str:
    """Normalize content from any source into readable plain text for previews."""
    # Strip HTML tags (catches sources that store raw HTML)
    text = re.sub(r'<[^>]+>', ' ', text)
    # Decode common HTML entities
    text = (text
        .replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>')
        .replace('&nbsp;', ' ').replace('&quot;', '"').replace('&#39;', "'")
    )
    # Strip markdown headings, bold, italic, bullets, links, inline code
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', text)
    text = re.sub(r'_{1,3}(.*?)_{1,3}', r'\1', text)
    text = re.sub(r'^\s*[*\-+]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+[.)]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    # Collapse whitespace
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _escape_like(q: str) -> str:
    """Escape LIKE wildcards in user input to prevent pattern injection."""
    return q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _keywords(question: str) -> list[str]:
    """Extract meaningful keywords from a question for context retrieval."""
    words = re.sub(r"[^\w\s]", "", question.lower()).split()
    return [w for w in words if len(w) > 3 and w not in _STOPWORDS][:5]


def _fetch_context_keywords(question: str) -> list[dict]:
    """Keyword-based context retrieval (fallback when embeddings unavailable)."""
    seen: set[str] = set()
    articles: list[dict] = []

    for kw in _keywords(question):
        esc = _escape_like(kw)
        rows = (
            supabase.table("articles")
            .select("id, title, url, source, content")
            .or_(f"title.ilike.%{esc}%,content.ilike.%{esc}%")
            .limit(4)
            .execute()
        )
        for row in rows.data:
            if row["id"] not in seen:
                seen.add(row["id"])
                articles.append(row)

    if not articles:
        rows = (
            supabase.table("articles")
            .select("id, title, url, source, content")
            .limit(5)
            .execute()
        )
        articles = rows.data

    return articles[:8]


def _fetch_context(question: str) -> list[dict]:
    """
    Vector similarity search when embeddings are available, keyword fallback otherwise.
    Returns a list of article dicts with id, title, url, source, content.
    """
    if not _EMBEDDINGS_READY:
        return _fetch_context_keywords(question)

    try:
        chunks = search_chunks(question, match_count=12)
        if not chunks:
            return _fetch_context_keywords(question)

        # Deduplicate by article — keep the highest-similarity chunk per article,
        # then fetch full article metadata for the top 8 unique articles.
        seen: dict[str, float] = {}
        for c in chunks:
            aid = c["article_id"]
            if aid not in seen or c["similarity"] > seen[aid]:
                seen[aid] = c["similarity"]

        top_ids = sorted(seen, key=lambda k: seen[k], reverse=True)[:8]

        # Build a map of article_id → best chunk content for the context window
        best_chunk: dict[str, str] = {}
        for c in chunks:
            aid = c["article_id"]
            if aid in top_ids and (aid not in best_chunk or c["similarity"] > seen.get(aid, 0)):
                best_chunk[aid] = c["content"]

        rows = (
            supabase.table("articles")
            .select("id, title, url, source")
            .in_("id", top_ids)
            .execute()
        )

        # Attach the relevant chunk content (not the full article — keeps context tight)
        return [
            {**row, "content": best_chunk.get(row["id"], "")}
            for row in rows.data
        ]

    except Exception as exc:
        logger.warning("Vector search failed, falling back to keyword search: %s", exc)
        return _fetch_context_keywords(question)


# ── Startup ───────────────────────────────────────────────────────────────────

@app.on_event("startup")
def _ensure_manager():
    """Create the manager account on first boot if it doesn't already exist."""
    try:
        existing = supabase.table("users").select("id").eq("email", MANAGER_EMAIL).execute()
        if not existing.data:
            supabase.table("users").insert({
                "email": MANAGER_EMAIL,
                "password_hash": _auth.hash_password(MANAGER_PASSWORD),
                "is_manager": True,
            }).execute()
            logger.info("Manager account created: %s", MANAGER_EMAIL)
    except Exception as exc:
        logger.warning("Could not verify/create manager account: %s", exc)


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


# ── 0. Auth ───────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str


@app.post("/auth/login")
def login(req: LoginRequest):
    rows = (
        supabase.table("users")
        .select("id, email, password_hash, is_manager")
        .eq("email", req.email.strip().lower())
        .execute()
    )
    if not rows.data:
        raise HTTPException(status_code=404, detail="No account found with this email address")
    user = rows.data[0]
    if not _auth.verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect password")
    token = _auth.create_token(user["id"], user["email"], user["is_manager"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "is_manager": user["is_manager"]}}


@app.post("/auth/signup")
def signup(req: SignupRequest):
    email = req.email.strip().lower()
    if "@" not in email:
        raise HTTPException(status_code=422, detail="Invalid email address")
    if len(req.password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    existing = supabase.table("users").select("id").eq("email", email).execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    row = supabase.table("users").insert({
        "email": email,
        "password_hash": _auth.hash_password(req.password),
        "is_manager": False,
    }).execute()
    user = row.data[0]
    token = _auth.create_token(user["id"], user["email"], user["is_manager"])
    return {"token": token, "user": {"id": user["id"], "email": user["email"], "is_manager": user["is_manager"]}}


@app.get("/auth/users")
def list_users(_manager: dict = Depends(_require_manager)):
    rows = (
        supabase.table("users")
        .select("id, email, is_manager, created_at")
        .order("created_at", desc=False)
        .execute()
    )
    return {"data": rows.data}


@app.delete("/auth/users/{user_id}")
def delete_user(user_id: str, manager: dict = Depends(_require_manager)):
    if user_id == manager["sub"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    supabase.table("users").delete().eq("id", user_id).execute()
    return {"deleted": user_id}


class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str


@app.post("/auth/reset-password")
def reset_password(req: ResetPasswordRequest):
    email = req.email.strip().lower()
    rows = supabase.table("users").select("id, is_manager").eq("email", email).execute()
    if not rows.data:
        raise HTTPException(status_code=404, detail="No account found with this email address")
    user = rows.data[0]
    if user["is_manager"]:
        raise HTTPException(status_code=403, detail="Manager password cannot be reset this way")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    supabase.table("users").update(
        {"password_hash": _auth.hash_password(req.new_password)}
    ).eq("id", user["id"]).execute()
    return {"reset": True}


# ── 1. Policies list ──────────────────────────────────────────────────────────

@app.get("/policies")
def list_policies(page: int = 1, limit: int = Query(20, le=100)):
    offset = (page - 1) * limit
    rows = (
        supabase.table("articles")
        .select("id, title, url, source, published_at, content")
        .order("published_at", desc=True)
        .range(offset, offset + limit - 1)
        .execute()
    )
    count = (
        supabase.table("articles")
        .select("id", count="exact")
        .execute()
    )
    data = []
    for row in rows.data:
        title = _fix_encoding(row.get("title") or "")
        content = _clean_content(_fix_encoding(row.get("content") or ""))
        preview = "" if _is_garbled(content) else content[:300] + ("…" if len(content) > 300 else "")
        data.append({
            "id": row["id"],
            "title": title,
            "url": row["url"],
            "source": row["source"],
            "published_at": row["published_at"],
            "language": _detect_language(title, content),
            "preview": preview,
        })
    return {
        "data": data,
        "total": count.count,
        "page": page,
        "limit": limit,
    }


@app.get("/policies/{article_id}")
def get_policy(article_id: str):
    row = (
        supabase.table("articles")
        .select("id, title, url, source, published_at, content")
        .eq("id", article_id)
        .single()
        .execute()
    )
    d = row.data
    title = _fix_encoding(d.get("title") or "")
    fixed_content = _fix_encoding(d.get("content") or "")
    clean = _clean_content(fixed_content)
    return {
        **d,
        "title": title,
        "content": None if _is_garbled(clean) else fixed_content,
        "language": _detect_language(title, clean),
        "garbled": _is_garbled(clean),
    }


# ── 2. Search ─────────────────────────────────────────────────────────────────

@app.get("/search")
def search(
    q: str = Query(..., min_length=1),
    filter: str = Query("all", pattern="^(title|content|all)$"),
    limit: int = Query(20, le=100),
):
    esc = _escape_like(q)
    base = supabase.table("articles").select("id, title, url, source, published_at, content")

    if filter == "title":
        rows = base.ilike("title", f"%{esc}%").limit(limit).execute()
    elif filter == "content":
        rows = base.ilike("content", f"%{esc}%").limit(limit).execute()
    else:
        rows = base.or_(f"title.ilike.%{esc}%,content.ilike.%{esc}%").limit(limit).execute()

    results = []
    for row in rows.data:
        content = _clean_content(_fix_encoding(row.get("content") or ""))
        idx = content.lower().find(q.lower())
        if idx >= 0:
            start = max(0, idx - 80)
            end = min(len(content), idx + 200)
            snippet = f"…{content[start:end]}…"
        else:
            snippet = content[:200] + ("…" if len(content) > 200 else "")

        results.append({
            "id": row["id"],
            "title": _fix_encoding(row["title"]),
            "url": row["url"],
            "source": row["source"],
            "published_at": row["published_at"],
            "snippet": snippet,
        })

    return {"data": results, "total": len(results), "query": q, "filter": filter}


# ── 3. Chat ───────────────────────────────────────────────────────────────────

class ChatRequest(BaseModel):
    question: str
    session_id: str | None = None


@app.post("/chat")
def chat(req: ChatRequest, authorization: str | None = Header(default=None)):
    # Optionally identify user for history saving (not required to use chat)
    user_id: str | None = None
    if authorization and authorization.startswith("Bearer "):
        try:
            payload = _auth.decode_token(authorization.split(" ", 1)[1])
            user_id = payload["sub"]
        except Exception:
            pass

    articles = _fetch_context(req.question)

    context = "\n\n---\n\n".join(
        f"Source: {a['source']}\nTitle: {a['title']}\nURL: {a['url']}\n\n{_fix_encoding(a.get('content') or '')[:3000]}"
        for a in articles
    )

    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])
    msg = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{
            "role": "user",
            "content": f"Policy documents:\n\n{context}\n\nQuestion: {req.question}",
        }],
    )

    answer = msg.content[0].text
    sources = [{"title": a["title"], "url": a["url"], "source": a["source"]} for a in articles]

    # Persist to chat_history if we have a logged-in user + session
    if user_id and req.session_id:
        try:
            supabase.table("chat_history").insert([
                {"user_id": user_id, "session_id": req.session_id, "role": "user", "content": req.question},
                {"user_id": user_id, "session_id": req.session_id, "role": "assistant", "content": answer, "sources": sources},
            ]).execute()
        except Exception as exc:
            logger.warning("Failed to save chat history: %s", exc)

    return {"answer": answer, "sources": sources}


@app.get("/chat/history")
def get_chat_history(current_user: dict = Depends(_get_current_user)):
    rows = (
        supabase.table("chat_history")
        .select("id, role, content, sources, created_at")
        .eq("user_id", current_user["sub"])
        .order("created_at", desc=False)
        .limit(200)
        .execute()
    )
    return {"data": rows.data}


# ── 4. Translate ──────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str


@app.post("/translate")
def translate_text(req: TranslateRequest):
    if not req.text.strip():
        return {"translated": req.text}
    try:
        translated = GoogleTranslator(source="auto", target="en").translate(req.text[:5000])
        return {"translated": translated or req.text}
    except Exception:
        return {"translated": req.text, "error": "Translation unavailable. Try again later."}


# ── 5. Refresh (pipeline trigger) ─────────────────────────────────────────────

@app.post("/refresh")
def start_refresh():
    if _refresh["running"]:
        return {"status": "already_running", **_refresh}
    threading.Thread(target=_run_crawl, daemon=True).start()
    return {"status": "started", **_refresh}


@app.get("/refresh/status")
def refresh_status():
    return {"status": "running" if _refresh["running"] else "idle", **_refresh}


# ── 6. Sources ────────────────────────────────────────────────────────────────

class SourceRequest(BaseModel):
    url: str
    label: str = ""


class UrlRequest(BaseModel):
    url: str


def _validate_url(url: str) -> str:
    """Normalise and validate a URL. Returns cleaned URL or raises ValueError."""
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    parsed = urlparse(url)
    if not parsed.netloc:
        raise ValueError("Invalid URL")
    return url


@app.get("/sources/all")
def list_all_sources():
    """Return every source (built-in + custom) with disabled status."""
    disabled_rows = supabase.table("disabled_sources").select("url").execute()
    disabled_urls: set[str] = {r["url"] for r in disabled_rows.data}

    custom_rows = (
        supabase.table("custom_sources")
        .select("id, url, label, added_at")
        .order("added_at", desc=True)
        .execute()
    )

    result = []

    # Built-in sources first
    for s in _BUILTIN_SOURCES:
        result.append({
            "id": None,
            "url": s["url"],
            "label": s["label"],
            "category": s.get("category", "Built-in"),
            "source_type": "builtin",
            "disabled": s["url"] in disabled_urls,
            "added_at": None,
        })

    # Custom sources (skip any URL already in built-in list)
    builtin_urls = {s["url"] for s in _BUILTIN_SOURCES}
    for r in custom_rows.data:
        if r["url"] not in builtin_urls:
            result.append({
                "id": r["id"],
                "url": r["url"],
                "label": r["label"],
                "category": "Custom",
                "source_type": "custom",
                "disabled": r["url"] in disabled_urls,
                "added_at": r["added_at"],
            })

    return {"data": result}


@app.get("/sources")
def list_sources():
    rows = (
        supabase.table("custom_sources")
        .select("id, url, label, added_at")
        .order("added_at", desc=True)
        .execute()
    )
    return {"data": rows.data}


@app.post("/sources")
def add_source(req: SourceRequest):
    try:
        clean_url = _validate_url(req.url)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid URL")

    label = req.label.strip() or urlparse(clean_url).netloc
    row = supabase.table("custom_sources").insert({"url": clean_url, "label": label}).execute()
    return row.data[0]


@app.delete("/sources/{source_id}")
def delete_source(source_id: str, _manager: dict = Depends(_require_manager)):
    supabase.table("custom_sources").delete().eq("id", source_id).execute()
    return {"deleted": source_id}


@app.post("/sources/disable")
def disable_source(req: UrlRequest):
    supabase.table("disabled_sources").upsert({"url": req.url}).execute()
    return {"disabled": req.url}


@app.post("/sources/enable")
def enable_source(req: UrlRequest):
    supabase.table("disabled_sources").delete().eq("url", req.url).execute()
    return {"enabled": req.url}


# ── 7. PDF upload ─────────────────────────────────────────────────────────────

@app.post("/upload/pdf")
async def upload_pdf(file: UploadFile = File(...)):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=422, detail="Only PDF files are accepted")

    raw = await file.read()
    try:
        reader = pypdf.PdfReader(io.BytesIO(raw))
        pages_text = [page.extract_text() or "" for page in reader.pages]
        full_text = "\n\n".join(pages_text).strip()
        meta = reader.metadata or {}
        pdf_title = (
            (meta.get("/Title") or "").strip()
            or (file.filename or "").removesuffix(".pdf").replace("_", " ").replace("-", " ").strip()
        )
    except Exception as exc:
        raise HTTPException(status_code=422, detail=f"Could not parse PDF: {exc}")

    if not full_text:
        raise HTTPException(
            status_code=422,
            detail="No text could be extracted — this PDF may be image-only (scanned). "
                   "Only PDFs with a text layer are supported.",
        )

    row = supabase.table("articles").insert({
        "title": pdf_title,
        "url": None,
        "source": "PDF Upload",
        "published_at": None,
        "content": full_text,
    }).execute()

    article_id = row.data[0]["id"]

    if _EMBEDDINGS_READY:
        try:
            embed_article(article_id, pdf_title, full_text)
        except Exception as exc:
            logger.warning("PDF embedding failed for %s: %s", article_id, exc)

    return {
        "id": article_id,
        "title": pdf_title,
        "pages": len(reader.pages),
        "chars": len(full_text),
    }


# ── 8. Embedding backfill ─────────────────────────────────────────────────────

@app.post("/embed/backfill")
def embed_backfill():
    """Embed all articles that don't have chunks yet. Safe to call multiple times."""
    if not _EMBEDDINGS_READY:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY not configured")
    try:
        total = embed_pending_articles()
        return {"chunks_created": total}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
