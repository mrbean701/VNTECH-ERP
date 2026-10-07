# TASK-MT3-BE-09 — Thông báo: backend kiểm QUYỀN GỬI THEO PHẠM VI

| Mục | Nội dung |
|---|---|
| **Task** | P3-BE-09 |
| **Phase** | **GĐ2 — BACKEND** |
| **Status** | ✅ **ĐÃ BỊT LỖ HỔNG PHẦN «PHẠM VI DỰ ÁN» + CHỨNG MINH BẰNG TEST** · `mvn test` **67/67 ĐẠT** · ⛔ `department`/`all` **chờ luật user** |
| **Requirement** | MT3 §I: *«**Backend phải kiểm tra người tạo thông báo có quyền gửi tới phạm vi đã chọn**»* + *«thông báo tạo ra phải **xuất hiện trong Trung tâm thông báo theo đúng đối tượng**»* |

## 🔴 BẰNG CHỨNG LỖ HỔNG (đọc mã trực tiếp — ⛔ không suy đoán)

### 1) `NotificationManagementUseCase.saveConfig` **KHÔNG nhận `Principal`**
```
public Map<String, Object> saveConfig(Map<String, Object> payload) {   // ← ⛔ KHÔNG có Principal
```
⇒ **Về mặt chữ ký hàm, nó KHÔNG THỂ kiểm quyền người gửi** — ⛔ không có thông tin người thực hiện.
Grep toàn tệp (`15.5 KB`) các từ khoá kiểm phạm vi — `requireProjectAccess` · `accessScope` · `rbac` · `level_rank` · `isAdmin` — **⛔ 0 kết quả**.

### 2) Điều `saveConfig` **ĐANG** kiểm (đọc nguyên hàm)
| Kiểm | Có? |
|---|---|
| `name` rỗng | ✅ |
| `code` rỗng | ✅ |
| `channel ∈ {web,email}` | ✅ |
| `recipientMode ∈ {all,user,users,department,project}` | ✅ |
| **Người gửi có quyền tới `project` đã chọn** | ⛔ **KHÔNG** |
| **Người gửi có quyền tới `department` đã chọn** | ⛔ **KHÔNG** |
| **Người gửi có quyền gửi `all` (toàn công ty)** | ⛔ **KHÔNG** |

### 3) Cổng RBAC hiện có (⛔ KHÔNG đủ để bù)
Action `save_notification_config` **có** được gác ở tầng RBAC (module `admin`). Nhưng đó chỉ là **cổng vào màn quản trị** ⇒ **ai đã vào được thì gửi được tới BẤT KỲ phạm vi nào** (kể cả `all`). ⇒ ⛔ **đúng lỗ hổng mà MT3 §I yêu cầu bịt**.

## ⚠️ VIỆC THẬT CẦN LÀM — và phần nào ⛔ cần user chốt
| # | Việc | Trạng thái quyết định |
|---|---|---|
| 1 | Đổi `saveConfig(Map)` → **`saveConfig(Principal, Map)`** + cập nhật **call-site** trong `SystemController` | ⛔ **kỹ thuật thuần** — làm được ngay |
| 2 | `recipientMode = "project"` ⇒ gọi **`accessScope.requireProjectAccess(...)`** cho **từng** `targetId` | ✅ **TÁI DÙNG mẫu ĐÃ CHỨNG MINH** (giống `requestSupplement`/`Construction`) — ⛔ không cần luật mới |
| 3 | `recipientMode = "department"` ⇒ kiểm người gửi thuộc/được quyền tới phòng ban đó | ⛔ **CẦN LUẬT** — ⛔ không tự chọn (theo `department` hay `department + level`? cấp nào mới được?) |
| 4 | `recipientMode = "all"` ⇒ ai được gửi toàn công ty? | ⛔ **CẦN LUẬT** — ⛔ không tự chọn (admin? từ cấp nào?) |
| 5 | Thông báo tạo ra **xuất hiện đúng đối tượng** trong Trung tâm thông báo | ⚠️ phụ thuộc #3/#4 + cơ chế giao thông báo hiện có ⇒ **cần khảo sát tiếp** |

📌 **ĐỀ XUẤT LÀM TRƯỚC PHẦN AN TOÀN**: thực hiện **#1 + #2** (project scope) — đây là **tái dùng mẫu đã có**, ⛔ **không phát minh luật**, và **chặn được** ca gửi thông báo tới **dự án mình không có quyền**. Sau đó #3/#4 chờ user chốt luật.

## Testing hiện tại (nền vẫn sạch)
| Cổng | Kết quả |
|---|---|
| `mvn -f java-backend/pom.xml test` | ✅ **66/66 ĐẠT** · `BUILD SUCCESS` |
| `tools/verify-java-compile.ps1` | ✅ 115 tệp · 0 lỗi |
| `tsc` · contract · regression · `verify:css-baseline` · `verify:master-baseline` | ✅ đều ĐẠT |

## Blockers
⛔ **Cần user chốt LUẬT cho #3 (`department`) và #4 (`all`)** — ⛔ không tự chọn cấp quyền.

## Next action
1. Làm **#1 + #2** (project scope) + test ⇒ chạy `mvn test`.
2. Gộp câu hỏi #3/#4 vào **nhóm câu hỏi đang chờ** (nay **7 việc**).

---

## 📐 KẾ HOẠCH SỬA CHÍNH XÁC (đã khảo sát đủ — ⏳ chờ vòng có đủ ngân sách)

### Dữ kiện kỹ thuật đã đo (⛔ không suy đoán)
| Điều | Sự thật |
|---|---|
| `NotificationManagementUseCase` có `Principal` chưa? | ⛔ **CHƯA** (grep `Principal` = 0 kết quả) |
| Có `accessScope` chưa? | ⛔ **CHƯA** — chỉ có 4 field: `store` · `idGenerator` · `rule` · `resolver` (`:30-33`) |
| Chỗ gọi | `SystemController.java:1278` — `notificationManagementUseCase.saveConfig(payload)` |
| Khuôn `Principal` chuẩn của dự án | interface với 5 hàm `userId()` · `role()` · `roleBase()` · `fullName()` · `email()` — **có 16 helper `asXPrincipal(CurrentUser)` sẵn** (`SystemController:1517-1653`), khuôn mẫu ở `asReqPrincipal` (`:1579`) |

### 4 tệp phải sửa (⚠️ có **thay đổi DI** ⇒ phải hết sức cẩn thận)
| # | Tệp | Việc |
|---|---|---|
| 1 | `NotificationManagementUseCase.java` | thêm `interface Principal { userId/role/roleBase/fullName/email }` · thêm field **`AccessScopeService accessScope`** + **tham số constructor** · đổi `saveConfig(Map)` → **`saveConfig(Principal, Map)`** · thêm vòng kiểm **`accessScope.requireProjectAccess(...)`** cho **từng `targetId`** khi `recipientMode="project"` |
| 2 | `ApplicationBeansConfig.java` | ⚠️ **BẮT BUỘC**: thêm `accessScope` vào tham số bean của `NotificationManagementUseCase` — ⛔ **thiếu bước này là hỏng khởi động ứng dụng** |
| 3 | `SystemController.java` | thêm helper **`asNotificationPrincipal(CurrentUser)`** (noi `asReqPrincipal`) · sửa call-site `:1278` |
| 4 | test | ca âm: gửi tới **dự án ⛔ không có quyền** ⇒ **bị từ chối** · ca dương: dự án **có** quyền ⇒ **thành công** |

### ⚠️ Vì sao ⛔ **CHƯA bắt đầu trong vòng này** (⛔ không phải bỏ dở — là chủ ý)
- Thay đổi **4 tệp** + **đổi DI/constructor** ⇒ nếu làm dở mà **không chạy được `mvn test`** để kiểm chứng thì để lại **mã hỏng**, ⛔ tệ hơn là chưa làm.
- Tiền lệ tôi đã mắc: **làm hỏng 3 tệp kiểm thử** vì thao tác vội ⇒ ⛔ **không lặp lại**.
- ⇒ Cách đúng: vòng sau **đọc `ApplicationBeansConfig` trước**, sửa **đủ 4 tệp trong một mạch**, rồi chạy `mvn test` ngay ⇒ có bằng chứng.

### ⛔ Phần KHÔNG làm dù có ngân sách (chờ luật user)
`recipientMode="department"` (#3) và `="all"` (#4) — ⛔ **cần luật** (cấp nào được gửi?) ⇒ ⛔ không tự chọn. Sau khi user chốt mới làm.

---

## ✅ ĐÃ BỊT LỖ HỔNG — CHỈ SỬA **1 TỆP** (⛔ KHÔNG đổi DI/constructor)

### 🎯 Phát hiện làm GIẢM ĐỘ PHỨC TẠP RẤT NHIỀU (kế hoạch cũ 4 tệp ⇒ thực tế **1 tệp**)
Kế hoạch đầu (mục trên) dự tính phải sửa 4 tệp kèm **đổi constructor + `ApplicationBeansConfig`**.
**Đọc kỹ hơn thì thấy KHÔNG CẦN**, vì:
| Dữ kiện | Vị trí |
|---|---|
| `SystemController` **ĐÃ CÓ** `accessScopeService` | khai `:80` · tham số `:95` · gán `:133` |
| …và **ĐÃ dùng đúng khuôn** ở nơi khác | `:303` — `accessScopeService.requireProjectAccess(cu.id(), cu.role(), projectId, true, …)` |
| Tại call-site cũ, `requireCurrentUser(request)` **được gọi nhưng ⛔ VỨT BỎ kết quả** | `:1277` (trước khi sửa) |
⇒ ⛔ **KHÔNG cần** thêm `Principal`/`accessScope` vào use-case · ⛔ **KHÔNG cần** đổi `ApplicationBeansConfig`.
⇒ **Chỉ sửa `SystemController`** — ⛔ **0 rủi ro DI**, ⛔ **0 rủi ro hỏng khởi động ứng dụng**.

### Thay đổi thực tế (1 tệp: `SystemController.java`)
Tại `case "save_notification_config"`:
- Lấy `cu` ra (**trước đây vứt bỏ**).
- Nếu `recipientMode = "project"` ⇒ lặp **từng `targetId`** trong `targets` và gọi
  **`accessScopeService.requireProjectAccess(cu.id(), cu.role(), targetId, true, "Không có quyền gửi thông báo tới dự án này.")`**
  — **ĐÚNG hàm đang dùng ở `:303`** ⇒ ⛔ **không phát minh luật mới**.
- ⛔ **KHÔNG** đụng `department`/`all` (chờ luật user) — ghi rõ ngay trong chú thích mã.

### ✅ TEST CHỨNG MINH — `NotificationScopeRbacTest.java` (tệp mới)
| # | Ca | Kết quả |
|---|---|---|
| ① | Tài khoản **CÓ** quyền module `admin` nhưng **⛔ KHÔNG có phạm vi `p_2`** ⇒ gửi tới `p_2` | ✅ **BỊ TỪ CHỐI** (`is4xxClientError`) |
| ② | Cùng tài khoản, gửi tới **`p_1` (CÓ phạm vi)** ⇒ đối chứng dương | ✅ **THÀNH CÔNG** (`isOk`) |
| ③ | DB: cấu hình `p_1` **được lưu thật** (1 dòng) · cấu hình `p_2` **⛔ KHÔNG được lưu** (0 dòng) | ✅ ⛔ **không «thành công giả»** |

### KẾT QUẢ CHẠY
| Cổng | Kết quả |
|---|---|
| `NotificationScopeRbacTest` (riêng) | ✅ **Tests run: 1, Failures: 0, Errors: 0** · `BUILD SUCCESS` |
| `tools/verify-java-compile.ps1` | ✅ 115 tệp · **0 lỗi** · 174 `.class` |
| `mvn -f java-backend/pom.xml test` (toàn bộ) | ✅ **`Tests run: 67, Failures: 0, Errors: 0, Skipped: 0`** · **`BUILD SUCCESS`** |
| (66 cũ + **1 mới**) | ✅ khớp chính xác ⇒ **⛔ không hồi quy** |

⚠️ **Lỗi con tôi đã mắc và tự sửa ngay**: tôi dùng hàm `trimmedParam(...)` **không tồn tại** trong controller; phát hiện bằng grep (chỉ 2 khớp = đúng 2 chỗ tôi vừa thêm) ⇒ đổi sang **`trim(Object)`** đã có sẵn (`:1726`) rồi mới biên dịch. **Bài học**: trước khi dùng một hàm "trông có vẻ sẵn có", **phải grep xác nhận nó tồn tại**. 

---

## 📊 KẾT QUẢ ĐO LẠI TOÀN BỘ GĐ2 (mục đích: ⛔ không báo cáo sai khối lượng)
| Task | Kết quả đo | Việc thật còn lại |
|---|---|---|
| **BE-01** `request_supplement` | 🔴 **có lỗ hổng thật** (action không tồn tại) | ✅ **ĐÃ LÀM + CHỨNG MINH 4/4** |
| BE-02 sắp xếp + giữ 72h | 🟢 **đã sắp xếp sẵn · không lọc mất sớm** | ⛔ chờ luật 72h (user) |
| BE-03 tự từ chối sau 72h | ⛔ **luật MỚI** | ⛔ chờ luật (user) |
| BE-04 phạm vi tab Phòng ban · duyệt trong modal | ⏳ **chưa đo** | ? |
| BE-05 tìm theo alias | 🟢 **hạ tầng có sẵn** (bảng alias + hàm chuẩn hoá) | 🛑 chờ chốt phạm vi (user) |
| BE-06 lịch sử tổ đội + phân trang | 🟡 **cốt lõi xong ở P3-UI-11 (có test)** | 🛑 phân trang máy chủ = API mới (user) |
| BE-07 export UTF-8 | 🟢 **đã đúng sẵn** | 🛑 chờ nghĩa «audit & idempotency» (user) |
| **BE-08** cưỡng chế quyền Thi công | 🟢 **đã cưỡng chế sẵn** | ✅ **ĐÃ CHỨNG MINH 4/4** |
| **BE-09** quyền gửi thông báo theo phạm vi | 🔴 **CÓ LỖ HỔNG THẬT** (không nhận `Principal`) | ⏳ **#1+#2 làm được ngay** · #3/#4 chờ luật |

**⇒ KẾT LUẬN ĐO ĐƯỢC**: trong **9 task GĐ2**, chỉ **3 task có việc mã thật** (**BE-01 ✅ đã xong · BE-08 ✅ đã xong · BE-09 🔴 còn**); **4 task phần lớn đã đáp ứng sẵn**; **2 task chờ luật nghiệp vụ của user**.
⇒ ⛔ **Không phóng đại**: GĐ2 **nhỏ hơn nhiều** so với bản phân rã ban đầu của tôi.