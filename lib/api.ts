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
  MyVideosResponse,
  UploadStatusResponse,
  UpdateChannelResponse,
  CreatorLinksResponse,
  CreatorLink,
  CaptionLanguage,
  CaptionsListResponse,
  FlaresFeedResponse,
  VideoResponse,
  EarningsResponse,
  FiatCurrency,
  CashoutChannel,
  Orientation,
  WatchProgressPayload,
  FlareSwipeEventPayload,
  ReportVideoPayload,
  ReportVideoResponse,
  SortOption,
  SaveResponse,
  FollowedCreatorsResponse,
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
  opts: { limit?: number; offset?: number; contentCategory?: string; country?: string; sort?: SortOption } = {}
): Promise<FeedResponse> {
  const params = new URLSearchParams();
  params.set("limit", String(opts.limit ?? 30));
  params.set("offset", String(opts.offset ?? 0));
  if (opts.contentCategory) params.set("content_category", opts.contentCategory);
  if (opts.country) params.set("country", opts.country);
  if (opts.sort) params.set("sort", opts.sort);
  return apiFetch<FeedResponse>(`/api/feed?${params.toString()}`, token);
}

// Same FeedResponse shape as getFeed above — no pagination, single
// fetch (matches GET /api/channel/:username's existing pattern), all
// three require a signed-in viewer.
export function getFollowingFeed(token: string | null): Promise<FeedResponse> {
  return apiFetch<FeedResponse>("/api/me/following", token);
}

export function getHistoryFeed(token: string | null): Promise<FeedResponse> {
  return apiFetch<FeedResponse>("/api/me/history", token);
}

export function getSavedFeed(token: string | null): Promise<FeedResponse> {
  return apiFetch<FeedResponse>("/api/me/saved", token);
}

export function getFollowedCreators(token: string | null): Promise<FollowedCreatorsResponse> {
  return apiFetch<FollowedCreatorsResponse>("/api/me/followed-creators", token);
}

// Fired periodically (every 10-15s of playback) and on pause/unload —
// feeds the main feed's completion-rate ranking (watch_events). Works
// signed-out too (optionalAuth on the backend), so no token is required.
export function recordWatchProgress(
  token: string | null,
  payload: WatchProgressPayload
): Promise<unknown> {
  return apiFetch("/api/feed/watch-progress", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
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

export function saveVideo(token: string | null, videoId: string): Promise<SaveResponse> {
  return apiFetch<SaveResponse>(`/api/video/${videoId}/save`, token, { method: "POST" });
}

export function unsaveVideo(token: string | null, videoId: string): Promise<SaveResponse> {
  return apiFetch<SaveResponse>(`/api/video/${videoId}/save`, token, { method: "DELETE" });
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

// Works signed-out too (optionalAuth on the backend) — pass a null token
// when one isn't available rather than skipping the call.
export function reportVideo(
  token: string | null,
  videoId: string,
  payload: ReportVideoPayload
): Promise<ReportVideoResponse> {
  return apiFetch<ReportVideoResponse>(`/api/video/${videoId}/report`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Flares (short-form vertical feed) ───────────────────────
// Reuses the exact same GET /api/video/:id the long-form watch page
// uses — Flares are just videos.is_flare=true rows. This is also what
// increments view_count and returns fresh viewer.has_liked/is_subscribed,
// called once per slide as it becomes the active one in the feed.
export function getVideoDetail(token: string | null, videoId: string): Promise<VideoResponse> {
  return apiFetch<VideoResponse>(`/api/video/${videoId}`, token);
}

export function getFlaresFeed(
  token: string | null,
  opts: { cursor?: string | null; exclude?: string[]; limit?: number } = {}
): Promise<FlaresFeedResponse> {
  const params = new URLSearchParams();
  if (opts.cursor) params.set("cursor", opts.cursor);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.exclude?.length) params.set("exclude", opts.exclude.join(","));
  const qs = params.toString();
  return apiFetch<FlaresFeedResponse>(`/api/flares/feed${qs ? `?${qs}` : ""}`, token);
}

// Fired on swipe-away, loop detection, and periodically during playback —
// feeds computeFlareScore, deliberately independent from the main feed's
// watch-progress/completion-rate ranking above.
export function recordFlareSwipeEvent(
  token: string | null,
  payload: FlareSwipeEventPayload
): Promise<unknown> {
  return apiFetch("/api/flares/swipe-event", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Creator dashboard ────────────────────────────────────────
export function getMyVideos(token: string | null): Promise<MyVideosResponse> {
  return apiFetch<MyVideosResponse>("/api/creator/videos", token);
}

export function getVideoCaptions(
  token: string | null,
  videoId: string
): Promise<CaptionsListResponse> {
  return apiFetch<CaptionsListResponse>(`/api/upload/video/${videoId}/captions`, token);
}

// Multipart upload — bypasses apiFetch's JSON Content-Type default, same
// pattern as the raw XHR used for the video file itself.
export async function uploadCaptionTrack(
  token: string | null,
  videoId: string,
  language: CaptionLanguage,
  file: File
): Promise<{ success: boolean; language: string }> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("language", language);

  const res = await fetch(`${BASE_URL}/api/upload/video/${videoId}/captions`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body?.error ?? `HTTP ${res.status}`, res.status, body?.code);
  }
  return res.json();
}

export function deleteCaptionTrack(
  token: string | null,
  videoId: string,
  language: string
): Promise<{ success: boolean }> {
  return apiFetch(`/api/upload/video/${videoId}/captions/${language}`, token, { method: "DELETE" });
}

export function getUploadStatus(
  token: string | null,
  videoId: string
): Promise<UploadStatusResponse> {
  return apiFetch<UploadStatusResponse>(`/api/upload/status/${videoId}`, token);
}

export function updateChannel(
  token: string | null,
  payload: { display_name?: string; bio?: string; avatar_url?: string; country_code?: string }
): Promise<UpdateChannelResponse> {
  return apiFetch<UpdateChannelResponse>("/api/channel/update", token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getCreatorLinks(token: string | null): Promise<CreatorLinksResponse> {
  return apiFetch<CreatorLinksResponse>("/api/creator/links", token);
}

export function createCreatorLink(
  token: string | null,
  payload: { title: string; url: string }
): Promise<{ success: boolean; link: CreatorLink }> {
  return apiFetch("/api/creator/links", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateCreatorLink(
  token: string | null,
  id: string,
  payload: { title?: string; url?: string }
): Promise<{ success: boolean; link: CreatorLink }> {
  return apiFetch(`/api/creator/links/${id}`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteCreatorLink(
  token: string | null,
  id: string
): Promise<{ success: boolean }> {
  return apiFetch(`/api/creator/links/${id}`, token, { method: "DELETE" });
}

export function reorderCreatorLinks(
  token: string | null,
  orderedIds: string[]
): Promise<{ success: boolean }> {
  return apiFetch("/api/creator/links/reorder", token, {
    method: "PATCH",
    body: JSON.stringify({ orderedIds }),
  });
}

// ─── Creator ─────────────────────────────────────────────────
export function getCreatorEarnings(
  token: string | null,
  creatorId: string
): Promise<EarningsResponse> {
  return apiFetch<EarningsResponse>(`/api/creator/earnings/${creatorId}`, token);
}
