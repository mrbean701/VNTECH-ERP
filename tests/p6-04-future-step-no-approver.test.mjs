// MT2-P6-04 (§4.3) — HỢP ĐỒNG: mỗi bước hiện người duyệt + PHÒNG BAN + thời gian; bước CHƯA TỚI ⛔ không lộ người duyệt.
// Nguyên văn §4.3: «Step đã hoàn thành: tên người duyệt · phòng ban · thời gian duyệt · trạng thái · comment/reason nếu có.
//                  ⛔ Không hiển thị thông tin người duyệt ở step chưa tới.»
// RED trước khi sửa: khối `approval-person` trong dải quy trình đang rơi vào nhánh dự phòng
//   `approval?.approverName || <nhãn allowedRoleCodes>` cho MỌI bước — kể cả bước CHƯA TỚI ⇒ lộ thông tin người duyệt;
//   và bước đã duyệt ⛔ KHÔNG hiện phòng ban.
// Chạy: node --import tsx --test tests/p6-04-future-step-no-approver.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const page = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const flow = page.slice(page.indexOf("approval-detail-pane"), page.indexOf("approval-meta-pane"));

test("P6-04 — bước CHƯA TỚI chỉ hiện «Đang chờ», ⛔ KHÔNG hiện người/nhóm duyệt", () => {
  assert.ok(flow.length > 0, "phải tìm được khối QUY TRÌNH PHÊ DUYỆT");
  assert.match(flow, /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Đang chờ"/,
    "phải có nhánh riêng cho bước chưa tới");
  assert.match(flow, /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Đang chờ"[\s\S]{0,220}roleLabel\(data,code\)/,
    "nhãn vai trò (thông tin người duyệt) chỉ được nằm SAU nhánh chưa-tới");
  assert.match(flow, /Number\(stage\.stageNo\)\s*>\s*currentStage\s*\?\s*"Chưa tới bước này"/,
    "bước chưa tới phải ghi rõ «Chưa tới bước này»");
});

test("P6-04 — bước ĐÃ xử lý hiện PHÒNG BAN (cùng người duyệt · thời gian)", () => {
  assert.match(flow, /Đã xử lý[\s\S]{0,140}approval\?\.department/,
    "bước đã xử lý phải hiện phòng ban của người duyệt (nguồn thật, ⛔ không bịa)");
  assert.match(flow, /data-vntech="approval-step-decided-at"/, "vẫn phải có thời gian duyệt");
});
