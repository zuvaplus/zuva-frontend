"use client";

interface SunIconProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export default function SunIcon({ size = 20, className = "", glow = false }: SunIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={`${glow ? "sun-glow" : ""} ${className}`}
      style={{ filter: glow ? "drop-shadow(0 0 6px rgba(212,175,55,0.8))" : undefined }}
    >
      {/* Sun circle */}
      <circle cx="12" cy="12" r="5" fill="#D4AF37" />
      {/* Rays */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
        <line
          key={angle}
          x1={12 + 7 * Math.cos((angle * Math.PI) / 180)}
          y1={12 + 7 * Math.sin((angle * Math.PI) / 180)}
          x2={12 + 10 * Math.cos((angle * Math.PI) / 180)}
          y2={12 + 10 * Math.sin((angle * Math.PI) / 180)}
          stroke="#D4AF37"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
}
