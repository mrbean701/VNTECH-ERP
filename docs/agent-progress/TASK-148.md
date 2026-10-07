# TASK-148 — GO-LIVE ĐỢT 3: CHUỖI KHO THẬT + SỬA 2 LỖI HỆ THỐNG + ĐỒNG BỘ VÂN TAY

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit** — user dặn «Chưa commit, để tôi xem trước») |
| **Trạng thái** | ✅ XONG — 4 bài test thật XANH, 2 lỗi hệ thống đã sửa, vân tay đồng bộ, mọi cổng xanh |
| **Môi trường test** | `http://127.0.0.1:9000` → Java `:18081` → **MySQL `vntech_erp`** |
| **Công cụ mới** | `tools/e2e/go-live-chuoi-kho.mjs` · **`tools/fixpoint-fingerprint.mjs`** (thường trực) |
| **Sửa cổng/test** | `tests/v217-ban-chay-moi-nhat.test.mjs` (vệ phụ thuộc thời gian) · `tests/w02-project-warehouse-relation.test.mjs` (số đo) |
| **Vân tay cuối** | `VNTECH-FP-614484381419C595` · **712 tệp** · brand `e9d0836b…` · `migrationHead` **không đổi** |

---

## ① CHUỖI KHO CHẠY THẬT — `tools/e2e/go-live-chuoi-kho.mjs` · **9/9 ĐẠT · EXIT=0**

Yêu cầu user: «*workflow xuất-nhập kho và workflow cấp phát - hoàn trả cũng phải được thực hiện*».

### Phát hiện quyết định: QUY TRÌNH CẤP PHÁT CÓ **5 BƯỚC**, KHÔNG PHẢI 1

Đọc mã Java `SystemController.java:1257-1306`, **WF-XUATKHO-01** ghi rõ:

| Bước | Action | Vai trò | Trạng thái sau |
|---|---|---|---|
| ① | `issue_stock` | thủ kho / CHT | `pending_cht` |
| ② | `approve_stock_issue` | **CHT** | `approved` |
| ③ | `issue_stock_confirm` | thủ kho | `issued` — **«Đây là chỗ DUY NHẤT ghi `stock_movements`»** |
| ④ | `confirm_stock_issue` | **chỉ `thu_kho`/admin** | `completed` |
| ⑤ | `create_issue_grn` | kho / kỹ sư | sinh GRN kho khác |

⭐ Nghĩa là **tạo phiếu KHÔNG trừ kho**; kho chỉ bị trừ ở bước ③. Đây là thiết kế ĐÚNG (tránh trừ tồn trước khi CHT duyệt).

### Kết quả đo từng bước (đọc lại từ máy chủ sau mỗi lệnh)

| Bước | Bằng chứng nguyên văn của hệ thống |
|---|---|
| B1 nhập kho | 3 phiếu GRN `PRJ-DEMO-01` → `BCH=confirmed · hạch toán=posted · ảnh=1` · **36/36** phiếu nhập đã xác nhận |
| B2① | «Đã xuất kho 2 dòng; phiếu **PX-E2E-DA-01-2026-0008** đã ghi nhận» → `pending_cht` |
| B2② | «Đã duyệt phiếu xuất kho … — sẵn sàng xuất kho» → `approved` |
| B2③ | «… **tồn kho nguồn đã giảm, tồn kho tổ đội đã tăng**» → `issued` |
| B2④ | «Đã xác nhận xuất đủ theo phiếu …» → `completed` |
| B3 hoàn trả | «Đã nhận hoàn trả **RET-E2E-DA-01-2026-0003**; Contract ownership được bảo toàn» |
| B4 điều chuyển | «Đã tạo **TRF-2026-00002**; Contract ownership của từng dòng đã được khóa để chờ duyệt» |
| B5 trả Kho Tổng | «Đã lập **KT-RET-PRJ-2026-0002**; Contract ownership từng dòng đã được khóa, chờ phê duyệt» |

**Chứng minh ghi sổ bằng SQL thật** (`stock_movements`):
- GRN: `NULL → KHO-PRJ-DEMO-01` +25 / +60 (×3 phiếu)
- SMI: `KHO-E2E-01 → kho tổ đội` −1 / −1
⇒ **Nhập và xuất đều ghi sổ đúng**, tồn kho: `KHO-E2E-01` = 62 · `KHO-PRJ-DEMO-01` = 762 · kho tổ đội = 1.

---

## ② ⭐⭐ LỖI HỆ THỐNG #1 (HIGH) — THIẾU KHO TRANSIT ⇒ ĐIỀU CHUYỂN KHO BẤT KHẢ THI

| | |
|---|---|
| **BUG ID** | BUG-20261005-001 |
| **MODULE** | Kho vận — `create_transfer_order` / `create_central_return` |
| **SEVERITY** | **HIGH** (chặn hẳn một quy trình nghiệp vụ) |
| **DESCRIPTION** | Mọi phiếu điều chuyển kho trả HTTP 400 «**Thiếu kho Transit hệ thống.**» |
| **ROOT CAUSE** | MySQL thật **thiếu kho `type='transit'`** (`SELECT COUNT(*) FROM warehouses WHERE type='transit'` = **0**). `StockManagementUseCase` gọi `findTransitWarehouse()` → `.orElseThrow(() -> Api("Thiếu kho Transit hệ thống."))`; `WarehouseStockStoreAdapter` tra `WHERE type='transit' AND active=1`. Nguyên nhân gốc: **`flyway_schema_history` mới tới V34** ⇒ migration `V37__…_transit_warehouse.sql` (mục 4 của nó tạo đúng kho này) **chưa từng chạy**. Bản SQLite `drizzle/0030_…` đã có sẵn dòng đó từ trước ⇒ chỉ nhánh Java thiếu. |
| **FIX** | Áp **nguyên văn** `V37__…sql` lên MySQL (đưa nội dung qua **stdin**, ⛔ không dùng `source <path>` vì đường dẫn repo có khoảng trắng ⇒ «Failed to open file … error: 2»). V37 viết idempotent (`CREATE TABLE IF NOT EXISTS` + `INSERT IGNORE`). |
| **FILES CHANGED** | Không sửa mã — chỉ **áp migration sẵn có**. Dữ liệu: `warehouses` +1 dòng `WH-TRANSIT`. |
| **TEST** | Trước: điều chuyển lỗi 400. Sau: tạo được `TRF-2026-00002`; chạy lại V37 lần 2 **0 thay đổi** (idempotent). |
| **STATUS** | **FIXED · VERIFIED** |
| **NEXT ACTION** | ⛔ **Cần user quyết**: nhánh Java còn **V36 (không tồn tại) và V37** chưa ghi vào `flyway_schema_history`. Nên để Flyway tự ghi khi khởi động lại app (V37 áp lại = 0 dòng) — **không cần build JAR**. |

**Phụ:** V37 còn backfill `contract_reviews` từ `labor_contracts`: **2 → 22** dòng (đúng thiết kế).

---

## ③ ⭐ LỖI HỆ THỐNG #2 (MEDIUM) — VỆ PHỤ THUỘC THỜI GIAN BÁO ĐỎ GIẢ

| | |
|---|---|
| **BUG ID** | BUG-20261005-002 |
| **MODULE** | Cổng kiểm thử — `tests/v217-ban-chay-moi-nhat.test.mjs` vệ **217-4** |
| **SEVERITY** | MEDIUM (cổng báo động giả ⇒ làm mất lòng tin vào cổng) |
| **DESCRIPTION** | Cổng hồi quy đỏ ở vệ 217-4 dù hệ thống không có gì sai |
| **ROOT CAUSE** | Vệ ghim `mocThoiGianBuild = Date.now() − 24h` rồi đòi `soiMoiMs > 0`. Vì `soiMoiMs = nguonMoiNhatMs − buildMs`, điều kiện đó ⇔ «tệp nguồn mới nhất phải được sửa **trong 24 giờ qua**» ⇒ chỉ xanh khi ai đó vừa chạm `app/|lib/|public/`. Giai đoạn GO-LIVE làm việc ở `scripts/`, `tests/`, Java, tài liệu ⇒ nguồn mới nhất đã **54,3 giờ** tuổi ⇒ **ĐỎ GIẢ**. |
| **FIX** | Lấy mốc từ **chính tệp nguồn mới nhất** rồi lùi 1 giờ: `doDoMoi(root, { mocThoiGianBuild: that.nguonMoiNhatMs - 3600_000 })`. **Tất định**, không phụ thuộc đồng hồ, vẫn đúng nguyên ý nghĩa đối chứng âm. |
| **FILES CHANGED** | `tests/v217-ban-chay-moi-nhat.test.mjs` |
| **TEST** | Tệp test **7/7 XANH**. Đo thật: `dist` mới hơn nguồn **74s** ⇒ ĐẠT · **đối chứng âm vẫn thật**: ghim build lùi 1h ⇒ `soiMoiMs = +3600s` ⇒ **bắt được**; ghim tới 1h ⇒ `−3600s` ⇒ không báo động giả. |
| **STATUS** | **FIXED · VERIFIED** |

---

## ④ BỐN LẦN TÔI ĐỌC SAI KHOÁ DỮ LIỆU — GHI THẲNG ĐỂ KHÔNG LẶP

Đợt này tôi **4 lần** kết luận sai vì tra sai khoá. Tất cả đều do **không đọc cấu trúc thật trước khi viết phép đếm**:

| Lần | Tôi tra | Sự thật | Suýt kết luận sai |
|---|---|---|---|
| 1 | `bs.users` cho người KHÔNG phải admin | bootstrap **xoá sạch** `users` (`system-route.mjs:834`); khoá đúng là **`bs.user`** (số ít) | «sản phẩm mất thông tin người gửi» |
| 2 | tìm báo lỗi trong `bootstrap` | lấy qua **ACTION `error_reports`** (`SystemController.java:1473`) | «admin không xem được báo lỗi» |
| 3 | `taskNotifications` = 0 | khoá **CÓ** (`BootstrapDataAdapter.java:1651`) và **lọc theo `user_id`** người đăng nhập | «thông báo web không chạy» |
| 4 | `inventory[].quantity` / `.qty` | khoá thật là **`balance` / `reserved` / `available`**; `companyAvailability[]` dùng **`onHand`** | «nhập/xuất kho không ghi sổ» |

⭐ **Quy tắc rút ra:** trước khi viết phép đếm, **in ra khoá thật của một dòng** rồi mới đếm. Và nhớ:
`bs.inventory` **chỉ chứa kho DỰ ÁN (site)** — **kho tổ đội** và **Kho Tổng** chỉ có trong `bs.companyAvailability`.

---

## ⑤ ĐỒNG BỘ VÂN TAY — `VNTECH-FP-614484381419C595` · 712 tệp

**Vì sao phải làm:** subagent thêm `scripts/email-noti-core.mjs` + `tests/email-noti-core.test.mjs` và sửa `scripts/email-dispatcher.mjs`; tôi sửa 2 tệp trong `tests/`. `scripts/` và `tests/` **nằm trong `ROOT_DIRS`** ⇒ vân tay đổi `f5cce656…` (710) → `712 tệp` ⇒ `verify:fingerprint` **ĐỎ**.

**Phát hiện làm fixpoint đơn giản hơn hẳn** (đọc trực tiếp `lib/trust/source-fingerprint.mjs`, ⛔ không đoán):
- `EXCLUDED = {"lib/vntech-identity-data.mjs"}` và `VNTECH_FINGERPRINT.json` **KHÔNG** nằm trong `ROOT_FILES`
- ⇒ **sửa 2 tệp SSOT KHÔNG làm đổi vân tay**; đã quét lại toàn bộ `ROOT_DIRS`: **chỉ duy nhất tệp SSOT** chứa vân tay cũ (mà nó bị loại trừ)
- ⇒ **fixpoint đạt sau 1 vòng** (các đợt trước cần 2 vòng vì có chú thích gõ cứng trong `scripts/`)

**Công cụ thường trực mới:** [tools/fixpoint-fingerprint.mjs](tools/fixpoint-fingerprint.mjs) — thay cho các probe `tmp-fixpoint.mjs` viết tay mỗi đợt; tự lặp tới điểm bất động (tối đa 5 vòng) và tự khẳng định lại. Đặt ở `tools/` nên **không tự làm vân tay đổi** (D-055).

**Chuỗi đã chạy (đủ 7 bước):** fixpoint (1 vòng) → `verify` **ĐẠT** `VNTECH-FP-614484381419C595` · 712 tệp → `set-local-identity` **KHỚP: true** → `npm run build` **ĐẠT** → khởi động lại `:8787` (PID 16548 → **20256**, HTTP 200 · 7123 B) → cổng UI **3/3 ✓** (`do-moi` 17s · `van-tay` `614484381419c595` khớp SSOT · `byte` 6/6) → `npm test` **EXIT=0**.

---

## ⑥ SỬA HỢP ĐỒNG CỔNG THEO DỮ LIỆU MỚI (⛔ không sửa dữ liệu cho khớp tài liệu)

`V37` thêm **kho HỆ THỐNG** `WH-TRANSIT` (`project_id IS NULL`) ⇒ `warehouses` **11 → 12**, còn `projects` (5) và `linked` (10) **không đổi**.

- `tests/w02-project-warehouse-relation.test.mjs`: đổi kỳ vọng `11 → 12`, kèm chú thích vì sao **chỉ số này** tăng.
- `docs/agent-progress/W-02-AUDIT-PROJECT-WAREHOUSE.md`: thêm mục «CẬP NHẬT SỐ ĐO — 05/10/2026» (253 → **293 dòng**).
- ⭐ Ghi rõ trong tài liệu: đây **KHÔNG phải dữ liệu test** — kho Transit là **điều kiện bắt buộc của nghiệp vụ**.

---

## ⑦ ĐO CUỐI VÒNG (số thật)

| Phép đo | Kết quả |
|---|---|
| `npm test` | **778 tests · 777 pass · 0 fail · 1 skipped · EXIT=0** |
| `verify-vntech-fingerprint.mjs` | **ĐẠT** · `VNTECH-FP-614484381419C595` · source **712 files** |
| Cổng UI `:8787` | **3/3 ✓** |
| Chuỗi kho | **9/9 ĐẠT** · 7/7 lệnh thành công |
| Báo lỗi + thông báo | **9/9 ĐẠT** |
| Phân quyền | **32/32 ĐẠT** |
| Workflow động đổi người duyệt | **10/10 ĐẠT** |
| Email noti core | **27/27 PASS** + 4 đối chứng âm |
| `:8787` | HTTP **200** · 7123 bytes · PID **20256** |

---

## ⑧ BÀI HỌC

1. ⛔⛔ **Đọc khoá dữ liệu THẬT trước khi viết phép đếm** — 4 lần sai trong một đợt vì bỏ qua bước này.
2. ⛔ **Migration chưa chạy = tính năng bất khả thi.** Đừng đoán «lỗi mã» khi triệu chứng là «thiếu dữ liệu hệ thống»; đối chiếu `flyway_schema_history` với danh sách migration có sẵn.
3. ⭐ **Đọc mã để biết quy trình có mấy bước** — tôi tưởng cấp phát là 1 lệnh, thực tế **5 bước**; comment trong `SystemController.java` ghi rõ chỗ nào ghi kho.
4. ⛔ **Vệ phụ thuộc thời gian là vệ hỏng.** Nếu điều kiện xanh phụ thuộc «vừa mới sửa gì đó», nó sẽ đỏ lúc không ai làm gì.
5. ⛔ **`source <path>` của mysql client không chịu được đường dẫn có khoảng trắng** ⇒ đưa nội dung qua **stdin**.
6. ⛔ **Dấu backtick trong chuỗi PowerShell là ký tự escape** ⇒ cả script không chạy và **không in gì**. Dùng nháy đơn.
7. ⭐ **Kiểm điểm bất động rẻ hơn tưởng** nếu đọc kỹ mô-đun: hiểu `EXCLUDED` + `ROOT_FILES` giúp fixpoint từ 2 vòng còn **1 vòng**.

---

## ⑨ BLOCKER

⛔ **Chưa commit** (`AUTO_COMMIT = FALSE`, `AUTO_PUSH = FALSE`).
⚠️ Đợt này **ghi vào MySQL thật**: 1 kho hệ thống (`WH-TRANSIT`) · 22 dòng `contract_reviews` · nhiều phiếu nhập/xuất/hoàn trả/điều chuyển/trả Kho Tổng · công việc + thông báo. Tất cả qua **API thật** hoặc **migration có sẵn**, ⛔ không sửa tay.
⛔ **Cần user quyết:** `flyway_schema_history` vẫn ghi tới **V34** trong khi V35 + V37 đã áp tay ⇒ để Flyway tự ghi khi khởi động lại app (V35/V37 áp lại = 0 dòng, an toàn).
