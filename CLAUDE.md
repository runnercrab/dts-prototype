# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server with Turbopack (http://localhost:3000)
npm run build        # Production build with Turbopack
npm run lint         # Run ESLint
npm run start        # Start production server
```

## Architecture Overview

This is a Next.js 16 / React 19 application for B2B digital transformation assessments based on the TM Forum Digital Maturity Model (DMM) v5.0.1. It features an AI-powered conversational avatar interface.

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript |
| Styles | Tailwind CSS 3.4 |
| Database | Supabase (PostgreSQL + RLS) |
| Conversational AI | OpenAI GPT-4o-mini, Whisper (STT) |
| Avatar | HeyGen Streaming Avatar |
| Visualization | Recharts |
| Monitoring | Sentry |

### Main Application Flow

```
Landing (/)  →  Onboarding  →  Assessment (129 criteria)  →  Results
     ↓              ↓                    ↓                        ↓
  Email          Company             Evaluation with          Scoring,
  capture        profile             avatar + voice           charts,
                                                              roadmap
```

### Directory Structure

```
src/
├── app/                    # Pages (App Router)
│   ├── page.tsx           # Landing page
│   ├── start/             # Email capture
│   ├── diagnostico-full/  # Main assessment
│   ├── resultados/        # Results dashboard
│   └── api/               # Backend endpoints
│       ├── openai/        # Chat GPT-4o-mini
│       ├── chat/          # Voice-optimized chat
│       ├── stt/           # Whisper transcription
│       └── heygen/        # Avatar tokens and sessions
├── components/
│   ├── AvatarPane.tsx     # HeyGen avatar + PTT
│   ├── diagnostico/       # Assessment components
│   │   ├── OnboardingWorkshop.tsx
│   │   ├── CriterionQuestion.tsx
│   │   └── DimensionProgressMap.tsx
│   └── [visualizations]   # RadarChart, HeatMap, Timeline
├── lib/
│   ├── scoring-utils.ts   # TM Forum DMM scoring engine
│   ├── businessImpactEngine.ts  # ROI calculator
│   ├── bus.ts             # Event bus between components
│   └── supabase.ts        # Supabase client
└── hooks/
    └── useRealtimeSaver.ts
```

### Data Model (Supabase)

```
dts_assessments          dts_responses
├── id                   ├── assessment_id (FK)
├── onboarding_data      ├── criterion_id (FK)
├── created_at           ├── as_is_level (1-5)
└── status               ├── to_be_level (1-5)
                         ├── importance (1-5)
        ↓                └── confidence
dts_dimensions (6)
├── strategy             dts_criteria (129)
├── customer             ├── dimension_id (FK)
├── technology           ├── subdimension_id (FK)
├── operations           ├── tier (1 or 2)
├── culture              └── question_text
└── data
```

### Component Communication

```
┌─────────────┐     Event Bus      ┌─────────────┐
│ AvatarPane  │◄──────────────────►│ AssistantChat│
└─────────────┘    (bus.ts)        └─────────────┘
       │                                  │
       ▼                                  ▼
┌─────────────────────────────────────────────┐
│           CriterionQuestion                  │
│    (saves responses to Supabase)            │
└─────────────────────────────────────────────┘
```

### API Routes

| Service | Usage | Endpoint |
|---------|-------|----------|
| OpenAI | Chat + STT | `/api/openai`, `/api/stt` |
| HeyGen | Avatar streaming | `/api/heygen/*` |
| Supabase | Persistence | Direct client |

### Scoring Methodology (TM Forum DMM v5.0.1)

- **6 Dimensions** with equal weight (16.67% each)
- **Maturity Index** (1-5): Initial → Emergente → Definido → Gestionado → Optimizado
- **Weighted Gap:** `(to_be - as_is) × importance`
- **Effort Adjustments:** By company size, sector, current maturity

### Key Patterns

1. **Client-side rendering:** All interactive components use `'use client'`
2. **No caching:** Pages use `force-dynamic` for real-time data
3. **Push-to-Talk:** User holds button → records → Whisper transcribes → GPT responds → Avatar speaks
4. **Demo mode:** `?demo=1` uses preloaded assessment for demos

### Environment Notes

- Supabase credentials hardcoded in `lib/supabase.ts` for Vercel deployment
- localStorage keys: `dts_assessment_id`, `dts_interest_email`

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
