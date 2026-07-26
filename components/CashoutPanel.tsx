"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import type { PayoutMethodOption, PayoutRecord } from "@/lib/types";
import { getPayoutOptions, getPayoutHistory, cashoutSuns, ApiError } from "@/lib/api";
import { formatSuns, timeAgo } from "@/lib/utils";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

const SUNS_PER_USD = 1000;

type Step = "form" | "confirm" | "done";

const METHOD_LABELS: Record<string, string> = {
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
  cash_pickup: "Cash Pickup",
};

const PROVIDER_LABELS: Record<string, string> = {
  flutterwave: "Flutterwave",
  mukuru: "Mukuru",
  wipay: "WiPay",
  wise: "Wise",
};

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-zinc-500/10 text-zinc-400 border-zinc-500/25",
  processing: "bg-gold-400/10 text-gold-400 border-gold-400/25",
  completed:  "bg-green-500/10 text-green-400 border-green-500/25",
  failed:     "bg-red-400/10 text-red-400 border-red-400/25",
};

export default function CashoutPanel({
  balanceSuns,
  onCashoutComplete,
}: {
  balanceSuns: number;
  onCashoutComplete: () => void;
}) {
  const { getToken } = useAuth();

  // null = loading; "not-creator" = 403 from the options endpoint
  const [methods, setMethods] = useState<PayoutMethodOption[] | "not-creator" | null>(null);
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [history, setHistory] = useState<PayoutRecord[] | null>(null);

  const [selected, setSelected] = useState<PayoutMethodOption | null>(null);
  const [step, setStep] = useState<Step>("form");
  const [amountSuns, setAmountSuns] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [bankAccountRef, setBankAccountRef] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const token = await getToken();
      const data = await getPayoutHistory(token);
      setHistory(data.payouts);
    } catch {
      setHistory([]); // history is secondary — don't block the panel on it
    }
  }, [getToken]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const data = await getPayoutOptions(token);
        setMethods(data.methods);
        const firstConfigured = data.methods.find((m) => m.configured);
        setSelected(firstConfigured ?? null);
      } catch (err) {
        if (err instanceof ApiError && err.status === 403) {
          setMethods("not-creator");
        } else {
          setOptionsError(err instanceof Error ? err.message : "Could not load payout options");
        }
        return;
      }
      loadHistory();
    })();
  }, [getToken, loadHistory]);

  const usdAmount = amountSuns / SUNS_PER_USD;
  const amountValid =
    selected !== null &&
    Number.isInteger(amountSuns) &&
    amountSuns >= selected.minSuns &&
    amountSuns <= balanceSuns;
  const detailsValid =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    (selected?.method === "mobile_money"
      ? phoneNumber.trim().length >= 8
      : selected?.method === "bank_transfer"
        ? bankAccountRef.trim().length > 0
        : true);

  async function handleConfirm() {
    if (!selected) return;
    setSubmitting(true);
    setResult(null);
    try {
      const token = await getToken();
      const resp = await cashoutSuns(token, {
        amountSuns,
        channel: selected.method,
        recipientFirstName: firstName.trim(),
        recipientLastName: lastName.trim(),
        ...(selected.method === "mobile_money" ? { phoneNumber: phoneNumber.trim() } : {}),
        ...(selected.method === "bank_transfer"
          ? { bankAccountRef: bankAccountRef.trim(), ...(bankCode.trim() ? { bankCode: bankCode.trim() } : {}) }
          : {}),
      });
      setResult({ ok: true, msg: resp.message });
      setStep("done");
      onCashoutComplete();
      loadHistory();
    } catch (err) {
      const msg =
        err instanceof ApiError && err.code === "PAYOUTS_NOT_CONFIGURED"
          ? "This payout method isn't live yet — your Suns were not touched. Check back soon!"
          : err instanceof Error
            ? err.message
            : "Cashout failed";
      setResult({ ok: false, msg });
      setStep("done");
      onCashoutComplete(); // refresh balance either way — failures re-credit
      loadHistory();
    } finally {
      setSubmitting(false);
    }
  }

  function resetFlow() {
    setStep("form");
    setResult(null);
    setAmountSuns(0);
  }

  // ── Loading / gated states ────────────────────────────────────
  if (methods === null && !optionsError) {
    return (
      <div className="bg-surface-200 border border-gold-400/15 rounded-2xl p-8 text-center">
        <div className="w-6 h-6 mx-auto border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (methods === "not-creator") {
    return (
      <div className="bg-surface-200 border border-gold-400/15 rounded-2xl p-8 text-center">
        <ZuvaSunIcon size={32} className="mx-auto mb-3 opacity-40" />
        <p className="text-white font-semibold mb-1">Cashing out is for creators</p>
        <p className="text-zinc-500 text-sm">
          Apply to become a Zuva creator to earn Suns and withdraw them as real money.
        </p>
      </div>
    );
  }

  if (optionsError) {
    return (
      <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
        {optionsError}
      </p>
    );
  }

  const methodList = methods as PayoutMethodOption[];

  return (
    <div className="space-y-4">
      {/* ── Cashout card ───────────────────────────────────────── */}
      <div className="bg-surface-200 border border-gold-400/20 rounded-2xl p-5">
        <h2 className="text-white font-bold text-base mb-1 flex items-center gap-2">
          <ZuvaSunIcon size={18} glow /> Cash Out
        </h2>
        <p className="text-zinc-500 text-xs mb-4">
          Balance: <span className="text-gold-300 font-semibold">{formatSuns(balanceSuns)} Suns</span>
          {" "}≈ ${(balanceSuns / SUNS_PER_USD).toFixed(2)} USD
        </p>

        {methodList.length === 0 ? (
          <p className="text-zinc-400 text-sm bg-surface-300 border border-gold-400/10 rounded-xl px-4 py-3">
            Payouts aren&apos;t available in your country yet. We&apos;re adding new regions —
            check back soon.
          </p>
        ) : step === "done" && result ? (
          <div className="text-center py-4">
            <div className="text-2xl mb-3">{result.ok ? "💸" : "⚠️"}</div>
            <p className={`font-semibold ${result.ok ? "text-gold-300" : "text-red-400"}`}>
              {result.msg}
            </p>
            {!result.ok && (
              <p className="text-zinc-500 text-sm mt-2">
                Your Suns balance is unchanged.
              </p>
            )}
            <button
              onClick={resetFlow}
              className="mt-4 w-full bg-gold-400/20 text-gold-300 border border-gold-400/30 rounded-xl py-2.5 font-medium"
            >
              Done
            </button>
          </div>
        ) : step === "confirm" && selected ? (
          <div className="space-y-4">
            <div className="bg-surface-300 border border-gold-400/15 rounded-xl p-4 space-y-2 text-sm">
              <Row label="You cash out">
                <span className="text-gold-300 font-bold">{formatSuns(amountSuns)} Suns</span>
              </Row>
              <Row label="You'll receive">
                <span className="text-white font-bold">${usdAmount.toFixed(2)} USD</span>
                {selected.currency && selected.currency !== "USD" && (
                  <span className="text-zinc-500"> (paid in {selected.currency})</span>
                )}
              </Row>
              <Row label="Method">
                <span className="text-white">
                  {METHOD_LABELS[selected.method]}
                  {selected.network ? ` · ${selected.network}` : ""}
                  {" via "}
                  {PROVIDER_LABELS[selected.provider] ?? selected.provider}
                </span>
              </Row>
              <Row label="Recipient">
                <span className="text-white">{firstName.trim()} {lastName.trim()}</span>
              </Row>
              {selected.method === "mobile_money" && (
                <Row label="Phone"><span className="text-white">{phoneNumber.trim()}</span></Row>
              )}
              {selected.method === "bank_transfer" && (
                <Row label="Account"><span className="text-white">{bankAccountRef.trim()}</span></Row>
              )}
            </div>
            <p className="text-zinc-600 text-xs">
              The exact local-currency amount is set by the payout partner&apos;s exchange rate at
              processing time. If the payout fails, your Suns are automatically returned.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setStep("form")}
                disabled={submitting}
                className="flex-1 bg-surface-300 text-zinc-300 border border-gold-400/20 rounded-xl py-3 font-medium"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 bg-gold-400 hover:bg-gold-300 text-black font-bold rounded-xl py-3 transition-all disabled:opacity-50 shadow-gold"
              >
                {submitting ? "Sending..." : "Confirm Cashout"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Method selection */}
            <div>
              <label className="block text-zinc-300 text-sm mb-1.5 font-medium">Payout method</label>
              <div className="space-y-2">
                {methodList.map((m) => {
                  const isSelected = selected?.provider === m.provider && selected?.method === m.method;
                  return (
                    <button
                      key={`${m.provider}-${m.method}`}
                      type="button"
                      disabled={!m.configured}
                      onClick={() => setSelected(m)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all
                        ${!m.configured
                          ? "bg-surface-300/50 border-gold-400/10 opacity-60 cursor-not-allowed"
                          : isSelected
                            ? "bg-gold-400/15 border-gold-400 shadow-gold"
                            : "bg-surface-300 border-gold-400/20 hover:border-gold-400/50"
                        }`}
                    >
                      <div>
                        <div className="text-white text-sm font-semibold">
                          {METHOD_LABELS[m.method]}
                          {m.network ? ` (${m.network})` : ""}
                        </div>
                        <div className="text-zinc-500 text-xs">
                          via {PROVIDER_LABELS[m.provider] ?? m.provider} · min{" "}
                          {formatSuns(m.minSuns)} Suns (${m.minUSD})
                        </div>
                      </div>
                      {!m.configured && (
                        <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-gold-400/10 text-gold-400 border border-gold-400/25">
                          Coming Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {selected && (
              <>
                {/* Amount */}
                <div>
                  <label className="block text-zinc-300 text-sm mb-1.5 font-medium">
                    Amount (Suns)
                  </label>
                  <input
                    type="number"
                    min={selected.minSuns}
                    max={balanceSuns}
                    step={1}
                    value={amountSuns || ""}
                    placeholder={`${selected.minSuns}`}
                    onChange={(e) => setAmountSuns(Math.floor(Number(e.target.value)))}
                    className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-lg font-bold rounded-xl px-4 py-3 outline-none"
                  />
                  <p className="text-zinc-500 text-xs mt-1">
                    ≈ ${usdAmount.toFixed(2)} USD · minimum {formatSuns(selected.minSuns)} Suns
                    (${selected.minUSD})
                  </p>
                  {amountSuns > balanceSuns && (
                    <p className="text-red-400 text-xs mt-1">More than your balance.</p>
                  )}
                </div>

                {/* Legal name */}
                <div>
                  <label className="block text-zinc-300 text-sm mb-1.5 font-medium">Legal name</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={firstName}
                      maxLength={100}
                      placeholder="First name"
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white rounded-xl px-4 py-3 outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={lastName}
                      maxLength={100}
                      placeholder="Last name"
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white rounded-xl px-4 py-3 outline-none text-sm"
                    />
                  </div>
                  <p className="text-zinc-600 text-xs mt-1.5">
                    Must match your government ID — our payout partners require it to
                    process payments in your name.
                  </p>
                </div>

                {/* Destination */}
                {selected.method === "mobile_money" && (
                  <div>
                    <label className="block text-zinc-300 text-sm mb-1.5 font-medium">
                      Mobile money number
                    </label>
                    <input
                      type="tel"
                      value={phoneNumber}
                      placeholder="e.g. 233201234567 (include country code)"
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white rounded-xl px-4 py-3 outline-none text-sm"
                    />
                  </div>
                )}
                {selected.method === "bank_transfer" && (
                  <div className="space-y-2">
                    <label className="block text-zinc-300 text-sm mb-1.5 font-medium">
                      Bank account
                    </label>
                    <input
                      type="text"
                      value={bankAccountRef}
                      placeholder="Account number"
                      onChange={(e) => setBankAccountRef(e.target.value)}
                      className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white rounded-xl px-4 py-3 outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={bankCode}
                      placeholder="Bank code"
                      onChange={(e) => setBankCode(e.target.value)}
                      className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white rounded-xl px-4 py-3 outline-none text-sm"
                    />
                  </div>
                )}

                <button
                  onClick={() => setStep("confirm")}
                  disabled={!amountValid || !detailsValid}
                  className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-gold"
                >
                  Review Cashout
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Payout history ─────────────────────────────────────── */}
      <div className="bg-surface-200 border border-gold-400/15 rounded-2xl p-5">
        <h3 className="text-white font-bold text-sm mb-3">Payout History</h3>
        {history === null ? (
          <p className="text-zinc-600 text-sm">Loading…</p>
        ) : history.length === 0 ? (
          <p className="text-zinc-600 text-sm">No payouts yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-surface-300/60 border border-gold-400/10 rounded-xl px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-white text-sm font-medium">
                    {formatSuns(p.amount_suns)} Suns → ${p.usd_amount}
                  </p>
                  <p className="text-zinc-500 text-xs">
                    {METHOD_LABELS[p.channel] ?? p.channel}
                    {p.provider ? ` via ${PROVIDER_LABELS[p.provider] ?? p.provider}` : ""}
                    {" · "}
                    {timeAgo(p.created_at)}
                  </p>
                  {p.status === "failed" && (
                    <p className="text-zinc-500 text-xs mt-0.5">
                      Suns were returned to your balance.
                    </p>
                  )}
                </div>
                <span
                  className={`shrink-0 ml-3 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[p.status] ?? STATUS_STYLES.pending}`}
                >
                  {p.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
