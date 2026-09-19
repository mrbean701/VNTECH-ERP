// PHASE 4 (`PR-01`) — HỢP ĐỒNG MÀN DỰ ÁN: "DANH SÁCH DỰ ÁN" LÀ MỘT TAB RIÊNG.
//
// Vì sao kiểm ở tầng NGUỒN (không phải DOM): ứng dụng đang phục vụ một BẢN BUILD cũ hơn nguồn
// (bài học đã ghi nhiều lần trong dự án: "bằng chứng runtime phải làm SAU khi build lại"), mà
// `npm run build` KHÔNG thuộc quyền của nhánh này. Vì vậy hợp đồng được chốt ở tầng nguồn —
// đúng cách cổng `tests/project-navigation-consolidation.test.mjs` đang làm — và cổng runtime
// `tools/probe-project-screen.mjs` (đã cập nhật theo hợp đồng mới) sẽ đo khi có bản build mới.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên **61** ca.
// Chạy riêng:  node --test tests/pr01-project-tabs.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

const pmStart = source.indexOf("function ProjectManagement(");
assert.ok(pmStart > 0, "Không tìm thấy `ProjectManagement` trong app/page.tsx");
const pmEnd = source.indexOf("function ProjectProgress(", pmStart);
assert.ok(pmEnd > pmStart, "Không xác định được hết thân `ProjectManagement`");
const pm = source.slice(pmStart, pmEnd);

const listStart = pm.indexOf('if (view === "list")');
const detailStart = pm.indexOf("// =========================== CHI TIẾT");
assert.ok(listStart > 0 && detailStart > listStart, "Không tách được nhánh DANH SÁCH / CHI TIẾT");
const listBranch = pm.slice(listStart, detailStart);
const detailBranch = pm.slice(detailStart);

test("PR-01 — dải tab có ĐÚNG một nguồn nhãn, tab 0 là 'Danh sách dự án'", () => {
  assert.match(pm, /const LIST_TAB = "Danh sách dự án";/);
  assert.match(pm, /const DETAIL_TABS = \["Tổng quan", "Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"\];/);
  assert.match(pm, /const TAB_LABELS = \[LIST_TAB, \.\.\.DETAIL_TABS\];/);
});

test("PR-01 — danh sách KHÔNG còn là chế độ xem tách rời (view được SUY RA từ tab)", () => {
  assert.match(pm, /const view: "list" \| "detail" = tab === 0 \? "list" : "detail";/);
  assert.doesNotMatch(pm, /useState<"list" \| "detail">/);
  assert.doesNotMatch(pm, /setView\(/);
});

test("PR-01 — MỘT dải tab dùng chung, render ở CẢ nhánh danh sách lẫn nhánh chi tiết", () => {
  assert.match(pm, /const projectTabs = <div className="project-scope-tabs"/);
  assert.match(listBranch, /\{projectTabs\}/, "Nhánh DANH SÁCH chưa render dải tab ⇒ danh sách vẫn không phải là tab");
  assert.match(detailBranch, /\{projectTabs\}/, "Nhánh CHI TIẾT chưa dùng dải tab dùng chung");
  assert.doesNotMatch(detailBranch, /TABS\.map\(/, "Còn dải tab tự dựng thứ hai trong nhánh chi tiết");
});

test("PR-01 — QUYỀN: tab chi tiết chỉ bật khi đã chọn dự án; nút xuất phụ thuộc canExport", () => {
  assert.match(pm, /disabled=\{index > 0 && !detailId\}/, "Tab chi tiết phải bị khoá khi chưa chọn dự án");
  assert.match(pm, /const canExport = Boolean\(permission\?\.canExport\);/);
  assert.match(listBranch, /disabled=\{!canExport\}/, "Nút xuất danh sách chưa gắn kiểm quyền");
});

test("PR-01 — toolbar danh sách theo khuôn §5: TIÊU ĐỀ + SỐ LƯỢNG ‖ TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG", () => {
  assert.match(listBranch, /count=\{filtered\.length\}/);
  assert.match(listBranch, /total=\{allProjects\.length\}/);
  assert.match(listBranch, /unit="dự án"/);
  assert.match(listBranch, /search=\{/, "Thiếu ô TÌM");
  assert.match(listBranch, /filters=\{\[/, "Thiếu LỌC");
  assert.match(listBranch, /sort=\{\{/, "Thiếu SẮP XẾP");
  assert.match(listBranch, /actions=\{/, "Thiếu nhóm HÀNH ĐỘNG ⇒ toolbar vẫn dồn một phía");
});

test("PR-01 — 5 tab chi tiết giữ nguyên hành vi nhưng lệch chỉ số 1..5 (tab 0 là danh sách)", () => {
  assert.match(detailBranch, /\{tab === 5 && <SiteCommandScreen/);
  for (const index of [1, 2, 3, 4]) {
    assert.match(detailBranch, new RegExp(`\\{tab === ${index} &&`), `Thiếu nhánh tab chi tiết chỉ số ${index}`);
  }
  assert.doesNotMatch(detailBranch, /\{tab === 0 &&/, "Nhánh chi tiết còn giữ chỉ số cũ của tab đầu");
});

test("PR-01 — màn Quản lý dự án được truyền quyền module THẬT (QUYỀN=CHECK)", () => {
  assert.match(
    source,
    /active === "site_command" && <ProjectManagement data=\{data\} project=\{project\} onProject=\{setProject\} open=\{open\} action=\{action\} permission=\{activePermission\} \/>/,
    "Call-site chưa truyền `permission={activePermission}`",
  );
});
