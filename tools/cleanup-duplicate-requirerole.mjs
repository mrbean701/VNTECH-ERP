// DỌN DẸP: gỡ các khối bị NHÂN ĐÔI do lỗi idempotency của tools/patch-task021b-022.mjs.
//
// Nguyên nhân gốc: script đó kiểm "đã áp dụng chưa" bằng `includes(edit.from)`, mà `edit.from` là DÒNG
// CHỮ KÝ PHƯƠNG THỨC — dòng này VẪN CÒN sau khi chèn nội dung ngay sau nó. Vì vậy lần chạy thứ hai
// (sau khi sửa EOL) đã chèn lại ⇒ thành hai bản y hệt, kèm hai chú thích y hệt.
//
// Tác hại: KHÔNG sai nghiệp vụ (cùng một phép kiểm chạy hai lần) nhưng là mã bẩn, và chứng tỏ phép
// kiểm idempotency của công cụ vá là SAI. Script này gỡ đúng những khối lặp liền kề.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".java")) out.push(p);
  }
  return out;
}

// Một "đơn vị" = chú thích dẫn + dòng rbac.requireRole ngay sau nó (đúng khuôn script cũ sinh ra).
const RE_UNIT = /( {8}\/\/ JS [^\n]*\n {8}rbac\.requireRole\([^\n]*\);\n)/;
const RE_DOUBLE = new RegExp(RE_UNIT.source + RE_UNIT.source);

let filesTouched = 0, removed = 0;
const rows = [];
for (const file of walk("java-backend")) {
  const raw = readFileSync(file, "utf8");
  const crlf = raw.includes("\r\n");
  let text = raw.replace(/\r\n/g, "\n");
  const before = text;
  let hits = 0;
  // Lặp tới khi không còn khối lặp (phòng khi bị nhân ba).
  while (RE_DOUBLE.test(text)) {
    text = text.replace(RE_DOUBLE, "$1");
    hits++;
  }
  if (hits > 0) {
    writeFileSync(file, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");
    filesTouched++;
    removed += hits;
    rows.push(`  APD ${file.replace(/\\/g, "/").split("/").pop()} — go ${hits} khoi lap`);
  }
  void before;
}

console.log("=== DON DEP: go khoi rbac.requireRole bi nhan doi ===");
console.log(rows.length ? rows.join("\n") : "  (khong tim thay khoi lap nao)");
console.log(`\nTep sua: ${filesTouched} · So khoi lap da go: ${removed}`);

// Kiểm chứng: quét lại, khẳng định KHÔNG còn khối lặp
let remaining = 0;
for (const file of walk("java-backend")) {
  const text = readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  if (RE_DOUBLE.test(text)) remaining++;
}
console.log(remaining === 0
  ? "KIEM CHUNG: khong con khoi lap nao ✅"
  : `KIEM CHUNG: CON ${remaining} tep van lap ⚠`);
process.exit(remaining === 0 ? 0 : 1);
