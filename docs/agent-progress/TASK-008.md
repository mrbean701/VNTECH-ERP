# TASK-008 — U-09 đợt 5 — 3 màn trong tab Quản trị

## Status

**DONE** (phần code đợt 5 + lượt quét hồi quy rộng — xem mục cuối)

> ⚠️ Ghi chú đính chính: `MASTER_STATUS` từng ghi "Current task = TASK-008 — quét hồi quy toàn bộ",
> trong khi **TASK-008 thực chất là đợt 5 toolbar 3 màn Quản trị**, và *lượt quét hồi quy* chỉ là
> **bước còn lại** của nó. Đã sửa lại nhãn trong `MASTER_STATUS`. Bài học: nhãn task phải lấy từ
> chính `TASK-XXX.md`, không suy diễn từ dòng "remaining work".

## Objective

Chuẩn hoá toolbar cho UserPermissionMatrix, SystemLevelManager, AuditLogManager.

## Previous State

Cả ba dùng .table-toolbar với tiêu đề + số lượng bên trái và ô tìm/lọc dồn trong .row-actions bên phải.

## Implemented

* UserPermissionMatrix: ListToolbar search + filters[phòng ban, cấp bậc]
* SystemLevelManager: ListToolbar filters[tài khoản, cấp bậc] + actions[nút Xếp cấp bậc]
* AuditLogManager: ListToolbar search + filters[người dùng, chức năng] + extra[2 ô ngày] + actions[nút Xóa lọc]
* KHÔNG chuyển khối CHI TIẾT THAY ĐỔI trong hộp thoại audit vì đó không phải toolbar danh sách

## Files Changed

* app/page.tsx

## Frontend Changes

3 màn chuyển sang khuôn §5; giữ nguyên state/handler, không tự đặt chữ mới.

## Backend Changes

Không đổi backend.

## Database Changes

Chỉ thêm migration định danh drizzle/0108.

## Permission Changes

No permission changes.

## Workflow Changes

No workflow changes.

## Important Decisions

* Ba màn này KHÔNG có trong bộ ảnh chuẩn nên cổng ảnh không kiểm được — phải kiểm bằng --locate + OCR ảnh chụp thật

## Dependencies

TASK-009 tiếp tục các màn còn lại.

## Known Limitations

* Chưa build/xác minh tại thời điểm ghi hồ sơ

## Testing

* tsc (chạy cùng bước build)
* Cổng ảnh + 13 probe sau khi build
* Kiểm bằng --locate + OCR cho từng màn vì không có trong bộ ảnh chuẩn

## Validation Result

DONE (phần 2) — xem mục "PHẦN 2 — LƯỢT QUÉT HỒI QUY RỘNG"

## Git Commit

#38

## Next Task

TASK-009

## Continuation Notes

BẪY đã vấp: tiêu đề màn SystemLevelManager là 'GÁN CẤP BẬC' (chữ A) chứ không phải 'GẮN CẤP BẬC' — tôi chép sai dấu nên bản sửa bị trượt. Luôn in NGUYÊN VĂN khối định sửa trước khi sửa, đừng chép tay.

---

# PHẦN 2 — LƯỢT QUÉT HỒI QUY RỘNG (bước còn lại, hoàn thành 18/09/2026)

## Kết quả các cổng

| Cổng | Kết quả |
|---|---|
| `probe-action-role-parity.mjs` | **exit 0** — "tầng vai trò hai bản KHỚP và đường ống roleBase đầy đủ" |
| `probe-action-scope-parity.mjs` | **exit 0** — "mọi action JS kiểm phạm vi đều được Java kiểm tương ứng" |
| `probe-action-module-parity.mjs` | exit 1 — **lệch ĐÃ BIẾT** (TASK-029), không phải hồi quy mới |
| `probe-live-stack.mjs` | **ALL PASS** — 61 module · 5 bước duyệt · 484 quyền · UTF-8 0 lỗi · 12/12 nhóm menu |
| Cổng ảnh (28 ảnh × 4 kích thước) | **ĐẠT — 0 px lệch, exit 0** |
| `npm run lint` | ✅ **PASSED (0 error)** — sau khi vá F1 dưới đây |
| `npm run typecheck` | ✅ **PASSED** |
| `npm run test:regression` | **61 test · 58 PASS · 3 FAIL** (phân loại bên dưới) |

## F1 — LỖI CHẶN TOÀN BỘ CHUỖI `npm test` (ĐÃ VÁ)

`npm test` nối bằng `&&` và **dừng ngay ở `lint`** với 1 error:

```
app/components/ui/EntityDetailModal.tsx:76:53
error  Calling setState synchronously within an effect can trigger cascading renders
         react-hooks/set-state-in-effect
  75 |   useEffect(() => {
> 76 |     if (!visibleTabs.some((t) => t.key === active)) setActive(visibleTabs[0]?.key);
  77 |   }, [visibleTabs, active]);
```

⇒ `typecheck` + 8 tệp `test:regression` + `test:workflow` **CHƯA TỪNG CHẠY** kể từ khi component này được thêm.

**Bản sửa** (đúng khuôn mẫu React *"you might not need an effect"*): dòng 89 vốn **đã** có fallback
`|| visibleTabs[0]` nên effect **hoàn toàn thừa**; thay bằng **suy ra** tab đang chọn ngay khi render:

```tsx
const [selectedTab, setSelectedTab] = useState<string | undefined>(undefined);
const active = visibleTabs.some((t) => t.key === selectedTab) ? selectedTab : visibleTabs[0]?.key;
```

Hành vi người dùng **không đổi** (vẫn quay về tab đầu khi tab cũ biến mất), chỉ bỏ render dây chuyền.
**Kiểm chứng:** `eslint` tệp → exit 0; `eslint .` → **0 error**; bộ kiểm **đã tiến qua** `typecheck`.

## F2 — 3 test đỏ, đã phân loại

### F2c — `.local-data/email-secret.key` ⇒ **DƯƠNG TÍNH GIẢ DO MÔI TRƯỜNG** (không rò rỉ)

| Phép kiểm | Kết quả |
|---|---|
| `git check-ignore -v .local-data/email-secret.key` | `.gitignore:43:/.local-data/` ⇒ **bị bỏ qua** |
| `git ls-files .local-data` | **rỗng** ⇒ không tệp nào được theo dõi |

⇒ **Không có khóa bí mật nào trong kho mã.** Tệp do chính ứng dụng tạo khi chạy cục bộ, nằm trong thư
mục đã gitignore. Phép kiểm quét cả cây làm việc mà không loại trừ thư mục runtime ⇒ **dương tính giả**.

### F2a — Cây dự án trong menu **BỊ TẮT** ở cả hai nav ⇒ **CẦN NGƯỜI DÙNG QUYẾT ĐỊNH** → **TASK-031**

`tests/mobile-menu-interaction.test.mjs:36` khẳng định `/groupKey==="site_command" \? activeSiteProjects\.map/`,
nhưng mã hiện tại **không bao giờ** thoả: cả hai nav dùng sentinel `__site_command_tree_disabled__`
(`app/page.tsx:664` desktop **và** `:678` mobile) — sentinel **không thể trùng** `groupKey` thật
⇒ nhánh `activeSiteProjects.map(...)` là **MÃ CHẾT**; `activeSiteProjects` (dòng 671) vẫn được tính mà
không còn nơi dùng.

**Truy nguồn ý đồ:** sentinel vào ở commit **`1c01f39`** (16/09), **trước toàn bộ công việc RBAC** của
phiên này; **mô tả commit đó KHÔNG nhắc việc tắt cây dự án** ⇒ thay đổi được đưa vào **âm thầm** trong
một commit không liên quan và test không được cập nhật.

**Phân loại `CONFLICT`** giữa mã đang tắt (tên sentinel nói rõ "disabled", và **cả hai** nav cùng tắt
nên trông có chủ đích) và test vẫn khẳng định đang bật. **Chưa đủ căn cứ kết luận là chủ ý sản phẩm hay
tính năng bị tắt nhầm rồi bỏ quên.** Bật lại là **thay đổi hành vi người dùng** ⇒ **KHÔNG tự sửa**.
**Cũng KHÔNG sửa test cho khớp mã** — làm vậy là "đóng băng" một trạng thái có thể là lỗi.

### F2b — **LỖ HỔNG LIÊN KẾT DỮ LIỆU**: vai trò ↔ đơn vị mặc định → **TASK-032**

`tests/runtime-admin-boq-regression.test.mjs:65` khẳng định `thuky` có
`name==='Thư ký Tổng giám đốc'` và `defaultOrganizationCode==='BGD'`. Đo dữ liệu sống
(`tools/show-role-catalog.mjs`):

| Hạng mục | Dữ liệu THẬT | Khớp? |
|---|---|---|
| `code='thuky'`, `active=true` | có | ✅ |
| `name` | **"Thư ký Tổng giám đốc / Trưởng phòng Hành chính Pháp chế"** | ❌ tên đã dài hơn |
| `defaultOrganizationCode` | **null** | ❌ |

**Truy nguyên:** `organization_units` có **8 đơn vị đang hoạt động, gồm `BGD` = "Ban giám đốc"**,
nhưng **0/16 vai trò** trỏ tới bất kỳ đơn vị mặc định nào ⇒ **đơn vị tồn tại mà không vai trò nào
liên kết** ⇒ **LỖ HỔNG LIÊN KẾT (dữ liệu)**, không phải thiếu đơn vị, không phải lỗi hiển thị.
Hệ quả: cơ chế "đơn vị mặc định theo vai trò" **âm thầm không thể hoạt động**.

Ghi chú kỹ thuật: **không tệp SQL/Java nào** nhắc `default_organization_code` — trường này sinh từ JOIN
trên `default_organization_unit_id`, nên tìm theo tên cột hiển thị sẽ không thấy.

## Rào cản môi trường — TASK-B02/TASK-017 **ĐÃ TÌM RA NGUYÊN NHÂN GỐC**

Nay xác định **chính xác** bằng `tools/diag-edge-cdp.mjs` (ghi stderr của Edge ra **tệp**, không pipe):

```
FATAL:mojo\public\cpp\platform\platform_channel.cc:183] Check failed: . : Access is denied. (0x5)
crashpad_client_win.cc:447] OpenProcess: Access is denied. (0x5)
```

Edge **sập ngay khi khởi động** (mã thoát `2147483651` = `0x80000003`) vì không tạo được **mojo platform
channel** — hiện thực bằng **named pipe** trên Windows, mà sandbox chặn mở named pipe. Cổng ảnh spawn
Edge với `stdio: "ignore"` nên lỗi bị nuốt, chỉ lộ triệu chứng "Không kết nối được CDP của Edge".

⇒ **RÀNG BUỘC MÔI TRƯỜNG, không phải lỗi mã dự án.** Cổng ảnh chạy được khi cấp `danger-full-access`
— và khi chạy đã **ĐẠT 28/28, 0 px**. Node test runner cũng cần `spawn` tiến trình con qua pipe nên
`test:regression` cũng cần quyền rộng hơn (nếu không: 8/8 tệp lỗi `spawn EPERM`, **assertion chưa hề chạy**).

## Files Changed (phần 2)

* `app/components/ui/EntityDetailModal.tsx` — bỏ `setState` trong effect, suy ra tab khi render
* `tools/diag-edge-cdp.mjs` (mới) — chẩn đoán Edge/CDP bằng log ra tệp
* `tools/show-role-catalog.mjs` (mới) — đối chiếu `role_catalog` + `organization_units` với dữ liệu sống

## Next Task

* **TASK-031** — quyết định cây dự án trong menu (F2a)
* **TASK-032** — khôi phục liên kết vai trò ↔ đơn vị mặc định (F2b)
* `test:workflow` chạy sau khi `test:regression` được xử lý

## Continuation Notes (phần 2)

1. `npm test` **còn 3 test đỏ**; muốn chạy `test:workflow` phải xử lý `test:regression` trước.
2. **Mọi cổng UI/test của dự án cần `danger-full-access`** (named pipe). Chẩn đoán mẫu: `tools/diag-edge-cdp.mjs`.
3. Ba test đỏ **đã phân loại** — **không phải hồi quy do RBAC**. Đừng "sửa cho xanh" khi chưa có quyết định.

