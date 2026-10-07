# TASK-151 — GO-LIVE ĐỢT 6: HỒI QUY JAVA + VÁ LỖI HẠ TẦNG TEST (H2 THIẾU BẢNG V37)

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Trạng thái** | ✅ XONG — **toàn bộ suite Java 147/147 XANH** (trước đó 4 vệ ĐỎ) |
| **BUG** | **BUG-20261005-004** (MEDIUM — hạ tầng test) |
| **Tệp sửa** | `java-backend/web/src/test/resources/schema-h2.sql` |
| **Vân tay** | Không đổi — `java-backend/` **ngoài** `ROOT_DIRS` |

---

## ① HỒI QUY CHO BẢN VÁ TASK-150 (§10) — **KHÔNG GÂY HỒI QUY**

Sau khi sửa `UserManagementUseCase.saveUserAccess` (use-case **lõi**, nhiều test dùng), tôi chạy **toàn bộ** test backend:

**Kết quả lần đầu: 4 lớp test có lỗi** — `NotificationCenterTest` · `RequestNoProjectBootstrapIntegrationTest` · `RequestOverdueReasonTest` · `SystemControllerAuthTest`. Cả 4 **đều liên quan quyền** ⇒ **nghi ngờ bản vá của tôi**.

**⛔ KHÔNG suy luận — đo bằng BASELINE.** Cài lại **mã CŨ** (trước bản vá) rồi chạy đúng 4 lớp đó:

| | Mã CŨ (trước bản vá) | CÓ bản vá |
|---|---|---|
| Số lỗi `Table "contract_reviews" not found` | **4** | **4** |
| Nguyên nhân | `org.h2.jdbc.JdbcSQLSyntaxErrorException: Table "contract_reviews" not found` | **y hệt** |

⇒ **LỖI CÓ SẴN — bản vá của tôi KHÔNG gây hồi quy.** (Cùng nguyên nhân, cùng số lượng, khác hẳn về bản chất với việc sửa `permission_source`.)

---

## ② BUG-20261005-004 (MEDIUM) — SCHEMA H2 THIẾU BẢNG DO MIGRATION V37 TẠO

| | |
|---|---|
| **MODULE** | Hạ tầng kiểm thử Java (`java-backend/web/src/test/resources/schema-h2.sql`) |
| **DESCRIPTION** | 4 lớp test tích hợp chết với `Table "contract_reviews" not found` |
| **SEVERITY** | **MEDIUM** (không ảnh hưởng người dùng, nhưng **4 vệ không bao giờ chạy được** ⇒ mù kiểm thử ở tầng backend) |
| **ROOT CAUSE** | ⭐ Bộ sinh `java-backend/tools/generate-h2-test-schema.mjs:28` **chỉ đọc `V1__baseline.sql`** ⇒ `schema-h2.sql` **chỉ phản ánh V1**, KHÔNG BAO GIỜ có bảng của các migration **V2…V37**. Ba bảng của V37 (`contract_reviews` · `contract_review_logs` · `error_reports`) vì thế vắng mặt, mà mã Java **có** truy vấn chúng. |
| **FIX** | Bổ sung 3 bảng của V37 vào **khối `-- [H2-MANUAL-START/END]`** — đúng chỗ mà bộ sinh **cố ý giữ lại** cho việc bổ sung tay. ⛔ **KHÔNG chạy lại bộ sinh**: chạy cũng không có bảng V2…V37, mà `schema-h2.sql` đang commit là bản bàn tay đã qua cổng (chính tài liệu của bộ sinh cảnh báo điều này). |
| **FILES CHANGED** | `schema-h2.sql` (2399 → **2461** dòng) — chỉ THÊM, ⛔ không sửa/xoá dòng nào |
| **TEST** | Xem ③ |
| **STATUS** | **FIXED · VERIFIED** |

---

## ③ KIỂM CHỨNG

| Bước | Kết quả đo được |
|---|---|
| 4 lớp test trước đây ĐỎ | **`Tests run: 11, Failures: 0, Errors: 0`** · **BUILD SUCCESS** |
| **Toàn bộ suite Java** | Domain **19** · Application **38** · Infrastructure **13** · Web **77** = **147 test · 0 failure · 0 error** · **BUILD SUCCESS** · `MVN_EXIT=0` |
| `UserOverrideSourceIntegrationTest` (bản vá TASK-150) | vẫn **3/3 XANH** |
| Dòng thêm vào `schema-h2.sql` | 2399 → **2461** (+62) · CRLF giữ nguyên · ⛔ chỉ THÊM |

⭐ **Đây là lần đầu trong chuỗi GO-LIVE toàn bộ suite Java chạy XANH** — trước đây không chạy được vì định đề sai «không có Maven» (D-110), và 4 vệ đỏ đã tồn tại sẵn mà không ai thấy.

---

## ④ Ý NGHĨA — CHUẨN NGHIỆM THU CHO JAVA ĐÃ NÂNG

| Trước | Nay |
|---|---|
| Java chỉ được «verify tĩnh» (đọc mã, không biên dịch) | **Biên dịch được** (`mvn -o compile`) |
| Không chạy được test Java | **Chạy được** (`mvn -o test`) — **147 test** |
| 4 vệ đỏ tồn tại âm thầm | **147/147 XANH** |
| Sửa Java không kiểm chứng được | **Sửa → biên dịch → test tích hợp → đối chứng âm** |

⇒ Từ nay **mọi thay đổi Java phải kèm** `mvn -o test` xanh; không chấp nhận «verify tĩnh» nữa.

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| `mvn -o test` (toàn backend) | **147 test · 0 failure · 0 error** · BUILD SUCCESS · EXIT=0 |
| Baseline đối chứng (mã cũ vs có vá) | **4 lỗi ↔ 4 lỗi** cùng nguyên nhân ⇒ không hồi quy |
| `verify-vntech-fingerprint` | **ĐẠT** `VNTECH-FP-614484381419C595` (**không đổi**) |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn chạy **JAR cũ** (chưa triển khai) |

---

## ⑥ BÀI HỌC

1. ⛔⛔ **BASELINE LÀ BẮT BUỘC KHI TEST ĐỎ SAU KHI SỬA.** 4 lớp test đỏ đều **liên quan quyền** — rất dễ kết luận ngay «do bản vá của tôi». Chạy lại bằng **mã cũ** cho thấy **cùng 4 lỗi, cùng nguyên nhân** ⇒ có sẵn. Nếu bỏ bước này tôi đã **hoặc** hoảng loạn revert một bản vá đúng, **hoặc** bỏ qua một lỗi hạ tầng thật.
2. ⭐ **Lỗi hạ tầng test cũng là lỗi thật** — 4 vệ đỏ nằm im vì **không ai chạy được Java test**. Khi năng lực kiểm thử được khôi phục (D-110), lỗi cũ **lộ ra ngay**.
3. ⛔ **Đọc tài liệu của chính công cụ trước khi chạy nó.** `generate-h2-test-schema.mjs` có hẳn khối cảnh báo: bản đang commit là **bản bàn tay đã qua cổng**, ⛔ không chạy sinh lại mù quáng. Nếu tôi cứ chạy bộ sinh thì **không sửa được gì** (nó chỉ đọc V1) và còn **ghi đè mất các bổ sung tay**.
4. ⭐ **Sửa đúng chỗ dành cho mình**: khối `[H2-MANUAL-START/END]` tồn tại chính vì việc này — dùng nó thay vì rải DDL lung tung.

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết 4 việc** (giữ nguyên từ TASK-150, chưa có trả lời):
1. **Triển khai** — cho build lại JAR + khởi động lại Java `:18081`? (làm luôn thì Flyway tự ghi V35+V37)
2. Sửa `AGENTS.md` để xoá định đề «không có Maven»? (`DECISIONS.md` **D-110** + `MASTER_STATUS.md` đã sửa)
3. Mở task xây tính năng «thêm thành viên tổ đội»?
4. Commit?
