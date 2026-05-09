import type {
  ArticleFormData,
  ReviewHistoryResponse,
  ReviewReport,
  ReviewedArticlesResponse,
} from "../model/types";

type ApiEnvelope<T> = {
  status: string;
  message: string;
  data?: T;
};

const resolveApiBaseUrl = () => (import.meta.env.VITE_API_BASE_URL?.trim() || "/api").replace(/\/+$/, "");
const createApiUrl = (path: string) => `${resolveApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

async function parseResponse<T>(response: Response): Promise<ApiEnvelope<T> | null> {
  const responseText = await response.text();
  if (!responseText.trim()) {
    return null;
  }

  try {
    return JSON.parse(responseText) as ApiEnvelope<T>;
  } catch {
    return null;
  }
}

export async function requestSeoReview(input: ArticleFormData): Promise<ReviewReport> {
  const response = await fetch(createApiUrl("/review"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await parseResponse<ReviewReport>(response);
  if (!response.ok || !payload?.data) {
    throw new Error(payload?.message || "Could not generate the SEO review.");
  }

  // The backend returns an envelope so the frontend can reuse the same success/error shape everywhere.
  return payload.data;
}

export async function fetchReviewedArticles(
  page = 1,
  pageSize = 10,
): Promise<ReviewedArticlesResponse> {
  const response = await fetch(createApiUrl(`/reviews?page=${page}&pageSize=${pageSize}`));

  const payload = await parseResponse<ReviewedArticlesResponse>(response);
  if (!response.ok || !payload?.data) {
    throw new Error(payload?.message || "Could not fetch reviewed articles.");
  }

  return payload.data;
}

export async function fetchReviewHistory(
  articleId: number,
  page = 1,
  pageSize = 20,
): Promise<ReviewHistoryResponse> {
  const response = await fetch(createApiUrl(`/reviews/${articleId}?page=${page}&pageSize=${pageSize}`));

  const payload = await parseResponse<ReviewHistoryResponse>(response);
  if (!response.ok || !payload?.data) {
    throw new Error(payload?.message || "Could not fetch review history.");
  }

  return payload.data;
}
      
