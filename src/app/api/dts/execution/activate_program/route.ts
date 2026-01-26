// src/app/api/dts/execution/activate_program/route.ts
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type RpcOk = {
  ok: true;
  assessment_id: string;
  program_id: string;
  program_instance_id: string;
  created_action_instances: number;
  redirect_url: string;
};

type RpcErr = {
  ok: false;
  error: string;
  assessment_id?: string;
  program_id?: string;
  pack?: string;
};

type RpcResp = RpcOk | RpcErr;

export async function POST(req: Request) {
  const requestId = `activate_program_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;

  try {
    const supabase = supabaseService();
    const body = await req.json().catch(() => ({}));

    const assessmentId = String(body?.assessmentId || "").trim();
    const programId = String(body?.programId || "").trim();

    if (!assessmentId || !isUuid(assessmentId)) {
      return NextResponse.json(
        { ok: false, requestId, error: "assessmentId inválido (UUID requerido)" },
        { status: 400 }
      );
    }
    if (!programId || !isUuid(programId)) {
      return NextResponse.json(
        { ok: false, requestId, error: "programId inválido (UUID requerido)" },
        { status: 400 }
      );
    }

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

    const payload: RpcResp | null = Array.isArray(data)
      ? ((data?.[0]?.dts_activate_program_v1 ?? data?.[0]) as any)
      : (data as any);

    if (!payload) {
      return NextResponse.json(
        { ok: false, requestId, error: "Respuesta vacía del RPC", details: "null/empty" },
        { status: 500 }
      );
    }

    if ((payload as any).ok === false) {
      const p = payload as RpcErr;
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: p.error || "No se pudo activar el programa",
          assessment_id: p.assessment_id ?? assessmentId,
          program_id: p.program_id ?? programId,
          pack: (p as any).pack ?? null,
        },
        { status: 400 }
      );
    }

    const p = payload as RpcOk;

    return NextResponse.json({
      ok: true,
      requestId,
      assessment_id: String(p.assessment_id ?? assessmentId),
      program_id: String(p.program_id ?? programId),
      program_instance_id: String(p.program_instance_id),
      created_action_instances: Number(p.created_action_instances ?? 0),
      redirect_url:
        typeof p.redirect_url === "string" && p.redirect_url.length > 0
          ? p.redirect_url
          : `/resultados/${assessmentId}/ejecucion/seguimiento`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, requestId, error: err?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
