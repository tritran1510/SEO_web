import { useTranslation } from "react-i18next";
import type { PresentedChecklistResult } from "../../features/seo-review/model/types";

type ChecklistGroupProps = {
  title: string;
  items: PresentedChecklistResult[];
};

export function ChecklistGroup({ title, items }: ChecklistGroupProps) {
  const { t } = useTranslation();
  const passedCount = items.filter((item) => item.status === "good").length;

  return (
    <section className="panel">
      <div className="panel__header">
        <div>
          <p className="eyebrow">{title}</p>
          <h3>{t("seoReview.checklist.passedCount", { count: passedCount })}</h3>
        </div>
      </div>
      <div className="checklist">
        {items.map((item) => (
          <article key={item.code} className="checklist__item">
            <div className={`badge badge--${item.status}`}>{item.displayResult}</div>
            <div>
              <h4>{item.displayName}</h4>
              <p>{item.displayReason}</p>
              <small>{item.displayImprovement}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
