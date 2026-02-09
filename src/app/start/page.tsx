// src/app/start/page.tsx
import { redirect } from "next/navigation";
import { supabaseService } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Mode = "mvp" | "demo";

function asText(v: unknown) {
  return typeof v === "string" ? v.trim() : "";
}

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  const mode = (asText(sp.mode) as Mode) || "mvp";
  const pack = asText(sp.pack) || "tmf_mvp12_v2";

  const supabase = supabaseService();

  // Backend decide. Frontend solo sigue.
  if (mode === "demo") {
    const { data, error } = await supabase.rpc("dts_assessment_get_demo_v1", {
      p_pack: pack,
    });

    if (error || !data) {
      // Si falla, volvemos a Home con error visible en query (simple, sin romper)
      redirect(`/?err=demo_not_found&pack=${encodeURIComponent(pack)}`);
    }

    const assessmentId = String(data);
    redirect(
      `/diagnostico-full?assessmentId=${encodeURIComponent(
        assessmentId
      )}&readonly=true`
    );
  }

  // mode === "mvp"
  const { data, error } = await supabase.rpc("dts_assessment_resume_or_create_v1", {
    p_pack: pack,
  });

  if (error || !data) {
    redirect(`/?err=mvp_start_failed&pack=${encodeURIComponent(pack)}`);
  }

  const assessmentId = String(data);
  redirect(
    `/diagnostico-full?assessmentId=${encodeURIComponent(
      assessmentId
    )}&pack=${encodeURIComponent(pack)}`
  );
}
