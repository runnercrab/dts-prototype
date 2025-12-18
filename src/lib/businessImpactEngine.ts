// src/lib/businessImpactEngine.ts

// =============================
// Tipos base
// =============================

export type ImpactCategory =
  | "crm_sales"
  | "digital_strategy"
  | "people_culture"
  | "process_automation"
  | "technology_integration"
  | "data_analytics";

export interface CompanyProfile {
  sector: string;           // Ej: "Construcción", "Retail y E-commerce"
  numEmployees: number;     // Nº de empleados
  annualRevenue?: number;   // Facturación anual en €
  hourlyRate?: number;      // Coste medio hora (por defecto 30 €/h)
}

export interface CriterionInput {
  code: string;       // Ej: "4.2.3"
  asIsLevel: number;  // 1..5
  toBeLevel: number;  // 1..5
  importance: number; // 1..5 (peso que le da el CEO)
}

export interface CriterionImpact extends CriterionInput {
  impactCategory: ImpactCategory;
  gap: number;
  hoursSaved: number;
  revenueUpliftPct: number;
  monetaryImpact?: number | null;
}

export interface AssessmentImpactResult {
  company: CompanyProfile;
  criteriaImpacts: CriterionImpact[];
  totalHoursSaved: number;
  totalHoursSavedRange: { min: number; max: number };
  totalRevenueUpliftPct: number;
  totalRevenueUpliftRange: { min: number; max: number };
  totalMonetaryImpact?: number | null;
}

// =============================
// Mapeo código DMM → categoría Gapply
// =============================

export const IMPACT_CATEGORY_BY_PREFIX: Record<string, ImpactCategory> = {
  "1": "crm_sales",               // D1 Customer
  "2": "digital_strategy",        // D2 Strategy
  "3": "people_culture",          // D3 Culture / Organization
  "4": "process_automation",      // D4 Operations
  "5": "technology_integration",  // D5 Technology
  "6": "data_analytics"           // D6 Data
};

export function getImpactCategoryFromCode(code: string): ImpactCategory {
  const prefix = code.split(".")[0];
  const cat = IMPACT_CATEGORY_BY_PREFIX[prefix];
  if (!cat) {
    throw new Error(`Unknown DMM code prefix for code: ${code}`);
  }
  return cat;
}

// =============================
// Coeficientes base (heurísticos, inspirados en benchmarks)
// =============================

/**
 * Horas base ahorradas por nivel de gap y por 100 empleados.
 * Estos valores son heurísticos y se pueden ajustar en el futuro.
 */
export const BASE_HOURS_PER_LEVEL: Record<ImpactCategory, number> = {
  process_automation: 300,        // RPA / procesos → mayor impacto en horas
  technology_integration: 200,    // IT / integración / resiliencia
  data_analytics: 200,            // BI / datos → menos tiempo buscando info
  people_culture: 50,             // cultura / formación → impacto moderado
  digital_strategy: 80,           // estrategia → algo de eficiencia de gestión
  crm_sales: 80                   // eficiencia comercial (tiempo ventas)
};

/**
 * % de ventas base por nivel de gap.
 * Es un máximo teórico por nivel; luego se ajusta por gap, sector, madurez, etc.
 */
export const BASE_REVENUE_PCT_PER_LEVEL: Record<ImpactCategory, number> = {
  crm_sales: 1.5,                 // CRM / Customer → impacto directo en ventas
  digital_strategy: 0.8,          // estrategia → impacto indirecto
  data_analytics: 0.7,            // decisiones basadas en datos
  process_automation: 0.5,        // eficiencia operativa con algo de efecto en ventas
  technology_integration: 0.3,    // tecnología → soporte a negocio
  people_culture: 0.2             // cultura → impacto más difuso
};

// =============================
// Multiplicadores contextuales
// =============================

export function getSizeMultiplier(numEmployees: number): number {
  if (numEmployees <= 0 || Number.isNaN(numEmployees)) return 1.0;

  if (numEmployees < 10) return 0.5;      // micro
  if (numEmployees < 50) return 1.0;      // pequeña
  if (numEmployees < 250) return 2.5;     // mediana
  return 5.0;                             // grande
}

export function getMaturityMultiplier(asIsLevel: number): number {
  switch (Math.round(asIsLevel)) {
    case 1: return 1.5; // mucho margen
    case 2: return 1.3;
    case 3: return 1.0;
    case 4: return 0.7;
    case 5: return 0.3; // poco margen
    default: return 1.0;
  }
}

const SECTOR_HOURS_MULTIPLIERS: Record<string, number> = {
  "Tecnología y Software": 0.8,
  "Servicios Financieros": 1.0,
  "Retail y E-commerce": 1.1,
  "Industria y Manufactura": 1.3,
  "Construcción": 1.4,
  "Servicios B2B": 1.0,
  "Servicios B2C": 1.1,
  "Industria pesada": 1.2
};

const SECTOR_REVENUE_MULTIPLIERS: Record<string, number> = {
  "Retail y E-commerce": 1.3,
  "Servicios B2C": 1.2,
  "Servicios B2B": 1.0,
  "Servicios Financieros": 1.0,
  "Tecnología y Software": 1.0,
  "Industria y Manufactura": 0.9,
  "Industria pesada": 0.8,
  "Construcción": 0.9
};

export function getSectorHoursMultiplier(sector: string): number {
  return SECTOR_HOURS_MULTIPLIERS[sector] ?? 1.0;
}

export function getSectorRevenueMultiplier(sector: string): number {
  return SECTOR_REVENUE_MULTIPLIERS[sector] ?? 1.0;
}

// =============================
// Cálculo de impacto por criterio
// =============================

export function calculateHoursSavedPerCriterion(args: {
  category: ImpactCategory;
  gap: number;
  importance: number;
  numEmployees: number;
  asIsLevel: number;
  sector: string;
}): number {
  const { category, gap, importance, numEmployees, asIsLevel, sector } = args;
  if (gap <= 0) return 0;

  const baseHoursPerLevel = BASE_HOURS_PER_LEVEL[category];
  const gapFactor = gap / 4; // normalizado 0–1 (gap máximo = 4 niveles)
  const importanceFactor = importance / 5; // 1..5 → 0.2..1.0
  const sizeMult = getSizeMultiplier(numEmployees);
  const maturityMult = getMaturityMultiplier(asIsLevel);
  const sectorMult = getSectorHoursMultiplier(sector);

  const hours =
    baseHoursPerLevel *
    gapFactor *
    importanceFactor *
    sizeMult *
    maturityMult *
    sectorMult;

  return Math.max(0, hours);
}

export function calculateRevenueUpliftPerCriterion(args: {
  category: ImpactCategory;
  gap: number;
  importance: number;
  asIsLevel: number;
  sector: string;
}): number {
  const { category, gap, importance, asIsLevel, sector } = args;
  if (gap <= 0) return 0;

  const baseRevenuePctPerLevel = BASE_REVENUE_PCT_PER_LEVEL[category];
  if (!baseRevenuePctPerLevel || baseRevenuePctPerLevel <= 0) return 0;

  const gapFactor = gap / 4;
  const importanceFactor = importance / 5;
  const maturityMult = getMaturityMultiplier(asIsLevel);
  const sectorMult = getSectorRevenueMultiplier(sector);

  const pct =
    baseRevenuePctPerLevel *
    gapFactor *
    importanceFactor *
    maturityMult *
    sectorMult;

  return Math.max(0, pct);
}

export function calculateMonetaryImpact(args: {
  hoursSaved: number;
  revenueUpliftPct: number;
  annualRevenue?: number;
  hourlyRate?: number;
}): number | null {
  const { hoursSaved, revenueUpliftPct, annualRevenue, hourlyRate = 30 } = args;

  const costSavings = Math.max(0, hoursSaved) * hourlyRate;
  let revenueIncrease = 0;

  if (annualRevenue && annualRevenue > 0) {
    revenueIncrease = annualRevenue * (revenueUpliftPct / 100);
  }

  const total = costSavings + revenueIncrease;
  if (!Number.isFinite(total) || total <= 0) return null;
  return total;
}

// =============================
// Agregado a nivel de assessment
// =============================

export function computeAssessmentImpact(
  company: CompanyProfile,
  criteria: CriterionInput[]
): AssessmentImpactResult {
  const { numEmployees, sector, annualRevenue, hourlyRate } = company;

  const criteriaImpacts: CriterionImpact[] = criteria.map((c) => {
    const gap = Math.max(0, c.toBeLevel - c.asIsLevel);
    const category = getImpactCategoryFromCode(c.code);

    const hoursSaved = calculateHoursSavedPerCriterion({
      category,
      gap,
      importance: c.importance,
      numEmployees,
      asIsLevel: c.asIsLevel,
      sector
    });

    const revenueUpliftPct = calculateRevenueUpliftPerCriterion({
      category,
      gap,
      importance: c.importance,
      asIsLevel: c.asIsLevel,
      sector
    });

    const monetaryImpact = calculateMonetaryImpact({
      hoursSaved,
      revenueUpliftPct,
      annualRevenue,
      hourlyRate
    });

    return {
      ...c,
      impactCategory: category,
      gap,
      hoursSaved,
      revenueUpliftPct,
      monetaryImpact
    };
  });

  // Sumas crudas
  const totalHoursRaw = criteriaImpacts.reduce(
    (acc, c) => acc + c.hoursSaved,
    0
  );
  const totalRevenuePctRaw = criteriaImpacts.reduce(
    (acc, c) => acc + c.revenueUpliftPct,
    0
  );
  const totalMonetaryImpactRaw = criteriaImpacts.reduce(
    (acc, c) => acc + (c.monetaryImpact ?? 0),
    0
  );

  // Límites realistas
  const totalHoursCapacity = Math.max(0, numEmployees) * 1600; // 1.600 h/año por persona
  const maxHours = totalHoursCapacity * 0.15; // tope 15% del tiempo total
  const totalHoursSaved = Math.min(totalHoursRaw, maxHours);

  const maxRevenuePct = 12; // tope 12% mejora de ventas potencial
  const totalRevenueUpliftPct = Math.min(totalRevenuePctRaw, maxRevenuePct);

  // Rango (para no dar falsa precisión)
  const totalHoursSavedRange = {
    min: Math.round(totalHoursSaved * 0.8),
    max: Math.round(totalHoursSaved * 1.2)
  };

  const totalRevenueUpliftRange = {
    min: parseFloat((totalRevenueUpliftPct * 0.7).toFixed(1)),
    max: parseFloat((totalRevenueUpliftPct * 1.3).toFixed(1))
  };

  const totalMonetaryImpact =
    totalMonetaryImpactRaw > 0 ? Math.round(totalMonetaryImpactRaw) : null;

  return {
    company,
    criteriaImpacts,
    totalHoursSaved: Math.round(totalHoursSaved),
    totalHoursSavedRange,
    totalRevenueUpliftPct: parseFloat(totalRevenueUpliftPct.toFixed(1)),
    totalRevenueUpliftRange,
    totalMonetaryImpact
  };
}
