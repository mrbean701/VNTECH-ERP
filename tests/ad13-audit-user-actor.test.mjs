// PHASE 7 (`AD-13`) — HỢP ĐỒNG: TÁCH RIÊNG CỘT **USER** VÀ **ACTOR/PERFORMED BY** TRONG NHẬT KÝ KIỂM TOÁN.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-13`: «Tách riêng cột **User** và **Actor/Performed By**»
// (phụ thuộc `U-02` ✔ = `DataTable` dùng chung).
//
// BẰNG CHỨNG CỘT THẬT (`audit_logs`, 17 cột — xem TASK-102): `user_id` (CHỦ THỂ bản ghi) và `user_name`
// (tên người thực hiện ĐÓNG BĂNG lúc ghi — `AuditLogAdapter.java:63`). Hai nguồn KHÁC NHAU nên phải là HAI CỘT.
//
// ĐỐI CHỨNG ÂM: gộp 2 khái niệm vào 1 cột ⇒ cổng phải HỎNG; `auditUserOf` với user không có trong danh mục
// phải trả `hasOwnRecord=false` (KHÔNG bịa ra tên).
//
// Chạy riêng:  node --test tests/ad13-audit-user-actor.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pure = read("app/screens/admin-governance-pure.ts");
const page = read("app/page.tsx");

function loadPure(names) {
  const start = pure.search(/^\/\/ AD-PURE-BEGIN$/m);
  const end = pure.search(/^\/\/ AD-PURE-END$/m);
  const block = pure.slice(start + "// AD-PURE-BEGIN".length, end).replace(/^export /gm, "");
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

function auditBlock() {
  const start = page.indexOf("function AuditLogManager(");
  const end = page.indexOf("function SystemLevelModal(", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `AuditLogManager` trong app/page.tsx");
  return page.slice(start, end);
}

/** Cổng độc lập: phải có ĐÚNG 2 nhãn cột tách biệt. */
const splitGate = (block) => /Tài khoản \(User\)/.test(block) && /Người thực hiện \(Actor\)/.test(block);

test("AD-13 — pure: «User» lấy từ `user_id` → users, «Actor» lấy từ `user_name` đóng băng", () => {
  const { auditActorOf, auditUserOf } = loadPure(["auditActorOf", "auditUserOf"]);
  const row = { id: "A1", userId: "USR_1", userName: "Quản trị viên VNTECH", moduleKey: "receiving" };
  assert.deepEqual(auditActorOf(row), { actorName: "Quản trị viên VNTECH", actorId: "USR_1" },
    "Actor = tên người thực hiện đóng băng trong `audit_logs.user_name`");
  const users = [{ id: "USR_1", fullName: "Quản trị viên VNTECH" }, { id: "USR_2", fullName: "Kế toán A" }];
  assert.deepEqual(auditUserOf(row, users), { userName: "Quản trị viên VNTECH", userId: "USR_1", hasOwnRecord: true },
    "User = tài khoản bản ghi thuộc về, tra theo `user_id` (không dùng `user_name`)");
  // Bản ghi cũ chỉ có `user_id` (JS ghi 9 cột, KHÔNG ghi user_name) ⇒ Actor rỗng, KHÔNG bịa.
  const legacy = { id: "A2", userId: "USR_2" };
  assert.equal(auditActorOf(legacy).actorName, "", "Bản ghi không có `user_name` ⇒ Actor rỗng (UI hiện «không ghi»), không bịa");
  assert.equal(auditUserOf(legacy, users).userName, "Kế toán A", "User vẫn tra được từ `user_id`");
  assert.equal(auditUserOf(legacy, []).hasOwnRecord, false, "Không có trong danh mục ⇒ hasOwnRecord=false (không bịa tên)");
});

test("AD-13 — UI: bảng nhật ký có 2 CỘT RIÊNG «Tài khoản (User)» và «Người thực hiện (Actor)»", () => {
  const block = auditBlock();
  assert.equal(splitGate(block), true, "Phải có đủ 2 nhãn cột tách biệt");
  assert.match(block, /auditUserOf\(/, "Cột User phải tính bằng helper dùng chung");
  assert.match(block, /auditActorOf\(/, "Cột Actor phải tính bằng helper dùng chung");
  assert.match(block, /AUDIT_USER_COLUMN_SOURCE|AUDIT_ACTOR_COLUMN_SOURCE/, "UI phải dẫn nguồn cột (chứng minh không đoán)");
  // Đối chứng âm: gộp 1 cột ⇒ cổng phải HỎNG.
  const merged = block.replace("Tài khoản (User)", "Người thực hiện").replace("Người thực hiện (Actor)", "Người thực hiện");
  assert.equal(splitGate(merged), false, "[đối chứng âm] gộp 2 khái niệm vào 1 cột phải bị bắt");
});

test("AD-13 — bằng chứng cột THẬT ở cả 2 đường bootstrap (không bịa trường)", () => {
  const java = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");
  assert.match(java, /al\.user_id AS userId/, "Java phải trả `user_id AS userId` (User)");
  assert.match(java, /al\.user_name AS userName|COALESCE\(al\.user_name,u\.full_name\) AS userName/,
    "Java phải trả `user_name` (Actor) — có COALESCE khi bản ghi cũ không có tên");
  const adapter = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/AuditLogAdapter.java");
  assert.match(adapter, /INSERT INTO audit_logs \(id, user_id, user_name, user_role/, "Bản ghi mới ghi CẢ `user_name`");
  const js = read("scripts/system-route.mjs");
  assert.match(js, /SELECT al\.id,al\.action,al\.entity_type AS entityType,al\.entity_id AS entityId,al\.occurred_at AS occurredAt,u\.full_name AS userName/,
    "Đường JS cũ chỉ trả `userName` từ JOIN — phải được ghi nhận là nguồn HẸP HƠN (không suy đoán)");
});
