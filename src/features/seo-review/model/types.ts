export type KeywordSet = {
  seoTitle: string;
  slug: string;
  metaDescription: string;
  primaryKeyword: string;
  secondaryKeywords: string;
  synonyms: string;
};

export type ImportedImage = {
  id: string;
  name: string;
  mimeType: string;
  dataUrl: string;
  altText: string;
  title: string;
  caption: string;
  description: string;
};

export type ArticleFormData = {
  articleTitle: string;
  permanentLink: string;
  articleContent: string;
  contentImages: ImportedImage[];
  detailedInformation: string;
  summary: string;
  keywordSet: KeywordSet;
};

export type ArticleFormField = Exclude<keyof ArticleFormData, "keywordSet" | "contentImages">;
export type KeywordSetField = keyof KeywordSet;

export type ReviewFieldKey =
  | "articleTitle"
  | "permanentLink"
  | "articleContent"
  | "contentImages"
  | "detailedInformation"
  | "summary"
  | "seoTitle"
  | "slug"
  | "metaDescription"
  | "primaryKeyword"
  | "secondaryKeywords"
  | "synonyms";

export type ChecklistGroupName = "SEO" | "Advanced" | "Readability";
export type ChecklistResultState = "good" | "attention";
export type ChecklistResultLabel = "Pass" | "Needs work";
export type ReviewStatus = "good" | "needs improvement" | "poor";
export type ScoreCardTone = "overall" | "seo" | "readability";

export type ChecklistResult = {
  code: string;
  group: ChecklistGroupName;
  checkName: string;
  result: ChecklistResultLabel;
  status: ChecklistResultState;
  reason: string;
  improvement: string;
  affectedFields: ReviewFieldKey[];
};

export type FieldFeedback = {
  field: ReviewFieldKey;
  label: string;
  messages: string[];
};

export type FieldTone = "default" | "attention";

export type FieldPresentation = {
  issues: string[];
  tone: FieldTone;
};

export type PresentedChecklistResult = ChecklistResult & {
  displayName: string;
  displayReason: string;
  displayImprovement: string;
  displayResult: string;
};

export type PresentedFieldFeedback = {
  field: ReviewFieldKey;
  label: string;
  messages: string[];
};

export type ReviewReport = {
  overallScore: number;
  seoScore: number;
  readabilityScore: number;
  advancedScore: number;
  status: ReviewStatus;
  checklistResults: ChecklistResult[];
  improvementRecommendations: string[];
  fieldsNeedingImprovement: ReviewFieldKey[];
  fieldFeedback: FieldFeedback[];
};

export type Pagination = {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
};

export type ReviewedArticleItem = {
  article_id: number;
  title: string;
  slug: string;
  permanent_link: string;
  primary_keyword: string | null;
  latest_review_id: string | null;
  latest_overall_score: number | null;
  latest_seo_score: number | null;
  latest_readability_score: number | null;
  latest_advanced_score: number | null;
  latest_status: string | null;
  total_reviews: number;
  avg_overall_score: number | null;
  best_overall_score: number | null;
  worst_overall_score: number | null;
  score_trend: string | null;
  last_reviewed_at: string | null;
};

export type ReviewedArticlesResponse = {
  items: ReviewedArticleItem[];
  pagination: Pagination;
};

export type ReviewHistoryItem = {
  review_id: string;
  created_at: string;
  overall_score: number | null;
  seo_score: number | null;
  readability_score: number | null;
  advanced_score: number | null;
  status: string | null;
  notes: string | null;
  article_content?: string | null;
  summary?: string | null;
  detailed_information?: string | null;
  seo_title?: string | null;
  meta_description?: string | null;
  primary_keyword?: string | null;
  slug?: string | null;
  secondary_keywords?: string | null;
  synonyms?: string | null;
  image_metadata?: Array<{
    id: string;
    name: string;
    mimeType: string;
    dataUrl: string;
    altText: string;
    title: string;
    caption: string;
    description: string;
    sortOrder: number;
  }> | null;
  improvement_recommendations?: string[] | null;
  checklist_results?: Array<{
    checkName?: string;
    check_name?: string;
    status?: string;
    result?: string;
    improvement?: string;
  }> | null;
  [key: string]: unknown;
};

export type ReviewHistoryArticle = {
  article_id: number;
  title: string;
  slug: string;
  permanent_link: string;
  status: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export type ReviewHistorySummary = {
  total_reviews: number;
  best_score: number | null;
  worst_score: number | null;
  avg_score: number | null;
  trend: string | null;
};

export type ReviewHistoryResponse = {
  article: ReviewHistoryArticle;
  reviews: ReviewHistoryItem[];
  pagination: Pagination;
  summary: ReviewHistorySummary;
};
