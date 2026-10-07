# TASK-223 — GO-LIVE: KẾ HOẠCH VÁ F2 + HOÀN THÀNH FILE EXCEL BÁO CÁO TUẦN

| | |
|---|---|
| **Ngày** | 06/10/2026 · ⭐ tương ứng **«VÒNG 77»** trong `docs/dsh-state/CHECKLIST.md` |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Yêu cầu user** | ⭐ *«trong doc có 1 file excel Mẫu báo cáo tuần hãy hoàn thành sheet 1»* ⇒ ⭐ **đính chính: «tôi nhầm làm sheet 2»** |
| **Trạng thái** | ✅ **HOÀN THÀNH** |
| **Nhật ký chi tiết** | ⭐ `docs/dsh-state/CHECKLIST.md` mục **«VÒNG 77»** · `testlog.md` mục **587 → 598** |

---

## ① ⭐⭐ LẬP KẾ HOẠCH KHẮC PHỤC F2 — `docs/agent-progress/KE-HOACH-VA-F2.md` (⛔ **CHƯA ÁP DỤNG**)

⭐ **Vì sao vẫn làm dù đang tạm dừng**: ⭐ **F2 là lỗi WORKFLOW ⇒ §19 hạng 3** (⚠️ trên bug MEDIUM) và ⭐ **việc vá nó đòi hỏi sửa 03 bài kiểm thử** ⇒ ⭐ **phân tích thuần tuý ⛔ không ghi gì là việc đúng** ✓

**Nội dung 07 mục**:
1. ⭐ **Vì sao «chỉ thêm một dòng chốt» ⛔ không đủ** (⭐ ghi lại **bằng chứng đỏ 3 test**)
2. ⭐ **Máy trạng thái PO** (⭐ đọc từ mã)
3. ⭐ **Hợp đồng `approve_po`** (⭐ action · payload · cổng vai trò · cổng module · hiệu ứng)
4. ⭐ **Các bước sửa CHÍNH XÁC** (⭐ có số dòng)
5. **Rủi ro & lưu ý** · 6. **Kiến nghị thứ tự** · 7. **Tham chiếu**

### ⭐ Định vị chính xác 03 bài kiểm thử đỏ

| Tệp test | ⭐ Chuỗi nó chạy | ⚠️ Thiếu gì |
|---|---|---|
| `StockChainIntegrationTest.java` | (dòng 23) `setup → seed → create_po → receive_goods → confirm_delivery` | ⛔ **KHÔNG có bước phát hành PO** — dòng **125** `create_po` rồi dòng **132** `receive_goods` ngay sau |
| `SupplyChainEndToEndIntegrationTest.java` | (dòng 26) `create_request → duyệt 2 bước → create_po → receive_goods` | ⛔ **có duyệt PHIẾU nhưng ⛔ KHÔNG duyệt PO** — dòng **153** rồi **163** |

⭐ **VÌ SAO CHÚNG LÀM VẬY**: ⭐ rất có thể vì **`approve_po` từng trả 403** (lỗi **F1**) ⇒ ⭐ **bài kiểm thử phải đi vòng** ⇒ ⭐ **nay F1 đã vá nhưng test vẫn giữ đường vòng** ✓

### ⭐ Máy trạng thái PO (đọc từ mã, ⛔ không suy đoán)
```text
createPo   (:185)  → 'pending_approval'
decidePo   (:250)  đòi ĐÚNG 'pending_approval'
           (:254)  → approve=true ⇒ 'waiting_delivery' · false ⇒ 'cancelled'
receiveGoods (:369,:387) → 'partial_delivery' / 'awaiting_bch_confirmation'
confirmDelivery (:445,:450) → 'completed'
```
📊 **Dữ liệu thật 06/10**: 18 `completed` · 09 `waiting_delivery` · 04 `pending_approval`
⇒ ⭐ **CỔNG ĐÚNG: chỉ nhận hàng khi PO ∈ {`waiting_delivery`, `partial_delivery`}** ✓

### ⭐ Hợp đồng `approve_po`
| Hạng mục | ⭐ Giá trị |
|---|---|
| Action | **`approve_po`** → `SystemController:1161` → `decidePo(…, true)` |
| Payload | ⭐ **`purchaseOrderId`** (+ `reason` khi từ chối) |
| Cổng vai trò | `requireRole(["procurement","accountant","admin"])` — ⚠️ **so với `base_role`** |
| Cổng module | ⭐ **`purchasing`** (`ActionRbacRegistry:26`) + **`canApprove`** (:318) |
| Hiệu ứng | PO: `pending_approval` → ⭐ **`waiting_delivery`** |

⚠️ ⛔ **TUYỆT ĐỐI ⛔ KHÔNG đặt chốt trong `findPoForReceiving`** — ⭐ hàm đó phục vụ **3 nơi** (`decidePo` dòng 248 · hàm khác dòng 270 · `receiveGoods` dòng 304), mà **`decidePo` CẦN PO ở `pending_approval`** ⇒ ⭐ **đặt ở đó sẽ KHOÁ CHẾT đường phát hành PO** ✓

---

## ② ✅ HOÀN THÀNH FILE EXCEL «MẪU BÁO CÁO TUẦN» — **sheet 2 «Thắng»**

### ⚠️ 02 trở ngại kỹ thuật đã vượt
- ⛔ **không có python** (⭐ chỉ có App Execution Alias của Microsoft Store) · ⛔ **không có node `xlsx`/`exceljs`**
- ⚠️ **file bị Excel KHOÁ** (`being used by another process`)
- ⭐ **GIẢI PHÁP**: **copy ra bản làm việc** + dùng **Excel COM** (⭐ Excel **16.0** có sẵn) ✓

### ⭐⭐ Đọc layout TRƯỚC khi điền — ⚠️ sheet 2 **KHÁC** sheet 1
- ⭐ **Header có sẵn**: **CÔNG TY: CỔ PHẦN TMĐT PHÁT TRIỂN CÔNG NGHỆ VIỆT** · **ĐƠN VỊ: PHÒNG DỰ ÁN** · **Họ và tên: Dương Trọng Thắng**
- ⚠️ **CỘT KHÁC**: sheet 2 dùng **`B`** = TÊN CÔNG VIỆC · **`H`** = Tự đánh giá % (⛔ **không phải `G`**) · nửa phải **`K`** = TÊN CÔNG VIỆC (⛔ **không phải `J`**)
- ⭐ **Nhóm có sẵn**: «I. **Dự án VNTECH ERP**» (dòng 12 → mục **13-19**) · «II. Dự án Lisp MTO» (20) · «B. DỰ ÁN THẦU» (32) · «C. CÔNG VIỆC KHÁC» (38) — ⭐ **các dòng mục đang TRỐNG ⇒ form chờ điền** ✓

### ✅ Đã điền **31 ô**
- ⭐ Kỳ báo cáo **29/09 → 05/10/2026** · kế hoạch tuần **06/10 → 12/10/2026**
- ⭐ **07 mục** cho «Dự án VNTECH ERP» (09 lỗi · luồng mua hàng · kiểm toán 214 chức năng · vòng đời + hồi quy 156/156 · giao diện + vệ sinh dữ liệu · …)
- ⭐ **02 mục** «Công việc khác» · ⭐ **07 mục KẾ HOẠCH tuần tới** + 02 mục khác
- ⭐ cột **`H` = 100%** (⭐ đã đặt `NumberFormat='0%'` — ⚠️ ban đầu để `General` nên hiện «1»)
- ⛔ **KHÔNG BỊA**: ⭐ **«II. Dự án Lisp MTO» và «B. DỰ ÁN THẦU» để TRỐNG** (⛔ không có bằng chứng) · ⛔ **các cột giờ công để TRỐNG** ⇒ ⚠️ **Tổng cộng/Hiệu suất còn 0**
- ⛔ **KHÔNG ĐỤNG FILE GỐC**: ⭐ làm trên **bản copy**, lưu thành **`docs/BAO-CAO-TUAN-06-10-2026.xlsx`** (**48,1 KB**) ⇒ ⭐ **file «MẪU BÁO CÁO TUẦN.xlsx» NGUYÊN VẸN** ✓

---

## ③ ⭐⭐⭐ VƯỢT BÀI HỌC «PWSH LÀM HỎNG TIẾNG VIỆT» — ⭐ THÀNH CÔNG

⛔ **Không nhúng tiếng Việt vào lệnh pwsh** ⇒ ⭐ **soạn nội dung bằng công cụ `write` (UTF-8 chuẩn)** thành tệp TSV `Ô<TAB>Giá trị`, rồi script **đọc tệp bằng `[System.IO.File]::ReadAllLines(path, UTF8)`** và **bơm vào Excel qua COM** ✓
⇒ ✅ **KIỂM CHỨNG bằng cách ĐỌC LẠI Ô**: «CÔNG TY: CỔ PHẦN TMĐT PHÁT TRIỂN CÔNG NGHỆ VIỆT» · «Dự án VNTECH ERP» · «Sửa 09 lỗi hệ thống, trong đó 03 lỗi máy chủ HTTP 500…» ⇒ ⭐ **tiếng Việt ĐÚNG hoàn toàn** ✓
⇒ ⭐⭐ **KHUÔN NÀY DÙNG LẠI ĐƯỢC** cho mọi lần ghi tiếng Việt vào Office qua COM ✓

---

## ④ ⚠️ 02 LỖI SCRIPT CỦA TÔI — TỰ PHÁT HIỆN VÀ SỬA

- ⛔ **LỖI 1**: gọi `Resolve-Path 'docs\tmp-w2.xlsx'` ⚠️ **TRƯỚC KHI copy** ⇒ ⭐ file chưa tồn tại ⇒ `Resolve-Path` ném lỗi, `$work` = null ⇒ `Workbooks.Open` hỏng ✓ ✅ **SỬA**: dùng **`Join-Path $root 'docs\tmp-w2.xlsx'`** ✓
- ⛔ **LỖI 2**: khối **`finally` xoá luôn tệp TSV ĐẦU VÀO** ⚠️ ⇒ ⭐ **khi script hỏng thì mất luôn dữ liệu vào** ⇒ phải soạn lại TSV từ đầu ✓ ✅ **SỬA**: ⭐ **⛔ KHÔNG xoá tệp đầu vào trong `finally`** — ⭐ chỉ xoá **sau khi đã thành công** ✓

---

## ⑤ ĐO CUỐI TASK

| Phép đo | Kết quả |
|---|---|
| Kế hoạch vá F2 | ✅ **đã lập** · ⛔ **chưa áp dụng** |
| Định vị 03 test đỏ | ✅ **có số dòng cụ thể** |
| File Excel báo cáo tuần | ✅ **`docs/BAO-CAO-TUAN-06-10-2026.xlsx`** · **31 ô** · sheet 2 «Thắng» |
| ⛔ File gốc | ✅ **nguyên vẹn** |
| ⛔ Nhóm không có bằng chứng | ✅ **để trống** |
| Tiếng Việt | ✅ **đúng** (⭐ soạn qua `write`, ⛔ không qua pwsh) |
| Cây mã nguồn | ✅ **156/156 XANH** · ⛔ không sửa mã |
| ⛔ Thay đổi dữ liệu | **0** |

## ⑥ BÀI HỌC

1. ⭐⭐⭐ **Đọc sheet TRƯỚC khi điền** — sheet 2 có **cột khác** sheet 1 ⇒ ⭐ nếu điền theo sheet 1 sẽ **ghi sai cột**.
2. ⭐⭐⭐ **⛔ Không viết lời gọi hàm theo trí nhớ — phải đọc CHỮ KÝ HÀM.**
3. ⭐⭐⭐ **Tiếng Việt phải soạn qua công cụ `write`, ⛔ không nhúng vào lệnh pwsh** (⭐ lần này áp dụng đúng và **thành công**).
4. ⭐⭐ **⛔ Không xoá tệp ĐẦU VÀO trong khối `finally`.**
5. ⭐⭐ **Phân biệt «cái tôi đo được» và «cái tôi phải hỏi»** — ⭐ điền đủ phần có bằng chứng, ⛔ để trống phần không có.
