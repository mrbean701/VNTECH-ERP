-- VNTECH ERP V5.3.0 — KIẾN TRÚC / U-11 BƯỚC 3 (vòng 5): LÀM MỚI ĐỊNH DANH NGUỒN
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: **bước 3 vòng 5 của `U-11`** — mở khoá rồi tách 2 màn còn nặng phụ thuộc:
--   • Chuyển **14 khối** sang `lib/ui-shared.tsx`: `mapBoqPriceRows` (35 dòng) · `normalizeBoqSystemCode` ·
--     `boqSystemName` · `boqControlQty` · `mapPaymentRows` · `paymentExportRows` · `exportPaymentsXlsx` ·
--     `exportPaymentsCsv` · `downloadPaymentsPdf` · `moneyBillion` · `downloadPoPlanningTemplate` ·
--     `downloadBlankPoPlanningTemplate` · **`poRemainingItems`** · **`DEFAULT_PO_ETA`**.
--     *(Hai khối cuối là **phụ thuộc bắc cầu** — công cụ **TỪ CHỐI GHI** ở lần chạy đầu vì thiếu chúng,
--     nên đã bổ sung rồi chạy lại: đúng cơ chế «không đoán, chỉ chuyển khi đủ».)*
--   • Tách **2 màn**: `app/screens/Purchasing.tsx` (Mua hàng & PO) và `app/screens/Payments.tsx` (Thanh toán).
--   • `app/page.tsx` **3517 → 3435 dòng** (luỹ kế từ 4037: **giảm 602 dòng**); `app/screens/` nay có **16 màn**.
-- ⚠️ **HAI LỖI CỦA CÔNG CỤ LỘ RA Ở VÒNG NÀY VÀ ĐÃ VÁ (ghi lại):**
--   (1) Khối chuyển đi **giữ tiền tố `export `** ⇒ tệp đích vừa `export function X` vừa được trailer `export { X }`
--       ⇒ `tsc` báo **`TS2323`/`TS2484: Cannot redeclare exported variable`** ⇒ vá: **bỏ tiền tố `export`** khi chuyển.
--   (2) Import cũ của tệp đích được giữ theo **so khớp cả dòng** nên hai dòng cùng module với danh sách tên khác nhau
--       **cùng tồn tại** ⇒ `tsc` báo **`TS2300: Duplicate identifier`** ⇒ vá: **gộp import theo ĐÚNG đặc tả module**.
--   (3) Script sửa của tôi sau đó **xoá nhầm toàn bộ import** của tệp đích (đã khôi phục có kiểm chứng) và
--       **để chú thích `eslint-disable` lệch khỏi `type Row`** ⇒ eslint báo `Unused eslint-disable directive` + 1 error
--       ⇒ đã đưa chú thích về đúng vị trí. **Mọi lỗi đều bị cổng bắt, không lọt vào bản chạy.**
-- **Kiểm chứng:** `tsc` **EXIT 0** · eslint **0 error** (`page.tsx` 78 warning · `ui-shared` 2 · `app/screens` 20) ·
-- `npm run build` **EXIT 0** · `test:regression` **59/61**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='a8e02745c0d5c52896c9057df0c5d187e79881535c10914438e5b03a42f22d08'
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
