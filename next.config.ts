import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export',  ← COMMENTED: API routes require server runtime (Vercel serverless)
};

export default nextConfig;
