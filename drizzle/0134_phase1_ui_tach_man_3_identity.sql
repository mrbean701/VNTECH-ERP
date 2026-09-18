-- VNTECH ERP V5.3.0 — KIẾN TRÚC / U-11 BƯỚC 3 (vòng 3): LÀM MỚI ĐỊNH DANH NGUỒN
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: **bước 3 vòng 3 của `U-11`** — lô này tách màn **LỚN NHẤT từ trước tới nay** ra khỏi `page.tsx`:
--   • `app/screens/TeamManagement.tsx` — **120 dòng** (màn Tổ đội: danh sách tổ đội + chi tiết + thành viên + tồn kho).
--   • `app/screens/Receiving.tsx` — 8 dòng (Kế hoạch giao hàng).
--   • `lib/ui-shared.tsx` — thêm **`UI_TODAY`** (hằng ngày nghiệp vụ) vì `Receiving` cần nó, và hằng này
--     trước đây nằm ở `page.tsx` ⇒ nếu không chuyển thì tách `Receiving` sẽ tạo **import vòng**.
--   • `app/page.tsx` **3717 → 3585 dòng** (luỹ kế từ 4037: **giảm 452 dòng**).
--   • Đo bằng `tools/kiem-tra-phu-thuoc-man.mjs` TRƯỚC khi tách: `TeamManagement` có *"CÒN Ở page.tsx" = **0***;
--     `Receiving` chỉ còn **1** phụ thuộc (`UI_TODAY`) ⇒ chuyển hằng đó rồi mới tách (đúng thứ tự, không đoán).
-- ⚠️ **HAI LỖI CỦA CÔNG CỤ ĐÃ LỘ RA VÀ ĐÃ VÁ TRONG LÔ NÀY (ghi lại):**
--   (1) Khi ghi lại tệp đích ở lần chạy sau, công cụ **XOÁ MẤT các câu `import` đã sinh ở lần trước** nếu lần này
--       không cần import mới (`TS2304: Cannot find name 'FormFieldConfig'/'ReactNode'`) ⇒ đã vá: **giữ lại** import cũ
--       và hợp nhất với import mới.
--   (2) Đoạn "giữ nội dung cũ" cắt từ **dòng khai báo đầu tiên** nên **rơi mất chú thích ngay trên nó** — cụ thể là
--       `// eslint-disable-next-line @typescript-eslint/no-explicit-any` của `type Row` ⇒ eslint báo **1 error**
--       (đây là **lần thứ HAI** lỗi này xuất hiện) ⇒ đã vá: **kéo theo cả dòng chú thích liền trên** khai báo đầu tiên.
--       Chú thích bị rơi đã được khôi phục lại trong tệp.
-- **Kiểm chứng:** `tsc` **EXIT 0** · eslint **0 error** (`page.tsx` 62 warning · `app/screens` 19 warning ·
-- `lib/ui-shared.tsx` **0 vấn đề**) · `npm run build` **EXIT 0** · `test:regression` **59/61**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='d90106f918d64259278509ced6a7ee97b545463f700bbebdaed3c840b4417280'
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
