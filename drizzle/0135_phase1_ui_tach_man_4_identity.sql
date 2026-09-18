-- VNTECH ERP V5.3.0 — KIẾN TRÚC / U-11 BƯỚC 3 (vòng 4): LÀM MỚI ĐỊNH DANH NGUỒN
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: **bước 3 vòng 4 của `U-11`** — đúng thứ tự «đo phụ thuộc → chuyển phụ thuộc → tách màn»:
--   • Chuyển **12 khối helper xuất/nhập báo cáo** sang `lib/ui-shared.tsx`:
--     `deliveredExportRows` · `exportDeliveredXlsx` · `exportDeliveredCsv` · `downloadDeliveredPdf` ·
--     `downloadTabularPdf` · `printTabularReport` · **`AttachmentPanel`** (khối giao diện) ·
--     `inventoryExportRows` · `exportInventoryXlsx` · `printInventoryBarcodes` · `printInventoryLedger` · `code39Svg`.
--   • Tách tiếp **2 màn**: `app/screens/Delivered.tsx` (Đơn hàng đã giao) và `app/screens/Inventory.tsx`
--     (Tồn kho & điều chuyển, 27 dòng).
--   • `app/page.tsx` **3585 → 3517 dòng** (luỹ kế từ 4037: **giảm 520 dòng**).
-- **Kiểm chứng:** `tsc` **EXIT 0** · eslint **0 error** (`page.tsx` 72 warning · `ui-shared` 2 · `app/screens` 19) ·
-- `npm run build` **EXIT 0** · `test:regression` **59/61** · UI/proxy/Java **HTTP 200**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='7695d967d6bdae346730665d1e6e98d192b84191fda1285b9c1c4462c28a3209'
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
