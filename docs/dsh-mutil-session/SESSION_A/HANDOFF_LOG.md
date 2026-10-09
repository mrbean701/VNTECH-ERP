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
