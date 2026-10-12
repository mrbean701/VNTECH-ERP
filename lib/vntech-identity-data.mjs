/**
 * Single source of truth for VNTECH brand, release and public trust identity.
 * This module intentionally contains public verification material only.
 */
export const VNTECH_BRAND_MANIFEST = Object.freeze({
  legalOwner: "CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH)",
  logoPath: "/vntech-logo.png",
  productId: "VNTECH-KHO-MEP-001",
  productName: "VNTECH ERP",
  sourceFingerprint: "c8ad30e2ecc29bcf47fa4e869da9cc431959fd7c5493712aa727a5054d34d1da",
});

export const VNTECH_IDENTITY_DATA = Object.freeze({
  ...VNTECH_BRAND_MANIFEST,
  shortOwner: "VNTECH",
  productDescription: "Quản trị & Điều hành – Nền tảng quản trị tổng thể nội bộ VNTECH",
  version: "5.3.0",
  sourceFingerprintShort: "VNTECH-FP-C8AD30E2ECC29BCF",
  brandFingerprint: "405e1ee51a105b0f1921bd0de69e907e1a317d5ab8fb0feb46fce6fee32d35c9",
  copyright: "© 2026 CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH). All rights reserved.",
  company: Object.freeze({
    tenantId: "VNTECH-HQ",
    companyCode: "VNTECH",
    displayName: "CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT",
  }),
  release: Object.freeze({
    // ⭐ USER CHỐT 09/10/2026 (phương án **d**): đổi NHÃN PHIÊN BẢN SẢN PHẨM sang **ALPHA TEST**
    //    cho khớp bộ tài liệu `DOC-ALPHA-TEST-2026.10` (80 tệp đã gắn nhãn) ✓
    // ⚠️ GIỮ NGUYÊN `packageId` (21 nơi dùng làm ĐỊNH DANH KỸ THUẬT/đường dẫn) và các **dấu hợp đồng**
    //    (`uiBuildMarker` · `functionalUiMarker` · `regressionContract` — mỗi cái 3 nơi đọc, là hợp đồng
    //    của cổng `verify-ui-build-applied`) ⇒ ⛔ KHÔNG đổi để ⛔ không phá cổng ✓
    name: "VNTECH ERP V5.3.0 ALPHA TEST 2026.10",
    packageId: "VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1",
    sourceMaster: "VNTECH_ERP_V5_3_0_MASTER_BASELINE_SOURCE",
    build: "5.3.0-ALPHA-TEST-2026.10",
    uiContractId: "VNTECH-UI-V5.3.0-ALPHA-TEST-2026.10",
    uiBuildMarker: "VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1_RUNTIME",
    functionalUiMarker: "VNTECH_FULL_W2_FUNCTIONAL_UI_CONTRACT",
    regressionContract: "VNTECH_V5_3_0_MASTER_BASELINE_R1_1_1_20260908",
    uiGeneration: "VNTECH-ALPHA-TEST-2026.10-UI-V5.3.0",
    migrationHead: "0352_phase_gd_workcenter_7_viec_cong_viec_user_08_10_2_identity.sql",
    releaseFingerprint: "1f7ebad29e8428cd5df00794371d810c559b368884562133a6f266eb7c51f5a3",
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
