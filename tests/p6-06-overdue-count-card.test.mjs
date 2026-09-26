// MT2-P6-06 (§4.4) — HỢP ĐỒNG REGRESSION: card/khối ĐẾM ĐƠN QUÁ HẠN.
// Nguyên văn §4.4: «Tracking quá hạn … Phải tính được `total overdue approvals` + theo dõi số lượng · thời gian quá hạn · nguyên nhân.»
// ⚠️ TRUNG THỰC: baseline ĐÃ có — backend `BootstrapDataAdapter` dựng `data.approvalOverdue` = {total, byDepartment[]}
// (từ P3-07) và UI `WorkCenter` có card «Đơn quá hạn SLA» ⇒ đây là **KHOÁ REGRESSION viết sau**, ⛔ KHÔNG giả vờ đỏ→xanh.
// Chạy: node --import tsx --test tests/p6-06-overdue-count-card.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const center = read("../app/screens/WorkCenter.tsx");
const bootstrap = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");

test("P6-06 — hàm đếm CHỈ tính bước CHƯA có quyết định và đã QUÁ `dueAt`", () => {
  assert.match(center, /function overdueApprovalCount\(data: AppData\): number \| null/,
    "phải có hàm đếm thuần");
  assert.match(center, /String\(a\.status\) === "pending"[\s\S]{0,120}Date\.parse\(String\(a\.dueAt\)\) < now/,
    "điều kiện: status pending + dueAt < hiện tại");
});

test("P6-06 — THIẾU NGUỒN ⇒ «chưa có nguồn», ⛔ KHÔNG hiện số 0 GIẢ", () => {
  assert.match(center, /steps\.length === 0\) return null;/, "không có bước nào ⇒ null (⛔ không bịa 0)");
  assert.match(center, /overdueApprovalCount\(data\) === null \? "chưa có nguồn" : String\(overdueApprovalCount\(data\)\)/,
    "UI phải ghi rõ «chưa có nguồn» thay vì hiện 0");
  assert.match(center, /label="Đơn quá hạn SLA"/, "card đúng §4.4");
});

test("P6-06 — BACKEND tổng hợp `total overdue` + theo PHÒNG BAN (nguồn thật)", () => {
  assert.match(bootstrap, /approvalOverdue\.put\("total", overdueTotal\)/, "backend phải trả `total`");
  assert.match(bootstrap, /approvalOverdue\.put\("byDepartment", overdueByDepartment\)/, "backend phải trả theo phòng ban");
  assert.match(bootstrap, /avgOverdueMinutes/, "phải có thời lượng quá hạn trung bình (số liệu THẬT)");
});
