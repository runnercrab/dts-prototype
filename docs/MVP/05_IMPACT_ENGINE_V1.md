# Impact Engine v1 (horas + € por rango)

## Objetivo
Estimar impacto por iniciativa de forma consistente:
- Impacto en horas/mes (impact_hours_final)
- Impacto € (si hay revenue_range) como rango

## Inputs
- impact_hours_base (horas/mes) [por iniciativa]
- revenue_range (opcional, del onboarding)
- sector_bucket (opcional)
- confidence (del criterio, afecta “conservador/agresivo”)

## Salida v1
- impact_hours_final: horas/mes (int)
- impact_eur_range: {min, max, currency:"EUR"} o null

## Heurística v1 (simple)
impact_hours_final = round(impact_hours_base * confidence_mult * size_mult)

confidence_mult:
- low=0.8
- medium=1.0
- high=1.1

size_mult:
- micro=0.9
- small=1.0
- mid=1.1

## Conversión a € (solo si revenue_range existe)
Regla: convertir horas a € como rango usando “cost_per_hour” estimado por tamaño:
- micro: 25–40 €/h
- small: 35–55 €/h
- mid: 45–75 €/h

impact_eur_range.min = impact_hours_final * min_cost_per_hour
impact_eur_range.max = impact_hours_final * max_cost_per_hour

## Importante
- Si el impacto es de “ingresos” (revenue), en v1 NO calculamos ingresos exactos.
  Solo mostramos "posible impacto en ingresos" como etiqueta y seguimos con horas→€ para evitar humo.
