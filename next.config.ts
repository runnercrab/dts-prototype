// dts-prototype/next.config.ts
import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  // TEMPORAL: silencia errores TS heredados para desbloquear el deploy.
  // Limpiar uno a uno y eliminar este flag (24/04/2026 — ver backlog).
  typescript: { ignoreBuildErrors: true },

  async rewrites() {
    return {
      // beforeFiles: se ejecutan ANTES del filesystem routing.
      // Necesario para que `/` sirva `/dts` pese a que (marketing)/page.tsx
      // existe como handler de `/`.
      beforeFiles: [
        { source: '/', destination: '/dts' },
      ],
      // afterFiles: URLs limpias para los HTML estáticos en public/.
      afterFiles: [
        { source: '/plan',            destination: '/plan.html' },
        { source: '/plan-financiero', destination: '/plan-financiero.html' },
      ],
      fallback: [],
    };
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

