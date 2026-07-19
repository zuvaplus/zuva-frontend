"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { UploadCloud, Film, Image as ImageIcon } from "lucide-react";
import { useUserRole } from "@/components/UserRoleProvider";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

const CATEGORIES = ["Comedy", "Drama", "Music", "News", "Sports", "Lifestyle", "Education", "Other"];

const MAX_VIDEO_BYTES = 2 * 1024 * 1024 * 1024; // 2GB
const ACCEPTED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"];
const ACCEPTED_VIDEO_EXTENSIONS = [".mp4", ".mov", ".avi"];

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

export default function UploadPage() {
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
      router.replace("/creator-signup");
    }
  }, [authChecked, user, role, router]);

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
  const [success, setSuccess]       = useState(false);

  const xhrRef = useRef<XMLHttpRequest | null>(null);

  function handleVideoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setFileError(null);
    if (!file) {
      setVideoFile(null);
      return;
    }
    if (!isAcceptedVideoFile(file)) {
      setFileError("Unsupported file type. Please upload an MP4, MOV, or AVI file.");
      setVideoFile(null);
      return;
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setFileError("File is too large. Maximum upload size is 2GB.");
      setVideoFile(null);
      return;
    }
    setVideoFile(file);
  }

  const canSubmit =
    !!videoFile && !fileError && title.trim() !== "" && category !== "" && !uploading;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || !videoFile || !user) return;

    setError(null);
    setUploading(true);
    setProgress(0);

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
    xhr.setRequestHeader("x-clerk-user-id", user.id);

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable) {
        setProgress(Math.round((evt.loaded / evt.total) * 100));
      }
    };

    xhr.onload = () => {
      setUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        setSuccess(true);
      } else {
        try {
          const body = JSON.parse(xhr.responseText);
          setError(body?.error ?? `Upload failed (${xhr.status})`);
        } catch {
          setError(`Upload failed (${xhr.status})`);
        }
      }
    };

    xhr.onerror = () => {
      setUploading(false);
      setError("Upload failed. Please check your connection and try again.");
    };

    xhr.send(formData);
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-black text-foreground flex items-center justify-center px-6 py-20">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-gold-400/15 border border-gold-400/30 flex items-center justify-center mx-auto mb-6">
            <UploadCloud size={28} className="text-gold-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Video uploaded!</h1>
          <p className="text-zinc-400 text-sm leading-relaxed mb-8">
            It will be live once approved.
          </p>
          <button
            onClick={() => {
              setSuccess(false);
              setVideoFile(null);
              setThumbnailFile(null);
              setTitle("");
              setDescription("");
              setCategory("");
              setTags("");
              setProgress(0);
            }}
            className="bg-gold-400 hover:bg-gold-300 text-black font-bold px-8 py-3 rounded-xl transition-all shadow-gold"
          >
            Upload Another Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-foreground px-4 sm:px-6 py-10 max-w-2xl mx-auto">
      <div className="mb-8 text-center">
        <UploadCloud size={32} className="text-gold-400 mx-auto mb-4" />
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white mb-2">Upload a Video</h1>
        <p className="text-zinc-500 text-sm">Share your content with the Zuva community.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-200 border border-gold-400/15 rounded-2xl p-6 sm:p-8 space-y-5">
        <Field label="Video File">
          <label
            htmlFor="video-file"
            className={`flex flex-col items-center justify-center gap-2 border border-dashed rounded-xl px-4 py-8 cursor-pointer transition-colors
              ${videoFile ? "border-gold-400/40 bg-gold-400/5" : "border-gold-400/20 hover:border-gold-400/40"}`}
          >
            <Film size={24} className="text-gold-400" />
            <span className="text-sm text-zinc-300 text-center">
              {videoFile ? videoFile.name : "Click to choose a video (MP4, MOV, AVI — up to 2GB)"}
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

        <Field label="Title">
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="Give your video a title"
          />
        </Field>

        <Field label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={`${inputClass} resize-none`}
            placeholder="What's this video about?"
          />
        </Field>

        <Field label="Category">
          <select
            required
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>Select a category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Tags">
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className={inputClass}
            placeholder="comedy, lagos, skits (comma-separated)"
          />
        </Field>

        <Field label="Thumbnail (optional)">
          <label
            htmlFor="thumbnail-file"
            className="flex items-center gap-3 border border-dashed border-gold-400/20 hover:border-gold-400/40 rounded-xl px-4 py-3 cursor-pointer transition-colors"
          >
            <ImageIcon size={18} className="text-gold-400 shrink-0" />
            <span className="text-sm text-zinc-400 truncate">
              {thumbnailFile ? thumbnailFile.name : "Choose an image (optional)"}
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
            <p className="text-zinc-500 text-xs mt-1.5 text-center">Uploading… {progress}%</p>
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
          {uploading ? "Uploading…" : "Upload Video"}
        </button>
      </form>
    </div>
  );
}
