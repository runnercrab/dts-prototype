/**
 * GAPPLY ROADMAP V2.3 — Data Layer
 * LOCATION: src/lib/dts/roadmap-data.ts
 */

import { SupabaseClient } from '@supabase/supabase-js'

// ── Types ──

export interface RoadmapAction {
  id: string
  code: string
  name: string
  description: string | null
  deliverable: string | null
  dod: string | null
  band: string | null
  hours: number
  hours_min: number | null
  hours_typical: number | null
  hours_max: number | null
  month: string | null
  status: string
  que_hacer: string | null
  como_hacerlo: string | null
  para_que_sirve: string | null
  entregable_concreto: string | null
  ejemplo: string | null
}

export interface RoadmapProgram {
  id: string
  code: string
  name: string
  dimension: string
  tier: number | string
  dolor_ceo: string | null
  why_matters: string | null
  expected_outcome: string | null
  ejemplos: any | null
  weighted_need: number
  program_score: number
  priority_badge: string | null
  reasons: string[]
  hours_typical: number | null
  actions: {
    '30d': RoadmapAction[]
    '60d': RoadmapAction[]
    '90d': RoadmapAction[]
    backlog: RoadmapAction[]
  }
}

export interface CapacityPhase { limit: number; used: number }
export interface D5Dimension { dimension: string; criteria: string[] }

export interface RoadmapSummary {
  programs_assigned: number
  programs_active_90d: number
  actions_assigned: number
  actions_in_90d: number
  capacity_exceeded: boolean
  capacity_excess_hours: { '30d': number; '60d': number; '90d': number; total: number }
  overflow_to_backlog: boolean
  capacity_exceeded_by_starters: boolean
  starter_actions_forced: number
  d5_dimensions: D5Dimension[]
  version: string
}

export interface RoadmapData {
  programs: RoadmapProgram[]
  capacity: { '30d': CapacityPhase; '60d': CapacityPhase; '90d': CapacityPhase }
  d5: D5Dimension[]
  summary: RoadmapSummary
}

// ── Month → phase mapping ──
const MONTH_TO_PHASE: Record<string, string> = {
  'M1': '30d',
  'M2': '60d',
  'M3': '90d',
}

const V22_PACKS = new Set(['gapply_v22', 'gapply_v23'])
const PHASES = ['30d', '60d', '90d', 'backlog'] as const

// ── Lee estados persistidos de dts_action_status ──
async function fetchActionStatuses(
  supabase: SupabaseClient,
  assessmentId: string
): Promise<Map<string, string>> {
  const { data } = await supabase
    .from('dts_action_status')
    .select('action_id, status')
    .eq('assessment_id', assessmentId)

  const map = new Map<string, string>()
  for (const row of (data || [])) {
    map.set(row.action_id, row.status)
  }
  return map
}

// ── Aplica estados persistidos sobre programs ──
function applyStatuses(programs: RoadmapProgram[], statuses: Map<string, string>) {
  if (statuses.size === 0) return
  for (const prog of programs) {
    for (const phase of PHASES) {
      for (const action of prog.actions[phase]) {
        const saved = statuses.get(action.id)
        if (saved) action.status = saved
      }
    }
  }
}

// ── Enrich reasons: traduce jerga técnica a lenguaje CEO ──
// Patrones entrada:
//   "Criterio ceo30_v1.CLI-3 en nivel 1 (critico)"
//   "Puntuacion TEC = 2.00 (por debajo de 2.5)"
//   "Dimension OPE con 2 criterios ≤2 (debilidad estructural)"
//   "Elevado a Tier N por prerequisitos..." → se elimina (jerga interna)
//   "Acción de arranque (capacidad ajustada)" → se elimina (jerga interna)

const DIM_NAMES: Record<string, string> = {
  EST: 'Estrategia', OPE: 'Operaciones', PER: 'Personas',
  DAT: 'Datos', TEC: 'Tecnología', GOB: 'Gobierno', CLI: 'Clientes',
}

async function enrichReasons(supabase: SupabaseClient, programs: RoadmapProgram[]) {
  // Collect criteria codes for lookup
  const codeRegex = /([a-z0-9_]+\.([A-Z]+)-\d+)/gi
  const allCodes = new Set<string>()
  for (const prog of programs) {
    for (const r of prog.reasons) {
      let m: RegExpExecArray | null
      const rx = /([a-z0-9_]+\.([A-Z]+-\d+))/gi
      while ((m = rx.exec(r)) !== null) allCodes.add(m[1])
    }
  }

  const labelMap = new Map<string, string>()
  if (allCodes.size > 0) {
    const { data: criteria } = await supabase
      .from('dts_criteria')
      .select('code, short_label_es')
      .in('code', Array.from(allCodes))
    for (const c of (criteria || [])) {
      labelMap.set(c.code, c.short_label_es || c.code)
    }
  }

  for (const prog of programs) {
    const enriched: string[] = []
    for (const r of prog.reasons) {
      // Traducir arranque
      if (/acción de arranque/i.test(r)) {
        enriched.push('Punto de partida recomendado para tu plan')
        continue
      }

      // "Elevado a Tier N por prerequisitos" → traducir
      if (/elevado a tier/i.test(r)) {
        enriched.push('Necesario para completar otro programa de tu plan')
        continue
      }

      // "Criterio ceo30_v1.CLI-3 en nivel 1 (critico)"
      const criterioMatch = r.match(/([a-z0-9_]+\.([A-Z]+-\d+)).*nivel\s*(\d+)/i)
      if (criterioMatch) {
        const fullCode = criterioMatch[1]
        const shortCode = criterioMatch[2]
        const level = parseInt(criterioMatch[3])
        const label = labelMap.get(fullCode)
        const levelText = level === 1 ? 'puntuación muy baja (1/5)' : `puntuación baja (${level}/5)`
        enriched.push(label ? `${shortCode} · ${label} — ${levelText}` : `${shortCode} — ${levelText}`)
        continue
      }

      // "Puntuacion TEC = 2.00 (por debajo de 2.5)"
      const puntuacionMatch = r.match(/Puntuacion\s+([A-Z]+)\s*=\s*([\d.]+)/i)
      if (puntuacionMatch) {
        const dim = puntuacionMatch[1].toUpperCase()
        const score = parseFloat(puntuacionMatch[2]).toFixed(1)
        const dimName = DIM_NAMES[dim] || dim
        enriched.push(`${dimName} con puntuación baja (${score}/5)`)
        continue
      }

      // "Dimension OPE con 2 criterios ≤2 (debilidad estructural)"
      const dimMatch = r.match(/Dimension\s+([A-Z]+)\s+con\s+(\d+)\s+criterios/i)
      if (dimMatch) {
        const dim = dimMatch[1].toUpperCase()
        const count = dimMatch[2]
        const dimName = DIM_NAMES[dim] || dim
        enriched.push(`${dimName}: ${count} áreas con puntuación muy baja`)
        continue
      }

      // Cualquier otro reason — dejarlo tal cual
      enriched.push(r)
    }
    // Deduplicar
    const seen = new Set<string>()
    const deduped = enriched.filter(r => {
      if (seen.has(r)) return false
      seen.add(r)
      return true
    })

    // Fallback para programas CORE sin reasons (incluidos por defecto en todos los planes)
    if (deduped.length === 0) {
      if (prog.code?.startsWith('PRG-CORE')) {
        deduped.push('Programa base — incluido en todos los planes de acción')
      } else if (prog.code?.startsWith('PRG-RING')) {
        deduped.push('Complementa otros programas de tu plan')
      } else {
        deduped.push('Incluido en tu plan de acción')
      }
    }

    prog.reasons = deduped
  }
}

// ══════════════════════════════════════════════════════════════════
// Main fetch
// ══════════════════════════════════════════════════════════════════

export async function fetchRoadmapWithSummary(
  supabase: SupabaseClient,
  assessmentId: string
): Promise<RoadmapData> {
  const { data: assessment, error: aErr } = await supabase
    .from('dts_assessments')
    .select('pack')
    .eq('id', assessmentId)
    .single()

  if (aErr?.message || !assessment) {
    throw new Error(`Assessment not found: ${aErr?.message || 'no data'}`)
  }

  if (V22_PACKS.has(assessment.pack)) {
    return fetchRoadmapV22(supabase, assessmentId)
  } else {
    return fetchRoadmapV1(supabase, assessmentId)
  }
}

// ══════════════════════════════════════════════════════════════════
// V2.2+ PATH
// ══════════════════════════════════════════════════════════════════

async function fetchRoadmapV22(
  supabase: SupabaseClient,
  assessmentId: string
): Promise<RoadmapData> {

  const { data: rankedRaw, error: rpcErr } = await supabase
    .rpc('dts_results_programs_v2', { p_assessment_id: assessmentId })

  if (rpcErr?.message) throw new Error(`Program ranking failed: ${rpcErr.message}`)

  const ranked = rankedRaw || []
  if (ranked.length === 0) return emptyRoadmap('v2.3')

  const v22Programs = ranked.filter((p: any) =>
    p.program_code?.startsWith('PRG-CORE') || p.program_code?.startsWith('PRG-RING')
  )
  if (v22Programs.length === 0) return emptyRoadmap('v2.3')

  const programCodes = v22Programs.map((p: any) => p.program_code)
  const { data: catalogDetails } = await supabase
    .from('dts_program_catalog')
    .select('code, dolor_ceo, why_matters, expected_outcome, ejemplos, scope, dimension_primary, tier, display_order')
    .in('code', programCodes)
    .neq('display_order', 999)

  const catalogByCode = new Map<string, any>()
  for (const d of (catalogDetails || [])) catalogByCode.set(d.code, d)

  const activeProgramCodes = Array.from(catalogByCode.keys())

  const { data: actions, error: actErr } = await supabase
    .from('dts_action_catalog')
    .select('id, code, title, description, deliverable, dod, band, hours_min, hours_typical, hours_max, effort_hours, month, program_code, que_hacer, como_hacerlo, para_que_sirve, entregable_concreto, ejemplo')
    .in('program_code', activeProgramCodes)
    .eq('is_active', true)
    .order('program_code')
    .order('month')
    .order('code')

  if (actErr?.message) throw new Error(`Action fetch failed: ${actErr.message}`)

  const actionsByProgram = new Map<string, any[]>()
  for (const a of (actions || [])) {
    const list = actionsByProgram.get(a.program_code) || []
    list.push(a)
    actionsByProgram.set(a.program_code, list)
  }

  const effortMultiplier: number = parseFloat(ranked[0]?.effort_multiplier ?? '1.0') || 1.0

  const programs: RoadmapProgram[] = v22Programs
    .filter((p: any) => catalogByCode.has(p.program_code))
    .map((p: any, idx: number) => {
      const progActions = actionsByProgram.get(p.program_code) || []
      const grouped: RoadmapProgram['actions'] = { '30d': [], '60d': [], '90d': [], backlog: [] }

      for (const a of progActions) {
        const phase = MONTH_TO_PHASE[a.month] || 'backlog'
        const hoursTypical = a.hours_typical || a.effort_hours || 0
        grouped[phase as keyof typeof grouped].push({
          id: a.id,
          code: a.code || '',
          name: a.title || 'Accion sin nombre',
          description: a.description || null,
          deliverable: a.deliverable || null,
          dod: a.dod || null,
          band: a.band || null,
          hours: Math.round(hoursTypical * effortMultiplier),
          hours_min: a.hours_min != null ? Math.round(a.hours_min * effortMultiplier) : null,
          hours_typical: a.hours_typical != null ? Math.round(a.hours_typical * effortMultiplier) : null,
          hours_max: a.hours_max != null ? Math.round(a.hours_max * effortMultiplier) : null,
          month: a.month,
          status: 'pending',
          que_hacer: a.que_hacer || null,
          como_hacerlo: a.como_hacerlo || null,
          para_que_sirve: a.para_que_sirve || null,
          entregable_concreto: a.entregable_concreto || null,
          ejemplo: a.ejemplo || null,
        })
      }

      const cat = catalogByCode.get(p.program_code) || {}
      const progHoursTypical = p.hours_typical ?? null
      return {
        id: p.program_id || p.id || `prog-${idx}`,
        code: p.program_code,
        name: p.name_ceo || p.title || cat.title || p.program_code,
        dimension: p.dimension_primary || cat.dimension_primary || '',
        tier: cat.display_order || 99,
        dolor_ceo: cat.dolor_ceo || p.dolor_ceo || p.description_ceo || null,
        why_matters: cat.why_matters || p.why_matters || null,
        expected_outcome: cat.expected_outcome || null,
        ejemplos: cat.ejemplos || null,
        weighted_need: p.weighted_need || 0,
        program_score: p.program_score || 0,
        priority_badge: p.priority_badge || null,
        reasons: p.top_contributors
          ? p.top_contributors.map((tc: any) => tc.criteria_label || tc.criteria_code)
          : [],
        hours_typical: progHoursTypical != null ? Math.round(progHoursTypical * effortMultiplier) : null,
        actions: grouped,
      }
    })

  programs.sort((a, b) => b.program_score - a.program_score)

  const statuses = await fetchActionStatuses(supabase, assessmentId)
  applyStatuses(programs, statuses)
  await enrichReasons(supabase, programs)

  const calcUsed = (phase: string) =>
    programs.reduce((sum, p) => {
      const phaseActions = p.actions[phase as keyof typeof p.actions] || []
      return sum + phaseActions.reduce((s, a) => s + a.hours, 0)
    }, 0)

  const totalActions = programs.reduce(
    (sum, p) => sum + p.actions['30d'].length + p.actions['60d'].length + p.actions['90d'].length + p.actions.backlog.length, 0
  )
  const actionsIn90d = programs.reduce(
    (sum, p) => sum + p.actions['30d'].length + p.actions['60d'].length + p.actions['90d'].length, 0
  )

  const summary: RoadmapSummary = {
    programs_assigned: programs.length,
    programs_active_90d: programs.filter(
      p => p.actions['30d'].length > 0 || p.actions['60d'].length > 0 || p.actions['90d'].length > 0
    ).length,
    actions_assigned: totalActions,
    actions_in_90d: actionsIn90d,
    capacity_exceeded: false,
    capacity_excess_hours: { '30d': 0, '60d': 0, '90d': 0, total: 0 },
    overflow_to_backlog: false,
    capacity_exceeded_by_starters: false,
    starter_actions_forced: 0,
    d5_dimensions: [],
    version: 'v2.3',
  }

  return {
    programs,
    capacity: {
      '30d': { limit: 40, used: calcUsed('30d') },
      '60d': { limit: 80, used: calcUsed('60d') },
      '90d': { limit: 120, used: calcUsed('90d') },
    },
    d5: [],
    summary,
  }
}

// ══════════════════════════════════════════════════════════════════
// V1 PATH — legacy, mantener hasta migración completa a gapply_v23
// ══════════════════════════════════════════════════════════════════

async function fetchRoadmapV1(
  supabase: SupabaseClient,
  assessmentId: string
): Promise<RoadmapData> {

  const { data: summaryRaw, error: rpcError } = await supabase
    .rpc('dts_v2_generate_roadmap', { p_assessment_id: assessmentId })

  if (rpcError?.message) {
    console.error('RPC error:', rpcError)
    throw new Error(`Failed to generate roadmap: ${rpcError.message}`)
  }

  const summary: RoadmapSummary = { ...summaryRaw, version: 'v1' }

  const { data: initiatives, error: fetchError } = await supabase
    .from('dts_v2_initiatives')
    .select(`
      id, program_id, action_id, phase, criticality_tier, priority_badge,
      assignment_reasons, effort_hours_estimated, status,
      dts_program_catalog (id, code, name_ceo, dolor_ceo, why_matters, expected_outcome, dimension_primary, category, impact_default, effort_default),
      dts_action_catalog (id, code, title, description, deliverable, dod, band, hours_min, hours_typical, hours_max, effort_hours, month)
    `)
    .eq('assessment_id', assessmentId)
    .order('criticality_tier', { ascending: true })

  if (fetchError?.message) {
    console.error('Fetch error:', fetchError)
    throw new Error(`Failed to fetch initiatives: ${fetchError.message}`)
  }

  if (!initiatives || initiatives.length === 0) return emptyRoadmap('v1')

  const programMap = new Map<string, {
    program: any; tier: number; reasons: string[];
    actions: Record<string, RoadmapAction[]>
  }>()

  for (const init of initiatives) {
    const prog = init.dts_program_catalog as any
    const action = init.dts_action_catalog as any
    const progId = init.program_id

    if (!programMap.has(progId)) {
      programMap.set(progId, {
        program: prog,
        tier: init.criticality_tier,
        reasons: init.assignment_reasons || [],
        actions: { '30d': [], '60d': [], '90d': [], backlog: [] },
      })
    }

    const entry = programMap.get(progId)!
    if (init.criticality_tier < entry.tier) entry.tier = init.criticality_tier
    if (init.assignment_reasons) {
      for (const r of init.assignment_reasons) {
        if (!entry.reasons.includes(r)) entry.reasons.push(r)
      }
    }

    // FIX: usar month del catálogo cuando la RPC manda todo a backlog
    const rawPhase = init.phase as string
    const monthPhase = MONTH_TO_PHASE[action?.month as string] || 'backlog'
    const phase = (rawPhase && rawPhase !== 'backlog') ? rawPhase : monthPhase

    if (entry.actions[phase]) {
      entry.actions[phase].push({
        id: init.id,
        code: action?.code || '',
        name: action?.title || 'Accion sin nombre',
        description: action?.description || null,
        deliverable: action?.deliverable || null,
        dod: action?.dod || null,
        band: action?.band || null,
        hours: init.effort_hours_estimated || 0,
        hours_min: action?.hours_min || null,
        hours_typical: action?.hours_typical || null,
        hours_max: action?.hours_max || null,
        month: action?.month || null,
        status: init.status || 'pending',
        que_hacer: null,
        como_hacerlo: null,
        para_que_sirve: null,
        entregable_concreto: null,
        ejemplo: null,
      })
    }
  }

  const programs: RoadmapProgram[] = Array.from(programMap.entries())
    .map(([progId, entry]) => ({
      id: progId,
      code: entry.program.code,
      name: entry.program.name_ceo,
      dimension: entry.program.dimension_primary,
      tier: entry.tier,
      dolor_ceo: entry.program.dolor_ceo || null,
      why_matters: entry.program.why_matters || null,
      expected_outcome: entry.program.expected_outcome || null,
      ejemplos: null,
      weighted_need: 0,
      program_score: 0,
      priority_badge: null,
      reasons: entry.reasons,
      hours_typical: null,
      actions: entry.actions as RoadmapProgram['actions'],
    }))
    .sort((a, b) => {
      if (a.tier !== b.tier) return (a.tier as number) - (b.tier as number)
      const po = (p: RoadmapProgram) =>
        p.actions['30d'].length > 0 ? 1 : p.actions['60d'].length > 0 ? 2 : p.actions['90d'].length > 0 ? 3 : 4
      return po(a) - po(b)
    })

  const statuses = await fetchActionStatuses(supabase, assessmentId)
  applyStatuses(programs, statuses)
  await enrichReasons(supabase, programs)

  const calcUsed = (phase: string) =>
    initiatives.filter((i: any) => i.phase === phase).reduce((sum: number, i: any) => sum + (i.effort_hours_estimated || 0), 0)

  const capFromSummary = (summary as any).capacity
  const cl = capFromSummary
    ? { '30d': capFromSummary['30d']?.limit || 30, '60d': capFromSummary['60d']?.limit || 70, '90d': capFromSummary['90d']?.limit || 100 }
    : { '30d': 30, '60d': 70, '90d': 100 }

  return {
    programs,
    capacity: {
      '30d': { limit: cl['30d'], used: calcUsed('30d') },
      '60d': { limit: cl['60d'], used: calcUsed('60d') },
      '90d': { limit: cl['90d'], used: calcUsed('90d') },
    },
    d5: summary.d5_dimensions || [],
    summary,
  }
}

// ── Empty roadmap helper ──

function emptyRoadmap(version: string): RoadmapData {
  return {
    programs: [],
    capacity: {
      '30d': { limit: 40, used: 0 },
      '60d': { limit: 80, used: 0 },
      '90d': { limit: 120, used: 0 },
    },
    d5: [],
    summary: {
      programs_assigned: 0,
      programs_active_90d: 0,
      actions_assigned: 0,
      actions_in_90d: 0,
      capacity_exceeded: false,
      capacity_excess_hours: { '30d': 0, '60d': 0, '90d': 0, total: 0 },
      overflow_to_backlog: false,
      capacity_exceeded_by_starters: false,
      starter_actions_forced: 0,
      d5_dimensions: [],
      version,
    },
  }
}

// ── updateActionStatus mantenido por compatibilidad ──
export async function updateActionStatus(
  supabase: SupabaseClient,
  initiativeId: string,
  newStatus: 'pending' | 'completed'
): Promise<void> {
  const { error } = await supabase
    .from('dts_v2_initiatives')
    .update({ status: newStatus })
    .eq('id', initiativeId)

  if (error?.message) {
    console.error('Update error:', error)
    throw new Error(`Failed to update status: ${error.message}`)
  }
}