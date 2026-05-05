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
      inputFingerprintMatch: false;
      metadataLive: false;
      reason: "input_fingerprint_mismatch";
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
    dimension_id: string | null;
    dimension_code: string;
    dimension_name: string;
    total_criteria: number;
    answered_criteria: number;
  }>;
  by_subdimension: Array<{
    dimension_code: string;
    subdimension_id: string | null;
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
  _sb: SupabaseClient,
  _assessmentId: string
): Promise<ResolvedCoverageE1> {
  throw new Error(
    "[snapshotResolver] resolveCoverageV1 not implemented in PR-1; scheduled for PR-2"
  );
}

export async function resolveFrozenInputs(
  _sb: SupabaseClient,
  _assessmentId: string
): Promise<ResolvedFrozenInputs<ResponsesArray>> {
  throw new Error(
    "[snapshotResolver] resolveFrozenInputs not implemented in PR-1; scheduled for PR-2"
  );
}
