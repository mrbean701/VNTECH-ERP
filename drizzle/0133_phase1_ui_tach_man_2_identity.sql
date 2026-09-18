-- VNTECH ERP V5.3.0 — KIẾN TRÚC / U-11 BƯỚC 3 (vòng 2): LÀM MỚI ĐỊNH DANH NGUỒN (tách thêm 4 màn)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: **bước 3 vòng 2 của `U-11`** — tách tiếp 4 màn đã **sạch phụ thuộc** (đo bằng
-- `tools/kiem-tra-phu-thuoc-man.mjs`: cột *"CÒN Ở page.tsx"* = **0**):
--   `app/screens/HrScreen.tsx` (9 dòng) · `DocumentsScreen` (12) · `ConstructionScreen` (25) · `LegalDocsScreen` (8).
--   • `app/page.tsx` **3767 → 3717 dòng** (luỹ kế từ 4037: **giảm 320 dòng**).
--   • **Một màn bị LOẠI khỏi lượt này và ghi rõ lý do (không đoán):** `FinanceRecoveryScreen` còn phụ thuộc
--     `reportRows` · `reportExport` · `reportPdf` · `printReport` (đang ở `page.tsx`) ⇒ nếu tách ngay sẽ tạo
--     **import vòng**; công cụ **từ chối ghi** nên nó KHÔNG bị đụng tới.
-- **Kiểm chứng:** `tsc` **EXIT 0** · eslint **0 error · 63 warning** ở `app/page.tsx` (nền 72 ⇒ giảm tiếp) ·
-- `npm run build` **EXIT 0** · **cổng ảnh 56 ảnh TRÙNG NHAU TỪNG BYTE** (`B7E70927…6530`) · `test:regression` **59/61**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='8e9ac6ff1d44bce6486d17d4d3a4dc17bd410a98a54662ea5b9982a78024f97d'
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
