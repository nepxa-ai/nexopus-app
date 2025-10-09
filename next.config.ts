// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  async rewrites() {
    if (isDev) {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/:path*", // sin /api aquí
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
