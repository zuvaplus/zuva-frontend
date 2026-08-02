"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useUser, useClerk, useAuth } from "@clerk/nextjs";
import AdsTab from "@/components/admin/AdsTab";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

type Tab = "applications" | "content" | "users" | "reports" | "ads";
const TABS: Tab[] = ["applications", "content", "users", "reports", "ads"];

// Must match REPORT_CATEGORIES in zuva-backend/zuva-api.js. 'all' is a
// frontend-only pseudo-category (no category query param sent).
type ReportCategory =
  | "nudity" | "minors" | "violence" | "animal_cruelty" | "hate_speech"
  | "misinformation" | "spam" | "copyright" | "other";
const REPORT_CATEGORIES: ReportCategory[] = [
  "nudity", "minors", "violence", "animal_cruelty", "hate_speech",
  "misinformation", "spam", "copyright", "other",
];

interface Application {
  id: string; // UUID — the live creator_applications.id column
  full_name: string;
  email: string;
  country: string;
  primary_platform: string;
  social_handle: string;
  content_category: string;
  follower_count: string;
  status: "unconfirmed" | "pending" | "approved" | "rejected";
  awaiting_signup: boolean;
  approved_user_id: string | null;
  created_at: string;
}

interface ContentItem {
  id: string;
  orientation: "vertical" | "landscape";
  title: string;
  creator_id: string;
  creator_name: string;
  published_at: string | null;
  status: "pending" | "approved" | "rejected" | "flagged";
  reports_count: number;
}

interface AdminUser {
  id: string;
  display_name: string | null;
  email: string;
  country_code: string | null;
  role: string;
  status: "active" | "suspended";
  created_at: string;
}

interface ReportItem {
  id: number; // video_reports.id stays SERIAL, not a UUID
  video_id: string;
  category: ReportCategory;
  additional_details: string | null;
  created_at: string;
  resolved_at: string | null;
  resolution: "restored" | "removed" | null;
  video_title: string;
  video_status: string;
  thumbnail_url: string | null;
  creator_id: string;
  creator_name: string;
  reporter_id: string | null;
  reporter_name: string | null;
}

interface ReportStats {
  range: { from: string; to: string };
  by_category: { category: string; count: number }[];
  resolved_count: number;
  restored_count: number;
  removed_count: number;
  avg_resolution_seconds: number | null;
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// Report resolution times span minutes to weeks — picks the coarsest
// unit that stays readable rather than always showing raw seconds/hours.
function formatDuration(seconds: number | null) {
  if (seconds === null || Number.isNaN(seconds)) return "—";
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  if (seconds < 86400) return `${(seconds / 3600).toFixed(1)}h`;
  return `${(seconds / 86400).toFixed(1)}d`;
}

const STATUS_STYLES: Record<string, string> = {
  unconfirmed:   "bg-zinc-500/5 text-zinc-600 border-zinc-600/20",
  pending:       "bg-zinc-500/10 text-zinc-400 border-zinc-500/25",
  approved:      "bg-green-500/10 text-green-400 border-green-500/25",
  published:     "bg-green-500/10 text-green-400 border-green-500/25",
  active:        "bg-green-500/10 text-green-400 border-green-500/25",
  rejected:      "bg-red-400/10 text-red-400 border-red-400/25",
  suspended:     "bg-red-400/10 text-red-400 border-red-400/25",
  flagged:       "bg-gold-400/10 text-gold-400 border-gold-400/25",
  under_review:  "bg-gold-400/10 text-gold-400 border-gold-400/25",
};

function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("Status");
  return (
    <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
      {t.has(status) ? t(status) : status}
    </span>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-surface-300/60 border border-gold-400/10 rounded-xl px-4 py-3 text-center">
      <div className="text-zinc-500 text-[10px] uppercase tracking-wide mb-1">{label}</div>
      <div className="text-white font-bold text-xl tabular-nums">{value}</div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  variant = "neutral",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "approve" | "reject" | "danger" | "neutral";
}) {
  const styles: Record<string, string> = {
    approve: "bg-green-500/10 text-green-400 border-green-500/25 hover:bg-green-500/20",
    reject:  "bg-red-400/10 text-red-400 border-red-400/25 hover:bg-red-400/20",
    danger:  "bg-red-500/15 text-red-300 border-red-500/40 hover:bg-red-500/25",
    neutral: "bg-gold-400/10 text-gold-400 border-gold-400/25 hover:bg-gold-400/20",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${styles[variant]}`}
    >
      {label}
    </button>
  );
}

function TableShell({ columns, children }: { columns: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gold-400/12">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-surface-200 text-zinc-500">
            {columns.map((c) => (
              <th key={c} className="text-left px-4 py-3 font-semibold whitespace-nowrap">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

function EmptyRow({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-8 text-center text-zinc-600">{children}</td>
    </tr>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3 mb-4">
      {message}
    </p>
  );
}

export default function AdminPage() {
  const t = useTranslations("Admin");
  const { user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  const callerEmail = user?.primaryEmailAddress?.emailAddress;
  const isAuthorized =
    isLoaded && !!user && !!callerEmail && !!ADMIN_EMAIL &&
    callerEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    if (!isAuthorized) {
      router.replace("/");
    }
  }, [isLoaded, user, isAuthorized, router]);

  const [tab, setTab] = useState<Tab>("applications");

  const [applications, setApplications] = useState<Application[] | null>(null);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [appActionId, setAppActionId] = useState<string | null>(null);

  const [content, setContent] = useState<ContentItem[] | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentActionId, setContentActionId] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userActionId, setUserActionId] = useState<string | null>(null);

  const [reportCategory, setReportCategory] = useState<ReportCategory | "all">("all");
  const [reportStatus, setReportStatus] = useState<"pending" | "resolved">("pending");
  const [reportPage, setReportPage] = useState(1);
  const [reports, setReports] = useState<ReportItem[] | null>(null);
  const [reportsHasMore, setReportsHasMore] = useState(false);
  const [reportsError, setReportsError] = useState<string | null>(null);
  const [reportActionId, setReportActionId] = useState<number | null>(null);

  const [stats, setStats] = useState<ReportStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [statsFrom, setStatsFrom] = useState("");
  const [statsTo, setStatsTo] = useState("");

  const adminFetch = useCallback(
    async <T,>(path: string, options?: RequestInit): Promise<T> => {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options?.headers,
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Prefer the backend's message; fall back to express-validator's
        // errors array (older responses), then the bare status code.
        const validatorMsgs = Array.isArray(body?.errors)
          ? body.errors.map((e: { msg?: string }) => e.msg).filter(Boolean).join("; ")
          : "";
        throw new Error(body?.error ?? (validatorMsgs || `Request failed (${res.status})`));
      }
      return res.json() as Promise<T>;
    },
    [getToken]
  );

  const loadApplications = useCallback(async () => {
    try {
      const data = await adminFetch<{ applications: Application[] }>("/api/admin/applications");
      setApplications(data.applications);
      setAppsError(null);
    } catch (err) {
      setAppsError(err instanceof Error ? err.message : t("errors.loadApplications"));
    }
  }, [adminFetch, t]);

  const loadContent = useCallback(async () => {
    try {
      const data = await adminFetch<{ content: ContentItem[] }>("/api/admin/content");
      setContent(data.content);
      setContentError(null);
    } catch (err) {
      setContentError(err instanceof Error ? err.message : t("errors.loadContent"));
    }
  }, [adminFetch, t]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await adminFetch<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(data.users);
      setUsersError(null);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : t("errors.loadUsers"));
    }
  }, [adminFetch, t]);

  const loadReports = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (reportCategory !== "all") params.set("category", reportCategory);
      params.set("status", reportStatus);
      params.set("page", String(reportPage));
      const data = await adminFetch<{ reports: ReportItem[]; has_more: boolean }>(
        `/api/admin/reports?${params.toString()}`
      );
      setReports(data.reports);
      setReportsHasMore(data.has_more);
      setReportsError(null);
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : t("errors.loadReports"));
    }
  }, [adminFetch, t, reportCategory, reportStatus, reportPage]);

  const loadStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statsFrom) params.set("from", statsFrom);
      if (statsTo) params.set("to", statsTo);
      const data = await adminFetch<ReportStats>(`/api/admin/reports/stats?${params.toString()}`);
      setStats(data);
      setStatsError(null);
    } catch (err) {
      setStatsError(err instanceof Error ? err.message : t("errors.loadStats"));
    }
  }, [adminFetch, t, statsFrom, statsTo]);

  // Reports/stats load lazily — only once the tab is actually viewed,
  // unlike applications/content/users which load eagerly on mount —
  // since this tab has its own filters (category/status/page/date range)
  // that the other three don't.
  useEffect(() => {
    if (!isAuthorized || tab !== "reports") return;
    loadReports();
    loadStats();
  }, [isAuthorized, tab, loadReports, loadStats]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadApplications();
    loadContent();
    loadUsers();
  }, [isAuthorized, loadApplications, loadContent, loadUsers]);

  async function handleApplicationStatus(id: string, status: "approved" | "rejected") {
    setAppActionId(id);
    try {
      await adminFetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setApplications((prev) => prev?.map((a) => (a.id === id ? { ...a, status } : a)) ?? null);
    } catch (err) {
      setAppsError(err instanceof Error ? err.message : t("errors.updateApplication"));
    } finally {
      setAppActionId(null);
    }
  }

  async function handleContentStatus(item: ContentItem, status: "approved" | "rejected") {
    setContentActionId(item.id);
    try {
      await adminFetch(`/api/admin/content/${item.id}?orientation=${item.orientation}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setContent((prev) => prev?.map((c) => (c.id === item.id ? { ...c, status } : c)) ?? null);
    } catch (err) {
      setContentError(err instanceof Error ? err.message : t("errors.updateContent"));
    } finally {
      setContentActionId(null);
    }
  }

  async function handleContentRemove(item: ContentItem) {
    setContentActionId(item.id);
    try {
      await adminFetch(`/api/admin/content/${item.id}?orientation=${item.orientation}`, {
        method: "DELETE",
      });
      setContent((prev) => prev?.filter((c) => c.id !== item.id) ?? null);
    } catch (err) {
      setContentError(err instanceof Error ? err.message : t("errors.removeContent"));
    } finally {
      setContentActionId(null);
    }
  }

  async function handleUserSuspend(id: string) {
    setUserActionId(id);
    try {
      await adminFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "suspended" }),
      });
      setUsers((prev) => prev?.map((u) => (u.id === id ? { ...u, status: "suspended" } : u)) ?? null);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : t("errors.suspendUser"));
    } finally {
      setUserActionId(null);
    }
  }

  async function handleUserRemove(id: string) {
    setUserActionId(id);
    try {
      await adminFetch(`/api/admin/users/${id}`, { method: "DELETE" });
      setUsers((prev) => prev?.filter((u) => u.id !== id) ?? null);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : t("errors.removeUser"));
    } finally {
      setUserActionId(null);
    }
  }

  async function handleReportResolve(report: ReportItem, resolution: "restored" | "removed") {
    setReportActionId(report.id);
    try {
      await adminFetch(`/api/admin/reports/${report.id}/resolve`, {
        method: "POST",
        body: JSON.stringify({ resolution }),
      });
      // Resolving one report can close out several rows for the same
      // video at once (see the backend note on POST .../resolve) — a
      // reload is simpler and more correct than trying to patch local
      // state for every affected row.
      await loadReports();
    } catch (err) {
      setReportsError(err instanceof Error ? err.message : t("errors.resolveReport"));
    } finally {
      setReportActionId(null);
    }
  }

  // Gate rendering entirely until authorization is confirmed, so the
  // dashboard shell (and its data fetches) never mount for the wrong user.
  if (!isLoaded || !isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-400/30 border-t-gold-400 rounded-full animate-spin" />
      </div>
    );
  }

  const pendingCount  = applications?.filter((a) => a.status === "pending").length ?? 0;
  const approvedCount = applications?.filter((a) => a.status === "approved").length ?? 0;
  const rejectedCount = applications?.filter((a) => a.status === "rejected").length ?? 0;

  return (
    <div className="min-h-screen bg-black text-foreground px-4 sm:px-6 py-10 max-w-6xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-extrabold text-white">{t("title")}</h1>
            <span className="bg-gold-400 text-black text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
              {t("badge")}
            </span>
          </div>
          <p className="text-zinc-500 text-sm">{t("subtitle")}</p>
        </div>
        <button
          onClick={() => signOut(() => router.push("/"))}
          className="shrink-0 text-sm font-semibold px-4 py-2 rounded-lg border border-gold-400 text-white hover:bg-gold-400/10 transition-colors"
        >
          {t("signOut")}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors
              ${tab === tabKey ? "border-gold-400 text-gold-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            {t(`tabs.${tabKey}`)}
          </button>
        ))}
      </div>

      {tab === "applications" && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5 max-w-sm">
            <StatTile label={t("stats.pending")} value={pendingCount} />
            <StatTile label={t("stats.approved")} value={approvedCount} />
            <StatTile label={t("stats.rejected")} value={rejectedCount} />
          </div>

          {appsError && <ErrorBanner message={appsError} />}

          <TableShell columns={[
            t("columns.name"), t("columns.email"), t("columns.country"), t("columns.platform"),
            t("columns.socialHandle"), t("columns.followers"), t("columns.status"),
            t("columns.dateApplied"), t("columns.actions"),
          ]}>
            {applications === null ? (
              <EmptyRow colSpan={9}>{t("loadingApplications")}</EmptyRow>
            ) : applications.length === 0 ? (
              <EmptyRow colSpan={9}>{t("noApplications")}</EmptyRow>
            ) : (
              applications.map((a) => (
                <tr key={a.id} className="hover:bg-surface-300/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{a.full_name}</td>
                  <td className="px-4 py-3 text-zinc-400">{a.email}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{a.country}</td>
                  <td className="px-4 py-3 text-zinc-400">{a.primary_platform}</td>
                  <td className="px-4 py-3 text-zinc-400">{a.social_handle}</td>
                  <td className="px-4 py-3 text-zinc-400">{a.follower_count}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={a.status} />
                    {a.status === "approved" && a.awaiting_signup && (
                      <div className="text-zinc-600 text-[10px] mt-1">{t("awaitingSignup")}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {/* Unconfirmed applications aren't reviewable yet — the
                          applicant must click their email confirm link first */}
                      <ActionButton
                        label={t("actions.approve")}
                        variant="approve"
                        disabled={appActionId === a.id || a.status === "approved" || a.status === "unconfirmed"}
                        onClick={() => handleApplicationStatus(a.id, "approved")}
                      />
                      <ActionButton
                        label={t("actions.reject")}
                        variant="reject"
                        disabled={appActionId === a.id || a.status === "rejected" || a.status === "unconfirmed"}
                        onClick={() => handleApplicationStatus(a.id, "rejected")}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </TableShell>
        </div>
      )}

      {tab === "content" && (
        <div>
          {contentError && <ErrorBanner message={contentError} />}

          <TableShell columns={[
            t("columns.title"), t("columns.creator"), t("columns.uploadDate"),
            t("columns.status"), t("columns.reports"), t("columns.actions"),
          ]}>
            {content === null ? (
              <EmptyRow colSpan={6}>{t("loadingContent")}</EmptyRow>
            ) : content.length === 0 ? (
              <EmptyRow colSpan={6}>{t("noContent")}</EmptyRow>
            ) : (
              content.map((c) => (
                <tr key={`${c.orientation}-${c.id}`} className="hover:bg-surface-300/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium">{c.title}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{c.creator_name}</td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(c.published_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-zinc-400 tabular-nums">{c.reports_count}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <ActionButton
                        label={t("actions.approve")}
                        variant="approve"
                        disabled={contentActionId === c.id || c.status === "approved"}
                        onClick={() => handleContentStatus(c, "approved")}
                      />
                      <ActionButton
                        label={t("actions.reject")}
                        variant="reject"
                        disabled={contentActionId === c.id || c.status === "rejected"}
                        onClick={() => handleContentStatus(c, "rejected")}
                      />
                      <ActionButton
                        label={t("actions.remove")}
                        variant="danger"
                        disabled={contentActionId === c.id}
                        onClick={() => handleContentRemove(c)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </TableShell>
        </div>
      )}

      {tab === "users" && (
        <div>
          {usersError && <ErrorBanner message={usersError} />}

          <TableShell columns={[
            t("columns.name"), t("columns.email"), t("columns.country"), t("columns.role"),
            t("columns.joinDate"), t("columns.status"), t("columns.actions"),
          ]}>
            {users === null ? (
              <EmptyRow colSpan={7}>{t("loadingUsers")}</EmptyRow>
            ) : users.length === 0 ? (
              <EmptyRow colSpan={7}>{t("noUsers")}</EmptyRow>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-surface-300/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{u.display_name ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400">{u.email}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{u.country_code ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-400 capitalize">{u.role}</td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <ActionButton
                        label={t("actions.suspend")}
                        variant="reject"
                        disabled={userActionId === u.id || u.status === "suspended"}
                        onClick={() => handleUserSuspend(u.id)}
                      />
                      <ActionButton
                        label={t("actions.removeAccount")}
                        variant="danger"
                        disabled={userActionId === u.id}
                        onClick={() => handleUserRemove(u.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </TableShell>
        </div>
      )}

      {tab === "reports" && (
        <div>
          {/* Stats summary */}
          <div className="mb-6">
            <div className="flex flex-wrap items-end gap-3 mb-3">
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase tracking-wide mb-1">{t("reports.from")}</label>
                <input
                  type="date"
                  value={statsFrom}
                  onChange={(e) => setStatsFrom(e.target.value)}
                  className="bg-surface-200 border border-gold-400/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-gold-400/40"
                />
              </div>
              <div>
                <label className="block text-zinc-500 text-[10px] uppercase tracking-wide mb-1">{t("reports.to")}</label>
                <input
                  type="date"
                  value={statsTo}
                  onChange={(e) => setStatsTo(e.target.value)}
                  className="bg-surface-200 border border-gold-400/15 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-gold-400/40"
                />
              </div>
              <button
                onClick={loadStats}
                className="text-[11px] font-semibold px-3 py-2 rounded-lg border border-gold-400/25 text-gold-400 hover:bg-gold-400/10 transition-colors"
              >
                {t("reports.applyRange")}
              </button>
            </div>

            {statsError && <ErrorBanner message={statsError} />}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
                <StatTile label={t("reports.stats.resolved")} value={stats.resolved_count} />
                <StatTile label={t("reports.stats.restored")} value={stats.restored_count} />
                <StatTile label={t("reports.stats.removed")} value={stats.removed_count} />
                <div className="bg-surface-300/60 border border-gold-400/10 rounded-xl px-4 py-3 text-center">
                  <div className="text-zinc-500 text-[10px] uppercase tracking-wide mb-1">{t("reports.stats.avgResolution")}</div>
                  <div className="text-white font-bold text-xl tabular-nums">{formatDuration(stats.avg_resolution_seconds)}</div>
                </div>
              </div>
            )}
            {stats && stats.by_category.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {stats.by_category.map((c) => (
                  <span
                    key={c.category}
                    className="text-[11px] text-zinc-400 bg-surface-300/60 border border-gold-400/10 rounded-full px-3 py-1"
                  >
                    {t.has(`reports.categories.${c.category}`) ? t(`reports.categories.${c.category}`) : c.category}: <span className="text-white font-semibold">{c.count}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Category sub-tabs */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
            {(["all", ...REPORT_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => { setReportCategory(cat); setReportPage(1); }}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors
                  ${reportCategory === cat ? "bg-gold-400 text-black" : "bg-surface-200 text-zinc-400 hover:text-gold-300"}`}
              >
                {cat === "all" ? t("reports.allCategories") : t(`reports.categories.${cat}`)}
              </button>
            ))}
          </div>

          {/* Status toggle */}
          <div className="flex gap-1 mb-4 border-b border-white/10 w-fit">
            {(["pending", "resolved"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setReportStatus(s); setReportPage(1); }}
                className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors
                  ${reportStatus === s ? "border-gold-400 text-gold-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
              >
                {t(`reports.status.${s}`)}
              </button>
            ))}
          </div>

          {reportsError && <ErrorBanner message={reportsError} />}

          <TableShell columns={[
            t("columns.title"), t("reports.columns.category"), t("columns.creator"),
            t("reports.columns.reporter"), t("reports.columns.details"), t("columns.dateApplied"),
            t("columns.status"), t("columns.actions"),
          ]}>
            {reports === null ? (
              <EmptyRow colSpan={8}>{t("reports.loading")}</EmptyRow>
            ) : reports.length === 0 ? (
              <EmptyRow colSpan={8}>{t("reports.empty")}</EmptyRow>
            ) : (
              reports.map((r) => (
                <tr key={r.id} className="hover:bg-surface-300/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium max-w-[220px] truncate">{r.video_title}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{t(`reports.categories.${r.category}`)}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{r.creator_name}</td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{r.reporter_name ?? t("reports.anonymous")}</td>
                  <td className="px-4 py-3 text-zinc-500 max-w-[240px] truncate" title={r.additional_details ?? ""}>
                    {r.additional_details || "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3"><StatusBadge status={r.video_status} /></td>
                  <td className="px-4 py-3">
                    {r.resolved_at ? (
                      <span className="text-[11px] text-zinc-500 capitalize">{r.resolution}</span>
                    ) : (
                      <div className="flex gap-1.5">
                        <ActionButton
                          label={t("reports.actions.restore")}
                          variant="approve"
                          disabled={reportActionId === r.id}
                          onClick={() => handleReportResolve(r, "restored")}
                        />
                        <ActionButton
                          label={t("reports.actions.remove")}
                          variant="danger"
                          disabled={reportActionId === r.id}
                          onClick={() => handleReportResolve(r, "removed")}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </TableShell>

          <div className="flex items-center justify-between mt-3">
            <button
              onClick={() => setReportPage((p) => Math.max(1, p - 1))}
              disabled={reportPage === 1}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gold-400/20 text-zinc-400 hover:text-gold-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t("reports.prevPage")}
            </button>
            <span className="text-xs text-zinc-500">{t("reports.page", { page: reportPage })}</span>
            <button
              onClick={() => setReportPage((p) => p + 1)}
              disabled={!reportsHasMore}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gold-400/20 text-zinc-400 hover:text-gold-300 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {t("reports.nextPage")}
            </button>
          </div>
        </div>
      )}

      {tab === "ads" && <AdsTab />}
    </div>
  );
}
