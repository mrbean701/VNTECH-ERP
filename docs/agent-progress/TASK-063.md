# TASK-063 — Cổng đối chiếu MỆNH ĐỀ (`ORDER BY` · `LIMIT` · kiểu `JOIN`) + vá 2 lệch thật

**Trạng thái:** ✅ DONE — mã đã vá, kiểm chứng lúc chạy, đã commit
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Cổng:** `tools/probe-clause-parity.mjs` (mới) · `tools/probe-task063-clauses.mjs` (mới) · `tools/probe-column-parity.mjs` (thêm đối chiếu chéo)

---

## 1. Vì sao có task này

Trong lúc vá TASK-062 tôi phát hiện **3 ca sai nặng mà cổng tập cột HOÀN TOÀN MÙ**, phải đọc thẳng JS mới thấy
(`boqImportBatches` sắp sai · `boqChangeHistory` thiếu tiebreaker + LIMIT · `workflowAssignments` trả cho mọi vai trò
⇒ **rò rỉ**). Kích thước thật của lớp lỗi này **chưa biết** ⇒ Known Problems #61/#62 ghi rõ: *không được báo
"đã khớp JS" cho tới khi có cổng riêng*. Task này dựng cổng đó.

## 2. Cổng `probe-clause-parity.mjs`

So ba thứ cho từng khoá bootstrap: **`ORDER BY`** (chuẩn hoá: bỏ backtick, bỏ tiền tố bảng, gộp khoảng trắng),
**`LIMIT`** (hiệu dụng), **kiểu `JOIN`** theo từng bảng (`JOIN` ↔ `LEFT JOIN` là khác biệt về việc GIỮ/BỎ dòng).

**ĐỐI CHỨNG CỦA CHÍNH BỘ SO SÁNH — 6/6 ĐẠT** (bắt buộc, vì đây là suy luận văn bản):

| Cặp dựng sẵn | Phải | Kết quả |
|---|---|---|
| chỉ khác định dạng + alias | IM | ĐẠT |
| khác `LIMIT` (10 ↔ 500) | BẮT | ĐẠT (bắt: LIMIT) |
| khác CHIỀU sắp (`DESC` ↔ `ASC`) | BẮT | ĐẠT (bắt: ORDER BY) |
| khác CỘT sắp | BẮT | ĐẠT (bắt: ORDER BY) |
| một phía thiếu **tiebreaker** | BẮT | ĐẠT (bắt: ORDER BY) |
| `JOIN` ↔ `LEFT JOIN` | BẮT | ĐẠT (bắt: JOIN) |

Kèm **phần ĐỘ PHỦ** (danh sách khoá BẮT BUỘC + sàn số khoá so được) theo đúng bài học #103.

## 3. Kết quả: 2 lệch THẬT — đã vá

| Khoá | Java (cũ) | JS | Hậu quả |
|---|---|---|---|
| `adminMaterialCategories` | `ORDER BY sort_order,code` | `:694` `ORDER BY CASE WHEN active=1 THEN 0 ELSE 1 END,sort_order,name` | nhóm **chưa dùng** không bị đẩy xuống cuối; cùng `sort_order` thì sắp theo **mã** thay vì **tên** |
| `audits` | `LIMIT 500` | `:698` `LIMIT 100` | Nhật ký kiểm toán dài **gấp 5 lần** giao diện tham chiếu |

## 4. Hai DƯƠNG TÍNH GIẢ của cổng — đã loại (sửa CỔNG, không sửa mã theo số sai)

1. **`productIdentity`**: JS dùng `await first(...)` (**ngầm** 1 dòng, không ghi `LIMIT`), Java ghi `LIMIT 1` tường minh
   ⇒ hai bên **cùng lấy 1 dòng**. Phép sửa: ghi nhận `all(`/`first(` khi đọc nguồn và tính **LIMIT HIỆU DỤNG**
   (`first()` ⇒ 1) cho **cả hai** lõi.
2. **`adminMaterials`**: Java viết `end, coalesce(...)` còn JS viết `end,coalesce(...)` — khác **khoảng trắng sau dấu phẩy**.
   Phép sửa: chuẩn hoá `\s*,\s*` → `,`.

## 5. Mô-đun dùng chung + chống trôi khác nhau

`tools/lib/sql-parity-extract.mjs` là **một nguồn duy nhất** để đọc hai nguồn (Java `data.put` / biến cục bộ;
JS `const X = … await all(\`SQL\`)` + object `result`). Cổng tập cột còn bản đọc nội tuyến, nên thay vì viết lại
cổng đang chạy tốt (rủi ro), cổng tập cột nay **TỰ ĐỐI CHIẾU CHÉO hai bản đọc**: nếu chúng cho kết quả khác nhau
trên bất kỳ khoá nào ⇒ cổng **in HỎNG và thoát mã 1**. Hiện tại: *"hai bản đọc cho KẾT QUẢ GIỐNG HỆT trên toàn bộ khoá"*.

## 6. Kiểm chứng lúc chạy — `tools/probe-task063-clauses.mjs` **3/3 ĐẠT**

* `audits`: MySQL có **745** dòng ⇒ API trả đúng **100** dòng và **SÁCH id khớp MySQL từng dòng một**
  (100/100 theo `ORDER BY occurred_at DESC`). Trước khi vá là 500.
* `adminMaterialCategories`: thứ tự khớp MySQL **từng dòng một** (6/6).
  ⚠️ `material_categories` hiện có **0** nhóm `active=0` ⇒ nhánh "đẩy nhóm chưa dùng xuống cuối" **không có dữ liệu
  để chứng minh**; phần so chỉ xác nhận khoá `sort_order,name`. **Nói rõ, không tính là đã chứng minh đủ.**
* ĐO (không phán) **lớp mù #63** — xem mục 7.

## 7. Lớp mù MỚI phát hiện: nhánh theo vai trò có **fallback là BIẾN KHÁC** (Known Problems #63)

JS `:694`: `const adminMaterialCategories = canEditCentral ? await all(A) : materialCategories;`

Cổng mệnh đề chỉ so **câu ĐẦU** nên **không thấy** rằng với tài khoản thường JS trả **chính `materialCategories`**.
Đo được trên dữ liệu thật (admin ↔ `thukydemo`):

| Khoá | admin | tài khoản thường |
|---|---|---|
| `adminMaterialCategories` | 6 dòng | **0 dòng** |
| `adminMaterialSubcategories` | 8 dòng | **0 dòng** |
| `adminMaterials` | 14 dòng | **0 dòng** |
| `workflowAssignments` | 5 dòng | 0 dòng (**đúng** JS `:723`) |
| `audits` | 100 dòng | 0 dòng (**đúng** JS `:698`) |
| `allModulePermissions` | 484 dòng | 0 dòng (đúng JS `:692`) |
| `users` | 12 dòng | 0 dòng (đúng JS) |

⇒ Ba khoá `adminMaterial*` **cần so tay** với JS (nhánh dự phòng là biến khác). **KHÔNG được coi "cổng xanh" là "đã khớp".**

## 8. Giới hạn đã biết (không giấu)

* Bỏ **tiền tố bảng** trong `ORDER BY` ⇒ chỉ so **ngữ nghĩa sắp xếp**, **có thể che** lệch BẢNG.
* Chỉ so **câu ĐẦU** mỗi khoá khi khoá có nhiều câu (in rõ số câu).
* **KHÔNG kiểm mệnh đề `WHERE`** — vẫn là vùng mù (quá nhiều cách viết tương đương).
* **13 khoá không so được** (JS không có SQL tương ứng / khoá dựng động) — **không tính là đã khớp**.
* Cổng không so JSON JS↔Java (lõi JS cũ không chạy trên MySQL).

## 9. Hồi quy sau khi build lại jar (90.911.038 B)

`probe-task050-bootstrap` **100/100** · `probe-task058-work-items` **18/18** · `probe-task048-audit-requests` **18/18** ·
`probe-task049-owner-checks` **10/10** · `probe-task054-all-roles` **20/20** · `probe-task062-boq` **19/19** ·
`probe-column-parity` **71 khoá / 0 thiếu / 0 mất độ phủ / 5-5** · `probe-clause-parity` **0 lệch / 6-6 đối chứng** ·
`probe-java-sql-live` 8 (không phát sinh mới) · `probe-schema-drift` **0 lệch**.

## 10. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `java-backend/…/BootstrapDataAdapter.java` | `adminMaterialCategories` sắp lại theo JS `:694` · `audits` `LIMIT 500 → 100` |
| `tools/lib/sql-parity-extract.mjs` | **mới** — mô-đun đọc hai nguồn dùng chung (+ nhận diện `first(`) |
| `tools/probe-clause-parity.mjs` | **mới** — cổng mệnh đề + đối chứng bộ so sánh + độ phủ |
| `tools/probe-task063-clauses.mjs` | **mới** — kiểm chứng lúc chạy + đo lớp nhánh theo vai trò |
| `tools/probe-column-parity.mjs` | thêm **đối chiếu chéo** hai bản đọc nguồn (tự báo HỎNG nếu trôi khác) |
