# TASK-MT3-UI-09 — Thi công: bỏ 2 nút, modal hạng mục, toolbar CRUD, danh sách hạng mục (MT3 §D)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-09 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE (UI)** · ⛔ phần **chặn ở backend** thuộc **GĐ2 / P3-BE-08** |
| **Requirement** | MT3 §D: bỏ «Chọn dự án» ở đầu trang · đổi «Nhập nhật ký thi công» → **«Nhật ký thi công»** · **nhật ký hiển thị danh sách hạng mục** · thêm **toolbar CRUD** · «Thêm hạng mục» **mở modal** · ⛔ **bỏ nút «Lưu nháp» + «Gửi kiểm tra»** · quyền: chỉ có quyền phù hợp (ví dụ Chỉ huy trưởng) mới thấy thêm hạng mục/CRUD |

## Khoảng cách đo được (trước khi sửa)
| Mục | Đo được |
|---|---|
| `ConstructionScreen.tsx:28` | `CardHead title="Nhập nhật ký thi công"` ⛔ + khối **«Chọn dự án»** ở đầu trang ⛔ |
| `:38` | nút **«Lưu nháp»** (`data-mode="draft"`) + **«Gửi kiểm tra»** (`data-mode="submit"`) ⛔ |
| `:38` | 「＋ Thêm hạng mục」 **thêm dòng nhập trực tiếp**, ⛔ không mở modal |
| `:39` | cột **«Hạng mục»** chỉ hiện **SỐ ĐẾM** (`l.itemCount||items.length`) ⛔ |
| — | ⛔ **không có** toolbar CRUD |

## Implementation
1. **Tiêu đề** → `Nhật ký thi công`; **bỏ khối «Chọn dự án»** ở đầu trang.
2. **Toolbar CRUD** (`ListToolbar`, dùng component dùng chung — ưu tiên GOAL §14): tiêu đề + số phiếu · **Tìm** · **Lọc phạm vi dự án** · **Xuất Excel** (CSV **UTF-8 có BOM** qua `downloadCsv` — đạt MT3 §IV.7).
3. **「＋ Thêm hạng mục」 mở MODAL** (`data-vntech="construction-item-modal"`) có 6 trường (Hạng mục* · Khu vực · KH · Thực hiện · ĐVT · Giờ công); ⛔ **validate rỗng**; hạng mục đã thêm hiện dạng **chip** kèm nút bỏ.
4. ⛔ **BỎ** `Lưu nháp` + `Gửi kiểm tra`.
   - **Căn cứ không mất chức năng**: bảng **đã có** nút **「Duyệt →」** cho `permission.canApprove` ⇒ việc phê duyệt không mất.
   - Nút lưu còn lại: **「Lưu nhật ký」** (giữ `submit` = mặc định `false` như trước, ⛔ **không tự đổi luật nghiệp vụ**).
5. **Cột «Hạng mục»** hiện **DANH SÁCH** từng hạng mục (tên + KH + ĐVT) thay vì số đếm.
6. CSS `canonical.css` mục **14.12**: chip hạng mục + danh sách hạng mục trong bảng.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/screens/ConstructionScreen.tsx` | tiêu đề · bỏ chọn dự án · toolbar · modal hạng mục · chip · bỏ 2 nút · danh sách hạng mục · xuất Excel |
| `app/styles/canonical.css` | mục **14.12** |

## Frontend changes
Có (2 tệp sản phẩm).

## Backend changes / Database changes / API changes
⛔ **Không có.** ⛔ Action `save_construction_daily_log` giữ nguyên hợp đồng (`submit` vẫn nhận được, chỉ không còn nút gửi từ form).

## Permission changes
- UI: giữ nguyên cơ chế `permission.canCreate` (thêm hạng mục + form) · `permission.canApprove` (nút Duyệt) · `permission.canEdit` (nút Xóa) — dựa trên **permission từ backend**, ⛔ **không hard-code tên role**.
- ⛔ **CÒN NỢ (GĐ2 / P3-BE-08)**: MT3 §D yêu cầu «Backend phải chặn thao tác trái phép kể cả khi gọi API trực tiếp» ⇒ phải kiểm chứng bằng **user thường** (403) ở GĐ2. ⛔ **UI KHÔNG THAY THẾ BACKEND.**

## Workflow changes
⛔ **Không đổi luồng phê duyệt**: nhật ký tạo → duyệt bằng nút 「Duyệt →」 sẵn có. Ghi chú quyết định: việc MT3 chỉ dặn **bỏ 2 nút** mà không nói thay bằng gì ⇒ tôi giữ **một** nút lưu với hành vi **mặc định cũ**, ⛔ không tự chọn luật mới.

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ exit 0 (⚠️ lần đầu đỏ vì dùng `UI_TODAY` không có trong tệp ⇒ đã đổi sang ngày hiện tại) |
| contract toàn bộ | ✅ **603 tests · 602 pass · 0 fail · 1 skip** (không phải sửa test nào) |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-C1EDCCD1FBDACD6A` |

## Known issues
1. ⛔ **Xác minh bằng mắt** (ảnh chuẩn) chưa làm — **P3-UI-17**.
2. ⛔ **Chặn quyền ở backend** chưa kiểm chứng bằng user thường — **P3-BE-08 (GĐ2)**.
3. ⚠️ MT3 §D không nói rõ **thay 2 nút bằng gì**; tôi giữ nút **「Lưu nhật ký」** với hành vi mặc định cũ. Nếu anh muốn lưu là **gửi duyệt luôn** thì báo tôi đổi (kèm GĐ2 để khớp quyền).

## Blockers
⛔ **Không có.**

## Next task
**P3-UI-10** — Kho vật tư (§F): 4 tab (**Kho** · **Nhập kho & Xuất kho** · **Tồn kho** · **Cấp phát & hoàn trả**) · gộp màn Nhập/Xuất với 2 sub-tab · danh sách kho dạng **card** + **toolbar CRUD** + **modal chi tiết** (thủ kho · lịch sử xuất/nhập · lịch sử cấp phát/hoàn trả · danh mục vật tư) · đổi nhãn **«KHO TỔNG» → «KHO»** · bỏ 2 mục **«Danh sách luân chuyển vật tư dư dự án → Kho Tổng»** và **«Tồn vật lý kho tổng»**.
