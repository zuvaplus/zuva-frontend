// Server component — no client-side APIs used.
// Mirrors ZuvaLogo geometry scaled to viewBox 0 0 200 200, centre (100,100).
// Long rays: 2-segment S-curve stroked path (strokeWidth 6).
// Short rays: single cubic C-arc stroked path (strokeWidth 5).

const AMBER = "#D4920A";

const LONG_RAY  = "M 100,65 C 90,59 90,50 100,44 C 110,38 110,30 100,22";
const SHORT_RAY = "M 97,62 C 82,60 82,46 97,44";

const LONG_ANGLES  = [0, 45, 90, 135, 180, 225, 270, 315];
const SHORT_ANGLES = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

interface ZuvaSunIconProps {
  size?: number;
  interactive?: boolean;
  glow?: boolean;
  className?: string;
}

export default function ZuvaSunIcon({
  size        = 24,
  interactive = false,
  glow        = false,
  className   = "",
}: ZuvaSunIconProps) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={[
        glow        ? "sun-glow"                                                          : "",
        interactive ? "cursor-pointer hover:animate-sun-pulse transition-all duration-200" : "",
        className,
      ].filter(Boolean).join(" ")}
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
  );
}
