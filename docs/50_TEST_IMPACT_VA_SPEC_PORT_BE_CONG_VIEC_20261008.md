# TEST-IMPACT REGISTRY + SPEC PORT BE (việc 5) — chuẩn bị thi hành 7 việc

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · Tiếp theo `docs/49` (kế hoạch 7 việc)
Mục đích: (1) chỉ ra **test nào sẽ gãy** khi đổi cấu trúc tab/menu — ⛔ để không phá bộ hồi quy; (2) **spec port** nút «Nhận xét» để khi làm là dán được.

---

## 1. 🔴 TEST ĐANG **KHOÁ CỨNG** CẤU TRÚC HIỆN TẠI (sẽ gãy nếu làm việc 1/5/6/7)

| # | Tệp · dòng | Khẳng định hiện tại (nguyên văn) | Gãy vì việc | Giá trị MỚI cần sửa |
|---|---|---|---|---|
| 1 | `tests/t01-work-menu.test.mjs:98` | `const WORK_TABS = ["Cá nhân", "Dự án", "Phòng ban", "Giao việc", "Dashboard", "Báo cáo"];` | **1·5·6·7** | Chuỗi tab mới (đề xuất `docs/49` §2.1) |
| 2 | `tests/t01-work-menu.test.mjs:24-28` | Danh sách **5 mục** `workMenuItems` kèm `label`/`view`/`permissionKeys` | **1** | **1 mục** `key:"work"`, `label:"Công việc"`, `view:"dashboard"` |
| 3 | `tests/t01-work-menu.test.mjs:33-35` | Đọc khối `const workMenuItems …` (chỉ kiểm tồn tại) | — | ✅ giữ được (⛔ không đổi tên biến) |
| 4 | `tests/t01-work-menu.test.mjs:90` | `workMenuItems.flatMap((item) => {` trong `page.tsx` | — | ✅ giữ (⛔ không đổi cơ chế suy menu) |
| 5 | `tests/t01-work-menu.test.mjs:111` | view `"assign"` **⛔ không được** mở `WorkCenter` (⇄ `DepartmentTaskWorkspace`) | 1 (⚠️ nếu bỏ mục «Giao việc» khỏi menu) | Sửa theo thiết kế mới: hub mở `WorkCenter`; ⛔ quyết định có giữ lối vào `DepartmentTaskWorkspace` hay không |
| 6 | `tests/p5-01-work-menu-dashboard.test.mjs:25` | `deepEqual(keys, ["work_dashboard","work_personal","work_department","work_assign","work_reports"])` | **1** | `["work"]` |
| 7 | `tests/p5-01-work-menu-dashboard.test.mjs:29-38` | `view "dashboard"` phải trỏ **đúng tab index** của `WORK_TABS` (đọc động) | 1 | ✅ **tự đúng** — test đọc `WORK_TABS` thật ⇒ chỉ cần tab «Dashboard» tồn tại |
| 8 | `tests/p5-01-work-menu-dashboard.test.mjs:42` | `function WorkCenter({ … view = "personal"` | 1 | Đổi default ⇒ `view = "dashboard"` |
| 9 | `tests/t07-kanban-board.test.mjs:157` | `WORK_TABS` khớp **đúng 1 lần** chuỗi 6 tab + chú thích *«Board không được đổi dải 6 tab (MT3 §A.2)»* | 1·5·6·7 | Cập nhật chuỗi mới |
| 10 | `tests/t08-work-dashboard.test.mjs:144` | `WORK_TABS` khớp đúng 1 lần (*«Không được đổi dải 6 tab»*) | 1·5·6·7 | nt |
| 11 | `tests/t09-task-team-member.test.mjs:163` | `WORK_TABS` khớp đúng 1 lần (*«⛔ 5 tab KHÔNG đổi»*) | 1·5·6·7 | nt |
| 12 | `tests/t09-task-team-member.test.mjs:165` | Giữ `kpi: 3` để **tương thích ngược** | 1·5·6·7 | Cập nhật theo `WORK_TAB_OF_VIEW` mới (⚠️ giữ alias `kpi` → tab Dashboard) |
| 13 | `tests/mt3-ui-25-all-groups-tabs.test.mjs:19,33` | Duyệt `workMenuItems` toàn cục (mỗi nhóm có tab) | **1** | ⚠️ **phải đọc khi làm** — nhóm `my_work` còn **1 mục** ⇒ cập nhật kỳ vọng |
| 14 | `tests/mt3-ui-29-view-collision-diagnostic.test.mjs:19,28` | Duyệt `workMenuItems` chẩn đoán **trùng `view`** | **1** | ⚠️ **phải đọc khi làm** — 1 mục ⇒ ⛔ không còn trùng (test có thể vẫn xanh) |
| 15 | `tests/t10-approval-center.test.mjs:78` | Khớp **chuỗi khai báo kiểu** `const workMenuItems: { key: string; … view: WorkMenuView; permissionKeys: ModuleKey[] }[] = [` | — | ✅ giữ được nếu **⛔ không đổi kiểu** |
| 16 | `tests/w01-warehouse-menu.test.mjs:132-134` | 7 khoá (gồm 5 khoá công việc) **⛔ không được** nằm trong `legacyWarehouseMenuKeys` | — | ✅ **⛔ không ảnh hưởng** (đây là danh sách legacy của nhóm KHO) |
| 17 | `tests/t05-personal-work.test.mjs:26` · `t06:31` | Bắt buộc còn khối `T05-PURE-BEGIN/END` · `T06-PURE-BEGIN/END` | — | ✅ giữ nguyên khối thuần (⛔ không xoá) |
| 18 | `tests/runtime-admin-boq-regression.test.mjs:14` | Liệt kê `WorkCenter.tsx` trong danh sách tệp kiểm | — | ✅ không ảnh hưởng |

### 1.1 ⭐ KẾT LUẬN VỀ TEST
- **6 tệp bắt buộc sửa cùng lượt**: `t01` · `p5-01` · `t07` · `t08` · `t09` (+ **2 tệp cần đọc**: `mt3-ui-25` · `mt3-ui-29`).
- ⛔ **KHÔNG được** sửa test trước mã mới, và ⛔ **KHÔNG được** để test đỏ: mỗi việc làm **1 lượt gọn**: *sửa mã → sửa test → `tsc` → `test:regression` → `gd-cycle`*.
- 📌 Các test này ghi rõ *«KHÔNG được đổi dải 6 tab (MT3 §A.2)»* ⇒ **đây là thiết kế đã chốt trước đó**, nay **user chủ động đổi** ⇒ phải ghi **DECISION** và cập nhật test theo thiết kế mới (⛔ không phải "test sai").

---

## 2. 🧱 SPEC PORT BE — `add_work_item_comment` (việc 5) + `set_work_item_participant`

### 2.1 ✅ ĐÃ CÓ (⛔ không cần làm)
| Hạng mục | Bằng chứng |
|---|---|
| **Bảng dữ liệu** | `work_item_comments` · `work_item_participants` **đã có trong chuỗi migration** — chứng minh bởi `tests/work-item-comment-participant.test.ts:54-57` (tự dựng lược đồ từ `drizzle/*.sql` và assert 2 bảng tồn tại) ⇒ ⛔ **KHÔNG cần migration** |
| **Đường ĐỌC (bootstrap)** | `BootstrapDataAdapter.java:1628` (`workItemComments`) · `:1634` (`workItemParticipants`) — đã có truy vấn thật; `:1611-1612` là nhánh rỗng; `:1625` ghi chú đúng về việc màn «Hỗ trợ liên phòng» **chết âm thầm** nếu thiếu khoá ⇒ ⭐ **đường đọc ĐÃ XONG** |
| **Kiểu dữ liệu FE** | `lib/ui-shared.tsx:218` — `workItemComments?: Row[]; workItemParticipants?: Row[]` |
| **RBAC** | `ActionRbacRegistry:16` (`add_work_item_comment` → 4 module) + `:310` (`canUse`) ⇒ ⛔ **không phải sửa registry** |

### 2.2 🔴 PHẢI VIẾT (Java)
| # | Việc | Toạ độ / khuôn |
|---|---|---|
| 1 | **`case "add_work_item_comment"`** trong `SystemController` (hiện **⛔ không có `case`** ⇒ rơi nhánh mặc định ⇒ **400** *«chưa được triển khai trên backend Java»*) | Đặt cạnh nhóm JOBS (`case "mark_task_notification_read"` · `:1000-1010` khu vực) |
| 2 | **`OpsTaskManagementUseCase.addWorkItemComment(principal, payload)`** | Port từ `scripts/system-route.mjs:1286-1296` |
| 3 | **Guard `requireWorkItemAccess(user, task, mode)`** | ⚠️ **Java CHƯA CÓ** (chỉ có ở JS `scripts/system-route.mjs:501-515`) ⇒ ⭐ **phải port ĐÚNG 5 NHÁNH** — xem **§2.4** (⚠️ bản đầu của spec ghi «3 nhánh» là **THIẾU**, đã sửa sau khi đọc mã gốc 08/10) |
| 4 | *(tuỳ chọn, cùng lớp)* `case "set_work_item_participant"` | `scripts/system-route.mjs:1297-1314` — bật lại 「hỗ trợ liên phòng」 của `WorkHierarchy` |

### 2.3 HỢP ĐỒNG CHÍNH XÁC (⛔ giữ đúng để test hợp đồng còn nghĩa)
```text
action   : add_work_item_comment
payload  : { workItemId, comment, visibility? }        visibility: "public" | (khác ⇒ "internal")
validate : · không thấy nhiệm vụ      ⇒ "Không tìm thấy nhiệm vụ."
           · comment rỗng             ⇒ "Cần nhập nội dung bình luận."
           · comment > 4000 ký tự     ⇒ "Nội dung bình luận tối đa 4000 ký tự."
quyền    : requireWorkItemAccess(user, task, "comment")
ghi      : work_item_comments(id="WCM…", work_item_id, user_id, comment, visibility, created_at, updated_at)
trả về   : { message: "Đã thêm bình luận vào <taskNo|taskId>." }
```
```text
action   : set_work_item_participant
payload  : { workItemId, userId, roleInTask?, notify? }
roleInTask ∈ { owner, assignee, follower, supporter }   (mặc định "follower")
validate : · không thấy nhiệm vụ ⇒ "Không tìm thấy nhiệm vụ."
           · thiếu userId       ⇒ "Thiếu người tham gia công việc."
           · role sai           ⇒ "Vai trò tham gia công việc không hợp lệ. Chỉ nhận: …"
           · không thấy người   ⇒ "Không tìm thấy người được thêm vào công việc."
quyền    : requireWorkItemAccess(user, task, "participant")
ghi      : work_item_participants — ⭐ **UPSERT theo (work_item_id, user_id)** (⛔ không sinh dòng trùng)
trả về   : { message: "Đã thêm <fullName> làm <nhãn> của <taskNo>." }
```

---

### 2.4 ⭐ GUARD `requireWorkItemAccess` — **ĐÚNG 5 NHÁNH** (đọc mã gốc `scripts/system-route.mjs:501-515`, ⛔ không suy đoán)
```js
async function requireWorkItemAccess(user, task, mode) {
  if (isAdmin(user)) return;                                    // ① ADMIN ⇒ qua
  const mine    = task.assignedTo === user.id;                  // ② NGƯỜI ĐƯỢC GIAO
  const manager = isDepartmentManager(user, task.departmentCode); // ③ TRƯỞNG PHÒNG của CHÍNH phòng nhiệm vụ
  if (mode === "participant" && (mine || manager)) return;      //    (mode participant: CHỈ ②③ đi tiếp ở đây)
  const participant = SELECT 1 FROM work_item_participants WHERE work_item_id=? AND user_id=?;  // ④ NGƯỜI THAM GIA
  if (participant && mode !== "participant") return;            //    ⚠️ ④ CHỈ hợp lệ cho mode "comment"
  for (const key of ["dept_plan_tasks","dept_project_tasks","dept_plan_assign","dept_project_assign"])
    if (await canUseModule(user, key, mode === "participant" ? "canEdit" : "canUse")) return;   // ⑤ QUYỀN MODULE
  throw new Error(mode === "participant" ? "Chỉ người được giao việc, Trưởng phòng hoặc người có quyền điều phối công việc mới thêm được người tham gia."
                                        : "Tài khoản không thuộc phạm vi công việc này nên không bình luận được.");
}
```
| # | Nhánh | Điều kiện | `comment` | `participant` |
|---|---|---|---|---|
| ① | **admin** | `isAdmin(user)` | ✅ | ✅ |
| ② | **người được giao** | `work_items.assigned_to = user.id` | ✅ | ✅ |
| ③ | **trưởng phòng** | `isDepartmentManager(user, work_items.department_code)` — ⭐ **đúng phòng của nhiệm vụ**, ⛔ không phải phòng của user | ✅ | ✅ |
| ④ | **người tham gia** | có dòng trong `work_item_participants` | ✅ | 🔴 **⛔ KHÔNG** (cố ý: người tham gia ⛔ không được thêm người tham gia khác) |
| ⑤ | **quyền module** | 1 trong **4 khoá công việc** với capability `canUse` (`comment`) / **`canEdit`** (`participant`) | ✅ | ✅ |

**Hệ quả cho port Java (⭐ 2 điểm quan trọng):**
1. **⛔ Đừng bỏ nhánh ④** — nhánh «người tham gia được bình luận» **chỉ tồn tại ở mode `comment`**; đây là lý do `WorkHierarchy` (hỗ trợ liên phòng) mới có nghĩa: người hỗ trợ **đọc/bình luận được** nhưng ⛔ **không điều phối được**.
2. ⚠️ **`set_work_item_participant` phải nâng capability lên `canEdit`** ở `ActionRbacRegistry` (`:310` đang là `"canUse"`): nếu chỉ dựa vào **tầng ① RBAC** để thay nhánh ⑤, thì người có `canUse` sẽ **thêm được người tham gia** — **rộng hơn bản JS** ⇒ ⛔ lệch luật. *(Với `add_work_item_comment` thì tầng ① đã ≈ nhánh ⑤ vì registry khai `canUse`.)*
3. ⭐ **Tái dùng được ở Java**: ② `store.userIsDepartmentManager(…)` đã dùng ở `updateWorkItemProgress:344` & `updateWorkItemStatus:364`; ③ là **cùng hàm** với `departmentCode` của nhiệm vụ; ④ là truy vấn mới trên `work_item_participants` (bảng **đã có**).

---

## 3. THỨ TỰ LÀM AN TOÀN (khi shell sống) — ⛔ không gộp

| Bước | Việc | Test phải cập nhật |
|---|---|---|
| **B1** | Việc **4** (modal «Tạo công việc») — **độc lập nhất**, ⛔ không đổi tab/menu | ⛔ không |
| **B2** | Việc **2** (đưa search xuống) | ⛔ không (search nằm trong `ListToolbar`, test chưa khoá vị trí) |
| **B3** | Việc **3** (nhập % thay nút Thao tác + Dashboard hiện việc của tôi) | ⛔ không (chưa test nào khoá nút 25/50/75/100) |
| **B4** | Việc **7** (2 sub-tab + đổi tên) | ⛔ không (t06/t07 chỉ khoá khối thuần + Kanban render) |
| **B5** | Việc **5·6** (modal chi tiết + nút Nhận xét + tab «Được giao» + nút Hoàn thành `SUBMITTED`) | + **BE port** §2.2 |
| **B6** | Việc **1** (hub menu + Dashboard lên đầu) — **đụng nhiều test nhất** ⇒ **làm CUỐI** | `t01` · `p5-01` · `t07` · `t08` · `t09` (+ đọc `mt3-ui-25/29`) |

⭐ **Vì sao B6 cuối**: chỉ việc 1 mới phá 6 tệp test ⇒ tách riêng để nếu có sự cố thì **5 việc kia đã xong và xanh**.

---

## 4. KẾT LUẬN
- ✅ **5 việc không đụng test nào** (4 · 2 · 3 · 7 và phần lớn 5/6) ⇒ làm được **an toàn, từng bước nhỏ** (đúng Goal §41: nhỏ · cô lập · kiểm được · lùi được).
- ⚠️ **Việc 1** là việc **rủi ro nhất** (6 tệp test + `page.tsx` + menu) ⇒ làm **cuối cùng**.
- 🔴 **Việc 5 cần BE**: 3 điểm (case + method + **guard `requireWorkItemAccess` chưa có ở Java**) · ⛔ **không migration** · **đường đọc đã sẵn**.
- 📌 Vẫn **chờ user**: (A) sửa profile DSH · (B) uỷ quyền phạm vi 3 tệp · (C) thiết kế thêm — và 3 xác nhận ở `docs/49` §6.
