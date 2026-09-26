-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-10)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: **VÁ 3 NÚT CHẾT ở màn Danh mục vật tư** — phát hiện thật khi kiểm bất biến "khung không vượt viewport" (U-10).
--   • Khung modal cấp ứng dụng là chuỗi **36 nhánh** `{modal === "X" && <…/>}`. Nút ở `MaterialCatalogPage` gọi
--     `open("material")` — **KHÔNG hề có nhánh `modal === "material"`** ⇒ bấm **không có gì xảy ra**.
--   • Bằng chứng ĐO ĐƯỢC (không suy đoán): nút KHÔNG bị vô hiệu (`el.disabled === false`) nhưng
--     `document.querySelector('.modal,.drawer') === null` sau khi bấm ⇒ không khung nào mở ra.
--   • Ba chỗ đã sửa, trỏ về **nhánh có thật** `materialMaster` (`<MaterialModal data row={selected} …/>` — chính là
--     biểu mẫu vật tư mà màn Quản trị dùng cho CÙNG thực thể): `＋ Thêm vật tư` · `Sửa` · `Ngừng`.
--   • Đây là lớp lỗi **IM LẶNG**: không exception, không log, `tsc`/eslint đều xanh.
-- ⚠️ **Đây là bản vá SUY LUẬN CÓ CĂN CỨ** (nút ghi rõ "Thêm/Sửa/Ngừng vật tư" + đã có sẵn biểu mẫu vật tư dùng
-- chung) — **cần anh xác nhận lại luồng** khi test tay (Known Problem #90).
-- ➕ CỔNG MỚI `tools/probe-modal-branch-coverage.mjs`: quét mọi `open("X")` ↔ mọi `modal === "X"`, chặn vĩnh viễn
-- lớp lỗi "nút chết"; có 2 phép **đối chứng dương** (≥ 20 nhánh · ≥ 15 tên) để không bao giờ in kết luận rỗng.
-- ➕ CỔNG ẢNH nay **đo bất biến khung**: mở modal/drawer ở 4 kích thước, đo `getBoundingClientRect()` và **TỪ CHỐI ĐẠT**
-- nếu khung tràn khung nhìn, hoặc nội dung cao hơn thân khung mà thân khung không cuộn được; thêm 3 màn mẫu
-- `11-modal-request` (9? đo thật: laptop 219,19 → 1147,749 trong 1366×768 · tablet 22,26 → 746,998 trong 768×1024 ·
-- phone 0,1 → 390,844 trong 390×844) · `12-drawer-request-detail` · `13-modal-material`.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='aac82e62564ab037fefd570c71eaa56b4c53acc4bd0369248846c5fe7a802d8b'
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
