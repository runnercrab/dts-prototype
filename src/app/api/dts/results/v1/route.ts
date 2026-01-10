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
  const hasTotals = typeof payload?.totals === "object" && payload?.totals !== null;
  const hasByDim = Array.isArray(payload?.by_dimension);
  if (!hasTotals || !hasByDim) return null;

  return payload;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = (searchParams.get("assessmentId") || "").trim();

    if (!assessmentId || !isUuid(assessmentId)) {
      return NextResponse.json(
        { error: "Invalid assessmentId (expected UUID)" },
        { status: 400 }
      );
    }

    // Server-side env vars ONLY
    const url = process.env.SUPABASE_URL || "";
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!url || !serviceKey) {
      return NextResponse.json(
        {
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
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    // 2) Resolve criteria_total_in_pack (NO fallback to 129)
    const { count: criteriaTotalInPack, error: pErr } = await supabase
      .from("dts_pack_criteria")
      .select("*", { count: "exact", head: true })
      .eq("pack", assessment.pack);

    if (pErr) {
      return NextResponse.json(
        { error: "Failed to resolve pack criteria" },
        { status: 500 }
      );
    }

    if (!criteriaTotalInPack || criteriaTotalInPack === 0) {
      // Pack not mapped => do not invent 129
      return NextResponse.json(
        { error: "PACK_NOT_FOUND" },
        { status: 404 }
      );
    }

    // 3) Call RPC
    const { data, error } = await supabase.rpc("dts_results_v1", {
      p_assessment_id: assessmentId,
    });

    if (error) {
      console.error("[results/v1] RPC error", {
        assessmentId,
        message: error.message,
      });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const payload = normalizePayload(data);

    if (!payload) {
      console.error("[results/v1] No/invalid payload", { assessmentId, data });
      return NextResponse.json(
        { error: "No data (or invalid payload) for assessmentId" },
        { status: 404 }
      );
    }

    // 4) Pack-aware guard: prevent 12/129 (no shape changes)
    const rpcTotal = Number(payload?.totals?.total_criteria ?? NaN);
    if (!Number.isFinite(rpcTotal) || rpcTotal !== criteriaTotalInPack) {
      console.error("[results/v1] PACK_OUT_OF_SYNC", {
        assessmentId,
        pack: assessment.pack,
        criteriaTotalInPack,
        rpcTotal,
      });
      return NextResponse.json(
        { error: "PACK_OUT_OF_SYNC" },
        { status: 409 }
      );
    }

    const res = NextResponse.json(payload, { status: 200 });
    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (e: any) {
    console.error("[results/v1] Unexpected error", { message: e?.message });
    return NextResponse.json(
      { error: e?.message || "Unexpected error" },
      { status: 500 }
    );
  }
}
