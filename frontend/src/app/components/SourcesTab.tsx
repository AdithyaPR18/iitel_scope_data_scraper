import { useEffect, useState, useMemo } from 'react';
import { Plus, Trash2, Link, AlertCircle, CheckCircle, Search, EyeOff, Eye } from 'lucide-react';
import {
  fetchAllSources, addSource, deleteSource, disableSource, enableSource,
  type SourceEntry,
} from '@/lib/api';

const CATEGORY_COLORS: Record<string, string> = {
  Custom: 'bg-purple-50 text-purple-700',
  'Federal Agencies': 'bg-blue-50 text-blue-700',
  'State Education': 'bg-green-50 text-green-700',
  'Vendor Policy': 'bg-orange-50 text-orange-700',
  'Accreditation': 'bg-yellow-50 text-yellow-700',
  'Workforce Development': 'bg-teal-50 text-teal-700',
  'Civil Rights / Equity': 'bg-red-50 text-red-700',
  'International': 'bg-indigo-50 text-indigo-700',
};

function categoryBadge(category: string) {
  const cls = CATEGORY_COLORS[category] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${cls}`}>
      {category}
    </span>
  );
}

export function SourcesTab() {
  const [sources, setSources] = useState<SourceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'builtin' | 'custom'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enabled' | 'disabled'>('all');

  const [url, setUrl] = useState('');
  const [label, setLabel] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const [pendingUrl, setPendingUrl] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetchAllSources()
      .then((res) => setSources(res.data))
      .catch(() => setError('Failed to load sources. Is the backend running?'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    setAdding(true);
    setAddError(null);
    setAddedId(null);
    try {
      await addSource(url.trim(), label.trim());
      setUrl('');
      setLabel('');
      // Reload full list so new entry appears
      const res = await fetchAllSources();
      setSources(res.data);
      const added = res.data.find((s) => s.source_type === 'custom' && s.url.includes(url.trim().replace(/^https?:\/\//, '')));
      setAddedId(added?.id ?? 'new');
      setTimeout(() => setAddedId(null), 3000);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add source');
    } finally {
      setAdding(false);
    }
  };

  const handleToggle = async (source: SourceEntry) => {
    setPendingUrl(source.url);
    try {
      if (source.disabled) {
        await enableSource(source.url);
      } else {
        await disableSource(source.url);
      }
      setSources((prev) =>
        prev.map((s) => s.url === source.url ? { ...s, disabled: !s.disabled } : s)
      );
    } catch {
      setError('Failed to update source status. Please try again.');
    } finally {
      setPendingUrl(null);
    }
  };

  const handleDelete = async (source: SourceEntry) => {
    if (!source.id) return;
    setPendingUrl(source.url);
    try {
      await deleteSource(source.id);
      setSources((prev) => prev.filter((s) => s.url !== source.url));
    } catch {
      setError('Failed to remove source. Please try again.');
    } finally {
      setPendingUrl(null);
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return sources.filter((s) => {
      if (filterType !== 'all' && s.source_type !== filterType) return false;
      if (filterStatus === 'enabled' && s.disabled) return false;
      if (filterStatus === 'disabled' && !s.disabled) return false;
      if (q && !s.label.toLowerCase().includes(q) && !s.url.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [sources, search, filterType, filterStatus]);

  const enabledCount = sources.filter((s) => !s.disabled).length;
  const disabledCount = sources.filter((s) => s.disabled).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-1">Source Manager</h2>
        <p className="text-sm text-gray-500">
          Add new crawl targets or disable existing ones. Disabled sources are skipped on every
          future crawl run. Custom sources crawl all content; built-in sources use keyword filters.
        </p>
      </div>

      {/* Stats row */}
      {!loading && (
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600">{sources.length} total</span>
          <span className="text-green-600">{enabledCount} enabled</span>
          {disabledCount > 0 && <span className="text-gray-400">{disabledCount} disabled</span>}
        </div>
      )}

      {/* Add form */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">Add a new source</h3>
        <form onSubmit={handleAdd} className="space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600 mb-1">URL *</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.gov/ai-policy"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40 focus:border-[#C9A961]"
                disabled={adding}
              />
            </div>
            <div className="w-56">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Label <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g. EU AI Office"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40 focus:border-[#C9A961]"
                disabled={adding}
              />
            </div>
          </div>

          {addError && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {addError}
            </div>
          )}
          {addedId && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              Source added — it will be included in the next crawl run.
            </div>
          )}

          <button
            type="submit"
            disabled={adding || !url.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-[#C9A961] text-white rounded-lg text-sm font-medium hover:bg-[#B8984F] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
            {adding ? 'Adding…' : 'Add source'}
          </button>
        </form>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sources…"
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A961]/40 focus:border-[#C9A961]"
          />
        </div>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {(['all', 'builtin', 'custom'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-2 capitalize transition-colors ${
                filterType === t ? 'bg-[#C9A961] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {t === 'all' ? 'All types' : t === 'builtin' ? 'Built-in' : 'Custom'}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
          {(['all', 'enabled', 'disabled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 capitalize transition-colors ${
                filterStatus === s ? 'bg-[#C9A961] text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {s === 'all' ? 'All status' : s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Source list */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="border border-dashed border-gray-300 rounded-lg p-10 text-center text-gray-400 text-sm">
          {sources.length === 0 ? 'No sources yet — add one above.' : 'No sources match your filters.'}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((source) => {
            const isPending = pendingUrl === source.url;
            return (
              <div
                key={source.url}
                className={`flex items-center gap-4 border rounded-lg px-5 py-3.5 bg-white transition-opacity ${
                  source.disabled ? 'opacity-50' : ''
                } ${source.id === addedId ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}
              >
                <div className="p-2 bg-[#C9A961]/10 rounded-lg flex-shrink-0">
                  <Link className="w-4 h-4 text-[#C9A961]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-gray-900 text-sm truncate">{source.label}</p>
                    {categoryBadge(source.category)}
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#C9A961] hover:underline truncate block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {source.url}
                  </a>
                </div>

                {source.disabled && (
                  <span className="text-xs text-gray-400 whitespace-nowrap">Disabled</span>
                )}

                {/* Disable / enable toggle */}
                <button
                  onClick={() => handleToggle(source)}
                  disabled={isPending}
                  title={source.disabled ? 'Enable source' : 'Disable source'}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs border transition-colors disabled:opacity-40 ${
                    source.disabled
                      ? 'border-green-300 text-green-600 hover:bg-green-50'
                      : 'border-gray-300 text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  }`}
                >
                  {source.disabled ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {isPending ? '…' : source.disabled ? 'Enable' : 'Disable'}
                </button>

                {/* Delete (custom sources only) */}
                {source.source_type === 'custom' && (
                  <button
                    onClick={() => handleDelete(source)}
                    disabled={isPending}
                    title="Remove source permanently"
                    className="p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-40 transition-colors rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
