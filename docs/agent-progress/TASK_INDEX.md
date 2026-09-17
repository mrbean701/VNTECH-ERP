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
| TASK-021 | **Sửa GỐC ngữ nghĩa vai trò**: `roleBase` nạp từ `role_catalog` + `requireRole` nhận mã engine + 13 điểm gọi về mã engine | DONE | #22 (cùng lượt) | 18/09/2026 | docs/28; công cụ `probe-role-code-scan` · `patch-role-engine-codes` · `verify-java-compile`; **0 lỗi mức CAO** · 13/13 phép thay thế khớp · biên dịch 99 tệp **0 lỗi**; **chưa đóng gói lại JAR** |
| TASK-021b | **Sửa HỒI QUY do TASK-021**: `principalAsCurrent` dựng `CurrentUser` với `roleBase` = mã chuẩn ⇒ 16 action sẽ 403 với mọi tài khoản không phải admin. Vá bằng `default roleBase()` trên `Principal` + controller truyền `cu.roleBase()` thật | DONE | #23 (cùng lượt) | 18/09/2026 | Cổng `probe-action-role-parity` nay có mục **ĐƯỜNG ỐNG roleBase** để bắt đúng lớp lỗi này |
| TASK-022 | Rà soát action Java **thiếu** `requireRole` so với JS + thắt 5 action còn hở | DONE | #23 (cùng lượt) | 18/09/2026 | TASK-022.md; cổng `probe-action-role-parity` **exit 0**: 0 hở · 0 chặt hơn · 21 khớp; `OpsTaskManagementUseCase` được thêm hạ tầng RBAC |
| TASK-023 | **Kiểm PHẠM VI dự án/kho** (lỗ hổng P0: JS kiểm 64 action, Java kiểm 0) — `AccessScopeService` + port `AccessScopeStore` dùng chung | IN PROGRESS | #24…#29 (lô 6) · #31 (lô 7) | 18/09/2026 | TASK-023.md; cổng `probe-action-scope-parity` đo **54/64**, còn **10**; nhóm KHO + MUA HÀNG + SẢN LƯỢNG + BOQ + TÀI CHÍNH đã phủ hết. **Chưa được đánh DONE** |
| TASK-025 | `SlaComplianceWorker` lỗi `bad SQL grammar` **lặp mỗi giờ** ⇒ worker SLA chưa bao giờ chạy được | PENDING | — | 18/09/2026 | Phát hiện từ log server: `UPDATE supply_workflow_steps SET status='overdue',overdue_at=?,updated_at=? WHERE id=? AND status='pending'`. Cần đối chiếu SQL với lược đồ thật của `supply_workflow_steps` |
| TASK-026 | Sửa lỗi **idempotency của công cụ vá** (đã gỡ 5 khối `rbac.requireRole` bị nhân đôi) + ghi bài học | DONE | #31 (cùng lượt) | 18/09/2026 | Nguyên nhân: kiểm "đã áp dụng chưa" bằng `includes(from)` mà `from` là dòng chữ ký phương thức (vẫn còn sau khi chèn) ⇒ chèn lần hai. `tools/cleanup-duplicate-requirerole.mjs` đã gỡ và **kiểm chứng không còn khối lặp** |
| TASK-024 | Lệch `isCompanyLeadership`: JS = 7 mã + `base_role='director'`; Java = `{director, accountant}` | BLOCKED | — | 18/09/2026 | **Cần người dùng quyết định** — thuộc nhóm bảo mật đang tạm hoãn; Java cấp thừa cho `accountant`, cấp thiếu cho `thuky` |
| TASK-B01 | ~~Xác nhận tên màn Receiving từ menu~~ **ĐÃ GIẢI QUYẾT** bằng dữ liệu, không cần hỏi người dùng | DONE | — | 18/09/2026 | Nhãn cuối cùng của module `receiving` = **"Kế hoạch giao hàng"** (nhóm `MUA HÀNG`). Chuỗi tiến hoá: `Giao nhận công trường` (0010) → `Chờ giao hàng` (0011) → **`Kế hoạch giao hàng`** (0029). Khớp với `app/page.tsx:116` |
| TASK-B02 | ~~Cổng ảnh + bộ probe KHÔNG chạy được~~ **ĐÃ GỠ CHẶN** — cổng ảnh cần Edge headless (named pipe), chạy được khi mở rộng sandbox | DONE | — | 18/09/2026 | **Cổng ảnh: 28/28 ảnh ĐẠT, 0 px lệch** trên 7 màn × 4 kích thước. Lưu ý: các probe cần `spawn mysql` vẫn cần mở rộng sandbox |
| TASK-B03 | ~~Không đóng gói lại được JAR~~ **ĐÃ GỠ CHẶN** — nguyên nhân gốc gồm 3 lớp, đã xử lý cả 3 | DONE | — | 18/09/2026 | (1) `JAVA_HOME` chưa đặt → mvn báo sai về `.m2`; (2) sandbox chặn ghi `.m2` → dùng local repo trong workspace qua `.mvn/maven.config` (PowerShell làm hỏng `-D` vì đường dẫn có dấu cách); (3) tiến trình Java đang giữ JAR → dừng đúng PID rồi repackage. **`BUILD SUCCESS`, jar béo 90.883.789 bytes, server khởi động lại, `/actuator/health` = UP** |
| TASK-B01 | Xác nhận tên màn Receiving từ menu | BLOCKED | — | 17/09/2026 | Cần người dùng; KHÔNG chặn tiến độ |
