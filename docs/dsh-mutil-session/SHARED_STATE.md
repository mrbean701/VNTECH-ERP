# SHARED_STATE — SHARED
> File SHARED — KHONG overwrite ca file.

## Build hien hanh
| Muc | Gia tri |
|---|---|
| Nhan chu ky | TASK-226 HUB KHO VAT TU - 3 TAB + GOM MENU 7->1 |
| Migration identity | drizzle/0329_phase_gd_task_226_hub_kho_vat_tu_3_tab_gom_menu_7_identity.sql |
| SOURCE fingerprint | VNTECH-FP-121300BEED7174E4 (source: 716 files) |
| GD_EXIT | 0 · PREFLIGHT DAT · FINGERPRINT DAT · ARTIFACT DAT |
| Asset CSS dang phuc vu | /assets/index-BjTKD8Zf.css |
| Moc dist/client/assets | 2026-10-06 13:30:58 (build phien 02) · 2026-10-06 13:41:59 (build phien 01) |

## Canh bao dang mo
1. Cong anh KHONG DAT 68/68 — anh chuan tools/baseline/ CU 5 NGAY (01/10 16:53:14). CHUA chay --update (CO Y — tranh che loi). Can user quyet dinh. (BUG-20261006-005)
2. app/page.tsx dang do ERP-SESSION-01 giu => phien khac KHONG sua.
3. lib/menu-helpers.ts DA bi ERP-SESSION-02 sua (gom menu 7->1) => DOC TRUOC KHI SUA.

## Dang giu (LOCK)
| Session | Giu | Tu |
|---|---|---|
| ERP-SESSION-02 | lib/warehouse-hub.ts · app/screens/Inventory.tsx · lib/menu-helpers.ts · tests/warehouse-hub.test.mjs · tests/w04-inventory-dashboard.test.mjs · tests/w01-warehouse-menu.test.mjs · tests/mt3-ui-29-view-collision-diagnostic.test.mjs | 2026-10-06 09:00:00 |
| ERP-SESSION-01 | app/page.tsx · cac tep java-backend/ | (khong ro) |

## Du lieu that (do tren payload song)
warehouses 12 · inventory 1.185 dong ton · issues 29 · receipts 36 · returns 6 · projects 5 · userScopes 28.
TEN TRUONG THAT (dung bia): warehouses[] = id · code · name · type · projectId · parentWarehouseId —
KHONG co warehouseName/warehouseCode/warehouseType (nhung receipts[] CO warehouseName).
issues[]/returns[]/receipts[] KHONG co warehouseId => KHONG loc duoc phieu theo kho (xem BUG-004).

## 📌 Tệp bản đồ ánh xạ (đọc trước khi ghi)
⭐ **`docs/dsh-state/00_GOAL_S4_MAPPING.md`** — ánh xạ Goal §4 ⇄ state thực có + bảng «ai ghi gì»
⇒ dùng để ⛔ **không tạo tệp trùng** và ⛔ **không ghi sai chỗ**.
(Tạo bởi `ERP-SESSION-02` ngày 2026-10-06 — tệp MỚI, ⛔ không sửa tệp nào của phiên khác.)

## 📚 Danh mục log chuẩn hiện có (đo 2026-10-06 14:15)
| Phiên | 9 loại log | Ghi chú |
|---|---|---|
| `SESSION_A` (ERP-SESSION-01) | ✅ đủ 9/9 | template — ⛔ **chờ phiên 01 tự ghi**, phiên 02 ⛔ không điền thay |
| `SESSION_B` (ERP-SESSION-02) | ✅ đủ 9/9 | **dữ liệu THẬT** — EVENT 10 sự kiện · TASK 1 · DEV 3 · CHANGE 6 · TEST 6 · BUG 5 · DECISION 5 · HANDOFF 2 · WEEKLY WEEK 2026-W41 |
| SHARED | ✅ 3 tệp | `SESSION_REGISTRY` · `SHARED_STATE` · `SHARED_TODO` |
| `README.md` | ✅ | quy ước + mục 9 «tệp liên quan cần đọc trước khi ghi» |
| `weekly-reports/` | ✅ sẵn sàng | ⛔ chưa tạo báo cáo tuần nào (⛔ chờ user yêu cầu — Goal §20) |
