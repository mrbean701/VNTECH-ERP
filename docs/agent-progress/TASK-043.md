# TASK-043 — Trường động của DÒNG phiếu đề nghị: Java **chưa bao giờ GHI** và **ĐỌC SAI CHỖ**
### (kèm TASK-044 — bootstrap bỏ sót **11 trường** của dòng phiếu)

**Trạng thái:** **DONE** — đã sửa + kiểm chứng lúc chạy **26/26 ĐẠT, exit 0**
**Nguồn phát hiện:** mục "Rà tiếp" của `MASTER_STATUS.md` (từ phát hiện kèm 5.2 của TASK-042), sau đó mở rộng sang hợp đồng ĐỌC của màn Phiếu đề nghị
**Ngày:** 17/09/2026
**Commit:** #62 (TASK-043 + TASK-044 dựng **cùng một jar**, cùng một probe nên gộp một commit)

---

## 1. Chuỗi phát hiện

1. TASK-042 §5.2 đã đánh dấu `custom_field_values` là *"Java chỉ ĐỌC/XOÁ, chưa bao giờ INSERT"*.
2. Tra mã: `grep custom_field_values java-backend` → **5 chỗ**, trong đó chỉ **2 chỗ là mã chạy**:
   `BootstrapDataAdapter` (ĐỌC) và `BoqStoreAdapter` (**XOÁ**). **Không có `INSERT` nào.**
3. Nguồn sự thật JS (`scripts/system-route.mjs:974`) thì **có** ghi — ngay trong `create_request`,
   cho **từng dòng** phiếu, với `form_key='request_line'` và `entity_id = id DÒNG`.
4. Đối chiếu tiếp **đường ĐỌC** thì lộ **lỗi thứ hai, ngược chiều**: JS
   (`system-route.mjs:563-568`) tra bảng bằng **id DÒNG** rồi gắn `customFields` lên **từng dòng**;
   Java (`BootstrapDataAdapter`) tra bằng **id PHIẾU** rồi gắn lên **phiếu** ⇒ truy vấn **không bao giờ
   khớp** (`entity_id` trong DB là `MRI_…`), nên `requests[].customFields` **luôn `{}`**, còn mỗi dòng
   thì **không có khoá** `customFields` mà UI đọc (`app/page.tsx:3543` → `requestLineContext` →
   `savedRequestDocument` dùng cho **xuất Excel** và màn chi tiết phiếu).
5. **Đây là lần thứ BẢY** dự án gặp lớp lỗi *"đường ĐỌC thiếu/ sai"* — và lần này nó nằm **cùng một
   tính năng** với lỗi GHI, nên nếu chỉ kiểm "ghi xong không lỗi HTTP" thì **không thể** phát hiện.
6. Khi dò tiếp hợp đồng ĐỌC của màn Phiếu đề nghị, phát hiện thêm **TASK-044**: truy vấn dòng phiếu của
   Java **bỏ sót 11 trường** so với JS (mục 3).

## 2. Hai lỗi NGƯỢC CHIỀU trong cùng một tính năng

| | JS (nguồn sự thật) | Java TRƯỚC khi sửa |
|---|---|---|
| **GHI** | `INSERT INTO custom_field_values (id,form_key,entity_id,field_key,value_text,…)` cho **từng** cặp khoá/giá trị của từng dòng | **không ghi gì** — chú thích `RequestStore.insertRequest` vẫn ghi *"…+ custom fields…"* nhưng phần triển khai **không có câu lệnh nào** |
| **ĐỌC** | tra bằng **id DÒNG** → gắn `customFields` lên **từng dòng** | tra bằng **id PHIẾU** → gắn lên **phiếu** ⇒ không khớp bao giờ |
| **Lọc giá trị** | `customFieldsObject()` + chỉ ghi khi `fieldKey` khác rỗng, `value` khác `undefined/null`, `clean(value)` khác rỗng | (không có) |
| **id bản ghi** | `id("CFV")` → `CFV_<uuid>` | (không có) |

**Đối chứng dương của lỗi ĐỌC** (có trong probe, chạy thật): với 5 dòng vừa ghi,
`SELECT COUNT(*) … WHERE entity_id IN (<id PHIẾU>)` = **0** — chứng minh truy vấn cũ **về bản chất**
không thể trả kết quả, chứ không phải "tình cờ rỗng".

**Hệ quả người dùng thấy:** phiếu có trường động (admin bật ở `form_field_config`) sẽ **mất giá trị**
khi lập phiếu, và **xuất Excel / xem chi tiết cũng không có cột động**.

## 3. TASK-044 — bootstrap bỏ sót **11 trường** của dòng phiếu

UI `app/page.tsx:3609` hiển thị trực tiếp các trường này; Java không trả ⇒ cột **luôn trống / luôn 0**:

`workPackageCode` · `boqCode` · `installationArea` · `contractLineNo` · `pendingBchQty` ·
`closeReason` · `remainingQty` · `rejectedQty` · `linkedPoCount` · `linkedReceiptCount` ·
`missingDocumentCount`

Đo trên dữ liệu THẬT trước khi sửa (SQL trực tiếp, 34 dòng thuộc phiếu): tổng `remainingQty` = **975**,
`pendingBchQty` = **340**, `linkedPoCount` = **12**, `linkedReceiptCount` = **10** — trong khi giao diện
Java hiển thị **0** ở tất cả các cột đó. Đây là **dạng thứ tám** của cùng một lớp lỗi (đường ĐỌC thiếu).

## 4. Đã sửa

| Tệp | Trước | Sau |
|---|---|---|
| `application/…/service/RequestManagementUseCase.java` | không đọc `customFields` của dòng | port `customFieldsObject` + `cleanValue` (nguyên văn JS, kể cả `String(1.0)="1"`), gom `customFieldRows` với id `CFV_<uuid>` |
| `application/…/port/out/RequestStore.java` | `insertRequest(header, lines, approvals, now)` | thêm tham số `customFields` + Javadoc **nói rõ đây là chỗ bản cũ thiếu** |
| `infrastructure/…/RequestStoreAdapter.java` | không ghi `custom_field_values`; còn câu **vô nghĩa** `header.forEach((k,v) -> { })` | `INSERT … ON DUPLICATE KEY UPDATE value_text=VALUES(value_text),updated_at=VALUES(updated_at)` (đúng upsert của JS) + **xoá câu vô nghĩa** |
| `infrastructure/…/BootstrapDataAdapter.java` (đọc) | tra bằng id PHIẾU, gắn lên PHIẾU | tra bằng **id DÒNG**, gắn `customFields` lên **từng dòng**; **bỏ** khoá `customFields` cấp phiếu (JS không có) |
| `infrastructure/…/BootstrapDataAdapter.java` (TASK-044) | 23 trường | **34 trường** (thêm 11 trường + 4 truy vấn con) |
| `RequestManagementUseCase.java` (phụ) | `routeTag` **luôn NULL** (truyền `line.get("routeTag")` nhưng `nl` không có khoá này) | `nl.put("routeTag", nvl(line.get("routeTag")))` |

## 5. Kiểm chứng lúc chạy — `tools/probe-task043-custom-fields.mjs`: **26/26 ĐẠT, exit 0**

jar **90.893.269 bytes** (16:53:02) · API PID **2016** · Flyway `validated 16 migrations` · log **0 ERROR**
· `probe-java-sql-live` **8 phát hiện, toàn bộ là nhóm 6** (`vntech_license_*` — chờ quyết định #11)

Probe **tạo THẬT một phiếu** bằng đúng payload nghiệp vụ (4 dòng), rồi **tự xoá sạch** trong `finally`.

| Nhóm | Phép kiểm | Kết quả |
|---|---|---|
| Điều kiện | 5 bước duyệt đang hoạt động đều có Owner cho PRJ-DEMO-01 (dữ liệu THẬT, probe **không** thêm gì) | ĐẠT |
| GHI | `create_request` ⇒ **HTTP 200** + thông điệp `Đã lập phiếu DNMH-PRJ-DEMO-01-2026-0027 gồm 4 dòng…` | ĐẠT |
| GHI | dòng 1 lưu **đúng 5 giá trị** đã trim cả khoá lẫn giá trị | ĐẠT |
| GHI | trường rỗng / `null` **bị bỏ** (không tạo dòng rác) | ĐẠT |
| GHI | khoá lạ trong **chuỗi JSON** và trong **mảng** đều **không** được lưu (đúng `customFieldsObject`) | ĐẠT |
| GHI | `entity_id` = **id DÒNG** (5 dòng / 4 dòng phiếu) | ĐẠT |
| GHI | id đúng quy ước `CFV_<uuid>` | ĐẠT |
| GHI (phụ) | `route_tag` nay ghi thật (`ROUTE-ZZP043`) | ĐẠT |
| ĐỌC | bootstrap gắn `customFields` lên **từng dòng**, đủ 5 giá trị | ĐẠT |
| ĐỌC | 3 dòng không khai báo vẫn có `customFields` = `{}` (**không** phải `undefined`) | ĐẠT |
| ĐỌC | **không còn** `customFields` ở cấp phiếu (JS không có) | ĐẠT |
| ĐỐI CHỨNG | truy vấn CŨ (theo id PHIẾU) trả **0** dòng — đúng như lỗi mô tả | ĐẠT |
| TASK-044 | 34 dòng đều có **đủ 11 trường** | ĐẠT |
| TASK-044 | `pendingBchQty` 340 = 340 · `remainingQty` 975 = 975 · `linkedPoCount` 12 = 12 · `linkedReceiptCount` 10 = 10 · `rejectedQty` 0 = 0 (bootstrap ↔ SQL, **cùng tập hợp**) | ĐẠT |
| Mồ côi | mọi chênh lệch "toàn bộ ↔ tập hợp phiếu" được **giải thích hết** bằng 1 dòng mồ côi | ĐẠT |
| Dọn dẹp | 8 bảng nghiệp vụ trở về **đúng** số dòng trước khi chạy · cấu hình trường động **không bị đụng** | ĐẠT |

## 6. Phát hiện KÈM THEO — chưa sửa, đã đăng ký

### 6.1 Dòng mồ côi THẬT trong `material_request_items`
`MRI_d1f57f9d-7b4f-4939-a854-bbc50f78c69d` trỏ tới **`MR_46cee316-…` KHÔNG TỒN TẠI**
(`requested_qty=20`, `line_status=issued`, và **có liên kết PO/BCH thật**). **KHÔNG tự sửa dữ liệu**
(theo đúng nguyên tắc đã áp dụng cho `stock_issue_items` 3/5 dòng mồ côi — known issue #21).

### 6.2 `delete_request` để lại rác ở **CẢ HAI** phía
So từng câu lệnh: JS `delete_request` (`system-route.mjs:1031-1037`) và Java `deleteRequestCascade`
xoá **đúng cùng 5 bảng** (`approval_stage_decisions`, `approvals`, `request_comments`,
`material_request_items`, `material_requests`) — **tương đương, KHÔNG phải lỗi port**. Nhưng cả hai đều
**bỏ quên** `procurement_allocations` và `custom_field_values` của phiếu bị xoá ⇒ **rác tăng dần**.
Đây là khiếm khuyết nghiệp vụ chung của bản JS, cần người dùng quyết định trước khi sửa.

### 6.3 Trường động của `request_header` — **CẢ JS LẪN JAVA** đều không lưu
JS chỉ dùng cấu hình `request_header` để **kiểm bắt buộc** (`system-route.mjs:904-905`), **không** ghi
`custom_field_values` và **không** đọc lại. Java cũng vậy ⇒ **tương đương**, không phải lỗi port.
Nhưng đây là **lỗ hổng của bản JS**: admin bật trường động cho phần đầu phiếu thì dữ liệu **mất**.
Cần người dùng xác nhận có muốn bổ sung (sửa JS trước, rồi port) hay không.

### 6.4 `custom_field_values` với `form_key='boq'` — tính năng **chết ở chính bản JS**
JS **ĐỌC** (`:636`) và **XOÁ** (`:2755`) nhưng **không có câu `INSERT` nào** cho `boq`. Java cũng không
ghi ⇒ **tương đương**. Ghi nhận để không ai "phát hiện lại" và sửa nhầm.

### 6.5 Java **thiếu `audit(...)`** ở `create_request`
JS có `await audit(user.id,"CREATE","material_request",requestId,…,{dynamicFields:true})`
(`:980`); Java **không** gọi audit ở bất kỳ nhánh nào của `RequestManagementUseCase`. Xác nhận bằng dữ
liệu: `SELECT COUNT(*) FROM audit_logs WHERE entity_type='material_request'` = **0**. Đây là lỗ hổng
**xuyên suốt**, không riêng `create_request` ⇒ đăng ký thành hạng mục riêng.

### 6.6 Java **yếu hơn JS 3 phép kiểm** khi chọn Owner của bước duyệt
`create_request` của JS (`requireWorkflowAssignment`, `:442-452`) kiểm **4 điều**: có phân công ·
Owner **đang hoạt động** · **vai trò Owner nằm trong `allowedRoleCodes` của bước** ·
**Owner có `user_project_scopes`** cho dự án (trừ admin). Java chỉ kiểm **2 điều đầu**
(`RequestManagementUseCase:213-222`). ⇒ Với Java, một Owner **sai vai trò** hoặc **không được phân quyền
dự án** vẫn được gán làm người duyệt. **CONFIRMED ở mức mã** (chưa kiểm chứng lúc chạy vì phải sửa phân
công thật); đăng ký sửa ở lượt sau.

### 6.7 Lệch VĂN BẢN thông điệp thành công
JS: `… và chuyển tới ${TÊN BƯỚC}.` — Java: `… và chuyển tới bước ${SỐ}.` ⇒ lệch chữ hiển thị.
Chưa sửa vì phải đụng cả nhánh auto hoàn tất và 3 test tích hợp H2 đang khoá văn bản cũ.

## 7. Bài học

1. **Lỗi GHI và lỗi ĐỌC có thể nằm trong CÙNG một tính năng.** Nếu chỉ kiểm "hết HTTP 500" thì lỗi ĐỌC
   vẫn còn nguyên; phép kiểm đủ là **"ghi xong ĐỌC LẠI, đúng CHỖ mà giao diện đọc"**. Đây là lần thứ
   **bảy** dự án gặp lớp lỗi này, và lần thứ **tám** là TASK-044 (thiếu trường trong projection).
2. **Chú thích có thể hứa điều mã không làm.** `RequestStore.insertRequest` ghi *"…+ custom fields…"*
   từ lâu, và **không ai kiểm** — chú thích không phải bằng chứng.
3. **LỖI CỦA CHÍNH TÔI (lần này 2 lỗi, đều do phép đo, không do mã):**
   * Tôi chạy `SELECT … FROM approval_project_assignments` với cột **`stage_no`** — cột thật là `stage`
     — và **đã nuốt `stderr` (`2>$null`)** nên thấy kết quả rỗng rồi **suýt kết luận "MySQL chưa cấu
     hình phân công nào"**. Sự thật: bảng có **5 dòng thật với người thật**. Probe tự báo `TRƯỚC:
     assignments=5` nên lộ ra ngay. **Nuốt stderr là cách tự che mắt.**
   * Phép so `JSON.stringify(a) === JSON.stringify(b)` cho `customFields` **phụ thuộc thứ tự khoá** ⇒
     báo HỎNG oan (dữ liệu hoàn toàn đúng). Đã đổi sang so **sau khi sắp xếp khoá**.
4. **Đối chiếu số liệu phải cùng một TẬP HỢP.** Chênh 12 vs 13 tưởng là lỗi mã, thực ra là do so
   "toàn bộ bảng" với "tập phiếu bootstrap trả về" — và chính chênh lệch đó **phát hiện ra dòng mồ côi
   thật** (6.1). Probe nay **giải thích hết mọi chênh lệch** thay vì bỏ qua.
5. **Probe phải tự chứng minh ĐIỀU KIỆN nghiệp vụ trước khi ghi dữ liệu** — bản đầu cứ thế `INSERT`
   phân công tạm và chết vì **trùng khoá duy nhất**; kiểm tra trước vừa an toàn vừa rẻ.
