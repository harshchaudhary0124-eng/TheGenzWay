/** @type {import('next').NextConfig} */

// Security headers applied to every response. Deliberately conservative so they
// don't interfere with the app's inline styles, Google Fonts, dynamic API/WS
// origins, or Next.js hydration scripts (i.e. the CSP omits default-src/
// script-src/style-src and only restricts framing/base/object/form targets).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'",
  },
];

// HSTS only in production builds (and only meaningful over HTTPS).
if (process.env.NODE_ENV === "production") {
  securityHeaders.push({
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  });
}

const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
