-- VNTECH ERP V5.3.0 — PHASE 1 / UI: LÀM MỚI ĐỊNH DANH NGUỒN (TASK-083 · U-15 đợt 2, tiếp 10)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: chuyển **bảng nhiệm vụ phòng ban** (`DepartmentTaskWorkspace` — màn "Giao việc & Kiểm soát hoàn thành",
-- hiển thị trong khối `.dept-task-table`, 10 cột) sang `<DataTable>` — **bảng thứ 17**.
--   • Đây là bảng thứ **HAI cần CHỌN DÒNG** (`selected?.id === r.id` ⇒ lớp `selected-row`) — nay dùng
--     `rowClassName` đã mở rộng ở bảng 15, KHÔNG phải sửa component nữa.
--   • Ô **"Hạn hoàn thành"** có luật tô đỏ theo hạn `late` ⇒ chuyển sang **`cellClassName`** (đã có từ TASK-081)
--     với **đúng biểu thức cũ**: `r.dueAt && new Date(r.dueAt).getTime() < nowMs && !['COMPLETED','CANCELLED'].includes(status)`.
--   • Giữ nguyên: cột "Nguồn (Liên kết)" là `link-button` có `stopPropagation` rồi `navigate(target)`, cột
--     "Nhóm công việc" là `span.task-group-tag`, cột "%" là `div.task-progress` với bề rộng nội tuyến, và
--     `emptyText` **nguyên văn**: "Chưa có nhiệm vụ phù hợp bộ lọc."
--   • Bảng cũ là `<table>` **TRẦN** (không lớp) nằm trong `.table-wrap` ⇒ `DataTable` thêm lớp `baseline-table`;
--     CSS đã được CHỨNG MINH tương đương ở `app/styles/canonical.css:103-113` và **kiểm bằng cổng ảnh trước/sau**.
--
-- ⚠️ HAI PHÁT HIỆN KHI ĐO MÀN NÀY (ghi lại, KHÔNG tự sửa):
--   (1) **Cổng ảnh có ĐIỂM MÙ "dưới nếp gấp":** màn phòng ban có page-head + 6 thẻ KPI + form giao việc + card lọc
--       đẩy bảng xuống dưới 1080 px ⇒ `captureBeyondViewport:false` **không chụp tới bảng** ⇒ cổng báo "xanh"
--       mà **chưa hề đo cái bảng**. Đã thêm cờ `fullPage: true` cho từng màn (mặc định vẫn giữ nguyên để
--       32 ảnh chuẩn cũ không đổi) — ảnh mới của 2 màn phòng ban chụp **toàn trang**, thấy đủ **10 cột + 7 dòng**.
--   (2) **Nhóm menu `department_management` KHÔNG còn tồn tại** (đã tách thành my_work/mep/finance/hr_legal/reports
--       theo migration `V4__menu_restructure.sql`, ghi chú ngay tại `app/page.tsx:49`), nhưng nhánh render 4 nhóm con
--       theo `groupKey === "department_management"` **vẫn còn trong mã** ⇒ **mã chết**. 37 module phòng ban vẫn
--       **đến được** vì `module_catalog.group_key` trỏ chúng vào my_work/purchasing/mep/finance/hr_legal/reports.
--       Đây là **KNOWN PROBLEM ghi nhận**, cần quyết định của anh mới dọn (xem `MASTER_STATUS.md`).
-- Kết quả đo: `DataTable` dùng thật **29 → 30 lần** · bảng tự viết **71 → 70 chỗ** · trạng thái rỗng tự viết
-- **74 → 73 chỗ**. `app/page.tsx` 4019 → 4037 dòng (do xuống dòng khối JSX).
-- Khối identity bên dưới do `tools/refresh-phase-identity.mjs` sinh theo cơ chế FIXED POINT.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='492a1077da6cec864d1081dea7564968df6f29d0e7e334171e4806867eb1c7c7'
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
