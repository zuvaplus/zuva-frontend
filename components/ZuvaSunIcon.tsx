"use client";

interface ZuvaSunIconProps {
  size?: number;
  /** Adds hover scale+glow pulse animation */
  interactive?: boolean;
  /** Static glow (no animation) */
  glow?: boolean;
  className?: string;
}

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
// Same squiggly ray path used in ZuvaLogo, defined in a 56×56 coordinate space.
const RAY_PATH   = "M 41 28 C 43 25.3 45.5 30.7 47.5 28 C 49.5 25.3 51.5 29 53 28";

export default function ZuvaSunIcon({
  size        = 24,
  interactive = false,
  glow        = false,
  className   = "",
}: ZuvaSunIconProps) {
  return (
    <svg
      viewBox="0 0 56 56"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={`
        ${glow ? "sun-glow" : ""}
        ${interactive ? "cursor-pointer hover:animate-sun-pulse transition-all duration-200" : ""}
        ${className}
      `.trim()}
    >
      {RAY_ANGLES.map((angle) => (
        <path
          key={angle}
          d={RAY_PATH}
          stroke="#F5A623"
          strokeWidth="2.4"
          strokeLinecap="round"
          transform={`rotate(${angle}, 28, 28)`}
        />
      ))}
      <circle cx="28" cy="28" r="10" fill="#F5A623" />
    </svg>
  );
}
