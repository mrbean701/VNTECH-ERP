# TASK-045 — `save_material`: Java **XOÁ HỆ M&E** của mọi mã vật tư khi admin lưu + **không ghi lịch sử đổi mã**

**Trạng thái:** **DONE (phần 1)** — đã sửa + kiểm chứng lúc chạy **14/14 ĐẠT** (trước khi sửa: **6/14**)
**Nguồn phát hiện:** rà `material_code_history` (mục "Rà tiếp" của `MASTER_STATUS.md`, phát hiện kèm 5.2 của TASK-042)
**Ngày:** 17/09/2026 · **Commit:** #63

---

## 1. Chuỗi phát hiện

1. Cổng BẢN ĐỒ GHI: `material_code_history` — **JS ghi, Java ghi 0**; `grep` toàn kho Java: **không một dòng mã nào** nhắc bảng này (chỉ có DDL + tài liệu + schema H2).
2. JS `system-route.mjs:2641`: khi mã gốc đổi, JS **buộc** có `codeChangeReason` (*"Đổi mã gốc phải nhập lý do để lưu lịch sử."*) và **ghi** `material_code_history`.
3. Đọc `MaterialCatalogManagementUseCase.saveMaterial` (Java) thì lộ **lỗi nặng hơn cả lỗi đang tìm**:
   ```java
   m.put("system", blankDefault(trim(payload.get("system")), "KHAC").toUpperCase(Locale.ROOT));
   ```
   Nhưng UI (`app/page.tsx:3769`, `MaterialModal`) gửi `{code, unit, name, brand, minStock, specification, aliasText, codeChangeReason, categoryId, subcategoryId}` — **KHÔNG BAO GIỜ gửi `system`**. JS thì tính `system = canonicalMeCode(category.code)` (`:2631`).
   ⇒ **Mỗi lần admin lưu một mã vật tư, Java ghi `system='KHAC'` — xoá hệ M&E thật.** Đây là lỗi *"port sai NGUỒN DỮ LIỆU"* (Important Decision #9) chứ không phải lỗi cú pháp.
4. Dữ liệu đang chạy có **dấu vết**: 5/14 mã có `system` **không khớp** `canonicalMeCode(mã nhóm)`;
   `DIEN-DAY-CAD-001` (nhóm DIEN) và `CTN-ONG-NHUA-001` (nhóm CTN) đang là **`KHAC`**, `updated_at` **17/09 16:13**.
   *Nguồn ghi cụ thể của 2 dòng đó **KHÔNG xác định được** (không có audit cho `save_material`) — probe của tôi chỉ TẠO mã mới, không sửa mã thật. **KHÔNG tự sửa dữ liệu**; xem mục 5.*
5. Ba dòng còn lại lệch theo kiểu **hoán vị** (`CTN-ONG-NHUA-002`→`DIEN`, `CTN-VAN-001`→`HVAC`, `DIEN-ONG-LUON-001`→`CTN`, `updated_at` 16/09 12:01) — khác hẳn kiểu `KHAC`, nghi là **dữ liệu mẫu/hoán vị có chủ ý**. Cần người dùng xác nhận.

## 2. Bằng chứng LÚC CHẠY trước khi sửa (đối chứng dương của probe)

`tools/probe-task045-save-material.mjs` dựng **một mã TẠM** bằng SQL (`MAT_ZZP045`, nhóm DIEN, `system='DIEN'`)
rồi gọi `save_material` bằng **đúng payload UI**:

| Phép kiểm | Bản Java CŨ | Ý nghĩa |
|---|---|---|
| `save_material` ⇒ HTTP | 200 | vẫn "thành công" nên lỗi **im lặng** |
| `system` sau khi lưu | **DIEN → `KHAC`** | **XOÁ hệ M&E** |
| `min_stock` sau khi lưu | **0** (UI gửi 7) | trường bị bỏ im lặng |
| thiếu ĐVT | **409** *"Dữ liệu vi phạm ràng buộc…"* | Java ghi `unit=NULL` ⇒ MySQL chặn; JS trả 400 nêu rõ trường thiếu |
| `categoryId` không tồn tại | **200** (ghi tham chiếu rác) | không kiểm nhóm tồn tại |
| đổi mã gốc **thiếu lý do** | **200 + mã ĐỔI THẬT** | luật của JS không được thi hành |
| `material_code_history` | **0 dòng** | mất dấu vết đổi mã |

## 3. Đã sửa (phần 1)

| Tầng | Trước | Sau |
|---|---|---|
| `MaterialCatalogManagementUseCase.saveMaterial` | đòi `code`+`name`; `system` lấy từ payload; không kiểm nhóm; bỏ `minStock`; không chặn đổi mã thiếu lý do | port JS `:2607-2643`: đòi **4 trường** (*"Mã vật tư, tên vật tư, ĐVT và hệ M&E là bắt buộc."*); `findCategory` ⇒ *"Hệ M&E không tồn tại."*; nhóm con mặc định `CHUA_PHAN_NHOM` (**tự tạo nếu thiếu**) + kiểm *"Nhóm con không thuộc hệ M&E đã chọn."*; **`system = canonicalMeCode(category.code)`**; ghi `minStock`; đổi mã ⇒ **buộc có lý do** + ghi lịch sử |
| port `MaterialCatalogStore` | — | thêm `insertCodeHistory(...)` |
| `MaterialCatalogStoreAdapter` | `INSERT/UPDATE materials` **không có** `min_stock`; `material_code_history`: **không có câu lệnh nào** | thêm `min_stock` vào cả hai; thêm `insertCodeHistory`; `mergeMaterialMaster` **chuyển lịch sử sang mã đích** (JS `:2670`) |

**Ghi chú kỹ thuật quan trọng:** `findSubcategory` dùng `SELECT *` nên khoá trả về là **tên cột thật** `category_id`, không phải `categoryId` ⇒ phép kiểm nhóm con đã đọc **cả hai** khoá. Bản đầu tôi chỉ đọc `categoryId` nên **chặn oan payload đúng của UI** (probe báo 400 *"Nhóm con không thuộc hệ M&E đã chọn."*) — probe bắt được ngay.

## 4. Kiểm chứng lúc chạy — `tools/probe-task045-save-material.mjs`: **14/14 ĐẠT, exit 0** (trước khi sửa **6/14**)

jar **90.894.035 bytes** (17:10:59) · API PID **19364** · Flyway `validated 16 migrations` · log **0 ERROR**
· regression **59/61** (2 lỗi cũ) · cổng lược đồ **8 phát hiện, toàn bộ nhóm 6**

| Nhóm | Phép kiểm | Kết quả |
|---|---|---|
| Quyền/điều kiện | mã tạm có `system='DIEN'` = `canonicalMeCode('DIEN')` | ĐẠT |
| Lưu | payload UI ⇒ **200** | ĐẠT |
| **Chống hư hỏng** | `system` **GIỮ 'DIEN'** (trước: `KHAC`) | ĐẠT |
| Ghi trường | `min_stock = 7` (trước: 0) | ĐẠT |
| Ghi trường | `brand`/`specification`/`unit`/`name` + nhóm không đổi | ĐẠT |
| Hợp đồng | thiếu ĐVT ⇒ **400** nguyên văn JS | ĐẠT |
| Hợp đồng | nhóm không tồn tại ⇒ **400** *"Hệ M&E không tồn tại."* | ĐẠT |
| Luật JS | đổi mã **thiếu lý do** ⇒ **400** nguyên văn JS | ĐẠT |
| Luật JS | mã **KHÔNG** bị đổi khi thiếu lý do | ĐẠT |
| Lịch sử | đổi mã **có lý do** ⇒ 200 + mã đổi thật | ĐẠT |
| Lịch sử | `material_code_history` **đúng 1 dòng**: old→new + lý do + `changed_by` | ĐẠT |
| Lịch sử | số dòng lịch sử tăng **đúng 1** | ĐẠT |
| Dọn dẹp | `materials`/`material_aliases`/`material_code_history` về **đúng** số dòng ban đầu (14/19/14) | ĐẠT |
| Giới hạn | probe nói rõ **không** kiểm phần rebuild `aliasText` / luật trùng tên | ĐẠT |

## 5. Phát hiện KÈM THEO — chưa sửa, đã đăng ký

### 5.1 Dữ liệu `system` lệch (5/14 mã) — **KHÔNG tự sửa**
`DIEN-DAY-CAD-001` (`KHAC`/nhóm DIEN) · `CTN-ONG-NHUA-001` (`KHAC`/nhóm CTN) khớp cơ chế lỗi vừa chứng minh;
`CTN-ONG-NHUA-002`→`DIEN` · `CTN-VAN-001`→`HVAC` · `DIEN-ONG-LUON-001`→`CTN` nghi là dữ liệu mẫu hoán vị.
**Sau khi vá, admin chỉ cần mở và LƯU lại mã trong màn Danh mục** là `system` được suy lại đúng từ nhóm (tự chữa lành) — nhưng probe **không tự làm** việc đó vì đụng dữ liệu thật.

### 5.2 `save_material` — phần 2 (chưa port)
* **Rebuild alias theo `aliasText`**: JS xoá hết alias của mã rồi tạo lại (bỏ tên gốc, bỏ trùng). Java **không đọc `aliasText`**.
* **Luật trùng tên**: JS chặn tên gốc trùng/tương đương (`normalizeMaterialName`) và chặn alias trùng mã khác (3 thông điệp). Java không có.
* Java **tự tạo alias bằng chính tên gốc** khi tạo mã mới — JS **không** làm vậy (lệch nhỏ về dữ liệu alias).
* Thông điệp thành công: JS *"Đã lưu mã gốc {code} · {name} với N tên tương đương."* — Java *"Đã cập nhật/tạo vật tư {code}."*
* **Audit**: JS gọi `audit(...)` cho `CREATE`/`UPDATE` material; Java **không** (trùng known issue #38).

### 5.3 `merge_material_master` — lệch hành vi (ngoài phạm vi lượt này)
JS **xoá** mã nguồn (`DELETE FROM materials`) và chuyển cả `material_code_history`; Java chỉ đặt `active=0` và **đổi mã thành `<code>_X`**. Nay Java đã chuyển được lịch sử (thêm ở lượt này) nhưng vẫn **giữ** mã nguồn ⇒ cần người dùng quyết định hành vi đúng.

## 6. Bài học

1. **`payload.system` là một cái bẫy cùng họ với `payload.categoryId` (TASK-040 nhóm 3b)**: UI không gửi khoá đó, Java đọc ⇒ **giá trị mặc định ghi đè dữ liệu thật**. Quy tắc: **khi port, phải đối chiếu payload với FORM UI**, không chỉ đối chiếu tên cột.
2. **Lỗi "ghi giá trị mặc định vào cột nghiệp vụ" nguy hiểm hơn lỗi 500**: API trả **200**, không log, không ai biết hệ M&E đã bị xoá. Chỉ phép kiểm **"ghi rồi ĐỌC LẠI đúng trường"** mới bắt được.
3. **Probe nên tự tạo bản ghi TẠM** cho các action sửa danh mục: rẻ, không đụng dữ liệu thật, và vẫn chứng minh được toàn bộ hợp đồng.
4. **`SELECT *` rò tên cột thật** (`category_id` ≠ `categoryId`) — bẫy đã có tiền lệ trong chính tệp này; phép kiểm phải đọc cả hai dạng khoá.
5. **Probe phải được chạy TRƯỚC khi vá** để làm **đối chứng dương**: 6/14 → 14/14 là bằng chứng probe thật sự đo được lỗi, không phải "báo ĐẠT cho có".
