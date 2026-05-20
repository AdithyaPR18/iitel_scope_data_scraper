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

export interface RefreshStatus {
  status: 'idle' | 'running' | 'started' | 'already_running';
  running: boolean;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
}

export async function triggerRefresh(): Promise<RefreshStatus> {
  const res = await fetch(`${API_BASE}/refresh`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to trigger refresh');
  return res.json();
}

export async function getRefreshStatus(): Promise<RefreshStatus> {
  const res = await fetch(`${API_BASE}/refresh/status`);
  if (!res.ok) throw new Error('Failed to get refresh status');
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

export interface CustomSource {
  id: string;
  url: string;
  label: string;
  added_at: string;
}

export interface SourceEntry {
  id: string | null;
  url: string;
  label: string;
  category: string;
  source_type: 'builtin' | 'custom';
  disabled: boolean;
  added_at: string | null;
}

export async function fetchAllSources(): Promise<{ data: SourceEntry[] }> {
  const res = await fetch(`${API_BASE}/sources/all`);
  if (!res.ok) throw new Error('Failed to fetch sources');
  return res.json();
}

export async function addSource(url: string, label: string): Promise<CustomSource> {
  const res = await fetch(`${API_BASE}/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, label }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? 'Failed to add source');
  }
  return res.json();
}

export async function deleteSource(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sources/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete source');
}

export async function disableSource(url: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sources/disable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error('Failed to disable source');
}

export async function enableSource(url: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sources/enable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error('Failed to enable source');
}

export interface PdfUploadResult {
  id: string;
  title: string;
  pages: number;
  chars: number;
}

export async function uploadPdf(file: File): Promise<PdfUploadResult> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API_BASE}/upload/pdf`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? 'Upload failed');
  }
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
