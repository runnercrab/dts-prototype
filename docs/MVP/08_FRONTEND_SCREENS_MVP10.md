# Pantallas MVP12 + qué tocar en el frontend actual

## Pantallas mínimas (MVP12)
1) Home (ya)
2) Diagnóstico (ya) — modo MVP10
3) Resultados (ya) — añadir secciones:
   - Matriz Impacto/Esfuerzo (iniciativas)
   - Roadmap Q1/Q2/Q3
   - Operating System mensual (estado/evidencia)
4) Iniciativas (nuevo) — opcional si lo embebes en Resultados

---

## 1 Diagnóstico (/diagnostico-full)
### Qué mantener
- OnboardingWorkshop
- CriterionQuestion (sliders)
- chat persistido por criterio
- progreso por subdimensión




---

## 2 Resultados (/resultados)
### Mantener
- KPI cards + radar (ya leen del backend)

### Añadir 3 bloques nuevos (debajo del radar)
A) Iniciativas (lista)
- agrupar por criterio
- mostrar: code, title, type, effort_final + weeks_range, impact_hours + € range
- botón de cambiar status + evidence

B) Matriz Impacto/Esfuerzo
- puntos: iniciativas
- ejes:
  - x = effort_final
  - y = impact_hours_final (o € si existe)
- cuadrantes con etiquetas

C) Roadmap Q1/Q2/Q3
- columnas Q1 Q2 Q3
- cards de iniciativas
- marcar dependencias (icono/link)

---

## 3) SaaS mensual (dentro de Resultados)
### Sección “Check-in mensual”
- summary cards:
  - done this month
  - impact achieved
  - blocked items
- “Decisiones” (top 3 alertas)

---

## Integración mínima
- Frontend NO calcula: solo renderiza datos del backend.
- Endpoints nuevos sugeridos:
  - GET /api/dts/initiatives/list?assessmentId=...
  - POST /api/dts/initiatives/update (status/evidence)
  - POST /api/dts/initiatives/recalc (effort/impact)
  - GET /api/dts/roadmap/get?assessmentId=...

(Ver docs/API_CONTRACTS_MVP10.md)

FRONTEND_MVP.md

# DTS – MVP CEO-centric (Board-level, no técnico)

## INTRODUCCION
### 0. Principio rector (NO negociable)

El frontend no conoce TMF, ni modelos, ni criterios técnicos.
El frontend solo muestra decisiones, prioridades e impacto.
Toda complejidad vive en el backend.

Si algo:

- no ayuda a decidir,
- no reduce incertidumbre,
- no muestra impacto,
- no aparece en la UI del MVP.

### 1. Perfil de usuario objetivo

CEO / Dirección general de PYME

Poco tiempo

No técnico

Aversión al humo

Orientado a:

- dinero
- tiempo
- riesgo
- foco

El CEO no quiere aprender, quiere decidir mejor.

### 2. Tono y experiencia (clave)
No es:
- una herramienta digital
- un dashboard técnico
- una consultoría online
Es:
- un copiloto
- una conversación guiada
- una secuencia de decisiones
Inspiración:
- board meeting bien preparado
- asesor senior que va al grano
- progreso visible (gamificación sobria)

### 3. Arquitectura mental del producto (lo que “siente” el CEO)
El CEO vive el producto en 5 ACTOS, no en 12 pantallas.

Acto	Sensación del CEO
Acto I	“Esto va en serio”
Acto II	“Hablan mi idioma”
Acto III	“Ya veo el problema”
Acto IV	“Sé qué hacer primero”
Acto V	“Ahora quiero seguimiento”

Las rutas técnicas existen, pero el relato manda.
# Acto I	“Esto va en serio”
## 🟦 PANTALLA 1 — Home (marketing)4. ACTO I — ENTRADA / CONFIANZA. "Esto va en serio"
Pantalla: Home
URL /
Objetivo
Responder en 10 segundos:
“¿Esto es para mí o es humo digital?”
Contenido
Título
"Te decimos qué mejorar, en qué orden y con qué impacto"
Subtítulo
"Diagnóstico claro de tu transformación digital, sin jerga ni promesas falsas."

3 bullets

- Sabes dónde estás bloqueado

- Sabes qué hacer primero (no una lista infinita)

- Ves el impacto real de avanzar
Pantalla tipo:

“Así se ve una empresa cuando gana claridad”

Mini radar (fake o demo)

3 frases:

“Aquí pierden tiempo”

“Aquí están fuertes”

“Esto es lo primero que deberían hacer”

CTAs

👉 Empezar diagnóstico

👉 Ver ejemplo real (demo)

(si logueado → nuevo assessment, si no → login)

Notas de diseño

Home NO depende de BD

Es marketing + narrativa

Vídeo corto Welcome.mp4

Logos discretos (confianza, no postureo)

# 5. ACTO II — CONTEXTO (ONBOARDING LIGHT)
## 🟦 PANTALLA 2 — Onboarding 5. ACTO II — CONTEXTO (ONBOARDING LIGHT) "Hablan mi idiaoma"
 Pantalla: Contexto empresa

 Pregunta del CEO
“¿Esto está adaptado a mi empresa?”
Inputs mínimos

- Sector 
- Tamaño (rangos)
- Rol

Objetivo principal (1 selector)
Nada más.
Regla

Si algo no alimenta impacto/esfuerzo → no se pregunta.

CTA
👉  Guardar y Continuar
# 6. ACTO III — DIAGNÓSTICO GUIADO (CORE)
## 🟦 PANTALLA 3 — Diagnóstico (los 12 criterios) 6. ACTO III — DIAGNÓSTICO GUIADO (CORE)
Pantalla: Diagnóstico (plantilla repetible)

URL
/diagnostico-full

Estado interno

phase = 'onboarding' | 'assessment' | 'completed'
Qué ve el CEO (nunca el criterio técnico)

Arriba

Área de negocio (dimension)(ej. Clientes, Datos, Operaciones)

Progreso claro: “Paso 3 de 12”

Centro

Pregunta clara, en lenguaje natural

Ejemplos reales (desplegable)

Ayuda contextual (“qué significa esto”)

Inputs

Situación actual (escala verbal)

Objetivo deseado (12–18 meses)

Importancia (para priorizar)

Sensación buscada

“Esto lo entiendo y puedo responder sin ser técnico.”
Yo metería 3 cosas que lo hacen “gaming” sin parecer un videojuego cutre:

Barra de progreso con hitos

“Hito 1: Cliente”

“Hito 2: Datos”

etc.

¿Donde estoy? 
Niveles: 
Triple input 
- AS-IS 🔴 Muy difícil · 🟠 Difícil · 🟡 A medias · 🟢 Fácil · 🟢🟢 Muy fácil 
- TO-BE ¿Dónde te gustaría estar en 12–18 meses?  🔴 Muy difícil · 🟠 Difícil · 🟡 A medias · 🟢 Fácil · 🟢🟢 Muy fácil 
- IMPORTANCIA 🟢 Baja · 🟡 Media · 🟠 Alta · 🔴 Crítica  

Pantalla: Diagnóstico (plantilla repetible)

URL
/diagnostico-full

Estado interno

phase = 'onboarding' | 'assessment' | 'completed'

Qué ve el CEO (nunca el criterio técnico)

Arriba

Área de negocio (ej. Clientes, Datos, Operaciones)

Progreso claro: “Paso 3 de 12”

Centro

Pregunta clara, en lenguaje natural

Ejemplos reales (desplegable)

Ayuda contextual (“qué significa esto”)

Inputs

Situación actual (escala verbal)

Objetivo deseado (12–18 meses)

Importancia (para priorizar)

Sensación buscada

“Esto lo entiendo y puedo responder sin ser técnico.”

Recompensa por completar criterio

Al guardar: “+1 criterio completado”

“Has desbloqueado el resumen parcial”

Botones clarísimos

“Guardar y seguir”

“Guardar y salir”

“Atrás”
# 7. ACTO IV — CLARIDAD Y PRIORIDAD
## 🟦 PANTALLA 4 — Resultado ejecutivo7. ACTO IV — CLARIDAD Y PRIORIDAD

URL: /resultados

Pantalla: Resumen inmediato

Pregunta del CEO

“Entonces… ¿qué tal estoy?”

Contenido:

- Score global + etiqueta
- Radar 6 dimensiones
- “Tus 3 frenos principales”
- Botón grande: “Ver tu plan de acción”

Contenido

Radar simple (6 áreas)

Texto interpretativo (no números fríos)

Señales:

Fortalezas

Bloqueos

Riesgos
Contenido:

Score global + etiqueta

Radar 6 dimensiones

“Tus 3 frenos principales”

Botón grande: “Ver tu plan de acción”
Pantalla: Resumen inmediato

Pregunta del CEO

“Entonces… ¿qué tal estoy?”

Contenido

Radar simple (6 áreas)

Texto interpretativo (no números fríos)

Señales:

Fortalezas

Bloqueos

Riesgos

## 🟦 PANTALLA 5  Bases vs Amplificadores (CLAVE) Plan de acción (Iniciativas)

URL: /iniciativas

Aquí sí:

Top 10 iniciativas

filtros

status

effort

impacto

Y aquí metemos lo de “premios”:

Cada iniciativa completada = “puntos de progreso”

Nivel de avance = “Bronce / Plata / Oro”

Y un marcador: “Impacto conseguido vs pendiente”

Pero ojo: eso lo calcula el backend, no el front.

Pregunta del CEO

“¿Por qué no empezar por lo más moderno?”

Bloque 1 — Bases

“Crean orden. Sin ellas, todo se rompe.”

Bloque 2 — Amplificadores

“Multiplican resultados, pero dependen de las bases.”

Frase fija (mantra del producto)

Automatizar desorden es acelerar el problema.

Esto educa sin explicar frameworks.


## 🟦 PANTALLA 6:  Brechas prioritarias

URL: /iniciativas
Pregunta del CEO

“¿Dónde duele más?”

Contenido

Top brechas (máx. 5)

Lenguaje de impacto:

tiempo perdido

oportunidades bloqueadas

riesgo operativo

CTA
👉 Ver qué hacer

## 🟦 PANTALLA 7 — Plan de acción 



Aquí sí:

filtros

status

effort

impacto

Y aquí metemos lo de “premios”:

Cada iniciativa completada = “puntos de progreso”

Nivel de avance = “Bronce / Plata / Oro”

Y un marcador: “Impacto conseguido vs pendiente”

Pero ojo: eso lo calcula el backend, no el front.

## 🟦 PANTALLA 8: Matriz Impacto / Esfuerzo (INICIATIVAS)

Pregunta del CEO

“¿Qué hago primero?”

Matriz 2×2

Quick Win

Base estructural

Transformación

Mantenimiento

Regla

Cada punto = iniciativa

Nunca mostrar “criterios”

Ejemplo visible:

“Unificar datos de cliente”
“Eliminar tareas manuales repetidas”
Y aquí metemos lo de “premios”:

Cada iniciativa completada = “puntos de progreso”

Nivel de avance = “Bronce / Plata / Oro”

Y un marcador: “Impacto conseguido vs pendiente”

## 🟦 PANTALLA 9: Roadmap Q1 / Q2 / Q3

Pregunta del CEO

“¿En qué orden realista?”

Q1

Dejar de perder tiempo

Q2

Crear orden que aguante

Q3

Escalar sin más personas

Dependencias claras:

Bases antes que amplificadores
Tres columnas con dependencias.
Si una iniciativa depende de otra:

aparece como “bloqueada”

tooltip: “Depende de X”

# 8. ACTO V — SaaS MENSUAL (RECURRENCIA)
Aquí estás muy por encima de la media.

Solo refuerzo el mensaje:

“No pagas por diagnóstico.
Pagas por no volver al caos.”

Estados, evidencias, check-ins → clave absoluta.
## 🟦 PANTALLA 10  : Activar seguimiento
URL: /seguimiento

El diagnóstico es la foto.
El seguimiento es el impacto.

Solo refuerzo el mensaje:

“No pagas por diagnóstico.
Pagas por no volver al caos.”

Estados, evidencias, check-ins → clave absoluta.
Dentro:

- check-in mensual
- alertas (pocas)
- progreso
- impacto real acumulado

avatar como copiloto
Pregunta del CEO

“¿Por qué pagar cada mes?”

Respuesta clara

El diagnóstico es una foto.
El seguimiento es lo que genera impacto.

## 🟦 PANTALLA 11 : Dashboard mensual (cuando paga)

Contenido
- Estado general
- Roadmap vivo
- Iniciativas (estado)
- Impacto acumulado
- Alertas pocas y relevantes
- Avatar como copiloto mensual

Nada técnico.
Nada que requiera explicación.

9. Gamificación (sobria, CEO-friendly)

No “badges”.
No “puntos”.

Sí:

“Bloqueo eliminado”

“Tiempo recuperado”

“Riesgo reducido”

“Impacto conseguido este mes”

La recompensa es claridad + control.

10. Qué NO entra en el MVP (importante)

Detalles TMF

Códigos de criterio

Modelos ISO

Ajustes finos de scoring

Configuraciones avanzadas

Todo eso:

vive en backend

vive en docs

vive en versiones futuras

11. Regla final (para no esclavizarte al código)

El frontend nunca persigue al modelo.
El modelo sirve al relato.

Si mañana:

cambias TMF,

añades ISO,

cambias scoring,

👉 el frontend no se toca.

12. Estado del documento

Versión: MVP v1

Enfoque: 100% CEO-centric

Apto para:

demos

primeros clientes

iterar sin deuda conceptual

# Aterrizaje FRONTEND_MVP → Componentes concretos
Regla 0 (la más importante)

Ningún componente del frontend conoce TMF, DMM, ISO ni criterios técnicos.

El frontend solo conoce:

decisiones

progreso

impacto

estados

1️⃣ Mapa real de rutas (lo que YA tienes + cómo queda)
Ruta	Rol	Estado
/	Landing / confianza	✅ ya
/diagnostico-full	Core diagnóstico	✅ ya
/resultados	Insight + prioridad	⚠️ mejorar
/start	Onboarding (opcional)	🔥 integrar o eliminar
/asistente	❌ fuera del MVP	eliminar
/dts-chat	❌ fuera del MVP	eliminar

👉 Acción clara
En MVP:

/start, /asistente, /dts-chat → fuera

Todo vive en /diagnostico-full con phase

2️⃣ State machine central (núcleo del frontend)

📍 Vive en:
src/app/diagnostico-full/page.tsx

type Phase =
  | 'landing'
  | 'onboarding'
  | 'how_it_works'
  | 'assessment'
  | 'summary'
  | 'priorities'
  | 'initiatives'
  | 'roadmap'
  | 'paywall'


⚠️ Esto es CLAVE
No navegues por URLs.
Navega por estado.

3️⃣ Componentes CORE (los que SÍ existen)
🧱 DiagnosticoFullPage (orquestador)

Archivo

src/app/diagnostico-full/page.tsx


Responsabilidad

Decide qué pantalla se ve

Maneja assessmentId

Maneja phase

NO renderiza lógica visual compleja

switch (phase) {
  case 'onboarding': return <OnboardingContext />
  case 'how_it_works': return <HowItWorks />
  case 'assessment': return <CriterionFlow />
  case 'summary': return <QuickSummary />
  case 'priorities': return <BasesVsAmplifiers />
  case 'initiatives': return <InitiativesMatrix />
  case 'roadmap': return <RoadmapQ />
  case 'paywall': return <ActivateSaaS />
}

4️⃣ Componentes por ACTO (uno por intención)
🟦 ACTO II — Contexto empresa
OnboardingContext.tsx

📍 src/components/diagnostico/OnboardingContext.tsx

Hace

4 inputs

guarda contexto

llama a backend (1 vez)

NO hace

scoring

impacto

decisiones

🟦 ACTO III — Diagnóstico
CriterionFlow.tsx

📍 src/components/diagnostico/CriterionFlow.tsx

Hace

controla índice de criterio

renderiza uno a uno

Internamente usa

<CriterionCard />
<ProgressHeader />

CriterionCard.tsx (renombrar)

📍 src/components/diagnostico/CriterionQuestion.tsx

👉 Renómbralo mentalmente
No es una “pregunta”, es una decisión guiada.

Hace

muestra pregunta

inputs AS-IS / TO-BE / Importancia

NO hace

cálculo

validación de negocio

5️⃣ ACTO IV — Claridad y prioridad
QuickSummary.tsx

📍 src/components/results/QuickSummary.tsx (nuevo)

Contenido

Radar

Texto interpretativo (backend-driven)

BasesVsAmplifiers.tsx

📍 src/components/results/BasesVsAmplifiers.tsx (nuevo)

Regla

El frontend NO decide qué es base o amplificador

Solo muestra lo que el backend dice

GapsPriorityList.tsx

📍 src/components/results/GapsPriorityList.tsx

Top 5 brechas → CTA iniciativas

6️⃣ ACTO IV — Iniciativas (CLAVE DEL MVP)
InitiativesMatrix.tsx

📍 src/components/initiatives/InitiativesMatrix.tsx

Muestra

iniciativas (no criterios)

tipo (QuickWin, Base, etc.)

Cada iniciativa

{
  id,
  name,
  type,
  effort_range,
  impact_range,
  status
}


⚠️ El frontend NO calcula la matriz
Solo la dibuja.

7️⃣ ACTO IV — Roadmap
RoadmapQ.tsx

📍 src/components/roadmap/RoadmapQ.tsx

Input

{
  q1: Initiative[],
  q2: Initiative[],
  q3: Initiative[]
}


Regla

El orden viene del backend

El frontend no “piensa”

8️⃣ ACTO V — SaaS mensual
ActivateSaaS.tsx

📍 src/components/saas/ActivateSaaS.tsx

Texto + CTA → pago

MonthlyDashboard.tsx

📍 src/components/saas/MonthlyDashboard.tsx

Muestra

estado global

alertas

impacto acumulado

roadmap vivo

9️⃣ Componentes TRANSVERSALES (ya los tienes)
Componente	Uso
AvatarPane	Copiloto
AssistantChat	Explicación contextual
bus.ts	Eventos UI
RadarScore	Visualización

👉 No se tocan ahora.

10️⃣ Qué ELIMINAR o IGNORAR sin miedo
Ruta / Componente	Motivo
/asistente	duplicado
/dts-chat	confunde
/start	onboarding ya vive dentro
estados paralelos	deuda
11️⃣ Regla de oro (para no volver al caos)

Cada pantalla responde a UNA pregunta del CEO.
Si responde a dos, está mal diseñada.

# Árbol de componentes final (MVP CEO-centric)
app/
└── (routes)
    ├── page.tsx                         // "/" Landing (marketing)
    │   ├── Navbar
    │   ├── HeroSection
    │   ├── VideoWelcome
    │   ├── ClaridadSection
    │   ├── ProblemaSection
    │   ├── SolucionSection
    │   ├── CredencialesSection
    │   └── FAQSection
    │
    ├── diagnostico-full/page.tsx         // "/diagnostico-full" CORE (1 ruta)
    │   └── DiagnosticoOrchestrator (state machine)
    │       ├── ShellLayout
    │       │   ├── HeaderBar (logo + progreso + acciones)
    │       │   ├── LeftPane (Avatar)
    │       │   │   └── AvatarPane
    │       │   └── RightPane (Contenido según fase)
    │       │
    │       ├── PhaseRouter (switch phase)
    │       │   ├── PhaseOnboarding
    │       │   │   └── OnboardingContextForm
    │       │   │
    │       │   ├── PhaseHowItWorks
    │       │   │   └── HowItWorksCards
    │       │   │
    │       │   ├── PhaseAssessment
    │       │   │   └── CriterionFlow
    │       │   │       ├── ProgressHeader (Dimensión + Paso X/12)
    │       │   │       ├── CriterionCard (antes CriterionQuestion)
    │       │   │       │   ├── CriterionPrompt (pregunta CEO-friendly)
    │       │   │       │   ├── HelpAccordion (ejemplos / qué significa)
    │       │   │       │   └── TripleInput
    │       │   │       │       ├── AsIsSelector (1-5)
    │       │   │       │       ├── ToBeSelector (1-5)
    │       │   │       │       └── ImportanceSelector (1-4)
    │       │   │       └── NavigationBar (Atrás / Siguiente / Guardar)
    │       │   │
    │       │   ├── PhaseSummary
    │       │   │   └── QuickSummary
    │       │   │       ├── KPICards
    │       │   │       ├── RadarChartComponent
    │       │   │       └── CEOInsights (texto corto: fuerte / bloqueado / riesgo)
    │       │   │
    │       │   ├── PhasePriorities
    │       │   │   └── BasesVsAmplifiers
    │       │   │       ├── BasesList (criterios base)
    │       │   │       └── AmplifiersList (criterios amplificadores)
    │       │   │
    │       │   ├── PhaseInitiatives
    │       │   │   └── InitiativesMatrix
    │       │   │       ├── Matrix2x2
    │       │   │       └── InitiativeCard (x N)
    │       │   │           ├── Title (6.1.1.A)
    │       │   │           ├── TypeBadge (QuickWin/Base/Transf/Maint)
    │       │   │           ├── EffortRange (semanas)
    │       │   │           └── ImpactRange (horas / €)
    │       │   │
    │       │   ├── PhaseRoadmap
    │       │   │   └── RoadmapQ
    │       │   │       ├── QuarterColumn (Q1)
    │       │   │       ├── QuarterColumn (Q2)
    │       │   │       └── QuarterColumn (Q3)
    │       │   │
    │       │   ├── PhasePaywall
    │       │   │   └── ActivateSaaS
    │       │   │
    │       │   └── PhaseMonthly
    │       │       └── MonthlyDashboard
    │       │           ├── StatusOverview
    │       │           ├── Alerts (pocas)
    │       │           ├── RoadmapLive
    │       │           └── ImpactAchievedVsPending
    │       │
    │       └── AssistantChat (opcional dentro del shell, no como ruta)
    │
    └── resultados/page.tsx               // "/resultados" (legacy) -> idealmente redirige
        └── ResultadosLegacy (opcional: mantener mientras migras)

Solo un sitio decide fases: DiagnosticoOrchestrator

Cada PhaseX es una pantalla completa, no “trozos sueltos”.

Cada pantalla recibe props ya digeridas (sin cálculos).

El frontend no sabe:

qué es TMF / DMM / ISO

cómo se calcula impacto o effort

cómo se ordena un roadmap

Tu ruta “limpia” (mínimo caos)

/ marketing

/diagnostico-full producto

/resultados solo si lo quieres mantener como “legacy”, pero idealmente lo absorbemos en PhaseSummary + PhasePriorities + PhaseInitiatives + PhaseRoadmap

# LO QUE YA EXISTE / LO QUE FALTA 
1) Rutas reales que YA existen (confirmado por tu next build)
✅ Landing

/

Existe: src/app/page.tsx

Existe: src/components/Navbar.tsx

Existe: src/components/ClaridadSection.tsx

Existe: src/components/ProblemaSection.tsx

Existe: src/components/SolucionSection.tsx

Existe: assets en /public (Welcome.mp4, logos TMF/MIT)

Falta (opcional):

Separar “HeroSection / VideoWelcome / Credenciales / FAQ” en componentes para que page.tsx no crezca como monstruo.

Nuevos recomendados:

src/components/landing/HeroSection.tsx

src/components/landing/VideoWelcome.tsx

src/components/landing/CredentialsSection.tsx

src/components/landing/FAQSection.tsx

✅ Producto core (diagnóstico)

/diagnostico-full

Existe: src/app/diagnostico-full/page.tsx

Existe (mencionados por ti):

src/components/diagnostico/CriterionQuestion.tsx

src/components/diagnostico/OnboardingWorkshop.tsx

src/components/diagnostico/DimensionProgressMapVisual.tsx

Existe:

src/components/AvatarPane.tsx

src/components/AssistantChat.tsx

src/lib/bus.ts

Falta (clave para desacoplar, sin hacks):

Un orquestador único (state machine de pantallas) en un componente dedicado.

Nuevo recomendado: src/components/diagnostico/DiagnosticoOrchestrator.tsx

Ahora el “orquestador” probablemente está implícito dentro de src/app/diagnostico-full/page.tsx. Eso te esclaviza, porque cada cambio rompe todo.

✅ Resultados (legacy)

/resultados

Existe: src/app/resultados/page.tsx

Existe: src/components/KPICards.tsx

Existe: src/components/RadarChartComponent.tsx

Existe: src/lib/scoring-utils.ts

Falta (si lo quieres CEO-centric y 100% producto):

Integrar resultados dentro del flujo /diagnostico-full como fases (Summary / Priorities / Initiatives / Roadmap).
Ahora mismo /resultados es una pantalla separada y te obliga a duplicar UX.

2) Backend/API real que YA existe (confirmado por tus pruebas)

Existe: src/app/api/debug/env/route.ts

Existe: src/app/api/dts/score/get/route.ts

Existe: src/app/api/dts/score/recalc/route.ts

Existe: src/app/api/dts/responses/route.ts

Existe: src/lib/supabase/server.ts

Existe: src/lib/supabase.ts (cliente anon)

✅ Y ya validaste:

/api/debug/env ok

/api/dts/score/get ok

/api/dts/score/recalc ok

3) Mapeo del árbol “ideal” a tus ficheros reales (qué tocar y qué crear)
A) Landing (/)

Nodo ideal → Real

Landing → src/app/page.tsx

Navbar → src/components/Navbar.tsx

ClaridadSection → src/components/ClaridadSection.tsx

ProblemaSection → src/components/ProblemaSection.tsx

SolucionSection → src/components/SolucionSection.tsx

Crear (recomendado para limpiar):

src/components/landing/HeroSection.tsx

src/components/landing/VideoWelcome.tsx

src/components/landing/CredentialsSection.tsx

src/components/landing/FAQSection.tsx

B) Diagnóstico core (/diagnostico-full)

Nodo ideal → Real

DiagnosticoFullPage → src/app/diagnostico-full/page.tsx

OnboardingContextForm → hoy lo tienes dentro de OnboardingWorkshop.tsx (o mezclado)

CriterionCard/TripleInput → hoy es src/components/diagnostico/CriterionQuestion.tsx

ProgressHeader/Dimensión/paso → hoy está en diagnostico-full/page.tsx o en DimensionProgressMapVisual.tsx

AvatarPane → src/components/AvatarPane.tsx

AssistantChat → src/components/AssistantChat.tsx

Crear (imprescindible si quieres desacoplado):

src/components/diagnostico/DiagnosticoOrchestrator.tsx

Este archivo debe:

decidir fase (onboarding | howItWorks | assessment | summary | priorities | initiatives | roadmap | paywall | monthly)

cargar/guardar assessmentId

invocar API (responses, score/recalc, score/get)

pasar props limpias a cada fase

Crear (fases como pantallas, 1 componente = 1 pantalla):

src/components/diagnostico/phases/PhaseOnboarding.tsx

src/components/diagnostico/phases/PhaseHowItWorks.tsx

src/components/diagnostico/phases/PhaseAssessment.tsx

src/components/diagnostico/phases/PhaseSummary.tsx

src/components/diagnostico/phases/PhasePriorities.tsx

src/components/diagnostico/phases/PhaseInitiatives.tsx

src/components/diagnostico/phases/PhaseRoadmap.tsx

src/components/diagnostico/phases/PhasePaywall.tsx

src/components/diagnostico/phases/PhaseMonthly.tsx

Ojo: no es más trabajo: es el mismo trabajo, pero sin que el código te ate las manos.

C) Resultados (/resultados)

Nodo ideal → Real

Radar → src/components/RadarChartComponent.tsx

KPIs → src/components/KPICards.tsx

Decisión recomendada (CEO-centric):

Dejar /resultados como “legacy” (por ahora) pero:

o bien redirigir desde /resultados a /diagnostico-full#phase=summary (o query ?phase=summary)

o mantenerlo 2 semanas y luego eliminar

4) Qué falta para tu MVP12 (realista y robusto)

Ahora mismo tienes motor de score funcionando. Lo que falta para el documento MVP12 que pedías es:

Limitar diagnóstico a 12 criterios

Ahora mismo cargas 129.

Hay que crear un “selector MVP12” (server-side, no hardcodeado en UI).

Resultado: UX mucho más ligera y vendible.

Iniciativas por criterio (2–4) + Effort/Impact v1

Esto debe venir del backend (aunque sea JSON estático versionado).

El frontend solo renderiza: matriz + roadmap.

Fases integradas dentro de /diagnostico-full

Para que el CEO sienta “juego con progreso”:

onboarding → reglas → 12 preguntas → resumen → prioridades → iniciativas → roadmap → activar mensual

## NODOS DEL MVP
/diagnostico-full  (src/app/diagnostico-full/page.tsx)   [CLIENT]
└─ State machine: phase = onboarding | assessment | completed
   ├─ onboarding:
   │   └─ <OnboardingWorkshop />  (src/components/diagnostico/OnboardingWorkshop.tsx)
   │        └─ crea assessment + onboarding_data en Supabase (probable)
   │
   ├─ assessment:
   │   ├─ Left:
   │   │   └─ <DimensionProgressMapVisual /> (importado como DimensionProgressMap)
   │   │
   │   ├─ Center:
   │   │   └─ <CriterionQuestion />
   │   │        ├─ triple input (as-is / to-be / importancia)
   │   │        ├─ botones next/prev
   │   │        └─ llama a onResponse() (que hace POST /api/dts/responses)
   │   │
   │   └─ Right:
   │       ├─ <AvatarPane />
   │       └─ <AssistantChat messages=... />
   │
   └─ completed:
       └─ CTA a /resultados
Y además hay un “bus”:
bus ('chatMessage') -> DiagnosticoFullPage
  └─ guarda chat en tabla dts_chat_messages (CLIENT supabase)
  └─ cuando cambia criterio, carga historial por criterio (CLIENT supabase)

2) Mapa “esto existe ya” vs “esto falta” para tu FRONTEND_MVP CEO-centric
✅ Existe (confirmado por tu árbol + imports)

- src/app/diagnostico-full/page.tsx (orquestador actual)
- src/components/diagnostico/OnboardingWorkshop.tsx
- src/components/diagnostico/DimensionProgressMapVisual.tsx
- src/components/diagnostico/CriterionQuestion.tsx
- src/components/AvatarPane.tsx
- src/components/AssistantChat.tsx
- src/lib/bus.ts

/api/dts/responses existe (lo usa tu handleResponseChange)

/api/dts/score/get y /api/dts/score/recalc existen y funcionan (ya lo verificaste)

/api/debug/env existe

⚠️ Existe pero ahora mismo te ata / está “acoplado” (zona peligrosa)

⚠️ Existe pero ahora mismo te ata / está “acoplado” (zona peligrosa)

DiagnosticoFullPage es CLIENT y está haciendo cosas de servidor directamente:

Lee dts_criteria desde el navegador con supabase.from('dts_criteria')

Lee dts_responses desde el navegador con supabase.from('dts_responses')

Guarda y lee dts_chat_messages desde el navegador con supabase.from('dts_chat_messages')

Hace update a dts_assessments desde el navegador al completar

Eso solo funciona si:

tu RLS está abierta para anon (o mal configurada),

o estás usando ANON con permisos amplios.

Y eso es justo lo contrario de “no esclavizarnos con excepciones”.

❌ Falta (para el MVP12 CEO-centric como lo has descrito)

Frontend/pantallas:

/resultados ahora mismo no sé si ya pinta:

bases vs amplificadores,

matriz impacto/esfuerzo (iniciativas),

roadmap Q1/Q2/Q3,

“activar SaaS mensual”.

Pantallas 6–12 (resumen, bases vs amplificadores, brechas, matriz iniciativas, roadmap, paywall, dashboard SaaS) → por lo que veo, están conceptualizadas, pero no aterrizadas en componentes/rutas.

Arquitectura de frontend (desacoplada):

“Data Access Layer” por API routes (server) en vez de lecturas directas con supabase client para tablas sensibles.

Un “state model” claro para MVP12 (12 criterios fijos, no 129).

3) Lo importante: dónde estás acoplado y cómo lo desacoplamos SIN reventar nada
Problema real (el que te puede explotar)

Tú quieres:

desacoplar,

no excepciones,

que el código no te esclavice,

y preparar futuro (ISO, otros modelos).

Ahora mismo el frontend está acoplado porque:

El page client decide el “modelo de datos” (cómo se cargan criterios, subdimensiones, orden, etc.).

El page client habla con Supabase directo para tablas core (criteria/responses/chat/assessments).

El MVP12 aún no está “configurado” como producto, sino como “full DMM” con tier1/tier2.

Patrón limpio (sin excepciones)

Cliente (React): solo UI + eventos

Servidor (API routes): lectura/escritura a Supabase usando service role

Modelo (MVP12 config): un fichero de definición (o tabla) que dice qué 12 criterios entran

Con esto:

mañana metes ISO → solo agregas “otro pack de criterios” sin tocar UI core.

## 1 Árbol final (producto MVP12 CEO-centric) — diagrama simple
/ (Home)                         src/app/page.tsx
└─ CTA → /diagnostico-full        src/app/diagnostico-full/page.tsx

/diagnostico-full (core)
└─ phases:
   ├─ onboarding                 components/diagnostico/OnboardingWorkshop.tsx
   ├─ assessment                 components/diagnostico/CriterionQuestion.tsx
   │  ├─ left: progress map      components/diagnostico/DimensionProgressMapVisual.tsx
   │  └─ right: avatar + chat    components/AvatarPane.tsx + components/AssistantChat.tsx
   └─ completed → /resultados    src/app/resultados/page.tsx

/resultados (CEO view)
└─ KPIs + Radar + cards dimensión
   ├─ KPICards                   components/KPICards
   └─ RadarChartComponent        components/RadarChartComponent

Hasta aquí: esto ya existe.
Lo que no existe aún en frontend (pero sí en tu visión CEO MVP12):

“Brechas top + iniciativas + matriz impacto/esfuerzo + roadmap Q1/Q2/Q3 + SaaS mensual”.

2) Lo que tienes hoy en /resultados (y dónde está el acoplamiento)

Tu src/app/resultados/page.tsx ya hace una cosa muy bien:

✅ Los scores vienen del backend vía:

GET /api/dts/score/get?assessmentId=...
# CAMBIOS
## Front-end: pantallas, rutas y estado (MVP12 vs FULL)
 Front-end — Pantallas y flujo MVP12 vs FULL (28/12/25)

### Objetivo
Separar de forma clara y honesta dos modos de uso dentro del mismo front-end:

- **MVP12** → Evaluación reducida (12 criterios)
- **FULL** → Evaluación completa TM Forum DMM (129 criterios)

Ambos modos comparten la misma página `/diagnostico-full`, diferenciándose **únicamente por el `pack`** y el estado del assessment.

---

### Rutas activas

#### MVP12 (versión reducida) 
/diagnostico-full?pack=mvp12_v1

- 12 criterios
- Exploración inicial
- No es el diagnóstico completo

### FULL (ejemplo / demo completo)
/diagnostico-full?pack=tmf_full_v5&demo=true

- 129 criterios
- Referencia metodológica
- No editable / modo ejemplo

---

## Principio clave de arquitectura

> **El `pack` define el diagnóstico.  
El `assessmentId` define el estado.**

Nunca se mezclan.

---

## Gestión correcta del estado (assessment)

### Clave de almacenamiento
Cada pack mantiene su propio assessment en `localStorage`:

- `dts_assessment_id__mvp12_v1`
- `dts_assessment_id__tmf_full_v5`

Esto evita:
- Reutilizar por error un assessment de otro pack
- Confundir MVP12 con FULL
- Estados inconsistentes al recargar o abrir varias pestañas

---

### Orden de resolución del assessment (INIT)

Al cargar `/diagnostico-full`:

1. **Si viene `assessmentId` en la URL**
   - Se hidrata directamente ese assessment

2. **Si no viene en URL**
   - Se busca en `localStorage` usando la clave del pack actual

3. **Si no existe**
   - Se crea un nuevo assessment vía API:
     ```
     POST /api/dts/assessment/create
     body: { pack }
     ```
   - Se guarda el `assessmentId` en `localStorage`
   - Se hidrata el nuevo assessment

> Se utiliza un guard (`createInFlightRef`) para evitar creaciones duplicadas en renders simultáneos.

---

### Onboarding vs Diagnóstico (decisión automática)

Tras hidratar el assessment (`/api/dts/assessment/get`):

- **Si `onboarding_data` es `null`**
  → Se muestra `OnboardingWorkshop`

- **Si `onboarding_data` existe**
  → Se cargan:
  - criterios (`/api/dts/criteria`)
  - respuestas (`/api/dts/responses/get`)
  → Se entra en modo diagnóstico (preguntas)

No hay flags manuales.  
El **estado real del assessment manda**.

---

### Chat y respuestas (arquitectura limpia)

### Chat
- Guardado **solo vía API**
- No acceso directo a Supabase desde el front

Endpoints:
- `POST /api/dts/chat/post`
- `GET /api/dts/chat/get`

# RESULTADOS
- Guardado por criterio vía:

## Resultados v1 — Backend → Frontend (mapeo exacto)
✅ Fuente de verdad (tablas)

dts_assessments (pack, onboarding_data, status, etc.)

dts_responses (as_is_level, to_be_level, importance, etc.)

dts_criteria (code, short_label_es, description_es, subdimension_id, etc.)

dts_subdimensions (code, name_es, dimension_id, display_order)

dts_dimensions (code, name_es, display_order)

## 2) “Qué campos alimentan cada bloque” (sin inventar)
Bloque A — Cabecera (contexto del diagnóstico)

Sale de: dts_assessments.onboarding_data + dts_assessments.pack

companyName → onboarding_data.companyName

sector → onboarding_data.sector

role → onboarding_data.role

packLabel → assessment.pack (mvp12_v1 vs tmf_full_v5)

status → assessment.status

Frontend pinta: “Empresa / Sector / Rol / Versión (12 o 129)”

Bloque B — Progreso (completado)

Sale de: conteo dts_responses vs total criterios del pack

totalCriteria → count(criteria del pack)

answeredCriteria → count(responses distinct criteria_id where assessment_id = X)

progressPct → answered / total (esto lo calcula backend)

Bloque C — Radar / Score por Dimensión (6 dimensiones)

Sale de: agregación de dts_responses.as_is_level por dts_dimensions

dimensions[]: { code, name_es, score_as_is_avg }

(opcional) score_to_be_avg

Nota: Si quieres que el radar sea 0–100, backend transforma: score100 = (avgLevel - 1) / 4 * 100.
Si quieres mantener 1–5, también vale.

Bloque D — Tabla por Subdimensión (para “mapa” en resultados)

Sale de: agregación de dts_responses.as_is_level por dts_subdimensions

subdimensions[]: { code, name_es, dimension_code, avg_as_is, avg_to_be, gap }

gap backend (p.ej. to_be - as_is o normalizado)

Bloque E — Lista de “Top Gaps” (prioridad)

Sale de: criterio a criterio (no frontend)

top_gaps[]: { criteria_code, short_label_es, dimension_name, subdimension_name, as_is, to_be, importance, gap, weighted_gap }

weighted_gap (backend):

mínimo: gap * importance

o normalizado: ((to_be - as_is)/4) * importance

Hay un assessment con 129 respuestas:
b4b63b9b-4412-4628-8a9a-527b0696426a → esto huele a FULL (129 criterios).
 -- 1) ¿Existe en dts_assessments el assessment que tiene 129 respuestas?
SELECT
  id,
  created_at,
  updated_at
FROM public.dts_assessments
WHERE id = 'b4b63b9b-4412-4628-8a9a-527b0696426a';

SELECT
  policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname='public'
  AND tablename='dts_responses'
ORDER BY policyname;
[
  {
    "policyname": "anon_demo_select_responses",
    "cmd": "SELECT",
    "roles": "{anon}",
    "qual": "(assessment_id = 'b4b63b9b-4412-4628-8a9a-527b0696426a'::uuid)",
    "with_check": null
  },
  {
    "policyname": "responses_member_access",
    "cmd": "ALL",
    "roles": "{public}",
    "qual": "(EXISTS ( SELECT 1\n   FROM dts_assessments a\n  WHERE ((a.id = dts_responses.assessment_id) AND is_org_member(a.organization_id))))",
    "with_check": "(EXISTS ( SELECT 1\n   FROM dts_assessments a\n  WHERE ((a.id = dts_responses.assessment_id) AND is_org_member(a.organization_id))))"
  }
]
[
  SELECT
  id,
  organization_id,
  created_by,
  is_demo,
  pack,
  created_at
FROM public.dts_assessments
WHERE id = 'a780b849-2e6b-453b-a7f3-e7b98c6544f7';

  {
    "id": "a780b849-2e6b-453b-a7f3-e7b98c6544f7",
    "organization_id": null,
    "created_by": null,
    "is_demo": false,
    "pack": "mvp12_v1",
    "created_at": "2025-12-28 23:47:36.491+00"
  }
]
Breakdown por dimensión (100% válido ahora)
SELECT
  d.id   AS dimension_id,
  d.code AS dimension_code,
  d.name AS dimension_name,
  count(DISTINCT c.id) AS total_criteria,
  count(DISTINCT r.criteria_id) AS answered_criteria
FROM public.dts_criteria c
JOIN public.dts_subdimensions s ON s.id = c.subdimension_id
JOIN public.dts_dimensions d    ON d.id = s.dimension_id
LEFT JOIN public.dts_responses r
  ON r.criteria_id = c.id
 AND r.assessment_id = '28198cfe-8a12-43f7-8d0b-6648fd35a084'
GROUP BY d.id, d.code, d.name
ORDER BY d.code;

SELECT
  p.pack,
  count(*) AS total_criteria,
  (
    SELECT count(DISTINCT r.criteria_id)
    FROM public.dts_responses r
    JOIN public.dts_pack_criteria p2
      ON p2.criteria_id = r.criteria_id
     AND p2.pack = p.pack
    WHERE r.assessment_id = '28198cfe-8a12-43f7-8d0b-6648fd35a084'
  ) AS answered_criteria,
  (
    (
      SELECT count(DISTINCT r.criteria_id)
      FROM public.dts_responses r
      JOIN public.dts_pack_criteria p2
        ON p2.criteria_id = r.criteria_id
       AND p2.pack = p.pack
      WHERE r.assessment_id = '28198cfe-8a12-43f7-8d0b-6648fd35a084'
    )::numeric / NULLIF(count(*)::numeric,0)
  ) AS completion_rate
FROM public.dts_pack_criteria p
WHERE p.pack = 'mvp12_v1'
GROUP BY p.pack;

SELECT
  d.id   AS dimension_id,
  d.code AS dimension_code,
  d.name AS dimension_name,
  count(DISTINCT c.id) AS total_criteria,
  count(DISTINCT r.criteria_id) AS answered_criteria
FROM public.dts_pack_criteria p
JOIN public.dts_criteria c      ON c.id = p.criteria_id
JOIN public.dts_subdimensions s ON s.id = c.subdimension_id
JOIN public.dts_dimensions d    ON d.id = s.dimension_id
LEFT JOIN public.dts_responses r
  ON r.criteria_id = c.id
 AND r.assessment_id = '28198cfe-8a12-43f7-8d0b-6648fd35a084'
WHERE p.pack = 'mvp12_v1'
GROUP BY d.id, d.code, d.name
ORDER BY d.code;

--subdimension
SELECT
  s.id      AS subdimension_id,
  s.code    AS subdimension_code,
  s.name_es AS subdimension_name_es,
  d.code    AS dimension_code,
  count(DISTINCT c.id) AS total_criteria,
  count(DISTINCT r.criteria_id) AS answered_criteria
FROM public.dts_pack_criteria p
JOIN public.dts_criteria c      ON c.id = p.criteria_id
JOIN public.dts_subdimensions s ON s.id = c.subdimension_id
JOIN public.dts_dimensions d    ON d.id = s.dimension_id
LEFT JOIN public.dts_responses r
  ON r.criteria_id = c.id
 AND r.assessment_id = '28198cfe-8a12-43f7-8d0b-6648fd35a084'
WHERE p.pack = 'mvp12_v1'
GROUP BY s.id, s.code, s.name_es, d.code
ORDER BY d.code, s.code;

## Onboarding
1️⃣ Sí: todo empieza aquí (organización)

👉 Correcto: el onboarding empieza creando la organización
👉 Sí: aquí es donde se genera y se guarda el organization_id
👉 Sí: ese organization_id debe ser la columna vertebral de todo lo demás (assessments, responses, resultados)

Tu tabla dts_organizations está bien diseñada para MVP. No sobra nada crítico.

2️⃣ Qué significa esta tabla en el flujo real (usuario)

Desde el punto de vista del usuario, el onboarding debería verse así:
🟦 Paso 1 — “Identifica tu empresa” (1 sola pantalla) Campos mínimos y claros (los que ya tienes):

- name → Nombre de la empresa (OBLIGATORIO)

- industry → Sector (selector simple)

- size → Tamaño (rangos)

- country → País

- email → Email de contacto (opcional en MVP)

- phone → Teléfono (opcional)

👉 Al hacer Continuar:
Se hace INSERT INTO dts_organizations

- Se obtiene organization_id

- Se guarda en memoria de sesión / estado frontend

- No se pide login

- No se habla de cuentas ni usuarios

- Esto responde a la pregunta del CEO: “¿Esto está adaptado a mi empresa?”

Porque todo lo que venga después ya está contextualizado.

3️⃣ Qué pasa justo después (arquitectura correcta)
🟦 Paso 2 — Crear el diagnóstico

Automáticamente (sin que el usuario lo note):
- Se crea un registro en dts_assessments con:

- organization_id ← este es el enlace clave

- pack = 'mvp12_v1'

- is_demo = true (en MVP)

- status = 'in_progress'

👉 Aquí nace el assessment_id
ORGANIZATION (empresa)
  └── ASSESSMENT (diagnóstico concreto)
        └── RESPONSES (respuestas a criterios)
              └── RESULTADOS
                    └── MATRIZ
                    └── ROADMAP
