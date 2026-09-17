# TASK-050 — 4 KHOÁ BOOTSTRAP THIẾU: bốn màn hình sẽ RỖNG sau cutover (lỗi PORT đường ĐỌC)

**Trạng thái:** **ĐÃ XÁC NHẬN (hai phía) — CHƯA port mã.** Hồ sơ này là bản đặc tả để port trong một lượt.
**Nguồn:** cổng mới `tools/probe-bootstrap-keys.mjs` (#77) → xác nhận lần lượt ở #78, #79, #80
**Ngày:** 17/09/2026

---

## 1. Bằng chứng hai phía (đã kiểm chứng, không suy đoán)

| Khoá | JS trả | Java trả | Màn hình bị ảnh hưởng |
|---|---|---|---|
| `centralInventory` | ✓ `scripts/system-route.mjs:621` — CTE `movements` trên `stock_movements` lọc kho `WH-CENTRAL` → `materials` + `balances` | **✗ KHÔNG** (`grep` toàn bộ `*.java`: **0 lần** xuất hiện) | **Tồn Kho Tổng** |
| `centralReturns` | ✓ `:727` (có trong object `result`) | **✗ KHÔNG** — chỉ có `ProjectAdminStoreAdapter:90` `out.put("open_central_return", COUNT…` (**đếm cho close-check**, không phải danh sách) | **Trả hàng về Kho Tổng** |
| `constructionDailyLogItems` | ✓ `:659` — `SELECT i.* FROM construction_daily_log_items i JOIN construction_daily_logs l …` theo dự án | **✗ KHÔNG** — Java **có** trả `constructionDailyLogs` (`BootstrapDataAdapter:1018`) nhưng **không có câu `FROM construction_daily_log_items` nào** trong tầng persistence | **Dòng công việc của Nhật ký thi công** |
| `companyAvailability` | ✓ `:712` — CTE `movements` → `balances` → `res` (`stock_reservations` trạng thái `active`) → `onHand`/`reserved`/`available` theo từng kho | **✗ KHÔNG** (0 lần trong `*.java`) | **Khả dụng toàn công ty** |

**Kết luận phân loại:** JS trả **đủ cả 4**; Java **không trả khoá nào** ⇒ **lỗi port của Java**, **không phải** lỗ hổng chung của hai bản. Các action **GHI** tương ứng **đã port** — đây đúng là lớp lỗi *"port GHI mà quên port ĐỌC"* đã gặp **9 lần** trước đó.

## 2. ⚠️ Bắt buộc port KÈM BỘ LỌC QUYỀN (nếu không sẽ rò rỉ dữ liệu kho)

JS **xoá trắng** các khoá này theo vai trò/module **sau khi** dựng `result`:
* `:622` — vai trò `warehouse` với phạm vi kho `site` ⇒ `centralInventory = []`, `centralReturns = []`;
* `:732` — nếu tài khoản **không có module** trong `["warehouse_receipt","warehouse_issue","inventory","stocktake","central_warehouse","material_catalog"]` ⇒ xoá `inventory`, `contractStockLedger`, `contractStockBalances`, `stockReconciliations`, `centralInventory`, `centralReturns`, `companyAvailability`, `transferOrders`, `issues`, `returns`, `stockCounts`;
* `:733` — tương tự cho nhóm module BOQ/dự án/tài chính (trong đó có `constructionDailyLogs`/`constructionDailyLogItems`).

⇒ Port phải làm **cả hai**: (a) truy vấn ĐỌC; (b) **bộ lọc theo vai trò + module** đúng như JS. Chỉ port (a) là **lỗi bảo mật**.

## 3. Kế hoạch port (một lượt)

1. Chọn chỗ đặt: `BootstrapDataAdapter` (nơi đã có `constructionDailyLogs:1018`) + adapter chuyên kho (`WarehouseStockStoreAdapter`) cho 3 khoá kho — giữ đúng kiến trúc hiện có, **không tạo adapter mới nếu không cần**.
2. Port **nguyên văn câu SQL** của JS (`:621`, `:659`, `:712`, danh sách trả hàng ở `:727` kèm truy vấn tương ứng phía trên nó) — **giữ nguyên** CTE, `WH-CENTRAL`, `status='active'`, `w.type<>'transit'`, `<>0` và thứ tự `ORDER BY`.
3. Dựng `data.put("centralInventory" | "centralReturns" | "constructionDailyLogItems" | "companyAvailability", …)`.
4. Port bộ lọc quyền tương ứng (`:622`, `:732`, `:733`) — cần `ModulePermissionStore`/vai trò đã có sẵn trong luồng bootstrap.
5. **Kiểm chứng:** chạy `node tools/probe-bootstrap-keys.mjs` → danh sách *"KHOÁ UI ĐỌC MÀ KHÔNG THẤY JAVA TRẢ"* phải **rỗng** (hiện còn 4); + probe HTTP đối chiếu **số dòng** giữa JS-side và Java-side cho 4 khoá trên dữ liệu thật.
6. Cập nhật `MASTER_STATUS`/`TASK_INDEX`, commit.

## 4. Vì sao việc này ưu tiên cao hơn TASK-048 (audit)

Bốn khoá này là **dữ liệu người dùng nhìn thấy hằng ngày**; thiếu chúng thì 4 màn hình **trống trơn** ngay sau cutover, trong khi lỗi audit là **thiếu dấu vết** (không nhìn thấy ngay). Theo §46 (P0 an toàn → P1 kiến trúc lõi → P2 module lõi) thì **đường ĐỌC của module lõi (Kho)** xếp **trước** hạng mục audit.

## 5. Giới hạn của hồ sơ này
Cổng `probe-bootstrap-keys.mjs` so khớp **tên khoá dạng chuỗi** — đã kiểm từng khoá bằng `grep` + đọc mã **hai phía** trước khi kết luận, nhưng **chưa chạy đối chiếu số dòng lúc chạy** (bước 5). Khi port xong phải làm bước 5 mới đủ điều kiện đánh DONE theo §44.
