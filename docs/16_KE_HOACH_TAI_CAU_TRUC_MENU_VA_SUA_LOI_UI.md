# 16 — KẾ HOẠCH TÁI CẤU TRÚC MENU & SỬA LỖI UI

Ngày lập: 14/09/2026 · Người lập: Agent phát triển · Căn cứ: **tái hiện lỗi trên hệ thống đang chạy** (Java + MySQL + UI thật)

> Yêu cầu gốc của người dùng: tách chức năng "Quản lý phòng ban" thành menu riêng (nhiệm vụ, MEP, tài chính, hành chính–pháp chế), sửa lỗi font/tên dự án dài, bỏ dropdown dự án, phân quyền menu theo vai trò, và sửa 2 tab lỗi trong Quản trị hệ thống.
> Tài liệu liên quan: `docs/15` (phân tích chức năng), `docs/14` (cutover).

---

## 1. HIỆN TRẠNG MENU (đo từ UI đang chạy)

Sidebar hiện tại **chỉ có 7 mục**:

```
TỔNG QUAN ĐIỀU HÀNH
QUẢN LÝ PHÒNG BAN          ⌄   ← gom quá nhiều thứ vào 1 chỗ
QUẢN LÝ DỰ ÁN              ⌄
MUA HÀNG                   ⌄
KHO VẬT TƯ                 ⌄
DANH MỤC VẬT TƯ GỐC
QUẢN TRỊ HỆ THỐNG          ⌄
```

### 1.1 Toàn bộ 37 màn hình đã có trong hệ thống

Trích từ registry `active === "..."` trong `app/page.tsx`:

| Nhóm hiện tại | Màn hình (screen key → component) |
|---|---|
| **Tổng quan** (1) | `dashboard` → Dashboard |
| **Phòng ban** (28) | `project_progress`, `dept_plan_*`, `dept_project_*` (×2 nhóm), `construction`, `dept_finance_recovery`, `dept_legal_hr`, `dept_legal_labor`, `dept_legal_correspondence`, `dept_legal_documents`, `dept_legal_seal`, `dept_legal_benefits`, `dept_finance_documents`, `dept_finance_cashbank`, `dept_finance_site_cost`, `dept_finance_advance`, `dept_finance_payment_plan`, `material_norms`, `site_command`, `production`, `capital_recovery`, `requests`, `approvals`, `purchasing`, `supplier_catalog`, `receiving`, `delivered`, `warehouse_receipt`, `warehouse_issue` |
| **Kho & vật tư** (6) | `inventory`, `central_warehouse`, `material_catalog`, `boq`, `payments`, `teams`, `stocktake`, `reports` |

> **Vấn đề cốt lõi**: "QUẢN LÝ PHÒNG BAN" đang gom **28/37 màn hình** — gồm cả nhiệm vụ, MEP, tài chính, pháp chế, mua hàng, kho. Đây chính là điều người dùng muốn tách.

---

## 2. 🐛 LỖI ĐÃ TÁI HIỆN ĐƯỢC (có bằng chứng)

### 2.1 Lỗi Tab 4 & Tab 6 — CÙNG MỘT NGUYÊN NHÂN GỐC

**Tái hiện** (`tools/probe-admintab-bugs.mjs`, đăng nhập thật qua trình duyệt):

```
✅ TAB 1: Nhân sự & tổ chức        body=2485 · 0 lỗi
✅ TAB 2: Chức danh / vai trò      body=2162 · 0 lỗi
✅ TAB 3: Nhóm quyền nghiệp vụ     body=1028 · 0 lỗi
❌ TAB 4: Phạm vi dự án & kho      body=444  · 2 lỗi
   ↳ TypeError: Cannot read properties of undefined (reading 'filter')
✅ TAB 5..7: (không lỗi, nhưng body=444 ⇒ nội dung KHÔNG render)
```

**Nguyên nhân**: bootstrap của Java **thiếu trường `allModulePermissions`**, nhưng UI dùng nó ở **6 chỗ**, gồm:

| Vị trí | Dùng cho |
|---|---|
| `userPermissionSpec()` | Ma trận quyền khi cấp/thu |
| **`PersonalExceptionManager`** | **← TAB 6 "Ngoại lệ cá nhân"** |
| Bảng phân quyền chức năng | Tab 1 |
| Modal cấp quyền (×2) | `permissionFor()` |
| Quyền theo module | Toàn hệ thống |

⇒ `data.allModulePermissions.filter(...)` trên `undefined` ⇒ **React error boundary** ⇒ trang lỗi & tự tải lại. **Đúng như người dùng mô tả.**

**Truy vết gốc**: JS `system-route.mjs` trả **cả hai** `modulePermissions` *và* `allModulePermissions`; Java chỉ `data.put("modulePermissions", …)`.

### 2.2 Phát hiện rộng hơn: **29 trường bootstrap bị thiếu**

Kiểm tra thật (`information_schema` không dùng, so trực tiếp response):

```
THIẾU 29/30 trường so với JS:
allModulePermissions, approvalStages, centralInventory, centralReturns, companyAvailability,
emailOutbox, emailRecipients, emailSettings, engineRoleProfiles, formFieldConfigs, materialAliases,
productIdentity, projectAccessAll, serverInfo, stockReconciliations, supplySteps, teamSettlements,
trustStatus, uiDisplaySettings, userWarehouseScopes, workflowAssignments, workItemEvents,
boqChangeHistory, boqImportBatches, businessRoleGroupScopes, adminMaterials, adminMaterialCategories,
adminMaterialSubcategories, constructionDailyLogItems
```

**Hệ quả**: mỗi trường thiếu là một **lỗi trắng trang tiềm ẩn** khi UI chạm tới. Tab 4/6 chỉ là 2 trường hợp đã lộ.
**Lưu ý tên khác biệt**: UI dùng `approvalStages` (20 chỗ) nhưng Java trả `approvalStageCatalog` (UI **không dùng tên này** ở đâu).

### 2.3 Lỗi font / tên dự án dài bị chồng chéo

CSS hiện tại (`.page-project-select`, `globals.css` dòng 1333):

```css
.page-project-select{display:grid;grid-template-columns:auto minmax(280px,520px) minmax(0,1fr);…}
```

Cột giữa bị **ghim cứng 280–520 px** và `white-space:nowrap` ở nhãn ⇒ tên dự án dài **tràn/chồng** lên cột bên cạnh, không có `text-overflow: ellipsis`.
**Cần**: `min-width:0` + `overflow:hidden` + `text-overflow:ellipsis` + `title=` để xem đầy đủ.

---

### 2.4 🔴 LỖI BẢO MẬT: người dùng thấy TOÀN BỘ dự án dù không được gán

**Kiểm chứng thật** (`tools/probe-project-visibility.mjs`):

```
Tổng dự án active: 2 · dự án gán cho user này: 0
bootstrap engineer:
  projects      = 2   ← đáng lẽ phải là 0
  adminProjects = 0
  projectAccessAll = undefined
🐛 XÁC NHẬN: user KHÔNG được gán dự án vẫn THẤY TOÀN BỘ dự án
  dự án lộ: DA-MAU-01, PRJ-DEMO-01
```

**Nguyên nhân** — `BootstrapDataAdapter.java` dòng 39–43:

```java
List<Map<String, Object>> projects = query("""
        SELECT id,code,name,... FROM projects WHERE status='active' ORDER BY code""");
data.put("projects", projects);       // ← KHÔNG lọc theo quyền
```

Trong khi JS (`system-route.mjs` dòng 549) lọc đúng:

```js
const visibleProjects = isAdmin(user) ? projects
    : projects.filter((project) => allowed.has(String(project.id)));
const projectAccessAll = isAdmin(user);
```

⇒ **Đúng yêu cầu C2 của bạn nhưng Java chưa có**: admin xem tất cả, user level thấp **chỉ** xem dự án được phân công. Hiện tại **mọi user thấy mọi dự án** (kèm `projectAccessAll` bị thiếu).

---

## 3. KẾ HOẠCH TÁI CẤU TRÚC MENU (theo đúng yêu cầu)

### 3.1 Cấu trúc menu đề xuất — từ 7 mục thành 11 mục

```
1. TỔNG QUAN ĐIỀU HÀNH                              (giữ nguyên)
2. CÔNG VIỆC CỦA TÔI / NHIỆM VỤ        ★ MỚI   ← task & to-do, theo dõi tiến độ, giao việc, hiệu suất
3. QUẢN LÝ DỰ ÁN                       ★ SỬA   ← bỏ dropdown, thêm cột dự án, phân quyền
4. MEP                                 ★ MỚI   ← Showdrawing & trình duyệt | BOQ & Bóc tách
5. MUA HÀNG                            (giữ, gọn lại)
6. KHO VẬT TƯ                          (giữ)
7. DANH MỤC VẬT TƯ GỐC                 (giữ)
8. TÀI CHÍNH – KẾ TOÁN                 ★ MỚI   ← module riêng để phát triển sau
9. HÀNH CHÍNH – PHÁP CHẾ & NHÂN SỰ     ★ MỚI   ← tách theo nghiệp vụ, đơn từ riêng
10. BÁO CÁO                            ★ MỚI
11. QUẢN TRỊ HỆ THỐNG                  (giữ)
```

### 3.2 Bản đồ di chuyển màn hình (screen key giữ nguyên — chỉ đổi menu)

> **Nguyên tắc**: **không đổi `screen key`** vì đã gắn với `ActionRbacRegistry` và quyền module. Chỉ đổi **nhóm menu** ⇒ an toàn với phân quyền và không phá backend.

| Menu mới | Màn hình đưa vào | Ghi chú |
|---|---|---|
| **2. Công việc của tôi** | `dept_plan_tasks`, `dept_plan_assign`, `dept_plan_alerts`, `dept_plan_tender`, `dept_project_tasks`, `dept_project_assign`, `dept_project_tender` | Mở rộng thành **task/to-do list** (mục 3.3) |
| **3. Quản lý dự án** | `project_progress`, `construction`, `teams`, `site_command` | Bỏ dropdown; phân quyền theo level |
| **4. MEP** | `boq` (→ **BOQ & Bóc tách**), *Showdrawing* (mới), `material_norms`, `production` | Tách khỏi "phòng ban" |
| **5. Mua hàng** | `requests`, `approvals`, `purchasing`, `supplier_catalog`, `receiving`, `delivered` | Giữ |
| **6. Kho vật tư** | `inventory`, `warehouse_receipt`, `warehouse_issue`, `stocktake`, `central_warehouse` | Giữ |
| **7. Danh mục vật tư gốc** | `material_catalog` | Giữ |
| **8. Tài chính – Kế toán** | `dept_finance_payment_plan`, `dept_finance_advance`, `dept_finance_site_cost`, `dept_finance_cashbank`, `dept_finance_documents`, `dept_finance_recovery`, `payments`, `capital_recovery` | **Module riêng để phát triển sau** |
| **9. Hành chính – Pháp chế** | `dept_legal_hr`, `dept_legal_labor`, `dept_legal_correspondence`, `dept_legal_documents`, `dept_legal_seal`, `dept_legal_benefits` | Tách **đơn từ** riêng theo nghiệp vụ |
| **10. Báo cáo** | `reports` | Mới tách |

### 3.3 Menu "Công việc của tôi" — mở rộng thành quản lý công việc

Hiện có `work_items` + `work_item_events` + `task_notifications` trong DB và 5 action (`create_work_item`, `update_work_item_progress`, `update_work_item_status`, `reassign_work_item`, `mark_task_notification_read`).

**Cần bổ sung để đạt mục tiêu bạn nêu:**

| Mục tiêu | Cần thêm |
|---|---|
| Theo dõi tiến độ | ✅ đã có `progress`; cần **kanban/gantt** hiển thị |
| Giao việc cho nhân viên | ✅ có `reassign_work_item`; cần **giao nhiều người + hạn** |
| Quản lý công việc | Cần **danh sách của tôi** (việc tôi nhận) vs **việc tôi giao** |
| Hiệu suất làm việc | ⚠️ **CHƯA CÓ** — cần bảng thống kê: việc hoàn thành/trễ/theo người, theo kỳ |

### 3.4 Sửa lỗi font & bỏ dropdown dự án

**a) Sửa tràn tên dự án dài** (`.page-project-select`):
```css
.page-project-select strong{
  min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
}
```
+ gắn `title={p.code + " · " + p.name}` để hover xem đầy đủ.

**b) Bỏ dropdown ở menu Quản lý dự án**:
Theo yêu cầu — **chỉ hiển thị trong bảng** Quản lý dự án, không đặt dropdown chọn dự án ở thanh ngữ cảnh của menu này.
⇒ Sửa `PageProjectContext` để có chế độ `hideSelector` khi `active === "project_management"`.

**c) Phân quyền menu theo vai trò/level** — ⚠️ **Java CHƯA CÓ, đã kiểm chứng (mục 2.4)**
```
admin                → toàn bộ dự án
user có scope        → chỉ dự án trong user_project_scopes
user không scope     → rỗng
```
Hiện `BootstrapDataAdapter` trả **tất cả** dự án cho mọi user; cần port đúng logic lọc của JS (`visibleProjects` + `projectAccessAll`).

---

## 4. THỨ TỰ THỰC HIỆN

### GIAI ĐOẠN A — Sửa lỗi chặn (2–3 ngày) 🔴 LÀM TRƯỚC
| # | Việc | Kết quả |
|---|---|---|
| A1 | Bổ sung **29 trường bootstrap thiếu** (trọng tâm `allModulePermissions`, `approvalStages`) | Tab 4 & 6 hết lỗi; loại bỏ loạt lỗi trắng trang tiềm ẩn |
| A2 | Test hồi quy: bấm đủ **7 tab** không lỗi | Chốt lại bằng `probe-admintab-bugs.mjs` |
| A3 | Sửa **tràn tên dự án dài** (ellipsis + title) | Đọc được tên, không chồng chéo |
| A4 | 🔴 **Lọc dự án theo quyền** (`visibleProjects` + `projectAccessAll`) | User không được gán **không còn thấy** dự án người khác (lỗi bảo mật mục 2.4) |

### GIAI ĐOẠN B — Tái cấu trúc menu (3–5 ngày) 🟠
| # | Việc |
|---|---|
| B1 | Tạo nhóm menu mới: **Công việc**, **MEP**, **Tài chính – Kế toán**, **Hành chính – Pháp chế**, **Báo cáo** |
| B2 | Di chuyển 28 màn hình khỏi "Quản lý phòng ban" vào đúng nhóm (giữ nguyên `screen key`) |
| B3 | Cập nhật `module_catalog` + `menu_group_catalog` (seed V3) cho khớp |
| B4 | Sửa `ActionRbacRegistry` nếu module đổi tên (giữ tương thích ngược) |

### GIAI ĐOẠN C — Phân quyền & dropdown (2 ngày) 🟠
| # | Việc |
|---|---|
| C1 | Bỏ dropdown dự án ở menu Quản lý dự án |
| C2 | (đã gộp vào **A4**) Phân quyền hiển thị dự án theo vai trò |
| C3 | Ẩn/hiện menu theo `modulePermissions` (phụ thuộc A1) |

### GIAI ĐOẠN D — Nâng "Công việc của tôi" thành quản lý công việc (1–2 tuần) 🟡
| # | Việc |
|---|---|
| D1 | Kanban + danh sách "Việc của tôi" / "Việc tôi giao" |
| D2 | Giao việc cho nhiều người, hạn, mức ưu tiên |
| D3 | **Bảng hiệu suất**: việc xong/trễ/tồn theo người & theo kỳ |
| D4 | Thông báo trong ứng dụng + email (phụ thuộc G2 của docs/14) |

### GIAI ĐOẠN E — Module Tài chính & MEP mở rộng (sau) 🟡
- Tài chính: báo cáo công nợ, dòng tiền, đối chiếu ngân hàng
- MEP: **Showdrawing & trình duyệt bản vẽ** (cần thiết kế mới — hiện chưa có entity)

---

## 5. RỦI RO

| # | Rủi ro | Giảm thiểu |
|---|---|---|
| 1 | Đổi `module key` phá phân quyền đã cấp | **Giữ nguyên screen key**; chỉ đổi nhóm hiển thị |
| 2 | Bổ sung 29 trường thiếu có thể lộ lỗi khác | Làm từng nhóm, test bootstrap sau mỗi nhóm |
| 3 | Menu mới cần seed `module_catalog` (đang rỗng!) | **Phụ thuộc `docs/15` mục 1.3** — phải sinh V3 seed trước |
| 4 | Lỗi phân quyền module đang vô hiệu (docs/15 mục 2.5) | Nếu không sửa, phân quyền menu chỉ là "ẩn hiện" chứ không chặn thật |

> ⚠️ **Phụ thuộc quan trọng**: `module_catalog` hiện **RỖNG** (0 dòng) nên menu phân quyền **chưa có nền tảng dữ liệu**. Muốn làm C2/C3 đúng nghĩa phải **sinh V3 reference seed** (docs/15 mục 1.3) trước.

---

## 6. BẰNG CHỨNG TÁI LẬP

```powershell
# Dịch vụ phải chạy: MySQL + Java :18081 + Node :8787 + Proxy :9000
node tools/fix-login.mjs admin "Vntech@2026"      # đảm bảo đăng nhập

# 1) Tái hiện lỗi tab 4 & 6
node tools/probe-admintab-bugs.mjs http://127.0.0.1:9000

# 2) Liệt kê cấu trúc menu + 37 màn hình
node tools/probe-menu-structure.mjs http://127.0.0.1:9000

# 3) Đếm trường bootstrap thiếu
node tools/analyze-features.mjs

# 4) XÁC NHẬN lỗi bảo mật: user không gán dự án vẫn thấy hết
node tools/probe-project-visibility.mjs
```

**Người quyết định**: cần bạn xác nhận thứ tự A → B → C → D → E trước khi thực hiện.
