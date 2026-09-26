# TASK-090 — KP #96: DỌN "CÂY WORKSPACE THEO DỰ ÁN" (tính năng bị TẮT ÂM THẦM, chỉ còn mã chết)

**Ngày:** 18/09/2026 · **Nguồn:** người dùng trả lời qua Telegram: *«KP#96 dọn luôn cây đó»* (phương án **b**).
**Loại việc:** dọn mã chết + dọn CSS + viết lại phép kiểm (KHÔNG đổi nghiệp vụ, KHÔNG đổi schema).
**Bản chạy:** `VNTECH-FP-75F9244DC60F2FAD` → **`VNTECH-FP-E18ECD44A46D2229`**.

---

## 1. Phát hiện dẫn tới quyết định này (KP #96)

Hai nhánh render (desktop + mobile) của cây **"workspace theo dự án" (8 mục/dự án)** treo trên sentinel
`groupKey === "__site_command_tree_disabled__"`. Đo **3 nguồn nhóm menu** thì **không nguồn nào** gán khoá đó:

| Nguồn | Số nhóm | Có `__site_command_tree_disabled__`? | Có `project_management`? |
|---|---|---|---|
| MySQL `menu_group_catalog` | **12** | KHÔNG | KHÔNG |
| SQLite `menu_group_catalog` | **12** | KHÔNG | KHÔNG |
| Fallback trong mã `defaultMenuGroups` | **12** | KHÔNG | KHÔNG |

Và nhóm `project_management` còn bị **chính** `configuredMenuGroups()` **LỌC BỎ**
(`.filter((row) => String(row.groupKey) !== "project_management")`) ⇒ CSS `[data-nav-group="project_management"]`
cũng **không thể khớp**.

**Hệ quả dây chuyền (đo được, không suy đoán):**
`projectWorkspaceId` khởi tạo `null` và **chỉ** được gán bởi `activateProjectModule` — hàm **chỉ** được gọi từ
2 nhánh chết ⇒ toàn bộ "khoá ngữ cảnh dự án" (`lockedWorkspaceProject`, `activeProjectWorkspace`,
`selectedWorkspaceProject`, `activeWorkspaceItem`, hộp **"DỰ ÁN ĐANG LÀM VIỆC"**, 2 dải tab dự án) **chưa bao giờ chạy**.
Giao diện THẬT của nhóm «QUẢN LÝ DỰ ÁN» là **danh sách con phẳng** (`group.children.map`).

🔎 **Hai tệp test đang ĐO MÃ CHẾT (xanh vô nghĩa):** `tests/mobile-menu-interaction.test.mjs` kỳ vọng chuỗi
`groupKey==="site_command" ? activeSiteProjects.map` và `tests/project-navigation-consolidation.test.mjs` khớp
`className="nav-subgroup-items project-workspace-items"` — chuỗi **có** trong mã nhưng nằm **trong nhánh không chạy**.

---

## 2. Đã dọn

### 2.1. `app/page.tsx` — 3415 → **3386 dòng** (687.648 → 679.802 byte)

| # | Hạng mục | Ký tự gỡ |
|---|---|---|
| A1 | Nhánh render cây **desktop** | 1.807 |
| A2 | Nhánh render cây **mobile** | 1.336 |
| A3 | `activeSiteProjects` | 130 |
| B1/B2 | 2 state `projectWorkspaceId`, `openProjectNodeId` | 158 |
| B3 | `lockedWorkspaceProject` + đơn giản hoá `project` | 236 |
| B4/B5 | `setProjectWorkspaceId(null)` + **`activateProjectModule`** | 438 |
| B6 | effect reset khoá dự án (+ 2 dòng chú thích/`eslint-disable`) | 301 |
| B7 | `selectedWorkspaceProject`, `activeWorkspaceItem` | 269 |
| B8 | Tiêu đề màn → nhánh còn sống | 173 |
| B9 | `projectWorkspaceItems`, `activeProjectWorkspace`, `workspaceNeedTabs`, `workspaceFinanceTabs` | 543 |
| C1 | Hộp **"DỰ ÁN ĐANG LÀM VIỆC"** (giữ lại `ProjectScopeSelect`) | 313 |
| C2/C3 | 2 dải tab dự án trong thân render | 1.595 |
| D1 | Khối hằng số `PROJECT_WORKSPACE_ITEMS` + `PROJECT_WORKSPACE_CONTEXT_KEYS` → chú thích ghi lý do + bằng chứng | 1.143 |

**Tương đương hành vi (chứng minh được):** `project` (dự án đang chọn) trước đây là
`lockedWorkspaceProject || (…)`; toán hạng đầu **luôn `null`** ⇒ bỏ nó **không đổi giá trị**.

⚠️ **Lỗi đã gặp thật khi áp dụng:** bỏ `lockedWorkspaceProject || (` mà **quên dấu `)` đóng** ở cuối biểu thức
⇒ `tsc` báo **`TS1005: ',' expected`** (`page.tsx:461`). Cổng typecheck bắt ngay; đã vá và **ghi lại vào công cụ**
(`tools/don-kp96-cay-du-an.mjs` mục B3b) để lần chạy sau không tái phạm.

### 2.2. `app/globals.css` — 388.282 → **370.874 byte** · `!important` 4849 → **4550** · 2645 → **2555 dòng**

* Xoá **100 rule** + bỏ **60 selector** trong rule trộn (**−17.408 byte**, **−299 `!important`**).
* Họ lớp bị dọn: `nav-subgroup*`, `nav-child-dept*`, `nav-child-bch*`, `mobile-nav-subgroup*`,
  `mobile-nav-grandchildren`, `dept-chevron`, `project-workspace*`, `.mobile-nav-expanded`, và 2 họ
  `[data-nav-group="department_management"|"project_management"]`.
* **Đo trước khi dọn:** `0 chỗ` trong `app/` + `lib/` phát ra các lớp này ⇒ **toàn bộ họ CSS là mã chết**
  (đây cũng là điều cổng `verify:css-baseline` **buộc** phải dọn: phép kiểm "lớp CSS chết").
* Cổng nền R1.1.1 **không bị nới**: `!important`/dung lượng chỉ **giảm**, mốc BEGIN/END đúng 1 cặp,
  không có `@media` rỗng, không có nội dung sau mốc END.

### 2.3. Cổng & phép kiểm (ĐẢO sang CẤM — mạnh hơn, không nới lỏng)

| Tệp | Thay đổi |
|---|---|
| `scripts/css-baseline-audit.mjs` | Mở rộng danh sách **CẤM tái phát** cho cả 8 họ lớp + 2 họ thuộc tính của KP #89 + KP #96 |
| `scripts/preflight-source.mjs` | **11 marker cũ thuộc nhánh CHẾT** (8 mục/dự án, `project-context-lock`, `activateProjectModule`) → thay bằng marker **CÒN SỐNG** (danh sách con phẳng ×2 + `ProjectScopeSelect`) **và CẤM 6 tên mã chết quay lại** |
| `tests/mobile-menu-interaction.test.mjs` | Viết lại phép kiểm cây dự án theo **bất biến còn sống** + CẤM sentinel/cây chết; phép kiểm vùng chạm bỏ mốc "cấp cháu" (đã chết) và **CẤM** nó quay lại |
| `tests/project-navigation-consolidation.test.mjs` | 3/5 phép kiểm viết lại: 8 miền → **7 module dự án ánh xạ vào `site_command`**; "khoá ngữ cảnh" → **chọn dự án bằng `ProjectScopeSelect`** + CẤM khoá chết; lớp canonical → **`.nav-children`/`.mobile-nav-children`/`.mobile-nav-dashboard`** + CẤM 6 họ lớp chết |
| `tests/runtime-admin-boq-regression.test.mjs` | 2 phép kiểm viết lại: cấp con mobile (`mobile-nav-children`) + flyout thu gọn (`:hover>.nav-children`) + CẤM họ lớp chết |

### 2.4. Cổng MỚI `tools/probe-kp96-dead-project-tree.mjs` — **31/31 ĐẠT**

3 tầng: **(A)** tiền đề đọc 2 CSDL + fallback + dòng lọc/dòng ánh xạ trong mã; **(B)** đối chứng **dương**
(≥10 nhóm mỗi nguồn, thấy `site_command`) và **âm** (bộ dò phải bắt được mẫu cố ý / phải coi chuỗi sạch là sạch);
**(C)** đo đóng (0 dấu vết ở nguồn + CSS, cổng CSS đã CẤM, và **chống xoá quá tay**: danh sách con phẳng,
`ProjectScopeSelect`, `mobile-nav-children`, `data-nav-group`, 2 tệp test đã viết lại).

---

## 3. Bằng chứng kiểm chứng

| Phép kiểm | Trước | Sau |
|---|---|---|
| `tools/probe-kp89-dead-dept-branch.mjs` | 25/25 ĐẠT | **25/25 ĐẠT** (cập nhật: nhánh sentinel nay = 0 chỗ theo KP #96) |
| `tools/probe-kp96-dead-project-tree.mjs` (MỚI) | — | **31/31 ĐẠT** |
| `npx tsc --noEmit` | EXIT 0 | **EXIT 0** |
| `npx eslint app/page.tsx` | 0 error · 78 warning | **0 error · 78 warning** |
| `npm run verify:css-baseline` | ĐẠT (370.874 B? chưa) — xem ghi chú | **ĐẠT** · 2555 dòng · 370.874 byte · 4550 `!important` · **dead classes=0** · dead vars=0 |
| `npm run verify:master-baseline` | ĐẠT | **ĐẠT** · `!important=4550` · `css=370874B` |
| `npm run build` (+ preflight + fingerprint) | EXIT 0 | **EXIT 0** · BUILT ARTIFACT VALIDATION **ĐẠT** |
| `npm run test:regression` | **59/61** | **60/61** ⬆️ (1 đỏ còn lại: tên vai trò `thuky` — chờ người dùng chốt) |
| **Cổng ảnh 56 ảnh** | **ĐẠT** (sau khi chốt ảnh chuẩn theo quyết định KP #88) | **ĐẠT** — dọn mã chết **không đổi 1 điểm ảnh** |
| Định danh bản chạy | `VNTECH-FP-75F9244DC60F2FAD` | **`VNTECH-FP-E18ECD44A46D2229`** (MySQL + SQLite + manifest + build) |
| Đường phục vụ | — | UI `:8787` **200** · proxy `:9000` **200** · Java `:18081` **200** · bundle mới `page-DZp3i7Rr.js` |

**Kỳ vọng đã nêu TRƯỚC khi đo và đã đúng cả hai:**
1. Cổng ảnh **phải vẫn ĐẠT** (cây vốn không render) — nếu ảnh đổi thì đã có gì đó sai.
2. `test:regression` **phải tăng 59 → 60** (1 test đỏ của bộ cũ chính là test đo cây chết).

---

## 4. Bài học

1. **Test "xanh trên mã chết" là loại test nguy hiểm nhất:** nó không chỉ bỏ sót lỗi mà còn *chứng nhận sai*.
   Dấu hiệu nhận biết: literal mà test khớp **chỉ tồn tại trong một nhánh không thể chạy** — nay đã bịt bằng
   phép kiểm **CẤM** ở cả 3 tệp test + cổng CSS + preflight.
2. **Dọn mã chết thường kéo theo dọn CSS theo CƠ CHẾ, không theo cảm giác:** chính phép kiểm "lớp CSS chết"
   của cổng CSS là thứ *buộc* phải dọn, và nó cũng là thứ *xác nhận* đã dọn đủ (0 lớp chết).
3. **Khi một cổng bị "khoá cứng" vào tính năng chết, phải ĐẢO cổng, không xoá cổng:**
   `preflight-source.mjs` (11 marker) và 3 tệp test đều được **đảo thành CẤM** — nếu chỉ xoá thì mất luôn
   người gác.
4. **Kỳ vọng nêu trước khi đo là cách kiểm chứng chính mình:** hai kỳ vọng (ảnh không đổi · hồi quy tăng)
   đều đúng ⇒ hiểu biết về hệ thống khớp thực tế. Nếu một trong hai sai thì phải điều tra ngay.
5. **Sửa biểu thức `A || (…)` phải sửa CẢ dấu ngoặc đóng** — `tsc` bắt được nhưng chỉ sau khi công cụ đã ghi tệp;
   nay quy tắc này nằm ngay trong công cụ.

---

## 5. Việc kế tiếp

1. **`U-14`** — chuyển `drawer` chi tiết phiếu sang `EntityDetailModal` (công thức 6 bước đã soạn ở
   `U14-U11-KHAO-SAT.md` §1.4; cổng ảnh có bước `{click}` + đo khung nên **kiểm chứng được**).
2. **`U-16`** — áp dụng `PermissionGuard` cho ~50 chỗ kiểm quyền rải rác.
3. **`U-11` bước 4** — 3 màn lớn còn lại: `WorkCenter` · `Requests` · `BoqControl`.
4. **Chờ người dùng:** (a) tên vai trò `thuky` (test đỏ cuối cùng — 0045 vs 0079); (b) KP #90 xác nhận luồng
   3 nút vật tư; (c) các câu hỏi nghiệp vụ còn treo (D5 phạm vi dự án cho Owner bước 2 · `purchase_order_items.unit_price`).
