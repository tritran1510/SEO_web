import { useTranslation } from "react-i18next";
import { useState } from "react";
import { SeoReviewForm } from "../features/seo-review/components/SeoReviewForm";
import { SeoReviewReport } from "../features/seo-review/components/SeoReviewReport";
import {
  ReviewDetail,
  ReviewHistory,
} from "../features/seo-review/components/ReviewHistory";
import { ReviewedArticlesList } from "../features/seo-review/components/ReviewedArticlesList";
import type { ReviewHistoryItem, ReviewHistoryResponse } from "../features/seo-review/model/types";
import { useSeoReviewWorkspace } from "../features/seo-review/model/useSeoReviewWorkspace";

type ViewMode = "review-workspace" | "reviewed-articles" | "article-history" | "review-detail";

function App() {
  const { t } = useTranslation();
  const workspace = useSeoReviewWorkspace();
  const [view, setView] = useState<ViewMode>("review-workspace");
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<ReviewHistoryResponse | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewHistoryItem | null>(null);

  return (
    <div className="shell">
      <header className="hero">
        <div className="hero__copy">
          <p className="eyebrow">{t("seoReview.hero.eyebrow")}</p>
          <h1>{t("seoReview.hero.title")}</h1>
          <p className="hero__lead">{t("seoReview.hero.lead")}</p>
        </div>
        <div className="hero__status">
          <p className="eyebrow">{t("seoReview.hero.integrationEyebrow")}</p>
          <h2 className={`status status--${workspace.report?.status?.replace(/\s+/g, "-") ?? "good"}`}>
            {workspace.statusLabel}
          </h2>
          <p>{t("seoReview.hero.integrationHint")}</p>
        </div>
      </header>

      <div className="view-switcher">
        <button
          type="button"
          className={`ghost-button ${view === "review-workspace" ? "view-switcher__active" : ""}`}
          onClick={() => setView("review-workspace")}
        >
          Tao review / Create review
        </button>
        <button
          type="button"
          className={`ghost-button ${view !== "review-workspace" ? "view-switcher__active" : ""}`}
          onClick={() => setView("reviewed-articles")}
        >
          Lich su review / Review history
        </button>
      </div>

      {view === "review-workspace" ? (
        <main className="workspace">
          <SeoReviewForm workspace={workspace} />
          <SeoReviewReport workspace={workspace} />
        </main>
      ) : null}

      {view === "reviewed-articles" ? (
        <ReviewedArticlesList
          onOpenArticleHistory={(articleId) => {
            setSelectedArticleId(articleId);
            setSelectedHistory(null);
            setSelectedReview(null);
            setView("article-history");
          }}
        />
      ) : null}

      {view === "article-history" && selectedArticleId ? (
        <ReviewHistory
          articleId={selectedArticleId}
          onBackToList={() => setView("reviewed-articles")}
          onOpenReviewDetail={(history, review) => {
            setSelectedHistory(history);
            setSelectedReview(review);
            setView("review-detail");
          }}
        />
      ) : null}

      {view === "review-detail" && selectedHistory && selectedReview ? (
        <ReviewDetail
          history={selectedHistory}
          review={selectedReview}
          onBack={() => setView("article-history")}
        />
      ) : null}
    </div>
  );
}

export default App;
