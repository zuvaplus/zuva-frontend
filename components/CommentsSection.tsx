"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import { MessageCircle, Trash2, CornerDownRight } from "lucide-react";
import type { VideoComment } from "@/lib/types";
import { getComments, postComment, deleteComment } from "@/lib/api";
import { formatCount, timeAgoLong } from "@/lib/utils";

function Avatar({ name, avatarUrl, size = 36 }: { name: string; avatarUrl: string | null; size?: number }) {
  return (
    <div
      className="rounded-full overflow-hidden bg-gold-400/15 border border-gold-400/30 flex items-center justify-center font-bold text-gold-400 shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

function CommentBody({
  comment,
  onReply,
  onDelete,
  deletingId,
  isReply,
}: {
  comment: VideoComment;
  onReply?: (c: VideoComment) => void;
  onDelete: (c: VideoComment) => void;
  deletingId: string | null;
  isReply?: boolean;
}) {
  const name = comment.user.display_name || comment.user.username || "User";
  const deleted = comment.status === "deleted";

  return (
    <div className="flex gap-3">
      <Avatar name={deleted ? "?" : name} avatarUrl={deleted ? null : comment.user.avatar_url} size={isReply ? 28 : 36} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-white text-sm font-semibold">{deleted ? "Deleted" : name}</span>
          <span className="text-zinc-600 text-xs">{timeAgoLong(comment.created_at)}</span>
        </div>
        {deleted ? (
          <p className="text-zinc-600 text-sm italic mt-0.5">This comment was deleted.</p>
        ) : (
          <p className="text-zinc-300 text-sm mt-0.5 whitespace-pre-wrap break-words">{comment.body}</p>
        )}
        {!deleted && (
          <div className="flex items-center gap-4 mt-1.5">
            {onReply && (
              <button
                onClick={() => onReply(comment)}
                className="flex items-center gap-1 text-zinc-500 hover:text-gold-400 text-xs font-medium transition-colors"
              >
                <CornerDownRight size={12} /> Reply
              </button>
            )}
            {comment.is_own && (
              <button
                onClick={() => onDelete(comment)}
                disabled={deletingId === comment.id}
                className="flex items-center gap-1 text-zinc-600 hover:text-red-400 text-xs font-medium transition-colors disabled:opacity-50"
              >
                <Trash2 size={12} /> {deletingId === comment.id ? "Deleting…" : "Delete"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentsSection({
  videoId,
  initialCount,
}: {
  videoId: string;
  initialCount: number;
}) {
  const { getToken } = useAuth();
  const { isSignedIn, user } = useUser();

  const [comments, setComments] = useState<VideoComment[] | null>(null);
  const [count, setCount] = useState(initialCount);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<VideoComment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(
    async (pageNum: number, append: boolean) => {
      try {
        const token = await getToken().catch(() => null);
        const data = await getComments(token, videoId, pageNum);
        setComments((prev) => (append && prev ? [...prev, ...data.comments] : data.comments));
        setCount(data.comment_count);
        setHasMore(data.has_more);
        setPage(data.page);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load comments");
      }
    },
    [getToken, videoId]
  );

  useEffect(() => {
    load(1, false);
  }, [load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = draft.trim();
    if (!body || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      const { comment } = await postComment(token, videoId, body, replyTo?.id);
      if (replyTo) {
        setComments((prev) =>
          prev?.map((c) =>
            c.id === replyTo.id ? { ...c, replies: [...(c.replies ?? []), comment] } : c
          ) ?? null
        );
      } else {
        setComments((prev) => [{ ...comment, replies: [] }, ...(prev ?? [])]);
      }
      setCount((n) => n + 1);
      setDraft("");
      setReplyTo(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post comment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(comment: VideoComment) {
    setDeletingId(comment.id);
    try {
      const token = await getToken();
      await deleteComment(token, comment.id);
      setComments((prev) => {
        if (!prev) return prev;
        if (comment.parent_comment_id) {
          // Deleted replies disappear entirely (matches the API's read shape)
          return prev.map((c) =>
            c.id === comment.parent_comment_id
              ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== comment.id) }
              : c
          );
        }
        // Deleted top-level comments stay as a "[deleted]" shell
        return prev.map((c) =>
          c.id === comment.id ? { ...c, status: "deleted" as const, body: null } : c
        );
      });
      setCount((n) => Math.max(0, n - 1));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete comment");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="mt-8">
      <h2 className="flex items-center gap-2 text-white font-bold text-base mb-4">
        <MessageCircle size={18} className="text-gold-400" />
        {formatCount(count)} {count === 1 ? "Comment" : "Comments"}
      </h2>

      {/* Composer */}
      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyTo && (
            <div className="flex items-center justify-between bg-surface-200 border border-gold-400/15 rounded-t-xl px-3 py-1.5 text-xs text-zinc-400">
              <span className="truncate">
                Replying to{" "}
                <span className="text-gold-400">
                  {replyTo.user.display_name || replyTo.user.username}
                </span>
              </span>
              <button type="button" onClick={() => setReplyTo(null)} className="text-zinc-500 hover:text-white ml-2">
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <Avatar
              name={user?.firstName || user?.username || "Y"}
              avatarUrl={user?.imageUrl ?? null}
            />
            <div className="flex-1">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={2000}
                rows={2}
                placeholder={replyTo ? "Write a reply…" : "Add a comment…"}
                className={`w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-4 py-3 outline-none resize-y ${replyTo ? "rounded-t-none" : ""}`}
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-zinc-700 text-xs">{draft.length}/2000</span>
                <button
                  type="submit"
                  disabled={!draft.trim() || submitting}
                  className="bg-gold-400 hover:bg-gold-300 text-black text-sm font-bold px-5 py-2 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? "Posting…" : replyTo ? "Reply" : "Comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-surface-200 border border-gold-400/15 rounded-xl px-4 py-3 mb-6 flex items-center justify-between gap-3">
          <p className="text-zinc-400 text-sm">Sign in to join the conversation.</p>
          <Link
            href="/sign-in"
            className="shrink-0 bg-gold-400/15 text-gold-400 border border-gold-400/30 text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-gold-400/25 transition-colors"
          >
            Sign In
          </Link>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5 mb-4">
          {error}
        </p>
      )}

      {/* List */}
      {comments === null ? (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton w-9 h-9 rounded-full shrink-0" />
              <div className="flex-1">
                <div className="skeleton h-3.5 w-32 rounded mb-2" />
                <div className="skeleton h-3.5 w-3/4 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-zinc-600 text-sm py-6 text-center">
          No comments yet — be the first.
        </p>
      ) : (
        <div className="space-y-5">
          {comments.map((c) => (
            <div key={c.id}>
              <CommentBody
                comment={c}
                onReply={isSignedIn ? (target) => setReplyTo(target) : undefined}
                onDelete={handleDelete}
                deletingId={deletingId}
              />
              {(c.replies?.length ?? 0) > 0 && (
                <div className="ml-12 mt-3 space-y-3 border-l border-gold-400/10 pl-4">
                  {c.replies!.map((r) => (
                    <CommentBody
                      key={r.id}
                      comment={r}
                      onDelete={handleDelete}
                      deletingId={deletingId}
                      isReply
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {hasMore && comments !== null && (
        <button
          onClick={async () => {
            setLoadingMore(true);
            await load(page + 1, true);
            setLoadingMore(false);
          }}
          disabled={loadingMore}
          className="mt-5 w-full py-2.5 bg-surface-200 border border-gold-400/15 text-gold-300 text-sm font-medium rounded-xl hover:bg-surface-100 transition-colors disabled:opacity-50"
        >
          {loadingMore ? "Loading…" : "Load more comments"}
        </button>
      )}
    </section>
  );
}
