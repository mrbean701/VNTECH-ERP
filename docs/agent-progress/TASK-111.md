# TASK-111 — GIẢI THÍCH CƠ CHẾ MÃ + ĐỀ XUẤT CHỈNH DỮ LIỆU

**Loại:** AUDIT (CHỈ ĐỌC + GHI TÀI LIỆU)
**Ngày:** 2026-09-20
**Phạm vi:** giải thích `<TIỀN TỐ>_<GUID>` vs **mã nghiệp vụ**; tìm chỗ UI hiện GUID; đề xuất phương án dữ liệu.
**Ràng buộc đã tuân thủ:** **KHÔNG** `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE` · **KHÔNG** sửa `app/**`, `lib/**`, `scripts/**`, `java-backend/**`, `drizzle/**` · **KHÔNG** build · **KHÔNG** start/stop dịch vụ · `tests/p2-25-pr-po-grn-cases.test.mjs` giữ **untracked**.
**Sản phẩm cho người dùng:** `docs/agent-progress/MA-CO-HE-THONG-GIAI-THICH.md`

> Thang bằng chứng: **CONFIRMED** = đo trực tiếp (SQL chạy thật / đọc mã có số dòng / HTTP thật).
> **LIKELY** = suy ra từ cấu trúc, không có văn bản ghi lại. **UNKNOWN** = không tìm thấy căn cứ ⇒ nói thẳng.

---

## 1. CÁCH ĐO (tái lập được)

| # | Việc | Công cụ / lệnh |
|---|---|---|
| 1 | Đọc nguồn sinh khoá | `grep` trên `scripts/`, `lib/`, `app/`, `java-backend/` |
| 2 | Quét tiền tố thật | MySQL: `SUBSTRING_INDEX(id,'_',1)` trên **mọi** bảng có cột `id` (sinh SQL động từ `information_schema.columns`) |
| 3 | Phân loại GUID | MySQL: `id REGEXP '^[A-Za-z]+_[0-9a-f]{8}-…$'` |
| 4 | Khoá chính / UNIQUE / FK | `information_schema.key_column_usage`, `information_schema.statistics`, `information_schema.referential_constraints` |
| 5 | Ví dụ mã thật | `SELECT` trực tiếp các bảng chứng từ + danh mục |
| 6 | Bootstrap payload | `curl.exe` đăng nhập + `GET /api/system` trên **Java `:18081`** (chỉ ĐỌC), rồi phân tích JSON bằng `node -e` |
| 7 | Lịch sử/lý do thiết kế | `git log --all --grep=UUID --grep=GUID -i` + grep `docs/**` |

**CSDL:** `"C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -uvntech -pvntech vntech_erp`
*(lưu ý: mật khẩu trên dòng lệnh ⇒ mysql in cảnh báo ra **stderr**; đã lọc khi đọc kết quả)*

---

## 2. KẾT LUẬN CHÍNH (kèm nhãn + bằng chứng)

### 2.1 Khoá kỹ thuật `<TIỀN TỐ>_<GUID>` — sinh ở đâu

| Nội dung | Nhãn | Bằng chứng |
|---|---|---|
| Java sinh khoá bằng `prefix + "_" + UUID.randomUUID()` | **CONFIRMED** | `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/common/UuidIdGenerator.java:13-15` |
| JS monolith sinh y hệt | **CONFIRMED** | `scripts/system-route.mjs:43` — `function id(prefix) { return \`${prefix}_${crypto.randomUUID()}\`; }` |
| Định dạng này là để **tương thích bản JS** khi port sang Java (Strangler Fig) | **CONFIRMED** | `UuidIdGenerator.java:8` — comment nguyên văn: `/** Id dạng '<prefix>_<uuid>' — đúng định dạng monolith JS (id("USR") -> "USR_<uuid>"). */` |
| Có ~15 nơi sinh khoá **trực tiếp** (không qua hàm chung), vẫn cùng định dạng | **CONFIRMED** | `app/api/files/route.ts:140` (`PAR_`), `:167` (`ATT_`); `FileUseCase.java:57,193`; `AuditLogAdapter.java:55,78` (`AUD_`); `AdminSystemStoreAdapter.java:311,468`; `SystemSettingsStoreAdapter.java:124,140,216`; `BoqStoreAdapter.java:436`; `MaterialCatalogStoreAdapter.java:327`; `ProjectAdminStoreAdapter.java:68,138`; `ProductionStoreAdapter.java:375`; `StockManagementUseCase.java:751,767,775,817,840` |

**Số nơi gọi `idGenerator.next(...)`** (bản đồ đầy đủ): **110 lời gọi** trên `java-backend/application/**`, tiền tố: `USR, SCOPE, UWS, UMP, ROLE, DMP, LVL, WH, PRJ, TA, SUP, ORG, MGR, FFC, BSCOPE, BRG, PO, GRN, PPL, ADV, SEC, BKA, CBE, AVC, PRD, REC, PAY, TSC, TPR, TPAY, TSET, CDL, ISS, SMII, RET, RETI, TRF, TRFI, CRET, CRETI, COUNT, COUNTI, BQVER, BQB, BQS, BOQ, BPIB, BPII, MAPRUN, MAPC, MAPA, MAL, BOQC, BQH, MR, MRI, CFV, APR, SES, HR, LBC, COR, LGD, SEL, BEN, SUB, MCH, MAT, MCAT, MEC, MNR, CAT, WI, EVT, NTF, MAIL, TEAM, WHTEAM, ASTAGE, WFS, WFSA, WF, MAR, PCON, APOWN, MAILTO`.
**CONFIRMED** (`grep -n "idGenerator.next(" java-backend/application`).

### 2.2 Khoá kỹ thuật **CÓ PHẢI** khoá chính?

**CONFIRMED — CÓ.** SQL:

```sql
SELECT table_name, constraint_name, GROUP_CONCAT(column_name ORDER BY ordinal_position)
  FROM information_schema.key_column_usage
 WHERE table_schema='vntech_erp' AND constraint_name='PRIMARY'
   AND table_name IN ('material_requests','purchase_orders','goods_receipts','materials',
                      'projects','warehouses','users','audit_logs','stock_issues','teams',
                      'transfer_orders','central_returns')
 GROUP BY table_name, constraint_name;
```

Kết quả: **12/12 bảng** đều `PRIMARY(id)`.

**Và có ràng buộc UNIQUE riêng cho mã nghiệp vụ** — **CONFIRMED**:

```sql
SELECT table_name,index_name,GROUP_CONCAT(column_name ORDER BY seq_in_index)
  FROM information_schema.statistics
 WHERE table_schema='vntech_erp' AND non_unique=0
   AND table_name IN ('material_requests','purchase_orders','goods_receipts','materials',
                      'projects','warehouses','users','document_sequences','teams',
                      'stock_issues','transfer_orders','central_returns')
 GROUP BY table_name,index_name;
```

Kết quả (11 chỉ mục nghiệp vụ):

```
material_requests.material_requests_no_uidx        (request_no)
purchase_orders.purchase_orders_no_uidx            (po_no)
goods_receipts.goods_receipts_no_uidx              (receipt_no)
stock_issues.stock_issues_no_uidx                  (issue_no)
transfer_orders.transfer_orders_uidx_transfer_no   (transfer_no)
materials.materials_code_uidx                      (code)
projects.projects_code_uidx                        (code)
warehouses.warehouses_code_uidx                    (code)
teams.teams_code_uidx                              (code)
users.users_employee_code_uidx                     (employee_code)
document_sequences.document_sequences_scope_uidx   (document_type, project_id, year)
```

### 2.3 ⚠️ **0 KHOÁ NGOẠI** trong toàn CSDL

**CONFIRMED:**

```sql
SELECT COUNT(*) FROM information_schema.referential_constraints WHERE constraint_schema='vntech_erp';
-- 0
```

⇒ **Không có gì ở tầng CSDL chặn việc sửa/xoá khoá.** Đây là **căn cứ quyết định** cho việc
**loại bỏ phương án (C)** trong báo cáo người dùng (§7 của tài liệu chính).

### 2.4 Bản đồ tiền tố thật (đo trên 123 bảng)

`information_schema.tables` cho `vntech_erp` = **123 bảng**; có **79 bảng** có cột `id`.
Quét `SUBSTRING_INDEX(id,'_',1)` cho ra bảng phân loại. Các bảng **dùng GUID thật** (số dòng
khớp `^[A-Za-z]+_<uuid>$` / tổng số dòng):

| Bảng | GUID/tổng | Tiền tố |
|---|---|---|
| `audit_logs` | 907/907 | `AUD` |
| `sessions` | 1401/1401 | `SES` |
| `user_module_permissions` | 1046/1048 | `UMP` |
| `material_requests` | 32/35 | `MR` |
| `material_request_items` | 55/59 | `MRI` |
| `purchase_orders` | 13/17 | `PO` |
| `purchase_order_items` | 21/27 | `POI` |
| `goods_receipts` | 17/22 | `GRN` |
| `goods_receipt_items` | 20/31 | `GRNI` |
| `materials` | 14/14 | `MAT` |
| `projects` | 2/2 | `PRJ` |
| `warehouses` | 3/4 | `WH` / `WHTEAM` |
| `users` | 12/13 | `USR` |
| `approvals` | 124/124 | `APR` |
| `procurement_allocations` | 98/98 | `PAL` |
| `supply_workflow_steps` | 57/57 | `SWF` |
| `contract_stock_ledger` | 25/25 | `CSL` |
| `stock_issues` | 5/5 | `ISS` |
| `material_returns` | 4/4 | `RET` |
| `attachments` | 11/11 | `ATT` |
| `project_boq_items` | 11/11 | `BOQ` |
| `boq_source_items` | 11/11 | `BQS` |
| `boq_change_history` | 11/11 | `BQH` |
| `boq_versions` | 4/4 | `BQVER` |
| `work_items` / `work_item_events` | 9/9 · 8/8 | `WI` / `EVT` |
| `user_project_scopes` | 13/16 | `SCOPE` |

**Các bảng có `id` **đọc được** (không GUID)** — **CONFIRMED**, ví dụ:
`warehouses.id = 'WH-CENTRAL'`, `material_categories.id ∈ {CAT-DIEN, CAT-CTN, …}`,
`role_catalog.id ∈ {ROLE-admin, ROLE-engineer, …}`,
`business_scope_catalog.id ∈ {BSCOPE-HCPC, BSCOPE-FINANCE, …}`,
`system_level_catalog.id ∈ {LVL-CEO, LVL-GD, …}`,
`material_subcategories.id ∈ {DIEN-DAY-CAD, CTN-ONG-NHUA, …}`, và `material_subcategories` có
một dòng `id='0'`.
`menu_group_catalog` **lẫn cả hai**: `MGR_<uuid>` (8 dòng) và `mep`/`hr`/`finance` (4 dòng).

> ⚠️ **Ghi chú phát hiện:** bảng `goods_receipts` có **5/22 dòng** dùng id đọc được từ seed:
> `GRN_P2SEED_GRN_PRJ_DEMO_01_2026_0001`, `…_0002` ⇒ chứng minh cột `id` là **TEXT tự do**,
> không bắt buộc là UUID. **CONFIRMED.**

> ⚠️ **`document_sequences.id`** cũng **không** phải GUID: nó là `'<LOẠI>:<projectId>:<năm>'`,
> ví dụ `DNMH:PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3:2026`. **CONFIRMED.**

### 2.5 Tiền tố kỹ thuật **KHÁC** tiền tố mã nghiệp vụ — bẫy cần nhớ

**CONFIRMED:**

| Thực thể | `id` (kỹ thuật) | mã nghiệp vụ |
|---|---|---|
| Phiếu xuất/cấp phát | **`ISS_`** | **`PX-`** |
| Phiếu ĐNMH | `MR_` | `DNMH-` |
| Đơn mua | `PO_` | `PO-` |
| Phiếu nhập | `GRN_` | `GRN-` |
| Hoàn trả tổ đội | `RET_` | `RET-` |
| Trả Kho Tổng | `CRET_` | `KT-RET-` |
| Điều chuyển | `TRF_` | `TRF-` |

Bằng chứng: `StockManagementUseCase.java:78` (`next("ISS")`) vs `:84` (`"PX-" + …`).
⇒ **Không được suy mã nghiệp vụ từ tiền tố khoá.**

---

## 3. `document_sequences` — SỔ ĐẾM SỐ CHỨNG TỪ

**CONFIRMED — 20 DÒNG** (⚠️ **KHÁC** ghi chú cũ nói 18 — số đã tăng do phát sinh chứng từ):

```
DNMH 4 · GRN 4 · PO 4 · PX 4 · RET 4
```

Ví dụ dòng thật:

```
DNMH:PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3:2026   DNMH   last_number=130
GRN:PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3:2026    GRN    last_number=10
PO:PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3:2026     PO     last_number=10
PX:PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3:2026     PX     last_number=12
RET:PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3:2026    RET    last_number=8
```

**Cơ chế (CONFIRMED — `RequestStoreAdapter.java:105-114`, mẫu y hệt ở `PurchaseStoreAdapter.java:104-115` và `WarehouseStockStoreAdapter.java:100-104` + `:783-787`):**

```sql
INSERT INTO document_sequences (id,document_type,project_id,`year`,last_number,updated_at)
VALUES (?,?,?,?,1,?)
ON DUPLICATE KEY UPDATE last_number=last_number+1, updated_at=VALUES(updated_at);
-- sau đó: SELECT last_number FROM document_sequences WHERE id=?
```

⇒ **Đếm RIÊNG theo (loại chứng từ × dự án × năm).** Vì vậy mỗi dự án lại bắt đầu từ `0001`.

⚠️ **KHÁC BIỆT DIALECT cần nhớ:** JS dùng `ON CONFLICT(id) DO UPDATE … RETURNING`
(SQLite), Java dùng `ON DUPLICATE KEY UPDATE` + `SELECT` lại (MySQL). **CONFIRMED.**

---

## 4. BẢNG SINH MÃ NGHIỆP VỤ (bản Java = đang chạy ở `:18081`)

| Loại | Công thức | Nguồn (tệp:dòng) | Nhãn |
|---|---|---|---|
| **ĐNMH** | `DNMH-<projectCode>-<year>-<seq 4 số>` | `java-backend/application/.../RequestManagementUseCase.java:91-92` | **CONFIRMED** |
| **PO** | `PO-<projectCode>-<year>-<seq 4 số>` | `PurchaseManagementUseCase.java:169-172` | **CONFIRMED** |
| **GRN** | `GRN-<projectCode>-<year>-<seq 4 số>` | `PurchaseManagementUseCase.java:320-321` | **CONFIRMED** |
| **PX** | `PX-<projectCode>-<year>-<seq 4 số>` | `StockManagementUseCase.java:78-84` | **CONFIRMED** |
| **RET** | `RET-<projectCode>-<year>-<seq 4 số>` | `StockManagementUseCase.java:187` | **CONFIRMED** |
| **TRF** | `TRF-<year>-<seq 5 số>` ⚠️ **không kèm mã dự án** | `StockManagementUseCase.java:298` | **CONFIRMED** |
| **KT-RET** | `KT-RET-<projectCode>-<year>-<seq 4 số>` | `StockManagementUseCase.java:480` | **CONFIRMED** |
| **TƯ (tạm ứng)** | `TƯ-<seq 5 số>` | `FinanceManagementUseCase.java:133` | **CONFIRMED** |
| **DM (định mức)** | `DM-<seq 4 số>` | `MaterialCatalogManagementUseCase.java:446` | **CONFIRMED** |
| **CDL (nhật ký thi công)** | `CDL-<projectCode>-<year>-<seq 4 số>` | `ProductionManagementUseCase.java:395` | **CONFIRMED** |

Chú thích trong mã nguồn Java giải thích **vì sao PX phải kèm mã dự án** — **CONFIRMED**,
`StockManagementUseCase.java:81-83`:

> *"Số phiếu PHẢI kèm mã dự án: document_sequences đếm theo (project, year) nên nếu chỉ dùng
> `PX-<year>-<seq>` thì hai dự án khác nhau sẽ trùng số và vi phạm `stock_issues_no_uidx` (global)."*

### 4.1 ✅ ĐNMH — trả lời câu hỏi chính của người dùng

**Mã `DNMH-PRJ-DEMO-01-2026-0128`:**
- `DNMH` = loại chứng từ (Đề Nghị Mua Hàng);
- `PRJ-DEMO-01` = **mã dự án** (`projects.code`, do người dùng đặt);
- `2026` = **năm** lấy từ `neededAt` (`RequestManagementUseCase.java` — `year` suy từ ngày cần hàng);
- `0128` = **số thứ tự 4 chữ số**, lấy từ `document_sequences.last_number` với khoá `DNMH:<projectId>:<year>`.

⇒ **MÁY TỰ SINH HOÀN TOÀN. Người dùng KHÔNG nhập.** **CONFIRMED.**

Dữ liệu thật xác nhận dãy liên tục: `DNMH-PRJ-DEMO-01-2026-0001` … `-0128`
(counter hiện ở **130**).

### 4.2 ⚠️ PHÁT HIỆN: **2 quy tắc sinh số PX/RET** cùng tồn tại

| Bản | Công thức | Nguồn | Đang dùng? |
|---|---|---|---|
| **Java** | `PX-<projectCode>-<year>-<seq 4 số>` | `StockManagementUseCase.java:84` | ✅ **ĐANG CHẠY** — khớp dữ liệu thật |
| **JS cũ** | `PX-<YYMMDD>-<4 số cuối Date.now()>` | `scripts/system-route.mjs:1698` | ❌ nhánh cũ |
| **Java** | `RET-<projectCode>-<year>-<seq 4 số>` | `StockManagementUseCase.java:187` | ✅ **ĐANG CHẠY** |
| **JS cũ** | `RET-<YYMMDD>-<4 số cuối Date.now()>` | `scripts/system-route.mjs:1703` | ❌ nhánh cũ |

**Bằng chứng dữ liệu thật** (`SELECT id, issue_no FROM stock_issues`):

```
ISS_ca26b895-9bf0-4f32-8800-bcf6a4ea505a   PX-PRJ-DEMO-01-2026-0007
ISS_8ea44725-abec-4d66-b377-9809c3bfd110   PX-PRJ-DEMO-01-2026-0012
ISS_3bc0da91-6069-43a2-98b2-b7e3952357ab   PX-SC012564-2026-0001
ISS_1bf3a77e-8e97-43f5-bf5c-6b33510642be   PX-SC161459-2026-0001
ISS_49505f78-7f55-4123-8cef-3a7f2a937d34   PX-SC404767-2026-0001
```

⇒ 5/5 dòng theo **bản Java**; **0 dòng** theo bản JS cũ. **CONFIRMED.**
Nhưng **cần lưu ý**: nếu tồn tại đường chạy JS, mã sẽ khác mẫu ⇒ **U3** (§8).

---

## 5. MÃ VẬT TƯ — `MAT_…` (khoá) vs `code` (nghiệp vụ)

### 5.1 Cái nào người dùng THẤY?

**CONFIRMED — người dùng thấy `materials.code`, KHÔNG bao giờ thấy `MAT_…` trong danh mục.**

Dữ liệu thật (14 dòng):

```
MAT_d33c5cf5-a5da-44c1-ad4c-72911b51a85e   CTN-ONG-NHUA-001   Ống nhựa PVC D60              system=CTN
MAT_ae368d0b-f7d1-47b1-8443-2931582ef2c5   CTN-ONG-NHUA-002   Ống nhựa PVC D21 uPVC         system=CTN
MAT_f0348df1-ff01-45d0-8fc2-c83c2a913a70   CTN-VAN-001        Van cân bằng DN50             system=CTN
MAT_8b585b8f-6155-4aeb-9f9e-852be7d15be4   DIEN-DAY-CAD-001   Cáp điện CV 3x2.5mm           system=DIEN
MAT_4ea84f7f-6c27-41ab-b0ed-f4b00a9932e2   DIEN-DAY-CAD-002   Dây cáp điện Cu/PVC 2x2.5mm2  system=DIEN
MAT_f86f5485-952c-4d75-85ce-1db512d2a352   DIEN-ONG-LUON-001  Ống thép luồn dây CTS D25     system=DIEN
MAT_499cdcf2-6b60-44de-b778-c6d97b8d1cdf   DIEN-THIET-BI-001  Aptomat MCB 1P 32A            system=DIEN
MAT_82e7d551-af12-4a5a-9cec-78df596c3a78   HVAC-ONG-GIO-001   Ống gió tráng kẽm D400        system=HVAC
MAT_082196e5-02d0-45c5-84c2-eb2d0668566b   KHAC-VLXD-001      Gạch ống 4 lỗ                 system=KHAC
… (5 mã KHAC-VLXD-002..006)
MAT_c3ff35ff-c562-4814-8b77-5e925e0d0589   KHAC-VLXD-005      Xi măng PCB40                 system=KHAC
```

### 5.2 Mã vật tư: **TỰ ĐỘNG** hay **TAY**?

**CONFIRMED — TAY (người dùng gõ vào ô nhập).** Bằng chứng:

| Bằng chứng | Vị trí |
|---|---|
| Ô nhập bắt buộc *"Mã vật tư gốc \*"*, giá trị mặc định lấy từ dòng đang sửa | `app/page.tsx:2502` — `<input name="code" required defaultValue={editing ? row?.code : ""} />` |
| Trường `code` gửi lên action `save_material` | `app/page.tsx:2501` — `submit("save_material", { ...Object.fromEntries(form), … })` |
| Server chỉ **viết hoa** + **kiểm trùng**, không sinh mã | `MaterialCatalogManagementUseCase.java:53` (`toUpperCase`), `:87-88` (`materialCodeUsedElsewhere` ⇒ *"Mã vật tư đã tồn tại."*) |
| **Chỉ `id` là máy sinh** | `MaterialCatalogManagementUseCase.java:114` và `:589` — `m.put("id", idGenerator.next("MAT"))` |
| **Đổi mã cũ bắt buộc nhập lý do**, ghi lịch sử | `MaterialCatalogManagementUseCase.java:91-95` (`insertCodeHistory(idGenerator.next("MCH"), …)`) |
| **Nhập từ Excel**: mã lấy từ cột trong tệp, `ON CONFLICT(code) DO UPDATE` | `scripts/system-route.mjs:2799` |

⇒ **Người dùng ĐẶT TAY được** (và đang đặt theo quy ước `<MÃ HỆ>-<MÃ NHÓM>-<STT>`), và
**sửa được** nhưng **phải nhập lý do**. **CONFIRMED.**

### 5.3 ⚠️ ĐÍNH CHÍNH: `MaterialSystemCodes` **KHÔNG** sinh mã vật tư

Ghi chú cũ nói có *"lớp sinh mã vật tư hệ thống (MaterialSystemCodes)"*. **Đọc mã nguồn cho
thấy KHÁC — CONFIRMED:**

`java-backend/domain/src/main/java/com/vntech/erp/domain/service/MaterialSystemCodes.java`
chỉ có 3 chức năng, **không có hàm nào sinh `materials.code`**:

| Hàm | Việc thật | Dòng |
|---|---|---|
| `canonicalMeCode(value)` | Chuẩn hoá **MÃ HỆ M&E**: `Điện`→`DIEN`, `ELV`→`DNHE`, `CTN`, `HVAC`, `PCCC`, còn lại→`KHAC` | `:28-45` |
| `normalizeMaterialName(value)` | Chuẩn hoá **TÊN** để so trùng | (theo `MaterialSystemCodesTest.java:56-64`) |
| `internalGroupCode(name)` | Sinh **mã nhóm nội bộ**, tối đa 48 ký tự (`Cáp điện động lực`→`CAP_DIEN_DONG_LUC`; rỗng→`CHUA_PHAN_NHOM`) | (`MaterialSystemCodesTest.java:69-74`) |

Và nơi dùng: `MaterialCatalogManagementUseCase.java:85` —
`String system = MaterialSystemCodes.canonicalMeCode(sv(category, "code"));` ⇒ **chỉ ghi cột
`system`, không đụng `code`.**

> ⇒ **Kết luận phủ định CONFIRMED:** hệ thống hiện **KHÔNG có** lớp sinh mã vật tư tự động.

---

## 6. CHỖ NÀO ĐANG HIỆN GUID CHO NGƯỜI DÙNG (danh sách tệp:dòng)

### 6.1 🔴 BẮT BUỘC thấy — không có đường khác

| # | Tệp:dòng | Hiển thị | Giá trị thật |
|---|---|---|---|
| 1 | `app/page.tsx:2042` (trong `AuditLogManager`, khai báo `:1953`) | Cột **"Đối tượng"** = `{a.entityId}` | `PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3` |
| 2 | `app/page.tsx:2057` | Khối chi tiết: **"Mã bản ghi"** = `{a.id}`, **"Đối tượng"** = `{a.entityId}` | `AUD_8d2f697d-1fd0-4ab8-af74-ea255b31ecfe` |
| 3 | `lib/boq-export.ts:70` (XLSX) và `:77` (CSV) | Cột **"Mã dòng BOQ"** = `String(r.id \|\| "")` | `BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d` |

**Vì sao "bắt buộc":** payload API **chỉ** cung cấp `audits[].entityId` (GUID) +
`audits[].entityType` (tên bảng) — **không** có mã nghiệp vụ. **CONFIRMED** (§7.2).
Cho export BOQ: mã cột là `r.id`, không có trường thay thế nào được truyền.

### 6.2 🟠 Thấy khi THIẾU mã (nhánh dự phòng `|| .id`)

| # | Tệp:dòng | Ngữ cảnh | Ghi chú |
|---|---|---|---|
| 4 | `app/components/ui/EntityDetailModal.tsx:117` | `<code className="edm-entity-id">{entityId}</code>` | **Cửa vào chung** — cứ truyền GUID là hiện |
| 5 | `app/screens/ProjectEntityModal.tsx:174` | `entityId={String(row.code \|\| row.id \|\| "")}` | ⚠️ Với thực thể **`users`** (không có cột `code`) ⇒ **LUÔN hiện `USR_<guid>`** |
| 6 | `app/screens/ProjectEntityModal.tsx:116` | Cột **"Tổ đội"** = `member.teamId` | `teamMembers` **không có** `teamCode` ⇒ **LUÔN hiện `TEAM_<guid>`** |
| 7 | `app/screens/ProjectEntityModal.tsx:115` | `scope.projectCode \|\| scope.projectId` | dự phòng |
| 8 | `app/screens/ProjectEntityModal.tsx:117` | `scope.warehouseCode \|\| scope.warehouseId` | dự phòng |
| 9 | `app/screens/PurchaseOrderDrawer.tsx:30` | `entityId={poNo \|\| id}`, title | dự phòng |
| 10 | `app/screens/PurchaseOrderDrawer.tsx:34` | Cột **"Mã GRN"** + cảnh báo GRN rỗng = `receipt.receiptNo \|\| receipt.id` | dự phòng |
| 11 | `app/screens/BoqControl.tsx:73` | Cột **"Dòng nguồn"** = `{row.sourceItemId}` | `BQS_<guid>` |
| 12 | `app/page.tsx:2818` | Hàm `exportCsv`: `Ma: row.requestNo \|\| row.poNo \|\| row.receiptNo \|\| row.id` | dự phòng |
| 13 | `app/screens/TeamDirectory.tsx:481` | `String(row[source.keyField] \|\| row.id \|\| "—")` | dự phòng |
| 14 | `app/screens/TeamManagement.tsx:122` | `String(r[g.noKey] \|\| r.id \|\| "—")` | dự phòng |
| 15 | `app/screens/ProjectDetailTabs.tsx:87,91,95,100` | nhãn mốc thời gian = `row.requestNo \|\| row.id` / `poNo \|\| id` / `receiptNo \|\| id` / `taskNo \|\| id` | dự phòng |

### 6.3 ✅ KHÔNG hiện GUID (đã kiểm, an toàn)

| Tệp:dòng | Hiển thị |
|---|---|
| `app/screens/RequestDrawer.tsx:46` | `entityId={request.requestNo}` — mã nghiệp vụ |
| `app/screens/ReceiptDrawer.tsx:27` | `{receipt.receiptNo}`, `{receipt.poNo}` |
| `app/screens/ProjectEntityModal.tsx:73` | `title = Chi tiết dự án · ${row.code \|\| pid}` |
| `app/screens/HRScreen.tsx:21` | `{r.employeeCode}` |
| `app/screens/DocumentsScreen.tsx:26` | `{r.voucherNo}`, `{r.projectCode}` |
| `app/screens/CashbankScreen.tsx:29` | `{e.entryNo}` |
| `app/screens/LaborScreen.tsx:23` | `{r.contractNo}` |
| `app/screens/CorrespondenceScreen.tsx:21` | `{r.docNo}` |
| `app/screens/BenefitsScreen.tsx:22` | `{r.benefitNo}` |
| `app/screens/ConstructionScreen.tsx:39` | `{l.logNo}` |
| `app/screens/Inventory.tsx:63` | `{row.transferNo}` |

---

## 7. ĐO `/api/system` BOOTSTRAP (THẬT)

### 7.1 Cách đo (chỉ ĐỌC)

```powershell
curl.exe -s -o login.json -w "%{http_code}" -c cookies.txt -X POST `
  "http://127.0.0.1:18081/api/system" -H "Content-Type: application/json" `
  --data-binary '{\"action\":\"login\",\"username\":\"admin\",\"password\":\"Admin123456@\"}'
# → LOGIN 200 · {"mustChangePassword":false,"ok":true}

curl.exe -s -o bootstrap.json -b cookies.txt "http://127.0.0.1:18081/api/system"
# → HTTP 200
```

⚠️ **Bẫy đã gặp:** gọi `POST {"action":"bootstrap"}` ⇒ **HTTP 400**,
`"Action 'bootstrap' chưa được triển khai trên backend Java (Strangler Fig)."`
⇒ Bootstrap là **`GET /api/system`** (đúng như ghi ở
`java-backend/application/.../port/out/BootstrapDataPort.java:7`). **CONFIRMED.**

### 7.2 Kết quả

**71 nhóm dữ liệu dạng mảng.** Phân tích bằng `node -e` (đọc JSON, không ghi):

| Nhóm (số dòng) | Trường mã nghiệp vụ đi kèm `id` |
|---|---|
| `requests` (35) | `requestNo`, `projectCode`, `projectName`, `contractNo`, `boqVersionCode`, `teamName` |
| `purchaseOrders` (17) | `poNo`, `requestNo` |
| `receipts` (22) | `receiptNo`, `poNo`, `deliveryNoteNo` |
| `issues` (2) | `issueNo` (`PX-PRJ-DEMO-01-2026-0012`) |
| `returns` (1) | `returnNo` |
| `materials` (14) / `adminMaterials` (14) | `code` |
| `projects` (2) / `adminProjects` (2) | `code`, `contractNo` |
| `warehouses` (4) / `transferWarehouses` (4) | `code` |
| `users` (13) / `staffDirectory` (13) | `employeeCode`, `username`, `organizationCode`, `organizationName` |
| `paymentPlans` (3) | `planNo` |
| `cashbookEntries` (2) | `entryNo` |
| `laborContracts` (2) | `contractNo` |
| `officialCorrespondence` (1) | `docNo` |
| `benefitRecords` (1) | `benefitNo` |
| `constructionDailyLogs` (1) | `logNo` |
| `workItems` (7) | `taskNo`, `sourceNo` |
| `contractStockLedger` (25) | `contractNo` |
| `inventory` (28) | **không có `id`** — có `projectCode`+`warehouseCode`+`materialCode` |
| `companyAvailability` (4) | **không có `id`** — có `warehouseCode`+`projectCode`+`materialCode` |
| `contractStockBalances` (4) | **không có `id`** |
| `userScopes` (16) | **không có `id`** — có `projectCode`+`projectName` |

⇒ **CONFIRMED: bootstrap trả CẢ `id` LẪN mã nghiệp vụ.** Giao diện **có đủ dữ liệu**.

**Mẫu thật `requests[0]` (đầy đủ khoá):**
`id, requestNo, projectId, projectCode, projectName, contractId, contractNo, boqVersionId,
boqVersionCode, teamId, teamName, requestedBy, requestedAt, neededAt, priority, area, purpose,
status, supplyStatus, approvalStage, totalEstimatedValue, itemCount, totalQty, receivedQty,
issuedQty, approvals, items` — **CONFIRMED.**

**Mẫu thật `issues[0]`:**
`{"id":"ISS_8ea44725-abec-4d66-b377-9809c3bfd110","issueNo":"PX-PRJ-DEMO-01-2026-0012",
"projectId":"PRJ_fdbfab20-…","teamId":"TEAM_8c1fecd9-…","projectCode":"PRJ-DEMO-01",
"teamName":"Tổ đội thi công số 1", …}` — **CONFIRMED.**

### 7.3 Các trường **CHỈ** trả GUID (khoá ngoại) — nguồn của mọi rủi ro hiển thị

Đo trực tiếp trên payload. **Không kèm** mã/tên:

| Nhóm · trường | Giá trị thật |
|---|---|
| `audits.entityId` | `PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3` ⚠️ **chính màn §6.1 #1** |
| `audits.userId` *(có `userName` bù)* | `USR_4a1c4fd5-dd0f-4ca6-80ff-feda3f3ed881` |
| `constructionDailyLogItems.boqItemId` | `BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d` |
| `constructionDailyLogItems.logId` | `CDL_a23434af-c175-44ae-a9f6-ce5f114440c4` |
| `contractStockLedger.referenceId` / `.referenceItemId` | `ISS_8ea44725-…` / `SMII_f48ffeec-…` |
| `supplySteps.requestId` / `.purchaseOrderId` / `.receiptId` / `.completedBy` | `MR_00b80951-…` / `PO_2fd3bda0-…` / `GRN_e5f9763c-…` / `USR_2f435847-…` |
| `workItemEvents.workItemId` / `.actorUserId` | `WI_d455a522-…` / `USR_c51d95b2-…` |
| `teamMembers.teamId` / `.userId` | `TEAM_8c1fecd9-…` / `USR_8869ca60-…` ⚠️ **chính màn §6.2 #6** |
| `materialAliases.materialId` | `MAT_499cdcf2-…` |
| `userScopes.userId` / `.projectId` | `USR_2f435847-…` / `PRJ_cfba8c1a-…` |
| `activeSessions.userId` | `USR_2f435847-…` |
| `modulePermissions.userId`, `allModulePermissions.userId` | `USR_…` |
| `departmentModulePermissions.organizationUnitId` | `ORG_7b07ef03-5ac2-479b-93bb-53…` |
| `workflowStepApprovers.stepId` / `.userId` | `WFS_507c1908-…` / `USR_c51d95b2-…` |
| `workflowAssignments.projectId` / `.ownerUserId` | `PRJ_fdbfab20-…` / `USR_911a47b2-…` |
| `paymentPlans.projectId` / `.contractId` / `.poId` | `PRJ_fdbfab20-…` / `PCON_78092ea4-…` / `PO_b85e4018-…` |
| `capitalRecoveryRecords.productionReportId` | `PRD_73fe17a6-…` |
| `boqItems.sourceItemId`, `boqSourceItems.projectBoqItemId` | `BQS_dca3fab5-…` / `BOQ_762fd4c7-…` |
| `boqChangeHistory.projectBoqItemId` / `.sourceItemId` / `.actorUserId` | `BOQ_64e585e9-…` / `BQS_4881dd12-…` / `USR_2f435847-…` |
| `cashbookEntries.accountId` / `.referenceId` | `BKA_f64db4c1-…` / **`PRJ_fdbfab20-…`** ⚠️ |
| `hrRecords.userId`, `laborContracts.userId`, `benefitRecords.userId` | `USR_…` |
| `issues.teamId`, `returns.teamId`, `teams.warehouseId` | `TEAM_…` / `WHTEAM_…` |
| `inventory.*Id`, `companyAvailability.*Id` | GUID nhưng **có** `*Code` đi kèm ✅ |

> ⚠️ **PHÁT HIỆN DỮ LIỆU LẪN LOẠI (mới — chưa có trong MASTER_STATUS):**
> `cashbookEntries[0].referenceId = 'PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3'` và
> `cashbookEntries[1].referenceId = 'PRJ_fdbfab20-…'`, trong khi `referenceType` là
> `'purchase'` và `'contract_payment'`. Tức **ô "mã tham chiếu" đang chứa một MÃ DỰ ÁN**,
> không phải mã chứng từ tương ứng loại tham chiếu. **CONFIRMED** (đọc payload thật).
> **KHÔNG tự sửa dữ liệu** — ghi thành **U2** để người dùng quyết định.

---

## 8. VÌ SAO DÙNG GUID — TRẢ LỜI CÓ PHÂN LOẠI

### 8.1 Lý do **ĐƯỢC GHI LẠI** — CONFIRMED

| # | Nội dung | Nguồn |
|---|---|---|
| 1 | Định dạng `<prefix>_<uuid>` phải **giống hệt monolith JS** để chuyển Java không phá dữ liệu | `java-backend/infrastructure/.../UuidIdGenerator.java:8` (comment) |
| 2 | Kế hoạch chuyển CSDL: `AUTOINCREMENT`/sqlite → `AUTO_INCREMENT`; **`document_sequences` giữ logic riêng** | `docs/09_KE_HOACH_CHUYEN_SANG_JAVA_MYSQL.md:218` |

⇒ Cả hai là lý do **khi chuyển đổi**, **KHÔNG phải** lý do thiết kế ban đầu.

### 8.2 Lý do **SUY RA** — LIKELY (không có văn bản xác nhận)

| # | Nội dung | Căn cứ |
|---|---|---|
| 1 | Ứng dụng từng chạy **đa CSDL**: Cloudflare **D1** (dev) / **PostgreSQL 16** (prod) / **SQLite** qua adapter viết tay; có `migrate-postgres.mjs`, `migrate-sqlite-to-mysql.mjs` ⇒ khoá GUID (chuỗi) an toàn hơn số tự tăng khi cùng dữ liệu tồn tại ở nhiều CSDL hoặc khôi phục từ nơi khác | `docs/01_BAO_CAO_PHAN_TICH_DU_AN.md:30`, `:32`; `docs/02_HUONG_DAN_DEV_MOI.md:59-60`; `java-backend/tools/migrate-sqlite-to-mysql.mjs:66` |
| 2 | Có tính năng **lưu trữ offline theo dự án rồi GỠ khỏi hệ thống** (`PURGE_AFTER_OFFLINE_ARCHIVE`, bảng `project_archives`, `purge_audit_id`) ⇒ ID phải **duy nhất toàn cầu**, không phụ thuộc bộ đếm của một CSDL | `scripts/system-route.mjs:2650`; `app/api/files/route.ts:121,140`; `TASK-046` |
| 3 | Tách khoá khỏi mã nghiệp vụ ⇒ **đổi mã nghiệp vụ được** mà không phá liên kết (đúng cơ chế `material_code_history` đang dùng) | `MaterialCatalogManagementUseCase.java:91-95` |

### 8.3 **UNKNOWN** — phải nói thẳng

Đã tìm ở: `docs/**` (grep `UUID`, `GUID`, `khoá chính`, `AUTO_INCREMENT`) · **toàn bộ lịch
sử git** (`git log --all --grep="UUID" --grep="GUID" --grep="id dạng" -i`) · các kế hoạch
kiến trúc · `docs/agent-progress/TASK-*.md`.

**Không tìm thấy văn bản nào ghi lại lý do thiết kế ban đầu của quyết định "GUID thay vì
số tự tăng".** Tài liệu duy nhất chạm tới chủ đề này là
`docs/20_KE_HOACH_CHINH_SUA_GIAO_DIEN_VA_DU_LIEU.md`:

- **mục 2.3 dòng 109** — nêu vấn đề: *"Khoá chính dạng hash `MAT_<uuid>`, `PRJ_<uuid>` … nhưng **đã có sẵn cột `code` đọc được**"*;
- **§2.4 dòng 111-123** — bằng chứng ID thật + ghi chú *"`WH-CENTRAL` chứng minh tiền lệ… hạ tầng **không bắt buộc** phải là hash. Vấn đề thuần tuý là **quy ước sinh ID**"*;
- **§6 Q1 dòng 327-333** — 3 phương án A/B/C, **CHƯA CHỐT**, và **không nêu lý do lịch sử**:
  - (A) giữ hash, `code` thành định danh hiển thị ⇒ **rủi ro 🟢 Thấp**;
  - (B) đổi cả khoá chính cho mọi bảng ⇒ **🔴 Cao**;
  - (C) chỉ đổi khoá chính `materials` ⇒ 🟡 Trung bình.
- **dòng 207-208, 223** — `V17` chuẩn hoá `code` vật tư; **`V18` = "tuỳ quyết định H"** chuyển khoá chính sang định danh có cấu trúc ⇒ **vẫn treo**.

⇒ **UNKNOWN #1.** Không tự bịa. Cần hỏi người thiết kế ban đầu.

---

## 9. PHƯƠNG ÁN CHỈNH DỮ LIỆU (A/B/C/D) + KHUYẾN NGHỊ

*(Bản trình bày cho người dùng ở §7 tài liệu chính; ở đây ghi phần kỹ thuật.)*

| | Phương án | Sửa mã? | Sửa dữ liệu? | Migration? | Rủi ro |
|---|---|---|---|---|---|
| **A** ⭐ | Giữ khoá GUID, **chỉ đổi hiển thị** (UI luôn hiện mã nghiệp vụ + tên) | **Có** — `app/**` (≤ 15 vị trí §6.1–6.2) + `lib/boq-export.ts` | **KHÔNG** | **Không** | 🟢 Thấp |
| **B** | **Thêm cột mã hiển thị** (additive) cho thực thể còn thiếu | Có — schema + truy vấn | **Có** — backfill | **Có** — `drizzle/00NN_*.sql` | 🟡 Trung bình |
| **C** 🔴 | **Đổi giá trị `id`** trong dữ liệu | Có | **CÓ, rất lớn** | Có (không đủ an toàn) | 🔴 **Cực cao — KHUYẾN NGHỊ KHÔNG LÀM** |
| **D** | Chỉ **chuẩn hoá mã nghiệp vụ** (cột `code`), không đụng `id` | **Không** | **Có** — chỉ cột `code` (qua API `save_material`/`merge_material_master`) | Không | 🟢 Thấp–TB |

### 9.1 Căn cứ kỹ thuật để loại (C) — **CONFIRMED**

1. **0 khoá ngoại** (§2.3) ⇒ MySQL **không báo lỗi** khi `UPDATE materials SET id=…`;
   câu lệnh trả `OK` nhưng mọi cột `material_id` ở bảng khác **vẫn giữ giá trị cũ**.
2. **Không có FK để kiểm tra** ⇒ sai sót **im lặng**, không phát hiện được bằng mắt.
3. Số dòng GUID phải đổi: `audit_logs` **907**, `sessions` **1401**,
   `user_module_permissions` **1046**, `purchase_order_items` **27**, `material_request_items` **59**…
   ⇒ hàng nghìn giá trị, **không có bảng gốc để đối chiếu** với `audit_logs.entity_id`
   (chỉ có `entityType` là **tên bảng**, ví dụ `"requests"`, `"material_request"`).
4. Tài liệu `docs/20_…:332` đã tự đánh giá phương án này là **🔴 Cao** với lý do
   *"Phải migrate FK ở hàng chục bảng, thứ tự phụ thuộc phức tạp"* — và thực tế **còn tệ hơn**
   vì **không có FK** để migrate.

### 9.2 Vì sao khuyến nghị (A)

1. Nỗi khó hiểu đến từ **hiển thị**, không phải từ việc CSDL lưu GUID.
2. Payload **đã có sẵn** mã nghiệp vụ (§7.2) ⇒ **không cần thêm dữ liệu**.
3. Chỉ **~15 vị trí** ở `app/**` + `lib/boq-export.ts` ⇒ nhỏ, rollback = hoàn tác commit.
4. **Không một câu `UPDATE` nào** ⇒ **không rủi ro mất dữ liệu**.
5. Khớp tiền lệ trong tài liệu: `docs/20_…:331` xếp "giữ hash + `code` làm định danh hiển thị"
   là **🟢 Thấp**.

### 9.3 Khi nào thêm (B)

Chỉ khi người dùng cần **xuất báo cáo** từ các bảng phụ (ví dụ `contract_stock_ledger`,
`material_aliases`, `workflow_step_approvers`) mà không muốn tra chéo. Khi đó:
**additive + backfill**, và **phải xử lý dòng mồ côi TRƯỚC** — nếu không sẽ backfill ra
`NULL`/sai. **Tiền lệ mồ côi ĐÃ BIẾT** (từ `MASTER_STATUS`/`TASK-043`):
`material_request_items` dòng `MRI_d1f57f9d-7b4f-4939-a854-bbc50f78c69d` trỏ tới
`MR_46cee316-73f1-467b-905a-2c74f2bd5ce7` **KHÔNG tồn tại**; **5 dòng `user_project_scopes`
mồ côi** (1 trỏ `PRJ_fdbfab20-bf1f-0000-0000-000000000000`, 1 có `user_id` không tồn tại).

---

## 10. UNKNOWN & CÂU HỎI CHO NGƯỜI DÙNG

| # | UNKNOWN | Đã tìm ở đâu | Cần ai trả lời |
|---|---|---|---|
| **U1** | Lý do thiết kế ban đầu dùng GUID thay vì số tự tăng | `docs/**`, **toàn bộ** `git log --all`, kế hoạch kiến trúc, `TASK-*.md` | Người thiết kế hệ thống ban đầu |
| **U2** | `cashbook_entries.reference_id` chứa **mã dự án** (`PRJ_fdbfab20-…`) trong khi `reference_type='purchase'`/`'contract_payment'` — chủ ý hay nhập sai? | đọc payload thật §7.3 | Người dùng / kế toán |
| **U3** | Có phiếu PX/RET nào thực tế sinh bằng **nhánh JS cũ** (`PX-YYMMDD-…`) không? Dữ liệu hiện 5/5 theo bản Java | §4.2 | Kỹ thuật (đo thêm) |
| **U4** | Thực thể nào **bắt buộc phải có** mã nghiệp vụ? (quyết định nghiệp vụ) | — | Người dùng |

**Câu hỏi cần chốt (đã đưa vào §8 tài liệu chính): Q1 chọn A/B/C/D · Q2 cột "Đối tượng" màn
Nhật ký kiểm toán · Q3 cột "Mã dòng BOQ" khi xuất Excel · Q4 bảng nào cần thêm mã (B) ·
Q5 có muốn tự gợi ý mã vật tư theo quy ước không.**

---

## 11. VIỆC CHƯA LÀM (cố ý — đúng ràng buộc)

- ❌ **Không** sửa bất kỳ tệp mã nguồn nào (`app/**`, `lib/**`, `scripts/**`, `java-backend/**`, `drizzle/**`).
- ❌ **Không** chạy bất kỳ câu `INSERT/UPDATE/DELETE/ALTER/DROP/TRUNCATE` nào. **Chỉ `SELECT`.**
- ❌ **Không** build, không start/stop dịch vụ. Chỉ **gọi ĐỌC** vào Java `:18081` đang chạy sẵn.
- ❌ **Không** commit tệp nào ngoài 2 tài liệu của task này. `tests/p2-25-pr-po-grn-cases.test.mjs` giữ **untracked**.
- ⏭️ **Chờ người dùng chốt phương án** trước khi thi công bất cứ thay đổi nào.

**Tệp tạm đã tạo rồi tự xoá:** `tools/_tmp-task111-codes.sql` (đã xoá).
**Tệp dữ liệu đo tạm (ngoài repo, trong `%TEMP%`):** `t111-login.json`, `t111-cookies.txt`,
`t111-bootstrap.json` — không thuộc workspace.
