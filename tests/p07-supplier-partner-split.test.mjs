// PHASE 7 (`P-07`) — HỢP ĐỒNG MENU: TÁCH MỤC GỘP «Nhà cung cấp / Đối tác» THÀNH 2 MỤC
// «Nhà cung cấp» (`dept_plan_suppliers`) + «Đối tác` (`dept_plan_partners`).
//
// Vì sao kiểm ở tầng NGUỒN (không phải DOM): nhánh `P-07` BỊ CẤM build/khởi động dịch vụ, mà bằng chứng
// runtime chỉ có nghĩa SAU khi build lại bundle — đúng cách `tests/t01-work-menu.test.mjs` /
// `tests/w01-warehouse-menu.test.mjs` đang làm.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/p07-supplier-partner-split.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const menuHelpers = read("lib/menu-helpers.ts");
const uiShared = read("lib/ui-shared.tsx");
const page = read("app/page.tsx");
const supplierManager = read("app/screens/SupplierManager.tsx");

// Bản GỐC trước `P-07` (tip nhánh lúc làm task) — dùng để chứng minh «mọi mục menu KHÁC không đổi».
const BASELINE_COMMIT = "a11fe9e";
const baselineMenuHelpers = (() => {
  try {
    return execFileSync("git", ["show", `${BASELINE_COMMIT}:lib/menu-helpers.ts`], {
      cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    return assert.fail(`Không đọc được bản gốc \`${BASELINE_COMMIT}:lib/menu-helpers.ts\` để đối chiếu: ${error.message}`);
  }
})();

// ── BẢNG CHỐT `P-07` ────────────────────────────────────────────────────────────────────────────
// # | key (tầng MENU CODE) | nhãn | đích đến (view) | cổng quyền (`permissionKeys` — khoá ĐÃ CÓ)
const EXPECTED = [
  { key: "dept_plan_suppliers", label: "Nhà cung cấp", moduleKey: "dept_plan_suppliers", view: "supplier", permissionKeys: ["dept_plan_suppliers"] },
  { key: "dept_plan_partners", label: "Đối tác", moduleKey: "dept_plan_suppliers", view: "partner", permissionKeys: ["dept_plan_suppliers"] },
];

/** Cắt khối khai báo `const <name> … \n];` (không phụ thuộc kiểu xuống dòng; `];` phải ở ĐẦU DÒNG). */
function blockOf(text, name) {
  const start = text.indexOf(`const ${name}`);
  assert.ok(start > 0, `Không tìm thấy khối khai báo \`${name}\``);
  const end = /\r?\n\];/.exec(text.slice(start));
  assert.ok(end, `Không tìm thấy dấu kết thúc \`];\` của khối \`${name}\``);
  return text.slice(start, start + end.index + end[0].length);
}

/** Cắt thân một `function <name>(…) { … }` khai báo nhiều dòng. */
function functionOf(text, name) {
  const start = text.indexOf(`function ${name}(`);
  const end = text.indexOf("\n}", start);
  assert.ok(start > 0 && end > start, `Không tìm thấy hàm \`${name}\``);
  return text.slice(start, end);
}

/** Bảng `key | label` (theo ĐÚNG thứ tự khai báo) của một khối mục menu. */
function tableOf(text, name) {
  const block = blockOf(text, name);
  const rows = [];
  const re = /key: "([^"]+)", label: "([^"]+)"/g;
  let match;
  while ((match = re.exec(block)) !== null) rows.push([match[1], match[2]]);
  assert.ok(rows.length > 0, `Khối \`${name}\` không có mục menu nào`);
  return rows;
}

/** So 2 bảng `key|label` → danh sách khác biệt. */
function diffTables(before, after) {
  const index = (rows) => new Map(rows.map(([key, label]) => [key, { label }]));
  const a = index(before);
  const b = index(after);
  const out = [];
  for (const [key, value] of a) {
    if (!b.has(key)) out.push({ key, from: value.label, to: null, kind: "removed" });
    else if (b.get(key).label !== value.label) out.push({ key, from: value.label, to: b.get(key).label, kind: "relabelled" });
  }
  for (const [key, value] of b) if (!a.has(key)) out.push({ key, from: null, to: value.label, kind: "added" });
  return {
    out,
    sameOrder: before.map(([key]) => key).join("|") === after.map(([key]) => key).join("|"),
  };
}

const moduleKeyUnion = (() => {
  const start = uiShared.indexOf("type ModuleKey =");
  const end = uiShared.indexOf(";", start);
  assert.ok(start > 0 && end > start, "Không tìm thấy `type ModuleKey` trong lib/ui-shared.tsx");
  return uiShared.slice(start, end);
})();

const countIn = (text, needle) => text.split(needle).length - 1;

// ── ① ĐÚNG 2 MỤC RIÊNG ──────────────────────────────────────────────────────────────────────────
test("P-07 — nhóm «MUA HÀNG» có ĐÚNG 2 mục menu riêng: «Nhà cung cấp» + «Đối tác»", () => {
  const block = blockOf(menuHelpers, "supplierPartnerMenuItems");
  for (const item of EXPECTED) {
    const literal = `key: "${item.key}", label: "${item.label}", groupKey: "purchasing", moduleKey: "${item.moduleKey}", view: "${item.view}", permissionKeys: ["${item.permissionKeys[0]}"]`;
    assert.ok(block.includes(literal), `Thiếu/sai mục menu: ${literal}`);
  }
  assert.equal(countIn(block, 'key: "dept_plan_'), 2, "Phải khai báo ĐÚNG 2 mục menu");
  assert.equal(tableOf(menuHelpers, "supplierPartnerMenuItems").length, 2, "Bảng mục menu phải có ĐÚNG 2 dòng");
});

test("P-07 — nhãn GỘP «Nhà cung cấp / Đối tác» đã BIẾN MẤT khỏi mọi khai báo menu", () => {
  assert.equal(countIn(menuHelpers, "Nhà cung cấp / Đối tác"), 0, "Vẫn còn nhãn gộp «Nhà cung cấp / Đối tác»");
  const supplier = tableOf(menuHelpers, "modules").filter(([key]) => key === "dept_plan_suppliers");
  assert.equal(supplier.length, 1, "`modules` phải còn ĐÚNG 1 dòng khoá cũ `dept_plan_suppliers` (tương thích ngược)");
  assert.equal(supplier[0][1], "Nhà cung cấp", "Nhãn dòng `modules` của khoá cũ phải là «Nhà cung cấp»");
});

test("P-07 — khoá MENU mới `dept_plan_partners` KHÔNG phải khoá module (không thêm `ModuleKey`)", () => {
  assert.ok(moduleKeyUnion.includes('"dept_plan_suppliers"'), "`dept_plan_suppliers` phải là khoá module ĐÃ CÓ");
  assert.ok(!moduleKeyUnion.includes('"dept_plan_partners"'),
    "KHÔNG được thêm `dept_plan_partners` vào `ModuleKey` (đó là khoá tầng MENU CODE)");
  assert.ok(!tableOf(menuHelpers, "modules").some(([key]) => key === "dept_plan_partners"),
    "KHÔNG được thêm `dept_plan_partners` vào bảng `modules` (bảng đó là khoá module thật)");
  const block = blockOf(menuHelpers, "supplierPartnerMenuItems");
  assert.equal(countIn(menuHelpers.replace(block, ""), "dept_plan_partners"), 0,
    "Khoá menu mới chỉ được khai báo trong khối `supplierPartnerMenuItems`, không rải ra chỗ khác");
});

test("P-07 — cổng quyền: CẢ 2 mục trỏ khoá ĐÃ CÓ `dept_plan_suppliers` (KHÔNG khoá mới, KHÔNG hardcode admin)", () => {
  const block = blockOf(menuHelpers, "supplierPartnerMenuItems");
  assert.equal(tableOf(menuHelpers, "supplierPartnerMenuItems").length, 2);
  assert.equal(countIn(block, 'permissionKeys: ["dept_plan_suppliers"]'), 2,
    "Cả 2 mục phải dùng CHUNG khoá quyền đã có `dept_plan_suppliers`");
  assert.equal(countIn(block, "isAdminUser("), 0, "Cổng quyền mục menu KHÔNG được hardcode «chỉ admin»");
});

test("P-07 — ẩn mục CŨ khỏi cây menu (khoá vẫn sống) + bộ định tuyến `view` cho 2 mục", () => {
  assert.ok(menuHelpers.includes('const legacySupplierPartnerMenuKeys: ModuleKey[] = ["dept_plan_suppliers"];'),
    "Thiếu/sai `legacySupplierPartnerMenuKeys` (đúng khuôn `legacyWorkMenuKeys` / `legacyWarehouseMenuKeys`)");
  const router = functionOf(menuHelpers, "supplierPartnerViewFor");
  assert.match(router, /supplierPartnerViewFor\(view: SupplierPartnerMenuView \| null, active: ModuleKey\): SupplierPartnerMenuView \| null/,
    "Thiếu chữ ký hàm định tuyến `supplierPartnerViewFor`");
  assert.match(router, /active !== "dept_plan_suppliers"/, "Bộ định tuyến phải chốt theo khoá màn ĐÃ CÓ `dept_plan_suppliers`");
  assert.match(router, /view === "supplier" \|\| view === "partner"/, "Bộ định tuyến phải nhận cả 2 giá trị `supplier` / `partner`");
  assert.match(menuHelpers, /export type \{[^}]*SupplierPartnerMenuView[^}]*\}/, "Chưa export type `SupplierPartnerMenuView`");
});

// ── ①b ĐÃ NỐI VÀO CÂY MENU THẬT (`app/page.tsx`, khuôn `W-01`) ─────────────────────────────────
test("P-07 — app/page.tsx nối ĐỦ 8 điểm chạm (khuôn `W-01`) cho 2 mục mới", () => {
  for (const name of ["supplierPartnerMenuItems", "legacySupplierPartnerMenuKeys", "supplierPartnerViewFor"]) {
    assert.match(page, new RegExp(`import \\{[^}]*${name}[^}]*\\} from "@/lib/menu-helpers";`), `Thiếu import \`${name}\``);
  }
  assert.match(page, /import type \{[^}]*SupplierPartnerMenuView[^}]*\} from "@\/lib\/menu-helpers";/, "Thiếu import type `SupplierPartnerMenuView`");
  assert.match(page, /const \[supplierPartnerView, setSupplierPartnerView\] = useState<SupplierPartnerMenuView \| null>\(null\);/, "Thiếu state `supplierPartnerView`");
  const children = page.slice(page.indexOf("const supplierPartnerMenuChildren"), page.indexOf("});", page.indexOf("const supplierPartnerMenuChildren")));
  assert.match(children, /supplierPartnerMenuItems\.flatMap\(\(item\) => \{/, "Chưa suy ra mục menu từ khai báo code");
  assert.match(children, /item\.permissionKeys\.find\(\(key\) => modulePermission\(data, key\)\.canView\)/, "Thiếu cổng quyền `modulePermission(…).canView`");
  assert.doesNotMatch(children, /isAdminUser\(/, "Cổng quyền mục menu KHÔNG được hardcode «chỉ admin»");
  assert.match(page, /function activateModule\(next:ModuleKey, view:WorkMenuView\|WarehouseMenuView\|SupplierPartnerMenuView\|null=null\)\{/, "`activateModule` chưa nhận type `view` mới");
  assert.match(page, /setSupplierPartnerView\(view === "supplier" \|\| view === "partner" \? view : null\);/, "Thiếu `setSupplierPartnerView` trong `activateModule`");
  assert.match(page, /const supplierPartnerScreenView = supplierPartnerViewFor\(supplierPartnerView, active\);/, "Thiếu bộ định tuyến `view`");
  assert.match(page, /!legacySupplierPartnerMenuKeys\.includes\(item\.key\)/, "Cây menu chưa ẩn dòng khoá cũ `dept_plan_suppliers`");
  assert.match(page, /\(String\(group\.groupKey\) === "purchasing" && supplierPartnerMenuChildren\.length > 0\)/, "Nhóm «MUA HÀNG» chưa được giữ sống");
  assert.match(page, /const supplierPartnerMenuBadge = \(keys: ModuleKey\[\]\) => keys\.reduce\(\(sum, key\) => sum \+ badgeFor\(key\), 0\);/, "Thiếu phép cộng huy hiệu");
  assert.match(page, /supplierPartnerMenuBadge\(item\.badgeKeys\)/, "Huy hiệu mục con chưa dùng `supplierPartnerMenuBadge`");
  assert.equal((page.match(/groupKey==="purchasing"&&supplierPartnerMenuChildren\.map\(/g) || []).length, 2,
    "Phải vẽ 2 mục ở CẢ menu desktop LẪN menu mobile");
});

test("P-07 — màn đích: khoá cũ render `SupplierManager` kèm `view`, và KHÔNG còn rơi vào nhánh chung `dept_plan_*`", () => {
  assert.match(page, /active === "dept_plan_suppliers" && <SupplierManager data=\{data\} action=\{action\} view=\{supplierPartnerScreenView\} \/>/,
    "Chưa render `SupplierManager` cho khoá cũ kèm `view`");
  assert.doesNotMatch(page, /active\.startsWith\("dept_plan_"\) && active !== "dept_plan_tasks" && <DepartmentTaskWorkspace[\s\S]{0,600}?department="KH"/,
    "Khoá `dept_plan_suppliers` VẪN rơi vào nhánh chung `dept_plan_*` ⇒ sẽ render 2 màn cùng lúc");
  assert.match(supplierManager, /view\?:"supplier"\|"partner"\|null/, "`SupplierManager` chưa nhận prop `view`");
  assert.match(supplierManager, /view==="partner"/, "`SupplierManager` chưa có nhánh xử lý riêng cho «Đối tác»");
  assert.match(supplierManager, /CHƯA CÓ NGUỒN DỮ LIỆU ĐỐI TÁC RIÊNG/, "Thiếu cảnh báo «chưa có nguồn» cho dữ liệu đối tác (KHÔNG được bịa)");
  assert.doesNotMatch(supplierManager, /partner_type|partnerType/, "KHÔNG được thêm cột/loại dữ liệu «đối tác» mới");
});

// ── ② MỌI MỤC MENU KHÁC KHÔNG ĐỔI ───────────────────────────────────────────────────────────────
test("P-07 — MỌI khai báo menu KHÁC không đổi so với bản gốc (chỉ 1 nhãn đổi)", () => {
  for (const name of ["modules", "workMenuItems", "warehouseMenuItems"]) {
    const { out, sameOrder } = diffTables(tableOf(baselineMenuHelpers, name), tableOf(menuHelpers, name));
    assert.equal(sameOrder, true, `Thứ tự mục menu của khối \`${name}\` đã bị đổi`);
    if (name !== "modules") {
      assert.deepEqual(out, [], `Khối \`${name}\` phải GIỮ NGUYÊN (không thêm/bớt/đổi nhãn)`);
    } else {
      assert.deepEqual(out, [{ key: "dept_plan_suppliers", from: "Nhà cung cấp / Đối tác", to: "Nhà cung cấp", kind: "relabelled" }],
        "Bảng `modules` chỉ được phép đổi ĐÚNG 1 nhãn: «Nhà cung cấp / Đối tác» → «Nhà cung cấp»");
    }
  }
});

// ── ③ KHÔNG ĐỤNG `drizzle/**` (KHÔNG thêm dòng `module_catalog`) ────────────────────────────────
test("P-07 — KHÔNG thêm dòng `module_catalog`/migration: `drizzle/**` không nhắc `dept_plan_partners`", () => {
  const walk = (directory) => {
    const out = [];
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) out.push(...walk(path));
      else if (statSync(path).isFile()) out.push(path);
    }
    return out;
  };
  const drizzle = walk(`${ROOT}drizzle`);
  assert.ok(drizzle.length > 0, "Không quét được thư mục `drizzle/`");
  const hits = drizzle.filter((path) => readFileSync(path, "utf8").includes("dept_plan_partners"));
  assert.deepEqual(hits, [], `KHÔNG được thêm dòng \`module_catalog\` cho khoá mới. Tệp vi phạm: ${hits.join(", ")}`);

  const git = (args) => execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const pending = git(["status", "--porcelain", "--", "drizzle"]).trim();
  assert.equal(pending, "", `Thay đổi trong \`drizzle/\` là NGOÀI PHẠM VI \`P-07\`:\n${pending}`);
  const committed = git(["diff", "--name-only", "HEAD", "--", "drizzle"]).trim();
  assert.equal(committed, "", `Diff \`drizzle/\` là NGOÀI PHẠM VI \`P-07\`:\n${committed}`);
});
