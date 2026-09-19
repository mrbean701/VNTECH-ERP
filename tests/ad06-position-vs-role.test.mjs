// PHASE 7 (`AD-06`) — HỢP ĐỒNG: TÁCH TAB «CHỨC DANH» / «VAI TRÒ» + PHÂN BIỆT POSITION VỚI SYSTEM ROLE.
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `AD-06`: «Tách tab Chức danh / Vai trò; **phân biệt rõ Position
// với System Role**». Đây là mục AUDIT ⇒ kết luận phải ghi CONFIRMED/LIKELY/UNKNOWN kèm BẰNG CHỨNG, không suy đoán.
//
// Bằng chứng nền (đọc trực tiếp trong test này, không tin lời kể):
//   • `role_catalog` (MySQL, information_schema) = danh mục CHỨC DANH: code · name · base_role · business_group_id.
//   • `base_role` là mã kỹ thuật `RbacService`/`ActionRbacRegistry` dùng khi kiểm quyền.
//
// Chạy riêng:  node --test tests/ad06-position-vs-role.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import esbuild from "esbuild";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const pure = read("app/screens/admin-governance-pure.ts");
const page = read("app/page.tsx");
const DOC = "docs/agent-progress/AD-06-POSITION-VA-SYSTEM-ROLE.md";
const docPath = new URL(DOC, root);

function loadPure(names) {
  const start = pure.search(/^\/\/ AD-PURE-BEGIN$/m);
  const end = pure.search(/^\/\/ AD-PURE-END$/m);
  const block = pure.slice(start + "// AD-PURE-BEGIN".length, end).replace(/^export /gm, "");
  const js = esbuild.transformSync(block, { loader: "ts" }).code;
  return new Function(`${js}\nreturn { ${names.join(", ")} };`)();
}

/** Cổng kiểm tài liệu audit: có verdict + có trích dẫn tệp bằng chứng. */
const auditDocGate = (text) =>
  /CONFIRMED|LIKELY|UNKNOWN/.test(text) &&
  /(app\/|lib\/|java-backend\/|scripts\/|drizzle\/)[\w./-]+/.test(text) &&
  text.length > 800;

function step3Block() {
  const start = page.indexOf("{step===3&&");
  const end = page.indexOf("{step===4&&", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy nhánh `step===3` của màn Quản trị");
  return page.slice(start, end);
}

test("AD-06 — 2 sub-tab «Chức danh (Position)» và «Vai trò hệ thống (System Role)» đúng thứ tự", () => {
  const { POSITION_SUB_TABS } = loadPure(["POSITION_SUB_TABS"]);
  assert.equal(POSITION_SUB_TABS.length, 2, "Bước «Chức danh / vai trò» phải có ĐÚNG 2 sub-tab");
  assert.equal(POSITION_SUB_TABS[0].key, "position");
  assert.match(POSITION_SUB_TABS[0].label, /Position/, "Sub-tab 1 phải gọi rõ là Position (Chức danh)");
  assert.equal(POSITION_SUB_TABS[1].key, "systemRole");
  assert.match(POSITION_SUB_TABS[1].label, /System Role/, "Sub-tab 2 phải gọi rõ là System Role (Vai trò)");
  assert.match(POSITION_SUB_TABS[0].source, /role_catalog/, "Nguồn Position phải ghi rõ bảng thật");
  assert.match(POSITION_SUB_TABS[1].source, /base_role/, "Nguồn System Role phải là `role_catalog.base_role`");
  // Đối chứng âm: cổng phải hỏng nếu gộp 2 khái niệm làm một.
  const gate = (tabs) => tabs.length === 2 && /Position/.test(tabs[0].label) && /System Role/.test(tabs[1].label);
  assert.equal(gate(POSITION_SUB_TABS), true);
  assert.equal(gate([{ key: "x", label: "Chức danh" }, { key: "y", label: "Vai trò" }]), false,
    "[đối chứng âm] nhãn mơ hồ «Chức danh»/«Vai trò» không được coi là phân biệt rõ");
});

test("AD-06 — UI tách 2 sub-tab THẬT, khối System Role chỉ ĐỌC (không sửa quyền nền kỹ thuật)", () => {
  const block = step3Block();
  assert.match(block, /POSITION_SUB_TABS\.map\(/, "Dải sub-tab phải dựng từ `POSITION_SUB_TABS`");
  assert.match(block, /data-subtab="position"/, "Sub-tab Position phải có dấu hiệu hợp đồng");
  assert.match(block, /data-subtab="system-role"/, "Sub-tab System Role phải có dấu hiệu hợp đồng");
  assert.match(block, /businessGroupName/, "Tab Position phải hiện Nhóm quyền nghiệp vụ của từng chức danh");
  assert.match(block, /System Role/, "Tab 2 phải nêu rõ nhãn System Role");
  assert.match(block, /engineRoleProfiles|roleBase/, "Tab System Role phải lấy dữ liệu THẬT từ payload");
});

test("AD-06 — AUDIT: kết luận phải ghi CONFIRMED/LIKELY/UNKNOWN + trích dẫn tệp bằng chứng", () => {
  assert.ok(existsSync(docPath), `Thiếu tài liệu audit bắt buộc ${DOC}`);
  const text = readFileSync(docPath, "utf8");
  assert.equal(auditDocGate(text), true, "Tài liệu audit phải có verdict + đường dẫn bằng chứng + nội dung thật");
  assert.match(text, /CONFIRMED/, "AD-06 là mục audit ⇒ phải có kết luận CONFIRMED cho phần đã xác minh");
  assert.match(text, /Unknown|UNKNOWN/, "Phải ghi rõ phần CHƯA xác minh được (UNKNOWN) nếu có");
  // Đối chứng âm cho chính cổng tài liệu.
  assert.equal(auditDocGate("Tôi đoán là Position khác System Role."), false,
    "[đối chứng âm] tài liệu chỉ có suy đoán, không verdict/bằng chứng ⇒ cổng phải HỎNG");
});

test("AD-06 — BẰNG CHỨNG DB: `role_catalog` có `base_role` (System Role) tách khỏi `name` (Position)", () => {
  let columns = "";
  try {
    const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
    columns = execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp",
      "--batch", "--raw", "--skip-column-names", "-e",
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='vntech_erp' AND TABLE_NAME='role_catalog'"],
      { encoding: "utf8" });
  } catch (error) {
    // Không có MySQL ⇒ KHÔNG kết luận; nhưng bằng chứng mã nguồn vẫn phải đứng vững.
    assert.match(read("java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java"),
      /rc\.base_role AS roleBase/, "Thiếu bằng chứng thay thế: bootstrap Java phải trả `base_role AS roleBase`");
    console.log(`⚠️ Không đọc được MySQL (${String(error.message).slice(0, 80)}) ⇒ dùng bằng chứng mã nguồn.`);
    return;
  }
  assert.match(columns, /base_role/, "`role_catalog` phải có cột `base_role` (System Role)");
  assert.match(columns, /^name$/m, "`role_catalog` phải có cột `name` (tên CHỨC DANH hiển thị)");
});
