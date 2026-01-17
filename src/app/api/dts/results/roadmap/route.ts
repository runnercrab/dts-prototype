// src/app/api/dts/results/roadmap/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function normalizeUuid(raw: string) {
  const s = (raw || "").trim();
  const noTrailingSlashes = s.replace(/\/+$/g, "");
  const firstToken = noTrailingSlashes.split(/[?#&\s]/)[0];
  return firstToken;
}

function parseBool(v: string | null, defaultValue: boolean) {
  if (v === null || v === undefined || v === "") return defaultValue;
  const s = v.toLowerCase();
  if (s === "1" || s === "true" || s === "yes") return true;
  if (s === "0" || s === "false" || s === "no") return false;
  return defaultValue;
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

type QuadrantKey =
  | "quick_win"
  | "transformational"
  | "foundation"
  | "maintenance";

type PhaseKey = "0-1" | "1-2" | "2-4";

type RoadmapProgram = {
  rank: number;
  program_id: string;
  program_code: string;
  title: string;
  quadrant: QuadrantKey;
  impact_score: number; // 1..5
  effort_score: number; // 1..5
  why_now: string;
};

type RoadmapPhase = {
  phase: PhaseKey;
  title: string;
  subtitle: string;
  programs: RoadmapProgram[];
};

function phaseMeta(phase: PhaseKey) {
  switch (phase) {
    case "0-1":
      return {
        title: "Impacto rápido y foco",
        subtitle:
          "Acciones que generan tracción sin sobrecargar a la organización.",
      };
    case "1-2":
      return {
        title: "Transformación estructural",
        subtitle:
          "Programas que crean capacidades estables para escalar y operar mejor.",
      };
    case "2-4":
      return {
        title: "Consolidación y escala",
        subtitle:
          "Programas prioritarios que movemos a la siguiente ola para respetar la capacidad de ejecución.",
      };
  }
}

// ✅ FASES COMO “OLAS” POR CAPACIDAD (Big4 real)
// - Quick Wins van a 0-1
// - Transformational arranca en 1-2
// - Si 1-2 se llena, derrama a 2-4
// - Foundation/Maintenance no entran al roadmap inicial (foco ejecutivo)
function phaseFor(quadrant: QuadrantKey): PhaseKey | null {
  if (quadrant === "quick_win") return "0-1";
  if (quadrant === "transformational") return "1-2";
  return null;
}

function whyNow(quadrant: QuadrantKey, phase: PhaseKey): string {
  if (quadrant === "quick_win") {
    return "Genera impacto visible rápido y crea tracción interna para el resto del plan.";
  }
  // transformational
  if (phase === "1-2") {
    return "Aporta alto impacto con complejidad controlada; es el siguiente paso lógico tras los Quick Wins.";
  }
  // phase === "2-4"
  return "Es prioritario, pero lo movemos a la siguiente ola para no saturar la capacidad de ejecución.";
}

function quadrantOf(impact: number, effort: number): QuadrantKey {
  // Misma filosofía que Matriz:
  // Quick Win = alto impacto + bajo esfuerzo (<=2)
  // Transformational = alto impacto + alto esfuerzo (>=3)
  // Foundation = bajo impacto + alto esfuerzo
  // Maintenance = bajo impacto + bajo esfuerzo
  const HIGH_IMPACT = impact >= 3;
  const LOW_EFFORT = effort <= 2;

  if (HIGH_IMPACT && LOW_EFFORT) return "quick_win";
  if (HIGH_IMPACT && !LOW_EFFORT) return "transformational";
  if (!HIGH_IMPACT && !LOW_EFFORT) return "foundation";
  return "maintenance";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const assessmentIdRaw = searchParams.get("assessmentId") || "";
  const assessmentId = normalizeUuid(assessmentIdRaw);

  const onlyShortlist = parseBool(searchParams.get("onlyShortlist"), false);
  const useOverrides = parseBool(searchParams.get("useOverrides"), true);

  // capacidad por fase
  const maxPerPhase = clamp(toInt(searchParams.get("maxPerPhase"), 4), 2, 6);

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

  // 2) Programas canónicos
  const { data, error } = await supabase.rpc("dts_results_programs_v2", {
    p_assessment_id: assessmentId,
    p_only_shortlist: onlyShortlist,
    p_use_overrides: useOverrides,
  });

  if (error) {
    console.error("[api roadmap] rpc error:", error);
    return NextResponse.json(
      { error: "Error obteniendo programas para roadmap", details: error.message },
      { status: 500 }
    );
  }

  const rows = Array.isArray(data) ? data : [];

  // Ranked (ya viene rankeado desde RPC, reforzamos estabilidad)
  const ranked = rows
    .map((p: any) => {
      const impact = clamp(toInt(p.impact_score, 1), 1, 5);
      const effort = clamp(toInt(p.effort_score, 1), 1, 5);

      // si el RPC trae quadrant, lo respetamos; si no, lo inferimos
      const q: QuadrantKey =
        (p?.quadrant as QuadrantKey) || quadrantOf(impact, effort);

      const phase = phaseFor(q);

      return {
        rank: clamp(toInt(p.rank, 999), 1, 999),
        program_id: p.program_id,
        program_code: p.program_code,
        title: p.title,
        quadrant: q,
        impact_score: impact,
        effort_score: effort,
        phase,
      };
    })
    .sort((a: any, b: any) => a.rank - b.rank);

  const buckets: Record<PhaseKey, RoadmapProgram[]> = {
    "0-1": [],
    "1-2": [],
    "2-4": [],
  };

  function pushWithSpill(targetPhase: PhaseKey, item: any) {
    const toProg: RoadmapProgram = {
      rank: item.rank,
      program_id: item.program_id,
      program_code: item.program_code,
      title: item.title,
      quadrant: item.quadrant,
      impact_score: item.impact_score,
      effort_score: item.effort_score,
      why_now: whyNow(item.quadrant, targetPhase),
    };

    if (buckets[targetPhase].length < maxPerPhase) {
      buckets[targetPhase].push(toProg);
      return;
    }

    // Derrame por capacidad:
    // 0-1 -> 1-2 -> 2-4
    if (targetPhase === "0-1") return pushWithSpill("1-2", { ...item });
    if (targetPhase === "1-2") return pushWithSpill("2-4", { ...item });
    // 2-4 lleno: se queda fuera (MVP: foco)
  }

  for (const it of ranked) {
    if (!it.phase) continue; // fuera del roadmap inicial (foundation/maintenance)
    pushWithSpill(it.phase, it);
  }

  const phases: RoadmapPhase[] = (["0-1", "1-2", "2-4"] as PhaseKey[]).map(
    (k) => {
      const meta = phaseMeta(k);
      return { phase: k, title: meta.title, subtitle: meta.subtitle, programs: buckets[k] };
    }
  );

  const includedCount = phases.reduce((acc, ph) => acc + ph.programs.length, 0);

  return NextResponse.json({
    assessment_id: assessmentId,
    pack: assessment.pack,
    max_per_phase: maxPerPhase,
    count: includedCount,
    phases,
    rule: {
      quick_win: "alto impacto + bajo esfuerzo (impact >= 3 y effort <= 2)",
      transformational: "alto impacto + alto esfuerzo (impact >= 3 y effort >= 3)",
      phase_mapping: {
        "0-1": "Wave 1 (Quick Wins)",
        "1-2": "Wave 2 (Transformational por prioridad)",
        "2-4": "Wave 3 (Transformational por capacidad)",
      },
      note:
        "Las olas 1-2-3 se asignan por capacidad de ejecución (max por fase), no por esfuerzo. Foundation y Maintenance no entran en el roadmap inicial para mantener foco ejecutivo.",
    },
  });
}
