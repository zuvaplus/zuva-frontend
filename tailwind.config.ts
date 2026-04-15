import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Vibrant African Amber — primary brand color #F5A623
        gold: {
          50:  "#FFF8F0",
          100: "#FEE9C8",
          200: "#FDD08A",
          300: "#F9B748",
          400: "#F5A623",   // ← PRIMARY brand amber
          500: "#D4831A",
          600: "#A86510",
          700: "#7C4A0C",
          800: "#513008",
          900: "#261703",
        },
        // Near-pure-black surfaces (500 = true #000000)
        surface: {
          50:  "#1A1A1A",
          100: "#141414",
          200: "#0D0D0D",
          300: "#080808",
          400: "#040404",
          500: "#000000",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "spin-slow":    "spin 3s linear infinite",
        "sun-pulse":    "sun-pulse 2s ease-in-out infinite",
        "slide-up":     "slide-up 0.3s ease-out",
        "fade-in":      "fade-in 0.4s ease-out",
        "shimmer":      "shimmer 3s linear infinite",
      },
      keyframes: {
        "sun-pulse": {
          "0%, 100%": { transform: "scale(1)",    filter: "drop-shadow(0 0 6px rgba(245,166,35,0.5))" },
          "50%":      { transform: "scale(1.08)", filter: "drop-shadow(0 0 18px rgba(245,166,35,0.9))" },
        },
        "slide-up": {
          "0%":   { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "shimmer": {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center"  },
        },
      },
      boxShadow: {
        gold:    "0 0 20px rgba(245,166,35,0.35)",
        "gold-lg": "0 0 48px rgba(245,166,35,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
