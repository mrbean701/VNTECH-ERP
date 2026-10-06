# TASK-167 — GO-LIVE ĐỢT 22: CÔNG CỤ TRIỂN KHAI AN TOÀN (Sao lưu · Kiểm chứng · Mặc định chạy thử)

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Mục đích** | 5 bản vá đang chờ ⇒ làm cho việc triển khai **dễ và an toàn**, ⛔ không phải thêm bài test |
| **Sản phẩm** | `tools/deploy-java-backend.mjs` |
| **Trạng thái** | ✅ chạy thử **ĐẠT** + **xác minh ⛔ không đụng gì** · ⛔ **chưa thực thi** (chờ user) |
| **Vân tay** | ⛔ Không đổi (`tools/` ngoài `ROOT_DIRS`) |

---

## ① ⛔⛔ LỖ HỔNG AN TOÀN PHÁT HIỆN TRƯỚC KHI VIẾT CÔNG CỤ

| | |
|---|---|
| JAR đang chạy | `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` — **86.8 MB**, build **01/10 10:24:55** |
| Tiến trình | **PID 3784** · cmdline `java.exe -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081` |
| **⛔ LỖ HỔNG** | **CHƯA CÓ BẢN LÙI NÀO.** `mvn package` **GHI ĐÈ đúng tệp đang chạy** ⇒ nếu bản mới lỗi thì **⛔ không có gì để quay lại** |

⭐ Với **5 bản vá đang chờ**, triển khai mà ⛔ không có đường lùi là **rủi ro thật**. ⇒ Công cụ mới **sao lưu trước khi build**.

---

## ② CÔNG CỤ `tools/deploy-java-backend.mjs` — 8 BƯỚC, 6 CHỐT AN TOÀN

```text
node tools/deploy-java-backend.mjs                       # ⓘ CHẠY THỬ (MẶC ĐỊNH) — in kế hoạch, ⛔ không đụng gì
node tools/deploy-java-backend.mjs --dong-y-trien-khai    # ⭐ THỰC THI
```

| Bước | Việc | Chốt an toàn |
|---|---|---|
| ① | Kiểm **vân tay nguồn** | ⛔ không ĐẠT ⇒ **DỪNG** |
| ② | Tìm tiến trình nghe `:18081` | ⛔ **cmdline phải KHỚP** JAR dự kiến ⇒ **⛔ không giết tiến trình lạ** |
| ③ | **SAO LƯU** JAR hiện tại → `web/target/backup/vntech-erp-web-<dấu thời gian>.jar` | ⭐ **đây là bản lùi** (trước đây ⛔ không có) |
| ④ | `mvn -o -DskipTests package` | ⛔ không `BUILD SUCCESS` ⇒ **DỪNG** (JAR cũ vẫn nguyên vì đã sao lưu) |
| ⑤ | Kiểm **JAR mới chứa V35 + V37** | ⛔ thiếu migration ⇒ **DỪNG** |
| ⑥ | Dừng PID đã xác minh → khởi động JAR mới (`detached`) | ⛔ nếu cổng vẫn còn bị chiếm ⇒ **DỪNG** |
| ⑦ | **Health-check** `:18081` (chờ tối đa 120s) | ⛔ không trả lời ⇒ cảnh báo + in hướng dẫn lùi |
| ⑧ | **Nghiệm thu** bằng bài E2E (`go-live-bao-loi-danh-dau-xong` · `go-live-phu-toan-bo-delete`) | — |

**Cuối cùng luôn in HƯỚNG DẪN LÙI** (3 lệnh: dừng PID mới → khôi phục JAR từ bản sao lưu → khởi động lại) kèm ghi chú: migration V35/V37 ⛔ **không tự lùi** nhưng cả hai **IDEMPOTENT** ⇒ **lùi JAR là an toàn**.

---

## ③ KIỂM CHỨNG CHẾ ĐỘ CHẠY THỬ

| Phép đo | Kết quả |
|---|---|
| Vân tay | ✔ **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · 713 tệp |
| Tiến trình | ✔ PID **3784** · cmdline **KHỚP** JAR dự kiến |
| Bản lùi dự kiến | ✔ `java-backend\web\target\backup\vntech-erp-web-2026-10-04T20-58-44.jar` |
| ⭐ **JAR có đổi không?** | ✔ **KHÔNG** (`10/01/2026 10:24:55` → **y nguyên**) |
| ⭐ **Có tạo thư mục backup?** | ✔ **KHÔNG** (`Test-Path` = **False**) |
| ⭐ **`:18081` có bị dừng?** | ✔ **KHÔNG** — vẫn nghe · **PID 3784** |
| Exit code | **0** |

⇒ ⭐ **Chế độ chạy thử ⛔ KHÔNG đụng gì** — đúng thiết kế, đã **xác minh bằng 3 phép đo độc lập**.

### ⛔ GIỚI HẠN ĐÃ BIẾT (nói thẳng)
Các **nhánh từ chối** (cmdline ⛔ không khớp · build ⛔ thất bại · thiếu migration) **đã đọc trong mã** nhưng **⛔ chưa thử được hành vi** — muốn thử phải tạo tình huống giả (tiến trình lạ / build hỏng), mà việc đó **đụng vào hệ thống thật**. ⇒ ⛔ **không tuyên bố đã kiểm** các nhánh đó.

---

## ④ SỬA LỖI CỦA CHÍNH TÔI TRONG QUÁ TRÌNH VIẾT

| Lỗi | Sự thật | Đã sửa |
|---|---|---|
| ⛔ Mở chuỗi bằng **backtick** nhưng đóng bằng **nháy kép** (dòng 163) | `SyntaxError: missing ) after argument list` ⇒ script **⛔ không chạy được dòng nào** | ✔ dùng nhất quán backtick |

⭐ **Điểm may (⛔ không phải thiết kế)**: lỗi ở **thời điểm phân tích cú pháp** nên script **chưa chạy gì** ⇒ ⛔ không gây hại. ⭐ **Nhưng nếu lỗi nằm GIỮA script thì hậu quả đã khác** — lý do phải có **chốt an toàn ở từng bước**, ⛔ không chỉ ở đầu.

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Công cụ triển khai (chạy thử) | ✔ **ĐẠT** · ⛔ **không đụng gì** (xác minh 3 phép đo) |
| Bản lùi | ⭐ nay **CÓ** (sẽ tạo ở bước ③ khi thực thi) |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** (build 01/10) ⇒ **5 bản vá chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⭐⭐ **TRƯỚC KHI LÀM VIỆC NGUY HIỂM, HÃY ĐO XEM CÓ ĐƯỜNG LÙI KHÔNG.** Phát hiện «build ghi đè JAR đang chạy và ⛔ **không có bản sao**» là **lỗ hổng thật** — mà ⛔ không ai thấy nếu chỉ đọc kế hoạch triển khai.
2. ⭐⭐ **CÔNG CỤ NGUY HIỂM PHẢI MẶC ĐỊNH AN TOÀN.** Mặc định **chạy thử**; muốn thực thi phải gõ **cờ đồng ý rõ ràng**. ⭐ Và **xác minh lại bằng phép đo** rằng chạy thử ⛔ không đụng gì — ⛔ không tin vào việc «đọc mã thấy ổn».
3. ⭐ **CHỐT AN TOÀN Ở TỪNG BƯỚC, ⛔ KHÔNG CHỈ Ở ĐẦU.** Bài học từ chính lỗi cú pháp của tôi: nếu script hỏng ở **giữa** thì chốt ở đầu ⛔ không cứu được.
4. ⭐ **XÁC MINH «KHÔNG LÀM GÌ» CẦN NHIỀU PHÉP ĐO.** Tôi dùng **3** phép độc lập (JAR không đổi · không có thư mục backup · cổng vẫn nghe đúng PID) ⇒ ⛔ một phép không đủ.
5. ⛔ **NÓI THẲNG NHÁNH CHƯA KIỂM.** Các nhánh từ chối **đọc trong mã** nhưng **chưa thử hành vi** ⇒ ghi rõ, ⛔ không tuyên bố đã kiểm.

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **112+ tệp** thay đổi chưa commit.
⭐ **NAY VIỆC TRIỂN KHAI CHỈ CÒN 1 LỆNH** (sau khi user đồng ý):
```text
node tools/deploy-java-backend.mjs --dong-y-trien-khai
```
⛔ **Cần user quyết — 5 BẢN VÁ chưa lên sóng:**
1. ⭐ **Cho phép triển khai** — **BUG-003 · BUG-005 · BUG-008 · BUG-20261010 · BUG-20261011**; công cụ đã **sẵn sàng**, có **sao lưu + hướng dẫn lùi**, có **nghiệm thu tự động**; ghi luôn `V35`+`V37` vào sổ migration.
   ⚠️ Nên chọn lúc **không có ai thao tác** — UI `:9000` sẽ lỗi API trong vài chục giây lúc thay JAR.
2. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
3. **BUG-20261005-007** — 130 lớp thiếu CSS.
4. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
5. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
6. ⭐ **Tiếp tục vòng đời CRUD cho 6 thực thể còn lại?** (`material_norm` · `payment_plan` · `seal` · `legal_document` · `correspondence` · `business_role_group`)
7. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
8. Xoá đăng ký thừa `manage_contract_review`? · 9. Mở task «thêm thành viên tổ đội»? · 10. Commit?
