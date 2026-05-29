# IITEL Governance Intelligence Platform

A full-stack research and advisory tool for education and workforce leaders navigating policy, regulatory, and governance landscapes. The platform crawls 70+ global governance sources, stores them in a searchable knowledge base, and surfaces insights through an AI-powered chat assistant.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Supabase Setup](#supabase-setup)
- [Installation](#installation)
- [Running the App](#running-the-app)
- [The Crawl Pipeline](#the-crawl-pipeline)
- [Manager Account](#manager-account)
- [API Reference](#api-reference)

---

## Architecture Overview

```
┌─────────────────┐     REST/SSE      ┌──────────────────────────┐
│  React Frontend │ ◄────────────────► │    FastAPI Backend        │
│  (Vite + TS)    │                    │    backend/main.py        │
└─────────────────┘                    └────────────┬─────────────┘
                                                    │
                          ┌─────────────────────────┼──────────────────────┐
                          │                         │                      │
                   ┌──────▼──────┐         ┌────────▼────────┐   ┌────────▼────────┐
                   │  Supabase   │         │  Anthropic API  │   │   OpenAI API    │
                   │  Postgres + │         │  (Claude — chat)│   │  (Embeddings)   │
                   │  pgvector   │         └─────────────────┘   └─────────────────┘
                   └──────▲──────┘
                          │
                   ┌──────┴──────────────────┐
                   │  AI Policy Pipeline      │
                   │  backend/ai-policy-      │
                   │  pipeline/run.py         │
                   └─────────────────────────┘
```

The backend spawns the crawler as a subprocess on demand. Articles and their vector embeddings are stored in Supabase. The chat endpoint retrieves relevant articles via hybrid search (vector similarity + keyword), then passes them as context to Claude.

---

## Features

| Feature | Description |
|---|---|
| **AI Chat** | Ask questions about governance topics; Claude answers using retrieved knowledge base articles |
| **Hybrid Search** | Combines OpenAI vector embeddings (pgvector) with keyword search via Reciprocal Rank Fusion |
| **Articles Browser** | Paginated list of all crawled articles with language detection, previews, and translation |
| **Full-text Search** | Search across article titles and content with snippet highlighting |
| **PDF Upload** | Upload PDF documents to add them directly to the knowledge base |
| **Source Manager** | Add custom URLs, toggle crawler vs. single-page mode, enable/disable sources |
| **Manager Dashboard** | View and delete user accounts; trigger knowledge base refresh |
| **Multi-language Support** | Auto-detects 20+ languages; one-click translation via Google Translate |
| **Conversation History** | Chat history persisted per user session in Supabase |
| **Auth** | JWT-based signup/login with manager and regular user roles |

---

## Tech Stack

### Backend (`backend/`)
| Package | Purpose |
|---|---|
| FastAPI | REST API framework |
| Uvicorn | ASGI server |
| Supabase Python SDK | Database client |
| Anthropic SDK | Claude AI chat |
| OpenAI SDK | Text embeddings |
| pypdf | PDF text extraction |
| langdetect + deep-translator | Language detection and translation |
| python-jose / PyJWT | JWT auth tokens |
| bcrypt | Password hashing |
| python-dotenv | Environment variable loading |

### Pipeline (`backend/ai-policy-pipeline/`)
| Package | Purpose |
|---|---|
| requests | HTTP fetching |
| BeautifulSoup4 + lxml | HTML parsing |
| html2text | HTML → plain text conversion |
| tldextract | Domain parsing for same-domain link filtering |
| tenacity | Retry logic for failed requests |

### Frontend (`frontend/`)
| Package | Purpose |
|---|---|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Tailwind CSS v4 | Styling |
| Radix UI | Accessible component primitives |
| shadcn/ui | Component library built on Radix |
| react-markdown | Render AI responses as Markdown |
| lucide-react | Icons |
| pnpm | Package manager |

---

## Project Structure

```
iitel_scope_data_scraper/
├── backend/
│   ├── main.py               # FastAPI app — all API routes
│   ├── auth.py               # JWT token creation and verification
│   ├── db.py                 # Supabase client (used by main.py and embeddings.py)
│   ├── embeddings.py         # Chunking, embedding, and vector search via OpenAI + pgvector
│   ├── requirements.txt      # Backend Python dependencies
│   ├── .env                  # Environment variables (not committed)
│   └── ai-policy-pipeline/
│       ├── run.py            # Pipeline entry point (crawl all sources)
│       ├── requirements.txt  # Pipeline Python dependencies
│       ├── config/
│       │   ├── settings.py   # Crawl settings (depth, delay, page limits)
│       │   └── sources.py    # All 70+ built-in source definitions + keyword groups
│       ├── pipeline/
│       │   └── crawler.py    # BFS crawler — follows same-domain links up to MAX_DEPTH
│       ├── scrapers/
│       │   └── scraper.py    # HTTP fetch + HTML → text extraction
│       └── database/
│           ├── db.py         # JSON file DB + Supabase upsert
│           └── supabase_client.py  # Supabase client for the pipeline
└── frontend/
    ├── src/
    │   ├── main.tsx          # React entry point
    │   ├── lib/api.ts        # All API calls to the backend
    │   └── app/
    │       ├── contexts/
    │       │   └── AuthContext.tsx   # Auth state + token management
    │       └── components/
    │           ├── ArticlesTab.tsx   # Browse and manage crawled articles
    │           ├── SearchTab.tsx     # Full-text search
    │           ├── ChatbotTab.tsx    # AI chat interface
    │           ├── SourcesTab.tsx    # Source management + PDF upload
    │           ├── ManagerTab.tsx    # User management (manager only)
    │           └── AuthPage.tsx      # Login and signup screens
    ├── package.json
    └── vite.config.ts
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+ and pnpm
- A [Supabase](https://supabase.com) project
- An [Anthropic](https://console.anthropic.com) API key (Claude)
- An [OpenAI](https://platform.openai.com) API key (embeddings — optional but recommended)

---

## Environment Variables

Create `backend/.env` with the following:

```env
# Required
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-or-service-key
ANTHROPIC_API_KEY=sk-ant-...

# Optional — enables vector search and semantic retrieval
# Without this, the app falls back to keyword-only search
OPENAI_API_KEY=sk-proj-...

# Optional — set a strong random string for JWT signing in production
JWT_SECRET_KEY=change-me-in-production

# Pipeline tuning (optional — these are the defaults)
MAX_PAGES_PER_DOMAIN=50
MAX_DEPTH=4
CRAWL_DELAY_SECONDS=2
REQUEST_TIMEOUT_SECONDS=15
MIN_TEXT_LENGTH=200
```

Create `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:8000
```

---

## Supabase Setup

Run the following SQL in the Supabase SQL editor to create the required tables.

### 1. Users

```sql
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  password_hash text not null,
  is_manager boolean not null default false,
  created_at timestamptz default now()
);
```

### 2. Articles

```sql
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text,
  url text,
  source text,
  published_at timestamptz,
  content text,
  created_at timestamptz default now()
);
```

### 3. Article Chunks (for vector search)

```sql
-- Enable pgvector extension first
create extension if not exists vector;

create table public.article_chunks (
  id uuid primary key default gen_random_uuid(),
  article_id uuid references public.articles(id) on delete cascade,
  chunk_index integer,
  content text,
  embedding vector(1536),
  created_at timestamptz default now()
);

-- Vector similarity search function
create or replace function match_article_chunks(
  query_embedding vector(1536),
  match_count int default 10
)
returns table (
  article_id uuid,
  chunk_index integer,
  content text,
  similarity float
)
language sql stable
as $$
  select
    article_id,
    chunk_index,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from public.article_chunks
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

### 4. Custom Sources

```sql
create table public.custom_sources (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  label text not null,
  crawl_mode text not null default 'crawl',
  added_at timestamptz default now()
);
```

### 5. Disabled Sources

```sql
create table public.disabled_sources (
  url text primary key,
  disabled_at timestamptz default now()
);
```

### 6. Chat History

```sql
create table public.chat_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  session_id text,
  role text not null,
  content text not null,
  sources jsonb,
  created_at timestamptz default now()
);
```

---

## Installation

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
pip install -r ai-policy-pipeline/requirements.txt
```

### Frontend

```bash
cd frontend
pnpm install
```

---

## Running the App

### Start the backend

```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

On first startup, the backend will automatically create the manager account in Supabase if it doesn't already exist.

### Start the frontend

```bash
cd frontend
pnpm dev
```

The app will be available at `http://localhost:5173`.

---

## The Crawl Pipeline

The pipeline lives at `backend/ai-policy-pipeline/` and is triggered from the UI (Sources tab → Refresh) or directly via the API (`POST /refresh`).

### How it works

1. Loads built-in sources from `config/sources.py` plus any custom sources from Supabase
2. Skips any URLs in the `disabled_sources` table
3. For each source, runs a BFS crawler up to `MAX_DEPTH` hops from the seed URL, staying on the same domain
4. Filters pages by keyword groups (governance, technology, equity, etc.) — pages must contain at least one keyword to be stored
5. Upserts pages into the `articles` table in Supabase (URL is the unique key)
6. If OpenAI is configured, embeds newly added articles into `article_chunks` for vector search

### Crawl modes

| Mode | Behavior |
|---|---|
| `crawl` | Follows all same-domain links up to `MAX_DEPTH` hops and `MAX_PAGES_PER_DOMAIN` pages |
| `single` | Fetches only the exact seed URL — no link following |

### Source categories

The pipeline covers 70+ sources across these categories:
- **Vendor Policy** — OpenAI, Google, Microsoft, Anthropic, Canvas, Blackboard
- **State AG** — 10 US state attorney general offices
- **Accreditor** — MSCHE, SACSCOC, WSCUC, HLC, NECHE, CHEA
- **Global** — UNESCO, OECD, EU, UK, Canada, Australia, Japan, South Korea, India, Africa, and more

### Running the pipeline manually

```bash
cd backend/ai-policy-pipeline

# Crawl all sources
python run.py

# Crawl only a specific category
python run.py --category "Vendor Policy"

# Crawl specific sources by label
python run.py --labels "OpenAI,Anthropic Legal"

# Dry run — print what would be crawled without fetching
python run.py --dry-run

# Search the local JSON database
python run.py --query "AI governance"
```

---

## Manager Account

The manager account is seeded automatically on first backend startup using the email defined in `backend/main.py`. The password is managed directly in Supabase.

### Update the manager password via Supabase SQL

Run this in the Supabase SQL editor (requires the `pgcrypto` extension):

```sql
-- Enable pgcrypto if not already enabled
create extension if not exists pgcrypto;

-- Update the manager password
update public.users
set password_hash = crypt('YourNewPassword', gen_salt('bf', 12))
where email = 'karla.bailey@iitelsolutions.com';
```

> **Note:** The Python bcrypt library (`$2b$` prefix) is compatible with PostgreSQL's `crypt()` (`$2a$` prefix) for verification purposes.

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/login` | None | Login and receive JWT token |
| `POST` | `/auth/signup` | None | Create new user account |
| `POST` | `/auth/reset-password` | None | Reset non-manager password |
| `GET` | `/auth/users` | Manager | List all user accounts |
| `DELETE` | `/auth/users/{id}` | Manager | Delete a user account |
| `GET` | `/health` | None | Health check |
| `GET` | `/policies` | None | Paginated article list |
| `GET` | `/policies/{id}` | None | Single article detail |
| `DELETE` | `/policies/{id}` | Manager | Remove article from knowledge base |
| `GET` | `/search` | None | Full-text search across articles |
| `POST` | `/chat` | Optional | AI chat (non-streaming) |
| `POST` | `/chat/stream` | Optional | AI chat (Server-Sent Events streaming) |
| `GET` | `/chat/history` | Required | Fetch user's chat history |
| `POST` | `/translate` | None | Translate text to English |
| `POST` | `/refresh` | None | Trigger crawler pipeline |
| `GET` | `/refresh/status` | None | Check crawler status |
| `GET` | `/sources/all` | None | List all sources (built-in + custom) with disabled status |
| `GET` | `/sources` | None | List custom sources only |
| `POST` | `/sources` | None | Add a custom source |
| `DELETE` | `/sources/{id}` | Manager | Remove a custom source |
| `POST` | `/sources/disable` | None | Disable a source URL |
| `POST` | `/sources/enable` | None | Enable a source URL |
| `POST` | `/upload/pdf` | None | Upload and extract a PDF |
| `POST` | `/embed/backfill` | None | Embed all un-embedded articles |
