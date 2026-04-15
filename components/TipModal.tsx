"use client";

import { useState } from "react";
import type { Orientation } from "@/lib/types";
import { tipCreator } from "@/lib/api";
import { formatSuns } from "@/lib/utils";
import ZuvaSunIcon from "./ZuvaSunIcon";

const QUICK_AMOUNTS = [10, 50, 100, 500, 1000];

interface TipModalProps {
  creatorId:    string;
  creatorName:  string;
  contentId?:   string;
  orientation?: Orientation;
  onClose:      () => void;
}

export default function TipModal({ creatorId, creatorName, contentId, orientation, onClose }: TipModalProps) {
  const [amount,  setAmount]  = useState(50);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState<{ success: boolean; msg: string } | null>(null);

  async function handleTip() {
    setLoading(true);
    try {
      const resp = await tipCreator(creatorId, amount, { contentId, orientation, message: message || undefined });
      setResult({ success: true, msg: resp.message });
    } catch (err: unknown) {
      setResult({ success: false, msg: err instanceof Error ? err.message : "Tip failed" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-surface-200 border border-gold-400/20 rounded-t-3xl md:rounded-3xl p-6 animate-slide-up shadow-gold-lg">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-white font-bold text-lg">Send Suns</h2>
            <p className="text-zinc-500 text-sm">to @{creatorName}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {result ? (
          <div className="text-center py-4">
            {result.success ? (
              <>
                <ZuvaSunIcon size={52} glow className="mx-auto mb-3" />
                <p className="text-gold-400 font-semibold text-base">{result.msg}</p>
              </>
            ) : (
              <>
                <p className="text-red-400 font-semibold mb-1">Tip failed</p>
                <p className="text-zinc-500 text-sm">{result.msg}</p>
              </>
            )}
            <button
              onClick={onClose}
              className="mt-5 w-full bg-gold-400/15 text-gold-400 border border-gold-400/25 rounded-xl py-2.5 font-medium hover:bg-gold-400/25 transition-colors"
            >
              {result.success ? "Done" : "Close"}
            </button>
          </div>
        ) : (
          <>
            {/* Amount display */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <ZuvaSunIcon size={44} glow />
              <span className="text-5xl font-bold text-gold-400 tabular-nums">
                {amount.toLocaleString()}
              </span>
            </div>

            {/* Slider */}
            <input
              type="range" min={10} max={1000} step={10}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="gold-range w-full mb-2"
            />
            <div className="flex justify-between text-xs text-zinc-600 mb-5">
              <span>10</span><span>1,000</span>
            </div>

            {/* Quick amounts */}
            <div className="flex gap-2 mb-5">
              {QUICK_AMOUNTS.map((q) => (
                <button
                  key={q}
                  onClick={() => setAmount(q)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all border
                    ${amount === q
                      ? "bg-gold-400 text-black border-gold-400 shadow-gold"
                      : "bg-gold-400/8 text-gold-400 border-gold-400/20 hover:bg-gold-400/15"
                    }`}
                >
                  {formatSuns(q)}
                </button>
              ))}
            </div>

            {/* Message */}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 280))}
              placeholder="Add a message… (optional)"
              rows={2}
              className="w-full bg-surface-100 border border-gold-400/15 text-white text-sm rounded-xl px-4 py-3 mb-3 resize-none outline-none focus:border-gold-400/40 placeholder-zinc-700"
            />

            {/* USD equivalent */}
            <p className="text-center text-zinc-600 text-xs mb-5">
              ≈ ${(amount / 1000).toFixed(2)} USD
            </p>

            {/* Send */}
            <button
              onClick={handleTip}
              disabled={loading}
              className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-gold"
            >
              {loading ? (
                <span className="animate-pulse">Sending…</span>
              ) : (
                <><ZuvaSunIcon size={18} /> Send {amount.toLocaleString()} Suns</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
