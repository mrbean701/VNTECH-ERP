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

---

# 13. NHÓM 1 + 1b — `save_email_settings` (ĐÃ SỬA + ĐÃ KIỂM CHỨNG LÚC CHẠY)

**Ngày:** 17/09/2026 · **Trạng thái:** DONE (có bằng chứng lúc chạy)

## 13.1 Nhóm 1 — lỗi SQL (đường GHI)

`AdminOpsStoreAdapter.insertApprovalRecipient` ghi `user_email`, `cc_emails`, `updated_by` — **cả ba cột này
không tồn tại** (drizzle `0004` và `V1__baseline` chỉ có **một** cột `emails`) ⇒ `Unknown column` ⇒ HTTP 500.

**Sửa:** port nguyên trạng JS (`scripts/system-route.mjs:1615`) — một cột `emails`, `active=1`, có `created_at`/`updated_at`.

**Phát hiện thêm:** tiền tố id Java đặt `AREC` trong khi JS dùng `MAILTO` ⇒ đổi về `MAILTO` cho khớp quy ước.

## 13.2 Nhóm 1 — hai lỗi ở ĐƯỜNG ĐỌC (nghiêm trọng ngang lỗi SQL)

UI đọc `data.emailSettings` và `data.emailRecipients` (`app/page.tsx:31`, `:3739`), nhưng bootstrap Java
**thiếu hẳn cả hai khoá**. Hệ quả: người quản trị lưu được cấu hình nhưng **mở lại màn hình thì trống** ⇒
tưởng mất cấu hình, và cột email người nhận theo dự án/bước **luôn rỗng**. Đây là dạng lỗi *ghi được mà không
bao giờ đọc lại* — lần thứ ba trong cùng một tính năng (sau TASK-039 `scope_key='GLOBAL'` và `settings_json`).

**Sửa:** thêm hai khoá vào `BootstrapDataAdapter`, đúng như JS `system-route.mjs:721-722`:
* `emailSettings` — **chỉ admin**, và **không bao giờ trả cột `password`**, chỉ cờ `passwordConfigured`
* `emailRecipients` — **chỉ admin**, không lọc theo dự án (`isAdmin(user) ? … : []`)

## 13.3 Nhóm 1b — bốn mặc định bị port sai (không phải SQL, nhưng cùng lớp "port không nguyên trạng")

| Trường | JS | Java (cũ) | Hệ quả |
|---|---|---|---|
| `smtpPort` | `Math.max(1, numberValue(p) \|\| 587)` | `max(1,…)` rồi mới so `==0` ⇒ **1** | Lưu cổng SMTP = 1 |
| `poSlaHours` | `Math.max(1, numberValue(p) \|\| 24)` | ⇒ **1** | PO quá hạn sau **1 giờ** thay vì 24 |
| `bchConfirmationSlaHours` | `Math.max(1, numberValue(p) \|\| 8)` | ⇒ **1** | BCH quá hạn sau **1 giờ** thay vì 8 |
| `baseUrl` | `.replace(/\/$/, "")` | giữ nguyên | URL trong email có `/` đôi |
| `senderEmail` (khi bật gửi) | đòi **email hợp lệ** (`emailsFrom().length`) | chỉ đòi **không rỗng** | Bật gửi mail với email rác |

Gốc chung: Java kẹp sàn `max(1, …)` **trước** rồi mới áp mặc định — sau `max` thì giá trị **không bao giờ bằng 0**
nên nhánh mặc định là **mã chết**. Phải áp mặc định trước, đúng thứ tự toán hạng của JS.

## 13.4 HƯ HẠI DỮ LIỆU THẬT do 3 mặc định sai (đã khôi phục)

Đối chiếu MySQL **trước khi vá**:

```
email_settings   : smtp_port = 1     (seed ghi 587; chỉ 2 nơi ghi cột này)
company_settings : po_sla_hours = 1  (DDL DEFAULT 24)
                   bch_confirmation_sla_hours = 1  (DDL DEFAULT 8)
```

Ba giá trị này **không phải do seed** (seed ghi 587, DDL mặc định 24/8) và **chỉ `save_email_settings`** là nơi
ghi được 2 cột SLA ⇒ **lỗi port đã âm thầm sửa hỏng cấu hình thật** ngay trên bản chạy. Probe đã đưa về đúng
thiết kế: `587 / 24 / 8`.

> ⚠ **CẦN NGƯỜI DÙNG XÁC NHẬN:** 24h (PO) và 8h (BCH) là **mặc định do mã JS quy định**, không phải con số
> nghiệp vụ do người dùng công bố. Nếu SLA thật khác, phải sửa lại bằng giao diện Quản trị.

## 13.5 Kiểm chứng lúc chạy (bắt buộc theo TASK-039 §"biên dịch sạch không chứng minh SQL đúng")

jar: **90.885.239 bytes** · API PID 13800 trên cổng 18081 · Flyway `validated 16 migrations` · log **0 ERROR**

| Công cụ | Kết quả |
|---|---|
| `node tools/probe-task040-nhom1.mjs` | **13/13 ĐẠT, exit 0** |
| `node tools/probe-task040-nhom1-authz.mjs` | **9/9 ĐẠT, exit 0** |
| `npm run test:regression` | **59/61 pass** (2 lỗi còn lại là TASK-031 và TASK-032 đã biết; **không phát sinh lỗi mới**) |
| MySQL sau khi vá | `smtp_port=587`, `po_sla_hours=24`, `bch_confirmation_sla_hours=8`, `base_url=NULL` |
| Bảng `approval_email_recipients` / `approval_project_assignments` | **0 / 5** dòng — đúng nguyên trạng ban đầu |

Chi tiết đáng chú ý của probe:
* lần gọi **thiếu** 3 trường số ⇒ `smtpPort` lưu **587** (trước là 1) và `baseUrl` `https://erp.vntech.local/` → lưu **không có `/` cuối**;
* ghi 1 người nhận tạm `probe.task040@vntech.local` ⇒ **đọc lại được qua bootstrap** với id `MAILTO_f953716a-…`;
* `nvdademo` (engine role `project`) gọi action ⇒ **HTTP 403**, `emailSettings=null`, `emailRecipients=[]`.

> **Bài học về tính trung thực của công cụ:** probe tự in ra dòng *"script KHÔNG tự kiểm DB"* — vì thiếu bước
> đối chiếu MySQL thì "13/13 ĐẠT" mới chỉ chứng minh **tầng HTTP**, chưa chứng minh **giá trị đã ghi đúng**.

## 13.6 Files Changed (nhóm 1 + 1b)

* `java-backend/application/.../port/out/AdminOpsStore.java`
* `java-backend/application/.../service/AdminOpsManagementUseCase.java` (SQL ⇒ đúng; 4 mặc định; validate email; `MAILTO`)
* `java-backend/infrastructure/.../persistence/AdminOpsStoreAdapter.java` (câu `INSERT` đúng lược đồ)
* `java-backend/infrastructure/.../persistence/BootstrapDataAdapter.java` (thêm `emailSettings`, `emailRecipients`)
* `tools/probe-task040-nhom1.mjs`, `tools/probe-task040-nhom1-authz.mjs`, `tools/_backup-task040-nhom1.sql` (mới)

## 13.7 Còn lại của TASK-040

Nhóm **2 → 6** (xem mục 6): `level_rank` → `rank`; `material_norms` 6 cột; `stock_issue_items` `SET status`;
`team_subcontracts.settlement_id`/`settled_at`; `vntech_license_*`. Mỗi nhóm phải chạy **đủ 4 bước** ở mục 8
và **kiểm cả đường đọc** — nhóm 1 cho thấy đường đọc cũng có thể thiếu y như câu lệnh SQL.

---

# 14. NHÓM 2 — KHÔNG PHẢI LỖI: CÔNG CỦA TÔI ĐÃ TỐ OAN MÃ ĐÚNG ❗

**Ngày:** 17/09/2026 · **Trạng thái:** nhóm 2 **ĐÓNG — không cần sửa mã**

## 14.1 Chuyện đã xảy ra

Trước khi sửa nhóm 2 (`UserAdminStoreAdapter`, bị báo `level_rank` là cột không tồn tại), tôi **đối chiếu
lược đồ MySQL đang chạy** thay vì tin báo cáo của công cụ:

```
information_schema.COLUMNS (system_level_catalog):
  id, code, name, description, level_rank, auto_grant_all, can_skip_levels, active, sort_order,
  created_at, updated_at                                    ← 11 cột, CÓ `level_rank`, KHÔNG có `rank`
```

⇒ `UserAdminStoreAdapter` dùng `level_rank` là **ĐÚNG**. Nếu tôi "sửa" theo báo cáo thì đã **phá mã đang đúng**.

## 14.2 Nguyên nhân gốc: `V11__rename_level_rank.sql` bị công cụ bỏ qua

| Tệp | Nội dung |
|---|---|
| `V10__dept_permissions_and_levels.sql:42` | tạo cột `` `rank` `` |
| **`V11__rename_level_rank.sql:24`** | `ALTER TABLE system_level_catalog CHANGE COLUMN rank level_rank int NOT NULL DEFAULT 0` |
| DB đang chạy | **`level_rank`** (đúng sau khi V11 chạy) |

`tools/probe-java-sql-schema.mjs` dựng lược đồ bằng cách đọc tệp `V*.sql` nhưng **chỉ áp dụng
`ALTER TABLE … ADD [COLUMN]`** — **không** áp dụng `CHANGE COLUMN` / `RENAME COLUMN` / `DROP COLUMN`.
Vì thế bản đồ lược đồ vẫn giữ tên cũ `rank` ⇒ cột `level_rank` bị coi là "không tồn tại".

## 14.3 Ba việc đã làm để chốt lại sự thật

1. **Vá công cụ cũ** (`probe-java-sql-schema.mjs`): áp dụng đủ `ADD` / `CHANGE` / `RENAME COLUMN … TO` / `DROP`
   + ghi rõ GIỚI HẠN ngay đầu tệp.
2. **Thêm công cụ mới `tools/probe-java-sql-live.mjs`**: đối chiếu SQL Java với **lược đồ MySQL ĐANG CHẠY**
   (kết xuất `tools/_live-schema.tsv` từ `information_schema`, **bắt buộc `--raw`** vì chế độ `--batch` mặc định
   escape tab thành `\t` làm hỏng tệp). Đây là nguồn sự thật của Java.
3. **Thêm `tools/probe-schema-drift.mjs`**: trả lời câu hỏi "tệp migration có tái lập được DB đang chạy không?".

## 14.4 Kết quả: hai phương pháp ĐỘC LẬP cùng ra một con số

| Phép đo | Trước khi vá công cụ | Sau khi vá |
|---|---|---|
| Công cụ đọc tệp migration | **26** | **22** |
| Công cụ đọc lược đồ đang chạy | *(chưa có)* | **22** |

⇒ 4 phát hiện dương tính giả (`system_level_catalog.level_rank`) đã bị loại, và hai phương pháp **hội tụ** —
đó là bằng chứng chéo cho việc 22 phát hiện còn lại là THẬT.

**Chứng thực chéo 6 bảng** (đối chiếu `information_schema` bằng tay): `material_norms` (17 cột thật —
`item_name`/`quantity_per_unit`/`notes`, **không** có `name`/`unit_rate`/`description`) · `materials`
(**không** có `is_component`/`created_by`) · `stock_issue_items` (có `installed_qty`, **không** có `status`) ·
`team_subcontracts` (**không** có `settlement_id`/`settled_at`) · `vntech_license_installations` (18 cột thật,
**không** có `license_key`/`company_name`/`edition`/`activated_by`/`activated_at`/`created_at`) ·
`vntech_license_transfer_requests` (**không** có `to_company_name`/`created_at`).

## 14.5 Tệp migration CÓ tái lập được DB đang chạy

`probe-schema-drift.mjs` → **0 lệch**: `120 bảng nghiệp vụ · 1543 cột` ở **cả hai** phía (khác biệt duy nhất
là `flyway_schema_history` — bảng sổ sách của chính Flyway, đã loại trừ tường minh). Nghĩa là: không có
`ALTER` tay nào ngoài Flyway, và các phát hiện SQL là **lỗi mã Java**, không phải chuyện lược đồ bị đổi ngoài luồng.

## 14.6 Bài học

> **Khi phép đo buộc tội mã nguồn, phải kiểm chính phép đo trước.** Một công cụ bỏ sót một cú pháp SQL
> (`CHANGE COLUMN`) đủ để biến mã đúng thành "lỗi", và nếu tôi tin nó thì đã sửa hỏng `level_rank`.
> Nguyên tắc rút ra: **đo trên trạng thái ĐANG CHẠY khi có thể**, và khi hai phương pháp độc lập cho kết quả
> khác nhau thì **chênh lệch đó mới là thông tin quan trọng nhất**.

---

# 15. NHÓM 3 — ĐỊNH MỨC VẬT TƯ + VẬT TƯ (ĐÃ SỬA + ĐÃ KIỂM CHỨNG LÚC CHẠY)

**Ngày:** 17/09/2026 · **Trạng thái:** DONE (11/11 phát hiện đã sạch; probe **25/25**)

## 15.1 Ba lớp lỗi trong cùng một tính năng (không chỉ lỗi cột)

| Lớp | Bản Java cũ | Nguồn sự thật JS | Hậu quả |
|---|---|---|---|
| **SQL** | ghi `name`, `unit_rate`, `scope_project_id`, `description`, `approved_by`, `approved_at` | `material_norms` chỉ có `item_name`, `quantity_per_unit`, `project_id`, `notes` | 6 cột không tồn tại ⇒ **HTTP 500** |
| **Payload** | đọc `name`/`unitRate`/`scopeProjectId`/`description` và **bắt buộc `normCode`** | UI gửi `itemName`/`quantityPerUnit`/`projectId`/`baseUom`/`subcategoryId`; JS **tự sinh** `DM-%04d` | Hỏng **ngay ở validate**, chưa tới SQL |
| **Nghiệp vụ** | `set_material_norm_status` đọc `status` (chuỗi) rồi ghi cột duyệt | UI gửi `{normId, active:0\|1}`; JS ghi `active` + `status='active'\|'inactive'` | Nút "Ẩn/Kích hoạt" **vô hiệu** |
| **Cột bỏ sót** | thiếu `subcategory_id`, `base_uom`, `source_component_id`, `source_type` | JS ghi đủ 17 cột, `source_type = sourceComponentId ? 'boq_component' : 'manual'` | Mất dữ liệu nguồn gốc |
| **Giá trị sai** | `status = 'pending'` | JS ghi `'active'` | Định mức mới tạo bị coi là chờ duyệt |
| **Đường ĐỌC** | bootstrap thiếu `source_type`/`source_component_id`/`created_by`/`createdByName` | JS `system-route.mjs:697` SELECT đủ + JOIN `users` | UI luôn hiện **"Thủ công"** dù dữ liệu đúng |
| **Đổi mã** | `updateNorm` **cập nhật cả `norm_code`** | JS **không** đổi `norm_code` khi sửa | Mã định mức bị đổi ngoài ý muốn |

> ⚠️ Đây là lần thứ **tư** trong dự án gặp dạng "ghi được mà không đọc ra" — và lần này **chính probe của tôi
> bắt được**: sau khi vá SQL + payload, probe vẫn báo 2 mục HỎNG (`sourceType = undefined`) ⇒ mới lộ ra
> đường đọc thiếu trường. Nếu chỉ kiểm "hết 500" thì đã kết luận xong và **bỏ sót**.

## 15.2 Đã sửa

* `MaterialCatalogStore` (port): `insertNorm` (13 tham số, đúng 17 cột JS), `updateNorm` (10 cột, **không** `norm_code`),
  `setNormStatus` → **`setNormActive(id, boolean, now)`**, thêm **`countNorms()`** để sinh `DM-%04d`;
  `importMaterialsBulk` **bỏ tham số `createdBy`** (cột `created_by` không tồn tại trong `materials`).
* `MaterialCatalogStoreAdapter`: 4 câu lệnh viết lại theo lược đồ thật.
* `MaterialCatalogManagementUseCase`: `saveMaterialNorm` + `setMaterialNormStatus` port nguyên trạng JS
  (payload, validate, sinh mã, thông điệp); chặn gắn định mức vào vật tư **đã ẩn** (`active=1` như JS).
* `BootstrapDataAdapter`: `materialNorms` thêm 4 trường còn thiếu + `LEFT JOIN users`.

## 15.3 Kiểm chứng lúc chạy

jar **90.886.141 bytes** (14:41:10) · API PID **37272** · Flyway `validated 16 migrations` · log **0 ERROR**

| Phép kiểm | Kết quả |
|---|---|
| `node tools/probe-task040-nhom3.mjs` | **25/25 ĐẠT — exit 0** |
| `probe-java-sql-live.mjs` | **22 → 11** phát hiện |
| `probe-java-sql-schema.mjs` (đã vá) | **22 → 11** phát hiện (hội tụ) |
| `material_norms` sau probe | **0 dòng** — đúng nguyên trạng ban đầu |

Nội dung probe (theo đúng payload form UI gửi, mọi giá trị là **chuỗi** như `FormData`): tạo → `DM-0001`,
`status='active'`, `source_type='manual'`; nhánh `sourceComponentId` → `'boq_component'`; sửa → `norm_code`
**không đổi**; `{normId, active:0}` → `active=false` + `status='inactive'`; `active:1` → `true`/`'active'`;
4 phép chặn nghiệp vụ trả **đúng nguyên văn** thông điệp JS; dọn dẹp về 0 dòng.

> **Bài học về phép kiểm của chính tôi:** bản probe đầu dùng `Number(active) === 0` — mà `Number(false) === 0`
> **luôn đúng**, nên phép kiểm có thể ĐẠT OAN. Đã siết thành so sánh nghiêm (`v === false`), vì payload
> bootstrap trả `active` là **boolean thật**, không phải số.

## 15.4 CÒN LẠI của nhóm 3 — nhóm 3b (port hành vi `import_material_catalog`)

Lỗi cột đã hết, nhưng khi tra UI tôi phát hiện **lệch hành vi chưa xử lý**:

* UI gửi mỗi dòng: `categoryCode, categoryName, subcategoryCode, subcategoryName, code, name, unit,
  specification, brand, standardPrice, minStock, requiresCocq, requiresMar`
  (`app/page.tsx:1909-1921`).
* Java đọc `row.get("categoryId")` / `row.get("subcategoryId")` — **khoá UI không bao giờ gửi** ⇒ mọi vật tư
  nhập vào đều **mất nhóm** (`category_id`/`subcategory_id` = NULL).
* JS (`system-route.mjs:2550-2606`) còn **tự tạo** `material_categories`/`material_subcategories` từ mã trong tệp,
  đặt `system = canonicalMeCode(category.code)`, `sort_order` 999/9999, mô tả `"Tạo từ file danh mục vật tư V5.0.0"`,
  và yêu cầu đủ **Mã + Tên + ĐVT** với thông điệp riêng.

⇒ Cần port đầy đủ `import_material_catalog` (kèm `canonicalMeCode`, `internalGroupCode`). **Chưa làm ở vòng này**
để không trộn một thay đổi lớn vào bản vá lỗi cột; đã ghi thành mục riêng.

---

# 16. NHÓM 4 — `confirm_installation`: PHÁT HIỆN THÊM MỘT LỚP LỖI MỚI (NGỮ NGHĨA)

**Ngày:** 17/09/2026 · **Trạng thái:** DONE

## 16.1 Lỗi thứ nhất: ghi cột không tồn tại

`WarehouseStockStoreAdapter.updateIssueItemStatusInstalled` ghi `stock_issue_items.status='installed'`.
Cột `status` **không tồn tại** (11 cột thật: `id, issue_id, material_id, request_item_id, quantity,
installed_qty, work_package_code, installation_area, created_at, updated_at, contract_id`) ⇒ HTTP 500.
Tệ hơn: nó chỉ chạy ở nhánh `installedQty + quantity >= issueQty` — tức **chỉ nổ ở lần xác nhận lắp CUỐI CÙNG**,
nên rất dễ lọt qua kiểm thử.

**JS có câu này không?** `confirm_installation` (scripts/system-route.mjs:1520) chỉ có 2 câu cộng dồn
`installed_qty` + 1 movement — **KHÔNG đánh dấu trạng thái ở đâu cả**. ⇒ Đây là **hành vi tự thêm**, nên cách
sửa đúng là **XOÁ**, không phải thêm cột vào MySQL cho khớp.

## 16.2 Lỗi thứ hai — lớp lỗi mà cổng lược đồ KHÔNG THỂ bắt

```
JS  (system-route.mjs:1520): UPDATE stock_issue_items SET installed_qty=installed_qty+?   ← CỘNG DỒN
Java (cũ, dòng 175)        : UPDATE stock_issue_items SET installed_qty=?                  ← GHI ĐÈ
```

Cột có thật ⇒ `probe-java-sql-live.mjs` **không báo gì**. Hậu quả: xác nhận lắp 3 rồi 4 ⇒ JS ra **7**,
Java ra **4** ⇒ **sai số liệu âm thầm**, không lỗi HTTP, không dòng log.

## 16.3 Công cụ mới: `tools/probe-increment-drift.mjs`

Săn đúng lớp lỗi này: trích các cột JS **cộng dồn** (`col = col + ?` / `col = COALESCE(col,0)+?`), suy ra bảng
từ câu `UPDATE … SET` gần nhất phía trước, rồi giao với các cột Java **ghi đè** (`col = ?`).

**Kết quả trên toàn kho Java:** JS cộng dồn **10 cột** · Java ghi đè 485 cột · **giao = 0 ứng viên** ⇒
không còn chỗ nào lệch ngữ nghĩa kiểu này.

**Đối chứng dương (bắt buộc, để công cụ không phải "luôn báo sạch"):** tệp
`tools/_old-adapter-positive-control.java.txt` chứa **nguyên văn** câu lệnh cũ. Quét kèm tệp đó bằng
`--extra-file` ⇒ công cụ **BÁO** `stock_issue_items.installed_qty`; quét cây hiện tại ⇒ **sạch**.
Không có bước này thì "0 ứng viên" không chứng minh được gì.

## 16.4 Đã sửa

* `updateIssueItemInstalled` → `SET installed_qty=installed_qty+?` (cộng dồn), kèm Javadoc ghi rõ tham số là
  **phần tăng thêm** chứ không phải giá trị mới.
* **Xoá** `updateIssueItemStatusInstalled` khỏi port + adapter + lời gọi trong use case.
* Xoá lời gọi thừa `updateIssueItemInstalled(item.id, 0, now)` sau khi tạo phiếu xuất — `insertStockIssue` đã ghi
  `installed_qty=0` ngay trong câu INSERT (đúng như JS `system-route.mjs:1511`), và với nghĩa cộng dồn thì
  gọi với `0` là vô nghĩa.

---

# 17. NHÓM 5 — `settle_subcontract` (ĐÃ SỬA)

`ProductionStoreAdapter.settleSubcontract` ghi `settlement_id=?` và `settled_at=?` — **cả hai không tồn tại**
trong `team_subcontracts` (15 cột thật) ⇒ HTTP 500.

JS (system-route.mjs:1250) chỉ có:
```sql
UPDATE team_subcontracts SET status='settled',updated_at=? WHERE id=?
```
Cột `settled_at` thật ra thuộc bảng `team_settlements` — và Java **đã ghi đúng** ở `insertTeamSettlement`
(cùng một transaction). Liên kết tới phiếu quyết toán nằm ở phía `team_settlements.subcontract_id`.

⇒ Bỏ `settlement_id`/`settled_at`; bỏ luôn tham số `settlementId` khỏi port (cột không có thì tham số cũng vô nghĩa).

---

# 18. NHÓM 6 — LỆCH **CẤU TRÚC**, KHÔNG PHẢI LỖI CỘT ⇒ CẦN QUYẾT ĐỊNH

**Trạng thái:** BLOCKED — cần người dùng quyết định (thuộc phần bảo mật đã yêu cầu tạm hoãn)

## 18.1 Java mô hình hoá license theo cách KHÁC HẲN JS

| | Java | JS |
|---|---|---|
| **Đầu vào** | `licenseKey`, `companyName`, `edition` | **`licenseEnvelope`** (chuỗi JSON) — UI `app/page.tsx:2642` gửi đúng tên này |
| **Xử lý** | không kiểm gì | `JSON.parse` (lỗi ⇒ *"Nội dung license không phải JSON hợp lệ."*) → `verifyLicenseEnvelope(envelope, {keyId, publicKeyPem, productId, tenantId, companyCode, machineFingerprint})` — **xác minh chữ ký số** |
| **Khi không hợp lệ** | — | ghi `vntech_trust_audit` event `LICENSE_REJECTED` rồi ném *"License không hợp lệ: &lt;lý do&gt;"* |
| **Ghi bảng** | `id, license_key, company_name, edition, status, activated_by, activated_at, created_at` | `id, license_id, tenant_id, company_code, product_id, key_id, payload_json, signature_base64, status='verified_development', valid_from, valid_until, machine_fingerprint, verification_detail_json, installed_by, installed_at, updated_at` |

`vntech_license_installations` có **18 cột thật**; **6 cột Java ghi không tồn tại** (`license_key`,
`company_name`, `edition`, `activated_by`, `activated_at`, `created_at`). Không có cột nào "đợi sẵn" để ánh xạ
`edition` hay `license_key` sang ⇒ **ánh xạ sẽ là bịa nghiệp vụ** (vi phạm GOAL §3).

Tương tự `request_license_transfer`: Java ghi `to_company_name`/`created_at` (không tồn tại) và `status='pending'`;
JS ghi `destination_machine_fingerprint`, `recovery_code_hash`, `status='requested'`, `requested_at`, `detail_json`.

## 18.2 Vì sao không tự sửa

Sửa đúng nghĩa là **port cả hệ license**: cấu trúc envelope, xác minh chữ ký bằng public key, trích `claims`,
ghi `vntech_trust_audit`. Đây là **hệ bảo mật/license**, mà người dùng đã yêu cầu **tạm bỏ qua phần bảo mật**.
Cách duy nhất không bịa là port đầy đủ — tức một hạng mục công việc riêng, không phải một dòng sửa.

**Đã ghi vào mục câu hỏi cần người dùng xác nhận.** Trong lúc chờ: 2 action này **giữ nguyên trạng thái hỏng**
(HTTP 500) — hỏng rõ ràng thì tốt hơn hỏng âm thầm; **KHÔNG** thêm cột vào MySQL để hợp thức hoá mô hình Java.

---

# 19. TỔNG KẾT TASK-040 ĐẾN ĐÂY

| Nhóm | Nội dung | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 + 1b | `save_email_settings` | **DONE** | probe 13/13 · authz 9/9 · DB 587/24/8 |
| 2 | `system_level_catalog.level_rank` | **ĐÓNG — dương tính giả** | hai công cụ hội tụ 22 |
| 3 | `material_norms` + `materials` | **DONE** | probe 25/25 · cổng 22→11 |
| 3b | `import_material_catalog` (hành vi) | **PENDING** — port lớn | UI gửi `categoryCode`, Java đọc `categoryId` |
| 4 | `stock_issue_items` (+ lỗi cộng dồn) | **DONE** | cổng 11→8 · `probe-increment-drift` 0 (có đối chứng dương) |
| 5 | `team_subcontracts` | **DONE** | cổng 11→8 |
| 6 | `vntech_license_*` | **BLOCKED** — lệch cấu trúc | cổng còn 8, xem mục 18 |

**Cổng lược đồ:** 26 → **8** (4 dương tính giả bị loại + 14 lỗi thật đã sửa).

## Bài học rút ra trong cả TASK-040

1. **Kiểm chính phép đo trước khi buộc tội mã nguồn** — một cú pháp SQL bị bỏ sót (`CHANGE COLUMN`) đủ để
   biến mã đúng thành "lỗi" (nhóm 2).
2. **Đo trên trạng thái ĐANG CHẠY khi có thể** — tệp migration và DB có thể lệch; DB mới là nguồn sự thật.
3. **"Biên dịch sạch" + "HTTP 200" + "cột tồn tại" đều KHÔNG đủ.** Ba lớp lỗi riêng biệt đã gặp: cột không tồn tại
   (bắt được bằng lược đồ), ghi sai cách (chỉ bắt được bằng đối chiếu ngữ nghĩa), và **đường ĐỌC thiếu** (chỉ bắt
   được bằng phép kiểm "ghi xong ĐỌC LẠI").
4. **Khi phép kiểm của chính mình báo ĐẠT, phải nghi phép kiểm** — 3 lần trong dự án, lỗi nằm ở phép đo
   (`Number(false)===0`; `active===1` vs boolean; lọc theo "VẬT TƯ"/"THIẾT BỊ" nhiễu).
5. **Công cụ luôn báo "sạch" thì vô dụng** — mọi cổng mới phải có **đối chứng dương** trên một lỗi đã biết.

---

# 20. KIỂM CHỨNG LÚC CHẠY NHÓM 4 + 5 (và MỘT LỖI CỦA CHÍNH TÔI)

**Ngày:** 17/09/2026 · jar **90.886.009 bytes** (14:55:00) · API PID **2872** · Flyway `validated 16 migrations` · log **0 ERROR**

## 20.1 Tầng SQL — chạy trong TRANSACTION rồi ROLLBACK (`tools/probe-task040-nhom45.sql`)

Hai action này **ghi dữ liệu kho/quyết toán thật**, nên thay vì gọi thẳng qua HTTP (phải tạo phiếu thật rồi dọn),
tôi chứng minh đúng thứ đã gây HTTP 500 và đúng nghĩa cộng dồn — mà **không đổi một dòng dữ liệu nào**:

| Phép kiểm | Kết quả |
|---|---|
| Câu CŨ `UPDATE stock_issue_items SET status='installed'` | ❌ `ERROR 1054: Unknown column 'status'` — **đúng nguyên nhân 500** |
| Câu CŨ `SET …,settlement_id=?,settled_at=?` | ❌ `ERROR 1054: Unknown column 'settlement_id'` — **đúng nguyên nhân 500** |
| Câu MỚI cộng dồn hai lần (3 rồi 4) trên dòng thật `SMII_01f4e94b…` (đầu 0, sl 5) | ✅ **7.0000** |
| Mô phỏng cách GHI ĐÈ của bản cũ trên cùng dòng | ✅ **4.0000** — chứng minh bản cũ **mất** phần 3 |
| Câu MỚI `settle_team_subcontract` | ✅ `status = settled` |
| Sau `ROLLBACK` | ✅ **5 dòng / 0 dòng · installed về 0.0000** — nguyên trạng |

> ⚠ **GIỚI HẠN nói rõ:** đây KHÔNG phải phép kiểm end-to-end. Nó chứng minh SQL đúng lược đồ + đúng ngữ nghĩa,
> **không** chứng minh đường GHI chạy hết vòng. Việc bấm nút với dữ liệu thật vẫn cần người dùng test thủ công.

## 20.2 Tầng HTTP (`tools/probe-task040-nhom45.mjs`) — **9/9 ĐẠT, exit 0**

Mọi nhánh dưới đây **dừng TRƯỚC khi ghi**:

* `confirm_installation` dòng không tồn tại / `quantity=0` → 400 *"Dòng xác nhận lắp đặt không hợp lệ."*
* `quantity` vượt số lượng đã nhận → 400 *"Số lượng xác nhận lắp vượt số lượng tổ đội đã nhận."* (đúng nguyên văn JS)
* `settle_team_subcontract` mã sai → 400 *"Không có quyền quyết toán hợp đồng này."* (đúng nguyên văn JS)
* `nvdademo` (engine role `project`) gọi `confirm_installation` → **HTTP 403** (§7)

## 20.3 LỖI CỦA CHÍNH TÔI — tên action do tôi TỰ ĐOÁN

Bản đầu của probe gọi `settle_subcontract` — **tên này KHÔNG tồn tại**. Tôi suy nó từ tên phương thức
`settleSubcontract`. Java trả *"Action … chưa được triển khai trên backend Java (Strangler Fig)"* và tôi **suýt
kết luận sai** rằng nhóm 5 là **mã chết**.

Điều bắt được mâu thuẫn: công cụ mới `tools/probe-action-coverage-controller.mjs` báo **0 action thiếu `case`** —
trái hẳn với kết luận "chưa triển khai". Đối chiếu lại thì tên đúng là **`settle_team_subcontract`**
(JS `system-route.mjs:1249`, Java `SystemController:637`).

**Đã sửa:** chú thích sai trong `ProductionStoreAdapter`/`ProductionStore`, tên action trong probe, và ghi lại ở đây.
Commit **#50 đã ghi tên sai trong thông điệp** — không sửa lịch sử, mà ghi bản đính chính ở commit sau.

> **Bài học:** không suy TÊN ACTION từ tên phương thức. Tên action là dữ liệu giao kèo giữa UI ↔ API, phải tra
> trong `SystemController` (`case "…"`) hoặc JS (`action === "…"`).

## 20.4 Công cụ mới: `tools/probe-action-coverage-controller.mjs`

Đối chiếu ba tập: **Java phục vụ** (`case "…"` trong controller) · **JS có mã** (`action === "…"`) ·
**UI gọi** (`action("…")`).

```
Java phục vụ : 224   ·   JS có mã : 174   ·   UI gọi : 119
UI gọi mà Java THIẾU case      : 0   ✅
JS có mã mà Java THIẾU case    : 0   ✅
Java có case mà JS không có mã : 50  (trong đó 38 là tên chỉ mục SQL hợp lệ + 12 action Java-only đã biết)
```

⇒ **Không có action nào của UI bị thiếu ở backend Java** — củng cố kết luận TASK-038, nhưng lần này đo bằng
chính các nhánh `case` đang phục vụ request (các cổng cũ chỉ so với danh mục/thanh ghi RBAC).

## 20.5 PHÁT HIỆN DỮ LIỆU MỚI: 3/5 dòng xuất kho trỏ tới TỔ ĐỘI KHÔNG TỒN TẠI

Khi probe báo "dòng không hợp lệ" cho một dòng CÓ THẬT, tôi truy nguyên:

```
stock_issue_items: 5 dòng · join được stock_issues: 5 · join được teams: CHỈ 2
teams hiện có: 1 dòng (TEAM_8c1fecd9-…)
stock_issues đang trỏ tới 4 team khác nhau ⇒ 3 team không còn tồn tại
```

`findIssueItem` dùng `JOIN teams` (giống y JS) nên các dòng mồ côi bị loại ⇒ `confirm_installation` trả
*"Dòng xác nhận lắp đặt không hợp lệ."* **Mã đúng, dữ liệu sai.** Bảng `stock_issue_items` **không có khoá ngoại**
(nên không có gì chặn tham chiếu mồ côi). ⇒ Ghi thành **known issue**, KHÔNG tự xoá/sửa dữ liệu.
