import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchReviewHistory } from "../api/reviewApi";
import type { ReviewHistoryItem, ReviewHistoryResponse } from "../model/types";

type ReviewHistoryProps = {
  articleId: number;
  onBackToList: () => void;
  onOpenReviewDetail: (history: ReviewHistoryResponse, review: ReviewHistoryItem) => void;
};

export function ReviewHistory({ articleId, onBackToList, onOpenReviewDetail }: ReviewHistoryProps) {
  const { t } = useTranslation();
  const [data, setData] = useState<ReviewHistoryResponse | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void fetchReviewHistory(articleId, page, pageSize)
      .then((result) => {
        if (active) {
          setData(result);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : t("seoReview.errors.reviewHistoryLoadFailed"));
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [articleId, page, pageSize]);

  return (
    <section className="panel panel--highlight">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t("seoReview.history.articleTimelineEyebrow")}</p>
          <h2>{t("seoReview.history.reviewHistoryTitle")}</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onBackToList}>
          {t("seoReview.history.backToList")}
        </button>
      </div>

      {loading ? <p className="panel__empty">{t("seoReview.history.loadingData")}</p> : null}
      {error ? <p className="panel__error">{error}</p> : null}

      {data ? (
        <>
          <article className="history-card">
            <h3>{data.article.title}</h3>
            <p className="history-meta">Slug: {data.article.slug}</p>
            <p className="history-meta">URL: {data.article.permanent_link}</p>
            <p className="history-meta">
              {t("seoReview.history.totalReviews")}: <strong>{data.summary.total_reviews}</strong>
            </p>
          </article>

          <div className="history-list">
            {data.reviews.map((review) => (
              <article key={review.review_id} className="history-card">
                <h3>Review #{review.review_id}</h3>
                <p className="history-meta">
                  {t("seoReview.history.reviewAtTime")}: {new Date(review.created_at).toLocaleString()}
                </p>
                <div className="history-score-grid">
                  <span>Overall: {review.overall_score ?? "-"}</span>
                  <span>SEO: {review.seo_score ?? "-"}</span>
                  <span>Readability: {review.readability_score ?? "-"}</span>
                  <span>Advanced: {review.advanced_score ?? "-"}</span>
                </div>
                <button
                  type="button"
                  className="primary-button"
                  onClick={() => onOpenReviewDetail(data, review)}
                >
                  {t("seoReview.history.viewDetail")}
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
              {t("seoReview.history.previous")}
            </button>
            <span>
              {t("seoReview.history.page", {
                current: page,
                total: Math.max(1, data.pagination.totalPages),
              })}
            </span>
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                setPage((current) => Math.min(Math.max(1, data.pagination.totalPages), current + 1))
              }
              disabled={page >= Math.max(1, data.pagination.totalPages) || loading}
            >
              {t("seoReview.history.next")}
            </button>
          </div>
        </>
      ) : null}
    </section>
  );
}

type ReviewDetailProps = {
  history: ReviewHistoryResponse;
  review: ReviewHistoryItem;
  onBack: () => void;
};

export function ReviewDetail({ history, review, onBack }: ReviewDetailProps) {
  const { t } = useTranslation();

  return (
    <section className="panel panel--highlight">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{t("seoReview.history.reviewSnapshotEyebrow")}</p>
          <h2>{history.article.title}</h2>
        </div>
        <button type="button" className="ghost-button" onClick={onBack}>
          {t("seoReview.history.backToHistory")}
        </button>
      </div>

      <article className="history-card">
        <h3>Review #{review.review_id}</h3>
        <p className="history-meta">
          {t("seoReview.history.reviewAtTime")}: {new Date(review.created_at).toLocaleString()}
        </p>
        <p className="history-meta">
          {t("seoReview.history.status")}: {review.status ?? "-"}
        </p>
        <div className="history-score-grid">
          <span>Overall: {review.overall_score ?? "-"}</span>
          <span>SEO: {review.seo_score ?? "-"}</span>
          <span>Readability: {review.readability_score ?? "-"}</span>
          <span>Advanced: {review.advanced_score ?? "-"}</span>
        </div>
        <p className="history-meta">
          {t("seoReview.history.notes")}: {review.notes || "-"}
        </p>
      </article>
    </section>
  );
}
