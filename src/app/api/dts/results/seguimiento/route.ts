// src/app/api/dts/results/seguimiento/route.ts
// ✅ Canonical backend-driven Seguimiento
// - Input: assessmentId
// - Backend resolves active program_instance (latest) for that assessment
// - Then returns action_instances for that program_instance
// ⚠️ Frontend must NEVER compute joins; it consumes this payload only.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

type ActionItem = {
  program_instance_id: string;
  action_id: string;
  title: string;
  status: string;
  position: number | null;
};

type ProgramInstance = {
  id: string;
  assessment_id: string;
  program_id: string;
  title: string | null;
  status: string | null;
  wave: string | null;
  created_at?: string | null;
};

type ApiOk = {
  ok: true;
  requestId: string;
  assessment_id: string;
  program_instance: ProgramInstance | null;
  count: number;
  items: ActionItem[];
  hint?: string;
};

type ApiErr = {
  ok: false;
  requestId: string;
  error: string;
  details?: string | null;
};

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("Missing env NEXT_PUBLIC_SUPABASE_URL");
  if (!serviceRole) throw new Error("Missing env SUPABASE_SERVICE_ROLE_KEY");

  return createClient(url, serviceRole, {
    auth: { persistSession: false },
  });
}

export async function GET(req: Request) {
  const requestId = `seguimiento_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;

  try {
    const { searchParams } = new URL(req.url);
    const assessmentId = (searchParams.get("assessmentId") || "").trim();

    if (!assessmentId || !isUuid(assessmentId)) {
      const body: ApiErr = {
        ok: false,
        requestId,
        error: "assessmentId inválido",
        details: `assessmentId=${assessmentId}`,
      };
      return NextResponse.json(body, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // 1) Resolve latest ACTIVE program_instance for this assessment
    //    (If later you want "multiple active", we can return an array.
    //     For MVP: 1 active = the one the user just activated)
    const { data: pi, error: piErr } = await supabase
      .from("dts_program_instances")
      .select(
        "id,assessment_id,program_id,title,status,wave,created_at"
      )
      .eq("assessment_id", assessmentId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (piErr) {
      const body: ApiErr = {
        ok: false,
        requestId,
        error: "Error leyendo dts_program_instances",
        details: piErr.message,
      };
      return NextResponse.json(body, { status: 500 });
    }

    // If no active program instance yet -> return empty but OK
    if (!pi?.id) {
      const body: ApiOk = {
        ok: true,
        requestId,
        assessment_id: assessmentId,
        program_instance: null,
        count: 0,
        items: [],
        hint:
          "No hay programa activo. Activa un programa desde Programas/Roadmap para crear el plan de ejecución.",
      };
      return NextResponse.json(body, { status: 200 });
    }

    const programInstance: ProgramInstance = {
      id: String(pi.id),
      assessment_id: String(pi.assessment_id),
      program_id: String(pi.program_id),
      title: pi.title ?? null,
      status: pi.status ?? null,
      wave: pi.wave ?? null,
      created_at: (pi as any).created_at ?? null,
    };

    // 2) Read action instances for that program_instance
    const { data: actions, error: aErr } = await supabase
      .from("dts_action_instances")
      .select("program_instance_id,action_id,title,status,position")
      .eq("program_instance_id", programInstance.id)
      .order("position", { ascending: true });

    if (aErr) {
      const body: ApiErr = {
        ok: false,
        requestId,
        error: "Error leyendo dts_action_instances",
        details: aErr.message,
      };
      return NextResponse.json(body, { status: 500 });
    }

    const items: ActionItem[] = (actions || []).map((r: any) => ({
      program_instance_id: String(r.program_instance_id),
      action_id: String(r.action_id),
      title: String(r.title || ""),
      status: String(r.status || "todo"),
      position: r.position ?? null,
    }));

    const body: ApiOk = {
      ok: true,
      requestId,
      assessment_id: assessmentId,
      program_instance: programInstance,
      count: items.length,
      items,
    };

    return NextResponse.json(body, { status: 200 });
  } catch (e: any) {
    const body: ApiErr = {
      ok: false,
      requestId,
      error: "Error inesperado en seguimiento",
      details: e?.message || String(e),
    };
    return NextResponse.json(body, { status: 500 });
  }
}
