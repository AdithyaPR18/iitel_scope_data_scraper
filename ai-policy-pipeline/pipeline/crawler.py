"""
crawler.py — BFS crawler for a single source.

Starts at source["url"], follows same-domain links up to MAX_PAGES_PER_DOMAIN,
optionally filters pages by keyword relevance, and returns a list of page dicts.
"""

import logging
import time
from collections import deque

from config import MAX_PAGES_PER_DOMAIN, CRAWL_DELAY, MIN_TEXT_LENGTH
from scrapers import fetch_page

logger = logging.getLogger(__name__)


def _is_relevant(text: str, keywords: list[str]) -> bool:
    """Return True if text contains at least one keyword (case-insensitive)."""
    if not keywords:
        return True
    lower = text.lower()
    return any(kw.lower() in lower for kw in keywords)


def crawl_source(source: dict) -> list[dict]:
    """
    BFS-crawl one source entry from config/sources.py.

    Returns a list of page result dicts, each with:
      category, label, url, title, text, fetched_at, …
    """
    seed = source["url"]
    label = source["label"]
    keywords = source.get("keywords", [])

    visited: set[str] = set()
    queue: deque[str] = deque([seed])
    results: list[dict] = []

    logger.info("▶ Crawling [%s] %s (max %d pages)", label, seed, MAX_PAGES_PER_DOMAIN)

    while queue and len(results) < MAX_PAGES_PER_DOMAIN:
        url = queue.popleft()
        if url in visited:
            continue
        visited.add(url)

        page = fetch_page(url)
        time.sleep(CRAWL_DELAY)

        if page is None:
            continue
        if len(page["text"]) < MIN_TEXT_LENGTH:
            logger.debug("Too short, skipping: %s", url)
            # still enqueue its links so we don't miss deeper pages
        else:
            if _is_relevant(page["text"], keywords):
                page["category"] = source["category"]
                page["label"] = label
                # don't store the full link list in the DB — wastes space
                del page["links"]
                results.append(page)
                logger.info("  ✓ [%d/%d] %s", len(results), MAX_PAGES_PER_DOMAIN, url)
            else:
                logger.debug("  ✗ no keyword match: %s", url)

        # enqueue discovered links for BFS
        if page and "links" in page:
            for link in page["links"]:
                if link not in visited:
                    queue.append(link)

    logger.info("  → %d pages stored for [%s]", len(results), label)
    return results