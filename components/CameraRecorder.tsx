"use client";

/**
 * In-app camera recording for the Flares creation bottom sheet — the
 * "Record" tab alongside FlareCreateSheet's file-picker "Upload" tab.
 * Mirrors Instagram/TikTok's own record-preview-confirm flow: live
 * camera → recording → local preview (Re-record or confirm) → the
 * confirmed clip is handed back to the parent as a plain File, which
 * FlareCreateSheet then runs through the exact same validation/upload
 * path a picked file already goes through — this component has no
 * awareness of uploading at all.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Circle, Square, RotateCcw, Video as VideoIcon, AlertTriangle } from "lucide-react";

type RecorderState = "requesting" | "live" | "recording" | "preview" | "denied" | "unsupported";

// Cloudflare Stream accepts both — prefer webm (broad desktop/Android
// support) and fall back to mp4 specifically for iOS Safari, which
// supports MediaRecorder but never the webm container. Checked via
// MediaRecorder.isTypeSupported() rather than hardcoded per-browser
// logic, so this stays correct as browser support shifts.
function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
    "video/mp4",
  ];
  return candidates.find((type) => MediaRecorder.isTypeSupported(type)) ?? null;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function CameraRecorder({
  maxDurationSeconds,
  onRecorded,
}: {
  maxDurationSeconds: number;
  onRecorded: (file: File) => void;
}) {
  const t = useTranslations("Flares.camera");

  const [state, setState] = useState<RecorderState>("requesting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("video/webm");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordedFileRef = useRef<File | null>(null);

  // Request the camera once on mount. Cleans up the stream and timer on
  // unmount (e.g. the creator switches back to the Upload tab) so the
  // camera light actually turns off instead of recording in the background.
  useEffect(() => {
    let cancelled = false;

    async function start() {
      setState("requesting");
      setErrorMessage(null);

      if (!navigator.mediaDevices?.getUserMedia) {
        setState("unsupported");
        return;
      }
      const mimeType = pickMimeType();
      if (!mimeType) {
        setState("unsupported");
        return;
      }
      mimeTypeRef.current = mimeType;

      try {
        // facingMode "user" (front/selfie camera) — the only camera a
        // vertical, Flares-style recording flow needs; no camera-switch
        // control since nothing asked for one.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: true,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (liveVideoRef.current) {
          liveVideoRef.current.srcObject = stream;
          // Autoplay-with-sound policies can block programmatic play()
          // even for a muted local stream on some browsers — same
          // belt-and-suspenders pattern used for the Flares feed player.
          liveVideoRef.current.play().catch(() => {});
        }
        setState("live");
      } catch (err) {
        if (cancelled) return;
        // NotAllowedError: the user (or a site permission policy) said no.
        // NotFoundError / OverconstrainedError: there's no camera to ask
        // permission for at all. Both are dead ends for recording, but
        // the message should tell the creator which one happened rather
        // than a single generic "camera error."
        const name = err instanceof DOMException ? err.name : "";
        if (name === "NotFoundError" || name === "OverconstrainedError") {
          setErrorMessage(t("noCameraFound"));
        } else {
          setErrorMessage(t("permissionDenied"));
        }
        setState("denied");
      }
    }

    start();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Revoke the object URL whenever it's replaced or the component unmounts.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function startRecording() {
    const stream = streamRef.current;
    if (!stream) return;

    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: mimeTypeRef.current });
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
      const extension = mimeTypeRef.current.includes("mp4") ? "mp4" : "webm";
      const file = new File([blob], `flare-recording-${Date.now()}.${extension}`, { type: mimeTypeRef.current });
      recordedFileRef.current = file;
      setPreviewUrl(URL.createObjectURL(blob));
      setState("preview");
    };
    recorderRef.current = recorder;

    recorder.start();
    setElapsed(0);
    setState("recording");
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= maxDurationSeconds) stopRecording();
        return next;
      });
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.stop();
  }

  function reRecord() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    recordedFileRef.current = null;
    setElapsed(0);
    // The camera stream was never stopped, just not being recorded —
    // straight back to "live" with no new permission prompt.
    setState("live");
  }

  function confirmRecording() {
    if (recordedFileRef.current) onRecorded(recordedFileRef.current);
  }

  if (state === "denied" || state === "unsupported") {
    return (
      <div className="flex flex-col items-center gap-3 border border-dashed border-red-400/30 bg-red-400/5 rounded-xl px-4 py-8 text-center">
        <AlertTriangle size={24} className="text-red-400" />
        <p className="text-zinc-300 text-sm leading-relaxed max-w-sm">
          {errorMessage ?? t("unsupported")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-full max-w-[220px] aspect-[9/16] bg-black rounded-xl overflow-hidden border border-gold-400/20">
        {state === "requesting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
          </div>
        )}

        {/* Live feed — muted + playsInline are both required: muted so
            autoplay isn't blocked, playsInline so iOS Safari plays it
            inline instead of forcing fullscreen. Mirrored purely via CSS
            for a natural "looking in a mirror" selfie feel — this only
            affects what's displayed, not the actual frames MediaRecorder
            captures from the underlying track. */}
        {(state === "live" || state === "recording") && (
          <video
            ref={liveVideoRef}
            muted
            playsInline
            autoPlay
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
        )}

        {state === "preview" && previewUrl && (
          <video src={previewUrl} controls playsInline className="w-full h-full object-cover" />
        )}

        {state === "recording" && (
          <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/70 backdrop-blur rounded-full px-2.5 py-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-xs font-semibold tabular-nums">
              {formatTime(elapsed)} / {formatTime(maxDurationSeconds)}
            </span>
          </div>
        )}
      </div>

      {(state === "live" || state === "recording") && (
        <p className="text-zinc-500 text-xs">{t("recordingHint", { seconds: maxDurationSeconds })}</p>
      )}

      <div className="flex items-center gap-3">
        {state === "live" && (
          <button
            type="button"
            onClick={startRecording}
            className="flex items-center gap-2 bg-gold-400 hover:bg-gold-300 text-black font-bold px-5 py-2.5 rounded-xl transition-all shadow-gold"
          >
            <Circle size={16} className="fill-black" />
            {t("recordButton")}
          </button>
        )}

        {state === "recording" && (
          <button
            type="button"
            onClick={stopRecording}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-400 text-white font-bold px-5 py-2.5 rounded-xl transition-all"
          >
            <Square size={14} className="fill-white" />
            {t("stopButton")}
          </button>
        )}

        {state === "preview" && (
          <>
            <button
              type="button"
              onClick={reRecord}
              className="flex items-center gap-2 bg-surface-100 hover:bg-surface-50 text-zinc-300 font-semibold px-4 py-2.5 rounded-xl border border-gold-400/15 transition-all"
            >
              <RotateCcw size={15} />
              {t("reRecord")}
            </button>
            <button
              type="button"
              onClick={confirmRecording}
              className="flex items-center gap-2 bg-gold-400 hover:bg-gold-300 text-black font-bold px-5 py-2.5 rounded-xl transition-all shadow-gold"
            >
              <VideoIcon size={16} />
              {t("useRecording")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
