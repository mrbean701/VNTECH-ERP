# 21 — BÁO CÁO TRIỂN KHAI 8 NHÓM YÊU CẦU CHỈNH SỬA VNTECH ERP

- **Sản phẩm:** VNTECH ERP V5.3.0 — MASTER BASELINE R1.1.1
- **Định danh nguồn:** `VNTECH-FP-91C8C3B6EE5D6703`
- **Định danh phát hành:** `bedc5f3d29a3fa2263ad9e0ecc59be19afb4e341606a6416021061048910473a`
- **Đầu migration:** `0100_phase_sua_loi_admin_materials_rong_identity.sql`
- **Manifest phát hành:** 743 file
- **Trạng thái:** 8/8 nhóm yêu cầu hoàn thành, đã nghiệm thu bằng probe trình duyệt thật
- **Chưa commit** — theo yêu cầu người dùng, chỉ commit vào cuối ngày

---

## 1. Tổng quan

Tám nhóm yêu cầu chỉnh sửa được triển khai trên nền kiến trúc sẵn có: React SPA một tệp
(`app/page.tsx`, 4.057 dòng, 218 khai báo hàm cấp cao) render phía máy chủ, ghép với backend
Java Spring Boot 3.5.0 (Clean Architecture, MySQL 8.0.46, Flyway).

Không có nghiệp vụ nào bị viết lại. Mỗi nhóm yêu cầu đều được:
1. triển khai trong `app/page.tsx` (và CSS ở `app/styles/canonical.css`);
2. ghi một migration định danh trong `drizzle/` để cập nhật source fingerprint;
3. nghiệm thu bằng một probe trình duyệt thật trong `tools/`.

CSS được xếp lớp theo thứ tự `globals.css` → `canonical.css` → `font-floor.css`.
Tệp `font-floor.css` được **sinh tự động** bởi `tools/gen-font-floor.mjs`.

---

## 2. Bảng tổng hợp 8 nhóm yêu cầu

| # | Nhóm yêu cầu | Probe nghiệm thu | Kết quả |
|---|---|---|---|
| 1 | Layout / responsive / scrollbar toàn cục | `tools/probe-layout-audit.mjs` | ĐẠT ✅ |
| 2 | Bỏ dropdown dự án → danh sách + trang chi tiết dự án | `tools/probe-project-screen.mjs` | ĐẠT ✅ |
| 3 | "Công việc" + quản lý công việc phòng ban + KPI | `tools/probe-work-center.mjs` · `tools/probe-work-permission.mjs` | ĐẠT ✅ |
| 4 | Tổ đội chi tiết | `tools/probe-team-screen.mjs` | ĐẠT ✅ |
| 5 | Danh mục vật tư dạng tab + cấu hình hệ/nhóm vật tư | `tools/probe-material-tabs.mjs` · `tools/probe-material-list.mjs` · `tools/probe-material-perm.mjs` | ĐẠT ✅ |
| 6 | Quyền phòng ban dạng checkbox | `tools/probe-dept-perm.mjs` | ĐẠT ✅ |
| 7 | Danh sách nhân sự full màn hình | `tools/probe-staff-full.mjs` | ĐẠT ✅ |
| 8 | Chuẩn hoá ID/code trong DB | `tools/normalize-material-codes.mjs` + kiểm tra toàn vẹn | ĐẠT ✅ |

Ngoài ra: `tools/probe-request-page.mjs`, `tools/probe-page-assets.mjs`,
`tools/probe-live-stack.mjs` (kiểm tra 4 dịch vụ và toàn vẹn dữ liệu nền).

---

## 3. Chi tiết từng nhóm

### Nhóm 1 — Layout, responsive, scrollbar toàn cục

**Vấn đề.** `globals.css` phình tới 2.724 dòng với 4.950 lần `!important`; `.table-wrap` được
định nghĩa **26 lần** chồng chéo; chữ trong nhiều bảng bị ép xuống 7–8,8px; thanh cuộn bị ẩn
khiến người dùng không biết bảng còn nội dung.

**Cách làm.** Thêm `app/styles/canonical.css` (761 dòng) chia **13 mục đánh số**:
token thiết kế · thanh cuộn luôn hiển thị · một định nghĩa `.table-wrap` duy nhất ·
sàn cỡ chữ 10px · nhịp dọc · 4 điểm ngắt responsive · chế độ trang · khối thu gọn ·
quản lý dự án · trung tâm công việc · quản lý tổ đội · tab vật tư ·
bố cục quyền phòng ban 2 cột · bảng danh sách vật tư · bảng nhân sự full màn.

Tệp `font-floor.css` được sinh tự động: **120 selector** được nâng từ 7–8,8px lên đúng 10px.

**Kết quả.** Probe kiểm tra ở 4 kích thước màn hình: không còn thành phần nào tràn ngang,
mọi vùng cuộn đều hiện thanh cuộn, không chữ nào dưới 10px.

---

### Nhóm 2 — Bỏ dropdown dự án, thay bằng danh sách + trang chi tiết

**Vấn đề.** Người dùng phải chọn dự án trong một dropdown ở thanh trên; đổi dự án là đổi
ngầm toàn bộ ngữ cảnh màn hình, không có chỗ để xem tổng thể nhiều dự án.

**Cách làm.** Thay bằng component `ProjectManagement`:
- **Danh sách dự án**: mã, tên, chủ đầu tư, trạng thái, tiến độ, số ngày quá hạn;
- **Trang chi tiết 5 tab**, mở bằng cách bấm vào một dòng.

Thêm các hàm hỗ trợ `daysFromToday`, `projectOverdueDays`, `workRate`,
`isTaskLate` cùng hai bảng nhãn `WORK_STATUS_LABELS`, `PROJECT_STATUS_LABELS`.

Bổ sung component `RequestScopeSelect` để chọn dự án theo ngữ cảnh hẹp khi cần.
Nhánh điều hướng cây dự án cũ (`site_command`) bị vô hiệu hoá bằng cách đổi tên điều kiện
thành `"__site_command_tree_disabled__"`; nhãn module đổi thành **Quản lý dự án**.

**Kết quả.** Probe mở danh sách, bấm vào một dự án, kiểm tra đủ 5 tab và quay lại — ĐẠT.

---

### Nhóm 3 — "Công việc", quản lý công việc phòng ban và KPI

**Cách làm.** Component `WorkCenter` gồm **3 tab**:
1. **Việc của tôi** — `workItems` giao cho chính người đăng nhập;
2. **Việc phòng ban** — theo `departmentCode` của người đăng nhập;
3. **KPI** — tổng hợp tiến độ và tỷ lệ hoàn thành.

Nhãn nhóm menu `my_work` đổi thành **`CÔNG VIỆC`** (migration `V16`).

**Quyền tự tạo việc.** Người dùng thường không được tạo việc phòng ban, nhưng cần tự ghi
việc cho mình. Thêm `createSelfWorkItem()` trong `OpsTaskManagementUseCase`:
- **không** kiểm tra quyền quản lý;
- `assignedTo` **bị ép** từ principal, không nhận từ client;
- `department_code` cố định `"CN"`;
- tiền tố số việc `CVCN-`.

Đăng ký action `create_self_work_item` trong `ActionRbacRegistry` với module
`{dept_plan_tasks, dept_project_tasks}` và quyền `canUse`, thêm nhánh xử lý trong
`SystemController`.

**Kết quả.** `probe-work-center.mjs` xác nhận 3 tab render và dữ liệu đúng.
`probe-work-permission.mjs` xác nhận: người dùng thường tạo được việc cho chính mình,
**không** tạo được việc cho người khác, và `assignedTo` luôn bị ghi đè bằng chính họ.

---

### Nhóm 4 — Tổ đội chi tiết

**Cách làm.** Component `TeamManagement` gồm danh sách tổ đội và **trang chi tiết 3 tab**
(thành viên · phân công · thanh toán).

Migration `V14` thêm bảng `team_members` với `COLLATE=utf8mb4_unicode_ci`, đồng thời bổ sung
`joined_at`, `left_at`, `position_name` vào `user_project_scopes`.

`BootstrapDataAdapter` thêm truy vấn `teamMembers`, trong đó **JOIN `role_catalog rc ON rc.code = u.role`**
để lấy tên vai trò — vì bảng `users` **không có** cột `role_name`.

**Bài học.** Trong `V14` **bắt buộc dùng dấu backtick** cho tên bảng, nếu không
`tools/generate-h2-test-schema.mjs` sẽ bỏ qua tệp và test H2 thiếu bảng.

---

### Nhóm 5 — Danh mục vật tư dạng tab + cấu hình hệ/nhóm (kèm phần còn nợ)

**Cách làm (phần tab).** Màn Danh mục vật tư gốc chuyển sang dạng tab; tab 1 nhóm con & mã
vật tư, các tab sau là cấu hình Hệ M&E và Nhóm.

**Phần còn nợ của nhóm này.** Nguyên văn yêu cầu:

> «Tab đầu tiên sẽ hiển thị danh sách vật tư (sắp xếp theo id), có đầy đủ các thông tin cơ bản
> về vật tư đó **bao gồm cả tên phụ alias**, hiển thị **tất cả** các nút CRUD áp dụng với tất cả
> các user nhưng chỉ có các user có perm thì mới được sử dụng tính năng của nút đó, thêm đầy đủ
> các search sort filter.»

Ở vòng trước mới chỉ chuyển được khối sang dạng tab; bảng cũ (`MaterialCatalogManager`)
**không có cột alias** và **không vô hiệu hoá nút theo quyền** — hụt đúng hai điểm.

Bù bằng component `MaterialListTable` (migration `0099`):
- **11 cột**: Mã vật tư · Tên chuẩn · **Tên phụ (alias)** · Hệ M&E · Nhóm · ĐVT ·
  Thông số · Hãng · Tồn min · Trạng thái · Thao tác;
- tên phụ lấy từ `materialAliases` (19 dòng) theo `materialId`, gộp bằng `" · "`;
- tìm kiếm **bao gồm cả alias**; lọc theo Hệ / Nhóm / Trạng thái; sắp xếp theo Mã / Tên / Hệ;
  có ô bật-tắt cột tên phụ;
- ba nút **Sửa · Hợp nhất · Ngừng luôn hiển thị với mọi người dùng** nhưng `disabled` khi thiếu
  quyền, kèm thuộc tính `title` giải thích lý do bị khoá.

**Kết quả.** `probe-material-list.mjs` (admin) ĐẠT. `probe-material-perm.mjs` (thiếu quyền) ĐẠT
sau khi vá lỗi ở mục 4 bên dưới.

---

### Nhóm 6 — Quyền phòng ban dạng checkbox

**Vấn đề.** `departmentModulePermissions` (37 dòng) được hiển thị bằng danh sách chọn rời rạc,
khó quét mắt và dễ bấm nhầm.

**Cách làm.** Bố cục **2 cột checkbox** theo `canonical.css`, giữ nguyên mã định danh quyền và
hợp đồng API. **Không** đổi tên trường bootstrap: phải là `departmentModulePermissions`
(**không phải** `departmentPermissions`), và `systemLevelCatalog` (**không phải** `systemLevels`).

**Kết quả.** `probe-dept-perm.mjs` ĐẠT — tick/bỏ tick cập nhật đúng, trạng thái được giữ sau
khi tải lại trang.

---

### Nhóm 7 — Danh sách nhân sự full màn hình

**Cách làm.** Component `AdminStaffList` — bảng nhân sự chiếm trọn chiều ngang, bỏ các khối
trang trí hai bên. Giữ nguyên nghiệp vụ tài khoản.

**Kết quả.** `probe-staff-full.mjs` ĐẠT.

**Bài học về probe.** Lần đầu probe báo hỏng nút CRUD, nhưng đó là **lỗi của probe**: nó lọc
trạng thái "Đã khoá" nên còn 0 dòng, không có gì để bấm. **Sửa probe, không sửa sản phẩm.**

---

### Nhóm 8 — Chuẩn hoá ID/code trong DB (phương án A)

**Quyết định.** Người dùng chọn **phương án A**: giữ `id` dạng hash làm **khoá nội bộ**,
chuẩn hoá `code` thành **định danh hiển thị**.

**Phát hiện trước khi làm.** `materials.category_id` và `subcategory_id` **đều NULL**, và hệ
thống chỉ có **1 nhóm con** — nên **không thể** sinh mã `<HỆ>-<NHÓM>-<STT>`. Phải tạo trước
**7 nhóm con** rồi mới chuẩn hoá được.

**Cách làm.** `tools/normalize-material-codes.mjs`, chạy dry-run trước rồi mới `--apply`.

Mã mới theo dạng `<HỆ>-<NHÓM>-<STT>`:

| Hệ | Mã |
|---|---|
| DIEN | `DIEN-DAY-CAD-001`, `DIEN-DAY-CAD-002`, `DIEN-THIET-BI-001`, `DIEN-ONG-LUON-001` |
| CTN | `CTN-ONG-NHUA-001`, `CTN-ONG-NHUA-002`, `CTN-VAN-001` |
| HVAC | `HVAC-ONG-GIO-001` |
| KHAC | `KHAC-VLXD-001` … `KHAC-VLXD-006` |

**Kiểm tra toàn vẹn — 0 lỗi:** không mồ côi, không sai định dạng, không trùng lặp.
Ghi 14 dòng vào `material_code_history` để truy vết.

**Rà soát phạm vi.** Chỉ **4 cột văn bản** trong toàn hệ thống lưu mã vật tư
(`boq_source_items` và `project_boq_items` × `contract_material_code` / `approved_material_code`)
— và **cả 4 đều rỗng**, nên không có tham chiếu nào bị mồ côi.

**Bài học.** Bảng `material_subcategories` **không có giá trị mặc định cho `created_at`**; nếu
không truyền tường minh sẽ lỗi `ERROR 1364`. Lần chạy `--apply` đầu tiên hỏng **nguyên tử**
(không thay đổi một phần) — đã kiểm tra DB còn nguyên trước khi chạy lại.

---

## 4. Lỗi có sẵn được phát hiện và vá trong quá trình nghiệm thu

Đây là lỗi **có từ trước**, không do 8 nhóm yêu cầu gây ra, phát hiện nhờ probe chiều ngược.
Bản vá ghi ở migration `0100`.

**Triệu chứng.** Tài khoản chỉ có quyền XEM `material_catalog` mở màn Danh mục vật tư gốc thì
thấy đúng ghi chú quyền và nút "＋ Thêm vật tư" bị khoá, nhưng bảng hiển thị **«0/0 vật tư»** —
không có dòng nào, nên không thể kiểm chứng nút Sửa/Ngừng có bị khoá hay không.

**Điều tra.** `tools/diagnose-material-scope.mjs` gọi thẳng `/api/system` cho thấy **API không
hề thiếu dữ liệu**: tài khoản thường nhận `materials: 14`, chỉ **vắng key `adminMaterials`**
(`BootstrapDataAdapter` chỉ gắn khối này cho tài khoản quản trị). Vậy lỗi nằm ở phía client.

**Nguyên nhân gốc.** Khối chuẩn hoá bootstrap hạ `adminMaterials` vắng mặt thành `[]`:

```ts
adminMaterials: Array.isArray(result.data?.adminMaterials) ? result.data.adminMaterials : [],
```

rồi **5 nơi tiêu thụ** đều viết `data.adminMaterials || data.materials`. Trong JavaScript,
**mảng rỗng là truthy**, nên `[] || data.materials` trả về `[]` — 14 vật tư thật bị bỏ qua.

Năm điểm tiêu thụ bị ảnh hưởng:

| Dòng | Màn hình |
|---|---|
| 1734 | `MaterialListTable` — bảng 11 cột của nhóm 5 |
| 1809 | `MaterialCatalogPage` — nhánh chỉ-xem |
| 2203 | Màn kho vật tư |
| 3677 | Bộ chọn vật tư cho BOQ |
| 3663 / 3669 / 3670 | Bộ chọn Hệ / Nhóm (`adminMaterialCategories`, `adminMaterialSubcategories`) |

**Bản vá.** Chuyển fallback về **đúng nguồn**: cả **ba cặp** admin/thường
(`adminMaterials` → `materials`, `adminMaterialCategories` → `materialCategories`,
`adminMaterialSubcategories` → `materialSubcategories`) nay lấy bản thường khi máy chủ không gửi
bản admin. **Sửa một chỗ, cả 5 điểm tiêu thụ cùng đúng.**

**Bằng chứng sau khi vá** — `tools/probe-material-perm.mjs`: **ĐẠT ✅**

```
rows: 14     Sửa: 14/14 hiện, 14/14 vô hiệu hoá
             Hợp nhất: 14/14 hiện, 14/14 vô hiệu hoá
             Ngừng: 14/14 hiện, 14/14 vô hiệu hoá
addDisabled: true     note: "14/14 vật tư — Bạn chỉ có quyền xem, các nút đã bị vô hiệu hoá"
```

**Hồi quy không tác dụng phụ:** `probe-material-list.mjs` ĐẠT · `probe-material-tabs.mjs` ĐẠT ·
`probe-live-stack.mjs` **ALL PASS**.

---

## 5. Trạng thái dữ liệu nền (kiểm chứng cuối)

| Hạng mục | Số lượng |
|---|---|
| Dự án | 2 |
| Người dùng | 10 |
| Đơn vị tổ chức | 8 |
| Nhóm menu | 12 |
| Module | 61 |
| Quy trình / bước | 1 / 5 |
| Dòng quyền phòng ban | 37 |
| Cấp hệ thống | 5 |
| Tổng quyền module | 187 |
| Vật tư | 14 |
| Alias vật tư | 19 |
| Hệ vật tư | 6 |
| Nhóm con vật tư | 8 |
| Lịch sử đổi mã | 14 |

Tên tiếng Việt: 18/18 đúng UTF-8, **0 lỗi mojibake**; 12/12 nhóm menu có tên.

---

## 6. Kiểm thử tự động

**Backend Java:** 29/29 test ĐẠT.

**Probe trình duyệt thật** (mỗi probe mở Chromium thật, đăng nhập thật, thao tác thật):

| Probe | Nội dung |
|---|---|
| `probe-layout-audit.mjs` | 4 kích thước màn hình, tràn ngang, thanh cuộn, sàn cỡ chữ |
| `probe-request-page.mjs` | `RequestDrawer` ở cả hai chế độ `drawer` và `page` |
| `probe-project-screen.mjs` | Danh sách dự án + 5 tab chi tiết |
| `probe-work-center.mjs` | 3 tab trung tâm công việc |
| `probe-work-permission.mjs` | Tạo việc tự phục vụ, ép `assignedTo` |
| `probe-team-screen.mjs` | Danh sách + 3 tab tổ đội |
| `probe-material-tabs.mjs` | Cấu trúc tab màn vật tư |
| `probe-material-list.mjs` | Bảng 11 cột, alias, search/sort/filter (admin) |
| `probe-material-perm.mjs` | Chiều thiếu quyền — nút hiện đủ và bị khoá |
| `probe-dept-perm.mjs` | Checkbox quyền phòng ban |
| `probe-staff-full.mjs` | Bảng nhân sự full màn |
| `probe-live-stack.mjs` | 4 dịch vụ sống, toàn vẹn dữ liệu nền |
| `probe-page-assets.mjs` | Tài nguyên trang tải đủ |

**Nguyên tắc đã rút ra.** Probe phải chạy bằng **trình duyệt thật**, phải đăng nhập bằng
**tài khoản thiếu quyền** (không chỉ admin — nếu chỉ test bằng admin sẽ giấu lỗi RBAC),
và khi probe báo hỏng phải xác định **hỏng ở sản phẩm hay ở probe** trước khi sửa.

---

## 7. Chu trình build và định danh

Thay đổi giao diện **bắt buộc** đi kèm một migration định danh mới trong `drizzle/`
(đã tạo `0084` … `0100`). Chu trình:

1. dừng Node UI và proxy (**không** dừng Java nếu không cần);
2. dời `.local-data` ra khỏi workspace — **cùng ổ đĩa**, **không dùng `%TEMP%`**
   (thư mục tạm theo phiên sẽ bị xoá khi thoát);
3. `node tools/refresh-phase-identity.mjs <tên-file-drizzle> "<NHÃN>"` — tệp phải chứa
   **placeholder 64 số 0**, nếu đã có fingerprint thật thì công cụ từ chối chạy lại;
4. `node scripts/build-cross-platform.mjs`;
5. khôi phục `.local-data`;
6. `node scripts/generate-release-manifest.mjs`;
7. khởi động lại UI và proxy.

**Cạm bẫy vận hành.** **Tuyệt đối không** dùng `Get-Process node | Stop-Process -Force` —
harness DSH chạy trên node nên sẽ tự giết chính mình. Chỉ dừng đúng tiến trình UI và proxy.

---

## 8. Cấu trúc tệp thay đổi

**Giao diện**
- `app/page.tsx` — thêm `WorkCenter`, `ProjectManagement`, `TeamManagement`, `MaterialListTable`,
  `AdminStaffList`, `RequestScopeSelect`, `ProjectScopeSelect`; sửa `RequestDrawer`
  (`variant="drawer"|"page"`, `sections-collapsed`); vá khối chuẩn hoá bootstrap.
- `app/styles/canonical.css` — thêm mới, 761 dòng, 13 mục.
- `app/styles/font-floor.css` — sinh tự động, 120 selector nâng lên 10px.
- `app/layout.tsx` — thứ tự import CSS.

**Backend Java**
- `OpsTaskManagementUseCase.java` — thêm `createSelfWorkItem()`.
- `ActionRbacRegistry.java` — đăng ký `create_self_work_item`.
- `SystemController.java` — thêm nhánh action.
- `BootstrapDataAdapter.java` — `userScopes` thêm `joinedAt/leftAt/positionName`; thêm truy vấn
  `teamMembers`; `workItems` thêm 6 trường.

**Migration**
- `V14` `project_membership_and_team_members.sql`
- `V15` đổi nhãn module `site_command`
- `V16` đổi nhóm `my_work` thành `CÔNG VIỆC`
- `drizzle/0084` … `drizzle/0100` — định danh nguồn

**Công cụ**
- `tools/gd-cycle.mjs`, `tools/refresh-phase-identity.mjs`, `tools/gen-font-floor.mjs`,
  `tools/normalize-material-codes.mjs`, `tools/diagnose-material-scope.mjs`
- 13 probe trong `tools/`

---

## 9. Việc còn lại

- [ ] Người dùng nghiệm thu trên giao diện **http://127.0.0.1:9000**
- [ ] Commit cuối ngày (đánh số tuần tự) — **chưa push**, theo chỉ đạo của người dùng
- [ ] Thực hiện kế hoạch chỉnh sửa giao diện toàn diện sau golive — xem `docs/22`
- [ ] Dọn gộp `docs/20` sau khi `docs/22` được duyệt
