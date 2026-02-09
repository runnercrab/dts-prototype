# 📘 Documentación Técnica Completa — Gapply (DTS Platform)

**Versión:** 3.0
**Última actualización:** 9 de febrero de 2026
**Autor:** David Arias (Founder, Gapply)

---

## 🎯 Visión General

**Gapply** es una plataforma Standards-as-a-Service que democratiza frameworks complejos de transformación digital para PyMEs españolas. La plataforma implementa un modelo de diagnóstico propio basado en metodología DTS, con scoring automático, detección de frenos y resumen ejecutivo orientado a CEOs.

### Propuesta de Valor
- **Diagnóstico CEO-friendly**: 30 preguntas en lenguaje de negocio (~15 min), no jerga técnica
- **Motor de frenos automático**: Detección CRITICO / ESTRUCTURAL / TRANSVERSAL con mensajes accionables
- **Standards-as-a-Service**: Arquitectura escalable para múltiples frameworks (ISO 27001, GDPR, EU AI Act)
- **Backend-driven**: El frontend solo pinta lo que el backend calcula — cero lógica en cliente

### Evolución de Versiones
| Versión | Alcance | Estado |
|---------|---------|--------|
| **V1** | Diagnóstico 30 preguntas + Scoring + Frenos + Resumen CEO | **En producción** |
| V2 | Programas + Acciones + Roadmap 90 días | Planificado |
| V3 | KPIs de seguimiento + Repetición diagnóstico | Planificado |
| V4 | IA agéntica / Copiloto | Futuro |

---

## 🏗️ Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 App Router + TypeScript + Tailwind CSS |
| Backend | Next.js API Routes (runtime Node.js) |
| Base de datos | Supabase Postgres + RPCs |
| Hosting | Vercel |
| Dominio | gapply.io |
| Repositorio | github.com/runnercrab/dts-prototype |

### Principios No Negociables
1. **Backend es la fuente de verdad** — scoring, frenos, priorización, roadmap, tracking
2. **Frontend solo pinta** — renderiza payloads ya calculados, NO calcula, NO filtra, NO reordena
3. **Pack-aware** — cada assessment tiene un `pack` que define sus criterios
4. **Idempotencia** — todas las migraciones SQL son re-ejecutables sin romper nada

---

## 📐 Arquitectura DTS V1

### Flujo Completo

```
[1] Home → Crear Assessment (anónimo, sin auth)
    │   POST /api/dts/list-questions { pack: "dts_ceo30_v1" }
    │   → Crea assessment + devuelve 30 preguntas ordenadas
    ▼
[2] Diagnóstico → 30 preguntas CEO (6 dimensiones × 5 criterios)
    │   POST /api/dts/upsert-response { assessment_id, criteria_id, as_is_level }
    │   → Guarda respuesta 1-5 por criterio
    ▼
[3] Resultados → RPC dts_v1_results(assessment_id)
    │   → Payload único con scores + frenos + resumen
    │   → Frontend solo renderiza
    ▼
    ┌─────────────────────────────────────────────────┐
    │  RESUMEN EJECUTIVO                               │
    │  ├─ Foto general: título + mensaje + banda       │
    │  ├─ Score global (1-5) + Score por dimensión     │
    │  ├─ Top 3 frenos con mensajes CEO                │
    │  └─ Primer paso: CTA del freno #1                │
    └─────────────────────────────────────────────────┘
```

### Pack: `dts_ceo30_v1`

Framework propio DTS. Decision-centric, no customer-centric. Los packs TMF (`tmf_mvp12_v1`, `tmf_mvp12_v2`) son independientes y no se usan en V1.

---

## 📊 Modelo de Datos DTS V1

### 6 Dimensiones × 5 Criterios = 30 Preguntas

| Dim | Código | Nombre | Criterios |
|-----|--------|--------|-----------|
| 1 | EST | Estrategia | 5 preguntas sobre prioridades, decisiones, métricas, revisión, alineación |
| 2 | OPE | Operaciones | 5 preguntas sobre procesos, dependencias, escalabilidad, documentación, mejora |
| 3 | PER | Personas y decisiones | 5 preguntas sobre responsabilidad, aprendizaje, autonomía, capacitación, cultura |
| 4 | DAT | Datos e información | 5 preguntas sobre disponibilidad, calidad, uso en decisiones, gobernanza, automatización |
| 5 | TEC | Tecnología | 5 preguntas sobre alineación, integración, deuda técnica, capacidad, evolución |
| 6 | GOB | Gobierno y control | 5 preguntas sobre compliance, riesgos, auditoría, seguridad, mejora continua |

### Escala de Madurez (lo que ve el CEO)

| Nivel | Significado |
|-------|------------|
| 1 | Caos o inexistencia |
| 2 | Intención sin consistencia |
| 3 | **Funciona** (baseline sano) |
| 4 | **Se revisa y mejora activamente** |
| 5 | **Da ventaja competitiva real** |

Cada criterio tiene 5 descripciones específicas en español que guían la respuesta. Las preguntas están formuladas en lenguaje CEO, no técnico.

---

## 🗄️ Esquema de Base de Datos

### Tablas Core (preexistentes)

```
frameworks                    → { id, code:'DTS', name }
framework_versions            → { id, framework_id, version:'1.0' }
dts_dimensions                → { id, framework_version_id, code, name_es, icon }
dts_subdimensions             → { id, dimension_id, code, name_es }
dts_criteria                  → { id, subdimension_id, code, question_es, context_es, level_*_es }
dts_packs                     → { id:'dts_ceo30_v1', pack_uuid, name }
dts_pack_criteria_map         → { pack_uuid, criteria_id, display_order }
dts_assessments               → { id, pack, status, onboarding_data, created_at }
dts_responses                 → { id, assessment_id, criteria_id, as_is_level, as_is_notes }
```

### Tablas DTS V1 (Motor de Frenos + Resumen)

```
dts_freno_types               → 3 filas: CRITICO, ESTRUCTURAL, TRANSVERSAL
dts_freno_pair_catalog        → 4 pares direccionales: OPE→DAT, TEC→DAT, EST→DAT, PER→EST
dts_freno_message_templates   → 16 plantillas CEO (6 CRITICO + 6 ESTRUCTURAL + 4 TRANSVERSAL)
dts_resumen_templates         → 4 rangos: En riesgo / Frágil / En progreso / Sólido
```

### RPCs

| RPC | Función |
|-----|---------|
| `dts_v1_results(uuid)` | Payload único: scores + frenos + resumen ejecutivo |
| `dts_v1_create_assessment(text)` | Crea assessment con pack |
| `dts_v1_list_questions(uuid)` | Lista 30 preguntas con respuestas existentes |
| `dts_v1_upsert_response(uuid,uuid,int,text)` | Guarda/actualiza respuesta |

---

## ⚙️ Motor de Scoring

### Scoring V1 (Congelado)

```
Score por criterio  = as_is_level (1-5)
Score por dimensión = AVG(criterios de esa dimensión)
Score global        = AVG(todas las dimensiones)  ← equal weight
Score 0-100         = ROUND(((score_1_5 - 1) / 4) × 100)
```

**Nota:** V1 usa equal weight entre dimensiones (no los pesos TM Forum 20/15/15/15/15/20). Los pesos TMF se reservan para cuando se implemente el diagnóstico completo de 129 criterios.

### Bandas de Madurez

| Rango (1-5) | band_code | Label | Color |
|-------------|-----------|-------|-------|
| 1.00 – 1.99 | `en_riesgo` | En riesgo | Rojo |
| 2.00 – 2.99 | `fragil` | Frágil | Naranja |
| 3.00 – 3.99 | `en_progreso` | En progreso | Amarillo |
| 4.00 – 5.00 | `solido` | Sólido | Verde |

---

## 🚨 Motor de Frenos (Congelado)

### Reglas de Detección

| Tipo | Regla | Ejemplo |
|------|-------|---------|
| **CRITICO** | Cualquier criterio con `as_is_level = 1` | "No hay prioridades → bloqueo crítico en Estrategia" |
| **ESTRUCTURAL** | Dim avg ≤ 2.0 OR (avg < 2.5 AND dispersión ≥ 2) | "Operaciones no escala → debilidad estructural" |
| **TRANSVERSAL** | Gap direccional (from_avg − to_avg) ≥ threshold (1.0) | "Operación por delante de los datos" |

### 4 Pares Transversales Oficiales

```
OPE → DAT   (threshold: 1.0)
TEC → DAT   (threshold: 1.0)
EST → DAT   (threshold: 1.0)
PER → EST   (threshold: 1.0)
```

### Selección Greedy (Determinista)

- Máx 1 (CRITICO o ESTRUCTURAL) por dimensión — slot compartido
- Máx 1 transversal total — NO consume slot dimensional
- Total máx 3 frenos
- Orden: tipo_order ASC → dim_avg ASC → gap DESC → codes ASC

### Mensajes CEO

Cada freno tiene una plantilla data-driven (no GPT) con:
- `titulo_es` — headline del freno
- `mensaje_es` — explicación en lenguaje CEO
- `impacto_es` — consecuencia para el negocio
- `evidence_label_es` — etiqueta de evidencia
- `cta_es` — primer paso accionable

---

## 🖥️ Frontend (Páginas DTS V1)

### Estructura de Archivos

```
src/app/dts/
├── page.tsx                              → Home DTS V1 (hero + CTA "Empezar")
├── diagnostico/[assessmentId]/page.tsx   → 30 preguntas con progress map
├── resultados/[assessmentId]/page.tsx    → Dashboard CEO con scores + frenos
└── components/
    ├── DtsSidebar.tsx                    → Sidebar compartido (logo, navegación fases)
    └── diagnostico/                      → Componentes del diagnóstico
```

### API Routes V1

```
src/app/api/dts/
├── list-questions/route.ts    → GET: lista preguntas + respuestas existentes
├── upsert-response/route.ts   → POST: guarda respuesta (as_is_level + notes)
└── results/v1/route.ts        → GET: llama RPC dts_v1_results → payload completo
```

### Diseño

- **Tema:** Light theme corporativo, paleta monochrome Supabase-style
- **Color primario:** `#1e40af` (blue-800)
- **Iconos:** PNG por dimensión en `/public/icons/` (estrategia.png, operaciones.png, etc.)
- **Sidebar:** Componente compartido `DtsSidebar` con logo Gapply y navegación por fases
- **Responsive:** Mobile-first con Tailwind breakpoints

### Flujo de Navegación

```
Home (/) → [CTA: Empezar Diagnóstico]
  ↓
Diagnóstico (/dts/diagnostico/[id])
  • 30 preguntas agrupadas por dimensión
  • Progress bar por dimensión
  • Botón "Siguiente →" manual
  • Auto-advance al completar dimensión
  ↓
Resultados (/dts/resultados/[id])
  • Score global con ring SVG
  • 6 dimension cards con score individual
  • Top 3 frenos con color-coded cards
  • Resumen ejecutivo CEO
  • Link "Revisar diagnóstico" en sidebar
```

---

## 📄 Contrato JSON — Payload `dts_v1_results` (Congelado)

```json
{
  "meta": {
    "rpc": "dts_v1_results",
    "version": "1.1",
    "generated_at": "2026-02-09T...",
    "rules": { "scoring": "avg_of_avgs", "frenos_max": 3 }
  },
  "context": {
    "assessment_id": "uuid",
    "pack_key": "dts_ceo30_v1",
    "pack_uuid": "uuid",
    "framework_version_id": "uuid"
  },
  "scores": {
    "global": {
      "score_1_5": 2.73,
      "score_0_100": 43,
      "band_code": "fragil",
      "level_label_es": "Frágil"
    },
    "by_dimension": [
      {
        "dimension_code": "EST",
        "name_es": "Estrategia",
        "avg_1_5": 3.2,
        "avg_0_100": 55,
        "criteria_answered": 5,
        "criteria_total": 5
      }
    ],
    "by_criteria": [
      {
        "criteria_id": "uuid",
        "code": "EST.01",
        "as_is_level": 3,
        "as_is_notes": "..."
      }
    ]
  },
  "frenos": [
    {
      "rank": 1,
      "freno_type_code": "CRITICO",
      "dimension_code": "DAT",
      "from_dimension_code": null,
      "to_dimension_code": null,
      "evidence": { "criteria_code": "DAT.02", "as_is_level": 1 },
      "message": {
        "headline_es": "Bloqueo crítico en Datos e información",
        "body_es": "Los datos no están disponibles a tiempo...",
        "impacto_es": "Se decide con intuición...",
        "evidence_label_es": "Criterio en nivel 1",
        "cta_es": "Define el dato \"que siempre llega tarde\"..."
      }
    }
  ],
  "resumen": {
    "foto_general": {
      "titulo_es": "Tu empresa tiene intención digital pero no estructura",
      "mensaje_es": "Hay conciencia de que lo digital importa...",
      "score_global_1_5": 2.73,
      "band_code": "fragil",
      "level_label_es": "Frágil"
    },
    "cierre_es": "Hemos identificado los 3 frenos que más te están condicionando:",
    "primer_paso": {
      "titulo_es": "Define el dato \"que siempre llega tarde\"...",
      "freno_ref": { "rank": 1, "freno_type_code": "CRITICO", "dimension_code": "DAT" }
    }
  }
}
```

---

## 🔒 Decisiones Congeladas (V1)

### Se puede tocar sin descongelar
- Copy de plantillas CEO (textos en `dts_freno_message_templates`)
- `is_active` en pares/plantillas (operacional)

### Requiere descongelar
- Thresholds, tipos, reglas de detección
- Orden de selección greedy
- Estructura del payload
- Schema de tablas

---

## 📁 Source of Truth (SQL)

El fichero **`DTS_V1_SOURCE_OF_TRUTH.sql`** contiene todo en un único fichero idempotente:

| Sección | Contenido |
|---------|-----------|
| §1 DDL | 3 tablas de frenos + 1 tabla de resumen |
| §2 SEEDS | Tipos + Pares + 16 Plantillas CEO + 4 Resumen |
| §3 RPC | `dts_v1_results(uuid)` — payload único |
| §4 VERIFICACIÓN | Queries de validación post-deploy |
| §5 CONTRATO | Payload JSON congelado |
| §6 DECISIONES | Reglas congeladas |

**Prerequisitos:** frameworks (code='DTS'), framework_versions (version='1.0'), dts_packs, dts_pack_criteria_map, dts_criteria, dts_subdimensions, dts_dimensions.

**Ejecución:** Copiar y ejecutar EN ORDEN en Supabase SQL Editor.

### RPCs de Flujo (SQL separado)

El fichero **`DTS_V1_FLOW_RPCS.sql`** contiene las 3 RPCs de flujo:
- `dts_v1_create_assessment(text)` — crea assessment
- `dts_v1_list_questions(uuid)` — lista preguntas con respuestas
- `dts_v1_upsert_response(uuid,uuid,int,text)` — guarda respuesta

---

## 🐛 Bugs Conocidos y Fixes Aplicados

### Fix: `as_is_notes` vs `notes` (CRÍTICO)
**Archivo:** `src/app/api/dts/list-questions/route.ts` línea 28
**Bug:** `.select("criteria_id, as_is_level, notes")` — columna `notes` no existe
**Fix:** `.select("criteria_id, as_is_level, as_is_notes")`
**Impacto:** Sin este fix, el diagnóstico siempre arranca desde la pregunta 1 al volver de resultados.

### Fix: Sidebar compartido en Resultados
**Archivo:** `src/app/dts/resultados/[assessmentId]/page.tsx`
**Bug:** Sidebar hardcodeado con "G" placeholder en vez del logo
**Fix:** Reemplazar sidebar hardcodeado por componente `DtsSidebar`

---

## 🔮 Roadmap Técnico

### V1.1 — Quick improvements
- [ ] Demo pre-filled assessment para demos comerciales
- [ ] Export PDF de resultados
- [ ] Benchmarking básico por sector

### V2 — Programas y Acciones
- [ ] Generación de programas desde frenos
- [ ] Acciones concretas por programa
- [ ] Roadmap 90 días con priorización
- [ ] Dashboard de ejecución

### V3 — Seguimiento
- [ ] KPIs de tracking
- [ ] Repetición del diagnóstico (delta)
- [ ] Dashboard ejecutivo histórico

### V4 — Platform Scale
- [ ] Standards-as-a-Service: arquitectura plugin
- [ ] ISO 27001, GDPR, EU AI Act
- [ ] IA agéntica / Copiloto
- [ ] Multi-tenant

---

## 🏗️ Backend Legacy (TMF Packs)

El sistema mantiene los packs TMF originales (`tmf_mvp12_v1`, `tmf_mvp12_v2`) basados en TM Forum DMM v5.0.1 con 129 criterios, 6 dimensiones y 31 subdimensiones. Estos packs usan RPCs diferentes (`dts_results_v1`, `dts_results_overview_v2`) y NO colisionan con DTS V1.

### RPCs TMF (no tocar)

| RPC | Pack |
|-----|------|
| `dts_results_v1` | tmf_mvp12_v2 |
| `dts_results_overview_v2` | tmf_mvp12_v2 |
| `dts_results_programs_v2` | tmf_mvp12_v2 |
| `dts_recalc_assessment_scores` | tmf_* |
| `dts_recalc_dimension_scores` | tmf_* |

### API Routes Legacy (completa)

```
src/app/api/dts/
├── assessment/
│   ├── create/route.ts          → Crear assessment (DEFAULT_PACK: tmf_mvp12_v2)
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
│   ├── v1/route.ts              → ⚠️ DTS V1 results (nueva)
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
├── chat/
│   ├── add/route.ts
│   ├── get/route.ts
│   ├── post/route.ts
│   ├── save/route.ts
│   └── messages/
│       ├── add/route.ts
│       └── list/route.ts
├── meta/dimensions/route.ts
├── list-questions/route.ts      → ⚠️ DTS V1 (nueva)
└── upsert-response/route.ts    → ⚠️ DTS V1 (nueva)
```

---

## 🚀 Deployment

### Variables de Entorno (Vercel)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...
```

### Deploy

```bash
# Vercel CLI
vercel --prod

# O push a main (CI automático)
git push origin main
```

### DNS (gapply.io)

```
CNAME www → cname.vercel-dns.com
A     @   → 76.76.21.21
```

---

## 🤝 Equipo y Contactos

| Rol | Nombre | Contacto |
|-----|--------|----------|
| Founder & Lead Dev | David Arias | david@gapply.io |
| Mentor UX | Miguel (SECOT) | secot.org |
| Metodología TMF | Alfred Karlsson | TM Forum |

### Programas
- MIT Chief Digital Officer 2025
- SECOT Mentorship Program

---

## 📝 Changelog

### v3.0 — DTS V1 Completo (Feb 2026)
- Pack `dts_ceo30_v1`: 30 preguntas CEO × 6 dimensiones
- Motor de frenos: CRITICO + ESTRUCTURAL + TRANSVERSAL
- Resumen ejecutivo data-driven (sin GPT)
- RPC única `dts_v1_results` → payload congelado
- Frontend: Home + Diagnóstico + Resultados con Supabase-style design
- Sidebar compartido con navegación bidireccional
- Bug fixes: as_is_notes column, shared sidebar

### v2.0 — TMF Full + Effort Engine (Nov 2024)
- 129 criterios TM Forum DMM v5.0.1
- Scoring Engine oficial con pesos TMF
- Effort Calculation DTS contextualizado
- Roadmap 30/60/90 días
- Chat conversacional HeyGen + GPT-4o-mini
- Light theme corporativo

### v1.0 — TMF MVP12 (Sep 2024)
- Proof of concept con 12 criterios TMF
- Integración HeyGen avatar
- Supabase + Next.js baseline

---

**¿Dudas? ¿Sugerencias?**
📧 david@gapply.io
🔗 [LinkedIn](https://linkedin.com/in/davidarias) | [GitHub](https://github.com/runnercrab)
