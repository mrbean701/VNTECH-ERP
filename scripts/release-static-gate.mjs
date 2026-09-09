import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readReleaseIdentity } from "./release-identity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const identity = readReleaseIdentity();
const checks = [
  ["node", ["scripts/verify-full-release.mjs"], "Package/source verifier"],
  ["node", ["scripts/migrate-postgres.mjs", "--preflight"], "Migration verification"],
  ["node", ["scripts/preflight-postgres-runtime.mjs", "--static"], "PostgreSQL runtime static preflight"],
  ["node", ["scripts/verify-sql-bind-arity.mjs"], "SQL bind arity preflight"],
  ["node", ["scripts/template-preflight.mjs"], "Template verifier"],
  ["node", ["scripts/openxml-preflight.mjs"], "OpenXML verifier"],
  ["node", ["scripts/verify-vntech-fingerprint.mjs"], "Brand fingerprint verifier"],
  ["node", ["scripts/master-baseline-gate.mjs"], "Master Baseline architecture gate"],
  ["npm", ["run", "lint"], "Lint"],
  ["npm", ["run", "typecheck"], "Type check"],
  ["npm", ["run", "test:regression"], "Functional/Trust/Security regression"],
  ["npm", ["run", "test:workflow"], "Workflow regression"],
];

for (const [command, args, label] of checks) {
  console.log(`\n[RELEASE GATE] ${label}`);
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit", env: process.env, shell: process.platform === "win32" });
  if (result.status !== 0) {
    console.error(`RELEASE STATIC GATE: KHÔNG ĐẠT · ${label}`);
    process.exit(result.status || 1);
  }
}
console.log(`\nRELEASE STATIC GATE: ĐẠT · ${identity.BUILD}`);
