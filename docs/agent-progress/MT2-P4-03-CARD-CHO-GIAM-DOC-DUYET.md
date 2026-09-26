# MT2-P4-03 — CARD «CHỜ GIÁM ĐỐC DUYỆT» LẤY DỮ LIỆU THỰC (§4.1)

> Trạng thái: **IN_PROGRESS — audit mở đầu xong, chưa code**
> Phase: **PHASE 4 — RBAC & PHẠM VI THEO CHỨC VỤ** · Ngày: 22/09/2026

## 1. YÊU CẦU — NGUYÊN VĂN
**§4.1 Dashboard approval cards** (`docs/dsh/MASTER_TASK_2.md:50-52`):
```text
:51  ⛔ KHÔNG hiển thị card «phiếu đang chờ duyệt» cho user ⛔ không có quyền quản trị hệ thống
     hoặc ⛔ không có chức vụ tương đương/c…            ← (dòng bị cắt trong tệp — cần đọc đủ nếu dùng)
:52  ➕ **PHẢI có card «Chờ Giám đốc duyệt»** — lấy dữ liệu **THỰC** từ **workflow/approval engine**.
```
**Dòng task** (`MT2_PHASE_TASK_LIST.md:88`):
> *«MT2-P4-03 · **Card “Chờ Giám đốc duyệt”** lấy dữ liệu **thực** từ approval engine (§4.1) · **API + test**»*

## 2. AUDIT (bằng chứng — ⛔ không suy đoán)
| Điều | Bằng chứng | Kết luận |
|---|---|---|
| Card «Chờ Giám đốc duyệt» có trong UI? | grep `app/**/*.tsx` (pattern «Chờ Giám đốc» / `cho_giam_doc` / `pendingDirector`) | ⛔ **0 KẾT QUẢ** ⇒ **CARD ⛔ CHƯA TỒN TẠI** ✗ |
| Backend có nền gì? | `SystemController`: `decide_approval`(**1067**) · `approve_po`(**1087**) · `save_approval_stage`(979) · `set_approval_stage_status`(984) · `delete_approval_stage`(989) · nhiều `approve_*` (599/634/649/704/1009) | nền **đã có** ✔ (⛔ không tạo engine mới ✗) |
| «Giám đốc» là ai? | **Kết luận MT2-P4-04**: `role_catalog` có `director` (+ `thuky`→`base_role=director`) · `system_level_catalog` có `giam_doc` = `level_rank` **40** | xác định được ✔ |
| Nguồn dữ liệu duyệt THẬT | **Memory dự án**: cấu hình duyệt ĐANG CHẠY = `approval_stage_catalog` + `approval_project_assignments`; ⚠️ `workflow_step_approvers` chỉ là **ảnh chụp cũ** | dùng **nguồn thật** ✔ |
| Dữ liệu phiếu | `Bootstrap:159` `out.put("approvals", groupBy(approvalRows,"requestId",rid))` ⇒ **theo từng request** | ⚠️ card phải lấy từ **API riêng** (⛔ không nhét vào bootstrap ✗ — ⛔ tránh phình payload ✗) |

## 3. KẾT LUẬN AUDIT
```text
P4-03 = **THÊM MỚI** một card «Chờ Giám đốc duyệt» + **API trả dữ liệu THỰC** ✗ (⛔ hiện chưa có ✗)
· Yêu cầu ghi rõ **«API + test»** ⇒ ưu tiên làm **API trước** (backend là tầng thực thi — GOAL §17) ✔
· ⛔ **KHÔNG** tạo engine duyệt mới ✗ — **tái dùng** `decide_approval`/`approve_po` + `approval_stage_catalog`
  + `approval_project_assignments` ✔ (§15 REUSE)
· ⛔ **KHÔNG** đổi luồng duyệt hiện có ✗ (GOAL §20 WORKFLOW SAFETY) — chỉ **ĐỌC** để đếm/liệt kê ✔
```

## 4. CÒN PHẢI AUDIT TRƯỚC KHI CODE (§2)
1. **Đọc đủ `§4.1:51`** (dòng bị cắt) ⇒ xác định **chính xác** điều kiện quyền của card ✔
2. **Cấu trúc `approval_stage_catalog` + `approval_project_assignments`**: bước nào có người duyệt là **GIÁM ĐỐC** ✗
   (⛔ đo trước, ⛔ không đoán tên cột ✗)
3. Có sẵn **action/API** nào trả «phiếu đang chờ **tôi** duyệt» chưa ✗ (⛔ nếu có ⇒ **tái dùng + lọc cấp** ✔)
4. `approvals` có cột nào cho biết **bước hiện tại** + **người duyệt hiện tại** ✗

## 5. RỦI RO / RÀNG BUỘC
- ⛔ **KHÔNG** bịa định nghĩa «Giám đốc» ✗ — dùng dữ liệu đã đo (`director` / `giam_doc` rank 40) ✔
- ⛔ **KHÔNG** đụng luồng duyệt đang chạy ✗ (§20) — chỉ thêm **đường đọc** ✔
- ⚠️ Theo **bài học P4-02**: test phân quyền ⇒ ① dùng **USER THƯỜNG** ✔ ② seed danh mục H2 ✔
  ③ chọn khoá **đặt vô điều kiện** khi assert ✔ ④ ⛔ không nới luật để test xanh ✗

## 6. VIỆC KẾ TIẾP
Audit mục 4 (① đọc đủ §4.1:51 ② đo 2 bảng phân công duyệt ③ rà action sẵn có ④ cột bước/người duyệt của `approvals`)
⇒ đủ dữ kiện ⇒ lập kế hoạch 4 bước (port đọc → use-case → RBAC+API → test user THƯỜNG).

---

## 7. NHẬT KÝ THI HÀNH

### 22/09/2026 — ✅ AUDIT ĐỦ DỮ KIỆN (① ② ④ xong) ⇒ **CÓ THỂ CODE**
**① §4.1:51 — NGUYÊN VĂN ĐẦY ĐỦ** (đọc hết dòng bị cắt ✗):
```text
«⛔ **Không** hiển thị card “phiếu đang chờ duyệt” cho user **không có quyền quản trị hệ thống**
  hoặc **không có chức vụ tương đương/cao hơn Trưởng phòng**. Kiểm permission/RBAC **ở backend**.»
⇒ ⇒ Điều kiện CHÍNH XÁC = **`isAdmin` OR `system_level_catalog.level_rank >= 30`** ✔
   ⇒ ⇒ **ĐÚNG BẰNG điều kiện của MT2-P4-02** ⇒ **TÁI DÙNG** khối kiểm cấp bậc đã viết ✔ (⛔ không viết lại ✗)
```

**② CẤU TRÚC 2 BẢNG DUYỆT** (đo `information_schema`, ⛔ không đoán ✗):
```text
`approval_stage_catalog` : id · **stage_no** · name · description · **allowed_role_codes** · **sla_hours**
                           · auto_approve_on_submit · active · sort_order · **approval_mode** · **stage_kind** · created_at · updated_at
`approval_project_assignments` : id · project_id · **stage** · **owner_user_id** · cc_emails · active · updated_by · created_at · updated_at
```

**④ `approvals` — ĐỦ CỘT ĐỂ TRUY VẤN** ✔:
```text
id · **entity_type** · **entity_id** · **request_id** · **stage** · **department** · **approver_user_id**
· **status** · due_at · decided_at · comment · decision_snapshot · queued_at · notified_at · reminder_sent_at
· **allowed_role_codes_snapshot** · **approval_mode_snapshot** · overdue_reason · created_at · updated_at
```
⇒ ⇒ **CÔNG THỨC TRUY VẤN «CHỜ GIÁM ĐỐC DUYỆT»** (⛔ chỉ ĐỌC · ⛔ 0 migration · ⛔ 0 bảng mới):
```text
Phiếu ĐANG CHỜ ở bước mà người duyệt là **GIÁM ĐỐC**:
  · `approvals.status` = trạng thái CHỜ (⚠️ đo tập giá trị THẬT trước khi viết ✗)
  · JOIN `approval_stage_catalog` theo `approvals.stage` (hoặc `stage_no`)
    ⇒ bước có **`allowed_role_codes` chứa `director`** ✔
  · ⚠️ ưu tiên `allowed_role_codes_snapshot` của chính `approvals` nếu đã có (ảnh chụp tại thời điểm tạo ✔)
```
**③ Action sẵn có**: `decide_approval`(:1067) · `approve_po`(:1087) · approval-stage CRUD ⇒ ⛔ **KHÔNG** tạo engine mới ✗;
card cần một **API ĐỌC tổng hợp MỚI** (đếm + liệt kê) ✔ — ⛔ không nhét vào bootstrap ✗.

- **KẾ HOẠCH 4 BƯỚC** (⛔ 0 migration · ⛔ 0 bảng mới · ⛔ không đụng luồng duyệt §20):
  ```text
  ① ĐO tập giá trị THẬT của `approvals.status` + đếm phiếu chờ ở bước `director` (xác nhận có dữ liệu ✗)
  ② Port + adapter: hàm ĐỌC MỚI (thuần thêm) `approvalsWaitingAtDirector(...)` — SQL chỉ SELECT ✔
  ③ Use-case + RBAC + `case` mới (vd `director_pending_approvals`) với **điều kiện cấp bậc TÁI DÙNG của P4-02** ✔
  ④ Test H2 bằng **USER THƯỜNG** (bài học #2): đủ cấp ⇒ thấy số/DS · thiếu cấp ⇒ **403 hoặc rỗng** ✔
     ⚠️ + seed `system_level_catalog` (bài học P4-02) + chọn khoá assert **vô điều kiện** ✔
  ```
- **Trạng thái**: **P4-03 = IN_PROGRESS** · audit ①②④ **XONG** ✔ · ③ xác định **cần API ĐỌC mới** ✔ ⇒ **sẵn sàng code** ✔.

### 22/09/2026 — ✅ BƯỚC ① XONG: ĐO DỮ LIỆU THẬT ⇒ **PHÁT HIỆN 1 CÁI BẪY LỚN**
**(1) `approvals.status` — CHỈ 2 GIÁ TRỊ THẬT** (⛔ không đoán ✗):
```text
approved = **132**  ·  pending = **127**
⚠️ ⛔ KHÔNG có `rejected`/`cancelled` trong dữ liệu thật ✗
⇒ code PHẢI chịu được các giá trị khác nếu xuất hiện trong tương lai ✔ (⛔ đừng hard-code «chỉ 2 giá trị» ✗)
⇒ ĐIỀU KIỆN «ĐANG CHỜ» = **`status = 'pending'`** ✔
```
**(2) `approval_stage_catalog` — 8 bước** ✔:
```text
stage 1  CHT xác nhận nhu cầu   `commander,cht`                active=**0** ⚠️ (khớp memory: bắt đầu ở bước 2)
stage 2  Thư ký Tổng giám đốc   `thuky,thu_ky_tgd`             active=1
stage 3  Phòng Dự án            `project,da_nv`                active=1
stage 4  Phòng Kế hoạch         `procurement,kh_nv`            active=1
stage 5  **Giám đốc**           **`director,tgd,giam_doc`**    active=1   ← BƯỚC CỦA CARD ✔
stage 101 Lập & phát hành PO    `procurement,kh_nv,kh_truong`  active=1  (stage_kind = supply)
stage 102 Giao nhận             `warehouse,thu_kho`            active=1  (supply)
stage 103 BCH xác nhận giao     `commander,cht`                active=1  (supply)
```
**(3) ĐẾM THẬT phiếu `pending` theo snapshot trên `approvals`** ✔:
```text
stage 3  `project,da_nv`              = **31**
stage 4  `procurement,kh_nv`          = **29**
stage 5  **`director,tgd,giam_doc`**  = **24**   ← ĐÚNG nhóm «Chờ GIÁM ĐỐC duyệt» ✔
stage 2  `thuky,thu_ky_tgd`           = 22
stage 2  `thuky`                      =  7
stage 1  `commander,cht`              =  7
stage 5  ⚠️ **`da_truong,kh_truong`**  =  7   ← ⛔ **KHÔNG có `director`** ✗
```
🔴 **BẪY LỚN — GHI RÕ ĐỂ ⛔ KHÔNG MẮC**:
```text
**stage 5 có HAI snapshot khác nhau**: `director,tgd,giam_doc` (24)  VÀ  `da_truong,kh_truong` (7) ✗
⇒ ⇒ LỌC THEO `stage_no = 5` LÀ **SAI** ✗ (sẽ gộp cả 7 phiếu ⛔ không thuộc Giám đốc ✗)
⇒ ⇒ ⇒ PHẢI LỌC THEO **snapshot `allowed_role_codes_snapshot` CÓ CHỨA `director`** ✔ (hoặc `tgd` / `giam_doc` ✔)
   ⇒ dùng **snapshot NGAY TRÊN `approvals`** ✔ (ảnh chụp tại thời điểm tạo — đúng lịch sử ✔)
```
✅ **CÓ DỮ LIỆU THẬT ĐỂ TEST 2 CHIỀU** ✔: **24 phiếu CÓ director** ✔ **VÀ 7 phiếu ⛔ KHÔNG có** ⇒ **phân biệt được** ✔

**⇒ SQL CHỐT** (⛔ chỉ SELECT · ⛔ 0 migration · ⛔ 0 bảng mới):
```sql
SELECT COUNT(*) AS total FROM approvals
WHERE status = 'pending'
  AND (allowed_role_codes_snapshot LIKE '%director%' OR allowed_role_codes_snapshot LIKE '%tgd%'
       OR allowed_role_codes_snapshot LIKE '%giam_doc%');
-- ⚠️ `LIKE '%director%'` có thể khớp nhầm chuỗi con ⇒ ⛔ phải KIỂM: tách theo dấu phẩy rồi so CHÍNH XÁC ✔
```
- **Next Task**: ② port đọc mới (thuần thêm, SQL trên + tách mã CHÍNH XÁC ⛔ không LIKE mù ✗) ⇒ ③ use-case+RBAC+case ⇒ ④ test.

### 22/09/2026 — BƯỚC ② : AUDIT XONG ⇒ **CHỐT ĐÚNG CHỖ ĐỂ TÁI DÙNG (⛔ 0 port mới ✗)**
**Bằng chứng (đọc mã, ⛔ không đoán ✗)**:
```text
· ⛔ **KHÔNG có port/adapter `Approval*`** ✗ (đã kiểm `port/out` + `infrastructure/persistence` ⇒ 0 kết quả)
· ✅ `RequestManagementUseCase` **:616 `decideApproval(Principal, payload)`** — đây là **use-case DUYỆT CHÍNH** ✔
     :651 ghi rõ «Hạn của bước = `approvals.due_at`, đặt tại :392 = now + `approval_stage_catalog.sla_hours`*3600» ✔
· ✅ **`OpsTaskStore` (port) `:92` ĐÃ CÓ**: «Lịch sử duyệt của một số bước — JS `:2161`
     (`SELECT COUNT(*) FROM approvals WHERE stage=?`)» ✔
     ⇒ adapter **`OpsTaskStoreAdapter`** ✔ đã có CRUD `approval_stage_catalog` (:326/:335/:351/:363/:369/:375 ✔)
· ⚠️ `OpsTaskStore:79` ghi rõ **`approval_stage_catalog` ⛔ KHÔNG có cột `code`** ✗ (bài học TASK-041 — ⛔ đã tránh ✔)
```
🔧 **CHỐT CÁCH LÀM (⛔ tái dùng, ⛔ 0 cơ chế mới — §15)**:
```text
① **PORT = `OpsTaskStore`** ✔ (đã có hàm đếm `approvals` ⇒ thêm **hàm MỚI thuần thêm** ở đây)
   ⛔ **KHÔNG** tạo `ApprovalStore` mới ✗ (sẽ là port trùng ⇒ vi phạm §15)
② **ADAPTER = `OpsTaskStoreAdapter`** ✔ — thêm cài đặt hàm mới, SQL **chỉ SELECT** ✔
③ **USE-CASE = `RequestManagementUseCase`** ✔ (đã có `decideApproval` :616) — thêm hàm ĐỌC thuần thêm ✔
④ ⛔ KHÔNG đụng `decideApproval` / luồng duyệt hiện có ✗ (GOAL §20 WORKFLOW SAFETY ✔)
```
- **⚠️ LƯU Ý KHI VIẾT SQL (từ bước ①)**: lọc theo **`allowed_role_codes_snapshot`** (⛔ **KHÔNG** `stage_no=5` ✗ vì
  stage 5 có **2 snapshot** ✗), và **tách mã theo dấu phẩy rồi so CHÍNH XÁC** (⛔ **KHÔNG** `LIKE '%director%'` mù ✗)
  ⇒ cách an toàn: SELECT các dòng `status='pending'` có snapshot **KHÁC NULL**, rồi **lọc mã trong Java** ✔
- **Trạng thái**: **P4-03 = IN_PROGRESS** · bước ① ② (audit) **XONG** ✔ · **sẵn sàng viết mã** ✔.

### 22/09/2026 — BƯỚC ③: PHÁT HIỆN **2 HÀM SẴN CÓ ĐỀU LÀ CÁI BẪY** ⇒ PHẢI THÊM HÀM MỚI
**Đọc `OpsTaskStore:78-103`** — 2 hàm đếm ĐÃ CÓ:
```text
:92-93  `long countApprovalsByStageNo(int stageNo)`        — JS `:2161` (`SELECT COUNT(*) FROM approvals WHERE stage=?`)
:98-99  `long countPendingApprovalsForStageNo(int stageNo)` — JS `:2187` (join `material_requests`)
```
🔴 **⛔ KHÔNG ĐƯỢC DÙNG LẠI 2 HÀM NÀY CHO P4-03** — lý do (⛔ không mò, đã ĐO ở bước ①):
```text
Cả 2 hàm đếm theo **`stage_no`** ✗  NHƯNG **stage 5 có HAI snapshot khác nhau** ✗:
   `director,tgd,giam_doc` = **24** (ĐÚNG nhóm Giám đốc)  vs  `da_truong,kh_truong` = **7** (⛔ KHÔNG có director)
⇒ dùng `stage_no = 5` sẽ **gộp nhầm 7 phiếu** ⛔ không thuộc Giám đốc vào card ✗  ⇒ **SAI nghiệp vụ** ✗
```
✅ **QUYẾT ĐỊNH (⛔ thuần thêm, ⛔ không sửa 2 hàm cũ ✗)**:
```text
① `OpsTaskStore` — thêm hàm MỚI: `List<Map<String,Object>> pendingApprovalsForRoleCodes(List<String> roleCodes)`
   · SQL: `SELECT stage, department, entity_type, entity_id, request_id, due_at, allowed_role_codes_snapshot
            FROM approvals WHERE status='pending'`  (⛔ KHÔNG LIKE mù ✗, ⛔ KHÔNG lọc stage_no ✗)
   · ⚠️ LỌC MÃ Ở JAVA: tách `allowed_role_codes_snapshot` theo dấu phẩy, `trim()`, rồi so **CHÍNH XÁC**
     với `roleCodes` (vd `director`,`tgd`,`giam_doc`) ✔ — ⛔ không dùng `contains` trên cả chuỗi ✗
② `OpsTaskStoreAdapter` — cài đặt hàm mới (chỉ SELECT + lọc trong Java ✔)
③ `RequestManagementUseCase` — hàm ĐỌC thuần thêm (⛔ không đụng `decideApproval` :616 ✗)
④ RBAC: `case` mới (vd `director_pending_approvals`) + **điều kiện cấp bậc TÁI DÙNG của P4-02** ✔
   (`isAdmin` OR `level_rank >= 30`) — ⛔ 0 module mới nếu được ✗
```
- 🎓 **BÀI HỌC**: ⛔ **KHÔNG** tái dùng hàm cũ chỉ vì “cùng chủ đề” ✗ — phải kiểm **NGỮ NGHĨA** của nó
  (`countPendingApprovalsForStageNo` đếm theo **BƯỚC**, còn P4-03 cần đếm theo **MÃ QUYỀN trong snapshot**) ✔
- **Next Task**: viết ①②③④ rồi **test H2 user THƯỜNG** (⚠️ seed `system_level_catalog` ✗) ⇒ **P4-03 DONE**.

### 22/09/2026 — BƯỚC ③①② XONG (port + adapter · compile 4/4 SUCCESS)
- **Files Changed**:
  - `application/.../port/out/OpsTaskStore.java` — **+hàm MỚI thuần thêm**
    `List<Map<String,Object>> pendingApprovalsForRoleCodes(List<String> roleCodes)` (neo `:98-99`, ⛔ không đổi hàm cũ ✔)
  - `infrastructure/.../persistence/OpsTaskStoreAdapter.java` — **+cài đặt** (chèn trước `private static String sv(...)` cuối lớp ✔)
- **Chi tiết cài đặt (⛔ đúng 2 ràng buộc đã rút ra)**:
  ```java
  List<Map<String,Object>> rows = jdbcTemplate.queryForList("""
          SELECT id,stage,department,entity_type AS "entityType",entity_id AS "entityId",
                 request_id AS "requestId",due_at AS "dueAt",approver_user_id AS "approverUserId",
                 allowed_role_codes_snapshot AS "allowedRoleCodesSnapshot"
          FROM approvals WHERE status='pending' ORDER BY due_at,id""");
  // ⚠️ LỌC MÃ Ở **JAVA** — tách theo dấu phẩy + trim() + so CHÍNH XÁC
  for (Map<String,Object> row : rows) {
      Object raw = row.get("allowedRoleCodesSnapshot");
      if (raw == null) continue;                        // ⛔ thiếu snapshot ⇒ KHÔNG suy diễn là đủ
      for (String part : String.valueOf(raw).split(",")) {
          if (wanted.contains(part.trim())) { out.add(row); break; }
      }
  }
  ```
  ✔ alias **TRÍCH DẪN** (`AS "entityType"`) để giữ chữ hoa ở cả MySQL và H2 ✔
  ⛔ **KHÔNG** `LIKE '%director%'` ✗ · ⛔ **KHÔNG** lọc `stage_no` ✗ · ⛔ **0 migration** ✔
- **Tests**: `mvn -B -pl infrastructure -am compile` ⇒ Clean Architecture · Domain · Application ·
  **Infrastructure** đều **SUCCESS** · **EXIT = 0** ✔ (⚠️ port & adapter sửa **CÙNG lượt** ⇒ cây mã ⛔ không vỡ ✔)
- **CÒN LẠI (để DONE)**: ③ use-case (`RequestManagementUseCase` hàm ĐỌC thuần thêm, ⛔ không đụng `decideApproval` :616 ✗)
  + RBAC + `case` (điều kiện cấp bậc **TÁI DÙNG của P4-02**) ④ **test H2 bằng USER THƯỜNG** ✔
- **Trạng thái**: **P4-03 = IN_PROGRESS** · bước ③①② **XONG** ✔ · còn ③-còn-lại + ④ ✗.

### 22/09/2026 — BƯỚC ③③: **CHỐT ĐÚNG USE-CASE (⛔ KHÔNG đổi constructor ✗)**
**Đo (⛔ không đoán ✗)**:
```text
✅ **`OpsTaskManagementUseCase`** — ĐÃ CÓ SẴN:
     :4   `import com.vntech.erp.application.port.out.OpsTaskStore;`
     :27  `private final OpsTaskStore store;`
     :32  `public OpsTaskManagementUseCase(OpsTaskStore store, IdGenerator idGenerator,
                                            RbacService rbac, AccessScopeService accessScope)`
   ⇒ ⇒ ⇒ **THÊM hàm ĐỌC vào `OpsTaskManagementUseCase`** ✔ — ⛔ **KHÔNG đổi constructor** ✗
      (đúng bài học **tránh bẫy “tham số VỊ TRÍ”** — bài học P3-04/P3-05 ✔)
🔴 **⛔ KHÔNG vào `RequestManagementUseCase`** ✗ — dù nó chứa `decideApproval` :616 ✗:
     lớp đó ⛔ **KHÔNG có `OpsTaskStore`** ✗ ⇒ phải **sửa constructor** ⇒ **bẫy tham số vị trí** ✗
     (bài học: khi hàm cũ dùng **tham số vị trí** ⇒ **KHÔNG thêm tham số** — thêm **hàm mới** ở nơi khác ✔)
⚠️ `SystemController` đã inject `adminOpsManagementUseCase` (:64 · :101 · :124) ✔
   ⇒ **việc vòng sau**: kiểm `OpsTaskManagementUseCase` đã được inject vào controller chưa ✗
      · NẾU **đã có** ⇒ thêm `case` trực tiếp ✔
      · NẾU **chưa** ⇒ thêm **1 tham số constructor CỦA CONTROLLER** ✗ (⚠️ controller dùng Spring DI theo kiểu ⇒
        cần xem cách inject hiện có rồi làm theo ⛔ không đoán ✗)
```
- **KẾ HOẠCH CHỐT (vòng sau)**:
  ```text
  ③-còn-lại: ① hàm ĐỌC trong `OpsTaskManagementUseCase` (dùng `store.pendingApprovalsForRoleCodes(...)` ✔
                với `roleCodes = List.of("director","tgd","giam_doc")` — ĐO từ `approval_stage_catalog` bước 5 ✔)
             ② RBAC: `case` mới (vd `director_pending_approvals`) + điều kiện cấp bậc **TÁI DÙNG của P4-02**
                (`isAdmin` OR `level_rank >= 30`) ✔ — ⛔ 0 module mới nếu được ✗
  ④ test H2 bằng **USER THƯỜNG** (⚠️ **seed `system_level_catalog`** ✗ · chọn khoá assert **VÔ ĐIỀU KIỆN** ✗)
  ```
- **Trạng thái**: **P4-03 = IN_PROGRESS** ⛔ chưa DONE ✗ · port+adapter **XONG & compile sạch** ✔ ·
  use-case **đã chốt đúng nhà** ✔ · còn **viết use-case + RBAC + case + test** ✗.

### 22/09/2026 — BƯỚC ③①: PHÁT HIỆN **ĐIỀU KIỆN CẤP BẬC CHƯA ĐƯỢC ĐÓNG GÓI DÙNG CHUNG** ⇒ THÊM 1 HÀM PORT
**Đọc `OpsTaskManagementUseCase:24-43`**:
```text
:27  `private final OpsTaskStore store;` ✔   :29 `private final RbacService rbac;` ✔
:40  `private AuthUseCase.CurrentUser principalAsCurrent(Principal p)` ✔ (đã có sẵn ⇒ dùng được `rbac` ✔)
```
🔴 **VẤN ĐỀ (⛔ không tự cài lại logic ✗)**: điều kiện cấp bậc cần **ĐỌC `level_rank`** ✗
```text
`RbacService` ⛔ **KHÔNG có** hàm cấp bậc ✗ (chỉ có `isAdmin`, `isCompanyLeadership`, `requireActionModule`, `requireRole`)
MT2-P4-02 đã cài điều kiện «admin OR level_rank>=30» **INLINE trong `BootstrapDataAdapter`** ✗ (tầng **infrastructure**)
⇒ ⛔ **KHÔNG** gọi được từ tầng **application** ✗ ⇒ nếu P4-03 tự viết lại SQL ⇒ **TRÙNG LOGIC** ✗ (vi phạm §15 ✗)
```
✅ **CÁCH ĐÚNG (§15 — tái dùng, ⛔ 0 port mới ✗)**:
```text
① Thêm **hàm MỚI thuần thêm** vào **`OpsTaskStore`** (port đang mở rộng):
     `Integer userLevelRank(String userId)`   — 1 câu `SELECT`:
     `SELECT l.level_rank FROM users u LEFT JOIN system_level_catalog l ON l.code=u.system_level_code WHERE u.id=?`
     ⇒ 0 dòng / NULL ⇒ trả **null** (⛔ KHÔNG suy diễn thành đủ ✗)
   + cài đặt trong **`OpsTaskStoreAdapter`** (sửa **CÙNG LƯỢT** port ⇒ ⛔ cây mã không vỡ ✗ — bài học P3-05 ✔)
② Hàm ĐỌC của P4-03 trong `OpsTaskManagementUseCase`:
     `rbac.isAdmin(cu) || (store.userLevelRank(cu.id()) != null && store.userLevelRank(...) >= 30)`
     ⇒ ⛔ KHÔNG đủ ⇒ **ném 403** (đúng §4.1:51 «Kiểm permission/RBAC ở backend») ✔
③ RBAC + `case` (vd `director_pending_approvals`) — ⛔ 0 module mới nếu được ✗
④ ⛔ **KHÔNG** đụng `BootstrapDataAdapter` ✗ (giữ nguyên P4-02 ✔)
```
- 🎓 **BÀI HỌC MỚI**: khi một điều kiện quyền được cài **inline trong 1 tầng** ✗ thì **tầng khác ⛔ không dùng lại được** ✗
  ⇒ khi cần dùng lại ⇒ **trích thành hàm PORT dùng chung** ✔ (⛔ không copy-paste SQL sang tầng khác ✗)
- **Next Task**: ① `userLevelRank` (port+adapter CÙNG lượt) ② hàm ĐỌC use-case + 403 ③ RBAC + `case` ④ test user THƯỜNG.

### 22/09/2026 — BƯỚC ③① XONG: `userLevelRank` (port + adapter · compile 4/4 SUCCESS)
- **Files Changed**:
  - `application/.../port/out/OpsTaskStore.java` — **+hàm MỚI thuần thêm** `Integer userLevelRank(String userId)` ✔
  - `infrastructure/.../persistence/OpsTaskStoreAdapter.java` — **+cài đặt** (⛔ cùng lượt ⇒ cây mã ⛔ không vỡ ✔)
- **Cài đặt**:
  ```java
  SELECT l.level_rank AS "levelRank" FROM users u
    LEFT JOIN system_level_catalog l ON l.code=u.system_level_code WHERE u.id=?
  -- 0 dòng / NULL ⇒ trả **null** (⚠️ coi như KHÔNG đủ — ⛔ không suy diễn thành đủ ✗)
  ```
- 🎓 **ĐÃ GIẢI QUYẾT VẤN ĐỀ TRÙNG LOGIC**: điều kiện cấp bậc **đã trở thành HÀM PORT DÙNG CHUNG** ✔
  ⇒ ⛔ hết cảnh copy SQL rải rác ✗ · ⛔ **KHÔNG** sửa `BootstrapDataAdapter` ✗ (P4-02 giữ nguyên trạng ✔)
- **Tests**: `mvn -B -pl infrastructure -am compile` ⇒ Clean Architecture · Domain · Application ·
  **Infrastructure** đều **SUCCESS** · **EXIT = 0** ✔
- **CÒN LẠI (để DONE)**: ② hàm ĐỌC trong `OpsTaskManagementUseCase`:
  `rbac.isAdmin(cu) || (store.userLevelRank(cu.id()) != null && … >= 30)` ⇒ ⛔ không đủ ⇒ **NÉM 403** ✔
  ③ RBAC (`ActionRbacRegistry` 2 khoá × 2 map → module nào ✗ cần **AUDIT trước** ⛔ không đoán ✗) + `case`
  ④ **test H2 bằng USER THƯỜNG** (⚠️ **seed `system_level_catalog`** ✗ · chọn khoá assert **VÔ ĐIỀU KIỆN** ✗)
- **Trạng thái**: **P4-03 = IN_PROGRESS** · port/adapter (`pendingApprovalsForRoleCodes` + `userLevelRank`) **XONG & compile sạch** ✔.

### 22/09/2026 — BƯỚC ③② XONG: hàm ĐỌC + **403 backend** (compile 3/3 SUCCESS)
- **Files Changed**: `application/.../service/OpsTaskManagementUseCase.java` — **+hàm MỚI thuần thêm**
  `directorPendingApprovals(Principal)` + 2 hằng số **ĐO từ CSDL** ✔
- **Nội dung**:
  ```java
  public static final List<String> DIRECTOR_ROLE_CODES = List.of("director", "tgd", "giam_doc"); // approval_stage_catalog bước 5
  public static final int DIRECTOR_MIN_RANK = 30;                                                  // truong_phong

  public Map<String,Object> directorPendingApprovals(Principal principal) {
      AuthUseCase.CurrentUser cu = principalAsCurrent(principal);
      Integer rank = store.userLevelRank(cu.id());
      boolean duQuyen = rbac.isAdmin(cu) || (rank != null && rank >= DIRECTOR_MIN_RANK);
      if (!duQuyen) throw new AuthUseCase.ApiError("Tài khoản chưa đủ quyền xem vùng phê duyệt …", 403);
      List<Map<String,Object>> rows = store.pendingApprovalsForRoleCodes(DIRECTOR_ROLE_CODES);
      return Map.of("approvals", rows, "total", rows.size());
  }
  ```
  ✔ đúng **§4.1:51** «Kiểm permission/RBAC **ở backend**» (⛔ không chỉ ẩn ở UI ✗)
  ✔ lọc theo **`allowed_role_codes_snapshot`** (⛔ **KHÔNG** `stage_no` ✗ — bước 5 có **2 snapshot** ✗)
  ✔ **⛔ CHỈ ĐỌC** — ⛔ không đụng `decideApproval` ✗ (GOAL §20 WORKFLOW SAFETY ✔)
  ✔ hằng số **ĐO, ⛔ không bịa** (`director,tgd,giam_doc` từ `approval_stage_catalog` bước 5 · rank 30 ✔)
- **Tests**: `mvn -B -pl application -am compile` ⇒ Clean Architecture · Domain · **Application** = **SUCCESS** · **EXIT = 0** ✔
- **CÒN LẠI (để DONE)**:
  ③ **AUDIT `ActionRbacRegistry` TRƯỚC** (⛔ không đoán khoá ✗) rồi thêm **2 khoá × 2 map** cho
     `director_pending_approvals` (module nào ✗ — **đo**; capability nào ✗ — **đo**) + `case` trong `SystemController`
     (⚠️ kiểm `OpsTaskManagementUseCase` đã được inject chưa ✗)
  ④ **test H2 bằng USER THƯỜNG** (⚠️ **seed `system_level_catalog`** ✗ · assert cả **403 khi thiếu cấp** ✔)

### 22/09/2026 — BƯỚC ③③: AUDIT RBAC XONG (⛔ 0 module mới · ⛔ KHÔNG đổi constructor controller)
**Bằng chứng (⛔ không đoán ✗)**:
```text
(1) ✅ `SystemController` **ĐÃ inject** `OpsTaskManagementUseCase`:
      :12 import · :60 `private final OpsTaskManagementUseCase opsTaskManagementUseCase;`
      :97 tham số constructor · :120 gán · đang dùng :936/:941
   ⇒ ⇒ **⛔ KHÔNG cần đổi constructor controller** ✗ ✔ (dùng lại `opsTaskManagementUseCase` sẵn có)
(2) ✅ Module **`approvals`** ĐÃ có trong `ActionRbacRegistry`:
      :36 `approve_stock_issue` → `List.of("approvals")`   ·   :86 `decide_approval` → `List.of("approvals")`
   ⇒ ⇒ **MODULE ĐÚNG = `approvals`** ✔ (⛔ **0 module mới** ✗)
(3) ✅ `decide_approval` capability = **`canApprove`** (:314)
   ⚠️ `save_approval_stage` (:157) + `set_approval_stage_status` (:219) khai **`List.of()`** ✗
      ⇒ ⇒ đó là **MẶC ĐỊNH TỪ CHỐI 403** ✗ — nhưng **đã chặn bằng `requireAdmin` trong thân `case`** ✔
         (đã kiểm ở **MT2-P4-05** ✔) ⇒ ⛔ **KHÔNG** tự sửa ✗ (ngoài phạm vi P4-03 — ⛔ không mở rộng scope ✗)
```
✅ **CHỐT**:
```text
`Map.entry("director_pending_approvals", List.of("approvals"))`  +  capability **"canView"**
   · đây là hành động **ĐỌC** ⇒ ⛔ **KHÔNG** dùng `canApprove` ✗
   · ⚠️ điều kiện «**admin HOẶC ≥ trưởng phòng**» (§4.1:51) do **USE-CASE** chặn (403) ✔
   ⇒ ⇒ ⇒ **2 LỚP đúng ý đồ**: ① RBAC chặn theo **MODULE** (`approvals`) ✔ ② use-case chặn theo **CẤP BẬC** ✔
      (user có `canView` module duyệt nhưng **cấp thấp** ⇒ qua RBAC rồi bị **403** ở use-case ✔)
```
- **Next Task**: ③ thêm **2 khoá × 2 map** (`ActionRbacRegistry`) + `case` `director_pending_approvals` trong
  `SystemController` (dùng `opsTaskManagementUseCase` sẵn có ✔) ⇒ ④ **test H2 bằng USER THƯỜNG**
  (⚠️ seed `system_level_catalog` ✗ · assert **403 khi thiếu cấp** ✔) ⇒ **P4-03 DONE**.

### 22/09/2026 — BƯỚC ③③: ĐÃ THÊM **2 KHOÁ RBAC** (compile Application SUCCESS)
- **Files Changed**: `application/.../rbac/ActionRbacRegistry.java` — thêm **2 khoá × 2 map** ✔
  ```java
  // map MODULE (map 1):
  Map.entry("director_pending_approvals", List.of("approvals")),
  // map CAPABILITY (map 2):
  Map.entry("director_pending_approvals", "canView"),
  ```
  ✔ module **`approvals`** (**ĐO** — `decide_approval` :86 · `approve_stock_issue` :36 ✔) ⇒ **⛔ 0 module mới** ✗
  ✔ capability **`canView`** (hành động **ĐỌC** — ⛔ không `canApprove` ✗)
  ⚠️ §4.1:51 «admin HOẶC ≥ trưởng phòng» vẫn do **use-case** chặn **403** ⇒ **2 LỚP** ✔
- **Tests**: `mvn -B -pl application -am compile` ⇒ Clean Architecture · Domain · **Application** = **SUCCESS** · **EXIT = 0** ✔
- **CÒN LẠI (để DONE)**:
  ③-`case` `director_pending_approvals` trong `SystemController` — ⚠️ **đang tìm neo** (lệnh dò bị lỗi **đường dẫn LẶP**
     `java-backend/java-backend` ✗ — **lỗi lệnh, ⛔ KHÔNG phải lỗi mã** ✔ ne o sẽ lấy ở vòng sau ✔)
     ⇒ dùng `opsTaskManagementUseCase.directorPendingApprovals(asOpsTaskPrincipal(cu))` ✔
     (✅ đã đo: controller **ĐÃ inject** `opsTaskManagementUseCase` :60/:97/:120 ✔ ⇒ ⛔ không đổi constructor ✗)
  ④ **test H2 bằng USER THƯỜNG** (⚠️ **seed `system_level_catalog`** ✗ · assert **403 khi thiếu cấp** ✔)

### 22/09/2026 — BƯỚC ③③-case XONG: `case` CONTROLLER (compile **5/5 SUCCESS** toàn bộ stack)
- **Files Changed**: `java-backend/web/.../controller/SystemController.java` — **+`case` MỚI** ✔
  ```java
  case "director_pending_approvals" -> {
      AuthUseCase.CurrentUser cu = requireCurrentUser(request);
      return ResponseEntity.ok(jsonResult(
              opsTaskManagementUseCase.directorPendingApprovals(asOpsTaskPrincipal(cu))));
  }
  ```
  ✔ **neo = `case "supplier_material_gaps" -> {`** (**:1299**, **ASCII** và **DUY NHẤT** ⇒ chèn TRƯỚC nó ✔)
     🎓 **đã né lỗi vòng trước**: ⛔ không dùng `read`/neo chứa **tiếng Việt** ✗ khiến phải đoán text ✗
     ⇒ **chọn neo ASCII duy nhất** ✔ (⛔ vẫn ⛔ không đoán ✗)
  ✔ dùng `opsTaskManagementUseCase` **sẵn có** (đã đo :60/:97/:120) ⇒ ⛔ **KHÔNG** đổi constructor ✗ ✔
  ✔ `# MT2-P4-03` ghi rõ **2 LỚP** (RBAC module `approvals`/`canView` + use-case chặn 403 theo **cấp bậc**) ✔
- **Tests**: `mvn -B -pl web -am compile` ⇒ **5/5 SUCCESS** (Clean Architecture · Domain · Application ·
  Infrastructure · **Web**) · **EXIT = 0** ✔
- ✅ **ĐÃ XONG TOÀN BỘ PHẦN MÃ của P4-03**:
  ```text
  ① port `OpsTaskStore`      + `pendingApprovalsForRoleCodes` (lọc MÃ Ở JAVA — ⛔ 0 LIKE mù ✗, ⛔ 0 stage_no ✗)
                             + `userLevelRank` (hàm PORT DÙNG CHUNG ⇒ ⛔ hết trùng logic ✗)
  ② adapter `OpsTaskStoreAdapter` cài đặt cả 2 (sửa CÙNG LƯỢT ⇒ ⛔ cây mã không vỡ ✗)
  ③ use-case `OpsTaskManagementUseCase.directorPendingApprovals` (⛔ không đủ ⇒ **403**) ✔
  ④ RBAC `ActionRbacRegistry` (module `approvals` + `canView`) ✔
  ⑤ `case` `SystemController` ✔
  ```
- **CÒN ĐÚNG 1 VIỆC ĐỂ DONE**: ④ **test H2 bằng USER THƯỜNG** ⇐ ⚠️ **PHẢI CÓ TEST TRƯỚC KHI ĐÁNH DONE** ✗
  (⚠️ **seed `system_level_catalog`** ✗ · assert **đủ cấp ⇒ 200** ✔ + **thiếu cấp ⇒ 403** ✔)

### 22/09/2026 — ✅ **MT2-P4-03 DONE** (test XANH 2 CHIỀU · 53 / 3 ĐỎ CÓ SẴN / 0 Errors)
- **Files Changed (cuối)**: `java-backend/web/src/test/java/com/vntech/erp/web/controller/DirectorPendingApprovalsTest.java` — **FILE MỚI** ✔
- **Mô phỏng theo `RbacSupplierMaterialTest`** (99 dòng — test RBAC **user THƯỜNG** ngắn nhất ✔) + dùng `TestActors` ✔
- **CÁCH CÔ LẬP ĐÚNG 1 BIẾN (điểm cốt lõi)**:
  ```text
  CẤP QUYỀN module `approvals`/`canView` cho **CẢ HAI** user ⇒ tầng RBAC cho qua **CẢ HAI** ✔
  ⇒ ⇒ **BIẾN DUY NHẤT** còn lại = **CẤP BẬC** (`level_rank`) ✔
  (nếu chỉ cấp quyền cho 1 người ⇒ ⛔ KHÔNG phân biệt được «chặn do RBAC» vs «chặn do CẤP BẬC» ✗)
  ```
- **🧪 BẰNG CHỨNG CHẠY THẬT — 3 DÒNG LOG**:
  ```text
  [P4-03][director_pending_approvals] status=**200** body={"ok":true,"approvals":[],"total":0}    ← cấp ≥ trưởng phòng (30) ✔
  [P4-03][director_pending_approvals] status=**403** …"Tài khoản chưa đủ quyền xem vùng phê duyệt…" ← cấp THẤP (10) ✔
  [P4-03][director_pending_approvals] status=**200** body={"ok":true,"approvals":[],"total":0}    ← admin (đối chứng) ✔
  ✅ **Tests run: 53 · Failures: 3 · Errors: 0** · 3 Đỏ = **ĐÚNG 3 ca CÓ SẴN** (`ProductionRoleCounterProofTest`)
     ⇒ ⛔ **KHÔNG hồi quy** ✔ · số test **52 → 53** = **+1 test MỚI** ✔
  ```
  ⚠️ `approvals:[]` vì **H2 không có phiếu** ✗ ⇒ **ĐÚNG** ✔ — test này chứng minh **PHÂN QUYỀN**, ⛔ không phải dữ liệu ✗
- **API Changed**: `POST /api/system` +action **`director_pending_approvals`** ✔ · **DB Changed**: ⛔ **0 migration** ✔
- **RBAC Changed**: `director_pending_approvals` → module **`approvals`** + capability **`canView`** ✔ (**2 LỚP** với cấp bậc) ✔
- **Workflow Changed**: ⛔ **0** — chỉ **ĐỌC** (`approvals.status='pending'` + lọc snapshot) ✔ (GOAL §20) ✔
- **🎓 6 BÀI HỌC TÍCH LŨY TRONG P4-03**:
  ```text
  ① `stage_no` ⛔ KHÔNG đủ để lọc bước — bước 5 có **2 snapshot** khác nhau ✗ ⇒ lọc theo MÃ QUYỀN ✔
  ② ⛔ KHÔNG `LIKE '%director%'` mù ✗ ⇒ **tách mã + so CHÍNH XÁC ở JAVA** ✔
  ③ điều kiện quyền cài **inline 1 tầng** ⇒ tầng khác ⛔ không dùng lại ✗ ⇒ **trích thành HÀM PORT** ✔
  ④ ⛔ KHÔNG vào use-case **thiếu `OpsTaskStore`** ✗ (phải sửa constructor = bẫy tham số vị trí ✗)
  ⑤ neo `edit` nên là **chuỗi ASCII DUY NHẤT** ✔ (tránh đoán tiếng Việt ✗)
  ⑥ test PHẢI cô lập **ĐÚNG 1 BIẾN** ✔ (cấp quyền cho **CẢ HAI** ⇒ biến duy nhất = CẤP BẬC ✔)
  ```
- **⇒ MT2-P4-03 DONE** ⇒ **PHASE 4 = 3/5** (P4-01 BLOCKED · P4-02 ✔ · **P4-03 ✔** · P4-04 ✔ · P4-05 ✔) ⇒ **MT2 25/98 = 25,5 %**.
- **Next Task**: **PHASE 4 còn P4-01 BLOCKED** ⇒ chuyển **PHASE 5** (4 task) ✔
