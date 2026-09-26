-- VNTECH ERP V5.3.0 — Q5 (18/09/2026): ĐƯA TÊN VAI TRÒ `thuky` VỀ TÊN NGẮN ĐÃ CHỐT
--
-- NGƯỜI DÙNG QUYẾT: phương án (b) — ĐỔI CSDL về tên ngắn "Thư ký Tổng giám đốc".
--
-- VÌ SAO CẦN: chuỗi migration tự mâu thuẫn —
--   • `drizzle/0045_patch01_runtime_admin_boq_hardening.sql:90` đặt tên NGẮN: 'Thư ký Tổng giám đốc'
--     (kèm chú thích "không đồng nhất với Trưởng phòng Hành chính Pháp chế");
--   • `drizzle/0079_phase_p3_fix_role_encoding_identity.sql:23` lại đổi về tên DÀI:
--     'Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế'.
--   ⇒ Test hồi quy `tests/runtime-admin-boq-regression.test.mjs:78` (kỳ vọng tên NGẮN của 0045) **ĐỎ** —
--     đây là **test đỏ cuối cùng** của bộ `test:regression` (60/61).
--
-- PHẠM VI: chỉ đổi `name` (một trường hiển thị). KHÔNG đổi `code`, `description`, `base_role`,
-- `default_organization_unit_id` (vẫn `ORG-BGD` — test cũng kiểm `defaultOrganizationCode='BGD'`).
-- Đơn vị mặc định giữ nguyên vì 0045 đã đặt đúng và test đang xanh phần đó.
--
-- TÍNH IDEMPOTENT: câu UPDATE chỉ khớp khi tên đang là tên dài ⇒ chạy lại vô hại.
UPDATE role_catalog
SET name = 'Thư ký Tổng giám đốc'
WHERE code = 'thuky'
  AND name <> 'Thư ký Tổng giám đốc';
