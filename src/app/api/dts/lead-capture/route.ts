import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { assessment_id, email, name, type, score } = body;

    if (!email || !assessment_id) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

    if (!url || !key) {
      return NextResponse.json({ error: "Config error" }, { status: 500 });
    }

    const sb = createClient(url, key, { auth: { persistSession: false } });

    const { error } = await sb.from("dts_lead_captures").insert({
      assessment_id,
      email,
      name: name || null,
      capture_type: type || "informe",
      score: score || null,
    });

    if (error) {
      console.error("Lead capture insert error:", error);
      // Don't fail — email fallback will catch it on the client
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("Lead capture error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}