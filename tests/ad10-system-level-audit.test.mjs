// PHASE 7 (`AD-10`) — HỢP ĐỒNG AUDIT + SỬA UI: MÀN «CẤP BẬC» (không thiết kế lại).
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-10`: «Audit + sửa UI nếu cần + **kiểm thử kỹ**
// (không thiết kế lại)».
//
// PHÁT HIỆN THẬT khi audit (đo được, không đoán): nút «Xóa» cấp bậc gọi thẳng `delete_system_level`
// KHÔNG có bước xác nhận và KHÔNG chặn cấp bậc đang được gán cho tài khoản ⇒ một cú bấm làm mất cấp bậc
// đang dùng. Đây là sửa UI tối thiểu, KHÔNG thiết kế lại màn.
//
// Bằng chứng backend (không bịa tên action): `SystemController.java` case `delete_system_level`,
// `ActionRbacRegistry.java:127` (module list rỗng = admin) + dòng 316 (`canUse`).
//
// Chạy riêng:  node --test tests/ad10-system-level-audit.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const page = read("app/page.tsx");
const DOC = "docs/agent-progress/AD-10-CAP-BAC-AUDIT.md";
const javaController = read("java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");
const javaRbac = read("java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");

function levelBlock() {
  const start = page.indexOf("function SystemLevelManager(");
  const end = page.indexOf("/** Tab \"Audit log\"", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `SystemLevelManager` trong app/page.tsx");
  return page.slice(start, end);
}

test("AD-10 — SỬA UI THẬT: nút xoá cấp bậc phải XÁC NHẬN và CHẶN cấp bậc đang được dùng", () => {
  const block = levelBlock();
  assert.match(block, /window\.confirm\(/, "Xoá cấp bậc phải có bước XÁC NHẬN (trước đây gọi thẳng API)");
  assert.match(block, /usersOfLevel\(String\(l\.code\)\)\.length/,
    "Phải đếm số tài khoản đang giữ cấp bậc để chặn/ cảnh báo");
  assert.match(block, /disabled=\{/, "Nút xoá phải bị VÔ HIỆU khi cấp bậc đang được dùng");
  assert.match(block, /delete_system_level/, "Vẫn dùng action ĐÃ CÓ `delete_system_level` (không thêm action mới)");
  // Đối chứng âm: bỏ confirm ⇒ hỏng.
  const gate = (text) => /window\.confirm\(/.test(text) && /disabled=\{/.test(text);
  assert.equal(gate(block), true);
  assert.equal(gate(block.replace(/window\.confirm\(/g, "void (")), false, "[đối chứng âm] bỏ xác nhận ⇒ cổng phải HỎNG");
});

test("AD-10 — KHÔNG thiết kế lại: giữ nguyên bảng thang cấp bậc + 4 chỉ số KPI gốc", () => {
  const block = levelBlock();
  for (const label of ["Cấp bậc đang dùng", "Tài khoản chưa xếp cấp bậc", "Cấp bậc tự động toàn quyền"]) {
    assert.ok(block.includes(label), `Không được bỏ chỉ số KPI gốc «${label}»`);
  }
  assert.match(block, /<th>Hạng<\/th><th>Mã<\/th><th>Tên cấp bậc<\/th>/, "Bảng thang cấp bậc phải giữ nguyên cột gốc");
  assert.match(block, /Thang cấp bậc hệ thống/, "Tiêu đề khối gốc phải còn");
});

test("AD-10 — BẰNG CHỨNG action xoá tồn tại ở cả 2 tầng (không bịa)", () => {
  assert.match(javaController, /case "delete_system_level"/, "`SystemController` phải có case `delete_system_level`");
  assert.match(javaRbac, /Map\.entry\("delete_system_level", List\.of\(\)\)/, "Phải có trong bảng RBAC (admin)");
  assert.match(javaRbac, /Map\.entry\("delete_system_level", "canUse"\)/, "Phải khai capability `canUse`");
});

test("AD-10 — TÀI LIỆU audit: verdict + bằng chứng + phạm vi sửa tối thiểu", () => {
  assert.ok(existsSync(new URL(DOC, root)), `Thiếu tài liệu audit bắt buộc ${DOC}`);
  const text = readFileSync(new URL(DOC, root), "utf8");
  assert.match(text, /CONFIRMED|LIKELY|UNKNOWN/, "Phải có kết luận phân loại");
  assert.match(text, /delete_system_level/, "Phải nêu bằng chứng action");
  assert.match(text, /(app\/page\.tsx|java-backend)[\w./:-]*/, "Phải trích dẫn tệp/dòng bằng chứng");
  assert.match(text, /không thiết kế lại|giữ nguyên/i, "Phải ghi rõ phạm vi: không thiết kế lại");
  assert.match(text, /window\.confirm/, "Phải ghi lại bản vá đã áp dụng");
});
