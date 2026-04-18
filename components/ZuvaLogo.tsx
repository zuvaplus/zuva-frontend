// Server component — no hooks or browser APIs.
//
// Sun geometry — viewBox 0 0 200 200, centre (100, 100)
//
// All rays are the same wavy S-curve flame shape, alternating TALL and SHORT.
// Both segments bow: first LEFT (x≈89), then RIGHT (x≈111).
//
// Tall rays (8, every 45°, starting at 0° = pointing up):
//   r=35 at base (y=65) → r=78 at tip (y=22).
//
// Short rays (8, every 45°, offset +22.5° between each tall ray):
//   r=37 at base (y=63) → r=60 at tip (y=40).
//
// Stroke width 6 / 5, strokeLinecap round, no fill.
// Centre disk: r=33, filled.

const AMBER = "#f37b0d";

// Tall wavy S-curve: two cubic bezier segments
const TALL_RAY  = "M 100,65 C 89,59 89,50 100,44 C 111,38 111,30 100,22";
// Short wavy S-curve: same shape, shorter reach
const SHORT_RAY = "M 100,63 C 89,58 89,51 100,47 C 111,43 111,38 100,34";

const TALL_ANGLES  = [0, 45, 90, 135, 180, 225, 270, 315] as const;
const SHORT_ANGLES = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5] as const;

interface ZuvaLogoProps {
  /** Diameter of the centre amber disk in rendered pixels. */
  diskSize?: number;
  showText?: boolean;
  className?: string;
}

export default function ZuvaLogo({
  diskSize  = 40,
  showText  = true,
  className = "",
}: ZuvaLogoProps) {
  // Disk diameter in viewBox = 66 (r=33).
  // Scale the SVG so the disk renders at exactly diskSize px wide.
  const scale = diskSize / 66;
  const dim   = Math.round(200 * scale);

  return (
    <div
      className={`inline-flex flex-col items-center select-none ${className}`}
      style={{ gap: Math.round(diskSize * 0.1) + "px" }}
    >
      <svg
        viewBox="0 0 200 200"
        width={dim}
        height={dim}
        fill="none"
        aria-label="Zuva sun logo"
      >
        {/* ── Tall wavy S-curve rays ───────────────────────── */}
        {TALL_ANGLES.map((deg) => (
          <path
            key={`t${deg}`}
            d={TALL_RAY}
            stroke={AMBER}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            transform={`rotate(${deg},100,100)`}
          />
        ))}

        {/* ── Short wavy S-curve rays ──────────────────────── */}
        {SHORT_ANGLES.map((deg) => (
          <path
            key={`s${deg}`}
            d={SHORT_RAY}
            stroke={AMBER}
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            transform={`rotate(${deg},100,100)`}
          />
        ))}

        {/* ── Centre disk ─────────────────────────────────── */}
        <circle cx="100" cy="100" r="33" fill={AMBER} />
      </svg>

      {showText && (
        <span
          style={{
            fontFamily:    "var(--font-lilita-one), 'Lilita One', system-ui, sans-serif",
            fontWeight:    400,
            fontSize:      Math.round(diskSize * 0.62) + "px",
            letterSpacing: "0.08em",
            color:         AMBER,
            lineHeight:    1,
          }}
        >
          ZUVA
        </span>
      )}
    </div>
  );
}
