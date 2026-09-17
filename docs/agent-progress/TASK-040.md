# TASK-040 — LỚP LỖI: 26 câu lệnh SQL trong Java ghi CỘT KHÔNG TỒN TẠI (⇒ HTTP 500 lúc chạy)

**Trạng thái:** CONFIRMED — đăng ký khuyết điểm, sửa theo từng nhóm có kiểm chứng
**Nguồn phát hiện:** công cụ mới `tools/probe-java-sql-schema.mjs` (đối chiếu SQL của Java với lược đồ thật)
**Ngày:** 18/09/2026

---

## 1. Vì sao TASK-039 dẫn tới phát hiện này

TASK-039 cho thấy một LỚP lỗi: câu lệnh Java tham chiếu cột/bảng **không tồn tại** ⇒ action trả **HTTP 500**
lúc chạy, trong khi **biên dịch sạch và mọi cổng tĩnh đều "xanh"**. Đã viết công cụ bắt **cả lớp** đó thay
vì chờ người dùng bấm vào từng chức năng.

## 2. Cách làm (`tools/probe-java-sql-schema.mjs`)

1. Đọc lược đồ **MySQL thật** từ `db/migration/V*.sql` (chính là 16 migration Flyway mà server đang chạy —
   log khởi động xác nhận `validated 16 migrations`): **120 bảng · 1543 cột**.
2. Đọc **thêm** lược đồ `drizzle/` (SQLite — nguồn của JS): **119 bảng** (vì JS chạy SQLite còn Java chạy MySQL
   ⇒ phải phân biệt *lỗi mã* với *lệch lược đồ giữa hai backend*).
3. Quét **97 tệp Java**, trích SQL tĩnh (bỏ câu lệnh động có `%s`/`${}`/ghép chuỗi), rồi kiểm:
   * `INSERT INTO t (c1,c2,…)` → bảng tồn tại? **mọi cột** tồn tại?
   * `UPDATE t SET c1=?,c2=?` → bảng + **mọi cột**?
4. **Phân loại từng phát hiện** đối chiếu **cả hai** lược đồ.

## 3. Kết quả

```
Lược đồ: 16 tệp migration · 120 bảng · 1543 cột   (MySQL/Flyway)
Lược đồ drizzle: 119 bảng                          (SQLite — nguồn của JS)
Tệp Java đã quét: 97

Phân loại:
   26  LỖI MÃ: cột không có ở CẢ HAI lược đồ
    0  LỆCH LƯỢC ĐỒ (có ở drizzle, thiếu ở MySQL)
    0  BẢNG KHÔNG TỒN TẠI
```

⇒ **Cả 26 đều là lỗi mã** (không phải chuyện lệch lược đồ giữa hai backend). Mỗi câu lệnh như vậy sẽ ném
`Unknown column` ⇒ **HTTP 500** khi người dùng/admin bấm đúng chức năng đó.

## 4. Danh sách đầy đủ (26 câu lệnh, 7 tệp)

| Tệp: dòng | Bảng | Cột Java ghi (KHÔNG tồn tại) |
|---|---|---|
| `AdminOpsStoreAdapter.java:82` | `approval_email_recipients` | `user_email`, `cc_emails`, `updated_by` |
| `MaterialCatalogStoreAdapter.java:269` | `materials` | `is_component`, `created_by` |
| `MaterialCatalogStoreAdapter.java:291` | `material_norms` | `name`, `unit_rate`, `scope_project_id`, `description` |
| `MaterialCatalogStoreAdapter.java:301` | `material_norms` | `name`, `unit_rate`, `description` |
| `MaterialCatalogStoreAdapter.java:308` | `material_norms` | `approved_by`, `approved_at` |
| `ProductionStoreAdapter.java:309` | `team_subcontracts` | `settlement_id`, `settled_at` |
| `SystemSettingsStoreAdapter.java:118` | `vntech_license_installations` | `license_key`, `company_name`, `edition`, `activated_by`, `activated_at`, `created_at` |
| `SystemSettingsStoreAdapter.java:136` | `vntech_license_transfer_requests` | `to_company_name`, `created_at` |
| `UserAdminStoreAdapter.java:316` | `system_level_catalog` | `level_rank` |
| `WarehouseStockStoreAdapter.java:344` | `stock_issue_items` | `status` |

## 5. Kiểm chứng bộ phân tích (không buộc tội sai)

Đối chiếu DDL thật của 5 bảng, khớp hoàn toàn với kết luận của công cụ:

| Bảng | DDL thật | Kết luận |
|---|---|---|
| `approval_email_recipients` | `id · project_id · stage · emails · active · created_at · updated_at` — **giống hệt nhau ở CẢ drizzle và Flyway** | Java ghi 3 cột không có ở đâu ✅ |
| `stock_issue_items` | `id · issue_id · material_id · request_item_id · quantity · installed_qty · work_package_code · installation_area · created_at · updated_at · contract_id` | **không có `status`** ✅ |
| `vntech_license_transfer_requests` | `id · license_id · source_machine_fingerprint · destination_machine_fingerprint · recovery_code_hash · reason · status · requested_by · requested_at · approved_at · completed_at · detail_json` | **không có `to_company_name`/`created_at`** ✅ |
| `material_norms` | `id · norm_code · project_id · subcategory_id · item_name · material_id · base_uom · quantity_per_unit · unit · source_component_id · source_type · notes · status · active · created_by · created_at · updated_at` | **không có `name`/`unit_rate`/`scope_project_id`/`description`/`approved_by`/`approved_at`** ✅ |
| `system_level_catalog` | `id · code · name · description · **rank** · auto_grant_all · can_skip_levels · active · sort_order · created_at · updated_at` | Java ghi `level_rank`, cột thật là **`rank`** ✅ |

## 6. Bản sửa ĐÚNG đã xác định được từ nguồn sự thật JS (`scripts/system-route.mjs`)

| Bảng | JS viết | Ghi chú |
|---|---|---|
| `approval_email_recipients` | `INSERT (id,project_id,stage,emails,active,created_at,updated_at)` — **một** cột `emails` (đã gộp) | Java tách thành `user_email` + `cc_emails` ⇒ phải **gộp lại một cột `emails`** đúng như JS |
| `material_norms` | `INSERT (id,norm_code,project_id,subcategory_id,item_name,material_id,base_uom,quantity_per_unit,unit,source_component_id,source_type,notes,status,active,created_by,created_at,updated_at)`<br>`UPDATE SET project_id=?,subcategory_id=?,item_name=?,material_id=?,base_uom=?,quantity_per_unit=?,unit=?,source_component_id=?,notes=?,updated_at=?`<br>ẩn/hiện: `SET active=?,status=CASE WHEN ? THEN 'active' ELSE 'inactive' END,updated_at=?` | JS **không có** khái niệm `approved_by`/`approved_at` ⇒ 2 cột đó là **bịa thêm**, không phải đổi tên |
| `stock_issue_items` | `UPDATE stock_issue_items SET installed_qty=installed_qty+?,updated_at=? WHERE id=?` | Java đang `SET status` — **sai cả cột lẫn nghiệp vụ** (JS cộng dồn `installed_qty`) |
| `system_level_catalog` | cột thật là `rank` | đổi `level_rank` → `rank` |

**Còn cần tra nguồn JS trước khi sửa:** `materials.is_component`/`created_by`, `team_subcontracts.settlement_id`/`settled_at`,
`vntech_license_installations.*`, `vntech_license_transfer_requests.to_company_name`.

## 7. Vì sao đây có thể là trạng thái CÓ SẴN từ lâu, không do phiên này

Các cột sai (`user_email`, `unit_rate`, `level_rank`, `scope_project_id`, `settlement_id`…) **không có ở bất kỳ
lược đồ nào** ⇒ đây là **port sai khi chuyển JS → Java**, không phải do thay đổi lược đồ gần đây. Chúng tồn tại
âm thầm vì **chưa ai bấm đúng chức năng đó** kể từ khi cutover.

## 8. Mức độ & hướng sửa

* **Mức độ: P1** (một số là P0 với admin) — mỗi câu lệnh là **một chức năng ghi bị hỏng hoàn toàn** (HTTP 500).
* **Cách sửa:** theo từng nhóm tệp, mỗi nhóm phải: (1) tra SQL tương ứng của JS, (2) sửa Java theo JS,
  (3) biên dịch + đóng gói + khởi động lại, (4) **gọi thật** và xác nhận **không còn 500** + **đọc lại** giá trị
  (đúng bài học TASK-039: kiểm "hết 500" là chưa đủ).
* **KHÔNG sửa bằng cách thêm cột vào MySQL** để chiều theo port sai — làm vậy là mở rộng lược đồ để hợp thức hoá
  lỗi và tạo lệch với SQLite/drizzle.

## 9. Files Changed

* `tools/probe-java-sql-schema.mjs` (mới) — công cụ bắt cả lớp lỗi + phân loại đối chiếu hai lược đồ
* `docs/agent-progress/TASK-040.md` (mới, tệp này), `TASK_INDEX.md`, `MASTER_STATUS.md`
* **Chưa sửa mã nguồn ở vòng này** — cần tra JS cho từng nhóm rồi mới sửa (xem mục 8).

## 10. Testing / Validation

| Phép kiểm | Kết quả |
|---|---|
| `node tools/probe-java-sql-schema.mjs` | phát hiện **26** mục; phân loại **26 lỗi mã / 0 lệch lược đồ / 0 bảng thiếu** |
| Đối chiếu DDL thật của 5 bảng | **khớp 5/5** kết luận của công cụ |
| Bộ phân tích bị nghi hụt → kiểm bằng chẩn đoán riêng | các bảng bị báo đều có 7–18 cột phân tích được ⇒ **không phải lỗi phân tích** |

## 11. Next Task

* Tra JS cho các bảng còn lại rồi sửa **theo nhóm tệp**, mỗi nhóm 1 lần kiểm chứng lúc chạy.
* Ưu tiên trước: `AdminOpsStoreAdapter` (`save_email_settings`) và `UserAdminStoreAdapter` (`level_rank`) —
  hai chỗ mà bản sửa đã xác định rõ ràng.

## 12. Continuation Notes

1. **Chạy lại `tools/probe-java-sql-schema.mjs` sau MỖI lần sửa SQL** — nó là cổng bắt cả lớp lỗi này.
2. Khi thêm/sửa SQL trong Java: **đối chiếu `db/migration/V*.sql`, KHÔNG đối chiếu `drizzle/`** — Java chạy MySQL.
   (Nhưng khi port từ JS thì phải đọc `drizzle/` + SQL của JS để hiểu nghiệp vụ.)
3. **Đừng thêm cột vào lược đồ** để làm cho câu lệnh chạy được khi cột đó là do port sai.
4. Nếu một bảng chỉ được tạo bằng `ALTER TABLE` mà không có `CREATE TABLE` trong tệp migration thì bộ phân tích
   sẽ tạo mục **rỗng cột** ⇒ sinh dương tính giả. Công cụ đã có phần **chẩn đoán số cột** để phát hiện việc này.
