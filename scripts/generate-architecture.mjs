import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const ARCH_FILE = path.join(ROOT, "docs", "ARCHITECTURE.md");

const RPC_DIR = path.join(ROOT, "supabase", "functions");
const API_DIR = path.join(ROOT, "src", "app", "api", "dts");

function listFiles(dir, suffix) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => {
      const p = path.join(dir, d.name);
      if (d.isDirectory()) return listFiles(p, suffix);
      if (!suffix || d.name.endsWith(suffix)) return [p];
      return [];
    });
}

function readFileSafe(relPath) {
  const p = path.join(ROOT, relPath);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

function extractPacksFromCreateRoute(src) {
  if (!src) return { defaultPack: null, allowedPacks: [] };

  const mDefault = src.match(/const\s+DEFAULT_PACK\s*=\s*["']([^"']+)["']/);
  const defaultPack = mDefault ? mDefault[1] : null;

  const mSet = src.match(
    /const\s+ALLOWED_CREATE_PACKS\s*=\s*new\s+Set\s*\(\s*\[([\s\S]*?)\]\s*\)\s*;/
  );

  let allowedPacks = [];
  if (mSet) {
    const block = mSet[1];
    allowedPacks = (block.match(/["']([^"']+)["']/g) || [])
      .map((s) => s.replace(/["']/g, ""))
      .filter(Boolean);
  }

  return { defaultPack, allowedPacks };
}

// Detecta supabase.rpc("fn_name", ...) o supabase.rpc('fn_name', ...)
function extractRpcCallsFromSource(src) {
  if (!src) return [];
  const r = /(?:\w+\.)?rpc\s*\(\s*["']([a-zA-Z0-9_]+)["']/g;
  const out = [];
  let m;
  while ((m = r.exec(src)) !== null) out.push(m[1]);
  return Array.from(new Set(out));
}

function phaseForApiPath(relPath) {
  // relPath: "src/app/api/dts/results/frenos/route.ts"
  // Base: "src/app/api/dts/..."
  const p = relPath.replace(/\\/g, "/");

  // Diagnóstico (criteria + responses + score)
  if (
    p.includes("/criteria/") ||
    p.includes("/responses/") ||
    p.includes("/score/") ||
    p.includes("/mvp12/criteria/")
  ) return "Diagnóstico";

  // Resultados
  if (p.includes("/results/") && !p.includes("/results/program-actions/")) return "Resultados";

  // Ejecución (programs/actions/roadmap gates)
  if (
    p.includes("/execution/") ||
    p.includes("/roadmap/") ||
    p.includes("/results/programs/") ||
    p.includes("/results/program-actions/") ||
    p.includes("/results/roadmap/")
  ) return "Ejecución";

  // Seguimiento / tracking
  if (p.includes("/tracking/") || p.includes("/results/seguimiento/")) return "Seguimiento";

  return "Otros";
}

function generateBlock() {
  const rpcsVersioned = listFiles(RPC_DIR, ".sql").map((f) => path.relative(ROOT, f));
  const apiRoutes = listFiles(API_DIR, "route.ts").map((f) => path.relative(ROOT, f));

  // Packs (from assessment/create route)
  const createRouteSrc = readFileSafe("src/app/api/dts/assessment/create/route.ts");
  const packsInfo = extractPacksFromCreateRoute(createRouteSrc);

  // RPC usage by phase (from API code)
  const rpcUsage = {
    "Diagnóstico": new Set(),
    "Resultados": new Set(),
    "Ejecución": new Set(),
    "Seguimiento": new Set(),
    "Otros": new Set(),
  };

  const endpointsByPhase = {
    "Diagnóstico": [],
    "Resultados": [],
    "Ejecución": [],
    "Seguimiento": [],
    "Otros": [],
  };

  for (const route of apiRoutes) {
    const phase = phaseForApiPath(route);
    endpointsByPhase[phase].push(route);

    const src = readFileSafe(route);
    const calls = extractRpcCallsFromSource(src);
    for (const fn of calls) rpcUsage[phase].add(fn);
  }

  // Ordenar endpoints por fase
  for (const k of Object.keys(endpointsByPhase)) {
    endpointsByPhase[k].sort((a, b) => a.localeCompare(b));
  }

  // Helper para pintar sets
  const renderSet = (set) => {
    const arr = Array.from(set);
    arr.sort((a, b) => a.localeCompare(b));
    if (arr.length === 0) return "- (ninguna detectada)\n";
    return arr.map((x) => `- \`${x}\``).join("\n") + "\n";
  };

  let out = `## Backend real detectado\n\n`;

  out += `### RPCs versionadas en repo (Supabase)\n`;
  if (rpcsVersioned.length === 0) out += `- (ninguna detectada)\n`;
  rpcsVersioned.forEach((r) => (out += `- ${r}\n`));

  out += `\n### API Routes (Next.js)\n`;
  if (apiRoutes.length === 0) out += `- (ninguna detectada)\n`;
  apiRoutes.forEach((a) => (out += `- ${a}\n`));

  out += `\n### Packs (detectados en assessment/create)\n`;
  out += `- DEFAULT_PACK: ${
    packsInfo.defaultPack ? "`" + packsInfo.defaultPack + "`" : "(no detectado)"
  }\n`;
  out += `- ALLOWED_CREATE_PACKS:\n`;
  if (!packsInfo.allowedPacks || packsInfo.allowedPacks.length === 0) {
    out += `  - (ninguno detectado)\n`;
  } else {
    packsInfo.allowedPacks.forEach((p) => (out += `  - \`${p}\`\n`));
  }

  out += `\n## RPCs por fase (detectadas en código)\n\n`;

  const phases = ["Diagnóstico", "Resultados", "Ejecución", "Seguimiento", "Otros"];
  for (const ph of phases) {
    out += `### ${ph}\n`;
    out += `**RPCs usadas**\n`;
    out += renderSet(rpcUsage[ph]);

    out += `\n**Endpoints relacionados**\n`;
    const eps = endpointsByPhase[ph];
    if (!eps || eps.length === 0) out += `- (ninguno)\n\n`;
    else out += eps.map((e) => `- \`${e}\``).join("\n") + "\n\n";
  }

  return out;
}

const doc = fs.readFileSync(ARCH_FILE, "utf8");

const start = "<!-- GENERATED:START -->";
const end = "<!-- GENERATED:END -->";

if (!doc.includes(start) || !doc.includes(end)) {
  console.error("❌ Bloque GENERATED no encontrado en docs/ARCHITECTURE.md");
  process.exit(1);
}

const generated = generateBlock();

// Reemplaza SOLO el contenido entre marcadores
const before = doc.split(start)[0];
const after = doc.split(end)[1];

const updated = `${before}${start}\n\n${generated}\n${end}${after}`;

fs.writeFileSync(ARCH_FILE, updated, "utf8");
console.log("ARCHITECTURE.md actualizado automáticamente");
