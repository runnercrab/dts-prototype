# DTS/Gapply — Contexto MVP (MVP12) — Estado actual

## Objetivo
Construir un MVP CEO-centric, desacoplado (sin lógica crítica en frontend), con diagnóstico de 12 criterios (MVP12), scoring calculado en backend y experiencia de resultados clara.

## MVP12 — Criterios incluidos
- 1.1.1
- 1.1.2
- 2.1.3
- 2.5.4
- 3.1.1
- 3.4.1
- 4.1.1
- 4.2.2
- 5.1.1
- 5.5.1
- 6.1.1
- 6.2.1

## Stack
- Next.js (App Router) + Tailwind
- Vercel (deploy)
- Supabase (DB + RPCs)
- API routes (Next) en runtime nodejs

## Rutas clave (producción)
Base: https://dts-prototype.vercel.app

- Health/env: /api/debug/env
- Score get: /api/dts/score/get?assessmentId=...
- Score recalc: /api/dts/score/recalc (POST {assessmentId})

## Estado: lo que funciona
- Env vars y Supabase service role OK.
- /api/dts/score/get funciona y devuelve assessmentScore + dimensionScores.
- /api/dts/score/recalc funciona y recalcula scores (RPC + upsert).
- Resultados (/resultados) ya consume score/get (no recalcula en frontend).

## Problema actual
- /diagnostico-full NO usa MVP12: carga criterios por tier (tier1/tier2), por eso falta 1.1.2 o salen más/menos criterios.
- Parte del frontend todavía llama a Supabase directo (cliente), lo que queremos evitar para desacoplar y evitar problemas de RLS/keys.

## Decisión de arquitectura (regla)
Frontend = UI/estado local.
Backend (API routes) = verdad: lectura/escritura y agregados.
Nada “crítico” se calcula en cliente.

## Cambios requeridos ahora
### 1) Endpoint MVP12 criteria
- GET /api/dts/mvp12/criteria
- Debe devolver EXACTAMENTE 12 criterios por code (lista arriba).
- Debe incluir campos necesarios para CriterionQuestion:
  - id, code
  - description_es/description
  - short_label_es/short_label
  - context_es/context (si existe)
  - focus_area
  - subdimension info (code, name_es/name, dimension name)
  - level_1..level_5 description ES (si existe)

### 2) Endpoint assessment get
- GET /api/dts/assessment/get?assessmentId=...
- Debe devolver onboarding_data (y lo mínimo del assessment).

### 3) Frontend: diagnostico-full debe consumir API
- src/app/diagnostico-full/page.tsx:
  - dejar de consultar supabase.from('dts_criteria') en el cliente
  - llamar a /api/dts/mvp12/criteria
  - mantener /api/dts/responses para guardar respuestas
  - mantener chat (idealmente también via API más adelante)

## Componentes existentes
- src/app/diagnostico-full/page.tsx (principal)
- src/components/diagnostico/OnboardingWorkshop.tsx
- src/components/diagnostico/DimensionProgressMapVisual.tsx
- src/components/diagnostico/CriterionQuestion.tsx
- src/components/AvatarPane.tsx
- src/components/AssistantChat.tsx

## Supabase server client
- src/lib/supabase/server.ts
  - usa SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
  - createClient(... persistSession:false)

## Comandos de prueba recomendados
Local:
- http://localhost:3000/api/dts/mvp12/criteria
- http://localhost:3000/api/dts/assessment/get?assessmentId=...
- http://localhost:3000/api/dts/score/get?assessmentId=...

Prod:
- https://dts-prototype.vercel.app/api/dts/mvp12/criteria
- https://dts-prototype.vercel.app/api/dts/assessment/get?assessmentId=...
- https://dts-prototype.vercel.app/api/dts/score/get?assessmentId=...

## Base de datos: Criterios

