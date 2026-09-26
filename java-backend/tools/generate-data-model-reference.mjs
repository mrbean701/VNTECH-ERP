#!/usr/bin/env node
/**
 * VNTECH ERP — Sinh Data Model Reference từ 76 file migration (drizzle/0000..0075).
 *
 * Hợp nhất:
 *   - CREATE TABLE `x` ( cột + PK + FK + UNIQUE )
 *   - ALTER TABLE `x` ADD [`COLUMN`] `col` TYPE ...
 *   - CREATE [UNIQUE] INDEX `name` ON `x` (...)
 * Xuất `java-backend/DATA_MODEL_REFERENCE.md` + `.json` (114 bảng, cột, FK, index).
 *
 * ĐẶT Ở java-backend/tools — KHÔNG đặt trong scripts/ (fingerprint gate bản JS).
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const javaBackend = resolve(repoRoot, "java-backend");
const drizzleDir = process.argv[2] || join(repoRoot, "drizzle");
mkdirSync(javaBackend, { recursive: true });

const files = readdirSync(drizzleDir).filter((f) => f.endsWith(".sql"));
/** Bảng: name -> { columns: Map<name, {type, notNull, default, pk, ref}>, indexes: [], fks: [] } */
const tables = new Map();

function table(name) {
  if (!tables.has(name)) {
    tables.set(name, { name, columns: new Map(), indexes: [], fks: [] });
  }
  return tables.get(name);
}

const IDENT = "`?([a-zA-Z0-9_]+)`?";
function parseCreateTable(sql, fileName) {
  // Tìm "CREATE TABLE [IF NOT EXISTS] name (" rồi đếm depth để lấy tới ")" đóng thật sự
  // (body có thể chứa UNIQUE(...), DEFAULT('...') nhiều cấp ngoặc).
  const headerRe = /CREATE TABLE(?:\s+IF NOT EXISTS)?\s+`?([a-zA-Z0-9_]+)`?\s*\(/g;
  let m;
  while ((m = headerRe.exec(sql)) !== null) {
    const t = table(m[1]);
    let i = headerRe.lastIndex;
    let depth = 1;
    let inSingle = false, inDouble = false;
    while (i < sql.length && depth > 0) {
      const ch = sql[i];
      if (inSingle) { if (ch === "'") inSingle = false; }
      else if (inDouble) { if (ch === '"') inDouble = false; }
      else if (ch === "'") inSingle = true;
      else if (ch === '"') inDouble = true;
      else if (ch === "(") depth++;
      else if (ch === ")") depth--;
      i++;
    }
    const body = sql.slice(headerRe.lastIndex, i - 1);
    parseColumnsAndConstraints(t, body, fileName);
  }
}

function splitTopLevel(body) {
  // Tách CREATE TABLE body thành các clause (cột / constraint) tại dấu phẩy
  // ở cấp ngoặc sâu nhất = 0 — robust với UNIQUE(...) trải nhiều dòng.
  const clauses = [];
  let depth = 0, start = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    else if (ch === "," && depth === 0) {
      clauses.push(body.slice(start, i)); start = i + 1;
    }
  }
  clauses.push(body.slice(start));
  return clauses.map((c) => c.replace(/\s+/g, " ").trim()).filter(Boolean);
}

function parseColumnsAndConstraints(t, body, fileName) {
  const clauses = splitTopLevel(body);
  for (const raw of clauses) {
    let line = raw.replace(/,$/, "").trim();
    if (!line) continue;

    const fk = line.match(/^FOREIGN KEY\s*\(`?([a-zA-Z0-9_]+)`?\)\s*REFERENCES\s+`?([a-zA-Z0-9_]+)`?\s*\(`?([a-zA-Z0-9_]+)`?\)/);
    if (fk) {
      t.fks.push({ column: fk[1], refTable: fk[2], refColumn: fk[3] });
      continue;
    }
    const tablePk = line.match(/^PRIMARY\s+KEY\s*\((.+)\)$/);
    if (tablePk) {
      for (const name of parseColList(tablePk[1])) {
        const col = t.columns.get(name);
        if (col) col.pk = true;
      }
      continue;
    }
    const uniqueInline = line.match(/^UNIQUE\s*\((.+)\)$/);
    if (uniqueInline) {
      t.indexes.push({ name: `${t.name}_inline_unique`, unique: true, columns: parseColList(uniqueInline[1]) });
      continue;
    }
    const col = line.match(new RegExp(`^${IDENT}\\s+([A-Za-z]+)`));
    if (col) {
      const colName = col[1];
      const type = col[2].toUpperCase();
      const notNull = /NOT NULL/.test(line);
      const pk = /PRIMARY KEY/.test(line);
      const defMatch = line.match(/DEFAULT\s+(.+?)(?:\s+(?:NOT\s+NULL|PRIMARY\s+KEY))?$/);
      const defaultVal = defMatch ? defMatch[1].replace(/^'(.*)'$/, "$1") : undefined;
      const refMatch = line.match(/REFERENCES\s+`?([a-zA-Z0-9_]+)`?\s*\(`?([a-zA-Z0-9_]+)`?\)/);
      const colDef = { name: colName, type, notNull, pk, default: defaultVal };
      if (refMatch) colDef.ref = `${refMatch[1]}(${refMatch[2]})`;
      t.columns.set(colName, colDef);
      continue;
    }
    // Dòng lạ — cảnh báo nhẹ (không fail)
    console.error(`[warn] ${fileName}: bỏ qua dòng không parse được: ${line.slice(0, 100)}`);
  }
}

function parseColList(s) {
  return s.split(",").map((c) => c.trim().replace(/^`|`$/g, "")).filter(Boolean);
}

function parseAlterTable(sql, fileName) {
  // ALTER TABLE `t` ADD `col` TYPE ...;
  const re = /ALTER TABLE\s+`?([a-zA-Z0-9_]+)`?\s+ADD(?:\s+COLUMN)?\s+`?([a-zA-Z0-9_]+)`?\s+([^;]+);/g;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const t = table(m[1]);
    const colName = m[2];
    const rest = m[3].trim();
    const typeMatch = rest.match(/^([A-Za-z]+)/);
    if (!typeMatch) {
      console.error(`[warn] ${fileName}: ALTER ADD không rõ type: ${m[3].slice(0, 100)}`);
      continue;
    }
    const notNull = /NOT NULL/.test(rest);
    const defMatch = rest.match(/DEFAULT\s+(.+?)(?:\s+NOT\s+NULL)?$/);
    const refMatch = rest.match(/REFERENCES\s+`?([a-zA-Z0-9_]+)`?\s*\(`?([a-zA-Z0-9_]+)`?\)/);
    const colDef = {
      name: colName,
      type: typeMatch[1].toUpperCase(),
      notNull,
      pk: false,
      default: defMatch ? defMatch[1].replace(/^'(.*)'$/, "$1") : undefined,
    };
    if (refMatch) colDef.ref = `${refMatch[1]}(${refMatch[2]})`;
    t.columns.set(colName, colDef);
  }
}

function parseIndexes(sql, fileName) {
  const re = /CREATE\s+(UNIQUE\s+)?INDEX(?:\s+IF NOT EXISTS)?\s+`?([a-zA-Z0-9_]+)`?\s+ON\s+`?([a-zA-Z0-9_]+)`?\s*\(([^)]+)\)/g;
  let m;
  while ((m = re.exec(sql)) !== null) {
    const t = table(m[3]);
    t.indexes.push({ name: m[2], unique: Boolean(m[1]), columns: parseColList(m[4]) });
  }
}

for (const f of files) {
  const sql = readFileSync(join(drizzleDir, f), "utf8");
  parseCreateTable(sql, f);
  parseAlterTable(sql, f);
  parseIndexes(sql, f);
}

// ---- Xuất JSON ----
const model = [...tables.values()]
  .map((t) => ({
    table: t.name,
    columns: [...t.columns.values()],
    indexes: t.indexes,
    foreignKeys: t.fks,
  }))
  .sort((a, b) => a.table.localeCompare(b.table));

const jsonPath = join(javaBackend, "DATA_MODEL_REFERENCE.json");
writeFileSync(jsonPath, JSON.stringify({ generatedFrom: drizzleDir, tableCount: model.length, tables: model }, null, 2));

// ---- Xuất Markdown ----
const lines = [];
lines.push("# DATA MODEL REFERENCE — VNTECH ERP (nguồn cho MySQL/Flyway)");
lines.push("");
lines.push(`- Nguồn: \`drizzle/0000..0075\` (${files.length} migration, dialect SQLite/Postgres) — branch \`unity\``);
lines.push(`- Tổng bảng: **${model.length}**`);
lines.push(`- Mục tiêu: sinh \`V1__baseline.sql\` dialect MySQL 8.4 (utf8mb4, DATETIME(3) thay TEXT timestamp)`);
lines.push("");
lines.push("## Nhóm nghiệp vụ (ước theo tên bảng)");
lines.push("");
const groups = {
  "Master data": /^(projects|project_contracts|boq_versions|suppliers|teams|materials|material_categories|material_subcategories|material_aliases|role_|business_|org|units|departments|company_|catalog|document_sequences)/,
  "Kho / tồn": /^(warehouses|goods_receipts|stock_|transfer_|central_|procurement_allocations|contract_stock|inventory|stocktake)/,
  "Mua hàng / phê duyệt": /^(material_requests|purchase_orders|approvals|supply_|po_)/,
  "BOQ / mapping": /^(project_boq|boq_|material_embeddings|mar_)/,
  "Tài chính / pháp chế": /^(payment|advance|site_|cashbook|bank_|accounting_|capital_|contract_payments|production_|construction_|hr_|labor_|correspondence|legal_|seal_|benefit_)/,
  "Security / audit / trust": /^(users|sessions|user_|audit_|email_|vntech_|attachments|custom_field_|form_field_)/,
};
const grouped = {};
for (const t of model) {
  let g = "Khác";
  for (const [name, re] of Object.entries(groups)) {
    if (re.test(t.table)) { g = name; break; }
  }
  (grouped[g] ??= []).push(t.table);
}
for (const [g, list] of Object.entries(grouped)) {
  lines.push(`### ${g} (${list.length})`);
  lines.push("");
  lines.push(list.map((t) => `- \`${t}\``).join("\n"));
  lines.push("");
}
lines.push("## Chi tiết từng bảng");
lines.push("");
for (const t of model) {
  lines.push(`### \`${t.table}\``);
  lines.push("");
  lines.push("| cột | kiểu (nguồn) | NOT NULL | PK | default | ref |");
  lines.push("|---|---|---|---|---|---|");
  for (const c of t.columns) {
    lines.push(`| ${c.name} | ${c.type} | ${c.notNull ? "✅" : ""} | ${c.pk ? "✅" : ""} | ${c.default ?? ""} | ${c.ref ?? ""} |`);
  }
  if (t.indexes.length) {
    lines.push("");
    lines.push("Indexes:");
    for (const i of t.indexes) {
      lines.push(`- ${i.unique ? "UNIQUE " : ""}\`${i.name}\` (${i.columns.join(", ")})`);
    }
  }
  if (t.foreignKeys.length) {
    lines.push("");
    lines.push("FK:");
    for (const f of t.foreignKeys) {
      lines.push(`- \`${f.column}\` → \`${f.refTable}(${f.refColumn})\``);
    }
  }
  lines.push("");
}

const mdPath = join(javaBackend, "DATA_MODEL_REFERENCE.md");
writeFileSync(mdPath, lines.join("\n"));
console.log(`Data Model Reference: ${model.length} tables`);
console.log(`  -> ${mdPath}`);
console.log(`  -> ${jsonPath}`);