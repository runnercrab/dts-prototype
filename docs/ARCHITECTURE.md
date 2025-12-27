📘 DTS – Architecture & System Documentation (MVP)

Proyecto: DTS (Digital Transformation Score)
Repositorio: runnercrab/dts-prototype
Estado: MVP funcional y estable
Última validación: 2025-12-27 (v0.1-env-fixed-2025-12-27)

1. Visión general del sistema

DTS es una plataforma SaaS de diagnóstico de madurez digital basada en TM Forum DMM v5.0.1.

El sistema se compone de:

Frontend: Next.js (App Router)

Backend: API Routes de Next.js (Node.js runtime)

Base de datos: Supabase (PostgreSQL)

Infraestructura: GitHub + Vercel

Arquitectura lógica (simplificada)
Usuario (Browser)
   ↓
Next.js Frontend
   ↓
API Routes (Node.js)
   ↓
Supabase (Service Role)
Separación clara:

Cliente (anon key): solo lectura / escritura controlada

Servidor (service role): scoring, agregados, lógica crítica

2. Entornos y despliegue
2.1 Entornos
Entorno	Descripción
Local	Desarrollo en máquina local
Production	Despliegue automático en Vercel

No se usan entornos “staging” en este MVP.

2.2 Variables de entorno
Cliente (frontend)

Usadas en src/lib/supabase.ts:

NEXT_PUBLIC_SUPABASE_URL

NEXT_PUBLIC_SUPABASE_ANON_KEY

Servidor (API Routes)

Usadas en src/lib/supabase/server.ts:

SUPABASE_URL

SUPABASE_SERVICE_ROLE_KEY

⚠️ Regla crítica:
El SERVICE_ROLE_KEY nunca se usa en frontend.

2.3 Healthcheck y debug

Endpoints clave:

Health / entorno

GET /api/debug/env


Devuelve:

entorno (production / preview)

deploymentId

presencia de variables críticas
{
  "hasSupabaseUrl": true,
  "hasServiceRole": true
}
Si alguno es false, el sistema NO es fiable.

3. Estructura del repositorio
src/
 ├─ app/
 │   ├─ page.tsx                    → Home
 │   ├─ diagnostico-full/           → Flujo de diagnóstico (129 criterios)
 │   ├─ resultados/                 → Resultados y radar
 │   └─ api/
 │       └─ dts/
 │           ├─ responses/           → Guardar respuestas
 │           └─ score/
 │               ├─ get/             → Leer scoring
 │               └─ recalc/           → Recalcular scoring
 │
 ├─ lib/
 │   ├─ supabase.ts                  → Cliente Supabase (anon)
 │   └─ supabase/
 │       └─ server.ts                → Supabase service role
 │
docs/
 └─ ARCHITECTURE.md                  → Este documento

4. Modelo de datos (Supabase)
Tablas clave
dts_assessments

1 diagnóstico por empresa

Contiene onboarding y estado

dts_responses

Respuestas por criterio

AS-IS, TO-BE, importancia, notas

dts_dimension_scores

Agregados por dimensión (6 filas)

Se recalculan vía API

dts_assessment_scores

Score global del assessment

Derivado de las dimensiones

5. APIs principales del sistema
5.1 Guardar respuestas

POST /api/dts/responses
Llamado desde el frontend

Guarda una respuesta por criterio

NO recalcula scores

5.2 Recalcular scoring
POST /api/dts/score/recalc

Usa Supabase Service Role

Ejecuta funciones SQL:

dts_recalc_dimension_scores

dts_recalc_assessment_scores

Actualiza tablas agregadas

5.3 Obtener resultados
GET /api/debug/env

6. Flujo funcional completo (end-to-end)

Usuario entra en /

Accede a diagnóstico (/diagnostico-full)

Completa onboarding

Responde criterios (129)

Cada respuesta se guarda en dts_responses

Se ejecuta score/recalc

Scores agregados se guardan

Usuario accede a /resultados

Frontend consume score/get

7. Decisiones técnicas importantes
Node.js runtime forzado
export const runtime = 'nodejs'

Motivo:

Edge Runtime no soporta bien Supabase + Service Role

Evita errores de fetch failed

Service Role solo en servidor

Archivo dedicado:
src/lib/supabase/server.ts

Motivo:

Seguridad

Separación de responsabilidades

Escalabilidad futura

Lint relajado en MVP

ignoreDuringBuilds = true

typescript.ignoreBuildErrors = true

Motivo:

Velocidad

Foco en producto, no perfección académica
8. Estado actual del MVP
✔ Hecho y estable

Diagnóstico completo (129 criterios)

Guardado de respuestas

Scoring por dimensión

Scoring global

Resultados y radar

Infra y env vars estables

❌ No implementado aún

Roadmap

Impact Engine

Effort Engine

Priorización automática

Avatar explicando resultados

9. Tags y versiones

Tag estable actual:
v0.1-env-fixed-2025-12-27
Garantiza:

Env vars correctas

APIs de scoring funcionales

Sistema reproducible

10. Regla de oro del proyecto

Nada se añade sin quedar documentado aquí.
Este archivo es la memoria viva del sistema.