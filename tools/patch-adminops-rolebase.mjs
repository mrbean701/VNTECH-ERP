// Vá bổ sung: AdminOpsManagementUseCase cũng dựng CurrentUser kiểu cũ (roleBase = mã chuẩn),
// mà TASK-022 vừa thêm cổng vai trò ["engineer","commander","admin"] cho preview_request_import.
// Không vá chỗ này thì tài khoản ksda sẽ bị 403 oan — đúng loại hồi quy đã gặp ở 4 use-case kia.
import { readFileSync, writeFileSync } from "node:fs";

const F = "java-backend/application/src/main/java/com/vntech/erp/application/service/AdminOpsManagementUseCase.java";
const CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";

const P2 = `    public interface Principal {\n        String userId();\n        String role();\n    }`;
const BASE_DOC = `
        /**
         * Mã ENGINE (\`role_catalog.base_role\`) — giá trị THẬT SỰ dùng để phân quyền, đúng như
         * \`effectiveRole(user)\` của JS. Mặc định rơi về \`role()\` để tương thích ngược với mọi
         * tầng gọi chưa truyền giá trị này xuống.
         */
        default String roleBase() { return role(); }`;
const withBase = (p) => p.replace(/\n    \}$/, BASE_DOC + "\n    }");

const EDITS = [
  { file: F, from: P2, to: withBase(P2) },
  { file: F,
    from: 'new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.role(), p.role(), null, null, null, false);',
    to: 'new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.roleBase(), p.role(), null, null, null, false);' },
];

const cache = new Map();
function load(path) {
  if (!cache.has(path)) {
    const raw = readFileSync(path, "utf8");
    cache.set(path, { crlf: raw.includes("\r\n"), text: raw.replace(/\r\n/g, "\n") });
  }
  return cache.get(path);
}

let failed = 0, applied = 0, skipped = 0;
const rows = [];
for (const edit of EDITS) {
  const entry = load(edit.file);
  if (entry.text.includes(edit.from)) {
    entry.text = entry.text.split(edit.from).join(edit.to);
    applied++; rows.push(`  APD ${edit.from.slice(0, 52).replace(/\n/g, "|")}`);
  } else if (entry.text.includes(edit.to)) {
    skipped++; rows.push(`  BO  da ap dung truoc do`);
  } else {
    failed++; rows.push(`  X   KHONG KHOP: ${edit.from.slice(0, 52).replace(/\n/g, "|")}`);
  }
}

// Helper asAdminOpsPrincipal trong controller
const ctrlEntry = load(CTRL);
const sig = "asAdminOpsPrincipal(AuthUseCase.CurrentUser cu) {";
const at = ctrlEntry.text.indexOf(sig);
if (at < 0) { failed++; rows.push("  X   khong thay asAdminOpsPrincipal"); }
else if (ctrlEntry.text.slice(at, at + 900).includes("roleBase()")) { skipped++; rows.push("  BO  asAdminOpsPrincipal"); }
else {
  const roleLine = `@Override public String role() { return cu.role(); }`;
  const roleAt = ctrlEntry.text.indexOf(roleLine, at);
  if (roleAt < 0 || roleAt > at + 900) { failed++; rows.push("  X   asAdminOpsPrincipal khong co dong role()"); }
  else {
    const insertAt = roleAt + roleLine.length;
    ctrlEntry.text = ctrlEntry.text.slice(0, insertAt)
        + `\n            @Override public String roleBase() { return cu.roleBase(); }`
        + ctrlEntry.text.slice(insertAt);
    applied++; rows.push("  APD asAdminOpsPrincipal truyen roleBase");
  }
}

for (const [path, entry] of cache) {
  writeFileSync(path, entry.crlf ? entry.text.replace(/\n/g, "\r\n") : entry.text, "utf8");
}

console.log("=== VA BO SUNG: AdminOpsManagementUseCase.roleBase ===");
console.log(rows.join("\n"));
console.log(`\nAp dung moi: ${applied} · Bo qua: ${skipped} · Loi: ${failed}`);
process.exit(failed === 0 ? 0 : 1);
