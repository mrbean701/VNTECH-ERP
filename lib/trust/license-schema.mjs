export const LICENSE_SCHEMA_VERSION = "1.0";

export function validateLicensePayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return ["Payload license phải là object."];
  const required = ["schemaVersion", "licenseId", "tenantId", "companyCode", "productId", "issuedAt", "notBefore", "expiresAt"];
  for (const key of required) if (!String(payload[key] ?? "").trim()) errors.push(`Thiếu trường ${key}.`);
  if (payload.schemaVersion !== LICENSE_SCHEMA_VERSION) errors.push(`schemaVersion phải là ${LICENSE_SCHEMA_VERSION}.`);
  for (const key of ["issuedAt", "notBefore", "expiresAt"]) {
    if (payload[key] && !Number.isFinite(Date.parse(String(payload[key])))) errors.push(`${key} không phải thời điểm ISO hợp lệ.`);
  }
  if (payload.notBefore && payload.expiresAt && Date.parse(payload.expiresAt) <= Date.parse(payload.notBefore)) errors.push("expiresAt phải sau notBefore.");
  if (payload.features !== undefined && (!Array.isArray(payload.features) || payload.features.some((item) => typeof item !== "string"))) errors.push("features phải là mảng chuỗi.");
  const binding = payload.machineBinding;
  if (binding !== undefined) {
    if (!binding || typeof binding !== "object" || !["none", "optional", "required"].includes(binding.mode)) errors.push("machineBinding.mode phải là none, optional hoặc required.");
    if (binding?.allowedFingerprints !== undefined && (!Array.isArray(binding.allowedFingerprints) || binding.allowedFingerprints.some((item) => !/^[a-f0-9]{64}$/i.test(String(item))))) errors.push("machineBinding.allowedFingerprints phải là mảng SHA-256.");
  }
  return errors;
}

export function validateLicenseEnvelope(envelope) {
  const errors = [];
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope)) return ["License envelope phải là object."];
  errors.push(...validateLicensePayload(envelope.payload));
  if (!String(envelope.keyId ?? "").trim()) errors.push("Thiếu keyId.");
  if (!String(envelope.signature ?? "").trim()) errors.push("Thiếu chữ ký license.");
  return errors;
}
