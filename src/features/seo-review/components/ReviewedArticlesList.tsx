import { useEffect, useState } from "react";
import { fetchReviewedArticles } from "../api/reviewApi";
import type { ReviewedArticleItem } from "../model/types";

type ReviewedArticlesListProps = {
  onOpenArticleHistory: (articleId: number) => void;
};

export function ReviewedArticlesList({ onOpenArticleHistory }: ReviewedArticlesListProps) {
  const [items, setItems] = useState<ReviewedArticleItem[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void fetchReviewedArticles(page, pageSize)
      .then((data) => {
        if (!active) {
          return;
        }
        setItems(data.items);
        setTotalPages(Math.max(1, data.pagination.totalPages));
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load reviewed articles.");
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [page, pageSize]);

  return (
    <section className="panel panel--highlight">
      <div className="panel__header">
        <div>
          <p className="eyebrow">Lich su review / Review history</p>
          <h2>Danh sach bai da review / Reviewed articles</h2>
        </div>
      </div>

      {loading ? <p className="panel__empty">Dang tai du lieu... / Loading data...</p> : null}
      {error ? <p className="panel__error">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <p className="panel__empty">Chua co bai da review / No reviewed articles yet.</p>
      ) : null}

      <div className="history-list">
        {items.map((item) => (
          <article key={item.article_id} className="history-card">
            <div>
              <h3>{item.title}</h3>
              <p className="history-meta">
                Slug: <strong>{item.slug}</strong>
              </p>
              <p className="history-meta">
                Tu khoa chinh / Primary keyword: <strong>{item.primary_keyword ?? "-"}</strong>
              </p>
              <p className="history-meta">
                Tong so lan review / Total reviews: <strong>{item.total_reviews}</strong>
              </p>
            </div>
            <div className="history-score-grid">
              <span>Overall: {item.latest_overall_score ?? "-"}</span>
              <span>SEO: {item.latest_seo_score ?? "-"}</span>
              <span>Readability: {item.latest_readability_score ?? "-"}</span>
              <span>Advanced: {item.latest_advanced_score ?? "-"}</span>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => onOpenArticleHistory(item.article_id)}
            >
              Xem lich su / View history
            </button>
          </article>
        ))}
      </div>

      <div className="history-pagination">
        <button
          type="button"
          className="ghost-button"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1 || loading}
        >
          Truoc / Prev
        </button>
        <span>
          Trang / Page {page}/{totalPages}
        </span>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages || loading}
        >
          Sau / Next
        </button>
      </div>
    </section>
  );
}
