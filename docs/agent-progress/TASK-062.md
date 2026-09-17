# TASK-062 — `boqItems` THIẾU HẲN MỘT NỬA DANH SÁCH + `boqSourceItems` thiếu 9 cột + 3 ca lệch `ORDER BY`/`LIMIT`/vai trò

**Trạng thái:** ✅ DONE — mã đã vá, đã kiểm chứng lúc chạy, đã commit `f919c3b`
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Cổng liên quan:** `tools/probe-task062-boq.mjs` (mới) · `tools/probe-column-parity.mjs` (mở rộng)

---

## 1. Vì sao có task này

`probe-column-parity.mjs` (TASK-056/060) so **tập cột** SQL hai phía và còn đúng **2 khoá** thiếu cột:
`boqItems` (17 cột) và `boqSourceItems` (9 cột). Khi bắt tay port, đọc **cả câu SQL** (không chỉ danh sách cột)
mới lộ ra vấn đề lớn hơn nhiều: **thiếu DÒNG**, không phải thiếu cột.

## 2. Phát hiện chính — Java trả 8/16 dòng

JS `:653-655`:

```js
const unmappedSourceRows = … SELECT … FROM boq_source_items … WHERE bsi.active=1 AND bsi.project_boq_item_id IS NULL …
for (const row of unmappedSourceRows) { boqItems.push({...row, materialCode:null, categoryName:null,
  requestedQty:0, …, orderedNotReceivedQty:0,
  varianceContract:-numberValue(row.contractQty), varianceRemeasured:-numberValue(row.remeasuredQty),
  customFields:{…}}); }
boqItems.sort((a,b)=>clean(a.projectCode).localeCompare(clean(b.projectCode))||numberValue(a.sourceOrder)-numberValue(b.sourceOrder));
```

Bản Java cũ **chỉ** có câu chính. Đo trên dữ liệu thật:

| Nguồn | Số dòng trong phạm vi |
|---|---|
| `project_boq_items` đã ánh xạ (câu chính) | **8** |
| `boq_source_items` **chưa ánh xạ** (`project_boq_item_id IS NULL`, batch `active=1`) | **8** |
| **Kỳ vọng `boqItems`** | **16** |
| **Java trả TRƯỚC khi vá** | **8** |

⇒ **một nửa danh sách BOQ chưa bao giờ hiện trên UI**. Đây là lỗi **thiếu DÒNG** — cổng theo *tập cột* **mù** với lớp này
(cột có đủ trên 8 dòng nó trả về, nên cổng vẫn xanh).

## 3. Đã port những gì

### 3.1 `boqItems` — 4 phần JS làm ở tầng ứng dụng

1. **13 cột vô hướng**: `contractLineRef` · `parentSourceOrder` · `outlineLevel` · `sourceSheet` · `sourceRow` ·
   `contractCode` · `contractMaterialName` (`COALESCE(bsi.contract_material_name,pbi.description)`) ·
   `standardMaterialName` (`m.name`) · `variationRef` · `variationApprovedAt` (+ `m.name`, `m.specification` bổ trợ).
2. **7 cột TỔNG HỢP** bằng subquery tương quan: `requestedQty` · `approvedQty` · `orderedQty` · `receivedQty` ·
   `issuedQty` · `installedQty` · `stockQty` — chép **nguyên văn** điều kiện của JS, kể cả **chốt "vật tư duy nhất"**
   `1=(SELECT COUNT(*) FROM project_boq_items p2 WHERE …)`.
3. **3 trường DẪN XUẤT** (JS `:638-643`): `orderedNotReceivedQty = max(0, orderedQty−receivedQty)` ·
   `varianceContract = receivedQty−contractQty` · `varianceRemeasured = receivedQty−remeasuredQty`.
4. **`customFields`** (JS `:636`, `form_key='boq'`, tra bằng **id DÒNG**) **+ gộp dòng nguồn chưa ánh xạ**
   vào cùng mảng với khối lượng 0 và `customFields` rút từ `systemCode`/`subgroupName` nếu không rỗng.
   Sắp xếp lại theo `projectCode` rồi `sourceOrder` (JS `:655`).

### 3.2 `boqSourceItems` — 9 cột thiếu

`id` (không alias — JS trả **cả** `sourceItemId` lẫn `id`) · `contractLineRef` · `contractCode` ·
`contractMaterialName` · `specification` · `versionActive` · `versionStatus` · `versionNo` · `versionCode`.

### 3.3 Ba ca lệch **KHÔNG phải cột** (Known Problems #61)

| Khoá | JS | Java cũ | Hậu quả |
|---|---|---|---|
| `boqImportBatches` | `ORDER BY project_id,contract_id,version_no DESC` (`:647`) | `created_at DESC` | thứ tự lô BOQ sai |
| `boqChangeHistory` | `ORDER BY h.created_at DESC,h.id DESC LIMIT 1000` (`:648`) | thiếu tiebreaker + thiếu LIMIT | bảng lịch sử phình, thứ tự không xác định |
| `workflowAssignments` | `isAdmin ? all(…) : []`, **không lọc dự án** (`:723`) | trả cho **mọi vai trò**, có lọc dự án | **rò rỉ**: tài khoản thường đọc được "ai duyệt bước nào của dự án nào" |

## 4. Kiểm chứng — `tools/probe-task062-boq.mjs` **19/19 ĐẠT**

Phép đo **độc lập**, không chép lại SQL của bản port:

* mục 1 — số dòng: kỳ vọng `8 ⊕ 8 = 16`, Java trả **16**; đúng **8** dòng nguồn chưa ánh xạ được gộp;
* mục 2 — 10 cột vô hướng (trên dòng đã ánh xạ) · 7 cột tổng hợp · 3 trường dẫn xuất + `customFields` **có mặt trên mọi dòng**;
* mục 3 — **giá trị** 7 cột tổng hợp so với SQL viết **KHÁC DẠNG** (`JOIN … GROUP BY` thay vì subquery tương quan):
  **56/56 phép so khớp hoàn toàn**;
* mục 4 — **bất biến** 3 công thức dẫn xuất trên mọi dòng đã ánh xạ;
* mục 5 — dòng nguồn chưa ánh xạ: 8 trường khối lượng = 0 · `materialCode`/`categoryName` = `null` ·
  `varianceContract = −contractQty` · `varianceRemeasured = −remeasuredQty` · `customFields` chỉ chứa khoá có giá trị;
* mục 6 — `boqSourceItems`: **64 phép so theo từng dòng** với MySQL, khớp hoàn toàn;
* mục 7 — 3 ca lệch: `boqImportBatches` **đúng thứ tự JS** · `boqChangeHistory` có tiebreaker + trần 1000 ·
  `workflowAssignments`: admin nhận **5/5** dòng, **`thukydemo` nhận 0 dòng** (hết rò rỉ).

**Hồi quy sau khi build lại jar (90.911.035 B):** bootstrap **100/100** · work-items **18/18** ·
audit-requests **18/18** · owner-checks **10/10** · all-roles **20/20** · cổng tập cột **71 khoá / 0 thiếu / 0 mất độ phủ**.

## 5. Ba bài học (đã ghi vào mã/cổng)

1. **Cổng mất độ phủ mà không báo = cổng nói dối.** Khi `boqItems` chuyển sang mảng ghép, cổng tập cột
   **âm thầm bỏ khoá đó** nhưng vẫn in "KHÔNG khoá nào thiếu cột ✅". Nay cổng có **phần ĐỘ PHỦ**
   (danh sách khoá BẮT BUỘC + sàn số khoá so được) và **tự báo HỎNG** khi mất.
2. **Hai DƯƠNG TÍNH GIẢ của chính cổng** đã vá: (a) **backtick MySQL** bị coi là literal ⇒ `m.` `` ` ``system`` ``
   mất tên cột ⇒ báo thiếu `system` ở 3 khoá; (b) **trùng tên biến giữa các hàm** — tệp JS có **5** khai báo
   `materials` ở 5 hàm, cổng hợp cả 5 ⇒ báo oan `active`/`materialId`/`aliasName`. **Sửa cổng, KHÔNG sửa mã theo số sai.**
3. **Lượt chạy đầu của cổng mới báo 4 HỎNG — cả 4 là lỗi KỲ VỌNG của cổng, không phải lỗi bản port:**
   thiếu lọc phạm vi dự án (DB có 11 dòng BOQ nhưng chỉ 8 thuộc 2 dự án tồn tại) · chuẩn hoá `null`/`NULL`
   (JSON `null` vs MySQL `NULL`) · `tinyint(1)` ra `true/false` ở JSON và `1/0` ở MySQL · đòi khoá vô hướng
   trên cả dòng gộp (JS cũng không có). **Không được "vá Java" theo con số sai của cổng.**

## 6. Giới hạn đã biết (không giấu)

* **Nhánh dự phòng "vật tư duy nhất"** của JS (`mri.boq_item_id IS NULL` + chốt `COUNT(*)=1`) **chưa được cổng
  mô phỏng**: dữ liệu hiện tại có **0** dòng `boq_item_id IS NULL` nên nhánh đó **không chạy**. Cổng tự in
  cảnh báo và **bỏ qua phép so giá trị** nếu dữ liệu đổi. ⇒ Nhánh này ở trạng thái **CONFIRMED-ở-mức-mã, chưa kiểm chứng lúc chạy**.
* **Sắp xếp `localeCompare` (JS) vs `String.compareTo` (Java)** — khác nhau với ký tự ngoài ASCII; mã dự án thực tế là ASCII.
* Cổng **không** so JSON JS↔Java trực tiếp (lõi JS cũ không chạy trên MySQL).
* 7 cột tổng hợp: chỉ **2/16** dòng có giá trị khác 0 trên dữ liệu hiện tại ⇒ phần lớn phép so là `0=0`.
* `boqItems` giữ thêm `pbi.active` (Java-only, JS không chọn) — **cột thừa**, không gây lỗi hiển thị.
* Lớp lệch `ORDER BY`/`LIMIT`/kiểu `JOIN`/`WHERE` **mới rà được 3 khoá** ⇒ **chưa biết quy mô**, cần cổng riêng
  (`probe-clause-parity.mjs`, Known Problems #62).

## 7. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `java-backend/infrastructure/…/persistence/BootstrapDataAdapter.java` | `boqItems` port đủ 4 phần · `boqSourceItems` +9 cột · 3 ca lệch · 2 helper `num()`/`cleanText()` |
| `tools/probe-task062-boq.mjs` | **mới** — cổng kiểm chứng lúc chạy (19 phép kiểm) |
| `tools/probe-column-parity.mjs` | **phần ĐỘ PHỦ** + giải `data.put("K", biến)` + khoá GHÉP + vá 2 dương tính giả (backtick, trùng tên biến) |
