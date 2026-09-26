// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-067 — CỔNG CHỐNG "BẪY THỨ TỰ": `data.put("X", data.get("Y"))` khi Y chưa được ghi
// ════════════════════════════════════════════════════════════════════════════════════════════
// VÌ SAO CÓ CỔNG NÀY: TASK-066 vừa vá một lỗi THẬT đúng dạng này —
//     data.put("engineRoleProfiles", data.get("businessRoleEngineProfiles"));
// đặt ở dòng 1026 trong khi `businessRoleEngineProfiles` chỉ được ghi ở dòng ~1190 (trong `if (admin)`)
// ⇒ đọc TRƯỚC khi ghi ⇒ **`engineRoleProfiles` = null cho MỌI tài khoản, kể cả admin** (Known Problems #50).
// Cổng tĩnh theo TÊN KHOÁ và cổng theo TẬP CỘT đều KHÔNG bắt được lỗi này: khoá CÓ, cột CÓ, chỉ THỨ TỰ sai.
// Lớp lỗi này còn 1 ca tiềm ẩn đã biết: `approvalStages = data.get("approvalStageCatalog")` (hiện ĐÚNG vì
// `approvalStageCatalog` được ghi ở dòng 706, TRƯỚC dòng 836 — nhưng sẽ VỠ nếu ai đó di chuyển khối).
//
// PHÉP ĐO: dựng BẢNG DÒNG của mọi `data.put("K", …)` (theo thứ tự văn bản), rồi với mỗi phép gán dạng
// `data.put("X", data.get("Y"))` / `data.getOrDefault("Y", …)` kiểm `lineOf(Y) < lineOf(X)`.
//
// ⚠️ CỔNG PHẢI TỰ CHỨNG MINH (bài học #103): chạy thêm 2 ca DỰNG SẴN có đáp án biết trước
//    (đúng thứ tự ⇒ phải IM; ngược thứ tự ⇒ phải BẮT). Đối chứng hỏng thì mọi kết luận dưới đây vô hiệu.
//
// GIỚI HẠN: chỉ phân tích được dạng gán TRỰC TIẾP qua `data.get*`. Phép gán qua BIẾN TRUNG GIAN
// (`X = ...; data.put("A", X); data.put("B", A)`) không bị bắt — ghi rõ để không tạo cảm giác an toàn giả.
//
// Chạy: node tools/probe-put-order.mjs
import { readFileSync } from "node:fs";

const JAVA_SRC = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java";

/** Dòng của mọi `data.put("K", …)` — trả Map<K, số dòng[]>, giữ ĐÚNG thứ tự văn bản. */
function putLines(source) {
  const lines = source.split(/\r?\n/);
  const out = new Map();
  lines.forEach((text, i) => {
    for (const m of text.matchAll(/data\.put\("([A-Za-z_][A-Za-z0-9_]*)"/g)) {
      const k = m[1];
      out.set(k, (out.get(k) ?? []).concat([i + 1]));
    }
  });
  return out;
}

/** Danh sách phép gán phụ thuộc thứ tự: {target, source, line}. */
function orderDependencies(source) {
  const lines = source.split(/\r?\n/);
  const deps = [];
  lines.forEach((text, i) => {
    const m = text.match(/data\.put\("([A-Za-z_][A-Za-z0-9_]*)",\s*data\.get(?:OrDefault)?\("([A-Za-z_][A-Za-z0-9_]*)"/);
    if (m) deps.push({ target: m[1], source: m[2], line: i + 1 });
  });
  return deps;
}

/** Trả về danh sách vi phạm cho một nguồn. */
function violations(source) {
  const puts = putLines(source);
  const bad = [];
  for (const d of orderDependencies(source)) {
    const src = puts.get(d.source);
    if (!src || !src.length) { bad.push({ ...d, why: `khoá nguồn "${d.source}" KHÔNG hề được ghi bằng data.put` }); continue; }
    if (!(src[0] < d.line)) bad.push({ ...d, why: `nguồn ghi ở dòng ${src[0]} — SAU dòng gán ${d.line}` });
  }
  return bad;
}

// ═══════════════════════════ ĐỐI CHỨNG CỦA CHÍNH BỘ PHÂN TÍCH ═══════════════════════════
console.log("═══ ĐỐI CHỨNG CỦA BỘ PHÂN TÍCH (dựng sẵn, biết trước đáp án) ═══");
const CONTROL_OK = `
    data.put("source", query("SELECT 1"));
    data.put("alias", data.get("source"));
`;
const CONTROL_BAD = `
    data.put("alias", data.get("source"));
    data.put("source", query("SELECT 1"));
`;
const CONTROL_MISSING = `
    data.put("alias", data.get("never_written"));
`;
const controls = [
  ["đúng thứ tự ⇒ phải IM", CONTROL_OK, 0],
  ["ngược thứ tự ⇒ phải BẮT", CONTROL_BAD, 1],
  ["khoá nguồn không hề được ghi ⇒ phải BẮT", CONTROL_MISSING, 1],
];
let controlsOk = true;
for (const [name, src, expect] of controls) {
  const got = violations(src).length;
  const ok = got === expect;
  if (!ok) controlsOk = false;
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name} — bắt ${got} (kỳ vọng ${expect})`);
}
if (!controlsOk) {
  console.log("\n⚠️ BỘ PHÂN TÍCH HỎNG ĐỐI CHỨNG ⇒ MỌI KẾT LUẬN BÊN DƯỚI KHÔNG ĐÁNG TIN.");
  process.exit(1);
}

// ═══════════════════════════ PHÂN TÍCH NGUỒN THẬT ═══════════════════════════
const java = readFileSync(JAVA_SRC, "utf8");
const puts = putLines(java);
const deps = orderDependencies(java);
const bad = violations(java);

console.log(`\n═══ NGUỒN THẬT: ${JAVA_SRC.split("/").pop()} ═══`);
console.log(`  số khoá có \`data.put\`: ${puts.size} · số phép gán phụ thuộc thứ tự: ${deps.length}`);
for (const d of deps) {
  const src = puts.get(d.source);
  const mark = bad.some((b) => b.target === d.target && b.line === d.line) ? "HỎNG" : "ĐẠT ";
  console.log(`  ${mark}  L${d.line}  ${d.target} ← ${d.source}  (nguồn ở dòng ${src ? src[0] : "—"})`);
}

// Cùng lớp nguy hiểm: khoá bị ghi NHIỀU LẦN (lần sau ĐÈ lần trước — im lặng).
const dupes = [...puts.entries()].filter(([, ls]) => ls.length > 1);
console.log(`\n═══ KHOÁ BỊ GHI NHIỀU LẦN (ghi đè im lặng): ${dupes.length} ═══`);
for (const [k, ls] of dupes) console.log(`  • ${k} — các dòng ${ls.join(", ")}`);

console.log(`\n═══ KẾT QUẢ: ${bad.length} vi phạm thứ tự ═══`);
if (bad.length) {
  for (const b of bad) console.log(`  HỎNG  ${b.target} ← ${b.source} (L${b.line}): ${b.why}`);
}
console.log("GIỚI HẠN: chỉ bắt dạng gán TRỰC TIẾP qua `data.get*`; gán qua biến trung gian KHÔNG bị bắt.");
console.log("         Ngoài ra cổng KHÔNG kiểm được phép gán nằm trong nhánh điều kiện (`if (admin)`…) —");
console.log("         đó là lớp 'khoá có nhưng rỗng theo vai trò', do `probe-task066-role-shape.mjs` đo.");
process.exit(bad.length === 0 && controlsOk ? 0 : 1);
