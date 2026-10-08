// DÒ MIGRATION **SẮP CHẠY** MÀ ⛔ KHÔNG IDEMPOTENT — ⭐ chặn TÁI PHÁT `BUG-20261008-011`
//
// ⭐ VÌ SAO CÓ TỆP NÀY (⭐ trả giá thật, ⛔ không phải lo xa):
//   Ngày 08/10/2026 lúc rebuild: `V39__session02_stock_reservation_issue_id.sql` chạy
//   `ALTER TABLE stock_reservations ADD COLUMN issue_id …` trên một CSDL **đã có cột đó**
//   ⇒ MySQL lỗi **1060 `Duplicate column name`** (⚠️ MySQL ⛔ **KHÔNG có** `ADD COLUMN IF NOT EXISTS`)
//   ⇒ Flyway đánh dấu migration **FAILED** trong `flyway_schema_history` ⇒ ⭐ **Spring Boot ⛔ TỪ CHỐI KHỞI ĐỘNG**
//   ⇒ 🔴 **CẢ HỆ THỐNG DOWN**, ⚠️ kể cả jar CŨ cũng ⛔ không chạy được.
//
// ⭐ CÁCH DÙNG (⭐ chỉ ĐỌC — ⛔ không sửa gì, ⛔ không ghi CSDL):
//   node tools/check-migration-idempotency.mjs
//   ⇒ In ra: những migration **CHƯA có trong `flyway_schema_history`** (⭐ tức sẽ chạy ở lần khởi động tới)
//     và trong đó câu nào ⛔ **không chịu được môi trường đã có sẵn đối tượng** ✓
//
// ⚠️ GIỚI HẠN CÓ Ý (⭐ nói rõ để ⛔ không tin quá mức):
//   · Đây là **dò TĨNH theo mẫu câu** — ⛔ không thay thế việc chạy thử trên CSDL bản sao.
//   · ⛔ Không đánh giá migration ĐÃ ÁP DỤNG (chúng đã chạy xong, ⛔ không còn rủi ro ở lần khởi động tới).
//   · "Có guard" được nhận diện thô (có `IF NOT EXISTS` / `INFORMATION_SCHEMA` / `PROCEDURE` / `PREPARE`).

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

// ⚠️ Bài học nhỏ: `new URL(...).pathname` trên Windows trả đường dẫn **đã mã hoá** (`%20` cho dấu cách)
//    ⇒ ⛔ `readdirSync` báo ENOENT. ⭐ Phải dùng `fileURLToPath` ✓
const ROOT = fileURLToPath(new URL("..", import.meta.url));
const MIG_DIR = join(ROOT, "java-backend/infrastructure/src/main/resources/db/migration");
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";

/** Câu DDL ⛔ KHÔNG chịu được khi đối tượng ĐÃ tồn tại (⚠️ MySQL ⛔ không có `IF NOT EXISTS` cho các câu này). */
const MAU_RUI_RO = [
  { ten: "ADD COLUMN", re: /ALTER\s+TABLE[\s\S]*?ADD\s+COLUMN(?!\s+IF\s+NOT\s+EXISTS)/i },
  { ten: "CREATE INDEX", re: /CREATE\s+(?:UNIQUE\s+)?INDEX(?!\s+IF\s+NOT\s+EXISTS)/i },
  { ten: "CREATE TABLE", re: /CREATE\s+TABLE(?!\s+IF\s+NOT\s+EXISTS)/i },
  { ten: "ADD CONSTRAINT", re: /ADD\s+CONSTRAINT/i },
];
/** Dấu hiệu TỆP ĐÃ TỰ BẢO VỆ (⭐ chỉ cần có 1 trong các dấu hiệu này). */
const DAU_HIEU_GUARD = [/IF\s+NOT\s+EXISTS/i, /INFORMATION_SCHEMA/i, /CREATE\s+PROCEDURE/i, /PREPARE\s+/i, /DROP\s+PROCEDURE/i];

const boComment = (sql) => sql.split("\n").map((l) => { const i = l.indexOf("--"); return i >= 0 ? l.slice(0, i) : l; }).join("\n");

/** Version đã áp dụng: đọc `flyway_schema_history` (⭐ chỉ ĐỌC). */
function daApDung() {
  try {
    const out = execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp",
      "-e", "SELECT version FROM flyway_schema_history WHERE success=1;"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    return new Set(out.split("\n").map((s) => s.trim()).filter(Boolean));
  } catch {
    return null; // ⚠️ không đọc được CSDL ⇒ vẫn dò được, chỉ ⛔ không lọc được "sắp chạy"
  }
}

const daCo = daApDung();
// ⭐ `--tat-ca`: quét **MỌI** tệp (⛔ không chỉ tệp đang chờ) — ⭐ dùng để **ĐỐI CHỨNG ÂM**:
//   phải chỉ ra được `V39` (ca THẬT đã làm sập hệ thống) ⇒ ⭐ chứng minh phép dò **CÓ THỂ ĐỎ**, ⛔ không phải "xanh giả" ✓
const TAT_CA = process.argv.includes("--tat-ca");
const tep = readdirSync(MIG_DIR).filter((f) => /^V\d+.*\.sql$/.test(f)).sort((a, b) => {
  const so = (s) => parseInt((s.match(/^V(\d+)/) || [])[1] || "0", 10);
  return so(a) - so(b);
});
const chuaChay = TAT_CA ? tep : (daCo ? tep.filter((f) => !daCo.has((f.match(/^V(\d+)/) || [])[1])) : tep);

console.log("═".repeat(78));
console.log("  DÒ MIGRATION SẮP CHẠY MÀ ⛔ KHÔNG IDEMPOTENT (⭐ chặn tái phát BUG-20261008-011)");
console.log("═".repeat(78));
console.log(`  Tổng tệp migration      : ${tep.length}`);
console.log(`  Đã áp dụng (history)    : ${daCo ? tep.length - chuaChay.length : "⛔ KHÔNG ĐỌC ĐƯỢC CSDL"}`);
console.log(`  ⭐ SẼ CHẠY ở lần tới     : ${chuaChay.length}`);
console.log("");

let ruiRo = 0;
for (const f of chuaChay) {
  const sql = boComment(readFileSync(join(MIG_DIR, f), "utf8"));
  const coGuard = DAU_HIEU_GUARD.some((r) => r.test(sql));
  const dinh = MAU_RUI_RO.filter((m) => m.re.test(sql)).map((m) => m.ten);
  if (dinh.length && !coGuard) {
    ruiRo++;
    console.log(`  ⚠️ ${f}  ⇒ ${dinh.join(" · ")}  ⛔ KHÔNG có guard`);
    console.log(`     ⚠️ Nếu CSDL đã có đối tượng đó ⇒ MySQL lỗi 1060/1050 ⇒ Flyway FAILED ⇒ 🔴 BACKEND DOWN`);
  }
}
console.log("");
if (chuaChay.length === 0) console.log("  ✅ ⛔ KHÔNG có migration nào đang chờ ⇒ hiện ⛔ không có rủi ro loại này ✓");
else if (ruiRo === 0) console.log("  ✅ Mọi migration đang chờ đều có guard / không dùng câu rủi ro ✓");
else console.log(`  ⚠️ ${ruiRo}/${chuaChay.length} migration đang chờ CÓ RỦI RO ⇒ ⭐ cách sửa: bọc bằng INFORMATION_SCHEMA (MySQL ⛔ không có IF NOT EXISTS cho ADD COLUMN/CREATE INDEX)`);
console.log("");
console.log("  📌 TỆP NÀY ⛔ KHÔNG sửa gì và ⛔ KHÔNG ghi CSDL — chỉ đọc và báo cáo ✓");
process.exitCode = ruiRo > 0 ? 2 : 0;
