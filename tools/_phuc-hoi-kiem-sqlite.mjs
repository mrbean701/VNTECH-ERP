// [PHỤC HỒI] Kiểm SQLite `.local-data/warehouse.sqlite` xem 2 phiếu đã mất ở MySQL có nguyên vẹn ở đây không.
// Nếu CÓ ⇒ ta có NGUYÊN BẢN GHI để khôi phục (không suy đoán).
import { DatabaseSync } from "node:sqlite";
const db = new DatabaseSync(".local-data/warehouse.sqlite");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%goods_receipt%'").all();
console.log("bảng liên quan:", tables.map((t) => t.name).join(", ") || "(không có)");
if (!tables.some((t) => t.name === "goods_receipts")) { console.log("⇒ SQLite này KHÔNG có bảng goods_receipts."); process.exit(0); }
const ids = ["GRN_1792713f-faaf-4986-b8c3-9c32714cea28", "GRN_e5f9763c-cacf-4e4e-8dec-0f077a619aee"];
for (const id of ids) {
  const row = db.prepare("SELECT * FROM goods_receipts WHERE id=?").get(id);
  console.log(`\n--- ${id} ---`);
  console.log(row ? JSON.stringify(row, null, 1) : "  KHÔNG CÓ trong SQLite");
}
console.log("\n=== mọi phiếu nhập của PO PO_0843c57c-8531-483a-919e-d99712e3da9e trong SQLite ===");
const rows = db.prepare("SELECT id, receipt_no, bch_confirmation_status, received_at FROM goods_receipts WHERE purchase_order_id=?").all("PO_0843c57c-8531-483a-919e-d99712e3da9e");
console.log(rows.length ? JSON.stringify(rows, null, 1) : "  (không có)");
console.log("\n=== tổng số dòng goods_receipts trong SQLite ===");
console.log(db.prepare("SELECT COUNT(*) AS n FROM goods_receipts").get().n);
