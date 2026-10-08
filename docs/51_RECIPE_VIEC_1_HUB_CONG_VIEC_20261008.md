# RECIPE VIỆC 1 (dán được) + CHỐT TEST-IMPACT — theo **tiền lệ VÀNG nhóm «Kho»**

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · Nối tiếp `docs/49` (kế hoạch) + `docs/50` (test-impact)
Mục đích: việc 1 (gom 5 mục menu → **1 hub «Công việc»**, Dashboard lên đầu) là việc **rủi ro nhất** ⇒ khi được phép làm phải **máy móc, ⛔ không phải quyết định gì thêm**.

---

## 1. ⭐ TIỀN LỆ VÀNG — nhóm «Kho» **đã gom 7 → 1** và **Dashboard thành tab đầu của hub**
| Bằng chứng | Nội dung |
|---|---|
| `tests/mt3-ui-29-view-collision-diagnostic.test.mjs:52-56` | *«CẬP NHẬT **06/10/2026** (`ERP-SESSION-02` · `TASK-226`): nhóm `warehouse` đã **GOM 7 → 1 mục** và mục «Kho vật tư» ⛔ **KHÔNG còn `view: "dashboard"`** (dashboard nay là **TAB ĐẦU** của tab «KHO» trong hub `app/screens/Inventory.tsx`)»* |
| `lib/menu-helpers.ts:369-383` | `HUB_TAB_GROUP_KEYS` — luật: **nhóm phải ≥2 mục mới được thành dải tab**; `my_work` vào danh sách **nhờ «5 mục»** (`:371`, `:377`) |
| `tests/mt3-ui-25-all-groups-tabs.test.mjs:41-59` | Khoá cứng luật: ① nhóm trong `HUB_TAB_GROUP_KEYS` phải **≥2 mục** ② *«⛔ KHÔNG nhóm 1-mục nào được bật»* |
| `app/screens/WorkCenter.tsx:297-299` | `WorkCenter` **đã có** dải tab nội bộ (`project-scope-tabs` + `WORK_TABS`) ⇒ làm được y như `Inventory.tsx` |

⇒ ⭐ **Việc 1 của anh = LẶP LẠI đúng khuôn đã được user duyệt cho nhóm Kho** (⛔ không phải thiết kế mới) ⇒ rủi ro **thấp hơn** `docs/49` đánh giá ban đầu, miễn **làm đủ 5 bước** dưới đây.

---

## 2. 🔧 RECIPE VIỆC 1 — **5 bước, mã dán được**

### Bước 1 — `lib/menu-helpers.ts:125-133`: 5 mục → **1 mục hub**
```ts
// USER 08/10/2026 — GOM 5 MỤC «Công việc» THÀNH 1 HUB; Dashboard là TAB ĐẦU của `WorkCenter`.
// Khuôn y hệt nhóm «Kho» (ERP-SESSION-02 · TASK-226 gom 7 → 1; dashboard = tab đầu của Inventory.tsx).
// ⛔ GIỮ NGUYÊN chuỗi khai báo KIỂU (test `t10-approval-center.test.mjs:78` khoá chuỗi này).
const workMenuItems: { key: string; label: string; groupKey: "my_work"; view: WorkMenuView; permissionKeys: ModuleKey[] }[] = [
  { key: "work_hub", label: "Công việc", groupKey: "my_work", view: "dashboard",
    // ⚠️ PHẢI là **HỢP permissionKeys của cả 5 mục cũ** — vì `page.tsx:500-501` ẩn mục khi
    //    user ⛔ không xem được khoá nào (`if (permissionConfigured && !viewable) return []`)
    //    ⇒ để thiếu khoá là **nhân viên MẤT LUÔN MENU** (lỗi im lặng, rất khó truy).
    permissionKeys: ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign",
                     "dept_project_assign", "dept_plan_kpi", "dept_project_kpi"] },
];
```
⚠️ `permissionKeys` gộp 6 khoá: tasks (Cá nhân) · assign (Phòng ban/Giao việc) · kpi (Dashboard) — **đúng bằng hợp 5 mục cũ** (⛔ không thêm khoá mới, ⛔ không bịa module).

### Bước 2 — `lib/menu-helpers.ts:369-383`: **RÚT `"my_work"` khỏi `HUB_TAB_GROUP_KEYS`**
```ts
  "purchasing",
  // ⛔ RÚT 08/10/2026: `my_work` nay chỉ còn **1 mục** (`work_hub`) ⇒ theo luật «nhóm ≥2 mục mới
  //    thành dải tab» (`:363-368`) + test `mt3-ui-25` ①② ⇒ ⛔ KHÔNG được để trong danh sách này.
  //    Dải tab của hub nay nằm TRONG `WorkCenter.tsx` (`WORK_TABS`, Dashboard đầu) — y khuôn `Inventory.tsx`.
  "warehouse",
```
⚠️ Phải sửa **cả chú thích** `:364` (`my_work` 10) và `:371` (*«`my_work` 5»*) — nếu để lại số cũ thì tài liệu nói sai sự thật (bài học `SESSION_C`).

### Bước 3 — `lib/menu-helpers.ts:134-136` `legacyWorkMenuKeys`: ⛔ **KHÔNG đổi**
4 khoá module (`dept_plan_tasks` · `dept_project_tasks` · `dept_plan_assign` · `dept_project_assign`) **vẫn sống** cho quyền/tiêu đề/tìm kiếm/nhánh render. ⚠️ `tests/w01-warehouse-menu.test.mjs:132-134` chỉ áp luật cho **`legacyWarehouseMenuKeys`** ⇒ ⛔ không ảnh hưởng.

### Bước 4 — `app/screens/WorkCenter.tsx`: dải tab mới, **Dashboard ĐẦU**
| Dòng | Hiện tại | Mới |
|---|---|---|
| `:92` `WORK_TABS` | `["Cá nhân","Dự án","Phòng ban","Giao việc","Dashboard","Báo cáo"]` | `["Dashboard","Danh sách công việc","Được giao","Phòng ban/ Tổ đội","Giao việc","Dự án","Báo cáo"]` *(theo `docs/49` §2.1 — ⚠️ chờ user xác nhận thứ tự)* |
| `:96` `WORK_TAB_OF_VIEW` | `{ personal:0, department:2, assign:3, kpi:4, dashboard:4, reports:5 }` | `{ dashboard:0, personal:1, assigned:2, department:3, assign:4, project:5, kpi:0, reports:6 }` ⚠️ **giữ alias `kpi`** (test `t09:165` bắt giữ để tương thích ngược) |
| tab render | `{tab === 0 && …}` … `{tab === 5 && …}` | cập nhật **chỉ số** mọi nhánh `tab === n` (**⛔ dễ sót nhất** — 6 nhánh) |

### Bước 5 — `app/page.tsx`: ✅ **ĐÃ XÁC MINH** (⛔ không còn ẩn số)
**`activateModule` (`:598-609`) — đã đọc**:
```ts
setWorkView(view === "personal" || view === "department" || view === "assign" || view === "kpi" || view === "reports" || view === "dashboard" ? view : null);  // :602
setWarehouseMenuView(view === "dashboard" ? view : null);   // :603
setSupplierPartnerView(view === "supplier" || view === "partner" ? view : null);
setAllocateReturnView(view === "list" ? view : null);
const activeItem = allowedModules.find(item => item.key === next);  // :607
setSearch(""); … setActive(next);                                   // :608
```
⇒ ✅ **`view:"dashboard"` ĐƯỢC set** vào `workView` ⇒ hub render đúng · ✅ **`page.tsx` ⛔ KHÔNG cần sửa gì cho điều hướng** (cơ chế y hệt mục `work_dashboard` hiện tại).
📌 Ghi nhận (⚠️ **có sẵn từ trước, ⛔ không do việc 1 gây ra**): `:603` set `warehouseMenuView="dashboard"` cho **mọi** `view==="dashboard"` — hôm nay mục `work_dashboard` **đã** truyền `"dashboard"` (`menu-helpers.ts:128`) nên hành vi này **⛔ không đổi**; `tests/mt3-ui-29` chỉ kiểm *khai báo* `item.view` nên ⛔ không bắt được nhánh này (đã ghi nhận, ⛔ không mở rộng phạm vi).

### 🔴 Bước 6 (MỚI — **BẮT BUỘC**, nếu ⛔ bỏ qua thì hub **⛔ KHÔNG mở Dashboard**)
**`workCenterViewFor` (`app/page.tsx:447-457`) kiểm `active` TRƯỚC `view`:**
```ts
function workCenterViewFor(view, active) {
  if (active === "dept_plan_tasks" || active === "dept_project_tasks") return "personal";   // :448  ⚠️ CHẶN TRƯỚC
  if (view === "dashboard") return "dashboard";                                            // :452
  …
}
```
⚠️ **CÁI BẪY**: mục hub có `moduleKey` = **khoá quyền ĐẦU TIÊN xem được** (`page.tsx:499-503`). Nhân viên thường xem được `dept_plan_tasks` ⇒ `active = "dept_plan_tasks"` ⇒ rơi vào `:448` ⇒ trả **`"personal"`** ⇒ **bấm «Công việc» mở tab Cá nhân, ⛔ KHÔNG phải Dashboard** (đúng triệu chứng «Dashboard lên đầu mà ⛔ không vào Dashboard»).

**SỬA (tối thiểu, an toàn) — đảo thứ tự 2 nhánh:**
```ts
  if (view === "dashboard") return "dashboard";                                            // ⭐ ĐẶT LÊN ĐẦU
  if (active === "dept_plan_tasks" || active === "dept_project_tasks") return "personal";
```
- ✅ **Vì sao an toàn**: nhánh `view==="personal"` (mục «Cá nhân» cũ) ⛔ **không** khớp điều kiện mới ⇒ hành vi cũ giữ nguyên; nhánh mới chỉ đổi hành vi cho **đúng tổ hợp mới** (`view==="dashboard"` + `active` ∈ tasks).
- ➕ **Phòng thủ 2 lớp**: xếp `dept_plan_kpi` **đầu** mảng `permissionKeys` của mục hub (Bước 1) ⇒ nhân viên có quyền KPI thì `active` ⛔ không rơi vào nhánh tasks.
- ⚠️ **Phải kiểm `tests/t01-work-menu.test.mjs:104-111`** (test đọc **mã hàm** `workCenterViewFor`, có `assert.doesNotMatch(fn, /"assign"/)`) ⇒ sau khi đảo nhánh **phải chạy lại** và cập nhật nếu chuỗi bị lệch.

---

## 3. 📋 CẬP NHẬT TEST — chuỗi **old → new** (khi thi hành, ⛔ không sửa trước mã)

| Tệp · dòng | OLD | NEW |
|---|---|---|
| `t01-work-menu.test.mjs:98` | `const WORK_TABS = ["Cá nhân", "Dự án", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"];` | dải 7 tab mới (Bước 4) |
| `t01:24-28` | 5 mục (Cá nhân/Phòng ban/Giao việc/Dashboard/Báo cáo) | **1 mục** `work_hub` (Bước 1) |
| `t01:111` | view `"assign"` ⛔ không mở `WorkCenter` | ⚠️ quyết định: **giữ** (hub nay mở bằng `view:"dashboard"`; `DepartmentTaskWorkspace` vẫn là màn của mục menu nhóm khác) — kiểm lại chuỗi `workCenterViewFor` |
| `p5-01-work-menu-dashboard.test.mjs:25` | `deepEqual(keys, [5 khoá])` | `["work_hub"]` |
| `p5-01:42` | `view = "personal"` (mặc định) | `view = "dashboard"` |
| `p5-01:29-38` | `view "dashboard"` trỏ **đúng index** của `WORK_TABS` | ✅ **tự đúng** (test đọc `WORK_TABS` thật) — chỉ cần «Dashboard» tồn tại |
| `t07:157` · `t08:144` · `t09:163` | chuỗi 6 tab khớp **đúng 1 lần** | chuỗi 7 tab mới |
| `t09:165` | giữ `kpi: 3` | giữ alias `kpi` với **index mới** (0) |
| `mt3-ui-25:41-59` | `my_work` ∈ `HUB_TAB_GROUP_KEYS` (⇒ phải ≥2 mục) | ⭐ **tự xanh** sau Bước 2 (rút `my_work`) — ⚠️ **kiểm lại** `REAL_SOURCES.my_work` (`:33`) nếu `workMenuItems` còn dùng ở đâu khác |
| `mt3-ui-29:64-69` | mọi mảng menu có nhãn **không trùng** | ✅ xanh (1 nhãn) · ⚠️ `:50-62` chỉ kiểm va chạm `view` của nhóm **Kho** ⇒ ⛔ không ảnh hưởng |
| `t10:78` · `t01:33-35` · `t01:90` | khớp **chuỗi khai báo kiểu** + cơ chế `flatMap` | ✅ **giữ được** nếu ⛔ không đổi kiểu/tên biến (Bước 1 giữ nguyên) |

### 3.1 ⚠️ HAI CÂU HỎI PHẢI CHỐT KHI THI HÀNH (⛔ không đoán)
1. **Nhãn mục hub — ✅ ĐÃ CÓ KHUÔN**: tiền lệ Kho đặt mục con là **`label: "Kho vật tư"`** (`menu-helpers.ts:171`) ⇒ ⭐ khuôn chấp nhận **nhãn mô tả màn**, ⛔ không nhất thiết trùng tên nhóm cha. 👉 Đề xuất cho việc 1: `label: "Công việc"` *(theo đúng từ của user)* — ⚠️ nếu tên nhóm cha trong `menu_groups` **cũng** là «Công việc» thì sidebar hiện *«Công việc → Công việc»*; khi thi hành **kiểm nhanh** `menu_groups` và nếu trùng thì dùng `"Tổng quan công việc"` (⛔ vẫn 1 mục, ⛔ không ảnh hưởng test nào khác).
2. **⭐ Khuôn `key` của mục hub**: tiền lệ dùng **`key: "warehouse_hub"`** (`:171`) ⇒ đề xuất **`key: "work_hub"`** cho đồng bộ (⚠️ `key` là **định danh menu**, ⛔ không phải khoá module ⇒ ⛔ không cần khai trong `module_catalog`).
3. **Thứ tự 7 tab** (`docs/49` §2.1) + **Kanban/Cây** (giữ dạng «chế độ xem» hay bỏ) — ⏳ chờ user (`docs/49` §6).

---

## 4. KẾT LUẬN
- ⭐ Việc 1 **có tiền lệ đã duyệt** ⇒ recipe 5 bước ở trên là **dán được**, ⛔ không cần thiết kế lại.
- ⚠️ **2 điểm phải đọc khi thi hành** (⛔ tôi ⛔ không khẳng định thay): khối `activateModule` (`page.tsx:598-609`) · khuôn nhãn của nhóm Kho (`menu-helpers:162-188`).
- 📌 **Ràng buộc giữ nguyên**: chỉ thi hành khi **shell sống** (để chạy `tsc`+`test:regression`+`gd-cycle`) **hoặc** user uỷ quyền (B) và chấp nhận cổng cụm đỏ tạm thời.
