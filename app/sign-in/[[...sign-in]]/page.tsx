import { SignIn } from "@clerk/nextjs";
import Link from "next/link";
import ZuvaLogo from "@/components/ZuvaLogo";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default function SignInPage() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center px-4 py-12 bg-black">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Brand header */}
        <div className="text-center mb-8">
          <ZuvaLogo diskSize={52} showText={true} className="mx-auto mb-2" />
          <p className="text-zinc-600 text-sm mt-3">Where creators shine</p>
        </div>

        {/* Clerk sign-in widget */}
        <SignIn appearance={clerkAppearance} />

        {/* Feature pills */}
        <div className="mt-6 grid grid-cols-3 gap-2">
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
