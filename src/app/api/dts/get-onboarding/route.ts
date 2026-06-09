import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Wave 0.A — whitelist outbound de onboarding_data.
// Solo estas keys se devuelven al cliente. Cualquier otra clave persistida
// en el jsonb se filtra antes de salir.
const ALLOWED_ONBOARDING_KEYS = new Set([
  "name",
  "companyName",
  "industry",
  "sector",
  "size",
  "companySize",
  "country",
  "role",
]);

function sanitizeOnboardingData(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const key of ALLOWED_ONBOARDING_KEYS) {
    if (Object.prototype.hasOwnProperty.call(input, key)) {
      output[key] = input[key];
    }
  }

  return Object.keys(output).length > 0 ? output : null;
}

export async function GET(req: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return NextResponse.json({ error: "Missing env" }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const assessmentId = searchParams.get("assessmentId");
  if (!assessmentId) return NextResponse.json({ error: "Missing assessmentId" }, { status: 400 });

  const sb = createClient(url, key, { auth: { persistSession: false } });

  const { data, error } = await sb
    .from("dts_assessments")
    .select("onboarding_data")
    .eq("id", assessmentId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ onboarding_data: sanitizeOnboardingData(data?.onboarding_data) });
}
