-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2, tiếp)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: thêm 2 bảng nữa chuyển sang `<DataTable>` trong `app/page.tsx` (cùng `TeamManagement` và
-- `ProjectManagement`), tiếp nối bảng "thành viên đã rời tổ đội" ở head `0116`:
--   • `ProjectManagement` — bảng "Tổ đội của dự án" (6 cột; `emptyText` lấy NGUYÊN VĂN từ khối `<Empty>`
--     cũ: "Dự án chưa có tổ đội.").
--   • `TeamManagement` — bảng "thành viên đang hoạt động" (8 cột, có nút "Hồ sơ ›"; `emptyText` nguyên văn
--     từ khối `<Empty>` cũ) và bảng "tồn kho theo vật tư" (`emptyText` "Kho chưa có tồn.").
--   Hai phép tính trước đây nằm trong thân `map` (`wh`, `members`) nay nằm trong `render` của đúng cột đó —
--   giữ nguyên công thức, chỉ đổi chỗ.
-- Kết quả đo: `DataTable` dùng thật **13 → 17 lần** · bảng tự viết **87 → 83 chỗ** · trạng thái rỗng tự viết
-- **88 → 85 chỗ**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='624193c1d2eb2fe6b4e652e3b431a53caf80a3f22037b96c1dd38f0404a8876e'
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
