# TASK-086 — `U-10`: MODAL KHÔNG VƯỢT VIEWPORT + VÁ 3 NÚT CHẾT Ở DANH MỤC VẬT TƯ

- **Mã:** TASK-086 · **Ngày:** 18/09/2026 · **Roadmap:** `U-10` (§46 nhóm **P1 — Core Architecture**)
- **Định danh nguồn:** head `drizzle/0127_phase1_ui_modal_dead_button_identity.sql` ⇒ **`VNTECH-FP-AAC82E62564AB037`**
- **Trạng thái:** **DONE phần việc kỹ thuật** — 2 phát hiện, 1 bản vá, **2 cổng mới**.
  ⚠️ **1 điểm cần anh xác nhận** khi test tay (KP #90): bản vá nút chết trỏ về biểu mẫu vật tư **có sẵn**.

## 1. Vì sao có task này

`U-10` trong lộ trình ghi: *"Sửa modal vượt viewport"* (nguồn: `docs/24_SYSTEM_AUDIT_REPORT.md` mục 15 dòng 2).
Nhưng audit **không nói modal NÀO, ở kích thước nào** ⇒ **không thể tin ngay**. Cách làm đúng: **biến nó thành
BẤT BIẾN ĐO ĐƯỢC** rồi đo, thay vì đi sửa CSS theo cảm giác.

## 2. Việc đã làm

### 2.1. Cổng ảnh nay ĐO BẤT BIẾN KHUNG (thay vì chỉ chụp ảnh)
- Thêm **bước `{ click: "<selector>" }`** cho `tools/probe-visual-regression.mjs` để **mở khung rồi mới chụp**
  (chẩn đoán rõ 3 ca: không tìm thấy · **nút bị vô hiệu** · bấm được — mỗi ca là một kết luận khác nhau).
- Sau khi chụp, cổng đo `getBoundingClientRect()` của `.modal`/`.drawer` và **TỪ CHỐI ĐẠT** nếu:
  `top < 0` · `left < 0` · `bottom > chiều cao khung nhìn` · `right > chiều rộng khung nhìn`, **hoặc**
  nội dung cao hơn thân khung mà thân khung **không cuộn được** (⇒ mất nội dung).
- Thêm **3 màn mẫu**: `11-modal-request` (khung rộng nhất) · `12-drawer-request-detail` · `13-modal-material`.

### 2.2. Kết quả ĐO (không suy đoán)

| Khung | Desktop 1920×1080 | Laptop 1366×768 | Tablet 768×1024 | Phone 390×844 |
|---|---|---|---|---|
| `11-modal-request` (modal) | **nằm trọn** | 219,19 → 1147,749 **nằm trọn** | 22,26 → 746,998 **nằm trọn** | 0,1 → 390,844 **nằm trọn** |
| `12-drawer-request-detail` (drawer) | **nằm trọn** | **nằm trọn** | **nằm trọn** | **nằm trọn** |
| `13-modal-material` (modal) | **nằm trọn** | 219,21 → 1147,747 **nằm trọn** | 22,149 → 746,875 **nằm trọn** | 0,19 → 390,844 **nằm trọn** |

⇒ **KHÔNG tái hiện được "modal vượt viewport"** trên 3 khung × 4 kích thước. Bằng chứng củng cố ở CSS:
`globals.css:165` `.modal{max-height:94vh;overflow:hidden}` · `:1005` `.modal{max-height:95vh!important}` ·
`canonical.css:71` ghi rõ *"Giữ ngoại lệ cho modal/drawer vì chúng nằm trong khung đã có chiều cao giới hạn"*.
**Kết luận trung thực:** mục audit này **đã được xử lý từ trước** bởi baseline CSS; lượt này **đo lại và khoá lại
bằng cổng tự động** để không tái phát. **KHÔNG** sửa CSS vì **không có lỗi nào để sửa** (sửa theo cảm giác sẽ là
đúng loại "sửa bừa" mà quy tắc dự án cấm).

### 2.3. 🔴 PHÁT HIỆN THẬT KHI ĐO: **3 NÚT CHẾT ở màn Danh mục vật tư**
Khi dựng màn mẫu `13-modal-material`, cổng báo: nút **bấm được** (`el.disabled === false`) nhưng
**không khung nào mở ra** (`document.querySelector('.modal,.drawer') === null`). Truy nguyên:

- Khung modal cấp ứng dụng là **một chuỗi 36 nhánh** `{modal === "X" && <…/>}` (`app/page.tsx:691`).
- Nút ở `MaterialCatalogPage` gọi `open("material")` ⇒ đặt `modal = "material"` ⇒ **KHÔNG có nhánh nào tên đó**.
- **3 chỗ cùng lỗi:** `＋ Thêm vật tư` · `Sửa` (từng dòng) · `Ngừng` (từng dòng).
- **Đặc điểm lớp lỗi này:** **IM LẶNG** — không exception, không log, `tsc` **EXIT 0**, eslint **0 error**,
  cổng ảnh cũng không thấy (màn không đổi). Chỉ lộ ra khi **bấm thử và ĐO**.

**Bản vá:** trỏ 3 chỗ về **nhánh có thật `materialMaster`** — `{modal === "materialMaster" && <MaterialModal data row={selected} …/>}`,
chính là biểu mẫu vật tư mà màn Quản trị dùng cho **cùng một thực thể**.

**Bằng chứng SAU khi vá (đo lại bằng chính cổng ảnh):** khung **mở ra thật**, và **đúng biểu mẫu**:
tiêu đề *"Thêm mã vật tư gốc"*, đủ 9 trường (Hệ M&E · Nhóm vật tư · Mã vật tư gốc · ĐVT · Tên vật tư · Hãng/NSX ·
Tồn tối thiểu · Quy cách/Thông số · Alias) — kiểm bằng mắt qua ảnh chụp.
⚠️ **Đây là bản vá SUY LUẬN CÓ CĂN CỨ** (nút ghi rõ "Thêm/Sửa/Ngừng vật tư" + đã có sẵn biểu mẫu vật tư dùng chung):
**cần anh xác nhận lại luồng** khi test tay — xem KP #90.

### 2.4. ➕ CỔNG MỚI: `tools/probe-modal-branch-coverage.mjs`
Quét `app/page.tsx`: **mọi `open("X")` phải có nhánh `modal === "X"`**. Chặn vĩnh viễn lớp lỗi "nút chết".
- **2 phép ĐỐI CHỨNG DƯƠNG** (chống "cổng in hằng số"): phải đọc được **≥ 20 nhánh modal** và **≥ 15 tên `open(...)`**;
  không đạt ⇒ **không được kết luận ĐẠT**.
- Kết quả hiện tại: **36 nhánh · 34 tên gọi · 0 tên thiếu nhánh** ⇒ **3 ĐẠT · 0 HỎNG · 1 GHI NHẬN**
  (2 nhánh `categoryMaster` · `forcePassword` không thấy nơi gọi bằng chuỗi literal — **GHI NHẬN**, không tính HỎNG).

## 3. Kiểm chứng

| Cổng | Kết quả |
|---|---|
| `tsc --noEmit` | **EXIT 0** |
| eslint `app/page.tsx` | **0 error** (72 warning, đều có trước) |
| `master-baseline-gate` | **ĐẠT** (`!important=4950` · `css=400643B`) |
| `npm run build` | **EXIT 0** + `BUILT ARTIFACT VALIDATION: ĐẠT` |
| `probe-modal-branch-coverage` (MỚI) | **3 ĐẠT · 0 HỎNG** (36 nhánh · 34 tên) |
| `probe-visual-regression --only=11-/12-/13-` | **ĐẠT ✅ 0 px** cả 4 kích thước **và** khung nằm trọn khung nhìn |
| Bản phục vụ | `VNTECH-FP-AAC82E62564AB037` · UI `:8787` **200** · proxy `:9000` **200** |

## 4. Tệp thay đổi

| Tệp | Nội dung |
|---|---|
| `app/page.tsx` | vá 3 nút chết: `open("material")` → `open("materialMaster")` (Thêm · Sửa · Ngừng) |
| `tools/probe-modal-branch-coverage.mjs` | **MỚI** — cổng chặn "nút chết" (2 đối chứng dương) |
| `tools/probe-visual-regression.mjs` | thêm bước `{ click }` · **đo bất biến khung không vượt viewport** · 3 màn mẫu `11`/`12`/`13` |
| `tools/baseline/11-…` · `12-…` · `13-…` (12 PNG) | **MỚI** — ảnh chuẩn 3 khung × 4 kích thước |
| `drizzle/0127_phase1_ui_modal_dead_button_identity.sql` | **MỚI** — head định danh nguồn (fixed point `VNTECH-FP-AAC82E62564AB037`) |
| `lib/vntech-identity-data.mjs` · `VNTECH_*.txt` · `VNTECH_FINGERPRINT.json` · `MANIFEST_SHA256.txt` | đồng bộ định danh + manifest |
| `docs/agent-progress/TASK-086.md` | **MỚI** — hồ sơ này |

## 5. Việc kế tiếp

1. **Anh xác nhận luồng vật tư** (KP #90): `＋ Thêm vật tư` · `Sửa` · `Ngừng` nay mở biểu mẫu *"mã vật tư gốc"* —
   đúng ý anh chưa? Nếu sai đích, chỉ cần đổi tên nhánh ở 3 chỗ.
2. **Rà tiếp lớp lỗi "nút chết"** ở các màn khác: nút gọi hàm KHÁC (không phải `open(...)`), ví dụ nút gọi
   `action("x")` mà tên action không có trong `ActionRbacRegistry`/`case` của controller — dự án **đã có**
   `probe-action-coverage-controller.mjs` cho phía máy chủ; phía giao diện nay mới có cổng cho `open(...)`.
3. `U-14` — **ÁP DỤNG** `EntityDetailModal` vào 4 chỗ tự viết `.overlay` (việc P1 kế tiếp của nhóm UI).
