// ============================================
// SCORING & EFFORT CALCULATION UTILITIES
// Basado en TM Forum DMM v5.0.1 + DTS Methodology
// ============================================
//
// CAMBIOS PRINCIPALES (v2.0):
// 1. Scoring basado en WEIGHTED GAP (to_be - as_is) × importance
// 2. Output: Maturity Index (1-5) en vez de porcentaje (0-100)
// 3. Pesos de dimensiones IGUALES (16.67% cada una)
// 4. Metodología oficial TM Forum validada por Alfred Karlsson
//
// ============================================

// ============================================
// TIPOS Y CONSTANTES
// ============================================

export interface CriterionResponse {
  criteria_id: string
  as_is_level: number
  to_be_level: number
  importance: number
  to_be_timeframe: number
}

export interface Criterion {
  id: string
  code: string
  dimension_id: string
  subdimension_id: string
  title: string
}

export interface DimensionScore {
  dimension_id: string
  dimension_name: string
  maturity_index: number      // 1-5 scale (NUEVO)
  weighted_gap_avg: number    // Para referencia
  as_is_score: number         // Legacy (0-100)
  to_be_score: number         // Legacy (0-100)
  gap: number                 // Legacy
  weight: number              // Siempre 1/6 (0.1667)
}

export interface EffortResult {
  criteria_id: string
  gap_levels: number
  effort_base: number
  delta_gap: number
  delta_size: number
  delta_maturity: number
  delta_sector: number
  delta_total: number
  effort_final: number
  impact: number
  priority_score: number
  category: 'Quick Win' | 'Transformacional' | 'Foundation' | 'Mantenimiento'
}

// ============================================
// PESOS DE DIMENSIONES (TM FORUM OFICIAL)
// ============================================
// TODOS LOS PESOS SON IGUALES (1/6 = 16.67%)
// Confirmado por Alfred Karlsson (Nov 2024):
// "There are no weights assigned to subdimensions for the purpose of scoring maturity"

export const DIMENSION_WEIGHTS: Record<string, number> = {
  'strategy': 1/6,     // 16.67% (antes 20% ❌)
  'customer': 1/6,     // 16.67% (antes 15% ❌)
  'technology': 1/6,   // 16.67% (antes 15% ❌)
  'operations': 1/6,   // 16.67% (antes 15% ❌)
  'culture': 1/6,      // 16.67% (antes 15% ❌)
  'data': 1/6          // 16.67% (antes 20% ❌)
}

// Labels de madurez TM Forum
export const MATURITY_LABELS: Record<number, string> = {
  1: 'Inicial',
  2: 'Emergente',
  3: 'Definido',
  4: 'Gestionado',
  5: 'Optimizado'
}

// Effort base por tipo de acción (sin cambios - funciona bien)
export const EFFORT_BASE_CATALOG: Record<string, number> = {
  // Strategy
  'strategic_planning': 70,
  'innovation': 65,
  'ecosystem_collaboration': 60,
  'sustainability': 55,
  'technology_enablement': 70,
  
  // Customer
  'customer_experience': 60,
  'engagement': 55,
  'customer_data': 65,
  'value_delivery': 60,
  
  // Technology
  'architecture': 80,
  'legacy_modernization': 85,
  'cloud_adoption': 75,
  'api_management': 70,
  'integration': 85,
  'security': 75,
  
  // Operations
  'process_automation': 70,
  'agile_operations': 65,
  'resource_management': 60,
  
  // Culture
  'skills_development': 50,
  'organizational_change': 60,
  'collaboration': 45,
  'digital_mindset': 55,
  
  // Data
  'data_governance': 80,
  'data_integration': 85,
  'analytics': 75,
  'ai_ml': 90,
  'data_monetization': 70,
  
  // Default
  'default': 60
}

// ============================================
// NUEVAS FUNCIONES: WEIGHTED GAP METHODOLOGY
// ============================================

/**
 * Calcula weighted gap para un criterio
 * Formula TM Forum: weighted_gap = (to_be - as_is) × importance
 * 
 * @param asIsLevel - Nivel actual (1-5)
 * @param toBeLevel - Nivel objetivo (1-5)
 * @param importance - Importancia (1-5)
 * @returns Weighted gap (0-20)
 */
export function calculateWeightedGap(
  asIsLevel: number,
  toBeLevel: number,
  importance: number
): number {
  // Validar inputs
  if (asIsLevel < 1 || asIsLevel > 5) {
    console.warn(`Invalid as_is_level: ${asIsLevel}. Clamping to [1,5]`)
    asIsLevel = Math.max(1, Math.min(5, asIsLevel))
  }
  
  if (toBeLevel < 1 || toBeLevel > 5) {
    console.warn(`Invalid to_be_level: ${toBeLevel}. Clamping to [1,5]`)
    toBeLevel = Math.max(1, Math.min(5, toBeLevel))
  }
  
  if (importance < 1 || importance > 5) {
    console.warn(`Invalid importance: ${importance}. Clamping to [1,5]`)
    importance = Math.max(1, Math.min(5, importance))
  }
  
  // Calcular gap
  const gap = toBeLevel - asIsLevel
  
  // Manejar gaps negativos (no debería pasar pero ser defensivo)
  if (gap < 0) {
    console.warn(`Negative gap: to_be(${toBeLevel}) < as_is(${asIsLevel}). Setting to 0.`)
    return 0
  }
  
  // Weighted gap = gap × importance
  return gap * importance
}

/**
 * Convierte weighted gap promedio a Maturity Index (1-5)
 * 
 * Formula: maturity = 5 - (weighted_gap / MAX_GAP) × 4
 * 
 * Lógica inversa:
 * - weighted_gap alto → maturity bajo
 * - weighted_gap bajo → maturity alto
 * 
 * @param weightedGapAvg - Promedio de weighted gaps
 * @returns Maturity index (1-5)
 */
export function convertWeightedGapToMaturityIndex(weightedGapAvg: number): number {
  const MAX_WEIGHTED_GAP = 20  // gap=4, importance=5
  
  // Mapeo lineal inverso
  const maturity = 5 - (weightedGapAvg / MAX_WEIGHTED_GAP) * 4
  
  // Clamp a rango [1, 5]
  return Math.max(1, Math.min(5, maturity))
}

/**
 * Obtiene label de madurez según index
 */
export function getMaturityLabel(index: number): string {
  if (index < 1.5) return MATURITY_LABELS[1]
  if (index < 2.5) return MATURITY_LABELS[2]
  if (index < 3.5) return MATURITY_LABELS[3]
  if (index < 4.5) return MATURITY_LABELS[4]
  return MATURITY_LABELS[5]
}

/**
 * Formatea maturity index para display
 */
export function formatMaturityIndex(index: number, decimals: number = 1): string {
  return `${index.toFixed(decimals)}/5`
}

/**
 * Convierte maturity index a porcentaje (para compatibilidad)
 */
export function maturityIndexToPercentage(index: number): number {
  return ((index - 1) / 4) * 100
}

// ============================================
// FUNCIONES LEGACY (Mantener para compatibilidad)
// ============================================

/**
 * Convierte nivel TM Forum (1-5) a escala 0-100
 * LEGACY: Solo para mostrar comparación
 */
export function levelToScore(level: number): number {
  if (level < 1) return 0
  if (level > 5) return 100
  return (level - 1) * 25
}

// ============================================
// SCORING FUNCTIONS (NUEVA METODOLOGÍA)
// ============================================

/**
 * Calcula score de subdimensión usando weighted gaps
 */
export function calculateSubdimensionScore(
  responses: CriterionResponse[],
  subdimensionId: string
): { maturity_index: number; weighted_gap_avg: number; as_is_score: number } {
  const subdimResponses = responses.filter(r => {
    // En producción esto vendría de join con criteria
    return true
  })

  if (subdimResponses.length === 0) {
    return { maturity_index: 1, weighted_gap_avg: 0, as_is_score: 0 }
  }

  // Calcular weighted gaps
  const weightedGaps = subdimResponses.map(r =>
    calculateWeightedGap(r.as_is_level, r.to_be_level, r.importance)
  )
  
  // Promedio de weighted gaps
  const weightedGapAvg = weightedGaps.reduce((a, b) => a + b, 0) / weightedGaps.length
  
  // Convertir a maturity index
  const maturityIndex = convertWeightedGapToMaturityIndex(weightedGapAvg)
  
  // Calcular AS-IS score legacy (para compatibilidad)
  const asIsScores = subdimResponses.map(r => levelToScore(r.as_is_level))
  const asIsScore = asIsScores.reduce((a, b) => a + b, 0) / asIsScores.length

  return {
    maturity_index: maturityIndex,
    weighted_gap_avg: weightedGapAvg,
    as_is_score: asIsScore
  }
}

/**
 * Calcula score de dimensión usando weighted gaps
 */
export function calculateDimensionScore(
  responses: CriterionResponse[],
  criteria: Criterion[],
  dimensionId: string
): DimensionScore {
  // Filtrar criterios de esta dimensión
  const dimensionCriteria = criteria.filter(c => c.dimension_id === dimensionId)
  const dimensionCriteriaIds = dimensionCriteria.map(c => c.id)
  
  // Filtrar respuestas de esta dimensión
  const dimensionResponses = responses.filter(r => 
    dimensionCriteriaIds.includes(r.criteria_id)
  )

  if (dimensionResponses.length === 0) {
    return {
      dimension_id: dimensionId,
      dimension_name: dimensionId,
      maturity_index: 1,
      weighted_gap_avg: 0,
      as_is_score: 0,
      to_be_score: 0,
      gap: 0,
      weight: 1/6
    }
  }

  // Calcular weighted gaps
  const weightedGaps = dimensionResponses.map(r =>
    calculateWeightedGap(r.as_is_level, r.to_be_level, r.importance)
  )
  
  // Promedio de weighted gaps
  const weightedGapAvg = weightedGaps.reduce((a, b) => a + b, 0) / weightedGaps.length
  
  // Convertir a maturity index
  const maturityIndex = convertWeightedGapToMaturityIndex(weightedGapAvg)
  
  // Calcular scores legacy (para compatibilidad)
  const asIsScores = dimensionResponses.map(r => levelToScore(r.as_is_level))
  const toBeScores = dimensionResponses.map(r => levelToScore(r.to_be_level))
  
  const asIsScore = asIsScores.reduce((a, b) => a + b, 0) / asIsScores.length
  const toBeScore = toBeScores.reduce((a, b) => a + b, 0) / toBeScores.length

  return {
    dimension_id: dimensionId,
    dimension_name: dimensionId,
    maturity_index: maturityIndex,
    weighted_gap_avg: weightedGapAvg,
    as_is_score: asIsScore,
    to_be_score: toBeScore,
    gap: toBeScore - asIsScore,
    weight: 1/6  // TODOS IGUALES
  }
}

/**
 * Calcula score global usando nueva metodología
 * TODOS LOS PESOS SON IGUALES (1/6)
 */
export function calculateGlobalScore(
  dimensionScores: DimensionScore[]
): number {
  if (dimensionScores.length === 0) return 0
  
  // Promedio simple de maturity indexes
  const totalMaturity = dimensionScores.reduce(
    (sum, dim) => sum + dim.maturity_index,
    0
  )
  
  return totalMaturity / dimensionScores.length
}

/**
 * Calcula scores legacy (compatibilidad)
 * Usa AS-IS scores con pesos iguales
 */
export function calculateGlobalScoreLegacy(
  dimensionScores: DimensionScore[]
): number {
  // Promedio simple (todos los pesos iguales)
  const totalScore = dimensionScores.reduce(
    (sum, dim) => sum + dim.as_is_score,
    0
  )
  
  return totalScore / dimensionScores.length
}

/**
 * Calcula todos los scores de dimensiones
 */
export function calculateAllDimensionScores(
  responses: CriterionResponse[],
  criteria: Criterion[]
): DimensionScore[] {
  const dimensions = [
    { id: 'strategy', name: 'Estrategia' },
    { id: 'customer', name: 'Cliente' },
    { id: 'technology', name: 'Tecnología' },
    { id: 'operations', name: 'Operaciones' },
    { id: 'culture', name: 'Cultura' },
    { id: 'data', name: 'Datos' }
  ]

  return dimensions.map(dim => {
    const dimScore = calculateDimensionScore(responses, criteria, dim.id)
    return {
      ...dimScore,
      dimension_name: dim.name
    }
  })
}

// ============================================
// EFFORT CALCULATION (Sin cambios - funciona bien)
// ============================================

function calculateDeltaGap(gapLevels: number): number {
  if (gapLevels >= 3) return 0.10
  if (gapLevels === 2) return 0.05
  if (gapLevels === 1) return 0.0
  return -0.10
}

function calculateDeltaSize(numEmployees: number): number {
  if (numEmployees <= 10) return 0.05
  if (numEmployees <= 50) return 0.0
  return -0.05
}

function calculateDeltaMaturity(globalMaturity: number): number {
  // Ahora globalMaturity es 1-5, convertir a 0-100 para comparación
  const maturityPercent = maturityIndexToPercentage(globalMaturity)
  
  if (maturityPercent < 30) return 0.10
  if (maturityPercent <= 60) return 0.0
  return -0.05
}

function calculateDeltaSector(sector: string): number {
  const sectorLower = sector.toLowerCase()
  
  if (sectorLower.includes('manufactura') || 
      sectorLower.includes('industrial') ||
      sectorLower.includes('logística') ||
      sectorLower.includes('energía')) {
    return 0.05
  }
  
  if (sectorLower.includes('tecnología') ||
      sectorLower.includes('software') ||
      sectorLower.includes('digital') ||
      sectorLower.includes('it')) {
    return -0.05
  }
  
  return 0.0
}

function getEffortBase(criterionCode: string): number {
  const parts = criterionCode.split('.')
  if (parts.length < 2) return EFFORT_BASE_CATALOG.default
  
  const dimension = parseInt(parts[0])
  
  switch(dimension) {
    case 1: return 65
    case 2: return 60
    case 3: return 80
    case 4: return 65
    case 5: return 55
    case 6: return 85
    default: return 60
  }
}

function calculateImpact(gapLevels: number, importance: number): number {
  const gapNorm = gapLevels / 4
  const impact = (gapNorm * importance) / 5 * 100
  return Math.min(Math.max(impact, 0), 100)
}

function calculatePriorityScore(impact: number, effortFinal: number): number {
  if (effortFinal === 0) return impact
  return impact * (1 - effortFinal / 100)
}

function categorizeCriterion(impact: number, effort: number): EffortResult['category'] {
  if (impact >= 25 && effort <= 50) return 'Quick Win'
  if (impact >= 40 || (impact >= 25 && effort > 50)) return 'Transformacional'
  if (impact >= 15 && impact < 40 && effort <= 70) return 'Foundation'
  return 'Mantenimiento'
}

export function calculateCriterionEffort(
  response: CriterionResponse,
  criterion: Criterion,
  numEmployees: number,
  sector: string,
  globalMaturity: number  // Ahora 1-5
): EffortResult {
  const gapLevels = response.to_be_level - response.as_is_level
  const effortBase = getEffortBase(criterion.code)
  
  const deltaGap = calculateDeltaGap(gapLevels)
  const deltaSize = calculateDeltaSize(numEmployees)
  const deltaMaturity = calculateDeltaMaturity(globalMaturity)
  const deltaSector = calculateDeltaSector(sector)
  const deltaTotal = deltaGap + deltaSize + deltaMaturity + deltaSector
  
  const effortFinal = Math.min(Math.max(
    effortBase * (1 + deltaTotal),
    0
  ), 100)
  
  const impact = calculateImpact(gapLevels, response.importance)
  const priorityScore = calculatePriorityScore(impact, effortFinal)
  const category = categorizeCriterion(impact, effortFinal)

  return {
    criteria_id: response.criteria_id,
    gap_levels: gapLevels,
    effort_base: effortBase,
    delta_gap: deltaGap,
    delta_size: deltaSize,
    delta_maturity: deltaMaturity,
    delta_sector: deltaSector,
    delta_total: deltaTotal,
    effort_final: effortFinal,
    impact: impact,
    priority_score: priorityScore,
    category: category
  }
}

export function calculateAllEfforts(
  responses: CriterionResponse[],
  criteria: Criterion[],
  numEmployees: number,
  sector: string,
  globalMaturity: number  // Ahora 1-5
): EffortResult[] {
  return responses.map(response => {
    const criterion = criteria.find(c => c.id === response.criteria_id)
    if (!criterion) {
      throw new Error(`Criterion not found: ${response.criteria_id}`)
    }
    return calculateCriterionEffort(response, criterion, numEmployees, sector, globalMaturity)
  })
}

// ============================================
// ROADMAP GENERATION (Sin cambios)
// ============================================

export interface RoadmapPhase {
  phase: '30-days' | '60-days' | '90-days'
  criteria: Array<{
    criterion: Criterion
    response: CriterionResponse
    effort: EffortResult
  }>
}

export function generateRoadmap(
  responses: CriterionResponse[],
  criteria: Criterion[],
  efforts: EffortResult[]
): RoadmapPhase[] {
  const items = responses.map(response => {
    const criterion = criteria.find(c => c.id === response.criteria_id)!
    const effort = efforts.find(e => e.criteria_id === response.criteria_id)!
    return { criterion, response, effort }
  })

  const sorted = items.sort((a, b) => b.effort.priority_score - a.effort.priority_score)

  const quickWins = sorted.filter(item => item.effort.category === 'Quick Win').slice(0, 5)
  const foundation = sorted.filter(item => item.effort.category === 'Foundation').slice(0, 8)
  const transformacional = sorted.filter(item => item.effort.category === 'Transformacional').slice(0, 5)

  return [
    { phase: '30-days', criteria: quickWins },
    { phase: '60-days', criteria: foundation },
    { phase: '90-days', criteria: transformacional }
  ]
}

// ============================================
// UTILIDADES DE COMPARACIÓN (Para migración)
// ============================================

/**
 * Compara metodología vieja vs nueva
 * Útil para verificar migración
 */
export function compareMethodologies(
  responses: CriterionResponse[]
): {
  old_percentage: number
  new_maturity_index: number
  difference: string
} {
  // Método viejo: promedio AS-IS normalizado
  const oldScores = responses.map(r => levelToScore(r.as_is_level))
  const old_percentage = oldScores.reduce((a, b) => a + b, 0) / oldScores.length
  
  // Método nuevo: weighted gaps
  const weightedGaps = responses.map(r => 
    calculateWeightedGap(r.as_is_level, r.to_be_level, r.importance)
  )
  const avgWeightedGap = weightedGaps.reduce((a, b) => a + b, 0) / weightedGaps.length
  const new_maturity_index = convertWeightedGapToMaturityIndex(avgWeightedGap)
  
  return {
    old_percentage,
    new_maturity_index,
    difference: `${old_percentage.toFixed(1)}% vs ${new_maturity_index.toFixed(2)}/5`
  }
}
