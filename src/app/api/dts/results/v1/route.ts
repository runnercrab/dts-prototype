//src/app/api/dts/results/v1/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function normalizePayload(data: any) {
  // Some DB tools / queries wrap results as: [{ results_v1: {...} }]
  // Or: [{...}] or: { results_v1: {...} } or: {...}
  const payload = Array.isArray(data)
    ? (data[0]?.results_v1 ?? data[0] ?? null)
    : (data?.results_v1 ?? data ?? null);

  if (!payload) return null;

  // Minimal shape validation (avoid returning nonsense)
  const hasTotals =
    typeof payload?.totals === "object" && payload?.totals !== null;
  const hasByDim = Array.isArray(payload?.by_dimension);
  if (!hasTotals || !hasByDim) return null;

  return payload;
}

/**
 * Intenta resolver cuántos criterios hay en el pack del assessment.
 * Soporta varios esquemas típicos:
 *  - dts_pack_criteria.pack = "tmf_full_v5"
 *  - dts_pack_criteria.pack_code = "tmf_full_v5"
 *  - dts_pack_criteria.pack_id = (uuid) y dts_packs.id + dts_packs.code
 */
async function resolveCriteriaTotalInPack(supabase: any, packCode: string) {
  const attempts: Array<{ where: string; count: number | null; error?: string }> =
    [];

  // 1) Intento: dts_pack_criteria.pack = packCode
  {
    const { count, error } = await supabase
      .from("dts_pack_criteria")
      .select("*", { count: "exact", head: true })
      .eq("pack", packCode);

    attempts.push({
      where: "dts_pack_criteria.pack",
      count: typeof count === "number" ? count : null,
      error: error?.message,
    });

    if (!error && typeof count === "number" && count > 0) {
      return { total: count, attempts };
    }
  }

  // 2) Intento: dts_pack_criteria.pack_code = packCode (muy típico)
  {
    const { count, error } = await supabase
      .from("dts_pack_criteria")
      .select("*", { count: "exact", head: true })
      .eq("pack_code", packCode);

    attempts.push({
      where: "dts_pack_criteria.pack_code",
      count: typeof count === "number" ? count : null,
      error: error?.message,
    });

    if (!error && typeof count === "number" && count > 0) {
      return { total: count, attempts };
    }
  }

  // 3) Intento: resolver pack_id desde dts_packs (por code) y contar por pack_id
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
      const { count, error } = await supabase
        .from("dts_pack_criteria")
        .select("*", { count: "exact", head: true })
        .eq("pack_id", packRow.id);

      attempts.push({
        where: `dts_pack_criteria.pack_id = dts_packs.id (${packRow.id})`,
        count: typeof count === "number" ? count : null,
        error: error?.message,
      });

      if (!error && typeof count === "number" && count > 0) {
        return { total: count, attempts };
      }
    }
  }

  // Nada encontrado
  return { total: 0, attempts };
}

export async function GET(req: Request) {
  const requestId = `results_v1_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;

  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = (searchParams.get("assessmentId") || "").trim();

    if (!assessmentId || !isUuid(assessmentId)) {
      return NextResponse.json(
        { ok: false, requestId, error: "Invalid assessmentId (expected UUID)" },
        { status: 400 }
      );
    }

    // Server-side env vars ONLY
    const url = process.env.SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!url || !serviceKey) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error:
            "Missing env vars: SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY",
        },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // 1) Resolve pack from assessment (source of truth)
    const { data: assessment, error: asErr } = await supabase
      .from("dts_assessments")
      .select("id, pack")
      .eq("id", assessmentId)
      .single();

    if (asErr || !assessment) {
      return NextResponse.json(
        { ok: false, requestId, error: "Assessment not found" },
        { status: 404 }
      );
    }

    const packCode = String(assessment.pack || "").trim();

    console.log("✅ [results/v1] requestId=", requestId, {
      assessmentId,
      packCode,
    });

    if (!packCode) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "PACK_MISSING_ON_ASSESSMENT",
        },
        { status: 409 }
      );
    }

    // 2) Resolve criteria_total_in_pack (pack registry)
    const resolved = await resolveCriteriaTotalInPack(supabase, packCode);
    const criteriaTotalInPack = resolved.total;

    if (!criteriaTotalInPack || criteriaTotalInPack === 0) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "PACK_NOT_FOUND",
          pack: packCode,
          hint:
            "No hay mapping en dts_pack_criteria para este pack. Revisa si el campo es pack / pack_code / pack_id y si el pack está sembrado.",
          debug: {
            attempts: resolved.attempts,
          },
        },
        { status: 404 }
      );
    }

    // 3) Call RPC
    const { data, error } = await supabase.rpc("dts_results_v1", {
      p_assessment_id: assessmentId,
    });

    if (error) {
      console.error("[results/v1] RPC error", {
        requestId,
        assessmentId,
        packCode,
        message: error.message,
      });
      return NextResponse.json(
        { ok: false, requestId, error: error.message },
        { status: 500 }
      );
    }

    const payload = normalizePayload(data);

    if (!payload) {
      console.error("[results/v1] No/invalid payload", {
        requestId,
        assessmentId,
        packCode,
        data,
      });
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "No data (or invalid payload) for assessmentId",
        },
        { status: 404 }
      );
    }

    // 4) Pack-aware guard: prevent 12/129 mismatch
    const rpcTotal = Number(payload?.totals?.total_criteria ?? NaN);

    if (!Number.isFinite(rpcTotal) || rpcTotal !== criteriaTotalInPack) {
      console.error("[results/v1] PACK_OUT_OF_SYNC", {
        requestId,
        assessmentId,
        packCode,
        criteriaTotalInPack,
        rpcTotal,
      });
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "PACK_OUT_OF_SYNC",
          pack: packCode,
          criteriaTotalInPack,
          rpcTotal,
          hint:
            "El RPC dts_results_v1 está devolviendo un total distinto al mapping del pack en dts_pack_criteria.",
        },
        { status: 409 }
      );
    }

    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    console.error("[results/v1] Unexpected error", {
      requestId,
      message: e?.message,
    });
    return NextResponse.json(
      { ok: false, requestId, error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
