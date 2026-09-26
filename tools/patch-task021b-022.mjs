// Vá TASK-021b + TASK-022.
//
// (1) CHỐNG HỒI QUY TASK-021 — nguyên nhân: `principalAsCurrent()` dựng CurrentUser với
//     `roleBase = p.role()` (mã CHUẨN). Sau khi TASK-021 đưa danh sách vai trò về mã ENGINE, mọi
//     `requireRole` trong use-case sẽ không bao giờ khớp ⇒ 403 cho TÀI KHOẢN KHÔNG PHẢI ADMIN.
//     Cách sửa: cho `Principal` có `default String roleBase()` (tương thích ngược), controller truyền
//     `cu.roleBase()` thật xuống, `principalAsCurrent` dùng giá trị đó.
//
// (2) TASK-022 — 5 action JS có kiểm vai trò nhưng Java không kiểm gì (đã xác nhận bằng
//     tools/probe-action-role-parity.mjs và đọc tay từng phương thức).
//
// Script này BỎ QUA phép đã áp dụng (thấy `to` nhưng không thấy `from`) nên chạy lại nhiều lần vẫn an toàn.
// Tệp Java dùng CRLF — mọi so khớp làm trên bản đã chuẩn hoá về LF, ghi lại đúng EOL gốc.
import { readFileSync, writeFileSync } from "node:fs";

const S = "java-backend/application/src/main/java/com/vntech/erp/application/service/";
const CTRL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const BEANS = "java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java";

const P2 = `    public interface Principal {\n        String userId();\n        String role();\n    }`;
const P3 = `    public interface Principal {\n        String userId();\n        String role();\n        String fullName();\n    }`;
const P4 = `    public interface Principal {\n        String userId();\n        String role();\n        String fullName();\n        String email();\n    }`;
const BASE_DOC = `
        /**
         * Mã ENGINE (\`role_catalog.base_role\`) — giá trị THẬT SỰ dùng để phân quyền, đúng như
         * \`effectiveRole(user)\` của JS. Mặc định rơi về \`role()\` để tương thích ngược với mọi
         * tầng gọi chưa truyền giá trị này xuống.
         */
        default String roleBase() { return role(); }`;
const withBase = (p) => p.replace(/\n    \}$/, BASE_DOC + "\n    }");

const EDITS = [
  // ── (1a) Principal nhận roleBase ────────────────────────────────────────────────────────────
  { file: S + "ProductionManagementUseCase.java", from: P2, to: withBase(P2) },
  { file: S + "StockManagementUseCase.java", from: P3, to: withBase(P3) },
  { file: S + "PurchaseManagementUseCase.java", from: P4, to: withBase(P4) },
  { file: S + "RequestManagementUseCase.java", from: P4, to: withBase(P4) },
  { file: S + "OpsTaskManagementUseCase.java", from: P4, to: withBase(P4) },

  // ── (1b) principalAsCurrent dùng roleBase thật ──────────────────────────────────────────────
  { file: S + "ProductionManagementUseCase.java",
    from: 'new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.role(), p.role(),',
    to: 'new AuthUseCase.CurrentUser(p.userId(), "", "", null, p.role(), p.roleBase(), p.role(),' },
  { file: S + "StockManagementUseCase.java",
    from: 'new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), null, p.role(), p.role(), p.role(),',
    to: 'new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), null, p.role(), p.roleBase(), p.role(),' },
  { file: S + "PurchaseManagementUseCase.java",
    from: 'new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), p.email(), p.role(), p.role(), p.role(),',
    to: 'new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), p.email(), p.role(), p.roleBase(), p.role(),' },
  { file: S + "RequestManagementUseCase.java",
    from: 'new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), p.email(), p.role(), p.role(), p.role(),',
    to: 'new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), p.email(), p.role(), p.roleBase(), p.role(),' },

  // ── (1c) OpsTaskManagementUseCase: thêm hạ tầng RBAC ───────────────────────────────────────
  { file: S + "OpsTaskManagementUseCase.java",
    from: 'import com.vntech.erp.application.port.out.OpsTaskStore;',
    to: 'import com.vntech.erp.application.port.out.OpsTaskStore;\nimport com.vntech.erp.application.rbac.RbacService;' },
  { file: S + "OpsTaskManagementUseCase.java",
    from: '    private final OpsTaskStore store;\n    private final IdGenerator idGenerator;\n\n'
        + '    public OpsTaskManagementUseCase(OpsTaskStore store, IdGenerator idGenerator) {\n'
        + '        this.store = store;\n        this.idGenerator = idGenerator;\n    }',
    to: '    private final OpsTaskStore store;\n    private final IdGenerator idGenerator;\n'
        + '    private final RbacService rbac;\n\n'
        + '    public OpsTaskManagementUseCase(OpsTaskStore store, IdGenerator idGenerator, RbacService rbac) {\n'
        + '        this.store = store;\n        this.idGenerator = idGenerator;\n        this.rbac = rbac;\n    }\n\n'
        + '    /** Dựng CurrentUser cho tầng RBAC — roleBase là mã ENGINE do controller truyền xuống. */\n'
        + '    private AuthUseCase.CurrentUser principalAsCurrent(Principal p) {\n'
        + '        return new AuthUseCase.CurrentUser(p.userId(), "", p.fullName(), p.email(), p.role(),\n'
        + '                p.roleBase(), p.role(), null, null, null, false);\n    }' },
  { file: BEANS,
    from: 'public OpsTaskManagementUseCase opsTaskManagementUseCase(OpsTaskStore opsTaskStore, IdGenerator idGenerator) {\n'
        + '        return new OpsTaskManagementUseCase(opsTaskStore, idGenerator);',
    to: 'public OpsTaskManagementUseCase opsTaskManagementUseCase(OpsTaskStore opsTaskStore, IdGenerator idGenerator,\n'
        + '                                                              RbacService rbacService) {\n'
        + '        return new OpsTaskManagementUseCase(opsTaskStore, idGenerator, rbacService);' },

  // ── (2) 5 cổng vai trò còn thiếu (mã ENGINE, đúng JS) ──────────────────────────────────────
  { file: S + "StockManagementUseCase.java",
    from: '    public Map<String, Object> createStockCount(Principal principal, Map<String, Object> payload) {',
    to: '    public Map<String, Object> createStockCount(Principal principal, Map<String, Object> payload) {\n'
      + '        // JS 1523: requireRole(user,["warehouse","commander","admin"]) — TASK-022 bổ sung.\n'
      + '        rbac.requireRole(principalAsCurrent(principal), List.of("warehouse", "commander", "admin"));' },
  { file: S + "StockManagementUseCase.java",
    from: '    public Map<String, Object> approveStockCount(Principal principal, Map<String, Object> payload) {',
    to: '    public Map<String, Object> approveStockCount(Principal principal, Map<String, Object> payload) {\n'
      + '        // JS 1550: requireRole(user,["commander","project","admin"]) — TASK-022 bổ sung.\n'
      + '        rbac.requireRole(principalAsCurrent(principal), List.of("commander", "project", "admin"));' },
  { file: S + "OpsTaskManagementUseCase.java",
    from: '    public Map<String, Object> createProjectTeam(Principal principal, Map<String, Object> payload) {',
    to: '    public Map<String, Object> createProjectTeam(Principal principal, Map<String, Object> payload) {\n'
      + '        // JS 1484: requireRole(user,["commander","admin"]) — TASK-022 bổ sung.\n'
      + '        rbac.requireRole(principalAsCurrent(principal), List.of("commander", "admin"));' },
  { file: S + "OpsTaskManagementUseCase.java",
    from: '    public Map<String, Object> saveMarApproval(Principal principal, Map<String, Object> payload) {',
    to: '    public Map<String, Object> saveMarApproval(Principal principal, Map<String, Object> payload) {\n'
      + '        // JS 1253: requireRole(user,["project","procurement","admin"]) — TASK-022 bổ sung.\n'
      + '        rbac.requireRole(principalAsCurrent(principal), List.of("project", "procurement", "admin"));' },
  { file: S + "AdminOpsManagementUseCase.java",
    from: '    public Map<String, Object> previewRequestImport(Principal principal, Map<String, Object> payload) {',
    to: '    public Map<String, Object> previewRequestImport(Principal principal, Map<String, Object> payload) {\n'
      + '        // JS 861: requireRole(user,["engineer","commander","admin"]) — TASK-022 bổ sung.\n'
      + '        rbac.requireRole(principalAsCurrent(principal), List.of("engineer", "commander", "admin"));' },
];

// Nạp tệp một lần, giữ EOL gốc, làm việc trên bản LF.
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
  const name = edit.file.split("/").pop();
  if (entry.text.includes(edit.from)) {
    entry.text = entry.text.split(edit.from).join(edit.to);
    applied++;
    rows.push(`  APD ${name}  ${edit.from.slice(0, 50).replace(/\n/g, "|")}`);
  } else if (entry.text.includes(edit.to)) {
    skipped++;
    rows.push(`  BO  ${name}  (da ap dung truoc do)`);
  } else {
    failed++;
    rows.push(`  X   ${name}  KHONG KHOP: ${edit.from.slice(0, 50).replace(/\n/g, "|")}`);
  }
}

// ── (1d) SystemController: helper asXxxPrincipal truyền roleBase thật (theo HÀM, có chống lặp) ──
const HELPERS = ["asProductionPrincipal", "asStockPrincipal", "asPurchasePrincipal",
                 "asReqPrincipal", "asOpsTaskPrincipal"];
const ctrlEntry = load(CTRL);
for (const helper of HELPERS) {
  const sig = `as${helper.slice(2)}(AuthUseCase.CurrentUser cu) {`;
  const at = ctrlEntry.text.indexOf(sig);
  if (at < 0) { rows.push(`  X   SystemController — khong thay ham ${helper}`); failed++; continue; }
  const head = ctrlEntry.text.slice(at);
  if (head.slice(0, 900).includes("roleBase()")) { skipped++; rows.push(`  BO  SystemController — ${helper}`); continue; }
  const roleLine = `@Override public String role() { return cu.role(); }`;
  const roleAt = ctrlEntry.text.indexOf(roleLine, at);
  if (roleAt < 0 || roleAt > at + 900) { rows.push(`  X   SystemController — ${helper} khong co dong role()`); failed++; continue; }
  const insertAt = roleAt + roleLine.length;
  ctrlEntry.text = ctrlEntry.text.slice(0, insertAt)
      + `\n            @Override public String roleBase() { return cu.roleBase(); }`
      + ctrlEntry.text.slice(insertAt);
  applied++;
  rows.push(`  APD SystemController — ${helper} truyen roleBase`);
}

for (const [path, entry] of cache) {
  writeFileSync(path, entry.crlf ? entry.text.replace(/\n/g, "\r\n") : entry.text, "utf8");
}

console.log("=== VA TASK-021b (chong hoi quy) + TASK-022 (5 cong vai tro) ===");
console.log(rows.join("\n"));
console.log(`\nAp dung moi: ${applied} · Bo qua (da co): ${skipped} · Loi: ${failed}`);
console.log(failed === 0
  ? "KET LUAN: tat ca phep va deu KHOP ✅"
  : "KET LUAN: co phep KHONG KHOP — da dung, khong sua phan lech ❌");
process.exit(failed === 0 ? 0 : 1);
