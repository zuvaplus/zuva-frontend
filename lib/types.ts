// ─── Feed & Content ──────────────────────────────────────────
export type Orientation = "vertical" | "landscape";

export interface FeedItem {
  id: string;
  creator_id: string;
  title: string;
  duration_seconds: number;
  cloudfront_url: string;
  thumbnail_url: string;
  ai_generated_tags: string[];
  view_count: number;
  like_count: number;
  total_tips_suns: number;
  orientation: Orientation;
  // Discovery engine metadata
  _bucket?: "trending" | "personalized" | "wildcard";
  trending_suns_24h?: number;
  trending_tip_count_24h?: number;
  relevance_score?: number;
  matched_tags?: string[];
  // Creator info (joined on some routes)
  creator_username?: string;
  creator_display_name?: string;
  creator_avatar_url?: string;
}

export interface FeedResponse {
  success: boolean;
  feed: FeedItem[];
  diagnostics?: {
    requested: number;
    delivered: number;
    trending: number;
    personalized: number;
    wildcard: number;
    mix: {
      trending_pct: string;
      personalized_pct: string;
      wildcard_pct: string;
    };
  };
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

export type CashoutChannel =
  | "mobile_money_mpesa"
  | "mobile_money_mtn"
  | "mobile_money_airtel"
  | "mobile_money_ecocash"
  | "bank_transfer"
  | "chimoney_wallet";

export interface CashoutResponse {
  success: boolean;
  payoutId: string;
  transactionRef: string;
  amountSuns: number;
  usdAmount: string;
  localAmount: string;
  localCurrency: string;
  exchangeRate: string;
  channel: string;
  chimoneyIssueId: string;
  status: string;
  message: string;
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

// ─── Interest Graph ──────────────────────────────────────────
export interface UserInterest {
  tag: string;
  weight: number;
  view_count: number;
  vertical_completions: number;
  landscape_completions: number;
  updated_at: string;
  strength_pct: number;
}

export interface InterestsResponse {
  success: boolean;
  interests: UserInterest[];
  count: number;
}

// ─── View Completion ─────────────────────────────────────────
export interface ViewCompletePayload {
  contentId: string;
  orientation: Orientation;
  watchDurationSeconds: number;
  totalDurationSeconds: number;
}
