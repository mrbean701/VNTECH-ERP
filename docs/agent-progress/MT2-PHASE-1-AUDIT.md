# MT2 — NHẬT KÝ AUDIT PHASE 1 (§1–§2) — VNTECH ERP V5.3.0 (MASTER BASELINE R1.1.1)

> File này ghi lại các việc của **PHASE 1** trong MT2 (đường test H2 + bài học memory).
> Quy ước chung: chỉ ghi việc **ĐÃ ĐO** — ⛔ không ghi suy luận như thể là bằng chứng.

---

## 23/09/2026 — MT2-P1-03b **DONE**: sửa bài học H2 «chỉ cần khai ở entity» ⇒ **PHẢI KHAI Ở CẢ 2 NƠI**

**VẤN ĐỀ (bài học cũ SAI khi dùng làm quy tắc)** ✗: `docs/18_KE_HOACH_SUA_LOI_HIEN_THI_MENU_PHAN_QUYEN_WORKFLOW.md` mục 10.2 ghi chú **(d)**:
> «H2 + `ddl-auto=create-drop`: Hibernate DROP và tạo lại `users` SAU khi chạy `schema-h2.sql`, nên cột thêm bằng `ALTER TABLE` trong schema bị xoá. Phải khai báo `system_level_code` trong `UserJpaEntity`.»

Câu này đúng **hiện tượng** nhưng bị đọc thành **quy tắc «chỉ cần khai ở entity»** ⇒ người sau BỎ `ALTER TABLE` trong `schema-h2.sql` và làm ĐỎ hàng loạt test.

**SỰ THẬT ĐÃ ĐO (MT2-P1-03)**: phải khai **CẢ HAI** — ① entity (`*JpaEntity`: Hibernate **đọc cột theo entity**, thiếu ⇒ `Column "uje1_0.signature_url" not found`) ② `ALTER TABLE … ADD COLUMN IF NOT EXISTS` trong `schema-h2.sql` (khối `[H2-MANUAL-START]`, nay ở `schema-h2.sql:2291`) vì bảng H2 **lấy từ file này**.
**BẰNG CHỨNG SỐ**: trước khi vá `0 Failures / 38 Errors` ⇒ sau khi vá **42 test · 3 Failures (đúng 3 ca CÓ SẴN `ProductionRoleCounterProofTest`) · 0 Errors** ✔

**VÌ SAO QUY TẮC CŨ KHÔNG CÒN ĐÚNG**: ghi chú (d) dựa trên `ddl-auto=create-drop`; nay test chạy **`ddl-auto: none`** (`java-backend/web/src/test/resources/application-test.yml:18`, xem `TASK-115`) ⇒ **lược đồ H2 = chính `schema-h2.sql`**, ĐÚNG như production (`application.yml:14`) ⇒ `ALTER TABLE` trong schema **⛔ KHÔNG còn bị Hibernate xoá** nên nó là **BẮT BUỘC**.

**⚠️ DỮ KIỆN ĐÍNH CHÍNH** (đo bằng `glob **/schema-h2.sql`): có **HAI bản sao** — bản TEST `java-backend/web/src/test/resources/schema-h2.sql` và bản DEMO/DEV `java-backend/web/src/main/resources/db/demo/schema-h2.sql`. ⛔ **KHÔNG** có đường dẫn `db/demo/schema-h2.sql` ở gốc repo (vài ghi chép cũ ghi sai đường dẫn này ⇒ đã sửa lại trong bài học).

**ĐÃ LÀM** ✔:
1. `docs/18_…md` — thêm khối **CẬP NHẬT 23/09/2026 — GHI CHÚ (d) CHƯA ĐỦ — NGUỒN SỰ THẬT MỚI** ngay dưới ghi chú cũ (giữ nguyên văn bản cũ để không mất lịch sử).
2. Memory dự án — ghi bài học dạng **quy tắc** (kèm bằng chứng số + 2 đường dẫn schema + bẫy DDL động `PREPARE/EXECUTE` của V21/V22 mà generator không bắt được).
3. Hợp đồng khoá kiến thức: `tests/p1-03b-h2-lesson.test.mjs` **3/3 XANH** — test này **ĐỎ nếu ai đó** đổi `ddl-auto`, xoá khối `[H2-MANUAL-START]`, bỏ cột ở entity, hoặc sửa bài học sang đường dẫn schema sai.

- **Trạng thái**: ✅ **MT2-P1-03b = DONE** ⇒ **PHASE 1 = 8/8**; MT2 **90/98 = 91,8 %** (90 DONE · **0 TODO** · 3 SKIPPED · **6 BLOCKED** / 99 dòng)
- **Tiếp theo**: ⛔ hết TODO — chuyển sang **đối soát nợ trạng thái PHASE 2** và các **BLOCKED chờ user** (P5-03/P5-04 ngưỡng cấp bậc · P10-05 `correspondence_id` · P14-03 lệch schema license · P14-05 final audit).
