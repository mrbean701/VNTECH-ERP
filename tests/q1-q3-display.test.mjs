// TASK-126 — KIỂM CHỨNG 2 VIỆC HIỂN THỊ: ① `Q1=A` (nhật ký kiểm toán hết lộ GUID) · ② `Q3=B` (mã/phiên bản workflow).
//
// Kỷ luật: test này khoá lại (a) HÀM THUẦN mới ở `lib/` và (b) CHỖ HIỂN THỊ thật trong `app/page.tsx` —
// nếu ai đó trả lại GUID thô vào 2 cột đó hoặc xoá phần hiển thị mã/phiên bản thì test ĐỎ ngay.
//
// ⚠️ Dữ liệu mẫu dưới đây lấy ĐÚNG dạng THẬT đã đo bằng MySQL chỉ-đọc (`vntech_erp`, 2026-09-18):
//    `projects.id = PRJ_<guid>` · `material_requests.id = MR_<guid>` · `purchase_orders.id = PO_<guid>`
//    `materials.id = MAT_<guid>` · `users.id = USR_<guid>` · `audit_logs.entity_type` là chuỗi tự do.

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { NO_SOURCE_TEXT as AUDIT_NO_SOURCE, auditLogDisplay, isTechnicalId } from "../lib/audit-log-display";
import { NO_SOURCE_TEXT as WF_NO_SOURCE, workflowIdentityView } from "../lib/workflow-display";

const PAGE = readFileSync("app/page.tsx", "utf8");

// ── Dữ liệu mẫu: dạng THẬT của payload bootstrap `GET /api/system` (rút gọn còn trường cần thiết). ──
const PROJECT_ID = "PRJ_fdbfab20-bf1f-4ad5-8159-7dcc582140c3";
const REQUEST_ID = "MR_a333870d-7e71-47a1-9479-1985c7d9b37e";
const PO_ID = "PO_b85e4018-b1fd-4b4c-90d2-dfd545f3a3f0";
const MATERIAL_ID = "MAT_d33c5cf5-a5da-44c1-ad4c-72911b51a85e";
const USER_ID = "USR_76575c08-4d16-49fc-8cd8-bde8ae204003";

const DATA = {
  projects: [{ id: PROJECT_ID, code: "PRJ-DEMO-01", name: "Dự án demo" }],
  requests: [{ id: REQUEST_ID, requestNo: "DNMH-PRJ-DEMO-01-2026-0001" }],
  purchaseOrders: [{ id: PO_ID, poNo: "PO-PRJ-DEMO-01-2026-0005" }],
  materials: [{ id: MATERIAL_ID, code: "CTN-ONG-NHUA-001" }],
  users: [{ id: USER_ID, employeeCode: "NV-DA", fullName: "Nguyễn Văn A" }],
};

/** Bất biến trung tâm: KHÔNG chuỗi nào trả về được phép chứa GUID/khoá kỹ thuật. */
function assertNoGuid(value, message) {
  const dump = JSON.stringify(value);
  assert.doesNotMatch(dump, /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i, `${message}: còn lộ GUID ⇒ ${dump}`);
}

test("VIỆC ① — `isTechnicalId` nhận diện đúng khoá kỹ thuật có/không tiền tố miền", () => {
  assert.equal(isTechnicalId(PROJECT_ID), true, "PRJ_<guid> là khoá kỹ thuật");
  assert.equal(isTechnicalId("b85e4018-b1fd-4b4c-90d2-dfd545f3a3f0"), true, "UUID trần là khoá kỹ thuật");
  assert.equal(isTechnicalId("PRJ-DEMO-01"), false, "mã nghiệp vụ KHÔNG được coi là khoá kỹ thuật");
  assert.equal(isTechnicalId("DNMH-PRJ-DEMO-01-2026-0001"), false, "số phiếu nghiệp vụ KHÔNG được coi là khoá kỹ thuật");
});

test("VIỆC ① — đủ nguồn: trả NHÃN TIẾNG VIỆT + MÃ NGHIỆP VỤ, KHÔNG trả GUID", () => {
  const project = auditLogDisplay("projects", PROJECT_ID, DATA);
  assert.equal(project.subjectLabel, "Dự án");
  assert.equal(project.recordCode, "PRJ-DEMO-01");
  assert.equal(project.recordHasSource, true);

  const request = auditLogDisplay("requests", REQUEST_ID, DATA);
  assert.equal(request.subjectLabel, "Phiếu đề nghị mua hàng");
  assert.equal(request.recordCode, "DNMH-PRJ-DEMO-01-2026-0001");

  const po = auditLogDisplay("material_request", PO_ID, DATA);
  assert.equal(po.recordCode, "PO-PRJ-DEMO-01-2026-0005", "tra được theo `id` kể cả khi entity_type lệch danh mục");

  const material = auditLogDisplay("material", MATERIAL_ID, DATA);
  assert.equal(material.subjectLabel, "Vật tư");
  assert.equal(material.recordCode, "CTN-ONG-NHUA-001");

  const user = auditLogDisplay("admin", USER_ID, DATA);
  assert.equal(user.subjectLabel, "Người dùng");
  assert.equal(user.recordCode, "NV-DA", "users → `employeeCode` (đúng đặc tả TASK-126)");

  for (const view of [project, request, po, material, user]) assertNoGuid(view, "VIỆC ① đủ nguồn");
});

test("VIỆC ① — dữ liệu THẬT lệch loại: `entity_type='requests'` nhưng `entity_id='PRJ_…'` ⇒ nhãn theo bản ghi TRA ĐƯỢC", () => {
  const view = auditLogDisplay("requests", PROJECT_ID, DATA);
  assert.equal(view.recordCode, "PRJ-DEMO-01");
  assert.equal(view.recordKind, "Dự án");
  assert.match(view.note, /trỏ tới/, "phải nói rõ loại ghi trong nhật ký khác danh mục tra được (không im lặng đổi nhãn)");
  assertNoGuid(view, "VIỆC ① lệch loại");
});

test("VIỆC ① — thiếu nguồn ⇒ «chưa có nguồn» (KHÔNG bịa, KHÔNG rơi về GUID)", () => {
  assert.equal(AUDIT_NO_SOURCE, "chưa có nguồn");
  const emptyId = auditLogDisplay("create", "", DATA);
  assert.equal(emptyId.recordCode, AUDIT_NO_SOURCE, "entity_id rỗng (37/909 dòng thật) ⇒ chưa có nguồn");
  assert.equal(emptyId.recordHasSource, false);

  const unknownId = auditLogDisplay("teams", "PRJ_ffffffff-ffff-4fff-8fff-ffffffffffff", DATA);
  assert.equal(unknownId.recordCode, AUDIT_NO_SOURCE, "không tìm thấy bản ghi ⇒ chưa có nguồn");

  const noCode = auditLogDisplay("projects", PROJECT_ID, { projects: [{ id: PROJECT_ID, name: "Dự án chưa khai mã" }] });
  assert.equal(noCode.recordCode, AUDIT_NO_SOURCE, "bản ghi có mà không có mã nghiệp vụ ⇒ chưa có nguồn");
  assert.equal(noCode.recordHasSource, false);

  for (const view of [emptyId, unknownId, noCode]) assertNoGuid(view, "VIỆC ① thiếu nguồn");
});

test("VIỆC ① — app/page.tsx KHÔNG còn in GUID thô ở cột «Mã thực thể» và ở khối chi tiết", () => {
  assert.match(PAGE, /import \{ auditLogDisplay \} from "@\/lib\/audit-log-display"/, "page.tsx phải dùng hàm thuần mới");
  assert.doesNotMatch(PAGE, /\{a\.entityId \|\| "—"\}/, "không được in `entityId` thô (GUID) ra UI");
  assert.doesNotMatch(PAGE, /Mã bản ghi: <b>\{a\.id\}<\/b>/, "không được in `a.id` (GUID dòng nhật ký) ra UI");
  assert.match(PAGE, /auditLogDisplay\(a\.entityType, a\.entityId, data\)/, "phải gọi hàm thuần với `entity_type` + `entity_id` + payload");
});

test("VIỆC ② — `workflowIdentityView`: mã lấy từ `code` THẬT, phiên bản KHÔNG có nguồn ⇒ «chưa có nguồn»", () => {
  assert.equal(WF_NO_SOURCE, "chưa có nguồn");
  // `workflowDefinitions` THẬT của payload: SELECT id,code,name,… FROM workflow_definitions (KHÔNG có `version`).
  const def = workflowIdentityView({ id: "WF-MUAHANG", code: "WF-MUAHANG-01", name: "Quy trình mua hàng chuẩn" });
  assert.equal(def.code, "WF-MUAHANG-01", "mã luồng là cột THẬT `workflow_definitions.code`");
  assert.equal(def.codeHasSource, true);
  assert.equal(def.version, WF_NO_SOURCE, "phiên bản KHÔNG có nguồn ⇒ chưa có nguồn, KHÔNG chế số");
  assert.equal(def.versionHasSource, false);
  assert.match(def.note, /version/, "lý do thiếu nguồn phải nói rõ cột nào không tồn tại");

  // Bản ghi `requests` THẬT: chỉ có `approvalStage`, KHÔNG có `workflowId`/`workflowVersion`/`workflowCode`.
  const request = workflowIdentityView({ id: REQUEST_ID, requestNo: "DNMH-PRJ-DEMO-01-2026-0001", approvalStage: 2 });
  assert.equal(request.code, WF_NO_SOURCE, "phiếu không có trường mã luồng ⇒ chưa có nguồn");
  assert.equal(request.version, WF_NO_SOURCE);

  const empty = workflowIdentityView(null);
  assert.equal(empty.code, WF_NO_SOURCE);
  assert.equal(empty.version, WF_NO_SOURCE);
  assertNoGuid(def, "VIỆC ②");
  assertNoGuid(request, "VIỆC ②");
});

test("VIỆC ② — app/page.tsx có hiển thị mã/phiên bản ở dải duyệt + màn Quy trình phê duyệt", () => {
  assert.match(PAGE, /import \{ workflowIdentityView \} from "@\/lib\/workflow-display"/, "page.tsx phải dùng hàm thuần mới");
  assert.match(PAGE, /approvalChainWorkflow/, "dải duyệt phải hiển thị luồng/phiên bản của phiếu đang xử lý");
  assert.match(PAGE, /Mã luồng/, "màn Quy trình phê duyệt phải ghi rõ nhãn «Mã luồng»");
  assert.match(PAGE, /Phiên bản/, "phải hiển thị phiên bản (kể cả khi là «chưa có nguồn»)");
});
