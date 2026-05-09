import { useTranslation } from "react-i18next";
import { useState } from "react";
import { switchLanguage } from "./i18n/i18n";
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
  const { t, i18n } = useTranslation();
  const workspace = useSeoReviewWorkspace();
  const [view, setView] = useState<ViewMode>("review-workspace");
  const [selectedArticleId, setSelectedArticleId] = useState<number | null>(null);
  const [selectedHistory, setSelectedHistory] = useState<ReviewHistoryResponse | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewHistoryItem | null>(null);

  return (
    <div className="shell">
      <div className="shell__topbar">
        <div className="language-switcher" role="group" aria-label={t("common.language.label")}>
          <span className="language-switcher__label">{t("common.language.label")}</span>
          <button
            type="button"
            className={`language-switcher__button ${i18n.language === "vi" ? "language-switcher__button--active" : ""}`}
            aria-label={t("common.language.vietnamese")}
            title={t("common.language.vietnamese")}
            onClick={() => {
              void switchLanguage("vi");
            }}
          >
            🇻🇳
          </button>
          <button
            type="button"
            className={`language-switcher__button ${i18n.language === "en" ? "language-switcher__button--active" : ""}`}
            aria-label={t("common.language.english")}
            title={t("common.language.english")}
            onClick={() => {
              void switchLanguage("en");
            }}
          >
            🇬🇧
          </button>
        </div>
      </div>

      <header className="hero">
        <div className="hero__copy">
          <p className="eyebrow">{t("seoReview.hero.eyebrow")}</p>
          <h1>{t("seoReview.hero.title")}</h1>
          <p className="hero__lead">{t("seoReview.hero.lead")}</p>
        </div>
      </header>

      <div className="view-switcher">
        <button
          type="button"
          className={`ghost-button ${view === "review-workspace" ? "view-switcher__active" : ""}`}
          onClick={() => setView("review-workspace")}
        >
          {t("seoReview.navigation.createReview")}
        </button>
        <button
          type="button"
          className={`ghost-button ${view !== "review-workspace" ? "view-switcher__active" : ""}`}
          onClick={() => setView("reviewed-articles")}
        >
          {t("seoReview.navigation.reviewHistory")}
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
