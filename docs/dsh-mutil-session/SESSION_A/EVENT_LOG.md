# EVENT_LOG — SESSION_A (ERP-SESSION-01)

> Phien: **ERP-SESSION-01** · Timezone Asia/Ho_Chi_Minh (UTC+7) · Pham vi: **PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN**
> ⭐ **MUC DICH**: ⭐ **dung lai duoc TIMELINE hoat dong cua phien tu tep nay** (§4/§6) ✓
> ⚠️ Gio ghi theo **su kien + moc do duoc** (⭐ nhieu moc lay tu `updated_at` CSDL / moc tep build, ⛔ khong bia gio chinh xac khi khong do duoc) ✓

---

## EVT-20261006-001
Timestamp: 2026-10-06 (dau phien)
Session: ERP-SESSION-01
Event: SESSION_START
Task: 9 ban va Java + sua cong cu trien khai
Module: Toan he thong (backend Java)
Status: IN_PROGRESS
Description: Doc state (`docs/dsh-state/`) ⇒ **dung lai cau truc hien co**, ⛔ KHONG tao he thong state thu hai (§4). Tiep nhan danh sach loi HTTP 500.
Related Task: TASK-20261006-001

---

## EVT-20261006-002
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: HOTFIX_COMPLETE
Task: 9 ban va Java
Module: Backend Java
Status: FIXED
Description: ⭐ **4 loi HTTP 500 da dap**. ⭐ Sua them 1 loi ⭐ **do chinh phien nay gay ra**: **25 dong `//` nam TRONG text block `"""` cua Java** ⇒ chuoi tieng Viet **bi gui xuong MySQL nhu cau lenh SQL** ⚠️ ⇒ HTTP 500. ⭐ Sua cong cu `tools/deploy-java-backend.mjs`: **dung Java TRUOC khi build** (⛔ truoc day build khi JAR con bi giu khoa ⇒ **LUON that bai**).
Related Task: TASK-20261006-001
Related Change: CHG-20261006-001

---

## EVT-20261006-003
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: TEST_COMPLETE
Task: Nghiem thu 9 ban va
Status: DONE
Description: ⭐ **5/5 DAT · 0 LOI**. ⭐ `preview_material_dependencies` goi that ⇒ **HTTP 200 · 237 vat tu**.
Related Task: TASK-20261006-001
Related Bug: (4 loi HTTP 500)

---

## EVT-20261006-004
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: BUG_FOUND
Task: BUG-20261006-001 — danh sach bao loi rong
Module: Quan tri (buoc 14)
Status: OPEN
Description: ⭐ User bao: danh sach bao loi **RONG voi MOI tai khoan** (ke ca admin). ⭐ Nguyen nhan goc tim ra: `action()` **KHONG tra payload** ⇒ `res?.reports` luon `undefined`.
Related Task: TASK-20261006-002
Related Bug: BUG-20261006-001

---

## EVT-20261006-005
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: VERIFICATION
Task: BUG-20261006-001
Status: VERIFIED
Description: ⭐ **USER XAC NHAN BANG MAT**: «**da hien thi bao loi**» ⇒ chuyen `VERIFIED` (§24).
Related Task: TASK-20261006-002
Related Bug: BUG-20261006-001

---

## EVT-20261006-006
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: BUG_FOUND
Task: BUG-20261006-002 · -003 · -004 · -005
Module: Quan tri + Phan quyen
Status: OPEN
Description: ⭐ User bao 4 van de: ① dropdown «Nhom chuc nang» rong · ② khong cap duoc quyen **vuot phong ban** · ③ tab phong ban **bao loi luu** · ④ thieu **«Chon tat ca»** + nut tick **«Ca dong»** khong hoat dong.
Related Task: TASK-20261006-003 · -004 · -005
Related Bug: BUG-20261006-002 · -003 · -004 · -005

---

## EVT-20261006-007
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: HOTFIX_COMPLETE
Task: 4 bug tren
Status: FIXED
Description: ⭐ ① **0/76 → 75 muc** (loc `active` sai kieu: bootstrap tra **boolean `true`**) · ② **bo chot `P5.3`** `assertDepartmentAllowsPermissions` (`UserManagementUseCase.java:266`) + viet lai bai test · ③ **`action()` → `requestApi`** (⚠️ **du lieu VAN LUU THAT** — loi o CAU THONG BAO) · ④ them **3 helper + nut «Chon tat ca» + cot «Ca dong»**.
Related Task: TASK-20261006-003 · -004 · -005
Related Bug: BUG-20261006-002 · -003 · -004 · -005
Related Change: CHG-20261006-002 · -003 · -004

---

## EVT-20261006-008
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: BUG_FOUND
Task: F2 — `receive_goods` khong kiem trang thai PO
Module: Mua hang / Giao nhan
Status: OPEN
Description: ⭐ Phat hien **loi WORKFLOW muc cao**: co the **NHAN HANG tren PO CHUA duoc phat hanh**.
Related Task: TASK-20261006-007
Related Bug: BUG-20261006-007 (F2)

---

## EVT-20261006-009
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: BLOCKER
Task: F2 — tim nguyen nhan goc
Status: BLOCKED
Description: ⚠️ ⭐ **DOAN SAI 3 LAN LIEN TIEP**: ① «thieu quyen `purchasing`» ⇒ **SAI** (`RbacService` loai tru `admin`) · ② «chua biet» · ③ sua **SAI TEP** (`web/src/**main**/resources/db/demo/schema-h2.sql` ⛔ khong phai tep test dung). ⭐ **NGUYEN NHAN THAT** chi lo ra khi **DOC NGAN XEP LOI THAT** (`surefire-reports`).
Related Task: TASK-20261006-007
Related Bug: BUG-20261006-007 (F2)

---

## EVT-20261006-010
Timestamp: 2026-10-06 12:50:20
Session: ERP-SESSION-01
Event: HOTFIX_COMPLETE
Task: F2
Status: FIXED
Description: ⭐ NGUYEN NHAN GOC: `java-backend/web/src/**test**/resources/schema-h2.sql` **THIEU 3 cot** (`decision_reason` · `decided_by` · `decided_at`) ma MySQL that DA CO ⇒ `approve_po` **khong chay duoc trong bai test** ⇒ test **DI VONG** ⇒ **vo tinh ma hoa chinh hanh vi loi F2**. ⭐ Sua 4 cho ⇒ `mvn -o test` **156/156**. ⭐ **Trien khai**: JAR moc **2026-10-06 12:50:20** · PID **16148**.
Related Task: TASK-20261006-007
Related Bug: BUG-20261006-007 (F2)
Related Change: CHG-20261006-006

---

## EVT-20261006-011
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: VERIFICATION
Task: F2
Status: VERIFIED
Description: ⭐ **KIEM CHUNG RUNTIME**: goi THAT `receive_goods` voi PO `PO-PRJ-DEMO-01-2026-0006` (trang thai `pending_approval`) ⇒ **HTTP 400 + DUNG thong diep moi**. ⭐ **DOI CHUNG**: `status` KHONG doi · `so_GRN` KHONG tang ⇒ ⭐ **cong chan DA NGAN viec ghi** (§24).
Related Task: TASK-20261006-007
Related Bug: BUG-20261006-007 (F2)

---

## EVT-20261006-012
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: BUG_FOUND
Task: BUG-20261005-005 — 5 phieu ket `in_transit`
Module: Kho / Van chuyen
Status: OPEN
Description: ⭐ **5 phieu `central_returns` ket o `in_transit`**. ⭐ Goc sau: ban xuat truoc khi va **chi ghi `stock_movements`** ma ⛔ **KHONG ghi `contract_stock_ledger`**.
Related Task: TASK-20261006-008
Related Bug: BUG-20261005-005

---

## EVT-20261006-013
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: VERIFICATION
Task: BUG-20261005-005
Status: VERIFIED
Description: ⭐ Ghi bu **10 dong** `contract_stock_ledger` (sao luu `backup_csl_20261006` — **150 dong**) ⇒ `in_transit` 5→**0** · ledger 96→**101** · xuat hien `CENTRAL_RETURN_RECEIVE = **5**` ⇒ ca 5 phieu nhan duoc.
Related Task: TASK-20261006-008
Related Bug: BUG-20261005-005
Related Change: CHG-20261006-007

---

## EVT-20261006-014
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: BUG_FOUND
Task: BUG-20261006-006 — nut buoc 14 bi KHOA OAN voi `admin`
Module: Quan tri (buoc 14)
Status: OPEN
Description: ⚠️⚠️ ⭐ **LOI DO CHINH PHIEN NAY GAY RA**. User bao «tab Bao loi **van chua hien thi thong tin**» — ⭐ **SAU KHI** da va BUG-20261006-001. ⭐ Goc: ban va «BUG-B» khoa nut bang `hasAdminTab` (**chi doc `allModulePermissions`**) nhung tai khoan `admin` co **0 dong quyen** ⇒ **KHOA VINH VIEN**.
Related Task: TASK-20261006-006
Related Bug: BUG-20261006-006

---

## EVT-20261006-015
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: VERIFICATION
Task: BUG-20261006-006
Status: VERIFIED
Description: ⭐ Sua thanh `isAdminUser(data.user) || hasAdminTab(data, "admin")` (helper co san cua nha `lib/permissions.ts:13`) ⇒ ⭐ **USER XAC NHAN BANG MAT** (§24). ⭐ Phat hien quan trong: **`RbacService` LOAI TRU vai tro `admin`** khoi kiem module ⇒ **UI phai tinh ca vai tro `admin`**.
Related Task: TASK-20261006-006
Related Bug: BUG-20261006-006
Related Change: CHG-20261006-005

---

## EVT-20261006-016
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: TEST_COMPLETE
Task: Nghiem thu E2E 8 bo
Status: DONE
Description: ⭐ **7/8 DAT** — bao loi **3/3** · delete 34 · 30 action **30/30** · payload rong **8/8** · `save_*` meo **49/49** · danh muc VT **7/7** · chung tu KT **6/6** · ⚠️ **chuoi kho 5/9**.
Related Task: TASK-20261006-010
Related Change: —

---

## EVT-20261006-017
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: BLOCKER
Task: `go-live-chuoi-kho` hong 5/9
Status: BLOCKED
Description: ⚠️ Ca 6 loi CUNG thong diep «Tai khoan chua duoc quan tri vien cap dung quyen cho thao tac nay» = **HTTP 403**. ⭐ **CHUNG MINH ⛔ KHONG do phien nay**: doi chieu `backup_ump_20261006` ⇒ `e2e.cht` **60→60** · «dong bi xoa thuoc `e2e.*`» = **0**. ⚠️ Can cap 5 module: `teams` · `warehouse_issue` · `approvals` · `stocktake` · `inventory` ⇒ ⭐ **CAN USER CHO PHEP GHI CSDL**.
Related Task: TASK-20261006-010
Related Bug: —

---

## EVT-20261006-018
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: OWNERSHIP_CLAIM
Task: Pham vi «PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN»
Status: IN_PROGRESS
Description: ⭐ Nhan so huu: `app/page.tsx` · `java-backend/**` (phan quyen + mua hang) · `java-backend/web/src/test/**` · `docs/dsh-state/**`. ⭐ Phat hien **`ERP-SESSION-02`** dang lam song song ⇒ ⭐ thuc hien **DISCOVER → CLAIM → WORK → SYNC** (§2/§29).
Related Task: TASK-20261006-011

---

## EVT-20261006-019
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: HANDOFF
Task: Dieu phoi da phien voi `ERP-SESSION-02`
Status: DONE
Description: ⭐ Doc `docs/agent-progress/TASK-226.md` (473 dong). ⭐ Phan tich `git status` ⇒ **«KHONG CO tep nao trung vung cua toi»** ⇒ `FILES A ∩ FILES B = ∅` (§39). ⭐ Ghi vao `docs/dsh-state/SESSION_REGISTRY.md`: bang 2 phien + **3 VUNG XUNG DOT THAT** + luat.
Related Task: TASK-20261006-011
Related Change: CHG-20261006-008

---

## EVT-20261006-020
Timestamp: 2026-10-06 13:33:19 → 13:40:09
Session: ERP-SESSION-01
Event: BUG_FOUND
Task: BUG-20261007-001 — «luu phan quyen phong ban doi RAT LAU»
Module: Phan quyen phong ban (AD-08)
Status: OPEN
Description: ⭐ User bao: «bam **chon tat ca** ⇒ bam **luu** ⇒ nut luu hien **dang luu** nhung **doi rat lau khong thay phan hoi**». ⭐ **DO THAT**: 1 loi goi = **11,50 GIAY** · «Chon tat ca» = **61 module** goi **TUAN TU** ⇒ **~11,7 PHUT** · ⛔ **khong co tien do**. ⭐ **BANG CHUNG CSDL** phong `ORG-BGD`: `updated_at` chay **13:33:19 → 13:40:09 (~7 phut)** roi **DUNG** ⇒ **55/61 module luu duoc** · ⚠️ **6 module chua**.
Related Task: TASK-20261007-001
Related Bug: BUG-20261007-001

---

## EVT-20261006-021
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: BLOCKER
Task: Sua BUG-20261007-001 (them tien do + goi song song)
Status: BLOCKED
Description: ⚠️ ⭐ **THU 4 LAN — CA 4 LAN DEU BI ESLint DO**: «**Cannot reassign variables declared outside of the component/hook**». ⭐ **NGUYEN NHAN THAT** (⭐ tim ra o lan thu 5): ⭐ **lan sua DAU TIEN da XOA MAT dong khai bao `let ok = 0, that = 0, loiDau = "";` cua `deleteSelected()`** ⇒ no **gan vao bien cua `save()`** ⇒ ESLint bao **DUNG**. ⭐ Da **them lai** ⇒ `npm test` **XANH**.
Related Task: TASK-20261007-001
Related Bug: BUG-20261007-001

---

## EVT-20261006-022
Timestamp: 2026-10-06
Session: ERP-SESSION-01
Event: TEST_COMPLETE
Task: Hoi quy sau khi hoan nguyen + sua khai bao
Status: DONE
Description: ⭐ `npm test` **EXIT=0 · pass 802 · fail 0 · 0 errors**. ⭐ `npm run build` **EXIT=0** · cong UI **3/3** «BAN CHAY DUNG BAN DA BUILD MOI NHAAT». ⭐ Van tay **DAT** `VNTECH-FP-7CEDCD452167CDFA` (**717 tep**).
Related Task: TASK-20261007-001
Related Bug: BUG-20261007-001

---

## EVT-20261006-023
Timestamp: 2026-10-06 (cuoi phien)
Session: ERP-SESSION-01
Event: SESSION_PAUSE
Task: Ghi log chuan hoa `SESSION_A`
Status: IN_PROGRESS
Description: ⭐ Bat dau ghi **9 loai log** theo chuan `docs/dsh-mutil-session/` (§3). ⭐ Da xong **3/9**: `TASK_LOG.md` · `BUG_HOTFIX_LOG.md` · `WEEKLY_REPORT_DATA.md`. ⭐ Da cap nhat **2 tep dung chung**: `SHARED_TODO.md` · `SESSION_REGISTRY.md` (⭐ **giu nguyen du lieu cua `ERP-SESSION-02`** — §25). ⚠️ Con **6 tep**: `EVENT_LOG` · `DEV_LOG` · `CHANGE_LOG` · `TEST_LOG` · `DECISION_LOG` · `HANDOFF_LOG`.
Related Task: —
Related Bug: —

---

## EVT-20261006-024
Timestamp: 2026-10-06 (sau EVT-023)
Session: ERP-SESSION-01
Event: HOTFIX_COMPLETE
Task: BUG-20261007-001 — «luu phan quyen phong ban doi RAT LAU»
Module: Phan quyen phong ban (AD-08)
Status: FIXED
Description: ⭐ ✅ **DA SUA XONG o LAN THU 5** ✓ — ⭐ **CACH DUNG**: ⭐ **dung chinh `ok + that` lam so dem TIEN DO** ⚠️ ⇒ ⭐ **⛔ khong them bien dem moi** · ⭐ **⛔ khong doi cau truc vong lap** ✓ · ⚠️ **4 lan truoc DEU DO** vi **doi cau truc** (`for (let i…)` · `.entries()` · `Promise.all`) hoac **them bien moi** ✓ · ⭐ **NGUYEN NHAN THAT**: ⭐ **lan sua dau tien da XOA MAT dong khai bao `let ok = 0, that = 0, loiDau = "";` cua `deleteSelected()`** ⚠️ ⇒ no gan vao bien cua `save()` ⇒ ESLint bao **DUNG** ✓
Related Task: TASK-20261007-001
Related Bug: BUG-20261007-001
Related Change: CHG-20261006-011

---

## EVT-20261006-025
Timestamp: 2026-10-06 (sau EVT-024)
Session: ERP-SESSION-01
Event: TEST_COMPLETE
Task: BUG-20261007-001 — hoi quy + trien khai
Status: DONE
Description: ⭐ `npm test` **EXIT=0 · pass 802 · fail 0 · 0 errors** ✓ · ⭐ `npm run build` **EXIT=0** ✓ · ⭐ cong UI **3/3** `KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT` ✓ · ⭐ van tay **DAT** `VNTECH-FP-2CD0794B7DD154F2` · ⭐ bundle `page-By2laz6E.js` — ⭐ **CA `:8787` VA `:9000` deu CO `⏳ Đang lưu ` + `⏳ Đang xoá `** ✓
Related Task: TASK-20261007-001
Related Bug: BUG-20261007-001

---

## EVT-20261006-026
Timestamp: 2026-10-06 (sau EVT-025)
Session: ERP-SESSION-01
Event: TASK_COMPLETE
Task: Cap quyen module cho tai khoan `e2e.*` (⭐ **USER DA CHO PHEP GHI CSDL**)
Module: Phan quyen / Du lieu kiem thu
Status: DONE
Description: ⭐ ⭐ **DO THAT**: ⭐ **15 dong quyen DA TON TAI** voi `can_view=1` ⚠️ **NHUNG `can_use=0` · `can_create=0` · `can_edit=0` · `can_approve=0`** ⚠️ va `permission_source = **department_default**` ⇒ ⭐ **cap o CA 2 TANG**: ⭐ phong ban `ORG-DA` (**BEN** — ⛔ khong bi `syncDepartmentUsers` ghi de) + ⭐ nguoi dung (**hieu luc ngay**) · ⭐ **SAO LUU TRUOC**: `backup_ump_20261006b` (**1634 dong**) · ⭐ **DOI CHUNG ⛔ khong pha du lieu**: tong **1634 KHONG DOI** · `admin` = **0** ✓ · `e2e.cht/tk/to` van **60 dong** ✓
Result: ⭐ **`go-live-chuoi-kho` 5/9 (1/7) → ⭐ 7/7 · 0 that bai** ✓ · ⭐ E2E **8/8 DAT** ✓
Related Task: TASK-20261006-010
Related Change: CHG-20261006-009

---

## TONG KET EVENT

| Event | So lan |
|---|---|
| `SESSION_START` | 1 |
| `SESSION_PAUSE` | 1 |
| `BUG_FOUND` | 6 |
| `HOTFIX_COMPLETE` | 3 |
| `TEST_COMPLETE` | 3 |
| `VERIFICATION` | 4 |
| `BLOCKER` | 3 |
| `HANDOFF` | 1 |
| `OWNERSHIP_CLAIM` | 1 |

> ⭐ **TONG**: **23 event** — ⭐ **4 VERIFICATION** (co nguoi/kiem chung xac nhan) · ⚠️ **3 BLOCKER** (⭐ 2 da go, 1 con) ✓

---

# ✅ **SỰ KIỆN CUỐI — 06/10/2026 (⭐ §12 «⭐ sau khi verify ⇒ BUG_HOTFIX_LOG + EVENT_LOG + WEEKLY_REPORT_DATA»)**

## ## EVT-20261006-024 — ⭐ `HOTFIX_COMPLETE` — SỬA ĐIỂM NÓNG HIỆU NĂNG `syncNow`
```
⭐ Thoi gian:   06/10/2026 15:07:06
⭐ Session:     ERP-SESSION-01
⭐ Event:       HOTFIX_COMPLETE  (+ TASK_COMPLETE)
⭐ Task:        TASK-20261006-011
⭐ Bug:         BUG-20261007-001   (⭐ SEVERITY: HIGH — ⭐ user-blocking + ⭐ HỎNG DỮ LIỆU THAT)
⭐ Change:      CHG-20261006-011
⭐ Test:        TEST-20261006-011   (⭐ PARTIAL ⇒ ⭐ PASS ✓)
⭐ Ket qua:     ⭐ 11,50 giay/loi goi  ⇒  ⭐ 0,03 – 0,26 GIAY   (⭐ nhanh hon ~288 lan)
                ⭐ «Chon tat ca» 61 module:  ~11,7 PHUT  ⇒  ~8,7 GIAY   (⭐ nhanh hon ~80 lan)
⭐ Bang chung:  ⭐ JAR moi 86,8 MB · 15:07:06 · :18081 PID 3456 (401) · :9000 PID 13288 (200)
               ⭐ DO 4 LAN qua :9000: 0,05s · 5,73s (co dong bo) · 0,03s · 0,04s
               ⭐ Thong diep «…(⭐ cho dong bo o buoc cuoi).» ⇒ ⭐ BAN MOI DANG CHAY
```

## ## EVT-20261006-025 — 🚨 `SYSTEM_DOWN` — ⚠️ **SỰ CỐ DO CHÍNH PHIÊN NAY** (⭐ ghi trung thực, ⛔ không che)
```
⭐ Thoi gian:   06/10/2026 ~14:36
⭐ Event:       SYSTEM_DOWN  (⭐ CRITICAL — ⭐ §20 «SYSTEM DOWN»)
⭐ Nguyen nhan: ⚠️ MOT LENH TRIEN KHAI BI NGAT GIUA CHUNG:
                ① da DUNG Java  ⇒  ② `mvn package` GHI DE JAR (⭐ con 0,1 MB = do dang)
                ⇒  ③ BI NGAT truoc khi build xong + truoc khi start lai
⭐ Trieu chung: :18081 ⛔ KHONG NGHE · :9000 ⛔ KHONG NGHE · JAR = 0,1 MB (⚠️ hong)
⭐ ANH HUONG:   ⚠️ Chi MAT THOI GIAN (~10 phut) — ⛔ KHONG mat du lieu
                (⭐ MySQL doc lap · ⭐ quyen `e2e.*` con nguyen 1634 dong)
⭐ Muc do:      ⚠️ CRITICAL (⭐ he thong ngung phuc vu)
```
## ## EVT-20261006-026 — ✅ `RECOVERY` — KHÔI PHỤC HOÀN TOÀN
```
⭐ Thoi gian:   06/10/2026 ~14:50
⭐ Event:       RECOVERY  (⭐ BLOCKER ⇒ DA GO)
⭐ Cach sua:    ① Copy ban lui 86,8 MB (`vntech-erp-web-2026-10-06T07-35-54.jar`)
                ② Start Java  ⇒ :18081 PID (401 = song)
                ③ Start proxy DUNG CO ⇒ :9000 PID 13288 (HTTP 200)
⭐ Ket qua:     ✅ :18081 · :9000 · :8787 — CA 3 SONG ✓
                ✅ Dang nhap `admin` qua :9000 ⇒ HTTP 200
                ✅ `allModulePermissions` = 1634 (⭐ quyen e2e con nguyen)
```

## ## EVT-20261006-027 — 🚨 `RISK_FOUND` + ✅ `RISK_REMOVED` — RỦI RO ẨN NGHIÊM TRỌNG
```
⭐ Thoi gian:   06/10/2026 ~15:00
⭐ Event:       RISK_FOUND  ⇒  RISK_REMOVED
⭐ Rui ro:      ⚠️ JAR TREN DIA = 0,1 MB (HONG) ⚠️ NHUNG Java :18081 VAN TRA 401 = SONG
                ⇒ ⭐ Java dang chay bang CLASSES DA NAP TRONG RAM
                ⇒ ⭐⭐ NEU JAVA RESTART (hoac MAY RESTART) ⇒ ⭐ HE THONG ⛔ KHONG KHOI DONG LAI DUOC
⭐ Cach sua:    ⭐ Dung PID 19568 (⭐ da xac minh cmdline `java -jar vntech-erp-web…`)
                ⇒ ⭐ JAR NHA KHOA sau DUNG 2 GIAY  ⇒ ⭐ ghi de tu ban lui 86,8 MB  ⇒ start lai
⭐ Ket qua:     ✅ JAR = 86,8 MB LANH  ⇒ ⭐ RUI RO ⛔ KHONG CON
⭐ Bai hoc:     ⭐ ⭐ «CONG TRONG ⛔ KHONG CO NGHIA LA JAR DA NHA KHOA» ⚠️ — ⭐ phai KIEM bang PHEP THU RENAME ✓
```

## ## EVT-20261006-028 — ⭐ `TOOL_FIXED` — SỬA CÔNG CỤ TRIỂN KHAI
```
⭐ Thoi gian:   06/10/2026 ~15:11
⭐ Event:       TOOL_FIXED
⭐ File:        tools/deploy-java-backend.mjs   (⭐ NGOAI ROOT_DIRS ⇒ ⛔ khong anh huong van tay ✓)
⭐ Loi:         ⚠️ Cong cu doi 3 GIAY CO DINH + ⭐ CHI KIEM «CONG DA TRONG»
                ⇒ ⚠️ nhu the ⛔ KHONG BAO DAM JAR da nha khoa ⇒ `repackage` ⛔ LUON that bai
⭐ Cach sua:    ⭐ Thay bang «DO Den KHI JAR THUC SU NHA KHOA» — ⭐ PHEP THU RENAME, toi da 60 giay ✓
⭐ Kiem:        ✅ `node --check` EXIT=0  ·  ✅ dry-run EXIT=0  ·  ✅ van tay ⛔ KHONG DOI ✓
⚠️ CON LAI:     ⚠️ Doan moi ⭐ MOI QUA DRY-RUN ⚠️ (⭐ dry-run BO QUA nhanh `if (THUC_THI)`)
                ⇒ ⭐ CHUA KIEM RUNTIME ⇒ ⭐ se kiem o lan trien khai THAT tiep theo ✓
```

## ## EVT-20261006-029 — ⭐ `DOC_COMPLETE` + `OWNERSHIP_RELEASE`
```
⭐ Thoi gian:   06/10/2026 15:15
⭐ Event:       DOC_COMPLETE · OWNERSHIP_RELEASE
⭐ Da ghi:      ⭐ 4 tep log cap nhat ket qua cuoi:
                BUG_HOTFIX_LOG (20,2 KB · 292 d) · CHANGE_LOG (19,7 KB · 300 d)
                TEST_LOG (257+ d) · WEEKLY_REPORT_DATA (19,2 KB · 264 d)
               ⭐ + SESSION_REGISTRY.md (40,8 KB) — ⭐ dung chung:
                quy trinh build 4 BUOC · 2 nguyen nhan build loi · lenh :9000 · 5 luat moi
⭐ Dinh chinh:  ⭐ Sua 5 CON SO LOI THOI trong TEST_LOG (⭐ E2E 7/8 ⇒ ⭐ 8/8 · PASS 10 ⇒ 12
                · chuoi kho 5/9 ⇒ 7/7 · van tay 7CEDCD… ⇒ DC6A989…)
               ⭐ Sua GHI CHU LOI THOI trong CHANGE_LOG («GOC VAN CON» ⇒ ⭐ DA SUA XONG ✓)
⭐ Da release:  ⭐ OWNERSHIP = RELEASED  (⭐ §32 ✓)
⚠️ Con lai:     ⏳ User nghiem thu 5 bug ⇒ VERIFIED · ⚠️ kiem runtime cong cu · ⛔ commit (⭐ cho user)
```

---

## ## ⭐ BẢNG ĐẾM EVENT — CẬP NHẬT (⭐ thay bảng ở dòng 337–347)
| ⭐ Event | ⭐ Số lần |
|---|---|
| ⭐ `SESSION_START` | ⭐ 1 |
| ⭐ `SESSION_PAUSE` | ⭐ 1 |
| ⭐ `TASK_START` | ⭐ 12 |
| ⭐ `TASK_COMPLETE` | ⭐ 11 |
| ⭐ `BUG_FOUND` | ⭐ 9 |
| ⭐ `HOTFIX_START` | ⭐ 9 |
| ⭐ `HOTFIX_COMPLETE` | ⭐ 9 |
| ⭐ `TEST_START` / `TEST_COMPLETE` | ⭐ 12 / ⭐ 12 |
| ⭐ `VERIFICATION` | ⭐ 5 |
| ⭐ 🚨 `SYSTEM_DOWN` | ⭐ 1 (⭐ 06/10 ~14:36 ⚠️) |
| ⭐ ✅ `RECOVERY` | ⭐ 1 (⭐ ~14:50 ✓) |
| ⭐ 🚨 `RISK_FOUND` | ⭐ 1 (⭐ ~15:00 ⚠️) |
| ⭐ ✅ `RISK_REMOVED` | ⭐ 1 (⭐ ~15:00 ✓) |
| ⭐ `TOOL_FIXED` | ⭐ 1 (⭐ ~15:11 ✓) |
| ⭐ `BLOCKER` | ⭐ 3 (⭐ **CẢ 3 ĐÃ GỠ** ✓) |
| ⭐ `HANDOFF` | ⭐ 5 |
| ⭐ `OWNERSHIP_CLAIM` | ⭐ 1 |
| ⭐ `OWNERSHIP_RELEASE` | ⭐ 1 |

**TỔNG CUỐI: 29 event** (23 → 29)

- **3 BLOCKER — cả 3 đã gỡ**: sự cố hệ thống, rủi ro JAR hỏng, công cụ deploy lỗi.
- **1 sự cố CRITICAL** đã xảy ra và đã khắc phục: **không mất dữ liệu**, chỉ mất ~10 phút.
- **Nguyên nhân gốc của sự cố**: gộp «dừng service + build + start» vào **một lệnh dài**.
- **Luật mới**: tách thành lệnh ngắn, hoặc chạy `run_in_background` để không thể bị ngắt.
- **Trạng thái cuối**: `:18081` PID 3456 · `:9000` PID 13288 · `:8787` PID 1448 — cả 3 sống.

# EVT-20261006-030 — TASK START · TAB 14 «BÁO LỖI» → MODAL
```
2026-10-06 ~17:30 · ERP-SESSION-01 · TASK-20261006-012
USER YÊU CẦU: «tab báo lỗi … click vào xem chi tiết … sẽ hiển thị ra modal …»
ĐÃ ĐỌC MÃ THẬT (§16): ErrorReportAdminPanel.tsx — chi tiết là thẻ inline dưới bảng (dòng ~158-178)
ĐÃ TÌM DÙNG CHUNG (§17): BaseModal ở lib/ui-blocks.tsx — đã có, 8 màn khác dùng ⇒ REUSE, không tạo modal mới
TELEGRAM: START đã gửi ✓
```

# EVT-20261006-031 — TASK COMPLETE + SỰ CỐ TỰ GÂY + ĐÃ KHÔI PHỤC
```
2026-10-06 ~18:20 · ERP-SESSION-01
✅ HOTFIX_COMPLETE: chi tiết ⇒ BaseModal (+ marker open-report-detail, nhãn «✕ Đóng»)
✅ TEST_COMPLETE: TEST-20261006-012 PASS (tsc 0 · eslint 0 · npm test 802/0 · build ĐẠT · đọc bundle thật)
🚨 SYSTEM_DOWN (UI cục bộ): dừng local-server.mjs trước khi build ⇒ :9000 trả 404 ⇒ UI GO-LIVE chết (~15 phút)
✅ RECOVERY: fixpoint ×2 (bất động 8d70c620…) → đọc SSOT + đối chiếu CSDL → tạo drizzle/0330 (có BACKUP)
             → áp migration (CẢ 4 TRƯỜNG KHỚP) → npm run build → khởi động lại local-server.mjs
             ⇒ :9000 HTTP 200 ✓
✅ CHANGE: CHG-20261006-012 · MIGRATION: drizzle/0330_session_a_task_20261006_012_…sql
✅ OWNERSHIP_CLAIM → OWNERSHIP_RELEASE (app/screens/ErrorReportAdminPanel.tsx · drizzle/0330 · SESSION_REGISTRY.md §⑦)
📤 TELEGRAM: COMPLETE đã gửi ✓
📤 COMMIT dfc189d đã push `unity` (5 tệp) — chưa commit = 0 đường ✓
⏳ CHỜ USER: Ctrl+F5 :9000 → Quản trị hệ thống → tab «Báo lỗi» → bấm «Chi tiết»
```

---

## ## EVT-20261006-032 — 🚨 **XÁC MINH FALSE GREEN CỦA VISUAL-REGRESSION BASELINE**
| ⭐ | ⭐ |
|---|---|
| **SỰ KIỆN** | ⭐⭐ **BUG_FOUND** — ⭐ **baseline 68 ảnh ĐÃ HỎNG** ⚠️ |
| **BẰNG CHỨNG ĐO ĐƯỢC** | ⭐ `--selftest` nhiễu nền: desktop 0px · **laptop 10px (0.0010%)** · tablet 0 · phone 0 ⇒ ⭐ **ngưỡng mặc định 8px QUÁ THẤP** ⚠️ ⭐ phải ≥10 |
| | ⭐ So ảnh CŨ vs hiện tại: **lệch 48,93 % (phone) → 85,38 % (desktop)** ⇒ ⭐ hệ thống **ĐÃ khởi tạo** ⭐ còn ảnh cũ chụp lúc DB còn trống ⚠️ |
| | ⭐ **68 ảnh CŨ = 5 ẢNH DUY NHẤT** (desktop/laptop/tablet 1 mỗi loại, phone 2) ⇒ ⭐⭐ **toàn bộ là màn «Thiết lập hệ thống của công ty»** ⚠️⚠️ |
| **ROOT CAUSE** | ⭐ commit `7fdf71d` (27/09) thay 68 ảnh **khi CSDL chưa khởi tạo** ⚠️ ⇒ ⭐ `MASTER_STATUS.md:426` + `TASK_INDEX.md` (MT3-F14) ghi «0 px lệch» ⇒ ⭐⭐ **FALSE GREEN** ⚠️⚠️ (chính docs nói **chưa từng soi mắt ảnh**) |
| **HÀNH ĐỘNG** | ⭐ `--update` chụp lại **68 ảnh** ✔ EXIT=0 ⭐ ⭐ nền tảng đã khởi tạo, **KHÔNG còn màn setup** ⚠️⚠️ |

---

## ## EVT-20261006-033 — 🔧 **SỬA 3 NAV DEAD TRONG PROBE (⭐ bằng chứng ảnh + CSDL ⭐)**
| ⭐ Màn | ⭐ **BẰNG CHỨNG** | ⭐ Sửa | ⭐ KẾT QUẢ ĐO ĐƯỢC |
|---|---|---|---|
| ⭐ **19-report-center** | ⭐ `module_catalog` `group_key='reports'`: sort **10** `reports` · 20 `dept_plan_alerts` · 30 `dept_project_alerts` · 40 `dept_plan_kpi` · 50 `dept_project_kpi` ⇒ ⭐ `child:4` chọn **KPI** ⛔ SAI MÀN ⭐ + probe chỉ thấy **3** `.nav-child` ⇒ `NO_CHILD(3)` ⚠️ | ⭐ `child: 4` → **`child: 0`** ⭐ | ⭐✅ **`nav=OK` 4/4 viewport** ⭐ |
| ⭐ **18-modal-team-create** | ⭐ `admin-governance-pure.ts:171` ⇒ `ORG_SUB_TABS = ["Cơ cấu tổ chức","Tổ đội theo dự án"]` ⭐ ⭐ ⇒ ⭐ nút «＋ Thêm tổ đội» ⭐ ⭐ **CHỈ hiện khi `orgTab===1`** ⚠️ ⇒ ⭐ thử `clickText:"to doi"` ⭐ ⭐ **LẠC CHỖ** ⚠️ (chữ «tổ đội» ở sidebar + tiêu đề card) | ⭐ thêm `[data-org-subtabs="AD-05"] button:nth-child(2)` ⭐ (⭐ **theo VỊ TRÍ, không mò chữ** ✓) | ⭐✅ **`nav=OK` 4/4** ⭐ ⭐ **modal MỞ** ⭐ `desktop 340,332→1580,748` ⭐⭐ ⛔ **KHÔNG tràn viewport** ✓ |
| ⭐ **16-modal-receipt** | ⭐ ảnh `16-modal-receipt__desktop.png` cho thấy màn **«KHO TỔNG»** (tiêu đề + bảng «Tồn vật lý Kho Tổng» + «Luân chuyển vật tư dự án → Kho Tổng») ⇒ ⭐⭐ **KHÔNG có dải tab** ⭐⭐ ⇒ ⭐ **KHÔNG phải `Inventory.tsx`** ⚠️ | ⭐ thử `child: 5` (`central_warehouse`) ⚠️ | ⭐ ⚠️ **VẪN HỎNG** — ảnh y hệt (364 363 B) ⇒ ⭐ `child:5` ⭐ **KHÔNG phải** `Inventory.tsx` ⚠️ ⇒ ⭐ **phải ĐO thứ tự `.nav-child` THẬT** ⭐ |

⭐ ⭐ **BÀ HỌC (§33 · ĐO THAY ĐOÁN)** ⭐ ⭐
```
⭐ ① ⛔ KHÔNG suy ra index từ `sort_order` CSDL — probe đếm `.nav-child` theo THỨ TỰ DOM ⚠️
⭐ ② ⛔ KHÔNG dùng `clickText` với chữ xuất hiện NHIỀU NƠI (sidebar + tiêu đề + gợi ý) ⇒ dùng SELECTOR theo vị trí ✓
⭐ ③ ⛔ KHÔNG tin log ghi «đã xong» — phải ĐỌC ẢNH bằng mắt (chính MT3-F14 đã ghi «0 px lệch» mà ảnh toàn là màn setup ⚠️)
⭐ ④ ✅ Nav hỏng ⇔ ảnh chụp SAI MÀN (không phải ảnh "hỏng") ⇒ phải coi nav là lỗi CỐT LÕI, không phải ghi chú
```

---

## ## EVT-20261006-034 — 🔌 **ĐÁNH GIÁ PLUGIN NUPHUS-MCP (⭐ anh hỏi «test được như user thật không»)**
| ⭐ Công cụ | ⭐ KẾT QUẢ ĐO ĐƯỢC | ⭐ Bằng chứng |
|---|---|---|
| ⭐ `desktop_windows_list` | ⭐ ✅ **ĐẠT** | ⭐ 17 cửa sổ · ⭐ **2 cửa sổ ERP Opera** (`hwnd 4983852` / `132474`) ✓ |
| ⭐ `desktop_window_screenshot` | ⭐ ✅ **ĐẠT** | ⭐ 1899×1032 · ⭐ đọc được tiếng Việt ✓ |
| ⭐ `desktop_screenshot(region)` | ⭐ ✅ **ĐẠT** | ⭐ vùng 390×120 ⭐ ⭐ **tâm nút đo được** ✓ |
| ⭐ ⭐ `desktop_mouse` click | ⭐ ✅ ⭐ **ĐẠT** | ⭐ ⭐ bấm «Chi tiết» ⇒ nút **đổi thành «Thu gọn»** ⇒ **FRONTEND THẬT ĐÃ PHẢN HỒI** ✓ |
| ⭐ ⭐ `desktop_input` hotkey | ⭐ ✅ ⭐ **ĐẠT** | ⭐ ⭐ `Ctrl`+`F5` **nạp lại trang** ⭐ ⭐ (thấy ô «TÌM NHANH DỰ ÁN…» = **bundle MỚI**) ✓ |
| ⭐ `browser_navigate` localhost | ⭐ ❌ **BỊ CHẶN** | ⭐ **SSRF guard**: «navigation to private/loopback host '127.0.0.1' is refused by default» ⇒ cần `NUPHUS_MCP_ALLOW_PRIVATE_NAV=1` |
| ⭐ `desktop_perceive` (OCR) | ⭐ ❌ **BỊ CHẶN** | ⭐ ⛔ tải model fail (mạng chặn `gitee.com`) |
| ⭐ `desktop_semantic_observe` (UIA) | ⭐ ⚠️ **CHỈ CHỈ THẤY CHROME** | ⭐ 266 ứng viên ⭐ ⭐ **toàn bookmark/địa chỉ/tab** ⭐ ⭐ ⛔ **KHÔNG nút web nào** ⚠️ (Opera ⛔ không phơi DOM qua UIA) |

⭐ ⭐ **PHÁT HIỆN QUAN TRỌNG CHO VIỆC ĐANG DỞ** ⭐ ⭐
```
⭐ Tab ERP của anh ĐANG CHẠY BUNDLE CŨ — bằng chứng: nút hiện «Thu gọn» (NHÃN CŨ)
⭐ chứ không phải «✕ Đóng» (nhãn mới), và modal KHÔNG mở ⚠️
⭐ ⇒ phải Ctrl+F5. Tôi ĐÃ ÉP Ctrl+F5 ⇒ tab nay đã nạp bundle mới ✓
⭐ ⇒ mọi lần anh thử «Chọn tất cả»/«Chi tiết» TRƯỚC lúc đó đã thấy HÀNH VI CŨ ⚠️
```
⭐ ⭐ **HẠN CHẾ THỰC TẾ** ⭐ ⭐ — ⭐ ⭐ plugin **«MÙ»**: ⛔ không đọc DOM ⇒ phải **đo toạ độ bằng mắt** ⇒ ⭐ ⭐ **nguy hiểm khi bấm trượt lên nút SỬA/XOÁ dữ liệu thật** ⚠️ ⭐ ⭐ cửa sổ khác + toast DSH ⭐ **CHE** mục tiêu (⭐ đã gặp thật: `hwnd 14158148` che ERP ✓)

## EVT-20261007-035

Date: 2026-10-07
Session: ERP-SESSION-01
Type: TEST_COMPLETE

### Mô tả
Hoàn thành test phân quyền Quản trị hệ thống (3 kịch bản) + test cấp quyền admin cho user director.

### Kết quả
① e2e.bgd (director, KHÔNG có perm admin) ⇒ vào menu nhưng BỊ CHẶN «CHƯA ĐƯỢC PHÂN QUYỀN» — PASS
② Cấp quyền admin qua CSDL (user_module_permissions) + restart + đăng nhập lại ⇒ VẪN BỊ CHẶN — TÌM RA ROOT CAUSE
③ BootstrapDataAdapter.java:844-900 — 3 nhánh phân quyền:
   - admin (role=admin): toàn bộ module BAO GỒM admin
   - company_leadership (roleBase=director): toàn bộ module TRỪ admin ← e2e.bgd rơi vào đây
   - user thường: lấy từ user_module_permissions
   ⇒ e2e.bgd (director) KHÔNG có quyền admin trong bootstrap ⇒ ĐÚNG THIẾT KẾ

### Ý nghĩa
Phát hiện này quan trọng cho GO-LIVE: khi cấu hình phân quyền cho người dùng, PHẢI hiểu rằng quyền admin KHÔNG thể cấp qua giao diện «Phân quyền người dùng» cho user có roleBase=director. Phải đổi role thành "admin" trong bảng users.

### Liên quan
- TEST-20261007-003 (E2E bước 1-2)
- BUG-20261007-002 (FIXED — page.tsx:523)
- Kiểm hardcode Quản trị hệ thống (3 hardcode có chủ đích)

---

## EVT-20261007-037

Date: 2026-10-07
Session: ERP-SESSION-01
Type: TEST_COMPLETE

### Mô tả
Hoàn thành test phân quyền Quản trị hệ thống qua 2 kịch bản API.

### Kết quả
1. Cấp full quyền admin (`module_key=admin`) cho `e2e.kh` → bootstrap trả `admin: canView=1`, 60 modules → PASS
2. Chỉ cấp 1 tab (`module_key=admin_tab_01`) → bootstrap trả `admin: NOT FOUND`, `admin_tab_01: canView=1` → PASS
3. Đã khôi phục admin perm cho `e2e.kh`

### Phát hiện
- Phân quyền module-level trong `user_module_permissions` hoạt động đúng
- Bootstrap API trả đúng danh sách module theo quyền đã cấp
- Cần phân biệt: `module_key=admin` = toàn quyền, `module_key=admin_tab_NN` = 1 tab cụ thể

### Liên quan
- DEC-20261007-016 (quyết định phân quyền)

---

## EVT-20261008-001 — BUG_FOUND: «bấm Lưu không lưu được quyền» (user báo trực tiếp)

| ⭐ | ⭐ |
|---|---|
| **EVT_ID** | EVT-20261008-001 |
| **DATE** | 2026-10-08 10:20:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **EVENT** | `BUG_FOUND` |
| **MODULE** | RBAC · Phân quyền người dùng |
| **SEVERITY** | HIGH (user-blocking + mất dữ liệu âm thầm) |

USER, nguyên văn: «tôi vừa thực hiện cấu hình phân quyền cho 1 user nhưng gặp lỗi, khi bấm lưu
thì nó không lưu phân quyền tôi vừa chọn cho user, check lại modal phân quyền công việc/
chức năng xem sao.»

⇒ Ưu tiên §21.4 (USER-BLOCKING) + §45 (mất dữ liệu quyền) ⇒ **DỪNG việc khác, chuyển sang bắt lỗi**.
⇒ Loại trừ lần lượt: backend `admin_tab_NN` (NHẬN) · lỗi `undefined` vòng 214 (đã vá) ·
chốt P5.3 phòng ban (đã bỏ 06/10) · guard payload rỗng MỐC 111 (không rỗng).
⇒ **2 nguyên nhân gốc đo được**: (A) frontend lệch 16 khoá · (B) backend chặn theo role.

---

## EVT-20261008-002 — HOTFIX_COMPLETE + TEST + REGRESSION: vá (A), đo lại MẤT 0 khoá

| ⭐ | ⭐ |
|---|---|
| **EVT_ID** | EVT-20261008-002 |
| **DATE** | 2026-10-08 10:45:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **EVENT** | `HOTFIX_COMPLETE` → `TEST_COMPLETE` → `REGRESSION` |
| **RELATED** | BUG-20261008-001 · CHG-20261008-001 · TEST-20261008-001 |

| Mốc | Việc | Kết quả |
|---|---|---|
| `OWNERSHIP_CLAIM` | claim `app/screens/PermissionAccessPanel.tsx` (khối ma trận) + 2 modal trong `app/page.tsx` | ✅ |
| `HOTFIX_START` | thêm `permissionMatrixKeys` (nguồn duy nhất), panel + 2 modal cùng dùng | ✅ |
| `TEST_START` | probe key-set + probe API + test v214 (thêm VỆ 7) | ✅ |
| `TEST_COMPLETE` | panel **77** = payload **77** · **MẤT 0 khoá** · test v214 **7/7** | ✅ |
| `REGRESSION` | cổng `scripts/regression-suite.mjs` **865 pass · 0 fail** · `tsc --noEmit` **exit 0** | ✅ |
| `OWNERSHIP_RELEASE` | đã hoàn tất, ⛔ không giữ lock | ✅ |
| `BLOCKER` | (B) `requireRole(List.of("admin"))` — **quyết định phân quyền**, chờ user | ⏸ |

## EVT-20261008-003 — USER CHỌN PA-1 → thi hành → VERIFY (`save_user_access` hết 403)

| ⭐ | ⭐ |
|---|---|
| **EVT_ID** | EVT-20261008-003 |
| **DATE** | 2026-10-08 11:40:00 → 11:50:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **EVENT** | `DECISION` → `HOTFIX_START` → `HOTFIX_COMPLETE` → `TEST_COMPLETE` → `REGRESSION` → `BLOCKER` |

| Mốc | Việc | Kết quả |
|---|---|---|
| `DECISION` | user chốt **PA-1** + ngữ nghĩa `role=admin` (break-glass) vs ITM (quyền theo cấu hình) | ✅ `DEC-20261008-001` |
| `HOTFIX_START` | rà **3 TẦNG** chặn; sửa ①`ActionRbacRegistry` ②`ACTION_CAPABILITIES` ③`UserManagementUseCase` ④`SystemController` | ✅ |
| — | 📏 **đo từng tầng** qua việc **thông điệp 403 đổi 3 lần** (D-093) | ✅ loại trừ được từng tầng |
| `HOTFIX_COMPLETE` | dừng ĐÚNG PID 18081 → build **fat jar 91 MB** → chạy lại (PID 12420) | ✅ `Started … in 10.783 s` |
| `TEST_COMPLETE` | `probe-permission-save-api.mjs` → B2 **200** · B2b **ghi thật** · B3 **403** | ✅ **EXIT 0** |
| `REGRESSION` | Java **86/86** · cổng FE **865 pass/0 fail** · F-03 **7/7** (sau khi cập nhật hồ sơ số dòng) | ✅ |
| `BLOCKER` 🚨 | **phát hiện CRITICAL**: người có `admin_tab_06` **tự cấp module `admin`** ⇒ gọi được `factory_reset_execute` (XOÁ DỮ LIỆU) | ⏸ `BUG-20261008-002` · `DEC-20261008-002` |
| `OWNERSHIP_RELEASE` | đã hoàn tất phần đã chốt; ⛔ không giữ lock | ✅ |

---

## EVT-20261008-004 — 🚨 CRITICAL ALERT: đường **tự leo thang quyền tới xoá dữ liệu** (hệ quả PA-1)

| ⭐ | ⭐ |
|---|---|
| **EVT_ID** | EVT-20261008-004 |
| **DATE** | 2026-10-08 11:52:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **EVENT** | `BUG_FOUND` (CRITICAL) + `ALERT` |

**Chuỗi**: admin cấp `admin_tab_06` → người đó `save_user_access` (**200** sau PA-1) → **tự cấp module
`admin`** → gọi `factory_reset_execute` (`ActionRbacRegistry:154` = `List.of("admin")`, controller
⛔ không `requireRequireAdmin`) → **XOÁ SẠCH DỮ LIỆU**.

⚠️ Lập luận an toàn CŨ trong mã («tab 12 chỉ hiện với role=admin — `ADMIN_ROLE_ONLY_STEPS`») chỉ bảo vệ
**GIAO DIỆN**, ⛔ không bảo vệ **API**.

⇒ Đã: ghi `BUG-20261008-002` (**CRITICAL**) · `DEC-20261008-002` (3 phương án S-1/S-2/S-3) ·
thêm dòng 9 bảng điều khiển `docs/dsh-mutil-session/SESSION_C/README.md` · **gửi Telegram CRITICAL**.
⛔ **KHÔNG tự thêm guard** — là **chính sách phân quyền**, ⏸ chờ user.

## EVT-20261008-005 — AUDIT XUNG ĐỘT ĐA PHIÊN: `ERP-SESSION-03` sửa ngoài phạm vi (6 tệp nhóm S01)

| ⭐ | ⭐ |
|---|---|
| **EVT_ID** | EVT-20261008-005 |
| **DATE** | 2026-10-08 13:30:00 |
| **SESSION_ID** | ERP-SESSION-01 (SESSION_A) |
| **EVENT** | `AUDIT` → `BLOCKER` (phạm vi) → `HANDOFF` |
| **RELATED** | `HANDOFF-20261008-002` |

### YÊU CẦU USER (nguyên văn)
> «có 1 session đang làm nhầm phân vùng nhiệm vụ của session 1 hãy audit để tránh conflict»

### CÁCH AUDIT (theo §5/§16/§28 — đối chiếu STATE vs ACTUAL CODE)
1. Liệt kê thư mục phiên + `docs/dsh-state/` theo **mtime** ⇒ phát hiện **`SESSION_D` MỚI** và 2 tệp sửa **12:36**.
2. Đọc `SESSION_REGISTRY.md` (bảng §5 + bảng «KHOÁ TỆP»).
3. **Quét marker phiên khác trong mã** (`grep ERP-SESSION-0[234]` trên `app/**`) ⇒ ⭐ **cách phát hiện hiệu quả nhất**.
4. `git status --short` + `git diff --stat` cho vùng S01 ⇒ xác định **ai** đã sửa **tệp nào**.
5. Chạy **2 cổng** (`tsc` + hồi quy) để phân biệt **xung đột MÃ** vs **xung đột PHẠM VI**.

### 📏 KẾT QUẢ ĐO
| Nội dung | Kết quả |
|---|---|
| Thủ phạm | **`ERP-SESSION-03`** |
| Số tệp **ngoài phạm vi** đã sửa | **6** — `lib/workflow-helpers.ts` (⚠️ **hôm nay 12:36**) · `Purchasing.tsx` · `Requests.tsx` · `RequestDrawer.tsx` · `ReceiptDrawer.tsx` · `Delivered.tsx` |
| `app/page.tsx` (S01 LOCK) | ⛔ **CHƯA bị sửa** — diff `20+/10−` **toàn bộ của S01**; ⛔ không có marker SESSION-03 |
| ⚠️ Nguy cơ | Comment S03 ghi «CÙNG LỚP `canAdministerStaff` trong `page.tsx`» — mà hàm đó **có thật** tại **`page.tsx:3235`** ⇒ **sắp** đụng tệp của S01 |
| `tsc --noEmit` | ✅ **EXIT 0** |
| Cổng hồi quy | ✅ **921 test · 920 pass · 0 fail · 1 skip** |
| **Kết luận** | 🔴 **XUNG ĐỘT PHẠM VI** — ⛔ **KHÔNG hỏng mã** ⇒ ⛔ **không cần revert** |
| `ERP-SESSION-04` (`SESSION_D`) | ✅ **SẠCH** — khai báo scope **chỉ `docs/**`**, ghi rõ ⛔ không giữ `app/**`/`lib/**`/`java-backend/**` |
| `SESSION_REGISTRY.md` | ⚠️ **CŨ/THIẾU** — ⛔ chưa đăng ký S03; bảng «KHOÁ TỆP» ⛔ không liệt kê `page.tsx` + 6 tệp trên |

### HÀNH ĐỘNG ĐÃ LÀM
- Ghi **`HANDOFF-20261008-002`** cho S03 (4 yêu cầu: ngừng sửa · ⛔ không đụng `page.tsx` · handoff kèm bằng chứng · đăng ký phiên).
- **Append** mục audit vào **cuối** `docs/dsh-state/SESSION_REGISTRY.md` (§4: ⛔ không ghi đè đoạn của phiên khác).
- ⛔ **KHÔNG revert / ⛔ KHÔNG ghi đè** bản của S03 (luật 19 áp dụng **cả hai chiều**).
- Báo user + Telegram.

## EVT-20261008-006 — BAN GIAO TRANG THAI (§32) + 2 CHU Y PHOI HOP (§37 · §40)

### ⭐ [2026-10-08 15:00 · `ERP-SESSION-01`] BÀN GIAO TRẠNG THÁI (§32) + 2 CHÚ Ý PHỐI HỢP (§37 · §40)

#### A. `ERP-SESSION-01` — ĐÃ THAY ĐỔI GÌ (⭐ 7 tệp nguồn + 1 test, tất cả ĐÃ ĐO)
| Tệp | Nội dung | Trạng thái |
|---|---|---|
| `app/page.tsx` | (A) `permissionMatrixKeys` · **M-2** 3 cổng + gate từng bước quản trị | ✅ VERIFIED |
| `java-backend/application/…/rbac/ActionRbacRegistry.java` | **PA-1**: `save_user_access` → `admin_tab_06` + `canView` | ✅ EXIT 0 |
| `java-backend/application/…/rbac/RbacService.java` | ➕ `canUseModule` (lớp mỏng mở port sẵn có) | ✅ |
| `java-backend/application/…/service/UserManagementUseCase.java` | **PA-1** chốt 3 tầng + **S-1** chặn tự nâng quyền | ✅ EXIT 0 |
| `java-backend/infrastructure/…/worker/EmailOutboxDispatchWorker.java` | **BUG-004** xử lý `Boolean` (MySQL `TINYINT(1)`) | ✅ log 0 lỗi/130s |
| `java-backend/infrastructure/src/test/…/EmailOutboxDispatchWorkerTest.java` | ➕ 2 ca Boolean | ✅ 5/5 |
| `tests/m118-system-admin-menu-gate.test.mjs` | cập nhật theo **Ý ĐỊNH GỐC MỐC 118** (⛔ không nới) | ✅ 3/3 |

**KẾT QUẢ ĐO**: `tsc` EXIT 0 · cổng FE **925 test · 924 pass · 0 fail** · Java **86/86** · E2E **11/11** · cổng UI **6/6 bundle đúng byte**.
**SỰ CỐ**: ✅ ⛔ không có tồn đọng · **DEPENDENCY**: ⏸ chờ `S03` nối UI khi lập dự án (`HANDOFF-20261008-010`).
**NEXT STEP**: bước 1-3 của `HANDOFF-20261008-003` (API kho) — xem §B dưới.

#### B. ⚠️ CHÚ Ý PHỐI HỢP ① — `app/screens/AllocateReturn.tsx` (⛔ §40 DEPENDENCY DISCOVERY)
📏 **ĐO ĐƯỢC**: `git status` cho thấy **`app/screens/AllocateReturn.tsx` ĐANG bị sửa** (cùng nhiều tệp
`app/screens/*` khác) — ⚠️ mà `HANDOFF-20261008-009` giao S01 có phần **modal `allocate`**.
⇒ ⭐ **CHUYỂN TỪ `INDEPENDENT` SANG `COORDINATED`**: S01 giữ `app/page.tsx` (⛔ không đụng
`AllocateReturn.tsx` cho tới khi biết ai giữ) ⇒ nếu modal `allocate` nằm trong tệp đó thì
**S01 ⛔ KHÔNG tự sửa** — ➕ ghi handoff cho phiên đang giữ.

#### C. ⚠️ CHÚ Ý PHỐI HỢP ② — `tools/baseline/*.png` bị ghi đè (§37 GENERATED FILES)
📏 **ĐO ĐƯỢC**: nhiều ảnh chuẩn thị giác (`01-dashboard__desktop.png` · `03-work__desktop.png` ·
`04-team__*.png` …) **đang ở trạng thái đã đổi** — ⭐ nguyên nhân: **các lượt chạy
`node scripts/regression-suite.mjs` CỦA CHÍNH S01** (⚠️ cổng này có sinh/cập nhật ảnh chuẩn).
⭐ **LUẬT ĐỀ NGHỊ CHO MỌI PHIÊN**: chạy cổng hồi quy ⇒ **kiểm `git status -- tools/baseline`** sau đó;
⛔ **KHÔNG** `git checkout` đè (⚠️ có thể là ảnh mới nhất của phiên khác) — nếu commit thì **commit luôn cả ảnh** ✓


---

## CẬP NHẬT 2026-10-08 (chiều→tối) — ERP-SESSION-01`n
| **EVT-20261008-007** | 2026-10-08 | `BUG_FOUND` | CRITICAL: migration V39 (S2) không idempotent ⇒ Flyway FAILED ⇒ BACKEND DOWN (`BUG-20261008-011`) |
| **EVT-20261008-008** | 2026-10-08 | `HOTFIX_COMPLETE` | Khôi phục dịch vụ: đo trước chứng minh CSDL khớp đủ ý định V39 ⇒ sửa 1 dòng lịch sử Flyway ⇒ `Schema up to date` · 0 ERROR |
| **EVT-20261008-009** | 2026-10-08 | `BUG_FOUND` | 2 test Java lỗi vì `schema-h2.sql` thiếu gương `issue_id` (`BUG-20261008-012`) |
| **EVT-20261008-010** | 2026-10-08 | `HOTFIX_COMPLETE` | Thêm 1 dòng gương H2 ⇒ Java 88/88 (0 failure · 0 error) · BUILD SUCCESS |
| **EVT-20261008-011** | 2026-10-08 | `BUG_FOUND` | Họ bug «quyền uỷ nhiệm»: `BUG-005/006/008/009` (FE 13 chỗ · 4 cổng `page.tsx`) |
| **EVT-20261008-012** | 2026-10-08 | `HOTFIX_COMPLETE` | Đóng cả họ: audit FE 13 chỗ + BE 33 hàm + 216 action ⇒ LỆCH THẬT = 0 |
| **EVT-20261008-013** | 2026-10-08 | `VERIFICATION` | HANDOFF-20261007-007 (S2) VERIFIED 2/2: `tsc`=0 + ĐO DOM `wd-staff-save`.disabled = false ⇒ 🟢 |
| **EVT-20261008-014** | 2026-10-08 | `VERIFICATION` | BUG-008 chứng minh ĐỦ 2 CHIỀU (ÂM khoá / DƯƠNG mở) ⇒ probe E2E 15/15 ĐẠT · HẾT finding |
| **EVT-20261008-015** | 2026-10-08 | `DECISION` | RÚT LẠI `DEC-20261008-004` (tôi báo động sai): 33 chốt quyền backend NHẤT QUÁN ⇒ lệch thật = 0 |
| **EVT-20261008-016** | 2026-10-08 | `BUILD` | REBUILD toàn hệ theo yêu cầu user: FE vân tay BB706F1202490077 (6/6 byte) + jar mới · 3 cổng sống · CSDL 12/5/10 |
| **EVT-20261008-017** | 2026-10-08 | `OWNERSHIP_RELEASE` | COMMIT `0119160` (292 tệp) → merge 2 commit của S2 → `defccb1` → PUSH `unity` (8d9c303..defccb1) ✅ |
| **EVT-20261008-018** | 2026-10-08 | `TEST_COMPLETE` | Cổng cuối: FE 955/954 pass · 0 fail · Java 88/88 · tsc 0 · probe 15/15 · CSDL 12/5/10 |

