"""
scraper.py — fetches a single URL and returns clean text + metadata.

Uses:
  - requests  for HTTP
  - BeautifulSoup + lxml  for HTML parsing
  - html2text  for readable plain-text extraction
  - tenacity  for retry logic
"""

import logging
import time
import re
from datetime import datetime, timezone
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
import html2text

from config import REQUEST_TIMEOUT, MAX_RETRIES

logger = logging.getLogger(__name__)

# ── HTTP session (shared across calls) ──────────────────────────────────────
_SESSION = requests.Session()
_SESSION.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (compatible; PolicyCrawler/1.0; "
        "+https://github.com/your-org/iitel-scope-data-scraper)"
    ),
    "Accept-Language": "en-US,en;q=0.9",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
})

# ── html2text converter ──────────────────────────────────────────────────────
_H2T = html2text.HTML2Text()
_H2T.ignore_links = True
_H2T.ignore_images = True
_H2T.ignore_emphasis = False
_H2T.body_width = 0       # no line-wrapping


# ── helpers ──────────────────────────────────────────────────────────────────

def _same_domain(base_url: str, candidate_url: str) -> bool:
    """True if candidate is on the same registered domain as base."""
    base_host = urlparse(base_url).netloc.lstrip("www.")
    cand_host = urlparse(candidate_url).netloc.lstrip("www.")
    return cand_host == base_host or cand_host.endswith("." + base_host)


def _clean_text(raw: str) -> str:
    """Collapse whitespace and strip nav/boilerplate noise."""
    text = re.sub(r"\n{3,}", "\n\n", raw)   # max 2 blank lines
    text = re.sub(r" {2,}", " ", text)       # collapse spaces
    return text.strip()


def _extract_links(soup: BeautifulSoup, base_url: str) -> list[str]:
    """Return all absolute same-domain hrefs from a parsed page."""
    links = []
    for tag in soup.find_all("a", href=True):
        href = tag["href"].strip()
        if href.startswith("#") or href.startswith("mailto:"):
            continue
        abs_url = urljoin(base_url, href)
        parsed = urlparse(abs_url)
        if parsed.scheme not in ("http", "https"):
            continue
        # drop query strings and fragments for dedup
        clean = parsed._replace(query="", fragment="").geturl()
        if _same_domain(base_url, clean):
            links.append(clean)
    return list(dict.fromkeys(links))   # deduplicate, preserve order


# ── core fetch ───────────────────────────────────────────────────────────────

@retry(
    stop=stop_after_attempt(MAX_RETRIES),
    wait=wait_exponential(multiplier=1, min=2, max=10),
    retry=retry_if_exception_type((requests.ConnectionError, requests.Timeout)),
    reraise=True,
)
def _fetch_raw(url: str) -> requests.Response:
    return _SESSION.get(url, timeout=REQUEST_TIMEOUT, allow_redirects=True)


def fetch_page(url: str) -> dict | None:
    """
    Fetch one URL and return a structured dict:
      {
        url, title, text, links, status_code,
        fetched_at (ISO-8601 UTC), content_type
      }
    Returns None on non-HTML or error responses.
    """
    try:
        resp = _fetch_raw(url)
    except Exception as exc:
        logger.warning("Failed to fetch %s: %s", url, exc)
        return None

    content_type = resp.headers.get("Content-Type", "")
    if resp.status_code != 200:
        logger.debug("Non-200 %s → %s", resp.status_code, url)
        return None
    if "text/html" not in content_type:
        logger.debug("Skipping non-HTML content at %s", url)
        return None

    soup = BeautifulSoup(resp.text, "lxml")

    # Remove nav / footer / script / style noise
    for tag in soup(["nav", "footer", "script", "style", "noscript",
                     "header", "aside", "form", "iframe"]):
        tag.decompose()

    title = (soup.title.string or "").strip() if soup.title else ""
    raw_text = _H2T.handle(str(soup))
    clean = _clean_text(raw_text)
    links = _extract_links(soup, url)

    return {
        "url": url,
        "title": title,
        "text": clean,
        "links": links,
        "status_code": resp.status_code,
        "content_type": content_type,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }