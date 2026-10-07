// [DÙNG 1 LẦN · ERP-SESSION-01 · 07/10/2026] — Đồng bộ 4 trường vân tay trong
// `.local-data/warehouse.sqlite` cho khớp SSOT sau khi sửa `app/page.tsx`.
//
// ⛔ TUYỆT ĐỐI KHÔNG tạo `drizzle/*.sql` để ghi vân tay (DEC-20261006-015):
//    migration nằm trong `ROOT_DIRS` ⇒ ghi vân tay vào nó LÀM vân tay đổi ⇒ vòng lặp vô hạn.
// ⇒ Chỉ UPDATE trực tiếp 2 bảng metadata. Bảng được bảo vệ bằng trigger
//    `vntech_product_identity_no_update` ⇒ phải DROP trigger → UPDATE → CREATE lại trigger.
//
// Cách chạy:  node tools/_sync-identity-once.mjs <sourceShort> <sourceFull> <brandFull> <releaseFull>
import { DatabaseSync } from "node:sqlite";
import { readFileSync } from "node:fs";

const [, , shortF, fullF, brandF, releaseF] = process.argv;
if (!shortF || !fullF || !brandF || !releaseF) {
  console.error("Thiếu tham số: <short> <full> <brand> <release>");
  process.exit(1);
}

const DB = ".local-data/warehouse.sqlite";
const db = new DatabaseSync(DB);

// ⭐ ĐỌC SSOT TỪ `lib/vntech-identity-data.mjs` để không gõ tay (chống gõ sai).
const ssot = readFileSync("lib/vntech-identity-data.mjs", "utf8");
const lay = (khoa) => {
  const m = ssot.match(new RegExp(`${khoa}\\s*:\\s*"([^"]+)"`));
  return m ? m[1] : "";
};
const ssotFull = lay("sourceFingerprint");
const ssotShort = lay("sourceFingerprintShort");
const ssotBrand = lay("brandFingerprint");
const ssotRelease = lay("releaseFingerprint");

console.log("=== SSOT trong lib/vntech-identity-data.mjs ===");
console.log("   source :", ssotFull || "(khong doc duoc)", "|", ssotShort || "?");
console.log("   brand  :", (ssotBrand || "?").slice(0, 16) + "…");
console.log("   release:", (ssotRelease || "?").slice(0, 16) + "…");
console.log("");
console.log("=== THAM SO TRUYEN VAO ===");
console.log("   source :", fullF, "|", shortF);
console.log("   brand  :", brandF.slice(0, 16) + "…");
console.log("   release:", releaseF.slice(0, 16) + "…");
console.log("");

const can = ssotFull === fullF && ssotShort === shortF && ssotBrand === brandF && ssotRelease === releaseF;
if (!can) {
  console.error("⛔ THAM SO KHONG KHOP SSOT ⇒ KHONG GHI. Dung bang gia tri SSOT o tren.");
  process.exit(2);
}

const doc = db.prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name=?").all("vntech_product_identity_no_update");
if (doc.length) db.exec("DROP TRIGGER vntech_product_identity_no_update");

db.prepare("UPDATE vntech_product_identity SET source_fingerprint=?, source_fingerprint_short=? WHERE id=?").run(fullF, shortF, "VNTECH-KHO-MEP-001");
db.prepare("UPDATE vntech_trust_settings SET brand_fingerprint=?, release_fingerprint=? WHERE id=?").run(brandF, releaseF, "TRUST-ROOT");

if (doc.length) {
  db.exec(`CREATE TRIGGER vntech_product_identity_no_update BEFORE UPDATE ON vntech_product_identity
BEGIN SELECT RAISE(ABORT, 'VNTECH product identity is protected.'); END`);
}

console.log("=== DA GHI ===");
for (const r of db.prepare("SELECT id,source_fingerprint,source_fingerprint_short FROM vntech_product_identity").all()) {
  console.log("   ", r.id, r.source_fingerprint === fullF && r.source_fingerprint_short === shortF ? "KHOP" : "KHONG KHOP", r.source_fingerprint_short);
}
for (const r of db.prepare("SELECT id,brand_fingerprint,release_fingerprint FROM vntech_trust_settings").all()) {
  console.log("   ", r.id, r.brand_fingerprint === brandF && r.release_fingerprint === releaseF ? "KHOP" : "KHONG KHOP");
}
db.close();
console.log("");
console.log("Trigger bao ve:", doc.length ? "da tao lai" : "khong co san (khong can)");
