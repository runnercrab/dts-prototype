// src/app/api/dts/results/programs/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveProgramsPayload } from "@/lib/dts/snapshotResolver";

export const dynamic = "force-dynamic";

/**
 * ✅ CANÓNICO
 * /api/dts/results/programs?assessmentId=...&onlyShortlist=0|1&useOverrides=0|1
 *
 * - Modo normal: ranking por RPC dts_results_programs_v2 (backend calcula todo).
 * - Modo fallback (si RPC devuelve 0 filas): catálogo del pack (para que UI NUNCA quede vacía).
 *
 * Regla: este endpoint NO inventa scoring/prioridad. Solo devuelve lo que haya en RPC/DB.
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

function toNum(v: any, fallback: number | null = null) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number") return Number.isFinite(v) ? v : fallback;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function toInt(v: any, fallback: number | null = null) {
  const n = toNum(v, null);
  if (n === null) return fallback;
  const r = Math.round(n);
  return Number.isFinite(r) ? r : fallback;
}

async function safeCount(
  supabase: any,
  table: string,
  filters: Array<[string, any]> = []
) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  for (const [col, val] of filters) q = q.eq(col, val);
  const { count, error } = await q;
  return { count: count ?? 0, error: error?.message ?? null };
}

function buildState(assessmentId: string) {
  return {
    where_you_are:
      "Estos son los programas con más impacto para mejorar tu negocio",
    primary_cta: {
      label: "Ver detalle y acciones",
      // El front puede sustituir {programId} por item.program_id.
      href_template: `/resultados/${assessmentId}/ejecucion/programas/{programId}`,
    },
    secondary_cta: {
      label: "Ver roadmap",
      href: `/resultados/${assessmentId}/ejecucion/roadmap`,
    },
    business_impact:
      "Prioriza cash (ahorro/ingreso), mejora experiencia cliente y reduce riesgo operativo.",
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
        ok: false,
        version: "v1",
        error: "assessmentId inválido (UUID requerido)",
        received: assessmentIdRaw,
        normalized: assessmentId,
      },
      { status: 400 }
    );
  }

  // ✅ Server-only envs
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url)
    return NextResponse.json(
      { ok: false, version: "v1", error: "Missing env SUPABASE_URL" },
      { status: 500 }
    );
  if (!serviceKey)
    return NextResponse.json(
      { ok: false, version: "v1", error: "Missing env SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1) assessment + pack
  const { data: assessment, error: aErr } = await supabase
    .from("dts_assessments")
    .select("id, pack")
    .eq("id", assessmentId)
    .single();

  if (aErr || !assessment) {
    return NextResponse.json(
      {
        ok: false,
        version: "v1",
        error: "Assessment no encontrado",
        details: aErr?.message ?? null,
      },
      { status: 404 }
    );
  }

  // 2) Ranking via snapshotResolver (snapshot if cacheable + state allows; live otherwise)
  let resolved;
  try {
    resolved = await resolveProgramsPayload(supabase, assessmentId, {
      onlyShortlist,
      useOverrides,
    });
  } catch (err: any) {
    console.error("[api programs] resolver error:", err);
    return NextResponse.json(
      {
        ok: false,
        version: "v1",
        error: "Error obteniendo programas",
        details: err?.message ?? null,
      },
      { status: 500 }
    );
  }
  const data = resolved.data;
  const rows = Array.isArray(data) ? data : [];

  // M3: discrimina la forma servida por el resolver. El motor v3 (v23) trae
  // `entra_en_roadmap`/`priority_score`; el v2 legacy trae `program_score`/
  // `priority_badge`/`top_contributors`. Un snapshot v23 con foto v2 antigua
  // (Gedeth/fc) se sirve congelado en forma v2 → sniff por fila, no por pack.
  const isV3Row = (r: any) =>
    r && typeof r === "object" && "entra_en_roadmap" in r;
  const payloadVersion = rows.some(isV3Row) ? "v3" : "v2";
  const modelFingerprintMatch =
    "modelFingerprintMatch" in resolved ? resolved.modelFingerprintMatch : null;

  // ✅ Modo normal: ranking con datos
  if (rows.length > 0) {
    const items = rows
      .map((r: any) => {
        const v3 = isV3Row(r);
        return {
          rank: toInt(r.rank, null),
          program_id: r.program_id ?? null,
          program_code: r.program_code ?? null,
          title: r.title ?? null,
          status: r.status ?? null,

          // v3: impact_n/effort del motor; v2: impact_score/effort_score
          impact_score: toInt(v3 ? r.impact_n : r.impact_score, null),
          effort_score: toInt(v3 ? r.effort : r.effort_score, null),

          weighted_need: toNum(r.weighted_need, null),
          value_score: toNum(r.value_score, null),
          // v3: el score del motor es priority_score; v2: program_score
          program_score: toNum(v3 ? r.priority_score : r.program_score, null),

          criteria_covered: toInt(r.criteria_covered, null),

          // v3 (D1/T2): tier/crit/entra_en_roadmap del motor; null en v2
          tier: v3 ? toInt(r.tier, null) : null,
          crit: v3 ? toInt(r.crit, null) : null,
          entra_en_roadmap: v3 ? r.entra_en_roadmap === true : null,

          notes: r.notes ?? null,
          owner: r.owner ?? null,

          // v3 (D4/T2): mueren badges TOP/MEDIA, priority_reason técnico y
          // top_contributors; solo sobreviven en la foto v2 congelada.
          priority_badge: v3 ? null : r.priority_badge ?? null,
          priority_reason: v3 ? null : r.priority_reason ?? null,

          top_contributors:
            !v3 && Array.isArray(r.top_contributors)
              ? r.top_contributors.map((c: any) => ({
                  gap: toInt(c.gap, 0) ?? 0,
                  title: c.title ?? null,
                  importance: toInt(c.importance, 0) ?? 0,
                  map_weight: toNum(c.map_weight, 0) ?? 0,
                  pack_weight: toNum(c.pack_weight, 0) ?? 0,
                  criteria_code: c.criteria_code ?? null,
                  need_component: toNum(c.need_component, 0) ?? 0,
                }))
              : [],

          top_contributors_need: v3 ? null : toNum(r.top_contributors_need, null),
          top_contributors_share: v3
            ? null
            : toNum(r.top_contributors_share, null),
          top_contributors_count: v3
            ? null
            : toInt(r.top_contributors_count, null),
        };
      })
      .sort((a: any, b: any) => (a.rank ?? 999) - (b.rank ?? 999));

    const res = NextResponse.json({
      ok: true,
      version: "v1",
      payload_version: payloadVersion,
      assessment_id: assessmentId,
      pack: assessment.pack,
      mode: "ranked",
      state: buildState(assessmentId),
      count: items.length,
      items,
      fromSnapshot: resolved.fromSnapshot,
      snapshotId: "snapshotId" in resolved ? resolved.snapshotId : null,
      snapshotState: resolved.state,
      // M3: "modelo evolucionado" deja de ser solo log; se expone al caller.
      modelFingerprintMatch,
    });
    res.headers.set("X-From-Snapshot", String(resolved.fromSnapshot));
    res.headers.set("X-Snapshot-State", resolved.state);
    res.headers.set("X-Payload-Version", payloadVersion);
    if (modelFingerprintMatch === false)
      res.headers.set("X-Model-Evolved", "true");
    return res;
  }

  // ✅ Modo fallback: catálogo del pack (para que UI nunca quede vacía)
  // ✅ FIX: NO usar inner join. Si hay filas en dts_pack_programs pero falta catálogo/relación,
  // igualmente devolvemos la lista para que el CEO pueda avanzar (sin inventar scores).
  const { data: packPrograms, error: pErr } = await supabase
    .from("dts_pack_programs")
    // LEFT join por defecto (sin !inner)
    .select("program_id, display_order, is_active, dts_program_catalog(code, title)")
    .eq("pack", assessment.pack)
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (pErr) {
    return NextResponse.json(
      {
        ok: false,
        version: "v1",
        error: "Error obteniendo programas del pack (fallback)",
        details: pErr.message,
      },
      { status: 500 }
    );
  }

  const fallbackRows = Array.isArray(packPrograms) ? packPrograms : [];

  // Si aun así no hay nada, devolvemos MOTIVO REAL + contadores
  if (fallbackRows.length === 0) {
    const c1 = await safeCount(supabase, "dts_pack_programs", [["pack", assessment.pack]]);
    const c2 = await safeCount(supabase, "dts_pack_programs", [
      ["pack", assessment.pack],
      ["is_active", true],
    ]);
    const c3 = await safeCount(supabase, "dts_program_catalog");

    const res = NextResponse.json({
      ok: true,
      version: "v1",
      assessment_id: assessmentId,
      pack: assessment.pack,
      mode: "empty",
      state: buildState(assessmentId),
      hint:
        "El backend no tiene programas configurados para este pack (o están inactivos). No es un problema del diagnóstico.",
      count: 0,
      items: [],
      debug: {
        pack_programs_total: c1.count,
        pack_programs_active: c2.count,
        program_catalog_total: c3.count,
        warnings: [
          c1.count === 0
            ? "No hay filas en dts_pack_programs para este pack."
            : "Hay filas en dts_pack_programs pero ninguna activa o el join no aporta title/code.",
        ],
      },
      fromSnapshot: resolved.fromSnapshot,
      snapshotId: "snapshotId" in resolved ? resolved.snapshotId : null,
      snapshotState: resolved.state,
    });
    res.headers.set("X-From-Snapshot", String(resolved.fromSnapshot));
    res.headers.set("X-Snapshot-State", resolved.state);
    return res;
  }

  const items = fallbackRows.map((r: any, idx: number) => ({
    rank: idx + 1,
    program_id: r.program_id ?? null,
    program_code: r?.dts_program_catalog?.code ?? null,
    title: r?.dts_program_catalog?.title ?? null,
    status: null,

    impact_score: null,
    effort_score: null,
    weighted_need: null,
    value_score: null,
    program_score: null,
    criteria_covered: null,

    notes: null,
    owner: null,

    priority_badge: null,
    priority_reason:
      "Completa el diagnóstico para priorizar este programa con datos (ranking desde backend).",
    top_contributors: [],
    top_contributors_need: null,
    top_contributors_share: null,
    top_contributors_count: null,
  }));

  const res = NextResponse.json({
    ok: true,
    version: "v1",
    assessment_id: assessmentId,
    pack: assessment.pack,
    mode: "catalog_fallback",
    state: buildState(assessmentId),
    hint:
      "No hay ranking disponible (RPC devolvió 0 filas). Se muestra el catálogo del pack para permitir activar ejecución.",
    count: items.length,
    items,
    fromSnapshot: resolved.fromSnapshot,
    snapshotId: "snapshotId" in resolved ? resolved.snapshotId : null,
    snapshotState: resolved.state,
  });
  res.headers.set("X-From-Snapshot", String(resolved.fromSnapshot));
  res.headers.set("X-Snapshot-State", resolved.state);
  return res;
}
