-- VNTECH ERP V5.3.0 — KIẾN TRÚC / KP #89: DỌN MÃ CHẾT "4 NHÓM CON PHÒNG BAN" + CHẤP NHẬN DÀN LẠI CỘT (KP #88)
-- (metadata identity refresh)
-- Không đổi nghiệp vụ, không đổi schema. Chỉ cập nhật source fingerprint.
--
-- VÌ SAO: người dùng đã QUYẾT 3 việc (18/09) sau báo cáo qua Telegram:
--   (1) KP #88 — CHẤP NHẬN bề rộng cột bị DÀN LẠI khi bảng trần chuyển sang `DataTable` ⇒ chụp lại ảnh chuẩn.
--   (2) hover bảng "Phiếu đề nghị" — GIỮ (hành vi có chủ đích, không tắt).
--   (3) KP #89 — DỌN SẠCH mã chết "4 nhóm con phòng ban".
--
-- TIỀN ĐỀ ĐO LẠI (không tin ghi chú cũ — công cụ `tools/probe-kp89-dead-dept-branch.mjs`):
--   • MySQL `menu_group_catalog` = 12 nhóm; SQLite = 12 nhóm; fallback `defaultMenuGroups` = 12 nhóm —
--     KHÔNG nguồn nào có `group_key='department_management'`.
--   • 37 module phòng ban (cả 2 CSDL) đều trỏ vào 6 nhóm THẬT: purchasing 8 · mep 8 · finance 7 ·
--     hr_legal 6 · reports 4 · my_work 4 ⇒ nhánh render `data-dept: plan/project/finance/legal`
--     KHÔNG THỂ chạy trên bất kỳ đường dữ liệu nào.
--
-- ĐÃ DỌN:
--   • `app/page.tsx` 3436 → 3415 dòng: gỡ nhánh render DESKTOP (1.545 ký tự) + MOBILE (1.200 ký tự),
--     nhánh nhóm con trong `permissionMenuStructure` (857 ký tự), 1 effect đồng bộ + 2 state
--     (`openDeptSubgroups`, `mobileDepartmentExpanded`) + 2 khoá localStorage + `toggleDeptSubgroup`,
--     luật `directChild`/`opened`/`onClick` đặc cách; 37 literal `groupKey: "department_management"`
--     → KHOÁ NHÓM THẬT lấy từ CSDL.
--   • `lib/ui-shared.tsx`: bỏ 4 khoá tên phòng ban + `department_management` khỏi `NAV_ICON_TYPE` /
--     `NAV_ICON_TONE` (chỉ nhánh chết dùng).
--   • `app/globals.css`: xoá 106 rule + 19 selector chết ⇒ `!important` 4950 → 4849 · 400.643 → 388.282 byte.
--   • `scripts/css-baseline-audit.mjs`: ĐẢO phép kiểm (từ ĐÒI sang CẤM lớp chết quay lại) + SỬA PHẠM VI ĐỌC
--     sang HỢP NHẤT `app/` + `lib/` — vì cổng này ĐANG ĐỎ (26 lớp "chết" oan) sau khi `U-11` chuyển
--     component dùng chung sang `lib/ui-shared.tsx` (cùng lớp lỗi KP #94).
--
-- GIỮ LẠI CÓ LÝ DO (không xoá vì KHÔNG chết):
--   • `subGroup` — cây PHÂN QUYỀN đọc để in nhãn "nhóm › phòng ban" (`page.tsx` 2 chỗ).
--   • `mobile-nav-root` / khung menu mobile — CSS xếp cùng nhóm selector với lớp cũ ⇒ trùng kiểu hoàn toàn.
--   • `__site_command_tree_disabled__` (cây workspace theo dự án) — CÒN NGUYÊN, chờ người dùng quyết (KP #96).
--
-- CỔNG MỚI: `tools/probe-kp89-dead-dept-branch.mjs` 25/25 ĐẠT (tiền đề + đối chứng dương/âm + đo đóng).

--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_update;
--> statement-breakpoint
DROP TRIGGER IF EXISTS vntech_product_identity_no_delete;
--> statement-breakpoint
UPDATE vntech_product_identity
SET source_fingerprint='75f9244dc60f2fad81bc201cd016c065d87c0a46811913a49e5a343c4deb24cc'
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
