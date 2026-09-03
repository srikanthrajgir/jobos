import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === "production";

// Google Maps JS needs its own origins allowed, per
// https://developers.google.com/maps/documentation/javascript/content-security-policy
// The default policy blocked every one of these, so the map would have failed
// silently: the loader script, its XHRs, and the fonts it pulls. Tiles arrive as
// images and are already covered by `img-src https:`. Note 'unsafe-eval' is
// still withheld in production — if a Maps feature ever needs it, that is a
// deliberate trade to make, not something to grant pre-emptively.
const GOOGLE_MAPS_SCRIPT = "https://maps.googleapis.com";
const GOOGLE_MAPS_CONNECT = "https://maps.googleapis.com https://maps.gstatic.com";

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' ${GOOGLE_MAPS_SCRIPT}${isProduction ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://fonts.gstatic.com",
  `connect-src 'self' https://*.supabase.co wss://*.supabase.co ${GOOGLE_MAPS_CONNECT}`,
  // Maps runs parts of itself in blob-backed workers; without this they fall
  // through to default-src and are refused.
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://*.supabase.co",
  "frame-ancestors 'none'",
  isProduction ? "upgrade-insecure-requests" : "",
].filter(Boolean).join("; ");

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: "7mb",
    },
  },
  async redirects() {
    return isProduction
      ? [{
          source: "/:path*",
          has: [{ type: "host", value: "www.jobos.com.au" }],
          destination: "https://jobos.com.au/:path*",
          permanent: true,
        }]
      : [];
  },
  async headers() {
    const securityHeaders = [
      { key: "Content-Security-Policy", value: contentSecurityPolicy },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), browsing-topics=()" },
      ...(isProduction
        ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
        : []),
    ];

    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

export default nextConfig;
