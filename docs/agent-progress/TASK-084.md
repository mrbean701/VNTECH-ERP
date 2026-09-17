# TASK-084 — CỔNG ĐỐI CHIẾU SỐ TIỀN: GIAO DIỆN ↔ CSDL

- **Mã:** TASK-084 · **Ngày:** 18/09/2026 · **Commit:** `#145`
- **Cổng:** `tools/probe-money-consistency.mjs` — **14/14 ĐẠT · 0 HỎNG · 3 GHI NHẬN**
- **Ra đời từ:** đợt 2E phát hiện payload `boqItems` trả **mỗi dòng BOQ hai lần** ⇒ màn Thanh toán hiển thị
  **giá trị hợp đồng GẤP ĐÔI**. Lớp lỗi đó chỉ lộ ra khi đem **con số của GIAO DIỆN** so với **con số của CSDL**
  — trước đó **không cổng nào** làm phép so này.

## 1. Cổng làm gì

Với mỗi nguồn tiền mà giao diện **tự tính** từ payload, cổng in ra **HAI con số** (UI và CSDL) và khẳng định
chúng bằng nhau (dung sai 0,01 đ):

| Nguồn | UI lấy từ | CSDL đối chiếu |
|---|---|---|
| BOQ — số dòng + giá trị hợp đồng | `boqItems[].contractQty × unitPrice` | `project_boq_items` |
| Đơn hàng — tổng giá trị | `purchaseOrders[].totalValue` | `purchase_orders.total_value` |
| Thanh toán hợp đồng | `contractPayments[].amount` | `contract_payments.amount` |
| Báo cáo sản lượng | `productionReports[].plannedValue/actualValue/approvedValue` | `production_reports` |
| Thu hồi vốn | `capitalRecoveryRecords[].submittedValue/approvedValue` | `capital_recovery_records` |

**Ba phép tự kiểm soát (chống khẳng định rỗng / chống tái phát):**
1. Có **ít nhất 1 dự án** thật sự có dòng BOQ để đối chiếu.
2. **KHÔNG dòng BOQ nào trùng/rỗng vật tư** trên **toàn bộ** dự án — đây chính là dấu hiệu của lỗi đếm trùng
   đã vá ở đợt 2E; nếu liên kết ngược lại bị NULL, cổng báo HỎNG ngay.
3. Không hồ sơ thu hồi vốn nào có **tiền thực thu vượt giá trị được duyệt**.

## 2. Kết quả đo (18/09/2026)

| Phép kiểm | UI | CSDL | Kết luận |
|---|---|---|---|
| BOQ `PRJ-DEMO-01` — số dòng | 8 | 8 | ĐẠT |
| BOQ `PRJ-DEMO-01` — giá trị hợp đồng | **673.250.000** | **673.250.000** | ĐẠT (đã hết gấp đôi) |
| PO — tổng giá trị | 0 | 0 | ĐẠT (hai bên khớp, nhưng **gốc dữ liệu bằng 0**, xem mục 3) |
| Thanh toán hợp đồng | 1.500.000.000 | 1.500.000.000 | ĐẠT |
| Báo cáo sản lượng (đã duyệt) | 94.220.000 | 94.220.000 | ĐẠT |
| Thu hồi vốn (đã duyệt) | 94.220.000 | 94.220.000 | ĐẠT |

## 3. Ba điều cổng **GHI NHẬN** (không tự sửa — cần người dùng quyết định)

1. **`purchase_order_items.unit_price = 0` cho 13/13 dòng** ⇒ `total_value` của 7/7 PO = 0 ⇒ mọi số tiền suy
   từ PO đều bằng 0 (KP #82). Cổng vẫn ĐẠT vì hai bên **cùng bằng 0** — nói cách khác: **khớp nhưng vô nghĩa**,
   và cổng nói thẳng điều đó thay vì báo xanh im lặng.
2. **Tồn kho: 28 dòng mà 0 dòng có đơn giá** ⇒ giá trị tồn theo giá luôn 0 — **cùng một gốc** với (1).
3. **⚠️ MỚI: `PRJ-DEMO-01` đã thu/thanh toán `1.500.000.000` đ nhưng giá trị hợp đồng chỉ `673.250.000` đ**
   (**223 %** hợp đồng). Đây là **bất thường dữ liệu cần đối chiếu**, không phải lỗi mã; cổng **không tự sửa**
   vì đó là quyết định tài chính (xem KP #83).

## 4. Vì sao cổng này có giá trị lâu dài

Lớp lỗi "đường ĐỌC trả dữ liệu SAI (thừa/thiếu dòng)" **không** bị bắt bởi:
* `tsc`/eslint (mã hợp lệ),
* cổng kiểu & cổng khoá (khoá vẫn đủ),
* cổng đối chiếu TẬP CỘT (số **cột** đúng, chỉ **dòng** sai),
* cổng ảnh 28 ảnh (không phủ màn Thanh toán).

⇒ Chỉ phép so **CON SỐ UI ↔ CON SỐ CSDL** mới bắt được. Cổng này nay chạy độc lập và sẽ bắt lại nếu lỗi tái phát.
