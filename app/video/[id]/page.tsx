"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Eye, Clock, Tag, Flag, X, Film } from "lucide-react";
import type { VideoResponse } from "@/lib/types";
import { formatDuration, timeAgo } from "@/lib/utils";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

const REPORT_REASONS = ["Inappropriate content", "Copyright violation", "Spam", "Other"];

function VideoSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <div className="skeleton aspect-video rounded-2xl mb-5" />
      <div className="skeleton h-6 w-2/3 rounded mb-3" />
      <div className="skeleton h-4 w-1/3 rounded" />
    </div>
  );
}

function ReportModal({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  const [reason, setReason]     = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [done, setDone]         = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/video/${videoId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Could not submit report");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit report");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm bg-surface-200 border border-gold-400/20 rounded-t-3xl md:rounded-3xl p-6">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1">
          <X size={20} />
        </button>

        {done ? (
          <div className="text-center py-4">
            <Flag size={32} className="text-gold-400 mx-auto mb-3" />
            <p className="text-white font-semibold mb-1">Report submitted</p>
            <p className="text-zinc-500 text-sm">Thanks for helping keep Zuva safe.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="text-white font-bold text-lg mb-4">Report this video</h2>
            <div className="space-y-2 mb-5">
              {REPORT_REASONS.map((r) => (
                <label
                  key={r}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors
                    ${reason === r ? "border-gold-400/50 bg-gold-400/10 text-white" : "border-gold-400/15 text-zinc-400 hover:border-gold-400/30"}`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                    className="accent-gold-400"
                  />
                  {r}
                </label>
              ))}
            </div>
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button
              type="submit"
              disabled={!reason || submitting}
              className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3 rounded-xl transition-all disabled:opacity-40"
            >
              {submitting ? "Submitting…" : "Submit Report"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();

  const [data, setData]       = useState<VideoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/video/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Video not found");
      }
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video not found");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <VideoSkeleton />;

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <Film size={40} className="mx-auto mb-4 text-zinc-700" />
        <h1 className="text-white font-bold text-xl mb-2">Video not found</h1>
        <p className="text-zinc-500 text-sm mb-6">{error}</p>
        <Link href="/feed" className="bg-gold-400/15 text-gold-400 border border-gold-400/25 px-6 py-2.5 rounded-xl font-medium">
          Back to Feed
        </Link>
      </div>
    );
  }

  const { video, creator, related_videos } = data;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      {/* Player */}
      <div className="aspect-video bg-surface-300 rounded-2xl overflow-hidden mb-5 border border-gold-400/10">
        <iframe
          src={`https://iframe.cloudflarestream.com/${video.cloudflare_video_id}`}
          style={{ border: "none", width: "100%", height: "100%" }}
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
          title={video.title}
        />
      </div>

      {/* Info */}
      <h1 className="text-white font-bold text-xl sm:text-2xl mb-3">{video.title}</h1>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link
          href={`/channel/${creator.username}`}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-sm font-bold text-gold-400 shrink-0">
            {creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              (creator.display_name || creator.username).charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <p className="text-white text-sm font-semibold group-hover:text-gold-400 transition-colors">
              {creator.display_name || creator.username}
            </p>
            <p className="text-zinc-500 text-xs">{creator.follower_count.toLocaleString()} followers</p>
          </div>
        </Link>

        <button
          onClick={() => setShowReport(true)}
          className="flex items-center gap-2 text-zinc-500 hover:text-red-400 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-400/10 transition-colors"
        >
          <Flag size={15} /> Report
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-zinc-500 text-sm mb-4 pb-4 border-b border-white/5">
        <span className="flex items-center gap-1.5"><Eye size={14} /> {video.view_count.toLocaleString()} views</span>
        <span className="flex items-center gap-1.5"><Clock size={14} /> {timeAgo(video.created_at)}</span>
        <span className="bg-gold-400/10 text-gold-400 border border-gold-400/25 text-xs font-semibold px-2.5 py-1 rounded-full">
          {video.category}
        </span>
      </div>

      {video.description && (
        <p className="text-zinc-400 text-sm leading-relaxed mb-5 whitespace-pre-wrap">{video.description}</p>
      )}

      {video.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          {video.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-200 text-zinc-400 border border-gold-400/10 text-xs"
            >
              <Tag size={11} /> {tag}
            </span>
          ))}
        </div>
      )}

      {/* Related videos */}
      {related_videos.length > 0 && (
        <div>
          <h2 className="text-zinc-400 text-sm font-semibold uppercase tracking-wide mb-3">More like this</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {related_videos.map((rv) => (
              <Link
                key={rv.id}
                href={`/video/${rv.id}`}
                className="rounded-xl overflow-hidden bg-surface-200 border border-gold-400/10 hover:border-gold-400/30 transition-colors"
              >
                <div className="relative bg-surface-300 aspect-video">
                  {rv.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={rv.thumbnail_url} alt="" className="w-full h-full object-cover" />
                  )}
                  {rv.duration_seconds != null && (
                    <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-[10px] font-medium px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Clock size={10} /> {formatDuration(rv.duration_seconds)}
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-white text-sm font-medium truncate">{rv.title}</p>
                  <p className="text-zinc-500 text-[11px] mt-1">{rv.view_count.toLocaleString()} views</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {showReport && <ReportModal videoId={video.id} onClose={() => setShowReport(false)} />}
    </div>
  );
}
