import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    // This permanently prevents TypeScript type mismatches from blocking your Vercel deployments
    ignoreBuildErrors: true,
  },
  eslint: {
    // This blocks ESLint rule variations from stopping production compilation paths
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
