# MVP12 — Criterios e iniciativas (2–4 por criterio)

## Convención de IDs de iniciativa
- {criterion_code}.A, {criterion_code}.B, {criterion_code}.C, {criterion_code}.D
Ej: 6.1.1.A

## Tipos fijos de iniciativa
- Quick Win
- Base estructural
- Transformacional
- Mantenimiento

## Campos mínimos de iniciativa (resumen)
- id (uuid)
- code (6.1.1.A)
- criterion_code (6.1.1)
- type (Quick Win | Base estructural | Transformacional | Mantenimiento)
- category (BASE | AMPLIFIER | MAINTENANCE)
- title (CEO-friendly)
- description (qué se hace)
- owner_role
- effort_base (1..5)
- effort_final (0..100) + weeks_range (min/max)
- impact_hours_base (horas/mes)
- impact_hours_final (horas/mes)
- impact_eur_range (si revenue_range)
- dependencies (array codes)
- status, due_date, evidence_note/url, last_update_at

---

## 1.1.1
Iniciativas:
- 1.1.1.A — Base estructural — "Unificar historial y decisiones (single source of truth)"
- 1.1.1.B — Quick Win — "Plantilla estándar de seguimiento semanal"
- 1.1.1.C — Transformacional — "Automatizar captura de incidencias y decisiones (workflow)"

## 1.1.2
Iniciativas:
- 1.1.2.A — Base estructural — "Definir responsables por proceso y RACI mínimo"
- 1.1.2.B — Mantenimiento — "Revisión mensual de responsabilidades"
- 1.1.2.C — Quick Win — "Checklist de handover para cambios"

## 2.1.3
Iniciativas:
- 2.1.3.A — Base estructural — "Definir embudo comercial y métricas mínimas"
- 2.1.3.B — Quick Win — "Dashboard semanal de pipeline"
- 2.1.3.C — Transformacional — "Automatizar lead routing + SLA respuesta"

## 2.5.4
Iniciativas:
- 2.5.4.A — Base estructural — "Estandarizar atención al cliente: SLAs y categorías"
- 2.5.4.B — Quick Win — "Macros/plantillas de respuesta"
- 2.5.4.C — Transformacional — "Autoservicio/FAQ + deflexión de tickets"

## 3.1.1
Iniciativas:
- 3.1.1.A — Base estructural — "Inventario de sistemas y propietarios"
- 3.1.1.B — Quick Win — "Mapa simple de integraciones"
- 3.1.1.C — Transformacional — "Roadmap de modernización por dominios"

## 4.1.1
Iniciativas:
- 4.1.1.A — Base estructural — "Estandarizar proceso operativo crítico"
- 4.1.1.B — Mantenimiento — "Auditoría mensual de cumplimiento"
- 4.1.1.C — Transformacional — "Automatización del proceso (RPA/API)"

## 4.2.2
Iniciativas:
- 4.2.2.A — Base estructural — "Definir KPIs operativos + dueño por KPI"
- 4.2.2.B — Quick Win — "Reunión semanal de métricas (30 min)"
- 4.2.2.C — Transformacional — "Alertas automáticas por desviación"

## 5.1.1
Iniciativas:
- 5.1.1.A — Base estructural — "Modelo mínimo de adopción (formación + comunicación)"
- 5.1.1.B — Quick Win — "Microformaciones (15 min) para herramienta crítica"
- 5.1.1.C — Mantenimiento — "Pulse survey mensual"

## 6.1.1
Iniciativas:
- 6.1.1.A — Base estructural — "Definir fuentes de datos y propietario"
- 6.1.1.B — Quick Win — "Eliminar duplicados / normalizar campos clave"
- 6.1.1.C — Transformacional — "Modelo de datos mínimo + gobierno"

## 6.2.1
Iniciativas:
- 6.2.1.A — Base estructural — "Calidad de datos: reglas mínimas (completitud/consistencia)"
- 6.2.1.B — Mantenimiento — "Revisión semanal de calidad"
- 6.2.1.C — Transformacional — "Observabilidad de datos + alertas"

NOTA: Faltan los criterios 3.4.1 y la 5.5.1