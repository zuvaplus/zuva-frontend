/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "http",  hostname: "localhost" },
    ],
  },

  // Proxy /api/* → backend.
  // In dev, NEXT_PUBLIC_BACKEND_URL is unset so it falls back to localhost:3000.
  // In production (Railway), set NEXT_PUBLIC_BACKEND_URL to the backend service URL.
  // The browser always fetches a relative /api/* path; the Next.js server
  // rewrites it server-side, so no CORS headers are needed on the backend.
  async rewrites() {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000";
    return [
      {
        source:      "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
