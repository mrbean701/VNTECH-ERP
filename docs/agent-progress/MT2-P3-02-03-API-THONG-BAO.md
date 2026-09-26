# MT2-P3-02 / P3-03 — API CẤU HÌNH THÔNG BÁO (§13.1) + READ-STATE (§14)

> Trạng thái: **IN_PROGRESS — audit xong, chưa code**
> Phase: **PHASE 3 — BACKEND SERVICE & API** (MT2) · Ngày audit: 22/09/2026 · **task CUỐI của Phase 3**

## 1. YÊU CẦU — NGUYÊN VĂN MT2

**§13.1 (`docs/dsh/MASTER_TASK_2.md:253-254`)** — *«## 13.1. Tab THÔNG BÁO — Thêm tab **Thông báo** — cấu hình
thông báo cho user qua **Web hoặc Email**. Danh sách có **CRUD · Search · Sort · Filter**.»*
**§13.2** — Create notification: Loại (Web/Email) · Tên · Mã · Nội dung · Người nhận · Thời gian gửi · Thời gian kết thúc.
**§14** — Login → check by userID → active period → modal; **trạng thái đọc theo TỪNG user**.

## 2. HIỆN TRẠNG (bằng chứng đọc mã — ⛔ không suy đoán)

| Hạng mục | Bằng chứng | Kết luận |
|---|---|---|
| Create/Update | `NotificationManagementUseCase.saveConfig` **:114** | **CÓ** ✔ |
| Bật/tắt | `setConfigActive` **:160** | **CÓ** ✔ |
| Danh sách | port `NotificationStore.allConfigs()` **:28** — ⛔ **không use-case nào gọi** | ⛔ **THIẾU API list** ✗ |
| Xoá | port ⛔ **không có** `deleteConfig`; use-case ⛔ không có | ⛔ **THIẾU chữ D của CRUD** ✗ |
| Read-state (§14) | `markRead` **:182** · `markAllRead` **:191** · `snooze` **:200** | **CÓ** ✔ ⇒ **P3-03 ĐỦ** ✔ |
| API (controller) | `case` :1244 `save_notification_config` · :1248 `set_notification_config_status` · :1254/:1258/:1262 mark* | **CÓ 5 case** ✔, ⛔ thiếu list/delete ✗ |
| Dữ liệu | 3 bảng **V26** (`notification_configs` · `…_targets` · `…_user_states`) | nền **đã sẵn** ✔ ⇒ ⛔ 0 migration |

⇒ **KẾT LUẬN**:
- **P3-03 (read-state)**: **ĐÃ ĐỦ** ✔ — 3 action (`mark_notification_read` · `mark_notification_all_read` ·
  `mark_notification_snooze`) + bootstrap `systemNotifications` theo §14 (đã test XANH ở P3-01) ⇒ ⛔ không cần code thêm,
  chỉ cần **ghi nhận bằng chứng** ✔.
- **P3-02 (config API)**: còn **2 việc nhỏ** — **list** + **delete** (§13.1 ghi rõ **CRUD** ⇒ thiếu chữ **D** là thiếu sót thật ✗).

## 3. KẾ HOẠCH (⛔ 0 migration — 3 bảng V26 đã có)

1. **Port + adapter** (hàm MỚI, ⛔ không đổi chữ ký hàm cũ — bài học P3-04/P3-05):
   - `boolean deleteConfig(String configId)` — xoá cấu hình + **targets** của nó (bảng `notification_config_targets`
     đã có sẵn hàm `deleteConfigTargets` ✔ ⇒ dùng lại).
   ⚠️ `allConfigs()` **đã có** ⇒ ⛔ không thêm hàm list mới ở port.
2. **Use-case** `NotificationManagementUseCase`: thêm
   - `listConfigs()` ⇒ trả `store.allConfigs()` ✔ (⛔ không tự lọc/sắp xếp ở backend — §13.1 để **Search/Sort/Filter** ở UI ✔)
   - `deleteConfig(payload{configId})` ⇒ validate tồn tại rồi xoá targets + config ✔
3. **RBAC + API**: action `delete_notification_config` → module **`admin`** (đúng §13.1 «tab ở màn Quản trị» ✔);
   action **list** dùng lại `save_notification_config`? ⛔ **KHÔNG** — thêm **`notification_configs`** (đọc) → module `admin`
   ⚠️ **audit `ActionRbacRegistry` trước khi thêm khoá** (⛔ không đoán capability — P3-01/P3-05 đã đo).
4. **Test H2 ĐỎ→XANH** (⚠️ **seed đủ danh mục** — bài học P3-04):
   - ① tạo cấu hình qua `save_notification_config` ⇒ `list` thấy nó ✔
   - ② xoá ⇒ `list` **không còn** + `notification_config_targets` của nó **đã bị xoá** ✔ (⛔ không mồ côi)
   - ③ xoá id không tồn tại ⇒ **400** ✔
   - (P3-03: ghi nhận test đã có ở `NotificationCenterTest` ✔ — ⛔ không viết lại)

## 4. GHI CHÚ / RỦI RO
- ⛔ **KHÔNG** xoá `notification_user_states` khi xoá config — đó là **lịch sử đọc của user** ✗ (chỉ xoá `targets` ✔).
  ⚠️ Nếu FK/ORM đòi, phải kiểm trước — **audit**.
- ⛔ Không thêm bảng/cột · ⛔ không đụng `task_notifications`.

## 5. VIỆC KẾ TIẾP
1 (port `deleteConfig` + adapter) → 2 (use-case list/delete) → 3 (RBAC audit + 2 case) → 4 (test) ⇒ **đóng PHASE 3**.

## 6. NHẬT KÝ THI HÀNH

### 22/09/2026 — BƯỚC ①②③ XONG (compile 5/5 SUCCESS)
- **Files Changed**: `NotificationStore.java` (+`deleteConfig`) · `NotificationStoreAdapter.java` (+cài đặt) ·
  `NotificationManagementUseCase.java` (+`listConfigs` · +`deleteConfig`) · `ActionRbacRegistry.java` (**2 khoá × 2 map**) ·
  `SystemController.java` (**2 `case`**).
- **Chi tiết**:
  ```text
  · port  : boolean deleteConfig(String configId);
  · adapter (THUẦN THÊM): DELETE notification_config_targets WHERE config_id=?
                          DELETE notification_configs         WHERE id=?
            ⛔ **KHÔNG** xoá `notification_user_states` — đó là **lịch sử đọc của từng user** ✔
  · use-case: `listConfigs()` ⇒ `store.allConfigs()`  (Search/Sort/Filter do **UI** lo theo §13.1 ✔)
             `deleteConfig(payload)` ⇒ validate `configId` + tồn tại, ⛔ không xoá gì thêm
  · RBAC   : module-map `notification_configs` → List.of("admin") · `delete_notification_config` → List.of("admin")
             capability-map `notification_configs` → "canView" · `delete_notification_config` → "canEdit"
             (neo đo được: module-map `:50`, capability-map `:281` — ⛔ 0 module mới ✔)
  · API    : `case "notification_configs"` → { configs: […] } · `case "delete_notification_config"` → { message }
  ```
- **Tests**: `mvn -B -pl web -am compile` ⇒ Clean Architecture · Domain · Application · Infrastructure ·
  **Web** đều **SUCCESS** · EXIT = 0 ✔ (chỉ còn cảnh báo `unchecked` **có sẵn** ⛔ không liên quan).
- **Ghi nhận P3-03 (read-state)**: **ĐÃ ĐỦ** ✔ — 3 action (`mark_notification_read` :1254 ·
  `mark_notification_all_read` :1258 · `mark_notification_snooze` :1262) + bootstrap `systemNotifications` (§14)
  đã **test XANH** ở `NotificationCenterTest` (MT2-P3-01) ⇒ ⛔ không code thêm, chỉ ghi bằng chứng ✔.
- **Next Task**: ④ **test H2 ĐỎ→XANH** (⚠️ seed đủ danh mục — bài học P3-04):
  ① tạo cấu hình qua `save_notification_config` ⇒ `notification_configs` **thấy nó** ✔
  ② `delete_notification_config` ⇒ `notification_configs` **không còn** + **targets của nó đã bị xoá** ✔
  ③ xoá `configId` không tồn tại ⇒ **400** ✔ ⇒ đạt ⇒ **P3-02 DONE** ⇒ **PHASE 3 HOÀN TẤT 10/10**.

### 22/09/2026 — ✅ **MT2-P3-02 DONE** (test XANH · 51 test / 3 Đỏ có sẵn / 0 Errors) ⇒ **PHASE 3 XONG 10/10**
- **Files Changed (cuối)**: `NotificationCenterTest.java` (+1 ca 5 bước) ·
  `NotificationManagementUseCase.java` (**sửa 1 BUG THẬT** — xem dưới).
- **🔴 BUG THẬT DO TEST BẮT ĐƯỢC (đã sửa)**:
  ```text
  Helper `Api(...)` của `NotificationManagementUseCase` (em viết ở MT2-P3-01) trả **`IllegalArgumentException`**
     ⇒ ném RA NGOÀI luồng xử lý API ⇒ Spring trả **500 (ServletException)** thay vì **400** ✗
     ⚠️ Ảnh hưởng **CẢ 3 action validate** của lớp này (save · delete · snooze) ✗
  ✅ ĐÃ SỬA: trả **`AuthUseCase.ApiError(message, 400)`** — đúng quy ước dự án (`SupplierManagementUseCase.Api`
     · `StockManagementUseCase` cũng vậy) ⇒ mọi validate nay trả **400** ✔
  🎓 BÀI HỌC: hành vi validate phải được **TEST bằng id sai** (em chỉ phát hiện vì test cố tình gọi id lạ ✔)
  ```
- **Ca test kiểm 5 điều** (`danhSachVaXoaCauHinhThongBao_khongDeMocCoi`):
  ```text
  ① TẠO cấu hình (kèm 1 target) ⇒ CSDL có 1 target ✔
  ② **R** — `notification_configs` thấy `NC_LIST_1` ✔ (in ra: {"ok":true,"configs":[{…,"code":"NC_LIST_1"…}]})
  ③ **D** — xoá ⇒ `notification_configs` **0 dòng** + `notification_config_targets` **0 dòng** (⛔ không mồ côi) ✔
     + danh sách sau khi xoá ⛔ KHÔNG còn ✔
  ④ xoá `configId` lạ ⇒ **400** (sau khi sửa bug) ✔
  ⑤ ⛔ KHÔNG xoá `notification_user_states` (lịch sử đọc của user) — bảng còn nguyên ✔
  ```
- **KẾT QUẢ CHẠY**: `mvn -B -pl web -am test` ⇒ **Tests run: 51 · Failures: 3 · Errors: 0** ·
  `NotificationCenterTest` **3 runs · 0 failures · 0 errors** ✔ ·
  3 ca Đỏ = ĐÚNG 3 ca CÓ SẴN ⇒ ⛔ **KHÔNG hồi quy** ✔
- **⚠️ LỖI EM TỰ GÂY trong test (đã sửa)**: viết `adminCookie` nhưng lớp `NotificationCenterTest` ⛔ **không có field đó** ✗
  (chỉ login `nc.a`/`nc.b`) ⇒ phải **login admin cục bộ** vì 2 action gác module **`admin`** ✔
- **✅ P3-03 (read-state)**: **ĐÃ ĐỦ** ✔ (3 action + bootstrap §14 đã test XANH ở P3-01) — ghi nhận, ⛔ không code thêm.
- **⇒ MT2-P3-02 DONE · PHASE 3 HOÀN TẤT 10/10** (P3-01 · P3-01b · P3-02 · P3-03 · P3-04 · P3-05 · P3-06 · P3-06b · P3-07 · P3-08 · P3-09)
- **Next Task**: chuyển sang **PHASE 4** (RBAC theo chức danh) — ⚠️ **MT2-P4-01 đang BLOCKED** (BLK-01/BLK-02 chờ user)
  ⇒ chọn task Phase 4 khác hoặc **PHASE 2** (P2-04 DataTable · P2-05 tabs · P2-08 modal) / **PHASE 9 UI màn Kho**.
