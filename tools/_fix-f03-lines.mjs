// [DÙNG 1 LẦN · ERP-SESSION-01 · 08/10/2026] — Cập nhật CỘT SỐ DÒNG trong hồ sơ audit F-03
// cho khớp mã nguồn THẬT sau khi PA-1 thêm khối chú thích vào `SystemController.java`.
//
// ⛔ VÌ SAO PHẢI CẬP NHẬT: `tests/f03-tai-chinh-audit-deps.test.mjs` khẳng định mỗi dòng trong
//   bảng hồ sơ phải trỏ ĐÚNG dòng chứa `action === "…"` (JS) và `case "…"` (Java).
//   PA-1 thêm 16 dòng chú thích ⇒ MỌI `case` sau đó dịch xuống 16 ⇒ hồ sơ thành CŨ ⇒ test đỏ.
//   §22: tài liệu phải khớp mã thật — sửa TÀI LIỆU, ⛔ không nới test.
//
// ⚠️ BẢN 2 — SỬA LỖI CỦA BẢN 1: regex bản 1 khớp `(\|\s*…)` rồi `:(\d+)`, nhưng khi GHI LẠI
//   đã ⛔ BỎ MẤT dấu `:` của cột JS (`| :1382 |` → `| 1382 |`) ⇒ regex của test
//   (`\|\s*:(\d+)\s*\|\s*:(\d+)`) khớp **0 dòng**. Nay gom dấu `:` vào NHÓM bắt để giữ nguyên khuôn.
//
// ⛔ DÙNG NODE (⛔ không PowerShell): tệp nhiều tiếng Việt; `Out-File`/`-replace` của pwsh hay
//   ghi sai encoding và làm hỏng dấu (bài học ghi ở `tools/_append-log.mjs`).
import { readFileSync, writeFileSync, copyFileSync, readdirSync, statSync } from "node:fs";

const DOC = "docs/agent-progress/F-03-TAI-CHINH-AUDIT-PHU-THUOC.md";
const JS_ROUTE = "scripts/system-route.mjs";
const JAVA_CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";

// ── Bước 0: KHÔI PHỤC từ bản `.bak` MỚI NHẤT (bản 1 đã làm hỏng khuôn cột JS) ────────────
const dir = DOC.slice(0, DOC.lastIndexOf("/"));
const baks = readdirSync(dir)
  .filter((n) => n.startsWith("F-03-TAI-CHINH-AUDIT-PHU-THUOC.md.bak-f03-"))
  .map((n) => `${dir}/${n}`)
  .sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs);
if (baks.length) {
  copyFileSync(baks[0], DOC);
  console.log(`↩️  Khôi phục hồ sơ từ backup: ${baks[0].split("/").pop()}`);
} else {
  console.log("ℹ️  Không có backup — thao tác trực tiếp trên tệp hiện tại.");
}

const doc = readFileSync(DOC, "utf8");
const jsLines = readFileSync(JS_ROUTE, "utf8").split(/\r?\n/);
const javaLines = readFileSync(JAVA_CTRL, "utf8").split(/\r?\n/);

/** Số dòng (1-based) đầu tiên chứa `needle`. */
const lineOf = (lines, needle) => {
  const at = lines.findIndex((l) => l.includes(needle));
  return at < 0 ? 0 : at + 1;
};

let doi = 0;
const khongThay = [];
// KHUÔN GỐC: `| 3 | \`save_x\` | :1354 | :595 |` — dấu `:` nằm TRONG nhóm bắt (dau / giua).
const moi = doc.replace(
  /^(\|\s*\d+\s*\|\s*`([a-z_]+)`\s*\|\s*:)(\d+)(\s*\|\s*:)(\d+)(\s*\|)/gm,
  (nguyen, dau, action, jsCu, giua, javaCu, cuoi) => {
    const jsMoi = lineOf(jsLines, `action === "${action}"`);
    const javaMoi = lineOf(javaLines, `case "${action}"`);
    if (!jsMoi || !javaMoi) {
      khongThay.push(`${action} (js=${jsMoi} java=${javaMoi})`);
      return nguyen;
    }
    if (Number(jsCu) !== jsMoi || Number(javaCu) !== javaMoi) {
      doi += 1;
      console.log(`  ↻ ${action.padEnd(28)} JS :${jsCu}→:${jsMoi} · JAVA :${javaCu}→:${javaMoi}`);
    }
    return `${dau}${jsMoi}${giua}${javaMoi}${cuoi}`;
  },
);

if (khongThay.length) {
  console.error(`⛔ ${khongThay.length} action KHÔNG tìm thấy trong mã ⇒ DỪNG, không ghi:`);
  for (const k of khongThay) console.error("   ·", k);
  process.exit(2);
}
if (moi === doc) {
  console.log("⏭  Hồ sơ đã khớp mã thật — không cần ghi.");
  process.exit(0);
}
// ── Kiểm khuôn TRƯỚC KHI GHI: phải còn ≥20 dòng khớp regex CỦA TEST (⛔ không tự tin mù) ──
const soDong = [...moi.matchAll(/^\|\s*\d+\s*\|\s*`([a-z_]+)`\s*\|\s*:(\d+)\s*\|\s*:(\d+)\s*\|/gm)].length;
if (soDong < 20) {
  console.error(`⛔ Sau khi sửa chỉ còn ${soDong} dòng khớp khuôn của test (phải ≥ 20) ⇒ DỪNG, không ghi.`);
  process.exit(3);
}

copyFileSync(DOC, `${DOC}.bak-f03b-${Date.now()}`);
writeFileSync(DOC, moi, "utf8");
console.log(`✅ Đã cập nhật ${doi} dòng · khuôn còn khớp ${soDong} dòng (regex của test) ⇒ đã ghi ${DOC}`);
