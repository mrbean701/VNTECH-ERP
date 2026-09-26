// MT2-P6-05 (§4.4) — HỢP ĐỒNG: duyệt khi QUÁ HẠN SLA thì BẮT BUỘC nhập lý do (UI chặn trước + BACKEND là authority).
// Nguyên văn §4.4: «Nếu SLA quá hạn ⇒ VẪN CHO PHÉP DUYỆT, nhưng BẮT BUỘC nhập lý do quá hạn.
//                  ⛔ Không cho submit khi `SLA expired + Reason empty` ⇒ phải reject validation.»
// RED trước khi sửa: màn duyệt gọi `decide(...)` với `approvalComment` CÓ THỂ RỖNG dù đang quá hạn ⇒
// người dùng chỉ thấy lỗi 400 SAU khi bấm; ⛔ không có nhắc «Bắt buộc nhập lý do» và ⛔ không chặn nút.
// Chạy: node --import tsx --test tests/p6-05-overdue-reason-ui.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const java = readFileSync(new URL("../java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java", import.meta.url), "utf8");
const pane = page.slice(page.indexOf("approval-detail-pane"), page.indexOf("approval-meta-pane"));

test("P6-05 — UI có cổng QUÁ HẠN + lý do RỖNG (chặn trước, ⛔ không để bấm rồi mới báo lỗi)", () => {
  assert.ok(pane.length > 0, "phải tìm được khu vực PHIẾU ĐANG XỬ LÝ");
  // ⚠️ Cổng được tính MỘT LẦN ở đầu component `Approvals` (trước khối JSX) ⇒ phải kiểm trên CẢ TỆP,
  // rồi mới kiểm hệ quả của nó TRONG khu vực xử lý (nhắc + `disabled`).
  assert.match(page, /const overdueNeedsReason=timing\.late&&!approvalComment\.trim\(\);/,
    "phải có biến cổng: quá hạn VÀ lý do rỗng");
  assert.match(pane, /\{permitted&&overdueNeedsReason&&<p className="approval-overdue-hint">/,
    "cổng phải thật sự ĐIỀU KHIỂN giao diện trong khu vực xử lý");
});

test("P6-05 — nhắc ĐÚNG nguyên văn §4.4 và nút DUYỆT bị CHẶN khi thiếu lý do", () => {
  assert.match(pane, /QUÁ HẠN SLA[\s\S]{0,120}Bắt buộc nhập lý do/,
    "phải hiện nhắc «… QUÁ HẠN SLA … Bắt buộc nhập lý do …»");
  assert.match(pane, /<button[^>]*className="primary"[^>]*disabled=\{/,
    "nút DUYỆT phải có `disabled` theo cổng quá hạn");
});

test("P6-05 — BACKEND vẫn là tầng quyết định: thông điệp 400 giữ nguyên", () => {
  assert.match(java, /Bắt buộc nhập lý do duyệt quá hạn/, "backend phải giữ validate 400 (§17)");
});
