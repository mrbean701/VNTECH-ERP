# MT2-P3-01 — NOTIFICATION SERVICE (kiến trúc §15.1)

> Trạng thái: **IN_PROGRESS — audit xong, chưa code**
> Phase: **PHASE 3 — BACKEND SERVICE & API** (MT2) · Ngày audit: 22/09/2026

## 1. YÊU CẦU — NGUYÊN VĂN MT2 (`docs/dsh/MASTER_TASK_2.md`)

**§15.1 (dòng 292-295) — KIẾN TRÚC BẮT BUỘC:**
```text
⛔ Không tạo logic notification rải rác trong từng page. Ưu tiên:
Business Event → Notification Service → Notification Rule → Recipient Resolver
              → Web/Email → Notification Log → Read/Delivery Status
```
**§13.2 (dòng 256-257)** — Create notification: *Loại (**Web**/**Email**) · Tên · Mã · Nội dung · Người nhận ·
Thời gian gửi · **Thời gian kết thúc (đối với Web)**.*
**§14 (dòng 270-278)** — Web: *Login → Check notifications by userID → **Check active period** → Display system
notification modal.* · *Phải lưu trạng thái theo **userID + notificationID** ⇒ ⛔ không đánh dấu đọc global.* ·
*Mỗi notification có «Đánh dấu đã đọc» + «Đánh dấu tất cả đã đọc». Trạng thái **theo user**.*

## 2. HIỆN TRẠNG (bằng chứng đọc mã — ⛔ không suy đoán)

| Hạng mục | Bằng chứng | Kết luận |
|---|---|---|
| `task_notifications` | `OpsTaskStore:29` · `OpsTaskStoreAdapter:156/175/177` · `BootstrapDataAdapter:1580` | CHỈ là **hàng đợi in-app gắn `work_item_id`** (khác hẳn cấu hình §13.2) |
| Action hiện có | `ActionRbacRegistry:116` `mark_task_notification_read → dept_plan_tasks/dept_project_tasks` · `:324 → canView` | chỉ đánh dấu đọc của THÔNG BÁO CÔNG VIỆC |
| Email | `OpsTaskManagementUseCase:119-131` có ghi `email_outbox` khi người nhận có email | có hạ tầng gửi email, ⛔ không có engine theo rule |
| **NotificationService / Rule / RecipientResolver / NotificationLog** | ⛔ **0 tệp** | **THIẾU TOÀN BỘ kiến trúc §15.1** |
| Bảng cấu hình + trạng thái theo user | **ĐÃ CÓ từ MT2-P1-04/P1-05 (V25-V26)**: `notification_configs` (11 trường §13.2) · `notification_config_targets` (polymorphic user/department/project) · `notification_user_states` (`read_at`·`snooze_until`·`delivered_at`, UNIQUE `config_id+user_id`) | **nền dữ liệu ĐÃ SẴN ⇒ ⛔ không cần migration mới** |

⇒ **GAP**: thiếu **tầng nghiệp vụ** (service + rule + resolver + log); **dữ liệu đã sẵn** ✔.

## 3. KẾ HOẠCH (đúng thứ tự pipeline §15.1 · §15 REUSE · ⛔ không tạo bảng mới)

1. **Use-case mới** `NotificationManagementUseCase` (application/service) — ⛔ KHÔNG nhét logic vào page/từng use-case khác:
   - **Service** `dispatch(eventKey, payload)` = cửa DUY NHẤT cho mọi business event ⇒ tra `notification_configs` đang `active`,
     kiểm **cửa sổ hiệu lực** (`send_at <= now` và (`end_at` IS NULL OR `now < end_at`)) — đúng §14 «Check active period».
   - **Rule** = chính `notification_configs` (`channel` web|email, `recipient_mode`) ⇒ ⛔ không hard-code luật trong code.
   - **Recipient Resolver** = đọc `notification_config_targets` theo `recipient_mode`:
     `all` → mọi user đang hoạt động · `user`/`users` → `target_id` · `department` → user thuộc phòng · `project` → user
     thuộc phạm vi dự án (dùng `user_project_scopes`) ⇒ trả danh sách `user_id` ⛔ KHÔNG bịa người nhận.
   - **Log + Read/Delivery** = ghi `notification_user_states` (UPSERT theo `config_id+user_id`: `delivered_at`) ✔;
     kênh **email** ⇒ ghi `email_outbox` bằng hạ tầng SẴN CÓ (khuôn `OpsTaskManagementUseCase:119-131`) ⛔ không tự viết SMTP.
2. **Actions mới** (RBAC dùng lại module `approvals`/`dept_plan_tasks`? ⇒ **audit thêm trước khi chốt**):
   `save_notification_config` · `set_notification_config_status` · `mark_notification_read` ·
   `mark_notification_snooze` (§14: «Đánh dấu tất cả đã đọc» = lặp theo user, ⛔ không global).
3. **Bootstrap**: trả **thông báo ĐANG hiệu lực của CHÍNH user** (đã trừ `read_at`/`snooze_until`) để UI mở modal sau login (§14) —
   thêm trường mới, ⛔ không đổi cấu trúc trường cũ.
4. **SystemController**: các `case` tương ứng (khuôn action hiện có).
5. **Test H2 ĐỎ→XANH**: ① chỉ user trong `recipient_mode` nhận được · ② `end_at` quá khứ ⇒ ⛔ không hiện (active period) ·
   ③ đánh dấu đọc của user A ⛔ KHÔNG ảnh hưởng user B (đúng §14) · ④ kênh email ⇒ có dòng `email_outbox`.

## 4. GHI CHÚ / RỦI RO
- ⛔ **KHÔNG** sửa/xoá `task_notifications` (đang phục vụ luồng công việc) — hai cơ chế **song song**, ⛔ không gộp.
- ⚠️ Trước khi thêm action mới phải **audit module/capability** trong `ActionRbacRegistry` để ⛔ không tạo module rác.
- ⚠️ `notification_config_targets.target_id` là **polymorphic** (user/department/project) ⇒ resolver phải kiểm `target_type`.

## 5. VIỆC KẾ TIẾP
- Bước 1 (service + rule + resolver + log) → 2 (actions + RBAC) → 3 (bootstrap) → 4 (controller) → 5 (test).

## 6. NHẬT KÝ THI HÀNH

### 22/09/2026 — BƯỚC ① XONG (compile sạch)
- **Files Changed (3 tệp MỚI)**:
  - `application/.../port/out/NotificationStore.java` — cổng dữ liệu (Rule · Resolver · Log · Read/Delivery).
  - `application/.../service/NotificationManagementUseCase.java` — **Notification Engine**:
    `dispatch(eventKey)` (SERVICE) · `resolveRecipients(config)` (RESOLVER theo `recipient_mode`) ·
    `saveConfig`/`setConfigActive` (§13.2 CRUD) · `notificationsForUser`/`markRead`/`markAllRead`/`snooze` (§14/§48).
  - `infrastructure/.../persistence/NotificationStoreAdapter.java` — JDBC trên 3 bảng **V26**.
- **API Changed**: ⛔ chưa (bước ②④ mới nối vào `SystemController`).
- **DB Changed**: ⛔ **KHÔNG** — dùng đúng `notification_configs` · `notification_config_targets` ·
  `notification_user_states` (đã tạo ở MT2-P1-04/P1-05, migration **V26**) ⇒ ⛔ 0 migration mới.
- **RBAC Changed**: ⛔ chưa (bước ②).
- **Workflow Changed**: ⛔ không — thông báo **không** tạo vòng duyệt nào.
- **Phạm vi vòng này**: **kênh WEB trọn vẹn** theo §13.2 + §14 (hiển thị sau login · đọc THEO TỪNG user ·
  «đánh dấu tất cả đã đọc» cho CHÍNH user · tạm ẩn «không nhắc lại»). Kênh **EMAIL** tách **MT2-P3-01b**
  vì phải **audit bảng `email_outbox`** trước khi ghi (⛔ không đoán cột — bài học P3-09).
- **Tuân thủ 2 bài học H2 đã trả giá** (ghi thẳng trong chú thích tệp adapter):
  ① ⛔ KHÔNG `INSERT … ON DUPLICATE KEY UPDATE` (MySQL-only) ⇒ UPSERT = **UPDATE trước, 0 dòng thì INSERT**;
  ② ⛔ KHÔNG subquery `ORDER BY … LIMIT` trong danh sách chọn ⇒ chỉ JOIN/LEFT JOIN + **alias TRÍCH DẪN**.
  Ngoài ra `recipient_mode` được **kiểm bằng whitelist** (`all|user|users|department|project`) ⇒ ⛔ không nhận giá trị lạ.
- **Tests**: `mvn -B -pl infrastructure -am compile` ⇒ Clean Architecture · Domain · **Application SUCCESS** ·
  **Infrastructure SUCCESS** · EXIT = 0 ✔ (⛔ chưa có test HÀNH VI — bước ⑤).
- **Known Issues**: ① màn Quản trị (§13.1) cần UI + action (bước ②) ② EMAIL chờ `MT2-P3-01b`
  ③ `users.department` là **tên phòng dạng text** (không phải mã) ⇒ resolver theo phòng dùng đúng cột đó.
- **Next Task**: bước ② actions (`save_notification_config` · `set_notification_config_status` ·
  `mark_notification_read` · `mark_notification_snooze`) + **audit RBAC trước khi thêm khoá**.

### 22/09/2026 — BƯỚC ②(a) XONG: WIRING + CHỐT ĐƯỢC CÁCH GÁC QUYỀN (compile 5/5 module)
- **Files Changed**: `web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java` — thêm `@Bean`
  `notificationManagementUseCase(NotificationStore, IdGenerator)`.
- **🔑 PHÁT HIỆN QUAN TRỌNG (audit, ⛔ không đoán)**: các use-case của dự án **KHÔNG dùng `@Service`** mà
  được wire bằng **`@Bean` trong `ApplicationBeansConfig`** (hiện ở `web/.../web/config/`) ⇒ ⛔ quên đăng ký
  `@Bean` thì Spring **không inject** được vào `SystemController`. (Em đã suýt mắc — đã kiểm trước khi viết.)
- **🔑 CHỐT ĐƯỢC CÁCH GÁC QUYỀN** (đo `module_catalog` + đọc mẫu registry):
  - `module_catalog` **KHÔNG có module thông báo**; chỉ có `admin` (Danh mục & phân quyền · active=1) và `approvals`.
  - Registry **có mẫu `List.of()` rỗng** = **không gác module** (vd `bulk_import_projects`, `request_license_transfer`)
    — dùng cho thao tác **mọi user đã đăng nhập** đều làm được.
  - ⇒ **QUYẾT ĐỊNH (⛔ 0 module mới — tránh rác danh mục)**:
    · `save_notification_config` · `set_notification_config_status` → module **`admin`** (đúng MT2 §13.1: tab Thông báo **trong màn Quản trị**).
    · `mark_notification_read` · `mark_notification_snooze` → **`List.of()` rỗng** (MT2 §14: MỌI user có thông báo của chính mình).
- **Tests**: `mvn -B -pl web -am compile` ⇒ Clean Architecture · Domain · Application · Infrastructure ·
  **Web** đều **SUCCESS** · EXIT = 0 ✔ (bean đã nối đúng).
- **Next Task**: bước ②(b) — thêm 4 khoá vào `ActionRbacRegistry` (2 khoá + capability cho `admin`,
  2 khoá mọi-user) + 4 `case` trong `SystemController` + audit nhánh "action không có khoá ⇒ 403".

### 22/09/2026 — BƯỚC ② XONG (RBAC + API + wiring) — compile 5/5, test về ĐÚNG BASELINE
- **Files Changed**: `ActionRbacRegistry.java` (**5 khoá**: module-map + capability-map) ·
  `SystemController.java` (field + tham số hàm khởi tạo + gán + **5 `case`**).
- **API Changed**: **CÓ** — 5 action mới:
  `save_notification_config` (`name`·`code`·`channel` chứ không phải `recipientMode`·`content`·`sendAt`·`endAt`·`targets[]`) ·
  `set_notification_config_status` (`configId`·`active`) · `mark_notification_read` (`configId`) ·
  `mark_notification_all_read` (không tham số) · `mark_notification_snooze` (`configId`·`snoozeUntil` tuỳ chọn).
- **RBAC Changed**: 5 khoá — `save_notification_config → admin/canCreate` ·
  `set_notification_config_status → admin/canEdit` · `mark_notification_read` · `mark_notification_snooze` ·
  `mark_notification_all_read` → **`List.of()`** (không gác module) + capability `canView`.
  ⛔ **0 module mới** trong `module_catalog`.
- **🔑 AUDIT ĐÃ TRẢ TIỀN (⛔ không đoán)**: `AuthUseCase.CurrentUser` là **`record`** với accessor
  `cu.id()` · `cu.role()` · `cu.fullName()` — ⛔ **KHÔNG có** `cu.userId()` ⇒ dùng `cu.id()` ✔.
  Và: **nhánh đọc**: hành động phải có khoá trong registry, nếu thiếu ⇒ **403** (đã từng bị ở `approve_po`/
  `reject_po`/`update_po_price` — ghi trong memory dự án) ⇒ nên 5 action đều **đã đăng ký** ✔.
- **Bảo mật (MT2 §17 — backend là enforcement)**: mọi thao tác đọc/nhắc lại dùng **`cu.id()` của CHÍNH người gọi**
  ⇒ ⛔ **không** cho phép thao tác lên user khác (đúng §14 «trạng thái theo user»).
- **Tests**: `mvn -B -pl web -am test` ⇒ **Tests run: 44 · Failures: 3 · Errors: 0**;
  3 ca Đỏ = **ĐÚNG 3 ca CÓ SẴN** `ProductionRoleCounterProofTest` ⇒ ⛔ **KHÔNG hồi quy** ✔
  (5/5 module compile SUCCESS; nhánh `Web FAILURE` chỉ là 3 ca có sẵn đó).
- **Next Task**: bước ③ — bootstrap trả **thông báo ĐANG hiệu lực của CHÍNH user** (đã trừ `read_at`/`snooze_until`)
  cho modal sau login (§14) ⇒ rồi ⑤ test H2 ĐỎ→XANH.

### 22/09/2026 — BƯỚC ③ XONG (bootstrap §14) — test về ĐÚNG BASELINE, ⛔ 0 lỗi SQL
- **Files Changed**: `infrastructure/.../persistence/BootstrapDataAdapter.java` — thêm `data.put("systemNotifications", query(...))`
  ngay sau khối `taskNotifications` (giữ nguyên khối cũ — ⛔ KHÔNG đụng `task_notifications`).
- **API Changed**: **CÓ** — payload bootstrap (`GET /api/system`) có thêm trường **`systemNotifications`**
  (`configId` · `code` · `name` · `content` · `sendAt` · `endAt` · `readAt` · `snoozeUntil` · `deliveredAt`).
- **Truy vấn (đúng §14 «Login → Check by userID → Check active period → Display modal»)**:
  `notification_configs c LEFT JOIN notification_user_states s ON s.config_id=c.id AND s.user_id=?`
  lọc `c.active=1` · `c.channel='web'` · `(send_at IS NULL OR send_at<=CURRENT_TIMESTAMP)` ·
  `(end_at IS NULL OR end_at>CURRENT_TIMESTAMP)` · `s.read_at IS NULL` ·
  `(s.snooze_until IS NULL OR snooze_until<=CURRENT_TIMESTAMP)` ⇒ **CHỈ của chính `ctx.userId()`**.
- **⛔ Áp dụng bài học H2**: KHÔNG subquery `ORDER BY … LIMIT` trong danh sách chọn; dùng `CURRENT_TIMESTAMP`
  (chạy đúng ở CẢ MySQL và H2) thay vì truyền tham số thời gian; alias **camelCase unquoted** theo đúng
  quy ước của chính tệp này (khối `taskNotifications` cạnh bên cũng vậy).
- **Tests**: `mvn -B -pl web -am test` ⇒ **Tests run: 44 · Failures: 3 · Errors: 0**;
  **⛔ KHÔNG có `JdbcSQL`/`BadSqlGrammar`** ⇒ truy vấn mới **chạy đúng trên H2** (bootstrap được gọi trong
  nhiều test ⇒ đây là **bằng chứng chạy thật**, ⛔ không phải suy luận) ✔;
  3 ca Đỏ = ĐÚNG 3 ca CÓ SẴN `ProductionRoleCounterProofTest` ⇒ ⛔ không hồi quy ✔.
- **Next Task**: bước ⑤ — **test H2 ĐỎ→XANH** cho hành vi: ① đúng người nhận theo `recipient_mode`
  (`all`/`user`/`department`/`project`) ② `end_at` quá khứ ⇒ ⛔ KHÔNG xuất hiện ③ đánh dấu đọc của user A
  ⛔ KHÔNG ảnh hưởng user B ④ thiếu quyền với action `admin` ⇒ **403**.

### 22/09/2026 — BƯỚC ⑤ XONG ⇒ **MT2-P3-01 DONE** (test bắt được **2 LỖI THẬT** của em)
- **Files Changed**: `web/src/test/.../NotificationCenterTest.java` (**MỚI**) ·
  `BootstrapDataAdapter.java` (sửa truy vấn `systemNotifications`) · `RbacService.java` (thêm 3 action vào `PUBLIC_ACTIONS`).
- 🔴 **LỖI #1 (test bắt)**: truy vấn bootstrap chỉ lọc `active/channel/cửa sổ/đã đọc/tạm ẩn` mà
  ⛔ **KHÔNG kiểm NGƯỜI NHẬN** ⇒ **mọi user thấy mọi cấu hình web** ✗ — đúng lỗi §13.2 mà test nhắm bắt.
  ⇒ Đã sửa: thêm `LEFT JOIN notification_config_targets` khớp theo
  `recipient_mode` (`user` → `target_id = userId` · `department` → phòng của user · `project` → dự án của user)
  + điều kiện `AND (c.recipient_mode='all' OR t.id IS NOT NULL)` ⇒ ⛔ **không gửi cho người ngoài cấu hình**.
- 🔴 **LỖI #2 (test bắt)** — **VÀ NÓ BÁC BỎ MỘT KẾT LUẬN SAI CỦA CHÍNH EM Ở BƯỚC ②**:
  em từng kết luận *“`Map.entry(action, List.of())` = KHÔNG gác module”* ⇒ **SAI** ✗.
  Đọc `RbacService.requireActionModule` (`application/rbac/RbacService.java:45-66`) thấy rõ:
  ```text
  (1) PUBLIC_ACTIONS allowlist ⇒ miễn kiểm   (2) isAdmin ⇒ qua
  (3) isCompanyLeadership (director/accountant) và action KHÔNG thuộc module `admin` ⇒ qua
  (4) required.isEmpty()  ⇒ **NÉM 403** «Thao tác chưa được khai báo quyền»  ← MẶC ĐỊNH TỪ CHỐI
  (5) còn lại: cần `user_module_permissions.can_<capability>=1` trên module active
  ```
  ⇒ **`List.of()` = MẶC ĐỊNH TỪ CHỐI (403)**, ⛔ không phải “không gác” ✗ ⇒ 3 action đọc/nhắc lại của user
  đã được chuyển đúng chỗ: **`PUBLIC_ACTIONS`** — cùng nhóm với `change_password`/`logout` vì lý do chính
  tệp đó ghi (`:32-34`): *“việc TỰ PHỤC VỤ của chính người dùng: nếu bắt buộc phải có quyền module thì một
  tài khoản **bị thu hồi hết quyền cũng không thể**…”* — đúng y hệt thông báo cá nhân (MT2 §14).
  📌 **Kết luận này đã được ghi vào MEMORY dự án** để ⛔ không lặp lại sai sót.
- **Tests**: `mvn -B -pl web -am test` ⇒ **Tests run: 45 · Failures: 3 · Errors: 0**;
  `NotificationCenterTest` **1 run · 0 failures · 0 errors** ✔; 3 ca Đỏ = ĐÚNG 3 ca CÓ SẴN ⇒ ⛔ không hồi quy ✔
  ⇒ **MT2-P3-01 DONE** (bước ①→⑤ ✔).
- **Known Issues / Remaining**: ① kênh **EMAIL** ⇒ **MT2-P3-01b** (phải audit `email_outbox` trước) ② UI màn
  Quản trị (tab Thông báo) + modal thông báo sau login ⇒ thuộc Phần UI/UX (Phase 6/12).
- **Next Task**: **MT2-P3-02/03** (API config đầy đủ + read-state) hoặc sang **MT2-P3-04** (chữ ký user).

### 22/09/2026 — DEPLOY LIVE + AUDIT `MT2-P3-01b` (KÊNH EMAIL)
- **Deploy**: dừng Java THEO PID 5848 → `mvn package` **BUILD SUCCESS** → Java **PID 12360** ·
  Flyway *“validated 27 · up to date”* · 3 dịch vụ 200/200/200 ✔ ⇒ **P3-01 đã chạy trên hệ thống thật**.
- **AUDIT `email_outbox` (đo `information_schema` — ⛔ không đoán cột)**:
  ```text
  16 cột: id · request_id · stage · event · recipients · subject · text_body · html_body · status
          · attempt_count · next_attempt_at · queued_at · sent_at · last_error · created_at · updated_at
  NOT NULL (9): id · event · recipients · subject · text_body · html_body · queued_at · created_at · updated_at
  ⇒ `request_id` / `stage` ĐƯỢC PHÉP NULL ⇒ thông báo hệ thống (không gắn yêu cầu nào) ghi được ✔
  ```
- **HÀM GỬI SẴN CÓ ĐỂ REUSE (§15 — ⛔ không tự viết SMTP)**:
  `OpsTaskStore.insertEmailOutbox(Map mail, Instant now)` (dùng ở `OpsTaskManagementUseCase:188`, event `task_assigned`,
  status `queued`) ⇒ P3-01b sẽ **soi gương** đúng cách đó: thêm `insertNotificationEmail(...)` vào `NotificationStore`
  + `emailOf(userId)` để lấy địa chỉ người nhận, rồi gọi trong `dispatch` khi `channel='email'`.
- 🐞 **PHÁT HIỆN THÊM (bug CÓ SẴN, ngoài phạm vi P3-01b)** — chú thích `BootstrapDataAdapter:975-977` (TASK-069):
  `emailOutbox` là khoá **BẮT BUỘC** trong hợp đồng `AppData` của UI (`app/page.tsx:31`) nhưng
  ⛔ **KHÔNG một adapter Java nào khai nó** ⇒ màn «Hộp thư gửi» **LUÔN rỗng** dù `email_outbox` có dữ liệu ✗.
  ⇒ **ghi nhận** (⛔ không tự mở rộng phạm vi trong P3-01b; nếu cần thì tạo task riêng).
- **Next Task**: `MT2-P3-01b` — thêm `insertNotificationEmail` + `emailOf` vào port/adapter, nối vào `dispatch`
  cho `channel='email'`, và test H2 (kênh email ⇒ có dòng trong `email_outbox` với 9 cột NOT NULL).

### 22/09/2026 — `MT2-P3-01b` XONG (kênh EMAIL) ⇒ test XANH
- **Files Changed**: `NotificationStore.java` (+2 khai báo) · `NotificationStoreAdapter.java` (+2 cài đặt) ·
  `NotificationManagementUseCase.java` (**nhánh email** trong `dispatch`) · `NotificationCenterTest.java` (+1 test).
- **API Changed**: ⛔ không thêm action (email chạy qua **business event** `dispatch`, ⛔ không qua HTTP).
- **DB Changed**: ⛔ KHÔNG — ghi vào **`email_outbox` SẴN CÓ** (hàng đợi gửi của dự án).
- **Chi tiết**:
  · `emailOf(userId)` = `SELECT email FROM users WHERE id=?` (rỗng ⇒ ⛔ **bỏ qua**, không bịa địa chỉ).
  · `insertNotificationEmail(mail, now)` — **soi gương** `OpsTaskStoreAdapter.insertEmailOutbox`
    (⛔ KHÔNG tự gửi SMTP): `request_id=NULL` · `stage=NULL` · **`event='system_notification'`** (phân biệt với
    `task_assigned` của luồng CÔNG VIỆC) · `status='queued'` · `attempt_count=0` · `next_attempt_at=queued_at=now` ·
    `sent_at/last_error=NULL` ⇒ **đủ 9 cột NOT NULL**.
  · `dispatch`: nay rẽ nhánh theo `channel` — `web` ⇒ `notification_user_states`; `email` ⇒ `email_outbox`;
    kênh lạ ⇒ ⛔ bỏ qua.
- **⚠️ GIỚI HẠN TRUNG THỰC**: `dispatch` **CHƯA được nối vào business event nào** ⇒ nhánh email **hiện chưa có
  đường HTTP nào gọi tới** ✗ (việc nối từng sự kiện: PR duyệt · PO · giao hàng · GRN · giao việc… là **bước
  tích hợp riêng** theo MT2 §15) ⇒ test gọi **thẳng use-case** (bean thật) chứ ⛔ không qua HTTP.
- **Tests**: `mvn -B -pl web -am test` ⇒ **Tests run: 46 · Failures: 3 · Errors: 0**;
  `NotificationCenterTest` **2 runs · 0 failures · 0 errors** ✔ (đủ 2 ca: web + email);
  3 ca Đỏ = ĐÚNG 3 ca CÓ SẴN ⇒ ⛔ không hồi quy ✔; ⛔ không lỗi `JdbcSQL` ⇒ ghi `email_outbox` đúng cột ✔
  ⚠️ **LỖI EM TỰ GÂY & TỰ SỬA**: test mới dùng `Map` mà tệp ⛔ chưa import `java.util.Map` ⇒ `cannot find symbol` ⇒ đã thêm import ✔.
- **Next Task**: **MT2-P3-04** (chữ ký user) hoặc **P3-05** (vật tư NCC); và bước tích hợp business event → `dispatch`.
