import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["ws"],
  transpilePackages: ["@copium/config"],
};

export default nextConfig;
