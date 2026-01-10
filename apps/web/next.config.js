/** @type {import('next').NextConfig} */
const nextConfig = {
  // E2E用に別のビルドディレクトリを使用
  distDir: process.env.NEXT_E2E === "true" ? ".next-e2e" : ".next",
  serverExternalPackages: ["postgres"],
  transpilePackages: ["@packages/db", "@packages/logger"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
    ],
  },
  async headers() {
    const isDev = process.env.NODE_ENV === "development"

    // Base CSP for all environments
    const baseCSP = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "frame-ancestors 'none'",
    ]

    // Development-specific additions
    const devCSP = [
      "connect-src 'self' ws: wss: http://localhost:* https://*.vercel.app",
    ]

    // Production-specific additions
    const prodCSP = [
      "connect-src 'self' https://*.vercel.app",
      "upgrade-insecure-requests",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ]

    const csp = [...baseCSP, ...(isDev ? devCSP : prodCSP)].join("; ")

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: csp,
          },
        ],
      },
    ]
  },
}

export default nextConfig
