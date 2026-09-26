# 23 — BASELINE GĐ0: CHỈ SỐ XUẤT PHÁT VÀ LƯỚI AN TOÀN

- **Thuộc:** `docs/22` giai đoạn GĐ0 (Chốt baseline và dựng lưới an toàn)
- **Ngày lập:** 16/09/2026
- **Mục đích:** có thước đo khách quan TRƯỚC khi chạm vào tầng CSS, để mọi thay đổi
  ở GĐ2–GĐ4 đều có thể chứng minh là không gây hồi quy.

---

## 1. ⚠️ Đính chính số đo của các báo cáo trước

Các con số công bố ở `docs/21` và `docs/22` **thấp hơn thực tế** vì lệnh
`Measure-Object -Line` của PowerShell **bỏ qua dòng trống**. Số dưới đây là số ĐÚNG
(tổng số dòng, kể cả dòng trống), đo bằng `(Get-Content <tệp>).Count` và đối chiếu
với `tools/probe-css-budget.mjs`.

| Tệp | Báo cáo cũ | **Số đúng (trước GĐ1)** | Sau GĐ1 |
|---|---:|---:|---:|
| `app/page.tsx` | 3.899 | **4.057** | 4.057 |
| `app/globals.css` | 2.723 | **2.724** | 2.724 |
| `app/styles/canonical.css` | 701 | **761** | **747** |
| `app/styles/font-floor.css` | 258 | **262** | **264** |
| `app/styles/tokens.css` | — | — | **200** (mới) |

Số khai báo hàm cấp cao trong `app/page.tsx`: **218** (không phải ~145).

---

## 2. Nợ CSS đo được — TRƯỚC và SAU GĐ1

Đo bằng `node tools/probe-css-budget.mjs`. Mọi chỉ số đếm trên bản **đã bỏ comment**
(nhắc tới một từ khoá trong ghi chú giải thích không phải là nợ).

| Chỉ số | Trước GĐ1 | **Sau GĐ1** | Trần | Xu hướng |
|---|---:|---:|---:|---|
| Số lần khai báo ưu tiên cao (`!important`) | 5.014 | **5.013** | 5.014 | giảm 1 ✅ |
| Số lần xuất hiện `.table-wrap` | 52 | **48** | 52 | giảm 4 ✅ |
| Selector định nghĩa trùng | 1.219 | **1.218** | 1.219 | giảm 1 ✅ |
| `font-size` dưới sàn 10px | 14 | **14** | 14 | giữ nguyên ✅ |
| Tổng số dòng CSS (ngoài sổ token) | 3.747 | **3.735** | 3.747 | giảm 12 ✅ |
| Số tệp CSS | 3 | **4** | — | +1 (sổ token) |
| Sổ token (ngoài trần) | — | **200** | — | theo dõi riêng |

### 2.1 Vì sao tách "sổ token" ra khỏi trần số dòng

`tokens.css` chỉ khai báo biến thiết kế, **không tạo quy tắc tạo hình nào**
(1 khối `:root`, 0 `!important`, 0 selector trùng). Sổ token lớn lên là **từ vựng
thiết kế phong phú hơn**, không phải nợ CSS. Vì vậy số dòng của nó được báo riêng và
**không** tính vào trần `lines` (xem `LEDGER_FILES` trong `tools/probe-css-budget.mjs`).

### 2.2 Phân bố nợ theo tệp (trước GĐ1)

| Tệp | Dòng | `!important` | Quy tắc | Khối selector trùng |
|---|---:|---:|---:|---:|
| `app/globals.css` | 2.724 | 4.950 | 3.415 | **1.183** |
| `app/styles/canonical.css` | 761 | 63 | 134 | 27 |
| `app/styles/font-floor.css` | 262 | 1 | 2 | 0 |

**Phát hiện quan trọng:** `globals.css` có **1.183 khối selector bị định nghĩa trùng
nhau**. Đây là **lý do gốc** khiến 4.950 khai báo ưu tiên cao phải tồn tại để phân xử
xem quy tắc nào thắng. Con số này là căn cứ định lượng cho GĐ2 — không phải ý kiến
chủ quan về "code xấu".

### 2.3 Nguồn gốc các cỡ chữ dưới sàn (do `tools/gen-font-floor.mjs` phát hiện)

`font-floor.css` nâng **120 selector** lên sàn 10px. Phân bố cỡ chữ gốc:

| Cỡ gốc | Số selector | Đọc được trên màn hình thường? |
|---|---:|---|
| 7px | 4 | không |
| 7.5px | 6 | không |
| 7.7px | 1 | không |
| 7.8px | 1 | không |
| **8px** | **74** | không |
| 8.25px | 1 | không |
| 8.3px | 1 | không |
| **8.5px** | **29** | không |
| 8.7px | 2 | không |
| 8.8px | 1 | không |

Đây là bằng chứng định lượng cho lý do chọn sàn 10px (xem `docs/22` GĐ1 mục 3 và
phần chú thích trong `app/styles/tokens.css`).

---

## 3. Lưới an toàn 1 — `tools/probe-visual-regression.mjs`

Cổng chặn hồi quy thị giác. Chụp bằng **Microsoft Edge thật qua CDP** (headless), đăng
nhập thật, điều hướng thật bằng cách bấm menu.

### 3.1 Phạm vi chụp

**7 màn × 4 kích thước = 28 ảnh**, lưu tại `tools/baseline/`.

| Màn | Nhãn |
|---|---|
| `01-dashboard` | Tổng quan điều hành |
| `02-project` | Quản lý dự án |
| `03-work` | Công việc |
| `04-team` | Tổ đội |
| `05-material` | Danh mục vật tư gốc |
| `06-warehouse` | Kho Tổng |
| `07-admin` | Danh mục & phân quyền |

| Kích thước | Điểm ảnh |
|---|---|
| desktop | 1920×1080 |
| laptop | 1366×768 |
| tablet | 768×1024 |
| phone | 390×844 |

### 3.2 Bộ giải mã PNG tự viết

Dự án **không có thư viện ảnh nào** (không `sharp`, `pngjs`, `pixelmatch`). Bộ giải mã
được viết trực tiếp trong probe, dùng `fflate` để giải nén.

**Bài học đã trả giá:** `inflateSync` của `fflate` chỉ nhận **raw deflate**, còn IDAT
của PNG là **zlib** (2 byte đầu `78 9c`). Dùng sai hàm cho ra dữ liệu rác —
62.748 byte thay vì 6.221.880 byte, với filter byte đầu là `147` (vô lệ). Phải dùng
**`unzlibSync`**. Lỗi này chỉ lộ ra khi chạy `--selftest` vì chế độ `--update` không
giải mã ảnh.

### 3.3 Nhiễu nền — đo được và xử lý

Chạy `--selftest` (chụp 2 lần cùng một màn rồi so nhau):

- **27/28 ảnh lệch 0 điểm ảnh** ⇒ trình duyệt render **hoàn toàn tất định**.
- **1 ảnh lệch đúng 1001 điểm ảnh**, lặp lại y hệt ở hai màn khác nhau, tại vùng trang
  **(1619,27) kích thước 274×27**.

Khoanh vùng bằng `--locate` và `--crop`, rồi phân tích cặp màu:

| Cặp màu | Số điểm ảnh |
|---|---:|
| `#fffff4` → `#f9fafb` | 87 |
| `#0c2e9c` → `#4c657e` | 107 |
| `#0c89d3` → `#8798a9` | 100 |

Vàng nhạt và xanh đậm bị đổi thành xám ⇒ đây là **icon sáng/tối (☀☾)** và **khối người
dùng** trong thanh tiêu đề **đổi trạng thái chủ đề**, **không phải lệch bố cục**.

**Xử lý:** hai phần tử `.theme-switch` và `.user-menu` bị ẩn bằng
`visibility:hidden` (KHÔNG dùng `display:none`, để giữ nguyên bố cục thanh tiêu đề)
trong lúc đo. Việc loại trừ được ghi rõ trong mã nguồn probe kèm bằng chứng.

⚠️ **Hệ quả cần biết:** cổng so ảnh **không kiểm tra** 2 phần tử này. Đây là vùng mù
có chủ ý và đã ghi lại; mọi vùng còn lại được kiểm tra tới từng điểm ảnh.

### 3.4 Kết quả kiểm chứng cổng

Sau khi loại trừ 2 phần tử trên: **28/28 ảnh lệch 0 điểm ảnh** ✅ — cổng hoạt động ở
ngưỡng nghiêm ngặt nhất (0 điểm ảnh).

### 3.5 Các chế độ

| Lệnh | Việc |
|---|---|
| `node tools/probe-visual-regression.mjs` | So với ảnh chuẩn, chặn nếu lệch |
| `--update` | Chụp lại ảnh chuẩn |
| `--selftest` | Đo nhiễu nền (chụp 2 lần rồi so nhau) |
| `--only=<mã màn>` | Chỉ chạy một màn |
| `--max-diff-pixels=N` | Nới ngưỡng |
| `--locate=x,y` | In chồng phần tử tại toạ độ |
| `--crop=x,y,w,h` | Chụp 2 lần vùng này, phóng to 3×, phân tích cặp màu và dải dòng lệch |

---

## 4. Lưới an toàn 2 — `tools/probe-css-budget.mjs`

Đếm nợ CSS và **chặn trần**. Nguyên tắc: **chỉ được giảm, không được tăng**.

Trần lưu tại `tools/css-budget.json`. Có 3 chế độ: mặc định (kiểm tra và chặn),
`--init` (ghi lại trần hiện tại), `--report` (chỉ in, không chặn).

Chỉ số được chặn: số lần `!important`, số lần `.table-wrap`, số selector định nghĩa
trùng, số `font-size` dưới sàn 10px, tổng số dòng CSS — **toàn cục và theo từng tệp**.

---

## 5. GHI CHÚ VẬN HÀNH

⚠️ **Không dùng `Measure-Object -Line` của PowerShell để đếm dòng tệp** — nó bỏ qua
dòng trống. Dùng `(Get-Content <tệp>).Count` hoặc `tools/probe-css-budget.mjs`.

⚠️ **Không tắt tiến trình bằng `Get-Process node | Stop-Process`** — DSH harness chạy
trên node nên lệnh đó giết luôn chính phiên làm việc. Chỉ dừng đúng PID của Node UI
(:8787) và proxy (:9000).

⚠️ Sau mỗi lần DSH khởi động lại, **3 dịch vụ phải dựng lại** (MySQL là Windows service
nên sống sót): Java :18081, Node UI :8787, proxy :9000.

---

## 6. KẾT QUẢ NGHIỆM THU GĐ1

Ngày 16/09/2026. Định danh nguồn: **`VNTECH-FP-8FC9BC9BAB724BE2`** (227 file nguồn),
đầu migration `0101`, manifest 778 file.

### 6.1 Kết quả 4 cổng

| Cổng | Kết quả |
|---|---|
| Cổng ảnh — chứng minh GĐ1 không đổi một điểm ảnh | **28/28 ảnh lệch 0 điểm ảnh** ✅ |
| 13 probe hiện có | **13/13 ĐẠT** ✅ |
| Cổng ngân sách CSS | **ĐẠT** — mọi chỉ số giảm hoặc giữ nguyên ✅ |
| Token có mặt trong bản chạy | **10/10 token**, đúng thứ tự tầng ✅ |

### 6.2 Kiểm chứng thứ tự tầng trong gói CSS đã build

Đọc trực tiếp `dist/client/assets/index-*.css` (392 KB, một gói duy nhất):

| Token | Có mặt? |
|---|---|
| `--vt-gap-1`, `--vt-gap-5` | ✅ |
| `--vt-font-min`, `--vt-font-floor` | ✅ |
| `--vt-control-h`, `--vt-radius` | ✅ |
| `--vt-scroll-thumb`, `--vt-break-desktop` | ✅ |
| `--vt-c-accent` (token mới), `--vt-space-3` (token mới) | ✅ |

Thứ tự byte trong gói: token mới tại vị trí **289**, token cũ tại **80.023**
⇒ `tokens.css` **đứng đầu tầng** đúng như thiết kế.

### 6.3 Vì sao kết quả "0 điểm ảnh" là bằng chứng mạnh

GĐ1 chỉ **chuyển nơi khai báo** 16 token và **thêm tên** cho các giá trị cứng — không
thay thế giá trị nào trong quy tắc tạo hình. Nếu việc chuyển nơi khai báo làm sai
(thiếu tệp, sai thứ tự dẫn tới biến không được định nghĩa), thì `var(--vt-gap-1)` sẽ
không phân giải được và bố cục sẽ **vỡ thấy rõ** — cổng ảnh sẽ bắt ngay ở ngưỡng
0 điểm ảnh. Kết quả 28/28 trùng khít xác nhận việc gom token là **hoàn toàn trung tính
về mặt thị giác**.

### 6.4 Tình trạng các giai đoạn

| GĐ | Trạng thái |
|---|---|
| GĐ0 — Lưới an toàn | ✅ **HOÀN TẤT** |
| GĐ1 — Hệ token thiết kế | ✅ **HOÀN TẤT** |
| GĐ2 — Viết lại tầng CSS có cấu trúc | ⛔ **CHỜ NGƯỜI DÙNG DUYỆT** |
| GĐ3 — Tách `app/page.tsx` thành module | ⛔ Chờ duyệt |
| GĐ4 — Chuẩn hoá thành phần giao diện | ⛔ Chờ duyệt |
| GĐ5 — Rà soát toàn diện | ⛔ Chờ duyệt |

**Chưa commit và chưa push bất kỳ thay đổi nào.**

