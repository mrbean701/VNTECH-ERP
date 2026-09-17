/**
 * Single source of truth for VNTECH brand, release and public trust identity.
 * This module intentionally contains public verification material only.
 */
export const VNTECH_BRAND_MANIFEST = Object.freeze({
  legalOwner: "CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH)",
  logoPath: "/vntech-logo.png",
  productId: "VNTECH-KHO-MEP-001",
  productName: "VNTECH ERP",
  sourceFingerprint: "6a346e9989229d07daae18a33901df10c164d80fc7b001484a7387d3affd04ba",
});

export const VNTECH_IDENTITY_DATA = Object.freeze({
  ...VNTECH_BRAND_MANIFEST,
  shortOwner: "VNTECH",
  productDescription: "Quản trị & Điều hành – Nền tảng quản trị tổng thể nội bộ VNTECH",
  version: "5.3.0",
  sourceFingerprintShort: "VNTECH-FP-6A346E9989229D07",
  brandFingerprint: "56ef2838b33ed3d29760835344c802ef6a3642b2725b6155a677e7c565b158ef",
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
    migrationHead: "0105_phase1_u09_admin_toolbar_identity.sql",
    releaseFingerprint: "3d1c2cc7c66b1573bfa18350364233f7c909356bf269dbcb8311b55f7e12264f",
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
