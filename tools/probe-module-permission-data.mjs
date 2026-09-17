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

// PHÂN BIỆT hai nguyên nhân đều dẫn tới 403 (cách khắc phục KHÁC HẲN nhau):
//   (1) module TỒN TẠI + đang hoạt động, nhưng KHÔNG có dòng quyền  -> cần CẤP QUYỀN
//   (2) module KHÔNG tồn tại / bị tắt, hoặc nhóm menu của nó bị tắt -> cần TẠO/BẬT (cấp quyền vô ích)
// Điều kiện của canUseModule: mc.active=1 VÀ (mc.group_key IS NULL HOẶC mg.active=1)
console.log("\n=== TÌNH TRẠNG MODULE trong module_catalog (quyết định cách khắc phục) ===");
const byKey = new Map(activeModules.concat((d.moduleCatalog || []).filter((m) => !m.active))
  .map((m) => [m.moduleKey, m]));
const groups = new Map((d.menuGroups || []).map((g) => [g.groupKey, g]));

// BÀI HỌC: `active` trong payload là BOOLEAN true, không phải số 1. So `=== 1` đã cho
// báo động giả 9/9 module "nhóm menu TẮT". Luôn chuẩn hoá kiểu trước khi kết luận.
const isOn = (v) => v === true || v === 1 || v === "1" || v === "true";

const rowsTxt = [];
for (const m of [...need.keys(), "central_warehouse", "material_catalog"]) {
  const mod = byKey.get(m);
  if (!mod) { rowsTxt.push(`  ${m.padEnd(20)} KHÔNG TỒN TẠI trong module_catalog            -> phải TẠO module`); continue; }
  const g = mod.groupKey ? groups.get(mod.groupKey) : null;
  const groupOk = !mod.groupKey || (g && isOn(g.active));
  const has = perms.some((p) => p.moduleKey === m);
  let verdict;
  if (!isOn(mod.active)) verdict = "module đang TẮT                      -> phải BẬT";
  else if (!groupOk) verdict = `nhóm menu '${mod.groupKey}' TẮT/thiếu         -> phải BẬT nhóm`;
  else if (!has) verdict = "hoạt động, nhưng 0 dòng quyền        -> phải CẤP QUYỀN";
  else verdict = "hoạt động + có dòng quyền            -> kiểm giá trị cột cụ thể";
  rowsTxt.push(`  ${m.padEnd(20)} active=${String(mod.active).padEnd(5)} group=${String(mod.groupKey || "(không)").padEnd(18)} ${verdict}`);
}
console.log(rowsTxt.join("\n"));

const missing = [...need.keys()].filter((m) => !byKey.has(m));
const offModules = [...need.keys()].filter((m) => { const mod = byKey.get(m); return mod && !isOn(mod.active); });
const offGroups = [...need.keys()].filter((m) => {
  const mod = byKey.get(m); if (!mod || !mod.groupKey) return false;
  const g = groups.get(mod.groupKey); return !g || !isOn(g.active);
});
const noRows = [...need.keys()].filter((m) => !perms.some((p) => p.moduleKey === m));
console.log(`\n  Module CẦN mà KHÔNG tồn tại  : ${missing.length}${missing.length ? ` -> ${missing.join(", ")}` : ""}`);
console.log(`  Module CẦN đang TẮT          : ${offModules.length}${offModules.length ? ` -> ${offModules.join(", ")}` : ""}`);
console.log(`  Module CẦN bị nhóm menu TẮT  : ${offGroups.length}${offGroups.length ? ` -> ${offGroups.join(", ")}` : ""}`);
console.log(`  Module CẦN có 0 dòng quyền   : ${noRows.length} -> ${noRows.join(", ")}`);
console.log("\n  => Nếu cả 3 nhóm trên đều 0 thì nguyên nhân DUY NHẤT là THIẾU DÒNG QUYỀN"
  + "\n     (cấp quyền là đủ; không cần tạo/bật module hay nhóm menu).");


console.log(perms.length === 0
  ? "  => KHÔNG có dòng quyền module nào trong hệ thống."
  : `  => Chỉ ${perms.length} dòng cho ${activeModules.length} module × ${(d.staffDirectory || []).length} người dùng`
    + ` (nếu đầy đủ sẽ là ${activeModules.length * (d.staffDirectory || []).length} dòng).`);
console.log("  Ghi chú: JS đọc quyền module CHỈ từ user_module_permissions"
  + " (department_module_permissions là bảng riêng, không được canUseModule dùng).");
console.log("  => Nếu bảng quyền module thưa, JS CŨNG chặn y hệt ⇒ 403 tầng module KHÔNG phải lỗi mã Java.");
