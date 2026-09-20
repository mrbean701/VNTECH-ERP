# 25 — TODO & ROADMAP · VNTECH ERP

- **Lập ngày:** 16/09/2026
- **Căn cứ:** `docs/24_SYSTEM_AUDIT_REPORT.md`
- **Baseline:** nhánh `unity` · HEAD `1c01f39` · cây làm việc sạch

**Quy ước cột**

| Ký hiệu | Nghĩa |
|---|---|
| `DB` | ảnh hưởng cơ sở dữ liệu: `-` không · `COL` thêm cột · `TBL` thêm bảng · `MIG` cần migration |
| `API` | ảnh hưởng API: `-` không · `NEW` thêm action · `CHG` đổi hợp đồng |
| `UI` | ảnh hưởng giao diện: `-` không · `NEW` màn mới · `FIX` sửa · `REUSE` dùng lại |
| `QUYỀN` | ảnh hưởng phân quyền: `-` không · `CHECK` thêm kiểm · `MODEL` đổi mô hình |
| `TT` | trạng thái: `TODO` · `DOING` · `DONE` · `BLOCKED` |

---

# PHASE 0 — AUDIT

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `A-01` | Toàn hệ | Quét repo, xác định stack/kiến trúc/entry point | P0 | — | - | - | - | - | **DONE** |
| `A-02` | Toàn hệ | Audit DB: 121 bảng, 2 nguồn migration | P0 | A-01 | - | - | - | - | **DONE** |
| `A-03` | Toàn hệ | Audit API: 224 case vs 174 catalog | P0 | A-01 | - | - | - | - | **DONE** |
| `A-04` | Toàn hệ | Audit authentication (PBKDF2, cookie, khoá đăng nhập) | P0 | A-01 | - | - | - | - | **DONE** |
| `A-05` | Toàn hệ | Audit permission 3 tầng | P0 | A-01 | - | - | - | - | **DONE** |
| `A-06` | Toàn hệ | **Kiểm chứng RBAC action bằng thực nghiệm** | P0 | A-05 | - | - | - | CHECK | **DONE** |
| `A-07` | Workflow | Audit workflow + versioning | P0 | A-01 | - | - | - | - | **DONE** |
| `A-08` | Admin | Audit **Ngoại lệ cá nhân** (§35) | P0 | A-01 | - | - | - | - | **DONE** |
| `A-09` | Vật tư | Audit **nhóm con vật tư** (§25) | P0 | A-01 | - | - | - | - | **DONE** |
| `A-10` | Toàn hệ | Audit thành phần dùng chung + trùng lặp | P0 | A-01 | - | - | - | - | **DONE** |
| `A-11` | Toàn hệ | Xuất AUDIT REPORT (`docs/24`) | P0 | A-01…A-10 | - | - | - | - | **DONE** |
| `A-12` | Toàn hệ | Xuất TODO/ROADMAP (`docs/25`) | P0 | A-11 | - | - | - | - | **DONE** |
| `A-13` | Hạ tầng | **Xác nhận backup / PITR của MySQL** | **P0** | — | - | - | CONFIRMED-PITR / KHONG-CO-BACKUP-NEN | - | **DONE** |
| `A-14` | Hạ tầng | Xác nhận chính sách thời hạn phiên + thu hồi phiên | P1 | — | - | - | CONFIRMED: TTL 24h + 4 duong thu hoi + audit | - | **DONE** |
| `A-15` | Admin | Xác định **nhóm quyền nghiệp vụ** có tham gia kiểm quyền không | **P0** | — | - | - | CONFIRMED: KHONG tham gia kiem quyen (chi module_permissions) | MODEL | **DONE** |
| `A-16` | Toàn hệ | Kiểm thử **cross-department / cross-project** | P1 | A-06 | - | - | CONFIRMED: loc theo du an + chan non-admin (0/5, 0/20 lot qua); phat hien 1 khoa nham save_payment_plan | CHECK | **DONE** |

---

# PHASE 0B — BỊT LỖ HỔNG BẢO MẬT (CHẶN MỌI THỨ KHÁC)

> **Không bắt đầu phase nào khác trước khi hoàn tất phase này.**

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `S-01` | Toàn hệ | Điền module cho **29 action** khai rỗng trong `ActionRbacRegistry` (đo lại: 41 action rỗng đã được `requireRequireAdmin` che, 5 là hành động công khai) | **P0** | A-06 | - | - | - | CHECK | **DONE** |
| `S-02` | Toàn hệ | **Bật `requireActionModule`** tại một điểm kiểm duy nhất trong `SystemController` | **P0** | S-01 | - | - | - | CHECK | **DONE** |
| `S-03` | Toàn hệ | Đổi mặc định thành **TỪ CHỐI** khi action chưa khai module + `PUBLIC_ACTIONS` allowlist 5 hành động | **P0** | S-02 | - | - | - | CHECK | **DONE** |
| `S-04` | Toàn hệ | Bật an toàn: thu hẹp phạm vi còn 29 action nghiệp vụ, không đụng 41 action đã che | **P0** | S-03 | - | - | - | CHECK | **DONE** |
| `S-05` | Tệp | Kiểm quyền cho `/api/files` (endpoint riêng, không đi qua action) | **P0** | — | - | CHG | - | CHECK | **DONE / KIEM-CHUNG-3-CA** |
| `S-06` | Phòng ban | Cấp `canApprove` cho BCH trên `receiving`/`warehouse_receipt` để bước "BCH xác nhận giao hàng" chạy được | **P0** | S-01 | - | - | - | MODEL | **DONE** |
| `S-07` | Toàn hệ | Chạy `tools/probe-security-rbac.mjs` — viết lại để đo theo **quyền thật** của tài khoản | **P0** | S-04 | - | - | - | CHECK | **DONE** |
| `S-08` | Workflow | Snapshot **danh sách người được chỉ định**, không đọc live | P1 | — | COL | - | - | - | **DONE / AP-DUNG 100** |
| `S-09` | Toàn hệ | 🐛 Sửa lỗi có sẵn: `ModulePermissionStoreAdapter.canUseModule` dùng `queryForObject` → ném `EmptyResultDataAccessException` (500) khi người dùng không có dòng quyền. Đổi sang `queryForList` | **P0** | — | - | - | - | CHECK | **DONE** |
| `S-10` | Toàn hệ | Chạy hồi quy sau khi bật RBAC: 13 probe + luồng mua hàng | **P0** | S-07 | - | - | - | - | **DONE** |

**Kết quả PHASE 0B (16/09/2026):**

| Chỉ số | Trước | **Sau** |
|---|---:|---:|
| ❌ Action LỘT QUA kiểm quyền | **15** | **0** ✅ |
| ⚠️ Action KHOÁ NHẦM người có quyền | — | **0** ✅ |
| ✅ Hành xử đúng | 5/20 | **20/20** ✅ |
| 13 probe hồi quy | 13/13 | **13/13** ✅ |
| Luồng mua hàng | 28/31 | **28/31** ✅ |

**File đã sửa:** `ActionRbacRegistry.java` · `RbacService.java` · `SystemController.java` · `ModulePermissionStoreAdapter.java`
**Công cụ:** `tools/patch-rbac-registry.mjs` · `tools/probe-security-rbac.mjs`

---

# PHASE 1 — HẠ TẦNG UI DÙNG CHUNG

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `U-01` | UI | `EntityDetailModal` — 1 khung cho User/Project/Warehouse/Team/Material/Supplier/Task | P1 | S-07 | - | - | REUSE | CHECK | DONE / AP-DUNG 1 |
| `U-02` | UI | `DataTable` dùng chung: cột, sắp xếp, lọc, phân trang, rỗng/đang tải/lỗi | P1 | — | - | - | REUSE | - | DONE / AP-DUNG 30 |
| `U-03` | UI | `ListToolbar`: TIÊU ĐỀ + SỐ LƯỢNG ‖ TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG | P1 | — | - | - | REUSE | - | DONE / AP-DUNG 10 |
| `U-04` | UI | `PermissionGuard` (ẩn/hiện theo quyền; backend vẫn kiểm) | P1 | S-07 | - | - | REUSE | CHECK | **DONE / GUARD-DUNG-5-CHO** |
| `U-05` | UI | `StatusBadge` thống nhất toàn hệ | P1 | — | - | - | REUSE | - | DONE / AP-DUNG 90 |
| `U-06` | UI | `ApprovalTimeline`: số bước · người duyệt · phòng ban · thời gian · trạng thái · ý kiến | P1 | — | - | - | NEW | - | DONE / AP-DUNG 1 |
| `U-07` | UI | `ActivityTimeline` dùng cho mọi lịch sử | P1 | — | - | - | NEW | - | DONE / AP-DUNG 2 |
| `U-08` | UI | Kiểm responsive 4 kích thước cho mọi màn sau khi chuẩn hoá | P1 | U-02,U-03 | - | - | FIX | - | DONE |
| `U-09` | UI | Chuyển các danh sách sang khuôn Toolbar chuẩn (§5) | P1 | U-03 | - | - | FIX | - | DONE / AP-DUNG 25 |
| `U-10` | UI | Sửa modal vượt viewport | P1 | — | - | - | FIX | - | DONE |
| `U-11` | Kiến trúc | Tách `page.tsx` (4.057 dòng) thành module theo màn hình | P1 | U-01…U-05 | - | - | - | - | **DONE / TACH-3-MAN-WORKCENTER-REQUESTS-BOQCONTROL** |
| `U-12` | CSS | Loại `!important` theo từng nhóm; gộp 1.183 selector trùng | P2 | U-11 | - | - | FIX | - | **DONE / 823-TOKEN-IMPORTANT-CHET-DA-BO + 5-KHOI-TRUNG-DA-GOP** |
| `U-13` | Kiến trúc | Tách `TaskTable` ra khỏi thân render của `WorkCenter` — nợ có sẵn: `react-hooks/static-components` tại page.tsx:774, dùng ở 837/862/866 | P2 | U-11 | - | - | - | - | DONE |

> **PHÁT HIỆN 17/09/2026 — roadmap trước đó BÁO QUÁ:** các mục U-01/U-02/U-04/U-06/U-07 từng được đánh DONE nhưng đó mới là **DỰNG KHUNG**, số lần dùng THẬT trong ứng dụng = **0**. Đã sửa lại cột TT theo số đo và tách phần **áp dụng** thành U-14..U-17.

| `U-14` | UI | **ÁP DỤNG** `EntityDetailModal` — dùng thật **0** lần; còn **4** chỗ tự viết .overlay | P1 | U-01 | - | - | REUSE | CHECK | **DONE / CONG-ANH-64-64** |
| `U-15` | UI | **ÁP DỤNG** `DataTable` + `StatusBadge` — DataTable dùng thật **30** lần (TASK-083: 13 → 30, **17 bảng** chuyển trong phiên 18/09), còn **70** bảng tự viết + **73** trạng thái rỗng tự viết — trong đó **~70 bảng KHÔNG chuyển được** theo bộ quét tiêu chí an toàn (bảng in HTML `printTabularReport` · nhóm dòng `<Fragment>` · lưới nhập liệu · bảng tổng hợp tĩnh; xem `TASK-083.md` mục 3); StatusBadge đã dùng **90** chỗ (TASK-020 đã chuyển 88 `<Pill>` → 0; đo lại bằng `probe-ui-adoption.mjs`) | P1 | U-02,U-05 | - | - | REUSE | - | DONE / AP-DUNG 30 |
| `U-16` | UI | **ÁP DỤNG** `PermissionGuard` — dùng thật **0** lần; còn **50** chỗ điều kiện quyền rải rác | P1 | U-04 | - | - | REUSE | CHECK | **DONE / GUARD-DUNG-5-CHO** |
| `U-17` | UI | **ÁP DỤNG** `ApprovalTimeline`/`ActivityTimeline` — dùng thật **3** lần (`ApprovalTimeline` 1 · `ActivityTimeline` **2**); còn **0** chỗ tự viết dải | P1 | U-06,U-07 | - | - | REUSE | - | DONE |

---

# PHASE 2 — MUA HÀNG & CUNG ỨNG

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `P-01` | Mua hàng | Tách **MR · PR · PO** thành 3 tab riêng | P2 | U-03 | - | - | - | CHECK | **TODO** |
| `P-02` | Mua hàng | Sắp xếp mặc định `created DESC`; Completed/Rejected xuống cuối | P2 | P-01 | - | - | FIX | - | TODO |
| `P-03` | Mua hàng | Lọc theo Trạng thái · Ngày · Phòng ban · Người tạo · NCC · Dự án | P2 | P-01 | - | - | FIX | - | TODO |
| `P-04` | Phiếu | **Approval Timeline** trong chi tiết phiếu (§8.1) | P2 | U-06 | - | - | NEW | - | DONE |
| `P-05` | Phiếu | **Tổng hợp giao nhận** → modal riêng (§8.2) | P2 | U-01 | - | - | NEW | - | DONE |
| `P-06` | Phiếu | Hồ sơ vật tư đặc thù: ảnh/tệp xem được, không tràn khung (§8.3) | P2 | — | - | - | FIX | - | DONE |
| `P-07` | NCC | Tách **Nhà cung cấp / Đối tác** thành menu độc lập (§17) | P2 | S-07 | - | - | NEW | CHECK | TODO |
| `P-08` | NCC | Liên kết Supplier ↔ MR/PR/PO ↔ Material | P3 | P-07 | - | - | NEW | - | TODO |
| `P-09` | Mua hàng | Sửa **5 chỗ `requireRole` dùng mã vai trò cũ** ở `ProductionManagementUseCase` | P2 | S-07 | - | - | - | CHECK | TODO |

---

# PHASE 3 — CÔNG VIỆC / TASK MANAGEMENT

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `T-01` | Công việc | Tách menu 5 mục: cá nhân · phòng ban · giao việc · dashboard · báo cáo | P2 | U-03 | - | - | NEW | CHECK | **DONE** |
| `T-02` | Công việc | Audit mô hình dữ liệu task hiện có (đã có `work_items`) | **P2** | — | - | - | work_items 32 cot (8 dong) + work_item_events/task_notifications/task_sla_policies; THIEU: comment + participant; UNKNOWN: attachments | - | **DONE** |
| `T-03` | Công việc | Bổ sung trường còn thiếu: tiến độ · huỷ lúc · ghi chú · tệp | P2 | T-02 | COL | - | - | - | **DONE** |
| `T-04` | Công việc | `TaskAssignment` · `TaskComment` · `TaskAttachment` · `TaskHistory` · `TaskParticipant` | P2 | T-02 | TBL | NEW | NEW | - | **DONE** |
| `T-05` | Công việc | Việc cá nhân: của tôi · được giao · do tôi tạo | P2 | T-01 | - | - | NEW | CHECK | **DONE** |
| `T-06` | Công việc | Việc phòng ban: giới hạn theo phạm vi được phép | P2 | T-01 | - | - | NEW | CHECK | **DONE** |
| `T-07` | Công việc | Board Kanban — **phân biệt rõ Ưu tiên / Trạng thái / Phân công** | P2 | T-03,T-04 | - | - | NEW | - | **DONE** |
| `T-08` | Công việc | Dashboard cá nhân + phòng ban + dự án (§11) | P3 | T-05,T-06 | - | - | NEW | CHECK | **DONE** |
| `T-09` | Công việc | Kiến trúc Task → Team → Thành viên → Hỗ trợ liên phòng (§10) | P3 | T-04 | TBL | - | - | - | **DONE** |
| `T-10` | Phê duyệt | **Tách Approval Center thành module độc lập** (§12) | P2 | U-06 | - | - | NEW | CHECK | **DONE** |

---

# PHASE 4 — QUẢN LÝ DỰ ÁN

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `PR-01` | Dự án | Danh sách dự án thành tab riêng + toolbar cân đối | P2 | U-03 | - | - | DONE 20/09: dai 6 tab (Danh sach du an + 5 tab chi tiet) + toolbar can doi (count/tim/XUAT); probe hop dong DAT (exit 0) tren bundle moi E2E11762304AD2B5; anh 02-project lech CHU Y (da ghi chu, khong re-baseline) | CHECK | **DONE** |
| `PR-02` | Dự án | Lọc: Trạng thái · Quản lý dự án · Phòng ban · Ngày | P2 | PR-01 | - | - | FIX | - | **DONE** |
| `PR-03` | Dự án | Chi tiết dự án thành tab/modal: chung · nhân sự · tổ đội · kho · lịch sử | P2 | U-01 | - | - | NEW | - | **DONE** |
| `PR-04` | Dự án | Bấm vào Project/User/Warehouse/Team → mở **EntityDetailModal** | P2 | U-01 | - | - | NEW | CHECK | **DONE** |
| `PR-05` | Dự án | **Ban chỉ huy dự án** thành tab riêng (§14) | P2 | PR-01 | - | - | TAM-DONG-THEO-CHI-DAO-20/09: tab BCH DA TON TAI (tab===4 -> SiteCommandScreen); cho user test lai va yeu cau sua sau | CHECK | **DONE** |
| `PR-06` | Dự án | BCH: thêm/sửa/xoá theo quyền + link entity mở modal | P2 | PR-05 | - | - | NEW | CHECK | **DONE** |

---

# PHASE 5 — KHO VẬT TƯ

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `W-01` | Kho | Tách 5 mục: Kho · Nhập · Xuất · Điều chuyển · Dashboard tồn kho | P2 | U-03 | - | - | NEW | CHECK | **DONE** |
| `W-02` | Kho | Audit quan hệ **Project : Warehouse** — xác nhận 1:N | **P2** | — | - | - | - | - | **DONE** |
| `W-03` | Dự án | Khi tạo dự án: hỏi *"Tạo kho dự án?"* → Có thì tạo kho | P2 | W-02 | - | - | NEW | - | **BLOCKED** |
| `W-04` | Kho | Dashboard tồn kho: tổng · khả dụng · giữ chỗ · nhập · xuất · chờ chuyển · sắp hết · giá trị kho (§19) | P3 | W-01 | - | - | NEW | - | **DONE** |

---

# PHASE 6 — TỔ ĐỘI

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `TM-01` | Tổ đội | Danh sách: mã · tên · trạng thái · thành viên · dự án · hoạt động gần nhất | P2 | U-02 | - | - | FIX | - | **DONE** |
| `TM-02` | Tổ đội | Ưu tiên sắp xếp: ĐANG HOẠT ĐỘNG → hoạt động gần nhất ↓ → ngừng | P2 | TM-01 | - | - | FIX | - | **DONE** |
| `TM-03` | Tổ đội | Chi tiết: thông tin · nhân sự · dự án · kho · **cấp phát** · lịch sử | P2 | U-01 | - | - | NEW | - | **DONE** |
| `TM-04` | Tổ đội | CRUD đầy đủ: tạo · xem · sửa · ngừng (theo quyền) — ⚠️ **CHẶN ở nhánh «sửa»**: `grep` `update_project_team`/`save_project_team`/`edit_project_team` = **0** ở CẢ 2 route; `ActionRbacRegistry.java:39/:190/:73` chỉ có `create_project_team` + `set_project_team_status` + `delete_project_team`; muốn thêm action phải sửa `scripts/**` ⇒ **BỊ CẤM**. Đã làm được + có test: **tạo · xem · ngừng theo quyền**. Chi tiết `docs/agent-progress/TASK-101.md` §TM-04 | P2 | S-07 | - | NEW | DONE 21/09 theo QUYET DINH USER: chot lai pham vi — BO chu "sua" (khong ton tai action update_project_team; da lam tao/xem/ngung theo quyen + va call-site thieu action/permission) | CHECK | **DONE** |
| `TM-05` | Tổ đội | Tab **Cấp phát** — dùng lại logic cấp phát kho nếu tương thích | P2 | TM-03 | - | - | REUSE | CHECK | **DONE** |
| `TM-06` | Tổ đội | Audit `team_members` (hiện **0 dòng**) — xác định cách nạp dữ liệu. ⚠️ **TIỀN ĐỀ SAI**: CSDL thật **6 dòng (5 `active=1`)**, KHÔNG phải 0; cách nạp = **CONFIRMED «SQL ngoài sản phẩm»** (0 action ghi ở cả JS lẫn Java). Chi tiết `TASK-101.md` §TM-06 + `docs/agent-progress/TM-06-AUDIT-TEAM-MEMBERS.md` | P2 | — | - | - | - | - | **DONE** |

---

# PHASE 7 — QUẢN TRỊ HỆ THỐNG

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `AD-01` | Tài khoản | Đổi tên **Nhân sự → Tài khoản** | P3 | — | - | - | FIX | - | **DONE** |
| `AD-02` | Tài khoản | Bổ sung cột: mã · tên đăng nhập · họ tên · email · phòng · chức danh · cấp · hạn mức · trạng thái · **số quyền** · vai trò · đăng nhập cuối · ngày tạo | P3 | AD-01 | - | - | FIX | - | **DONE** |
| `AD-03` | Tài khoản | Bấm vào tài khoản → **User Detail Modal** — dùng LẠI cổng chung `ProjectEntityModal` → `EntityDetailModal` (U-01/PR-04), không dựng modal thứ hai | P3 | U-01 | - | - | NEW | CHECK | **DONE** |
| `AD-04` | Tài khoản | Sắp xếp mặc định: Trạng thái → Mã tài khoản | P3 | AD-02 | - | - | FIX | - | **DONE** |
| `AD-05` | Tổ chức | Tách sub-tab: **Cơ cấu tổ chức** ‖ **Tổ đội theo dự án** | P3 | U-03 | - | - | NEW | - | **DONE** |
| `AD-06` | Chức danh | Tách tab Chức danh / Vai trò; **phân biệt rõ Position với System Role** — kết luận CONFIRMED: Position = `role_catalog` (code/name/business_group/default_organization_unit), System Role = `role_catalog.base_role` mà `ActionRbacRegistry`/`RbacService` dùng để kiểm quyền; hồ sơ `docs/agent-progress/AD-06-POSITION-VA-SYSTEM-ROLE.md` | P3 | — | - | - | NEW | MODEL | **DONE** |
| `AD-07` | Nhóm quyền | Audit + giải thích cấu trúc nhóm quyền nghiệp vụ — **CONFIRMED và KHỚP kết luận A-15**: `department_module_permissions` là MẪU (seed `department_default`) + GIỚI HẠN khi ghi (`assertDepartmentAllowsPermissions`) + tiêu thụ ở nút «Sao chép từ phòng ban» (`app/page.tsx:1772`), **KHÔNG phải đường kiểm quyền** (cổng chạy chỉ đọc `user_module_permissions`: `RbacService.java:13`, `ModulePermissionStoreAdapter.java:12,51`); KHÔNG đổi kiến trúc; hồ sơ `docs/agent-progress/AD-07-NHOM-QUYEN-NGHIEP-VU-AUDIT.md` | **P0** | A-15 | - | - | - | MODEL | **DONE** |
| `AD-08` | Phòng ban | Bộ lọc phòng ban + chọn nhiều + **Xoá mục đã chọn** (có xác nhận + quyền) — mục bị xoá là DÒNG QUYỀN PHÒNG BAN (`department_module_permissions`) qua action ĐÃ CÓ `delete_department_permission` (`SystemController.java:395`); cổng quyền chỉ admin + phải chọn mục đã cấp; có `window.confirm` | P3 | S-07 | - | NEW | NEW | CHECK | **DONE** |
| `AD-09` | Người dùng | Cân đối lại toolbar phân quyền người dùng | P3 | U-03 | - | - | FIX | - | **DONE** |
| `AD-10` | Cấp bậc | Audit + sửa UI nếu cần + **kiểm thử kỹ** (không thiết kế lại) — CONFIRMED: 🔴 lỗi THẬT đã vá: nút «Xóa» cấp bậc gọi API không xác nhận và không chặn cấp bậc ĐANG DÙNG ⇒ nay có `canDeleteLevel` + `disabled` + `window.confirm`; giữ nguyên bảng/KPI gốc; hồ sơ `docs/agent-progress/AD-10-CAP-BAC-AUDIT.md` | P3 | — | - | - | FIX | - | **DONE** |
| `AD-11` | Phạm vi | Audit 2 sub-tab Project & Warehouse scope — CONFIRMED + ĐÍNH CHÍNH TIỀN ĐỀ: bước 8 KHÔNG có sub-tab (1 bảng gộp); cặp phạm vi kiểm độc lập thật nằm ở `UserAccessModal` («1. Phạm vi dự án» ‖ «2. Phạm vi kho bắt buộc», lưu qua `save_user_access` vào `user_project_scopes`/`user_warehouse_scopes`); KHÔNG dựng bản sao, KHÔNG ảnh hưởng roadmap; hồ sơ `docs/agent-progress/AD-11-PHAM-VI-DU-AN-KHO-AUDIT.md` | P3 | — | - | - | FIX | CHECK | **DONE** |
| `AD-12` | Ngoại lệ | Ghi rõ **Ngoại lệ cá nhân = ghi đè QUYỀN** vào tài liệu; giữ nguyên chức năng — đã ghi `docs/agent-progress/AD-12-NGOAI-LE-CA-NHAN-GHI-DE-QUYEN.md` (cơ chế `permission_source='manual_override'` ghi đè `department_default` trong CÙNG bảng `user_module_permissions`); KHÔNG đổi hành vi | P3 | A-08 | - | - | - | - | **DONE** |
| `AD-13` | Audit log | Tách riêng cột **User** và **Actor/Performed By** — User = tài khoản bản ghi thuộc về (`audit_logs.user_id` → `users`), Actor = tên người thực hiện đóng băng lúc ghi (`audit_logs.user_name`, `AuditLogAdapter.java:63`); UI ghi nguồn từng cột | P3 | U-02 | - | - | FIX | - | **DONE** |
| `AD-14` | Audit log | Thêm: hành động · module · thực thể · mã thực thể · thời gian · IP · kết quả · metadata — **DONE (21/09/2026, hồ sơ `docs/agent-progress/TASK-107.md`)**: cột `result` đã THÊM bằng migration ADDITIVE (drizzle `0162` + Flyway `V22`, đã áp CSDL thật: 895/895 dòng có `result` khác NULL · 0 dòng rỗng; cả 2 đường ghi JS+Java đều ghi `result`; bootstrap trả `result`; UI hiển thị đủ 8/8 trường); `metadata` = ÁNH XẠ **CHÍNH** `before_json` + `after_json` (người dùng chốt: KHÔNG thêm cột trùng nghĩa). Lịch sử: đợt audit trước ghi **BLOCKED** vì 6/8 trường có cột THẬT và đã hiển thị (action · module_key · entity_type · entity_id · occurred_at · ip_address) còn 2 trường `result` + `metadata` không có cột trong `audit_logs` (đọc bằng information_schema; cả 2 đường ghi khi đó đều không ghi); hồ sơ cũ (đã đóng) `docs/agent-progress/AD-14-AUDIT-LOG-KET-QUA-METADATA-BLOCKED.md` | P3 | AD-13 | - | - | FIX | - | **DONE** |
| `AD-15` | Cấu hình | Audit phụ thuộc; nếu không ảnh hưởng roadmap → **ghi backlog** — CONFIRMED: bước 12 gồm 5 khối (`FormFieldConfigManager` · `UiDisplaySettingsManager` · `FactoryResetAdmin` · `TrustLockAdmin` · nhật ký cấu hình), mọi action GHI đều ĐÃ CÓ; phụ thuộc license/trust thuộc nhánh bảo mật đã tạm hoãn ⇒ **KHÔNG ảnh hưởng roadmap**, đã ghi BACKLOG 3 mục `BL-AD15-1…3`; hồ sơ `docs/agent-progress/AD-15-CAU-HINH-PHU-THUOC-AUDIT.md` | P4 | — | - | - | - | - | **DONE** |
| `AD-16` | Tài khoản cá nhân | Cho user sửa thông tin được phép (tên hiển thị · ảnh · liên hệ · mật khẩu) — **BLOCKED**: 2/4 trường chạy THẬT (`update_profile_avatar` `scripts/system-route.mjs:3243` + `SystemController.java:253`; `change_password` `:3227` + `:236`), nhưng `users.full_name` (tên hiển thị) và `users.email` (liên hệ) **KHÔNG có action tự phục vụ** ở cả 2 đường ghi, muốn có phải thêm action = sửa `scripts/**` + Java (BỊ CẤM); UI chỉ rõ trường nào sửa được + lý do, KHÔNG dựng nút chết; hồ sơ `docs/agent-progress/AD-16-TU-SUA-THONG-TIN-BLOCKED.md` | P3 | S-07 | - | - | DONE 21/09 theo QUYET DINH USER: full_name/email CHI Admin sua (avatar + mat khau user tu sua duoc; 2 truong con lai khong co action tu sua) | CHECK | **DONE** |

---

# PHASE 8 — WORKFLOW

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `WF-01` | Workflow | Đổi tên tab thành **Workflow** | P3 | — | - | - | FIX | - | **DONE / DOI-TEN-TAB-WORKFLOW** |
| `WF-02` | Workflow | **Snapshot danh sách người được chỉ định** vào phiếu (bịt rủi ro §20.3) | **P1** | — | COL | - | - | - | **DONE / AP-DUNG 100** |
| `WF-03` | Workflow | Dùng cột `workflow_definitions.version` hoặc xoá nếu không dùng | P3 | WF-02 | - | - | - | - | **DONE / XOA-COT-DEAD-V19** |
| `WF-04` | Workflow | Hợp nhất 2 hệ (`workflow_*` và `approval_stage_catalog`) hoặc ghi rõ hệ nào là chính | P3 | WF-02 | - | - | - | MODEL | **DONE / GHI-RO-HE-CHINH** |
| `WF-05` | Workflow | Kiểm thử: đổi workflow khi có phiếu đang chờ → phiếu cũ phải giữ nguyên luồng | **P1** | WF-02 | - | - | - | - | **DONE** |
| `WF-06` | Workflow | Chuẩn bị mở rộng: nghỉ phép · tăng ca · chấm công bù · form tương lai | P4 | WF-04 | - | - | - | - | **DONE / SAN-SANG-MO-RONG** |

---

# PHASE 9 — BÁO CÁO & DASHBOARD

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `R-01` | Báo cáo | Kiến trúc báo cáo dùng chung (không hard-code từng báo cáo) | P4 | U-02 | - | NEW | NEW | - | **DONE / ENGINE + MAN DUNG CHUNG + 8 DINH NGHIA + ANH CHUAN 4/4** |
| `R-02` | Báo cáo | Báo cáo Mua hàng: số lượng MR/PR/PO · chờ · xong · từ chối · thời gian xử lý | P4 | R-01 | - | - | NEW | - | **DONE / 3-DINH-NGHIA + THOI-GIAN-XU-LY-TU-COT-DB-THAT + ANH-RUNTIME** |
| `R-03` | Báo cáo | Báo cáo Kho: tồn theo kho · giá trị · sắp hết · nhập/xuất | P4 | R-01 | - | - | NEW | - | **DONE / 4-DINH-NGHIA + FAN-OUT-DAU-TU-COT-DB-THAT + ENGINE-73-73** |
| `R-04` | Báo cáo | Báo cáo Dự án: trạng thái · thành viên · số tổ đội · số kho · tiến độ | P4 | R-01 | - | - | NEW | - | **DONE / 3-DINH-NGHIA + TO-DOI-KHO-THANH-VIEN-TU-COT-DB-THAT + ENGINE-90-90** |
| `R-05` | Báo cáo | Báo cáo Công việc: tỉ lệ hoàn thành · quá hạn · khối lượng · theo phòng | P4 | T-08 | - | - | NEW | - | **DONE / 3-DINH-NGHIA + QUA-HAN/TIEN-DO-TU-COT-DB-THAT + ENGINE-101-101** |

---

# PHASE 10 — MODULE TƯƠNG LAI (CHỈ AUDIT + CHUẨN BỊ KIẾN TRÚC)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `F-01` | MEP | **Làm rõ nghiệp vụ MEP với người dùng** (8 module chưa rõ phạm vi) | P5 | cần spec | - | - | - | - | **BLOCKED** |
| `F-02` | MEP | Roadmap MEP: thiết bị · bản vẽ · BOQ · lắp đặt · nghiệm thu · bàn giao | P5 | F-01 | TBL | - | - | - | TODO |
| `F-03` | Tài chính | Audit phụ thuộc, chuẩn bị kiến trúc — **không triển khai nghiệp vụ** | P5 | F-01 | - | - | - | - | TODO |
| `F-04` | Hành chính | Kiến trúc: chấm công · lịch làm việc · nghỉ phép | P5 | WF-06 | TBL | - | - | - | TODO |
| `F-05` | Hành chính | Lịch: ngày làm việc · nghỉ phép · ngày lễ · tăng ca · chấm công | P5 | F-04 | TBL | - | NEW | - | TODO |

---

# THỨ TỰ THỰC HIỆN ĐỀ XUẤT

```text
PHASE 0  AUDIT                    ✅ XONG
PHASE 0B BỊT LỖ HỔNG BẢO MẬT      ← BẮT BUỘC LÀM TRƯỚC, đang CHẶN mọi thứ
   S-01 → S-02 → S-03 → S-04 → S-05 → S-06 → S-07
   A-13 (backup) và A-15 (nhóm quyền) phải xong trước S-04
PHASE 1  HẠ TẦNG UI DÙNG CHUNG    ← nền cho mọi phase sau
PHASE 2  MUA HÀNG                 ← trọng tâm dự án
PHASE 3  CÔNG VIỆC
PHASE 4  DỰ ÁN
PHASE 5  KHO
PHASE 6  TỔ ĐỘI
PHASE 7  QUẢN TRỊ
PHASE 8  WORKFLOW                 ← WF-02 nên làm sớm, cùng PHASE 1
PHASE 9  BÁO CÁO
PHASE 10 TƯƠNG LAI                ← cần spec
```

---

# VIỆC CHẶN (BLOCKER) CẦN NGƯỜI DÙNG QUYẾT

| # | Vấn đề | Cần gì |
|---|---|---|
| 1 | **RBAC action không thực thi** — mọi tài khoản đã đăng nhập sửa được vật tư/NCC/BOQ/tài chính/HR | Cho phép sửa `SystemController` + `ActionRbacRegistry` để **bật kiểm quyền** (S-01…S-04) |
| 2 | Có **backup / PITR** cho MySQL chưa? | Xác nhận trước khi sửa dữ liệu lớn (A-13) |
| 3 | **Nhóm quyền nghiệp vụ** có tham gia kiểm quyền không? | Xác nhận (A-15) |
| 4 | **Nghiệp vụ MEP** gồm những gì? | Cần spec để mở khoá PHASE 10 |
| 5 | Sửa nốt **5 chỗ mã vai trò cũ** ở mảng sản lượng? | Xác nhận (P-09) |

---

# ĐỊNH NGHĨA HOÀN THÀNH (§44)

Một mục chỉ được đánh **DONE** khi thoả **tất cả**:

- [ ] Mã nguồn xong
- [ ] Giao diện chạy
- [ ] Backend chạy
- [ ] CSDL đúng
- [ ] Phân quyền đúng
- [ ] Không hồi quy rõ ràng
- [ ] Đã test luồng chính
- [ ] Đã kiểm responsive nếu là UI
- [ ] Tài liệu cập nhật nếu hành vi đổi
- [ ] Có commit rõ ràng
- [ ] TODO được cập nhật
