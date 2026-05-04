// scripts/paso8-validate-migma.mjs
//
// Paso 8 — Validación snapshot ↔ live (solo migma).
// Read-only. NO escribe. NO toca code runtime, snapshots, loaders, backfill, grants.
// Output: summary-only (counts, hashes SHA-256 completos, top-5 diffs). NO imprime payloads.
//
// Uso:
//   node scripts/paso8-validate-migma.mjs
//
// Requiere:
//   - Node >=20.6 (process.loadEnvFile nativo)
//   - .env.local con SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY
//
// Exit codes:
//   0  → model_fp_match && input_fp_match && results_match && programs_match
//   1  → algún match===false (drift detectado)
//   2  → fatal: env, RPC error, shape inválida, snapshot no existe

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// ─── 1) Node version + .env.local ──────────────────────────────────
if (typeof process.loadEnvFile !== "function") {
  console.error("Node >=20.6 required (process.loadEnvFile not available, current:", process.version, ")");
  process.exit(2);
}
try {
  process.loadEnvFile(".env.local");
} catch (e) {
  console.error("Failed to load .env.local:", e?.message || String(e));
  process.exit(2);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(2);
}

// ─── 2) Inputs hardcoded (solo migma para Paso 8) ──────────────────
const ASSESSMENT_ID = "fc723b07-6ff7-469d-81de-c32de0a2222e";
const SNAPSHOT_ID   = "934e7059-83aa-4426-8e2d-783a1cbf74f2";
const PACK          = "gapply_v23";

// ─── 3) Allowlist explícita de paths volátiles ────────────────────
//     Solo lo aprobado. Sin wildcards.
const VOLATILE_PATHS_RESULTS  = new Set(["meta.generated_at"]);
const VOLATILE_PATHS_PROGRAMS = new Set();

// ─── 4) Supabase client (service role) ────────────────────────────
const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// ─── 5) Utilidades ────────────────────────────────────────────────
function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

// canonicalize:
//  - undefined → throw (no debería venir de JSON Supabase; si aparece, lo queremos saber)
//  - null → null
//  - objects: keys ordenadas alfabéticamente, recursión, exclude paths
//  - arrays: NO se reordenan
//  - primitives: tal cual (sin redondeo de floats v1)
function canonicalize(value, excludePaths, pathPrefix = "") {
  if (value === undefined) {
    throw new Error(`Unexpected undefined at path ${pathPrefix || "<root>"}`);
  }
  if (value === null) return null;
  if (Array.isArray(value)) {
    return value.map((v, i) => canonicalize(v, excludePaths, `${pathPrefix}[${i}]`));
  }
  if (typeof value === "object") {
    const sortedKeys = Object.keys(value).sort();
    const out = {};
    for (const k of sortedKeys) {
      const childPath = pathPrefix ? `${pathPrefix}.${k}` : k;
      if (excludePaths.has(childPath)) continue;
      out[k] = canonicalize(value[k], excludePaths, childPath);
    }
    return out;
  }
  return value; // string | number | boolean
}

function shorten(v) {
  if (v === null) return "null";
  if (typeof v === "string") return v.length > 80 ? v.slice(0, 77) + "..." : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `array(len=${v.length})`;
  return `object(keys=${Object.keys(v).length})`;
}

function diffPaths(a, b, prefix = "", out = [], maxDiffs = 5) {
  if (out.length >= maxDiffs) return out;
  const ta = a === null ? "null" : Array.isArray(a) ? "array" : typeof a;
  const tb = b === null ? "null" : Array.isArray(b) ? "array" : typeof b;
  if (ta !== tb) {
    out.push({ path: prefix || "<root>", live: shorten(a), snap: shorten(b), reason: `type_diff(${ta}/${tb})` });
    return out;
  }
  if (ta === "array") {
    if (a.length !== b.length) {
      out.push({ path: prefix || "<root>", live: `array(len=${a.length})`, snap: `array(len=${b.length})`, reason: "array_length_diff" });
    }
    const minLen = Math.min(a.length, b.length);
    for (let i = 0; i < minLen && out.length < maxDiffs; i++) {
      diffPaths(a[i], b[i], `${prefix}[${i}]`, out, maxDiffs);
    }
    return out;
  }
  if (ta === "object") {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const k of [...allKeys].sort()) {
      if (out.length >= maxDiffs) break;
      const child = prefix ? `${prefix}.${k}` : k;
      if (!(k in a)) { out.push({ path: child, live: "<missing>", snap: shorten(b[k]), reason: "missing_in_live" }); continue; }
      if (!(k in b)) { out.push({ path: child, live: shorten(a[k]), snap: "<missing>", reason: "missing_in_snapshot" }); continue; }
      diffPaths(a[k], b[k], child, out, maxDiffs);
    }
    return out;
  }
  if (a !== b) out.push({ path: prefix || "<root>", live: shorten(a), snap: shorten(b), reason: "value_diff" });
  return out;
}

// ─── 6) Main ──────────────────────────────────────────────────────
async function main() {
  // 6.a) Snapshot row
  const { data: snapRow, error: snapErr } = await sb
    .from("dts_assessment_results_snapshots")
    .select("id, assessment_id, results_payload, programs_payload, model_fingerprint, input_fingerprint, source_rpc_versions")
    .eq("id", SNAPSHOT_ID)
    .maybeSingle();

  if (snapErr) {
    console.error("snapshot read error:", snapErr.message);
    process.exit(2);
  }
  if (!snapRow) {
    console.error("snapshot not found:", SNAPSHOT_ID);
    process.exit(2);
  }
  if (snapRow.assessment_id !== ASSESSMENT_ID) {
    console.error("snapshot.assessment_id mismatch", { expected: ASSESSMENT_ID, got: snapRow.assessment_id });
    process.exit(2);
  }

  // 6.b) Shape validation snapshot
  if (typeof snapRow.programs_payload === "undefined") {
    console.error("snapshot.programs_payload column not present (may be nested in results_payload). Aborting.");
    process.exit(2);
  }
  if (!snapRow.results_payload || typeof snapRow.results_payload !== "object" || Array.isArray(snapRow.results_payload)) {
    console.error("snapshot.results_payload shape invalid: expected object, got",
      snapRow.results_payload === null ? "null" : Array.isArray(snapRow.results_payload) ? "array" : typeof snapRow.results_payload);
    process.exit(2);
  }
  if (!Array.isArray(snapRow.programs_payload)) {
    console.error("snapshot.programs_payload shape invalid: expected array, got",
      snapRow.programs_payload === null ? "null" : typeof snapRow.programs_payload);
    process.exit(2);
  }
  const srv = snapRow.source_rpc_versions;
  if (
    !srv ||
    typeof srv !== "object" ||
    Array.isArray(srv) ||
    srv.dts_v1_results !== "v1" ||
    srv.dts_results_programs_v2 !== "v2"
  ) {
    console.error("snapshot.source_rpc_versions invalid: expected {dts_v1_results:'v1', dts_results_programs_v2:'v2'}, got",
      JSON.stringify(srv));
    process.exit(2);
  }

  // 6.c) Live results: dts_v1_results (sin fallback)
  const { data: liveResults, error: liveResErr } = await sb.rpc("dts_v1_results", {
    p_assessment_id: ASSESSMENT_ID,
  });
  if (liveResErr) {
    console.error("dts_v1_results RPC error:", liveResErr.message);
    process.exit(2);
  }
  if (!liveResults || typeof liveResults !== "object" || Array.isArray(liveResults)) {
    console.error("live dts_v1_results shape invalid: expected object, got",
      liveResults === null ? "null" : Array.isArray(liveResults) ? "array" : typeof liveResults);
    process.exit(2);
  }

  // 6.d) Live programs: dts_results_programs_v2 (3 params explícitos como dts_persist_snapshot)
  const { data: liveProgramsRows, error: liveProgErr } = await sb.rpc("dts_results_programs_v2", {
    p_assessment_id:  ASSESSMENT_ID,
    p_only_shortlist: false,
    p_use_overrides:  true,
  });
  if (liveProgErr) {
    console.error("dts_results_programs_v2 RPC error:", liveProgErr.message);
    process.exit(2);
  }
  if (!Array.isArray(liveProgramsRows)) {
    console.error("live dts_results_programs_v2 shape invalid: expected array (TABLE-returning), got",
      liveProgramsRows === null ? "null" : typeof liveProgramsRows);
    process.exit(2);
  }

  // 6.e) Reagregar programs como jsonb_agg(to_jsonb(p) ORDER BY rank).
  //      Solo este array se reordena, por replicar el SQL ORDER BY rank.
  const liveProgramsAgg = [...liveProgramsRows].sort((a, b) => {
    const ra = a?.rank, rb = b?.rank;
    if (ra == null && rb == null) return 0;
    if (ra == null) return 1;
    if (rb == null) return -1;
    return ra - rb;
  });

  // 6.f) Fingerprints en runtime — SIN fallback, abortar si fallan vía Supabase JS
  const { data: live_model_fp, error: mfpErr } = await sb.rpc("dts_compute_model_fingerprint", { p_pack: PACK });
  if (mfpErr) {
    console.error("dts_compute_model_fingerprint RPC error:", mfpErr.message);
    process.exit(2);
  }
  if (typeof live_model_fp !== "string" || live_model_fp.length === 0) {
    console.error("dts_compute_model_fingerprint returned non-string:", typeof live_model_fp, live_model_fp);
    process.exit(2);
  }
  const { data: live_input_fp, error: ifpErr } = await sb.rpc("dts_compute_input_fingerprint", { p_assessment_id: ASSESSMENT_ID });
  if (ifpErr) {
    console.error("dts_compute_input_fingerprint RPC error:", ifpErr.message);
    process.exit(2);
  }
  if (typeof live_input_fp !== "string" || live_input_fp.length === 0) {
    console.error("dts_compute_input_fingerprint returned non-string:", typeof live_input_fp, live_input_fp);
    process.exit(2);
  }

  const model_fp_match = live_model_fp === snapRow.model_fingerprint;
  const input_fp_match = live_input_fp === snapRow.input_fingerprint;

  // 6.g) Canonicalize + hash
  const liveResC   = canonicalize(liveResults,            VOLATILE_PATHS_RESULTS);
  const snapResC   = canonicalize(snapRow.results_payload, VOLATILE_PATHS_RESULTS);
  const liveProgC  = canonicalize(liveProgramsAgg,         VOLATILE_PATHS_PROGRAMS);
  const snapProgC  = canonicalize(snapRow.programs_payload, VOLATILE_PATHS_PROGRAMS);

  const live_results_hash     = sha256(JSON.stringify(liveResC));
  const snapshot_results_hash = sha256(JSON.stringify(snapResC));
  const live_programs_hash    = sha256(JSON.stringify(liveProgC));
  const snapshot_programs_hash= sha256(JSON.stringify(snapProgC));

  const results_match  = live_results_hash  === snapshot_results_hash;
  const programs_match = live_programs_hash === snapshot_programs_hash;

  // 6.h) Counts (defensivos: solo si la subkey existe)
  const topKeysLive = Object.keys(liveResults).sort();
  const topKeysSnap = Object.keys(snapRow.results_payload).sort();

  const nFrenosLive = Array.isArray(liveResults.frenos)              ? liveResults.frenos.length              : null;
  const nFrenosSnap = Array.isArray(snapRow.results_payload.frenos)  ? snapRow.results_payload.frenos.length  : null;

  function scoresSubCount(scores, subkey) {
    if (!scores || typeof scores !== "object") return null;
    const v = scores[subkey];
    if (Array.isArray(v)) return v.length;
    if (v && typeof v === "object") return Object.keys(v).length;
    return null;
  }
  const nScoresByCriteriaLive = scoresSubCount(liveResults.scores, "by_criteria");
  const nScoresByCriteriaSnap = scoresSubCount(snapRow.results_payload.scores, "by_criteria");
  const nScoresByDimensionLive = scoresSubCount(liveResults.scores, "by_dimension");
  const nScoresByDimensionSnap = scoresSubCount(snapRow.results_payload.scores, "by_dimension");

  const nProgramsLive = liveProgramsAgg.length;
  const nProgramsSnap = snapRow.programs_payload.length;

  // 6.i) Diffs (solo si hay mismatch)
  let diffsResults = [], diffsPrograms = [];
  if (!results_match)  diffsResults  = diffPaths(liveResC, snapResC,  "results",  [], 5);
  if (!programs_match) diffsPrograms = diffPaths(liveProgC, snapProgC, "programs", [], 5);

  // 6.j) Output summary-only
  const lines = [];
  lines.push("=== Paso 8 — migma snapshot ↔ live (summary-only) ===");
  lines.push(`assessment_id:                ${ASSESSMENT_ID}`);
  lines.push(`snapshot_id:                  ${SNAPSHOT_ID}`);
  lines.push(`source_rpc_versions:          ${JSON.stringify(snapRow.source_rpc_versions)}`);
  lines.push("");
  lines.push("-- Fingerprints (SQL functions, runtime via Supabase JS) --");
  lines.push(`model_fp_match:               ${model_fp_match}`);
  lines.push(`input_fp_match:               ${input_fp_match}`);
  lines.push("");
  lines.push("-- Results payload (dts_v1_results) --");
  lines.push(`live_results_hash:            sha256:${live_results_hash}`);
  lines.push(`snapshot_results_hash:        sha256:${snapshot_results_hash}`);
  lines.push(`results_match:                ${results_match}`);
  lines.push(`top_level_keys_live:          [${topKeysLive.join(", ")}]`);
  lines.push(`top_level_keys_snapshot:      [${topKeysSnap.join(", ")}]`);
  lines.push(`n_frenos_live/snapshot:       ${nFrenosLive} / ${nFrenosSnap}`);
  lines.push(`n_scores_by_criteria_l/s:     ${nScoresByCriteriaLive} / ${nScoresByCriteriaSnap}`);
  lines.push(`n_scores_by_dimension_l/s:    ${nScoresByDimensionLive} / ${nScoresByDimensionSnap}`);
  lines.push(`excluded_volatile_paths:      [${[...VOLATILE_PATHS_RESULTS].join(", ")}]`);
  lines.push("");
  lines.push("-- Programs payload (dts_results_programs_v2) --");
  lines.push(`live_programs_hash:           sha256:${live_programs_hash}`);
  lines.push(`snapshot_programs_hash:       sha256:${snapshot_programs_hash}`);
  lines.push(`programs_match:               ${programs_match}`);
  lines.push(`n_programs_live/snapshot:     ${nProgramsLive} / ${nProgramsSnap}`);

  if (!results_match || !programs_match) {
    lines.push("");
    lines.push("-- Top diffs (max 5 each) --");
    if (diffsResults.length) {
      lines.push("[results]");
      diffsResults.forEach((d, i) => lines.push(`  ${i + 1}. path=${d.path}  live=${d.live}  snap=${d.snap}  reason=${d.reason}`));
    }
    if (diffsPrograms.length) {
      lines.push("[programs]");
      diffsPrograms.forEach((d, i) => lines.push(`  ${i + 1}. path=${d.path}  live=${d.live}  snap=${d.snap}  reason=${d.reason}`));
    }
  }
  lines.push("");
  lines.push("scope: single_assessment_only — no generaliza a otros CEOs");

  console.log(lines.join("\n"));

  // 6.k) Exit code
  const allMatch =
    model_fp_match === true &&
    input_fp_match === true &&
    results_match  === true &&
    programs_match === true;
  process.exit(allMatch ? 0 : 1);
}

main().catch((e) => {
  console.error("fatal:", e?.message || String(e));
  process.exit(2);
});
