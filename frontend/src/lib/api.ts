const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// Module-level auth token — set by AuthContext after login
let _authToken: string | null = null;

export function setAuthToken(token: string | null) {
  _authToken = token;
}

function authHeaders(): Record<string, string> {
  return _authToken ? { Authorization: `Bearer ${_authToken}` } : {};
}

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
  published_at?: string | null;
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
  crawl_mode: 'crawl' | 'single';
  added_at: string;
}

export interface SourceEntry {
  id: string | null;
  url: string;
  label: string;
  category: string;
  source_type: 'builtin' | 'custom';
  crawl_mode: 'crawl' | 'single';
  added_at: string | null;
}

export async function fetchAllSources(): Promise<{ data: SourceEntry[] }> {
  const res = await fetch(`${API_BASE}/sources/all`);
  if (!res.ok) throw new Error('Failed to fetch sources');
  return res.json();
}

export async function addSource(url: string, label: string, crawlMode: 'crawl' | 'single' = 'crawl'): Promise<CustomSource> {
  const res = await fetch(`${API_BASE}/sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, label, crawl_mode: crawlMode }),
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

export async function removeSource(url: string): Promise<void> {
  const res = await fetch(`${API_BASE}/sources/remove`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error('Failed to remove source');
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

export interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askChat(
  question: string,
  sessionId?: string,
  history: HistoryMessage[] = [],
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ question, session_id: sessionId, history }),
  });
  if (!res.ok) throw new Error('Failed to get chat response');
  return res.json();
}

export async function streamChat(
  question: string,
  onDelta: (text: string) => void,
  sessionId?: string,
  history: HistoryMessage[] = [],
): Promise<{ sources: ChatSource[] }> {
  const res = await fetch(`${API_BASE}/chat/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ question, session_id: sessionId, history }),
  });
  if (!res.ok) throw new Error('Failed to start chat stream');

  const reader = res.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let sources: ChatSource[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n\n');
    buffer = parts.pop() ?? '';

    for (const part of parts) {
      if (!part.startsWith('data: ')) continue;
      const event = JSON.parse(part.slice(6)) as {
        type: 'delta' | 'done' | 'error';
        text?: string;
        sources?: ChatSource[];
        message?: string;
      };
      if (event.type === 'delta' && event.text) {
        onDelta(event.text);
      } else if (event.type === 'done' && event.sources) {
        sources = event.sources;
      } else if (event.type === 'error') {
        throw new Error(event.message ?? 'Stream error');
      }
    }
  }

  return { sources };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  is_manager: boolean;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? 'Login failed');
  }
  return res.json();
}

export async function signup(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? 'Signup failed');
  }
  return res.json();
}

export interface AppUser {
  id: string;
  email: string;
  is_manager: boolean;
  created_at: string;
}

export async function resetPassword(email: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, new_password: newPassword }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? 'Reset failed');
  }
}

export async function deleteArticle(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/policies/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete article');
}

export async function fetchUsers(): Promise<{ data: AppUser[] }> {
  const res = await fetch(`${API_BASE}/auth/users`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch users');
  return res.json();
}

export async function deleteUser(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/users/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error('Failed to delete user');
}

// ── Chat history ──────────────────────────────────────────────────────────────

export interface ChatHistoryMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources: ChatSource[] | null;
  created_at: string;
}

export async function fetchChatHistory(): Promise<{ data: ChatHistoryMessage[] }> {
  const res = await fetch(`${API_BASE}/chat/history`, { headers: authHeaders() });
  if (!res.ok) throw new Error('Failed to fetch chat history');
  return res.json();
}
