#!/usr/bin/env node
/**
 * Sinh ActionRbacRegistry.java từ ACTION_CATALOG.json (nguồn: ACTION_MODULE/ACTION_CAPABILITY của monolith JS).
 * Đây là dữ liệu tĩnh — sinh lại khi JS đổi, không sửa tay.
 * Output: java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
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
writeFileSync(outPath, lines.join("\n"));
console.log(`ActionRbacRegistry.java: ${byAction.size} actions -> ${outPath}`);