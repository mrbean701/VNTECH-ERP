# 00 — BẢN ĐỒ ÁNH XẠ: Goal §4 ⇄ CẤU TRÚC STATE THỰC CÓ

> **Mục đích:** Goal (Multi-Session Mode) §4 liệt kê **7 tệp coordination** theo tên. Repo này **ĐÃ CÓ cấu trúc
> state tương đương** nhưng **tên khác**. Theo đúng §4 — *«Nếu repo hiện tại đã có cấu trúc state tương đương thì
> **PHẢI sử dụng cấu trúc hiện tại, ⛔ không tự tạo hệ thống state thứ hai»* — tài liệu này **GHI BẢN ĐỒ ÁNH XẠ**
> để ⛔ **không tạo tệp trùng** và ⛔ **không gây state conflict**.
>
> ⚠️ **Tệp này do `ERP-SESSION-02` tạo** (2026-10-06). Đây là tệp **MỚI** — ⛔ **không sửa/ghi đè** bất kỳ tệp nào khác trong thư mục.

---

## 1. Bảng ánh xạ

| Goal §4 (tên yêu cầu) | Tệp THỰC CÓ trong repo | Trạng thái |
|---|---|---|
| `CURRENT_STATE.md` | **`docs/dsh-state/CURRENT_STATE.md`** (1.205 dòng) | ✅ **KHỚP ĐÚNG TÊN** |
| `SESSION_REGISTRY.md` | **`docs/dsh-state/SESSION_REGISTRY.md`** (352 dòng) | ✅ **KHỚP ĐÚNG TÊN** |
| `GO_LIVE_CHECKLIST.md` | **`docs/dsh-state/CHECKLIST.md`** (7.452 dòng) | 🔁 **TƯƠNG ĐƯƠNG** (tên khác) |
| (quyết định) | **`docs/dsh-state/DECISIONS.md`** (2.492 dòng) | 🔁 **TƯƠNG ĐƯƠNG** |
| (lịch sử task) | **`docs/dsh-state/TASK_HISTORY.md`** (1.262 dòng) | 🔁 **TƯƠNG ĐƯƠNG** |
| `BUG_TRACKING.md` | **`docs/dsh-mutil-session/SESSION_B/BUG_HOTFIX_LOG.md`** (+ `SESSION_A/`) | 🔁 **TƯƠNG ĐƯƠNG** (theo lớp log mới) |
| `HOTFIX_HISTORY.md` | **`docs/dsh-mutil-session/SESSION_B/BUG_HOTFIX_LOG.md`** — mục `Fix` + `Status: FIXED` | 🔁 **TƯƠNG ĐƯƠNG** (gộp bug + hotfix, đúng Goal §11) |
| `MULTI_SESSION_STATE.md` | **`docs/dsh-mutil-session/SHARED_STATE.md`** + **`SESSION_REGISTRY.md`** | 🔁 **TƯƠNG ĐƯƠNG** |
| `SESSION_HANDOFF.md` | **`docs/dsh-mutil-session/SESSION_B/HANDOFF_LOG.md`** (+ `SESSION_A/`) | 🔁 **TƯƠNG ĐƯỢNG** |
| (log chuẩn hoá đa phiên) | **`docs/dsh-mutil-session/`** — README + 3 SHARED + `SESSION_A/` 9 log + `SESSION_B/` 9 log | ⭐ **LỚP LOG CHUẨN HOÁ** (Goal «PERSISTENT MULTI-SESSION LOGGING») |

**⇒ KẾT LUẬN:** ✅ **ĐÃ ĐỦ** — mọi loại dữ liệu coordination mà Goal §4 yêu cầu **đều đã có nơi lưu**;
⛔ **KHÔNG cần tạo thêm** `GO_LIVE_CHECKLIST.md` / `BUG_TRACKING.md` / `HOTFIX_HISTORY.md` /
`MULTI_SESSION_STATE.md` / `SESSION_HANDOFF.md` **trùng lặp** ⇒ tránh **state conflict** và **checklist corruption** (Goal §2).

---

## 2. Phân vai 2 thư mục (⛔ KHÔNG lẫn lộn)

| Thư mục | Vai trò | Quy tắc |
|---|---|---|
| **`docs/dsh-state/`** | **state VẬN HÀNH** (checklist · trạng thái hiện tại · quyết định · registry · lịch sử task) | ⛔ **KHÔNG xoá, ⛔ không di chuyển, ⛔ không ghi đè** — nhiều phiên cùng dùng |
| **`docs/dsh-mutil-session/`** | **LỚP LOG CHUẨN HOÁ** phục vụ **báo cáo tuần** (9 loại log × mỗi phiên) | ⛔ Không overwrite log phiên khác · chỉ ghi vào thư mục CỦA MÌNH |
| **`docs/agent-progress/`** | nhật ký **từng task** (`TASK-*.md`) + `MASTER_STATUS.md` | ⛔ Không sửa `TASK-*.md` của phiên khác |

---

## 3. Ai ghi gì (⛔ tránh ghi trùng)

| Khi nào | Ghi vào |
|---|---|
| Bắt đầu task | `dsh-mutil-session/<SESSION>/EVENT_LOG.md` + `TASK_LOG.md` |
| Phát triển kỹ thuật | `dsh-mutil-session/<SESSION>/DEV_LOG.md` |
| Hệ thống THỰC SỰ đổi | `dsh-mutil-session/<SESSION>/CHANGE_LOG.md` |
| Test | `dsh-mutil-session/<SESSION>/TEST_LOG.md` |
| Bug / hotfix | `dsh-mutil-session/<SESSION>/BUG_HOTFIX_LOG.md` (**Root Cause bắt buộc**) |
| Quyết định | `dsh-mutil-session/<SESSION>/DECISION_LOG.md` (+ `dsh-state/DECISIONS.md` nếu ảnh hưởng toàn dự án) |
| Giao tiếp 2 phiên | `dsh-mutil-session/<SESSION>/HANDOFF_LOG.md` |
| Trạng thái / lock / build | `dsh-state/SESSION_REGISTRY.md` · `dsh-mutil-session/SHARED_STATE.md` |
| Nhật ký 1 task dài | `docs/agent-progress/TASK-<số>.md` |

---

## 4. Ghi chú đa phiên (đo được 2026-10-06)

* `docs/dsh-state/CHECKLIST.md` và `CURRENT_STATE.md` **được phiên khác cập nhật** (mốc **13:46** và **12:53**)
  ⇒ ⛔ **phiên nào cũng phải ĐỌC trước khi ghi**, ⛔ **không ghi đè cả tệp**.
* `docs/dsh-state/SESSION_REGISTRY.md` là **SHARED** — ghi bằng cách **APPEND**, ⛔ không thay nội dung phiên khác.
