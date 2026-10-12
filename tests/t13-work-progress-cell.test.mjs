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
// ⭐ W4 (09/10/2026): test `F` TRÍCH khối thuần `W4-PURE` và CHẠY THẬT `visibleWorkTabs` (như `tests/t05`/`t14`)
//   ⇒ cần `esbuild` để dịch TS→JS (cùng khuôn đã dùng ở `t05`: `esbuild.transformSync(block, { loader: "ts" })`).
import esbuild from "esbuild";

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
    /onStatus=\{\(row, status, reason\) => void send\(status === "COMPLETED" \? "approve_work_item" : "update_work_item_status", \{ workItemId: row\.id, status, reason \}\)\}/,
    "Chưa nối `onStatus` → action THẬT (⭐ `Q2-b`: `COMPLETED` ⇒ `approve_work_item`/`canApprove`; còn lại `update_work_item_status`/`canEdit`)");
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
//   ⭐ Test này khoá **CẢ 2 ĐƯỜNG** (Node + Java): mệnh đề phạm vi **PHẢI** mở đầu bằng việc CỦA CHÍNH MÌNH.
// ⚠️ CẬP NHẬT 08/10/2026 (phương án A — bỏ hardcode phòng ban): bản cũ khoá **hình dạng nhánh cứng**
//   `(wi.assigned_to=? OR (wi.department_code='KH' AND (wi.assigned_to=?…` cho từng mã `KH|DA|BCH`.
//   Nay phòng ban tra ĐỘNG ⇒ giữ nguyên **Ý ĐỊNH** (mở đầu bằng việc của mình ⇒ việc `CN` vẫn hiện cho
//   người tạo) nhưng khoá theo **hình dạng động**: `(wi.assigned_to=? OR (wi.department_code=(SELECT…`.
test("T-13 — `BUG-D15`: mệnh đề phạm vi PHẢI mở đầu bằng `wi.assigned_to=?` (thấy việc của chính mình)", () => {
  const route = read("../scripts/system-route.mjs");
  const java = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");
  for (const [label, src] of [["Node", route], ["Java", java]]) {
    assert.ok(src.includes("(wi.assigned_to=? OR (wi.department_code=(SELECT"),
      `${label}: mệnh đề phạm vi phải MỞ ĐẦU bằng «việc của CHÍNH MÌNH» rồi mới tới phòng ban — ` +
      "nếu không, việc tự tạo (dept='CN') bị ẩn khỏi người tạo (BUG-D15 tái phát)");
    // ⭐ Chốt RIÊNG ca `CN`: mã «Cá nhân» ⛔ KHÔNG được xuất hiện trong mệnh đề lọc (nếu lọc theo phòng thì
    //   việc `CN` sẽ bị loại khỏi mọi nhánh phòng ban) ⇒ chỉ được khớp qua nhánh «việc của mình».
    const where = src.slice(src.indexOf("workItemWhere"), src.indexOf("workItemBinds"));
    assert.ok(!/department_code\s*=\s*'CN'/.test(where),
      `${label}: ⛔ KHÔNG được lọc `+"`department_code='CN'`"+` — việc Cá nhân chỉ hiện qua nhánh «việc của mình»`);
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

// ⭐ USER 08/10/2026 (quyết định `Q2-b`) — **TÁCH ACTION DUYỆT RIÊNG cho nhóm WORK**: `approve_work_item`
//   với capability **`canApprove`** (⛔ không phải `canEdit` như `update_work_item_status`) ⇒ ⭐ ma trận phân
//   quyền phân biệt được «người SỬA việc» và «người DUYỆT việc». ⚠️ Dùng CHUNG thân xử lý (Java: **nhãn `case`
//   ghép** · Node: **`||` cùng dòng**) ⇒ ⛔ **0 dòng dịch** cho 2 tệp bị cổng `F-03` khoá số dòng.
test("T-13 — `Q2-b`: action DUYỆT riêng `approve_work_item` (canApprove) — khoá CẢ 2 ĐƯỜNG + FE", () => {
  const route = read("../scripts/system-route.mjs");
  const java = read("../java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");
  const ctrl = read("../java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");
  assert.match(route, /approve_work_item: \["dept_plan_tasks","dept_project_tasks","dept_plan_assign","dept_project_assign","work"\]/,
    "Node: thiếu khai module cho `approve_work_item`");
  assert.match(route, /approve_work_item: "canApprove"/, "Node: capability phải là `canApprove`");
  assert.match(route, /if \(action === "update_work_item_status" \|\| action === "approve_work_item"\)/,
    "Node: `approve_work_item` phải dùng chung thân xử lý (⛔ 0 dòng dịch)");
  assert.match(java, /Map\.entry\("approve_work_item", List\.of\("dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign", "work"\)\)/,
    "Java registry: thiếu khai module cho `approve_work_item`");
  assert.match(java, /Map\.entry\("approve_work_item", "canApprove"\)/, "Java registry: capability phải là `canApprove`");
  assert.match(ctrl, /case "update_work_item_status", "approve_work_item" ->/,
    "SystemController: phải có nhãn `case` ghép (⛔ 0 dòng dịch)");
  assert.match(workCenter, /send\("approve_work_item", \{ workItemId: detailRow\.id, status: "COMPLETED" \}\)/,
    "FE: nút «Duyệt xong» phải gọi `approve_work_item` (⛔ không dùng `update_work_item_status`)");
  assert.match(workCenter, /status === "COMPLETED" \? "approve_work_item" : "update_work_item_status"/,
    "FE: `onStatus` phải tách nhánh DUYỆT ⇒ chỉ DUYỆT mới cần `canApprove`");
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

// ⭐⭐ USER 08/10/2026 (thẻ quyết định — **PHƯƠNG ÁN A**): «Trong ma trận hiện tại thì lại chia ra 2 phòng ban,
//   trong khi công ty có rất nhiều phòng ban, nên **không được hardcode mà phải thiết kế động**.»
//   📏 ĐO TRƯỚC KHI SỬA: `organization_units` = **11 đơn vị** · nhóm WORK cũ = **4 khoá / 2 phòng**
//      (`dept_plan_*`=Kế hoạch · `dept_project_*`=Dự án) · 44 nhân sự `BCH` ⛔ không có nhánh trưởng phòng.
//   ⇒ Test này khoá **LUẬT ĐỘNG** ở CẢ 3 TẦNG (Node · Java · FE) để ⛔ không ai quay lại hardcode phòng ban.
test("T-13 — `A`: ma trận WORK ĐỘNG — 1 khoá «work» chung + phạm vi tra ĐỘNG từ organization_units", () => {
  const route = read("../scripts/system-route.mjs");
  const java = read("../java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java");
  const uiShared = read("../lib/ui-shared.tsx");
  const menuHelpers = read("../lib/menu-helpers.ts");
  const registry = read("../java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");
  const sql = read("../java-backend/infrastructure/src/main/resources/db/migration/V40__work_module_dynamic.sql");

  // (1) KHOÁ «work» phải là khoá THẬT ở CẢ 2 đường (⛔ thiếu 1 đường là khoá «ma», lưu quyền sẽ 403/422).
  assert.match(route, /const MODULE_KEYS = \[[^\]]*"work"\]/,
    "Node: khoá `work` ⛔ chưa có trong `MODULE_KEYS`");
  assert.match(uiShared, /\| "work" \|/,
    "FE: `ModuleKey` ⛔ chưa có `\"work\"` (TS sẽ chặn mọi map theo ModuleKey)");
  assert.match(sql, /'work','Công việc \(mọi phòng ban\)'/,
    "⛔ THIẾU dòng `module_catalog` cho khoá `work`: backend validate khoá theo bảng này " +
    "(`UserAdminStoreAdapter` → `SELECT module_key FROM module_catalog WHERE active=1`) ⇒ ⛔ không lưu được quyền");

  // (2) MỌI action nhóm WORK phải nhận khoá chung (⛔ giữ nguyên thì nhân sự phòng khác ⛔ không có cổng nào).
  for (const [action, cap] of [["create_work_item", "canCreate"], ["reassign_work_item", "canEdit"],
    ["update_work_item_status", "canEdit"], ["update_work_item_progress", "canEdit"],
    ["approve_work_item", "canApprove"], ["mark_task_notification_read", "canView"],
    ["add_work_item_comment", "canUse"], ["set_work_item_participant", "canEdit"]]) {
    assert.match(route, new RegExp(`${action}: \\[[^\\]]*"work"\\]`),
      `Node: \`${action}\` ⛔ chưa nhận khoá chung \`work\` (vẫn chỉ 2 phòng ban)`);
    assert.ok(registry.includes(`"${action}"`), `Java registry ⛔ thiếu action \`${action}\``);
    assert.match(route, new RegExp(`${action}: "${cap}"`), `\`${action}\` phải gác bằng \`${cap}\``);
  }

  // (3) PHẠM VI ĐỘNG: ⛔ KHÔNG còn mã phòng cứng trong mệnh đề lọc việc; phải tra từ `organization_units.code`.
  const where = route.slice(route.indexOf("const workItemWhere"), route.indexOf("const workItemBinds"));
  for (const hard of ["'KH'", "'kh_truong'", "'DA'", "'da_truong'", "'BCH'"]) {
    assert.ok(!where.includes(hard),
      `Node: mệnh đề phạm vi việc còn HARDCODE phòng ban \`${hard}\` — trái quyết định «thiết kế động»`);
  }
  assert.match(where, /organization_units ou ON ou\.id=mu\.organization_unit_id/,
    "Node: mã phòng phải tra ĐỘNG qua `users.organization_unit_id → organization_units.code`");
  assert.match(where, /unit_type='site_command'/,
    "Node: nhánh Ban chỉ huy phải nhận diện qua `unit_type` (⛔ không qua mã phòng cứng)");
  assert.match(where, /rc\.code LIKE '%_truong'/,
    "Node: quản lý phòng phải nhận diện qua mẫu chức danh `%_truong` (⛔ không qua `kh_truong`/`da_truong`)");
  // ⭐ QUYẾT ĐỊNH USER 08/10/2026: «**Admin sẽ quyết định ai là trưởng phòng**» ⇒ tư cách quản lý phòng
  //   phải nhận THÊM từ **quyền `canApprove` trên khoá `work` do admin cấp** (⛔ không chỉ mẫu chức danh):
  //   nếu thiếu vế này thì quyết định của admin chỉ mở được NÚT «Duyệt» mà ⛔ KHÔNG mở phạm vi XEM việc.
  assert.match(where, /user_module_permissions ump WHERE ump\.user_id=\? AND ump\.module_key='work' AND ump\.can_approve=1/,
    "Node: thiếu vế «quyền do ADMIN CẤP = trưởng phòng» ⇒ admin tick «Duyệt» mà người đó ⛔ vẫn không XEM được việc của phòng");

  // ⭐ `BUG-D21` — `ERP-SESSION-01` BÁO CÁO (08/10/2026, vòng 82): **LỆCH LUẬT GIỮA 2 ĐƯỜNG**.
  //   ⛔ HANDLER `requireWorkItemAccess` (`system-route.mjs:509`) lặp **4 khoá CŨ** ⇒ người **CHỈ có khoá chung
  //   `work`** ĐI QUA được cổng ROUTE nhưng bị **handler CHẶN OAN** («không thuộc phạm vi công việc này»).
  //   ⭐ Java ⛔ **KHÔNG** lặp khoá: `OpsTaskManagementUseCase.requireWorkItemAccess:915-926` đi theo **REGISTRY**
  //   (đã có `work`) ⇒ sửa JS là **khớp lại 2 đường**.
  //   ⇒ Test khoá **BẤT BIẾN TỔNG QUÁT**: **MỌI** mảng khoá 1 dòng trong route có `dept_plan_tasks` **PHẢI**
  //     kèm `"work"` ⇒ ⛔ không tái diễn lớp lỗi «thêm khoá chung nhưng quên 1 cổng» ở bất kỳ chỗ nào.
  assert.match(route, /for \(const key of \["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign", "work"\]\)/,
    "⛔ handler `requireWorkItemAccess` (`:509`) thiếu khoá chung `work` ⇒ người chỉ có `work` bị CHẶN OAN (lệch với Java)");
  const gateArrays = [...route.matchAll(/\[[^\]\n]*"dept_plan_tasks"[^\]\n]*\]/g)].map((m) => m[0]).filter((a) => !/^\[[^\]\n]*MODULE_KEYS/.test(a));
  assert.ok(gateArrays.length >= 4, `phải tìm được ≥4 mảng khoá công việc trong route (tìm thấy ${gateArrays.length}) — nếu ít hơn thì phép kiểm ⛔ vô nghĩa`);
  for (const arr of gateArrays) {
    assert.ok(arr.includes('"work"'),
      `⛔ MẢNG KHOÁ CÔNG VIỆC THIẾU \`"work"\` ⇒ cổng dùng mảng này sẽ chặn oan người chỉ có khoá chung: ${arr.slice(0, 120)}`);
  }

  // ⭐ MỞ RỘNG CÙNG LỚP (vòng 84) — **CỔNG TỆP ĐÍNH KÈM CÔNG VIỆC** (`app/api/files/route.ts`, hàm `moduleAllowed`):
  //   ⛔ CŨNG liệt kê **4 khoá cũ** ⇒ người **chỉ được cấp khoá chung `work`** ⛔ **KHÔNG tải/xoá được tệp**
  //   của công việc (⚠️ cùng lớp lỗi `ERP-SESSION-01` đã báo ở handler `requireWorkItemAccess`).
  //   ⇒ Bất biến được **mở rộng sang tệp này** để ⛔ không tái diễn ở cổng thứ ba.
  const apiFilesRoute = read("../app/api/files/route.ts");
  const apiGateArrays = [...apiFilesRoute.matchAll(/\[[^\]\n]*"dept_plan_tasks"[^\]\n]*\]/g)].map((m) => m[0]);
  assert.ok(apiGateArrays.length >= 1,
    "phải tìm được mảng khoá công việc trong `app/api/files/route.ts` — nếu ít hơn thì phép kiểm ⛔ vô nghĩa");
  for (const arr of apiGateArrays) {
    assert.ok(arr.includes('"work"'),
      `⛔ CỔNG TỆP ĐÍNH KÈM thiếu \`"work"\` ⇒ người chỉ có khoá chung ⛔ không tải được tệp công việc: ${arr.slice(0, 130)}`);
  }
  assert.match(route, /function workScopeAll\(user\)\{[^}]*return codes\.includes\(clean\(user\?\.role\)/,
    "Node: thiếu hàm `workScopeAll` (⛔ đặt cuối tệp để giữ 0 dòng dịch cho cổng F-03)");

  // (4) JAVA phải SOI GƯƠNG Node (F-03 kiểm parity 2 đường) + ⛔ KHÔNG dùng `isCompanyLeadership`
  //     (ĐO ĐƯỢC `thuky`/`hr` có `base_role='director'` ⇒ dùng hàm đó là mở oan việc của toàn bộ nhân sự).
  const jWhere = java.slice(java.indexOf("boolean workAll"), java.indexOf("List<Map<String, Object>> workItems"));
  for (const hard of ["'KH'", "'DA'", "'BCH'", "kh_truong", "da_truong"]) {
    assert.ok(!jWhere.includes(hard),
      `Java: mệnh đề phạm vi việc còn HARDCODE phòng ban \`${hard}\` — 2 đường đã lệch nhau`);
  }
  assert.match(jWhere, /organization_units ou ON ou\.id=mu\.organization_unit_id/,
    "Java: mã phòng phải tra ĐỘNG qua `organization_units.code` (soi gương Node)");
  assert.match(java, /private static boolean isWorkCompanyScope\(String roleCode, String roleBase\)/,
    "Java: thiếu `isWorkCompanyScope` (⛔ KHÔNG dùng `isCompanyLeadership` — sẽ mở oan cho thuky/hr)");
  assert.match(jWhere, /ump\.module_key='work' AND ump\.can_approve=1/,
    "Java: thiếu vế «quyền `work.canApprove` do admin cấp = trưởng phòng» (2 đường đã lệch nhau)");

  // (5) FE: ma trận phải VẼ khoá chung; khoá ⛔ KHÔNG được thành mục menu thứ 2 (menu đã có `work_hub`).
  assert.match(menuHelpers, /\{ key: "work", label: "Công việc \(mọi phòng ban\)",/,
    "FE: ma trận ⛔ chưa có dòng khoá `work` (nhân sự phòng khác vẫn ⛔ không cấp được quyền Work)");
  // ⚠️ CẬP NHẬT 09/10/2026: danh sách nay **xuống dòng** (thêm `project_admin` + 7 khoá Mô hình B) ⇒ đổi regex
  //    từ «`"work"` Ở CUỐI mảng» sang «**CÓ CHỨA** `"work"`» — ⛔ **KHÔNG nới lỏng bất biến** (vẫn đòi `work` bị ẩn khỏi cây menu).
  assert.match(menuHelpers, /const legacyWorkMenuKeys: ModuleKey\[\] = \[[\s\S]*?"work"[\s\S]*?\]/,
    "FE: `work` ⛔ chưa bị ẩn khỏi CÂY MENU ⇒ người dùng thấy 2 mục «Công việc»");
  assert.match(menuHelpers, /permissionKeys: \[[^\]]*"work"[^\]]*\] \},/,
    "FE: `work_hub` ⛔ chưa nhận khoá `work` ⇒ user chỉ có khoá mới sẽ MẤT mục menu «Công việc»");

  // (6) MIGRATION phải IDEMPOTENT + ⛔ KHÔNG cấp thêm quyền ngoài hiện trạng.
  assert.match(sql, /INSERT IGNORE INTO `module_catalog`/, "V40: dòng `module_catalog` phải idempotent (`INSERT IGNORE`)");
  assert.match(sql, /AND NOT EXISTS \(SELECT 1 FROM `department_module_permissions`/,
    "V40: cấp theo đơn vị phải idempotent (`NOT EXISTS`)");
  assert.match(sql, /MAX\(p\.can_edit\)/, "V40: phải KẾ THỪA năng lực hiện có của đơn vị (⛔ không tự cấp thêm quyền)");
  assert.match(sql, /HAVING \(COALESCE\(MAX\(p\.can_view\),0\)/,
    "V40: ⛔ thiếu `HAVING` ⇒ chèn dòng toàn 0 cho đơn vị chưa từng cấu hình ⇒ đơn vị bị coi là «đã cấu hình» và CHẶN cấp quyền");
});

test("T-13 — `B`: «trưởng phòng» TÍNH ĐỘNG — ⛔ không hardcode phòng ban (`BUG-D23`)", () => {
  const routeSrc = read("../scripts/system-route.mjs");
  // ① ⛔ KHÔNG còn danh sách phòng ban CỨNG khi giao việc (⛔ 8/11 đơn vị sẽ không giao được việc).
  assert.doesNotMatch(routeSrc, /\["KH",\s*"DA"\]\.includes\(department\)/,
    "⛔ còn hardcode danh sách phòng ban khi giao việc ⇒ các đơn vị khác ⛔ không giao được việc");
  // ② hàm suy «trưởng phòng» phải TRA ĐỘNG (async) + gác theo `work.canApprove` do ADMIN cấp
  //    (⭐ đúng quyết định user «Admin sẽ quyết định ai là trưởng phòng»).
  assert.match(routeSrc, /async function isDepartmentManager\(user,department\)\{/,
    "`isDepartmentManager` phải là async và tra ĐỘNG");
  assert.match(routeSrc, /ump\.module_key='work' AND ump\.can_approve=1/,
    "luật trưởng phòng ĐỘNG phải dựa trên `work.canApprove` (admin cấp) — ⛔ không suy từ tên phòng");
  // ③ phải so ĐÚNG ĐƠN VỊ ⇒ ⛔ không cho trưởng phòng phòng A quyền trên việc phòng B.
  assert.match(routeSrc, /ou\.code=\?/,
    "⛔ thiếu điều kiện ĐÚNG đơn vị ⇒ trưởng phòng phòng này can thiệp được việc phòng khác");
  // ④ GIỮ nhánh CŨ ⇒ ⛔ không hồi quy 3 tài khoản chức danh `_truong` đang có.
  assert.match(routeSrc, /endsWith\("_truong"\)/,
    "⛔ mất nhánh chức danh CŨ ⇒ 3 tài khoản `kh_truong`/`da_truong` hiện có MẤT quyền trưởng phòng");
  // ⑤ ⭐ BẤT BIẾN AN NINH: MỌI điểm gọi phải `await` — hàm nay là async ⇒ ⛔ thiếu `await` thì
  //    `!promise` LUÔN = false ⇒ cổng quyền **LUÔN CHO QUA** = **NỚI QUYỀN ÂM THẦM** (⛔ không báo lỗi).
  const awaited = [...routeSrc.matchAll(/await isDepartmentManager\(/g)].length;
  assert.equal(awaited, 5,
    `cả 5 điểm gọi phải có \`await\` (đo được ${awaited}) — ⚠️ thiếu ⇒ Promise luôn «truthy» ⇒ NỚI QUYỀN ÂM THẦM`);
  // ⑥ người NHẬN việc + người nhận MẶC ĐỊNH phải theo ĐƠN VỊ THẬT (⛔ không chỉ theo `base_role` cứng).
  assert.match(routeSrc, /FROM users mu LEFT JOIN organization_units ou ON ou\.id=mu\.organization_unit_id WHERE mu\.id=\? AND ou\.code=\?/,
    "`userCanReceiveDepartmentTask` phải nhận theo ĐƠN VỊ THẬT (⛔ không chỉ theo `base_role` cứng)");
  assert.match(routeSrc, /ORDER BY CASE WHEN ou\.code=\? THEN 0 ELSE 1 END/,
    "`defaultDepartmentAssignee` phải ƯU TIÊN người CÙNG ĐƠN VỊ (⛔ không mặc định về phòng Dự án)");
});

test("T-13 — `C`: cổng «work» ở tab Phòng ban + phần BÌNH LUẬN đã MỞ (BE đã sống)", () => {
  const workCenter = read("../app/screens/WorkCenter.tsx");
  // ① `WORK_DEPT_MODULE_KEYS` phải có khoá CHUNG `work` (⛔ không thì người chỉ có `work` bị chặn khỏi tab).
  assert.match(workCenter, /const WORK_DEPT_MODULE_KEYS = \[[^\]]*"work"\]/,
    "⛔ `WORK_DEPT_MODULE_KEYS` thiếu khoá chung `work` ⇒ người chỉ có `work` ⛔ không mở được tab «Phòng ban/ Tổ đội»");
  // ② «Nhận xét»: ⛔ KHÔNG còn dòng «chờ backend» (⚠️ điều kiện đó nay SAI — BE đã có handler).
  assert.doesNotMatch(workCenter, /data-vntech="work-comment-pending"/,
    "⛔ còn dòng «Nhận xét sẽ bật sau khi backend hoàn tất» ⇒ NÓI SAI với người dùng (BE đã có `add_work_item_comment`)");
  assert.doesNotMatch(workCenter, /BE Java ⛔ CHƯA có handler/,
    "⛔ còn chú thích cũ khẳng định BE chưa có handler bình luận");
  // ③ Phải có UI bình luận THẬT: danh sách + ô gửi gọi ĐÚNG action.
  assert.match(workCenter, /data-vntech="work-comment-list"/, "⛔ thiếu DANH SÁCH bình luận");
  assert.match(workCenter, /data-vntech="work-comment-form"/, "⛔ thiếu Ô GỬI bình luận");
  assert.match(workCenter, /send\("add_work_item_comment", \{ workItemId: detailRow\.id, comment: text \}\)/,
    "⛔ ô gửi ⛔ không gọi đúng action `add_work_item_comment` (hoặc sai tham số)");
  // ④ Bình luận phải lấy từ payload đã có (`data.workItemComments`) — ⛔ không tự bịa/tự gọi thêm API.
  assert.match(workCenter, /data\.workItemComments/, "⛔ danh sách ⛔ không đọc từ `data.workItemComments`");
});

test("T-13 — `D`: tab «Được giao» ĐÃ ẨN ⛔ KHÔNG lệch chỉ số tab (yêu cầu user 08/10/2026)", () => {
  const wc = read("../app/screens/WorkCenter.tsx");
  // ① Phải có cơ chế ẩn và **GIỮ NGUYÊN** mảng `WORK_TABS` (⚠️ xoá phần tử = LỆCH CHỈ SỐ ⇒ nội dung tab sau hiện SAI).
  assert.match(wc, /const WORK_TABS_HIDDEN = \["Được giao"\]/,
    "⛔ thiếu `WORK_TABS_HIDDEN = [\"Được giao\"]` (yêu cầu user: «Được giao» đã có trong «Danh sách công việc»)");
  const tabs = wc.match(/const WORK_TABS = \[([^\]]+)\]/);
  assert.ok(tabs, "phải đọc được WORK_TABS");
  const labels = tabs[1].split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
  assert.equal(labels.length, 7, "⚠️ `WORK_TABS` PHẢI giữ đủ **7** phần tử (⛔ xoá ⇒ lệch chỉ số nội dung)");
  assert.equal(labels[2], "Được giao", "⚠️ «Được giao» phải ở ĐÚNG index 2 (khớp khối nội dung + `WORK_TAB_OF_VIEW`)");
  // ② Dải tab phải LỌC phần tử đã ẩn (⛔ không vẽ nút). ⚠️ CẬP NHẬT 09/10/2026 (`W4`): điều kiện lọc nay là
  //    `tabsHien[i]` = ẩn cứng (`WORK_TABS_HIDDEN`) ∪ ẩn VÌ QUYỀN (6 khoá `work_*`) — xem test `F` ở dưới.
  assert.match(wc, /WORK_TABS\.map\(\(label, i\) => tabsHien\[i\] \? <button/,
    "⛔ dải tab chưa lọc theo `tabsHien[i]` (ẩn cứng ∪ ẩn theo quyền) ⇒ nút «Được giao» vẫn hiện");
  assert.match(wc, /const WORK_TABS_HIDDEN = \["Được giao"\];/,
    "⛔ mất `WORK_TABS_HIDDEN` ⇒ tab «Được giao» hiện lại");
  // ③ Menu trỏ vào tab đã ẩn ⇒ phải RƠI VỀ «Danh sách công việc» (⛔ không để trắng màn).
  assert.match(wc, /useState\(\(\) => WORK_TABS_HIDDEN\.includes\(WORK_TABS\[WORK_TAB_OF_VIEW\[view\]\]\) \? WORK_TABS\.indexOf\("Danh sách công việc"\)/,
    "⛔ thiếu chốt chuyển hướng: menu trỏ tab đã ẩn phải về «Danh sách công việc»");
  // ④ ⚠️ CẬP NHẬT 08/10/2026 — user chốt «*gộp lại thành 2 nhóm cho gọn*»: nhóm con «Được giao» ĐÃ GỘP vào «Của tôi»
  //    ⇒ lý do ẩn tab riêng nay nằm ở chỗ «Của tôi» phải bao **TRỌN** việc tự tạo + việc NGƯỜI KHÁC giao cho mình.
  assert.match(wc, /\{ key: "mine", label: "Của tôi", note: "[^"]*TOÀN BỘ/,
    "⛔ «Của tôi» phải là TOÀN BỘ việc của bản thân (tự tạo + người khác giao) — đó là lý do ẩn tab «Được giao»");
  assert.match(wc, /\{ key: "assignedOut", label: "Đã giao", note:/,
    "⛔ thiếu nhóm «Đã giao» = việc tôi giao cho NGƯỜI KHÁC (quyết định 2 nhóm của user)");
  assert.doesNotMatch(wc, /\{ key: "assigned", label: "Được giao", note:/,
    "⛔ nhóm thứ 3 «Được giao» đã bị GỘP theo quyết định của user — ⛔ không được quay lại");
});

// ⭐ `W3` (09/10/2026) — NÚT «XOÁ» VIỆC CỦA BẢN THÂN (đặc tả Công việc §1 của user: «quyền **xóa** công việc (của bản thân)»).
// HỢP ĐỒNG ĐO ĐƯỢC (nguồn: `ERP-SESSION-01` — `CẬP NHẬT 82` · action `delete_work_item`: module `work` + capability `canEdit`;
// chỉ NGƯỜI GIAO/TẠO; ⛔ từ chối việc `COMPLETED`; XOÁ MỀM).
// ⚠️ VÌ SAO CẦN KHOÁ: đây là action **PHÁ HUỶ** ⇒ hai lớp lỗi phải chặn bằng test:
//   ① **«NÚT CHẾT»** (lớp `BUG-D05`): hiện nút ở nơi máy chủ sẽ trả **403** ⇒ phải kiểm **CẢ** cổng `work.canEdit`
//      **VÀ** luật theo dòng (`assignedBy === tôi` ∧ ⛔ chưa đóng);
//   ② **phá vỡ bảng CHỈ XEM**: bảng phòng ban/tổ đội (`allowEdit={false}`) ⛔ không được mọc nút xoá.
test("T-13 — `E`: nút «Xoá» việc CỦA BẢN THÂN (W3) — đủ 2 cổng, ⛔ không «nút chết», gọi ĐÚNG `delete_work_item`", () => {
  const wc = read("../app/screens/WorkCenter.tsx");
  const cell = cellBlock();
  const registry = read("../java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");
  // ① CỔNG 1 — năng lực `work.canEdit` (⭐ ĐỌC từ registry Java, ⛔ không hard-code mù: nếu S01 đổi capability thì test ĐỎ).
  assert.match(registry, /Map\.entry\("delete_work_item", List\.of\("work"\)\)/,
    "`delete_work_item` phải khai module `work` trong `ActionRbacRegistry` — FE đang gate theo `work`");
  assert.match(registry, /Map\.entry\("delete_work_item", "canEdit"\)/,
    "`delete_work_item` phải dùng capability `canEdit` — FE đang gate theo `canEdit`");
  assert.match(wc, /const canDeleteWork = modulePermission\(data, "work"\)\.canEdit;/,
    "⛔ thiếu CỔNG 1: nút «Xoá» phải đòi `work.canEdit` (nếu không ⇒ người thiếu quyền sẽ bấm vào và ăn 403 = «nút chết»)");
  // ② CỔNG 2 — luật theo DÒNG (mô phỏng `deleteWorkItem`): chỉ NGƯỜI GIAO/TẠO, và ⛔ không xoá việc đã đóng.
  assert.match(wc, /const canDeleteRow = \(row: Row\) => canDeleteWork && String\(row\.assignedBy\) === myId && !WORK_CLOSED\.includes\(String\(row\.status\)\);/,
    "⛔ luật theo dòng sai: phải là «tôi là người GIAO/TẠO» ∧ «chưa đóng» (đúng `deleteWorkItem` của máy chủ)");
  // ③ ACTION + THAM SỐ đúng hợp đồng API của S01: `{action:"delete_work_item", workItemId}`.
  assert.match(wc, /action\("delete_work_item", \{ workItemId: row\.id \}\)/,
    "Chưa gọi đúng action `delete_work_item` / sai tên tham số (`workItemId`)");
  // ④ HỘP XÁC NHẬN + khuôn nút nhà (`.export-mini danger` + `data-vntech`) — ⛔ không thêm CSS mới.
  assert.match(cell, /data-vntech="work-delete"/, "Nút «Xoá» thiếu `data-vntech` để khoá bằng test");
  assert.match(cell, /className="export-mini danger"/, "Nút «Xoá» phải dùng khuôn nhà `.export-mini danger` (⛔ không bịa class/CSS mới)");
  assert.match(cell, /window\.confirm\(/, "Nút «Xoá» PHẢI có hộp xác nhận (`window.confirm` — đúng khuôn nhà) trước khi xoá");
  // ⑤ Nút chỉ được VẼ khi có quyền (`canDelete && onDelete`) ⇒ bảng CHỈ XEM ⛔ không mọc nút.
  assert.match(cell, /canDelete && onDelete && <button type="button" className="export-mini danger"/,
    "Nút «Xoá» ⛔ không được vẽ vô điều kiện — phải theo `canDelete && onDelete`");
  assert.match(cell, /if \(!allowEdit\) return <span className="muted">—<\/span>;/,
    "Bảng CHỈ XEM phải thoát TRƯỚC khi tới nút «Xoá» (bảng phòng ban/tổ đội dùng `allowEdit={false}`)");
  // ⑥ ĐỦ 3 bảng sửa được nối nút xoá (tab «Dashboard» · «Danh sách công việc» · «Được giao»); bảng PHÒNG BAN ⛔ không nối.
  const wired = (wc.match(/canDeleteRow=\{canDeleteRow\} onDelete=\{deleteRow\}/g) || []).length;
  assert.equal(wired, 3, `Phải nối nút «Xoá» vào ĐÚNG 3 bảng sửa được (đo được ${wired})`);
  assert.match(wc, /<TaskTable rows=\{find\(deptWork\)\} allowEdit=\{false\}/, "Bảng phòng ban phải giữ `allowEdit={false}` (⛔ không mọc nút xoá)");
});

// ⭐ `W4` (09/10/2026) — DẢI TAB ĐỌC **6 KHOÁ `work_*`** (Mô hình B của user, `HANDOFF-20261009-A09` của S01).
// HỢP ĐỒNG 2 TẦNG: ① khoá TAB (`work_*`) = *vào/không vào TAB* ② `work` + 6 năng lực = *được THAO TÁC gì*.
// ⭐ USER CHỐT **PHƯƠNG ÁN `A` — LÙI AN TOÀN**: chỉ lọc tab khi tài khoản **ĐÃ CÓ ≥1 khoá `work_*`**;
//    ⛔ chưa có khoá nào ⇒ **GIỮ NGUYÊN dải tab như cũ** (⛔ không trắng màn).
test("T-13 — `F`: DẢI TAB đọc 6 khoá `work_*` (W4) — phương án `A` + ⛔ không lệch chỉ số tab", () => {
  const wc = read("../app/screens/WorkCenter.tsx");
  const b = wc.indexOf("W4-PURE-BEGIN"), e = wc.indexOf("W4-PURE-END", b + 1);
  assert.ok(b > 0 && e > b, "Không tách được khối thuần W4-PURE trong WorkCenter.tsx");
  const block = wc.slice(wc.indexOf("\n", b) + 1, e);

  // ① BẤT BIẾN CHỈ SỐ: `WORK_TAB_KEYS` phải KHỚP 1-1 theo THỨ TỰ với `WORK_TABS`
  //    (nội dung tab chọn theo CHỈ SỐ ⇒ lệch = tab hiện SAI nội dung, bẫy im lặng).
  const tabsLit = wc.match(/const WORK_TABS = \[([^\]]+)\]/);
  assert.ok(tabsLit, "phải đọc được `WORK_TABS`");
  const labels = tabsLit[1].split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
  const hidden = wc.match(/const WORK_TABS_HIDDEN = \[[^\]]*\]/);
  assert.ok(hidden, "phải đọc được `WORK_TABS_HIDDEN` để nạp kèm khối W4");
  const api = new Function(
    // ⚠️ `visibleWorkTabs` đọc `WORK_TABS_HIDDEN` (hằng ở CẤP MODULE, NGOÀI khối `W4-PURE`) ⇒ phải nạp kèm
    // hằng THẬT lấy từ chính mã nguồn (⛔ không chép lại giá trị bằng tay — sẽ là «mô phỏng», ⛔ không phải đo).
    esbuild.transformSync(hidden + "\n" + block, { loader: "ts" }).code
    + "\nreturn { WORK_TAB_KEYS, visibleWorkTabs };")();
  assert.equal(api.WORK_TAB_KEYS.length, labels.length, "`WORK_TAB_KEYS` phải cùng ĐỘ DÀI với `WORK_TABS`");
  assert.deepEqual(api.WORK_TAB_KEYS.map((r) => r.label), labels, "`WORK_TAB_KEYS.label` phải KHỚP `WORK_TABS` theo ĐÚNG THỨ TỰ");
  assert.equal(labels.length, 7, "⚠️ `WORK_TABS` PHẢI giữ đủ 7 phần tử (⛔ xoá ⇒ lệch chỉ số nội dung)");

  // ② 6 khoá TAB đúng danh sách S01 đã tạo — và ⛔ KHÔNG có `work_others` (nó KHÔNG phải cổng tab).
  const keys = api.WORK_TAB_KEYS.map((r) => r.key).filter(Boolean);
  assert.deepEqual(keys, ["work_dashboard", "work_list", "work_department", "work_assign", "work_project", "work_reports"],
    "Danh sách khoá TAB phải đúng 6 khoá Mô hình B");
  assert.ok(!keys.includes("work_others"), "⛔ `work_others` KHÔNG được dùng làm cổng TAB (nó là khoá xem việc NGƯỜI KHÁC)");
  assert.equal(api.WORK_TAB_KEYS[2].key, null, "Tab «Được giao» (index 2) ⛔ không có khoá riêng (nó ẩn CỨNG)");

  // ③ PHƯƠNG ÁN `A` — ⛔ chưa có khoá `work_*` nào ⇒ GIỮ NGUYÊN (chỉ ẩn tab ẨN CỨNG «Được giao»).
  const khongKhoa = api.visibleWorkTabs(() => false);
  assert.deepEqual(khongKhoa.map((r) => r.visible), [true, true, false, true, true, true, true],
    "⛔ Chưa có khoá `work_*` nào ⇒ PHẢI giữ nguyên 7 tab (chỉ ẩn cứng «Được giao») — PHƯƠNG ÁN `A`");
  // ④ CÓ khoá ⇒ lọc ĐÚNG theo khoá (tầng ①): chỉ `work_list` ⇒ chỉ tab «Danh sách công việc».
  const chiList = api.visibleWorkTabs((k) => k === "work_list");
  assert.deepEqual(chiList.filter((r) => r.visible).map((r) => r.label), ["Danh sách công việc"],
    "Chỉ có `work_list` ⇒ chỉ được thấy tab «Danh sách công việc»");
  const du6 = api.visibleWorkTabs(() => true);
  assert.deepEqual(du6.filter((r) => r.visible).map((r) => r.index), [0, 1, 3, 4, 5, 6],
    "Đủ 6 khoá ⇒ hiện 6 tab (⛔ «Được giao» vẫn ẩn cứng)");
  // ⑤ ĐỐI CHỨNG ÂM: tab ẩn CỨNG ⛔ KHÔNG bao giờ hiện, kể cả khi mọi khoá = true.
  assert.ok(!du6[2].visible, "⛔ Tab «Được giao» PHẢI luôn ẩn (WORK_TABS_HIDDEN) — ⛔ không được quay lại");

  // ⑥ UI: dải tab vẽ theo `tabsHien[i]` (⛔ KHÔNG còn `WORK_TABS_HIDDEN.includes(label)` trực tiếp).
  assert.match(wc, /const tabsHien = visibleWorkTabs\(\(key\) => modulePermission\(data, key\)\.canView\)\.map\(\(row\) => row\.visible\);/,
    "Dải tab phải tính `tabsHien` từ `visibleWorkTabs` + `modulePermission` (nguồn quyền THẬT)");
  assert.match(wc, /\{WORK_TABS\.map\(\(label, i\) => tabsHien\[i\] \? <button/, "Dải tab chưa lọc theo `tabsHien[i]`");
  // ⑦ «CHỐT RƠI VỀ»: tab đang chọn ⛔ không còn hiện ⇒ về tab ĐẦU TIÊN đang hiện (⛔ không hiện nội dung tab thiếu quyền).
  assert.match(wc, /const tab = tabsHien\[tabChon\] \? tabChon : \(tabHienDauTien >= 0 \? tabHienDauTien : tabChon\);/,
    "Thiếu «chốt rơi về» cho tab ⛔ không còn quyền");
  // ⑧ Tab khởi tạo cũng phải theo QUYỀN (⚠️ giữ nguyên bất biến t13-D: menu trỏ tab ẩn ⇒ về «Danh sách công việc»).
  assert.match(wc, /tabsHien\[WORK_TAB_OF_VIEW\[view\]\] \? WORK_TAB_OF_VIEW\[view\] : WORK_TABS\.indexOf\("Danh sách công việc"\)/,
    "Tab KHỞI TẠO chưa xét QUYỀN ⇒ menu trỏ vào tab bị ẩn vì quyền sẽ mở nội dung ⛔ không được phép");
  // ⑨ ⛔ KHÔNG gate TAB theo `work_others` (quyết định `DEC-20261009-D16`: tab theo 6 khoá `work_*`; phạm vi việc
  //    của người khác do MÁY CHỦ quyết). ⚠️ CẬP NHẬT 09/10/2026: USER yêu cầu **gate Ô CHỌN «Xem việc của»**
  //    theo `work_others` ⇒ ⛔ luật này nay **chỉ** áp cho **TẦNG TAB** (`W4-PURE`), ⛔ không cấm dùng ở ô chọn.
  assert.doesNotMatch(block, /work_others/, "⛔ `work_others` KHÔNG được dùng làm CỔNG TAB (chỉ dùng cho ô chọn «Xem việc của»)");
  assert.doesNotMatch(api.WORK_TAB_KEYS.map((r) => r.key).join(","), /work_others/, "⛔ 6 khoá TAB ⛔ không gồm `work_others`");
});

// ⭐ `W4/YÊU CẦU USER` (09/10/2026) — **BẤM «CÔNG VIỆC» = MỞ THẲNG MÀN** (⛔ không còn mục con để bấm 2 lần).
// ⚠️ KHỐI NÀY Ở `app/page.tsx` (**LOCK S01**) — họ **BÀN GIAO cho S04** (`SHARED_STATE` CẬP NHẬT 87 ngày 09/10:
//   «*việc thay đổi giao diện của WORK - PROJECT thuộc về phạm vi của S4*» — nguyên văn USER) ⇒ ⭐ S04 **GIỮ**
//   khối của họ và **KHOÁ BẰNG TEST** (đúng yêu cầu bàn giao: «GIỮ (ghi nhận + test khoá) HOẶC báo hoàn nguyên»).
test("T-13 — `H`: bấm «CÔNG VIỆC» MỞ THẲNG màn (nhóm 1 mục) — khoá khối `page.tsx` mà S01 bàn giao cho S04", () => {
  const page = read("../app/page.tsx");
  // ① Nhánh mở-trực-tiếp của nhóm `my_work` PHẢI còn, và điều kiện phải ĐÚNG như đã đo:
  //    `children` RỖNG (mọi khoá tab/mô-đun đều bị ẩn khỏi menu) + `workMenuChildren` ĐÚNG 1 mục.
  assert.match(page, /if \(groupKey === "my_work" && group\.children\.length === 0 && workMenuChildren\.length === 1\) \{/,
    "⛔ mất nhánh «bấm CÔNG VIỆC = mở thẳng màn» (yêu cầu user 09/10/2026 — S01 đã bàn giao cho S04)");
  // ② Nút trực tiếp phải mang dấu nhận dạng + mở ĐÚNG màn con (`hub.moduleKey` + `hub.view`) ⇒ ⛔ không mở nhầm.
  assert.match(page, /className=\{`nav-dashboard-direct nav-single-direct \$\{active === hub\.moduleKey \? "active" : ""\}`\} data-nav-single-group=\{groupKey\} onClick=\{\(\) => activateModule\(hub\.moduleKey, hub\.view\)\}/,
    "Nút «CÔNG VIỆC» trực tiếp phải mở ĐÚNG `work_hub` (khoá + `view`) và mang `data-nav-single-group`");
  // ③ ⚠️ Nhóm `my_work` PHẢI rỗng mục con — đó là TIỀN ĐỀ của nhánh trên (nếu `project_admin`/khoá tab lọt lại
  //    vào `children` thì nhánh ⛔ KHÔNG chạy ⇒ user lại phải bấm 2 lần). Bất biến này do test `G` khoá ở tầng
  //    `lib/menu-helpers.ts` (`legacyWorkMenuKeys`) — ở đây chỉ nối 2 đầu lại cho rõ.
  assert.match(page, /!legacyWorkMenuKeys\.includes\(item\.key\)/, "page.tsx phải vẫn lọc `children` bằng `legacyWorkMenuKeys`");
});

// ⭐ `W5` (09/10/2026) — **7 DÒNG MA TRẬN** cho 6 khoá TAB + `work_others` (`HANDOFF-20261009-A09` mục ② của S01).
// ⚠️ VÌ SAO PHẢI Ở `modules[]`: `configuredModules` (`lib/workflow-helpers.ts:56`) duyệt `modules` rồi mới ghép nhãn
//    từ `module_catalog` ⇒ ⛔ thiếu dòng ⇒ **⛔ KHÔNG có DÒNG MA TRẬN** dù đã có trong catalog + `titles`
//    (ĐO 09/10/2026: `configuredModules(payload thật)` = **64** dòng, ⛔ **0/7** khoá mới xuất hiện).
test("T-13 — `G`: MA TRẬN có 7 dòng cho 6 khoá TAB + `work_others` (W5) — ⛔ không thành mục menu", () => {
  const menu = read("../lib/menu-helpers.ts");
  const MOI = ["work_dashboard", "work_list", "work_department", "work_assign", "work_project", "work_reports", "work_others"];
  // ① 7 khoá PHẢI có dòng trong `modules[]` (nguồn duy nhất dựng dòng ma trận).
  for (const key of MOI) {
    assert.match(menu, new RegExp(`\\{ key: "${key}", label: `),
      `⛔ \`modules[]\` thiếu dòng cho \`${key}\` ⇒ khoá ⛔ KHÔNG hiện trên ma trận (dù có trong \`module_catalog\`)`);
  }
  assert.match(menu, /\{ key: "work_dashboard", label: "Công việc — Dashboard", icon: "CV", groupKey: "my_work" \}/,
    "Dòng `work_dashboard` phải nằm nhóm `my_work` (khớp `module_catalog` sort 91-97 của S01)");
  assert.match(menu, /\{ key: "work_others", label: "Việc của NGƯỜI KHÁC \(xem · sửa · duyệt\)", icon: "CV", groupKey: "my_work" \}/,
    "Dòng `work_others` phải đúng NHÃN S01 đã đặt ở ma trận (`B1`)");
  // ② ⭐ **YÊU CẦU TRỰC TIẾP CỦA USER 09/10/2026** (`A15 ①` + tin nhắn kèm ảnh sidebar): **7 khoá này PHẢI nằm
  //    trong `legacyWorkMenuKeys`** ⇒ ⛔ KHÔNG vẽ thành MỤC MENU (nhưng **DÒNG VẪN CÒN trong `modules[]`** = ma trận ✓).
  //    ⚠️ CƠ CHẾ ĐÃ ĐO: `app/page.tsx:734` lọc `children` bằng `!legacyWorkMenuKeys.includes(item.key)`.
  //    ⚠️ NẾU THIẾU ⇒ **7 mục menu mới mọc lên** trong nhóm «Công việc» (đúng cơ chế đã làm `project_admin` lọt).
  const legacy = menu.match(/const legacyWorkMenuKeys: ModuleKey\[\] = \[([\s\S]*?)\];/);
  assert.ok(legacy, "phải đọc được `legacyWorkMenuKeys`");
  for (const key of MOI) {
    assert.ok(legacy[1].includes(`"${key}"`),
      `⛔ \`${key}\` PHẢI nằm trong \`legacyWorkMenuKeys\` — thiếu ⇒ nó MỌC THÀNH MỤC MENU (yêu cầu user: menu Công việc ⛔ không còn mục con)`);
  }
  // ③ ⛔ YÊU CẦU USER: «bỏ **quản trị dự án** ra khỏi menu công việc» — ⚠️ **GIỮ DÒNG MA TRẬN** (`modules[]`).
  assert.ok(legacy[1].includes(`"project_admin"`),
    "⛔ `project_admin` PHẢI nằm trong `legacyWorkMenuKeys` (yêu cầu user 09/10: bỏ «QUẢN TRỊ DỰ ÁN» khỏi menu Công việc)");
  assert.match(menu, /\{ key: "project_admin", label: "Quản trị dự án \(tạo \/ sửa \/ xoá\)", icon: "DA", groupKey: "my_work" \}/,
    "⚠️ ⛔ KHÔNG được XOÁ dòng `project_admin` khỏi `modules[]` — MA TRẬN cần nó (chỉ ẩn khỏi MENU)");
  // ④ ⭐ HỆ QUẢ KÉO THEO (đã đo): `children` của nhóm `my_work` chỉ còn **ĐÚNG 1 mục** (`work_hub`) ⇒ luật
  //    «nhóm 1 mục ⇒ BẤM MỞ THẲNG» ở `app/page.tsx` tự áp dụng ⇒ click «Công việc» vào MÀN luôn ✓
  const workHubCount = (menu.match(/\{ key: "work_hub", label: "Công việc"/g) || []).length;
  assert.equal(workHubCount, 1, "nhóm `my_work` phải có ĐÚNG 1 mục menu (`work_hub`)");
  // ⑤ Nguồn dựng dòng ma trận vẫn là `configuredModules` (⛔ nếu đổi nguồn thì test này ⛔ không còn nghĩa).
  const wf = read("../lib/workflow-helpers.ts");
  assert.match(wf, /function configuredModules\(data: AppData, includeHidden = false\) \{\s*\n\s*const catalog = data\.moduleCatalog \|\| \[\];/,
    "`configuredModules` đổi cách đọc ⇒ phải soát lại kết luận W5");
  assert.match(wf, /return modules\.map\(\(item\) => \{/, "`configuredModules` phải vẫn duyệt mảng `modules` (nguồn dòng ma trận)");
  // ④ ⛔ KHÔNG đổi `work_hub.permissionKeys` thành THIẾU khoá tab (⚠️ lỗi im lặng lớp `D1`: người chỉ có khoá
  //    tab mới sẽ MẤT mục menu «Công việc»). ⭐ Đã ĐO: hôm nay **0** tài khoản rơi vào ca này ⇒ thêm là no-op.
  const hub = menu.match(/permissionKeys: \[([^\]]*)\] \},/);
  assert.ok(hub, "phải đọc được `work_hub.permissionKeys`");
  for (const key of ["work_dashboard", "work_list", "work_department", "work_assign", "work_project", "work_reports"]) {
    assert.ok(hub[1].includes(`"${key}"`),
      `⛔ \`work_hub.permissionKeys\` thiếu \`${key}\` ⇒ người CHỈ được cấp khoá TAB sẽ MẤT mục menu «Công việc» (lớp D1)`);
  }
  assert.ok(!hub[1].includes(`"work_others"`),
    "⛔ `work_others` KHÔNG thuộc cổng MENU (nó là khoá xem việc NGƯỜI KHÁC, tầng dữ liệu)");
});
