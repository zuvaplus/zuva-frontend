import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-8 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link href="/" aria-label="Zuva home">
          <img
            src="/zuva-logo.svg"
            alt="Zuva"
            style={{ width: "80px", height: "auto", background: "transparent" }}
          />
        </Link>
        <nav className="flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-zinc-600 text-xs">
          <Link href="/about"    className="hover:text-gold-400 transition-colors">About</Link>
          <Link href="/privacy"  className="hover:text-gold-400 transition-colors">Privacy Policy</Link>
          <Link href="/terms"    className="hover:text-gold-400 transition-colors">Terms of Service</Link>
          <Link href="/creators" className="hover:text-gold-400 transition-colors">Creators</Link>
        </nav>
        <p className="text-zinc-700 text-xs">© 2026 Zuva.TV Inc.</p>
      </div>
    </footer>
  );
}
