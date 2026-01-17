import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
}

export async function POST(req: Request) {
  let body: any;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 });
  }

  const { assessment_id, action_id, status, notes, owner, start_date, due_date } = body ?? {};

  if (!isUuid(assessment_id)) {
    return NextResponse.json({ error: "assessment_id inválido" }, { status: 400 });
  }

  if (!isUuid(action_id)) {
    return NextResponse.json({ error: "action_id inválido" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const row = {
    assessment_id,
    action_id,
    status: status ?? null,
    notes: notes ?? null,
    owner: owner ?? null,
    start_date: start_date ?? null,
    due_date: due_date ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("dts_assessment_actions")
    .upsert(row, { onConflict: "assessment_id,action_id" });

  if (error) {
    return NextResponse.json(
      { error: "Error guardando estado de acción", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
