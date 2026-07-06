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

  // ─── M3: PUERTA C CERRADA (mode=mvp) ───────────────────────────────
  // Cierre de las puertas A/C CONFIRMADO (STOP-1 resuelto). La creación nueva
  // de diagnósticos pasa por la PUERTA B (funnel data-driven → gapply_v23).
  // Redirección = TEXTO PROVISIONAL — pendiente de papeleta-UI.
  // NOTA: mode=demo (lectura de demo precargada, arriba) se CONSERVA: su cierre
  // quedó firmado como "a decidir en mesa" y no es "creación nueva".
  redirect(`/dts?from=start_mvp_closed`);
}
