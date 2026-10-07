# TASK-MT3-UI-13 — Danh mục vật tư: chuẩn hoá & chặn alias rỗng/trùng (MT3 §H)

| Mục | Nội dung |
|---|---|
| **Task** | P3-UI-13 |
| **Phase** | **GĐ1 — FRONTEND/UI** |
| **Status** | ✅ **DONE (chuẩn hoá alias)** · ⛔ phần tìm kiếm theo alias + lưu alias ở DB thuộc **GĐ2/GĐ3** |
| **Requirement** | MT3 §H: «Modal thêm/sửa vật tư có chức năng thêm **nhiều tên phụ/alias**. Cho phép thêm/xoá alias trong form trước khi lưu. ⛔ **Không cho alias rỗng hoặc trùng vô nghĩa sau khi chuẩn hóa.**» |

## Khoảng cách đo được (trước khi sửa) — nhiều phần **đã có sẵn**
| Mục | Đo được |
|---|---|
| Ô nhập **nhiều** alias | `page.tsx:2837` — `<textarea name="aliasText" placeholder="Mỗi tên một dòng hoặc cách nhau bằng dấu ;">` ⇒ ✅ **đã có** |
| Dữ liệu alias | `data.materialAliases` có trong payload (`page.tsx:313`) ⇒ ✅ **đã có** |
| Bảng hiển thị alias | `MaterialListTable.tsx:33,39` (`aliases` · `aliasOf`) ⇒ ✅ **đã có** |
| ⛔ **Chuẩn hoá / chặn rỗng / chặn trùng** | ⛔ **CHƯA CÓ** — gửi thẳng chuỗi thô lên backend |

## Implementation
1. Thêm hàm thuần `normalizeAliases(raw)`:
   - tách theo **xuống dòng** và dấu `;` · gộp khoảng trắng thừa · `trim`
   - ⛔ **bỏ mụn rỗng** (`if (!value) continue;`)
   - ⛔ **bỏ mụn trùng** theo khoá `toLocaleLowerCase("vi")` (⛔ **không phân biệt hoa/thường**)
2. Trong `send()`: ⛔ **chặn lưu** khi user có gõ alias nhưng sau chuẩn hoá **không còn tên hợp lệ nào** (báo rõ lý do); ngược lại lưu **danh sách đã chuẩn hoá** (`aliases.join("; ")`) thay vì chuỗi thô.
3. Bổ sung dòng gợi ý dưới ô alias: *nhập nhiều tên, mỗi tên một dòng; hệ thống tự bỏ mụn rỗng và mụn trùng khi lưu*.
4. ⛔ **KHÔNG tự phát minh luật mới**: chỉ chuẩn hoá văn bản (khoảng trắng/hoa-thường), ⛔ không tự sinh alias, không bỏ dấu tiếng Việt.

## Files changed
| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | `normalizeAliases()` + chặn trong `send()` + gợi ý dưới ô alias |
| `tests/mt3-ui-13-material-alias.test.mjs` | **mới** — 5 test |

## Frontend changes
Có (1 tệp sản phẩm).

## Backend changes / Database changes / API changes
⛔ **Không có.**
⛔ **CÒN NỢ (GĐ2/GĐ3)**: (a) backend phải **tự chuẩn hoá lại** alias (UI không thay thế server); (b) tìm kiếm vật tư **theo tên chính + alias** ⇒ cần chỉ mục/CSDL ⇒ **P3-BE-05 + P3-DB-01**; (c) hiện alias lưu dạng **chuỗi `;`** ⇒ đổi sang bảng alias là **GĐ3**.

## Permission changes
⛔ Không đổi.

## Workflow changes
⛔ **Không đổi.**

## Testing (đều chạy thật)
| Cổng | Kết quả |
|---|---|
| `tests/mt3-ui-13-material-alias.test.mjs` | ✅ **5/5 PASS** — có ô nhập nhiều alias · có hàm chuẩn hoá và được gọi khi lưu · ⛔ loại rỗng + trùng (không phân biệt hoa/thường, gộp khoảng trắng) · ⛔ chặn khi không còn tên hợp lệ · ⛔ không tự sinh/biến đổi tên phụ ngoài chuẩn hoá |
| `npx tsc --noEmit` | ✅ exit 0 |
| contract toàn bộ | ✅ **608 tests · 607 pass · 0 fail · 1 skip** |
| `npm run test:regression` | ✅ **69/69** |
| `gd-cycle` | ✅ build ĐẠT · fingerprint `VNTECH-FP-1E9EC0A16BC9C82B` |

## Blockers — CẦN USER CHỐT (3 việc, đang chờ)
1. ⛔ **Kho (§F)**: gộp 2 mục thừa «Tồn vật lý kho tổng» + «Luân chuyển vật tư dư» vào đâu (khuyến nghị: tab «Cấp phát & hoàn trả»).
2. ⛔ **Mua hàng (§E) — 3 câu hỏi menu** (chưa được trả lời):
   - «Nhà cung cấp» trùng 2 mục → gộp 1 hay tách 2?
   - «Xin giá vật tư» (không có trong 10 tab) → về tab nào?
   - «Giao nhận công trường» vs «Kế hoạch giao hàng» → đổi tên hay tách?

## Known issues
1. ⛔ Xác minh bằng mắt (ảnh chuẩn) — **P3-UI-17**.

## Next task
**P3-UI-14** — Quản trị hệ thống (§I): bỏ khối/nhãn **«Phân quyền người dùng»** phía trên các tab (⛔ **không** xoá tab hay đổi quyền ngoài yêu cầu) · modal **«Tạo thông báo»** với đối tượng nhận (Toàn bộ · Phòng ban · Dự án · **Tùy chọn** = chọn nhiều user có tìm kiếm, giữ lựa chọn khi mở lại, bỏ được user đã chọn).
