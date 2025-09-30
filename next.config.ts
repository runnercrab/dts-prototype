// dts-prototype/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // evita que el build falle por reglas de ESLint
  eslint: { ignoreDuringBuilds: true },

  // descomenta si te bloqueara TS en build:
  // typescript: { ignoreBuildErrors: true },
};

export default nextConfig;
