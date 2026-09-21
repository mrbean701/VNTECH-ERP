// TASK-125 (21/09/2026) — HỢP ĐỒNG: «Đối tác» phải là BẢNG RIÊNG + MÀN RIÊNG.
//
// QUYẾT ĐỊNH NGUYÊN VĂN CỦA NGƯỜI DÙNG (21/09/2026):
//   ① «Đối tác là bảng riêng»  ⇒ bảng `partners` THẬT + màn `PartnerManager` THẬT (KHÔNG mở cùng màn NCC).
//   ② «Cho nhập dữ liệu»       ⇒ được INSERT/UPDATE dữ liệu test.
//   ③ «Không cần gộp»          ⇒ giữ nguyên 3 lối vào NCC.
//
// Test này ĐỎ trước khi làm (chưa có bảng/màn) và XANH sau khi làm. 5 điều kiện:
//   ① có `CREATE TABLE partners` trong `drizzle/`
//   ② tệp migration MỚI: 0 câu DROP/ALTER/TRUNCATE/DELETE (chỉ THÊM)
//   ③ 0 khoá `module_catalog` MỚI (không có dòng `dept_plan_partners` nào được ghi vào `module_catalog`)
//   ④ màn mới tồn tại + menu `dept_plan_partners` render MÀN ĐỐI TÁC
//   ⑤ KHÔNG bịa dữ liệu khi trống

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DRIZZLE_DIR = join(ROOT, "drizzle");
const MIGRATION = join(DRIZZLE_DIR, "0165_task125_partners_table_identity.sql");
const SCREEN = join(ROOT, "app", "screens", "PartnerManager.tsx");
const PAGE = join(ROOT, "app", "page.tsx");
const MENU_HELPERS = join(ROOT, "lib", "menu-helpers.ts");

const doc = (p) => readFileSync(p, "utf8");

test("TASK-125 ① có `CREATE TABLE partners` trong `drizzle/`", () => {
  assert.ok(existsSync(MIGRATION), `Thiếu tệp migration ${MIGRATION}`);
  const sql = doc(MIGRATION);
  assert.match(sql, /CREATE TABLE\s+`partners`/i, "Migration phải có `CREATE TABLE `partners``");
  // Cột tối thiểu hợp lý — theo đúng quy ước cột của `suppliers`.
  for (const col of ["id", "code", "name", "tax_code", "address", "contact_name", "contact_phone",
    "email", "partner_type", "status", "active", "created_at", "updated_at"]) {
    assert.match(sql, new RegExp("`" + col + "`\\s"), `Thiếu cột \`${col}\``);
  }
  assert.match(sql, /`id`\s+text PRIMARY KEY NOT NULL/i, "Khoá chính phải GIỐNG `suppliers`: text PRIMARY KEY NOT NULL");
  assert.match(sql, /CREATE UNIQUE INDEX\s+`partners_code_uidx`/i, "Thiếu unique index cho `code` (khuôn `suppliers_code_uidx`)");
});

test("TASK-125 ② migration CHỈ THÊM: 0 câu DROP/ALTER/TRUNCATE/DELETE", () => {
  const sql = doc(MIGRATION);
  const statements = sql
    .split("--> statement-breakpoint")
    .map((s) => s.split("\n").filter((line) => !line.trim().startsWith("--")).join("\n").trim())
    .filter(Boolean);
  for (const stmt of statements) {
    assert.ok(!/^\s*DROP\b/i.test(stmt), `Có câu DROP: ${stmt.slice(0, 120)}`);
    assert.ok(!/^\s*ALTER\b/i.test(stmt), `Có câu ALTER: ${stmt.slice(0, 120)}`);
    assert.ok(!/^\s*TRUNCATE\b/i.test(stmt), `Có câu TRUNCATE: ${stmt.slice(0, 120)}`);
    assert.ok(!/^\s*DELETE\b/i.test(stmt), `Có câu DELETE: ${stmt.slice(0, 120)}`);
    assert.ok(!/\bsuppliers\b/.test(stmt), `Câu lệnh CHẠM bảng cũ \`suppliers\`: ${stmt.slice(0, 120)}`);
  }
  // Bản MySQL (Flyway) phải cùng tính chất ADDITIVE.
  const flyway = join(ROOT, "java-backend", "infrastructure", "src", "main", "resources", "db", "migration", "V23__partners_table.sql");
  assert.ok(existsSync(flyway), `Thiếu bản Flyway ${flyway}`);
  const my = doc(flyway);
  assert.match(my, /CREATE TABLE\s+(IF NOT EXISTS\s+)?`?partners`?/i, "Bản Flyway phải có `CREATE TABLE partners`");
  assert.ok(!/^\s*(DROP|ALTER|TRUNCATE|DELETE)\b/im.test(my), "Bản Flyway phải ADDITIVE (0 DROP/ALTER/TRUNCATE/DELETE)");
});

test("TASK-125 ③ 0 khoá `module_catalog` MỚI (không có dòng `dept_plan_partners`)", () => {
  // Quét mọi tệp SQL: KHÔNG được có câu ghi dòng `dept_plan_partners` vào `module_catalog`.
  const sqlFiles = [];
  const walk = (dir, depth = 0) => {
    if (depth > 4 || !existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "target") continue;
      const p = join(dir, entry.name);
      if (entry.isDirectory()) walk(p, depth + 1);
      else if (entry.name.endsWith(".sql")) sqlFiles.push(p);
    }
  };
  walk(DRIZZLE_DIR);
  walk(join(ROOT, "java-backend"));
  assert.ok(sqlFiles.length > 100, `Số tệp .sql quét được quá ít: ${sqlFiles.length}`);
  const offenders = [];
  for (const f of sqlFiles) {
    const text = doc(f);
    if (!/dept_plan_partners/.test(text)) continue;
    for (const stmt of text.split(";")) if (/module_catalog/i.test(stmt)) offenders.push(`${f}: ${stmt.trim().slice(0, 120)}`);
  }
  assert.deepEqual(offenders, [], "KHÔNG được thêm khoá `dept_plan_partners` vào `module_catalog`");

  // Khoá menu vẫn nằm ở tầng CODE với cổng quyền CŨ.
  const helpers = doc(MENU_HELPERS);
  const line = helpers.split("\n").find((l) => l.includes('dept_plan_partners'));
  assert.ok(line, "`lib/menu-helpers.ts` phải còn khai mục menu `dept_plan_partners`");
  assert.match(line, /permissionKeys:\s*\["dept_plan_suppliers"\]/, "Cổng quyền phải là khoá CŨ `dept_plan_suppliers`");
  assert.ok(!/ModuleKey\s*=.*dept_plan_partners/s.test(helpers), "`dept_plan_partners` KHÔNG được thành khoá module thật");
});

test("TASK-125 ④ màn mới tồn tại + menu `dept_plan_partners` render MÀN ĐỐI TÁC", () => {
  assert.ok(existsSync(SCREEN), `Thiếu màn mới ${SCREEN}`);
  const screen = doc(SCREEN);
  assert.match(screen, /function\s+PartnerManager/, "Phải có component `PartnerManager`");
  assert.match(screen, /export\s*\{[\s\S]*PartnerManager[\s\S]*\}/, "Phải export `PartnerManager`");
  // CRUD + tìm kiếm (khuôn màn `SupplierManager`).
  assert.match(screen, /action\("save_partner"/, "Thiếu action `save_partner` (thêm/sửa)");
  assert.match(screen, /action\("delete_partner"/, "Thiếu action `delete_partner` (xoá)");
  assert.match(screen, /set_partner_status/, "Thiếu action `set_partner_status` (ngừng dùng/kích hoạt)");
  assert.match(screen, /search|searchText|keyword/i, "Thiếu ô TÌM KIẾM");

  const page = doc(PAGE);
  assert.match(page, /import\s*\{\s*PartnerManager\s*\}\s*from\s*"@\/app\/screens\/PartnerManager"/,
    "`app/page.tsx` phải import `PartnerManager`");
  // Menu «Đối tác» (`supplierPartnerMenuItems` → view "partner") phải render `PartnerManager`,
  // KHÔNG còn `SupplierManager view="partner"`.
  assert.match(page, /supplierPartnerScreenView\s*===\s*"partner"[\s\S]{0,80}<PartnerManager/,
    "Nhánh `view === \"partner\"` phải render `<PartnerManager …>`, KHÔNG dùng `SupplierManager view=\"partner\"`");
});

test("TASK-125 ⑤ KHÔNG bịa dữ liệu khi trống", () => {
  const screen = doc(SCREEN);
  assert.match(screen, /<Empty\b/, "Khi bảng đối tác TRỐNG phải hiện `<Empty>` nói rõ, KHÔNG bịa dòng");
  assert.match(screen, /data\.partners/, "Màn phải đọc ĐÚNG nguồn `data.partners`");
  assert.ok(!/data\.(adminSuppliers|suppliers)\b/.test(screen),
    "Màn đối tác KHÔNG được lấy dữ liệu nhà cung cấp làm dữ liệu đối tác (bịa dữ liệu)");
});
