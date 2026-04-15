"use client";

import { useEffect, useState, useCallback } from "react";
import type { WalletBalance, Transaction, FiatCurrency } from "@/lib/types";
import { getWalletBalance, getLedger, purchaseSuns } from "@/lib/api";
import { formatSuns, timeAgo, txLabel } from "@/lib/utils";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";
import { WalletSkeleton } from "@/components/LoadingSkeleton";

const FIAT_CURRENCIES: { value: FiatCurrency; label: string; symbol: string }[] = [
  { value: "USD", label: "US Dollar", symbol: "$" },
  { value: "GBP", label: "British Pound", symbol: "£" },
  { value: "CAD", label: "Canadian Dollar", symbol: "C$" },
  { value: "AUD", label: "Australian Dollar", symbol: "A$" },
];

type ActiveTab = "overview" | "history" | "buy";

export default function WalletPage() {
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [hasMoreTxs, setHasMoreTxs] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");

  // Buy Suns state
  const [buyAmount, setBuyAmount] = useState(10);
  const [buyCurrency, setBuyCurrency] = useState<FiatCurrency>("USD");
  const [buying, setBuying] = useState(false);
  const [buyResult, setBuyResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletData, ledgerData] = await Promise.all([
        getWalletBalance(),
        getLedger(1, 20),
      ]);
      setWallet(walletData.wallet);
      setTxs(ledgerData.transactions ?? []);
      setHasMoreTxs((ledgerData.transactions?.length ?? 0) === 20);
      setTxPage(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not load wallet");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWallet();
  }, [loadWallet]);

  async function loadMoreTxs() {
    setLoadingTxs(true);
    try {
      const next = txPage + 1;
      const data = await getLedger(next, 20);
      const items = data.transactions ?? [];
      setTxs((prev) => [...prev, ...items]);
      setHasMoreTxs(items.length === 20);
      setTxPage(next);
    } catch (_) {
      // silent
    } finally {
      setLoadingTxs(false);
    }
  }

  async function handleBuy(e: React.FormEvent) {
    e.preventDefault();
    setBuying(true);
    setBuyResult(null);
    try {
      const resp = await purchaseSuns(buyAmount, buyCurrency);
      // Redirect to Chimoney checkout in a new tab
      if (resp.checkoutUrl) {
        window.open(resp.checkoutUrl, "_blank");
        setBuyResult({ ok: true, msg: `${resp.message} — checkout opened in a new tab.` });
      } else {
        setBuyResult({ ok: true, msg: resp.message });
      }
      // Refresh balance after purchase
      await loadWallet();
    } catch (err: unknown) {
      setBuyResult({
        ok: false,
        msg: err instanceof Error ? err.message : "Purchase failed",
      });
    } finally {
      setBuying(false);
    }
  }

  // Estimated Suns for display
  const sunsPreview = Math.floor(buyAmount * 1000); // simplified; real rate fetched server-side

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <WalletSkeleton />
      </div>
    );
  }

  if (error || !wallet) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ZuvaSunIcon size={48} className="mx-auto mb-4 opacity-40" />
        <p className="text-zinc-400 mb-4">{error ?? "Could not load wallet"}</p>
        <button
          onClick={loadWallet}
          className="bg-gold-400/20 text-gold-300 border border-gold-400/30 px-6 py-2.5 rounded-xl font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      {/* Balance card */}
      <div className="bg-surface-200 border border-gold-400/25 rounded-3xl p-6 mb-6 shadow-gold relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />

        <div className="relative">
          <p className="text-zinc-400 text-sm mb-1">Available Balance</p>
          <div className="flex items-end gap-3 mb-4">
            <ZuvaSunIcon size={44} glow />
            <div>
              <div className="text-5xl font-bold text-gold-400 leading-none tabular-nums">
                {formatSuns(wallet.balance_suns)}
              </div>
              <div className="text-zinc-400 text-sm mt-0.5">
                ≈ ${wallet.balance_usd_equivalent} USD
              </div>
            </div>
          </div>

          {/* Lifetime stats */}
          <div className="grid grid-cols-3 gap-3">
            <MiniStat label="Earned" value={formatSuns(wallet.total_earned_suns)} />
            <MiniStat label="Spent" value={formatSuns(wallet.total_spent_suns)} />
            <MiniStat label="Cashed Out" value={formatSuns(wallet.total_cashed_out_suns)} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-300 p-1 rounded-xl border border-gold-400/15 mb-6">
        {(["overview", "history", "buy"] as ActiveTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize
              ${activeTab === t
                ? "bg-gold-400 text-black shadow-gold"
                : "text-zinc-400 hover:text-gold-300"
              }`}
          >
            {t === "buy" ? "Buy Suns" : t === "history" ? "History" : "Overview"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "overview" && (
        <OverviewTab wallet={wallet} onBuyClick={() => setActiveTab("buy")} />
      )}

      {activeTab === "history" && (
        <HistoryTab
          txs={txs}
          hasMore={hasMoreTxs}
          loadingMore={loadingTxs}
          onLoadMore={loadMoreTxs}
        />
      )}

      {activeTab === "buy" && (
        <BuyTab
          buyAmount={buyAmount}
          setBuyAmount={setBuyAmount}
          buyCurrency={buyCurrency}
          setBuyCurrency={setBuyCurrency}
          sunsPreview={sunsPreview}
          buying={buying}
          buyResult={buyResult}
          setBuyResult={setBuyResult}
          onSubmit={handleBuy}
        />
      )}
    </div>
  );
}

// ─── Overview tab ──────────────────────────────────────────────
function OverviewTab({
  wallet,
  onBuyClick,
}: {
  wallet: WalletBalance;
  onBuyClick: () => void;
}) {
  return (
    <div className="space-y-4">
      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onBuyClick}
          className="flex flex-col items-center gap-2 bg-gold-400 hover:bg-gold-300 text-black font-bold py-4 rounded-2xl transition-all shadow-gold"
        >
          <PlusIcon />
          <span className="text-sm">Buy Suns</span>
        </button>
        <button
          disabled
          className="flex flex-col items-center gap-2 bg-surface-200 border border-gold-400/20 text-zinc-400 font-bold py-4 rounded-2xl opacity-60 cursor-not-allowed"
        >
          <CashoutIcon />
          <span className="text-sm">Cash Out</span>
          <span className="text-[10px] font-normal">Creator only</span>
        </button>
      </div>

      {/* Conversion reference */}
      <div className="bg-surface-200 border border-gold-400/15 rounded-2xl p-4">
        <h3 className="text-gold-400 font-semibold text-sm mb-3 flex items-center gap-2">
          <ZuvaSunIcon size={14} />
          Exchange Rate
        </h3>
        <div className="space-y-2 text-sm">
          {[
            { suns: 1000, usd: "1.00" },
            { suns: 5000, usd: "5.00" },
            { suns: 10000, usd: "10.00" },
          ].map(({ suns, usd }) => (
            <div key={suns} className="flex justify-between text-zinc-400">
              <span className="flex items-center gap-1">
                <ZuvaSunIcon size={12} className="text-gold-400" />
                {suns.toLocaleString()} Suns
              </span>
              <span className="text-gold-400 font-medium">${usd} USD</span>
            </div>
          ))}
        </div>
        <p className="text-zinc-600 text-xs mt-3">
          1,000 Suns = $1.00 USD. Minimum cashout: 10,000 Suns ($10).
        </p>
      </div>

      {/* Minimum cashout info */}
      {wallet.balance_suns >= 10000 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4">
          <p className="text-green-400 text-sm font-semibold">
            You have enough Suns to cash out!
          </p>
          <p className="text-zinc-400 text-xs mt-1">
            Go to your creator dashboard to withdraw via mobile money or bank transfer.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── History tab ───────────────────────────────────────────────
function HistoryTab({
  txs,
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  txs: Transaction[];
  hasMore: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
}) {
  if (txs.length === 0) {
    return (
      <div className="text-center py-16">
        <ZuvaSunIcon size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-zinc-400">No transactions yet</p>
        <p className="text-zinc-600 text-sm mt-1">
          Buy Suns or tip a creator to get started.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2 mb-4">
        {txs.map((tx) => (
          <TxRow key={tx.id} tx={tx} />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={onLoadMore}
          disabled={loadingMore}
          className="w-full py-3 bg-surface-200 border border-gold-400/15 text-gold-300 text-sm font-medium rounded-xl hover:bg-surface-100 transition-colors disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}

function TxRow({ tx }: { tx: Transaction }) {
  const isCredit = tx.direction === "credit";
  const colorClass = isCredit ? "text-green-400" : "text-red-400";
  const sign = isCredit ? "+" : "−";

  return (
    <div className="flex items-center justify-between bg-surface-200 border border-gold-400/10 rounded-xl px-4 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <TxIcon type={tx.type} isCredit={isCredit} />
        <div className="min-w-0">
          <p className="text-white text-sm font-medium truncate">{txLabel(tx.type)}</p>
          {tx.counterparty_name && (
            <p className="text-zinc-500 text-xs truncate">
              {isCredit ? "from" : "to"} @{tx.counterparty_username ?? tx.counterparty_name}
            </p>
          )}
          {tx.memo && !tx.counterparty_name && (
            <p className="text-zinc-600 text-xs truncate">{tx.memo}</p>
          )}
        </div>
      </div>
      <div className="text-right shrink-0 ml-3">
        <p className={`font-bold text-sm tabular-nums ${colorClass}`}>
          {sign} {formatSuns(tx.amount_suns)} ☀
        </p>
        <p className="text-zinc-600 text-xs">{timeAgo(tx.created_at)}</p>
      </div>
    </div>
  );
}

function TxIcon({ type, isCredit }: { type: string; isCredit: boolean }) {
  const bg = isCredit ? "bg-green-500/15 border-green-500/25" : "bg-red-500/15 border-red-500/25";
  return (
    <div className={`w-9 h-9 rounded-xl border flex items-center justify-center text-sm ${bg}`}>
      {type === "sun_purchase" && "💳"}
      {type === "creator_tip" && "☀️"}
      {type === "platform_commission" && "🏛"}
      {type === "creator_payout" && "💸"}
    </div>
  );
}

// ─── Buy tab ───────────────────────────────────────────────────
function BuyTab({
  buyAmount,
  setBuyAmount,
  buyCurrency,
  setBuyCurrency,
  sunsPreview,
  buying,
  buyResult,
  setBuyResult,
  onSubmit,
}: {
  buyAmount: number;
  setBuyAmount: (n: number) => void;
  buyCurrency: FiatCurrency;
  setBuyCurrency: (c: FiatCurrency) => void;
  sunsPreview: number;
  buying: boolean;
  buyResult: { ok: boolean; msg: string } | null;
  setBuyResult: (r: null) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="bg-surface-200 border border-gold-400/20 rounded-2xl p-5">
      <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
        <ZuvaSunIcon size={18} glow /> Buy Suns
      </h2>

      {buyResult ? (
        <div className="text-center py-4">
          <div className={`text-2xl mb-3`}>{buyResult.ok ? "☀️" : "⚠️"}</div>
          <p className={`font-semibold ${buyResult.ok ? "text-gold-300" : "text-red-400"}`}>
            {buyResult.msg}
          </p>
          <button
            onClick={() => setBuyResult(null)}
            className="mt-4 w-full bg-gold-400/20 text-gold-300 border border-gold-400/30 rounded-xl py-2.5 font-medium"
          >
            Buy More
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Currency selector */}
          <div>
            <label className="block text-zinc-300 text-sm mb-1.5 font-medium">Currency</label>
            <div className="grid grid-cols-2 gap-2">
              {FIAT_CURRENCIES.map(({ value, label, symbol }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBuyCurrency(value)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all
                    ${buyCurrency === value
                      ? "bg-gold-400 text-black border-gold-400 shadow-gold"
                      : "bg-surface-300 text-zinc-400 border-gold-400/20 hover:text-gold-300"
                    }`}
                >
                  {symbol} {value} — {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-zinc-300 text-sm mb-1.5 font-medium">
              Amount ({buyCurrency})
            </label>
            <input
              type="number"
              min={1}
              step={0.01}
              value={buyAmount}
              onChange={(e) => setBuyAmount(Math.max(1, Number(e.target.value)))}
              className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-lg font-bold rounded-xl px-4 py-3 outline-none"
            />
          </div>

          {/* Preview */}
          <div className="bg-surface-300 border border-gold-400/15 rounded-xl p-4 text-center">
            <p className="text-zinc-400 text-xs mb-1">You will receive approximately</p>
            <div className="flex items-center justify-center gap-2">
              <ZuvaSunIcon size={24} glow />
              <span className="text-3xl font-bold text-gold-400 tabular-nums">
                {sunsPreview.toLocaleString()}
              </span>
            </div>
            <p className="text-zinc-500 text-xs mt-1">
              Exact amount confirmed at checkout based on live exchange rate
            </p>
          </div>

          <button
            type="submit"
            disabled={buying}
            className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 shadow-gold flex items-center justify-center gap-2"
          >
            {buying ? (
              <span className="animate-pulse">Processing...</span>
            ) : (
              <>
                <ZuvaSunIcon size={18} />
                Buy {sunsPreview.toLocaleString()} Suns
              </>
            )}
          </button>

          <p className="text-zinc-600 text-xs text-center">
            Powered by Chimoney. Secure card, bank & mobile money payments.
          </p>
        </form>
      )}
    </div>
  );
}

// ─── Small helpers ─────────────────────────────────────────────
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-300/60 rounded-xl p-2.5 text-center">
      <div className="text-zinc-500 text-[10px] uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-gold-300 font-bold text-sm flex items-center justify-center gap-0.5">
        <ZuvaSunIcon size={11} />
        {value}
      </div>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CashoutIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M12 9v6M9 12l3-3 3 3" />
    </svg>
  );
}
