# DEV_LOG — SESSION_B (ERP-SESSION-02)

## DEV-20261006-001
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: Warehouse | Area: Frontend (khoi logic dung chung)
Development: Tao khoi THUAN lib/warehouse-hub.ts (~233 dong) — khong JSX, khong import UI => test duoc bang Node.
Technical Approach: Tach toan bo logic kho ra khoi component => (a) test bang node --import tsx --test, (b) khong phinh file man hinh, (c) tai dung cho ca hub lan man chi tiet.
Implementation: WAREHOUSE_HUB_TABS (3 tab) · WAREHOUSE_DETAIL_TABS (5 tab) · OUT_IN_SUBTABS · ALLOCATE_RETURN_SUBTABS · SEE_ALL_WAREHOUSE_ROLES=[director,admin] · canSeeAllWarehouses() · warehouseCards() · visibleWarehouseCards() · myProjectIds() · defaultOutInSubtab() · defaultAllocateReturnSubtab() · totalsForWarehouse() · inventoryRowsOfWarehouse().
Dependencies: KHONG them thu vien · KHONG API moi · KHONG migration.
Shared Components: dung lai ListToolbar · DataTable · StatusBadge · Kpi · CardHead tu lib/ui-shared (Goal §17 REUSE).
API: POST /api/system {action:"login"} roi GET /api/system.
Database: chi DOC — khong doi schema.
RBAC: ngoai le director (Ban Lanh dao) + admin (+ IT = admin, vi he thong KHONG co role it) => xem TAT CA kho; thao tac van theo quyen module.
Workflow: tab mac dinh cua subtab chon theo quyen user.
Result: tsc EXIT=0 · 22/22 test khoi thuan.

## DEV-20261006-002
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: Warehouse | Area: Frontend (man hinh)
Development: Viet lai app/screens/Inventory.tsx thanh HUB 3 TAB + them MAN CHI TIET KHO (thay modal cu).
Technical Approach: tabbar ngoai 3 tab; man chi tiet la early-return if (openWarehouseId) { ... } => la MAN, KHONG phai modal.
Implementation: data-vntech cho moi khoi (warehouse-cards · warehouse-detail-screen · warehouse-detail-back · wd-dashboard · wd-inventory · wd-io · wd-allocate-return · wd-staff) => DO DUOC phan bo tab.
Result: 10/10 khoi noi dung thuoc DUNG 1 tab (KHO=5 · XUAT&NHAP=3 · CAP PHAT=2) — truoc day moi khoi hien o MOI tab.

## DEV-20261006-003
Date: 2026-10-06 | Session: ERP-SESSION-02 | Module: Menu (Warehouse) | Area: Frontend (khai bao menu)
Development: GOM 7 muc -> 1 muc «Kho vat tu» trong lib/menu-helpers.ts.
Technical Approach: muc duy nhat { key:"warehouse_hub", label:"Kho vat tu", moduleKey:"inventory", permissionKeys:[6 khoa kho cu] } · allocateReturnMenuItems -> rong. app/page.tsx:506/523 dung menu tu CHINH 2 mang => KHONG phai sua app/page.tsx.
API: khong co API menu (menu la KHAI BAO TRONG CODE).
RBAC: gom CA 6 khoa kho DA CO => van 0 khoa module moi, khong dong module_catalog.
Result: do lai — label "Kho vat tu" = 1 lan · muc cu = 0 lan · het va cham view voi nhom «Cong viec».
