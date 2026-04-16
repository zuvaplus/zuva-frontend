// Server component — no hooks or browser APIs.
//
// Sun geometry — viewBox 0 0 200 200, centre (100, 100)
//
// Long rays  (8, every 45°, starting at 0° = pointing up):
//   Two-segment S-curve stroked path.
//   Segment 1 bows LEFT  (x≈90), segment 2 bows RIGHT (x≈110).
//   r=35 at base (y=65) → r=78 at tip (y=22).
//
// Short rays (8, every 45°, offset +22.5° between each long ray):
//   Single cubic bezier, bows LEFT (x≈82), giving a "(" / C-hook shape.
//   r≈38 at base (y=62) → r≈56 at tip (y=44).
//
// Stroke width 6 / 5, strokeLinecap round, no fill.
// Centre disk: r=33, filled.

const AMBER = "#D4920A";

const LONG_RAY  = "M 100,65 C 90,59 90,50 100,44 C 110,38 110,30 100,22";
const SHORT_RAY = "M 97,62 C 82,60 82,46 97,44";

const LONG_ANGLES  = [0, 45, 90, 135, 180, 225, 270, 315] as const;
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
        {/* ── Long wavy S-curve rays ───────────────────────── */}
        {LONG_ANGLES.map((deg) => (
          <path
            key={`l${deg}`}
            d={LONG_RAY}
            stroke={AMBER}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            transform={`rotate(${deg},100,100)`}
          />
        ))}

        {/* ── Short C-hook rays ────────────────────────────── */}
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
            fontFamily:    "var(--font-fredoka-one), 'Fredoka One', system-ui, sans-serif",
            fontWeight:    400,
            fontSize:      Math.round(diskSize * 0.62) + "px",
            letterSpacing: "0.14em",
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
