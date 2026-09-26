// MT2-BLK-05 (user chốt 26/09/2026) — HỢP ĐỒNG: USER THƯỜNG PHẢI THẤY MÃ VẬT TƯ GỐC ĐÃ NGỪNG.
//
// BỐI CẢNH ĐO ĐƯỢC (docs/agent-progress/MT2-PHASE-6-AUDIT.md:4815-4818, task P11-03):
//   · P11-03 đã vá ROOT CAUSE «payload `materials` thiếu cột `active`» ⇒ UI hiện/lọc sai trạng thái.
//   · NHƯNG còn tồn: `materials` vẫn `WHERE m.active=1` ⇒ **user thường KHÔNG thấy mã vật tư đã ngừng**
//     (chỉ `adminMaterials` của quản trị mới có). Đây chính là BLK-05 ⇒ hỏi user.
//   · **USER ĐÃ CHỐT: «Cho phép user thường nhìn thấy mã vật tư gốc đã ngừng».**
//
// ⚠️ VÌ SAO PHẢI GIỮ CỘT `active` KHI BỎ LỌC: nếu chỉ bỏ `WHERE m.active=1` mà payload ⛔ không có
//    `active` thì UI rơi vào `Number(undefined)===0` = false ⇒ **LUÔN hiện «Đang dùng»** cho cả mã đã
//    ngừng (đúng lỗi cũ ở audit ¶5-6). ⇒ Hợp đồng này khoá CẢ HAI: bỏ lọc **VÀ** còn cột `active`.
//
// Phạm vi (GOAL §40 — ⛔ không mở rộng quá yêu cầu): CHỈ payload danh mục `materials`.
//   ⛔ KHÔNG đụng danh sách tồn kho (`WHERE m.active=1 AND balance<>0`) — đó là quyết định khác.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const bootstrap = read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");
const js = read("scripts/system-route.mjs");
const table = read("app/screens/MaterialListTable.tsx");

/** Cắt khối `materials = new ArrayList<>(query("""…"""))` trong BootstrapDataAdapter. */
function javaMaterialsBlock() {
  const start = bootstrap.indexOf("List<Map<String, Object>> materials = new ArrayList<>(query(\"\"\"");
  assert.ok(start > 0, "phải tìm thấy khối `materials` trong BootstrapDataAdapter");
  const end = bootstrap.indexOf('"""', bootstrap.indexOf("ORDER BY", start));
  return bootstrap.slice(start, end);
}

/** Cắt câu SQL `let materials = await all(\`…\`)` trong JS. */
function jsMaterialsSql() {
  const start = js.indexOf("let materials = await all(`");
  assert.ok(start > 0, "phải tìm thấy `let materials = await all(` trong system-route.mjs");
  return js.slice(start, js.indexOf("`);", start));
}

test("BLK-05 (1) JAVA — payload `materials` ⛔ KHÔNG còn lọc `m.active=1` (user thường thấy mã đã ngừng)", () => {
  const block = javaMaterialsBlock();
  assert.doesNotMatch(block, /WHERE\s+m\.active=1/,
    "⛔ KHÔNG được lọc `m.active=1` nữa — user đã chốt cho phép thấy mã vật tư gốc đã ngừng");
  // Vẫn phải còn cột `active` để UI render/lọc đúng trạng thái (chống tái phát lỗi P11-03 ¶5-6).
  assert.match(block, /m\.active AS active/, "payload PHẢI còn `m.active AS active`");
});

test("BLK-05 (2) JAVA — mã đã ngừng xếp CUỐI nhưng VẪN có trong kết quả", () => {
  const block = javaMaterialsBlock();
  assert.match(block, /ORDER BY\s+m\.active ASC/, "sắp xếp đưa mã đang dùng lên trước (mã đã ngừng xuống cuối) — ⛔ KHÔNG ẩn");
  assert.doesNotMatch(block, /\bDELETE\b|\bDROP\b/i, "⛔ không thao tác phá dữ liệu");
});

test("BLK-05 (3) PARITY JS — system-route.mjs phải khớp Java: bỏ lọc + CÓ cột active", () => {
  const sql = jsMaterialsSql();
  assert.doesNotMatch(sql, /m\.active=1/,
    "JS phải bỏ `m.active=1` để GIỮ PARITY với Java (nếu lệch, stack JS hiển thị khác Java)");
  assert.match(sql, /m\.active AS active/,
    "JS trước đây THIẾU cột `active` (đúng root cause P11-03) ⇒ nay phải bổ sung để hiện đúng «Đã ngừng»");
  assert.match(sql, /ORDER BY\s+m\.active ASC/, "JS cũng phải xếp mã đã ngừng xuống cuối");
});

test("BLK-05 (4) UI — bảng vật tư render nhãn theo `active` và có bộ lọc «Đã ngừng»", () => {
  assert.match(table, /Number\(m\.active\)===0|Number\(m\.active\) === 0/,
    "phải suy trạng thái từ `active` để hiện «Đã ngừng» (⛔ không hard-code «Đang dùng»)");
  assert.match(table, /Đã ngừng/, "phải có nhãn/bộ lọc «Đã ngừng» để user thường tra được mã đã ngừng");
});

test("BLK-05 (5) ⛔ KHÔNG mở rộng phạm vi — danh sách TỒN KHO vẫn giữ lọc riêng của nó", () => {
  // Quyết định của user là về DANH MỤC mã vật tư, ⛔ không phải về tồn kho ⇒ giữ nguyên.
  assert.match(js, /WHERE m\.active=1 AND COALESCE\(b\.balance,0\)<>0/,
    "danh sách tồn kho phải giữ nguyên lọc riêng (⛔ không tự mở rộng phạm vi — GOAL §40)");
});
