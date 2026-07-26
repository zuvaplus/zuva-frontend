"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { X } from "lucide-react";
import ZuvaSunIcon from "./ZuvaSunIcon";

export default function BecomeCreatorModal({ onClose }: { onClose: () => void }) {
  const t = useTranslations("BecomeCreatorModal");
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-sm bg-surface-200 border border-gold-400/20 rounded-t-3xl md:rounded-3xl p-6 animate-slide-up shadow-gold-lg text-center">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors p-1">
          <X size={20} />
        </button>

        <ZuvaSunIcon size={52} glow className="mx-auto mb-4" />
        <h2 className="text-white font-bold text-lg mb-2">{t("title")}</h2>
        <p className="text-zinc-500 text-sm mb-6">{t("body")}</p>

        <Link
          href="/creator-signup"
          onClick={onClose}
          className="block w-full bg-gold-400 text-black font-semibold rounded-xl py-2.5 hover:bg-gold-300 transition-colors"
        >
          {t("applyNow")}
        </Link>
        <button
          onClick={onClose}
          className="mt-3 w-full text-zinc-500 text-sm hover:text-white transition-colors py-1.5"
        >
          {t("notNow")}
        </button>
      </div>
    </div>
  );
}
