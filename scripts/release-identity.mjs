import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VNTECH_IDENTITY_DATA } from "../lib/vntech-identity-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

export function readReleaseIdentity() {
  const raw = readFileSync(resolve(root, "VNTECH_PACKAGE_ID.txt"), "utf8");
  const values = Object.fromEntries(raw.split(/\r?\n/).filter(Boolean).map((line) => {
    const index = line.indexOf("=");
    return index < 0 ? [line, ""] : [line.slice(0, index), line.slice(index + 1)];
  }));
  for (const key of [
    "PACKAGE", "PACKAGE_DATE", "RELEASE", "BUILD", "SOURCE_MASTER", "SOURCE_FORM",
    "UI_CONTRACT", "MIGRATION_RANGE", "MIGRATION_HEAD", "TRUST_MODE",
    "LICENSE_ENFORCEMENT", "ONLINE_ATTESTATION", "PRIVATE_KEY",
  ]) {
    if (!values[key]) throw new Error(`Release identity thiếu ${key}`);
  }
  const expected = {
    PACKAGE: VNTECH_IDENTITY_DATA.release.packageId,
    RELEASE: VNTECH_IDENTITY_DATA.release.name,
    BUILD: VNTECH_IDENTITY_DATA.release.build,
    SOURCE_MASTER: VNTECH_IDENTITY_DATA.release.sourceMaster,
    UI_CONTRACT: VNTECH_IDENTITY_DATA.release.uiContractId,
    MIGRATION_HEAD: VNTECH_IDENTITY_DATA.release.migrationHead,
    TRUST_MODE: VNTECH_IDENTITY_DATA.trust.mode,
    LICENSE_ENFORCEMENT: "DISABLED_BY_DESIGN",
    ONLINE_ATTESTATION: "DISABLED",
    PRIVATE_KEY: "NOT_PRESENT",
  };
  for (const [key, expectedValue] of Object.entries(expected)) {
    if (values[key] !== expectedValue) throw new Error(`Release identity ${key} không khớp SSOT: ${values[key]} != ${expectedValue}`);
  }
  if (VNTECH_IDENTITY_DATA.trust.enforcementEnabled || VNTECH_IDENTITY_DATA.trust.onlineAttestationEnabled || VNTECH_IDENTITY_DATA.trust.privateKeyPresent) {
    throw new Error("Trust Lock W2 phải ở Development Mode, chưa enforce và không chứa private key.");
  }
  return values;
}
