// Server component — no client-side APIs used.
// Renders the same sun mark used in Navbar.tsx next to the search bar —
// a crop of public/zuva-logo.svg, not a separate hand-drawn icon. Every
// sun on the site should render through this component so the logo only
// has to change in one place.

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
      viewBox="300 100 900 900"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Zuva sun"
      className={[
        glow        ? "sun-glow"                                                          : "",
        interactive ? "cursor-pointer hover:animate-sun-pulse transition-all duration-200" : "",
        className,
      ].filter(Boolean).join(" ")}
    >
      <image href="/zuva-logo.svg" x="0" y="0" width="1500" height="1500" />
    </svg>
  );
}
