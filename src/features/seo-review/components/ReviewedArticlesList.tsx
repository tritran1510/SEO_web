import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchReviewedArticles } from "../api/reviewApi";
import type { ReviewedArticleItem } from "../model/types";

type ReviewedArticlesListProps = {
  onOpenArticleHistory: (articleId: number) => void;
};

export function ReviewedArticlesList({ onOpenArticleHistory }: ReviewedArticlesListProps) {
  const { t } = useTranslation();
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
        setError(err instanceof Error ? err.message : t("seoReview.errors.reviewedArticlesLoadFailed"));
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
          <p className="eyebrow">{t("seoReview.reviewedArticles.eyebrow")}</p>
          <h2>{t("seoReview.reviewedArticles.title")}</h2>
        </div>
      </div>

      {loading ? <p className="panel__empty">{t("seoReview.reviewedArticles.loadingData")}</p> : null}
      {error ? <p className="panel__error">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <p className="panel__empty">{t("seoReview.reviewedArticles.emptyState")}</p>
      ) : null}

      <div className="history-list">
        {items.map((item) => (
          <article key={item.article_id} className="history-card">
            <div>
              <h3>{item.title}</h3>
              <p className="history-meta">
                {t("seoReview.reviewedArticles.slug")}: <strong>{item.slug}</strong>
              </p>
              <p className="history-meta">
                {t("seoReview.reviewedArticles.primaryKeyword")}: <strong>{item.primary_keyword ?? "-"}</strong>
              </p>
              <p className="history-meta">
                {t("seoReview.reviewedArticles.totalReviews")}: <strong>{item.total_reviews}</strong>
              </p>
            </div>
            <div className="history-score-grid">
              <span>{t("seoReview.reviewedArticles.overallScore")}: {item.latest_overall_score ?? "-"}</span>
              <span>{t("seoReview.reviewedArticles.seoScore")}: {item.latest_seo_score ?? "-"}</span>
              <span>{t("seoReview.reviewedArticles.readabilityScore")}: {item.latest_readability_score ?? "-"}</span>
              <span>{t("seoReview.reviewedArticles.advancedScore")}: {item.latest_advanced_score ?? "-"}</span>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={() => onOpenArticleHistory(item.article_id)}
            >
              {t("seoReview.reviewedArticles.viewHistory")}
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
          {t("seoReview.reviewedArticles.previous")}
        </button>
        <span>
          {t("seoReview.reviewedArticles.page", { current: page, total: totalPages })}
        </span>
        <button
          type="button"
          className="ghost-button"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages || loading}
        >
          {t("seoReview.reviewedArticles.next")}
        </button>
      </div>
    </section>
  );
}
