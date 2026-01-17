// src/app/api/dts/results/programs/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * ✅ CANÓNICO
 * /api/dts/results/programs?assessmentId=...&onlyShortlist=0|1&useOverrides=0|1
 *
 * Devuelve el ranking de Programas (macro) ya calculado por backend (RPC),
 * para que el frontend SOLO pinte.
 */

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
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function toInt(v: any, fallback = 0) {
  return Math.round(toNum(v, fallback));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Si tu RPC ya trae "priority_badge" y "priority_reason", perfecto.
 * Si no, lo calculamos aquí de forma determinista.
 */
function priorityBadge(rank: number, thresholds: { top: number; mid_end: number }) {
  if (rank <= thresholds.top) return "🟢 TOP";
  if (rank <= thresholds.mid_end) return "🟡 MEDIA";
  return "⚪ BAJA";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const assessmentIdRaw = searchParams.get("assessmentId") || "";
  const assessmentId = normalizeUuid(assessmentIdRaw);

  const onlyShortlist = parseBool(searchParams.get("onlyShortlist"), false);
  const useOverrides = parseBool(searchParams.get("useOverrides"), true);

  // Umbrales de badges (por defecto como en tus ejemplos)
  const thresholds = {
    top: clamp(toInt(searchParams.get("top"), 8), 1, 50),
    mid_end: clamp(toInt(searchParams.get("midEnd"), 18), 1, 200),
  };

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
  // Debe devolver filas ya rankeadas y con métricas (need, impact, effort, score, etc.)
  const { data, error } = await supabase.rpc("dts_results_programs_v2", {
    p_assessment_id: assessmentId,
    p_only_shortlist: onlyShortlist,
    p_use_overrides: useOverrides,
  });

  if (error) {
    console.error("[api programs] rpc error:", error);
    return NextResponse.json(
      { error: "Error obteniendo programas", details: error.message },
      { status: 500 }
    );
  }

  const rows = Array.isArray(data) ? data : [];

  // Normalización de salida (NUMERIC/NULL -> number/null) sin inventar datos.
  const items = rows
    .map((r: any) => {
      const rank = clamp(toInt(r.rank, 999), 1, 999);

      const impact = clamp(toInt(r.impact_score, 0), 0, 5);
      const effort = clamp(toInt(r.effort_score, 0), 0, 5);

      const weighted_need =
        r.weighted_need === null || r.weighted_need === undefined
          ? null
          : toNum(r.weighted_need, 0);

      const value_score =
        r.value_score === null || r.value_score === undefined
          ? null
          : toNum(r.value_score, 0);

      const program_score =
        r.program_score === null || r.program_score === undefined
          ? null
          : toNum(r.program_score, 0);

      // "criteria_covered" suele ser int
      const criteria_covered =
        r.criteria_covered === null || r.criteria_covered === undefined
          ? null
          : toInt(r.criteria_covered, 0);

      // top_contributors (si viene del RPC, lo respetamos)
      const top_contributors = Array.isArray(r.top_contributors)
        ? r.top_contributors.map((c: any) => ({
            gap: toInt(c.gap, 0),
            title: c.title ?? null,
            importance: toInt(c.importance, 0),
            map_weight: toNum(c.map_weight, 0),
            pack_weight: toNum(c.pack_weight, 0),
            criteria_code: c.criteria_code ?? null,
            need_component: toNum(c.need_component, 0),
          }))
        : [];

      const top_contributors_need =
        r.top_contributors_need === null || r.top_contributors_need === undefined
          ? null
          : toNum(r.top_contributors_need, 0);

      const top_contributors_share =
        r.top_contributors_share === null || r.top_contributors_share === undefined
          ? null
          : toNum(r.top_contributors_share, 0);

      const top_contributors_count =
        r.top_contributors_count === null || r.top_contributors_count === undefined
          ? null
          : toInt(r.top_contributors_count, 0);

      // badge/reason: si el RPC no los trae, los generamos con lo que haya.
      const computedBadge = priorityBadge(rank, thresholds);

      // reason: si viene del RPC la respetamos; si no, intentamos construir una frase mínima.
      let computedReason: string | null = r.priority_reason ?? null;
      if (!computedReason) {
        // Solo si tenemos los 3 ingredientes; si no, lo dejamos null (sin inventar).
        if (weighted_need !== null && impact > 0 && effort > 0 && program_score !== null) {
          computedReason = `Need ${weighted_need.toFixed(2)} × Impact ${impact} / Effort ${effort} ⇒ ${program_score.toFixed(
            2
          )} (${rank <= thresholds.top ? `Top ${thresholds.top}` : rank <= thresholds.mid_end ? `Rank ${thresholds.top + 1}..${thresholds.mid_end}` : `Rank > ${thresholds.mid_end}`})`;
        }
      }

      return {
        rank,
        program_id: r.program_id ?? null,
        program_code: r.program_code ?? null,
        title: r.title ?? null,

        status: r.status ?? null,

        impact_score: impact || null,
        effort_score: effort || null,

        weighted_need,
        value_score,
        program_score,

        criteria_covered,

        notes: r.notes ?? null,
        owner: r.owner ?? null,

        // si el RPC trae badge, lo usamos; si no, usamos el calculado
        priority_badge: r.priority_badge ?? computedBadge,
        priority_reason: computedReason,

        top_contributors,
        top_contributors_need,
        top_contributors_share,
        top_contributors_count,
      };
    })
    .sort((a: any, b: any) => (a.rank ?? 999) - (b.rank ?? 999));

  return NextResponse.json({
    assessment_id: assessmentId,
    pack: assessment.pack,
    thresholds,
    count: items.length,
    items,
  });
}
