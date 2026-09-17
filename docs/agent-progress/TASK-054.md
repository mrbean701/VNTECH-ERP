# TASK-054 — Nhánh duyệt SONG SONG `all_roles`: **đã port đủ ở Java (#89)** — nhưng NGUYÊN NHÂN tôi nêu ở #88 **SAI**, xem mục 3

**Trạng thái:** **DONE (port + kiểm chứng 20/20)** · phát hiện kèm ⇒ **TASK-055** (cần người dùng quyết định)
**Ngày:** 17/09/2026 · **Commit:** #87 (hồ sơ, **có kết luận sai**) · **#89 (port + kiểm chứng + đính chính)**

---

## 1. Đã port những gì (nguyên văn JS `:1087-1108`)

| # | Hành vi (JS) | Trước #89 ở Java | Sau #89 |
|---|---|---|---|
| 1 | `required` = vai trò bắt buộc của bước (`:1088`) | không có | ✔ |
| 2 | `approved` = DISTINCT `role_code` đã xác nhận (`:1089`) | chỉ biết **một** vai trò | ✔ `RequestStore.stageDecisionRoles(...)` **mới** |
| 3 | **ADMIN điền vai trò còn thiếu** (`:1091`) | **thiếu hẳn** (ném lỗi) | ✔ |
| 4 | Chặn trùng vai trò (`:1093-1094`) | ✔ đã có | ✔ |
| 5 | Ghi `approval_stage_decisions` (`:1095`) | ✔ đã có | ✔ |
| 6 | `missing` + cập nhật comment tiến độ (`:1097-1100`) | **thiếu hẳn** | ✔ `updateApprovalComment(...)` **mới** |
| 7 | **RETURN SỚM — KHÔNG chuyển bước** (`:1102`) | **thiếu hẳn** (đi tiếp như `single`) | ✔ |
| 8 | `audit(...,"APPROVE_PARTIAL",...)` (`:1101`) | **thiếu** | ✔ (**mốc thứ 6/6** của TASK-048) |
| 9 | `all_roles` + **từ chối** ⇒ ghi 1 dòng quyết định cho vai trò (`:1105-1108`) | **thiếu** | ✔ |

## 2. Kiểm chứng lúc chạy — `tools/probe-task054-all-roles.mjs` **20/20 ĐẠT** (node exit 0)

Probe **láI THẬT** trên dữ liệu thật: tạo phiếu → duyệt 4 bước `single` → tới **bước 5 `all_roles`** (`da_truong,kh_truong`):
* **Xác nhận lần 1** ⇒ hồ sơ **VẪN `pending_approval`**, **VẪN ở bước 5**, đúng **1** dòng quyết định (`da_truong` — nhờ **nhánh ADMIN điền vai trò thiếu**), comment `Đã xác nhận 1/2; còn chờ: kh_truong`, và audit `APPROVE_PARTIAL` với `after_json` = `{"stage":5,"stageName":"Trưởng phòng Dự án + Kế hoạch xác nhận cuối","roleCode":"da_truong","missing":["kh_truong"]}`.
* **Xác nhận lần 2** ⇒ đủ 2/2 vai trò **mới** hoàn tất (`approved`) + sinh bước chờ lập PO.
* Chuỗi audit: `CREATE → APPROVE_PARTIAL → …` (các dòng `decide_approval` là của `AuditTrailFilter`).
* **Dọn sạch có kiểm chứng**: mọi bảng nghiệp vụ (kể cả `supply_workflow_steps`, `stock_reservations`) về **đúng số dòng ban đầu**.

## 3. ⚠️ ĐÍNH CHÍNH: kết luận ở #88 ("Java chuyển bước sớm, JS thì không") là **SAI**

**Chuyện đã xảy ra:** lần chạy probe **đầu tiên** (chưa có fixture) cho kết quả **7/18**: một lần xác nhận ở bước 5 là hồ sơ **hoàn tất ngay**, **không** có dòng quyết định vai trò, **không** có audit `APPROVE_PARTIAL`. Tôi đã suýt ghi đây là *"hành vi cũ sai"* — nhưng nó là **hành vi ĐÚNG của cả hai lõi**, và **giả định của tôi mới là thứ sai**:

* JS `:1080` dùng **ĐÚNG câu truy vấn** mà Java port: ưu tiên `approval_mode_snapshot`, chỉ khi snapshot rỗng mới lấy cấu hình hiện tại ⇒ `COALESCE(NULLIF(a.approval_mode_snapshot,''),cfg.approval_mode,'single')`.
* JS `:976` ghi snapshot = `assignedOwner ? "single" : (clean(stage.approvalMode) || "single")` ⇒ **hễ bước có Owner phân công thì snapshot = `single`**, vĩnh viễn.
* **Đo trên toàn bộ dữ liệu hiện có: `21/21` dòng bước `all_roles` đều là `approval_mode_snapshot='single'`.**
* ⇒ Nhánh `all_roles` **không bao giờ chạy** ở **CẢ HAI lõi** ⇒ bước 5 *"Trưởng phòng Dự án + Kế hoạch xác nhận cuối"* thực chất **chỉ cần MỘT trong hai vai trò** xác nhận.

**Bài học (đã ghi vào CONTINUATION NOTES #24):** khi một phép đo cho ra hành vi "sai", **phải kiểm bản đối chứng (JS) TRƯỚC khi buộc tội bản port** — nhất là khi bản port chỉ *thiếu mã* mà **câu SQL đọc dữ liệu thì giống hệt**. Tôi đã viết hồ sơ #88 dựa trên **suy luận từ chú thích trong mã** ("đơn giản: tiếp tục như single") mà **không** kiểm câu truy vấn của JS.

## 4. Phát hiện kèm ⇒ **TASK-055** (cần người dùng quyết định)

"Sửa" tình trạng đóng băng này **sẽ lệch khỏi JS**, nên **không tự làm**. Hai hướng (ghi ở `TASK-055.md`): (a) giữ nguyên (đúng bằng JS, nhưng ràng buộc 2 vai trò không có hiệu lực); (b) sửa để đọc **cấu hình hiện tại** thay vì snapshot (thay đổi hành vi nghiệp vụ: bước 5 sẽ cần đủ 2 vai trò) — cần người dùng chốt vì đây là **quy tắc nghiệp vụ**, không phải lỗi kỹ thuật thuần.
