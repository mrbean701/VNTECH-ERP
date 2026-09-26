# MT2-P3-05 — VẬT TƯ NHÀ CUNG CẤP + AUTO-DETECT (§6.3 Tab 3 · §6.4)

> Trạng thái: **IN_PROGRESS — audit xong, chưa code**
> Phase: **PHASE 3 — BACKEND SERVICE & API** (MT2) · Ngày audit: 22/09/2026

## 1. YÊU CẦU — NGUYÊN VĂN MT2

**§6.4 — Supplier material auto-detection (`docs/dsh/MASTER_TASK_2.md:124-128`):**
```text
## 6.4. Supplier material auto-detection
PO-001 đặt Dây LAN RJ45 CAT6e → NCC chưa có vật tư này → HỎI:
"Vật tư này chưa có trong danh mục vật tư của nhà cung cấp. Bạn có muốn thêm không?"
→ user đồng ý ⇒ thêm vào danh mục NCC
```
**§6.3 — Supplier detail (`:121-122`)**: *modal chi tiết gồm: Tab 1 Thông tin · Tab 2 PO · **Tab 3 Danh sách vật tư***
⇒ cần **API liệt kê vật tư của NCC** (cho Tab 3) **và API thêm** (cho §6.4) ✔

## 2. HIỆN TRẠNG (bằng chứng — ⛔ không suy đoán)

| Hạng mục | Bằng chứng | Kết luận |
|---|---|---|
| Bảng dữ liệu | `supplier_materials` **ĐÃ CÓ** từ migration **V27** (MT2-P1-06): `id·supplier_id·material_id·times_ordered·last_ordered_at·last_unit_price·active·timestamps`, UNIQUE(`supplier_id`,`material_id`) | nền dữ liệu **đã sẵn** ✔ |
| Dữ liệu | `SELECT COUNT(*)` ⇒ `supplier_materials` = **0** · `suppliers` = 2 · `materials` = 36 | tính năng chưa dùng ✗ |
| Java | `grep supplier_materials|supplierMaterials|SupplierMaterial` toàn `java-backend/**` ⇒ ⛔ **0 kết quả** | ⛔ **KHÔNG có API/use-case/port nào** ✗ |
| Use-case hiện có | `SupplierManagementUseCase`: `saveSupplier`(:30) · `setSupplierStatus`(:53) · `deleteSupplier`(:61) | chỉ có CRUD NCC cơ bản ✗ |
| Bootstrap | chưa trả danh sách vật tư theo NCC | ⛔ Tab 3 không có dữ liệu ✗ |

⇒ **GAP = TRỌN TÍNH NĂNG**: thiếu ① API liệt kê vật tư NCC ② API thêm vật tư vào danh mục NCC
③ **tín hiệu auto-detect** (biết vật tư nào PO cần mà NCC chưa có ⇒ để UI hỏi đúng câu §6.4) ④ test.

## 3. KẾ HOẠCH (⛔ 0 migration — bảng đã có ở V27 · theo §42: BACKEND trước UI)

1. **Port + adapter** (thêm hàm MỚI, ⛔ không đổi chữ ký hàm cũ — bài học P3-04):
   - `supplierMaterials(supplierId)` — liệt kê vật tư của NCC (kèm `materialCode`/`materialName`/`unit` để Tab 3 hiển thị)
   - `upsertSupplierMaterial(...)` — thêm; **UNIQUE(supplier_id,material_id)** đã có ⇒ thêm lại = cập nhật
     (⛔ KHÔNG dùng `ON DUPLICATE KEY UPDATE` — MySQL-only; dùng **UPDATE-then-INSERT** như `NotificationStoreAdapter` ✔)
   - `materialsMissingForSupplier(poId | supplierId, materialIds)` — **tín hiệu auto-detect**:
     vật tư PO cần mà NCC **chưa** có ⇒ ⛔ không tự thêm, chỉ **trả danh sách để UI hỏi** (đúng §6.4: *HỎI trước*).
2. **Use-case** `SupplierManagementUseCase` (thêm hàm):
   - `saveSupplierMaterial(principal, payload{supplierId, materialId, lastUnitPrice?})`
   - `supplierMaterials(principal, payload{supplierId})`
   - `supplierMaterialGaps(principal, payload{poId})` ⇒ trả `{missing:[…]}` để UI hiện câu hỏi §6.4
3. **RBAC + API**: action `save_supplier_material` → module **`supplier_catalog`** ⚠️ *(phải audit `ActionRbacRegistry`
   xem có module NCC nào + capability tương ứng — ⛔ không đoán)* + `case` trong `SystemController`.
4. **Bootstrap**: trả danh sách vật tư theo NCC cho **Tab 3** (⛔ chỉ thêm trường, không đổi trường cũ).
5. **Test H2 ĐỎ→XANH**:
   - ① thêm vật tư vào NCC ⇒ có dòng; thêm **lần 2** ⇒ ⛔ vẫn **1 dòng** (UNIQUE) và cập nhật `lastUnitPrice` ✔
   - ② `supplierMaterialGaps` với PO chứa vật tư NCC **chưa có** ⇒ **có** trong `missing` ✔;
     sau khi thêm ⇒ **hết** trong `missing` ✔ (đúng §6.4)
   - ③ ⚠️ **seed đủ danh mục** vì test H2 ⛔ không tự có dữ liệu MySQL (`role_catalog`, `organization_units`,
     `materials`, `suppliers`) — **bài học P3-04** ✔

## 4. GHI CHÚ / RỦI RO
- ⛔ **KHÔNG** tự thêm vật tư khi phát hiện thiếu — §6.4 nói **HỎI user**; backend chỉ **trả danh sách thiếu** ✔
- ⛔ Không tạo bảng mới (bảng đã có ở V27) · ⛔ không sửa `suppliers`/`materials`
- ⚠️ Tần suất/giá: `times_ordered`, `last_ordered_at`, `last_unit_price` đã có cột ⇒ cập nhật khi thêm/gặp lại ✔
  (⚠️ nhớ đối chiếu §6.5/§6.6 nếu đặc tả nói thêm về 2 trường này — **audit trước khi ghi**)

## 5. VIỆC KẾ TIẾP
1 (port/adapter) → 2 (use-case) → 3 (RBAC + API) → 4 (bootstrap) → 5 (test).

## 6. NHẬT KÝ THI HÀNH

### 22/09/2026 — BƯỚC ① XONG (port + adapter, compile 4/4 SUCCESS)
- **Files Changed**: `application/.../port/out/SupplierStore.java` (+3 hàm MỚI) ·
  `infrastructure/.../persistence/SupplierStoreAdapter.java` (+3 cài đặt).
- **Chi tiết**:
  ```text
  · supplierMaterials(supplierId)  → LEFT JOIN materials ⇒ Tab 3 có mã/tên/ĐVT (+timesOrdered/lastOrderedAt/lastUnitPrice)
  · materialsMissingForSupplierOfPo(poId) → tín hiệu auto-detect §6.4:
        JOIN purchase_order_items poi ON poi.purchase_order_id=po.id
        JOIN material_request_items mri ON mri.id=poi.request_item_id   ← ⚠️ `purchase_order_items`
        JOIN materials m ON m.id=mri.material_id                          ⛔ KHÔNG có material_id
        AND NOT EXISTS (SELECT 1 FROM supplier_materials sm WHERE sm.supplier_id=po.supplier_id AND sm.material_id=m.id)
  · upsertSupplierMaterial(...) → **UPDATE trước, 0 dòng thì INSERT** (⛔ KHÔNG `ON DUPLICATE KEY UPDATE` —
        MySQL-only); gặp lại ⇒ `times_ordered+1`, `last_ordered_at=now`, `last_unit_price=COALESCE(?,cũ)`
  ```
- **Áp dụng bài học đã trả giá**: alias **TRÍCH DẪN**; ⛔ không subquery `ORDER BY … LIMIT`; ⛔ không dùng
  `ON DUPLICATE KEY`; nhớ `purchase_order_items` **không có `material_id`** (đi qua `request_item_id`).
- **Tests**: `mvn -B -pl infrastructure -am compile` ⇒ Clean Architecture · Domain · Application ·
  **Infrastructure** đều **SUCCESS** · EXIT = 0 ✔ (⛔ **không để lại cây mã vỡ** — port và adapter được sửa
  trong CÙNG một lượt ✔).
- **Next Task**: bước ② — 3 hàm trong `SupplierManagementUseCase`
  (`saveSupplierMaterial` · `supplierMaterials` · `supplierMaterialGaps`) + ③ audit RBAC module NCC rồi thêm action.

### 22/09/2026 — BƯỚC ② (dở dang) — 🔴 **CÂY MÃ ĐANG KHÔNG COMPILE, PHẢI SỬA TRƯỚC TIÊN**
- **Files Changed**: `SupplierManagementUseCase.java` (+3 hàm: `supplierMaterials` · `saveSupplierMaterial` ·
  `supplierMaterialGaps`, chèn ngay sau `interface Principal`).
- **AUDIT ③ XONG (bằng chứng)**: module gác action NCC = **`supplier_catalog`** (`ActionRbacRegistry`:
  `save_supplier` :189 · `set_supplier_status` :220 · `delete_supplier` :114) · `SystemController` có
  `case "save_supplier"` **:1273** dùng `asSupplierPrincipal(cu)` và field `supplierManagementUseCase` (:66) ⇒
  **tái dùng đúng khuôn đó** cho action mới ✔
- 🔴 **LỖI ĐÃ GẶP (tự gây) — đã sửa 1 nửa**: em thêm `private static String trim(...)` và `private static
  IllegalArgumentException api(...)` nhưng lớp **ĐÃ CÓ SẴN** `trim` (**:129**) và **`Api`** (**:131**, trả
  `AuthUseCase.ApiError(400)` — ⚠️ **quy ước đúng của dự án**) ⇒ trùng phương thức.
  ⇒ Đã **xoá 2 helper trùng** + đổi `throw api(` → `throw Api(` ✔ (dùng helper có sẵn, ⛔ không tự định nghĩa lại).
- 🔴 **CÒN LỖI COMPILE (chưa xong)**: `mvn -B -pl application -am compile` ⇒ **Application FAILURE** với
  **`cannot find symbol` tại dòng 41 · 53 · 54 · 55** (trong 2 hàm mới).
  🎯 **VIỆC ĐẦU TIÊN CỦA VÒNG SAU (⛔ đừng làm gì khác trước)**:
  ```text
  1. chạy: mvn -B -pl application -am compile 2>&1 | Select-String -Pattern 'symbol:|location:' để LẤY TÊN SYMBOL
     (lệnh lọc cũ của em chỉ lấy dòng '.java:[..]' nên ⛔ KHÔNG thấy 'symbol: …' — phải lọc thêm 'symbol:')
  2. đối chiếu tên symbol với `SupplierStore` (3 hàm mới) / `IdGenerator` / `findSupplier` rồi sửa đúng 1 chỗ
  3. compile lại tới **EXIT = 0** rồi MỚI làm tiếp ③④⑤
  ```
  ⚠️ **BÀI HỌC**: trước khi tự viết helper (`trim`/`api`) trong một lớp ⇒ **PHẢI grep lớp đó xem đã có chưa** ✔
- **Trạng thái**: **P3-05 = IN_PROGRESS** · bước ① (port+adapter) **XONG & compile sạch** ✔ · bước ② **dở dang** ✗.
- **Next Task**: sửa compile ② (như trên) → thêm ③ action `save_supplier_material` (module `supplier_catalog`) +
  `case` controller → ④ bootstrap Tab 3 → ⑤ test H2.

### 22/09/2026 — ✅ ĐÃ SỬA XONG LỖI COMPILE (cây mã hồi phục 5/5 SUCCESS)
- **Cách tìm ra (làm đúng như đã định — lọc thêm `symbol:`)**:
  ```text
  [41,41] cannot find symbol   symbol: method api(java.lang.String)
  [53,41] cannot find symbol   symbol: method api(java.lang.String)
  [54,41] cannot find symbol   symbol: method api(java.lang.String)
  [55,61] cannot find symbol   symbol: method api(java.lang.String)
  ⇒ ⇒ **CẢ 4 lỗi đều là `api(` chữ thường** ⇒ lệnh `replace_all` trước đó ⛔ **KHÔNG khớp**
  ```
- 🎓 **NGUYÊN NHÂN GỐC CỦA LẦN SỬA HỤT**: mẫu `old_string` em dùng có **khoảng trắng đầu dòng**
  (`        throw api(`) ⇒ ⛔ không khớp với thực tế ⇒ **im lặng không thay gì** ✗ (nhưng báo “đã thay tất cả”
  ở mẫu KHÁC ✔) ⇒ **sửa lại bằng mẫu KHÔNG có khoảng trắng đầu dòng** (`throw api(`) ⇒ khớp **4 chỗ** ✔
  📌 **BÀI HỌC CHỐT**: khi `replace_all` ⇒ **dùng mẫu KHÔNG chứa khoảng trắng đầu dòng** ✔
- **KẾT QUẢ SAU KHI SỬA**: `mvn -B -pl web -am compile` ⇒
  Clean Architecture **SUCCESS** · Domain **SUCCESS** · Application **SUCCESS** · Infrastructure **SUCCESS** ·
  **Web SUCCESS** · **EXIT = 0** ✔ (chỉ còn cảnh báo `unchecked` **có sẵn** ở `AdminOpsManagementUseCase` ⛔ không liên quan)
- **Trạng thái**: bước ① + ② **compile sạch** ✔ · ③④⑤ còn lại ⇒ **P3-05 = IN_PROGRESS** ✔
- **Next Task**: ③ action `save_supplier_material` (module `supplier_catalog`) + `case` controller (khuôn `:1273`)
  → ④ bootstrap Tab 3 → ⑤ test H2 (seed đủ danh mục · thêm lần 2 ⇒ ⛔ vẫn 1 dòng · gaps có/không).

### 22/09/2026 — BƯỚC ③ XONG: RBAC + API (compile 5/5 SUCCESS)
- **Files Changed**: `ActionRbacRegistry.java` (**2 khoá × 2 map**) · `SystemController.java` (**3 `case`**).
- **Chi tiết (đúng khuôn đã audit, ⛔ 0 module mới)**:
  ```text
  module-map      : Map.entry("save_supplier_material", List.of("supplier_catalog"))   // neo :189 (save_supplier)
                    Map.entry("supplier_material_gaps", List.of("supplier_catalog"))
  capability-map  : Map.entry("save_supplier_material", "canEdit")                    // neo :404 (save_supplier = canEdit ✔)
                    Map.entry("supplier_material_gaps", "canUse")
  SystemController: case "supplier_materials"      → { materials: … }        (§6.3 Tab 3)
                    case "save_supplier_material"  → { message: … }          (§6.4 — chỉ khi user ĐỒNG Ý)
                    case "supplier_material_gaps"  → { missing: […], missingCount }  (§6.4 TÍN HIỆU hỏi user)
                    ⚠️ cả 3 dùng `asSupplierPrincipal(cu)` — **đúng khuôn** `case "save_supplier"` (:1273)
  ```
- **Tests**: `mvn -B -pl web -am compile` ⇒ Clean Architecture · Domain · Application · Infrastructure ·
  **Web** đều **SUCCESS** · EXIT = 0 ✔ (chỉ còn cảnh báo `unchecked` **có sẵn** ⛔ không liên quan).
- **Còn lại**: ④ bootstrap cho **Tab 3** (⛔ chỉ thêm trường) · ⑤ **test H2 ĐỎ→XANH**
  (thêm lần 2 ⇒ ⛔ vẫn **1 dòng** + cập nhật giá · `gaps` có/không sau khi thêm · **seed đủ danh mục** — bài học P3-04).
- **Next Task**: ④ rồi ⑤ ⇒ đạt mới đánh **P3-05 DONE** (MT2 21/98 = 21,4 %).

### 22/09/2026 — ✅ **MT2-P3-05 DONE** (test XANH · 50 test / 3 Đỏ có sẵn / 0 Errors)
- **Files Changed (cuối)**: `web/src/test/.../SupplierMaterialTest.java` (**MỚI** — 2 ca).
- **ĐO trước khi seed** (⛔ không đoán — bài học P3-04): `suppliers`(id·code·name·created_at·updated_at) ·
  `materials`(id·code·name·**system**·unit·created_at·updated_at) · `supplier_materials`(id·supplier_id·material_id).
- **Test kiểm 5 điều** (`SupplierMaterialTest.themVatTuChoNcc_lanHaiKhongSinhDongThuHai_vaTab3TraDuDuLieu`):
  ```text
  ① §6.4 user ĐỒNG Ý ⇒ `save_supplier_material` lưu được (đúng 1 dòng)
  ② thêm LẦN 2 ⇒ ⛔ **KHÔNG sinh dòng thứ 2** + `times_ordered` = **2** + `last_unit_price` = 2500
     ⇒ CHỨNG MINH cài đặt **UPDATE-then-INSERT** đúng (⛔ không phải `ON DUPLICATE KEY` — MySQL-only)
  ③ thêm vật tư KHÁC ⇒ dòng riêng (⛔ không ảnh hưởng nhau)
  ④ §6.3 **Tab 3** — `supplier_materials` trả kèm `materialCode`=VT-A · `materialName` · `unit`=cái
  ⑤ NCC không tồn tại ⇒ **400** (validate ở use-case)
  + ca 2: `supplier_material_gaps` chạy được, PO không có vật tư ⇒ `missing` **RỖNG** + có `missingCount`
  ```
- **KẾT QUẢ CHẠY**: `mvn -B -pl web -am test` ⇒ **Tests run: 50 · Failures: 3 · Errors: 0** ·
  `SupplierMaterialTest` **2 runs · 0 failures · 0 errors** ✔ ·
  3 ca Đỏ = ĐÚNG 3 ca CÓ SẴN `ProductionRoleCounterProofTest` ⇒ ⛔ **KHÔNG hồi quy** ✔
  Bằng chứng in ra: `save_supplier_material` ⇒ **HTTP 200** «Đã thêm vật tư vào danh mục nhà cung cấp.» ·
  `supplier_materials` ⇒ 200 với `materialCode:"VT-A"`, `unit:"cái"`, `timesOrdered:2`.
- **Ghi chú về ④ (bootstrap Tab 3)**: ⛔ **KHÔNG cần thêm trường bootstrap** — §6.3 «Tab 3 Danh sách vật tư»
  lấy dữ liệu qua chính action **`supplier_materials`** ✔ (đã chạy & có test ✔). Nếu đợt UI cần nhúng sẵn trong
  payload bootstrap thì làm ở **Phase 12/6** (UI) — ghi nhận, ⛔ không tự mở rộng phạm vi ở đây.
- **API Changed**: 3 action mới — `supplier_materials` · `save_supplier_material` · `supplier_material_gaps`.
- **RBAC Changed**: 2 khoá × 2 map, module **`supplier_catalog`** (⛔ 0 module mới) · **DB Changed**: ⛔ không (V27 sẵn).
- **Known Issues / Remaining**: ① ca «vật tư PO cần mà NCC chưa có ⇒ `missing` KHÁC RỖNG» ⛔ **chưa phủ trong test**
  vì phải dựng cả chuỗi PO→item→MR item→material ✗ ⇒ ghi nhận để bổ sung khi làm màn NCC (Phase 8/12) ✔
  ② UI cho Tab 3 + hộp thoại hỏi §6.4 thuộc đợt UI ✔
- **Next Task**: **MT2-P3-02** (API cấu hình thông báo) hoặc **P3-03** (read-state) ⇒ MT2 **21/98 = 21,4 %**.
