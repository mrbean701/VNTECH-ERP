-- VNTECH ERP V5.3.0 — LÔ QUYẾT ĐỊNH CỦA NGƯỜI DÙNG Q1–Q5 (18/09/2026): ĐỒNG BỘ ĐỊNH DANH NGUỒN
-- (metadata identity refresh)
-- Không đổi nghiệp vụ ngoài các sửa đã ghi; không đổi lược đồ. Chỉ cập nhật source fingerprint.
--
-- NGƯỜI DÙNG TRẢ LỜI 9 VIỆC CHỜ DUYỆT (qua Telegram). Lô này làm Q1–Q5:
--   [Q1] D5 — phạm vi dự án: xoá 5 dòng `user_project_scopes` MỒ CÔI + cấp 1 dòng `write` cho `thukydemo`
--        ở PRJ-DEMO-01 ⇒ `create_request` chạy được; probe `probe-task049-owner-checks.mjs` 5/5 ĐẠT.
--   [Q2] `isCompanyLeadership` (TASK-024) — người dùng chọn "giữ Java, sửa JS":
--        truy nguyên Java có **HAI** khái niệm (cổng quyền `RbacService` = {director, accountant};
--        bộ lọc bootstrap `BootstrapDataAdapter` = 7 mã + base_role='director') ⇒ JS nay phản chiếu ĐÚNG cả hai.
--        `scripts/system-route.mjs` + hàm `isCompanyLeadershipActionGate` (dùng ở 2 chỗ: defaultDepartmentPermission
--        + canUseModule). Cổng mới `tools/probe-task024-leadership-parity.mjs` **7/7 ĐẠT**;
--        tài khoản đổi quyền: `kttdemo` (accountant) +quyền, `thukydemo` (thuky/base=director) −quyền — đúng như Java.
--   [Q3] Nhập danh mục vật tư — **GHI CHÚ CŨ TRONG SỔ SAI** (nói "UI gửi categoryCode, Java đọc categoryId").
--        Đo lại: Java đọc đúng `categoryCode` và tự tạo nhóm, nhưng **hỏng ở bước sau**: luồng NHẬP gọi hàm
--        `insertSubcategory` 12 cột (phục vụ MÀN nhóm con) và truyền **null** vào `review_status`
--        — cột **NOT NULL DEFAULT 'approved'** ⇒ `DataIntegrityViolationException` ⇒ HTTP **409**; cả lô trong
--        1 transaction nên **nhóm vừa tạo bị giữ lại, nhóm con + vật tư KHÔNG ghi** (đúng triệu chứng "mất nhóm").
--        Đã vá: truyền `'approved'` (giá trị lưu GIỐNG HỆT JS `system-route.mjs:2604` — câu đó ghi 9 cột).
--        `java-backend/.../MaterialCatalogManagementUseCase.java`. Probe `probe-task040-nhom3b.mjs`
--        **4/17 → 17/17 ĐẠT**; dữ liệu probe đã dọn sạch (nền về 14 vật tư / 6 nhóm / 8 nhóm con).
--   [Q4] Cấp `can_create` cho phòng ban — **405 dòng** trên MySQL (`can_create=1`: 42 → **447**);
--        GIỮ `0` ở 4 module không phải nghiệp vụ: `dashboard` · `reports` · `approvals` (đã có `can_approve`) ·
--        `material_catalog` (dữ liệu gốc, luồng nhập yêu cầu admin). File HOÀN TÁC:
--        `docs/agent-progress/TASK-092-q4-rollback.sql` (405 id) · công cụ `tools/q4-cap-quyen-tao-phong-ban.mjs`.
--        ✅ **Kiểm chứng có ý nghĩa:** `ActionRbacRegistry` có **29 action gắn capability `canCreate`**
--        (`create_request`, `create_po`, `issue_stock`, `receive_goods`, `save_*`…) ⇒ cấp quyền này THỰC SỰ mở được
--        29 hành động tạo, không phải dữ liệu chết. Ghi chú: SQLite `department_module_permissions` **0 dòng**
--        (dữ liệu quyền phòng ban chỉ có ở MySQL) ⇒ lô này chỉ áp cho MySQL.
--   [Q5] Tên vai trò `thuky` → **"Thư ký Tổng giám đốc"** (MySQL + SQLite) + migration `0139` (idempotent) cho
--        bản cài mới ⇒ **`test:regression` 60/61 → 61/61 — HẾT TEST ĐỎ**.

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='9cf9d595e2037ff3fbf6481d19d4febba09bed83f79e550470bcc3e3b1aae418'
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
