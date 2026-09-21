# TASK-127 — JAVA: đưa bảng `partners` vào payload bootstrap + 3 action ghi cho Đối tác (đường LIVE = Java `:18081`)

> Ngày: 21/09/2026 · Nhánh: `unity-p2-full-20260920` · Commit: `b89729e` (+ hồ sơ này)
> Bối cảnh: proxy `:9000` chạy `--api-port 18081` ⇒ mọi request API của UI đi vào **backend Java**
> (đo bằng Win32_Process ở TASK-125). Nhánh trước đã thêm `partners` ở `scripts/system-route.mjs`
> (stack Node — **KHÔNG phải đường LIVE**) ⇒ TASK-127 làm tương tự ở JAVA.

## 1. Phạm vi & ràng buộc

- **CHỈ THÊM** trong `java-backend/**`; ⛔ KHÔNG sửa `app/**`, `scripts/**`, `drizzle/**`, `AGENTS.md`,
  `docs/28_*`, `.docx/.xlsx`, `tools/baseline/**`, `docs/agent-progress/TASK-094…126.md`.
- ⛔ KHÔNG `INSERT/UPDATE/DELETE/ALTER/DROP` khi triển khai; bảng `partners` **đã có sẵn**
  (`drizzle/0165_task125_partners_table_identity.sql` + Flyway `java-backend/infrastructure/src/main/resources/db/migration/V23__partners_table.sql`)
  ⇒ **KHÔNG tạo migration mới**.
- ⛔ KHÔNG `package` (file jar đang bị khoá vì dịch vụ đang chạy) · ⛔ KHÔNG start/stop dịch vụ.
- Kết quả đo `git show --stat b89729e`: **7 tệp / 255 dòng THÊM / 0 dòng XOÁ** (thuần additive).

## 2. Đường ĐỌC mà UI dùng (đối chiếu trước khi đặt tên trường)

| Nơi | Bằng chứng |
| --- | --- |
| Màn Đối tác | `app/screens/PartnerManager.tsx:32` → `const rows = data.partners \|\| [];` |
| Trường mỗi dòng màn đọc | `PartnerManager.tsx:37` `row.code, row.name, row.taxCode, row.contactName, row.contactPhone, row.email`; `:66-77` `row.id / row.active / row.partnerType / row.address` |
| Kiểu payload | `lib/ui-shared.tsx:196` khai `partners: Row[]; adminPartners: Row[]` |
| Tiền lệ JS | `scripts/system-route.mjs:681-682` (chỉ đọc thêm, không sửa câu `suppliers`) |

## 3. Đã sửa / thêm gì (tệp:dòng)

### 3.1 Payload bootstrap — `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java:216-233`

- **Trước**: hết khối `suppliers`/`adminSuppliers` (dòng 208-214) là sang khối `inventory`; payload **KHÔNG có** `partners`.
- **Sau** (chèn ngay sau `adminSuppliers`, cùng chỗ cùng khuôn):
  - `partners` = `SELECT id,code,name,tax_code AS taxCode,address,contact_name AS contactName, contact_phone AS contactPhone,email,partner_type AS partnerType,status,active, created_at AS createdAt,updated_at AS updatedAt FROM partners WHERE active=1 ORDER BY code`
  - `adminPartners` = cùng câu nhưng `ORDER BY CASE WHEN active=1 THEN 0 ELSE 1 END,code` khi `admin`, **ngược lại chính danh sách `partners`** (giống JS `:682`).
- Câu `suppliers`/`adminSuppliers` **giữ nguyên từng byte** ⇒ 0 thay đổi hành vi cũ.
- Alias camelCase y hệt tiền lệ JS ⇒ tên trường khớp `PartnerManager.tsx`.

### 3.2 Tầng store/use-case (khuôn `Supplier*` — tệp MỚI)

| Tệp mới | Vai trò |
| --- | --- |
| `java-backend/application/src/main/java/com/vntech/erp/application/port/out/PartnerStore.java` | Port (khuôn `SupplierStore`): `partnerCodeExists` · `findPartner` · `insertPartner` · `updatePartner` · `setPartnerActive` · `deletePartner` |
| `java-backend/application/src/main/java/com/vntech/erp/application/service/PartnerManagementUseCase.java` | Use-case `savePartner` / `setPartnerStatus` / `deletePartner` (khuôn `SupplierManagementUseCase`, cùng kiểu trả `String message` + `AuthUseCase.ApiError` 400) |
| `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/PartnerStoreAdapter.java` | Adapter `JdbcTemplate` (khuôn `SupplierStoreAdapter`), SQL snake_case của bảng `partners`, `@Component` + `@Transactional` |

- Bean mới: `java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java:133-137` (`partnerManagementUseCase`), import tại `:24`, `:51`.
- ID sinh bằng `idGenerator.next("PTR")` — giống JS `id("PTR")` (`scripts/system-route.mjs:1350`).

### 3.3 Ba action MỚI — `java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java`

| Action | Dòng | Chặn quyền ở controller | Payload UI gửi (`PartnerManager.tsx`) |
| --- | --- | --- | --- |
| `save_partner` | `:1204-1208` | `requireCurrentUser` | `{code,name,taxCode,contactName,contactPhone,email,partnerType,address,partnerId?}` (`:45`) |
| `set_partner_status` | `:1209-1213` | `requireCurrentUser` | `{partnerId, active:0\|1}` (`:76`) |
| `delete_partner` | `:1214-1218` | `requireRequireAdmin` (khuôn `delete_supplier`) | `{partnerId}` (`:77`) |

- Trường mới: `:68` (field) · `:102` (tham số constructor) · `:124` (gán).
- Principal mới: `:1456-1461` `asPartnerPrincipal` (khuôn `asSupplierPrincipal`).
- `duplicateMessage`: `:1296` thêm `case "partners_code_uidx" -> "Mã đối tác";` ⇒ lỗi trùng mã trả **409** kèm thông báo đọc được (không phải 500 câm).
- 3 `case` cũ `save_supplier`/`set_supplier_status`/`delete_supplier` **giữ nguyên**; chỉ CHÈN 3 `case` mới vào sau `delete_supplier`.

### 3.4 RBAC — `java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java`

- Module (khoá **SẴN CÓ** `supplier_catalog` — không tạo khoá `module_catalog` mới): `:80` `delete_partner`, `:165` `save_partner`, `:196` `set_partner_status`.
- Capability (`canEdit`): `:274`, `:357`, `:388`.
- Khớp nguồn JS: `scripts/system-route.mjs:16` (ACTION_MODULE) và `:31` (ACTION_CAPABILITY).
- ⚠️ Nếu không khai, `RbacService.requireActionModule` **mặc định TỪ CHỐI** (PHASE 0B S-03, `RbacService.java:50-59`) ⇒ 3 action sẽ 403 với mọi user thường. Đã khai nên không còn 403.

## 4. Biên dịch (BẮT BUỘC — XANH)

Lệnh 1 (đúng lệnh được giao — chỉ phủ `application`):

```
cd java-backend; mvn -B -pl application -am -DskipTests compile
```

```
[INFO] VNTECH ERP � Java Clean Architecture ............... SUCCESS [  0.004 s]
[INFO] VNTECH ERP � Domain ................................ SUCCESS [  2.541 s]
[INFO] VNTECH ERP � Application ........................... SUCCESS [ 21.762 s]
[INFO] BUILD SUCCESS
[INFO] Total time:  26.037 s
```

⚠️ Lệnh 1 **KHÔNG biên dịch** `infrastructure` (`BootstrapDataAdapter`, `PartnerStoreAdapter`) và `web`
(`SystemController`, `ApplicationBeansConfig`) — tức 4/7 tệp chưa được chứng minh. Vì vậy đã chạy thêm
(bằng chứng đầy đủ hơn, cùng `-DskipTests compile`):

```
cd java-backend; mvn -B -pl web -am -DskipTests compile
```

```
[INFO] VNTECH ERP � Java Clean Architecture ............... SUCCESS [  0.004 s]
[INFO] VNTECH ERP � Domain ................................ SUCCESS [  0.365 s]
[INFO] VNTECH ERP � Application ........................... SUCCESS [  0.038 s]
[INFO] VNTECH ERP � Infrastructure ........................ SUCCESS [  9.975 s]
[INFO] VNTECH ERP — Web ................................. SUCCESS [  3.357 s]
[INFO] BUILD SUCCESS
[INFO] Total time:  14.071 s
```

⇒ **5/5 module BUILD SUCCESS**, `javac [debug parameters release 21]`, **0 warning biên dịch của tệp mới**
(chỉ còn cảnh báo `unchecked` có sẵn ở `AdminOpsManagementUseCase.java`).

## 5. Test Java

**KHÔNG chạy `-pl web -am test`** trong task này: hồ sơ thời gian ~25 phút, và bộ test web cần dựng
Spring context + DB test; ưu tiên theo đúng chỉ đạo là **biên dịch xanh + commit ngay** (DSH restart giết
nhánh chưa commit). Ngoài ra **CHƯA có test đỏ→xanh riêng cho TASK-127** — đây là **khoảng trống bằng
chứng đã biết**, xem §7.

## 6. Commit

| Commit | Nội dung |
| --- | --- |
| `b89729e` | `[TASK-127] JAVA cho doi tac (duong LIVE = Java :18081): PartnerStore port + PartnerManagementUseCase + PartnerStoreAdapter + BootstrapDataAdapter doc partners/adminPartners + ApplicationBeansConfig bean + 3 case SystemController (save_partner/set_partner_status/delete_partner) + ActionRbacRegistry. CHI THEM.` — 7 tệp, 255 (+) / 0 (−) |

- Đã stage **đúng 7 tệp `java-backend/**`**; ⛔ KHÔNG `git add -A` (không stage `AGENTS.md`, `docs/28_*`,
  `app/page.tsx`, `.docx/.xlsx`, `tools/baseline/**`, `tsconfig.tsbuildinfo`).
- ⚠️ Ghi nhận cơ chế: `git add` của tôi xong thì một phiên **song song** (TASK-125/126) tạo commit
  `b89729e` **đúng bằng tập tệp tôi vừa stage**; `git commit` của tôi vì thế là no-op (không mất nội dung).
  `git status --porcelain -- java-backend` hiện **rỗng** ⇒ HEAD chứa **đúng byte** bản đã sửa.
- **KHÔNG push** (đúng ràng buộc).

## 7. BLOCKED / UNKNOWN — điều còn lại cần CAPTAIN

1. **Payload chưa lên LIVE (cần captain)**: `:18081` vẫn đang chạy **JAR cũ** ⇒ `GET /api/system` **vẫn chưa
   trả** `partners`/`adminPartners`, và 3 action mới vẫn rơi vào nhánh `default` — *“Action '…' chưa được
   triển khai trên backend Java (Strangler Fig).”* (`SystemController.java:1220-1223`).
   ⇒ Cần `mvn package` + **restart dịch vụ `:18081`**, rồi đo lại payload LIVE (`data.partners.length` ≥ 3
   theo 3 dòng mẫu).
2. **`ACTION_CATALOG.json` / `.md` ĐÃ CŨ** (sinh trước các thay đổi JS của TASK-125): **0 mục** `*_partner`
   trong `java-backend/ACTION_CATALOG.json` ⇒ 2 cổng đối chiếu (`tools/probe-action-parity.mjs`,
   `tools/probe-action-module-parity.mjs`) **sẽ báo lệch** (Java thừa 3 action). Cách sửa đúng hợp đồng
   “danh mục sinh từ nguồn JS”: chạy lại `node java-backend/tools/generate-action-catalog.mjs`
   (+ `generate-rbac-registry.mjs`) — hai script này **chỉ ghi trong `java-backend/`**, nằm trong phạm vi
   được phép, nhưng **chưa làm** vì phải cập nhật `java-backend/tools/migrated-actions.json` và cần đo lại
   cổng. ⇒ **chuyển captain quyết** (hoặc giao TASK-128).
3. **`delete_partner` ở Java CHẶT HƠN JS**: JS cho `isAdmin(user) || isDepartmentApprover(user,"KH")`
   (`scripts/system-route.mjs:1355`); Java dùng `requireRequireAdmin` vì trong Java **không có helper
   tương đương** `isDepartmentApprover` (đã grep 0 kết quả) — đây là **khuôn `delete_supplier` sẵn có**.
   Hệ quả: Trưởng phòng KH (không phải admin) sẽ bị **403** khi Xoá đối tác. ⇒ cần user quyết có làm
   helper `isDepartmentApprover` hay không.
4. **CHƯA có test Java đỏ→xanh** cho TASK-127 (mới có bằng chứng **biên dịch**). Đề xuất TASK-128:
   test `SystemController` (H2) cho 3 action + test payload `partners` (khẳng định khoá + alias camelCase).
