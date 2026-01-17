// src/app/api/dts/results/matriz/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function parseBool(v: string | null, defaultValue: boolean) {
  if (v === null || v === undefined || v === "") return defaultValue;
  const s = v.toLowerCase();
  if (s === "1" || s === "true" || s === "yes") return true;
  if (s === "0" || s === "false" || s === "no") return false;
  return defaultValue;
}

function normalizeUuid(raw: string) {
  const s = (raw || "").trim();
  const noTrailingSlashes = s.replace(/\/+$/g, "");
  const firstToken = noTrailingSlashes.split(/[?#&\s]/)[0];
  return firstToken;
}

function toNum(v: any, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number") return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function toInt(v: any, fallback = 0) {
  return Math.round(toNum(v, fallback));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

type QuadrantKey =
  | "quick_win"
  | "transformational"
  | "foundation"
  | "maintenance";

// ✅ REGLA CONCEPTUAL (Big4 CEO-friendly)
// Eje vertical = impacto (alto si >=3)
// Eje horizontal = esfuerzo (bajo si <=2)  <-- IMPORTANTE: effort=3 cuenta como alto esfuerzo
function quadrantOf(impact: number, effort: number): QuadrantKey {
  const HIGH_IMPACT = impact >= 3;
  const LOW_EFFORT = effort <= 2;

  if (HIGH_IMPACT && LOW_EFFORT) return "quick_win"; // verde
  if (HIGH_IMPACT && !LOW_EFFORT) return "transformational"; // azul
  if (!HIGH_IMPACT && !LOW_EFFORT) return "foundation"; // rojo
  return "maintenance"; // suave
}

function stylesForQuadrant(q: QuadrantKey) {
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

function shortLabel(programCode: string) {
  // "DTS-PROG-01" -> "PROG-01"
  const m = (programCode || "").match(/PROG[-_ ]?(\d+)/i);
  if (!m) return (programCode || "").slice(-7);
  return `PROG-${m[1].padStart(2, "0")}`;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const assessmentIdRaw = searchParams.get("assessmentId") || "";
  const assessmentId = normalizeUuid(assessmentIdRaw);

  const onlyShortlist = parseBool(searchParams.get("onlyShortlist"), false);
  const useOverrides = parseBool(searchParams.get("useOverrides"), true);

  if (!assessmentId || !isUuid(assessmentId)) {
    return NextResponse.json(
      {
        error: "assessmentId inválido (UUID requerido)",
        received: assessmentIdRaw,
        normalized: assessmentId,
      },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 1) assessment + pack
  const { data: assessment, error: aErr } = await supabase
    .from("dts_assessments")
    .select("id, pack")
    .eq("id", assessmentId)
    .single();

  if (aErr || !assessment) {
    return NextResponse.json(
      { error: "Assessment no encontrado", details: aErr?.message ?? null },
      { status: 404 }
    );
  }

  // 2) Programas canónicos (RPC)
  const { data, error } = await supabase.rpc("dts_results_programs_v2", {
    p_assessment_id: assessmentId,
    p_only_shortlist: onlyShortlist,
    p_use_overrides: useOverrides,
  });

  if (error) {
    console.error("[api matriz] rpc error:", error);
    return NextResponse.json(
      { error: "Error obteniendo programas para matriz", details: error.message },
      { status: 500 }
    );
  }

  const rows = Array.isArray(data) ? data : [];

  // Plot tuning (garantía: no se salen)
  const MARGIN = 10; // %
  const STEP = 3.0; // % separación colisiones
  const EPS = 1.5; // % empuje por eje

  // Ejes en porcentaje (backend, frontend solo pinta)
  const axisImpact = 3;
  const axisEffort = 2.5; // corte visual entre 2 y 3 (porque la regla real es <=2)
  const axis_x_pct = lerp(MARGIN, 100 - MARGIN, (axisEffort - 1) / 4);
  const axis_y_pct = lerp(100 - MARGIN, MARGIN, (axisImpact - 1) / 4);

  // Base items
  const base = rows.map((p: any) => {
    const impact = clamp(toInt(p.impact_score, 1), 1, 5);
    const effort = clamp(toInt(p.effort_score, 1), 1, 5);
    const quadrant = quadrantOf(impact, effort);

    // 1..5 -> 10..90
    const x0 = lerp(MARGIN, 100 - MARGIN, (effort - 1) / 4);
    const y0 = lerp(100 - MARGIN, MARGIN, (impact - 1) / 4);

    return {
      rank: toInt(p.rank, 999),
      program_id: p.program_id,
      program_code: p.program_code,
      dot_label: shortLabel(p.program_code),
      title: p.title,
      impact_score: impact,
      effort_score: effort,
      quadrant,
      x0,
      y0,
    };
  });

  // Agrupar por celda (impact, effort, quadrant)
  const groups = new Map<string, any[]>();
  for (const it of base) {
    const key = `${it.quadrant}|I${it.impact_score}|E${it.effort_score}`;
    const arr = groups.get(key) ?? [];
    arr.push(it);
    groups.set(key, arr);
  }

  // offsets en “anillo” deterministas
  const offsetPattern: Array<[number, number]> = [
    [0, 0],
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
    [-2, 0],
    [2, 0],
    [0, -2],
    [0, 2],
  ];

  const items: any[] = [];
  for (const arr of groups.values()) {
    arr.sort((a, b) => a.rank - b.rank);

    for (let i = 0; i < arr.length; i++) {
      const it = arr[i];
      const [ox, oy] = offsetPattern[i] ?? offsetPattern[offsetPattern.length - 1];

      let x = it.x0;
      let y = it.y0;

      // Evitar “puntos clavados” en la cruz visual
      if (it.effort_score === 3) x += EPS; // effort=3 empuje derecha
      if (it.impact_score === 3) y -= EPS; // impact=3 empuje arriba

      // Dispersión por colisión
      x += ox * STEP;
      y += oy * STEP;

      // Clamp final
      x = clamp(x, MARGIN, 100 - MARGIN);
      y = clamp(y, MARGIN, 100 - MARGIN);

      const styles = stylesForQuadrant(it.quadrant);

      items.push({
        rank: it.rank,
        program_id: it.program_id,
        program_code: it.program_code,
        dot_label: it.dot_label,
        title: it.title,
        impact_score: it.impact_score,
        effort_score: it.effort_score,
        quadrant: it.quadrant,
        x_pct: x,
        y_pct: y,
        ...styles,
      });
    }
  }

  items.sort((a, b) => a.rank - b.rank);

  return NextResponse.json({
    assessment_id: assessmentId,
    pack: assessment.pack,
    plot: {
      margin_pct: MARGIN,
      axis_x_pct,
      axis_y_pct,
      rule: {
        high_impact: "impact >= 3",
        low_effort: "effort <= 2",
        note: "Big4 conservadora: effort=3 cuenta como alto esfuerzo (no Quick Win).",
      },
    },
    count: items.length,
    items,
  });
}
