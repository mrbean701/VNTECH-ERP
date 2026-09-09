import { canonicalJson } from "./canonical-json.mjs";

export async function sha256Hex(value) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function brandManifestPayload(identity) {
  return {
    legalOwner: identity.legalOwner,
    logoPath: identity.logoPath,
    productId: identity.productId,
    productName: identity.productName,
    sourceFingerprint: identity.sourceFingerprint,
  };
}

export function releaseFingerprintPayload(identity) {
  return {
    build: identity.release.build,
    migrationHead: identity.release.migrationHead,
    packageId: identity.release.packageId,
    uiContractId: identity.release.uiContractId,
  };
}

export async function calculateBrandFingerprint(identity) {
  return sha256Hex(canonicalJson(brandManifestPayload(identity)));
}

export async function calculateReleaseFingerprint(identity) {
  return sha256Hex(canonicalJson(releaseFingerprintPayload(identity)));
}

export async function calculateMachineFingerprint(signals) {
  const safeSignals = {
    architecture: String(signals?.architecture || "unknown"),
    machineId: String(signals?.machineId || "unavailable"),
    nodeName: String(signals?.nodeName || "unknown"),
    platform: String(signals?.platform || "unknown"),
    tpmEkHash: String(signals?.tpmEkHash || "unavailable"),
  };
  return sha256Hex(canonicalJson(safeSignals));
}
