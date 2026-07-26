import type {
  FeedResponse,
  WalletResponse,
  LedgerResponse,
  PurchaseResponse,
  TipResponse,
  CashoutResponse,
  PayoutOptionsResponse,
  PayoutHistoryResponse,
  CommentsResponse,
  VideoComment,
  LikeResponse,
  SubscribeResponse,
  EarningsResponse,
  InterestsResponse,
  FiatCurrency,
  CashoutChannel,
  Orientation,
  ViewCompletePayload,
} from "./types";

// Browser: use relative paths — Next.js rewrites proxy them to the backend.
// Server (SSR/ISR): relative fetch doesn't work, so use the absolute backend URL.
const BASE_URL =
  typeof window === "undefined"
    ? (process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000")
    : "";

// Thrown for non-2xx responses so callers can branch on the HTTP status
// or the backend's machine-readable `code` (e.g. PURCHASES_NOT_LIVE)
// instead of string-matching the human message.
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// token is the caller's Clerk session token (from useAuth().getToken() —
// apiFetch itself can't call that hook, since it isn't a React component).
async function apiFetch<T>(
  path: string,
  token: string | null,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const validatorMsgs = Array.isArray(body?.errors)
      ? body.errors.map((e: { msg?: string }) => e.msg).filter(Boolean).join("; ")
      : "";
    throw new ApiError(
      body?.error ?? (validatorMsgs || `HTTP ${res.status}`),
      res.status,
      body?.code
    );
  }

  return res.json() as Promise<T>;
}

// ─── Feed ────────────────────────────────────────────────────
export function getFeed(
  token: string | null,
  orientation: "vertical" | "landscape" | "both" = "both",
  limit = 30,
  offset = 0
): Promise<FeedResponse> {
  return apiFetch<FeedResponse>(
    `/api/feed/recommended?orientation=${orientation}&limit=${limit}&offset=${offset}`,
    token
  );
}

export function recordViewComplete(
  token: string | null,
  payload: ViewCompletePayload
): Promise<unknown> {
  return apiFetch("/api/feed/view-complete", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getUserInterests(
  token: string | null,
  limit = 20
): Promise<InterestsResponse> {
  return apiFetch<InterestsResponse>(
    `/api/feed/user-interests?limit=${limit}`,
    token
  );
}

// ─── Wallet ──────────────────────────────────────────────────
export function getWalletBalance(token: string | null): Promise<WalletResponse> {
  return apiFetch<WalletResponse>("/api/wallet/balance", token);
}

export function getLedger(
  token: string | null,
  page = 1,
  limit = 20
): Promise<LedgerResponse> {
  return apiFetch<LedgerResponse>(
    `/api/suns/ledger?page=${page}&limit=${limit}`,
    token
  );
}

// ─── Suns Economy ────────────────────────────────────────────
export function purchaseSuns(
  token: string | null,
  fiatAmount: number,
  fiatCurrency: FiatCurrency
): Promise<PurchaseResponse> {
  return apiFetch<PurchaseResponse>("/api/suns/purchase", token, {
    method: "POST",
    body: JSON.stringify({ fiatAmount, fiatCurrency }),
  });
}

export function tipCreator(
  token: string | null,
  creatorId: string,
  amountSuns: number,
  opts?: {
    contentId?: string;
    orientation?: Orientation;
    message?: string;
  }
): Promise<TipResponse> {
  return apiFetch<TipResponse>("/api/suns/tip", token, {
    method: "POST",
    body: JSON.stringify({ creatorId, amountSuns, ...opts }),
  });
}

export function cashoutSuns(
  token: string | null,
  payload: {
    amountSuns: number;
    channel: CashoutChannel;
    recipientFirstName: string;
    recipientLastName: string;
    phoneNumber?: string;
    bankAccountRef?: string;
    bankCode?: string;
  }
): Promise<CashoutResponse> {
  return apiFetch<CashoutResponse>("/api/suns/cashout", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getPayoutOptions(token: string | null): Promise<PayoutOptionsResponse> {
  return apiFetch<PayoutOptionsResponse>("/api/payouts/options", token);
}

export function getPayoutHistory(token: string | null): Promise<PayoutHistoryResponse> {
  return apiFetch<PayoutHistoryResponse>("/api/payouts/history", token);
}

// ─── Engagement (likes, comments, subscriptions) ─────────────
export function likeVideo(token: string | null, videoId: string): Promise<LikeResponse> {
  return apiFetch<LikeResponse>(`/api/video/${videoId}/like`, token, { method: "POST" });
}

export function unlikeVideo(token: string | null, videoId: string): Promise<LikeResponse> {
  return apiFetch<LikeResponse>(`/api/video/${videoId}/like`, token, { method: "DELETE" });
}

export function getComments(
  token: string | null,
  videoId: string,
  page = 1,
  limit = 20
): Promise<CommentsResponse> {
  return apiFetch<CommentsResponse>(
    `/api/video/${videoId}/comments?page=${page}&limit=${limit}`,
    token
  );
}

export function postComment(
  token: string | null,
  videoId: string,
  body: string,
  parentCommentId?: string
): Promise<{ success: boolean; comment: VideoComment }> {
  return apiFetch(`/api/video/${videoId}/comments`, token, {
    method: "POST",
    body: JSON.stringify({ body, ...(parentCommentId ? { parentCommentId } : {}) }),
  });
}

export function deleteComment(
  token: string | null,
  commentId: string
): Promise<{ success: boolean }> {
  return apiFetch(`/api/comments/${commentId}`, token, { method: "DELETE" });
}

export function subscribeCreator(
  token: string | null,
  creatorId: string
): Promise<SubscribeResponse> {
  return apiFetch<SubscribeResponse>(`/api/creator/${creatorId}/subscribe`, token, {
    method: "POST",
  });
}

export function unsubscribeCreator(
  token: string | null,
  creatorId: string
): Promise<SubscribeResponse> {
  return apiFetch<SubscribeResponse>(`/api/creator/${creatorId}/subscribe`, token, {
    method: "DELETE",
  });
}

// ─── Creator ─────────────────────────────────────────────────
export function getCreatorEarnings(
  token: string | null,
  creatorId: string
): Promise<EarningsResponse> {
  return apiFetch<EarningsResponse>(`/api/creator/earnings/${creatorId}`, token);
}
