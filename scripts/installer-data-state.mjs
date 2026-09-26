// VNTECH ERP installer data-state helpers.
// Side-effect free inspection utilities so installer state handling can be regression tested.
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { join, resolve } from "node:path";

export function normalizeHostPath(value, isWin = process.platform === "win32") {
  let p = String(value || "").trim();
  if (isWin) p = p.replaceAll("\\", "/");
  p = p.replace(/\/+$/, "");
  return isWin ? p.toLowerCase() : p;
}

export function sameHostPath(a, b, isWin = process.platform === "win32") {
  if (!a || !b) return false;
  return normalizeHostPath(a, isWin) === normalizeHostPath(b, isWin);
}

export function dirHasEntries(dir) {
  try { return existsSync(dir) && statSync(dir).isDirectory() && readdirSync(dir).length > 0; }
  catch { return true; }
}

export function inspectPostgresCluster(dbData) {
  const pgVersion = join(dbData, "PG_VERSION");
  if (existsSync(pgVersion)) {
    let version = "unknown";
    try { version = readFileSync(pgVersion, "utf8").trim() || "unknown"; } catch {}
    return { initialized:true, partial:false, version, reason:"PG_VERSION" };
  }
  const structural = ["base", "global", "pg_wal", "pg_multixact", "postgresql.conf", "pg_hba.conf"]
    .filter(name => existsSync(join(dbData, name)));
  if (structural.length >= 2) return { initialized:true, partial:false, version:"unknown", reason:`postgres-structure:${structural.join(",")}` };
  return { initialized:false, partial:dirHasEntries(dbData), version:null, reason:dirHasEntries(dbData) ? "nonempty-no-pg-version" : "empty" };
}

export function parseSimpleEnv(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    out[line.slice(0, i).trim()] = line.slice(i + 1);
  }
  return out;
}

export function infrastructureStateFile(localRoot) {
  return join(localRoot, "secrets", ".vntech-infrastructure.env");
}

export function readInfrastructureState(localRoot) {
  const file = infrastructureStateFile(localRoot);
  const env = parseSimpleEnv(file);
  return { file, env, exists: existsSync(file) };
}

export function infrastructureStateMatches(state, dbData, postgresUser="vntech_app", isWin = process.platform === "win32") {
  return !!state?.exists &&
    sameHostPath(state.env.VNTECH_DB_DATA_PATH, dbData, isWin) &&
    state.env.POSTGRES_USER === postgresUser &&
    !!state.env.POSTGRES_PASSWORD &&
    !!state.env.REDIS_PASSWORD;
}

export function writeInfrastructureState(localRoot, values) {
  const file = infrastructureStateFile(localRoot);
  mkdirSync(resolve(localRoot, "secrets"), { recursive:true });
  const lines = [
    "# VNTECH ERP infrastructure credentials - DO NOT SHARE",
    `VNTECH_DB_DATA_PATH=${String(values.VNTECH_DB_DATA_PATH || "").replace(/\r?\n/g, "")}`,
    `VNTECH_COMPOSE_PROJECT=${String(values.VNTECH_COMPOSE_PROJECT || "").replace(/\r?\n/g, "")}`,
    `VNTECH_RELEASE_BUILD=${String(values.VNTECH_RELEASE_BUILD || "").replace(/\r?\n/g, "")}`,
    `POSTGRES_DB=${String(values.POSTGRES_DB || "vntech_erp").replace(/\r?\n/g, "")}`,
    `POSTGRES_USER=${String(values.POSTGRES_USER || "vntech_app").replace(/\r?\n/g, "")}`,
    `POSTGRES_PASSWORD=${String(values.POSTGRES_PASSWORD || "").replace(/\r?\n/g, "")}`,
    `REDIS_PASSWORD=${String(values.REDIS_PASSWORD || "").replace(/\r?\n/g, "")}`,
    "",
  ];
  writeFileSync(file, lines.join("\n"), { encoding:"utf8", mode:0o600 });
  return file;
}
