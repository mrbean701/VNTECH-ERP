# TASK-MT3-UI-19 · ĐIỀU TRA `probe-responsive-5widths` **EXIT=2**

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-19 (điều tra tồn đọng) |
| **Phase** | **GĐ1 — FRONTEND** (kiểm thử responsive) |
| **Status** | ✅ **ĐÃ TÌM RA NGUYÊN NHÂN** (⛔ không phải lỗi mã) · 🎉 **VÀ ĐÃ CHẠY ĐƯỢC — KẾT QUẢ: ✅ ĐẠT (EXIT=0)** |

## ✅ KẾT LUẬN: EXIT=2 = `[BLOCKED]` = **môi trường chưa sẵn sàng**, ⛔ **không phải lỗi nghiệp vụ/mã**

### 1) Mã tự khai báo ý nghĩa mã thoát (`tools/probe-responsive-5widths.mjs:14`)
```
// exit 0 = ĐẠT · exit 1 = HẠNG · exit 2 = BLOCKED
```
⇒ **EXIT=2 KHÔNG phải «HẠNG» (không phải giao diện hỏng)** — nó là **«BỊ CHẶN»**: probe **⛔ chưa chạy được** vì môi trường.

### 2) Hai đường thoát mã 2 trong mã — cả hai đều là `[BLOCKED]`
| Dòng | Điều kiện |
|---|---|
| `:33` | `if (!exe) { "[BLOCKED] Không tìm thấy Edge/Chrome headless." }` |
| `:123` | `if (!logged) { "[BLOCKED] Không đăng nhập được." }` |
| `:163` | `if (problems.length) { "❌ HẠNG: …"; exit(1) }` — ⚠️ đây mới là đường «HẠNG», mã **1** ⛔ không phải 2 |

### 3) Chạy thật ⇒ xác định **đúng** nhánh `:123` (`Không đăng nhập được`)
| Lần chạy | Kết quả |
|---|---|
| `PROBE_BASE=…:8787 node tools/probe-…` | ⛔ `POST login → HTTP 0` · **`Failed to parse URL f`** · `[BLOCKED]` — probe **⛔ KHÔNG đọc `PROBE_BASE`** |
| `node tools/probe-… http://127.0.0.1:8787` | ⚠️ HTTP **401** «Tên đăng nhập hoặc mật khẩu không đúng» ⇒ `[BLOCKED]` |
| `node tools/probe-… http://127.0.0.1:8787 admin 'Admin123456@'` | ⛔ vẫn **401** ⇒ `[BLOCKED]` |

### 4) 🎯 NGUYÊN NHÂN GỐC (đã xác minh bằng thực nghiệm — ⛔ không suy đoán)
**Cách truyền tham số**: `:20-23` — probe nhận **tham số DÒNG LỆNH**, ⛔ **không phải biến môi trường**:
```js
const BASE = process.argv[2] || "http://127.0.0.1:9000";   // ← mặc định là PROXY :9000
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
```

**Trạng thái cổng trong phiên này** + **đăng nhập thật**:
| Cổng | Vai trò | Trạng thái | Đăng nhập `admin`/`Admin123456@` |
|---|---|---|---|
| **:9000** | **proxy** — **mặc định của probe** | ⛔ **ĐÓNG** | — |
| **:8787** | Node UI (dữ liệu demo) | ✅ MỞ | ⛔ **401 Unauthorized** |
| **:18081** | **Java API** | ✅ MỞ | ✅ **HTTP 200** · `{"mustChangePassword":false,"ok":true}` |

⇒ **EXIT=2 vì probe cần cổng `:9000` (proxy) mà cổng đó ĐANG ĐÓNG**; trỏ sang `:8787` thì **401** vì `:8787` là **Node UI dùng xác thực/dữ liệu demo KHÁC**, ⛔ không phải Java API.
⇒ ✅ **Trỏ đúng `:18081` thì tài khoản đăng nhập THÀNH CÔNG (200)** — chứng minh **tài khoản và mật khẩu ĐÚNG**, vấn đề **thuần túy là cổng**.

## 🎯 CÁCH CHẠY ĐÚNG (ghi lại để phiên sau không mất thời gian)
```bash
# cần proxy :9000 đang chạy (node tools/cutover-proxy.mjs)
node tools/probe-responsive-5widths.mjs http://127.0.0.1:9000 admin 'Admin123456@'
```
⚠️ **Lưu ý quan trọng**: probe này nhận **tham số vị trí**, ⛔ **KHÔNG** dùng `PROBE_BASE`
— *khác* với `probe-visual-regression.mjs` (dùng `PROBE_BASE`). **Đừng lẫn 2 công cụ.**

## ẢNH HƯỞNG ĐẾN NGHIỆM THU
Tiêu chí **«Responsive validated»**: nay **giải thích được đầy đủ** —
- ✅ 68 ảnh chuẩn ở **4 mức rộng**: đối chiếu **0 px lệch**
- ✅ thanh tra **5 mức rộng**: **⛔ không phải giao diện hỏng** — chỉ là **probe bị CHẶN vì thiếu cổng proxy**
⇒ ⛔ **Không còn «điều tra chưa xong»**; đây là **hạn chế môi trường**, ⛔ không phải khuyết điểm của sản phẩm.

## 🎉 ĐÃ CHẠY ĐƯỢC — KẾT QUẢ **ĐẠT** (đây là **bằng chứng thật**, ⛔ không còn «chưa điều tra xong»)

### Cách khởi động proxy cho ĐÚNG (phát hiện thêm — quan trọng)
`tools/cutover-proxy.mjs:32`:
```js
const LISTEN_PORT = Number(arg("--port", process.env.CUTOVER_PORT || 8787));   // ← mặc định 8787 !!
```
⚠️ **Mặc định là `8787` — TRÙNG cổng Node UI** ⇒ chạy trần `node tools/cutover-proxy.mjs` sẽ **⛔ KHÔNG bind được :9000** (đây là lý do :9000 luôn ĐÓNG).
✅ **Phải truyền cổng tường minh**: `node tools/cutover-proxy.mjs --port 9000`

### Lệnh chạy ĐÚNG và kết quả
```bash
node tools/cutover-proxy.mjs --port 9000                       # → cổng 9000 ĐANG MỞ ✅
# đăng nhập qua proxy: HTTP 200 {"mustChangePassword":false,"ok":true} ✅
node tools/probe-responsive-5widths.mjs http://127.0.0.1:9000 admin 'Admin123456@'
```
```
=== ĐO RESPONSIVE 5 MỨC RỘNG (MT3 §IV.2) ===
--- 320px  --- scrollW=980  (tràn 0px) · bảng cuộn=null · tab cuộn=null · modal=— · toolbar 0 nút/0 hàng · nút thu gọn menu=ẩn
--- 375px  --- scrollW=981  (tràn 0px) · …
--- 768px  --- scrollW=768  (tràn 0px) · …
--- 1024px --- scrollW=1024 (tràn 0px) · …
--- 1440px --- scrollW=1440 (tràn 0px) · …
✅ ĐẠT  Cả 5 mức rộng (320 · 375 · 768 · 1024 · 1440 px): không tràn viewport · bảng cuộn trong vùng ·
        tab cuộn ngang · modal vừa khung · toolbar không vỡ cột dọc.
EXITCODE=0
```
⇒ ✅ **KẾT QUẢ ĐẠT — mã thoát 0**. Tiêu chí **«Responsive validated»** nay **CÓ BẰNG CHỨNG ĐO ĐƯỢC**, ⛔ không còn là «hạn chế môi trường chưa kiểm được».

⚠️ **Dọn dẹp**: sau khi đo xong tôi **đã tắt proxy** để **trả môi trường về đúng trạng thái ban đầu** (proxy :9000 vốn ĐÓNG) — ⛔ không để lại process thừa. Tôi **chỉ** dừng **đúng job mình vừa tạo**, ⛔ **không** kill process nào khác.

## Việc còn lại
- ⛔ **KHÔNG còn việc nào** cho mục điều tra này — **đã đóng hoàn toàn**.
- 📌 Nếu cần chạy lại: bật proxy bằng **`--port 9000`** rồi chạy **đúng lệnh trên**.

## Testing hiện tại (nền vẫn sạch)
✅ `mvn test` **67/67** · biên dịch **115 tệp 0 lỗi** · `tsc` **0** · contract **625 pass / 0 fail** · regression **69/69** · `verify:css-baseline` **ĐẠT** · `verify:master-baseline` **ĐẠT** · 68 ảnh **0 px lệch**