"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { CreatorEarnings } from "@/lib/types";
import { getCreatorEarnings } from "@/lib/api";
import { formatSuns, tierInfo } from "@/lib/utils";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";
import TipModal from "@/components/TipModal";
import { ProfileSkeleton } from "@/components/LoadingSkeleton";

export default function CreatorProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [creator, setCreator] = useState<CreatorEarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        const data = await getCreatorEarnings(username);
        setCreator(data.earnings);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Creator not found");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [username]);

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-8"><ProfileSkeleton /></div>;

  if (error || !creator) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <ZuvaSunIcon size={48} className="mx-auto mb-4 opacity-30" />
        <h1 className="text-white font-bold text-xl mb-2">Creator not found</h1>
        <p className="text-zinc-500 text-sm mb-6">{error}</p>
        <Link href="/feed" className="bg-gold-400/15 text-gold-400 border border-gold-400/25 px-6 py-2.5 rounded-xl font-medium">
          Back to Feed
        </Link>
      </div>
    );
  }

  const tier = tierInfo(creator.tier);

  return (
    <>
      <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
        {/* Profile card */}
        <div className="bg-surface-200 border border-gold-400/15 rounded-3xl p-6 mb-5 shadow-gold">
          <div className="flex items-start gap-5 mb-6">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-gold-400/20 border-2 border-gold-400/40 flex items-center justify-center text-3xl font-bold text-gold-400 shadow-gold">
                {creator.display_name?.[0]?.toUpperCase() ?? "C"}
              </div>
              <span
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-surface-200 flex items-center justify-center"
                style={{ backgroundColor: tier.color }} title={tier.label}
              >
                <ZuvaSunIcon size={12} />
              </span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-white font-bold text-2xl leading-tight mb-0.5">{creator.display_name}</h1>
              <p className="text-zinc-500 text-sm mb-2">@{creator.username}</p>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border"
                style={{ color: tier.color, borderColor: `${tier.color}40`, backgroundColor: `${tier.color}15` }}
              >
                <ZuvaSunIcon size={11} /> {tier.label}
              </span>
            </div>

            {/* Tip button */}
            <button
              onClick={() => setShowTip(true)}
              className="shrink-0 flex items-center gap-2 bg-gold-400 hover:bg-gold-300 text-black font-bold px-4 py-2.5 rounded-xl transition-all shadow-gold text-sm"
            >
              <ZuvaSunIcon size={16} /> Tip
            </button>
          </div>

          {creator.bio && (
            <p className="text-zinc-400 text-sm leading-relaxed mb-5 border-t border-gold-400/8 pt-4">{creator.bio}</p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Balance"      value={<><ZuvaSunIcon size={13} className="inline mr-0.5" />{formatSuns(creator.balance_suns)}</>}       sub={`$${creator.balance_usd} USD`} />
            <StatCard label="Total Earned" value={<><ZuvaSunIcon size={13} className="inline mr-0.5" />{formatSuns(creator.total_earned_suns)}</>}  sub={`$${creator.earned_usd} USD`}  />
            <StatCard label="Creator Split" value={`${creator.creator_share_pct}%`} sub={`${creator.platform_share_pct}% platform`} />
            {creator.follower_count != null && (
              <StatCard label="Followers" value={formatSuns(creator.follower_count)} sub="" />
            )}
          </div>
        </div>

        {/* Revenue split */}
        <div className="bg-surface-200 border border-gold-400/12 rounded-2xl p-5 mb-5">
          <h2 className="text-gold-400 font-semibold text-sm mb-3 flex items-center gap-2">
            <ZuvaSunIcon size={14} /> Revenue Split
          </h2>
          <div className="flex gap-0.5 h-3 rounded-full overflow-hidden mb-2">
            <div className="bg-gold-400 transition-all rounded-l-full" style={{ width: `${creator.creator_share_pct}%` }} />
            <div className="bg-surface-50 transition-all rounded-r-full" style={{ width: `${creator.platform_share_pct}%` }} />
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-gold-400">{creator.creator_share_pct}% Creator</span>
            <span className="text-zinc-600">{creator.platform_share_pct}% Platform</span>
          </div>
          <p className="text-zinc-700 text-xs mt-3">
            Commission deducted at tip time — no second cut at cashout.
          </p>
        </div>

        <div className="text-center">
          <Link href="/feed" className="text-zinc-600 hover:text-gold-400 text-sm transition-colors">← Back to Feed</Link>
        </div>
      </div>

      {showTip && (
        <TipModal creatorId={creator.creator_id} creatorName={creator.display_name} onClose={() => setShowTip(false)} />
      )}
    </>
  );
}

function StatCard({ label, value, sub }: { label: string; value: React.ReactNode; sub: string }) {
  return (
    <div className="bg-surface-300 border border-gold-400/10 rounded-xl p-3 text-center">
      <div className="text-zinc-600 text-xs mb-1">{label}</div>
      <div className="text-white font-bold text-sm flex items-center justify-center gap-0.5">{value}</div>
      {sub && <div className="text-zinc-600 text-[10px] mt-0.5">{sub}</div>}
    </div>
  );
}
