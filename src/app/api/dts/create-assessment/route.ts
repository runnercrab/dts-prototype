import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const sb = createClient(url, key, { auth: { persistSession: false } });

  // Pack del funnel data-driven: exactamente una fila de dts_packs debe tener
  // is_funnel_default = true. Fail-closed en error / 0 filas / >1 filas.
  const { data: packs, error: packErr } = await sb
    .from("dts_packs")
    .select("id")
    .eq("is_funnel_default", true);

  if (packErr) {
    console.error("[create-assessment] config_lookup_failed:", packErr.message);
    return NextResponse.json({ error: "config_lookup_failed" }, { status: 500 });
  }
  if (!packs || packs.length === 0) {
    console.error("[create-assessment] no_funnel_default_pack: 0 filas con is_funnel_default=true en dts_packs");
    return NextResponse.json({ error: "no_funnel_default_pack" }, { status: 500 });
  }
  if (packs.length > 1) {
    console.error("[create-assessment] multiple_funnel_default_packs:", packs.map((p) => p.id));
    return NextResponse.json({ error: "multiple_funnel_default_packs" }, { status: 500 });
  }

  const { data, error } = await sb.rpc("dts_v1_create_assessment", {
    p_pack_key: packs[0].id,
    p_organization_id: null,
    p_is_demo: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ assessmentId: data });
}
