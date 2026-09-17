// TASK-030 — Đối chiếu DỮ LIỆU quyền module để kết luận 43 ca bị chặn ở tầng module
// là THIẾU DỮ LIỆU hay HÀNH VI ĐÚNG.
//
// Vì sao dùng `bootstrap`: chính payload mà giao diện tải về đã chứa:
//   - allModulePermissions : nội dung bảng user_module_permissions
//   - moduleCatalog        : 61 module đang hoạt động
//   - staffDirectory       : danh sách người dùng
//   - userWarehouseScopes  : nội dung bảng user_warehouse_scopes
// nên không cần mở rộng sandbox để gọi mysql — ít rủi ro hơn và đúng đường chạy thật.
//
// Chạy: node tools/probe-module-permission-data.mjs [base]
import { readFileSync } from "node:fs";

const BASE = process.argv[2] || "http://127.0.0.1:9000";

// --- Bản đồ action -> module, đọc từ JS (nguồn sự thật) ---
function sliceObject(text, marker) {
  const at = text.indexOf(marker);
  const open = text.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return text.slice(open, i + 1); }
    else if (c === "/" && text[i + 1] === "/") { while (i < text.length && text[i] !== "\n") i++; }
  }
  throw new Error("Không cân bằng được ngoặc");
}
const js = readFileSync("scripts/system-route.mjs", "utf8");
const body = sliceObject(js, "const ACTION_MODULE =").replace(/\/\/[^\n]*/g, "");
const ACTION_MODULE = {};
for (const m of body.matchAll(/([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(\[[^\]]*\]|"[^"]*")/g)) {
  ACTION_MODULE[m[1]] = m[2].startsWith("[")
    ? [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1])
    : [m[2].slice(1, -1)];
}

// Các action đo được là bị chặn ở tầng module trong TASK-027 (pha 2).
const BLOCKED = [
  "save_mar_approval", "close_po_line", "confirm_delivery", "approve_stock_count",
  "transfer_contract_ownership", "issue_stock", "return_stock", "confirm_installation",
  "create_stock_count", "reconcile_contract_stock", "reverse_stock_movement",
  "preview_request_import", "save_team_subcontract", "save_team_production",
  "approve_team_production", "save_team_payment", "settle_team_subcontract",
  "create_project_team", "create_request",
];

async function login(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  const cookie = (res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")])
    .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  return cookie;
}

const cookie = await login("admin", "Admin123456@");
const d = (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data;

const staff = Object.fromEntries((d.staffDirectory || []).map((s) => [s.id, s]));
const perms = d.allModulePermissions || [];
const activeModules = (d.moduleCatalog || []).filter((m) => m.active);

console.log(`Nguồn: ${BASE}`);
console.log(`Bảng user_module_permissions : ${perms.length} dòng`);
console.log(`Bảng user_warehouse_scopes   : ${(d.userWarehouseScopes || []).length} dòng`);
console.log(`Module đang hoạt động        : ${activeModules.length}`);
console.log(`Người dùng                   : ${(d.staffDirectory || []).length}`);
console.log(`Bảng department_module_permissions: ${(d.departmentModulePermissions || []).length} dòng\n`);

console.log("=== NỘI DUNG bảng user_module_permissions ===");
const byUser = new Map();
for (const p of perms) {
  const s = staff[p.userId] || {};
  console.log(`  ${String(s.fullName ?? p.userId).padEnd(24)} /${String(s.role).padEnd(12)} `
    + `${String(p.moduleKey).padEnd(24)} view=${p.canView} use=${p.canUse} create=${p.canCreate} `
    + `edit=${p.canEdit} approve=${p.canApprove} src=${p.permissionSource ?? "-"}`);
  const k = `${s.fullName ?? p.userId} (${s.role ?? "?"})`;
  byUser.set(k, (byUser.get(k) || 0) + 1);
}
console.log("\n  Số dòng theo người dùng:");
for (const [k, v] of byUser) console.log(`    ${k.padEnd(34)} ${v}`);

console.log("\n=== MODULE mà JS YÊU CẦU cho từng action bị chặn ===");
const need = new Map();
for (const a of BLOCKED) {
  const mods = ACTION_MODULE[a] ?? null;
  console.log(`  ${a.padEnd(30)} ${mods === null ? "(JS KHÔNG kiểm module)" : JSON.stringify(mods)}`);
  if (mods) for (const m of mods) need.set(m, (need.get(m) || 0) + 1);
}
console.log("\n  Module được yêu cầu nhiều nhất:");
for (const [m, c] of [...need].sort((x, y) => y[1] - x[1])) console.log(`    ${m.padEnd(26)} ${c} action`);

console.log("\n=== KẾT LUẬN DỮ LIỆU ===");
const covered = [...need.keys()].filter((m) => perms.some((p) => p.moduleKey === m));
console.log(`  Module được yêu cầu mà CÓ dòng quyền nào đó: ${covered.length}/${need.size}` +
  (covered.length ? ` -> ${covered.join(", ")}` : " -> KHÔNG có module nào"));
console.log(perms.length === 0
  ? "  => KHÔNG có dòng quyền module nào trong hệ thống."
  : `  => Chỉ ${perms.length} dòng cho ${activeModules.length} module × ${(d.staffDirectory || []).length} người dùng`
    + ` (nếu đầy đủ sẽ là ${activeModules.length * (d.staffDirectory || []).length} dòng).`);
console.log("  Ghi chú: JS đọc quyền module CHỈ từ user_module_permissions"
  + " (department_module_permissions là bảng riêng, không được canUseModule dùng).");
console.log("  => Nếu bảng quyền module thưa, JS CŨNG chặn y hệt ⇒ 403 tầng module KHÔNG phải lỗi mã Java.");
