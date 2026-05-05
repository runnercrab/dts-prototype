// src/app/api/dts/results/frenos/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveFrozenInputs } from "@/lib/dts/snapshotResolver";

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
  code: string; // TMF criteria_code (ej "1.1.1")
  effort_base_full: number | null;
  effort_base_pyme: number | null;
  short_label?: string | null;
  short_label_es?: string | null;
  description?: string | null;
  description_es?: string | null;
};

type FrenoItem = {
  rank: number;
  criteria_code: string; // TMF real
  title: string;
  plain_impact: string;
  symptom: string;
  suggested_action: string;
  impact_score: number; // informativo (no TMF); mantenido por compatibilidad UI
  effort_score: number; // 1..5 desde BD
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

    // 1) Validar assessment + leer pack + assessment_type directo (R-PR2-3)
    //    Eliminada llamada redundante a dts_results_v1 (solo necesitábamos
    //    pack y assessment_type, ambos en dts_assessments).
    const { data: assessmentRow, error: aErr } = await supabase
      .from("dts_assessments")
      .select("pack, assessment_type")
      .eq("id", assessmentId)
      .maybeSingle();

    if (aErr) {
      return NextResponse.json({ error: aErr.message }, { status: 500 });
    }
    if (!assessmentRow) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }
    const pack = (assessmentRow.pack || "").toString().trim();
    if (!pack) {
      return NextResponse.json(
        { error: "Missing pack on assessment" },
        { status: 500 }
      );
    }
    const assessmentType = (assessmentRow.assessment_type || "full")
      .toString()
      .toLowerCase()
      .trim();

    const isPyme = assessmentType === "sme" || assessmentType === "pyme";

    // 2) criterios del pack
    const { data: packRows, error: packErr } = await supabase
      .from("dts_pack_criteria")
      .select("criteria_id")
      .eq("pack", pack);

    if (packErr) return NextResponse.json({ error: packErr.message }, { status: 500 });

    const criteriaIds = (packRows || [])
      .map((r: any) => r.criteria_id)
      .filter(Boolean) as string[];

    if (criteriaIds.length === 0) {
      const res = NextResponse.json(
        {
          assessment_id: assessmentId,
          pack,
          assessment_type: assessmentType,
          count: 0,
          items: [],
          disclaimer:
            "Pack sin criterios en dts_pack_criteria. Revisa dts_packs/dts_pack_criteria.",
        },
        { status: 200 }
      );
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    // 3) metadata de criterios (incluye esfuerzo desde BD)
    const { data: metaRows, error: metaErr } = await supabase
      .from("dts_criteria")
      .select(
        "id, code, effort_base_full, effort_base_pyme, short_label, short_label_es, description, description_es"
      )
      .in("id", criteriaIds);

    if (metaErr) return NextResponse.json({ error: metaErr.message }, { status: 500 });

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
          count: 0,
          items: [],
          disclaimer:
            "No se pudieron resolver criteria_code desde dts_criteria para este pack.",
        },
        { status: 200 }
      );
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    // 4) Inputs algorítmicos via resolveFrozenInputs (R-PR2-6)
    //    A_guarded/D_guarded → responses_payload del snapshot (filtrado por packCodes)
    //    Otros estados (A_drift/B/C/D_drift/unexpected_fallback) → live dts_responses
    let resolvedInputs;
    try {
      resolvedInputs = await resolveFrozenInputs(supabase, assessmentId);
    } catch (err: any) {
      console.error("[api frenos] resolver error:", err);
      return NextResponse.json(
        { error: "Resolver error", details: err?.message ?? null },
        { status: 500 }
      );
    }

    let responses: ResponseRow[];
    if (
      resolvedInputs.state === "A_guarded" ||
      resolvedInputs.state === "D_guarded"
    ) {
      // Snapshot inputs: filtrar por packCodes live (cubierto por model_fingerprint canario)
      const packCodesSet = new Set(packCodes.map(normalizeCode));
      responses = resolvedInputs.inputs
        .filter((r: any) => {
          const code = r?.criteria_code
            ? normalizeCode(String(r.criteria_code))
            : "";
          return code && packCodesSet.has(code);
        })
        .map((r: any) => ({
          criteria_code: r.criteria_code ?? null,
          as_is_level: r.as_is_level ?? null,
          to_be_level: r.to_be_level ?? null,
          importance: r.importance ?? null,
        }));
    } else {
      // Live: A_drift, B, C, D_drift, unexpected_fallback
      const { data: respRows, error: respErr } = await supabase
        .from("dts_responses")
        .select("criteria_code, as_is_level, to_be_level, importance")
        .eq("assessment_id", assessmentId)
        .in("criteria_code", packCodes);

      if (respErr)
        return NextResponse.json({ error: respErr.message }, { status: 500 });

      responses = (respRows || []).map((r: any) => ({
        criteria_code: r.criteria_code ?? null,
        as_is_level: r.as_is_level ?? null,
        to_be_level: r.to_be_level ?? null,
        importance: r.importance ?? null,
      }));
    }

    // 5) ranking por weighted_gap desc (solo gap>0)
    const ranked = rankByWeightedGap(packCodes, responses);

    const usingFallback = ranked.sortedCodes.length === 0;
    const chosenCodes = (usingFallback ? packCodes : ranked.sortedCodes).slice(0, limit);

    const items: FrenoItem[] = chosenCodes.map((criteria_code, idx) => {
      const m = metaByCode.get(criteria_code);

      const effortRaw = isPyme ? m?.effort_base_pyme : m?.effort_base_full;
      const effort_score = clampInt(effortRaw ?? m?.effort_base_full ?? 3, 1, 5);

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
        impact_score: 3, // compat UI; no es TMF
        effort_score,
      };
    });

    const res = NextResponse.json(
      {
        assessment_id: assessmentId,
        pack,
        assessment_type: assessmentType,
        count: items.length,
        items,
        disclaimer: usingFallback
          ? "MVP: no hay datos suficientes para priorizar por tus respuestas (faltan AS-IS/TO-BE/Importancia o gap<=0). Mostramos criterios del pack sin ranking por impacto."
          : `MVP: frenos priorizados por tus respuestas (gap × importancia). Esfuerzo = ${
              isPyme ? "effort_base_pyme" : "effort_base_full"
            } desde BD (dts_criteria).`,
        // Flags PR-2 (snapshotResolver)
        fromSnapshot: resolvedInputs.fromSnapshot,
        snapshotId:
          "snapshotId" in resolvedInputs ? resolvedInputs.snapshotId : null,
        snapshotState: resolvedInputs.state,
        snapshotInputs: resolvedInputs.snapshotInputs,
        modelFingerprintMatch: resolvedInputs.modelFingerprintMatch,
        metadataLive: resolvedInputs.metadataLive,
      },
      { status: 200 }
    );

    res.headers.set("X-From-Snapshot", String(resolvedInputs.fromSnapshot));
    res.headers.set("X-Snapshot-State", resolvedInputs.state);
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
  if (Array.isArray(data)) {
    const row = data[0] ?? null;
    return row?.dts_results_v1 ?? row?.results_v1 ?? row ?? null;
  }
  return (data as any)?.dts_results_v1 ?? (data as any)?.results_v1 ?? data ?? null;
}

function normalizeCode(code: string) {
  return code.trim();
}

function clampInt(v: number, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

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
