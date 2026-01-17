// src/app/api/dts/assessment/actions/status/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function isUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

const ALLOWED_STATUS = new Set(["not_started", "in_progress", "blocked", "done"]);

type Payload = {
  assessment_id: string;
  action_id: string;

  // Mutables (assessment-level)
  status?: string | null;
  notes?: string | null;
  owner?: string | null;

  start_date?: string | null; // YYYY-MM-DD
  due_date?: string | null; // YYYY-MM-DD

  impact_override?: number | null;
  effort_override?: number | null;
};

function hasOwn(obj: any, key: string) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

function normalizeText(v: any, maxLen: number): string | null {
  if (v === undefined) return null;
  if (v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function normalizeStatus(v: any): string | null {
  if (v === undefined) return null;
  if (v === null) return null;
  const s = String(v).trim();
  if (!s) return null;
  return s;
}

function isValidYyyyMmDd(v: any): boolean {
  if (v === null || v === undefined) return true; // null permitido
  const s = String(v).trim();
  if (!s) return false;
  // formato y rango simple
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [yy, mm, dd] = s.split("-").map((x) => Number(x));
  if (!Number.isFinite(yy) || !Number.isFinite(mm) || !Number.isFinite(dd)) return false;
  if (mm < 1 || mm > 12) return false;
  if (dd < 1 || dd > 31) return false;
  return true;
}

function normalizeNumberOrNull(v: any): number | null {
  if (v === undefined) return null;
  if (v === null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return NaN;
  return n;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload;

    const assessment_id = (body.assessment_id || "").trim();
    const action_id = (body.action_id || "").trim();

    if (!assessment_id || !isUuid(assessment_id)) {
      return NextResponse.json(
        { error: "assessment_id inválido (UUID requerido)", received: body.assessment_id ?? null },
        { status: 400 }
      );
    }
    if (!action_id || !isUuid(action_id)) {
      return NextResponse.json(
        { error: "action_id inválido (UUID requerido)", received: body.action_id ?? null },
        { status: 400 }
      );
    }

    // Validaciones (solo si vienen en el payload)
    const statusProvided = hasOwn(body, "status");
    const notesProvided = hasOwn(body, "notes");
    const ownerProvided = hasOwn(body, "owner");
    const startDateProvided = hasOwn(body, "start_date");
    const dueDateProvided = hasOwn(body, "due_date");
    const impactOvProvided = hasOwn(body, "impact_override");
    const effortOvProvided = hasOwn(body, "effort_override");

    if (
      !statusProvided &&
      !notesProvided &&
      !ownerProvided &&
      !startDateProvided &&
      !dueDateProvided &&
      !impactOvProvided &&
      !effortOvProvided
    ) {
      return NextResponse.json(
        { error: "Nada que guardar (envía status y/o notes y/o owner y/o fechas y/o overrides)" },
        { status: 400 }
      );
    }

    const status = statusProvided ? normalizeStatus(body.status) : null;
    if (statusProvided && status !== null && !ALLOWED_STATUS.has(status)) {
      return NextResponse.json(
        {
          error: "status inválido",
          allowed: Array.from(ALLOWED_STATUS),
          received: status,
        },
        { status: 400 }
      );
    }

    if (startDateProvided && !isValidYyyyMmDd(body.start_date)) {
      return NextResponse.json(
        { error: "start_date inválida (formato YYYY-MM-DD)", received: body.start_date ?? null },
        { status: 400 }
      );
    }
    if (dueDateProvided && !isValidYyyyMmDd(body.due_date)) {
      return NextResponse.json(
        { error: "due_date inválida (formato YYYY-MM-DD)", received: body.due_date ?? null },
        { status: 400 }
      );
    }

    const impact_override = impactOvProvided ? normalizeNumberOrNull(body.impact_override) : null;
    if (impactOvProvided && Number.isNaN(impact_override as any)) {
      return NextResponse.json(
        { error: "impact_override inválido (número requerido)", received: body.impact_override ?? null },
        { status: 400 }
      );
    }

    const effort_override = effortOvProvided ? normalizeNumberOrNull(body.effort_override) : null;
    if (effortOvProvided && Number.isNaN(effort_override as any)) {
      return NextResponse.json(
        { error: "effort_override inválido (número requerido)", received: body.effort_override ?? null },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ✅ Upsert por PK (assessment_id, action_id), pero "parcial":
    // solo incluimos columnas que vienen en el body, para no pisar con null por accidente.
    const upsertRow: any = {
      assessment_id,
      action_id,
      updated_at: new Date().toISOString(),
    };

    if (statusProvided) upsertRow.status = status; // null = reset
    if (notesProvided) upsertRow.notes = normalizeText(body.notes, 2000); // "" => null
    if (ownerProvided) upsertRow.owner = normalizeText(body.owner, 200); // "" => null

    if (startDateProvided) upsertRow.start_date = body.start_date === null ? null : String(body.start_date).trim();
    if (dueDateProvided) upsertRow.due_date = body.due_date === null ? null : String(body.due_date).trim();

    if (impactOvProvided) upsertRow.impact_override = impact_override;
    if (effortOvProvided) upsertRow.effort_override = effort_override;

    const { data, error } = await supabase
      .from("dts_assessment_actions")
      .upsert(upsertRow, { onConflict: "assessment_id,action_id" })
      .select(
        "assessment_id, action_id, status, notes, owner, start_date, due_date, impact_override, effort_override"
      )
      .single();

    if (error) {
      console.error("[assessment/actions/status] upsert error:", error);
      return NextResponse.json(
        { error: "Error guardando estado", details: error.message },
        { status: 500 }
      );
    }

    // devolver también campos en raíz ayuda al frontend (por si no mira row.*)
    return NextResponse.json({
      ok: true,
      row: data,
      status: (data as any)?.status ?? null,
      notes: (data as any)?.notes ?? null,
      owner: (data as any)?.owner ?? null,
      start_date: (data as any)?.start_date ?? null,
      due_date: (data as any)?.due_date ?? null,
      impact_override: (data as any)?.impact_override ?? null,
      effort_override: (data as any)?.effort_override ?? null,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Payload inválido", details: e?.message ?? "unknown" },
      { status: 400 }
    );
  }
}
