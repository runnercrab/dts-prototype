# API Contracts — MVP10

## Convención
- Todas las rutas server: runtime nodejs + dynamic force-dynamic
- Supabase service role SIEMPRE via supabaseService()

---

## 1) List iniciativas
GET /api/dts/initiatives/list?assessmentId=...

Response:
{
  "ok": true,
  "initiatives": [
    {
      "code":"6.1.1.A",
      "criterion_code":"6.1.1",
      "type":"Base estructural",
      "category":"BASE",
      "title":"...",
      "owner_role":"IT",
      "status":"pending",
      "effort_final":60,
      "weeks_min":4,
      "weeks_max":8,
      "impact_hours_final":12,
      "impact_eur_min":420,
      "impact_eur_max":660,
      "dependencies":["..."],
      "due_date": "2026-02-15",
      "evidence_note": null,
      "evidence_url": null,
      "last_update_at": "..."
    }
  ]
}

---

## 2) Update iniciativa (estado/evidencia)
POST /api/dts/initiatives/update
Body:
{
  "assessmentId":"uuid",
  "initiativeCode":"6.1.1.A",
  "patch":{
    "status":"in_progress",
    "due_date":"2026-02-15",
    "evidence_note":"...",
    "evidence_url":"..."
  }
}

---

## 3) Recalc engines (effort+impact+roadmap)
POST /api/dts/initiatives/recalc
Body:
{
  "assessmentId":"uuid"
}

Effect:
- recalcula effort_final/weeks_range
- recalcula impact_hours/€ range
- recalcula roadmap q1/q2/q3
- genera alertas

---

## 4) Roadmap get
GET /api/dts/roadmap/get?assessmentId=...

Response:
{
  "ok":true,
  "roadmap":{
    "Q1":[{"initiative_code":"...","order":1}],
    "Q2":[...],
    "Q3":[...]
  },
  "alerts":[
    {"type":"base_blocked","message":"..."}
  ],
  "kpis":{
    "done_rate_q1":0.2,
    "velocity_month":3,
    "blocked":2,
    "impact_hours_done": 18
  }
}
