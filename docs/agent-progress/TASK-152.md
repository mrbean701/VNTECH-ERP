# TASK-152 — GO-LIVE ĐỢT 7: VÒNG ĐỜI KHO + BUG HIGH «TRẢ KHO TỔNG KHÔNG THỂ HOÀN TẤT»

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Trạng thái** | ✅ Điều chuyển **hoàn tất 5/5** · 🚨 **BUG-20261005-005 (HIGH)** phát hiện, **đã có root cause ở tầng mã**, ⛔ chưa vá (chờ build+restart) |
| **Công cụ mới** | `tools/e2e/go-live-vong-doi-kho.mjs` |
| **Môi trường** | `:9000` → Java `:18081` → MySQL |
| **Vân tay** | ⛔ Không đổi (`tools/` + `docs/` ngoài `ROOT_DIRS`) |

---

## ① ⭐ QUY TRÌNH ĐIỀU CHUYỂN KHO — CHẠY TRỌN VẸN **5/5** (trước đây mới dừng ở «tạo phiếu»)

Các lượt trước tôi chỉ **tạo** phiếu rồi dừng. Đo được: **5 phiếu đều `status = requested`** ⇒ quy trình **chưa hoàn tất**, hàng chưa hề di chuyển.

**Vòng đời đã chạy hết** (đọc từ `StockManagementUseCase`, ⛔ không đoán):

| Bước | Action | Trạng thái |
|---|---|---|
| ① | `create_transfer_order` | `requested` |
| ② | `approve_transfer_order` | `approved` |
| ③ | `ship_transfer_order` | `in_transit` |
| ④ | `receive_transfer_order` | **`received`** |

**Kết quả: `TRF-2026-00002 … 00006` — CẢ 5 ĐỀU `received`.**

⭐ **Và cả 3 bước đều chạy bằng TÀI KHOẢN NGHIỆP VỤ, KHÔNG cần admin** — chứng minh phân quyền theo vai trò hoạt động đúng:
- `e2e.khnv` (Nhân viên Kế hoạch) → **duyệt** (`inventory · canApprove`)
- `e2e.tk` (Thủ kho) → **xuất** (`inventory · canEdit`)
- `e2e.khnv` → **nhận** (`inventory · canApprove`)

**Tồn kho di chuyển thật:** `KHO-E2E-01` **120 → 102** · `stock_movements` có **5 lệnh `TRF_SHIP`** (nguồn `KHO-E2E-01` → `WH-TRANSIT`).

---

## ② 🚨 BUG-20261005-005 (HIGH) — TRẢ KHO TỔNG **KHÔNG THỂ HOÀN TẤT**

| | |
|---|---|
| **MODULE** | Kho vận — `approve_central_return` → `receive_central_return` |
| **SEVERITY** | **HIGH** (workflow + dữ liệu: phiếu kẹt vĩnh viễn, hàng kẹt, hai sổ lệch) |
| **DESCRIPTION** | Duyệt phiếu trả Kho Tổng xong thì **không bao giờ nhận được**: «*Số liệu Transit vật lý/Contract không đủ; dừng nhận để tránh sai tồn.*» |
| **ROOT CAUSE** | `WarehouseStockStoreAdapter.approveCentralReturnWithShip` (**dòng 872+**) **CHỈ ghi `stock_movements`** (dòng **880**, **909**) — **THIẾU `INSERT INTO contract_stock_ledger`**. Trong khi `receive_central_return` (`StockManagementUseCase:925`) đòi **CẢ HAI**: `proposed > transitBalance` **HOẶC** `proposed > transitOwner` là chặn. |
| **ĐỐI CHIẾU (chứng minh là thiếu sót, không phải thiết kế)** | Đường **điều chuyển** `shipTransfer` **ghi CẢ HAI sổ** (`WarehouseStockStoreAdapter:320` và `:330`; chú thích `:141` ghi rõ «+ 2 dòng `contract_stock_ledger` (−qty nguồn, +qty tổ đội)»). Đường trả Kho Tổng **thiếu hẳn** phần đó. |
| **BẰNG CHỨNG ĐO ĐƯỢC** | `stock_movements`: **4 lệnh** `CENTRAL_RETURN_SHIP`, **9 đơn vị** tại `WH-TRANSIT`. `contract_stock_ledger`: **0 dòng** loại `CENTRAL_RETURN_SHIP`, **0 dòng** tại `WH-TRANSIT`. (Ledger **có** được dùng: 190 dòng với `SMI` 88 · `GRN` 42 · `RET` 20 tại 4 kho khác.) |
| **HẬU QUẢ THẬT** | ① **4 phiếu kẹt vĩnh viễn ở `in_transit`** (không có action hủy/hoàn tác) · ② **9 đơn vị kẹt ở Transit** (E2E-XM-002 ×4 · E2E-XM-001 ×5): đã rời kho dự án, không tới Kho Tổng, **không quay lại được** · ③ **hai sổ lệch nhau** (4 lệnh vật lý ↔ 0 dòng sở hữu) |
| **ĐÃ KIỂM CHỨNG ĐÚNG CÁCH (⛔ không lách chốt)** | Thoả **từng** chốt theo thứ tự: ㋐ tạo phiếu cho vật tư **có tồn thật** → ㋑ duyệt (qua) → ㋒ **tải ảnh kiểm đếm** (`entity_type='central_return'`, `mime image/*`) → ㋓ gửi `lines` **đúng hợp đồng** (`centralReturnItemId` + `countedQty` + `acceptedQty`, ràng buộc `0 ≤ accepted ≤ counted ≤ proposedQty`) → **vẫn chặn ở chốt sổ sở hữu** |
| **ĐỐI CHỨNG ÂM** | **5/5 phiếu xin trả vật tư KHÔNG có tồn vật lý bị chặn ĐÚNG** («Tồn vật lý/Contract nguồn không đủ») ⇒ chốt tồn **hoạt động tốt**; **chỉ thiếu** phần ghi sổ sở hữu ở đường này |
| **FIX ĐỀ XUẤT** | Trong `approveCentralReturnWithShip`: thêm **2 dòng** `contract_stock_ledger` — `−qty` tại **kho nguồn**, `+qty` tại **Transit** — **đúng khuôn `shipTransfer`** (`:320`/`:330`) |
| **STATUS** | **REPORTED · ROOT CAUSE XÁC ĐỊNH** · ⛔ **CHƯA VÁ** (sửa Java ⇒ phải build lại JAR + khởi động lại `:18081` — **đang chờ user cho phép**) |
| **NEXT ACTION** | ① user cho phép build + restart → ② vá theo khuôn `shipTransfer` → ③ `mvn -o test` phải XANH 147/147 → ④ chạy lại `go-live-vong-doi-kho.mjs` ⇒ kỳ vọng **5/5** → ⑤ xử lý 4 phiếu kẹt + 9 đơn vị kẹt ở Transit |

---

## ③ BÀI HỌC

1. ⛔ **«Tạo được phiếu» KHÔNG phải «hoàn thành quy trình».** Các lượt trước tôi báo «điều chuyển ✔ / trả Kho Tổng ✔» **chỉ vì tạo được phiếu** — thực tế chúng nằm ở trạng thái đầu và **hàng chưa hề di chuyển**. Phải đo **TRẠNG THÁI CUỐI**, không đo «lệnh trả 200».
2. ⭐⭐ **CHỐT NGHIỆP VỤ CHẶN TA KHÔNG CÓ NGHĨA LÀ CHỐT SAI.** Gặp 3 chốt liên tiếp (tồn nguồn · ảnh kiểm đếm · sổ sở hữu), tôi **thoả lần lượt** thay vì tìm cách lách. Nhờ vậy mới lộ ra: 2 chốt đầu **đúng và hoạt động tốt**, chốt thứ 3 lộ **lỗi thật ở đường ghi sổ**.
3. ⛔ **ĐỐI CHỨNG ÂM CỨU TA KHỎI KẾT LUẬN SAI**: 5 phiếu thiếu tồn bị chặn **đúng** ⇒ chứng minh chốt tồn tốt, nên nghi vấn **dồn đúng vào phần sổ sở hữu** thay vì đổ lỗi lung tung.
4. ⭐ **SO SÁNH HAI ĐƯỜNG CÙNG LOẠI LÀ CÁCH TÌM LỖI NHANH NHẤT**: điều chuyển **chạy được**, trả Kho Tổng **không** — cùng là «ship sang Transit». Đặt cạnh nhau là thấy ngay đường hỏng **thiếu `contract_stock_ledger`**.
5. ⛔ **Đọc tên khoá từ mã, không đoán**: `lines` của `receive_central_return` dùng `centralReturnItemId`/`countedQty`/`acceptedQty` — tôi đoán `itemId`/`rejectedQty` nên bị «Kết quả kiểm đếm không hợp lệ» mất một lượt.

---

## ④ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Điều chuyển kho | **5/5 `received`** · 5 lệnh `TRF_SHIP` · `KHO-E2E-01` 120 → 102 |
| Đối chứng âm (phiếu thiếu tồn) | **5/5 bị chặn ĐÚNG** |
| Trả Kho Tổng | ⛔ **kẹt ở `in_transit`** (4 phiếu) do BUG-20261005-005 · `centralInventory` = **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-614484381419C595` — **không đổi** |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** (build 01/10) |

---

## ⑤ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết (5 việc, 4 việc đã hỏi từ các vòng trước chưa có trả lời):**
1. **Cho phép build lại JAR + khởi động lại Java `:18081`** — nay **càng cấp thiết** vì đang có **1 bản vá HIGH chưa lên sóng** (BUG-20261005-003) và **1 lỗi HIGH mới cần vá** (BUG-20261005-005). Làm việc này cũng **giải quyết luôn** việc ghi `V35`+`V37` vào `flyway_schema_history`.
2. Sửa `AGENTS.md` để xoá định đề «không có Maven»? (`DECISIONS.md` **D-110** + `MASTER_STATUS.md` đã sửa)
3. Mở task xây tính năng «thêm thành viên tổ đội»?
4. Xử lý **4 phiếu kẹt + 9 đơn vị kẹt** ở Transit thế nào (chờ bản vá, hay dọn tay)?
5. Commit?
