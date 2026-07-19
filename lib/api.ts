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
    throw new Error(body?.error ?? `HTTP ${res.status}`);
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
    localCurrencyCode: string;
    phoneNumber?: string;
    bankAccountRef?: string;
  }
): Promise<CashoutResponse> {
  return apiFetch<CashoutResponse>("/api/suns/cashout", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Creator ─────────────────────────────────────────────────
export function getCreatorEarnings(
  token: string | null,
  creatorId: string
): Promise<EarningsResponse> {
  return apiFetch<EarningsResponse>(`/api/creator/earnings/${creatorId}`, token);
}
