# AD-11 — AUDIT: «2 SUB-TAB PROJECT & WAREHOUSE SCOPE»

> Mục master task: `AD-11` — nguyên văn `docs/25_TODO_ROADMAP.md`: «Audit 2 sub-tab Project & Warehouse scope»
> (module «Phạm vi», UI=FIX, QUYỀN=CHECK). Mục AUDIT ⇒ kết luận phải có CONFIRMED/LIKELY/UNKNOWN kèm bằng chứng.

## 1. KẾT LUẬN

| # | Khẳng định | Kết luận | Bằng chứng (`app/page.tsx`) |
|---|---|---|---|
| 1 | Bước 8 của màn Quản trị («Phạm vi dự án & kho») **KHÔNG có cơ chế sub-tab nào** trong mã: chỉ 1 danh sách dự án + 1 bảng GỘP «Phạm vi dự án & kho» | **CONFIRMED** | `{step===8&&…}` — không có `data-subtab`, không có mảng `*_SUB_TABS`, không có state tab |
| 2 | Cặp phạm vi ĐỘC LẬP thật nằm trong **`UserAccessModal`** (modal phân quyền từng tài khoản): mục «1. Phạm vi dự án» và «2. Phạm vi kho bắt buộc» | **CONFIRMED** | khối `UserAccessModal`: `<h3>1. Phạm vi dự án …` · `{isWarehouseRole&&<section …><h3>2. Phạm vi kho bắt buộc …` |
| 3 | Hai phạm vi được **kiểm độc lập**: phạm vi kho có cổng theo loại vai trò (`warehouse_scope_kind` = central/site) | **CONFIRMED** | `isWarehouseRole = (roleBase \|\| role) === "warehouse"` · `availableWarehouses` lọc `row.type === "central"` hoặc `"site"`; thông báo chặn: «Thủ kho Tổng chỉ được gán Kho Tổng; hệ thống chặn toàn bộ kho dự án» |
| 4 | Hai phạm vi lưu vào 2 bảng KHÁC NHAU qua cùng 1 action `save_user_access` | **CONFIRMED** | payload gồm `projectScopes` (→ `user_project_scopes`) + `warehouseScopes` (→ `user_warehouse_scopes`); `UserAccessModal` và `UserEditModal` đều dùng cùng action |
| 5 | Bảng 2 cột «Phạm vi dự án» / «Kho» ở bước 8 có phải là bản trùng lặp của modal phân quyền? | **LIKELY** | Bước 8 đọc `data.userScopes` + `data.allModulePermissions` và suy chuỗi hiển thị (`Chỉ Kho Tổng` / `Chỉ kho dự án được giao`); đây là bảng TỔNG HỢP, không có ô nhập |
| 6 | Có màn nào khác (ngoài 2 chỗ trên) tự dựng «sub-tab phạm vi» | **UNKNOWN** | Phép quét chỉ tìm theo dấu hiệu cấu trúc (`data-subtab`, `*_SUB_TABS`) trong `app/page.tsx` + `app/screens/**`; không loại trừ màn mới thêm sau này |

## 2. ĐÍNH CHÍNH TIỀN ĐỀ

Tiền đề «2 sub-tab Project & Warehouse scope» **KHÔNG đúng nguyên văn** ở bước 8: ở đó là **một bảng gộp**.
Mô hình ĐÚNG của roadmap (2 phạm vi kiểm độc lập, có cổng quyền riêng) **đã tồn tại** — nhưng nằm trong
`UserAccessModal`, không phải dưới dạng sub-tab. Vì vậy mục AD-11 **không cần** dựng thêm sub-tab mới
(dựng thêm sẽ tạo bản sao thứ hai của cùng một phạm vi ⇒ rủi ro lệch dữ liệu, trái nguyên tắc «một nguồn sự thật»).

## 3. HỆ QUẢ VỚI ROADMAP / BACKLOG

- **KHÔNG ảnh hưởng roadmap**: hành vi phân quyền (dự án + kho kiểm độc lập) đang đúng và đã có cổng quyền.
- **BACKLOG (không thuộc PHASE 7):** nếu người dùng vẫn muốn *hình thức* sub-tab ở bước 8, hãy mở một mục riêng
  (UI thuần) và **tái dùng** `UserAccessModal` thay vì viết bảng nhập mới; khi đó phải giữ bất biến
  «một phạm vi chỉ có một nơi ghi» (`save_user_access`).

Hợp đồng kiểm chứng: `tests/ad11-scope-audit.test.mjs` — tự đo lại hai bằng chứng (bước 8 không có sub-tab;
`UserAccessModal` có 2 mục phạm vi + 2 bảng đích) + kiểm tài liệu này.
