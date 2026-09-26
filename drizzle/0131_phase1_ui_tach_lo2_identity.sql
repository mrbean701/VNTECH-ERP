-- VNTECH ERP V5.3.0 — KIẾN TRÚC / U-11 BƯỚC 2: LÀM MỚI ĐỊNH DANH NGUỒN (lô 2: thành phần giao diện + kiểu dữ liệu)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: **lô 2 của `U-11`** — chuyển tiếp 7 khối từ `app/page.tsx` sang `lib/ui-shared.tsx`:
--   `AppData` (kiểu dữ liệu bootstrap) · `money` · `date` · `CardHead` · `Empty` · `NavIcon` · `Kpi`.
--   • `app/page.tsx` **3890 → 3822 dòng**; `lib/ui-shared.tsx` **228 → 314 dòng**.
--   • Công cụ `tools/tach-lat-cat-page.mjs` được **mở rộng sang chế độ 2** (`--move=A,B,C`): nay chuyển được khối
--     **CÓ JSX và CÓ import** và **SINH DÒNG IMPORT** cho tệp mới (ánh xạ tên → module lấy từ chính các câu `import`
--     của `page.tsx`; `ReactNode`… → `react`). Nguyên tắc an toàn vẫn giữ: **từ chối ghi** nếu khối chuyển đi còn
--     tham chiếu một khai báo top-level **KHÔNG được chuyển** (nguy cơ import vòng).
--   • ⚠️ **HAI LỖI CỦA CHÍNH TÔI trong lượt này:** (1) công cụ sinh `import … from "@/lib/ui-shared"` **ngay trong
--     chính `lib/ui-shared.tsx`** cho các tên **đã chuyển ở lô 1** (`format` · `NAV_ICON_TYPE` · `Row`…) ⇒
--     `tsc` báo **`TS2440: Import declaration conflicts with local declaration`** — đã sửa bằng tập `selfNames`
--     (tên đã nằm trong module đích thì KHÔNG import lại); (2) bộ lọc an toàn ban đầu **báo động giả** vì coi
--     **mọi ký hiệu** là "tên không rõ nguồn" (kể cả dữ liệu path SVG `M3 16h13…`, khoá object, tên thuộc tính) ⇒
--     đã thu hẹp đúng câu hỏi cần hỏi: **chỉ** chặn khi tham chiếu tới khai báo top-level không được chuyển.
--   • ⚠️ **Một chi tiết bị mất rồi được khôi phục có bằng chứng:** chú thích `// eslint-disable-next-line
--     @typescript-eslint/no-explicit-any` của `type Row` **bị rơi** khi công cụ ghi lại tệp ở lần chạy thứ hai
--     (đoạn "giữ nội dung cũ" cắt từ DÒNG KHAI BÁO đầu tiên nên bỏ mất chú thích ngay trên nó) ⇒ eslint báo
--     **1 error**; đã khôi phục chú thích và **dọn 4 tên import thừa** (`NAV_ICON_TONE` · `NAV_ICON_TYPE` ·
--     `kpiIconName` · `boqStatusLabel` — nay do module dùng) ⇒ eslint **0 error · 71 warning** (nền là 72).
-- **Kiểm chứng:** `tsc` **EXIT 0** · eslint **0 error** (71 warning < nền 72) · `npm run build` **EXIT 0** ·
-- **cổng ảnh 56 ảnh TRÙNG NHAU TỪNG BYTE** · `test:regression` **59/61 (đúng nền)**.
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='dd4569ae8642395f03a9b912980bf758f8f9a63cc1dbc036f47464bd06d35dab'
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
