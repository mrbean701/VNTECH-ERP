// PHASE 2 (§6 · §23 · §24) — HỢP ĐỒNG «LUỒNG DUYỆT PR LÀ WORKFLOW ĐỘNG, KHÔNG HARD-CODE».
//
// CHỈ ĐẠO NGƯỜI DÙNG (21/09/2026) — nguyên văn:
//   (1) «luồng duyệt chính là workflow động, bao nhiêu bước không quan trọng chỉ cần nó có khả năng flexible
//        là được, workflow thay đổi thì luồng duyệt cũng thay đổi theo.»
//   (2) «luồng duyệt hiện tại tôi muốn thực hiện là giống như bản đặc tả, mỗi tác nhân đóng vai trò như 1 người
//        duyệt, không tính người tạo đơn (canCreatePR).»
//   (3) «đây là luồng duyệt của đơn đề nghị mua hàng nên tất cả các user đều có quyền tạo.»
//   (5) «không xoá bất cứ table hay trường nào khi chưa hỏi.»
//
// ĐO Ở 3 TẦNG (vì lượt này BỊ CẤM build/khởi động dịch vụ ⇒ DOM chỉ có nghĩa sau khi build):
//   A. TẦNG HÀM THUẦN — import `lib/p2-approval-flow.mjs` và đo BẰNG DỮ LIỆU: luồng suy từ catalog nào thì ra
//      đúng luồng đó (3 bước, 4 bước, 6 bước, đổi thứ tự), và NGƯỜI TẠO không bao giờ tự duyệt đơn của mình.
//   B. TẦNG NGUỒN ENGINE — `scripts/system-route.mjs` phải ĐỌC bước từ `approval_stage_catalog`, KHÔNG còn literal
//      tên/vai trò cho bước 101/102/103, KHÔNG còn mốc `stage < 100`.
//   C. TẦNG CẤU HÌNH — migration phải SEED mặc định 4 bước đúng đặc tả §6 (Thư ký TGĐ → Phòng Dự án →
//      Phòng Kế hoạch → Giám đốc), CHỈ THÊM (không DROP/DELETE), và cấp quyền TẠO PR cho MỌI user hiện có.
//
// Chạy riêng:  node --import tsx --test tests/p2-approval-dynamic.test.mjs
// (tệp CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  STAGE_KIND_APPROVAL,
  STAGE_KIND_SUPPLY,
  matchedStageRole,
  parseStageRoles,
  resolveApprovalFlow,
} from "../lib/p2-approval-flow.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(path.join(ROOT, rel), "utf8");

const ROUTE = read("scripts/system-route.mjs");
const PAGE = read("app/page.tsx");
/** Bỏ CHÚ THÍCH trước khi soi literal: ghi chú được phép nhắc tên bước để giải thích, MÃ THI HÀNH thì không. */
const stripComments = (source) => source.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^[ \t]*\/\/.*$/gm, " ");
const ROUTE_CODE = stripComments(ROUTE);
const DRIZZLE = "drizzle/0161_p2_pr_approval_dynamic_default.sql";
const FLYWAY = "java-backend/infrastructure/src/main/resources/db/migration/V21__p2_pr_approval_dynamic_default.sql";

// ── CATALOG MẪU ĐÚNG ĐẶC TẢ §6 (dữ liệu, KHÔNG phải mã nguồn) ────────────────────────────────────────
const SPEC_CATALOG = [
  { id: "T2", stage_no: 2, name: "Thư ký Tổng giám đốc", allowed_role_codes: "thuky,thu_ky_tgd", approval_mode: "single", sla_hours: 12, auto_approve_on_submit: 0, active: 1, sort_order: 10, stage_kind: "approval" },
  { id: "T3", stage_no: 3, name: "Phòng Dự án", allowed_role_codes: "project,da_nv", approval_mode: "single", sla_hours: 24, auto_approve_on_submit: 0, active: 1, sort_order: 20, stage_kind: "approval" },
  { id: "T4", stage_no: 4, name: "Phòng Kế hoạch", allowed_role_codes: "procurement,kh_nv", approval_mode: "single", sla_hours: 24, auto_approve_on_submit: 0, active: 1, sort_order: 30, stage_kind: "approval" },
  { id: "T5", stage_no: 5, name: "Giám đốc", allowed_role_codes: "director,tgd,giam_doc", approval_mode: "single", sla_hours: 12, auto_approve_on_submit: 0, active: 1, sort_order: 40, stage_kind: "approval" },
];
const BUILDER = { id: "U-KSDA", role: "ksda", roleBase: "engineer" };
const SECRETARY = { id: "U-THUKY", role: "thuky", roleBase: "director" };
const DIRECTOR = { id: "U-GD", role: "director", roleBase: "director" };

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// A. TẦNG HÀM THUẦN — luồng SUY TỪ DỮ LIỆU (bao nhiêu bước cũng được)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("§23 — luồng suy TỪ catalog: đổi dữ liệu ⇒ đổi luồng (3 bước, 4 bước, 6 bước đều chạy)", () => {
  const four = resolveApprovalFlow(SPEC_CATALOG, BUILDER);
  assert.deepEqual(
    four.steps.map((s) => s.name),
    ["Thư ký Tổng giám đốc", "Phòng Dự án", "Phòng Kế hoạch", "Giám đốc"],
    "Luồng mặc định phải ĐÚNG thứ tự đặc tả §6"
  );
  assert.equal(four.complete, false);
  assert.equal(four.currentStageNo, 2, "Bước đang chờ đầu tiên phải là bước 2 (Thư ký TGĐ)");

  // CÙNG hàm, catalog KHÁC ⇒ luồng KHÁC (bằng chứng không hard-code số bước).
  const three = resolveApprovalFlow(SPEC_CATALOG.slice(0, 3), BUILDER);
  assert.equal(three.steps.length, 3);
  const six = resolveApprovalFlow(
    [...SPEC_CATALOG, { stage_no: 6, name: "Kiểm toán nội bộ", allowed_role_codes: "accountant", approval_mode: "single", sla_hours: 8, active: 1, sort_order: 50, stage_kind: "approval" },
      { stage_no: 7, name: "Hội đồng", allowed_role_codes: "director,accountant", approval_mode: "all_roles", sla_hours: 8, active: 1, sort_order: 60, stage_kind: "approval" }],
    BUILDER
  );
  assert.equal(six.steps.length, 6, "Thêm 2 bước vào catalog ⇒ luồng có 6 bước (KHÔNG bị chặn ở 4/5)");
  assert.deepEqual(six.steps.map((s) => s.stageNo), [2, 3, 4, 5, 6, 7]);

  // Đổi THỨ TỰ bằng dữ liệu (sort_order) ⇒ luồng đổi theo.
  const reordered = resolveApprovalFlow(
    SPEC_CATALOG.map((row) => ({ ...row, sort_order: 100 - Number(row.sort_order) })),
    BUILDER
  );
  assert.deepEqual(reordered.steps.map((s) => s.stageNo), [5, 4, 3, 2], "Đổi `sort_order` phải đổi THỨ TỰ duyệt");
  // Bước không hoạt động và bước cung ứng (101/102/103) KHÔNG được lọt vào chuỗi duyệt hồ sơ.
  const withNoise = resolveApprovalFlow(
    [...SPEC_CATALOG, { stage_no: 1, name: "CHT xác nhận nhu cầu", allowed_role_codes: "commander,cht", approval_mode: "single", active: 0, stage_kind: "approval" },
      { stage_no: 101, name: "Lập & phát hành PO", allowed_role_codes: "procurement", approval_mode: "single", active: 1, stage_kind: "supply" }],
    BUILDER
  );
  assert.deepEqual(withNoise.steps.map((s) => s.stageNo), [2, 3, 4, 5], "Bước `active=0` và bước `stage_kind='supply'` không thuộc chuỗi duyệt phiếu");
});

test("§6 — «mỗi tác nhân = 1 người duyệt»: SLA/approval_mode/role đọc NGUYÊN từ catalog", () => {
  const flow = resolveApprovalFlow(SPEC_CATALOG, BUILDER);
  assert.deepEqual(flow.steps.map((s) => s.slaHours), [12, 24, 24, 12], "SLA phải lấy từ dữ liệu cấu hình");
  assert.deepEqual(flow.steps.map((s) => s.approvalMode), ["single", "single", "single", "single"], "Mặc định mỗi tác nhân là MỘT người duyệt");
  assert.deepEqual(flow.steps.map((s) => s.allowedRoleCodes), ["thuky,thu_ky_tgd", "project,da_nv", "procurement,kh_nv", "director,tgd,giam_doc"]);
  assert.equal(flow.steps.filter((s) => s.autoApproved).length, 0, "Người tạo là kỹ sư (không trùng vai trò duyệt) ⇒ KHÔNG bước nào được tự duyệt");
  assert.deepEqual(parseStageRoles(" thuky , thu_ky_tgd ,, "), ["thuky", "thu_ky_tgd"]);
  assert.equal(matchedStageRole(SPEC_CATALOG[0], SECRETARY), "thuky", "Khớp theo mã vai trò trực tiếp");
  assert.equal(matchedStageRole(SPEC_CATALOG[2], { role: "kh_nv", roleBase: "procurement" }), "kh_nv");
  assert.equal(matchedStageRole(SPEC_CATALOG[3], { role: "giam_doc", roleBase: "director" }), "giam_doc");
  assert.equal(matchedStageRole(SPEC_CATALOG[0], BUILDER), "", "Kỹ sư không thuộc bước Thư ký");
});

test("§23 — hàm thuần nhận ĐÚNG hình dạng dữ liệu ENGINE thật trả về (`stageNo`,`allowedRoleCodes`,`slaHours`…)", () => {
  // `approvalStages()` trong `scripts/system-route.mjs` trả về ALIAS camelCase (stageNo/allowedRoleCodes/
  // approvalMode/slaHours/autoApproveOnSubmit/sortOrder) + `active` + `stageKind`. Nếu hàm thuần chỉ đọc
  // snake_case thì mọi bước thành `stageNo=0` ⇒ hỏng luồng thật (đã xảy ra: 1 ca regression đỏ).
  const ENGINE_SHAPE = SPEC_CATALOG.map((row) => ({
    stageNo: row.stage_no,
    name: row.name,
    description: row.description || "",
    allowedRoleCodes: row.allowed_role_codes,
    approvalMode: row.approval_mode,
    slaHours: row.sla_hours,
    autoApproveOnSubmit: row.auto_approve_on_submit,
    active: row.active,
    sortOrder: row.sort_order,
    stageKind: row.stage_kind,
  }));
  const flow = resolveApprovalFlow(ENGINE_SHAPE, BUILDER);
  assert.deepEqual(flow.steps.map((s) => s.stageNo), [2, 3, 4, 5], "Phải đọc được `stageNo` (camelCase) của engine");
  assert.equal(flow.currentStageNo, 2);
  assert.deepEqual(flow.steps.map((s) => s.slaHours), [12, 24, 24, 12]);
  assert.deepEqual(flow.steps.map((s) => s.allowedRoleCodes), ["thuky,thu_ky_tgd", "project,da_nv", "procurement,kh_nv", "director,tgd,giam_doc"]);
  const secretary = resolveApprovalFlow(ENGINE_SHAPE, SECRETARY);
  assert.equal(secretary.steps[0].autoApproved, true, "Loại người tạo phải chạy cả với dữ liệu camelCase");
  assert.equal(secretary.currentStageNo, 3);
  // Bước cung ứng + bước ngừng áp dụng vẫn bị loại khỏi chuỗi khi dữ liệu ở dạng camelCase.
  const noise = resolveApprovalFlow([...ENGINE_SHAPE, { stageNo: 101, name: "Lập & phát hành PO", allowedRoleCodes: "procurement", approvalMode: "single", slaHours: 24, active: 1, sortOrder: 110, stageKind: "supply" }], BUILDER);
  assert.deepEqual(noise.steps.map((s) => s.stageNo), [2, 3, 4, 5]);
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// B. TẦNG NGUỒN ENGINE — không còn literal bước duyệt
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("§23 — `scripts/system-route.mjs` KHÔNG còn literal tên/vai trò của bước 101/102/103", () => {
  assert.doesNotMatch(ROUTE_CODE, /Lập & phát hành PO/, "Tên bước «Lập & phát hành PO» phải nằm trong DỮ LIỆU, không trong mã thi hành");
  assert.doesNotMatch(ROUTE_CODE, /BCH xác nhận giao hàng/, "Tên bước «BCH xác nhận giao hàng» phải nằm trong DỮ LIỆU");
  assert.doesNotMatch(ROUTE_CODE, /stage\s*===\s*101/, "Không được rẽ nhánh `stage === 101`");
  assert.doesNotMatch(ROUTE_CODE, /stage\s*===\s*102/, "Không được rẽ nhánh `stage === 102`");
  assert.doesNotMatch(ROUTE_CODE, /stage\s*===\s*103/, "Không được rẽ nhánh `stage === 103`");
  assert.doesNotMatch(ROUTE_CODE, /procurement,kh_nv,kh_truong'/, "Danh sách vai trò duyệt của bước 101 phải nằm trong DỮ LIỆU");
  assert.doesNotMatch(ROUTE_CODE, /warehouse,thu_kho'/, "Danh sách vai trò của bước 102 phải nằm trong DỮ LIỆU");
  assert.doesNotMatch(ROUTE_CODE, /stage\s*<\s*100[^\n]{0,60}approval_stage_catalog/, "Không được dùng mốc cứng `stage < 100` để phân biệt bước duyệt với bước cung ứng");
  assert.doesNotMatch(ROUTE_CODE, /stage\s*>\s*0\s*&&\s*stage\s*<\s*100/, "Không được dùng mốc cứng `stage > 0 && stage < 100`");
  // Đối chứng NGƯỢC (chống test rỗng): hàm bỏ chú thích phải thực sự bỏ được, còn mã thật thì vẫn còn.
  assert.doesNotMatch(stripComments("// Lập & phát hành PO\nconst a = 1;"), /Lập & phát hành PO/);
  assert.match(stripComments("const a = 'Lập & phát hành PO';"), /Lập & phát hành PO/);
});

test("§23 — engine ĐỌC bước duyệt từ `approval_stage_catalog` (một nguồn), phân loại bằng `stage_kind`", () => {
  assert.match(ROUTE, /stage_kind/, "Engine phải phân loại bước bằng cột dữ liệu `stage_kind`");
  assert.match(ROUTE, /stage_kind\s*=\s*'approval'/i, "Chuỗi duyệt phiếu phải lọc `stage_kind='approval'`");
  assert.match(ROUTE, /FROM approval_stage_catalog WHERE stage_no=\? AND active=1/, "Phải tra cấu hình bước theo `stage_no` trong catalog");
  assert.doesNotMatch(ROUTE, /:\s*\{\s*stageNo:\s*stage,/, "Không được có nhánh dự phòng literal cho bước không có trong catalog");
  // Luồng phải suy qua hàm thuần dùng chung (một nguồn sự thật cho cả tạo mới lẫn gửi lại).
  assert.match(ROUTE, /import \{[^}]*resolveApprovalFlow[^}]*\} from "\.\.\/lib\/p2-approval-flow\.mjs"/, "Engine phải dùng `resolveApprovalFlow` từ lib dùng chung");
  assert.match(ROUTE, /resolveApprovalFlow\(stages,\s*user\)/, "Khi tạo phiếu phải suy luồng từ catalog + NGƯỜI TẠO để loại người tạo khỏi chuỗi duyệt");
  const createBlock = ROUTE_CODE.slice(ROUTE_CODE.indexOf('if (action === "create_request")'), ROUTE_CODE.indexOf('if (action === "update_returned_request")'));
  const resubmitBlock = ROUTE_CODE.slice(ROUTE_CODE.indexOf('if (action === "resubmit_request")'), ROUTE_CODE.indexOf('if (action === "delete_request")'));
  assert.match(createBlock, /resolveApprovalFlow\(stages,\s*user\)/, "TẠO phiếu mới phải suy luồng từ catalog");
  assert.match(resubmitBlock, /resolveApprovalFlow\(stages,\s*user\)/, "GỬI LẠI phiếu cũng phải suy luồng từ catalog (không tự viết lại hình dạng luồng)");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// C. NGƯỜI TẠO KHÔNG TỰ DUYỆT ĐƠN CỦA MÌNH
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("§6 + chỉ đạo (2) — người lập phiếu TRÙNG vai trò duyệt thì BỎ QUA bước đó (không tự duyệt)", () => {
  const bySecretary = resolveApprovalFlow(SPEC_CATALOG, SECRETARY);
  const step1 = bySecretary.steps.find((s) => s.stageNo === 2);
  assert.equal(step1.autoApproved, true, "Thư ký TGĐ lập phiếu ⇒ bước «Thư ký TGĐ» phải được bỏ qua");
  assert.match(step1.autoApproveReason, /người lập phiếu|trùng vai trò/i, "Bước bị bỏ qua phải ghi RÕ lý do để còn vết kiểm toán");
  assert.equal(bySecretary.currentStageNo, 3, "Hồ sơ phải chuyển NGAY sang bước kế tiếp (Phòng Dự án), không chờ chính người lập");
  // `role_catalog` ghi `thuky.base_role='director'` (Thư ký TGĐ thuộc cấp Ban giám đốc) ⇒ theo ĐÚNG vị từ thẩm
  // quyền hiện có của engine (`allowed.includes(role) || allowed.includes(roleBase)` — xem `canApproveStage`),
  // người này cũng có thẩm quyền ở bước «Giám đốc» ⇒ KHÔNG được tự duyệt cả bước đó. Đây là CÙNG một vị từ,
  // KHÔNG phải ngoại lệ: vị từ dùng để cho phép duyệt cũng chính là vị từ dùng để loại người tạo.
  assert.deepEqual(bySecretary.steps.filter((s) => !s.autoApproved).map((s) => s.stageNo), [3, 4], "Bỏ qua mọi bước mà NGƯỜI TẠO có thẩm quyền duyệt (kể cả theo vai trò nền)");
  assert.equal(bySecretary.complete, false);

  const byDirector = resolveApprovalFlow(SPEC_CATALOG, DIRECTOR);
  assert.deepEqual(byDirector.steps.filter((s) => s.autoApproved).map((s) => s.stageNo), [5], "Giám đốc lập phiếu ⇒ chỉ bước Giám đốc bị bỏ qua");
  assert.equal(byDirector.currentStageNo, 2);

  // NGƯỜI TẠO LÀ KỸ SƯ (không có thẩm quyền duyệt bước nào) ⇒ giữ ĐỦ 4 bước của đặc tả, không bỏ qua bước nào.
  assert.deepEqual(resolveApprovalFlow(SPEC_CATALOG, BUILDER).steps.map((s) => s.stageNo), [2, 3, 4, 5]);

  // Vị từ loại-người-tạo phải TRÙNG vị từ thẩm quyền duyệt của engine (không được tự nghĩ luật thứ hai).
  assert.match(ROUTE_CODE, /allowed\.includes\(user\.role\)\s*\|\|\s*allowed\.includes\(effectiveRole\(user\)\)/, "Engine duyệt bước theo `role` HOẶC `roleBase`");
  assert.match(read("lib/p2-approval-flow.mjs"), /for \(const candidate of \[role, base\]\)/, "Hàm loại người tạo cũng khớp theo `role` HOẶC `roleBase` — cùng một luật");

  // Người tạo trùng HẾT các bước (dữ liệu chỉ còn 1 bước) ⇒ hồ sơ hoàn tất ngay, KHÔNG có bước nào chờ chính họ.
  const single = resolveApprovalFlow([SPEC_CATALOG[1]], { role: "da_nv", roleBase: "project" });
  assert.equal(single.complete, true, "Người tạo là người duyệt DUY NHẤT ⇒ luồng tự hoàn tất, không treo");
  assert.equal(single.currentStageNo, 0);

  // `approval_mode='all_roles'`: chỉ MIỄN vai trò của người lập, các vai trò khác vẫn phải duyệt.
  const joint = [{ id: "J", stage_no: 9, name: "DA + KH xác nhận", allowed_role_codes: "da_truong,kh_truong", approval_mode: "all_roles", sla_hours: 8, active: 1, stage_kind: "approval" }];
  const waiveOne = resolveApprovalFlow(joint, { role: "da_truong", roleBase: "project" });
  assert.equal(waiveOne.steps[0].autoApproved, false, "Bước song song KHÔNG được bỏ qua toàn bộ khi mới khớp 1 trong 2 vai trò");
  assert.deepEqual(waiveOne.steps[0].waivedRoleCodes, ["da_truong"], "Vai trò của người lập phải được MIỄN, vai trò còn lại vẫn phải duyệt");
  assert.equal(waiveOne.currentStageNo, 9);
});

test("§6 + chỉ đạo (2) — engine ghi VẾT người tạo bị miễn và không đặt Owner cho bước bị bỏ qua", () => {
  assert.match(ROUTE, /waivedRoleCodes/, "Engine phải dùng danh sách vai trò được miễn từ lib");
  assert.match(ROUTE, /waived_requester/, "Vai trò bị miễn phải được ghi vết (không im lặng)");
  assert.match(ROUTE, /stageOwners\.set|requireWorkflowAssignment/, "Bước không bị bỏ qua vẫn phải có Owner theo dự án");
  // Bước tự duyệt/bỏ qua KHÔNG được yêu cầu Owner (nếu không sẽ chặn oan việc tạo phiếu).
  const assignBlock = ROUTE.slice(ROUTE.indexOf("const stageOwners"), ROUTE.indexOf("const stageOwners") + 400);
  assert.match(assignBlock, /autoApproved/, "Vòng lặp phân Owner phải BỎ QUA bước đã tự duyệt/bị miễn");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// D. CẤU HÌNH MẶC ĐỊNH 4 BƯỚC THEO ĐẶC TẢ §6 — CHỈ THÊM, KHÔNG XOÁ
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("§6 — migration seed mặc định 4 bước: Thư ký TGĐ → Phòng Dự án → Phòng Kế hoạch → Giám đốc", () => {
  assert.ok(existsSync(path.join(ROOT, DRIZZLE)), `Thiếu migration SQLite ${DRIZZLE}`);
  assert.ok(existsSync(path.join(ROOT, FLYWAY)), `Thiếu migration MySQL/Flyway ${FLYWAY}`);
  for (const [ten, sql] of [["drizzle", read(DRIZZLE)], ["flyway", read(FLYWAY)]]) {
    for (const hoTen of ["Thư ký Tổng giám đốc", "Phòng Dự án", "Phòng Kế hoạch", "Giám đốc"]) {
      assert.ok(sql.includes(hoTen), `${ten}: thiếu bước «${hoTen}» của đặc tả §6`);
    }
    assert.match(sql, /thuky/, `${ten}: thiếu vai trò Thư ký TGĐ`);
    assert.match(sql, /procurement/, `${ten}: thiếu vai trò Phòng Kế hoạch`);
    assert.match(sql, /director/, `${ten}: thiếu vai trò Giám đốc`);
    assert.match(sql, /stage_kind/, `${ten}: thiếu cột phân loại bước`);
    assert.match(sql, /'supply'/, `${ten}: bước 101/102/103 phải được nạp vào catalog với kind 'supply'`);
    // BƯỚC CUNG ỨNG 101/102/103 phải CÓ TRONG CATALOG (trước đây không có ⇒ admin không sửa được).
    for (const no of [101, 102, 103]) assert.ok(new RegExp(`\\b${no}\\b`).test(sql), `${ten}: thiếu bước ${no} trong catalog`);
    // CHỈ THÊM: cấm xoá bảng/cột/dữ liệu.
    assert.doesNotMatch(sql, /DROP\s+TABLE/i, `${ten}: KHÔNG được DROP TABLE`);
    assert.doesNotMatch(sql, /DROP\s+COLUMN/i, `${ten}: KHÔNG được DROP COLUMN`);
    assert.doesNotMatch(sql, /DELETE\s+FROM/i, `${ten}: KHÔNG được DELETE dữ liệu`);
    assert.doesNotMatch(sql, /TRUNCATE/i, `${ten}: KHÔNG được TRUNCATE`);
  }
  // Bước 1 (CHT xác nhận nhu cầu) không thuộc 4 tác nhân của đặc tả ⇒ NGỪNG áp dụng cho phiếu mới (không xoá).
  assert.match(read(DRIZZLE), /active=0[\s\S]{0,120}stage_no=1|stage_no=1[\s\S]{0,120}active=0/, "drizzle: bước 1 phải chuyển sang ngừng áp dụng (active=0), KHÔNG xoá");
  assert.match(read(FLYWAY), /stage_no=1/, "flyway: phải xử lý bước 1 tường minh");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// E. TƯƠNG THÍCH NGƯỢC (§24) — phiếu đang chạy giữ nguyên luồng đã tạo
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("§24 — phiếu ĐANG CHẠY giữ nguyên luồng: quyết định duyệt đọc SNAPSHOT của chính phiếu", () => {
  assert.match(ROUTE, /FROM approvals a LEFT JOIN approval_stage_catalog cfg[\s\S]{0,200}WHERE a\.request_id=\?/, "`decide_approval` phải đọc các bước từ chính phiếu (không lấy lại catalog)");
  assert.match(ROUTE, /allowed_role_codes_snapshot/, "Phiếu phải lưu snapshot vai trò được duyệt tại thời điểm tạo");
  assert.match(ROUTE, /approval_mode_snapshot/, "Phiếu phải lưu snapshot cách xác nhận tại thời điểm tạo");
  assert.doesNotMatch(ROUTE, /UPDATE approvals SET stage=/, "Không được đổi số bước của phiếu đã tạo");
  assert.doesNotMatch(ROUTE, /DELETE FROM approvals WHERE request_id=\?[^)]*\);?\s*await env\.DB\.batch\(statements\)/, "Tạo phiếu không được xoá lịch sử duyệt cũ");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// F. QUYỀN TẠO PR CHO MỌI USER (chỉ đạo 3)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
test("chỉ đạo (3) — TẠO phiếu đề nghị mua hàng KHÔNG còn giới hạn theo vai trò cứng", () => {
  assert.doesNotMatch(ROUTE_CODE, /requireRole\(user,\s*\["engineer",\s*"commander",\s*"admin"\]\)/, "Chốt `engineer/commander/admin` chặn mọi user khác tạo phiếu — phải bỏ");
  const start = ROUTE_CODE.indexOf('if (action === "create_request")');
  assert.ok(start > 0, "Không tìm thấy `create_request` trong mã thi hành");
  const createRequest = ROUTE_CODE.slice(start, start + 1600);
  assert.doesNotMatch(createRequest, /requireRole\(/, "`create_request` không được chốt cứng vai trò; quyền phải do module/RBAC quyết định");
  // KHÔNG mở toang: quyền tạo vẫn phải đi qua cổng RBAC dùng chung + đúng năng lực `canCreate` của module `requests`.
  assert.match(ROUTE_CODE, /create_request:\s*"requests"/, "`create_request` phải gắn module `requests`");
  assert.match(ROUTE_CODE, /create_request:\s*"canCreate"/, "`create_request` phải đòi năng lực `canCreate`");
  assert.match(ROUTE_CODE, /await requireActionModule\(user, action\)/, "Mọi action phải đi qua cổng RBAC dùng chung `requireActionModule`");
  assert.match(createRequest, /canAccessProject\(user, projectId, true\)/, "Vẫn phải kiểm phạm vi dự án trước khi cho lập phiếu");
});

test("chỉ đạo (3) — migration cấp quyền TẠO PR cho MỌI user hiện có (INSERT/UPDATE, KHÔNG xoá)", () => {
  const sql = read(FLYWAY);
  assert.match(sql, /user_module_permissions/, "Phải cấp vào bảng quyền người dùng `user_module_permissions`");
  assert.match(sql, /module_key='requests'|module_key = 'requests'/, "Phải cấp đúng module «Phiếu đề nghị mua hàng» (`requests`)");
  assert.match(sql, /can_create\s*=\s*1/i, "Phải bật `can_create`");
  assert.match(sql, /FROM users/i, "Phải áp cho MỌI user hiện có (đọc từ bảng `users`)");
  assert.doesNotMatch(sql, /can_approve\s*=\s*1/i, "KHÔNG được nhân tiện cấp quyền DUYỆT cho mọi người");
});

test("chỉ đạo (3) — user MỚI cũng có quyền tạo PR theo MẪU phòng ban (không cần đổi lược đồ)", () => {
  const sql = read(FLYWAY);
  assert.match(sql, /department_module_permissions/, "Mẫu quyền phòng ban phải có dòng cho module `requests`");
  const useCase = read("java-backend/application/src/main/java/com/vntech/erp/application/service/UserManagementUseCase.java");
  assert.match(useCase, /findDepartmentPermission\(orgUnitId, moduleKey\)/, "Java đã seed quyền mới theo MẪU phòng ban — đây là cơ chế cho user mới");
  // JS (đường ghi song song) phải đọc CÙNG nguồn dữ liệu, không tự bịa bảng quyền riêng.
  const replaceDefaults = ROUTE.slice(ROUTE.indexOf("async function replaceDepartmentDefaults"), ROUTE.indexOf("async function canUseModule"));
  assert.match(replaceDefaults, /department_module_permissions/, "JS `replaceDepartmentDefaults` phải đọc CÙNG MẪU phòng ban như Java");
});

test("UI vùng duyệt PR — chuỗi duyệt lấy từ dữ liệu, KHÔNG còn literal [101,102,103]", () => {
  assert.doesNotMatch(PAGE, /\[\[101,/, "Danh sách bước cung ứng phải suy từ catalog, không viết cứng trong UI");
  assert.doesNotMatch(PAGE, /101,102,103/, "Không được viết cứng 101/102/103 trong UI");
  assert.match(PAGE, /stageKind/, "UI phải phân biệt bước duyệt hồ sơ với bước cung ứng bằng `stageKind`");
  const helpers = read("lib/approval-helpers.ts");
  assert.match(helpers, /stageKind|stage_kind/, "Helper dùng chung phải lọc theo loại bước");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
// G. JAVA PARITY — ENGINE ĐANG CHẠY THẬT LÀ JAVA (cổng 9000 → cutover-proxy → 18081 `java -jar …`)
//    ĐO ĐƯỢC 21/09/2026: `java-backend/infrastructure/…/RequestStoreAdapter.java:147` lọc `WHERE active=1`
//    (bỏ sót `stage_kind`), `RequestManagementUseCase.java:63` chốt cứng engineer/commander/admin ⇒ HTTP 403
//    khi tài khoản vai trò `director` gọi `create_request` trên hệ thống thật. Bản Java PHẢI có cùng 4 luật
//    như bản JS, nếu không thì chỉ đạo người dùng chỉ đúng trên đường SSOT mà sai trên đường đang chạy.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════
const JAVA_APP = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const JAVA_INFRA = "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/";

test("JAVA §23 — `approvalStages(true)` phải lọc `stage_kind` và trả `stageKind` (bootstrap + engine)", () => {
  const store = read(`${JAVA_INFRA}RequestStoreAdapter.java`);
  assert.match(store, /approval_mode AS approvalMode,sla_hours AS slaHours,[\s\S]{0,200}COALESCE\(stage_kind,'approval'\) AS stageKind/, "Adapter phải trả `stageKind`");
  assert.match(store, /FROM approval_stage_catalog WHERE active=1 AND stage_kind='approval' ORDER BY stage_no/, "Chuỗi duyệt phải lọc `stage_kind='approval'` (nếu không, 101/102/103 bị ép vào luồng phiếu)");
  const bootstrap = read(`${JAVA_INFRA}BootstrapDataAdapter.java`);
  assert.match(bootstrap, /COALESCE\(stage_kind,'approval'\) AS stageKind/, "Bootstrap phải trả `stageKind` để UI phân biệt hai loại bước");
});

test("JAVA chỉ đạo (3) — TẠO phiếu + ĐỐI CHIẾU FILE không còn chốt cứng vai trò", () => {
  const useCase = read(`${JAVA_APP}RequestManagementUseCase.java`);
  assert.doesNotMatch(useCase, /requireRole\(principalAsCurrent\(principal\),\s*List\.of\("engineer",\s*"commander",\s*"admin"\)\)/, "`createRequest` phải bỏ chốt cứng vai trò");
  const adminOps = read(`${JAVA_APP}AdminOpsManagementUseCase.java`);
  assert.doesNotMatch(adminOps, /requireRole\(principalAsCurrent\(principal\),\s*List\.of\("engineer",\s*"commander",\s*"admin"\)\)/, "`previewRequestImport` phải bỏ chốt cứng vai trò");
});

test("JAVA §6 + chỉ đạo (2) — luật «người tạo không tự duyệt» có thật trong engine Java", () => {
  const useCase = read(`${JAVA_APP}RequestManagementUseCase.java`);
  assert.match(useCase, /private String creatorMatchedStageRole\(/, "Phải có vị từ khớp vai trò người lập phiếu");
  assert.match(useCase, /creatorMatchedStageRole\(stage, principal\)\.isEmpty\(\)\) continue/, "Bước trùng vai trò người tạo phải được BỎ QUA khi kiểm Owner");
  assert.match(useCase, /creator_role_waived/, "Vết kiểm toán phải ghi rõ lý do bỏ bước (không im lặng)");
  // Vị từ phải khớp CẢ `role` và `roleBase` — cùng luật với JS `matchedStageRole`.
  assert.match(useCase, /code\.equals\(role\) \|\| code\.equals\(base\)/, "Khớp theo `role` HOẶC `roleBase` (cùng vị từ thẩm quyền)");
  // `currentStage` của TẠO PHIẾU phải suy từ chính các bước chưa bị bỏ qua (không dùng hình dạng cứng
  // `autoFirst ? stage[1] : stage[0]`). Đo TRONG hàm `createRequest` — luồng GỬI LẠI đã sửa riêng.
  const createBody = useCase.slice(useCase.indexOf("public Map<String, Object> createRequest"), useCase.indexOf("public Map<String, Object> updateReturnedRequest"));
  assert.doesNotMatch(createBody, /autoFirst && stages\.size\(\) > 1/, "Không được giữ hình dạng cứng 2 bước của luồng cũ trong `createRequest`");
  assert.match(createBody, /if \(allAutoComplete\) currentStage = \(int\) numberValue\(gi\(stages\.get\(stages\.size\(\) - 1\), "stageNo"\)\)/, "Hết bước chờ ⇒ luồng tự hoàn tất (bước cuối)");
});
