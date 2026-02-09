# DTS – Architecture (Source of Truth)

## Qué es DTS
DTS es un SaaS que convierte un diagnóstico de madurez digital en decisiones ejecutables:
diagnóstico → resultados → frenos → priorización → programas → acciones → roadmap → seguimiento.

## Principios no negociables
- Backend/DB es la fuente de verdad (scoring, frenos, priorización, roadmap, tracking).
- Frontend solo pinta (renderiza payloads ya calculados).
- Pack-aware: cada assessment tiene `pack` y ese pack define criterios.

## Stack
- Frontend: Next.js App Router
- Backend: Next.js API Routes (runtime nodejs)
- DB: Supabase Postgres + RPCs
- Hosting: Vercel

## Fases
0) Create assessment  
1) Onboarding  
2) Diagnóstico (criterios + respuestas)  
3) Resultados (overview / frenos / priorización)  
4) Ejecución (programas → acciones → roadmap)  
5) Seguimiento  

---

## 🔁 Bloque generado automáticamente (NO editar)

<!-- GENERATED:START -->

## Backend real detectado

### RPCs versionadas en repo (Supabase)
- supabase/functions/dts_results_overview_v2.sql

### API Routes (Next.js)
- src/app/api/dts/assessment/actions/route.ts
- src/app/api/dts/assessment/actions/status/route.ts
- src/app/api/dts/assessment/complete/route.ts
- src/app/api/dts/assessment/create/route.ts
- src/app/api/dts/assessment/get/route.ts
- src/app/api/dts/assessment/onboarding/route.ts
- src/app/api/dts/chat/add/route.ts
- src/app/api/dts/chat/get/route.ts
- src/app/api/dts/chat/messages/add/route.ts
- src/app/api/dts/chat/messages/list/route.ts
- src/app/api/dts/chat/post/route.ts
- src/app/api/dts/chat/save/route.ts
- src/app/api/dts/criteria/route.ts
- src/app/api/dts/execution/activate_from_roadmap/route.ts
- src/app/api/dts/execution/activate_program/route.ts
- src/app/api/dts/execution/close-program/route.ts
- src/app/api/dts/execution/gate/route.ts
- src/app/api/dts/execution/program-results/route.ts
- src/app/api/dts/meta/dimensions/route.ts
- src/app/api/dts/mvp12/criteria/route.ts
- src/app/api/dts/responses/get/route.ts
- src/app/api/dts/responses/route.ts
- src/app/api/dts/responses/upsert/route.ts
- src/app/api/dts/results/action-status/route.ts
- src/app/api/dts/results/executive-summary/route.ts
- src/app/api/dts/results/frenos/route.ts
- src/app/api/dts/results/initiatives/route.ts
- src/app/api/dts/results/matriz/route.ts
- src/app/api/dts/results/priorizacion/route.ts
- src/app/api/dts/results/program-actions/route.ts
- src/app/api/dts/results/programs/route.ts
- src/app/api/dts/results/roadmap/route.ts
- src/app/api/dts/results/seguimiento/route.ts
- src/app/api/dts/results/v1/route.ts
- src/app/api/dts/roadmap/activate-program/route.ts
- src/app/api/dts/score/get/route.ts
- src/app/api/dts/score/recalc/route.ts
- src/app/api/dts/tracking/actions/route.ts
- src/app/api/dts/tracking/actions/status/route.ts
- src/app/api/dts/tracking/actions/update/route.ts
- src/app/api/dts/tracking/actions/validate/route.ts
- src/app/api/dts/tracking/overview/route.ts

### Packs (detectados en assessment/create)
- DEFAULT_PACK: `tmf_mvp12_v2`
- ALLOWED_CREATE_PACKS:
  - `tmf_mvp12_v2`
  - `tmf_full_v1`

## RPCs por fase (detectadas en código)

### Diagnóstico
**RPCs usadas**
- `dts_recalc_assessment_scores`
- `dts_recalc_dimension_scores`

**Endpoints relacionados**
- `src/app/api/dts/criteria/route.ts`
- `src/app/api/dts/mvp12/criteria/route.ts`
- `src/app/api/dts/responses/get/route.ts`
- `src/app/api/dts/responses/route.ts`
- `src/app/api/dts/responses/upsert/route.ts`
- `src/app/api/dts/score/get/route.ts`
- `src/app/api/dts/score/recalc/route.ts`

### Resultados
**RPCs usadas**
- `dts_action_set_status_v1`
- `dts_results_programs_v2`
- `dts_results_v1`

**Endpoints relacionados**
- `src/app/api/dts/results/action-status/route.ts`
- `src/app/api/dts/results/executive-summary/route.ts`
- `src/app/api/dts/results/frenos/route.ts`
- `src/app/api/dts/results/initiatives/route.ts`
- `src/app/api/dts/results/matriz/route.ts`
- `src/app/api/dts/results/priorizacion/route.ts`
- `src/app/api/dts/results/programs/route.ts`
- `src/app/api/dts/results/roadmap/route.ts`
- `src/app/api/dts/results/seguimiento/route.ts`
- `src/app/api/dts/results/v1/route.ts`

### Ejecución
**RPCs usadas**
- `dts_activate_program_v1`
- `dts_execution_gate_v1`
- `dts_results_program_actions_v2`

**Endpoints relacionados**
- `src/app/api/dts/execution/activate_from_roadmap/route.ts`
- `src/app/api/dts/execution/activate_program/route.ts`
- `src/app/api/dts/execution/close-program/route.ts`
- `src/app/api/dts/execution/gate/route.ts`
- `src/app/api/dts/execution/program-results/route.ts`
- `src/app/api/dts/results/program-actions/route.ts`
- `src/app/api/dts/roadmap/activate-program/route.ts`

### Seguimiento
**RPCs usadas**
- `dts_action_set_status_v1`
- `dts_action_update_v1`
- `dts_action_validate_impact_v1`
- `dts_tracking_actions_scoped_v1`
- `dts_tracking_overview_v1`

**Endpoints relacionados**
- `src/app/api/dts/tracking/actions/route.ts`
- `src/app/api/dts/tracking/actions/status/route.ts`
- `src/app/api/dts/tracking/actions/update/route.ts`
- `src/app/api/dts/tracking/actions/validate/route.ts`
- `src/app/api/dts/tracking/overview/route.ts`

### Otros
**RPCs usadas**
- `dts_assessment_complete_v1`

**Endpoints relacionados**
- `src/app/api/dts/assessment/actions/route.ts`
- `src/app/api/dts/assessment/actions/status/route.ts`
- `src/app/api/dts/assessment/complete/route.ts`
- `src/app/api/dts/assessment/create/route.ts`
- `src/app/api/dts/assessment/get/route.ts`
- `src/app/api/dts/assessment/onboarding/route.ts`
- `src/app/api/dts/chat/add/route.ts`
- `src/app/api/dts/chat/get/route.ts`
- `src/app/api/dts/chat/messages/add/route.ts`
- `src/app/api/dts/chat/messages/list/route.ts`
- `src/app/api/dts/chat/post/route.ts`
- `src/app/api/dts/chat/save/route.ts`
- `src/app/api/dts/meta/dimensions/route.ts`

Estado final de la BD:
Elemento Con teoEstadoframeworks2DTS (Gapply) + TMF_DMM (TM Forum) ✅framework_versionsDTS 1.0 active✅dts_dmm_versionsdts_v1 active✅dts_packsdts_ceo30_v1 (30 criterios)✅dts_dimensions6 (EST/OPE/PER/DAT/TEC/GOB)✅dts_subdimensions6 dummy (.0)✅dts_criteria30 con 5 levels cada uno✅dts_pack_criteria_map30 mappings✅dts_pack_config1 JSON (scoring + frenos + mensajes + resumen + onboarding)✅TMF packsintactos (12+12)✅


1) DDL corregido (framework_version_id incluido)

Objetivo: soportar un framework propio (DTS) sin contaminar TMF.

Se crea/usa un framework en frameworks con type='maturity_model' (por el CHECK frameworks_type_check).

Se crea/usa una versión en framework_versions (columna version existe).

Se crea/usa un registro en dts_dmm_versions con version_code='dts_v1' y is_active=true.

Punto crítico del schema (importante dejarlo por escrito):

Hay un trigger enforce_criteria_version_coherence() que prohíbe usar dmm_version_id en dts_criteria si framework_version_id no está mapeado en framework_dmm_map.

Solución aplicada en DTS: en dts_criteria dejamos dmm_version_id = NULL (permitido por el trigger) y usamos framework_version_id como fuente de verdad.

Las dimensiones (dts_dimensions) sí tienen dmm_version_id relleno para la versión dts_v1 (porque no pasan por ese trigger).

2) Seeds 100% deterministas (DTS_V1)

Objetivo: idempotencia + reproducibilidad (cero “seeds a mano”).

dts_packs: se añadió dts_ceo30_v1 con pack_uuid estable.

dts_dimensions: se insertaron 6 dimensiones DTS con codes:

EST, OPE, PER, DAT, TEC, GOB

dts_subdimensions: se insertaron 6 subdims dummy (1 por dimensión) para cumplir el modelo actual (porque dts_criteria históricamente estaba ligado a subdimensiones TMF).

dts_criteria: se insertaron 30 criterios (CEO-30), con:

framework_version_id = DTS framework version

subdimension_id = dummy subdim

códigos tipo E1..E5, O1..O5, P1..P5, D1..D5, T1..T5, G1..G5

dts_pack_criteria_map: mapeo pack → 30 criterios con weights (si son todos 1, perfecto para V1).

(Si aplica en tu deploy) tablas de frenos:

catálogo de tipos de freno (normalizado)

catálogo de pares transversales (direccionales y activables)

plantillas de mensaje CEO (por tipo + dimensión / por par transversal)

configuración/umbrales del motor (si lo has modelado como tabla)

Regla de oro documentada: seeds con ON CONFLICT DO UPDATE o “UPSERT determinista” para poder ejecutar el deploy N veces sin duplicados.

3) RPC corregida (pack_uuid + assessment.pack + joins reales + determinismo + validación ruidosa)

Objetivo: backend produce el payload final; frontend pinta.

Contrato conceptual de dts_v1_results(assessment_id)

Lee dts_assessments.pack (text) y lo resuelve:

dts_packs.id (pack_key) → dts_packs.pack_uuid

Construye scope real (joins):

dts_pack_criteria_map(pack_uuid) → dts_criteria → dts_subdimensions → dts_dimensions

Calcula:

score por dimensión (media de as_is_level)

score global (media de dimensiones; y si quieres 0–100, lo mapeas al final)

Detecta frenos candidatos:

Crítico (por criterio)

Estructural (por dimensión)

Transversal (por gap direccional en pares oficiales)

Selecciona Top 3 determinista:

Iteración en orden fijo (greedy con FOR ... ORDER BY rank)

Regla de diversidad que acordaste: máximo 1 Crítico/Estructural por dimensión; transversales exentos del bloqueo dimensional pero máximo 1 transversal total.

Validación ruidosa:

Si un freno seleccionado no tiene plantilla de mensaje CEO → RAISE EXCEPTION

Esto evita el bug de “silenciar frenos” por JOIN estricto.


Lo que queda FROZEN:
PiezaEstadoDDL (3 tablas: dts_freno_types, dts_freno_pair_catalog, dts_freno_message_templates)✅ FROZENSeeds (3 tipos + 4 pares + 16 plantillas CEO)✅ FROZENRPC dts_results_frenos_v1(uuid)✅ FROZENReglas motor (Crítico=1, Estructural avg≤2.0 / soft<2.5+disp≥2, Transversal gap≥1.0, diversidad 1/dim + 1 trans, top 3)✅ FROZENPayload contract (campos, estructura JSON)✅ FROZEN


Qué hemos añadido en DB para DTS_V1 (dts_ceo30_v1):

Framework y versionado propios

Insert de frameworks (type permitido: maturity_model|standard|control_framework)

Insert de framework_versions

Insert del pack dts_ceo30_v1 en dts_packs

Dimensiones DTS V1

6 dimensiones: EST, OPE, PER, DAT, TEC, GOB en dts_dimensions

Subdimensiones dummy (1 por dimensión) para compatibilidad con dts_criteria (aunque subdimension_id ahora sea nullable)

Criterios CEO-30

30 criterios insertados en dts_criteria con framework_version_id (y sin dmm_version_id)

Mapeo pack→criteria en dts_pack_criteria_map (30 filas)

Motor de frenos (data-driven + determinista)

Tablas normalizadas: tipos, pares transversales, templates CEO, etc.

RPC determinista con FOR LOOP greedy + validación ruidosa si falta template

Circuito de ejecución V1

dts_assessments usa pack (text) como key del pack.

dts_responses captura as_is_level, notas, etc.

dts_v1_results(assessment_id) compone: scores + top3 frenos + resumen ejecutivo.
<!-- GENERATED:END -->
