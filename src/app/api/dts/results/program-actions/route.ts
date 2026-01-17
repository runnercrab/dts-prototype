// src/app/api/dts/results/program-actions/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function parseBool(v: string | null, defaultValue: boolean) {
  if (v === null || v === undefined || v === "") return defaultValue;
  const s = v.toLowerCase();
  if (s === "1" || s === "true" || s === "yes") return true;
  if (s === "0" || s === "false" || s === "no") return false;
  return defaultValue;
}

function normalizeUuid(raw: string) {
  const s = (raw || "").trim();
  const noTrailingSlashes = s.replace(/\/+$/g, "");
  const firstToken = noTrailingSlashes.split(/[?#&\s]/)[0];
  return firstToken;
}

function toNum(v: any, fallback = 0) {
  if (v === null || v === undefined) return fallback;
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  }
  return fallback;
}

function toInt(v: any, fallback = 0) {
  return Math.round(toNum(v, fallback));
}

type ActionStatus = "todo" | "in_progress" | "done" | null;

function normalizeStatus(s: any): Exclude<ActionStatus, null> {
  if (s === "done") return "done";
  if (s === "in_progress") return "in_progress";
  // Tratamos null/undefined/otros como "todo" para consistencia ejecutiva
  return "todo";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const assessmentIdRaw = searchParams.get("assessmentId") || "";
  const programIdRaw = searchParams.get("programId") || "";

  const assessmentId = normalizeUuid(assessmentIdRaw);
  const programId = normalizeUuid(programIdRaw);

  const useOverrides = parseBool(searchParams.get("useOverrides"), true);

  if (!assessmentId || !isUuid(assessmentId)) {
    return NextResponse.json(
      {
        error: "assessmentId inválido (UUID requerido)",
        received: assessmentIdRaw,
        normalized: assessmentId,
      },
      { status: 400 }
    );
  }

  if (!programId || !isUuid(programId)) {
    return NextResponse.json(
      {
        error: "programId inválido (UUID requerido)",
        received: programIdRaw,
        normalized: programId,
      },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // validar assessment existe
  const { data: assessment, error: aErr } = await supabase
    .from("dts_assessments")
    .select("id, pack")
    .eq("id", assessmentId)
    .single();

  if (aErr || !assessment) {
    return NextResponse.json(
      { error: "Assessment no encontrado", details: aErr?.message ?? null },
      { status: 404 }
    );
  }

  // RPC (checklist ordenada)
  const { data, error } = await supabase.rpc("dts_results_program_actions_v2", {
    p_assessment_id: assessmentId,
    p_program_id: programId,
    p_use_overrides: useOverrides,
  });

  if (error) {
    console.error("[api program-actions] rpc error:", error);
    return NextResponse.json(
      { error: "Error obteniendo acciones del programa", details: error.message },
      { status: 500 }
    );
  }

  const rows = Array.isArray(data) ? data : [];

  const items = rows.map((r: any) => ({
    sort_order: toInt(r.sort_order, 1000),
    action_id: r.action_id,
    action_code: r.action_code,
    title: r.title,
    description: r.description ?? null,

    impact_score: toInt(r.impact_score),
    effort_score: toInt(r.effort_score),
    typical_duration_weeks:
      r.typical_duration_weeks === null || r.typical_duration_weeks === undefined
        ? null
        : toInt(r.typical_duration_weeks),

    owner_hint: r.owner_hint ?? null,
    prerequisites: r.prerequisites ?? null,
    tools_hint: r.tools_hint ?? null,
    tags: Array.isArray(r.tags) ? r.tags : r.tags ?? null,

    status: r.status ?? null,
    notes: r.notes ?? null,
    owner: r.owner ?? null,
  }));

  // Orden estable por sort_order
  items.sort((a: any, b: any) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  // ✅ Progress (backend-calculated)
  let done = 0;
  let in_progress = 0;
  let todo = 0;

  for (const it of items) {
    const s = normalizeStatus(it.status);
    if (s === "done") done += 1;
    else if (s === "in_progress") in_progress += 1;
    else todo += 1;
  }

  const total = items.length;
  const pct_done = total > 0 ? Math.round((done / total) * 1000) / 10 : 0; // 1 decimal
  const pct_started =
    total > 0 ? Math.round(((done + in_progress) / total) * 1000) / 10 : 0;

  return NextResponse.json({
    assessment_id: assessmentId,
    program_id: programId,
    pack: assessment.pack,
    mode: "checklist",
    count: items.length,
    progress: {
      total,
      done,
      in_progress,
      todo,
      pct_done,
      pct_started,
    },
    items,
  });
}
