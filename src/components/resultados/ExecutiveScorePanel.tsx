'use client'

import { useEffect, useMemo, useRef } from 'react'
import { Chart, ChartData } from 'chart.js/auto'

type AssessmentScoreRow = {
  assessment_id: string
  answered_count: number
  total_count: number
  as_is_avg: number | null
  to_be_avg: number | null
  gap_avg: number | null
  weighted_gap_avg: number | null
  updated_at?: string | null
}

type DimensionScoreRow = {
  assessment_id: string
  dimension_id: string
  answered_count: number
  total_count: number
  as_is_avg: number | null
  to_be_avg: number | null
  gap_avg: number | null
  weighted_gap_avg: number | null
  updated_at?: string | null
}

type DimensionMeta = {
  dimension_id: string
  dimension_code: string
  dimension_name: string
}

function to10(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return null
  return Math.round(n * 2 * 10) / 10
}

function fmt1(v: unknown) {
  const n = typeof v === 'number' ? v : Number(v)
  if (!Number.isFinite(n)) return '—'
  return (Math.round(n * 10) / 10).toFixed(1)
}

function formatDateISO(iso?: string | null) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

function MetricCard({
  title,
  value,
  suffix,
  sub,
}: {
  title: string
  value: string
  suffix?: string
  sub?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-600">{title}</div>
      <div className="mt-2 flex items-end gap-1">
        <div className="text-4xl font-semibold text-slate-900 leading-none">
          {value}
        </div>
        {suffix ? <div className="text-sm text-slate-500 pb-1">{suffix}</div> : null}
      </div>
      {sub ? <div className="mt-2 text-sm text-slate-500">{sub}</div> : null}
    </div>
  )
}

function modelScaleSub(modelValue: number | null, meaning: string) {
  if (modelValue == null) return undefined
  return `Escala del modelo (1–5): ${fmt1(modelValue)}/5 · ${meaning}`
}

export default function ExecutiveScorePanel(props: {
  assessmentScore?: AssessmentScoreRow | null
  dimensionScores?: DimensionScoreRow[] | null
  dimensionsMeta?: DimensionMeta[] | null
}) {
  const assessmentScore = props.assessmentScore ?? null
  const safeDimensionScores = Array.isArray(props.dimensionScores) ? props.dimensionScores : []
  const safeMeta = Array.isArray(props.dimensionsMeta) ? props.dimensionsMeta : []

  const orderedMeta = useMemo(() => {
    return [...safeMeta].sort((a, b) =>
      (a.dimension_code || '').localeCompare(b.dimension_code || '')
    )
  }, [safeMeta])

  const labels = useMemo(() => orderedMeta.map((m) => m.dimension_name), [orderedMeta])

  const asIs10 = useMemo(() => {
    return orderedMeta.map((m) => {
      const row = safeDimensionScores.find((x) => x.dimension_id === m.dimension_id)
      return to10(row?.as_is_avg) ?? 0
    })
  }, [orderedMeta, safeDimensionScores])

  const toBe10 = useMemo(() => {
    return orderedMeta.map((m) => {
      const row = safeDimensionScores.find((x) => x.dimension_id === m.dimension_id)
      return to10(row?.to_be_avg) ?? 0
    })
  }, [orderedMeta, safeDimensionScores])

  const updatedAt = assessmentScore?.updated_at ?? safeDimensionScores?.[0]?.updated_at ?? null
  const updatedLabel = formatDateISO(updatedAt)

  const asIsAvg10 = to10(assessmentScore?.as_is_avg)
  const toBeAvg10 = to10(assessmentScore?.to_be_avg)
  const gapAvg10 = to10(assessmentScore?.gap_avg)

  const answered = assessmentScore?.answered_count ?? 0
  const total = assessmentScore?.total_count ?? 0
  const coveragePct = total > 0 ? Math.round((answered / total) * 100) : 0
  const weightedGap = assessmentScore?.weighted_gap_avg

  const canDrawRadar =
    labels.length > 0 &&
    asIs10.length === labels.length &&
    toBe10.length === labels.length

  // 🔒 Dependencia estable (evita el warning de “deps changed size”)
  const radarKey = useMemo(() => {
    return JSON.stringify({ labels, asIs10, toBe10, canDrawRadar })
  }, [labels, asIs10, toBe10, canDrawRadar])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const chartRef = useRef<Chart | null>(null)

  useEffect(() => {
    chartRef.current?.destroy()
    chartRef.current = null

    if (!canDrawRadar) return

    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const data: ChartData<'radar'> = {
      labels,
      datasets: [
        {
          label: 'Gapply (As-Is)',
          data: asIs10,
          borderColor: 'rgba(37, 99, 235, 1)',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          pointBackgroundColor: 'rgba(37, 99, 235, 1)',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Gapply (To-Be)',
          data: toBe10,
          borderColor: 'rgba(15, 23, 42, 1)',
          backgroundColor: 'rgba(15, 23, 42, 0.08)',
          pointBackgroundColor: 'rgba(15, 23, 42, 1)',
          pointBorderColor: '#ffffff',
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    }

    chartRef.current = new Chart(ctx, {
      type: 'radar',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 10,
            ticks: {
              stepSize: 2,
              color: '#64748b',
              showLabelBackdrop: false,
              backdropColor: 'transparent',
            },
            angleLines: { color: 'rgba(226, 232, 240, 0.35)' },
            grid: { color: 'rgba(226, 232, 240, 0.55)' },
            pointLabels: {
              color: '#0f172a',
              font: { size: 12, weight: 600 },
            },
          },
        },
        plugins: {
          legend: {
            labels: { color: '#0f172a', font: { size: 13, weight: 600 } },
          },
          // 👇 Nada de tooltips “de producto”. Chart tooltip se queda por defecto.
          tooltip: { enabled: true },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [radarKey, canDrawRadar])

  if (!assessmentScore) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-lg font-semibold text-slate-900">Score (foto ejecutiva)</div>
            <div className="mt-1 text-sm text-slate-500">
              Aún no hay puntuación calculada para este assessment.
            </div>
          </div>
          <div className="text-xs text-slate-400">—</div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Ejecuta el recálculo:
          <div className="mt-2 font-mono text-xs">
            POST /api/dts/score/recalc {'{assessmentId: ...}'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-lg font-semibold text-slate-900">Score (foto ejecutiva)</div>
          <div className="mt-1 text-sm text-slate-500">
            Puntuación 0–10 (convertida desde la escala del modelo 1–5). Aquí medimos “nivel”, no “cobertura”.
          </div>
        </div>
        <div className="text-xs text-slate-500">
          {updatedLabel ? `Actualizado: ${updatedLabel}` : null}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: metric cards */}
        <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
          <MetricCard
            title="Gapply actual (As-Is)"
            value={asIsAvg10 != null ? fmt1(asIsAvg10) : '—'}
            suffix="/10"
            sub={modelScaleSub(assessmentScore.as_is_avg, 'Media de tu nivel actual (1=inicial, 5=líder).')}
          />

          <MetricCard
            title="Objetivo (To-Be)"
            value={toBeAvg10 != null ? fmt1(toBeAvg10) : '—'}
            suffix="/10"
            sub={modelScaleSub(assessmentScore.to_be_avg, 'Nivel objetivo que quieres alcanzar (1–5).')}
          />

          <MetricCard
            title="Brecha media"
            value={gapAvg10 != null ? fmt1(gapAvg10) : '—'}
            suffix="/10"
            sub={modelScaleSub(assessmentScore.gap_avg, 'Diferencia media entre objetivo y nivel actual.')}
          />

          <MetricCard
            title="Cobertura (respondido)"
            value={`${coveragePct}`}
            suffix="%"
            sub={`${answered}/${total} criterios · Brecha ponderada (media): ${
              weightedGap != null ? fmt1(weightedGap) : '—'
            } (brecha × importancia).`}
          />
        </div>

        {/* Right: radar */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">
            Radar por dimensiones (As-Is vs To-Be)
          </div>
          <div className="mt-1 text-sm text-slate-500">
            Cada eje es un área del negocio. Sirve para ver en qué áreas estás más débil y dónde quieres llegar.
          </div>

          {!canDrawRadar ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <div className="font-semibold">No se puede dibujar el radar</div>
              <div className="mt-1">
                Falta el metadato de dimensiones. Solución: asegurar que se pasa
                <span className="font-mono"> dimensionsMeta </span>
                desde BBDD.
              </div>

              <div className="mt-3 text-xs text-amber-900">
                Debug rápido:
                <div className="mt-1 font-mono">
                  meta={safeMeta.length} · labels={labels.length} · dimScores={safeDimensionScores.length}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <div className="text-xl font-semibold text-slate-900">Radar de Madurez (0–10)</div>
              <div className="mt-4 relative h-[340px] md:h-[520px]">
                <canvas ref={canvasRef} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 text-xs text-slate-500">
        Nota: si la cobertura es baja, la puntuación es orientativa (MVP).
      </div>
    </div>
  )
}
