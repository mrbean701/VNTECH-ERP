# TASK-131 — TEST MỌI NÚT CHỨC NĂNG «NHÀ CUNG CẤP» + «ĐỐI TÁC» THEO VAI TRÒ, KÈM ĐỐI CHỨNG ÂM QUYỀN

**Ngày**: 21/09/2026 · **Người thực hiện**: agent `session-*` (nhánh công việc TASK-131)
**Phạm vi**: 6 action `save_supplier` · `set_supplier_status` · `delete_supplier` ·
`save_partner` · `set_partner_status` · `delete_partner`
**Cổng vào**: proxy `POST :9000/api/system` → Java `:18081` (Strangler Fig), UI `:8787`

> ⚠️ **Không sửa một dòng mã nguồn nào trong task này.** Phát hiện ĐƯỢC ĐO, không suy đoán;
> ghi lại thành finding ở §9 để task sau quyết định. Kết quả: **KHÔNG có lỗ hổng phân quyền**
> trên 6 action (mọi ca đối chứng âm đều trả **403** đúng như thiết kế).

---

## 1. Hợp đồng 6 action — TRƯỜNG BẮT BUỘC (đọc từ mã, không đoán)

Nguồn đọc: `scripts/system-route.mjs:1315-1358` · `java-backend/.../SupplierManagementUseCase.java` ·
`java-backend/.../PartnerManagementUseCase.java` · `java-backend/web/.../SystemController.java:1186-1219`.

| Action | Dòng Java | Trường **BẮT BUỘC** | Trường tuỳ chọn (payload) | Cổng quyền |
|---|---|---|---|---|
| `save_supplier` | `SystemController.java:1186` | `code` · `name` | `supplierId` (⇒ SỬA) · `taxCode` · `contactName` · **`phone`** · `leadTimeDays` · `rating` · `active` | module `supplier_catalog` + capability `canEdit` |
| `set_supplier_status` | `:1191` | `supplierId` · `active` | — | `supplier_catalog` + `canEdit` |
| `delete_supplier` | `:1196` | `supplierId` | — | **`requireRequireAdmin`** (chỉ `role=admin`) — chặn TRƯỚC RBAC |
| `save_partner` | `:1204` | `code` · `name` | `partnerId` (⇒ SỬA) · `taxCode` · `address` · `contactName` · `contactPhone` · `email` · `partnerType` (mặc định `"supplier"`) · `status` (mặc định `active`/`inactive`) · `active` | `supplier_catalog` + `canEdit` |
| `set_partner_status` | `:1209` | `partnerId` · `active` | — | `supplier_catalog` + `canEdit` |
| `delete_partner` | `:1214` | `partnerId` | — | **`requireRequireAdmin`** |

### 1.1 Sai lệch giữa BỐI CẢNH ĐÃ ĐO của task và lược đồ THẬT

`DESCRIBE suppliers` (MySQL `vntech_erp`) cho thấy bảng **KHÔNG** có các cột mà mô tả task nêu:

```
id · code(UNI) · name · tax_code · contact_name · phone · lead_time_days · rating · active · created_at · updated_at
```

⇒ **KHÔNG có** `address` · `contact_phone` · `email` · `status` ở bảng `suppliers` (chỉ bảng `partners` mới có).
Vì vậy payload `save_supplier` dùng **`phone`**, không phải `contact_phone`. Xác nhận khớp
`SupplierManagementUseCase.saveSupplier` (đọc `payload.get("phone")`) và form
`app/screens/SupplierManager.tsx:26-27` (`<input name="phone">`, có cả `leadTimeDays`/`rating`).
Hợp đồng `partners` thì đúng như mô tả: đủ 9 trường + `status` + `active`.

---

## 2. Bảng kết quả TỪNG NÚT — ai gọi được, HTTP code, SQL chứng minh

Ghi chú mã HTTP: `200`=thành công · `403`=bị chặn bởi RBAC/admin · `401`=phiên không hợp lệ.

### 2.1 `save_supplier` — THÊM (chứng minh TRƯỚC/SAU bằng SQL)

| Vai trò | HTTP | SQL chứng minh |
|---|---|---|
| **`nvkhdemo`** (kh_nv, `can_edit=1`) | **200** `Đã thêm nhà cung cấp NCC-T131-20260921031120.` | TRƯỚC: **0 dòng** `code='NCC-T131-…'` → SAU: `id=SUP_eb3917bb-87ed-45a6-870e-699cb8ebe36b` · `tax_code=0312345678` · `contact_name=Nguyễn Văn Test` · `phone=0900000131` · `lead_time_days=5` · `rating=4.5000` · `active=1` |
| `trinhtrench` (kh_truong, `can_edit=1`) | 200 (đã dùng ở action SỬA) | xem §2.2 |
| `engineer.demo` · `cha.ht` · `tkhodemo` · `ksda.demo` (`can_edit=0`) | **403** | `SELECT COUNT(*) FROM suppliers WHERE code='NCC-T131-…-X'` = **0** ⇒ không ghi được |
| `giamdoc.demo` (director) | **200** (cross-check, xem §9) | bản ghi `…-LEAD` tạo được rồi admin dọn sạch |

### 2.2 `save_supplier` — SỬA (gửi `supplierId`)

| Vai trò | HTTP | TRƯỚC → SAU |
|---|---|---|
| **`nvkhdemo`** | **200** `Đã cập nhật nhà cung cấp NCC-T131-20260921031120.` | `name`: `Công ty TNHH Kiểm thử TASK-131` → `… (ĐÃ SỬA)` · `phone`: `0900000131` → `0900000999` |
| `engineer.demo`/`cha.ht`/`tkhodemo`/`ksda.demo` | **403** | không đổi |

### 2.3 `set_supplier_status` — ĐỔI TRẠNG THÁI (2 chiều)

| Vai trò | HTTP | SQL chứng minh |
|---|---|---|
| **`nvkhdemo`** tắt | **200** `Đã ẩn nhà cung cấp khỏi danh sách lập PO.` | `active`: `1` → **`0`** |
| **`nvkhdemo`** bật lại | **200** `Đã kích hoạt nhà cung cấp.` | `active`: `0` → **`1`** |
| `engineer.demo`/`cha.ht`/`tkhodemo`/`ksda.demo` | **403** | `active` giữ nguyên `1` |

### 2.4 `delete_supplier` — XOÁ (cổng admin ở `SystemController.java:1197`)

| Vai trò | HTTP | Ghi chú |
|---|---|---|
| `nvkhdemo` · `trinhtrench` | **403** `Tài khoản không có quyền thực hiện nghiệp vụ này.` | có `canEdit` nhưng KHÔNG phải admin ⇒ chặn |
| `engineer.demo` · `cha.ht` · `tkhodemo` · `ksda.demo` | **403** | chặn ở RBAC trước |
| `giamdoc.demo` | **403** | director vẫn không qua cổng admin |
| **`admin`** | **200** `Đã xóa Nhà cung cấp chưa phát sinh PO.` | TRƯỚC: `SELECT id …` = 1 dòng → SAU: **0 dòng** ⇒ **XOÁ CỨNG** (không phải xoá mềm) |

⚠️ **Xoá mềm có điều kiện**: `SupplierManagementUseCase.java:65-68` — nếu
`COUNT(*) FROM purchase_orders WHERE supplier_id=?  > 0` thì **KHÔNG xoá vật lý**, chỉ đặt
`active=0` và trả `"Nhà cung cấp đã phát sinh PO nên không xóa vật lý; hệ thống đã chuyển sang
Ngừng sử dụng."` (đúng nghiệp vụ, chống mồ côi). NCC test chưa phát sinh PO ⇒ nhánh xoá cứng đã chạy.

### 2.5 `save_partner` — THÊM (⭐ chức năng MỚI, bảng `partners`)

| Vai trò | HTTP | SQL chứng minh |
|---|---|---|
| **`nvkhdemo`** | **200** `Đã thêm đối tác DT-T131-20260921031120.` | TRƯỚC: **0 dòng** → SAU: `id=PTR_ee2f43e2-…` · `tax_code=0398765432` · `address=Số 131 đường Test, Hà Nội` · `contact_name=Trần Thị Test` · `contact_phone=0911000131` · `email=doitac131@example.com` · `partner_type=contractor` · `status=active` · `active=1` |
| `engineer.demo`/`cha.ht`/`tkhodemo`/`ksda.demo` | **403** | `COUNT(*) FROM partners WHERE code='DT-T131-…-B'` = **0** |
| `giamdoc.demo` | **200** (cross-check §9) | tạo rồi admin dọn sạch |

Bằng chứng «bảng riêng»: `SELECT id FROM suppliers WHERE code='DT-T131-…'` = **0 dòng**
⇒ đối tác KHÔNG bị trộn vào danh mục NCC.

### 2.6 `save_partner` — SỬA

| Vai trò | HTTP | TRƯỚC → SAU (`PTR_ee2f43e2-…`) |
|---|---|---|
| **`trinhtrench`** | **200** `Đã cập nhật đối tác DT-T131-20260921031120.` | `name` → `… (ĐÃ SỬA)` · `email`: `doitac131@example.com` → `doitac131-sua@example.com` · `partner_type`: `contractor` → `consultant` |

### 2.7 `set_partner_status` — ĐỔI TRẠNG THÁI (đồng bộ 2 cột)

| Vai trò | HTTP | SQL chứng minh |
|---|---|---|
| **`nvkhdemo`** tắt | **200** `Đã chuyển đối tác sang Ngừng sử dụng.` | `active` `1`→`0` **và** `status` `active`→**`inactive`** |
| **`nvkhdemo`** bật lại | **200** `Đã kích hoạt đối tác.` | `active` `0`→`1` **và** `status` `inactive`→**`active`** |
| `engineer.demo`/`cha.ht`/`tkhodemo`/`ksda.demo` | **403** | `active` giữ `1` |

### 2.8 `delete_partner` — XOÁ

| Vai trò | HTTP |
|---|---|
| `nvkhdemo` · `trinhtrench` · `engineer.demo` · `cha.ht` · `tkhodemo` · `ksda.demo` · `giamdoc.demo` | **403** (7/7) |
| **`admin`** | **200** `Đã xóa Đối tác.` ⇒ SQL: **1 dòng → 0 dòng** (xoá cứng) |

⚠️ **Khác biệt JS ↔ Java (đã ghi nhận, KHÔNG sửa)**: `scripts/system-route.mjs:1355` cho phép
**admin HOẶC `isDepartmentApprover("KH")`** xoá đối tác; Java `SystemController.java:1214-1216` chỉ
cho **admin** (nguyên văn chú thích: *"Khuôn `delete_supplier`: chỉ admin (Java chưa có helper
isDepartmentApprover(\"KH\"))"*). Đo được: `trinhtrench`/`nvkhdemo` (KH) ⇒ 403 trên Java.
⇒ **Đường ĐANG PHỤC VỤ (Java) CHẶT HƠN JS** — không phải lỗ hổng, nhưng là chênh lệch parity.

---

## 3. XÁC NHẬN `partners` — CHỨC NĂNG MỚI

**Có chạy thật, đủ 4 nút, ghi vào bảng `partners`:**
THÊM ✔ · SỬA ✔ · ĐỔI TRẠNG THÁI (2 chiều, đồng bộ `active`+`status`) ✔ · XOÁ ✔.
Bootstrap trả khoá `partners` (2 dòng active) + `adminPartners` (3 dòng) — đo từ API:
`BootstrapDataAdapter.java:222-233`. Màn `app/screens/PartnerManager.tsx` đọc `data.partners` ✔.

---

## 4. ĐỐI CHỨNG ÂM QUYỀN — **HTTP CODE THẬT, PHẢI 403**

Tài khoản đối chứng: `engineer.demo` (ksda) · `cha.ht` (cht) · `tkhodemo` (thu_kho) ·
`ksda.demo` (ksda) — cả 4 đều `can_edit=0` trên `supplier_catalog` trong `user_module_permissions`.

| Action | engineer.demo | cha.ht | tkhodemo | ksda.demo |
|---|---|---|---|---|
| `save_supplier` | **403** | **403** | **403** | **403** |
| `set_supplier_status` | **403** | **403** | **403** | **403** |
| `delete_supplier` | **403** | **403** | **403** | **403** |
| `save_partner` | **403** | **403** | **403** | **403** |
| `set_partner_status` | **403** | **403** | **403** | **403** |
| `delete_partner` | **403** | **403** | **403** | **403** |

Nguyên văn thân phản hồi 403 (RBAC module):
`{"ok":false,"error":"Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này."}`
Nguyên văn 403 cổng admin (`delete_*`):
`{"ok":false,"error":"Tài khoản không có quyền thực hiện nghiệp vụ này."}`

**Đối chứng SQL (không tin lời API)**: sau toàn bộ 24 lần gọi bị chặn —
`SELECT COUNT(*) FROM suppliers WHERE code LIKE 'NCC-T131-%-X'` = **0** và
`SELECT COUNT(*) FROM partners WHERE code='DT-T131-…-B'` = **0**; bản ghi test vẫn `active=1`.

### ⇒ **KẾT LUẬN BẢO MẬT: KHÔNG PHÁT HIỆN LỖ HỔNG.** 24/24 ca đối chứng âm đều bị chặn bằng 403.

### 4.1 Ngoại lệ CÓ CHỦ Ý: `director` / `accountant` bỏ qua `can_edit`
`RbacService.java:49` — `if (isCompanyLeadership(user) && !required.contains("admin")) return;`
chạy **TRƯỚC** khi xét capability ⇒ `giamdoc.demo` (role `director`) ghi được NCC/đối tác.
**Đo được**: `save_supplier` → **200** · `save_partner` → **200** (khối 5c/10c của probe).
Đây là port nguyên trạng từ JS gốc, **không** phải lỗi do TASK-131.

---

## 5. TOÀN VẸN DỮ LIỆU — TRƯỚC / SAU (SQL)

```sql
SELECT COUNT(*) FROM suppliers;                                                   -- 2  → 2
SELECT COUNT(*) FROM partners;                                                    -- 3  → 3
SELECT COUNT(*) FROM purchase_orders;                                             -- 22 → 22
SELECT COUNT(*) FROM purchase_orders po
  LEFT JOIN suppliers s ON s.id = po.supplier_id WHERE s.id IS NULL;              -- 0  → 0  (0 mồ côi)
SELECT COUNT(*) FROM suppliers WHERE code LIKE 'NCC-T131-%';                      -- 0  (đã dọn sạch)
SELECT COUNT(*) FROM partners  WHERE code LIKE 'DT-T131-%';                       -- 0  (đã dọn sạch)
```

- **2 NCC gốc + 3 đối tác gốc còn NGUYÊN**: `NCC-VTMN` · `NCC-P2SEED-02` ·
  `DT-T125-01` · `DT-T125-02` · `DT-T125-03` — probe khẳng định bằng SQL (bước 12.4) ✔
- **0 PO mồ côi** trước và sau ⇒ chốt `delete_supplier` giữ nguyên hành vi chống mồ côi ✔
- Mọi bản ghi test do lượt chạy này tạo **đã được xoá sạch** (chỉ xoá bản ghi của chính nó) ✔

---

## 6. TÌM KIẾM / LỌC — CÓ hay KHÔNG (bằng chứng mã nguồn)

| Màn | Tìm kiếm/lọc | Bằng chứng |
|---|---|---|
| **Nhà cung cấp** (`SupplierManager.tsx`) | **KHÔNG** | `grep -E "useState\|keyword\|search\|Tìm"` trên tệp ⇒ **0 kết quả**. Component chỉ có `<form>` thêm + danh sách row, **không** có ô nhập từ khoá, **không** state lọc. |
| **Đối tác** (`PartnerManager.tsx`) | **CÓ** | `useState("")` + `useMemo` lọc theo `code · name · taxCode · contactName · contactPhone · email`; ô `<input placeholder="Tìm đối tác theo mã / tên / MST / liên hệ">` + nút `Xoá lọc`. Lọc **phía client** trên `data.partners`. |

---

## 7. KẾT QUẢ PROBE

```
node tools/probe-supplier-crud-flow.mjs            ⇒ in kế hoạch, 0 thao tác ghi (dữ liệu không đụng)
node tools/probe-supplier-crud-flow.mjs --apply    ⇒ 79/79 bước ĐẠT
```

- Khuôn `tools/probe-purchasing-flow.mjs`; **đối chứng âm tính là ĐẠT** (`expectStatus: 403`).
- Bằng chứng SQL đọc lại **độc lập với API** bằng `mysql --xml --default-character-set=utf8mb4`.
- Bản ghi test mang nhãn lượt chạy (`NCC-T131-<tag>` / `DT-T131-<tag>`) ⇒ chạy lại không vướng UNIQUE.
- `npx eslint tools/probe-supplier-crud-flow.mjs` ⇒ **0 lỗi, 0 cảnh báo**.

---

## 8. CỔNG (gate)

| Cổng | Lệnh | Kết quả |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **0 lỗi** (exit 0) |
| Regression | `npm run test:regression` | **69/69 pass · 0 fail** |
| Workflow | `npm run test:workflow` | **ĐẠT** — `"Workflow VNTECH ERP V5.3.0 FULL W2 passed"` |
| Java | — | **KHÔNG chạy**: task này **không sửa** `java-backend/**` ⇒ không cần |
| ESLint tệp mới | `npx eslint tools/probe-supplier-crud-flow.mjs` | 0 lỗi, 0 cảnh báo |

---

## 9. FINDINGS (đo được, KHÔNG sửa trong task này)

| # | Mức | Phát hiện | Bằng chứng |
|---|---|---|---|
| F1 | **Thấp** | `kttdemo` **KHÔNG đăng nhập được** bằng mật khẩu demo | `POST /api/system {action:login,username:kttdemo,password:Vntech@2026}` ⇒ **HTTP 401** `"Tên đăng nhập hoặc mật khẩu không đúng."`. Mật khẩu `admin/Admin123456@` thì đăng nhập được ⇒ tài khoản tồn tại, chỉ sai mật khẩu. Bối cảnh task ghi «9/9 đăng nhập được» ⇒ **đã lệch**. |
| F2 | **Thấp** | Chênh lệch parity JS ↔ Java ở `delete_partner` | JS (`system-route.mjs:1355`) cho `admin` **hoặc** `isDepartmentApprover("KH")`; Java (`SystemController.java:1216`) chỉ `admin`. Đo: `trinhtrench`/`nvkhdemo` (KH) ⇒ **403**. Java CHẶT HƠN ⇒ không phải lỗ hổng. |
| F3 | **Thông tin** | `director`/`accountant` bỏ qua mọi `can_edit` | `RbacService.java:49`. `giamdoc.demo` `save_supplier` ⇒ **200**, `save_partner` ⇒ **200**. Port nguyên trạng từ JS ⇒ nhất quán 2 backend. |
| F4 | **Thông tin** | Mô tả task ghi sai lược đồ `suppliers` | `DESCRIBE suppliers` **KHÔNG** có `address`/`contact_phone`/`email`/`status`; payload đúng là `phone`. Đã đính chính ở §1.1. |
| F5 | **Thấp** | Nhánh `vietnam` chết trong `SupplierManager.tsx:24` | Component còn nhánh `partnerView` với cảnh báo *"CHƯA CÓ NGUỒN DỮ LIỆU ĐỐI TÁC RIÊNG"*, nhưng TASK-125 đã tách màn riêng (`PartnerManager.tsx`) ⇒ văn bản này **lỗi thời** nếu còn hiển thị. Không có caller nào truyền `view="partner"` (đã grep `app/`). |

---

## 10. TỆP THAY ĐỔI

| Tệp | Loại | Ghi chú |
|---|---|---|
| `tools/probe-supplier-crud-flow.mjs` | **MỚI** | Probe tái sử dụng, 79 bước, khuôn `probe-purchasing-flow.mjs` |
| `docs/agent-progress/TASK-131.md` | **MỚI** | Hồ sơ này |

**KHÔNG** sửa `java-backend/**` · `lib/**` · `app/**` · test cũ · `AGENTS.md` · `docs/28_*` ·
`tools/probe-purchasing-flow.mjs` · `tools/probe-stock-issue-flow.mjs`.

## 11. COMMIT

- `d15a2da` — `test(TASK-131): them probe-supplier-crud-flow.mjs …`
- `273e0c9` — `test(TASK-131): probe 79/79 DAT - doi chung am quyen 4 user can_edit=0 tra 403, director cross-check 200`
- `<HEAD sau khi ghi hồ sơ>` — `docs(TASK-131): ho so ket qua test 6 nut NCC + doi tac …`
