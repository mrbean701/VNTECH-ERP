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
