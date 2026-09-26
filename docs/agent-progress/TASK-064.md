# TASK-064 — Nhánh dự phòng theo VAI TRÒ là BIẾN KHÁC (JS `:694`/`:695`) + đóng lớp mù #63

**Trạng thái:** ✅ DONE — mã đã vá, kiểm chứng lúc chạy **7/7 ĐẠT**, đã commit
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Cổng liên quan:** `tools/probe-task063-clauses.mjs` (mở rộng từ ĐO sang KIỂM)

---

## 1. Vì sao có task này

TASK-063 dựng cổng so MỆNH ĐỀ và trong lúc đó phát hiện **lớp mù thứ hai** (Known Problems #63):
JS có những khoá mà **nhánh dự phòng là một BIẾN KHÁC**, không phải `[]`:

```js
// system-route.mjs:693-696
const canEditCentral = isAdmin(user) || await canUseModule(user, "central_warehouse", "canEdit");
const adminMaterialCategories    = canEditCentral ? await all(A) : materialCategories;
const adminMaterialSubcategories = canEditCentral ? await all(B) : materialSubcategories;
let   adminMaterials             = canEditCentral ? await all(C) : [];
```

Cổng mệnh đề chỉ so **câu SQL ĐẦU** của mỗi khoá nên **không thấy** phần nhánh. Bản Java xoá-trắng
**cả ba** khoá cho mọi tài khoản không phải admin.

## 2. Đo TRƯỚC khi vá (admin ↔ `thukydemo`)

| Khoá | admin | tài khoản thường (trước) | JS nói gì |
|---|---|---|---|
| `adminMaterialCategories` | 6 dòng | **0 dòng** | phải bằng `materialCategories` (6) |
| `adminMaterialSubcategories` | 8 dòng | **0 dòng** | phải bằng `materialSubcategories` (8) |
| `adminMaterials` | 14 dòng | 0 dòng | **đúng** — JS `:696` trả mảng RỖNG |
| `workflowAssignments` | 5 dòng | 0 dòng | **đúng** (`isAdmin ? … : []`) |
| `audits` | 100 dòng | 0 dòng | **đúng** (`isAdmin ? … : []`) |
| `allModulePermissions` | 484 dòng | 0 dòng | **đúng** |
| `users` | 12 dòng | 0 dòng | **đúng** |

⇒ Chỉ **2/3** khoá `adminMaterial*` là sai; `adminMaterials` vốn đã đúng. **Không "vá" theo cảm giác.**

## 3. Đã vá

Đặt lại ngay **sau** bước xoá-trắng theo module (để đọc đúng giá trị CUỐI của hai khoá nền, đúng như JS
vì nhánh dự phòng của JS đọc CHÍNH biến đó):

```java
data.put("adminMaterialCategories",    data.getOrDefault("materialCategories", List.of()));
data.put("adminMaterialSubcategories", data.getOrDefault("materialSubcategories", List.of()));
```

`adminMaterials` **giữ nguyên `[]`** vì JS trả mảng rỗng cho người không có quyền.

## 4. Cổng mở rộng: từ ĐO sang KIỂM — **7/7 ĐẠT**

`tools/probe-task063-clauses.mjs` nay kiểm 4 phép mới (ngoài 3 phép cũ):

* `adminMaterialCategories` = `materialCategories` (so **theo id từng dòng**);
* `adminMaterialSubcategories` = `materialSubcategories`;
* `adminMaterials` = `[]`;
* **không RÒ RỈ** 6 khoá admin-gated (`workflowAssignments` · `audits` · `allModulePermissions` · `users` · `sessions` · `adminProjects`) cho tài khoản thường.

Kết quả sau khi vá: `adminMaterialCategories` **0 → 6 dòng**, `adminMaterialSubcategories` **0 → 8 dòng**.

## 5. Giới hạn đã biết (không giấu) — CÒN LẠI của lớp #63

JS dùng `canEditCentral = isAdmin(user) || canUseModule(user,"central_warehouse","canEdit")`;
Java hiện chỉ xét `admin`.

⇒ Tài khoản **không phải admin nhưng CÓ quyền `central_warehouse.canEdit`** vẫn nhận **danh sách rút gọn**
thay vì danh sách ĐẦY ĐỦ (danh sách đầy đủ có cả mục `active=0` + `aliases`).
Cần đưa **phép kiểm module** vào đường bootstrap (`BootstrapDataAdapter`) — hạng mục riêng, **chưa làm ở lượt này**.

Ngoài ra: cổng mệnh đề vẫn **KHÔNG kiểm `WHERE`** và **13 khoá không so được** ⇒ không được coi "cổng xanh" là "đã khớp".

## 6. Hồi quy sau khi build lại jar (90.911.062 B)

`probe-task050-bootstrap` **100/100** · `probe-task058-work-items` **18/18** · `probe-task048` **18/18** ·
`probe-task049` **10/10** · `probe-task054-all-roles` **20/20** · `probe-task062-boq` **19/19** ·
`probe-task063-clauses` **7/7** · cổng tập cột **71 khoá / 0 thiếu / 0 mất độ phủ** ·
cổng mệnh đề **0 lệch** · `probe-java-sql-live` 8 (không phát sinh mới) · `probe-schema-drift` **0 lệch**.

## 7. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `java-backend/…/persistence/BootstrapDataAdapter.java` | nhánh dự phòng cho 2 khoá `adminMaterial*` (sau bước xoá-trắng theo module) |
| `tools/probe-task063-clauses.mjs` | 4 phép KIỂM mới (2 nhánh dự phòng · `adminMaterials` = `[]` · không rò rỉ khoá admin-gated) |
| `docs/agent-progress/MASTER_STATUS.md` | #63 cập nhật trạng thái ĐÃ VÁ 2/3 + phần CÒN LẠI; TODO thêm TASK-064 |
