// src/app/api/dts/assessment/complete/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Fase 1: solo gapply_v23 va al wrapper con snapshot.
// Otros packs siguen llamando a dts_assessment_complete_v1 directamente (legacy).
// Esta lista debe coincidir con la allowlist de la wrapper SQL.
const SNAPSHOT_PACKS = new Set(["gapply_v23"]);

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

type CompleteOk = {
  ok: true;
  snapshotId: string | null;
  wasExisting: boolean;
  completed: boolean;
  wasAlreadyCompleted: boolean;
};

type CompleteErr = {
  ok: false;
  error:
    | "invalid_assessment_id"
    | "missing_env"
    | "lookup_failed"
    | "not_found"
    | "invalid_assessment_pack"
    | "demo_not_allowed"
    | "completion_rejected"
    | "completion_failed";
};

export async function POST(req: Request) {
  // Capturado fuera del try para poder loguearlo en el catch global si se obtuvo
  let assessmentId = "";

  try {
    // ─── Parse body inline (sin helper) ──────────────────────────────
    let body: unknown = null;
    try {
      body = await req.json();
    } catch {
      body = null;
    }
    assessmentId = (
      (body as { assessmentId?: unknown } | null)?.assessmentId ?? ""
    )
      .toString()
      .trim();

    if (!assessmentId || !isUuid(assessmentId)) {
      return NextResponse.json<CompleteErr>(
        { ok: false, error: "invalid_assessment_id" },
        { status: 400 }
      );
    }

    // ─── Env validation con log explícito de qué falta ───────────────
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !serviceKey) {
      console.error("[assessment/complete] missing env:", {
        SUPABASE_URL_present: !!url,
        SUPABASE_SERVICE_ROLE_KEY_present: !!serviceKey,
      });
      return NextResponse.json<CompleteErr>(
        { ok: false, error: "missing_env" },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // ─── Lookup minimal: pack + is_demo para bifurcar ────────────────
    const { data: asm, error: asmErr } = await supabase
      .from("dts_assessments")
      .select("id, pack, is_demo")
      .eq("id", assessmentId)
      .maybeSingle();

    if (asmErr) {
      console.error("[assessment/complete] lookup error:", {
        assessmentId,
        code: asmErr.code,
        message: asmErr.message,
      });
      return NextResponse.json<CompleteErr>(
        { ok: false, error: "lookup_failed" },
        { status: 500 }
      );
    }
    if (!asm) {
      return NextResponse.json<CompleteErr>(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }
    if (!asm.pack) {
      console.error("[assessment/complete] assessment without pack:", {
        assessmentId,
      });
      return NextResponse.json<CompleteErr>(
        { ok: false, error: "invalid_assessment_pack" },
        { status: 422 }
      );
    }

    // Defensive: rechazar demo en path snapshot ANTES de llamar al wrapper.
    // El wrapper también lo rechaza (defensa en profundidad).
    if (SNAPSHOT_PACKS.has(asm.pack) && asm.is_demo === true) {
      return NextResponse.json<CompleteErr>(
        { ok: false, error: "demo_not_allowed" },
        { status: 403 }
      );
    }

    // ─── Path A: gapply_v23 → wrapper con snapshot ───────────────────
    if (SNAPSHOT_PACKS.has(asm.pack)) {
      const { data, error } = await supabase.rpc(
        "dts_complete_assessment_with_snapshot",
        { p_assessment_id: assessmentId }
      );

      if (error) {
        console.error("[assessment/complete] wrapper rpc error:", {
          assessmentId,
          pack: asm.pack,
          code: error.code,
          message: error.message,
        });
        if (error.code === "P0002") {
          return NextResponse.json<CompleteErr>(
            { ok: false, error: "not_found" },
            { status: 404 }
          );
        }
        if (error.code === "P0001") {
          return NextResponse.json<CompleteErr>(
            { ok: false, error: "completion_rejected" },
            { status: 422 }
          );
        }
        return NextResponse.json<CompleteErr>(
          { ok: false, error: "completion_failed" },
          { status: 500 }
        );
      }

      // Wrapper devuelve jsonb scalar:
      //   { completed, was_already_completed, snapshot: { id, was_existing, ... }, ... }
      // Shape verificada en SQL de Paso 5 v4.
      const payload = (data as Record<string, unknown> | null) || {};
      const snap = (payload.snapshot as Record<string, unknown> | null) || {};

      const response: CompleteOk = {
        ok: true,
        snapshotId: typeof snap.id === "string" ? snap.id : null,
        wasExisting: snap.was_existing === true,
        completed: payload.completed === true,
        wasAlreadyCompleted: payload.was_already_completed === true,
      };
      return NextResponse.json(response);
    }

    // ─── Path B: legacy → dts_assessment_complete_v1 directo ─────────
    const { data, error } = await supabase.rpc("dts_assessment_complete_v1", {
      p_assessment_id: assessmentId,
    });

    if (error) {
      console.error("[assessment/complete] legacy rpc error:", {
        assessmentId,
        pack: asm.pack,
        code: error.code,
        message: error.message,
      });
      return NextResponse.json<CompleteErr>(
        { ok: false, error: "completion_failed" },
        { status: 500 }
      );
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.ok) {
      return NextResponse.json<CompleteErr>(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }

    const response: CompleteOk = {
      ok: true,
      snapshotId: null,
      wasExisting: false,
      completed: true,
      wasAlreadyCompleted: false,
    };
    return NextResponse.json(response);
  } catch (err) {
    // Catch global: cualquier excepción inesperada (e.g. red, timeout, parse)
    // queda con respuesta JSON estable, no HTML 500 de Next.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[assessment/complete] unexpected error:", {
      assessmentId: assessmentId || null,
      message,
    });
    return NextResponse.json<CompleteErr>(
      { ok: false, error: "completion_failed" },
      { status: 500 }
    );
  }
}
