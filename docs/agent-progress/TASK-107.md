# TASK-107 — PHASE 7 (`AD-14`): NHẬT KÝ KIỂM TOÁN — THÊM CỘT `result` (8/8 TRƯỜNG)

**Ngày:** 21/09/2026 · **Người chỉ đạo:** người dùng («AD-14 thêm result») + captain (giao việc, chốt cách làm)
**Phạm vi tệp đã sửa:** `drizzle/0162_…sql` (ADDITIVE) · Flyway `V22__…sql` · `scripts/system-route.mjs` (2 chỗ ghi +
đường đọc bootstrap) · `java-backend/…/AuditLogAdapter.java` · `java-backend/…/BootstrapDataAdapter.java` ·
`app/screens/admin-governance-pure.ts` · `app/page.tsx` · `tests/ad14-audit-result.test.mjs` (mới) ·
`tests/ad14-audit-fields-blocked.test.mjs` (cập nhật) · `docs/25_TODO_ROADMAP.md` + `docs/agent-progress/MASTER_STATUS.md` (ô số).
**KHÔNG build/mvn/javac/restart** · **KHÔNG xoá bảng/cột/dữ liệu**.

---

## 1. ĐỀ BÀI → KẾT QUẢ

Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-14`: «Thêm: hành động · module · thực thể · mã thực thể ·
thời gian · IP · **kết quả** · **metadata**». Trước đợt này mục ghi **BLOCKED** vì `audit_logs` thiếu cột
`result` + `metadata` và lượt đó **CẤM migration** (`docs/agent-progress/AD-14-AUDIT-LOG-KET-QUA-METADATA-BLOCKED.md`).

⇛ 21/09/2026 người dùng CHỈ ĐẠO «AD-14 thêm result» ⇒ mở lại mục:

| Trường | Nguồn SAU khi làm | Cách làm |
|---|---|---|
| 6 trường đầu | `audit_logs.action` · `module_key` · `entity_type` · `entity_id` · `occurred_at` · `ip_address` | đã có từ trước |
| **Kết quả** | **`audit_logs.result`** (CỘT THẬT mới) | migration ADDITIVE + ghi thật ở 2 đường + bootstrap trả về + UI hiển thị |
| **Metadata** | **`audit_logs.before_json` + `audit_logs.after_json`** (ÁNH XẠ) | người dùng chốt: **KHÔNG** thêm cột `metadata` ⇒ tránh dữ liệu trùng nghĩa |

## 2. QUY ƯỚC GIÁ TRỊ `result` (từ vựng ĐÓNG, ngắn)

| Giá trị | Nghĩa | Khi nào dùng |
|---|---|---|
| `ok` | Đã thực hiện xong | **mặc định**; mọi bản ghi hiện có đều thuộc nhóm này (xem §4) |
| `denied` | Bị từ chối | khi nơi gọi CHỦ ĐỘNG ghi lại một lần từ chối |
| `failed` | Thao tác lỗi | khi nơi gọi CHỦ ĐỘNG ghi lại một lần lỗi |

- JS: `audit(userId, action, entityType, entityId, before, after, request, result = "ok")` — tham số có mặc định,
  `clean(result) || "ok"` bảo đảm KHÔNG rỗng.
- Java: hằng `RESULT_OK = "ok"` · `RESULT_DENIED` · `RESULT_FAILED` trong `AuditLogAdapter`;
  `logDetailed(entry)` đọc khoá `entry.get("result")` (thiếu ⇒ `ok`).

## 3. VÌ SAO DÒNG CŨ ĐỌC RA `ok` (không bịa số liệu)

`ALTER TABLE … ADD COLUMN result VARCHAR(32) NOT NULL DEFAULT 'ok'` ⇒ MySQL điền `'ok'` cho 895 dòng đã có.
**Cơ sở (đo được, không suy đoán):**
1. Cả 2 đường ghi đều nằm ở **CUỐI nhánh THÀNH CÔNG**: JS `audit()` được gọi sau khi đã ghi DB; lỗi thì `throw`
   trước khi tới lời gọi. Java `log(...)`/`logDetailed(...)` gọi sau thao tác nghiệp vụ.
2. **Đo phân bố `action` trên 895 dòng**: `decide_approval` 182 · `update_user` 108 · `create_request` 85 ·
   `save_department_permission` 72 · `CREATE` 63 … — **KHÔNG có mã nào mang nghĩa từ chối/lỗi**
   (`denied`/`failed`/`FAIL`); tất cả là thao tác đã hoàn tất.
⇒ Đây là **suy luận có bằng chứng**, được ghi lại để người sau kiểm chứng; nếu tương lai có đường ghi
`denied`/`failed` thì phải truyền `result` tường minh (đã có sẵn tham số/khoá).

## 4. ĐO THẬT TRÊN MySQL (`vntech_erp`)

```sql
-- TRƯỚC: cột `result` KHÔNG tồn tại ⇒ không thể có dòng nào có kết quả
SELECT COUNT(*) FROM information_schema.columns
 WHERE table_schema='vntech_erp' AND table_name='audit_logs' AND column_name='result';   -- ⇒ 0
SELECT COUNT(*) FROM information_schema.columns
 WHERE table_schema='vntech_erp' AND table_name='audit_logs';                            -- ⇒ 16
```

```sql
-- SAU khi áp Flyway V22 (ADDITIVE):
-- ⇒ cột `result`: 1 · tổng cột `audit_logs`: 17 · tổng dòng: 895
-- ⇒ dòng có `result` KHÁC NULL: 895/895 · dòng `result` rỗng: 0
-- ⇒ phân bố: ok = 895
-- ⇒ cột `metadata`: 0 (đúng chủ trương: metadata = ánh xạ before_json/after_json)
```

| Chỉ số | TRƯỚC | SAU |
|---|---|---|
| Cột `result` trong `audit_logs` | **0** (không tồn tại) | **1** |
| Tổng số cột `audit_logs` | 16 | **17** |
| Dòng có `result` khác NULL | **0 / 895** | **895 / 895** |
| Dòng `result` rỗng | — | **0** |
| Cột `metadata` | 0 | **0** (metadata = `before_json` + `after_json`) |

## 5. BẰNG CHỨNG ĐỎ → XANH (`tests/ad14-audit-result.test.mjs`)

| Lần chạy | Kết quả |
|---|---|
| **ĐỎ** (chưa có migration/cột/UI/hồ sơ) | **7 test · 0 pass · 7 fail** (8/8 nguồn sai · INSERT thiếu `result` · thiếu 2 migration · UI còn «không có cột result» · chưa có TASK-107 + cột TT chưa `**DONE**`) |
| **XANH** | **8 test · 8 pass · 0 fail** |

`tests/ad14-audit-fields-blocked.test.mjs` (hợp đồng BLOCKED của đợt trước) đã được **CẬP NHẬT** sang trạng thái mới
(8/8) và **giữ nguyên phần ĐỐI CHỨNG ÂM** chống «giả nguồn» (gán `change_detail` cho `Kết quả` ⇒ cổng phải BẮT được;
chỉ bật `available=true` mà không có tên cột ⇒ vẫn HỎNG).

## 6. ĐIỂM VÁ JAVA (CHỈ SOURCE — CHƯA BUILD)

| Tệp | Vá |
|---|---|
| `java-backend/infrastructure/…/AuditLogAdapter.java` | 2 câu INSERT có cột `result`; hằng `RESULT_OK/RESULT_DENIED/RESULT_FAILED`; `logDetailed` đọc `entry.get("result")` |
| `java-backend/infrastructure/…/BootstrapDataAdapter.java` | `audits` select thêm `al.result AS result` để UI có dữ liệu |

**BLOCKED (như lượt trước):** `mvn` không phải lệnh hợp lệ và `java` không có trong PATH ⇒ **chưa biên dịch lại
được jar**, nên đường live (9000 → 18081) **chưa** thấy cột `result` cho tới khi có JDK + Maven (hoặc người có quyền build)
và restart. Đã tự kiểm **cân bằng `{}`/`()`** trên 2 tệp Java (không phát hiện lệch).

## 7. UI — 8/8 TRƯỜNG

- Danh sách nhật ký: **thêm cột «Kết quả»** (badge; bản ghi cũ chưa có `result` ⇒ hiện `—` kèm tooltip, KHÔNG bịa).
- Chi tiết bản ghi: `Kết quả: {a.result ? nhãn tiếng Việt : «chưa ghi kết quả» + lý do}`;
  `Metadata: ánh xạ từ 2 khối JSON (<code>after_json</code> [+ <code>before_json</code>]) — không có cột metadata riêng`.
- Hàm thuần `AUDIT_FIELDS` nay có 8/8 `available: true`; `AUDIT_RESULT_VALUES` + `auditResultLabel()` là nguồn nhãn dùng chung.

## 8. ĐIỀU CHƯA LÀM / RỦI RO CÒN LẠI

1. **UNKNOWN — nhánh ghi `denied`/`failed` chưa có nơi gọi nào.** Tham số/khoá `result` đã sẵn ở cả 2 đường, nhưng
   hiện chỉ có `ok`. Muốn có dữ liệu `denied` thật thì phải thêm lời gọi audit ở nhánh từ chối/lỗi (ngoài phạm vi AD-14).
2. **BLOCKED — biên dịch lại jar + restart** (thiếu JDK/Maven) ⇒ cột `result` chưa xuất hiện trên đường live.
3. `audit_logs` vẫn **0 khoá ngoại** ⇒ không có gì chặn cứng việc ghi `user_id` mồ côi (tồn tại trước, không do đợt này).
4. Không xoá bảng/cột/dữ liệu: đã rà cả 2 migration của đợt này (**0** `DROP`/`DELETE`/`TRUNCATE`).
