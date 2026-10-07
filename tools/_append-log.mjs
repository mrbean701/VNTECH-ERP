// [DÙNG 1 LẦN · ERP-SESSION-01 · 07/10/2026] — Nối khối Markdown đã viết sẵn vào cuối
// một tệp log mà KHÔNG làm hỏng tiếng Việt.
//
// ⛔ VÌ SAO KHÔNG DÙNG PowerShell: `Out-File`/`Add-Content` trong pwsh của DSH hay ghi
//    sai encoding (UTF-8 không BOM vs BOM) và làm HỎNG dấu tiếng Việt đã có trong tệp.
// ⇒ Node đọc/ghi UTF-8 nguyên vẹn.
//
// ⛔ TÍNH TRẠNG AN TOÀN: script CHỈ nối thêm vào cuối tệp (append), KHÔNG ghi đè dòng nào.
//    Có backup `.bak` trước khi ghi. Nếu tệp đã chứa nội dung thì báo `ALREADY_PRESENT` và
//    KHÔNG ghi (chống chạy 2 lần làm trùng).
//
// Cách chạy:  node tools/_append-log.mjs <tệp đích> <tệp khối cần nối>
import { readFileSync, writeFileSync, copyFileSync, existsSync } from "node:fs";

const [, , dich, khoi] = process.argv;
if (!dich || !khoi) {
  console.error("Thieu tham so: <tep dich> <tep khoi>");
  process.exit(1);
}

const vanDich = readFileSync(dich, "utf8");
const vanKhoi = readFileSync(khoi, "utf8");

// ⭐ CHỐNG TRÙNG: lấy tiêu đề đầu tiên của khối (dòng `## XXX-NNN`).
const tieuDe = (vanKhoi.match(/^##\s+\S+-\d+-\d+.*$/m) || [""])[0].trim();
if (!tieuDe) {
  console.error("⛔ Khoi khong co tieu de `## <PREFIX>-YYYYMMDD-NNN` ⇒ KHONG ghi.");
  process.exit(2);
}
if (vanDich.includes(tieuDe)) {
  console.log(`⏭  DA CO: "${tieuDe}" ⇒ KHONG ghi lai (chong trung).`);
  process.exit(0);
}

const bak = `${dich}.bak-append-${Date.now()}`;
copyFileSync(dich, bak);
console.log("   BACKUP:", bak);

// ⭐ Chuẩn hoá: tệp đích phải kết thúc bằng 1 dòng trống rồi nối khối.
let moi = vanDich.replace(/\s*$/, "\n\n") + vanKhoi.replace(/^\s*\n/, "");
writeFileSync(dich, moi, "utf8");

console.log(`✅ DA NOI "${tieuDe}" vao ${dich}`);
console.log("   truoc :", vanDich.split("\n").length, "dong");
console.log("   sau   :", moi.split("\n").length, "dong");
