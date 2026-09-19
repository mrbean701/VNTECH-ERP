# DSH CONTINUOUS EXECUTION GOAL — VNTECH ERP V5.3.0 (MASTER BASELINE)

Workspace này là nơi dsh chạy **MASTER TASK** của dự án ERP. AGENTS.md này quy định GOAL
mà mọi session dsh (web, CLI, Telegram) phải tuân theo khi làm việc trong workspace này.

## MASTER TASK (nguồn sự thật — đọc đầu mỗi phiên)

- **Master Task**: ERP/MIS SYSTEM AUDIT, REFACTOR & FEATURE UPGRADE — **110 mục / 12 phase**.
- File quyết định **làm gì**:
  - `docs/28_DANH_SACH_110_MUC_MASTER_TASK.md` — danh sách 110 mục master task.
  - `docs/25_TODO_ROADMAP.md` — bản đồ TODOs đầy đủ (nguồn gốc của 110 mục).
  - `docs/agent-progress/MASTER_STATUS.md` — **nguồn sự thật trạng thái hiện tại**
    (tại 2026-09-17: DONE 31/110 ≈ 28.2%, Overall IN PROGRESS — PHASE 1 UI chưa hoàn thành,
    BLOCKED 1: F-01, master task được cập nhật sau TASK-076, commit #123).
  - `docs/agent-progress/TASK_INDEX.md` + `docs/agent-progress/TASK-*.md` — nhật ký từng task
    (mỗi task ghi 1 file; trạng thái và lỗi đã vá được đánh chỉ mục ở MASTER_STATUS).
  - Audit gốc: `docs/24_SYSTEM_AUDIT_REPORT.md`.
- Nguyên tắc: **MASTER TASK quyết định PHẢI LÀM GÌ; GOAL (file này) quyết định PHẢI LÀM
  NHƯ THẾ NÀO.**

## Bắt đầu mỗi phiên (bắt buộc)

0. Đọc lần lượt để tái lập bối cảnh:
   1. File này (GOAL).
   2. `docs/agent-progress/REARM-GOAL-CHECKLIST.md` (nếu goal đang `disarmed`).
   3. `docs/agent-progress/MASTER_STATUS.md` (§ đầu gồm: Overall, Phase table, ĐANG LÀM,
      BLOCKED, ghi chú). Nếu MASTER_STATUS mới hơn 110-muc list thì lấy MASTER_STATUS làm chuẩn.
   4. `docs/28_DANH_SACH_110_MUC_MASTER_TASK.md` (chỉ cần đọc lại khi cần chọn mục mới).
1. Xác định **mục master task đang ĐANG LÀM** (hoặc TODO đầu tiên khả thi, ưu tiên CLB
   không bị BLOCKED). Tiếp tục đúng mục đó, tuyệt đối không tự nhảy task khác.
2. Tạo danh sách TODOs bằng `todo_write` (xem mục "To-dos" bên dưới) rồi mới thực thi.

## Cách làm việc (quy tắc chung)

- Chạy **liên tục từng mục của master task** như công nhân: chọn mục → lập TODO →
  thực hiện → kiểm thử/xác minh → cập nhật MASTER_STATUS (chỉ khi hoàn thành quá nửa,
  và ghi đúng trạng thái mục) → commit → báo cáo tiến độ → chuyển mục kế tiếp.
- Tiến độ mỗi mục được đánh dấu theo chuẩn có sẵn trong MASTER_STATUS (ĐANG LÀM /
  KHUNG XONG / AP DUNG / DONE / BLOCKED).
- Mọi thay đổi phải tuân theo workflow hiện có trong mã nguồn; không phá vỡ các plugin
  có sẵn của dsh (chẳng hạn `.dsh-agent-teams`). Nếu muốn thay đổi cơ chế dsh, phải báo
  user trước.
- Sau khi trong mỗi mục đạt commit, **commit ngay** (từng bước nhỏ), không gộp nhiều
  việc vào một lần.

## To-dos (bắt buộc — luôn hiển thị trên màn hình)

- Mỗi khi bắt đầu turn / task / nhiệm vụ dài, **phải gọi `todo_write`** để tạo hoặc cập
  nhật danh sách TODOs:
  - Trước khi thực thi: gửi toàn bộ danh sách bước với `status: "pending"`.
  - Khi bắt đầu làm một bước: đánh dấu `"in_progress"` (gửi lại toàn bộ danh sách —
    whole-list replacement).
  - Khi xong một bước: `"completed"` và tiếp tục bước kế.
  - Cập nhật lại TODO ngay khi có lỗi hoặc đổi kế hoạch.
- Không có vai trò nào được phép bỏ qua `todo_write`.

## Báo cáo tiến độ qua Telegram (bắt buộc, định kỳ)

- Kết thúc mỗi mục master task (hoặc sau mỗi khối công việc đáng kể), gọi tool **`notify`**
  của dsh-notifier để gửi báo cáo ngắn gọn qua Telegram cho user:
  tóm tắt đã xong gì, trạng thái mục đó, chỉ số tiến độ mới, việc kế tiếp.
- Trong các nhiệm vụ dài, cứ sau vài bước TODOs hoàn thành hãy gửi một cập nhật ngắn
  (không spam; báo cáo có chất lượng thay vì mỗi tool call).
- Nội dung báo cáo bằng tiếng Việt, ngắn gọn, súc tích.

## Khi goal bị disarmed / vòng lặp dừng

- Nếu vòng lặp tự động dừng vì goal `activation: "disarmed"`: **không** sửa plugin
  `.dsh-agent-teams` để lách. Theo đúng `docs/agent-progress/REARM-GOAL-CHECKLIST.md`:
  chờ user gửi một lượt trực tiếp, rồi dùng `update_goal` với `action="resume"` (đúng
  goal_id + revision) để khôi phục.
- Giảm thiệt hại khi vòng lặp đứt: luôn commit + checkpoint cuối mỗi lượt, chia lệnh
  nhỏ, ghi log rõ ràng.

## Tiêu chí hoàn thành một phiên

- Mục đã lên todo hoàn tất và được xác minh (chạy/node/probe tương ứng không lỗi).
- Commit xong với thông điệp rõ ràng (lấy cả commit #123 làm chuẩn về phong cách).
- MASTER_STATUS / TASK-*.md cập nhật đúng trạng thái mục.
- Báo cáo Telegram cho user về tiến độ.