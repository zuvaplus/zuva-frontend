"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ZuvaLogo from "@/components/ZuvaLogo";
import ZuvaSunIcon from "@/components/ZuvaSunIcon";

export default function SignInPage() {
  const router = useRouter();
  const [tab,         setTab]         = useState<"signin" | "signup">("signin");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState<string | null>(null);
  const [success,     setSuccess]     = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      if (!email || !password) throw new Error("Email and password are required");
      if (tab === "signup" && !displayName) throw new Error("Display name is required");
      setSuccess(tab === "signin" ? "Signed in! Redirecting…" : "Account created! Welcome to Zuva.TV");
      setTimeout(() => router.push("/feed"), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-black">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Logo */}
        <div className="text-center mb-8">
          <ZuvaLogo diskSize={52} showText={true} className="mx-auto mb-2" />
          <p className="text-zinc-600 text-sm mt-3">Where creators shine</p>
        </div>

        {/* Card */}
        <div className="bg-surface-200 border border-gold-400/15 rounded-3xl p-6 shadow-gold">
          {/* Tab switcher */}
          <div className="flex bg-surface-300 rounded-xl p-1 mb-6">
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all
                  ${tab === t
                    ? "bg-gold-400 text-black shadow-gold"
                    : "text-zinc-500 hover:text-gold-300"
                  }`}
              >
                {t === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {success ? (
            <div className="text-center py-6">
              <ZuvaSunIcon size={44} glow className="mx-auto mb-3" />
              <p className="text-gold-400 font-semibold">{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {tab === "signup" && (
                <div>
                  <label className="block text-zinc-400 text-sm mb-1.5 font-medium">Display Name</label>
                  <input
                    type="text" value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your creator name"
                    className="w-full bg-surface-100 border border-gold-400/15 focus:border-gold-400/45 text-white placeholder-zinc-700 text-sm rounded-xl px-4 py-3 outline-none transition-colors"
                    required
                  />
                </div>
              )}
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-medium">Email</label>
                <input
                  type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-surface-100 border border-gold-400/15 focus:border-gold-400/45 text-white placeholder-zinc-700 text-sm rounded-xl px-4 py-3 outline-none transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-sm mb-1.5 font-medium">Password</label>
                <input
                  type="password" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface-100 border border-gold-400/15 focus:border-gold-400/45 text-white placeholder-zinc-700 text-sm rounded-xl px-4 py-3 outline-none transition-colors"
                  required minLength={8}
                />
              </div>

              {error && (
                <div className="bg-red-500/8 border border-red-500/25 rounded-xl px-4 py-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit" disabled={loading}
                className="w-full bg-gold-400 hover:bg-gold-300 text-black font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-gold flex items-center justify-center gap-2"
              >
                {loading
                  ? <span className="animate-pulse">{tab === "signin" ? "Signing in…" : "Creating account…"}</span>
                  : <><ZuvaSunIcon size={16} />{tab === "signin" ? "Sign In" : "Create Account"}</>
                }
              </button>

              {tab === "signin" && (
                <p className="text-center text-zinc-600 text-xs">
                  Forgot your password?{" "}
                  <span className="text-gold-400 cursor-pointer hover:underline">Reset it</span>
                </p>
              )}
            </form>
          )}
        </div>

        {/* Feature pills */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { icon: "🌍", label: "Diaspora-first" },
            { icon: "☀️",  label: "Earn Suns"      },
            { icon: "💸", label: "Mobile Money"   },
          ].map(({ icon, label }) => (
            <div key={label} className="bg-surface-300/60 border border-gold-400/8 rounded-xl p-3 text-center">
              <div className="text-lg mb-1">{icon}</div>
              <div className="text-zinc-600 text-[10px] font-medium">{label}</div>
            </div>
          ))}
        </div>

        <p className="text-center text-zinc-700 text-xs mt-5">
          By continuing you agree to our{" "}
          <Link href="/terms"   className="text-gold-400/60 hover:text-gold-400 transition-colors">Terms</Link>
          {" & "}
          <Link href="/privacy" className="text-gold-400/60 hover:text-gold-400 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
