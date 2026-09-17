/**
 * Single source of truth for VNTECH brand, release and public trust identity.
 * This module intentionally contains public verification material only.
 */
export const VNTECH_BRAND_MANIFEST = Object.freeze({
  legalOwner: "CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH)",
  logoPath: "/vntech-logo.png",
  productId: "VNTECH-KHO-MEP-001",
  productName: "VNTECH ERP",
  sourceFingerprint: "aac82e62564ab037fefd570c71eaa56b4c53acc4bd0369248846c5fe7a802d8b",
});

export const VNTECH_IDENTITY_DATA = Object.freeze({
  ...VNTECH_BRAND_MANIFEST,
  shortOwner: "VNTECH",
  productDescription: "Quản trị & Điều hành – Nền tảng quản trị tổng thể nội bộ VNTECH",
  version: "5.3.0",
  sourceFingerprintShort: "VNTECH-FP-AAC82E62564AB037",
  brandFingerprint: "3fc2cbe4ae8406a95c19a38d18e8ea3730458111234a190cefc35d9dcbd06c86",
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
    migrationHead: "0127_phase1_ui_modal_dead_button_identity.sql",
    releaseFingerprint: "c775e2ba2b2a9ab5b3c464c8e6c590b6d5f782097bfbf16bbf7ebbe0403b05e3",
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
