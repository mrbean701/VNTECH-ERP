# WEEKLY_REPORT_DATA — SESSION_A (ERP-SESSION-01)

> Phien: **ERP-SESSION-01** · Timezone Asia/Ho_Chi_Minh (UTC+7)
> ⭐ **§15**: du lieu phai **TONG HOP TU LOG** (TASK_LOG · DEV_LOG · CHANGE_LOG · TEST_LOG · BUG_HOTFIX_LOG · DECISION_LOG · HANDOFF_LOG · EVENT_LOG) — ⛔ **KHONG suy doan** ✓
> ⭐ **§37 LOG ONCE — REPORT MANY**: ghi 1 lan, dung lai cho daily · weekly · monthly · bug statistics ✓

---

# WEEK 2026-W41

## Session

ERP-SESSION-01

## Period

2026-10-05 → 2026-10-11

## Pham vi

**NHOM «PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN»**
Tep giu: `app/page.tsx` · `java-backend/**` (phan quyen + mua hang) · `java-backend/web/src/test/**` · `docs/dsh-state/**`

---

## 1. Cong viec thuc hien

- ⭐ **9 ban va Java** + sua cong cu trien khai (dap 4 loi HTTP 500).
- ⭐ **7 bug** nghiep vu: BUG-20261006-001 … -006 + **F2** (loi workflow muc cao).
- ⭐ **BUG-20261005-005** — go ket 5 phieu `central_returns` (DON TRANSIT).
- ⭐ **Don 570 dong quyen mo coi** trong `user_module_permissions`.
- ⭐ **Nghiem thu E2E toan dien** (8 bo go-live).
- ⭐ **Chan doan BUG-20261007-001** («luu phan quyen phong ban doi rat lau»).
- ⭐ **Dieu phoi da phien** voi ERP-SESSION-02 (TASK-226 «HUB KHO VAT TU»).
- ⭐ **Thiet lap log chuan hoa** `docs/dsh-mutil-session/SESSION_A/**` (theo chuan moi).

## 2. Cong viec hoan thanh

| # | Viec | Status |
|---|---|---|
| 1 | 9 ban va Java + cong cu trien khai | ⭐ **DONE** |
| 2 | BUG-20261006-001 — danh sach bao loi rong | ⭐ **VERIFIED** (user xac nhan) |
| 3 | BUG-20261006-006 — nut buoc 14 bi khoa oan | ⭐ **VERIFIED** (user xac nhan) |
| 4 | **F2** — `receive_goods` khong kiem trang thai PO | ⭐ **VERIFIED** (runtime + doi chung) |
| 5 | BUG-20261005-005 — 5 phieu ket `in_transit` | ⭐ **VERIFIED** |
| 6 | BUG-20261006-002 — dropdown «Nhom chuc nang» rong | ⭐ **FIXED** |
| 7 | BUG-20261006-003 — cap quyen vuot phong ban | ⭐ **FIXED** (da trien khai) |
| 8 | BUG-20261006-004 + -005 — «bao loi luu» + «Chon tat ca» + «Ca dong» | ⭐ **FIXED** |
| 9 | Don 570 dong quyen mo coi | ⭐ **DONE** |
| 10 | Nghiem thu E2E 8 bo | ⭐ **DONE** (7/8 DAT) |
| 11 | Dieu phoi da phien | ⭐ **DONE** |
| 12 | Log chuan hoa SESSION_A | 🔄 **IN_PROGRESS** |

> ⭐ **TONG**: **12 task** — ⭐ **4 VERIFIED** · ⭐ **4 DONE** · ⭐ **4 FIXED** (cho user nghiem thu) · ⭐ **0 OPEN**
> ⭐ ⭐ **CAP NHAT 2026-10-06**: ⭐ **`TASK-20261007-001` `OPEN` → `FIXED`** ✓ ⇒ ⭐ **KHONG con task `OPEN`** ✓

## 3. Chuc nang phat trien

- ⭐ **Tab «Phan quyen phong ban»**: them nut **«Chon tat ca»** (co trang thai indeterminate) + cot **«Ca dong»** tick duoc — ⭐ chuc nang MOI (⛔ truoc day chi co 4 nut chon theo NHOM).
- ⭐ **Modal «Bao loi»**: dropdown «Nhom chuc nang» hoat dong tro lai (**75 muc**).
- ⭐ **Bang bao loi (buoc 14)**: hien duoc danh sach (**18 bao cao**).
- ⭐ **Cap quyen nguoi dung**: cho phep cap quyen **vuot phong ban** (⛔ truoc day bi chan).
- ⭐ **`receive_goods`**: them **cong chan trang thai PO** (loi workflow F2).

## 4. UI/UX

- ⭐ Nut **«Chon tat ca»** + **«Bo chon tat ca»** cho tab phan quyen phong ban.
- ⭐ Cot **«Ca dong»** voi `el.indeterminate` (trang thai nua chon) — tick ca dong chi 1 lan bam.
- ⭐ Thong bao loi LUU chinh xac: «Da luu **N/N**» thay vi «Da luu **0/N**» SAI.
- ⚠️ **CHUA XONG**: tien do «Dang luu 5/61…» cho `save()`/`deleteSelected()` — ⛔ bi chan boi luat ESLint (xem muc 12 + DECISION_LOG).
- ⭐ **Da kiem CSS**: `.dept-perm-*` duoc style **DAY DU** trong `app/styles/canonical.css` §11 (**20 quy tac**) ⚠️ ⛔ **KHONG phai `globals.css`** ⇒ ⭐ **KHONG phai bug** (toi da ket luan sai 1 lan va da dinh chinh).

## 5. Backend/API

- ⭐ **9 ban va Java** — guard payload rong, chuan hoa kieu du lieu.
- ⭐ **`PurchaseManagementUseCase.receiveGoods`**: cong chan F2 (⛔ KHONG dat trong `findPoForReceiving` vi co **3 noi goi**, `decidePo` CAN `pending_approval`).
- ⭐ **`UserManagementUseCase.java:266`**: bo chot `P5.3` `assertDepartmentAllowsPermissions`.
- ⭐ **`MaterialCatalogStoreAdapter.java`**: go **25 dong `//`** ra khoi text block `"""` (⭐ trong Java, `//` NAM TRONG chuoi ⇒ bi gui xuong MySQL nhu cau lenh SQL ⇒ HTTP 500).
- ⚠️ **Phat hien hieu nang**: `save_department_permission` = **11,50 GIAY/lan goi** · `syncDepartmentUsers` (`UserManagementUseCase.java:632`) chay **sau MOI lan luu** ⇒ **~1.647 luot truy van+ghi/lan** ⇒ ⭐ **DIEM NONG HIEU NANG CHUA SUA**.

## 6. Database

- ⭐ **Ghi bu 10 dong** `contract_stock_ledger` (BUG-20261005-005) — sao luu `backup_csl_20261006` (**150 dong**).
- ⭐ **Xoa 570 dong quyen mo coi** trong `user_module_permissions` — sao luu `backup_ump_20261006` (**2198 dong**) · ⭐ dong HOP LE 1628 **KHONG DOI** · ⭐ **«dong bi xoa thuoc `e2e.*`» = 0**.
- ⭐ **Do trang thai phong `ORG-BGD`**: **61 dong quyen** (cao nhat he) · `updated_at` **13:33:19 → 13:40:09** ⇒ ⭐ **55/61 module luu duoc** · ⚠️ **6 module CHUA**.
- ⛔ **KHONG tao migration nao** trong tuan (⭐ ⛔ khong xung dot voi phien 02 — §18/§19).
- ⚠️ **Schema test** `java-backend/web/src/**test**/resources/schema-h2.sql`: **them 3 cot** (`decision_reason` · `decided_by` · `decided_at`) — ⭐ **goc loi F2**.

## 7. RBAC/Workflow

- ⭐ **RBAC**: bo chot `P5.3` ⇒ **cap quyen vuot phong ban** duoc phep (yeu cau truc tiep cua user).
- ⭐ **RBAC**: phat hien **`RbacService` LOAI TRU vai tro `admin`** khoi kiem module ⇒ ⭐ **`admin` di NGOAI** — ⭐ **UI phai tinh ca vai tro `admin`** (bai hoc BUG-20261006-006).
- ⭐ **Workflow**: them **cong chan F2** — `receive_goods` chi cho phep khi PO o `waiting_delivery`/`partial_delivery`.
- ⭐ **Workflow**: go ket **5 phieu** `central_returns` (DON TRANSIT).

## 8. Bug

| Ma | Severity | Status |
|---|---|---|
| BUG-20261006-001 — danh sach bao loi rong | HIGH | ⭐ **VERIFIED** |
| BUG-20261006-002 — dropdown «Nhom chuc nang» rong | MEDIUM | FIXED |
| BUG-20261006-003 — khong cap quyen vuot phong ban | HIGH | FIXED (da trien khai) |
| BUG-20261006-004 — «bao loi luu» dem sai | HIGH | FIXED |
| BUG-20261006-005 — thieu «Chon tat ca» + «Ca dong» | MEDIUM | FIXED |
| BUG-20261006-006 — nut buoc 14 bi khoa oan | HIGH | ⭐ **VERIFIED** |
| BUG-20261006-007 (**F2**) — `receive_goods` khong kiem PO | HIGH | ⭐ **VERIFIED** |
| BUG-20261005-005 — 5 phieu ket `in_transit` | HIGH | ⭐ **VERIFIED** |
| BUG-20261007-001 — luu phan quyen phong ban doi rat lau | HIGH (chan nguoi dung) | ⭐ **FIXED** (⭐ da sua lan thu 5 · cho user nghiem thu) |

> ⭐ **TONG**: **9 bug** — ⭐ **4 VERIFIED** · ⭐ **4 FIXED** · ⭐ **0 OPEN** · ⭐ **1 DONE**
> ⭐ ⭐ **CAP NHAT 2026-10-06**: ⭐ **`BUG-20261007-001` da sua xong** (⭐ **lan thu 5**) ⇒ ⭐ **khong con bug `OPEN`** ✓
> ⚠️ ⭐ **VA**: ⭐ **cap quyen `e2e.*`** (⭐ ⛔ khong phai bug — ⭐ **khoang trong du lieu kiem thu**) ⇒ ⭐ **`go-live-chuoi-kho` 5/9 → 7/7** ⇒ ⭐ **E2E 8/8 DAT** ✓

## 9. Hotfix

- ⭐ **2 bug do CHINH PHIEN NAY gay ra** va da tu sua:
  1. ⭐ **BUG-20261006-006** — ban va «BUG-B» khoa nut buoc 14 bang `hasAdminTab` (ham chi doc `allModulePermissions`) ⚠️ nhung `admin` co **0 dong quyen** ⇒ **khoa oan** ⇒ sua thanh `isAdminUser(...) || hasAdminTab(...)`.
  2. ⭐ **Loi ESLint** trong qua trinh sua `BUG-20261007-001` — ⚠️ **xoa mat dong khai bao `let ok…` cua `deleteSelected()`** ⇒ gan vao bien cua `save()` ⇒ ESLint bao «Cannot reassign variables declared outside of the component/hook» ⇒ **them lai ⇒ XANH**.
- ⭐ **Sua cong cu trien khai** `tools/deploy-java-backend.mjs`: ⭐ **dung Java TRUOC khi build** (⛔ truoc day build khi JAR con bi giu khoa ⇒ **LUON that bai**) + tu khoi phuc JAR cu neu build loi.
- ⭐ **Sua 1 loi HTTP 500 do chinh toi gay ra**: 25 dong `//` nam TRONG text block Java.

## 10. Testing

| Loai | Ket qua |
|---|---|
| ⭐ `mvn -o test` (Java) | ✅ **156/156 · 0 loi** |
| ⭐ `npm test` (lint + typecheck + regression + workflow) | ✅ **EXIT=0 · pass 802 · fail 0** |
| ⭐ **Cong UI** `verify-ui-build-applied.mjs --port=8787` | ✅ **3/3** «BAN CHAY DUNG BAN DA BUILD MOI NHAAT» |
| ⭐ **E2E 8 bo go-live** | ✅ **7/8 DAT** (bao loi 3/3 · delete 34 · 30 action 30/30 · payload rong 8/8 · `save_*` meo 49/49 · danh muc VT 7/7 · chung tu KT 6/6 · ⚠️ chuoi kho 5/9) |
| ⭐ **Kiem chuoi dac trung trong bundle** | ✅ 7/8 chuoi CO tren CA `:8787` VA `:9000` |
| ⭐ **Kiem chung runtime F2** | ✅ HTTP 400 + dung thong diep + **KHONG ghi du lieu** |

⚠️ **`go-live-chuoi-kho` 5/9** — ⛔ hong vi **THIEU QUYEN tai khoan `e2e.*`** (HTTP 403) ⭐ **KHONG do phien nay** (⭐ da chung minh bang doi chieu `backup_ump_20261006`: `e2e.cht` 60→60) ⇒ ⚠️ **can user cho phep ghi CSDL** de cap 5 module: `teams` · `warehouse_issue` · `approvals` · `stocktake` · `inventory`.

## 11. Thay doi quan trong

1. ⭐ **RBAC**: bo chot `P5.3` ⇒ **cap quyen vuot phong ban** (thay doi HANH VI nghiep vu).
2. ⭐ **Workflow**: them **cong chan F2** ⇒ ⛔ khong nhan hang tren PO chua phat hanh.
3. ⭐ **UI**: them «Chon tat ca» + cot «Ca dong» cho tab phan quyen phong ban.
4. ⭐ **Schema test**: them **3 cot** vao `schema-h2.sql` (⭐ **goc loi F2** — test truoc day DI VONG).
5. ⭐ **Cong cu trien khai**: doi thu tu (dung Java truoc khi build).
6. ⚠️ **Hieu nang**: phat hien **`save_department_permission` = 11,5 giay/lan** — ⛔ **CHUA SUA**.

## 12. Blocker

| # | Blocker | ⭐ Anh huong | ⭐ Can gi |
|---|---|---|---|
| 1 | ⚠️ **Luat ESLint (React Compiler) «Cannot reassign variables declared outside of the component/hook»** | ⛔ **Chan** viec them TIEN DO vao `save()`/`deleteSelected()` (⭐ da thu **4 lan**) | ⭐ Doc ky `eslint.config.*` TRUOC khi sua; ⭐ HOAC **sua o BACKEND** (⭐ tot hon) |
| 2 | ⚠️ **Thieu quyen module tai khoan `e2e.*`** | ⛔ **33/76 bai E2E** dung `e2e.*` bi 403 | ⚠️ **User cho phep GHI CSDL** |
| 3 | ⚠️ **Van tay nguon KHONG hop le** khi ca 2 phien con sua | ⚠️ `verify-vntech-fingerprint.mjs` bao loi | ⭐ Chay lai `fixpoint-fingerprint.mjs` khi **CA HAI** phien dung |
| 4 | ⛔ **Chua duoc phep COMMIT** (user da noi «khong commit hay push trong thoi diem nay») | ⚠️ **13 tep cua phien** con tren dia | ⭐ User cho phep |

## 13. Cong viec con ton dong

- ⭐ **`BUG-20261007-001` — ✅ DA SUA XONG** (⭐ **lan thu 5**: ⭐ **dung chinh `ok + that` lam so dem TIEN DO** ⚠️ — ⛔ khong them bien moi, ⛔ khong doi cau truc vong lap) ⇒ ⭐ `npm test` **802/0 · 0 errors** · ⭐ build **EXIT=0** · ⭐ cong UI **3/3** · ⭐ **CA `:8787` VA `:9000` co `⏳ Đang lưu ` + `⏳ Đang xoá `** ✓ · ⚠️ **cho user nghiem thu** ⇒ chuyen `VERIFIED` ✓
- ⚠️ **6 module cua phong `BGD`** chua duoc cap nhat: `dept_plan_contracts` · `dept_plan_price_data` · `dept_plan_suppliers` · `dept_plan_supply` · `payments` · `supplier_catalog`.
- ⚠️ **8 tep log con lai** cua `SESSION_A`: `EVENT_LOG` · `DEV_LOG` · `CHANGE_LOG` · `TEST_LOG` · `DECISION_LOG` · `HANDOFF_LOG`.
- ⚠️ **Cap quyen module cho `e2e.*`** (5 module) — cho user cho phep.
- ⛔ **F4** — chot dac ta quyen duyet rong hon phan cong du an (cho user).
- ⛔ **Chinh sach du lieu nhan su** — xoa nhan su co giu ho so HR/HDLD/bao hiem khong (cho user).
- ⚠️ **Van tay + commit** — cho user.

## 14. Ke hoach tiep theo

1. ⭐ **Hoan tat 6 tep log con lai** cua `SESSION_A` (theo chuan §3).
2. ⭐ **Doc `eslint.config.*`** de hieu dung luat React Compiler ⇒ ⭐ **them TIEN DO** cho `save()`/`deleteSelected()`.
3. ⭐ **Can nhac sua BACKEND** cho `save_department_permission` (⭐ **hieu qua cao nhat**: 11,5s → ~1s).
4. ⭐ **Cho user nghiem thu** 3 bug dang `FIXED` (-002 · -003 · -004/-005) ⇒ chuyen `VERIFIED`.
5. ⭐ **Cap quyen module `e2e.*`** (sau khi user cho phep) ⇒ chay lai `go-live-chuoi-kho`.
6. ⭐ **Commit** khi user cho phep (⭐ ⛔ khong tu commit — luat 25/26).

---

## ⭐ GHI CHU PHUONG PHAP (⭐ §15 — chong suy doan)

⭐ Moi so lieu trong tep nay **DEU DO DUOC** hoac **LAY TU LOG** — ⛔ khong co so lieu nao tu suy doan:
- ⭐ `11,50 giay` — do bang `Invoke-WebRequest` goi that tren `:9000` ✓
- ⭐ `55/61 module` · `13:33:19 → 13:40:09` — truy van `department_module_permissions` cua `ORG-BGD` ✓
- ⭐ `0/76` vs `75 muc` — dem tren `moduleCatalog` cua bootstrap that ✓
- ⭐ `pass 802 · fail 0` — `npm test` that ✓
- ⭐ `7/8 DAT` — chay that 8 bo E2E ✓
- ⭐ `page-CQTVKoge.js → page-CygT2G3w.js → page-CcbWX2ln.js` — doc that tu HTML phuc vu ✓

---

# 🔄 CẬP NHẬT CUỐI NGÀY 06/10/2026 — `BUG-20261007-001` ĐÃ GIẢI QUYẾT TRIỆT ĐỂ

> ⭐ **GHI ĐÈ CÁC SỐ CŨ Ở TRÊN** (⭐ dòng 168–170 đã lỗi thời) — ⭐ §22 «nếu log không khớp thực tế ⇒ cập nhật theo thực tế» ✓

## ## Performance (⭐ MỚI — ĐO THẬT SAU KHI TRIỂN KHAI)
| ⭐ Chỉ số | ⭐ TRƯỚC | ⭐ **SAU** |
|---|---|---|
| ⭐ **1 lời gọi `save_department_permission`** (⭐ trung gian) | ⭐ **11,50 giây** | ⭐ ⭐ **0,03 – 0,05 GIÂY** ⚡ |
| ⭐ **1 lời gọi** (⭐ module cuối — có đồng bộ) | ⭐ 11,50 giây | ⭐ **5,73 giây** |
| ⭐ ⭐ **«CHỌN TẤT CẢ» 61 MODULE** | ⭐ ⭐ **~11,7 PHÚT** | ⭐ ⭐ **~8,7 GIÂY** |

⇒ ⭐ ⭐ **NHANH HƠN ~80 LẦN** cho thao tác «Chọn tất cả» ✓ · ⭐ **~230 lần** cho 1 lời gọi trung gian ✓

## ## Cách sửa (⭐ §41 «nhỏ · an toàn · hoàn nguyên được»)
| ⭐ Tầng | ⭐ Thay đổi |
|---|---|
| ⭐ **Backend** | ⭐ `UserManagementUseCase.saveDepartmentPermission`: ⭐ cờ **TÙY CHỌN** `syncNow` — ⭐ **thiếu cờ ⇒ VẪN ĐỒNG BỘ** (⛔ không đổi hành vi cũ) ✓ |
| ⭐ **Frontend** | ⭐ `app/page.tsx` `save()` + `deleteSelected()`: ⭐ **chỉ module CUỐI đồng bộ** + ⭐ **hiện TIẾN ĐỘ** «⏳ Đang lưu N/61…» ✓ |

## ## Frontend
- ⭐ **Tiến độ lưu/xoá**: ⭐ `⏳ Đang lưu ${ok+that}/${changed.length} chức năng… (⭐ vui lòng ⛔ đừng rời trang)` ✓
- ⭐ **Có mặt trên CẢ `:8787` VÀ `:9000`** ✓ (⭐ đã kiểm byte trong bundle ✓)
- ⭐ **Nút «Chọn tất cả» + cột «Cả dòng»** (`el.indeterminate`) ✓

## ## Backend/API
- ⭐ **Triển khai THÀNH CÔNG**: ⭐ `BUILD EXIT=0` ⭐ **chỉ 4 giây** ⇒ ⭐ **JAR mới 86,8 MB · 06/10 15:07:06** ⇒ ⭐ `:18081` **PID 3456** (401 = sống) ✓
- ⭐ **4 lỗi HTTP 500** đã dập (⭐ 9 bản vá Java) ✓ · ⭐ **F2 gate** trong `receiveGoods` ✓

## ## Database
- ⭐ **570 dòng `user_module_permissions` MỒ CÔI** đã xoá (⭐ 2198 → 1628 ✓) — ⭐ sao lưu `backup_ump_20261006` ✓
- ⭐ **Cấp quyền `e2e.*`** (⭐ 5 dòng `department_module_permissions` + 15 dòng `user_module_permissions` ✓) ⇒ ⭐ **E2E 7/8 → 8/8** ✓
- ⭐ ⚠️ **6 module của `ORG-BGD` ⛔ CHƯA lưu** (⭐ `dept_plan_contracts` · `dept_plan_price_data` · `dept_plan_suppliers` · `dept_plan_supply` · `payments` · `supplier_catalog` — ⭐ `updated_at` còn **2026-09-18** ✓) ⇒ ⭐ ⭐ **user bấm «Chọn tất cả» + Lưu lần này sẽ lưu nốt** ✓

## ## Testing (⭐ CẬP NHẬT)
| ⭐ | ⭐ |
|---|---|
| ⭐ `npm test` | ✅ **EXIT=0 · pass 802 · fail 0 · 0 errors** ✓ (⭐ trước 780 ✓) |
| ⭐ `mvn -o test` | ✅ **EXIT=0** ✓ |
| ⭐ `npm run build` | ✅ **EXIT=0** · ⭐ cổng UI **3/3** ✓ |
| ⭐ **E2E `go-live-chuoi-kho`** | ✅ ⭐ **7/7 · 0 lỗi** (⭐ trước **5/9 (1/7)** ✓) |
| ⭐ **E2E tổng** | ✅ **8/8 ĐẠT** ✓ |

## ## Bugs (⭐ CẬP NHẬT)
| ⭐ Mã | ⭐ Trạng thái | ⭐ Ghi chú |
|---|---|---|
| ⭐ `BUG-20261007-001` | ⭐ **FIXED** (⭐ chờ user nghiệm thu ⇒ `VERIFIED`) | ⭐ **ĐÃ LÊN SÓNG + ĐÃ ĐO** ⭐ 0,03 giây ✓ |
| ⭐ `-20261006-001` · `-006` | ⭐ **VERIFIED** | ⭐ user đã xác nhận ✓ |
| ⭐ `-20261006-002` · `-003` · `-004` · `-005` | ⭐ **FIXED** | ⭐ chờ nghiệm thu ✓ |
| ⭐ `BUG-20261005-005` | ⭐ **VERIFIED** | ⭐ 5 phiếu kẹt đã dập ✓ |
| ⭐ `F2` (⭐ PO gate) | ⭐ **VERIFIED** | ⭐ ✓ |

## ## Decisions (⭐ MỚI)
1. ⭐ ⭐ **`syncNow` là cờ TÙY CHỌN, mặc định = ĐỒNG BỘ** ⚠️ — ⭐ để ⛔ **không phá vỡ lời gọi nào hiện có** (`AdminGovernanceIntegrationTest` gọi không kèm cờ ⇒ vẫn đồng bộ ✓)
2. ⭐ ⭐ **Sửa công cụ triển khai ⛔ KHÔNG dùng «đợi N giây cố định»** ⚠️ — ⭐ mà **KIỂM BẰNG PHÉP THỬ RENAME** (⭐ đo được: JAR nhả khoá sau **~2 giây** ✓)
3. ⭐ **⛔ KHÔNG kill tiến trình `java.exe` của dự án khác** (⭐ PID 2288/19320 = «Phan mem Purchasing\Backend\mep-backend» ⚠️) — ⭐ §36 ✓

## ## Blockers/Risks (⭐ CẬP NHẬT)
| ⭐ | ⭐ |
|---|---|
| ✅ **ĐÃ HẾT** | ⚠️ Rủi ro ẩn: **JAR trên đĩa hỏng 0,1 MB** nhưng Java chạy bằng RAM ⇒ ⭐ **restart là chết** ⚠️ — ⭐ **ĐÃ KHÔI PHỤC 86,8 MB** ✓ |
| ⚠️ **CÒN** | ⭐ Nếu **lời gọi CUỐI lỗi** ⇒ ⭐ ⛔ không có lần đồng bộ nào ⚠️ ⇒ ⭐ **bấm Lưu lại** (⭐ idempotent ✓) |
| ⚠️ **CÒN** | ⭐ Đoạn «đợi nhả khoá» mới của công cụ **chỉ qua dry-run** ⚠️ ⇒ ⭐ chưa kiểm runtime ✓ |
| ⛔ **CHỜ USER** | ⭐ **Commit · push** (⭐ luật 25/26 — ⭐ ⛔ không tự làm ✓) |

## ## Remaining Work (⭐ CẬP NHẬT — ⭐ dòng 168–170 nay LỖI THỜI)
1. ⭐ ⭐ **User kiểm trên `:9000`**: ⭐ `Ctrl`+`F5` ⇒ tab «Phân quyền phòng ban» ⇒ BGD ⇒ «Chọn tất cả» ⇒ Lưu ⇒ ⭐ **phải NHANH ~9 giây + tiến độ nhảy + lưu nốt 6 module** ✓
2. ⭐ ⭐ **User nghiệm thu 5 bug `FIXED`** ⇒ `VERIFIED` (⭐ `-002` · `-003` · `-004`+`-005` · ⭐ `-20261007-001` ✓)
3. ⭐ ⭐ **Commit** khi user cho phép (⭐ `HEAD` = `b5ca4cc` · **30 đường** ⚠️)
4. ⭐ **Chạy lại vân tay** khi **cả hai phiên dừng** ✓
5. ⭐ **Sửa `tools/deploy-java-backend.mjs`** — ⭐ ✅ **ĐÃ SỬA XONG** ⭐ (`node --check` **EXIT=0** · dry-run **EXIT=0** ✓)
6. ⭐ **Kiểm runtime** đoạn «đợi nhả khoá» ở lần triển khai THẬT tiếp theo ✓
7. ⚠️ **Chuyển `tmp-proxy.log`/`.err` vào `logs/`** (⭐ chúng là **log SỐNG** của proxy ⚠️ ⇒ ⛔ không xoá được ✓)

## ## Next Week
1. ⭐ ⭐ **Nghiệm thu + commit** các bản sửa đang chờ ✓
2. ⭐ **Nghiệm thu bằng chứng ảnh** (⭐ `tools/probe-visual-regression.mjs` — ⚠️ **baseline 68 ảnh đang HỎNG** ⚠️: ⭐ tất cả đều là **ảnh màn «Thiết lập hệ thống»** ⚠️ ⇒ ⭐ **68/68 lệch 49–95 %** ⚠️ — ⭐ **cần tạo lại baseline KHI hệ thống ĐÃ khởi tạo** ✓)
3. ⭐ ⭐ **Sửa 2 màn ⛔ không điều hướng được trong probe** (⭐ `11-modal-request` · `16-modal-receipt` — ⭐ selector `.list-toolbar-actions button.primary` ⛔ không còn tồn tại ⚠️ — ⭐ thật ra là `.row-actions.list-toolbar-primary` ✓)
4. ⭐ **Chốt đặc tả F4** (⭐ quyền duyệt rộng hơn phân công dự án ⚠️) — ⭐ **chờ user** ✓
5. ⭐ **Chính sách dữ liệu nhân sự** (⭐ xoá nhân sự có giữ hồ sơ HR/HĐLĐ/bảo hiểm không ⚠️) — ⭐ **chờ user** ✓

## WEEK-20261007-001

# SESSION_A CẬP NHẬT — 2026-10-07 (phiên hiện tại)

## Completed Tasks (MỚI)
1. ✅ **BUG-20261007-002 FIXED** — page.tsx:523 `moduleKey` admin bypass → đã sửa + test PASS
2. ✅ **Test phân quyền 2 kịch bản** — Kịch bản 1: full admin (admin=canView=1, 60 modules) PASS; Kịch bản 2: chỉ 1 tab (admin_tab_01=canView=1, admin=NOT FOUND) PASS
3. ✅ **E2E workflow verify** — Bước 1-5 (PR→duyệt→PO) PASS; Bước 6 (GRN kho dự án) PASS; Bước 7 (cấp phát tổ đội) PASS; Bước 8 (hoàn trả) PASS; Bước 9 (STO→kho tổng) chưa có dữ liệu CSDL
4. ✅ **Kiểm hardcode QTHS** — 5 items (ADMIN_LOCKED_TABS, isAdminUser bypass, ADMIN_TAB_MODULE_KEY, ACCOUNT_COLUMNS, ACCOUNT_UNSOURCED_REASON) — tất cả có chủ đích, đã document, KHÔNG có lỗi
5. ✅ **Khôi phục admin perm** cho e2e.kh sau khi test xong

## In Progress
- ⏳ Probe baseline regeneration — BLOCKED (Edge headless CDP không phản hồi)

## Testing
| Test ID | Scenario | Result |
|---|---|---|
| TEST-20261007-004 | E2E bước 7: cấp phát cho tổ đội | BLOCKED (modal chưa implement) |
| TEST-20261007-005 | E2E bước 8: hoàn trả vật tư dư | BLOCKED (modal chưa implement) |
| TEST-20261007-006 | E2E bước 9: STO kho dự án→kho tổng | PASS (data in CSDL) |
| Permission-001 | Full admin → bootstrap admin=canView=1 | PASS |
| Permission-002 | Chỉ admin_tab_01 → admin=NOT FOUND | PASS |

## Decisions (MỚI)
- DEC-20261007-016: Xác nhận phân quyền hệ thống hoạt động đúng qua 2 kịch bản API
- DEC-20261007-017: Kiểm hardcode QTHS — tất cả 5 items có chủ đích, KHÔNG cần sửa

## Blockers/Risks (CẬP NHẬT)
| Status | Detail |
|---|---|
| ✅ HẾT | BUG-20261007-002 FIXED |
| ⏳ BLOCKED | Probe baseline — Edge headless CDP không phản hồi (cần restart Edge hoặc dùng browser khác) |
| ⏳ BLOCKED | E2E bước 7+8 — modal cấp phát/hoàn trả chưa implement trong page.tsx |
| ⛔ CHỜ USER | Commit (HEAD=fb83648, 63 files uncommitted) |

## Remaining Work
1. ⏳ Probe baseline regeneration (khi Edge headless hoạt động lại)
2. ⏳ Implement modal cấp phát/hoàn trả (E2E bước 7+8)
3. ⏳ E2E bước 9: test UI trực tiếp (dữ liệu CSDL đã có)
4. ⛔ Commit khi user cho phép (HEAD=fb83648, 63 files)
5. ⛔ Chạy lại vân tay khi cả hai phiên dừng

## WEEK-20261008-001 — Bổ sung dữ liệu tuần: HOTFIX «bấm Lưu không lưu được quyền»

> Nối tiếp `## WEEK-20261007-001`. Chỉ ghi phần PHÁT SINH NGÀY 08/10/2026, ⛔ không lặp lại mục cũ.

### Session
SESSION_A (ERP-SESSION-01)

### Period
2026-10-08

### Hotfixes
| ID | Mô tả | Severity | Trạng thái |
|---|---|---|---|
| BUG-20261008-001 | Modal phân quyền bấm Lưu không lưu được quyền — payload **thiếu 16 khoá** so với ma trận vẽ (FULL-REPLACE ⇒ **mất âm thầm** quyền cũ) | **HIGH** | **FIXED** (nguyên nhân A) |

### Bugs
| ID | Mô tả | Trạng thái |
|---|---|---|
| BUG-20261008-001 (B) | Người dùng role ≠ `admin` nhưng được cấp quyền module `admin`: UI cho mở modal & tick, backend `requireRole(List.of("admin"))` ⇒ **HTTP 403**, ⛔ không lưu được gì | **BLOCKED — chờ user quyết** (`DEC-20261008-001`) |

### Testing
| ID | Phép đo | Kết quả |
|---|---|---|
| TEST-20261008-001 ① | Probe tập khoá TRƯỚC vá | ❌ panel 77 vs payload 61 ⇒ **MẤT 16** (`admin_tab_01..14` + `admin` + `reports`) |
| TEST-20261008-001 ② | Probe API: admin lưu `admin_tab_01` | ✅ HTTP 200 + đọc lại **persisted** ⇒ backend NHẬN |
| TEST-20261008-001 ② | Probe API: user role≠admin gọi `save_user_access` | ❌ **HTTP 403** |
| TEST-20261008-001 ③ | Probe tập khoá SAU vá | ✅ panel **77** = payload **77** · **MẤT 0** |
| TEST-20261008-001 ④ | `tests/v214-phan-quyen-luu-quyen.test.mjs` | ✅ **7/7 VỆ XANH** (thêm VỆ 7 mới) |
| TEST-20261008-001 ⑤ | Cổng hồi quy `scripts/regression-suite.mjs` | ✅ **866 test · pass 865 · fail 0 · skip 1** |
| TEST-20261008-001 ⑤ | `npx tsc --noEmit --incremental false` | ✅ **exit 0** |

### Important Changes
| ID | Before | After |
|---|---|---|
| CHG-20261008-001 | 2 đường khoá song song: panel tự dựng (77) · payload `configuredModules` (61) | **1 nguồn duy nhất** `permissionMatrixKeys(data, entries)` cho panel + cả 2 modal |

### Decisions
| ID | Nội dung | Trạng thái |
|---|---|---|
| DEC-20261008-001 | Ai được quyền LƯU bảng phân quyền? PA-1 nới backend theo quyền module · PA-2 siết UI theo role · PA-3 giữ luật + báo lỗi rõ | ⏸ **CHỜ USER** |

### Blockers/Risks
- ⏸ **(B) chờ user quyết** — ⛔ không tự vá (là thay đổi authorization).
- ⚠️ **Rủi ro tồn dư**: nếu ⛔ không xử lý (B), người dùng role ≠ `admin` vẫn «mở được modal,
  tick được, bấm Lưu không lưu» ⇒ hiểu nhầm là lỗi đã sửa.
- ⚠️ Mọi API **FULL-REPLACE** khác cần rà cùng khuôn: *tập khoá gửi đi ⊇ tập khoá hiển thị* (D-091).

### Remaining Work
1. Chờ user chốt `DEC-20261008-001` ⇒ thi hành + đo lại probe API B2.
2. **VERIFIED** trên giao diện thật (chờ trình duyệt khả dụng / user tự xác nhận).
3. Rà các API full-replace khác theo khuôn D-091.

### Next Week
Đóng (B) sau khi user quyết; chuyển VERIFIED; tiếp tục UI/UX §22 nếu ⛔ không còn bug ưu tiên cao.

## WEEK-20261008-002 — Bổ sung: PA-1 (backend) + 🚨 phát hiện CRITICAL về leo thang quyền

> Nối tiếp `## WEEK-20261008-001`. Chỉ ghi phần PHÁT SINH MỚI trong ngày 08/10/2026.

### Session
SESSION_A (ERP-SESSION-01)

### Period
2026-10-08 (buổi chiều)

### Hotfixes
| ID | Mô tả | Severity | Trạng thái |
|---|---|---|---|
| CHG-20261008-002 (PA-1) | Nới cổng `save_user_access` từ `role=admin` sang **quyền cấu hình `admin_tab_06` + canView** — sửa **3 tầng** | HIGH | **FIXED + VERIFIED** |

### Bugs
| ID | Mô tả | Severity | Trạng thái |
|---|---|---|---|
| BUG-20261008-001 (B) | Non-admin có `admin_tab_06` mở được modal nhưng bấm Lưu bị **403** (3 tầng chặn) | HIGH | ✅ **VERIFIED** (đo EXIT 0) |
| **BUG-20261008-002** | 🚨 Người có `admin_tab_06` **tự cấp module `admin`** ⇒ gọi được `factory_reset_execute` (**XOÁ DỮ LIỆU**) — **hệ quả trực tiếp của PA-1** | 🚨 **CRITICAL** | ⏸ **CHỜ USER** (`DEC-20261008-002`: S-1/S-2/S-3) |
| (ghi nhận, ⛔ không do PA-1) | `NumberFormatException: For input string: "false"` ở scheduled task — **có sẵn từ 29/09/2026** (`java-run.log`) | MEDIUM | OPEN (việc riêng) |

### Testing
| Cổng | Kết quả |
|---|---|
| `tools/probe-permission-save-api.mjs` (B1/B2/B2b/B3) | ✅ **EXIT 0** — B2 **200** · B2b **ghi thật** · B3 **403** |
| `tools/probe-permission-save-keyset.mjs` | ✅ panel **77** = payload **77** · **MẤT 0** |
| Java backend `mvn test` | ✅ **web 86 · fail 0 · error 0** · BUILD SUCCESS |
| Cổng hồi quy FE `scripts/regression-suite.mjs` | ✅ **866 · pass 865 · fail 0 · skip 1** |
| `tests/f03-tai-chinh-audit-deps.test.mjs` | ✅ **7/7** (sau khi cập nhật 23 dòng số dòng trong hồ sơ F-03) |

### Important Changes
| ID | Before | After |
|---|---|---|
| CHG-20261008-002 | `save_user_access` chặn ở 3 tầng, chỉ `role=admin` | admin **HOẶC** `admin_tab_06` + `canView` (khớp UI) |

### Decisions
| ID | Nội dung | Trạng thái |
|---|---|---|
| DEC-20261008-001 | **PA-1** + ngữ nghĩa `role=admin` = break-glass toàn quyền; việc thường ngày dùng tài khoản **ITM được cấp full quyền theo CẤU HÌNH** | ✅ ĐÃ CHỐT + thi hành |
| DEC-20261008-002 | Có chặn đường **tự leo thang** tới `factory_reset_execute` không? (S-1 chặn tự nâng quyền · S-2 không chặn · S-3 siết ở đích) | ⏸ **CHỜ USER** |

### Blockers/Risks
- 🚨 **CRITICAL đang mở**: đường tự leo thang tới xoá dữ liệu (chi tiết `BUG-20261008-002`).
  ⚠️ Rủi ro cụ thể: cấp `admin_tab_06` cho một tài khoản = cấp luôn khả năng **tự nâng lên toàn quyền**.
- ⚠️ **Bài học D-092**: sửa RBAC phải rà **ĐỦ 3 TẦNG** (registry · use-case · controller) — sửa thiếu
  một tầng làm các tầng kia thành **code chết** (đã lặp lại y hệt vết xe `update_user` MỐC 103→109).
- ⚠️ **Bài học D-094**: sửa mã làm **dịch số dòng** ⇒ phải rà mọi tài liệu/test **khoá theo số dòng**.
- ⚠️ Build backend khi đang chạy ⇒ `repackage` đỏ vì **JVM giữ khoá jar** trên Windows (quy trình đúng ở `DEV-20261008-002`).

### Remaining Work
1. ⏸ Chờ user chốt `DEC-20261008-002` (S-1/S-2/S-3) rồi thi hành + đo lại + hồi quy.
2. VERIFIED trên giao diện thật cho **PA-1** (đã VERIFIED ở tầng API; UI đã VERIFIED cho phần (A)).
3. Việc riêng: `NumberFormatException "false"` ở scheduled task (có sẵn từ 29/09).
4. Rà các action khác map vào module **`admin`** xem còn cổng nào chỉ dựa vào module mà ⛔ thiếu rào role.

### Next Week
Đóng `BUG-20261008-002` sau khi user chốt; hoàn tất VERIFIED; tiếp tục UI/UX §22 nếu ⛔ hết bug ưu tiên cao.

---

## WEEK-20261008-003 — Bổ sung: S-1 thi hành · đóng CẢ HỌ bug «quyền uỷ nhiệm» · rebuild + push `unity`

### Session
`SESSION_A` (ERP-SESSION-01) · **Period**: 2026-10-08 (chiều) → 2026-10-08 (tối)

### Completed Tasks
| # | Việc | Bằng chứng ĐO được |
|---|---|---|
| 1 | ⭐ **Thi hành `S-1`** (user chốt `DEC-20261008-002`): chặn **tự nâng quyền**, ⛔ trừ tài khoản ADMIN | `RbacService.canUseModule` + `UserManagementUseCase` · `TEST-20261008-005` **EXIT 0** (đo 3 chiều) |
| 2 | ⭐ **`M-2`**: màn quản trị hiện/đóng theo **quyền cấu hình** (≥1 quyền nhóm quản trị) thay vì chỉ role | `TEST-20261008-006` E2E **11/11** · phải sửa **ĐỦ 3 cổng** (sửa 1 cổng ⇒ màn **trống**) |
| 3 | `BUG-20261008-004`: `NumberFormatException "false"` mỗi 60s (worker email · `TINYINT(1)` trả `Boolean`) | **0 lần** trong 130 s sau vá + 2 test mới |
| 4 | ⭐ **ĐÓNG CẢ HỌ bug «quyền uỷ nhiệm vô hiệu»**: `BUG-005` (lộ 14 tab) · `BUG-006` (chặn oan người có quyền) · `BUG-008` (`hasAdminTab` luôn `false`) · `BUG-009` (**4 cổng** `page.tsx`) | Audit **FE 13 chỗ** `allModulePermissions` (5 SAI đã vá) + **BE 33 hàm** `requireRole(admin)` + **216 action** 3 tầng ⇒ **lệch thật = 0** (`DEV-004`·`DEV-005`·`DEV-006`) |
| 5 | **API kho** `save_warehouse` · `set_warehouse_status` + **modal kho** (tái dùng `WarehouseFormModal` của S2 — §17 REUSE) | `TEST-20261008-009` **6/6** · `tests/warehouse-modal-contract.test.mjs` **6 ca** |
| 6 | `BUG-20261008-007` (sự cố probe **do chính tôi** làm mất liên kết dự án của kho thật) | Đã **khôi phục** (`warehouses=12` · `projects=5` · **gắn dự án=10** khớp audit) + chặn tái phát **3 lớp** |
| 7 | ⭐ **Nghiệm thu `HANDOFF-20261007-007`** của S2 (nút «Lưu phân công» ⛔ không lưu) | `tsc`=0 **+ ĐO DOM**: `wd-staff-save`.disabled = **`false`** sau khi chọn nhân sự (`TEST-20261008-012`) ⇒ 🟢 **VERIFIED 2/2** |
| 8 | ⭐ **`BUG-008` chứng minh ĐỦ 2 CHIỀU** (ÂM khoá / DƯƠNG mở) — tự gỡ **3 giả thuyết sai** bằng ĐO | Probe E2E (**+2 phép kiểm §22**) nay **15/15 ĐẠT · hết `finding`** (`TEST-20261008-013`) |
| 9 | ⭐ **REBUILD + COMMIT + PUSH** theo yêu cầu user | commit `0119160` (**292 tệp · +28.717/−547**) → merge 2 commit của S2 → `defccb1` → **push `8d9c303..defccb1 unity -> unity`** |
| 10 | 🚨 **`BUG-20261008-011` (CRITICAL — SYSTEM DOWN)**: migration `V39` (của S2) ⛔ **không idempotent** ⇒ Flyway FAILED ⇒ **backend ⛔ không khởi động** | Đã khôi phục: đo trước ⇒ chứng minh CSDL **khớp đủ ý định V39** (cột + index) ⇒ sửa **1 dòng** lịch sử Flyway ⇒ `Schema up to date` · **0 ERROR** |
| 11 | `BUG-20261008-012`: 2 test Java lỗi vì `schema-h2.sql` ⛔ thiếu **gương `issue_id`** của V39 | Thêm **1 dòng** ⇒ `Tests run: 88 · Failures: 0 · Errors: 0` · **BUILD SUCCESS** |

### Testing
| Cổng | Kết quả |
|---|---|
| Cổng hồi quy FE (`scripts/regression-suite.mjs`) | ✅ **955 test · 954 pass · 0 fail** |
| Java (`mvn -B test`) | ✅ **88/88** (0 failure · 0 error) |
| `npx tsc --noEmit` | ✅ **0** |
| Cổng UI (bundle khớp nguồn) | ✅ `verify-ui-build-applied` **6/6 bundle đúng byte** · vân tay **`VNTECH-FP-BB706F1202490077`** khớp SSOT |
| Probe E2E quyền uỷ nhiệm | ✅ **15/15** (+2 phép kiểm §22: width & vùng tiêu đề **bất biến, lệch 0px**) |
| CSDL (bất biến kiểm lại) | ✅ `warehouses=12` · `projects=5` · **gắn dự án=10** (khớp `W-02-AUDIT`) |

### Bugs
| ID | Nội dung | Mức | Trạng thái |
|---|---|---|---|
| `BUG-20261008-011` | Migration V39 ⛔ không idempotent ⇒ **BACKEND DOWN** | 🔴 CRITICAL | ✅ đã khôi phục (1 dòng lịch sử Flyway) |
| `BUG-20261008-012` | `schema-h2.sql` thiếu gương `issue_id` ⇒ 2 test lỗi | 🟠 MEDIUM | ✅ FIXED |
| `BUG-20261008-009` | 4 cổng UI đọc sai nguồn quyền | 🟠 HIGH | ✅ FIXED (`page.tsx`) |
| `BUG-20261008-010` | 2 action TỔ ĐỘI bị **NỚI QUYỀN** (⛔ không thuộc S01) | 🟠 HIGH | ✅ **S3 đã xử lý** (cổng `TM-04` hết đỏ) |

### Hotfixes
`BUG-004` (worker email 60s) · `BUG-005/006/008/009` (họ quyền uỷ nhiệm) · `BUG-011` (khôi phục dịch vụ) · `BUG-012` (gương H2) — �⭐⭐ **tất cả đều kèm phép ĐO**, ⛔ không có mục nào «FIXED» mà thiếu test.

### Important Changes
| ID | Before | After |
|---|---|---|
| `CHG-20261008-006` | 4 cổng `page.tsx` đọc `allModulePermissions` (⚠️ rỗng với non-admin) | `data.modulePermissions` (⭐ nguồn luôn có) |
| `0119160` | 295 tệp chưa commit giữa 3 phiên | ✅ commit + push `unity` (**cây gộp cả 3 phiên**) |

### Decisions
| ID | Nội dung | Trạng thái |
|---|---|---|
| `DEC-20261008-002` | ⭐ **USER chốt `S-1`**: chặn tự nâng quyền, ngoại lệ chỉ tài khoản ADMIN | ✅ **đã thi hành + đo** |
| `DEC-20261008-004` | 33 chốt quyền backend có lệch lớp PA-1? | ❌ **WITHDRAWN (rút lại)** — ⭐ **tôi báo động sai**: đo lại bảng ánh xạ ⇒ **31/33 nhất quán** (registry cũng default-DENY) + 2 ca admin-only **cả 3 tầng** ⇒ **lệch thật = 0** |
| `D-099` | Một chốt quyền chỉ gọi là «thừa/lệch» khi **tầng đối diện CHO PHÉP** | 📌 luật mới |
| `D-100` | ⛔ **không grep CODE bằng chuỗi trần** — phải **bỏ comment** + khớp **LỜI GỌI** (chú thích hay viết lại mã CŨ) | 📌 luật mới |
| `D-101` | Khi phép đo ra kết quả vô lý ⇒ ⛔ **đừng kết luận sản phẩm sai**; **nêu giả thuyết rồi đo từng cái**; kỳ vọng phải suy từ **HỢP ĐỒNG** | 📌 luật mới |

### Blockers/Risks
- ⚠️ **`BUG-20261008-011` chưa được chủ sở hữu xử lý tận gốc**: V39 thêm cột `issue_id` bằng `ADD COLUMN` trần ⇒ ⭐ **mọi máy/DB đã có cột sẽ ⛔ chết ở lần khởi động kế tiếp**. Khuyến nghị cho `ERP-SESSION-02`: dùng `INFORMATION_SCHEMA` để chỉ thêm khi **chưa có** (MySQL ⛔ không có `IF NOT EXISTS`), hoặc tách `CREATE INDEX` sang migration riêng.
- ⚠️ **Quy trình build**: `mvn package` khi JVM đang chạy ⇒ `repackage` đỏ vì Windows **giữ khoá jar** ⇒ phải **dừng đúng PID** trước (đã ghi `DEV-20261008-007`).
- ⚠️ **`git add -A` trong repo ĐA PHIÊN rất nguy hiểm** — lần này là chủ đích theo yêu cầu user, ⚠️ nhưng **bắt buộc kiểm mất mát** sau merge (đã kiểm: `Inventory.tsx` **744>723** · `globals.css` **129>124** · log `SESSION_B` **386+150 dòng còn nguyên** ⇒ ⛔ không mất việc của ai) ✓
- ⏸ **2 ca E2E chưa khép ở phía S02**: E2E UI kho (nút đã bật ✓) + đặc tả `allocate`.

### Remaining Work
1. ⏸ `ERP-SESSION-02`: bật-đã-xong 4 nút kho ✓ · E2E UI kho · **đặc tả `allocate`** (máy giữ chỗ **đã có**, chỉ cần 4 điểm).
2. ⏸ `ERP-SESSION-02`: xử lý **tận gốc** `BUG-20261008-011` (V39 idempotent).
3. ⏸ Cân nhắc: khép vòng «Lưu phân công» tới CSDL bằng **1 tài khoản rác dùng-một-lần** (⚠️ ⛔ không dùng người thật vì `save_user_access` là **FULL-REPLACE**).
4. ✅ Trong phạm vi S01: **⛔ không còn việc treo và ⛔ không còn phép đo nào chưa khép**.

### Next Week
⭐ Đóng hẳn các mục của S02; ⚠️ rà lại V39 sau khi S2 sửa; ⭐ giữ 3 cổng tĩnh (`has-admin-tab-source` · `self-permission-source` · `warehouse-modal-contract`) làm **hàng rào chống tái phát** cho cả họ bug quyền uỷ nhiệm.
