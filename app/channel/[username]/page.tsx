"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { MapPin, Users, Film, Eye, Clock, Pencil, X } from "lucide-react";
import type { ChannelResponse } from "@/lib/types";
import { formatDuration, timeAgo } from "@/lib/utils";
import { useUserRole } from "@/components/UserRoleProvider";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

function ChannelSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <div className="flex items-center gap-5 mb-8">
        <div className="skeleton w-24 h-24 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-6 w-48 rounded" />
          <div className="skeleton h-4 w-32 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="skeleton aspect-video rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function ChannelPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useUser();
  const { userId } = useUserRole();

  const [data, setData]       = useState<ChannelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [editing, setEditing]     = useState(false);
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio]                 = useState("");
  const [countryCode, setCountryCode] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/channel/${encodeURIComponent(username)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Creator not found");
      }
      const json: ChannelResponse = await res.json();
      setData(json);
      setDisplayName(json.creator.display_name ?? "");
      setBio(json.creator.bio ?? "");
      setCountryCode(json.creator.country_code ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Creator not found");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = !!userId && !!data && userId === data.creator.id;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/channel/update`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-clerk-user-id": user.id,
        },
        body: JSON.stringify({
          display_name: displayName.trim() || undefined,
          bio: bio.trim(),
          country_code: countryCode.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Could not update channel");
      }
      setEditing(false);
      await load();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not update channel");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ChannelSkeleton />;

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Film size={40} className="mx-auto mb-4 text-zinc-700" />
        <h1 className="text-white font-bold text-xl mb-2">Channel not found</h1>
        <p className="text-zinc-500 text-sm mb-6">{error}</p>
        <Link href="/feed" className="bg-gold-400/15 text-gold-400 border border-gold-400/25 px-6 py-2.5 rounded-xl font-medium">
          Back to Feed
        </Link>
      </div>
    );
  }

  const { creator, videos } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="bg-surface-200 border border-gold-400/15 rounded-3xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gold-400/15 border-2 border-gold-400/30 flex items-center justify-center text-3xl font-bold text-gold-400 shrink-0">
            {creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (creator.display_name || creator.username).charAt(0).toUpperCase()
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-2xl leading-tight mb-0.5">
              {creator.display_name || creator.username}
            </h1>
            <p className="text-zinc-500 text-sm mb-3">@{creator.username}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-zinc-400 text-sm">
              {creator.country_code && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {creator.country_code}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Users size={14} /> {creator.follower_count.toLocaleString()} followers
              </span>
              <span className="flex items-center gap-1.5">
                <Film size={14} /> {videos.length} video{videos.length === 1 ? "" : "s"}
              </span>
            </div>
          </div>

          {isOwner && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 flex items-center gap-2 border border-gold-400/30 text-gold-400 hover:bg-gold-400/10 text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              <Pencil size={15} /> Edit Channel
            </button>
          )}
        </div>

        {creator.bio && !editing && (
          <p className="text-zinc-400 text-sm leading-relaxed mt-5 border-t border-gold-400/8 pt-4">
            {creator.bio}
          </p>
        )}

        {isOwner && editing && (
          <form onSubmit={handleSave} className="mt-5 border-t border-gold-400/8 pt-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold text-sm">Edit Channel</h2>
              <button type="button" onClick={() => setEditing(false)} className="text-zinc-500 hover:text-white p-1">
                <X size={18} />
              </button>
            </div>

            <div>
              <label className="block text-zinc-300 text-xs font-medium mb-1.5">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-4 py-2.5 outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-300 text-xs font-medium mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-4 py-2.5 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-zinc-300 text-xs font-medium mb-1.5">Country Code (2 letters, e.g. NG, JM)</label>
              <input
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                maxLength={2}
                className="w-24 bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-4 py-2.5 outline-none uppercase"
              />
            </div>

            {saveError && <p className="text-red-400 text-xs">{saveError}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-gold-400 hover:bg-gold-300 text-black font-semibold text-sm px-5 py-2 rounded-xl transition-all disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-zinc-400 hover:text-white text-sm px-5 py-2 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Video grid */}
      {videos.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-12">No published videos yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {videos.map((video) => (
            <Link
              key={video.id}
              href={`/video/${video.id}`}
              className="rounded-xl overflow-hidden bg-surface-200 border border-gold-400/10 hover:border-gold-400/30 transition-colors"
            >
              <div className="relative bg-surface-300 aspect-video">
                {video.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.thumbnail_url} alt="" className="w-full h-full object-cover" />
                )}
                {video.duration_seconds != null && (
                  <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock size={10} /> {formatDuration(video.duration_seconds)}
                  </span>
                )}
              </div>
              <div className="p-2.5">
                <p className="text-white text-sm font-medium truncate">{video.title}</p>
                <div className="flex items-center gap-2 text-zinc-500 text-[11px] mt-1">
                  <span className="flex items-center gap-1"><Eye size={11} /> {video.view_count.toLocaleString()}</span>
                  <span>·</span>
                  <span>{timeAgo(video.created_at)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
