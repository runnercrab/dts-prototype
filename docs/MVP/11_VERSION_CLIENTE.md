# MVP12 — Digital Transformation Score (DTS)

## Versión

- **MVP12 v1.0**
- Basado en **TM Forum DMM v5.0.1**
- Fecha: **2025-12-27**

---

## 1. Qué es el MVP12 (y qué NO es)

### Qué es

El **MVP12** es la versión mínima viable y comercial de **DTS** que permite:

- Diagnosticar una empresa con **12 criterios clave**
- Traducir el diagnóstico en:
  - iniciativas accionables
  - esfuerzo estimado
  - impacto potencial
  - roadmap trimestral
- Convertir DTS en un **SaaS mensual vivo**, no en un informe muerto

Está diseñado para:

- CEOs de pymes  
- Dirección general  
- Empresas sin equipo de transformación digital interno  

---

### Qué NO es

El MVP12 **NO** es:

- Un benchmark exhaustivo (eso vendrá con los 129)
- Un sistema de predicción financiera exacta
- Una consultoría manual
- Un Excel glorificado

👉 Es un **sistema de decisión y seguimiento**, no un estudio académico.

---

## 2. Los 12 criterios oficiales del MVP12

Criterios seleccionados para tener **2 por dimensión** y cubrir:

- estrategia  
- cliente  
- tecnología  
- operaciones  
- cultura  
- datos  

| Dimensión    | Código | Subdimensión            | Rol          |
|-------------|--------|-------------------------|--------------|
| Strategy    | 1.1.1  | Vision & Leadership     | BASE         |
| Strategy    | 1.1.2  | Digital Strategy        | AMPLIFICADOR |
| Customer    | 2.1.3  | Customer Experience     | BASE         |
| Customer    | 2.5.4  | Customer Insights       | AMPLIFICADOR |
| Technology  | 3.1.1  | IT Architecture         | BASE         |
| Technology  | 3.4.1  | Cloud & Platforms       | AMPLIFICADOR |
| Operations  | 4.1.1  | Process Digitization    | BASE         |
| Operations  | 4.2.2  | Automation              | AMPLIFICADOR |
| Culture     | 5.1.1  | Digital Skills          | BASE         |
| Culture     | 5.5.1  | Change Management       | AMPLIFICADOR |
| Data        | 6.1.1  | Data Governance         | BASE         |
| Data        | 6.2.1  | Data Usage & Value      | AMPLIFICADOR |

---

### BASE vs AMPLIFICADOR

- **BASE**: si no está, nada escala  
- **AMPLIFICADOR**: multiplica el valor **solo si la base existe**

Esta distinción es clave para:

- el roadmap  
- las dependencias  
- la narrativa comercial  

---

## 3. Flujo END-TO-END del sistema DTS

### 1️⃣ Onboarding

Recogida mínima de contexto:

- nombre de empresa  
- sector  
- tamaño aproximado  
- rol del usuario  

👉 Se guarda en `onboarding_data`.

---

### 2️⃣ Diagnóstico guiado

- Preguntas por criterio (AS-IS / TO-BE)
- Lenguaje no técnico
- El avatar explica cada pregunta

👉 Se guardan respuestas en `dts_responses`.

---

### 3️⃣ Explain JSON v1.1

Para cada criterio:

- nivel actual  
- nivel objetivo  
- gap  
- explicación clara (“por qué estás aquí”)  

👉 Esto **sustituye al informe PDF**.

---

### 4️⃣ Clasificación BASE / AMPLIFICADOR

Cada criterio se marca internamente como:

- BASE  
- AMPLIFICADOR  

👉 Condiciona iniciativas y orden.

---

## 4. Modelo de iniciativas (núcleo del producto)

Cada criterio genera **2–4 iniciativas**.

### Convención de nombres

6.1.1.A
6.1.1.B
6.1.1.C

---

### Tipos de iniciativa (fijos, no configurables)

- Quick Win  
- Base estructural  
- Transformacional  
- Mantenimiento  

No se admiten más tipos en el MVP.

---

### Relación

- 1 criterio → N iniciativas  
- Una iniciativa puede depender de otra  
- **BASE siempre va antes que AMPLIFICADOR**

---

## 5. Effort Engine v1 (esfuerzo)

### Objetivo

Dar una estimación **comprensible por un CEO**, no por un PM técnico.

---

### Modelo

effort_final = effort_base × multiplicadores

- **effort_base**: fijo por tipo de iniciativa  
- **multiplicadores**:
  - tamaño de empresa  
  - complejidad  
  - madurez actual  

---

### Salida

- esfuerzo_estimado (horas)  
- rango de semanas (ej: 2–4 semanas)  

👉 No promete precisión, promete **orden**.

---

## 6. Impact Engine v1

### Impacto en horas

- ahorro de tiempo  
- reducción de tareas manuales  
- eliminación de errores  

---

### Impacto económico (si aplica)

Solo cuando tiene sentido:

- `revenue_range` (ej: 10k–30k €/año)
- nunca cifra exacta

---

### Regla de oro

DTS habla de:

- impacto potencial  
- impacto conseguido  

Nunca de ROI garantizado.

---

## 7. Matriz Impacto / Esfuerzo

- Se construye **por iniciativas**, no por criterios  

### Ejes

- Impacto  
- Esfuerzo  

### Uso

- Priorizar  
- Justificar decisiones  
- Explicar por qué algo va primero  

---

## 8. Roadmap Q1 / Q2 / Q3

### Generación

Ordenado por:

1. BASE primero  
2. Menor esfuerzo  
3. Mayor impacto  

---

### Qué contiene

- iniciativas  
- dependencias  
- trimestre asignado  

---

### Qué pasa si algo cambia

- si se retrasa → se recalcula  
- si se completa → se desbloquean dependencias  

---

## 9. SaaS mensual: cómo “vive” DTS

Cada iniciativa tiene:

```json
{
  "status": "pending | in_progress | blocked | done",
  "owner_role": "Dirección | Operaciones | IT | Comercial",
  "due_date": "YYYY-MM-DD",
  "evidence_note": "",
  "evidence_url": "",
  "last_update_at": ""
}

Cuando el cliente… cambia estado

sube evidencia

deja nota

DTS hace

recalcula progreso

recalcula impacto conseguido vs pendiente

reordena roadmap

genera alertas pocas y críticas

10. Check-in mensual (automático)

Cada mes:

resumen de progreso

bloqueos detectados

impacto conseguido

decisiones necesarias

👉 Esto es lo que justifica la cuota mensual.

11. Pantallas del MVP
Se reutilizan

/diagnostico-full

/resultados

avatar / chat

Se apagan o simplifican

heatmaps complejos

dashboards sin acción

métricas no explicables

Nuevas vistas lógicas

estado de iniciativas

roadmap trimestral

check-in mensual

12. Qué viene después (fuera del MVP12)

Escalar a 129 criterios

Data Maturity Model

Benchmarks sectoriales

Integraciones externas

👉 Nada de esto bloquea el MVP12.

Conclusión

El MVP12:

es coherente

es vendible

es escalable

no genera deuda conceptual

Todo lo que se construya a partir de ahora debe encajar aquí.