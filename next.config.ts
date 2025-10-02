import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Skip build-time data collection for API routes
  staticPageGenerationTimeout: 120,
};

export default nextConfig;
