// MT3 — **CHẨN ĐOÁN LỖI CÓ SẴN**: `view` bị DÙNG TRÙNG giữa các nhóm menu.
//
// PHÁT HIỆN 27/09/2026 khi làm thanh tab. KHÔNG phải lỗi do thanh tab gây ra — ⛔ có sẵn trong MENU.
//
// `app/page.tsx:517 activateModule(next, view)` set **NHIỀU biến view cùng lúc**:
//     setWorkView(... || view==="dashboard" ? view : null);        // nhóm my_work
//     setWarehouseMenuView(view==="dashboard" ? view : null);     // nhóm warehouse — CÙNG "dashboard"
// Nên `view="dashboard"` **dùng chung cho 2 nhóm** ⇒ bấm Dashboard của một nhóm **bật luôn màn của
// nhóm kia**, và trạng thái đó **TỒN ĐỌNG** khi chuyển nhóm (vì `activateModule` chỉ set `null`
// cho các view KHÁC, không set `null` cho view của nhóm vừa rời).
//
// ⚠️ VÌ SAO ĐÂY LÀ BÀI **ĐẶC TẢ HÀNH VI HIỆN TẠI** (characterization test) chứ không phải
//    bài chặn lỗi: sửa `activateModule` = **đụng điều hướng lõi** ⇒ cần USER quyết định.
//    ⇒ Bài này **GHI NHẬN** trạng thái đã biết + **CẢNH BÁO** nếu ai đó vô tình làm nó tệ hơn.
import test from "node:test";
import assert from "node:assert/strict";

import {
  workMenuItems,
  warehouseMenuItems,
  allocateReturnMenuItems,
  supplierPartnerMenuItems,
  reportsSummaryMenuItems,
} from "../lib/menu-helpers.ts";

// Nhóm sở hữu mỗi mảng — theo `app/page.tsx` (nơi mảng được dùng để dựng `*MenuChildren`).
const GROUPS = [
  { group: "my_work", items: workMenuItems },
  { group: "warehouse", items: warehouseMenuItems },
  { group: "allocate_return", items: allocateReturnMenuItems },
  { group: "purchasing", items: supplierPartnerMenuItems },
  { group: "reports", items: reportsSummaryMenuItems },
];

/** view nào đang bị dùng cho ≥2 nhóm khác nhau ⇒ nguy hiểm khi `activateModule` set nhiều biến. */
function collisions() {
  const byView = new Map();
  for (const { group, items } of GROUPS) {
    for (const item of items) {
      if (item.view == null) continue;
      if (!byView.has(item.view)) byView.set(item.view, new Set());
      byView.get(item.view).add(group);
    }
  }
  const out = [];
  for (const [view, groups] of byView) if (groups.size > 1) out.push({ view, groups: [...groups] });
  return out;
}

test("CHẨN ĐOÁN: `view=\"dashboard\"` bị dùng cho CẢ `my_work` VÀ `warehouse` (lỗi có sẵn)", () => {
  const hit = collisions();
  assert.ok(hit.length > 0,
    "⚠️ KHÔNG còn va chạm `view` nào. Nếu đã sửa `activateModule` ⇒ **XOÁ bài này** và bỏ ghi chú "
    + "`HUB_TAB_GROUP_KEYS` trong `lib/menu-helpers.ts` để bật lại tab cho `my_work`/`warehouse`.");

  const dashboard = hit.find((c) => c.view === "dashboard");
  assert.ok(dashboard, "kỳ vọng: `dashboard` vẫn là view bị dùng trùng");
  assert.deepEqual(dashboard.groups.sort(), ["my_work", "warehouse"],
    "kỳ vọng: `dashboard` dùng cho đúng 2 nhóm my_work + warehouse");

  console.log(`   [đã biết] view bị dùng trùng: ${hit.map((c) => c.view + "→" + c.groups.join("+")).join(", ")}`);
});

test("CHẨN ĐOÁN: mọi mảng menu đều có nhãn KHÔNG trùng (điều kiện để dựng tab an toàn)", () => {
  for (const { group, items } of GROUPS) {
    const labels = items.map((i) => i.label);
    assert.equal(new Set(labels).size, labels.length,
      `nhóm «${group}» có nhãn TRÙNG ⇒ dựng tab từ mảng này sẽ hiển thị sai cho người dùng`);
  }
});

test("CHẨN ĐOÁN: mọi mảng menu đều có `key` KHÔNG trùng (điều kiện để dựng tab an toàn)", () => {
  const seen = new Set();
  for (const { group, items } of GROUPS) {
    for (const item of items) {
      assert.ok(!seen.has(item.key),
        `khoá mục «${item.key}» bị TRÙNG giữa các nhóm (gặp ở «${group}») ⇒ dựng tab sẽ nhảy nhầm`);
      seen.add(item.key);
    }
  }
});
