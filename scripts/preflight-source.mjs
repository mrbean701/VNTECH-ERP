import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readReleaseIdentity } from "./release-identity.mjs";
import { VNTECH_IDENTITY_DATA } from "../lib/vntech-identity-data.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const identity = readReleaseIdentity();
const required = [
  "app/layout.tsx",
  "app/page.tsx",
  "app/api/system/route.ts",
  "db/schema.ts",
  "lib/admin-bulk-import.ts",
  "lib/material-matching-v2.mjs",
  "lib/vntech-identity-data.mjs",
  "lib/trust/canonical-json.mjs",
  "lib/trust/fingerprint.mjs",
  "lib/trust/license-schema.mjs",
  "lib/trust/license-verifier.mjs",
  "scripts/system-route.mjs",
  "scripts/trust-startup.mjs",
  "scripts/universal-runtime.mjs",
  "scripts/universal-server.mjs",
  "scripts/universal-installer.mjs",
  "scripts/upgrade-preserve-data.mjs",
  "scripts/verify-full-release.mjs",
  "drizzle/0043_vntech_trust_lock_foundation.sql",
  "drizzle/0044_w2_admin_import_role_org.sql",
  "drizzle/0045_patch01_runtime_admin_boq_hardening.sql",
  "drizzle/0046_patch01_account_recovery_project_offline_archive.sql",
  "drizzle/0047_patch02_single_owner_approval.sql",
  "drizzle/0048_master_baseline_identity_refresh.sql",
  "drizzle/0049_master_baseline_identity_refresh_r1_1_1.sql",
  "tools/vntech-license-generator/generate-license.mjs",
  "native-verifier/protocol-v1.json",
  "tests/w2-admin-import-role-org.test.mjs",
  "tests/runtime-admin-boq-regression.test.mjs",
  "tests/mobile-menu-interaction.test.mjs",
  "tests/trust-lock-foundation.test.mjs",
  "tests/security-regression.test.mjs",
  "deploy/docker-compose.yml",
  "Dockerfile",
  "public/vntech-header-city-light.webp",
  "public/vntech-header-city-dark.webp",
  "public/vntech-login-r1-left.png",
  "public/vntech-logo.png",
  "VNTECH_PACKAGE_ID.txt",
  "VNTECH_PRODUCT_IDENTITY.txt",
  "VNTECH_FULL_W2_ID.txt",
];
for (const relative of required) {
  const path = join(root, relative);
  if (!existsSync(path)) throw new Error(`FULL W2 thiếu tệp bắt buộc: ${relative}`);
}

function source(relative) {
  return readFileSync(join(root, relative), "utf8");
}

function requireMarkers(relative, markers) {
  const text = source(relative);
  for (const marker of markers) {
    if (!text.includes(marker)) throw new Error(`${relative} thiếu contract: ${marker}`);
  }
  return text;
}

requireMarkers("app/page.tsx", [
  "mapUserBulkSheet",
  "mapProjectBulkSheet",
  "OrganizationUnitManager",
  "TrustLockAdmin",
  "withBoqGroupContext",
  "Dòng tiêu đề/ĐVT trống không tham gia Material Matching.",
  "VNTECH_BOQ_HEADING_MATCHING_EXCLUSION_V1",
  "VNTECH_FULL_W2_LOGIN_UI",
  "VNTECH_FULL_W2_MOBILE_NAV",
  "VNTECH_FULL_MOBILE_NAV_INTERACTION",
  "data-mobile-nav-contract=\"VNTECH_MOBILE_NAV_20260907\"",
  "vntech-full-ui",
  "vntech-app-header",
  "vntech-app-sidebar",
  "auth-full-city-login",
  "auth-login-master-art",
  "topbar-city-art",
  "Đăng nhập hệ thống",
  "Chào mừng bạn quay trở lại!",
  "VNTECH_BRAND.release.uiContractId",
]);
const finalPageSource = source("app/page.tsx");
for (const marker of ["vntech-erp-ui-v4:appearance:", "theme-switch", 'value=>value==="dark"?"light":"dark"', "root.dataset.theme=appearance"]) {
  if (!finalPageSource.includes(marker)) throw new Error(`app/page.tsx thiếu giao diện Sáng/Tối hai trạng thái: ${marker}`);
}
for (const forbidden of ['"light"|"dark"|"system"', 'appearance==="system"', "matchMedia(\"(prefers-color-scheme: dark)\")", "◐ TỰ ĐỘNG"]) {
  if (finalPageSource.includes(forbidden)) throw new Error(`app/page.tsx còn trạng thái giao diện cũ đã bị thay thế: ${forbidden}`);
}
if (finalPageSource.includes('className="topbar-brand vntech-brand-ribbon"')) throw new Error("Header desktop còn brand panel cũ đã bị thay thế.");
if (!finalPageSource.includes('sidebar-collapse-toggle') || !finalPageSource.includes('</button></nav><div className="server-status"')) throw new Error("Nút thu/phóng Sidebar phải nằm trong tree-nav ngay trước trạng thái máy chủ.");
if (!finalPageSource.includes('{ key: "production", label: "Sản lượng", icon: "SL", groupKey: "project_management" }')) throw new Error("Module Sản lượng chưa được nối vào menu Quản lý dự án.");
if (!finalPageSource.includes('{ groupKey: "site_command", name: "QUẢN LÝ DỰ ÁN", icon: "DA", sortOrder: 25')) throw new Error("Navigation hợp nhất Project → BCH chưa đổi nhóm site_command thành QUẢN LÝ DỰ ÁN.");
if (finalPageSource.includes('{ groupKey: "project_management", name: "QUẢN LÝ DỰ ÁN"')) throw new Error("Navigation vẫn còn nhóm QUẢN LÝ DỰ ÁN cũ bị trùng.");
for (const marker of ["PROJECT_WORKSPACE_ITEMS", "1. Tổng quan & Nhân sự dự án", "2. Kế hoạch & Tiến độ thi công", "3. Đề xuất & Nhu cầu dự án", "4. Nhật ký & Điều hành hiện trường", "5. Sản lượng & Nghiệm thu chất lượng", "6. Thầu phụ & Nhân công", "7. Phát sinh (V.O) & BOQ/HĐ", "8. Tài chính & Thanh quyết toán", "project-context-lock", "activateProjectModule"]) {
  if (!finalPageSource.includes(marker)) throw new Error(`Navigation Project workspace thiếu marker: ${marker}`);
}
if (!finalPageSource.includes('{ key: "requests", label: "Phiếu đề nghị mua hàng", icon: "ĐN", groupKey: "purchasing" }')) throw new Error("Phiếu đề nghị mua hàng đã bị chuyển khỏi module Mua hàng; yêu cầu chỉ alias navigation, không đổi ownership module.");
if (!/DEVELOPMENT_MODULES[\s\S]*?"material_norms"/.test(finalPageSource)) throw new Error("material_norms chưa được đánh dấu ĐANG PHÁT TRIỂN nhất quán.");
if ((finalPageSource.match(/dept_project_asbuilt:\s*\[/g) || []).length !== 1) throw new Error("Danh mục tiêu đề còn khóa dept_project_asbuilt trùng lặp.");

const uiAssets = {
  "public/vntech-header-city-light.webp": 150000,
  "public/vntech-header-city-dark.webp": 150000,
  "public/vntech-login-r1-left.png": 500000,
};
for (const [relative, minimum] of Object.entries(uiAssets)) {
  const bytes = statSync(join(root, relative)).size;
  if (bytes < minimum) throw new Error(`Asset UI ${relative} chưa đủ độ nét (${bytes} < ${minimum} bytes).`);
}
function pngDimensions(relative) {
  const buffer = readFileSync(join(root, relative));
  if (buffer.length < 24 || buffer.toString("ascii", 1, 4) !== "PNG") throw new Error(`${relative} không phải PNG hợp lệ.`);
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}
const logoDimensions = pngDimensions("public/vntech-logo.png");
if (logoDimensions.width < 1000 || logoDimensions.height < 200) throw new Error(`Logo VNTECH chưa đủ độ phân giải (${logoDimensions.width}x${logoDimensions.height}).`);
const loginDimensions = pngDimensions("public/vntech-login-r1-left.png");
if (loginDimensions.width < 900 || loginDimensions.height < 900) throw new Error(`Desktop Login master chưa đủ độ phân giải (${loginDimensions.width}x${loginDimensions.height}).`);

const finalCss = requireMarkers("app/globals.css", [
  "VNTECH_MASTER_BASELINE_CSS_R1_1_1_BEGIN",
  ".app-shell.vntech-full-ui",
  "vntech-app-header",
  "vntech-app-sidebar",
  "auth-full-city-login",
  "topbar-city-art",
  "auth-city-art",
  "auth-login-master-art",
  "text-rendering:optimizeLegibility",
  "@media (min-width:901px)",
  "position:sticky",
  "bottom:8px",
  "z-index:120",
  'content:url("/vntech-logo.png")',
  "requests-screen .screen-actions",
]);
for (const obsolete of ["/vntech-mobile-header-ribbon.svg", "/vntech-mobile-menu-ribbon.svg", "/vntech-mobile-login-ribbon.svg", "/vntech-header-ribbon.svg", "/vntech-login-wave.svg", "VNTECH_PATCH", "VNTECH_P1_", "VNTECH_FINAL_UI_R9", "vntech-final-header-r9", "vntech-final-sidebar-r9"]) {
  if (finalCss.includes(obsolete) || finalPageSource.includes(obsolete)) throw new Error(`Runtime UI còn contract/artwork cũ đã bị thay thế: ${obsolete}`);
}
for (const relative of ["public/vntech-mobile-header-ribbon.svg", "public/vntech-mobile-menu-ribbon.svg", "public/vntech-mobile-login-ribbon.svg", "public/vntech-header-ribbon.svg", "public/vntech-login-wave.svg", "public/vntech-logo-reference.png", "public/vntech-logo-white.png"]) {
  if (existsSync(join(root, relative))) throw new Error(`FULL source còn asset superseded/không sử dụng: ${relative}`);
}
requireMarkers("lib/admin-bulk-import.ts", [
  "USER_BULK_HEADERS",
  "PROJECT_BULK_HEADERS",
  "Dòng ${rowNo} · Cột",
  "existingUsernames",
  "organizationCodes",
]);
requireMarkers("scripts/system-route.mjs", [
  "bulk_import_projects",
  "bulk_import_users",
  "save_organization_unit",
  "set_organization_unit_status",
  "organizationUnits",
  "Bản W2 đang khóa ở Development Mode",
  "row_role IN ('material','component')",
  "install_license_foundation",
  "bulk_material_subcategory_action",
  "clear_boq_version",
  "materialCandidateGate",
  "trim(COALESCE(unit,''))<>''",
]);
requireMarkers("lib/material-matching-v2.mjs", ["exactMatch", "finalMatchScore", "return 1"]);
requireMarkers("scripts/trust-startup.mjs", ["inspectStartupTrust", "startupTrustDecision"]);
requireMarkers("drizzle/0043_vntech_trust_lock_foundation.sql", ["vntech_trust_settings", "vntech_license_installations", "vntech_release_signatures", "vntech_attestation_events", "vntech_license_transfer_requests"]);
requireMarkers("drizzle/0044_w2_admin_import_role_org.sql", ["organization_units", "organization_unit_id", "VNTECH-FULL-W2-UI-V5.3.0"]);
requireMarkers("drizzle/0045_patch01_runtime_admin_boq_hardening.sql", ["business_scope_catalog", "ORG-BGD", "ORG-HCPC", "boq_change_history", "DNHE"]);
requireMarkers("drizzle/0046_patch01_account_recovery_project_offline_archive.sql", ["must_change_password", "project_archives", "purge_audit_id"]);
requireMarkers("drizzle/0047_patch02_single_owner_approval.sql", ["approval_project_assignments", "owner_user_id", "UNIQUE(project_id, stage)"]);
requireMarkers("drizzle/0048_master_baseline_identity_refresh.sql", ["MASTER BASELINE CLEANUP R1.1", "UPDATE vntech_product_identity", "UPDATE vntech_trust_settings"]);
requireMarkers("drizzle/0049_master_baseline_identity_refresh_r1_1_1.sql", ["MASTER BASELINE CLEANUP R1.1.1", "UPDATE vntech_product_identity", "UPDATE vntech_trust_settings"]);
requireMarkers("app/api/files/route.ts", ["VNTECH_PROJECT_OFFLINE_ARCHIVE_V1", "MANIFEST.json", "project_archives", "export async function DELETE"]);
if (existsSync(join(root, "scripts/files-route.mjs"))) throw new Error("Không được phục hồi scripts/files-route.mjs: /api/files phải dùng app/api/files/route.ts làm SSOT.");

const forbiddenLoginDescription = "Hệ thống quản trị phòng ban, dự án, mua hàng, kho vật tư, phê duyệt và điều hành doanh nghiệp";
if (source("app/page.tsx").includes(forbiddenLoginDescription)) {
  throw new Error("Login FULL W2 còn render/giữ dòng mô tả đã bị loại bỏ.");
}

const apiRoute = source("app/api/system/route.ts");
if (!apiRoute.includes("../../../scripts/system-route.mjs")) throw new Error("API phải delegate về một backend SSOT.");
for (const removed of ["app/components/FinalBOQWorkspace.jsx", "app/components/FinalBOQGroups.jsx"]) {
  if (existsSync(join(root, removed))) throw new Error(`Còn UI enhancer chắp vá đã bị thay thế: ${removed}`);
}

if (VNTECH_IDENTITY_DATA.release.packageId !== identity.PACKAGE || VNTECH_IDENTITY_DATA.release.build !== identity.BUILD) {
  throw new Error("Brand/release SSOT không đồng nhất với package identity.");
}
if (VNTECH_IDENTITY_DATA.trust.mode !== "development" || VNTECH_IDENTITY_DATA.trust.enforcementEnabled || VNTECH_IDENTITY_DATA.trust.onlineAttestationEnabled) {
  throw new Error("Trust Lock W2 không còn đúng Development Mode / Enforcement Disabled.");
}

const privateKeyPattern = /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/;
const forbiddenKeyExtension = /\.(?:key|p12|pfx|jks|keystore)$/i;
// `.local-data` là thư mục DỮ LIỆU RUNTIME do CHÍNH ỨNG DỤNG tạo khi chạy cục bộ, và ĐÃ bị gitignore
// (`.gitignore:43` = `/.local-data/`; `git ls-files .local-data` trả về RỖNG ⇒ không tệp nào thuộc
// kho mã). Ứng dụng tự sinh `.local-data/email-secret.key` để mã hoá cấu hình email.
//
// Bỏ qua thư mục này là BẮT BUỘC: nếu không, bước tiền kiểm nguồn CHẶN CỨNG `npm run build`
// (đã xảy ra thật — xem docs/agent-progress/TASK-033.md), khiến giao diện KHÔNG BAO GIỜ được dựng lại
// và mọi phép kiểm UI đều chạy trên bundle cũ. Bộ quét vẫn giữ nguyên mục đích: không có khoá bí mật
// trong MÃ NGUỒN. Xoá tệp runtime cũng không phải giải pháp vì ứng dụng sẽ tạo lại ngay lần chạy sau.
const ignoredDirectories = new Set(["node_modules", "dist", ".next", ".wrangler", ".sites-runtime", ".local-data"]);
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile()) {
      if (forbiddenKeyExtension.test(entry.name)) throw new Error(`Phát hiện file khóa bí mật: ${path}`);
      if ([".mjs", ".js", ".ts", ".tsx", ".json", ".md", ".txt", ".sql", ".yml", ".yaml", ".env", ".example", ".bat", ".ps1", ".sh"].includes(extname(entry.name))) {
        if (privateKeyPattern.test(readFileSync(path, "utf8"))) throw new Error(`Phát hiện PEM private key: ${path}`);
      }
    }
  }
}
walk(root);

for (const relative of ["Dockerfile", "deploy/docker-compose.yml"]) {
  const text = source(relative);
  if (!text.includes(identity.BUILD) || !text.includes(identity.PACKAGE) || !text.includes(identity.UI_CONTRACT)) {
    throw new Error(`${relative} chưa đồng bộ định danh FULL W2.`);
  }
}
for (const relative of ["scripts/universal-installer.mjs", "scripts/upgrade-preserve-data.mjs"]) {
  const text = source(relative);
  for (const marker of ["VNTECH_IDENTITY", "release.build", "release.packageId", "release.uiContractId"]) {
    if (!text.includes(marker)) throw new Error(`${relative} chưa dùng release identity SSOT: ${marker}`);
  }
}

const packageJson = JSON.parse(source("package.json"));
if (packageJson.version !== VNTECH_IDENTITY_DATA.version) throw new Error("package.json phải là bản ổn định 5.3.0.");
if (!statSync(join(root, "public/vntech-logo.png")).isFile()) throw new Error("Thiếu logo SSOT.");
console.log(`FULL W2 SOURCE PREFLIGHT: ĐẠT · ${identity.BUILD} · Trust Development Mode`);
