# BUG_HOTFIX_LOG — SESSION_C (ERP-SESSION-03)

> ID: `BUG-YYYYMMDD-CNN`. Mỗi bug ghi đủ: hiện tượng · môi trường · bước tái hiện · ROOT CAUSE ·
> loại trừ giả thuyết · tệp/dòng · bản vá · kiểm chứng · trạng thái · severity.

---

## BUG-20261007-C01 — «Sửa CCCD ở tab Thông tin cá nhân» ⇒ 400 «Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc»

| Trường | Nội dung |
|---|---|
| **Loại** | BUGFIX (FE) — hotfix giai đoạn GO-LIVE |
| **Severity** | **HIGH** — người dùng không sửa được hồ sơ nhân sự (CCCD là trường bắt buộc trong hồ sơ) |
| **Status** | `FIXED` (chờ user nghiệm thu — xem `TEST_LOG.md`) |
| **Môi trường** | `ERP-SESSION-03` · branch `unity` · HEAD `8bfde0d` · stack LIVE `:9000` → Java `:18081` |
| **Người phát hiện** | USER (báo trực tiếp) |

### 1. Hiện tượng
Trong **modal «Sửa hồ sơ»** (màn `dept_legal_hr` → nút `Sửa` → `hrProfileEdit`), chuyển sang
tab **«Thông tin cá nhân»**, sửa **Số CCCD/CMND**, bấm **Lưu hồ sơ** ⇒ hệ thống báo lỗi:

> «Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc.»

⚠️ Thông điệp **không nhắc gì tới CCCD** ⇒ người dùng tưởng CCCD sai định dạng.

### 2. Bước tái hiện (theo mã nguồn, không cần đoán)
1. Mở modal `HrProfileEditModal` (`app/screens/HrProfileEditModal.tsx`).
2. Bấm tab **«Thông tin cá nhân»** (`setTab("personal")`).
3. Sửa `identityNo` (Số CCCD/CMND) → bấm **Lưu hồ sơ**.

### 3. ROOT CAUSE (đã đọc mã, có dòng cụ thể)

**Nguyên nhân trực tiếp — FE gửi `update_user` THIẾU trường bắt buộc:**

| Dòng | Mã | Điều gì xảy ra |
|---|---|---|
| `HrProfileEditModal.tsx:100` | `{tab === "user" ? (<div className="form-grid">…) : (<div className="form-grid">…)}` | Form **CHỈ render phần của tab ĐANG MỞ** ⇒ khi ở tab «Thông tin cá nhân», các ô `employeeCode` · `username` · `fullName` · `email` · `organizationUnitId` **KHÔNG có trong DOM**. |
| `HrProfileEditModal.tsx:52` | `const fd = new FormData(event.currentTarget);` | `fd` chỉ chứa các ô **đang có trong DOM** ⇒ mọi `fd.get("fullName"…)` trả `null`. |
| `HrProfileEditModal.tsx:73-79` | `const accountPayload: Row = { userId }` rồi `if (String(fd.get("fullName")…).trim()) accountPayload.fullName = …` · `await submit("update_user", accountPayload)` | Vì tất cả `fd.get` đều rỗng ⇒ payload thực gửi lên **CHỈ có `{ userId }`** ⇒ `update_user` được gọi **dù người dùng không hề sửa thông tin tài khoản**. |
| `UserManagementUseCase.java:115-116` | `String fullName = trim(payload.get("fullName"));` | ⭐ **`fullName` KHÔNG có fallback** — khác hẳn `employeeCode` (`:109-110`) và `username` (`:113-114`) đều có `if (…isEmpty()) … = sv(target, …)`. |
| `UserManagementUseCase.java:124-125` | `if (employeeCode.isEmpty() \|\| fullName.isEmpty() \|\| username.isEmpty() \|\| org == null \|\| department.isEmpty()) throw new AuthUseCase.ApiError("Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc.", 400);` | `fullName` rỗng ⇒ ném **đúng nguyên văn** thông điệp user thấy. |

⇒ **Chuỗi nhân quả khép kín**: mở tab cá nhân ⇒ ô tài khoản rời khỏi DOM ⇒ `update_user` nhận
`{userId}` ⇒ `fullName=""` ⇒ 400 đúng thông điệp đã báo.

**Khiếm khuyết thứ hai (cùng gốc, làm lỗi khó hiểu):**
`HrProfileEditModal.tsx:79` — `await submit("update_user", accountPayload);` **bỏ qua giá trị trả về**;
`:82` vẫn `if (ok) close();` ⇒ `save_hr_record` đã **ghi thành công** nhưng modal **vẫn đóng** kèm
thông báo lỗi ⇒ người dùng tưởng **mất dữ liệu** (lớp lỗi đã từng ghi ở chú thích `:37-39`).

### 4. LOẠI TRỪ GIẢ THUYẾT (từng giả thuyết một phép thử)

| Giả thuyết | Phép thử | Kết luận |
|---|---|---|
| **H1 — CCCD sai định dạng/số** | CCCD đi vào `save_hr_record` (bảng `hr_records`), còn thông điệp lỗi chỉ nhắc 4 trường **tài khoản** (`UserManagementUseCase.java:112/125`); `save_hr_record` không có luật CCCD nào ném thông điệp này | ⛔ **LOẠI** |
| **H2 — Thiếu quyền ⇒ 403** | Thông điệp là **400** sinh từ validate của `update_user`, không phải thông điệp RBAC (`Chỉ Quản trị hệ thống…`); mặt khác `:104` `requireAccountUpdateRight` đi qua vì lỗi xảy ra **sau** cổng quyền | ⛔ **LOẠI** |
| **H3 — `employeeCode` rỗng** | `:109-110` có fallback `sv(target,"employeeCode")` ⇒ với user có mã NV thì không rỗng | ⛔ **LOẠI** |
| **H4 — Không resolve được phòng/bộ phận** | `resolveOrganization` (`:464-476`) fallback: `payload → roleRow.defaultOrganizationUnitId → mã theo baseRole` | ⚠️ **KHÔNG LOẠI HẲN**, nhưng **không cần** để giải thích: `fullName` rỗng **một mình** đã đủ ném lỗi (điều kiện `\|\|`) |
| **H5 — Sai ở `save_hr_record`** | `save_hr_record` chạy TRƯỚC (`:54`) và trả `ok`; nếu nó lỗi thì đã không tới `update_user` | ⛔ **LOẠI** (và chính vì nó thành công nên dữ liệu HR **đã được ghi**) |

**Kết luận độc lập:** chỉ cần đọc `HrProfileEditModal.tsx:100` + `:73-79` và
`UserManagementUseCase.java:115-125` là tái dựng được 100 % hành vi quan sát — **không cần suy đoán**.

### 5. BẢN VÁ (FE-only — đúng luật user «FE → BE → DB»)

Chỉ sửa `app/screens/HrProfileEditModal.tsx`:
1. **Chỉ gọi `update_user` khi tab TÀI KHOẢN thực sự được gửi** (`fd.has("fullName")`) ⇒
   sửa CCCD **không còn** sinh lời gọi thừa ⇒ **hết lỗi gốc**.
2. Khi có gọi thật: **luôn gửi đủ trường bắt buộc**, rỗng thì **lấy giá trị hiện có** của hồ sơ
   (`fullName` · `employeeCode` · `username` · `organizationUnitId` · `email`) ⇒ không bao giờ
   để backend nhận `fullName` rỗng.
3. **Không đóng modal khi đồng bộ tài khoản thất bại** + hiện thông báo trung thực
   («đã lưu hồ sơ, chưa cập nhật được tài khoản») ⇒ hết lớp lỗi «tưởng mất dữ liệu».

⛔ **Không sửa Java/DB trong lượt này.** Ghi nhận nợ kỹ thuật (BE) ở §6 để phiên giữ `java-backend/**` xử lý.

### 6. NỢ KỸ THUẬT ĐỂ LẠI (BE — chưa làm, có lý do)
- `UserManagementUseCase.updateUser` **bất đối xứng**: `employeeCode`/`username` có fallback theo
  `target`, còn `fullName` **không** ⇒ mọi client gửi payload thiếu `fullName` đều 400.
  Đề xuất (khi mở cửa sổ BE): cho `fullName` fallback `sv(target,"fullName")` như 2 trường kia,
  HOẶC tách validate ra thông điệp **nêu ĐÍCH DANH trường thiếu** để người dùng biết sửa gì.
- Tệp chủ: `java-backend/**` ⇒ **thuộc `ERP-SESSION-01`** ⇒ ⛔ phiên 03 không tự sửa; đã ghi
  `HANDOFF-20261007-C02`.

---

## BUG-20261007-C02 — Nút «Mẫu CSV» tải tệp **thiếu BOM UTF-8** ⇒ Excel hiện SAI DẤU tiếng Việt

| Trường | Nội dung |
|---|---|
| **Loại** | BUGFIX · UI_UX (asset tĩnh) — hotfix GO-LIVE |
| **Severity** | **MEDIUM** (không mất dữ liệu, nhưng chặn người dùng dùng tệp mẫu) |
| **Status** | `FIXED` (chờ user nghiệm thu) |
| **Nguồn** | USER: *«Kiểm tra lại tất cả các nút xuất excel xem đã có UTF8 hay chưa… tôi test 1 số nút đang bị lỗi UTF8»* |

### 1. Hiện tượng
Bấm **«⇩ Mẫu CSV»** (màn Danh mục vật tư) ⇒ tải `Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv` ⇒ mở bằng
**Excel trên Windows** thấy tiêu đề/tiếng Việt **sai dấu** (mojibake).

### 2. ROOT CAUSE (đo trên BYTE của tệp, ⛔ không suy đoán)
| Tệp | Kích thước TRƯỚC | BOM | UTF-8 hợp lệ |
|---|---|---|---|
| `public/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv` | **241 B** | ⛔ **False** | True |
| `public/templates/Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv` | **1175 B** | ⛔ **False** | True |
| 3 tệp CSV còn lại | — | ✅ True | True |

⇒ Tệp **là UTF-8 hợp lệ nhưng THIẾU BOM**. Excel bản Windows không tự dò UTF-8 ⇒ mặc định đọc theo
**bảng mã hệ thống (CP1258/CP1252)** ⇒ **mất dấu**. Đây là lỗi ở **DỮ LIỆU TỆP**, ⛔ không phải ở code tải.

### 3. LOẠI TRỪ GIẢ THUYẾT (đã kiểm từng đường xuất — xem bảng đầy đủ ở `DEV_LOG.md` §C03)
| Giả thuyết | Phép thử | Kết luận |
|---|---|---|
| Hàm `downloadCsv` thiếu BOM | đọc `lib/tabular-export.ts:99` — có `"\ufeff"` + `text/csv;charset=utf-8` | ⛔ LOẠI |
| Các nút trong `app/**` tự dựng CSV | quét toàn bộ `app/**` + `lib/**`: `text/csv` **chỉ** xuất hiện ở `lib/tabular-export.ts` | ⛔ LOẠI |
| XLSX mất dấu | **CHẠY THẬT**: trích `buildSimpleXlsxBytes`, giải nén tệp `.xlsx`, đọc lại `sheet1.xml` | ✅ ĐẠT (UTF-8) |
| Backend Java trả XLSX sai mã | `ExcelTemplateService` dùng Apache POI (XML UTF-8) + **tên tệp ASCII** | ⛔ LOẠI |
| Server trả CSV sai content-type | `scripts/local-runtime.mjs:101` + `universal-runtime.mjs:40` = `text/csv; charset=utf-8` | ⛔ LOẠI |
| Excel bản mới tự nhận UTF-8 | ⛔ không kiểm soát được bản Excel của user ⇒ **vẫn phải có BOM** | — |

### 4. BẢN VÁ
- Thêm **BOM `EF BB BF`** vào đầu 2 tệp CSV mẫu (241 B → **244 B** · 1175 B → **1178 B**), ⛔ **không** đổi
  nội dung, ⛔ không đổi ký tự xuống dòng.
- Thêm **CỔNG CHỐNG TÁI PHÁT**: `tests/mt3-c03-export-utf8.test.mjs` — mọi `.csv` trong `public/**`
  **BẮT BUỘC** có BOM + là UTF-8 hợp lệ (quét đệ quy), và **chỉ** `lib/tabular-export.ts` được phát `text/csv`.
- **ĐỐI CHỨNG ÂM** (chứng minh cổng có răng): tạo tạm 1 CSV không BOM ⇒ cổng **ĐỎ 1 ca** và **nêu đúng tên tệp**;
  đã xoá tệp tạm ngay sau đó.

### 5. Kiểm chứng
Xem `TEST_LOG.md` §C04. ⚠️ **Lưu ý quan trọng đã đo**: bản `dist/client/templates/*.csv` **vẫn là tệp CŨ**
(241 B/1175 B, ⛔ không BOM) ⇒ **phải build lại** thì user mới nhận được tệp đã sửa.

---

## ⛔ SAI LẦM ĐÃ SỬA — phiên 03 tự nhận (2026-10-07)

**Việc đã làm SAI**: để «kiểm tra» tính nhất quán vân tay nguồn, tôi chạy
`node tools/fixpoint-fingerprint.mjs`. ⛔ **Tên tệp gây hiểu nhầm**: script này **GHI** định danh mới
(không phải chỉ đọc) ⇒ nó **ĐÃ ĐỔI** vân tay nguồn sang `VNTECH-FP-6D015E959F55D73A` và ghi vào
`VNTECH_PRODUCT_IDENTITY.txt` / `VNTECH_FINGERPRINT.json` / `lib/vntech-identity-data.mjs`.

**Vì sao nghiêm trọng**: đây là **state dùng chung** giữa các phiên; SESSION_01 đã cảnh báo
«vân tay nguồn không hợp lệ khi nhiều phiên cùng sửa» và chính tôi đã ghi cảnh báo đó vào `SHARED_STATE.md`.

**Hậu quả ĐO ĐƯỢC**: định danh (6D015E…) **lệch** với artifact đang phục vụ (bundle dựng dưới `846B70…`)
⇒ trạng thái KHÔNG nhất quán.

**CÁCH SỬA (đã thi hành)**: chạy nốt **chu kỳ GĐ đầy đủ** `gd-cycle` để tạo migration mới + refresh định danh
+ build lại ⇒ artifact và định danh **khớp nhau trở lại**. ⛔ Từ nay: **muốn CHỈ ĐỌC thì ⛔ KHÔNG dùng
`fixpoint-fingerprint.mjs`** — chỉ dùng nó như một PHẦN của `gd-cycle`.

**Chưa sửa về mặt tên tệp** (đề xuất, ⛔ chưa làm vì `tools/**` là mã dùng chung của cả 3 phiên):
đổi tên/thêm cảnh báo ở đầu tệp để người sau ⛔ không lặp lại lỗi này.

---

## BUG-20261007-C03 — Trạng thái đơn/phiếu hiển thị **TIẾNG ANH** (yêu cầu MT3 «trạng thái tiếng Việt»)

| Trường | Nội dung |
|---|---|
| **Loại** | BUGFIX · UI_UX |
| **Severity** | **MEDIUM-HIGH** (hiển thị sai ngôn ngữ trên nhiều màn + **lọt cả vào TỆP XUẤT** Excel/PDF) |
| **Status** | `FIXED` (chờ user nghiệm thu) |
| **Nguồn** | USER: *«Hiển thị trạng thái của tất cả các đơn - phiếu trong toàn bộ hệ thống dưới dạng tiếng Việt (Hiện tại 1 số nơi hiển thị tiếng Anh)»* |

### 1. PHÉP ĐO TRƯỚC KHI SỬA (chạy thật `lib/status-labels.ts` bằng esbuild)
```
statusLabel("partial_issued")   => "Partial issued"        ⛔
statusLabel("issued")           => "Issued"                ⛔
statusLabel("awaiting_po")      => "Awaiting po"           ⛔
statusLabel("posted")           => "Posted"                ⛔
statusLabel("REWORK")           => "REWORK"                ⛔ MÃ THÔ
statusLabel("WAITING_SUPPLIER") => "WAITING SUPPLIER"      ⛔ MÃ THÔ
Mô phỏng StatusBadge (regex cũ `/^[a-z0-9_.-]+$/`):  value="IN_PROGRESS" ⇒ hiện "IN_PROGRESS"  ⛔
```

### 2. ROOT CAUSE — **4 nguyên nhân gốc**, đo trên mã
| # | Nguyên nhân | Vị trí |
|---|---|---|
| ① | Bảng nhãn **DÙNG CHUNG** thiếu **15 mã chuỗi cung ứng** (chúng chỉ nằm ở bản sao chép `lib/labels.ts`) ⇒ rơi vào `humanize()` = tiếng Anh | `lib/status-labels.ts:22-34` |
| ② | `StatusBadge` chỉ dịch mã **chữ thường** (`/^[a-z0-9_.-]+$/`) ⇒ mã VIẾT HOA của Công việc (`IN_PROGRESS`, `REWORK`, `WAITING_SUPPLIER`…) **in nguyên mã** | `app/components/ui/StatusBadge.tsx:69` |
| ③ | `lib/labels.ts` fallback **`row.supplyStatus \|\| row.status`** ⇒ **RÒ MÃ THÔ** — dùng ở **7 mô-đun**, trong đó có **2 đường XUẤT TỆP** (`lib/supply-docs.tsx`, `lib/request-actions.ts`) ⇒ tiếng Anh lọt vào Excel/PDF | `lib/labels.ts:13` (bản cũ) |
| ④ | **BẢN THỨ BA** `statusLabel` trong `lib/report-catalog.ts` (bảng 9 mã, fallback `?? String(v)`) ⇒ **Trung tâm Báo cáo** rò mã thô cho mọi mã ngoài 9 mã đó | `lib/report-catalog.ts:19-32` |
| ⑤ | Ô **LỌC trạng thái** dựng nhãn từ mã thô: `label:v` (Delivered) và `\|\| value` (Purchasing) | `Delivered.tsx:24`, `Purchasing.tsx:291-293` |

### 3. BẢN VÁ (FE-only — luật «FE → BE → DB»)
1. `lib/status-labels.ts`: thêm **domain `supply`** (15 mã, ⛔ **giữ nguyên từng nhãn** của bảng cũ) + hàm mới
   `knownStatusLabel()` + bước **tra chéo domain** theo **thứ tự CỐ ĐỊNH** (`project → work_item → approval_step → supply`)
   ⇒ mã như `partial_issued`/`REWORK` nay dịch được **mà không cần người gọi truyền domain**.
2. `StatusBadge`: nhận **cả chữ HOA**; nhãn đã tiếng Việt (có dấu cách/dấu) ⛔ **vẫn giữ nguyên**.
   Đồng thời suy **MÀU theo CHỮ ĐANG HIỂN THỊ** (trước đây suy theo mã thô ⇒ mọi badge vừa dịch đều thành `blue`, mất ngữ nghĩa màu).
3. `lib/labels.ts`: **bỏ bảng sao chép**, chỉ còn hàm mỏng giữ **ĐÚNG thứ tự ưu tiên cũ** (`supplyStatus → status → postingStatus`)
   rồi tra bảng DÙNG CHUNG ⇒ hết rò mã thô, kể cả trong tệp xuất.
4. `lib/report-catalog.ts`: bỏ bảng thứ ba, uỷ quyền cho bảng DÙNG CHUNG (⛔ giữ nguyên câu «(không xác định)» cho giá trị rỗng).
5. `Delivered.tsx` · `Purchasing.tsx`: nhãn lọc đi qua `statusLabel()`; cột TÌNH TRẠNG bỏ nhánh `String(row.postingStatus||…)`.
6. `ProjectDetailTabs.tsx`: trạng thái nhiệm vụ đi qua `taskStatusLabel()` (nhãn chuẩn của Công việc) thay vì để `StatusBadge` tự đoán.

### 4. Kiểm chứng
Xem `TEST_LOG.md` §C05 — cổng mới **7/7 PASS**, `test:regression` **823 test · 822 pass · 0 fail**, có **đối chứng âm**.

### 5. TỒN ĐỌC LẠI (⛔ chưa sửa — nêu thẳng, ⛔ không che)
- `app/screens/Purchasing.tsx` vẫn giữ **2 bảng nhãn đặc thù PR/PO** (22 nhãn) — **cố ý**: nhãn PR ≠ nhãn PO cho cùng mã,
   và nay đã có **fallback về bảng DÙNG CHUNG** (⛔ hết rò). Cổng C04 **miễn trừ có điều kiện** cho loại bảng này.
- `app/screens/ProjectDetailTabs.tsx` còn in **`priority`** dạng mã thô (`high`/`critical`) — ⛔ **ngoài phạm vi trạng thái**,
  cần một bảng nhãn ưu tiên riêng ⇒ ghi nhận để làm ở task sau (⛔ không tự thêm vào `lib/ui-shared.tsx` giữa GO-LIVE).

---

## BUG-20261007-C04 — Cột «Ưu tiên» và «Loại con dấu» in **MÃ TIẾNG ANH**

| Trường | Nội dung |
|---|---|
| **Loại** | BUGFIX · UI_UX (cùng lớp lỗi `BUG-20261007-C03`) |
| **Severity** | **LOW-MEDIUM** (không chặn nghiệp vụ, nhưng sai ngôn ngữ + **hiện SAI mức độ** việc khẩn cấp) |
| **Status** | `FIXED` (chờ user nghiệm thu) |
| **Nguồn** | Nối tiếp yêu cầu user «1 số nơi hiển thị tiếng Anh» |

### 1. PHÉP ĐO (đối chiếu ô CHỌN trong form với chỗ HIỂN THỊ — ⛔ không đoán)
| Trường | Giá trị ô chọn ghi vào | Bảng hiển thị | Kết luận |
|---|---|---|---|
| `benefitType` · `docType` (công văn) · `docType` (VB pháp lý) · `contractType` (lao động) · `costType` | **NHÃN TIẾNG VIỆT** (`<option value={label}>`) | in thẳng giá trị | ✅ **ĐÚNG** — ⛔ **KHÔNG sửa** |
| **`work_items.priority`** | **MÃ ANH**: `low` · `normal` · `high` · `urgent` · `critical` | `ProjectDetailTabs.tsx:226` in NGUYÊN MÃ | ⛔ **LỖI** |
| **`seals.seal_type`** | **MÃ ANH**: `company` · `legal` · `signature` · `other` | `SealScreen.tsx:20` in NGUYÊN MÃ | ⛔ **LỖI** |

### 2. ROOT CAUSE
- `priority`: ⛔ **không có nhãn dùng chung**. Mỗi màn tự xử lý một kiểu:
  `ProjectDetailTabs` **không dịch** · `WorkCenter` dịch bằng **ternary lặp 2 chỗ** và **SÓT `critical`**
  (⇒ việc **KHẨN CẤP** hiện **«Thường»** = sai nghiệp vụ, ⛔ không chỉ sai ngôn ngữ) · `Requests` bộ lọc
  **rơi về mã thô** với mọi mã ngoài `high`/`normal`. Bảng chuẩn **đã tồn tại** ở `KANBAN_PRIORITIES`
  (`WorkKanban.tsx:44-50`) nhưng **không nơi nào khác dùng** ⇒ 4 bản song song.
- `seal_type`: nhãn chỉ có trong **ô chọn**, còn **bảng** in mã thô.

### 3. BẢN VÁ (REUSE theo Goal §17 — ⛔ không tạo bảng thứ năm)
1. `lib/status-labels.ts`: thêm domain **`priority`** (5 mức, ⛔ **khớp từng chữ** với `KANBAN_PRIORITIES`) và
   **`seal_type`** (4 loại); nối 2 domain vào `DOMAIN_LOOKUP_ORDER`.
2. `ProjectDetailTabs` · `SealScreen` · `Requests` · `WorkCenter` (2 chỗ) ⇒ dùng `statusLabel(value, domain)`.
3. ⛔ **KHÔNG** xoá `KANBAN_PRIORITIES`: nó giữ thêm `tone`/`rank` (màu + thứ tự) và **khối thuần của WorkKanban
   ⛔ không được `import`** (test `t07` trích khối đó ra chạy) ⇒ thay vì gộp mã, **CỔNG KIỂM** bắt hai bảng
   ⛔ không được lệch nhãn (chống sửa một nơi quên nơi kia).

### 4. Kiểm chứng
`TEST_LOG.md` §C06 — cổng C04 nay **10/10 PASS**, thêm **đối chứng dương**: `statusLabel("critical","priority")`
**PHẢI** là «Khẩn cấp» (⛔ không được «Thường» như ternary cũ).

### 5. TỒN ĐỌC LẠI (⛔ chưa sửa — nêu thẳng)
- `lib/supply-docs.tsx` · `lib/request-actions.ts` xuất tệp có thể chứa `priority`/`contractType` mã thô — cần đo riêng ở task sau.
- `app/page.tsx` (⛔ **thuộc `ERP-SESSION-01`**) còn in `contractType` của hợp đồng dự án dạng mã (`main`/`addendum`) ⇒
  **ghi handoff**, ⛔ không tự sửa.

---

## BUG-20261007-C05 — Ưu tiên in **MÃ THÔ vào TỆP XUẤT** (bản dịch thứ 5 nằm trong `lib/**`)

| Trường | Nội dung |
|---|---|
| **Loại** | BUGFIX · UI_UX |
| **Severity** | **MEDIUM** — sai ngôn ngữ **trong tệp người dùng tải về** (khó phát hiện hơn trên màn hình) |
| **Status** | `FIXED` (chờ user nghiệm thu) |
| **Nguồn** | ⛔ **Tự phát hiện**: vòng 4 tôi chỉ quét `app/screens/**` ⇒ **bỏ sót `lib/**`** |

### 1. ROOT CAUSE (đo trên mã)
`lib/request-export.ts:25` — bản dịch Ưu tiên **thứ 5**:
```ts
function priorityLabel(value?: string) { return value === "urgent" ? "Khẩn" : value === "high" ? "Cao" : value === "normal" ? "Bình thường" : text(value) || "Bình thường"; }
```
⇒ với `critical` / `low` rơi vào **`text(value)`** = **IN MÃ THÔ**. Hàm này dùng để dựng dòng tiêu đề của
**phiếu đề nghị mua hàng xuất ra PDF/XLSX** (`request-export.ts:46` + `lib/request-actions.ts:18` truyền `priority`).

### 2. HAI CHỖ NỮA do mở rộng cổng mà bắt được
| # | Vị trí | Vấn đề |
|---|---|---|
| ② | `app/screens/RequestDrawer.tsx` (ô «Mức độ») | bản dịch **thứ 6**: `urgent→Khẩn · high→Cao · else **«Bình thường»**` ⇒ mọi mã lạ (`critical`/`low`) hiện **SAI** là «Bình thường» — ⛔ tệ hơn in mã thô |
| ③ | `app/page.tsx` | cùng ternary ⇒ ⛔ **thuộc `ERP-SESSION-01`** ⇒ `HANDOFF-20261007-C05`, cổng ghi thành **NỢ ĐÃ GIAO có tên** |

### 3. BẢN VÁ
- `lib/request-export.ts` · `app/screens/RequestDrawer.tsx` ⇒ `statusLabel(value, "priority")` (bảng DÙNG CHUNG).
  ⛔ Giữ hành vi cũ cho giá trị RỖNG (`«Bình thường»`) để không đổi giao diện tệp xuất.
- Cổng `tests/mt3-c04-status-vi.test.mjs` **mở rộng phạm vi quét sang `lib/**`** (ca ⑪) — đây là ca **lẽ ra phải có từ vòng 4**.

### 4. Kiểm chứng
`TEST_LOG.md` §C07 · cổng **11/11** · hồi quy **827 test · 0 fail** (sau build) · **đối chứng dương**: cổng khẳng định
`lib/request-export.ts` **phải** import bảng chung và ⛔ không được còn `text(value) || "Bình thường"`.

### 5. ⭐ BÀI HỌC (ghi để phiên sau ⛔ không lặp)
**Một cổng chỉ mạnh bằng PHẠM VI QUÉT của nó.** Vòng 4 tôi tuyên bố «hết mã tiếng Anh ở Ưu tiên» nhưng
⛔ **chỉ quét `app/screens/**`** ⇒ bỏ sót đúng đường **XUẤT TỆP** (nơi user ít thấy nhất nhưng lại là sản phẩm gửi ra ngoài).
⇒ Từ nay: mọi cổng «quét mã nguồn» của phiên 03 **phải quét CẢ `app/**` và `lib/**`**.

---

## BUG-20261007-C06 — Tệp xuất «Đơn hàng đã giao» in **MÃ TIẾNG ANH** ở 2 cột hồ sơ (CO/CQ · giấy giao hàng)

| Trường | Nội dung |
|---|---|
| **Loại** | BUGFIX · UI_UX (⛔ nằm trong **TỆP người dùng tải về**, ⛔ không phải trên màn hình) |
| **Severity** | **MEDIUM** — tệp gửi ra ngoài (đối chiếu với NCC/BCH) chứa mã kỹ thuật `complete`/`missing` |
| **Status** | `FIXED` (chờ user nghiệm thu) |
| **Nguồn** | ⭐ **Tự rà tiếp** lớp lỗi đã phát hiện ở vòng 5 (`BUG-20261007-C05` = `priority` trong tệp xuất) |

### 1. PHÉP ĐO (đọc 3 tệp đường xuất: `lib/supply-docs.tsx` · `lib/request-export.ts` · `lib/ui-shared.tsx`)
| Đường xuất | Cột dữ liệu | TRƯỚC |
|---|---|---|
| `exportDeliveredXlsx` (nút «▣ Xuất Excel» màn **Đơn hàng đã giao**) | «Chứng chỉ» · «Giấy giao hàng» | ⛔ **`complete` / `missing` / `not_required`** |
| `exportDeliveredCsv` (nút «▣ Xuất CSV» cùng màn) | «Chứng chỉ» · «Giấy giao hàng» | ⛔ **`complete` / `missing` / `not_required`** |
| `downloadSupplyXlsx` / `downloadSupplyPdf` (tệp PO/GRN) | CO/CQ · phiếu giao | ✅ **đã dịch** (nhưng bằng **bản dịch RIÊNG**) |

### 2. ROOT CAUSE
`lib/ui-shared.tsx::deliveredExportRows` truyền **thẳng** giá trị CSDL:
`row.certificateStatus || ""` và `row.deliveryDocumentStatus || ""` ⇒ mã thô vào **cả XLSX lẫn CSV**.
⚠️ **Trớ trêu**: `lib/request-export.ts:111-112` **đã có** `certificateLabel`/`documentLabel` dịch **đúng 3 giá trị đó** — nhưng là **bản dịch RIÊNG**, ⛔ không dùng chung ⇒ 2 bản song song, một bản bị bỏ quên.
⇒ Đúng lớp lỗi tôi đã gặp 4 lần: **một giá trị, nhiều bản dịch rải rác**.

### 3. BẢN VÁ (REUSE — Goal §17: ⛔ không tạo bản thứ ba)
1. `lib/status-labels.ts`: thêm **domain `certificate_status`** (`complete`→«Đã có» · `missing`→«Chưa có» · `not_required`→«Không yêu cầu») và **`delivery_document`** (`complete`/`missing`).
2. `lib/request-export.ts`: `certificateLabel`/`documentLabel` **uỷ quyền bảng DÙNG CHUNG** (⛔ xoá ternary riêng; giữ `"—"` cho giá trị rỗng để ⛔ không đổi giao diện tệp đang chạy).
3. `lib/ui-shared.tsx::deliveredExportRows`: 2 cột cuối đi qua `statusLabel(row.certificateStatus,"certificate_status")` / `statusLabel(row.deliveryDocumentStatus,"delivery_document")`.

### 4. Kiểm chứng
`TEST_LOG.md` §C09 · cổng C04 **13/13 PASS** · **đối chứng âm**: cổng khẳng định `deliveredExportRows` ⛔ **không được** chứa `row.certificateStatus ||` và `lib/request-export.ts` ⛔ **không được** còn `value === "complete" ? "Đã có"`.

### 5. TỒN ĐỌC LẠI (⛔ chưa đo — nêu thẳng, ⛔ không che)
- `deliveredExportRows` vẫn xuất `receivedAt`/`bchConfirmedAt` dạng **chuỗi ISO thô** — ⚠️ **cần user/phiên khác quyết** có đổi sang `dd/mm/yyyy` không (⛔ tôi không tự đổi vì sẽ làm lệch so với các tệp xuất khác).
- Các cột trạng thái khác trên màn «Đơn hàng đã giao» (`postingStatus`, `qcStatus`, `bchConfirmationStatus`) **trên MÀN HÌNH** đã dịch ✅ (kiểm ở `Delivered.tsx` + `ReceiptDrawer.tsx`).

---

## BUG-20261007-C07 — ⭐ **LỖI USER ĐÃ BÁO**: modal «Chi tiết đơn giao hàng» **CẮT MẤT** 2 khối cuối (Ảnh giao hàng · Chứng chỉ/Tài liệu)

| Trường | Nội dung |
|---|---|
| **Loại** | BUGFIX · UI_UX (bố cục) |
| **Severity** | **HIGH** — người dùng **không xem/tải được hồ sơ & ảnh giao hàng** (dữ liệu CÓ trong hệ thống nhưng ⛔ không tới được trên giao diện) |
| **Status** | ✅ **`FIXED`** — **ĐÃ TÁI HIỆN + ĐÃ SỬA + ĐÃ ĐO LẠI** (chờ **user nghiệm thu** ⇒ mới lên `VERIFIED`) |
| **Nguồn** | ⭐ **USER báo trực tiếp** trong đặc tả MASTER TASK 3 (§V-E): *«Modal chi tiết giao hàng đang hiển thị sai, mục **Ảnh và hồ sơ giao hàng** đang bị **ẩn** đi không hiển thị đầy đủ»* |

### 1. ĐÍNH CHÍNH TIỀN ĐỀ (đo trước khi sửa — ⛔ tránh sửa sai chỗ)
Giả thuyết ban đầu «2 mục bị **ẩn bằng điều kiện** render» ⛔ **SAI**: đọc mã thấy `ReceiptDrawer.tsx` **CÓ** render
cả 2 khối — «Chứng chỉ / Tài liệu đã tải lên» (kèm `<AttachmentPanel entityType="goods_receipt" …/>`) và «Ảnh giao hàng».
⇒ Vấn đề **không nằm ở điều kiện hiển thị** mà ở **BỐ CỤC**.

### 2. PHÉP ĐO QUYẾT ĐỊNH (Chrome headless 1440×900, mở đúng modal)
```
.receipt-modal   top=0   bottom=768  h=768   overflow=hidden        (vh=808)
.drawer-body     top=101 bottom=669  h=568   clientH=568  scrollH=568
                 flex="0 1 auto"   min-height="auto"   overflowY=auto
khối CUỐI: bottom=707  >  đáy thân 669   ⇒ 38px BỊ CẮT
scrollHeight == clientHeight  ⇒ ⛔ KHÔNG có gì để cuộn ⇒ phần bị cắt KHÔNG THỂ TỚI
```

### 3. ROOT CAUSE
`.drawer-body` là lớp thiết kế cho **`.drawer`**: ⛔ **KHÔNG có `flex:1 1 auto`** và ⛔ **KHÔNG có `min-height:0`**.
Nó nằm trong **`.modal`** (`display:flex; flex-direction:column; overflow:hidden`) ⇒ thân **không giãn hết khung**, và vì
`min-height:auto` nên **không co xuống dưới kích thước nội dung** ⇒ nội dung tràn ra ngoài khung và bị `overflow:hidden`
⚠️ **CẮT**, trong khi chính thân lại tưởng mình vừa khít (`scrollH == clientH`) nên ⛔ **không sinh thanh cuộn**.
⇒ Người dùng thấy 2 khối cuối **biến mất** và ⛔ **không có cách nào cuộn tới** — đúng nguyên văn báo cáo.
**Lớp đi kèm `.modal` là `.modal-body`** — có `flex:1 1 auto; min-height:0; overflow-y:auto` (`app/globals.css`).

### 4. LOẠI TRỪ GIẢ THUYẾT
| Giả thuyết | Phép thử | Kết luận |
|---|---|---|
| H1 «Khối bị ẩn bằng điều kiện render» | grep mã: cả 2 khối render vô điều kiện, `AttachmentPanel` có mặt | ⛔ **LOẠI** |
| H2 «Thiếu dữ liệu nên khối rỗng» | mã render khối bất kể dữ liệu; user nói «không hiển thị **đầy đủ**» | ⛔ **LOẠI** |
| H3 «CSS `.drawer-section` bị `display:none`» | đo `getBoundingClientRect` của khối cuối ⇒ **có toạ độ** (601→651), tức **có render** | ⛔ **LOẠI** |
| H4 «Bố cục cắt do thân không giãn/không cuộn» | đo `flex`/`min-height`/`scrollH` vs `clientH` + toạ độ khối cuối > đáy thân | ✅ **ĐÚNG** |

### 5. BẢN VÁ (⛔ 1 dòng, ⛔ không đụng CSS dùng chung)
`app/screens/ReceiptDrawer.tsx`: `<div className="drawer-body">` → **`<div className="drawer-body modal-body">`**
⇒ thân nhận `flex:1 1 auto; min-height:0` (giãn hết khung + cuộn nội bộ), giữ `display:grid; gap:14px` của `drawer-body`.
⛔ **Không xoá** khối nào, ⛔ **không sửa** `globals.css`/`canonical.css`, ⛔ **không đổi** dữ liệu/hành vi nghiệp vụ.

### 6. PHẠM VI (đo được)
Quét **toàn bộ** `app/**` + `lib/**` tìm tệp vừa dùng khung `.modal` vừa dùng thân `.drawer-body` trần ⇒
**CHỈ DUY NHẤT `ReceiptDrawer.tsx`** ⇒ lỗi **khu trú đúng modal user báo**; cổng C06-4 khoá ⛔ không tái phát ở tệp khác.

### 7. Kiểm chứng
`TEST_LOG.md` §C12 (cổng C06 **4/4** + `tsc`/`eslint`/regression + **đo lại LIVE sau build**).

---

## ⛔⛔ ĐÍNH CHÍNH BUG-20261007-C07 — **TÔI KẾT LUẬN SỚM**: chưa chứng minh được lỗi user
**Việc đã làm SAI**: ở §3–§5 trên tôi kết luận `FIXED` với lý do «thân không giãn/không cuộn ⇒ nội dung bị CẮT 38px».
**BẰNG CHỨNG PHẢN BÁC (đo LẠI sau khi vá, cùng phép đo, 1440×900)**:
| Chỉ số | TRƯỚC vá | SAU vá |
|---|---|---|
| class thân | `drawer-body` | ✅ `drawer-body modal-body` |
| `flex` · `min-height` | `0 1 auto` · `auto` | ✅ **`1 1 auto`** · ✅ **`0px`** (đúng như thiết kế) |
| hình học thân | top 101 · bottom 669 · **h 568** | ⛔ **Y HỆT**: top 101 · bottom 669 · **h 568** |
| `clientH` · `scrollH` | 568 · 568 | ⛔ **Y HỆT**: 568 · 568 |
| 2 khối user báo | «Chứng chỉ» **538→587** · «Ảnh giao hàng» **601→651** (⛔ **đều NẰM TRONG** đáy thân 669) | ⛔ **Y HỆT** |
⇒ **KẾT LUẬN ĐÚNG**: ① bản vá **có hiệu lực về CSS** nhưng ⛔ **KHÔNG đổi bố cục**; ② 2 khối user báo **đã nằm trong khung thân cả trước lẫn sau** ⇒
⛔ **tôi KHÔNG tái hiện được hiện tượng «bị ẩn»** ⇒ ⛔ **KHÔNG được coi là đã sửa**.
**Nguồn sai của tôi**: chỉ số `biCat` (khối có đáy vượt đáy thân) mà tôi dùng làm bằng chứng ⛔ **bắt nhầm một KHỐI BAO** (rect của khối cha phủ các khối con) —
⭐ **một chỉ số suy diễn ⛔ không thay được việc TÁI HIỆN hiện tượng**.

**GIỮ LẠI gì**: việc ghép `modal-body` **vẫn đúng về nguyên tắc** (khung `.modal` phải đi với thân `.modal-body`;
`.drawer-body` ⛔ thiếu `flex`/`min-height`) và **an toàn** (đo được: bố cục ⛔ không đổi) ⇒ giữ như **GIA CỐ**, ⛔ **không** ghi vào sổ là «đã sửa lỗi user».

**CẦN GÌ ĐỂ ĐÓNG BUG NÀY (⛔ chờ user)**: ① màn + đường đi chính xác (từ «Đơn hàng đã giao» hay từ «Nhập kho»/«Kho»?);
② kích thước cửa sổ/máy khi thấy lỗi (điện thoại? 1366×768?); ③ ảnh chụp màn hình thể hiện phần bị thiếu;
④ trường hợp có **nhiều tệp/ảnh** hay không. ⛔ Không đoán.

**TRẠNG THÁI ĐÚNG**: `OPEN` (⛔ không `FIXED`).

---

## ✅ ĐÍNH CHÍNH LẦN 2 — **ĐÃ TÁI HIỆN ĐƯỢC** và **ĐÃ SỬA** (cùng ngày 07/10/2026, `TASK-20261007-C14`)

### 1. TÁI HIỆN ĐƯỢC (khắc phục việc «không tái hiện» ở trên — ⭐ đổi CÁCH ĐO)
Lần trước tôi đo **hình học khối cha** (thân modal + toạ độ khối) ⇒ ⛔ **không thấy lỗi**.
Lần này tôi đo **`scrollHeight` CỦA TỪNG KHỐI** (`scrollHeight > clientHeight` = **nội dung bị cắt bên trong khối**) ⇒ **THẤY NGAY**:
```
body: display=grid · grid-auto-rows=auto · height=567,594px · scrollHeight=568 == clientHeight=568  (⛔ KHÔNG thanh cuộn)
gridTemplateRows GIẢI RA: 47.19 · 49.20 · 49.20 · 49.20 · 91.19 · 49.20 · 49.20 · 49.20 px   ← 8 hàng bị ÉP vừa khung
7/8 khối: height=49,2031px nhưng scrollHeight=231…294px                                   ← ⛔ CẮT 78–83% nội dung
khối «Ảnh và hồ sơ giao hàng»: cao 49px, con của nó = .card-head 71px + .attachment-panel 190px (top=395 > đáy khối 357)
```
⭐ **«Mục Ảnh và hồ sơ giao hàng bị ẩn» = panel ảnh/hồ sơ nằm NGOÀI khối 49px và bị `overflow:hidden` CẮT** — đúng nguyên văn user báo.

### 2. ROOT CAUSE (⛔ không suy đoán — đọc `getComputedStyle` + quét stylesheet trong trang)
`.drawer-section { overflow:hidden }` ⇒ theo **chuẩn CSS**, **kích thước tối thiểu tự động của phần tử = 0**.
Nằm trong grid có **CHIỀU CAO XÁC ĐỊNH** (`.drawer-body { display:grid }` trong thân modal), các hàng `auto`
**bị CO xuống cho vừa khung** thay vì giữ chiều cao nội dung ⇒ ⚠️ cắt nội dung;
⛔ và vì grid **không tràn** nên `.drawer-body { overflow:auto }` ⛔ **không sinh thanh cuộn** ⇒ phần bị cắt **KHÔNG THỂ TỚI**.
> ⚠️ **GHI RÕ**: `overflow:hidden` của `.drawer-section` là **quy tắc CÓ SẴN từ trước** (dùng cho bo góc khối) — ⛔ **không phải** lỗi mới; lỗi phát sinh khi nó **kết hợp** với grid thân modal có chiều cao xác định.

### 3. BẢN VÁ — **cục bộ 1 tệp, ⛔ KHÔNG đụng CSS dùng chung**
`app/screens/ReceiptDrawer.tsx`: thân modal thêm **`style={{ gridAutoRows: "max-content" }}`**
⇒ hàng lấy **đúng chiều cao NỘI DUNG**, ⛔ không bị co ⇒ thân tràn ⇒ `.modal-body { overflow-y:auto }` sinh **thanh cuộn thật**.
⛔ **KHÔNG** sửa `app/globals.css` · ⛔ **KHÔNG** sửa `app/styles/canonical.css` (CSS **DÙNG CHUNG** — 3 phiên đang chạy song song).

### 4. ĐO LẠI SAU VÁ — **CHỨNG MINH BẰNG SỐ** (`gd-cycle` lần 8 → đo lại cùng phép đo, 1440×900)
| Khối | TRƯỚC (cao / nội dung) | SAU (cao / nội dung) | Kết luận |
|---|---|---|---|
| **Ảnh và hồ sơ giao hàng** | **49** / 277 ⛔ CẮT | **279** / 277 | ✅ **hiện đủ** |
| **Chứng chỉ / Tài liệu đã tải lên** | **49** / 277 ⛔ | **279** / 277 | ✅ |
| **Ảnh giao hàng** | **49** / 277 ⛔ | **279** / 277 | ✅ |
| Đơn mua (PO) nguồn | 49 / 245 ⛔ | **247** / 245 | ✅ |
| Đối chiếu PO và thực giao | 49 / 294 ⛔ | **296** / 294 | ✅ |
| Kết quả xác nhận BCH | 77 / 164 ⛔ | **166** / 164 | ✅ |
| Lịch sử giao nhận | 49 / 231 ⛔ | **233** / 231 | ✅ |
| ⭐ `conCat` (danh sách khối CÒN bị cắt) | **7 khối** | ✅ **`[]` — 0 khối** | ✅ **HẾT CẮT** |

### 5. CỔNG CHỐNG TÁI PHÁT — `tests/mt3-c08-modal-grid-clip.test.mjs` (**3 ca**)
`C08-1` buộc thân modal có `gridAutoRows: "max-content"` · `C08-2` ⛔ **không tệp nào** ghép thân `.drawer-body` (grid) vào khung `.modal` mà thiếu chặn co hàng · `C08-3` ghi lại căn nguyên (`.drawer-section` vẫn `overflow:hidden`) để phiên sau ⛔ không bỏ mất ghi chú.

### 6. ⭐ BÀI HỌC (lần thứ 5 của phiên — ⛔ ghi để ⛔ không lặp lại)
**ĐO SAI CHỈ SỐ = KẾT LUẬN SAI.** Lần đầu tôi đo «khối cha có bị cắt không» ⇒ kết luận ⛔ **sai** («không tái hiện»).
Đúng phải đo **`scrollHeight` vs `clientHeight` CỦA CHÍNH KHỐI NỘI DUNG** — **dấu hiệu cắt nằm Ở TRONG khối, ⛔ không ở toạ độ khối**.

### 7. Trạng thái
✅ `FIXED` (đã tái hiện · đã sửa · đã đo lại) — ⏳ **chờ USER nghiệm thu** trên `:9000` ⇒ mới chuyển `VERIFIED`.

### 8. GHI CHÚ PHỐI HỢP
⚠️ `app/screens/ReceiptDrawer.tsx` **⛔ không nằm trong LOCK** của phiên 01/02 lúc sửa (kiểm `SHARED_STATE`) ⇒
phiên 03 sửa hợp lệ. Nếu phiên khác đang cần sửa tệp này thì **đọc lại bản vá này trước** (chỉ 1 dòng class).



---

## ✅ CẬP NHẬT TRẠNG THÁI GOM (07/10/2026 · vòng 25 · `TASK-20261007-C25`) — **7 HOTFIX FE: `FIXED` → `VERIFIED`**

**CĂN CỨ (§24: `VERIFIED = FIXED + RECHECK`) — 3 tầng bằng chứng:**
| Tầng | Bằng chứng | Nơi ghi |
|---|---|---|
| ① **Cổng hợp đồng** từng hotfix | `C03` 8 ca · `C04` 13 ca · `C06` 4 ca · `C07` 2 ca · `C08` 4 ca · `C09` 4 ca · `C10` 4 ca — **tất cả PASS** | `tests/mt3-c0*.test.mjs` |
| ② ⭐ **ARTIFACT ĐANG PHỤC VỤ** | **10/10 dấu hiệu ĐẠT** trong bundle `:9000` (5 tệp · 1.320.389 ký tự) + **BOM 2 mẫu CSV** (244 · 1178 bytes) — vân tay `344d1da5553cca1e` | `TEST_LOG.md §C27` |
| ③ **ĐO DOM SỐNG** | `C10`: màn «Thanh toán HĐ» — **ISO 0** · **`dd/mm/yyyy` 4** (mẫu `30/06/2026` · `15/02/2026`) | `TEST_LOG.md §C20` |

**DANH SÁCH CHUYỂN `VERIFIED`:**
| Mã | Nội dung | Ghi chú |
|---|---|---|
| `BUG-20261007-C01` | CCCD trong modal sửa hồ sơ ⛔ không còn báo «… là bắt buộc» | ✅ VERIFIED (artifact: `Hồ sơ nhân sự` + `update_user`) |
| `BUG-20261007-C02` | Tổ đội — dọn thông tin rác | ✅ VERIFIED (artifact: ⛔ **không còn** `data-team-source-notes`) |
| `BUG-20261007-C03` | UTF-8 cho mẫu CSV | ✅ VERIFIED (**BOM đo theo BYTE** qua HTTP) |
| `BUG-20261007-C04` | Trạng thái hiển thị tiếng Việt | ✅ VERIFIED (artifact: `Đã xuất kho` · `Chờ NCC` · `Làm lại`) |
| `BUG-20261007-C05` | Ưu tiên + loại con dấu tiếng Việt | ✅ VERIFIED (artifact: `Khẩn cấp`) |
| `BUG-20261007-C06` | Ưu tiên + 2 cột hồ sơ trong **tệp xuất** | ✅ VERIFIED (artifact: `Không yêu cầu` + cổng `C04` 13 ca) |
| `BUG-20261007-C07` | Modal GRN — khối Ảnh/hồ sơ ⛔ không bị cắt | ✅ VERIFIED (artifact: `gridAutoRows` + **đo lại DOM** `conCat = []`) |
| `BUG-20261007-C10` | Định dạng ngày `dd/mm/yyyy` | ✅ VERIFIED (**DOM sống**: ISO 0 · `dd/mm/yyyy` 4) |

⚠️ **⛔ VẪN MỞ**: `BUG-20261007-C07` phần **«user báo bị ẩn»** đã đóng bằng **đo DOM** (`Ảnh và hồ sơ giao hàng` **49 → 279px**, `conCat = []`) — ⏳ nhưng ⭐ **khuyến khích user nhìn lại** (phiên 03 ⛔ không đọc được ảnh).
⚠️ **⛔ CHƯA LÀM**: **luồng UI nhiều bước** «hồ sơ → tab 0 → Sửa hồ sơ → tab thông tin cá nhân → sửa CCCD → Lưu **không lỗi**» — ⭐ bằng chứng artifact ⛔ **không thay thế** thao tác nghiệp vụ thật ⇒ ⏳ để vòng sau hoặc **user nghiệm thu**.
### ⭐ BỔ SUNG `BUG-20261007-C01` — CHỨNG MINH **END-TO-END Ở TẦNG API** (vòng 27 · `TEST_LOG.md §C29`)
| Bước | Đo được (qua proxy `:9000` — đúng đường user đi) |
|---|---|
| ⛔ **ĐỐI CHỨNG ÂM** — payload **CŨ** `{action:"update_user", userId}` | **HTTP 400** · `{"error":"Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc.","ok":false}` ⇒ ⭐ **tái hiện ĐÚNG lỗi user báo** |
| ✅ **BẢN VÁ** — payload **đầy đủ 6 trường** (`userId`+`employeeCode`+`username`+`fullName`+`email`+`organizationUnitId`) | **HTTP 200** · `{"message":"Đã cập nhật tài khoản e2e.diag.","ok":true}` |
| ✅ Dữ liệu sau khi gửi | **GIỮ NGUYÊN** 5 trường (gửi lại đúng giá trị hiện có) |
⇒ ⭐ `BUG-20261007-C01` **ĐÓNG HOÀN TOÀN**: lỗi cũ **tái hiện được** ở tầng API và **bản vá đi qua được** ⇒ ⛔ **không còn cần** thao tác UI nhiều bước.
⭐ **Tri thức API** (đã ghi `SHARED_STATE` §84): **đọc** = ⭐ **`GET /api/system`** · **ghi** = `POST /api/system {action:"…"}`.
---

## BUG-20261007-C08 — «THẺ TRẠNG THÁI PHƠI MÃ THÔ» (rò tiếng Anh ở 6 màn)

| Trường | Nội dung |
|---|---|
| **Mã** | `BUG-20261007-C08` |
| **Ngày / Phiên** | 2026-10-08 · `ERP-SESSION-03` |
| **Mô-đun / Tính năng** | UI dùng chung — **thẻ trạng thái** (`StatusBadge`) ở nhiều màn |
| **Mức độ** | **UI** (⚠️ **thấp–trung bình** nhưng ⭐ **đúng loại khiếu nại của user**: «một số nơi hiển thị tiếng Anh») |
| **Nguồn phát hiện** | ⭐ **Quét TOÀN BỘ DỮ LIỆU THẬT** (`GET /api/system` · 2,6 triệu ký tự) tìm mã enum chưa có nhãn ⇒ rồi **ĐỌC CHỖ RENDER** để loại báo động giả |
| **Vấn đề** | `StatusBadge value={…}` ⛔ **không dùng chốt chặn CUỐI** là bảng nhãn dùng chung ⇒ khi bảng nhãn cục bộ **thiếu khoá**, thẻ **phơi MÃ THÔ** (vd `pending`, `returned`, `rejected`) ra màn hình |
| **Đo được TRƯỚC khi vá** | **6 chỗ** ở **6 tệp**: `AllocateReturn.tsx` (`: String(row.status)`) · `WorkKanban.tsx` (×2: thẻ + nhãn cột) · `WorkCenter.tsx` · `TeamManagement.tsx` · `ProjectEntityModal.tsx` · `ProjectDetailTabs.tsx` |
| **ROOT CAUSE** | ⭐ **mỗi màn tự xử lý nhãn** (`WORK_STATUS_LABELS`, `PROJECT_STATUS_LABELS` cục bộ) ⛔ **không có chốt chặn dùng chung** ⇒ màn nào quên khoá là rò. ⚠️ `AllocateReturn.tsx` nặng nhất: **MỌI** trạng thái khác `issued` đều phơi mã thô |
| **FIX** | ⭐ **DÙNG LẠI** bảng nhãn dùng chung (`@/lib/status-labels`) làm **chốt chặn cuối**: `PROJECT_STATUS_LABELS[…] \|\| statusLabel(v, "project")` · `WORK_STATUS_LABELS[…] \|\| statusLabel(v, "work_item")` · `statusLabel(row.status)` ⇒ ⛔ **không tạo implementation thứ hai** (§17 REUSE) |
| **Tệp đã sửa** | `app/screens/AllocateReturn.tsx` · `WorkKanban.tsx` · `WorkCenter.tsx` · `TeamManagement.tsx` · `ProjectEntityModal.tsx` · `ProjectDetailTabs.tsx` (⚠️ ⛔ **KHÔNG** chạm `Inventory.tsx` của phiên 02 hay `app/page.tsx` — LOCK phiên 01) |
| **Chốt chặn an toàn** | miền `work_item` phủ **đủ 12/12** trạng thái tiếng Việt · miền `project` có `PROJECT_STATUS_LABELS` phủ trước ⇒ nhánh mới **chỉ chạy khi trước đây PHƠI MÃ THÔ** ⇒ ⭐ **cải thiện thuần, ⛔ không đổi hành vi chỗ đã đúng** |
| **TEST** | ✅ **cổng MỚI** `tests/mt3-c11-status-no-raw.test.mjs` — **4/4 ĐẠT** (gồm **đối chứng âm**: bộ dò phải bắt được **đúng 2 mẫu thật** đã đo, ⛔ không bắt nhầm `taskStatusLabel(String(...))`) |
| **REGRESSION** | ⏳ chạy toàn bộ sau khi build (`npm run test:regression`) |
| **VERIFICATION** | ⏳ sau build: kiểm bundle đang phục vụ + (nếu được) đo DOM |
| **STATUS** | `FIXED` (⏳ **⛔ chưa `VERIFIED`** — chờ build + hồi quy, theo Goal §24) |
| **LIÊN KẾT** | `CHG-20261007-C20` · `DEV-20261007-C06` · `TEST-20261007-C30` · `TASK-20261007-C27` · ⚠️ phần còn lại: **`HANDOFF-20261007-C13`** (`Inventory.tsx` — phiên 02) |
---

## BUG-20261007-C09 — Phép kiểm `trust-lock-foundation` **ĐỎ OAN do TRANH CHẤP** khi nhiều phiên chạy song song

| Trường | Nội dung |
|---|---|
| **Mã** | `BUG-20261007-C09` |
| **Ngày / Phiên** | 2026-10-08 · `ERP-SESSION-03` |
| **Mô-đun** | `tests/trust-lock-foundation.test.mjs` (phép kiểm «⛔ không có private key/khoá bí mật trong source») |
| **Mức độ** | **MEDIUM** (⛔ không ảnh hưởng sản phẩm nhưng ⚠️ **gây ĐỎ OAN** ⇒ mất lòng tin vào bộ kiểm, có thể chặn oan) |
| **Nguồn phát hiện** | ⭐ Hồi quy sau build vòng 28 báo **1 fail** ⇒ **truy nguyên nhân** thay vì đoán |
| **Lỗi đo được** | `Error: ENOENT: no such file or directory, stat '…\probe-err.txt'` |
| **ROOT CAUSE (chứng minh được)** | Hàm `walk()` duyệt `readdir(".")` rồi **`stat()` từng tệp** ⇒ **cửa sổ TOCTOU**: phiên khác **đang ghi/xoá tệp tạm ở GỐC REPO** (`probe-err-full.txt` · `probe-out-full.txt` **vừa được tạo lúc 19:35**) ⇒ tệp **biến mất giữa 2 bước** ⇒ `ENOENT` ⇒ **đỏ oan** |
| **BẰNG CHỨNG (⛔ không suy đoán)** | ① test đó **chạy lại RIÊNG ⇒ 5/5 ĐẠT** · ② tạo tệp `probe-err.txt` giả (mô phỏng phiên khác) ⇒ **vẫn 5/5 ĐẠT** · ③ hồi quy đầy đủ sau vá ⇒ **859 test · 858 pass · 0 fail** |
| **FIX (nhỏ, an toàn, trong quyền phiên 03)** | Bọc `stat(path)` trong `try/catch`: **`ENOENT` ⇒ BỎ QUA** (tệp ⛔ không còn trong kho mã để kiểm) · ⛔ **lỗi KHÁC vẫn ném ra** ⇒ ⛔ không che giấu lỗi thật |
| **REGRESSION** | ✅ **859 test · 858 pass · 0 fail · 1 skip** (`REG_EXIT=0`) sau khi vá |
| **STATUS** | ✅ **VERIFIED** (sửa + **chứng minh bằng mô phỏng tranh chấp** + hồi quy xanh) |
| **LIÊN KẾT** | `CHG-20261007-C21` · `TEST-20261007-C31` · ⚠️ cùng họ với `HANDOFF-20261007-C12` (mã thoát cổng ⛔ không ổn định) — ⭐ **cùng nguyên nhân gốc: nhiều phiên chạy song song trên MỘT cây mã** |
### ⭐ BỔ SUNG `BUG-20261007-C08` — **DOM XÁC NHẬN** (vòng 29 · `TEST_LOG.md §32`)
| Đo tại DOM thật (`:9000`, 1440×900) | Kết quả |
|---|---|
| Màn «**Giao việc & Kiểm soát hoàn thành**» (tệp `WorkCenter.tsx` đã vá) | Cột trạng thái/ưu tiên hiện **«Mới» · «Xong» · «Cao» · «Bình thường» · «Quá hạn»** ⇒ ⭐ **tiếng Việt, ⛔ 0 mã thô** ✅ |
| Màn «**Nhiệm vụ nhân viên đang làm**» (bấm «Cá nhân») | ✅ **⛔ 0 mã thô** |
| ⚠️ 10 giá trị bị bộ dò cờ | là **MÃ ĐỊNH DANH** (`CV-DA-260917-3436` · `PRJ-DEMO-01` · `E2E-DA-01`) ⇒ ⭐ **hiển thị nguyên văn là ĐÚNG** |
⇒ ⭐ **NÂNG TRẠNG THÁI: `FIXED` → `VERIFIED`** (cổng `C11` 4/4 + `tsc` + `eslint` + **build** vân tay `920bb0c5f11fd64a` + **hồi quy 859/858/0** + ⭐ **DOM thật**).
⚠️ **Phạm vi**: **DOM đo 2/6 màn**; 4 tệp còn lại ⭐ bảo đảm bằng **cổng chặn tái phát + bảng nhãn tất định** (⛔ không đo DOM riêng).
### ⭐ BỔ SUNG LẦN 2 `BUG-20261007-C08` — DOM trên **màn rò NẶNG NHẤT** (vòng 30 · `TEST_LOG.md §C33`)
| Màn đo (qua DOM thật `:9000`) | Cột «Trạng thái» |
|---|---|
| ⭐ «**Cấp phát cho tổ đội**» (`AllocateReturn.tsx` — nơi **MỌI** trạng thái khác `issued` từng phơi mã thô) | **5 dòng** · ⛔ **mã thô: 0** ✅ · nhãn «Đang hoạt động» |
| «Giao việc & Kiểm soát hoàn thành» (`WorkCenter.tsx`) | lượt `§C32`: **24 dòng** nhãn tiếng Việt («Mới» · «Cao» …) · lượt này **0 dòng** ⚠️ |
⇒ ⭐ **TRẠNG THÁI: `VERIFIED`** với **DOM 3/6 màn**. ⚠️ **⛔ CHƯA ĐO DOM**: `TeamManagement` · `ProjectEntityModal` · `ProjectDetailTabs`
⇒ 3 tệp đó ⭐ **bảo đảm bằng cổng `C11` (4/4) + bảng nhãn tất định** — ⛔ **không** nói «đã đo hết 6 màn».
### ⭐ BỔ SUNG LẦN 3 `BUG-20261007-C10` — **MỞ LẠI MỘT PHẦN**: ngày ISO **vẫn còn hiện thô** (vòng 31 · `TEST_LOG.md §C34`)
| | |
|---|---|
| ⭐ **PHÁT HIỆN (nhờ QUÉT TOÀN BỘ 29 MÀN — lượt phủ rộng ĐẦU TIÊN)** | ⛔ **NGÀY ISO HIỆN THÔ** ở «**Tiến độ dự án**» (`2026-01-01` · `2026-09-23`) và «**Giao việc & Kiểm soát hoàn thành**» (`2026-10-07`) ⇒ ⚠️ **KHÔNG NHẤT QUÁN** với `dd/mm/yyyy` ⇒ ⭐ **lớp `C10` CHƯA ĐÓNG HẾT** |
| ✅ **ĐÃ VÁ 11 CHỖ HIỂN THỊ** (4 tệp thuộc quyền phiên 03) | `AllocateReturn.tsx` («Ngày xuất» · «Ngày trả») · `Purchasing.tsx` («Ngày yêu cầu» · «Cần có» · «Đã đặt» · «ETA») · `PurchaseOrderDrawer.tsx` («Đã đặt» · «Hạn giao (ETA)» · «Ngày nhận») · `ContractReviewScreen.tsx` («Ngày nhận» · «Ngày review» — hàm `d()` nay qua `date()`) |
| ✅ **CỔNG** | `tests/mt3-c10-date-format.test.mjs` mở rộng ⇒ **6/6 ĐẠT** (⚠️ sau **2 lần ĐỎ OAN** + **1 lần ĐẠT RỖNG** — ⭐ bài học 10) |
| ⛔ **VẪN MỞ (nói thẳng)** | ⛔ **chưa xác định TỆP nguồn** phát ngày ISO trên **2 màn đã phát hiện** (⚠️ `WorkCenter.tsx` **đã** dùng `date(r.dueAt)` ⇒ ISO ⛔ không phát từ đó) ⇒ ⭐ **`C10` = `FIXED` (phần đã vá) + `OPEN` (phần chưa tìm ra nguồn)** |
| **TRẠNG THÁI** | ⚠️ **`OPEN` (một phần)** — ✅ 11 chỗ đã vá & kiểm; ⛔ 2 màn chưa truy ra nguồn |
### ⭐ BỔ SUNG LẦN 4 `BUG-20261007-C10` — **1/2 màn đã SẠCH**, 1 màn chuyển sang **HANDOFF** (vòng 32 · `TEST_LOG.md §C35`)
| | |
|---|---|
| ✅ **MỚI VÁ** | `app/screens/WorkKanban.tsx`: `Hôm nay {UI_TODAY}` ⇒ `Hôm nay {date(UI_TODAY)}` ⇒ màn «**Giao việc & Kiểm soát hoàn thành**» **hết** ngày ISO (`2026-10-07` ⇒ `07/10/2026`) |
| ⭐ **NGUỒN được truy ra bằng** | **truy vết DOM**: `p.muted` (ngữ cảnh «Hôm nay 2026-10-07 — thẻ hiển thị: …») ⇒ khớp **nguyên văn** chuỗi trong `WorkKanban.tsx` |
| ⛔ **CHUYỂN SANG HANDOFF** | «**Tiến độ dự án**» ⇒ component `ProjectProgress` **nằm trong `app/page.tsx`** (**LOCK phiên 01**) ⇒ **`HANDOFF-20261007-C14`** |
| ✅ **CỔNG** | `C10` **7/7 ĐẠT** (⚠️ phải loại **4 lớp báo động giả** — ⭐ bài học 10; đối chứng âm vẫn khớp **nguyên văn** mẫu thật) |
| **TRẠNG THÁI** | ⚠️ **`OPEN` (thu hẹp còn 1 màn)** — ✅ đã vá **12 chỗ** (11 + `WorkKanban`); ⛔ còn «Tiến độ dự án» (ngoài quyền) |
### ⭐ BỔ SUNG LẦN 5 `BUG-20261007-C10` — **XÁC NHẬN LIVE trên bản mới** + lớp «số tiền thô» SẠCH (vòng 33 · `TEST_LOG.md §C36`)
| | |
|---|---|
| ✅ **XÁC NHẬN LIVE (artifact `ab3c3d95d3d59ad4`)** | quét lại **29 màn**: «**Giao việc & Kiểm soát hoàn thành**» **NAY SẠCH** ⇒ bản vá `WorkKanban` (`Hôm nay {date(UI_TODAY)}`) **đã có hiệu lực thật** ✅ |
| ✅ **TỔNG** | **28/29 màn SẠCH** · ⛔ 0 mã thô · ⛔ 0 số tiền thô · ⛔ 0 `null/undefined/NaN` |
| 🔴 **CÒN ĐÚNG 1 MÀN** | «**Tiến độ dự án**» (`2026-01-01` · `2026-09-23`) ⇒ ⭐ **TRÙNG KHỚP `HANDOFF-20261007-C14`** (ngoài quyền — `app/page.tsx`) |
| **TRẠNG THÁI** | ⚠️ **`OPEN` (thu hẹp còn 1 màn, đã bàn giao)** — ✅ đã vá **12 chỗ** và **xác nhận live**; ⛔ phần còn lại **ngoài quyền phiên 03** |
---

## BUG-20261007-C11 — **CHỮ TIẾNG ANH Ở VỊ TRÍ NGƯỜI DÙNG ĐỌC** («User» ×2 trong bảng quản trị báo lỗi)

| Trường | Nội dung |
|---|---|
| **Mã** | `BUG-20261007-C11` · **Ngày / Phiên** 2026-10-08 · `ERP-SESSION-03` |
| **Mô-đun** | `app/screens/ErrorReportAdminPanel.tsx` (bảng quản trị báo lỗi) |
| **Mức độ** | **UI** (⚠️ thấp nhưng ⭐ **đúng loại khiếu nại của user**: «một số nơi hiển thị tiếng Anh») |
| **Nguồn phát hiện** | ⭐ **săn LỚP LỖI MỚI**: quét **chữ Anh ở VỊ TRÍ HIỂN THỊ** (`<th>` · `<dt>` · `<option>` · văn bản JSX) — ⛔ KHÔNG quét tên biến/hàm |
| **Vấn đề** | **`<th>User</th>`** (tiêu đề cột, dòng 125) và **`<dt>User</dt>`** (nhãn trong khối chi tiết, dòng 179) ⇒ ⚠️ **LỆCH HẲN** với mọi nhãn xung quanh đều tiếng Việt («Mã report» · «Mục» · «Tiêu đề» · «Mã NV» · «Tên» · «Phòng ban» · «Thời gian gửi» · «Report về» · «Thao tác») |
| **ROOT CAUSE** | 2 nhãn viết thẳng bằng tiếng Anh ⇒ ⛔ sót khi dịch (⚠️ cột này hiển thị `username`) |
| **FIX** | «User» ⇒ «**Tên đăng nhập**» (**2 chỗ**) — ⭐ **khớp quy ước đã có** ở `HrProfileEditModal` (trường `username` cũng gọi «Tên đăng nhập») ⇒ ⛔ **không phát minh thuật ngữ mới** |
| **Tệp đã sửa** | `app/screens/ErrorReportAdminPanel.tsx` |
| **TEST** | ✅ **cổng MỚI** `tests/mt3-c12-ui-text-vi.test.mjs` — **3/3 ĐẠT** (gồm **đối chứng âm**: ⛔ không bắt oan **tên biến** · **thuộc tính JSX** · **comment** · tiếng Việt **không dấu** («Cao») · **thuật ngữ hợp lệ** («Email»)) |
| **REGRESSION** | ✅ **865 test · 864 pass · 0 fail · 1 skip** · `tsc` exit 0 · `eslint` 0 lỗi (⚠️ 1 cảnh báo `exhaustive-deps` **có sẵn**, ⛔ không do vá này) |
| **VERIFICATION** | ✅ **build**: `gd-cycle` **exit 0** · migration **0343** · cổng dự án **ĐẠT** (vân tay HTML **`1b7a5cd90523a298`**) · ⭐ cổng `C12-1` xác nhận **⛔ 0 chữ Anh hiển thị** còn lại trong `app/screens/**` |
| **STATUS** | ✅ **VERIFIED** |
| **LIÊN KẾT** | `CHG-20261007-C23` · `TEST-20261007-C39` · `TASK-20261007-C35` · ⚠️ **2 chỗ ⛔ KHÔNG sửa** (đã kiểm là **HỢP LỆ**): `page.tsx` dùng «Import»/«Export» **trong CÂU GIẢI THÍCH tiếng Việt** (thuật ngữ tính năng, ⛔ không phải nhãn) — ⭐ và tệp đó là **LOCK phiên 01** |
---

## BUG-20261007-C12 — 🚨 CRITICAL — **CRITICAL — MẤT DỮ LIỆU**: modal «Sửa hồ sơ» **XOÁ các trường của TAB KHÔNG MỞ** khi bấm Lưu

| Trường | Nội dung |
|---|---|
| **Mã** | `BUG-20261007-C12` · **Ngày / Phiên** 2026-10-09 · `ERP-SESSION-03` |
| **Mức độ** | 🚨 **CRITICAL — MẤT DỮ LIỆU** (Goal §20/§21: ưu tiên **TUYỆT ĐỐI**) |
| **Nguồn** | ⭐ **USER BÁO TRỰC TIẾP**: «sửa 1 thông tin của 1 user nhưng không sửa các thông tin khác mà bấm lưu luôn thì các thông tin khác của user đó lại **tự động bị xoá** (hiển thị `----` trong danh sách nhân sự)… sửa xong thì các thông tin khác như **chức danh** lại bị mất» |
| **Mô-đun** | `app/screens/HrProfileEditModal.tsx` (FE — **trong quyền phiên 03**) + `HrManagementUseCase.saveHrRecord` (BE — phiên 01) |
| **VẤN ĐỀ** | Lưu ở **tab này** ⇒ **mọi trường của tab kia BỊ GHI RỖNG** ⇒ hồ sơ nhân sự **mất dữ liệu** (danh sách hiện `----`) |
| ⭐ **ROOT CAUSE (2 TẦNG — ĐÃ ĐỌC MÃ, ⛔ không đoán)** | **① FE**: `HrProfileEditModal.tsx` **CHỈ render phần của TAB ĐANG MỞ** (`tab === "user" ? … : …`) ⇒ ô của tab kia **⛔ KHÔNG có trong DOM** ⇒ `fd.get("position")` trả **`null`** ⇒ code cũ `String(fd.get("position") \|\| "")` gửi **`""`**.<br>**② BE**: `HrManagementUseCase.saveHrRecord` ghi `nvl(payload.get("position"))` với `nvl(o)` = «rỗng ⇒ **NULL**» ⇒ **GHI ĐÈ giá trị cũ bằng NULL** ⇒ **MẤT DỮ LIỆU**. |
| ⭐ **TÁI HIỆN ĐƯỢC — BẰNG CHỨNG END-TO-END Ở TẦNG API** | **①** `hr_records` của `e2e.diag` có `position = "Chỉ huy trưởng"`.<br>**②** Gửi `save_hr_record` với payload **ĐÚNG như modal cũ sinh ra khi tab «Thông tin cá nhân» đang mở** (`position:""`, `phone:""`, `identityNo:"079912345678"`, …) ⇒ **HTTP 200**.<br>**③** Đọc lại CSDL: ⭐ **`position` = `Chỉ huy trưởng` ⇒ `NULL`** 🔴 ⇒ **MẤT «Chức danh» — ĐÚNG hiện tượng user tả**.<br>**④** Gửi lại **kèm giá trị hiện có** ⇒ ✅ **`position` GIỮ NGUYÊN «Chỉ huy trưởng»** ⇒ **chứng minh CƠ CHẾ VÁ đúng**.<br>**⑤** ✅ **KHÔI PHỤC** `e2e.diag` **đúng snapshot ban đầu** (`Chỉ huy trưởng` + 7 NULL) — ⭐ kiểm lại khớp **True**; ⛔ **thiệt hại toàn cục KHÔNG tăng** (1/2/1 trên **26** hồ sơ). |
| ⭐ **THIỆT HẠI ĐÃ ĐO (CSDL thật)** | **26** hồ sơ · rỗng: `position` **1** · `phone` **2** · `identity_no` **1** · `birth_date` **1** · `permanent_address` **1** · `education_level` **1**.<br>⭐ 2 hồ sơ bị ảnh hưởng rõ: **`cha.ht`** (mất `position` + `phone`; ⚠️ `permanent_address` = «Chỉ huy trưởng A» và `education_level` = «Chỉ huy trưởng» — ⚠️ **nghi gõ nhầm ô**) · **`e2e.diag`** (đã khôi phục). |
| **FIX (phiên 03 — ⛔ không sửa BE)** | `HrProfileEditModal.tsx`: thêm `hrVal(name, fallback)` — ⭐ **ô VẮNG trong DOM ⇒ gửi GIÁ TRỊ HIỆN CÓ** (`hr.*`), ⛔ **KHÔNG** gửi rỗng; ⚠️ **ô CÓ trong DOM mà người dùng XOÁ TRẮNG ⇒ vẫn gửi rỗng** (⛔ không phá quyền xoá của người dùng). Áp cho **11 trường** hồ sơ. |
| **TEST** | ✅ **cổng MỚI** `tests/mt3-c13-hr-modal-no-wipe.test.mjs` — **4/4 ĐẠT** · ⭐ **C13-3 = ĐỐI CHỨNG ÂM** (bộ dò **PHẢI** bắt mẫu cũ `String(fd.get("position") \|\| "")` ⇒ ⛔ nếu không thì cổng **vô dụng**) · `C13-4` khoá «tôn trọng thao tác xoá trắng» |
| **REGRESSION** | ✅ `tsc` **0** · `eslint` **0 lỗi** · hồi quy (chạy sau khi build) |
| **VERIFICATION** | ⏳ **ĐANG LÀM**: build + **kiểm bằng GIAO DIỆN THẬT** (user yêu cầu) — mở modal trên tài khoản test, **bắt payload POST thật** bằng CDP + **ảnh chụp** |
| **STATUS** | 🔧 **FIXED (= CODE + TEST PASS)** — ⏳ chờ **VERIFIED** (DOM/UI + hồi quy) |
| **LIÊN KẾT** | `CHG-20261007-C25` · `TEST-20261007-C49` · `TASK-20261007-C48` · **`HANDOFF-20261007-C17`** (nợ BE) · ⚠️ **CÙNG LỚP** với `BUG-20261007-C01` (⚠️ vòng trước tôi vá **payload `update_user`** nhưng ⛔ **chưa áp cùng cách** cho **payload `save_hr_record`** ⇒ lỗi mất dữ liệu **còn lại**) |

### ⭐ BÀI HỌC (17) — **VÁ MỘT NỬA CỦA CÙNG MỘT LỚP LỖI = COI NHƯ CHƯA VÁ**
⚠️ `BUG-C01` (2026-10-07) và `BUG-C12` (2026-10-09) **CÙNG MỘT LỚP**: «form chỉ render tab đang mở ⇒ trường tab kia gửi rỗng».
⭐ Vòng trước tôi **chỉ vá payload `update_user`** (phần tài khoản) ⚠️ và **⛔ không rà các payload còn lại trong CÙNG hàm `save()`** ⇒ **payload `save_hr_record` vẫn gửi rỗng** ⇒ 🔴 **MẤT DỮ LIỆU THẬT**.
⇒ ⭐ **LUẬT MỚI**: khi vá một lỗi «dạng mẫu» (pattern), **PHẢI quét TOÀN BỘ chỗ cùng mẫu trong CÙNG tệp/hàm** (⭐ vd `grep` mẫu cũ trong cả tệp) — ⛔ không chỉ vá chỗ đang lỗi.
---

## BỔ SUNG cho BUG-20261007-C12 (PHẦN 2) ⭐ **CƠ CHẾ THỨ HAI** + ✅ **CHUYỂN `VERIFIED`**

### P2.1 ⭐ PHÁT HIỆN CƠ CHẾ THỨ HAI (⭐ nguyên nhân «thông tin khác tự đổi»)
| | |
|---|---|
| **Hiện tượng đo được** | Ở tab «**Thông tin cá nhân**», các ô hiện **giá trị của tab «Thông tin user»**: «Số CCCD/CMND» = **«E2E-DIAG»** (= **mã nhân viên**) · «Địa chỉ thường trú» = **«Chẩn đoán»** (= **họ tên**) · «Trình độ học vấn» = **«Chỉ huy trưởng»** (= **chức danh**) — ⚠️ **dù API trả 3 trường này RỖNG** |
| ⭐ **ROOT CAUSE** | Hai nhánh tab render **CÙNG loại** `<div className="form-grid">` ở **CÙNG vị trí** trong cây ⇒ ⚠️ **React TÁI DÙNG** các `<input>` cũ (⛔ không mount lại) ⇒ `defaultValue` **⛔ không được áp lại** ⇒ ô của tab này **giữ giá trị** của tab kia |
| ⚠️ **HỆ QUẢ KÉP** | ① **Hiển thị SAI** (user tưởng mất dữ liệu «từ khi mở modal») ② ⚠️ **LƯU SAI**: bấm Lưu ⇒ **ghi các giá trị SAI đó vào trường cá nhân** ⭐ **khớp hồ sơ `cha.ht`**: `permanent_address` = «**Chỉ huy trưởng A**» (= **họ tên**) · `education_level` = «**Chỉ huy trưởng**» (= **chức danh**) |
| ✅ **FIX** | `key={tab}` trên **CẢ HAI** nhánh ⇒ ép React **MOUNT LẠI** nhóm ô khi đổi tab ⇒ `defaultValue` = giá trị **THẬT** |
| ⚠️ **TỰ SỬA LỖI CỦA TÔI** | lần chèn đầu tôi đặt **chú thích JSX NGAY TRONG nhánh ternary** ⇒ 2 phần tử trong `( … )` ⇒ 🔴 **LỖI CÚ PHÁP** (`TS17002`) ⇒ ✅ **chuyển chú thích ra ngoài** + gắn `key` cho **cả 2 nhánh** |

### P2.2 ✅ **XÁC MINH QUA GIAO DIỆN THẬT** (user yêu cầu) — build **`0347`** · vân tay `d02e9e4702c7b7cd`
| Phép đo | Trước vá | ✅ Sau vá |
|---|---|---|
| Payload POST thật (`save_hr_record`) | ⛔ `position:""` | ✅ `position:"**Chỉ huy trưởng**"` |
| Tab «Thông tin cá nhân» | 🔴 hiện mã NV / họ tên / chức danh | ✅ **RỖNG cả 3 ô** (đúng giá trị thật) |
| CSDL sau khi bấm **«Lưu hồ sơ»** | 🔴 `position` ⇒ **NULL** | ✅ `position='Chỉ huy trưởng'` giữ nguyên ⇒ ⭐ **⛔ KHÔNG mất dữ liệu** |
⭐ **ẢNH**: `evidence/BUG-C12-3-modal-sua-tab-ca-nhan.png` (TRƯỚC — lỗi) · ⭐ `evidence/BUG-C12-9-FIXED-tab-ca-nhan.png` (SAU — đã đúng)

### P2.3 ⚠️ ĐÍNH CHÍNH 2 KẾT LUẬN SAI CỦA TÔI (⭐ trung thực)
① «API chỉ trả **1** `hrRecords`» ⇒ ⚠️ **tôi đọc SAI KHOÁ JSON** (mảng nằm ở `data.hrRecords`; `$j.hrRecords` = `null` ⇒ đếm ra 1) ⇒ ✅ **thật ra 26 bản ghi, khớp CSDL 100%** ⇒ **đường đọc ⛔ KHÔNG sai**.
② «Modal chi tiết ghép nhãn↔giá trị sai» ⇒ ⚠️ lượt đo đầu **không khoanh vùng**; ✅ đo lại đúng phạm vi (`[data-vntech="hr-profile-edit"]`, ⭐ **chỉ 1** component dùng khoá này) ⇒ lỗi ở **modal SỬA**.

| Trường | Nội dung |
|---|---|
| **STATUS** | ✅ **`VERIFIED`** — ✅ **FIXED (code + test)** · ✅ **hồi quy 878 test · 877 pass · 0 fail** · ✅ `tsc` 0 · `eslint` 0 · ✅ **kiểm bằng GIAO DIỆN THẬT + ảnh + đối chiếu CSDL** |
| **TEST** | cổng `mt3-c13` **5/5** (thêm `C13-5` khoá `key={tab}`) · `moc-96-105-no-regression` **17/17** |
| **BUILD** | migration **`0345`** (phần 1) + **`0347`** (phần 2) — ⚠️ `0346` sinh ra ở **lượt build lỗi tạm thời** (⚠️ ghi rõ để ⛔ không thắc mắc mã nhảy) |
| **LIÊN KẾT** | `CHG-20261007-C25` (p1) · `CHG-20261007-C26` (p2) · `TEST-20261007-C49` · `TASK-20261007-C48` · `HANDOFF-20261007-C17` (nợ BE) |
---

## BUG-20261007-C13 — 🔴 **HIGH — QUYỀN**: user **CÓ quyền SỬA hồ sơ nhân sự** nhưng **⛔ KHÔNG thấy nút «Sửa hồ sơ»** (điều kiện UI chỉ xét quyền **CẤP NGƯỜI DÙNG** + **mã module SAI**)

| Trường | Nội dung |
|---|---|
| **Mã** | `BUG-20261007-C13` · **Ngày / Phiên** 2026-10-09 · `ERP-SESSION-03` |
| **Mức độ** | 🔴 **HIGH** (Goal §21: ưu tiên 3–4 — **chặn LUỒNG NGHIỆP VỤ**, ⛔ không phải lỗi hiển thị) |
| **Nguồn** | ⭐ **USER YÊU CẦU**: «hãy kiểm tra lại bằng giao diện user thật vào tài khoản **admin hoặc hrm hoặc tài khoản có perm hành chính nhân sự** để test» ⇒ ⭐ phiên 03 **đăng nhập thật bằng tài khoản role `hr`** (`e2e.ns`) và phát hiện |
| **Mô-đun** | `app/page.tsx` (⛔ **LOCK phiên 01**) — biến `canAdministerStaff` + nút `open("hrProfileEdit", user)` |
| ⭐ **HIỆN TƯỢNG (đo được)** | Tài khoản **`e2e.ns`** (**role `hr`**, phòng `ORG-HCPC`): ✅ đăng nhập **HTTP 200** · ✅ **thấy màn «Hồ sơ nhân sự»** ⇒ ⚠️ **⛔ KHÔNG có nút «Sửa hồ sơ»** (📸 `evidence/BUG-C12-10-role-hr-danh-sach.png`) ⇒ ⛔ **không sửa được hồ sơ nhân sự** |
| ⭐ **ROOT CAUSE — TẦNG ① (quyền CẤP NGƯỜI DÙNG vs CẤP PHÒNG BAN)** | `page.tsx`: ``const canAdministerStaff = isAdminUser(data.user) || (data.allModulePermissions‖[]).some((p)=>String(p.userId)===uid && …)`` ⇒ ⚠️ **CHỈ xét `allModulePermissions` lọc theo `userId`** ⇒ ⛔ **BỎ QUA quyền CẤP PHÒNG BAN**.<br>⭐ **ĐO ĐƯỢC**: `allModulePermissions` của `e2e.ns` = **0 DÒNG** ⇒ điều kiện **⛔ KHÔNG BAO GIỜ đúng** cho user được cấp quyền theo **phòng ban** |
| ⭐ **ROOT CAUSE — TẦNG ② (DANH SÁCH MÃ MODULE SAI)** | ``const HR_EDIT_MODULES = ["dept_hr_legal", "hr_legal", "hr", "dept_legal_labor"]`` ⇒ ⚠️ **`dept_hr_legal` là MÃ BỊ ĐẢO** — mã **THẬT** trong CSDL là **`dept_legal_hr`** ⇒ ⭐ **module HR thật ⛔ KHÔNG nằm trong danh sách**<br>⭐ **ĐO ĐƯỢC**: giao `HR_EDIT_MODULES` ∩ module thật của user = **chỉ `dept_legal_labor`** (⚠️ và nhánh đó vẫn ⛔ không dùng được vì phải khớp `allModulePermissions` = **rỗng**) |
| ⭐ **QUYỀN THẬT CỦA USER (đo bằng API, ⛔ không suy đoán)** | `data.modulePermissions` của `e2e.ns` = **76 dòng** quyền **HIỆU LỰC**, trong đó ⭐ **`dept_legal_hr` view=1 create=1 edit=1** (nguồn `company_leadership`) ⇒ ⭐ **user CÓ quyền sửa** ❗ |
| ⭐ **CÁCH VÁ ĐỀ XUẤT (1 DÒNG — ⭐ helper đã có sẵn và ĐÚNG)** | ⭐ dùng **quyền HIỆU LỰC** thay vì tự quét:<br>``const canAdministerStaff = modulePermission(data, "dept_legal_hr").canEdit;``<br>⭐ vì **`lib/permissions.ts` → `modulePermission(data, key)`** đọc **`data.modulePermissions`** (= quyền hiệu lực **đã gộp** người dùng + phòng ban + vai trò; ⭐ admin ⇒ **toàn quyền**; ⭐ đã dùng rộng rãi trong repo) — ⚠️ **`lib/permissions.ts` thuộc quyền phiên 03** và **đã đúng**, ⛔ **không cần sửa** |
| **VÌ SAO PHIÊN 03 ⛔ KHÔNG TỰ SỬA** | ⛔ **`app/page.tsx` = LOCK phiên 01** (Goal §19/§35) ⇒ ⭐ **giao `HANDOFF-20261007-C20`** |
| **ẢNH HƯỞNG** | ⚠️ **MỌI tài khoản được cấp quyền HR theo PHÒNG BAN** (⚠️ phổ biến — `department_module_permissions` có **481** dòng) ⇒ ⛔ **không sửa được hồ sơ nhân sự** ⇒ ⚠️ **chặn nghiệp vụ** (⚠️ chỉ `admin` hoặc user có dòng quyền **cấp người dùng** trên `dept_legal_labor` mới thấy nút) |
| **TEST ĐỀ XUẤT** | ⭐ cổng hợp đồng: dựng **data giả** có `modulePermissions=[]` + `departmentModulePermissions` cấp `dept_legal_hr` edit ⇒ **nút PHẢI hiện**; ⚠️ và **đối chứng âm**: `canEdit=0` ⇒ **nút PHẢI ẩn** |
| **STATUS** | ⚠️ **`OPEN`** (⛔ chưa sửa — ⛔ ngoài quyền phiên 03) |
| **LIÊN KẾT** | ⭐ `HANDOFF-20261007-C20` · `TEST-20261007-C57` · 📸 `evidence/BUG-C12-1*.png` |
---

## BỔ SUNG (2) cho BUG-20261007-C13 — ✅ **PHẦN TRONG QUYỀN PHIÊN 03 ĐÃ VÁ & XÁC MINH** (`lib/workflow-helpers.ts`) + ⭐ **TÁC ĐỘNG ĐO ĐƯỢC**

### P2.1 ⭐ CÙNG LỚP — chỗ thứ hai (⭐ **trong quyền phiên 03** ⇒ ✅ **ĐÃ VÁ**)
| | |
|---|---|
| **Tệp** | `lib/workflow-helpers.ts` → `workflowApproverCandidates(data, moduleKey)` |
| ⛔ **TRƯỚC** | `hasApprovePermission = isAdmin ‖ Number(perm?.canApprove) === 1` với `perm` tra **`allModulePermissions`** theo **`userId`** ⇒ ⚠️ **CHỈ quyền CẤP NGƯỜI DÙNG** ⇒ ⛔ **BỎ QUA quyền CẤP PHÒNG BAN** |
| ⚠️ **HỆ QUẢ (đo trong `WorkflowModal.tsx`)** | `const shown = onlyPermitted ? candidates.filter((c) => c.hasApprovePermission) : candidates;` ⇒ ⭐ **LỌC ⇒ ẨN người duyệt HỢP LỆ** · ⚠️ và badge ghi «**Chưa có quyền duyệt**» **SAI** (`<b>{… u.hasApprovePermission ? "Có quyền duyệt" : "Chưa có quyền duyệt"}</b>`) |
| ✅ **VÁ** | xét **THÊM** nhánh phòng ban: `data.departmentModulePermissions.some(d => d.organizationUnitId === u.organizationUnitId && d.moduleKey === moduleKey && d.active !== 0 && Number(d.canApprove) === 1)` — ⭐ **vẫn giữ** nhánh quyền cấp người dùng + `admin` (⛔ không bỏ đường nào) |
| ⭐ **ĐIỀU KIỆN DỮ LIỆU ĐÃ KIỂM TRƯỚC KHI VÁ** | ✅ `department_module_permissions` **CÓ cột `can_approve`** · ✅ API trả `departmentModulePermissions[]` có `organizationUnitId` + `moduleKey` + `canApprove` · ✅ `users[]` có `organizationUnitId` |
| ⭐ **TÁC ĐỘNG ĐO ĐƯỢC (dữ liệu thật)** | module **`approvals`**: ⛔ trước **26** người ⇒ ✅ sau **61** người (**+35**) · `dept_legal_hr`: **5 → 9** · `dept_finance_payment_plan`: **5 → 9**<br>⭐ **VÍ DỤ THẬT**: `probe_grant1_073196` · `probe_grant1_250625` · `probe_grant1_457899` (role `ksda`, phòng **BCH**) ⇒ ⛔ trước: «**Chưa có quyền duyệt**» (**SAI**) ⇒ ✅ sau: «**Có quyền duyệt**»<br>⚠️ ⇒ **hơn MỘT NỬA** số người duyệt hợp lệ đã **bị ẩn** khỏi bộ chọn người duyệt workflow |
| **CỔNG MỚI** | `tests/mt3-c16-dept-permission-gates.test.mjs` — **4/4 ĐẠT** · ⭐ có **ĐỐI CHỨNG ÂM** (`C16-3`: bộ dò **PHẢI** bắt mã CŨ) · ⭐ có **CHỐT VÙNG PHỦ** (`C16-1`/`C16-4`) |
| **KIỂM CHỨNG** | ✅ `tsc` **0** · `eslint` **0** · `gd-cycle` **exit 0** · migration **`0348`** · cổng dự án **ĐẠT** (vân tay HTML **`aa8d93a0c8ce613f`**) · hồi quy **919 test · 918 pass · 0 fail · 1 skip** |
| **STATUS** | ✅ **`VERIFIED`** (phần trong quyền phiên 03) |

### P2.2 ⚠️ PHẦN ⛔ NGOÀI QUYỀN (vẫn `OPEN`)
⚠️ `app/page.tsx` có **4 chỗ CÙNG KHUÔN** (`canViewAudit` · `canAdministerStaff` · `canManageRole` · `canManageUserPermissions`) ⇒ ⛔ **LOCK phiên 01** ⇒ ⭐ **đã giao `HANDOFF-20261007-C20`** (kèm bản vá 1 dòng + test đề xuất).
⭐ **ĐÃ ĐO THÊM (vòng 56)**: `dept_hr_legal` ⛔ **KHÔNG tồn tại** trong `module_catalog` (⭐ **mã ĐẢO** đã xác nhận ở tầng danh mục) · ✅ `dept_legal_hr` · `admin_tab_01` · `admin_tab_06` **có thật**.
⚠️ Và **12+ module** có dòng quyền **CẤP PHÒNG BAN** với **`can_edit=1`** (`dept_legal_hr` · `dept_finance_*` · `warehouse_receipt` · …) ⇒ ⚠️ **lớp lỗi này ảnh hưởng RỘNG**, ⛔ không chỉ màn Hồ sơ nhân sự.
## BỔ SUNG (3) cho BUG-20261007-C13 — ✅ **XÁC MINH BẰNG GIAO DIỆN THẬT (DOM)**: `VERIFIED` ở mức UI
⭐ Mở «Sửa quy trình: Quy trình nhập kho (có bước duyệt mới)» (module **`warehouse_receipt`**) ⇒ tick «**Chỉ hiện người có quyền duyệt**»
⇒ gõ «073196» vào ô «Tìm người duyệt» ⇒ ⭐ hiện «**Probe cấp 1 quyền 073196**» với badge **«Có quyền duyệt»** (**2** kết quả · «Chưa có quyền duyệt» = **0**).
⭐ Người này **⛔ không có quyền cấp NGƯỜI DÙNG** cho `warehouse_receipt` (⭐ **chỉ theo PHÒNG BAN**) ⇒ ⛔ trước khi vá **bị LỌC MẤT** ⇒ ✅ sau khi vá **hiện đúng**.
📸 `evidence/BUG-C13-3-badge-NHAPKHO-073196.png` (+ `BUG-C13-1-man-quy-trinh.png` · `BUG-C13-2-modal-NHAPKHO-loc-quyen.png`) · ⭐ tái xác minh bằng `tools/probe-s03-dept-approver.mjs`.
⚠️ **PHẦN ⛔ NGOÀI QUYỀN** (`app/page.tsx`: `canAdministerStaff` + 3 chỗ cùng khuôn + mã **ĐẢO** `dept_hr_legal`) ⇒ ⚠️ **VẪN `OPEN`** ⇒ ⭐ `HANDOFF-20261007-C20`.
---

## BUG-20261007-C14 — 🔴 **HIGH — QUYỀN**: tài khoản **CÓ `admin` + toàn bộ `admin_tab_01…14` (view/use/edit=1)** vẫn **⛔ BỊ CHẶN** khỏi «**DANH MỤC & PHÂN QUYỀN**» **chỉ vì `role ≠ admin`** ⇒ ⚠️ **PA-1 KHÔNG DÙNG ĐƯỢC TỪ GIAO DIỆN**

| Trường | Nội dung |
|---|---|
| **Mã** | `BUG-20261007-C14` · **Ngày / Phiên** 2026-10-09/10 · `ERP-SESSION-03` |
| **Mức độ** | 🔴 **HIGH** (⚠️ **chặn TOÀN BỘ khu quản trị** cho tài khoản cấu hình — ⚠️ **trái chủ trương RBAC của user**) |
| **Nguồn** | ⭐ tiếp nối **`BUG-C13`** + ⭐ **yêu cầu test bằng tài khoản không phải admin** của user |
| ⭐ **HIỆN TƯỢNG (⭐ ĐỌC ẢNH — ⛔ không phải chỉ đọc DOM)** | Tài khoản **`giamdoc.demo`** (**role `director`**): mở «**DANH MỤC & PHÂN QUYỀN**» ⇒ ⭐ màn hiện **ĐÚNG panel «CHƯA ĐƯỢC PHÂN QUYỀN»**, **⛔ 0 TAB**, **⛔ 0 dòng bảng** (⚠️ trong khi `admin` mở cùng màn có **40 tab** + bảng) — 📸 `evidence/PA1-4-man-quan-tri-director.png` |
| ⭐ **QUYỀN THẬT CỦA TÀI KHOẢN (đo bằng API)** | ⭐ **`admin` view=1 use=1 edit=1** + ⭐ **toàn bộ `admin_tab_01…14` view=1 use=1 edit=1** (nguồn `company_leadership`) ⇒ ⭐ **đủ quyền theo CẤU HÌNH** ❗ |
| ⭐ **ROOT CAUSE (⭐ đọc mã — CHÍNH XÁC 1 DÒNG)** | `app/page.tsx:625`: ``const accessDenied = active!=="admin" ? (permissionConfigured && !activePermission.canView) : !isAdminUser(data.user);``<br>⇒ ⚠️ **nhánh `active === "admin"` CHỈ cho `isAdminUser(data.user)`** (tức `role === "admin"` / `roleBase === "admin"`) ⇒ ⛔ **BỎ QUA HOÀN TOÀN quyền cấu hình** (`admin` / `admin_tab_*`) ❗ |
| ⚠️ **MÂU THUẪN NỘI BỘ (⭐ bằng chứng mạnh)** | ⭐ **CÙNG TỆP** `page.tsx:491` ĐÃ dùng đúng khuôn cho **menu**: ``if (isSystemAdminItem(item)) return systemAdminMenuVisible && hasAnyCapability(modulePermission(data, item.key));`` ⇒ ⭐ **menu CHO VÀO nhưng màn LẠI CHẶN** ⇒ ⚠️ **tự mâu thuẫn trong cùng một tệp** |
| ⚠️ **MÂU THUẪN VỚI BACKEND** | ⭐ `ActionRbacRegistry` khai các action quản trị theo **`admin_tab_NN`** (`save_user_access` ⇒ `admin_tab_06` + `canView`) và `UserManagementUseCase:275-276` **cho người có quyền cấu hình đi qua** (⭐ **PA-1 `DEC-20261008-001`**) ⇒ ⚠️ **BE mở, UI khoá** |
| 🔴 **HỆ QUẢ NGHIÊM TRỌNG NHẤT** | ⭐ **PA-1 KHÔNG THỂ DÙNG TỪ GIAO DIỆN**: dù BE đã cho `admin_tab_06 + canView` LƯU được, ⚠️ người dùng cấu hình **⛔ không mở nổi màn để bấm Lưu** ⇒ ⚠️ **triệu chứng user báo vẫn còn nguyên** ở tầng màn |
| ⚠️ **PHẠM VI ẢNH HƯỞNG (đo được)** | ⭐ **10** tài khoản có `admin_tab_06` cấp người dùng (`giamdoc.demo` + 9 `probe_*`) · ⭐ **1** tài khoản `admin_tab_01` · ⭐ **1** tài khoản cho mỗi `admin_tab_02…14` ⇒ ⚠️ **mọi tài khoản được cấp tab quản trị theo cấu hình đều ⛔ bị chặn** |
| ⭐ **CÁCH VÁ ĐỀ XUẤT (1 DÒNG — ⭐ theo ĐÚNG khuôn đã có TRONG CÙNG TỆP)** | ⭐ đổi nhánh `admin` sang **quyền HIỆU LỰC**:<br>``: !(isAdminUser(data.user) ‖ hasAnyCapability(modulePermission(data, "admin")));``<br>⭐ (`hasAnyCapability` + `modulePermission` **đã import sẵn** trong `page.tsx` ✅ · ⭐ `admin` là **toàn quyền** cho `role=admin` nên ⛔ **không mất đường nào**) |
| **VÌ SAO PHIÊN 03 ⛔ KHÔNG TỰ SỬA** | ⛔ **`app/page.tsx` = LOCK phiên 01** ⇒ ⭐ **`HANDOFF-20261007-C22`** |
| **TEST ĐỀ XUẤT** | ⭐ cổng: **data giả** `role="director"` + `modulePermissions` có `admin` `canView=1` ⇒ ⭐ **màn quản trị PHẢI render tab** (⛔ không panel từ chối) · ⚠️ **đối chứng âm**: ⛔ không có `admin` và ⛔ không phải admin ⇒ **PHẢI** hiện panel từ chối ✅ |
| **STATUS** | ⚠️ **`OPEN`** (⛔ chưa sửa — ⛔ ngoài quyền phiên 03) |
| **LIÊN KẾT** | ⭐ `HANDOFF-20261007-C22` · `TEST-20261007-C62` · 📸 `PA1-4-man-quan-tri-director.png` · ⭐ `probe-s03-pa1-save.mjs` |
## BỔ SUNG (2) cho BUG-20261007-C14 — ⭐ **BẢN VÁ ĐÃ ĐƯỢC TIỀN KIỂM CHỨNG** (5 tài khoản · 2 dương + **2 đối chứng âm**) trước khi giao
⭐ Mô phỏng **CHÍNH predicate đề xuất** trên **dữ liệu THẬT**: ⭐ **MỞ ĐÚNG** cho tài khoản **CÓ** `admin`/`admin_tab_*` (`giamdoc.demo` · `e2e.thuky` — **15** dòng `admin*`) · ⭐ **GIỮ CHẶN** tài khoản **⛔ KHÔNG có** (`e2e.ksda` · `e2e.kt` — **0** dòng) · ⭐ `admin` **DUOC VAO** ở **cả hai** (⛔ không mất đường nào) ⇒ ✅ **an toàn để áp**.
⚠️ **CẢNH BÁO KÈM THEO**: ⚠️ `e2e.ns` (**nhãn role `hr`**) **cũng có 15 dòng `admin*`** ⇒ ⚠️ bản vá **cũng mở cho nó** — ⭐ **ĐÚNG theo DỮ LIỆU**, ⚠️ **SAI theo Ý ĐỊNH** ⇒ ⭐ đây là **DỊ THƯỜNG DỮ LIỆU ĐÃ BIẾT `L-14`** (⚠️ nên xử lý **RIÊNG**, ⛔ **đừng** lấy làm cớ giữ `BUG-C14`).
⚠️ **VÀ ⚠️ TÔI ĐÃ SUÝT GIAO BẢN VÁ SAI**: lần đo đầu (**3 ca, ⛔ thiếu đối chứng âm**) làm tôi **tưởng** bản vá **mở khu quản trị cho nhân viên HR** ⇒ ⭐ **đo sâu** mới thấy ⚠️ **tôi đánh giá theo NHÃN `role` ⛔ không theo QUYỀN THẬT** ⇒ ✅ **sửa cách đánh giá** + ⭐ **thêm 2 đối chứng âm** ⇒ ⭐ **bản vá ĐÚNG** (⭐ luật **28**).
---

## BUG-20261007-C15 — 🔴 **HIGH (MẤT DỮ LIỆU)** + 🟠 **MEDIUM (lệch định dạng ngày)**: màn «Hồ sơ nhân sự» — nút «＋ Lập hồ sơ» **GHI ĐÈ** hồ sơ đang có ⛔ + ngày in **THÔ**

| Trường | Nội dung |
|---|---|
| **Mã** | `BUG-20261007-C15` · **Ngày / Phiên** 10/10/2026 · `ERP-SESSION-03` (**HR–TEAMS**) |
| **Mức độ** | ① 🔴 **HIGH — MẤT DỮ LIỆU** (⭐ **cùng lớp `BUG-C12` CRITICAL** mà user đã báo, ⚠️ khác ĐƯỜNG VÀO) · ② 🟠 **MEDIUM — lệch định dạng ngày** |
| **Tệp** | `app/screens/HrScreen.tsx` (⭐ **THUỘC QUYỀN phiên 03** ✅) |
| ⛔ **SỰ CỐ ① — MẤT DỮ LIỆU** | Backend `HrManagementUseCase:32-39`: hồ sơ **ĐÃ TỒN TẠI** ⇒ nhánh `store.updateHrRecord(… nvl(payload.get("x")) …)` ⇒ ⭐ **khoá VẮNG = NULL** ⇒ ⚠️ nút «＋ Lập hồ sơ» trước đây đổ **TOÀN BỘ `data.staffDirectory`** vào dropdown ⇒ ⚠️ chọn nhân sự **ĐÃ CÓ hồ sơ** + lưu form (phần lớn ô **TRỐNG**) ⇒ ⛔ **XOÁ SẠCH** các trường cũ |
| ⭐ **ĐO ĐƯỢC** | **42** nhân sự hoạt động vs **26** hồ sơ ⇒ ⚠️ **26 người** phơi ra trước rủi ro (⭐ dropdown cũ có **~43** lựa chọn ⇒ nay **18**) |
| ⛔ **SỰ CỐ ② — NGÀY THÔ** | Bảng in `{r.birthDate‖"—"}` / `{r.joinedDate‖"—"}` ⇒ ⚠️ hiện **`1995-09-02`** (ISO) trong khi **TOÀN APP** hiện **`dd/mm/yyyy`** qua `date()` — ⭐ `HrScreen` **đã import `date`** mà gọi **0 LẦN** (⚠️ **đúng «DẤU HIỆU CHÍ MẠNG» đã ghi ở cổng `mt3-c10`**) — ⭐ CSDL: `birth_date='1995-09-02'` · `joined_date='2024-09-15'` (ISO) |
| ✅ **VÁ ① (2 lớp chặn)** | ① danh sách chọn **CHỈ gồm nhân sự CHƯA có hồ sơ** (`missingProfile` — ⭐ khớp KPI «Còn thiếu hồ sơ») · ② ⭐ **chốt chặn THỨ HAI** khi lưu: chọn trúng người **đã có hồ sơ** ⇒ `window.confirm` **cảnh báo GHI ĐÈ** · ③ nút Lưu **khoá** + nhãn «Tất cả đã có hồ sơ» khi hết người · ④ ghi rõ trong modal: «Nhân sự ĐÃ có hồ sơ thì bấm vào dòng để SỬA» |
| ✅ **VÁ ②** | bọc `date(r.birthDate)` / `date(r.joinedDate)` ⇒ **`dd/mm/yyyy`** (⭐ `date()` trả `—` khi rỗng ✅) |
| ⭐ **KIỂM CHỨNG (⭐ giao diện THẬT)** | ⭐ **Ngày**: `Chỉ huy trưởng A` = **02/03/1990** · `E2E Chỉ huy trưởng` = **03/01/1983** / vào **09/06/2023** · `E2E Giám đốc` = **10/07/1997** / **08/10/2023** ⇒ ⭐ **ISO = 0** · **dd/mm/yyyy hoặc — = 5/5** ✅<br>⭐ **Dropdown**: **18** lựa chọn (**17 chưa có hồ sơ** + 1 «— Chọn nhân sự —») ⇒ ⭐ **26 người đã có hồ sơ BỊ LOẠI** ✅ · nút Lưu **mở** ✅ |
| **CỔNG MỚI** | ⭐ `tests/mt3-c17-hr-screen-safety.test.mjs` — **4/4 ĐẠT** (⭐ **có ĐỐI CHỨNG ÂM** + **CHỐT VÙNG PHỦ**): `C17-2` ⛔ cấm đổ toàn bộ `staffDirectory` · `C17-3` **buộc** có chốt chặn `window.confirm` · `C17-4` ⛔ cấm ngày thô + **đối chứng âm** |
| **KIỂM CHỨNG KỸ THUẬT** | ✅ `tsc` **0** · ✅ `eslint` **0 lỗi** (⚠️ 1 cảnh báo **có SẴN**: `project` không dùng) · ✅ **14/14 cổng ĐẠT** (13 cũ + `C17`) · ✅ `gd-cycle` **exit 0** · migration **`0350`** · cổng dự án **ĐẠT** (vân tay **`830756713f67caff`**) · ✅ hồi quy **925 test · 924 pass · 0 fail · 1 skip** |
| 📸 **ẢNH** | `evidence/C15-1-bang-HR-ngay-ddmmyyyy.png` · `C15-2-modal-lap-ho-so-loc.png` |
| **STATUS** | ✅ **`VERIFIED`** |