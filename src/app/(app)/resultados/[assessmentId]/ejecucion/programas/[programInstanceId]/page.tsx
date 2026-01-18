// src/app/(app)/resultados/[assessmentId]/ejecucion/programas/[programInstanceId]/page.tsx
import Link from "next/link";
import { headers } from "next/headers";

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

type SeguimientoResponse = {
  ok: boolean;
  assessment_id: string;
  pack: string;
  has_tracking: boolean;
  status_overall?: "blocked" | "in_progress" | "completed" | "not_started";
  active_programs?: ProgramItem[];
  planned_programs?: ProgramItem[];
  blocked_programs?: ProgramItem[];
  summary?: {
    total_programs: number;
    active: number;
    blocked: number;
    done: number;
  };
  hint?: string;
  error?: string;
  details?: string;
};

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

function waveBadge(wave: ProgramItem["wave"]) {
  if (wave === "now") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (wave === "next") return "border-amber-200 bg-amber-50 text-amber-900";
  if (wave === "later") return "border-slate-200 bg-slate-50 text-slate-700";
  return "border-slate-200 bg-white text-slate-600";
}

function waveLabel(wave: ProgramItem["wave"]) {
  if (wave === "now") return "Ahora";
  if (wave === "next") return "Siguiente";
  if (wave === "later") return "Después";
  return "—";
}

function getRequestBaseUrl(h: Headers) {
  // Vercel / proxies
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host");

  // Si por lo que sea host viene null, fallback local
  if (!host) return "http://localhost:3000";
  return `${proto}://${host}`;
}

export default async function ProgramaDetallePage({
  params,
}: {
  params: Promise<{ assessmentId: string; programInstanceId: string }>;
}) {
  const { assessmentId, programInstanceId } = await params;

  // ✅ Base URL absoluta (server-safe)
  const h = await headers();
  const baseUrl = getRequestBaseUrl(h);

  // ✅ Nunca fetch relativo en server
  const res = await fetch(
    `${baseUrl}/api/dts/results/seguimiento?assessmentId=${assessmentId}`,
    { cache: "no-store" }
  );

  const data = (await res.json().catch(() => null)) as SeguimientoResponse | null;

  if (!data || data.ok !== true) {
    return (
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">Programa</div>
            <p className="mt-2 text-slate-600">No he podido cargar el seguimiento.</p>
          </div>
          <Link
            href={`/resultados/${assessmentId}/ejecucion/seguimiento`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            ← Volver
          </Link>
        </div>

        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
          <div className="text-sm font-semibold">Error</div>
          <div className="mt-1 text-sm">
            {data?.error ?? "Respuesta inválida"} {data?.details ? `— ${data.details}` : ""}
          </div>
        </div>
      </div>
    );
  }

  if (!data.has_tracking) {
    return (
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">Programa</div>
            <p className="mt-2 text-slate-600">
              Todavía no hay ejecución activada para este assessment.
            </p>
          </div>
          <Link
            href={`/resultados/${assessmentId}/ejecucion/roadmap`}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Ir a Roadmap
          </Link>
        </div>

        {data.hint && <div className="mt-4 text-xs text-slate-500">{data.hint}</div>}
      </div>
    );
  }

  const allPrograms = [
    ...(data.active_programs ?? []),
    ...(data.planned_programs ?? []),
    ...(data.blocked_programs ?? []),
  ];

  const p = allPrograms.find((x) => x.program_instance_id === programInstanceId);

  if (!p) {
    return (
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-2xl font-semibold text-slate-900">Programa</div>
            <p className="mt-2 text-slate-600">
              No encuentro este programa en el seguimiento.
            </p>
          </div>
          <Link
            href={`/resultados/${assessmentId}/ejecucion/seguimiento`}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            ← Volver
          </Link>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-slate-700">
          <div className="text-sm font-semibold">Program instance id</div>
          <div className="mt-1 text-sm text-slate-600">{programInstanceId}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1100px]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500">{p.program_code}</span>

            <span className={["text-xs px-2 py-0.5 rounded-full border", waveBadge(p.wave)].join(" ")}>
              {waveLabel(p.wave)}
            </span>

            <span className={["text-xs px-2 py-0.5 rounded-full border", statusBadge(p.status)].join(" ")}>
              {statusLabel(p.status)}
            </span>
          </div>

          <div className="mt-2 text-2xl font-semibold text-slate-900">{p.title}</div>

          <div className="mt-3 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
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

          {(p.owner_role || p.target_date) && (
            <div className="mt-4 text-sm text-slate-700">
              {p.owner_role && (
                <div>
                  <span className="text-slate-500">Owner:</span>{" "}
                  <span className="font-medium">{p.owner_role}</span>
                </div>
              )}
              {p.target_date && (
                <div>
                  <span className="text-slate-500">Fecha objetivo:</span>{" "}
                  <span className="font-medium">{p.target_date}</span>
                </div>
              )}
            </div>
          )}

          {p.blocker_note && (
            <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
              <div className="text-sm font-semibold">Bloqueo</div>
              <div className="mt-1 text-sm">{p.blocker_note}</div>
            </div>
          )}
        </div>

        <Link
          href={`/resultados/${assessmentId}/ejecucion/seguimiento`}
          className="shrink-0 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          ← Volver
        </Link>
      </div>

      <div className="mt-8 grid gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Acciones en curso</div>

          {p.actions_doing?.length ? (
            <ul className="mt-3 space-y-2">
              {p.actions_doing.map((a) => (
                <li key={a.action_instance_id} className="text-sm text-slate-700">
                  • {a.title}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 text-sm text-slate-500">No hay acciones en curso.</div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-slate-900">Próximas acciones</div>

          {p.actions_next?.length ? (
            <ul className="mt-3 space-y-2">
              {p.actions_next.map((a) => (
                <li key={a.action_instance_id} className="text-sm text-slate-700">
                  • {a.title}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-3 text-sm text-slate-500">No hay acciones pendientes.</div>
          )}
        </section>
      </div>
    </div>
  );
}
