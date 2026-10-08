# DEV_LOG — SESSION_C (ERP-SESSION-03)

> Phát triển kỹ thuật THẬT. ID: `DEV-YYYYMMDD-CNN`. Category: FRONTEND · UI_UX · BUGFIX …

---

## DEV-20261007-C01 — Cổng chặn lời gọi `update_user` thừa trong modal «Sửa hồ sơ»

| Trường | Nội dung |
|---|---|
| **Category** | `FRONTEND` · `BUGFIX` |
| **Tệp** | `app/screens/HrProfileEditModal.tsx` |
| **Liên kết** | `BUG-20261007-C01` · `TASK-20261007-C01` |

### Vấn đề kỹ thuật
Modal có 2 tab nhưng form **chỉ render phần của tab đang mở**:

```tsx
{tab === "user" ? (<div className="form-grid"> …ô TÀI KHOẢN… </div>)
                : (<div className="form-grid"> …ô HỒ SƠ (CCCD…)… </div>)}
```

`new FormData(event.currentTarget)` chỉ gom các ô **có trong DOM** ⇒ ở tab «Thông tin cá nhân»,
payload gửi lên `update_user` chỉ còn `{ userId }`; backend yêu cầu `fullName` **không rỗng**
(`UserManagementUseCase.java:115-125` — `fullName` là trường **duy nhất không có fallback**) ⇒ **400**.

### Bản vá (3 lớp, đều ở FE)
```tsx
if (!ok) { setBusy(false); return; }                       // ① không chạy tiếp khi đã lỗi

const accountTabSubmitted = fd.has("fullName");            // ② CỔNG: chỉ gọi khi tab tài khoản được gửi
if (accountTabSubmitted && canEditAccount) {
  const accountText = (name: string, fallback: string) => { // ③ luôn đủ trường bắt buộc
    const raw = fd.get(name);
    const value = raw === null ? "" : String(raw).trim();
    return value || fallback;
  };
  const accountPayload: Row = {
    userId,
    employeeCode: accountText("employeeCode", String(row.employeeCode ?? "")),
    username: accountText("username", String(row.username ?? "")),
    fullName: accountText("fullName", fullName),
    email: accountText("email", String(row.email ?? "")),
    organizationUnitId: accountText("organizationUnitId", String(row.organizationUnitId ?? "")),
  };
  const accountOk = await submit("update_user", accountPayload);
  if (!accountOk) {                                         // ④ thất bại ⇒ KHÔNG đóng modal
    setError("Hồ sơ nhân sự ĐÃ lưu, nhưng phần THÔNG TIN TÀI KHOẢN chưa cập nhật được …");
    setBusy(false);
    return;
  }
}
setBusy(false);
close();
```

### Vì sao vá ở FE là ĐÚNG (⛔ không phải che lỗi)
- Lời gọi `update_user` khi người dùng **chỉ sửa CCCD** là **SAI VỀ NGHIỆP VỤ** (modal hồ sơ không
  có nhiệm vụ đồng bộ tài khoản nếu người dùng không chạm vào phần tài khoản) ⇒ bỏ nó **xoá đúng
  nguyên nhân**, ⛔ không phải né lỗi.
- Lớp ③ là **phòng thủ chiều sâu**: khi CÓ đồng bộ thật thì payload luôn hợp lệ.

### Nợ kỹ thuật BE (⛔ cố ý chưa sửa — luật user «FE → BE → DB»)
`UserManagementUseCase.java:109-116`: `employeeCode` và `username` **có** fallback `sv(target, …)`,
`fullName` **không** ⇒ bất đối xứng. Route JS cũ `scripts/system-route.mjs:3099-3113` **cùng dạng**.
⇒ `HANDOFF-20261007-C02`.

---

## DEV-20261007-C02 — Lược bỏ RÁC kỹ thuật khỏi 5 tab màn Tổ đội (giữ nguyên DỮ LIỆU hợp đồng)

| Trường | Nội dung |
|---|---|
| **Category** | `UI_UX` · `FRONTEND` |
| **Tệp** | `app/screens/TeamDirectory.tsx` |
| **Liên kết** | `TASK-20261007-C02` |

### Nguyên tắc phân tách (áp tiền lệ MỐC 116 đã có trong chính tệp)
| | Xử lý |
|---|---|
| Khối `TM-PURE-BEGIN/END` (hằng số cột, tab, `source`, hàm thuần) | ✅ **GIỮ NGUYÊN** — đây là DỮ LIỆU cho 6 test `tests/tm0*.test.mjs` |
| Phần **render** in tên bảng/cột CSDL, `payload`, tên action, đường dẫn tệp | ⛔ **GỠ** |

### Danh sách đã gỡ / đổi (đo trên mã)
| # | Trước | Sau |
|---|---|---|
| 1 | Card **«Nguồn dữ liệu của 6 tab»** (bảng `Tab · Số dòng · Nguồn · Ghi chú` in `stock_issues.team_id`, `inventory[].balance`, `team_members …`) | **gỡ hẳn** |
| 2 | `<p data-team-source-notes="TM-01">` in `team_members …` · `stock_issues · material_returns` · `teams WHERE active=1` | **gỡ hẳn** (hàm `teamListSourceNotes()` vẫn giữ, nay **export**) |
| 3 | `note` tab Kho: `inventory[].balance · available · reserved` | «Kho đang gắn với tổ đội này.» |
| 4 | Empty tab Kho: `payload không có dòng tồn kho nào …` | «Kho của tổ đội chưa phát sinh nhập/xuất nên chưa có tồn kho.» |
| 5 | `note` tab Dự án: `teams.project_id NOT NULL` | «Mỗi tổ đội thuộc một dự án.» |
| 6 | Card «TÁI DÙNG logic cấp phát kho» + `note` in `action issue_stock / return_stock` | «Phiếu cấp phát & hoàn trả của tổ đội» |
| 7 | Empty bảng cấp phát: `… mang team_id của tổ đội này` | «Chưa có … nào của tổ đội này.» |
| 8 | `note` tab Lịch sử: `stock_issues.team_id + material_returns.team_id + audit_logs(…)` | «Mọi đơn/phiếu liên quan đến tổ đội: cấp phát · hoàn trả · nhật ký thao tác.» |
| 9 | Empty audit: `payload … scripts/system-route.mjs:756 …` | «Bạn chưa được xem lịch sử thao tác của tổ đội này.» |
| 10 | `note` HĐ giao khoán: `team_subcontracts.team_id · team_settlements.team_id` | **gỡ note** |
| 11 | Empty HĐ giao khoán: `… trong payload` | «Tổ đội chưa có hợp đồng giao khoán nào.» |
| 12 | Empty nhân sự: `payload bootstrap … BootstrapDataAdapter …` | «Chưa có dữ liệu thành viên của tổ đội trong phiên bản đang chạy.» |
| 13 | `note` nhân sự đã rời: `(team_members.left_at · active=0)` | **gỡ note** |
| 14 | Ô «Thành viên»/«Hoạt động gần nhất»/«Dự án» in kèm `<small>` lý do CSDL | chỉ còn **giá trị** hoặc «chưa có nguồn» |
| 15 | Empty ô Dự án: `teams.project_id không tra được trong projects[]` | «chưa có nguồn» |

### ⛔ GIỮ (không phải rác)
- `data-team-sort-note="TM-02"` — «ĐANG HOẠT ĐỘNG → hoạt động gần nhất ↓ → ngừng» = **quy tắc nghiệp vụ**
  cho người dùng; test `tm02:101-104` khoá nguyên văn.
- Nút **Xuất CSV** (UTF-8 + BOM) · toàn bộ dữ liệu nghiệp vụ 5 tab · cổng quyền `teamGates`.

### Điểm neo cho test (mới thêm)
`export { …, teamListSourceNotes, TEAM_WAREHOUSE_STOCK_FIELDS }` — hai ký hiệu này **hết chỗ render**
nhưng **⛔ không được xoá** (dữ liệu hợp đồng) ⇒ export để vẫn là một phần API của mô-đun.

---

## DEV-20261007-C03 — AUDIT UTF-8 toàn bộ đường xuất Excel/CSV (theo yêu cầu user) + vá 2 tệp mẫu

| Trường | Nội dung |
|---|---|
| **Category** | `UI_UX` · `BUGFIX` · `TESTING` |
| **Liên kết** | `BUG-20261007-C02` · `TASK-20261007-C03` · `TEST-20261007-C04` |

### Bảng audit ĐẦY ĐỦ (đo trên mã + trên byte, ⛔ không suy đoán)

| # | Đường xuất | Cơ chế mã hoá | Kết quả ĐO |
|---|---|---|---|
| 1 | `lib/tabular-export.ts` → `downloadCsv(headers, rows, name)` | `new Blob(["\ufeff", csvText(...)], {type:"text/csv;charset=utf-8"})` | ✅ **CÓ BOM** |
| 2 | `lib/tabular-export.ts` → `csvText` | bọc `"…"`, nhân đôi `""`, mở đầu `sep=;` | ✅ giữ dấu |
| 3 | `lib/tabular-export.ts` → `buildSimpleXlsxBytes` / `downloadSimpleXlsx` | `strToU8(...)` (fflate = UTF-8) cho **mọi** phần XML + `encoding="UTF-8"` | ✅ **CHẠY THẬT: ĐẠT** |
| 4 | `lib/boq-export.ts` (CSV + XLSX + PDF) | đi qua (1)(3) | ✅ |
| 5 | `lib/request-export.ts` (phiếu/PO/giao nhận: XLSX + PDF) | `strToU8` + `blobBytes` | ✅ |
| 6 | `lib/material-catalog-export.ts` (XLSX) | `strToU8` + `zipSync` | ✅ |
| 7 | `lib/report-rows.ts` → `reportExport` (mọi nút «⇩ CSV/XLSX» ở trang Báo cáo) | đi qua (1)(3) | ✅ |
| 8 | `lib/ui-shared.tsx` `exportDeliveredCsv` · `exportPaymentsCsv` | đi qua (1) | ✅ |
| 9 | `app/screens/*` (`TeamDirectory` · `Inventory` · `ConstructionScreen` · `MaterialListTable` · `MaterialCategoryList` · `ProjectDetailTabs` · `WorkCenter`) | đi qua (1) | ✅ |
| 10 | `app/page.tsx` các nút `downloadCsv(...)`/`reportExport(...)`/`reportPdf(...)` | đi qua (1)(3) | ✅ |
| 11 | `scripts/local-runtime.mjs:101` · `scripts/universal-runtime.mjs:40` | `.csv → "text/csv; charset=utf-8"` | ✅ |
| 12 | Java `ExcelTemplateService` (`GET /api/system?action=template`) | Apache POI ghi XSSFWorkbook (XML UTF-8) · tên tệp **ASCII** (`template_boq.xlsx`…) | ✅ |
| 13 | **`public/templates/*.csv` (tệp mẫu tĩnh tải qua `downloadPublicTemplate`)** | tệp trên đĩa | ⛔ **2/5 tệp THIẾU BOM** |

### Phép đo quyết định (byte đầu tệp)
```
Mau_BOQ_Hop_Dong_VNTECH_V5.csv                   596B  BOM=True
Mau_BOQ_Hop_Dong_VNTECH.csv                      890B  BOM=True
Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv               241B  BOM=False  ⛔
Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv  1175B BOM=False  ⛔
Mau_Phieu_De_Nghi_Cap_Vat_Tu_VNTECH.csv          605B  BOM=True
```
⇒ **Nguyên nhân**: Excel (Windows) không tự dò UTF-8 ⇒ đọc theo bảng mã hệ thống ⇒ **mất dấu**. BOM là
**bắt buộc** cho CSV tiếng Việt. Đây là lỗi ở **tệp dữ liệu**, ⛔ không phải ở code tải.

### Bản vá
1. Thêm BOM `EF BB BF` vào 2 tệp mẫu CSV (241→**244 B**, 1175→**1178 B**) — ⛔ không đổi nội dung/dòng.
2. Cổng mới `tests/mt3-c03-export-utf8.test.mjs` (**5 ca**, đã vào `test:regression`):
   - **CHẠY THẬT**: trích `buildSimpleXlsxBytes` (esbuild TS→CJS) → dựng tệp `.xlsx` → **`unzipSync`** →
     đọc `xl/worksheets/sheet1.xml` + `xl/workbook.xml` → khẳng định tiếng Việt **còn nguyên dấu**
     (`Mã vật tư`, `Cáp điện Cu/PVC 3x2.5 — Đồng hồ đo điện`) + khai báo `encoding="UTF-8"` +
     **đối chứng âm** chống mojibake kiểu Latin-1.
   - **CHẠY THẬT**: `csvText` giữ dấu + nhân đôi nháy kép + có dòng `sep=;`.
   - Tĩnh: `downloadCsv` phải có BOM + charset.
   - **Quét đệ quy** `public/**`: **mọi** `.csv` phải có BOM + là UTF-8 hợp lệ (đây là ca bắt được lỗi thật).
   - Quét `app/**` + `lib/**`: **chỉ** `lib/tabular-export.ts` được phát `text/csv`.

### ⚠️ Phát hiện phụ (⛔ chưa sửa — cần user/phiên khác quyết)
`public/templates/*.xlsx` và `Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.xlsx` là tệp **nhị phân**
(⛔ không áp dụng BOM) — đã kiểm: chúng là ZIP hợp lệ (`PK…`), nội dung do Excel/POI sinh ⇒ ✅ không phải lỗi.

---

## DEV-20261007-C04 — Hợp nhất bảng nhãn trạng thái (3 bản → 1) + dịch mã CHỮ HOA

| Trường | Nội dung |
|---|---|
| **Category** | `UI_UX` · `FRONTEND` · `BUGFIX` |
| **Liên kết** | `BUG-20261007-C03` · `TASK-20261007-C04` · `DEC-20261007-C06` |

### Kỹ thuật đã làm
1. **`lib/status-labels.ts`** — thêm `DOMAIN_STATUS_LABELS.supply` (22 nhãn chuỗi cung ứng, ⛔ **nguyên văn** từ bảng cũ)
   · tách `knownStatusLabel(value, domain): string | undefined` (⛔ KHÔNG humanize) khỏi `statusLabel()` ·
   thêm bước **tra chéo domain** theo `DOMAIN_LOOKUP_ORDER = ["project","work_item","approval_step","supply"]`
   (**khớp chính xác trước, rồi mới không phân biệt hoa/thường**) ⇒ tất định, ⛔ không phụ thuộc thứ tự khoá object.
2. **`app/components/ui/StatusBadge.tsx`** — `looksLikeRawCode` nay `/^[A-Za-z0-9_.-]+$/` (nhận chữ HOA);
   ⛔ vẫn ⛔KHÔNG đụng chuỗi có dấu cách/ký tự tiếng Việt; **màu** suy từ **chữ hiển thị** thay vì mã thô.
3. **`lib/labels.ts`** — bỏ bảng sao chép; hàm mỏng: duyệt `supplyStatus → status → postingStatus`,
   lấy trường ĐẦU TIÊN có **nhãn đã biết** (giữ đúng hành vi cũ), ⛔ không trường nào có nhãn ⇒ dịch trường đầu
   bằng bảng chung (domain `supply`) thay vì **in mã thô**.
4. **`lib/report-catalog.ts`** — bỏ bảng 9 mã + fallback `?? String(v)`; uỷ quyền bảng chung, giữ «(không xác định)» khi rỗng.
5. **3 màn** — `Delivered.tsx` (nhãn lọc + cột TÌNH TRẠNG) · `Purchasing.tsx` (fallback nhãn PR/PO/lọc) ·
   `ProjectDetailTabs.tsx` (trạng thái nhiệm vụ qua `taskStatusLabel`).

### ⚠️ Vì sao KHÔNG hợp nhất 2 bảng PR/PO ở `Purchasing.tsx`
`PR_STATUS_LABEL` và `PO_STATUS_LABEL` là bảng **đặc thù phân hệ**: cùng mã `pending_approval` nhưng nhãn PR ≠ nhãn PO,
và UI cố ý hiện **cả hai** («PR-nhãn / PO-nhãn») khi mã có ở cả hai loại dòng (MT2 §6.9).
⇒ Giữ lại **có lý do**, và nay **đã có fallback về bảng DÙNG CHUNG** ⇒ ⛔ hết rò tiếng Anh.
Cổng C04 kiểm đúng vế «phải có fallback chung» (miễn trừ **có điều kiện**, ⛔ không miễn trừ trắng).

---

## DEV-20261007-C05 — Mở rộng bảng nhãn DÙNG CHUNG: domain `priority` + `seal_type`

| Trường | Nội dung |
|---|---|
| **Category** | `UI_UX` · `FRONTEND` |
| **Liên kết** | `BUG-20261007-C04` · `TASK-20261007-C05` · `CHG-20261007-C07` |

### Kỹ thuật đã làm
1. `lib/status-labels.ts`: thêm **`priority`** (5 mức — ⛔ **khớp TỪNG CHỮ** với `KANBAN_PRIORITIES`) và
   **`seal_type`** (4 loại); nối 2 domain vào `DOMAIN_LOOKUP_ORDER` (**thứ tự cố định** ⇒ tất định).
2. `ProjectDetailTabs.tsx` · `SealScreen.tsx` · `WorkCenter.tsx` (2 chỗ) · `Requests.tsx` (bí danh
   `priorityLabel` vì tệp đó đã có `statusLabel` theo DÒNG từ `@/lib/labels`) ⇒ dùng `statusLabel(value, domain)`.

### ⚠️ QUYẾT ĐỊNH KỸ THUẬT: ⛔ KHÔNG gộp `KANBAN_PRIORITIES` vào bảng chung
`KANBAN_PRIORITIES` còn giữ **`tone`** (màu) + **`rank`** (thứ tự sắp xếp) — thứ bảng chung ⛔ không có;
và nó nằm trong **khối thuần** của `WorkKanban` mà **test `t07` TRÍCH RA CHẠY** (khối đó ⛔ **không được `import`**).
⇒ Thay vì gộp mã (sẽ phá kiến trúc test), tôi thêm **CỔNG KIỂM** bắt 2 bảng ⛔ **không được lệch nhãn** —
đúng tinh thần «một nguồn sự thật» mà ⛔ không đập vỡ cấu trúc đang có (Goal §41: ⛔ không refactor rộng giữa GO-LIVE).

### ⛔ SAI LẦM ĐÃ SỬA (tự nhận, ghi để phiên sau ⛔ không lặp)
Sau khi **đã build lần 4**, tôi thêm domain `contract_type` vào `lib/status-labels.ts` để S01 dùng cho
`app/page.tsx`. ⛔ **Sai về QUY TRÌNH**: sửa `lib/**` (thuộc ROOT_DIRS) **sau build** ⇒ **vân tay nguồn lệch**
so với artifact đang phục vụ — đúng lớp lỗi tôi đã tự cảnh báo ở vòng 2.
✅ **Đã HOÀN TÁC ngay**; kiểm lại: `contract_type` = **0 lần** trong tệp, cổng C04 **10/10**, `tsc` **0**.
⇒ Nhãn đó nay nằm **trong `HANDOFF-20261007-C04`** để S01 tự thêm (tệp `app/page.tsx` thuộc S01) — hoặc phiên 03
thêm vào **lần build sau**. ⭐ **LUẬT**: mọi thay đổi `lib/**`/`app/**` phải xong **TRƯỚC** `gd-cycle`, ⛔ không sửa sau.


---

## DEV-20261007-C06 — Kỹ thuật: **CHỐT CHẶN CUỐI** cho nhãn trạng thái (⛔ không phơi mã thô) + **bộ dò không báo động giả**

### 1. Vấn đề kỹ thuật
Nhiều màn khai báo bảng nhãn **CỤC BỘ** (`WORK_STATUS_LABELS` trong `lib/ui-shared.tsx`, `PROJECT_STATUS_LABELS`, `taskStatusLabel`…),
rồi viết `MAP[value] || String(value)` ⇒ ⛔ **khi dữ liệu có khoá mới/ngoài bảng ⇒ phơi MÃ THÔ** ra UI.
⚠️ Đây ⛔ **không phải lỗi của bảng nhãn dùng chung** (`lib/status-labels.ts` đã phủ đủ) mà là **lỗi của chỗ GỌI**: ⛔ không dùng chốt chặn cuối.

### 2. Cách vá (⭐ 1 dòng/nhánh, ⛔ không refactor)
| Trước | Sau |
|---|---|
| `MAP[x] \|\| String(x \|\| "—")` | `MAP[x] \|\| statusLabel(x, "<miền>")` |
| `cond ? "Đã xuất" : String(x)` | `cond ? "Đã xuất" : statusLabel(x)` |
| `MAP[key] \|\| key` | `MAP[key] \|\| statusLabel(key, "work_item")` |

⭐ **Vì sao AN TOÀN**: `statusLabel(v, miền)` tra **miền → bảng chung → `humanize`** và **⛔ không bao giờ trả rỗng**;
nhánh mới **chỉ chạy ở đúng chỗ TRƯỚC ĐÂY phơi mã thô** ⇒ ⭐ **cải thiện thuần**.

### 3. Bộ dò (⭐ bài học: **phải HIỆU CHỈNH bộ dò trước khi tin nó**)
Bộ dò đầu tiên bắt `\|\|\s*String\(` ⇒ ⛔ **BÁO ĐỘNG GIẢ** ở `ProjectDetailTabs.tsx`:
`taskStatusLabel(String(row.status \|\| "todo"))` — ở đó `String(...)` là **ĐỐI SỐ** của hàm nhãn (giá trị thô **được dịch tiếp**), ⛔ **không phải giá trị cuối**.
✅ **Hiệu chỉnh**: chỉ bắt khi `String(...)` là **giá trị CUỐI** ⟹ ① `\|\|\s*String\([^()]*\)\s*$` · ② `:\s*String\(<biến>\.<trường>` (nhánh else tam phân) · ③ cả biểu thức là `String(...)`.
⇒ Sau hiệu chỉnh: bắt **đúng 6 chỗ thật**, ⛔ **0 báo động giả** (kiểm bằng **đối chứng âm** trong cổng C11-4).

### 4. Nguồn nhãn (⛔ không sinh nguồn thứ hai)
`lib/status-labels.ts` — 10 miền: `project` · `work_item` (đủ **12** trạng thái) · `approval_step` · `supply` · `priority` · `seal_type` ·
`certificate_status` · `delivery_document` · `bch_confirmation` · `qc_result`.
---

## DEV-20261007-C07 — ⚠️ **VẬN HÀNH: 2 bài học khi khởi động lại dịch vụ dùng chung** (⭐ từ sự cố vòng 64)

### ① ⛔ **KHÔNG pipe output của server dài hạn** (⚠️ đã xảy ra THẬT)
- ⛔ SAI: ``node scripts/local-server.mjs 2>&1 | Select-Object -Last 2`` (trong job nền) ⇒ ⚠️ `Select-Object` **tiêu thụ hết stream rồi ĐÓNG pipe** ⇒ ⚠️ server nhận **EPIPE** ⇒ ⛔ **TIẾN TRÌNH CHẾT** (⚠️ `:8787` DOWN, ⚠️ `:9000` nghe nhưng **không trả lời** vì upstream chết).
- ✅ ĐÚNG: chạy job nền **KHÔNG pipe** — ``node scripts/local-server.mjs`` (⭐ output để nguyên) ✅ · ⭐ tương tự cho `tools/cutover-proxy.mjs` ✅.

### ② ⚠️ **TRƯỚC KHI khởi động lại dịch vụ dùng chung ⇒ KIỂM CỔNG TRƯỚC**
- ⭐ Nếu cổng **đang được phục vụ** ⇒ ⚠️ **phiên khác đã lên** ⇒ ⛔ **đừng khởi động lại** (⚠️ sẽ gặp `EADDRINUSE` **và** ⚠️ có thể **giết dịch vụ đang chạy tốt**).
- ✅ Cách đúng: ``Get-NetTCPConnection -LocalPort 8787 -State Listen`` + ⭐ **gọi thử HTTP** ⇒ ⭐ **chỉ khởi động khi THẬT SỰ down** ✅.

### ③ ⚠️ **ĐỔI DẤU VÂN TAY ⇒ CỬA SỔ VÀI PHÚT MỌI PHIÊN KHÔNG KHỞI ĐỘNG ĐƯỢC DỊCH VỤ**
- ⭐ `scripts/local-runtime.mjs:177` kiểm `vntech_product_identity.source_fingerprint` (`.local-data/warehouse.sqlite`) vs SSOT (`lib/vntech-identity-data.mjs`) ⇒ ⚠️ ai **sửa SSOT mà chưa đồng bộ** ⇒ ⛔ **mọi phiên khác** gặp ``Error: Dau van tay san pham VNTECH khong hop le hoac da bi thay doi.``
- ✅ **CÁCH XỬ LÝ ĐÚNG (⭐ khi KHÔNG phải người sửa)**: ⭐ **KIỂM TRƯỚC** ``node tools/set-local-identity.mjs`` (⭐ nó **ĐỌC SSOT hiện tại** và báo «Đã khớp — không cần sửa» nếu ổn ✅) ⇒ ⭐ nếu **thật sự lệch** ⇒ chạy nó ✅ (⚠️ chỉ sửa `.local-data` — ⛔ **KHÔNG** đụng mã nguồn ⛔ **KHÔNG** tạo migration) · ⚠️ nếu **đang lệch vì phiên khác đang sửa dở** ⇒ ⭐ **CHỜ + báo handoff** (⛔ đừng "sửa" SSOT của họ).
- ⛔ **TUYỆT ĐỐI KHÔNG**: sửa `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json` (⭐ **LOCK phiên 01**) · tạo migration vân tay (⚠️ `DEC-20261006-015`: migration nằm trong `ROOT_DIRS` ⇒ ghi vân tay vào nó **làm vân tay đổi** ⇒ **vòng lặp vô hạn** ⚠️ đã ghi ở `tools/_sync-identity-once.mjs`).