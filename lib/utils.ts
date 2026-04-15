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
