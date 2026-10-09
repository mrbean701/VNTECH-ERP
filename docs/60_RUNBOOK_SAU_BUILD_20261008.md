> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# RUNBOOK — CHẠY SAU KHI BUILD (chốt `VERIFIED` + làm XANH cổng phát hành)

Phiên soạn: **`ERP-SESSION-04`** (`SESSION_D`) · Ngày: **08/10/2026** · Trạng thái: **SẴN SÀNG — chờ user cho phép BUILD**
⚠️ Người chạy: bất kỳ phiên nào có quyền dừng/khởi động server (theo `docs/29` runbook) · ⛔ **KHÔNG** tự ý chạy khi còn phiên khác đang build.

---

## 0. ĐIỀU KIỆN VÀO
```text
✅ S01 (chủ app/page.tsx + java-backend/**) ĐÃ XONG việc đang làm
✅ User nói «build đi»
✅ Không phiên nào đang chạy gd-cycle / build khác (tránh đua — xem bài học BUG-D06)
```

## 1. BUILD (theo quy trình dự án)
```text
⚠️ BÀI HỌC ĐÃ TRẢ GIÁ: `gd-cycle` hay lỗi `EPERM … rename '.local-data' → '..\_vntech-buildstash'`
   = Ổ KHOÁ FILE do SERVER đang chạy giữ — ⛔ KHÔNG phải lỗi sandbox.
   ⇒ Phải tìm ĐÚNG PID (`scripts/local-server.mjs`) rồi `Stop-Process -Id <PID>`.
   ⛔ TUYỆT ĐỐI KHÔNG `Stop-Process node` (sẽ giết DSH host/proxy/phiên khác).
⚠️ `gd-cycle` ⛔ KHÔNG tự khởi động lại dịch vụ ⇒ sau build PHẢI chạy lại `node scripts/local-server.mjs`.
⚠️ `gd-cycle` sinh **1 migration identity mỗi lần chạy** ⇒ ⛔ chạy dồn dập (nay đã có chốt chặn trùng ✅).
```

## 2. SINH LẠI MANIFEST ⇒ LÀM XANH CỔNG PHÁT HÀNH
```powershell
node scripts\generate-release-manifest.mjs          # ⭐ đã sửa: ⛔ KHÔNG còn đưa `_javac-verify/**` vào manifest
npm run test:release-static                          # KỲ VỌNG: ĐẠT (trước đây đỏ vì 393 vs 353 + SHA256 _javac-verify)
```
* Gốc đã sửa: `scripts/generate-release-manifest.mjs` (`excludedTopDirs` + `_javac-verify`) · `scripts/verify-full-release.mjs` (kiểm **chuỗi mã số**, ⛔ không đếm file)
* ⛔ **KHÔNG** xoá `_javac-verify/` (⚠️ có thể là workspace của phiên khác; `.gitignore` đã loại nó ✅)

## 3. BỘ PROBE (đã lưu trong repo: `docs/dsh-mutil-session/SESSION_D/probes/`)
| # | Lệnh | Kỳ vọng SAU BUILD |
|---|---|---|
| 1 | `node probes/baseline-p08.mjs http://127.0.0.1:9000 probe_self_186408` | Nhân viên: **403** + thông điệp **ĐÚNG** «Tài khoản không có quyền thực hiện nghiệp vụ này.» |
| 2 | `node probes/verify-p08.mjs http://127.0.0.1:9000 probe_self_186408` | **2 CHIỀU**: nhân viên **403** (đúng thông điệp) · **admin 400** = đã QUA cổng quyền (⛔ không ghi gì) |
| 3 | `node probes/probe-d12.mjs http://127.0.0.1:9000` | ⭐ **`BUG-D12`**: giao việc ⇒ nhân viên % ⇒ Gửi kiểm tra ⇒ admin «Duyệt xong» ⇒ **NGƯỜI GIAO phải NHẬN thông báo** «Công việc đã hoàn thành» |
| 4 | `node probes/probe-viec4.mjs http://127.0.0.1:9000` | ⭐ **việc 4**: nhân viên **tự tạo được** + ⭐ **PHẢI THẤY việc của chính mình** trong `workItems` (đây là `BUG-D15`) |
| 5 | `node probes/probe-d15.mjs http://127.0.0.1:9000 <TASKNO> <username>` | Kiểm 1 việc cụ thể: ai thấy, ai không |
| 6 | `node probes/do-cong-p08.mjs .` | ⭐ Đo lại cổng role 16 action (⛔ chỉ đọc) — dùng khi cần kiểm lại `P-08` |
| ⭐ Kiểm giao diện | **nút «Yêu cầu làm lại»** (việc 5 — `BUG-D14`) + **ô NHẬP %** trên màn hình **nhân viên** | Phải bấm được + lưu đúng % (đây là 2 ảnh cần chụp) |

## 4. DỌN TÀI KHOẢN KIỂM THỬ (⛔ đừng để rác)
```powershell
node probes/probe-cleanup.mjs http://127.0.0.1:9000 probe_self_186408
```
* Đã tạo trong các vòng trước: `probe_d12_528419` (**ĐÃ KHOÁ** `active=false` ✅) · `probe_self_186408` (còn hoạt động) · `probe_d15_*` (nếu có)
* ⚠️ `delete_user` từ chối nếu tài khoản **đã có lịch sử nghiệp vụ** ⇒ ⭐ trạng thái đúng là **ĐÃ KHOÁ** (giữ vết chứng từ)

## 5. GHI `VERIFIED` + BÁO CÁO
```text
① Cập nhật BUG_HOTFIX: BUG-D12 · BUG-D14 · BUG-D15 · P-08  ⇒ FIXED → VERIFIED (kèm số đo thật)
② TEST_LOG: thêm 1 dòng cho mỗi probe (kết quả THẬT, ⛔ không suy đoán)
③ `docs/58`: việc 3 (ô nhập %) ⇒ chụp ảnh màn hình nhân viên ⇒ đóng điểm cuối
④ Telegram: «[ERP GO-LIVE][SESSION_D] TASK COMPLETED … Test: PASS · Regression: PASS · Status: VERIFIED»
```

## 6. ⛔ NHỮNG ĐIỀU TUYỆT ĐỐI KHÔNG LÀM (bài học đã trả giá)
```text
⛔ KHÔNG thử cổng quyền bằng action CÓ THỂ GHI trên môi trường dùng chung
   (`BUG-D16`: 3 action đã ghi thật — `save_email_settings` · `retry_email` · `save_ui_display_settings`)
   ⇒ chỉ dùng action KIỂM DỮ LIỆU TRƯỚC KHI GHI: `bulk_import_projects` · `delete_material_category`
⛔ KHÔNG chèn code vào GIỮA tệp bị gate khoá SỐ DÒNG (`scripts/system-route.mjs`,
   `java-backend/.../SystemController.java` — `F-03`) ⇒ hàm mới đặt CUỐI tệp + gọi INLINE (giữ 0 dòng dịch)
⛔ KHÔNG gắn module cho action admin-only (`P-08`: đo 16/16 = route JS `requireRole(["admin"])`
   mà Java chỉ `requireCurrentUser` ⇒ registry là cổng DUY NHẤT ⇒ gắn module = LEO THANG — `TM-04`)
⛔ KHÔNG tin `git diff` mù: 284+ tệp dirty là của NHIỀU phiên (đo `--stat` từng tệp mới kết luận)
```
