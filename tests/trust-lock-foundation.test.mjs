import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { canonicalJson } from "../lib/trust/canonical-json.mjs";
import { calculateBrandFingerprint, calculateMachineFingerprint, calculateReleaseFingerprint } from "../lib/trust/fingerprint.mjs";
import { verifyLicenseEnvelope, startupTrustDecision } from "../lib/trust/license-verifier.mjs";
import { VNTECH_IDENTITY_DATA } from "../lib/vntech-identity-data.mjs";
import { inspectStartupTrust } from "../scripts/trust-startup.mjs";

function pemPublicKey(bytes) {
  const base64 = Buffer.from(bytes).toString("base64").match(/.{1,64}/g)?.join("\n") || "";
  return `-----BEGIN PUBLIC KEY-----\n${base64}\n-----END PUBLIC KEY-----`;
}

async function walk(root) {
  const files = [];
  for (const entry of await readdir(root)) {
    if (["node_modules", "dist", ".next", ".wrangler", ".sites-runtime"].includes(entry)) continue;
    const path = join(root, entry);
    if ((await stat(path)).isDirectory()) files.push(...await walk(path));
    else files.push(path);
  }
  return files;
}

await test("Brand Manifest và Release Fingerprint khớp SSOT", async () => {
  assert.equal(await calculateBrandFingerprint(VNTECH_IDENTITY_DATA), VNTECH_IDENTITY_DATA.brandFingerprint);
  assert.equal(await calculateReleaseFingerprint(VNTECH_IDENTITY_DATA), VNTECH_IDENTITY_DATA.release.releaseFingerprint);
  assert.match(await calculateMachineFingerprint({ architecture: "x64", machineId: "machine", nodeName: "server", platform: "linux", tpmEkHash: "unavailable" }), /^[a-f0-9]{64}$/);
});

await test("Development Mode cho phép startup khi chưa có license", async () => {
  const missing = { valid: false, status: "missing", signatureVerified: false, reasons: ["Chưa cài license."], claims: null };
  assert.deepEqual(startupTrustDecision(missing, VNTECH_IDENTITY_DATA.trust), {
    allowStartup: true,
    enforced: false,
    mode: "development",
    reason: "ENFORCEMENT_DISABLED_BY_DESIGN",
  });
  const state = await inspectStartupTrust(resolve("."));
  assert.equal(state.allowStartup, true);
  assert.equal(state.enforced, false);
  assert.equal(state.integrity.brand, true);
  assert.equal(state.integrity.release, true);
  assert.equal(state.onlineAttestationEnabled, false);
});

await test("License Verifier xác minh Ed25519 và ràng buộc tenant/product/machine", async () => {
  const keys = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const publicSpki = await crypto.subtle.exportKey("spki", keys.publicKey);
  const machineFingerprint = "b".repeat(64);
  const payload = {
    schemaVersion: "1.0",
    licenseId: "LIC-W2-TEST",
    tenantId: VNTECH_IDENTITY_DATA.company.tenantId,
    companyCode: VNTECH_IDENTITY_DATA.company.companyCode,
    productId: VNTECH_IDENTITY_DATA.productId,
    issuedAt: "2026-09-03T00:00:00.000Z",
    notBefore: "2026-09-03T00:00:00.000Z",
    expiresAt: "2027-09-03T00:00:00.000Z",
    features: ["trust-foundation"],
    machineBinding: { mode: "required", allowedFingerprints: [machineFingerprint] },
  };
  const signature = Buffer.from(await crypto.subtle.sign("Ed25519", keys.privateKey, new TextEncoder().encode(canonicalJson(payload)))).toString("base64");
  const context = {
    keyId: "TEST-ROOT",
    publicKeyPem: pemPublicKey(publicSpki),
    productId: VNTECH_IDENTITY_DATA.productId,
    tenantId: VNTECH_IDENTITY_DATA.company.tenantId,
    companyCode: VNTECH_IDENTITY_DATA.company.companyCode,
    machineFingerprint,
    now: "2026-09-04T00:00:00.000Z",
  };
  const valid = await verifyLicenseEnvelope({ payload, keyId: "TEST-ROOT", signature }, context);
  assert.equal(valid.valid, true);
  assert.equal(valid.signatureVerified, true);
  const wrongMachine = await verifyLicenseEnvelope({ payload, keyId: "TEST-ROOT", signature }, { ...context, machineFingerprint: "c".repeat(64) });
  assert.equal(wrongMachine.valid, false);
  assert.match(wrongMachine.reasons.join(" "), /hardware binding/);
});

await test("Production enforcement chưa thể tự bật trong release W2", () => {
  assert.equal(VNTECH_IDENTITY_DATA.trust.mode, "development");
  assert.equal(VNTECH_IDENTITY_DATA.trust.enforcementEnabled, false);
  assert.equal(VNTECH_IDENTITY_DATA.trust.onlineAttestationEnabled, false);
  assert.equal(VNTECH_IDENTITY_DATA.trust.privateKeyPresent, false);
});

await test("Không có private key hoặc file khóa bí mật trong source", async () => {
  const suspiciousExtensions = /\.(key|p12|pfx|jks|keystore)$/i;
  const privatePem = new RegExp(["-----BEGIN ", "(?:RSA |EC |OPENSSH )?", "PRIVATE KEY", "-----"].join(""));
  for (const file of await walk(resolve("."))) {
    assert.equal(suspiciousExtensions.test(file), false, `Phát hiện file khóa: ${file}`);
    if (!/\.(?:mjs|js|ts|tsx|json|sql|md|txt|yml|yaml|env|example|bat|ps1|sh)$/i.test(file)) continue;
    const body = await readFile(file, "utf8");
    assert.equal(privatePem.test(body), false, `Phát hiện PEM private key: ${file}`);
  }
});
