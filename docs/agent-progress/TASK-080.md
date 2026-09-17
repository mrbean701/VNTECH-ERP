# TASK-080 — KHÔNG HARDCODE: nạp **dữ liệu thật** còn thiếu để test được luồng

**Trạng thái:** 🔄 IN PROGRESS (đợt 1 xong: **quyền phòng ban + quyền người dùng + tổ đội**)
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Chỉ thị người dùng (17/09/2026):** *"Từ giờ không hardcode nữa chỉ sử dụng dữ liệu thật, nếu chưa có thì hãy insert đầy đủ để có căn cứ cho việc test luồng và mô phỏng hoạt động thực tế."*

---

## 1. Kiểm kê dữ liệu thật (TRƯỚC khi sửa) — đo bằng SQL, không phỏng đoán

| Hạng mục | Trước | Ý nghĩa |
|---|---|---|
| `department_module_permissions` | **51 dòng** (DA 16 · KH 16 · TCKT 8 · HCPC 6 · BCH 4 · VNTECH 1 · **BGD 0** · **VNTECH-01 0**) | nguồn để hệ thống sinh quyền người dùng |
| **Module có 0 dòng quyền phòng ban** | **22/61** (`boq` · `payments` · `reports` · `teams` · `stocktake` · `inventory` · `warehouse_issue` · `central_warehouse` · `construction` · `production` · `project_progress` · `material_norms` · `delivered` · `site_command` · `capital_recovery` · `dept_legal_*` ×6) | **ngoài admin không ai mở được** (đúng lớp lỗi §6 của audit) |
| `user_module_permissions` | 484 dòng · phủ **39** module | 22 module không có quyền cho bất kỳ ai |
| `team_members` | **0 dòng** | luồng tổ đội không chạy |
| `teams.leader_user_id` | **NULL** | tổ đội không có tổ trưởng |
| `role_catalog.default_organization_unit_id` | **NULL cho 16/16 vai trò** | cơ chế "đơn vị mặc định theo vai trò" chết |
| `work_items` · `email_outbox` · `capital_recovery_records` · `production_reports` | **0** | màn Công việc · Hộp thư gửi · Thu hồi vốn · Sản lượng trống |
| `attachments` | 1 dòng **mồ côi** (chứng từ có PO không tồn tại) + 11 tệp rời trong kho | ảnh thật không tải được |

**Sao lưu trước khi sửa:** `tools/_backup-permissions-truoc-TASK080.txt` (2 bảng quyền · 97,5 KB).

## 2. Đã nạp (đợt 1) — bằng **cơ chế CHUẨN của sản phẩm**, không tự chế

| Việc | Cách làm | Kết quả |
|---|---|---|
| Ma trận quyền phòng ban | `INSERT … SELECT` chỉ cho cặp **(đơn vị × module) CHƯA có**, mức `view+use+export` (BGD thêm `approve`) | **51 → 480 dòng**; **0 module nào còn trống** (ngoài `admin` — cố ý) |
| Quyền người dùng | gọi action **`rebuild_department_permissions`** (chỉ admin) — *"Đã đồng bộ lại quyền mặc định phòng ban cho **11 tài khoản**"* | **484 → 926 dòng**; phủ **39 → 60/60** module |
| Tổ trưởng tổ đội | gán tài khoản BCH thật (`cha.ht`) | tổ đội có tổ trưởng |
| Thành viên tổ đội | thêm **4 tài khoản thật**, `role_in_team` lấy từ `role_catalog.name` | `team_members` **0 → 4** |

**Không tự đặt chữ hiển thị mới:** mọi nhãn lấy từ `role_catalog` / `module_catalog` / `organization_units` có sẵn.

## 3. Kiểm chứng (bằng số, có ĐỐI CHIẾU ngược)

| Phép kiểm | Kết quả |
|---|---|
| So **từng tài khoản** trước (bản sao lưu) ↔ sau | **TĂNG 11 · GIẢM 0 · bằng 1** (admin) ⇒ **không ai bị mất quyền** |
| Tổng dòng `user_module_permissions` | **484 → 926** |
| Số module khác nhau được cấp | **39 → 60/60** |
| Module còn 0 dòng quyền | **chỉ `admin`** (đúng thiết kế: chức năng quản trị chỉ cho tài khoản admin) |
| `teams` / `team_members` qua API | cổng `tools/probe-task073-team-members.mjs` đọc thấy **mức nền 4 dòng thật** và vẫn ĐẠT với fixture |

### 3.1 ⚠️ Một hồi quy tôi TỰ PHÁT HIỆN rồi tự vá (ghi lại đầy đủ)
Lần đồng bộ **đầu tiên** làm tài khoản `thukydemo` (Thư ký TGĐ, đơn vị `VNTECH`) có **15 quyền** —
vì ma trận của đơn vị `VNTECH` chỉ có **1 module**. Nếu dừng ở đó thì **tài khoản lãnh đạo bị khoá gần hết**.
**Đã vá:** bổ sung ma trận đủ **60 module** cho `VNTECH` + `VNTECH-01` (vai trò công ty/lãnh đạo có `approve`)
rồi chạy lại đồng bộ. **Đối chiếu ngược với bản sao lưu xác nhận: `thukydemo` vốn đã 15 trước khi tôi sửa**
⇒ nghi ngờ "giảm quyền" của tôi là **SAI**, và nay anh ta có **60** ✓.

## 4. Quy tắc rút ra (áp cho các phiên sau)

1. **Dữ liệu thật trước, hardcode sau cùng** — mọi màn phải đọc từ DB/API; thiếu dữ liệu thì **nạp**, không bịa trong mã.
2. **Nạp bằng cơ chế của sản phẩm** (`department_module_permissions` + `rebuild_department_permissions`,
   `save_department_permission`…) thay vì INSERT thô vào bảng dẫn xuất — hệ thống tự đồng bộ và tự kiểm luật.
3. **Luôn sao lưu + đối chiếu ngược** trước/sau khi sửa dữ liệu quyền: phép so theo **từng tài khoản** mới
   phát hiện được việc **âm thầm giảm quyền**.
4. Đơn vị **CÔNG TY** (`VNTECH`) và **Ban giám đốc** (`BGD`) phải có ma trận — nếu bỏ trống thì tài khoản
   lãnh đạo **mất quyền** sau mỗi lần đồng bộ.

## 5. Còn lại (đợt sau)

* `role_catalog.default_organization_unit_id` = NULL cho **16/16** vai trò (TASK-032) — cần ánh xạ vai trò → đơn vị.
* `work_items` = 0 · `email_outbox` = 0 · `capital_recovery_records` = 0 · `production_reports` = 0.
* 1 dòng `attachments` mồ côi + 11 tệp rời trong kho.
* **Rà hardcode trong mã**: các chỗ còn hiện giá trị cố định thay vì dữ liệu (vd `Quá hạn <b>{moneyBillion(0)}</b>`
  ở màn thanh toán, `▧ {…?2:0}` số chứng chỉ ở màn Đã giao, `StatusBadge value="Đã nhập kho"` cố định).

## 6. Tệp thay đổi

| Tệp | Nội dung |
|---|---|
| `tools/task080-seed-real-data.sql` | **MỚI** — toàn bộ SQL đã chạy (ma trận quyền + tổ đội), kèm vì-sao và kết quả đo |
| `tools/_backup-permissions-truoc-TASK080.txt` | **MỚI** — sao lưu 2 bảng quyền trước khi sửa |
| `docs/agent-progress/TASK-080.md` | hồ sơ này |

---

# ĐỢT 2B (18/09/2026) — hai lỗ hổng dữ liệu thật, tiếp nối TASK-082

Đợt 2A (hồ sơ `TASK-082.md`) đã **nối cột** và **bỏ hằng số giả**. Đợt 2B xử lý hai chỗ mà chính
TASK-082 phát hiện ra là **dữ liệu thật còn thiếu/bất nhất** (đo trên MySQL, không suy đoán).

## B1. Phiếu nhập `confirmed` nhưng THIẾU người xác nhận BCH

| Đo trước | Giá trị |
|---|---|
| `goods_receipts` có `bch_confirmation_status='confirmed'` | **12** |
| … trong đó `bch_confirmed_by IS NULL` | **10** (10 phiếu do TASK-081 dựng lại) |
| … trong đó `bch_confirmed_by` trỏ tới user **KHÔNG tồn tại** (`USR_2f435847-…`) | **2** (tham chiếu treo do các lượt smoke trước) |

⇒ Dù trạng thái là "đã xác nhận", Java `LEFT JOIN users` ra **NULL** nên UI in chữ dự phòng
`"BCH công trường"`. **Đã điền người xác nhận THẬT:** `cha.ht` = *"Chỉ huy trưởng A"*, vai trò `cht`,
thuộc **Ban chỉ huy công trường** — đúng cột nghiệp vụ "BCH XÁC NHẬN" và cùng ban với kho nhận
`KHO-DA-MAU-01`. Mốc thời gian lấy **chính `received_at`** (đúng cách sản phẩm ghi khi BCH xác nhận
trong cùng lượt nhập: bản ghi thật `GRN-…-0005` có `confirmed_at` cách `received_at` 0,237 giây).

## B2. `role_catalog.default_organization_unit_id` NULL 16/16 trên MySQL

Quy tắc ánh xạ vai trò → đơn vị **đã có sẵn trong kho mã**: `drizzle/0045_patch01_runtime_admin_boq_hardening.sql`
dòng 80–90, nhưng **chỉ chạy trên SQLite** ⇒ Java đọc `ou.code AS defaultOrganizationCode` qua
`LEFT JOIN` nên luôn NULL ⇒ giao diện không hiện đơn vị mặc định của vai trò.

⚠️ **Bẫy đã tránh:** KHÔNG chép nguyên literal `'ORG-KH'`/`'ORG-TCKT'`/… của 0045. Đo thật cho thấy
MySQL dùng **ID hỗn hợp**: `ORG-BGD` · `ORG-DA` · `ORG-HCPC` là chuỗi mã, còn `BCH` · `KH` · `TCKT` ·
`VNTECH` · `VNTECH-01` mang dạng `ORG_<uuid>` (do migration `V13__merge_duplicate_org_units` gộp đơn vị
trùng) ⇒ phải **JOIN theo `organization_units.code`**. Nếu chép literal thì 5/7 giá trị thành **tham chiếu treo**.

**Kết quả nghiệm thu (chạy trong chính tệp seed):**

| Chỉ số | Trước | Sau |
|---|---|---|
| `role_catalog` có đơn vị mặc định | **0/16** | **15/16** |
| … còn NULL | 16 | **1** = vai trò `team` (Tổ đội) — **GIỮ NULL có chủ ý** vì `drizzle/0045` không ánh xạ `team` ⇒ đúng luật §45 **không tự suy đoán**, đã ghi thành câu hỏi cho người dùng |
| Phiếu `confirmed` thiếu người xác nhận | 10 | **0** |
| Phiếu trỏ tới user không tồn tại | 2 | **0** |

## B3. Truy nguyên TRỌN VẸN test đỏ đã biết TASK-032 (không sửa, chỉ báo cáo)

Test `tests/runtime-admin-boq-regression.test.mjs` khẳng định
`x.code==='thuky' && x.name==='Thư ký Tổng giám đốc' && x.defaultOrganizationCode==='BGD'`.
Chuỗi thật của schema:

1. `drizzle/0029:76` — tạo `thuky` với **tên DÀI**: *"Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế"*.
2. `drizzle/0045:90` — đổi thành **tên NGẮN** *"Thư ký Tổng giám đốc"* + gán `ORG-BGD` ← **test được viết theo mốc này**.
3. `drizzle/0079` (migration **SAU ĐÓ**) — đổi **ngược lại tên DÀI**: `UPDATE role_catalog SET name='Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế' … WHERE code='thuky'`.

⇒ **Phần ánh xạ đơn vị thì ĐÚNG** (`thuky → BGD`, có cả ở SQLite lẫn MySQL sau đợt này);
**phần đỏ còn lại là KỲ VỌNG TEST ĐÃ CŨ** so với migration 0079 (dữ liệu hiện tại khớp MySQL).
**Không tự sửa** kỳ vọng test hay đổi tên vai trò — đây là **quyết định đặt tên nghiệp vụ**, đã đưa vào
danh sách câu hỏi cho người dùng.

## B4. Kiểm chứng

- Cổng `tools/probe-task082-realdata.mjs` **mở rộng lên 21 phép kiểm** và **21/21 ĐẠT** (qua cổng 9000):
  thêm 2 bất biến mới — *mọi phiếu đã BCH xác nhận đều phải có TÊN người xác nhận thật* (11/11) ·
  *phiếu CHƯA xác nhận thì KHÔNG được có người xác nhận* (tự kiểm soát, 4 phiếu chờ) · *ánh xạ đơn vị
  mặc định đã có thật* (15/16) · *`thuky` → BGD đúng quy tắc 0045*.
- `tests/runtime-admin-boq-regression.test.mjs` chạy riêng: **26/27** (1 đỏ = kỳ vọng tên cũ ở B3).

## B5. Tệp thay đổi (đợt 2B)

| Tệp | Nội dung |
|---|---|
| `tools/task080b-seed-real-data.sql` | **MỚI** — 6 câu `UPDATE` + khối nghiệm thu; ghi rõ nguồn quy tắc và bẫy ID hỗn hợp |
| `tools/_backup-bch-roleorg-truoc-TASK080B.txt` | **MỚI** — sao lưu `role_catalog` + `goods_receipts` + `users` trước khi sửa (4.364 byte) |
| `tools/probe-task082-realdata.mjs` | mở rộng 18 → **21** phép kiểm |
| `docs/agent-progress/TASK-080.md` | mục này |

---

# ĐỢT 2C (18/09/2026) — BẢNG `work_items` RỖNG: ba lỗi THẬT trong mô-đun công việc

Mục tiêu: làm cho bảng `work_items` (và màn Trung tâm công việc) có **dữ liệu thật**.
Nguyên tắc: **KHÔNG nhét tay** — chính sản phẩm đã chặn điều đó (`OpsTaskManagementUseCase:64-66`:
*"Task từ ERP phải được hệ thống tự sinh"*). Vì vậy em dùng ĐÚNG đường thật: **Trưởng phòng
gọi action `create_work_item`** qua cổng 9000. Cổng kiểm chứng mới: `tools/probe-task080c-work-items.mjs`.

Đường đi đó lộ ra **3 lỗi thật**, mỗi lỗi đều bị chặn cứng nên phải sửa mới có dữ liệu:

## C1. Luật "Trưởng phòng" so SAI NGUỒN DỮ LIỆU (vi phạm quy tắc #9)

| | JS SSOT (`scripts/system-route.mjs:247`) | Java (trước) |
|---|---|---|
| Nguồn | `user.role` | `u.department` **so với mã phòng** |
| KH | `role === 'kh_truong'` | `u.department = 'KH'` |
| DA | `role === 'da_truong'` | `u.department = 'DA'` |

Cột `users.department` trong MySQL chứa **TÊN tiếng Việt** (`Phòng Dự án`, `Phòng Kế hoạch`) nên
`u.department='DA'` **không bao giờ đúng** ⇒ **mọi** người dùng thật bị chặn:
`{"ok":false,"error":"Chỉ Trưởng phòng hoặc Quản trị viên được giao việc thủ công."}`
(Trưởng phòng Dự án `trdademo` đã bị chặn đúng như vậy khi đo.)
Ảnh hưởng cả 3 action: `create_work_item` · `update_work_item_status` (xác nhận Hoàn thành) · `reassign_work_item`.

## C2. Luật "người nhận việc" cũng so SAI NGUỒN + thiếu nhánh mặc định

* Java (trước): `u.department = 'DA'` ⇒ luôn sai nguồn (cùng lớp lỗi C1).
* JS `system-route.mjs:248-255`: phải **active** + `COALESCE(rc.base_role,u.role)` khớp phòng
  (KH→`procurement`, DA→`project`) + nếu có dự án thì phải có `user_project_scopes`.
* Java **không hề kiểm người nhận** khi tạo việc, và khi payload không có `assignedTo` thì ghi thẳng
  `""` ⇒ **công việc không có người nhận** (dữ liệu vô nghĩa). JS có `defaultDepartmentAssignee`
  (`:256-259`) — Java **chưa port**.

## C3. ⚠️ CHƯA PORT: giao việc xong KHÔNG có thông báo, KHÔNG có email, KHÔNG có sự kiện ASSIGNED

JS `createDepartmentTask` (`system-route.mjs:273-277`) ghi **một lượt 3 việc**:
`work_items` + `work_item_events` (event `ASSIGNED`) rồi `queueTaskNotice` ⇒ `task_notifications`
+ (nếu người nhận có email) `email_outbox`.

Java `OpsTaskStoreAdapter.insertWorkItem` **chỉ ghi `work_items`**. Đo sau khi giao 3 việc thật:
`work_item_events=2` (chỉ có `STATUS` + `REASSIGNED` do 2 action khác sinh, **0 event `ASSIGNED`**) ·
`task_notifications=0` · `email_outbox=0` — **trong khi chính thông điệp trả về của action vẫn nói
"…và đã tạo thông báo cho nhân viên."** ⇒ Đây là **khoảng trống lớn nhất của mô-đun** và là lý do
trực tiếp khiến 2 bảng `task_notifications`/`email_outbox` rỗng. **CHƯA sửa trong đợt này** —
đã ghi thành việc kế tiếp có chỉ dẫn port cụ thể (xem `MASTER_STATUS` KP #78).

## C4. Đã sửa (đợt 2C)

| Tệp | Nội dung |
|---|---|
| `OpsTaskStoreAdapter.userIsDepartmentManager` | port đúng nguồn JS: `u.role IN ('kh_truong'/'da_truong')` + admin |
| `OpsTaskStoreAdapter.userCanReceiveDepartmentTask` | port đúng nguồn JS: active + `base_role` khớp phòng + phạm vi dự án |
| `OpsTaskStoreAdapter.defaultDepartmentAssignee` (**MỚI**) | port `defaultDepartmentAssignee` (`:256-259`): ưu tiên nhân viên (`kh_nv`/`da_nv`) và người có phạm vi dự án |
| `OpsTaskStore` (interface) | thêm `defaultDepartmentAssignee(...)` |
| `OpsTaskManagementUseCase.createWorkItem` | chọn/kiểm người nhận đúng luật JS, thiếu thì **báo lỗi** thay vì ghi rỗng |

🔴 **LỖI CỦA CHÍNH TÔI (ghi lại để không lặp):** lượt đầu em dùng `nvl(...)` rồi gọi `.isEmpty()` ⇒
**HTTP 500 NullPointerException** (`OpsTaskManagementUseCase:82`), vì trong lớp này
`nvl` (dòng 628) trả **`null`** khi rỗng chứ không phải `""`. Đã sửa sang `trim(...)` và ghi chú ngay
tại chỗ sửa. **Thứ tự phát hiện:** cổng chạy thật → log Java (job `pwsh-46`) → đọc đúng dòng 628 → sửa.

🔴 **LỖI CỦA CHÍNH TÔI (cổng kiểm chứng tự vô hiệu):** `staffDirectory` **không có khoá `username`**
(chỉ có `id · employeeCode · fullName · email · role · …`) nhưng em map theo `username` ⇒ map RỖNG ⇒
mọi `assignedTo` gửi đi là `""` ⇒ hệ thống rơi vào người nhận MẶC ĐỊNH, và phép "tự kiểm soát" xanh
mà **không hề kiểm gì**. Đã sửa: map theo `fullName` + `employeeCode` **và bắt buộc khẳng định tra
được id** trước khi dùng. **Đây là lý do cổng phải có "tự kiểm soát tra được id"** — nếu không,
cổng sẽ báo xanh sai.

## C5. Dữ liệu THẬT đã tạo (qua chính action của sản phẩm)

| Mã việc | Trạng thái | Người nhận | Hạn | Ưu tiên |
|---|---|---|---|---|
| `CV-DA-260917-3436` | NEW | `nvdademo` (Nhân viên Dự án E) | 25/09/2026 | high |
| `CV-DA-260917-4738` | NEW | `nvdademo` | 28/09/2026 | normal |
| `CV-DA-260917-1203` | NEW | `trdademo` (Trưởng phòng Dự án C) | 30/09/2026 | normal |
| `CV-DA-260917-6847` | CANCELLED | (dấu vết lượt chạy lỗi — đã huỷ bằng action thật) | — | — |

Cả 3 việc gắn **đúng dự án thật** `PRJ-DEMO-01` và **đúng người nhận thật** của phòng Dự án.

## C6. Thêm một lỗ hổng dữ liệu: quyền GHI theo dự án

Trong lúc chạy thật, action trả `{"error":"Không có quyền tại dự án."}`. Truy vết:
`user_project_scopes.permission` của **MỌI tài khoản ngoài admin** đều là **`read`** (kể cả hai
Trưởng phòng), trong khi luật ghi ở **cả hai đường** đều đòi `{write, approve, admin}`
(JS `:221` ↔ Java `AccessScopeService:40/70`) ⇒ **mọi thao tác ghi có phạm vi dự án đều bị chặn**.
Đã rà toàn bộ mã: **không nơi nào phân biệt `approve` với `write`** cho phạm vi dự án ⇒ cấp mức
**`write` (tối thiểu đủ dùng)** cho các vai trò nghiệp vụ (trưởng phòng · nhân viên · kỹ sư · chỉ huy
trưởng · thủ kho); **giữ `read`** cho kế toán và thư ký/BGĐ. Tệp:
`tools/task080c-seed-project-write-scope.sql` + sao lưu `tools/_backup-project-scope-truoc-TASK080C.txt`.
⚠️ **Cần người dùng xác nhận lại ánh xạ này** (có thể hoàn tác từ sao lưu).

## C7. Kiểm chứng đợt 2C

* Cổng `tools/probe-task080c-work-items.mjs`: **24/24 ĐẠT · 0 HỎNG · 2 KHOẢNG TRỐNG ĐÃ GHI NHẬN**
  (qua cổng 9000), gồm **4 phép tự kiểm soát**: payload có `sourceId` phải bị từ chối · thiếu nội dung
  phải bị từ chối · phòng ngoài KH/DA phải bị từ chối · **giao cho người khác phòng phải bị từ chối**
  (dùng `ksda.demo` — có phạm vi dự án nhưng `base_role=engineer`, chứng minh luật `base_role` đã port đúng).
* `mvn -DskipTests package` **BUILD SUCCESS** (54 tệp application + 37 tệp infrastructure biên dịch lại).
* Dữ liệu đo trên MySQL: `work_items` 0 → **4** · `work_item_events` **2** (STATUS + REASSIGNED) ·
  `task_notifications` **0** và `email_outbox` **0** = **bằng chứng cho khoảng trống C3**.

## C8. Tệp thay đổi (đợt 2C)

| Tệp | Nội dung |
|---|---|
| `java-backend/.../OpsTaskStoreAdapter.java` | 2 luật port lại theo JS + thêm `defaultDepartmentAssignee` |
| `java-backend/.../OpsTaskStore.java` | thêm 1 phương thức cổng |
| `java-backend/.../OpsTaskManagementUseCase.java` | chọn/kiểm người nhận theo JS; bài học `nvl` trả null |
| `tools/probe-task080c-work-items.mjs` | **MỚI** — cổng 24 phép kiểm + 2 khoảng trống ghi nhận |
| `tools/task080c-seed-project-write-scope.sql` | **MỚI** — cấp quyền ghi theo dự án (kèm vì-sao + nghiệm thu) |
| `tools/_backup-project-scope-truoc-TASK080C.txt` | **MỚI** — sao lưu `user_project_scopes` trước khi sửa |


