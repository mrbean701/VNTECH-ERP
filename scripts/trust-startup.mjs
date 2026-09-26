import { access, readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { arch, hostname, platform } from "node:os";
import { resolve } from "node:path";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";
import { calculateBrandFingerprint, calculateMachineFingerprint, calculateReleaseFingerprint } from "../lib/trust/fingerprint.mjs";
import { startupTrustDecision, verifyLicenseEnvelope } from "../lib/trust/license-verifier.mjs";

async function optionalText(path) {
  try { await access(path, fsConstants.R_OK); return (await readFile(path, "utf8")).trim(); }
  catch { return ""; }
}

async function machineSignals() {
  const linuxMachineId = await optionalText("/etc/machine-id");
  return {
    architecture: arch(),
    machineId: linuxMachineId || process.env.VNTECH_MACHINE_ID || "unavailable",
    nodeName: process.env.VNTECH_NODE_NAME || hostname(),
    platform: platform(),
    // A native/TPM adapter can supply the EK hash later without changing the license contract.
    tpmEkHash: process.env.VNTECH_TPM_EK_HASH || "unavailable",
  };
}

export async function inspectStartupTrust(projectRoot) {
  const brandFingerprint = await calculateBrandFingerprint(VNTECH_IDENTITY);
  const releaseFingerprint = await calculateReleaseFingerprint(VNTECH_IDENTITY);
  const signals = await machineSignals();
  const machineFingerprint = await calculateMachineFingerprint(signals);
  let licenseEnvelope = null;
  let verification = { valid: false, status: "missing", signatureVerified: false, reasons: ["Chưa cài license."], claims: null };
  const licensePath = String(process.env.VNTECH_LICENSE_FILE || "").trim();
  if (licensePath) {
    try {
      licenseEnvelope = JSON.parse(await readFile(resolve(projectRoot, licensePath), "utf8"));
      verification = await verifyLicenseEnvelope(licenseEnvelope, {
        keyId: VNTECH_IDENTITY.trust.keyId,
        publicKeyPem: VNTECH_IDENTITY.trust.publicKeyPem,
        productId: VNTECH_IDENTITY.productId,
        tenantId: VNTECH_IDENTITY.company.tenantId,
        companyCode: VNTECH_IDENTITY.company.companyCode,
        machineFingerprint,
      });
    } catch (error) {
      verification = { valid: false, status: "unreadable", signatureVerified: false, reasons: [error instanceof Error ? error.message : String(error)], claims: null };
    }
  }
  const integrity = {
    brand: brandFingerprint === VNTECH_IDENTITY.brandFingerprint,
    release: releaseFingerprint === VNTECH_IDENTITY.release.releaseFingerprint,
  };
  if (!integrity.brand) verification.reasons.push("Brand Manifest fingerprint không khớp SSOT.");
  if (!integrity.release) verification.reasons.push("Release fingerprint không khớp SSOT.");
  if (!integrity.brand || !integrity.release) verification.valid = false;
  const decision = startupTrustDecision(verification, VNTECH_IDENTITY.trust);
  return {
    ...decision,
    brandFingerprint,
    releaseFingerprint,
    machineFingerprint,
    integrity,
    license: verification,
    licenseLoaded: Boolean(licenseEnvelope),
    privateKeyPresent: false,
    onlineAttestationEnabled: false,
    nativeVerifierMode: "foundation",
  };
}
