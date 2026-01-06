# SaaS mensual — Operating System (cómo “vive” DTS)

## Objetivo
Convertir el diagnóstico en un sistema recurrente:
- ejecución + evidencia
- progreso + impacto conseguido
- reorden del roadmap
- alertas mínimas
- check-in mensual

## Estados de iniciativa
pending | in_progress | blocked | done

## Campos por iniciativa (MVP)
- status
- owner_role: Dirección | Operaciones | Comercial | IT | Finanzas | People
- due_date
- evidence_note OR evidence_url
- last_update_at

## Eventos del cliente (acciones)
1) Cambia estado
2) Sube evidencia (url o nota)
3) Deja nota de bloqueo

## Respuesta de DTS (automática)
A) Recalcula progreso
- % done por quarter
- nº in_progress, blocked

B) Recalcula impacto conseguido vs pendiente
- impact_hours_done vs impact_hours_total
- impact_eur_done_range vs total (si aplica)

C) Reordena roadmap
- si blocked > X o base bloqueada, mover dependientes al siguiente quarter
- sugerir “alternativas” (quick wins sin dependencia)

D) Genera alertas (pocas, importantes)
Máximo 3 alertas:
- "Base bloqueada: X iniciativas dependen de esto"
- "Sin updates en 30 días"
- "Demasiadas iniciativas en Q1: recortar"

## Check-in mensual (pantalla / sección)
- Resumen del mes:
  - iniciativas cerradas
  - impacto conseguido
  - bloqueos
  - decisiones necesarias (1–3)
- Próximo mes:
  - top 5 iniciativas
  - due dates
  - owners

## KPIs (MVP)
- Completion rate Q1
- Velocity (done/month)
- Blocked count
- Impact hours achieved
- Impact € achieved (si aplica)
