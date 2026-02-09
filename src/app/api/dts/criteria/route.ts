// ============================================================================
// FILE: src/app/api/dts/criteria/route.ts
// PURPOSE: Entregar criterios UI-ready en español.
//          ✅ Cambio: usar explain_json.es.pregunta_clave y explain_json.es.niveles[N].descripcion
//          para pregunta + niveles (nivel_1..nivel_5).
//          Frontend SOLO pinta estos campos.
// ============================================================================

import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DIMENSION_NAME_MAP: Record<string, string> = {
  Customer: "Cliente",
  Strategy: "Estrategia",
  Technology: "Tecnología",
  Operations: "Operaciones",
  Culture: "Cultura",
  Data: "Datos",
};

function jsonError(status: number, payload: any) {
  return NextResponse.json({ ok: false, ...payload }, { status });
}

/**
 * Ordena rows por el primer campo existente en priorityKeys.
 * Si no existe ninguno, conserva el orden original y como desempate usa code.
 */
function sortByBestEffort(rows: any[], priorityKeys: string[]) {
  const key = priorityKeys.find((k) => rows.length > 0 && k in rows[0]);
  if (!key) {
    return [...rows].sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));
  }
  return [...rows].sort((a, b) => {
    const av = Number((a as any)[key] ?? 0);
    const bv = Number((b as any)[key] ?? 0);
    if (av !== bv) return av - bv;
    return String(a.code || "").localeCompare(String(b.code || ""));
  });
}

/**
 * Intenta resolver criteria_ids para un pack usando:
 * 1) dts_pack_criteria (source-of-truth actual)
 * 2) fallback: dts_pack_criteria_map (legacy)
 */
async function resolvePackCriteriaIds(supabase: any, pack: string) {
  const { data: pcRows, error: pcErr } = await supabase
    .from("dts_pack_criteria")
    .select("*")
    .eq("pack", pack);

  if (pcErr) {
    return { ids: [] as string[], meta: { used: "dts_pack_criteria", error: pcErr.message } };
  }

  if (pcRows && pcRows.length > 0) {
    const ordered = sortByBestEffort(pcRows, [
      "display_order",
      "sort_order",
      "position",
      "weight",
      "order",
      "idx",
    ]);

    const ids = ordered
      .map((r: any) => r.criteria_id ?? r.criterion_id ?? r.criteriaId)
      .filter(Boolean)
      .map(String);

    return { ids, meta: { used: "dts_pack_criteria", rows: pcRows.length } };
  }

  const { data: packRow } = await supabase
    .from("dts_packs")
    .select("id, pack_uuid")
    .eq("id", pack)
    .single();

  const packUuid = packRow?.pack_uuid ? String(packRow.pack_uuid) : null;
  if (!packUuid) return { ids: [], meta: { used: "fallback_none", hint: "no pack_uuid" } };

  const { data: mapRows, error: mErr } = await supabase
    .from("dts_pack_criteria_map")
    .select("*")
    .eq("pack_id", packUuid);

  if (mErr) {
    return { ids: [], meta: { used: "dts_pack_criteria_map", error: mErr.message } };
  }

  if (!mapRows || mapRows.length === 0) {
    return { ids: [], meta: { used: "dts_pack_criteria_map", rows: 0 } };
  }

  const ordered = sortByBestEffort(mapRows, [
    "weight",
    "display_order",
    "sort_order",
    "position",
    "order",
    "idx",
  ]);

  const ids = ordered
    .map((r: any) => r.criteria_id ?? r.criterion_id ?? r.criteriaId)
    .filter(Boolean)
    .map(String);

  return { ids, meta: { used: "dts_pack_criteria_map", rows: mapRows.length } };
}

/**
 * Carga respuestas del assessment (best-effort).
 */
async function loadResponsesBestEffort(supabase: any, assessmentId: string) {
  const { data, error } = await supabase.from("dts_responses").select("*").eq("assessment_id", assessmentId);
  if (error || !Array.isArray(data)) return { list: [] as any[], map: {} as Record<string, any> };

  const normalized = data.map((r: any) => {
    const criteriaId = String(r.criteria_id ?? r.criterion_id ?? r.criteriaId ?? "");
    const asIs =
      r.as_is ??
      r.asis ??
      r.as_is_level ??
      r.as_is_score ??
      r.as_is_value ??
      r.value_as_is ??
      null;
    const toBe =
      r.to_be ??
      r.tobe ??
      r.to_be_level ??
      r.to_be_score ??
      r.to_be_value ??
      r.value_to_be ??
      null;
    const importance =
      r.importance ??
      r.importancia ??
      r.importance_level ??
      r.importance_score ??
      r.value_importance ??
      null;

    return {
      ...r,
      criteria_id: criteriaId || r.criteria_id,
      as_is: asIs,
      to_be: toBe,
      importance,
    };
  });

  const map: Record<string, any> = {};
  for (const r of normalized) {
    const k = String(r.criteria_id ?? "");
    if (k) map[k] = r;
  }
  return { list: normalized, map };
}

function pickExplainEs(explain_json: any) {
  const es = explain_json?.es;
  if (!es || typeof es !== "object") {
    return {
      pregunta: null as string | null,
      nivel_1: null as string | null,
      nivel_2: null as string | null,
      nivel_3: null as string | null,
      nivel_4: null as string | null,
      nivel_5: null as string | null,
    };
  }

  const pregunta = typeof es?.pregunta_clave === "string" ? es.pregunta_clave : null;

  const niveles = es?.niveles;
  const getNivel = (n: "1" | "2" | "3" | "4" | "5") => {
    const d = niveles?.[n]?.descripcion;
    return typeof d === "string" ? d : null;
  };

  return {
    pregunta,
    nivel_1: getNivel("1"),
    nivel_2: getNivel("2"),
    nivel_3: getNivel("3"),
    nivel_4: getNivel("4"),
    nivel_5: getNivel("5"),
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get("assessmentId");

    if (!assessmentId) return jsonError(400, { error: "assessmentId is required" });

    const supabase = supabaseService();

    // 1) Leer assessment + pack
    const { data: assessment, error: aErr } = await supabase
      .from("dts_assessments")
      .select("id, pack")
      .eq("id", assessmentId)
      .single();

    if (aErr || !assessment) {
      return jsonError(404, { error: "assessment not found", details: aErr?.message });
    }

    const pack = String(assessment.pack || "").trim();
    if (!pack) return jsonError(409, { error: "assessment has empty pack", assessmentId });

    // 2) Resolver criteria_ids del pack
    const { ids: orderedCriteriaIds, meta } = await resolvePackCriteriaIds(supabase, pack);

    if (!orderedCriteriaIds || orderedCriteriaIds.length === 0) {
      return jsonError(409, {
        error: "pack has no criteria mapping",
        pack,
        meta,
        hint:
          "Source-of-truth: dts_pack_criteria. Debe haber filas con pack + criteria_id.",
      });
    }

    // 3) Cargar criterios + dimensión/subdimensión
    const { data: criteriaRows, error: cErr } = await supabase
      .from("dts_criteria")
      .select(
        `
        id, code, description, description_es, short_label, short_label_es,
        context, context_es, focus_area, tier, subdimension_id, display_order,
        level_1_description_es, level_2_description_es, level_3_description_es,
        level_4_description_es, level_5_description_es,
        explain_json,
        dts_subdimensions!inner (
          id, code, name, name_es, display_order,
          dts_dimensions!inner (id, code, name, name_es, display_order)
        )
      `
      )
      .in("id", orderedCriteriaIds);

    if (cErr) {
      return jsonError(500, { error: "criteria query failed", pack, details: cErr.message });
    }
    if (!criteriaRows || criteriaRows.length === 0) {
      return jsonError(404, {
        error: "No criteria returned for mapped ids",
        pack,
        hint: "Revisa que criteria_id del mapping existan en dts_criteria.",
      });
    }

    // 4) Re-ordenar según mapping
    const rank = new Map<string, number>();
    orderedCriteriaIds.forEach((id, idx) => rank.set(id, idx));
    const rows = [...criteriaRows].sort((a: any, b: any) => {
      return (rank.get(String(a.id)) ?? 999999) - (rank.get(String(b.id)) ?? 999999);
    });

    // 5) Transformación UI-ready (✅ pregunta/niveles desde explain_json)
    const transformed = rows.map((c: any) => {
      const subdimension = Array.isArray(c.dts_subdimensions) ? c.dts_subdimensions[0] : c.dts_subdimensions;
      const dimension = subdimension?.dts_dimensions;
      const dimensionRow = Array.isArray(dimension) ? dimension[0] : dimension;

      const dimensionName = dimensionRow?.name || "";
      const dimensionNameEs = DIMENSION_NAME_MAP[dimensionName] || dimensionName;

      const ex = pickExplainEs(c.explain_json);

      return {
        id: c.id,
        code: c.code,

        // legacy (mantengo)
        description: c.description_es || c.description || "",
        short_label: c.short_label_es || c.short_label || "",
        context: c.context_es || c.context || null,

        focus_area: c.focus_area || "",
        subdimension_id: c.subdimension_id,

        subdimension: subdimension
          ? {
              name: subdimension.name_es || subdimension.name || "",
              code: subdimension.code || "",
              dimension_name: dimensionNameEs,
              dimension_display_order: dimensionRow?.display_order || 0,
              subdimension_display_order: subdimension.display_order || 0,
            }
          : undefined,

        dimension: dimensionRow
          ? {
              name: dimensionNameEs,
              code: dimensionRow.code || "",
              display_order: dimensionRow.display_order || 0,
            }
          : undefined,

        // ✅ CANÓNICO (UI debe usar esto)
        pregunta: ex.pregunta,
        nivel_1: ex.nivel_1,
        nivel_2: ex.nivel_2,
        nivel_3: ex.nivel_3,
        nivel_4: ex.nivel_4,
        nivel_5: ex.nivel_5,

        // fallback legacy (por si explain_json viene incompleto)
        level_1_description_es: ex.nivel_1 ?? c.level_1_description_es,
        level_2_description_es: ex.nivel_2 ?? c.level_2_description_es,
        level_3_description_es: ex.nivel_3 ?? c.level_3_description_es,
        level_4_description_es: ex.nivel_4 ?? c.level_4_description_es,
        level_5_description_es: ex.nivel_5 ?? c.level_5_description_es,

        explain_json: c.explain_json ?? null,
      };
    });

    // 6) Respuestas
    const { list: responses } = await loadResponsesBestEffort(supabase, assessmentId);

    return NextResponse.json({
      ok: true,
      assessmentId,
      pack,
      n: transformed.length,
      criteria: transformed,
      responses,
      meta,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
