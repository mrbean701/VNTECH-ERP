# TASK-155 — GO-LIVE ĐỢT 10: PRE-FLIGHT TRIỂN KHAI (FLYWAY / MIGRATION / ĐỘ AN TOÀN)

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Mục đích** | Trước khi user cho phép triển khai, **chứng minh việc khởi động lại là AN TOÀN** (một lỗi Flyway validate sẽ làm app **không khởi động được**) |
| **Kết quả** | ✅ **AN TOÀN** — và phát hiện **bắt buộc phải build lại** thì `V35`/`V37` mới được ghi sổ |
| **Vân tay** | ⛔ Không đổi |

---

## ① VÌ SAO PHẢI PRE-FLIGHT

`java-backend/web/src/main/resources/application.yml`:
```yaml
flyway:
  enabled: true
  locations: classpath:db/migration
  baseline-on-migrate: false
```
Flyway **mặc định `validate = true`**: nếu checksum của migration **đã áp dụng** không khớp tệp hiện có, app **KHÔNG KHỞI ĐỘNG ĐƯỢC**. ⇒ Trước khi cho phép triển khai, phải **chứng minh** không có migration nào bị lệch byte.

---

## ② ⭐ PHÁT HIỆN 1 — MIGRATION NẰM TRONG JAR **NHÚNG**, KHÔNG PHẢI JAR MODULE RỜI

App chạy `web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` (fat jar Spring Boot) và nạp migration từ
**`BOOT-INF/lib/vntech-erp-infrastructure-0.1.0-SNAPSHOT.jar`** bên trong nó.

⛔ Phép đo đầu của tôi so **jar module rời** ⇒ **SAI ĐỐI TƯỢNG**; phải giải nén **jar nhúng** mới đúng thứ app thấy.
(Bài học: đo đúng **thứ tiến trình thật sự nạp**, không đo thứ gần giống.)

---

## ③ ⭐⭐ PHÁT HIỆN 2 — JAR ĐANG CHẠY **THIẾU** V32/V33/V34 MÀ DB **ĐÃ ÁP**

| | |
|---|---|
| Jar **nhúng trong fat jar đang chạy** | **31 migration**, tới **V31** |
| `target/classes` (bản build lại hôm nay) | **36 migration** |
| `flyway_schema_history` đã áp | tới **V34** (V32/V33/V34 `installed_on = 01/10 16:00:33`) |
| ⇒ migration **đã áp** mà jar **đang chạy KHÔNG có** | **V32 · V33 · V34** |

⭐⭐ **VÀ APP VẪN KHỞI ĐỘNG BÌNH THƯỜNG** (PID 3784, khởi động **02/10 08:14**, tức **sau** mốc 01/10 16:00).
⇒ **Kết luận bằng QUAN SÁT, không bằng lý thuyết:** Flyway ở cấu hình dự án này **KHÔNG chặn** khởi động khi có migration đã áp mà jar không chứa. ⛔ Lo ngại «validate sẽ chặn» của tôi **không đúng với thực tế này**.

---

## ④ ĐỘ AN TOÀN — SO BYTE TỪNG MIGRATION

| Phép đo | Kết quả |
|---|---|
| Migration chung giữa jar đang chạy và bản build lại | **31** |
| **Giống hệt byte** | **31** ✅ |
| **Khác byte** | **0** ✅ |
| **Thiếu ở bản mới** | **0** ✅ |
| **Mới hoàn toàn** (chưa từng áp) | **5**: `V32` `V33` `V34` `V35` `V37` |

⇒ **Checksum của mọi migration ĐÃ ÁP GIỮ NGUYÊN** ⇒ Flyway validate sẽ **QUA**.

---

## ⑤ KẾT LUẬN & KHUYẾN NGHỊ TRIỂN KHAI

| Phương án | Kết quả |
|---|---|
| **Restart MÀ KHÔNG build lại** | An toàn, **nhưng `V35`/`V37` KHÔNG được áp** vì jar hiện tại **không chứa** chúng ⇒ `flyway_schema_history` **mãi ở V34** (hiệu ứng của 2 migration đã được áp tay nên **chức năng không lệch**, chỉ **sổ migration lệch**) |
| ✅ **Build lại RỒI restart** | Flyway thấy `V32`–`V35`, `V37` là **pending** (đều **> V34**, đúng thứ tự, ⛔ không cần `out-of-order`) ⇒ **áp và ghi sổ**; `V32`–`V34` **đã áp** nên chỉ **đối chiếu checksum rồi bỏ qua**; `V35` = `UPDATE` khớp 0 dòng; `V37` = `CREATE TABLE IF NOT EXISTS` + `INSERT IGNORE` ⇒ **idempotent** |

✅ **KHUYẾN NGHỊ: build lại rồi khởi động lại.** Việc này vừa **đưa 2 bản vá HIGH lên sóng** (BUG-003 · BUG-005),
vừa **ghi `V35`+`V37` vào `flyway_schema_history`** cho hết lệch sổ — **hai việc trong một lần**.

⚠️ **RỦI RO CÒN LẠI (đã đo, mức thấp):** trong lúc `:18081` dừng để thay jar, **UI `:9000` gọi API Java sẽ lỗi** trong khoảng vài chục giây. Trước khi dừng nên xác nhận **không có ai đang thao tác**.

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Migration giống hệt byte | **31 / 31** |
| Khác byte · thiếu | **0 · 0** |
| Migration mới chưa áp | **5** (`V32`–`V35`, `V37`) |
| Kết luận an toàn | ✅ **AN TOÀN** |
| Vân tay | **ĐẠT** `VNTECH-FP-614484381419C595` — **không đổi** |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** (build 01/10) |

---

## ⑦ BÀI HỌC

1. ⛔ **ĐO ĐÚNG THỨ TIẾN TRÌNH THẬT SỰ NẠP.** Tôi so **jar module rời** trong khi app nạp **jar nhúng trong fat jar** ⇒ sai đối tượng. Phải xác định **đường nạp thật** trước khi đo.
2. ⭐⭐ **QUAN SÁT ĐÁNH BẠI SUY LUẬN.** Tôi lo «Flyway validate sẽ chặn khởi động»; nhưng **app đang chạy với đúng cấu hình đó** (đã áp V32–V34 mà jar không có) ⇒ lo ngại **không đúng thực tế**. ⛔ Đừng suy ra hành vi từ tài liệu khi có **bằng chứng vận hành** ngay trước mắt.
3. ⭐ **SO BYTE là phép đo rẻ và dứt điểm** cho câu hỏi «build lại có làm hỏng checksum không» — 31/31 giống hệt, 0 khác.
4. ⭐ **Gộp việc khi cùng một thao tác giải quyết hai vấn đề**: build lại + restart vừa đưa bản vá lên sóng, vừa ghi sổ migration.

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — mục 1 nay đã có KẾT LUẬN AN TOÀN, chỉ chờ bật đèn xanh:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — đã chứng minh **AN TOÀN**; đưa **2 bản vá HIGH** lên sóng **và** ghi `V35`+`V37` vào sổ migration.
2. **Chốt bất đồng** «ai được nhận hàng ở kho đích» (`receive_transfer_order` ↔ `e2e.tk`) — TASK-154 §③.
3. **4 phiếu trả Kho Tổng kẹt `in_transit` + 9 đơn vị kẹt ở `WH-TRANSIT`** — dọn thế nào sau triển khai?
4. Mở task «thêm thành viên tổ đội»?
5. Commit?
