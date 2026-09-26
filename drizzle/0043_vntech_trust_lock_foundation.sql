-- VNTECH TRUST LOCK FOUNDATION.
-- Development Mode: enforcement is intentionally disabled; public key only.
CREATE TABLE IF NOT EXISTS vntech_trust_settings (
  id TEXT PRIMARY KEY NOT NULL,
  trust_mode TEXT NOT NULL DEFAULT 'development',
  enforcement_enabled INTEGER NOT NULL DEFAULT 0,
  tenant_id TEXT NOT NULL,
  company_code TEXT NOT NULL,
  key_id TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  public_key_pem TEXT NOT NULL,
  brand_fingerprint TEXT NOT NULL,
  release_fingerprint TEXT NOT NULL,
  machine_fingerprint TEXT,
  hardware_binding_mode TEXT NOT NULL DEFAULT 'foundation',
  native_verifier_mode TEXT NOT NULL DEFAULT 'foundation',
  online_attestation_enabled INTEGER NOT NULL DEFAULT 0,
  license_server_url TEXT,
  last_attested_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO vntech_trust_settings
  (id,trust_mode,enforcement_enabled,tenant_id,company_code,key_id,algorithm,public_key_pem,brand_fingerprint,release_fingerprint,machine_fingerprint,hardware_binding_mode,native_verifier_mode,online_attestation_enabled,license_server_url,last_attested_at,created_at,updated_at)
VALUES
  ('TRUST-ROOT','development',0,'VNTECH-HQ','VNTECH','VNTECH-ROOT-ED25519-2026-01','Ed25519','-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEASRFTGZhWNR/MdNgOF/dikIPzBCmxmmlO5v9TTcYoJdI=
-----END PUBLIC KEY-----','5676760bd5972c4f95abc165298a13162cf0436b61efbeb63bc8ef32aec9d286','448c5b3c923237ac18a090fbe6d6f1b499cd90f2ef140a2877c75b74457fae13',NULL,'foundation','foundation',0,NULL,NULL,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS vntech_license_installations (
  id TEXT PRIMARY KEY NOT NULL,
  license_id TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  company_code TEXT NOT NULL,
  product_id TEXT NOT NULL,
  key_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  signature_base64 TEXT NOT NULL,
  status TEXT NOT NULL,
  valid_from TEXT,
  valid_until TEXT,
  machine_fingerprint TEXT,
  verification_detail_json TEXT,
  installed_by TEXT,
  installed_at TEXT NOT NULL,
  last_verified_at TEXT,
  revoked_at TEXT,
  updated_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS vntech_license_status_idx ON vntech_license_installations(status,valid_until);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS vntech_release_signatures (
  id TEXT PRIMARY KEY NOT NULL,
  release_fingerprint TEXT NOT NULL,
  manifest_sha256 TEXT NOT NULL,
  key_id TEXT NOT NULL,
  signature_base64 TEXT,
  verification_status TEXT NOT NULL DEFAULT 'unsigned_development',
  verified_at TEXT,
  created_at TEXT NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS vntech_attestation_events (
  id TEXT PRIMARY KEY NOT NULL,
  license_id TEXT,
  machine_fingerprint TEXT,
  request_nonce TEXT,
  server_response_json TEXT,
  status TEXT NOT NULL,
  attempted_at TEXT NOT NULL,
  next_attempt_at TEXT,
  error_message TEXT
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS vntech_license_transfer_requests (
  id TEXT PRIMARY KEY NOT NULL,
  license_id TEXT,
  source_machine_fingerprint TEXT,
  destination_machine_fingerprint TEXT,
  recovery_code_hash TEXT,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'requested',
  requested_by TEXT,
  requested_at TEXT NOT NULL,
  approved_at TEXT,
  completed_at TEXT,
  detail_json TEXT
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS vntech_trust_audit (
  id TEXT PRIMARY KEY NOT NULL,
  event_type TEXT NOT NULL,
  actor_user_id TEXT,
  trust_mode TEXT NOT NULL,
  enforcement_enabled INTEGER NOT NULL,
  license_id TEXT,
  machine_fingerprint TEXT,
  detail_json TEXT,
  occurred_at TEXT NOT NULL
);
--> statement-breakpoint
INSERT OR IGNORE INTO vntech_trust_audit
  (id,event_type,actor_user_id,trust_mode,enforcement_enabled,license_id,machine_fingerprint,detail_json,occurred_at)
VALUES
  ('TRUST-AUDIT-FOUNDATION','FOUNDATION_INITIALIZED',NULL,'development',0,NULL,NULL,'{"privateKeyPresent":false,"onlineAttestationEnabled":false,"nativeVerifierMode":"foundation"}',CURRENT_TIMESTAMP);
