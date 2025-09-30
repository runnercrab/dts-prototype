// dts-prototype/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Omite ESLint en el build de producción (Vercel)
  eslint: { ignoreDuringBuilds: true },

  // (opcional) si hubiera errores de tipos TS que bloqueen el build:
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
