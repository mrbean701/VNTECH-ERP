// GO-LIVE 05/10/2026 — CÔNG CỤ THƯỜNG TRỰC: CHỤP & SO SỐ DÒNG CẢ SCHEMA (kỷ luật «KIỂM HẬU QUẢ»).
//
// ⭐ VÌ SAO CÓ CÔNG CỤ NÀY: mọi thí nghiệm trên **hệ thống thật** đều phải có bước **KIỂM HẬU QUẢ** —
//   chạy xong ⛔ không được coi là xong, phải **đo lại trạng thái** để chắc mình không gây hại.
//   Công cụ này chụp số dòng của **toàn bộ bảng** rồi so lại, nên phát hiện được **BẤT KỲ** bảng nào
//   thay đổi — ⛔ không cần biết trước bảng đích (bài học: suy bảng đích từ mã đã **thất bại** vì
//   use case gọi `store.insertXxx`, ⛔ không có `INSERT INTO` tường minh).
//
// CÁCH DÙNG (2 bước, ⛔ không được đổi thứ tự):
//   node tools/e2e/chup-so-dong.mjs --truoc     # chụp TRƯỚC khi chạy thí nghiệm
//   ... chạy thí nghiệm ...
//   node tools/e2e/chup-so-dong.mjs --sau       # chụp SAU và IN RA bảng nào đổi
//
// ⓘ Tăng ở bảng `sessions` là **bình thường** khi thí nghiệm có đăng nhập (phiên của chính bạn).
import { spawnSync } from "node:child_process";
import { writeFileSync, readFileSync, existsSync, unlinkSync } from "node:fs";

const MYSQL = "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe";
const TEP = "tools/e2e/.snapshot-so-dong.json";

const chay = (sql) => {
  const r = spawnSync(MYSQL, ["-u", "vntech", "-pvntech", "--default-character-set=utf8mb4", "vntech_erp", "-N", "-B", "-e", sql], { encoding: "utf8" });
  return (r.stdout || "").split("\n").map((l) => l.trim()).filter((l) => l && !/Warning.*password/.test(l));
};

const chep = process.argv.includes("--truoc") ? "truoc" : process.argv.includes("--sau") ? "sau" : null;
if (!chep) {
  console.log("CÁCH DÙNG: node tools/e2e/chup-so-dong.mjs --truoc | --sau");
  process.exit(1);
}

const bang = chay("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA='vntech_erp' AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME;");
const dem = {};
for (const b of bang) {
  const r = chay(`SELECT COUNT(*) FROM \`${b}\`;`);
  dem[b] = r.length ? Number(r[0]) : -1;
}
const tong = Object.values(dem).reduce((a, b) => a + (b > 0 ? b : 0), 0);

if (chep === "truoc") {
  if (existsSync(TEP)) {
    console.log(`⛔ ĐÃ CÓ snapshot cũ (${TEP}) — hãy chạy \`--sau\` trước, hoặc xoá tệp nếu snapshot cũ đã bỏ.`);
    process.exit(1);
  }
  writeFileSync(TEP, JSON.stringify(dem), "utf8");
  console.log(`ĐÃ CHỤP TRƯỚC · ${bang.length} bảng · tổng ${tong} dòng`);
  console.log(`   (ghi ${TEP} — chạy \`--sau\` khi thí nghiệm xong)`);
} else {
  if (!existsSync(TEP)) {
    console.log(`⛔ CHƯA có snapshot TRƯỚC (${TEP}) — phải chạy \`--truoc\` trước thí nghiệm.`);
    process.exit(1);
  }
  const truoc = JSON.parse(readFileSync(TEP, "utf8"));
  const tongTruoc = Object.values(truoc).reduce((a, b) => a + (b > 0 ? b : 0), 0);
  const doi = bang.filter((b) => (truoc[b] ?? 0) !== dem[b]);
  console.log(`SO SÁNH SAU · ${bang.length} bảng · tổng ${tongTruoc} → ${tong}`);
  if (!doi.length) {
    console.log("   ✔ KHÔNG bảng nào đổi số dòng ⇒ thí nghiệm ⛔ không tạo/mất dữ liệu.");
  } else {
    console.log(`   ĐỔI ở ${doi.length} bảng:`);
    for (const b of doi) console.log(`      ${b.padEnd(42)} ${String(truoc[b] ?? 0).padStart(7)} → ${String(dem[b]).padStart(7)}  ${dem[b] > (truoc[b] ?? 0) ? "⬆ TĂNG" : "⬇ GIẢM"}`);
    console.log("   ⓘ Tăng ở `sessions` là BÌNH THƯỜNG khi thí nghiệm có đăng nhập (phiên của chính bạn).");
    console.log("   ⓘ Tăng ở `audit_logs` cũng BÌNH THƯỜNG: đây là SỔ GHI VẾT CHỈ-THÊM, mỗi lệnh gọi API");
    console.log("     (kể cả lệnh ĐỌC) đều được ghi lại ⇒ ⛔ không phải dấu hiệu hỏng dữ liệu.");
    console.log("     ⭐ Muốn chắc: đọc vài dòng mới nhất — `action` phải khớp đúng các action bạn vừa gọi.");
    console.log("   ⛔ Mọi bảng KHÁC tăng ⇒ phải tìm bản ghi đó và DỌN SẠCH trước khi kết luận.");
  }
  unlinkSync(TEP);
  console.log(`   (đã xoá ${TEP})`);
}
