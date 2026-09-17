// GOAL §6 — Đối chiếu action mà UI GỌI với action mà BACKEND THẬT SỰ CÓ.
//
// VÌ SAO CẦN: nếu UI gọi một action không tồn tại ở backend nào thì người dùng bấm nút sẽ ăn lỗi
// (Java trả 400 "chưa được triển khai" hoặc 403 do thiếu khai báo quyền). Đây là chiều "UI ↓ API"
// của GOAL §6 mà các cổng hiện có CHƯA kiểm: `probe-action-parity` chỉ so JS ↔ Java ↔ danh mục,
// không so với chính mã giao diện.
//
// CÁCH LÀM: UI gọi qua helper `requestApi(action, payload)` (app/page.tsx:356) và qua các chỗ
// `fetch("/api/system", ... body: JSON.stringify({ action: "…" }))`. Trích tên action từ các ngữ cảnh đó.
//
// Chạy: node tools/probe-ui-action-coverage.mjs
import { readFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = ".";
const CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const JS = "scripts/system-route.mjs";

// ---------- tập action backend thật có ----------
const ctrl = readFileSync(CTRL, "utf8");
const indexName = /_uidx|^primary_key_f$/;   // tên chỉ mục SQL, KHÔNG phải action
const javaActions = new Set(
  [...ctrl.matchAll(/case\s+"([a-z0-9_]+)"/g)].map((m) => m[1]).filter((a) => !indexName.test(a)),
);
const jsSrc = readFileSync(JS, "utf8");
// JS khai action bằng `case "x":` hoặc bảng ACTION_MODULE / ACTION_CAPABILITY
const jsActions = new Set([
  ...[...jsSrc.matchAll(/case\s+"([a-z0-9_]+)"/g)].map((m) => m[1]),
  // LƯU Ý: regex của matchAll BẮT BUỘC có cờ `g` — thiếu cờ sẽ ném
  // "String.prototype.matchAll called with a non-global RegExp argument".
  ...[...jsSrc.matchAll(/ACTION_MODULE\s*=\s*\{([\s\S]*?)\n\}/g)].flatMap((b) =>
    [...b[1].matchAll(/([a-z][a-z0-9_]*)\s*:/g)].map((m) => m[1])),
]);

// ---------- quét mã giao diện ----------
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (["node_modules", "dist", ".next", ".git"].includes(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (/\.(tsx|ts)$/.test(name)) out.push(p);
  }
  return out;
}

const uiFiles = walk(join(ROOT, "app"));
const called = new Map();    // BẰNG CHỨNG GỌI: tên literal đứng ngay sau một helper gọi API
const mentioned = new Map(); // CHỈ NHẮC TỚI: chuỗi trùng tên action nhưng không ở ngữ cảnh gọi

const push = (map, action, file, line) => {
  if (!/^[a-z][a-z0-9_]{2,}$/.test(action)) return;
  const where = `${relative(ROOT, file).split(sep).join("/")}:${line}`;
  if (!map.has(action)) map.set(action, []);
  map.get(action).push(where);
};

// Helper gọi API của UI: `requestApi(action, …)` (app/page.tsx:356) và các hàm nhận tên rồi gọi nó
// (`submit("save_workflow", …)`, `action("create_po", …)`, …).
//
// BÀI HỌC: phiên bản đầu chỉ khớp `submit\s*\(\s*["']` — tức ĐÒI chuỗi nằm NGAY sau dấu mở ngoặc.
// Cách đó BỎ SÓT lời gọi mà đối số thứ nhất là BIỂU THỨC, ví dụ thật trong mã:
//     await submit(editing ? "update_project" : "create_project", { … })
// ⇒ bỏ sót CẢ HAI action. Nay quét trọn ĐỐI SỐ THỨ NHẤT (tôn trọng ngoặc lồng và chuỗi) rồi lấy
// mọi chuỗi có dạng tên action bên trong.
const HELPER_RE = /\b(requestApi|submit|action|call|run|runAction)\s*\(/g;
const NAME_RE = /^[a-z][a-z0-9_]{2,}$/;

function firstArgLiterals(line, openIdx) {
  const out = [];
  let depth = 0;
  for (let i = openIdx + 1; i < line.length && i - openIdx < 500; i++) {
    const c = line[i];
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      let j = i + 1, buf = "";
      while (j < line.length && line[j] !== quote) {
        if (line[j] === "\\") { buf += line[j + 1] ?? ""; j += 2; continue; }
        buf += line[j]; j++;
      }
      if (NAME_RE.test(buf)) out.push(buf);
      i = j; continue;
    }
    if (c === "(" || c === "[" || c === "{") { depth++; continue; }
    if (c === ")" || c === "]" || c === "}") {
      if (depth === 0) break;          // đóng chính lời gọi helper
      depth--; continue;
    }
    if (c === "," && depth === 0) break;   // hết đối số thứ nhất
  }
  return out;
}

const BODY_RE = /action\s*:\s*["']([a-z0-9_]+)["']/g;

for (const file of uiFiles) {
  const src = readFileSync(file, "utf8");
  const lines = src.split(/\r?\n/);
  lines.forEach((text, i) => {
    for (const m of text.matchAll(HELPER_RE)) {
      const openIdx = m.index + m[0].length - 1;
      for (const name of firstArgLiterals(text, openIdx)) push(called, name, file, i + 1);
    }
    for (const m of text.matchAll(BODY_RE)) push(called, m[1], file, i + 1);
  });
  // Chuỗi bất kỳ trùng tên action backend: CHỈ ghi nhận là "nhắc tới", KHÔNG dùng để kết luận.
  for (const m of src.matchAll(/["']([a-z][a-z0-9_]{2,})["']/g)) {
    const a = m[1];
    if (!javaActions.has(a) && !jsActions.has(a)) continue;
    if (called.has(a)) continue;
    const line = src.slice(0, m.index).split(/\r?\n/).length;
    push(mentioned, a, file, line);
  }
}

console.log(`Backend Java (action thật, đã loại tên chỉ mục) : ${javaActions.size}`);
console.log(`Backend JS   (action)                          : ${jsActions.size}`);
console.log(`Tệp giao diện đã quét                          : ${uiFiles.length}`);
console.log(`Action UI GỌI (có bằng chứng lời gọi)          : ${called.size}`);
console.log(`Chuỗi chỉ NHẮC TỚI tên action (không tính)     : ${mentioned.size}\n`);

const calledList = [...called.keys()];
const missing = calledList.filter((a) => !javaActions.has(a) && !jsActions.has(a)).sort();
const onlyJs = calledList.filter((a) => !javaActions.has(a) && jsActions.has(a)).sort();
const covered = calledList.filter((a) => javaActions.has(a));

console.log(`UI GỌI VÀ Java có                              : ${covered.length}/${calledList.length}`);
console.log(`UI GỌI, Java KHÔNG có nhưng JS có              : ${onlyJs.length}`);
console.log(`UI GỌI mà KHÔNG backend nào có (⇒ bấm sẽ lỗi)  : ${missing.length}`);

const neverCalled = [...javaActions].filter((a) => !called.has(a)).sort();
console.log(`\nAction Java KHÔNG thấy UI gọi (${neverCalled.length}) — có thể chỉ gọi qua API trực tiếp:`);
console.log("  " + neverCalled.slice(0, 40).join(", ") + (neverCalled.length > 40 ? " …" : ""));

if (onlyJs.length) {
  console.log("\n▸ UI gọi, chỉ JS có (Java thiếu — dưới cutover sẽ 400):");
  for (const a of onlyJs) console.log(`    ${a.padEnd(32)} ${called.get(a).slice(0, 3).join(", ")}`);
}
if (missing.length) {
  console.log("\n▸ UI gọi mà KHÔNG backend nào có:");
  for (const a of missing) console.log(`    ${a.padEnd(32)} ${called.get(a).slice(0, 3).join(", ")}`);
}

const pass = missing.length === 0 && onlyJs.length === 0 && calledList.length > 0;
console.log("\n" + (pass
  ? `KẾT LUẬN: toàn bộ ${calledList.length} action UI GỌI đều có ở Java ⇒ chiều UI ↓ API KHỚP.`
  : `KẾT LUẬN: ${missing.length + onlyJs.length} điểm lệch cần xem.`));
process.exitCode = pass ? 0 : 1;
