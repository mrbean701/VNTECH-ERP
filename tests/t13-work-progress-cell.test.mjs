// ⭐ `T-13` (08/10/2026 — USER «việc 3» khối «Công việc») — KHOÁ HỢP ĐỒNG CỘT **«TIẾN ĐỘ & XÁC NHẬN»** (`ProgressCell`):
//   · **NHẬP %** (number 0..100) thay 4 nút preset cũ
//   · **người THỰC HIỆN** chỉ được **«Gửi kiểm tra» (`SUBMITTED`)** — ⛔ KHÔNG được gửi `COMPLETED`
//   · **người DUYỆT** có **«Duyệt xong» (`COMPLETED`)** + **«Yêu cầu làm lại» (`REWORK`, BẮT BUỘC lý do)**
//   · ⚠️ mọi click TRONG ô phải `stopPropagation` (⛔ nếu không: vừa nhập % vừa bật modal chi tiết)
//
// ⚠️ VÌ SAO CẦN TEST NÀY: `BUG-20261008-D05` (nút «Xong» cũ gửi `COMPLETED` cho MỌI user ⇒ BE từ chối) đã được
//   sửa ở «việc 3» nhưng ⛔ **KHÔNG có test nào khoá** ⇒ sửa xong vẫn có thể tái phát mà hồi quy vẫn XANH.
//   ⭐ Luật dự án: «sửa hành vi ⇒ phải có test khoá hành vi MỚI» (⛔ không chỉ khoá hành vi cũ).
// Chạy: node --import tsx --test tests/t13-work-progress-cell.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL(p, import.meta.url), "utf8");
const workCenter = read("../app/screens/WorkCenter.tsx");
const route = read("../scripts/system-route.mjs");

const cellBlock = () => {
  const start = workCenter.indexOf("function ProgressCell(");
  const end = workCenter.indexOf("function isTaskLate(");
  assert.ok(start > 0 && end > start, "Không tìm thấy `ProgressCell` trong app/screens/WorkCenter.tsx");
  return workCenter.slice(start, end);
};

test("T-13 — ô NHẬP % (0..100, có kẹp) + «Lưu %» gọi ĐÚNG `update_work_item_progress`", () => {
  const cell = cellBlock();
  assert.match(cell, /<input type="number" min=\{0\} max=\{100\}/, "Mất ô nhập % kiểu number giới hạn 0..100");
  assert.match(cell, /aria-label="Phần trăm hoàn thành"/, "Ô nhập % thiếu nhãn a11y");
  assert.match(cell, />Lưu %</, "Mất nút «Lưu %»");
  assert.match(cell, /Math\.max\(0, Math\.min\(100, Number\(value\) \|\| 0\)\)/, "Thiếu KẸP giá trị 0..100 trước khi gửi");
  assert.match(cell, /onProgress\(row, clamped\(\)\)/, "Nút «Lưu %» chưa gọi `onProgress` với giá trị ĐÃ KẸP");
  assert.match(workCenter,
    /onProgress=\{\(row, value\) => void send\("update_work_item_progress", \{ workItemId: row\.id, progress: value \}\)\}/,
    "Chưa nối `onProgress` → action `update_work_item_progress`");
  assert.doesNotMatch(workCenter, /\[25, ?50, ?75, ?100\]/, "⛔ 4 nút preset 25/50/75/100 đã bị bỏ — ⛔ không được quay lại");
});

test("T-13 — ĐÚNG VAI mới gửi `COMPLETED`: người thực hiện CHỈ `SUBMITTED` (chống tái phát `BUG-D05`)", () => {
  const cell = cellBlock();
  assert.match(cell, /canApprove \?/, "Thiếu nhánh PHÂN VAI theo `canApprove`");
  // Người DUYỆT
  assert.match(cell, /onStatus\(row, "COMPLETED"\)/, "Người duyệt chưa gửi `COMPLETED`");
  assert.match(cell, /onStatus\(row, "REWORK", reason\.trim\(\)\)/, "«Yêu cầu làm lại» chưa gửi `REWORK` KÈM LÝ DO");
  assert.match(cell, /disabled=\{busy \|\| !reason\.trim\(\)\}/, "«Yêu cầu làm lại» PHẢI bị chặn khi chưa nhập lý do (yêu cầu nghiệp vụ của user)");
  // Người THỰC HIỆN
  assert.match(cell, /onStatus\(row, "SUBMITTED"\)\}>Gửi kiểm tra</, "Người thực hiện chưa có nút «Gửi kiểm tra» gửi `SUBMITTED`");
  assert.match(cell, /Đã gửi kiểm tra — chờ trưởng phòng/, "Thiếu trạng thái «chờ trưởng phòng» sau khi gửi kiểm tra");
  assert.match(workCenter,
    /onStatus=\{\(row, status, reason\) => void send\("update_work_item_status", \{ workItemId: row\.id, status, reason \}\)\}/,
    "Chưa nối `onStatus` → action `update_work_item_status`");
  // ⚠️ LUẬT BE (nguồn sự thật cho hợp đồng FE) — đọc THẬT, ⛔ không hard-code mù
  assert.match(route, /Người thực hiện chỉ Gửi kiểm tra/,
    "Luật BE đã đổi (route không còn chặn người thực hiện gửi COMPLETED) ⇒ PHẢI soát lại hợp đồng FE của `BUG-D05`");
});

test("T-13 — ô CHỈ hiện khi `allowEdit` + ⛔ BẮT BUỘC `stopPropagation` (bảo vệ `onRowClick`)", () => {
  const cell = cellBlock();
  assert.match(cell, /if \(!allowEdit\) return <span className="muted">—<\/span>;/,
    "Ô tiến độ phải hiện «—» khi KHÔNG có quyền sửa (bảng phòng ban/tổ đội dùng `allowEdit={false}`)");
  assert.match(cell, /if \(status === "COMPLETED"\) return <span className="muted">Đã hoàn thành<\/span>;/,
    "Việc đã hoàn thành phải KHOÁ ô nhập");
  assert.match(cell, /onClick=\{\(event\) => event\.stopPropagation\(\)\}/,
    "⛔ THIẾU `stopPropagation`: nhập % sẽ vừa lưu vừa BẬT MODAL CHI TIẾT (`onRowClick`)");
  // Cột c9 phải gắn ĐÚNG vào bảng và mang tiêu đề MỚI
  assert.match(workCenter, /key: "c9", header: "Tiến độ & xác nhận"/, "Cột 9 phải là «Tiến độ & xác nhận»");
  assert.doesNotMatch(workCenter, /header: "Thao tác"/, "⛔ cột «Thao tác» cũ đã bị thay — ⛔ không quay lại");
});

test("T-13 — mã trạng thái FE gửi PHẢI có trong `TASK_STATUSES` của route (Node)", () => {
  assert.match(route, /TASK_STATUSES\s*=\s*new Set\(\[/, "Không đọc được `TASK_STATUSES` của route");
  for (const code of ["SUBMITTED", "REWORK", "COMPLETED"]) {
    assert.match(route, new RegExp(`"${code}"`), `Route THIẾU mã trạng thái ${code} ⇒ FE gửi vào sẽ 400`);
  }
});

// ⭐ FIX `BUG-20261008-D09` (phát hiện ở vòng 54 khi soi ẢNH THẬT): mục hub `work_hub` ⛔ không khai `moduleKey`
//   ⇒ `active` = khoá quyền ĐẦU xem được (`dept_plan_kpi`) ⇒ `<h1>` LUÔN «KPI & hiệu suất nhân viên» dù đang ở
//   tab «Danh sách công việc»/«Phòng ban/ Tổ đội»… ⇒ test này khoá việc GHI ĐÈ tiêu đề «Công việc».
test("T-13 — TIÊU ĐỀ TRANG khối «Công việc» ⛔ không được mang tiêu đề module KPI (fix `BUG-D09`)", () => {
  const page = read("../app/page.tsx");
  // `title` PHẢI là `let`: vì `workCenterView` chỉ biết được SAU dòng khai `title` ⇒ bắt buộc ghi đè.
  assert.match(page, /let title: \[string, string\] = \[moduleMeta\?\.label \|\| titles\[active\]\[0\]/,
    "`title` phải là `let` để còn GHI ĐÈ sau khi tính `workCenterView`");
  assert.match(page, /if \(workCenterView !== null\) \{\s*title = \["Công việc",/,
    "Thiếu GHI ĐÈ tiêu đề «Công việc» khi màn đang mở là WorkCenter ⇒ `<h1>` hiện sai tiêu đề module (BUG-D09)");
  // ⭐ BẪY ĐI KÈM (đã đảo ở «việc 1»): `view === "dashboard"` phải đứng TRƯỚC nhánh `dept_plan_*_tasks`,
  //   nếu ⛔ không thì bấm «Công việc» sẽ mở nhầm tab «Danh sách công việc» thay vì «Dashboard».
  const fn = page.slice(page.indexOf("function workCenterViewFor("), page.indexOf("function WarehouseApp("));
  assert.ok(fn.indexOf('if (view === "dashboard") return "dashboard";') < fn.indexOf('if (active === "dept_plan_tasks"'),
    "⛔ BẪY: nhánh `view === \"dashboard\"` phải đứng TRƯỚC nhánh `dept_plan_*_tasks`");
});

// ⭐ FIX vòng 63 («sửa lại các tab»): tiêu đề «CÔNG VIỆC» từng ghi `deptWork.length + teamWork.length` = **24**
//   trong khi TỔNG chỉ **16** ⚠️ vì HAI TẬP GIAO NHAU (tổ đội ⊂ phòng ban với tài khoản quản trị) ⇒ số vô lý.
//   Test này khoá: tiêu đề phải dùng tập **HỢP không trùng** `deptTeamWork`.
test("T-13 — tiêu đề «CÔNG VIỆC» ⛔ KHÔNG cộng dồn 2 tập GIAO NHAU (phòng ban ∩ tổ đội)", () => {
  assert.match(workCenter, /const deptTeamWork = scopedWork\.filter\(/, "Thiếu tập HỢP (không trùng) `deptTeamWork`");
  assert.match(workCenter, /note=\{`\$\{mine\.length\} việc của bạn · \$\{deptTeamWork\.length\}/,
    "Tiêu đề phải hiển thị tập HỢP `deptTeamWork.length`");
  assert.doesNotMatch(workCenter, /deptWork\.length \+ teamWork\.length/,
    "⛔ KHÔNG được cộng dồn 2 tập GIAO NHAU (đếm trùng ⇒ số hiển thị LỚN HƠN tổng thật)");
});

// ⭐ USER 08/10/2026: *«tạm thời ẩn Kanban / cây — **ghi vào log nếu sau này cần thì dùng lại**»*.
//   ⇒ Test này khoá ĐÚNG ý đó: UI ẨN (**1 cờ duy nhất**) nhưng **MÃ PHẢI CÒN NGUYÊN** để bật lại sau.
test("T-13 — Kanban/Cây TẠM ẨN nhưng ⛔ KHÔNG xoá mã (bật lại = đổi ĐÚNG 1 cờ `WORK_VIEW_MODES_HIDDEN`)", () => {
  assert.match(workCenter, /const WORK_VIEW_MODES_HIDDEN = true;/, "Thiếu cờ `WORK_VIEW_MODES_HIDDEN = true` (tạm ẩn)");
  // ⭐ MÃ PHẢI CÒN: import + 2 khối JSX vẫn tồn tại ⇒ ⛔ không được xoá để 'ẩn'
  assert.match(workCenter, /import \{ WorkKanban, kanbanManagerDepartments \} from "@\/app\/screens\/WorkKanban";/,
    "⛔ KHÔNG được XOÁ import `WorkKanban` (phải giữ để bật lại)");
  assert.match(workCenter, /import \{ WorkHierarchy \} from "@\/app\/screens\/WorkHierarchy";/,
    "⛔ KHÔNG được XOÁ import `WorkHierarchy` (phải giữ để bật lại)");
  assert.match(workCenter, /\{!WORK_VIEW_MODES_HIDDEN && deptView === "kanban" && <WorkKanban/,
    "Khối Kanban phải bị CHẶN bằng cờ (⛔ không xoá khối)");
  assert.match(workCenter, /\{!WORK_VIEW_MODES_HIDDEN && deptView === "tree" && <WorkHierarchy/,
    "Khối Cây phải bị CHẶN bằng cờ (⛔ không xoá khối)");
  assert.match(workCenter, /work-dept-view-\$\{mode\}/, "⛔ Phải GIỮ 3 nút chế độ xem trong mã để bật lại");
  // ⚠️ Khi đã ẩn thì BẢNG phải LUÔN hiện (⛔ tránh màn trắng nếu `deptView` còn giá trị cũ)
  assert.match(workCenter, /\{\(WORK_VIEW_MODES_HIDDEN \|\| deptView === "list"\) && <section className="card">/,
    "Bảng phải hiện khi ẩn chế độ xem (`WORK_VIEW_MODES_HIDDEN || deptView === \"list\"`)");
});

// ⭐ `BUG-20261008-D12` (USER UỶ QUYỀN 08/10/2026) — YÊU CẦU **6c**: *«người giao nhận thông báo khi việc hoàn thành»*.
//   ⚠️ Trước đây `queueTaskNotice` CHỈ được gọi khi GIAO ⇒ `COMPLETED` ⛔ không ai được báo (đo vòng 64).
//   Test này khoá đường **Node** (`scripts/system-route.mjs`) — đường Java có `notifySafely("TASK_COMPLETED")`
//   nhưng **theo CẤU HÌNH** ⇒ ⛔ không đảm bảo đúng người giao (xem `HANDOFF-20261008-D10`).
test("T-13 — `BUG-D12`: chuyển `COMPLETED` PHẢI báo **NGƯỜI GIAO** (đường Node)", () => {
  const s = read("../scripts/system-route.mjs");
  assert.match(s, /async function queueCompletionNotice\(task,actor,request\)/, "Thiếu hàm `queueCompletionNotice`");
  assert.match(s, /if\(next==='COMPLETED'\) await queueCompletionNotice\(task,user,request\);/,
    "Nhánh `COMPLETED` trong `update_work_item_status` chưa gọi `queueCompletionNotice`");
  assert.match(s, /INSERT INTO task_notifications\(id,work_item_id,user_id,channel/,
    "Thiếu hàng `task_notifications` cho người giao (⛔ phải ghi TRỰC TIẾP, không phụ thuộc cấu hình)");
  assert.match(s, /"task_completed"/, "Thiếu hàng email `email_outbox` với event `task_completed`");
  assert.match(s, /if\(assignerId===clean\(actor\.id\)\) return;/,
    "Thiếu luật ⛔ KHÔNG tự báo khi **người xác nhận chính là người giao**");
  assert.match(s, /const assignerId=clean\(task\.assigned_by\); if\(!assignerId\) return;/,
    "Thiếu luật bỏ qua việc ⛔ không có người giao (việc tự tạo)");
});

// ⭐ `BUG-20261008-D14` (phát hiện vòng 74) — **LỆCH BỘ TRẠNG THÁI GIỮA HAI ĐƯỜNG**:
//   ⚠️ Proxy **đang phục vụ đường JAVA** (đo ở `TEST-D39`) mà Java chỉ có **8** trạng thái, thiếu
//   **`REWORK`** + **4 `WAITING_*`** ⇒ 🔴 nút «Yêu cầu làm lại» (việc 5) và các cột Kanban bị Java
//   từ chối «Trạng thái nhiệm vụ không hợp lệ» **TRÊN BẢN ĐANG CHẠY**.
//   ⭐ Test này khoá VĨNH VIỄN: **mọi mã trạng thái của Node (bộ từ vựng FE dùng) PHẢI có ở Java**.
test("T-13 — `BUG-D14`: bộ trạng thái JAVA phải PHỦ HẾT bộ của Node (chống lệch 2 đường)", () => {
  const route = read("../scripts/system-route.mjs");
  const java = read("../java-backend/application/src/main/java/com/vntech/erp/application/service/OpsTaskManagementUseCase.java");
  const nodeBlock = (route.match(/const TASK_STATUSES = new Set\(\[([^\]]+)\]\)/) || [])[1] || "";
  const codes = [...nodeBlock.matchAll(/"([A-Z_]+)"/g)].map((m) => m[1]);
  assert.ok(codes.length >= 12, `Không đọc được bộ trạng thái Node (đọc ${codes.length} mã)`);
  const javaBlock = (java.match(/TASK_STATUSES = Set\.of\(([^;]+)\);/) || [])[1] || "";
  assert.ok(javaBlock.length > 0, "Không đọc được `TASK_STATUSES` của Java");
  const missing = codes.filter((c) => !javaBlock.includes(`"${c}"`));
  assert.deepEqual(missing, [],
    `Java THIẾU mã trạng thái: ${missing.join(", ")} ⇒ FE gửi lên sẽ bị 400 «Trạng thái nhiệm vụ không hợp lệ»`);
});

// ⭐ `BUG-20261008-D15` (đo thật vòng 76) — **VIỆC TỰ TẠO (`department_code='CN'`) BỊ ẨN KHỎI CHÍNH NGƯỜI TẠO**:
//   `create_self_work_item` (Java) tạo việc với `department='CN'`, nhưng bộ lọc `workItems` của nhánh phòng ban
//   chỉ lấy `department_code='KH'|'DA'|'BCH'` ⇒ ⛔ việc `CN` **KHÔNG BAO GIỜ khớp** ⇒ người dùng tưởng mất việc.
//   ⭐ Test này khoá **CẢ 2 ĐƯỜNG** (Node + Java): mỗi nhánh phòng ban **PHẢI** mở đầu bằng việc CỦA CHÍNH MÌNH.
test("T-13 — `BUG-D15`: nhánh lọc theo phòng ban PHẢI mở đầu bằng `wi.assigned_to=?` (thấy việc của chính mình)", () => {
  const route = read("../scripts/system-route.mjs");
  const java = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");
  for (const [label, src] of [["Node", route], ["Java", java]]) {
    for (const dept of ["KH", "DA", "BCH"]) {
      assert.ok(src.includes(`(wi.assigned_to=? OR (wi.department_code='${dept}' AND (wi.assigned_to=?`),
        `${label}: nhánh ${dept} phải MỞ ĐẦU bằng «việc của CHÍNH MÌNH» — nếu không, việc tự tạo (dept='CN') bị ẩn khỏi người tạo`);
    }
  }
});

// ⭐ `P-08` (USER UỶ QUYỀN «làm theo đề xuất» 08/10/2026) — **CHỐNG LEO THANG**:
//   ⚠️ ĐO THẬT 16/16 action: route JS = `requireRole(["admin"])`, Java chỉ `requireCurrentUser(request)`
//   ⇒ **cổng registry là cổng DUY NHẤT** ⇒ ⛔ TUYỆT ĐỐI KHÔNG gắn module cho các action này
//   (gắn module = ai có `canUse`/`canEdit` của module đó ĐI QUA ⇒ LEO THANG — đúng bài học `TM-04`).
//   ✅ Cách đúng: `ADMIN_ONLY_ACTIONS` (siết đúng bằng route JS + trả đúng thông điệp).
test("T-13 — `P-08`: 18 action admin-only ⛔ KHÔNG được gắn module + PHẢI có trong `ADMIN_ONLY_ACTIONS`", () => {
  const registry = read("../java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");
  const service = read("../java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java");
  const route = read("../scripts/system-route.mjs");
  const ADMIN_ONLY = [
    "save_material_category", "save_material_subcategory", "set_material_category_status",
    "set_material_subcategory_status", "delete_material_category", "delete_material_subcategory",
    "import_material_catalog",
    "save_approval_stage", "set_approval_stage_status", "delete_approval_stage",
    "set_project_team_status", "delete_project_team",
    "bulk_import_projects", "bulk_import_users",
    "save_email_settings", "retry_email", "save_ui_display_settings", "save_trust_development_settings",
  ];
  for (const a of ADMIN_ONLY) {
    assert.ok(service.includes(`"${a}"`), `RbacService: thiếu «${a}» trong ADMIN_ONLY_ACTIONS`);
    assert.ok(registry.includes(`Map.entry("${a}", List.of())`),
      `⛔ LEO THANG: «${a}» phải GIỮ danh sách module RỖNG (route JS = requireRole(["admin"]))`);
    const i = route.indexOf(`action === "${a}"`);
    if (i >= 0) {
      // ⚠️ Cắt ĐÚNG NHÁNH (tới `action ===` kế tiếp) — ⛔ không dùng cửa sổ ký tự cố định (dễ trượt/khớp nhầm nhánh sau)
      const nxt = route.indexOf("action ===", i + 12);
      const branch = route.slice(i, nxt > i ? nxt : i + 800);
      assert.match(branch, /requireRole\(\s*user\s*,\s*\[\s*"admin"\s*\]\s*\)/,
        `«${a}»: nhánh route JS phải là requireRole(user, ["admin"])`);
    }
  }
  const idxAdminOnly = service.indexOf("ADMIN_ONLY_ACTIONS.contains(action)");
  const idxLeadership = service.indexOf("isCompanyLeadership(user) && !required.contains");
  assert.ok(idxAdminOnly > 0, "RbacService thiếu nhánh `ADMIN_ONLY_ACTIONS.contains(action)`");
  assert.ok(idxLeadership > idxAdminOnly,
    "Nhánh `ADMIN_ONLY_ACTIONS` phải đứng TRƯỚC nhánh `isCompanyLeadership` (nếu không director/accountant vẫn đi qua)");
});

// ⭐ VÒNG 62 — LỚP LỖI «UI GỌI ACTION ⛔ KHÔNG CÓ BACKEND XỬ LÝ» (bấm vào là 400, ⛔ im lặng):
//   ⚠️ Đã suýt báo động sai với `create_self_work_item` (⛔ KHÔNG có ở `scripts/system-route.mjs`) —
//   nhưng nó là **ACTION JAVA-ONLY ĐÃ BIẾT**: có `case` ở `SystemController.java:1020` + khai trong
//   `tools/audit-java-only-actions.mjs:26` ⇒ ⛔ **KHÔNG phải bug**. Test này khoá ĐÚNG luật đó.
test("T-13 — MỌI action WorkCenter gọi PHẢI có ở ÍT NHẤT 1 backend (Node route HOẶC Java), Java-only phải được KHAI", () => {
  const java = read("../java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");
  const javaOnly = read("../tools/audit-java-only-actions.mjs");
  const actions = [...new Set([...workCenter.matchAll(/(?:send|action)\("([a-z0-9_]+)"/g)].map((m) => m[1]))];
  assert.ok(actions.length >= 4, `Chỉ đọc được ${actions.length} action — ⛔ test sẽ vô nghĩa`);
  const missing = actions.filter((a) => !route.includes(`"${a}"`) && !java.includes(`"${a}"`));
  assert.deepEqual(missing, [], `Action gọi từ WorkCenter mà ⛔ KHÔNG backend nào xử lý (bấm vào sẽ 400): ${missing.join(", ")}`);
  // ⭐ Action JAVA-ONLY: phải có `case` ở Java **VÀ** được khai công khai trong danh sách java-only
  //   (⛔ nếu không khai thì `tools/audit-java-only-actions.mjs` sẽ báo lệch ⇒ phải cập nhật).
  for (const a of actions) {
    if (route.includes(`"${a}"`)) continue;
    assert.ok(java.includes(`"${a}"`), `Action ${a} ⛔ KHÔNG có ở Node LẪN Java`);
    assert.ok(javaOnly.includes(`"${a}"`), `Action ${a} chỉ có ở Java nhưng ⛔ CHƯA khai trong tools/audit-java-only-actions.mjs`);
  }
});

// ⭐ FIX `BUG-20261008-D10` (vòng 58, phát hiện khi audit tab «Giao việc»): form giao việc gửi payload có
//   `fd.get("description")` nhưng form ⛔ **KHÔNG có ô nhập** `name="description"` ⇒ «Mô tả» LUÔN RỖNG.
//   ⭐ Test này khoá **CẢ LỚP LỖI**: mọi khoá đọc từ `FormData` phải có ô nhập tương ứng.
test("T-13 — MỌI khoá `fd.get(\"…\")` PHẢI có ô nhập `name=\"…\"` (chống `BUG-D10`: trường gửi đi luôn RỖNG)", () => {
  const reads = [...workCenter.matchAll(/fd\.get\("([A-Za-z0-9_]+)"\)/g)].map((m) => m[1]);
  assert.ok(reads.length > 0, "Không đọc được khoá `FormData` nào trong WorkCenter.tsx (⛔ test sẽ vô nghĩa)");
  for (const key of new Set(reads)) {
    assert.match(workCenter, new RegExp(`name="${key}"`),
      `Payload ĐỌC \`${key}\` nhưng ⛔ KHÔNG có ô nhập \`name="${key}"\` ⇒ trường LUÔN RỖNG (BUG-D10)`);
  }
  // ⭐ Chốt riêng trường hợp đã gây bug: form GIAO VIỆC phải có ô «Mô tả»
  assert.match(workCenter, /<span>Mô tả<\/span><textarea name="description"/,
    "Form giao việc THIẾU ô «Mô tả» (`name=\"description\"`)");
});
