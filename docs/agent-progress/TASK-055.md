# TASK-055 — `approval_mode_snapshot` ĐÓNG BĂNG chế độ duyệt thành `single` ⇒ bước `all_roles` KHÔNG BAO GIỜ có hiệu lực

**Trạng thái:** **CONFIRMED — CHỜ NGƯỜI DÙNG QUYẾT ĐỊNH** (đây là **quy tắc nghiệp vụ**, không phải lỗi kỹ thuật thuần)
**Ngày:** 17/09/2026 · **Nguồn:** phát hiện khi kiểm chứng TASK-054 (#89)

---

## 1. Sự việc (đo được, không suy đoán)

| Bằng chứng | Kết quả |
|---|---|
| Cấu hình hiện tại (`approval_stage_catalog`) | bước **5** = `all_roles`, `allowed_role_codes='da_truong,kh_truong'`, tên *"Trưởng phòng Dự án + Kế hoạch xác nhận cuối"* |
| `approval_mode_snapshot` của các phiếu | **21/21** dòng bước `all_roles` = **`single`** |
| Hành vi quan sát được (probe TASK-054, lần chạy chưa có fixture) | một lần xác nhận ở bước 5 ⇒ hồ sơ **hoàn tất ngay**; **không** sinh dòng quyết định vai trò, **không** có audit `APPROVE_PARTIAL` |

## 2. Cơ chế (đối chiếu nguyên văn, **giống nhau ở CẢ HAI lõi**)

* **Ghi:** JS `system-route.mjs:976` — `approval_mode_snapshot = assignedOwner ? "single" : (clean(stage.approvalMode) || "single")`
  ⇒ hễ bước **có Owner phân công** (`approval_project_assignments`) thì snapshot bị **ghi cứng `single`**.
  Java port y hệt (`RequestManagementUseCase.createRequest`: `approval.put("approvalMode", "single")`).
* **Đọc:** JS `:1080` — `COALESCE(NULLIF(a.approval_mode_snapshot,''),cfg.approval_mode,'single') AS approvalMode`
  ⇒ **snapshot thắng cấu hình hiện tại**. Java `RequestStoreAdapter.approvalStagesForRequest` dùng **câu SQL y hệt**.
* ⇒ Với dữ liệu thật (mọi bước đều có Owner), `approvalMode` luôn = `single` ⇒ khối `all_roles` là **mã chết** ở cả hai lõi.

**Hệ quả nghiệp vụ:** bước duyệt cuối cùng *"Trưởng phòng Dự án + Kế hoạch xác nhận cuối"* **chỉ cần một** trong hai vai trò xác nhận. Ràng buộc "cả hai cùng xác nhận" mà cấu hình thể hiện **không có hiệu lực**. (Sửa SLA/cấu hình bước **không** giúp, vì snapshot cũ vẫn thắng.)

## 3. Hai hướng — cần người dùng chốt

| Hướng | Nội dung | Hệ quả |
|---|---|---|
| **(A) Giữ nguyên** | Không sửa gì. Bản Java **đúng bằng JS**; bước 5 tiếp tục chỉ cần 1 vai trò | An toàn cho cutover (hai lõi hành xử giống nhau), nhưng **quy tắc 2 vai trò không có hiệu lực** và mọi bước `all_roles` tương lai cũng vậy |
| **(B) Sửa để cấu hình có hiệu lực** | Đọc **cấu hình hiện tại** (`approval_stage_catalog.approval_mode`) thay vì snapshot, hoặc ghi snapshot đúng chế độ khi tạo phiếu | Bước 5 **sẽ cần đủ 2 vai trò**; **thay đổi hành vi so với JS** ⇒ phải kiểm lại các phiếu đang `pending` ở bước 5 (hiện **2 phiếu**) và chấp nhận rằng phiếu cũ có thể phải duyệt thêm |
| **(C) Sửa nửa bước** | Chỉ sửa cho **phiếu MỚI** (ghi snapshot đúng), giữ nguyên phiếu cũ | Phiếu cũ vẫn 1 vai trò, phiếu mới đủ 2 vai trò — **hai quy tắc cùng tồn tại** |

**Khuyến nghị kỹ thuật của tôi:** nếu quy tắc "2 vai trò cùng xác nhận" là yêu cầu nghiệp vụ thật ⇒ chọn **(C)** (ít rủi ro nhất cho dữ liệu đang chạy: **7 phiếu `pending` ở bước 5** vẫn hoàn tất được theo luật cũ) rồi chuyển sang (B) ở giai đoạn sau. Nếu anh chưa chắc về quy tắc ⇒ chọn **(A)** và ghi lại làm nợ kỹ thuật.

**7 phiếu ĐANG chờ ở bước 5** (đo 17/09, sẽ bị ảnh hưởng nếu đổi luật): `DNMH-PRJ-DEMO-01-2026-0010` · `-0017` · `-0018` · `-0020` · `-0021` · `-0023` · `-0024`.

## 4. Việc phải làm khi anh chọn (B) hoặc (C)
1. Sửa **cả hai phía** (JS + Java) cho khớp nhau — nếu lệch, cutover sẽ hành xử khác nhau theo từng request.
2. Probe mở rộng từ `tools/probe-task054-all-roles.mjs`: **bỏ fixture** (đặt snapshot) và khẳng định phiếu MỚI tự có `approval_mode_snapshot` theo cấu hình.
3. Kiểm lại **7 phiếu đang `pending` ở bước 5** (danh sách ngay trên) trước khi đổi luật.
