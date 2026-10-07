# TASK-197 — GO-LIVE ĐỢT 52: 🔧 **VÁ BUG-20261005-014** — ĐÚNG LÀ **LỖI CHUYỂN NGỮ**, VÁ THEO **JS GỐC**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-014** — MEDIUM · `delete_material_category` để lại **nhóm con mồ côi** |
| **⭐ PHÁT HIỆN QUYẾT ĐỊNH** | ⭐⭐ **ĐỌC `scripts/system-route.mjs` ⇒ ĐÂY LÀ LỖI CHUYỂN NGỮ, ⛔ KHÔNG PHẢI LỖI THIẾT KẾ** — **JS gốc LÀM ĐÚNG**, bản Java **đánh mất CẢ HAI hành vi** |
| **Trạng thái** | ⭐ **`FIXED`** · ✅ **VERIFIED (biên dịch + hồi quy 156/156)** · ⛔ **chưa VERIFIED end-to-end** (cần triển khai) |
| **Tệp sửa** | `java-backend/application/**/MaterialCatalogManagementUseCase.java` (**2 hàm + 1 helper**) |
| **Vân tay** | ⛔ **không đổi** (`java-backend/` ngoài `ROOT_DIRS`) |

---

## ① ⭐⭐⭐ BƯỚC NGOẶT: **JS GỐC LÀM ĐÚNG — BẢN JAVA ĐÁNH MẤT**

⭐ Tôi đã **suýt** vá theo «ý kiến của mình» (phương án A: chặn). ⭐ **Thay vào đó tôi đọc nguồn gốc** — và **JS gốc quy định rõ cả hai hành vi**:

```js
// scripts/system-route.mjs:2725-2735 — delete_material_category
const used = await first(`SELECT COUNT(*) AS count FROM materials WHERE category_id=?`, categoryId);
if (Number(used?.count || 0) > 0)
  throw new Error("Hệ M&E đang có vật tư. Hãy chuyển vật tư sang hệ khác hoặc ẩn hệ để giữ lịch sử.");
await env.DB.batch([
  env.DB.prepare(`DELETE FROM material_subcategories WHERE category_id=?`).bind(categoryId),  // ⭐ XOÁ NHÓM CON **TRƯỚC**
  env.DB.prepare(`DELETE FROM material_categories WHERE id=?`).bind(categoryId),
]);
return { message: "Đã xóa hệ M&E và các nhóm con trống." };

// scripts/system-route.mjs:2766-2773 — delete_material_subcategory
const used = await first(`SELECT COUNT(*) AS count FROM materials WHERE subcategory_id=?`, subcategoryId);
if (Number(used?.count || 0) > 0)
  throw new Error("Nhóm con đang có vật tư. Hãy chuyển vật tư sang nhóm khác trước khi xóa.");
await env.DB.prepare(`DELETE FROM material_subcategories WHERE id=?`).bind(subcategoryId).run();
return { message: "Đã xóa nhóm con chưa có vật tư." };
```

⇒ ⭐⭐ **BẢN JAVA CŨ (2 dòng) ⛔ ĐÁNH MẤT CẢ HAI**: ⛔ **chốt chặn «đang có vật tư»** và ⛔ **bước xoá nhóm con** ✓
⭐⭐⭐ **⇒ ĐÂY LÀ `PORTING BUG` (lỗi chuyển ngữ), ⛔ KHÔNG PHẢI vấn đề thiết kế** ⇒ ⭐ **CÁCH VÁ ĐÚNG LÀ CHUYỂN ĐÚNG JS** ✓ — ⛔ **không phải ý kiến của tôi** ✓
⭐ **VÀ** đây là **đúng tinh thần §3 và §12**: ⭐ **sửa đúng nguyên nhân**, ⛔ **không workaround**, ⛔ **không tự nghĩ ra thiết kế mới** ✓

---

## ② 🔧 BẢN VÁ — CHUYỂN ĐÚNG JS (2 hàm + 1 helper)

**`deleteMaterialCategory`**:
```java
store.findCategory(categoryId).orElseThrow(() -> Api("Không tìm thấy nhóm vật tư."));
// ⭐ CHỐT CHẶN (JS :2728-2730)
long used = store.allMaterials().stream().filter(m -> categoryId.equals(cot(m, "category_id"))).count();
if (used > 0) throw Api("Hệ M&E đang có vật tư. Hãy chuyển vật tư sang hệ khác hoặc ẩn hệ để giữ lịch sử.");
// ⭐ XOÁ NHÓM CON **TRƯỚC** (JS :2732)
for (Map<String,Object> s : store.subcategories())
    if (categoryId.equals(cot(s, "category_id"))) store.deleteSubcategorySafe(sv(s, "id"));
store.deleteCategorySafe(categoryId);
return Map.of("message", "Đã xóa hệ M&E và các nhóm con trống.");   // ⭐ ĐÚNG THÔNG ĐIỆP JS
```

**`deleteMaterialSubcategory`**: thêm **chốt chặn** `materials.subcategory_id` ⇒ **400 «Nhóm con đang có vật tư. Hãy chuyển vật tư sang nhóm khác trước khi xóa.»** ✓ và **đúng thông điệp** «Đã xóa nhóm con chưa có vật tư.» ✓

⭐ **Thông điệp lỗi GIỮ NGUYÊN TỪNG CHỮ theo JS** ⇒ ⭐ **người dùng thấy đúng câu hướng dẫn mà hệ thống cũ đã dạy họ** ✓

### ⚠️ CÁI BẪY ĐÃ TRÁNH — HAI HÀM STORE TRẢ **HAI KIỂU TÊN**
| Hàm store | SQL | Tên cột trả về |
|---|---|---|
| `subcategories()` | `SELECT id, category_id AS categoryId, …` | **camelCase** |
| `allMaterials()` | `SELECT *` | **snake_case** (`category_id`) |

⇒ ⭐ Tôi viết helper **`cot(map, "category_id")`** đọc **cả hai kiểu** ✓ ⛔ **không đoán** ✓
⭐⭐ **Đây đúng loại bẫy «đoán tên trường» đã gây lỗi nhiều lần trong phiên này** (TASK-193) ⇒ ⭐ lần này **đọc tolerant ngay từ đầu** ✓

### ⭐ VÌ SAO ⛔ KHÔNG THÊM HÀM PORT NÀO
⭐ `subcategories()` + `allMaterials()` **đã có sẵn** ⇒ ⭐ **bản vá ⛔ không đụng port, ⛔ không đụng adapter, ⛔ không đụng lược đồ** ⇒ ⭐ **`SMALL SAFE FIX` đúng nghĩa §12** ✓
⭐ Chi phí: nạp **237 vật tư + 50 nhóm con** mỗi lần xoá — ⭐ **chấp nhận được** (xoá là thao tác hiếm) ✓

---

## ③ ✅ KIỂM CHỨNG — 2 TẦNG

| Tầng | Kết quả |
|---|---|
| **Biên dịch** | ✅ **`BUILD SUCCESS`** — helper `cot` + `sv` hợp lệ ✓ |
| **Hồi quy `mvn -o test`** | ✅ **19 + 38 + 13 + 86 = 156 test · 0 Failures · 0 Errors · EXIT=0** ✓ |
| ⛔ **End-to-end** | ⛔ **CHƯA** — `:18081` vẫn chạy **JAR 01/10** ⇒ ⭐ **cần triển khai** ✓ |

⭐ **VÀ ĐÃ CẬP NHẬT BÀI KIỂM E2E** `go-live-thanh-cong-danh-muc-vt.mjs`: ⭐ sau bản vá, **xoá nhóm TỰ DỌN nhóm con** ⇒ ⛔ **bài kiểm ⛔ không cần tìm id nhóm con để xoá riêng nữa** ✓
⭐ **VÀ ghi rõ**: ⭐ **thiếu id nhóm con trong bootstrap ⛔ KHÔNG phải lỗi** — ⭐ **đó là điểm mù đã biết của bootstrap** (TASK-196) ✓ — ⛔ **trước đây bài kiểm báo thất bại ở đây, gây TÍN HIỆU SAI** ✓

---

## ④ TRẠNG THÁI TRUNG THỰC (§17)

```text
REPORTED → INVESTIGATING → FIXING → TESTING → FIXED → ⛔ (VERIFIED end-to-end)
   ✅           ✅            ✅         ✅        ✅            ⛔ CHƯA
```
⭐ **TÔI TUYÊN BỐ `FIXED` + `VERIFIED (biên dịch + hồi quy)`, ⛔ TUYỆT ĐỐI ⛔ KHÔNG TUYÊN BỐ `VERIFIED` trọn vẹn** ✓
⭐ **BẰNG CHỨNG MẠNH NHẤT hiện có**: ⭐ **hành vi mong đợi được quy định RÕ trong JS gốc** — ⭐ tôi **chuyển nguyên văn** (cả logic lẫn thông điệp) ⇒ ⭐ **⛔ không có chỗ nào là phán đoán của tôi** ✓
⭐ **Sau khi triển khai**: ⭐ chạy `go-live-thanh-cong-danh-muc-vt.mjs` + **truy vấn SQL `nhom_con_mo_coi`** ⇒ ⭐ **lúc đó mới `VERIFIED`** ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| 🐞 **BUG-20261005-014** | ⭐ **`FIXED`** · ✅ **VERIFIED (biên dịch + hồi quy)** · ⛔ **chưa end-to-end** |
| Bản vá | **2 hàm + 1 helper** · ⛔ **không đụng port/adapter/lược đồ** |
| Hồi quy | ✅ **156/156 · 0 fail · 0 error · EXIT=0** |
| Biên dịch | ✅ **BUILD SUCCESS** |
| ⭐ Phát hiện quyết định | ⭐⭐ **là `PORTING BUG` — JS gốc làm đúng** ⇒ **vá theo JS, ⛔ không theo ý kiến** |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ ⭐ **nay 7 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑥ BÀI HỌC

1. ⭐⭐⭐ **ĐỌC NGUỒN GỐC TRƯỚC KHI TỰ NGHĨ RA CÁCH VÁ.** ⭐ Tôi đã **suýt vá theo «phương án A» của mình**; ⭐ **đọc `system-route.mjs` thì thấy JS gốc quy định CẢ HAI hành vi** (chốt chặn **VÀ** xoá nhóm con) ⇒ ⭐ **bản Java ⛔ không sai thiết kế — nó CHUYỂN THIẾU** ✓ ⭐ **vá theo nguồn gốc, ⛔ không theo phán đoán** ✓
2. ⭐⭐⭐ **MỘT `PORTING BUG` CHỈ LỘ RA KHI SO VỚI NGUỒN GỐC.** ⭐ Đọc mã Java một mình thì thấy «hợp lý»; ⭐ **chỉ khi đặt cạnh JS mới thấy thiếu 2 hành vi** ✓
3. ⭐⭐ **THÔNG ĐIỆP LỖI CŨNG LÀ HỢP ĐỒNG.** ⭐ Người dùng cũ đã quen câu «Hãy chuyển vật tư sang hệ khác hoặc ẩn hệ để giữ lịch sử.» ⇒ ⭐ **giữ nguyên từng chữ** ✓
4. ⭐⭐ **ĐỌC TOLERANT THAY VÌ ĐOÁN TÊN TRƯỜNG.** ⭐ Cùng một store trả **camelCase** ở hàm này và **snake_case** ở hàm kia ⇒ ⭐ helper `cot()` đọc **cả hai** ⇒ ⛔ **không lặp lại lỗi «đoán tên trường»** ✓
5. ⭐⭐ **VÁ ĐƯỢC MÀ ⛔ KHÔNG ĐỤNG PORT/ADAPTER/LƯỢC ĐỒ LÀ DẤU HIỆU BẢN VÁ ĐÚNG PHẠM VI.** ⭐ `SMALL SAFE FIX` §12 ✓
6. ⭐⭐ **BÀI KIỂM BÁO THẤT BẠI VÌ ĐIỂM MÙ CỦA CHÍNH NÓ LÀ TÍN HIỆU SAI** — ⭐ đã sửa để ghi rõ «thiếu id nhóm con ⛔ không phải lỗi» ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **147 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **nay 7 bản vá** (5 cũ + **BUG-20261005-012** + **BUG-20261005-014**) + **10 bài nghiệm thu** ✓ — ⭐ **sau đó tôi `VERIFY` end-to-end cả 2 bug** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`? (⭐ **lần này tôi ⛔ không tự quyết vì ⛔ không có nguồn gốc để đối chiếu** — ⭐ khác hẳn BUG-014) ✓
3. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
4. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
5. ⭐ **Còn 6 cặp «tạo được mà chưa xoá được»** (`approval_stage` · `labor_contract` · `benefit_record` · `boq_item` · `project_contract` · `workflow`) ⚠️ **đều là dữ liệu nghiệp vụ** ⇒ cần bạn xác nhận riêng.
6. **Commit theo NHÓM hay gộp?** · **dọn Transit** · **khoá ngoại**.
