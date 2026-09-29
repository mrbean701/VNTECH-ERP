// USER 28/09/2026 — viết DECISIONS.md + TASK_HISTORY.md (bộ state /docs/dsh-state/ của goal §3).
import { writeFileSync } from "node:fs";
const W = (n, c) => { writeFileSync("docs/dsh-state/" + n, c, "utf8"); console.log("  OK docs/dsh-state/" + n + " · " + c.split("\n").length + " dong"); };

W("DECISIONS.md", `# DECISIONS — VNTECH ERP V5.3.0

> Quyet dinh ky thuat da chot. KHONG tu doi nghiep vu quan trong thay user.

## D-001 · Endpoint dang nhap
\`POST /api/system\` voi \`{action:"login",…}\` → 200 + cookie \`mep_session\`.
KHONG phai \`/api/auth/login\` (tra 404).
*Lý do:* moi hanh dong di qua mot dispatcher duy nhat (\`app/page.tsx:260\`, ham \`requestApi()\`).

## D-002 · Dong bo van tay sau moi build
Luon chay \`node tools/set-local-identity.mjs\`.
*Lý do:* \`scripts/local-runtime.mjs:177\` TU CHOI khoi dong neu
\`vntech_product_identity.source_fingerprint\` trong \`.local-data/warehouse.sqlite\`
khac SSOT \`lib/vntech-identity-data.mjs\`.

## D-003 · Toolbar 2 tang
\`.list-toolbar{flex-direction:column}\` (label tren) +
\`.list-toolbar-controls{row / nowrap / overflow-x:auto}\` (nut ngang, tran thi cuon).
*Lý do:* ep ca \`.list-toolbar\` nam ngang khien o «Tim» chen vao giua tieu de va mo ta — user da bao.

## D-004 · An nhan filter bang CSS, KHONG xoa khoi DOM
\`.list-toolbar … > span{display:none!important}\`.
*Lý do:* giu \`title\` tooltip va ban do/kiem duyet van dung; khong mat khac nang truy vet.

## D-005 · 4 the du an = danh sach tong hop da du an
Bo khoa \`disabled={index>0 && !detailId}\`; render \`ProjectAggregateTabs\` TRUOC chot \`if (!detail)\`.
*Lý do:* user yeu cau «lay danh sach tong hop tren cac du an», khong can bam «Chi tiet» truoc.

## D-006 · \`{entityModal}\` phai render o MOI nhanh
*Lý do:* nhanh \`tab >= 1\` return som, thieu modal ⇒ nut «Chi tiet» bam khong lam gi.

## D-007 ·Sua hop dong test khi user DOI yeu cau
3 tep \`pr01/pr02/pr03\` da cap nhat theo yeu cau moi (bo 1 filter · bo 1 tab · bo khoa)
**va them \`assert.doesNotMatch\`** de rang buoc lan sau.
Day la SUA HOP DONG THEO YEU CAU, KHONG phai sua de «lam xanh test».

---

# CHO USER QUYET · Nut «TAO KHO»

**Cau hoi:** nut Tao o the **Kho** nen lam gi?

**Vi sao can quyet:** doc ma that ⇒ **khong ton tai action tao kho doc lap**.
- \`ActionRbacRegistry\` chi co \`save_warehouse_location\` (sua vi tri kho, \`canEdit\`) — KHONG co \`create_warehouse\`.
- \`page.tsx\` L2758-2769 (modal «Them du an»): kho **chi tao kem** luc tao du an (\`create_project\` + co \`createWarehouse\`).
- Quan he Du an : Kho = \`1:N\`; \`warehouses.project_id\` cho phep \`NULL\` ⇒ du an khong co kho la hop le.

| # | Phuong an | He qua |
|---|---|---|
| **①** | Nut «Tao kho» mo modal «Them du an» | khong them action moi · ten nut lech chuc nang |
| ② | Them action moi \`create_warehouse\` o may chu | **can duyet nghiep vu**: ai cap quyen, kho gan du an nao, co can duyet khong |
| **③** | Bo nut Tao kho, chi giu Tao o Du an / To doi / Ban chi huy | thieu 1 nut so voi yeu cau |

**Khuyen nghi:** ③ hoac ①. Phuong an ② la THEM NGHIEP VU MOI, nam ngoai pham vi request hien tai.

**Ghi chu:** quyet dinh nay **KHONG chan** 3 nut kia ⇒ trien khai 3 nut truoc, hoi phan Kho sau.
`OUT-OF-SCOPE`: neu chon ② thì ghi vao \`CHECKLIST.md\` lam viec rieng.

---

# BAI HOC DA GHI NHAN TRONG PHIEN NAY
- KHONG \`String.replace(chuoi ngan)\` — no sua CHO XUAT HIEN DAU TIEN. Dung ANCHOR DAI DUY NHAT va DO LAI sau khi sua.
- CSS KHONG co ghi chu \`//\` (chi \`/* */\`) — dung \`//\` lam postcss bo qua ca khoi; build van "thanh cong" nhung thay doi khong vao bundle. **DA MAC LOI NAY 2 LAN.**
- Tu kiem phai copy **NGUYEN VAN** dieu kien trong tep test; tu dat lai ky vong theo cai minh vua viet ⇒ bao DAT SAI.
- Script sua hang loat ABORT giua chung ⇒ cac sua "da bao OK" truoc do **chua bao gio duoc ghi** ⇒ phai kiem lai bang grep.
- \`textContext\` gom ca phan tu da \`display:none\` ⇒ phai do bang \`getBoundingClientRect\`.
- Sidebar la ACCORDION ⇒ phai mo nhom cha TRUOC khi bam muc con.
- \`dist/\` phuc vu ban da build, KHONG phai ma nguon ⇒ sua xong phai \`gd-cycle\`.
- \`node -e\` voi tieng Viet trong PowerShell ⇒ vo escape ⇒ viet \`.mjs\` roi \`node\` chay.
- Regex trong JSX canh escape dau \`{\` 2 lan ⇒ doc nguyen van tu tep truoc khi sua test.
`);

W("TASK_HISTORY.md", `# TASK HISTORY — VNTECH ERP V5.3.0

> Ghi nguoc. Xem \`CURRENT_STATE.md\` de biet dang lam gi.

## 28/09/2026

### TH-001 · Rollback ve MT2
- **Yeu cau:** «quay lai 4d1c129, phan mem loi rat nhieu khong the tiep tuc fix, phai quay ve phan ban MT2 lam lai tu dau»
- **STATUS:** DONE
- **Hoan thanh:** sao luu truoc khi xoa (\`backup/mt3-head-20260928\`, \`backup/mt3-worktree-20260928\`, tag) → \`git reset --hard 4d1c129\` → **build lai ca Java + giao dien** (\`dist/\` va \`web/target/*.jar\` khong nam trong git) → \`set-local-identity.mjs\` → khoi dong lai 3 service
- **Bai hoc:** \`git reset\` mot minh **khong du** — phai build lai + dong bo van tay.

### TH-002 · Toolbar + tab + binh luan + 3 khung
- **STATUS:** DONE — do that
- **Ket qua:** toolbar 11 class nam ngang · tab 6 class theo mau quan tri · \`NAV-CHILD = 0\` ca 11 nhom · \`.row-actions\` x112 → 0 · khung binh luan xuong duoi label · 3 khung 786/786/786 · label tren toolbar 2 tang · an nhan filter (7 span / 0 hien thi)

### TH-003 · Man Danh sach du an
- **STATUS:** DONE — do that
- **Ket qua:** tieu de rut 230→90 ky tu · bo filter «Phong ban» · bo tab «Tong quan» (con 5 tab)
- **Hop dong:** sua \`pr01\` / \`pr02\` / \`pr03\` theo yeu cau moi + them \`assert.doesNotMatch\`

### TH-004 · 4 the danh sach tong hop da du an
- **STATUS:** DONE (code) — CHUA DO DUOC KHI CHAY
- **Hoan thanh:** tao \`app/screens/ProjectAggregateTabs.tsx\` (Nhan su gom tu \`userScopes\` · To doi chi du an hoat dong · Kho loc kho hoat dong mac dinh + nut bat/tat · BCH tu \`organizationUnits\` loai \`site_command\`) · bo khoa 4 the · them \`{entityModal}\` · doi ten nut ve «Chi tiet»
- **Files:** \`app/screens/ProjectAggregateTabs.tsx\` (moi) · \`app/page.tsx\` · 3 tep test
- **Con lai:** probe dieu huong sidebar khong on dinh ⇒ **can user xac nhan bang mat**

### TH-005 · 4 nut TAO (Du an · To doi · Kho · Ban chi huy)
- **STATUS:** IN PROGRESS
- **Da dieu tra:** action that \`create_project\` · \`create_project_team\` (module \`site_command\`, \`canUse\`) · \`save_organization_unit\` (\`unitType:"site_command"\`) · **khong co** action tao kho
- **Blocker:** nut «Tao Kho» — xem \`DECISIONS.md\` D-008

### TH-006 · Bo state \`/docs/dsh-state/\`
- **STATUS:** DONE
- **Files:** \`CHECKLIST.md\` · \`CURRENT_STATE.md\` · \`DECISIONS.md\` · \`TASK_HISTORY.md\`

---

## LOI TOI TU GAY RA (de session sau khong lap lai)
| # | Loi | Sua |
|---|---|---|
| 1 | Ghi chu \`//\` trong CSS (2 lan) ⇒ postcss bo qua khoi, build "thanh cong" nhung khong vao bundle | dung \`/* */\` + kiem luat co trong bundle |
| 2 | \`String.replace\` chuoi ngan ⇒ sua nham cho | ANCHOR dai duy nhat + do lai |
| 3 | Tu kiem bang ky vong do toi tu sua ⇒ bao DAT SAI | copy nguyen van dieu kien trong test |
| 4 | Script ABORT giua chung ⇒ sua "OK" chua duoc ghi | grep xac nhan truoc khi bao xong |
| 5 | Do bang \`textContent\` ⇒ thay ca phan tu da an | do bang \`getBoundingClientRect\` |
| 6 | So khop chuoi nhieu dong bang \`\\n\` ⇒ hong voi CRLF | regex \`\\r?\\n\` hoac doc nguyen van truoc |
| 7 | \`CardHead.action\` nhan \`string\` khong nhan node | chuyen nut ra khoi prop |
| 8 | Sua regex thanh \`data={{data}}\` ⇒ sai, JSX la \`data={data}\` | hoan tac |
| 9 | \`node -e\` voi tieng Viet trong PowerShell ⇒ vo escape | viet \`.mjs\` roi \`node\` chay |
| 10 | Regex trong JSX canh escape \`{\` 2 lan | doc nguyen van tu tep truoc khi sua test |
`);
console.log("  OK hoan tat bo state");
