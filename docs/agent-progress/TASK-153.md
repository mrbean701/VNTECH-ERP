# TASK-153 — GO-LIVE ĐỢT 8: VÁ BUG-20261005-005 (HIGH) — SỔ SỞ HỮU Ở TRANSIT

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-005** (HIGH — workflow + dữ liệu) |
| **Trạng thái** | ✅ **FIXED · VERIFIED** (biên dịch + test tích hợp + **đối chứng âm**) · ⛔ **CHƯA TRIỂN KHAI** |
| **Tệp sửa** | `java-backend/infrastructure/…/persistence/WarehouseStockStoreAdapter.java` · `java-backend/application/…/service/StockManagementUseCase.java` |
| **Tệp test sửa** | `java-backend/web/src/test/java/…/controller/StockChainIntegrationTest.java` (+1 vệ) |
| **Vân tay** | ⛔ Không đổi — `java-backend/` ngoài `ROOT_DIRS` |

---

## ① LỖI ĐƯỢC VÁ

`approveCentralReturnWithShip` **và** `receiveCentralReturn` **CHỈ ghi `stock_movements`**, **KHÔNG hề ghi `contract_stock_ledger`**. Nhưng `receiveCentralReturn` (chốt ở `StockManagementUseCase:925`) đòi **CẢ HAI**: `proposed > transitOwner` là chặn.

⇒ Sổ sở hữu tại Transit **luôn 0** ⇒ phiếu **KẸT VĨNH VIỄN** ở `in_transit`, hàng kẹt ở Transit, hai sổ lệch nhau.

**Bằng chứng đo trên MySQL thật trước khi vá:** `stock_movements` **4 lệnh** `CENTRAL_RETURN_SHIP` + **9 đơn vị** ở `WH-TRANSIT`; `contract_stock_ledger` **0 dòng** loại đó và **0 dòng** ở `WH-TRANSIT`.

⭐ **Ý định thiết kế đã ghi sẵn trong mã**: `StockManagementUseCase:888` trả về «*Đã duyệt và xuất khỏi kho nguồn; **Transit giữ nguyên Contract ownership***» — tức sổ sở hữu **phải được chuyển sang Transit**. Bản cài đặt đã **bỏ sót** đúng phần đó. ⇒ Bản vá **khôi phục đúng ý định**, không phải thêm hành vi mới.

---

## ② ĐÃ VÁ GÌ (theo đúng khuôn `issueStock` :318-337)

| Hàm | Thêm |
|---|---|
| `approveCentralReturnWithShip` | **2 dòng** ledger/đơn vị: **−qty** tại **kho nguồn** · **+qty** tại **Transit** |
| `receiveCentralReturn` | phần **nhận**: **−accepted** tại Transit · **+accepted** tại **Kho Tổng**<br>phần **loại/mất**: **−rejectedLost** tại Transit · **+rejectedLost** trả lại **kho nguồn** |
| `StockManagementUseCase.approveCentralReturn` | bổ sung `itemId` vào `items` ⇒ ledger ghi được `reference_item_id` (trước đây **không truy vết được**) |

⭐ Sau khi nhận đủ: Transit **+qty** (lúc duyệt) rồi **−accepted − rejectedLost** (lúc nhận) ⇒ **về 0** — sổ khép kín.

---

## ③ KIỂM CHỨNG — 3 TẦNG, CÓ ĐỐI CHỨNG ÂM

### Tầng 1 — BIÊN DỊCH
`mvn -o -DskipTests compile` ⇒ **BUILD SUCCESS** 5/5 module.

### Tầng 2 — VỆ MỚI TRONG `StockChainIntegrationTest` (chạy đường API thật + H2)
Vệ `centralReturn_ghiDuSoSoHuuTaiTransit_vaNhanDuocVeKhoTong` chạy trọn vòng đời và khẳng định **sổ sở hữu đúng ở cả 3 mốc**:

| Mốc | Khẳng định |
|---|---|
| Duyệt | **Transit +2** ← *chính là phần bị thiếu* |
| Nhận | trạng thái `received` · **Kho Tổng +2** · **Transit về 0** |

⇒ `Tests run: 2, Failures: 0, Errors: 0` · BUILD SUCCESS

⭐ Chi tiết đã sửa trong lúc viết vệ: khẳng định đầu tiên trỏ sai kho Tổng vì `createCentralReturn` chọn kho bằng `findCentralWarehouse()` = `type='central' ORDER BY code LIMIT 1`, mà `setup()` **đã tạo sẵn** một kho Tổng của hệ thống. Đã sửa thành **đọc `central_warehouse_id` từ chính phiếu** — ⛔ không đoán.

### Tầng 3 — ĐỐI CHỨNG ÂM (§17 bắt buộc)
Phá đúng hành vi lỗi (đổi đích dòng sổ `+qty` từ **Transit** về **kho nguồn** — tái hiện «Transit không nhận sổ» mà không gây lỗi khoá ngoại):

| Bước | Kết quả đo được |
|---|---|
| **Cài hành vi lỗi** | **ĐỎ**: `Tests run: 2, Failures: 1` · `DUYỆT phải ghi sổ sở hữu +2 tại Transit (trước bản vá = 0 ⇒ phiếu kẹt vĩnh viễn): 0.0 ==> expected: <true> but was: <false>` |
| **Khôi phục bản vá** (tệp giống **100%**) | **XANH**: `Tests run: 2, Failures: 0, Errors: 0` · BUILD SUCCESS |

⇒ **Vệ mới THẬT SỰ bắt được lỗi**, bản vá làm nó xanh.

### HỒI QUY TOÀN BỘ (§10)
`mvn -o test` ⇒ Domain **19** · Application **38** · Infrastructure **13** · Web **78** = **148 test · 0 failure · 0 error · BUILD SUCCESS · EXIT=0**

---

## ④ TRẠNG THÁI & VIỆC CÒN LẠI

| | |
|---|---|
| **Mã nguồn** | ✅ đã vá · ✅ biên dịch · ✅ 148/148 test xanh · ✅ đối chứng âm đạt |
| **Triển khai** | ⛔ **CHƯA** — `:18081` vẫn chạy JAR **build 01/10**. Cần `mvn -o -DskipTests package` + **khởi động lại Java** ⇒ **chờ user cho phép** |
| **Dữ liệu đang kẹt** | 4 phiếu `in_transit` + 9 đơn vị ở `WH-TRANSIT` — sau khi triển khai cần quyết cách dọn (chạy tiếp nhận, hay xử lý riêng) |

---

## ⑤ BÀI HỌC

1. ⭐⭐ **Ý ĐỊNH THIẾT KẾ NẰM TRONG CÂU THÔNG BÁO TRẢ VỀ.** Dòng 888 ghi «Transit **giữ nguyên** Contract ownership» — đọc kỹ câu đó là biết ngay phần cài đặt **phải** ghi sổ tại Transit. ⛔ Đừng chỉ đọc `INSERT`; đọc cả **lời hứa** của hàm.
2. ⭐ **SO HAI ĐƯỜNG CÙNG LOẠI** (`issueStock` vs `approveCentralReturnWithShip`) chỉ ra ngay phần thiếu — cùng là «ghi kho», một đường ghi **2 sổ**, đường kia ghi **1**.
3. ⛔ **ĐỐI CHỨNG ÂM LÀ ĐIỀU KIỆN CỦA «VERIFIED»** — vệ mới xanh **chưa** chứng minh được gì cho tới khi ta **phá đúng hành vi lỗi** và thấy nó ĐỎ. Cách phá phải **chọn khéo**: đổi đích ghi thay vì xoá dòng, để không sinh lỗi khoá ngoại làm nhiễu kết luận.
4. ⛔ **ĐỌC KHOÁ TỪ CHÍNH DỮ LIỆU, KHÔNG ĐOÁN** — vệ đầu tiên của tôi trỏ `wh_central` (kho tôi tự thêm) trong khi phiếu dùng kho Tổng do `setup()` tạo. Sửa thành đọc `central_warehouse_id` từ phiếu ⇒ đúng và bền.

---

## ⑥ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — mục 1 nay gấp hơn bao giờ hết** (đang có **2 bản vá HIGH** chưa lên sóng: BUG-20261005-003 và BUG-20261005-005):
1. **Cho phép build lại JAR + khởi động lại Java `:18081`** (làm việc này **ghi luôn** `V35`+`V37` vào `flyway_schema_history`)
2. Sửa `AGENTS.md` xoá định đề «không có Maven»? (`DECISIONS.md` **D-110** đã ghi)
3. Mở task «thêm thành viên tổ đội»?
4. Cách xử lý **4 phiếu + 9 đơn vị kẹt ở Transit** sau khi triển khai?
5. Commit?
