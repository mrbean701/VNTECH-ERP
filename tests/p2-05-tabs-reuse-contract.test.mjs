import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const projectDetail = readFileSync(new URL("../app/screens/ProjectDetailTabs.tsx", import.meta.url), "utf8");
const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");

test("P2-05 — ProjectDetailTabs dùng một nguồn nhãn 5 tab và truyền cả hai chiều", () => {
  assert.match(projectDetail, /PROJECT_DETAIL_SUB_TABS = \["Chung", "Nhân sự", "Tổ đội", "Kho", "Lịch sử"\]/);
  assert.match(projectDetail, /role="tablist"/);
  assert.match(projectDetail, /role="tab" aria-selected=/);
  assert.match(projectDetail, /onClick=\{\(\) => onSection\(PROJECT_DETAIL_SUB_TAB_KEYS\[index\]\)\}/);
});

test("P2-05 — màn dự án tái dùng ProjectDetailTabs thay vì tạo detail component thứ hai", () => {
  assert.match(page, /import \{ PROJECT_DETAIL_SUB_TABS, ProjectDetailTabs \} from "@\/app\/screens\/ProjectDetailTabs"/);
  for (const tab of [1, 2, 3, 4]) {
    assert.match(page, new RegExp(`\\{tab === ${tab} &&[^\\n]*<ProjectDetailTabs`), `thiếu render ProjectDetailTabs ở nhánh ${tab}`);
  }
});

test("P2-05 — tab nhân sự/tổ đội/kho/lịch sử có nội dung và nguồn dữ liệu thật", () => {
  for (const key of ["nhansu", "todoi", "kho", "lichsu"]) {
    assert.match(projectDetail, new RegExp(`section === "${key}"`), `thiếu nội dung tab ${key}`);
  }
  assert.match(projectDetail, /data\.userScopes/);
  assert.match(projectDetail, /data\.teams/);
  assert.match(projectDetail, /data\.warehouses/);
  assert.match(projectDetail, /const history = events/);
});
