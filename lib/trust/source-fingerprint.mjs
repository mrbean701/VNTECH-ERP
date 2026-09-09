import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const ROOT_FILES = new Set([
  ".env.example", ".npmrc", "Dockerfile", "drizzle.config.ts", "eslint.config.mjs",
  "next.config.ts", "package-lock.json", "package.json", "postcss.config.mjs", "tsconfig.json",
  "vite.config.ts", "wrangler.local.jsonc", "00_CAI_MOI_SERVER_WINDOWS.bat",
  "00_NANG_CAP_GIU_NGUYEN_DU_LIEU_WINDOWS.bat", "01_MO_VNTECH_ERP_WINDOWS.bat",
  "02_QUAN_LY_HE_THONG_WINDOWS.bat", "VNTECH_SERVER.sh",
]);
const ROOT_DIRS = new Set(["app", "db", "deploy", "drizzle", "lib", "public", "scripts", "tests", "worker"]);
const EXCLUDED = new Set([
  "lib/vntech-identity-data.mjs",
]);
const LEGACY_SOURCE_FINGERPRINTS = [
  "86a68b97ab33d33cddf164dd8db99921a9829187a682d972a69aa227389040e2",
  "1ee04465fdcc3afd7022e1a777f9a2f60827b6e5209f275aeb7634fcfa086dec",
];

function walk(directory, root, output) {
  for (const name of readdirSync(directory).sort()) {
    const path = join(directory, name);
    const rel = relative(root, path).split(sep).join("/");
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, root, output);
    else if (stat.isFile() && !EXCLUDED.has(rel)) output.push({ path, rel });
  }
}

function normalizeText(rel, text, currentSourceFingerprint) {
  let normalized = text.replace(/\r\n/g, "\n");
  // Identity-refresh migrations intentionally persist source/brand/release fingerprints.
  // Normalize them FIRST so the calculated source fingerprint is stable regardless of
  // which release fingerprint is currently loaded in the identity SSOT.
  if (/^drizzle\/004\d+_master_baseline_identity_refresh.*\.sql$/.test(rel)) {
    normalized = normalized.replace(/[a-f0-9]{64}/gi, "<VNTECH_IDENTITY_FINGERPRINT>");
    normalized = normalized.replace(/VNTECH-FP-[A-F0-9]{16}/g, "VNTECH-FP-<SOURCE_SHORT>");
  } else {
    const fingerprints = new Set([...LEGACY_SOURCE_FINGERPRINTS, currentSourceFingerprint].filter(Boolean));
    for (const fingerprint of fingerprints) normalized = normalized.split(fingerprint).join("<VNTECH_SOURCE_FINGERPRINT>");
    normalized = normalized.replace(/Fingerprint:\s*[a-f0-9]{64}/gi, "Fingerprint: <VNTECH_SOURCE_FINGERPRINT>");
  }
  return Buffer.from(normalized, "utf8");
}

function isText(buffer) {
  const sample = buffer.subarray(0, Math.min(buffer.length, 4096));
  return !sample.includes(0);
}

export function sourceFingerprintInputs(rootDirectory) {
  const root = resolve(rootDirectory);
  const files = [];
  for (const name of [...ROOT_FILES].sort()) {
    const path = join(root, name);
    try { if (statSync(path).isFile()) files.push({ path, rel: name }); } catch {}
  }
  for (const name of [...ROOT_DIRS].sort()) {
    const path = join(root, name);
    try { if (statSync(path).isDirectory()) walk(path, root, files); } catch {}
  }
  return files.sort((a, b) => a.rel.localeCompare(b.rel));
}

export function calculateSourceFingerprint(rootDirectory, currentSourceFingerprint = "") {
  const hash = createHash("sha256");
  const files = sourceFingerprintInputs(rootDirectory);
  for (const file of files) {
    const raw = readFileSync(file.path);
    const content = isText(raw) ? normalizeText(file.rel, raw.toString("utf8"), currentSourceFingerprint) : raw;
    hash.update(file.rel, "utf8"); hash.update("\0");
    hash.update(String(content.length), "utf8"); hash.update("\0");
    hash.update(content); hash.update("\0");
  }
  return { fingerprint: hash.digest("hex"), fileCount: files.length };
}
