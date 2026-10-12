#!/usr/bin/env node
/**
 * Sinh ActionRbacRegistry.java từ ACTION_CATALOG.json (nguồn: ACTION_MODULE/ACTION_CAPABILITY của monolith JS).
 * Đây là dữ liệu tĩnh — sinh lại khi JS đổi, không sửa tay.
 * Output: java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const javaBackend = resolve(__dirname, "..");
const catalog = JSON.parse(readFileSync(join(javaBackend, "ACTION_CATALOG.json"), "utf8"));
const outDir = join(javaBackend, "application", "src", "main", "java", "com", "vntech", "erp", "application", "rbac");
mkdirSync(outDir, { recursive: true });

const byAction = new Map();
for (const a of catalog.actions) {
  byAction.set(a.action, { modules: a.module, capability: a.capability || "canUse" });
}

const lines = [];
lines.push("package com.vntech.erp.application.rbac;");
lines.push("");
lines.push("import java.util.List;");
lines.push("import java.util.Map;");
lines.push("");
lines.push("/**");
lines.push(" * BẢN ĐỒ action -> module/capability (RBAC) — SINH TỰ ĐỘNG từ ACTION_CATALOG.json");
lines.push(" * (nguồn: ACTION_MODULE + ACTION_CAPABILITY của scripts/system-route.mjs).");
lines.push(" * Dùng bởi RbacService.requireActionModule — port nguyên trạng JS.");
lines.push(" */");
lines.push("public final class ActionRbacRegistry {");
lines.push("");
lines.push("    private ActionRbacRegistry() { }");
lines.push("");
lines.push("    private static final Map<String, List<String>> ACTION_MODULES = Map.ofEntries(");
const moduleEntries = [...byAction.entries()].map(([action, v]) => {
  if (v.modules.length === 0) return `            Map.entry("${action}", List.of())`;
  const list = v.modules.map((m) => `"${m}"`).join(", ");
  return `            Map.entry("${action}", List.of(${list}))`;
});
lines.push(moduleEntries.join(",\n"));
lines.push("    );");
lines.push("");
lines.push("    private static final Map<String, String> ACTION_CAPABILITIES = Map.ofEntries(");
const capEntries = [...byAction.entries()].map(([action, v]) =>
  `            Map.entry("${action}", "${v.capability}")`);
lines.push(capEntries.join(",\n"));
lines.push("    );");
lines.push("");
lines.push("    /** Module yêu cầu của action (rỗng = không gated theo module, như JS `!required`). */");
lines.push("    public static List<String> modulesFor(String action) {");
lines.push("        return ACTION_MODULES.getOrDefault(action, List.of());");
lines.push("    }");
lines.push("");
lines.push("    /** Capability yêu cầu (canView/canUse/canCreate/canEdit/canApprove/canExport); mặc định canUse. */");
lines.push("    public static String capabilityFor(String action) {");
lines.push('        return ACTION_CAPABILITIES.getOrDefault(action, "canUse");');
lines.push("    }");
lines.push("}");
lines.push("");

const outPath = join(outDir, "ActionRbacRegistry.java");
// ⛔⛔ CHỐT CHẶN `BUG-D17` (08/10/2026 · `ERP-SESSION-04`) — BỘ SINH NÀY **XOÁ MẤT CÁC MỤC GHI TAY**.
//   ⚠️ SỰ CỐ THẬT ĐÃ XẢY RA: chạy bộ sinh ⇒ file mất **27 dòng ghi tay** = các mục **Java-only**
//   (`save_warehouse`, `issue_stock_confirm`, `confirm_stock_issue`, `create_issue_grn`,
//   `create_transfer_grn`, `approve_stock_issue`, `save_notification_config`, `notification_configs`,
//   `notification_log`, `mark_notification_snooze`, `error_reports`, `mark_error_report_resolved`…)
//   **+ các BẢN VÁ có tài liệu** (`approve_po`→`purchasing` của TASK-135, `create_project_team`→
//   `site_command` của MT2-P14-03c, `mark_notification_all_read`, `save_error_report`…).
//   HẬU QUẢ ĐO ĐƯỢC: `tests/warehouse-modal-contract.test.mjs` ĐỎ (`save_warehouse thiếu ở bảng MODULES`),
//   và nếu phát hành thì `approve_po` quay lại **403 cho mọi user không phải admin/C-level** (đúng lỗi
//   TASK-135 đã vá) ⇒ ⛔ hồi quy nghiệp vụ nặng.
//   ⇒ NAY: bộ sinh **TỰ PHÁT HIỆN** mục có trong file nhưng ⛔ KHÔNG có trong danh mục và **DỪNG**,
//     buộc người chạy phải xử lý tay (hoặc chấp nhận rõ ràng bằng cờ `--allow-drop-handwritten`).
{
  const existing = existsSync(outPath) ? readFileSync(outPath, "utf8") : "";
  const catalogActions = new Set(byAction.keys());
  const handwritten = new Set();
  for (const m of existing.matchAll(/Map\.entry\("([a-z0-9_]+)",/g)) {
    if (!catalogActions.has(m[1])) handwritten.add(m[1]);
  }
  if (handwritten.size > 0 && !process.argv.includes("--allow-drop-handwritten")) {
    console.error(`\n⛔ DỪNG: file hiện có ${handwritten.size} mục GHI TAY ⛔ không có trong danh mục — bộ sinh sẽ XOÁ chúng.`);
    console.error(`   Danh sách: ${[...handwritten].sort().join(", ")}`);
    console.error("   ⇒ Giữ chúng bằng cách sửa tay file (xem `docs/dsh-mutil-session/SESSION_D/probes/fix-registry-work.mjs`),");
    console.error("     hoặc chạy lại kèm cờ `--allow-drop-handwritten` nếu THẬT SỰ muốn bỏ.");
    process.exit(1);
  }
}

writeFileSync(outPath, lines.join("\n"));
console.log(`ActionRbacRegistry.java: ${byAction.size} actions -> ${outPath}`);