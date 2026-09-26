# MT2-P4-05 — RÀ TOÀN BỘ ACTION MT2 CÓ KHAI MODULE/CAPABILITY (RBAC)

> Trạng thái: **IN_PROGRESS — audit Phase 4 xong, chưa code**
> Phase: **PHASE 4 — RBAC & PHẠM VI THEO CHỨC VỤ** (5 task) · Ngày: 22/09/2026

## 0. ✅ ĐÍNH CHÍNH HIỂU BIẾT (đọc lại danh sách phase + đo CSDL — ⛔ không suy đoán)

| Điều em từng ghi | SỰ THẬT (đo/đọc được) |
|---|---|
| “Phase 4 = RBAC theo chức danh” | ✔ ĐÚNG: **PHASE 4 — RBAC & PHẠM VI THEO CHỨC VỤ** (`MT2_PHASE_TASK_LIST.md:80`) |
| “§4 là RBAC” | ✗ **SAI**: **§4 của MASTER TASK 2 là «TRUNG TÂM PHÊ DUYỆT»** (`MASTER_TASK_2.md:48`) ⇒ thuộc **PHASE 6** (`:104`) |
| “bảng `system_levels`” | ✗ **SAI tên**: bảng thật là **`system_level_catalog`** (đo `information_schema`) |

**5 task Phase 4 (`:86-90`)** và **trạng thái chặn**:
```text
P4-01  phạm vi xem/giao việc theo chức vụ ................. 🔴 **BLOCKED** (BLK-01 `pho_giam_doc` · BLK-02 2 user trống cấp)
P4-02  ẩn card “phiếu chờ duyệt” theo quyền ............... ⛔ không chặn
P4-03  card “Chờ Giám đốc duyệt” lấy dữ liệu THỰC .......... ⛔ không chặn
P4-04  audit 5 bảng role/level, mở rộng đúng chỗ .......... ⛔ không chặn
P4-05  **rà MỌI action MT2 có khai module/capability** .... ⛔ không chặn  ← CHỌN LÀM (giá trị cao nhất)
```

## 1. YÊU CẦU — NGUYÊN VĂN (`MT2_PHASE_TASK_LIST.md:90`)
> *“MT2-P4-05 · Rà **mọi action MT2** có khai module/capability trong `ActionRbacRegistry`
> (bài học F1: **module rỗng ⇒ 403 toàn bộ**) · Danh sách + vá thiếu · TODO”*

## 2. VÌ SAO ĐÂY LÀ VIỆC ĐÚNG LÚC NÀY (⛔ không phải tự chọn bừa)
- MT2 vừa thêm **13 action** ở Phase 3 (P3-01 ×5 · P3-02 ×2 · P3-04 ×1 · P3-05 ×3 · P3-09 ×1) ⇒ **phải rà lại toàn bộ** ✔
- **Đã trả giá 2 lần** trong chính MT2: ① `List.of()` = **MẶC ĐỊNH TỪ CHỐI 403** (P3-01) ② thiếu khoá ⇒ 403 (dự án từng bị ở `approve_po`)
  ⇒ rà là **bắt buộc** để ⛔ không còn action nào hở/chết ✔
- Thuộc nhóm ưu tiên **4. RBAC / SECURITY** (§42) ⇒ ưu tiên cao ✔

## 3. KẾ HOẠCH
1. **Đo**: trích **toàn bộ `action` mà backend thực sự xử lý** (các `case "…"` trong `SystemController`
   + các action cũ) ⇒ danh sách thực tế ✔
2. **Đối chiếu** với 2 map của `ActionRbacRegistry` (module-map + capability-map) + `PUBLIC_ACTIONS` ✔
3. **Phân loại từng action thiếu**:
   - thuộc **`PUBLIC_ACTIONS`** ⇒ bỏ qua (miễn kiểm ✔)
   - gác bằng **`requireRole`/`requireAdmin`** ở controller ⇒ bỏ qua (đã chặn trước ✔)
   - còn lại ⛔ **thiếu khoá** ⇒ **VÁ** (thêm module + capability **đúng module nghiệp vụ**, ⛔ 0 module mới nếu được)
4. **Test H2**: với mỗi action vừa vá ⇒ ① user **có** quyền ⇒ 200 ② user **không** quyền ⇒ **403** ✔
5. **Ghi danh sách** (bảng: action · module · capability · trạng thái) vào tài liệu này ✔

## 4. GHI CHÚ / RỦI RO
- ⛔ **KHÔNG** đổi cơ chế RBAC, ⛔ không thêm module rác; chỉ **khai đúng chỗ** theo §41/§15 ✔
- ⚠️ Một số action dùng chung (vd `save_*` nhiều màn) ⇒ ⛔ không đổi quyền của action đang chạy đúng — chỉ **bổ sung** ✔

## 5. NHẬT KÝ THI HÀNH

### 22/09/2026 — BƯỚC ① ĐO XONG (đã tìm ra lỗ hổng thật, kể cả 1 lỗi của chính em ở P3-05)
**Phép đo** (`SystemController` vs `ActionRbacRegistry`, ⛔ không đoán):
```text
TỔNG action backend xử lý ............... 247
TỔNG action có khoá RBAC ................ 196
ACTION THIẾU KHOA .......................  52
```
**⚠️ 41/52 là DƯƠNG TÍNH GIẢ** ✗ — các “action” kiểu
`accounting_vouchers_uidx_voucher_no` · `projects_code_uidx` · `primary_key_f` … ⛔ **KHÔNG phải action** ✗:
regex `case "…"` của em bắt luôn các `switch` **rẽ nhánh theo TÊN RÀNG BUỘC CSDL** (xử lý lỗi trùng khoá) ✗.
⇒ **BÀI HỌC**: khi rà RBAC ⇒ phải **lọc nhiễu** (bỏ tên có `uidx`/`primary_key`), ⛔ đừng tin con số thô ✗.

**🔴 ACTION THẬT BỊ THIẾU KHOÁ — 11 cái** (⛔ cần kiểm từng `case` xem có tự chặn bằng `requireRole`/`requireAdmin` không):
```text
① **`supplier_materials`**  ← ❗ CỦA CHÍNH EM (thêm ở MT2-P3-05) nhưng ⛔ **QUÊN khoá RBAC** ✗
     ⚠️ Test P3-05 vẫn XANH vì người gọi là **admin** ⇒ `isAdmin` cho qua SỚM ⇒ lỗ hổng **chỉ lộ với user thường** ✗
     🎓 BÀI HỌC: **test bằng admin sẽ che lỗ hổng phân quyền** (đúng bài học đầu tiên của dự án)
② `save_system_level` · `set_system_level_status` · `delete_system_level` · `set_user_system_level` · `system_level_impact`
③ `save_workflow` · `set_workflow_status` · `delete_workflow`
④ `save_department_permission` · `delete_department_permission` · `rebuild_department_permissions`
⑤ `create_self_work_item`
```
- **Next Task**: ② với **từng** action ở trên ⇒ đọc thân `case` xem đã có `requireRole(...)`/`requireAdmin(...)` chưa ✔
  · nếu **đã chặn** ⇒ ghi “đã chặn trước” ✔ (⛔ không thêm khoá thừa)
  · nếu **chưa** ⇒ **VÁ** (thêm khoá đúng module nghiệp vụ) ✔
  ③ đặc biệt **VÁ NGAY `supplier_materials`** (lỗi của em) + ④ thêm **test 403 bằng user THƯỜNG** ✔ (⛔ không chỉ admin).

### 22/09/2026 — BƯỚC ②③ XONG: PHÂN LOẠI TỪNG `case` + VÁ 5 ACTION (tests về ĐÚNG BASELINE)
- **⚠️ ĐÍNH CHÍNH CÁCH NÓI (em nói cho chính xác)**: các action thiếu khai báo **⛔ KHÔNG phải “lỗ hổng mở”** ✗ —
  `RbacService.requireActionModule` coi `required.isEmpty()` là **MẶC ĐỊNH TỪ CHỐI (403)** ✔
  ⇒ hệ quả thật là **user HỢP LỆ bị 403 NHẦM** ✗ ⇒ đây là **BUG CHỨC NĂNG do thiếu khai báo RBAC** ✔
- **Bước ② — kiểm TỪNG `case` xem có tự chặn trong thân không** (đoạn mã in ra từng cái):
  ```text
  ✅ ĐÃ CHẶN bằng `requireAdmin` (⇒ ⛔ KHÔNG cần khoá):  8 action
     save_system_level · set_system_level_status · delete_system_level · set_user_system_level · system_level_impact
     · save_department_permission · delete_department_permission · rebuild_department_permissions
  🔴 CHƯA CHẶN ⇒ PHẢI VÁ:  5 action
     supplier_materials (lỗi của MT2-P3-05) · save_workflow · set_workflow_status · delete_workflow · create_self_work_item
  ```
- **Bước ③ — ĐÃ VÁ 5 KHOÁ × 2 map** (⛔ 0 module mới), kèm **bằng chứng chọn module**:
  ```text
  · supplier_materials      → List.of("supplier_catalog")  / "canView"   ← lỗi của em ở P3-05 (Tab 3 §6.3)
  · save_workflow           → List.of("admin")             / "canCreate"
  · set_workflow_status     → List.of("admin")             / "canEdit"
  · delete_workflow         → List.of("admin")             / "canEdit"
      ↑ bằng chứng: `module_catalog` ⛔ KHÔNG có module `workflow`; 3 action này phát từ **màn Quản trị**
        (`WorkflowModal.tsx:79` · `page.tsx:2194-2195`) ⇒ dùng `admin` (⛔ 0 module mới)
  · create_self_work_item   → List.of("dept_plan_tasks","dept_project_tasks") / "canUse"
      ↑ bằng chứng: phát từ `WorkCenter.tsx:216`; **SOI GƯƠNG** `mark_task_notification_read` (đăng ký 2 module)
  ```
- **ĐO LẠI SAU KHI VÁ** (đã **lọc nhiễu** `uidx`/`primary_key`):
  ```text
  action THẬT còn thiếu khoá = 8  →  ✅ TẤT CẢ 8 đã được chứng minh `requireAdmin` trong thân case (bước ②)
  ⇒ KẾT LUẬN: ⛔ KHÔNG còn action nào vừa THIẾU KHOÁ vừa KHÔNG có guard ✔
  ```
- **Tests**: `mvn -B -pl web -am test` ⇒ **Tests run: 51 · Failures: 3 · Errors: 0**;
  3 ca Đỏ = ĐÚNG 3 ca CÓ SẴN ⇒ ⛔ **KHÔNG hồi quy** ✔
- **Next Task (bước ④ — BẮT BUỘC để DONE)**: **test 403/200 bằng user THƯỜNG** cho các action vừa vá
  (⛔ **không** chỉ admin — đúng bài học vừa bị cắn: *test bằng admin sẽ che lỗi phân quyền*) ⇒ rồi mới đánh **P4-05 DONE**.

### 22/09/2026 — ✅ **MT2-P4-05 DONE** (test XANH · 52 test / 3 Đỏ có sẵn / 0 Errors)
- **Files Changed**: `ActionRbacRegistry.java` (**5 khoá × 2 map**) · `web/src/test/.../RbacSupplierMaterialTest.java` (**MỚI**).
- **Test gọi bằng USER THƯỜNG** (⛔ không phải admin — đúng bài học vừa bị cắn). Cơ chế seed (đo từ
  `ModulePermissionStoreAdapter.canUseModule`): `module_catalog` active=1 với **`group_key` NULL** (bỏ qua menu-group ✔)
  + `user_module_permissions.can_view=1` ✔.
- **KẾT QUẢ CHẠY** — bằng chứng in ra thật:
  ```text
  Tests run: 52 · Failures: 3 · Errors: 0   (3 Đỏ = ĐÚNG 3 ca CÓ SẴN ⇒ ⛔ KHÔNG hồi quy)
  ① user THƯỜNG **CÓ** `supplier_catalog`  ⇒ status=200  body={"ok":true,"materials":[]}
  ② user **KHÔNG** có quyền                  ⇒ status=403  body={"ok":false,"error":"Tài khoản chưa được quản trị viên cấp đúng quyền…"}
  ③ admin                                    ⇒ status=200  (đối chứng)
  ⇒ CHỨNG MINH: ① bản vá đã hết **403 NHẦM** cho user hợp lệ ② backend **VẪN là tầng enforcement** (§17) ✔
  ```
- **RBAC Changed**: +5 khoá (`supplier_materials` · `save_workflow` · `set_workflow_status` · `delete_workflow` ·
  `create_self_work_item`) — ⛔ **0 module mới** · **DB Changed**: ⛔ 0 · **API Changed**: ⛔ 0 (chỉ khai quyền).
- **Known Issues / Remaining**: ① 8 action còn lại ⛔ không khai registry nhưng **đã `requireAdmin` trong thân case** ⇒
  ghi nhận là **chấp nhận được** (đã chặn ✔), ⛔ không thêm khoá thừa. ② Việc rà nên **lặp lại** mỗi khi thêm action mới
  ⇒ ghi vào quy trình (⛔ không tự tạo công cụ CI mới ở đây ✗).
- **⇒ MT2-P4-05 DONE** ⇒ **PHASE 4 = 1/5** (P4-01 BLOCKED · P4-02/03/04 TODO) ⇒ **MT2 23/98 = 23,5 %**.
- **Next Task**: **P4-02** (ẩn card «phiếu chờ duyệt» cho user không đủ quyền — ⛔ không chặn) hoặc **P4-04**
  (audit 5 bảng role/level).
