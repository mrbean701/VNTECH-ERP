# TASK-001 — PHASE 0 — SYSTEM AUDIT + TODO/ROADMAP + probe bảo mật RBAC

## Status

DONE

## Objective

Chụp baseline repo, kiểm kê toàn hệ, lập báo cáo audit + roadmap theo yêu cầu §47 của MASTER TASK.

## Previous State

Chưa có báo cáo audit tổng thể; chưa có roadmap phân phase.

## Implemented

* Quét repo, git status, nhánh, kiến trúc, DB, module, quyền, workflow
* Viết docs/24_SYSTEM_AUDIT_REPORT.md (20 mục + Phụ lục B)
* Viết docs/25_TODO_ROADMAP.md (11 phase, cột ID/Module/Việc/Ưu tiên/Phụ thuộc/DB/API/UI/Quyền/TT)
* Viết các probe kiểm chứng: probe-rbac-gap, probe-nonadmin-access, probe-admintab-bugs, probe-project-visibility

## Files Changed

* docs/24_SYSTEM_AUDIT_REPORT.md
* docs/25_TODO_ROADMAP.md
* tools/probe-rbac-gap.mjs
* tools/probe-nonadmin-access.mjs
* tools/probe-admintab-bugs.mjs
* tools/probe-project-visibility.mjs

## Frontend Changes

Không đổi giao diện trong việc này.

## Backend Changes

Không đổi backend trong việc này.

## Database Changes

No database changes.

## Permission Changes

Chỉ ĐO lỗ hổng phân quyền, chưa sửa (việc sửa ở TASK-002).

## Workflow Changes

No workflow changes.

## Important Decisions

* Ưu tiên theo §46: P0 an toàn → P1 kiến trúc lõi → P2 module lõi → P3 quản trị → P4 báo cáo → P5 tương lai
* Bắt đầu bằng audit, KHÔNG sửa UI trước

## Dependencies

Mọi task sau phụ thuộc roadmap này.

## Known Limitations

* UNKNOWN cần người dùng làm rõ: phạm vi module MEP (chặn PHASE 10), nhóm quyền nghiệp vụ tham gia thực thi, sao lưu/PITR MySQL, thời hạn phiên

## Testing

* 13 probe hồi quy chạy được
* Bảng parity action 174 vs SystemController 224 → xác định lệch 50 action

## Validation Result

PASS

## Git Commit

`8b4a5da` (#9) — chưa push

## Next Task

TASK-002

## Continuation Notes

Đọc docs/24 và docs/25 trước khi làm bất cứ việc gì. Các UNKNOWN ở mục Known Limitations của MASTER_STATUS.md vẫn chưa được trả lời — gặp vùng đó thì DỪNG và hỏi, không tự suy đoán.

