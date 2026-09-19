// PHASE 4 (`PR-04`) — HỢP ĐỒNG: "Bấm vào Project/User/Warehouse/Team → mở EntityDetailModal".
//
// Vì sao kiểm ở tầng NGUỒN: bundle đang phục vụ CŨ hơn nguồn (`npm run build` ngoài quyền nhánh này).
// Dấu vết phải CHẮC: (a) màn dự án gọi `openEntity(<kind>, …)` ở MỌI chỗ hiển thị Project/User/
// Warehouse/Team, (b) có ĐÚNG MỘT nơi bọc `EntityDetailModal` dùng chung (U-01) cho 4 loại thực thể.
//
// Chạy:  node --test tests/pr04-entity-modal.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const detailSource = readFileSync(new URL("../app/screens/ProjectDetailTabs.tsx", import.meta.url), "utf8");
const entitySource = readFileSync(new URL("../app/screens/ProjectEntityModal.tsx", import.meta.url), "utf8");

const pmStart = pageSource.indexOf("function ProjectManagement(");
const pmEnd = pageSource.indexOf("function ProjectProgress(", pmStart);
assert.ok(pmStart > 0 && pmEnd > pmStart, "Không tách được `ProjectManagement` trong app/page.tsx");
const pm = pageSource.slice(pmStart, pmEnd);
const bchStart = pageSource.indexOf("function SiteCommandScreen(");
const bchEnd = pageSource.indexOf("function userPermissionSpec(", bchStart);
assert.ok(bchStart > 0 && bchEnd > bchStart, "Không tách được `SiteCommandScreen` (vùng BCH) trong app/page.tsx");
const bch = pageSource.slice(bchStart, bchEnd);

test("PR-04 — màn dự án có ĐÚNG MỘT cổng mở modal thực thể, dùng `EntityDetailModal` dùng chung (U-01)", () => {
  assert.match(entitySource, /import \{[^}]*EntityDetailModal[^}]*\} from "@\/app\/components\/ui"/, "ProjectEntityModal phải dùng component dùng chung `EntityDetailModal`");
  assert.match(entitySource, /<EntityDetailModal/, "ProjectEntityModal chưa render `EntityDetailModal`");
  assert.match(pageSource, /from "@\/app\/screens\/ProjectEntityModal"/, "page.tsx chưa dùng `ProjectEntityModal`");
});

test("PR-04 — ProjectManagement quản lý MỘT state thực thể + render Ở CẢ 2 nhánh (danh sách/chi tiết)", () => {
  assert.match(pm, /const \[entity, setEntity\] = useState/, "Thiếu state `entity` cho modal thực thể");
  assert.match(pm, /function openEntity\(kind/, "Thiếu hàm `openEntity` trong ProjectManagement");
  assert.match(pm, /const entityModal = entity \? <ProjectEntityModal data=\{data\} entity=\{entity\}/, "Modal thực thể phải do MỘT biến `entityModal` dựng ra (tránh 4 modal rời nhau)");
  const listStart = pm.indexOf('if (view === "list")');
  const detailStart = pm.indexOf("// =========================== CHI TIẾT");
  const listBranch = pm.slice(listStart, detailStart);
  const detailBranch = pm.slice(detailStart);
  assert.match(listBranch, /\{entityModal\}/, "Nhánh DANH SÁCH chưa render modal thực thể");
  assert.match(detailBranch, /\{entityModal\}/, "Nhánh CHI TIẾT chưa render modal thực thể");
});

test("PR-04 — 4 loại thực thể trong màn Dự án đều mở modal: Project · User · Warehouse · Team", () => {
  // Project: bấm vào mã/tên dự án ở danh sách + ở khối thông tin chung của chi tiết.
  assert.match(pm, /openEntity\("project",\s*row\)/, "Danh sách dự án chưa mở modal khi bấm vào dòng Dự án");
  assert.match(detailSource, /openEntity\("project",\s*project\)/, "Chi tiết dự án chưa mở modal Project khi bấm vào thông tin dự án");
  // User: nhân sự tham gia dự án.
  assert.match(detailSource, /openEntity\("user",\s*u\)/, "Danh sách nhân sự chưa mở modal User");
  // Team: tổ đội thuộc dự án.
  assert.match(detailSource, /openEntity\("team",\s*t\)/, "Danh sách tổ đội chưa mở modal Team");
  // Warehouse: kho của dự án.
  assert.match(detailSource, /openEntity\("warehouse",\s*w\)/, "Danh sách kho chưa mở modal Warehouse");
});

test("PR-04 — modal thực thể có ĐỦ 4 loại với tab nội dung thật (không dựng bảng dữ liệu mới)", () => {
  for (const kind of ["project", "user", "warehouse", "team"]) {
    assert.match(entitySource, new RegExp(`case "${kind}"`), `Thiếu nhánh modal cho thực thể \`${kind}\``);
  }
  assert.match(entitySource, /tabs = \[/, "Modal thực thể phải dựng danh sách `tabs` cho từng loại thực thể");
  assert.match(entitySource, /tabs=\{tabs\}/, "Modal thực thể phải truyền `tabs` cho EntityDetailModal");
  assert.match(entitySource, /canView=/, "Modal thực thể phải truyền `canView` (QUYỀN=CHECK)");
});

test("PR-04 — vùng BAN CHỈ HUY cũng mở modal khi bấm vào User/Project (link entity)", () => {
  assert.match(bch, /openEntity\("user",\s*m\)/, "Thành viên BCH chưa mở modal User");
  assert.match(bch, /openEntity\("project",\s*projectRow\)/, "Dòng Ban chỉ huy chưa mở modal Project");
});

test("PR-04 — ĐỐI CHỨNG ÂM: bỏ `openEntity` khỏi một chỗ thì phép kiểm tương ứng PHẢI ĐỎ", () => {
  const stripped = detailSource.replace(/openEntity\("user",\s*u\)/g, "void 0");
  assert.throws(() => assert.match(stripped, /openEntity\("user",\s*u\)/, "Danh sách nhân sự chưa mở modal User"), "Đối chứng âm thất bại: phép kiểm không thực sự bắt được lỗi thiếu link modal");
});
