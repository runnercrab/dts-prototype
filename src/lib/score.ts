// src/lib/score.ts
/**
 * Calcula el DTS en escala 0–100 a partir de valores 0–maxPerQ.
 * - `values`: array con las 6 (o N) puntuaciones del radar (0..maxPerQ)
 * - `maxPerQ`: máximo por pregunta (por defecto 10)
 * Devuelve un entero redondeado.
 */
export function computeScore(values: number[], maxPerQ = 10): number {
  if (!values?.length || maxPerQ <= 0) return 0
  const bounded = values.map(v =>
    Number.isFinite(v) ? Math.min(Math.max(v, 0), maxPerQ) : 0
  )
  const sum = bounded.reduce((a, b) => a + b, 0)
  const score = (sum / (bounded.length * maxPerQ)) * 100
  return Math.round(score)
}
