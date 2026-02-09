# DTS – Architecture (Source of Truth)

**Versión:** 2.0 — 9 febrero 2026

---

## Qué es DTS

DTS (Gapply) es un SaaS que convierte un diagnóstico de madurez digital en decisiones ejecutables:
diagnóstico → resultados → frenos → priorización → programas → acciones → roadmap → seguimiento.

**Versión activa: V1** — Diagnóstico CEO-30 + Scoring + Frenos + Resumen ejecutivo.

## Principios no negociables

- Backend/DB es la fuente de verdad (scoring, frenos, priorización, roadmap, tracking).
- Frontend solo pinta (renderiza payloads ya calculados). NO calcula. NO filtra. NO reordena.
- Pack-aware: cada assessment tiene `pack` y ese pack define criterios.
- Idempotencia: todo SQL re-ejecutable sin romper nada.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes (runtime Node.js) |
| DB | Supabase Postgres + RPCs |
| Hosting | Vercel |
| Repo | github.com/runnercrab/dts-prototype |

## Versiones

| Versión | Pack | Criterios | Estado |
|---------|------|-----------|--------|
| **V1** | `dts_ceo30_v1` | 30 (6 dim × 5) | **Producción** |
| Legacy | `tmf_mvp12_v2` | 12 | Mantenimiento |
| Legacy | `tmf_full_v1` | 129 | Mantenimiento |

---

## ⭐ DTS V1 — Sistema Activo

### Fases V1

```
[0] Home          → CTA "Empezar Diagnóstico" (anónimo, sin auth)
[1] Diagnóstico   → 30 preguntas CEO, escala 1-5, agrupadas por dimensión
[2] Resultados    → Score global + 6 dimensiones + Top 3 frenos + Resumen CEO
```

**Fases futuras (V2+):** Programas → Acciones → Roadmap → Seguimiento

### Dimensiones V1

| Código | Nombre | Criterios |
|--------|--------|-----------|
| EST | Estrategia | 5 |
| OPE | Operaciones | 5 |
| PER | Personas y decisiones | 5 |
| DAT | Datos e información | 5 |
| TEC | Tecnología | 5 |
| GOB | Gobierno y control | 5 |

### Flujo de datos V1

```
                    ┌─────────────────────────────────────────┐
                    │           SUPABASE (DB)                  │
                    │                                         │
  [Home]            │  dts_v1_create_assessment(pack)         │
  POST /api/dts/    │    → INSERT dts_assessments             │
  list-questions ───┤    → SELECT 30 criterios del pack       │
                    │    → SELECT respuestas existentes        │
                    │    → RETURN { assessment_id, questions } │
                    │                                         │
  [Diagnóstico]     │  dts_v1_upsert_response(...)            │
  POST /api/dts/    │    → UPSERT dts_responses               │
  upsert-response ──┤    → RETURN ok                          │
                    │                                         │
  [Resultados]      │  dts_v1_results(assessment_id)          │
  GET /api/dts/     │    → CALC scores (avg of avgs)          │
  results/v1 ───────┤    → DETECT frenos (3 reglas)           │
                    │    → MATCH templates CEO                │
                    │    → MATCH resumen por banda             │
                    │    → RETURN payload completo             │
                    └─────────────────────────────────────────┘
```

### RPCs V1

| RPC | Input | Output | Uso |
|-----|-------|--------|-----|
| `dts_v1_results(uuid)` | assessment_id | Payload completo (scores + frenos + resumen) | Resultados |
| `dts_v1_create_assessment(text)` | pack key | assessment_id + 30 questions | Home/Crear |
| `dts_v1_list_questions(uuid)` | assessment_id | questions + existing responses | Diagnóstico |
| `dts_v1_upsert_response(uuid,uuid,int,text)` | assessment_id, criteria_id, level, notes | ok | Diagnóstico |

### API Routes V1

```
src/app/api/dts/
├── list-questions/route.ts      → POST: crea assessment + lista preguntas
├── upsert-response/route.ts     → POST: guarda respuesta (as_is_level, as_is_notes)
└── results/v1/route.ts          → GET:  llama dts_v1_results → payload completo
```

### Frontend Pages V1

```
src/app/dts/
├── page.tsx                              → Home (hero + CTA)
├── diagnostico/[assessmentId]/page.tsx   → 30 preguntas + progress map
└── resultados/[assessmentId]/page.tsx    → Dashboard CEO
```

**Componentes compartidos:**
- `DtsSidebar` — sidebar con logo Gapply + navegación por fases (usado en diagnóstico Y resultados)
- `public/icons/` — PNGs por dimensión (estrategia.png, operaciones.png, etc.)

### Scoring V1 (Congelado)

```
Criterio   = as_is_level (1-5)
Dimensión  = AVG(criterios de esa dimensión)
Global     = AVG(todas las dimensiones)          ← equal weight, NO pesos TMF
Score 0-100 = ROUND(((score_1_5 - 1) / 4) × 100)
```

### Motor de Frenos V1 (Congelado)

**Detección:**

| Tipo | Regla | Prioridad |
|------|-------|-----------|
| CRITICO | criterio con `as_is_level = 1` | 1 |
| ESTRUCTURAL | dim avg ≤ 2.0 OR (avg < 2.5 AND dispersión ≥ 2) | 2 |
| TRANSVERSAL | gap direccional (from_avg − to_avg) ≥ 1.0 | 3 |

**4 Pares transversales:** OPE→DAT, TEC→DAT, EST→DAT, PER→EST (threshold: 1.0)

**Selección greedy:**
- Máx 1 (CRITICO o ESTRUCTURAL) por dimensión — slot compartido
- Máx 1 transversal total — NO consume slot dimensional
- Total máx 3 frenos
- Orden: tipo_order ASC → dim_avg ASC → gap DESC → codes ASC

**Mensajes:** 16 plantillas data-driven en `dts_freno_message_templates` (6 CRITICO + 6 ESTRUCTURAL + 4 TRANSVERSAL). Cada una con titulo_es, mensaje_es, impacto_es, evidence_label_es, cta_es.

### Resumen Ejecutivo V1 (Congelado)

4 templates en `dts_resumen_templates`:

| Rango | band_code | Label |
|-------|-----------|-------|
| 1.00–1.99 | en_riesgo | En riesgo |
| 2.00–2.99 | fragil | Frágil |
| 3.00–3.99 | en_progreso | En progreso |
| 4.00–5.00 | solido | Sólido |

### Tablas V1

```sql
-- Motor de frenos (3 tablas)
dts_freno_types                → 3 filas: CRITICO, ESTRUCTURAL, TRANSVERSAL
dts_freno_pair_catalog         → 4 pares: OPE→DAT, TEC→DAT, EST→DAT, PER→EST
dts_freno_message_templates    → 16 plantillas CEO

-- Resumen ejecutivo (1 tabla)
dts_resumen_templates          → 4 rangos con mensajes CEO

-- Tablas core (preexistentes, usadas por V1)
frameworks                     → code = 'DTS'
framework_versions             → version = '1.0'
dts_dimensions                 → 6 dims: EST, OPE, PER, DAT, TEC, GOB
dts_subdimensions              → subdimensiones por dim
dts_criteria                   → 30 criterios con question_es, context_es, level_*_es
dts_packs                      → id = 'dts_ceo30_v1'
dts_pack_criteria_map          → 30 filas mapeo pack → criterios
dts_assessments                → pack, status, onboarding_data
dts_responses                  → assessment_id, criteria_id, as_is_level, as_is_notes
```

### Payload V1 (Contrato congelado)

```
dts_v1_results(uuid) → JSONB
├── meta         { rpc, version:"1.1", generated_at, rules }
├── context      { assessment_id, pack_key, pack_uuid, framework_version_id }
├── scores
│   ├── global        { score_1_5, score_0_100, band_code, level_label_es }
│   ├── by_dimension  [{ dimension_code, name_es, avg_1_5, avg_0_100, criteria_answered, criteria_total }]
│   └── by_criteria   [{ criteria_id, code, as_is_level, as_is_notes }]
├── frenos       [{ rank, freno_type_code, dimension_code, from/to, evidence, message }]
│                  message: { headline_es, body_es, impacto_es, evidence_label_es, cta_es }
└── resumen
    ├── foto_general  { titulo_es, mensaje_es, score_global_1_5, band_code, level_label_es }
    ├── cierre_es     "Hemos identificado los 3 frenos..."
    └── primer_paso   { titulo_es, freno_ref: { rank, freno_type_code, dimension_code } }
```

### Decisiones congeladas V1

**Se puede tocar sin descongelar:**
- Copy de plantillas CEO (textos)
- `is_active` en pares/plantillas (operacional)

**Requiere descongelar:**
- Thresholds, tipos, reglas de detección
- Orden de selección greedy
- Estructura del payload
- Schema de tablas

### SQL Source of Truth

| Fichero | Contenido |
|---------|-----------|
| `DTS_V1_SOURCE_OF_TRUTH.sql` | DDL (4 tablas) + Seeds (16 templates + 4 resumen) + RPC `dts_v1_results` + Verificación |
| `DTS_V1_FLOW_RPCS.sql` | RPCs de flujo: create_assessment, list_questions, upsert_response |

Ambos idempotentes. Ejecutar en orden en Supabase SQL Editor.

---

## 🗄️ Legacy — TMF Packs (Mantenimiento)

Los packs TMF (`tmf_mvp12_v2`, `tmf_full_v1`) usan el modelo TM Forum DMM v5.0.1 con RPCs y endpoints independientes. **NO colisionan con DTS V1.**

### Packs Legacy

| Pack | Criterios | Dimensiones | Pesos |
|------|-----------|-------------|-------|
| `tmf_mvp12_v2` (default legacy) | 12 | 6 TMF | Strategy 20%, Customer 15%, Technology 15%, Operations 15%, Culture 15%, Data 20% |
| `tmf_full_v1` | 129 | 6 TMF × 31 subdim | Igual |

### RPCs Legacy

| RPC | Fase |
|-----|------|
| `dts_results_v1` | Resultados TMF |
| `dts_results_overview_v2` | Overview TMF |
| `dts_results_programs_v2` | Programas TMF |
| `dts_recalc_assessment_scores` | Scoring TMF |
| `dts_recalc_dimension_scores` | Scoring TMF |
| `dts_activate_program_v1` | Ejecución |
| `dts_execution_gate_v1` | Ejecución |
| `dts_results_program_actions_v2` | Ejecución |
| `dts_action_set_status_v1` | Seguimiento |
| `dts_action_update_v1` | Seguimiento |
| `dts_action_validate_impact_v1` | Seguimiento |
| `dts_tracking_actions_scoped_v1` | Seguimiento |
| `dts_tracking_overview_v1` | Seguimiento |
| `dts_assessment_complete_v1` | Cierre |

### API Routes Legacy (completa)

```
src/app/api/dts/
├── assessment/
│   ├── create/route.ts          → DEFAULT_PACK: tmf_mvp12_v2
│   ├── get/route.ts
│   ├── onboarding/route.ts
│   ├── complete/route.ts
│   └── actions/
│       ├── route.ts
│       └── status/route.ts
├── criteria/route.ts
├── mvp12/criteria/route.ts
├── responses/
│   ├── route.ts
│   ├── get/route.ts
│   └── upsert/route.ts
├── score/
│   ├── get/route.ts
│   └── recalc/route.ts
├── results/
│   ├── executive-summary/route.ts
│   ├── frenos/route.ts
│   ├── initiatives/route.ts
│   ├── matriz/route.ts
│   ├── priorizacion/route.ts
│   ├── programs/route.ts
│   ├── program-actions/route.ts
│   ├── roadmap/route.ts
│   ├── seguimiento/route.ts
│   └── action-status/route.ts
├── execution/
│   ├── activate_program/route.ts
│   ├── activate_from_roadmap/route.ts
│   ├── close-program/route.ts
│   ├── gate/route.ts
│   └── program-results/route.ts
├── tracking/
│   ├── overview/route.ts
│   └── actions/
│       ├── route.ts
│       ├── status/route.ts
│       ├── update/route.ts
│       └── validate/route.ts
├── roadmap/activate-program/route.ts
├── chat/
│   ├── add/route.ts
│   ├── get/route.ts
│   ├── post/route.ts
│   ├── save/route.ts
│   └── messages/
│       ├── add/route.ts
│       └── list/route.ts
└── meta/dimensions/route.ts
```

---

## 🐛 Bugs conocidos y fixes

| Bug | Archivo | Fix | Impacto |
|-----|---------|-----|---------|
| Columna `notes` no existe | `api/dts/list-questions/route.ts:28` | Cambiar a `as_is_notes` | Diagnóstico arrancaba de cero al volver de resultados |
| Sidebar sin logo en resultados | `dts/resultados/[id]/page.tsx` | Usar `DtsSidebar` compartido | Logo "G" placeholder en vez de gapply-logo.png |

---

## 🔮 Roadmap

| Versión | Qué incluye | Cuándo |
|---------|-------------|--------|
| V1.1 | Demo pre-filled, Export PDF, benchmarking básico | Próximo |
| V2 | Programas + Acciones + Roadmap 90 días | Planificado |
| V3 | KPIs seguimiento + Repetición diagnóstico | Planificado |
| V4 | Standards-as-a-Service plugin + IA agéntica | Futuro |
