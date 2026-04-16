// Server component — no client-side APIs used.

const AMBER = "#D4920A";

// ── Geometry (viewBox 0 0 100 100, center 50 50) ─────────────────────────────
//
// Long rays  (8, every 45°): filled teardrop/flame shapes.
//   Base r≈19 from centre, tip r≈43.  Wavy bezier for organic look.
//   Defined pointing UP (toward y=0).
//
// Short rays (8, every 45°, offset +22.5°): open C-arc strokes.
//   Sit at r≈21-29 from centre, curve bows outward (left when pointing up).
//   Rendered as stroked path so they look like parenthesis / hook shapes.
//
// Centre disk: r=17.

const LONG_RAY  = "M 48,32 C 42,27 44,14 50,8 C 56,14 58,27 52,32 Z";
const SHORT_RAY = "M 48.5,29 C 43.5,27.5 43.5,22 48.5,21";

const LONG_ANGLES  = [0, 45, 90, 135, 180, 225, 270, 315];
const SHORT_ANGLES = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

interface ZuvaLogoProps {
  /** Diameter of the amber centre disk in rendered pixels. */
  diskSize?: number;
  showText?: boolean;
  className?: string;
}

export default function ZuvaLogo({
  diskSize  = 40,
  showText  = true,
  className = "",
}: ZuvaLogoProps) {
  // Disk is 34 units wide in the 100×100 viewBox → scale so disk == diskSize px.
  const scale = diskSize / 34;
  const dim   = Math.round(100 * scale); // rendered SVG width & height

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}
         style={{ gap: Math.round(diskSize * 0.12) + "px" }}>

      <svg
        viewBox="0 0 100 100"
        width={dim}
        height={dim}
        fill="none"
        aria-label="Zuva sun logo"
      >
        {/* ── Long rays (filled flame teardrops) ──────────────── */}
        {LONG_ANGLES.map((deg) => (
          <path
            key={`l${deg}`}
            d={LONG_RAY}
            fill={AMBER}
            transform={`rotate(${deg},50,50)`}
          />
        ))}

        {/* ── Short rays (open C-arc strokes) ─────────────────── */}
        {SHORT_ANGLES.map((deg) => (
          <path
            key={`s${deg}`}
            d={SHORT_RAY}
            stroke={AMBER}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            transform={`rotate(${deg},50,50)`}
          />
        ))}

        {/* ── Centre disk ─────────────────────────────────────── */}
        <circle cx="50" cy="50" r="17" fill={AMBER} />
      </svg>

      {showText && (
        <span
          style={{
            fontFamily:    "var(--font-fredoka-one), 'Fredoka', system-ui, sans-serif",
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
