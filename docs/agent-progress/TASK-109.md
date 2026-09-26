# TASK-109 — PHASE 2 · FIX LỖI BIÊN DỊCH: lambda bắt giữ biến không `effectively final` (`RequestManagementUseCase:511`)

**Ngày:** 20/09/2026 19:09 (+07:00) · **Người chỉ đạo:** captain (đã build thật, lấy lỗi nguyên văn)
**Phạm vi tệp đã sửa:** **1 tệp** — `java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java`
**KHÔNG** chạy `mvn package` · **KHÔNG** khởi động/dừng dịch vụ (8787 / 9000 / 18081) · **KHÔNG** sửa ngoài `java-backend/application/**`.

---

## 1. NGUYÊN NHÂN GỐC

Lỗi biên dịch do đợt §6 «luồng duyệt động» (TASK-106) để lại tại hàm `resubmitRequest`:

- Vòng lặp `for (Map<String, Object> stage : stages)` gán lại **`currentStage`** (2 lần: trong vòng lặp `:506`
  và ở dòng `:509` `if (currentStage == 0) currentStage = …`).
- Ngay sau đó, `stages.stream().filter(s -> … == currentStage)` **bắt giữ** `currentStage` trong lambda ⇒ vi phạm
  JLS 15.27.2: biến cục bộ bị lambda bắt giữ phải `final`/**effectively final**.

### TRƯỚC (HEAD `db0524c` — ĐỎ)

```java
        int currentStage = 0;
        for (Map<String, Object> stage : stages) {
            …
            currentStage = ((Number) gi(stage, "stageNo")).intValue();
            break;
        }
        if (currentStage == 0) currentStage = ((Number) gi(stages.get(stages.size() - 1), "stageNo")).intValue();
        Map<String, Object> currentConfig = stages.stream()
                .filter(s -> ((Number) gi(s, "stageNo")).intValue() == currentStage).findFirst().orElse(firstStage);
```

### SAU (ĐÚNG nguyên nhân — chốt thành biến `final` mới, **không** holder/mảng, **không** xoá logic)

```java
        if (currentStage == 0) currentStage = ((Number) gi(stages.get(stages.size() - 1), "stageNo")).intValue();
        // Bước khởi động lại đã chốt ⇒ chốt thành biến `final` để lambda bên dưới bắt giữ được
        // (`currentStage` bị gán lại trong vòng lặp nên KHÔNG effectively final).
        final int restartStage = currentStage;
        Map<String, Object> currentConfig = stages.stream()
                .filter(s -> ((Number) gi(s, "stageNo")).intValue() == restartStage).findFirst().orElse(firstStage);
```

**Hành vi nghiệp vụ giữ nguyên 100 %**: cùng giá trị `currentStage` sau vòng lặp, vẫn dùng luật «người tạo không tự
duyệt» (`creatorMatchedStageRole` bỏ qua bước trùng vai trò), vẫn `store.resubmitRequest(…, currentStage, …)`,
vẫn audit `restartStage` = giá trị thô như ghi chú bài học #13. Không đổi 1 dòng logic nào khác.

## 2. BẰNG CHỨNG ĐỎ → XANH (môi trường build thật)

Toolchain: `JAVA_HOME=C:\Users\PC\.jdks\openjdk-26.0.2.1` · Maven 3.9.16 (wrapper dists) · `javac release 21`.

| Vòng | Lệnh | Kết quả |
|---|---|---|
| **ĐỎ** (bản HEAD, khôi phục tạm bằng `git checkout --`) | `mvn -B -pl application -am -DskipTests compile` | **BUILD FAILURE** · 21.164 s · `/…/RequestManagementUseCase.java:[511,72] local variables referenced from a lambda expression must be final or effectively final` · 1 error |
| **XANH** (bản sửa) | `mvn -B -pl application -am -DskipTests compile` | **BUILD SUCCESS** · 21.658 s · Domain, Application đều SUCCESS |
| **XANH (mở rộng)** | `mvn -B -pl infrastructure -am -DskipTests compile` | **BUILD SUCCESS** · 10.779 s · Domain, Application, Infrastructure đều SUCCESS (bao luôn 2 tệp infrastructure đã sửa ở TASK-106) |

## 3. RÀNG BUỘC ĐÃ GIỮ

| Ràng buộc | Trạng thái |
|---|---|
| Không chạy `mvn package` | ✅ chỉ dùng phase `compile` |
| Không đụng dịch vụ (8787 UI · 9000 proxy · 18081 Java) | ✅ không lệnh start/stop nào; `web/target/*.jar` không bị ghi đè |
| Chỉ sửa `java-backend/application/**` | ✅ đúng 1 tệp; không phải mở rộng sang module khác (infrastructure compile sạch, **không cần sửa**) |
| Không ghi tệp bằng PowerShell cho nội dung tiếng Việt | ✅ dùng tool `edit`/`write` |
| 1 commit nhỏ `[PHASE 2 - FIX]` · không `git add -A` · không push | ✅ xem §4 |

## 4. TỆP ĐÃ THAY ĐỔI

| Tệp | Thay đổi |
|---|---|
| `java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java` | +3 dòng (khai báo `final int restartStage` + 2 dòng chú thích), đổi `currentStage` → `restartStage` trong lambda `:514` |
| `docs/agent-progress/TASK-109.md` | Hồ sơ task này (mới) |

## 5. BLOCKED / UNKNOWN

- **Không còn lỗi biên dịch nào** trong `application` và `infrastructure` (đã chứng minh bằng 2 lệnh compile xanh ở §2).
- **Ngoài phạm vi lượt này** (thuộc captain, như TASK-106 §6 đã ghi): `mvn package` để làm mới
  `web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` + restart tiến trình Java 18081 ⇒ sau đó luật «người tạo không tự
  duyệt» / hết 403 `create_request` mới có hiệu lực live. **Không thực hiện ở đây** (ràng buộc cứng).
- UNKNOWN kế thừa từ TASK-106 §6.3: nhãn trạng thái bước bị miễn trong `RequestStoreAdapter.resubmitRequest`
  (không chặn luồng, chỉ lệch nhãn) — chưa xử lý ở lượt này.

## 6. CỔNG XANH SAU KHI SỬA (green gate — chạy lại toàn bộ cổng liên quan)

| Cổng | Lệnh | Kết quả |
|---|---|---|
| Test luồng duyệt động (có 3 ca JAVA parity đọc chính tệp vừa sửa) | `node --test tests/p2-approval-dynamic.test.mjs` | **16 pass / 0 fail** ✔ (124.9 ms) |
| Unit test Java — Application | `mvn -B -pl application -am test` | **Tests run: 16, Failures: 0, Errors: 0** ✔ · BUILD SUCCESS (4.148 s) |
| Unit test Java — Domain | `mvn -B -pl domain -am test` | **Tests run: 19, Failures: 0, Errors: 0** ✔ · BUILD SUCCESS (2.864 s) |
| Regression JS | `npm run test:regression` | **69 pass / 0 fail** ✔ · exit 0 (5.65 s) |
| Workflow JS | `npm run test:workflow` | **PASS** ✔ («four-stage spec approvals/email/SLA → multi-PO/multi-delivery → …») |
| Tích hợp Java — Web (H2) | `mvn -B -pl web -am test` | ✗ **Tests run: 29, Failures: 3, Errors: 8** — xem §7 (tiền tồn tại, KHÔNG do bản sửa này) |

## 7. PHÁT HIỆN NGOÀI PHẠM VI — TÍCH HỢP H2 ĐANG ĐỎ VÌ LỆCH LƯỢC ĐỒ (TIỀN TỒN TẠI)

Sau khi sửa lỗi biên dịch, mô-đun `application` **lần đầu biên dịch được kể từ `42f91be`** ⇒ cổng tích hợp
`mvn -pl web -am test` mới chạy được và phơi ra **11 ca đỏ sẵn có**, toàn bộ do **lược đồ H2 dùng cho test lệch với
truy vấn của mã nguồn ĐÃ COMMIT** (không liên quan tới lambda `restartStage`):

| Lỗi nguyên văn (surefire) | Gốc | Bằng chứng |
|---|---|---|
| `Column "stage_kind" not found` (4 ca: `RequestApprovalIntegrationTest` ×2, `StockChainIntegrationTest`, `SupplyChainEndToEndIntegrationTest`, `SystemControllerAuthTest`) | `42f91be` (TASK-106 P2-A) đổi `RequestStoreAdapter`/`BootstrapDataAdapter` sang `stage_kind` nhưng **không** cập nhật `java-backend/web/src/test/resources/schema-h2.sql` | `stage_kind` xuất hiện **0 lần** trong `schema-h2.sql`; trong `RequestStoreAdapter.java` đã có từ **HEAD** (`git show HEAD:…` dòng 148/158/159/165) |
| `Column "version" not found` + `Column count does not match` (`workflow_definitions`, 2 ca `AdminGovernanceIntegrationTest`) | `c382b47` (PHASE 8 · WF-03) **cố ý xoá cột DEAD `workflow_definitions.version`** khỏi migration V19 + `schema-h2`, nhưng INSERT đang chạy vẫn ghi cột `version` | `CREATE TABLE workflow_definitions` trong `schema-h2.sql` không có `version` |
| `Column "result" not found` (`audit_logs`, 1 ca `SystemControllerAuthTest`) | Cột `result` không có trong `CREATE TABLE audit_logs` của `schema-h2.sql` | đối chiếu `schema-h2.sql` |
| `AdminCatalogChainIntegrationTest` 409 + `SystemControllerAuthTest` 400→401 | **Hệ quả dây chuyền** của các ca trên (DB H2 dùng chung bị nhiễm trạng thái/phiên đăng nhập không thiết lập được) | cùng tệp, cùng lần chạy |

**Kết luận:** bản sửa của lượt này **không gây** các lỗi trên (`git show --stat 89e75f5` chỉ có 2 tệp:
`RequestManagementUseCase.java` + hồ sơ này). Việc vá đòi hỏi sửa
`java-backend/web/src/test/resources/schema-h2.sql` (+ có thể `schema-seed.sql`) ⇒ **ngoài phạm vi được phép**
(`application/**`, `infrastructure/**`) ⇒ **không sửa**, chuyển captain quyết định. Đề xuất: một task riêng thêm
`stage_kind` vào `approval_stage_catalog` của `schema-h2.sql`, bỏ `version` khỏi INSERT `workflow_definitions`,
thêm `result` vào `audit_logs` — rồi chạy lại `mvn -pl web -am test` để lấy baseline xanh.
