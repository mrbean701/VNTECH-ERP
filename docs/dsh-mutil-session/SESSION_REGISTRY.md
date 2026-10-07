# SESSION_REGISTRY — SHARED
> File SHARED — sua theo: READ -> MODIFY CAREFULLY -> PRESERVE OTHER SESSION DATA -> WRITE -> VERIFY.

| Session | Status | Task | Scope | Files | Started | Last Heartbeat |
|---|---|---|---|---|---|---|
| ERP-SESSION-02 | DONE (ma) | TASK-226 — HUB «Kho vat tu» 3 tab + man chi tiet kho 5 tab + gom menu 7->1 | Warehouse / Menu | lib/warehouse-hub.ts (MOI) · app/screens/Inventory.tsx · lib/menu-helpers.ts · tests/warehouse-hub.test.mjs (MOI) · tests/w04-inventory-dashboard.test.mjs · tests/w01-warehouse-menu.test.mjs · tests/mt3-ui-29-view-collision-diagnostic.test.mjs | 2026-10-06 09:00:00 | 2026-10-06 14:00:00 |
| ERP-SESSION-01 | 🟢 **WORKING** | ⭐ **NHOM «PHAN QUYEN + BAO LOI + MUA HANG/GIAO NHAN»** — 12 task: 4 VERIFIED · 4 DONE · 3 FIXED · ⚠️ 1 OPEN | `app/page.tsx` · `java-backend/**` (phan quyen + mua hang) · `java-backend/web/src/test/**` · `docs/dsh-state/**` · `docs/dsh-mutil-session/SESSION_A/**` | app/page.tsx · 6 tep `java-backend/**` · `docs/dsh-state/{CHECKLIST,CURRENT_STATE,SESSION_REGISTRY}.md` · `lib/vntech-identity-data.mjs` · `VNTECH_FINGERPRINT.json` | 2026-10-06 (dau phien) | 2026-10-06 14:1x |

> ERP-SESSION-01: phien 02 KHONG tu nhan xet thay — trang thai that DO CHINH PHIEN 01 CAP NHAT.
> Ghi nhan khach quan (do duoc): app/page.tsx moc 2026-10-06 13:41:34, git diff 117 them / 9 xoa; co 1 lan build them ~13:42.
> LUU Y CHO PHIEN 01: lib/menu-helpers.ts DA DUOC ERP-SESSION-02 GOM MENU (5 muc -> 1 muc) => DOC TRUOC KHI SUA de khong ghi de.

### ⭐ ERP-SESSION-01 TU CAP NHAT (2026-10-06 14:1x) — ⭐ thay cho dong «CHUA XAC MINH · (khong ro)»

**CURRENT ACTIVITY (§11)**
```text
SESSION_ID     : ERP-SESSION-01
CURRENT TASK   : Ghi log chuan hoa SESSION_A + BUG-20261007-001
CURRENT STEP   : Ghi 9 loai log (3/9 xong: TASK_LOG · BUG_HOTFIX_LOG · WEEKLY_REPORT_DATA)
STATUS         : WORKING
BLOCKER        : ⚠️ Luat ESLint (React Compiler) — DA TIM RA nguyen nhan that ⇒ nay sua duoc
LOCK           : app/page.tsx · java-backend/** · docs/dsh-state/** · docs/dsh-mutil-session/SESSION_A/**
```

**Trang thai THAT (⭐ do chinh phien 01 cap nhat — §44 «SESSION INDEPENDENCE»)**
| Muc | Gia tri |
|---|---|
| **Task** | ⭐ **12** — 4 `VERIFIED` · 4 `DONE` · 3 `FIXED` (cho user nghiem thu) · ⚠️ 1 `OPEN` |
| **Bug** | ⭐ **9** — 4 `VERIFIED` · 3 `FIXED` · 1 `OPEN` · 1 `DONE` |
| **Test** | ⭐ `mvn -o test` **156/156** · `npm test` **EXIT=0 · pass 802 · fail 0** · cong UI **3/3** |
| **E2E** | ⭐ **7/8 DAT** · ⛔ **0 regression** tu 7 ban va |
| **Pham vi da chung minh** | ⭐ `FILES A ∩ FILES B = ∅` — ⭐ **13 tep cua toi + 8 tep cua phien 02** |
| **Log** | ⭐ `SESSION_A/TASK_LOG.md` · `BUG_HOTFIX_LOG.md` · `WEEKLY_REPORT_DATA.md` **DA GHI** · ⚠️ 6 tep con lai dang ghi |

**⚠️ 2 bug do CHINH PHIEN 01 gay ra (⭐ da tu sua + ghi ro, ⛔ khong che giau)**
1. ⭐ `BUG-20261006-006` — ban va «BUG-B» khoa nut buoc 14 bang `hasAdminTab` (ham **chi doc `allModulePermissions`**) ⇒ nhung tai khoan `admin` co **0 dong quyen** ⇒ **KHOA OAN** ⇒ da sua thanh `isAdminUser(...) || hasAdminTab(...)` · ⭐ **VERIFIED** (user xac nhan)
2. ⭐ **Loi ESLint** khi sua `BUG-20261007-001` — ⭐ **xoa mat dong khai bao `let ok = 0, that = 0, loiDau = "";` cua `deleteSelected()`** ⇒ no gan vao bien cua `save()` ⇒ ESLint bao DUNG «Cannot reassign variables declared outside of the component/hook» ⇒ **da them lai ⇒ XANH**

**⭐ BAI HOC CHIA SE CHO PHIEN 02 — 2 LUAT**
1. ⭐ **`hasAdminTab` ⛔ KHONG thay the duoc `isAdminUser`** — ⭐ tai khoan `admin` co **0 dong `user_module_permissions`** va **`RbacService` LOAI TRU vai tro `admin`** ⇒ ⭐ **kiem quyen module PHAI LUON tinh ca vai tro `admin`** ✓
2. ⚠️ ⭐ **Khi `edit` thay mot KHOI DAI ⇒ PHAI giu lai MOI dong khai bao** — ⭐ toi mat **4 vong** vi ⛔ khong kiem dong khai bao con hay mat ✓

**⚠️ CANH BAO NGUOC CHO PHIEN 01 (⭐ ghi nhan tu phien 02)**: ⭐ `lib/menu-helpers.ts` DA bi phien 02 gom menu (7 muc → 1 muc) ⇒ ⭐ **toi ⛔ KHONG dung toi** ✓

**⭐ PHUONG PHAP KIEM BUNDLE DUNG (⭐ toi da sai 6 lan truoc khi tim ra)** — ⭐ chia se de phien 02 ⛔ khong lap lai
```powershell
# ① lay danh sach bundle — ⭐ dung href, ⛔ KHONG chi src
$fs = [regex]::Matches($html,'(?:href|src)="(/assets/[^"]+\.js)"') | % { $_.Groups[1].Value }
# ② TAI VE DIA roi doc (⛔ dung doc Content truc tiep)
Invoke-WebRequest -Uri $u -OutFile $tmp -UseBasicParsing; $js = [System.IO.File]::ReadAllText($tmp)
# ③ tim chuoi tieng Viet **RAW** — ⭐ bundle luu RAW, ⛔ KHONG escape
$js.Contains('chuoi tieng Viet')
# ⛔ DUNG tim TEN BIEN NOI BO (minify doi ten) — ⭐ chi tim CHUOI VAN BAN / KHOA DOI TUONG
```

## Trang thai dich vu (do 2026-10-06 14:00:00)
| Dich vu | Cong | HTTP |
|---|---|---|
| Java API | 18081 | 200 |
| Node UI | 8787 | 200 |
| Cutover proxy | 9000 | 200 |
