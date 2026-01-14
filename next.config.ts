// dts-prototype/next.config.ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // evita que el build falle por reglas de ESLint
  eslint: { ignoreDuringBuilds: true },
  
  // descomenta si te bloqueara TS en build:
  // typescript: { ignoreBuildErrors: true },
};

// Exportar configuración con Sentry
export default withSentryConfig(
  nextConfig,
  {
    // Configuración del plugin de Sentry
    silent: true, // Suprime logs del plugin
    org: "dts",
    project: "dts-prototype",
  }
);

