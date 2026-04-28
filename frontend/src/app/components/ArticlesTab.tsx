import { useEffect, useState } from 'react';
import { FileText, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchPolicies, type Article } from '@/lib/api';

const PAGE_SIZE = 20;

export function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPolicies(page, PAGE_SIZE)
      .then((res) => {
        setArticles(res.data);
        setTotal(res.total);
      })
      .catch(() => setError('Failed to load policies. Is the backend running?'))
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl">Policy Updates</h2>
        <div className="text-sm text-gray-500">
          {loading ? 'Loading…' : `${total} articles`}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-[#C9A961]/10 rounded-lg">
                  <FileText className="w-5 h-5 text-[#C9A961]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {article.title}
                    </h3>
                    {article.published_at && (
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(article.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <ExternalLink className="w-4 h-4" />
                      <span>{article.source}</span>
                    </div>
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#C9A961] hover:underline truncate max-w-xs"
                      >
                        {article.url}
                      </a>
                    )}
                  </div>

                  <p className="text-gray-700 leading-relaxed">{article.preview}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-1 px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
