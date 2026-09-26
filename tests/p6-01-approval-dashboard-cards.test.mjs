// MT2-P6-01 (§4.1) — HỢP ĐỒNG REGRESSION: dashboard cards đúng RBAC + card «Chờ Giám đốc duyệt».
// ⚠️ TRUNG THỰC: mã đã có từ trước (P4-02/P4-03 + `WorkCenter.DirectorPendingCard`) ⇒ đây là **KHOÁ REGRESSION
// viết sau**, ⛔ KHÔNG giả vờ "đỏ trước khi sửa". Phần ĐO HÀNH VI THẬT (403 theo cấp bậc) nằm ở
// `DirectorPendingApprovalsTest` + `RequestOverdueReasonTest` (Java) — đã chạy EXIT 0 ở task P4-02/P4-03.
// Chạy: node --import tsx --test tests/p6-01-approval-dashboard-cards.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const center = read("../app/screens/WorkCenter.tsx");
const bootstrap = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");
const rbac = read("../java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");

test("P6-01 — card «Chờ Giám đốc duyệt» dùng DỮ LIỆU THẬT từ approval engine", () => {
  assert.match(center, /function DirectorPendingCard\(\)/, "phải có component card riêng");
  assert.match(center, /action: "director_pending_approvals"/, "phải gọi action thật của approval engine");
  assert.match(center, /label="Chờ Giám đốc duyệt"/, "nhãn card đúng §4.1");
});

test("P6-01 — §4.1 «⛔ không hiển thị card cho user không đủ quyền»: 403 ⇒ TỰ ẨN (không vỡ màn)", () => {
  assert.match(center, /if \(response\.status === 403\)[\s\S]{0,120}hidden: true/,
    "403 phải ⇒ ẩn card (backend là tầng quyết định, ⛔ không hard-code quyền ở frontend)");
  assert.match(center, /if \(state\.hidden\) return null;/, "card ẩn hẳn khi không đủ quyền");
});

test("P6-01 — card được render trong khu dashboard của màn Công việc", () => {
  assert.match(center, /<div className="kpi-grid small"><DirectorPendingCard\/>/, "card phải nằm trong dải KPI");
});

test("P6-01 — BACKEND là tầng chặn: vùng duyệt bị `blank` khi thiếu quyền/cấp bậc", () => {
  assert.match(bootstrap, /blank\(data, "requests", "supplySteps", "purchaseOrders", "receipts",\s*\n?\s*"approvals", "approvalOverdue"\)/,
    "thiếu module duyệt ⇒ xoá cả vùng duyệt (vá rò dữ liệu)");
  assert.match(bootstrap, /if \(!laQuanTri && \(levelRank == null \|\| levelRank < 30\)\)[\s\S]{0,160}blank\(data, "approvals", "approvalOverdue"\)/,
    "không phải admin và level_rank < 30 ⇒ ẩn vùng duyệt (§4.1)");
});

test("P6-01 — action có khoá RBAC ĐẦY ĐỦ (module + capability), ⛔ không để `List.of()`", () => {
  assert.match(rbac, /Map\.entry\("director_pending_approvals", List\.of\("approvals"\)\)/, "phải gác module `approvals`");
  assert.match(rbac, /Map\.entry\("director_pending_approvals", "canView"\)/, "phải khai capability `canView`");
});
