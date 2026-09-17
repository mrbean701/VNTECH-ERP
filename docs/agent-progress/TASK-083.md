# TASK-083 — `U-15` ĐỢT 2: CHUYỂN BẢNG PHẲNG SANG `DataTable` (đợt 1/… — 1 bảng xong)

- **Mã:** TASK-083 · **Ngày:** 18/09/2026 · **Commit:** `#151` (bảng 1) + `#153` (bảng 2–4)
- **Định danh nguồn:** head `drizzle/0117_phase1_ui_datatable3_identity.sql` ⇒ **`VNTECH-FP-624193C1D2EB2FE6`**
- **Trạng thái:** đang làm — **4 bảng phẳng đã chuyển** (`DataTable` **13 → 17** · bảng tự viết **87 → 83**);
  **9 bảng "cần cân nhắc"** còn lại + **~76 bảng KHÔNG chuyển được** (xem mục 3)

## 1. Vì sao có task này

`U-15` (roadmap) yêu cầu thay các bảng tự viết bằng component dùng chung `DataTable` để mọi danh sách có
cùng khuôn: tiêu đề cột · sắp xếp · trạng thái RỖNG/ĐANG TẢI/LỖI · bấm dòng để mở chi tiết.
Số đo bằng `tools/probe-ui-adoption.mjs`: **bảng tự viết 87 chỗ** · `DataTable` dùng thật **13 lần**.

## 2. Đã chuyển (đợt này)

| # | Màn / hàm | Bảng | Ghi chú |
|---|---|---|---|
| 1 | `TeamManagement` | "thành viên đã RỜI tổ đội" (`past`) | 6 cột, có phép tính `days` trong `render` (giữ nguyên công thức) |
| 2 | `ProjectManagement` | "Tổ đội của dự án" (`teams`) | 6 cột; `emptyText` **nguyên văn** từ khối `<Empty>` cũ: *"Dự án chưa có tổ đội."* |
| 3 | `TeamManagement` | "thành viên đang hoạt động" (`activeMembers`) | 8 cột, có nút `Hồ sơ ›`; `emptyText` **nguyên văn** từ `<Empty>` cũ |
| 4 | `TeamManagement` | "tồn kho theo vật tư" (`bal`) | 4 cột; `rowKey` dùng `materialId \|\| index` như khoá cũ |
| 5 | `DepartmentPermissionManager` | **ma trận quyền phòng ban** | 1 cột "Chức năng" + **7 cột ĐỘNG** từ `PERM_CAPS.map` + 1 cột trạng thái; dòng "chưa lưu" **giữ nguyên nền vàng** qua thuộc tính mới **`rowStyle`** |
| 6 | `TeamManagement` | **danh sách tổ đội** (`filtered`) | 9 cột (mã · tên · hạng mục · dự án · kho · thành viên · quyết toán · trạng thái · nút `Chi tiết ›`); giữ nguyên công thức `projOf`/`whOf`/`membersOf`/`settled` |
| 7 | `MaterialCatalogPage` | báo cáo **alias trùng** | 3 cột, khoá theo chỉ số như cũ; `emptyText` nguyên văn *"Không có alias trùng."* |
| 8 | `MaterialCatalogPage` | báo cáo **xung đột alias** | 4 cột; `emptyText` nguyên văn *"Không có xung đột alias với tên chuẩn."* |
| 9 | `MaterialCatalogPage` | **danh mục vật tư (chế độ CHỈ XEM)** | 7 cột; `emptyText` nguyên văn *"Danh mục vật tư chưa có dữ liệu."* |
| 10 | `ProjectManagement` | **danh sách KHO của dự án** | 9 cột (mã · tên · loại · thủ kho · tồn kho · chờ nhập/xuất/duyệt · nút `Xem kho ›`); `emptyText` nguyên văn *"Dự án chưa có kho."* |
| 11 | `BoqControl` | **chi tiết lũy kế theo vật tư** | 10 cột; ⚠️ **GIỮ lớp `resizable-data-table`** qua tham số mới **`tableClassName`** (xem mục 3b) |

**Đo lại sau khi chuyển:** `DataTable` **13 → 24 lần** · bảng tự viết **87 → 76 chỗ** · trạng thái rỗng tự viết **88 → 79 chỗ**.

## 3b. ⚠️ LỚP CSS RIÊNG TRÊN `<table>` — BÀI HỌC ĐÃ TRẢ GIÁ (TASK-083)

Một số bảng cũ mang **lớp định dạng riêng** trên chính thẻ `<table>`; `DataTable` luôn render
`className="baseline-table"` nên **chuyển thẳng là MẤT định dạng**:

| Lớp | CSS thật | Hệ quả nếu bỏ |
|---|---|---|
| `resizable-data-table` | `globals.css:1261-1263` — `table-layout:fixed; width:max-content; min-width:100%` + quy tắc ngắt dòng ô | bảng lũy kế vật tư **mất khuôn cột/ngắt dòng** |
| `data-table` | `globals.css:124` — `tbody tr { cursor:pointer }` | mất con trỏ dòng (bảng Phiếu đề nghị) |
| `material-list-table` | `canonical.css:732` — `td, th { white-space: nowrap }` | ô bị ngắt dòng |

⇒ **Đã mở rộng `DataTable` thêm `tableClassName`** và dùng ngay cho bảng lũy kế.
**Quy trình bắt buộc từ nay:** trước khi chuyển một bảng, phải **grep CSS theo lớp riêng của bảng đó**;
lớp nào có luật thì **truyền vào `tableClassName`**, không được bỏ.

### Mở rộng `DataTable` (điều kiện tiên quyết — đã làm)
Thêm **`rowStyle?: (row, index) => CSSProperties`** vào **props** của component (⚠️ KHÔNG phải vào kiểu `Column` —
lượt đầu em đặt nhầm chỗ và `tsc` báo đúng 2 lỗi, đã sửa). Cần thiết để giữ **tô nền theo trạng thái của cả DÒNG**:
bảng ma trận quyền tô `background:#fff8e6` cho dòng *chưa lưu*.

### Đối chiếu CSS cho bảng `<table>` trần (đã CHỨNG MINH, không suy đoán)
`app/styles/canonical.css` dòng **103–113** style **cùng một danh sách selector** cho
`.table-wrap table th/td` **và** `.baseline-table th/td` ⇒ bảng `<table>` trần nằm trong `.table-wrap` có CSS
**tương đương** `.baseline-table` mà `DataTable` render ⇒ **chuyển được** (trước đây em xếp nhóm này vào
"phải chứng minh CSS" — nay đã chứng minh xong).

**Kiểm chứng:** `tsc --noEmit` **EXIT 0** · eslint **0 error** (73 warning, đều có trước) ·
`master-baseline-gate` **ĐẠT** (`!important=4950` · `css=400643B`) · `npm run build` **EXIT 0**.

**Hai quyết định CÓ CHỦ Ý (ghi để người sau không sửa nhầm):**
1. **KHÔNG truyền `emptyText`** cho bảng này: markup cũ **không có** trạng thái rỗng, nên em dùng **nguyên văn
   mặc định của component dùng chung** (`"Chưa có dữ liệu."`) thay vì **tự đặt chữ mới** — đúng **quy tắc #7**
   của dự án ("mọi chữ phải lấy nguyên văn từ markup cũ"). ⇒ Bảng rỗng nay hiện khối rỗng DÙNG CHUNG thay vì
   `<tbody>` trống — đây chính là mục tiêu `U-15` (88 trạng thái rỗng tự viết ⇒ dùng chung).
2. **Giữ nguyên** công thức `days` (số ngày tham gia) trong `render` của cột cuối, không tách ra ngoài.

## 3. Bộ quét phát hiện: phần lớn bảng còn lại KHÔNG chuyển được bằng máy

Em viết bộ quét phân loại **89 khối `<table>`** trong `app/page.tsx` theo các tiêu chí AN TOÀN
(markup cũ `className="baseline-table"` + dòng do `map` sinh + **không** `style` trên `<tr>` +
**không** `colSpan`/`Fragment` + không phải "dòng tĩnh"):

| Phân loại | Số bảng | Ý nghĩa |
|---|---|---|
| Đủ điều kiện chuyển **ngay** | **1** | `ProjectManagement` (nhưng thực chất là **bảng tổng hợp 3 dòng tĩnh**, không phải danh sách ⇒ **không nên** chuyển) |
| Cần cân nhắc | **12** | có `colSpan` (thường là **dòng trạng thái rỗng** — chuyển được nếu truyền `emptyText` đúng nguyên văn) · 1 có `Fragment` (`Purchasing`) |
| Còn lại | **~76** | `rowRole`/nhóm dòng, **không có `baseline-table`** (dùng khuôn CSS khác), hoặc là **chuỗi HTML in** (`printTabularReport`) ⇒ **KHÔNG chuyển** |

⚠️ **Ba chỗ cần THÊM TÍNH NĂNG cho `DataTable` trước khi chuyển được** (không được làm mất tính năng đang có):
1. **`rowStyle`/`rowClassName`** — bảng **ma trận quyền phòng ban** (`DepartmentPermissionManager`) tô nền vàng
   cho dòng **chưa lưu** bằng `style` trên `<tr>`; `DataTable` hiện **chưa có** chỗ truyền ⇒ chuyển ngay sẽ **mất
   dấu "chưa lưu"**.
2. **Tiêu đề cột ĐỘNG** — bảng quyền có 7 cột sinh từ `PERM_CAPS.map` ⇒ phải dựng `columns` động (làm được,
   nhưng cần viết cẩn thận để không lệch thứ tự cột).
3. **Bảng không dùng `baseline-table`** (`WorkflowManager` ×2 · `Admin` ×3 · nhiều bảng khác dùng `<table>` trần
   hoặc khuôn CSS riêng như `purchase-comparison-head`) — `DataTable` **luôn** render `.baseline-table`, nên
   chuyển thẳng sẽ **đổi CSS**. Muốn chuyển phải: hoặc thêm tham số cho `DataTable`, hoặc xác nhận CSS tương đương.

⇒ **Kết luận trung thực:** con số "42 bảng" trong kế hoạch trước là **đếm thô**; sau khi soi tiêu chí an toàn,
số bảng vừa **an toàn** vừa **có giá trị** là **~10–12**, và **3 bảng cần mở rộng `DataTable` trước**.

## 4. Việc kế tiếp của TASK-083 (thứ tự đã xác định)

1. Mở rộng `DataTable`: thêm **`rowClassName`/`rowStyle`** (giữ dấu "chưa lưu" của bảng quyền) — **có cổng**: `tsc` + cổng áp dụng.
2. Chuyển 5–6 bảng có `colSpan` **chỉ ở dòng rỗng**: `TeamManagement` (2 bảng còn lại) · `ProjectManagement` (4 bảng) ·
   `MaterialCatalogPage` (3 bảng) — **truyền `emptyText` NGUYÊN VĂN** từ khối `<Empty>` cũ.
3. Chuyển bảng **ma trận quyền** sau khi có `rowClassName` (cột động `PERM_CAPS`).
4. Chỉ chuyển bảng `<table>` trần **khi** chứng minh được CSS tương đương (chụp ảnh trước/sau) — nếu không thì **để nguyên**.

## 5. Tệp thay đổi (đợt này)

| Tệp | Nội dung |
|---|---|
| `app/page.tsx` | 1 bảng `TeamManagement` → `<DataTable>` |
| `drizzle/0116_phase1_ui_datatable2_identity.sql` | **MỚI** — head định danh nguồn (fixed point) |
| `lib/vntech-identity-data.mjs` · `VNTECH_*.txt` · `VNTECH_FINGERPRINT.json` · `MANIFEST_SHA256.txt` | đồng bộ định danh + manifest |
| `docs/agent-progress/TASK-083.md` | hồ sơ này |
