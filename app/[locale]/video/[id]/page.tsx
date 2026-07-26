"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Eye, Clock, Tag, Flag, X, Film, Heart } from "lucide-react";
import type { VideoResponse } from "@/lib/types";
import {
  likeVideo,
  unlikeVideo,
  subscribeCreator,
  unsubscribeCreator,
} from "@/lib/api";
import { formatDuration, formatCount, timeAgoLong } from "@/lib/utils";
import CommentsSection from "@/components/CommentsSection";

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
  const { getToken } = useAuth();
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
      // Reporting works for signed-out viewers too — only attach a token
      // when one is available so the report can be attributed if signed in.
      const token = await getToken().catch(() => null);
      const res = await fetch(`${BACKEND_URL}/api/video/${videoId}/report`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
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

/** Render description text with bare URLs converted to safe links. */
function AutoLinkedText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold-400 hover:text-gold-300 underline underline-offset-2 break-all"
          >
            {part}
          </a>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function Description({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  // Cheap heuristic for whether the collapse control is worth showing.
  const isLong = text.length > 180 || text.split("\n").length > 3;

  return (
    <div className="bg-surface-200 border border-gold-400/10 rounded-xl px-4 py-3 mb-5">
      <p
        className={`text-zinc-400 text-sm leading-relaxed whitespace-pre-wrap ${
          expanded ? "" : "line-clamp-3"
        }`}
      >
        <AutoLinkedText text={text} />
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((e) => !e)}
          className="text-zinc-500 hover:text-gold-400 text-xs font-semibold mt-1.5 transition-colors"
        >
          {expanded ? "Show less" : "...more"}
        </button>
      )}
      {/* Links / merch shelf lands here in the upcoming monetization task */}
    </div>
  );
}

export default function VideoPlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { isSignedIn } = useUser();

  const [data, setData]       = useState<VideoResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [showReport, setShowReport] = useState(false);

  // Engagement state (seeded from the video response, mutated optimistically)
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBusy, setLikeBusy] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [subBusy, setSubBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Send the token when available so viewer.has_liked / is_subscribed
      // reflect the signed-in user; anonymous viewers get false/false.
      const token = await getToken().catch(() => null);
      const res = await fetch(`${BACKEND_URL}/api/video/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Video not found");
      }
      const json: VideoResponse = await res.json();
      setData(json);
      setLiked(json.viewer?.has_liked ?? false);
      setLikeCount(json.video.like_count ?? 0);
      setSubscribed(json.viewer?.is_subscribed ?? false);
      setFollowerCount(json.creator.follower_count ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Video not found");
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleLike() {
    if (!data || likeBusy) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    // Optimistic flip; rollback on failure.
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevCount + (prevLiked ? -1 : 1));
    setLikeBusy(true);
    try {
      const token = await getToken();
      const resp = prevLiked
        ? await unlikeVideo(token, data.video.id)
        : await likeVideo(token, data.video.id);
      // Server count is authoritative (trigger-recomputed)
      setLiked(resp.liked);
      setLikeCount(resp.like_count);
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    } finally {
      setLikeBusy(false);
    }
  }

  async function toggleSubscribe() {
    if (!data || subBusy) return;
    if (!isSignedIn) {
      router.push("/sign-in");
      return;
    }
    const prevSub = subscribed;
    const prevCount = followerCount;
    setSubscribed(!prevSub);
    setFollowerCount(prevCount + (prevSub ? -1 : 1));
    setSubBusy(true);
    try {
      const token = await getToken();
      const resp = prevSub
        ? await unsubscribeCreator(token, data.creator.id)
        : await subscribeCreator(token, data.creator.id);
      setSubscribed(resp.subscribed);
      setFollowerCount(resp.follower_count);
    } catch {
      setSubscribed(prevSub);
      setFollowerCount(prevCount);
    } finally {
      setSubBusy(false);
    }
  }

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
  const creatorName = creator.display_name || creator.username;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24 md:pb-6 animate-fade-in">
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

      {/* Title */}
      <h1 className="text-white font-bold text-xl sm:text-2xl mb-2">{video.title}</h1>

      {/* Meta row: views · date on the left, like (+ future tip) on the right */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-x-3 text-zinc-500 text-sm">
          <span className="flex items-center gap-1.5">
            <Eye size={14} /> {formatCount(video.view_count)} views
          </span>
          <span aria-hidden>·</span>
          <span>{timeAgoLong(video.created_at)}</span>
          <span className="bg-gold-400/10 text-gold-400 border border-gold-400/25 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {video.category}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLike}
            disabled={likeBusy}
            aria-pressed={liked}
            className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-all disabled:opacity-60
              ${liked
                ? "bg-gold-400 text-black border-gold-400 shadow-gold"
                : "bg-surface-200 text-zinc-300 border-gold-400/25 hover:border-gold-400/60 hover:text-gold-300"
              }`}
          >
            <Heart size={16} className={liked ? "fill-current" : ""} />
            {formatCount(likeCount)}
          </button>
          {/* Tip button slot — filled by the upcoming monetization task */}
          <div className="w-16" aria-hidden />
          <button
            onClick={() => setShowReport(true)}
            className="text-zinc-600 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
            title="Report this video"
          >
            <Flag size={15} />
          </button>
        </div>
      </div>

      {/* Channel bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface-200 border border-gold-400/15 rounded-xl px-4 py-3 mb-5">
        <Link href={`/channel/${creator.username}`} className="flex items-center gap-3 group min-w-0">
          <div className="w-11 h-11 rounded-full overflow-hidden bg-gold-400/15 border border-gold-400/30 flex items-center justify-center text-base font-bold text-gold-400 shrink-0">
            {creator.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              creatorName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-semibold group-hover:text-gold-400 transition-colors truncate">
              {creatorName}
            </p>
            <p className="text-zinc-500 text-xs">
              {formatCount(followerCount)} {followerCount === 1 ? "follower" : "followers"}
            </p>
          </div>
        </Link>

        <button
          onClick={toggleSubscribe}
          disabled={subBusy}
          className={`shrink-0 text-sm font-bold px-5 py-2 rounded-full transition-all disabled:opacity-60
            ${subscribed
              ? "bg-transparent text-gold-400 border border-gold-400/50 hover:bg-gold-400/10"
              : "bg-gold-400 hover:bg-gold-300 text-black shadow-gold"
            }`}
        >
          {subBusy ? "…" : subscribed ? "Subscribed" : "Subscribe"}
        </button>
      </div>

      {/* Description (collapsed to 3 lines, auto-linked URLs) */}
      {video.description && <Description text={video.description} />}

      {/* Tags */}
      {video.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
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

      {/* Comments */}
      <CommentsSection videoId={video.id} initialCount={video.comment_count ?? 0} />

      {/* Related videos */}
      {related_videos.length > 0 && (
        <div className="mt-10">
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
                  <p className="text-zinc-500 text-[11px] mt-1">{formatCount(rv.view_count)} views</p>
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
