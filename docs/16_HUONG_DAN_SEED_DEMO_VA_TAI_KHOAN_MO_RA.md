# Hướng dẫn Seed Demo & Bàn giao tài khoản dữ liệu mẫu PRJ-DEMO-01

Ngày: 2026-09-14

## 1. Kiến trúc đang chạy

- Cổng truy cập duy nhất: **`http://127.0.0.1:9000`** (cutover proxy).
- UI SPA (`:8787`, monolith JS) + API Java backend (jar `:18081`) — cùng đọc ghi MySQL `vntech_erp`.
- Seed chạy qua API `:9000` (→ Java backend) để đúng ngữ nghĩa use-case.

## 2. Tài khoản

### Admin
| Tài khoản | Mật khẩu |
|-----------|----------|
| `admin` | `Admin123456@` |

> Lưu ý: UI monolith (8787) có thể "tự ghi đè" mật khẩu admin giữa chừng (vấn đề môi trường). Nếu admin báo 401, chạy lại seed (nó tự reset hash admin theo chuẩn PBKDF2 Java) hoặc reset thủ công bằng lệnh UPDATE như trong `seed-demo.mjs`.

### 8 user mẫu — mật khẩu chung `VnTech@123`
| User | Vai trò (role) | Phòng (đơn vị) | Ý nghĩa |
|------|----------------|----------------|---------|
| `cha.ht` | `cht` (chỉ huy trưởng) | BCH | Duyệt DNMH bậc 1 |
| `trinhtrench` | `kh_truong` (trưởng phòng KH) | KH | — |
| `trdademo` | `da_truong` (trưởng phòng DA) | DA (DA-01) | Duyệt DNMH bậc 5 |
| `thukydemo` | `thuky` (thư ký TGĐ) | VNTECH | Duyệt DNMH bậc 2 |
| `nvdademo` | `da_nv` (NV dự án) | DA (DA-01) | Duyệt DNMH bậc 3 |
| `nvkhdemo` | `kh_nv` (NV kế hoạch) | KH | Duyệt DNMH bậc 4 |
| `tkhodemo` | `thu_kho` (thủ kho) | BCH | Thao tác kho/xuất trả |
| `kttdemo` | `accountant` (kế toán trưởng) | TCKT | Thao tác tài chính |

## 3. Dữ liệu mẫu PRJ-DEMO-01

### Cấu trúc (idempotent — chạy lại không nhân đôi)
- 6 đơn vị: VNTECH (company), BCH (site_command), DA→dùng `DA-01` (department), KH, TCKT, + `VNTECH-01` (cũ, không dùng).
- Dự án **PRJ-DEMO-01** `active` + kho site `KHO-PRJ-DEMO-01`, hợp đồng **HD-PRJ-DEMO-01**.
- Tổ đội **TD-01** (kho tổ đội riêng), nhà cung cấp **NCC-VTMN**.
- 8 vật tư làm thêm ngoài catalog gốc: `VL-THEP, VL-XIMANG, VL-SAT02, VL-GACH, VL-CAPDIEN, VL-ONGPVC, VL-GACHMEN, VL-SON` + 8 dòng BOQ (BOQ V1).

### Luồng nghiệp vụ hoàn chỉnh (đã duyệt xong 5/5)
| Chứng từ | Số | Trạng thái |
|----------|----|------------|
| Đề nghị mua hàng (DNMH) | `DNMH-PRJ-DEMO-01-2026-0008` | approved (5/5, từng bậc đúng người) |
| Đơn mua hàng | `PO-PRJ-DEMO-01-2026-0005` | completed |
| Phiếu nhập kho | `GRN-PRJ-DEMO-01-2026-0005` | confirmed (+ ảnh giao hàng) |
| Phiếu xuất kho | `PX-PRJ-DEMO-01-2026-0007` | posted |
| Phiếu hoàn trả | `RET-PRJ-DEMO-01-2026-0008` | received |

### Bổ sung (domain phụ trợ)
- **Nhân sự**: 4 hồ sơ NHẬN SỰ (`cha.ht, trdademo, tkhodemo, kttdemo`), 2 hợp đồng lao động (`cha.ht`, `nvdademo`), 1 BHXH (`cha.ht`).
- **Tài chính**: tài khoản NH `VNTECH-BIDV`, 2 bút toán sổ quỹ (thu 2 tỷ / chi 150tr), 2 dòng thanh toán HĐ (`TT-HD-PRJ-DEMO-01-01/02`), 3 mốc kế hoạch giải ngân (`PPL-PRJ-DEMO-01-0001..0003`).
- **Nhật ký thi công**: `CDL-PRJ-DEMO-01-2026-0001` (**approved**).
- **Pháp chế**: công văn đến `CV-2026-001`.

## 4. Vận hành seed

```powershell
# Chạy seed (tạo mới / bổ sung / idempotent, reset mật khẩu admin+user mẫu)
node "java-backend/tools/seed-demo.mjs" "http://127.0.0.1:9000"

# Chạy lại từ đầu sạch giao dịch demo (dùng khi muốn MR/PO mới)
node "C:\Users\PC\AppData\Local\Temp\opencode\clean-mr.js"
node "java-backend/tools/seed-demo.mjs" "http://127.0.0.1:9000"
```

Kết quả chuẩn: `SEED DEMO: 61/61 PASS · 0 FAIL`.

## 5. Lưu ý khi demo
- Đăng nhập UI tại `http://127.0.0.1:9000` bằng `admin` hoặc user mẫu ở mục 2.
- Mỗi user nghiệp vụ thấy đúng dữ liệu của phòng mình; `thukydemo` (thư ký) không gắn kho/tổ đội nên list nghiệp vụ trống (đúng scoping).
- Data cũ không liên quan (dự án `SC161459`, `DA-MAU-01`, GRN/PX của các SC…, đơn vị `VNTECH-01`) là từ các lần chạy trước — có thể dọn nếu cần, không ảnh hưởng demo.