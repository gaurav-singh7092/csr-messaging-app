import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Output standalone for optimized production builds
  output: "standalone",
  
  // Environment variables available at build time
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
  },
};

export default nextConfig;
