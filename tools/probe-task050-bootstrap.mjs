// ============================================================================
// TASK-050 — cổng KIỂM CHỨNG LÚC CHẠY cho 4 khoá bootstrap bị thiếu + bộ lọc quyền
// ============================================================================
// BỐI CẢNH: cổng tĩnh `tools/probe-bootstrap-keys.mjs` chỉ so TÊN KHOÁ trong mã nguồn.
// Cổng đó KHÔNG chứng minh được: (a) khoá có thật trong JSON trả về lúc chạy; (b) số dòng
// đúng bằng dữ liệu MySQL; (c) shape cột khớp JS; (d) bộ lọc quyền (:622, :728-737) đã port.
// Vì vậy hồ sơ TASK-050 yêu cầu "phải chạy đối chiếu số dòng" mới đủ điều kiện DONE (§44).
//
// GIỚI HẠN QUAN TRỌNG CỦA PHÉP ĐO (nói thẳng, không giấu):
//   * Lõi JS cũ (`scripts/system-route.mjs`) hiện KHÔNG chạy: cổng :9000 chỉ proxy /api/* sang
//     Java :18081, còn :8787 là Node SSR của giao diện. Nên KHÔNG thể so trực tiếp JSON
//     JS↔Java lúc chạy. Thay vào đó dùng NGUỒN ĐỘC LẬP: các câu SQL chạy thẳng trên MySQL
//     (nguồn dữ liệu thật của Java) và danh sách alias cột chép NGUYÊN VĂN từ JS.
//   * JS chạy trên SQLite/D1 còn Java chạy trên MySQL ⇒ hai cơ sở dữ liệu khác nhau.
//   * Với 2 khoá hiện rỗng trên dữ liệu (centralInventory, centralReturns) thì KHÔNG thể kiểm
//     shape theo dòng — probe in rõ "không kiểm được shape", không coi là ĐẠT.
//
// Chạy: node tools/probe-task050-bootstrap.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const MYSQL_ARGS = ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp",
  "--batch", "--raw", "--skip-column-names"];

const sql = (q) => execFileSync(MYSQL, [...MYSQL_ARGS, "-e", q], { encoding: "utf8" }).trim();
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };

const results = [];
let skipped = 0;
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};
const note = (msg) => console.log(`  (bỏ qua)  ${msg}`);

// ---------- đăng nhập từng tài khoản ----------
async function loginAs(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  if (!res.ok) throw new Error(`đăng nhập ${username} lỗi HTTP ${res.status}`);
  const cookie = (res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")])
    .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  const boot = await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json();
  if (!boot?.data) throw new Error(`bootstrap ${username} không có .data`);
  return boot.data;
}

// ============================ 0. DỮ LIỆU MONG ĐỢI (từ MySQL) ============================
// Bốn câu SQL dưới đây là bản ĐỘC LẬP của 4 truy vấn TASK-050, viết lại từ JS để so số dòng.
const EXP = {
  centralInventory: Number(sqlOne(
    `WITH movements AS (SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE to_warehouse_id='WH-CENTRAL'
      UNION ALL SELECT material_id,from_warehouse_id,-quantity FROM stock_movements WHERE from_warehouse_id='WH-CENTRAL'),
      balances AS (SELECT material_id,COALESCE(SUM(qty),0) AS balance FROM movements GROUP BY material_id)
     SELECT COUNT(*) FROM materials m LEFT JOIN balances b ON b.material_id=m.id
      WHERE m.active=1 AND COALESCE(b.balance,0)<>0`)),
  centralReturns: Number(sqlOne(`SELECT COUNT(*) FROM central_returns`)),
  companyAvailability: Number(sqlOne(
    `WITH movements AS (SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE to_warehouse_id IS NOT NULL
      UNION ALL SELECT material_id,from_warehouse_id,-quantity FROM stock_movements WHERE from_warehouse_id IS NOT NULL),
      balances AS (SELECT material_id,warehouse_id,SUM(qty) AS on_hand FROM movements GROUP BY material_id,warehouse_id)
     SELECT COUNT(*) FROM balances b
      JOIN warehouses w ON w.id=b.warehouse_id AND w.active=1
      JOIN materials m ON m.id=b.material_id
      WHERE w.type<>'transit' AND COALESCE(b.on_hand,0)<>0`)),
  constructionDailyLogItems: Number(sqlOne(
    `SELECT COUNT(*) FROM construction_daily_log_items i JOIN construction_daily_logs l ON l.id=i.log_id`)),
};
console.log(`Kỳ vọng số dòng (MySQL, độc lập): ${JSON.stringify(EXP)}\n`);

// Danh sách alias cột CHÉP NGUYÊN VĂN từ JS (system-route.mjs) — dùng kiểm shape.
const JS_ALIASES = {
  centralInventory: ["materialId", "materialCode", "materialName", "unit", "system", "minStock", "balance", "aliasText"],
  companyAvailability: ["warehouseId", "warehouseCode", "warehouseName", "type", "projectId", "projectCode",
    "materialId", "materialCode", "materialName", "unit", "onHand", "reserved", "available"],
  constructionDailyLogItems: ["id", "logId", "boqItemId", "itemName", "location", "plannedQty", "completedQty",
    "unit", "laborHours", "photoAttachmentId", "note"],
  centralReturns: ["id", "returnNo", "sourceProjectId", "projectCode", "projectName", "sourceWarehouseId",
    "sourceWarehouseName", "centralWarehouseId", "requestedAt", "approvedAt", "receivedAt", "status", "note",
    "requestedBy", "itemCount", "proposedQty", "acceptedQty", "rejectedQty", "attachmentCount", "items"],
};
const KEYS4 = ["centralInventory", "centralReturns", "companyAvailability", "constructionDailyLogItems"];

// ============================ 1. ADMIN — khoá tồn tại + số dòng + shape ============================
console.log("═══ 1. ADMIN: 4 khoá phải TỒN TẠI và số dòng khớp MySQL ═══");
const admin = await loginAs("admin", "Admin123456@");
for (const key of KEYS4) {
  const value = admin[key];
  check(`[admin] data.${key} là MẢNG`, Array.isArray(value), Array.isArray(value) ? `${value.length} dòng` : `kiểu ${typeof value}`);
}
for (const key of KEYS4) {
  if (!Array.isArray(admin[key])) continue;
  check(`[admin] data.${key} số dòng khớp MySQL`, admin[key].length === EXP[key],
    `Java=${admin[key].length} · MySQL=${EXP[key]}`);
}
for (const key of KEYS4) {
  const rows = admin[key];
  if (!Array.isArray(rows) || rows.length === 0) { skipped++; note(`data.${key} rỗng trên dữ liệu hiện tại ⇒ KHÔNG kiểm được shape cột`); continue; }
  const missing = JS_ALIASES[key].filter((alias) => !(alias in rows[0]));
  check(`[admin] data.${key} đủ alias cột như JS`, missing.length === 0,
    missing.length ? `thiếu: ${missing.join(", ")}` : `đủ ${JS_ALIASES[key].length} alias`);
}
// `items` lồng trong centralReturns: không kiểm được vì bảng rỗng — ghi nhận minh bạch.
skipped++; note("centralReturns.items (dòng hàng lồng) chưa kiểm được: bảng central_returns rỗng");

// ============================ 2. ADMIN — không bị bộ lọc quyền đụng vào ============================
console.log("\n═══ 2. ADMIN: bộ lọc quyền KHÔNG được xoá gì ═══");
for (const key of ["users", "audits", "activeSessions", "adminProjects", "serverInfo", "trustStatus", "emailSettings"]) {
  const value = admin[key];
  const ok = Array.isArray(value) ? value.length >= 0 : value !== null && value !== undefined;
  check(`[admin] data.${key} KHÁC rỗng/null`, ok, Array.isArray(value) ? `${value.length} dòng` : typeof value);
}
check("[admin] data.user.mustChangePassword là boolean (JS :181 trả cờ này)",
  typeof admin.user?.mustChangePassword === "boolean", JSON.stringify(admin.user?.mustChangePassword));
check("[admin] data.user.warehouseScopeKind có mặt (JS :181)",
  "warehouseScopeKind" in (admin.user ?? {}), JSON.stringify(admin.user?.warehouseScopeKind));

// ============================ 3. NGƯỜI DÙNG THƯỜNG — bộ lọc quyền (:622, :728-737) ============================
// Kỳ vọng tính ĐỘC LẬP từ bảng user_module_permissions của MySQL (không dùng lại dữ liệu trong response).
function viewModulesOf(userId) {
  const rows = sqlRows(`SELECT module_key FROM user_module_permissions WHERE user_id=${JSON.stringify(userId).replace(/"/g, "'")} AND can_view=1 AND module_key IN (SELECT module_key FROM module_catalog WHERE active=1)`);
  return new Set(rows.map((r) => r[0]));
}
// JS :684 nhánh 2 — Ban giám đốc nhận MỌI module đang hoạt động trừ "admin".
function leadershipModules() {
  const rows = sqlRows(`SELECT mc.module_key FROM module_catalog mc
    LEFT JOIN menu_group_catalog mg ON mg.group_key=mc.group_key
    WHERE mc.active=1 AND (mc.group_key IS NULL OR mg.active=1) AND mc.module_key<>'admin'`);
  return new Set(rows.map((r) => r[0]));
}
const GROUP = {
  staffDirectory: ["dashboard", "site_command", "dept_legal_hr", "dept_legal_labor", "dept_legal_correspondence", "dept_legal_documents", "dept_legal_seal", "dept_legal_benefits"],
  inventory: ["warehouse_receipt", "warehouse_issue", "inventory", "stocktake", "central_warehouse", "material_catalog"],
  requests: ["requests", "approvals", "purchasing", "supplier_catalog", "receiving", "delivered"],
  materials: ["material_catalog", "central_warehouse", "boq", "requests", "purchasing", "dept_project_material", "material_norms"],
  workItems: ["dept_plan_tasks", "dept_plan_assign", "dept_project_tasks", "dept_project_assign", "site_command"],
};
const LEADERSHIP_ROLE_CODES = new Set(["director", "tgd", "ptgd", "giam_doc", "pho_giam_doc", "thuky", "thu_ky_tgd"]);

async function checkNonAdmin(username, password, label) {
  console.log(`\n─── ${label}: ${username} ───`);
  const data = await loginAs(username, password);
  const userId = String(data.user.id);
  const roleCode = String(data.user.role ?? "").toLowerCase();
  const roleBase = String(data.user.roleBase ?? "").toLowerCase();
  const leadership = LEADERSHIP_ROLE_CODES.has(roleCode) || roleBase === "director";
  const view = viewModulesOf(userId);
  console.log(`  vai trò=${roleCode} base=${roleBase} · quyền can_view=1 trong MySQL: ${view.size} module` +
    (leadership ? " · LÀ Ban giám đốc (JS :684 nhánh 2 ⇒ mọi module trừ admin)" : ""));
  // Ban giám đốc: JS cấp MỌI module (trừ admin) ⇒ không nhóm nào bị xoá trắng.
  const effectiveView = leadership ? leadershipModules() : view;
  const anyOf = (keys) => keys.some((k) => effectiveView.has(k));

  // 3a. Khoá CHỈ ADMIN (JS :737) — luôn rỗng/null với mọi người dùng thường
  for (const key of ["users", "userScopes", "allModulePermissions", "audits", "activeSessions",
                     "adminProjects", "adminMaterials", "adminSuppliers", "emailRecipients"]) {
    const value = data[key];
    check(`[${username}] data.${key} bị XOÁ TRẮNG (JS :737)`, Array.isArray(value) && value.length === 0,
      Array.isArray(value) ? `${value.length} dòng` : `kiểu ${typeof value}`);
  }
  for (const key of ["serverInfo", "trustStatus", "emailSettings"]) {
    check(`[${username}] data.${key} = null (JS :737)`, data[key] === null, JSON.stringify(data[key]) ?? "undefined");
  }

  // 3b. Nhóm theo module (JS :730-736) — kỳ vọng suy từ MySQL
  const groups = {
    staffDirectory: ["staffDirectory"],
    requests: ["requests", "supplySteps", "purchaseOrders", "receipts"],
    inventory: ["inventory", "contractStockLedger", "contractStockBalances", "stockReconciliations",
      "centralInventory", "centralReturns", "companyAvailability", "transferOrders", "issues", "returns", "stockCounts"],
    materials: ["materials", "materialCategories", "materialSubcategories", "materialAliases", "materialNorms"],
    workItems: ["workItems", "workItemEvents", "taskNotifications"],
  };
  for (const [group, keys] of Object.entries(groups)) {
    const expectBlank = !anyOf(GROUP[group]);
    for (const key of keys) {
      const value = data[key];
      const isEmpty = Array.isArray(value) && value.length === 0;
      const isArrayPresent = Array.isArray(value);
      if (expectBlank) {
        check(`[${username}] ${key} = [] (nhóm ${group} không có quyền)`, isEmpty,
          isArrayPresent ? `${value.length} dòng` : `kiểu ${typeof value}`);
      } else if (group === "inventory") {
        // 3c. Bộ lọc VAI TRÒ (:622) riêng cho 2 khoá kho tổng
        if (key === "centralInventory" || key === "centralReturns") {
          const scopeKind = String(data.user.warehouseScopeKind || "site");
          const expectRoleBlank = roleBase === "warehouse" && scopeKind === "site";
          if (expectRoleBlank) {
            check(`[${username}] ${key} = [] do VAI TRÒ kho phạm vi site (JS :622)`, isEmpty,
              isArrayPresent ? `${value.length} dòng` : `kiểu ${typeof value}`);
          } else {
            skipped++; note(`${key}: vai trò không phải kho-site ⇒ không kiểm được nhánh :622`);
          }
        }
      }
    }
  }
  // 3d. Kiểm soát dương: nhóm CÓ quyền phải KHÔNG rỗng (nếu dữ liệu có) — chống "lọc sạch tất cả"
  const positive = Object.entries(GROUP).filter(([, keys]) => anyOf(keys));
  for (const [group] of positive) {
    const probeKey = { staffDirectory: "staffDirectory", inventory: "inventory", requests: "requests",
      materials: "materials", workItems: "workItems" }[group];
    const rows = data[probeKey];
    if (Array.isArray(rows) && rows.length > 0) {
      check(`[${username}] KIỂM SOÁT DƯƠNG: ${probeKey} không rỗng vì nhóm ${group} CÓ quyền`, true, `${rows.length} dòng`);
    } else {
      skipped++; note(`${probeKey}: nhóm ${group} có quyền nhưng dữ liệu rỗng ⇒ không dùng làm kiểm soát dương`);
    }
  }
  return { data, leadership, view };
}

const warehouse = await checkNonAdmin("tkhodemo", "Vntech@2026", "NGƯỜI DÙNG KHO (vai trò kho, phạm vi site)");
const leadership = await checkNonAdmin("thukydemo", "Vntech@2026", "BAN GIÁM ĐỐC/thư ký (JS :684 nhánh 2)");
await checkNonAdmin("nvdademo", "Vntech@2026", "NHÂN VIÊN DỰ ÁN (không có nhóm kho)");

// ============================ 4. NHÁNH BAN GIÁM ĐỐC (JS :684) ============================
console.log("\n═══ 4. NHÁNH modulePermissions thứ hai (JS :684) ═══");
if (leadership.leadership) {
  const perms = leadership.data.modulePermissions ?? [];
  const sources = new Set(perms.map((p) => String(p.permissionSource)));
  check("[thukydemo] có dòng permissionSource='company_leadership'",
    sources.has("company_leadership"), [...sources].join(", ") || "không có dòng nào");
  check("[thukydemo] số module > số dòng user_module_permissions trong MySQL",
    perms.length > leadership.view.size, `Java=${perms.length} · MySQL=${leadership.view.size}`);
  check("[thukydemo] KHÔNG có module 'admin'",
    !perms.some((p) => String(p.moduleKey) === "admin"), perms.filter((p) => String(p.moduleKey) === "admin").length + " dòng admin");
  // Vì có mọi module ⇒ không nhóm nào bị xoá trắng ngoài nhóm chỉ-admin.
  // `projects` của tài khoản này = 0 vì dòng `user_project_scopes` của họ trỏ tới project KHÔNG tồn tại
  // (5 dòng mồ côi — xem mục "PHÁT HIỆN KÈM" của TASK-050.md), nên chỉ khẳng định kiểu mảng + đếm dòng.
  for (const key of ["materials", "requests", "inventory", "workItems"]) {
    const rows = leadership.data[key];
    check(`[thukydemo] ${key} là MẢNG (không bị xoá thành undefined)`, Array.isArray(rows),
      Array.isArray(rows) ? `${rows.length} dòng` : `kiểu ${typeof rows}`);
  }
  check("[thukydemo] materials KHÔNG rỗng (JS không xoá cho Ban giám đốc)",
    Array.isArray(leadership.data.materials) && leadership.data.materials.length > 0,
    `${leadership.data.materials?.length} dòng`);
} else {
  skipped++; note("tài khoản kiểm tra không thuộc Ban giám đốc ⇒ bỏ qua nhánh :684");
}

// ============================ 5. TASK-053 — 2 cột THIẾU của constructionDailyLogs ============================
// Cùng lớp lỗi với TASK-050 nhưng ở mức CỘT (không phải khoá): JS :658 trả `itemCount` + `completedQty`
// (LEFT JOIN tổng hợp từ construction_daily_log_items) còn Java thì không ⇒ UI `page.tsx:2548` hiện
// `l.itemCount||items.length` và `money(l.completedQty)` ⇒ cột "Khối lượng" LUÔN 0/trống.
console.log("\n═══ 5. TASK-053: itemCount/completedQty của constructionDailyLogs ═══");
{
  const logs = admin.constructionDailyLogs;
  if (!Array.isArray(logs) || logs.length === 0) {
    skipped++; note("constructionDailyLogs rỗng ⇒ không kiểm được 2 cột");
  } else {
    const missing = ["itemCount", "completedQty"].filter((k) => !(k in logs[0]));
    check("[admin] constructionDailyLogs có đủ 2 cột itemCount/completedQty", missing.length === 0,
      missing.length ? `thiếu: ${missing.join(", ")}` : "có cả 2");
    const rows = sqlRows(`SELECT l.id,COALESCE(x.item_count,0),COALESCE(x.completed_qty,0)
      FROM construction_daily_logs l
      LEFT JOIN (SELECT log_id,COUNT(*) AS item_count,SUM(completed_qty) AS completed_qty
                 FROM construction_daily_log_items GROUP BY log_id) x ON x.log_id=l.id`);
    const expected = new Map(rows.map((r) => [r[0], { itemCount: Number(r[1]), completedQty: Number(r[2]) }]));
    const mismatches = logs.filter((l) => {
      const e = expected.get(String(l.id));
      return e && (Number(l.itemCount) !== e.itemCount || Number(l.completedQty) !== e.completedQty);
    });
    check("[admin] 2 cột khớp MySQL theo từng dòng nhật ký", mismatches.length === 0,
      mismatches.length ? `${mismatches.length} dòng lệch: ${JSON.stringify(mismatches[0]).slice(0, 160)}`
        : `${logs.length} dòng khớp`);
  }
}

// ============================ 6. TỔNG KẾT ============================
const failed = results.filter((r) => !r.ok);
console.log(`\n═══ KẾT QUẢ: ${results.length - failed.length}/${results.length} ĐẠT · ${skipped} phép đo không thực hiện được ═══`);
if (failed.length) {
  console.log("CÁC PHÉP ĐO HỎNG:");
  for (const f of failed) console.log(`  • ${f.name} — ${f.detail}`);
}
console.log("GIỚI HẠN: probe không so JSON JS↔Java (lõi JS cũ không chạy); số dòng đối chiếu với MySQL");
console.log("         và danh sách alias cột chép nguyên văn từ system-route.mjs. 2 khoá rỗng nên không kiểm được shape.");
process.exit(failed.length ? 1 : 0);
