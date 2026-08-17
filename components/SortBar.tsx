"use client";

import { useTranslations } from "next-intl";
import type { SortOption } from "@/lib/types";

const OPTIONS: SortOption[] = ["latest", "oldest", "most_viewed", "most_liked"];

export default function SortBar({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (sort: SortOption) => void;
}) {
  const t = useTranslations("SortBar");

  return (
    <div className="flex items-center gap-2 mb-6 overflow-x-auto">
      {OPTIONS.map((option) => {
        const active = option === value;
        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            aria-pressed={active}
            className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-colors border ${
              active
                ? "bg-gold-400 text-black border-gold-400"
                : "bg-transparent text-zinc-400 border-gold-400/20 hover:border-gold-400/40 hover:text-white"
            }`}
          >
            {t(option)}
          </button>
        );
      })}
    </div>
  );
}
