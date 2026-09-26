-- VNTECH ERP V5.3.0 — KIẾN TRÚC / U-11 BƯỚC 1: LÀM MỚI ĐỊNH DANH NGUỒN
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: **tách lát cắt AN TOÀN ĐẦU TIÊN ra khỏi `app/page.tsx`** (roadmap `U-11` — "Tách `page.tsx` thành module
-- theo màn hình"). Bước 1 theo đúng thứ tự đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2:
-- **tách HELPER DÙNG CHUNG TRƯỚC** để **gỡ chặn IMPORT VÒNG**, rồi mới tách từng màn.
--   • Tệp mới **`lib/ui-shared.tsx`** (`@/*` trong tsconfig trỏ về GỐC dự án nên `@/lib/…` = `lib/` ở gốc):
--     **33 khối / 228 dòng** — 31 giá trị + 2 kiểu (`Row`, `ModuleKey`): các bảng nhãn trạng thái, hàm định dạng
--     (`format`, `date`, `durationText`, `initials`, `projectPeriod`, `kpiIconName`), hàm chuẩn hoá tiêu đề
--     (`normalizeBoqHeader`, `normalizeMasterHeader`, `normalizePaymentDate`, `sanitizeUiText`, `truthyCatalog`),
--     và các hằng dùng chung (`PERM_CAPS`, `ADMIN_HELP_TEXT`, `defaultMenuGroups`, `WORK_STATUS_LABELS`…).
--   • **`app/page.tsx` 4037 → 3890 dòng** (giảm 147 dòng), KHÔNG đổi một hành vi nào.
--   • **ĐIỀU KIỆN AN TOÀN của lát cắt (do `tools/tach-lat-cat-page.mjs` TỰ KIỂM trước khi ghi):** mỗi khối chuyển đi
--     chỉ được dùng các khai báo **cùng được chuyển**, tên có sẵn của JS, và **không có JSX** ⇒ tệp mới
--     **không cần import nào** ⇒ **không thể tạo import vòng, không thể thiếu import**.
--   • ⚠️ **BA LỖI CỦA CHÍNH TÔI trong lượt này (ghi lại để không lặp):** (1) ghi vào `app/lib/…` trong khi alias
--     `@/*` trỏ về GỐC ⇒ import không giải được ⇒ `tsc` báo **TS7006 "Parameter 'c' implicitly has an 'any' type"**
--     — **lỗi ĐÁNH LỪA**, trông như lỗi suy diễn nhưng thật ra là **lỗi đường dẫn**; (2) chèn câu import mới vào
--     **giữa một câu import nhiều dòng** ⇒ `TS1003`; (3) bộ lọc JSX ban đầu chỉ bắt `<TênHoa` nên lọt component
--     dùng thẻ thường (`<div>`/`<footer>`). Cả 3 lần `app/page.tsx` đều được **HOÀN TÁC về commit sạch**
--     (`git checkout -- app/page.tsx`) rồi chạy lại — **không để lại mã hỏng**.
-- **Kiểm chứng (refactor thuần nên bằng chứng phải là ẢNH):** `tsc` **EXIT 0** · eslint **0 error** (72 warning = nền cũ)
-- · `npm run build` **EXIT 0** · **cổng ảnh 56 ảnh TRÙNG NHAU TỪNG BYTE với lượt trước** ⇒ **không đổi 1 điểm ảnh**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='837bb20dee34a94fddbde676c1c1c6f2f0e1926a853363429572fcbdc5d57a9c'
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
