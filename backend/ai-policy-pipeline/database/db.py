"""
db.py — persists crawled pages to a JSON file database.

Schema (policy_db.json):
{
  "meta": {
    "last_updated": "2026-03-23T...",
    "total_pages": 123,
    "sources_crawled": 45
  },
  "pages": [
    {
      "category": "Vendor Policy",
      "label": "OpenAI",
      "url": "https://...",
      "title": "...",
      "text": "...",
      "fetched_at": "2026-03-23T..."
    },
    ...
  ]
}
"""

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from supabase_client import supabase

from config import OUTPUT_DIR, OUTPUT_FILE

logger = logging.getLogger(__name__)


def _db_path() -> Path:
    path = Path(OUTPUT_DIR)
    path.mkdir(parents=True, exist_ok=True)
    return path / OUTPUT_FILE


def load_db() -> dict:
    """Load existing DB or return empty structure."""
    p = _db_path()
    if p.exists():
        with open(p, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"meta": {}, "pages": []}


def save_db(db: dict) -> None:
    """Write DB back to disk (pretty-printed)."""
    p = _db_path()
    db["meta"]["last_updated"] = datetime.now(timezone.utc).isoformat()
    db["meta"]["total_pages"] = len(db["pages"])
    db["meta"]["sources_crawled"] = len({p["label"] for p in db["pages"]})
    with open(p, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)
    logger.info("💾 Saved %d pages to %s", len(db["pages"]), p)


def upsert_pages(new_pages: list[dict]) -> None:
    """
    Merge new_pages into the existing DB.
    Uses URL as unique key — updates existing entries, appends new ones.
    """
    db = load_db()
    existing: dict[str, int] = {p["url"]: i for i, p in enumerate(db["pages"])}

    added, updated = 0, 0
    for page in new_pages:
        url = page["url"]
        if url in existing:
            db["pages"][existing[url]] = page
            updated += 1
        else:
            db["pages"].append(page)
            existing[url] = len(db["pages"]) - 1
            added += 1

    logger.info("  DB: +%d new, ~%d updated", added, updated)
    save_db(db)
    push_to_supabase(new_pages)


def push_to_supabase(pages):
    cleaned = []

    for p in pages:
        cleaned.append({
            "title": p.get("title"),
            "url": p.get("url"),
            "source": p.get("label", "gov"),
            "published_at": p.get("date"),
            "content": p.get("text")
        })

    print("🔥 pushing to supabase:", len(cleaned))

    for row in cleaned:
        try:
            response = supabase.table("articles").insert(row).execute()
            print("✅ inserted:", row["url"])
        except Exception as e:
            print("❌ failed:", e)
