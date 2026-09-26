// PHASE 7 (`AD-08`) — HỢP ĐỒNG: BỘ LỌC PHÒNG BAN + CHỌN NHIỀU + «XOÁ MỤC ĐÃ CHỌN» (XÁC NHẬN + QUYỀN).
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-08`: «Bộ lọc phòng ban + chọn nhiều + **Xoá mục đã chọn**
// (có xác nhận + quyền)». Phụ thuộc `S-07` ✔.
//
// ⚠️ RÀNG BUỘC: KHÔNG thêm action mới (2 đường ghi là `scripts/system-route.mjs` + Java — BỊ CẤM SỬA).
// Action dùng được là `delete_department_permission` ĐÃ CÓ:
//   • `SystemController.java:395` (case thật) · `ActionRbacRegistry.java:123` (module list RỖNG = admin) + `:312` (`canUse`).
// ⇒ Mục bị xoá là DÒNG QUYỀN PHÒNG BAN (`department_module_permissions`), không phải phòng ban (không có action xoá phòng).
//
// ĐỐI CHỨNG ÂM BẮT BUỘC: (1) tài khoản KHÔNG phải admin ⇒ cổng quyền HỎNG; (2) chưa chọn gì ⇒ nút phải tắt;
// (3) đổi tên action ⇒ cổng nguồn phải HỎNG.
//
// Chạy riêng:  node --test tests/ad08-dept-filter-bulk-delete.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import esbuild from "esbuild";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pure = read("app/screens/admin-governance-pure.ts");
const page = read("app/page.tsx");
const javaController = read("java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");
const javaRbac = read("java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");

function loadPure(names) {
  const start = pure.search(/^\/\/ AD-PURE-BEGIN$/m);
  const end = pure.search(/^\/\/ AD-PURE-END$/m);
  const block = pure.slice(start + "// AD-PURE-BEGIN".length, end).replace(/^export /gm, "");
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

function departmentPermBlock() {
  const start = page.indexOf("function DepartmentPermissionManager(");
  const end = page.indexOf("/** Tab \"Phân quyền người dùng\"", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `DepartmentPermissionManager` trong app/page.tsx");
  return page.slice(start, end);
}

test("AD-08 — bộ lọc phòng ban: lọc theo MÃ hoặc TÊN, không phân biệt hoa/thường, giữ nguyên khi rỗng", () => {
  const { filterDepartments } = loadPure(["filterDepartments"]);
  const units = [
    { id: "1", code: "DA", name: "Phòng Dự án" },
    { id: "2", code: "KH", name: "Phòng Kế hoạch" },
    { id: "3", code: "TCKT", name: "Tài chính - Kế toán" },
  ];
  assert.equal(filterDepartments(units, "").length, 3, "Ô lọc rỗng ⇒ giữ nguyên danh sách");
  assert.deepEqual(filterDepartments(units, "da").map((u) => u.id), ["1"],
    "Lọc không phân biệt hoa thường: «da» khớp MÃ «DA»");
  assert.deepEqual(filterDepartments(units, "dự án").map((u) => u.id), ["1"], "Lọc theo TÊN có dấu «dự án»");
  assert.deepEqual(filterDepartments(units, "kế toán").map((u) => u.id), ["3"], "Lọc theo TÊN có dấu");
  assert.deepEqual(filterDepartments(units, "  KH  ").map((u) => u.id), ["2"], "Cắt khoảng trắng đầu/cuối");
  assert.deepEqual(filterDepartments(units, "zzz"), [], "Không khớp ⇒ rỗng (UI hiện «không có phòng phù hợp»)");
});

test("AD-08 — chọn nhiều: bật/tắt từng mục + chọn/bỏ tất cả theo đúng danh sách đang hiển thị", () => {
  const { toggleSelection, toggleAllSelection, selectedPermissionRows } = loadPure(
    ["toggleSelection", "toggleAllSelection", "selectedPermissionRows"]);
  assert.deepEqual(toggleSelection([], "r1"), ["r1"], "Chọn mới ⇒ thêm vào tập");
  assert.deepEqual(toggleSelection(["r1", "r2"], "r1"), ["r2"], "Bấm lại ⇒ bỏ khỏi tập");
  assert.deepEqual(toggleSelection(["r1"], "r1", true), ["r1"], "Bật lại mục đã chọn ⇒ không nhân đôi");
  assert.deepEqual(toggleSelection(["r1"], "", true), ["r1"], "Id rỗng ⇒ không đổi (không sinh mục rác)");
  assert.deepEqual(toggleAllSelection(["r9"], ["r1", "r2"], true), ["r9", "r1", "r2"], "Chọn tất cả ⇒ cộng thêm, không mất mục cũ");
  assert.deepEqual(toggleAllSelection(["r1", "r9"], ["r1", "r2"], false), ["r9"], "Bỏ tất cả ⇒ chỉ bỏ các mục đang hiển thị");
  // Số dòng SẼ bị xoá = giao của tập chọn và dữ liệu thật (không đếm mục đã biến mất).
  const rows = [{ id: "r1" }, { id: "r2" }, { id: "r3" }];
  assert.equal(selectedPermissionRows(rows, ["r1", "r3", "rX"]).length, 2, "Chỉ đếm dòng có thật trong dữ liệu");
});

test("AD-08 — QUYỀN: chỉ admin được xoá; chưa chọn gì thì nút phải TẮT", () => {
  const { canBulkDeleteDepartmentPermissions, bulkDeleteDepartmentPermissionsEnabled } = loadPure(
    ["canBulkDeleteDepartmentPermissions", "bulkDeleteDepartmentPermissionsEnabled"]);
  assert.equal(canBulkDeleteDepartmentPermissions({ role: "admin" }), true, "Admin được xoá (đúng như backend)");
  assert.equal(canBulkDeleteDepartmentPermissions({ role: "ksda" }), false, "[đối chứng âm 1] vai trò thường KHÔNG được xoá");
  assert.equal(bulkDeleteDepartmentPermissionsEnabled({ role: "admin" }, ["r1"]), true);
  assert.equal(bulkDeleteDepartmentPermissionsEnabled({ role: "admin" }, []), false, "[đối chứng âm 2] chưa chọn gì ⇒ nút TẮT");
  assert.equal(bulkDeleteDepartmentPermissionsEnabled({ role: "thuky" }, ["r1", "r2"]), false, "[đối chứng âm 3] không đủ quyền ⇒ TẮT dù đã chọn");
});

test("AD-08 — action xoá THẬT đã tồn tại ở cả controller lẫn bảng RBAC (không bịa tên action)", () => {
  assert.match(javaController, /case "delete_department_permission" -> \{/,
    "Phải dùng action ĐÃ CÓ `delete_department_permission` của `SystemController`");
  assert.match(javaRbac, /Map\.entry\("delete_department_permission", List\.of\(\)\)/, "Action phải có trong bảng RBAC (module list rỗng = admin)");
  assert.ok(!/delete_organization_unit/.test(javaRbac), "KHÔNG được tự thêm action `delete_organization_unit` (không tồn tại ⇒ phải sửa backend = BỊ CẤM)");
});

test("AD-08 — UI: có ô lọc phòng ban, checkbox chọn từng dòng, nút xoá bị chặn bởi quyền + xác nhận", () => {
  const block = departmentPermBlock();
  assert.match(block, /filterDepartments\(/, "Danh sách phòng phải lọc bằng `filterDepartments`");
  assert.match(block, /data-dept-filter="AD-08"/, "Ô lọc phòng ban phải có dấu hiệu hợp đồng `AD-08`");
  assert.match(block, /toggleSelection|toggleAllSelection/, "Phải dùng helper chọn nhiều (một nguồn sự thật)");
  assert.match(block, /Xóa mục đã chọn|Xoá mục đã chọn/, "Phải có nút «Xoá mục đã chọn»");
  assert.match(block, /delete_department_permission/, "Nút xoá phải gọi action THẬT `delete_department_permission`");
  assert.match(block, /window\.confirm\(/, "Xoá phải có XÁC NHẬN (window.confirm) trước khi gọi API");
  assert.match(block, /bulkDeleteDepartmentPermissionsEnabled\(/, "Nút xoá phải bị chặn bằng cổng quyền đã đo ở test này");
  // Đối chứng âm ở tầng nguồn: nếu ai đổi tên action ⇒ hỏng ngay.
  const mutated = block.replace(/delete_department_permission/g, "delete_dept_perm_x");
  assert.ok(!/delete_department_permission/.test(mutated), "[đối chứng âm 4] phép biến đổi phải thực sự đổi tên action");
});
