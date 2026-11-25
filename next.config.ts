import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Allow the sandbox preview panel (embedded browser served from
  // chat.z.ai / *.space-z.ai) to load dev assets without cross-origin issues.
  allowedDevOrigins: ["chat.z.ai", "*.space-z.ai"],
  // Skip the Next.js dev-tools indicator overlay: it ships a ~224 KB chunk on
  // every page load in dev mode, which is brutal on slow mobile previews.
  devIndicators: false,
  // Bundle the SQLite database (and the Prisma schema) into every
  // serverless function so the runtime copy in src/lib/db.ts can reach them
  // on hosts with a read-only filesystem (Vercel).
  outputFileTracingIncludes: {
    "/**": ["./db/custom.db", "./prisma/**"],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
