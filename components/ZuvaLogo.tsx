"use client";

interface ZuvaLogoProps {
  /** Width of the sun disk in px — everything else scales from this. */
  diskSize?: number;
  showText?: boolean;
  className?: string;
}

// Eight squiggly rays defined once along the positive-x axis then rotated.
// ViewBox is 56×56, center at (28,28). Disk r=10.
// Ray: starts at r=13 (just outside disk gap), ends at r=25.
// Two-hump Bézier squiggle: M 41 28 C 43 25.3 45.5 30.7 47.5 28 C 49.5 25.3 51.5 29 53 28
const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];
const RAY_PATH   = "M 41 28 C 43 25.3 45.5 30.7 47.5 28 C 49.5 25.3 51.5 29 53 28";

export default function ZuvaLogo({
  diskSize  = 40,
  showText  = true,
  className = "",
}: ZuvaLogoProps) {
  // Scale everything relative to disk diameter (20px in the 56-unit viewBox)
  const scale = diskSize / 20;
  const svgW  = Math.round(56 * scale);
  const svgH  = Math.round(56 * scale);

  return (
    <div className={`inline-flex flex-col items-center gap-1 select-none ${className}`}>
      <svg
        viewBox="0 0 56 56"
        width={svgW}
        height={svgH}
        fill="none"
        aria-label="Zuva sun logo"
      >
        {/* Squiggly rays — rendered behind the disk */}
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

        {/* Solid amber disk */}
        <circle cx="28" cy="28" r="10" fill="#F5A623" />
      </svg>

      {showText && (
        <span
          style={{
            fontFamily:    "var(--font-geist-sans), system-ui, sans-serif",
            fontWeight:    800,
            fontSize:      Math.round(diskSize * 0.55) + "px",
            letterSpacing: "0.18em",
            color:         "#F5A623",
            lineHeight:    1,
          }}
        >
          ZUVA
        </span>
      )}
    </div>
  );
}
