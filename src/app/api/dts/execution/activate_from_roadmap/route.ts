// src/app/api/dts/execution/activate_from_roadmap/route.ts
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toInt(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}

type QuadrantKey = "quick_win" | "transformational" | "foundation" | "maintenance";
type PhaseKey = "0-1" | "1-2" | "2-4";
type WaveKey = "now" | "next" | "later";

function quadrantOf(impact: number, effort: number): QuadrantKey {
  const HIGH_IMPACT = impact >= 3;
  const LOW_EFFORT = effort <= 2;

  if (HIGH_IMPACT && LOW_EFFORT) return "quick_win";
  if (HIGH_IMPACT && !LOW_EFFORT) return "transformational";
  if (!HIGH_IMPACT && !LOW_EFFORT) return "foundation";
  return "maintenance";
}

// Quick wins -> 0-1, Transformational -> 1-2, Foundation/Maintenance fuera del roadmap inicial
function phaseFor(quadrant: QuadrantKey): PhaseKey | null {
  if (quadrant === "quick_win") return "0-1";
  if (quadrant === "transformational") return "1-2";
  return null;
}

function waveForPhase(phase: PhaseKey): WaveKey {
  if (phase === "0-1") return "now";
  if (phase === "1-2") return "next";
  return "later";
}

function pushWithSpill(
  buckets: Record<PhaseKey, any[]>,
  maxPerPhase: number,
  target: PhaseKey,
  item: any
) {
  if (buckets[target].length < maxPerPhase) {
    buckets[target].push(item);
    return;
  }
  // Spill: 0-1 -> 1-2 -> 2-4
  if (target === "0-1") return pushWithSpill(buckets, maxPerPhase, "1-2", item);
  if (target === "1-2") return pushWithSpill(buckets, maxPerPhase, "2-4", item);
  // 2-4 lleno: fuera
}

export async function POST(req: Request) {
  const requestId = `activate_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  try {
    const supabase = supabaseService();

    const body = await req.json().catch(() => ({}));

    const assessmentId = String(body?.assessmentId || "").trim();
    if (!assessmentId || !isUuid(assessmentId)) {
      return NextResponse.json(
        { ok: false, requestId, error: "assessmentId inválido (UUID requerido)" },
        { status: 400 }
      );
    }

    const onlyShortlist = body?.onlyShortlist === true;
    const useOverrides = body?.useOverrides !== false; // default true
    const maxPerPhase = clamp(toInt(body?.maxPerPhase, 4), 2, 6);

    // Si true: activa solo ola NOW (status=active) y deja el resto sin crear.
    const activateOnlyNow = body?.activateOnlyNow === true;

    // 1) Validar assessment existe y leer pack (por consistencia y debugging)
    const { data: assessment, error: aErr } = await supabase
      .from("dts_assessments")
      .select("id, pack")
      .eq("id", assessmentId)
      .single();

    if (aErr || !assessment) {
      return NextResponse.json(
        { ok: false, requestId, error: "Assessment no encontrado", details: aErr?.message ?? null },
        { status: 404 }
      );
    }

    // 2) Traer programas canónicos desde RPC (misma fuente que roadmap)
    const { data: rpcData, error: rpcErr } = await supabase.rpc("dts_results_programs_v2", {
      p_assessment_id: assessmentId,
      p_only_shortlist: onlyShortlist,
      p_use_overrides: useOverrides,
    });

    if (rpcErr) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "RPC dts_results_programs_v2 falló",
          details: rpcErr.message,
        },
        { status: 500 }
      );
    }

    const rows = Array.isArray(rpcData) ? rpcData : [];

    // 3) Rank + quadrant + phase + bucket por capacidad (idéntico espíritu a /results/roadmap)
    const ranked = rows
      .map((p: any) => {
        const impact = clamp(toInt(p.impact_score, 1), 1, 5);
        const effort = clamp(toInt(p.effort_score, 1), 1, 5);
        const q: QuadrantKey = (p?.quadrant as QuadrantKey) || quadrantOf(impact, effort);
        const phase = phaseFor(q);

        return {
          rank: clamp(toInt(p.rank, 999), 1, 999),
          program_id: String(p.program_id ?? ""),
          program_code: String(p.program_code ?? ""),
          title: String(p.title ?? ""),
          impact_score: impact,
          effort_score: effort,
          quadrant: q,
          phase,
        };
      })
      .filter((x: any) => x.program_id && x.program_code && x.title) // mínimos de integridad
      .sort((a: any, b: any) => a.rank - b.rank);

    const buckets: Record<PhaseKey, any[]> = { "0-1": [], "1-2": [], "2-4": [] };

    for (const it of ranked) {
      if (!it.phase) continue; // foundation/maintenance fuera del roadmap inicial
      pushWithSpill(buckets, maxPerPhase, it.phase, it);
    }

    const included: Array<any & { phase: PhaseKey }> = [];
    (["0-1", "1-2", "2-4"] as PhaseKey[]).forEach((ph) => {
      for (const it of buckets[ph]) included.push({ ...it, phase: ph });
    });

    const includedFinal = activateOnlyNow
      ? included.filter((x) => waveForPhase(x.phase) === "now")
      : included;

    if (includedFinal.length === 0) {
      return NextResponse.json({
        ok: true,
        requestId,
        assessment_id: assessmentId,
        pack: assessment.pack,
        created_program_instances: 0,
        hint: activateOnlyNow
          ? "No hay programas en ola NOW para activar con los filtros actuales."
          : "No hay programas elegibles para activar con los filtros actuales.",
      });
    }

    // 4) Upsert program_instances (idempotente) - requiere unique (assessment_id, program_id)
    const programInserts = includedFinal.map((p: any) => {
      const wave = waveForPhase(p.phase);
      const status = wave === "now" ? "active" : "planned";

      return {
        assessment_id: assessmentId,
        program_id: p.program_id,
        program_code: p.program_code,
        title: p.title,
        rank: p.rank,
        impact_score: p.impact_score,
        effort_score: p.effort_score,
        wave,
        status,
        owner_role: null,
        target_date: null,
        blocker_note: null,
      };
    });

    const { data: upserted, error: upErr } = await supabase
      .from("dts_program_instances")
      .upsert(programInserts, { onConflict: "assessment_id,program_id" })
      .select("id, program_id, program_code, title, wave, status, rank");

    if (upErr) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "Upsert dts_program_instances falló",
          details: upErr.message,
          hint:
            "Asegúrate de tener UNIQUE(assessment_id, program_id) y que la tabla exista.",
        },
        { status: 500 }
      );
    }

    const instances = Array.isArray(upserted) ? upserted : [];

    // 5) Insertar acciones base SOLO si el programa no tiene acciones aún (MVP)
    // Acciones genéricas CEO-friendly (no inventamos catálogo, solo scaffolding mínimo).
    const actionTemplate = [
      { position: 10, title: "Definir responsable y alcance del programa" },
      { position: 20, title: "Kickoff y plan de 30 días (hitos y responsables)" },
      { position: 30, title: "Definir KPIs y evidencias para cerrar el programa" },
    ];

    // Leer acciones existentes para evitar duplicados
    const programInstanceIds = instances.map((x: any) => x.id);
    const { data: existingActions, error: eaErr } = await supabase
      .from("dts_action_instances")
      .select("id, program_instance_id")
      .in("program_instance_id", programInstanceIds);

    if (eaErr) {
      return NextResponse.json(
        {
          ok: false,
          requestId,
          error: "No se pudieron leer acciones existentes",
          details: eaErr.message,
        },
        { status: 500 }
      );
    }

    const existingByPid = new Set<string>(
      (Array.isArray(existingActions) ? existingActions : []).map(
        (a: any) => String(a.program_instance_id)
      )
    );

    const actionInserts: any[] = [];
    for (const inst of instances) {
      if (existingByPid.has(inst.id)) continue; // ya tiene acciones
      for (const t of actionTemplate) {
        actionInserts.push({
          program_instance_id: inst.id,
          title: t.title,
          status: "todo",
          position: t.position,
          owner_role: null,
          target_date: null,
          evidence_note: null,
        });
      }
    }

    let createdActions = 0;
    if (actionInserts.length > 0) {
      const { error: insErr, data: insData } = await supabase
        .from("dts_action_instances")
        .insert(actionInserts)
        .select("id");

      if (insErr) {
        return NextResponse.json(
          {
            ok: false,
            requestId,
            error: "Insert dts_action_instances falló",
            details: insErr.message,
          },
          { status: 500 }
        );
      }
      createdActions = Array.isArray(insData) ? insData.length : 0;
    }

    return NextResponse.json({
      ok: true,
      requestId,
      assessment_id: assessmentId,
      pack: assessment.pack,
      maxPerPhase,
      onlyShortlist,
      useOverrides,
      activateOnlyNow,
      created_program_instances: instances.length,
      created_action_instances: createdActions,
      program_instances: instances,
      hint:
        "Programas activados. Ahora /results/seguimiento debería devolver has_tracking=true.",
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: err?.message || "Unknown error",
        hint: "Unhandled server error in activate_from_roadmap",
      },
      { status: 500 }
    );
  }
}
