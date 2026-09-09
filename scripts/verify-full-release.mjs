import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readReleaseIdentity } from "./release-identity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const strictPackage = process.argv.includes("--strict-package");
const identity = readReleaseIdentity();
await import("./preflight-source.mjs");

const migrations = readdirSync(join(root, "drizzle")).filter((name) => /^\d{4}_.+\.sql$/.test(name)).sort();
const migrationHeadNumber = Number.parseInt(String(identity.MIGRATION_HEAD).slice(0, 4), 10);
if (!Number.isInteger(migrationHeadNumber)) throw new Error(`Migration head không hợp lệ: ${identity.MIGRATION_HEAD}.`);
const expectedMigrationCount = migrationHeadNumber + 1;
const expectedMigrationRange = `0000..${String(migrationHeadNumber).padStart(4, "0")}`;
if (migrations.length !== expectedMigrationCount) throw new Error(`Migration chain phải có đúng ${expectedMigrationCount} file (${expectedMigrationRange}), nhận ${migrations.length}.`);
for (let index = 0; index < migrations.length; index += 1) {
  if (!migrations[index].startsWith(String(index).padStart(4, "0") + "_")) {
    throw new Error(`Migration chain bị đứt tại thứ tự ${String(index).padStart(4, "0")}.`);
  }
}
if (migrations.at(-1) !== identity.MIGRATION_HEAD) throw new Error(`Migration head FULL W2 sai: ${migrations.at(-1)}.`);

const marker = readFileSync(join(root, "VNTECH_FULL_W2_ID.txt"), "utf8");
for (const expected of [
  `PACKAGE=${identity.PACKAGE}`,
  `BUILD=${identity.BUILD}`,
  `SOURCE_MASTER=${identity.SOURCE_MASTER}`,
  `UI_CONTRACT=${identity.UI_CONTRACT}`,
  `MIGRATION_HEAD=${identity.MIGRATION_HEAD}`,
  "LICENSE_ENFORCEMENT=DISABLED_BY_DESIGN",
  "ONLINE_ATTESTATION=DISABLED",
  "PRIVATE_KEY=NOT_PRESENT",
  "RUNTIME_PREFIX=vntech-erp",
]) {
  if (!marker.includes(expected)) throw new Error(`VNTECH_FULL_W2_ID.txt thiếu: ${expected}`);
}

const legacyNamePattern = /(?:^|[-_.])(?:patch\d*|gate\d+|rc\d+)(?:[-_.]|$)/i;
const legacyRootArtifacts = readdirSync(root).filter((name) => legacyNamePattern.test(name));
if (legacyRootArtifacts.length) throw new Error(`Còn tệp phát hành cũ ở thư mục gốc: ${legacyRootArtifacts.join(", ")}`);

if (strictPackage) {
  const legacyTests = readdirSync(join(root, "tests")).filter((name) => legacyNamePattern.test(name));
  if (legacyTests.length) throw new Error(`Gói FULL còn test lịch sử theo patch/gate/RC: ${legacyTests.join(", ")}`);
  for (const name of ["FULL_RELEASE_CHANGE_REPORT.md", "FULL_RELEASE_TEST_REPORT.md", "scripts/verify-gate3-full.mjs"]) {
    if (existsSync(join(root, name))) throw new Error(`Gói FULL còn artifact lịch sử: ${name}`);
  }
  for (const name of ["node_modules", "dist", ".env", ".wrangler", ".sites-runtime", ".server-data", "server-data", ".local-data", ".local-backups", ".vntech_backups", ".vntech_update_state", "deploy/.active-profile.json"]) {
    if (existsSync(join(root, name))) throw new Error(`Gói FULL còn dependency/build/runtime state không được đóng gói: ${name}`);
  }
  for (const name of ["00_CAI_MOI_SERVER_WINDOWS.bat", "00_NANG_CAP_GIU_NGUYEN_DU_LIEU_WINDOWS.bat", "01_MO_VNTECH_ERP_WINDOWS.bat", "02_QUAN_LY_HE_THONG_WINDOWS.bat"]) {
    if (!existsSync(join(root, name))) throw new Error(`Gói FULL thiếu lệnh vận hành Windows: ${name}`);
  }
  const runtimeUiSource = `${readFileSync(join(root, "app/page.tsx"), "utf8")}\n${readFileSync(join(root, "app/globals.css"), "utf8")}`;
  for (const markerName of ["data-runtime-ui-patch", "data-runtime-ui-release", "VNTECH_PATCH", "VNTECH_P1_", "VNTECH_FINAL_UI_R9", "vntech-final-header-r9", "vntech-final-sidebar-r9", "prefers-color-scheme", "◐ TỰ ĐỘNG"]) {
    if (runtimeUiSource.includes(markerName)) throw new Error(`Gói FULL còn runtime contract đã bị thay thế: ${markerName}`);
  }
}

const manifestPath = join(root, "MANIFEST_SHA256.txt");
if (existsSync(manifestPath)) {
  const entries = readFileSync(manifestPath, "utf8").trim().split(/\r?\n/).filter(Boolean);
  for (const line of entries) {
    const match = /^([a-f0-9]{64})  \.\/(.+)$/.exec(line);
    if (!match) throw new Error(`Manifest sai định dạng: ${line}`);
    const rel = match[2];
    if (rel.startsWith('.vntech_backups/') || rel.startsWith('.vntech_update_state/')) throw new Error(`Manifest không được tham chiếu dữ liệu backup/update-state: ${rel}`);
    const path = join(root, rel);
    if (!existsSync(path) || !statSync(path).isFile()) throw new Error(`Manifest tham chiếu file thiếu: ${rel}`);
    const actual = createHash("sha256").update(readFileSync(path)).digest("hex");
    if (actual !== match[1]) throw new Error(`SHA256 không khớp: ${match[2]}`);
  }
  console.log(`SHA256 manifest: ĐẠT · ${entries.length} files`);
}

console.log(`SOURCE VERIFIER: ĐẠT · ${identity.PACKAGE} · migrations ${expectedMigrationRange} · private key absent`);
