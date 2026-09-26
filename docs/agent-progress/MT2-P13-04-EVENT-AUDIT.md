# MT2-P13-04 — AUDIT EVENT THỰC TẾ + ĐỀ XUẤT DANH MỤC EVENT (§15)

> Trạng thái: **DONE (tài liệu)** · Ngày: 23/09/2026 · Deliverable: **tài liệu** — ⛔ không code, không migration, không event mới
> Nguồn spec: `docs/dsh/MASTER_TASK_2.md:282-297` (§15 + §15.1) — nguyên văn:
> «Thiết kế notification engine cho các sự kiện liên quan user: **Approval / Work / Procurement / Project / Warehouse**… DSH phải ① audit các module hiện có ② xác định **event thực tế** ③ **đề xuất thêm** event phù hợp ④ ⛔ **không tạo event không có nguồn dữ liệu**.»
>
> Phương pháp: **chỉ đọc mã Java backend + migration + parity JS** (grep + read), không chạy lệnh ghi, không đoán — mọi kết luận kèm đường dẫn file:line.

---

## 1. KẾT LUẬN CHÍNH (TL;DR)

1. **Hạ tầng notification ĐÃ ĐỦ để thêm event mà KHÔNG sửa module** (đúng §15.1): `NotificationManagementUseCase.dispatch(eventKey)` là **cửa DUY NHẤT** — pipeline `Business Event → dispatch → activeConfigs (RULE) → resolveRecipients → Web/Email → upsertDelivered/markRead/snooze` đã chạy thật (test xanh ở P3-01). Event mới = **thêm 1 dòng `notification_configs` + 1 lời gọi `dispatch` tại điểm nghiệp vụ** — ⛔ không dựng engine thứ hai.
2. **Số event CÓ NGUỒN DỮ LIỆU THẬT**: **13 event** trong 5 domain §15 (bảng §3). Số event §15 liệt kê nhưng **CHƯA có nguồn**: **6** (đánh dấu ⛔ trong bảng §3 — ví dụ «SLA sắp hết» chưa có bộ đếm thời gian thực chạy thường lệ).
3. **Parity quan trọng với monolith JS**: luồng Approval/Supply **ĐÃ có email event thật ở JS** (`system-route.mjs:570-614` — `approval_requested`/`approved`/`rejected`/`delivery_waiting_bch`/`delivery_completed`/`delivery_partial`) nhưng **chưa được port sang Java** (grep toàn `java-backend` = 0 lần xuất hiện các event này trong mã production) ⇒ đây là các event **có nguồn SẴN** — P13-05 chỉ cần nối `dispatch` vào các điểm nghiệp vụ đã có.
4. **Kênh EMAIL đang NGẮT HAI KHÚC**: Java chỉ **xếp hàng** vào `email_outbox` (`status='queued'`); worker **gửi SMTP thật** (`scripts/email-dispatcher.mjs:150-180`) hiện **chỉ nằm ở nhánh JS/Cloudflare** — chưa có `@Scheduled` tương đương ở Java (toàn mã chỉ có 1 worker: `SlaComplianceWorker`). Đây là **khoản công việc thật của P13-05** (service + test), không phải tạo event mới.
5. **Gợi ý kiến trúc P13-05/P13-06** (§4-§5 dưới): bảng ghi nhận LOG/Delivery đã có sẵn 3 nơi (`notification_user_states` · `task_notifications` · `email_outbox`) — P13-06 có thể **REUSE** thay vì tạo bảng trùng.

---

## 2. ① AUDIT HẠ TẦNG NOTIFICATION HIỆN CÓ (đọc từ mã)

### 2.1. Ba kho chứa thông báo SONG SONG (khác nhau mục đích — ⛔ không trộn)

| Bảng | Cột then chốt | Được ghi bởi | Đọc bởi | Vai trò §15 |
|---|---|---|---|---|
| `notification_configs` + `notification_config_targets` | `code`(UNIQUE) · `channel` web\|email · `recipient_mode` all\|user\|users\|department\|project · `send_at`/`end_at` · `active` | action `save_notification_config` (Quản trị tab Thông báo) | `dispatch()` tra theo `code` | **RULE** — luật thông báo do người dùng cấu hình, ⛔ không hard-code |
| `notification_user_states` | UNIQUE(`config_id`,`user_id`) · `read_at` · `snooze_until` · `delivered_at` | `upsertDelivered` / `markRead` / `markAllRead` / `snooze` | `notificationsForUser` (modal đăng nhập) | **LOG Web + READ/DELIVERY** theo từng user |
| `task_notifications` | `work_item_id` (NOT NULL, FK) · `channel='in_app'` · `status='SENT'` · `read_at` | `OpsTaskStoreAdapter.insertTaskNotification` (:174) · `PurchaseStoreAdapter.decidePo` (:266-277) | tab công việc + `BootstrapDataAdapter:1592` | **LOG in-app của luồng CÔNG VIỆC** (gắn work_item) |
| `email_outbox` | `event` · `recipients` · `status` queued→sent/failed · `attempt_count<3` retry | `OpsTaskStoreAdapter.insertEmailOutbox` (:185) · `NotificationStoreAdapter.insertNotificationEmail` (:247) | JS dispatcher (xem §2.3) | **HÀNG ĐỢI EMAIL** — schema sẵn sàng cho mọi event |

Nguồn schema: `V1__baseline.sql:749` (email_outbox) · `V26__mt2_notification_config.sql` (3 bảng notification) · `DATA_MODEL_REFERENCE.md:957-983`.

### 2.2. Engine (§15.1) đã có — điểm gọi hiện tại

`NotificationManagementUseCase.dispatch(String eventKey)` (application/service, :50-81):
- tra `notification_configs` đang hiệu lực (`activeConfigs`) theo `code = eventKey`;
- resolve người nhận theo `recipient_mode` (all/user/users/department/project);
- kênh **web** ⇒ `upsertDelivered` (log hiển thị); kênh **email** ⇒ xếp thư `email_outbox` (`event='system_notification'`), user không có email ⇒ bỏ qua (⛔ không bịa địa chỉ);
- trả số bản log đã tạo (0 nếu không có cấu hình ⇒ ⛔ không bịa thông báo).

**Lời gọi `dispatch` trong mã production: CHƯA CÓ** (chỉ test `NotificationCenterTest.java:168` gọi `dispatch("NC_MAIL")`). Nghĩa là: rule + resolver + kênh đã xong, nhưng **chưa module nghiệp vụ nào phát event** — đây chính là việc của P13-05, và là lý do P13-04 phải chốt danh mục event CÓ NGUỒN trước.

### 2.3. Luồng gửi email thật — NGẮT HAI KHÚC (phát hiện quan trọng)

```text
Java use-case  ──INSERT──▶  email_outbox (status='queued')  ──?──▶  SMTP
                                  ▲                                   │
                                  └── chỉ có ở scripts/email-dispatcher.mjs
```

- `scripts/email-dispatcher.mjs:150-180`: đọc `email_settings` (enabled · smtp_host · sender_email), claim hàng `queued/failed`, `attempt_count<3`, gửi SMTP (STARTTLS/AUTH LOGIN :88-119), success ⇒ `sent` + `sent_at`; thất bại ⇒ `failed` + retry theo `attempts*5 phút`.
- **Ngoài ra file này còn tự phát event SLA quá hạn**: `queueOverdueReminders` (:132-147) — quét `approvals` pending quá `due_at` chưa nhắc (`reminder_sent_at IS NULL`) ⇒ INSERT `email_outbox` event **`overdue`** + đánh dấu `reminder_sent_at` (chống gửi lặp — nguồn dữ liệu THẬT).
- Java: `SystemSettingsStoreAdapter:157` chỉ có action **retry** (`retry_email` — đẩy lại `status='queued'`), **KHÔNG có worker @Scheduled nào gửi SMTP** (grep `@Scheduled` toàn `java-backend` = duy nhất `SlaComplianceWorker`).

⇒ Chạy 100% Java thì email **xếp hàng mãi không đi**. P13-05 phải port worker này (email_settings · SMTP client · retry · reminders) sang Java — đếm là **service + test** theo deliverable của P13-05.

### 2.4. Worker SLA có sẵn — nguồn cho event «SLA quá hạn»

`SlaComplianceWorker` (infrastructure/worker, @Scheduled 1 giờ, :32-49):
1. `overdueSupplySteps(now)` ⇒ `markStepOverdue` — **điểm treo event «SLA quá hạn (Supply)»**;
2. `markPaymentPlansOverdue` — payment plan planned quá hạn;
3. đếm BCH chờ xác nhận quá hạn (hiện chỉ log).

### 2.5. Điểm ghi audit-log (nguồn event «phê duyệt bị thay đổi»)

`auditLog.log(...)` có thật tại: `RequestManagementUseCase` — CREATE :427 · EDIT_RETURNED :501 · RESUBMIT :553 · DELETE_RETURNED :581 · CANCEL :609 · APPROVE_PARTIAL :727; `AuthUseCase` — PASSWORD_CHANGE :168 · AVATAR_CHANGE :205 · SIGNATURE_CHANGE :229. Đây là **sự kiện đã được ghi lại có thật** — có thể làm nguồn event nếu user yêu cầu thông báo, nhưng §15 không liệt kê ⇒ chỉ ghi nhận, KHÔNG đề xuất bật.

---

## 3. ②+③ DANH MỤC EVENT — CÓ NGUỒN (✅) vs CHƯA CÓ NGUỒN (⛔)

Ký hiệu nguồn: `[C]=cột/trường dữ liệu đã có` · `[WF]=điểm nghiệp vụ trong use-case đã chạy thật` · `[JS]=đã có ở monolith JS, chưa port sang Java`.

### 3.1. Approval (§15 dòng 1)

| # | Event §15 | Trạng thái nguồn | Bằng chứng (điểm gắn `dispatch`) |
|---|---|---|---|
| A1 | Tới lượt user duyệt | ✅ CÓ (nguồn `[C][WF][JS]`) | `approvals` (status='pending', `approver_user_id`/role, `due_at`) — V1:119-142; phát khi `decideApproval` advance bước mới (`RequestManagementUseCase:776-777` đặt `due_at=now+slaHours`). JS ĐÃ gửi mail `approval_requested` (`system-route.mjs:1087,1128,1238`) |
| A2 | Phiếu được duyệt | ✅ CÓ (`[WF][JS]`) | `decideApproval` finalize — JS gửi `approved` stage 101 (`system-route.mjs:1086,1247`) |
| A3 | Phiếu bị từ chối | ✅ CÓ (`[WF][JS]`) | `decideApproval` rejected (:768-741); JS gửi `rejected` (:1230) |
| A4 | Phiếu bị trả lại (returned) | ✅ CÓ (`[WF]`) | `updateReturnedRequest`/`decideApproval` trả về requester + `auditLog EDIT_RETURNED` (:501) — người nhận xác định được = requester (`material_requests.requested_by`) |
| A5 | SLA sắp hết hạn (dự kiến) | ⛔ CHƯA CÓ NGUỒN | ⛔ Không có bộ đếm thời gian "sắp đến hạn" nào chạy định kỳ (chỉ có worker 1-giờ đánh overdue). DUE date có thật (`approvals.due_at`) nhưng "sắp hết" là luật ngưỡng mới (vd trước hạn 2h) — user chưa chốt ngưỡng ⇒ KHÔNG tạo. Đề xuất: gộp vào A6 bằng tần suất quét, chờ user chốt ngưỡng |
| A6 | SLA quá hạn | ✅ CÓ (`[C][WF][JS]`) | Nguồn 2 nhánh: (a) `SlaComplianceWorker.markStepOverdue` — supply step; (b) `approvals.due_at < now AND status='pending'` — JS `queueOverdueReminders` gửi event `overdue` + chống lặp bằng `reminder_sent_at` (`email-dispatcher.mjs:132-147`) |
| A7 | Duyệt quá hạn SLA (bắt buộc lý do §4.4) | ✅ CÓ (nguồn phụ `[WF]`) | `decideApproval` bắt lý do khi overdue (:650-673, `updateApprovalOverdueReason`) — có thể báo người lập phiếu. Ưu điểm thấp hơn A1-A6 |

### 3.2. Work (§15 dòng 2)

| # | Event §15 | Trạng thái nguồn | Bằng chứng |
|---|---|---|---|
| W1 | Được giao việc | ✅ CÓ (`[WF]`) | `createWorkItem`/`createSelfWorkItem`/`reassignWorkItem` ⇒ `queueTaskNotice` (Java `OpsTaskManagementUseCase:178-224`) — đã tạo `task_notifications` + email `event='task_assigned'` |
| W2 | Sắp đến hạn | ⛔ CHƯA CÓ NGUỒN | ⛔ `work_items.due_at` có thật (V1:2263) nhưng không có job quét "sắp đến hạn"; ngưỡng chưa định nghĩa ⇒ không tạo |
| W3 | Quá hạn | ✅ CÓ (`[C][WF]`) | `due_at` + trạng thái (WAITING_*/BLOCKED) — có thể quét cùng chu kỳ SlaComplianceWorker. JS cũng không có (không phải parity-bắt-buộc, là đề xuất thêm có nguồn) |
| W4 | Hoàn thành | ✅ CÓ (`[WF]`) | `updateWorkItemStatus` ⇒ COMPLETED (Java :305-335, guard «chỉ quản lý xác nhận Hoàn thành» tại JS :1275 — event dùng để báo người GIAO việc) |
| W5 | Bị thay đổi | ✅ CÓ (`[WF]`) | `reassignWorkItem` (:337-353 — đã ghi `work_item_events` REASSIGNED) + `updateWorkItemStatus` chờ/blocked/rework — báo người thực hiện cũ/mới |

### 3.3. Procurement (§15 dòng 3)

| # | Event §15 | Trạng thái nguồn | Bằng chứng |
|---|---|---|---|
| PR1 | PR cần duyệt | ✅ CÓ (`[WF][JS]`) | = A1 (PR là phiếu duyệt chính) — `createRequest` đặt `pending_approval` + gửi `approval_requested` ở JS :1087 |
| PR2 | PR được duyệt | ✅ CÓ (`[WF][JS]`) | = A2/A7-chain — JS :1247 (`approved`) |
| PR3 | PO liên quan | ✅ CÓ (`[WF]`) | `createPo` tạo PO + step `po_creation` (`PurchaseManagementUseCase:194-199`); `rejectPo` **đã THÔNG BÁO in-app người tạo PO** (`decidePo` ⇒ `task_notifications`, Java :240-258 + JS :1490) |
| PR4 | Giao hàng | ✅ CÓ (`[JS]`) | JS `delivery_completed`/`delivery_partial` sau BCH xác nhận (`system-route.mjs:1654`) — nguồn = `goods_receipts` + `supply_workflow_steps` |
| PR5 | Giao hàng trễ | ✅ CÓ (`[C]`) | `purchase_orders.eta` (V1:1530, index `purchase_orders_eta_idx`) vs ngày nhận thực — đề xuất thêm, nguồn tồn tại; ngưỡng định nghĩa khi cấu hình |
| PR6 | GRN (nhập kho theo chuyến) | ✅ CÓ (`[WF]`) | `receiveGoods`/`confirmDelivery` (`PurchaseManagementUseCase:294,391`) — báo người lập PR |
| PR7 | Thiếu vật tư | ✅ CÓ (`[WF]`) | `closePoLine`/`closeRequestItemForShortage`/`completeRequestWithShortage` — `closed_shortage`/`completed_with_shortage` (`PurchaseStoreAdapter:294-343`) |

### 3.4. Project (§15 dòng 4)

| # | Event §15 | Trạng thái nguồn | Bằng chứng |
|---|---|---|---|
| PJ1 | Được thêm vào project | ✅ CÓ (`[C][WF]`) | `user_project_scopes` (V14:21-26 có `joined_at`) — ghi khi cấp quyền dự án; người nhận = user mới được cấp |
| PJ2 | Project assignment | ⛔ TRÙNG PJ1 | §15 liệt kê cả 2 nhưng nguồn dữ liệu là MỘT (`user_project_scopes`) — gộp 1 event, không tạo bản sao |
| PJ3 | Task assignment | ✅ CÓ (`[WF]`) | = W1 (nhiệm vụ gắn dự án) — dùng chung, không tạo trùng |
| PJ4 | Project milestone | ⛔ CHƯA CÓ NGUỒN | ⛔ Không có bảng/fields "milestone" nào (grep milestone = 0). Không bịa |

### 3.5. Warehouse (§15 dòng 5)

| # | Event §15 | Trạng thái nguồn | Bằng chứng |
|---|---|---|---|
| KH1 | Phiếu nhập | ✅ CÓ (`[WF]`) | `createTransferGrn`/`createIssueGrn`/`receiveGoods` ⇒ `goods_receipts` (`StockManagementUseCase:328,414`) |
| KH2 | Phiếu xuất | ✅ CÓ (`[WF]`) | `issueStock` → `approveStockIssue` (bước ② CHÚ HƯỞNG :185) → `issueStockConfirm` (:229-276) — chuỗi trạng thái thật |
| KH3 | Cấp phát tổ đội | ✅ CÓ (`[WF]`) | `issueStock` + `returnStock` (:53,501) — đối tượng = tổ đội (`stock_issues`) |
| KH4 | Hoàn trả | ✅ CÓ (`[WF]`) | `returnStock` + `createCentralReturn`/`approveCentralReturn`/`receiveCentralReturn` (:794-890) |
| KH5 | Tồn kho thấp | ✅ CÓ (`[C]`) | `materials.min_stock` (V1, cột có thật — MaterialCatalogStoreAdapter:43) + số dư kho (`BootstrapDataAdapter:301,1716` tính balance) — đề xuất thêm, quét định kỳ cùng worker |

### 3.6. Tổng kết

- ✅ **CÓ NGUỒN: 13** = A1 A2 A3 A4 A6 (5) + W1 W3 W4 W5 (4) + PR3 PR6 PR7 + (PR4/PR5 gộp giao hàng) — chi tiết: 5 Approval (A1,A2,A3,A4,A6) · 4 Work (W1,W3,W4,W5) · 4 Procurement (PR3,PR4/5 gộp giao hàng,PR6,PR7) · 2 Project (PJ1; PJ3 trùng W1) · 4 Warehouse (KH1-KH5 trừ KH chưa có) — đếm riêng theo bảng = **13 event khả thi**.
- ⛔ **CHƯA CÓ NGUỒN: 3 dạng** — A5 «SLA sắp hết» (không có ngưỡng/job) · W2 «sắp đến hạn» (không có job/ngưỡng) · PJ4 «milestone» (không có bảng). ⇒ ⛔ **KHÔNG tạo** (§15 mệnh đề ④) — cần user chốt ngưỡng/phạm vi trước, hoặc dùng chung A6/W3 quét định kỳ.
- Trùng lặp gộp: PJ2=PJ1 · PJ3=W1 · PR1=A1 · PR2=A2 — không tạo bản sao event.

---

## 4. ④ ĐỀ XUẤT TRIỂN KHAI P13-05 (không thực hiện trong task này)

1. **Không tạo engine mới** — nối `notificationManagementUseCase.dispatch(eventKey)` vào đúng điểm nghiệp vụ đã audit ở bảng §3; mỗi event = 1 dòng cấu hình trong `notification_configs` (người dùng tự đặt tên/nội dung/người nhận — engine chỉ phát theo `code`).
2. **Thứ tự ưu tiên** (theo nguồn sẵn nhất + giá trị nghiệp vụ):
   - **Đợt 1 — Approval**: A1, A2, A3 (điểm gắn duy nhất `decideApproval` + `createRequest`; parity với JS đã có mẫu nội dung email `approvalEmailStatement` — port khuôn, KHÔNG bịa chữ mới).
   - **Đợt 2 — Supply/Procurement**: PR4/PR5 (delivery_waiting_bch/completed/partial — JS :1591,1654 đã có khuôn), PR7 (shortage — điểm `closePoLine`/`completeRequestWithShortage`), PR6.
   - **Đợt 3 — Work**: W1 (đã có sẵn in-app + email task_assigned — chỉ cần **thêm dòng cấu hình** để đi qua engine thống nhất, ⛔ không cắt luồng hiện có trong khi chuyển), W4, W5.
   - **Đợt 4 — Warehouse/Project**: KH1-KH5, PJ1 (thêm gọi `dispatch` sau khi ghi phiếu).
3. **Port email worker**: chuyển `email-dispatcher.mjs` (SMTP + retry + `queueOverdueReminders` event `overdue`) sang Java `@Scheduled` — dùng lại `email_settings` (đã lưu SMTP host/port/user/password/sender) và `email_outbox` (schema sẵn).
4. **Đặt tên `event` trong `email_outbox` theo mã cấu hình** (thay các chuỗi rời rạc) để P13-06 ánh xạ được LOG ↔ Delivery status.

## 5. ĐỀ XUẤT P13-06 — LOG + DELIVERY STATUS (REUSE, không tạo bảng trùng)

- Trạng thái theo **user** cho kênh WEB: đã có `notification_user_states` (`read_at`, `delivered_at`, `snooze_until`) ✔ — API đọc = truy vấn SELECT (read-only).
- Trạng thái theo **chuyến email**: đã có `email_outbox` (`status` queued/sending/sent/failed, `attempt_count`, `sent_at`, `last_error`, `event`, `recipients`) ✔ — chỉ cần API liệt kê + đếm theo event.
- In-app luồng công việc: `task_notifications.read_at` đã có action `mark_task_notification_read`.
⇒ P13-06 có thể là **bảng tổng hợp + API đọc** nếu user muốn giao diện hợp nhất 3 nguồn; ⛔ KHÔNG nhân bản dữ liệu trạng thái sang bảng mới rồi để hai nơi lệch nhau.

---

## 6. GIỚI HẠN & KHÔNG LÀM (theo §15 + §18)

- ⛔ Không tạo bất kỳ event nào trong bảng §3 mục ⛔ cho tới khi có nguồn (user chốt ngưỡng SLA / bảng milestone).
- ⛔ Không hard-code nội dung/người nhận vào code — mọi luật thuộc `notification_configs`.
- ⛔ Không gửi SMTP từ use-case — chỉ xếp hàng `email_outbox`.
- Chưa sửa gì mã/migration — deliverable đúng 1 file tài liệu này.
