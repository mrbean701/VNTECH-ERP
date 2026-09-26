// ════════════════════════════════════════════════════════════════════════════════════════════
// TASK-070 — CỔNG "ĐỘ PHỦ TRƯỜNG" cho 11 khoá JAVA-ONLY: trường API trả về có DỮ LIỆU THẬT không?
// ════════════════════════════════════════════════════════════════════════════════════════════
// VÌ SAO CÓ CỔNG NÀY: TASK-069 mới kiểm được **khoá + số dòng**. Lớp lỗi còn lại là **TRƯỜNG BÊN TRONG**:
// khoá CÓ, số dòng ĐÚNG, nhưng một trường **luôn rỗng/null** vì port sai alias/không SELECT cột đó —
// đúng dạng đã gặp nhiều lần (vd `roleCatalog.businessGroupName` luôn "—", `constructionDailyLogs.itemCount` luôn 0).
//
// CÁCH ĐO (độc lập với mã Java, chỉ đọc SQL + MySQL):
//   1. Lấy câu SQL của từng khoá từ chính adapter (mô-đun dùng chung `sql-parity-extract.mjs`).
//   2. Lấy **tập trường** API trả về (danh sách SELECT … AS alias).
//   3. Với mỗi trường, suy tên cột nguồn bằng **camel → snake_case**; nếu cột đó CÓ trong bảng nguồn thì đo
//      `COUNT(*)` và `SUM(cột IS NOT NULL AND cột <> '')` trên MySQL.
//   4. So với dữ liệu THẬT trong payload: nếu MySQL có dữ liệu mà **mọi dòng API đều rỗng/null** ⇒ **HỎNG**
//      (trường bị bỏ im lặng). Nếu MySQL cũng rỗng ⇒ **bỏ qua** (không có dữ liệu để chứng minh — KHÔNG tính ĐẠT).
//
// GIỚI HẠN (nói thẳng):
//   • Chỉ đối chiếu được trường có alias **trùng tên cột nguồn** sau khi đổi camel↔snake. Trường đặt tên khác
//     (`contractNo` ← `c.contract_no`) sẽ được gộp vào nhóm "không đối chiếu được" và IN RA, không im lặng.
//   • Với câu JOIN nhiều bảng, cột được tìm trên **bảng đầu tiên trong `FROM`** — có thể bỏ sót.
//   • Cổng KHÔNG phán "sai nghiệp vụ"; nó chỉ phán "có dữ liệu ở DB mà API trả rỗng".
//
// Chạy: node tools/probe-task070-field-coverage.mjs [base]
import { execFileSync } from "node:child_process";
import { loadJavaSqlByKey, columnsOf } from "./lib/sql-parity-extract.mjs";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const sql = (q) => execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech",
  "vntech_erp", "--batch", "--raw", "--skip-column-names", "-e", q], { encoding: "utf8" });
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };

const camelToSnake = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();

const KEYS = ["workflowDefinitions", "workflowSteps", "workflowStepApprovers", "departmentModulePermissions",
  "systemLevelCatalog", "staffDirectory", "formFieldConfigs", "teamMembers", "supplySteps", "workItemEvents"];

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
const tableColumns = new Map();
/** Trả Map<cột, kiểu dữ liệu>. Cần KIỂU vì MySQL 8 từ chối so `DATETIME <> ''` (lỗi 1525). */
const columnsOfTable = (t) => {
  if (!tableColumns.has(t)) {
    tableColumns.set(t, new Map(sqlRows(
      `SELECT COLUMN_NAME, DATA_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='vntech_erp' AND TABLE_NAME='${t}'`
    ).map((r) => [r[0], r[1]])));
  }
  return tableColumns.get(t);
};
const TEXTY = new Set(["char", "varchar", "text", "tinytext", "mediumtext", "longtext", "enum", "set", "json"]);
/** Điều kiện "cột có dữ liệu": NULL-safe và KHÔNG so chuỗi với cột không phải chuỗi (bài học lỗi 1525). */
const filledCondition = (col, type) =>
  TEXTY.has(String(type).toLowerCase()) ? `\`${col}\` IS NOT NULL AND \`${col}\` <> ''` : `\`${col}\` IS NOT NULL`;

console.log("═══ ĐỘ PHỦ TRƯỜNG — 11 khoá JAVA-ONLY (đối chiếu MySQL theo TỪNG TRƯỜNG) ═══");
for (const key of KEYS) {
  const sqls = javaByKey.get(key) ?? [];
  const rows = data[key];
  if (!sqls.length) { console.log(`\n  (bỏ qua) ${key}: không trích được SQL từ adapter`); skipped++; continue; }
  const stmt = sqls.find((s) => /\bFROM\b/i.test(s)) ?? sqls[0];
  const table = (stmt.match(/\bFROM\s+([a-z_][a-z0-9_]*)/i) ?? [])[1];
  const fields = [...columnsOf(stmt).columns];
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`\n  ${key}: API trả ${Array.isArray(rows) ? 0 : typeof rows} dòng với ${fields.length} trường ⇒ KHÔNG có dòng để kiểm trường (bỏ qua)`);
    skipped++;
    continue;
  }
  const cols = table ? columnsOfTable(table) : new Set();
  const apiFields = new Set(Object.keys(rows[0]));
  const comparable = fields.filter((f) => cols.has(camelToSnake(f)));
  const notComparable = fields.filter((f) => !cols.has(camelToSnake(f)));
  console.log(`\n  ${key}: ${rows.length} dòng · ${fields.length} trường · ${comparable.length} trường đối chiếu được · ${notComparable.length} trường KHÔNG đối chiếu được` +
    (notComparable.length ? `\n      (không đối chiếu được: ${notComparable.slice(0, 8).join(", ")}${notComparable.length > 8 ? "…" : ""})` : ""));
  const bad = [];
  let proved = 0;
  for (const f of comparable) {
    const col = camelToSnake(f);
    const dbTotal = Number(sqlOne(`SELECT COUNT(*) FROM ${table}`));
    const dbFilled = Number(sqlOne(`SELECT COUNT(*) FROM ${table} WHERE ${filledCondition(col, cols.get(col))}`));
    if (dbFilled === 0) continue;                       // DB rỗng ⇒ không có gì để chứng minh
    proved++;
    const apiFilled = rows.filter((r) => {
      const v = r[f];
      return v !== null && v !== undefined && String(v).trim() !== "";
    }).length;
    if (apiFilled === 0) bad.push(`${f}: MySQL ${dbFilled}/${dbTotal} có dữ liệu nhưng API 0/${rows.length} dòng`);
  }
  if (bad.length) check(`${key}: mọi trường có dữ liệu ở DB đều KHÔNG rỗng ở API`, false, bad.join(" | "));
  else if (proved === 0) { console.log(`  (bỏ qua) ${key}: không trường nào có dữ liệu ở cả hai phía để chứng minh`); skipped++; }
  else check(`${key}: ${proved} trường đối chiếu được — API có dữ liệu ở mọi trường`, true, `đã đối chiếu ${proved} trường`);
  const missing = fields.filter((f) => !apiFields.has(f));
  if (missing.length) check(`${key}: mọi trường khai trong SQL đều CÓ trong payload`, false, `thiếu: ${missing.join(", ")}`);
}

const pass = results.filter((r) => r.ok).length;
console.log(`\n═══ KẾT QUẢ: ${pass}/${results.length} ĐẠT` + (skipped ? ` · ${skipped} phép đo không thực hiện được` : "") + " ═══");
console.log("GIỚI HẠN: chỉ đối chiếu trường có alias TRÙNG tên cột nguồn (camel→snake); câu JOIN nhiều bảng chỉ tìm");
console.log("         cột trên bảng ĐẦU TIÊN trong FROM; cổng chỉ phán 'DB có dữ liệu mà API rỗng', KHÔNG phán nghiệp vụ.");
process.exit(results.every((r) => r.ok) ? 0 : 1);
