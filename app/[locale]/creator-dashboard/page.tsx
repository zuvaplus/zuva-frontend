"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useUser, useAuth } from "@clerk/nextjs";
import {
  UploadCloud, Film, Settings as SettingsIcon, Wallet as WalletIcon,
  Eye, Heart, MessageCircle, ExternalLink, ArrowRight,
} from "lucide-react";
import { useUserRole } from "@/components/UserRoleProvider";
import VideoUploadForm from "@/components/VideoUploadForm";
import CreatorLinksManager from "@/components/CreatorLinksManager";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";
import type { UploadedVideo, WalletBalance, Transaction } from "@/lib/types";
import { getMyVideos, getWalletBalance, getLedger, updateChannel } from "@/lib/api";
import { formatCount, timeAgo } from "@/lib/utils";

type Tab = "upload" | "videos" | "settings";
const TABS: { key: Tab; icon: React.ComponentType<{ size?: number }> }[] = [
  { key: "upload", icon: UploadCloud },
  { key: "videos", icon: Film },
  { key: "settings", icon: SettingsIcon },
];

const STATUS_STYLES: Record<string, string> = {
  pending:       "bg-zinc-500/10 text-zinc-400 border-zinc-500/25",
  published:     "bg-green-500/10 text-green-400 border-green-500/25",
  rejected:      "bg-red-400/10 text-red-400 border-red-400/25",
  flagged:       "bg-gold-400/10 text-gold-400 border-gold-400/25",
  under_review:  "bg-blue-400/10 text-blue-400 border-blue-400/25",
};

function VideoStatusBadge({ status }: { status: string }) {
  const t = useTranslations("Status");
  return (
    <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
      {t.has(status) ? t(status) : status.replace("_", " ")}
    </span>
  );
}

function WalletSummaryCard() {
  const t = useTranslations("CreatorDashboard");
  const { getToken } = useAuth();
  const [wallet, setWallet] = useState<WalletBalance | null>(null);
  const [recentTips, setRecentTips] = useState<Transaction[] | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const [walletData, ledgerData] = await Promise.all([
          getWalletBalance(token),
          getLedger(token, 1, 20),
        ]);
        setWallet(walletData.wallet);
        setRecentTips(
          (ledgerData.transactions ?? [])
            .filter((tx) => tx.type === "creator_tip" && tx.direction === "credit")
            .slice(0, 3)
        );
      } catch {
        // Wallet summary is secondary on this page — fail quietly, the
        // full /wallet page is always one click away regardless.
        setWallet(null);
        setRecentTips([]);
      }
    })();
  }, [getToken]);

  return (
    <div className="bg-surface-200 border border-gold-400/25 rounded-2xl p-5 mb-6 shadow-gold relative overflow-hidden">
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-gold-400/10 blur-3xl pointer-events-none" />
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ZuvaSunIcon size={36} glow />
          <div>
            <p className="text-zinc-400 text-xs mb-0.5">{t("walletBalance")}</p>
            {wallet ? (
              <p className="text-2xl font-bold text-gold-400 tabular-nums leading-none">
                {formatCount(wallet.balance_suns)}
                <span className="text-zinc-500 text-sm font-normal ml-2">
                  ≈ ${wallet.balance_usd_equivalent} USD
                </span>
              </p>
            ) : (
              <div className="skeleton h-7 w-32 rounded" />
            )}
          </div>
        </div>
        <Link
          href="/wallet"
          className="shrink-0 flex items-center justify-center gap-1.5 border border-gold-400/30 text-gold-400 hover:bg-gold-400/10 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <WalletIcon size={15} /> {t("openWallet")} <ArrowRight size={14} />
        </Link>
      </div>

      {recentTips !== null && recentTips.length > 0 && (
        <div className="relative mt-4 pt-4 border-t border-gold-400/10 space-y-1.5">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wide font-semibold mb-1.5">
            {t("recentTips")}
          </p>
          {recentTips.map((tx) => (
            <div key={tx.id} className="flex items-center justify-between text-xs">
              <span className="text-zinc-400 truncate">
                {tx.counterparty_username ? `@${tx.counterparty_username}` : tx.counterparty_name ?? t("aFan")}
              </span>
              <span className="text-green-400 font-semibold tabular-nums shrink-0 ml-2">
                +{formatCount(tx.amount_suns)} ☀
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MyVideosTab({ videos, loading, error }: { videos: UploadedVideo[] | null; loading: boolean; error: string | null }) {
  const t = useTranslations("CreatorDashboard");
  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
      </div>
    );
  }
  if (error) {
    return <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">{error}</p>;
  }
  if (!videos || videos.length === 0) {
    return (
      <div className="text-center py-14">
        <Film size={32} className="mx-auto mb-3 text-zinc-700" />
        <p className="text-zinc-400 text-sm">{t("noVideos")}</p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {videos.map((v) => (
        <div key={v.id} className="flex items-center gap-3 bg-surface-200 border border-gold-400/10 rounded-xl p-2.5">
          <div className="relative w-28 aspect-video bg-surface-300 rounded-lg overflow-hidden shrink-0">
            {v.thumbnail_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={v.thumbnail_url} alt="" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{v.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <VideoStatusBadge status={v.status} />
              <span className="text-zinc-600 text-xs">{timeAgo(v.created_at)}</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-zinc-500 text-xs">
              <span className="flex items-center gap-1"><Eye size={12} /> {formatCount(v.view_count)}</span>
              <span className="flex items-center gap-1"><Heart size={12} /> {formatCount(v.like_count)}</span>
              <span className="flex items-center gap-1"><MessageCircle size={12} /> {formatCount(v.comment_count)}</span>
            </div>
          </div>
          {v.status === "published" && (
            <Link
              href={`/video/${v.id}`}
              className="shrink-0 p-2 text-zinc-500 hover:text-gold-400 transition-colors"
              aria-label={t("viewVideo")}
            >
              <ExternalLink size={16} />
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const t = useTranslations("CreatorDashboard");
  const { user } = useUser();
  const { getToken } = useAuth();
  const [displayName, setDisplayName] = useState(user?.fullName ?? "");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const token = await getToken();
      await updateChannel(token, {
        ...(displayName.trim() ? { display_name: displayName.trim() } : {}),
        bio: bio.trim(),
        ...(avatarUrl.trim() ? { avatar_url: avatarUrl.trim() } : {}),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="bg-surface-200 border border-gold-400/15 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-semibold text-sm flex items-center gap-2">
          <SettingsIcon size={16} className="text-gold-400" /> {t("channelInfo")}
        </h3>

        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-xl font-bold text-gold-400 shrink-0">
            {avatarUrl || user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl || user?.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              (displayName || "C").charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <label className="block text-zinc-300 text-xs font-medium mb-1.5">{t("avatarUrl")}</label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-zinc-300 text-xs font-medium mb-1.5">{t("displayName")}</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={100}
            className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none"
          />
        </div>

        <div>
          <label className="block text-zinc-300 text-xs font-medium mb-1.5">{t("bio")}</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder={t("bioPlaceholder")}
            className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-3.5 py-2.5 outline-none resize-none"
          />
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}
        {saved && <p className="text-green-400 text-xs">{t("saved")}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-gold-400 hover:bg-gold-300 text-black font-semibold text-sm px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
        >
          {saving ? t("saving") : t("saveChanges")}
        </button>
      </form>

      <div className="bg-surface-200 border border-gold-400/15 rounded-2xl p-5">
        <CreatorLinksManager />
      </div>
    </div>
  );
}

export default function CreatorDashboardPage() {
  const t = useTranslations("CreatorDashboard");
  const { user, isLoaded } = useUser();
  const { role, userId, loading: roleLoading } = useUserRole();
  const router = useRouter();

  const authChecked = isLoaded && !roleLoading;
  const isCreator = authChecked && !!user && role === "creator";

  useEffect(() => {
    if (!authChecked) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    if (role !== "creator") {
      router.replace("/creator-signup?from=dashboard");
    }
  }, [authChecked, user, role, router]);

  const [tab, setTab] = useState<Tab>("upload");
  const [videos, setVideos] = useState<UploadedVideo[] | null>(null);
  const [videosLoading, setVideosLoading] = useState(true);
  const [videosError, setVideosError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const loadVideos = useCallback(async () => {
    setVideosLoading(true);
    try {
      const token = await getToken();
      const data = await getMyVideos(token);
      setVideos(data.videos);
      setVideosError(null);
    } catch (err) {
      setVideosError(err instanceof Error ? err.message : t("loadVideosError"));
    } finally {
      setVideosLoading(false);
    }
  }, [getToken, t]);

  useEffect(() => {
    if (!isCreator) return;
    loadVideos();
  }, [isCreator, loadVideos]);

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground px-4 sm:px-6 py-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          {t("title")}
        </h1>
        <p className="text-zinc-500 text-sm mt-1">{t("subtitle")}</p>
      </div>

      <WalletSummaryCard />

      {/* Tabs */}
      <div className="flex bg-surface-300 p-1 rounded-xl border border-gold-400/15 mb-6">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab === key ? "bg-gold-400 text-black shadow-gold" : "text-zinc-400 hover:text-gold-300"}`}
          >
            <Icon size={15} /> {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      {tab === "upload" && (
        <VideoUploadForm userId={userId} onUploaded={loadVideos} />
      )}

      {tab === "videos" && (
        <MyVideosTab videos={videos} loading={videosLoading} error={videosError} />
      )}

      {tab === "settings" && <SettingsTab />}
    </div>
  );
}
