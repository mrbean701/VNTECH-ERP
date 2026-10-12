// [DÙNG 1 LẦN · ERP-SESSION-04 · 08/10/2026] — ÁP LẠI 2 thay đổi vào `ActionRbacRegistry.java`
// sau khi file bị khôi phục về HEAD (xem `BUG-D17` trong BUG_HOTFIX_LOG):
//   ① `approve_work_item` (Q2-b: tách action duyệt + `canApprove`) — bản sửa TAY từ đợt trước.
//   ② `"work"` (phương án A: 1 khoá Work dùng chung mọi phòng ban) — thêm vào 8 action nhóm WORK.
// ⛔ VÌ SAO KHÔNG dùng `java-backend/tools/generate-rbac-registry.mjs`: bộ sinh ⛔ **XOÁ 27 dòng ghi tay**
//    (Java-only + bản vá có tài liệu: `approve_po`, `approve_stock_issue`, `create_issue_grn`,
//    `save_warehouse`, `create_project_team`, `mark_notification_all_read`, …) ⇒ ⛔ TUYỆT ĐỐI không chạy
//    lại bộ sinh cho tới khi nó biết GIỮ các mục ngoài danh mục. Script này sửa ĐÚNG chỗ, có kiểm tra.
import { readFileSync, writeFileSync } from "node:fs";

const PATH = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java";
let text = readFileSync(PATH, "utf8");
const hasBom = text.charCodeAt(0) === 0xfeff;
if (hasBom) text = text.slice(1);
const before = text.length;

/** Thay thế ĐÚNG 1 lần — ⛔ lệch số lần là DỪNG NGAY (chống sửa mù). */
function replaceOnce(find, replace) {
  const n = text.split(find).length - 1;
  if (n !== 1) throw new Error(`⛔ Khớp ${n} lần (mong đợi 1) cho: ${find.slice(0, 70)}…`);
  text = text.replace(find, replace);
  return true;
}

// ── ② thêm `"work"` vào 7 action còn lại (action thứ 8 là `approve_work_item` — chèn mới ở dưới) ──────
const WORK_ACTIONS = [
  ["add_work_item_comment", ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"]],
  ["create_work_item", ["dept_plan_assign", "dept_project_assign"]],
  ["mark_task_notification_read", ["dept_plan_tasks", "dept_project_tasks"]],
  ["reassign_work_item", ["dept_plan_assign", "dept_project_assign"]],
  ["set_work_item_participant", ["dept_plan_assign", "dept_project_assign"]],
  ["update_work_item_progress", ["dept_plan_tasks", "dept_project_tasks"]],
  ["update_work_item_status", ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"]],
];
for (const [action, mods] of WORK_ACTIONS) {
  const find = `Map.entry("${action}", List.of(${mods.map((m) => `"${m}"`).join(", ")}))`;
  replaceOnce(find, `Map.entry("${action}", List.of(${mods.map((m) => `"${m}"`).join(", ")}, "work"))`);
  console.log(`  ✅ modules: ${action} += "work"`);
}

// ── ①+② chèn `approve_work_item` (modules) — thứ tự abc: sau `approve_transfer_order`, trước `bulk_boq_item_action`
replaceOnce(
  `            Map.entry("bulk_boq_item_action", List.of("boq")),`,
  `            // ⭐ USER 08/10/2026 (Q2-b) — TÁCH ACTION DUYỆT VIỆC khỏi \`update_work_item_status\` để ma trận
            // phân quyền phân biệt «người SỬA việc» (canEdit) với «người DUYỆT việc» (canApprove).
            // ⭐ + PHƯƠNG ÁN A (cùng ngày): nhận thêm khoá CHUNG \`work\` ⇒ mọi phòng ban (11 đơn vị) cấp được.
            Map.entry("approve_work_item", List.of("dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign", "work")),
            Map.entry("bulk_boq_item_action", List.of("boq")),`,
);
console.log("  ✅ modules: approve_work_item (mới) + canApprove");

// ── ① capability `canApprove` (abc: trước `bulk_boq_item_action`)
replaceOnce(
  `            Map.entry("bulk_boq_item_action", "canEdit"),`,
  `            Map.entry("approve_work_item", "canApprove"),
            Map.entry("bulk_boq_item_action", "canEdit"),`,
);

writeFileSync(PATH, text, "utf8");
console.log(`\n✅ ĐÃ GHI ${PATH}`);
console.log(`   · BOM trước: ${hasBom ? "CÓ" : "không"} · độ dài ${before} → ${text.length} ký tự`);
console.log(`   · số dòng: ${text.split("\n").length}`);
