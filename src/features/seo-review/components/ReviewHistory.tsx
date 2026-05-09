import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchReviewHistory } from "../api/reviewApi";
import type { ReviewHistoryItem, ReviewHistoryResponse } from "../model/types";

type ReviewHistoryProps = {
  articleId: number;
  onBackToList: () => void;
  onOpenReviewDetail: (history: ReviewHistoryResponse, review: ReviewHistoryItem) => void;
};

function formatDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString() : "-";
}

function pickString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return "";
}

function pickStringArray(source: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = source[key];

    if (Array.isArray(value)) {
      return value
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

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
            <p className="history-meta">
              {t("seoReview.history.slug")}: {data.article.slug}
            </p>
            <p className="history-meta">
              {t("seoReview.history.url")}: {data.article.permanent_link}
            </p>
            <p className="history-meta">
              {t("seoReview.history.totalReviews")}: <strong>{data.summary.total_reviews}</strong>
            </p>
          </article>

          <div className="history-list">
            {data.reviews.map((review) => (
              <article key={review.review_id} className="history-card">
                <h3>Review #{review.review_id}</h3>
                <p className="history-meta">
                  {t("seoReview.history.reviewAtTime")}: {formatDateTime(review.created_at)}
                </p>
                <div className="history-score-grid">
                  <span>
                    {t("seoReview.history.overallScore")}: {review.overall_score ?? "-"}
                  </span>
                  <span>
                    {t("seoReview.history.seoScore")}: {review.seo_score ?? "-"}
                  </span>
                  <span>
                    {t("seoReview.history.readabilityScore")}: {review.readability_score ?? "-"}
                  </span>
                  <span>
                    {t("seoReview.history.advancedScore")}: {review.advanced_score ?? "-"}
                  </span>
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
  const reviewRecord = review as Record<string, unknown>;

  const seoTitle = pickString(reviewRecord, ["seo_title", "seoTitle"]);
  const metaDescription = pickString(reviewRecord, ["meta_description", "metaDescription"]);
  const primaryKeyword = pickString(reviewRecord, ["primary_keyword", "primaryKeyword"]);
  const secondaryKeywords = pickStringArray(reviewRecord, ["secondary_keywords", "secondaryKeywords"]);
  const synonyms = pickStringArray(reviewRecord, ["synonyms"]);
  const summary = pickString(reviewRecord, ["summary"]);
  const detailedInformation = pickString(reviewRecord, ["detailed_information", "detailedInformation"]);
  const articleContent = pickString(reviewRecord, ["article_content", "articleContent"]);

  const recommendations = pickStringArray(reviewRecord, [
    "improvement_recommendations",
    "improvementRecommendations",
  ]);
  const checklist = (Array.isArray(reviewRecord.checklist_results)
    ? reviewRecord.checklist_results
    : Array.isArray(reviewRecord.checklistResults)
      ? reviewRecord.checklistResults
      : []) as Array<Record<string, unknown>>;

  const hasExtraDetails =
    Boolean(seoTitle) ||
    Boolean(metaDescription) ||
    Boolean(primaryKeyword) ||
    secondaryKeywords.length > 0 ||
    synonyms.length > 0 ||
    Boolean(summary) ||
    Boolean(detailedInformation) ||
    Boolean(articleContent) ||
    recommendations.length > 0 ||
    checklist.length > 0;

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

      <div className="history-detail-layout">
        <article className="history-card">
          <h3>{t("seoReview.history.articleDetailsTitle")}</h3>
          <div className="history-detail-grid">
            <p className="history-meta">
              <strong>{t("seoReview.history.slug")}:</strong> {history.article.slug}
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.status")}:</strong> {history.article.status || "-"}
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.url")}:</strong>{" "}
              <a
                href={history.article.permanent_link}
                target="_blank"
                rel="noreferrer"
                className="history-link"
              >
                {history.article.permanent_link}
              </a>
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.createdAt")}:</strong> {formatDateTime(history.article.created_at)}
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.updatedAt")}:</strong> {formatDateTime(history.article.updated_at)}
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.publishedAt")}:</strong>{" "}
              {formatDateTime(history.article.published_at)}
            </p>
          </div>
        </article>

        <article className="history-card">
          <h3>{t("seoReview.history.reviewSummaryTitle")}</h3>
          <div className="history-detail-grid">
            <p className="history-meta">
              <strong>{t("seoReview.history.totalReviews")}:</strong> {history.summary.total_reviews}
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.bestScore")}:</strong> {history.summary.best_score ?? "-"}
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.averageScore")}:</strong> {history.summary.avg_score ?? "-"}
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.worstScore")}:</strong> {history.summary.worst_score ?? "-"}
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.scoreTrend")}:</strong> {history.summary.trend ?? "-"}
            </p>
          </div>
        </article>

        <article className="history-card history-card--full">
          <h3>
            {t("seoReview.history.reviewId")} #{review.review_id}
          </h3>
          <p className="history-meta">
            {t("seoReview.history.reviewAtTime")}: {formatDateTime(review.created_at)}
          </p>
          <p className="history-meta">
            {t("seoReview.history.status")}: {review.status ?? "-"}
          </p>
          <div className="history-score-grid">
            <span>
              {t("seoReview.history.overallScore")}: {review.overall_score ?? "-"}
            </span>
            <span>
              {t("seoReview.history.seoScore")}: {review.seo_score ?? "-"}
            </span>
            <span>
              {t("seoReview.history.readabilityScore")}: {review.readability_score ?? "-"}
            </span>
            <span>
              {t("seoReview.history.advancedScore")}: {review.advanced_score ?? "-"}
            </span>
          </div>
          <p className="history-meta">
            {t("seoReview.history.notes")}: {review.notes || "-"}
          </p>
        </article>

        <article className="history-card history-card--full">
          <h3>{t("seoReview.history.seoMetadataTitle")}</h3>
          <div className="history-detail-grid">
            <p className="history-meta">
              <strong>{t("seoReview.history.seoTitle")}:</strong> {seoTitle || "-"}
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.metaDescription")}:</strong> {metaDescription || "-"}
            </p>
            <p className="history-meta">
              <strong>{t("seoReview.history.primaryKeyword")}:</strong> {primaryKeyword || "-"}
            </p>
            <div>
              <p className="history-meta">
                <strong>{t("seoReview.history.secondaryKeywords")}:</strong>
              </p>
              {secondaryKeywords.length > 0 ? (
                <div className="history-chip-list">
                  {secondaryKeywords.map((keyword) => (
                    <span key={keyword} className="history-chip">
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="history-meta">-</p>
              )}
            </div>
            <div>
              <p className="history-meta">
                <strong>{t("seoReview.history.synonyms")}:</strong>
              </p>
              {synonyms.length > 0 ? (
                <div className="history-chip-list">
                  {synonyms.map((keyword) => (
                    <span key={keyword} className="history-chip">
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="history-meta">-</p>
              )}
            </div>
          </div>
        </article>

        <article className="history-card history-card--full">
          <h3>{t("seoReview.history.reviewedContentTitle")}</h3>
          <div className="history-detail-grid">
            <div>
              <p className="history-meta">
                <strong>{t("seoReview.history.summary")}:</strong>
              </p>
              <p className="history-block">{summary || "-"}</p>
            </div>
            <div>
              <p className="history-meta">
                <strong>{t("seoReview.history.detailedInformation")}:</strong>
              </p>
              <p className="history-block">{detailedInformation || "-"}</p>
            </div>
            <div>
              <p className="history-meta">
                <strong>{t("seoReview.history.articleContent")}:</strong>
              </p>
              <p className="history-block">{articleContent || "-"}</p>
            </div>
          </div>
        </article>

        {recommendations.length > 0 ? (
          <article className="history-card history-card--full">
            <h3>{t("seoReview.history.recommendationsTitle")}</h3>
            <ul className="history-section-list">
              {recommendations.map((recommendation) => (
                <li key={recommendation}>{recommendation}</li>
              ))}
            </ul>
          </article>
        ) : null}

        {checklist.length > 0 ? (
          <article className="history-card history-card--full">
            <h3>{t("seoReview.history.checklistTitle")}</h3>
            <ul className="history-section-list">
              {checklist.slice(0, 10).map((item, index) => (
                <li key={`${String(item.checkName ?? item.check_name ?? "item")}-${index}`}>
                  <strong>{String(item.checkName ?? item.check_name ?? "-")}</strong>:{" "}
                  {String(item.improvement ?? item.status ?? item.result ?? "-")}
                </li>
              ))}
            </ul>
          </article>
        ) : null}

        {!hasExtraDetails ? (
          <article className="history-card history-card--full">
            <p className="panel__empty">{t("seoReview.history.noExtraDetails")}</p>
          </article>
        ) : null}
      </div>
    </section>
  );
}
