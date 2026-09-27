# TASK-MT3-UI-08 — Quản lý dự án: nhãn tab, bỏ cột «Nguồn dữ liệu», cột «Tổ đội», họ tên click (MT3 §C)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-08 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE** (phần yêu cầu §C đã nêu tên) |
| **Requirement** | MT3 §C (Modal chi tiết dự án): «Đổi "Chung" thành **"Thông tin dự án"**» · «**Bỏ cột "Nguồn dữ liệu"**» · «Các trường họ tên phải **click được** và mở modal chi tiết nhân sự» · «Thêm cột **"Tổ đội"**: chưa thuộc tổ đội → `N/A`; thuộc một tổ đội → hiển thị tổ đội; thuộc nhiều tổ đội → nút **"Chi tiết"**; click mở danh sách các tổ đội user tham gia» |

## Khoảng cách đo được trước khi sửa
| Mục | Đo được |
|---|---|
| `ProjectDetailTabs.tsx:32` | `PROJECT_DETAIL_SUB_TABS = ["Chung", …]` ⇒ ⛔ nhãn «Chung» |
| `ProjectDetailTabs.tsx:188` | `<thead>… <th>Nguồn dữ liệu</th></thead>` + 8 `<td>` tương ứng ⇒ ⛔ cột cần bỏ |
| `:238` cột «Họ tên» | chỉ render text ⇒ ⛔ **không click được** (chỉ bấm cả dòng mới mở modal) |
| Bảng Nhân sự | ⛔ **thiếu cột «Tổ đội»** |

## Implementation
1. `PROJECT_DETAIL_SUB_TABS` → `["Thông tin dự án", "Nhân sự", "Tổ đội", "Kho", "Lịch sử"]`.
   ⛔ **Khoá nội bộ `section === "chung"` GIỮ NGUYÊN** (là khoá kỹ thuật, không phải nhãn).
2. **Bỏ cột «Nguồn dữ liệu»** khỏi `<thead>` + 8 `<td>`. ⛔ Thông tin nguồn **không mất**: chuyển vào `note` của `CardHead`.
3. **Trường «Họ tên» click được**: nút `.link-cell` → `openEntity("user", u)` + `stopPropagation()` (⛔ tránh bắn 2 lần cùng dòng).
4. **Cột «Tổ đội»** (3 nhánh đúng theo yêu cầu): `0` tổ đội → `N/A` · `1` → tên tổ đội · `N` → nút **«Chi tiết (N)»**.
5. Khối `data-vntech="project-member-teams"` hiện danh sách tổ đội (bấm tên tổ đội → mở modal tổ đội) + nút Đóng.
6. CSS `canonical.css` mục **14.11**: `.link-cell` (có `:focus-visible` cho bàn phím) + `.team-inline-list`.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/screens/ProjectDetailTabs.tsx` | nhãn tab · bỏ cột nguồn · họ tên click · cột Tổ đội · state + khối danh sách |
| `app/styles/canonical.css` | mục **14.11** |
| `tests/pr03-project-detail-tabs.test.mjs` | nhãn tab theo §C (khoá nội bộ giữ nguyên) |
| `tests/p2-05-tabs-reuse-contract.test.mjs` | nhãn tab theo §C |

## Frontend changes
Có (2 tệp sản phẩm). ⛔ Không đổi API/DB.

## Backend changes / Database changes / API changes
⛔ **Không có** (dùng `data.teams` + `data.teamMembers` đang có).

## Permission changes
⛔ Không đổi. Cột «Tổ đội» hiển thị theo quan hệ **đã được backend lọc**; ⛔ việc lọc phạm vi dữ liệu thuộc GĐ2.

## Workflow changes
⛔ Không đổi.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **603 tests · 602 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-6F7728D523DD2131` |

## 🛑 Lỗi TÔI GÂY RA (đã sửa — ghi để không lặp)
1. ⛔ Đặt `{/* … */}` **bên trong mảng `columns`** ⇒ `{...}` bị hiểu là object literal ⇒ **lỗi cú pháp `TS1005`**. Sửa: chuyển thành comment `//` đặt trong mảng.
2. ⛔ Khai `useState` nhầm vào component `WorkItemCreateCard` thay vì `ProjectDetailTabs` ⇒ `TS2304` ×4. Đã di chuyển đúng chỗ.

## Known issues
1. ⛔ Xác minh bằng mắt (ảnh chuẩn) chưa làm — **P3-UI-17**.
2. ⛔ Nút «Chi tiết (N)» hiện danh sách **nội tuyến** trong card, chưa phải modal riêng — chấp nhận được vì MT3 §C chỉ yêu cầu «click mở danh sách các tổ đội user tham gia».

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-09** — Thi công: bỏ nút **«Lưu nháp»** + **«Gửi kiểm tra»** (MT3 §D) · «Thêm hạng mục» **mở modal** · thêm **toolbar CRUD** · đổi nhãn «Nhập nhật ký thi công» → **«Nhật ký thi công»** · nhiệm vụ hiển thị **danh sách hạng mục** · quyền: chỉ Chỉ huy trưởng (hoặc quyền tương đương) mới thấy «Thêm hạng mục»/CRUD, ⛔ **backend phải chặn** (GĐ2).
