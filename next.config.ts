// next.config.ts
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  async rewrites() {
    // En desarrollo, proxyear a tu backend local
    if (isDev) {
      return [
        {
          source: "/api/:path*",
          destination: "http://localhost:8000/api/:path*",
        },
      ];
    }
    // En producción NO reescribimos nada: /api la maneja Nginx
    return [];
  },
};

export default nextConfig;
