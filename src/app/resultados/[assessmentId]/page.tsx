// src/app/resultados/[assessmentId]/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { headers } from "next/headers";
import ExecutiveScorePanel from "@/components/resultados/ExecutiveScorePanel";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

/* ============================
   Results V1 (cobertura)
   ============================ */
type ResultsV1 = {
  assessment_id: string;
  pack: string;
  totals: {
    total_criteria: number;
    answered_criteria: number;
    completion_rate: number;
  };
  by_dimension: Array<{
    dimension_id: string;
    dimension_code: string;
    dimension_name: string;
    total_criteria: number;
    answered_criteria: number;
  }>;
  by_subdimension: Array<{
    dimension_code: string;
    subdimension_id: string;
    subdimension_code: string;
    subdimension_name: string;
    total_criteria: number;
    answered_criteria: number;
  }>;
};

type StatusKind = "na" | "complete" | "partial" | "pending";

function statusKind(answered: number, total: number): StatusKind {
  if (total <= 0) return "na";
  if (answered >= total) return "complete";
  if (answered > 0) return "partial";
  return "pending";
}

function StatusIcon({ kind }: { kind: StatusKind }) {
  if (kind === "complete") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700"
        aria-label="Completo"
        title="Completo"
      >
        ✓
      </span>
    );
  }
  if (kind === "partial") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-700"
        aria-label="Parcial"
        title="Parcial"
      >
        !
      </span>
    );
  }
  if (kind === "pending") {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600"
        aria-label="Pendiente"
        title="Pendiente"
      >
        ⏳
      </span>
    );
  }
  return (
    <span
      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-500"
      aria-label="N/A"
      title="N/A"
    >
      —
    </span>
  );
}

function CompletionBadge({ completed }: { completed: boolean }) {
  if (completed) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-800">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white">
          ✓
        </span>
        Diagnóstico listo
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-600 text-white">
        ⏳
      </span>
      Diagnóstico en curso
    </div>
  );
}

async function getBaseUrl() {
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ||
    h.get("host") ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ||
    "localhost:3000";

  const proto = h.get("x-forwarded-proto") || "http";
  return `${proto}://${host}`;
}

async function fetchResultsV1(assessmentId: string): Promise<ResultsV1> {
  const baseUrl = await getBaseUrl();
  const url = new URL("/api/dts/results/v1", baseUrl);
  url.searchParams.set("assessmentId", assessmentId);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Results API error ${res.status}: ${text}`);
  }
  return res.json();
}

/* ============================
   SCORE (server fetch)
   ============================ */
type ScoreGetResponse = {
  ok: boolean;
  assessmentScore: any | null;
  dimensionScores: any[];
};

async function fetchScore(
  assessmentId: string
): Promise<ScoreGetResponse | null> {
  const baseUrl = await getBaseUrl();
  const url = new URL("/api/dts/score/get", baseUrl);
  url.searchParams.set("assessmentId", assessmentId);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

/* ============================
   DIMENSIONS META (server fetch)
   ============================ */
type DimensionsMetaResponse = {
  ok: boolean;
  items: Array<{
    dimension_id: string;
    dimension_code: string;
    dimension_name: string;
  }>;
};

async function fetchDimensionsMeta(): Promise<DimensionsMetaResponse | null> {
  const baseUrl = await getBaseUrl();
  const url = new URL("/api/dts/meta/dimensions", baseUrl);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

/* ============================
   🔴 FRENOS (server fetch)
   ============================ */
type FrenoItem = {
  rank: number;
  criteria_code: string;
  title: string;
  plain_impact: string;
  symptom: string;
  suggested_action: string;
  impact_score: number;
  effort_score: number;
  note?: string;
};

type FrenosResponse = {
  assessment_id: string;
  pack: string;
  assessment_type?: string;
  count: number;
  items: FrenoItem[];
  disclaimer?: string;
};

async function fetchFrenos(
  assessmentId: string,
  limit: number = 12
): Promise<FrenosResponse | null> {
  const baseUrl = await getBaseUrl();
  const url = new URL("/api/dts/results/frenos", baseUrl);
  url.searchParams.set("assessmentId", assessmentId);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

/* ============================
   🔵 PRIORIZACIÓN (server fetch)
   ============================ */
type PriorityItem = {
  rank: number;
  criteria_code: string;
  title: string;
  plain_impact: string;
  gap_levels: number;
  importance: number;
  priority?: number;
  band?: "high" | "medium" | "low";
};

type PriorizacionResponse = {
  assessment_id: string;
  pack: string;
  count: number;
  items: PriorityItem[];
  disclaimer?: string;
};

async function fetchPriorizacion(
  assessmentId: string,
  limit: number = 12
): Promise<PriorizacionResponse | null> {
  const baseUrl = await getBaseUrl();
  const url = new URL("/api/dts/results/priorizacion", baseUrl);
  url.searchParams.set("assessmentId", assessmentId);
  url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

/* ============================
   UI
   ============================ */
const FRENOS = {
  MAIN: "#DC2626",
  BG: "#FEF2F2",
  BORDER: "#FCA5A5",
  TEXT: "#7F1D1D",
};

type TabKey = "overview" | "frenos" | "priorizacion";

function normalizeTab(v: any): TabKey {
  const raw = (v || "").toString().toLowerCase().trim();
  if (raw === "frenos") return "frenos";
  if (raw === "priorizacion") return "priorizacion";
  return "overview";
}

function TabLink({
  assessmentId,
  tab,
  active,
  label,
}: {
  assessmentId: string;
  tab: TabKey;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={`/resultados/${assessmentId}?tab=${tab}`}
      className={[
        "px-4 py-1.5 rounded-full border text-sm transition",
        active
          ? "border-slate-300 bg-white text-slate-900 shadow-sm"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-white",
      ].join(" ")}
    >
      {label}
    </Link>
  );
}

function ResultsTopBar({
  assessmentId,
  pack,
  activeTab,
}: {
  assessmentId: string;
  pack: string;
  activeTab: TabKey;
}) {
  const ctaHref =
    activeTab === "frenos"
      ? `/resultados/${assessmentId}/cierre`
      : `/resultados/${assessmentId}?tab=frenos`;

  const ctaLabel =
    activeTab === "frenos" ? "Finalizar diagnóstico" : "Siguiente: Frenos";

  const ctaTitle =
    activeTab === "frenos"
      ? "Cerrar diagnóstico y pasar al siguiente bloque"
      : "Siguiente paso recomendado: revisar frenos";

  return (
    <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-100">
      <div className="py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* ✅ FIX: volver SIEMPRE al diagnóstico del assessmentId */}
          <Link
            href={`/diagnostico-full?assessmentId=${assessmentId}`}
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Volver al diagnóstico
          </Link>

          <div className="h-4 w-px bg-slate-200" />

          <div>
            <div className="text-base font-semibold text-slate-900">
              Resultado Ejecutivo
            </div>
            <div className="text-sm text-slate-500">
              Qué te está frenando hoy y dónde concentrar la atención primero
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs px-2 py-1 rounded-full border border-slate-200 text-slate-600">
            Pack: <span className="font-mono">{pack}</span>
          </span>
          <span className="text-xs px-2 py-1 rounded-full border border-slate-200 text-slate-600">
            {assessmentId.slice(0, 8)}…
          </span>
        </div>
      </div>

      <div className="pb-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <TabLink
            assessmentId={assessmentId}
            tab="overview"
            active={activeTab === "overview"}
            label="Visión general"
          />
          <TabLink
            assessmentId={assessmentId}
            tab="frenos"
            active={activeTab === "frenos"}
            label="Frenos"
          />
          <TabLink
            assessmentId={assessmentId}
            tab="priorizacion"
            active={activeTab === "priorizacion"}
            label="Priorización"
          />
        </div>

        <Link
          href={ctaHref}
          title={ctaTitle}
          className={[
            "text-sm px-4 py-2 rounded-xl border font-medium transition",
            activeTab === "frenos"
              ? "border-slate-900 bg-slate-900 text-white hover:bg-slate-800"
              : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
          ].join(" ")}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

function BlockerCard({ b }: { b: FrenoItem }) {
  return (
    <div
      className="rounded-2xl border p-4 shadow-sm"
      style={{ background: FRENOS.BG, borderColor: FRENOS.BORDER }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-xs font-semibold px-2 py-1 rounded-full border bg-white shrink-0"
            style={{ borderColor: FRENOS.BORDER, color: FRENOS.TEXT }}
            title="Código TMF"
          >
            {b.criteria_code}
          </span>
          <span
            className="text-sm font-semibold truncate"
            style={{ color: FRENOS.TEXT }}
            title={b.title}
          >
            {b.title}
          </span>
        </div>
        <span className="text-xs text-slate-500 shrink-0">#{b.rank}</span>
      </div>

      <div className="mt-3 grid gap-2">
        <div className="text-sm" style={{ color: FRENOS.TEXT }}>
          <span className="font-semibold">Impacto en negocio: </span>
          {b.plain_impact || "—"}
        </div>
        <div className="text-sm text-slate-700">
          <span className="font-semibold">Síntoma típico: </span>
          {b.symptom || "—"}
        </div>
        <div className="text-sm text-slate-700">
          <span className="font-semibold">Acción sugerida: </span>
          {b.suggested_action || "—"}
        </div>
      </div>
    </div>
  );
}

function PriorityBand({
  title,
  subtitle,
  items,
}: {
  title: string;
  subtitle?: string;
  items: PriorityItem[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        {subtitle ? (
          <div className="text-xs text-slate-500 mt-1">{subtitle}</div>
        ) : null}
      </div>

      <div className="divide-y divide-slate-100">
        {items.map((it) => (
          <div key={`${it.criteria_code}-${it.rank}`} className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-500">#{it.rank}</span>
                <span className="text-xs px-2 py-1 rounded-full border border-slate-200 text-slate-600 font-mono">
                  {it.criteria_code}
                </span>
              </div>
            </div>

            <div className="mt-2 text-sm font-semibold text-slate-900">
              {it.title}
            </div>

            <div className="mt-2 text-sm text-slate-700">
              <span className="font-semibold">Impacto negocio: </span>
              {it.plain_impact || "—"}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {typeof it.gap_levels === "number" && it.gap_levels > 0 ? (
                <span className="text-xs px-2 py-1 rounded-full border border-slate-200 text-slate-600">
                  Gap: +{it.gap_levels}
                </span>
              ) : null}
              {typeof it.importance === "number" && it.importance > 0 ? (
                <span className="text-xs px-2 py-1 rounded-full border border-slate-200 text-slate-600">
                  Importancia: {it.importance}/5
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================
   PAGE
   ============================ */
export default async function ResultadosPage({
  params,
  searchParams,
}: {
  params: Promise<{ assessmentId: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { assessmentId } = await params;

  if (!assessmentId || !isUuid(assessmentId)) {
    return (
      <div className="py-8">
        <h1 className="text-2xl font-semibold">Resultado Ejecutivo</h1>
        <p className="mt-2 text-sm text-slate-600">
          No se ha encontrado un identificador válido para este diagnóstico.
        </p>
      </div>
    );
  }

  const sp = (await searchParams) || {};
  const activeTab = normalizeTab(sp.tab);
  const isOverview = activeTab === "overview";

  let data: ResultsV1 | null = null;
  let errorMsg: string | null = null;

  try {
    data = await fetchResultsV1(assessmentId);
  } catch (e: any) {
    errorMsg = e?.message || "Error inesperado cargando resultados.";
  }

  if (errorMsg || !data) {
    return (
      <div className="py-8">
        <h1 className="text-2xl font-semibold">Resultado Ejecutivo</h1>
        <p className="mt-2 text-sm text-red-600">
          {errorMsg ?? "No hay datos disponibles."}
        </p>
      </div>
    );
  }

  const total = data.totals.total_criteria ?? 0;
  const evaluated = data.totals.answered_criteria ?? 0;
  const completionPct = Math.round(
    ((data.totals.completion_rate ?? 0) * 100) as number
  );
  const completed = total > 0 && evaluated >= total;

  // ✅ Solo cargamos lo que se va a mostrar (y en overview, Top 3)
  const frenosResp = activeTab === "frenos" ? await fetchFrenos(assessmentId, 12) : null;

  const priorResp =
    activeTab === "priorizacion" ? await fetchPriorizacion(assessmentId, 12) : null;

  const topFrenosResp = isOverview ? await fetchFrenos(assessmentId, 3) : null;
  const topPriorResp = isOverview ? await fetchPriorizacion(assessmentId, 3) : null;

  const scoreResp = isOverview ? await fetchScore(assessmentId) : null;
  const dimsMetaResp = isOverview ? await fetchDimensionsMeta() : null;

  const frenosItems = (frenosResp?.items || []) as FrenoItem[];
  const priorItems = (priorResp?.items || []) as PriorityItem[];

  const topFrenos = (topFrenosResp?.items || []) as FrenoItem[];
  const topPrior = (topPriorResp?.items || []) as PriorityItem[];

  const high = priorItems.filter((x) => x.band === "high");
  const medium = priorItems.filter((x) => x.band === "medium");
  const low = priorItems.filter((x) => x.band === "low");

  return (
    <div className="min-h-screen bg-slate-50">
      <ResultsTopBar
        assessmentId={assessmentId}
        pack={data.pack}
        activeTab={activeTab}
      />

      <div className="py-8">
        {activeTab === "overview" ? (
          <div className="space-y-6">
            {/* ✅ SCORE PANEL arriba, antes de cobertura */}
            <ExecutiveScorePanel
              assessmentScore={scoreResp?.assessmentScore ?? null}
              dimensionScores={scoreResp?.dimensionScores ?? []}
              dimensionsMeta={dimsMetaResp?.items ?? []}
            />

            {/* ✅ Executive one-pager: Top 3 + link Ver todos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Top Frenos */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Top 3 frenos
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Lo que más está bloqueando hoy
                    </div>
                  </div>

                  <Link
                    href={`/resultados/${assessmentId}?tab=frenos`}
                    className="text-sm font-medium text-[#2563eb] hover:underline shrink-0"
                  >
                    Ver todos →
                  </Link>
                </div>

                <div className="px-4 py-3">
                  {topFrenos.length === 0 ? (
                    <div className="text-sm text-slate-600">
                      No hay frenos destacados con los datos actuales.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topFrenos.map((b) => (
                        <div
                          key={`${b.criteria_code}-${b.rank}`}
                          className="flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 font-mono">
                                {b.criteria_code}
                              </span>
                              <span className="text-sm font-semibold text-slate-900 truncate">
                                {b.title}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-slate-600 line-clamp-2">
                              {b.plain_impact || b.symptom || "—"}
                            </div>
                          </div>
                          <span className="text-xs text-slate-500 shrink-0">
                            #{b.rank}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Top Priorización */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      Top 3 prioridades
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Dónde concentrar la atención primero
                    </div>
                  </div>

                  <Link
                    href={`/resultados/${assessmentId}?tab=priorizacion`}
                    className="text-sm font-medium text-[#2563eb] hover:underline shrink-0"
                  >
                    Ver todos →
                  </Link>
                </div>

                <div className="px-4 py-3">
                  {topPrior.length === 0 ? (
                    <div className="text-sm text-slate-600">
                      No hay prioridades relevantes con los datos actuales.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topPrior.map((it) => (
                        <div
                          key={`${it.criteria_code}-${it.rank}`}
                          className="flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600 font-mono">
                                {it.criteria_code}
                              </span>
                              <span className="text-sm font-semibold text-slate-900 truncate">
                                {it.title}
                              </span>
                            </div>

                            <div className="mt-1 flex flex-wrap gap-2">
                              {typeof it.gap_levels === "number" &&
                              it.gap_levels > 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                                  Gap: +{it.gap_levels}
                                </span>
                              ) : null}
                              {typeof it.importance === "number" &&
                              it.importance > 0 ? (
                                <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                                  Importancia: {it.importance}/5
                                </span>
                              ) : null}
                              {it.band ? (
                                <span className="text-xs px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                                  Banda: {it.band}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <span className="text-xs text-slate-500 shrink-0">
                            #{it.rank}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Visión general del diagnóstico
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Qué hemos evaluado y con qué cobertura
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-slate-600">Áreas evaluadas</div>
                <div className="mt-1 text-2xl font-semibold">{total}</div>
                <div className="mt-1 text-xs text-slate-500">
                  Aspectos clave analizados en total
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-slate-600">Estado</div>
                <div className="mt-2">
                  <CompletionBadge completed={completed} />
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {completed ? "Listo para conclusiones" : "Aún faltan respuestas"}
                </div>
              </div>

              <div className="rounded-xl border bg-white p-4">
                <div className="text-sm text-slate-600">Cobertura</div>
                <div className="mt-1 text-2xl font-semibold">{completionPct}%</div>
                <div className="mt-1 text-xs text-slate-500">
                  Porcentaje del diagnóstico ya evaluado
                </div>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <h3 className="text-lg font-semibold">
                Cobertura por áreas del negocio
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                “Evaluados” significa cuántos aspectos del diagnóstico se han
                analizado (no es una nota ni una puntuación).
              </p>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-600">
                    <tr className="border-b">
                      <th className="py-2 pr-4">Área</th>
                      <th className="py-2 pr-4">Nombre</th>
                      <th className="py-2 pr-4">Aspectos clave</th>
                      <th className="py-2 pr-4">Evaluados</th>
                      <th className="py-2 pr-0 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_dimension.map((d) => {
                      const kind = statusKind(
                        d.answered_criteria,
                        d.total_criteria
                      );
                      return (
                        <tr key={d.dimension_id} className="border-b">
                          <td className="py-2 pr-4 font-mono">
                            {d.dimension_code}
                          </td>
                          <td className="py-2 pr-4">{d.dimension_name}</td>
                          <td className="py-2 pr-4">{d.total_criteria}</td>
                          <td className="py-2 pr-4">{d.answered_criteria}</td>
                          <td className="py-2 pr-0 text-right">
                            <StatusIcon kind={kind} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4">
              <h3 className="text-lg font-semibold">Detalle por subárea</h3>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-slate-600">
                    <tr className="border-b">
                      <th className="py-2 pr-4">Área</th>
                      <th className="py-2 pr-4">Subárea</th>
                      <th className="py-2 pr-4">Tema</th>
                      <th className="py-2 pr-4">Aspectos</th>
                      <th className="py-2 pr-4">Evaluados</th>
                      <th className="py-2 pr-0 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.by_subdimension.map((s) => {
                      const kind = statusKind(
                        s.answered_criteria,
                        s.total_criteria
                      );
                      return (
                        <tr key={s.subdimension_id} className="border-b">
                          <td className="py-2 pr-4 font-mono">{s.dimension_code}</td>
                          <td className="py-2 pr-4 font-mono">
                            {s.subdimension_code}
                          </td>
                          <td className="py-2 pr-4">{s.subdimension_name}</td>
                          <td className="py-2 pr-4">{s.total_criteria}</td>
                          <td className="py-2 pr-4">{s.answered_criteria}</td>
                          <td className="py-2 pr-0 text-right">
                            <StatusIcon kind={kind} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                Nota: esto todavía mide “cobertura”. El siguiente paso es mostrar
                “qué significa” (brechas y foco).
              </p>
            </div>
          </div>
        ) : null}

        {activeTab === "frenos" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Frenos del negocio
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Qué te está frenando ahora mismo
              </p>
            </div>

            {frenosResp?.disclaimer ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">Nota (MVP)</div>
                <div className="mt-1">{frenosResp.disclaimer}</div>
              </div>
            ) : null}

            {!frenosResp ? (
              <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
                No se han podido cargar los frenos (endpoint no disponible).
              </div>
            ) : frenosItems.length === 0 ? (
              <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
                No se han detectado frenos relevantes (no hay brechas críticas).
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {frenosItems.map((b) => (
                  <BlockerCard key={`${b.criteria_code}-${b.rank}`} b={b} />
                ))}
              </div>
            )}
          </div>
        ) : null}

        {activeTab === "priorizacion" ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Priorización inicial
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Criterios del diagnóstico ordenados por criticidad para el
                negocio
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-4 text-sm text-slate-700">
              Esta priorización se basa en el tamaño del gap y la importancia
              para el negocio.
              <br />
              No son aún acciones, sino áreas donde concentrar la atención.
            </div>

            {priorResp?.disclaimer ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <div className="font-semibold">Nota (MVP)</div>
                <div className="mt-1">{priorResp.disclaimer}</div>
              </div>
            ) : null}

            {!priorResp ? (
              <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
                Falta el endpoint de priorización o no responde. Cuando exista{" "}
                <span className="font-mono">/api/dts/results/priorizacion</span>,
                aparecerá aquí.
              </div>
            ) : priorItems.length === 0 ? (
              <div className="rounded-xl border bg-white p-4 text-sm text-slate-600">
                No hay criterios con brecha relevante para priorizar.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <PriorityBand
                  title="PRIORIDAD ALTA"
                  subtitle="(Atender primero)"
                  items={high}
                />
                <PriorityBand title="PRIORIDAD MEDIA" items={medium} />
                <PriorityBand title="PRIORIDAD BAJA" items={low} />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
