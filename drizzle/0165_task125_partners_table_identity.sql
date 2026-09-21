-- VNTECH ERP V5.3.0 — TASK-125 (21/09/2026): «Đối tác» là BẢNG RIÊNG.
--
-- QUYẾT ĐỊNH NGUYÊN VĂN CỦA NGƯỜI DÙNG (21/09/2026):
--   ① «Đối tác là bảng riêng»  ⇒ phải có BẢNG + MÀN quản lý đối tác THẬT (không mở cùng màn NCC).
--   ② «Cho nhập dữ liệu»       ⇒ được phép INSERT/UPDATE dữ liệu test.
--   ③ «Không cần gộp»          ⇒ giữ nguyên 3 lối vào NCC (nhà cung cấp · đối tác · danh mục NCC).
--
-- ⛔ ADDITIVE 100%: CHỈ `CREATE TABLE` mới + `CREATE UNIQUE INDEX`.
--    KHÔNG `DROP` · KHÔNG `ALTER` · KHÔNG `TRUNCATE` · KHÔNG `DELETE` bất kỳ bảng/cột nào.
--    Bảng `suppliers` (và mọi bảng khác) KHÔNG bị chạm tới.
--
-- Quy ước cột COPY từ bảng `suppliers` (đo bằng `SHOW CREATE TABLE suppliers` trên MySQL `vntech_erp`):
--    id · code · name · tax_code · contact_name · phone · lead_time_days · rating · active · created_at · updated_at
-- Khoá chính/định dạng id GIỐNG `suppliers`: `id text PRIMARY KEY NOT NULL`, sinh mã bằng
--    `id("PTR")` = `PTR_<uuid>` (đúng khuôn `id("SUP")` = `SUP_<uuid>` ở `scripts/system-route.mjs:43`).
-- Cột `phone` của `suppliers` đổi tên thành `contact_phone` cho hợp nghĩa đối tác; các cột còn lại giữ NGUYÊN tên.
--
-- KHOÁ QUYỀN: dùng chung khoá SẴN CÓ `dept_plan_suppliers` ⇒ ⛔ KHÔNG thêm dòng `module_catalog` nào (vẫn 61 dòng).

CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`tax_code` text,
	`address` text,
	`contact_name` text,
	`contact_phone` text,
	`email` text,
	`partner_type` text DEFAULT 'supplier' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partners_code_uidx` ON `partners` (`code`);
