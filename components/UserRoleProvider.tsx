"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";

export type UserRole = "viewer" | "creator";

interface UserRoleContextValue {
  role:     UserRole;
  userId:   string | null; // DB users.id (uuid) — null until resolved or if unauthenticated
  username: string | null; // DB users.username — for building /channel/[username] links
  loading:  boolean;
}

const UserRoleContext = createContext<UserRoleContextValue>({
  role: "viewer", userId: null, username: null, loading: true,
});

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const [role, setRole]         = useState<UserRole>("viewer");
  const [userId, setUserId]     = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      setRole("viewer");
      setUserId(null);
      setUsername(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`${BACKEND_URL}/api/user/role`, {
      headers: { "x-clerk-user-id": user.id },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data) => {
        if (!cancelled) {
          setRole(data.role === "creator" ? "creator" : "viewer");
          setUserId(data.id ?? null);
          setUsername(data.username ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRole("viewer");
          setUserId(null);
          setUsername(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, user]);

  return (
    <UserRoleContext.Provider value={{ role, userId, username, loading }}>
      {children}
    </UserRoleContext.Provider>
  );
}

export function useUserRole() {
  return useContext(UserRoleContext);
}
