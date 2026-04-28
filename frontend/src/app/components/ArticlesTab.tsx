import { useEffect, useState } from 'react';
import { FileText, ExternalLink, ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { fetchPolicies, fetchPolicy, type Article, type ArticleDetail } from '@/lib/api';


const PAGE_SIZE = 20;

export function ArticlesTab() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<ArticleDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

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

  const openArticle = async (id: string) => {
    setDetailLoading(true);
    try {
      const detail = await fetchPolicy(id);
      setSelected(detail);
    } catch {
      setError('Failed to load article. Please try again.');
    } finally {
      setDetailLoading(false);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelected(null)}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all policies
        </button>

        <div className="border border-gray-200 rounded-lg p-8 bg-white">
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">{selected.title}</h2>

          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm text-gray-500">
            {selected.source && (
              <span className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                {selected.source}
              </span>
            )}
            {selected.published_at && (
              <span>{new Date(selected.published_at).toLocaleDateString()}</span>
            )}
            {selected.url && (
              <a
                href={selected.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#C9A961] hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                View original source
              </a>
            )}
          </div>

          <div className="
            [&_p]:text-gray-700 [&_p]:leading-relaxed [&_p]:mb-4
            [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-1
            [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4 [&_ol]:space-y-1
            [&_li]:text-gray-700 [&_li]:leading-relaxed
            [&_strong]:font-semibold [&_strong]:text-gray-900
            [&_em]:italic
            [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mt-6 [&_h1]:mb-2
            [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mt-5 [&_h2]:mb-2
            [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mt-4 [&_h3]:mb-1
            [&_a]:text-[#C9A961] [&_a]:underline [&_a]:hover:text-[#B8984F]
            [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-gray-600
            [&_hr]:border-gray-200 [&_hr]:my-4
          ">
            {selected.content ? (
              <ReactMarkdown>{selected.content}</ReactMarkdown>
            ) : (
              <p className="text-gray-400 italic">No content available for this article.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
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

      {detailLoading && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 animate-pulse">
          Loading article…
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
              onClick={() => openArticle(article.id)}
              className="border border-gray-200 rounded-lg p-6 bg-white hover:shadow-md hover:border-[#C9A961]/40 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-[#C9A961]/10 rounded-lg flex-shrink-0">
                  <FileText className="w-5 h-5 text-[#C9A961]" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="font-semibold text-lg text-gray-900 hover:text-[#C9A961] transition-colors">
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
                      <span
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#C9A961] hover:underline truncate max-w-xs block"
                        >
                          {article.url}
                        </a>
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 leading-relaxed">{article.preview}</p>
                  <p className="text-xs text-[#C9A961] mt-2">Click to read full article →</p>
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
