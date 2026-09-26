// VNTECH ERP — REFRESH IDENTITY SSOT (migrate-head pattern)
// Công cụ chuẩn hoá "refresh identity" sau mỗi vòng phát hành thay đổi source.
//
// Cách dùng:
//   node tools/refresh-phase-identity.mjs <migration-head-file> <phase-label>
// Ví dụ:
//   node tools/refresh-phase-identity.mjs 0054_phase5_finance_advance.sql "PHASE 5 - ADVANCE"
//
// Việc làm:
//   1. Append identity-refresh block (chỉ source_fingerprint 64-hex) vào migration <head>.
//      (Literal 64-hex source fingerprint được generic normalizer tự che → fixed point bền.)
//   2. Tính source fingerprint theo fixed-point (placeholder → hash → thay giá trị thật).
//   3. Tính brand fingerprint + release fingerprint (head mới).
//   4. Cập nhật SSOT: lib/vntech-identity-data.mjs, VNTECH_FINGERPRINT.json,
//      VNTECH_PRODUCT_IDENTITY.txt, VNTECH_PACKAGE_ID.txt, VNTECH_FULL_W2_ID.txt.
//   5. Sau đó chạy: node scripts/generate-release-manifest.mjs + đủ gates.
//
// LƯU Ý: tools/ KHÔNG nằm trong tập hash nguồn (ROOT_DIRS) → file này không ảnh hưởng fingerprint.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VNTECH_IDENTITY_DATA } from "../lib/vntech-identity-data.mjs";
import { calculateBrandFingerprint, calculateReleaseFingerprint } from "../lib/trust/fingerprint.mjs";
import { calculateSourceFingerprint } from "../lib/trust/source-fingerprint.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const HEX64 = /^[a-f0-9]{64}$/;
const PLACEHOLDER = "0".repeat(64);
const SHORT_OF = (hex) => `VNTECH-FP-${hex.slice(0, 16).toUpperCase()}`;

const headFile = process.argv[2];
const phaseLabel = process.argv[3] || headFile;
if (!headFile || !/^\d{4}_.+\.sql$/.test(headFile)) {
  console.error("Cần tham số <head-file.sql> (vd 0054_phase5.sql).");
  process.exit(64);
}
const migrationPath = join(root, "drizzle", headFile);

const IDENTITY_BLOCK = (fp) => `
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='${fp}'
WHERE id='VNTECH-KHO-MEP-001';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_update
BEFORE UPDATE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_delete
BEFORE DELETE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
`;

async function main() {
  const identity = VNTECH_IDENTITY_DATA;
  console.log(`[${phaseLabel}] Identity baseline:`, identity.sourceFingerprint, identity.sourceFingerprintShort, "| head:", identity.release.migrationHead);

  const existing = readFileSync(migrationPath, "utf8");
  if (existing.includes("vntech_product_identity")) {
    console.log("Migration đã có identity block — sẽ thay giá trị placeholder nếu có.");
    if (!existing.includes(PLACEHOLDER)) throw new Error(`Migration ${headFile} đã có identity block với giá trị thật; không chạy lại (bỏ qua).`);
    // Replace only the placeholder literal; keep the rest of the block.
    writeFileSync(migrationPath, existing, "utf8");
  } else {
    writeFileSync(migrationPath, existing + IDENTITY_BLOCK(PLACEHOLDER), "utf8");
    console.log("Appended identity block (placeholder) ->", headFile);
  }

  const fp0 = calculateSourceFingerprint(root, PLACEHOLDER);
  const source = fp0.fingerprint;
  if (!HEX64.test(source)) throw new Error(`Fingerprint không hợp lệ: ${source}`);
  const short = SHORT_OF(source);
  console.log("Source fingerprint (fixed point):", source, short);

  const release = { ...identity.release, migrationHead: headFile };
  const draft = { ...identity, sourceFingerprint: source, sourceFingerprintShort: short, brandFingerprint: "", release };
  const brand = await calculateBrandFingerprint(draft);
  const releaseFp = await calculateReleaseFingerprint(draft);
  console.log("Brand:", brand);
  console.log("Release:", releaseFp, "(head ->", headFile + ")");

  writeFileSync(migrationPath, readFileSync(migrationPath, "utf8").replace(PLACEHOLDER, source), "utf8");
  const check = calculateSourceFingerprint(root, source);
  if (check.fingerprint !== source) throw new Error(`Fixed point FAIL: ${check.fingerprint} != ${source}`);
  console.log("Fixed point stable: OK");

  let mjs = readFileSync(join(root, "lib/vntech-identity-data.mjs"), "utf8");
  mjs = mjs
    .replace(/(sourceFingerprint:\s*")[a-f0-9]{64}(")/, `$1${source}$2`)
    .replace(/(sourceFingerprintShort:\s*")[^"]+(")/, `$1${short}$2`)
    .replace(/(brandFingerprint:\s*")[a-f0-9]{64}(")/, `$1${brand}$2`)
    .replace(/(migrationHead:\s*")[^"]+(")/, `$1${headFile}$2`)
    .replace(/(releaseFingerprint:\s*")[a-f0-9]{64}(")/, `$1${releaseFp}$2`);
  writeFileSync(join(root, "lib/vntech-identity-data.mjs"), mjs, "utf8");

  const fj = JSON.parse(readFileSync(join(root, "VNTECH_FINGERPRINT.json"), "utf8"));
  fj.sourceFingerprint = source;
  fj.sourceFingerprintShort = short;
  fj.brandFingerprint = brand;
  fj.releaseFingerprint = releaseFp;
  writeFileSync(join(root, "VNTECH_FINGERPRINT.json"), JSON.stringify(fj, null, 2) + "\n", "utf8");

  const pi = readFileSync(join(root, "VNTECH_PRODUCT_IDENTITY.txt"), "utf8");
  writeFileSync(
    join(root, "VNTECH_PRODUCT_IDENTITY.txt"),
    pi
      .replace(/(Source fingerprint:\s*)[a-f0-9]{64}/, `$1${source}`)
      .replace(/(Fingerprint short:\s*)[^\r\n]+/, `$1${short}`)
      .replace(/(Brand fingerprint:\s*)[a-f0-9]{64}/, `$1${brand}`)
      .replace(/(Release fingerprint:\s*)[a-f0-9]{64}/, `$1${releaseFp}`),
    "utf8"
  );

  const range = `0000..${headFile.slice(0, 4)}`;
  for (const rel of ["VNTECH_PACKAGE_ID.txt", "VNTECH_FULL_W2_ID.txt"]) {
    const path = join(root, rel);
    const text = readFileSync(path, "utf8");
    writeFileSync(
      path,
      text
        .replace(/(MIGRATION_RANGE=)\S+/, `$1${range}`)
        .replace(/(MIGRATION_HEAD=)\S+/, `$1${headFile}`),
      "utf8"
    );
  }

  console.log(`\n=== ${phaseLabel} REFRESH COMPLETE ===`);
  console.log("SOURCE :", source);
  console.log("SHORT  :", short);
  console.log("BRAND  :", brand);
  console.log("RELEASE:", releaseFp);
  console.log("HEAD   :", headFile);
}

main().catch((error) => {
  console.error("REFRESH FAILED:", error);
  process.exit(1);
});