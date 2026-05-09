import type { ArticleFormData } from "../model/types";

export const mockArticle: ArticleFormData = {
  articleTitle: "How to Build an SEO Review Workflow for Editorial Teams",
  permanentLink: "https://example.com/editorial-seo-review-workflow",
  articleContent:
    "# Why SEO review workflows matter\n\nEditorial teams need more than a score to improve article quality. A strong SEO review workflow should explain what is already working, where the content is weak, and how to fix it before publication.\n\n## What content teams usually miss\n\nTeams often struggle with keyword placement, uneven heading structure, and summaries that do not support the target topic. A guided review process helps writers improve clarity, coverage, and search intent alignment without guessing.\n\n## What a better system should do\n\nThe best systems surface actionable recommendations, not just pass or fail signals. They should show which inputs are strong, which ones need improvement, and how to fix each issue before publishing.",
  contentImages: [],
  detailedInformation:
    "This article is meant for content leads and editors who want a reusable review module inspired by Yoast-style checks.",
  summary:
    "A practical guide to creating an SEO review process that scores content, explains weaknesses, and recommends concrete improvements.",
  keywordSet: {
    seoTitle: "SEO Review Workflow for Editors | Smarter Content Checks",
    slug: "seo-review-workflow-editors",
    metaDescription:
      "Learn how to create an SEO review workflow for editors with score-based feedback, readability checks, and actionable recommendations.",
    primaryKeyword: "SEO review workflow",
    secondaryKeywords: "editorial SEO checks, content quality review",
    synonyms: "SEO review process, article optimization workflow",
  },
};
