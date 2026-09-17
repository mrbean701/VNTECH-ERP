// Cổng TASK-048b — QUÉT KHOÁ BOOTSTRAP: giao diện đọc `data.<khoá>` nào mà backend Java KHÔNG trả?
//
// VÌ SAO: lớp lỗi *"đường ĐỌC thiếu khoá"* đã bắt được **8 lần** (TASK-039 `scope_key='GLOBAL'`,
// TASK-040 nhóm 1 `emailRecipients`, nhóm 3 `source_type`, nhóm 3b `adminMaterials`…). Mỗi lần đều
// phát hiện THỦ CÔNG sau khi người dùng thấy màn hình trống. Cổng này quét MỘT LƯỢT toàn bộ khoá.
//
// GIỚI HẠN (nói rõ): phép đo là SO KHỚP TÊN CHUỖI, không phải phân tích kiểu dữ liệu —
//   • UI có thể đọc `data.X` ở nhánh chỉ chạy cho dữ liệu JS-only ⇒ phải đọc mã trước khi kết luận;
//   • Java có thể trả khoá qua lớp khác (JPA/controller) mà cổng không thấy;
//   • khoá lồng trong object con (`settings.foo`) không được kiểm ở đây.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ui = readFileSync("app/page.tsx", "utf8");
const uiKeys = new Set();
for (const m of ui.matchAll(/\bdata\.([A-Za-z_][A-Za-z0-9_]*)/g)) uiKeys.add(m[1]);

const dir = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence";
const javaKeys = new Set();
const files = readdirSync(dir).filter((f) => /Bootstrap|Adapter\.java$/.test(f));
for (const f of files) {
  const src = readFileSync(join(dir, f), "utf8");
  for (const m of src.matchAll(/\.put\(\s*"([A-Za-z_][A-Za-z0-9_]*)"/g)) javaKeys.add(m[1]);
}

const missing = [...uiKeys].filter((k) => !javaKeys.has(k)).sort();
const internal = new Set(["length", "filter", "map", "find", "reduce", "some", "every", "forEach", "slice", "id", "code", "name"]);
const real = missing.filter((k) => !internal.has(k));

console.log(`UI đọc ${uiKeys.size} khoá \`data.*\` · Java khai ${javaKeys.size} khoá trong ${files.length} tệp adapter`);
console.log(`\n═══ KHOÁ UI ĐỌC MÀ KHÔNG THẤY JAVA TRẢ: ${real.length} ═══`);
for (const k of real) console.log(`  ${k}`);
console.log(`\nGHI CHÚ: đây là danh sách ĐỂ RÀ, không phải kết luận lỗi — mỗi khoá phải mở mã xác nhận`);
console.log(`(một số khoá do lớp khác trả, một số chỉ dùng ở nhánh dữ liệu JS).`);
process.exit(0);
