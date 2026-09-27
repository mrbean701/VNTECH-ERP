# TASK-MT3-UI-07 — Menu → tab: thêm tab «Dự án» cho màn Công việc (MT3 §A.2)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-07 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE** (phần Công việc) · phần Kho (4 tab) thuộc **P3-UI-10** |
| **Requirement** | MT3 §A.2: «**Dự án — Tạo mới tab này. Chứa dashboard dự án.**» |

## Khoảng cách đo được
- `WorkCenter.tsx:84` (trước khi sửa): `WORK_TABS = ["Cá nhân", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"]` ⇒ **không có tab «Dự án»**.

## Implementation
1. `WORK_TABS` → 6 tab, chèn **«Dự án»** ở index 1 (đúng thứ tự §A: Cá nhân · Dự án · Phòng ban · …).
2. `WORK_TAB_OF_VIEW` dời lùi 1: `personal:0 · department:2 · assign:3 · kpi:4 · dashboard:4 · reports:5`.
3. Thêm hàm thuần `projectWorkGroups(rows)` — nhóm nhiệm vụ theo `projectCode` (đếm tổng · đã xong · quá hạn · tỉ lệ hoàn thành), sắp xếp giảm dần theo số việc.
4. Render tab «Dự án» (`data-vntech="work-project-tab"`): 3 thẻ KPI + bảng **CÔNG VIỆC THEO DỰ ÁN** + trạng thái rỗng.
5. ⛔ **KHÔNG xoá tab cũ** («Giao việc» · «Dashboard» vẫn là chức năng THẬT) — chỉ chèn và dời index.
6. ⛔ **KHÔNG phát minh nghiệp vụ**: tab mới chỉ TỔNG HỢP tập `items = data.workItems` đang có; không tính tiến độ dự án, không xếp hạng.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/screens/WorkCenter.tsx` | +tab «Dự án» · `WORK_TABS` 6 mục · `WORK_TAB_OF_VIEW` · +`projectWorkGroups()` |
| `tests/t01-work-menu.test.mjs` | cập nhật hợp đồng 5→6 tab (+ khẳng định tab «Dự án» có nội dung thật) |
| `tests/t05-personal-work.test.mjs` | biên tab «Cá nhân» (giữ nguyên index 0) |
| `tests/t06-department-scope.test.mjs` | tab «Phòng ban» 1 → 2 |
| `tests/t07-kanban-board.test.mjs` | literal dải tab → 6 mục |
| `tests/t08-work-dashboard.test.mjs` | tab «Dashboard» 3 → 4 |
| `tests/t09-task-team-member.test.mjs` | literal dải tab + ánh xạ view → tab |

## Frontend changes
Có (1 tệp sản phẩm). ⛔ Không đổi API, không đổi payload, không đổi màn khác.

## Backend changes / Database changes / API changes
⛔ **Không có** (GĐ1 — dùng dữ liệu sẵn có).

## Permission changes
⛔ Không đổi cơ chế quyền. ⛔ **Còn nợ (GĐ2)**: MT3 §A yêu cầu tab **Phòng ban** chỉ hiện cho user có permission + level ≥ Trưởng phòng, và **kết hợp `department` + `level`** chứ không chỉ tên role ở frontend ⇒ phần ràng buộc dữ liệu phải làm ở **GĐ2/P3-BE-04**.

## Workflow changes
⛔ Không đổi.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **603 tests · 602 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-EBB91103873AD1AA` |
| Thứ tự nhánh tab trong mã | ✅ đo trực tiếp: `0 → 1 → 2 → 3 → 4 → 5`, **mỗi số đúng 1 nhánh** |

## 🛑 SỰ CỐ TÔI GÂY RA TRONG TASK NÀY (đã sửa — ghi rõ để không lặp)
1. 🛑 **LỖI MÃ THẬT**: thêm tab mới mà **quên dời các nhánh cũ** ⇒ có **HAI** nhánh `{tab === 1 &&}` (tab «Dự án» mới + «Phòng ban» cũ), các tab sau bị lệch nội dung. ⛔ Test hợp đồng bắt được trước khi lên UI. Đã sửa và **đo lại**: mỗi số 0..5 đúng 1 nhánh.
2. 🛑 **TÔI ĐÃ LÀM HỎNG 3 TỆP TEST** khi dùng PowerShell ghi thẳng file UTF-8 (`match`→`matoh`, `const`→`oonst`, `được`→`đượo`) ⇒ **mất 19 test**, số test rơi 603→584. Đã **khôi phục từ git** và xác minh sạch; phạm vi hư hỏng chỉ 3 tệp test, **không đụng mã sản phẩm**. Sau đó chuyển sang dùng công cụ sửa an toàn.
   ⛔ **BÀI HỌC (đã tuân thủ từ đó): KHÔNG ghi tệp UTF-8 bằng PowerShell.** Chỉ dùng công cụ sửa văn bản.
3. ⚠️ Đặt khối «Dự án» **trước** khối `tab === 0` làm vỡ các phép cắt theo thứ tự trong test ⇒ đã chuyển về **đúng thứ tự tăng dần** trong mã.

## Known issues
1. ⛔ Xác minh bằng mắt (ảnh chuẩn) chưa làm — **P3-UI-17**.
2. ⛔ Tab «Phòng ban» chưa được ràng buộc quyền theo §A → **P3-BE-04 (GĐ2)**.
3. ⛔ Màn **Kho** vẫn có 2 tab (`Tồn kho` · `Dashboard tồn kho`) trong khi §F yêu cầu 4 → **P3-UI-10**.

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-08** — Quản lý dự án: đổi nhãn tab «Chung» → **«Thông tin dự án»** · bỏ cột **«Nguồn dữ liệu»** · thêm cột **«Tổ đội»** (chưa thuộc → `N/A`; thuộc 1 → tên; thuộc nhiều → nút «Chi tiết») · tên trường họ tên phải click mở modal nhân sự.
