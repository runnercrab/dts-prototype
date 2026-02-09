// src/app/api/dts/results/executive-summary/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function extractResultsPayload(data: any) {
  // RPC a veces devuelve [{...}] o { results_v1: {...} } o {...}
  if (Array.isArray(data)) {
    const row = data[0] ?? null;
    return row?.dts_results_v1 ?? row?.results_v1 ?? row ?? null;
  }
  return (data as any)?.dts_results_v1 ?? (data as any)?.results_v1 ?? data ?? null;
}

function normalizeCode(code: string) {
  return (code || "").toString().trim();
}

function clampInt(v: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

/**
 * Resolver robusto de criterios del pack.
 * Soporta:
 * - dts_pack_criteria.pack = packCode
 * - dts_pack_criteria.pack_code = packCode
 * - dts_pack_criteria.pack_id (uuid) + dts_packs(code->id)
 */
async function resolvePackCriteriaIds(supabase: any, packCode: string) {
  const attempts: Array<{ where: string; count: number | null; error?: string }> =
    [];

  // 1) pack
  {
    const { data, error } = await supabase
      .from("dts_pack_criteria")
      .select("criteria_id")
      .eq("pack", packCode);

    attempts.push({
      where: "dts_pack_criteria.pack",
      count: Array.isArray(data) ? data.length : null,
      error: error?.message,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return { criteriaIds: data.map((r: any) => r.criteria_id).filter(Boolean), attempts };
    }
  }

  // 2) pack_code
  {
    const { data, error } = await supabase
      .from("dts_pack_criteria")
      .select("criteria_id")
      .eq("pack_code", packCode);

    attempts.push({
      where: "dts_pack_criteria.pack_code",
      count: Array.isArray(data) ? data.length : null,
      error: error?.message,
    });

    if (!error && Array.isArray(data) && data.length > 0) {
      return { criteriaIds: data.map((r: any) => r.criteria_id).filter(Boolean), attempts };
    }
  }

  // 3) dts_packs.code -> id -> dts_pack_criteria.pack_id
  {
    const { data: packRow, error: packErr } = await supabase
      .from("dts_packs")
      .select("id, code")
      .eq("code", packCode)
      .maybeSingle();

    attempts.push({
      where: "dts_packs.code -> dts_pack_criteria.pack_id",
      count: null,
      error: packErr?.message,
    });

    if (!packErr && packRow?.id) {
      const { data, error } = await supabase
        .from("dts_pack_criteria")
        .select("criteria_id")
        .eq("pack_id", packRow.id);

      attempts.push({
        where: `dts_pack_criteria.pack_id = dts_packs.id (${packRow.id})`,
        count: Array.isArray(data) ? data.length : null,
        error: error?.message,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        return {
          criteriaIds: data.map((r: any) => r.criteria_id).filter(Boolean),
          attempts,
        };
      }
    }
  }

  return { criteriaIds: [], attempts };
}

type ResponseRow = {
  criteria_code: string | null;
  as_is_level: number | null;
  to_be_level: number | null;
  importance: number | null;
};

type CriteriaMetaRow = {
  id: string;
  code: string;
  effort_base_full: number | null;
  effort_base_pyme: number | null;
  short_label?: string | null;
  short_label_es?: string | null;
  description?: string | null;
  description_es?: string | null;
};

function rankByWeightedGap(packCodes: string[], responses: ResponseRow[]) {
  const packSet = new Set(packCodes.map(normalizeCode));
  const bestByCode = new Map<string, number>();

  for (const r of responses) {
    const code = r.criteria_code ? normalizeCode(r.criteria_code) : "";
    if (!code || !packSet.has(code)) continue;
    if (r.as_is_level == null || r.to_be_level == null || r.importance == null) continue;

    const gap = (r.to_be_level as number) - (r.as_is_level as number);
    if (gap <= 0) continue;

    const weighted_gap = gap * (r.importance as number);
    const prev = bestByCode.get(code);
    if (prev == null || weighted_gap > prev) bestByCode.set(code, weighted_gap);
  }

  const sortedCodes = Array.from(bestByCode.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([code]) => code);

  return { sortedCodes };
}

function scoreByWeightedGap(packCodes: string[], responses: ResponseRow[]) {
  const packSet = new Set(packCodes.map(normalizeCode));
  const best = new Map<string, { priority: number; gap: number; importance: number }>();

  for (const r of responses) {
    const code = r.criteria_code ? normalizeCode(r.criteria_code) : "";
    if (!code || !packSet.has(code)) continue;
    if (r.as_is_level == null || r.to_be_level == null || r.importance == null) continue;

    const gap = (r.to_be_level as number) - (r.as_is_level as number);
    if (gap <= 0) continue;

    const importance = r.importance as number;
    const priority = gap * importance;

    const prev = best.get(code);
    if (!prev || priority > prev.priority) best.set(code, { priority, gap, importance });
  }

  const sorted = Array.from(best.entries())
    .map(([code, v]) => ({ code, priority: v.priority, gap: v.gap, importance: v.importance }))
    .sort((a, b) => b.priority - a.priority);

  return { sorted };
}

function assignBands(n: number): Array<"high" | "medium" | "low"> {
  if (n <= 0) return [];
  const highCut = Math.ceil(n * 0.3);
  const medCut = Math.ceil(n * 0.7);

  const out: Array<"high" | "medium" | "low"> = [];
  for (let i = 0; i < n; i++) {
    if (i < highCut) out.push("high");
    else if (i < medCut) out.push("medium");
    else out.push("low");
  }
  return out;
}

export async function GET(req: Request) {
  const requestId = `execsum_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = (searchParams.get("assessmentId") || "").trim();

    const frenosLimit = Math.max(
      1,
      Math.min(12, Number((searchParams.get("frenosLimit") || "8").trim()) || 8)
    );
    const priorLimit = Math.max(
      1,
      Math.min(12, Number((searchParams.get("priorLimit") || "12").trim()) || 12)
    );

    if (!assessmentId || !isUuid(assessmentId)) {
      return NextResponse.json(
        { ok: false, requestId, error: "Invalid assessmentId (expected UUID)" },
        { status: 400 }
      );
    }

    const url = process.env.SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!url || !serviceKey) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "Missing env vars: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    // 0) assessment (pack + estado UX)
    const { data: assessmentRow, error: asErr } = await supabase
      .from("dts_assessments")
      .select("id, pack, status, current_phase")
      .eq("id", assessmentId)
      .single();

    if (asErr || !assessmentRow) {
      return NextResponse.json(
        { ok: false, requestId, error: "Assessment not found" },
        { status: 404 }
      );
    }

    const packCode = String(assessmentRow.pack || "").trim();
    if (!packCode) {
      return NextResponse.json(
        { ok: false, requestId, error: "PACK_MISSING_ON_ASSESSMENT" },
        { status: 409 }
      );
    }

    // 1) coverage (RPC) = tu results/v1 “puro”
    const { data: rpcData, error: rpcErr } = await supabase.rpc("dts_results_v1", {
      p_assessment_id: assessmentId,
    });

    if (rpcErr) {
      return NextResponse.json(
        { ok: false, requestId, error: rpcErr.message },
        { status: 500 }
      );
    }

    const coverage = extractResultsPayload(rpcData);
    if (!coverage || typeof coverage !== "object") {
      return NextResponse.json(
        { ok: false, requestId, error: "No/invalid payload from dts_results_v1" },
        { status: 500 }
      );
    }

    // preferimos assessment_type del RPC si existe
    const assessmentType = String(coverage.assessment_type || "full").toLowerCase().trim();
    const isPyme = assessmentType === "sme" || assessmentType === "pyme" || assessmentType === "mvp";

    // 2) pack criteria ids (robusto)
    const resolved = await resolvePackCriteriaIds(supabase, packCode);
    const criteriaIds = (resolved.criteriaIds || []).filter(Boolean);

    if (criteriaIds.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "PACK_NOT_FOUND",
          pack: packCode,
          hint: "No hay mapping en dts_pack_criteria para este pack.",
          debug: { attempts: resolved.attempts },
        },
        { status: 404 }
      );
    }

    // 3) metas
    const { data: metaRows, error: metaErr } = await supabase
      .from("dts_criteria")
      .select(
        "id, code, effort_base_full, effort_base_pyme, short_label, short_label_es, description, description_es"
      )
      .in("id", criteriaIds);

    if (metaErr) {
      return NextResponse.json({ ok: false, requestId, error: metaErr.message }, { status: 500 });
    }

    const metas = (metaRows || []) as CriteriaMetaRow[];
    const metaByCode = new Map<string, CriteriaMetaRow>();
    for (const m of metas) {
      const code = normalizeCode(m.code);
      if (code) metaByCode.set(code, m);
    }
    const packCodes = Array.from(metaByCode.keys());
    if (packCodes.length === 0) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "PACK_CODES_EMPTY",
          hint: "No se pudieron resolver codes desde dts_criteria para este pack.",
        },
        { status: 500 }
      );
    }

    // 4) responses del assessment (solo pack)
    const { data: respRows, error: respErr } = await supabase
      .from("dts_responses")
      .select("criteria_code, as_is_level, to_be_level, importance")
      .eq("assessment_id", assessmentId)
      .in("criteria_code", packCodes);

    if (respErr) {
      return NextResponse.json({ ok: false, requestId, error: respErr.message }, { status: 500 });
    }

    const responses: ResponseRow[] = (respRows || []).map((r: any) => ({
      criteria_code: r.criteria_code ?? null,
      as_is_level: r.as_is_level ?? null,
      to_be_level: r.to_be_level ?? null,
      importance: r.importance ?? null,
    }));

    // 5) Frenos
    const rankedFrenos = rankByWeightedGap(packCodes, responses);
    const frenosUsingFallback = rankedFrenos.sortedCodes.length === 0;
    const chosenFrenoCodes = (frenosUsingFallback ? packCodes : rankedFrenos.sortedCodes).slice(
      0,
      frenosLimit
    );

    const frenosItems = chosenFrenoCodes.map((criteria_code, idx) => {
      const m = metaByCode.get(criteria_code);

      const effortRaw = isPyme ? m?.effort_base_pyme : m?.effort_base_full;
      const effort_score = clampInt(effortRaw ?? m?.effort_base_full ?? 3, 1, 5);

      const title = (m?.short_label_es || m?.short_label || criteria_code).toString().trim();
      const plain_impact = (m?.description_es || m?.description || "").toString().trim();

      return {
        rank: idx + 1,
        criteria_code,
        title,
        plain_impact,
        symptom: "",
        suggested_action: "",
        impact_score: 3, // compat UI
        effort_score,
      };
    });

    // 6) Priorización
    const rankedPrior = scoreByWeightedGap(packCodes, responses);
    const priorUsingFallback = rankedPrior.sorted.length === 0;

    const chosenPrior = (priorUsingFallback
      ? packCodes.map((code) => ({ code, priority: 0, gap: 0, importance: 0 }))
      : rankedPrior.sorted
    ).slice(0, priorLimit);

    const bands = assignBands(chosenPrior.length);
    const priorItems = chosenPrior.map((x, idx) => {
      const m = metaByCode.get(x.code);
      const title = (m?.short_label_es || m?.short_label || x.code).toString().trim();
      const plain_impact = (m?.description_es || m?.description || "").toString().trim();

      return {
        rank: idx + 1,
        criteria_code: x.code,
        title,
        plain_impact,
        gap_levels: x.gap,
        importance: x.importance,
        priority: x.priority,
        band: bands[idx],
      };
    });

    const res = NextResponse.json(
      {
        ok: true,
        requestId,
        assessment: {
          assessment_id: assessmentId,
          pack: packCode,
          status: assessmentRow.status ?? null,
          current_phase: assessmentRow.current_phase ?? null,
          assessment_type: assessmentType,
        },
        coverage,
        frenos: {
          count: frenosItems.length,
          items: frenosItems,
          disclaimer: frenosUsingFallback
            ? "MVP: no hay datos suficientes para priorizar por tus respuestas (faltan AS-IS/TO-BE/Importancia o gap<=0). Mostramos criterios del pack sin ranking."
            : `MVP: frenos priorizados por tus respuestas (gap × importancia). Esfuerzo = ${
                isPyme ? "effort_base_pyme" : "effort_base_full"
              } desde BD (dts_criteria).`,
        },
        priorizacion: {
          count: priorItems.length,
          items: priorItems,
          disclaimer: priorUsingFallback
            ? "MVP: no hay datos suficientes para priorizar por tus respuestas (faltan AS-IS/TO-BE/Importancia o gap<=0). Mostramos criterios del pack sin ranking."
            : "MVP: priorización basada en tus respuestas (gap × importancia). No son acciones: son áreas donde concentrar la atención.",
        },
        _meta: {
          version: "execsum_v1",
          generated_at: new Date().toISOString(),
          pack_criteria_resolver_attempts: resolved.attempts,
        },
      },
      { status: 200 }
    );

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, requestId: "execsum_unhandled", error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
