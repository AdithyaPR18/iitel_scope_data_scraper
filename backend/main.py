import os
import re
from dotenv import load_dotenv

load_dotenv()

import anthropic
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from db import supabase

app = FastAPI(title="AI Policy API", version="1.0.0", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your frontend URL before going to production
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

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


def _fix_encoding(text: str | None) -> str:
    """Repair mojibake: UTF-8 bytes that were stored decoded as Latin-1."""
    if not text:
        return text or ""
    try:
        return text.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


def _strip_markdown(text: str) -> str:
    """Convert markdown to clean plain text for previews and snippets."""
    text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', text)
    text = re.sub(r'_{1,3}(.*?)_{1,3}', r'\1', text)
    text = re.sub(r'^\s*[*\-+]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d+[.)]\s+', '', text, flags=re.MULTILINE)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    text = re.sub(r'`([^`]+)`', r'\1', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _escape_like(q: str) -> str:
    """Escape LIKE wildcards in user input to prevent pattern injection."""
    return q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _keywords(question: str) -> list[str]:
    """Extract meaningful keywords from a question for context retrieval."""
    words = re.sub(r"[^\w\s]", "", question.lower()).split()
    return [w for w in words if len(w) > 3 and w not in _STOPWORDS][:5]


def _fetch_context(question: str) -> list[dict]:
    """Find articles relevant to a question via keyword search."""
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

    # Fallback: return recent articles if no keyword matches
    if not articles:
        rows = (
            supabase.table("articles")
            .select("id, title, url, source, content")
            .limit(5)
            .execute()
        )
        articles = rows.data

    return articles[:8]


# ── Health ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


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
        content = _strip_markdown(_fix_encoding(row.get("content") or ""))
        data.append({
            "id": row["id"],
            "title": _fix_encoding(row["title"]),
            "url": row["url"],
            "source": row["source"],
            "published_at": row["published_at"],
            "preview": content[:300] + ("…" if len(content) > 300 else ""),
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
    return {
        **d,
        "title": _fix_encoding(d.get("title")),
        "content": _fix_encoding(d.get("content")),
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
        content = _strip_markdown(_fix_encoding(row.get("content") or ""))
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


@app.post("/chat")
def chat(req: ChatRequest):
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

    return {
        "answer": msg.content[0].text,
        "sources": [
            {"title": a["title"], "url": a["url"], "source": a["source"]}
            for a in articles
        ],
    }
