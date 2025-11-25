// ============================================
// SCORING & EFFORT CALCULATION UTILITIES
// Basado en TM Forum DMM v5.1 + DTS Methodology
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
  as_is_score: number
  to_be_score: number
  gap: number
  weight: number
  weighted_score: number
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

// Pesos oficiales TM Forum DMM v5.1
export const DIMENSION_WEIGHTS: Record<string, number> = {
  'strategy': 0.20,
  'customer': 0.15,
  'technology': 0.15,
  'operations': 0.15,
  'culture': 0.15,
  'data': 0.20
}

// Effort base por tipo de acción (simplificado - en producción vendría de BD)
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
// SCORING FUNCTIONS (TM Forum DMM v5.1)
// ============================================

/**
 * Convierte nivel TM Forum (1-5) a escala 0-100
 * Nivel 1 (Inicial) = 0
 * Nivel 2 (Emergente) = 25
 * Nivel 3 (Definido) = 50
 * Nivel 4 (Gestionado) = 75
 * Nivel 5 (Optimizado) = 100
 */
export function levelToScore(level: number): number {
  if (level < 1) return 0
  if (level > 5) return 100
  return (level - 1) * 25
}

/**
 * Calcula el score de una subdimensión
 * Promedio de los scores de sus criterios
 */
export function calculateSubdimensionScore(
  responses: CriterionResponse[],
  subdimensionId: string,
  useToBeValues: boolean = false
): number {
  const subdimResponses = responses.filter(r => {
    // Necesitamos matchear por subdimension - asumimos que criteria_id contiene info
    // En producción, esto vendría de un join con la tabla criteria
    return true // Por ahora calculamos con todos
  })

  if (subdimResponses.length === 0) return 0

  const totalScore = subdimResponses.reduce((sum, r) => {
    const level = useToBeValues ? r.to_be_level : r.as_is_level
    return sum + levelToScore(level)
  }, 0)

  return totalScore / subdimResponses.length
}

/**
 * Calcula el score de una dimensión
 * Promedio ponderado de sus subdimensiones
 */
export function calculateDimensionScore(
  responses: CriterionResponse[],
  criteria: Criterion[],
  dimensionId: string,
  useToBeValues: boolean = false
): number {
  // Filtrar criterios de esta dimensión
  const dimensionCriteria = criteria.filter(c => c.dimension_id === dimensionId)
  const dimensionCriteriaIds = dimensionCriteria.map(c => c.id)
  
  // Filtrar respuestas de esta dimensión
  const dimensionResponses = responses.filter(r => 
    dimensionCriteriaIds.includes(r.criteria_id)
  )

  if (dimensionResponses.length === 0) return 0

  // Calcular promedio de scores
  const totalScore = dimensionResponses.reduce((sum, r) => {
    const level = useToBeValues ? r.to_be_level : r.as_is_level
    return sum + levelToScore(level)
  }, 0)

  return totalScore / dimensionResponses.length
}

/**
 * Calcula el score global (0-100)
 * Promedio ponderado de las 6 dimensiones según pesos TM Forum
 */
export function calculateGlobalScore(
  dimensionScores: DimensionScore[]
): number {
  const weightedSum = dimensionScores.reduce((sum, dim) => {
    return sum + (dim.as_is_score * dim.weight)
  }, 0)

  return weightedSum
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
    const asIsScore = calculateDimensionScore(responses, criteria, dim.id, false)
    const toBeScore = calculateDimensionScore(responses, criteria, dim.id, true)
    const weight = DIMENSION_WEIGHTS[dim.id] || 0.15

    return {
      dimension_id: dim.id,
      dimension_name: dim.name,
      as_is_score: asIsScore,
      to_be_score: toBeScore,
      gap: toBeScore - asIsScore,
      weight: weight,
      weighted_score: asIsScore * weight
    }
  })
}

// ============================================
// EFFORT CALCULATION (DTS Methodology)
// ============================================

/**
 * Calcula Δ_gap según tamaño de brecha
 */
function calculateDeltaGap(gapLevels: number): number {
  if (gapLevels >= 3) return 0.10
  if (gapLevels === 2) return 0.05
  if (gapLevels === 1) return 0.0
  return -0.10 // No hay cambio o negativo
}

/**
 * Calcula Δ_size según número de empleados
 */
function calculateDeltaSize(numEmployees: number): number {
  if (numEmployees <= 10) return 0.05
  if (numEmployees <= 50) return 0.0
  return -0.05 // Empresas grandes tienen más recursos
}

/**
 * Calcula Δ_maturity según madurez digital global
 */
function calculateDeltaMaturity(globalMaturity: number): number {
  if (globalMaturity < 30) return 0.10
  if (globalMaturity <= 60) return 0.0
  return -0.05 // Alta madurez facilita cambios
}

/**
 * Calcula Δ_sector según tipo de sector
 */
function calculateDeltaSector(sector: string): number {
  const sectorLower = sector.toLowerCase()
  
  // Sectores tradicionales/industriales
  if (sectorLower.includes('manufactura') || 
      sectorLower.includes('industrial') ||
      sectorLower.includes('logística') ||
      sectorLower.includes('energía')) {
    return 0.05
  }
  
  // Sectores digitales
  if (sectorLower.includes('tecnología') ||
      sectorLower.includes('software') ||
      sectorLower.includes('digital') ||
      sectorLower.includes('it')) {
    return -0.05
  }
  
  return 0.0 // Sectores neutros
}

/**
 * Obtiene effort base según el criterio
 * En producción vendría de BD con mapping real
 */
function getEffortBase(criterionCode: string): number {
  // Simplificado: asignar según dimensión y subdimensión
  const parts = criterionCode.split('.')
  if (parts.length < 2) return EFFORT_BASE_CATALOG.default
  
  const dimension = parseInt(parts[0])
  
  // Mapeo simplificado por dimensión
  switch(dimension) {
    case 1: return 65 // Strategy
    case 2: return 60 // Customer
    case 3: return 80 // Technology (más complejo)
    case 4: return 65 // Operations
    case 5: return 55 // Culture (más soft)
    case 6: return 85 // Data (muy complejo)
    default: return 60
  }
}

/**
 * Calcula Impact de un criterio
 * Impact = (Gap_normalized * Importance) / 5 * 100
 */
function calculateImpact(gapLevels: number, importance: number): number {
  const gapNorm = gapLevels / 4 // Max gap = 4 (de nivel 1 a 5)
  const impact = (gapNorm * importance) / 5 * 100
  return Math.min(Math.max(impact, 0), 100)
}

/**
 * Calcula Priority Score
 * PriorityScore = Impact × (1 - Effort_final/100)
 */
function calculatePriorityScore(impact: number, effortFinal: number): number {
  if (effortFinal === 0) return impact
  return impact * (1 - effortFinal / 100)
}

/**
 * Categoriza un criterio según Impact y Effort
 * Umbrales ajustados para datos reales (gaps pequeños)
 */
function categorizeCriterion(impact: number, effort: number): EffortResult['category'] {
  // Quick Win: Impacto decente, esfuerzo bajo
  if (impact >= 25 && effort <= 50) return 'Quick Win'
  
  // Transformacional: Alto impacto O (impacto medio con alto esfuerzo)
  if (impact >= 40 || (impact >= 25 && effort > 50)) return 'Transformacional'
  
  // Foundation: Impacto medio, esfuerzo moderado
  if (impact >= 15 && impact < 40 && effort <= 70) return 'Foundation'
  
  // Mantenimiento: Bajo impacto
  return 'Mantenimiento'
}

/**
 * Calcula el effort completo para un criterio
 */
export function calculateCriterionEffort(
  response: CriterionResponse,
  criterion: Criterion,
  numEmployees: number,
  sector: string,
  globalMaturity: number
): EffortResult {
  // 1. Gap
  const gapLevels = response.to_be_level - response.as_is_level

  // 2. Effort base
  const effortBase = getEffortBase(criterion.code)

  // 3. Deltas
  const deltaGap = calculateDeltaGap(gapLevels)
  const deltaSize = calculateDeltaSize(numEmployees)
  const deltaMaturity = calculateDeltaMaturity(globalMaturity)
  const deltaSector = calculateDeltaSector(sector)
  const deltaTotal = deltaGap + deltaSize + deltaMaturity + deltaSector

  // 4. Effort final
  const effortFinal = Math.min(Math.max(
    effortBase * (1 + deltaTotal),
    0
  ), 100)

  // 5. Impact
  const impact = calculateImpact(gapLevels, response.importance)

  // 6. Priority Score
  const priorityScore = calculatePriorityScore(impact, effortFinal)

  // 7. Category
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

/**
 * Calcula efforts para todos los criterios
 */
export function calculateAllEfforts(
  responses: CriterionResponse[],
  criteria: Criterion[],
  numEmployees: number,
  sector: string,
  globalMaturity: number
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
// ROADMAP GENERATION
// ============================================

export interface RoadmapPhase {
  phase: '30-days' | '60-days' | '90-days'
  criteria: Array<{
    criterion: Criterion
    response: CriterionResponse
    effort: EffortResult
  }>
}

/**
 * Genera roadmap 30/60/90 días basado en PriorityScore
 */
export function generateRoadmap(
  responses: CriterionResponse[],
  criteria: Criterion[],
  efforts: EffortResult[]
): RoadmapPhase[] {
  // Combinar toda la información
  const items = responses.map(response => {
    const criterion = criteria.find(c => c.id === response.criteria_id)!
    const effort = efforts.find(e => e.criteria_id === response.criteria_id)!
    return { criterion, response, effort }
  })

  // Ordenar por priority score descendente
  const sorted = items.sort((a, b) => b.effort.priority_score - a.effort.priority_score)

  // Distribuir en fases
  // 30 días: Top Quick Wins (effort bajo, impact alto)
  const quickWins = sorted.filter(item => item.effort.category === 'Quick Win').slice(0, 5)
  
  // 60 días: Foundation projects (impact medio, effort moderado)
  const foundation = sorted
    .filter(item => item.effort.category === 'Foundation')
    .slice(0, 8)
  
  // 90 días: Transformacional (alto impacto, alto esfuerzo)
  const transformacional = sorted
    .filter(item => item.effort.category === 'Transformacional')
    .slice(0, 5)

  return [
    { phase: '30-days', criteria: quickWins },
    { phase: '60-days', criteria: foundation },
    { phase: '90-days', criteria: transformacional }
  ]
}
