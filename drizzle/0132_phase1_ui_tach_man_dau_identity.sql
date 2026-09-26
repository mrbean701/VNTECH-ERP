-- VNTECH ERP V5.3.0 — KIẾN TRÚC / U-11 BƯỚC 3: LÀM MỚI ĐỊNH DANH NGUỒN (tách 6 MÀN ra `app/screens/`)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: **bước 3 của `U-11`** — sau khi lô 1 + lô 2 đưa hết helper/kiểu dữ liệu dùng chung sang `lib/ui-shared.tsx`,
-- **6 màn đầu tiên không còn phụ thuộc nào vào `page.tsx`** (đo bằng `tools/kiem-tra-phu-thuoc-man.mjs`: cột
-- *"CON O page.tsx"* = **0**) ⇒ đã tách thành tệp riêng:
--   `app/screens/SealScreen.tsx` (7 dòng) · `CorrespondenceScreen` (8) · `BenefitsScreen` (9) · `LaborScreen` (10) ·
--   `SiteCostScreen` (12) · `CashbankScreen` (15).
--   • `app/page.tsx` **3822 → 3767 dòng** (luỹ kế từ 4037: **giảm 270 dòng**).
--   • **Câu import trong mỗi tệp màn do CÔNG CỤ SINH TỰ ĐỘNG** (`--out=app/screens/<Tên>.tsx`), ví dụ `SealScreen.tsx`
--     nhận đúng 4 câu: `StatusBadge` (từ `@/app/components/ui`) · `CardHead, Empty, date` (từ `@/lib/ui-shared`) ·
--     `type AppData, Row` · `FormEvent` (từ `react`). Công cụ vẫn **từ chối ghi** nếu còn phụ thuộc khối không chuyển.
--   • `page.tsx` nay **import lại** màn từ tệp mới (`import { SealScreen } from "@/app/screens/SealScreen";` …).
-- **Kiểm chứng:** `tsc` **EXIT 0** · eslint **0 error** (`app/page.tsx` **65 warning** — **giảm** so với nền 72 vì các
-- cảnh báo "tham số không dùng" đi theo màn sang tệp mới) · `npm run build` **EXIT 0** ·
-- **cổng ảnh 56 ảnh TRÙNG NHAU TỪNG BYTE** (`B7E70927…6530`) · `test:regression` **59/61 (đúng nền)**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='2002bed16de89a0bced2fd62ce903515ecf6ec44d5a789ebb2c943e1cb92a976'
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
