import { useTranslation } from "react-i18next";
import { ChecklistGroup } from "../../../shared/ui/ChecklistGroup";
import { ScoreCard } from "../../../shared/ui/ScoreCard";
import type { SeoReviewWorkspace } from "../model/useSeoReviewWorkspace";

type SeoReviewReportProps = {
  workspace: SeoReviewWorkspace;
};

export function SeoReviewReport({ workspace }: SeoReviewReportProps) {
  const { t } = useTranslation();
  const { report } = workspace;

  return (
    <aside className="report">
      <section className="panel panel--highlight">
        <div className="panel__header">
          <div>
            <p className="eyebrow">{t("seoReview.report.snapshotEyebrow")}</p>
            <h2>{t("seoReview.report.readinessTitle")}</h2>
          </div>
        </div>

        {report ? (
          <>
            <div className="score-grid">
              <ScoreCard title={t("seoReview.score.overallTitle")} score={report.overallScore} tone="overall" />
              <ScoreCard title={t("seoReview.score.seoTitle")} score={report.seoScore} tone="seo" />
              <ScoreCard
                title={t("seoReview.score.readabilityTitle")}
                score={report.readabilityScore}
                tone="readability"
              />
            </div>

            <div className="recommendations">
              <div>
                <p className="eyebrow">{t("seoReview.report.topImprovementsEyebrow")}</p>
                <h3>{t("seoReview.report.nextActionsTitle")}</h3>
              </div>
              <ul>
                {workspace.topRecommendations.length > 0 ? (
                  workspace.topRecommendations.map((recommendation) => (
                    <li key={recommendation}>{recommendation}</li>
                  ))
                ) : (
                  <li>{t("seoReview.report.noUrgentFixes")}</li>
                )}
              </ul>
            </div>
          </>
        ) : (
          <p className="panel__empty">{t("seoReview.report.emptyState")}</p>
        )}
      </section>

      <section className="panel">
        <div className="panel__header">
          <div>
            <p className="eyebrow">{t("seoReview.report.highlightedInputsEyebrow")}</p>
            <h2>{t("seoReview.report.fieldsNeedImprovementTitle")}</h2>
          </div>
        </div>
        <div className="field-feedback-list">
          {report && workspace.fieldFeedback.length > 0 ? (
            workspace.fieldFeedback.map((item) => (
              <article key={item.field} className="field-feedback-card">
                <div className="badge badge--attention">{item.label}</div>
                <ul>
                  {item.messages.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </article>
            ))
          ) : (
            <article className="field-feedback-card">
              <div className="badge badge--good">{t("seoReview.report.allClearTitle")}</div>
              <p className="field-feedback-card__empty">
                {t("seoReview.report.allClearDescription")}
              </p>
            </article>
          )}
        </div>
      </section>

      <ChecklistGroup title={t("seoReview.checklist.groups.seo")} items={workspace.groupedChecklist.seo} />
      <ChecklistGroup
        title={t("seoReview.checklist.groups.advanced")}
        items={workspace.groupedChecklist.advanced}
      />
      <ChecklistGroup
        title={t("seoReview.checklist.groups.readability")}
        items={workspace.groupedChecklist.readability}
      />
    </aside>
  );
}
