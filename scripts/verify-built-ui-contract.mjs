import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VNTECH_IDENTITY_DATA } from "../lib/vntech-identity-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const runtime = process.argv.includes("--runtime");
const markerFile = join(dist, ".vntech-ui-contract");
const release = VNTECH_IDENTITY_DATA.release;
const requiredMarkers = [
  release.uiContractId,
  release.uiBuildMarker,
  release.functionalUiMarker,
  release.regressionContract,
  release.build,
  release.packageId,
  release.uiGeneration,
  VNTECH_IDENTITY_DATA.productId,
  "DANH SÁCH NHÂN SỰ",
  "Tóm tắt cá nhân",
  "VNTECH LICENSE & TRUST",
  "DISABLED – BY DESIGN",
  "Cơ cấu tổ chức canonical",
  "VNTECH_BOQ_HEADING_MATCHING_EXCLUSION_V1",
  "VNTECH_FULL_W2_LOGIN_UI",
  "VNTECH_FULL_W2_MOBILE_NAV",
  "VNTECH_FULL_MOBILE_NAV_INTERACTION",
  "VNTECH_MOBILE_NAV_20260907",
  "vntech-full-ui",
  "vntech-app-header",
  "vntech-app-sidebar",
  "auth-full-city-login",
  "NỀN TẢNG QUẢN TRỊ &",
  "Enterprise Resource Planning",
  "Đăng nhập hệ thống",
  "Chào mừng bạn quay trở lại!",
  "Sản lượng",
  "Định mức vật tư theo dự án",
  "/vntech-login-r1-left.png",
  "/vntech-header-city-light.webp",
  "/vntech-header-city-dark.webp",
  "LỊCH SỬ THAY ĐỔI ·",
  "XÓA VĨNH VIỄN VERSION",
  "Hệ thống sẽ dùng gói TOÀN BỘ DỮ LIỆU đã VERIFIED khi đóng dự án",
];

if (!existsSync(dist) || !statSync(dist).isDirectory()) throw new Error("Thiếu production dist để xác minh UI contract.");
const files = [];
function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const info = statSync(path);
    if (info.isDirectory()) walk(path);
    else if ([".js", ".mjs", ".html", ".css", ".json"].includes(extname(name))) files.push(path);
  }
}
walk(dist);
if (!files.length) throw new Error("Production dist không có artifact văn bản.");
const seen = new Map(requiredMarkers.map((marker) => [marker, false]));
for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const marker of requiredMarkers) if (!seen.get(marker) && text.includes(marker)) seen.set(marker, true);
}
const missing = [...seen].filter(([, found]) => !found).map(([marker]) => marker);
if (missing.length) throw new Error(`Production dist thiếu UI contract: ${missing.join(" | ")}`);

const forbiddenLoginDescription = "Hệ thống quản trị phòng ban, dự án, mua hàng, kho vật tư, phê duyệt và điều hành doanh nghiệp";
for (const file of files) {
  if (readFileSync(file, "utf8").includes(forbiddenLoginDescription)) {
    throw new Error(`Production dist còn dòng mô tả login đã bị loại bỏ: ${file}`);
  }
}

const artifactText = files.map((file) => readFileSync(file, "utf8")).join("\n");
const cssFiles = files.filter((file) => extname(file) === ".css");
const cssArtifactText = cssFiles.map((file) => readFileSync(file, "utf8")).join("\n");
const semanticChecks = [
  ["lưu trạng thái giao diện", artifactText.includes("vntech-erp-ui-v4:appearance:")],
  ["nút chuyển Sáng/Tối", artifactText.includes("theme-switch") && artifactText.includes("dataset.theme")],
  ["chỉ có hai trạng thái Sáng/Tối", !artifactText.includes("prefers-color-scheme") && !artifactText.includes("◐ TỰ ĐỘNG")],
  ["City Header", artifactText.includes("topbar-city-art") && artifactText.includes("/vntech-header-city-light.webp")],
  ["City Login", artifactText.includes("auth-city-art") && artifactText.includes("/vntech-login-r1-left.png")],
  ["logo VNTECH màu gốc", cssArtifactText.includes("content:url('/vntech-logo.png')") || cssArtifactText.includes('content:url("/vntech-logo.png")') || cssArtifactText.includes("content:url(/vntech-logo.png)")],
  ["header desktop từ 901px", cssArtifactText.includes("@media (min-width:901px)") || cssArtifactText.includes("@media (width>=901px)")],
  ["sidebar thu gọn nằm trong luồng", cssArtifactText.includes("position:sticky") && cssArtifactText.includes("bottom:8px")],
  ["mobile header grid", cssArtifactText.includes('grid-template-areas:"menu logo actions user"')],
  ["mobile action grid", cssArtifactText.includes("requests-screen .screen-actions") && cssArtifactText.includes("repeat(2,minmax(0,1fr))")],
  ["mobile menu lưu nhánh phòng ban", artifactText.includes("mobile-department-expanded")],
  ["mobile menu phân biệt mở nhánh/điều hướng", artifactText.includes("data-nav-action") && artifactText.includes("navigate")],
  ["mobile menu đánh dấu mục hiện tại", artifactText.includes("aria-current")],
];
const missingSemantics = semanticChecks.filter(([, ok]) => !ok).map(([name]) => name);
if (missingSemantics.length) throw new Error(`Production dist thiếu semantic FULL UI: ${missingSemantics.join(" | ")}`);
for (const obsolete of ["VNTECH_PATCH", "VNTECH_P1_", "VNTECH_FINAL_UI_R9", "vntech-final-header-r9", "vntech-final-sidebar-r9", "vntech-mobile-header-ribbon.svg", "vntech-mobile-menu-ribbon.svg", "vntech-mobile-login-ribbon.svg", "vntech-header-ribbon.svg", "vntech-login-wave.svg"]) {
  if (artifactText.includes(obsolete) || cssArtifactText.includes(obsolete)) throw new Error(`Production dist còn UI contract/artwork cũ: ${obsolete}`);
}

const payload = JSON.stringify({
  schema: "vntech-ui-contract/v1",
  packageId: release.packageId,
  build: release.build,
  uiContract: release.uiContractId,
  status: "VERIFIED_IN_PRODUCTION_DIST",
}, null, 2) + "\n";
if (runtime) {
  if (!existsSync(markerFile)) throw new Error("Runtime image thiếu dist/.vntech-ui-contract.");
  if (readFileSync(markerFile, "utf8") !== payload) throw new Error("Runtime UI marker không đúng artifact đã build.");
} else {
  writeFileSync(markerFile, payload, "utf8");
}
console.log(`BUILT UI CONTRACT: ĐẠT · ${release.uiContractId} · ${files.length} artifacts`);
