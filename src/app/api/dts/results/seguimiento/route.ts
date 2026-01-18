// src/app/api/dts/results/seguimiento/route.ts
import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function normalizeUuid(raw: string) {
  const s = (raw || "").trim();
  const noTrailingSlashes = s.replace(/\/+$/g, "");
  const firstToken = noTrailingSlashes.split(/[?#&\s]/)[0];
  return firstToken;
}

type ActionItem = {
  action_instance_id: string;
  title: string;
  status: "todo" | "doing" | "done";
  position: number;
  owner_role: string | null;
  target_date: string | null;
};

type ProgramItem = {
  program_instance_id: string;
  program_id: string;
  program_code: string;
  title: string;
  rank: number;
  impact_score: number;
  effort_score: number;
  wave: "now" | "next" | "later" | null;
  status: "planned" | "active" | "paused" | "blocked" | "done";
  owner_role: string | null;
  target_date: string | null;
  blocker_note: string | null;

  progress_pct: number;
  totals: { total_actions: number; done_actions: number; doing_actions: number };

  actions_doing: ActionItem[];
  actions_next: ActionItem[];
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const assessmentIdRaw = searchParams.get("assessmentId") || "";
  const assessmentId = normalizeUuid(assessmentIdRaw);

  if (!assessmentId || !isUuid(assessmentId)) {
    return NextResponse.json(
      {
        ok: false,
        error: "assessmentId inválido (UUID requerido)",
        received: assessmentIdRaw,
        normalized: assessmentId,
      },
      { status: 400 }
    );
  }

  const supabase = supabaseService();

  // 1) Validar assessment existe (y obtener pack para devolverlo)
  const { data: assessment, error: aErr } = await supabase
    .from("dts_assessments")
    .select("id, pack")
    .eq("id", assessmentId)
    .single();

  if (aErr || !assessment) {
    return NextResponse.json(
      {
        ok: false,
        error: "Assessment no encontrado",
        details: aErr?.message ?? null,
      },
      { status: 404 }
    );
  }

  // 2) Program instances del assessment
  // ✅ Incluimos progress_pct (ahora lo mantiene DB via trigger)
  const { data: programs, error: pErr } = await supabase
    .from("dts_program_instances")
    .select(
      "id, assessment_id, program_id, program_code, title, rank, impact_score, effort_score, wave, status, owner_role, target_date, blocker_note, progress_pct"
    )
    .eq("assessment_id", assessmentId)
    .order("rank", { ascending: true });

  if (pErr) {
    return NextResponse.json(
      {
        ok: false,
        error: "Error leyendo dts_program_instances",
        details: pErr.message,
      },
      { status: 500 }
    );
  }

  const programRows = Array.isArray(programs) ? programs : [];

  // Si no hay programas activados aún, devolvemos shape estable (UI muestra estado vacío CEO)
  if (programRows.length === 0) {
    return NextResponse.json({
      ok: true,
      assessment_id: assessmentId,
      pack: assessment.pack,
      has_tracking: false,
      active_programs: [],
      planned_programs: [],
      blocked_programs: [],
      summary: {
        total_programs: 0,
        active: 0,
        blocked: 0,
        done: 0,
      },
      hint:
        "Aún no hay programas activados para seguimiento. Activa programas desde Roadmap o Programas.",
    });
  }

  // 3) Actions para esos program_instance_ids (en 1 query)
  const programInstanceIds = programRows.map((p: any) => p.id);

  const { data: actions, error: actErr } = await supabase
    .from("dts_action_instances")
    .select("id, program_instance_id, title, status, position, owner_role, target_date")
    .in("program_instance_id", programInstanceIds)
    .order("position", { ascending: true });

  if (actErr) {
    return NextResponse.json(
      {
        ok: false,
        error: "Error leyendo dts_action_instances",
        details: actErr.message,
      },
      { status: 500 }
    );
  }

  const actionRows = Array.isArray(actions) ? actions : [];

  // Index actions by program_instance_id
  const byProgram: Record<string, any[]> = {};
  for (const a of actionRows) {
    const pid = a.program_instance_id as string;
    if (!byProgram[pid]) byProgram[pid] = [];
    byProgram[pid].push(a);
  }

  function toAction(a: any): ActionItem {
    return {
      action_instance_id: a.id,
      title: a.title,
      status: a.status,
      position: a.position ?? 0,
      owner_role: a.owner_role ?? null,
      target_date: a.target_date ?? null,
    };
  }

  function computeProgram(p: any): ProgramItem {
    const list = (byProgram[p.id] ?? []).map(toAction);

    const total = list.length;
    const done = list.filter((x) => x.status === "done").length;
    const doing = list.filter((x) => x.status === "doing").length;

    // ✅ Progreso oficial desde DB (trigger). Fallback por seguridad.
    const progressPctFromDb =
      typeof p.progress_pct === "number" && Number.isFinite(p.progress_pct)
        ? p.progress_pct
        : null;

    const progressPctFallback =
      total > 0 ? Math.round((done / total) * 100) : 0;

    const progressPct =
      progressPctFromDb !== null ? progressPctFromDb : progressPctFallback;

    const actionsDoing = list.filter((x) => x.status === "doing").slice(0, 5);
    const actionsNext = list.filter((x) => x.status === "todo").slice(0, 5);

    return {
      program_instance_id: p.id,
      program_id: p.program_id,
      program_code: p.program_code,
      title: p.title,
      rank: p.rank ?? 999,
      impact_score: p.impact_score ?? 1,
      effort_score: p.effort_score ?? 1,
      wave: p.wave ?? null,
      status: p.status,
      owner_role: p.owner_role ?? null,
      target_date: p.target_date ?? null,
      blocker_note: p.blocker_note ?? null,

      progress_pct: progressPct,
      totals: { total_actions: total, done_actions: done, doing_actions: doing },

      actions_doing: actionsDoing,
      actions_next: actionsNext,
    };
  }

  const computed = programRows.map(computeProgram);

  const activePrograms = computed.filter((p) => p.status === "active");
  const blockedPrograms = computed.filter((p) => p.status === "blocked");
  const plannedPrograms = computed.filter((p) => p.status === "planned");
  const donePrograms = computed.filter((p) => p.status === "done");

  // Estado general (muy simple)
  const statusOverall =
    blockedPrograms.length > 0
      ? "blocked"
      : activePrograms.length > 0
      ? "in_progress"
      : donePrograms.length > 0
      ? "completed"
      : "not_started";

  return NextResponse.json({
    ok: true,
    assessment_id: assessmentId,
    pack: assessment.pack,
    has_tracking: true,
    status_overall: statusOverall,

    active_programs: activePrograms,
    blocked_programs: blockedPrograms,
    planned_programs: plannedPrograms,

    summary: {
      total_programs: computed.length,
      active: activePrograms.length,
      blocked: blockedPrograms.length,
      done: donePrograms.length,
    },
  });
}
