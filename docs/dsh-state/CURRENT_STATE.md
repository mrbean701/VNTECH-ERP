# CURRENT STATE â€” VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1)

> Cáº­p nháº­t: 28/09/2026 Â· nhÃ¡nh `unity-p2-full-20260920`
> ÄÃ¢y lÃ  nguá»“n sá»± tháº­t cho phiÃªn má»›i. Äá»c 4 tá»‡p trong `/docs/dsh-state/` rá»“i tiáº¿p tá»¥c.

## COMMIT / BUILD

| Má»¥c | GiÃ¡ trá»‹ |
|---|---|
| HEAD | `4d1c129` â€” 26/09/2026 Â«[MT2] Chá»‘t MASTER TASK 2 â€” 79/81 = 97,5 %Â» |
| Build hiá»‡n táº¡i | `VNTECH-FP-702F7531E63FB174` â€” 28/09/2026 (tab Â«BÃ¡o lá»—iÂ» + Má»C 14) |
| Files chÆ°a commit | **64** â€” â›” KHÃ”NG commit (goal Â§18) |
| Backup rollback | branch `backup/mt3-head-20260928` (= 7fdf71d) Â· branch `backup/mt3-worktree-20260928` (= 73ff69d) Â· tag `backup-mt3-worktree-20260928` |

## SERVICE â€” khá»Ÿi Ä‘á»™ng ÄÃšNG THá»¨ Tá»°

```
1. Java   :18081  â†  java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081
2. UI     :8787   â†  node scripts/local-server.mjs          (phá»¥c vá»¥ dist/, KHÃ”NG pháº£i mÃ£ nguá»“n)
3. Proxy  :9000   â†  node tools/cutover-proxy.mjs --port 9000 --ui-port 8787 --api-port 18081
```

âš ï¸ **Build báº¯t buá»™c**: `node tools/gd-cycle.mjs "<NHÃƒN>"`
âš ï¸ TrÆ°á»›c khi build: **dá»«ng Ä‘Ãºng PID** cá»§a :8787 vÃ  :9000 (â›” TUYá»†T Äá»I KHÃ”NG `Stop-Process node` â€” giáº¿t DSH runner) + chuyá»ƒn `.local-data` ra ngoÃ i
âš ï¸ Sau khi build: `node tools/set-local-identity.mjs` (Ä‘á»“ng bá»™ vÃ¢n tay SQLite â‡„ SSOT)

## 4 Cá»”NG KIá»‚M â€” Ä‘á»u XANH á»Ÿ láº§n cháº¡y gáº§n nháº¥t

| Cá»•ng | Káº¿t quáº£ |
|---|---|
| `npx tsc --noEmit` | **EXIT=0** |
| `node --import tsx --test tests/*.test.mjs` | **579 test Â· 578 pass Â· 0 fail Â· 1 skip** |
| `npm run test:regression` | **69/69 Â· 0 fail** |
| `npm run verify:css-baseline` | **Äáº T Â· 2694 dÃ²ng Â· 0 lá»›p cháº¿t Â· 0 biáº¿n cháº¿t** |

## API / AUTH â€” Ä‘o tháº­t, KHÃ”NG Ä‘oÃ¡n

| Má»¥c | Káº¿t quáº£ |
|---|---|
| ÄÄƒng nháº­p | `POST /api/system` vá»›i `{action:"login",username,password}` â†’ 200 + cookie `mep_session` |
| â›” KHÃ”NG pháº£i | `/api/auth/login` (404) |
| Äá»c dá»¯ liá»‡u | `GET /api/system` cÃ³ cookie â†’ 200 (~1,37 MB) |
| KhÃ´ng cookie | 401 â€” **Ä‘Ãºng thiáº¿t káº¿**, khÃ´ng pháº£i lá»—i |
| Má»i hÃ nh Ä‘á»™ng | Ä‘i qua 1 dispatcher: `POST /api/system {action, â€¦}` (`app/page.tsx:260` hÃ m `requestApi()`) |

## TÃ€I KHOáº¢N

- `admin` / `Admin123456@`
- `giamdoc.demo` / `Vntech@2026` (tÃ i khoáº£n duyá»‡t, cÃ³ phiáº¿u chá»)

## TUNNEL

- https://riding-witnesses-spas-teaches.trycloudflare.com (HTTP 200)
- âš ï¸ Cloudflare **quick tunnel â‡’ URL Äá»”I Má»–I Láº¦N KHá»žI Äá»˜NG Láº I**
- Lá»‡nh: `cloudflared tunnel --url http://127.0.0.1:9000 --no-autoupdate`

## ACTION THáº¬T trong backend (Ä‘á»c tá»« `ActionRbacRegistry` + `SystemController`)

| Action | Module | Capability |
|---|---|---|
| `create_project` | (rá»—ng) | `canUse` |
| `create_project_team` | `site_command` | `canUse` |
| `save_organization_unit` | (rá»—ng) | `canUse` |
| `save_warehouse_location` | `inventory` | `canEdit` |
| â›” **KHÃ”NG cÃ³** `create_warehouse` | â€” | â€” |

â‡’ **Kho chá»‰ táº¡o Ä‘Æ°á»£c kÃ¨m lÃºc táº¡o dá»± Ã¡n** (`create_project` + cá» `createWarehouse`, xem `page.tsx` L2758-2769)






---

# TRANG THAI HIEN TAI — 29/09/2026 (sau MOC 58)

## HE THONG
```
BUILD            : VNTECH-FP-AF52A0604645C4C5 (giao dien) + JAR moi (co `imageChanged`)
DICH             : :18081 (Java) · :8787 (UI) · :9000 (proxy) — ca 3 DANG CHAY
DANG NHAP        : POST /api/system {action:"login",username,password} -> 200 + cookie `mep_session`
5 CONG           : ✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
                   ❌ contract 4 (pr01) · ❌ regression 3 (pr03)  ← man Quan ly Du an, VON DA DO SAN
CSDL SACH        : error_reports=0 · benefit thu=0 · labor co anh=0 · user_module_permissions tam=0
```

## 20 MOC DA LAM TRONG PHIEN
| Nhom | Moc |
|---|---|
| Quan tri he thong | 39 · 40 · 41 · **42** (Tab 14 Bao loi) · 51 · **53** · **54** · **57** |
| Ho so nhan su | 45 · 45b · **52** · **56** (1·2) · **58-1** · **58-2** |
| Man khac | 43 · 46 · 49 · **55** (Hop dong + anh) · **56-5** · **58-3** · **58-4** · **58-5** |
| Ha tang | 47 · 50 · D-025…D-029 |

```
FAIL: 11 -> 10 -> 9 -> 8 -> 7 -> 4
TAI LIEU: CHECKLIST.md 1.588 dong · DECISIONS.md 1.102 dong (D-027·D-028·D-029)
GIT     : 0 commit · 0 push (theo yeu cau cua user)
```

## ⏳ 4 VIEC CHO USER QUYET — **KHONG BLOCK GOAL**
```
① MOC 48 — nut «Sua tai khoan» tra HTTP 403 voi nguoi co `admin_tab_01`
     (UI cho phep, backend `UserManagementUseCase.java:104` chi nhan ROLE `admin`)
     -> 1 sua backend (⚠️ nguoi do sua duoc vai tro admin cua nguoi khac)
     -> 2 an nut neu khong phai admin          -> 3 tam gac
② Tab «Tong quan» o man Chi tiet Du an: code 5 muc (dang dung) · pr01/pr03 dam 4 muc va
   HAI TEST NHAU CON MAU THUAN nhau
     -> 1 GIU (khuyen nghi, sua test)         -> 2 BO (sua code)
③ bypass `isCompanyLeadership` (D-022) — `BootstrapDataAdapter.java:867,1929`
   COMPANY_LEADERSHIP_ROLE_CODES 6 muc + **`|| "director".equals(roleBase)`**
   3 tai khoan bi anh: thukydemo · hrm (ma chuc danh NHAN SU!) · giamdoc.demo — deu thay 74 module
     -> 1 giu · 2 bo ve `"director".equals(base)` (⭐ chi `hrm` mat bypass) · 3 bo hanh · 4 gac
④ Bat email: can `smtp_host` · `username` · `password` · `sender_email` · `base_url`
   + 2 tang chan them: `notification_config_targets`=0 · `approval_email_recipients`=0
```

## ⛔ 3 BAI HOC DA GHI (DECISIONS.md + memory) — DE KHONG LAP LAI
```
D-025/026 · KHONG verify bang TEN BIEN trong bundle (da minify) + CSS nam file .css rieng
            + 4 tang: tsc · chuoi literal · rule CSS · API that
D-027       · SO TIENG VIET PHAI DO CODEPOINT, khong so bang mat
D-028       · `mvn clean` BAT BUOC tat Java :18081 truoc — nguoc lai JAR CU, test tren CODE CU
D-029       · HTTP 400 RONG = loi ENCODING may test, chua phai logic
```

---

# CAP NHAT 29/09 — MOC 96 → 99 SAU MOC 58 (BUG-01 + QUET D-030)

```
BUILD            : VNTECH-FP-B3ABCB674A9A0C05  (dai hon VNTECH-FP-AF52A0604645C4C5)
DICH             : :18081 · :8787 · :9000 — ca 3 DANG CHAY · login 200
5 CONG           : ✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
                   ❌ contract 4 (pr01) · ❌ regression 3 (pr03)  ← von da do san, KHONG TANG
CSDL SACH        : hr_records 4 (dung 4 ban goc) · labor 2 (anh rong, image_updated_at NULL)
```

## 🐛 BUG-01 (S1) — DA SUA
```
O «Email cong ty» trong modal «Sua ho so»: gui `email` vao `save_hr_record`
nhung bang `hr_records` KHONG co cot `email` ⇒ BI BO QUA AM THAM ⇒ mat du lieu, khong bao loi.
SUA: bo `email` khoi `save_hr_record` · o Email chi dung duoc khi co quyen `update_user`
     (luu vao `users.email`) · khong co quyen ⇒ KHOA o + ghi chu · hien thi tu `row.email`.
⇒ KHONG tao cot moi · KHONG sua Java · KHONG build lai backend.
```

## 🔎 D-030 — DA QUET DU 4 VONG, 6 MODAL
| Modal / action | Bang dich | Ket qua |
|---|---|---|
| BenefitsScreen -> `save_benefit_record` | `benefit_records` | ✅ 7/7 |
| LaborScreen -> `save_labor_contract` | `labor_contracts` | ✅ 7/7 |
| HrProfileEditModal -> `save_hr_record` | `hr_records` | ⛔ 13/14 (email) → DA SUA |
| `save_user_access` | `user_module_permissions` + `user_project_scopes` | ✅ chuan |
| HrProfileEditModal -> `update_user` | `users` | ✅ 5/5 |
| HrScreen -> `save_hr_record` / `create_user` | `hr_records` + `users` | ✅ 13/13 |
⇒ **CHI 1 loi `IgnoredField` duy nhat — da sua + kiem chung hoi quy.**

## ⛔ LUU Y PHA M VI
```
`app/page.tsx` co 159 `name="..."` nhung trai tren NHIEU bang ⇒ D-030 ap dung cho
modal 1 BANG. Quet tiep chi nen lam khi tao MOI modal, khong quet lai toan he thong.
```

## ⏳ VAN 4 VIEC CHO USER QUYET (KHONG BLOCK GOAL) — khong doi
```
① MOC 48 (xac nhan o dong code L207: `rbac.requireRole(..., List.of("admin"))`)
② Tab «Tong quan» · ③ bypass D-022 · ④ Bat email
```

---

# CAP NHAT LAN CUOI 29/09 — MOC 101 (BUG-02) · BUILD MOI NHAT

```
BUILD            : VNTECH-FP-B01C5D788932F083   ⬅ MOI NHAT (dung build nay)
DICH             : :18081 · :8787 · :9000 — ca 3 DANG CHAY · login 200
5 CONG           : ✅ css-comment-guard · ✅ tsc EXIT=0 · ✅ css-baseline DAT
                   ❌ contract 4 (pr01) · ❌ regression 3 (pr03)  ← von da do san
CSDL SACH        : hr_records 4 · labor 2 (anh rong, image_updated_at NULL) · error_reports 0
```

## 🐛 BUG-02 (S1) — DA SUA (MOC 101)
```
Trieu chung: modal «Sua ho so` mo khoa 4 truong cho nguoi co `admin_tab_01`
⇒ `save_hr_record` GHI XONG → moi goi `update_user` → `UserManagementUseCase:103-104`
  (`rbac.requireRole(..., List.of("admin"))`) tra **HTTP 403** ⇒ tuong mat du lieu.
SUA: `canEditAccount` = `role === "admin"` (bo ve `admin_tab_01`) · khoa 4 o
     (Ma NV · Ten dang nhap · Phong/bộ phan · Email) + ghi chu · sua them 1 dong
     tieng Viet sai dau.
⇒ KHONG sua Java · KHONG tao cot moi · KHONG doi nghiep vu.
⇒ DA KIEM CHUNG TRONG BUNDLE: 4/4 chuoi dac trung co mat trong dist/client/assets/*.js
```

## 🔎 D-031 — RBAC FAIL-CLOSED (KHONG LO)
```
`SystemController:224-225` chan MOI action (tru PUBLIC_ACTIONS) qua `requireActionModule`.
`RbacService.requireActionModule`: action chua khai module ⇒ **throw 403** (mac dinh tu choi).
4 action HR da khai dung trong `ActionRbacRegistry.java`:
  save_hr_record→dept_legal_hr · save_labor_contract / set_labor_contract_status→dept_legal_labor
  · save_benefit_record→dept_legal_benefits
⛔ CHI doc code — CHUA co phep thu tang 4 voi user that (thieu mat khau tai khoan
   khong phai admin). Xem muc ⑤ trong danh sach cho USER QUYET.
```

## ⏳ VAN 5 VIEC CHO USER QUYET (KHONG BLOCK GOAL)
```
① MOC 48 · ② Tab «Tong quan» · ③ bypass D-022 · ④ SMTP
⑤ (tuỳ chọn) mat khau 1 tai khoan thuong → de chay 4 action HR bang user THAT
```
