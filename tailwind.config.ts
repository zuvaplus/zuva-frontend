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
        // Vibrant African Amber — primary brand color #f37b0d
        gold: {
          50:  "#FFF4E5",
          100: "#FFE0B2",
          200: "#FFCC80",
          300: "#FFB74D",
          400: "#f37b0d",   // ← PRIMARY brand amber
          500: "#CC6E00",
          600: "#995300",
          700: "#663700",
          800: "#331C00",
          900: "#1A0E00",
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
          "0%, 100%": { transform: "scale(1)",    filter: "drop-shadow(0 0 6px rgba(243,123,13,0.5))" },
          "50%":      { transform: "scale(1.08)", filter: "drop-shadow(0 0 18px rgba(243,123,13,0.9))" },
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
        gold:    "0 0 20px rgba(243,123,13,0.35)",
        "gold-lg": "0 0 48px rgba(243,123,13,0.45)",
      },
    },
  },
  plugins: [],
};
export default config;
