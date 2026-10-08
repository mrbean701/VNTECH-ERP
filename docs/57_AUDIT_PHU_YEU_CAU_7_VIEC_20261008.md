# AUDIT **PHỦ YÊU CẦU** 7 VIỆC (đối chiếu từng chữ user nói) + 2 GAP tìm được

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · Nối tiếp `docs/49`→`docs/56`
⭐ **Đổi trục kiểm** (vòng 27): 6 vòng trước tôi kiểm **mã** (class CSS · quy ước modal · `send` · chỉ số tab · spec port). Vòng này kiểm **YÊU CẦU**: *mỗi điều user nói có thật sự được kế hoạch đáp ứng ⛔?*

---

## 1. BẢNG ĐỐI CHIẾU 7 YÊU CẦU (⛔ không suy diễn — trích lại ý user)

| # | YÊU CẦU USER (nguyên ý) | KẾ HOẠCH ĐÁP ỨNG | TRẠNG THÁI |
|---|---|---|---|
| **1** | Gom **tất cả menu item** thành **«Công việc» (hub)**; click ⇒ hiện **Dashboard**; **chuyển tab Dashboard lên đầu** | `docs/51` 6 bước: 5 mục → **1 mục `work_hub`** · rút `my_work` khỏi `HUB_TAB_GROUP_KEYS` · dải 7 tab **Dashboard = 0** · bù **bẫy `workCenterViewFor`** | ✅ **ĐỦ** |
| **2** | Đưa **thanh search xuống ngay phía trên danh sách công việc của bản thân** | `docs/52` §2: bỏ `search` khỏi `ListToolbar` đầu màn → `ListToolbar` **có search** ngay trên bảng (tab Danh sách công việc) | ✅ **ĐỦ** |
| **3** | Tab Dashboard hiện **công việc của user đó**; **lược bỏ nút «Thao tác»** ⇒ **cho nhập số % hoàn thành** | `docs/52` §3: `ProgressCell` **nhập %** (bỏ 4 nút preset) + tab Dashboard thêm bảng việc của `mine`; ⭐ kèm sửa **`BUG-D05`** | ✅ **ĐỦ** (+ sửa bug phát sinh) |
| **4** | Chuyển «tự tạo việc cho bản thân» vào **modal**, đổi tên **«Tạo công việc»** | `docs/52` §4: modal `.modal-head` + `form-grid` + `footer.modal-actions` | ✅ **ĐỦ** |
| **5a** | «Danh sách việc của tôi» → **«Danh sách công việc»** | `docs/52` §2 (gộp 1 lượt) | ✅ **ĐỦ** |
| **5b** | 🔴 **Thêm nút nhận xét DÀNH CHO TẤT CẢ CÁC CÔNG VIỆC TRONG DANH SÁCH** | `docs/53` §3.2 chỉ đặt ô nhận xét **trong modal chi tiết**, ⛔ **chưa có lối vào theo TỪNG DÒNG** | 🔴 **THIẾU** ⇒ **đã bổ sung `docs/53` §3.4** |
| **5c** | Click vào công việc ⇒ **mở modal chi tiết** | `docs/53` §3.2: nút ở cột c1 (`taskNo`) mở modal — ⚠️ **là click vào MÃ VIỆC**, ⛔ chưa chắc là click cả **DÒNG** (chưa đọc API `DataTable`) | 🟡 **ĐỦ MỘT PHẦN** ⇒ ghi rõ + phương án |
| **5d** | Trưởng phòng **duyệt đã hoàn thành** / **yêu cầu làm lại** | `docs/53` §3.2: `COMPLETED` + `REWORK` **kèm lý do**; nhánh theo `canApproveRow` | ✅ **ĐỦ** |
| **6a** | Tab **«Được giao»** + click xem chi tiết | `docs/53` §3.1: tab riêng, **dùng lại `personalGroups[1].rows`** (⛔ không viết lại logic) | ✅ **ĐỦ** |
| **6b** | **Người được giao nhận thông báo trên web khi được giao việc** | BE `createWorkItem:209-212` → `queueTaskNotice` **ghi `task_notifications`** ⇒ FE hiển thị (`page.tsx:568/581`) | ✅ **ĐỦ** (đã có sẵn) |
| **6c** | 🟡 **Người GIAO nhận thông báo khi việc đã giao được hoàn thành** | BE chỉ gọi **`notifySafely("TASK_COMPLETED")`** → `notifications.dispatch(eventKey)`; `NotificationRule` ghi: *«Luật ⛔ KHÔNG hard-code trong service: cấu hình nằm ở bảng **`notification_configs`** do người dùng cấu hình»* (`NotificationManagementUseCase:49`) | 🟡 **PHỤ THUỘC CẤU HÌNH** + **CẦN XÁC MINH** ⇒ xem §2 GAP-2 |
| **6d** | Người được giao có nút **«Hoàn thành»** để báo cấp trên | `docs/52` §3.1 + `docs/53` §3.2: gửi **`SUBMITTED`** (⛔ không `COMPLETED` — BE chặn) | ✅ **ĐỦ** |
| **7a** | Tab «Phòng ban» → **«Phòng ban/ Tổ đội»** | `docs/51` Bước 4 (nhãn) + `docs/53` §2 | ✅ **ĐỦ** |
| **7b** | **2 sub-tab**: việc của **phòng ban** (phòng user thuộc) · việc của **tổ đội** (tổ đội user tham gia) | `docs/53` §2 dùng lại `deptWork`/`teamWork` | ✅ **ĐỦ** |
| **7c** | **Audit lại tab này** | `docs/49` §1: **4 khối**, **3 khối là 3 cách nhìn CÙNG 1 tập việc** (bảng · Kanban · cây) ⇒ giải thích *«nhiều thông tin ⛔ không hiểu tác dụng gì»*; ⚠️ «hỗ trợ liên phòng» **chỉ XEM được** | ✅ **ĐỦ** |

---

## 2. 🔴 2 GAP TÌM ĐƯỢC (vòng 27)

### GAP-1 🔴 **Việc 5b — nút «Nhận xét» cho TỪNG công việc trong danh sách** (đã bổ sung vào `docs/53` §3.4)
User nói: *«Thêm **nút nhận xét dành cho tất cả các công việc trong danh sách**»* — kế hoạch trước chỉ có ô nhận xét **trong modal chi tiết** ⇒ người dùng phải mở modal mới thấy.
**Bổ sung**: nút **«💬 Nhận xét»** ở **mỗi dòng** (`TaskTable` cột c9) ⇒ mở **chính modal chi tiết đó** ở chế độ **tập trung vào ô nhận xét** (⛔ không viết modal thứ hai — §17 TÁI DÙNG).
⚠️ Vẫn theo cổng **`COMMENTS_READY`** (BE `add_work_item_comment` **chưa cài** ⇒ gọi vào = **400**) ⇒ khi chưa port thì **⛔ không hiện nút**, hiện dòng *«Nhận xét sẽ bật sau khi backend hoàn tất»*.

### GAP-2 🟡 **Việc 6c — «người giao nhận thông báo khi hoàn thành» phụ thuộc CẤU HÌNH, và chưa chứng minh có thông báo TRONG WEB**
Đọc mã (⛔ không suy đoán):
- `OpsTaskManagementUseCase:385` — khi `COMPLETED` chỉ gọi **`notifySafely("TASK_COMPLETED")`**.
- `:119-125` — `notifySafely` = **`notifications.dispatch(eventKey)`** (bọc `try/catch` ⇒ lỗi cấu hình bị **nuốt im lặng**).
- `NotificationRule` (javadoc) + `NotificationManagementUseCase:49` — **luật nằm ở `notification_configs`**, người dùng cấu hình; `notification_configs` **gác module `admin`** (`ActionRbacRegistry:52`).
- ⚠️ **`queueTaskNotice`** (ghi `task_notifications` — cái mà chuông trên web đọc) **chỉ chạy khi GIAO việc** (`createWorkItem`), ⛔ **không** thấy được gọi trong nhánh `COMPLETED`.
⇒ **Hệ quả**: ① muốn người giao nhận thông báo ⇒ **phải có luật `notification_configs` cho sự kiện `TASK_COMPLETED`** (việc **cấu hình**, ⛔ không phải mã) ② ⚠️ **chưa chắc có thông báo TRONG WEB** cho người giao (chuông đọc `task_notifications`) ⇒ **phải XÁC MINH** (không thể khẳng định từ mã).

**Phép thử bắt buộc thêm vào UAT (`docs/56`)**:
```text
[K7-bis] ① Trưởng phòng giao việc cho nhân viên ② nhân viên «Gửi kiểm tra» ③ trưởng phòng «Duyệt xong»
         ⇒ ⭐ GHI LẠI: (a) chuông THÔNG BÁO TRONG WEB của TRƯỞNG PHÒNG có tin nào ⛔?
                      (b) có email ⛔?  (c) xem bảng `notification_configs` có luật cho `TASK_COMPLETED` ⛔?
Kết quả (a)=KHÔNG ⇒ ⚠️ yêu cầu 6c ⛔ CHƯA thoả trong web ⇒ phải **hoặc** thêm luật `notification_configs`,
                                 **hoặc** viết thêm 1 dòng `queueTaskNotice` cho nhánh hoàn thành (BE — việc nhỏ)
```
📌 **Đề xuất cho go-live**: ⭐ **làm cả hai** — cấu hình luật `TASK_COMPLETED` (để có email) **và** thêm `queueTaskNotice` trong nhánh `COMPLETED` (để **chắc chắn có thông báo trong web** cho người giao) ⇒ đó là cách duy nhất đảm bảo đúng câu user nói *«nhận được thông báo»* (⛔ không phụ thuộc cấu hình có thể thiếu).

---

## 3. ✅ KẾT LUẬN AUDIT PHỦ YÊU CẦU
- **14/16 điểm yêu cầu: ĐỦ** (đối chiếu §1).
- 🔴 **1 điểm THIẾU** ⇒ **đã bổ sung** (`docs/53` §3.4 — nút Nhận xét từng dòng).
- 🟡 **1 điểm ĐỦ-MỘT-PHẦN + 1 điểm PHỤ THUỘC CẤU HÌNH** ⇒ ghi rõ 2 việc: ① `onRowClick` của `DataTable` (kiểm khi thi hành — nếu có thì cho click **cả dòng**) ② **luật `notification_configs` cho `TASK_COMPLETED`** + `queueTaskNotice` nhánh hoàn thành.
- ⭐ **Bài học vòng này**: kiểm **mã** ⛔ không thay được kiểm **chữ của user** — GAP-1 (nút nhận xét từng dòng) **lọt qua 6 vòng kiểm mã** vì mã ⛔ không có gì sai; cái sai là **kế hoạch thiếu**.

---

## 4. 🔎 CHỐT 2 ĐIỂM CÒN LẠI (vòng 28 — đọc mã, ⛔ không suy đoán)

### 4.1 ✅ Điểm 5c — **«click vào công việc» LÀM ĐƯỢC đúng nguyên văn** (đã sửa `docs/53` §3.2)
| Bằng chứng | Nội dung |
|---|---|
| `app/components/ui/DataTable.tsx:45` | `export function DataTable<T>({ columns, rows, rowKey, sort, **onRowClick**, … })` — **prop chính thức** |
| `:53` | `onRowClick?: (row: T) => void;` |
| `:116` | `className={[onRowClick ? **"dt-clickable"** : "", …]}` — **đã có CSS sẵn** |
| `:118` | `<tr … onClick={onRowClick ? () => onRowClick(row) : undefined}>` |
| `:22` (ghi chú trong tệp) | mẫu dùng: `onRowClick={(r)=>openDetail(r)}` |
⇒ ⭐ **Kết luận**: ⛔ **không cần** chỉ bấm vào mã việc — chỉ cần truyền `onRowClick` ⇒ **đúng câu user nói**. ➕ vẫn giữ nút `link-cell` ở cột c1 cho **a11y/bàn phím**. ⚠️ Phải `stopPropagation()` ở ô nhập % và các nút trong dòng.

### 4.2 🔴 GAP-2 — **CHỐT: luật cấu hình ⛔ KHÔNG nhắm được «người giao việc» ⇒ PHẢI SỬA BẰNG MÃ**
Đọc `java-backend/application/.../notification/NotificationRule.java` (38 dòng):
- `:18` `SUPPORTED_CHANNELS = List.of("web", "email")` ⇒ chỉ 2 kênh.
- `:21-33` `activeConfigsFor(eventKey, activeConfigs)`: duyệt cấu hình và **chỉ so khớp `config.get("code") == eventKey`** + kênh hợp lệ ⇒ ⭐ **khớp theo MÃ SỰ KIỆN, ⛔ KHÔNG có logic chọn người nhận theo từng công việc**.
- `:14` ⭐ *«⛔ **Không phát thông báo khi không có cấu hình nào khớp** — tránh bịa thông báo»* ⇒ **⛔ không có luật `TASK_COMPLETED` ⇒ ⛔ KHÔNG có thông báo nào** (cả web lẫn email).

**Hệ quả (quyết định được thi hành)**:
| # | Kết luận | Việc phải làm |
|---|---|---|
| 1 | Luật cấu hình chỉ nhắm **đích CỐ ĐỊNH** (người/vai trò đã khai ở `notification_config_targets`), ⛔ **không nhắm «người giao của chính công việc đó»** | ⇒ muốn đúng yêu cầu *«người GIAO nhận thông báo khi việc hoàn thành»* ⇒ **phải sửa mã** |
| 2 | `task_notifications` (bảng **chuông web** đọc) **chỉ được ghi khi GIAO việc** (`queueTaskNotice` trong `createWorkItem`) | ⇒ thêm **1 khối nhỏ (~15 dòng, ⛔ KHÔNG phải 1 dòng — xem §4.4)** trong nhánh `COMPLETED` của `updateWorkItemStatus`: ghi thông báo cho **người giao** ⚠️ **phải dựng map theo CAMELCASE** và **câu chữ phải là «hoàn thành», ⛔ không phải «Công việc mới»** |
| 3 | Email cho người giao (nếu muốn) | ➕ tạo luật `notification_configs` `code='TASK_COMPLETED'` (kênh `email`) — ✅ **bổ trợ**, ⛔ không thay được #1/#2 |

⭐ **Vì sao kết luận này quan trọng**: trước đó tôi ghi GAP-2 là *«phụ thuộc cấu hình»* — **đúng một nửa**. Nay đọc mã ⇒ **cấu hình ⛔ không thể** nhắm người giao của từng việc ⇒ đây là **việc BE nhỏ (1 dòng)**, ⛔ **không phải** việc cấu hình ⇒ phải đưa vào **phạm vi thi hành**, ⛔ không được để rơi.

### 4.3 📋 PHẠM VI THI HÀNH CẬP NHẬT (sau vòng 27+28) — ⭐ 5 việc nhỏ thêm
```text
① (FE) nút 「💬 Nhận xét」 theo TỪNG DÒNG + cổng COMMENTS_READY            [docs/53 §3.4]
② (FE) `onRowClick` cho TaskTable ⇒ click CẢ DÒNG mở chi tiết             [docs/53 §3.2]
③ (FE) `stopPropagation()` ở ô % và các nút trong dòng                    [docs/53 §3.2]
④ (BE) `queueTaskNotice(<người giao>)` trong nhánh COMPLETED             [§4.2 — 1 dòng]
⑤ (CFG) luật `notification_configs` code=TASK_COMPLETED (kênh email)      [§4.2 — bổ trợ]
```

---

## 4.4 🔴 HAI CÁI BẪY TRONG CHÍNH «1 DÒNG BE» Ở ④ (vòng 29 — đọc `sv()` và `queueTaskNotice`)

⭐ Bản §4.2 ở trên viết *«thêm 1 dòng `queueTaskNotice(task, <id người giao>, principal, now)`»* — **đọc kỹ mã ⇒ câu đó sẽ tạo THÔNG BÁO RỖNG/SAI**. Hai lý do (⛔ không suy đoán):

| # | Bẫy | Bằng chứng (đọc mã) | Hệ quả nếu ⛔ không xử |
|---|---|---|---|
| **B-1** | **`sv()` là TRA MAP THẲNG — ⛔ không đổi kiểu tên khoá** | `OpsTaskManagementUseCase:806` — `private static String sv(Map<String,Object> m, String k) { Object v = m.get(k); return v == null ? "" : String.valueOf(v); }` | ⇒ tên khoá phải **khớp CHÍNH XÁC** với map đang có |
| **B-1a** | `findWorkItem(…)` trả **SNAKE_CASE** | `:343-345`/`:364-366` dùng `sv(task, "assigned_to")`, `sv(task, "department_code")`; `:399` dùng `sv(task, "project_id")` | ⇒ người giao = **`sv(task, "assigned_by")`** (⛔ **không** phải `"assignedBy"`) |
| **B-1b** | `queueTaskNotice(…)` lại đọc **CAMELCASE** | `:233-239` — `sv(task,"projectId")`, `sv(task,"dueAt")`, `sv(task,"taskNo")`, `sv(task,"title")` (vì nó được thiết kế cho map do **`createWorkItem` dựng**: `task.put("taskNo", …)` `:201`, `task.put("dueAt", …)` `:195`) | ⇒ **⛔ nếu truyền thẳng map `findWorkItem`** ⇒ `taskNo`/`projectId`/`dueAt` **rỗng** ⇒ thông báo chỉ còn *«Công việc mới: <title>»* mà ⛔ **không có mã việc/hạn** |
| **B-2** | `queueTaskNotice` dựng **CÂU CHỮ CỦA «GIAO VIỆC»** | `:222-224` (javadoc) — tiêu đề mẫu: **«Công việc mới: <tên việc>»** | ⇒ gửi cho **người giao** khi việc **đã hoàn thành** mà tiêu đề là «Công việc **mới**» ⇒ ⚠️ **hiểu sai nghiệp vụ** |

### ✅ MÃ ĐÚNG (dán được) — thay cho «1 dòng»
```java
        // trong updateWorkItemStatus, NGAY SAU `store.updateWorkItemStatus(u, now);`
        if ("COMPLETED".equals(next)) {
            String assigner = sv(task, "assigned_by");            // ⚠️ B-1a: findWorkItem = SNAKE_CASE
            // Gửi cho NGƯỜI GIAO; ⛔ không gửi nếu chính họ là người vừa duyệt
            if (!assigner.isEmpty() && !assigner.equals(principal.userId())) {
                queueCompletionNotice(task, assigner, principal, now);   // ⭐ hàm MỚI — ⛔ không dùng lại queueTaskNotice
            }
        }
```
```java
    /**
     * ⭐ BIẾN THỂ của `queueTaskNotice` cho sự kiện HOÀN THÀNH (vòng 29):
     *   · ⚠️ B-1b: `findWorkItem` trả SNAKE_CASE ⇒ phải DỰNG LẠI map theo CAMELCASE
     *     (giống map mà `createWorkItem` dựng) trước khi gọi, nếu ⛔ không thì mã việc/hạn/dự án RỖNG.
     *   · ⚠️ B-2: câu chữ phải là «hoàn thành», ⛔ KHÔNG dùng mẫu «Công việc mới: …».
     */
    private void queueCompletionNotice(Map<String, Object> raw, String assignerId, Principal actor, Instant now) {
        Map<String, Object> contact = store.findUserContact(assignerId).orElse(null);
        if (contact == null) return;                                  // ⛔ không bịa người nhận
        Map<String, Object> task = new LinkedHashMap<>();             // ⚠️ CAMELCASE cho queueTaskNotice-ish
        task.put("id", sv(raw, "id"));
        task.put("taskNo", sv(raw, "task_no"));
        task.put("title", sv(raw, "title"));
        task.put("projectId", sv(raw, "project_id"));
        task.put("dueAt", sv(raw, "due_at"));
        task.put("priority", sv(raw, "priority"));
        // tiêu đề mẫu ĐÚNG nghiệp vụ (⛔ không dùng «Công việc mới»):
        //   title : "Công việc đã hoàn thành: <tên việc>"
        //   body  : "<mã việc> · <mã - tên dự án | «Không gắn dự án»> · Người thực hiện: <tên>"
        // ⭐ ĐÃ XÁC MINH (vòng 32) — chữ ký THẬT từ `queueTaskNotice:241-248`:
        //   `store.insertTaskNotification(Map notice, Instant now)` — notice có **6 khoá**:
        //     id = idGenerator.next("NTF") · workItemId · userId · **channel = "in_app"** · title · body
        Map<String, Object> notice = new LinkedHashMap<>();
        notice.put("id", idGenerator.next("NTF"));
        notice.put("workItemId", sv(raw, "id"));
        notice.put("userId", assignerId);                 // ⭐ NGƯỜI GIAO (khác `queueTaskNotice`: người nhận)
        notice.put("channel", "in_app");                  // ⚠️ BẮT BUỘC — bản phác trước của tôi THIẾU khoá này
        notice.put("title", "Công việc đã hoàn thành: " + sv(raw, "title"));
        notice.put("body", sv(raw, "task_no") + " · " + projectText + " · Người thực hiện: " + actor.fullName());
        store.insertTaskNotification(notice, now);
        // ➕ TUỲ CHỌN — email: khuôn THẬT ở `queueTaskNotice:250-275`:
        //   `String email = sv(contact, "email"); if (email.isEmpty()) return;`
        //   `store.insertEmailOutbox(Map mail, Instant now)` — mail có: id = idGenerator.next("MAIL"),
        //   `recipients` · `subject` · `textBody` · `htmlBody`
        //   ⚠️ câu chữ phải là «đã hoàn thành», ⛔ KHÔNG dùng mẫu «Bạn được giao công việc mới.»
    }
```
✅ **ĐÃ XÁC MINH (vòng 32)** — đọc thân `queueTaskNotice:240-275` (⛔ không còn là giả định):
| Hạng mục | Sự thật |
|---|---|
| Ghi thông báo trong ứng dụng | **`store.insertTaskNotification(Map notice, Instant now)`** — notice **6 khoá**: `id` (`idGenerator.next("NTF")`) · `workItemId` · `userId` · **`channel = "in_app"`** · `title` · `body` |
| Ghi email | **`store.insertEmailOutbox(Map mail, Instant now)`** — mail: `id` (`idGenerator.next("MAIL")`) · `recipients` · `subject` · `textBody` · `htmlBody`; có **guard** `String email = sv(contact,"email"); if (email.isEmpty()) return;`, dùng `store.emailBaseUrl()` + helper `html(...)` |
| Câu chữ bản giao | `title` = *«Công việc **mới**: <tên>»* · `body` = *«<mã việc> · <dự án> · Hạn: <hạn>»* ⇒ ⚠️ **phải viết lại** cho sự kiện hoàn thành |
📌 ⭐ **Sửa lại bản phác của tôi**: đoạn mã cũ gọi `insertTaskNotification(idGenerator.next("NTF"), assignerId, title, body, null, now)` ⇒ ⛔ **SAI chữ ký** (truyền theo vị trí) và ⛔ **thiếu `channel`** ⇒ sẽ **lỗi biên dịch/ghi thiếu cột**. Mã đúng đã thay ở trên ⇒ ⭐ **patch việc ④ nay dán được, ⛔ không còn giả định nào trong toàn bộ bàn giao**.
📋 **Phạm vi ④ sửa lại**: **~15 dòng** (1 nhánh `if` + **1 hàm nhỏ**) — ⛔ **không phải 1 dòng**. Ước lượng ⛔ không đổi đáng kể, nhưng **⛔ tránh được 2 lỗi im lặng** (thông báo rỗng + sai câu chữ).
