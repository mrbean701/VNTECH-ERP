# TASK-228 — HUB «KHO VẬT TƯ»: dọn gọn tab «KHO» (bỏ 5 thứ trùng lặp)

| | |
|---|---|
| **SESSION_ID** | **ERP-SESSION-02** |
| **Ngày** | 07/10/2026 |
| **Nhánh** | `unity` |
| **Trạng thái** | ✅ **DONE — VERIFIED** |
| **Owner** | ERP-SESSION-02 |
| **Ánh xạ 110 mục** | ⛔ **NGOÀI 110 mục** — yêu cầu trực tiếp của user |
| **Tiền nhiệm** | TASK-226 (hub «Kho vật tư») · TASK-227 (danh mục vật tư) |

---

## §1 · YÊU CẦU NGUYÊN VĂN CỦA USER (07/10/2026)

> «snapshoot lại hub Kho vật tư đi, tôi nhìn thấy nó sắp xếp quá lộn xộn rồi»

User **đã chốt phương án** khi được hỏi: **«DỌN GỌN»** + **«giữ 1 chỗ chọn dự án — thanh đầu trang»**.

## §2 · ĐO THẬT TRƯỚC KHI SỬA — tab «KHO» có 10 khối · trang cao **6.202px**

| # | Khối | Vấn đề |
|---|---|---|
| 1 | Toolbar «TỒN KHO & ĐIỀU CHUYỂN» (tìm · sắp xếp · lọc · Xuất Excel · In mã) | — |
| 2 | Hàng **4 KPI** (Tồn khả dụng · Chờ nhập · Chờ xuất · Cảnh báo tồn thấp) | ⚠️ trùng |
| 3 | **DASHBOARD TỒN KHO** (8 chỉ số) | ✅ giữ |
| 4 | Khối «KHO»: toolbar «KHO» + **3 KPI** + **12 cards kho** + nút Xem chi tiết | ⚠️ trùng |
| 5 | Khối có **dải tab LẠ «TỒN KHO \| CHUYỂN KHO \| THẺ KHO»** + bảng tồn kho 11 cột | ⚠️ dải tab gây rối |
| 6 | «Cảnh báo tồn kho» + **«Giá trị tồn kho theo kho»** (13 nút kho) | ⚠️ trùng #4 |

**Trùng lặp cụ thể**: **2 hàng KPI** · **2 danh sách kho** (12 cards lớn + 13 nút nhỏ — *cùng 12 kho, cùng số tồn*) ·
**2 toolbar** · **«Chọn dự án» hiện 3 lần** (thanh đầu trang + nhãn trong card + trong toolbar) · **tiêu đề trùng**
(trang và khối đều «TỒN KHO & ĐIỀU CHUYỂN»).

## §3 · ĐÃ LÀM — `app/screens/Inventory.tsx` (**6 thêm / 10 xoá**)

| # | Việc | Cách làm |
|---|---|---|
| ① | Bỏ **2 nhãn «Phạm vi dự án» trùng** | regex `<label className="list-toolbar-field"><span>Phạm vi dự án…` ⇒ giữ **1 chỗ** = thanh chọn dự án đầu trang (`ProjectScopeSelect` của `app/page.tsx`) |
| ② | **CHUYỂN 2 nút** vào toolbar | «⇄ Chuyển kho» (`open("transfer")`) + «▤ Thẻ kho» (`printInventoryLedger(filtered)`) — ⛔ **không xoá chức năng**; thêm `data-vntech="inv-transfer-btn"` / `"inv-ledger-btn"` để kiểm thử |
| ③ | Bỏ **hàng 3 KPI trùng** | `Số kho` / `Vật tư đang có` / `Phiếu xuất` (đã có 4 KPI đầy đủ hơn ở trên) |
| ④ | Bỏ **dải tab lạ** | `<div className="inventory-tabs">` — nằm TRONG tab KHO nên user dễ tưởng có **5 tab**; khối bảng còn `<section className="card" data-vntech="inventory-table-card">` |
| ⑤ | Bỏ **danh sách kho thứ 2** | `inventory-warehouse-cards-card` — ⛔ **không mất khả năng lọc theo kho**: toolbar đã có ô chọn «Tất cả kho» (`whFilter`) |

**Giữ nguyên**: 4 KPI · DASHBOARD TỒN KHO · 12 cards kho · bảng tồn kho · «Cảnh báo tồn kho».

## §4 · KẾT QUẢ ĐO ĐƯỢC

| Tab | Trước | Sau |
|---|---|---|
| **«KHO»** | **6.202px** · 10 khối | **4.949px** · 9 khối *(giảm 1.253px ≈ 20%)* |
| «XUẤT & NHẬP» | 2.065px | 2.040px |
| «CẤP PHÁT & HOÀN TRẢ» | 2.977px | 2.953px |

## §5 · ⭐ KIỂM CHỨNG «DỌN XONG CÓ HỎNG KHÔNG» — ⛔ KHÔNG HỎNG

```
Bộ lọc «Chọn dự án» : KPI 1.235 → 0 khi chọn DA-MAU-01     ✅ CÒN TÁC DỤNG
Nút «⇄ Chuyển kho»  : bấm ⇒ panel «Tạo phiếu điều chuyển» MỞ ✅
Nút «▤ Thẻ kho»     : có mặt                                ✅
Bộ lọc «Kho»        : CÒN (tự co 3 lựa chọn theo dự án)     ✅ ⛔ không mất
Bảng dữ liệu        : 3 bảng                                ✅
```

**Kiểm 3 tab — 2 tab kia SẠCH** (⛔ không trùng lặp):
- TAB «XUẤT & NHẬP»: 2.040px · 3 khối · 1 bảng · 30 dòng
- TAB «CẤP PHÁT & HOÀN TRẢ»: 2.953px · 3 khối · 3 bảng · 48 dòng

## §6 · KIỂM THỬ

| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | **EXIT 0** |
| `npm run test:regression` | **803 test · 802 pass · 0 fail · 1 skip** |
| E2E thật `:9000` | `TEST-20261007-022` · `TEST-20261007-024` · `TEST-20261007-025` — **PASS** |
| Build | **EXIT 0** · **BUILT ARTIFACT VALIDATION ĐẠT** |

**Bằng chứng ảnh**: `docs/dsh-mutil-session/SESSION_B/anh-hub-kho-07-10/` (trước + sau, 6 ảnh).

## §7 · ⚠️ BÀI HỌC KỸ THUẬT (ghi để ⛔ không lặp)

1. **LẦN 1 HỎNG**: cắt cả **vỏ bọc** `<div className="inventory-bottom-grid">` nhưng chỉ xoá `</div>}` ở cuối
   ⇒ **lệch JSX** (`TS17008` / `TS17002`). ✅ **CÁCH ĐÚNG: chỉ xoá nguyên tố TRỌN VẸN**, ⛔ không đụng vỏ bọc cha.
2. **KHÔI PHỤC AN TOÀN**: `git show HEAD:app/screens/Inventory.tsx > app/screens/Inventory.tsx`
   — **chỉ ĐỌC từ git**, ⛔ **KHÔNG** dùng `git checkout .` / `git reset --hard` (Goal §38).
   Kiểm chứng: `git diff --stat` **RỖNG** + `tsc EXIT=0`.
3. **`extra={}` rỗng sau khi bỏ nội dung ⇒ LỖI JSX** (`TS17000`) ⇒ phải xoá **cả thuộc tính**.
4. **`Stop-Process` trên `local-server.mjs` làm CHẾT job runner của DSH** (2 lần, exit `4294967295`)
   ⇒ ✅ dùng **`taskkill /F /PID`** (tiến trình ngoài) — **an toàn** — hoặc **không dừng** khi cổng `8787` đã trống.
   ⛔ Vẫn phải xác minh `CommandLine` chứa `scripts/local-server.mjs` trước khi kill (Goal §36).

## §8 · TRUY VẾT

`CHG-20261007-002` · `DEV-20261007-005` · `TEST-20261007-022/024/025` · `EVT-20261007-028/029/030`
