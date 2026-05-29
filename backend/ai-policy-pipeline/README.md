# AI Policy Pipeline

Web crawler that monitors AI policy sources relevant to higher education — vendor policies, state AGs, regional accreditors, and global regulators — and stores them in a structured JSON database.

---

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env   # tweak settings if needed
```

---

## Usage

```bash
# Crawl everything (60+ sources — takes ~30–60 min)
python run.py

# Crawl just vendor policies
python run.py --category "Vendor Policy"

# Crawl specific sources by label
python run.py --labels "OpenAI,Anthropic Legal,EDPB"

# Preview what would be crawled without fetching
python run.py --dry-run

# Search the local DB for a keyword
python run.py --query "student data privacy"
```

---

## Output

Results are written to `./data/policy_db.json`:

```json
{
  "meta": {
    "last_updated": "2026-03-23T...",
    "total_pages": 412,
    "sources_crawled": 58
  },
  "pages": [
    {
      "category": "Vendor Policy",
      "label": "OpenAI",
      "url": "https://openai.com/policies/usage-policies",
      "title": "Usage policies | OpenAI",
      "text": "...",
      "fetched_at": "2026-03-23T14:02:11+00:00"
    }
  ]
}
```

---

## Project Structure

```
ai-policy-pipeline/
├── config/
│   ├── sources.py      ← all seed URLs + keyword filters
│   └── settings.py     ← env-driven config (delays, limits, etc.)
├── scrapers/
│   └── scraper.py      ← HTTP fetch + HTML → clean text
├── pipeline/
│   └── crawler.py      ← BFS crawler, per-source logic
├── database/
│   └── db.py           ← JSON read/write/upsert
├── data/
│   └── policy_db.json  ← output (git-ignored)
├── run.py              ← main entrypoint
├── requirements.txt
└── .env.example
```

---

## Adding New Sources

Edit `config/sources.py` and add an entry:

```python
{
    "category": "State AG",
    "label": "Florida AG",
    "url": "https://www.myfloridalegal.com/",
    "keywords": ["ai", "artificial intelligence", "privacy", "education"],
},
```

---

## Tips

- Set `MAX_PAGES_PER_DOMAIN=5` in `.env` for quick test runs
- `crawl.log` captures everything for debugging
- Re-running upserts by URL — existing pages are updated, not duplicated
- State AG and accreditor pages often require keywords to filter noise — tune `sources.py` per source