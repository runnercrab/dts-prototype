# Explain JSON v1.1 (por criterio)

## Objetivo
Guardar por criterio una explicación estructurada, reproducible y “producto”:
- interpretaciones + recomendaciones
- iniciativas (2–4) con inputs para Effort/Impact
- dependencias BASE → AMPLIFIER

## Ubicación en el sistema
Opción A (rápida): `dts_responses.explain_json` (jsonb)
Opción B (limpia): tabla `dts_explain` (1 fila por criterion x assessment)

## Schema (v1.1)
{
  "version": "1.1",
  "criterion": {
    "id": "uuid",
    "code": "6.1.1",
    "title": "short_label",
    "dimension": "Data",
    "subdimension": "…"
  },
  "inputs": {
    "as_is": 2,
    "to_be": 4,
    "confidence": "medium",
    "importance": 5,
    "timeframe": "1year",
    "notes": "…",
    "business_profile": {
      "sector": "…",
      "size": "…",
      "revenue_range": "optional"
    }
  },
  "interpretation": {
    "gap": 2,
    "what_it_means": "texto corto",
    "risk_if_not_fixed": "texto corto",
    "business_symptoms": ["…", "…"]
  },
  "initiatives": [
    {
      "code": "6.1.1.A",
      "type": "Base estructural",
      "category": "BASE",
      "title": "…",
      "description": "…",
      "owner_role": "IT",
      "dependencies": [],
      "effort": { "effort_base": 3 },
      "impact": {
        "impact_hours_base": 12,
        "has_revenue_impact": false
      }
    },
    {
      "code": "6.1.1.B",
      "type": "Quick Win",
      "category": "AMPLIFIER",
      "dependencies": ["6.1.1.A"],
      "effort": { "effort_base": 2 },
      "impact": { "impact_hours_base": 6, "has_revenue_impact": true }
    }
  ],
  "notes": {
    "assumptions": ["…"],
    "needs_validation": ["…"]
  }
}

## Reglas
- Siempre 2–4 iniciativas.
- Si hay BASE y AMPLIFIER, AMPLIFIER depende de BASE.
- Quick Win puede ir sin depender SOLO si no requiere base.
- Mantenimiento nunca bloquea (no es dependencia), pero entra como “paralelo”.
