// src/app/api/dts/results/priorizacion/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function sanitizeAssessmentId(raw: string) {
  // 1) decode por si viene URL-encoded raro
  let v = raw;
  try {
    v = decodeURIComponent(v);
  } catch {
    // si falla, seguimos con el raw
  }

  // 2) trim whitespace
  v = (v || "").trim();

  // 3) quitar wrappers típicos de copy/paste: "", '', {}, []
  //    (solo si envuelven toda la cadena)
  v = v.replace(/^["'{}\[\]\(\)\s]+/, "").replace(/["'{}\[\]\(\)\s]+$/, "");

  // 4) si por error meten "assessmentId=xxx" dentro del propio valor, corta
  //    o si meten algo con espacios, corta al primer espacio
  v = v.split(/\s|&/)[0] || "";

  return v;
}

type ResponseRow = {
  criteria_code: string | null;
  as_is_level: number | null;
  to_be_level: number | null;
  importance: number | null;
};

type CriteriaMetaRow = {
  id: string;
  code: string; // TMF code: "1.1.1"
  short_label?: string | null;
  short_label_es?: string | null;
  description?: string | null;
  description_es?: string | null;
};

type PriorityItem = {
  rank: number;
  criteria_code: string;
  title: string;
  plain_impact: string;
  gap_levels: number; // to_be - as_is (si > 0)
  importance: number; // 1..5
  priority: number; // gap * importance (informativo)
  band: "high" | "medium" | "low"; // solo UI
};

type ResultsPayload = {
  pack?: string | null;
  assessment_type?: string | null;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    // ✅ acepta assessmentId o assessment_id
    const rawId =
      (searchParams.get("assessmentId") ??
        searchParams.get("assessment_id") ??
        "") + "";

    const assessmentId = sanitizeAssessmentId(rawId);

    const limitRaw = (searchParams.get("limit") || "12").trim();
    const limit = Math.max(1, Math.min(12, Number(limitRaw) || 12));

    if (!assessmentId || !isUuid(assessmentId)) {
      return NextResponse.json(
        {
          error: "Invalid assessmentId (expected UUID)",
          received: rawId, // 👈 clave para ver qué narices llegó
          sanitized: assessmentId,
        },
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

    // 1) validar assessment + pack (RPC estable)
    const { data, error } = await supabase.rpc("dts_results_v1", {
      p_assessment_id: assessmentId,
    });
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });

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

    // 2) criterios del pack
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

    // 3) metadata criterios
    const { data: metaRows, error: metaErr } = await supabase
      .from("dts_criteria")
      .select("id, code, short_label, short_label_es, description, description_es")
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

    // 4) respuestas del assessment (del pack)
    const { data: respRows, error: respErr } = await supabase
      .from("dts_responses")
      .select("criteria_code, as_is_level, to_be_level, importance")
      .eq("assessment_id", assessmentId)
      .in("criteria_code", packCodes);

    if (respErr)
      return NextResponse.json({ error: respErr.message }, { status: 500 });

    const responses: ResponseRow[] = (respRows || []).map((r: any) => ({
      criteria_code: r.criteria_code ?? null,
      as_is_level: r.as_is_level ?? null,
      to_be_level: r.to_be_level ?? null,
      importance: r.importance ?? null,
    }));

    // 5) ranking por gap*importance (solo gap>0)
    const ranked = scoreByWeightedGap(packCodes, responses);
    const usingFallback = ranked.sorted.length === 0;

    const chosen = (usingFallback
      ? packCodes.map((code) => ({ code, priority: 0, gap: 0, importance: 0 }))
      : ranked.sorted
    ).slice(0, limit);

    // 6) bands
    const bands = assignBands(chosen.length);

    const items: PriorityItem[] = chosen.map((x, idx) => {
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
        assessment_id: assessmentId,
        pack,
        count: items.length,
        items,
        disclaimer: usingFallback
          ? "MVP: no hay datos suficientes para priorizar por tus respuestas (faltan AS-IS/TO-BE/Importancia o gap<=0). Mostramos criterios del pack sin ranking por criticidad."
          : "MVP: priorización basada en tus respuestas (gap × importancia). No son acciones: son áreas donde concentrar la atención.",
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
  if (Array.isArray(data)) {
    const row = data[0] ?? null;
    return row?.dts_results_v1 ?? row?.results_v1 ?? row ?? null;
  }
  return (data as any)?.dts_results_v1 ?? (data as any)?.results_v1 ?? data ?? null;
}

function normalizeCode(code: string) {
  return code.trim();
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
