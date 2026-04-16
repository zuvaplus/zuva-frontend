// Server component — no client-side APIs used.
// Shares the same ray geometry as ZuvaLogo (viewBox 0 0 100 100, centre 50 50).

const AMBER = "#D4920A";

const LONG_RAY  = "M 48,32 C 42,27 44,14 50,8 C 56,14 58,27 52,32 Z";
const SHORT_RAY = "M 48.5,29 C 43.5,27.5 43.5,22 48.5,21";

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
      viewBox="0 0 100 100"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
      className={[
        glow        ? "sun-glow"                                                : "",
        interactive ? "cursor-pointer hover:animate-sun-pulse transition-all duration-200" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      {LONG_ANGLES.map((deg) => (
        <path
          key={`l${deg}`}
          d={LONG_RAY}
          fill={AMBER}
          transform={`rotate(${deg},50,50)`}
        />
      ))}

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

      <circle cx="50" cy="50" r="17" fill={AMBER} />
    </svg>
  );
}
