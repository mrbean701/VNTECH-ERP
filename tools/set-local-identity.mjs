// VNTECH ERP — ĐỒNG BỘ HÀNG ĐỊNH DANH TRONG SQLITE CỤC BỘ (dùng cho việc đo TRƯỚC/SAU)
//
// VÌ SAO CẦN: `scripts/local-runtime.mjs:177` **từ chối khởi động** nếu hàng
// `vntech_product_identity.source_fingerprint` trong `.local-data/warehouse.sqlite` KHÁC với SSOT
// (`lib/vntech-identity-data.mjs`). Khi ta **tạm cất** thay đổi nguồn (git stash) để chụp ảnh
// "TRƯỚC", SSOT quay về giá trị cũ nhưng SQLite vẫn giữ giá trị mới ⇒ **server không lên** và mọi
// ảnh chụp trở thành ảnh trang lỗi (đã xảy ra thật 18/09/2026 — 4 ảnh chuẩn rác).
//
// Việc script làm ĐÚNG những gì migration định danh làm: DROP 2 trigger bảo vệ → UPDATE → tạo lại trigger.
// KHÔNG đụng tới dữ liệu nghiệp vụ. KHÔNG dùng cho bản phát hành — chỉ cho việc đo tại chỗ.
//
// Cách dùng:
//   node tools/set-local-identity.mjs                # lấy giá trị từ SSOT hiện tại (an toàn nhất)
//   node tools/set-local-identity.mjs ada2358d...    # ép về một fingerprint cũ (đo bản CŨ)
import { DatabaseSync } from "node:sqlite";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { VNTECH_IDENTITY_DATA } from "../lib/vntech-identity-data.mjs";

const HEX64 = /^[a-f0-9]{64}$/;
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dbPath = join(root, ".local-data", "warehouse.sqlite");

const wanted = process.argv[2] || VNTECH_IDENTITY_DATA.sourceFingerprint;
if (!HEX64.test(wanted)) {
  console.error("Fingerprint phải là 64 ký tự hex thường. Nhận được:", wanted);
  process.exit(64);
}
const short = `VNTECH-FP-${wanted.slice(0, 16).toUpperCase()}`;

const db = new DatabaseSync(dbPath);
const read = () => db.prepare("SELECT source_fingerprint, source_fingerprint_short FROM vntech_product_identity WHERE id='VNTECH-KHO-MEP-001'").get();
const before = read();
console.log("Trước:", before?.source_fingerprint_short, "| SSOT:", VNTECH_IDENTITY_DATA.sourceFingerprintShort);

if (before?.source_fingerprint === wanted) {
  console.log("Đã khớp — không cần sửa.");
  db.close();
  process.exit(0);
}

db.exec("DROP TRIGGER IF EXISTS vntech_product_identity_no_update");
db.exec("DROP TRIGGER IF EXISTS vntech_product_identity_no_delete");
db.prepare("UPDATE vntech_product_identity SET source_fingerprint=?, source_fingerprint_short=? WHERE id='VNTECH-KHO-MEP-001'").run(wanted, short);
db.exec(`CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_update
BEFORE UPDATE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;`);
db.exec(`CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_delete
BEFORE DELETE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;`);

const after = read();
if (after?.source_fingerprint !== wanted) {
  console.error("Sửa THẤT BẠI — vẫn là:", after?.source_fingerprint_short);
  process.exit(1);
}
console.log("Sau :", after.source_fingerprint_short, "· trigger bảo vệ đã tạo lại · KHỚP:", after.source_fingerprint === wanted);
db.close();
