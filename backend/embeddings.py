"""
embeddings.py — chunk, embed, and search article content via OpenAI + Supabase pgvector.

Chunking strategy:
  - Split at paragraph boundaries to keep semantic units intact
  - Target ~500 tokens (≈2000 chars) per chunk with ~200 char overlap
  - Prepend article title to every chunk so each is self-contained
  - Hard-split any paragraph that exceeds the limit alone

Deduplication:
  - embed_article() is a no-op if chunks already exist for that article_id
  - embed_pending_articles() only processes articles with no chunks at all
  - Neither re-embeds on scraper refresh, keeping token usage minimal
"""

import logging
import os
import re

from openai import OpenAI
from db import supabase

logger = logging.getLogger(__name__)

CHUNK_CHARS = 2000       # ~500 tokens
OVERLAP_CHARS = 200      # ~50 tokens  — carried into next chunk for continuity
EMBEDDING_MODEL = "text-embedding-3-small"
BATCH_SIZE = 100         # OpenAI allows up to 2048 inputs per call; 100 is safe


# ── Text chunking ─────────────────────────────────────────────────────────────

def _split(text: str, title: str) -> list[str]:
    """
    Split article text into overlapping chunks at natural paragraph breaks.
    Every chunk is prefixed with the article title so it is self-contained.
    """
    prefix = f"{title}\n\n" if title else ""
    paragraphs = [p.strip() for p in re.split(r'\n\s*\n', text) if p.strip()]

    chunks: list[str] = []
    current = prefix

    for para in paragraphs:
        candidate = (current + "\n\n" + para).strip() if current.strip() != prefix.strip() else (prefix + para)

        if len(candidate) <= CHUNK_CHARS:
            current = candidate
        else:
            # Save what we have, start next chunk with overlap tail
            if current.strip() and current.strip() != prefix.strip():
                chunks.append(current.strip())
            overlap = current[-OVERLAP_CHARS:] if len(current) > OVERLAP_CHARS else ""
            current = prefix + overlap + ("\n\n" if overlap else "") + para

    if current.strip() and current.strip() != prefix.strip():
        chunks.append(current.strip())

    # Hard-split any chunk that's still oversized (e.g. a single massive paragraph)
    final: list[str] = []
    for chunk in chunks:
        if len(chunk) <= CHUNK_CHARS * 1.5:
            final.append(chunk)
        else:
            for i in range(0, len(chunk), CHUNK_CHARS - OVERLAP_CHARS):
                part = chunk[i : i + CHUNK_CHARS]
                if part.strip():
                    final.append(part)

    return final if final else ([prefix + text[: CHUNK_CHARS]] if text.strip() else [])


# ── OpenAI calls ──────────────────────────────────────────────────────────────

def _embed_batch(texts: list[str]) -> list[list[float]]:
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    embeddings: list[list[float]] = []
    for i in range(0, len(texts), BATCH_SIZE):
        batch = texts[i : i + BATCH_SIZE]
        resp = client.embeddings.create(model=EMBEDDING_MODEL, input=batch)
        embeddings.extend(item.embedding for item in resp.data)
    return embeddings


# ── Public API ────────────────────────────────────────────────────────────────

def article_has_chunks(article_id: str) -> bool:
    """Return True if this article has already been embedded."""
    rows = (
        supabase.table("article_chunks")
        .select("id", count="exact")
        .eq("article_id", article_id)
        .limit(1)
        .execute()
    )
    return (rows.count or 0) > 0


def embed_article(article_id: str, title: str, content: str) -> int:
    """
    Chunk and embed one article. Skips silently if already embedded.
    Returns the number of chunks created (0 if skipped or empty).
    """
    if article_has_chunks(article_id):
        logger.debug("Article %s already embedded — skipping", article_id)
        return 0

    if not (content or "").strip():
        return 0

    chunks = _split(content, title or "")
    if not chunks:
        return 0

    embeddings = _embed_batch(chunks)

    rows = [
        {
            "article_id": article_id,
            "chunk_index": i,
            "content": chunk,
            "embedding": emb,
        }
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings))
    ]
    supabase.table("article_chunks").insert(rows).execute()
    logger.info("Embedded article %s → %d chunks", article_id, len(chunks))
    return len(chunks)


def embed_pending_articles() -> int:
    """
    Find every article that has no chunks yet and embed it.
    Safe to call repeatedly — already-embedded articles are skipped.
    Returns total chunks created across all pending articles.
    """
    # Collect already-embedded article IDs in one query
    existing = supabase.table("article_chunks").select("article_id").execute()
    embedded_ids = {r["article_id"] for r in existing.data}

    all_articles = (
        supabase.table("articles")
        .select("id, title, content")
        .execute()
    )
    pending = [
        r for r in all_articles.data
        if r["id"] not in embedded_ids and (r.get("content") or "").strip()
    ]

    if not pending:
        logger.info("No pending articles to embed")
        return 0

    logger.info("Embedding %d article(s) with no chunks yet", len(pending))
    total = 0
    for art in pending:
        try:
            total += embed_article(art["id"], art.get("title") or "", art["content"])
        except Exception as exc:
            logger.error("Failed to embed article %s: %s", art["id"], exc)

    logger.info("Embedding complete — %d total chunks created", total)
    return total


def search_chunks(question: str, match_count: int = 10) -> list[dict]:
    """
    Embed `question` and return the top matching chunks from Supabase.
    Each result: { article_id, chunk_index, content, similarity }
    """
    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    resp = client.embeddings.create(model=EMBEDDING_MODEL, input=question)
    query_embedding = resp.data[0].embedding

    results = supabase.rpc(
        "match_article_chunks",
        {"query_embedding": query_embedding, "match_count": match_count},
    ).execute()
    return results.data
