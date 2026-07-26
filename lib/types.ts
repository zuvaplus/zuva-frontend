// ─── Feed & Content ──────────────────────────────────────────
// Orientation is kept only for the Watch page's viewer badge/layout
// (a client-derived notion of the video's aspect, not a DB column —
// see lib/api.ts's getFeed). Main-feed videos are always "landscape"
// now that Flares owns the vertical short-form experience.
export type Orientation = "vertical" | "landscape";

export interface FeedCreator {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number;
}

// Matches GET /api/feed's response shape — the real videos/creator join,
// scored and category-floor-adjusted server-side (see computeFeedScore /
// buildRankedFeed in zuva-backend/zuva-api.js). Deliberately close to
// FlareItem/UploadedVideo rather than the old cloudfront_url/
// ai_generated_tags shape, which never matched any real table.
export interface FeedItem {
  id: string;
  title: string;
  description: string | null;
  cloudflare_video_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  category: string;
  content_category: ContentCategory;
  tags: string[];
  created_at: string;
  creator: FeedCreator;
}

export interface FeedResponse {
  success: boolean;
  feed: FeedItem[];
}

// ─── Wallet & Transactions ───────────────────────────────────
export interface WalletBalance {
  balance_suns: number;
  total_earned_suns: number;
  total_spent_suns: number;
  total_cashed_out_suns: number;
  balance_usd_equivalent: string;
}

export interface WalletResponse {
  success: boolean;
  wallet: WalletBalance;
}

export type TransactionType =
  | "sun_purchase"
  | "creator_tip"
  | "platform_commission"
  | "creator_payout";

export interface Transaction {
  id: string;
  direction: "credit" | "debit";
  amount_suns: number;
  type: TransactionType;
  transaction_ref: string;
  memo: string | null;
  created_at: string;
  counterparty_name: string | null;
  counterparty_username: string | null;
}

export interface LedgerResponse {
  success: boolean;
  transactions: Transaction[];
  page: number;
  limit: number;
}

// ─── Suns Economy ────────────────────────────────────────────
export type FiatCurrency = "USD" | "GBP" | "CAD" | "AUD";

export interface PurchaseResponse {
  success: boolean;
  purchaseId: string;
  sunsPurchased: number;
  fiatAmount: number;
  fiatCurrency: string;
  usdEquivalent: string;
  checkoutUrl: string;
  message: string;
}

export interface TipResponse {
  success: boolean;
  transactionRef: string;
  totalSent: number;
  creatorReceived: number;
  platformFee: number;
  creatorTier: string;
  split: string;
  message: string;
}

export type CashoutChannel = "mobile_money" | "bank_transfer" | "cash_pickup";

export interface CashoutResponse {
  success: boolean;
  payoutId: string;
  transactionRef: string;
  amountSuns: number;
  usdAmount: string;
  provider: string;
  channel: string;
  status: string;
  message: string;
}

// One available payout method for the creator's country, from
// GET /api/payouts/options. configured=false → provider keys/onboarding
// pending; render disabled with a "coming soon" badge.
export interface PayoutMethodOption {
  method: CashoutChannel;
  provider: string;
  minUSD: number;
  minSuns: number;
  configured: boolean;
  network: string | null;
  currency: string | null;
}

export interface PayoutOptionsResponse {
  success: boolean;
  countryCode: string | null;
  methods: PayoutMethodOption[];
}

export interface PayoutRecord {
  id: string;
  amount_suns: number;
  usd_amount: string;
  channel: string;
  provider: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
  processed_at: string | null;
}

export interface PayoutHistoryResponse {
  success: boolean;
  payouts: PayoutRecord[];
}

// ─── Creator ─────────────────────────────────────────────────
export type CreatorTier = "rising_star" | "shining_sun" | "solar_elite";

export interface CreatorEarnings {
  creator_id: string;
  display_name: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  follower_count?: number;
  tier: CreatorTier;
  creator_share_pct: number;
  platform_share_pct: number;
  balance_suns: number;
  total_earned_suns: number;
  balance_usd: string;
  earned_usd: string;
}

export interface EarningsResponse {
  success: boolean;
  earnings: CreatorEarnings;
}

// ─── Watch progress (feeds the main feed's completion-rate ranking) ──
// Fired periodically (every 10-15s of playback) and on pause/unload —
// see POST /api/feed/watch-progress and watch_events in the backend.
export interface WatchProgressPayload {
  videoId: string;
  watchedSeconds: number;
  videoDurationSeconds: number;
}

// ─── Flares swipe events (feeds computeFlareScore — independent from
// the main feed's watch-progress/completion-rate ranking above) ──────
export interface FlareSwipeEventPayload {
  videoId: string;
  watchedSeconds: number;
  videoDurationSeconds: number;
  swipedAway?: boolean;
  looped?: boolean;
}

// ─── Search ──────────────────────────────────────────────────
export interface SearchCreator {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  follower_count: number;
}

export interface SearchVideo {
  id: string;
  orientation: Orientation;
  title: string;
  thumbnail_url: string;
  view_count: number;
  creator_name: string;
}

export interface SearchResponse {
  success: boolean;
  creators: SearchCreator[];
  videos: SearchVideo[];
  tags: string[];
}

// ─── Uploaded Videos (Cloudflare Stream) ─────────────────────
export type VideoCategory =
  | "Comedy" | "Drama" | "Music" | "News"
  | "Sports" | "Lifestyle" | "Education" | "Other";

// The ranking-model taxonomy (videos.content_category) — separate from
// VideoCategory/`category` above, which stays as-is. See CLAUDE.md for
// why these two category fields coexist. "documentary" | "discussion_debate"
// | "interview" | "lifestyle_culture" are grouped in the UI as the
// "Documentary & Discussion" umbrella (a code-level grouping only, matching
// zuva-backend's DOC_DISCUSSION_CATEGORIES — see VideoUploadForm.tsx).
export type ContentCategory =
  | "entertainment" | "music" | "comedy" | "drama_series" | "documentary"
  | "discussion_debate" | "interview" | "lifestyle_culture" | "news" | "other";

export type VideoStatus = "pending" | "published" | "rejected";

export interface UploadedVideo {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string;
  content_category: ContentCategory;
  tags: string[];
  cloudflare_video_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  status: VideoStatus;
  view_count: number;
  like_count: number;
  comment_count: number;
  is_flare?: boolean;
  created_at: string;
}

// ─── Flares (short-form vertical feed) ───────────────────────
export interface FlareCreator {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number;
}

export interface FlareItem {
  id: string;
  title: string;
  description: string | null;
  cloudflare_video_id: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  category: string;
  tags: string[];
  created_at: string;
  creator: FlareCreator;
}

export interface FlaresFeedResponse {
  success: boolean;
  flares: FlareItem[];
  nextCursor: string | null;
}

export interface ChannelVideoSummary {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  view_count: number;
  category: string;
  created_at: string;
}

export interface ChannelCreator {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  country_code: string | null;
  avatar_url: string | null;
  follower_count: number;
  role: string;
  created_at: string;
}

export interface ChannelResponse {
  success: boolean;
  creator: ChannelCreator;
  videos: ChannelVideoSummary[];
}

export interface UpdateChannelResponse {
  success: boolean;
  user: ChannelCreator;
}

// ─── Creator dashboard ───────────────────────────────────────
export interface MyVideosResponse {
  success: boolean;
  videos: UploadedVideo[];
}

// Cloudflare Stream's own processing state, surfaced verbatim by
// GET /api/upload/status/:videoId — state is typically one of
// pendingupload | downloading | queued | inprogress | ready | error.
export interface UploadProcessingStatus {
  state: string;
  pctComplete?: string;
  errorReasonCode?: string;
  errorReasonText?: string;
}

export interface UploadStatusResponse {
  success: boolean;
  processing_status: UploadProcessingStatus;
  video: UploadedVideo;
}

export type CaptionLanguage = "en" | "fr" | "pt" | "sw" | "ar" | "es" | "ht" | "yo" | "ha" | "zu" | "am";

export interface CaptionTrack {
  language: string;
  label: string;
  status: string;
}

export interface CaptionsListResponse {
  success: boolean;
  captions: CaptionTrack[];
}

export interface CreatorLink {
  id: string;
  title: string;
  url: string;
  position: number;
}

export interface CreatorLinksResponse {
  success: boolean;
  links: CreatorLink[];
}

export interface VideoPlayerCreator {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  follower_count: number;
}

export interface RelatedVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  view_count: number;
  created_at: string;
}

// Viewer engagement state on GET /api/video/:id — false/false for
// anonymous viewers.
export interface VideoViewerState {
  has_liked: boolean;
  is_subscribed: boolean;
}

export interface VideoResponse {
  success: boolean;
  video: UploadedVideo;
  creator: VideoPlayerCreator;
  viewer: VideoViewerState;
  related_videos: RelatedVideo[];
}

// ─── Engagement: comments ────────────────────────────────────
export interface CommentUser {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface VideoComment {
  id: string;
  parent_comment_id: string | null;
  body: string | null; // null when status === "deleted"
  status: "visible" | "hidden" | "deleted";
  created_at: string;
  is_own: boolean;
  user: CommentUser;
  replies?: VideoComment[]; // present on top-level comments only
}

export interface CommentsResponse {
  success: boolean;
  comments: VideoComment[];
  comment_count: number;
  has_more: boolean;
  page: number;
}

export interface LikeResponse {
  success: boolean;
  liked: boolean;
  like_count: number;
}

export interface SubscribeResponse {
  success: boolean;
  subscribed: boolean;
  follower_count: number;
}
