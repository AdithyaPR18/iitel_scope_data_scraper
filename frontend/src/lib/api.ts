const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

export interface Article {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  language: string;
  preview: string;
}

export interface PoliciesResponse {
  data: Article[];
  total: number;
  page: number;
  limit: number;
}

export interface SearchResult {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  snippet: string;
}

export interface SearchResponse {
  data: SearchResult[];
  total: number;
  query: string;
  filter: string;
}

export interface ChatSource {
  title: string;
  url: string | null;
  source: string | null;
}

export interface ChatResponse {
  answer: string;
  sources: ChatSource[];
}

export interface ArticleDetail {
  id: string;
  title: string;
  url: string | null;
  source: string | null;
  published_at: string | null;
  language: string;
  content: string | null;
  garbled: boolean;
}

export async function fetchPolicy(id: string): Promise<ArticleDetail> {
  const res = await fetch(`${API_BASE}/policies/${id}`);
  if (!res.ok) throw new Error('Failed to fetch policy');
  return res.json();
}

export async function fetchPolicies(page = 1, limit = 20): Promise<PoliciesResponse> {
  const res = await fetch(`${API_BASE}/policies?page=${page}&limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch policies');
  return res.json();
}

export async function searchPolicies(
  q: string,
  filter: 'all' | 'title' | 'content' = 'all',
  limit = 20,
): Promise<SearchResponse> {
  const params = new URLSearchParams({ q, filter, limit: String(limit) });
  const res = await fetch(`${API_BASE}/search?${params}`);
  if (!res.ok) throw new Error('Failed to search policies');
  return res.json();
}

export async function translateText(text: string): Promise<{ translated: string; error?: string }> {
  const res = await fetch(`${API_BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('Translation request failed');
  return res.json();
}

export async function askChat(question: string): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error('Failed to get chat response');
  return res.json();
}
