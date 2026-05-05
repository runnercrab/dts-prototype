// src/lib/dts/snapshotResolver.ts
//
// Paso 9-A — Helper para resolver lectura desde snapshot vs live.
// Estados A/B/C/D + fallback live_uncacheable_params (programs).
// Lógica 4 flags discriminantes: fromSnapshot, snapshotInputs,
// modelFingerprintMatch, metadataLive.
//
// PR-1 ejercita: resolveResultsPayload, resolveProgramsPayload.
// PR-2 ejercitará: resolveCoverageV1, resolveFrozenInputs (stubs aquí).

import type { SupabaseClient } from "@supabase/supabase-js";

// ─── DegradeReason ─────────────────────────────────────────────────────
export type DegradeReason =
  | "completed_without_snapshot"
  | "input_fingerprint_mismatch"
  | "model_fingerprint_mismatch"
  | "params_not_cacheable"
  | "metadata_lookup_failed"
  | "unexpected_fallback";

// ─── Resolver A: salida cacheada pura (results_payload, programs_payload) ──
export type ResolvedFromSnapshot<T> =
  | {
      state: "A";
      fromSnapshot: true;
      snapshotInputs: true;
      modelFingerprintMatch: boolean;
      metadataLive: false;
      snapshotId: string;
      triggerReason: string;
      data: T;
    }
  | {
      state: "B";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      metadataLive: false;
      reason: "completed_without_snapshot";
      data: T;
    }
  | {
      state: "C";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      metadataLive: false;
      data: T;
    }
  | {
      state: "D";
      fromSnapshot: true;
      snapshotInputs: true;
      modelFingerprintMatch: boolean;
      inputFingerprintMatch: true;
      metadataLive: false;
      snapshotId: string;
      data: T;
    }
  | {
      state: "D_drift";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: boolean | null;
      inputFingerprintMatch: false;
      metadataLive: false;
      reason: "input_fingerprint_mismatch";
      data: T;
    }
  | {
      // Defensive fallback: status not in ["completed", "draft"] or other unexpected combo.
      // Resolver does not trust snapshot here — falls back to live RPC.
      state: "unexpected_fallback";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      metadataLive: false;
      reason: "unexpected_fallback";
      data: T;
    };

// ─── Resolver B: cobertura E1 (PR-2) ───────────────────────────────────
export type ResolvedCoverageE1 =
  | {
      state: "A";
      fromSnapshot: true;
      snapshotInputs: true;
      modelFingerprintMatch: boolean;
      metadataLive: true;
      snapshotId: string;
      data: CoverageV1;
    }
  | {
      state: "A_metadata_partial";
      fromSnapshot: true;
      snapshotInputs: true;
      modelFingerprintMatch: boolean;
      metadataLive: true;
      snapshotId: string;
      reason: "metadata_lookup_failed";
      data: CoverageV1;
    }
  | {
      state: "B";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      metadataLive: false;
      reason: "completed_without_snapshot";
      data: CoverageV1;
    }
  | {
      state: "C";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      metadataLive: false;
      data: CoverageV1;
    }
  | {
      state: "D";
      fromSnapshot: true;
      snapshotInputs: true;
      modelFingerprintMatch: boolean;
      inputFingerprintMatch: true;
      metadataLive: true;
      snapshotId: string;
      data: CoverageV1;
    }
  | {
      state: "D_drift";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      inputFingerprintMatch: false;
      metadataLive: false;
      reason: "input_fingerprint_mismatch";
      data: CoverageV1;
    }
  | {
      // Defensive fallback: status not in ["completed", "draft"] or other unexpected combo.
      // Coverage en fallback NO usa joins live a dts_dimensions/subdimensions
      // (sirve directamente lo que devuelva dts_results_v1 live).
      state: "unexpected_fallback";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      metadataLive: false;
      reason: "unexpected_fallback";
      data: CoverageV1;
    };

// ─── Resolver C: inputs congelados + metadata viva (PR-2) ──────────────
export type ResolvedFrozenInputs<TInputs> =
  | {
      state: "A_guarded";
      fromSnapshot: true;
      snapshotInputs: true;
      modelFingerprintMatch: true;
      metadataLive: true;
      snapshotId: string;
      inputs: TInputs;
    }
  | {
      state: "A_drift";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: false;
      metadataLive: true;
      reason: "model_fingerprint_mismatch";
      inputs: TInputs;
    }
  | {
      state: "B";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      metadataLive: true;
      reason: "completed_without_snapshot";
      inputs: TInputs;
    }
  | {
      state: "C";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      metadataLive: true;
      inputs: TInputs;
    }
  | {
      state: "D_guarded";
      fromSnapshot: true;
      snapshotInputs: true;
      modelFingerprintMatch: true;
      inputFingerprintMatch: true;
      metadataLive: true;
      snapshotId: string;
      inputs: TInputs;
    }
  | {
      state: "D_drift";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: boolean | null;
      inputFingerprintMatch: boolean | null;
      metadataLive: true;
      reason: "input_fingerprint_mismatch" | "model_fingerprint_mismatch";
      inputs: TInputs;
    }
  | {
      // Defensive fallback: status not in ["completed", "draft"] or other unexpected combo.
      // FrozenInputs en fallback usa metadataLive:true para consistencia: el caller
      // (frenos/priorización) SIEMPRE joinea con dts_criteria live para labels/effort.
      state: "unexpected_fallback";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      metadataLive: true;
      reason: "unexpected_fallback";
      inputs: TInputs;
    };

// ─── Variante uncacheable params (programs_v2) ─────────────────────────
export type ResolvedPrograms<T> =
  | ResolvedFromSnapshot<T>
  | {
      state: "live_uncacheable_params";
      fromSnapshot: false;
      snapshotInputs: false;
      modelFingerprintMatch: null;
      metadataLive: false;
      reason: "params_not_cacheable";
      data: T;
    };

// ─── Tipos de payload ──────────────────────────────────────────────────
// ResultsV1Payload: Record<string, any> en lugar de unknown porque consumers
// (e.g. /dts/resultados/[id]/page.tsx) desestructuran scores/frenos/resumen
// directamente. Antes venía como any implícito desde supabase.rpc; mantenemos
// esa permisividad para no introducir errores TS en consumers fuera de scope.
export type ResultsV1Payload = Record<string, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProgramsV2Array = any[];

export type ResponsesArray = Array<{
  criteria_code: string;
  criteria_id: string;
  dimension_code: string;
  subdimension_code: string;
  as_is_level: number | null;
  to_be_level: number | null;
  importance: number | null;
  [key: string]: unknown;
}>;

export type CoverageV1 = {
  assessment_id: string;
  pack: string;
  assessment_type: string;
  totals: {
    total_criteria: number;
    answered_criteria: number;
    completion_rate: number;
  };
  by_dimension: Array<{
    // PR-2: non-null garantizado por el adapter (fallback dimension_code si lookup live falla)
    dimension_id: string;
    dimension_code: string;
    dimension_name: string;
    total_criteria: number;
    answered_criteria: number;
  }>;
  by_subdimension: Array<{
    dimension_code: string;
    // PR-2: non-null (fallback subdimension_code)
    subdimension_id: string;
    subdimension_code: string;
    subdimension_name: string;
    total_criteria: number;
    answered_criteria: number;
  }>;
};

// ─── Internal helpers ──────────────────────────────────────────────────

type AssessmentRow = {
  id: string;
  status: string;
  pack: string;
  assessment_type: string | null;
};

type SnapshotRow = {
  id: string;
  // payloads typed as Record/array for downstream consumer compatibility
  // (DB shape is jsonb; runtime check via Array.isArray for arrays)
  results_payload: Record<string, any>;
  programs_payload: any[] | null;
  responses_payload: any[] | null;
  model_fingerprint: string;
  input_fingerprint: string;
  trigger_reason: string;
};

async function loadAssessmentAndSnapshot(
  sb: SupabaseClient,
  assessmentId: string
): Promise<{ assessment: AssessmentRow; snapshot: SnapshotRow | null }> {
  const [asmResult, snapResult] = await Promise.all([
    sb
      .from("dts_assessments")
      .select("id, status, pack, assessment_type")
      .eq("id", assessmentId)
      .maybeSingle(),
    sb
      .from("dts_assessment_results_snapshots")
      .select(
        "id, results_payload, programs_payload, responses_payload, model_fingerprint, input_fingerprint, trigger_reason"
      )
      .eq("assessment_id", assessmentId)
      .eq("snapshot_status", "active")
      .maybeSingle(),
  ]);

  if (asmResult.error) {
    throw new Error(
      `[snapshotResolver] dts_assessments lookup failed for ${assessmentId}: ${asmResult.error.message}`
    );
  }
  if (!asmResult.data) {
    throw new Error(`[snapshotResolver] assessment not found: ${assessmentId}`);
  }
  if (snapResult.error) {
    throw new Error(
      `[snapshotResolver] snapshot lookup failed for ${assessmentId}: ${snapResult.error.message}`
    );
  }

  return {
    assessment: asmResult.data as AssessmentRow,
    snapshot: (snapResult.data as SnapshotRow | null) ?? null,
  };
}

function logResolver(
  level: "info" | "warn",
  payload: Record<string, unknown>
): void {
  const parts = Object.entries(payload).map(
    ([k, v]) => `${k}=${typeof v === "string" ? v : JSON.stringify(v)}`
  );
  const line = `[snapshotResolver] ${parts.join(" ")}`;
  if (level === "warn") console.warn(line);
  else console.log(line);
}

// normalizeCode: trim() only, consistente con /frenos y /priorizacion.
// Privado al helper para evitar acoplamiento con consumers.
function normalizeCode(code: string): string {
  return code.trim();
}

async function computeModelFingerprint(
  sb: SupabaseClient,
  pack: string
): Promise<string> {
  const { data, error } = await sb.rpc("dts_compute_model_fingerprint", {
    p_pack: pack,
  });
  if (error) {
    throw new Error(
      `[snapshotResolver] dts_compute_model_fingerprint failed: ${error.message}`
    );
  }
  if (typeof data !== "string" || data.length === 0) {
    throw new Error(
      `[snapshotResolver] dts_compute_model_fingerprint returned non-string: ${typeof data}`
    );
  }
  return data;
}

async function computeInputFingerprint(
  sb: SupabaseClient,
  assessmentId: string
): Promise<string> {
  const { data, error } = await sb.rpc("dts_compute_input_fingerprint", {
    p_assessment_id: assessmentId,
  });
  if (error) {
    throw new Error(
      `[snapshotResolver] dts_compute_input_fingerprint failed: ${error.message}`
    );
  }
  if (typeof data !== "string" || data.length === 0) {
    throw new Error(
      `[snapshotResolver] dts_compute_input_fingerprint returned non-string: ${typeof data}`
    );
  }
  return data;
}

async function callDtsV1Results(
  sb: SupabaseClient,
  assessmentId: string
): Promise<ResultsV1Payload> {
  const { data, error } = await sb.rpc("dts_v1_results", {
    p_assessment_id: assessmentId,
  });
  if (error) {
    throw new Error(
      `[snapshotResolver] dts_v1_results failed for ${assessmentId}: ${error.message}`
    );
  }
  if (data === null || data === undefined) {
    throw new Error(
      `[snapshotResolver] dts_v1_results returned empty for ${assessmentId}`
    );
  }
  return data;
}

async function callDtsResultsProgramsV2(
  sb: SupabaseClient,
  assessmentId: string,
  onlyShortlist: boolean,
  useOverrides: boolean
): Promise<ProgramsV2Array> {
  const { data, error } = await sb.rpc("dts_results_programs_v2", {
    p_assessment_id: assessmentId,
    p_only_shortlist: onlyShortlist,
    p_use_overrides: useOverrides,
  });
  if (error) {
    throw new Error(
      `[snapshotResolver] dts_results_programs_v2 failed for ${assessmentId}: ${error.message}`
    );
  }
  return Array.isArray(data) ? data : [];
}

// callDtsResultsV1Coverage: live RPC dts_results_v1 (cobertura) → CoverageV1.
// PR-2: usado por resolveCoverageV1 en estados B/C/D_drift/unexpected_fallback.
// Coerce shape con fallbacks string para garantizar non-null en dimension_id/subdimension_id.
async function callDtsResultsV1Coverage(
  sb: SupabaseClient,
  assessmentId: string
): Promise<CoverageV1> {
  const { data, error } = await sb.rpc("dts_results_v1", {
    p_assessment_id: assessmentId,
  });
  if (error) {
    throw new Error(
      `[snapshotResolver] dts_results_v1 failed for ${assessmentId}: ${error.message}`
    );
  }
  // Shape extraction (handles wrapped/unwrapped formats que ya manejaban /frenos y /priorización)
  const payload = Array.isArray(data)
    ? ((data[0] as any)?.results_v1 ?? (data[0] as any) ?? null)
    : ((data as any)?.results_v1 ?? (data as any) ?? null);
  if (!payload || typeof payload !== "object") {
    throw new Error(
      `[snapshotResolver] dts_results_v1 returned no/invalid payload for ${assessmentId}`
    );
  }
  const hasTotals = typeof payload.totals === "object" && payload.totals !== null;
  const hasByDim = Array.isArray(payload.by_dimension);
  if (!hasTotals || !hasByDim) {
    throw new Error(
      `[snapshotResolver] dts_results_v1 payload shape invalid for ${assessmentId}`
    );
  }
  const byDim = (payload.by_dimension as any[]).map((d: any) => ({
    dimension_id: String(d?.dimension_id ?? d?.dimension_code ?? ""),
    dimension_code: String(d?.dimension_code ?? ""),
    dimension_name: String(d?.dimension_name ?? d?.dimension_code ?? ""),
    total_criteria: Number(d?.total_criteria) || 0,
    answered_criteria: Number(d?.answered_criteria) || 0,
  }));
  const bySubArr = Array.isArray(payload.by_subdimension) ? payload.by_subdimension : [];
  const bySub = bySubArr.map((s: any) => ({
    dimension_code: String(s?.dimension_code ?? ""),
    subdimension_id: String(s?.subdimension_id ?? s?.subdimension_code ?? ""),
    subdimension_code: String(s?.subdimension_code ?? ""),
    subdimension_name: String(s?.subdimension_name ?? s?.subdimension_code ?? ""),
    total_criteria: Number(s?.total_criteria) || 0,
    answered_criteria: Number(s?.answered_criteria) || 0,
  }));
  return {
    assessment_id: String(payload.assessment_id ?? assessmentId),
    pack: String(payload.pack ?? ""),
    assessment_type: String(payload.assessment_type ?? "full"),
    totals: {
      total_criteria: Number(payload.totals?.total_criteria) || 0,
      answered_criteria: Number(payload.totals?.answered_criteria) || 0,
      completion_rate: Number(payload.totals?.completion_rate) || 0,
    },
    by_dimension: byDim,
    by_subdimension: bySub,
  };
}

// callDtsResponsesLive: live query a dts_responses (todos los campos relevantes
// de ResponsesArray). PR-2: usado por resolveFrozenInputs en estados live.
async function callDtsResponsesLive(
  sb: SupabaseClient,
  assessmentId: string
): Promise<ResponsesArray> {
  const { data, error } = await sb
    .from("dts_responses")
    .select(
      "id, assessment_id, criteria_code, criteria_id, dimension_code, subdimension_code, " +
        "as_is_level, as_is_notes, as_is_confidence, to_be_level, to_be_timeframe, " +
        "importance, response_source, reviewed_by_user, inference_confidence, " +
        "created_at, updated_at"
    )
    .eq("assessment_id", assessmentId);
  if (error) {
    throw new Error(
      `[snapshotResolver] dts_responses query failed for ${assessmentId}: ${error.message}`
    );
  }
  // Cast vía unknown: Supabase JS infiere tipos parciales para queries largas
  // y produce GenericStringError[] union que no encaja directamente con ResponsesArray.
  return ((data ?? []) as unknown) as ResponsesArray;
}

// buildCoverageFromSnapshot: reconstruye CoverageV1 desde snapshot.
//  - totals desde scores.by_dimension (frozen counts)
//  - by_dimension: snapshot.dimension_name_es (frozen) + lookup live dts_dimensions.id
//  - by_subdimension: GROUP BY responses_payload FILTRADO por allowedCriteriaCodes
//                     (de scores.by_criteria) + lookup live dts_subdimensions.{id, name}
//  - Fallbacks string non-null si lookup falla (usar code como fallback)
//  - Returns metadataPartial=true si algún lookup retornó menos rows que esperado.
async function buildCoverageFromSnapshot(
  sb: SupabaseClient,
  snapshot: SnapshotRow,
  assessmentId: string,
  pack: string,
  assessmentType: string
): Promise<{ coverage: CoverageV1; metadataPartial: boolean }> {
  const resultsPayload = snapshot.results_payload as Record<string, any>;
  const scores = (resultsPayload?.scores ?? {}) as Record<string, any>;
  const byCriteria: any[] = Array.isArray(scores.by_criteria) ? scores.by_criteria : [];
  const byDimSnap: any[] = Array.isArray(scores.by_dimension) ? scores.by_dimension : [];

  if (byCriteria.length === 0 || byDimSnap.length === 0) {
    throw new Error(
      `[snapshotResolver] buildCoverageFromSnapshot: snapshot incomplete for ${assessmentId} (by_criteria=${byCriteria.length}, by_dimension=${byDimSnap.length})`
    );
  }

  // 1) allowedCriteriaCodes (autoritative pack scope from snapshot, normalized)
  const allowedCriteriaCodes = new Set<string>(
    byCriteria
      .map((c: any) => c?.criteria_code)
      .filter((code: any): code is string => typeof code === "string" && code.length > 0)
      .map((code: string) => normalizeCode(code))
  );

  // 2) Totals derived from scores.by_dimension SUM
  const totalCriteria = byDimSnap.reduce(
    (s: number, d: any) => s + (Number(d?.criteria_total) || 0),
    0
  );
  const answeredCriteria = byDimSnap.reduce(
    (s: number, d: any) => s + (Number(d?.criteria_answered) || 0),
    0
  );
  const completionRate = totalCriteria > 0 ? answeredCriteria / totalCriteria : 0;

  // 3) Lookup live dts_dimensions (only for dimension_id)
  const dimCodes = byDimSnap
    .map((d: any) => d?.dimension_code)
    .filter((c: any): c is string => typeof c === "string" && c.length > 0);
  let dimMetadataMissing = false;
  const dimIdByCode = new Map<string, string>();
  if (dimCodes.length > 0) {
    const { data: dimRows, error: dimErr } = await sb
      .from("dts_dimensions")
      .select("id, code")
      .in("code", dimCodes);
    if (dimErr) {
      dimMetadataMissing = true;
    } else {
      for (const row of (dimRows ?? [])) {
        if (row?.code && row?.id) dimIdByCode.set(row.code, row.id);
      }
      if (!Array.isArray(dimRows) || dimRows.length < dimCodes.length) {
        dimMetadataMissing = true;
      }
    }
  }

  // 4) Build by_dimension (frozen names + live id with code fallback)
  const by_dimension = byDimSnap.map((d: any) => {
    const code = String(d?.dimension_code ?? "");
    return {
      dimension_id: dimIdByCode.get(code) ?? code,
      dimension_code: code,
      dimension_name: String(d?.dimension_name_es ?? code),
      total_criteria: Number(d?.criteria_total) || 0,
      answered_criteria: Number(d?.criteria_answered) || 0,
    };
  });

  // 5) Reconstruct by_subdimension from filtered responses_payload
  const responsesArr: any[] = Array.isArray(snapshot.responses_payload)
    ? snapshot.responses_payload
    : [];
  const filteredResponses = responsesArr.filter(
    (r: any) =>
      r?.criteria_code && allowedCriteriaCodes.has(normalizeCode(String(r.criteria_code)))
  );

  type SubdimAgg = {
    dimension_code: string;
    subdimension_code: string;
    criteria: Set<string>;
    answered: Set<string>;
  };
  const subdimAgg = new Map<string, SubdimAgg>();
  for (const r of filteredResponses) {
    const subKey = String(r?.subdimension_code ?? "").trim();
    if (!subKey) continue;
    const code = normalizeCode(String(r?.criteria_code ?? ""));
    if (!code) continue;
    let agg = subdimAgg.get(subKey);
    if (!agg) {
      agg = {
        dimension_code: String(r?.dimension_code ?? ""),
        subdimension_code: subKey,
        criteria: new Set<string>(),
        answered: new Set<string>(),
      };
      subdimAgg.set(subKey, agg);
    }
    agg.criteria.add(code);
    if (r?.as_is_level != null) agg.answered.add(code);
  }

  // 6) Lookup live dts_subdimensions (id + name; preflight confirmó name has 0 nulls)
  const subCodes = Array.from(subdimAgg.keys());
  let subMetadataMissing = false;
  const subInfoByCode = new Map<string, { id: string; name: string }>();
  if (subCodes.length > 0) {
    const { data: subRows, error: subErr } = await sb
      .from("dts_subdimensions")
      .select("id, code, name")
      .in("code", subCodes);
    if (subErr) {
      subMetadataMissing = true;
    } else {
      for (const row of (subRows ?? [])) {
        if (row?.code && row?.id) {
          subInfoByCode.set(row.code, {
            id: row.id,
            name:
              typeof row.name === "string" && row.name.length > 0
                ? row.name
                : row.code,
          });
        }
      }
      if (!Array.isArray(subRows) || subRows.length < subCodes.length) {
        subMetadataMissing = true;
      }
    }
  }

  // 7) Build by_subdimension with non-null string fallbacks
  const by_subdimension = Array.from(subdimAgg.values()).map((agg) => {
    const liveInfo = subInfoByCode.get(agg.subdimension_code);
    return {
      dimension_code: agg.dimension_code,
      subdimension_id: liveInfo?.id ?? agg.subdimension_code,
      subdimension_code: agg.subdimension_code,
      subdimension_name: liveInfo?.name ?? agg.subdimension_code,
      total_criteria: agg.criteria.size,
      answered_criteria: agg.answered.size,
    };
  });

  const coverage: CoverageV1 = {
    assessment_id: assessmentId,
    pack,
    assessment_type: assessmentType,
    totals: {
      total_criteria: totalCriteria,
      answered_criteria: answeredCriteria,
      completion_rate: completionRate,
    },
    by_dimension,
    by_subdimension,
  };

  return { coverage, metadataPartial: dimMetadataMissing || subMetadataMissing };
}

// ─── Public API: resolveResultsPayload (PR-1) ─────────────────────────

export async function resolveResultsPayload(
  sb: SupabaseClient,
  assessmentId: string
): Promise<ResolvedFromSnapshot<ResultsV1Payload>> {
  const { assessment, snapshot } = await loadAssessmentAndSnapshot(
    sb,
    assessmentId
  );
  const status = assessment.status;
  const pack = assessment.pack;
  const baseLog = { kind: "results", assessment: assessmentId };

  // Estado A
  if (status === "completed" && snapshot) {
    const liveModelFp = await computeModelFingerprint(sb, pack);
    const modelFingerprintMatch = liveModelFp === snapshot.model_fingerprint;
    logResolver("info", {
      ...baseLog,
      state: "A",
      fromSnapshot: true,
      snapshotInputs: true,
      modelFingerprintMatch,
      metadataLive: false,
      snapshotId: snapshot.id,
    });
    return {
      state: "A",
      fromSnapshot: true,
      snapshotInputs: true,
      modelFingerprintMatch,
      metadataLive: false,
      snapshotId: snapshot.id,
      triggerReason: snapshot.trigger_reason,
      data: snapshot.results_payload,
    };
  }

  // Estado B
  if (status === "completed" && !snapshot) {
    const data = await callDtsV1Results(sb, assessmentId);
    logResolver("warn", {
      ...baseLog,
      state: "B",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      reason: "completed_without_snapshot",
    });
    return {
      state: "B",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      reason: "completed_without_snapshot",
      data,
    };
  }

  // Estado C
  if (status === "draft" && !snapshot) {
    const data = await callDtsV1Results(sb, assessmentId);
    logResolver("info", {
      ...baseLog,
      state: "C",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
    });
    return {
      state: "C",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      data,
    };
  }

  // Estado D / D_drift (explícito: status === "draft" && snapshot)
  if (status === "draft" && snapshot) {
    const liveInputFp = await computeInputFingerprint(sb, assessmentId);
    const inputFingerprintMatch = liveInputFp === snapshot.input_fingerprint;

    if (inputFingerprintMatch) {
      const liveModelFp = await computeModelFingerprint(sb, pack);
      const modelFingerprintMatch = liveModelFp === snapshot.model_fingerprint;
      logResolver("info", {
        ...baseLog,
        state: "D",
        fromSnapshot: true,
        snapshotInputs: true,
        modelFingerprintMatch,
        metadataLive: false,
        snapshotId: snapshot.id,
      });
      return {
        state: "D",
        fromSnapshot: true,
        snapshotInputs: true,
        modelFingerprintMatch,
        inputFingerprintMatch: true,
        metadataLive: false,
        snapshotId: snapshot.id,
        data: snapshot.results_payload,
      };
    }

    // D_drift
    const data = await callDtsV1Results(sb, assessmentId);
    logResolver("warn", {
      ...baseLog,
      state: "D_drift",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      inputFingerprintMatch: false,
      metadataLive: false,
      reason: "input_fingerprint_mismatch",
    });
    return {
      state: "D_drift",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      inputFingerprintMatch: false,
      metadataLive: false,
      reason: "input_fingerprint_mismatch",
      data,
    };
  }

  // Unexpected fallback: status not in ["completed", "draft"] or unforeseen combo.
  // Defensive: do NOT trust snapshot here. Always fall back to live RPC.
  const fallbackData = await callDtsV1Results(sb, assessmentId);
  logResolver("warn", {
    ...baseLog,
    state: "unexpected_fallback",
    fromSnapshot: false,
    snapshotInputs: false,
    modelFingerprintMatch: null,
    metadataLive: false,
    reason: "unexpected_fallback",
    status,
    hasSnapshot: Boolean(snapshot),
  });
  return {
    state: "unexpected_fallback",
    fromSnapshot: false,
    snapshotInputs: false,
    modelFingerprintMatch: null,
    metadataLive: false,
    reason: "unexpected_fallback",
    data: fallbackData,
  };
}

// ─── Public API: resolveProgramsPayload (PR-1) ────────────────────────

export async function resolveProgramsPayload(
  sb: SupabaseClient,
  assessmentId: string,
  opts?: { onlyShortlist?: boolean; useOverrides?: boolean }
): Promise<ResolvedPrograms<ProgramsV2Array>> {
  // Normalización: undefined → defaults cacheables (false, true)
  const onlyShortlist = opts?.onlyShortlist ?? false;
  const useOverrides = opts?.useOverrides ?? true;
  const cacheable = onlyShortlist === false && useOverrides === true;
  const baseLog = { kind: "programs", assessment: assessmentId };

  // Pre-check params no-cacheables → fallback live SIN tocar snapshot
  if (!cacheable) {
    const data = await callDtsResultsProgramsV2(
      sb,
      assessmentId,
      onlyShortlist,
      useOverrides
    );
    logResolver("info", {
      ...baseLog,
      state: "live_uncacheable_params",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      reason: "params_not_cacheable",
    });
    return {
      state: "live_uncacheable_params",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      reason: "params_not_cacheable",
      data,
    };
  }

  const { assessment, snapshot } = await loadAssessmentAndSnapshot(
    sb,
    assessmentId
  );
  const status = assessment.status;
  const pack = assessment.pack;

  // Estado A
  if (status === "completed" && snapshot) {
    const liveModelFp = await computeModelFingerprint(sb, pack);
    const modelFingerprintMatch = liveModelFp === snapshot.model_fingerprint;
    const data = (
      Array.isArray(snapshot.programs_payload) ? snapshot.programs_payload : []
    ) as ProgramsV2Array;
    logResolver("info", {
      ...baseLog,
      state: "A",
      fromSnapshot: true,
      snapshotInputs: true,
      modelFingerprintMatch,
      metadataLive: false,
      snapshotId: snapshot.id,
    });
    return {
      state: "A",
      fromSnapshot: true,
      snapshotInputs: true,
      modelFingerprintMatch,
      metadataLive: false,
      snapshotId: snapshot.id,
      triggerReason: snapshot.trigger_reason,
      data,
    };
  }

  // Estado B
  if (status === "completed" && !snapshot) {
    const data = await callDtsResultsProgramsV2(
      sb,
      assessmentId,
      onlyShortlist,
      useOverrides
    );
    logResolver("warn", {
      ...baseLog,
      state: "B",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      reason: "completed_without_snapshot",
    });
    return {
      state: "B",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      reason: "completed_without_snapshot",
      data,
    };
  }

  // Estado C
  if (status === "draft" && !snapshot) {
    const data = await callDtsResultsProgramsV2(
      sb,
      assessmentId,
      onlyShortlist,
      useOverrides
    );
    logResolver("info", {
      ...baseLog,
      state: "C",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
    });
    return {
      state: "C",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      data,
    };
  }

  // Estado D / D_drift (explícito: status === "draft" && snapshot)
  if (status === "draft" && snapshot) {
    const liveInputFp = await computeInputFingerprint(sb, assessmentId);
    const inputFingerprintMatch = liveInputFp === snapshot.input_fingerprint;

    if (inputFingerprintMatch) {
      const liveModelFp = await computeModelFingerprint(sb, pack);
      const modelFingerprintMatch = liveModelFp === snapshot.model_fingerprint;
      const data = (
        Array.isArray(snapshot.programs_payload)
          ? snapshot.programs_payload
          : []
      ) as ProgramsV2Array;
      logResolver("info", {
        ...baseLog,
        state: "D",
        fromSnapshot: true,
        snapshotInputs: true,
        modelFingerprintMatch,
        metadataLive: false,
        snapshotId: snapshot.id,
      });
      return {
        state: "D",
        fromSnapshot: true,
        snapshotInputs: true,
        modelFingerprintMatch,
        inputFingerprintMatch: true,
        metadataLive: false,
        snapshotId: snapshot.id,
        data,
      };
    }

    // D_drift
    const data = await callDtsResultsProgramsV2(
      sb,
      assessmentId,
      onlyShortlist,
      useOverrides
    );
    logResolver("warn", {
      ...baseLog,
      state: "D_drift",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      inputFingerprintMatch: false,
      metadataLive: false,
      reason: "input_fingerprint_mismatch",
    });
    return {
      state: "D_drift",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      inputFingerprintMatch: false,
      metadataLive: false,
      reason: "input_fingerprint_mismatch",
      data,
    };
  }

  // Unexpected fallback: status not in ["completed", "draft"] or unforeseen combo.
  // Defensive: do NOT trust snapshot here. Always fall back to live RPC.
  const fallbackData = await callDtsResultsProgramsV2(
    sb,
    assessmentId,
    onlyShortlist,
    useOverrides
  );
  logResolver("warn", {
    ...baseLog,
    state: "unexpected_fallback",
    fromSnapshot: false,
    snapshotInputs: false,
    modelFingerprintMatch: null,
    metadataLive: false,
    reason: "unexpected_fallback",
    status,
    hasSnapshot: Boolean(snapshot),
  });
  return {
    state: "unexpected_fallback",
    fromSnapshot: false,
    snapshotInputs: false,
    modelFingerprintMatch: null,
    metadataLive: false,
    reason: "unexpected_fallback",
    data: fallbackData,
  };
}

// ─── Public API: stubs para PR-2 (exportadas, no llamadas en PR-1) ────

export async function resolveCoverageV1(
  sb: SupabaseClient,
  assessmentId: string
): Promise<ResolvedCoverageE1> {
  const { assessment, snapshot } = await loadAssessmentAndSnapshot(sb, assessmentId);
  const status = assessment.status;
  const pack = assessment.pack;
  const assessmentType = (assessment.assessment_type ?? "full")
    .toString()
    .toLowerCase()
    .trim();
  const baseLog = { kind: "coverage", assessment: assessmentId };

  // Estado A / A_metadata_partial
  if (status === "completed" && snapshot) {
    const liveModelFp = await computeModelFingerprint(sb, pack);
    const modelFingerprintMatch = liveModelFp === snapshot.model_fingerprint;
    const { coverage, metadataPartial } = await buildCoverageFromSnapshot(
      sb,
      snapshot,
      assessmentId,
      pack,
      assessmentType
    );
    if (metadataPartial) {
      logResolver("warn", {
        ...baseLog,
        state: "A_metadata_partial",
        fromSnapshot: true,
        snapshotInputs: true,
        modelFingerprintMatch,
        metadataLive: true,
        snapshotId: snapshot.id,
        reason: "metadata_lookup_failed",
      });
      return {
        state: "A_metadata_partial",
        fromSnapshot: true,
        snapshotInputs: true,
        modelFingerprintMatch,
        metadataLive: true,
        snapshotId: snapshot.id,
        reason: "metadata_lookup_failed",
        data: coverage,
      };
    }
    logResolver("info", {
      ...baseLog,
      state: "A",
      fromSnapshot: true,
      snapshotInputs: true,
      modelFingerprintMatch,
      metadataLive: true,
      snapshotId: snapshot.id,
    });
    return {
      state: "A",
      fromSnapshot: true,
      snapshotInputs: true,
      modelFingerprintMatch,
      metadataLive: true,
      snapshotId: snapshot.id,
      data: coverage,
    };
  }

  // Estado B (completed, sin snapshot)
  if (status === "completed" && !snapshot) {
    const data = await callDtsResultsV1Coverage(sb, assessmentId);
    logResolver("warn", {
      ...baseLog,
      state: "B",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      reason: "completed_without_snapshot",
    });
    return {
      state: "B",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      reason: "completed_without_snapshot",
      data,
    };
  }

  // Estado C (draft, sin snapshot)
  if (status === "draft" && !snapshot) {
    const data = await callDtsResultsV1Coverage(sb, assessmentId);
    logResolver("info", {
      ...baseLog,
      state: "C",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
    });
    return {
      state: "C",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: false,
      data,
    };
  }

  // Estado D / D_drift (draft + snapshot)
  if (status === "draft" && snapshot) {
    const liveInputFp = await computeInputFingerprint(sb, assessmentId);
    const inputFingerprintMatch = liveInputFp === snapshot.input_fingerprint;
    if (inputFingerprintMatch) {
      const liveModelFp = await computeModelFingerprint(sb, pack);
      const modelFingerprintMatch = liveModelFp === snapshot.model_fingerprint;
      const { coverage } = await buildCoverageFromSnapshot(
        sb,
        snapshot,
        assessmentId,
        pack,
        assessmentType
      );
      logResolver("info", {
        ...baseLog,
        state: "D",
        fromSnapshot: true,
        snapshotInputs: true,
        modelFingerprintMatch,
        metadataLive: true,
        snapshotId: snapshot.id,
      });
      return {
        state: "D",
        fromSnapshot: true,
        snapshotInputs: true,
        modelFingerprintMatch,
        inputFingerprintMatch: true,
        metadataLive: true,
        snapshotId: snapshot.id,
        data: coverage,
      };
    }
    // D_drift
    const data = await callDtsResultsV1Coverage(sb, assessmentId);
    logResolver("warn", {
      ...baseLog,
      state: "D_drift",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      inputFingerprintMatch: false,
      metadataLive: false,
      reason: "input_fingerprint_mismatch",
    });
    return {
      state: "D_drift",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      inputFingerprintMatch: false,
      metadataLive: false,
      reason: "input_fingerprint_mismatch",
      data,
    };
  }

  // Unexpected fallback (status not in ["completed", "draft"])
  const fallbackData = await callDtsResultsV1Coverage(sb, assessmentId);
  logResolver("warn", {
    ...baseLog,
    state: "unexpected_fallback",
    fromSnapshot: false,
    snapshotInputs: false,
    modelFingerprintMatch: null,
    metadataLive: false,
    reason: "unexpected_fallback",
    status,
    hasSnapshot: Boolean(snapshot),
  });
  return {
    state: "unexpected_fallback",
    fromSnapshot: false,
    snapshotInputs: false,
    modelFingerprintMatch: null,
    metadataLive: false,
    reason: "unexpected_fallback",
    data: fallbackData,
  };
}

export async function resolveFrozenInputs(
  sb: SupabaseClient,
  assessmentId: string
): Promise<ResolvedFrozenInputs<ResponsesArray>> {
  const { assessment, snapshot } = await loadAssessmentAndSnapshot(sb, assessmentId);
  const status = assessment.status;
  const pack = assessment.pack;
  const baseLog = { kind: "inputs", assessment: assessmentId };

  // Helper local: extraer responses_payload del snapshot como ResponsesArray.
  // El caller (frenos/priorización) filtra por packCodes live.
  const extractSnapshotInputs = (): ResponsesArray => {
    const arr = Array.isArray(snapshot?.responses_payload)
      ? snapshot!.responses_payload
      : [];
    return arr as ResponsesArray;
  };

  // Estado A_guarded / A_drift (status === "completed" && snapshot)
  if (status === "completed" && snapshot) {
    const liveModelFp = await computeModelFingerprint(sb, pack);
    if (liveModelFp === snapshot.model_fingerprint) {
      const inputs = extractSnapshotInputs();
      logResolver("info", {
        ...baseLog,
        state: "A_guarded",
        fromSnapshot: true,
        snapshotInputs: true,
        modelFingerprintMatch: true,
        metadataLive: true,
        snapshotId: snapshot.id,
      });
      return {
        state: "A_guarded",
        fromSnapshot: true,
        snapshotInputs: true,
        modelFingerprintMatch: true,
        metadataLive: true,
        snapshotId: snapshot.id,
        inputs,
      };
    }
    // A_drift
    const inputs = await callDtsResponsesLive(sb, assessmentId);
    logResolver("warn", {
      ...baseLog,
      state: "A_drift",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: false,
      metadataLive: true,
      reason: "model_fingerprint_mismatch",
    });
    return {
      state: "A_drift",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: false,
      metadataLive: true,
      reason: "model_fingerprint_mismatch",
      inputs,
    };
  }

  // Estado B (completed sin snapshot)
  if (status === "completed" && !snapshot) {
    const inputs = await callDtsResponsesLive(sb, assessmentId);
    logResolver("warn", {
      ...baseLog,
      state: "B",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: true,
      reason: "completed_without_snapshot",
    });
    return {
      state: "B",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: true,
      reason: "completed_without_snapshot",
      inputs,
    };
  }

  // Estado C (draft sin snapshot)
  if (status === "draft" && !snapshot) {
    const inputs = await callDtsResponsesLive(sb, assessmentId);
    logResolver("info", {
      ...baseLog,
      state: "C",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: true,
    });
    return {
      state: "C",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      metadataLive: true,
      inputs,
    };
  }

  // Estado D_guarded / D_drift (draft + snapshot)
  if (status === "draft" && snapshot) {
    const liveInputFp = await computeInputFingerprint(sb, assessmentId);
    const inputFingerprintMatch = liveInputFp === snapshot.input_fingerprint;
    if (inputFingerprintMatch) {
      const liveModelFp = await computeModelFingerprint(sb, pack);
      const modelFingerprintMatch = liveModelFp === snapshot.model_fingerprint;
      if (modelFingerprintMatch) {
        const inputs = extractSnapshotInputs();
        logResolver("info", {
          ...baseLog,
          state: "D_guarded",
          fromSnapshot: true,
          snapshotInputs: true,
          modelFingerprintMatch: true,
          metadataLive: true,
          snapshotId: snapshot.id,
        });
        return {
          state: "D_guarded",
          fromSnapshot: true,
          snapshotInputs: true,
          modelFingerprintMatch: true,
          inputFingerprintMatch: true,
          metadataLive: true,
          snapshotId: snapshot.id,
          inputs,
        };
      }
      // input match pero model_fingerprint mismatch → D_drift
      const inputs = await callDtsResponsesLive(sb, assessmentId);
      logResolver("warn", {
        ...baseLog,
        state: "D_drift",
        fromSnapshot: false,
        snapshotInputs: false,
        modelFingerprintMatch: false,
        inputFingerprintMatch: true,
        metadataLive: true,
        reason: "model_fingerprint_mismatch",
      });
      return {
        state: "D_drift",
        fromSnapshot: false,
        snapshotInputs: false,
        modelFingerprintMatch: false,
        inputFingerprintMatch: true,
        metadataLive: true,
        reason: "model_fingerprint_mismatch",
        inputs,
      };
    }
    // input_fingerprint mismatch → D_drift
    const inputs = await callDtsResponsesLive(sb, assessmentId);
    logResolver("warn", {
      ...baseLog,
      state: "D_drift",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      inputFingerprintMatch: false,
      metadataLive: true,
      reason: "input_fingerprint_mismatch",
    });
    return {
      state: "D_drift",
      fromSnapshot: false,
      snapshotInputs: false,
      modelFingerprintMatch: null,
      inputFingerprintMatch: false,
      metadataLive: true,
      reason: "input_fingerprint_mismatch",
      inputs,
    };
  }

  // Unexpected fallback
  const inputs = await callDtsResponsesLive(sb, assessmentId);
  logResolver("warn", {
    ...baseLog,
    state: "unexpected_fallback",
    fromSnapshot: false,
    snapshotInputs: false,
    modelFingerprintMatch: null,
    metadataLive: true,
    reason: "unexpected_fallback",
    status,
    hasSnapshot: Boolean(snapshot),
  });
  return {
    state: "unexpected_fallback",
    fromSnapshot: false,
    snapshotInputs: false,
    modelFingerprintMatch: null,
    metadataLive: true,
    reason: "unexpected_fallback",
    inputs,
  };
}
