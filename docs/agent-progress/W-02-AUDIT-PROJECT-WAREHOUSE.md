# W-02 — AUDIT QUAN HỆ `Project : Warehouse` (xác nhận **1:N**)

- **Mã:** W-02 · **Ngày:** 20/09/2026 · **Roadmap:** `docs/25_TODO_ROADMAP.md` dòng `W-02` — nguyên văn
  *«Audit quan hệ **Project : Warehouse** — xác nhận 1:N»* · **dep:** `W-01`/`W-03` chờ kết luận này.
- **Phạm vi:** CHỈ ĐỌC. Audit này **không sửa** dòng nào của DB/schema/route. Ngoài phạm vi tệp được phép sửa
  (`drizzle/**`, `java-backend/**`, `scripts/**` đều bị CẤM trong đợt PHASE 5).
- **Tệp hợp đồng chạy được:** `tests/w02-project-warehouse-relation.test.mjs` (node --test).

## 0. KẾT LUẬN

> ## ✅ **CONFIRMED** — quan hệ `projects : warehouses` là **1 : N** (một dự án ↔ NHIỀU kho),
> > liên kết qua `warehouses.project_id` (FK **khai báo ở tầng drizzle**, **KHÔNG được Flyway/MySQL cưỡng chế**),
> > và `warehouses.project_id` **cho phép NULL** (kho không thuộc dự án nào — Kho Tổng).
> > **Đã đo được CẢ HAI chiều của 1:N trên dữ liệu thật**: `N=2` kho cho `PRJ-DEMO-01` (một `site` + một `team`)
> > **và** `N=0` kho dự án cho `KHO-TONG` (`project_id IS NULL`).
> > **Không có bất kỳ ràng buộc UNIQUE/1:1 nào trên `warehouses.project_id`** ở cả 5 nguồn đã quét.

**Ý nghĩa cho đợt này:** `W-02` **KHÔNG chặn** `W-03` — quan hệ 1:N nghĩa là dự án **không bắt buộc** phải có kho
(`N` có thể = 0), nên câu hỏi *«Tạo kho dự án?»* → chọn **Không** là trạng thái **hợp lệ** của mô hình,
không sinh dữ liệu mồ côi.

## 1. PHƯƠNG PHÁP (đo, không suy đoán)

| Bằng chứng | Nguồn | Cách đo |
|---|---|---|
| **Code (ORM)** | `drizzle/0000_sour_gamma_corps.sql:328-344` | đọc định nghĩa bảng + `FOREIGN KEY` |
| **Code (DB baseline)** | `java-backend/infrastructure/src/main/resources/db/migration/V1__baseline.sql:2209-2225` | đọc DDL MySQL |
| **Code (đường ĐỌC/route)** | `scripts/system-route.mjs:636,644,651,2404-2420,2438-2454` | đọc SQL + nhánh ghi |
| **Code (Java tương ứng)** | `java-backend/.../ProjectManagementUseCase.java:54-85` · `ProjectAdminStore.java:13-28` | đối chiếu song song |
| **DB (sự thật cuối)** | MySQL `vntech_erp` (localhost:3306) | `SHOW CREATE TABLE` · `information_schema` · `SELECT` |
| **Payload (đường ĐỌC thật)** | `GET /api/system` trên Java 18081 | đếm `warehouses[]` + `projectId` |

## 2. BẰNG CHỨNG CODE

### 2.1 Tầng drizzle — **CÓ** khai báo FK, và nó là FK *N:1* (⇒ 1 dự án : N kho)

`drizzle/0000_sour_gamma_corps.sql:328-344`:
```sql
CREATE TABLE `warehouses` (
	`id` text PRIMARY KEY NOT NULL,
	...
	`project_id` text,                                     -- :333   ← CHO PHÉP NULL
	...
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE no action,   -- :339
	FOREIGN KEY (`keeper_user_id`) REFERENCES `users`(`id`) ...
);
CREATE UNIQUE INDEX `warehouses_code_uidx` ON `warehouses` (`code`);      -- :343  UNIQUE trên CODE, KHÔNG phải project_id
CREATE INDEX `warehouses_project_idx` ON `warehouses` (`project_id`);     -- :344  INDEX thường (không UNIQUE) ⇒ N kho / 1 dự án
```
⇒ Ở tầng ORM/migration: FK nằm ở **cột con `project_id`**, **không có UNIQUE** ⇒ **1:N**, và NULL-able ⇒ **0..N**.

### 2.2 `V1__baseline.sql` — **BỎ** FK, chỉ còn INDEX

`java-backend/.../V1__baseline.sql:2209-2225`: cùng bảng, `project_id VARCHAR(64) NULL` (:2214),
`PRIMARY KEY (id)` (:2220), `UNIQUE warehouses_code_uidx (code)` (:2223), `INDEX warehouses_project_idx (project_id)` (:2225).
**Không có dòng `FOREIGN KEY` nào.** ⇒ Baseline MySQL **cố ý không cưỡng chế FK** (giống phần lớn 121 bảng của dự án),
nhưng **vẫn giữ index theo `project_id`** — tức đường ĐỌC theo dự án (`WHERE project_id=?`) là thiết kế chính thức,
và **INDEX thường (không UNIQUE) cũng chính là bằng chứng 1:N ở tầng schema**.

### 2.3 `scripts/system-route.mjs` — mọi truy cập đều theo `project_id`, và ghi thêm được NHIỀU kho cho 1 dự án

| Dòng | Đoạn | Nói lên điều gì |
|---|---|---|
| `:636` | `SELECT … FROM warehouses WHERE active=1 AND (project_id IS NULL OR project_id IN (…))` | kho được lọc **THEO TẬP dự án**; `project_id IS NULL` là kho dùng chung ⇒ quan hệ là **tuỳ chọn, 1 dự án → N kho** |
| `:644` | `transferWarehouses … LEFT JOIN projects p ON p.id=w.project_id` | đường ĐỌC thật của `warehouses[]` (kèm `projectId/projectCode`) — chính payload `W-04` dùng |
| `:651` | `projects p JOIN warehouses w ON … w.project_id=p.id AND w.type='site'` | một dự án JOIN ra **nhiều** dòng kho (không có `LIMIT 1`) |
| `:2404` | `SELECT id,code,name FROM warehouses WHERE project_id=? AND type='site' ORDER BY created_at LIMIT 1` | **`LIMIT 1`** là bằng chứng NGƯỢC lại 1:1: tác giả phải tự cắt lấy "kho site ĐẦU TIÊN" ⇒ biết trước là **có thể có nhiều** |
| `:2420`/`:2429`/`:2450`/`:2473` | `INSERT INTO warehouses (… ,"site", projectId, "WH-CENTRAL", …)` | cùng một `projectId` được INSERT ở 4 nhánh khác nhau (import dự án · import dự án mới · `create_project` · `update_project`) ⇒ nhiều dòng kho cùng `project_id` là đường dữ liệu **bình thường** |
| `:1634-1637` | `create_project_team` → `INSERT INTO warehouses (…,"team",projectId, site.id, …)` | **kho TỔ ĐỘI** cũng mang `project_id` của dự án ⇒ một dự án có **2 kho cùng lúc** (`site` + `team`) là luồng THẬT của hệ thống |

### 2.4 Tầng Java — cùng mô hình

- `ProjectManagementUseCase.java:54-59` — `store.insertProjectWithWarehouse(..., "KHO-"+code, "Kho công trường "+code, ...)`
  ⇒ `create_project` ghi **1 dự án + 1 kho site** (đúng như JS `:2448-2452`).
- `ProjectManagementUseCase.java:73-85` — `store.firstSiteWarehouse(projectId)` rồi chỉ UPDATE dòng đầu tiên,
  nhánh `else` mới `upsertSiteWarehouse` ⇒ tầng Java cũng phải xử lý trường hợp **nhiều kho site**.
- `ProjectAdminStore.java:13,24,28` — `insertProjectWithWarehouse(...)` · `upsertSiteWarehouse(projectId, …)` ·
  `firstSiteWarehouse(projectId)` ⇒ cổng ghi **theo `project_id`**, không có cổng 1:1 nào.
- `OpsTaskManagementUseCase.java:353-372` — tạo **kho tổ đội** với `project_id` của dự án (`teams.warehouse_id` NOT NULL)
  ⇒ củng cố: **N kho / 1 dự án**.

## 3. BẰNG CHỨNG CSDL THẬT (MySQL `vntech_erp`)

### 3.1 Schema THẬT

```
mysql> SHOW CREATE TABLE warehouses\G
CREATE TABLE `warehouses` (
  `id` varchar(64) NOT NULL, `code` varchar(64) NOT NULL, `name` text NOT NULL, `type` text NOT NULL,
  `project_id` varchar(64) DEFAULT NULL,          ← NULL được
  `parent_warehouse_id` varchar(64) DEFAULT NULL,
  `keeper_user_id` varchar(64) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL, `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `warehouses_code_uidx` (`code`),
  KEY `warehouses_project_idx` (`project_id`)      ← KEY thường, KHÔNG UNIQUE
) ENGINE=InnoDB
```
**Không có dòng `CONSTRAINT … FOREIGN KEY` nào** cho `project_id`:

```
mysql> SELECT constraint_name,column_name,referenced_table_name
       FROM information_schema.key_column_usage
       WHERE table_schema='vntech_erp' AND table_name='warehouses'
         AND referenced_table_name IS NOT NULL;
(0 dòng)
```

### 3.2 Dữ liệu THẬT — `4` dòng kho

```
mysql> SELECT id,code,name,type,project_id FROM warehouses;
WH_51e0f009-…  KHO-PRJ-DEMO-01      Kho công trường PRJ-DEMO-01        site    PRJ_fdbfab20-…  ┐ cùng 1 dự án
WHTEAM_3d658322-… TD-PRJ-DEMO-01-TD-01 Kho tổ đội · Tổ đội thi công số 1 team  PRJ_fdbfab20-…  ┘ ⇒ N=2
WH_dc5b5734-…  KHO-DA-MAU-01       Kho công trường DA-MAU-01          site    PRJ_cfba8c1a-…  ┐
WH-CENTRAL     KHO-TONG            Kho trung tâm                      central NULL            ┘ N=0 (không thuộc dự án)
```

| Phép đo | SQL | Kết quả |
|---|---|---|
| Tổng số kho | `SELECT COUNT(*) FROM warehouses` | **4** |
| Số dự án | `SELECT COUNT(*) FROM projects` | **2** |
| **Kho / dự án (chiều N>1 của 1:N)** | `SELECT p.code, COUNT(w.id) FROM projects p LEFT JOIN warehouses w ON w.project_id=p.id GROUP BY p.id` | `PRJ-DEMO-01 → 2` · `DA-MAU-01 → 1` |
| **Phân bố số kho trên mỗi dự án** | `… GROUP BY so_kho` | **`1 kho` × 1 dự án · `2 kho` × 1 dự án** — KHÔNG dự án nào có >1 nếu là 1:1 |
| Kho KHÔNG thuộc dự án | `SELECT code,type FROM warehouses WHERE project_id IS NULL` | `KHO-TONG` (`central`) ⇒ quan hệ **tuỳ chọn** |
| Kho CÓ gắn dự án | `SELECT COUNT(*) FROM warehouses WHERE project_id IS NOT NULL` | **3** |

### 3.3 Đối chứng âm của chính audit này (bắt buộc — nếu không có thì "1:N" chỉ là suy đoán)

| Đối chứng âm | Phép đo | Kết quả |
|---|---|---|
| **Không có UNIQUE trên `project_id`** (nếu có ⇒ là 1:1) | `SHOW CREATE TABLE warehouses` | chỉ `UNIQUE warehouses_code_uidx (code)`; `project_id` là `KEY` thường |
| **Không có UNIQUE trên `project_id` trong Flyway** | grep `drizzle/*.sql` `UNIQUE.*project_id` | các UNIQUE tìm thấy thuộc **bảng khác** (`user_project_scopes`, `document_sequences`, `boq_import_batches`, `approval_stages`…), **không** bảng `warehouses` |
| **Không có dòng kho nào vi phạm FK** (dữ liệu mồ côi) | `LEFT JOIN projects` | `PRJ-DEMO-01 → 2` · `DA-MAU-01 → 1` (không có nhóm `NULL` cho kho có `project_id`) |
| **Chiều N hiển thị được ở runtime, không chỉ DB** | `GET /api/system` (Java 18081, đăng nhập `admin`) | `warehouses` = **4** dòng, mang `projectId` (`WH-CENTRAL` có `projectId` rỗng/NULL) |

## 4. GIỚI HẠN — nói thẳng phần CHƯA chứng minh được

1. **FK KHÔNG được MySQL cưỡng chế.** `drizzle/0000` khai báo `FOREIGN KEY (project_id) REFERENCES projects(id)` nhưng
   `V1__baseline.sql` (và DB đang chạy) **chỉ có index**. Hệ quả THẬT: DB **cho phép** `warehouses.project_id` trỏ tới
   dự án không tồn tại; tính toàn vẹn do **tầng ứng dụng** giữ (`canAccessProject`, `firstSiteWarehouse`, các JOIN).
   ⇒ Kết luận **1:N** vẫn CONFIRMED (đó là *cardinality*, không phải *constraint*), nhưng **KHÔNG** được trích dẫn là
   «DB cưỡng chế FK».
2. **Không có ràng buộc "mỗi dự án BẮT BUỘC có ≥1 kho"** ở tầng DB. Ràng buộc đó chỉ *ngầm* tồn tại vì
   `create_project` luôn tạo kèm 1 kho site — chính vì vậy `W-03` mới cần **cho phép chọn Không** một cách tường minh
   (và mô hình 1:N vẫn hợp lệ khi `N=0`).
3. **Không kiểm chứng được `parent_warehouse_id`/`keeper_user_id`** là FK thật trên MySQL (cùng lý do §4.1) — driver
   của 2 cột này **ngoài phạm vi** `W-02` (chỉ hỏi Project : Warehouse).
4. **Số đo là ảnh chụp tại 20/09/2026** trên DB `vntech_erp` đang chạy (`warehouses`=4 · `projects`=2). Tệp test
   chạy lại **vẫn xác nhận cấu trúc/schema + code**; nếu DB seed thêm dòng thì **count sẽ đổi** ⇒ test phân loại
   đúng theo NGƯỠNG (xem §5), không khoá cứng con số vào một khẳng định sai.

## 5. HỢP ĐỒNG CHẠY ĐƯỢC (`tests/w02-project-warehouse-relation.test.mjs`)

| Ca | Khẳng định | Bằng chứng |
|---|---|---|
| W02-1 | Kết luận audit là **CONFIRMED**, có đủ 5 chữ ký bằng chứng | tệp audit (mục 0 + 2 + 3) |
| W02-2 | **Khai báo FK N:1+NULL-able** đúng nguyên văn ở `drizzle/0000` | `FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`)` + `` `project_id` text, `` |
| W02-3 | **Cấm UNIQUE trên `project_id`** ở mọi migration drizzle + ở `V1__baseline.sql` | quét 5 nguồn |
| W02-4 | DB THẬT: schema **không FK**, `project_id` NULL-able, `warehouses_code_uidx` UNIQUE trên `code`, `warehouses_project_idx` KEY thường | `information_schema` + `SHOW CREATE TABLE` |
| W02-5 | DB THẬT: `warehouses=4`, `projects=2`, **tồn tại dự án có ≥2 kho**, **tồn tại kho `project_id IS NULL`** | 4 câu SQL |
| W02-6 | Đối chứng âm dữ liệu: **không dòng mồ côi** (`project_id` không có trong `projects`) | `LEFT JOIN … WHERE p.id IS NULL` |
| W02-7 | Code THẬT của route đọc/ghi theo `project_id` (kể cả `LIMIT 1` và 4 nhánh INSERT + kho tổ đội) | `scripts/system-route.mjs` |
| W02-8 | Số đo DB chép trong tệp audit **khớp** số đo lại | đối chiếu tệp ↔ SQL |

> **Vì sao test KHÔNG hard-fail khi `mysql.exe` không chạy được:** đây là cổng *tài liệu hoá audit*, không phải cổng
> vận hành. Khi không kết nối được, test **in cảnh báo `BỎ QUA (không kết nối CSDL)`** cho các ca DB và **vẫn ép**
> ca tài liệu (W02-1…W02-3, W02-7, W02-8) phải ĐẠT — tức kết luận không thể "trôi" khỏi bằng chứng code.

## 6. ẢNH HƯỞNG XUỐNG `W-01` · `W-03` · `W-04`

- **`W-03`** (`Hỏi «Tạo kho dự án?» khi tạo dự án`) — **ĐƯỢC PHÉP thi hành**:
  quan hệ 1:N + NULL-able ⇒ `N=0` hợp lệ; action THẬT `create_project` (`scripts/system-route.mjs:2438`) **đã tồn tại**
  và đã INSERT cả `projects` + `warehouses` trong **1 batch** (`:2448-2452`) ⇒ chỉ cần cho nhánh ghi TÔN TRỌNG lựa chọn
  của người dùng, **KHÔNG thêm action/API mới**.
- **`W-01`** (5 mục menu KHO) — độc lập với audit này; không thêm khoá module, không migration.
- **`W-04`** (`Dashboard tồn kho` 8 chỉ số) — đường ĐỌC THẬT là `warehouses[]` (`:644`, có `projectId/projectCode`) và
  `inventory[]` (`:651`, JOIN `projects p JOIN warehouses w ON w.project_id=p.id`) ⇒ dashboard **phải** gom số theo
  `projectId` của TỪNG kho, chứ không được giả định mỗi dự án 1 kho (đúng hệ quả của kết luận 1:N ở đây).

---

## 🔄 CẬP NHẬT SỐ ĐO — 23/09/2026 (MT2-P14-03c)

Kết luận **CONFIRMED 1:N** ⛔ **KHÔNG đổi**. Chỉ **số dòng** thay đổi so với ảnh chụp 20/09/2026
(vì các task MT2 sau đó đã tạo thêm kho công trường trên DB `vntech_erp` đang chạy):

| Chỉ số | Truy vấn | Ảnh chụp 20/09 | **Đo lại 23/09** |
|---|---|---|---|
| Tổng số kho | `SELECT COUNT(*) FROM warehouses` | 4 | **6** |
| Tổng số dự án | `SELECT COUNT(*) FROM projects` | 2 | **2** |
| Kho CÓ gắn dự án | `... WHERE project_id IS NOT NULL` | 3 | **5** |
| Kho KHÔNG gắn dự án (Kho Tổng) | `... WHERE project_id IS NULL` | 1 | **1** |
| Dòng mồ côi | `LEFT JOIN projects … p.id IS NULL` | 0 | **0** |
| Dự án có ≥ 2 kho (chiều N>1) | `GROUP BY p.id` | `PRJ-DEMO-01 → 2` | vẫn `PRJ-DEMO-01 → 2` |

Lệnh đo lại (đúng cách tệp test đang dùng): `mysql.exe -uvntech -pvntech -N -B vntech_erp -e "…"`.
⇒ Hợp đồng `tests/w02-project-warehouse-relation.test.mjs` được cập nhật theo **số đo mới (6 · 2 · 5 · 0 mồ côi)**;
⛔ **KHÔNG** sửa dữ liệu DB để khớp tài liệu (GOAL §19).
