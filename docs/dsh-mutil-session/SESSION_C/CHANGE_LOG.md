# CHANGE_LOG — SESSION_C (ERP-SESSION-03)

> Thay đổi THỰC TẾ của hệ thống (Before → After). ⛔ KHÔNG ghi ý tưởng chưa làm.
> ID: `CHG-YYYYMMDD-CNN`.

---

## CHG-20261007-C01 — Modal «Sửa hồ sơ»: sửa CCCD không còn báo lỗi trường tài khoản

| Trường | Nội dung |
|---|---|
| **Tệp** | `app/screens/HrProfileEditModal.tsx` |
| **Loại** | HOTFIX · FRONTEND |
| **Liên kết** | `BUG-20261007-C01` · `DEV-20261007-C01` |
| **Status** | `FIXED` (chờ build + user nghiệm thu) |

| | BEFORE | AFTER |
|---|---|---|
| Lời gọi `update_user` khi ở tab «Thông tin cá nhân» | **LUÔN gọi**, payload chỉ có `{ userId }` | ⛔ **KHÔNG gọi** (cổng `fd.has("fullName")`) |
| Trường bắt buộc trong payload tài khoản | Chỉ gửi trường nào **có giá trị trong form** ⇒ `fullName` rỗng | **Luôn đủ 5 trường**, rỗng ⇒ lấy **giá trị hiện có** của hồ sơ |
| Khi `update_user` trả lỗi | **Bỏ qua kết quả**; `save_hr_record` xong ⇒ **modal vẫn đóng** | Giữ `accountOk`; lỗi ⇒ **giữ modal mở** + báo «Hồ sơ nhân sự ĐÃ lưu, …» |
| Kết quả thao tác của user | Sửa CCCD ⇒ **400** «Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc» | Sửa CCCD ⇒ **lưu bình thường**, không thông báo lỗi |

---

## CHG-20261007-C02 — Màn Tổ đội: gỡ 15 chỗ thông tin kỹ thuật (rác) khỏi giao diện

| Trường | Nội dung |
|---|---|
| **Tệp** | `app/screens/TeamDirectory.tsx` (chỉ phần RENDER) |
| **Loại** | UI_UX |
| **Liên kết** | `TASK-20261007-C02` · `DEV-20261007-C02` |
| **Status** | `FIXED` (chờ build + user nghiệm thu) |

**BEFORE** — người dùng thấy, ngay trên màn Tổ đội:
- Card **«Nguồn dữ liệu của 6 tab»**: bảng 4 cột in `stock_issues.team_id`, `material_returns.team_id`,
  `audit_logs(entity_type='team')`, `inventory[].balance/available/reserved`…
- Dòng `<p>` nguồn danh sách: `team_members …` · `stock_issues · material_returns …` · `teams WHERE active=1`.
- Trong từng ô của bảng: `<small>` in lý do CSDL (`teams.project_id không tra được trong projects[]`).
- Ghi chú card in tên bảng/cột, tên action backend (`issue_stock`/`return_stock`), tên lớp Java
  (`BootstrapDataAdapter`), đường dẫn tệp (`scripts/system-route.mjs:756`), khoá payload (`payload`),
  ràng buộc CSDL (`NOT NULL`), mã mục tài liệu (`MT3 §G`).

**AFTER**:
- ⛔ **Không còn** bất kỳ tên bảng/cột CSDL, khoá payload, tên action, đường dẫn tệp nào **hiển thị** cho người dùng.
- Mọi `note`/empty-state nay là **câu tiếng Việt nghiệp vụ**.
- ✅ Giữ nguyên: 6 cột danh sách, 5 tab chi tiết, quy tắc sắp xếp (TM-02), nút Xuất CSV (UTF-8/BOM),
  các cổng quyền, và **toàn bộ dữ liệu hợp đồng** trong khối `TM-PURE`.

---

## CHG-20261007-C03 — Test: bổ sung cổng chống tái phát + 2 assertion đổi theo yêu cầu mới

| Trường | Nội dung |
|---|---|
| **Tệp** | `tests/mt3-c03-hotfix-ui.test.mjs` (**MỚI**) · `tests/tm01-team-list.test.mjs` · `tests/tm05-team-allocations.test.mjs` · `tests/moc-96-105-no-regression.test.mjs` |
| **Loại** | TESTING |
| **Status** | `DONE` |

| | BEFORE | AFTER |
|---|---|---|
| `tests/mt3-c03-hotfix-ui.test.mjs` | *không tồn tại* | **8 ca**: khoá 4 điều của hotfix CCCD + guard chống in rác kỹ thuật lên màn Tổ đội (quét **chuỗi hiển thị**, ⛔ không quét mã) |
| `tests/tm01:115` | `assert.match(screen, /data-team-source-notes="TM-01"/)` — **BẮT BUỘC** UI in khối ghi nguồn CSDL | ⛔ **ĐẢO THÀNH KHẲNG ĐỊNH ÂM** (`doesNotMatch`) + vẫn bắt buộc **hàm** `teamListSourceNotes` phải tồn tại |
| `tests/tm05:106` | bắt buộc empty-state chứa `mang team_id của tổ đội này` | bắt buộc empty-state **nói rõ chưa có chứng từ** + `doesNotMatch(/mang team_id của tổ đội này/)` |
| `tests/tm05:125` | bắt buộc tiêu đề `TÁI DÙNG logic cấp phát kho` | bắt buộc tiêu đề nghiệp vụ `Phiếu cấp phát & hoàn trả của tổ đội` + vẫn bắt buộc render từ `allocations` |
| `tests/moc-96-105-no-regression.test.mjs` | `between()` **bỏ qua** tham số `to`, cắt cứng 1400 ký tự ⇒ cửa sổ **tràn sang code mới** ⇒ **đỏ OAN** | thêm `betweenExact()` cắt **đúng mốc kết thúc của chính lời gọi**, nhận **REGEX** (tệp dùng CRLF nên `");\n"` ⛔ không bao giờ khớp) |

> ⚠️ **Tự giác ghi rõ**: 3 assertion bị **đổi theo yêu cầu mới của user** (bỏ thông tin rác).
> ⛔ Đây **không phải hạ chuẩn test**: ĐIỀU CẦN CHỨNG MINH của mỗi ca được **giữ nguyên**, chỉ đổi
> **cách diễn đạt** mà giao diện phải dùng. Ghi ở `DECISION_LOG.md` §`DEC-20261007-C03`.

---

## CHG-20261007-C04 — 2 tệp mẫu CSV nay có BOM UTF-8 (hết lỗi mất dấu khi mở bằng Excel)

| Trường | Nội dung |
|---|---|
| **Tệp** | `public/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv` · `public/templates/Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv` |
| **Loại** | BUGFIX · UI_UX (asset) |
| **Liên kết** | `BUG-20261007-C02` · `DEV-20261007-C03` · `TEST-20261007-C04` |
| **Status** | `FIXED` (chờ user nghiệm thu) |

| | BEFORE | AFTER |
|---|---|---|
| Byte đầu `Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv` | `sep=;…` (**241 B**, ⛔ không BOM) | `EF BB BF` + `sep=;…` (**244 B**) |
| Byte đầu `Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv` | `sep=;…` (**1175 B**, ⛔ không BOM) | `EF BB BF` + `sep=;…` (**1178 B**) |
| Excel (Windows) mở tệp mẫu | **SAI DẤU** tiếng Việt | **ĐÚNG DẤU** |
| Bản phục vụ `:8787` / `:9000` | 241 B / 1175 B ⛔ không BOM | **244 B / 1178 B ✅ có BOM** (sau build lại) |

⛔ **Không** đổi nội dung, ⛔ không đổi ký tự xuống dòng — **chỉ** thêm 3 byte BOM ở đầu mỗi tệp.

---

## CHG-20261007-C05 — Thêm cổng chống tái phát cho mọi đường xuất Excel/CSV

| Trường | Nội dung |
|---|---|
| **Tệp** | `tests/mt3-c03-export-utf8.test.mjs` (**MỚI**, 5 ca) |
| **Loại** | TESTING |
| **Status** | `DONE` |

| | BEFORE | AFTER |
|---|---|---|
| Cổng UTF-8 cho export | ⛔ **không có** ⇒ 2 tệp CSV thiếu BOM **tồn tại qua nhiều lần build** | **5 ca**, gồm **quét đệ quy `public/**`** bắt buộc BOM + UTF-8 hợp lệ |
| Kiểm XLSX | chỉ so khớp chuỗi trong mã nguồn | **CHẠY THẬT**: dựng `.xlsx` → **giải nén** → đọc lại XML → khẳng định tiếng Việt còn nguyên dấu |
| Quy tắc phát CSV | không ràng buộc | **chỉ** `lib/tabular-export.ts` được phát `text/csv` |

---

## CHG-20261007-C06 — Trạng thái đơn/phiếu nay hiển thị tiếng Việt ở MỌI đường (kể cả tệp xuất)

| Trường | Nội dung |
|---|---|
| **Tệp** | `lib/status-labels.ts` · `lib/labels.ts` · `lib/report-catalog.ts` · `app/components/ui/StatusBadge.tsx` · `app/screens/Delivered.tsx` · `app/screens/Purchasing.tsx` · `app/screens/ProjectDetailTabs.tsx` |
| **Loại** | BUGFIX · UI_UX |
| **Liên kết** | `BUG-20261007-C03` · `TASK-20261007-C04` · `TEST-20261007-C05` |
| **Status** | `FIXED` (chờ user nghiệm thu) |

| | BEFORE (ĐO ĐƯỢC) | AFTER |
|---|---|---|
| `statusLabel("partial_issued")` | **«Partial issued»** ⛔ | **«Xuất một phần»** |
| `statusLabel("issued")` · `("awaiting_po")` · `("posted")` | «Issued» · «Awaiting po» · «Posted» ⛔ | «Đã xuất kho» · «Chờ lập PO» · «Đã ghi sổ» |
| `statusLabel("REWORK")` / `("WAITING_SUPPLIER")` | **«REWORK»** / **«WAITING SUPPLIER»** ⛔ | «Làm lại» / «Chờ NCC» |
| `StatusBadge value="IN_PROGRESS"` | in nguyên **`IN_PROGRESS`** ⛔ | «Đang xử lý» (dự án) · «Đang làm» (nhiệm vụ) |
| Màu badge vừa được dịch | luôn `blue` (màu suy từ MÃ THÔ tiếng Anh) | suy từ **CHỮ ĐANG HIỂN THỊ** ⇒ xanh/đỏ/vàng đúng ngữ nghĩa |
| `lib/labels.ts` (7 mô-đun, gồm 2 đường **XUẤT TỆP**) | fallback `row.supplyStatus \|\| row.status` ⇒ **rò mã thô vào Excel/PDF** ⛔ | uỷ quyền bảng DÙNG CHUNG, ⛔ không rò |
| `lib/report-catalog.ts` (Trung tâm báo cáo) | bản `statusLabel` **thứ ba**, fallback `?? String(v)` ⇒ rò mã thô ⛔ | dùng bảng DÙNG CHUNG (giữ câu «(không xác định)» cho giá trị rỗng) |
| Ô lọc «Trạng thái/Tình trạng» (Delivered · Purchasing) | nhãn = **mã thô** ⛔ | nhãn qua `statusLabel()` |

**Số bảng nhãn trạng thái trong mã nguồn: 3 → 1** (⛔ 2 bảng PR/PO đặc thù giữ lại có lý do + đã có fallback chung).

---

## CHG-20261007-C07 — Ưu tiên & Loại con dấu: hết mã tiếng Anh, hết dịch lặp 4 bản

| Trường | Nội dung |
|---|---|
| **Tệp** | `lib/status-labels.ts` · `app/screens/{ProjectDetailTabs,SealScreen,Requests,WorkCenter}.tsx` |
| **Loại** | BUGFIX · UI_UX |
| **Liên kết** | `BUG-20261007-C04` · `TASK-20261007-C05` · `TEST-20261007-C06` |
| **Status** | `FIXED` (chờ user nghiệm thu) |

| | BEFORE | AFTER |
|---|---|---|
| Cột «Ưu tiên» — `ProjectDetailTabs.tsx` | in **mã thô** (`high`/`normal`/`critical`) | «Cao»/«Bình thường»/«Khẩn cấp» |
| Cột «Ưu tiên» — `WorkCenter.tsx` (2 chỗ) | ternary tự dịch, **SÓT `critical`** ⇒ việc KHẨN CẤP hiện **«Thường»** ⛔ | `statusLabel(priority, "priority")` ⇒ «Khẩn cấp» |
| Bộ lọc «Ưu tiên» — `Requests.tsx` | dịch `high`/`normal`, ⛔ **rơi về mã thô** cho `low`/`urgent`/`critical` | đi qua bảng DÙNG CHUNG cho **mọi** mức |
| Cột «Loại» — `SealScreen.tsx` | in **mã thô** (`company`/`legal`/`signature`) | «Dấu công ty»/«Dấu pháp nhân»/«Dấu chức danh» |
| Số bản dịch ưu tiên | **4 bản song song** (Kanban · WorkCenter×2 · Requests · không dịch) | **1 nguồn** (`lib/status-labels.ts` domain `priority`) + cổng kiểm chống lệch với `KANBAN_PRIORITIES` |

⛔ **Không đổi** giá trị lưu CSDL, ⛔ không đổi `<option value>` của form nào.
⚠️ **6 trường enum KHÁC đã kiểm và ⛔ KHÔNG sửa** vì chúng **lưu thẳng nhãn tiếng Việt** (`benefitType` · `docType`×2 · `contractType` lao động · `costType`) — sửa vào là **hỏng dữ liệu hiển thị**.

---

## CHG-20261007-C08 — Tệp xuất PDF/XLSX hết mã thô Ưu tiên + cổng phủ thêm `lib/**`

| Trường | Nội dung |
|---|---|
| **Tệp** | `lib/request-export.ts` · `app/screens/RequestDrawer.tsx` · `tests/mt3-c04-status-vi.test.mjs` |
| **Loại** | BUGFIX · TESTING |
| **Liên kết** | `BUG-20261007-C05` · `TASK-20261007-C06` · `TEST-20261007-C07` |
| **Status** | `FIXED` (chờ user nghiệm thu) |

| | BEFORE | AFTER |
|---|---|---|
| Dòng tiêu đề **phiếu đề nghị xuất PDF/XLSX** (`lib/request-export.ts`) | `critical`/`low` rơi vào `text(value)` ⇒ **IN MÃ THÔ TRONG TỆP** | `statusLabel(value, "priority")` ⇒ «Khẩn cấp»/«Thấp» (⛔ giữ «Bình thường» khi giá trị rỗng) |
| Ô «Mức độ» trong modal phiếu (`RequestDrawer.tsx`) | ternary ⇒ **hiện «Bình thường» cho MỌI mã lạ** (sai nghiệp vụ) | nhãn đúng theo bảng DÙNG CHUNG |
| **Phạm vi cổng** `tests/mt3-c04-status-vi.test.mjs` | ⛔ chỉ quét `app/screens/**` ⇒ **bỏ sót đường XUẤT TỆP** | quét **cả `app/**` và `lib/**`** (11 ca) + **NỢ ĐÃ GIAO có tên** cho `app/page.tsx` (<br>`HANDOFF-20261007-C05`) — in ra **mỗi lần chạy**, ⛔ không miễn trừ trắng |
| Số ca cổng C04 | 10 | **11** |

---

## CHG-20261007-C09 — Tệp xuất «Đơn hàng đã giao»: 2 cột hồ sơ hết mã tiếng Anh

| Trường | Nội dung |
|---|---|
| **Tệp** | `lib/status-labels.ts` · `lib/request-export.ts` · `lib/ui-shared.tsx` |
| **Loại** | BUGFIX · UI_UX |
| **Liên kết** | `BUG-20261007-C06` · `TASK-20261007-C09` · `TEST-20261007-C09` |
| **Status** | `FIXED` (chờ user nghiệm thu — **đã build + xác minh LIVE**) |

| | BEFORE | AFTER |
|---|---|---|
| `exportDeliveredXlsx` — cột «Chứng chỉ» (CO/CQ) | ⛔ **`complete`** / `missing` / `not_required` | «Đã có» / «Chưa có» / **«Không yêu cầu»** |
| `exportDeliveredCsv` — cột «Chứng chỉ» | ⛔ mã thô | tiếng Việt |
| `exportDeliveredXlsx` · `exportDeliveredCsv` — cột «Giấy giao hàng» | ⛔ mã thô | «Đã có» / «Chưa có» |
| `lib/request-export.ts` (tệp PO/GRN) | ✅ đã dịch nhưng bằng **bản dịch RIÊNG** | ✅ uỷ quyền **bảng DÙNG CHUNG** (⛔ hết 2 bản song song) |
| Số domain nhãn dùng chung | 6 | **8** (`+ certificate_status` · `+ delivery_document`) |

⛔ **Không đổi** giá trị lưu CSDL, ⛔ không đổi `<option value>` của form nào; ⛔ không đổi nhãn của tệp PO/GRN (giữ nguyên chữ «Đã có»/«Chưa có»).

---

## CHG-20261007-C18 — Bảng nhãn dùng chung: +2 domain cho **giá trị THẬT trong CSDL** (`bch_confirmation` · `qc_result`)

| Trường | Nội dung |
|---|---|
| **Tệp** | `lib/status-labels.ts` |
| **Loại** | UI_UX · BUGFIX (phòng ngừa tại nguồn) |
| **Liên kết** | `TASK-20261007-C18` · `TEST-20261007-C18` · lỗi user MT3 «1 số nơi hiển thị tiếng Anh» |
| **Status** | `FIXED` (đã build lần 9 + xác minh LIVE) |

| | BEFORE | AFTER |
|---|---|---|
| `statusLabel("confirmed", …)` | ⛔ «Confirmed» (humanize) | «BCH đã xác nhận» |
| `statusLabel("accepted" / "passed", …)` | ⛔ «Accepted» / «Passed» | «Đạt» |
| Số domain nhãn | 8 | **10** (`+ bch_confirmation` · `+ qc_result`) |
| `DOMAIN_LOOKUP_ORDER` | 8 mục | **GIỮ NGUYÊN 8 mục** ⭐ (⛔ 2 domain mới **không** vào — tránh đổi nhãn mã dùng chung `pending`/`rejected`) |
| Nhãn của mã dùng chung đang chạy | 21 nhãn | ⭐ **GIỮ NGUYÊN** — khoá bằng snapshot `C09-3` |

⚠️ **Tác động nhìn thấy trên màn hình hôm nay: ⛔ KHÔNG ĐỔI** — vì **5 call site** (`Inventory.tsx` · `PurchaseOrderDrawer.tsx` · `ReceiptDrawer.tsx` · `app/page.tsx`) **vẫn dịch tay** bằng ternary (⛔ phiên 03 không refactor tệp của phiên khác — §41).
✅ Giá trị của thay đổi: **bịt lỗ hổng tiềm ẩn** (từ nay nếu ai truyền thẳng `qcStatus`/`bchConfirmationStatus` vào `StatusBadge`/`statusLabel` với domain thì hiện **tiếng Việt**, ⛔ không còn «Passed»/«Confirmed») **+ khoá hồi quy 21 nhãn** bằng cổng `C09`.

---

## CHG-20261007-C19 — Ngày hiển thị: 4 chỗ in THÔ (`2026-10-07`) ⇒ chuẩn `dd/mm/yyyy` qua `date()`

| Trường | Nội dung |
|---|---|
| **Tệp** | `app/screens/Payments.tsx` (2 chỗ) · `app/screens/DocumentsScreen.tsx` (1) · `app/screens/ProjectTeams.tsx` (1) |
| **Loại** | UI_UX · BUGFIX |
| **Liên kết** | `TASK-20261007-C19` · `TEST-20261007-C19` · cổng `C10` |
| **Status** | `FIXED` (⏳ chờ user nghiệm thu) |

| | BEFORE | AFTER |
|---|---|---|
| `Payments.tsx` — cột «Ngày» | ⛔ `{row.paymentDate}` ⇒ **2026-10-07** | `{date(row.paymentDate)}` ⇒ **07/10/2026** |
| `Payments.tsx` — «Đến hạn: …» | ⛔ thô | ✅ `dd/mm/yyyy` |
| `DocumentsScreen.tsx` — «Ngày chứng từ» | ⛔ thô | ✅ |
| `ProjectTeams.tsx` — ngày thanh toán | ⛔ thô | ✅ |
| ⭐ `import { date }` trong 3 tệp | **có import nhưng GỌI 0 LẦN** (import thừa) | ✅ gọi ≥1 lần (đúng mục đích) |

⛔ **Không** đổi giá trị lưu CSDL · ⛔ **không** đổi `<input type="date">` (⛔ vẫn phải ISO theo chuẩn HTML) · ⛔ **không** thêm import.

---

## CHG-20261007-C20 — Thẻ trạng thái: dùng **chốt chặn CUỐI** là bảng nhãn dùng chung (⛔ hết phơi mã thô)

| Trường | Nội dung |
|---|---|
| **Mã** | `CHG-20261007-C20` |
| **Ngày / Phiên** | 2026-10-08 · `ERP-SESSION-03` |
| **Nhóm** | `FRONTEND` · `UI_UX` |
| **Mô-đun** | 6 màn có thẻ trạng thái |
| **TRƯỚC** | `PROJECT_STATUS_LABELS[String(x.status \|\| "active")] \|\| String(x.status \|\| "—")` · `WORK_STATUS_LABELS[String(x.status)] \|\| String(x.status \|\| "—")` · `String(x.status) === "issued" ? "Đã xuất" : String(x.status)` · `WORK_STATUS_LABELS[key] \|\| key` ⇒ ⛔ **thiếu khoá là PHƠI MÃ THÔ** |
| **SAU** | `… \|\| statusLabel(x.status, "project")` · `… \|\| statusLabel(x.status, "work_item")` · `… : statusLabel(x.status)` · `… \|\| statusLabel(key, "work_item")` ⇒ ⭐ **luôn có nhãn** (bảng nhãn dùng chung làm chốt chặn cuối) |
| **LÝ DO** | ⛔ hết rò tiếng Anh/mã thô trên thẻ trạng thái (đúng loại khiếu nại của user) · ⭐ **dùng lại** nguồn nhãn duy nhất (§17 REUSE) thay vì mỗi màn tự xử lý |
| **TỆP** | `app/screens/{AllocateReturn,WorkKanban,WorkCenter,TeamManagement,ProjectEntityModal,ProjectDetailTabs}.tsx` |
| **ẢNH HƯỞNG** | ⚠️ chỉ **nhánh dự phòng** đổi (nhánh trước đây **phơi mã thô**) ⇒ chỗ **đã đúng giữ nguyên** ✅ |
| **TƯƠNG THÍCH** | ✅ ⛔ không đổi API · ⛔ không đổi dữ liệu · ⛔ không thêm phụ thuộc mới (chỉ thêm `import { statusLabel }`) |
| **TEST** | ✅ cổng `tests/mt3-c11-status-no-raw.test.mjs` **4/4 ĐẠT** |
| **STATUS** | `FIXED` → ⏳ `VERIFIED` sau build + hồi quy |
---

## CHG-20261007-C21 — Phép kiểm `trust-lock-foundation` ⛔ không còn ĐỎ OAN do tranh chấp nhiều phiên

| Trường | Nội dung |
|---|---|
| **Mã** | `CHG-20261007-C21` · **Ngày / Phiên** 2026-10-08 · `ERP-SESSION-03` |
| **Nhóm** | `TESTING` · **Mô-đun** `tests/trust-lock-foundation.test.mjs` |
| **TRƯỚC** | `if ((await stat(path)).isDirectory()) …` ⇒ tệp **biến mất giữa `readdir` và `stat`** (phiên khác ghi/xoá tệp tạm ở gốc repo) ⇒ **`ENOENT` ⇒ ĐỎ OAN** |
| **SAU** | bọc `try/catch`: **`ENOENT` ⇒ `continue`** (tệp ⛔ không còn trong kho mã để kiểm) · ⛔ **lỗi khác vẫn `throw`** |
| **LÝ DO** | nhiều phiên chạy song song trên **một cây mã** ⇒ phép kiểm phải **bền với tranh chấp** |
| **TỆP** | `tests/trust-lock-foundation.test.mjs` |
| **ẢNH HƯỞNG** | ⚠️ **chỉ** bỏ qua tệp **đã biến mất**; ⭐ **giá trị chặn hồi quy giữ nguyên** (⛔ không nới lỏng phép kiểm bí mật) |
| **TƯƠNG THÍCH** | ✅ ⛔ không đổi API · ⛔ không đổi dữ liệu |
| **TEST** | ✅ **859 test · 858 pass · 0 fail** · ca đó **5/5 ĐẠT** (kể cả khi **có** tệp lạ mô phỏng phiên khác) |
| **STATUS** | ✅ `VERIFIED` |
---

## CHG-20261007-C22 — 11 chỗ **hiển thị** ngày ISO ⇒ đi qua `date()` DÙNG CHUNG (`dd/mm/yyyy`)

| Trường | Nội dung |
|---|---|
| **Mã** | `CHG-20261007-C22` · **Ngày / Phiên** 2026-10-08 · `ERP-SESSION-03` · **Nhóm** `FRONTEND` · `UI_UX` |
| **TRƯỚC** | `{row.issuedAt ? String(row.issuedAt).slice(0, 10) : "—"}` · `{datePart(po.orderedAt)\|\|"—"}` · `const d = (v) => s(v).slice(0,10)` ⇒ ⛔ hiện **`2026-10-07`** (ISO) |
| **SAU** | `{date(row.issuedAt)}` · `{date(po.orderedAt)}` · `const d = (v) => date(v)` ⇒ ✅ hiện **`07/10/2026`** |
| **LÝ DO** | ⛔ hết **KHÔNG NHẤT QUÁN ĐỊNH DẠNG NGÀY** (đúng lớp `BUG-20261007-C10`) |
| **TỆP** | `app/screens/{AllocateReturn,Purchasing,PurchaseOrderDrawer,ContractReviewScreen}.tsx` |
| **ẢNH HƯỞNG** | ⚠️ chỉ **chuỗi hiển thị**; ⛔ **KHÔNG** đổi giá trị lưu · ⛔ **KHÔNG** đổi ô nhập `type="date"` (vẫn ISO) · ⛔ **KHÔNG** đổi phép so sánh/lọc |
| **TƯƠNG THÍCH** | ✅ dùng **hàm dùng chung** `date()` (⛔ không tạo hàm mới) |
| **TEST** | ✅ cổng `C10` **6/6** · `tsc` **exit 0** · `eslint` **0 lỗi** · hồi quy **861/860/0** |
| **STATUS** | ✅ `VERIFIED` (cho **11 chỗ đã vá**) — ⚠️ **lớp `C10` vẫn mở một phần**: ⛔ chưa truy ra nguồn ISO ở 2 màn |
---

## CHG-20261007-C23 — 2 nhãn tiếng Anh («User») ⇒ **tiếng Việt** («Tên đăng nhập»)

| Trường | Nội dung |
|---|---|
| **Mã** | `CHG-20261007-C23` · **Ngày / Phiên** 2026-10-08 · `ERP-SESSION-03` · **Nhóm** `UI_UX` |
| **Mô-đun** | `app/screens/ErrorReportAdminPanel.tsx` |
| **TRƯỚC** | `<th>…</th><th>User</th>` (tiêu đề cột) · `<dt>User</dt><dd>{open.username}` (nhãn chi tiết) |
| **SAU** | `<th>Tên đăng nhập</th>` · `<dt>Tên đăng nhập</dt>` |
| **LÝ DO** | ⛔ hết chữ Anh ở chỗ user đọc; ⭐ **khớp quy ước** `HrProfileEditModal` (cùng trường `username`) |
| **ẢNH HƯỞNG** | ⚠️ **chỉ chuỗi hiển thị** · ⛔ không đổi dữ liệu · ⛔ không đổi khoá/cột |
| **TƯƠNG THÍCH** | ✅ ⛔ không thêm phụ thuộc |
| **TEST** | ✅ cổng `C12` **3/3** · hồi quy **865/864/0/1** |
| **STATUS** | ✅ `VERIFIED` |
---

## CHG-20261007-C24 — 4 tệp màn MÔ CÔI: thêm **ghi chú «⛔ chưa được dùng ở đâu»** (⛔ không xoá, ⛔ không nối menu)

| Trường | Nội dung |
|---|---|
| **Mã** | `CHG-20261007-C24` · **Ngày / Phiên** 2026-10-08 · `ERP-SESSION-03` · **Nhóm** `DOCUMENTATION` |
| **TRƯỚC** | 4 tệp màn **⛔ không có dấu hiệu gì** là **mô côi** ⇒ ⚠️ người sau (kể cả phiên 03) **tưởng là màn đang chạy** ⇒ tốn công **kiểm thử/DOM-verify** vô ích |
| **SAU** | mỗi tệp có **3 dòng ghi chú** ngay đầu: ① **đo được 0 tham chiếu** trong `app/**`+`lib/**` ② ⛔ đừng kiểm thử vô ích (kèm bài học `§C42`) ③ **cần quyết** qua `HANDOFF-C15` (nối lại · xoá · giữ) |
| **TỆP** | `app/screens/{TeamManagement,ProjectAggregateTabs,SiteCommandCreateModal,WarehouseCreateModal}.tsx` |
| ⚠️ **CHI TIẾT AN TOÀN** | 2 tệp có **`"use client";`** ⇒ ghi chú đặt **SAU** directive (⛔ trước sẽ **phá**); ✅ **kiểm lại: dòng gốc của mọi tệp còn nguyên** (⚠️ 1 lần chèn đầu đã xoá nhầm, đã khôi phục) |
| **ẢNH HƯỞNG** | ⚠️ **chỉ CHÚ THÍCH** — ⛔ không đổi hành vi · ⛔ không đổi giao diện · ⛔ không đổi dữ liệu |
| **TƯƠNG THÍCH** | ✅ ⛔ không thêm phụ thuộc · `tsc` **exit 0** |
| **TEST** | ✅ hồi quy **865/864/0/1** · cổng dự án **ĐẠT** (`d826dd0b33dbb3cd`) · build **0344** |
| **STATUS** | ✅ `VERIFIED` |
---

## CHG-20261007-C25 — Vá **MẤT DỮ LIỆU** modal «Sửa hồ sơ»: trường vắng trong DOM ⇒ **giữ giá trị hiện có**

| Trường | Nội dung |
|---|---|
| **Mã** | `CHG-20261007-C24` → ⭐ **`CHG-20261007-C24`** *(xem `CHANGE_LOG`)* · **Nhóm** `BUGFIX` · `HOTFIX` · **CRITICAL** |
| **Mô-đun** | `app/screens/HrProfileEditModal.tsx` |
| **TRƯỚC** | `position: String(fd.get("position") \|\| "")` (**×11 trường**) ⇒ ⚠️ ô của **tab không mở** ⛔ không có trong DOM ⇒ gửi **`""`** ⇒ backend ghi **NULL** ⇒ **XOÁ DỮ LIỆU** |
| **SAU** | `hrVal("position", String(hr.position ?? ""))` (**×11 trường**) ⇒ ⭐ **vắng trong DOM ⇒ GIỮ giá trị hiện có**; ⚠️ **có trong DOM mà xoá trắng ⇒ vẫn gửi rỗng** |
| **LÝ DO** | 🚨 user báo **mất «chức danh»** sau khi sửa CCCD; ⭐ **tái hiện được ở tầng API** (`position` ⇒ NULL) |
| **ẢNH HƯỞNG** | ⭐ **CHẶN MẤT DỮ LIỆU** trên **26** hồ sơ nhân sự; ⛔ không đổi giao diện |
| **TƯƠNG THÍCH** | ✅ ⛔ không thêm phụ thuộc · ⚠️ vẫn gửi **đủ 11 trường** như trước ⇒ ⛔ không phá backend |
| **TEST** | ✅ cổng `mt3-c13` **4/4** (có đối chứng âm) · `tsc` 0 · `eslint` 0 |
| **STATUS** | 🔧 `FIXED` → ⏳ `VERIFIED` sau build + kiểm UI |
---

## CHG-20261007-C26 — PHẦN 2 của `BUG-C12`: **`key={tab}`** ép React **mount lại** nhóm ô khi đổi tab (⛔ chặn hiển thị & lưu SAI giá trị)

| Trường | Nội dung |
|---|---|
| **Mã** | `CHG-20261007-C27` · **Ngày / Phiên** 2026-10-09 · `ERP-SESSION-03` · **Nhóm** `BUGFIX` · `HOTFIX` · **CRITICAL** |
| **Mô-đun** | `app/screens/HrProfileEditModal.tsx` |
| **TRƯỚC** | `<div className="form-grid">` (**cả 2 nhánh tab**, ⛔ không `key`) ⇒ React **tái dùng** `<input>` ⇒ tab «cá nhân» hiện **mã NV / họ tên / chức danh** của tab kia ⇒ ⚠️ **lưu là ghi SAI** |
| **SAU** | `<div className="form-grid" key={tab}>` (**cả 2 nhánh**) ⇒ **mount lại** khi đổi tab ⇒ `defaultValue` = **giá trị THẬT** |
| **LÝ DO** | ⭐ **đo được**: payload POST thật + ảnh chụp + đối chiếu CSDL (⭐ xem `BUG-20261007-C12` P2.2) |
| **ẢNH HƯỞNG** | ⭐ **chặn ghi giá trị SAI vào `hr_records`** (⭐ đã gây hỏng `cha.ht`: địa chỉ = họ tên, trình độ = chức danh); ⛔ **không đổi giao diện/bố cục** |
| **TƯƠNG THÍCH** | ✅ `key` là **chuẩn React**, ⛔ không thêm phụ thuộc, ⛔ không đổi API |
| **TEST** | ✅ cổng `mt3-c13` **5/5** (ca `C13-5` khoá `key={tab}` + đối chứng âm) · hồi quy **878/877/0** |
| **STATUS** | ✅ `VERIFIED` |
---

## CHG-20261007-C27 — `lib/workflow-helpers.ts`: người duyệt **theo PHÒNG BAN** nay được công nhận

| Trường | Nội dung |
|---|---|
| **Mã** | `CHG-20261007-C27` · **Ngày / Phiên** 2026-10-09 · `ERP-SESSION-03` · **Nhóm** `BUGFIX` · `RBAC` |
| **Mô-đun** | `lib/workflow-helpers.ts` → `workflowApproverCandidates` |
| **TRƯỚC** | `hasApprovePermission` chỉ xét **quyền CẤP NGƯỜI DÙNG** (`allModulePermissions` theo `userId`) + `admin` |
| **SAU** | xét **THÊM** quyền **CẤP PHÒNG BAN** (`departmentModulePermissions` theo `organizationUnitId` của user + `moduleKey` + `canApprove`, ⚠️ chỉ dòng `active`) — ⭐ **giữ nguyên** 2 nhánh cũ |
| **LÝ DO** | ⭐ **đo được**: module `approvals` có **35** người được cấp quyền duyệt **theo phòng ban** ⇒ ⚠️ bị đánh dấu «Chưa có quyền duyệt» **SAI** và **bị ẩn** khỏi bộ chọn người duyệt (`WorkflowModal` lọc theo cờ này) |
| **ẢNH HƯỞNG** | ⭐ `approvals` **26 → 61** người duyệt hợp lệ · `dept_legal_hr`/`dept_finance_payment_plan` **5 → 9** · ⛔ **không đổi giao diện** |
| **TƯƠNG THÍCH** | ✅ ⛔ không thêm phụ thuộc · ⚠️ chỉ **NỚI** điều kiện (⛔ không siết) ⇒ ⛔ không làm ẩn thêm ai |
| **TEST** | ✅ cổng MỚI `tests/mt3-c16-dept-permission-gates.test.mjs` **4/4** (⭐ có **đối chứng âm** + **chốt vùng phủ**) · `tsc` 0 · `eslint` 0 · hồi quy **919/918/0** |
| **STATUS** | ✅ `VERIFIED` |
---

## CHG-20261007-C28 — `app/screens/HrProfileEditModal.tsx`: ⛔ **GỠ KHỐI CHÚ THÍCH CŨ SAI** về quyền + ⭐ **KHOÁ hợp đồng quyền bằng cổng `mt3-c13`** (**7 ca**)

| Trường | Nội dung |
|---|---|
| **Mã** | `CHG-20261007-C28` · **Ngày / Phiên** 2026-10-09 · `ERP-SESSION-03` · **Nhóm** `DOCUMENTATION` · `RBAC` |
| **Mô-đun** | `app/screens/HrProfileEditModal.tsx` (⭐ **thuộc quyền phiên 03**) |
| **TRƯỚC** | Khối chú thích (dòng ~35–41) ghi: «**MỐC 101 — BUG-02 (S1): CHỈ ROLE `admin` mới gọi được `update_user`** … ✅ Sửa: khoá đúng theo hợp đồng backend = chỉ `role === "admin"`» |
| ⛔ **VÌ SAO NGUY HIỂM** | ⚠️ **trái với mã hiện tại**: `ActionRbacRegistry` cho `update_user` qua **`admin_tab_01` + `canEdit`** và `UserManagementUseCase:167` `requireAccountUpdateRight` (⭐ MỐC 103) ⇒ ⚠️ ai **làm theo chú thích cũ** sẽ **khoá CẢ mục TÀI KHOẢN** ⇒ ⭐ người có **Tab 01** ⛔ **mất quyền sửa hồ sơ** (⚠️ **đúng lớp `BUG-20261007-C13`**) |
| **SAU** | ✅ **gỡ khối chú thích cũ**, thay bằng ghi chú **nói rõ điều gì đã đổi + vì sao** (⚠️ kèm cảnh báo ⛔ đừng khoá lại), ⭐ giữ nguyên **HÀNH VI** (⛔ **0 thay đổi logic**) |
| **HỢP ĐỒNG ĐƯỢC KHOÁ (⭐ bằng MÁY — `tests/mt3-c13-hr-modal-no-wipe.test.mjs`, nay **7 ca**)** | `C13-6`: ``canEditAccount = true`` **PHẢI giữ** (⛔ không khoá mục tài khoản theo `role`) · `C13-7`: ô ``role`` **PHẢI** ``disabled={!isAdminRole}`` (chống leo thang — khớp `UserManagementUseCase:174-176`) ⭐ **có ĐỐI CHỨNG ÂM** (ô `role` mở khoá ⇒ bộ dò **PHẢI** bắt) |
| **KIỂM CHỨNG** | ✅ cổng `C13` **7/7** · meta-gate `C15` **4/4** · `tsc` **0** · `eslint` **0** · `gd-cycle` **exit 0** · migration **`0349`** · cổng dự án **ĐẠT** (vân tay **`022fecb6c0e82f81`**) · hồi quy **921 test · 920 pass · 0 fail · 1 skip** |
| **STATUS** | ✅ `VERIFIED` |
---

## CHG-20261007-C29 — `app/screens/HrScreen.tsx`: ⛔ **CHẶN GHI ĐÈ hồ sơ đang có** + ⭐ ngày qua `date()`

| Trường | Nội dung |
|---|---|
| **Mã** | `CHG-20261007-C29` · **Ngày / Phiên** 10/10/2026 · `ERP-SESSION-03` · **Nhóm** `BUGFIX` · `UI_UX` |
| **TRƯỚC** | ① dropdown «Nhân sự» đổ **TOÀN BỘ** `data.staffDirectory` ⇒ ⚠️ lưu được **ghi đè** hồ sơ đang có (backend `updateHrRecord(nvl(...))` ⇒ khoá vắng = NULL) · ② cột «Ngày sinh»/«Ngày vào» in **THÔ** ⇒ hiện **ISO** |
| **SAU** | ① ⭐ danh sách chọn = **`missingProfile`** (nhân sự **CHƯA** có hồ sơ) + ⭐ **chốt chặn thứ hai** `window.confirm` khi chọn trúng người đã có + nút Lưu **khoá** khi hết người + ghi chú trong modal · ② `date(r.birthDate)` / `date(r.joinedDate)` ⇒ **`dd/mm/yyyy`** |
| **LÝ DO** | ⭐ **`BUG-C15`** — ① **cùng lớp `BUG-C12` (CRITICAL mất dữ liệu)** ⚠️ khác đường vào · ② **lệch định dạng ngày** so với toàn app (`date()` **đã import mà chưa dùng**) |
| **ẢNH HƯỞNG** | ⭐ dropdown **~43 → 18** lựa chọn (⭐ **26 người có hồ sơ được bảo vệ**) · ⭐ ngày hiện **`dd/mm/yyyy`** · ⛔ **không đổi** luồng sửa hồ sơ (vẫn qua hồ sơ chi tiết) |
| **TƯƠNG THÍCH** | ✅ ⛔ không thêm phụ thuộc · ✅ chỉ **SIẾT** điều kiện ghi (⛔ không mở thêm đường ghi nào) |
| **TEST** | ✅ cổng MỚI `tests/mt3-c17-hr-screen-safety.test.mjs` **4/4** (⭐ có **đối chứng âm** + **chốt vùng phủ**) · ✅ **14/14 cổng** · `tsc` 0 · `eslint` 0 · hồi quy **925/924/0** |
| **STATUS** | ✅ `VERIFIED` |