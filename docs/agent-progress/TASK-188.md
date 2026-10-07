# TASK-188 — GO-LIVE ĐỢT 43: 🐞 **2 LỖI 500 — NGUYÊN NHÂN GỐC ĐÃ CHỨNG MINH BẰNG SQL TRỰC TIẾP**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Phát hiện khi** | ⭐ Đo bao phủ **30 action chưa test** ⇒ ⭐ **2 action trả HTTP 500** |
| **Mức độ** | **BUG-20261005-012 = HIGH** (UI đang gọi, hỏng 100%) · **BUG-20261005-013 = MEDIUM** (UI ⛔ không gọi) |
| **Trạng thái** | `INVESTIGATING` — ⭐ **nguyên nhân ĐÃ CHỨNG MINH**, ⛔ **chưa vá** |
| **Đã gửi** | ✅ **🚨 CẢNH BÁO §14** (2 lỗi + nguyên nhân gốc + bằng chứng) |

---

## ① ⭐ ĐO BAO PHỦ TOÀN THỂ — VÀ PHÁT HIỆN

Đối chiếu **259 `case`** trong `SystemController` với mọi bài E2E:
| | |
|---|---|
| ✅ có trong bài test | **171** |
| ⛔ chưa có | **88** — trong đó **39 là khoá ánh xạ lỗi MySQL** (`*_uidx*`, ⛔ **không phải action**) |
| ⇒ **action thật chưa test** | **49** |

⇒ ⭐ **BAO PHỦ THẬT = 171/220 = 78%** ⛔ **KHÔNG phải «gần xong»** như tôi ngụ ý ở TASK-186 ✓

⭐ Bài kiểm **30 action an toàn** trong 49 đó, tiêu chí: **gọi payload RỖNG ⇒ ⛔ không được 5xx + ⛔ không đổi trạng thái** ✓
**KẾT QUẢ**: **28/30 ĐẠT** · ⛔ **2 trả HTTP 500** · **hậu quả: ⛔ không action nào đổi mảng bootstrap nào** ✓

---

## ② 🐞 BUG-20261005-012 — `check_material_alias_conflicts` — **HIGH**

| | |
|---|---|
| **Module** | Danh mục vật tư (`material_catalog`) |
| **UI gọi?** | ⚠️ **CÓ** |
| **Phản hồi thật** | `{"ok":false,"status":500,"error":"Internal Server Error","path":"/api/system"}` (thân lỗi chuẩn Spring Boot) |
| **Tệp** | `MaterialCatalogStoreAdapter.aliasConflicts()` (**dòng ~299-305**) |

### ⭐ NGUYÊN NHÂN GỐC — CHẠY **ĐÚNG CÂU SQL CỦA STORE** TRÊN MySQL
```sql
SELECT a.alias_name AS aliasName, a.normalized_name AS normalizedName,
       GROUP_CONCAT(DISTINCT a.material_id) AS materialIds,
       COUNT(DISTINCT a.material_id) AS materialCount
FROM material_aliases a WHERE a.active=1
GROUP BY a.normalized_name HAVING COUNT(DISTINCT a.material_id)>1
```
```
ERROR 1055 (42000): Expression #1 of SELECT list is not in GROUP BY clause and contains
nonaggregated column 'vntech_erp.a.alias_name' … this is incompatible with sql_mode=only_full_group_by
```
⭐ Và MySQL thật **ĐANG BẬT** chế độ đó: `sql_mode` = **`ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION`** ✓

⇒ ⭐⭐ **`a.alias_name` ⛔ không nằm trong `GROUP BY` và ⛔ không phụ thuộc hàm** ⇒ **lỗi 1055** ⇒ `jdbcTemplate` ném lỗi ⇒ **500** ⇒ ⭐ **action HỎNG 100%, LUÔN LUÔN** (⛔ không phụ thuộc payload) ✓

### 🔧 HƯỚNG VÁ (⛔ chưa làm — chờ user)
`a.alias_name AS aliasName` → ⭐ **`MIN(a.alias_name) AS aliasName`**: **chuẩn SQL**, chạy được **cả MySQL lẫn H2**, ⛔ **không đổi ngữ nghĩa nhóm** (`GROUP BY a.normalized_name` giữ nguyên) ✓
ⓘ `ANY_VALUE()` cũng được nhưng ⚠️ **kém chuẩn hơn** (MySQL-specific) ⇒ ⭐ chọn `MIN` ✓

---

## ③ 🐞 BUG-20261005-013 — `preview_material_dependencies` — **MEDIUM**

| | |
|---|---|
| **UI gọi?** | ⛔ **KHÔNG** |
| **Phản hồi** | cùng `500 Internal Server Error` |
| **Tệp** | `MaterialCatalogStoreAdapter.materialsWithReferences()` — dòng con `(SELECT COUNT(*) FROM materials me WHERE me.code_merge_into_id=m.id) AS mergedFrom` |

### ⭐ NGUYÊN NHÂN GỐC — CHẠY **ĐÚNG CÂU SQL** TRÊN MySQL
```
ERROR 1054 (42S22): Unknown column 'me.code_merge_into_id' in 'where clause'
```
⭐ **KIỂM TIẾP (3 phép đo độc lập)**:
| Phép kiểm | Kết quả |
|---|---|
| `SHOW COLUMNS FROM materials LIKE 'code_merge_into_id'` | ⛔ **KHÔNG có** |
| Migration nào tạo cột đó? (`db/migration` + `drizzle`) | ⛔ **KHÔNG có** |
| `schema-h2.sql` (cả `main` lẫn `test`) có cột đó? | ⛔ **KHÔNG có** |

⇒ ⭐⭐⭐ **CỘT ĐÓ CHƯA BAO GIỜ TỒN TẠI** ⇒ `preview_material_dependencies` **chưa từng chạy được** ✓
⭐ Ngữ cảnh: `mergeMaterialMaster` (gộp mã vật tư) **có** trong UseCase nhưng **thiếu migration** ⇒ ⭐ **tính năng gộp mã vật tư là tính năng DỞ DANG** ✓

### 🔧 HƯỚNG VÁ — ⛔ **CẦN USER QUYẾT** (⛔ tôi ⛔ không tự bịa cột)
| Phương án | Hệ quả |
|---|---|
| **A. Tạo migration** thêm `materials.code_merge_into_id` | ⭐ hoàn thiện tính năng gộp mã — ⚠️ nhưng phải làm **cả** luồng ghi |
| **B. Bỏ dòng con `mergedFrom`** khỏi SQL | ⭐ hết 500 ngay — ⚠️ mất thông tin «đã gộp từ» (hiện ⛔ luôn lỗi nên ⛔ chưa ai dùng được) |

---

## ④ ⭐⭐ VÌ SAO TEST KHÔNG BẮT ĐƯỢC — **GIỚI HẠN TÔI ĐÃ GHI, NAY CÓ CA CỤ THỂ**

Tài liệu của tôi từ lâu ghi: *«**H2 dễ dãi hơn MySQL** ⇒ **cả một lớp lỗi NOT NULL/SQL ⛔ vô hình với test H2**»*.
⇒ ⭐⭐ **HÔM NAY CÓ CA CỤ THỂ**: `mvn -o test` **156/156 ĐẠT** ⛔ **mà cả 2 lỗi SQL này ⛔ không hề bị bắt** — vì H2 ⛔ **không có** `code_merge_into_id` nên **câu SQL đó ⛔ chưa bao giờ chạy trong test** ✓

⭐⭐ **BÀI HỌC LỚN**: ⛔ **test trên H2 ⛔ KHÔNG chứng minh SQL chạy được trên MySQL.** ⭐ **Cách duy nhất để biết: CHẠY THẬT trên MySQL** — ⭐ và đó chính là điều bài kiểm E2E của tôi vừa làm ✓

---

## ⑤ ✅ KIỂM HẬU QUẢ — **SẠCH** (và công cụ được cải tiến)

`chup-so-dong.mjs --sau` ⇒ **131 bảng · 12681 → 12686**: `sessions` **+2** (phiên của tôi) · `audit_logs` **+3** ⚠️
⭐ **TRA ĐÚNG 3 BẢN GHI ĐÓ**: `notification_log` · `notification_configs` · `director_pending_approvals` ⇒ ⭐ **đều là LỆNH ĐỌC CỦA TÔI ĐƯỢC GHI NHẬT KÝ** ✓
⇒ `audit_logs` là **sổ ghi vết CHỈ-THÊM**, mỗi lệnh gọi API (**kể cả lệnh đọc**) đều được ghi ⇒ ⛔ **không phải dấu hiệu hỏng dữ liệu** ✓
⭐ **VÀ tôi đã cải tiến công cụ**: `tools/e2e/chup-so-dong.mjs` nay **ghi chú cả `audit_logs`** (trước chỉ chú `sessions`) kèm hướng dẫn «đọc vài dòng mới nhất — `action` phải khớp đúng các action bạn vừa gọi» ✓

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Bao phủ action (đo toàn thể) | **171/220 = 78%** (259 `case` − 39 khoá lỗi MySQL) |
| Bài kiểm 30 action | **28/30 ĐẠT** · ⛔ **2 trả 500** |
| 🐞 **BUG-20261005-012** | **HIGH** — `check_material_alias_conflicts` **HỎNG 100%**, **UI đang gọi** · nguyên nhân gốc **đã chứng minh** (SQL 1055) |
| 🐞 **BUG-20261005-013** | **MEDIUM** — `preview_material_dependencies` hỏng 100%, ⛔ UI không gọi · nguyên nhân gốc **đã chứng minh** (SQL 1054, cột chưa từng tồn tại) |
| Đã gửi cảnh báo | ✅ **§14** |
| Kiểm hậu quả | ✅ **sạch** (`sessions` +2 phiên của tôi · `audit_logs` +3 là **nhật ký lệnh đọc**) |
| Công cụ cải tiến | ✅ `chup-so-dong.mjs` ghi chú thêm `audit_logs` |
| Bug sản phẩm mới | **2** (lần đầu sau ~10 vòng) |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** (+2 lỗi mới chưa vá) |

---

## ⑥ BÀI HỌC

1. ⭐⭐ **TEST TRÊN H2 ⛔ KHÔNG CHỨNG MINH SQL CHẠY ĐƯỢC TRÊN MySQL.** `mvn -o test` **156/156 ĐẠT** mà ⛔ **không bắt được 2 lỗi SQL này** — ⭐ **cách duy nhất là CHẠY THẬT**, và ⭐ **bài kiểm E2E vừa làm đúng điều đó** ✓
2. ⭐⭐ **CHẠY ĐÚNG CÂU SQL CỦA STORE TRÊN DB THẬT LÀ PHÉP ĐO QUYẾT ĐỊNH.** ⛔ Tôi **suýt** đoán «`Map.of` ném NPE» — ⭐ **chạy SQL thì ra ngay mã lỗi 1055/1054 kèm tên cột** ⇒ ⭐ **nguyên nhân gốc, ⛔ không phải giả thuyết** ✓
3. ⭐⭐ **«ĐO BAO PHỦ» LẦN THỨ BA LIÊN TIẾP TÌM RA VIỆC THẬT.** TASK-186 (**36 `save_*`**) · TASK-187 (**8 `set_*`**) · vòng này (**2 lỗi 500**) ⇒ ⭐ **phương pháp «đếm tổng rồi trừ» là công cụ, ⛔ không phải may mắn** ✓
4. ⭐ **`audit_logs` TĂNG LÀ ĐÚNG CHỨC NĂNG, ⛔ KHÔNG PHẢI HỎNG DỮ LIỆU** — ⭐ **nhưng vẫn phải TRA ĐÚNG bản ghi** ✓ (tôi đã tra: 3 dòng đều là lệnh đọc của mình) ✓
5. ⭐ **MỘT CÔNG CỤ KIỂM NÊN HỌC TỪ MỖI LẦN DÙNG.** Tôi **cải tiến `chup-so-dong.mjs`** để lần sau ⛔ không tốn công tra `audit_logs` nữa ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **136 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **BUG-20261005-012 (HIGH)** — cho phép vá `MIN(a.alias_name)`? ⭐ **nguyên nhân đã chứng minh, cách vá rõ ràng** ✓
2. ⭐⭐ **BUG-20261005-013 (MEDIUM)** — **phương án A** (tạo migration) hay **B** (bỏ `mergedFrom`)?
3. ⭐⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` — ⭐ **nên triển khai CHUNG với 2 bản vá mới** ✓
4. ⭐ **Xác nhận 5 bản vá CSS bằng mắt**.
5. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
6. ⭐ **19 action còn lại chưa test** (trong 49) — trong đó **16 bị loại trừ có lý do** (phá hoại/cấu hình).
7. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
