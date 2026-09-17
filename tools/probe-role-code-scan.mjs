// QUÉT TOÀN BỘ BACKEND JAVA: mã vai trò TRƯỚC KHI ĐỔI TÊN
//
// VÌ SAO CẦN: ở TASK-019 tôi sửa **5 lỗi** trong `ProductionManagementUseCase` — dùng mã vai trò
// trước khi đổi tên (`commander`, `project`) nên người dùng hợp lệ `cht`/`da_nv` bị **403 oan**.
// Năm lỗi đó tôi gặp TÌNH CỜ. Loại lỗi này gây chặn thật cho người dùng, nên phải **quét có hệ
// thống toàn bộ `java-backend`** thay vì chờ gặp lại.
//
// BẢNG ÁNH XẠ CHUẨN (nguồn: `scripts/system-route.mjs` và `UserManagementUseCase.canonicalRoleCode`):
//   engineer → ksda · commander → cht · project → da_nv · procurement → kh_nv · warehouse → thu_kho
//
// CẢNH BÁO VỀ NHIỄU: một số mã cũ cũng là tên hợp lệ ở ngữ cảnh khác — ví dụ `"warehouse"` có thể
// là **khoá module** trong ACTION_MODULE, còn `"project"` có thể là tên trường. Vì vậy công cụ này
// **PHÂN LOẠI** từng chỗ thay vì kết luận máy móc: chỗ nào nằm trong lời gọi `requireRole` thì
// nghi ngờ CAO, chỗ khác thì chỉ để xem xét.
//
//   node tools/probe-role-code-scan.mjs
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const LEGACY = { engineer: "ksda", commander: "cht", project: "da_nv", procurement: "kh_nv", warehouse: "thu_kho" };

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!["target", "node_modules", ".git"].includes(e.name)) walk(p, out); }
    else if (e.name.endsWith(".java")) out.push(p);
  }
  return out;
}

const files = walk(join(ROOT, "java-backend"));
const high = [];   // nghi ngờ CAO: nằm trong requireRole
const medium = []; // để xem xét: có ngữ cảnh vai trò
const low = [];    // chỉ nhắc trong chú thích

for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, "/");
  const lines = readFileSync(f, "utf8").split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const [legacy, canonical] of Object.entries(LEGACY)) {
      const re = new RegExp('"' + legacy + '"', "g");
      if (!re.test(line)) continue;
      const trimmed = line.trim();
      const isComment = /^(\/\/|\*|\/\*)/.test(trimmed);
      const rec = { rel, line: i + 1, legacy, canonical, text: trimmed.slice(0, 150) };
      if (isComment) low.push(rec);
      else if (line.includes("requireRole")) high.push(rec);
      else if (/role|Role/.test(line)) medium.push(rec);
      else low.push(rec);
    }
  });
}

console.log("═".repeat(90));
console.log("  QUÉT MÃ VAI TRÒ CŨ TRONG java-backend");
console.log("═".repeat(90));
console.log("  Số tệp .java đã quét: " + files.length);
console.log("  Ánh xạ chuẩn: " + Object.entries(LEGACY).map(([a, b]) => a + "→" + b).join(" · "));
console.log("");

const show = (title, arr, note) => {
  console.log("── " + title + " (" + arr.length + ") ──");
  if (note) console.log("   " + note);
  if (!arr.length) { console.log("   (không có)"); }
  else for (const r of arr) console.log("   " + r.rel + ":" + r.line + "  [" + r.legacy + "→" + r.canonical + "]  " + r.text);
  console.log("");
};

show("NGHI NGỜ CAO — dùng trong requireRole", high, "Đây là lỗi thật nếu là mã vai trò: người dùng quyền chuẩn sẽ bị 403.");
show("CẦN XEM XÉT — có ngữ cảnh vai trò", medium, "Có thể là so sánh vai trò, cũng có thể là tên trường/khoá module.");
show("CHỈ NHẮC TRONG CHÚ THÍCH / ngữ cảnh khác", low, "Thường vô hại; nội dung chú thích có thể là giải thích về lần sửa trước.");

console.log("═".repeat(90));
console.log(high.length === 0
  ? "  KẾT LUẬN: không còn chỗ nào dùng mã vai trò cũ trong requireRole ✅"
  : "  KẾT LUẬN: còn " + high.length + " chỗ NGHI NGỜ CAO — cần sửa ❌");
console.log("═".repeat(90));
process.exit(high.length === 0 ? 0 : 1);
