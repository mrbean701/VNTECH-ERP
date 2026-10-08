# TASK_LOG — SESSION_B (ERP-SESSION-02)

## TASK-20261006-226 — (BAN CU - DA THAY THE, xem muc TASK-20261006-226 o duoi)
> Ban nay ghi Status: DONE TRUOC KHI nghiem thu that => SAI theo Goal §22/§24.
> GIU LAI lam vet (⛔ khong xoa - luat NO_LOG_DELETION) nhung ⛔ KHONG dung lam trang thai hien tai.

Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: Warehouse | Feature: Kho vat tu
Task: TASK-226 — HUB «KHO VAT TU» (3 tab) + man chi tiet kho (5 tab) + GOM MENU 7->1
Objective: (1) Click menu => dashboard ton kho + tabbar 3 tab (KHO · XUAT & NHAP · CAP PHAT & HOAN TRA).
(2) Tab KHO: card kho Ten·Ma·Du an·Ton hien tai; kho DU AN chi hien voi thanh vien du an; ngoai le BAN GIAM DOC/ADMIN/IT xem tat ca.
(3) Click card => MAN CHI TIET KHO co nut quay lai + 5 tab. (4) Tab XUAT&NHAP + CAP PHAT&HOAN TRA: subtab theo quyen + danh sach + nut CRUD/tim/sap xep/loc.
(5) GOM 7 muc menu -> 1 muc «Kho vat tu» (user chot).
Priority: HIGH | Status: DONE | Start: 2026-10-06 09:00:00 | End: 2026-10-06 13:30:58
Implementation Summary: Tao khoi THUAN lib/warehouse-hub.ts; viet lai app/screens/Inventory.tsx thanh HUB 3 TAB + them MAN CHI TIET KHO (early-return) — xoa modal cu; gom menu trong lib/menu-helpers.ts. KHONG sua app/page.tsx (menu dung tu chinh 2 mang) => tranh xung dot da phien.
Files Changed: lib/warehouse-hub.ts (MOI) · tests/warehouse-hub.test.mjs (MOI) · app/screens/Inventory.tsx (SUA 254->~500d) · tests/w04-inventory-dashboard.test.mjs (SUA) · lib/menu-helpers.ts (SUA) · tests/w01-warehouse-menu.test.mjs (SUA) · tests/mt3-ui-29-view-collision-diagnostic.test.mjs (SUA) · docs/agent-progress/TASK-226.md (MOI 564d) · drizzle/0329_*_identity.sql (gd-cycle sinh)
Result: 6/6 yeu cau user hoan thanh + 4 bug co san da sua. Da BUILD (GD_EXIT=0), dang phuc vu ban moi.
Test Reference: TEST-20261006-001..005
Remaining: Khong con phan ma. Cho user nghiem thu + cho phep COMMIT.
Next Action: User test tren :9000 => neu dat thi commit + dong phien (TASK-226 -> VERIFIED).

## TASK-20261006-226
DATE: 2026-10-06 | SESSION_ID: ERP-SESSION-02 | MODULE: Kho vat tu | FEATURE: Hub 3 tab + man chi tiet 5 tab + gom menu 7->1
OBJECTIVE: «Trong MENU KHO VAT TU, click vao menu hien luon man dashboard ton kho; ngay tren dau hien tabbar
  KHO · XUAT & NHAP · CAP PHAT & HOAN TRA; click card kho => man chi tiet kho co nut quay lai + 5 tab.»
PRIORITY: HIGH | STATUS: **VERIFIED** | START: 2026-10-06 09:00 | END: 2026-10-06 10:40
IMPLEMENTATION_SUMMARY: `lib/warehouse-hub.ts` (khoi THUAN, 233 dong) · `app/screens/Inventory.tsx`
  (hub 3 tab + man chi tiet 5 tab) · `lib/menu-helpers.ts` (gom 7 muc -> 1 muc «Kho vat tu»).
FILES_CHANGED: lib/warehouse-hub.ts · app/screens/Inventory.tsx · lib/menu-helpers.ts · tests/warehouse-hub.test.mjs
RESULT: **PASS 100%** (TEST-20261006-020) — do that tren :9000: manInventory=TRUE · tabbar dung 3 tab ·
  12 cards kho du 4 thong tin · man chi tiet dung 5 tab · nut quay lai hoat dong.
TEST_REFERENCE: TEST-20261006-014 -> 020 · `tests/warehouse-hub.test.mjs` 22/22
REMAINING: ⛔ khong con (task da VERIFIED)
NEXT_ACTION: S01 commit ban sua `moduleKey` (HANDOFF-20261006-004) de khong mat.

## TASK-20261006-227
DATE: 2026-10-06 | SESSION_ID: ERP-SESSION-02 | MODULE: Danh muc vat tu | FEATURE: Cau truc 3 tab
OBJECTIVE: «Tab danh sach vat tu dang trong treo qua nhieu thong tin => bo bot, chi con danh sach + nhom nut
  CRUD search sort filter. Doi ten tab nhom con -> Danh muc nhom vat tu. Bo tab Ma vat tu goc.
  Them tab Danh muc he vat tu (danh sach he + CRUD search sort filter).»
PRIORITY: HIGH | STATUS: **VERIFIED** | START: 2026-10-06 09:50 | END: 2026-10-06 10:20
IMPLEMENTATION_SUMMARY: Tao `app/screens/MaterialCategoryList.tsx` (116 dong) cho tab he vat tu; sua
  `MATERIAL_TABS`; xoa khoi «CONG CU CHAN LOAN» (8 dong); them `open` cho 2 `<details data-tab>`.
FILES_CHANGED: app/screens/MaterialCategoryList.tsx (MOI) · app/page.tsx
RESULT: **PASS** (TEST-018 · TEST-019) — 3 tab dung ten · tab 0 sach · tab he 8 cot/17 dong ·
  nut Xoa disable dung quy tac nghiep vu.
TEST_REFERENCE: TEST-20261006-017 -> 019
REMAINING: cho user quyet cho dat 2 cong cu BOQ / soat trung alias
NEXT_ACTION: cho user tra loi (a) tab rieng · (b) man khac · (c) bo han

## TASK-20261007-228
DATE: 2026-10-07 | SESSION_ID: ERP-SESSION-02 | MODULE: Kho vat tu (hub) | FEATURE: Don gon tab KHO
OBJECTIVE: «snapshoot lai hub Kho vat tu di, toi nhin thay no sap xep qua lon xon» (user 07/10).
PRIORITY: HIGH | STATUS: **VERIFIED** | START: 2026-10-07 09:30 | END: 2026-10-07 11:10
IMPLEMENTATION_SUMMARY: Bo 3 khoi TRUNG LAP (hang 3 KPI · danh sach kho thu 2 «Gia tri ton kho theo kho» ·
  dai tab la «TON KHO | CHUYEN KHO | THE KHO») + bo 2 nhan «Pham vi du an» trung; CHUYEN 2 nut
  «⇄ Chuyen kho» / «▤ The kho» vao toolbar (⛔ khong xoa chuc nang).
FILES_CHANGED: app/screens/Inventory.tsx (6 them / 10 xoa)
RESULT: **PASS** — tab «KHO» **6.202px → 4.949px**; nghiem thu chuc nang: bo loc du an CON tac dung
  (KPI 1.235→0) · nut «Chuyen kho» mo panel · bo loc «Kho» CON · 2 tab kia SACH.
TEST_REFERENCE: TEST-20261007-022 · TEST-20261007-024 · TEST-20261007-025 · CHG-20261007-002 · DEV-20261007-005
REMAINING: ⛔ khong con
NEXT_ACTION: — (xong; chu user nghiem thu)

## TASK-20261007-229
DATE: 2026-10-07 | SESSION_ID: ERP-SESSION-02 | MODULE: Danh muc vat tu + Kho vat tu | FEATURE: 2 quyet dinh cua user
OBJECTIVE: User chot 07/10: (2) **(c) BO HAN** 2 cong cu «So sanh/Doi chieu BOQ» + «Soat trung alias» ·
  (3) **(b) THU 2 khoi «giai thich»** trong tab KHO vao nut **«?»** canh tieu de ·
  (1) **(cho phep) chup lai anh chuan**.
PRIORITY: HIGH | STATUS: **VERIFIED** | START: 2026-10-07 11:30 | END: 2026-10-07 12:30
IMPLEMENTATION_SUMMARY: (2) xoa ham MaterialMatchingWorkspace (28 dong, da kiem mo coi) ·
  (3) them useState + state showHelp + nut «Giai thich chi so» qua DUNG khuon CardHead
  (action: string + onClick) + boc 2 khoi bang {showHelp && (<>…</>)} ·
  (1) chay probe-visual-regression --update.
FILES_CHANGED: app/page.tsx (xoa 28 dong) · app/screens/WarehouseDashboard.tsx (10 them / 1 xoa) · tools/baseline/*.png (68 anh)
RESULT: **PASS** — E2E that tren :9000: conSoSanhBOQ=false · conSoatTrungAlias=false ·
  nut «Giai thich chi so →» co · 2 khoi AN mac dinh (tab KHO **4.052px**) · bam ⇒ HIEN (4.949px) · bam lai ⇒ AN.
  Anh chuan: **60 anh duy nhat** (truoc 5).
TEST_REFERENCE: TEST-20261007-026 · CHG-20261007-003 · DEV-20261007-006
REMAINING: ⚠️ **3 man VAN chup SAI MAN** khi chup anh chuan (nav that bai — BUG-006) — xem TEST-20261007-026.
NEXT_ACTION: Sua SCREENS[].steps cho 11/16/19 roi chup lai 3 man do.

---

## 📊 CÁCH ĐẾM TASK (theo LUẬT CÓ SẴN trong repo — ⛔ không tự đặt)
> ⚠️ Ghi 07/10/2026 sau khi user hỏi «đang đếm task theo luật nào vậy» ⇒ **em nhận ra mình CHƯA theo luật này**.

**Luật thật — `AGENTS.md` dòng 78–86 (bắt buộc trong MỌI báo cáo Telegram):**

```text
Tiến độ task: <done/total task>          ← task trong ĐỢT LÀM HIỆN TẠI
Tiến độ master task: <DONE/tổng 110> (%) ← đọc thẳng từ docs/agent-progress/MASTER_STATUS.md
```

- **110 mục** = MASTER TASK (`docs/28_DANH_SACH_110_MUC_MASTER_TASK.md`), nguồn sự thật là cột TT của
  `docs/25_TODO_ROADMAP.md`, **đo bằng** `node tools/probe-roadmap-progress.mjs` (⛔ không tự đặt tiêu chí «xong»).
- Số hiện tại (07/10/2026): **DONE 108/110 = 98,2 %** (MASTER_STATUS §«TIẾN ĐỘ SO VỚI MASTER TASK»).
- Nhật ký mỗi task = **1 tệp** `docs/agent-progress/TASK-NNN.md`; mục lục ở `TASK_INDEX.md`.

**⚠️ THỰC TẾ EM ĐÃ LÀM (⛔ KHÔNG khớp luật trên):**

| Việc | Luật | Em đã làm |
|---|---|---|
| Báo cáo Telegram | phải có 2 dòng tiến độ | ⛔ **THIẾU** — chỉ có khuôn GOAL `[ERP GO-LIVE][ERP-SESSION-02]` + mã BUG/TEST/EVT |
| Nhật ký task | `docs/agent-progress/TASK-NNN.md` | ⛔ **KHÔNG tạo** cho TASK-227/228/229 (chỉ có `TASK-226.md` do phiên trước) |
| Ánh xạ 110 mục | phải ánh xạ mục master | ⛔ **KHÔNG làm** — TASK-227/228/229 là yêu cầu trực tiếp của user, ⛔ chưa gắn vào mục nào |
| Số `TASK-2xx` | — | ⛔ em **đánh tuần tự** 226→227→228→229, chỉ ghi vào `docs/dsh-mutil-session/SESSION_B/` |
| `Round 49/256` | — | chỉ là **bộ đếm vòng lặp goal**, ⛔ **không phải** tiến độ task |

**⇒ VIỆC CẦN LÀM ĐỂ ĐÚNG LUẬT (chờ user quyết):**

1. Tạo `docs/agent-progress/TASK-227.md` · `TASK-228.md` · `TASK-229.md` (nhật ký thật).
2. Ghi 3 task đó vào `TASK_INDEX.md` (kèm trạng thái VERIFIED).
3. Thêm 2 dòng tiến độ vào **mọi** báo cáo Telegram về sau.
4. Xác định 3 task này có ánh xạ vào **mục nào trong 110** không (nếu không ⇒ ghi rõ là «ngoài 110 mục»).

## ⭐⭐ TASK-231 — CARD KHO CAO ĐỀU + DỌN LABEL JARGON — **DONE** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **TASK_ID** | ⭐ `TASK-231` (⭐ `ERP-SESSION-02` ✓) |
| **DATE / START / END** | ⭐ 2026-10-08 · ⭐ bắt đầu sau `TASK-230` · ⭐ kết thúc khi `TEST-037`+`TEST-038` **PASS** ✅ |
| **MODULE / FEATURE** | ⭐ Hub «Kho vật tư» — ⭐ **DASHBOARD TỒN KHO** (card) + ⭐ **dọn nhãn giao diện** ✓ |
| **OBJECTIVE (⭐ nguyên văn user)** | ⭐⭐ «*sửa lại dashboard tồn kho các card đang ở trạng thái **kích thước khác nhau** và **hiển thị không đồng đều**, ngoài ra hãy **loại bỏ các đoạn label thừa** đi*» ⭐⭐ ✓ |
| **PRIORITY** | ⭐ **UI IMPROVEMENT** (⭐ §21 mục 7 ✓) |
| ⭐ **IMPLEMENTATION_SUMMARY** | ⭐ ① ⭐ **ĐO TRƯỚC** ⇒ ⭐ `chieuCao {202:2, 222:10}` ⭐⭐ **lệch 20px** ⭐⭐ ⚠️ · ⭐ nguyên nhân: ⭐ 2 thẻ thiếu dòng «Dự án:» (kho `transit` ⛔ không thuộc dự án ✓)<br>⭐ ② ⭐ **FIX** `globals.css` ⭐ **+`min-height:222px`** ⭐ ⇒ ⭐ **ĐO SAU `{222:12}` — lệch 0px** ✅<br>⭐ ③ ⭐ **QUÉT TỰ ĐỘNG** 7 màn (3 tab hub + 4 tab chi tiết) ⇒ ⭐ tìm **19 đoạn jargon** ⇒ ⭐ **xoá/reword 18**, ⭐ **giữ 2** (⭐ có bằng chứng mã ⛔ không được xoá ✓) ✅ |
| **FILES_CHANGED** | ⭐ `app/globals.css` (+`min-height`) · ⭐ `app/screens/WarehouseDashboard.tsx` · ⭐ `app/screens/Inventory.tsx` ✓ |
| **RESULT** | ⭐⭐ **card lệch 0px** + ⭐⭐⭐ **3 màn SẠCH jargon `[]`** ⭐⭐⭐ ✅ |
| **TEST_REFERENCE** | ⭐ `TEST-20261007-037` · `TEST-20261007-038` ⭐ (⭐ `CHG-20261007-008` ✓) ✓ |
| **REMAINING** | ⭐ 2 đoạn «đối chứng nguồn» ⏳ **chờ user quyết** (⛔ xoá sẽ ĐỎ `W-04`) ✓ |
| **NEXT_ACTION** | ⭐ Chờ user 4 việc (⭐ force-push · commit · `DEC-011` · 2 đoạn nguồn ✓) ✓ |

## ⭐ TASK-232 — BỎ 2 CỘT «DỮ LIỆU CHẾT» Ở «DANH MỤC NHÓM VẬT TƯ» — **DONE** ⭐
| ⭐ | ⭐ |
|---|---|
| **TASK_ID / DATE / SESSION** | ⭐ `TASK-232` · ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` ✓ |
| **MODULE / FEATURE** | ⭐ Danh mục vật tư → tab «Danh mục nhóm vật tư» ✓ |
| ⭐⭐ **OBJECTIVE (⭐ user hỏi rồi chốt)** | ⭐ User hỏi «*tại sao lại có trường **Ý kiến điều chỉnh** và **trạng thái đã duyệt/đề xuất***» ⭐ ⇒ ⭐ tra mã ⇒ phát hiện **dữ liệu chết** ⚠️ ⇒ ⭐ user chốt ⭐⭐ **«C»** ⭐⭐ ⭐ + ⭐ nêu **lý do nghiệp vụ**: «*khi cấu hình nhóm con thì kế toán đã kiểm tra rất kỹ rồi và ⛔ không cần ai duyệt bởi vì chỉ là đưa nhóm con từ **file excel** của công ty đang sử dụng lên hệ thống*» ✓ |
| **PRIORITY / STATUS** | ⭐ **UI IMPROVEMENT** (§21 mục 7) · ⭐⭐ **DONE** ⭐⭐ ✅ |
| ⭐ **IMPLEMENTATION_SUMMARY** | ⭐ **4 chỗ** trong `app/page.tsx`: ⭐ ① BỎ `<th>Ý kiến điều chỉnh</th>` ⭐ ② ô «Trạng thái» ⇒ ⭐ chỉ `Number(active)===0?"Đã ẩn":"Đang dùng"` (⭐ bỏ nhánh `review_status` ✓) ⭐ ③ BỎ KPI «Chờ duyệt» ⭐ ④ nhãn lọc «Đang dùng / đề xuất» ⇒ «Đang dùng» ✅ |
| 🔒 **GIỮ NGUYÊN** | ⭐ ⛔ **KHÔNG xoá dữ liệu** ⚠️ — ⭐ 2 cột CSDL `review_status` + `adjustment_note` **vẫn còn**, ⭐ chỉ ⛔ không hiển thị ✅ |
| **FILES_CHANGED** | ⭐ `app/page.tsx` ✓ |
| **RESULT** | ⭐⭐ **header 8 cột** (⭐ trước 9 ✓) ⭐ 4 chuỗi jargon **`false`** ⭐ dòng hiện **«Đang dùng»** ✅ |
| **TEST_REFERENCE** | ⭐ `TEST-20261007-042` ⭐ (`CHG-20261008-012` · `BUG-20261008-020` · `DEC-20261008-012` ✓) ✓ |
| **NEXT_ACTION** | ⭐ Chờ user điền quy tắc 4 chức năng kho ✓ |

## ⭐ TASK-233 — AUDIT «CỘT DỮ LIỆU CHẾT» TOÀN MÀN «DANH MỤC VẬT TƯ» — **DONE** ⭐
| ⭐ | ⭐ |
|---|---|
| **TASK_ID / DATE / SESSION** | ⭐ `TASK-233` · ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` ✓ |
| **MODULE / FEATURE** | ⭐ Danh mục vật tư — **cả 3 tab** ✓ |
| ⭐⭐ **OBJECTIVE** | ⭐ **Tự đi tìm cùng loại lỗi** user vừa phát hiện ⭐ — ⭐ câu hỏi: *còn cột nào «hiển thị nhưng ⛔ không ai ghi được»?* ⭐ ⭐ (⭐ theo bài học §33 ✓) ✓ |
| **PRIORITY / STATUS** | ⭐ **UI IMPROVEMENT / AUDIT** · ⭐⭐ **DONE** ⭐⭐ ✅ |
| ⭐⭐ **IMPLEMENTATION_SUMMARY** | ⭐ Phương pháp: ⭐ ① liệt kê **cột hiển thị** ⭐ ② liệt kê **ô nhập** ⭐ ③ **đối chiếu** ⇒ cột nào ⛔ không có ô nhập ⇒ nghi dữ liệu chết ✅<br>⭐ **Kết quả 3 tab**: ⭐ ① Danh sách vật tư ⇒ ⭐ **10/10 cột có ô nhập** ⇒ ⛔ **không có cột chết** ✅ ⭐ ② Danh mục nhóm vật tư ⇒ ⚠️ **có 2 cột chết** (⭐ đã sửa ở `TASK-232` ✓) ⭐ ③ Danh mục hệ vật tư ⇒ 5 trường CSDL có thật ✅<br>⭐⭐ **KẾT LUẬN: toàn màn CHỈ có ĐÚNG 1 ca — ĐÃ SỬA XONG** ⭐⭐ ✅ |
| ⚠️ **PHẠM VI** | ⭐ **CHỈ 3 tab màn «Danh mục vật tư»** ⚠️ ⭐ — ⛔ **KHÔNG suy rộng** ✓ |
| **FILES_CHANGED** | ⭐ ⛔ **không đổi mã** (⭐ audit thuần ✓) ✓ |
| **TEST_REFERENCE** | ⭐ `TEST-20261007-043` · ⭐ `TEST-20261007-044` ✓ |

## ⭐⭐ TASK-235 — MODAL «TẠO/SỬA KHO» (component dùng chung cho S01) — **DONE** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **TASK_ID / DATE / SESSION** | ⭐ `TASK-235` · ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` ✓ |
| **MODULE / FEATURE** | ⭐ Kho vật tư → Tạo/Sửa kho ✓ |
| **OBJECTIVE** | ⭐ ⭐⭐ **GỠ CHỐT §17** ⭐⭐ — ⭐ nút «＋ Tạo kho»/«✎ Sửa» đang **TẠM KHOÁ** vì `page.tsx` ⛔ không có modal `warehouse` ⚠️ ⭐ và `page.tsx` thuộc **S01** ⇒ ⭐ phiên 02 dựng **component dùng chung** để S01 chỉ cần nối ✅ |
| **PRIORITY / STATUS** | ⭐ **UI IMPROVEMENT** (§21 mục 7) · ⭐⭐ **DONE** ⭐⭐ ✅ |
| **IMPLEMENTATION_SUMMARY** | ⭐ `app/screens/WarehouseFormModal.tsx` ⭐ — ⭐ `BaseModal` ⭐ từ `@/lib/ui-blocks` ⭐ + ⭐ 3 ô (⭐ Dự án · Mã kho tự sinh `KD-xxx` · Tên kho tự đặt `KHO <dự án>` ✓) ⭐ + ⭐ kiểm bằng `validateWarehouseCode(currentCode)` + `validateProjectWarehouseName` ⭐ + ⭐ cờ `canEdit`/`canEditCode` ⭐ + ⛔ **không có xoá kho** ✅ |
| **FILES_CHANGED** | ⭐ `app/screens/WarehouseFormModal.tsx` (⭐ mới ✓) ⭐ + ⭐ `tests/task-235-warehouse-form-modal.test.mjs` (⭐ mới ✓) ✓ |
| **RESULT** | ⭐ test **6/6 PASS** ✅ ⭐ **`901 · 900 pass · 0 fail`** ✅ ⭐ `tsc=0` · ⭐ lint **0 errors** ✅ |
| **TEST_REFERENCE** | ⭐ `TEST-20261007-047` ⭐ (`CHG-20261008-014` ✓) ✓ |
| **REMAINING / NEXT_ACTION** | ⭐ ⏳ **S01**: ⭐ thêm case `modal === "warehouse"` ⭐ + ⭐ API `save_warehouse` ⭐ ⇒ ⭐ **sau đó phiên 02 BẬT 4 nút** ✅ |

## ⭐⭐ TASK-237 — QUY TẮC ③ «DỰ ÁN NGỪNG ⇒ HỎI NGỪNG KHO» — **DONE** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **TASK_ID / DATE / SESSION** | ⭐ `TASK-237` · ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` ✓ |
| **MODULE / FEATURE** | ⭐ Kho vật tư → Ẩn / Ngừng hoạt động (⭐ thay cho xoá ✓) ✓ |
| **OBJECTIVE** | ⭐ **Hoàn tất phần LOGIC cuối cùng của 4 quy tắc kho** ⭐ — ⭐ quy tắc ③: ⛔ **không xoá** ⭐ + ⭐ **liên kết dự án** ⭐ ⇒ ⭐ **hỏi user khi dự án ngừng** ✅ |
| **PRIORITY / STATUS** | ⭐ **UI IMPROVEMENT** (§21 mục 7) · ⭐⭐ **DONE** ⭐⭐ ✅ |
| **IMPLEMENTATION_SUMMARY** | ⭐ `projectDeactivationPrompt(project, warehouses)` ⭐ — ⭐ trả ⭐ `{ shouldAsk, warehouses, message }` ⭐ (**⛔ không side-effect** ✓) ⭐ + ⭐ `ALLOW_DELETE_WAREHOUSE = false` ⭐ + ⭐ 2 hành động `hide`/`deactivate` + nhãn tiếng Việt ✅ |
| **FILES_CHANGED** | ⭐ `lib/warehouse-hub.ts` ⭐ + ⭐ `tests/task-237-project-deactivation.test.mjs` (⭐ mới ✓) ✓ |
| **RESULT** | ⭐ test **7/7 PASS** ✅ ⭐ **`915 · 914 pass · 0 fail`** ✅ ⭐ `tsc=0` · lint **0 errors** ✅ |
| **TEST_REFERENCE** | ⭐ `TEST-20261008-049` ⭐ (`CHG-20261008-016` ✓) ✓ |
| **NEXT_ACTION** | ⭐ ⏳ **S03**: nối vào màn «Ngừng dự án» ⭐ + ⭐ **S01**: API đổi trạng thái kho ✅ |

## ⭐⭐ TASK-243 — GỠ CHỐT QUY TẮC ④: NỐI «GIỮ CHỖ» CHO **PHIẾU XUẤT** — **ĐANG LÀM** ⭐⭐
| ⭐ | ⭐ |
|---|---|
| **TASK_ID / DATE / SESSION** | ⭐ `TASK-243` · ⭐ 2026-10-08 · ⭐ `ERP-SESSION-02` ⭐ (⚠️ **user đã CHO PHÉP sửa backend** ✓) ✓ |
| **MODULE / FEATURE** | ⭐ Kho vật tư → Cấp phát / Xuất kho — ⭐ **quy tắc ④** ✓ |
| ⭐⭐⭐ **CHẨN ĐOÁN ĐÃ XONG (⭐ đo từ mã)** | ⭐ ⭐⭐ **JAVA ĐÃ CÓ SẴN HẠ TẦNG — ⛔ không phải viết mới** ⭐⭐ ✅<br>· ⭐ `StockLedgerEngine.availability(...)` ⭐ ⇒ ⭐ `available = Math.max(0, physical − reserved)` ⭐ (`domain/service/StockLedgerEngine.java:24-30` ✓) ⭐ ⭐ **≡ `availableToIssue()` của phiên 02** ✅<br>· ⭐ `StockLedgerEngine.validateIssue(av, qty)` ⭐ ⇒ ⭐ «*if (qty > av.available() + 1e-9)*» ⭐ (`:34` ✓) ⭐ ⭐ **≡ `validateIssueQuantity()` của phiên 02** ✅<br>· ⭐ `RequestStore.createStockReservations(requestId, warehouseId, userId, now)` ⭐ ⇒ ⭐ `INSERT INTO stock_reservations` ⭐ (`RequestStoreAdapter.java:**420-426**` ✓) ✅<br>· ⭐ `StockManagementUseCase.**issueStock()**` (`:53`) ⭐ ⭐⭐ **ĐÃ GỌI** ⭐ `availability()` + `validateIssue()` ⭐ (`:**106-108**` ✓) ⭐ ⇒ ⭐ **backend ĐÃ CHẶN xuất quá `available`** ✅ |
| ⭐⭐⭐ **LỖ HỔNG CÒN LẠI (⭐ chính là quy tắc ④ user chốt)** | ⭐ `grep createStockReservations` ⭐ ⇒ ⭐ **CHỈ 1 CHỖ GỌI** ⚠️: ⭐ `RequestManagementUseCase.java:**820**` ⭐ = ⭐ **phiếu ĐỀ NGHỊ** *(request)* ⚠️ ⭐ ⭐⇒ ⭐⛔ **PHIẾU XUẤT ⛔ KHÔNG tạo reservation** ⚠️ ⭐ ⭐ **HỆ QUẢ**: ⭐ khi phiếu xuất ở **draft / chờ duyệt** ⚠️ ⭐ số lượng đó **⛔ không được giữ chỗ** ⇒ ⭐ **2 phiếu xuất cùng chờ duyệt VẪN xuất quá được** ⚠️ ⭐ ⭐⭐ **⇒ ĐÚNG LỖ HỔNG USER MÔ TẢ**: ⭐ «*Trong thời gian **tạo phiếu hoặc chờ duyệt** thì số lượng vật tư trong phiếu đó ở trong **trạng thái đang xử lý***» ✅ |
| ⭐⭐ **VIỆC CẦN LÀM (⭐ đã xác định rõ)** | ⭐ ① ⭐ **Khi TẠO phiếu xuất** ⭐ (`issueStock`, `StockManagementUseCase:53`) ⭐ ⇒ ⭐ **TẠO reservation** ⭐ ⚠️<br>⭐ ② ⭐ **Khi phiếu HOÀN THÀNH** ⭐ (`issueStockConfirm :229` / `confirmStockIssue :276`) ⭐ ⇒ ⭐ **RELEASE reservation** ⭐ (⭐ vì đã **trừ tồn THẬT** ✓) ⭐ ⚠️ nếu ⛔ không release ⇒ ⭐ **giữ chỗ 2 lần** ⚠️<br>⭐ ③ ⭐ **Kiểm `stock_reservations` có cột trỏ được phiếu XUẤT không** ⚠️ ⭐ — ⭐ hiện gắn `request_id` + `request_item_id` ⚠️ ⭐ ⇒ ⭐ nếu phiếu xuất ⛔ không có `request_id` thì phải **thêm cột** *(migration V39 — ⭐ `§19` tên theo phiên ✓)* ⚠️ ✅ |
| ⚠️ **RỦI RO** | ⭐ **CAO** ⚠️ — ⭐ chạm ⭐ **logic tồn kho** ⭐ ⇒ ⭐ `available` thay đổi sẽ ảnh hưởng ⭐ **phiếu đề nghị + mua hàng** *(cũng đọc `reserved`)* ⚠️ ⭐ ⭐ ⇒ ⭐ **BẮT BUỘC chạy hồi quy toàn bộ** ✅ |
| **STATUS** | ⭐⭐ **IN_PROGRESS — ⏳ chẩn đoán XONG, chưa sửa mã** ⭐⭐ |

### ⭐ CẬP NHẬT `TASK-243` — **BƯỚC ③ XONG** *(hạ tầng đã sẵn sàng)*
| ⭐ | ⭐ |
|---|---|
| ⭐⭐ **BƯỚC ③ — XONG** | ⭐ Thêm cột ⭐ **`issue_id`** ⭐ + index qua ⭐ **migration `V39`** ⭐ ⭐ **đã áp vào CSDL dev** ⭐ ⇒ ⭐ **`stock_reservations` giờ trỏ được CẢ phiếu ĐỀ NGHỊ (`request_id`) LẪN phiếu XUẤT (`issue_id`)** ✅ ⭐ ⭐ **⇒ HẠ TẦNG ĐÃ SẴN SÀNG** ✅ |
| ⏳ **BƯỚC ① — CHƯA LÀM** | ⭐ Khi ⭐ **TẠO phiếu xuất** ⭐ (`StockManagementUseCase.**issueStock:53**`) ⭐ ⇒ ⭐ **TẠO reservation** ⭐ ⚠️ ⭐ cần: ⭐ thêm hàm ⭐ `createIssueReservations(issueId, …)` ⭐ ở ⭐ `RequestStore` + `RequestStoreAdapter` ⭐ (⭐ ⛔ không dùng lại `createStockReservations` vì nó gắn `request_id` ⚠️) ✅ |
| ⏳ **BƯỚC ② — CHƯA LÀM** | ⭐ Khi phiếu ⭐ **HOÀN THÀNH** ⭐ (`issueStockConfirm:**229**` / `confirmStockIssue:**276**`) ⭐ ⇒ ⭐ **RELEASE reservation** ⭐ (⭐ `status='released'` + `released_at` ✓) ⚠️ ⭐ ⭐ **⛔ nếu KHÔNG release ⇒ GIỮ CHỖ 2 LẦN** ⇒ ⭐ `available` bị trừ oan ⇒ ⛔ chặn xuất sai ⚠️ ✅ |
| ⚠️ **RỦI RO CÒN LẠI** | ⭐ **CAO** ⚠️ — ⭐ 3 tệp Java ⭐ (`RequestStore` interface · `RequestStoreAdapter` · `StockManagementUseCase`) ⚠️ ⭐ + ⭐ `available` đổi sẽ ảnh hưởng ⭐ **phiếu đề nghị + mua hàng** ⚠️ ⭐ ⇒ ⭐ **BẮT BUỘC hồi quy toàn bộ + kiểm tồn kho sau** ✅ |

### ⭐⭐⭐ CẬP NHẬT `TASK-243` — **KẾ HOẠCH JAVA CHÍNH XÁC (⭐ đã đo đủ, ⛔ chưa viết mã)** ⭐⭐⭐

> ⚠️ **Trạng thái thật**: hạ tầng DB **XONG** (`V39` — cột `issue_id` + index, đã áp). ⛔ **Phần Java CHƯA viết.**

#### ⭐ VÒNG ĐỜI PHIẾU XUẤT (⭐ đo từ mã)
```
issueStock        (StockManagementUseCase.java:53)   → status 'draft'    ⛔ KHÔNG tạo giữ chỗ   ← (1) CẦN THÊM
approveStockIssue (…:185)                            → 'approved'
issueStockConfirm (…:229)  yêu cầu 'approved'        → 'issued'
confirmStockIssue (…:276)  yêu cầu 'issued'          → 'completed'       ⭐ ĐỔI TỒN KHO THẬT   ← (2) CẦN NHẢ
```
⭐ **MẪU CÓ SẴN**: `releaseReservationsForRequest` được gọi ở `StockManagementUseCase.java:**153**` ✅

#### ⭐ 3 TỆP CẦN SỬA (⭐ đã biết CHÍNH XÁC từng chỗ)
| # | Tệp | Thêm gì |
|---|---|---|
| ① | `application/port/out/**WarehouseStockStore.java**` | 2 hàm: ⭐ `createIssueReservations(String issueId, String warehouseId, String userId, Instant now)` ⭐ + ⭐ `releaseReservationsForIssue(String issueId, Instant now)` ⭐ — ⭐ chèn sau `releaseReservationsForRequest` (`:37`) ✅ |
| ② | `infrastructure/persistence/**WarehouseStockStoreAdapter.java**` | Cài 2 hàm trên, ⭐ **theo đúng mẫu `RequestStoreAdapter:420`** ⭐ (`@Transactional` + `INSERT INTO stock_reservations (id,project_id,warehouse_id,material_id,request_id,request_item_id,**issue_id**,quantity,status,reserved_at,released_at,created_by,created_at,updated_at)`) ⚠️ ⭐ `request_id`/`request_item_id` = **NULL** ⭐ ⚠️ ⭐ `issue_id` = **id phiếu xuất** ✅ · ⭐ RELEASE = `UPDATE … SET status='released',released_at=?,updated_at=? WHERE issue_id=? AND status='active'` ⭐ (⭐ **theo mẫu `releaseReservationsForRequest` ở adapter `:171`** ✓) ✅ |
| ③ | `application/service/**StockManagementUseCase.java**` | ⭐ Gọi ① ở `issueStock` **sau** `store.insertStockIssue(...)` ⚠️ + ⭐ Gọi ② ở `confirmStockIssue` **sau** `store.confirmStockIssue(...)` ⭐ (⭐ lúc đó `status='completed'` — ⭐ **tồn đã trừ thật** ⇒ ⭐ nhả giữ chỗ ✓) ✅ |

#### ⭐ CÁC CỘT ĐÃ ĐO ĐƯỢC (⭐ ⛔ không phải suy đoán)
```
stock_reservations  : id · project_id · warehouse_id · material_id · request_id · request_item_id
                      ⭐ issue_id (MỚI — V39) · quantity · status · reserved_at · released_at · created_by · created_at · updated_at
stock_issue_items   : id · issue_id · material_id · request_item_id · quantity · installed_qty · …
stock_issues.project_id  ⭐ CẦN LẤY cho reservation (⭐ nguồn: `stock_issues` theo `issueId` ✓)
stock_issues.status thật  : completed(7) · posted(13) · approved(6) · pending_cht(5) · grn_created(2)
```

#### ⚠️ 2 ĐIỀU KIỆN BẮT BUỘC TRƯỚC KHI COI LÀ XONG
1. ⭐ **Build lại Java backend + restart `:18081`** ⚠️ *(⛔ không có bước này thì ⛔ mã mới không chạy)*
2. ⭐ **Kiểm tồn kho THẬT sau** ⭐: ⭐ ví dụ user — ⭐ tạo 2 phiếu xuất cùng vật tư **cùng chờ duyệt** ⭐ ⇒ ⭐ phiếu 2 **phải bị chặn** nếu vượt `available` ⭐ ⭐ + ⭐ khi phiếu 1 `completed` ⇒ ⭐ giữ chỗ **phải nhả** (⭐ ⛔ không nhả 2 lần ✓) ✅

#### ⚠️ RỦI RO (⭐ ⛔ chưa xử lý)
⭐ **CAO** — ⭐ `available` đổi sẽ ảnh hưởng ⭐ **phiếu đề nghị + mua hàng** *(cũng đọc `reserved`)* ⚠️ ⭐ ⇒ ⭐ **BẮT BUỘC hồi quy toàn bộ + kiểm tồn kho** ✅ ⭐ ⭐ **⇒ ⛔ KHÔNG viết vội khi chưa đủ ngân sách kiểm chứng** ⭐ ✅
