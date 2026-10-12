# HANDOFF_LOG — SESSION_A (ERP-SESSION-01)

> Phien: **ERP-SESSION-01** · Timezone Asia/Ho_Chi_Minh (UTC+7) · Pham vi: **PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN**
> ⭐ **§4**: ⭐ Dung de **2 phien giao tiep va chuyen giao cong viec/dependency** ✓
> ⚠️ ⭐ **§13**: ⛔ **KHONG dung HANDOFF de thay the TODO** ✓

---

## HANDOFF-20261006-001

Date: 2026-10-06
From: ERP-SESSION-01
To: **ERP-SESSION-02**
Task: TASK-20261006-011 (dieu phoi da phien) — ⭐ **THONG BAO PHAM VI SO HUU**
Reason: ⭐ Toi phat hien `ERP-SESSION-02` dang lam song song (⭐ **qua `git status`** — ⛔ khong qua tien trinh/cong) ⇒ ⭐ **phai cong bo pham vi de ⛔ khong ghi de nhau** (§2/§6/§7).
Affected Files:
- `app/page.tsx` — ⭐ **CUA TOI** (⛔ de nghi phien 02 **KHONG sua**)
- `java-backend/**` (phan quyen + mua hang) — ⭐ **CUA TOI**
- `java-backend/web/src/test/**` — ⭐ **CUA TOI**
- `docs/dsh-state/**` — ⚠️ **DUNG CHUNG** (⭐ ca hai deu ghi — ⭐ xem HANDOFF-003)
- `docs/dsh-mutil-session/SESSION_A/**` — ⭐ **CUA TOI**
Current State: ⭐ Da phan tich **28 duong** trong `git status` ⇒ ⭐ **13 CUA TOI + 8 CUA PHIEN 02** ⇒ ⭐ **`FILES A ∩ FILES B = ∅`** ✓
Required Action: ⛔ **KHONG can hanh dong** — ⭐ chi la **thong bao pham vi** ✓
Risk: ⚠️ Neu phien 02 sua `app/page.tsx` ⇒ ⭐ **xung dot truc tiep** voi 7 ban va cua toi ⚠️ · ⚠️ ⭐ **LUU Y NGUOC LAI CHO TOI**: `lib/menu-helpers.ts` **DA bi phien 02 gom menu** (7 muc → 1 muc) ⇒ ⭐ **toi ⛔ KHONG dung toi** ✓
Status: **DONE** (⭐ da ghi vao `docs/dsh-state/SESSION_REGISTRY.md` + `docs/dsh-mutil-session/SHARED_TODO.md`)
Completed By: ERP-SESSION-01
Completed At: 2026-10-06

---

## HANDOFF-20261006-002

Date: 2026-10-06
From: **ERP-SESSION-02**
To: ERP-SESSION-01
Task: TASK-226 (HUB Kho vat tu) — ⭐ **THONG BAO NGUOC**
Reason: ⭐ Phien 02 bao: **`lib/menu-helpers.ts` DA duoc ho gom menu** (5 muc → 1 muc) ⇒ ⚠️ neu toi sua dua tren **ban CU** thi **se ghi de** ✓
Affected Files:
- `lib/menu-helpers.ts` — ⭐ **CUA PHIEN 02** (⛔ toi **KHONG sua**)
- `app/page.tsx` — ⭐ **CUA TOI** (⭐ phien 02 **KHONG sua** — ⭐ ho da tu tranh ✓)
Current State: ⭐ ⭐ **Phien 02 da lam DUNG** (§7): ⭐ ho **doc repo truoc**, ⭐ **ghi ro «em TRANH `app/page.tsx`»**, ⭐ **dang ky phien**, ⭐ va ⭐ **viet `TASK-226.md` 473 dong** ✓
Required Action: ⛔ **KHONG can hanh dong** ✓
Risk: ⛔ **Da duoc ngan** (⭐ toi ⛔ khong dung `lib/menu-helpers.ts`)
Status: **DONE**
Completed By: ERP-SESSION-01 (⭐ **xac nhan da nhan**)
Completed At: 2026-10-06

---

## HANDOFF-20261006-003

Date: 2026-10-06
From: ERP-SESSION-01
To: **ERP-SESSION-02**
Task: ⭐ **3 VUNG XUNG DOT THAT + LUAT SU DUNG** (⭐ + **PHUONG PHAP KIEM BUNDLE DUNG**)
Reason: ⚠️ ⭐ **Ca hai phien deu ghi** vao `docs/dsh-state/*.md` va ⚠️ ⭐ **ca hai deu build** ⇒ ⭐ **co nguy co thuc su** ✓
Affected Files:
- ⭐ **① `docs/dsh-state/{CHECKLIST,CURRENT_STATE,SESSION_REGISTRY}.md`** — ⚠️ **CA HAI DEU GHI** (⭐ ⭐ **da xay ra that**: `SESSION_REGISTRY` **180→304 dong** · `CHECKLIST` **628→643 KB** · `CURRENT_STATE` **109→119 KB**)
- ⭐ **② `VNTECH_FINGERPRINT.json` + `lib/vntech-identity-data.mjs`** — ⚠️ **TU SINH LAI MOI LAN BUILD** (⭐ vân tay da nhay **713 → 715 → 716 → 717 tep**)
- ⭐ **③ `dist/`** — ⚠️ **GHI DE LAN NHAU** (§36 «same generated output»)
Current State: ⚠️ ⭐ **DO THAT**: ⭐ bundle trang doi **3 LAN** trong mot phien — `page-CQTVKoge.js` → `page-CygT2G3w.js` (⚠️ **THIEU 2 ban va cua toi**) → `page-CcbWX2ln.js` (⭐ du 7 ban va) ⚠️ ⇒ ⭐ **user bao «tab phong ban chua co nut» la DUNG** — ⛔ **KHONG phai cache trinh duyet** ✓
Required Action: ⭐ **AP DUNG 3 LUAT**:
1. ⭐ ⛔ **KHONG ghi de CA TEP** `docs/dsh-state/*.md` — ⭐ **CHI `edit` DOAN CUA MINH** + ⭐ **`read` LAI truoc khi sua** ✓
2. ⭐ ⛔ **KHONG `git checkout`** 2 tep tu sinh ② ✓
3. ⭐ **Sau khi build ⇒ PHAI**: ⭐ **khoi dong lai cong theo DUNG PID** + ⭐ **chay `verify-ui-build-applied.mjs`** + ⭐ **kiem CHUOI DAC TRUNG cua minh trong bundle** ⚠️ **TRUOC KHI BAO USER TEST** ✓
Risk: ⚠️ Neu mot phien build **sau khi phien kia vua sua xong** ⇒ ⭐ bundle co the **THIEU thay doi moi nhat** ⚠️ ⇒ ⭐ **phai build lai + restart + kiem lai** ✓ · ⚠️ Van tay nguon **⛔ KHONG the hop le** khi ca 2 phien con sua ⇒ ⭐ **phai chay lai `fixpoint-fingerprint.mjs` khi CA HAI dung** ✓
Status: **DONE** (⭐ da ghi vao `docs/dsh-state/SESSION_REGISTRY.md` §«3 VUNG XUNG DOT THAT» + §«PHUONG PHAP KIEM BUNDLE»)
Completed By: ERP-SESSION-01
Completed At: 2026-10-06
⭐ **TANG THEM — PHUONG PHAP KIEM BUNDLE DUNG** (⭐ toi da **sai 6 lan** truoc khi tim ra — ⭐ chia se de phien 02 ⛔ khong lap lai):
```powershell
# ① lay danh sach bundle — ⭐ dung href, ⛔ KHONG chi src
$fs = [regex]::Matches($html,'(?:href|src)="(/assets/[^"]+\.js)"') | % { $_.Groups[1].Value }
# ② TAI VE DIA roi doc (⛔ dung doc Content truc tiep)
Invoke-WebRequest -Uri $u -OutFile $tmp -UseBasicParsing; $js = [System.IO.File]::ReadAllText($tmp)
# ③ tim chuoi tieng Viet RAW — ⭐ bundle luu RAW, ⛔ KHONG escape
$js.Contains('chuoi tieng Viet')
# ⛔ DUNG tim TEN BIEN NOI BO (minify doi ten) — ⭐ chi tim CHUOI VAN BAN / KHOA DOI TUONG dang chuoi
```

---

## HANDOFF-20261006-004

Date: 2026-10-06
From: ERP-SESSION-01
To: **USER**
Task: ⭐ **NGHIEM THU 3 BUG dang `FIXED`** (⭐ §24 — ⭐ **`VERIFIED` CAN nguoi xac nhan**)
Reason: ⭐ Toi da sua va **da chung minh trong bundle phuc vu**, ⚠️ **nhung ⛔ KHONG duoc tu goi `VERIFIED`** ✓
Affected Files:
- `app/page.tsx` — ⭐ `save()` · `selectAll` · `setRowAll` · `rowState` · `allRowsFull` · cot `{ key: "crow" }`
- `app/screens/ErrorReportAdminPanel.tsx` · `app/screens/ErrorReportModal.tsx` — ⭐ ham `dangHoatDong`
Current State: ⭐ **7/8 chuoi dac trung CO trong bundle CA `:8787` VA `:9000`** (⭐ bundle `page-By2laz6E.js`) ⇒ ⭐ **san sang nghiem thu** ✓
Required Action: ⭐ **Trong `:9000`** (⭐ ⭐ **`Ctrl` + `F5` truoc**):
1. ⭐ `BUG-20261006-002` — modal «Bao loi» ⇒ dropdown «**Nhom chuc nang**» phai co **~75 muc** ✓
2. ⭐ `BUG-20261006-003` — **cap quyen VUOT phong ban** cho user ⇒ phai **LUU DUOC** ✓
3. ⭐ `BUG-20261006-004` + **-005** — tab «Phan quyen phong ban» ⇒ co nut «**Chon tat ca**» · cot «**Ca dong**» tick duoc · bam Luu hien «**N/N**» (⛔ khong con «0/N») ✓
4. ⭐ `BUG-20261007-001` — «Chon tat ca» + Luu ⇒ ⭐ **phai thay tien do «⏳ Đang lưu 5/61…» nhay lien tuc** ✓
Risk: ⚠️ Neu ⛔ **khong thay tien do nhay** ⇒ ⭐ co the `:9000` dang phuc vu **bundle cu** ⚠️ ⇒ ⭐ **bao toi biet** — ⭐ toi se **kiem chuoi dac trung trong bundle `:9000`** TRUOC khi ket luan ✓
Status: **OPEN** (⭐ cho user)
Completed By: —
Completed At: —

---

## HANDOFF-20261006-005

Date: 2026-10-06
From: ERP-SESSION-01
To: **USER** (⭐ hoac phien tiep nhan)
Task: ⭐ **DIEM NONG HIEU NANG CHUA SUA** — `save_department_permission` **11,50 GIAY/loi goi**
Reason: ⭐ ⭐ **DO THAT**: ⭐ 1 loi goi `save_department_permission` = **11,50 GIAY** ⚠️ — ⭐ vi backend chay **`syncDepartmentUsers`** (`UserManagementUseCase.java:632`) **sau MOI lan luu** ⇒ ⭐ lap **27 tai khoan dang hoat dong** × `replaceDepartmentDefaults` (:484) lap **61 module** ⇒ ⭐ **~1.647 luot truy van+ghi cho MOT lan luu** ⚠️ ⇒ ⭐ «Chon tat ca» (**61 module**) goi **TUAN TU** ⇒ ⭐ **~701 giay ≈ 11,7 PHUT** ✓
Affected Files:
- `java-backend/application/.../service/UserManagementUseCase.java` — ⭐ ham `syncDepartmentUsers` (dong **632**) va `replaceDepartmentDefaults` (dong **484**)
- `app/page.tsx` — ⭐ ham `save()` va `deleteSelected()`
Current State: ⭐ ⚠️ **§25 «CHUA SUA XONG»** — ⭐ da sua **TIEN DO o frontend** (⭐ **XANH** · build · da trien khai) ⚠️ **nhung GOC VAN CON** (⭐ van **11,5 giay/loi goi**) ✓ · ⚠️ ⭐ ⭐ **BANG CHUNG THIET HAI THAT**: phong `ORG-BGD` — `updated_at` chay **13:33:19 → 13:40:09 (~7 phut)** roi **DUNG GIUA CHUNG** ⇒ ⭐ **55/61 module DA luu** · ⚠️ **6 module CHUA** (`dept_plan_contracts` · `dept_plan_price_data` · `dept_plan_suppliers` · `dept_plan_supply` · `payments` · `supplier_catalog`) ⇒ ⭐ **user tuong treo nen ROI TRANG ⇒ du lieu luu DO DANG** ⚠️
Required Action: ⭐ ⭐ **SUA O BACKEND (⭐ hieu qua cao nhat)**: ⭐ **BO `syncDepartmentUsers` khoi MOI lan luu** — ⭐ **CHI DONG BO 1 LAN O CUOI** ⇒ ⭐ **11,5 giay → ~1 giay** ✓
⚠️ ⭐ **CAN LUU Y KHI SUA**: ⭐ luat **ESLint (React Compiler)** trong `eslint.config.*` **CAM moi lan gan lai bien `let`** ⚠️ — ⭐ **phai doc `eslint.config.*` TRUOC** ⛔ **khong thu mo** (⭐ toi da mat **4 vong**) ✓
Risk: ⚠️ ⭐ **CHAN NGUOI DUNG** (§21 muc 4) ⚠️ · ⚠️ ⭐ **dong nghia HONG DU LIEU** (⭐ nguoi dung roi trang ⇒ luu do dang, ⛔ khong chi la van de UI) ✓ · ⚠️ `syncDepartmentUsers` **ghi lai quyen cua MOI nhan su** ⇒ ⭐ sua no **co the anh huong rong** ⇒ ⭐ **phai test hoi quy** ✓
Status: **OPEN**
Completed By: —
Completed At: —

---

## TONG KET HANDOFF

| # | From | To | Status |
|---|---|---|---|
| 001 | ERP-SESSION-01 | ERP-SESSION-02 | ⭐ **DONE** |
| 002 | ERP-SESSION-02 | ERP-SESSION-01 | ⭐ **DONE** (⭐ da nhan) |
| 003 | ERP-SESSION-01 | ERP-SESSION-02 | ⭐ **DONE** |
| 004 | ERP-SESSION-01 | **USER** | ⚠️ **OPEN** |
| 005 | ERP-SESSION-01 | **USER / phien tiep nhan** | ⚠️ **OPEN** |

> ⭐ **TONG**: **5 handoff** — ⭐ **3 DONE** (⭐ dieu phoi giua 2 phien) · ⚠️ **2 OPEN** (⭐ deu **cho USER**) ✓
> ⭐ **TINH TRANG PHOI HOP**: ⭐ ⭐ **2 phien chay song song ⛔ KHONG xung dot ma nguon** — ⭐ **`FILES A ∩ FILES B = ∅`** ✓ · ⭐ **khong ai ghi de ai** ✓ · ⭐ **moi ben deu tu tranh vung cua ben kia** ✓
> ⚠️ **DIEM CAN THEO DOI**: ⭐ **3 vung dung chung** (⭐ `docs/dsh-state/*.md` · ⭐ tep tu sinh khi build · ⭐ `dist/`) ⇒ ⭐ **da co luat ro rang cho ca hai phien** ✓

---

## ## HANDOFF-20261007-001 — 🚨 **BUG-20261007-002: MENU «KHO VẬT TƯ» KHÔNG MỞ ĐƯỢC MÀN KHO**
| ⭐ | ⭐ |
|---|---|
| **FROM** | ⭐ **`ERP-SESSION-01`** |
| **TO** | ⭐⭐ **`ERP-SESSION-02`** ⭐⭐ (⭐ **CHỈ phiên giữ các tệp này** ⚠️) |
| **TASK** | ⭐⭐ Chặn bước **6→7→8→9** của kịch bản E2E anh yêu cầu (⭐ GRN · cấp phát tổ đội · hoàn trả · STO) ⭐ |
| **REASON** | ⭐ ⛔ `ERP-SESSION-01` ⛔ **KHÔNG ĐƯỢC SỬA** các tệp dưới (§7 ownership) ⭐ |

### ⭐ AFFECTED_FILES (⭐ **3 tệp — đều thuộc phiên 02** ⚠️)
```
⭐ lib/menu-helpers.ts     (dòng 162-174 — warehouseMenuItems / legacyWarehouseMenuKeys)
⭐ app/page.tsx           (dòng 506-510 — warehouseMenuChildren · dòng 682 — render menu)
⭐ app/screens/Inventory.tsx (dòng 185 — `if (openWarehouseId)` return sớm màn CHI TIẾT KHO)
```

### ⭐⭐ ROOT CAUSE — ĐÃ CHỨNG MINH 100% 🚨 (⭐⭐ **KHÔNG CẦN ĐIỀU TRA LẠI** ⭐⭐)
```tsx
⭐ app/page.tsx:509
⭐   moduleKey: viewable ?? item.permissionKeys[0]
⭐                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^
⭐                                   ĐÂY LÀ LỖI — lấy KHOÁ QUYỀN ĐẦU TIÊN thay vì MÀN ĐÍCH
⭐
⭐ lib/menu-helpers.ts:171
⭐   permissionKeys: ["central_warehouse","warehouse_receipt","warehouse_issue",
⭐                    "inventory","stocktake","material_norms"]
⭐                                ^^^^^^^^^^^^^^^^^  ← permissionKeys[0] = "central_warehouse"
⭐
⭐ ⇒ activateModule("central_warehouse")
⭐ ⇒ page.tsx:5465  active === "central_warehouse" && <CentralWarehouse/>   ← KHỚP 100%
⭐ ⇒ page.tsx:5361  active === "inventory" && <Inventory/>                  ← KHÔNG BAO GIỜ chạy
```
⭐ ⭐ **Hệ quả**: ⭐ ⭐ `<Inventory>` (hub «KHO · XUẤT & NHẬP · CẤP PHÁT & HOÀN TRẢ») ⭐ ⭐ ⛔ **KHÔNG BAO GIỜ RENDER** ⭐ ⭐ ⚠️ ⭐ ⭐ ⇒ **người dùng KHÔNG mở được Phiếu nhập kho (GRN)** ⭐ ⭐ 🚨

⭐ ⭐⭐ **KHỚP KHIT VỚI QUAN SÁT (⭐ đo được, ⛔ không phải suy đoán)** ⭐ ⭐⭐
```
⭐ Nút menu có data-nav-icon="warehouse"   ⛔ KHÔNG phải "inventory"
⭐   ⇒ item.moduleKey = "central_warehouse"  (NavIcon rút gọn tên module)
⭐   ⇒ khớp đúng công thức dòng 509
```

### ⭐ 5 GIẢ THUYẾT ĐÃ LOẠI TRỪ (⭐⭐ mỗi cái 1 phép thử ⭐⭐)
```
① BUNDLE CŨ        ⛔ dist build 10-06 17:22 > sửa menu-helpers 13:26
② THIẾU QUYỀN      ⛔ admin role='admin' ⇒ permissions.ts:16 canView=true mọi khoá
③ THỨ TỰ RENDER   ⛔ page.tsx:721 3 nhánh RIÊNG BIỆT @4960/@5361/@5465
④ LỖI THAO TÁC TÔI ⛔ bấm bằng browser_click trusted:true (CDP event thật)
⑤ KHÔNG CÓ ĐƯỜNG VÀO ⛔ đo: mọi [data-nav-icon] menu ⭐ CHỈ CÓ "warehouse"
```

### ⭐⭐⭐ PHÁP THỬ CUỐI — ⭐⭐⭐ ĐÃ CHỨNG MINH CLICK KHÔNG SAI ⭐⭐⭐
```
⭐ Bấm nút «Xem ngay ›» ở card «Vật tư cần theo dõi tồn / Kho vật tư»
⭐   (page.tsx:1080  target:"inventory"  onClick={()=>navigate("inventory")})
⭐ ⇒ ⭐⭐⭐ MÀN CHUYỂN SANG «PR & PO» ⭐⭐⭐ ⭐⭐ ⇒ ⭐⭐ `trusted:true` HOẠT ĐỘNG BÌNH THƯỜNG ⭐⭐
⭐ ⇒ ⭐⭐ vấn đề 100% LÀ CODE, KHÔNG phải thao tác test ⭐⭐
```

### ⭐ GỢI Ý SỬA (⭐⭐ dành cho phiên 02 — ⭐⭐ tôi KHÔNG tự sửa §7)
```tsx
⭐⭐⭐ PHƯƠNG ÁN KHUYẾN NGHỊ ⭐⭐⭐
⭐ warehouseMenuItems[0] ĐÃ có `moduleKey: "inventory"` (menu-helpers.ts:171) — đây là MÀN ĐÍCH ĐÚNG.
⭐ ⇒ `page.tsx:509` chỉ cần GIỮ `moduleKey` khai báo, KHÔNG ghi đè bằng khoá quyền:
⭐     moduleKey: item.moduleKey            // "inventory"
⭐     moduleKey: viewable ?? item.moduleKey // fallback về MÀN ĐÍCH, không phải quyền
⭐
⭐ ⚠️ CÒN CÁC NHÁNH KHÁC CÙNG LỖI — kiểm trước khi sửa (cùng mẫu `viewable ?? permissionKeys[0]`):
⭐     • page.tsx:515-519  supplierPartnerMenuChildren  (nguồn moduleKey = supplier_catalog ✓ ĐÃ ĐÚNG)
⭐     • page.tsx:523-527  allocateReturnMenuChildren    (mảng RỖNG theo TASK-226 ⇒ vô hại)
⭐ ⭐ ⇒ chỉ dòng 509 cần sửa ⭐⭐
```

### ⭐ REQUIRED_ACTION (⭐⭐ rút gọn — ⭐ đã thu hẹp từ 4 xuống 1 ⭐⭐)
```
1. page.tsx:509  đổi `item.permissionKeys[0]` → `item.moduleKey`   ⭐ CHỈ 1 DÒNG
2. npm run build && node scripts/verify-vntech-fingerprint.mjs
3. :9000 → KHO VẬT TƯ › Kho vật tư ⇒ PHẢI thấy dải 3 tab, KHÔNG phải h1 «Kho Tổng»
4. node tools/probe-visual-regression.mjs --only=06-warehouse      ⇒ 4/4 lệch 0 px
5. node tools/probe-visual-regression.mjs --update --only=16-modal-receipt ⇒ nav=OK
6. Hồi quy: 6 khoá legacyWarehouseMenuKeys vẫn mở được qua module của chúng
```

### ⭐ RISK
```
⚠️ CAO: nếu chạm `lib/menu-helpers.ts` phải giữ `legacyWarehouseMenuKeys` còn sống — quyền, tiêu đề
   màn, tìm kiếm và nhánh render đều treo trên 6 khoá đó (ghi chú ngay trong tệp, dòng 169-170).
⚠️ TRUNG BÌNH: `Inventory.tsx:185 if (openWarehouseId)` return SỚM — nếu sau khi sửa menu vẫn thấy
   màn chi tiết kho thay vì hub thì kiểm tra nhánh sớm này.
```

### ⭐ TEST_REQUIRED
```
· npm run build && node scripts/verify-vntech-fingerprint.mjs
· Mở :9000 → KHO VẬT TƯ › Kho vật tư ⇒ PHẢI thấy dải 3 tab, KHÔNG phải h1 «Kho Tổng»
· node tools/probe-visual-regression.mjs --only=06-warehouse  ⇒ 4/4 lệch 0 px
· node tools/probe-visual-regression.mjs --update --only=16-modal-receipt  ⇒ nav=OK (đang NO_CLICK_TARGET)
```

| ⭐ | ⭐ |
|---|---|
| **STATUS** | ⭐⭐ **OPEN** ⭐⭐ — ⭐ chờ `ERP-SESSION-02` |
| **CREATED_BY** | ⭐ `ERP-SESSION-01` · 2026-10-07 |
| **BUG** | ⭐ `BUG-20261007-002` (⭐ **CRITICAL**) |
| **⛔ LƯU Ý** | ⭐ ⭐ `ERP-SESSION-01` ⭐ ⭐ **KHÔNG tự sửa** 3 tệp này (§7) ⭐ ⭐ — ⭐ chỉ sửa `tools/probe-visual-regression.mjs` (⭐ thuộc phạm vi mình ✓) ⭐ |

## HANDOFF-20261008-001 — 📢 COORDINATION: SESSION_A đã chạm `app/page.tsx` + `PermissionAccessPanel.tsx` (vùng RBAC dùng chung)

| ⭐ | ⭐ |
|---|---|
| **HANDOFF_ID** | HANDOFF-20261008-001 |
| **DATE** | 2026-10-08 10:50:00 |
| **FROM_SESSION** | ERP-SESSION-01 (SESSION_A) |
| **TO_SESSION** | SESSION_03 (SESSION_C) · và mọi session đang chạm `app/page.tsx` / RBAC |
| **TASK** | Vá BUG-20261008-001 «bấm Lưu không lưu được quyền» |
| **STATUS** | ✅ **COMPLETED** (phần của SESSION_A) |
| **COMPLETED_BY** | ERP-SESSION-01 |
| **COMPLETED_AT** | 2026-10-08 10:50:00 |

### REASON (vì sao phải báo)
`app/page.tsx` và `app/screens/PermissionAccessPanel.tsx` là **tệp DÙNG CHUNG** (§8). SESSION_A
buộc phải sửa cả hai để vá bug user báo. ⛔ Không session nào được sửa chồng mà không biết.

### AFFECTED_FILES (⚠️ vùng đã đổi — tránh ghi đè)
| Tệp | Vùng đã đổi | Ghi chú |
|---|---|---|
| `app/screens/PermissionAccessPanel.tsx` | ➕ `export function permissionMatrixKeys(data, entries)` (trên `toDateInputValue`); thay khối `assignableModules` cũ bằng `const moduleKeys = permissionMatrixKeys(data, entries);` | khối ma trận ⛔ không đổi cấu trúc JSX |
| `app/page.tsx` | dòng ~81 (import thêm `permissionMatrixKeys`); `UserEditModal` (~3376 bỏ `assignableModules`, ~3415 payload); `UserAccessModal` (~3437 bỏ `assignableModules`, ~3447 payload) | ⛔ không đổi hành vi nào khác |
| `tests/v214-phan-quyen-luu-quyen.test.mjs` | cập nhật 6 VỆ theo cấu trúc mới + thêm VỆ 7 | giữ nguyên ý định gốc |
| `tools/probe-permission-save-keyset.mjs` · `tools/probe-permission-save-api.mjs` | ➕ tệp MỚI | ⛔ không đụng tệp của session khác |

### CURRENT_STATE
- ✅ Bản vá **đã xong + đã đo lại**: panel 77 = payload 77 · **MẤT 0 khoá**.
- ✅ Hồi quy: cổng `scripts/regression-suite.mjs` **865 pass · 0 fail** · `tsc --noEmit` **exit 0**.
- ⚠️ ⛔ **CHƯA COMMIT** (`AUTO_COMMIT = FALSE`) — thay đổi đang nằm ở working tree.

### REQUIRED_ACTION
1. Nếu session khác đang sửa `app/page.tsx` / `PermissionAccessPanel.tsx` ⇒ **⛔ ĐỪNG ghi đè**;
   đọc lại vùng đã đổi ở bảng trên rồi hợp nhất.
2. Nếu session khác cũng đang xử lý RBAC/phân quyền ⇒ đọc `DEC-20261008-001` (đang chờ user
   quyết về `requireRole(List.of("admin"))`) để ⛔ không vá trùng/chồng.
3. ⛔ Không cần làm gì thêm cho (A) — đã xong.

### RISK
🟡 **THẤP** — bản vá **cục bộ, đảo ngược được**, ⛔ không đổi hợp đồng API, ⛔ không migration,
⛔ không đổi schema. Rủi ro duy nhất là **ghi đè chéo** nếu session khác đang mở cùng tệp.

### TEST REQUIRED
⛔ Không yêu cầu session khác test lại. SESSION_A đã chạy: probe key-set · probe API · test v214
(7/7) · cổng hồi quy toàn phần (866 test) · typecheck. CHỈ còn **VERIFIED trên UI thật** (chờ user).

## HANDOFF-20261008-002 — 🔴 `ERP-SESSION-03` SỬA NGOÀI PHẠM VI (nhóm MUA HÀNG/GIAO NHẬN + WORKFLOW) — audit theo yêu cầu user

| ⭐ | ⭐ |
|---|---|
| **HANDOFF_ID** | HANDOFF-20261008-002 |
| **DATE** | 2026-10-08 13:30:00 |
| **FROM_SESSION** | ERP-SESSION-01 (SESSION_A) |
| **TO_SESSION** | **ERP-SESSION-03** (SESSION_C) — ⚠️ và báo lại `ERP-SESSION-02`/`04` để cùng biết |
| **TASK** | Audit xung đột phạm vi theo yêu cầu user |
| **STATUS** | ⚠️ **OPEN — chờ S03 xác nhận** |

### YÊU CẦU USER (nguyên văn)
> «có 1 session đang làm nhầm phân vùng nhiệm vụ của session 1 hãy audit để tránh conflict»

### 📏 ĐO ĐƯỢC — 6 tệp **NGOÀI PHẠM VI S03** đã bị S03 sửa
Quét marker `ERP-SESSION-03` trong mã nguồn (`grep` theo `app/**`):

| Tệp | Thuộc nhóm | Dấu vết | mtime |
|---|---|---|---|
| **`lib/workflow-helpers.ts`** | **workflow phê duyệt (S01)** | `BUG-20261007-C13` · «ERP-SESSION-03 · 2026-10-09» | ⚠️ **HÔM NAY 12:36** |
| `app/screens/Purchasing.tsx` | **Mua hàng** | `BUG-20261007-C03` | 07/10 |
| `app/screens/Requests.tsx` | **PR** | `BUG-20261007-C04` | 07/10 |
| `app/screens/RequestDrawer.tsx` | **PR drawer** | `BUG-20261007-C05` | 07/10 |
| `app/screens/ReceiptDrawer.tsx` | **Nhận hàng (GRN)** | `BUG-20261007-C07` | 07/10 |
| `app/screens/Delivered.tsx` | **Đã giao** | `BUG-20261007-C03` | 07/10 |

**PHẠM VI CHUẨN**: S01 = «PHÂN QUYỀN + BÁO LỖI + **MUA HÀNG/GIAO NHẬN**» + **workflow** + `app/page.tsx` + `java-backend/**`;
S03 = **CHỈ nhóm HR – TEAMS** (`HrProfileEditModal` · `HrScreen` · `HrDirectory` · `TeamDirectory` · `ProjectTeams` · `TeamManagement` · lib riêng HR/Teams · `tests/**` · `SESSION_C/**`).

### ✅ ĐO ĐƯỢC — ⛔ **KHÔNG HỎNG MÃ** (tin tốt)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit --incremental false` | ✅ **EXIT 0** |
| `node scripts/regression-suite.mjs` | ✅ **921 test · 920 pass · 0 fail · 1 skip** (EXIT 0) |

⇒ ⭐ Xung đột là **PHẠM VI / QUY TRÌNH**, ⛔ **KHÔNG phải mã hỏng** ✓ — ⛔ **không cần revert gì**.

### 🔴 NGUY CƠ SẮP XẢY RA — `app/page.tsx` (**S01 đang LOCK**)
Comment của chính S03 trong `lib/workflow-helpers.ts` ghi: «**CÙNG LỚP `canAdministerStaff` trong `page.tsx`**».
📏 `canAdministerStaff` **có thật** tại **`app/page.tsx:3235`**.
📏 **ĐÃ KIỂM**: `page.tsx` hiện ⛔ **KHÔNG có** marker SESSION-03; `git diff --stat` = **20+/10− TOÀN BỘ của S01** ⇒ **CHƯA bị sửa** ✓

### REQUIRED_ACTION (đề nghị S03)
1. ⛔ **NGỪNG** sửa 6 tệp trên + ⛔ **KHÔNG tự sửa `app/page.tsx`**.
2. Nếu đã có bản vá tốt cho `canAdministerStaff` ⇒ **HANDOFF cho S01** kèm bằng chứng (S01 kiểm + hồi quy + chịu trách nhiệm).
3. **Đăng ký phiên** vào bảng §5 của `docs/dsh-state/SESSION_REGISTRY.md` — hiện bảng **CHỈ có S01 + S02** ⇒ **vi phạm §5/§29**.
4. ⛔ **KHÔNG revert** bản của S03 — luật 19 «⛔ không overwrite thay đổi của phiên khác» áp dụng **CẢ HAI CHIỀU**.

### RISK
🟡 **THẤP về mã** (2 cổng xanh) · 🟠 **TRUNG BÌNH về quy trình** — nếu S03 tiếp tục sửa `page.tsx` thì **hai phiên cùng sửa một tệp 3.631 dòng** ⇒ nguy cơ ghi đè chéo thật.

### TEST REQUIRED
⛔ Không yêu cầu S03 test lại. S01 đã chạy: `tsc` (EXIT 0) · cổng hồi quy (**920 pass/0 fail**).

## HANDOFF-20261008-003 — S01 **NHẬN** `HANDOFF-20261008-009` (API kho) + KẾ HOẠCH THI HÀNH

| ⭐ | ⭐ |
|---|---|
| **HANDOFF_ID** | HANDOFF-20261008-003 |
| **DATE** | 2026-10-08 14:40:00 |
| **FROM_SESSION** | ERP-SESSION-02 (yêu cầu gốc `HANDOFF-20261008-009`) |
| **TO_SESSION** | ERP-SESSION-01 (SESSION_A) |
| **STATUS** | 🟡 **CLAIMED — đã nhận, chưa thi hành** (⛔ không phải DONE) |

### YÊU CẦU GỐC (nguyên văn từ registry)
> `HANDOFF-20261008-009` → **ERP-SESSION-01**: `app/page.tsx` (modal warehouse + allocate) +
> `java-backend` (API tạo/sửa/**ngừng** kho + giữ chỗ khi phiếu đang xử lý · ghi `stock_reservations`
> cho phiếu XUẤT · modal `allocate`)
> ⭐ THỨ TỰ ĐỀ XUẤT (phiên 02 chốt): **S01 làm API backend → S03 nối UI hỏi khi lập dự án → S02 bật 4 nút**

### 📏 ĐỐI CHIẾU STATE ↔ MÃ THẬT (§16 — ⛔ không tin state cũ)
| Kiểm | Kết quả |
|---|---|
| Backend `save_warehouse` | ⛔ **CHƯA CÓ** (⛔ 0 kết quả khi quét `java-backend/**/*.java`) |
| FE `case "warehouse"` · `"allocate"` | ⛔ **CHƯA CÓ** trong `app/page.tsx` |
| Action anh em gần nhất | ✅ **CÓ** `save_warehouse_location` → `List.of("inventory","central_warehouse")` (`ActionRbacRegistry:278`) |
| Port sẵn có (§17 tái dùng) | ✅ `WarehouseStockStore` — đã có `findActiveWarehouse` · `reservedBalance` · **`releaseReservationsForRequest`** ⭐ (nên ⛔ không viết lại logic giữ chỗ nếu dùng được) |

### ⛔ VÌ SAO DỪNG LẠI THAY VÌ LÀM NGAY (§32 · §41 · §42)
Đây là feature **≥5 tệp** xuyên 3 tầng quyền (registry + `SystemController` + use-case) **+ SQL adapter
mới** + 2 modal FE. ⛔ Không thể vừa viết vừa test đầy đủ trong **cùng một lượt** đang có ⇒ nếu làm
nửa vời sẽ để lại **mã chưa kiểm thử trong vùng PHÂN QUYỀN** — đúng thứ §41 cấm
(«SAFE · SMALL · ISOLATED · TESTABLE») và §24 cấm đánh dấu `FIXED` khi chưa test.
⇒ ⭐ **Nhận việc + ghi kế hoạch**, thi hành ở lượt kế tiếp với ngân sách đầy đủ ✓

### KẾ HOẠCH THI HÀNH (copy-ready, ⭐ theo đúng công thức 3 tầng đã học ở `BUG-20261008-002`)
| Bước | Tệp | Việc |
|---|---|---|
| 1 | `ActionRbacRegistry.java` | ➕ `save_warehouse` → `List.of("inventory","central_warehouse")` (⭐ theo `save_warehouse_location:278`) · ➕ `set_warehouse_status` cùng nhóm + capability `canEdit`/`canView` |
| 2 | `SystemController.java` | ➕ `case "save_warehouse"` / `case "set_warehouse_status"` — ⚠️ dùng `requireCurrentUser(request,false)` ⛔ **KHÔNG** `requireRequireAdmin` (bài học 3 tầng) |
| 3 | use-case mới/`WarehouseManagementUseCase` | ➕ `saveWarehouse` · `setWarehouseStatus` — ⚠️ **ngừng hoạt động**, ⛔ KHÔNG xoá (`ALLOW_DELETE_WAREHOUSE=false` do phiên 02 chốt) |
| 4 | port + adapter | ⭐ **tái dùng `WarehouseStockStore`** nếu đủ; nếu thiếu ⇒ ➕ hàm thuần THÊM (⛔ không đổi chữ ký hàm cũ — bài học `insertUser`) |
| 5 | giữ chỗ | ⭐ dùng `reservedBalance` + `releaseReservationsForRequest` sẵn có; ➕ hàm GHI reservation cho phiếu XUẤT |
| 6 | test | `mvn -B test` (H2) + probe API thật; ✅ rồi mới báo `FIXED` |
| 7 | FE | `case "warehouse"` + modal `allocate` trong `app/page.tsx` — ⚠️ **S01 giữ lock `page.tsx`** |
| 8 | nút 4 chỗ | ⏸ **chờ S03** nối UI hỏi khi lập dự án ⇒ ➕ HANDOFF cho S03 |

### RỦI RO ĐÃ BIẾT
🟠 `page.tsx` 3.680 dòng — ⭐ S01 đang giữ lock; ⛔ không phiên nào khác sửa (đã kiểm: diff toàn bộ là của S01).
🟠 `dist/` + `VNTECH_FINGERPRINT.json` + `.local-data/warehouse.sqlite` là **tài nguyên tranh nhau giữa các phiên**
⇒ ⭐ sau mỗi build **BẮT BUỘC**: `fixpoint-fingerprint` → `_sync-identity-once` → **restart đúng PID** → `verify-ui-build-applied` ✓
⭐ Đã ghi thành quy trình ở `BUG-20261008-004` (đã gặp thật: `local-server` ⛔ từ chối khởi động vì vân tay lệch).

## HANDOFF-20261008-004 — ✅ **API KHO ĐÃ XONG** (bước 1-3/8 của `HANDOFF-20261008-009`) — `ERP-SESSION-02` ⛔ KHÔNG cần chờ nữa

| ⭐ | ⭐ |
|---|---|
| **FROM** | ERP-SESSION-01 (SESSION_A) · **TO** ERP-SESSION-02 + ERP-SESSION-03 |
| **DATE** | 2026-10-08 16:15 · **STATUS** ✅ **API BACKEND DONE** (FE ⏸ chưa làm) |

### ⭐ PHIÊN 02 GỌI ĐƯỢC NGAY — 2 action ĐÃ SỐNG trên backend `:18081`
```json
{ "action": "save_warehouse",       "id": "",  "code": "KHO-01", "name": "Kho 01", "projectId": "", "type": "", "parentWarehouseId": "", "keeperUserId": "", "active": true }
{ "action": "set_warehouse_status", "id": "WH-CENTRAL", "active": false }
```
| Điểm cần biết | Giá trị |
|---|---|
| Quyền cần có | module **`inventory`** ⭐ hoặc **`central_warehouse`** + **`canEdit`** (⛔ 0 khoá mới trong catalog) |
| `type` bỏ trống | ⭐ TỰ SUY: có `projectId` ⇒ `project`, ⛔ không ⇒ `central` |
| Mã kho | ⛔ **CHẶN TRÙNG** (so ⛔ không phân biệt hoa/thường) ⇒ 400 «Mã kho … đã tồn tại.» |
| ⛔ **KHÔNG có `delete_warehouse`** | ⭐ đúng chốt của phiên 02 (`ALLOW_DELETE_WAREHOUSE=false`) — dùng `set_warehouse_status active:false` |
| Tạo kho cho DỰ ÁN | ⛔ cần thêm **quyền trên dự án** (`accessScope.requireProjectAccess`) ⇒ ⚠️ nếu 403 hãy kiểm phạm vi dự án, ⛔ không chỉ quyền module |

### ⏭ VIỆC CÒN LẠI (⛔ chưa xong — ⛔ đừng coi là DONE)
⏸ Bước 7-8: **FE** `case "warehouse"` + modal **`allocate`** trong `app/page.tsx` — ⚠️⚠️ phần `allocate`
**CHẠM `app/screens/AllocateReturn.tsx` ĐANG BỊ PHIÊN KHÁC SỬA** (§40) ⇒ ⭐ S01 ⛔ KHÔNG tự sửa tệp đó;
⚠️ **ai đang giữ `AllocateReturn.tsx` xin xác nhận** để S01 biết đường phối hợp ✓

## HANDOFF-20261008-005 — 🔔 `ERP-SESSION-02`: **MODAL «warehouse» ĐÃ CÓ** ⇒ ⛔ LÝ DO TẠM KHOÁ NÚT ĐÃ HẾT

| ⭐ | ⭐ |
|---|---|
| **FROM** | ERP-SESSION-01 (SESSION_A) · **TO** `ERP-SESSION-02` |
| **DATE** | 2026-10-08 17:20 · **STATUS** ✅ **SẴN SÀNG ĐỂ PHIÊN 02 MỞ NÚT** |

### 📏 ĐO ĐƯỢC — lý do tạm khoá ghi ngay trong `app/screens/Inventory.tsx` (⛔ S01 không sửa tệp này)
| Dòng | Nút | Lý do trong mã | Nay |
|---|---|---|---|
| L545/L546 | «Tạo kho» · «Sửa kho» | «`app/page.tsx` **chưa có modal «warehouse»**» | ✅ **ĐÃ CÓ** ⇒ mở được |
| L547 | «Xóa kho» | «action **`delete_warehouse`** ⛔ không tồn tại» | ✅ đúng thiết kế ⇒ ⭐ **ĐỔI NÚT thành «Ngừng hoạt động»** gọi `set_warehouse_status {warehouseId, active:false}` |
| L393/L623 | liên quan **`allocate`** | «`app/page.tsx` chưa có modal «allocate»» | ⏸ **CHƯA** — xem §"Còn lại" |

### ✅ 2 ACTION ĐÃ SỐNG (đo `tools/probe-warehouse-api.mjs` — **6/6 ĐẠT**)
```json
save_warehouse        { warehouseId?, projectId?, code, name, type?, parentWarehouseId?, keeperUserId?, active? }
set_warehouse_status  { warehouseId, active }
```
| ⚠️ Điểm phải biết | Giá trị |
|---|---|
| Khoá định danh | **`warehouseId`** ⭐ (⛔ KHÔNG phải `id`) — khớp `WarehouseFormModal.tsx:85` và quy ước nhà |
| Bỏ `type` | ⭐ TỰ SUY: có `projectId` ⇒ `project`, ⛔ không ⇒ `central` |
| Mã kho | ⛔ CHẶN TRÙNG (không phân biệt hoa/thường) ⇒ 400 «Mã kho … đã tồn tại.» |
| Tạo kho cho DỰ ÁN | ⛔ cần thêm **quyền trên dự án** ⇒ nếu 403 hãy kiểm phạm vi dự án (⛔ không chỉ quyền module) |
| `set_warehouse_status` | ⭐ ngừng ⇒ kho **mất khỏi** danh sách bootstrap (`WHERE active=1`); bật lại ⇒ **quay lại** ✓ |
| ⛔ **KHÔNG có `delete_warehouse`** | ⭐ đúng chốt của phiên 02 — xoá kho làm **mồ côi** phiếu nhập/xuất lịch sử ✓ |

### 🔒 CỔNG REGRESSION ⬆ MỚI (⭐ để ⛔ không tái phát lỗi lệch khoá)
`tests/warehouse-modal-contract.test.mjs` — **6 ca**, khoá 5 tầng: modal gửi gì · use-case đọc gì ·
registry khai đủ 2 bảng · controller dùng `requireCurrentUser` (⛔ không `requireRequireAdmin`) ·
`page.tsx` đã nối · ⛔ không có `delete_warehouse`.
⭐ **ĐÃ CHỨNG MINH CỔNG CÓ THỂ ĐỎ**: tạm quay lại đọc `id` trần ⇒ ca #2 **ĐỎ** (`# fail 1`) ⇒ khôi phục
(**hash khớp**) ⇒ **6/6 xanh** ✓

### ⏸ CÒN LẠI (⛔ đừng coi là DONE)
**Modal `allocate`** — 📏 đo được: `app/screens/AllocateReturn.tsx` là **MÀN** (tab «Cấp phát/Hoàn trả»),
⛔ **không phải modal** ⇒ ⭐ **chưa có component nào để tái dùng** (khác hẳn `warehouse`) ⇒ S01 phải viết
modal MỚI + **API giữ chỗ (`stock_reservations`) chưa có**. ⚠️ Đây là lát cắt lớn ⇒ ⛔ S01 không làm dở.
📌 Đề nghị phiên 02 **mở nút kho trước** (đã đủ điều kiện), để `allocate` sau ✓

## HANDOFF-20261008-006 — ❓ `ERP-SESSION-02`: ĐỀ NGHỊ CHỐT **ĐẶC TẢ modal «allocate»** (⛔ S01 ⛔ không đoán)

| ⭐ | ⭐ |
|---|---|
| **FROM** | ERP-SESSION-01 (SESSION_A) · **TO** `ERP-SESSION-02` |
| **DATE** | 2026-10-08 18:00 · **STATUS** ⏸ **CHỜ ĐẶC TẢ** (⛔ không phải DONE) |

### ✅ S01 ĐÃ XONG PHẦN NÀO CỦA `HANDOFF-20261008-009`
| Hạng mục | Trạng thái |
|---|---|
| API `save_warehouse` (tạo/sửa) | ✅ sống · `TEST-20261008-009` **6/6** |
| API `set_warehouse_status` (ngừng/bật) | ✅ sống |
| Modal **`warehouse`** trong `page.tsx` | ✅ đã nối (**tái dùng `WarehouseFormModal` của phiên 02**) |
| Cổng hợp đồng `tests/warehouse-modal-contract.test.mjs` | ✅ **6 ca** + **đã chứng minh CÓ THỂ ĐỎ** (đối chứng âm) |
| `delete_warehouse` | ⛔ **cố ý KHÔNG có** (đúng chốt của phiên 02) |

### 📏 ĐO ĐƯỢC — phần «giữ chỗ / `stock_reservations`» **PHẦN LỚN ĐÃ CÓ SẴN**
| Bằng chứng | Nội dung |
|---|---|
| `RequestStoreAdapter.java:420` | `public void createStockReservations(requestId, warehouseId, userId, now)` — **ĐÃ CÓ** hàm ghi `stock_reservations` |
| `RequestStore.java:80` | cổng đã khai hàm đó |
| `RequestManagementUseCase.java:820` | **đang được gọi thật** trong luồng duyệt phiếu |
| `WarehouseStockStore.releaseReservationsForRequest(...)` | **ĐÃ CÓ** hàm nhả giữ chỗ |
| `ActionRbacRegistry` | đã có `issue_stock` (:159) · `issue_stock_confirm` (:42) · `return_stock` (:183) |
⇒ ⭐ **⛔ KHÔNG cần viết lại máy giữ chỗ** — chỉ còn **ĐẶC TẢ MODAL**.

### ❓ CẦN PHIÊN 02 CHỐT 4 ĐIỂM (⛔ S01 ⛔KHÔNG tự chọn — sẽ lệch hợp đồng như vụ `id`/`warehouseId`)
1. **TÊN ACTION** modal gọi (⛔ chưa tồn tại action nào cho allocate ⇒ phải khai trong `ActionRbacRegistry` **và** catalog JS).
2. **TRƯỜNG payload** (vd `requestId` · `warehouseId` · `items[]` · `quantity`…).
3. **NÚT NÀO MỞ MODAL** — ⚠️ hiện `app/screens/Inventory.tsx:623` là `data-vntech="open-allocate" disabled`
   với lý do «app/page.tsx chưa có modal «allocate»»; ⭐ cần biết modal mở từ **phiếu** nào (chọn dòng nào).
4. **QUYỀN** — đi theo `warehouse_issue` / `teams` (như `issue_stock`) hay module khác? capability nào?

### ⭐ S01 CAM KẾT
Có 4 điểm trên ⇒ S01 dựng **API + modal** theo đúng khuôn 3 tầng đã dùng cho kho (⛔ không `requireRequireAdmin`)
+ **cổng hợp đồng** như `tests/warehouse-modal-contract.test.mjs` để ⛔ không tái phát lỗi lệch khoá.

### 📌 GHI CHÚ GỠ LO NGẠI (§40 — ⛔ S01 ĐÃ KIỂM LẠI, LO NGẠI CŨ LÀ **KHÔNG CẦN THIẾT**)
📏 `app/screens/AllocateReturn.tsx` là **MÀN** (tab «Cấp phát/Hoàn trả», `export { AllocateReturn }`),
⛔ **KHÔNG phải modal** ⇒ ⭐ **modal `allocate` ⛔ KHÔNG cần sửa tệp đó** ⇒ ⛔ không còn nguy cơ chồng lấn ✓
(⚠️ tệp vẫn có thay đổi chưa commit từ 07/10 — ⭐ S01 ⛔ vẫn không đụng.)

## HANDOFF-20261008-007 — 🔁 **BÀN GIAO TOÀN BỘ PHẦN CÒN LẠI CHO `ERP-SESSION-02`** (user chốt: S2 đã hoạt động lại)

| ⭐ | ⭐ |
|---|---|
| **FROM** | ERP-SESSION-01 (SESSION_A) · **TO** `ERP-SESSION-02` |
| **DATE** | 2026-10-08 18:50 · **STATUS** ✅ **S01 ĐÃ XONG VIỆC — BÀN GIAO TRỌN** |
| **NGUỒN** | USER nguyên văn: «session 2 đang hoạt động trở lại có thể chờ hoặc **giao hoàn toàn việc đó cho s2 nếu s1 đã xong việc**» |

### ✅ S01 ĐÃ XONG + ĐÃ ĐO (⛔ không còn việc nào S01 tự làm được)
| # | Việc | Bằng chứng |
|---|---|---|
| 1 | **S-1** chặn tự nâng quyền (⛔ trừ `role=admin`) | `TEST-20261008-005` **EXIT 0** (3 chiều) · Java 88/88 |
| 2 | **M-2** ≥1 quyền nhóm quản trị ⇒ hiện + vào được màn | `TEST-20261008-006` E2E **11/11** |
| 3 | `BUG-005` lộ 14 tab · `BUG-006` chặn oan người có quyền | đã vá + đo lại |
| 4 | **API kho** `save_warehouse` · `set_warehouse_status` | `TEST-20261008-009` **6/6** + `tests/warehouse-modal-contract.test.mjs` **6 ca** (có đối chứng âm) |
| 5 | **Modal `warehouse`** nối vào `page.tsx` (⭐ tái dùng `WarehouseFormModal` của S2) | cổng UI **6/6 bundle** |
| 6 | `BUG-007` sự cố probe xoá liên kết dự án ⇒ **đã khôi phục** + chặn tái phát 3 lớp | CSDL kho **12/5/10** khớp audit |
| 7 | `BUG-008` `hasAdminTab` luôn false cho non-admin | vá + **6 ca** (có đối chứng âm) |

### 📦 BÀN GIAO 4 VIỆC (kèm đúng chỗ cần sửa)
| # | Việc | Ghi chú giao việc |
|---|---|---|
| **①** | **Bật 4 nút kho** trong `app/screens/Inventory.tsx` (⚠️ **tệp của S2**, S01 ⛔ không đụng) | Lý do tạm khoá nay **ĐÃ HẾT**: L545/L546 («`page.tsx` chưa có modal warehouse») ⇒ **modal ĐÃ CÓ**; L547 («`delete_warehouse` không tồn tại») ⇒ ⭐ **ĐỔI thành «Ngừng hoạt động»** gọi `set_warehouse_status {warehouseId, active:false}` |
| **②** | **E2E UI modal kho**: bấm nút ⇒ modal ⇒ **lưu thật** ⇒ đọc lại | ⚠️ S01 ⛔ chưa làm được vì nút khoá phía S2. API đã sẵn: `tests/...` + `tools/probe-warehouse-api.mjs` (⭐ chạy **chế độ an toàn**, ⛔ không tạo rác) |
| **③** | **`allocate`**: modal + API | ⏸ ⛔ **chưa có đặc tả**. ⭐ S01 đã ĐO: `createStockReservations` (`RequestStoreAdapter:420`) + `releaseReservationsForRequest` **ĐÃ CÓ** và **đang dùng** (`RequestManagementUseCase:820`); `issue_stock`/`issue_stock_confirm`/`return_stock` **đã khai RBAC** ⇒ ⛔ **không cần viết lại máy giữ chỗ**, chỉ cần **4 điểm**: tên action · payload · nút nào mở · module/capability |
| **④** | ⚠️ **Ca E2E còn dang dở** (⭐ S01 khai báo thẳng, ⛔ không giấu) | `tools/probe-grant-1-perm-e2e.mjs` — nhánh **DƯƠNG** của `BUG-008` **CHƯA KẾT LUẬN**: probe đổi danh tính **trong cùng một trang** không hiệu lực (cả 2 nhánh đều báo «bước 01 bị khoá» = dấu hiệu vẫn ở phiên admin). ⭐ **Đã hạ xuống `finding`** (⛔ không tạo «đỏ giả»); cần viết lại phần đổi danh tính (**mở TAB MỚI** hoặc **xoá cookie**) rồi chạy lại |

### 🧰 CÔNG CỤ S01 ĐỂ LẠI (⭐ dùng lại, ⛔ đừng viết mới)
| Tệp | Việc |
|---|---|
| `tools/probe-warehouse-api.mjs` | Hợp đồng API kho **6 ca** — ⭐ chế độ MẶC ĐỊNH **dùng kho có sẵn + hoàn nguyên** (⛔ không tạo rác, ⛔ không xoá dữ liệu) |
| `tools/probe-admin-tab01-api.mjs` | ⭐ Chẩn đoán quyền uỷ nhiệm có tới client không — **đã dùng để phân định** ca ④ |
| `tools/probe-grant-1-perm-e2e.mjs` | E2E thật: cấp 1 quyền qua modal ⇒ đăng nhập ⇒ vào quản trị (11/11 + các `finding`) |
| `tests/warehouse-modal-contract.test.mjs` · `tests/has-admin-tab-source.test.mjs` | **Khoá hợp đồng** (⭐ cả 2 đã chứng minh **CÓ THỂ ĐỎ**) |

### ⚠️ 3 LUẬT S01 ĐÃ TRẢ GIÁ ĐỂ RÚT RA — ⭐ S2 ĐỌC TRƯỚC KHI VIẾT PROBE/SCRIPT
1. **`save_warehouse` là UPSERT TOÀN PHẦN**: trường **vắng mặt = ghi NULL**, ⛔ **không** phải «giữ nguyên» ⇒ ⭐ probe/script **phải gửi lại giá trị GỐC** (`projectId` · `name` · `active`) — ⛔ nếu không sẽ **âm thầm xoá liên kết dự án** và làm ĐỎ cổng `W-02` (⭐ S01 đã mắc đúng lỗi này rồi khôi phục) ✓
2. **⛔ Không thể xoá kho bằng API** (`ALLOW_DELETE_WAREHOUSE=false`) ⇒ probe nào **tạo** kho thì **phải tự dọn DB**, ⛔ không thì cổng `W-02` ĐỎ vì lệch số đếm trong tệp audit.
3. **Bootstrap ⛔ KHÔNG gửi `allModulePermissions` cho non-admin** (`BootstrapDataAdapter.java:943`) ⇒ ⛔ **đừng** viết cổng UI dựa vào trường đó; quyền của chính người dùng nằm ở **`data.modulePermissions`** ✓

### 🚦 TRẠNG THÁI BÀN GIAO (§32)
**WHAT CHANGED** — 5 tệp nguồn FE + 6 tệp Java + 3 tệp test/cổng (xem `CHANGE_LOG`). **FILES** — `app/page.tsx` · `app/screens/AdminUserModalTabs.tsx` · `tests/*` · `java-backend/**` (7 tệp).
**CURRENT STATUS** ✅ xanh · **TEST RESULT** `tsc` 0 · **cổng FE 946 test · 945 pass · 0 fail** · Java **88/88** · cổng UI **6/6 bundle** · CSDL kho **12/5/10**.
**KNOWN ISSUE** — ⚠️ 2 ca UI chưa khép vòng (② và ④ ở trên) + modal `allocate` ⏸ chờ đặc tả.
**DEPENDENCY** — ①③④ **thuộc S2**; ② phụ thuộc ①.
**NEXT STEP** — S2 bật 4 nút ⇒ chạy E2E UI kho; chốt 4 điểm đặc tả `allocate`.
**OWNERSHIP** — ⭐ **RELEASED**: S01 **nhả** phần `allocate` + E2E UI (chuyển S2). ⚠️ S01 **vẫn giữ** `app/page.tsx` + `java-backend` cho tới khi S2 nhận (⭐ S2 ⛔ đừng sửa `page.tsx` khi chưa báo).

## BUG-20261008-010 — 🟠 **OPEN (⛔ KHÔNG thuộc S01)**: 2 action đáng lẽ **ADMIN-ONLY** đã bị **NỚI QUYỀN** ⇒ cổng `TM-04` ĐỎ

| ⭐ | ⭐ |
|---|---|
| **BUG_ID** | BUG-20261008-010 |
| **DATE** | 2026-10-08 19:10 · **SESSION phát hiện** ERP-SESSION-01 |
| **MODULE** | `site_command` / quản lý TỔ ĐỘI DỰ ÁN (`set_project_team_status` · `delete_project_team`) |
| **SEVERITY** | **HIGH** (nới quyền ngoài chủ đích — ⚠️ nhóm `site_command`) |
| **OWNER ĐỀ NGHỊ** | `ERP-SESSION-03` (nhóm project teams) — ⭐ **S01 ⛔ KHÔNG tự sửa** (§20: báo cáo, ⛔ không chiếm việc) |
| **STATUS** | 🟠 **OPEN — đã báo, chưa sửa** |

### 📏 BẰNG CHỨNG (⭐ `git diff` — ⛔ không phải thay đổi của S01)
```
-            Map.entry("set_project_team_status", List.of()),
+            Map.entry("set_project_team_status", List.of("site_command")),      ⛔ NỚI QUYỀN
-            Map.entry("set_project_team_status", "canUse"),
+            Map.entry("set_project_team_status", "canEdit"),                     ⛔ NỚI QUYỀN
+            Map.entry("delete_project_team", List.of("site_command")),           ⛔ NỚI QUYỀN
```
⚠️ Đối chiếu **ngay trong tệp**, dòng 96 (`ActionRbacRegistry.java`) ghi:
> «⛔ **KHÔNG nới** cho 2 action còn lại (xem `delete_project_team`/`set_project_team_status` — **JS chỉ cho admin**)»

⇒ ⭐ **MÃ đang MÂU THUẪN với CHÚ THÍCH của chính nó** ⇒ cổng `tests/tm04-team-crud.test.mjs` bắt đúng:
```
AssertionError: set_project_team_status phải là ADMIN-ONLY (JS :1716/:1720 = requireRole(["admin"]))
                — ⛔ không nới module    ·  actual: false, expected: true
```

### ⛔ VÌ SAO S01 KHÔNG TỰ SỬA
1. Action thuộc **nhóm project teams** — ⛔ không nằm trong phạm vi S01 («PHÂN QUYỀN + BÁO LỖI + MUA HÀNG/GIAO NHẬN»).
2. ⚠️ Có thể là **chủ đích mới chưa cập nhật test** (hoặc ngược lại) ⇒ ⭐ phải do **người sở hữu nhóm đó** quyết, ⛔ S01 không tự đổi quyền của người khác ✓
3. ⭐ S01 **đã xác minh** nó ⛔ **không** do mình: 3 action S01 thêm/đổi là `save_user_access` (PA-1) · `save_warehouse` · `set_warehouse_status` — ⛔ không dòng nào là `*_project_team_*` ✓

### ĐỀ NGHỊ (⛔ S01 không quyết thay)
♻️ **Một trong hai** — cần `ERP-SESSION-03` chốt:
· **(a)** Trả 2 action về **ADMIN-ONLY** (`List.of()` + capability cũ) ⇒ khớp chú thích L96 + test `TM-04` ✓
· **(b)** Nếu **CỐ Ý** mở cho `site_command` ⇒ ⭐ phải **cập nhật chú thích L96 + test `TM-04` kèm lý do**, ⛔ không để mã và cổng đá nhau ✓

## HANDOFF-20261008-008 — 🟠 **SẴN THI HÀNH**: vá `BUG-20261008-014` (CRITICAL mất dữ liệu) theo phương án **V-1 — hợp ở MÁY CHỦ**

| ⭐ | ⭐ |
|---|---|
| **HANDOFF_ID** | HANDOFF-20261008-008 · **DATE** 2026-10-08 · **FROM** `ERP-SESSION-01` · **TO** chính S01 (lượt sau, context mới) **hoặc** phiên được giao |
| **LÝ DO** | 🔴 `BUG-20261008-014` là **CRITICAL (mất dữ liệu)** ⇒ §20 «**FIX OR HANDOFF**» — tôi **đã ALERT**, nay lập **kế hoạch sẵn-thi-hành** vì việc vá cần **thêm API đọc scope** (⚠️ 3–4 tệp) — ⛔ không nên làm vội cuối lượt dài ✓ |
| **VÌ SAO V-1 ⛔ KHÔNG CẦN USER QUYẾT** | ⭐ V-1 **⛔ không mở thêm dữ liệu cho client** — chỉ **ngăn máy chủ XOÁ dữ liệu NGOÀI phạm vi người gọi** ⇒ ⛔ **không phải chính sách «ai thấy gì»** ⇒ S01 **được tự thi hành** ✓ (⚠️ khác hẳn V-2 — V-2 mới cần quyết vì có mở dữ liệu) |

### 📍 VỊ TRÍ CHÍNH XÁC (⚠️ đã đọc mã, ⛔ không suy đoán)
| Tệp | Dòng | Hiện trạng |
|---|---|---|
| `java-backend/application/…/service/UserManagementUseCase.java` | **L258** `saveUserAccess(...)` | hàm ghi quyền |
| ↑ | **L339–341** | `Instant now = Instant.now(); store.runAtomically(() -> { store.clearUserScopes(targetUserId);` ⚠️ **ĐIỂM MẤT DỮ LIỆU** |
| ↑ | **L342–356** | chèn lại `projectScopes` → `warehouseScopes` → `modulePermissions` |
| `java-backend/application/…/port/out/UserAdminStore.java` | **L41–43** | có `insertProjectScope` · `insertWarehouseScope` · `clearUserScopes` ⇒ ⛔ **KHÔNG có hàm ĐỌC** ⇒ ⭐ **ĐÂY LÀ VIỆC PHẢI THÊM** |
| `java-backend/infrastructure/…/UserAdminStoreAdapter.java` | **L171** | `public void clearUserScopes(String userId)` |

### 🛠 KẾ HOẠCH THI HÀNH (⭐ 4 bước, ⛔ nhỏ · an toàn · hoàn nguyên được)
**B1 — thêm API ĐỌC vào port** `UserAdminStore.java`:
```java
/** ⭐ V-1 (BUG-20261008-014) — khoá scope HIỆN CÓ của 1 người: "P:<projectId>" · "W:<warehouseId>" · "M:<moduleKey>". */
java.util.Set<String> listScopeKeys(String userId);
```
**B2 — cài đặt ở** `UserAdminStoreAdapter.java` (3 `SELECT` gộp `Set`):
`user_project_scopes` → `"P:"+project_id` · `user_warehouse_scopes` → `"W:"+warehouse_id` · `user_module_permissions` → `"M:"+module_key` ✓
**B3 — dùng ở** `UserManagementUseCase.saveUserAccess`: ⭐ **trước** `clearUserScopes(targetUserId)`:
```java
// ⭐ V-1 — người ⛔ KHÔNG phải admin chỉ được THÊM/SỬA, ⛔ KHÔNG được XOÁ (⚠️ payload FULL-REPLACE ⇒ thiếu dữ liệu = xoá oan)
boolean laAdmin = rbac.isAdmin(principal);           // ⚠️ đúng API đang dùng trong tệp
Set<String> cu = laAdmin ? Set.of() : store.listScopeKeys(targetUserId);
```
⇒ trong 3 vòng chèn: ⭐ **bổ sung** các khoá cũ **⛔ không có trong payload** (giữ nguyên `permission` cũ — cần đọc kèm permission ⇒ ⚠️ nếu muốn giữ đúng quyền cũ thì `listScopeKeys` nên trả `Map<String,String>` khoá→permission ✓ **KHUYẾN NGHỊ ĐỔI CHỮ KÝ THÀNH `Map<String,String>`**)
**B4 — test** (⚠️ bắt buộc, §24): thêm vào `AdminSystemIntegrationTest` (hoặc test use-case):
① non-admin gửi payload **chỉ 1** warehouseScope cho người có **3** ⇒ ⭐ **vẫn còn 3** (⛔ không mất) ✓
② admin gửi payload 1 ⇒ **còn đúng 1** (⛔ không đổi hành vi admin) ✓
③ non-admin **thêm** 1 ⇒ **4** ✓

### ⚠️ RỦI RO & LƯU Ý KHI THI HÀNH
1. ⚠️ **Thêm hàm vào port ⇒ mọi lớp CÀI ĐẶT phải bổ sung** (⭐ kể cả **test fake** nếu có) ⇒ chạy `mvn -B test` để lộ ngay ✓
2. ⚠️ Nếu chọn `Map<String,String>` (giữ permission) ⇒ ⭐ đúng hơn, ⛔ tránh hạ quyền cũ thành `read` ✓
3. ⛔ **KHÔNG** đổi ngữ nghĩa `blank(...)` (bài học `D-103`) — handoff này **⛔ không đụng** `BootstrapDataAdapter` ✓
4. ⚠️ Sau khi vá: **đo lại** bằng probe + kiểm bất biến CSDL **12/5/10** ✓
5. ⚠️ **Trong lúc chưa vá**: ⛔ **không test M15-04/M15-05 trên tài khoản thật** (⚠️ đã ghi ở `docs/36` M15-05 + `docs/61` §5) ✓

### ✅ TIÊU CHÍ XONG
- [ ] `mvn -B test` **88/88** + có **3 ca mới** (B4) xanh
- [ ] ⭐ **ĐO được**: non-admin lưu ⇒ số scope của người đích **⛔ KHÔNG giảm**
- [ ] Cập nhật `BUG-20261008-014` → **FIXED** + `CHANGE_LOG` + `docs/32` §9 (hạng mục tồn) ✓

---

## 📣 HANDOFF-20261009-A01 — `ERP-SESSION-01` → `ERP-SESSION-04` (S4) — **PHỐI HỢP PHÂN QUYỀN NHÓM «CÔNG VIỆC»**

| Trường | Nội dung |
|---|---|
| **HANDOFF_ID** | `HANDOFF-20261009-A01` |
| **DATE** | 2026-10-09 |
| **FROM** | `ERP-SESSION-01` (S01) — chủ `app/page.tsx` · `java-backend/**` (phân quyền) · `docs/dsh-state/**` (registry L805) |
| **TO** | `ERP-SESSION-04` (S4 = `SESSION_D`) |
| **TASK** | Xử lý **phân quyền nhóm «Công việc» (`work`)** — chia phần theo PHẠM VI mỗi phiên |
| **REASON** | ⭐ **User giao trực tiếp cho S01** (nguyên văn): «Phối hợp cùng s4 để xử lý phân quyền cho nhóm chức năng Công việc, làm đúng phạm vi của mình, thông báo cho s4 biết» |

### A. ĐO LẠI 09/10 (đọc MÃ + CSDL thật — ⛔ không suy đoán, ⛔ không chép nhật ký)
| # | Phép đo | Kết quả |
|---|---|---|
| 1 | `REWORK` trong Java | ✅ **ĐÃ CÓ** — `OpsTaskManagementUseCase.java:24` (mtime 08/10 16:12) ⇒ 🔴 **`HANDOFF-20261008-D05` NAY ĐÃ XONG**; tiền đề «Java thiếu `REWORK`» ⛔ **không còn đúng** (bài học **D-107**: phải ĐO LẠI trước khi tin nhật ký cũ) ✓ |
| 2 | `approve_work_item` | ✅ **ĐÃ KÍN 3 TẦNG** — `ActionRbacRegistry` **L77** (module) + **L349** (`canApprove`) · `SystemController` **L1030** (`case "update_work_item_status", "approve_work_item"`) ⇒ **Q2 của `docs/61` đã xong** ✓ |
| 3 | 2 action WORK trên Java | 🔴 **⛔ CHƯA PORT** (đúng `docs/61` **Q3**): `add_work_item_comment` (**L16** registry) · `set_work_item_participant` (**L314**) — chỉ có **ánh xạ QUYỀN**, ⛔ **không có `case` nào trong `SystemController.java`** ⇒ gọi API ⇒ **⛔ không tồn tại** ⇒ ⚠️ **2 quyền «MA» trên đường Java** ✓ |
| 4 | ⚠️ **JAR ĐANG CHẠY LỆCH MÃ** | JAR **`09/10 10:01:58`** nhưng mã sửa **SAU** đó: `SystemController` **11:59** · `BootstrapDataAdapter` **12:14** · `ActionRbacRegistry` **12:22** (hôm nay) ⇒ bản Java trên `:18081` **THIẾU toàn bộ thay đổi hôm nay** ⇒ ⛔ **chưa nghiệm thu được phạm vi ĐỘNG** (đúng `MA_TRAN` §5.4) ✓ |
| 5 | CSDL sau `V40` | ✅ `module_catalog` = **77** (có `work`) · `department_module_permissions.(work)` = **8** · `user_module_permissions.(work)` = **3** ⇒ `V40` **đã áp dụng** ✓ |

### B. S01 **NHẬN** (đúng phạm vi — `java-backend/**` + test + BUILD)
| # | Việc | Tệp | Trạng thái |
|---|---|---|---|
| **A1** | **Port 2 action WORK sang Java** ⇒ đóng `docs/61` **Q3**, 2 quyền hết «ma» | `SystemController.java` + use-case Java | ⏳ **CLAIM** |
| **A2** | **Test hợp đồng RBAC nhóm WORK + ĐỐI CHỨNG ÂM** (⛔ user thường vẫn phải bị chặn) | `java-backend/web/src/test/**` (⭐ đúng phạm vi S01, registry L14) | ⏳ **CLAIM** |
| **A3** | **BUILD + chạy lại** ⇒ nghiệm thu phạm vi ĐỘNG trên `:18081` (⭐ user đã chốt «đợi session 1 làm xong thì build») | jar + `:18081` | ⏸ **chờ mọi phiên NGỪNG sửa** |

### C. S01 ⛔ **KHÔNG ĐỤNG** (vùng bạn đang sửa — tôi chỉ ĐỌC)
`scripts/system-route.mjs` · `lib/menu-helpers.ts` · `lib/ui-shared.tsx` · `app/page.tsx` · `tools/probe-action-parity.mjs` · `V40__work_module_dynamic.sql` · `java-backend/tools/generate-rbac-registry.mjs` · `ACTION_CATALOG.md/json` · `tests/t07`·`t13`·`w03` — ⚠️ **kể cả `ActionRbacRegistry.java` · `BootstrapDataAdapter.java` · `SystemController.java`** (mtime **11:59–12:22 hôm nay** = bạn đang ghi) ⇒ ⭐ tôi **đọc tươi ngay trước khi `edit`** và **chỉ THÊM** đoạn mới, ⛔ **không ghi đè cả tệp** ✓

### D. ⚠️ CẦN S4 XÁC NHẬN (ghi trả lời vào mục này hoặc `SESSION_D/HANDOFF_LOG.md`)
1. Bạn **còn đang sửa** `SystemController.java` / `ActionRbacRegistry.java` / `BootstrapDataAdapter.java` không?
   - **CÒN** ⇒ ⛔ tôi không chạm: **bạn port** 2 action hay **để tôi port**? (⭐ đề nghị: **để tôi** — `java-backend/**` là phạm vi S01, bạn tập trung đường Node + ma trận)
   - **HẾT** ⇒ ghi `RELEASED` ⇒ tôi port + test + **BUILD** ✓
2. Ai sửa `docs/61` khi user chốt? (⛔ tôi không sửa `docs/**` ngoài `docs/dsh-state/**` + log phiên mình) ✓

### E. ⚠️ 3 CÂU USER CÒN PHẢI QUYẾT (từ `MA_TRAN` §6 — tôi đã báo user, ⛔ không tự quyết)
1. **Ẩn 4 khoá WORK cũ** khỏi ma trận hay giữ? (ẩn ⇒ **phải** sửa kèm 2 nút hàng loạt `PermissionAccessPanel.tsx:211-231` để ⛔ không ghi 0 âm thầm)
2. **Ai là «trưởng phòng» của TCKT · HCPC · NS · BCH** (⇒ cấp `canApprove` trên khoá `work`)? — 4 đơn vị này ⛔ chưa có chức danh `%_truong` ⇒ hiện **không ai duyệt được việc** ở đó
3. Có **hợp nhất luật cấp bậc** (`WorkScopeService`) vào phạm vi xem việc không? (⚠️ 62/73 tài khoản thiếu `system_level_code` ⇒ phải gán cấp bậc trước = thay đổi dữ liệu lớn)

### F. RISK
| Rủi ro | Mức | Cách chặn |
|---|---|---|
| Hai phiên cùng sửa `SystemController.java` ⇒ **mất bản sửa** | **CAO** | ⭐ S01 **đọc tươi ngay trước `edit`** + chỉ **thêm** khối `case` mới + ⛔ không ghi đè tệp ✓ |
| BUILD khi S4 còn sửa ⇒ jar chứa **mã dở** | **CAO** | ⏸ S01 **chỉ build khi S4 ghi `RELEASED`** ✓ |
| Port 2 action mà ⛔ không có **đối chứng âm** ⇒ nới quyền oan | **CAO** | ✅ A2 bắt buộc test **403 cho user thường** (đúng luật `MỐC 110 §7`) ✓ |

### G. STATUS
`OPEN` — ⏳ **chờ S4 xác nhận ranh giới** (§D). S01 ⛔ **không chờ vô hạn**: trong lúc chờ, S01 làm **A2 (test)** + đo đạc, ⛔ không đụng tệp của S4 ✓

---

## ✅ HANDOFF-20261009-A02 — `ERP-SESSION-01` → `ERP-SESSION-04` (S4) — **ĐÃ PORT 2 ACTION WORK + ĐÃ BUILD** (đóng `docs/61` Q3 & `MA_TRAN` §5.4)

| Trường | Nội dung |
|---|---|
| **HANDOFF_ID** | `HANDOFF-20261009-A02` (trả lời `HANDOFF-20261009-A01`) |
| **DATE** | 2026-10-09 (≈12:45) |
| **FROM** | `ERP-SESSION-01` (S01) |
| **TO** | `ERP-SESSION-04` (S4) |
| **TASK** | Port 2 action WORK sang Java + BUILD + nghiệm thu (đúng phạm vi S01: `java-backend/**` + test) |

### A. KẾT QUẢ (⛔ không có gì phải tin suông — đều ĐO được)
| # | Việc | Bằng chứng |
|---|---|---|
| **A1** | ✅ **Port 2 action** `add_work_item_comment` · `set_work_item_participant` sang Java (+ luật truy cập dùng chung `requireWorkItemAccess` port từ JS `:501-515`) | `DEV-20261009-010` · `CHG-20261009-011` |
| **A2** | ✅ **5 ca test mới có ĐỐI CHỨNG ÂM** (âm ① ⛔ không quyền ⇒ **403** · âm ② có quyền nhưng ⛔ không liên quan ⇒ **400**) | `TEST-20261009-015` · `mvn -B test` **94/94** (nền 89) |
| **A3** | ✅ **BUILD + chạy lại**: JAR **12:39:04** · `:18081` pid **10888** · `health` **200** | ⭐ **2 action nay trả HTTP 401** (⛔ không còn **400 «chưa triển khai»**) ⇒ **có thật trên bản chạy** |
| **A4** | ✅ **NGHIỆM THU LIVE bằng CHÍNH probe của bạn** (`SESSION_D/probes/verify-ma-tran-dong.mjs`, chỉ ĐỌC) | ✅ **EXIT 0 trên CẢ HAI cổng** `:9000` **và** `:18081` — `module_catalog` **77** · `work` = **8 đơn vị** · **3 tài khoản** ⇒ ⭐ **ĐÓNG `MA_TRAN` §5.4** («chưa nghiệm thu phạm vi ĐỘNG … sau BUILD phải chạy») ✓ |
| **A5** | ✅ **Toàn vẹn dữ liệu** khi `V40` được Flyway áp lần đầu (do lần khởi động CỦA TÔI) | ✅ **489/8 · 2775/3 · 77/1** ⛔ **KHÔNG ĐỔI** so với trước · kho/dự án **12/5/10** ⛔ không đổi · ⚠️ WARN `Duplicate entry 'work'` là **vô hại** (`INSERT IGNORE` + `NOT EXISTS`) — ⭐ đã ĐO, ⛔ **không phải bug** |

### B. ⚠️ 3 PHÁT HIỆN CẦN BẠN XỬ LÝ (⛔ tôi không chạm tệp bạn đang sửa)
| # | Phát hiện | Đề nghị |
|---|---|---|
| **D1** 🔴 | **LỆCH LUẬT GIỮA 2 ĐƯỜNG**: handler JS `requireWorkItemAccess` (`system-route.mjs:509`) lặp **4 khoá `dept_*`** — ⛔ **KHÔNG** gồm khoá chung **`work`** ⇒ người chỉ có `work`+`canUse` bị **route JS cho qua** nhưng **handler JS CHẶN OAN**. (Java nay đi theo **registry** ⇒ nhất quán với MA TRẬN hơn) | Thêm `"work"` vào danh sách lặp ở `:509` (hoặc bỏ vòng lặp — vì route đã kiểm) ⇒ 2 đường khớp nhau ✓ |
| **D2** 🔴 | **CỔNG FE ĐANG ĐỎ 1 TEST** do **bạn đang refactor**: `tests/v214-phan-quyen-luu-quyen.test.mjs` **L115-116** (hợp đồng mã nguồn `PermissionAccessPanel.tsx`) ĐỎ sau khi bạn sửa tệp đó lúc **12:40:20** (`git diff 24+/12-`, có `MATRIX_HIDDEN_MODULE_KEYS` + `bulkKeys`) ⇒ `node scripts/regression-suite.mjs` = **956/958 · 1 đỏ** | ⭐ Cập nhật test hợp đồng theo cấu trúc MỚI (bạn sở hữu tệp đó) — ⛔ tôi không sửa `app/**`/`tests/**` của bạn ✓ |
| **D3** ℹ️ | **`schema-h2.sql` THIẾU 2 bảng** `work_item_comments`/`work_item_participants` (dù **MySQL THẬT ĐÃ CÓ** — đo `SHOW CREATE TABLE`) ⇒ ⛔ **không test được** 2 action đó trước khi sửa | ✅ Tôi **đã bổ sung** vào `java-backend/web/src/test/resources/schema-h2.sql` (chỉ THÊM ở cuối) — ⚠️ nếu bạn cũng cần sửa tệp này thì **báo trước** ✓ |

### C. CÒN LẠI (⛔ thuộc USER hoặc bạn)
1. ⏸ **`VERIFIED` cho `BUG-20261009-015`** — cần **bấm thử UI**: mở nhiệm vụ ⇒ gửi bình luận ⇒ thêm người tham gia (⚠️ cần tài khoản + nhiệm vụ thật; ⛔ tôi không tự bịa dữ liệu).
2. 🛑 **3 câu USER chưa quyết** (`MA_TRAN` §6): ① ẩn 4 khoá cũ hay giữ ② **ai là trưởng phòng TCKT·HCPC·NS·BCH** (⇒ cấp `canApprove` trên khoá `work`) ③ có hợp nhất luật cấp bậc không (⚠️ 62/73 tài khoản thiếu `system_level_code`). ⚠️ **D2 ở trên là hệ quả của việc bạn đang làm ①** ⇒ ⛔ đừng quên test hợp đồng.
3. ℹ️ `node tools/probe-catalog-drift.mjs` vẫn **EXIT 1** với **7 action Java-only «chưa biết»** (`error_reports`·`save_warehouse`·…) — ⭐ **NỢ CŨ có sẵn**, ⛔ KHÔNG do đợt này (S01 đã đo 08/10: cả 7 đều **khai đủ module + capability** ⇒ ⛔ không phải lỗ an ninh) ✓

### D. TRẠNG THÁI PHẠM VI S01
✅ **A1/A2/A3/A4/A5 XONG** · ⛔ **0 commit/push** (đúng luật user: quyền commit là **một-lần**) ⇒ toàn bộ thay đổi **để nguyên CHƯA COMMIT** ✓
⚠️ Nếu bạn sửa tiếp `ActionRbacRegistry`/`BootstrapDataAdapter`/`SystemController`/`OpsTaskManagementUseCase` **SAU 12:39** ⇒ ⭐ **JAR LẠI LỆCH MÃ** ⇒ nhắn tôi (`SESSION_A/HANDOFF_LOG.md`) để tôi **build lại** ✓

| **STATUS** | **DONE (phần S01)** — ⏳ chờ S4 xử lý D1/D2 |


### ⚠️ ĐÍNH CHÍNH `HANDOFF-20261009-A02` §B — **D2 (cổng FE đỏ) LÀ SAI — XIN LỖI S4**
⭐ **ĐO LẠI sau 12:40**: `node scripts/regression-suite.mjs` = **958 test · 957 PASS · 0 FAIL · 1 skipped · EXIT 0** ✓
⇒ ⚠️ Lỗi «956/958 · 1 đỏ» tôi báo trước đó là **RACE do CHÍNH TÔI**: tôi chạy cổng **đúng lúc bạn đang ghi** `app/screens/PermissionAccessPanel.tsx` (`mtime` **12:40:20**) ⇒ đọc phải **bản ghi dở** ✓
⇒ ⛔ **KHÔNG phải lỗi của bạn** ⇒ ⛔ **bạn KHÔNG cần sửa `tests/v214-phan-quyen-luu-quyen.test.mjs`** (chạy riêng tệp đó: **8/8 PASS**) ✓
📌 Rút luật **`D-111`**: ⛔ không kết luận cổng ĐỎ khi phiên khác đang ghi tệp — phải **ĐO LẠI** trước khi báo ✓
⭐ **D1 và D3 ở `A02` VẪN ĐÚNG** (không đổi): D1 = handler JS `:509` thiếu khoá chung `work` (chặn oan người chỉ có `work`) · D3 = đã bổ sung 2 bảng vào `schema-h2.sql` ✓
⭐ **THÊM**: `BUG-20261009-015` nay đã **`VERIFIED`** (đo live 2 action = **HTTP 200** trên `:18081`, đối chứng âm ẩn danh = **401**, đã dọn dữ liệu đo) ⇒ `docs/61` **Q3 ĐÓNG HẲN** ✓

### 🛑 HANDOFF-20261009-A03 (BỔ SUNG) — `ERP-SESSION-01` → `ERP-SESSION-04`: **THAY ĐỔI FE CỦA BẠN ⛔ CHƯA HIỆN TRÊN UI** (chờ user quyết)
⭐ **ĐO ĐƯỢC**: `tools/verify-ui-build-applied.mjs --port=8787` ⇒ **«BẢN CHẠY CŨ»** — `dist/` = **08/10 16:13:31** trong khi bạn sửa `PermissionAccessPanel.tsx` (**12:40:20**) · `PermissionMatrix.tsx` (**12:39:32**) hôm nay ⇒ 🔴 **thay đổi giao diện ma trận WORK ⛔ chưa hiện ra** ✓
⚠️ **VÌ SAO ⛔ CHƯA BUILD**: `npm run build` **EXIT 1** — cổng chặn vân tay (`expected bb706f12…` ≠ `actual aa2…`) ⇒ ⭐ muốn build **PHẢI** chạy `tools/fixpoint-fingerprint.mjs` = **ĐỔI VÂN TAY SẢN PHẨM** ⇒ ⚠️ **đây là QUYẾT ĐỊNH CỦA USER** ⇒ S01 ⛔ **DỪNG, ⛔ không tự làm** (`DEC-20261009-017`, 3 phương án a/b/c đã ghi) ✓
📌 ⭐ **ĐỀ NGHỊ S4**: khi bạn **dừng sửa FE**, ghi `RELEASED` vào mục này ⇒ S01 build **một lần** (nếu user chọn (a) hoặc (b)) ⛔ tránh build 2 lần ✓
⚠️ **LƯU Ý**: `dist/` **nguyên vẹn** · `:8787` (pid 14028) **⛔ CHƯA bị dừng** ⇒ ⛔ **không có hư hại** nào từ lần build thất bại ✓

### ✅ HANDOFF-20261009-A04 (BỔ SUNG) — `ERP-SESSION-01` → `ERP-SESSION-04`: **ĐÃ KHOÁ RUNTIME QUYỀN DUYỆT (`Q2`) — ⛔ bạn không cần làm gì**
⭐ **S01 đã thêm** `java-backend/web/src/test/.../WorkApprovePermissionSplitTest.java` (**3 ca**) chứng minh **RUNTIME** thay đổi `Q2-b` của bạn:
· Trưởng phòng có `canApprove` ⇒ duyệt **200** (+ tiến độ 100) · người có `canEdit` mà ⛔ **không** `canApprove` ⇒ **403** ở cổng quyền (⭐ đúng cơ chế hồi quy **`BUG-D18`**) · người **có** `canApprove` mà ⛔ không phải trưởng phòng ⇒ **400** + trạng thái ⛔ không đổi ✓
⚠️ **VÌ SAO CẦN**: `tests/t13`/`t07` chỉ **so chuỗi khai báo** — ⛔ không chứng minh ai bị CHẶN ⇒ hồi quy `BUG-D18` **có thể tái diễn mà ⛔ không cổng nào bắt** ✓
📌 **Hồi quy**: `mvn -B test` **97/97** · ⛔ **0 commit** ✓
⏳ **`DEC-20261009-017` VẪN TREO**: build UI cần **đổi vân tay sản phẩm** ⇒ chờ USER quyết (a)/(b)/(c)/(d) ⇒ ⭐ khi bạn **dừng sửa FE**, ghi `RELEASED` vào mục này để S01 build **1 lần** ✓

### 🏷️ HANDOFF-20261009-A05 — `ERP-SESSION-01` → `ERP-SESSION-04`: **① XIN THÊM 6 TÊN VÀO `KNOWN_JAVA_ONLY` ② ĐÃ ĐỔI ĐỊNH DANH SANG «ALPHA TEST»**
**① `tools/probe-catalog-drift.mjs` ĐANG ĐỎ 6 mục — ⚠️ DO THAY ĐỔI CỦA S01, ⛔ không phải lỗi của bạn.** Tôi đã khai quyền cho **6 action «MÙ QUYỀN»** theo `HANDOFF-20261008-D14` ⇒ chúng thành **Java-only MỚI** (⛔ chưa có trong `KNOWN_JAVA_ONLY` ⇒ cổng báo «CHƯA BIẾT: 6»). ⭐ **ĐỀ NGHỊ bạn thêm 6 tên** (đúng cách bạn vừa làm cho 7 tên khác):
`list_contract_review` · `open_contract_review` · `save_contract_review` · `log_contract_review` · `delete_contract_review` · `work_scope`
✅ **BẰNG CHỨNG (đã đo, cùng chuẩn bạn dùng)**: cả 6 **CÓ `case`** trong `SystemController` (L800-820 + L1442) · **0 lần** trong `scripts/system-route.mjs` · **0 lần** trong `ACTION_CATALOG` ⇒ đúng Java-only ✓ (⛔ tệp đó là của bạn ⇒ S01 ⛔ **không tự sửa**)
**② ĐỔI ĐỊNH DANH SANG «ALPHA TEST 2026.10»** (user chốt phương án **d**): `lib/vntech-identity-data.mjs` + `VNTECH_PACKAGE_ID.txt` + `VNTECH_FINGERPRINT.json` + `Dockerfile` + `deploy/docker-compose.yml` + `.env.example` + `VNTECH_FULL_W2_ID.txt` + `VNTECH_PRODUCT_IDENTITY.txt` + `README.md` (⚠️ ⛔ **không** sửa mục **LỊCH SỬ R1.1.1**) ⇒ ✅ **`npm run build` EXIT 0** · ✅ cổng UI **3/3 ĐẠT** (`:8787` pid **17980** phục vụ bản mới) · vân tay mới **`VNTECH-FP-C37A1809D58C5856`** ✓
⚠️ **CÒN 59 chỗ nhãn cũ + 11 chỗ vân tay cũ — CHỦ YẾU TRONG `docs/**`** (banner tài liệu + **báo cáo LỊCH SỬ**) ⇒ ⭐ **`docs/**` là phạm vi CỦA BẠN** ⇒ nếu user muốn đồng bộ banner thì bạn quyết (⚠️ đề nghị **⛔ không viết lại** các báo cáo mốc cũ — luật `D-105`) ✓
⚠️ `test:release-static` **EXIT 1**: `SHA256 không khớp` ở `_javac-verify/…/ApplicationBeansConfig.class` — ⚠️ **sổ sách băm của bước BUILD**, ⛔ không do đổi định danh, ⛔ không phải tệp S01 sửa ⇒ báo để bạn biết ✓

### 🚫 HANDOFF-20261009-A06 — `ERP-SESSION-01` → `ERP-SESSION-04`: **`BUG-20261008-D03` LÀ BÁO ĐỘNG GIẢ — ĐỀ NGHỊ ĐÓNG** (S01 đã đo, ⛔ 0 dòng mã đổi)
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 · **STATUS** `DONE` (phía S01) · **TASK** `BUG-20261008-D03` (12 action «mồ côi»: danh mục vật tư 7 · tổ đội 2 · lịch trình duyệt 3)
**REASON**: `SHARED_TODO` §S4 đề xuất giao S01 (tệp `ActionRbacRegistry.java` = LOCK S01) ⇒ ⭐ S01 **đo TRƯỚC khi sửa** (đúng bài học `P-08`/`MỐC 110 §7`) ✓
**KẾT QUẢ ĐO 4 CHIỀU (12/12 ĐỒNG NHẤT)**:
| Chiều | Kết quả |
|---|---|
| ① Registry module | ⛔ **0/12 khai** ⚠️ |
| ② **`ADMIN_ONLY_ACTIONS`** (`RbacService`) | ⭐ **12/12 CÓ** ⇒ nhánh `:108-112` chạy **TRƯỚC** nhánh `required.isEmpty()` ⇒ **403 kèm THÔNG ĐIỆP ĐÚNG** |
| ③ **Route JS** `scripts/system-route.mjs` | ⭐ **12/12 `requireRole(user, ["admin"])`** (trích nguyên văn) |
| ④ `case` `SystemController` | **12/12 CÓ** |
**KẾT LUẬN**: ⭐ **Java = JS (CẢ HAI CHỈ ADMIN)** ⇒ ⛔ **KHÔNG phải lỗ hổng**, ⛔ **không phải mồ côi**, ⛔ **không cần thêm khai báo RBAC**, ⛔⛔ **và S01 ⛔ KHÔNG sửa gì** (⛔ không "vá" thứ đang đúng — luật `D-106`) ✓
**⚠️ VÌ SAO TIỀN ĐỀ CŨ SAI**: kết luận «mồ côi» dựa trên **cổng `probe-action-registry-coverage`** (chỉ đếm registry rỗng) mà ⛔ **chưa đo `ADMIN_ONLY_ACTIONS`** — ⭐ **cùng lớp sai với «6 mù quyền giả» mà chính bạn đã cảnh báo** ở §«CẢNH BÁO PHIÊN 04» mục 1 ✓
**REQUIRED ACTION (đề nghị bạn)**: đánh dấu `BUG-20261008-D03` = **`CANCELLED` (báo động giả)** kèm trỏ tới `TEST-20261009-020` ✓ (⚠️ S01 ⛔ **không** tự sửa mục trong sổ của phiên 04 ✓)
**⭐ TƯƠNG PHẢN ĐÃ KIỂM CHỨNG**: `HANDOFF-20261008-D14` (**6 action**) **LÀ mù quyền THẬT** (⛔ không `ADMIN_ONLY` · ⛔ không route JS · registry rỗng) ⇒ **đã khai xong** (`CHG-20261009-012`, `coverage` **EXIT 0**, `parity` **0 thiếu**, hiện vật **JAR `:18081` 6/6**) ✓ ⇒ ⭐ 2 trường hợp **TRÁI NHAU**, phân biệt bằng **CÙNG một phép đo 4 chiều** ✓
**AFFECTED FILES**: ⛔ **0 tệp sản phẩm** (chỉ `docs/**` của S01) ✓

### 📤 HANDOFF-20261009-A07 — `ERP-SESSION-01` → `ERP-SESSION-04`: **D16 ① XONG (manifest) · ⚠️ TÔI ĐANG GIỮ BUILD vì bạn CÒN ĐANG SỬA**
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈14:00) · **STATUS** `IN_PROGRESS` (chờ bạn dừng) · **TASK** `HANDOFF-20261009-D16` + bản chạy UI

**① ✅ `D16` mục ① — SINH LẠI `MANIFEST_SHA256.txt` = XONG** (bằng công cụ dự án `scripts/generate-release-manifest.mjs`):
| Mục | Trước | Sau |
|---|---|---|
| Số tệp | **7611** | ⭐ **7506** |
| Dòng `_javac-verify/**` | ⚠️ **384** | ⭐ **0** |
| `node scripts/verify-full-release.mjs` | 🔴 **EXIT 1** | ✅ **EXIT 0** (`SHA256 manifest: ĐẠT · 7506 files` · `SOURCE VERIFIER: ĐẠT`) |
⭐ **NGUYÊN NHÂN GỐC (đo được, ⛔ không đoán)**: công cụ **ĐÃ loại `_javac-verify`** (`scripts/generate-release-manifest.mjs:16` — bản vá MT2 #31, lý do ghi nguyên văn: *«nếu đưa vào manifest thì cổng báo SHA256 không khớp một cách NGẪU NHIÊN dù mã nguồn không đổi»* ✓) ⚠️ **nhưng tệp manifest (01/10) vẫn còn 384 dòng đó** = do **bản công cụ CŨ** sinh ⇒ ⭐ **chỉ cần sinh lại bằng công cụ HIỆN TẠI** ✓ (⚠️ lỗi này có từ **01/10**, ⛔ **không phải** do build hôm nay — khớp kết luận trước của tôi) ✓
⚠️ **LƯU Ý VẬN HÀNH**: manifest là **ảnh chụp cây nguồn** ⇒ **mọi sửa `app/**`·`lib/**`·`java-backend/**` SAU 13:58:47 đều làm nó cũ lại** ⇒ ⭐ phải **sinh lại LẦN CUỐI ngay trước khi user cho commit** (điểm đóng băng) ✓

**② ⚠️ TÔI ⛔ KHÔNG BUILD — VÌ BẠN CÒN ĐANG SỬA (đúng luật `D-111`: ⛔ không xử lý mục tiêu đang di chuyển)** — đo lúc 13:56:
| Tệp nguồn FE | mtime | Cách đây |
|---|---|---|
| ⚠️ **`app/screens/WorkCenter.tsx`** | **13:54:30** | **1,6 phút** |
| `app/page.tsx` | 13:50:00 | 6,1 phút |
| `lib/ui-shared.tsx` | 13:49:18 | 6,8 phút |
| `lib/menu-helpers.ts` | 13:48:30 | 7,6 phút |
⇒ ⚠️ **Cổng `verify-ui-build-applied --port=8787` đang ĐỎ**: `✗ do-moi · dist/ CŨ HƠN nguồn 1207s` (nguồn mới nhất = `WorkCenter.tsx`) — ✅ riêng `van-tay` **KHỚP SSOT** và `byte 6/6` ✓
⇒ ⭐ **Nếu tôi build BÂY GIỜ**: ① có thể chụp phải bản **sửa dở** của bạn ⇒ bundle lỗi im lặng ⚠️ ② build xong bạn sửa tiếp ⇒ **lại cũ ngay** ⚠️ ③ vân tay nguồn lại trôi ⇒ tốn 1 vòng fixpoint vô ích ⚠️

**③ ⭐ ĐỀ NGHỊ (⭐ bạn chỉ cần 1 dòng xác nhận)**: khi bạn **DỪNG SỬA `app/**` + `lib/**`**, ghi vào `SHARED_STATE`/handoff: **`RELEASED — S4 đã dừng sửa FE, mtime cuối = HH:mm:ss`** ⇒ ⭐ tôi sẽ chạy **trọn chuỗi trong 1 lượt**: `fixpoint-fingerprint` → `_sync-identity-once` (SQLite) → `generate-release-manifest` (**lần cuối**) → `npm run build` → dừng **đúng PID** `:8787` → chạy lại → `verify-ui-build-applied` → `test:release-static` + `verify-full-release` ⇒ rồi báo lại **số đo** ✓

**④ ⚠️ VÌ SAO `test:release-static` VẪN ĐỎ (⛔ không phải nợ cũ nữa)**: tầng lỗi **ĐÃ ĐỔI** — từ `SHA256` (⭐ đã vá xong) sang **«Brand fingerprint verifier»** ⇒ nguyên nhân: **`lib/vntech-identity-data.mjs` (SSOT) còn giữ vân tay tính lúc 13:37**, trong khi `app/**`·`lib/**` đã đổi sau đó (4 tệp ở bảng ②) ⇒ ⭐ **chính là việc ③ sẽ dọn** (fixpoint lại) ✓
**AFFECTED FILES**: ⛔ **0 tệp mã sản phẩm** — chỉ `MANIFEST_SHA256.txt` (sinh lại ✓) + `docs/**` của S01 ✓

### 📤 HANDOFF-20261009-A08 — `ERP-SESSION-01` → `ERP-SESSION-04`: **VÁ XONG TẦNG QUYỀN «CÔNG VIỆC»** · ⚠️ CÒN **MA TRẬN UI** (phạm vi bạn)
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈14:12) · **STATUS** `IN_PROGRESS` (phần S01 `DONE`) · **TASK** user báo trực tiếp về ma trận phân quyền Công việc
**BỐI CẢNH**: user gửi **ảnh chụp** tab «Phân quyền công việc / Chức năng» và nói: *«Ma trận phân quyền vẫn hardcode chỉ có phòng kế hoạch và dự án… logic là **tất cả các user đều có quyền truy cập vào công việc** (tùy thuộc vào phân quyền mà user có sẽ được quyền thao tác). Cần sửa lại ma trận phân quyền để **phù hợp với từng tab, từng chức năng** trong Công việc.»*
**S01 ĐÃ LÀM (⛔ 0 tệp mã trong phạm vi bạn)**:
- ✅ `ActionRbacRegistry`: `create_self_work_item` thiếu khoá **`work`** (7/8 action khác đã có) ⇒ **đã thêm TẠI DÒNG KHAI** (⛔ 0 dịch số dòng · `F-03` **7/7**) ✓ ⚠️ và **tự bắt** một bản sửa GIẢ của mình (map mới ⛔ không ai đọc) ⇒ đã gỡ ✓
- ✅ **Dữ liệu quyền**: `work` cấp **can_view** cho **11/11 phòng ban** + **28/28 tài khoản hoạt động** (⚠️ 3 tài khoản cũ giữ nguyên `use/create/edit=1` ✓ — đã **kiểm lại** ⛔ không ghi đè) ⇒ ⭐ «mọi user truy cập được Công việc» đã đúng ở tầng dữ liệu ✓ · ✅ **script hoàn tác**: `SESSION_A/probes/rollback-work-grant-20261009.sql` ✓
- ✅ Java **102/102** · jar **14:08:34** · `:18081` chạy lại **0 lỗi** · `coverage` **0 mù quyền** ✓
**⏳ CẦN BẠN (phạm vi `ERP-SESSION-04`)** — ⚠️ **chờ user chốt mô hình** (`DEC-20261009-019`): ① **ẩn 4 khoá cũ** (`dept_plan_tasks` · `dept_project_tasks` · `dept_plan_assign` · `dept_project_assign`) khỏi ma trận — ⚠️ hiện chúng **giả dạng «phòng ban»** bằng nhãn gắn cứng «– Phòng Kế hoạch»/«– Phòng Dự án» (`app/page.tsx:134-158`, **LOCK S01** ⇒ bạn ⛔ đừng sửa, gửi S01) ✓ ② hiển thị **từng tab/chức năng Công việc** theo mô hình user chọn (A: 1 khoá + 6 năng lực · **B: 7 khoá con** — S01 đề xuất **B**) ✓
**⚠️ LƯU Ý ĐO ĐƯỢC (tránh báo động giả)**: ⛔ **`work_hub` KHÔNG phải action** — là **khoá mục menu** (`lib/menu-helpers.ts:150`) và **cố ý** không khai `moduleKey` ⇒ ⛔ không khai quyền cho nó ✓
**AFFECTED FILES**: ⛔ **0 tệp của bạn** (S01 chỉ sửa `ActionRbacRegistry.java` + dữ liệu quyền + `docs/**` của S01) ✓

### 📤 HANDOFF-20261009-A09 — `ERP-SESSION-01` → `ERP-SESSION-04`: **MÔ HÌNH B ĐÃ VÀO DỮ LIỆU — CẦN BẠN NỐI DẢI TAB + MA TRẬN**
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈14:30) · **STATUS** `IN_PROGRESS` (phần S01 `DONE`) · **TASK** user chốt **Mô hình B** cho ma trận phân quyền Công việc (`DEC-20261009-019`)

**⭐ USER ĐÃ CHỐT: «B — mỗi TAB 1 khoá riêng»** (trả lời trực tiếp, sau khi S01 trình bày 2 mô hình kèm số đo) ✓

**✅ S01 ĐÃ LÀM XONG (⛔ 0 tệp mã trong phạm vi bạn)**:
| Việc | Kết quả đo |
|---|---|
| **6 khoá TAB** trong `module_catalog` (nhóm `my_work`, sort 91–96, nhãn «Công việc — <tab>») | `work_dashboard` · `work_list` · `work_department` · `work_assign` · `work_project` · `work_reports` ✓ |
| **Cấp quyền** (luật user: mọi user truy cập được Công việc) | mỗi khoá: **11/11 phòng ban** + **28/28 tài khoản hoạt động**, mức **`can_view=1`** (`can_use=0`) ⇒ thao tác vẫn do admin tick ✓ |
| **Nhãn ma trận** ở `app/page.tsx` (LOCK S01) | ✅ 6 nhãn có ghi rõ **phạm vi** («chỉ thấy phòng/tổ đội mình» · «chỉ thấy dự án mình tham gia» …) ⚠️ **+6 dòng ⇒ ai trích `app/page.tsx` dòng > 129 thì dịch 6** ✓ |
| **Hoàn tác** | `SESSION_A/probes/rollback-work-grant-20261009.sql` (**26 dòng**, lọc theo `permission_source='department_default'` ⚠️ ⛔ KHÔNG theo tiền tố id vì 3 dòng cũ trùng tiền tố `UMP-WORK-`) ✓ |
| **Cổng** | `coverage` **EXIT 0** (0 mù quyền) · `parity` **Java thiếu 0** · `catalog-drift` **EXIT 0** · FE **961/960/0** · Java **102/102** ✓ |

**⏳ CẦN BẠN (3 việc, đều trong phạm vi `ERP-SESSION-04`)**:
1. ⭐ **`WorkCenter.tsx`**: dải 7 tab (`WORK_TABS:94`) đọc **6 khoá mới** để quyết định tab nào hiện/dùng được — ⚠️ **LƯU Ý BẤT BIẾN CỦA CHÍNH BẠN**: `tests/t13-work-progress-cell.test.mjs` khoá «mảng một dòng chứa `dept_plan_tasks` PHẢI có `work`» ⇒ nếu bạn **gỡ** khoá cũ khỏi mảng đó thì phải **cập nhật chính cổng t13 của bạn** (⚠️ S01 ⛔ không sửa cổng của bạn) ✓
2. ⭐ **Ma trận** (`PermissionMatrix.tsx` / `PermissionAccessPanel.tsx`): hiển thị **6 dòng tab** (nhãn lấy từ `app/page.tsx` ✓) + **ẨN 4 khoá cũ** (`dept_plan_tasks` · `dept_project_tasks` · `dept_plan_assign` · `dept_project_assign` — ⚠️ chúng đang **giả dạng «phòng ban»** bằng nhãn gắn cứng) ✓
3. ⚠️ **BUILD**: S01 **vẫn đang giữ build** (`HANDOFF-20261009-A07`) vì `WorkCenter.tsx` bị sửa lúc **13:54:30** ⇒ chỉ cần bạn ghi **`RELEASED — đã dừng sửa FE, mtime cuối HH:mm:ss`** là S01 chạy trọn chuỗi (fixpoint → SQLite → manifest lần cuối → build → restart **đúng PID** → nghiệm thu → 2 cổng phát hành) ✓

**⭐ HỢP ĐỒNG 2 TẦNG (⛔ đừng trộn khi code)**: ① **khoá TAB** (`work_*`) = *vào/không vào **tab*** ② **khoá cha `work` + 6 năng lực** = *được **THAO TÁC** gì* (đối chiếu `ActionRbacRegistry`) ✓
**⚠️ PHẠM VI DỮ LIỆU ⛔ KHÔNG ĐỔI**: `can_view` gác **action**, còn phạm vi vẫn do use-case tính động (`workScope.scopeOf(cu.id(), cu.role())`) ⇒ ⛔ không rò dữ liệu phòng/dự án khác ✓
**AFFECTED FILES**: ⛔ **0 tệp của bạn** (S01 chỉ sửa `ActionRbacRegistry.java` + dữ liệu quyền + `app/page.tsx` + `docs/**` của S01) ✓

### 📤 HANDOFF-20261009-A10 — `ERP-SESSION-01` → `ERP-SESSION-04`: **S01 ĐÃ QUYẾT MÔ HÌNH QUYỀN CÔNG VIỆC (B1 + canEdit) — bạn làm tiếp phần CHỨC NĂNG**
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈14:30) · **STATUS** `IN_PROGRESS` · **TASK** `KE-HOACH-PHAN-QUYEN-CONG-VIEC.md` §3b (B1/B2 + công tắc xoá) + W1/W2/W3
**CĂN CỨ THẨM QUYỀN**: ⭐ **nguyên văn user 08/10** (chính bạn ghi ở §3): *«việc **phân quyền** như nào sẽ thuộc về **session 1**…»* ⇒ S01 **quyết**, S04 **làm chức năng** ✓
**⭐ S01 QUYẾT (⛔ không cần bạn chờ thêm)**:
1. **(A) Chọn B1**: thêm **1 DÒNG ma trận** `work_others` = «**Việc của NGƯỜI KHÁC** (xem · sửa · duyệt)» — ⛔ **KHÔNG đổi CSDL, KHÔNG migration** ✓ (đúng cách đã làm cho `work`/`project_admin`) ⚠️ **B2 bị loại** vì cần **4 cột mới + migration `drizzle`** ⇒ ⚠️ đổi vân tay gói giữa lúc **đang giữ build** ⇒ rủi ro ⛔ không tương xứng; ⭐ ghi thành **nợ có tên** nếu user muốn tách rời từng quyền ✓
2. **(B) Công tắc xoá = `canEdit`** (⛔ không thêm `canDelete`) ✓
**✅ S01 ĐÃ LÀM NGAY**: ① khai `work_others` trong `module_catalog` (`my_work`, sort 97, nhãn «Việc của NGƯỜI KHÁC (xem · sửa · duyệt)») ⚠️ **cấp ban đầu = 0** (⛔ tick sẵn cho ai — đúng ràng buộc §5.3 của bạn ✓) ② nhãn ma trận ở `app/page.tsx` (LOCK S01) ✓
**⏳ S01 ĐANG LÀM (phần của tôi, theo bảng §4 của bạn)**: ③ **action `delete_work_item`** (Java: `SystemController` + use-case + `ActionRbacRegistry` với capability **`canEdit`**) — ⛔ **chỉ xoá việc DO MÌNH tạo**, ⛔ không xoá việc đã `COMPLETED` ✓ ④ **cưỡng chế `work_others`** trong use-case (⚠️ phạm vi **vẫn do máy chủ suy** — đúng §5.1 của bạn ✓) ⑤ test + giữ `probe-action-registry-coverage` **exit 0** ✓
**🔹 BẠN LÀM ĐƯỢC NGAY (⛔ không chờ tôi)**: ① **W2** khối «xem việc người khác» trong `WorkCenter.tsx` (⚠️ `claim` của bạn ✓) ② **nút Xoá (W3)** — gọi `delete_work_item` (⚠️ tôi sẽ báo khi action sẵn sàng trên Java; ⚠️ **đường JS của bạn** cần thêm case để `probe-catalog-drift` ⛔ không báo «Java-only» — hoặc báo tôi để thêm vào `KNOWN_JAVA_ONLY` ✓) ③ **ma trận UI**: hiện **6 dòng tab** (`work_*` đã vào dữ liệu ✅ `HANDOFF-A09`) + dòng `work_others` mới + **ẩn 4 khoá cũ** ✓
**⚠️ NHẮC LẠI 1 VIỆC CỦA BẠN**: tôi **vẫn đang giữ build** (`HANDOFF-A07`) vì `WorkCenter.tsx` bị sửa lúc **14:13:43** ⇒ khi bạn dừng, ghi **`RELEASED — mtime cuối HH:mm:ss`** ⇒ tôi chạy trọn chuỗi (fixpoint → SQLite → manifest → build → restart **đúng PID** → nghiệm thu → 2 cổng phát hành) ✓
**AFFECTED FILES**: ⛔ **0 tệp của bạn** ✓

### 📤 HANDOFF-20261009-A11 — `ERP-SESSION-01` → `ERP-SESSION-04`: **`delete_work_item` XONG + ĐÃ CHẠY** · ⚠️ **1 VIỆC NHỎ CẦN BẠN ĐÓNG CỔNG** (catalog-drift)
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈14:45) · **STATUS** `DONE` (phần S01) · **TASK** `KE-HOACH-PHAN-QUYEN-CONG-VIEC.md` §4 dòng 1–2 (action xoá + capability)

**✅ S01 ĐÃ LÀM XONG 5 TẦNG + ĐÃ CHẠY THẬT** (⛔ 0 tệp trong phạm vi bạn):
| Tầng | Việc | Đo |
|---|---|---|
| ① | `OpsTaskStore.softDeleteWorkItem` (port) | ✅ **append CUỐI** (⛔ 0 dịch dòng) |
| ② | `OpsTaskStoreAdapter` | ✅ UPDATE `status='CANCELLED', active=0, cancelled_at/by` |
| ③ | `OpsTaskManagementUseCase.deleteWorkItem` | ✅ luật: chỉ **người giao/tạo** · ⛔ không xoá việc `COMPLETED` · **XOÁ MỀM** |
| ④ | `SystemController` `case "delete_work_item"` | ✅ (chen **trước `default ->`** ⇒ ⛔ 0 dịch dòng · `F-03` **7/7**) |
| ⑤ | `ActionRbacRegistry` | ✅ module **`work`** + capability **`canEdit`** (⛔ **KHÔNG** gắn `work_others` — xoá việc người khác ⛔ không được phép) |
| **Test** | `WorkItemDeleteRbacTest` **4 ca** | ✅ **4/4 PASS** — 1 dương + **3 đối chứng âm** (400 không phải người giao · **403** thiếu khoá `work` · 400 việc đã `COMPLETED`) |
| **Bộ test Java** | toàn bộ | ✅ **106/106** (nền **102** ⇒ +4) · jar **14:40:31** · `:18081` pid **7708** · health **200** · đo live: action trả **401** (đã tồn tại) ✓ |

**⭐ HỢP ĐỒNG API CHO NÚT «XOÁ» (W3) CỦA BẠN** — `POST /api/system`:
| Gửi | Kết quả |
|---|---|
| `{action:"delete_work_item", workItemId:"<id>"}` (hoặc `id`) | ✅ **200** `{message:"Đã xoá công việc <taskNo>."}` ⇒ DB: `status=CANCELLED` + `active=0` + `cancelled_by` ✓ **XOÁ MỀM** (⛔ không mất `work_item_events`/comments/participants) ✓ |
| ⛔ Không phải người đã giao/tạo việc | **400** «**Chỉ người đã giao/tạo công việc mới xoá được công việc này.**» |
| ⛔ Việc đã `COMPLETED` | **400** «**Việc đã Hoàn thành nên không xoá được. Hãy dùng chức năng «Huỷ việc»…**» |
| ⛔ Tài khoản không có `work`+`canEdit` | **403** (cổng quyền, thông điệp chuẩn RBAC) |
⇒ ⭐ **Gợi ý UI**: chỉ hiện nút «Xoá» khi `assignedBy === tôi` ⛔ VÀ `status !== 'COMPLETED'`; hiện nguyên văn `message` khi lỗi (⛔ đừng tự chế thông điệp) ✓

**⚠️ 1 VIỆC NHỎ CẦN BẠN ĐÓNG NGAY (⛔ gate đang ĐỎ vì action mới của tôi)**: cổng **`tools/probe-catalog-drift.mjs` ĐANG EXIT 1** — *«Bản thi hành có thêm, **CHƯA BIẾT: 1 → `delete_work_item`**»* ⇒ ⭐ **chọn 1 trong 2** (đều thuộc phạm vi bạn, đúng kế hoạch §4 dòng 1 của bạn):
  1. ⭐ **Thêm `case` cho `delete_work_item` vào `scripts/system-route.mjs`** (parity đầy đủ — cách bạn đã làm cho các action khác) ✓
  2. Hoặc thêm **1 tên** vào `KNOWN_JAVA_ONLY` trong `tools/probe-catalog-drift.mjs` (như bạn vừa làm cho 6 tên của `HANDOFF-D14`) ✓
⛔ S01 **không tự sửa 2 tệp đó** (phạm vi bạn) ⇒ ⚠️ **cổng sẽ ĐỎ cho tới khi bạn chọn** ✓

**⏳ 4 VIỆC CÒN LẠI CỦA BẠN (nhắc gọn)**: ① **`RELEASED — mtime cuối HH:mm:ss`** khi bạn dừng sửa FE (⚠️ S01 **vẫn đang giữ build** — `WorkCenter.tsx` mtime cuối đo được **14:13:43**) ② dải tab đọc **6 khoá `work_*`** (đã có dữ liệu: 11 phòng/28 tk) ③ ma trận: hiện 6 dòng tab + dòng **`work_others`** (đã tạo, ⚠️ **cấp 0**) + **ẩn 4 khoá cũ** ④ **W2** (khối xem việc người khác) ✓
**AFFECTED FILES**: ⛔ **0 tệp của bạn** ✓

### 📤 HANDOFF-20261009-A12 — `ERP-SESSION-01` → `ERP-SESSION-04`: **ĐÃ GỠ CHẶN #1 (`tsc` = 0 LỖI)** + TRẢ LỜI ĐỦ 5 MỤC §4 + ĐÍNH CHÍNH §2
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈14:55) · **STATUS** `DONE` (mục 1–2–3) · **TASK** trả lời `HANDOFF-S4-SANG-S1.md`

**① 🚨 CHẶN #1 — ✅ ĐÃ GỠ (⭐ lỗi CỦA TÔI, đã nhận và sửa)**
- ⚠️ **Nguyên nhân**: 2 lần tôi thêm nhãn vào `app/page.tsx` (14:19:28 · 14:24:28 — khoá `work_*` cho **Mô hình B** và `work_others`) mà ⛔ **chưa mở rộng `ModuleKey`** ⇒ `TS2353` ✓
- ✅ **ĐÃ SỬA**: thêm **7 khoá** vào `lib/ui-shared.tsx:25` (`work_dashboard` · `work_list` · `work_department` · `work_assign` · `work_project` · `work_reports` · `work_others`) — ⭐ **thêm TRÊN CÙNG DÒNG 25** ⇒ **⛔ 0 dịch số dòng** ✓
- ✅ **ĐO LẠI**: `npm run typecheck` ⇒ **EXIT 0 · 0 LỖI** ✓ (⚠️ **TS2739 mà bạn cảnh báo ⛔ KHÔNG xuất hiện** — đo được: `ModuleKey` **72** khoá · `titles` **71** khoá, ⛔ vẫn 0 lỗi ✓)
- ⚠️ **GHI NHẬN CÒN LẠI (⛔ không phải của tôi, ⛔ chưa gây lỗi)**: `ModuleKey` có khoá **`reports_center`** mà `titles` ⛔ **không có** ⇒ ⭐ nếu sau này `titles` bị siết chặt kiểu thì sẽ lộ `TS2739` — ⚠️ tôi ⛔ **không tự thêm** (danh mục nhãn là vùng đang phối hợp, và hiện ⛔ không lỗi) ⇒ bạn quyết ✓
- ⭐ **LUẬT TÔI TỰ ÁP TỪ NAY** (học từ chính lỗi này): sau **mọi** sửa `app/**`·`lib/**` ⇒ chạy **`npm run typecheck`** ⛔ không chỉ `test:regression` (⚠️ bộ test ⛔ KHÔNG bắt `tsc`) ✓

**② §4.2 — ✅ XONG: công tắc «việc của NGƯỜI KHÁC»** ⇒ ⭐ **S1 QUYẾT `B1`** (`DEC-20261009-020`, đúng thẩm quyền user giao 08/10): **1 dòng ma trận** `work_others` = «Việc của NGƯỜI KHÁC (xem · sửa · duyệt)» — ⛔ **KHÔNG đổi CSDL, ⛔ KHÔNG migration** (B2 bị loại: cần 4 cột + migration giữa lúc đóng băng build) ✓ ⚠️ **cấp ban đầu = 0** (đúng ràng buộc §5.3 của bạn) ✓ nhãn ma trận đã có ở `app/page.tsx` ✓

**③ §4.3 — ✅ XONG: action + capability XOÁ công việc** ⇒ ✅ **`delete_work_item`** đã đủ **5 tầng** + **đã chạy**: module **`work`** + capability **`canEdit`** · port/adapter/use-case/controller · **XOÁ MỀM** (`status='CANCELLED'` + `active=0` + `cancelled_by` — ⭐ cùng khuôn **7/29** việc đã huỷ có sẵn trong CSDL) · ⛔ **chỉ người ĐÃ GIAO/TẠO** · ⛔ không xoá việc `COMPLETED` ✓
- 📏 **ĐO**: `WorkItemDeleteRbacTest` **4/4** (1 dương + **3 đối chứng âm**: 400 không phải người giao · **403** thiếu khoá `work` · 400 việc `COMPLETED`) · **Java 106/106** (nền 102) · jar **14:40:31** · `:18081` pid **7708** · health **200** · live **401** (action tồn tại) · `coverage` **0 mù quyền** ✓
- 📌 **HỢP ĐỒNG CHO NÚT «XOÁ» (W3)**: `{action:"delete_work_item", workItemId}` ⇒ **200** `{message:"Đã xoá công việc <taskNo>."}` · **400** «Chỉ người đã giao/tạo công việc mới xoá được công việc này.» · **400** «Việc đã Hoàn thành nên không xoá được…» · **403** (thiếu `work`+`canEdit`) ⇒ ⭐ UI: chỉ hiện nút khi `assignedBy === tôi` ⛔ VÀ `status !== 'COMPLETED'`; hiện **nguyên văn** `message` khi lỗi ✓
- ⚠️⚠️ **1 VIỆC NHỎ CẦN BẠN ĐỂ CỔNG HẾT ĐỎ**: `tools/probe-catalog-drift.mjs` **EXIT 1** — *«CHƯA BIẾT: 1 → `delete_work_item`»* (action Java-only mới của tôi) ⇒ chọn ① thêm `case` vào `scripts/system-route.mjs` (như kế hoạch §4 dòng 1 của bạn) **hoặc** ② thêm 1 tên vào `KNOWN_JAVA_ONLY` (như 6 tên của `HANDOFF-D14`) ⇒ ⛔ S01 **không tự sửa 2 tệp của bạn** ✓

**④ §2 — ĐÍNH CHÍNH CÓ BẰNG CHỨNG: thay đổi `WorkCenter.tsx` ⛔ KHÔNG PHẢI tôi.** Danh sách tệp S01 đã sửa hôm nay: `ActionRbacRegistry.java` · `OpsTaskStore.java` · `OpsTaskStoreAdapter.java` · `OpsTaskManagementUseCase.java` · `SystemController.java` · 2 tệp test Java · `app/page.tsx` (nhãn) · `lib/ui-shared.tsx` (`ModuleKey`) · `MANIFEST_SHA256.txt` · `lib/vntech-identity-data.mjs` + các tệp định danh gốc · `docs/**` của S01 ⇒ ⛔ **không có `WorkCenter.tsx`** ✓ (tôi cũng ⛔ không tự xoá biến `assigned` bạn nêu — **vùng bạn claim**) ✓

**⑤ §4.4 (`project_admin`) + §4.5 (rebuild)**: ⏳ cả hai đang chờ ⇒ **`project_admin`**: tôi sẽ đọc `KE-HOACH-A3-CRUD-PROJECT.md` §8 và thi hành phần registry/Java (⚠️ vẫn **chờ user chốt `docs/38 §7`** về module CRUD dự án) ✓ · **REBUILD**: ⚠️ S01 **vẫn giữ build** — nay **`tsc` đã xanh** (điều kiện bạn nêu ở §4.5) ⇒ ⭐ **chỉ còn chờ bạn ghi `RELEASED — mtime cuối HH:mm:ss`** là tôi chạy trọn chuỗi (fixpoint → SQLite → manifest → build → restart **đúng PID** → nghiệm thu → 2 cổng phát hành) ✓

### 📤 HANDOFF-20261009-A13 — `ERP-SESSION-01` → `ERP-SESSION-04`: **`project_admin` XONG — ⚠️ NHƯNG PHẢI SỬA 3 TẦNG (bản vá §8 của bạn MỚI LÀ 1 TẦNG ⇒ sẽ là SỬA GIẢ)**
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈15:12) · **STATUS** `DONE` (phần S01) · **TASK** `HANDOFF-S4-SANG-S1.md` §4.4 + `KE-HOACH-A3-CRUD-PROJECT.md` §8

**✅ ĐÃ ÁP + ĐÃ CHẠY** (⛔ 0 tệp của bạn):
| Tầng | Việc | Ghi chú |
|---|---|---|
| ① **CONTROLLER** | `create/update/delete_project`: `requireRequireAdmin` → **`requireCurrentUser`** | ⚠️ **BẮT BUỘC** — tầng này chặn **TRƯỚC** khi registry được xét (⚠️ §8 của bạn ⛔ không nhắc ⇒ vá registry một mình = **sửa giả**) · ✅ **GIỮ NGUYÊN** `set_project_status` = `requireRequireAdmin` ✓ |
| ② **REGISTRY** | `List.of("project_admin", "admin")` + `canCreate`/`canEdit`/`canEdit` | ⭐ **có `"admin"` LÀ CỐ Ý**: nếu khai **trần** thì nhánh `isCompanyLeadership && !required.contains("admin")` sẽ **MỞ CỬA cho giám đốc/kế toán** ⇒ ⛔ phá kết quả vòng 99 của bạn (`giamdoc.demo` = 403) ✓ |
| ③ **USE-CASE** ⚠️ **TẦNG 3 — TÌM RA NHỜ TEST** | `ProjectManagementUseCase` **L48/L83/L150** gọi `rbac.requireRole(principal, List.of("admin"))` ⇒ **đã bỏ 3 dòng** | ⚠️ **GIỮ** dòng của `setProjectStatus` (L109) ✓ ⚠️ đây là lý do ca DƯƠNG của tôi **ĐỎ lần đầu** với thân `{"error":"Tài khoản không có quyền thực hiện nghiệp vụ này."}` ⇒ nếu chỉ vá 1–2 tầng thì **⛔ không có tác dụng gì** ✓ |

**📏 ĐO (bằng chứng)**: `ProjectCrudMatrixRbacTest` **4/4** — ① **giám đốc ⇒ 403** (giữ vòng 99 ✓) ② chưa tick ⇒ **403** ③ **đã tick ⇒ ĐI QUA cổng quyền** ✓ ④ chưa tick + xoá ⇒ **403** ✓ · **Java 110/110** (nền 106) · `F-03` **7/7** (⛔ 0 dịch số dòng ✓) · `coverage` **EXIT 0** («③ ADMIN-ONLY **55 → 52**» ✓ · MÙ QUYỀN **0**) · `parity` **0 thiếu** · `catalog-drift` **EXIT 0** (⛔ ⛔ **KHÔNG cần thêm tên vào whitelist** — 3 tên đã có trong catalog JS ✓) · jar **15:07:47** · `:18081` **0 lỗi khởi động** ✓

**⏳ 3 PHÉP KIỂM LIVE §4 CỦA BẠN — GIỜ ĐÃ CHẠY ĐƯỢC** (⚠️ cần **admin tick** `project_admin` trong ma trận cho tài khoản thử ⇒ ⭐ đây chính là luồng thật: cấp qua ma trận):
① `giamdoc.demo` + `delete_project`/`update_project` ⇒ kỳ vọng **403** ✓ ② tài khoản **chưa tick** + `create_project` ⇒ **403** ✓ ③ tài khoản **đã tick** + `create_project` ⇒ **400 nghiệp vụ** (⛔ không phải 403) ✓
⚠️ **NHẮC**: S01 **vẫn giữ build** ⇒ ⭐ ghi **`RELEASED — mtime cuối HH:mm:ss`** là tôi chạy trọn chuỗi (fixpoint → SQLite → manifest → build → restart **đúng PID** → nghiệm thu → 2 cổng phát hành) trong **1 lượt** ✓
**AFFECTED FILES**: ⛔ **0 tệp của bạn** ✓

### 📤 HANDOFF-20261009-A14 — `ERP-SESSION-01` → `ERP-SESSION-04`: 🎉 **BUILD ĐÃ CHẠY (mốc 14:51:12)** · ⚠️ **1 LỖI LINT CÓ TRƯỚC cần đúng chủ** (⛔ S01 không sửa mù)
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈15:15) · **STATUS** `DONE` (build) + `OPEN` (lỗi lint) · **TASK** `HANDOFF-20260909` lượt build

**✅ BUILD XONG — người dùng NAY THẤY ĐƯỢC thay đổi của cụm**: vân tay **`VNTECH-FP-EB036564F91A0BAE`** · `dist/client` **15:13:36** · `:8787` đã chạy lại (**dừng đúng PID 17980**) · ⭐ **cổng UI 3/3 ĐẠT** («BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT») · ✅ `verify-full-release` **EXIT 0** (`SHA256 manifest ĐẠT · 7534 files` · `VNTECH FINGERPRINT ĐẠT · brand/release verified`) ✓
**📌 ĐIỀU KIỆN ĐÃ THỎA**: bạn ghi `RELEASED 14:51:12` ✓ + ⛔ 21 phút sau đó **không sửa FE** ✓ + `typecheck` **0 lỗi** ✓ ⇒ ⭐ cả 6 sửa FE của bạn + **W2** nay **đã hiện** trên `:8787` ✓

**🔎 CÒN 1 TẦNG ĐỎ: `test:release-static` → `Lint`** (⚠️ các tầng `SHA256` và `Brand fingerprint` **đã XANH** ✓ — tôi vá 2 tầng đó hôm nay ✓)
- **Lỗi DUY NHẤT**: `app/page.tsx:2902:106` — *«Calling setState synchronously within an effect can trigger cascading renders»* (⚠️ **⛔ không hiện tên rule** ⇒ báo `Error:` trần của **React Compiler**) · 297 cảnh báo còn lại **được cổng dung nạp** ✓
- ⛔ **S01 KHÔNG sửa mù** (3 lý do đo được): ① **⛔ không có tên rule** ⇒ `eslint-disable-next-line <rule>` lúc này là **ĐOÁN** ✓ ② luật này **đã chặn cụm 4 lần** (4 lần sửa FE đều ESLint ĐỎ ⇒ hoàn nguyên) ✓ ③ dòng lỗi **có trước**, ⛔ không thuộc 2 sửa của S01 (tôi chỉ chạm **L129-140**) ✓
- ⚠️ **MANH MỐI CHỦ SỞ HỮU**: chú thích ngay trên dòng lỗi ghi *«đã gặp và sửa **14:20**»* ⇒ khối mã do **phiên KHÁC** viết — ⚠️ bạn tự nhận ở §2 là `WorkCenter.tsx` **bị sửa NGOÀI bạn** ⇒ ⭐ **có một NGƯỜI GHI THỨ BA** trong repo đang sửa FE ⇒ ⚠️ đề nghị bạn + S01 cùng xác minh (⚠️ `app/page.tsx` = **LOCK S01**, nên tôi cần biết ai đã chạm để ⛔ tránh chồng lấn) ✓
- ⭐ **ĐỀ NGHỊ**: xác định tên rule thật (chạy `npx eslint app/page.tsx --format json` để lấy `ruleId`) rồi mới quyết: (a) `eslint-disable-next-line <rule>` + giải trình (hội tụ, ⛔ không lặp) hay (b) sửa đúng chuẩn (chuyển việc kẹp `step` sang **tính trong lúc render**) — ⚠️ (b) rủi ro hơn vì đụng nhiều chỗ dùng `step` ✓
**AFFECTED FILES**: ⛔ **0 tệp của bạn** ✓ (tôi chỉ chạy chuỗi định danh + build + sinh `MANIFEST_SHA256.txt` ✓)

### 📤 HANDOFF-20261009-A15 — `ERP-SESSION-01` → `ERP-SESSION-04`: ⭐ **USER YÊU CẦU TRỰC TIẾP VỀ MENU «CÔNG VIỆC» (3 việc — ⚠️ ① thuộc tệp BẠN, ③ S01 ĐÃ LÀM)**
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈15:25) · **STATUS** `OPEN` (①) + `DONE` (③) · **TASK** yêu cầu TRỰC TIẾP của user (kèm ảnh chụp màn hình)

**📌 NGUYÊN VĂN USER**: «*bỏ quản trị dự án ra khỏi menu công việc (xóa), tách hoàn toàn Trung tâm phê duyệt ra khỏi menu công việc, Menu công việc hiện tại đã không còn menu item (đã chuyển hết vào tab) nên bây giờ chỉ cần click vào công việc là mở màn công việc luôn chứ như bây giờ click vào nó còn mở thêm menu item rồi mới click được vào màn.*»

**① ⚠️ VIỆC CỦA BẠN (1 dòng — `lib/menu-helpers.ts`)**: **BỎ mục `project_admin` KHỎI MENU** nhưng ⚠️ **GIỮ NGUYÊN DÒNG MA TRẬN**:
- Hiện trạng ĐO được: `lib/menu-helpers.ts:51` = `{ key: "project_admin", label: "Quản trị dự án (tạo / sửa / xoá)", icon: "DA", groupKey: "my_work" }` ⇒ ⚠️ vì còn `groupKey: "my_work"` và ⛔ không nằm trong danh sách ẩn nào ⇒ nó **lọt vào `group.children`** ⇒ ⭐ **vẽ thành MỤC MENU THỨ 2 của nhóm «CÔNG VIỆC»** (đúng như ảnh user chụp: «CÔNG VIỆC» + «QUẢN TRỊ DỰ ÁN (TẠO / SỬA / XOÁ)») ✓
- ⭐ **CÁCH SỬA ĐÚNG (⛔ không xoá dòng khai báo — ma trận cần nó)**: đưa khoá `project_admin` vào danh sách mà `app/page.tsx:734` **đã lọc sẵn** khỏi `children` = **`independentMenuKeys`** (⚠️ danh sách này ⛔ không khai trong `lib/menu-helpers.ts` — bạn biết chỗ khai, ⛔ tôi không tự sửa tệp bạn) ⇒ ⭐ **giữ khoá trong `modules` (→ còn dòng ma trận ✓) + ⛔ không vẽ thành mục menu** ✓
- ⚠️ **ĐIỀU KIỆN AN TOÀN**: sau khi sửa, `configuredModules` **VẪN PHẢI có** dòng `project_admin` (ma trận ✓) — ⭐ nếu bạn có probe/test đếm số dòng ma trận thì cập nhật kỳ vọng ✓

**③ ✅ S01 ĐÃ LÀM XONG (⛔ bạn không cần làm)**: mở rộng luật «nhóm chỉ 1 mục ⇒ **bấm mở THẲNG**» (`app/page.tsx`, LOCK S01) sang nhóm `my_work` — ⚠️ điều kiện ĐO được: `children` RỖNG + `workMenuChildren` đúng 1 mục ⇒ ⭐ **tự áp dụng ngay khi bạn xong ①**, ⛔ không cần sửa gì ở `app/page.tsx` (⚠️ tệp của tôi) ✓ ⚠️ nếu nhóm còn mục con khác ⇒ **tự rơi về hành vi cũ** (xổ ra) ⇒ ⛔ không phá cấu trúc menu ✓

**② «TRUNG TÂM PHÊ DUYỆT» — ⚠️ ĐO ĐƯỢC LÀ ĐÃ TÁCH RỒI** (`lib/menu-helpers.ts:373` = nhóm riêng `approval_center` / «PHÊ DUYỆT» sort 20 ✓ + `app/page.tsx:745` đẩy nó thành **nhóm riêng**, ⛔ không nằm trong `children` của `my_work` ✓) ⇒ ⭐ **⛔ không cần sửa gì**; ⚠️ ảnh user có thể là **cache trình duyệt** (⚠️ ĐO: `:9000` là `tools/cutover-proxy.mjs --ui-port 8787` ⇒ **proxy sang `:8787`** và **van tay HTML của CẢ 2 cổng = `eb036564f91a0bae`** = bản build **15:13** ✓) ⇒ ⭐ đã đề nghị user **Ctrl+F5** ✓ — ⚠️ **nếu user vẫn thấy sai sau hard-refresh thì báo S01 ngay** ✓

**⏭️ SAU KHI BẠN XONG ①**: 📣 ghi **`RELEASED — mtime cuối HH:mm:ss`** vào `SHARED_STATE` ⇒ S01 chạy **trọn chuỗi build** (fixpoint → SQLite → manifest → build → restart **đúng PID** → nghiệm thu 3/3 → 2 cổng phát hành) ⇒ ⭐ user thấy kết quả **trong cùng lượt** ✓
**AFFECTED FILES**: ① `lib/menu-helpers.ts` (của bạn) · ③ `app/page.tsx` (của S01 — **đã xong**) ✓

### 📤 HANDOFF-20261009-A16 — `ERP-SESSION-01` → `ERP-SESSION-04`: ⚠️ **USER ĐÍNH CHÍNH PHẠM VI** — «thay đổi giao diện WORK–PROJECT thuộc **S4**» ⇒ S01 **BÀN GIAO** phần đã lỡ làm + **SẴN SÀNG HOÀN NGUYÊN**
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈15:30) · **STATUS** `HANDOVER` · **TASK** đính chính phạm vi của user

**📌 NGUYÊN VĂN USER (mới nhất)**: «*t gửi nhầm công việc, việc thay đổi giao diện của WORK - PROJECT thuộc về phạm vi của S4*»

**1️⃣ S01 XÁC NHẬN + RÚT KHỎI PHẠM VI**: ⭐ từ nay mọi yêu cầu **thay đổi GIAO DIỆN WORK–PROJECT** ⇒ **S04** sở hữu ✓ ⛔ S01 **không tự làm nữa** (⚠️ kể cả khi user gửi nhầm vào S01) ✓

**2️⃣ ⚠️ PHẦN S01 ĐÃ LỠ LÀM — BÀN GIAO ĐẦY ĐỦ (⛔ không giấu)**: trong `app/page.tsx` (⚠️ **LOCK của S01**, nhưng **nghiệp vụ của S04**):
- **Đã thêm**: khối mới ở **L773** — `if (groupKey === "my_work" && group.children.length === 0 && workMenuChildren.length === 1)` ⇒ nhóm «CÔNG VIỆC» render thành **NÚT MỞ TRỰC TIẾP** (`nav-single-direct` + `data-nav-single-group="my_work"`, gọi `activateModule(hub.moduleKey, hub.view)`) ✓
- **Giữ NGUYÊN VĂN** khối `approval_center` (**L758**) ⇒ ⛔ không phá hợp đồng `tests/p6-08-menu-single-item.test.mjs` (test đọc theo **CHUỖI**) ✓
- **Bằng chứng**: `P6-08` **3/3 PASS** ✓ · `T-13` **21/21 PASS** ✓ · `typecheck` **EXIT 0** ✓ · ⚠️ **bản build 15:26:17 ĐÃ CHỨA** thay đổi này (vân tay `e1210467392afd3e` ✓)
- ⭐ **S04 TOÀN QUYỀN QUYẾT**: (a) **GIỮ** (đúng ý user «bấm Công việc là mở màn») → S04 chỉ cần ghi nhận + test khoá ✓ hoặc (b) **MUỐN KHÁC/HOÀN NGUYÊN** → 📣 **báo S01 1 dòng**, S01 hoàn nguyên **trong 1 phút** (⚠️ chỉ 1 khối, ⛔ không đụng gì khác) ✓

**3️⃣ VIỆC CỦA S01 QUAY VỀ ĐÚNG PHẠM VI (release/packaging)**: ⚠️ `test:release-static` vừa đổi sang tầng đỏ **MỚI**: **«Package/source verifier»** (⚠️ tầng `Lint` trước đó ⛔ không còn là tầng dừng) ⇒ S01 đang rà ✓

**4️⃣ ✅ TIN TỐT — BUILD MỚI ĐÃ LÊN `:8787`** (theo `RELEASED` của bạn): vân tay **`e1210467392afd3e`** · `dist` **15:26:17** · ⭐ **cổng UI 3/3 ĐẠT** («BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT») · ✅ `verify-full-release` **EXIT 0** (`SHA256 manifest ĐẠT · 7534 files` · `SOURCE VERIFIER ĐẠT`) ⇒ ⭐ **`W2` + `W4` + `W5` + ① của bạn NAY ĐÃ HIỆN** cho người dùng ✓
**AFFECTED FILES**: `app/page.tsx` (S01 — phần ③ nêu trên) · ⛔ 0 tệp khác của S04 ✓

### 📤 HANDOFF-20261009-A17 — `ERP-SESSION-01` → `ERP-SESSION-04`: ⚠️ **`work_others` CHƯA ĐƯỢC THI HÀNH Ở BACKEND** (⚠️ admin tick cũng ⛔ chưa có tác dụng) — S01 đã DỪNG chờ user quyết
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈15:40) · **STATUS** `BLOCKED` (chờ user) · **TASK** `DEC-20261009-021`

**⚠️ SỰ THẬT ĐO ĐƯỢC (⛔ đừng hiểu nhầm là đã xong)**:
- ⭐ Khoá `work_others` **đã có đủ 3 chỗ**: dòng `modules[]` (`lib/menu-helpers.ts` — bạn) + 1 dòng `ActionRbacRegistry` (**L368** — S01) + `module_catalog` (S01) ✓ ⚠️ **cấp 0** ✓
- ⚠️ **NHƯNG backend ⛔ CHƯA đọc khoá này**: «việc của NGƯỜI KHÁC» do **`WorkScopeService.scopeOf(userId, role)`** quyết theo **VAI TRÒ/CẤP BẬC** (`SELF` / `DEPARTMENT` ≥30 / `COMPANY` ≥35) ⇒ ⛔ **không theo ma trận** ✓
- ⚠️ ⇒ **W2 (UI xem việc người khác) hiện chạy theo VAI TRÒ** ✓ — ⛔ không phải theo khoá ⇒ nếu bạn có test khẳng định «phải có khoá `work_others` mới xem được» thì ⚠️ **nó sẽ ĐỎ** (và đúng ra là **chưa** được thi hành) ✓

**VÌ SAO S01 ⛔ KHÔNG TỰ LÀM**: siết theo khoá (đang cấp 0) ⇒ **MẤT quyền của mọi trưởng phòng/phó GĐ/giám đốc** ⇒ ⭐ đây là **quyết định của user** ⇒ đã ghi `DEC-20261009-021` (3 phương án A/B/C) + **DỪNG chờ user** ✓
**AFFECTED FILES**: ⛔ 0 (chưa sửa gì) ✓

### 📤 HANDOFF-20261009-A18 — `ERP-SESSION-01` → `ERP-SESSION-04`: ⚠️ **MA TRẬN CÒN 4 DÒNG CŨ THEO PHÒNG** (user báo 09/10) — S04 sửa phần giao diện, S01 làm backend `work_others`
**FROM** `ERP-SESSION-01` · **TO** `ERP-SESSION-04` · **DATE** 2026-10-09 (≈15:50) · **STATUS** `OPEN` · **TASK** yêu cầu TRỰC TIẾP của user (kèm ảnh ma trận)

**📌 USER NGUYÊN VĂN**: «*Ma trận phân quyền đang sai, tôi vẫn thấy ghi chú quyền Công việc -> phòng dự án, phân quyền phải theo tab (chức năng)… 6 tab, cần ít nhất 6 quyền theo 6 tab… Session 4 đang hoạt động tích cực chỉnh sửa giao diện hãy phối hợp để tránh conflict*»

**⚠️ VẤN ĐỀ ĐO ĐƯỢC**: 4 khoá **CŨ theo PHÒNG** vẫn **render thành dòng ma trận** với `subGroup` «Phòng Kế hoạch»/«Phòng Dự án»: `dept_plan_tasks` (sort 10) · `dept_project_tasks` (20) · `dept_plan_assign` (30) · `dept_project_assign` (40) ⇒ ⚠️ **đã ẩn khỏi MENU** (`legacyWorkMenuKeys` ✓) nhưng **⛔ CHƯA ẩn khỏi MA TRẬN** (ma trận đọc `configuredModules`, ⛔ không qua bộ lọc menu ✓) — ⭐ **đó là lý do user thấy «CÔNG VIỆC · Phòng Kế hoạch/Phòng Dự án»** ✓

**① ⚠️ VIỆC CỦA S04 (giao diện ma trận — ⛔ S01 không tự sửa)**: ⛔ **không render 4 dòng cũ** đó trong ma trận (⚠️ **GIỮ khai báo** trong `modules[]` — chúng còn dùng cho phạm vi tab «Phòng ban/Tổ đội» ✓) ⇒ ⭐ cùng khuôn `legacyWorkMenuKeys` nhưng cho **ma trận** ✓ · ⭐ nhân dịp: đổi nhãn dòng `work` (hiện «Công việc (mọi phòng ban)») thành rõ nghĩa **«Công việc — Quyền thao tác (tạo / sửa / xoá việc)»** (⚠️ nó là **cổng HÀNH ĐỘNG**, ⛔ không phải tab) ✓
**② ✅ VIỆC CỦA S01 (đã được user chốt `A`)**: thi hành khoá **`work_others`** ở backend theo ⭐ **phương án A — CỘNG THÊM**: giữ nguyên phạm vi theo chức vụ; khoá `work_others` = cấp **THÊM** ⇒ «Theo người» (W2) xem được nếu **(trong phạm vi chức vụ) HOẶC (được cấp khoá)** ✓ (⚠️ ⛔ **KHÔNG** siết làm mất quyền trưởng phòng/phó GĐ/giám đốc ✓)
**③ 📐 ĐỀ XUẤT SUB-TAB (đã gửi user, chờ xác nhận)** — chi tiết `DEC-20261009-022`: «Của tôi»/«Đã giao» ⛔ khoá riêng · «Theo người» ⇒ **`work_others`** ✓ · 2 sub-tab «Việc phòng ban của tôi»/«Việc của tổ đội tôi tham gia» ⛔ khoá riêng (**theo chức vụ**) ✓ · Kanban/Cây ⛔ ✓
**⚠️ PHỐI HỢP**: ⭐ bạn đang chỉnh giao diện (⚠️ lần cuối chạm mã: **15:25:39** `WorkCenter.tsx`; 6 phút qua chỉ ghi log/probe ✓) ⇒ ⚠️ S01 ⛔ **không chạm** `lib/menu-helpers.ts` / `WorkCenter.tsx` / `PermissionMatrix*` ✓ — khi bạn sửa xong ⇒ ghi **`RELEASED — mtime cuối`** ⇒ S01 chạy lượt chốt ✓
**AFFECTED FILES**: ① `lib/menu-helpers.ts` + component ma trận (**của S04**) · ② `java-backend/**` (**của S01**) ✓

### ⚠️ ĐÍNH CHÍNH A18 (09/10/2026 ≈15:58) — **S01 RÚT LẠI phần ma trận** theo chốt phạm vi MỚI của user («PR&PO + quản trị hệ thống (ADMIN) là phạm vi S01») ⇒ **S04 ⛔ không cần làm**: «⛔ không render 4 dòng CŨ theo phòng trong ma trận» + «đổi nhãn dòng `work`» ⇒ **S01 tự làm** ✓ (⚠️ `lib/menu-helpers.ts` là tệp dùng chung ⇒ S01 báo trước khi chạm ✓)
