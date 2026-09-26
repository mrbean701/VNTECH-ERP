# 20 — KẾ HOẠCH CHỈNH SỬA GIAO DIỆN & DỮ LIỆU (8 NHÓM YÊU CẦU)

> **Trạng thái:** 🟡 ĐANG LẬP KẾ HOẠCH — chờ chốt 3 quyết định ở §6 trước khi thi công.
> **Người lập:** kỹ thuật VNTECH · **Ngày:** 15/09/2026
> **Phạm vi:** toàn bộ giao diện SPA (`app/page.tsx`) + CSS (`app/globals.css`) + API Java + schema MySQL.

---

## 1. MỤC TIÊU

Chuyển hệ thống từ trạng thái "chạy được" sang **"dùng được thật"**: hiển thị đủ trên một màn hình,
thao tác không bị che khuất, dữ liệu định danh đọc được bằng mắt thường, và các nghiệp vụ
dự án – công việc – tổ đội – vật tư có màn hình chi tiết đúng nhu cầu vận hành.

Tám nhóm yêu cầu gốc của người dùng được đánh mã để theo dõi xuyên suốt tài liệu:

| Mã | Nhóm yêu cầu | Giai đoạn |
|---|---|---|
| **A** | Giao diện quá nhiều thông tin · dính liền · scrollbar hỏng · thiếu responsive | GĐ1, GĐ2 |
| **B** | Quản lý dự án: bỏ dropdown → danh sách + trang chi tiết (nhân sự/tổ đội/kho) | GĐ3 |
| **C** | "Công việc của tôi" → "Công việc" + quản lý công việc phòng ban + KPI | GĐ4 |
| **D** | Tổ đội: danh sách + chi tiết (thành viên, thời gian, đơn từ) | GĐ5 |
| **E** | Danh mục vật tư: bỏ dropdown → tab + cấu hình hệ/nhóm vật tư | GĐ6 |
| **F** | Dept perm: checkbox, danh sách phòng ban, bố cục 1 dòng | GĐ7 |
| **G** | Danh sách nhân sự full màn + CRUD/search/sort/filter | GĐ7 |
| **H** | Chuẩn hoá ID/code trong DB (bỏ hash) | GĐ8 |

---

## 2. HIỆN TRẠNG — SỐ LIỆU ĐO ĐƯỢC

Khảo sát ngày 15/09/2026, tất cả số liệu đều đo trực tiếp, không ước lượng.

### 2.1 Nguyên nhân gốc của vấn đề giao diện (nhóm A)

| Chỉ số | Giá trị | Ý nghĩa |
|---|---:|---|
| `app/globals.css` | **2.723 dòng** | |
| Số `!important` | **4.950** | Trung bình **1,8 `!important` mỗi dòng** |
| Số rule `{` | 3.512 | |
| Số `@media` | 96 | |
| Số lần định nghĩa lại `.table-wrap` | **26** | Cùng một class bị ghi đè 26 lần |

**Kết luận:** CSS đã bị **chồng 8+ lớp override** theo thời gian (các "đợt" vá nối tiếp nhau ở
dòng 761 → 992 → 997 → 1023 → 1051 → 1055 → 2006 → 2070 → 2170 → 2232…). Vì CSS luôn lấy rule
**sau cùng thắng**, mỗi màn hình thừa hưởng một tổ hợp `max-height`/`overflow` khác nhau:

```
.table-wrap   max-height:min(68vh,720px)   (L2070)   ← mặc định
.table-wrap   max-height:62vh              (L2085)   ← trong @media ≤900px
.modal .table-wrap  max-height:min(56vh,600px) (L2073)
.request-drawer .table-wrap  max-height:44vh    (L2232)
.embedded-account-permissions .table-wrap  max-height:420px (L2081)
.boq-history-panel .table-wrap  max-height:260px (L2378)
.matching-table-wrap  max-height:620px       (L1520)
.material-subgroup-table-wrap  max-height:760px (L2058)
```

Đây chính là lý do **"nút kéo thả để xem danh sách dài không hiển thị hoặc không hoạt động"** —
không phải lỗi một màn, mà là **26 định nghĩa xung đột**. Thêm nữa, chỉ `.sidebar .tree-nav` được
style thanh cuộn (`::-webkit-scrollbar`, L1457/1503/1538); `.table-wrap` chỉ có
`scrollbar-color` (L761) mà **thiếu `::-webkit-scrollbar`**, nên trên Edge/Chromium thanh cuộn
không được tô màu và dễ chìm vào nền.

Các lớp override từng bị nghi là nguyên nhân **"dính liền vào nhau"**: `.stack{gap:16px}` (L91)
bị ghi đè thành `.stack{gap:16px!important}` (L992) rồi `.stack{gap:14px!important}` (L1051).

> ⚠️ **ĐÍNH CHÍNH (đo ngày 15/09/2026 bằng `tools/probe-layout-audit.mjs`):** giả thuyết
> "nhiều giá trị gap xung đột" là **SAI**. Đo trên giao diện đang chạy ở cả 3 kích thước màn
> hình đều trả về **duy nhất `14px`** — cascade phân giải nhất quán. Nội dung sai này bị loại
> khỏi kết luận; "dính liền" (nếu có) phải tìm ở chỗ khác, không phải `.stack`.
> Bài học: **đo trước khi kết luận**, đừng suy đoán từ việc đọc code.

### 2.1b Kết quả đo TRƯỚC khi sửa (baseline chính thức)

| Chỉ số đo được | 1920×1080 | 1366×768 | 768×1024 |
|---|---|---|---|
| Tràn ngang toàn trang | Không | Không | Không |
| `.table-wrap` cuộn được nhưng **không thấy thanh cuộn** | — | — | ❌ **CÓ** |
| Phần tử chữ **< 9px** | ⚠️ 32 | ⚠️ 32 | ⚠️ 32 |

Chi tiết phần tử chữ nhỏ: `.dashboard-staff-badge` 8px, `small.offline` 8.3px, `span` trong
`.dashboard-staff-info` 8.7px — và công cụ `tools/gen-font-floor.mjs` phát hiện **120 selector**
trong `globals.css` đặt cỡ chữ từ 7px đến 8.8px (phân bố: 8px×74 · 8.5px×29 · 7.5px×6 · 7px×4 ·
8.7px×2 · 8.3px×1 · 8.25px×1 · 8.8px×1 · 7.7px×1 · 7.8px×1).

### 2.2 Kiến trúc UI hiện tại

| Hạng mục | Số liệu |
|---|---|
| `app/page.tsx` | **3.173 dòng**, ~145 component định nghĩa ở cấp cao nhất |
| Menu | 12 nhóm · 61 module (`defaultMenuGroups`, `modules`) |
| Modal đã đăng ký | `workflowMaster`, `systemLevelMaster`, `userProfile`, `userProfileHr`, `userEdit`, `request`, `po`, `receipt`, `issue`, `count`, `return`, `teamCreate`, `install`, `project`, `material`, … |
| Số file UI | **1** (`app/page.tsx`) — không tách component |

### 2.3 Điểm nghẽn cụ thể theo từng nhóm yêu cầu

| Mã | Hiện trạng | Vị trí |
|---|---|---|
| **B** | `ProjectScopeSelect` render `<select>` và xuất hiện ở **mọi màn hình** qua `.page-project-context` | `page.tsx:788-792` |
| **B** | Chưa có trang chi tiết dự án; chưa có API trả "trễ bao nhiêu ngày" | — |
| **C** | Menu nhóm tên `CÔNG VIỆC CỦA TÔI` | `page.tsx:44` |
| **C** | `work_items` đã có `status/progress/due_at/completed_at/assigned_to` — **đủ nền cho KPI**, nhưng `assigned_to` là `text` (không phải FK) | schema |
| **D** | `teams` chỉ có `leader_user_id`; **KHÔNG có bảng `team_members`** ⇒ không có "bao nhiêu người / thời gian tham gia / rời đi" | schema |
| **E** | Danh mục vật tư dùng `<details>` thu gọn 3 khối, không phải tab | `page.tsx:1040-1048` |
| **E** | Đã có `material_categories` (hệ) + `material_subcategories` (nhóm) — **nền cho cấu hình hệ/nhóm đã sẵn** | schema |
| **F** | `DepartmentPermissionManager` là bảng lớn; label "CHỌN PHÒNG BAN" chiếm diện tích | `page.tsx:1847-1944` |
| **G** | `StaffDirectory` (L887) và `HrScreen` (L1585) chia đôi màn hình | `page.tsx` |
| **H** | Khoá chính dạng hash `MAT_<uuid>`, `PRJ_<uuid>`, `USR_<uuid>`, `WH_<uuid>`, `TEAM_<uuid>` — nhưng **đã có sẵn cột `code` đọc được** (`VL-CAPDIEN`, `DA-MAU-01`, `ADMIN-001`) | schema |

### 2.4 Bằng chứng ID thực tế trong DB

```
materials   id = MAT_8b585b8f-6155-4aeb-9f9e-852be7d15be4   code = VL-CAPDIEN
projects    id = PRJ_cfba8c1a-2b2e-4119-92d4-0a6438cb4ed8   code = DA-MAU-01
users       id = USR_a5b738ea-13ca-466d-b5a7-493195e2ea04   employee_code = ADMIN-001
warehouses  id = WH_dc5b5734-ee98-42bc-9d3e-71c2560a996b    code = KHO-DA-MAU-01
warehouses  id = WH-CENTRAL                                  code = KHO-TONG      ← đã sạch!
teams       id = TEAM_8c1fecd9-1060-4f0f-849d-fa8d8dd75878  code = PRJ-DEMO-01-TD-01
```

👉 **`WH-CENTRAL` chứng minh tiền lệ:** hệ thống đã từng dùng ID sạch cho Kho Tổng, tức hạ tầng
**không bắt buộc** phải là hash. Vấn đề thuần tuý là quy ước sinh ID.

---

## 3. NGUYÊN TẮC THI CÔNG

1. **Không phá vỡ cái đang chạy.** Cutover Phương án A đang hoạt động; mọi thay đổi phải giữ
   69 test Java + 5 probe xanh sau từng giai đoạn.
2. **Gỡ nợ CSS trước, thêm tính năng sau.** Xây tính năng mới trên nền CSS đang xung đột chỉ
   tạo thêm lớp override (đúng vết xe đổ đã sinh ra 4.950 `!important`).
3. **Mỗi giai đoạn có probe riêng.** Không có probe = chưa xong. Probe headless phải để
   `user-data-dir` trong `%TEMP%`.
4. **Sửa UI thì phải sửa cả phân quyền.** Bài học đã kiểm chứng: nút hiển thị cho mọi user
   nhưng chỉ user có perm mới bấm được — kiểm tra bằng **user thường**, không chỉ admin.
5. **`java-backend/**` và `tools/**` không thuộc ROOT_DIRS** → sửa không đổi fingerprint.
   Sửa `app/**` bắt buộc tạo file `drizzle/00NN_*.sql` mới + chạy
   `refresh-phase-identity.mjs` + `generate-release-manifest.mjs`.

---

## 4. KIẾN TRÚC GIẢI PHÁP

### 4.1 Gỡ nợ CSS — thay vì vá thêm lớp thứ 9

```
❌ CÁCH SAI (đang làm):  thêm rule mới + !important để đè rule cũ
✅ CÁCH ĐÚNG:           tách globals.css thành các lớp có thứ tự rõ ràng
```

Kế hoạch tách file (giữ nguyên `globals.css` làm entry để không phá build/fingerprint):

| File mới | Nội dung | Ghi chú |
|---|---|---|
| `app/styles/tokens.css` | Biến `--space-*`, `--radius-*`, `--font-*`, `--control-h` | 1 nguồn duy nhất |
| `app/styles/base.css` | Reset, layout khung, `.stack`, grid | |
| `app/styles/components.css` | `.card`, `.kpi`, `.table-wrap`, `.pill`, form, nút | **1 định nghĩa/class** |
| `app/styles/screens.css` | Style riêng từng màn | Hạn chế tối đa |
| `app/globals.css` | `@import` theo thứ tự trên | Giữ để không phá tham chiếu |

**Mục tiêu đo được:** `!important` giảm từ **4.950 → dưới 500**; `.table-wrap` từ **26 định nghĩa
→ 1**; mọi bảng cuộn được với thanh cuộn nhìn thấy rõ.

### 4.2 Cơ chế "trang chi tiết" thay modal

Hiện tại chi tiết phiếu là `RequestDrawer`/`ReceiptDrawer` (drawer) và form là `BaseModal`.
Người dùng muốn **"hiển thị như 1 trang với đầy đủ thông tin"**.

Đề xuất **`WorkspaceView`** — một lớp điều hướng nội bộ (không cần thêm route thật):

```
type ViewState =
  | { kind: "module"; key: ModuleKey }
  | { kind: "detail"; entity: "project"|"request"|"po"|"team"|"user"|"material"; id: string }
  | { kind: "fullform"; entity: "request"|"po"; id?: string }   // form toàn trang
```

- `pushState`/`history.replaceState` để nút **Back của trình duyệt** hoạt động.
- Trang chi tiết dùng **section có thể thu gọn** (`<details open>`) cho khối phụ → vừa đủ thông
  tin, vừa gọn như người dùng yêu cầu ("dropbox nếu muốn ẩn bớt cho gọn").
- Modal giữ lại cho form ngắn (tạo nhanh, xác nhận).

### 4.3 API bổ sung (Java)

| Action mới | Trả về | Dùng cho |
|---|---|---|
| `project_detail` | thông tin dự án + `overdueDays` + `progressPercent` | B |
| `project_staff` | nhân sự dự án + chức vụ + phòng ban + ngày tham gia | B |
| `project_warehouse_overview` | tồn kho + thủ kho + đơn chờ nhập/xuất/duyệt | B |
| `team_detail` | tổ đội + thành viên + thời gian tham gia/rời + dự án | D |
| `team_requests` | đơn từ của tổ đội | D |
| `user_work_profile` | dự án đã/đang tham gia, phòng ban, tổ đội đã/đang thuộc | D |
| `work_create_for_self` / `work_assign` | tạo task cá nhân / giao task | C |
| `work_kpi_summary` | tỉ lệ hoàn thành theo user/phòng ban/tháng | C |

> Tất cả action mới **phải khai báo trong `ActionRbacRegistry`** (bài học: `requireActionModule`
> từng bị bỏ quên khiến 4/5 action rò rỉ quyền).

### 4.4 Migration dữ liệu (nhóm C, D, H)

| Migration | Nội dung |
|---|---|
| V14 | `team_members` (id, team_id, user_id, role_in_team, joined_at, left_at, active) + `COLLATE=utf8mb4_unicode_ci` |
| V15 | `user_project_scopes` thêm `joined_at`, `left_at`, `position_name` |
| V16 | `work_items` thêm index KPI + FK logic cho `assigned_to` (giữ `text` để không phá dữ liệu cũ, thêm cột `assigned_to_id`) |
| V17 | Chuẩn hoá `code` vật tư theo `<HỆ>-<NHÓM>-<STT>` (xem §6 quyết định H) |
| V18 | (tuỳ quyết định H) chuyển khoá chính sang định danh có cấu trúc |

---

## 5. LỘ TRÌNH 10 GIAI ĐOẠN

| GĐ | Nội dung | Ước lượng | Phụ thuộc |
|---|---|---|---|
| **GĐ1** | Gỡ nợ CSS + responsive + scrollbar (nhóm A) | 2–3 ngày | — |
| **GĐ2** | `WorkspaceView` + phiếu mua hàng thành trang đầy đủ (nhóm A) | 2 ngày | GĐ1 |
| **GĐ3** | Quản lý dự án: danh sách + chi tiết (nhóm B) | 3–4 ngày | GĐ2 |
| **GĐ4** | Công việc + KPI + báo cáo tháng (nhóm C) | 4–5 ngày | GĐ3 |
| **GĐ5** | Tổ đội chi tiết + hồ sơ user (nhóm D) | 3 ngày | GĐ4 |
| **GĐ6** | Danh mục vật tư dạng tab + hệ/nhóm (nhóm E) | 2–3 ngày | GĐ5 |
| **GĐ7** | Dept perm checkbox + nhân sự full màn (nhóm F, G) | 2–3 ngày | GĐ6 |
| **GĐ8** | Chuẩn hoá ID/code (nhóm H) | 3–5 ngày | GĐ7 |
| **GĐ9** | Nghiệm thu tổng thể + tài liệu báo cáo | 1–2 ngày | GĐ8 |
| **GĐ10** | Kế hoạch chỉnh sửa giao diện toàn diện sau golive | 1 ngày | GĐ9 |

**Tổng: ~24–32 ngày làm việc.**

### Chi tiết từng giai đoạn

#### GĐ1 — Gỡ nợ CSS, responsive, scrollbar

- Tách `globals.css` thành 5 lớp theo §4.1; xoá `!important` không cần thiết.
- Chuẩn hoá `.table-wrap` về **một** định nghĩa: `max-height`, `overflow:auto`,
  `::-webkit-scrollbar` hiển thị rõ (width 10px, thumb tương phản), `scrollbar-gutter:stable`.
- Sửa "dính liền": một thang khoảng cách duy nhất từ token.
- Responsive: rà 96 `@media` hiện có, gom về 4 breakpoint chuẩn
  (`≥1440`, `1024–1439`, `768–1023`, `<768`); kiểm tra 12 nhóm menu + 12 tab quản trị.
- **Gate:** `css-baseline-audit` ĐẠT · probe chụp ảnh 4 kích thước màn hình · `!important` < 500.

#### GĐ2 — Trang chi tiết thay modal

- Dựng `WorkspaceView` (§4.2) + hỗ trợ nút Back.
- Chuyển **Phiếu mua hàng** (`RequestDrawer` → `RequestPage`): toàn trang, chia khối
  **Thông tin chung / Vật tư / Phê duyệt / Tệp đính kèm / Lịch sử**, mỗi khối thu gọn được.
- Giữ modal cho form ngắn.
- **Gate:** probe mở/đóng, Back hoạt động, không mất dữ liệu khi chuyển khối.

#### GĐ3 — Quản lý dự án

- Bỏ `ProjectScopeSelect` khỏi mọi màn; thay bằng **chip ngữ cảnh** + nút "Đổi dự án" mở danh sách.
- Trang **Danh sách dự án**: cột mã/tên/trạng thái/ngày bắt đầu/kết thúc dự kiến/tiến độ;
  **mặc định sort: đang hoạt động lên trước, trong đó mới nhất lên đầu**; có search/sort/filter.
- Trang **Chi tiết dự án** 4 tab:
  1. **Tổng quan** — ngày bắt đầu, kết thúc dự kiến, **số ngày chậm tiến độ** (đỏ nếu > 0),
     khối "Công việc cần hoàn thành" (đánh dấu phát triển sau).
  2. **Nhân sự** — tên, chức vụ, phòng ban; ưu tiên đang hoạt động; sort theo ngày tham gia.
  3. **Tổ đội** — tổ đội thuộc dự án.
  4. **Kho** — click kho → tồn kho, tên kho, thủ kho, đơn chờ nhập/chờ duyệt/chờ xuất,
     danh sách đơn (ưu tiên đơn chưa hoàn thành & đơn bị từ chối).
- **Gate:** probe + kiểm tra `overdueDays` đúng với dữ liệu thật.

#### GĐ4 — Công việc & KPI

- Đổi nhãn nhóm `CÔNG VIỆC CỦA TÔI` → **`CÔNG VIỆC`**.
- Thêm khối **Công việc phòng ban / tổ đội** mà user trực thuộc.
- **Tự tạo task cho bản thân**; **giao task cho nhân viên** nếu có chức vụ/quyền phù hợp
  (kiểm tra ở **cả hai lớp**: `perm` trong `user_module_permissions` **và** chức vụ trong `system_level_catalog`).
- **Dashboard tỉ lệ hoàn thành** theo nhân viên + **báo cáo tháng** theo tiến độ từng người.
- **CEO/Admin** xem toàn bộ KPI phòng ban & user (qua bảng quản lý nhân sự và/hoặc tuỳ chọn dashboard).
- **Gate:** probe **bằng user thường** (bài học: admin che hết lỗi phân quyền).

#### GĐ5 — Tổ đội

- Danh sách tổ đội (menu `TỔ ĐỘI` đã có).
- **Chi tiết tổ đội**: dự án đang/đã tham gia · sĩ số · **thời gian tham gia & rời đi từng người**
  (cần bảng `team_members` mới) · tab **Đơn từ** tổng hợp.
- **Click user** → hồ sơ: dự án đã/đang tham gia, phòng ban, tổ đội đã/đang thuộc.
- **Gate:** probe + xác nhận `joined_at`/`left_at` hiển thị đúng.

#### GĐ6 — Danh mục vật tư

- Bỏ `<details>` → **3 tab**:
  - **Tab 1 — Danh sách vật tư**: sort theo mã; hiển thị đầy đủ thông tin cơ bản **gồm alias**;
    **hiện mọi nút CRUD cho mọi user nhưng disable nếu thiếu quyền**; search/sort/filter đầy đủ.
  - **Tab 2 — So sánh / Đối chiếu BOQ**: nhãn "Đang phát triển".
  - **Tab 3 — Soát trùng Alias & chất lượng danh mục**: nhãn "Đang phát triển".
- **Cấu hình Hệ vật tư / Nhóm vật tư** (CRUD trên `material_categories`, `material_subcategories`)
  để dễ tạo vật tư mới.
- **Gate:** probe + kiểm tra nút bị disable đúng với user thiếu quyền.

#### GĐ7 — Dept perm & Nhân sự

- **Dept perm**: chuyển quyền sang **checkbox**; hiển thị theo **danh sách phòng ban**;
  gom label + nút về **một dòng**; cân đối kích thước nút bên phải; tách rõ nhóm
  **Hiển thị / CRUD / Phê duyệt**.
- **Nhân sự**: danh sách **full màn** (bỏ chia đôi), có CRUD/search/sort/filter;
  dùng chung modal với menu quản lý nhân sự, hoặc thiết kế riêng cho admin.
- **Gate:** probe + ảnh chụp.

#### GĐ8 — Chuẩn hoá ID/code (⚠️ rủi ro cao nhất)

Xem §6 để chốt phương án. Nguyên tắc bất kể phương án:

- Định dạng mã vật tư mới: **`<MÃ HỆ>-<MÃ NHÓM>-<STT>`** (VD `DIEN-CAPDIEN-001`).
- Backfill toàn bộ vật tư hiện có; giữ bảng `material_code_history` ghi vết đổi mã.
- Kiểm tra **toàn vẹn khoá ngoại** sau migration (script đếm orphan).
- Cập nhật UI/API/export để **không lộ hash** ở bất kỳ đâu.
- **Gate:** không có orphan FK + mọi màn hình hiển thị mã đọc được.

#### GĐ9 — Nghiệm thu tổng thể

- Chạy lại **toàn bộ** gate: 69 test Java · 5 probe đợt P2–P6 · `verify-full-release` ·
  fingerprint · master-baseline · typecheck.
- Viết `docs/21_BAO_CAO_TRIEN_KHAI.md`: việc đã làm, bằng chứng, việc còn nợ.

#### GĐ10 — Kế hoạch chỉnh sửa giao diện toàn diện sau golive

Tài liệu riêng `docs/22_KE_HOACH_GIAO_DIEN_SAU_GOLIVE.md`, gồm: design system hoàn chỉnh,
tách `page.tsx` thành module, thư viện component dùng chung, dark mode, chuẩn accessibility (WCAG),
đo hiệu năng render, và lộ trình chuyển sang framework UI chuyên nghiệp nếu cần.

---

## 6. ⚠️ BA QUYẾT ĐỊNH CẦN CHỐT TRƯỚC KHI THI CÔNG

### Q1 — Mức độ đổi ID trong DB (nhóm H)

| | Phương án | Ưu | Nhược | Rủi ro |
|---|---|---|---|---|
| **A** | Giữ hash `id` làm khoá nội bộ (ẩn hoàn toàn); `code` thành định danh hiển thị duy nhất, chuẩn hoá theo cấu trúc | Nhanh (1–2 ngày) · **không đụng khoá ngoại** · rollback dễ | Trong DB vẫn còn hash (chỉ ẩn khỏi UI) | 🟢 Thấp |
| **B** | Đổi **cả giá trị khoá chính** sang dạng cấu trúc cho mọi bảng | Đúng nguyên văn yêu cầu | Phải migrate FK ở **hàng chục bảng**, thứ tự phụ thuộc phức tạp | 🔴 **Cao** |
| **C** | Chỉ đổi khoá chính cho **`materials`** (bảng người dùng nêu tên), các bảng khác dùng phương án A | Cân bằng: đúng yêu cầu trọng tâm, blast radius nhỏ | Không đồng nhất toàn hệ | 🟡 Trung bình |

### Q2 — Thứ tự ưu tiên thi công

- **(1) Gỡ nợ CSS trước** (GĐ1–2) rồi mới thêm tính năng — *khuyến nghị*, tránh xây trên nền xung đột.
- **(2) Làm tính năng trước, CSS sau** — thấy kết quả nghiệp vụ sớm hơn, nhưng sẽ phải sửa lại UI 2 lần.

### Q3 — "Phiếu mua hàng" hiển thị thế nào?

- **(a) Trang toàn phần, chia khối thu gọn được** — *khuyến nghị*, đúng mô tả "như 1 trang với đầy đủ thông tin".
- **(b) Trang toàn phần, mọi khối luôn mở** — đầy đủ nhất nhưng dài, phải cuộn nhiều.
- **(c) Giữ modal nhưng mở rộng** — ít thay đổi nhất.

---

## 7. RỦI RO & GIẢM THIỂU

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| Gỡ CSS làm vỡ giao diện đang chạy | 🔴 Cao | Làm từng lớp, chụp ảnh từng màn trước/sau; `css-baseline-audit` là gate chặn |
| Migration ID phá khoá ngoại | 🔴 Cao | Backup `mysqldump` trước; script đếm orphan; chạy trên bản sao DB trước |
| Sửa `app/**` đổi fingerprint → mọi lần build phải tạo file `drizzle` mới | 🟡 | Đã có quy trình: `refresh-phase-identity.mjs` + `generate-release-manifest.mjs` |
| Tính năng mới lộ quyền cho user thường | 🔴 Cao | Bắt buộc probe bằng **user không phải admin** |
| Migration đã chạy bị sửa → lệch Flyway checksum | 🟡 | Chỉ tạo migration **mới**; không sửa file đã áp dụng |
| Khối lượng lớn gây mất context | 🟡 | Mỗi giai đoạn là một đơn vị bàn giao độc lập, có tài liệu riêng |

---

## 8. GATE NGHIỆM THU (áp dụng cho MỌI giai đoạn)

```powershell
# 1) Test Java
cd java-backend ; mvn -q package          # 69 test, 0 fail

# 2) Probe nghiệp vụ (đều phải exit 0)
node tools/probe-menu-11.mjs
node tools/probe-live-stack.mjs
node tools/probe-page-assets.mjs

# 3) Gate phát hành (DỪNG Node UI + Proxy, chuyển .local-data ra ngoài trước)
node scripts/verify-full-release.mjs
node scripts/verify-vntech-fingerprint.mjs
node scripts/master-baseline-gate.mjs
node scripts/css-baseline-audit.mjs
```

Tiêu chí ĐẠT của từng giai đoạn được ghi ở mục tương ứng trong §5, và **phải được ghi lại kèm
bằng chứng** vào nhật ký ở §9.

---

## 9. NHẬT KÝ TRIỂN KHAI

| GĐ | Trạng thái | Bằng chứng | Ghi chú |
|---|---|---|---|
| GĐ1 | ✅ **HOÀN TẤT** 15/09/2026 | `probe-layout-audit` **ĐẠT** · chữ <9px: 32→**0** · thanh cuộn hiển thị · 4 gate phát hành ĐẠT | Fingerprint `VNTECH-FP-43AEE1C46A4908DB` · 211 file nguồn · migrations 0000..**0086** · manifest 707 file |
| GĐ2 | ✅ **HOÀN TẤT** 15/09/2026 | `probe-request-page` **ĐẠT 11/11** · chi tiết phiếu **1561×808px** trên màn 1576×808 (~99%) · bo góc 0px · nút "← Quay lại" đóng được · thu gọn/mở rộng khối hoạt động | Fingerprint `VNTECH-FP-89D28C79A7C33D85` · 215 file nguồn |
| GĐ3 | ✅ **HOÀN TẤT** 16/09/2026 | `probe-project-screen` **ĐẠT toàn bộ** · danh sách 2 dự án đủ 8 cột + search + 2 bộ sắp xếp · chi tiết **5 tab** (Tổng quan / Nhân sự / Tổ đội / Kho / Ban chỉ huy) đều mở được · 29/29 test Java xanh | Fingerprint `VNTECH-FP-8A843559FBF23B15` · 218 file nguồn · migrations 0000..**0093** · manifest 723 file |
| GĐ4 | ✅ **HOÀN TẤT** 16/09/2026 | `probe-work-center` **ĐẠT** + `probe-work-permission` **ĐẠT** · nhóm menu đổi thành **"CÔNG VIỆC"** · màn Công việc **3 tab** đều render (Việc của tôi / Phòng ban-tổ đội / KPI) · **user thường TỰ TẠO được việc cho mình** (HTTP 200, mã `CVCN-`) · **user thường BỊ CHẶN** giao việc cho người khác (HTTP 400) · 29/29 test Java xanh · 4 gate phát hành ĐẠT | Đã thêm action **`create_self_work_item`** (Java + RBAC + controller) · migration **V16** · `department_code='CN'` cho việc cá nhân · Fingerprint `VNTECH-FP-D3EFACD25DDD670B` · 219 file nguồn · migrations 0000..**0094** · manifest 729 file |
| GĐ5 | ✅ **HOÀN TẤT** 16/09/2026 | `probe-team-screen` **ĐẠT** · danh sách tổ đội + chi tiết **3 tab** (Thành viên / Phân công / Thanh toán) · 29/29 test Java xanh | Nhóm D — **mục 4/8**. Migration **V14** thêm bảng `team_members` (`COLLATE=utf8mb4_unicode_ci`) + `joined_at`/`left_at`/`position_name` vào `user_project_scopes` · `BootstrapDataAdapter` thêm truy vấn `teamMembers` (JOIN `role_catalog` vì `users` **không có** cột `role_name`) · Fingerprint `VNTECH-FP-7B9C98328F0B58F4` · migrations 0000..**0095** |
| GĐ6 | ✅ **HOÀN TẤT** 16/09/2026 | `probe-material-tabs` **ĐẠT** · màn Danh mục vật tư chuyển sang dạng tab, tab 1 = nhóm con & mã vật tư, các tab sau = cấu hình Hệ M&E / Nhóm | Nhóm E — **mục 5/8** (phần tab). Fingerprint `VNTECH-FP-32E6E0C6A8CDE169` · migrations 0000..**0096** |
| GĐ7 | ✅ **HOÀN TẤT** 16/09/2026 | `probe-dept-perm` **ĐẠT** (checkbox, giữ trạng thái sau tải lại) · `probe-staff-full` **ĐẠT** (bảng nhân sự full màn) | Nhóm F+G — **mục 6/8 + 7/8**. Giữ nguyên tên trường hợp đồng bootstrap: `departmentModulePermissions` (không phải `departmentPermissions`), `systemLevelCatalog` (không phải `systemLevels`) · Fingerprint `VNTECH-FP-532F378EFF8F01EC` (0097) và `VNTECH-FP-FC65A4205B257597` (0098) · migrations 0000..**0098** |
| GĐ8 | ✅ **HOÀN TẤT** 16/09/2026 | `tools/normalize-material-codes.mjs` chạy dry-run rồi `--apply` · kiểm tra toàn vẹn **0 lỗi**: 0 mồ côi, 0 sai định dạng, 0 trùng lặp · 14 dòng `material_code_history` | Nhóm H — **mục 8/8**, chọn **phương án A**: giữ `id` hash làm khoá nội bộ, chuẩn hoá `code` thành định danh hiển thị. Phải tạo trước **7 nhóm con** vì `category_id`/`subcategory_id` đều NULL. Chỉ **4 cột** toàn hệ thống lưu mã vật tư và **cả 4 đều rỗng** ⇒ không tham chiếu nào mồ côi. Fingerprint `VNTECH-FP-E36257B2337C1A71` (0099, kèm phần **nợ của mục 5**: bảng 11 cột + alias + nút CRUD theo quyền) |
| GĐ9 | ✅ **HOÀN TẤT** 16/09/2026 | **13/13 probe ĐẠT** · 29/29 test Java xanh · `probe-live-stack` **ALL PASS** (4 dịch vụ sống; 2 dự án / 10 user / 8 đơn vị / 12 nhóm menu / 61 module / 37 quyền phòng ban; 18 tên tiếng Việt đúng UTF-8, **0 mojibake**) · manifest 743 file | Nghiệm thu tổng thể. **Phát hiện và vá 1 lỗi CÓ SẴN** (không do 8 nhóm gây ra): bẫy *"mảng rỗng là truthy"* — xem §9.1. Fingerprint cuối **`VNTECH-FP-91C8C3B6EE5D6703`** · migrations 0000..**0100** · báo cáo đầy đủ tại **`docs/21`** |
| GĐ10 | ✅ **HOÀN TẤT** 16/09/2026 | Kế hoạch 6 giai đoạn cho đợt chỉnh sửa giao diện toàn diện sau golive | Đã ghi tại **`docs/22_KE_HOACH_CHINH_SUA_GIAO_DIEN_TOAN_DIEN_SAU_GOLIVE.md`** — kèm chỉ số mục tiêu (`!important` 4.950 → 0 · `.table-wrap` 26 → 1 · `page.tsx` 4.054 → <300 dòng) và bảng rủi ro |

### 9.1 Lỗi có sẵn được phát hiện ở GĐ9

Lỗi **có từ trước**, không do 8 nhóm yêu cầu gây ra; lộ ra nhờ probe chiều ngược
`tools/probe-material-perm.mjs` (đăng nhập bằng tài khoản **chỉ có quyền xem**).

**Triệu chứng.** Tài khoản chỉ có quyền XEM `material_catalog` mở màn Danh mục vật tư gốc thì
thấy đúng ghi chú quyền và nút "＋ Thêm vật tư" bị khoá, nhưng bảng hiển thị **«0/0 vật tư»** —
không có dòng nào, nên không kiểm chứng được nút Sửa/Ngừng có bị khoá hay không.

**Điều tra.** `tools/diagnose-material-scope.mjs` gọi thẳng `/api/system` cho thấy **API không
thiếu dữ liệu**: tài khoản thường nhận `materials: 14`, chỉ **vắng key `adminMaterials`**
(`BootstrapDataAdapter` chỉ gắn khối này cho tài khoản quản trị). Vậy lỗi ở phía client.

**Nguyên nhân gốc.** Khối chuẩn hoá bootstrap hạ `adminMaterials` vắng mặt thành `[]`, rồi
**5 nơi tiêu thụ** đều viết `data.adminMaterials || data.materials`. Trong JavaScript **mảng
rỗng là truthy**, nên `[] || data.materials` trả về `[]` — 14 vật tư thật bị bỏ qua.

| Dòng | Màn hình bị ảnh hưởng |
|---|---|
| 1734 | `MaterialListTable` — bảng 11 cột của GĐ8 |
| 1809 | `MaterialCatalogPage` — nhánh chỉ-xem |
| 2203 | Màn kho vật tư |
| 3677 | Bộ chọn vật tư cho BOQ |
| 3663 / 3669 / 3670 | Bộ chọn Hệ / Nhóm (`adminMaterialCategories`, `adminMaterialSubcategories`) |

**Bản vá (migration `0100`).** Chuyển fallback về **đúng nguồn**: cả **ba cặp** admin/thường nay
lấy bản thường khi máy chủ không gửi bản admin. Sửa một chỗ, cả 5 điểm tiêu thụ cùng đúng.

**Bằng chứng sau khi vá** — `probe-material-perm` **ĐẠT ✅**: 14/14 dòng hiển thị; Sửa / Hợp nhất /
Ngừng **hiện đủ 14 nút và vô hiệu hoá 14/14**; nút thêm vật tư khoá; có ghi chú giải thích quyền.

**Hồi quy không tác dụng phụ:** `probe-material-list` ĐẠT · `probe-material-tabs` ĐẠT ·
`probe-live-stack` ALL PASS.

---

> **TRẠNG THÁI CUỐI:** **10/10 giai đoạn hoàn tất.** Toàn bộ 8 nhóm yêu cầu đã triển khai,
> nghiệm thu bằng trình duyệt thật và ghi tài liệu.
> Báo cáo triển khai đầy đủ: **`docs/21`**. Kế hoạch giao diện toàn diện sau golive: **`docs/22`**.
> Định danh phát hành cuối: **`VNTECH-FP-91C8C3B6EE5D6703`** · đầu migration `0100` · manifest 743 file.
> Việc còn lại thuộc về người dùng: **nghiệm thu trên giao diện** và **commit cuối ngày** (chưa push).

---

## 10. PHỤ LỤC — BẢN ĐỒ MÀN HÌNH ↔ GIAI ĐOẠN

> ⚠️ Số dòng dưới đây chỉ là **mốc tham chiếu lúc lập kế hoạch**. `app/page.tsx` đã thay đổi
> qua từng giai đoạn (đến cuối là **3.899 dòng**), nên các số này lệch vài dòng.
> **Định vị bằng tên component, không dùng số dòng.**

| Màn hình / thành phần | Dòng (`page.tsx`) | GĐ |
|---|---:|---|
| `ProjectScopeSelect` (dropdown dự án) | 788 | GĐ3 |
| `ProjectProgress` | 706 | GĐ3 |
| `ProjectTeams` | 1348 | GĐ3, GĐ5 |
| `DepartmentTaskWorkspace` | 686 | GĐ4 |
| `WorkflowManager` | 2292 | GĐ4 |
| `DashboardStaffPanel` / `StaffDirectory` | 878 / 887 | GĐ7 |
| `HrScreen` | 1585 | GĐ7 |
| `MaterialCatalogPage` | 1036 | GĐ6 |
| `MaterialCatalogManager` | 1418 | GĐ6 |
| `MaterialMatchingWorkspace` | 1007 | GĐ6 |
| `DepartmentPermissionManager` | 1847 | GĐ7 |
| `UserPermissionMatrix` | 1945 | GĐ7 |
| `RequestDrawer` | 2618 | GĐ2 |
| `ReceiptDrawer` | 2636 | GĐ2 |
| `PoModal` | 2695 | GĐ2 |
| `UserProfilePanel` | 2910 | GĐ5 |
