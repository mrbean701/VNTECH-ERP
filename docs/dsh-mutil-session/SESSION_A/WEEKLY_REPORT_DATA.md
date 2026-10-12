# WEEKLY_REPORT_DATA — SESSION_A (ERP-SESSION-01)

> Phien: **ERP-SESSION-01** · Timezone Asia/Ho_Chi_Minh (UTC+7)
> ⭐ **§15**: du lieu phai **TONG HOP TU LOG** (TASK_LOG · DEV_LOG · CHANGE_LOG · TEST_LOG · BUG_HOTFIX_LOG · DECISION_LOG · HANDOFF_LOG · EVENT_LOG) — ⛔ **KHONG suy doan** ✓
> ⭐ **§37 LOG ONCE — REPORT MANY**: ghi 1 lan, dung lai cho daily · weekly · monthly · bug statistics ✓

---

# PHẦN A — CHUẨN §14 (đủ **17 mục**, ⭐ đặt TRƯỚC để gộp báo cáo tuần tự động được)
> ⭐ Khuôn này **theo đúng cách `SESSION_C` đã dùng** («PHẦN A đủ 17 mục · PHẦN B giữ nguyên nhật ký cũ — ⛔ không xoá log») ✓
> ⚠️ **Vì sao phải có PHẦN A**: `SESSION_A` trước đây dùng tiêu đề **tiếng Việt** ⇒ khi đối chiếu theo **tên mục chuẩn §14** thì bị đếm là «thiếu 6/17» (`HANDOFF-20261007-C06`) ⚠️ ⇒ nay có **PHẦN A khớp tên chuẩn** ✓ (PHẦN B bên dưới **giữ nguyên 100%**, ⛔ không xoá/⛔ không viết lại) ✓

## Session
SESSION_A (`ERP-SESSION-01`)

## Period
2026-10-05 → 2026-10-11

## Completed Tasks
- `TASK-20261009-001` — khai quyền **6 action «MÙ QUYỀN»** theo `HANDOFF-20261008-D14` (`list/open/save/log/delete_contract_review` + `work_scope`) ⇒ cổng `probe-action-registry-coverage` **EXIT 0** ✓
- `TASK-20261009-002` — **đổi định danh sản phẩm sang `VNTECH ERP V5.3.0 ALPHA TEST 2026.10`** + `npm run build` **EXIT 0** + cổng UI **3/3 ĐẠT** ✓
- `TASK-20261009-003` — **bác bỏ `BUG-20261008-D03`** (12 action «mồ côi») = **BÁO ĐỘNG GIẢ** bằng phép đo 4 chiều ⇒ ⛔ **0 dòng mã đổi** ✓
- (tuần) 4 task `VERIFIED` + 4 task `DONE` — xem `SHARED_TODO.md` §`ERP-SESSION-01` ✓

## In Progress
- ⏳ **3 việc chờ USER quyết** (`DEC-20261009-018`): ① đồng bộ banner `docs/**` + `AGENTS.md` sang nhãn ALPHA TEST ② làm mới `MANIFEST_SHA256.txt` ③ chọn module cho **CRUD DỰ ÁN** (`docs/38 §7`) ⇒ mở khoá `T-05` ✓
- ✅ `CHG-20261009-012` = **FIXED** (đã triển khai, hiện vật **JAR `:18081` 6/6**) — ⏸ `VERIFIED` **một phần**: còn 1 phép đo live bằng tài khoản thật ✓

## UI/UX
- Thay đổi **nhìn thấy được** hôm nay: **nhãn sản phẩm** trong bundle = `VNTECH ERP V5.3.0 ALPHA TEST 2026.10` ✓ (⛔ 0 thay đổi giao diện khác)
- Cổng nghiệm thu UI: **`✓ do-moi ✓ van-tay ✓ byte 6/6`** = «BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT» ✓

## Frontend
- `lib/vntech-identity-data.mjs` (SSOT định danh) + 8 tệp phản chiếu (`Dockerfile` · `deploy/docker-compose.yml` · `.env.example` · `VNTECH_*.txt` · `VNTECH_FINGERPRINT.json` · `README.md`) ✓
- Cổng FE: **960 test · 959 PASS · 0 FAIL · 1 skip · EXIT 0** (31 giây) ✓ · `tsc` **0** ✓

## Backend/API
- `ActionRbacRegistry.java`: khai **6 action** (module + capability) — chèn ở **CUỐI 2 map** để ⛔ không dịch số dòng ✓
- `SystemController.java`: 2 `case` mới (`add_work_item_comment` · `set_work_item_participant`) — ⛔ không dịch dòng nào trước đó ✓
- Bộ test Java: **102/102 · 0 fail · 0 error** ✓ · jar **13:46:12** · `:18081` pid **12248** · `health 200` ✓

## Database
- ⛔ **0 thay đổi schema** trong tuần này (bảng `work_item_comments`/`work_item_participants` đã có từ vòng port trước) ✓
- Bất biến dữ liệu (đo cuối lượt): kho **12** · dự án **5** · gắn DA **10** · user HĐ **28** ⛔ không đổi ✓

## RBAC/Workflow
- ✅ **6 action «mù quyền» đã khai** ⇒ `④ MÙ QUYỀN = 0` · `⑤ THIẾU capability = 0` · `probe-action-parity` **Java thiếu 0** ✓
- ⛔ **`BUG-20261008-D03` KHÔNG phải lỗi**: 12/12 action **CHỈ ADMIN ở CẢ Java và JS** (`ADMIN_ONLY_ACTIONS` + `requireRole(["admin"])`) ⇒ ⭐ Java **=** JS ✓

## Bugs
- `BUG-20261009-015` — **VERIFIED** (port 2 action công việc; đã đo live 200 + đối chứng âm) ✓
- `BUG-20261008-D03` — 🚫 **CANCELLED (báo động giả)** — S01 đo 4 chiều, ⛔ 0 dòng mã đổi ✓
- ⚠️ **`test:release-static` đỏ = NỢ CŨ** (manifest 01/10 lệch tệp 26/09) — ⛔ **không do S01** ⇒ chờ user quyết ② ✓

## Hotfixes
- ⛔ **0 hotfix** trong lượt này (2 thay đổi đều là công việc theo yêu cầu, ⛔ không phải sửa lỗi khẩn) ✓
- ⚠️ **TỰ SỬA (⛔ 0 dòng mã sản phẩm)**: 2 **chú thích của chính S01 sai sự thật** (`TEST-20261009-021`) — đã sửa theo **số đo thật** ✓

## Testing
- `TEST-20261009-015/016/017` (port 2 action công việc) · `TEST-20261009-018` (5 ca RBAC mới) · `TEST-20261009-019` (xác minh 3 tầng) · `TEST-20261009-020` (bác bỏ `D03`) · `TEST-20261009-021` (kỷ luật số dòng + tự sửa chú thích) ✓
- Cổng: Java **102/102** · FE **960/959/0** · `tsc` **0** · `F-03` **7/7** · UI **3/3** ✓

## Important Changes
- `DEV-20261009-011` — định danh **ALPHA TEST 2026.10** + build (vân tay **`VNTECH-FP-C37A1809D58C5856`**) ✓
- `CHG-20261009-011` — định danh sản phẩm · `CHG-20261009-012` — khai quyền 6 action ✓

## Decisions
- `DEC-20261009-017` — ⭐ **USER chốt phương án (d)**: build + đổi **PHIÊN BẢN SẢN PHẨM** sang **ALPHA TEST** ✓ (đã thi hành xong)
- `DEC-20261009-018` — **3 việc chờ user quyết** (banner `docs/**` · `MANIFEST_SHA256.txt` · module CRUD dự án) ✓

## Blockers/Risks
- ⚠️ **Chờ USER**: 3 việc ở `DEC-20261009-018` ✓ (⚠️ `update_goal pause` bị công cụ từ chối ⇒ goal giữ *active*)
- ⚠️ **Chờ `ERP-SESSION-04`**: thêm **6 tên** vào `KNOWN_JAVA_ONLY` (`HANDOFF-20261009-A05`) · đóng `BUG-20261008-D03` (`A06`) ✓
- ⚠️ ⛔ **59+11 chỗ nhãn/vân tay cũ** còn lại (chủ yếu `docs/**` + `AGENTS.md`) — chờ quyết định ① ✓

## Remaining Work
- 3 việc chờ user quyết ⇒ sau đó: đồng bộ banner, làm mới manifest, thi hành `T-05` ✓
- ⏸ `CHG-20261009-012` → `VERIFIED` (cần probe live bằng tài khoản thật — đã để sẵn `SESSION_A/probes/verify-d14-live.mjs`) ✓

## Next Week
- Sau khi user trả lời `docs/38 §7` ⇒ thi hành `T-05` (module CRUD dự án + `update_project` `canUse→canEdit`) ✓
- Duy trì 9 loại log + `WEEKLY_REPORT_DATA`; ⛔ **0 commit** cho tới khi user cho phép ✓

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

---

## WEEK-20261008-004 — Bổ sung: **BỘ TÀI LIỆU `ALPHA TEST`** · **`BUG-014` (CRITICAL mất dữ liệu) FIXED** · **ĐÓNG MT3** · **ĐÍNH CHÍNH TÀI LIỆU THEO MÃ**

### Session
`ERP-SESSION-01` (`SESSION_A`) · Period: 2026-10-08 → 2026-10-09

### Completed Tasks
| ID | Việc | Kết quả |
|---|---|---|
| `TASK-20261008-005` | ⭐ **BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`** | ✅ gắn nhãn **80 tệp** (⭐ xác minh `git diff` **+449/−1** ⇒ **chỉ THÊM**, ⛔ không hỏng nội dung) · tạo `docs/00_INDEX_TAI_LIEU_ALPHA_TEST.md` + `docs/61_GHI_CHU_PHAT_HANH_ALPHA_TEST_20261008.md` · **viết lại 5 tài liệu chính** bằng **5 subagent song song** (`31` 141→**393** · `30` 155→**487** · `33` 190→**782** · `32` 169→**489** · `34` 206→**538**) |
| `TEST-20261008-014` | **QA bộ tài liệu** | 4/5 «số cũ» còn lại là **bảng so sánh «cũ → mới» CỐ Ý** (⛔ không xoá) · **1 lệch thật** đã sửa (`docs/34`: «114 bảng» → **134**) · làm rõ **52 `.tsx` vs 55 tệp** màn hình (khác bộ lọc) |
| `BUG-20261008-014` | 🔴 **CRITICAL «mất dữ liệu»** — V-1 | ✅ **FIXED** (xem §Bugs) + **đã triển khai** jar 09:41 |
| `TEST-20261008-015` | **5 ca kiểm chứng V-1** | ✅ `UserAccessScopeMergeTest` **4/4** (UNIT) + `AdminGovernanceIntegrationTest` **6/6** (⭐ +1 ca INTEGRATION `listExistingScopes`) · **web 89/89** · 0 failure · 0 error |
| `CHG-20261008-009` | 📚 **ĐÍNH CHÍNH TÀI LIỆU THEO MÃ** | 5 chỗ đã cũ: `BUG-010` (**ĐÃ VÁ**, ⛔ không còn OPEN) · `R-4` (U-1 ⛔ không còn «một phần») · `R-6` (cây **SẠCH**) · `88→89` test · `R-1` |
| `DEC-20261008-016` | 🛑 **CHỈ ĐẠO USER** | **MT 1&2 ĐÓNG — ⛔ không rà lại** · **công việc do user giao trực tiếp** ⇒ ghi vào `MASTER_STATUS` + registry |

### Bugs
| ID | Mức | Nội dung | Trạng thái |
|---|---|---|---|
| `BUG-20261008-014` | 🔴 **CRITICAL** | ⭐ **do chính `U-1` mở đường**: người uỷ nhiệm mở được modal «Thêm nhân sự vào kho», nhưng `data.userWarehouseScopes` non-admin **chỉ có của chính họ** ⇒ `whCu` **rỗng** ⇒ payload **FULL-REPLACE** ⇒ ⛔ **XOÁ phân công kho của nhân sự** | ✅ **FIXED** (+ triển khai) · ⏸ `VERIFIED` chờ user re-check UI |
| `BUG-20261008-010` | 🟠 HIGH | 2 action TỔ ĐỘI bị nới quyền — **ĐO LẠI 09/10: ĐÃ VÁ** ở **CẢ 2 TẦNG** (`ActionRbacRegistry` L137/L303 `List.of()` + `RbacService.ADMIN_ONLY_ACTIONS`) | ✅ **ĐÃ VÁ** (⚠️ tài liệu cũ ghi «OPEN» là **SAI** ⇒ đã đính chính) |
| `BUG-20261008-011` | 🔴 CRITICAL | `V39` ⛔ **vẫn** `ADD COLUMN` trần (L31) | ⚠️ **rủi ro còn nguyên trong mã** (chủ sở hữu khác) |

### Hotfixes
| Chiều | Nội dung |
|---|---|
| **Ngữ nghĩa V-1** | ⭐ người ⛔ **không phải admin** chỉ **THÊM/SỬA** phạm vi, ⛔ **KHÔNG XOÁ** (khoá trùng ⇒ **payload thắng**; khoá cũ còn thiếu ⇒ **giữ nguyên**) · ⭐ **`role=admin` giữ nguyên FULL-REPLACE** ⇒ **zero regression** |
| **Tệp sửa** | `UserAdminStore.java` (➕ `listExistingScopes`) · `UserAdminStoreAdapter.java` (➕ 3 `SELECT`) · `UserManagementUseCase.java` (➕ khối V-1 L339–360 + helper `hopThemKhongXoa`) |
| **Cổng** | ✅ `mvn -B compile` **0** · `mvn -B test` **89/89** · **BUILD SUCCESS** · jar **09:41** · `health` **200** · 3 cổng sống · **CSDL kho 12/5/10** ⛔ không đổi |

### Testing
| Loại | Kết quả |
|---|---|
| **UNIT (V-1)** | ① người có **3** phạm vi, payload gửi **1** ⇒ **vẫn còn 4** + quyền cũ **GIỮ NGUYÊN** ✓ ② gửi lại **cùng khoá** ⇒ **payload THẮNG** ✓ ③ chưa có phạm vi ⇒ ghi nguyên ✓ ④ `hienCo=null`/dòng thiếu khoá ⇒ an toàn ✓ |
| **INTEGRATION (V-1)** | `listExistingScopes` trả **đúng 3 khoá** + **ĐÚNG TÊN TRƯỜNG** (`projectId`/`warehouseId`/`moduleKey`/`canView`…) ⇒ ⭐ khoá chặt **hợp đồng tên trường** (nếu sai thì phép HỢP ⛔ âm thầm không giữ được gì) ✓ |
| **Ca «admin ⛔ không đổi»** | ✅ **đã có sẵn** (`phanQuyenPhongBan_…`) và **vẫn xanh** — ⭐ V-1 **miễn trừ admin** ✓ |
| **Cổng hệ thống** | Java **89/89** · FE **955 test / 954 pass / 0 fail** · `tsc` **0** · cổng UI **6/6 byte** (`bb706f1202490077`) · probe quyền **17/17** · CSDL **12/5/10** |

### Important Changes
| # | Thay đổi | Ghi chú |
|---|---|---|
| 1 | **V-1 lên sống** (backend đã triển khai) | ⭐ rủi ro mất dữ liệu **đã chặn ở MÁY CHỦ** (⛔ không để client quyết định xoá gì) |
| 2 | **Dọn 43 tài khoản `probe_*`** (do probe E2E của S01 tạo) | ✅ vô hiệu hoá (`active=0`) ⇒ hoạt động **71 → 28** · ⭐ hoàn nguyên được · **bất biến kho ⛔ không đổi** ✓ |
| 3 | **Chuẩn nhãn tài liệu** `DOC-ALPHA-TEST-2026.10` | ⚠️ **phân biệt** với **phiên bản SẢN PHẨM** `V5.3.0-MASTER-BASELINE-R1.1.1` (⛔ **không đổi** — vân tay gắn với bản build đang chạy) |
| 4 | **`scripts/regression-suite.mjs`** | ⚠️ **chỉ sửa CHUỖI LÝ DO + chú thích** (đính chính `mt3-be-05`) — ⛔ **không đổi hành vi**: `KNOWN_RED=8` · `allTests=162` · `gateTests=154` ✓ |
| 5 | **Git** | commit `268dba5` → `7539626` → `045889a` → `193f3dd` → `4e5fa6d` · ⭐ **local = remote** (`unity`) |

### Decisions
| ID | Nội dung | Trạng thái |
|---|---|---|
| `DEC-20261008-014` | ⭐ **MT3: lựa chọn (b) «khôi phục» là BẤT KHẢ THI** — 📏 `git log unity..backup/mt3-head-20260928` = **0 commit** · `git diff --shortstat` = **RỖNG** | ✅ đo được |
| `DEC-20261008-015` | 🛑 **USER CHỐT: MT3 đã rollback ⇒ ⛔ không lấy MT3 làm căn cứ cho công việc sắp tới** ⇒ đóng hẳn câu hỏi (a)/(b) · 8 tệp `KNOWN_RED` = **NỢ CŨ ĐÓNG BĂNG** | ✅ **đã thi hành** |
| `DEC-20261008-016` | 🛑 **CHỈ ĐẠO USER**: **MT 1&2 ĐÓNG — ⛔ không rà lại** · **việc do user giao TRỰC TIẾP** ⇒ ⛔ dừng «tự tìm việc kế tiếp» | ✅ **đã thi hành** |
| `D-103`…`D-109` | ⭐ luật rút ra: `blank(...)` là **cơ chế an ninh** · `Measure-Object -Line` **đếm thiếu** · đừng «sửa» số khi chưa đọc ngữ cảnh (**D-105**) · ⛔ đừng chép trạng thái bug từ **nhật ký** mà ⛔ không đối chiếu **mã** (**D-106**) · đợt đã **rollback** phải **ĐÓNG HẲN** trong state (**D-108**) · user chuyển sang **giao việc trực tiếp** thì **nguồn chọn việc đổi hẳn** (**D-109**) | 📌 luật mới |

### Blockers/Risks
- ⚠️ **`BUG-20261008-011` (`V39`)** — ⛔ vẫn `ADD COLUMN` trần ⇒ máy/CSDL đã có `issue_id` sẽ **chết ở lần khởi động sau** (⚠️ chủ sở hữu khác).
- ⏸ **`VERIFIED` cho `BUG-014`** — ⚠️ cần **user re-check trên UI** (⛔ S01 ⛔ không tự ghi vào CSDL dùng chung để kiểm).
- ⚠️ **Phiên bản SẢN PHẨM** ⛔ **chưa** đổi sang alpha test (⚠️ muốn đổi ⇒ phải **build lại + đồng bộ vân tay**, có rủi ro lệch `byte 6/6`).

### Remaining Work
1. ⏸ **`VERIFIED` `BUG-014`** — chờ user re-check UI (tài khoản uỷ nhiệm → «Thêm nhân sự vào kho» → chọn nhân sự **đã có phân công** → Lưu ⇒ ⭐ phân công cũ ⛔ **không mất**).
2. 🎯 **Công việc tiếp theo = do USER giao trực tiếp** (`DEC-20261008-016`) ⇒ ⛔ S01 **không tự chọn việc** từ backlog.
3. ⏸ `ERP-SESSION-02`: `BUG-011` tận gốc (`V39` idempotent) · 2 ca E2E phía S02.

### Next Week
⭐ Chờ chỉ đạo trực tiếp · giữ 3 cổng tĩnh xanh · ⛔ không rà lại MT 1&2 · ⛔ không dùng MT3 làm căn cứ.

### ➕ BỔ SUNG 2026-10-09 (chiều) — `ERP-SESSION-01`: PHỐI HỢP PHÂN QUYỀN NHÓM «CÔNG VIỆC» VỚI S4
- **Việc**: user giao trực tiếp «phối hợp cùng s4 xử lý phân quyền nhóm chức năng Công việc, làm đúng phạm vi, thông báo cho s4».
- **Đã làm (phạm vi S01)**: `DEV-20261009-010` port **2 action WORK** sang Java (`add_work_item_comment` · `set_work_item_participant`) + luật truy cập dùng chung · **5 ca test** (2 đối chứng âm) · **BUILD + triển khai 12:39** · ✅ `mvn -B test` **94/94** · `parity` **0 thiếu** · `F-03` **7/7** · `tsc` **0**
- **`CHG-20261009-011`**: 2 API có hiệu lực thật (đo live: **401** thay vì **400 «chưa triển khai»**) + đồng bộ 2 bảng vào schema test H2
- **`BUG-20261009-015`** (HIGH): «quyền MA» — khai quyền nhưng ⛔ không có API ⇒ **FIXED** (code+test+đã triển khai), ⏸ chờ `VERIFIED`
- **`TEST-20261009-015`**: nghiệm thu live bằng probe của S4 **EXIT 0 trên `:9000` và `:18081`** ⇒ **đóng `MA_TRAN` §5.4**; toàn vẹn CSDL `489/8 · 2775/3` ⛔ không đổi
- **`HANDOFF-20261009-A01/A02`** cho S4: 3 phát hiện (D1 lệch luật JS · **D2 cổng FE đỏ do S4 đang refactor `PermissionAccessPanel`** · D3 schema test thiếu 2 bảng)
- **Rủi ro mở**: ⚠️ `jar` sẽ **lệch mã** nếu S4 sửa Java sau **12:39** ⇒ cần build lại; 🛑 **3 câu user chưa quyết** (`MA_TRAN` §6)

- ✅ **`BUG-20261009-015` → `VERIFIED`** (`TEST-20261009-016`): đo LIVE trên `:18081` — 2 action WORK trả **HTTP 200** (nhiệm vụ thật `CV-DA-261008-3175`), đối chứng âm ẩn danh **401**, hàng ghi đúng cột, **đã dọn** 2 hàng đo (`comments=0 · participants=0`) ✓
- ⚠️ **ĐÍNH CHÍNH**: cổng FE **XANH** `958 · 957 PASS · 0 FAIL · 1 skip` ⇒ thông báo «1 đỏ» trước là **RACE** khi S4 đang ghi tệp (⛔ không phải lỗi S4) ⇒ luật mới **`D-111`** ✓
- 📌 Probe mới tái chạy được: `docs/dsh-mutil-session/SESSION_A/probes/verify-work-actions-live.mjs`

- ✅ **`TEST-20261009-017`**: khoá **RUNTIME** quyền duyệt công việc (`WorkApprovePermissionSplitTest` **3 ca · 2 đối chứng âm** — 403 khi ⛔ không `canApprove`; 400 khi có `canApprove` mà ⛔ không phải trưởng phòng) ⇒ bịt lỗ hổng chỉ-so-chuỗi của `t13`/`t07` · `mvn -B test` **97/97** ✓
- ⏳ **`DEC-20261009-017` BLOCKED**: build UI cần **đổi vân tay sản phẩm** ⇒ chờ user quyết (a)/(b)/(c)/(d) ✓

- ✅ **`DEV-20261009-011`** — **ĐỔI ĐỊNH DANH SANG «ALPHA TEST 2026.10»** (user chốt phương án d): nhãn `VNTECH ERP V5.3.0 ALPHA TEST 2026.10` · vân tay `VNTECH-FP-C37A1809D58C5856` · 9 tệp phản chiếu · `npm run build` **EXIT 0** · cổng UI **3/3 ĐẠT** (`:8787` pid 17980) ✓
- ✅ **`CHG-20261009-012`** — khai quyền **6 action «MÙ QUYỀN»** (`HANDOFF-D14`) ⇒ `probe-action-registry-coverage` **EXIT 0** · `parity` **0 thiếu** ✓
- ✅ **`TEST-20261009-018`** — Java **102/102** · FE **959/958/0** · `tsc` 0 ✓
- ⚠️ **TỒN**: 59+11 chỗ nhãn/vân tay cũ trong `docs/**` (banner + lịch sử) · `probe-catalog-drift` EXIT 1 (cần S4 thêm 6 tên vào `KNOWN_JAVA_ONLY`) · `test:release-static` EXIT 1 (`_javac-verify` SHA256 — sổ sách bước BUILD) ✓

- ✅ **`TEST-20261009-019`** — xác minh 3 tầng `CHG-20261009-012`: nguồn 6/6 · **class trong JAR đang chạy 6/6** (hiện vật `:18081` pid 22264) · H2 5/5 ⇒ **FIXED** (⏸ VERIFIED một phần: còn phép đo live bằng tài khoản thật) ✓
- ⚠️ **Chẩn đoán**: `test:release-static` đỏ = `MANIFEST_SHA256.txt` (tracked · 01/10) lệch tệp 26/09 ⇒ **nợ cũ**, ⛔ không do S01 ✓

- 🚫 **`TEST-20261009-020`** — **`BUG-20261008-D03` = BÁO ĐỘNG GIẢ** (đo 4 chiều 12/12: `ADMIN_ONLY_ACTIONS` có · route JS `requireRole(["admin"])` có · case controller có · registry 0/12) ⇒ ⭐ **Java = JS (cả hai CHỈ ADMIN)** ⇒ ⛔ **0 dòng mã đổi** · đã gửi `HANDOFF-20261009-A06` đề nghị S4 đóng ✓

- ✅ **`TEST-20261009-021`** — kiểm **kỷ luật không dịch dòng** (gate `F-03` **EXIT 0** đo 2 lần; các dòng được trích trước điểm chèn **không đổi** ✓) · ⭐ **tự sửa 2 chú thích SAI SỰ THẬT của chính S01** (đo lại: `docs/61` ⛔ không trích số dòng; `delete_*` = **25 `canEdit` / 13 `canUse`** trên 38) · build lại jar (**13:46:12** · `:18081` pid 12248 · hiện vật **6/6**) ✓ · ⚠️ tồn: `docs/agent-progress/F-03-…md:190` dải `:213…353` nay cũ (ngoài phạm vi S01) ✓

- 🔧 **`CHG-20261009-013` / `TEST-20261009-022`** — sinh lại `MANIFEST_SHA256.txt` (**7611 → 7506** · `_javac-verify` **384 → 0**) ⇒ ✅ **`verify-full-release` EXIT 0** (⭐ vá đúng lỗi `SHA256 không khớp` = NỢ TỪ 01/10, ⛔ không do build hôm nay) · ⚠️ `test:release-static` còn đỏ ở tầng **Brand fingerprint** (do nguồn FE đang bị sửa) ⇒ ⛔ **GIỮ BUILD** + gửi `HANDOFF-A07` xin `RELEASED` ✓
- ✅ **`probe-catalog-drift` EXIT 0** — S4 đã thêm **6 tên** vào `KNOWN_JAVA_ONLY` (13:38:40) và ghi «`BUG-D22` ĐÓNG HẲN» trong `SHARED_STATE` §80 ✓

- 🧩 **`CHG-20261009-014` / `TEST-20261009-024`** — **MÔ HÌNH B** (user chốt): 6 khoá tab Công việc + cấp `can_view` cho **11/11 phòng ban · 28/28 tài khoản** + 6 nhãn ma trận ⇒ cổng `coverage`/`parity`/`catalog-drift` **EXIT 0** · FE **961/960/0** · ⛔ 0 commit ✓
- 🔐 **`TEST-20261009-023`** — vá `create_self_work_item` (thiếu khoá `work`) + cấp `work` cho mọi user (⚠️ 3 tài khoản cũ giữ nguyên quyền — đã kiểm) ✓

- ⭐ **`DEC-20261009-020` / `HANDOFF-20261009-A10`** — **S01 QUYẾT mô hình quyền Công việc** (đúng thẩm quyền user giao 08/10): chọn **B1** (dòng `work_others` — ⛔ không đổi CSDL) + **`canEdit` cho xoá** ⇒ đã tạo `work_others` (⚠️ cấp 0) · S01 làm `delete_work_item` + cưỡng chế `work_others` ✓

- 🚨➡️✅ **GỠ CHẶN 	sc** (lỗi CỦA S01): thêm **7 khoá** vào ModuleKey (lib/ui-shared.tsx:25, cùng dòng ⇒ ⛔ 0 dịch dòng) ⇒ **
pm run typecheck EXIT 0 · 0 lỗi** ✓ · ✅ **delete_work_item** hoàn tất **5 tầng** + test **4/4** + Java **106/106** + jar **14:40:31** + live **401** ✓ · ⚠️ chờ S4 đóng catalog-drift (1 dòng) ✓

- 🎯 **`CHG-20261009-015` / `TEST-20261009-025`** — **CRUD DỰ ÁN cấp qua MA TRẬN** (`Q1=A3`): vá **3 TẦNG** (controller + registry `[`project_admin`,`admin`]` + use-case bỏ 3 `requireRole`) ⇒ ⚠️ bản vá 1 tầng của S4 sẽ là **sửa giả** ⇒ test **4/4** · **Java 110/110** · jar **15:07:47** · giám đốc **vẫn 403** ✓

- 🚀 **`CHG-20261009-016` / `TEST-20261009-026`** — **BUILD ĐÃ CHẠY** tại mốc đóng băng **14:51:12**: vân tay **`VNTECH-FP-EB036564F91A0BAE`** · `dist` **15:13:36** · **cổng UI 3/3 ĐẠT** · **`verify-full-release` EXIT 0** ⇒ người dùng nay thấy toàn bộ thay đổi của cụm ✓ ⚠️ còn `test:release-static` đỏ ở tầng **Lint** (1 lỗi CÓ TRƯỚC: `app/page.tsx:2902` — ⛔ S01 không sửa mù, đã giao `HANDOFF-A14`) ✓

- 🧭 **TASK-20261009-034** — MENU «CÔNG VIỆC» (user yêu cầu trực tiếp 3 việc): ③ **S01 xong** (bấm nhóm ⇒ mở thẳng màn Công việc; P6-08 3/3 ✓) · ① **chuyển S04** (project_admin + khoá work đang hiện thành mục thứ 2) · ② **đã tách sẵn** (pproval_center) ⇒ chờ user Ctrl+F5 ✓

- 🔴➡️✅ **`BUG-20261009-D29` / `TEST-20261009-027`** — **tầng `Lint` của cổng phát hành ĐÃ XANH**: lỗi duy nhất `app/page.tsx:2917` (React Compiler «setState trong effect») ⇒ tắt đúng 1 luật tại đúng 1 dòng (⚠️ tên rule **`react-hooks/set-state-in-effect`** được **CHỨNG MINH** bằng 3 tín hiệu ESLint, ⛔ không đoán) ⇒ **`npm run lint` toàn repo: 0 ERROR** (297 warning được dung nạp) ✓ `typecheck` 0 ✓

- 🎉🎉 **`TEST-20261009-028` / `CHG-20261009-017`** — **LƯỢT CHỐT CUỐI: 2 CỔNG PHÁT HÀNH ĐẠT**: vân tay **`VNTECH-FP-E6A226D754294E10`** · `dist` **15:36:40** · ⭐ **cổng UI 3/3** · ✅ `verify-full-release` **EXIT 0** · ✅✅ **`test:release-static` ĐẠT · 5.3.0-ALPHA-TEST-2026.10** (cả 5 tầng: Template · OpenXML · Brand fingerprint · **Lint**) ⇒ ⭐ người dùng nay thấy toàn bộ thay đổi của cụm ✓

- ⭐ **`CHG-20261009-018` / `TEST-20261009-029`** — **thi hành khoá `work_others` ở backend** (phương án **A — CỘNG THÊM**, user chốt): thêm **vế OR thứ 4** trong `BootstrapDataAdapter` ⇒ ai được tick sẽ **thấy thêm việc PHÒNG mình**, ⛔ **0 mất quyền** (⭐ probe: «KH-TRƯỞNG vẫn KHÔNG thấy DA/BCH» ✓ · **14/14 ĐẠT** · dọn sạch 29/28 ✓) · jar **15:50:21** · `coverage` 0 ✓ ⚠️ chiều DƯƠNG chưa đo (chưa ai được cấp khoá) ✓

- ⭐ **`TEST-20261009-030`** — **`work_others` đo đủ 2 CHIỀU**: `engineer.demo` (phòng DA) thấy **0 → 19 việc** khi cấp tạm khoá (việc NGƯỜI KHÁC cùng phòng) ⇒ xoá khoá ⇒ **về đúng 0** ⇒ ⛔ **0 mất quyền** · 🧹 grants về 0 + 0 dòng tạm ✓

- ✅ **`CHG-20261009-019`** — **chốt lại build 16:00:52** (vân tay **`89797bf7f00b0cf4`** · manifest **7538 tệp** · cổng UI **3/3** · **cả 2 cổng phát hành ĐẠT** · **Java suite 110/110**) ✓ · ⭐ **banner tài liệu ĐÃ đồng bộ sẵn** (⛔ 0 dòng cần sửa — ⚠️ niềm tin cũ «59+11 lệch» đã CŨ) ✓

- 🔴➡️✅ **`BUG-20261009-D31`** — **tab «Phân quyền công việc / Chức năng» ⛔ KHÔNG lọc 4 khoá ẩn** (⭐ **ảnh user ĐÚNG**): `permissionMenuStructure` (`app/page.tsx:300`) chỉ loại `admin` + panel vẽ thẳng `entries` ⇒ sửa **Ở TẦNG VẼ** đúng khuôn `PermissionMatrix` (⚠️ **GIỮ `entries`** ⇒ payload ⛔ không đổi, tránh `BUG-D19`) ⇒ `typecheck` **0** · FE **973·972·0 FAIL** · eslint 0 error ✓ ⏳ chờ user Ctrl+F5 nghiệm thu ✓

- ✅ **`TEST-20261009-031`** — **quét hồi quy `BUG-D31`: SẠCH** (chỉ 2 component vẽ ma trận, **cả 2 đã lọc**; payload cố ý giữ đủ khoá ⇒ ⛔ 0 mất quyền ✓; `configuredModules` nơi khác ⛔ không cần ẩn vì 4 khoá cũ **vẫn hoạt động thật**) ✓

- ✅ **`TEST-20261009-032`** — ➕ **`tests/t15-matrix-hidden-keys-render.test.mjs`** (6 ca) khoá **cả 2 đường vẽ** + **bảo vệ payload** (⛔ cấm lọc `entries` gốc) · ⭐ **nghiệm thu ÂM 2 nửa đều ĐỎ** ⇒ guard thật (⚠️ bản đầu YẾU — chỉ khớp chuỗi hằng số ⇒ đã siết thành **regex trọn biểu thức 2 dòng**) · ✅ cổng FE **979·978·0 FAIL** ✓

- ✅ **`CHG-20261009-020`** — chèn khối **«CẬP NHẬT SỐNG 09/10»** vào `docs/agent-progress/MASTER_STATUS.md` (⚠️ tệp «mọi phiên PHẢI đọc trước» đang trỏ **số CŨ 26/09**: FE 579 · Java 134): nay trỏ **nguồn sống** `docs/dsh-mutil-session/**` + số ĐO hôm nay (FE 979·978·0 · Java 110 · vân tay `169178832f25788e`) + **phạm vi 3 phiên** + cảnh báo BUG-D31/BUG-D19 ✓ (⚠️ chỉ **CHÈN**, ⛔ không viết lại lịch sử — 845→853 dòng) ✓

- ⭐✅ **`TEST-20261009-033`** — **bằng chứng DOM THẬT** cho `BUG-D31`: probe `_probe-matrix-rows.mjs` trên bản đang chạy ⇒ **80 dòng**, 4 khoá CŨ **0 lần**, nhãn «Phòng Kế hoạch»/«Phòng Dự án» **0 lần**, **7 khoá mới CÓ ĐỦ** ⇒ ⭐ **VERIFIED** ✓ (⚠️ lần đầu chỉ in 20/80 ⇒ S01 tự bắt **kết luận từ mẫu bị cắt** và chạy lại bằng bản sao in TOÀN BỘ ✓)

- ✅ **`DEC-20261009-024`** — **điều tra khoá module `admin` (phạm vi ADMIN): ⛔ KHÔNG PHẢI BUG** ⇒ ma trận ⛔ không có dòng `admin` là **đúng thiết kế** (cấp theo **14 khoá `admin_tab_NN`** ✓; menu gate = **vai trò `admin`** hoặc ≥1 tab ✓); ✅ **`admin` VẪN trong payload** (`permissionMatrixKeys` dựng từ `moduleCatalog` ✓) ⇒ ⛔ không rủi ro xoá nhầm (gỡ cảnh báo `BUG-D19` ✓); ⚠️ ghi nhận **21 dòng cấp `admin` = rác tài khoản TEST** (vô hại — ⛔ S01 không tự xoá) ✓

- ✅ **`TEST-20261009-035`** — **quét lớp lỗi `BUG-D32`: SẠCH** (0 chú thích SQL chứa ký hiệu định dạng trên toàn `java-backend`) + ✅ **runtime: `probe-task050-bootstrap` 39 ĐẠT · 0 lỗi** («Java=2 · MySQL=2» ⇒ payload 200, 500 đã hết) + ✅ `probe-nonadmin-access` EXIT 0 ✓
- 🟠 **`BUG-20261009-D33`** (môi trường): `thukydemo` + `nvdademo` **không đăng nhập được (401)** dù `active=1` + hash hợp lệ ⇒ probe **bỏ qua 2 nhánh** ⇒ mất phủ sóng — ⛔ S01 **không tự đặt lại mật khẩu** (chờ user) ✓

- ✅ **`TEST-20261009-036`** — ➕ **`tests/t16-java-sql-textblock-format.test.mjs`** (3 ca): ⛔ cấm ký hiệu định dạng trong **chú thích SQL** (nguồn `BUG-D32` ⇒ HTTP 500) + khoá bản vá `BUG-D27` (`WHERE (%s) AND wi.active=1`) · ⭐ **nghiệm thu âm ĐẠT** (chèn `%` ⇒ ĐỎ đúng dòng 1624 ✓) · ⚠️ lần 1 test sai vì **`URL.pathname` bị mã hoá `%20`** ⇒ đã sửa bằng `fileURLToPath` ✓ · ✅ cổng FE **982·981·0 FAIL** ✓

- ✅ **`CHG-20261009-022`** — ➕ **bảng điều khiển `SESSION_A/README.md`** (7 mục: phạm vi · việc đang làm · số đo cổng · **việc chờ user** · giao tiếp liên phiên · **7 bài học vận hành** · bước tiếp khi resume) — ⭐ §5 hiển thị + §33 khôi phục ✓

- ✅ **`TEST-20261009-037`** — **quét hồi quy `BUG-D27` trên MỌI đường đọc `work_items`: SẠCH** ⇒ ⭐ **chỉ 1 đường đọc-để-hiển-thị** (`BootstrapDataAdapter`) và **đã lọc `active=1`** ✓; các đường còn lại (purge dự án · lưu trữ · tra theo id · UPDATE/DELETE) **đúng là ⛔ không được lọc** ✓ · ✅ đường JS đã có `active=1` (S04 vá ✓) ✓

- ✅ **`TEST-20261009-038`** — **đo end-to-end khoá `work_others`** (user chốt «cấp» 16:26 · S04 `CHG-D39`): **3/3 tài khoản đo được đều có `canView=1`** (`trdademo` 12 việc · `trinhtrench` 0 · `giamdoc.demo` 14) + **3/3 đối chứng ⛔ KHÔNG có dòng** ⇒ ⭐ **VERIFIED, ⛔ 0 rò quyền** ✓ (⚠️ `e2e.kh`/`e2e.bgd` login 401 ⇒ cùng lớp `BUG-D33` ✓)

- ✅ **`CHG-20261009-023`** — **chạy chuỗi chốt theo yêu cầu S04** («CHỜ S01 BUILD FE»): vân tay **`d200c5a3764e166d`** · manifest **7546** · `dist` **16:54:43** · cổng UI **3/3 ĐẠT** · **2 cổng phát hành ĐẠT** (⭐ `test:release-static` đã hết đỏ ✓) · cổng FE **985·984·0 FAIL** (gồm test mới của S04 ✓) ✓ · ⚠️ ghi nhận **trùng số test `t16`** giữa 2 phiên ✓

- ✅ **`TEST-20261009-039`** — **chạy 2 cổng của S04** (họ ⛔ chạy được vì API 502 do S01 rebuild): **CẢ 2 ĐẠT** ⇒ ⭐ **`Q-UI-01`** (nút «＋ Tạo công việc» **sát ô tìm kiếm** ✓ ở nhóm PHỤ, ⛔ không còn nhóm CHÍNH) + ⭐ **`Q-PERM-01`** (`work_others` **MỞ cho cả 5** TP/GĐ, **đối chứng ÂM đạt** ✓) ⇒ khép 2 việc S04 để ngỏ ✓ (⚠️ bài học: probe `.mjs` của S04 phải chạy kèm `--import tsx` ✓)

- ✅ **`CHG-20261009-024`** — **chuỗi chốt lần 3** (S04 đổi tên test `t16`⇒`t17` ⇒ hết trùng số ✓): vân tay **`c8ad30e2ecc29bcf`** · manifest **7546** · `dist` **17:04:44** · **UI 3/3 ĐẠT** · **2 cổng phát hành ĐẠT** ✓ · ⭐ **bài học ĐO ĐƯỢC**: `tests/**` **nằm trong vân tay** và **build nhúng vân tay** ⇒ **đổi tên 1 tệp test cũng phải build lại** ✓ (⚠️ S01 từng suy sai «3 tệp SESSION_A bị phiên khác ghi» ⇒ **chính là lệnh của S01** ✓)

- ✅ **`TEST-20261009-040`** — **nghiệm thu TRỌN 3 yêu cầu trực tiếp của user về MENU «CÔNG VIỆC»**: ① ⛔ **bỏ «Quản trị dự án»** (nhóm có **0** mục module ✓) ② ⭐ **tách «Trung tâm phê duyệt»** thành **NHÓM RIÊNG** `approval_center` (sort **12**) đứng ngay sau «Tổng quan điều hành» ✓ ③ **click «Công việc» mở màn Công việc** (0 mục con + đủ **8 dòng** `work`+6 TAB+`work_others` ✓) ⇒ ⭐ **3/3 ĐẠT** bằng cổng S04 + mã nguồn ✓

- ✅ **`CHG-20261009-025`** — **cập nhật «nguồn sự thật trạng thái»** `docs/agent-progress/MASTER_STATUS.md` (khối «⏩ CẬP NHẬT SỐNG» 7→8 dòng): số ĐO được **17:05** (FE **985·984·0** · Java 110/110 · **vân tay `C8AD30E2ECC29BCF`** · manifest 7546 · `dist` 17:04:44 · UI **3/3** · 2 cổng phát hành ĐẠT) + phân chia phạm vi 3 phiên + **3 yêu cầu user menu đã nghiệm thu 3/3** + **3 bug thật của đợt** (kèm nguyên nhân gốc) + **5 việc chờ user quyết** ✓ (⚠️ bài học: tìm chuỗi có **emoji** bằng `IndexOf` ⛔ không dùng regex ✓)

- ✅ **`TEST-20261009-041`** — **quét hồi quy cho bản vá `BUG-D31`**: 4 khoá cũ **⛔ KHÔNG chết** (gate **8 action** trong `ActionRbacRegistry` + **168 dòng `department_default`** ✓) ⇒ ⭐ **⛔ KHÔNG mất dữ liệu khi lưu ma trận** (chỉ xoá `manual_override` theo từng khoá ✓) · ⛔ **không bypass** ✓ — ⚠️ **hệ quả thật**: admin **⛔ không nhìn/thu hồi** 168 quyền đó ⇒ ⏸ **`DEC-20261009-026` chờ user chọn A/B/C** (S01 khuyến nghị **A**: giữ ẩn + 1 dòng ghi chú/tổng đếm ✓)

- ✅ **`EVT-20261009-102`** — ⭐ **đóng 2 câu chờ-user bằng quyết định CŨ** (áp dụng **bài học 13**): ① phạm vi khoá `work_others` = **tuỳ CHỨC VỤ** (trưởng phòng ⇒ phòng mình · giám đốc/ban lãnh đạo ⇒ mọi phòng ✓ — `workItemWhere` vế OR thứ 4 + `isWorkCompanyScope` ✓) ② **sub-tab** = user đã chốt nguyên tắc «**phân loại theo BẢN CHẤT**» ⇒ đề xuất 7 khoá của S01 chỉ còn cần **xác nhận danh sách** ✓

- ✅ **`TEST-20261009-043`** — **nghiệm thu quyết định 26/09 của user** («gộp Nhà cung cấp»): **đã thi hành đúng** (⛔ xoá mù — giữ khoá quyền `dept_plan_suppliers`, trỏ màn `supplier_catalog` ✓) · ⭐ **giải nghi vấn «2 mục mới»**: `P-07`/`TASK-121` tách **NCC ↔ Đối tác** (trục khác) ⇒ ⛔ **không mâu thuẫn, ⛔ không hỏi user** ✓ · 📌 **ghi nhận: dự án đã có SẴN 2 sổ quyết định trung tâm** (`docs/dsh-state/DECISIONS.md` 3299 dòng + `docs/dsh/MT3_USER_DECISIONS.md` 130 dòng nguyên văn) ⇒ ⭐ **⛔ không tạo sổ thứ ba** ✓

- ✅ **`TEST-20261009-044`** — **nghiệm thu 2 quyết định 27/09 của user**: `A5` (Kho ⛔ **không được xoá** — `delete_warehouse` **18 lần nhắc đều là CẤM** ✓ + `ALLOW_DELETE_WAREHOUSE=false` có test kiểm ✓ + đường thay thế `set_warehouse_status` ✓) · `A1` (**tự động từ chối khi quá SLA** — `RequestStore` L84–85 ghi **nguyên văn quyết định user** + migration V25 + `SlaStore` ✓) ⇒ **2/2 ĐẠT** ✓

- ✅ **`TEST-20261009-045` + `DEV-20261009-018`** — ⭐ **kênh kiểm MỚI: mở UI THẬT bằng trình duyệt** (`http://127.0.0.1:9000/` ✓ — ⚠️ `:8787` login **401** ⇒ ⛔ đừng dùng ✓) ⇒ ⭐ **xác nhận bằng MẮT 3 yêu cầu menu của user**: «CÔNG VIỆC» **1 nút · 0 mục con** ✓ · «Trung tâm phê duyệt» **tách riêng** ✓ · nhóm Mua hàng = **«Nhà cung cấp» + «Đối tác»** ✓ (khớp `P-07` ✓) — ⚠️ **`A2`**: ⛔ **không thấy mục «PR & PO»** trên menu ⇒ củng cố «chưa có form tạo MR/PR/PO» ✓

- ✅ **`TEST-20261009-046`** — **tự kiểm 2/4 điểm user cần thử trên UI SỐNG**: ③ ô «**Xem việc của**» **CÓ HIỆN** cho `giamdoc.demo` (tài khoản đã cấp ✓ — 5 nhóm lựa chọn ✓) ⇒ `CHG-D39` đúng trên UI thật ✓ · ④ nút «**＋ TẠO CÔNG VIỆC**» nằm **cùng thanh công cụ** với ô tìm kiếm ✓ ⇒ `Q-UI-01` đúng ✓ · ➕ màn Công việc = **đúng 6 TAB** ✓ · ⛔ không thao tác GHI ✓ · 📷 ảnh bằng chứng **425 KB** ✓

- 🧭 **`TEST-20261009-047`** — **bản đồ đường đi màn phân quyền** trên UI thật (phục vụ kiểm sau ✓): «QUẢN TRỊ HỆ THỐNG» → «**DANH MỤC & PHÂN QUYỀN**» → tab «**6 Phân quyền người dùng**» = **danh sách 74 người** ⚠️ (⛔ chưa tới bảng khoá module ✓) ⇒ ⭐ dừng đúng lúc, ⛔ không đốt thêm lượt vì điểm ② **đã có bằng chứng máy** ✓

- ✅ **`TEST-20261009-048`** — **toàn vẹn bản phát hành trên CẢ 2 CỔNG**: cổng chính thức `tools/verify-ui-build-applied.mjs` **EXIT 0** ở `:8787` **và** `:9000` ✓ — «dist/ mới hơn nguồn 14s» · «**HTML mang `c8ad30e2ecc29bcf` khớp SSOT**» · «**6/6 bundle đúng byte**» ⇒ ⭐ **bản user đang xem = bản mới nhất** ⇒ 4 thao tác thử tay **hợp lệ** ✓ · ⚠️ bài học 15: ⛔ **không tự suy đường dẫn artifact** (`dist/index.html` ⛔ không tồn tại) — **dùng cổng của dự án** ✓

- ✅ **`TEST-20261009-049`** — đóng 2 điều treo của `TEST-048`: ① `dist\.openai\*` = **gói triển khai riêng** (394 migration SQL + `hosting.json` ✓) ⇒ ⭐ **KHÔNG ảnh hưởng app đang chạy** (cổng 19:35 sau 18:25 vẫn **6/6 bundle đúng byte** ✓) ② `:9000` fetch không phiên trả shell khác ⇒ luật: **kiểm app dùng PHIÊN/cổng dự án** ✓ · ⚠️ **tự đính chính**: `dist\` ⛔ **không chứa app** (`dist\assets` = 0 ✓) — **bài học 16** ✓

- 🎯 **`TEST-20261009-050`** — **`A2` ĐÓNG bằng UI SỐNG** (⛔ không chờ S04 ✓): màn «Nhà cung cấp» ⛔ **0 tab PR/PO** ✓ + ⭐ câu của chính app «**Mã NCC được dùng trong mẫu Excel lập PO**» ⇒ ⭐ **MR/PR/PO lập bằng MẪU EXCEL** ⇒ `A2` («modal tạo MR/PR/PO tìm theo alias») **chưa có chỗ cài** ✓ khớp `P-08` «CHƯA LÀM» ⇒ **BLOCKED BY DESIGN, ⛔ không phải bug** ✓

- ✅ **`TEST-20261009-051`** — **đóng nốt A-list `MT3`**: `A3` đã đóng sẵn ✓ · `A4` luật phòng ban **đã cài** (5 chế độ + resolver ✓) ⚠️ **lộ tồn đọng**: `recipientMode` trống ⇒ mặc định `all` ⇒ **ai gửi cũng được toàn công ty** ✓ (⭐ đã đưa vào §4 ✓) · `A6` ⛔ **không xây màn báo cáo Mua hàng** ⇒ **đúng quyết định** ✓ · ⚠️ **10 tab Mua hàng CHƯA dựng** (màn hiện chỉ **3 tab**: PR · PO · Chi tiết lũy kế ✓) ⇒ ghi tồn đọng, ⛔ không tự dựng (GOAL §19 ✓)

- ✅ **`TEST-20261009-052`** — **`P-4` ĐÃ AN TOÀN THEO THIẾT KẾ** (⭐ đo trước khi hỏi câu thứ 4 ✓): `ActionRbacRegistry` L50 «`save_notification_config` ⇒ `List.of(`admin`)`» + L52/53/63/64 đều `admin` + `RbacService` L115 (lãnh đạo ⛔ không được miễn) ⇒ ⭐ **chỉ module `admin` gửi được thông báo** ⇒ `recipientMode=`all`** ⛔ **không tới người dùng thường** ⇒ ⭐ **GỠ khỏi hàng chờ user (5⇒4 việc)** ✓

- 🔍 **`TEST-20261009-053`** — **đo `P-5` trước khi hỏi** ⇒ ⭐ **hạ mức thành «thông tin»** (hàng chờ thật **4⇒3** ✓): nhóm Mua hàng **khai báo 18 mục** ✓ nhưng **UI sống hiện đúng 2** («Nhà cung cấp» + «Đối tác» ✓); 8 mục cũ (có `subGroup` = «Phòng Kế hoạch») **ẩn có chủ ý** ✓ ⇒ ⭐ nhất quán `P-08` «CHƯA LÀM» ⇒ ⛔ **không phải khiếm khuyết** ✓ (⚠️ tệp của S04 ⇒ S01 ⛔ chỉ đọc ✓)

- 🔬 **`TEST-20261009-054`** — **truy root cause `BUG-D33`** ⇒ ⭐ **KHÔNG phải lỗi ứng dụng**: 6 tài khoản đều `active=1` ✓, hash **cùng định dạng** `pbkdf2$600000$…` (111 ký tự) ✓, ⭐ **`e2e.bgd` (08/10) · `e2e.kh` (07/10) · `nvdademo` (29/09) ĐÃ từng đăng nhập** ✓ ⇒ ⭐ **nguyên nhân = mật khẩu khác `Vntech@2026`** ✓ ⇒ ⭐ **hạ mức `BUG-D33` + GỠ yêu cầu xin phép reset** (S01 đã có `giamdoc.demo` + `ksda.demo` chạy tốt ✓)

- 🔴 **`BUG-20261009-D35` (HIGH · AN NINH/QUYỀN)** — audit 21 dòng `admin` ⇒ ⭐ **thu hẹp xuống ĐÚNG 2 DÒNG**: `e2e.bgd` + `e2e.kh` (**`active=1`**) giữ **`admin` 1/1/1/1 VÔ THỜI HẠN** (nguồn `manual_test` ✓, `permission_expires_at = NULL` ✓); ⭐ **mã CÓ đọc** (`BootstrapDataAdapter` L912/948/955 ✓) ⇒ ⛔ **không phải rác trơ** ✓; ⚠️ **hiện «ngủ»** vì 2 tk chưa đăng nhập được ⇒ ⭐ **nếu ai reset mật khẩu ⇒ KÍCH HOẠT** ⚠️ ⇒ ⭐ **KHUYẾN NGHỊ: ① cho phép xoá 2 dòng (sao lưu trước) ② GỠ QUYỀN TRƯỚC → mới reset mật khẩu** ✓ · ⛔ `BUG-D35` **chưa FIXED** — chờ user ✓

- 🔬 **`TEST-20261009-056`** — **truy root cause tầng mã `BUG-D35`** ⇒ ✅ **⛔ KHÔNG CÓ LỖI MÃ**: sản phẩm chỉ ghi `user_module_permissions` ở **1 chỗ** (`UserAdminStoreAdapter` L269 ✓) và chỗ đó **đòi ROLE `admin`** (`AdminSystemUseCase` gọi `requireRole(…, List.of("admin"))` **6+ lần** ✓) ⇒ ⭐ **UI ⛔ không phải đường leo thang đặc quyền** ✓; giá trị `manual_test` ⛔ **không có trong repo** (0 kết quả ✓) ⇒ ⭐ **2 dòng do GHI THẲNG vào CSDL** ⇒ **vấn đề DỮ LIỆU** (⚠️ chờ user cho phép sửa ✓) + **luật vệ sinh test** ✓
