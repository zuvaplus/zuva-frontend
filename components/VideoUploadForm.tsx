"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { UploadCloud, Film, Image as ImageIcon, CheckCircle2, XCircle } from "lucide-react";
import type { UploadedVideo, UploadProcessingStatus } from "@/lib/types";
import { getUploadStatus } from "@/lib/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

const CATEGORIES = ["Comedy", "Drama", "Music", "News", "Sports", "Lifestyle", "Education", "Other"];

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"];
const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi"];

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
  const { getToken } = useAuth();

  const [videoFile, setVideoFile]         = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory]       = useState("");
  const [tags, setTags]               = useState("");

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

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
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
    setVideoFile(file);
  }

  const canSubmit =
    !!videoFile && !fileError && title.trim() !== "" && category !== "" && !uploading;

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
    formData.append("tags", tags);
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
    setTags("");
    setProgress(0);
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
      <Field label={t("fields.videoFile")}>
        <label
          htmlFor="video-file"
          className={`flex flex-col items-center justify-center gap-2 border border-dashed rounded-xl px-4 py-8 cursor-pointer transition-colors
            ${videoFile ? "border-gold-400/40 bg-gold-400/5" : "border-gold-400/20 hover:border-gold-400/40"}`}
        >
          <Film size={24} className="text-gold-400" />
          <span className="text-sm text-zinc-300 text-center">
            {videoFile ? videoFile.name : t("chooseVideo")}
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
