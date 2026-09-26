import { canonicalJson } from "./canonical-json.mjs";
import { validateLicenseEnvelope } from "./license-schema.mjs";

function base64Bytes(value) {
  const normalized = String(value).replace(/\s+/g, "");
  const binary = atob(normalized);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function publicKeyBytes(pem) {
  return base64Bytes(String(pem).replace(/-----BEGIN PUBLIC KEY-----|-----END PUBLIC KEY-----/g, ""));
}

async function verifyEd25519(payload, signature, publicKeyPem) {
  const key = await crypto.subtle.importKey("spki", publicKeyBytes(publicKeyPem), { name: "Ed25519" }, false, ["verify"]);
  return crypto.subtle.verify({ name: "Ed25519" }, key, base64Bytes(signature), new TextEncoder().encode(canonicalJson(payload)));
}

export async function verifyLicenseEnvelope(envelope, context) {
  const reasons = validateLicenseEnvelope(envelope);
  if (reasons.length) return { valid: false, status: "invalid_schema", signatureVerified: false, reasons, claims: envelope?.payload ?? null };
  const payload = envelope.payload;
  if (String(envelope.keyId) !== String(context.keyId)) reasons.push("keyId không thuộc Trust Root đang cấu hình.");
  let signatureVerified = false;
  try { signatureVerified = await verifyEd25519(payload, envelope.signature, context.publicKeyPem); }
  catch (error) { reasons.push(`Không khởi tạo được bộ xác minh Ed25519: ${error instanceof Error ? error.message : String(error)}`); }
  if (!signatureVerified && !reasons.some((item) => item.startsWith("Không khởi tạo"))) reasons.push("Chữ ký license không hợp lệ.");
  const now = Date.parse(context.now || new Date().toISOString());
  if (Date.parse(payload.notBefore) > now) reasons.push("License chưa đến thời điểm hiệu lực.");
  if (Date.parse(payload.expiresAt) <= now) reasons.push("License đã hết hạn.");
  if (String(payload.productId) !== String(context.productId)) reasons.push("License không thuộc sản phẩm hiện tại.");
  if (String(payload.tenantId) !== String(context.tenantId)) reasons.push("License không thuộc tenant hiện tại.");
  if (String(payload.companyCode) !== String(context.companyCode)) reasons.push("License không thuộc công ty hiện tại.");
  const binding = payload.machineBinding || { mode: "none", allowedFingerprints: [] };
  if (binding.mode === "required" && !binding.allowedFingerprints?.includes(context.machineFingerprint)) reasons.push("Máy chủ hiện tại không nằm trong hardware binding của license.");
  return { valid: reasons.length === 0 && signatureVerified, status: reasons.length ? "invalid" : "valid", signatureVerified, reasons, claims: payload };
}

export function startupTrustDecision(verification, trustConfig) {
  if (!trustConfig.enforcementEnabled) return { allowStartup: true, enforced: false, mode: trustConfig.mode, reason: verification?.valid ? "LICENSE_VALID_DEVELOPMENT_MODE" : "ENFORCEMENT_DISABLED_BY_DESIGN" };
  return { allowStartup: Boolean(verification?.valid), enforced: true, mode: trustConfig.mode, reason: verification?.valid ? "LICENSE_VALID" : "LICENSE_REQUIRED" };
}
