import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VNTECH_IDENTITY_DATA } from "../lib/vntech-identity-data.mjs";
import { calculateBrandFingerprint, calculateReleaseFingerprint } from "../lib/trust/fingerprint.mjs";
import { calculateSourceFingerprint } from "../lib/trust/source-fingerprint.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const identity = JSON.parse(readFileSync(join(root, "VNTECH_FINGERPRINT.json"), "utf8"));
const expected = VNTECH_IDENTITY_DATA;
for (const [key, value] of Object.entries({
  legalOwner: expected.legalOwner,
  productId: expected.productId,
  version: expected.version,
  sourceFingerprint: expected.sourceFingerprint,
  sourceFingerprintShort: expected.sourceFingerprintShort,
  brandFingerprint: expected.brandFingerprint,
  releaseFingerprint: expected.release.releaseFingerprint,
  releaseBuild: expected.release.build,
  packageId: expected.release.packageId,
  trustMode: expected.trust.mode,
  licenseEnforcement: expected.trust.enforcementEnabled,
  privateKeyPresent: false,
})) {
  if (identity[key] !== value) throw new Error(`VNTECH_FINGERPRINT.json không khớp SSOT tại ${key}.`);
}
const calculatedSource = calculateSourceFingerprint(root, expected.sourceFingerprint);
if (calculatedSource.fingerprint !== expected.sourceFingerprint) throw new Error(`Source fingerprint không hợp lệ: expected ${expected.sourceFingerprint}, actual ${calculatedSource.fingerprint}.`);
if (await calculateBrandFingerprint(expected) !== expected.brandFingerprint) throw new Error("Brand fingerprint không hợp lệ.");
if (await calculateReleaseFingerprint(expected) !== expected.release.releaseFingerprint) throw new Error("Release fingerprint không hợp lệ.");
for (const relative of ["public/vntech-logo.png", "public/vntech-icon.png"]) {
  if (!existsSync(join(root, relative))) throw new Error(`Thiếu nhận diện: ${relative}`);
}
const logoHash = createHash("sha256").update(readFileSync(join(root, "public/vntech-logo.png"))).digest("hex");
console.log(`VNTECH FINGERPRINT: ĐẠT · ${expected.sourceFingerprintShort} · source:${calculatedSource.fileCount} files · brand/release verified · logo:${logoHash.slice(0, 12)}`);
