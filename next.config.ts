// dts-prototype/next.config.ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // evita que el build falle por reglas de ESLint
  eslint: { ignoreDuringBuilds: true },

  // descomenta si te bloqueara TS en build:
  // typescript: { ignoreBuildErrors: true },

  // Rewrites consolidadas (migradas de next.config.js, eliminado en favor de este .ts).
  async rewrites() {
    return [
      // gapply.io/ sirve el contenido de /dts sin cambiar la URL visible.
      // /dts sigue accesible por su URL propia, no rompe enlaces existentes.
      { source: '/', destination: '/dts' },
      // URLs limpias para los HTML estáticos del directorio public/.
      { source: '/plan',            destination: '/plan.html' },
      { source: '/plan-financiero', destination: '/plan-financiero.html' },
    ];
  },
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

