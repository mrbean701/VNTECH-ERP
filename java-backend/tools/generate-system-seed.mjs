#!/usr/bin/env node
/**
 * VNTECH ERP — Sinh file seed hệ thống cho Flyway: V2__system_seed.sql
 *
 * VÌ SAO CẦN: V1__baseline.sql chỉ tạo schema (114 bảng) nhưng KHÔNG có dữ liệu
 * hệ thống bắt buộc. Thiếu seed thì các luồng lõi chết ngay:
 *   - approval_stage_catalog rỗng → create_request báo
 *     "Chưa cấu hình bước phê duyệt đang hoạt động. Quản trị viên cần tạo ít nhất 1 bước."
 *     (phát hiện 14/09/2026 qua smoke test trên MySQL thật)
 *
 * Nguồn chuẩn (port từ JS, KHÔNG sửa file JS):
 *   - drizzle/0009_configurable_roles_approval_stages.sql  (3 bậc đầu)
 *   - drizzle/0029_v530_erp_permissions_workflow.sql       (mở rộng 5 bậc + đổi tên)
 *
 * Chạy: node java-backend/tools/generate-system-seed.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, "../infrastructure/src/main/resources/db/migration");
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, "V2__system_seed.sql");

/** 5 bậc phê duyệt CHUẨN của VNTECH (theo drizzle/0029 — trạng thái hiệu lực cuối). */
const APPROVAL_STAGES = [
  { id: "ASTAGE-1", stageNo: 1, name: "CHT xác nhận nhu cầu", desc: "Kỹ sư dự án lập phiếu; CHT xác nhận nhu cầu dự án", roles: "commander,cht", mode: "single", sla: 12, auto: 0, sort: 10 },
  { id: "ASTAGE-2", stageNo: 2, name: "Thư ký Tổng giám đốc duyệt", desc: "Duyệt đầu tiên sau CHT trước khi chuyển Phòng Dự án", roles: "thuky", mode: "single", sla: 12, auto: 0, sort: 20 },
  { id: "ASTAGE-3", stageNo: 3, name: "Phòng Dự án kiểm tra khối lượng", desc: "Nhân viên chuyên quản kiểm tra khối lượng/BOQ", roles: "project,da_nv", mode: "single", sla: 24, auto: 0, sort: 30 },
  { id: "ASTAGE-4", stageNo: 4, name: "Phòng Kế hoạch tiếp nhận", desc: "Nhân viên Kế hoạch tiếp nhận và chuẩn bị mua hàng", roles: "procurement,kh_nv", mode: "single", sla: 24, auto: 0, sort: 40 },
  { id: "ASTAGE-5", stageNo: 5, name: "Trưởng phòng Dự án + Kế hoạch xác nhận cuối", desc: "Bắt buộc đủ cả hai vai trò xác nhận trước khi được lập PO", roles: "da_truong,kh_truong", mode: "all_roles", sla: 12, auto: 0, sort: 50 },
];

/** Vai trò nền (engine roles) — cần trước khi gán vào bước duyệt. */
const ENGINE_ROLES = [
  { id: "ROLE-engineer", code: "engineer", name: "Kỹ sư", desc: "Lập phiếu đề nghị/nghiệm thu", base: "engineer", sort: 10 },
  { id: "ROLE-commander", code: "commander", name: "Chỉ huy trưởng", desc: "Duyệt cấp BCH", base: "commander", sort: 20 },
  { id: "ROLE-project", code: "project", name: "Phòng Dự án", desc: "Kiểm soát khối lượng/BOQ", base: "project", sort: 30 },
  { id: "ROLE-procurement", code: "procurement", name: "Phòng Kế hoạch", desc: "Mua hàng, nhà cung cấp", base: "procurement", sort: 40 },
  { id: "ROLE-accountant", code: "accountant", name: "Tài chính Kế toán", desc: "Thanh toán, công nợ", base: "accountant", sort: 50 },
  { id: "ROLE-warehouse", code: "warehouse", name: "Thủ kho", desc: "Nhập xuất và kiểm soát kho", base: "warehouse", sort: 60 },
  { id: "ROLE-team", code: "team", name: "Tổ đội", desc: "Nhận, sử dụng và hoàn trả vật tư", base: "team", sort: 70 },
  { id: "ROLE-director", code: "director", name: "Ban giám đốc", desc: "Theo dõi và phê duyệt theo phân quyền", base: "director", sort: 80 },
];

const esc = (s) => String(s).replace(/'/g, "''");

const out = [];
out.push("-- ============================================================");
out.push("-- VNTECH ERP — V2__system_seed.sql (MySQL 8.4 / 8.0, utf8mb4)");
out.push("-- Sinh tự động từ nguồn JS (drizzle/0009 + drizzle/0029)");
out.push("-- Đừng sửa tay: chạy java-backend/tools/generate-system-seed.mjs");
out.push("--");
out.push("-- Mục đích: nạp dữ liệu hệ thống BẮT BUỘC mà V1__baseline (schema-only) không có.");
out.push("--   * approval_stage_catalog — 5 bậc phê duyệt; thiếu thì create_request lỗi");
out.push("--     \"Chưa cấu hình bước phê duyệt đang hoạt động\" (phát hiện 14/09/2026).");
out.push("--   * role_catalog — vai trò nền để gán vào bước duyệt.");
out.push("-- ============================================================");
out.push("");
out.push("SET NAMES utf8mb4;");
out.push("");

// ---- role_catalog ----
out.push("-- Vai trò nền (engine roles)");
out.push("INSERT IGNORE INTO `role_catalog` (`id`,`code`,`name`,`description`,`base_role`,`active`,`sort_order`,`system_locked`,`created_at`,`updated_at`) VALUES");
out.push(
  ENGINE_ROLES.map(
    (r) =>
      `('${esc(r.id)}','${esc(r.code)}','${esc(r.name)}','${esc(r.desc)}','${esc(r.base)}',1,${r.sort},1,CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3))`,
  ).join(",\n") + ";",
);
out.push("");

// ---- approval_stage_catalog ----
out.push("-- 5 bậc phê duyệt chuẩn (stage 1..5; bước tùy chỉnh phải ≥100)");
out.push("INSERT IGNORE INTO `approval_stage_catalog` (`id`,`stage_no`,`name`,`description`,`allowed_role_codes`,`approval_mode`,`sla_hours`,`auto_approve_on_submit`,`active`,`sort_order`,`created_at`,`updated_at`) VALUES");
out.push(
  APPROVAL_STAGES.map(
    (s) =>
      `('${esc(s.id)}',${s.stageNo},'${esc(s.name)}','${esc(s.desc)}','${esc(s.roles)}','${esc(s.mode)}',${s.sla},${s.auto},1,${s.sort},CURRENT_TIMESTAMP(3),CURRENT_TIMESTAMP(3))`,
  ).join(",\n") + ";",
);
out.push("");
out.push("-- Tắt các bậc ngoài phạm vi 5 bậc chuẩn (đồng bộ drizzle/0029)");
out.push("UPDATE `approval_stage_catalog` SET `active`=0, `updated_at`=CURRENT_TIMESTAMP(3) WHERE `stage_no`>5;");
out.push("");

writeFileSync(outPath, out.join("\n"));
console.log(`System seed: ${ENGINE_ROLES.length} vai trò + ${APPROVAL_STAGES.length} bậc duyệt -> ${outPath}`);
console.log(`  (${out.length} dòng SQL)`);
