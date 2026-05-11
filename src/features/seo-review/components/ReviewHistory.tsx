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

type HistoryImageMetadata = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  altText: string;
  title: string;
  caption: string;
  description: string;
  sortOrder: number;
};

function pickImageMetadata(source: Record<string, unknown>): HistoryImageMetadata[] {
  const rawValue = source.image_metadata;
  if (!Array.isArray(rawValue)) {
    return [];
  }

  return rawValue
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const record = item as Record<string, unknown>;
      const dataUrl = typeof record.dataUrl === "string" ? record.dataUrl : "";
      if (!dataUrl) {
        return null;
      }

      return {
        id: typeof record.id === "string" && record.id.trim() ? record.id : dataUrl,
        name: typeof record.name === "string" ? record.name : "",
        mimeType: typeof record.mimeType === "string" ? record.mimeType : "",
        dataUrl,
        altText: typeof record.altText === "string" ? record.altText : "",
        title: typeof record.title === "string" ? record.title : "",
        caption: typeof record.caption === "string" ? record.caption : "",
        description: typeof record.description === "string" ? record.description : "",
        sortOrder: typeof record.sortOrder === "number" ? record.sortOrder : 0,
      } satisfies HistoryImageMetadata;
    })
    .filter((item): item is HistoryImageMetadata => item !== null)
    .sort((left, right) => left.sortOrder - right.sortOrder);
}

function sanitizeHtmlForHistory(rawHtml: string): string {
  if (!rawHtml.trim()) {
    return "";
  }

  const parser = new DOMParser();
  const documentNode = parser.parseFromString(rawHtml, "text/html");
  const blockedTags = ["script", "style", "iframe", "object", "embed"];
  blockedTags.forEach((tagName) => {
    documentNode.querySelectorAll(tagName).forEach((node) => node.remove());
  });

  documentNode.querySelectorAll("*").forEach((element) => {
    Array.from(element.attributes).forEach((attribute) => {
      const attributeName = attribute.name.toLowerCase();
      const value = attribute.value.trim().toLowerCase();
      if (attributeName.startsWith("on")) {
        element.removeAttribute(attribute.name);
        return;
      }
      if ((attributeName === "href" || attributeName === "src") && value.startsWith("javascript:")) {
        element.removeAttribute(attribute.name);
      }
    });
  });

  return documentNode.body.innerHTML;
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
                <h3>{t("seoReview.history.reviewWithId", { id: review.review_id })}</h3>
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
  const reviewedSlug = pickString(reviewRecord, ["slug"]);
  const secondaryKeywords = pickStringArray(reviewRecord, ["secondary_keywords", "secondaryKeywords"]);
  const synonyms = pickStringArray(reviewRecord, ["synonyms"]);
  const summary = pickString(reviewRecord, ["summary"]);
  const detailedInformation = pickString(reviewRecord, ["detailed_information", "detailedInformation"]);
  const articleContent = pickString(reviewRecord, ["article_content", "articleContent"]);
  const imageMetadata = pickImageMetadata(reviewRecord);

  const recommendations = pickStringArray(reviewRecord, [
    "improvement_recommendations",
    "improvementRecommendations",
  ]);
  const checklist = (Array.isArray(reviewRecord.checklist_results)
    ? reviewRecord.checklist_results
    : Array.isArray(reviewRecord.checklistResults)
      ? reviewRecord.checklistResults
      : []) as Array<Record<string, unknown>>;

  const hasSeoMetadata =
    Boolean(seoTitle) ||
    Boolean(metaDescription) ||
    Boolean(reviewedSlug) ||
    Boolean(primaryKeyword) ||
    secondaryKeywords.length > 0 ||
    synonyms.length > 0;

  const hasReviewedContent =
    Boolean(summary) ||
    Boolean(detailedInformation) ||
    Boolean(articleContent);
  const hasImageMetadata = imageMetadata.length > 0;

  const hasExtraDetails =
    hasSeoMetadata ||
    hasReviewedContent ||
    hasImageMetadata ||
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

        {hasSeoMetadata ? (
          <article className="history-card history-card--full">
            <h3>{t("seoReview.history.seoMetadataTitle")}</h3>
            <div className="history-detail-grid">
              <p className="history-meta">
                <strong>{t("seoReview.history.seoTitle")}:</strong> {seoTitle || "-"}
              </p>
              <p className="history-meta">
                <strong>{t("seoReview.history.slug")}:</strong> {reviewedSlug || "-"}
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
        ) : null}

        {hasImageMetadata ? (
          <article className="history-card history-card--full">
            <h3>{t("seoReview.history.imageMetadataTitle")}</h3>
            <div className="image-grid image-grid--compact">
              {imageMetadata.map((image) => (
                <article key={image.id} className="image-card">
                  <img src={image.dataUrl} alt={image.altText || image.name} className="image-card__preview" />
                  <div className="image-card__footer">
                    <p className="image-card__name">{image.name || "-"}</p>
                    <p className="image-card__meta">
                      <strong>{t("seoReview.imageInput.fields.altTextLabel")}:</strong> {image.altText || "-"}
                    </p>
                    <p className="image-card__meta">
                      <strong>{t("seoReview.imageInput.fields.titleLabel")}:</strong> {image.title || "-"}
                    </p>
                    <p className="image-card__meta">
                      <strong>{t("seoReview.imageInput.fields.captionLabel")}:</strong> {image.caption || "-"}
                    </p>
                    <p className="image-card__meta">
                      <strong>{t("seoReview.imageInput.fields.descriptionLabel")}:</strong> {image.description || "-"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </article>
        ) : null}

        {hasReviewedContent ? (
          <article className="history-card history-card--full">
            <h3>{t("seoReview.history.reviewedContentTitle")}</h3>
            <div className="history-detail-grid">
              <div>
                <p className="history-meta">
                  <strong>{t("seoReview.history.summary")}:</strong>
                </p>
                {summary ? (
                  <div
                    className="history-block"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlForHistory(summary) }}
                  />
                ) : (
                  <p className="history-block">-</p>
                )}
              </div>
              <div>
                <p className="history-meta">
                  <strong>{t("seoReview.history.detailedInformation")}:</strong>
                </p>
                {detailedInformation ? (
                  <div
                    className="history-block"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlForHistory(detailedInformation) }}
                  />
                ) : (
                  <p className="history-block">-</p>
                )}
              </div>
              <div>
                <p className="history-meta">
                  <strong>{t("seoReview.history.articleContent")}:</strong>
                </p>
                {articleContent ? (
                  <div
                    className="history-block"
                    dangerouslySetInnerHTML={{ __html: sanitizeHtmlForHistory(articleContent) }}
                  />
                ) : (
                  <p className="history-block">-</p>
                )}
              </div>
            </div>
          </article>
        ) : null}

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
