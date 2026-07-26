"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { UploadCloud, Film, Image as ImageIcon, CheckCircle2, XCircle, Captions, Plus, Trash2, Flame } from "lucide-react";
import type { UploadedVideo, UploadProcessingStatus, CaptionLanguage, ContentCategory } from "@/lib/types";
import { getUploadStatus, uploadCaptionTrack } from "@/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

const CATEGORIES = ["Comedy", "Drama", "Music", "News", "Sports", "Lifestyle", "Education", "Other"];

// The ranking-model taxonomy (videos.content_category) — separate from
// CATEGORIES above, which stays as-is. Must match CONTENT_CATEGORIES /
// DOC_DISCUSSION_CATEGORIES in zuva-backend/zuva-api.js. The umbrella
// grouping is a UI/code-level concept only, not a DB one.
const GENERAL_CONTENT_CATEGORIES: ContentCategory[] = [
  "entertainment", "music", "comedy", "drama_series", "news", "other",
];
const DOC_DISCUSSION_CONTENT_CATEGORIES: ContentCategory[] = [
  "documentary", "discussion_debate", "interview", "lifestyle_culture",
];

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"];
const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi"];

// Must match FLARE_MAX_DURATION_SECONDS in zuva-backend/zuva-api.js. This
// client-side check is a fast-fail convenience only — the backend is the
// real enforcement point (it validates against Cloudflare's own reported
// duration once processing confirms it, not this client-side estimate).
const FLARE_MAX_DURATION_SECONDS = 90;

// Reads a video file's duration without uploading it, by loading it into
// a detached <video> element and waiting for metadata. Best-effort: some
// browsers/codecs can fail to report duration from metadata alone, so a
// rejection here just means "couldn't check" — callers should let the
// upload proceed and rely on the backend's authoritative check.
function probeVideoDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const url = URL.createObjectURL(file);
    const cleanup = () => URL.revokeObjectURL(url);
    video.onloadedmetadata = () => {
      cleanup();
      resolve(Number.isFinite(video.duration) ? video.duration : null);
    };
    video.onerror = () => {
      cleanup();
      resolve(null);
    };
    video.src = url;
  });
}

// Curated languages matching the platform's African & Caribbean audience —
// must match CAPTION_LANGUAGES in zuva-backend/zuva-api.js. Labels are
// autonyms (each language's own name for itself), same convention as
// LanguageSwitcher's locale labels.
const CAPTION_LANGUAGES: { code: CaptionLanguage; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "sw", label: "Kiswahili" },
  { code: "ar", label: "العربية" },
  { code: "es", label: "Español" },
  { code: "ht", label: "Kreyòl Ayisyen" },
  { code: "yo", label: "Yorùbá" },
  { code: "ha", label: "Hausa" },
  { code: "zu", label: "isiZulu" },
  { code: "am", label: "አማርኛ" },
];
const ACCEPTED_CAPTION_EXTENSIONS = [".srt", ".vtt"];

interface PendingCaption {
  id: string;
  language: CaptionLanguage;
  file: File | null;
}

type CaptionUploadState = "pending" | "uploading" | "done" | "error";

// Cloudflare Stream encoding is separate from our moderation status — a
// video can already be "published" in our DB (thumbnail-based moderation
// ran synchronously) while Cloudflare is still transcoding it. Poll until
// a terminal encoding state, capped so a stuck job doesn't spin forever.
const POLL_INTERVAL_MS = 3000;
const MAX_POLL_ATTEMPTS = 40; // ~2 minutes

const inputClass =
  "w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-zinc-300 text-sm mb-1.5 font-medium">{label}</label>
      {children}
    </div>
  );
}

function isAcceptedVideoFile(file: File) {
  if (ACCEPTED_VIDEO_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ACCEPTED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export default function VideoUploadForm({
  userId,
  onUploaded,
}: {
  userId: string | null;
  onUploaded?: (video: UploadedVideo) => void;
}) {
  const t = useTranslations("VideoUpload");
  const tCategories = useTranslations("Categories");
  const tContentCategories = useTranslations("ContentCategories");
  const { getToken } = useAuth();

  const [videoFile, setVideoFile]         = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState("");
  const [contentCategory, setContentCategory] = useState<ContentCategory | "">("");
  const [tags, setTags]               = useState("");
  const [isFlare, setIsFlare]         = useState(false);

  const [fileError, setFileError]   = useState<string | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [uploading, setUploading]   = useState(false);
  const [progress, setProgress]     = useState(0);

  // Set once the upload+moderation response (201) comes back; drives the
  // "processing" phase where we poll Cloudflare's encoding status.
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [processing, setProcessing] = useState<UploadProcessingStatus | null>(null);
  const [pollGaveUp, setPollGaveUp] = useState(false);

  // Caption tracks the creator configures before submitting — uploaded
  // one-by-one right after the main video upload succeeds (Cloudflare's
  // captions API is keyed by video UID, so a track can't exist before
  // the video does; encoding readiness doesn't matter, only the UID).
  const [pendingCaptions, setPendingCaptions] = useState<PendingCaption[]>([]);
  const [captionStatus, setCaptionStatus] = useState<Record<string, CaptionUploadState>>({});
  const captionsStartedRef = useRef(false);

  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!uploadedVideo) return;
    let cancelled = false;
    let attempts = 0;

    async function poll() {
      try {
        const token = await getToken();
        const data = await getUploadStatus(token, uploadedVideo!.id);
        if (cancelled) return;
        setProcessing(data.processing_status);
        setUploadedVideo(data.video);

        const state = data.processing_status.state;
        if (state === "ready" || state === "error") return; // terminal — stop polling

        attempts += 1;
        if (attempts >= MAX_POLL_ATTEMPTS) {
          setPollGaveUp(true);
          return;
        }
        pollTimer.current = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        // Transient network/API hiccup — the video already exists and
        // uploaded fine, so just stop polling rather than erroring the
        // whole "success" screen over a status-check failure.
        if (!cancelled) setPollGaveUp(true);
      }
    }

    poll();
    return () => {
      cancelled = true;
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedVideo?.id]);

  // Fires once, the moment the video upload succeeds — not on the repeat
  // setUploadedVideo calls from status polling (captionsStartedRef guards
  // that), and independent of encoding progress.
  useEffect(() => {
    if (!uploadedVideo || captionsStartedRef.current || pendingCaptions.length === 0) return;
    captionsStartedRef.current = true;

    (async () => {
      for (const cap of pendingCaptions) {
        if (!cap.file) continue;
        setCaptionStatus((prev) => ({ ...prev, [cap.id]: "uploading" }));
        try {
          const token = await getToken();
          await uploadCaptionTrack(token, uploadedVideo.id, cap.language, cap.file);
          setCaptionStatus((prev) => ({ ...prev, [cap.id]: "done" }));
        } catch {
          setCaptionStatus((prev) => ({ ...prev, [cap.id]: "error" }));
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uploadedVideo?.id]);

  function addCaptionRow() {
    const usedLanguages = new Set(pendingCaptions.map((c) => c.language));
    const nextLanguage = CAPTION_LANGUAGES.find((l) => !usedLanguages.has(l.code))?.code ?? "en";
    setPendingCaptions((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random()}`, language: nextLanguage, file: null },
    ]);
  }

  function updateCaptionRow(id: string, patch: Partial<PendingCaption>) {
    setPendingCaptions((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  function removeCaptionRow(id: string) {
    setPendingCaptions((prev) => prev.filter((c) => c.id !== id));
  }

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setVideoFile(null);
      return;
    }
    if (!isAcceptedVideoFile(file)) {
      setFileError(t("errors.unsupportedType"));
      setVideoFile(null);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setFileError(t("errors.tooLarge"));
      setVideoFile(null);
      return;
    }
    // Fail fast for Flares — check locally before spending any upload
    // bandwidth. This is a convenience check only; the backend validates
    // against Cloudflare's own reported duration once processing confirms
    // it, since a client-side estimate isn't authoritative (see
    // probeVideoDuration's comment).
    if (isFlare) {
      const duration = await probeVideoDuration(file);
      if (duration !== null && duration > FLARE_MAX_DURATION_SECONDS) {
        setFileError(t("errors.flareTooLong", { max: FLARE_MAX_DURATION_SECONDS, actual: Math.round(duration) }));
        setVideoFile(null);
        return;
      }
    }
    setVideoFile(file);
  }

  // Re-check an already-selected file if the creator flips the toggle
  // AFTER choosing a video, rather than only checking at file-select time.
  async function handleFlareToggle(next: boolean) {
    setIsFlare(next);
    if (next && videoFile) {
      const duration = await probeVideoDuration(videoFile);
      if (duration !== null && duration > FLARE_MAX_DURATION_SECONDS) {
        setFileError(t("errors.flareTooLong", { max: FLARE_MAX_DURATION_SECONDS, actual: Math.round(duration) }));
        setVideoFile(null);
      }
    } else {
      setFileError(null);
    }
  }

  const canSubmit =
    !!videoFile && !fileError && title.trim() !== "" && category !== ""
    && contentCategory !== "" && !uploading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !videoFile) return;

    setError(null);
    setUploading(true);
    setProgress(0);

    const token = await getToken();

    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("title", title.trim());
    formData.append("description", description.trim());
    formData.append("category", category);
    formData.append("content_category", contentCategory);
    formData.append("tags", tags);
    formData.append("is_flare", String(isFlare));
    if (userId) formData.append("creator_id", userId);
    if (thumbnailFile) formData.append("thumbnail", thumbnailFile);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", `${BACKEND_URL}/api/upload/video`);
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const body = JSON.parse(xhr.responseText);
          setUploadedVideo(body.video);
          setUploadMessage(body.message ?? null);
          onUploaded?.(body.video);
        } catch {
          setError(t("errors.unreadableResponse"));
        }
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          setError(body?.error ?? t("errors.uploadFailedStatus", { status: xhr.status }));
        } catch {
          setError(t("errors.uploadFailedStatus", { status: xhr.status }));
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError(t("errors.uploadFailedNetwork"));
    };

    xhr.send(formData);
  }

  function resetForm() {
    setUploadedVideo(null);
    setUploadMessage(null);
    setProcessing(null);
    setPollGaveUp(false);
    setVideoFile(null);
    setThumbnailFile(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setContentCategory("");
    setTags("");
    setProgress(0);
    setPendingCaptions([]);
    setCaptionStatus({});
    captionsStartedRef.current = false;
  }

  if (uploadedVideo) {
    const state = processing?.state;
    const isReady = state === "ready";
    const isEncodeError = state === "error";
    const pct = processing?.pctComplete ? Math.round(parseFloat(processing.pctComplete)) : null;

    return (
      <div className="bg-surface-200 border border-gold-400/15 rounded-2xl p-6 sm:p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center mx-auto mb-5">
          <UploadCloud size={28} className="text-gold-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{t("uploadedTitle")}</h2>
        {uploadMessage && <p className="text-zinc-400 text-sm leading-relaxed mb-5">{uploadMessage}</p>}

        {/* Cloudflare encoding status */}
        <div className="bg-surface-300 border border-gold-400/10 rounded-xl px-4 py-3.5 mb-6 text-left">
          {isReady ? (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
              <CheckCircle2 size={16} /> {t("processingComplete")}
            </div>
          ) : isEncodeError ? (
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium">
              <XCircle size={16} />
              {t("processingFailed")}{processing?.errorReasonText ? `: ${processing.errorReasonText}` : "."}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-zinc-300 text-sm font-medium">{t("processingVideo")}</span>
                {pct !== null && <span className="text-gold-400 text-sm font-semibold">{pct}%</span>}
              </div>
              <div className="w-full h-1.5 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold-400 transition-all duration-300"
                  style={{ width: `${pct ?? 8}%` }}
                />
              </div>
              {pollGaveUp && (
                <p className="text-zinc-600 text-xs mt-2">{t("stillProcessing")}</p>
              )}
            </div>
          )}
        </div>

        {/* Caption upload progress */}
        {pendingCaptions.length > 0 && (
          <div className="bg-surface-300 border border-gold-400/10 rounded-xl px-4 py-3.5 mb-6 text-left space-y-2">
            <p className="text-zinc-300 text-sm font-medium mb-1">{t("captions.uploadingTitle")}</p>
            {pendingCaptions.map((cap) => {
              const status = captionStatus[cap.id] ?? "pending";
              const label = CAPTION_LANGUAGES.find((l) => l.code === cap.language)?.label ?? cap.language;
              return (
                <div key={cap.id} className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400">{label}</span>
                  {status === "done" ? (
                    <span className="flex items-center gap-1 text-green-400"><CheckCircle2 size={13} /> {t("captions.uploaded")}</span>
                  ) : status === "error" ? (
                    <span className="flex items-center gap-1 text-red-400"><XCircle size={13} /> {t("captions.uploadFailed")}</span>
                  ) : status === "uploading" ? (
                    <span className="text-gold-400">{t("captions.uploadingEllipsis")}</span>
                  ) : (
                    <span className="text-zinc-600">{t("captions.waiting")}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={resetForm}
          className="bg-gold-400 hover:bg-gold-300 text-black font-bold px-8 py-3 rounded-xl transition-all shadow-gold"
        >
          {t("uploadAnother")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface-200 border border-gold-400/15 rounded-2xl p-6 sm:p-8 space-y-5">
      {/* Post a Flare — short-form vertical toggle. Distinct amber-filled
          treatment matching the Flares nav entries, so it reads as a
          different upload *mode* rather than just another checkbox. */}
      <button
        type="button"
        onClick={() => handleFlareToggle(!isFlare)}
        className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl border text-left transition-all
          ${isFlare
            ? "bg-gold-400/15 border-gold-400 shadow-gold"
            : "bg-surface-100 border-gold-400/15 hover:border-gold-400/30"
          }`}
      >
        <div className="flex items-center gap-3">
          <Flame size={20} className={isFlare ? "text-gold-400 fill-gold-400/40" : "text-zinc-500"} />
          <div>
            <div className={`text-sm font-bold ${isFlare ? "text-gold-300" : "text-zinc-300"}`}>{t("postAFlare")}</div>
            <div className="text-zinc-500 text-xs">{t("postAFlareHint", { seconds: FLARE_MAX_DURATION_SECONDS })}</div>
          </div>
        </div>
        <div className={`w-10 h-6 rounded-full shrink-0 relative transition-colors ${isFlare ? "bg-gold-400" : "bg-surface-50"}`}>
          <div
            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${isFlare ? "translate-x-4" : "translate-x-0.5"}`}
          />
        </div>
      </button>

      <Field label={isFlare ? t("fields.videoFileFlare") : t("fields.videoFile")}>
        <label
          htmlFor="video-file"
          className={`flex flex-col items-center justify-center gap-2 border border-dashed rounded-xl px-4 py-8 cursor-pointer transition-colors
            ${videoFile ? "border-gold-400/40 bg-gold-400/5" : "border-gold-400/20 hover:border-gold-400/40"}`}
        >
          <Film size={24} className="text-gold-400" />
          <span className="text-sm text-zinc-300 text-center">
            {videoFile ? videoFile.name : isFlare ? t("chooseVideoFlare") : t("chooseVideo")}
          </span>
          <input
            id="video-file"
            type="file"
            accept="video/mp4,video/quicktime,video/x-msvideo,.mp4,.mov,.avi"
            onChange={handleVideoChange}
            className="hidden"
          />
        </label>
        {fileError && <p className="text-red-400 text-xs mt-2">{fileError}</p>}
      </Field>

      <Field label={t("fields.title")}>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          placeholder={t("titlePlaceholder")}
        />
      </Field>

      <Field label={t("fields.description")}>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={`${inputClass} resize-none`}
          placeholder={t("descriptionPlaceholder")}
        />
      </Field>

      <Field label={t("fields.category")}>
        <select
          required
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>{t("selectCategory")}</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{tCategories(c)}</option>
          ))}
        </select>
      </Field>

      <Field label={t("fields.contentCategory")}>
        <select
          required
          value={contentCategory}
          onChange={(e) => setContentCategory(e.target.value as ContentCategory)}
          className={inputClass}
        >
          <option value="" disabled>{t("selectContentCategory")}</option>
          <optgroup label={tContentCategories("groupGeneral")}>
            {GENERAL_CONTENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{tContentCategories(c)}</option>
            ))}
          </optgroup>
          <optgroup label={tContentCategories("groupDocDiscussion")}>
            {DOC_DISCUSSION_CONTENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>{tContentCategories(c)}</option>
            ))}
          </optgroup>
        </select>
        <p className="text-zinc-600 text-xs mt-1.5">{t("contentCategoryHint")}</p>
      </Field>

      <Field label={t("fields.tags")}>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          className={inputClass}
          placeholder={t("tagsPlaceholder")}
        />
      </Field>

      <Field label={t("fields.thumbnail")}>
        <label
          htmlFor="thumbnail-file"
          className="flex items-center gap-3 border border-dashed border-gold-400/20 hover:border-gold-400/40 rounded-xl px-4 py-3 cursor-pointer transition-colors"
        >
          <ImageIcon size={18} className="text-gold-400 shrink-0" />
          <span className="text-sm text-zinc-400 truncate">
            {thumbnailFile ? thumbnailFile.name : t("chooseImage")}
          </span>
          <input
            id="thumbnail-file"
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)}
            className="hidden"
          />
        </label>
      </Field>

      {/* Captions (optional) — one row per language; uploaded right after
          the main video succeeds, since Cloudflare needs the video's UID
          to exist before a caption track can attach to it. */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-zinc-300 text-sm font-medium">{t("fields.captions")}</label>
          {pendingCaptions.length < CAPTION_LANGUAGES.length && (
            <button
              type="button"
              onClick={addCaptionRow}
              className="flex items-center gap-1 text-gold-400 hover:text-gold-300 text-xs font-semibold transition-colors"
            >
              <Plus size={13} /> {t("captions.addTrack")}
            </button>
          )}
        </div>
        {pendingCaptions.length === 0 ? (
          <p className="text-zinc-600 text-xs">{t("captions.hint")}</p>
        ) : (
          <div className="space-y-2">
            {pendingCaptions.map((cap) => (
              <div key={cap.id} className="flex items-center gap-2">
                <Captions size={16} className="text-gold-400 shrink-0" />
                <select
                  value={cap.language}
                  onChange={(e) => updateCaptionRow(cap.id, { language: e.target.value as CaptionLanguage })}
                  className="bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-3 py-2 outline-none shrink-0"
                >
                  {CAPTION_LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
                <label
                  htmlFor={`caption-file-${cap.id}`}
                  className={`flex-1 min-w-0 text-sm rounded-xl px-3 py-2 border cursor-pointer truncate transition-colors
                    ${cap.file ? "border-gold-400/40 bg-gold-400/5 text-zinc-300" : "border-dashed border-gold-400/20 hover:border-gold-400/40 text-zinc-500"}`}
                >
                  {cap.file ? cap.file.name : t("captions.chooseFile")}
                  <input
                    id={`caption-file-${cap.id}`}
                    type="file"
                    accept=".srt,.vtt"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      if (file && !ACCEPTED_CAPTION_EXTENSIONS.some((ext) => file.name.toLowerCase().endsWith(ext))) {
                        return;
                      }
                      updateCaptionRow(cap.id, { file });
                    }}
                    className="hidden"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => removeCaptionRow(cap.id)}
                  className="p-2 text-zinc-500 hover:text-red-400 transition-colors shrink-0"
                  aria-label={t("captions.removeTrack")}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {uploading && (
        <div>
          <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gold-400 transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-zinc-500 text-xs mt-1.5 text-center">{t("uploadingPct", { pct: progress })}</p>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-gold"
      >
        {uploading ? t("uploading") : t("uploadVideo")}
      </button>
    </form>
  );
}
