# MÃ CỦA HỆ THỐNG — GIẢI THÍCH CHO NGƯỜI DÙNG

**Dự án:** VNTECH ERP V5.3.0 · **Task:** TASK-111 · **Ngày đo:** 2026-09-20
**Người đọc:** cán bộ nghiệp vụ / quản trị dự án (không cần biết lập trình)
**Trạng thái:** CHỈ ĐỌC + GHI TÀI LIỆU — lượt này **không** sửa mã nguồn, **không** sửa dữ liệu.

> Mọi kết luận dưới đây đều gắn nhãn:
> **CONFIRMED** = đo được trực tiếp (đọc mã nguồn có số dòng, hoặc câu SQL chạy thật).
> **LIKELY** = suy ra từ cấu trúc, chưa có văn bản nào ghi lại.
> **UNKNOWN** = **không tìm thấy** căn cứ nào ⇒ nói thẳng là chưa biết, **không bịa**.

---

## PHẦN 1 — TRẢ LỜI THẲNG 3 CÂU HỎI

### ① Đây có phải "mã hoá" không?

**KHÔNG.** ✗

Đây **không phải mã hoá** (encryption) và cũng **không phải mã hoá bí mật**. Đó là
**khoá kỹ thuật** (*technical key*) — tức là **tên định danh nội bộ** mà máy tính dùng để
phân biệt các bản ghi với nhau. Nó **không chứa thông tin gì bị giấu**: đọc nó ra không
suy được nội dung nghiệp vụ nào, nhưng cũng **không có gì bị che giấu** — nó chỉ là một
cái "số căn cước" dài.

Ví dụ:

| Khoá kỹ thuật | Mã nghiệp vụ đi kèm | Tên |
|---|---|---|
| `MR_46cee316-73f1-467b-905a-2c74f2bd5ce7` | `DNMH-PRJ-DEMO-01-2026-0002` | Phiếu đề nghị mua hàng số 2 |

Người dùng **nhìn thấy `DNMH-PRJ-DEMO-01-2026-0002`** là đủ. Chuỗi `MR_46cee316-…` chỉ là
"căn cước" để phần mềm biết hai dòng dữ liệu có trỏ đúng vào nhau hay không.

### ② Vì sao phải có 2 loại?

Vì **hai loại phục vụ hai mục đích khác nhau**, không thay thế được cho nhau:

| | Khoá kỹ thuật `<PREFIX>_<GUID>` | Mã nghiệp vụ |
|---|---|---|
| Ai đọc | **Máy** | **Người** |
| Mục đích | Nối dữ liệu chính xác, không bao giờ trùng | Trao đổi, in ấn, đối chiếu, lưu hồ sơ |
| Người dùng đặt được? | **Không** (máy tự sinh) | **Có** (một số loại) |
| Đổi được không? | **Không** (đổi là phá vỡ liên kết) | **Có** (một số loại, có ghi lịch sử) |
| Ví dụ | `MAT_082196e5-02d0-45c5-84c2-eb2d0668566b` | `KHAC-VLXD-001` |

Nói cách khác: mã nghiệp vụ để **con người làm việc**; khoá kỹ thuật để **phần mềm không
nhầm lẫn**. Nếu dùng mã nghiệp vụ làm khoá, mỗi lần sửa mã (ví dụ đổi `VL-CAPDIEN` thành
`DIEN-DAY-CAD-001`) là **mọi chứng từ cũ mất liên kết** — đó chính là lý do kỹ thuật buộc
phải tách 2 loại.

### ③ Vậy mã do máy tự tạo hay do người dùng tự đặt?

**CẢ HAI, tuỳ loại** — đây là câu trả lời quan trọng nhất:

| Nhóm | Ai tạo | Ví dụ |
|---|---|---|
| **Khoá kỹ thuật** (`MR_…`, `MAT_…`, `PRJ_…`, `AUD_…`) | **MÁY tự sinh 100 %** — người dùng **không nhập, không sửa được** | `MR_46cee316-73f1-467b-905a-2c74f2bd5ce7` |
| **Mã chứng từ** (`DNMH-…`, `PO-…`, `GRN-…`, `PX-…`, `RET-…`, `TRF-…`, `KT-RET-…`, `TƯ-…`, `DM-…`, `PPL-…`, `SQ-…`, `HĐLĐ-…`, `CV-…`, `BH-…`, `CDL-…`) | **MÁY tự sinh 100 %**, theo mẫu cố định, đếm số tự động | `DNMH-PRJ-DEMO-01-2026-0128` |
| **Mã danh mục** (`materials.code`, `projects.code`, `warehouses.code`, `teams.code`, `suppliers.code`, `users.employee_code`) | **NGƯỜI DÙNG TỰ ĐẶT** (gõ tay vào ô nhập, hoặc nhập từ Excel) | `KHAC-VLXD-001`, `PRJ-DEMO-01`, `KHO-PRJ-DEMO-01`, `PRJ-DEMO-01-TD-01`, `NV-TKHO` |

👉 **Kết luận:** mã chứng từ (như phiếu ĐNMH) là **máy tự sinh**; còn mã **danh mục** (như
mã vật tư) là **người dùng tự đặt**. Đây có thể chính là nguồn gây khó hiểu: **hai nhóm
hành xử khác nhau**.

---

## PHẦN 2 — ĐO ĐƯỢC GÌ TRONG MÃ NGUỒN VÀ DỮ LIỆU

### 2.1 Ai sinh khoá kỹ thuật `<PREFIX>_<GUID>`

**CONFIRMED** — có **đúng 2 nơi** sinh ra định dạng này:

| Nơi | Dòng | Nội dung |
|---|---|---|
| **Java (đang chạy thật ở cổng 18081)** | `java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/common/UuidIdGenerator.java:13-15` | `return prefix + "_" + UUID.randomUUID();` |
| **JS monolith (bản cũ, song song)** | `scripts/system-route.mjs:43` | `function id(prefix) { return \`${prefix}_${crypto.randomUUID()}\`; }` |

Chính mã nguồn Java có ghi chú nói rõ **vì sao định dạng phải như vậy**:

> `UuidIdGenerator.java:8` —
> `/** Id dạng '<prefix>_<uuid>' — đúng định dạng monolith JS (id("USR") -> "USR_<uuid>"). */`

⇒ Đây là **lý do tương thích khi chuyển từ JS sang Java** (kỹ thuật gọi là *Strangler Fig*).
**Đây KHÔNG phải lý do vì sao ban đầu chọn GUID thay vì số tự tăng** (xem §5).

Một số chỗ sinh khoá **trực tiếp, không qua hàm chung** (vẫn cùng định dạng) — **CONFIRMED**:

| Tệp:dòng | Tiền tố |
|---|---|
| `app/api/files/route.ts:140` | `PAR_<uuid>` (gói lưu trữ offline) |
| `app/api/files/route.ts:167` | `ATT_<uuid>` (tệp đính kèm) |
| `java-backend/application/.../FileUseCase.java:57` | `ATT_<uuid>` |
| `java-backend/application/.../FileUseCase.java:193` | `PAR_<uuid>` |
| `java-backend/infrastructure/.../AuditLogAdapter.java:55` và `:78` | `AUD_<uuid>` (nhật ký kiểm toán) |
| `java-backend/infrastructure/.../AdminSystemStoreAdapter.java:311` | `LOC_<uuid>` (vị trí kho) |
| `java-backend/.../AdminSystemStoreAdapter.java:468` | `BRGS_<uuid>` |
| `java-backend/.../SystemSettingsStoreAdapter.java:124` / `:140` / `:216` | `LCN…` / `LTR…` / `SCOPE_<uuid>` |
| `java-backend/.../BoqStoreAdapter.java:436` | `MAPH_<uuid>` |
| `java-backend/.../MaterialCatalogStoreAdapter.java:327` | `UOM_<uuid>` |
| `java-backend/.../ProjectAdminStoreAdapter.java:68` / `:138` | `WH_<uuid>` / `PCC_<uuid>` |
| `java-backend/.../ProductionStoreAdapter.java:375` | `CDLI_<uuid>` |
| `java-backend/application/.../StockManagementUseCase.java:751,767,775,817,840` | `CSL_` / `OWN_` / `MOV_` |

### 2.2 Khoá kỹ thuật **CÓ PHẢI** khoá chính thật không? **CÓ.**

**CONFIRMED** — đo trực tiếp trên MySQL `vntech_erp`
(`information_schema.key_column_usage`, `constraint_name='PRIMARY'`):

```
material_requests   PRIMARY(id)
purchase_orders     PRIMARY(id)
goods_receipts      PRIMARY(id)
materials           PRIMARY(id)
projects            PRIMARY(id)
warehouses          PRIMARY(id)
users               PRIMARY(id)
audit_logs          PRIMARY(id)
stock_issues        PRIMARY(id)
teams               PRIMARY(id)
transfer_orders     PRIMARY(id)
central_returns     PRIMARY(id)
```

Và mã nghiệp vụ **cũng có ràng buộc UNIQUE riêng** (không trùng được) — **CONFIRMED**:

```
material_requests   material_requests_no_uidx      (request_no)
purchase_orders     purchase_orders_no_uidx        (po_no)
goods_receipts      goods_receipts_no_uidx         (receipt_no)
stock_issues        stock_issues_no_uidx           (issue_no)
transfer_orders     transfer_orders_uidx_transfer_no (transfer_no)
materials           materials_code_uidx            (code)
projects            projects_code_uidx             (code)
warehouses          warehouses_code_uidx           (code)
teams               teams_code_uidx                (code)
users               users_employee_code_uidx       (employee_code)
document_sequences  document_sequences_scope_uidx  (document_type, project_id, year)
```

### 2.3 ⚠️ MỘT SỰ THẬT QUAN TRỌNG: **CSDL có 0 khoá ngoại**

**CONFIRMED** — câu SQL:

```sql
SELECT COUNT(*) FROM information_schema.referential_constraints
 WHERE constraint_schema='vntech_erp';
-- Kết quả: 0
```

Nghĩa là: **không có ràng buộc nào ở tầng CSDL chặn việc sửa/xoá khoá**. Quan hệ giữa các
bảng **chỉ được giữ đúng nhờ mã nguồn ứng dụng**. Đây là lý do **phương án C** (đổi giá trị
`id` trong dữ liệu) cực kỳ nguy hiểm — xem §7.

### 2.4 Bảng tiền tố đang dùng thật (đo trên 123 bảng của MySQL)

Quét `SUBSTRING_INDEX(id,'_',1)` trên mọi bảng có cột `id` — các bảng **dùng đúng định
dạng `<TIỀN TỐ>_<GUID>`** (đếm số dòng thật):

| Tiền tố | Bảng | Số dòng | Ví dụ THẬT |
|---|---|---|---|
| `MR` | `material_requests` | 32/35 | `MR_a333870d-7e71-47a1-9479-1985c7d9b37e` |
| `MRI` | `material_request_items` | 55/59 | — |
| `PO` | `purchase_orders` | 13/17 | `PO_b85e4018-b1fd-4b4c-90d2-dfd545f3a3f0` |
| `POI` | `purchase_order_items` | 21/27 | — |
| `GRN` | `goods_receipts` | 17/22 | `GRN_1792713f-faaf-4986-b8c3-9c32714cea28` |
| `GRNI` | `goods_receipt_items` | 20/31 | — |
| `ISS` | `stock_issues` | 5/5 | `ISS_8ea44725-abec-4d66-b377-9809c3bfd110` |
| `RET` | `material_returns` | 4/4 | `RET_42077a18-3c21-4563-a1e5-ea302970f85f` |
| `RETI` | `material_return_items` | 4/4 | — |
| `MAT` | `materials` | 14/14 | `MAT_082196e5-02d0-45c5-84c2-eb2d0668566b` |
| `MAL` | `material_aliases` | 19/19 | — |
| `PRJ` | `projects` | 2/2 | `PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3` |
| `WH` | `warehouses` | 3/4 | `WH_51e0f009-4873-4cb6-855c-e6e7fea41e4d` |
| `WHTEAM` | `warehouses` (kho tổ đội) | — | `WHTEAM_3d658322-ae04-49a6-83cb-018748ac9fd3` |
| `USR` | `users` | 12/13 | `USR_8984cf69-c2d7-4162-bb4f-03ab51427e1e` |
| `AUD` | `audit_logs` | **907/907** | `AUD_8d2f697d-1fd0-4ab8-af74-ea255b31ecfe` |
| `SES` | `sessions` | **1401/1401** | — |
| `TEAM` | `teams` | 1/1 | `TEAM_8c1fecd9-1060-4f0f-849d-fa8d8dd75878` |
| `ATT` | `attachments` | 11/11 | — |
| `BOQ` | `project_boq_items` | 11/11 | `BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d` |
| `BQS` | `boq_source_items` | 11/11 | `BQS_dca3fab5-b096-4314-ae95-cc…` |
| `BQVER` | `boq_versions` | 4/4 | `BQVER_0390dda6-d4aa-4b4b-bf98-3a44ed24cc65` |
| `APR` | `approvals` | 124/124 | — |
| `PAL` | `procurement_allocations` | 98/98 | — |
| `SWF` | `supply_workflow_steps` | 57/57 | — |
| `CSL` | `contract_stock_ledger` | 25/25 | — |
| `MOV` | `stock_movements` | 5/5 | — |
| `WI` / `EVT` | `work_items` / `work_item_events` | 9/9 · 8/8 | — |
| `UMP` | `user_module_permissions` | 1046/1048 | — |
| `SCOPE` | `user_project_scopes` | 13/16 | — |

> **Lưu ý quan trọng:** tiền tố kỹ thuật **có thể KHÁC** tiền tố mã nghiệp vụ.
> Ví dụ: phiếu xuất kho có khoá là `ISS_…` nhưng **mã nghiệp vụ là `PX-…`**.
> **CONFIRMED** tại `java-backend/application/.../StockManagementUseCase.java:78`
> (`idGenerator.next("ISS")`) so với `:84` (`"PX-" + …`).
> ⇒ **Đừng suy mã nghiệp vụ từ tiền tố khoá** — hai thứ độc lập.

Có một số bảng **không dùng GUID** mà dùng **id đọc được** (danh mục hệ thống, seed cố
định) — **CONFIRMED**, ví dụ: `warehouses` có `WH-CENTRAL` (Kho Tổng),
`material_categories` có `CAT-DIEN`, `role_catalog` có `ROLE-admin`, `business_scope_catalog`
có `BSCOPE-HCPC`, `system_level_catalog` có `LVL-CEO`, `menu_group_catalog` có `MGR_<uuid>` lẫn
`mep`/`hr`/`finance`.

### 2.5 Bảng `document_sequences` — "sổ đếm số chứng từ"

**CONFIRMED** — bảng có **20 dòng** (đo thật, KHÔNG phải 18 như ghi chú cũ):

```sql
SELECT document_type, COUNT(*) FROM document_sequences GROUP BY document_type;
-- DNMH 4 · GRN 4 · PO 4 · PX 4 · RET 4  = 20 dòng
```

Cấu trúc: `id` = `'<LOẠI>:<projectId>:<năm>'`, `document_type`, `project_id`, `year`,
`last_number`. **UNIQUE** trên `(document_type, project_id, year)`.

**Cách hoạt động (CONFIRMED** — `RequestStoreAdapter.java:105-114`, cùng mẫu ở
`PurchaseStoreAdapter` và `WarehouseStockStoreAdapter`**):**

```sql
INSERT INTO document_sequences (id,document_type,project_id,`year`,last_number,updated_at)
VALUES (?,?,?,?,1,?)
ON DUPLICATE KEY UPDATE last_number=last_number+1, updated_at=VALUES(updated_at);
-- rồi đọc lại last_number
```

⇒ **Số thứ tự là bộ đếm tự động, đếm RIÊNG theo từng (loại chứng từ × dự án × năm).**
Đó là lý do vì sao mỗi dự án lại bắt đầu từ `0001`.

---

## PHẦN 3 — MÃ NGHIỆP VỤ: SINH Ở ĐÂU, THEO QUY TẮC NÀO

> **Ghi chú kỹ thuật:** hiện có **2 bản mã nguồn** cùng tồn tại — bản **Java** (đang phục vụ
> thật ở cổng `18081`, và qua proxy `9000`) và bản **JS monolith** (`scripts/system-route.mjs`).
> Cả hai sinh cùng định dạng. Các dòng dưới đây ghi **bản Java (đang chạy)**; bản JS tương
> ứng đã được liệt kê ở `TASK-111.md`.

### 3.1 Phiếu ĐỀ NGHỊ MUA HÀNG (ĐNMH) — câu hỏi chính

**CONFIRMED** — `java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java:91-92`:

```java
long seq = store.nextSequence("DNMH:" + projectId + ":" + year, "DNMH", projectId, year, Instant.now());
String requestNo = "DNMH-" + sv(project, "code").toUpperCase() + "-" + year + "-" + String.format("%04d", seq);
```

**Quy tắc:** `DNMH` + `-` + **MÃ DỰ ÁN** + `-` + **NĂM** + `-` + **SỐ THỨ TỰ 4 chữ số**.

**Số lấy từ ĐÂU:** từ bảng **`document_sequences`**, khoá `'DNMH:<projectId>:<năm>'`, mỗi
lần lập phiếu thì `last_number` **tăng 1**. Nếu chưa có dòng nào ⇒ bắt đầu `0001`.

**Ví dụ THẬT (vừa đo từ MySQL):**
`DNMH-PRJ-DEMO-01-2026-0001` … `DNMH-PRJ-DEMO-01-2026-0128`
(cột `material_requests.last_number` của dự án `PRJ-DEMO-01` năm 2026 hiện là **130**).

⇒ Người dùng **KHÔNG nhập** số phiếu này. Máy tự sinh.

### 3.2 Mã VẬT TƯ — chỗ dễ nhầm nhất

Có **HAI** thứ khác nhau, đừng lẫn:

| | Khoá kỹ thuật | Mã vật tư (nghiệp vụ) |
|---|---|---|
| Cột | `materials.id` | `materials.code` |
| Ví dụ | `MAT_082196e5-02d0-45c5-84c2-eb2d0668566b` | `KHAC-VLXD-001` |
| Máy sinh? | **MÁY** — `MaterialCatalogManagementUseCase.java:114` và `:589`: `m.id = idGenerator.next("MAT")` | **NGƯỜI DÙNG GÕ TAY** |
| Người dùng thấy? | Không (chỉ khi mở CSDL) | **CÓ — thấy ở mọi màn danh mục, BOQ, PO** |

**Người dùng có đặt tay được không? CÓ — CONFIRMED:**

`app/page.tsx:2502` (hộp thoại *Thêm/Sửa mã vật tư gốc*):

```tsx
<label><span>Mã vật tư gốc *</span><input name="code" required defaultValue={editing ? row?.code : ""} /></label>
```

Đây là **ô nhập tự do** (bắt buộc điền), không có gợi ý tự động. Server chỉ
**viết hoa** và **kiểm trùng** — **CONFIRMED**
`MaterialCatalogManagementUseCase.java:53` (`toUpperCase`), `:87-88`
(`materialCodeUsedElsewhere` ⇒ *"Mã vật tư đã tồn tại."*), `:91-95` (nếu **đổi** mã cũ thì
**bắt buộc nhập lý do** và ghi vào `material_code_history`).

**Cách đặt mã đang dùng trong dữ liệu thật:** `<MÃ HỆ>-<MÃ NHÓM>-<STT>`, ví dụ
`DIEN-DAY-CAD-001` (hệ ĐIỆN / nhóm Dây cáp điện / số 001). Quy ước này **do con người**,
**không phải máy** — máy không kiểm tra mẫu này.

**⚠️ ĐÍNH CHÍNH một hiểu nhầm cần thiết — CONFIRMED:**
`MaterialSystemCodes` (`java-backend/domain/src/main/java/com/vntech/erp/domain/service/MaterialSystemCodes.java`)
**KHÔNG sinh mã vật tư.** Lớp này chỉ:
- `canonicalMeCode(...)` → chuẩn hoá **MÃ HỆ M&E** (`Điện`→`DIEN`, `ELV`→`DNHE`, `CTN`,
  `HVAC`, `PCCC`, còn lại → `KHAC`) để ghi vào `materials.system`
  (`MaterialCatalogManagementUseCase.java:85`);
- `normalizeMaterialName(...)` → chuẩn hoá **TÊN** để so trùng;
- `internalGroupCode(...)` → sinh **mã nhóm nội bộ** (`Cáp điện động lực` →
  `CAP_DIEN_DONG_LUC`; rỗng → `CHUA_PHAN_NHOM`).

⇒ Không có "lớp sinh mã vật tư tự động" nào trong hệ thống hiện tại. **CONFIRMED (phủ định).**

### 3.3 Bảng tổng hợp: mỗi loại 1 dòng

> Cột "Tự động / Tay" nói về **mã nghiệp vụ**. Khoá kỹ thuật thì **luôn luôn là máy tự sinh**.

| Thực thể | Khoá kỹ thuật | Mã nghiệp vụ | Tự động / Tay | Nguồn (tệp:dòng) | Ví dụ THẬT từ MySQL |
|---|---|---|---|---|---|
| **Phiếu ĐNMH** | `MR_<guid>` | `DNMH-<DA>-<năm>-<4 số>` | **Tự động** (dãy số) | `RequestManagementUseCase.java:91-92` | `DNMH-PRJ-DEMO-01-2026-0128` |
| **Đơn mua (PO)** | `PO_<guid>` | `PO-<DA>-<năm>-<4 số>` | **Tự động** | `PurchaseManagementUseCase.java:169-172` | `PO-PRJ-DEMO-01-2026-0011` |
| **Phiếu nhập (GRN)** | `GRN_<guid>` | `GRN-<DA>-<năm>-<4 số>` | **Tự động** | `PurchaseManagementUseCase.java:320-321` | `GRN-PRJ-DEMO-01-2026-0005` |
| **Phiếu xuất/cấp phát** | `ISS_<guid>` ⚠️ khác tiền tố | `PX-<DA>-<năm>-<4 số>` | **Tự động** | `StockManagementUseCase.java:78-84` | `PX-PRJ-DEMO-01-2026-0012` |
| **Phiếu hoàn trả tổ đội** | `RET_<guid>` | `RET-<DA>-<năm>-<4 số>` | **Tự động** | `StockManagementUseCase.java:187` | `RET-PRJ-DEMO-01-2026-0008` |
| **Trả vật tư dư về Kho Tổng** | `CRET_<guid>` | `KT-RET-<DA>-<năm>-<4 số>` | **Tự động** | `StockManagementUseCase.java:480` | (chưa có dữ liệu) |
| **Phiếu điều chuyển** | `TRF_<guid>` | `TRF-<năm>-<5 số>` ⚠️ **không kèm mã dự án** | **Tự động** | `StockManagementUseCase.java:298` | (chưa có dữ liệu) |
| **Nhật ký thi công** | `CDL_<guid>` | `CDL-<DA>-<năm>-<4 số>` | **Tự động** | `ProductionManagementUseCase.java:395` | `CDL-PRJ-DEMO-01-2026-0001` |
| **Kế hoạch thanh toán** | `PPL_<guid>` | `PPL-<DA>-<4 số>` | **Tự động** | `FinanceManagementUseCase.java:70` | `PPL-PRJ-DEMO-01-0003` |
| **Phiếu tạm ứng** | `ADV_<guid>` | `TƯ-<5 số>` | **Tự động** | `FinanceManagementUseCase.java:133` | (chưa có dữ liệu) |
| **Sổ quỹ** | `CBE_<guid>` | `SQ-<6 số>` | **Tự động** | `FinanceManagementUseCase.java:279` | `SQ-000002` |
| **Hợp đồng giao khoán** | `TSC_<guid>` | **Người dùng gõ `contractNo`** | **Tay** | `ProductionManagementUseCase.java:231` | (chưa có dữ liệu) |
| **Định mức vật tư** | `MNR_<guid>` | `DM-<4 số>` | **Tự động** | `MaterialCatalogManagementUseCase.java:446` | (chưa có dữ liệu) |
| **Hợp đồng lao động** | `LBC_<guid>` | `HĐLĐ-<5 số>` | **Tự động** | `HrManagementUseCase.java:70` | `HĐLĐ-00002` |
| **Công văn** | `COR_<guid>` | **Người dùng gõ `docNo`** | **Tay** | `HrManagementUseCase.java:109` | `CV-2026-001` |
| **Bảo hiểm & chế độ** | `BEN_<guid>` | `BH-<5 số>` | **Tự động** | `HrManagementUseCase.java:223` | `BH-00001` |
| **Báo cáo sản lượng** | `PRD_<guid>` | không có mã; dùng `report_period` | — | `ProductionManagementUseCase.java:72` | kỳ `2026-08` |
| **Thu hồi vốn** | `REC_<guid>` | `referenceNo` do người dùng nhập | **Tay** | `ProductionManagementUseCase.java:129` | `THV-PRJ-DEMO-01-2026-09` |
| **Vật tư (danh mục)** | `MAT_<guid>` | `materials.code` | **TAY** (ô nhập `Mã vật tư gốc *`) | `app/page.tsx:2502`; `MaterialCatalogManagementUseCase.java:53` | `KHAC-VLXD-001` |
| **Dự án** | `PRJ_<guid>` | `projects.code` | **TAY** | `ProjectManagementUseCase.java:49` | `PRJ-DEMO-01` |
| **Kho công trường** | `WH_<guid>` | `warehouses.code` — mặc định `KHO-<MÃ DỰ ÁN>` nếu bỏ trống | **Tay, có mặc định tự động** | `ProjectManagementUseCase.java:58` | `KHO-PRJ-DEMO-01` |
| **Kho Tổng** | `WH-CENTRAL` (id đọc được!) | `KHO-TONG` | Seed cố định | — | `KHO-TONG` |
| **Kho tổ đội** | `WHTEAM_<guid>` | `TD-<MÃ TỔ ĐỘI>` | **Tự động** | `OpsTaskManagementUseCase.java:358-359` | `TD-PRJ-DEMO-01-TD-01` |
| **Tổ đội** | `TEAM_<guid>` | `teams.code` = mã toàn cục | **TAY** | `OpsTaskManagementUseCase.java:350-366` | `PRJ-DEMO-01-TD-01` |
| **Người dùng** | `USR_<guid>` | `users.employee_code` + `users.username` | **TAY** (cả hai ô nhập) | `UserManagementUseCase.java:61,63`; `app/page.tsx:2788` | `NV-TKHO` / `tkhodemo` |
| **Nhà cung cấp** | `SUP_<guid>` | `suppliers.code` | **TAY** | `SupplierManagementUseCase.java:32,48` | — |
| **Nhật ký kiểm toán** | `AUD_<guid>` | **KHÔNG có mã nghiệp vụ** | Máy | `AuditLogAdapter.java:55` | `AUD_8d2f697d-…` |

### 3.4 ⚠️ MỘT PHÁT HIỆN CẦN NGƯỜI DÙNG BIẾT: có **2 quy tắc sinh số PX/RET**

Trong dữ liệu THẬT có **hai định dạng** mã phiếu xuất/hoàn trả cùng tồn tại:

```
PX-PRJ-DEMO-01-2026-0007     ← bản Java (đang chạy)      (StockManagementUseCase.java:84)
PX-PRJ-DEMO-01-2026-0012
PX-SC012564-2026-0001        ← dự án khác, cùng quy tắc
RET-PRJ-DEMO-01-2026-0008    ← bản Java                  (StockManagementUseCase.java:187)
```

Bản JS cũ (`scripts/system-route.mjs:1698` và `:1703`) sinh **định dạng KHÁC**:

```
PX-<YYMMDD>-<4 số cuối của đồng hồ>    ví dụ PX-260918-1234
RET-<YYMMDD>-<4 số cuối của đồng hồ>
```

⇒ **CONFIRMED.** Hai định dạng này **không cùng quy tắc**. Hiện dữ liệu đang dùng đúng bản
Java, nhưng nếu có phiếu nào lọt qua nhánh JS cũ thì mã sẽ khác mẫu. **Đây là điểm cần theo
dõi** (đã ghi vào `TASK-111.md`).

### 3.5 Phiếu ĐNMH — có phải "mã hoá" gì không?

Không. `DNMH-PRJ-DEMO-01-2026-0128` được đọc thẳng ra là:
**ĐNMH · dự án PRJ-DEMO-01 · năm 2026 · phiếu thứ 128**. **CONFIRMED.** Không có ký tự nào
bị ẩn.

---

## PHẦN 4 — CHỖ NÀO ĐANG HIỆN GUID CHO NGƯỜI DÙNG

Đây **CHÍNH LÀ GỐC** của sự khó hiểu. Kết quả quét `app/**` + payload API:

### 4.1 🔴 Màn "Nhật ký kiểm toán" — hiện GUID ở 2 cột

**CONFIRMED** — `app/page.tsx` (component `AuditLogManager`, khai báo tại dòng `1953`):

| Dòng | Cột hiển thị | Giá trị thực tế |
|---|---|---|
| **`2042`** | **"Đối tượng"**: `{a.entityId}` | `PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3`, `MR_46cee316-…`, `USR_8984cf69-…` |
| **`2057`** | **"Mã bản ghi"** (khi bấm *Xem*): `{a.id}` | `AUD_8d2f697d-1fd0-4ab8-af74-ea255b31ecfe` |

Đối chiếu payload API thật (đã đo ở §6): mỗi dòng audit có
`entityId = "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3"` — **là GUID thô**, và
`entityType = "requests"` — **là tên bảng, không phải mã nghiệp vụ**.
⇒ **Đây là nơi dễ khiến người dùng tưởng "dữ liệu bị mã hoá" nhất.**

### 4.2 🔴 Xuất Excel/CSV BOQ — cột "Mã dòng BOQ" chứa GUID

**CONFIRMED** — `lib/boq-export.ts:70` và `:77`, cột thứ 2 có tiêu đề
**"Mã dòng BOQ"** nhưng giá trị là:

```ts
String(r.id || "")     // = BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d
```

dù ghi chú ngay trong tệp nói *"Mã dòng BOQ là khóa đối chiếu, không được thay đổi"*
(`lib/boq-export.ts:71`). ⇒ Người dùng **tải Excel về là thấy GUID**.

### 4.3 🟠 "Dòng nguồn" trong Lịch sử thay đổi BOQ

**CONFIRMED** — `app/screens/BoqControl.tsx:73`:

```tsx
<td>{row.sourceItemId || "Toàn phiên bản"}</td>
```

`sourceItemId` = `BQS_dca3fab5-b096-4314-ae95-cc…` ⇒ hiện GUID.

### 4.4 🟠 Modal chi tiết thực thể — hiện GUID khi thiếu mã

**CONFIRMED** — `app/components/ui/EntityDetailModal.tsx:117`:

```tsx
{entityId && <code className="edm-entity-id" title="Mã thực thể">{entityId}</code>}
```

Nguồn truyền vào:

| Nơi gọi | Dòng | Giá trị | Có hiện GUID? |
|---|---|---|---|
| `app/screens/ProjectEntityModal.tsx` | `174` | `String(row.code \|\| row.id \|\| "")` | **CÓ** — khi thực thể **không có cột `code`**. Ví dụ mở chi tiết **người dùng**: `users` có `employee_code`/`username` nhưng **không có `code`** ⇒ hiện `USR_<guid>` |
| `app/screens/PurchaseOrderDrawer.tsx` | `30` | `purchaseOrder.poNo \|\| purchaseOrder.id` | Chỉ khi `poNo` rỗng |
| `app/screens/RequestDrawer.tsx` | `46` | `request.requestNo` | Không (an toàn) |

Thêm 3 chỗ trong **cùng** `ProjectEntityModal.tsx`:
- dòng `116`: cột **"Tổ đội"** = `member.teamId` ⇒ hiện `TEAM_8c1fecd9-…` (không có `teamCode` đi kèm);
- dòng `115`: `scope.projectCode || scope.projectId` ⇒ **dự phòng** hiện GUID;
- dòng `117`: `scope.warehouseCode || scope.warehouseId` ⇒ **dự phòng** hiện GUID.

### 4.5 🟠 Danh sách GRN trong chi tiết PO

**CONFIRMED** — `app/screens/PurchaseOrderDrawer.tsx:34`, cột **"Mã GRN"** và cảnh báo
"GRN RỖNG DÒNG" đều dùng `receipt.receiptNo || receipt.id` ⇒ rơi về GUID khi thiếu số.

### 4.6 🟠 Nút xuất CSV danh sách phiếu

**CONFIRMED** — `app/page.tsx:2818`:

```ts
Ma: row.requestNo || row.poNo || row.receiptNo || row.id
```

⇒ cột **"Mã"** của tệp CSV rơi về GUID khi cả 3 mã đều rỗng.

### 4.7 🟠 "Số chứng từ" trong màn Tổ đội / Dòng thời gian dự án

**CONFIRMED**:
- `app/screens/TeamDirectory.tsx:481` — `String(row[source.keyField] || row.id || "—")`
- `app/screens/TeamManagement.tsx:122` — `String(r[g.noKey] || r.id || "—")`
- `app/screens/ProjectDetailTabs.tsx:87, 91, 95, 100` — nhãn mốc thời gian
  `String(row.requestNo || row.id)`, `row.poNo || row.id`, `row.receiptNo || row.id`,
  `row.taskNo || row.id`

### 4.8 ✅ Kết luận mục 4

> **Người dùng CÓ bắt buộc phải thấy GUID không? KHÔNG — trừ 1 màn.**
>
> * **Bắt buộc, luôn luôn thấy:** **Nhật ký kiểm toán** (`app/page.tsx:2042` và `:2057`) —
>   không có cách nào khác để biết đối tượng nào bị tác động, vì payload **chỉ** trả
>   `entityId` (GUID) + `entityType` (tên bảng).
> * **Bắt buộc, luôn luôn thấy:** **Xuất Excel/CSV BOQ** — cột *"Mã dòng BOQ"*
>   (`lib/boq-export.ts:70,77`).
> * **Thấy có điều kiện (chỉ khi thiếu mã):** tất cả mục 4.3–4.7.
> * **Bình thường KHÔNG thấy:** danh sách phiếu (hiện `request_no`/`po_no`/`receipt_no`),
>   danh mục vật tư (hiện `code`), dự án (hiện `code`), kho (hiện `code`).

---

## PHẦN 5 — VÌ SAO DÙNG GUID THAY VÌ SỐ TỰ TĂNG?

⚠️ Đây là câu hỏi **không thể trả lời chắc chắn** — và cần nói thẳng.

### 5.1 Lý do **ĐƯỢC GHI LẠI** trong kho mã

| Nội dung | Nơi ghi | Nhãn |
|---|---|---|
| Định dạng `<prefix>_<uuid>` phải **giống hệt bản JS monolith** để chuyển sang Java không phá dữ liệu | `java-backend/infrastructure/.../UuidIdGenerator.java:8` | **CONFIRMED** |
| Kế hoạch chuyển CSDL: `AUTOINCREMENT`/sqlite → `AUTO_INCREMENT`; **`document_sequences` giữ logic riêng** | `docs/09_KE_HOACH_CHUYEN_SANG_JAVA_MYSQL.md:218` | **CONFIRMED** |

**Chú ý:** cả hai đều là lý do **kỹ thuật khi chuyển đổi**, **KHÔNG phải** lý do thiết kế
ban đầu.

### 5.2 Lý do **SUY RA ĐƯỢC** từ kiến trúc (không có văn bản nào ghi)

| Nội dung | Căn cứ | Nhãn |
|---|---|---|
| Ứng dụng từng chạy **đa CSDL** (Cloudflare **D1** / **SQLite** / **PostgreSQL 16**) qua adapter viết tay, có script `migrate-postgres.mjs` và `migrate-sqlite-to-mysql.mjs` ⇒ khoá dạng **GUID (chuỗi)** an toàn hơn số tự tăng khi cùng dữ liệu tồn tại ở nhiều CSDL/khôi phục từ nơi khác | `docs/01_BAO_CAO_PHAN_TICH_DU_AN.md:30,32`; `docs/02_HUONG_DAN_DEV_MOI.md:59-60`; `java-backend/tools/migrate-sqlite-to-mysql.mjs` | **LIKELY** |
| Có tính năng **lưu trữ offline theo dự án rồi gỡ khỏi hệ thống** (`PURGE_AFTER_OFFLINE_ARCHIVE`, `project_archives`) ⇒ ID phải **duy nhất toàn cầu**, không phụ thuộc bộ đếm của CSDL | `app/api/files/route.ts:121,140`; `TASK-046` | **LIKELY** |
| Khoá GUID tách bạch khỏi mã nghiệp vụ ⇒ **đổi mã nghiệp vụ được** mà không phá liên kết (đúng như cơ chế `material_code_history` đang làm) | `MaterialCatalogManagementUseCase.java:91-95` | **LIKELY** |

### 5.3 Lý do **KHÔNG TÌM THẤY** ⇒ **UNKNOWN**

Đã tìm ở: `docs/**` (grep `UUID`, `GUID`), **toàn bộ lịch sử git** (`git log --all --grep`
`UUID`/`GUID`), các kế hoạch kiến trúc, các file `TASK-*.md`.

> **UNKNOWN #1:** **Không có tài liệu nào ghi lại quyết định "vì sao chọn GUID thay vì số
> tự tăng"** tại thời điểm thiết kế ban đầu.
>
> Tài liệu `docs/20_KE_HOACH_CHINH_SUA_GIAO_DIEN_VA_DU_LIEU.md` có nhắc chủ đề này (mục
> **2.3 dòng 109** và **§6 Q1 — dòng 327**) nhưng **chỉ nêu vấn đề và 3 phương án A/B/C**,
> **chưa chốt**, và **cũng không nêu lý do lịch sử**.
>
> ⇒ **Không tự bịa lý do.** Nếu cần biết chắc, phải hỏi người thiết kế hệ thống ban đầu.

Tài liệu `docs/20_…:122` có một ghi nhận đáng chú ý (**CONFIRMED**):

> 👉 **`WH-CENTRAL` chứng minh tiền lệ:** hệ thống đã từng dùng ID sạch cho Kho Tổng, tức
> hạ tầng **không bắt buộc** phải là hash. Vấn đề thuần tuý là **quy ước sinh ID**.

---

## PHẦN 6 — PAYLOAD `/api/system` (bootstrap) TRẢ GÌ?

**Đã đo thật** bằng cách đăng nhập `admin` vào **Java API `http://127.0.0.1:18081`** và gọi
`GET /api/system` (chỉ ĐỌC):

```bash
curl.exe -s -c cookies.txt -X POST http://127.0.0.1:18081/api/system \
  -H "Content-Type: application/json" \
  --data-binary '{"action":"login","username":"admin","password":"Admin123456@"}'
curl.exe -s -b cookies.txt http://127.0.0.1:18081/api/system
```

**Kết quả:** HTTP 200 · **71 nhóm dữ liệu dạng mảng**.

### 6.1 ✅ Mỗi bản ghi trả **CẢ `id` LẪN mã nghiệp vụ** — CONFIRMED

| Nhóm dữ liệu | Trường mã nghiệp vụ đi kèm `id` |
|---|---|
| `requests` (35) | `requestNo`, `projectCode`, `contractNo`, `boqVersionCode`, `teamName` |
| `purchaseOrders` (17) | `poNo`, `requestNo` |
| `receipts` (22) | `receiptNo`, `poNo`, `deliveryNoteNo` |
| `issues` (2) | `issueNo` (ví dụ `PX-PRJ-DEMO-01-2026-0012`) |
| `returns` (1) | `returnNo` |
| `materials` (14) · `adminMaterials` (14) | `code` |
| `projects` (2) · `adminProjects` (2) | `code`, `contractNo` |
| `warehouses` (4) · `transferWarehouses` (4) | `code` |
| `users` (13) · `staffDirectory` (13) | `employeeCode`, `username`, `organizationCode` |
| `paymentPlans` (3) | `planNo` |
| `cashbookEntries` (2) | `entryNo` |
| `laborContracts` (2) | `contractNo` |
| `officialCorrespondence` (1) | `docNo` |
| `benefitRecords` (1) | `benefitNo` |
| `constructionDailyLogs` (1) | `logNo` |
| `workItems` (7) | `taskNo`, `sourceNo` |
| `contractStockLedger` (25) | `contractNo` |
| `companyAvailability` (4) | `warehouseCode`, `projectCode`, `materialCode` (không có `id`) |
| `inventory` (28) | `projectCode`, `warehouseCode`, `materialCode` (không có `id`) |

⇒ **CONFIRMED: bootstrap trả CẢ HAI.** Giao diện vì vậy **có đủ thông tin** để chỉ hiển thị
mã nghiệp vụ. Việc một số màn vẫn hiện GUID (§4) là **lựa chọn ở tầng hiển thị**, **không
phải do thiếu dữ liệu**.

### 6.2 ⚠️ Các trường **chỉ** trả GUID (không kèm mã/tên)

**CONFIRMED** — đo trên payload thật. Đây là các **khoá ngoại**; giao diện phải tự tra sang
nhóm dữ liệu khác. **Nếu màn nào quên tra thì sẽ hiện GUID.** Ví dụ điển hình:

| Nhóm · trường | Giá trị thật |
|---|---|
| `audits.entityId` | `PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3` ⚠️ **chính là màn §4.1** |
| `constructionDailyLogItems.boqItemId` | `BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d` |
| `constructionDailyLogItems.logId` | `CDL_a23434af-c175-44ae-a9f6-ce5f114440c4` |
| `contractStockLedger.referenceId` / `.referenceItemId` | `ISS_8ea44725-…` / `SMII_f48ffeec-…` |
| `supplySteps.requestId` / `.purchaseOrderId` / `.receiptId` | `MR_00b80951-…` / `PO_2fd3bda0-…` / `GRN_e5f9763c-…` |
| `workItemEvents.workItemId` / `.actorUserId` | `WI_d455a522-…` / `USR_c51d95b2-…` |
| `materialAliases.materialId` | `MAT_499cdcf2-…` |
| `userScopes.userId` / `.projectId` | `USR_2f435847-…` / `PRJ_cfba8c1a-…` |
| `teamMembers.teamId` / `.userId` | `TEAM_8c1fecd9-…` / `USR_8869ca60-…` ⚠️ **chính là màn §4.4** |
| `activeSessions.userId` | `USR_2f435847-…` |
| `paymentPlans.poId` / `capitalRecoveryRecords.productionReportId` | `PO_b85e4018-…` / `PRD_73fe17a6-…` |
| `boqItems.sourceItemId` / `boqSourceItems.projectBoqItemId` | `BQS_dca3fab5-…` / `BOQ_762fd4c7-…` |
| `boqChangeHistory.projectBoqItemId` / `.sourceItemId` / `.actorUserId` | `BOQ_64e585e9-…` / `BQS_4881dd12-…` / `USR_2f435847-…` |
| `modulePermissions.userId`, `departmentModulePermissions.organizationUnitId`, `workflowStepApprovers.stepId`/`.userId`, `workflowAssignments.ownerUserId`, `cashbookEntries.accountId`/`.referenceId` | …GUID… |

> **Lưu ý phát hiện thêm:** `cashbookEntries.referenceId` đang chứa
> `PRJ_fdbfab20-…` — tức **một mã dự án bị nhét vào ô "mã tham chiếu"**. Đây là dữ liệu
> **lẫn loại**, cần người dùng biết (không phải lỗi hiển thị).

### 6.3 Trả lời câu hỏi "người dùng có BẮT BUỘC thấy GUID ở đâu không?"

> **Có — nhưng chỉ ở 2 chỗ:** màn **Nhật ký kiểm toán** (`app/page.tsx:2042`, `:2057`) và tệp
> **xuất Excel/CSV BOQ** (`lib/boq-export.ts:70`, `:77`).
>
> **Mọi chỗ còn lại:** người dùng **chỉ thấy GUID khi mở trực tiếp CSDL** bằng công cụ quản
> trị MySQL — **không** thấy trên giao diện, trừ các trường hợp **dự phòng** đã liệt kê ở §4.3–4.7
> (khi mã nghiệp vụ bị rỗng).

**CONFIRMED.**

---

## PHẦN 7 — ĐỀ XUẤT CHỈNH DỮ LIỆU: BẢNG PHƯƠNG ÁN

> ⚠️ **Người dùng nói *"việc cần làm là chỉnh sửa lại data"*.** Mục này trình bày các đường
> đi, **kèm đánh giá trung thực** — **kể cả đường KHÔNG nên đi**.
> **Lượt này KHÔNG sửa gì.** Người dùng chọn xong mới thi công.

### Bảng so sánh

| | Phương án | Làm gì | Ảnh hưởng | Sửa mã hay chỉ sửa dữ liệu? | Rủi ro | Cần migration? |
|---|---|---|---|---|---|---|
| **A** | **Giữ khoá GUID — chỉ đổi cách HIỂN THỊ** ⭐ | Sửa **duy nhất** các chỗ ở §4 để **luôn** hiện mã nghiệp vụ + tên; cấm hiện `<PREFIX>_<GUID>` trên UI và trên tệp xuất. Nhật ký kiểm toán: tra `entityId` → mã nghiệp vụ thật rồi mới hiện (kèm dòng "bản ghi cũ, không tra được" khi không có). Excel BOQ: đổi cột *"Mã dòng BOQ"* sang `contract_line_ref`/`boq_code` thay vì `id`. | Chỉ tệp giao diện: `app/**`, `lib/boq-export.ts`. **Dữ liệu KHÔNG đổi một ô nào.** | **Chỉ sửa mã nguồn hiển thị. KHÔNG sửa dữ liệu.** | 🟢 **Thấp** — không có câu `UPDATE` nào, rollback = hoàn tác commit | **Không** |
| **B** | **Thêm cột mã hiển thị (additive)** | Với thực thể **còn thiếu** mã nghiệp vụ (ví dụ `contract_stock_ledger.reference_id`, `material_aliases`, `workflow_step_approvers`), **thêm cột** `*_code`/`*_no` **mới** và **backfill** từ bảng gốc. Cột cũ giữ nguyên. | Thêm cột — **không phá dữ liệu cũ**. Tăng nhẹ dung lượng. | **Sửa cả mã (schema + truy vấn) VÀ dữ liệu (backfill).** | 🟡 Trung bình — backfill có thể sai nếu dòng trỏ tới bản ghi đã bị xoá (đã có **tiền lệ thật**: `material_request_items` mồ côi trỏ tới `MR_46cee316-…` **không tồn tại**; 5 dòng `user_project_scopes` mồ côi) | **Có** — 1 file `drizzle/00NN_*.sql` mới |
| **C** | 🔴 **Đổi giá trị `id` trong dữ liệu** | `UPDATE` cột `id` của mọi bảng sang dạng dễ đọc (ví dụ `DNMH-…`). | **PHÁ VỠ MỌI THAM CHIẾU.** `materials.category_id`, `material_request_items.request_id`, `purchase_order_items.purchase_order_id`, `stock_movements.material_id`, `contract_stock_ledger.*`, `user_project_scopes.*`, `approvals.*`, `audit_logs.entity_id`… **hàng chục bảng**. | **Sửa dữ liệu (rất lớn) + sửa mã sinh ID.** | 🔴 **CỰC CAO — KHUYẾN NGHỊ KHÔNG LÀM** | Có (nhưng không đủ an toàn) |
| **D** | **Chỉ chuẩn hoá MÃ NGHIỆP VỤ (không đụng khoá)** | Giữ nguyên `id`, chỉ **rà & đổi** các `code`/`no` chưa theo quy ước (ví dụ mã vật tư không theo `<HỆ>-<NHÓM>-<STT>`), dùng đúng cơ chế **`material_code_history`** đã có sẵn. | Chỉ đổi cột `code` — **liên kết an toàn** vì liên kết đi qua `id`. | **Chỉ sửa dữ liệu (cột `code`), KHÔNG sửa mã.** | 🟢 Thấp–Trung bình — nhưng **mã đã in trên hồ sơ giấy/Excel cũ sẽ khác mã mới**, cần người dùng chấp nhận | Không (dùng API `save_material`/`merge_material_master`) |

### ⚠️ Vì sao phương án (C) là **BẪY CHẾT** — giải thích cụ thể

**CONFIRMED:** CSDL có **0 khoá ngoại** (§2.3). Nghĩa là:

1. Khi `UPDATE materials SET id='VL-CAPDIEN' WHERE id='MAT_8b585b8f-…'`, **MySQL KHÔNG báo
   lỗi gì cả** — câu lệnh trả `OK`.
2. Nhưng mọi bảng khác vẫn giữ giá trị cũ `MAT_8b585b8f-…` ở cột `material_id`.
   **Không có ràng buộc nào chặn, cũng không có cảnh báo nào.**
3. Hậu quả: **BOQ mất vật tư, PO/GRN mất dòng, tồn kho sai, ledger sai** — và **không thể
   phát hiện bằng mắt** vì vẫn hiện tên/mã cũ ở những chỗ khác.
4. Muốn làm đúng thì phải `UPDATE` **theo đúng thứ tự phụ thuộc** ở hàng chục bảng — trong
   khi **không có FK nào giúp kiểm tra**. Sai một bảng ⇒ dữ liệu hỏng âm thầm.
5. Tệ nhất: `audit_logs.entity_id` (**907 dòng**) và `sessions`/`user_module_permissions`
   (**hàng nghìn dòng**) cũng chứa GUID. Chúng **không có bảng gốc để đối chiếu** ⇒ **không
   thể nối lại chính xác** sau khi đổi.

> 🔴 **KHUYẾN NGHỊ: KHÔNG LÀM PHƯƠNG ÁN (C).**
> Nó **không giải quyết** nỗi khó hiểu (vì giao diện vẫn phải sửa — tức vẫn phải làm A),
> nhưng lại **đánh đổi bằng toàn bộ tính toàn vẹn dữ liệu**.

### ⭐ KHUYẾN NGHỊ CỦA TÔI

> ### Chọn **(A)** — và **cân nhắc thêm (B)** ở phạm vi hẹp.
>
> **Vì sao (A) là đủ:**
> 1. Nỗi khó hiểu của người dùng đến từ **giao diện hiện GUID** (§4) — **không** đến từ việc
>    CSDL lưu GUID. CSDL lưu gì thì người dùng không thấy.
> 2. Đã chứng minh: payload **đã có sẵn** mã nghiệp vụ (§6.1) ⇒ **không cần thêm dữ liệu gì**.
> 3. Chỉ sửa **~8 vị trí** trong `app/**` + `lib/boq-export.ts` ⇒ **nhỏ, an toàn, rollback dễ**.
> 4. **Không một câu `UPDATE` nào** ⇒ **không có rủi ro mất dữ liệu**.
> 5. Đúng với tiền lệ đã có trong tài liệu: `docs/20_…:331` xếp phương án "giữ hash, `code`
>    thành định danh hiển thị" là **rủi ro 🟢 Thấp**, và `docs/20_…:122` đã khẳng định
>    *"hạ tầng không bắt buộc phải là hash"*.
>
> **Khi nào cần thêm (B):** chỉ khi người dùng muốn **một số bảng phụ** (như
> `contract_stock_ledger`, `material_aliases`) cũng có cột mã để **xuất báo cáo** mà không
> phải tra chéo. Khi đó làm **additive + backfill**, và **phải xử lý trước các dòng mồ côi**
> đã biết (xem §8).

### "Cần sửa dữ liệu gì?" — trả lời gọn

| Chọn | Phải sửa DỮ LIỆU gì? |
|---|---|
| **(A)** | **KHÔNG sửa gì.** Chỉ sửa giao diện. |
| **(B)** | **CÓ** — thêm cột (migration) + **backfill** mã từ bảng gốc; và **phải dọn/đánh dấu dòng mồ côi trước** (nếu không sẽ backfill ra `NULL` hoặc sai). |
| **(C)** | **CÓ, rất lớn và rất nguy hiểm** ⇒ **KHÔNG LÀM.** |
| **(D)** | **CÓ** — chỉ cột `code`, qua API có sẵn; **không đụng `id`**. An toàn. |

---

## PHẦN 8 — UNKNOWN & CÂU HỎI CẦN NGƯỜI DÙNG CHỐT

### UNKNOWN (nói thẳng là chưa biết)

| # | Nội dung | Đã tìm ở đâu |
|---|---|---|
| **U1** | **Lý do thiết kế ban đầu của việc dùng GUID thay vì số tự tăng** — không có văn bản nào ghi lại. (§5.3) | `docs/**` (grep `UUID`/`GUID`) · **toàn bộ** `git log --all` · kế hoạch kiến trúc · `TASK-*.md` |
| **U2** | **Ý nghĩa/nguồn của `cashbookEntries.referenceId` = `PRJ_fdbfab20-…`** — một mã dự án nằm trong ô "mã tham chiếu" của sổ quỹ. Không rõ đây là chủ ý hay lỗi nhập. | đọc payload thật §6.2 |
| **U3** | **Hai định dạng mã PX/RET cùng tồn tại** — có phiếu nào thực tế đã sinh bằng nhánh JS cũ (`PX-YYMMDD-…`) không? Dữ liệu hiện tại đều theo bản Java. | §3.4 |
| **U4** | **Danh sách thực thể "cần" có mã nghiệp vụ** — đây là **quyết định nghiệp vụ**, không suy ra được từ mã nguồn. | — |

### ❓ CÂU HỎI CẦN NGƯỜI DÙNG CHỐT (tôi KHÔNG tự chọn)

**Q1 — Chọn phương án nào?**
- ☐ **(A)** Chỉ đổi cách hiển thị *(khuyến nghị)*
- ☐ **(A) + (B)** Đổi hiển thị + thêm cột mã cho một số bảng phụ *(nếu cần xuất báo cáo)*
- ☐ **(D)** Chỉ chuẩn hoá lại mã nghiệp vụ theo quy ước
- ☐ **(C)** Đổi giá trị `id` — **tôi cần người dùng xác nhận đã đọc kỹ cảnh báo §7**

**Q2 — Ở màn "Nhật ký kiểm toán", muốn hiển thị gì ở cột "Đối tượng"?**
*(hiện đang hiện GUID — `app/page.tsx:2042`)*
- ☐ Hiện **mã nghiệp vụ** (ví dụ `DNMH-PRJ-DEMO-01-2026-0128`) — cần tra ngược, và với bản ghi
  cũ mà đối tượng đã bị xoá thì hiện *"bản ghi đã xoá"*
- ☐ Hiện **cả hai**: mã nghiệp vụ + GUID nhỏ bên dưới *(dễ tra cứu kỹ thuật)*
- ☐ Giữ nguyên GUID

**Q3 — Cột "Mã dòng BOQ" khi xuất Excel/CSV hiện đang là GUID
(`lib/boq-export.ts:70`). Đổi sang cột nào?**
- ☐ `contract_line_ref` (STT theo hợp đồng — cột đã có ngay bên cạnh)
- ☐ `boq_code`
- ☐ Bỏ hẳn cột này

**Q4 — Có cần thêm cột mã hiển thị (phương án B) cho bảng nào không?** Nếu có, xin liệt kê
màn/báo cáo cụ thể cần dùng.

**Q5 — Mã vật tư hiện do người dùng gõ tay** (`app/page.tsx:2502`). Người dùng có muốn hệ
thống **tự gợi ý** mã theo quy ước `<MÃ HỆ>-<MÃ NHÓM>-<STT>` không? *(Đây là yêu cầu TÍNH
NĂNG mới, không phải sửa dữ liệu.)*
- ☐ Có — tự sinh gợi ý, người dùng vẫn sửa được
- ☐ Có — bắt buộc theo quy ước, không cho sửa
- ☐ Không — giữ nguyên như hiện tại

---

## PHỤ LỤC — CÁCH TỰ KIỂM CHỨNG

```sql
-- 1. Khoá kỹ thuật có phải PRIMARY KEY?
SELECT table_name, GROUP_CONCAT(column_name ORDER BY ordinal_position)
  FROM information_schema.key_column_usage
 WHERE table_schema='vntech_erp' AND constraint_name='PRIMARY'
   AND table_name IN ('material_requests','purchase_orders','materials','projects')
 GROUP BY table_name;

-- 2. Có khoá ngoại nào không?  (kết quả THẬT: 0)
SELECT COUNT(*) FROM information_schema.referential_constraints
 WHERE constraint_schema='vntech_erp';

-- 3. Sổ đếm số chứng từ (kết quả THẬT: 20 dòng)
SELECT document_type, COUNT(*) FROM document_sequences GROUP BY document_type;

-- 4. Xem 2 loại mã song song
SELECT id, request_no FROM material_requests ORDER BY request_no LIMIT 5;
SELECT id, po_no       FROM purchase_orders   ORDER BY po_no       LIMIT 5;
SELECT id, receipt_no  FROM goods_receipts    ORDER BY receipt_no  LIMIT 5;
SELECT id, code, `system` FROM materials      ORDER BY code        LIMIT 14;
```

```powershell
# 5. Bootstrap trả gì (chỉ ĐỌC)
curl.exe -s -c cookies.txt -X POST http://127.0.0.1:18081/api/system `
  -H "Content-Type: application/json" `
  --data-binary '{"action":"login","username":"admin","password":"Admin123456@"}'
curl.exe -s -b cookies.txt http://127.0.0.1:18081/api/system
```

---

*Tài liệu này do kỹ sư AUDIT lập, chỉ ĐỌC dữ liệu và GHI tài liệu — KHÔNG sửa mã nguồn,
KHÔNG sửa dữ liệu. Nhật ký đo chi tiết + câu SQL + tệp:dòng: xem `docs/agent-progress/TASK-111.md`.*
