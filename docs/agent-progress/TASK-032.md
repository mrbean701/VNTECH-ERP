# TASK-032 — LỖ HỔNG LIÊN KẾT: 0/16 vai trò trỏ tới đơn vị mặc định

**Trạng thái:** PENDING — sửa **dữ liệu nghiệp vụ**, cần người dùng quyết định trước khi động vào
**Nguồn:** phát hiện ở lượt quét hồi quy của TASK-008 (test `runtime-admin-boq-regression` đỏ)
**Ngày:** 18/09/2026 · **Phân loại:** `CONFIRMED` (lỗ hổng dữ liệu)

---

## Objective

Khôi phục liên kết **vai trò → đơn vị tổ chức mặc định** (`role_catalog.default_organization_unit_id`)
để cơ chế "đơn vị mặc định theo vai trò" hoạt động trở lại.

## Bằng chứng (`tools/show-role-catalog.mjs`, đo trên `:9000`)

| Hạng mục | Giá trị đo được |
|---|---|
| `organization_units` | **8 dòng**, tất cả `active=true` |
| Trong đó có `BGD`? | **CÓ** — `BGD` = "Ban giám đốc", `unitType=department` |
| Vai trò **CÓ** trỏ đơn vị mặc định | **0 / 16** |
| `thuky.defaultOrganizationCode` | **null** (dữ liệu thật) |
| `thuky.name` | **"Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế"** |

⇒ **Đơn vị tồn tại mà không vai trò nào liên kết** ⇒ đây là **LỖ HỔNG LIÊN KẾT**, không phải thiếu đơn vị,
không phải lỗi hiển thị, không phải lỗi mã.

## Ảnh hưởng

* Cơ chế suy ra **đơn vị mặc định của người dùng mới từ vai trò** không thể hoạt động.
* `tests/runtime-admin-boq-regression.test.mjs:65` ("FULL W2 migration chain + canonical Organization/RBAC")
  đỏ — test này được viết **để bắt đúng loại lỗ hổng này**.

## Ghi chú kỹ thuật quan trọng

**Không tệp SQL nào và không tệp Java nào nhắc `default_organization_code`.** Trường này là **tên hiển thị
sinh từ JOIN** trên cột thật `role_catalog.default_organization_unit_id`, nên **tìm theo tên
`default_organization_code` sẽ không thấy gì** — dễ kết luận sai là "không có cột".

## Phần test cũng lệch (không chỉ dữ liệu)

Test khẳng định `name==='Thư ký Tổng giám đốc'`, nhưng tên thật đã dài hơn
("…/ Trưởng phòng Hành chính Pháp chế"). ⇒ Kể cả khi nạp xong liên kết đơn vị, test **vẫn còn 1 điểm lệch**
cần quyết định: **tên vai trò nào là chuẩn** theo MASTER TASK.

## Câu hỏi cần người dùng trả lời

> **1.** Có cần khôi phục `role_catalog.default_organization_unit_id` cho 16 vai trò không (ví dụ
> `thuky → BGD`, `ksda → DA`, `kh_nv → KH`, `thu_kho → DA`, `cht → BCH`, `tc_kt → TCKT`)?
> Nếu có, xin xác nhận **bảng ánh xạ vai trò → đơn vị** đúng.
> **2.** Tên vai trò `thuky` chuẩn là **"Thư ký Tổng giám đốc"** (theo test) hay
> **"Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế"** (theo dữ liệu đang chạy)?

## Dependencies

* Chặn việc làm xanh `npm test` (cùng TASK-031).

## Limitations

* Chưa rõ **cách nạp** đúng: migration drizzle (không có bản nào nạp cột này) hay thao tác quản trị?
  Cần người dùng chọn để **không tự phát minh nghiệp vụ**.
* **KHÔNG tự sửa dữ liệu** — đây là dữ liệu nghiệp vụ thật (§16, §45).

## Continuation Notes

* Đọc `TASK-008.md` phần 2 mục **F2b** để có toàn bộ ngữ cảnh.
* Sau khi có quyết định: nạp liên kết rồi **chạy lại** `node tools/show-role-catalog.mjs` để chứng minh
  `Vai trò CÓ trỏ đơn vị mặc định: 16/16`.
