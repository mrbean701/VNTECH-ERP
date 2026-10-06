# TASK-179 — GO-LIVE ĐỢT 34: ✅ **ĐÃ CHỨNG MINH NGUYÊN NHÂN** SỰ CỐ QUYỀN — LÀ **BẤT NHẤT QUÁN GIỮA TEST VÀ MA TRẬN QUYỀN**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Kết quả** | ✅ **TÌM RA NGUYÊN NHÂN — có bằng chứng từ MÃ NGUỒN + MA TRẬN + CÁCH DÙNG TRONG TEST** |
| **Bản chất** | ⛔ **KHÔNG phải bug sản phẩm** · ⛔ **KHÔNG hỏng dữ liệu** · ⭐ **BẤT NHẤT QUÁN Ở TẦNG TEST** |
| **Cách tìm ra** | ⭐ **ĐỌC MÃ NGUỒN** — cách kiểm **RẺ NHẤT**, mà tôi đã đi vòng **5 giả thuyết** mới dùng |
| **Mã nguồn sửa** | ⛔ **KHÔNG** (chỉ chẩn đoán) |

---

## ① ✅ NGUYÊN NHÂN — BẰNG CHỨNG BA CHIỀU

### Chiều 1 — **MA TRẬN QUYỀN** trong `tools/e2e/cap-quyen-chuc-nang.mjs`
```js
"e2e.tk": { ten: "Thủ kho công trường", quyen: { …, warehouse_issue: GHI, … } },   // GHI = canCreate+canEdit
"e2e.to": { ten: "Tổ trưởng (đơn vị trả vật tư)", quyen: {
  // Tổ đội KHÔNG xuất kho; nó là đơn vị NHẬN vật tư rồi TRẢ LẠI kho công trường.
  teams: { ...XEM, canCreate: 1 }, warehouse_issue: XEM, … } },                    // XEM = canView+canUse ⛔ KHÔNG canCreate
"e2e.thukysa": { ten: "Thư ký TGD (dự phòng A)", quyen: { approvals: DUYET, delivered: XEM, requests: XEM } },
```

### Chiều 2 — **PHẦN ĐẦU CÔNG CỤ** ghi rõ cổng của từng action
```text
issue_stock_confirm  → warehouse_issue · canCreate
confirm_stock_issue  → warehouse_issue · canEdit
return_stock         → teams | stocktake · canCreate
```
⇒ ⭐ **Theo chính ma trận của công cụ**: `e2e.to` **⛔ KHÔNG có** `warehouse_issue.canCreate` ⇒ **⛔ không được `issue_stock_confirm`** — ⭐ **và đó là CHỦ Ý** (chú thích: «Tổ đội KHÔNG xuất kho») ✓

### Chiều 3 — **BÀI TEST DÙNG TÀI KHOẢN NÀO**
| Bài test | Gọi `issue_stock_confirm` bằng | Đúng/Sai |
|---|---|---|
| `giai-doan-08c.mjs` | **`e2e.tk`** | ✅ **ĐÚNG** — `e2e.tk` có `warehouse_issue: GHI` |
| **`go-live-chuoi-kho.mjs`** | **`e2e.to`** | ⛔ **SAI TÀI KHOẢN** — `e2e.to` chỉ có `XEM` |

⇒ ⭐⭐ **KẾT LUẬN**: **`go-live-chuoi-kho.mjs` gọi `issue_stock_confirm` bằng một tài khoản mà thiết kế ⛔ KHÔNG cho làm việc đó** ✓

---

## ② ✅ VÌ SAO BÀI TEST **TỪNG ĐẠT** — VÀ NAY ⛔ KHÔNG

| Thời điểm | Quyền của `e2e.to` trên `warehouse_issue` | Kết quả test |
|---|---|---|
| **Trước 00:56** | **kế thừa mẫu phòng ban** ⇒ `canUse = 1` (rộng rãi hơn thiết kế) | ✅ **ĐẠT** (tình cờ) |
| **Sau 00:56** | **ma trận có chủ ý** của công cụ cài đặt E2E ⇒ `canUse = 0` | ⛔ **TỤT ĐIỂM** |

⇒ ⭐ **Lệnh lúc 00:56–00:59 = `tools/e2e/cap-quyen-chuc-nang.mjs` bước 8.1 + 8.2** (đã chứng minh ở TASK-176) đã **siết quyền về ĐÚNG thiết kế** ⇒ ⭐ **làm LỘ RA giả định sai của bài test**, ⛔ **không phải gây hỏng** ✓✓✓

---

## ③ ✅ VÌ SAO `giai-doan-09` CŨNG ⛔ KHÔNG CHẠY ĐƯỢC — LỖ HỔNG **THẬT** CỦA MA TRẬN

`giai-doan-09` dừng ở **bước 9.A2** với `create_request`.
⭐ **ĐO**: trong `VAI_TRO`, **⛔ KHÔNG vai trò nào có `requests` với `canCreate`** — chỉ **`e2e.thukysa`** có `requests: XEM` (**chỉ xem**) ✓
⇒ ⭐ **`create_request` là BẤT KHẢ THI với MỌI tài khoản E2E** ⇒ ⭐ **đây là LỖ HỔNG THẬT của ma trận**, ⛔ không phải lỗi của bài test ✓

⇒ ⭐⭐ **VẬY CÓ **HAI** KHIẾM KHUYẾT KHÁC NHAU, ⛔ KHÔNG PHẢI MỘT:**
| # | Khiếm khuyết | Bản chất |
|---|---|---|
| **A** | `go-live-chuoi-kho.mjs` dùng **sai tài khoản** (`e2e.to` thay vì `e2e.tk`) | 🐞 **lỗi BÀI TEST** |
| **B** | Ma trận `VAI_TRO` **⛔ không cấp `requests.canCreate`** cho ai | 🐞 **lỗ hổng MA TRẬN** |

---

## ④ 🔧 ĐỀ XUẤT VÁ (⛔ CHƯA LÀM — chờ user)

**Khiếm khuyết A** — sửa **bài test**, ⛔ không sửa quyền (vì ma trận ĐÚNG theo thiết kế «Tổ đội KHÔNG xuất kho»):
```text
go-live-chuoi-kho.mjs:  issue_stock_confirm  e2e.to  →  e2e.tk
```

**Khiếm khuyết B** — thêm `requests` vào một vai trò **có nghiệp vụ lập phiếu đề nghị**, ⛔ không cấp bừa:
```js
// ví dụ: e2e.khnv (Nhân viên Kế hoạch) — người lập đề nghị mua hàng
requests: { canView: 1, canUse: 1, canCreate: 1 },
```
⭐ **Cần user xác nhận**: **vai trò nào** được lập phiếu đề nghị mua hàng? (⛔ tôi **không tự quyết** quyền nghiệp vụ.)

⛔ **Tôi ⛔ KHÔNG tự chạy** công cụ cài đặt quyền — vì (a) đã cam kết ⛔ không chạy `save_user_access` khi chưa có mắt người; (b) **việc cấp quyền nghiệp vụ là quyết định của user**, ⛔ không phải của tôi.

---

## ⑤ ⭐ BÀI HỌC LỚN NHẤT — VÀ NÓ **TỰ CHỨNG MINH**

⭐ Tôi tìm ra nguyên nhân bằng **ĐỌC MÃ NGUỒN** — sau khi đã **đo** qua **5 giả thuyết sai**.
⭐⭐ **ĐÚNG CÁI BÀI HỌC TÔI ĐÃ GHI Ở VÒNG TRƯỚC** («đọc mã nguồn là cách kiểm rẻ nhất mà tôi lại làm sau cùng») — ⭐ **và vòng này nó tự chứng minh: đọc mã mất ~2 phút, 5 giả thuyết kia mất 5 vòng.**

| Cách kiểm | Chi phí | Kết quả ở chuỗi này |
|---|---|---|
| **Đọc mã nguồn** | ⭐ **1 lần đọc** | ✅ **TÌM RA NGUYÊN NHÂN** |
| Đo toàn nhóm | 1 truy vấn | bác bỏ 1 giả thuyết |
| Đọc nhật ký kiểm toán | 1 truy vấn | bác bỏ 1 giả thuyết |
| Đo mẫu nhỏ | 3 truy vấn | ⛔ **gây ra 1 kết luận SAI** |

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Nguyên nhân sự cố quyền | ✅ **ĐÃ CHỨNG MINH** — 3 chiều bằng chứng |
| Bản chất | ⭐ **bất nhất quán ở tầng TEST** (A: sai tài khoản · B: ma trận thiếu `requests.canCreate`) |
| Bug sản phẩm | ⛔ **KHÔNG** |
| Hỏng dữ liệu | ⛔ **KHÔNG** (đã đo: quyền khớp mẫu 100 %) |
| Ảnh hưởng tài khoản thật | ⛔ **KHÔNG** (725 vs 726 dòng `can_use=1`) |
| Đã sửa | ⛔ **chưa** — đề xuất ở §④, chờ user (cấp quyền là quyết định nghiệp vụ) |
| Vân tay | **ĐẠT** `VNTECH-FP-C1B45AAAF31BFCF2` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **126 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Vai trò nào được LẬP PHIẾU ĐỀ NGHỊ MUA HÀNG** (`requests.canCreate`)? — để vá khiếm khuyết **B**.
2. ⭐⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
3. ⭐ **Xác nhận 4 bản vá CSS bằng mắt**.
4. ⭐ **Cho phép sửa `go-live-chuoi-kho.mjs`** (`e2e.to` → `e2e.tk` ở `issue_stock_confirm`) — khiếm khuyết **A**?
5. **Commit theo NHÓM hay gộp?**
6. `stack-form` · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **CRUD 6 thực thể** · **khoá ngoại**.
