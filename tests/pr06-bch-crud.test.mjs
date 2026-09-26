// PHASE 4 (`PR-06`) — HỢP ĐỒNG: "BCH: thêm/sửa/xoá theo quyền + link entity mở modal".
//
// Ba điều tệp này khẳng định:
//   1. QUYỀN: cổng quyền của BCH là HÀM THẬT (`app/screens/project-bch-permissions.ts`) — tệp này
//      TRÍCH nguyên văn thân hàm rồi CHẠY với ≥2 người dùng GIẢ LẬP (admin · người thiếu quyền).
//   2. ACTION THẬT: mọi lệnh ghi dùng action ĐÃ CÓ trong `scripts/system-route.mjs`
//      (`set_organization_unit_member` · `save_organization_unit` · `set_organization_unit_status`),
//      KHÔNG có action mới nào được bịa ra.
//   3. LINK ENTITY: mỗi thành viên/đơn vị BCH bấm vào mở `EntityDetailModal`.
//
// Chạy:  node --test tests/pr06-bch-crud.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const pageSource = readFileSync(new URL("../app/page.tsx", import.meta.url), "utf8");
const permSource = readFileSync(new URL("../app/screens/project-bch-permissions.ts", import.meta.url), "utf8");
const routeSource = readFileSync(new URL("../scripts/system-route.mjs", import.meta.url), "utf8");

const bchStart = pageSource.indexOf("function SiteCommandScreen(");
const bchEnd = pageSource.indexOf("function userPermissionSpec(", bchStart);
assert.ok(bchStart > 0 && bchEnd > bchStart, "Không tách được `SiteCommandScreen` trong app/page.tsx");
const bch = pageSource.slice(bchStart, bchEnd);

/** Trích NGUYÊN VĂN thân hàm `export function <name>(…)` rồi chạy bằng JS thuần. */
function extractFunction(source, name, ...argNames) {
  const start = source.indexOf(`export function ${name}(`);
  assert.ok(start > 0, `Không tìm thấy \`export function ${name}\``);
  const bodyStart = source.indexOf("{", start);
  const bodyEnd = source.indexOf("\n}", bodyStart);
  assert.ok(bodyStart > 0 && bodyEnd > bodyStart, `Không xác định được thân hàm \`${name}\``);
  const body = source.slice(bodyStart + 1, bodyEnd);
  assert.doesNotMatch(body, /:\s*(string|boolean|number|Row)\b/, `Thân hàm \`${name}\` chứa cú pháp TypeScript ⇒ không chạy được bằng JS thuần`);
  return new Function(...argNames, body);
}

const bchGates = extractFunction(permSource, "bchGates", "isAdmin", "permission");

// --- 2 người dùng giả lập: (1) admin, (2) người chỉ có quyền XEM của module `site_command` -------
const adminGates = bchGates(true, {});
const viewerGates = bchGates(false, { canView: 1, canUse: 1, canCreate: 0, canEdit: 0, canApprove: 0, canExport: 1 });
const editorGates = bchGates(false, { canView: 1, canUse: 1, canCreate: 1, canEdit: 1, canApprove: 0, canExport: 1 });

test("PR-06 — cổng quyền BCH: ADMIN bấm được MỌI thao tác", () => {
  for (const gate of ["canAddUnit", "canEditUnit", "canStopUnit", "canAddMember", "canMoveMember", "canRemoveMember"]) {
    assert.equal(adminGates[gate], true, `Admin phải được phép \`${gate}\``);
  }
});

test("PR-06 — người THIẾU quyền bị CHẶN ở mọi thao tác ghi (nhưng vẫn xem được)", () => {
  assert.equal(viewerGates.canView, true, "Người có quyền XEM vẫn phải xem được BCH");
  for (const gate of ["canAddUnit", "canEditUnit", "canStopUnit", "canAddMember", "canMoveMember", "canRemoveMember"]) {
    assert.equal(viewerGates[gate], false, `Người thiếu quyền ghi KHÔNG được phép \`${gate}\``);
  }
  for (const gate of ["canAddUnit", "canEditUnit", "canStopUnit", "canAddMember", "canMoveMember", "canRemoveMember"]) {
    assert.equal(editorGates[gate], true, `Người có quyền SỬA phải được phép \`${gate}\``);
    assert.notEqual(viewerGates[gate], editorGates[gate], `Cổng \`${gate}\` không phân biệt được 2 người dùng ⇒ cổng vô nghĩa`);
  }
});

test("PR-06 — màn BCH nối cổng quyền với module THẬT `site_command` và hiện `disabled` khi thiếu quyền", () => {
  assert.match(bch, /bchGates\(isAdminUser\(data\.user\), modulePermission\(data, "site_command"\)\)/, "Cổng quyền BCH chưa lấy từ `modulePermission(data, \"site_command\")`");
  for (const gate of ["canAddUnit", "canEditUnit", "canStopUnit", "canAddMember", "canMoveMember", "canRemoveMember"]) {
    assert.match(bch, new RegExp(`disabled=\\{!${gate}\\}`), `Nút của \`${gate}\` chưa gắn \`disabled={!${gate}}\``);
  }
});

test("PR-06 — THÊM / SỬA / XOÁ chỉ gọi ACTION THẬT đã có trong hệ thống (KHÔNG tạo action mới)", () => {
  const used = new Set([...bch.matchAll(/action\("([a-z_]+)"/g)].map((m) => m[1]));
  for (const name of ["set_organization_unit_member", "save_organization_unit", "set_organization_unit_status"]) {
    assert.ok(used.has(name), `Vùng BCH chưa gọi action thật \`${name}\``);
    assert.match(routeSource, new RegExp(`action === "${name}"`), `Action \`${name}\` KHÔNG tồn tại trong scripts/system-route.mjs ⇒ bịa action`);
  }
  // ĐỐI CHỨNG ÂM: tên action bịa KHÔNG được phép xuất hiện.
  for (const name of ["create_bch_member", "delete_bch_member", "update_bch_member", "save_bch"]) {
    assert.doesNotMatch(bch, new RegExp(name), `Phát hiện action KHÔNG tồn tại trong hệ thống: ${name}`);
  }
});

test("PR-06 — LINK ENTITY: mỗi thành viên BCH bấm vào mở modal; dự án của BCH cũng mở modal", () => {
  assert.match(bch, /openEntity\("user",\s*m\)/, "Thành viên BCH chưa mở khoá `EntityDetailModal` (User)");
  assert.match(bch, /openEntity\("project",\s*projectRow\)/, "Dòng Ban chỉ huy chưa mở khoá `EntityDetailModal` (Project)");
});

test("PR-06 — ĐỐI CHỨNG ÂM: cổng quyền chạy trên bản mã đã GỠ kiểm quyền thì PHẢI ĐỎ", () => {
  assert.match(permSource, /canEdit = isAdmin \|\| Boolean\(caps\.canEdit\)/, "Không tìm thấy biểu thức kiểm quyền SỬA để làm đối chứng âm");
  const stripped = permSource.replace(/Boolean\(caps\.canEdit\)/g, "true");
  const strippedGates = extractFunction(stripped, "bchGates", "isAdmin", "permission");
  assert.notDeepEqual(strippedGates(false, { canView: 1, canEdit: 0 }), viewerGates, "Bản mã gỡ kiểm quyền vẫn cho kết quả như bản thật ⇒ phép kiểm vô nghĩa");
  assert.throws(() => assert.equal(strippedGates(false, { canView: 1, canEdit: 0 }).canRemoveMember, false), "Đối chứng âm thất bại");
});
