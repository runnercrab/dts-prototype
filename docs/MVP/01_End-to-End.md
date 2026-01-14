# MVP12 — End-to-End (Onboarding → Diagnóstico → Explain JSON v1.1 → Engines → Iniciativas → Matriz → Roadmap Q1/Q2/Q3 → SaaS mensual)

## Objetivo del MVP12
Construir una versión robusta, desacoplada y “SaaS-ready” para 12 criterios (subset), con:
- Onboarding + Diagnóstico guiado
- Explain JSON v1.1 por criterio (interpretación + acciones)
- Score Engine (ya estable)
- Effort Engine v1 (CEO-friendly: esfuerzo y semanas)
- Impact Engine v1 (horas + € si hay revenue_range)
- Iniciativas 2–4 por criterio (6.1.1.A, 6.1.1.B…)
- Matriz Impacto/Esfuerzo basada en iniciativas (no en criterios)
- Roadmap Q1/Q2/Q3 con dependencias
- Operating System mensual: estados, evidencia, check-in, KPIs

## Criterios incluidos (MVP12)
1.1.1, 1.1.2, 2.1.3, 2.5.4, 3.1.1, 3.4.1, 4.1.1, 4.2.2, 5.1.1,5.5.1, 6.1.1, 6.2.1

Referencia: ver docs/CRITERIA_MVP12.md

---

## Flujo funcional del producto (alto nivel)

### Fase 0 — Onboarding
Inputs mínimos:
- companyName, sector, size (empleados), revenue_range (si el cliente lo quiere)
- stack actual / nivel de digitalización percibido (simple)
Outputs:
- assessmentId
- contexto guardado (onboarding_data)
- baseline “business profile” para multiplicadores (Impact/Effort)

Pantalla:
- /diagnostico-full (onboarding integrado) o /onboarding separado

### Fase 1 — Diagnóstico (12 criterios)
Por cada criterio:
- As-Is (1..5) + confidence (low/medium/high) + notes
- To-Be (1..5) + timeframe (6m/1y/2y/3y+)
- importance (1..5)
- Chat por criterio persistido

Outputs inmediatos:
- dts_responses (persistidas)
- Score recalculado (dts_assessment_scores + dts_dimension_scores) via /api/dts/score/recalc

Pantalla:
- /diagnostico-full?MVP12=1 (modo MVP12)
- mapa progreso por subdimensión (solo subset)

### Fase 2 — Explain JSON v1.1 (por criterio)
Generas un “explain_json” por criterio:
- Interpretación de gap
- Qué significa en negocio
- Iniciativas sugeridas (2–4) con tipo y metadata
- Dependencias (Base antes que Amplificador)
- Entradas mínimas para engines (effort_base, impact_hours_base, revenue_range opcional)

Outputs:
- dts_explain (tabla o JSON en dts_responses.explain_json)

### Fase 3 — Engines v1 (Score + Effort + Impact)
Para cada iniciativa:
- Score Engine
- Effort: effort_base → effort_final + rango de semanas
- Impact: horas + € (si hay revenue_range)

Outputs:
- dts_initiatives (con effort_final, weeks_range, impact_hours, impact_eur_range)
- agregados opcionales por criterio/dimensión (para KPIs)

### Fase 4 — Priorización (Matriz Impacto/Esfuerzo)

- Los puntos en la matriz son iniciativas (no criterios)
- Cuadrantes:
  - Alto impacto / Bajo esfuerzo: Quick Wins
  - Alto impacto / Alto esfuerzo: Transformacionales
  - Bajo impacto / Bajo esfuerzo: Mantenimiento (si aplica)
  - Bajo impacto / Alto esfuerzo: cuestionar / postergar

Output:
- ranking priorizado + etiqueta de cuadrante
- lista de “Top 10 iniciativas Q1”

### Fase 5 — Roadmap Q1/Q2/Q3 + dependencias
Reglas:
- Base estructural antes que amplificadores (cuando aplique)
- Quick Wins primero si no rompen dependencias
- Mantenimiento en paralelo (capado)
Output:
- dts_roadmap_items (o view calculada) con quarter, order, dependencies

### Fase 6 — SaaS Mensual (Operating System)
El producto “vive”:
- cliente cambia estado, sube evidencia, deja nota
- DTS recalcula:
  - progreso
  - impacto conseguido vs pendiente
  - reorden roadmap (si bloqueos)
  - alertas pocas pero importantes
- check-in mensual (por defecto)

KPIs:
- % iniciativas done (Q1 actual)
- horas ahorradas estimadas (done)
- impacto € estimado (done, si revenue_range)
- nº bloqueadas + motivo
- velocidad (initiatives done por mes)

---

## Criterios Base vs Amplificador (regla)
- Base estructural: crea infraestructura/proceso/fundación (requisito para escalar)
- Amplificador: aumenta rendimiento sobre base existente

En cada criterio, las iniciativas se etiquetan:
- initiative_category = BASE | AMPLIFIER | MAINTENANCE
y se aplican dependencias BASE → AMPLIFIER.

---

## Definition of Done (MVP12)
1) Diagnóstico 12 criterios completo (persistencia ok)
2) Score get/recalc ok (ya ok)
3) Explain JSON v1.1 generado para los 10 criterios
4) 2–4 iniciativas por criterio creadas en BD
5) Effort Engine v1 calculado para todas las iniciativas
6) Impact Engine v1 calculado para todas las iniciativas (horas + € si revenue)
7) Pantallas: Matriz + Roadmap + SaaS mensual básico
8) Healthcheck endpoints ok

Ver documentos:
- docs/EXPLAIN_JSON_V1_1.md
- docs/EFFORT_ENGINE_V1.md
- docs/IMPACT_ENGINE_V1.md
- docs/ROADMAP_Q123.md
- docs/SAAS_MONTHLY_OPERATING_SYSTEM.md
- docs/FRONTEND_SCREENS_MVP12.md
