# TASK-065 — `canEditCentral` ≠ `admin`: đưa phép kiểm MODULE vào đường bootstrap (JS `:693`)

**Trạng thái:** ✅ DONE — mã đã vá, kiểm chứng lúc chạy **10/10 ĐẠT** (có đối chứng ÂM), đã commit
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Cổng:** `tools/probe-task065-caneditcentral.mjs` (mới)

---

## 1. Vì sao có task này

TASK-064 vá **nhánh dự phòng** của 3 khoá `adminMaterial*`, và ghi rõ phần **CÒN LẠI** (Known Problems #63):

```js
// system-route.mjs:693
const canEditCentral = isAdmin(user) || await canUseModule(user, "central_warehouse", "canEdit");
```

JS xét **thêm phép kiểm MODULE**; bản Java chỉ xét `admin`. Hệ quả: một vai trò Kho trung tâm
được cấp `central_warehouse.canEdit` (không phải admin) **vẫn nhận danh sách RÚT GỌN** thay vì danh sách
ĐẦY ĐỦ (gồm cả mục đã ẩn `active=0` + `aliases`/`aliasText`).

`canEditCentral` là biến **chỉ dùng cho 3 khoá này** (đã `grep` toàn `scripts/`: đúng 4 dòng `:693-696`).

## 2. Kiến trúc của bản vá — chỗ đặt phép kiểm quan trọng hơn bản thân phép kiểm

`BootstrapDataAdapter` (infrastructure) **chỉ có JdbcTemplate** — nó KHÔNG được biết cổng quyền
(`ModulePermissionStore` là cổng của tầng application). Vì vậy phép kiểm được đặt ở **use-case**:

| Tầng | Thay đổi |
|---|---|
| `BootstrapDataPort.Context` | thêm thành phần `boolean canEditCentral` (kèm chú thích vì sao KHÁC `admin`) |
| `BootstrapUseCase` | nhận thêm `ModulePermissionStore`; tính `canEditCentral = admin \|\| canUseModule(userId,"central_warehouse","canEdit")` rồi truyền xuống |
| `BootstrapDataAdapter` | khối dựng 3 khoá đổi từ `if (admin)` → `if (canEditCentral)`; phần xoá-trắng chỉ chạy khi `!canEditCentral` |
| `ApplicationBeansConfig` | thêm tham số `ModulePermissionStore` cho bean `bootstrapUseCase` |

**Chi tiết dễ sai:** ba khoá `adminMaterial*` trước đây nằm trong danh sách **xoá-trắng vô điều kiện** của
nhánh không-phải-admin. Nếu chỉ đổi `if (admin)` → `if (canEditCentral)` mà không sửa chỗ xoá-trắng thì
dữ liệu vừa dựng ĐẦY ĐỦ sẽ **bị xoá ngay sau đó** ⇒ đã tách danh sách xoá-trắng thành hai phần và bọc
phần ba khoá trong `if (!canEditCentral)`.

## 3. Kiểm chứng lúc chạy — `tools/probe-task065-caneditcentral.mjs` **10/10 ĐẠT**

Thiết kế **có ĐỐI CHỨNG ÂM trên cùng một tài khoản thật** (`tkhodemo`) — đây là phần chứng minh phép kiểm
mới **có tác dụng**, không chỉ "không hỏng":

| Bước | Việc làm | Kết quả đo |
|---|---|---|
| 0 | Tiền đề: `module_catalog.central_warehouse active=1`, `menu_group_catalog("warehouse") active=1`, nền = **0** dòng quyền | đủ điều kiện |
| 1 | **CẤP** dòng `central_warehouse.can_edit=1` (fixture tạm) | `adminMaterials` = **14** dòng ĐẦY ĐỦ (**14/14 có `aliases`**), categories **6**, subcategories **8** |
| 2 | **THU HỒI** dòng quyền | `adminMaterials` = **0** (JS `:696` trả `[]`), 2 khoá kia = bản RÚT GỌN (`materialCategories` 6 ↔ 6 · `materialSubcategories` 8 ↔ 8) |
| 3 | **Phép kiểm mới có tác dụng?** | **14 ≠ 0** ⇒ có tác dụng |
| — | Dọn dẹp | **0 → 1 → 0**, khẳng định quay về đúng nền ✅ |

Fixture được dọn trong `finally` và **khẳng định lại số dòng nền** (bài học từ sự cố để sót 7 dòng
`work_items` trước đây).

## 4. Giới hạn đã biết (không giấu)

* Cổng chỉ đo **một** tài khoản thật (`tkhodemo`) và **một** module (`central_warehouse`).
* Phép đo **phụ thuộc** `module_catalog.active=1` + `menu_group_catalog.active=1` (đã kiểm ở mục 0);
  nếu hai bảng đó đổi thì `canUseModule` trả false và phép đo vô nghĩa.
* Dữ liệu hiện có **0** bản ghi `active=0` ở `material_categories`/`material_subcategories` ⇒ sự khác biệt
  giữa "bản đầy đủ" và "bản rút gọn" của **2 khoá nhóm** chỉ thấy được qua **thứ tự**, không qua số dòng;
  tín hiệu phân biệt chắc chắn nằm ở `adminMaterials` (**14 ↔ 0**) và ở `aliases`/`aliasText`.
* `canEditCentral` chỉ được tính **một lần cho mỗi lần bootstrap** — đúng như JS (JS cũng tính một lần ở `:693`).

## 5. Hồi quy sau khi build lại jar (90.911.359 B)

`probe-task050-bootstrap` **100/100** · `probe-task058-work-items` **18/18** · `probe-task048` **18/18** ·
`probe-task049` **10/10** · `probe-task054-all-roles` **20/20** · `probe-task062-boq` **19/19** ·
`probe-task063-clauses` **7/7** · cổng tập cột **71 khoá / 0 thiếu / 0 mất độ phủ** ·
cổng mệnh đề **0 lệch** · `probe-java-sql-live` 8 (không phát sinh mới).

## 6. Sự cố môi trường trong lượt này (ghi lại vì đã xảy ra lần thứ hai)

**DSH khởi động lại ⇒ giết toàn bộ tiến trình con chạy nền**: Java `:18081`, Node SSR `:8787`,
cutover proxy `:9000` đều **DOWN** (MySQL `:3306` sống vì là Windows service). Đã dựng lại đủ 3 dịch vụ và
xác minh bằng `netstat` + HTTP 200. Bài học đã có trong bộ nhớ dài hạn — lượt này xác nhận lại.
