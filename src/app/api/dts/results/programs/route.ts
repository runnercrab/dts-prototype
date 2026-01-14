// src/app/api/dts/results/programs/route.ts
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

/**
 * Normaliza UUIDs que vengan “sucios”:
 * - trailing slash: "uuid/"
 * - espacios
 * - accidental query fragments
 */
function normalizeUuid(raw: string) {
  const s = (raw || "").trim();
  const noTrailingSlashes = s.replace(/\/+$/g, "");
  const firstToken = noTrailingSlashes.split(/[?#&\s]/)[0];
  return firstToken;
}

function toNumber(v: any, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeProgramItem(item: any) {
  const tc = Array.isArray(item?.top_contributors) ? item.top_contributors : [];

  return {
    ...item,

    // numerics (Postgres numeric puede venir como string)
    weighted_need: toNumber(item?.weighted_need, 0),
    value_score: toNumber(item?.value_score, 0),
    program_score: toNumber(item?.program_score, 0),

    top_contributors_need: toNumber(item?.top_contributors_need, 0),
    top_contributors_share: toNumber(item?.top_contributors_share, 0),
    top_contributors_count: toNumber(item?.top_contributors_count, 0),

    // top contributors numeric fields
    top_contributors: tc.map((c: any) => ({
      ...c,
      need_component: toNumber(c?.need_component, 0),
      gap: toNumber(c?.gap, 0),
      importance: toNumber(c?.importance, 0),
      map_weight: toNumber(c?.map_weight, 0),
      pack_weight: toNumber(c?.pack_weight, 0),
    })),
  };
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

  // 1) assessment + pack (para devolver "pack" en respuesta)
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

  // 2) RPC canónica (PROGRAMS)
  const { data, error } = await supabase.rpc("dts_results_programs_v2", {
    p_assessment_id: assessmentId,
    p_only_shortlist: onlyShortlist,
    p_use_overrides: useOverrides,
  });

  if (error) {
    console.error("[api programs] rpc error:", error);
    return NextResponse.json(
      { error: "Error ejecutando ranking de programas", details: error.message },
      { status: 500 }
    );
  }

  const rawItems = data ?? [];
  const items = rawItems.map(normalizeProgramItem);

  // thresholds UI-level (por ahora fijo)
  const thresholds = { top: 8, mid_end: 18 };

  return NextResponse.json({
    assessment_id: assessmentId,
    pack: assessment.pack,
    thresholds,
    count: items.length,
    items,
  });
}
