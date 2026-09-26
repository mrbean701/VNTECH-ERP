import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const fail = (message) => { throw new Error(`MASTER BASELINE GATE: ${message}`); };

if (existsSync(join(root, "scripts/files-route.mjs"))) fail("scripts/files-route.mjs không được tồn tại; /api/files chỉ có một SSOT.");
const appFiles = read("app/api/files/route.ts");
for (const marker of ["export async function GET", "export async function POST", "export async function DELETE", "contract_ownership_transfers", "VNTECH_PROJECT_OFFLINE_ARCHIVE_V1"]) {
  if (!appFiles.includes(marker)) fail(`app/api/files/route.ts thiếu ${marker}`);
}
for (const rel of ["scripts/universal-server.mjs", "scripts/local-server.mjs"]) {
  const text = read(rel);
  if (/files-route\.mjs|filesRoute\./.test(text)) fail(`${rel} còn route files song song.`);
  if (/\bfilesRouteUrl\b/.test(text)) fail(`${rel} còn biến filesRouteUrl mồ côi.`);
  if (!/pathname === "\/api\/files"[\s\S]{0,260}worker\.fetch\(request, runtime\.env, executionContext\)/.test(text)) fail(`${rel} chưa delegate /api/files vào built Worker route.`);
}
const universalRuntime = read("scripts/universal-runtime.mjs");
if (!/class PathFileBucket[\s\S]*async delete\(key\)[\s\S]{0,220}unlink\(path\)/.test(universalRuntime)) fail("PathFileBucket thiếu delete() vật lý.");
const localRuntime = read("scripts/local-runtime.mjs");
if (!/class LocalFileBucket[\s\S]*async delete\(key\)[\s\S]{0,260}unlink\(path\)/.test(localRuntime)) fail("LocalFileBucket thiếu delete() vật lý.");
if (!localRuntime.includes("VNTECH_IDENTITY.sourceFingerprint")) fail("Local runtime phải lấy source fingerprint từ identity SSOT.");
const postgresMigrator = read("scripts/migrate-postgres.mjs");
if (!postgresMigrator.includes("VNTECH_IDENTITY.sourceFingerprint")) fail("PostgreSQL migrator phải lấy source fingerprint từ identity SSOT.");

const schema = read("db/schema.ts");
const assignment = schema.match(/export const approvalProjectAssignments[\s\S]*?\n\}, \(table\) => \[[^\n]+\]\);/i)?.[0] || "";
if (!assignment) fail("Không tìm thấy approvalProjectAssignments trong schema.");
if (/\.references\(/.test(assignment)) fail("approvalProjectAssignments đang khai báo FK khác migration 0047 thực tế.");
const migration47 = read("drizzle/0047_patch02_single_owner_approval.sql");
if (!/CREATE TABLE IF NOT EXISTS approval_project_assignments/.test(migration47) || !/UNIQUE\(project_id, stage\)/.test(migration47)) fail("Migration 0047 không đúng Single Owner baseline.");
const migration48 = read("drizzle/0048_master_baseline_identity_refresh.sql");
if (!/UPDATE vntech_product_identity/.test(migration48) || !/UPDATE vntech_trust_settings/.test(migration48)) fail("Migration 0048 lịch sử không đúng metadata identity refresh R1.1.");
const migration49 = read("drizzle/0049_master_baseline_identity_refresh_r1_1_1.sql");
if (!/MASTER BASELINE CLEANUP R1\.1\.1/.test(migration49) || !/UPDATE vntech_product_identity/.test(migration49) || !/UPDATE vntech_trust_settings/.test(migration49)) fail("Migration 0049 không đúng metadata identity refresh R1.1.1.");

const css = read("app/globals.css");
const count = (needle) => css.split(needle).length - 1;
if (count("VNTECH_MASTER_BASELINE_CSS_R1_1_1_BEGIN") !== 1 || count("VNTECH_MASTER_BASELINE_CSS_R1_1_1_END") !== 1) fail("Canonical CSS R1.1.1 marker phải đúng một cặp BEGIN/END.");
const endMarker = "/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */";
const endIndex = css.indexOf(endMarker);
if (endIndex < 0 || css.slice(endIndex + endMarker.length).trim()) fail("Không được append CSS sau canonical R1.1.1 END.");
for (const obsolete of ["UI-only patch", "older runtime rules", "runtime audit fixes layered", "Final responsive override", "FULL W2 UI PASS", "VNTECH_FULL_W2_UI_REGRESSION_LOCK", "VNTECH_FULL_UI_20260907_BEGIN"]) {
  if (css.includes(obsolete)) fail(`CSS còn dấu lịch sử override/patch: ${obsolete}`);
}
const importantCount = count("!important");
if (importantCount > 4950) fail(`CSS !important vượt safe-clean baseline R1.1.1: ${importantCount} > 4950.`);
const byteSize = Buffer.byteLength(css, "utf8");
if (byteSize > 400653) fail(`CSS phình vượt safe-clean baseline R1.1.1: ${byteSize} > 400653 bytes.`);
if (!/\.nav-glyph\s*\{[^}]*width:25px!important[^}]*height:25px!important[^}]*background:#eef5ff!important/i.test(css)) fail("Base .nav-glyph mất width/height/background canonical.");
if (!/\.nav-glyph-green\s*\{/.test(css)) fail("Thiếu dynamic CSS .nav-glyph-green.");
if (!/\.request-match-manual\s*\{/.test(css)) fail("Thiếu dynamic CSS .request-match-manual.");
if (/@media[^{]*\{\s*\}/.test(css)) fail("CSS còn media block rỗng.");
if (/\.topbar-brand\b|\.vntech-brand-ribbon\b/.test(css)) fail("CSS còn header brand selector đã chết.");

for (const [label, pattern, max] of [
  [".topbar", /\.topbar\s*\{/g, 34], [".sidebar", /\.sidebar\s*\{/g, 26],
  [".main-content", /\.main-content\s*\{/g, 21], [".app-shell", /\.app-shell\s*\{/g, 19],
  [".nav-children", /\.nav-children\s*\{/g, 19],
]) {
  const occurrences = (css.match(pattern) || []).length;
  if (occurrences > max) fail(`Selector ${label} vượt safe-clean baseline: ${occurrences} > ${max}.`);
}

console.log(`MASTER BASELINE GATE: ĐẠT · /api/files SSOT · dual storage DELETE · schema 0047 aligned · identity 0049 · CSS R1.1.1 canonical · !important=${importantCount} · css=${byteSize}B`);
