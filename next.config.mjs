const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      process.env.NODE_ENV === "production" ? "script-src 'self' 'unsafe-inline'" : "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' blob: data: https:",
      "media-src 'self' blob: https:",
      "worker-src 'self' blob:",
      "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com",
      "frame-src 'none'",
      "font-src 'self' data:"
    ].join("; ")
  }
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const headers = process.env.NODE_ENV === "production"
      ? [...securityHeaders, { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
      : securityHeaders;
    return [{ source: "/(.*)", headers }];
  }
};

export default nextConfig;
