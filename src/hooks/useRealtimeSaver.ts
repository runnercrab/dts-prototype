"use client";

import { useCallback, useEffect, useRef } from "react";

type SaveResponseInput = {
  assessmentId: string;
  criterionId: string;

  as_is_level?: number | null;
  to_be_level?: number | null;
  importance?: number | null;
  note?: string | null;
};

type UseRealtimeSaverOptions = {
  /**
   * Cada cuántos ms intentamos enviar el último estado acumulado.
   * Si el usuario mueve sliders rápido, esto evita spamear requests.
   */
  debounceMs?: number;

  /**
   * Si quieres enganchar logs en UI (opcional)
   */
  onError?: (err: unknown) => void;
  onSaved?: () => void;
};

/**
 * useRealtimeSaver (versión segura)
 * - Antes: supabase.from('dts_responses').upsert(...) desde cliente
 * - Ahora: POST /api/dts/responses/upsert (server-side con service role)
 *
 * Esto encaja con producto B2B: el navegador no escribe tablas core.
 */
export default function useRealtimeSaver(options: UseRealtimeSaverOptions = {}) {
  const debounceMs = options.debounceMs ?? 600;

  // guardamos el último payload pendiente por criterio (key = criterionId)
  const pendingRef = useRef<Map<string, SaveResponseInput>>(new Map());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inflightRef = useRef(false);
  const destroyedRef = useRef(false);

  const flush = useCallback(async () => {
    if (inflightRef.current) return;
    if (destroyedRef.current) return;

    const pending = pendingRef.current;
    if (pending.size === 0) return;

    inflightRef.current = true;

    try {
      // Enviamos en serie (simple y robusto).
      // Si quieres batch, lo hacemos luego, pero primero seguridad y estabilidad.
      for (const [, payload] of pending) {
        const res = await fetch("/api/dts/responses/upsert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, source: "realtimeSaver" }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(
            `Upsert failed (${res.status}): ${JSON.stringify(data)}`
          );
        }
      }

      pending.clear();
      options.onSaved?.();
    } catch (err) {
      options.onError?.(err);
      // No limpiamos pending: así no pierdes datos; se reintentará en el próximo flush
      // (Si quieres backoff y retries, lo añadimos después.)
    } finally {
      inflightRef.current = false;
    }
  }, [options]);

  const scheduleFlush = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      flush();
    }, debounceMs);
  }, [debounceMs, flush]);

  /**
   * Llama a esto cada vez que el usuario cambie un valor
   * (slider / input / etc.). El hook se encarga de debouncing + envío.
   */
  const enqueueSave = useCallback(
    (input: SaveResponseInput) => {
      if (!input?.assessmentId || !input?.criterionId) return;

      pendingRef.current.set(input.criterionId, {
        assessmentId: input.assessmentId,
        criterionId: input.criterionId,
        as_is_level: input.as_is_level ?? null,
        to_be_level: input.to_be_level ?? null,
        importance: input.importance ?? null,
        note: input.note ?? null,
      });

      scheduleFlush();
    },
    [scheduleFlush]
  );

  // Flush final al desmontar (best effort)
  useEffect(() => {
    destroyedRef.current = false;
    return () => {
      destroyedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      // No podemos "await" en cleanup, pero disparamos best-effort:
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      flush();
    };
  }, [flush]);

  return {
    enqueueSave,
    flush,
    pendingCount: () => pendingRef.current.size,
  };
}
