# MT3 — BIÊN BẢN QUYẾT ĐỊNH CỦA USER (chốt 26/09/2026)

> Nguồn: trả lời trực tiếp của user cho 4 câu hỏi dồn lại từ P3-UI-10b (Kho) và P3-UI-12b (Mua hàng).
> ⛔ Đây là **quyết định nghiệp vụ của user** — ghi NGUYÊN VĂN để các task sau không suy diễn lại.

## 1. Màn Kho (MT3 §F) — 2 mục thừa
**User trả lời:**
> «Tồn vật lý kho tổng chính là dashboard rồi, luân chuyển vật tư là 1 phần của cấp phát & hoàn trả - Xuất&nhập kho»

**Diễn giải + việc phải làm:**
| Mục | Quyết định | Hành động |
|---|---|---|
| «Tồn vật lý Kho Tổng» | **CHÍNH LÀ dashboard** ⇒ giữ, không coi là mục thừa | ⛔ **KHÔNG xoá**; giữ làm nội dung dashboard |
| «Luân chuyển vật tư dư dự án → Kho Tổng» | Là **một phần của «Cấp phát & hoàn trả»** (và «Nhập kho & Xuất kho») | **CHUYỂN** danh sách này vào tab «Cấp phát & hoàn trả» của màn Kho · ⛔ **không xoá nghiệp vụ** |

## 2. Menu «Nhà cung cấp» trùng 2 mục (MT3 §E)
**User trả lời:**
> «Gộp thành 1 "Nhà cung cấp"»

**Hành động:** gộp `dept_plan_suppliers` («Nhà cung cấp») và `supplier_catalog` («Danh mục Nhà cung cấp») thành **MỘT tab «Nhà cung cấp»** trong 10 tab Mua hàng.
⚠️ **Còn phải xác minh trước khi xoá mục menu:** hai mục này có trỏ **cùng một màn** không (nếu khác màn thì phải hợp nhất màn trước, ⛔ không xoá mù).

## 3. «Xin giá vật tư» (MT3 §E)
**User trả lời:**
> «Tạm thời để ra 1 tab (chưa chốt logic và nghiệp vụ nên để phát triển trong tương tai)»

**Hành động:** giữ `dept_plan_rfq` thành **MỘT TAB RIÊNG «Xin giá vật tư»** (⛔ không gộp vào tab khác) · ⛔ **không xây nghiệp vụ mới** (đúng GOAL §19) — chỉ giữ chỗ để phát triển sau.

## 4. «Giao nhận công trường» vs «Kế hoạch giao hàng» (MT3 §E)
**User trả lời:**
> «2 mục này thực chất chỉ để thông báo đến ban chỉ huy dự án để họ sắp xếp thời gian nhận hàng nên gộp hay tách đều được (cứ làm theo đề xuất)»

**Hành động (theo đề xuất đã nêu):** **ĐỔI TÊN** mục/màn hiện có `receiving` («Kế hoạch giao hàng») thành tab **«Giao nhận công trường»** — ⛔ **không tách** thành 2 tab (vì bản chất là cùng một việc thông báo cho BCH dự án).

---

## Tổng hợp 10 tab Mua hàng & Cung ứng (sau khi áp 4 quyết định)
| # | Tab | Nguồn / khoá |
|---|---|---|
| 1 | PR & PO (Mua hàng & PO) | `purchasing` |
| 2 | Phiếu đề nghị mua hàng | `requests` |
| 3 | Giao nhận công trường | `receiving` (đổi tên) |
| 4 | Đơn hàng đã giao | `delivered` |
| 5 | Kế hoạch mua hàng & cung ứng | `dept_plan_supply_plan` |
| 6 | Đấu thầu | `dept_plan_tender` |
| 7 | Hợp đồng | `dept_plan_contracts` |
| 8 | Nhà cung cấp | **gộp** `dept_plan_suppliers` + `supplier_catalog` |
| 9 | Giá & dữ liệu thương mại | `dept_plan_price_data` |
| 10 | Xin giá vật tư | `dept_plan_rfq` — **tab riêng theo quyết định user** |

⚠️ Ghi chú: MT3 §E liệt kê tab «Báo cáo» nhưng **quyết định user không nhắc tới**; hiện chưa xác định màn báo cáo nào của nhóm Mua hàng ⇒ ⛔ **chưa tự chọn**, sẽ hỏi khi tới bước dựng tab.

---

# 🔓 ĐỢT CHỐT THỨ 2 — **27/09/2026** (user trả lời 8 câu hỏi dồn, GỠ TOÀN BỘ ĐIỂM CHẶN)

> ⛔ Ghi **nguyên văn lời user** để các task sau **không suy diễn lại**. Mọi mục dưới đây là **luật đã chốt**, ⛔ không được đổi.

## A1 · Luật **SLA 72 giờ** cho danh sách chờ duyệt
**User trả lời nguyên văn:**
> «ưu tiên hiển thị các đơn mới nhất, nếu có đơn sắp đạt SLA 72 thì ưu tiên hiển thị trước. Giữ quá SLA là giữ lại luật SLA. Nếu như quá SLA mà không có ai duyệt mặc định bị hệ thống từ chối. Từ chối khi quá SLA.»

**Diễn giải + việc phải làm (đã chốt):**
| Ý | Luật |
|---|---|
| Thứ tự hiển thị | **Đơn SẮP ĐẠT SLA 72h lên TRƯỚC**; còn lại **đơn MỚI NHẤT trước** |
| «Giữ quá SLA» | **Là GIỮ LẠI LUẬT SLA** — ⛔ **KHÔNG** phải giữ phiếu vô thời hạn |
| Quá SLA không ai duyệt | **HỆ THỐNG TỰ ĐỘNG TỪ CHỐI** |
| Thời điểm | **Từ chối KHI quá SLA** |
⚠️ **Còn 1 tiểu tiết cần chốt khi làm**: từ chối được kích hoạt **khi đọc danh sách** *(không cần scheduler)* hay bằng **job nền**? ⇒ ⛔ không tự chọn; ưu tiên **cách không cần hạ tầng mới** *(quét khi đọc danh sách / khi có thao tác duyệt)* và **phải idempotent**.

## A2 · **Tìm vật tư theo TÊN PHỤ (alias)** trong modal tạo MR/PR/PO
**User trả lời nguyên văn:**
> «Trong phần modal tạo MR, PR, PO phải có giao diện tìm kiếm vật tư chứ. Tôi muốn thanh search có thể tìm kiếm được bằng alias nữa vì 1 số nhân sự không nắm rõ tên chính xác của vật tư họ thường tìm theo tên mà họ nhớ.»

**Chốt:** ✅ **phương án (A)** — sửa **thanh tìm kiếm ở GIAO DIỆN** của modal tạo **MR/PR/PO** để khớp **cả tên chính LẪN alias**. ⛔ **KHÔNG cần thêm API máy chủ**. Lý do nghiệp vụ: *nhân sự tìm theo tên họ nhớ*.

## A3 · «audit & idempotency» cho xuất dữ liệu
**User trả lời nguyên văn:** > «Yêu cầu chung»

**Chốt:** ⛔ **KHÔNG phải luật nghiệp vụ mới** ⇒ **không chế luật**. Phần **UTF-8/headers đã ĐẠT SẴN** *(RFC 5987 cho tệp tiếng Việt tại `FileController:182`; `produces = JSON_UTF8`)*. ⇒ **BE-07 kết thúc**: ⛔ không làm thêm gì.

## A4 · Thông báo tới **PHÒNG BAN**
**User trả lời nguyên văn:**
> «Khi chọn gửi thông báo tới 1 phòng ban hoặc nhiều phòng ban thì tất cả user thuộc phòng ban được chọn sẽ nhận được thông báo.»

**Chốt:** `recipientMode = "department"` (1 hoặc **nhiều** phòng ban) ⇒ **TẤT CẢ user thuộc (các) phòng ban được chọn ĐỀU NHẬN được thông báo**. ⇒ Đây là **luật PHÂN PHỐI/ĐỐI TƯỢNG NHẬN**, ⛔ không phải luật cấp quyền người gửi.
⚠️ Còn lại *(chưa được trả lời)*: **`recipientMode = "all"` (TOÀN CÔNG TY)** — ai được gửi? ⇒ ⛔ **không tự chọn**; ghi tồn đọng.

## A5 · Kho — **⛔ KHÔNG được XOÁ**, chỉ có nút **NGỪNG**
**User trả lời nguyên văn:**
> «Kho không được xóa, chỉ có nút ngừng. Nghiệp vụ sẽ là khi dự án đã hoàn thành thì kho sẽ được xuất vật tư về kho tổng sau đó đóng kho và dự án đó vĩnh viễn. Nhưng vẫn cần lưu dữ liệu về dự án đó nên vẫn cần kho trong database nếu xóa đi thì sẽ hỏng dữ liệu.»

**Chốt:**
| Việc | Quyết định |
|---|---|
| Thêm `delete_warehouse` | ⛔ **KHÔNG** — *(đã xác minh: lệnh này **không tồn tại**, và **phải tiếp tục không tồn tại**)* |
| Thay thế | ✅ **Nút «NGỪNG»** *(ngừng hoạt động, ⛔ không xoá bản ghi)* |
| Vì sao | Xoá kho sẽ **HỎNG DỮ LIỆU** — vẫn phải lưu vết dự án/kho đã đóng |
| Nghiệp vụ kho dự án hoàn thành | Xuất vật tư về **kho tổng** → **đóng kho** → **dự án đóng vĩnh viễn** *(kho vẫn ở lại trong CSDL)* |

## A6 · Màn «Báo cáo» của Mua hàng
**User trả lời nguyên văn:** > «Màn báo cáo của mua hàng đang phát triển chưa chốt nghiệp vụ.»

**Chốt:** ⛔ **KHÔNG xây** *(đúng GOAL §19 «không tự phát minh nghiệp vụ»)*. Giữ chỗ; làm khi user chốt.

## A7 · Probe cũ `tests/p07-supplier-partner-split-probe.mjs`
**User trả lời nguyên văn:** > «Có thể xóa nếu nó không cần thiết nữa.»

**Chốt:** ✅ **ĐƯỢC PHÉP XOÁ** *(đã xác minh: tệp hỏng sẵn 2 phép kiểm vì đòi `SupplierManager view="partner"` — mà chính quyết định #2 đã gộp NCC nên nhánh đó ⛔ không còn)*.

## B1 · Cổng `gd-cycle` bị chặn bởi `.local-data` *(PID 18808)*
**User trả lời nguyên văn:** > «Cho phép»

**Chốt:** ✅ **ĐƯỢC PHÉP dừng đúng PID 18808** *(node `scripts/local-server.mjs`)* → chạy `node tools/gd-cycle.mjs "<nhãn>"` → **KHỞI ĐỘNG LẠI** server để trả môi trường nguyên trạng.

## B2 · Xác minh bằng mắt 68 ảnh
**User trả lời nguyên văn:** > «Để tôi tự check.»

**Chốt:** ✅ **user TỰ xác minh ảnh** ⇒ ⛔ **không thuộc phần agent làm**. Ghi nhận để ⛔ không coi là điểm chặn nữa.

## C1 · Ma trận #4 — `Inventory.tsx:220` `<aside>` → **modal**
**User trả lời nguyên văn:** > «Cho phép»

**Chốt:** ✅ **ĐƯỢC PHÉP** chuyển bảng trượt bên thành **modal** *(kèm **chụp lại 68 ảnh chuẩn**)*. ✅ **Giữ nguyên** `In tem mã` + 3 nút Chuyển/Nhập/Xuất.

## C2 · Ma trận #8 — nút thu gọn menu «tự ẩn khi đủ chỗ»
**User trả lời nguyên văn:** > «Cho phép»

**Chốt:** ✅ **ĐƯỢC PHÉP** dùng ngưỡng **1024px** *(mốc mà chính dự án đã dùng)*.
