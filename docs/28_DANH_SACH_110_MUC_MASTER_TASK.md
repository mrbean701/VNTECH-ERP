# 28 — DANH SÁCH 110 MỤC CỦA MASTER TASK (bản đọc nhanh)

- **Sinh tự động lúc:** 17:34:18 17/9/2026
- **Nguồn sự thật:** `docs/25_TODO_ROADMAP.md` (bản phân rã MASTER TASK thành 12 phase có mục) — tệp này **không tự thêm/bớt mục nào**;
  mọi thay đổi phải sửa ở `25_TODO_ROADMAP.md` rồi chạy lại `node tools/gen-roadmap-110-md.mjs`.
- **Căn cứ audit:** `docs/24_SYSTEM_AUDIT_REPORT.md` · **Nhật ký thực thi:** `docs/agent-progress/TASK_INDEX.md`

## Tiến độ (đo từ chính 110 mục dưới đây)

| Trạng thái | Số mục | Tỷ lệ |
|---|---:|---:|
| **DONE** | 23 | 21% |
| Một phần (khung xong — chưa áp dụng / đang làm) | 6 | 5% |
| **TODO** (chưa bắt đầu) | 80 | 73% |
| BLOCKED (cần quyết định/spec của người dùng) | 1 | 1% |
| **Tổng** | **110** | 100% |

**Theo phase:**

| Phase | Tổng | DONE | Một phần | TODO | BLOCKED |
|---|---:|---:|---:|---:|---:|
| PHASE 0 — AUDIT | 16 | 12 | 0 | 4 | 0 |
| PHASE 0B — BỊT LỖ HỔNG BẢO MẬT (CHẶN MỌI THỨ KHÁC) | 10 | 8 | 0 | 2 | 0 |
| PHASE 1 — HẠ TẦNG UI DÙNG CHUNG | 17 | 3 | 6 | 8 | 0 |
| PHASE 2 — MUA HÀNG & CUNG ỨNG | 9 | 0 | 0 | 9 | 0 |
| PHASE 3 — CÔNG VIỆC / TASK MANAGEMENT | 10 | 0 | 0 | 10 | 0 |
| PHASE 4 — QUẢN LÝ DỰ ÁN | 6 | 0 | 0 | 6 | 0 |
| PHASE 5 — KHO VẬT TƯ | 4 | 0 | 0 | 4 | 0 |
| PHASE 6 — TỔ ĐỘI | 6 | 0 | 0 | 6 | 0 |
| PHASE 7 — QUẢN TRỊ HỆ THỐNG | 16 | 0 | 0 | 16 | 0 |
| PHASE 8 — WORKFLOW | 6 | 0 | 0 | 6 | 0 |
| PHASE 9 — BÁO CÁO & DASHBOARD | 5 | 0 | 0 | 5 | 0 |
| PHASE 10 — MODULE TƯƠNG LAI (CHỈ AUDIT + CHUẨN BỊ KIẾN TRÚC) | 5 | 0 | 0 | 4 | 1 |

---

## 1) Checklist phẳng — dùng như TODO

- [x] `A-01` · **Toàn hệ** — Quét repo, xác định stack/kiến trúc/entry point · `DONE`
- [x] `A-02` · **Toàn hệ** — Audit DB: 121 bảng, 2 nguồn migration · `DONE`
- [x] `A-03` · **Toàn hệ** — Audit API: 224 case vs 174 catalog · `DONE`
- [x] `A-04` · **Toàn hệ** — Audit authentication (PBKDF2, cookie, khoá đăng nhập) · `DONE`
- [x] `A-05` · **Toàn hệ** — Audit permission 3 tầng · `DONE`
- [x] `A-06` · **Toàn hệ** — **Kiểm chứng RBAC action bằng thực nghiệm** · `DONE`
- [x] `A-07` · **Workflow** — Audit workflow + versioning · `DONE`
- [x] `A-08` · **Admin** — Audit **Ngoại lệ cá nhân** (§35) · `DONE`
- [x] `A-09` · **Vật tư** — Audit **nhóm con vật tư** (§25) · `DONE`
- [x] `A-10` · **Toàn hệ** — Audit thành phần dùng chung + trùng lặp · `DONE`
- [x] `A-11` · **Toàn hệ** — Xuất AUDIT REPORT (`docs/24`) · `DONE`
- [x] `A-12` · **Toàn hệ** — Xuất TODO/ROADMAP (`docs/25`) · `DONE`
- [ ] `A-13` · **Hạ tầng** — **Xác nhận backup / PITR của MySQL** · `TODO`
- [ ] `A-14` · **Hạ tầng** — Xác nhận chính sách thời hạn phiên + thu hồi phiên · `TODO`
- [ ] `A-15` · **Admin** — Xác định **nhóm quyền nghiệp vụ** có tham gia kiểm quyền không · `TODO`
- [ ] `A-16` · **Toàn hệ** — Kiểm thử **cross-department / cross-project** · `TODO`
- [x] `S-01` · **Toàn hệ** — Điền module cho **29 action** khai rỗng trong `ActionRbacRegistry` (đo lại: 41 action rỗng đã được `requireRequireAdmin` che, 5 là hành động công khai) · `DONE`
- [x] `S-02` · **Toàn hệ** — **Bật `requireActionModule`** tại một điểm kiểm duy nhất trong `SystemController` · `DONE`
- [x] `S-03` · **Toàn hệ** — Đổi mặc định thành **TỪ CHỐI** khi action chưa khai module + `PUBLIC_ACTIONS` allowlist 5 hành động · `DONE`
- [x] `S-04` · **Toàn hệ** — Bật an toàn: thu hẹp phạm vi còn 29 action nghiệp vụ, không đụng 41 action đã che · `DONE`
- [ ] `S-05` · **Tệp** — Kiểm quyền cho `/api/files` (endpoint riêng, không đi qua action) · `TODO`
- [x] `S-06` · **Phòng ban** — Cấp `canApprove` cho BCH trên `receiving`/`warehouse_receipt` để bước "BCH xác nhận giao hàng" chạy được · `DONE`
- [x] `S-07` · **Toàn hệ** — Chạy `tools/probe-security-rbac.mjs` — viết lại để đo theo **quyền thật** của tài khoản · `DONE`
- [ ] `S-08` · **Workflow** — Snapshot **danh sách người được chỉ định**, không đọc live · `TODO`
- [x] `S-09` · **Toàn hệ** — 🐛 Sửa lỗi có sẵn: `ModulePermissionStoreAdapter.canUseModule` dùng `queryForObject` → ném `EmptyResultDataAccessException` (500) khi người dùng không có dòng quyền. Đổi sang `queryForList` · `DONE`
- [x] `S-10` · **Toàn hệ** — Chạy hồi quy sau khi bật RBAC: 13 probe + luồng mua hàng · `DONE`
- [ ] `U-01` · **UI** — `EntityDetailModal` — 1 khung cho User/Project/Warehouse/Team/Material/Supplier/Task · `KHUNG-XONG / AP-DUNG 0`
- [ ] `U-02` · **UI** — `DataTable` dùng chung: cột, sắp xếp, lọc, phân trang, rỗng/đang tải/lỗi · `KHUNG-XONG / AP-DUNG 0`
- [x] `U-03` · **UI** — `ListToolbar`: TIÊU ĐỀ + SỐ LƯỢNG ‖ TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG · `DONE / AP-DUNG 10`
- [ ] `U-04` · **UI** — `PermissionGuard` (ẩn/hiện theo quyền; backend vẫn kiểm) · `KHUNG-XONG / AP-DUNG 0`
- [x] `U-05` · **UI** — `StatusBadge` thống nhất toàn hệ · `DONE / AP-DUNG 2`
- [ ] `U-06` · **UI** — `ApprovalTimeline`: số bước · người duyệt · phòng ban · thời gian · trạng thái · ý kiến · `KHUNG-XONG / AP-DUNG 0`
- [ ] `U-07` · **UI** — `ActivityTimeline` dùng cho mọi lịch sử · `KHUNG-XONG / AP-DUNG 0`
- [x] `U-08` · **UI** — Kiểm responsive 4 kích thước cho mọi màn sau khi chuẩn hoá · `DONE`
- [ ] `U-09` · **UI** — Chuyển các danh sách sang khuôn Toolbar chuẩn (§5) · `DANG-LAM 9/32`
- [ ] `U-10` · **UI** — Sửa modal vượt viewport · `TODO`
- [ ] `U-11` · **Kiến trúc** — Tách `page.tsx` (4.057 dòng) thành module theo màn hình · `TODO`
- [ ] `U-12` · **CSS** — Loại `!important` theo từng nhóm; gộp 1.183 selector trùng · `TODO`
- [ ] `U-13` · **Kiến trúc** — Tách `TaskTable` ra khỏi thân render của `WorkCenter` — nợ có sẵn: `react-hooks/static-components` tại page.tsx:774, dùng ở 837/862/866 · `TODO`
- [ ] `U-14` · **UI** — **ÁP DỤNG** `EntityDetailModal` — dùng thật **0** lần; còn **4** chỗ tự viết .overlay · `TODO`
- [ ] `U-15` · **UI** — **ÁP DỤNG** `DataTable` + `StatusBadge` — DataTable dùng thật **0** lần, còn **100** bảng tự viết + **100** trạng thái rỗng tự viết; StatusBadge mới **2/88** chỗ · `TODO`
- [ ] `U-16` · **UI** — **ÁP DỤNG** `PermissionGuard` — dùng thật **0** lần; còn **50** chỗ điều kiện quyền rải rác · `TODO`
- [ ] `U-17` · **UI** — **ÁP DỤNG** `ApprovalTimeline`/`ActivityTimeline` — dùng thật **0** lần; còn **3** chỗ tự viết dải · `TODO`
- [ ] `P-01` · **Mua hàng** — Tách **MR · PR · PO** thành 3 tab riêng · `TODO`
- [ ] `P-02` · **Mua hàng** — Sắp xếp mặc định `created DESC`; Completed/Rejected xuống cuối · `TODO`
- [ ] `P-03` · **Mua hàng** — Lọc theo Trạng thái · Ngày · Phòng ban · Người tạo · NCC · Dự án · `TODO`
- [ ] `P-04` · **Phiếu** — **Approval Timeline** trong chi tiết phiếu (§8.1) · `TODO`
- [ ] `P-05` · **Phiếu** — **Tổng hợp giao nhận** → modal riêng (§8.2) · `TODO`
- [ ] `P-06` · **Phiếu** — Hồ sơ vật tư đặc thù: ảnh/tệp xem được, không tràn khung (§8.3) · `TODO`
- [ ] `P-07` · **NCC** — Tách **Nhà cung cấp / Đối tác** thành menu độc lập (§17) · `TODO`
- [ ] `P-08` · **NCC** — Liên kết Supplier ↔ MR/PR/PO ↔ Material · `TODO`
- [ ] `P-09` · **Mua hàng** — Sửa **5 chỗ `requireRole` dùng mã vai trò cũ** ở `ProductionManagementUseCase` · `TODO`
- [ ] `T-01` · **Công việc** — Tách menu 5 mục: cá nhân · phòng ban · giao việc · dashboard · báo cáo · `TODO`
- [ ] `T-02` · **Công việc** — Audit mô hình dữ liệu task hiện có (đã có `work_items`) · `TODO`
- [ ] `T-03` · **Công việc** — Bổ sung trường còn thiếu: tiến độ · huỷ lúc · ghi chú · tệp · `TODO`
- [ ] `T-04` · **Công việc** — `TaskAssignment` · `TaskComment` · `TaskAttachment` · `TaskHistory` · `TaskParticipant` · `TODO`
- [ ] `T-05` · **Công việc** — Việc cá nhân: của tôi · được giao · do tôi tạo · `TODO`
- [ ] `T-06` · **Công việc** — Việc phòng ban: giới hạn theo phạm vi được phép · `TODO`
- [ ] `T-07` · **Công việc** — Board Kanban — **phân biệt rõ Ưu tiên / Trạng thái / Phân công** · `TODO`
- [ ] `T-08` · **Công việc** — Dashboard cá nhân + phòng ban + dự án (§11) · `TODO`
- [ ] `T-09` · **Công việc** — Kiến trúc Task → Team → Thành viên → Hỗ trợ liên phòng (§10) · `TODO`
- [ ] `T-10` · **Phê duyệt** — **Tách Approval Center thành module độc lập** (§12) · `TODO`
- [ ] `PR-01` · **Dự án** — Danh sách dự án thành tab riêng + toolbar cân đối · `TODO`
- [ ] `PR-02` · **Dự án** — Lọc: Trạng thái · Quản lý dự án · Phòng ban · Ngày · `TODO`
- [ ] `PR-03` · **Dự án** — Chi tiết dự án thành tab/modal: chung · nhân sự · tổ đội · kho · lịch sử · `TODO`
- [ ] `PR-04` · **Dự án** — Bấm vào Project/User/Warehouse/Team → mở **EntityDetailModal** · `TODO`
- [ ] `PR-05` · **Dự án** — **Ban chỉ huy dự án** thành tab riêng (§14) · `TODO`
- [ ] `PR-06` · **Dự án** — BCH: thêm/sửa/xoá theo quyền + link entity mở modal · `TODO`
- [ ] `W-01` · **Kho** — Tách 5 mục: Kho · Nhập · Xuất · Điều chuyển · Dashboard tồn kho · `TODO`
- [ ] `W-02` · **Kho** — Audit quan hệ **Project : Warehouse** — xác nhận 1:N · `TODO`
- [ ] `W-03` · **Dự án** — Khi tạo dự án: hỏi *"Tạo kho dự án?"* → Có thì tạo kho · `TODO`
- [ ] `W-04` · **Kho** — Dashboard tồn kho: tổng · khả dụng · giữ chỗ · nhập · xuất · chờ chuyển · sắp hết · giá trị kho (§19) · `TODO`
- [ ] `TM-01` · **Tổ đội** — Danh sách: mã · tên · trạng thái · thành viên · dự án · hoạt động gần nhất · `TODO`
- [ ] `TM-02` · **Tổ đội** — Ưu tiên sắp xếp: ĐANG HOẠT ĐỘNG → hoạt động gần nhất ↓ → ngừng · `TODO`
- [ ] `TM-03` · **Tổ đội** — Chi tiết: thông tin · nhân sự · dự án · kho · **cấp phát** · lịch sử · `TODO`
- [ ] `TM-04` · **Tổ đội** — CRUD đầy đủ: tạo · xem · sửa · ngừng (theo quyền) · `TODO`
- [ ] `TM-05` · **Tổ đội** — Tab **Cấp phát** — dùng lại logic cấp phát kho nếu tương thích · `TODO`
- [ ] `TM-06` · **Tổ đội** — Audit `team_members` (hiện **0 dòng**) — xác định cách nạp dữ liệu · `TODO`
- [ ] `AD-01` · **Tài khoản** — Đổi tên **Nhân sự → Tài khoản** · `TODO`
- [ ] `AD-02` · **Tài khoản** — Bổ sung cột: mã · tên đăng nhập · họ tên · email · phòng · chức danh · cấp · hạn mức · trạng thái · **số quyền** · vai trò · đăng nhập cuối · ngày tạo · `TODO`
- [ ] `AD-03` · **Tài khoản** — Bấm vào tài khoản → **User Detail Modal** · `TODO`
- [ ] `AD-04` · **Tài khoản** — Sắp xếp mặc định: Trạng thái → Mã tài khoản · `TODO`
- [ ] `AD-05` · **Tổ chức** — Tách sub-tab: **Cơ cấu tổ chức** ‖ **Tổ đội theo dự án** · `TODO`
- [ ] `AD-06` · **Chức danh** — Tách tab Chức danh / Vai trò; **phân biệt rõ Position với System Role** · `TODO`
- [ ] `AD-07` · **Nhóm quyền** — Audit + giải thích cấu trúc nhóm quyền nghiệp vụ · `TODO`
- [ ] `AD-08` · **Phòng ban** — Bộ lọc phòng ban + chọn nhiều + **Xoá mục đã chọn** (có xác nhận + quyền) · `TODO`
- [ ] `AD-09` · **Người dùng** — Cân đối lại toolbar phân quyền người dùng · `TODO`
- [ ] `AD-10` · **Cấp bậc** — Audit + sửa UI nếu cần + **kiểm thử kỹ** (không thiết kế lại) · `TODO`
- [ ] `AD-11` · **Phạm vi** — Audit 2 sub-tab Project & Warehouse scope · `TODO`
- [ ] `AD-12` · **Ngoại lệ** — Ghi rõ **Ngoại lệ cá nhân = ghi đè QUYỀN** vào tài liệu; giữ nguyên chức năng · `TODO`
- [ ] `AD-13` · **Audit log** — Tách riêng cột **User** và **Actor/Performed By** · `TODO`
- [ ] `AD-14` · **Audit log** — Thêm: hành động · module · thực thể · mã thực thể · thời gian · IP · kết quả · metadata · `TODO`
- [ ] `AD-15` · **Cấu hình** — Audit phụ thuộc; nếu không ảnh hưởng roadmap → **ghi backlog** · `TODO`
- [ ] `AD-16` · **Tài khoản cá nhân** — Cho user sửa thông tin được phép (tên hiển thị · ảnh · liên hệ · mật khẩu) · `TODO`
- [ ] `WF-01` · **Workflow** — Đổi tên tab thành **Workflow** · `TODO`
- [ ] `WF-02` · **Workflow** — **Snapshot danh sách người được chỉ định** vào phiếu (bịt rủi ro §20.3) · `TODO`
- [ ] `WF-03` · **Workflow** — Dùng cột `workflow_definitions.version` hoặc xoá nếu không dùng · `TODO`
- [ ] `WF-04` · **Workflow** — Hợp nhất 2 hệ (`workflow_*` và `approval_stage_catalog`) hoặc ghi rõ hệ nào là chính · `TODO`
- [ ] `WF-05` · **Workflow** — Kiểm thử: đổi workflow khi có phiếu đang chờ → phiếu cũ phải giữ nguyên luồng · `TODO`
- [ ] `WF-06` · **Workflow** — Chuẩn bị mở rộng: nghỉ phép · tăng ca · chấm công bù · form tương lai · `TODO`
- [ ] `R-01` · **Báo cáo** — Kiến trúc báo cáo dùng chung (không hard-code từng báo cáo) · `TODO`
- [ ] `R-02` · **Báo cáo** — Báo cáo Mua hàng: số lượng MR/PR/PO · chờ · xong · từ chối · thời gian xử lý · `TODO`
- [ ] `R-03` · **Báo cáo** — Báo cáo Kho: tồn theo kho · giá trị · sắp hết · nhập/xuất · `TODO`
- [ ] `R-04` · **Báo cáo** — Báo cáo Dự án: trạng thái · thành viên · số tổ đội · số kho · tiến độ · `TODO`
- [ ] `R-05` · **Báo cáo** — Báo cáo Công việc: tỉ lệ hoàn thành · quá hạn · khối lượng · theo phòng · `TODO`
- [ ] `F-01` · **MEP** — **Làm rõ nghiệp vụ MEP với người dùng** (8 module chưa rõ phạm vi) · `BLOCKED`
- [ ] `F-02` · **MEP** — Roadmap MEP: thiết bị · bản vẽ · BOQ · lắp đặt · nghiệm thu · bàn giao · `TODO`
- [ ] `F-03` · **Tài chính** — Audit phụ thuộc, chuẩn bị kiến trúc — **không triển khai nghiệp vụ** · `TODO`
- [ ] `F-04` · **Hành chính** — Kiến trúc: chấm công · lịch làm việc · nghỉ phép · `TODO`
- [ ] `F-05` · **Hành chính** — Lịch: ngày làm việc · nghỉ phép · ngày lễ · tăng ca · chấm công · `TODO`

---

## 2) Bảng đầy đủ theo phase

### PHASE 0 — AUDIT — 16 mục (DONE 12)

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
| `A-13` | Hạ tầng | **Xác nhận backup / PITR của MySQL** | **P0** | — | - | - | - | - | **TODO** |
| `A-14` | Hạ tầng | Xác nhận chính sách thời hạn phiên + thu hồi phiên | P1 | — | - | - | - | - | **TODO** |
| `A-15` | Admin | Xác định **nhóm quyền nghiệp vụ** có tham gia kiểm quyền không | **P0** | — | - | - | - | MODEL | **TODO** |
| `A-16` | Toàn hệ | Kiểm thử **cross-department / cross-project** | P1 | A-06 | - | - | - | CHECK | **TODO** |

### PHASE 0B — BỊT LỖ HỔNG BẢO MẬT (CHẶN MỌI THỨ KHÁC) — 10 mục (DONE 8)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `S-01` | Toàn hệ | Điền module cho **29 action** khai rỗng trong `ActionRbacRegistry` (đo lại: 41 action rỗng đã được `requireRequireAdmin` che, 5 là hành động công khai) | **P0** | A-06 | - | - | - | CHECK | **DONE** |
| `S-02` | Toàn hệ | **Bật `requireActionModule`** tại một điểm kiểm duy nhất trong `SystemController` | **P0** | S-01 | - | - | - | CHECK | **DONE** |
| `S-03` | Toàn hệ | Đổi mặc định thành **TỪ CHỐI** khi action chưa khai module + `PUBLIC_ACTIONS` allowlist 5 hành động | **P0** | S-02 | - | - | - | CHECK | **DONE** |
| `S-04` | Toàn hệ | Bật an toàn: thu hẹp phạm vi còn 29 action nghiệp vụ, không đụng 41 action đã che | **P0** | S-03 | - | - | - | CHECK | **DONE** |
| `S-05` | Tệp | Kiểm quyền cho `/api/files` (endpoint riêng, không đi qua action) | **P0** | — | - | CHG | - | CHECK | **TODO** |
| `S-06` | Phòng ban | Cấp `canApprove` cho BCH trên `receiving`/`warehouse_receipt` để bước "BCH xác nhận giao hàng" chạy được | **P0** | S-01 | - | - | - | MODEL | **DONE** |
| `S-07` | Toàn hệ | Chạy `tools/probe-security-rbac.mjs` — viết lại để đo theo **quyền thật** của tài khoản | **P0** | S-04 | - | - | - | CHECK | **DONE** |
| `S-08` | Workflow | Snapshot **danh sách người được chỉ định**, không đọc live | P1 | — | COL | - | - | - | **TODO** |
| `S-09` | Toàn hệ | 🐛 Sửa lỗi có sẵn: `ModulePermissionStoreAdapter.canUseModule` dùng `queryForObject` → ném `EmptyResultDataAccessException` (500) khi người dùng không có dòng quyền. Đổi sang `queryForList` | **P0** | — | - | - | - | CHECK | **DONE** |
| `S-10` | Toàn hệ | Chạy hồi quy sau khi bật RBAC: 13 probe + luồng mua hàng | **P0** | S-07 | - | - | - | - | **DONE** |

### PHASE 1 — HẠ TẦNG UI DÙNG CHUNG — 17 mục (DONE 3)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `U-01` | UI | `EntityDetailModal` — 1 khung cho User/Project/Warehouse/Team/Material/Supplier/Task | P1 | S-07 | - | - | REUSE | CHECK | **KHUNG-XONG / AP-DUNG 0** |
| `U-02` | UI | `DataTable` dùng chung: cột, sắp xếp, lọc, phân trang, rỗng/đang tải/lỗi | P1 | — | - | - | REUSE | - | **KHUNG-XONG / AP-DUNG 0** |
| `U-03` | UI | `ListToolbar`: TIÊU ĐỀ + SỐ LƯỢNG ‖ TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG | P1 | — | - | - | REUSE | - | **DONE / AP-DUNG 10** |
| `U-04` | UI | `PermissionGuard` (ẩn/hiện theo quyền; backend vẫn kiểm) | P1 | S-07 | - | - | REUSE | CHECK | **KHUNG-XONG / AP-DUNG 0** |
| `U-05` | UI | `StatusBadge` thống nhất toàn hệ | P1 | — | - | - | REUSE | - | **DONE / AP-DUNG 2** |
| `U-06` | UI | `ApprovalTimeline`: số bước · người duyệt · phòng ban · thời gian · trạng thái · ý kiến | P1 | — | - | - | NEW | - | **KHUNG-XONG / AP-DUNG 0** |
| `U-07` | UI | `ActivityTimeline` dùng cho mọi lịch sử | P1 | — | - | - | NEW | - | **KHUNG-XONG / AP-DUNG 0** |
| `U-08` | UI | Kiểm responsive 4 kích thước cho mọi màn sau khi chuẩn hoá | P1 | U-02,U-03 | - | - | FIX | - | **DONE** |
| `U-09` | UI | Chuyển các danh sách sang khuôn Toolbar chuẩn (§5) | P1 | U-03 | - | - | FIX | - | **DANG-LAM 9/32** |
| `U-10` | UI | Sửa modal vượt viewport | P1 | — | - | - | FIX | - | **TODO** |
| `U-11` | Kiến trúc | Tách `page.tsx` (4.057 dòng) thành module theo màn hình | P1 | U-01…U-05 | - | - | - | - | **TODO** |
| `U-12` | CSS | Loại `!important` theo từng nhóm; gộp 1.183 selector trùng | P2 | U-11 | - | - | FIX | - | **TODO** |
| `U-13` | Kiến trúc | Tách `TaskTable` ra khỏi thân render của `WorkCenter` — nợ có sẵn: `react-hooks/static-components` tại page.tsx:774, dùng ở 837/862/866 | P2 | U-11 | - | - | - | - | **TODO** |
| `U-14` | UI | **ÁP DỤNG** `EntityDetailModal` — dùng thật **0** lần; còn **4** chỗ tự viết .overlay | P1 | U-01 | - | - | REUSE | CHECK | **TODO** |
| `U-15` | UI | **ÁP DỤNG** `DataTable` + `StatusBadge` — DataTable dùng thật **0** lần, còn **100** bảng tự viết + **100** trạng thái rỗng tự viết; StatusBadge mới **2/88** chỗ | P1 | U-02,U-05 | - | - | REUSE | - | **TODO** |
| `U-16` | UI | **ÁP DỤNG** `PermissionGuard` — dùng thật **0** lần; còn **50** chỗ điều kiện quyền rải rác | P1 | U-04 | - | - | REUSE | CHECK | **TODO** |
| `U-17` | UI | **ÁP DỤNG** `ApprovalTimeline`/`ActivityTimeline` — dùng thật **0** lần; còn **3** chỗ tự viết dải | P1 | U-06,U-07 | - | - | REUSE | - | **TODO** |

### PHASE 2 — MUA HÀNG & CUNG ỨNG — 9 mục (DONE 0)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `P-01` | Mua hàng | Tách **MR · PR · PO** thành 3 tab riêng | P2 | U-03 | - | - | NEW | CHECK | **TODO** |
| `P-02` | Mua hàng | Sắp xếp mặc định `created DESC`; Completed/Rejected xuống cuối | P2 | P-01 | - | - | FIX | - | **TODO** |
| `P-03` | Mua hàng | Lọc theo Trạng thái · Ngày · Phòng ban · Người tạo · NCC · Dự án | P2 | P-01 | - | - | FIX | - | **TODO** |
| `P-04` | Phiếu | **Approval Timeline** trong chi tiết phiếu (§8.1) | P2 | U-06 | - | - | NEW | - | **TODO** |
| `P-05` | Phiếu | **Tổng hợp giao nhận** → modal riêng (§8.2) | P2 | U-01 | - | - | NEW | - | **TODO** |
| `P-06` | Phiếu | Hồ sơ vật tư đặc thù: ảnh/tệp xem được, không tràn khung (§8.3) | P2 | — | - | - | FIX | - | **TODO** |
| `P-07` | NCC | Tách **Nhà cung cấp / Đối tác** thành menu độc lập (§17) | P2 | S-07 | - | - | NEW | CHECK | **TODO** |
| `P-08` | NCC | Liên kết Supplier ↔ MR/PR/PO ↔ Material | P3 | P-07 | - | - | NEW | - | **TODO** |
| `P-09` | Mua hàng | Sửa **5 chỗ `requireRole` dùng mã vai trò cũ** ở `ProductionManagementUseCase` | P2 | S-07 | - | - | - | CHECK | **TODO** |

### PHASE 3 — CÔNG VIỆC / TASK MANAGEMENT — 10 mục (DONE 0)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `T-01` | Công việc | Tách menu 5 mục: cá nhân · phòng ban · giao việc · dashboard · báo cáo | P2 | U-03 | - | - | NEW | CHECK | **TODO** |
| `T-02` | Công việc | Audit mô hình dữ liệu task hiện có (đã có `work_items`) | **P2** | — | - | - | - | - | **TODO** |
| `T-03` | Công việc | Bổ sung trường còn thiếu: tiến độ · huỷ lúc · ghi chú · tệp | P2 | T-02 | COL | - | - | - | **TODO** |
| `T-04` | Công việc | `TaskAssignment` · `TaskComment` · `TaskAttachment` · `TaskHistory` · `TaskParticipant` | P2 | T-02 | TBL | NEW | NEW | - | **TODO** |
| `T-05` | Công việc | Việc cá nhân: của tôi · được giao · do tôi tạo | P2 | T-01 | - | - | NEW | CHECK | **TODO** |
| `T-06` | Công việc | Việc phòng ban: giới hạn theo phạm vi được phép | P2 | T-01 | - | - | NEW | CHECK | **TODO** |
| `T-07` | Công việc | Board Kanban — **phân biệt rõ Ưu tiên / Trạng thái / Phân công** | P2 | T-03,T-04 | - | - | NEW | - | **TODO** |
| `T-08` | Công việc | Dashboard cá nhân + phòng ban + dự án (§11) | P3 | T-05,T-06 | - | - | NEW | CHECK | **TODO** |
| `T-09` | Công việc | Kiến trúc Task → Team → Thành viên → Hỗ trợ liên phòng (§10) | P3 | T-04 | TBL | - | - | - | **TODO** |
| `T-10` | Phê duyệt | **Tách Approval Center thành module độc lập** (§12) | P2 | U-06 | - | - | NEW | CHECK | **TODO** |

### PHASE 4 — QUẢN LÝ DỰ ÁN — 6 mục (DONE 0)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `PR-01` | Dự án | Danh sách dự án thành tab riêng + toolbar cân đối | P2 | U-03 | - | - | NEW | CHECK | **TODO** |
| `PR-02` | Dự án | Lọc: Trạng thái · Quản lý dự án · Phòng ban · Ngày | P2 | PR-01 | - | - | FIX | - | **TODO** |
| `PR-03` | Dự án | Chi tiết dự án thành tab/modal: chung · nhân sự · tổ đội · kho · lịch sử | P2 | U-01 | - | - | NEW | - | **TODO** |
| `PR-04` | Dự án | Bấm vào Project/User/Warehouse/Team → mở **EntityDetailModal** | P2 | U-01 | - | - | NEW | CHECK | **TODO** |
| `PR-05` | Dự án | **Ban chỉ huy dự án** thành tab riêng (§14) | P2 | PR-01 | - | - | NEW | CHECK | **TODO** |
| `PR-06` | Dự án | BCH: thêm/sửa/xoá theo quyền + link entity mở modal | P2 | PR-05 | - | - | NEW | CHECK | **TODO** |

### PHASE 5 — KHO VẬT TƯ — 4 mục (DONE 0)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `W-01` | Kho | Tách 5 mục: Kho · Nhập · Xuất · Điều chuyển · Dashboard tồn kho | P2 | U-03 | - | - | NEW | CHECK | **TODO** |
| `W-02` | Kho | Audit quan hệ **Project : Warehouse** — xác nhận 1:N | **P2** | — | - | - | - | - | **TODO** |
| `W-03` | Dự án | Khi tạo dự án: hỏi *"Tạo kho dự án?"* → Có thì tạo kho | P2 | W-02 | - | - | NEW | - | **TODO** |
| `W-04` | Kho | Dashboard tồn kho: tổng · khả dụng · giữ chỗ · nhập · xuất · chờ chuyển · sắp hết · giá trị kho (§19) | P3 | W-01 | - | - | NEW | - | **TODO** |

### PHASE 6 — TỔ ĐỘI — 6 mục (DONE 0)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `TM-01` | Tổ đội | Danh sách: mã · tên · trạng thái · thành viên · dự án · hoạt động gần nhất | P2 | U-02 | - | - | FIX | - | **TODO** |
| `TM-02` | Tổ đội | Ưu tiên sắp xếp: ĐANG HOẠT ĐỘNG → hoạt động gần nhất ↓ → ngừng | P2 | TM-01 | - | - | FIX | - | **TODO** |
| `TM-03` | Tổ đội | Chi tiết: thông tin · nhân sự · dự án · kho · **cấp phát** · lịch sử | P2 | U-01 | - | - | NEW | - | **TODO** |
| `TM-04` | Tổ đội | CRUD đầy đủ: tạo · xem · sửa · ngừng (theo quyền) | P2 | S-07 | - | NEW | NEW | CHECK | **TODO** |
| `TM-05` | Tổ đội | Tab **Cấp phát** — dùng lại logic cấp phát kho nếu tương thích | P2 | TM-03 | - | - | REUSE | CHECK | **TODO** |
| `TM-06` | Tổ đội | Audit `team_members` (hiện **0 dòng**) — xác định cách nạp dữ liệu | P2 | — | - | - | - | - | **TODO** |

### PHASE 7 — QUẢN TRỊ HỆ THỐNG — 16 mục (DONE 0)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `AD-01` | Tài khoản | Đổi tên **Nhân sự → Tài khoản** | P3 | — | - | - | FIX | - | **TODO** |
| `AD-02` | Tài khoản | Bổ sung cột: mã · tên đăng nhập · họ tên · email · phòng · chức danh · cấp · hạn mức · trạng thái · **số quyền** · vai trò · đăng nhập cuối · ngày tạo | P3 | AD-01 | - | - | FIX | - | **TODO** |
| `AD-03` | Tài khoản | Bấm vào tài khoản → **User Detail Modal** | P3 | U-01 | - | - | NEW | CHECK | **TODO** |
| `AD-04` | Tài khoản | Sắp xếp mặc định: Trạng thái → Mã tài khoản | P3 | AD-02 | - | - | FIX | - | **TODO** |
| `AD-05` | Tổ chức | Tách sub-tab: **Cơ cấu tổ chức** ‖ **Tổ đội theo dự án** | P3 | U-03 | - | - | NEW | - | **TODO** |
| `AD-06` | Chức danh | Tách tab Chức danh / Vai trò; **phân biệt rõ Position với System Role** | P3 | — | - | - | NEW | MODEL | **TODO** |
| `AD-07` | Nhóm quyền | Audit + giải thích cấu trúc nhóm quyền nghiệp vụ | **P0** | A-15 | - | - | - | MODEL | **TODO** |
| `AD-08` | Phòng ban | Bộ lọc phòng ban + chọn nhiều + **Xoá mục đã chọn** (có xác nhận + quyền) | P3 | S-07 | - | NEW | NEW | CHECK | **TODO** |
| `AD-09` | Người dùng | Cân đối lại toolbar phân quyền người dùng | P3 | U-03 | - | - | FIX | - | **TODO** |
| `AD-10` | Cấp bậc | Audit + sửa UI nếu cần + **kiểm thử kỹ** (không thiết kế lại) | P3 | — | - | - | FIX | - | **TODO** |
| `AD-11` | Phạm vi | Audit 2 sub-tab Project & Warehouse scope | P3 | — | - | - | FIX | CHECK | **TODO** |
| `AD-12` | Ngoại lệ | Ghi rõ **Ngoại lệ cá nhân = ghi đè QUYỀN** vào tài liệu; giữ nguyên chức năng | P3 | A-08 | - | - | - | - | **TODO** |
| `AD-13` | Audit log | Tách riêng cột **User** và **Actor/Performed By** | P3 | U-02 | - | - | FIX | - | **TODO** |
| `AD-14` | Audit log | Thêm: hành động · module · thực thể · mã thực thể · thời gian · IP · kết quả · metadata | P3 | AD-13 | - | - | FIX | - | **TODO** |
| `AD-15` | Cấu hình | Audit phụ thuộc; nếu không ảnh hưởng roadmap → **ghi backlog** | P4 | — | - | - | - | - | **TODO** |
| `AD-16` | Tài khoản cá nhân | Cho user sửa thông tin được phép (tên hiển thị · ảnh · liên hệ · mật khẩu) | P3 | S-07 | - | - | FIX | CHECK | **TODO** |

### PHASE 8 — WORKFLOW — 6 mục (DONE 0)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `WF-01` | Workflow | Đổi tên tab thành **Workflow** | P3 | — | - | - | FIX | - | **TODO** |
| `WF-02` | Workflow | **Snapshot danh sách người được chỉ định** vào phiếu (bịt rủi ro §20.3) | **P1** | — | COL | - | - | - | **TODO** |
| `WF-03` | Workflow | Dùng cột `workflow_definitions.version` hoặc xoá nếu không dùng | P3 | WF-02 | - | - | - | - | **TODO** |
| `WF-04` | Workflow | Hợp nhất 2 hệ (`workflow_*` và `approval_stage_catalog`) hoặc ghi rõ hệ nào là chính | P3 | WF-02 | - | - | - | MODEL | **TODO** |
| `WF-05` | Workflow | Kiểm thử: đổi workflow khi có phiếu đang chờ → phiếu cũ phải giữ nguyên luồng | **P1** | WF-02 | - | - | - | - | **TODO** |
| `WF-06` | Workflow | Chuẩn bị mở rộng: nghỉ phép · tăng ca · chấm công bù · form tương lai | P4 | WF-04 | - | - | - | - | **TODO** |

### PHASE 9 — BÁO CÁO & DASHBOARD — 5 mục (DONE 0)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `R-01` | Báo cáo | Kiến trúc báo cáo dùng chung (không hard-code từng báo cáo) | P4 | U-02 | - | NEW | NEW | - | **TODO** |
| `R-02` | Báo cáo | Báo cáo Mua hàng: số lượng MR/PR/PO · chờ · xong · từ chối · thời gian xử lý | P4 | R-01 | - | - | NEW | - | **TODO** |
| `R-03` | Báo cáo | Báo cáo Kho: tồn theo kho · giá trị · sắp hết · nhập/xuất | P4 | R-01 | - | - | NEW | - | **TODO** |
| `R-04` | Báo cáo | Báo cáo Dự án: trạng thái · thành viên · số tổ đội · số kho · tiến độ | P4 | R-01 | - | - | NEW | - | **TODO** |
| `R-05` | Báo cáo | Báo cáo Công việc: tỉ lệ hoàn thành · quá hạn · khối lượng · theo phòng | P4 | T-08 | - | - | NEW | - | **TODO** |

### PHASE 10 — MODULE TƯƠNG LAI (CHỈ AUDIT + CHUẨN BỊ KIẾN TRÚC) — 5 mục (DONE 0)

| ID | Module | Việc | Ưu tiên | Phụ thuộc | DB | API | UI | QUYỀN | TT |
|---|---|---|---|---|---|---|---|---|---|
| `F-01` | MEP | **Làm rõ nghiệp vụ MEP với người dùng** (8 module chưa rõ phạm vi) | P5 | cần spec | - | - | - | - | **BLOCKED** |
| `F-02` | MEP | Roadmap MEP: thiết bị · bản vẽ · BOQ · lắp đặt · nghiệm thu · bàn giao | P5 | F-01 | TBL | - | - | - | **TODO** |
| `F-03` | Tài chính | Audit phụ thuộc, chuẩn bị kiến trúc — **không triển khai nghiệp vụ** | P5 | F-01 | - | - | - | - | **TODO** |
| `F-04` | Hành chính | Kiến trúc: chấm công · lịch làm việc · nghỉ phép | P5 | WF-06 | TBL | - | - | - | **TODO** |
| `F-05` | Hành chính | Lịch: ngày làm việc · nghỉ phép · ngày lễ · tăng ca · chấm công | P5 | F-04 | TBL | - | NEW | - | **TODO** |

---

## 3) Việc CHẶN cần người dùng quyết

| # | Vấn đề | Cần gì |
|---|---|---|
| 1 | **RBAC action không thực thi** — mọi tài khoản đã đăng nhập sửa được vật tư/NCC/BOQ/tài chính/HR | Cho phép sửa `SystemController` + `ActionRbacRegistry` để **bật kiểm quyền** (S-01…S-04) |
| 2 | Có **backup / PITR** cho MySQL chưa? | Xác nhận trước khi sửa dữ liệu lớn (A-13) |
| 3 | **Nhóm quyền nghiệp vụ** có tham gia kiểm quyền không? | Xác nhận (A-15) |
| 4 | **Nghiệp vụ MEP** gồm những gì? | Cần spec để mở khoá PHASE 10 |
| 5 | Sửa nốt **5 chỗ mã vai trò cũ** ở mảng sản lượng? | Xác nhận (P-09) |

> Ngoài 5 việc chặn trên, còn **11 câu hỏi xác nhận** đang mở trong `docs/agent-progress/MASTER_STATUS.md`
> (số SLA thật, hệ license, nhóm quyền nghiệp vụ, backup/PITR, dữ liệu mẫu…).

---

## 4) Định nghĩa HOÀN THÀNH (§44) — một mục chỉ được đánh DONE khi thoả TẤT CẢ

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
