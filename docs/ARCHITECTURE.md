# DTS – Architecture (Source of Truth)

## Propósito
Este documento describe la arquitectura REAL del sistema DTS.
Es la referencia única para entender:
- qué existe
- cómo fluye el sistema
- dónde vive cada responsabilidad

El frontend **solo pinta**.
Toda la lógica vive en backend (API + DB).

---

## Arquitectura por capas

### 1. Frontend (Next.js)
- Renderiza pantallas
- Llama a endpoints
- No calcula scores, frenos ni prioridades

### 2. Backend (API Routes)
- Orquesta el flujo del assessment
- Valida packs, fases y estados
- Llama a RPCs de Supabase

### 3. Data & Logic (Supabase)
- PostgreSQL como source of truth
- RPCs encapsulan toda la lógica de negocio
- El scoring nunca vive en frontend

---

## Fases del flujo DTS

0. Onboarding  
1. Diagnóstico (criterios)  
2. Resultados ejecutivos  
3. Frenos  
4. Priorización  
5. Programas  
6. Acciones  
7. Roadmap  
8. Seguimiento  

---

## 🔁 Bloque generado automáticamente (NO editar a mano)

<!-- GENERATED:START -->

## Backend real detectado

### RPCs (Supabase)
- (ninguna detectada)

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

<!-- GENERATED:END -->
