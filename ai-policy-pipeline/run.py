#!/usr/bin/env python3
"""
run.py — main entrypoint for the AI Policy Pipeline crawler.

Usage examples:

  # Crawl everything (will take a while — 60+ sources)
  python run.py

  # Crawl only a specific category
  python run.py --category "Vendor Policy"

  # Crawl only specific labels (comma-separated)
  python run.py --labels "OpenAI,Anthropic Legal,EDPB"

  # Dry run: just print what would be crawled
  python run.py --dry-run

  # Query the existing DB
  python run.py --query "AI governance education"
"""

import argparse
import json
import logging
import sys

from config import SOURCES, OUTPUT_DIR, OUTPUT_FILE
from pipeline import crawl_source
from database import upsert_pages, load_db

# ── logging setup ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("crawl.log", encoding="utf-8"),
    ],
)
logger = logging.getLogger(__name__)


# ── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(description="AI Policy Pipeline Crawler")
    p.add_argument("--category", help="Only crawl sources matching this category")
    p.add_argument("--labels", help="Comma-separated list of source labels to crawl")
    p.add_argument("--dry-run", action="store_true", help="Print sources without crawling")
    p.add_argument("--query", help="Search the existing DB for a keyword and print results")
    return p.parse_args()


# ── query helper ─────────────────────────────────────────────────────────────

def query_db(keyword: str) -> None:
    db = load_db()
    hits = [
        p for p in db["pages"]
        if keyword.lower() in p.get("text", "").lower()
        or keyword.lower() in p.get("title", "").lower()
    ]
    print(f"\n🔍 '{keyword}' → {len(hits)} pages\n")
    for h in hits[:20]:
        print(f"  [{h['category']}] {h['label']}")
        print(f"  {h['url']}")
        # show a short snippet around the first match
        idx = h["text"].lower().find(keyword.lower())
        if idx >= 0:
            snippet = h["text"][max(0, idx - 80): idx + 120].replace("\n", " ")
            print(f"  …{snippet}…")
        print()


# ── main ──────────────────────────────────────────────────────────────────────

def main():
    args = parse_args()

    if args.query:
        query_db(args.query)
        return

    # Filter sources
    sources = SOURCES
    if args.category:
        sources = [s for s in sources if s["category"].lower() == args.category.lower()]
    if args.labels:
        wanted = {l.strip().lower() for l in args.labels.split(",")}
        sources = [s for s in sources if s["label"].lower() in wanted]

    if not sources:
        logger.error("No sources matched the given filters.")
        sys.exit(1)

    if args.dry_run:
        print(f"\n{'─'*60}")
        print(f"DRY RUN — {len(sources)} source(s) would be crawled:\n")
        for s in sources:
            print(f"  [{s['category']}] {s['label']}  →  {s['url']}")
        print(f"{'─'*60}\n")
        return

    logger.info("Starting crawl: %d source(s)", len(sources))
    total_pages = 0

    for i, source in enumerate(sources, 1):
        logger.info("━━ [%d/%d] %s ━━", i, len(sources), source["label"])
        try:
            pages = crawl_source(source)
            if pages:
                upsert_pages(pages)
                total_pages += len(pages)
        except Exception as exc:
            logger.error("Error crawling [%s]: %s", source["label"], exc, exc_info=True)

    logger.info("✅ Done. %d total pages stored → %s/%s", total_pages, OUTPUT_DIR, OUTPUT_FILE)


if __name__ == "__main__":
    main()