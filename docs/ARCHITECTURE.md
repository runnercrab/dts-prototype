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

<!-- GENERATED:END -->
