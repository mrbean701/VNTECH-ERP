# TASK-189 — GO-LIVE ĐỢT 44: 🔧 **VÁ BUG-20261005-012** (HIGH) — `FIXED` + `VERIFIED (SQL + hồi quy)`, ⛔ **chưa VERIFIED end-to-end**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-012** — HIGH · `check_material_alias_conflicts` **hỏng 100%**, **UI đang gọi** |
| **Nguyên nhân gốc** | ⭐ **đã chứng minh ở TASK-188** — SQL vi phạm `ONLY_FULL_GROUP_BY` (MySQL **ERROR 1055**) |
| **Tệp sửa** | `java-backend/infrastructure/**/MaterialCatalogStoreAdapter.java` (**1 dòng SQL + 17 dòng chú thích**) |
| **Trạng thái** | ⭐ **`FIXED`** · ✅ **VERIFIED (SQL + hồi quy)** · ⛔ **CHƯA VERIFIED end-to-end** (cần triển khai) |
| **Vân tay** | ⛔ **không đổi** (`java-backend/` ngoài `ROOT_DIRS`) |

---

## ① ⭐ VÌ SAO VÁ NGAY (⛔ không chờ) — §2 + §9 + §12

| Căn cứ | |
|---|---|
| **§2** | «**BUG FIX được ưu tiên cao hơn** các công việc phát triển/chỉnh sửa UI thông thường» + «Không trì hoãn bug nếu bug có ảnh hưởng thực tế đến người dùng» |
| **§4** | **HIGH** — «chức năng quan trọng bị lỗi» ⇒ ⭐ **ưu tiên fix ngay** |
| **§12** | **`SMALL SAFE FIX`** — ⭐ **1 dòng SQL**, ⛔ không refactor gì |
| **§17** | ⭐ **vá mã nguồn ⛔ KHÔNG phải triển khai** ⇒ `:18081` (JAR 01/10) ⛔ **không bị đụng** ✓ |

⇒ ⭐⭐ **Điều kiện để vá ngay đã đủ**: **nguyên nhân đã chứng minh** (⛔ không phải giả thuyết) + **cách vá rõ ràng, nhỏ, an toàn** + **hồi quy kiểm được ngay** ✓

---

## ② 🔧 BẢN VÁ — **1 DÒNG SQL**

```diff
- SELECT a.alias_name AS aliasName, a.normalized_name AS normalizedName,
+ SELECT MIN(a.alias_name) AS aliasName, a.normalized_name AS normalizedName,
         GROUP_CONCAT(DISTINCT a.material_id) AS materialIds,
         COUNT(DISTINCT a.material_id) AS materialCount
  FROM material_aliases a WHERE a.active=1
  GROUP BY a.normalized_name HAVING COUNT(DISTINCT a.material_id)>1
```

⭐ **Vì sao `MIN()` và ⛔ không phải `ANY_VALUE()`**:
| | `MIN(a.alias_name)` | `ANY_VALUE(a.alias_name)` |
|---|---|---|
| Chuẩn SQL | ✅ **hàm gộp chuẩn** | ⚠️ **hàm riêng của MySQL** |
| Chạy trên H2 (test) | ✅ **được** | ⚠️ **không chắc** |
| Đổi ngữ nghĩa nhóm | ⛔ **không** | ⛔ không |

⭐ **Ngữ nghĩa giữ nguyên**: `GROUP BY a.normalized_name` ⛔ không đổi; mỗi nhóm vẫn là một `normalized_name` với **đầy đủ** `materialIds` + `materialCount`; `aliasName` chỉ là **một đại diện** của nhóm (danh sách xung đột vốn đã hiển thị `materialIds`) ✓

⭐ **Và 17 dòng chú thích** ghi rõ: lỗi cũ · mã lỗi MySQL · `sql_mode` đo được · vì sao chọn `MIN` · ⚠️ **vì sao H2 ⛔ không bắt được** ⇒ ⭐ phiên sau ⛔ **không lặp lại** ✓

---

## ③ ✅ KIỂM CHỨNG — **3 TẦNG, ⛔ KHÔNG NHẢY TẦNG NÀO**

### Tầng 1 — ⭐ **SQL trên MySQL THẬT** (phép đo QUYẾT ĐỊNH)
| Câu SQL | Kết quả |
|---|---|
| **CŨ** (`a.alias_name`) | ⛔ `ERROR 1055 (42000): … 'a.alias_name' … incompatible with sql_mode=only_full_group_by` |
| **MỚI** (`MIN(a.alias_name)`) | ✅ **EXIT=0 — CHẠY ĐƯỢC, ⛔ không lỗi** |

⇒ ⭐⭐ **Đúng câu SQL đã thất bại nay thành công** ⇒ **bản vá đúng ở tầng gốc** ✓

### Tầng 2 — **hồi quy backend**
```
Tests run: 19 · 38 · 13 · 86  →  156 test · 0 Failures · 0 Errors
BUILD SUCCESS · MVN_EXIT=0
```
✅ **156/156 · EXIT=0** — ⛔ không vỡ gì ✓

### Tầng 3 — ⛔ **end-to-end — CHƯA ĐẠT, VÀ TÔI ĐÃ ĐO ĐỂ CHỨNG MINH**
Chạy lại **đúng bài E2E đã phát hiện lỗi**:
```
KET QUA ĐO BAO PHỦ 30 ACTION CHƯA TEST: dat 28/30 · that bai 2
  ! check_material_alias_conflicts … ⛔ 500
  ! preview_material_dependencies … ⛔ 500
EXIT=1
```
⇒ ⭐⭐ **VẪN CÒN LỖI — và đó là ĐIỀU ĐÚNG PHẢI THẤY**: `:18081` đang chạy **JAR build 01/10** ⇒ ⭐ **bản vá ⛔ chưa lên sóng** ✓
⭐⭐ **TÔI ⛔ KHÔNG GIẢ ĐỊNH — TÔI ĐO ĐỂ CHỨNG MINH** điều đó ✓

---

## ④ ⭐ TRẠNG THÁI TRUNG THỰC (§17) — ⛔ KHÔNG TUYÊN BỐ `VERIFIED`

```text
REPORTED → INVESTIGATING → FIXING → TESTING → FIXED → ⛔ (VERIFIED end-to-end)
   ✅          ✅             ✅        ✅        ✅          ⛔ CHƯA
```

| Tầng kiểm | Trạng thái |
|---|---|
| Nguyên nhân gốc | ✅ **đã chứng minh** (SQL 1055 + `sql_mode` đo được) |
| SQL trên MySQL thật | ✅ **ĐẠT** |
| Hồi quy `mvn -o test` | ✅ **156/156 · EXIT=0** |
| **End-to-end trên `:18081`** | ⛔ **CHƯA** — ⭐ **cần triển khai** |

⇒ ⭐⭐ **TÔI TUYÊN BỐ `FIXED` + `VERIFIED (SQL + hồi quy)`, ⛔ TUYỆT ĐỐI ⛔ KHÔNG TUYÊN BỐ `VERIFIED` trọn vẹn** ✓ — ⭐ vì **§17**: «một bug chỉ được `VERIFIED` **khi đã test/kiểm tra lại**», và tầng **quan trọng nhất (người dùng thật)** ⛔ **chưa kiểm được** ✓

---

## ⑤ 🐞 BUG-20261005-013 — ⛔ **CHƯA VÁ**, VÀ ⛔ **TÔI ⛔ KHÔNG TỰ QUYẾT**

| | |
|---|---|
| Nguyên nhân gốc | ✅ **đã chứng minh** — cột `materials.code_merge_into_id` **chưa bao giờ tồn tại** (SQL 1054) |
| Vì sao ⛔ không vá ngay | ⭐ **cần QUYẾT ĐỊNH THIẾT KẾ**, ⛔ không phải sửa lỗi: **A** tạo migration (hoàn thiện tính năng gộp mã vật tư) hay **B** bỏ dòng con `mergedFrom` (mất thông tin «đã gộp từ») |
| ⛔ Vì sao ⛔ không dùng «workaround» | ⭐ Nếu tôi thay bằng `0 AS mergedFrom` thì action **hết 500** nhưng ⭐ **che mất việc tính năng gộp mã CHƯA ĐƯỢC XÂY** ⇒ ⛔ **trái §3** («⛔ không dùng workaround để che giấu bug») ✓ |
| Mức | **MEDIUM** (UI ⛔ không gọi) ⇒ ⭐ **đúng §4: vào HOTFIX QUEUE** ✓ |

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| **BUG-20261005-012** | ⭐ **`FIXED`** · ✅ **VERIFIED (SQL + hồi quy)** · ⛔ **chưa VERIFIED end-to-end** |
| Bản vá | **1 dòng SQL** + 17 dòng chú thích |
| SQL cũ vs mới trên MySQL | ⛔ `ERROR 1055` → ✅ **EXIT=0** |
| Hồi quy | ✅ **156/156 · 0 fail · 0 error · EXIT=0** |
| E2E | ⛔ **vẫn 28/30** — ⭐ **đã ĐO để chứng minh bản vá chưa lên sóng** |
| **BUG-20261005-013** | ⛔ **chưa vá** (cần user quyết A/B) · ⛔ **không dùng workaround** |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ ⭐ **nay có 6 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑦ BÀI HỌC

1. ⭐⭐ **VÁ MÃ NGUỒN ⛔ KHÔNG PHẢI TRIỂN KHAI — và biết rõ điều đó cho phép vá NGAY mà ⛔ không vi phạm cam kết.** ⭐ Tôi đã cam kết ⛔ không **triển khai** khi chưa có mắt người — ⛔ **không** cam kết ⛔ không **sửa mã** ✓ §2 nói rõ **bug fix là ưu tiên** ✓
2. ⭐⭐ **KIỂM CHỨNG PHẢI ĐI TỪ TẦNG GỐC RA.** Tầng 1 (**SQL trên MySQL thật**) là tầng **quyết định** — ⭐ nếu chỉ chạy `mvn -o test` thì ⛔ **156/156 ĐẠT mà lỗi vẫn còn nguyên** ✓
3. ⭐⭐ **ĐO ĐỂ CHỨNG MINH «CHƯA LÊN SÓNG», ⛔ ĐỪNG GIẢ ĐỊNH.** Tôi **chạy lại bài E2E** và thấy **vẫn 28/30** ⇒ ⭐ **bằng chứng** rằng JAR đang chạy ⛔ không có bản vá ✓
4. ⭐⭐ **`FIXED` ⛔ KHÔNG ĐỒNG NGHĨA `VERIFIED`.** §17 đòi **test/kiểm tra lại** — mà tầng **quan trọng nhất (người dùng thật)** ⛔ chưa kiểm được ⇒ ⭐ **trạng thái trung thực là «FIXED + VERIFIED một phần»** ✓
5. ⭐ **⛔ KHÔNG WORKAROUND ĐỂ CHE TÍNH NĂNG CHƯA XÂY.** Với BUG-013 tôi **có thể** làm hết 500 bằng `0 AS mergedFrom` — ⭐ **nhưng ⛔ không làm**, vì nó **che mất** việc tính năng gộp mã **chưa được xây** ⇒ ⛔ trái §3 ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **136 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **nay 6 bản vá** (5 cũ + **BUG-20261005-012**) · ⭐ **sau triển khai tôi chạy lại bài E2E để `VERIFY` end-to-end** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
3. ⭐ **Xác nhận 5 bản vá CSS bằng mắt**.
4. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
5. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
