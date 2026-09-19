/**
 * Single source of truth for VNTECH brand, release and public trust identity.
 * This module intentionally contains public verification material only.
 */
export const VNTECH_BRAND_MANIFEST = Object.freeze({
  legalOwner: "CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH)",
  logoPath: "/vntech-logo.png",
  productId: "VNTECH-KHO-MEP-001",
  productName: "VNTECH ERP",
  sourceFingerprint: "9be55494872d16880b447f0715247b6d1657cf533620b304be5cdf14ed406236",
});

export const VNTECH_IDENTITY_DATA = Object.freeze({
  ...VNTECH_BRAND_MANIFEST,
  shortOwner: "VNTECH",
  productDescription: "Quản trị & Điều hành – Nền tảng quản trị tổng thể nội bộ VNTECH",
  version: "5.3.0",
  sourceFingerprintShort: "VNTECH-FP-9BE55494872D1688",
  brandFingerprint: "22086068a7ddd2c3763b423d2985f2eb11f7b908e89f91a00fdfc33cd86830ad",
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
    migrationHead: "0158_phase_gd_phase_3_t_05_07_identity.sql",
    releaseFingerprint: "94e90eec992919c2459ca033637bba20dd352e42be6b138c2eb021d7fc5eec2f",
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
