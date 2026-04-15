import type {
  FeedResponse,
  WalletResponse,
  LedgerResponse,
  PurchaseResponse,
  TipResponse,
  CashoutResponse,
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

async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ─── Feed ────────────────────────────────────────────────────
export function getFeed(
  orientation: "vertical" | "landscape" | "both" = "both",
  limit = 30,
  offset = 0
): Promise<FeedResponse> {
  return apiFetch<FeedResponse>(
    `/api/feed/recommended?orientation=${orientation}&limit=${limit}&offset=${offset}`
  );
}

export function recordViewComplete(
  payload: ViewCompletePayload
): Promise<unknown> {
  return apiFetch("/api/feed/view-complete", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getUserInterests(limit = 20): Promise<InterestsResponse> {
  return apiFetch<InterestsResponse>(
    `/api/feed/user-interests?limit=${limit}`
  );
}

// ─── Wallet ──────────────────────────────────────────────────
export function getWalletBalance(): Promise<WalletResponse> {
  return apiFetch<WalletResponse>("/api/wallet/balance");
}

export function getLedger(
  page = 1,
  limit = 20
): Promise<LedgerResponse> {
  return apiFetch<LedgerResponse>(
    `/api/suns/ledger?page=${page}&limit=${limit}`
  );
}

// ─── Suns Economy ────────────────────────────────────────────
export function purchaseSuns(
  fiatAmount: number,
  fiatCurrency: FiatCurrency
): Promise<PurchaseResponse> {
  return apiFetch<PurchaseResponse>("/api/suns/purchase", {
    method: "POST",
    body: JSON.stringify({ fiatAmount, fiatCurrency }),
  });
}

export function tipCreator(
  creatorId: string,
  amountSuns: number,
  opts?: {
    contentId?: string;
    orientation?: Orientation;
    message?: string;
  }
): Promise<TipResponse> {
  return apiFetch<TipResponse>("/api/suns/tip", {
    method: "POST",
    body: JSON.stringify({ creatorId, amountSuns, ...opts }),
  });
}

export function cashoutSuns(payload: {
  amountSuns: number;
  channel: CashoutChannel;
  localCurrencyCode: string;
  phoneNumber?: string;
  bankAccountRef?: string;
}): Promise<CashoutResponse> {
  return apiFetch<CashoutResponse>("/api/suns/cashout", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Creator ─────────────────────────────────────────────────
export function getCreatorEarnings(
  creatorId: string
): Promise<EarningsResponse> {
  return apiFetch<EarningsResponse>(`/api/creator/earnings/${creatorId}`);
}
