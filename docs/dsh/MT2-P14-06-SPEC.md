# MT2-P14-06 (ĐỀ XUẤT) — ĐẶC TẢ SẴN SÀNG THI HÀNH: VÁ 3 KHE HỞ GHI CỘT (parity ghi JS ⇄ Java)

> TRẠNG THÁI: **CHỜ USER DUYỆT** (chưa mở task, ⛔ chưa sửa mã) · Cập nhật **23/09/2026**
> ⛔ **NO COMMIT · NO PUSH** · Nguồn gốc: `docs/dsh/MT2_GATE_SWEEP_23-09.md` §H.6 + §H.18.1 · Quyết định: `MT2_BLOCKER_DECISION_BRIEF.md` §⑤.1
> ⛔ Đặc tả này **không tự thi hành**: chỉ chạy sau khi user chọn **(A)** (hoặc **(C)** cho riêng `stage_kind`).

---

## 1. VẤN ĐỀ (đã ĐO, ⛔ không suy đoán)

| # | Cột | Nguồn JS (parity) | Java hiện tại | Mức độ |
|---|---|---|---|---|
| ① | `approval_stage_catalog.stage_kind` | có ghi | `OpsTaskStoreAdapter.java:335` — câu `INSERT` **⛔ THIẾU** `stage_kind`; cột `varchar(16) NOT NULL DEFAULT 'approval'` | 🔴 **CAO** |
| ② | `users.avatar_url` | có ghi | **⛔ không có đường ghi nào ở Java** | 🟡 trung bình |
| ③ | `boq_versions.approved_at` | có ghi | **⛔ không có đường ghi nào ở Java**; bảng ⛔ **không có** cột `approved_by` | 🟡 trung bình |

**Hệ quả ① (đã đo):** bước mới tạo qua đường Java ⇒ `stage_kind = 'approval'` (**giá trị mặc định**) ⇒ nếu là bước chuỗi **CUNG ỨNG** sẽ **lọt vào chuỗi phê duyệt**.
**Hiện TIỀM ẨN:** action `save_approval_stage` trả **403** («chưa khai báo quyền») ⇒ chưa có đường ghi nào chạy được từ UI/API.
**Dữ liệu hiện có:** `approval_stage_catalog` — `approval` **5** dòng (bước 1–5) · `supply` **3** dòng (bước **101 · 102 · 103**).

## 2. MỤC TIÊU (objective)
Java **ghi đủ cột** như JS ở cả 3 điểm ⇒ ⛔ hết lệch parity ghi; và có **test** chặn hồi quy.

## 3. PHẠM VI (inScope — dự kiến)
```text
java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/OpsTaskStoreAdapter.java
java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/UserAdminStoreAdapter.java      (nếu (A) cả ②)
java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BoqStoreAdapter.java           (nếu (A) cả ③)
java-backend/**/src/test/java/**                                                                                     (test mới)
```
**outOfScope:** ⛔ không đổi schema/DB (cột đã tồn tại) · ⛔ không đổi JS (`scripts/system-route.mjs` là chuẩn parity) · ⛔ không backfill dữ liệu cũ · ⛔ không đổi RBAC của `save_approval_stage`.

## 4. CÁC BƯỚC THI HÀNH (TDD đỏ → xanh)
1. **ĐỎ — viết test trước:** test hợp đồng cho `saveApprovalStage` ghi **đủ `stage_kind`** (và ② `avatar_url`, ③ `approved_at` nếu chọn (A) cả 3) ⇒ chạy để thấy **FAIL** (⛔ không viết mã trước).
2. **XANH — sửa `INSERT`/`UPDATE`:** thêm cột + bind tham số; giữ **nguyên** thứ tự cột đã có, chỉ **thêm** cột thiếu.
3. `mvn -pl web -am test` ⇒ kỳ vọng **64/64 + test mới**.
4. Chạy lại probe liên quan: `probe-write-map-triage.mjs` (bộ phân loại khe hở ghi) ⇒ kỳ vọng «thiếu CẢ HAI» **giảm đúng số cột đã vá**.
5. `npx tsc --noEmit` · `npm run test:regression` (⛔ không hồi quy frontend).
6. Làm mới identity + build **đúng thứ tự**: `node tools/gd-cycle.mjs "<NHÃN>" --no-build` → `npm run build` → `validate:artifact`.
7. Ghi `docs/dsh/MT2_GATE_SWEEP_23-09.md` §H.24 (bằng chứng trước/sau) + cập nhật `MT2_PHASE_TASK_LIST.md` (thêm dòng `MT2-P14-06` với trạng thái thật).

## 5. TIÊU CHÍ NGHIỆM THU (acceptance)
* `INSERT` của Java cho `approval_stage_catalog` **có** `stage_kind`; khi tạo bước chuỗi cung ứng ⇒ cột nhận **`'supply'`** (⛔ không rơi về `'approval'`).
* ② và ③ (nếu chọn (A) cả 3): có đường ghi thật + test chứng minh giá trị được lưu.
* `mvn -pl web -am test` **xanh** (không giảm số test cũ) · `tsc` **0** · `probe-write-map-triage` giảm đúng số khe hở.
* ⛔ Không đổi schema, ⛔ không DML dữ liệu cũ, ⛔ không hạ nhẹ phép kiểm nào.

## 6. RỦI RO & GIẢM THIỂU
| Rủi ro | Giảm thiểu |
|---|---|
| Lệch thứ tự cột khi thêm vào `INSERT` | Test hợp đồng + đối chiếu `information_schema` (như seed đã làm: **15 cột = 15 giá trị**) |
| `stage_kind` bị đặt sai giá trị nghiệp vụ | ⛔ **không tự suy diễn**: chỉ ghi theo nguồn parity JS; nếu JS cũng chưa rõ ⇒ dừng và hỏi user (MT2 §14) |
| Ảnh hưởng bước đang chạy | Cột có `DEFAULT`; ⛔ không `UPDATE` dữ liệu lịch sử |
| Build/fingerprint lệch | Làm mới identity **trước** build (đúng quy trình đã dùng ở `MT2-P14-03c`) |

## 7. PHƯƠNG ÁN KHÁC (nếu user chọn)
* **(B) chỉ ghi nhận:** ⛔ không mở task; ghi vào `MT2-P14-05` (known limitation) ⇒ kết thúc.
* **(C) chỉ vá `stage_kind`:** giữ nguyên bước 1–7 nhưng **chỉ** áp cho ① (rủi ro cao nhất) ⇒ phạm vi hẹp hơn, ⛔ vẫn phải có test.
