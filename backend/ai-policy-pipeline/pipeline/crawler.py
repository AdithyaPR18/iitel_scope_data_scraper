"""
crawler.py — BFS crawler for a single source.

Starts at source["url"], follows same-domain links up to MAX_PAGES_PER_DOMAIN
pages and MAX_DEPTH hops from the seed URL, optionally filtering by keywords.
"""

import logging
import time
from collections import deque

from config import MAX_PAGES_PER_DOMAIN, MAX_DEPTH, CRAWL_DELAY, MIN_TEXT_LENGTH
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
    # Queue entries are (url, depth)
    queue: deque[tuple[str, int]] = deque([(seed, 0)])
    results: list[dict] = []

    logger.info(
        "▶ Crawling [%s] %s (max %d pages, depth %d)",
        label, seed, MAX_PAGES_PER_DOMAIN, MAX_DEPTH,
    )

    while queue and len(results) < MAX_PAGES_PER_DOMAIN:
        url, depth = queue.popleft()
        if url in visited:
            continue
        visited.add(url)

        page = fetch_page(url)
        time.sleep(CRAWL_DELAY)

        if page is None:
            continue

        # Enqueue child links only if we haven't hit the depth limit
        if depth < MAX_DEPTH:
            for link in page.get("links", []):
                if link not in visited:
                    queue.append((link, depth + 1))
        else:
            logger.debug("  depth limit reached, not following links from: %s", url)

        # Decide whether to store this page
        if len(page["text"]) < MIN_TEXT_LENGTH:
            logger.debug("Too short, skipping: %s", url)
            continue

        if _is_relevant(page["text"], keywords):
            page["category"] = source["category"]
            page["label"] = label
            page["depth"] = depth
            del page["links"]
            results.append(page)
            logger.info("  ✓ [%d/%d] depth=%d %s", len(results), MAX_PAGES_PER_DOMAIN, depth, url)
        else:
            logger.debug("  ✗ no keyword match: %s", url)

    logger.info("  → %d pages stored for [%s]", len(results), label)
    return results
