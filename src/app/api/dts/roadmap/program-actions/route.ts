// src/app/api/dts/roadmap/program-actions/route.ts
//
// M3 · Ejecución mínima /dts — Route de LECTURA (cero RPC, cero escritura).
// Devuelve las acciones activas de un programa (dts_action_catalog por
// program_code) con su estado por assessment (dts_action_status). Tablas
// neutras: no toca motor, snapshots ni RPCs.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const assessmentId = (searchParams.get("assessmentId") || "").trim();
  const programCode = (searchParams.get("programCode") || "").trim();

  if (!assessmentId || !isUuid(assessmentId)) {
    return NextResponse.json(
      { ok: false, error: "assessmentId inválido (UUID requerido)" },
      { status: 400 }
    );
  }
  if (!programCode) {
    return NextResponse.json(
      { ok: false, error: "programCode requerido" },
      { status: 400 }
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) {
    return NextResponse.json(
      { ok: false, error: "Missing env vars" },
      { status: 500 }
    );
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  // 1) Acciones activas del programa (catálogo, tabla neutra)
  const { data: actions, error: aErr } = await sb
    .from("dts_action_catalog")
    .select(
      "id, code, title, description, deliverable, dod, band, hours_typical, month, program_code, que_hacer, como_hacerlo, para_que_sirve, entregable_concreto, ejemplo"
    )
    .eq("program_code", programCode)
    .eq("is_active", true)
    .order("month", { ascending: true })
    .order("code", { ascending: true });

  if (aErr) {
    return NextResponse.json(
      { ok: false, error: aErr.message },
      { status: 500 }
    );
  }

  // 2) Estados persistidos del assessment (tabla neutra)
  const { data: statuses, error: sErr } = await sb
    .from("dts_action_status")
    .select("action_id, status")
    .eq("assessment_id", assessmentId);

  if (sErr) {
    return NextResponse.json(
      { ok: false, error: sErr.message },
      { status: 500 }
    );
  }

  const statusByAction = new Map<string, string>();
  for (const row of statuses || []) {
    if (row?.action_id) statusByAction.set(row.action_id, row.status);
  }

  const items = (actions || []).map((a: any) => ({
    id: a.id,
    code: a.code,
    name: a.title || a.code,
    description: a.description ?? null,
    dod: a.dod ?? null,
    que_hacer: a.que_hacer ?? null,
    como_hacerlo: a.como_hacerlo ?? null,
    para_que_sirve: a.para_que_sirve ?? null,
    entregable_concreto: a.entregable_concreto ?? null,
    ejemplo: a.ejemplo ?? null,
    status: statusByAction.get(a.id) === "completed" ? "completed" : "pending",
  }));

  return NextResponse.json({
    ok: true,
    assessmentId,
    programCode,
    count: items.length,
    actions: items,
  });
}
