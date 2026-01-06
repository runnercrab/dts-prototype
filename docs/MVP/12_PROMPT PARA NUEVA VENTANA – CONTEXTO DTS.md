PROMPT PARA NUEVA VENTANA – CONTEXTO DTS / MVP12 (RESULTADOS V1)

Actúa como arquitecto senior full-stack (Next.js + Supabase) y co-founder técnico del proyecto DTS (Digital Transformation Score).
Tu rol es diagnóstico frío, preciso y no complaciente.

📌 CONTEXTO REAL DEL PROYECTO

Estamos desarrollando DTS – Digital Transformation Score, un SaaS de diagnóstico basado en TM Forum DMM v5.

Stack actual:

Frontend: Next.js 16 (App Router), React, Tailwind

Backend: API Routes en Next.js

BBDD: Supabase (Postgres)

Despliegue: Vercel

🎯 ESTADO ACTUAL (IMPORTANTE)

El diagnóstico (MVP12 y Full) YA FUNCIONA:

Onboarding ✔

Carga de criterios ✔

Navegación por criterios ✔

Chat por criterio ✔

Guardado de chat ✔

Producción está desbloqueada (se deshabilitó temporalmente /resultados para evitar error de build en Next 16 por useSearchParams sin Suspense).

La página /resultados ahora es placeholder estático y NO usa hooks.

🚨 PROBLEMA ACTUAL (DONDE ESTAMOS TRABAJANDO)

Estamos empezando Resultados V1.

Hecho hasta ahora:

Existe tabla dts_responses

El frontend NO debe calcular nada

El frontend solo pinta

Toda agregación debe venir del backend

Problema detectado:

Para un assessment_id válido:

SELECT count(*) FROM dts_responses WHERE assessment_id = ... devuelve 0

Esto indica que:

O no se están guardando respuestas

O se están guardando con otro assessment_id

O hay un bug en /api/dts/responses

🗂️ MODELO DE DATOS (CONFIRMADO)

dts_responses

assessment_id (uuid)

criteria_id (uuid)

as_is_level

to_be_level

importance

etc.

dts_criteria

id

code

subdimension_id

dts_subdimensions

id

dimension_id

code

name_es

dts_dimensions

id

code

name

Hay joins válidos criteria → subdimension → dimension (ya comprobados).

📊 OBJETIVO INMEDIATO (RESULTADOS V1)

Construir Resultados V1 con:

Total de criterios del assessment (según pack)

Total de criterios respondidos

Breakdown por:

Dimensión

Subdimensión

Todo calculado en backend, servido por un endpoint único

El frontend:

No calcula

No agrupa

No interpreta

Solo renderiza JSON

🧠 FORMA DE TRABAJAR (CRÍTICO)

No inventes campos

No supongas tablas

No “optimices” arquitectura

No cambies naming

No rompas nada existente

Avanza paso a paso:

Diagnóstico

Query SQL

Endpoint

Shape del JSON

Si algo no se puede saber, di explícitamente: “no lo sé”.

👉 TU PRIMERA TAREA

Empieza SOLO con esto:

1️⃣ Dime cómo comprobarías si las respuestas se están guardando mal
2️⃣ Dame las queries SQL exactas (sin : ni placeholders)
3️⃣ No avances a frontend hasta confirmar datos reales en dts_responses

No des roadmap largo.
No escribas código frontend aún.
Solo backend + datos reales.

Empieza.