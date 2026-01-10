// src/app/api/dts/results/iniciativas/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type ResultsPayload = {
  pack?: string | null;
  assessment_type?: string | null;
};

type InitiativeVM = {
  id: string;
  title: string;
  category: string;
  description: string;
  what_changes: string;
  effort: "Bajo" | "Medio" | "Alto";
  helps: string[];
};

type InitiativesVM = {
  criteria: { code: string; title: string; title_en: string };
  as_is: { level: number; text: string };
  to_be: { level: number; text: string };
  freno: { text: string };
  capabilities: { id: string; title: string; type?: string; description?: string }[];
  initiatives: InitiativeVM[];
  ui: { disclaimer: string };
};

function extractResultsPayload(data: any) {
  if (Array.isArray(data)) {
    const row = data[0] ?? null;
    return row?.dts_results_v1 ?? row?.results_v1 ?? row ?? null;
  }
  return (data as any)?.dts_results_v1 ?? (data as any)?.results_v1 ?? data ?? null;
}

function normalizeCode(code: string) {
  return (code || "").toString().trim();
}

function clampInt(v: any, min: number, max: number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, Math.round(n)));
}

function pickEsFirst(es?: any, en?: any) {
  const a = (es ?? "").toString().trim();
  if (a) return a;
  const b = (en ?? "").toString().trim();
  if (b) return b;
  return "";
}

function effortBand(v: any): "Bajo" | "Medio" | "Alto" {
  const s = (v ?? "").toString().trim().toLowerCase();
  if (s === "bajo") return "Bajo";
  if (s === "medio") return "Medio";
  if (s === "alto") return "Alto";
  return "Medio";
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = (searchParams.get("assessmentId") || "").trim();
    const criteriaCode = normalizeCode(searchParams.get("criteriaCode") || "");

    if (!assessmentId || !isUuid(assessmentId)) {
      return NextResponse.json(
        { error: "Invalid assessmentId (expected UUID)" },
        { status: 400 }
      );
    }
    if (!criteriaCode) {
      return NextResponse.json({ error: "Missing criteriaCode" }, { status: 400 });
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

    // 1) validar assessment + pack + assessment_type (igual que frenos)
    const { data: rpcData, error: rpcErr } = await supabase.rpc("dts_results_v1", {
      p_assessment_id: assessmentId,
    });
    if (rpcErr) return NextResponse.json({ error: rpcErr.message }, { status: 500 });

    const payload = extractResultsPayload(rpcData) as ResultsPayload | null;
    if (!payload) {
      return NextResponse.json({ error: "No data for assessmentId" }, { status: 404 });
    }

    const pack = (payload.pack || "").toString().trim();
    if (!pack) {
      return NextResponse.json(
        { error: "Missing pack in dts_results_v1 payload" },
        { status: 500 }
      );
    }

    // 2) criterios del pack → ids
    const { data: packRows, error: packErr } = await supabase
      .from("dts_pack_criteria")
      .select("criteria_id")
      .eq("pack", pack);

    if (packErr) return NextResponse.json({ error: packErr.message }, { status: 500 });

    const criteriaIds = (packRows || [])
      .map((r: any) => r.criteria_id)
      .filter(Boolean) as string[];

    if (criteriaIds.length === 0) {
      return NextResponse.json(
        { error: "Pack sin criterios (dts_pack_criteria vacío)" },
        { status: 404 }
      );
    }

    // 3) metadata de criterios (para título ES/EN y textos de niveles)
    const { data: metaRows, error: metaErr } = await supabase
      .from("dts_criteria")
      .select(
        [
          "id",
          "code",
          "short_label",
          "short_label_es",
          "level_1_description",
          "level_2_description",
          "level_3_description",
          "level_4_description",
          "level_5_description",
          "level_1_description_es",
          "level_2_description_es",
          "level_3_description_es",
          "level_4_description_es",
          "level_5_description_es",
        ].join(",")
      )
      .in("id", criteriaIds);

    if (metaErr) return NextResponse.json({ error: metaErr.message }, { status: 500 });

    const metaByCode = new Map<string, any>();
    for (const m of metaRows || []) {
      const code = normalizeCode(m.code);
      if (code) metaByCode.set(code, m);
    }

    const meta = metaByCode.get(criteriaCode);
    if (!meta) {
      return NextResponse.json(
        { error: "criteriaCode no pertenece al pack del assessment (o no existe)" },
        { status: 404 }
      );
    }

    const criteriaId = meta.id as string;

    const criteriaTitleEs = (meta.short_label_es || "").toString().trim();
    const criteriaTitleEn = (meta.short_label || "").toString().trim();
    const criteriaTitle = criteriaTitleEs || criteriaTitleEn || criteriaCode;

    // 4) respuesta del criterio (as-is/to-be)
    const { data: respRow, error: respErr } = await supabase
      .from("dts_responses")
      .select("as_is_level, to_be_level")
      .eq("assessment_id", assessmentId)
      .eq("criteria_code", criteriaCode)
      .limit(1)
      .maybeSingle();

    if (respErr) return NextResponse.json({ error: respErr.message }, { status: 500 });

    const asIsLevel = clampInt(respRow?.as_is_level ?? 0, 0, 5);
    const toBeLevel = clampInt(respRow?.to_be_level ?? 0, 0, 5);

    function levelText(level: number) {
      if (!level || level < 1 || level > 5) return "—";
      const es = pickEsFirst(meta[`level_${level}_description_es`], "");
      const en = pickEsFirst(meta[`level_${level}_description`], "");
      return es || en || "—";
    }

    // ✅ 5) CAPABILITIES desde tabla REAL
    const { data: capRows, error: capErr } = await supabase
      .from("dts_capability_catalog")
      .select("id, title, description, capability_type, is_active")
      .eq("criteria_id", criteriaId)
      .eq("is_active", true);

    if (capErr) return NextResponse.json({ error: capErr.message }, { status: 500 });

    const capabilities = (capRows || []).map((c: any) => ({
      id: (c.id ?? "").toString(),
      title: (c.title ?? "").toString(),
      type: (c.capability_type ?? "").toString(),
      description: c.description ? c.description.toString() : "",
    }));

    // ✅ 6) INITIATIVES desde tabla REAL
    const { data: initRows, error: initErr } = await supabase
      .from("dts_initiative_catalog")
      .select(
        [
          "id",
          "criteria_id",
          "category",
          "effort_band",
          "title",
          "description",
          "what_changes",
          "title_es",
          "title_en",
          "description_es",
          "description_en",
          "what_changes_es",
          "what_changes_en",
          "is_active",
        ].join(",")
      )
      .eq("criteria_id", criteriaId);

    if (initErr) return NextResponse.json({ error: initErr.message }, { status: 500 });

    const activeInits = (initRows || []).filter(
      (r: any) => r.is_active === null || r.is_active === true
    );

    const initIds = activeInits.map((r: any) => r.id).filter(Boolean) as string[];

    // ✅ 7) LINKS initiative -> capability (FK real)
    let linkRows: { initiative_catalog_id: string; capability_id: string }[] = [];
    if (initIds.length > 0) {
      const { data: links, error: linkErr } = await supabase
        .from("dts_initiative_capabilities")
        .select("initiative_catalog_id, capability_id")
        .in("initiative_catalog_id", initIds);

      if (linkErr) return NextResponse.json({ error: linkErr.message }, { status: 500 });
      linkRows = (links || []) as any[];
    }

    const capTitleById = new Map<string, string>();
    for (const c of capabilities) capTitleById.set(c.id, c.title);

    const helpsByInit = new Map<string, string[]>();
    for (const l of linkRows) {
      const capTitle = capTitleById.get(l.capability_id);
      if (!capTitle) continue;
      const arr = helpsByInit.get(l.initiative_catalog_id) || [];
      arr.push(capTitle);
      helpsByInit.set(l.initiative_catalog_id, arr);
    }

    // ES primero, fallback a EN, fallback a legacy
    function pickInitText(r: any) {
      const title = pickEsFirst(r.title_es, r.title_en) || (r.title || "").toString();
      const description =
        pickEsFirst(r.description_es, r.description_en) ||
        (r.description || "").toString();
      const what_changes =
        pickEsFirst(r.what_changes_es, r.what_changes_en) ||
        (r.what_changes || "").toString();

      return {
        title: title.trim(),
        description: description.trim(),
        what_changes: what_changes.trim(),
      };
    }

    const initiatives: InitiativeVM[] = activeInits.map((r: any) => {
      const t = pickInitText(r);
      const helps = helpsByInit.get(r.id) || [];
      const uniqHelps = Array.from(new Set(helps)).sort((a, b) => a.localeCompare(b));

      return {
        id: r.id,
        title: t.title,
        category: (r.category || "—").toString(),
        description: t.description,
        what_changes: t.what_changes,
        effort: effortBand(r.effort_band),
        helps: uniqHelps,
      };
    });

    const result: InitiativesVM = {
      criteria: {
        code: criteriaCode,
        title: criteriaTitle, // ES primero
        title_en: criteriaTitleEn || criteriaTitle,
      },
      as_is: { level: asIsLevel, text: levelText(asIsLevel) },
      to_be: { level: toBeLevel, text: levelText(toBeLevel) },
      freno: { text: "" }, // no inventamos freno aquí
      capabilities,
      initiatives,
      ui: {
        disclaimer: "No hay una opción “correcta”. Aquí solo ves opciones comparables.",
      },
    };

    const res = NextResponse.json(result, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
