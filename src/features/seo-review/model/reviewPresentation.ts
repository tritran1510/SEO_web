import type { TFunction } from "i18next";
import type {
  PresentedChecklistResult,
  PresentedFieldFeedback,
  ReviewFieldKey,
  ReviewStatus,
  ChecklistResult,
} from "./types";

const REVIEW_ERROR_KEYS: Record<string, string> = {
  "Could not generate the SEO review.": "seoReview.errors.reviewFailed",
  "Invalid review payload.": "seoReview.errors.invalidPayload",
  "Article title is required.": "seoReview.errors.articleTitleRequired",
  "Permanent link is required.": "seoReview.errors.permanentLinkRequired",
  "Article content is required.": "seoReview.errors.articleContentRequired",
  "Summary is required.": "seoReview.errors.summaryRequired",
  "Primary keyword is required.": "seoReview.errors.primaryKeywordRequired",
};

export function translateReviewErrorMessage(t: TFunction, error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  const translationKey = REVIEW_ERROR_KEYS[message];

  if (translationKey) {
    return t(translationKey);
  }

  return message || t("seoReview.errors.reviewFailed");
}

export function getReviewStatusLabel(t: TFunction, status: ReviewStatus): string {
  if (status === "needs improvement") {
    return t("seoReview.status.needsImprovement");
  }

  return status === "poor" ? t("seoReview.status.poor") : t("seoReview.status.good");
}

export function getFieldLabel(t: TFunction, field: ReviewFieldKey): string {
  return t(`seoReview.fields.${field}.label`);
}

// The backend owns scoring, while this mapper owns localized display text for the current UI language.
export function presentChecklistItems(
  t: TFunction,
  items: ChecklistResult[],
): PresentedChecklistResult[] {
  return items.map((item) => ({
    ...item,
    displayName: t(`seoReview.checks.${item.code}.name`, { defaultValue: item.checkName }),
    displayReason: t(`seoReview.checks.${item.code}.reason`, { defaultValue: item.reason }),
    displayImprovement: t(`seoReview.checks.${item.code}.improvement`, {
      defaultValue: item.improvement,
    }),
    displayResult:
      item.status === "good"
        ? t("seoReview.checklist.result.pass")
        : t("seoReview.checklist.result.needsWork"),
  }));
}

export function buildPresentedFieldFeedback(
  t: TFunction,
  items: PresentedChecklistResult[],
): PresentedFieldFeedback[] {
  const messagesByField = new Map<ReviewFieldKey, string[]>();

  for (const item of items) {
    if (item.status === "good") {
      continue;
    }

    for (const field of item.affectedFields) {
      const fieldMessages = messagesByField.get(field) ?? [];
      if (!fieldMessages.includes(item.displayImprovement)) {
        fieldMessages.push(item.displayImprovement);
      }
      messagesByField.set(field, fieldMessages);
    }
  }

  return Array.from(messagesByField.entries()).map(([field, messages]) => ({
    field,
    label: getFieldLabel(t, field),
    messages,
  }));
}

export function buildTopRecommendations(items: PresentedChecklistResult[]): string[] {
  return items
    .filter((item) => item.status === "attention")
    .slice(0, 5)
    .map((item) => `${item.displayName}: ${item.displayImprovement}`);
}
