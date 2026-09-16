// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
import type { Metadata } from "next";
// Tầng TOKEN THIẾT KẾ (GĐ1) — PHẢI nạp ĐẦU TIÊN.
// Một nguồn sự thật duy nhất cho màu sắc, cỡ chữ, khoảng cách, bo góc, đổ bóng,
// lớp xếp chồng và điểm ngắt responsive. Xem app/styles/tokens.css.
import "./styles/tokens.css";
import "./globals.css";
// Tầng chuẩn hoá giao diện — PHẢI nạp SAU globals.css để thắng khi cùng độ ưu tiên.
// Xem app/styles/canonical.css (GĐ1: thanh cuộn, sàn cỡ chữ, nhịp dọc, responsive).
import "./styles/canonical.css";
// Sàn cỡ chữ — FILE SINH TỰ ĐỘNG từ globals.css (node tools/gen-font-floor.mjs).
// Nạp SAU canonical.css vì dùng !important để thắng mọi khai báo 7–8.8px cũ.
import "./styles/font-floor.css";
import { VNTECH_BRAND } from "@/lib/vntech-brand";

export const metadata: Metadata = {
  title: `${VNTECH_BRAND.productName} – ${VNTECH_BRAND.productDescription}`,
  description: `Phần mềm thuộc sở hữu ${VNTECH_BRAND.legalOwner}. Quản lý yêu cầu, phê duyệt, mua hàng, giao nhận và tồn kho M&E.`,
  applicationName: VNTECH_BRAND.productName,
  authors: [{ name: VNTECH_BRAND.legalOwner }],
  creator: VNTECH_BRAND.legalOwner,
  publisher: VNTECH_BRAND.legalOwner,
  icons: { icon: "/vntech-icon.png", shortcut: "/vntech-icon.png", apple: "/vntech-icon.png" },
  other: {
    "codex-preview": "development",
    "vntech-product-id": VNTECH_BRAND.productId,
    "vntech-source-fingerprint": VNTECH_BRAND.sourceFingerprint,
    "vntech-owner": VNTECH_BRAND.legalOwner,
    "vntech-version": VNTECH_BRAND.version,
    "vntech-release-build": VNTECH_BRAND.release.build,
    "vntech-package-id": VNTECH_BRAND.release.packageId,
    "vntech-ui-contract": VNTECH_BRAND.release.uiContractId,
    "vntech-ui-generation": VNTECH_BRAND.release.uiGeneration,
    "vntech-trust-mode": VNTECH_BRAND.trust.mode,
    "vntech-license-enforcement": String(VNTECH_BRAND.trust.enforcementEnabled),
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
