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

function isSuccessPayload<T>(payload: ApiEnvelope<T> | null): payload is ApiEnvelope<T> & { data: T } {
  return payload?.status === "success" && payload.data !== undefined;
}

function buildPaginationQuery(page: number, pageSize: number): string {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });
  return params.toString();
}

function extractErrorMessage<T>(
  response: Response,
  payload: ApiEnvelope<T> | null,
  fallback: string,
): string {
  if (payload?.message?.trim()) {
    return payload.message;
  }

  if (response.status === 413) {
    return "Request body exceeds maximum allowed size of 50MB.";
  }

  return fallback;
}

export async function requestSeoReview(input: ArticleFormData): Promise<ReviewReport> {
  const response = await fetch(createApiUrl("/review"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const payload = await parseResponse<ReviewReport>(response);
  if (!response.ok || !isSuccessPayload(payload)) {
    throw new Error(extractErrorMessage(response, payload, "Could not generate the SEO review."));
  }

  return payload.data;
}

export async function fetchReviewedArticles(
  page = 1,
  pageSize = 10,
): Promise<ReviewedArticlesResponse> {
  const response = await fetch(createApiUrl(`/reviews?${buildPaginationQuery(page, pageSize)}`), {
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await parseResponse<ReviewedArticlesResponse>(response);
  if (!response.ok || !isSuccessPayload(payload)) {
    throw new Error(extractErrorMessage(response, payload, "Could not fetch reviewed articles."));
  }

  return payload.data;
}

export async function fetchReviewHistory(
  articleId: number,
  page = 1,
  pageSize = 20,
): Promise<ReviewHistoryResponse> {
  const response = await fetch(
    createApiUrl(`/reviews/${articleId}?${buildPaginationQuery(page, pageSize)}`),
    {
      headers: {
        Accept: "application/json",
      },
    },
  );

  const payload = await parseResponse<ReviewHistoryResponse>(response);
  if (!response.ok || !isSuccessPayload(payload)) {
    throw new Error(extractErrorMessage(response, payload, "Could not fetch review history."));
  }

  return payload.data;
}
      
