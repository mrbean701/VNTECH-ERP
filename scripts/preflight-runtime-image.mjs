import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { runPackagedPreflight } from "./preflight-postgres-runtime.mjs";
import { VNTECH_IDENTITY_DATA } from "../lib/vntech-identity-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const required = [
  "dist/client",
  "dist/server",
  "dist/.mep-version",
  "dist/.vntech-ui-contract",
  "scripts/verify-built-ui-contract.mjs",
  "scripts/system-route.mjs",
  "scripts/universal-server.mjs",
  "scripts/universal-runtime.mjs",
  "scripts/trust-startup.mjs",
  "scripts/migrate-postgres.mjs",
  "drizzle/0043_vntech_trust_lock_foundation.sql",
  "drizzle/0044_w2_admin_import_role_org.sql",
  "drizzle/0045_patch01_runtime_admin_boq_hardening.sql",
  "drizzle/0046_patch01_account_recovery_project_offline_archive.sql",
  "drizzle/0047_patch02_single_owner_approval.sql",
  "drizzle/0048_master_baseline_identity_refresh.sql",
  "drizzle/0049_master_baseline_identity_refresh_r1_1_1.sql",
  "public/vntech-logo.png",
  "public/vntech-header-city-light.webp",
  "public/vntech-header-city-dark.webp",
  "VNTECH_PACKAGE_ID.txt",
  "VNTECH_FULL_W2_ID.txt",
  "deploy/docker-entrypoint.sh",
];
for (const relative of required) {
  const path = join(root, relative);
  if (!existsSync(path)) throw new Error(`Runtime image thiếu: ${relative}`);
}
if (readFileSync(join(root, "dist/.mep-version"), "utf8").trim() !== VNTECH_IDENTITY_DATA.version) throw new Error("Runtime version không khớp.");
const assets = join(root, "dist/client/assets");
if (!existsSync(assets) || !readdirSync(assets).some((name) => name.endsWith(".js") && statSync(join(assets, name)).size > 0)) {
  throw new Error("Runtime image thiếu client JavaScript bundle.");
}
const builtUi = spawnSync(process.execPath, [join(root, "scripts/verify-built-ui-contract.mjs"), "--runtime"], { cwd: root, stdio: "inherit" });
if (builtUi.status !== 0) throw new Error("Runtime built UI contract không đạt.");
runPackagedPreflight();
console.log(`RUNTIME IMAGE PREFLIGHT: ĐẠT · ${VNTECH_IDENTITY_DATA.release.build} · Trust Development Mode`);
