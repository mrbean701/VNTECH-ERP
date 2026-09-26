# AD-15 — AUDIT PHỤ THUỘC MÀN «CẤU HÌNH HỆ THỐNG» → GHI BACKLOG

> Mục master task: `AD-15` — nguyên văn `docs/25_TODO_ROADMAP.md`:
> «Audit phụ thuộc; nếu không ảnh hưởng roadmap → **ghi backlog**» (module «Cấu hình», PHASE 4).

## 1. KẾT LUẬN

| # | Khẳng định | Kết luận | Bằng chứng |
|---|---|---|---|
| 1 | Bước 12 «Cấu hình hệ thống» ghép **5 khối phụ thuộc** khác nhau trong CÙNG một bước | **CONFIRMED** | `app/page.tsx` `{step===12&&…}`: `FormFieldConfigManager` · `UiDisplaySettingsManager` · `FactoryResetAdmin` · `TrustLockAdmin` · khối «Nhật ký cấu hình hệ thống» |
| 2 | Mỗi khối dùng action GHI **ĐÃ CÓ** (không cần mở rộng backend) | **CONFIRMED** | `reorder_form_fields` · `save_ui_display_settings` (`SystemController.java:1040`) · `factory_reset_preview`/`factory_reset_execute` · action của `TrustLockAdmin` |
| 3 | Khối **`TrustLockAdmin`** thuộc nhánh **license/tin cậy** — đã được người dùng yêu cầu **tạm hoãn** (nhánh bảo mật) | **CONFIRMED** | `MASTER_STATUS.md` mục BLOCKED: TASK-040 nhóm 6 «cần port cả hệ license + xác minh chữ ký số — thuộc phần bảo mật đã yêu cầu tạm hoãn» |
| 4 | `FactoryResetAdmin` là tác vụ PHÁ HUỶ dữ liệu toàn hệ thống, có xác nhận chuỗi + kiểm tra backup | **CONFIRMED** | `factory_reset_preview` + `factory_reset_execute` với `confirmText` + `backupConfirmed` + `password` |
| 5 | Khối «Nhật ký cấu hình hệ thống» đọc từ `data.audits` (chỉ 100 dòng gần nhất) | **CONFIRMED** | `data.audits.slice(0,30)`; `scripts/system-route.mjs:756` và `BootstrapDataAdapter.java:1219` đều `LIMIT 100` |
| 6 | Có phụ thuộc ẩn nào khác (ngoài 5 khối trên) làm bước 12 hỏng khi dữ liệu trống | **UNKNOWN** | Chưa đo được trạng thái «100% dữ liệu trống» trong nhánh này (cấm khởi động dịch vụ/build) |

**Kết luận cốt lõi:** các phụ thuộc này **KHÔNG ảnh hưởng roadmap** PHASE 7 — chúng thuộc nhánh bảo mật/license
đã tạm hoãn và các tác vụ cấu hình đã hoạt động ⇒ **ghi BACKLOG**, không kéo vào PHASE 7.

## 2. BACKLOG (đề xuất — KHÔNG thực thi trong PHASE 7)

| Mã | Việc | Vì sao chưa làm | Điều kiện mở |
|---|---|---|---|
| `BL-AD15-1` | Port hệ **license/trust** (`vntech_license_*`, xác minh chữ ký số) để `TrustLockAdmin` hoạt động trọn | Thuộc nhánh **bảo mật đã tạm hoãn** (TASK-040 nhóm 6 trong `MASTER_STATUS.md`) | Người dùng mở lại nhánh bảo mật |
| `BL-AD15-2` | Tách 5 khối của bước 12 thành **5 sub-tab** cho dễ tìm | UI thuần, chưa có yêu cầu; đổi cấu trúc màn đang chạy cần ảnh chuẩn mới | Người dùng chốt + cập nhật ảnh chuẩn |
| `BL-AD15-3` | Trang «Nhật ký cấu hình» hiện **đủ** bản ghi theo bộ lọc thay vì 30/100 | `LIMIT 100` là hợp đồng đọc hiện tại (2 đường bootstrap đều 100) | Chốt thay đổi hợp đồng đọc |

## 3. PHẠM VI

- KHÔNG sửa `scripts/**`, KHÔNG sửa `java-backend/**`, KHÔNG migration: audit này chỉ ĐỌC.
- Hợp đồng kiểm chứng: `tests/ad15-config-audit.test.mjs` — tự đếm đúng 5 khối trong bước 12, kiểm action GHI
  đã tồn tại ở ít nhất 1 trong 2 đường, và kiểm tài liệu này có verdict + phần **BACKLOG** +
  câu khẳng định **không ảnh hưởng roadmap**.
