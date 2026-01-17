// src/lib/dts/quadrants.ts

export type QuadrantKey =
  | "quick_win"
  | "transformational"
  | "foundation"
  | "maintenance";

// ✅ Regla Big4 CONSERVADORA (CEO-friendly)
// - Alto impacto si impact >= 3
// - Bajo esfuerzo SOLO si effort <= 2
// - effort=3 cuenta como alto esfuerzo (evita “quick wins falsos”)
export function quadrantOf(impact: number, effort: number): QuadrantKey {
  const HIGH_IMPACT = impact >= 3;
  const LOW_EFFORT = effort <= 2;

  if (HIGH_IMPACT && LOW_EFFORT) return "quick_win"; // verde
  if (HIGH_IMPACT && !LOW_EFFORT) return "transformational"; // azul
  if (!HIGH_IMPACT && !LOW_EFFORT) return "foundation"; // rojo
  return "maintenance"; // suave
}

export function stylesForQuadrant(q: QuadrantKey) {
  switch (q) {
    case "quick_win":
      return {
        dot_bg: "bg-emerald-600",
        dot_ring: "ring-emerald-200",
        dot_text: "text-white",
        dot_shadow: "shadow-[0_30px_70px_rgba(16,185,129,0.30)]",
      };

    case "transformational":
      return {
        dot_bg: "bg-blue-800",
        dot_ring: "ring-blue-200",
        dot_text: "text-white",
        dot_shadow: "shadow-[0_30px_70px_rgba(30,64,175,0.30)]",
      };

    case "foundation":
      return {
        dot_bg: "bg-red-600",
        dot_ring: "ring-red-200",
        dot_text: "text-white",
        dot_shadow: "shadow-[0_30px_70px_rgba(239,68,68,0.25)]",
      };

    case "maintenance":
    default:
      return {
        dot_bg: "bg-slate-200",
        dot_ring: "ring-slate-300",
        dot_text: "text-slate-900",
        dot_shadow: "shadow-[0_20px_50px_rgba(15,23,42,0.10)]",
      };
  }
}
