// USER 28/09/2026 — CỔNG CHẶN TỰ ĐỘNG (goal §9 TYPE 1 — tự giải quyết, không hỏi user).
//
// VÌ SAO CẦN: trong phiên 28/09/2026, ghi chú `//` trong CSS đã làm **CssSyntaxError ⇒ BUILD FAIL**
//   đúng 3 LẦN. Mỗi lần mất ~1 phút build + phải truy tìm lỗi.
//   Ghi chú "nhớ dùng /* */" KHÔNG đủ ⇒ phải có CỔNG tự động chặn TRƯỚC khi build.
//
// CÁCH CHẠY:  node tools/css-comment-guard.mjs           (kiểm, exit 1 nếu có lỗi)
//              node tools/css-comment-guard.mjs --fix     (tự sửa `//` đầu dòng → `/* */`)
//
// ⛔ KHÔNG đụng `//` nằm trong URL (https://…) hoặc trong chuỗi — chỉ bắt ghi chú đầu dòng.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["app", "tools", "scripts", "lib"];
const SKIP = new Set(["node_modules", "dist", ".git", "target", ".local-data", "backup"]);
const FIX = process.argv.includes("--fix");

function* walk(dir) {
  let entries;
  try { entries = readdirSync(dir); } catch { return; }
  for (const e of entries) {
    if (SKIP.has(e)) continue;
    const p = join(dir, e);
    let st; try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) yield* walk(p);
    else if (e.endsWith(".css")) yield p;
  }
}

const findings = [];
for (const root of ROOTS) {
  for (const file of walk(root)) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    let inBlock = false;   // theo doi khoi ghi chu /* ... */ da co
    lines.forEach((line, i) => {
      const s = line.trim();
      // Neu dang trong khoi ghi chu /* */ thi moi thu `//` deu BINH THUONG.
      if (inBlock) { if (s.includes("*/")) inBlock = false; return; }
      if (s.startsWith("/*") && !s.includes("*/")) { inBlock = true; return; }
      // GHI CHU DONG DON: chi bat khi `//` o DAU DONG (sau khi bo khoang trang).
      if (s.startsWith("//")) findings.push({ file: relative(".", file), line: i + 1, text: s });
    });
  }
}

if (!findings.length) {
  console.log("  ✅ CSS COMMENT GUARD: OK — khong co ghi chu `//` dau dong trong " + ROOTS.join(", "));
  process.exit(0);
}

console.log("  ❌ CSS COMMENT GUARD: phat hien " + findings.length + " dong ghi chu `//` (CSS chi co `/* */`)");
for (const f of findings) console.log("     " + f.file + ":" + f.line + "  " + f.text.slice(0, 100));

if (FIX) {
  let fixed = 0;
  const byFile = new Map();
  for (const f of findings) {
    if (!byFile.has(f.file)) byFile.set(f.file, new Set());
    byFile.get(f.file).add(f.line);
  }
  for (const [file, lineSet] of byFile) {
    const lines = readFileSync(file, "utf8").split(/\r?\n/);
    for (const ln of lineSet) {
      const i = ln - 1;
      const s = lines[i].trim();
      if (s.startsWith("//")) {
        lines[i] = "/* " + s.replace(/^\/\/\s?/, "").replace(/\*\/$/, "").trim() + " */";
        fixed += 1;
      }
    }
    writeFileSync(file, lines.join("\n"), "utf8");
  }
  console.log("  ✅ da sua " + fixed + " dong `//` -> `/* */`");
  process.exit(0);
}

console.log("  ➜ sua bang:  node tools/css-comment-guard.mjs --fix");
process.exit(1);
