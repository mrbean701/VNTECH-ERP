-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2, tiếp 6)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: chuyển **bảng thông tin dự án của tổ đội** (`TeamManagement`, 6 cột) sang `<DataTable>` — bảng thứ 13.
--   • Bảng cũ render **đúng một dòng** khi có dự án (`{proj ? <tr>…</tr> : <tr><Empty/></tr>}`) ⇒ nay
--     `rows={proj ? [proj] : []}` + `emptyText` **nguyên văn**: "Tổ đội chưa gắn dự án nào."
--   • Cột cuối trả **chuỗi cố định** "Thi công / cấp phát vật tư" (nguyên văn), không có biến.
--   • Viết theo đúng cách đã ghi ở mục 3c của `TASK-083.md`: **khoảng trắng sau `=>`**, cột chuỗi trả thẳng.
-- Kết quả đo: `DataTable` dùng thật **25 → 26 lần** · bảng tự viết **75 → 74 chỗ** · trạng thái rỗng tự viết
-- **78 → 77 chỗ**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='30ee365d549ad7d482a97a4757ad03fae43ed86d7b995063a6ea7eee6703d1c5'
WHERE id='VNTECH-KHO-MEP-001';
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_update
BEFORE UPDATE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
--> statement-breakpoint
CREATE TRIGGER IF NOT EXISTS vntech_product_identity_no_delete
BEFORE DELETE ON vntech_product_identity
BEGIN
  SELECT RAISE(ABORT, 'VNTECH product identity is protected.');
END;
