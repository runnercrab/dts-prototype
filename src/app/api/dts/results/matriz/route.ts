// src/app/api/dts/results/matriz/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type ResponseRow = {
  criteria_code: string | null;
  as_is_level: number | null;
  to_be_level: number | null;
  importance: number | null;
};

type CriteriaMetaRow = {
  id: string;
  code: string; // TMF criteria_code: "1.1.1"
  effort_base_full: number | null;
  effort_base_pyme: number | null;

  // textos opcionales
  short_label?: string | null;
  short_label_es?: string | null;
  description?: string | null;
  description_es?: string | null;
};

type MatrizItem = {
  rank: number;
  criteria_code: string;

  title: string;
  plain_impact: string;
  symptom: string;
  suggested_action: string;

  impact_score: number; // 1..5 (solo para fallback visual si no hay respuestas)
  effort_score: number; // 1..5 (desde BD)

  x_effort: number; // 0..1
  y_impact: number; // 0..1
  quadrant: "quick_wins" | "big_bets" | "foundations" | "fill_ins";
  quadrant_label_es: string;
};

type ResultsPayload = {
  pack?: string | null;
  assessment_type?: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = (searchParams.get("assessmentId") || "").trim();

    const limitRaw = (searchParams.get("limit") || "8").trim();
    const limit = Math.max(1, Math.min(12, Number(limitRaw) || 8));

    if (!assessmentId || !isUuid(assessmentId)) {
      return NextResponse.json(
        { error: "Invalid assessmentId (expected UUID)" },
        { status: 400 }
      );
    }

    const url =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!url || !serviceKey) {
      return NextResponse.json(
        {
          error:
            "Missing env vars: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and/or SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // 1) obtener pack + assessment_type desde RPC
    const { data, error } = await supabase.rpc("dts_results_v1", {
      p_assessment_id: assessmentId,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const payload = extractResultsPayload(data) as ResultsPayload | null;

    if (!payload) {
      return NextResponse.json(
        { error: "No data for assessmentId" },
        { status: 404 }
      );
    }

    const pack = (payload.pack || "").toString().trim();
    if (!pack) {
      return NextResponse.json(
        { error: "Missing pack in dts_results_v1 payload" },
        { status: 500 }
      );
    }

    const assessmentType = (payload.assessment_type || "full")
      .toString()
      .toLowerCase()
      .trim();

    const isPyme = assessmentType === "sme" || assessmentType === "pyme";

    // 2) resolver el set de criterios del pack (criteria_id)
    const { data: packRows, error: packErr } = await supabase
      .from("dts_pack_criteria")
      .select("criteria_id")
      .eq("pack", pack);

    if (packErr)
      return NextResponse.json({ error: packErr.message }, { status: 500 });

    const criteriaIds = (packRows || [])
      .map((r: any) => r.criteria_id)
      .filter(Boolean) as string[];

    if (criteriaIds.length === 0) {
      const res = NextResponse.json(
        {
          assessment_id: assessmentId,
          pack,
          assessment_type: assessmentType,
          limit,
          thresholds: null,
          items: [],
          disclaimer:
            "Pack sin criterios en dts_pack_criteria. Revisa dts_packs/dts_pack_criteria.",
        },
        { status: 200 }
      );
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    // 3) cargar metadata de criterios (incluye esfuerzo desde BD)
    const { data: metaRows, error: metaErr } = await supabase
      .from("dts_criteria")
      .select(
        "id, code, effort_base_full, effort_base_pyme, short_label, short_label_es, description, description_es"
      )
      .in("id", criteriaIds);

    if (metaErr)
      return NextResponse.json({ error: metaErr.message }, { status: 500 });

    const metas = (metaRows || []) as CriteriaMetaRow[];
    const metaByCode = new Map<string, CriteriaMetaRow>();

    for (const m of metas) {
      const code = normalizeCode(m.code);
      if (code) metaByCode.set(code, m);
    }

    const packCodes = Array.from(metaByCode.keys());
    if (packCodes.length === 0) {
      const res = NextResponse.json(
        {
          assessment_id: assessmentId,
          pack,
          assessment_type: assessmentType,
          limit,
          thresholds: null,
          items: [],
          disclaimer:
            "No se pudieron resolver criteria_code desde dts_criteria para este pack.",
        },
        { status: 200 }
      );
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    // 4) cargar respuestas SOLO para criterios del pack
    const { data: respRows, error: respErr } = await supabase
      .from("dts_responses")
      .select("criteria_code, as_is_level, to_be_level, importance")
      .eq("assessment_id", assessmentId)
      .in("criteria_code", packCodes);

    if (respErr)
      return NextResponse.json({ error: respErr.message }, { status: 500 });

    const responses = (respRows || []).map((r: any) => ({
      criteria_code: r.criteria_code ?? null,
      as_is_level: r.as_is_level ?? null,
      to_be_level: r.to_be_level ?? null,
      importance: r.importance ?? null,
    })) as ResponseRow[];

    // 5) calcular prioridades por criterio (gap × importance)
    const ranked = rankByResponses(packCodes, responses);

    const usingFallback = ranked.sortedCodes.length === 0;
    const chosenCodes = (usingFallback ? packCodes : ranked.sortedCodes).slice(
      0,
      limit
    );

    // 6) thresholds y normalización
    const maxPriority = ranked.maxPriority || 1;

    const impactHigh = 0.7; // 0..1
    const effortHigh = (4 - 1) / 4; // esfuerzo >=4 en 0..1

    // 7) construir items
    const items: MatrizItem[] = chosenCodes.map((criteria_code, idx) => {
      const m = metaByCode.get(criteria_code);

      // esfuerzo desde BD según assessment_type (sin heurísticas por pack)
      const effortRaw = isPyme ? m?.effort_base_pyme : m?.effort_base_full;
      const effort_score = clampInt(effortRaw ?? m?.effort_base_full ?? 3, 1, 5);

      const x_effort = (effort_score - 1) / 4;

      const priority = ranked.priorityByCode.get(criteria_code) || 0;
      const y_impact = usingFallback ? 0 : clamp01(priority / maxPriority);

      const quadrant = classifyQuadrant01(
        y_impact,
        x_effort,
        impactHigh,
        effortHigh
      );

      const quadrant_label_es =
        quadrant === "quick_wins"
          ? "Quick Wins (alto impacto, bajo esfuerzo)"
          : quadrant === "big_bets"
          ? "Big Bets (alto impacto, alto esfuerzo)"
          : quadrant === "foundations"
          ? "Foundations (bajo impacto, alto esfuerzo)"
          : "Fill-ins (bajo impacto, bajo esfuerzo)";

      // copy mínimo desde BD (si falta, no invento)
      const title = (m?.short_label_es || m?.short_label || criteria_code)
        .toString()
        .trim();

      const plain_impact = (m?.description_es || m?.description || "")
        .toString()
        .trim();

      return {
        rank: idx + 1,
        criteria_code,
        title,
        plain_impact,
        symptom: "",
        suggested_action: "",
        impact_score: 3, // informativo; impacto real es y_impact
        effort_score,
        x_effort,
        y_impact,
        quadrant,
        quadrant_label_es,
      };
    });

    const res = NextResponse.json(
      {
        assessment_id: assessmentId,
        pack,
        assessment_type: assessmentType,
        limit,
        thresholds: { impact_high: impactHigh, effort_high: effortHigh },
        items,
        disclaimer: usingFallback
          ? "MVP: no hay datos suficientes (gap×importancia) para priorizar; se devuelve el set del pack sin impacto calculado."
          : `MVP: impacto = prioridad por tus respuestas (gap × importancia). Esfuerzo = ${
              isPyme ? "effort_base_pyme" : "effort_base_full"
            } desde BD (dts_criteria).`,
      },
      { status: 200 }
    );

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}

function extractResultsPayload(data: any) {
  // RPC devuelve jsonb (a veces envuelto según cliente)
  if (Array.isArray(data)) {
    const row = data[0] ?? null;
    return row?.dts_results_v1 ?? row?.results_v1 ?? row ?? null;
  }
  return (data as any)?.dts_results_v1 ?? (data as any)?.results_v1 ?? data ?? null;
}

function normalizeCode(code: string) {
  return code.trim();
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function clampInt(v: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function classifyQuadrant01(
  impact01: number,
  effort01: number,
  impactHigh: number,
  effortHigh: number
): "quick_wins" | "big_bets" | "foundations" | "fill_ins" {
  const hiImpact = impact01 >= impactHigh;
  const hiEffort = effort01 >= effortHigh;

  if (hiImpact && !hiEffort) return "quick_wins";
  if (hiImpact && hiEffort) return "big_bets";
  if (!hiImpact && hiEffort) return "foundations";
  return "fill_ins";
}

function rankByResponses(packCodes: string[], responses: ResponseRow[]) {
  const packSet = new Set(packCodes.map(normalizeCode));

  // best weighted_gap por criteria_code
  const bestByCode = new Map<string, number>();

  for (const r of responses) {
    const code = r.criteria_code ? normalizeCode(r.criteria_code) : "";
    if (!code || !packSet.has(code)) continue;

    if (r.as_is_level == null || r.to_be_level == null || r.importance == null)
      continue;

    const gap = (r.to_be_level as number) - (r.as_is_level as number);
    if (gap <= 0) continue;

    const priority = gap * (r.importance as number);

    const prev = bestByCode.get(code);
    if (prev == null || priority > prev) bestByCode.set(code, priority);
  }

  const scored = Array.from(bestByCode.entries())
    .map(([code, priority]) => ({ code, priority }))
    .sort((a, b) => b.priority - a.priority);

  const sortedCodes = scored.map((x) => x.code);
  const maxPriority = scored.length ? scored[0].priority : 0;

  const priorityByCode = new Map<string, number>();
  for (const c of packCodes) {
    const key = normalizeCode(c);
    priorityByCode.set(key, bestByCode.get(key) || 0);
  }

  return { sortedCodes, maxPriority, priorityByCode };
}
