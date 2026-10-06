# TASK-196 — GO-LIVE ĐỢT 51: 🐞 **PHÁT HIỆN LỖI THẬT** — `delete_material_category` ĐỂ LẠI **NHÓM CON MỒ CÔI**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-014** — **MEDIUM** · `delete_material_category` ⛔ **không xoá nhóm con** |
| **Trạng thái** | `REPORTED` → ✅ **nguyên nhân ĐÃ CHỨNG MINH bằng SQL** · ⛔ **chưa vá** (cần user chọn A/B) |
| **Phát hiện khi** | ⭐ Mở rộng **đường thành công** cho `material_category` + `material_subcategory` (đúng loại rủi ro «tạo được mà chưa từng xoá được») |
| **Bao phủ đường thành công** | **82 → 85** (`save_material_category` · `delete_material_category` + 1 phần) |
| **⛔ Rác do bài kiểm** | **1** ⇒ ✅ **ĐÃ DỌN** (`nhom_con_mo_coi = 0` · `rac_cua_toi_con_lai = 0`) |

---

## ① ⭐ PHÉP ĐO ĐÃ CHỈ ĐÚNG CHỖ CẦN KIỂM

`bao-phu-that.mjs --chi-ok` cho thấy: `save_material_category` **đã thành công 10 lần** · `save_material_subcategory` **41 lần**
⛔ **NHƯNG `delete_material_category` / `delete_material_subcategory` CHƯA TỪNG THÀNH CÔNG**
⇒ ⭐⭐ **ĐÓ LÀ «TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC»** — ⭐ **đúng cơ chế sinh rác** (đã trải qua ở TASK-195) ✓

---

## ② 🐞 BUG-20261005-014 — `delete_material_category` ĐỂ LẠI **NHÓM CON MỒ CÔI**

| | |
|---|---|
| **Module** | Danh mục vật tư (`material_catalog`) |
| **Tệp** | `MaterialCatalogManagementUseCase.deleteMaterialCategory` → `store.deleteCategorySafe(categoryId)` |
| **Mức** | **MEDIUM** — ⚠️ **toàn vẹn dữ liệu**, ⛔ không mất dữ liệu người dùng, ⚠️ nhưng **sinh bản ghi mồ côi** |

### ⭐ TÁI HIỆN (đã chạy)
1. `save_material_category({code:'E2E_CAT_…', name:…})` ⇒ **200** ✓
2. `save_material_subcategory({categoryId:<id nhóm>, name:'Nhóm con E2E …'})` ⇒ **200** ✓
3. `delete_material_category({categoryId})` ⇒ **200** ✓
4. ⛔ **`delete_material_subcategory` ⛔ KHÔNG được gọi** — ⭐ **đúng như một người dùng bình thường sẽ làm** (xoá nhóm, ⛔ không xoá từng nhóm con) ✓

### ⭐ BẰNG CHỨNG — TRUY VẤN SQL TRỰC TIẾP
```sql
-- ① nhóm con VẪN CÒN, category_id trỏ tới nhóm đã bị xoá:
SELECT id, category_id, code, name FROM material_subcategories WHERE name LIKE 'Nhóm con E2E %';
-- SUB_fcf8f0e4-… | MCAT_e28dcf33-… | NHOM_CON_E2E_MUUEXXYK | Nhóm con E2E MUUEXXYK

-- ② nhóm mẹ ĐÃ MẤT:
SELECT COUNT(*) FROM material_categories WHERE id='MCAT_e28dcf33-…';
-- ⇒ 0        ⭐ XÁC NHẬN MỒ CÔI

-- ③ toàn bảng còn bao nhiêu bản ghi mồ côi:
SELECT COUNT(*) FROM material_subcategories s
WHERE NOT EXISTS (SELECT 1 FROM material_categories c WHERE c.id=s.category_id);
-- ⇒ 0 (sau khi tôi dọn)   ⭐ trước khi dọn: 1
```

### ⭐ NGUYÊN NHÂN GỐC
- `deleteCategorySafe(categoryId)` **chỉ xoá dòng trong `material_categories`** ✓
- DB **⛔ KHÔNG có khoá ngoại** (**đo được: 131 bảng · 0 FK** — giới hạn đã ghi từ lâu) ⇒ ⛔ **không có gì chặn và ⛔ không có gì cascade** ✓
- ⇒ ⭐ **bản ghi con nằm lại vĩnh viễn** ✓

### ⚠️ CHI TIẾT ĐÁNG CHÚ Ý
⭐ Hàm tên là **`deleteCategorySafe`** — ⭐ **cái tên HỨA là «an toàn»**, ⛔ **nhưng nó ⛔ không kiểm con** ✓
⚠️ **Có thể UI chặn** (ẩn nút khi nhóm còn con) — ⛔ **nhưng §3 nói rõ: backend PHẢI là lớp kiểm soát**, ⛔ không chỉ ẩn nút ở UI ✓ ⭐ **và bài kiểm này chứng minh BACKEND ⛔ KHÔNG chặn** ✓

### 🔧 HƯỚNG VÁ — ⛔ **CẦN USER QUYẾT** (2 phương án đều hợp lý)
| Phương án | Hệ quả |
|---|---|
| **A. CHẶN** — nếu nhóm còn nhóm con thì trả **400 «Nhóm vật tư còn N nhóm con — phải xoá/chuyển trước»** | ⭐ **an toàn nhất, ⛔ không mất dữ liệu** · ⭐ người dùng biết mình phải làm gì |
| **B. XOÁ THEO** — xoá luôn mọi nhóm con (cascade tường minh trong transaction) | ⭐ tiện · ⚠️ **nguy hiểm nếu nhóm con đang được vật tư tham chiếu** |

⭐ **ĐỀ XUẤT CỦA TÔI: A** — ⭐ vì `materials.categoryId` **có thể đang trỏ tới nhóm con**; ⭐ **A ⛔ không phá gì**, ⭐ và **có thể chuyển sang B sau** nếu user muốn ✓

---

## ③ ⛔⛔ PHÁT HIỆN THỨ HAI — **ĐIỂM MÙ CỦA CHÍNH PHÉP KIỂM HẬU QUẢ**

⭐ Bài kiểm báo **«94 mảng bootstrap: ✔ KHÔNG mảng nào đổi»** ⚠️ **TRONG KHI THỰC TẾ CÓ 1 BẢN GHI MỚI TRONG CSDL** ✓
⇒ ⭐⭐ **NGUYÊN NHÂN**: ⭐ **`materialSubcategories` trong bootstrap ⛔ KHÔNG chứa nhóm con vừa tạo** (⚠️ nghi do lọc theo `review_status`/`active`) ⇒ ⭐ **phép đếm mảng ⛔ không thấy nó** ✓
⚠️ **VÀ** tên `code` **tự sinh** là `NHOM_CON_E2E_…` (⛔ không phải `E2E…`) nên **bài kiểm cũng ⛔ không tìm thấy theo mã** ✓

⭐⭐⭐ **BÀI HỌC: PHÉP ĐẾM MẢNG BOOTSTRAP CÓ ĐIỂM MÙ — PHẢI KIỂM BẰNG MySQL.** ⭐ **Đó là phép đo có thẩm quyền** ✓
⭐ **VÀ** chính **truy vấn MySQL** mới tìm ra bản mồ côi ⇒ ⭐ **nếu chỉ tin bootstrap thì tôi đã kết luận «sạch» và ⛔ bỏ sót cả LỖI THẬT lẫn RÁC** ✓✓✓

---

## ④ ✅ ĐÃ DỌN SẠCH — XÁC NHẬN BẰNG SQL
| Phép đo | Kết quả |
|---|---|
| `nhom_me_con_ton_tai` (nhóm mẹ `MCAT_e28dcf33…`) | **0** ⇒ ⭐ **xác nhận mồ côi là THẬT** ✓ |
| `nhom_con_mo_coi` (toàn bảng, sau khi dọn) | **0** ⇒ ⭐ **⛔ không còn bản ghi mồ côi nào** ✓ |
| `rac_cua_toi_con_lai` (`E2E_CAT_%` + `NHOM_CON_E2E_%`) | **0** ⇒ ⭐ **rác của tôi: 0** ✓ |
| 9 nhóm `E2E%` còn lại | ✅ **LÀ DANH MỤC THẬT CỦA USER** (tạo **02/10 08:56**) — ⛔ **KHÔNG phải rác** ✓ |
| `rac_hom_nay` (nhóm tạo hôm nay) | **0** ✓ |

⭐⭐ **GHI NHẬN QUAN TRỌNG VỀ PHÉP ĐO**: ⭐ câu truy vấn đầu của tôi dùng `code LIKE 'E2E%'` và **trả về 35 dòng** ⇒ ⭐ **tôi SUÝT kết luận 35 bản rác** — ⚠️ **thực tế đó là danh mục 200 mã vật tư THẬT của user** ✓ ⭐ **Sửa lại: lọc theo TÊN + theo THỜI ĐIỂM TẠO** ✓ ⭐ **lần thứ N trong phiên này: phép đo quá rộng ⇒ kết luận sai** ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| 🐞 **BUG-20261005-014** | **MEDIUM** — `delete_material_category` để lại nhóm con mồ côi · **nguyên nhân ĐÃ CHỨNG MINH bằng SQL** · ⛔ **chưa vá** |
| Bao phủ **đường thành công** | **82 → 85** (37% → **39%**) |
| Vòng đời chạy được | ✅ `save_material_category` · `delete_material_category` **hoạt động ĐÚNG** (kể cả **chốt chống trùng** `code`) |
| ⛔ Rác do bài kiểm | **1** ⇒ ✅ **ĐÃ DỌN** (`nhom_con_mo_coi = 0`) |
| ⛔ Điểm mù phát hiện | ⭐ **phép đếm mảng bootstrap ⛔ không thấy nhóm con mới** ⇒ **phải kiểm bằng MySQL** |
| Bug sản phẩm mới | **1** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **6 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑥ BÀI HỌC

1. ⭐⭐⭐ **PHÉP ĐẾM MẢNG BOOTSTRAP CÓ ĐIỂM MÙ.** ⭐ Nó báo **«✔ không mảng nào đổi»** trong khi CSDL **có 1 bản ghi mới** ⇒ ⭐ **nếu chỉ tin nó, tôi đã bỏ sót CẢ rác LẪN một LỖI THẬT** ✓ ⭐ **MySQL là phép đo có thẩm quyền** ✓
2. ⭐⭐ **PHÉP ĐO QUÁ RỘNG LẠI SUÝT CHO KẾT LUẬN SAI**: `code LIKE 'E2E%'` trả **35 dòng** — ⭐ **đó là DANH MỤC THẬT CỦA USER**, ⛔ không phải rác ⇒ ⭐ **lọc theo TÊN + THỜI ĐIỂM TẠO** ✓
3. ⭐⭐ **MỘT CÁI TÊN HÀM CÓ THỂ HỨA NHIỀU HƠN NÓ LÀM.** ⭐ `deleteCategorySafe` ⛔ **không kiểm con** ⇒ ⭐ **tên ⛔ không phải bằng chứng** ✓
4. ⭐⭐ **«TẠO ĐƯỢC MÀ CHƯA TỪNG XOÁ ĐƯỢC» LÀ MỘT DẤU HIỆU RỦI RO THẬT.** ⭐ Phép đo bao phủ đã **chỉ đúng chỗ** ⇒ ⭐ **mở rộng đường thành công KHÔNG chỉ để tăng số — nó TÌM RA LỖI** ✓
5. ⭐⭐ **⛔ KHÔNG CÓ KHOÁ NGOẠI ⇒ TẦNG DB ⛔ KHÔNG BẢO VỆ GÌ.** ⭐ Đây là **ca cụ thể thứ hai** của giới hạn «131 bảng · 0 FK» (ca đầu là dữ liệu bị xoá mà ⛔ không ai chặn) ✓
6. ⭐ **KIỂM BẰNG SQL TRƯỚC KHI KẾT LUẬN «SẠCH»** — ⭐ nhất là khi **bootstrap có thể lọc** ✓
7. ⭐ **MỘT HÀM `*Safe` KHÔNG KIỂM RÀNG BUỘC LÀ MỘT LỜI HỨA SUÔNG** ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **147 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **BUG-20261005-014** — **A** CHẶN (đề xuất của tôi) hay **B** XOÁ THEO?
2. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ **6 bản vá** + **10 bài nghiệm thu** (⭐ nên thêm bài mới khi vá xong BUG-014).
3. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
4. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
5. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
6. ⭐ **Tiếp tục mở rộng đường thành công** — ⭐ còn **6 cặp** «tạo được mà chưa xoá được»: `approval_stage` · `labor_contract` · `benefit_record` · `boq_item` · `project_contract` · `workflow` ⚠️ (**đều là dữ liệu nghiệp vụ** ⇒ cần bạn xác nhận riêng).
7. **Commit theo NHÓM hay gộp?** · **dọn Transit** · **khoá ngoại**.
