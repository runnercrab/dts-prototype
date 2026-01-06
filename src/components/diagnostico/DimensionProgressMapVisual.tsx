// src/components/diagnostico/DimensionProgressMapVisual.tsx
'use client'

import { useMemo } from 'react'
import { CheckCircle2, AlertTriangle, HelpCircle, PlayCircle, ArrowRight } from 'lucide-react'

interface Criterion {
  id: string
  code: string
  short_label: string
  dimension?: { name: string; code: string }
}

interface ResponseT {
  as_is_level: number | null
  to_be_level: number | null
  importance: number | null
}

type CriterionStatus = 'pending' | 'partial' | 'current' | 'complete'

interface CriterionCardVM {
  id: string
  code: string
  label: string
  dimensionName: string
  status: CriterionStatus
}

interface Props {
  criteria: Criterion[]
  responses: Map<string, ResponseT>
  currentCriterionId?: string
  onGoToCriterion: (criterionId: string) => void
  onGoToNextPending?: () => void
}

const DIMENSION_ORDER = ['Cliente', 'Estrategia', 'Tecnología', 'Operaciones', 'Cultura', 'Datos']

/**
 * Iconos desde /public/icons
 * En runtime: "/icons/xxx.png"
 */
const DIMENSION_ICON_SRC: Record<string, string> = {
  Cliente: '/icons/handshake.png',
  Estrategia: '/icons/target.png',
  Tecnología: '/icons/chip.png',
  Operaciones: '/icons/gears.png',
  Cultura: '/icons/users.png',
  Datos: '/icons/database.png',
  Customer: '/icons/handshake.png',
  Strategy: '/icons/target.png',
  Technology: '/icons/chip.png',
  Operations: '/icons/gears.png',
  Culture: '/icons/users.png',
  Data: '/icons/database.png',
}

// Branding
const BRAND_BLUE = '#2563EB' // logo
const BRAND_BLUE_BG = '#EFF6FF'
const TOBE_GREEN = '#15803D'
const TOBE_GREEN_BG = '#ECFDF5'
const CURRENT_GREEN = '#166534'
const CURRENT_GREEN_BG = '#ECFDF5'
const PARTIAL_ORANGE = '#FB923C'
const PARTIAL_ORANGE_BG = '#FFF7ED'
const SLATE_BORDER = '#E2E8F0'
const TEXT_MUTED = '#64748B'

function isCompleteResponse(r?: ResponseT) {
  if (!r) return false
  return r.as_is_level != null && r.to_be_level != null && r.importance != null
}

function isPartialResponse(r?: ResponseT) {
  if (!r) return false
  const hasAny = r.as_is_level != null || r.to_be_level != null || r.importance != null
  return hasAny && !isCompleteResponse(r)
}

function getStatus(criterionId: string, currentCriterionId: string | undefined, r?: ResponseT): CriterionStatus {
  if (currentCriterionId && criterionId === currentCriterionId) return 'current'
  if (isCompleteResponse(r)) return 'complete'
  if (isPartialResponse(r)) return 'partial'
  return 'pending'
}

function statusStyles(status: CriterionStatus) {
  /**
   * Política “gaming”:
   * - Completo = verde (ok)
   * - En curso = verde más marcado
   * - Parcial = naranja suave
   * - Pendiente = azul del logo (por hacer)
   */
  switch (status) {
    case 'complete':
      return {
        card: `bg-[${TOBE_GREEN_BG}] border-[${TOBE_GREEN}] text-slate-900`,
        badge: `bg-[${TOBE_GREEN}] text-white`,
        icon: `text-[${TOBE_GREEN}]`,
      }
    case 'current':
      return {
        card: `bg-[${CURRENT_GREEN_BG}] border-[${CURRENT_GREEN}] text-slate-900`,
        badge: `bg-[${CURRENT_GREEN}] text-white`,
        icon: `text-[${CURRENT_GREEN}]`,
      }
    case 'partial':
      return {
        card: `bg-[${PARTIAL_ORANGE_BG}] border-[${PARTIAL_ORANGE}] text-slate-900`,
        badge: `bg-[${PARTIAL_ORANGE}] text-white`,
        icon: 'text-[#C2410C]',
      }
    case 'pending':
    default:
      return {
        card: `bg-[${BRAND_BLUE_BG}] border-[${BRAND_BLUE}] text-slate-900`,
        badge: `bg-[${BRAND_BLUE}] text-white`,
        icon: `text-[${BRAND_BLUE}]`,
      }
  }
}

export default function DimensionProgressMapVisual({
  criteria,
  responses,
  currentCriterionId,
  onGoToCriterion,
  onGoToNextPending,
}: Props) {
  const cards: CriterionCardVM[] = useMemo(() => {
    return (criteria || []).map((c) => {
      const dimName = c.dimension?.name || '—'
      const r = responses.get(c.id)
      return {
        id: c.id,
        code: c.code,
        label: c.short_label,
        dimensionName: dimName,
        status: getStatus(c.id, currentCriterionId, r),
      }
    })
  }, [criteria, responses, currentCriterionId])

  const groupedByDimension = useMemo(() => {
    const groups: Record<string, CriterionCardVM[]> = {}
    for (const card of cards) {
      if (!groups[card.dimensionName]) groups[card.dimensionName] = []
      groups[card.dimensionName].push(card)
    }
    Object.keys(groups).forEach((dim) => {
      groups[dim].sort((a, b) => a.code.localeCompare(b.code))
    })
    return groups
  }, [cards])

  const totals = useMemo(() => {
    const total = cards.length
    const complete = cards.filter((c) => c.status === 'complete').length
    const partial = cards.filter((c) => c.status === 'partial').length
    const pending = cards.filter((c) => c.status === 'pending').length
    const done = complete
    const percentage = total > 0 ? Math.round((done / total) * 100) : 0
    return { total, complete, partial, pending, percentage }
  }, [cards])

  const dimensionSummary = useMemo(() => {
    const out: Record<string, { total: number; complete: number; hasCurrent: boolean }> = {}
    for (const dimName of DIMENSION_ORDER) {
      const list = groupedByDimension[dimName] || []
      out[dimName] = {
        total: list.length,
        complete: list.filter((c) => c.status === 'complete').length,
        hasCurrent: list.some((c) => c.status === 'current'),
      }
    }
    return out
  }, [groupedByDimension])

  return (
    <div className="space-y-3">
      {/* Header: contador + botón siguiente pendiente */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-sm 2xl:text-base font-bold text-gray-900">Mapa de Progreso</h3>
          <div className="text-xs 2xl:text-sm text-gray-600 mt-1">
            Completadas: <span className="font-semibold">{totals.complete}/{totals.total}</span>
            <span className="mx-2">|</span>
            Pendientes: <span className="font-semibold">{totals.pending + totals.partial}</span>
          </div>
        </div>

        {onGoToNextPending && (
          <button
            onClick={onGoToNextPending}
            className="px-3 py-2 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 text-xs 2xl:text-sm font-semibold hover:bg-amber-100 flex items-center gap-2"
            title="Ir al siguiente criterio pendiente o parcial"
          >
            <ArrowRight className="w-4 h-4" />
            Siguiente pendiente
          </button>
        )}
      </div>

      {/* Progreso global */}
      <div>
        <h2 className="text-sm 2xl:text-base font-bold text-gray-900">Progreso del Diagnóstico</h2>
        <p className="text-xs 2xl:text-sm text-gray-600 mt-1">
          {totals.complete}/{totals.total} criterios completados ({totals.percentage}%)
        </p>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="h-2 rounded-full transition-all duration-500"
          style={{ width: `${totals.percentage}%`, background: TOBE_GREEN }}
        />
      </div>

      {/* ICONOS DE DIMENSIONES: tile limpio, azul (normal) / verde (si contiene “current”) */}
      <div className="grid grid-cols-3 gap-3">
        {DIMENSION_ORDER.map((dimName) => {
          const info = dimensionSummary[dimName]
          const hasAny = info.total > 0
          const isCurrentDim = info?.hasCurrent

          const borderColor = isCurrentDim ? TOBE_GREEN : BRAND_BLUE
          const bgColor = isCurrentDim ? TOBE_GREEN_BG : BRAND_BLUE_BG

          const src = DIMENSION_ICON_SRC[dimName] || '/icons/target.png'

          return (
            <div key={dimName} className="text-center">
              <div
                className="w-14 h-14 2xl:w-16 2xl:h-16 rounded-2xl mx-auto flex items-center justify-center border"
                style={{
                  borderColor: hasAny ? borderColor : '#CBD5E1',
                  background: hasAny ? bgColor : '#F8FAFC',
                }}
              >
                <img
                  src={src}
                  alt={dimName}
                  className="w-8 h-8 2xl:w-9 2xl:h-9 object-contain"
                  draggable={false}
                />
              </div>

              <div className="mt-1 text-[10px] 2xl:text-xs font-semibold text-gray-800 leading-tight">
                {dimName}
              </div>

              <div className="text-[9px] 2xl:text-xs text-gray-500">
                {hasAny ? `${info.complete}/${info.total}` : '0/0'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Lista (scroll) de criterios por dimensión */}
      <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight: 'calc(100vh - 420px)' }}>
        {DIMENSION_ORDER.map((dimName) => {
          const list = groupedByDimension[dimName] || []
          if (list.length === 0) return null

          const done = list.filter((c) => c.status === 'complete').length
          const isCurrentDim = dimensionSummary[dimName]?.hasCurrent

          // ✅ CABECERA: si dimensión contiene current => recuadro verde
          // ✅ resto => normal (blanco/gris)
          const headerStyle = isCurrentDim
            ? { background: TOBE_GREEN_BG, borderColor: TOBE_GREEN }
            : { background: '#FFFFFF', borderColor: SLATE_BORDER }

          const dotColor = isCurrentDim ? TOBE_GREEN : BRAND_BLUE
          const textColor = isCurrentDim ? TOBE_GREEN : '#0F172A'
          const countColor = isCurrentDim ? TOBE_GREEN : TEXT_MUTED

          return (
            <div
              key={dimName}
              className="rounded-lg border overflow-hidden bg-white"
              style={{ borderColor: isCurrentDim ? TOBE_GREEN : SLATE_BORDER }}
            >
              {/* Header dimensión (SIN azul marino) */}
              <div className="px-3 py-2 flex items-center justify-between border-b" style={headerStyle}>
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-2 h-2 rounded-full"
                    style={{ background: dotColor }}
                    aria-hidden
                  />
                  <span className="text-xs 2xl:text-sm font-semibold" style={{ color: textColor }}>
                    {dimName}
                  </span>
                </div>
                <span className="text-[10px] 2xl:text-xs" style={{ color: countColor }}>
                  {done}/{list.length}
                </span>
              </div>

              {/* Grid de criterios */}
              <div className="grid grid-cols-2 gap-2 p-2">
                {list.map((c) => {
                  const s = statusStyles(c.status)

                  const Icon =
                    c.status === 'complete'
                      ? CheckCircle2
                      : c.status === 'current'
                        ? PlayCircle
                        : c.status === 'partial'
                          ? AlertTriangle
                          : HelpCircle

                  return (
                    <button
                      key={c.id}
                      onClick={() => onGoToCriterion(c.id)}
                      className={[
                        'text-left w-full rounded-2xl border p-3 transition-all',
                        'hover:shadow-sm hover:brightness-[0.99]',
                        s.card,
                        c.status === 'current' ? 'ring-2 ring-[#15803D]/15' : '',
                      ].join(' ')}
                      title="Ir a este criterio"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-xs font-bold opacity-80">{c.code}</div>
                          <div className="mt-1 text-sm 2xl:text-base font-semibold leading-snug line-clamp-2">
                            {c.label}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <Icon className={['w-7 h-7 2xl:w-8 2xl:h-8', s.icon].join(' ')} />
                          <span
                            className={['text-[10px] 2xl:text-xs px-2 py-1 rounded-full font-semibold', s.badge].join(' ')}
                          >
                            {c.status === 'complete'
                              ? 'Completo'
                              : c.status === 'current'
                                ? 'En curso'
                                : c.status === 'partial'
                                  ? 'Parcial'
                                  : 'Pendiente'}
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Leyenda */}
              <div className="px-2 pb-2">
                <div className="grid grid-cols-4 gap-2 text-[10px] 2xl:text-xs pt-2 border-t" style={{ borderColor: SLATE_BORDER }}>
                  <div className="flex items-center gap-1 text-gray-700">
                    <div className="w-3 h-3 rounded" style={{ background: TOBE_GREEN_BG, border: `1px solid ${TOBE_GREEN}` }} />
                    <span>Completo</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <div className="w-3 h-3 rounded" style={{ background: TOBE_GREEN_BG, border: `1px solid ${CURRENT_GREEN}` }} />
                    <span>En curso</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <div className="w-3 h-3 rounded" style={{ background: PARTIAL_ORANGE_BG, border: `1px solid ${PARTIAL_ORANGE}` }} />
                    <span>Parcial</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-700">
                    <div className="w-3 h-3 rounded" style={{ background: BRAND_BLUE_BG, border: `1px solid ${BRAND_BLUE}` }} />
                    <span>Pendiente</span>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
