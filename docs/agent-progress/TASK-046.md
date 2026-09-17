# TASK-046 — Vòng rà CUỐI "bản đồ GHI": `purge_audit_id` + `changed` — và **lỗi P0 `delete_project` HTTP 500** bị probe bắt

**Trạng thái:** **DONE** — đã sửa + kiểm chứng lúc chạy **17/17 ĐẠT, exit 0**
**Nguồn phát hiện:** cổng `tools/probe-write-map-triage.mjs` báo 7 bảng lệch còn lại; phân loại 3 cột ở known issue #44
**Ngày:** 17/09/2026 · **Commit:** #67

---

## 1. Hai cột được vá

| Cột | Bằng chứng JS | Bản Java CŨ | Đã sửa |
|---|---|---|---|
| `project_archives.purge_audit_id` | `system-route.mjs:2451-2452`: ghi **1 dòng `audit_logs`** (action `PURGE_AFTER_OFFLINE_ARCHIVE`, entity `project`) rồi `UPDATE project_archives SET purge_audit_id=<auditId>` | `ProjectAdminStoreAdapter:242` **dừng ở** `UPDATE project_archives SET status='purged',purged_at=?` ⇒ **thiếu cả hai câu** ⇒ purge dự án **không có vết audit liên kết** | thêm cổng `AuditLogPort.logReturningId(...)` + `setArchivePurgeAuditId(...)`; `ProjectManagementUseCase.deleteProject` ghi audit rồi liên kết id |
| `boq_price_import_items.changed` | `:2827` `INSERT (…,changed,created_at) … row.isChanged?1:0` | `BoqStoreAdapter:706` ghi `(id,batch_id,boq_item_id,old_unit_price,new_unit_price,created_at)` ⇒ **thiếu cột `changed`** ⇒ lịch sử nhập giá không phân biệt được dòng nào đổi | thêm tham số `changed` vào `BoqStore.insertPriceItem` + adapter; use case truyền `isChanged` (đã tính sẵn cho bộ đếm) |

**Thiết kế có chủ đích:** `AuditLogPort.logReturningId` để `default` (trả `null`) — **giữ `AuditLogPort` là FUNCTIONAL INTERFACE**, không làm vỡ các lambda `(a,b,c,d,e,f,g) -> {}` trong test cũ.

## 2. LỖI P0 bị CHÍNH PROBE bắt: `delete_project` **luôn HTTP 500**

Lần chạy probe đầu tiên: `delete_project` ⇒ **500**, log Java:
```
Incorrect DATETIME value: '0000'
  at ProjectAdminStoreAdapter.latestVerifiedArchive(ProjectAdminStoreAdapter.java:148)
```
Nguyên nhân: JS truyền mốc `"0000"` (`latestVerifiedArchive(projectId, "0000")`) — **SQLite so chuỗi nên vô hại**, còn **MySQL 8 từ chối** giá trị DATETIME `'0000'` (error 1525) ⇒ **không admin nào purge được dự án** trên backend Java.
**Đã sửa:** dùng hằng `ARCHIVE_FLOOR = "1970-01-01 00:00:00"` (mốc epoch hợp lệ, bao trọn mọi dữ liệu) — giữ nguyên nghĩa "không giới hạn dưới".

> Đây là **cùng họ** với lỗi `retry_email` (TASK-042): mã port từ SQLite sang MySQL mà **không đối chiếu kiểu dữ liệu**.

## 3. Kiểm chứng lúc chạy — `tools/probe-task046.mjs`: **17/17 ĐẠT, exit 0**

jar **90.896.045 bytes** (17:39) · API PID **35432** (job `pwsh-85`) · log **0 ERROR** · regression **59/61** (2 lỗi cũ) · cổng lược đồ **8 phát hiện (toàn bộ nhóm 6)**

| Nhóm | Phép kiểm | Trước khi vá | Sau khi vá |
|---|---|---|---|
| A0 | dựng dự án TẠM + archive VERIFIED tạm | ĐẠT | ĐẠT |
| A1 | `delete_project` | **HTTP 500** | **HTTP 200** + thông điệp nguyên văn |
| A2 | có dòng `audit_logs` `PURGE_AFTER_OFFLINE_ARCHIVE` | **0 dòng** | **1 dòng** |
| A3 | `entity_type='project'` + `user_id`=admin | — | ĐẠT |
| A4 | `before_json` **JSON hợp lệ** + chứa dòng dự án (kiểm bộ escape tự viết) | — | ĐẠT |
| A5 | `after_json` đúng nội dung JS (`archiveId`/`archiveSha256`/`status`/`crossProjectTracePreserved`) | — | ĐẠT |
| A6 | `purge_audit_id` = **đúng** id audit | **NULL** | `AUD_f9ab0213…` khớp tuyệt đối |
| A7/A8 | archive `status='purged'`+`purged_at`; `projects.status='purged'` | ĐẠT | ĐẠT |
| B1–B4 | `changed` ghi thật cho cả 3 lần | **cột không tồn tại trong INSERT** | `1:100000→101000 · 1:101000→100000 · 0:100000→100000` |
| Dọn dẹp | 4 bảng dữ liệu thật về đúng số dòng; mọi dòng audit của probe đã xoá | — | ĐẠT |

**An toàn dữ liệu:** phần A dùng **dự án TẠM** `PRJ_ZZP046` + archive tạm (purge chỉ đụng các dòng có `project_id` tạm) rồi tự xoá; phần B dùng dòng BOQ thật nhưng **trả giá về đúng giá gốc** và tự xoá batch/item — khẳng định cuối cùng `unit_price` = giá gốc.

## 4. Bài học

1. **Probe phải tự kiểm phép đo của mình.** Lần chạy đầu báo "A2 HỎNG" vì tôi lọc `audit_logs` theo mỗi `entity_id` — nhưng `AuditTrailFilter` (tầng web) **ghi 1 dòng cho MỖI request**, nên có 2 dòng cùng `entity_id` (1 của filter, 1 của luồng purge). Phép kiểm đúng phải **lọc theo `action`**.
2. **Không được "dọn" nhật ký thật.** 3 dòng `audit_logs` tăng thêm là do filter ghi cho chính các request của probe — đó là **nhật ký thật**, probe **không** xoá mà **ghi rõ giới hạn**.
3. **`"0000"` là bẫy SQLite → MySQL** (giống họ lỗi TASK-042). Mọi giá trị "mốc" so sánh chuỗi trong JS phải được **kiểm kiểu** trước khi port.
4. **Probe chạy TRƯỚC khi vá đã trả về đúng thứ cần trả về**: một lỗi P0 mà cổng lược đồ **không thể** bắt (cột `generated_at` có thật, câu SQL cú pháp đúng — chỉ sai **giá trị**).

## 5. Còn lại của vòng rà 3 cột
`boq_versions.approved_at` = **LIKELY DƯƠNG TÍNH GIẢ** (JS `:2805` bind thẳng `null`) — cần xác nhận nốt không còn chỗ nào ghi giá trị thật; không sửa mã.
