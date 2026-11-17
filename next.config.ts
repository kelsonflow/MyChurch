import type { NextConfig } from "next";
const config: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  experimental: {
    serverActions: {
      allowedOrigins: [
        "mychurch-kelsonflow.web.app",
        "mychurch-kelsonflow.firebaseapp.com",
      ],
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self'${process.env.NODE_ENV === "development" ? " ws: wss:" : ""}; frame-src https://www.youtube-nocookie.com https://www.google.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'`,
          },
        ],
      },
    ];
  },
};
export default config;
