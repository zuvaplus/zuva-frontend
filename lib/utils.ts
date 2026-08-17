/** Format a Sun balance for display: 1234567 → "1.2M ☀" */
export function formatSuns(suns: number): string {
  if (suns >= 1_000_000) return `${(suns / 1_000_000).toFixed(1)}M`;
  if (suns >= 1_000) return `${(suns / 1_000).toFixed(1)}K`;
  return suns.toLocaleString();
}

/** Format seconds as mm:ss or h:mm:ss */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Compact count for view/like/subscriber numbers: 951 → "951",
 *  12345 → "12K", 1234 → "1.2K", 2500000 → "2.5M". Whole-number
 *  compacts drop the decimal (12.0K → 12K). */
export function formatCount(n: number): string {
  const compact = (value: number, suffix: string) => {
    const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
    return `${rounded}${suffix}`;
  };
  if (n >= 1_000_000) return compact(n / 1_000_000, "M");
  if (n >= 1_000) return compact(n / 1_000, "K");
  return n.toLocaleString();
}

/** Long-form relative time: "3 days ago", "just now", "2 months ago" */
export function timeAgoLong(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  const unit = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? "" : "s"} ago`;
  if (diff < 60) return "just now";
  if (diff < 3600) return unit(Math.floor(diff / 60), "minute");
  if (diff < 86400) return unit(Math.floor(diff / 3600), "hour");
  if (diff < 2_592_000) return unit(Math.floor(diff / 86400), "day");
  if (diff < 31_536_000) return unit(Math.floor(diff / 2_592_000), "month");
  return unit(Math.floor(diff / 31_536_000), "year");
}

/** Format a UTC timestamp as a relative label: "2m ago", "3d ago" */
export function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/** Map transaction type to a human-readable label */
export function txLabel(type: string): string {
  const map: Record<string, string> = {
    sun_purchase: "Purchased Suns",
    creator_tip: "Tip",
    platform_commission: "Platform fee",
    creator_payout: "Cashout",
  };
  return map[type] ?? type;
}

/** Get the creator tier badge info */
export function tierInfo(tier: string): { label: string; color: string } {
  const map: Record<string, { label: string; color: string }> = {
    rising_star: { label: "Rising Star", color: "#9CA3AF" },
    shining_sun: { label: "Shining Sun", color: "#D4AF37" },
    solar_elite: { label: "Solar Elite", color: "#F5E375" },
  };
  return map[tier] ?? { label: tier, color: "#9CA3AF" };
}

/** Clamp a number between min and max */
export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

/** Video card description snippet: first sentence or ~100 characters,
 *  whichever is shorter, with a trailing ellipsis whenever the full
 *  text got cut. Backs off to the last whole word when the 100-char
 *  cap (not the sentence boundary) is what triggered the cut, so it
 *  never splits mid-word. */
export function truncateDescription(text: string, maxChars = 100): string {
  const trimmed = text.trim();
  if (!trimmed) return "";

  const sentenceMatch = trimmed.match(/^[^.!?]*[.!?]/);
  const firstSentence = sentenceMatch ? sentenceMatch[0] : trimmed;

  const limit = Math.min(firstSentence.length, maxChars);
  if (limit >= trimmed.length) return trimmed;

  let snippet = trimmed.slice(0, limit);
  if (limit === maxChars && limit < firstSentence.length) {
    const lastSpace = snippet.lastIndexOf(" ");
    if (lastSpace > 0) snippet = snippet.slice(0, lastSpace);
  }
  return snippet.trimEnd().replace(/[.,;:]+$/, "") + "…";
}
