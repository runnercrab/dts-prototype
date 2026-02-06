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

### RPCs (Supabase)
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

<!-- GENERATED:END -->
