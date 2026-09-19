// PHASE 6 (`TM-04`) — HỢP ĐỒNG: CRUD ĐẦY ĐỦ THEO QUYỀN.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `TM-04`:
//   «CRUD đầy đủ: tạo · xem · sửa · ngừng (theo quyền)»
//
// Cách kiểm:
//   (1) ACTION THẬT: đọc `scripts/system-route.mjs` (CHỈ ĐỌC — `scripts/**` bị CẤM sửa) để chứng minh 3 action
//       `create_project_team` · `set_project_team_status` · `delete_project_team` TỒN TẠI và đọc `requireRole(...)`;
//       đồng thời đối chiếu registry quyền THẬT đang cưỡng chế ở route phục vụ — `ActionRbacRegistry.java`.
//   (2) ≥2 NGƯỜI DÙNG MÔ PHỎNG: chạy thật `teamGates(isAdmin, permission)` của khối thuần ⇒ người ĐỦ quyền làm
//       được, người THIẾU quyền bị CHẶN (nút bị `disabled`), cộng ĐỐI CHỨNG ÂM.
//   (3) HAI CHỖ GÃY ĐÃ ĐO, ghi rõ trong chính tệp test này (không giấu):
//       (a) UI màn Tổ đội TRƯỚC đợt này KHÔNG hề truyền `action`/`permission` ⇒ mọi nút ghi là BẤT KHẢ;
//           nay `app/page.tsx` truyền `action={action} permission={activePermission}`.
//       (b) KHÔNG tồn tại action «sửa tổ đội» ở CẢ hai route ⇒ nhánh «sửa» bị GHI RÕ là chưa có action.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/tm04-team-crud.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const screen = readFileSync(new URL("../app/screens/TeamDirectory.tsx", import.meta.url), "utf8");
const route = readFileSync(new URL("../scripts/system-route.mjs", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const rbac = readFileSync(new URL("../java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java", import.meta.url), "utf8");
const controller = readFileSync(new URL("../java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java", import.meta.url), "utf8");

function loadPure() {
  const blockStart = screen.search(/^\/\/ TM-PURE-BEGIN$/m);
  const blockEnd = screen.search(/^\/\/ TM-PURE-END$/m);
  assert.ok(blockStart >= 0 && blockEnd > blockStart, "Thiếu khối thuần TM-PURE-BEGIN/END");
  const block = screen.slice(blockStart + "// TM-PURE-BEGIN".length, blockEnd);
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  const names = ["teamGates", "TEAM_ACTION_GATES"];
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

// ── 2 NGƯỜI DÙNG MÔ PHỎNG: dựng từ capability THẬT của module `site_command` ─────────────────────
// `user_module_permissions` (đo trên CSDL thật) cho `site_command`: admin = toàn quyền (isAdminUser trong
// `lib/permissions.ts:16`), `cha.ht` (CHT) `canUse=1 canCreate=0 canEdit=0`, `trdademo` `canUse=1`.
const ADMIN_PERMISSION = { canView: true, canUse: true, canCreate: true, canEdit: true, canApprove: true, canExport: true, isAdmin: true };
const COMMANDER_PERMISSION = { canView: true, canUse: true, canCreate: false, canEdit: false, canApprove: false, canExport: true };
const READONLY_PERMISSION = { canView: true, canUse: false, canCreate: false, canEdit: false, canApprove: false, canExport: false };

test("TM-04 — ACTION THẬT tồn tại và tự khai `requireRole` trong route (CHỈ ĐỌC)", () => {
  assert.match(route, /if \(action === "create_project_team"\) \{\s*requireRole\(user,\["commander","admin"\]\);/,
    "Action TẠO phải tồn tại và chốt `requireRole([\"commander\",\"admin\"])`");
  assert.match(route, /if \(action === "set_project_team_status"\) \{\s*requireRole\(user,\["admin"\]\);/,
    "Action NGỪNG/KHÔI PHỤC phải tồn tại và chốt `requireRole([\"admin\"])`");
  assert.match(route, /if \(action === "delete_project_team"\) \{\s*requireRole\(user,\["admin"\]\);/,
    "Action XOÁ phải tồn tại và chốt `requireRole([\"admin\"])`");
  // Nhánh XOÁ phải chặn khi đã phát sinh giao dịch (đúng chữ «ngừng» của TM-04: không xoá mất dấu vết).
  assert.match(route, /Tổ đội đã phát sinh giao dịch; chỉ được ngừng hoạt động, không được xóa vật lý\./,
    "Nhánh xoá phải từ chối khi tổ đội đã có giao dịch");
  // Java (route ĐANG PHỤC VỤ) cũng phải có 3 action đó.
  for (const action of ["create_project_team", "set_project_team_status", "delete_project_team"]) {
    assert.ok(controller.includes(`case "${action}" ->`), `SystemController.java thiếu action «${action}»`);
  }
});

test("TM-04 — QUYỀN THẬT: capability + module của 3 action theo registry đang cưỡng chế", () => {
  for (const action of ["create_project_team", "delete_project_team", "set_project_team_status"]) {
    assert.ok(rbac.includes(`Map.entry("${action}", List.of("site_command"))`), `${action} phải gắn module «site_command»`);
    assert.ok(rbac.includes(`Map.entry("${action}", "canUse")`), `${action} phải gắn capability «canUse»`);
  }
  const { TEAM_ACTION_GATES } = loadPure();
  assert.deepEqual(TEAM_ACTION_GATES.map((gate) => gate.action).sort(),
    ["create_project_team", "delete_project_team", "set_project_team_status"]);
  for (const gate of TEAM_ACTION_GATES) {
    assert.equal(gate.module, "site_command");
    assert.equal(gate.capability, "canUse");
  }
});

test("TM-04 — ≥2 NGƯỜI DÙNG: ĐỦ quyền tạo/ngừng được, THIẾU quyền bị CHẶN", () => {
  const { teamGates } = loadPure();

  // (A) ADMIN — toàn quyền (đúng `isAdminUser` → cả 6 capability true, `lib/permissions.ts:16`).
  const admin = teamGates(true, ADMIN_PERMISSION);
  assert.equal(admin.canView, true);
  assert.equal(admin.canCreate, true, "admin phải tạo được tổ đội");
  assert.equal(admin.canStop, true, "admin phải ngừng được tổ đội");
  assert.equal(admin.canDelete, true, "admin phải xoá được tổ đội chưa phát sinh giao dịch");

  // (B) CHỈ HUY TRƯỞNG (`cha.ht`) — đủ `canUse` ⇒ tạo/ngừng được (action yêu cầu commander|admin).
  const commander = teamGates(false, COMMANDER_PERMISSION);
  assert.equal(commander.canView, true);
  assert.equal(commander.canCreate, true, "CHT có `canUse` của site_command ⇒ tạo được");
  assert.equal(commander.canStop, true, "CHT có `canUse` ⇒ nút ngừng hiện (server vẫn chốt quyền riêng)");
  assert.equal(commander.isAdmin, false, "không được hardcode admin");

  // (C) CHỈ XEM — thiếu capability ⇒ MỌI thao tác ghi bị CHẶN (đúng chữ «theo quyền»).
  const readonly = teamGates(false, READONLY_PERMISSION);
  assert.equal(readonly.canView, true, "vẫn xem được danh sách/chi tiết");
  assert.equal(readonly.canCreate, false, "[đối chứng âm] thiếu quyền ⇒ KHÔNG được tạo");
  assert.equal(readonly.canStop, false, "[đối chứng âm] thiếu quyền ⇒ KHÔNG được ngừng");
  assert.equal(readonly.canDelete, false, "[đối chứng âm] thiếu quyền ⇒ KHÔNG được xoá");

  // (D) VẮNG hẳn hàng quyền (payload không trả `modulePermissions`) ⇒ cũng phải bị chặn, KHÔNG mặc định cho phép.
  const noRow = teamGates(false, undefined);
  assert.equal(noRow.canCreate, false);
  assert.equal(noRow.canStop, false);
  assert.equal(noRow.canView, false, "không có hàng quyền ⇒ không suy ra được quyền xem");
});

test("TM-04 — UI: nút ghi gắn cổng quyền THẬT + truyền `action`/`permission` từ app/page.tsx", () => {
  // Cổng quyền thật được tính từ `modulePermission` (KHÔNG hardcode admin) rồi truyền vào màn.
  assert.match(page, /active === "teams" && <TeamDirectory data=\{data\} action=\{action\} permission=\{activePermission\} \/>/,
    "app/page.tsx phải truyền CẢ `action` LẪN `permission={activePermission}` cho màn Tổ đội (trước đây KHÔNG truyền gì ⇒ nút ghi bất khả)");
  assert.match(page, /const activePermission = modulePermission\(data, active\);/, "Cổng quyền phải lấy từ `modulePermission`");
  assert.match(screen, /disabled=\{!gates\.canCreate \|\| busy !== ""\}/, "Nút TẠO phải bị khoá khi thiếu quyền");
  assert.match(screen, /\{gates\.canStop && <button type="button" className="secondary"/, "Nút NGỪNG/KHÔI PHỤC phải nằm trong nhánh `gates.canStop`");
  assert.match(screen, /runAction\("set_project_team_status", \{ teamId: tid, active: Number\(detail\.active \?\? 1\) === 0 \}\)/,
    "Nút ngừng phải gọi ĐÚNG action `set_project_team_status` với `teamId` + `active`");
  // Nhánh «sửa» phải nói thật là CHƯA có action, không dựng nút giả.
  assert.match(screen, /canEdit: false,/, "`teamGates.canEdit` phải là false và được ghi rõ là CHƯA có action");
  assert.match(screen, /THIẾU ACTION «sửa tổ đội»|chưa có action «sửa tổ đội»/i, "Phải ghi rõ thiếu action «sửa tổ đội» ngay trong mã nguồn");
});

test("TM-04 — GHI RÕ 2 CHỖ GÃY ĐÃ ĐO (không giấu khuyết điểm)", () => {
  // (a) Trước đợt này, call-site cũ KHÔNG truyền action/permission ⇒ đã vô hiệu hoá mọi thao tác ghi.
  //     Nay hợp đồng bắt buộc truyền — nếu ai bỏ đi thì ca trên HỎNG.
  assert.doesNotMatch(page, /active === "teams" && <TeamManagement data=\{data\} open=\{open\} \/>/,
    "Không được quay lại call-site cũ (thiếu action/permission)");
  // (b) KHÔNG có action «sửa» ở cả 2 route ⇒ nhánh «sửa» KHÔNG thể triển khai trong phạm vi cho phép.
  const updateActions = route.match(/action === "(update_project_team|save_project_team|edit_project_team|rename_team)"/g) || [];
  assert.equal(updateActions.length, 0, "Nếu tìm thấy action sửa tổ đội thì hãy cập nhật lại kết luận «sửa chưa có action»");
  const javaUpdate = controller.match(/case "(update_project_team|save_project_team|edit_project_team)" ->/g) || [];
  assert.equal(javaUpdate.length, 0, "Java cũng không có action sửa tổ đội (đối chiếu 2 route)");
});
