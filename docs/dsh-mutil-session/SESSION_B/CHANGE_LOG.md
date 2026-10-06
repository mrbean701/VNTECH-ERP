# CHANGE_LOG — SESSION_B (ERP-SESSION-02)

## CHG-20261006-001
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: UI | Module: Warehouse
Before: Menu nhom KHO co 7 muc roi (Kho · Nhap · Xuat · Dieu chuyen · Dashboard ton kho · Cap phat & hoan tra) — nhieu cua vao CUNG chuc nang.
After: 1 muc «Kho vat tu» mo thang HUB (dashboard ton kho + 3 tab). Muc «Cap phat & hoan tra» gop vao hub.
Reason: Yeu cau user «click vao menu se hien thi luon ra man dashboard ton kho» + 3 tab; 7 muc roi la THUA.
Files: lib/menu-helpers.ts · tests/w01-warehouse-menu.test.mjs · tests/mt3-ui-29-view-collision-diagnostic.test.mjs
Impact: Menu gon hon; KHONG mat chuc nang (6 khoa cu VAN SONG cho quyen/tieu de/tim kiem/nhanh render).
Compatibility: Khong doi API · khong migration · khong khoa module moi.
Test: TEST-20261006-005 | Status: DONE

## CHG-20261006-002
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: UI | Module: Warehouse
Before: Inventory.tsx la man 4 tab; moi khoi noi dung (bang ton kho, canh bao, phieu dieu chuyen, danh sach xuat...) hien o MOI tab.
After: HUB 3 TAB (KHO · XUAT & NHAP · CAP PHAT & HOAN TRA); moi khoi thuoc DUNG 1 tab; tab KHO co dashboard ton kho + cards kho.
Reason: Yeu cau user ve tabbar 3 tab + dashboard ngay dau man.
Files: app/screens/Inventory.tsx · lib/warehouse-hub.ts · tests/w04-inventory-dashboard.test.mjs
Impact: 10/10 khoi dung 1 tab · tab mac dinh = KHO · khong mat khoi nao.
Compatibility: Hop dong test w04 duoc CAP NHAT (khong noi cong — khang dinh con MANH HON).
Test: TEST-20261006-001..003 | Status: DONE

## CHG-20261006-003
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: UI | Module: Warehouse
Before: Bam card kho => MODAL chi tiet (khong co nut quay lai, khong chia tab).
After: MAN CHI TIET KHO (early-return) — nut «Quay lai man KHO» + 5 tab: Dashboard kho · Ton kho · Xuat - Nhap · Cap phat - Hoan tra · Nhan su.
Reason: Yeu cau user «click vao se hien thi ra man thong tin chi tiet cua kho (co nut quay lai man KHO)... 5 tab».
Files: app/screens/Inventory.tsx · lib/warehouse-hub.ts
Impact: Modal cu DA XOA (khong con ma chet — xoa co KIEM BIEN 3 DIEM).
Compatibility: Khong doi route · khong doi API.
Test: TEST-20261006-004 | Status: DONE

## CHG-20261006-004
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: Bugfix | Module: Warehouse
Before: 4 loi co san — card kho hien UUID · tim/sap xep kho KHONG chay · xuat Excel cot Ma/Ten kho RONG · «So phieu xuat» LUON = 0.
After: Card hien TEN KHO; tim/sap xep/Excel chay dung; BO chi so SAI «So phieu xuat».
Reason: Inventory.tsx doc w.warehouseName/warehouseCode/warehouseType KHONG ton tai trong payload; va loc issues[] theo warehouseId KHONG co truong do.
Files: app/screens/Inventory.tsx
Impact: Het thong tin SAI tren man kho. Xem BUG-20261006-001..004.
Test: TEST-20261006-002 | Status: DONE

## CHG-20261006-005
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: Migration | Module: DevOps
Before: chua co migration cho chu ky GD nay.
After: drizzle/0329_phase_gd_task_226_hub_kho_vat_tu_3_tab_gom_menu_7_identity.sql (do node tools/gd-cycle.mjs sinh).
Reason: Quy trinh du an — moi chu ky GD phai tao migration moi + refresh fingerprint.
Files: drizzle/0329_*_identity.sql · VNTECH_FINGERPRINT.json
Impact: FINGERPRINT DAT VNTECH-FP-121300BEED7174E4 · BUILT ARTIFACT VALIDATION DAT.
Compatibility: Khong doi schema nghiep vu (chi identity).
Test: TEST-20261006-004 | Status: DONE

## CHG-20261006-006
Date: 2026-10-06 | Session: ERP-SESSION-02 | Type: Documentation | Module: Coordination State
Before: Goal §4 liet ke 7 ten tep coordination (CURRENT_STATE · GO_LIVE_CHECKLIST · BUG_TRACKING · HOTFIX_HISTORY ·
MULTI_SESSION_STATE · SESSION_REGISTRY · SESSION_HANDOFF) nhung repo chi co 2 ten khop; 5 ten con lai KHONG ton tai
du da co tep TUONG DUONG (CHECKLIST 7.452d · DECISIONS 2.492d · TASK_HISTORY 1.262d · + lop log moi dsh-mutil-session/).
After: Tao MOI docs/dsh-state/00_GOAL_S4_MAPPING.md (49 dong) — BAN DO ANH XA Goal §4 <=> cau truc state THUC CO,
kem phan vai 3 thu muc (dsh-state / dsh-mutil-session / agent-progress) va bang «ai ghi gi» de tranh ghi trung.
Reason: Goal §4 dan ro «da co cau truc tuong duong thi PHAI dung cau truc hien tai, KHONG tao he thong state thu hai»
=> KHONG tao 5 tep trung lap (tranh state conflict + checklist corruption — Goal §2), ma ghi ban do anh xa.
Files: docs/dsh-state/00_GOAL_S4_MAPPING.md (MOI)
Impact: Nguoi/phien sau TIM DUNG noi luu tung loai du lieu; KHONG co tep trung lap; KHONG dung cham tep cua phien khac.
Compatibility: Tep MOI — KHONG sua/ghi de bat ky tep nao khac trong docs/dsh-state/.
Test: N/A (tai lieu) | Status: DONE
