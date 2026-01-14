// src/app/api/dts/criteria/route.ts
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

function sortByRank<T extends { id: string }>(rows: T[], orderedIds: string[]) {
  const rank = new Map<string, number>();
  orderedIds.forEach((id, idx) => rank.set(id, idx));
  return rows.sort((a, b) => (rank.get(a.id) ?? 999999) - (rank.get(b.id) ?? 999999));
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get("assessmentId");

    if (!assessmentId) {
      return jsonError(400, { error: "assessmentId is required" });
    }

    const supabase = supabaseService();

    // 1) Leer assessment + pack (código canónico)
    const { data: assessment, error: aErr } = await supabase
      .from("dts_assessments")
      .select("id, pack")
      .eq("id", assessmentId)
      .single();

    if (aErr || !assessment) {
      return jsonError(404, { error: "assessment not found", details: aErr?.message });
    }

    const pack = String(assessment.pack || "");

    // 2) Resolver pack_uuid en BD (fuente de verdad)
    const { data: packRow, error: pErr } = await supabase
      .from("dts_packs")
      .select("id, pack_uuid")
      .eq("id", pack)
      .single();

    if (pErr || !packRow?.pack_uuid) {
      return jsonError(400, {
        error: "pack not found in dts_packs",
        pack,
        hint: "Inserta este pack en dts_packs (id + pack_uuid) antes de usarlo en assessments.",
        details: pErr?.message,
      });
    }

    const packUuid = String(packRow.pack_uuid);

    // 3) Obtener criterios del pack desde mapping (sin hardcode)
    const { data: mapRows, error: mErr } = await supabase
      .from("dts_pack_criteria_map")
      .select("criteria_id, weight")
      .eq("pack_id", packUuid);

    if (mErr) {
      return jsonError(500, { error: "pack criteria map query failed", pack, details: mErr.message });
    }

    if (!mapRows || mapRows.length === 0) {
      return jsonError(409, {
        error: "pack has no criteria mapping",
        pack,
        hint:
          "Tu pack existe, pero no tiene filas en dts_pack_criteria_map. Debes poblar el mapping (pack_id, criteria_id, weight).",
      });
    }

    // Orden estable por weight (asc) y luego por criteria_id (para empates)
    const ordered = [...mapRows].sort((a: any, b: any) => {
      const wa = Number(a.weight ?? 0);
      const wb = Number(b.weight ?? 0);
      if (wa !== wb) return wa - wb;
      return String(a.criteria_id).localeCompare(String(b.criteria_id));
    });

    const orderedCriteriaIds = ordered.map((r: any) => String(r.criteria_id));

    // 4) Cargar criterios (en bloque) + subdimension/dimension
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
        hint: "Revisa que criteria_id en dts_pack_criteria_map existan en dts_criteria.",
      });
    }

    // 5) Re-ordenar según mapping (porque .in() no preserva orden)
    const rows = sortByRank(criteriaRows as any[], orderedCriteriaIds);

    // 6) Transformación “UI ready”
    const transformed = rows.map((c: any) => {
      const subdimension = Array.isArray(c.dts_subdimensions) ? c.dts_subdimensions[0] : c.dts_subdimensions;
      const dimension = subdimension?.dts_dimensions;
      const dimensionRow = Array.isArray(dimension) ? dimension[0] : dimension;

      const dimensionName = dimensionRow?.name || "";
      const dimensionNameEs = DIMENSION_NAME_MAP[dimensionName] || dimensionName;

      return {
        id: c.id,
        code: c.code,

        // UX
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

        // Levels ES
        level_1_description_es: c.level_1_description_es,
        level_2_description_es: c.level_2_description_es,
        level_3_description_es: c.level_3_description_es,
        level_4_description_es: c.level_4_description_es,
        level_5_description_es: c.level_5_description_es,

        explain_json: c.explain_json ?? null,
      };
    });

    return NextResponse.json({
      ok: true,
      assessmentId,
      pack,
      n: transformed.length,
      criteria: transformed,
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || "Unknown error" }, { status: 500 });
  }
}
