# TASK-MT3-UI-11 — Tổ đội: đúng 5 tab + Lịch sử tổng hợp có Tìm/Sắp xếp/Lọc (MT3 §G)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-11 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE (UI)** · ⛔ phần backend (tổng hợp lịch sử, phân trang) thuộc **GĐ2** |
| **Requirement** | MT3 §G: khi chọn tổ đội hiện tab **Thông tin · Nhân sự · Dự án · Kho · Lịch sử** · **Lịch sử**: *tổng hợp tất cả đơn/phiếu liên quan*, có **Search · Sort · Filter theo loại**, **mặc định mới nhất**, ⛔ **không nhân dòng bằng join** · nút **«Tạo tổ đội»** cho user có quyền · bỏ «Chọn dự án» ở đầu trang |

## Khoảng cách đo được (trước khi sửa)
`TEAM_TABS = ["Thông tin","Nhân sự","Dự án","Kho","Cấp phát","Lịch sử"]` ⇒ **6 tab**, MT3 §G yêu cầu **5**.

## Implementation
1. **5 tab** đúng thứ tự §G. Tab **「Cấp phát」 ĐÃ GỘP vào 「Lịch sử」** ⛔ **không mất chức năng**: các bảng cấp phát/hoàn trả, lịch sử thao tác, hợp đồng giao khoán vẫn render **bên trong** tab Lịch sử.
2. **Khối TỔNG HỢP** (`data-vntech="team-history-aggregate"`) đặt trên tab Lịch sử:
   - `ListToolbar` (dùng chung) với **Tìm** · **Lọc theo loại** (Cấp phát / Hoàn trả / Nhật ký) · **Sắp xếp** (Mới nhất trước · Cũ nhất trước · Theo loại) · đếm `hiển thị/tổng`.
   - **Mặc định `newest`** ⇒ mới nhất trước, đúng §G.
   - Trạng thái rõ khi tổ đội chưa có chứng từ.
3. ⛔ **KHÔNG nhân dòng bằng join**: hàm `teamHistoryRows()` sinh **đúng 1 dòng/chứng từ** từ nguồn của nó, gộp bằng `concat`, sắp xếp **ở tầng ảnh**; dùng lại `allocations` (đã lọc `team_id` ở tầng dữ liệu) ⇒ ⛔ không đọc khoá payload không tồn tại.
4. ✅ **Nút «＋ TẠO TỔ ĐỘI» ĐÃ CÓ SẴN** (`TeamDirectory.tsx:632`) — đúng quyền `canUse` của `site_command` (⛔ không hard-code role) + có `title` nêu rõ lý do khi thiếu quyền (đúng §IV.4).
5. Bộ lọc dự án **đã nằm trong toolbar** từ P3-UI-04 ⇒ không còn khối chọn dự án rời ở đầu trang.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/screens/TeamDirectory.tsx` | 5 tab · `teamHistoryRows()` · state + biến `visibleHistory` · khối tổng hợp · gộp tab cũ |
| `tests/tm03-team-detail-tabs.test.mjs` | cập nhật hợp đồng 6→5 tab + đối chứng âm theo ngữ nghĩa tổng hợp |
| `tests/tm05-team-allocations.test.mjs` | cấp phát/hoàn trả nay **nằm trong** tab 4 «Lịch sử», nguồn thật vẫn phải khai |

## Frontend changes
Có (1 tệp sản phẩm).

## Backend changes / Database changes / API changes
⛔ **Không có.** ⛔ Tổng hợp hiện làm ở **tầng ảnh** trên dữ liệu payload sẵn có; ⛔ **phân trang/virtualize khi dữ liệu lớn** (§G) + API tổng hợp thuộc **GĐ2 (P3-BE-06)**.

## Permission changes
⛔ Không đổi. Nút Tạo tổ đội dùng `gates.canCreate` từ RBAC; ⛔ chặn API thuộc **P3-BE-08**.

## Workflow changes
⛔ **Không đổi** — chỉ gom nơi hiển thị; các action cấp phát/hoàn trả/duyệt giữ nguyên.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 (⚠️ lần đầu đỏ: đọc khoá `materialReturns` không tồn tại + `detail` dùng trước khai — đã sửa) |
| contract toàn bộ | ✅ **603 tests · 602 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-B75CAD5C93329D96` |

## Known issues
1. ⛔ **Phân trang / virtualize** chưa làm (MT3 §G «phân trang hoặc virtualize nếu dữ liệu lớn») — **GĐ2/P3-BE-06**.
2. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-12** — Mua hàng & Cung ứng (§E): 10 tab · **2 sub-tab PR/PO** · bỏ card chi tiết cố định · duyệt **trong modal** (có kiểm tra quyền + trạng thái ở backend) · **modal thay side tab** cho Ghi nhận số lượng giao thực tế · sửa modal «Ảnh và hồ sơ giao hàng» để hiển thị đầy đủ.
