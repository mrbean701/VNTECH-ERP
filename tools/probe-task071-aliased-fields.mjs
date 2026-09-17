// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-071 — CỔNG ĐO 7 TRƯỜNG ĐẶT **ALIAS KHÁC TÊN CỘT NGUỒN** (nhóm TASK-070 không đối chiếu được)
// ════════════════════════════════════════════════════════════════════════════════════════════
// VÌ SAO: cổng TASK-070 đối chiếu trường bằng cách `camel→snake` rồi tìm cột CÙNG TÊN. Nhóm trường
// đặt alias KHÁC (`u.full_name AS fullName`, `o.code AS organizationCode`, `` level_rank AS `rank` ``)
// **không** đối chiếu được bằng cách đó — mà đây lại **đúng nhóm dễ ẩn lỗi nhất** vì đều là trường
// dẫn xuất/JOIN. Cách đo ở đây: giải mã **biểu thức thật** của từng trường từ câu SQL, rồi so
// "số dòng có dữ liệu ở CỘT NGUỒN" với "số dòng API trả KHÔNG rỗng".
//
// ⚠️ CỔNG PHẢI TỰ CHỨNG MINH BỘ GIẢI MÃ (bài học #103) — chạy 3 ca dựng sẵn có đáp án biết trước:
//    (1) trường KHÔNG có trong câu SQL  ⇒ phải báo "không giải được" (không được im lặng bỏ qua);
//    (2) alias có BACKTICK (`` `rank` ``) ⇒ phải giải ra đúng cột nguồn;
//    (3) biểu thức `COALESCE(a.x,b.y) AS f` ⇒ phải lấy được cột ĐẦU TIÊN.
//
// GIỚI HẠN: với `COALESCE(a.x, b.y)` cổng chỉ đo cột ĐẦU; cột nguồn phải tồn tại trong lược đồ đang chạy;
//          câu JOIN chỉ giải được alias khai trong `FROM`/`JOIN` của CHÍNH câu đó.
//
// Chạy: node tools/probe-task071-aliased-fields.mjs [base]
import { execFileSync } from "node:child_process";
import { loadJavaSqlByKey } from "./lib/sql-parity-extract.mjs";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const sql = (q) => execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech",
  "vntech_erp", "--batch", "--raw", "--skip-column-names", "-e", q], { encoding: "utf8" });
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };

// ─────────────────── BỘ GIẢI MÃ (tách riêng để ĐỐI CHỨNG được) ───────────────────
/** alias → tên bảng, đọc từ `FROM <bảng> [AS] <alias>` và mọi `JOIN <bảng> [AS] <alias>`. */
export function tableAliases(stmt) {
  const map = new Map();
  const re = /\b(?:from|join)\s+([a-z_][a-z0-9_]*)\s*(?:as\s+)?([a-z_][a-z0-9_]*)?/gi;
  let m;
  while ((m = re.exec(stmt)) !== null) {
    const table = m[1];
    const alias = m[2] && !/^(on|where|left|right|inner|join|group|order|limit|union|and|or)$/i.test(m[2]) ? m[2] : table;
    map.set(alias.toLowerCase(), table);
  }
  map.set(table => table, undefined); // no-op giữ chữ ký rõ ràng
  return map;
}

/** Danh sách mục SELECT ở mức ngoài cùng (bỏ literal; GIỮ nội dung backtick vì là định danh). */
function selectItems(stmt) {
  const start = stmt.search(/\bselect\b/i) + 6;
  const from = stmt.search(/\bfrom\b/i);
  const list = stmt.slice(start, from < 0 ? undefined : from);
  const items = [];
  let depth = 0, quote = null, cur = "";
  for (const ch of list) {
    if (quote) { if (ch === quote) quote = null; cur += ch; continue; }
    if (ch === "'" || ch === '"') { quote = ch; cur += ch; continue; }
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { items.push(cur.trim()); cur = ""; continue; }
    cur += ch;
  }
  if (cur.trim()) items.push(cur.trim());
  return items;
}

/** Tên trường đầu ra của một mục SELECT (bỏ backtick). */
function aliasOf(item) {
  const m = item.match(/\sas\s+`?([A-Za-z_][A-Za-z0-9_]*)`?\s*$/i);
  if (m) return m[1];
  const t = item.replace(/`/g, "").trim();
  const last = t.split(".").pop();
  return (last.match(/^([A-Za-z_][A-Za-z0-9_]*)$/) ?? [, null])[1];
}

/**
 * Giải một trường về (bảng, cột) nguồn.
 * @returns {{table:string,column:string,expr:string}|{error:string}}
 */
export function resolveField(stmt, field) {
  const item = selectItems(stmt).find((it) => aliasOf(it) === field);
  if (!item) return { error: `không có mục SELECT nào đặt alias "${field}"` };
  // ⚠️ BÀI HỌC (bị chính ĐỐI CHỨNG bắt ở lượt chạy đầu): phải BỎ phần `AS <alias>` TRƯỚC khi trích cột.
  // Bản đầu để nguyên nên `` level_rank AS `rank` `` bị giải thành cột `rank` (chính là alias!) thay vì `level_rank`.
  const clean = item.replace(/`/g, "").replace(/\sas\s+[A-Za-z_][A-Za-z0-9_]*\s*$/i, "");
  const cols = [...clean.matchAll(/(?:([a-z_][a-z0-9_]*)\.)?([a-z_][a-z0-9_]*)/gi)].map((m) => ({ alias: m[1], column: m[2] }));
  const withAlias = cols.find((c) => c.alias && !COLUMN_KEYWORDS.has(c.alias.toLowerCase()));
  const aliases = tableAliases(stmt);
  if (withAlias) {
    const table = aliases.get(withAlias.alias.toLowerCase());
    if (!table) return { error: `alias bảng "${withAlias.alias}" không khai trong FROM/JOIN` };
    return { table, column: withAlias.column, expr: item };
  }
  const bare = cols.filter((c) => !c.alias && !COLUMN_KEYWORDS.has(c.column.toLowerCase()));
  if (!bare.length) return { error: `không nhận ra cột nguồn trong: ${item}` };
  const aliasesOnly = [...aliases.values()].filter(Boolean);
  if (aliasesOnly.length !== 1) return { error: `biểu thức không có tiền tố bảng và câu SQL có ${aliasesOnly.length} bảng ⇒ không chắc chắn` };
  return { table: aliasesOnly[0], column: bare[bare.length - 1].column, expr: item };
}
const COLUMN_KEYWORDS = new Set(["coalesce", "as", "nullif", "ifnull", "case", "when", "then", "else", "end",
  "sum", "count", "max", "min", "abs", "round", "if", "cast", "distinct", "concat"]);

// ═══════════════════ ĐỐI CHỨNG BỘ GIẢI MÃ (dựng sẵn) ═══════════════════
console.log("═══ ĐỐI CHỨNG BỘ GIẢI MÃ (dựng sẵn, biết trước đáp án) ═══");
const controls = [
  ["trường KHÔNG có trong SQL ⇒ phải báo KHÔNG giải được",
    "SELECT a.id,a.x AS y FROM t a", "khongCoTruongNay", (r) => !!r.error],
  ["alias có BACKTICK ⇒ phải giải ra đúng cột nguồn",
    "SELECT id,level_rank AS `rank` FROM system_level_catalog", "rank",
    (r) => r.table === "system_level_catalog" && r.column === "level_rank"],
  ["COALESCE(a.x,b.y) AS f ⇒ phải lấy cột ĐẦU TIÊN",
    "SELECT u.id,COALESCE(rc.name,u.role) AS roleName FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role",
    "roleName", (r) => r.table === "role_catalog" && r.column === "name"],
  ["u.full_name AS fullName ⇒ phải giải ra users.full_name",
    "SELECT u.id,u.full_name AS fullName FROM users u", "fullName",
    (r) => r.table === "users" && r.column === "full_name"],
];
let controlsOk = true;
for (const [name, stmt, field, ok] of controls) {
  const r = resolveField(stmt, field);
  const good = ok(r);
  if (!good) controlsOk = false;
  console.log(`  ${good ? "ĐẠT" : "HỎNG"}  ${name} — giải ra: ${r.error ? "LỖI: " + r.error : r.table + "." + r.column}`);
}
if (!controlsOk) {
  console.log("\n⚠️ BỘ GIẢI MÃ HỎNG ĐỐI CHỨNG ⇒ MỌI KẾT LUẬN BÊN DƯỚI KHÔNG ĐÁNG TIN.");
  process.exit(1);
}

// ═══════════════════ ĐO 7 TRƯỜNG TRÊN DỮ LIỆU THẬT ═══════════════════
const TARGETS = [
  { key: "workflowStepApprovers", field: "fullName" },
  { key: "workflowStepApprovers", field: "employeeCode" },
  { key: "workflowStepApprovers", field: "role" },
  { key: "departmentModulePermissions", field: "organizationCode" },
  { key: "departmentModulePermissions", field: "organizationName" },
  { key: "systemLevelCatalog", field: "rank" },
  { key: "staffDirectory", field: "roleName" },
  { key: "staffDirectory", field: "organizationCode" },
  { key: "staffDirectory", field: "organizationName" },
];

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

const { javaByKey } = loadJavaSqlByKey({});
const data = await loginAs("admin", "Admin123456@");
const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`); };
let skipped = 0;

console.log("\n═══ ĐO TRƯỜNG ALIAS — đối chiếu CỘT NGUỒN thật trên MySQL ═══");
const filledCond = (col, type) =>
  ["char", "varchar", "text", "tinytext", "mediumtext", "longtext", "enum", "set", "json"].includes(String(type).toLowerCase())
    ? `\`${col}\` IS NOT NULL AND \`${col}\` <> ''` : `\`${col}\` IS NOT NULL`;
const colType = (t, c) => sqlOne(
  `SELECT DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='vntech_erp' AND TABLE_NAME='${t}' AND COLUMN_NAME='${c}'`);

for (const { key, field } of TARGETS) {
  const stmt = (javaByKey.get(key) ?? []).find((s) => /\bfrom\b/i.test(s));
  if (!stmt) { console.log(`  (bỏ qua) ${key}.${field}: không trích được SQL`); skipped++; continue; }
  const r = resolveField(stmt, field);
  if (r.error) { check(`${key}.${field}: giải được cột nguồn`, false, r.error); continue; }
  const type = colType(r.table, r.column);
  if (!type) { console.log(`  (bỏ qua) ${key}.${field}: cột ${r.table}.${r.column} không có trong lược đồ`); skipped++; continue; }
  const dbTotal = Number(sqlOne(`SELECT COUNT(*) FROM ${r.table}`));
  const dbFilled = Number(sqlOne(`SELECT COUNT(*) FROM ${r.table} WHERE ${filledCond(r.column, type)}`));
  const rows = data[key] ?? [];
  const apiFilled = rows.filter((x) => {
    const v = x[field];
    return v !== null && v !== undefined && String(v).trim() !== "";
  }).length;
  const detail = `${r.table}.${r.column} (${type}) MySQL ${dbFilled}/${dbTotal} có dữ liệu · API ${apiFilled}/${rows.length} dòng không rỗng`;
  if (dbFilled > 0 && apiFilled === 0) check(`${key}.${field} ← ${r.expr.slice(0, 40)}`, false, detail);
  else if (dbFilled === 0) { console.log(`  (bỏ qua) ${key}.${field}: cột nguồn rỗng ⇒ chưa chứng minh được — ${detail}`); skipped++; }
  else check(`${key}.${field} ← ${r.table}.${r.column}`, true, detail);
}

// teamMembers — bảng rỗng: KHÔNG thể kiểm trường (nói rõ, không tính ĐẠT)
console.log("\n═══ teamMembers — bảng nguồn rỗng ═══");
const tm = Number(sqlOne("SELECT COUNT(*) FROM team_members"));
const tmApi = (data.teamMembers ?? []).length;
console.log(`  team_members ${tm} dòng · API trả ${tmApi} dòng ⇒ KHÔNG có dòng để kiểm TRƯỜNG (không tính ĐẠT)`);
if (tm === 0) skipped++; else check("teamMembers: số dòng khớp nguồn", tmApi === tm, `${tmApi} ↔ ${tm}`);

const pass = results.filter((x) => x.ok).length;
console.log(`\n═══ KẾT QUẢ: ${pass}/${results.length} ĐẠT` + (skipped ? ` · ${skipped} phép đo không thực hiện được` : "") + " ═══");
console.log("GIỚI HẠN: `COALESCE(a.x,b.y)` chỉ đo cột ĐẦU; cột nguồn phải có trong lược đồ đang chạy;");
console.log("         câu JOIN chỉ giải được alias khai trong FROM/JOIN của chính câu đó.");
process.exit(results.every((x) => x.ok) ? 0 : 1);
