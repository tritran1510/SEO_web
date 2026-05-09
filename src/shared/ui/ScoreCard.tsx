import { useTranslation } from "react-i18next";
import type { ScoreCardTone } from "../../features/seo-review/model/types";

type ScoreCardProps = {
  title: string;
  score: number;
  tone: ScoreCardTone;
};

export function ScoreCard({ title, score, tone }: ScoreCardProps) {
  const { t } = useTranslation();
  const summaryKey =
    score >= 80 ? "seoReview.score.strong" : score >= 55 ? "seoReview.score.promising" : "seoReview.score.needsWork";

  return (
    <article className={`score-card score-card--${tone}`}>
      <div className="score-card__ring">
        <span>{score}</span>
      </div>
      <div>
        <p className="eyebrow">{title}</p>
        <h3>{t(summaryKey)}</h3>
      </div>
    </article>
  );
}
