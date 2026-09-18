# TASK-093 — [Q8] ĐƠN GIÁ TRONG DANH MỤC VẬT TƯ GỐC → PO LẤY GIÁ TỪ ĐÓ (THIẾT KẾ + KẾ HOẠCH THI HÀNH)

- **Ngày:** 18/09/2026 · **Trạng thái:** `KHUNG-XONG / CHUA-THI-HANH` (thiết kế đã chốt theo yêu cầu người dùng; chờ thực thi)
- **Nguồn:** người dùng trả lời câu 8: *"thêm đơn giá vào bảng danh sách vật tư gốc, PO sẽ lấy giá từ đó (nếu như trong lúc đặt hàng từ nhà cung cấp cần sửa giá thì cho phép sửa giá nhưng không cập nhật giá vào danh sách vật tư gốc mà sẽ hỏi người đặt đơn PO hoặc admin hoặc user có dept = kế toán)"*
- **Vì sao cần (đo được):** cổng `probe-money-consistency` ghi nhận **2 lần** cùng một gốc: *"ĐƠN GIÁ PO = 0 trên TOÀN BỘ dòng ⇒ mọi số tiền suy từ PO đều bằng 0"* (13/13 dòng `purchase_order_items.unit_price` NULL/0 — đo 18/09) và *"Tồn kho: 28 dòng tồn, 0 dòng có giá"*.
- **Liên quan:** `materials` đã có cột **`standard_price decimal(18,4) NOT NULL DEFAULT 0`** ⇒ **KHÔNG cần thêm cột ở bảng vật tư**; chỉ cần **nối dữ liệu + đưa lên UI + luật sửa giá**.

## 1. Yêu cầu tách thành 4 phần đo được

| # | Yêu cầu | Cách thoả |
|---|---|---|
| R1 | Danh mục vật tư gốc **có cột đơn giá** (nhập/sửa được) | `materials.standard_price` **đã tồn tại** — thêm vào `MaterialModal` + cột trong bảng danh mục + cho `save_material` nhận `standardPrice` (API/Java đã có sẵn trường này — cần kiểm) |
| R2 | **PO lấy giá từ danh mục** khi thêm dòng | `PoModal`: khi chọn mã vật tư ⇒ **tự điền đơn giá = `material.standardPrice`** (người dùng vẫn sửa được) |
| R3 | Sửa giá khi đặt PO thì **cho phép**, nhưng **KHÔNG ghi ngược** vào danh mục gốc | PO lưu đơn giá **của riêng đơn hàng** (`purchase_order_items.unit_price`); `save_material`/`update_material` **không** bị gọi từ luồng PO (đảm bảo bằng cổng: sau khi tạo PO có giá khác, `materials.standard_price` **KHÔNG đổi**) |
| R4 | Giá bị sửa ⇒ **hỏi người đặt PO / admin / user dept = Kế toán** | Cần **cơ chế hỏi–đồng ý**: xem §3 (3 phương án, chọn 1 cách làm khớp kiến trúc hiện có) |

## 2. Hiện trạng kỹ thuật (đo, chưa đo hết — bước 1 khi thi hành)

- `materials`: **14 dòng**, có `standard_price` (NOT NULL DEFAULT 0) ⇒ hiện **chưa dùng ở UI nào** (cần xác nhận bằng grep).
- `purchase_order_items`: **13 dòng**, `unit_price` **13/13 NULL/0**.
- `PoModal` (`app/page.tsx`) — cần đọc để biết dòng PO đang có những trường nào và giá được nhập ở đâu.
- `save_material` (Java): TASK-045 đã vá `system`; **cần kiểm** nó có nhận `standardPrice` không (nhiều khả năng **có** — vì `insertMaterial` đã bind `m.get("standardPrice")`).
- Luồng phê duyệt hiện có: `approval_stage_catalog` + `approvals` + `approval_project_assignments` (đã dùng cho phiếu đề nghị) ⇒ **R4 nên tái dùng**, không dựng cơ chế mới.

## 3. R4 — ba phương án, khuyến nghị (1)

| Phương án | Cách làm | Ưu | Nhược |
|---|---|---|---|
| **(1) Duyệt bằng dải phê duyệt hiện có (KHUYẾN NGHỊ)** | Khi lưu PO mà **có dòng lệch giá danh mục**, đánh dấu PO `pending_price_approval` và tạo 1 bước duyệt với `allowedRoleCodes` = người đặt PO + admin + vai trò Kế toán (`accountant`); chỉ khi duyệt xong PO mới đi tiếp | Dùng lại 100 % hạ tầng duyệt đang chạy (audit, timeline, thông báo, quyền) | Cần thêm trạng thái + 1 bước duyệt vào cấu hình |
| (2) Hộp thoại xác nhận tức thời | Khi sửa giá, hiện hộp thoại "Giá lệch danh mục — gửi xác nhận?" rồi gửi thông báo cho 3 nhóm người | Nhanh | Không có hồ sơ duyệt, không truy vết được "ai đồng ý" |
| (3) Chỉ ghi log + cảnh báo | Cho sửa tự do, ghi `audit` + cảnh báo cho Kế toán | Rẻ nhất | **Không thoả** chữ "hỏi" của người dùng |

**Chốt khuyến nghị (1)** — nhưng đây là **quyết định nghiệp vụ** (ai được duyệt, có chặn hay chỉ cảnh báo) nên **phải xin xác nhận trước khi thi hành**, kèm câu hỏi: *khi giá PO lệch giá danh mục thì (a) chặn không cho lưu tới khi duyệt, hay (b) vẫn lưu nhưng đánh dấu "chờ xác nhận giá"?*

## 4. Kế hoạch thi hành (5 bước, mỗi bước có cổng)

1. **Đo hiện trạng** (grep `standardPrice` ở UI/Java/JS; đọc `PoModal` + `MaterialModal`; đo `purchase_order_items` theo cột) → ghi số vào hồ sơ.
2. **R1** — UI danh mục vật tư: thêm ô *Đơn giá* vào `MaterialModal` + cột *Đơn giá* trong bảng; kiểm `save_material` ghi đúng (`standardPrice`).
3. **R2+R3** — `PoModal`: khi chọn vật tư ⇒ điền giá từ danh mục; **cổng mới** `probe-q8-po-price.mjs`:
   * tạo PO 1 dòng với giá **khác** danh mục ⇒ ĐẠT nếu: PO lưu đúng giá đã sửa **VÀ** `materials.standard_price` **KHÔNG đổi** (đối chứng: trước/sau bằng nhau);
   * tạo PO 1 dòng **không** sửa giá ⇒ PO lưu **đúng** giá danh mục;
   * dọn sạch fixture + khôi phục đúng số dòng.
4. **R4** — theo phương án người dùng chốt (mặc định đề xuất (1)): thêm trạng thái + bước duyệt + màn hiển thị; cổng riêng: PO lệch giá ⇒ **không** đi tiếp khi chưa duyệt; duyệt xong ⇒ đi tiếp; `materials.standard_price` vẫn **không đổi**.
5. **Chốt** — cập nhật ảnh chuẩn (2 màn PO/danh mục), `test:regression`, `npm run build`, hồ sơ + commit + Telegram.

## 5. Rủi ro đã nhận diện trước

- **Lược đồ:** `materials.standard_price` **đã có** ở MySQL; **phải kiểm** SQLite (drizzle `db/schema.ts`) có cùng cột — nếu không, phải thêm migration drizzle + identity refresh.
- **Giá = 0 là mặc định:** nếu không phân biệt "0 = chưa có giá" với "0 = miễn phí", PO sẽ tự điền 0 và người dùng tưởng đã có giá ⇒ cần quy tắc hiển thị rõ (ví dụ "—" khi 0) và **không** chặn lưu.
- **Đừng ghi ngược:** bất kỳ đường nào vô tình gọi `save_material` từ luồng PO sẽ phá R3 ⇒ cổng ở bước 3 là thứ giữ bất biến này.
- **Quyền:** "user dept = kế toán" phải suy từ **CSDL thật** (`users.department`/`organization_units`), không hardcode mã.
