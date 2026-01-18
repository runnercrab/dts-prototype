// src/app/(app)/resultados/[assessmentId]/ejecucion/seguimiento/page.tsx
import Link from "next/link";
import { supabaseService } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

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

type SeguimientoData = {
  ok: true;
  assessment_id: string;
  pack: string;
  has_tracking: boolean;
  status_overall?: "blocked" | "in_progress" | "completed" | "not_started";
  active_programs?: ProgramItem[];
  planned_programs?: ProgramItem[];
  blocked_programs?: ProgramItem[];
  summary?: { total_programs: number; active: number; blocked: number; done: number };
  hint?: string;
};

type SeguimientoError = {
  ok: false;
  error: string;
  details?: string | null;
};

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function badgeWave(wave: ProgramItem["wave"]) {
  if (wave === "now") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (wave === "next") return "border-amber-200 bg-amber-50 text-amber-900";
  if (wave === "later") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-slate-200 bg-white text-slate-600";
}

function labelWave(wave: ProgramItem["wave"]) {
  if (wave === "now") return "Ahora";
  if (wave === "next") return "Siguiente";
  if (wave === "later") return "Después";
  return "—";
}

function statusBadge(status: ProgramItem["status"]) {
  switch (status) {
    case "active":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "blocked":
      return "border-rose-200 bg-rose-50 text-rose-800";
    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-900";
    case "done":
      return "border-slate-200 bg-slate-100 text-slate-700";
    case "planned":
    default:
      return "border-slate-200 bg-white text-slate-700";
  }
}

function statusLabel(status: ProgramItem["status"]) {
  switch (status) {
    case "active":
      return "En marcha";
    case "blocked":
      return "Bloqueado";
    case "paused":
      return "Pausado";
    case "done":
      return "Cerrado";
    case "planned":
    default:
      return "Planificado";
  }
}

function fmtDate(d: string | null) {
  if (!d) return null;
  return d; // YYYY-MM-DD
}

function ProgramCard({ assessmentId, p }: { assessmentId: string; p: ProgramItem }) {
  const href = `/resultados/${assessmentId}/ejecucion/programas/${p.program_instance_id}`;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-500">{p.program_code}</span>

              <span className={["text-xs px-2 py-0.5 rounded-full border", badgeWave(p.wave)].join(" ")}>
                {labelWave(p.wave)}
              </span>

              <span className={["text-xs px-2 py-0.5 rounded-full border", statusBadge(p.status)].join(" ")}>
                {statusLabel(p.status)}
              </span>
            </div>

            <div className="mt-2 text-base font-semibold text-slate-900 truncate">{p.title}</div>

            <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
              <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                Impacto {p.impact_score}/5
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                Esfuerzo {p.effort_score}/5
              </span>
              <span className="px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                Progreso {p.progress_pct}%
              </span>
              <span className="text-slate-500">
                {p.totals.done_actions}/{p.totals.total_actions} acciones cerradas
              </span>
            </div>

            {(p.owner_role || p.target_date || p.blocker_note) && (
              <div className="mt-3 text-sm text-slate-700">
                {p.owner_role && (
                  <div>
                    <span className="text-slate-500">Owner:</span>{" "}
                    <span className="font-medium">{p.owner_role}</span>
                  </div>
                )}
                {p.target_date && (
                  <div>
                    <span className="text-slate-500">Fecha objetivo:</span>{" "}
                    <span className="font-medium">{fmtDate(p.target_date)}</span>
                  </div>
                )}
                {p.blocker_note && (
                  <div className="mt-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900">
                    <div className="text-xs font-semibold">Bloqueo</div>
                    <div className="text-sm">{p.blocker_note}</div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              <div className="text-xs font-semibold text-slate-500">Próximas acciones</div>

              {p.actions_next?.length ? (
                <ul className="mt-2 space-y-1">
                  {p.actions_next.slice(0, 3).map((a) => (
                    <li key={a.action_instance_id} className="text-sm text-slate-700">
                      • {a.title}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 text-sm text-slate-500">No hay acciones pendientes.</div>
              )}
            </div>
          </div>

          <Link
            href={href}
            className="shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Abrir
          </Link>
        </div>
      </div>
    </div>
  );
}

async function loadSeguimiento(assessmentId: string): Promise<SeguimientoData | SeguimientoError> {
  if (!assessmentId || !isUuid(assessmentId)) {
    return { ok: false, error: "assessmentId inválido (UUID requerido)" };
  }

  const supabase = supabaseService();

  // 1) assessment + pack
  const { data: assessment, error: aErr } = await supabase
    .from("dts_assessments")
    .select("id, pack")
    .eq("id", assessmentId)
    .single();

  if (aErr || !assessment) {
    return { ok: false, error: "Assessment no encontrado", details: aErr?.message ?? null };
  }

  // 2) program instances
  const { data: programs, error: pErr } = await supabase
    .from("dts_program_instances")
    .select("id, assessment_id, program_id, program_code, title, rank, impact_score, effort_score, wave, status, owner_role, target_date, blocker_note")
    .eq("assessment_id", assessmentId)
    .order("rank", { ascending: true });

  if (pErr) {
    return { ok: false, error: "Error leyendo dts_program_instances", details: pErr.message };
  }

  const programRows = Array.isArray(programs) ? programs : [];

  if (programRows.length === 0) {
    return {
      ok: true,
      assessment_id: assessmentId,
      pack: assessment.pack,
      has_tracking: false,
      active_programs: [],
      planned_programs: [],
      blocked_programs: [],
      summary: { total_programs: 0, active: 0, blocked: 0, done: 0 },
      hint: "Aún no hay programas activados para seguimiento. Activa programas desde Roadmap o Programas.",
    };
  }

  // 3) action instances for all program_instance_ids
  const programInstanceIds = programRows.map((p: any) => p.id);

  const { data: actions, error: actErr } = await supabase
    .from("dts_action_instances")
    .select("id, program_instance_id, title, status, position, owner_role, target_date")
    .in("program_instance_id", programInstanceIds)
    .order("position", { ascending: true });

  if (actErr) {
    return { ok: false, error: "Error leyendo dts_action_instances", details: actErr.message };
  }

  const actionRows = Array.isArray(actions) ? actions : [];

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

    const progressPct = total > 0 ? Math.round((done / total) * 100) : 0;

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

  const statusOverall =
    blockedPrograms.length > 0
      ? "blocked"
      : activePrograms.length > 0
      ? "in_progress"
      : donePrograms.length > 0
      ? "completed"
      : "not_started";

  return {
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
  };
}

export default async function SeguimientoPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  const data = await loadSeguimiento(assessmentId);

  if (data.ok !== true) {
    return (
      <div className="max-w-[1100px]">
        <div className="text-2xl font-semibold text-slate-900">Seguimiento</div>
        <p className="mt-2 text-slate-600">No he podido cargar el estado de ejecución.</p>

        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <div className="text-sm font-semibold">Error</div>
          <div className="mt-1 text-sm">
            {data.error} {data.details ? `— ${data.details}` : ""}
          </div>
        </div>
      </div>
    );
  }

  if (!data.has_tracking) {
    return (
      <div className="max-w-[1100px]">
        <div className="text-2xl font-semibold text-slate-900">Seguimiento</div>
        <p className="mt-2 text-slate-600">Todavía no hay un plan de ejecución activado para esta empresa.</p>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">¿Siguiente paso?</div>
          <p className="mt-1 text-sm text-slate-600">
            Activa programas desde Roadmap para convertir recomendaciones en un plan ejecutable con acciones y seguimiento.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <Link
              href={`/resultados/${assessmentId}/ejecucion/roadmap`}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Ir a Roadmap
            </Link>
            <Link
              href={`/resultados/${assessmentId}/ejecucion/programas`}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              Ver Programas
            </Link>
          </div>

          {data.hint && <div className="mt-4 text-xs text-slate-500">{data.hint}</div>}
        </div>
      </div>
    );
  }

  const active = data.active_programs ?? [];
  const planned = data.planned_programs ?? [];
  const blocked = data.blocked_programs ?? [];

  return (
    <div className="max-w-[1100px]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-2xl font-semibold text-slate-900">Seguimiento</div>
          <p className="mt-2 text-slate-600">
            Tu plan ejecutivo en marcha: qué está activo, qué viene después y qué está bloqueado.
          </p>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500">Estado global</div>
          <div className="text-sm font-semibold text-slate-900">
            {data.status_overall === "blocked"
              ? "Bloqueado"
              : data.status_overall === "in_progress"
              ? "En progreso"
              : data.status_overall === "completed"
              ? "Completado"
              : "No iniciado"}
          </div>
          {data.summary && (
            <div className="mt-1 text-xs text-slate-500">
              {data.summary.active} activos · {data.summary.blocked} bloqueados · {data.summary.total_programs} total
            </div>
          )}
        </div>
      </div>

      {blocked.length > 0 && (
        <section className="mt-6">
          <div className="text-sm font-semibold text-slate-900">Bloqueados</div>
          <div className="mt-3 grid gap-4">
            {blocked.map((p) => (
              <ProgramCard key={p.program_instance_id} assessmentId={assessmentId} p={p} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-6">
        <div className="text-sm font-semibold text-slate-900">Ahora</div>
        <div className="mt-3 grid gap-4">
          {active.length ? (
            active.map((p) => <ProgramCard key={p.program_instance_id} assessmentId={assessmentId} p={p} />)
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
              No hay programas activos. Activa alguno desde Roadmap.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="text-sm font-semibold text-slate-900">Siguiente</div>
        <div className="mt-3 grid gap-4">
          {planned.length ? (
            planned
              .filter((p) => p.wave === "next")
              .map((p) => <ProgramCard key={p.program_instance_id} assessmentId={assessmentId} p={p} />)
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
              No hay programas planificados.
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 pb-8">
        <div className="text-sm font-semibold text-slate-900">Después</div>
        <div className="mt-3 grid gap-4">
          {planned.length ? (
            planned
              .filter((p) => p.wave === "later")
              .map((p) => <ProgramCard key={p.program_instance_id} assessmentId={assessmentId} p={p} />)
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-600">
              No hay programas para olas futuras.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
