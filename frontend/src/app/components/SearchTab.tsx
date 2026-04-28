import { useState } from 'react';
import { Search, FileText, ExternalLink } from 'lucide-react';
import { searchPolicies, type SearchResult } from '@/lib/api';

type FilterType = 'all' | 'title' | 'content';

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 text-gray-900 rounded-sm px-0.5 not-italic">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export function SearchTab() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    setLastQuery(query.trim());
    try {
      const res = await searchPolicies(query.trim(), filter);
      setResults(res.data);
      setTotal(res.total);
    } catch {
      setError('Search failed. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl mb-4">Search Policy Database</h2>

        {/* Search Input + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search by keywords, source, or topic..."
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A961] text-base"
            />
          </div>

          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as FilterType)}
            className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A961] text-sm bg-white"
          >
            <option value="all">All fields</option>
            <option value="title">Title only</option>
            <option value="content">Content only</option>
          </select>

          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="px-6 py-3 bg-[#C9A961] text-white rounded-lg hover:bg-[#B8984F] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {/* Results count */}
        {searched && !loading && (
          <div className="mt-3 text-sm text-gray-600">
            {error ? null : (
              <span>
                Found <strong>{total}</strong> {total === 1 ? 'article' : 'articles'} matching "
                {lastQuery}"
              </span>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="space-y-3">
        {!searched && !loading && (
          <div className="text-center py-12 text-gray-400">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p>Enter a keyword to search the policy database.</p>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="text-center py-12 text-gray-500">
            <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No articles found matching your search.</p>
            <p className="text-sm mt-1">Try different keywords or change the filter.</p>
          </div>
        )}

        {!loading &&
          results.map((result) => (
            <div
              key={result.id}
              className="border border-gray-200 rounded-lg p-5 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-[#C9A961]/10 rounded-lg flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#C9A961]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {highlight(result.title, lastQuery)}
                    </h3>
                    {result.published_at && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(result.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-3 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <ExternalLink className="w-4 h-4" />
                      <span>{result.source}</span>
                    </div>
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#C9A961] hover:underline truncate max-w-xs"
                      >
                        {result.url}
                      </a>
                    )}
                  </div>

                  <p className="text-gray-700 leading-relaxed text-sm">
                    {highlight(result.snippet, lastQuery)}
                  </p>
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
