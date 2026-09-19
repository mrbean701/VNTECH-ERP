// PHASE 7 (`AD-05`) — HỢP ĐỒNG: BƯỚC «TỔ CHỨC» TÁCH 2 SUB-TAB.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-05`: «Tách sub-tab: **Cơ cấu tổ chức** ‖ **Tổ đội theo dự án**».
//
// Khuôn dùng chung: `U-03` (`ListToolbar`) — đã ĐÓNG. Không thêm khoá module mới, không migration:
// 2 sub-tab là TRẠNG THÁI UI trong cùng bước 2 của màn Quản trị.
//
// ĐỐI CHỨNG ÂM: cổng `subTabGate` phải HỎNG nếu thiếu 1 trong 2 nhãn hoặc đảo thứ tự.
//
// Chạy riêng:  node --test tests/ad05-org-subtabs.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pure = read("app/screens/admin-governance-pure.ts");
const page = read("app/page.tsx");

function loadPure(names) {
  const start = pure.search(/^\/\/ AD-PURE-BEGIN$/m);
  const end = pure.search(/^\/\/ AD-PURE-END$/m);
  const block = pure.slice(start + "// AD-PURE-BEGIN".length, end).replace(/^export /gm, "");
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

const EXPECTED = ["Cơ cấu tổ chức", "Tổ đội theo dự án"];
const subTabGate = (tabs) => JSON.stringify(tabs) === JSON.stringify(EXPECTED);

/** Khối JSX của bước 2 (Tổ chức) trong `Admin`. */
function orgStepBlock() {
  const start = page.indexOf("{step===2&&");
  const end = page.indexOf("{step===3&&", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy nhánh `step===2` của màn Quản trị");
  return page.slice(start, end);
}

test("AD-05 — ĐÚNG 2 sub-tab, ĐÚNG nhãn, ĐÚNG thứ tự nguyên văn", () => {
  const { ORG_SUB_TABS } = loadPure(["ORG_SUB_TABS"]);
  assert.equal(ORG_SUB_TABS.length, 2, "Bước «Tổ chức» phải có ĐÚNG 2 sub-tab");
  assert.deepEqual(ORG_SUB_TABS, EXPECTED, "2 nhãn phải khớp nguyên văn + đúng thứ tự");
  assert.equal(subTabGate(ORG_SUB_TABS), true, "Cổng sub-tab phải ĐẠT với dữ liệu thật");
});

test("AD-05 — ĐỐI CHỨNG ÂM: thiếu «Tổ đội theo dự án» hoặc đảo thứ tự ⇒ cổng HỎNG", () => {
  const { ORG_SUB_TABS } = loadPure(["ORG_SUB_TABS"]);
  assert.equal(subTabGate(["Cơ cấu tổ chức"]), false, "[đối chứng âm 1] thiếu sub-tab thứ 2 phải bị bắt");
  assert.equal(subTabGate([...ORG_SUB_TABS].reverse()), false, "[đối chứng âm 2] đảo thứ tự phải bị bắt");
  assert.equal(subTabGate([]), false, "[đối chứng âm 3] mảng rỗng không được coi là ĐẠT");
});

test("AD-05 — UI: dải sub-tab dựng từ hằng số, cả 2 khối nội dung đều thật", () => {
  const block = orgStepBlock();
  assert.match(block, /ORG_SUB_TABS\.map\(/, "Dải sub-tab phải dựng từ `ORG_SUB_TABS` (một nguồn sự thật)");
  assert.match(block, /data-subtab="org-structure"/, "Sub-tab «Cơ cấu tổ chức» phải có dấu hiệu nhận biết hợp đồng");
  assert.match(block, /data-subtab="org-teams"/, "Sub-tab «Tổ đội theo dự án» phải có dấu hiệu nhận biết hợp đồng");
  assert.match(block, /<OrganizationUnitManager data=\{data\} action=\{action\}\/>/, "Sub-tab 1 phải render `OrganizationUnitManager` THẬT");
  assert.match(block, /data\.teams\.slice\(0,40\)/, "Sub-tab 2 phải render DANH SÁCH TỔ ĐỘI THẬT từ payload");
  assert.match(block, /Tổ đội theo dự án/, "Sub-tab 2 phải giữ tiêu đề «Tổ đội theo dự án»");
});
