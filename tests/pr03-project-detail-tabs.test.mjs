// PHASE 4 (`PR-03`) — HỢP ĐỒNG: "Chi tiết dự án thành tab/modal: chung · nhân sự · tổ đội · kho · lịch sử".
//
// Vì sao kiểm ở tầng NGUỒN: bundle đang phục vụ CŨ hơn nguồn (`npm run build` ngoài quyền nhánh này)
// — cùng cách cổng `tests/pr01-project-tabs.test.mjs` đang làm.
//
// ĐIỀU TỆP NÀY KHẲNG ĐỊNH (yêu cầu người dùng chốt 20/09): phần "% TIẾN ĐỘ DỰ ÁN" KHÔNG được bịa.
// Nguồn % đã chốt = NHẬT KÝ THI CÔNG, nhưng nghiệp vụ này CHƯA tồn tại (`projects` không có cột tiến
// độ) ⇒ màn chi tiết phải ĐỂ TRỐNG kèm ghi chú "chưa có nguồn dữ liệu", KHÔNG suy diễn %.
//
// Chạy:  node --test tests/pr03-project-detail-tabs.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const detailSource = readFileSync(new URL("../app/screens/ProjectDetailTabs.tsx", import.meta.url), "utf8");

const pmStart = pageSource.indexOf("function ProjectManagement(");
const pmEnd = pageSource.indexOf("function ProjectProgress(", pmStart);
assert.ok(pmStart > 0 && pmEnd > pmStart, "Không tách được `ProjectManagement` trong app/page.tsx");
const pm = pageSource.slice(pmStart, pmEnd);
const detailStart = pm.indexOf("// =========================== CHI TIẾT");
assert.ok(detailStart > 0, "Không tách được nhánh CHI TIẾT của màn dự án");
const detailBranch = pm.slice(detailStart);

test("PR-03 — có ĐÚNG 5 tab con, nhãn khớp NGUYÊN VĂN roadmap (chung · nhân sự · tổ đội · kho · lịch sử)", () => {
  const match = detailSource.match(/PROJECT_DETAIL_SUB_TABS\s*=\s*\[([^\]]*)\]/);
  assert.ok(match, "Không tìm thấy hằng số `PROJECT_DETAIL_SUB_TABS`");
  const labels = match[1].split(",").map((item) => item.trim().replace(/^"|"$/g, "")).filter(Boolean).map((item) => item.toLocaleLowerCase("vi"));
  assert.deepEqual(labels, ["chung", "nhân sự", "tổ đội", "kho", "lịch sử"], `Nhãn tab con không khớp roadmap: ${JSON.stringify(labels)}`);
});

test("PR-03 — mỗi tab con có NỘI DUNG + dùng DỮ LIỆU THẬT (không bảng dữ liệu mới)", () => {
  for (const key of ["chung", "nhansu", "todoi", "kho", "lichsu"]) {
    assert.match(detailSource, new RegExp(`section === "${key}"`), `Thiếu nhánh nội dung cho tab con \`${key}\``);
  }
  // Dữ liệu THẬT của từng tab — đúng tên bảng/cột đã xác minh trong payload bootstrap.
  assert.match(detailSource, /userScopes/, "Tab nhân sự/lịch sử phải dùng `user_project_scopes` (data.userScopes)");
  assert.match(detailSource, /data\.teams/, "Tab tổ đội phải dùng `teams`");
  assert.match(detailSource, /data\.teamMembers/, "Tab tổ đội phải dùng `team_members`");
  assert.match(detailSource, /data\.warehouses/, "Tab kho phải dùng `warehouses`");
  assert.match(detailSource, /joinedAt/, "Tab lịch sử phải dùng mốc thật `user_project_scopes.joined_at`");
  assert.match(detailSource, /receivedAt/, "Tab lịch sử phải dùng mốc thật `goods_receipts.received_at`");
  assert.match(detailSource, /requestedAt/, "Tab lịch sử phải dùng mốc thật `material_requests.requested_at`");
  assert.match(detailSource, /orderedAt/, "Tab lịch sử phải dùng mốc thật `purchase_orders.ordered_at`");
  assert.doesNotMatch(detailSource, /project_members/, "KHÔNG được dựng bảng dữ liệu mới (`project_members` không tồn tại)");
});

test("PR-03 — màn dự án tái dùng component chi tiết (PR-01 GIỮ NGUYÊN dải 6 tab)", () => {
  assert.match(pageSource, /from "@\/app\/screens\/ProjectDetailTabs"/, "page.tsx chưa dùng component chi tiết dự án mới");
  for (const index of [1, 2, 3, 4]) {
    assert.match(detailBranch, new RegExp(`\\{tab === ${index} &&[^\\n]*<ProjectDetailTabs`), `Nhánh chi tiết chỉ số ${index} chưa render \`ProjectDetailTabs\``);
  }
  assert.match(detailBranch, /\{tab === 5 && <SiteCommandScreen/, "Tab BCH (chỉ số 5) phải giữ nguyên như PR-01");
});

test("PR-03 — % TIẾN ĐỘ: ĐỂ TRỐNG có ghi chú, KHÔNG bịa công thức", () => {
  assert.match(detailSource, /data-progress-source="unavailable"/, "Thiếu dấu hiệu KHÔNG có nguồn dữ liệu tiến độ");
  assert.match(detailSource, /CHƯA CÓ NGUỒN DỮ LIỆU TIẾN ĐỘ/, "Thiếu ghi chú 'chưa có nguồn dữ liệu tiến độ'");
  assert.match(detailSource, /NHẬT KÝ THI CÔNG/, "Ghi chú phải nêu đúng nguồn đã chốt (nhật ký thi công) đang chờ nghiệp vụ");
  // ĐỐI CHỨNG ÂM: không được có công thức % tiến độ suy diễn trong khu chi tiết dự án.
  const forbidden = [/progressActual/, /actualProgress/, /progressPlan/, /Kpi[^\n]*percent=/];
  for (const pattern of forbidden) {
    assert.doesNotMatch(detailSource, pattern, `Phát hiện công thức % tiến độ bịa trong chi tiết dự án: ${pattern}`);
  }
});
