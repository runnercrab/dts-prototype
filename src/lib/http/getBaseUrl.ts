// src/lib/http/getBaseUrl.ts
import { headers } from "next/headers";

/**
 * Base URL absoluta para fetch() en Server Components / Route Handlers.
 * - Local: usa Host header (localhost:3000)
 * - Vercel/Proxy: usa x-forwarded-host / x-forwarded-proto
 */
export function getBaseUrl(): string {
  const h = headers();

  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";

  return `${proto}://${host}`;
}
