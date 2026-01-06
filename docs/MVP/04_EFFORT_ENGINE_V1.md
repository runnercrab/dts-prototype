# Effort Engine v1 (CEO-friendly)

## Objetivo
Convertir un esfuerzo cualitativo simple (effort_base 1..5) en:
- effort_final (0..100)
- weeks_range (minWeeks, maxWeeks)
con multiplicadores simples (tamaño, complejidad, importancia).

## Inputs
Por iniciativa:
- effort_base: 1..5
- owner_role (no afecta cálculo, solo UI)
- company_size_bucket: micro | small | mid (del onboarding)
- complexity_hint: low | medium | high (opcional)
- importance: 1..5 (del criterio, opcional para multiplicador suave)

## Fórmula v1 (simple y estable)
1) Base score:
effort_score = effort_base * 20  => {20,40,60,80,100}

2) Multiplicadores (capados):
- size_mult:
  micro=0.9, small=1.0, mid=1.1
- complexity_mult:
  low=0.9, medium=1.0, high=1.1
- importance_mult (suave):
  1..5 => 0.95..1.05

effort_final = clamp( round(effort_score * size_mult * complexity_mult * importance_mult), 10, 100)

3) Weeks range (CEO-friendly)
Mapeo por esfuerzo_final:
- 10–25   => 1–2 semanas
- 26–45   => 2–4 semanas
- 46–65   => 4–8 semanas
- 66–85   => 8–12 semanas
- 86–100  => 12–16 semanas

## Output
- effort_final: int 10..100
- weeks_range: {minWeeks, maxWeeks}

## Nota
Esto NO es planificación de proyecto. Es una estimación para priorizar.
