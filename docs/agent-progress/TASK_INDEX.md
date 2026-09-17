# TASK INDEX — VNTECH ERP V5.3.0 MASTER TASK

Trạng thái hợp lệ: `PENDING` · `IN PROGRESS` · `DONE` · `BLOCKED` · `CANCELLED`
**Không bao giờ xoá hồ sơ việc đã xong.**

| Task | Tiêu đề | Trạng thái | Commit | Ngày | Ghi chú |
|---|---|---|---|---|---|
| TASK-001 | PHASE 0 — SYSTEM AUDIT + TODO/ROADMAP + probe bảo mật RBAC | DONE | `8b4a5da` (#9) | 16/09/2026 | docs/24 (20 mục + Phụ lục B), docs/25 |
| TASK-002 | PHASE 0B — Bật kiểm quyền RBAC ở tầng action, bịt lỗ hổng 15/15 action lọt qua | DONE | `3c948cb` (#10) | 16/09/2026 | Lỗ hổng 15 → 0; đúng 20/20 |
| TASK-003 | PHASE 1 — Thư viện UI dùng chung + sửa xung đột lớp CSS + xác minh cổng ảnh 28/28 (U-01…U-08) | DONE | `7fa59ba` (#11) | 16/09/2026 | docs/26; đính chính kết luận sai về nguyên nhân 28/28 |
| TASK-004 | U-09 đợt 1 — Chuẩn hoá toolbar 3 màn (Requests · WarehouseReceipt · Inventory) | DONE | `8b29344` (#12) | 16/09/2026 | docs/27 mục 1–6 |
| TASK-005 | U-09 đợt 2 — Màn Phân quyền người dùng + nâng ngưỡng cổng ảnh có bằng chứng | DONE | `426763c` (#13) | 16/09/2026 | docs/27 mục 7–9 |
| TASK-006 | U-09 đợt 3 — WorkCenter · TeamManagement · ProjectManagement | DONE | `44c0a5e` (#14) | 17/09/2026 | docs/27 mục 10–11 |
| TASK-007 | U-09 đợt 4 — Danh sách nhân sự + Danh bạ nội bộ + probe chặt hơn + cổng chống lỗi giả + phát hiện roadmap báo quá | DONE | `9148212` (#15) | 17/09/2026 | docs/26 mục 10; docs/27 mục 12–13 |
| TASK-008 | U-09 đợt 5 — 3 màn tab Quản trị (UserPermissionMatrix · SystemLevelManager · AuditLogManager) | IN PROGRESS | `96c3aa8` (#16, PARTIAL) | 17/09/2026 | Code + probe riêng 11/11 ĐẠT; **còn thiếu lượt quét hồi quy rộng** vì cổng ảnh/probe cần mở rộng sandbox |
| TASK-009 | U-09 đợt 6 — 13 màn còn lại | PENDING | — | — | Xem docs/25 |
| TASK-010 | U-14 — ÁP DỤNG EntityDetailModal | PENDING | — | — | Dùng thật 0 lần |
| TASK-011 | U-15 — ÁP DỤNG DataTable + StatusBadge | PENDING | — | — | 100 bảng + 100 rỗng; StatusBadge 2/88 |
| TASK-012 | U-16 — ÁP DỤNG PermissionGuard | PENDING | — | — | 50 chỗ điều kiện quyền |
| TASK-013 | U-17 — ÁP DỤNG Approval/ActivityTimeline | PENDING | — | — | 3 dải tự viết |
| TASK-014 | U-11 — Tách `page.tsx` thành module | PENDING | — | — | 4.140 dòng / 221 hàm |
| TASK-015 | U-12 — Loại `!important` + gộp selector trùng | PENDING | — | — | Phụ thuộc U-11 |
| TASK-016 | U-13 — Tách `TaskTable` khỏi thân render WorkCenter | DONE | #17 (cùng lượt) | 17/09/2026 | eslint 3 lỗi → **0** lỗi; làm trước TASK-009…015 vì kiểm được bằng kiểm tra tĩnh |
| TASK-017 | Điều tra còn mở — nguyên nhân gốc bất định của cổng ảnh | PENDING | — | — | Đã khoanh vùng ô tìm kiếm topbar |
| TASK-018 | Đối chiếu action giữa bản JS tham chiếu và bản Java đã port (đính chính audit) | DONE | #18 (cùng lượt) | 17/09/2026 | Cáo buộc "catalog lệch 50 action" là **SAI**; Java **không thiếu action nào** |
| TASK-019 | Sửa 5 lỗi mã vai trò còn sót trong `ProductionManagementUseCase` (commander→cht, project→da_nv) | DONE | #19 (cùng lượt) | 17/09/2026 | Người dùng `cht`/`da_nv` hết bị 403 oan; javac **exit 0**; chưa đóng gói lại JAR |
| TASK-020 | U-15 (phần StatusBadge) — thay 88 chỗ `<Pill>` bằng `<StatusBadge>`, chứng minh tương đương bằng công cụ | DONE | #21 (cùng lượt) | 17/09/2026 | StatusBadge **2 → 90** lần dùng thật; `<Pill>` 88 → 0; tsc ĐẠT · eslint 0 lỗi; **chưa kiểm bằng mắt** (TASK-B02) |
| TASK-B02 | **Cổng ảnh + bộ probe KHÔNG chạy được** — cần mở rộng sandbox để khởi động Edge headless (named pipe) | BLOCKED | — | 17/09/2026 | Yêu cầu mở rộng quyền đã bị huỷ; chặn phần hồi quy quét rộng của TASK-008 và mọi việc UI tiếp theo |
| TASK-B01 | Xác nhận tên màn Receiving từ menu | BLOCKED | — | 17/09/2026 | Cần người dùng; KHÔNG chặn tiến độ |
