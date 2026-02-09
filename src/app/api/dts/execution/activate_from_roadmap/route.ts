// src/app/api/dts/execution/activate_from_roadmap/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: unknown): v is string {
  if (typeof v !== "string") return false;
  const s = v.trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

function getServiceSupabase() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env SUPABASE_URL");
  if (!serviceKey) throw new Error("Missing env SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

type Body = {
  assessmentId?: string;
  programId?: string;
};

async function assertProgramBelongsToAssessmentPack(params: {
  supabase: ReturnType<typeof createClient>;
  assessmentId: string;
  programId: string;
}) {
  // 1) leer pack del assessment
  const { data: aRow, error: aErr } = await params.supabase
    .from("dts_assessments")
    .select("id, pack")
    .eq("id", params.assessmentId)
    .maybeSingle();

  if (aErr) throw new Error(`No se pudo leer dts_assessments: ${aErr.message}`);
  if (!aRow) {
    return { ok: false as const, reason: "ASSESSMENT_NOT_FOUND" as const, pack: null as any };
  }

  const pack = String((aRow as any).pack || "").trim();
  if (!pack) {
    return { ok: false as const, reason: "ASSESSMENT_PACK_MISSING" as const, pack };
  }

  // 2) validar que el programa pertenece al pack del assessment
  const { data: ppRow, error: ppErr } = await params.supabase
    .from("dts_pack_programs")
    .select("pack, program_id")
    .eq("pack", pack)
    .eq("program_id", params.programId)
    .maybeSingle();

  if (ppErr) throw new Error(`No se pudo leer dts_pack_programs: ${ppErr.message}`);
  if (!ppRow) {
    return { ok: false as const, reason: "PROGRAM_NOT_IN_PACK" as const, pack };
  }

  return { ok: true as const, pack };
}

export async function POST(req: NextRequest) {
  const requestId = `activate_program_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    const body = (await req.json().catch(() => null)) as Body | null;
    const assessmentId = body?.assessmentId?.toString().trim();
    const programId = body?.programId?.toString().trim();

    if (!isUuid(assessmentId) || !isUuid(programId)) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "Bad request: assessmentId/programId inválidos (uuid requerido)",
          details: `assessmentId=${String(assessmentId)} programId=${String(programId)}`,
        },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // ✅ Regla correcta: NO depende de ranking.
    // Depende de: assessment existe + pack definido + program pertenece al pack.
    const chk = await assertProgramBelongsToAssessmentPack({
      supabase,
      assessmentId,
      programId,
    });

    if (!chk.ok) {
      const msg =
        chk.reason === "ASSESSMENT_NOT_FOUND"
          ? "No se puede iniciar: assessment no encontrado."
          : chk.reason === "ASSESSMENT_PACK_MISSING"
          ? "No se puede iniciar: el assessment no tiene pack definido."
          : "No se puede iniciar: este programa no pertenece al pack del assessment.";

      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: msg,
          details:
            chk.reason === "PROGRAM_NOT_IN_PACK"
              ? `programId=${programId} no está en dts_pack_programs para pack=${chk.pack}`
              : chk.reason,
        },
        { status: 200 }
      );
    }

    // ✅ Activación canónica (source of truth)
    const { data, error } = await supabase.rpc("dts_activate_program_v1", {
      p_assessment_id: assessmentId,
      p_program_id: programId,
    });

    if (error) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "RPC dts_activate_program_v1 falló",
          details: error.message,
        },
        { status: 500 }
      );
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "Respuesta inválida del RPC",
          details: "RPC devolvió null o tipo inesperado",
        },
        { status: 500 }
      );
    }

    const okVal = (data as any).ok;
    if (okVal === false) {
      return NextResponse.json(
        {
          requestId,
          ...data,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        requestId,
        ...data,
        hint: "Activación permitida por pertenencia al pack (no dependiente de ranking).",
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: "Internal error",
        details: e?.message || String(e),
      },
      { status: 500 }
    );
  }
}
