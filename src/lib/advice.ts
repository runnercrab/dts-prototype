// src/lib/advice.ts
export type Dimension =
  | 'Estrategia' | 'Procesos' | 'Personas'
  | 'Tecnología' | 'Datos' | 'Cliente'

export function adviceFor(dim: Dimension, val: number): string[] {
  // 0–3 muy bajo, 4–6 medio, 7–8 bueno, 9–10 líder
  if (val <= 3) {
    switch (dim) {
      case 'Estrategia':  return ['Define visión digital 12–24m', '3 OKR medibles ligados a negocio', 'Nombra sponsor ejecutivo'];
      case 'Procesos':    return ['Mapea 3 procesos core (AS-IS)', 'Estandariza y prioriza quick wins', 'Tablero de métricas operativas'];
      case 'Personas':    return ['Plan de upskilling 8–12h (datos/IA)', 'Roles/RACI claros', 'Crea “champions” por área'];
      case 'Tecnología':  return ['Assessment de plataforma y seguridad', 'Reduce deuda técnica crítica', 'CI/CD básico'];
      case 'Datos':       return ['Diccionario de métricas críticas', 'Data owner por dominio', 'Dashboard piloto con fuentes confiables'];
      case 'Cliente':     return ['Instrumenta NPS/CSAT en 1–2 journeys', 'Feedback cualitativo', 'Cierre de loop con mejoras'];
    }
  }
  if (val <= 6) {
    switch (dim) {
      case 'Estrategia':  return ['Roadmap trimestral', 'KPIs digitales en comité', 'Presupuesto para acciones clave'];
      case 'Procesos':    return ['Automatiza tareas repetitivas', 'SOPs/controles', 'Mide TAT y tasa de error'];
      case 'Personas':    return ['Rutas de carrera digitales', 'Prácticas con casos reales', 'Mide adopción y satisfacción'];
      case 'Tecnología':  return ['Consolida herramientas', 'Observabilidad y backups', 'Plan de modernización por dominios'];
      case 'Datos':       return ['Calidad y linaje', 'Data hub central', 'Modelos descriptivos de negocio'];
      case 'Cliente':     return ['Journeys omnicanal', 'Segmentación y personalización', 'Panel de experiencia en tiempo real'];
    }
  }
  if (val <= 8) {
    switch (dim) {
      case 'Estrategia':  return ['Explora valor con IA', 'OKR por squads, governance ágil', 'Benchmark continuo'];
      case 'Procesos':    return ['Minería de procesos', 'SLA/OLA con alertas', 'Kaizen mensual con data'];
      case 'Personas':    return ['Comunidades de práctica', 'Incentivos ligados a métricas', 'Contrata perfiles gap'];
      case 'Tecnología':  return ['Arquitectura modular/event-driven', 'Zero-trust/secret management', 'FinOps (cost control)'];
      case 'Datos':       return ['Predictivos en producción', 'Catálogo/marketplace de datos', 'MLOps ligero'];
      case 'Cliente':     return ['Test A/B continuo', 'Propensión y churn', 'Cohortes y CLV en comité'];
    }
  }
  // 9–10
  switch (dim) {
    case 'Estrategia':  return ['Alianzas/ventures', 'Comunica casos de éxito', 'Amplía portafolio de innovación'];
    case 'Procesos':    return ['Automation-first por defecto', 'COE de excelencia operativa', 'Benchmark trimestral de eficiencia'];
    case 'Personas':    return ['Liderazgo digital', 'Mentoría y rotaciones', 'Marca empleadora tech'];
    case 'Tecnología':  return ['Plataforma como producto', 'Capas reutilizables por dominios', 'Roadmap con usuarios'];
    case 'Datos':       return ['Democratiza IA generativa', 'SLAs de datos (Data as Product)', 'Gobierno federado maduro'];
    case 'Cliente':     return ['Experiencias proactivas con IA', 'DesignOps/ResearchOps', 'Comunidades y co-creación'];
  }
}
