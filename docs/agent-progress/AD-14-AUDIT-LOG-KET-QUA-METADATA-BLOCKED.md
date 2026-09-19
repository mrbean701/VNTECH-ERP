# AD-14 — NHẬT KÝ KIỂM TOÁN: «KẾT QUẢ» + «METADATA» ⇒ **BLOCKED**

> Mục master task: `AD-14` — nguyên văn `docs/25_TODO_ROADMAP.md`:
> «Thêm: hành động · module · thực thể · mã thực thể · thời gian · IP · kết quả · metadata» (phụ thuộc `AD-13` ✔).
>
> **TRẠNG THÁI: `**BLOCKED**`** — 2/8 trường yêu cầu **KHÔNG có cột** trong `audit_logs`; muốn đủ phải **MIGRATION**,
> mà ràng buộc của nhánh này là **cấm migration** (và `scripts/**`, `drizzle/**`, `java-backend/**` đều ngoài phạm vi).

## 1. LÝ DO CHẶN (kèm bằng chứng đo được)

Bảng `audit_logs` (DB `vntech_erp`) có **ĐÚNG 17 cột**, đọc bằng `information_schema.COLUMNS`
(`SHOW`/`DESCRIBE` cùng kết quả):

```
id · user_id · action · entity_type · entity_id · before_json · after_json · ip_address · occurred_at ·
user_name · user_role · department · system_level · module_key · permission_used · change_detail
```

⇒ **KHÔNG có cột `result`** và **KHÔNG có cột `metadata`**.

Bằng chứng bổ sung (chứng minh không đường nào ghi 2 trường đó):

- `scripts/system-route.mjs:179` và `:2599` — `INSERT INTO audit_logs (id,user_id,action,entity_type,entity_id,before_json,after_json,ip_address,occurred_at)` (9 cột, không có `result`/`metadata`).
- `java-backend/.../persistence/AuditLogAdapter.java:46` (bản tối thiểu) và `:63` (bản đầy đủ 16 cột) — **không** có `result`/`metadata`.
- Bootstrap đọc nhật ký cũng chỉ trả các cột trên: `BootstrapDataAdapter.java:1219` (`data.put("audits", query(...))`).

## 2. PHẦN ĐÃ LÀM ĐƯỢC (6/8 trường CÓ NGUỒN THẬT)

| # | Trường (nguyên văn) | Cột thật | Hiển thị trong UI |
|---|---|---|---|
| 1 | hành động | `audit_logs.action` | cột «Hành động» |
| 2 | module | `audit_logs.module_key` | cột «Module» |
| 3 | thực thể | `audit_logs.entity_type` | cột «Mã thực thể» (dòng nhỏ) |
| 4 | mã thực thể | `audit_logs.entity_id` | cột «Mã thực thể» |
| 5 | thời gian | `audit_logs.occurred_at` | cột «Thời gian / IP» |
| 6 | IP | `audit_logs.ip_address` | cột «Thời gian / IP» (dòng nhỏ) |
| 7 | **kết quả** | ❌ **không có cột** | hiện **«chưa có nguồn»** + lý do ở khối chi tiết |
| 8 | **metadata** | ❌ **không có cột** | hiện **«chưa có nguồn»** + lý do; dữ liệu cấu trúc gần nhất là `before_json`/`after_json` ở khối chi tiết |

Không bịa số, không hiện 0 giả: 2 trường thiếu nguồn hiển thị đúng chuỗi `«chưa có nguồn»` kèm lý do cột.

## 3. VIỆC CẦN LÀM ĐỂ GỠ CHẶN (do người dùng quyết)

1. Cho phép **migration** thêm 2 cột: `result VARCHAR(32) NULL` (giá trị gợi ý: `success`/`failed`/`skipped`) và
   `metadata JSON NULL`; **hoặc**
2. Chốt rằng `before_json`/`after_json` **CHÍNH LÀ** metadata và **không** cần trường «kết quả» (khi đó phải sửa
   nguyên văn yêu cầu `AD-14` từ 8 trường xuống 6 trường — cần người dùng xác nhận).
3. Sau khi có cột: cập nhật `AuditLogAdapter.java:63` + `scripts/system-route.mjs:179/2599` để ghi, và
   `BootstrapDataAdapter.java:1219` để đọc ⇒ **ngoài phạm vi PHASE 7** (cấm sửa).

Hợp đồng kiểm chứng: `tests/ad14-audit-fields-blocked.test.mjs` — 4 ca, gồm **đối chứng âm** chống «lách» bằng cách
gán `result`/`metadata` sang cột khác, và ca quét mọi câu `INSERT INTO audit_logs` của cả 2 đường để chứng minh
2 trường đó **chưa từng** được ghi.
