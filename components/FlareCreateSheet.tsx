"use client";

/**
 * Flare creation bottom sheet — opened from FlareStoryBar's "Your Flare"
 * entry, lives entirely inside the Flares tab (/flares never navigates
 * away for this). Contains the Upload/Record tab toggle and the
 * CameraRecorder component; either path ends with a plain File handed to
 * the exact same POST /api/upload/video the long-form VideoUploadForm
 * uses (is_flare=true), so Cloudflare Stream upload logic is reused, not
 * duplicated. Deliberately lighter than the long-form form: category/
 * content_category/tags/thumbnail/captions aren't user-facing here
 * (defaulted to values the Flares UI never surfaces anyway) — only the
 * video, an optional caption, and the required AI-content disclosure.
 */

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@clerk/nextjs";
import { X, Film } from "lucide-react";
import type { UploadedVideo } from "@/lib/types";
import CameraRecorder from "@/components/CameraRecorder";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
// Cloudflare Stream accepts webm (CameraRecorder's own output on
// desktop/Android) exactly like mp4/mov/avi, so a manually-picked webm
// file is accepted too.
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/avi", "video/webm"];
const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi", ".webm"];

// Must match FLARE_MAX_DURATION_SECONDS in zuva-backend/zuva-api.js. This
// client-side check is a fast-fail convenience only — the backend is the
// real enforcement point once Cloudflare reports the true duration.
const FLARE_MAX_DURATION_SECONDS = 90;

// Metadata the backend requires but the Flares UI never surfaces
// (VideoUploadForm's category/content_category pickers don't apply to a
// Stories-style flow) — FlareItem doesn't even carry content_category, so
// a fixed, inconsequential default is safe here.
const DEFAULT_CATEGORY = "Other";
const DEFAULT_CONTENT_CATEGORY = "entertainment";

function isAcceptedVideoFile(file: File) {
  if (ACCEPTED_VIDEO_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ACCEPTED_VIDEO_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

// Best-effort — some browsers/codecs can't report duration from metadata
// alone, in which case the backend's own post-encode check is authoritative.
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

export default function FlareCreateSheet({
  userId,
  onClose,
  onUploaded,
}: {
  userId: string | null;
  onClose: () => void;
  onUploaded?: (video: UploadedVideo) => void;
}) {
  const t = useTranslations("Flares.create");
  const { getToken } = useAuth();

  const [uploadMode, setUploadMode] = useState<"upload" | "record">("upload");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  // null = unanswered — the creator must make an active choice, same
  // reasoning as VideoUploadForm's own AI-disclosure toggle.
  const [containsSyntheticMedia, setContainsSyntheticMedia] = useState<boolean | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // Shared by the file picker and CameraRecorder — once a File exists
  // here, the rest of this component can't tell (and doesn't care)
  // whether it was picked or recorded.
  async function validateAndSetVideoFile(file: File) {
    setFileError(null);
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
    const duration = await probeVideoDuration(file);
    if (duration !== null && duration > FLARE_MAX_DURATION_SECONDS) {
      setFileError(t("errors.tooLong", { max: FLARE_MAX_DURATION_SECONDS, actual: Math.round(duration) }));
      setVideoFile(null);
      return;
    }
    setVideoFile(file);
  }

  async function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setFileError(null);
      setVideoFile(null);
      return;
    }
    await validateAndSetVideoFile(file);
  }

  async function handleRecordedVideo(file: File) {
    await validateAndSetVideoFile(file);
  }

  const canSubmit = !!videoFile && !fileError && containsSyntheticMedia !== null && !uploading;

  function handleSubmit() {
    if (!canSubmit || !videoFile || containsSyntheticMedia === null) return;

    setError(null);
    setUploading(true);
    setProgress(0);

    (async () => {
      const token = await getToken();

      const trimmedCaption = caption.trim();
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("title", trimmedCaption ? trimmedCaption.slice(0, 200) : "Flare");
      formData.append("description", trimmedCaption);
      formData.append("category", DEFAULT_CATEGORY);
      formData.append("content_category", DEFAULT_CONTENT_CATEGORY);
      formData.append("contains_synthetic_media", String(containsSyntheticMedia));
      formData.append("tags", "");
      formData.append("is_flare", "true");
      if (userId) formData.append("creator_id", userId);

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
            onUploaded?.(body.video);
            onClose(); // dismiss on successful upload, per spec
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
    })();
  }

  function handleBackdropClick() {
    if (uploading) return; // don't silently drop an in-flight upload
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
        aria-hidden
      />

      <div className="relative w-full max-w-lg bg-surface-200 border-t border-gold-400/15 rounded-t-2xl px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 max-h-[92dvh] overflow-y-auto animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1.5 rounded-full bg-white/20" />
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-base">{t("title")}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={uploading}
            aria-label={t("close")}
            className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center text-zinc-400 hover:text-white transition-colors disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          {videoFile ? (
            <div className="flex items-center justify-between gap-3 border border-gold-400/40 bg-gold-400/5 rounded-xl px-4 py-3.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <Film size={20} className="text-gold-400 shrink-0" />
                <span className="text-sm text-zinc-300 truncate">{videoFile.name}</span>
              </div>
              <button
                type="button"
                onClick={() => { setVideoFile(null); setFileError(null); }}
                className="text-zinc-500 hover:text-red-400 text-xs font-semibold shrink-0 transition-colors"
              >
                {t("changeVideo")}
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                {(["upload", "record"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setUploadMode(mode)}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                      ${uploadMode === mode
                        ? "bg-gold-400 text-black shadow-gold"
                        : "bg-surface-100 text-zinc-400 border border-gold-400/15 hover:border-gold-400/30"
                      }`}
                  >
                    {mode === "upload" ? t("uploadTab") : t("recordTab")}
                  </button>
                ))}
              </div>

              {uploadMode === "upload" ? (
                <label
                  htmlFor="flare-video-file"
                  className="flex flex-col items-center justify-center gap-2 border border-dashed border-gold-400/20 hover:border-gold-400/40 rounded-xl px-4 py-8 cursor-pointer transition-colors"
                >
                  <Film size={24} className="text-gold-400" />
                  <span className="text-sm text-zinc-300 text-center">
                    {t("chooseVideo", { seconds: FLARE_MAX_DURATION_SECONDS })}
                  </span>
                  <input
                    id="flare-video-file"
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,.mp4,.mov,.avi,.webm"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
              ) : (
                <CameraRecorder maxDurationSeconds={FLARE_MAX_DURATION_SECONDS} onRecorded={handleRecordedVideo} />
              )}
            </>
          )}
          {fileError && <p className="text-red-400 text-xs">{fileError}</p>}

          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={2}
            placeholder={t("captionPlaceholder")}
            className="w-full bg-surface-100 border border-gold-400/20 focus:border-gold-400/50 text-white text-sm rounded-xl px-4 py-3 outline-none transition-colors resize-none"
          />

          {/* AI-content disclosure — required, no default. */}
          <div>
            <p className="text-zinc-400 text-xs leading-relaxed mb-2">{t("aiDisclosure.question")}</p>
            <p className="text-zinc-600 text-[11px] leading-relaxed mb-2">{t("aiDisclosure.hint")}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setContainsSyntheticMedia(true)}
                aria-pressed={containsSyntheticMedia === true}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
                  ${containsSyntheticMedia === true
                    ? "bg-gold-400 text-black border-gold-400 shadow-gold"
                    : "bg-surface-100 text-zinc-300 border-gold-400/15 hover:border-gold-400/30"
                  }`}
              >
                {t("aiDisclosure.yes")}
              </button>
              <button
                type="button"
                onClick={() => setContainsSyntheticMedia(false)}
                aria-pressed={containsSyntheticMedia === false}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all
                  ${containsSyntheticMedia === false
                    ? "bg-gold-400 text-black border-gold-400 shadow-gold"
                    : "bg-surface-100 text-zinc-300 border-gold-400/15 hover:border-gold-400/30"
                  }`}
              >
                {t("aiDisclosure.no")}
              </button>
            </div>
          </div>

          {uploading && (
            <div>
              <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold-400 transition-all duration-200"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-gold"
          >
            {uploading ? t("posting") : t("post")}
          </button>
        </div>
      </div>
    </div>
  );
}
