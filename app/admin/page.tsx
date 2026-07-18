"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL;

type Tab = "applications" | "content" | "users";

interface Application {
  id: number;
  full_name: string;
  email: string;
  country: string;
  primary_platform: string;
  social_handle: string;
  content_category: string;
  follower_count: string;
  status: "pending" | "approved" | "rejected";
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

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

const STATUS_STYLES: Record<string, string> = {
  pending:   "bg-zinc-500/10 text-zinc-400 border-zinc-500/25",
  approved:  "bg-green-500/10 text-green-400 border-green-500/25",
  active:    "bg-green-500/10 text-green-400 border-green-500/25",
  rejected:  "bg-red-400/10 text-red-400 border-red-400/25",
  suspended: "bg-red-400/10 text-red-400 border-red-400/25",
  flagged:   "bg-gold-400/10 text-gold-400 border-gold-400/25",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}>
      {status}
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
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const callerEmail = user?.primaryEmailAddress?.emailAddress;
  const isAuthorized =
    isLoaded && isSignedIn && !!callerEmail && !!ADMIN_EMAIL &&
    callerEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in");
      return;
    }
    if (!isAuthorized) {
      router.replace("/");
    }
  }, [isLoaded, isSignedIn, isAuthorized, router]);

  const [tab, setTab] = useState<Tab>("applications");

  const [applications, setApplications] = useState<Application[] | null>(null);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [appActionId, setAppActionId] = useState<number | null>(null);

  const [content, setContent] = useState<ContentItem[] | null>(null);
  const [contentError, setContentError] = useState<string | null>(null);
  const [contentActionId, setContentActionId] = useState<string | null>(null);

  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [userActionId, setUserActionId] = useState<string | null>(null);

  const adminFetch = useCallback(
    async <T,>(path: string, options?: RequestInit): Promise<T> => {
      const res = await fetch(`${BACKEND_URL}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "x-admin-email": callerEmail ?? "",
          ...options?.headers,
        },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Request failed (${res.status})`);
      }
      return res.json() as Promise<T>;
    },
    [callerEmail]
  );

  const loadApplications = useCallback(async () => {
    try {
      const data = await adminFetch<{ applications: Application[] }>("/api/admin/applications");
      setApplications(data.applications);
      setAppsError(null);
    } catch (err) {
      setAppsError(err instanceof Error ? err.message : "Failed to load applications");
    }
  }, [adminFetch]);

  const loadContent = useCallback(async () => {
    try {
      const data = await adminFetch<{ content: ContentItem[] }>("/api/admin/content");
      setContent(data.content);
      setContentError(null);
    } catch (err) {
      setContentError(err instanceof Error ? err.message : "Failed to load content");
    }
  }, [adminFetch]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await adminFetch<{ users: AdminUser[] }>("/api/admin/users");
      setUsers(data.users);
      setUsersError(null);
    } catch (err) {
      setUsersError(err instanceof Error ? err.message : "Failed to load users");
    }
  }, [adminFetch]);

  useEffect(() => {
    if (!isAuthorized) return;
    loadApplications();
    loadContent();
    loadUsers();
  }, [isAuthorized, loadApplications, loadContent, loadUsers]);

  async function handleApplicationStatus(id: number, status: "approved" | "rejected") {
    setAppActionId(id);
    try {
      await adminFetch(`/api/admin/applications/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      setApplications((prev) => prev?.map((a) => (a.id === id ? { ...a, status } : a)) ?? null);
    } catch (err) {
      setAppsError(err instanceof Error ? err.message : "Failed to update application");
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
      setContentError(err instanceof Error ? err.message : "Failed to update content");
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
      setContentError(err instanceof Error ? err.message : "Failed to remove content");
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
      setUsersError(err instanceof Error ? err.message : "Failed to suspend user");
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
      setUsersError(err instanceof Error ? err.message : "Failed to remove user");
    } finally {
      setUserActionId(null);
    }
  }

  // Gate rendering entirely until authorization is confirmed, so the
  // dashboard shell (and its data fetches) never mount for the wrong user.
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-zinc-600 text-sm">Checking access…</p>
      </div>
    );
  }

  const pendingCount  = applications?.filter((a) => a.status === "pending").length ?? 0;
  const approvedCount = applications?.filter((a) => a.status === "approved").length ?? 0;
  const rejectedCount = applications?.filter((a) => a.status === "rejected").length ?? 0;

  return (
    <div className="min-h-screen bg-black text-foreground px-4 sm:px-6 py-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-2xl font-extrabold text-white">Admin Dashboard</h1>
          <span className="bg-gold-400 text-black text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded">
            Admin
          </span>
        </div>
        <p className="text-zinc-500 text-sm">
          Manage creator applications, content moderation, and user accounts.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10">
        {(["applications", "content", "users"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold capitalize border-b-2 transition-colors
              ${tab === t ? "border-gold-400 text-gold-400" : "border-transparent text-zinc-500 hover:text-zinc-300"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "applications" && (
        <div>
          <div className="grid grid-cols-3 gap-3 mb-5 max-w-sm">
            <StatTile label="Pending" value={pendingCount} />
            <StatTile label="Approved" value={approvedCount} />
            <StatTile label="Rejected" value={rejectedCount} />
          </div>

          {appsError && <ErrorBanner message={appsError} />}

          <TableShell columns={["Name", "Email", "Country", "Platform", "Social Handle", "Followers", "Status", "Date Applied", "Actions"]}>
            {applications === null ? (
              <EmptyRow colSpan={9}>Loading applications…</EmptyRow>
            ) : applications.length === 0 ? (
              <EmptyRow colSpan={9}>No applications yet.</EmptyRow>
            ) : (
              applications.map((a) => (
                <tr key={a.id} className="hover:bg-surface-300/30 transition-colors">
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap">{a.full_name}</td>
                  <td className="px-4 py-3 text-zinc-400">{a.email}</td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">{a.country}</td>
                  <td className="px-4 py-3 text-zinc-400">{a.primary_platform}</td>
                  <td className="px-4 py-3 text-zinc-400">{a.social_handle}</td>
                  <td className="px-4 py-3 text-zinc-400">{a.follower_count}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-4 py-3 text-zinc-500 whitespace-nowrap">{formatDate(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      <ActionButton
                        label="Approve"
                        variant="approve"
                        disabled={appActionId === a.id || a.status === "approved"}
                        onClick={() => handleApplicationStatus(a.id, "approved")}
                      />
                      <ActionButton
                        label="Reject"
                        variant="reject"
                        disabled={appActionId === a.id || a.status === "rejected"}
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

          <TableShell columns={["Title", "Creator", "Upload Date", "Status", "Reports", "Actions"]}>
            {content === null ? (
              <EmptyRow colSpan={6}>Loading content…</EmptyRow>
            ) : content.length === 0 ? (
              <EmptyRow colSpan={6}>No content yet.</EmptyRow>
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
                        label="Approve"
                        variant="approve"
                        disabled={contentActionId === c.id || c.status === "approved"}
                        onClick={() => handleContentStatus(c, "approved")}
                      />
                      <ActionButton
                        label="Reject"
                        variant="reject"
                        disabled={contentActionId === c.id || c.status === "rejected"}
                        onClick={() => handleContentStatus(c, "rejected")}
                      />
                      <ActionButton
                        label="Remove"
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

          <TableShell columns={["Name", "Email", "Country", "Role", "Join Date", "Status", "Actions"]}>
            {users === null ? (
              <EmptyRow colSpan={7}>Loading users…</EmptyRow>
            ) : users.length === 0 ? (
              <EmptyRow colSpan={7}>No users yet.</EmptyRow>
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
                        label="Suspend"
                        variant="reject"
                        disabled={userActionId === u.id || u.status === "suspended"}
                        onClick={() => handleUserSuspend(u.id)}
                      />
                      <ActionButton
                        label="Remove Account"
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
    </div>
  );
}
