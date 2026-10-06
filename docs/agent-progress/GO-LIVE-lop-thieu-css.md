# GO-LIVE — HỒ SƠ: LỚP DÙNG MÀ **KHÔNG CÓ CSS** (BUG-20261005-007)

> # ✅ ĐÃ KHÉP LẠI (TASK-172) — **TIÊU CHÍ ĐÚNG**
>
> Sau **4 vòng** (TASK-157 → 172) và **3 lần đính chính**, câu hỏi «lớp thiếu CSS có gây hại không» **nay có tiêu chí trả lời**:
>
> > **Một lớp thiếu rule CHỈ GÂY HẠI khi:**
> > **(A)** thẻ của nó có **kiểu mặc định trình duyệt «XÂM LẤN»** — `button` · `input` · `select` · `textarea` · `table` · `fieldset`
> > **HOẶC**
> > **(B)** phần tử **CẦN LAYOUT** — nhiều phần tử con phải xếp hàng (tiêu đề + nút đóng, một hàng nhiều nút…).
> >
> > **Ngược lại** — `<p>` · `<div>` · `<span>` · `<section>` · `<form>` đơn giản — kiểu mặc định **đã hiển thị chấp nhận được** ⇒ thiếu rule **thường ⛔ VÔ HẠI**.
>
> ⭐ **Tiêu chí này DỰ ĐOÁN ĐÚNG toàn bộ phát hiện** ⇒ đó là **bằng chứng nó đúng**, ⛔ không phải suy đoán:
>
> | Ca | Tiêu chí dự đoán | Thực tế |
> |---|---|---|
> | `modal-head` | **(B)** — `<div>` chứa tiêu đề + nút ✕ | 🐞 **LỖI THẬT → ĐÃ VÁ** (TASK-170) |
> | `receiving-kpi-button` | **(A)** — `<button>`, chrome + `inline-block` | 🐞 **LỖI THẬT → ĐÃ VÁ** (TASK-171) |
> | `kpi-label` · `kpi-value` · `admin-table` | — có **bộ chọn cha** | ✅ vô hại |
> | `vt-timeline-activity` | — có **lớp khác cùng phần tử** | ✅ vô hại |
> | `mobile-dash-icon` (+3) | — **khối bị ẩn** | ✅ vô hại |
> | `readonly-field` | `<span>` chữ chỉ đọc — ⛔ không cần layout | ✅ vô hại |
> | `aggregate-toggle-row` | `<p>` bọc nút **đã có `.primary`** | ✅ vô hại |
> | `stack-form` | ⚠️ `<form>` + `<select>` ⇒ (A) đúng một phần | ⚠️ **BORDERLINE — chưa vá** |
>
> ### KẾT QUẢ THỰC CỦA CẢ CHUỖI (cập nhật TASK-174)
> **13 ca xác minh tay** · **4 LỖI THẬT — CẢ BỐN ĐÃ VÁ** · **9 ca vô hại** (5 cơ chế) · **0 ca còn nghi**
>
> | # | Lớp đã vá | Tiêu chí | Nguồn số đo của bản vá (⛔ không phát minh) |
> |---|---|---|---|
> | 1 | `modal-head` | **(B)** cần layout (tiêu đề + nút ✕) | khuôn **`.card-head`** — `min-height:68px; padding:15px 18px` |
> | 2 | `receiving-kpi-button` | **(A)** `<button>` chrome | khuôn **reset nút nhà** `.card-head>button` |
> | 3 | `requests-shortage-card` | **(A)** — **ca y hệt #2** (bọc `<Kpi>`) | **đúng reset của #2** |
> | 4 | `page-collapse` | **(A)** — ⛔ không tổ tiên `.drawer` | **anh em cùng header `.page-back`** |
>
> ⛔ «130 lỗ hổng» **SAI** · ⛔ «0 lỗ hổng» **cũng SAI** · ⭐ cái đúng là **tiêu chí (A)/(B)**.
> **VIỆC CÒN LẠI DUY NHẤT**: **xác nhận 4 bản vá bằng MẮT** (⛔ tôi không nhìn được giao diện) + 1 ca borderline `stack-form`.
>
> **5 cơ chế** giải thích «thiếu CSS» mà ⛔ không phải lỗi: ① bộ chọn cha theo thẻ · ② lớp khác cùng phần tử · ③ khối bị ẩn · ④ thẻ không cần layout · ⑤ con đã có style riêng.
>
> **TRẠNG THÁI CUỐI: `REPORTED → ĐÍNH CHÍNH 1 → 2 → 3 → ✅ KHÉP (tiêu chí đúng · 2 lỗi thật đã vá · 1 ca borderline ghi nhận)`.**


> ## 🔴🔴 ĐÍNH CHÍNH LẦN 3 (TASK-171) — LỖI THỨ BA CỦA CÁCH KIỂM: **CHƯA TỪNG KIỂM «CÓ RENDER KHÔNG»**
>
> Kiểm tiếp 2 ca còn nghi thì phát hiện **một cơ chế thứ ba** mà phép kiểm của tôi **chưa bao giờ xét**:
>
> | Lớp | Kết quả kiểm chính xác | SỰ THẬT |
> |---|---|---|
> | `mobile-dash-icon` · `mobile-dash-kpi` · `mobile-dashboard-kpis` · `mobile-kpi-spark` | ⛔ **cả 4 đều KHÔNG có trong CSS** (chỉ `.mobile-dashboard-reference` có) | ⭐ **KHÔNG PHẢI LỖI** — `app/globals.css` có **`.mobile-dashboard-reference { display: none !important; }`** ⇒ **CẢ KHỐI BỊ ẨN, KHÔNG BAO GIỜ RENDER** ⇒ thiếu CSS là **vô nghĩa** |
> | `receiving-kpi-button` | ⛔ **KHÔNG có rule nào** · `.receiving-screen` **CÓ render** (có rule `gap:16px` + rule bảng) | 🐞 **LỖI THẬT** → **ĐÃ VÁ** (xem ③) |
>
> ⛔⛔ **CƠ CHẾ THỨ BA BỊ BỎ SÓT: KHỐI BỊ ẨN (`display:none`)** — phần tử trong đó ⛔ **không bao giờ hiển thị**, nên «thiếu CSS» ⛔ **không phải vấn đề**.
> ⭐ **Bài học: trước khi nói «phần tử thiếu style», phải hỏi «phần tử có được RENDER không?»**
>
> ### ✅ KẾT LUẬN CUỐI (sau **ba** lần đính chính) — 10 ca đã xác minh tay
> | Cơ chế giải thích | Số ca | Ca cụ thể |
> |---|---|---|
> | **① Bộ chọn CHA theo THẺ** | **3** | `kpi-label` (`.kpi>span`) · `kpi-value` (`.kpi strong`) · `admin-table` (`.table-wrap table`) |
> | **② Lớp KHÁC trên CÙNG phần tử** | **1** | `vt-timeline-activity` (được `.vt-timeline`) |
> | **③ KHỐI BỊ ẨN `display:none`** | **1** | `mobile-dash-icon` (+3 lớp cùng khối) |
> | **④ LỖI THẬT** | **2** | `modal-head` (**đã vá**, TASK-170) · `receiving-kpi-button` (**đã vá**, TASK-171) |
> | ⚠️ chưa kết luận | 3 | `readonly-field` · `aggregate-toggle-row` · `stack-form` |
>
> ⇒ ⭐ **2/10 ca đầu là LỖI THẬT và ĐÃ VÁ.** ⛔ Con số «130 lỗ hổng» là **sai**; ⛔ «0 lỗ hổng» cũng **sai**.
> **TRẠNG THÁI: `REPORTED → ĐÍNH CHÍNH 1 → 2 → 3 (10 ca xác minh tay: 2 lỗi thật ĐÃ VÁ · 5 cơ chế giải thích · 3 chưa kết luận)`.**


> ## ⛔⛔ ĐÍNH CHÍNH 05/10/2026 (**TASK-169** + **TASK-170**) — ĐỌC TRƯỚC KHI DÙNG HỒ SƠ NÀY
>
> ### 🔴 BẢN ĐÍNH CHÍNH THỨ HAI (TASK-170) — LÀM RÕ BẰNG **XÁC MINH TAY 10 CA ĐẦU**
> Bản đính chính đầu nói «**129/130 giải thích bởi bộ chọn cha**» — ⛔ **điều đó CŨNG CHƯA được chứng minh** (tôi mới xác minh tay **~2 ca**). Nay đã **xác minh tay 10 ca đầu** của nhóm «thẻ chỉ mang ĐÚNG lớp đó»:
>
> | Lớp | Thẻ | Lớp CHA có rule nhắm tới **thẻ** đó? | Kết luận |
> |---|---|---|---|
> | `kpi-label` | `<span>` | ✅ **CÓ** — `.kpi>span { width:42px; … }` | ✅ được style |
> | `kpi-value` | `<strong>` | ✅ **CÓ** — `.kpi strong { … }` | ✅ được style |
> | `admin-table` | `<table>` | ✅ **CÓ** — `.table-wrap table { … }` (`canonical.css:1037`) | ✅ được style |
> | **`modal-head`** | `<div>` | ⛔ **KHÔNG** — `.overlay` · `.modal` · `.card` đều ⛔ không có rule nào cho `div` | ⚠️ **NGHI LỖ HỔNG THẬT** |
> | **`mobile-dash-icon`** | `<span>` | ⛔ **KHÔNG** — `.mobile-dash-kpi` · `.tone-blue` · `.mobile-dashboard-kpis` đều không | ⚠️ **NGHI LỖ HỔNG THẬT** |
> | **`receiving-kpi-button`** | `<button>` | ⛔ **KHÔNG** — `.receiving-kpi-row` · `.kpi-grid` · `.stack` … đều không | ⚠️ **NGHI LỖ HỔNG THẬT** |
> | `readonly-field` · `aggregate-toggle-row` | `<span>` · `<p>` | ⚠️ chưa trích được lớp cha | ⚠️ chưa kết luận |
> | `stack-form` | `<form>` | ⚠️ selector nhóm mơ hồ (`.card-head p, .card > header p, …`) | ⚠️ chưa kết luận |
>
> #### ✅ KẾT LUẬN ĐÚNG (sau **hai** lần đính chính)
> ⛔ **KHÔNG phải «130 lỗ hổng»** (đã bác bỏ) · ⛔ **cũng KHÔNG phải «0 lỗ hổng»** (đã bác bỏ).
> ⭐ **Sự thật**: **MỘT PHẦN** được style qua bộ chọn cha (xác minh **3** ca) · **MỘT PHẦN ⛔ KHÔNG có rule nào** (xác minh **3** ca: `modal-head` · `mobile-dash-icon` · `receiving-kpi-button`) ⇒ **nhiều khả năng là lỗ hổng THẬT**.
> ⚠️ **Giới hạn**: chỉ **MẮT NGƯỜI** trên giao diện mới kết luận được — phân tích tĩnh ⛔ **không đủ** (đã thử viết công cụ, nó **tự thi trượt**).
> ⭐ **Đáng chú ý nhất**: `modal-head` xuất hiện ở **≥2 màn** (`ConstructionScreen` · `Inventory`) và là **ĐẦU MODAL** ⇒ nếu thật sự không được style thì ảnh hưởng **mọi modal** — liên quan trực tiếp **§11**.
>
> **TRẠNG THÁI BUG-20261005-007: `REPORTED → ĐÍNH CHÍNH 1 (phép đo sai) → ĐÍNH CHÍNH 2 (thu hẹp còn ≥3 ca nghi thật, cần rà mắt)`**.
>
> ---
>
> ### BẢN ĐÍNH CHÍNH THỨ NHẤT (TASK-169)
> **Con số «130 lớp thiếu CSS» ⛔ KHÔNG phải là 130 lỗ hổng giao diện.** Phép đo sinh ra nó **quá thô** và ⛔ **bỏ sót ít nhất hai cơ chế style hợp lệ**:
>
> | Cơ chế style bị phép đo CŨ bỏ sót | Ví dụ đã **xác minh bằng tay** |
> |---|---|
> | **① Bộ chọn CHA theo THẺ** — phần tử được style vì nó là `<span>`/`<strong>` con của một lớp có rule | `.kpi > span { width:42px; … }` style `.kpi-label` **dù `.kpi-label` ⛔ không có rule riêng** |
> | **② Lớp KHÁC trên CÙNG phần tử** | `<ol className="vt-timeline vt-timeline-activity">` được `.vt-timeline { list-style:none; display:flex; … }` style |
>
> ⇒ ⛔ **«130 lỗ hổng giao diện» là SAI** — nhưng ⛔ **không** có nghĩa «0 lỗ hổng» (xem bản đính chính thứ hai ở trên).
>
> ### ⛔ ĐÃ THỬ VIẾT CÔNG CỤ ĐO LẠI — VÀ **NÓ TỰ THI TRƯỢT**
> Tôi viết `tools/kiem-lop-thieu-css.mjs` (kiểm thêm bộ chọn cha + lớp cùng thẻ) rồi **thử đối chiếu ca ĐÚNG đã biết**:
> tạm bỏ `project-scope-tabs` khỏi `admin-subtabs` (ca **đã xác minh là lỗi THẬT** ở TASK-156) ⇒ công cụ vẫn báo
> «**0 nghi thiếu style**» ⛔ **KHÔNG bắt được ca đúng**.
> **Nguyên nhân**: phép kiểm «rule cha theo thẻ» **quá lỏng với thẻ phổ biến** (`div`/`span`) — trong ~365 KB CSS
> thể nào cũng có rule kiểu `.abc div { … }` khớp mẫu nhưng ⛔ **không áp dụng** cho phần tử đang xét.
> ⇒ ⛔ **Công cụ cho CẢM GIÁC AN TOÀN GIẢ** ⇒ **đã GỠ BỎ**.
>
> ### ✅ KẾT LUẬN ĐÚNG
> ⛔ **KHÔNG kết luận được bằng phân tích tĩnh**: ⛔ không phải «0 lỗ hổng», ⛔ cũng không phải «130 lỗ hổng».
> ⇒ Phải **rà bằng MẮT theo từng màn** (mở màn → đối chiếu phần tử → quyết định gán khuôn nhà hay thêm rule).
> ⭐ **Ca DUY NHẤT đã xác minh là lỗi THẬT**: `admin-subtabs` (TASK-156) — nó là lớp **DUY NHẤT** trên một `<div>`
> con của `.stack`, mà `.stack` chỉ có rule cho `> section` / `> .card` ⇒ **thật sự không được style** ⇒ **đã vá ĐÚNG**.
>
> **TRẠNG THÁI MỚI CỦA BUG-20261005-007: `REPORTED → ĐÍNH CHÍNH: PHÉP ĐO SAI`** (⛔ không phải MEDIUM với 130 ca).


| | |
|---|---|
| **Ngày đo** | 05/10/2026 |
| **Cách đo** | quét `className="…"` **CHUỖI TĨNH** trong `app/**/*.tsx`, đối chiếu **cả 4** stylesheet |
| **Stylesheet đã đối chiếu** | `app/globals.css` · `app/styles/canonical.css` · `app/styles/font-floor.css` · `app/styles/tokens.css` |
| **Tổng lớp từ chuỗi tĩnh** | **696** |
| **Lớp KHÔNG có CSS** | **130** |
| **… trong đó có thẻ chỉ mang ĐÚNG lớp đó** | **53** ← tín hiệu cao nhất |

## ⛔ VÌ SAO ĐÂY LÀ LỖI THẬT (không phải báo động giả)

1. Đã kiểm **14/14** lớp mẫu ⇒ **không** lớp nào có CSS ở **bất kỳ** tệp nào trong 4 tệp.
2. **Không có** bộ chọn thuộc tính kiểu `[class*=…]` nào trong toàn bộ CSS ⇒ không thể style gián tiếp.
3. **1813 / 2197** thẻ dùng `className` chuỗi tĩnh chỉ mang **ĐÚNG 1 lớp** ⇒ nếu lớp đó không có CSS thì thẻ **không được style gì cả**.
4. ⇒ Đây đúng **chiều ngược** của cổng `scripts/css-baseline-audit.mjs`: cổng bắt *CSS chết* (định nghĩa mà không dùng), ⛔ **không** bắt *lớp dùng mà không định nghĩa* ⇒ cổng báo `ĐẠT · dead classes=0` mà giao diện vẫn thiếu style.

## ⛔ VÌ SAO **CHƯA SỬA Ồ ẠT**

- **§12**: giữa GO-LIVE ⛔ không refactor lớn. Thêm CSS cho 130 lớp là thay đổi **lớn**, không kiểm chứng bằng mắt được ở đây.
- **§4**: mức **MEDIUM** ⇒ đưa vào **HOTFIX QUEUE**, xử lý theo thứ tự phù hợp — ⛔ không chen ngang việc ưu tiên cao hơn.
- Nhiều lớp có thể là **móc dữ liệu/kiểm thử** cố ý để trống ⇒ phải **phân loại theo từng màn** trước khi sửa.

## A · Lớp có thẻ CHỈ MANG ĐÚNG LỚP ĐÓ (ưu tiên rà trước)

| Lớp | Số thẻ chỉ có lớp này | Tổng số lần dùng | Tệp |
|---|---|---|---|
| `aggregate-toggle-row` | 4 | 4 | ProjectAggregateTabs.tsx |
| `mobile-dash-icon` | 4 | 4 | page.tsx |
| `receiving-kpi-button` | 4 | 4 | Receiving.tsx |
| `kpi-label` | 3 | 3 | ContractReviewScreen.tsx |
| `kpi-value` | 3 | 3 | ContractReviewScreen.tsx |
| `modal-head` | 2 | 2 | ConstructionScreen.tsx, Inventory.tsx |
| `on` | 2 | 2 | page.tsx |
| `readonly-field` | 2 | 2 | page.tsx |
| `slow10` | 2 | 2 | page.tsx |
| `slow20` | 2 | 2 | page.tsx |
| `slowMore` | 2 | 2 | page.tsx |
| `stack-form` | 2 | 2 | ProjectTeams.tsx |
| `account-row` | 1 | 1 | page.tsx |
| `account-self-edit-fields` | 1 | 1 | page.tsx |
| `admin-empty` | 1 | 1 | ErrorReportAdminPanel.tsx |
| `admin-mini-row` | 1 | 1 | page.tsx |
| `admin-table` | 1 | 1 | ErrorReportAdminPanel.tsx |
| `amber-dot` | 1 | 1 | Payments.tsx |
| `approval-overdue-hint` | 1 | 1 | page.tsx |
| `auth-footer-desktop` | 1 | 1 | page.tsx |
| `blue-dot` | 1 | 1 | Payments.tsx |
| `chip` | 1 | 1 | Purchasing.tsx |
| `construction-entry-form` | 1 | 1 | ConstructionScreen.tsx |
| `dept-perm-bulkbar` | 1 | 1 | page.tsx |
| `dept-perm-empty` | 1 | 1 | page.tsx |
| `dept-perm-filter` | 1 | 1 | page.tsx |
| `exception-pane-head` | 1 | 1 | page.tsx |
| `inline-field` | 1 | 1 | ReportView.tsx |
| `kanban-board` | 1 | 1 | WorkKanban.tsx |
| `kanban-card` | 1 | 1 | WorkKanban.tsx |
| `locked-project-value` | 1 | 1 | page.tsx |
| `match-missing` | 1 | 1 | page.tsx |
| `match-ok` | 1 | 1 | page.tsx |
| `match-review` | 1 | 1 | page.tsx |
| `metric-grid` | 1 | 1 | page.tsx |
| `mobile-dashboard-kpis` | 1 | 1 | page.tsx |
| `mobile-dashboard-update` | 1 | 1 | page.tsx |
| `mobile-progress-bar` | 1 | 1 | page.tsx |
| `mobile-progress-card` | 1 | 1 | page.tsx |
| `mobile-progress-legend` | 1 | 1 | page.tsx |
| `mobile-recent-card` | 1 | 1 | page.tsx |
| `mobile-recent-empty` | 1 | 1 | page.tsx |
| `notice` | 1 | 1 | ContractReviewScreen.tsx |
| `notify-item-main` | 1 | 1 | page.tsx |
| `notify-mark-read` | 1 | 1 | page.tsx |
| `page-collapse` | 1 | 1 | RequestDrawer.tsx |
| `request-match-col` | 1 | 1 | page.tsx |
| `request-preview-summary` | 1 | 1 | page.tsx |
| `requests-shortage-card` | 1 | 1 | Requests.tsx |
| `section-subhead` | 1 | 1 | Inventory.tsx |
| `supplier-detail-tab` | 1 | 1 | SupplierDetailModal.tsx |
| `supplier-info-row` | 1 | 1 | SupplierDetailModal.tsx |
| `warehouse-card-row` | 1 | 1 | Inventory.tsx |

## B · Các lớp còn lại (dùng chung với lớp khác — có thể đã được style một phần)

| Lớp | Tổng số lần dùng | Tệp |
|---|---|---|
| `account-sort-note` | 1 | page.tsx |
| `admin-subtabs` | 2 | page.tsx |
| `admin-system-config` | 1 | page.tsx |
| `advance-entry-form` | 1 | page.tsx |
| `approved-inventory-screen` | 2 | Inventory.tsx |
| `approved-module-screen` | 1 | Requests.tsx |
| `archive-project` | 1 | page.tsx |
| `bank-account-form` | 1 | CashbankScreen.tsx |
| `capital-recovery-screen` | 1 | page.tsx |
| `cashbook-entry-form` | 1 | CashbankScreen.tsx |
| `dashboard-approved` | 1 | page.tsx |
| `dashboard-final-locked` | 1 | page.tsx |
| `dashboard-lowstock-card` | 1 | page.tsx |
| `dashboard-personal-summary` | 1 | page.tsx |
| `delivered-table-card` | 1 | Delivered.tsx |
| `dept-perm-card` | 1 | page.tsx |
| `error-report-admin` | 1 | ErrorReportAdminPanel.tsx |
| `error-report-modal` | 1 | ErrorReportModal.tsx |
| `forced-password-modal` | 1 | page.tsx |
| `forced-password-overlay` | 1 | page.tsx |
| `gauge-progress` | 1 | page.tsx |
| `grn-source-po` | 1 | ReceiptDrawer.tsx |
| `groups` | 1 | page.tsx |
| `hierarchy-node` | 1 | WorkHierarchy.tsx |
| `independent-form-configs` | 1 | page.tsx |
| `inventory-approved-main` | 1 | Inventory.tsx |
| `inventory-warehouse-cards-card` | 1 | Inventory.tsx |
| `kanban-column` | 1 | WorkKanban.tsx |
| `legal-doc-form` | 1 | LegalDocsScreen.tsx |
| `list-toolbar-sort` | 1 | ListToolbar.tsx |
| `material-list-card` | 1 | MaterialListTable.tsx |
| `material-subgroup-table` | 1 | page.tsx |
| `mobile-dash-kpi` | 4 | page.tsx |
| `mobile-kpi-spark` | 4 | page.tsx |
| `mobile-nav-expand-only` | 1 | page.tsx |
| `norms-entry-form` | 1 | page.tsx |
| `norms-estimate-form` | 1 | page.tsx |
| `notification-config-admin` | 1 | page.tsx |
| `page-mode` | 1 | PurchaseOrderDrawer.tsx |
| `payment-plan-form` | 1 | page.tsx |
| `payments-screen` | 1 | Payments.tsx |
| `po-grn-list` | 1 | PurchaseOrderDrawer.tsx |
| `po-nav-trace` | 1 | P08PoNavigation.tsx |
| `po-source-pr` | 1 | PurchaseOrderDrawer.tsx |
| `po-summary-table` | 1 | PurchaseOrderDrawer.tsx |
| `po-timeline` | 1 | PurchaseOrderDrawer.tsx |
| `production-entry-form` | 1 | page.tsx |
| `production-screen` | 1 | page.tsx |
| `project-detail-progress` | 1 | ProjectDetailTabs.tsx |
| `project-detail-tabs` | 1 | ProjectDetailTabs.tsx |
| `project-detail-workitems` | 1 | ProjectDetailTabs.tsx |
| `receipt-modal` | 1 | ReceiptDrawer.tsx |
| `receiving-card-detail` | 1 | Receiving.tsx |
| `receiving-kpi-row` | 1 | Receiving.tsx |
| `recovery-entry-form` | 1 | page.tsx |
| `request-child-pos` | 1 | RequestDrawer.tsx |
| `request-context-grid` | 1 | page.tsx |
| `request-smart-import` | 1 | page.tsx |
| `requests-shortage-modal` | 1 | Requests.tsx |
| `returned-request-editor` | 1 | RequestDrawer.tsx |
| `s1` | 1 | page.tsx |
| `s2` | 1 | page.tsx |
| `s3` | 1 | page.tsx |
| `s4` | 1 | page.tsx |
| `seal-form` | 1 | SealScreen.tsx |
| `site-cost-form` | 1 | SiteCostScreen.tsx |
| `supplier-create-modal` | 1 | SupplierManager.tsx |
| `supplier-detail-modal` | 1 | SupplierDetailModal.tsx |
| `supplier-material-gap` | 1 | SupplierDetailModal.tsx |
| `tone-orange` | 1 | page.tsx |
| `tone-red` | 1 | page.tsx |
| `trust-lock-admin` | 1 | page.tsx |
| `voucher-form` | 1 | DocumentsScreen.tsx |
| `vt-timeline-activity` | 1 | Timeline.tsx |
| `warehouse-receipt-screen` | 1 | page.tsx |
| `work-dashboard` | 1 | WorkDashboard.tsx |
| `work-hierarchy` | 1 | WorkHierarchy.tsx |

## C · Cách kiểm lại bất cứ lúc nào

```text
node tools/probe-lop-thieu-css.mjs      # (nếu tạo công cụ thường trực từ phép đo này)
```

⛔ Đây là **hồ sơ đo**, KHÔNG phải danh sách việc đã xong. Chưa lớp nào (trừ `admin-subtabs` ở TASK-156) được sửa.
