//src/app/api/dts/results/v1/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveCoverageV1 } from "@/lib/dts/snapshotResolver";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
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

    // 3) Resolver cobertura (snapshot if cacheable + state allows; live otherwise)
    //    Nota: variable se llama resolvedCoverage para evitar colisión con
    //    `resolved` ya usada en resolveCriteriaTotalInPack helper local.
    let resolvedCoverage;
    try {
      resolvedCoverage = await resolveCoverageV1(supabase, assessmentId);
    } catch (err: any) {
      console.error("[results/v1] resolver error", {
        requestId,
        assessmentId,
        packCode,
        message: err?.message,
      });
      return NextResponse.json(
        { ok: false, requestId, error: err?.message ?? "Resolver error" },
        { status: 500 }
      );
    }
    const payload = resolvedCoverage.data; // CoverageV1, ya validada por shape del helper

    // 4) Pack-aware guard: dual-mode (R-PR2-2)
    //    - fromSnapshot=false (live): 409 hard como antes (PACK_OUT_OF_SYNC)
    //    - fromSnapshot=true (snapshot): WARN diagnóstico + servir snapshot
    const rpcTotal = Number(payload?.totals?.total_criteria ?? NaN);
    const totalsMismatch =
      !Number.isFinite(rpcTotal) || rpcTotal !== criteriaTotalInPack;

    if (totalsMismatch) {
      if (!resolvedCoverage.fromSnapshot) {
        // LIVE MODE: comportamiento existente preservado (409)
        console.error("[results/v1] PACK_OUT_OF_SYNC", {
          requestId,
          assessmentId,
          packCode,
          criteriaTotalInPack,
          rpcTotal,
          fromSnapshot: false,
          snapshotState: resolvedCoverage.state,
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
      } else {
        // SNAPSHOT MODE: WARN + servir snapshot (no 409).
        // Razón: el snapshot es histórico inmutable; si el pack live cambió tras
        // el complete, el CEO debe seguir viendo su diagnóstico congelado.
        console.warn("[results/v1] PACK_TOTALS_DRIFT_SNAPSHOT_MODE", {
          requestId,
          assessmentId,
          packCode,
          snapshotTotal: rpcTotal,
          livePackTotal: criteriaTotalInPack,
          snapshotState: resolvedCoverage.state,
          snapshotId:
            "snapshotId" in resolvedCoverage ? resolvedCoverage.snapshotId : null,
          modelFingerprintMatch:
            "modelFingerprintMatch" in resolvedCoverage
              ? resolvedCoverage.modelFingerprintMatch
              : null,
          note:
            "Snapshot conservado como histórico. Drift de pack live vs snapshot detectado, no se corta render.",
        });
        // continuar sin abortar
      }
    }

    // 5) Response success — flags al root del payload (R-PR2-1, aditivo)
    const responseBody = {
      ...payload,
      fromSnapshot: resolvedCoverage.fromSnapshot,
      snapshotId:
        "snapshotId" in resolvedCoverage ? resolvedCoverage.snapshotId : null,
      snapshotState: resolvedCoverage.state,
      metadataLive: resolvedCoverage.metadataLive,
    };
    const res = NextResponse.json(responseBody, { status: 200 });
    res.headers.set("X-From-Snapshot", String(resolvedCoverage.fromSnapshot));
    res.headers.set("X-Snapshot-State", resolvedCoverage.state);
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
