# TASK-027 — Kiểm chứng SỐNG bằng tài khoản thật (vai trò + phạm vi)

**Trạng thái:** DONE (tầng vai trò) · **Ngày:** 18/09/2026 · **Commit:** #35
**Phương pháp:** `tools/probe-task027-live.mjs` chạy trên đường chạy THẬT của người dùng (proxy `:9000`)

---

## 0. Vì sao phép kiểm này an toàn tuyệt đối

Tầng Java **chỉ phục vụ action GHI** (186 action; phần `*_uidx` là ánh xạ lỗi unique, không phải action).
Chốt quyền nằm ở **đầu mỗi nhánh `case`** và trong UseCase, **TRƯỚC** khi validate/ghi. Vì vậy gọi
một action với **payload rỗng** cho kết quả:

| Kết quả | Nghĩa | Ghi dữ liệu? |
|---|---|---|
| **403** | bị chặn ở tầng quyền | **Không** |
| **400** | đã qua tầng quyền, dừng ở validate thiếu tham số | **Không** |

⇒ Đo được toàn bộ ma trận CHO/CHẶN mà **không tạo, không sửa, không xoá bất kỳ bản ghi nào**.
Các action có nguy cơ chạy thật dù thiếu tham số (`factory_reset_*`, `rebuild_department_permissions`,
`bulk_import_*`, `install_license_foundation`, `retry_email`, `reorder_*`) đã bị **loại trừ tường minh**.

## 1. Kết quả

| Pha | Nội dung | Kết quả |
|---|---|---|
| 0 | Bảng vai trò thật (10 tài khoản) | **10/10 roleBase ĐÚNG mã engine** ✅ |
| 1 | Chống hở: 39 action admin-only × 9 tài khoản thường | **351/351 bị 403 · lọt 0** ✅ |
| 2 | Chống chặn oan: action thuộc vai trò mình | **403 tầng VAI TRÒ = 0** ✅ |

Bảng vai trò đo được (đối chiếu `drizzle/0029:71-80`):

| Tài khoản | role (chuẩn) | roleBase (engine) | Tên vai trò |
|---|---|---|---|
| admin | admin | admin | admin |
| ksda.demo / engineer.demo | ksda | **engineer** | Kỹ sư dự án |
| thukydemo | thuky | **director** | Thư ký TGĐ / Trưởng phòng HCPC |
| nvdademo | da_nv | **project** | Nhân viên Phòng Dự án |
| trdademo | da_truong | **project** | Trưởng phòng Dự án |
| nvkhdemo | kh_nv | **procurement** | Nhân viên Phòng Kế hoạch |
| trinhtrench | kh_truong | **procurement** | Trưởng phòng Kế hoạch |
| tkhodemo | thu_kho | **warehouse** | Thủ kho dự án |
| cha.ht | cht | **commander** | Chỉ huy trưởng |

Ánh xạ nhiều-về-một được xác nhận trên dữ liệu sống: `da_nv` & `da_truong` → cùng `project`;
`kh_nv` & `kh_truong` → cùng `procurement`; `ksda` (2 tài khoản) → `engineer`.

## 2. 🔴 LỖI P0 #1 — `create_request` / `decide_approval` hỏng với MỌI người dùng không phải admin

**Bằng chứng đo được (trước khi vá):**
```
ksda.demo (engineer)     create_request -> 403 "Tài khoản không có quyền thực hiện nghiệp vụ này."
engineer.demo (engineer) create_request -> 403 (cùng thông điệp)
cha.ht (commander)       create_request -> 403 (cùng thông điệp)
```
Thông điệp này là của **`requireRole`** (tầng 2) — nhưng danh sách vai trò của `create_request` là
`[engineer, commander, admin]` (`RequestManagementUseCase.java:57`), **có** `engineer`. Mâu thuẫn.

**Nguyên nhân gốc:** nhánh `case "create_request"` (và `case "decide_approval"`) **tự dựng lớp vô danh
`Principal` tại chỗ** thay vì dùng helper `asReqPrincipal(cu)`, và **thiếu override `roleBase()`**:

```java
new RequestManagementUseCase.Principal() {
    @Override public String userId() { return cu.id(); }
    @Override public String role() { return cu.role(); }   // <-- thiếu roleBase()
    ...
}
```
`Principal.roleBase()` có mặc định `return role();` ⇒ trả **mã CHUẨN** `"ksda"`.
`requireRole` so với `"ksda"` trong danh sách `[engineer, commander, admin]` ⇒ **403**.

**Hệ quả nghiệp vụ:** chỉ admin lập được phiếu đề nghị mua vật tư — **chặn đứng nghiệp vụ cốt lõi**.

**Vì sao các đợt vá trước bỏ sót:** TASK-021b/TASK-023b vá các **helper** `asXxxPrincipal(...)`,
nhưng 2 nhánh này không dùng helper. Phép quét tĩnh theo helper không thấy chúng; **chỉ kiểm chứng
sống mới lộ ra** — đây chính là giá trị của TASK-027.

**Phạm vi rà soát:** có **18 khối `Principal` vô danh** trong controller, **12 khối thiếu `roleBase()`**.
Đã đối chiếu từng khối với danh sách UseCase thật sự **đọc** `roleBase()`
(AdminOpsManagement, OpsTaskManagement, ProductionManagement, PurchaseManagement, RequestManagement,
StockManagement): **chỉ 2 khối của RequestManagement là nguy hiểm**; 10 khối còn lại thuộc UseCase
không đọc `roleBase()` (hoặc chỉ kiểm `[admin]` nên controller đã chặn trước bằng `requireRequireAdmin`).
⇒ **Không còn khối vô danh nào khác gây lỗi** — kết luận có kiểm chứng, không suy đoán.

**Bản vá:** dùng lại helper sẵn có `asReqPrincipal(cu)` (đã có `roleBase()`/`fullName()`/`email()`) —
vừa đúng §5 (tái sử dụng, không nhân bản), vừa loại bỏ lớp vô danh.

**Xác nhận sau vá (đo lại trên `:9000`):**
```
BEFORE: create_request -> 403 "Tài khoản không có quyền thực hiện nghiệp vụ này."   (tầng VAI TRÒ — sai)
AFTER : create_request -> 403 "Tài khoản không được lập đơn cho dự án này."          (tầng PHẠM VI — đúng)
```
Chuyển từ tầng 2 sang tầng 3 là **đúng như thiết kế**: payload rỗng nên `projectId` trống,
`requireProjectAccess` từ chối — và JS cũng từ chối trong cùng tình huống
(`canAccessProject` không tìm thấy dòng `user_project_scopes` nào cho `project_id=''`).

## 3. 🔴 LỖI P0 #2 — nhánh phạm vi KHO là MÃ CHẾT

**`AccessScopeService.java:77`** so `"warehouse".equals(role)` với **mã ENGINE**, nhưng mọi nơi gọi
đều truyền `principal.role()` = **mã CHUẨN** (`thu_kho`/`kho_tong`). Với người dùng kho thật
(`tkhodemo`), nhánh này **không bao giờ chạy** — trong khi JS dùng `effectiveRole(user)` nên chạy được
(`scripts/system-route.mjs:229`).

Hệ quả hai chiều, đều sai:
- **Chặn oan:** `thu_kho` có `user_warehouse_scopes` hợp lệ nhưng thiếu `user_project_scopes`
  → Java từ chối, JS cho phép.
- **Lọt quyền (nghiêm trọng hơn):** `thu_kho` vào **kho central** được Java cho qua bằng module
  `central_warehouse`/`material_catalog`, trong khi JS bắt buộc đúng nhánh `warehouse` + kiểm
  `warehouseScopeKind` (site/central) + bắt buộc có dòng `user_warehouse_scopes`.

**Bản vá:** thêm `isWarehouseRole(role)` nhận **cả** mã engine lẫn mã chuẩn (`thu_kho`, `kho_tong`) —
đúng quy ước đã dùng ở `RbacService.requireRole` (nhận cả `role()` và `roleBase()`), kèm chú thích
ghi rõ nguồn JS để đời sau không "sửa lại" thành so mã engine thuần.

**Lưu ý về hậu kiểm:** đã thử thêm `roleBase()` vào helper `asAdminPrincipal` và **biên dịch HỎNG**:
`AdminSystemUseCase.Principal` **không khai báo** `roleBase()` (chỉ có `userId`/`role`/`warehouseScopeKind`),
và UseCase này cũng không đọc `roleBase()`. Đã **hoàn nguyên** — chỉ sửa đúng chỗ có bằng chứng.

## 4. Phát hiện thêm (đã ghi task)

### 4.1 Bản đồ MODULE: Java CHẶT HƠN JS trên 30 action — TASK-029
`tools/probe-action-module-parity.mjs` (chuẩn hóa đúng ngữ nghĩa JS: thiếu trong `ACTION_MODULE`
= không kiểm; thiếu trong `ACTION_CAPABILITY` = mặc định `canUse`):

| Bản đồ | Khớp | Kết luận |
|---|---|---|
| MODULE | 156/186 | **30 lệch, TẤT CẢ cùng chiều `JS=[] → Java=[module]`** ⇒ Java chặt hơn JS |
| CAPABILITY | 185/186 | 1 lệch: `system_level_impact` JS `canUse` vs Java `canView` (Java chặt hơn) |

30 action Java kiểm module mà JS không kiểm gồm: `create_project_team`, `save_team_subcontract`,
`save_team_production`, `approve_team_production`, `save_team_payment`, `settle_team_subcontract`,
`save_workflow`/`set_workflow_status`/`delete_workflow`, `save_approval_stage`/`set_approval_stage_status`/
`delete_approval_stage`, `save_email_settings`, `save_ui_display_settings`, `save_trust_development_settings`,
`save_material_category`/`delete_material_category`/`set_material_category_status` và các action con
của subcategory, `import_material_catalog`, `create_self_work_item`, `delete_project_team`,
`bulk_import_projects`, `bulk_import_users`, `install_license_foundation`, `request_license_transfer`,
`retry_email`.

⇒ Đây là **sai lệch so với JS ở hướng chặt hơn**: người dùng mất quyền so với hành vi JS. Cần quyết định
giữ (an toàn hơn, nhưng lệch §6) hay khôi phục đúng JS. **Không tự ý đổi** — chờ xác nhận (§45/§18).

### 4.2 43 ca bị chặn ở tầng MODULE — TASK-030
Phân loại theo tầng (sau khi vá): `T1-module 43 · T3-phạm-vi 2 · T2-vai-trò 0`.
Trong 43 ca, chỉ **6** thuộc nhóm 30 action Java-chặt-hơn-JS; **37 ca còn lại có bản đồ module GIỐNG JS**,
nên JS cũng sẽ chặn ⇒ nhiều khả năng là **thiếu dữ liệu `user_module_permissions`** cho các tài khoản
này (JS có hàm `replaceDepartmentDefaults` tự cấp quyền mặc định theo phòng ban khi lưu người dùng —
`scripts/system-route.mjs`). Cần đối chiếu bảng `user_module_permissions` để xác nhận là **lỗ hổng dữ
liệu** hay hành vi đúng. **Chưa kết luận** khi chưa có bằng chứng dữ liệu.

## 5. Kết luận

- Tầng **VAI TRÒ**: **0 lỗi** trên 10 tài khoản thật; `roleBase` đúng mã engine 10/10;
  351/351 chặn đúng với 0 lọt ⇒ TASK-021 và các đợt vá `roleBase` có hiệu lực thật trong sản phẩm.
- **2 lỗi P0** được tìm ra và vá trong lượt này, trong đó lỗi #1 (`create_request`) đã được
  **xác nhận lại bằng đo lường sống sau khi vá**.
- Tầng **PHẠM VI**: đã vá nhánh kho chết; phần còn lại (43 ca tầng module) **chưa kết luận** và đã
  mở TASK-029 / TASK-030 — đúng nguyên tắc §45 "không tự suy đoán".
- Chưa push (theo quyết định của người dùng).

## 6. Bài học

1. **Kiểm chứng sống bắt được loại lỗi mà mọi phép quét tĩnh bỏ sót.** Hai lỗi P0 này nằm ở lớp
   vô danh **trong `case`** và ở một so sánh chuỗi **mã chặn không bao giờ đúng** — cả hai vô hình
   với phép so khớp theo helper/danh sách.
2. **Thông điệp lỗi là dữ liệu chẩn đoán quý.** Chính việc phân biệt 2 câu thông báo khác nhau đã
   chỉ ra có 2 tầng chặn khác nhau, và tránh một kết luận sai hoàn toàn ("43 chặn oan").
3. **Mô hình kỳ vọng của phép kiểm cũng có thể sai.** "Vai trò nằm trong danh sách ⇒ phải được phép"
   là giả định bỏ qua tầng module. Phải phân loại theo tầng trước khi buộc tội mã nguồn.
4. **Payload rỗng là cách đo quyền an toàn** khi backend chỉ có action ghi — miễn là chốt quyền
   chạy trước validate, và phải loại trừ tường minh các action nguy hiểm.
5. **Chỉ sửa chỗ có bằng chứng.** Lần chèn `roleBase()` vào `asAdminPrincipal` là suy đoán, và
   biên dịch đã bác bỏ ngay (`AdminSystemUseCase.Principal` không có `roleBase()`).
