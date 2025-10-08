// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {

  // (opcional si usarás rewrites más abajo)
  async rewrites() {
    return [
      {
        source: "/api/:path*",                              // lo que tu front consumirá
        destination: `${process.env.API_BASE_URL}/:path*`, // tu backend real
      },
    ];
  },
};

export default nextConfig;
