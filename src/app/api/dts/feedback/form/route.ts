import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const MAX_PAYLOAD_BYTES = 100000;

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export async function POST(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return NextResponse.json({ error: "Missing env" }, { status: 500 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    form_type,
    form_version,
    assessment_id,
    respondent_label,
    respondent_email,
    payload,
    source,
  } = body ?? {};

  // form_type: string no vacío
  if (typeof form_type !== "string" || form_type.trim() === "") {
    return NextResponse.json({ error: "form_type required" }, { status: 400 });
  }

  // payload: objeto no null y no array
  if (!isPlainObject(payload)) {
    return NextResponse.json({ error: "payload must be an object" }, { status: 400 });
  }

  // no aceptar payload vacío (el formulario requiere respuestas)
  if (Object.keys(payload).length === 0) {
    return NextResponse.json({ error: "payload is empty" }, { status: 400 });
  }

  // tamaño máximo razonable
  if (JSON.stringify(payload).length >= MAX_PAYLOAD_BYTES) {
    return NextResponse.json({ error: "payload too large" }, { status: 413 });
  }

  // assessment_id y respondent_email opcionales
  const assessmentId =
    typeof assessment_id === "string" && assessment_id.trim() !== "" ? assessment_id : null;
  const respondentEmail =
    typeof respondent_email === "string" && respondent_email.trim() !== "" ? respondent_email : null;
  const respondentLabel =
    typeof respondent_label === "string" && respondent_label.trim() !== "" ? respondent_label : null;
  const formVersion =
    typeof form_version === "string" && form_version.trim() !== "" ? form_version : "v1";
  const src = typeof source === "string" && source.trim() !== "" ? source : null;

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { error } = await sb.from("dts_form_submissions").insert({
    form_type: form_type.trim(),
    form_version: formVersion,
    assessment_id: assessmentId,
    respondent_label: respondentLabel,
    respondent_email: respondentEmail,
    payload,
    source: src,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
