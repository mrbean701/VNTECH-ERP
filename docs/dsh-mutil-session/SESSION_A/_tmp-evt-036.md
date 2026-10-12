## EVT-20261007-036

Date: 2026-10-07
Session: ERP-SESSION-01
Type: TEST_COMPLETE

### Mô tả
Hoàn thành test phân quyền Quản trị hệ thống (5 kịch bản) + xác nhận bundle mới có fix BUG-002.

### Kết quả
① e2e.bgd (director, KHÔNG có perm admin) ⇒ vào menu nhưng BỊ CHẶN «CHƯA ĐƯỢC PHÂN QUYỀN» — PASS
② Cấp quyền admin qua CSDL ⇒ KHÔNG CÓ HIỆU LỰC — ĐÚNG THIẾT KẾ (bootstrap 3 nhánh: admin/company_leadership/user)
③ 6 tab quản trị: TẤT CẢ dữ liệu từ CSDL, KHÔNG hardcode — PASS
④ 3 hardcode có chủ đích trong source (SEE_ALL_WAREHOUSE_ROLES, WorkKanban, workflow-helpers) — đúng thiết kế
⑤ Duyệt workflow bước 1 (admin) — PASS (isAdminUser bypass)
⑥ Duyệt workflow bước 2 — backend workflow_step_approvers chặn đúng
⑦ Bundle mới (page-V7Hi2xwv.js · 1048633 bytes) XÁC NHẬN có fix: `moduleKey:t.moduleKey` — PASS
⑧ Fingerprint: VNTECH-FP-723368DEBABF42EA · 728 files · ĐẠT

### Bài học
- `viewable ?? item.permissionKeys[0]` luôn trả `central_warehouse` cho admin vì admin xem được mọi khoá ⇒ `viewable` luôn có giá trị ⇒ `??` không bao giờ chạy.
- Sửa lần 1 (`viewable ?? item.moduleKey`) KHÔNG ĐỦ — phải sửa lần 2 (`item.moduleKey`) mới đúng.
- Edge probe KHÔNG share session với nuphus ⇒ clickSteps luôn NO_CLICK_TARGET ⇒ tạm bỏ màn 16 khỏi probe.

### Liên quan
- BUG-20261007-002 (FIXED — page.tsx:523)
- TEST-20261007-003 (E2E bước 1-2 + bảng allowed_role_codes)
- DEC-20261006-015 (KHÔNG migration cho vân tay)

---