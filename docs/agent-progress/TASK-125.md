# TASK-125 — «ĐỐI TÁC» LÀ BẢNG RIÊNG (bảng + màn quản lý đối tác THẬT)

**Ngày:** 21/09/2026 · **Workdir:** `VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1_PROJECT_NAV_FINAL_FP_FIXED_20260908`
**Trạng thái:** DONE (phần CSDL + UI + đường JS) · **BLOCKED một phần**: đường LIVE (Java) chưa cập nhật vì lượt này **CẤM build/restart**.

## 1. Quyết định nguyên văn của người dùng (21/09/2026)

| # | Nguyên văn | Hệ quả kỹ thuật đã thi hành |
|---|---|---|
| ① | **«Đối tác là bảng riêng»** | Tạo bảng `partners` + màn `PartnerManager` **THẬT**; mục «Đối tác» **KHÔNG** còn mở chung `SupplierManager` |
| ② | **«Cho nhập dữ liệu»** | Được `INSERT`/`UPDATE` dữ liệu test ⇒ đã áp bảng lên MySQL `vntech_erp` + 3 dòng mẫu |
| ③ | **«Không cần gộp»** | Giữ nguyên 3 lối vào NCC: «Nhà cung cấp» · «Đối tác» · «Danh mục Nhà cung cấp» |

## 2. Hiện trạng ĐÃ ĐO trước khi làm (không đoán)

| Phép đo | Lệnh | Kết quả TRƯỚC |
|---|---|---|
| Bảng NCC | `SHOW CREATE TABLE suppliers` | 11 cột: `id varchar(64) PK` · `code varchar(64) UNIQUE` · `name text` · `tax_code` · `contact_name` · `phone` · `lead_time_days int` · `rating decimal(18,4)` · `active tinyint(1)` · `created_at datetime(3)` · `updated_at datetime(3)` |
| Số dòng NCC | `SELECT COUNT(*) FROM suppliers` | **2** |
| Bảng đối tác | `information_schema.tables LIKE 'partner%'` | **0** — chưa có bảng/cột đối tác |
| Quyền | `SELECT COUNT(*) FROM module_catalog` | **61** |
| Số bảng toàn lược đồ | `information_schema.tables` | **123** |
| Định dạng id | `SELECT id FROM suppliers` + `scripts/system-route.mjs:43` | `SUP_<uuid>` (`function id(prefix){return \`${prefix}_${crypto.randomUUID()}\`}`) |
| Bootstrap đọc bảng nào | grep `suppliers` trong `scripts/system-route.mjs` | ĐỌC `:678` (`suppliers`) · `:679` (`adminSuppliers`) · payload `:821` — tên trường `taxCode`/`contactName`/`phone`/`leadTimeDays`/`rating`/`active` |
| Migration gần nhất (drizzle) | `Get-ChildItem drizzle/*.sql \| Sort \| -Last 1` | `0164_phase_gd_master_108_110_r1_1_1_20260921_identity.sql` ⇒ tệp mới = **0165** |
| Migration gần nhất (Flyway) | `db/migration/` | `V22__ad14_audit_log_result.sql` ⇒ tệp mới = **V23** |
| Dịch vụ đang chạy (đo bằng `Win32_Process`) | — | `:8787` node `scripts/local-server.mjs` · `:9000` node `tools/cutover-proxy.mjs --api-port 18081` · `:18081` **java** `web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` ⇒ **đường API LIVE là JAVA** |

## 3. Bảng `partners` — cột thật, tệp migration, câu `CREATE TABLE`

**Tệp drizzle mới:** `drizzle/0165_task125_partners_table_identity.sql` (số thứ tự kế tiếp sau `0164`) — ADDITIVE 100 %.
**Tệp Flyway mới (chuỗi MySQL):** `java-backend/infrastructure/src/main/resources/db/migration/V23__partners_table.sql` (sau `V22`).

```sql
CREATE TABLE `partners` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`tax_code` text,
	`address` text,
	`contact_name` text,
	`contact_phone` text,
	`email` text,
	`partner_type` text DEFAULT 'supplier' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `partners_code_uidx` ON `partners` (`code`);
```

- **Khoá chính/định dạng id GIỐNG `suppliers`**: `id text PRIMARY KEY NOT NULL`, mã sinh bằng `id("PTR")` = `PTR_<uuid>` (đúng khuôn `id("SUP")`).
- ⛔ **0 câu** `DROP`/`ALTER`/`TRUNCATE`/`DELETE`; **0 chạm** bảng `suppliers`.

## 4. Áp bảng lên MySQL + dữ liệu mẫu (CÁCH LÀM)

**Cách làm:** *(a)* ghi 2 tệp migration (drizzle + Flyway) để hệ thống tự áp ở lần khởi động sau — **cơ chế có thật** (Java chạy Flyway lúc boot: `V1…V22` đã áp); *(b)* vì lượt này **CẤM start/stop/restart dịch vụ**, đã **áp NGAY** bằng `mysql.exe` (tài khoản `vntech`) đúng nguyên văn DDL của `V23`.
⚠️ **Bài học encoding:** lần áp đầu qua ống dẫn của PowerShell làm **hỏng dấu tiếng Việt** (`HEX(name)` = `43 C3 83 C2 B4 6E` = mojibake). Đã **sửa bằng `cmd /c "... < file.sql"`** (chuyển byte thô, không qua pipe) ⇒ `HEX(name)` = `43 C3 B4 6E 67` = `Công` **đúng**. Dùng `UPDATE` để sửa — **không** `DELETE` dòng nào.

```sql
-- 3 dòng mẫu (INSERT ... ON DUPLICATE KEY UPDATE)
INSERT INTO `partners` (`id`,`code`,`name`,`tax_code`,`address`,`contact_name`,`contact_phone`,`email`,`partner_type`,`status`,`active`,`created_at`,`updated_at`) VALUES
('PTR_T125_ALPHA','DT-T125-01','Công ty TNHH Đối tác Alpha','0312345678','12 Nguyễn Huệ, Quận 1, TP.HCM','Nguyễn Văn An','0901234567','an.alpha@example.com','supplier','active',1,NOW(3),NOW(3)),
('PTR_T125_BETA','DT-T125-02','Công ty CP Nhà thầu Beta','0398765432','45 Lê Lợi, Hải Châu, Đà Nẵng','Trần Thị Bình','0912345678','binh.beta@example.com','contractor','active',1,NOW(3),NOW(3)),
('PTR_T125_GAMMA','DT-T125-03','Công ty TNHH Tư vấn Gamma','0311222333','88 Trần Hưng Đạo, Hoàn Kiếm, Hà Nội','Lê Minh Cường','0987654321','cuong.gamma@example.com','consultant','inactive',0,NOW(3),NOW(3));
```

| Chỉ số | TRƯỚC | SAU | Δ |
|---|---|---|---|
| Bảng `partners` tồn tại | 0 | 1 | **+1** |
| Số bảng toàn lược đồ | 123 | **124** | **+1** (đúng 1 bảng mới) |
| Dòng `partners` | — (bảng chưa có) | **3** | +3 |
| Dòng `suppliers` | 2 | **2** | **0** (không chạm) |
| Dòng `module_catalog` | 61 | **61** | **0** (không thêm khoá mới) |

`HEX(LEFT(name,4))` sau khi sửa: `DT-T125-01 → 43C3B46E67` (`Công`) · `CHAR_LENGTH 26` / `LENGTH 31` ⇒ tiếng Việt lưu **đúng UTF-8**.

## 5. Màn mới + nối menu

| Việc | Tệp:dòng | Nội dung |
|---|---|---|
| Màn đối tác MỚI | `app/screens/PartnerManager.tsx` (mới, 1–72) | Bảng + thêm/sửa/xoá + **tìm kiếm** + `<Empty>`; **dùng lại NGUYÊN lớp CSS** `supplier-new-grid`/`supplier-admin-list`/`supplier-admin-row` ⇒ đồng bộ UI, 0 CSS mới |
| Import | `app/page.tsx:65` | `import { PartnerManager } from "@/app/screens/PartnerManager"` |
| Nối menu | `app/page.tsx:540` | `active === "dept_plan_suppliers" && supplierPartnerScreenView === "partner" && <PartnerManager data={data} action={action} />` + nhánh còn lại giữ `SupplierManager` cho `view !== "partner"` |
| Kiểu payload | `lib/ui-shared.tsx:196` | `AppData` thêm `partners: Row[]; adminPartners: Row[]` (chỉ THÊM) |

⇒ Mục menu **`dept_plan_partners`** (view `"partner"`) nay render **`PartnerManager`** — **KHÔNG** còn dùng chung `SupplierManager view="partner"`.
**Xác nhận 0 khoá `module_catalog` mới:** `dept_plan_partners` vẫn chỉ là **khoá tầng MENU CODE** trong `lib/menu-helpers.ts:190` với `permissionKeys: ["dept_plan_suppliers"]`; `module_catalog` = **61 → 61**; cổng quyền = **khoá CŨ** `dept_plan_suppliers` (action map sang khoá module sẵn có `supplier_catalog`).

## 6. Payload / backend — có phải sửa không? (tệp:dòng)

| Đường | Đã sửa? | Tệp:dòng | Ghi chú |
|---|---|---|---|
| **JS (`scripts/system-route.mjs`)** | **CÓ** (chỉ THÊM) | ĐỌC `:681-682` (`partners` + `adminPartners`) · payload `:824` (`partners, adminPartners,`) · action MỚI `:1340-1358` (`save_partner` · `set_partner_status` · `delete_partner`) · `ACTION_MODULE` `:16` + `ACTION_CAPABILITY` `:31` (khoá `supplier_catalog`, `canEdit`) | Không sửa câu `suppliers` nào |
| **Java (`BootstrapDataAdapter.java`)** | **CHƯA** | — | ⛔ Xem §8 BLOCKED |

## 7. ĐỎ → XANH (test hợp đồng `tests/partners-separate-table.test.mjs`)

**ĐỎ trước khi làm (exit 1):**
```
✖ ① Thiếu tệp migration …\drizzle\0165_task125_partners_table_identity.sql
✖ ④ AssertionError: Thiếu màn mới …\app\screens\PartnerManager.tsx
✖ ⑤ Error: ENOENT: no such file … app\screens\PartnerManager.tsx
[exit code: 1]
```
**XANH sau khi làm (exit 0):**
```
✔ TASK-125 ① có `CREATE TABLE partners` trong `drizzle/`
✔ TASK-125 ② migration CHỈ THÊM: 0 câu DROP/ALTER/TRUNCATE/DELETE
✔ TASK-125 ③ 0 khoá `module_catalog` MỚI (không có dòng `dept_plan_partners`)
✔ TASK-125 ④ màn mới tồn tại + menu `dept_plan_partners` render MÀN ĐỐI TÁC
✔ TASK-125 ⑤ KHÔNG bịa dữ liệu khi trống
ℹ tests 5 · pass 5 · fail 0
```

## 8. Cổng phải xanh (đã chạy, dán kết quả)

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit --incremental false` | **0 lỗi** (exit 0) |
| `npm run lint` | **0 error** · 189 warning (có sẵn từ trước, không phát sinh mới) |
| `npm run test:regression` | **69/69 ĐẠT · 0 HỎNG** |
| `npm run test:workflow` | **ĐẠT** — «Workflow VNTECH ERP V5.3.0 FULL W2 passed…» |
| `node --import tsx --test tests/partners-separate-table.test.mjs` | **5/5 ĐẠT** |
| `node --import tsx tests/t01-work-menu-probe.mjs` | **7 ĐẠT · 0 HỎNG** |
| `node tools/probe-project-screen.mjs` | **KẾT LUẬN: ĐẠT ✅** |

**ĐO LẠI LẦN 2 tại `HEAD = 13b2cde`** (sau khi cả 3 commit đã vào cây — bắt buộc, vì 2 commit `3be6013`/`ef6352b` do **phiên SONG SONG** thực hiện nên bản đã kiểm lần 1 chưa chắc là bản cuối):
`tsc` **0 lỗi** (exit 0) · `lint` **0 error**/189 warning (exit 0) · test mới **5/5** (exit 0) · `test:regression` **69/69 · 0 HỎNG** (exit 0) · `test:workflow` **ĐẠT** (exit 0) · `t01-work-menu-probe` **7 ĐẠT · 0 HỎNG** (exit 0) · `probe-project-screen` **ĐẠT ✅** (exit 0) ⇒ **7/7 cổng XANH trên đúng bản đã commit**.

## 9. BLOCKED (một phần) — đường LIVE là JAVA

**Đo được, không suy đoán:** proxy `:9000` chạy `tools/cutover-proxy.mjs --api-port 18081` ⇒ **mọi request API của UI đi vào Java `:18081`** (không đi vào `scripts/system-route.mjs`).

⇒ Vì lượt này **⛔ CẤM build · CẤM start/stop/restart** (`:8787`·`:9000`·`:18081` do captain quản lý), **đường Java CHƯA được sửa**; do đó trên UI LIVE hiện tại:
- payload Java **chưa có** khoá `partners` ⇒ màn đối tác hiện `<Empty>` (nói thật, không bịa);
- 3 action `save_partner`/`set_partner_status`/`delete_partner` **chưa có** `case` trong `SystemController` ⇒ bấm Lưu/Xoá sẽ báo *chưa được triển khai trên backend Java*.

**Việc cần captain quyết (đề xuất, chưa làm vì ngoài quyền lượt này):** cho phép sửa `java-backend/**` theo đúng khuôn `Supplier*` (`PartnerStore` port + `PartnerStoreAdapter` + `PartnerManagementUseCase` + bean + 3 `case` trong `SystemController` + 2 khoá đọc trong `BootstrapDataAdapter`) rồi **build lại + restart** `:18081` — bảng `partners` trong MySQL đã sẵn sàng nên sau restart là chạy được ngay.

## 10. Tệp đã đổi

| Tệp | Loại |
|---|---|
| `drizzle/0165_task125_partners_table_identity.sql` | MỚI (migration SQLite, ADDITIVE) |
| `java-backend/infrastructure/src/main/resources/db/migration/V23__partners_table.sql` | MỚI (migration MySQL/Flyway, ADDITIVE) |
| `app/screens/PartnerManager.tsx` | MỚI (màn CRUD đối tác) |
| `tests/partners-separate-table.test.mjs` | MỚI (test hợp đồng 5 điều kiện) |
| `docs/agent-progress/TASK-125.md` | MỚI (hồ sơ này) |
| `app/page.tsx` | SỬA 2 dòng (import + nhánh render `partner`) |
| `lib/ui-shared.tsx` | SỬA 1 dòng (2 trường `partners`/`adminPartners`) |
| `scripts/system-route.mjs` | SỬA (chỉ THÊM: 2 SELECT đọc, 2 khoá payload, 3 action, 2 map quyền) |

⛔ **Không** stage: `AGENTS.md` · `docs/28_*` · `.docx/.xlsx` · `tsconfig.tsbuildinfo` · `tools/baseline/**` · tệp định danh `VNTECH_*`.
