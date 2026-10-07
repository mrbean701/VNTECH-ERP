# TASK-225 — GO-LIVE: 🐞 **BUG-20261006-001** (user báo) — «PHẦN BÁO LỖI ⛔ CHƯA HIỂN THỊ DANH SÁCH»

| | |
|---|---|
| **Ngày** | 06/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Nguồn** | ⭐ **USER BÁO TRỰC TIẾP**: *«phần báo lỗi chưa hiển thị được danh sách báo lỗi của user gửi lên»* |
| **Trạng thái** | ✅ **`FIXED`** · ⭐ **`VERIFIED` ở mức BUNDLE** · ⛔ **chưa `VERIFIED` bằng mắt user** · ⭐ **hồi quy 780/780 đạt** · ✅ **đã áp lên `:8787` VÀ `:9000`** |
| **Vân tay** | ⚠️ **ĐỔI**: `VNTECH-FP-018A1FB2E849579E` ⇒ ⭐ **`VNTECH-FP-FC5EF3638B86E74D`** (713 tệp) |
| **Nhật ký** | `testlog.md` mục **616 → 620** |

---

## ① PHÂN LOẠI — ⭐ **CAO** (High)

⭐ Theo §4: **chức năng quan trọng bị lỗi · người dùng ⛔ không hoàn thành được công việc** — ⭐ **quản trị viên ⛔ không xem được báo lỗi người dùng gửi lên** ⇒ ⭐ **kênh tiếp nhận phản hồi của hệ thống bị tê liệt** ✓
⚠️ **Và nghiêm trọng hơn**: lỗi **gây HIỂU SAI** — ⭐ người dùng tưởng **«không có báo lỗi nào»** trong khi thực chất là **«không có quyền xem»** ✓

---

## ② TRUY VẾT 6 TẦNG (⭐ §3: `UI → API → BACKEND → DATABASE → PERMISSION → WORKFLOW`)

| Tầng | ⭐ Kết quả ĐO ĐƯỢC | Kết luận |
|---|---|---|
| **DATABASE** | ⭐ Bảng `error_reports` có **16 dòng** (13 `open` · 03 `resolved`) | ✅ **DỮ LIỆU CÓ** |
| **BACKEND · API** | ⭐ Gọi action `error_reports` bằng `admin` ⇒ **HTTP 200 · trả về ĐÚNG 16 report** | ✅ **API ĐÚNG** |
| **PERMISSION** | ⭐ `ActionRbacRegistry:61` = `Map.entry("error_reports", List.of("admin"))` + `:352` = `"canView"` ⇒ ⛔ **`e2e.ns` · `e2e.khnv` ⇒ HTTP 403** «Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.» | ⚠️ **theo thiết kế** (chỉ quản trị viên) |
| ⛔ **UI — NGUYÊN NHÂN GỐC** | ⛔ `app/screens/ErrorReportAdminPanel.tsx` dòng 43 (bản cũ): `void fetchReports().then((rows) => { if (active) setReports(rows); });` ⚠️ **KHÔNG có `.catch()`** | ⛔ **NUỐT LỖI IM LẶNG** |

### ⭐⭐ CHUỖI GÂY LỖI
```text
Người dùng mở tab «Báo lỗi» (⭐ tab VẪN HIỆN dù ⛔ không có quyền)
   ↓
UI gọi action `error_reports`
   ↓
Backend trả 403 «Tài khoản chưa được quản trị viên cấp đúng quyền…»
   ↓
⛔ Promise bị REJECT — ⚠️ nhưng UI ⛔ KHÔNG có `.catch()`
   ↓
`reports` ở lại mảng RỖNG `[]`
   ↓
⭐ UI hiện «Chưa có báo lỗi nào.»  ⚠️ GÂY HIỂU SAI HOÀN TOÀN
```

⇒ ⭐ **2 LỖI**:
- ⭐ **BUG-A (UI · mức CAO)**: **nuốt lỗi im lặng** ⇒ trạng thái rỗng gây hiểu sai ✓
- ⭐ **BUG-B (thiết kế · mức TRUNG BÌNH)**: tab «Báo lỗi» **hiện cho cả người ⛔ không có quyền** ⇒ ⚠️ nên **ẩn tab** hoặc **hiện thông báo rõ** ✓

---

## ③ BẢN VÁ — ⭐ **TẦNG UI** ⇒ ⛔ **KHÔNG cần triển khai Java**
⭐ Chỉ sửa **`app/screens/ErrorReportAdminPanel.tsx`** (⭐ `SMALL SAFE FIX` theo §12):

| # | Sửa gì |
|---|---|
| 1 | ⭐ Thêm state **`loadError`** |
| 2 | ⭐ `load()` bọc **`try/catch`** ⇒ khi lỗi thì `setLoadError(...)` ⛔ không để danh sách rỗng gây hiểu sai |
| 3 | ⭐ `useEffect` thêm **`.catch()`** (⭐ vẫn giữ chống `active` như bản cũ) |
| 4 | ⭐ Giao diện: ⛔ **không hiện «Chưa có báo lỗi nào» khi có lỗi** — ⭐ thay bằng **khối `.inline-alert`** nói rõ: *«Không tải được danh sách báo lỗi. {thông điệp lỗi} · Thao tác này chỉ dành cho **quản trị viên**. Nếu là quản trị viên, hãy kiểm tra lại quyền của tài khoản ở mục «Phân quyền công việc / Chức năng».»* |
| 5 | ⭐ Bảng chỉ hiện khi **`!loadError && reports.length`** |

⭐ **Chú thích trong mã ghi đủ**: triệu chứng · **truy vết 6 tầng** · nguyên nhân gốc · cách sửa · mã lỗi ✓ (⭐ ⛔ không dùng inline style — ⭐ dùng lớp nhà có sẵn `.inline-alert` / `.admin-empty`) ✓

---

---

## ③b. ⭐⭐⭐ PHÉP ĐO QUYẾT ĐỊNH — **ĐÃ CHỨNG MINH KỊCH BẢN CỦA USER BẰNG MÃ NGUỒN**

⭐ **CÂU HỎI CÒN THIẾU**: ⚠️ *«Nếu user đang dùng tài khoản **quản trị viên** thì bản vá 403 ⛔ không giải quyết được việc của họ»* ⇒ ⭐ **phải xác định tab «Báo lỗi» có hiện cho người ⛔ không có quyền hay không** ✓

⭐ **KẾT QUẢ ĐỌC MÃ** (`app/page.tsx`):
```tsx
const steps = ADMIN_STEP_LABELS;                                  // dòng 2614 — ⭐ TOÀN BỘ nhãn bước, ⛔ KHÔNG lọc theo quyền
...
{step===10 && <PersonalExceptionManager … />}                     // ⛔ không bước nào bị gác quyền
{step===11 && <AuditLogManager … />}
{step===12 && <TrustLockAdmin … />}
{step===14 && <ErrorReportAdminPanel data={data} submit={action} />}   // dòng 2649
```
⭐ **VÀ chú thích trong `ErrorReportAdminPanel` dòng 12-13** ghi rõ: *«⛔ Phân quyền: action `error_reports` + `mark_error_report_resolved` gắn module `admin` ⇒ **chỉ quản trị viên mới mở được tab này (backend chặn, ⛔ KHÔNG CHỈ ẨN UI)**»* ✓

### ⇒ ⭐⭐ KẾT LUẬN CHẮC CHẮN
```text
Bước 14 «Báo lỗi» HIỆN cho MỌI người mở được màn Quản trị hệ thống
   ⛔ NHƯNG action `error_reports` chỉ cho module `admin`
   ⇒ 403
   ⇒ ⛔ UI nuốt lỗi (BUG-A)
   ⇒ ⭐ hiện «Chưa có báo lỗi nào.»   ← ⭐ ĐÚNG TRIỆU CHỨNG USER BÁO
```
⇒ ⭐ **BẢN VÁ BUG-A GIẢI QUYẾT ĐÚNG VẤN ĐỀ CỦA USER** ✓

### ⚠️ BUG-B — ⭐ **TÔI ⛔ KHÔNG TỰ VÁ, PHẢI HỎI USER** (⭐ bài học vòng 66)
⭐ **Vì sao**: ⛔ **không bước nào khác của màn Quản trị bị gác quyền** ⇒ ⭐ nếu chỉ gác riêng bước 14 thì **LỆCH MẪU NHÀ** ⚠️ và ⚠️ **có rủi ro làm admin mất tab** nếu điều kiện sai ✓
⇒ ⭐ **2 lựa chọn chờ user chốt**:
1. ⭐ **Gác bước 14 theo quyền module `admin`** (⭐ ẩn tab với người ⛔ không có quyền) — ⚠️ lệch mẫu
2. ⭐ **Cấp quyền `canView` cho vai trò khác** (⭐ ví dụ trưởng phòng / ban giám đốc) để họ xem được báo lỗi ✓
⇒ ⭐ **Cho tới khi user chốt, bản vá BUG-A là ĐỦ**: ⭐ người dùng **thấy thông báo RÕ** thay vì bị nói dối ✓

### ⚠️ PHÁT HIỆN PHỤ — ⭐ **đã đo, ⛔ CHƯA kết luận là lỗi**
- ⚠️ **9/16 report có `username` RỖNG** — ⭐ nhưng **truy tiếp thì thấy**: `ErrorReportModal:52-57` **CÓ gửi** `userId`/`username`/`fullName`/`employeeCode`/`organizationUnitId`/`organizationName` ✓
- ⭐ **Và report do UI gửi** (`ER202610021604-6DB4`) **CÓ đủ người gửi** (`nvdademo` / «Nguyen Van A») ✓
- ⇒ ⭐ **các dòng rỗng đều là dữ liệu KIỂM THỬ cũ** (⭐ tiêu đề «GOP Y KIEM THU» · «KIEM THU TINH NANG» · «SAU KHI XOA TK THU») ⛔ **chưa chứng minh được lỗi này ảnh hưởng user thật** ✓
- ⚠️ **NHƯNG có RỦI RO THIẾT KẾ THẬT**: `ErrorReportUseCase.save` (dòng 69-74) lấy thông tin người gửi **TỪ PAYLOAD do client gửi lên** ⛔ **KHÔNG lấy từ PHIÊN ĐĂNG NHẬP** (⭐ hàm **⛔ không có tham số `Principal`**) ⇒ ⚠️ **về nguyên tắc, client có thể GỬI TÊN BẤT KỲ ⇒ giả mạo người gửi** ✓
- ⭐ **ĐỀ XUẤT (⛔ chưa làm)**: sửa `save(...)` nhận **user từ phiên** (⭐ như `saveUserAccess(Principal, …)` đã làm) ⇒ ⭐ **đây là bản vá JAVA ⇒ sẽ nhập vào đợt triển khai sau** ✓

---

## ④ KIỂM THỬ & XÁC MINH

| Bước | ⭐ Kết quả |
|---|---|
| **Dọn tệp tạm + fixpoint fingerprint** | ✅ 0 tệp tạm · `migrationHead KHÔNG đổi: true` |
| **Vân tay** | ✅ **ĐẠT** `VNTECH-FP-FC5EF3638B86E74D` (**713 tệp**) |
| **`set-local-identity`** | ✅ **KHỚP: true** |
| **`npm run build`** | ✅ **`BUILD_EXIT=0`** — 147 · 135 · 153 · 143 · 141 module transformed · Route (app) OK |
| **Khởi động lại `:8787`** | ✅ ⭐ **theo ĐÚNG PID** — ⭐ **kiểm cmdline trước**: PID cũ **4816** khớp `local-server.mjs` ⇒ dừng ⇒ PID mới **7228** ✓ |
| **`:8787`** | ✅ **HTTP 200** |
| ⭐ **Cổng UI** | ✅ **`✓ do-moi` `✓ van-tay` `✓ byte 6/6`** ⇒ ⭐ **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** |
| ⭐ **`npm test`** | ✅ **`pass 780` · `fail 0` · `NPM_TEST_EXIT=0`** · lint **0 lỗi** |
| ⛔ **Triển khai Java** | ⛔ **KHÔNG cần** (⭐ lỗi tầng UI) |
| ⭐⭐ **XÁC MINH BUNDLE THẬT** (⭐ vòng 87) | ✅ ⭐ **bundle `/assets/page-D-sszRtN.js` (1.047.083 byte) CÓ chuỗi mới** «Không tải được danh sách báo lỗi» ✓ **VÀ** ⭐ **`:9000` — HỆ THẬT — phục vụ CHÍNH bundle đó** ✓ ⇒ ⭐ **bản vá đã tới được trình duyệt người dùng** ✓ |
| ⭐ **Chuỗi cũ vẫn còn — ⭐ ĐÚNG THIẾT KẾ** | ✅ «Chưa có báo lỗi nào» **VẪN CÒN** trong bundle ⚠️ — ⭐ **vì bản vá GIỮ thông báo đó cho trường hợp danh sách THỰC SỰ rỗng** (`!loadError && !reports.length`) ⇒ ⭐ **hai hành vi cùng tồn tại, ⛔ không thay thế nhau** ✓ |

---

## ⑤ ĐO CUỐI TASK

| Phép đo | Kết quả |
|---|---|
| 🐞 **BUG-20261006-001** | ✅ **`FIXED`** · ⛔ **chưa `VERIFIED`** (⭐ cần mắt user xác nhận trên `:9000`) |
| **Tệp sửa** | ⭐ **1 tệp**: `app/screens/ErrorReportAdminPanel.tsx` (⭐ UI) |
| **Hồi quy giao diện** | ✅ **780/780 đạt · 0 lỗi** |
| **Bundle đã áp** | ✅ **3/3 ✓** trên `:8787` |
| ⚠️ **Vân tay ĐỔI** | ⭐ `VNTECH-FP-FC5EF3638B86E74D` (⭐ mọi tài liệu ghi vân tay cũ **cần cập nhật**) |
| ⛔ Thay đổi dữ liệu | **0** |

---

## ⑥ BÀI HỌC

1. ⭐⭐⭐ **MỘT TRẠNG THÁI RỖNG CÓ THỂ NÓI DỐI.** ⭐ UI hiện «Chưa có báo lỗi nào» trong khi thực chất là **403 không có quyền** ⇒ ⚠️ **gây hiểu sai nghiêm trọng hơn cả việc báo lỗi** ✓ ⇒ ⭐ **⛔ KHÔNG bao giờ để `catch` trống hoặc bỏ `.catch()` trên một lời gọi có phân quyền** ✓
2. ⭐⭐⭐ **TRIỆU CHỨNG «KHÔNG HIỆN DỮ LIỆU» ⛔ KHÔNG CÓ NGHĨA LÀ LỖI Ở DỮ LIỆU.** ⭐ Tôi đã **đo cả 6 tầng** và tìm ra: **CSDL có 16 dòng · API trả đủ 16** — ⭐ **lỗi nằm ở tầng UI nuốt lỗi** ✓
3. ⭐⭐⭐ **PHẢI GỌI THẬT ĐỂ XÁC ĐỊNH TẦNG LỖI.** ⭐ Nhờ gọi `error_reports` bằng `admin` (**200, 16 report**) và bằng tài khoản thường (**403**) mà **khoanh vùng được chính xác** ✓
4. ⭐⭐ **MỘT TAB HIỆN RA MÀ ⛔ KHÔNG DÙNG ĐƯỢC LÀ MỘT LỖI THIẾT KẾ** (⭐ BUG-B) ✓
5. ⭐⭐ **SỬA TẦNG UI ⛔ KHÔNG CẦN TRIỂN KHAI JAVA** — ⭐ nhưng **vẫn phải chạy đủ chuỗi build + cổng UI + `npm test`** ✓
6. ⚠️ **SỬA MÃ NGUỒN LÀM VÂN TAY ĐỔI** ⇒ ⭐ **phải cập nhật mọi tài liệu đang ghi vân tay cũ** ✓
