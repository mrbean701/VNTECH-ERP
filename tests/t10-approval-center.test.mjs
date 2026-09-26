// PHASE 3 (`T-10`) — HỢP ĐỒNG «TÁCH APPROVAL CENTER THÀNH MODULE ĐỘC LẬP» (§12).
// Nguyên văn `docs/25_TODO_ROADMAP.md` dòng `T-10`: «Tách Approval Center thành module độc lập (§12)».
//
// ⚠️ RÀNG BUỘC ĐÃ CHỐT (từ `T-01`): khoá MODULE mới cần `module_catalog` + `MODULE_KEYS` + migration ⇒ NGOÀI PHẠM VI.
// Vì vậy `T-10` chỉ được làm bằng **UI**, dùng **KHOÁ ĐÃ CÓ `approvals`**:
//   • `approvals` là khoá THẬT đã có: `module_catalog` (`drizzle/0076_phase_menu_11_groups_identity.sql`:35-36,76 —
//     nhóm `my_work`, `sort_order` 50) + nằm trong `ModuleKey` (`lib/ui-shared.tsx`) + đã có màn `Approvals`
//     (`app/page.tsx`: `active === "approvals" && <Approvals …>`).
//   • Việc còn lại — nó đang BỊ XẾP TRONG NHÓM «CÔNG VIỆC» — là chuyện HIỂN THỊ MENU ⇒ sửa bằng `groupKey`:
//     đưa `approvals` ra khỏi `children` của mọi nhóm và dựng NHÓM RIÊNG `approval_center` (chỉ là KHOÁ NHÓM MENU,
//     KHÔNG phải khoá module, KHÔNG có dòng `module_catalog`, KHÔNG migration).
//
// Đối chứng bắt buộc (chứng minh KHÔNG thêm khoá module mới): quét toàn bộ `drizzle/*.sql` + `java-backend/**/migration`
// phải ra **0** lần `approval_center`; `ModuleKey` không có `approval_center`; `modules` (menu-helpers) không có nó.
//
// LƯU Ý: tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/t10-approval-center.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const menuHelpers = read("lib/menu-helpers.ts");
const uiShared = read("lib/ui-shared.tsx");
const page = read("app/page.tsx");

// ── BẰNG CHỨNG «KHÔNG MIGRATION»: quét MỌI tệp SQL của cả hai chuỗi migration ─────────────────────
const sqlFiles = [
  ...readdirSync(new URL("../drizzle", import.meta.url)).filter((name) => name.endsWith(".sql")).map((name) => `drizzle/${name}`),
  ...readdirSync(new URL("../java-backend/infrastructure/src/main/resources/db/migration", import.meta.url)).filter((name) => name.endsWith(".sql")).map((name) => `java-backend/infrastructure/src/main/resources/db/migration/${name}`),
];
const sqlHits = sqlFiles.filter((file) => read(file).includes("approval_center"));

// `ModuleKey` = union các khoá module THẬT (nguồn: `lib/ui-shared.tsx`).
const MODULE_KEY_BLOCK = uiShared.slice(uiShared.indexOf("type ModuleKey ="), uiShared.indexOf(";", uiShared.indexOf("type ModuleKey =")));

test("T-10 — Approval Center TÁCH khỏi nhóm «CÔNG VIỆC» bằng UI (khoá đã có `approvals`, KHÔNG khoá module mới)", () => {
  // 1) Khoá dùng để tách = `approvals` (ĐÃ CÓ) — khai báo tường minh trong `lib/menu-helpers.ts`.
  assert.match(menuHelpers, /const approvalCenterMenuKey: ModuleKey = "approvals";/, "Thiếu khai báo khoá `approvals` cho Trung tâm phê duyệt");
  assert.match(menuHelpers, /const approvalCenterGroup = \{ groupKey: "approval_center", name: "PHÊ DUYỆT", icon: "PD", sortOrder: 20 \} as const;/, "Thiếu khai báo NHÓM MENU độc lập `approval_center`");
  assert.match(menuHelpers, /const independentMenuKeys: ModuleKey\[\] = \["dashboard", "approvals"\];/, "Thiếu danh sách mục menu ĐỘC LẬP ở cấp cao nhất");
  // 2) `approvals` KHÔNG còn nằm trong `children` của BẤT KỲ nhóm nào (kể cả `my_work` — nhóm DB đang gán cho nó).
  assert.match(page, /!independentMenuKeys\.includes\(item\.key\)/, "Cây menu chưa loại các mục ĐỘC LẬP khỏi `children` của nhóm");
  assert.doesNotMatch(page, /children: allowedModules\.filter\(\(item\) => item\.key!=="dashboard" &&/, "Còn lọc cứng `dashboard` — phải dùng chung danh sách mục độc lập");
  // 3) Nhóm «CÔNG VIỆC» vẫn SỐNG dù `children` đã rỗng (5 mục của nó do `workMenuChildren` vẽ) — nếu không, T-01 mất 5 mục.
  assert.match(page, /String\(group\.groupKey\) === "my_work" && workMenuChildren\.length > 0/, "Nhóm «CÔNG VIỆC» sẽ biến mất khi `approvals` rời khỏi `children`");
  // 4) Dựng NHÓM RIÊNG cho Trung tâm phê duyệt và SẮP lại theo `sortOrder` (đứng ngay sau «CÔNG VIỆC», trước «QUẢN LÝ DỰ ÁN»).
  assert.match(page, /const approvalCenterItem = allowedModules\.find\(\(item\) => item\.key === approvalCenterMenuKey\)/, "Chưa lấy mục menu của Trung tâm phê duyệt từ `allowedModules` (đã lọc quyền)");
  assert.match(page, /groupTree\.push\(\{ groupKey: approvalCenterGroup\.groupKey, name: approvalCenterGroup\.name, icon: approvalCenterGroup\.icon, sortOrder: approvalCenterGroup\.sortOrder, active: true, collapsible: false, children: \[approvalCenterItem\] \}\);/, "Chưa dựng nhóm độc lập cho Trung tâm phê duyệt");
  assert.match(page, /groupTree\.sort\(\(a, b\) => Number\(a\.sortOrder \|\| 0\) - Number\(b\.sortOrder \|\| 0\)\);/, "Chưa sắp lại cây menu theo `sortOrder`");
  // 5) Cổng quyền: mục này chỉ có khi `modulePermission(data, "approvals").canView` — đi qua `allowedModules` (đã lọc quyền),
  //    KHÔNG hardcode admin.
  assert.doesNotMatch(page.slice(page.indexOf("const approvalCenterItem"), page.indexOf("const approvalCenterItem") + 200), /isAdminUser/);
});

test("T-10 — MÀN của module vẫn ĐỘC LẬP và KHÔNG đụng: `active === \"approvals\"` render `Approvals`", () => {
  assert.match(page, /active === "approvals" && <Approvals data=\{data\}/, "Nhánh render màn `Approvals` đã đổi — ngoài phạm vi T-10 (chỉ tách MENU)");
  assert.match(page, /key === "approvals" \? pendingForRole\(data\.requests, data\.user, data\.approvalStages\)/, "Huy hiệu «chờ duyệt» của `approvals` bị mất");
  // `approvals` KHÔNG nằm trong danh sách 4 khoá `dept_*` bị ẩn (giữ nguyên kết luận T-01).
  const legacy = menuHelpers.slice(menuHelpers.indexOf("const legacyWorkMenuKeys"), menuHelpers.indexOf(";", menuHelpers.indexOf("const legacyWorkMenuKeys")));
  assert.ok(!legacy.includes('"approvals"'), "`approvals` bị cho vào danh sách ẩn — sai");
});

test("T-10 — BẰNG CHỨNG «KHÔNG MIGRATION / KHÔNG KHOÁ MODULE MỚI» (đối chứng của điều kiện BLOCKED)", () => {
  // (a) `MODULE_KEYS`: có `approvals`, KHÔNG có `approval_center`.
  assert.ok(MODULE_KEY_BLOCK.includes('"approvals"'), "`ModuleKey` không có `approvals` ⇒ không thể dùng khoá đã có");
  assert.ok(!MODULE_KEY_BLOCK.includes("approval_center"), "`ModuleKey` bị thêm khoá `approval_center` ⇒ đã vượt ràng buộc (cần migration)");
  // (b) `modules` (danh mục module của menu-helpers) KHÔNG có mục `approval_center` ⇒ không sinh dòng quyền giả.
  assert.ok(!/key: "approval_center"/.test(menuHelpers), "`approval_center` bị khai báo như MỘT MODULE ⇒ sai");
  // (c) KHÔNG tệp SQL nào (drizzle + Flyway) nhắc `approval_center` ⇒ 0 dòng `module_catalog` mới, 0 migration mới.
  assert.deepEqual(sqlHits, [], `Có tệp SQL nhắc khoá nhóm mới ⇒ phát sinh migration: ${sqlHits.join(", ")}`);
  // (d) `approval_center` là KHOÁ NHÓM MENU: `menu_group_catalog` cũng KHÔNG bị thêm dòng nào cho nó.
  const groupSql = sqlFiles.filter((file) => /INSERT[^;]*menu_group_catalog[^;]*approval_center/i.test(read(file)));
  assert.deepEqual(groupSql, [], "Nhóm menu mới bị seed vào `menu_group_catalog` ⇒ cần migration, ngoài phạm vi T-10");
});

test("T-10 — KHÔNG phá 5 mục «CÔNG VIỆC» đã chốt ở T-01", () => {
  assert.match(menuHelpers, /const workMenuItems: \{ key: string; label: string; groupKey: "my_work"; view: WorkMenuView; permissionKeys: ModuleKey\[\] \}\[\] = \[/);
  assert.equal((menuHelpers.match(/groupKey: "my_work", view: /g) || []).length, 5, "5 mục «CÔNG VIỆC» phải giữ nguyên");
  // Vẫn vẽ 5 mục đó ở CẢ sidebar lẫn menu mobile.
  assert.equal((page.match(/groupKey==="my_work"&&workMenuChildren\.map\(/g) || []).length, 2, "Mất dải 5 mục ở sidebar hoặc menu mobile");
  // `workMenuBadge(item.badgeKeys)` vẫn đúng 4 lần (2 badge nhóm + 2 badge mục con) — không nhân đôi/nuốt badge.
  assert.equal((page.match(/workMenuBadge\(item\.badgeKeys\)/g) || []).length, 4, "Huy hiệu 5 mục «CÔNG VIỆC» bị đổi số lần vẽ");
});
