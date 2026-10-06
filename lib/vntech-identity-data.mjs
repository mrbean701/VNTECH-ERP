/**
 * Single source of truth for VNTECH brand, release and public trust identity.
 * This module intentionally contains public verification material only.
 */
export const VNTECH_BRAND_MANIFEST = Object.freeze({
  legalOwner: "CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH)",
  logoPath: "/vntech-logo.png",
  productId: "VNTECH-KHO-MEP-001",
  productName: "VNTECH ERP",
  sourceFingerprint: "fc5ef3638b86e74dbbdc0a327005f3ac0c1cbfc250310675cee56cb9dc393088",
});

export const VNTECH_IDENTITY_DATA = Object.freeze({
  ...VNTECH_BRAND_MANIFEST,
  shortOwner: "VNTECH",
  productDescription: "Quản trị & Điều hành – Nền tảng quản trị tổng thể nội bộ VNTECH",
  version: "5.3.0",
  sourceFingerprintShort: "VNTECH-FP-FC5EF3638B86E74D",
  brandFingerprint: "8e6acbcbaf5ad76a8f68be3ad3318dad61172c6186ffd0a25d5afea2d28a3ae5",
  copyright: "© 2026 CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH). All rights reserved.",
  company: Object.freeze({
    tenantId: "VNTECH-HQ",
    companyCode: "VNTECH",
    displayName: "CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT",
  }),
  release: Object.freeze({
    name: "VNTECH ERP V5.3.0 MASTER BASELINE R1.1.1",
    packageId: "VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1",
    sourceMaster: "VNTECH_ERP_V5_3_0_MASTER_BASELINE_SOURCE",
    build: "5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908",
    uiContractId: "VNTECH-UI-V5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908",
    uiBuildMarker: "VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1_RUNTIME",
    functionalUiMarker: "VNTECH_FULL_W2_FUNCTIONAL_UI_CONTRACT",
    regressionContract: "VNTECH_V5_3_0_MASTER_BASELINE_R1_1_1_20260908",
    uiGeneration: "VNTECH-MASTER-BASELINE-R1.1.1-UI-V5.3.0",
    migrationHead: "0327_phase_gd_moc107_fab_khong_che_bang_identity.sql",
    releaseFingerprint: "f7d72d3439a8947ff062690e0e15ab9d329a883bb82a3f5a49af0dc517558d49",
  }),
  trust: Object.freeze({
    mode: "development",
    enforcementEnabled: false,
    keyId: "VNTECH-ROOT-ED25519-2026-01",
    algorithm: "Ed25519",
    publicKeyPem: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEASRFTGZhWNR/MdNgOF/dikIPzBCmxmmlO5v9TTcYoJdI=\n-----END PUBLIC KEY-----",
    hardwareBindingMode: "foundation",
    nativeVerifierMode: "foundation",
    onlineAttestationEnabled: false,
    privateKeyPresent: false,
  }),
});
