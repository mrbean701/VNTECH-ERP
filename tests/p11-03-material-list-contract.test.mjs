// MT2-P11-03 (§12.1) — HỢP ĐỒNG DỮ LIỆU tab «Danh sách vật tư».
// Nguyên văn `docs/dsh/MASTER_TASK_2.md:242`: «Tab danh sách vật tư không hiển thị đúng thông tin danh sách
// vật tư và mã vật tư gốc ⇒ phải audit API · response · mapping · component · table columns · database
// relationship và fix ROOT CAUSE. ⛔ Không chỉ hide lỗi frontend.»
//
// ROOT CAUSE đã chứng minh (xem log `MT2-PHASE-6-AUDIT.md` §P11-03): payload `materials` (không phải
// `adminMaterials`) **thiếu cột `active`**, mà `page.tsx:308` gán `adminMaterials = materials` cho user
// KHÔNG phải admin ⇒ cột «Trạng thái» luôn «Đang dùng» và bộ lọc «Đã ngừng» không bao giờ có kết quả.
//
// Tệp này CỐ Ý không nằm trong `test:regression` (giữ nguyên số ca) — chạy riêng:
//   node --import tsx --test tests/p11-03-material-list-contract.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const adapter = readFileSync(
  new URL("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java", import.meta.url),
  "utf8",
);
const table = readFileSync(new URL("../app/screens/MaterialListTable.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

/**
 * Cắt đúng khối SQL của biến payload (KHÔNG phải `data.put` — chỗ đó chỉ đưa biến vào).
 * Mẫu thật trong `BootstrapDataAdapter`:
 *   List<Map<String, Object>> materials = new ArrayList<>(query(""" … """));
 *   … data.put("materials", materials);
 *   List<Map<String, Object>> adminMaterials = new ArrayList<>(query(""" … """));
 *   … data.put("adminMaterials", adminMaterials);
 * ⇒ cắt từ lệnh khai báo biến `query("""` TƯƠNG ỨNG rồi tới khoảng `"""));` gần nhất.
 */
function sqlBlock(variable) {
  const decl = adapter.indexOf(`${variable} = new ArrayList<>(query("""`);
  assert.ok(decl >= 0, `không tìm thấy khai báo List<…> ${variable} = new ArrayList<>(query(...))`);
  const end = adapter.indexOf('"""));', decl);
  assert.ok(end > decl, `khối SQL của "${variable}" không đóng`);
  return adapter.slice(decl, end);
}

test("P11-03 — payload `materials` PHẢI có cột `active` (root cause §12.1)", () => {
  const sql = sqlBlock("materials");
  assert.match(sql, /m\.active\s+AS\s+active/i,
    "payload `materials` phải trả `active` — UI lọc + hiện cột «Trạng thái» theo trường này");
  assert.match(sql, /m\.code\b/, "payload phải có mã vật tư gốc (m.code)");
  assert.match(sql, /m\.name\b/, "payload phải có tên vật tư");
  assert.match(sql, /mc\.name\s+AS\s+categoryName/i, "payload phải có tên hệ (LEFT JOIN, kể cả khi chưa gán hệ)");
  assert.match(sql, /ms\.name\s+AS\s+subcategoryName/i, "payload phải có tên nhóm con (LEFT JOIN)");
});

test("P11-03 — `adminMaterials` giữ nguyên: có `active` + KHÔNG lọc bản ghi đã ngừng", () => {
  const sql = sqlBlock("adminMaterials");
  assert.match(sql, /m\.active\b/i, "adminMaterials phải có `active`");
  assert.ok(!/WHERE\s+m\.active\s*=\s*1/i.test(sql),
    "adminMaterials KHÔNG được lọc active=1 (quản trị cần thấy cả mã đã ngừng)");
});

test("P11-03 — mapping `adminMaterials` PHẢI fallback về `materials` TẠI NGUỒN (không phải tại chỗ dùng)", () => {
  assert.match(page, /adminMaterials:\s*Array\.isArray\(result\.data\?\.adminMaterials\)\s*\?\s*result\.data\.adminMaterials\s*:\s*\(Array\.isArray\(result\.data\?\.materials\)\s*\?\s*result\.data\.materials\s*:\s*\[\]\)/,
    "khối chuẩn hoá bootstrap phải gán `adminMaterials` = `materials` khi server không gửi (bẫy mảng rỗng là truthy)");
});

test("P11-03 — component dùng fallback chain + lọc/hiện trạng thái theo `active`", () => {
  assert.match(table, /data\.adminMaterials\s*\|\|\s*data\.materials\s*\|\|\s*\[\]/,
    "MaterialListTable phải đọc `adminMaterials || materials`");
  assert.match(table, /Number\(m\.active\)\s*!==\s*0/,
    "bộ lọc trạng thái phải dùng `active` (nếu payload thiếu thì mọi dòng đều qua ⇒ lọc giả)");
  assert.match(table, /Number\(m\.active\)\s*===\s*0/,
    "cột «Trạng thái» phải phân biệt được vật tư đã ngừng");
  assert.match(table, /m\.code/, "bảng phải hiện mã vật tư gốc (m.code)");
  assert.match(table, /data-material-search|danh sách vật tư/i,
    "bảng phải là danh sách vật tư của tab §12.1");
});

test("P11-03 — màn KHÔNG được tự chế dữ liệu (⛔ NO FAKE DATA)", () => {
  assert.ok(!/Math\.random|faker|mockMaterials|DEMO_MATERIAL/i.test(table),
    "MaterialListTable không được sinh dữ liệu giả — phải đọc từ payload thật");
  assert.match(table, /rows=\{rows\}/, "bảng phải render từ mảng đã lọc từ payload");
});
