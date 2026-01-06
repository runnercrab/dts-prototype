# Roadmap Q1/Q2/Q3 (con dependencias)

## Objetivo
Convertir iniciativas en un plan trimestral:
- Q1: base + quick wins sin dependencia bloqueante
- Q2: amplificadores + transformacionales que dependan de base completada
- Q3: optimización + expansión + mantenimiento estabilizado

## Inputs
- initiatives[] con:
  - code
  - type
  - category (BASE|AMPLIFIER|MAINTENANCE)
  - effort_final
  - weeks_range
  - impact_hours_final
  - dependencies[]
  - status

## Reglas duras
1) BASE antes que AMPLIFIER si hay dependencia.
2) Si iniciativa tiene dependencies, no puede asignarse a un quarter anterior al dependency.
3) Quick Win va a Q1 salvo que dependa de BASE no hecha.
4) Mantenimiento se distribuye como “capado”: máx 15% capacidad mensual.

## Orden dentro de cada Quarter
Orden por:
1) desbloquea (tiene dependientes) primero
2) mayor impacto/menor esfuerzo (ratio) después
3) esfuerzo alto al final

## Output
Por iniciativa:
- quarter: Q1|Q2|Q3
- order_in_quarter: int
- depends_on: []

## Vista CEO-friendly
- lista por Q1/Q2/Q3 con 5–10 items máximo por quarter (capado por capacidad)
