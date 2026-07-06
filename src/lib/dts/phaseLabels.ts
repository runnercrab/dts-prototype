// src/lib/dts/phaseLabels.ts
//
// M3 — Diccionario fase→etiqueta (contrato §5, ítem 5 / D-r5a).
// PRESENTACIÓN PURA Y MECÁNICA: traduce el entero de fase del motor v3
// (`dts_v3_generate_roadmap` → programas[].fase) a una etiqueta visible.
//
// PROHIBIDO por contrato: meses, horas, condiciones, lógica metodológica.
// La fase la calcula el motor v3; aquí SOLO se le pone nombre.
//
// La única razón de este módulo es que "Fase" es texto de presentación:
// si mañana se traduce o se renombra, se cambia aquí, no en el motor.

/** Etiqueta mecánica de una fase del roadmap v3. F(n) → "Fase n". */
export function phaseLabel(fase: number): string {
  return `Fase ${fase}`;
}
