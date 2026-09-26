# 29 — RUNBOOK: ĐÓNG GÓI VÀ CHẠY JAVA BACKEND TRONG MÔI TRƯỜNG NÀY

**Ngày:** 2026-09-18
**Task:** TASK-B03 (và TASK-B02)
**Mục đích:** ghi lại **cách thật** để build và chạy Java backend tại máy này, sau khi gỡ cả 3 blocker.
Tài liệu này phản ánh trạng thái THỰC TẾ, không phải trạng thái mong muốn.

---

## 1. VÌ SAO TRƯỚC ĐÂY KHÔNG BUILD ĐƯỢC — BA NGUYÊN NHÂN CHỒNG NHAU

`mvn package` từng thất bại và bị kết luận nhầm là "sandbox chặn `.m2`". Thực tế có **ba** lớp:

| # | Nguyên nhân | Biểu hiện | Cách xử lý |
|---|---|---|---|
| 1 | **`JAVA_HOME` chưa được đặt** và `java` không có trong `PATH` | `mvn.cmd` báo *"The JAVA_HOME environment variable is not defined correctly"* | Đặt `$env:JAVA_HOME = "C:\Users\PC\.jdks\openjdk-26.0.2.1"` trước khi gọi mvn |
| 2 | **Sandbox chặn ghi `C:\Users\PC\.m2`** | `java.nio.file.AccessDeniedException: C:\Users\PC\.m2\repository\...` | Dùng local repo **trong workspace** (mục 2) |
| 3 | **Tiến trình Java đang chạy giữ tệp JAR** | `spring-boot:repackage ... Unable to rename '...jar' to '...jar.original'` | Dừng **đúng PID** của Java API, đóng gói lại, rồi khởi động lại (mục 3) |

**Bài học:** nguyên nhân (1) bị che bởi (2). Khi một lệnh build thất bại, phải đọc **thông báo gốc** của nó,
không kế thừa kết luận cũ.

---

## 2. BUILD

### 2.1 Vì sao phải dùng `maven.config` mà không dùng `-Dmaven.repo.local`

Đường dẫn dự án **có dấu cách** (`13. Duong Trong Thang\...`). Khi truyền
`-Dmaven.repo.local="D:\13. Duong Trong Thang\..."` qua PowerShell, tham số bị **cắt vụn**;
Maven lặng lẽ rơi về repo mặc định `C:\Users\PC\.m2\repository` rồi bị chặn ghi.
Kiểm chứng bằng `mvn help:evaluate -Dexpression=settings.localRepository` — nếu in ra `.m2` thì tham số đã hỏng.

`.mvn/maven.config` đọc **mỗi dòng là một tham số nguyên vẹn**, không qua shell ⇒ hết vấn đề.

### 2.2 Chuẩn bị (một lần cho mỗi máy)

```powershell
# (a) Sao chép local repo vào workspace để mvn có quyền ghi (khoảng 411 MB, ~4.996 tệp)
robocopy "C:\Users\PC\.m2\repository" "<WORKSPACE>\_m2-repo" /E /NFL /NDL /NJH /NJS /NP

# (b) Tạo java-backend\.mvn\maven.config với ĐÚNG MỘT dòng (đường dẫn tuyệt đối, không dấu nháy):
#     -Dmaven.repo.local=<WORKSPACE>\_m2-repo
```

> `_m2-repo/` và `java-backend/.mvn/maven.config` **KHÔNG được commit** (đã có trong `.gitignore`) vì
> chứa đường dẫn tuyệt đối đặc thù từng máy.

### 2.3 Lệnh build

```powershell
$env:JAVA_HOME = "C:\Users\PC\.jdks\openjdk-26.0.2.1"
$mvn = "C:\Users\PC\.m2\wrapper\dists\apache-maven-3.9.16\0daed3be3ebd1c706f0e69e8b07c6b73f5cc4ea3dfce72a8d0ec2e849ca2ddb0\bin\mvn.cmd"
Set-Location java-backend
& $mvn -DskipTests package
```

Kết quả ĐÚNG phải có:

```text
[INFO] VNTECH ERP ... Domain .......... SUCCESS
[INFO] VNTECH ERP ... Application ..... SUCCESS
[INFO] VNTECH ERP ... Infrastructure .. SUCCESS
[INFO] VNTECH ERP — Web ............... SUCCESS
[INFO] BUILD SUCCESS
```

**Kiểm tra jar béo:** `java-backend\web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar` phải ≈ **90 MB**.
Nếu chỉ ≈ 68 KB thì đó là **jar mỏng** — bước `repackage` đã thất bại (thường do nguyên nhân 3).

> **CẢNH BÁO:** khi `repackage` thất bại, jar béo cũ **đã bị ghi đè** bởi jar mỏng. Đừng dừng server
> trước khi chắc chắn đóng gói lại thành công.

---

## 3. CHẠY / KHỞI ĐỘNG LẠI JAVA API

`java` KHÔNG có trong `PATH` — phải dùng đường dẫn đầy đủ.

```powershell
# Dừng ĐÚNG tiến trình Java của dự án (lấy PID từ cổng 18081), KHÔNG dừng node
netstat -ano | Select-String "LISTENING" | Select-String ":18081"
Stop-Process -Id <PID_cua_18081> -Force

# Khởi động lại (WorkingDirectory = java-backend)
Set-Location java-backend
& "C:\Users\PC\.jdks\openjdk-26.0.2.1\bin\java.exe" -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081
```

Kiểm tra:

```powershell
Invoke-WebRequest "http://127.0.0.1:18081/actuator/health" -UseBasicParsing   # phải là HTTP 200, status UP
Invoke-WebRequest "http://127.0.0.1:9000/" -UseBasicParsing                    # giao diện người dùng dùng
```

Bốn cổng phải cùng sống: **3306** MySQL · **18081** Java API · **8787** Node SSR · **9000** cutover proxy.

---

## 4. CỔNG ẢNH VÀ BỘ PROBE (TASK-B02)

| Loại | Chạy được trong sandbox hiện tại? | Ghi chú |
|---|---|---|
| **Cổng ảnh** (`tools/probe-visual-regression.mjs`) | **KHÔNG** — cần mở rộng sandbox | Edge headless dùng **named pipe**; thiếu quyền sẽ báo `Không kết nối được CDP của Edge.` |
| Probe cần `spawn mysql` (`probe-rbac-gap`, `probe-project-visibility`, …) | **KHÔNG** — cần mở rộng sandbox | Báo `__FAIL__:EPERM` |
| Probe thuần HTTP/đọc mã (`probe-action-*-parity`, `probe-live-rolebase`, `probe-role-code-scan`) | **CÓ** | Không cần quyền thêm |

Kết quả lần chạy cổng ảnh gần nhất (có mở rộng sandbox): **28/28 ảnh ĐẠT, 0 px lệch** trên 7 màn × 4 kích thước.

---

## 5. ĐIỀU TRA ĐÃ PHÁT HIỆN THÊM

1. **`SlaComplianceWorker` lỗi lặp mỗi giờ** — log server cho thấy cùng một lỗi ở 08:02, 09:02, 10:02, 11:02:
   ```text
   WARN SlaComplianceWorker : SLA worker lỗi do hệ thống tạm thời; bỏ qua lượt này và thử lại sau:
   PreparedStatementCallback; bad SQL grammar
   [UPDATE supply_workflow_steps SET status='overdue',overdue_at=?,updated_at=? WHERE id=? AND status='pending']
   ```
   ⇒ Worker SLA **chưa bao giờ chạy được**; câu lệnh SQL không khớp lược đồ. Cần điều tra riêng (TASK-025).

2. **`me` và `bootstrap` KHÔNG được triển khai ở backend Java** (Strangler Fig):
   admin nhận `400 "Action 'me' chưa được triển khai trên backend Java (Strangler Fig)."`.
   Với tài khoản **không phải admin** thì nhận **403** *"Thao tác chưa được khai báo quyền trong hệ thống."* —
   vì tầng RBAC mặc-định-từ-chối chạy **trước** nhánh "chưa triển khai". Thông báo gây nhầm lẫn nhưng
   không phải lỗi chức năng (giao diện lấy dữ liệu qua đường khác).

3. **`AuthUseCase.currentUser` (đã sửa ở TASK-021) tác động tới PHÂN QUYỀN NỘI BỘ Java**, không phải tới
   payload `me` của giao diện — vì `me` do phía Node phục vụ.

---

## 6. BÀI HỌC

1. **`JAVA_HOME` là điều kiện tiên quyết** — thiếu nó thì mọi thông báo lỗi của Maven đều dẫn sai hướng.
2. **Đường dẫn có dấu cách + PowerShell = tham số `-D` bị cắt** — dùng `maven.config` thay vì `-D` trên dòng lệnh.
3. **Build ghi đè jar béo bằng jar mỏng khi `repackage` thất bại** — luôn kiểm kích thước jar sau khi build.
4. **Phải dừng đúng tiến trình đang giữ tệp** trước khi đóng gói lại; dừng xong nhớ **khởi động lại và kiểm tra health**.
5. **Log server là nguồn phát hiện lỗi quý** — lỗi `SlaComplianceWorker` lặp mỗi giờ đã bị bỏ qua suốt nhiều giờ
   nhưng lộ ra ngay khi đọc log khởi động.
6. **KHÔNG dùng `Start-Process` để chạy Java API** — tiến trình này **không tồn tại bền**: sau khi cửa sổ
   PowerShell gọi nó kết thúc, tiến trình Java chết theo. Triệu chứng rất dễ chẩn đoán nhầm: proxy :9000 trả
   **502** *"Không kết nối được Java API (127.0.0.1:18081)"*, và cổng ảnh báo **28/28 ảnh lệch ~96%**
   (vì cả giao diện không có dữ liệu) — trông như hồi quy giao diện nhưng thực chất chỉ là tiến trình đã chết.
   **Cách đúng:** chạy Java API bằng **background job do công cụ quản lý**, hoặc một tiến trình thật sự tách rời.
7. **Trước khi kết luận "hồi quy giao diện", hãy kiểm chuỗi sống trước**:
   `node tools/probe-live-stack.mjs` (proxy :9000 → Node SSR → Java :18081 → MySQL). Nếu nó báo
   `LOGIN FAILED ... Không kết nối được Java API` thì vấn đề là tiến trình, không phải mã nguồn.
   Thứ tự chẩn đoán đúng: **4 cổng → health → chuỗi sống → cổng ảnh**.
