"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useUser } from "@clerk/nextjs";
import { UploadCloud } from "lucide-react";
import { useUserRole } from "@/components/UserRoleProvider";
import VideoUploadForm from "@/components/VideoUploadForm";

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
      router.replace("/creator-signup?from=upload");
    }
  }, [authChecked, user, role, router]);

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
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

      <VideoUploadForm userId={userId} />
    </div>
  );
}
