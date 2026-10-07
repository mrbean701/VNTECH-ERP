# TASK-220 — GO-LIVE ĐỢT 75: ✅ **VÁ `BUG-20261005-013` PHƯƠNG ÁN B** (⭐ làm theo **mặc định an toàn** khi bạn chưa trả lời)

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Bối cảnh** | ⭐ Tôi đã **hỏi bạn 4 quyết định** (triển khai · dọn dẹp · BUG-013 · commit) ⚠️ **⛔ chưa có trả lời trong 10 phút** ⇒ theo hướng dẫn: ⭐ **tiếp tục với MẶC ĐỊNH AN TOÀN + nêu rõ giả định** ✓ |
| **🐞 BUG** | **BUG-20261005-013** — **MEDIUM** · `preview_material_dependencies` + `deleteUnusedMaterials` ⇒ **HTTP 500** |
| **Kết quả** | ✅ **`FIXED`** (⭐ **phương án B**) · ✅ **`mvn -o test` 156/156 · BUILD SUCCESS · EXIT=0** · ⛔ **chưa VERIFIED e2e** (⭐ chờ triển khai) |
| **⛔ THAY ĐỔI** | **1 dòng SQL** + **25 dòng chú thích có bằng chứng** — ⭐ **`SMALL SAFE FIX`** ✓ |
| **⭐ NAY 9 BẢN VÁ CHỜ TRIỂN KHAI** | ⭐ (8 cũ + **BUG-013**) ✓ |

---

## ① ⭐ GIẢ ĐỊNH MẶC ĐỊNH TÔI CHỌN (⭐ ⛔ không mặc định «CÓ» cho việc GHI)

| Quyết định | ⭐ Mặc định tôi áp dụng | ⭐ Lý do |
|---|---|---|
| **TRIỂN KHAI 8 bản vá** | ⛔ **CHƯA** | ⭐ tôi đã **cam kết ⛔ không triển khai** khi chưa có **mắt người** ✓ |
| **DỌN DỮ LIỆU** (transit · 570 mồ côi) | ⛔ **CHƯA** | ⭐ **thao tác GHI trên CSDL THẬT** ⇒ ⛔ **cần bạn cho phép** ✓ |
| **BUG-20261005-013** | ✅ **LÀM phương án B** | ⭐ **§19 hạng 5 (bug 500 MEDIUM)** ⚠️ **cao hơn UI polish (hạng 7-8)** ✓ · ⭐ **sửa mã nguồn, ⛔ không ghi dữ liệu** ✓ · ⭐ **`SMALL SAFE FIX`** ✓ |
| **COMMIT** | ⛔ **CHƯA** | ⭐ bạn đã nói «**chưa commit, để tôi xem trước**» ✓ |

⇒ ⭐⭐ **NGUYÊN TẮC MẶC ĐỊNH**: ⭐ **⛔ mọi việc GHI vào hệ thật (deploy · CSDL · commit) đều mặc định «CHƯA»** ✓ — ⭐ **chỉ làm việc ⛔ không ghi: sửa mã nguồn + kiểm chứng** ✓✓✓

---

## ② ✅ **ĐO TRƯỚC KHI SỬA** — ⭐ ⛔ không xoá mù

| Câu hỏi | ⭐ ĐO ĐƯỢC |
|---|---|
| ⭐ **UI có dùng `mergedFrom` không?** | ✅ **⛔ KHÔNG** — `app/**` + `lib/**` ⇒ **0 kết quả** ✓ ⇒ ⭐ **xoá ⛔ không làm hỏng UI** ✓ |
| **Backend dùng ở đâu?** | ⭐ đúng **3 chỗ**: `MaterialCatalogStoreAdapter.java:121` (**nguồn 500**) · `MaterialCatalogManagementUseCase.java:231` (dùng) · `:251` (xuất API) ✓ |
| ⭐ **Cột có tồn tại?** | ✅ **⛔ KHÔNG** — `information_schema` ⇒ **COUNT = 0** (⭐ **xác nhận lần thứ 5**) ✓ |
| **Tệp khác dùng?** | ✅ ⛔ **không** ✓ |

---

## ③ ⭐⭐⭐ PHÁT HIỆN QUAN TRỌNG KHI ĐỌC `MaterialCatalogManagementUseCase:226-237`

```java
long merged = numberValue(row.get("mergedFrom")) > 0 ? 1 : 0;
if (req + alloc + boq + mov + merged == 0 && !"__BOQ_STRUCTURE__".equals(sv(row, "code"))) {
    store.hardDeleteMaterial(sv(row, "id"));   // ⚠️⚠️ XOÁ CỨNG VẬT TƯ!
    removed++;
}
```
⇒ ⭐⭐ **`materialsWithReferences()` PHỤC VỤ CẢ HAI**:
| Hàm | ⭐ Bản chất | Ảnh hưởng 500 |
|---|---|---|
| `previewMaterialDependencies` | ⚙️ **ĐỌC** (xem trước) | ⚠️ **500 — người dùng thấy lỗi** ✓ |
| `deleteUnusedMaterials` | ⛔ **XOÁ CỨNG VẬT TƯ** | ⚠️ **500** — ⭐ **và điều đó VÔ TÌNH BẢO VỆ hành động xoá** ✓ |

⚠️ **RỦI RO TÔI PHẢI KIỂM TRƯỚC KHI VÁ**: ⭐ nếu chỉ bỏ subquery ⇒ ⭐ **`merged` = 0** ⇒ ⭐ **tiêu chí «đã gộp» biến mất** ⚠️ ⇒ ⭐ **vật tư ĐÃ GỘP có thể bị coi là «không dùng» ⇒ BỊ XOÁ CỨNG** ✓✓✓

### ⭐⭐ VÌ SAO **AN TOÀN** (⭐ và `0` là **SỰ THẬT**)
⭐ **Cột `code_merge_into_id` CHƯA BAO GIỜ TỒN TẠI** (⭐ đo 5 cách) ⇒ ⛔ **chưa vật tư nào từng được gộp** ✓
⇒ ⭐⭐ **`merged` LUÔN = 0 TRÊN THỰC TẾ** ⇒ ⭐ **`0` phản ánh ĐÚNG trạng thái dữ liệu** ✓
⇒ ⭐⭐⭐ **NGỮ NGHĨA ⛔ KHÔNG ĐỔI** so với ý định của mã ✓✓✓
⭐⭐ **VÀ `0` ⛔ KHÔNG PHẢI «WORKAROUND che giấu» (§3)** — ⭐ nó là **giá trị ĐÚNG**, ⭐ vì **tính năng «gộp vật tư» chưa từng được xây** ✓

---

## ④ 🔧 BẢN VÁ — ⭐ **1 dòng**

```java
// ⛔ TRƯỚC: (SELECT COUNT(*) FROM materials me WHERE me.code_merge_into_id=m.id) AS mergedFrom
// ✅ SAU:   0 AS mergedFrom
```
⭐ **+ 25 dòng chú thích** ghi đủ: lỗi · **5 bằng chứng độc lập** · ảnh hưởng rộng hơn (⭐ cả `deleteUnusedMaterials`) · **vì sao `0` là sự thật** · **vì sao an toàn với UI** · **phương án B là gì** ✓

### ✅ XÁC MINH BẢN VÁ **KHÔNG CÒN TRUY VẤN THẬT NÀO DÙNG CỘT ĐÓ**
```text
code_merge_into_id xuất hiện ở: dòng 122 · 123 · 124 · 127  ⇒ ✅ TẤT CẢ LÀ CHÚ THÍCH
0 AS mergedFrom ở dòng 146                                   ⇒ ✅ BẢN VÁ
⛔ còn truy vấn THẬT dùng cột đó = False                      ⇒ ✅ SẠCH
```

### ✅ HỒI QUY
```text
[INFO] Tests run: 19, Failures: 0, Errors: 0, Skipped: 0
[INFO] Tests run: 38, Failures: 0, Errors: 0, Skipped: 0
[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
[INFO] Tests run: 86, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
MVN_EXIT=0
```
⇒ ⭐ **156 test · 0 fail · 0 error** ✓

---

## ⑤ ⭐ TRẠNG THÁI — **NAY 9 BẢN VÁ CHỜ TRIỂN KHAI**

| # | Bug | Mức | ⭐ Trạng thái |
|---|---|---|---|
| ① | `BUG-20261005-003` | MEDIUM | FIXED |
| ② | `BUG-20261005-005` | **HIGH** | FIXED |
| ③ | `BUG-20261005-008` | MEDIUM | FIXED |
| ④ | `BUG-20261010` | **HIGH** | FIXED |
| ⑤ | `BUG-20261011` | LOW | FIXED |
| ⑥ | `BUG-20261005-012` | **HIGH** | FIXED · ⛔ chưa VERIFIED e2e |
| ⑦ | `BUG-20261005-014` | MEDIUM | FIXED · ⛔ chưa VERIFIED e2e |
| ⑧ | `BUG-20261005-015` | MEDIUM | FIXED · ⛔ chưa VERIFIED e2e |
| ⑨ | ⭐ **`BUG-20261005-013`** | **MEDIUM** | ⭐ **FIXED (mới)** · ⛔ chưa VERIFIED e2e |

⇒ ⭐ **4 lỗi 500** trong danh sách này ⇒ ⭐ **triển khai sẽ dập cả 4** ✓

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| 🐞 **BUG-20261005-013** | ✅ **`FIXED`** (phương án B) · ⛔ chưa VERIFIED e2e |
| ⭐ **Thay đổi** | **1 dòng SQL** + 25 dòng chú thích (⭐ `SMALL SAFE FIX`) ✓ |
| ✅ **Không còn truy vấn thật dùng cột đó** | ✅ **XÁC MINH** ✓ |
| ⭐ **Hồi quy `mvn -o test`** | ✅ **156/156 · BUILD SUCCESS · EXIT=0** ✓ |
| ⭐ **An toàn với UI** | ✅ **⛔ không tệp UI nào dùng `mergedFrom`** ✓ |
| ⭐ **Ngữ nghĩa `deleteUnusedMaterials`** | ✅ **⛔ KHÔNG ĐỔI** (⭐ cột chưa từng tồn tại ⇒ `merged` luôn 0) ✓ |
| ⛔ **Thay đổi dữ liệu** | **0** ✓ |
| ⛔ **Lỗi của tôi** | **0** ✓ |
| Vân tay | **ĐẠT** `VNTECH-FP-018A1FB2E849579E` · 713 tệp ✓ |
| `:8787` · `:18081` | ✅ **200** · ✅ **401 = KHOẺ** ✓ |
| Tệp tạm · `.snapshot` | **0 · 0** ✓ |

---

## ⑦ BÀI HỌC

1. ⭐⭐⭐ **MẶC ĐỊNH AN TOÀN KHI NGƯỜI DÙNG ⛔ CHƯA TRẢ LỜI = «⛔ KHÔNG GHI».** ⭐ Mọi việc **ghi vào hệ thật** (deploy · CSDL · commit) ⭐ **mặc định «CHƯA»** ✓ — ⭐ **chỉ làm việc ⛔ không ghi: sửa mã nguồn + kiểm chứng** ✓✓✓
2. ⭐⭐⭐ **ĐỌC HẾT NGỮ CẢNH CỦA HÀM TRƯỚC KHI SỬA NÓ.** ⭐ `materialsWithReferences()` **phục vụ CẢ `deleteUnusedMaterials` (⚠️ XOÁ CỨNG)** ⚠️ — ⭐ nếu tôi **chỉ sửa chỗ 500** mà ⛔ không đọc người dùng khác, ⭐ **tôi có thể đã tạo rủi ro MẤT DỮ LIỆU** ✓
3. ⭐⭐⭐ **KIỂM RỦI RO CỦA BẢN VÁ, ⛔ KHÔNG CHỈ KIỂM «LỖI ĐÃ HẾT».** ⭐ Tôi hỏi: ⭐ **«bỏ subquery thì `merged` thành gì, và điều đó ảnh hưởng AI?»** ⚠️ ⇒ ⭐ **mới phát hiện đường tới `hardDeleteMaterial`** ✓
4. ⭐⭐ **`0` CÓ THỂ LÀ SỰ THẬT, ⛔ KHÔNG PHẢI WORKAROUND.** ⭐ Vì **cột chưa bao giờ tồn tại** ⇒ **`merged` luôn 0** ⇒ ⭐ **`0` phản ánh đúng dữ liệu** ✓ — ⭐ **khác hẳn «bịa giá trị để né lỗi»** ✓
5. ⭐⭐ **ĐO 5 CÁCH ĐỘC LẬP TRƯỚC KHI KẾT LUẬN «CỘT KHÔNG TỒN TẠI»** ✓ (⭐ và **lần thứ 5 vẫn = 0**) ✓
6. ⭐ **SỬA 1 DÒNG NHƯNG CHÚ THÍCH 25 DÒNG** — ⭐ **để phiên sau ⛔ không đoán lại từ đầu** ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **170 đường**, hỗn hợp 2 phiên.
⭐⭐⭐ **NAY 9 BẢN VÁ SẴN SÀNG** — ⭐ **chỉ còn 1 lệnh của bạn**:
```bash
node tools/deploy-java-backend.mjs --dong-y-trien-khai
```
⛔ **Cần user quyết** (⭐ tôi **đã hỏi 4 câu qua kênh thông báo** ⚠️ **⛔ chưa có trả lời**):
1. ⭐⭐⭐ **TRIỂN KHAI 9 BẢN VÁ** ✓
2. ⭐⭐⭐ **CHO PHÉP DỌN TRANSIT** ✓
3. ⭐⭐ **TỒN Ở `KHO-E2E-01` (48) + `WHTEAM` (5)** — giữ hay dọn? ✓
4. ⭐⭐ **CHO PHÉP DỌN 570 QUYỀN MỒ CÔI** ✓
5. ⭐⭐ **CÂU HỎI NGHIỆP VỤ**: xoá nhân sự thì **giữ** hồ sơ HR / HĐLĐ / bảo hiểm không? ✓
6. ⭐⭐⭐ **XÁC NHẬN BẰNG MẮT** — 2 modal, tab đã đều chưa ✓
7. ⭐ **Commit theo NHÓM** ✓
