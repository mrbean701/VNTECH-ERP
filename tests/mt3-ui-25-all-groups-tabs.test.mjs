// MT3 — «ĐƯA TẤT CẢ MỤC MENU VÀO NHÓM, CHUYỂN THÀNH TAB» — quyết định (b) của user 27/09/2026.
//
// YÊU CẦU: thanh menu **CHỈ còn NHÓM CHA**; toàn bộ mục con trở thành **TAB** trong màn của nhóm.
// KIẾN TRÚC: tab dựng từ bản đồ `hubChildrenByGroup` trong `app/page.tsx`, lấy từ CÁC MẢNG CON THẬT
//   (`workMenuItems` · `warehouseMenuItems` · `allocateReturnMenuItems` · `supplierPartnerMenuItems`
//   · `kpiSummaryMenuItems` · `reportsSummaryMenuItems`) — chúng **MANG `view`**.
//
// ⚠️ BÀI HỌC ĐÃ MẮC HAI LẦN TRONG PHIÊN NÀY (⛔ đừng lặp):
//   ① Lần 1: sửa `permissionMenuStructure` ⇒ **SAI CHỖ** (hàm đó là BẢNG PHÂN QUYỀN, ⛔ không phải menu)
//      ⇒ suýt phá RBAC. ĐÃ HOÀN TÁC.
//   ② Lần 2: dựng tab từ `modules` ⇒ ⛔ `modules` **KHÔNG có `view`** ⇒ tab **trùng nhãn** + **mở nhầm màn**.
//      ⇒ nay lấy từ mảng con thật.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  modules,
  workMenuItems,
  warehouseMenuItems,
  allocateReturnMenuItems,
  supplierPartnerMenuItems,
  kpiSummaryMenuItems,
  reportsSummaryMenuItems,
  purchasingHubTabs,
  HUB_TAB_GROUP_KEYS,
} from "../lib/menu-helpers.ts";

const PAGE = readFileSync("app/page.tsx", "utf8");

/** Mảng con thật — nguồn DUY NHẤT được phép dựng tab (mang `view`). */
const REAL_SOURCES = {
  my_work: workMenuItems,
  warehouse: [...warehouseMenuItems, ...allocateReturnMenuItems],
  purchasing: supplierPartnerMenuItems,
  overview: kpiSummaryMenuItems,
  reports: reportsSummaryMenuItems,
};

// ── ① Nhóm có tab phải có ≥2 mục con KHÔNG trùng nhãn (đo được) ────────────────────────────
test("mọi nhóm trong HUB_TAB_GROUP_KEYS đều có ≥2 mục con KHÔNG trùng nhãn", () => {
  for (const gk of HUB_TAB_GROUP_KEYS) {
    const mods = REAL_SOURCES[gk] ?? modules.filter((m) => String(m.groupKey) === gk);
    assert.ok(mods.length >= 2, `nhóm «${gk}» chỉ có ${mods.length} mục ⇒ KHÔNG đủ để thành tab`);
    const labels = mods.map((m) => m.label);
    assert.equal(new Set(labels).size, labels.length,
      `nhóm «${gk}» có nhãn TRÙNG ⇒ tab sẽ hiển thị sai cho người dùng`);
  }
});

// ── ② ⛔ KHÔNG nhóm 1-mục nào được bật (không có gì để thành tab) ───────────────────────────
test("⛔ KHÔNG nhóm chỉ 1 mục nào nằm trong HUB_TAB_GROUP_KEYS", () => {
  for (const gk of HUB_TAB_GROUP_KEYS) {
    const n = (REAL_SOURCES[gk] ?? modules.filter((m) => String(m.groupKey) === gk)).length;
    assert.ok(n >= 2, `nhóm «${gk}» chỉ 1 mục ⇒ KHÔNG được bật tab`);
  }
  for (const gk of ["reports", "overview", "site_command", "material_master", "system_admin"]) {
    assert.ok(!HUB_TAB_GROUP_KEYS.includes(gk), `«${gk}» chỉ 1 mục ⇒ ⛔ không được bật tab`);
  }
});

// ── ③ app/page.tsx dựng tab từ NGUỒN CHUNG có `view` (⛔ không từ `modules`) ──────────────────
test("app/page.tsx dựng tab từ `hubChildrenByGroup` (mảng con thật) — ⛔ KHÔNG từ `modules`", () => {
  assert.match(PAGE, /const hubChildrenByGroup/, "phải có bản đồ mục con theo nhóm");
  for (const src of ["workMenuChildren", "warehouseMenuChildren", "allocateReturnMenuChildren",
                     "supplierPartnerMenuChildren", "kpiMenuChildren", "reportsMenuChildren"]) {
    assert.ok(PAGE.includes(src), `phải đưa mảng ${src} vào bản đồ (⛔ bỏ sót ⇒ mất mục con)`);
  }
  // ⛔ Bấm tab PHẢI truyền `view` — nếu không thì mở nhầm màn (lỗi đã mắc lần 2).
  assert.match(PAGE, /activateModule\(item\.moduleKey,item\.view\)/,
    "⛔ bấm tab phải truyền `view`: `activateModule(item.moduleKey, item.view)`");
});

// ── ④ (b) Thanh menu CHỈ còn nhóm cha cho nhóm có tab ──────────────────────────────────────
test("(b) nhóm cha điều hướng thẳng tới mục con đầu tiên; danh sách con bị ẨN", () => {
  assert.match(PAGE, /const hubFirstByGroup/, "phải có map nhóm → mục con đầu tiên");
  assert.match(PAGE, /if \(hub\) \{ activateModule\(hub\.moduleKey, hub\.view\); return; \}/,
    "nhóm cha phải điều hướng thẳng (kèm `view`) thay vì chỉ mở/đóng");
  assert.match(PAGE, /!hubFirstByGroup\[groupKey\] && \(opened \|\| sidebarCollapsed\)/,
    "danh sách mục con phải BỊ ẨN với nhóm có tab (⛔ chỉ ẩn mục con, giữ nhóm cha)");
});

// ── ⑤ ⛔ CHẶN RÒ TRẠNG THÁI QUA NHÓM (lỗi CÓ SẴN, user đã duyệt sửa) ──────────────────────
test("⛔ activateModule chặn RÒ view sang nhóm khác (fix lỗi `dashboard` dùng trùng)", () => {
  assert.match(PAGE, /if\(nextGroup!=="my_work"\)setWorkView\(null\)/, "phải xoá workView khi rời nhóm");
  assert.match(PAGE, /if\(nextGroup!=="warehouse"\)setWarehouseMenuView\(null\)/, "phải xoá warehouseMenuView");
  assert.match(PAGE, /if\(nextGroup!=="purchasing"\)setSupplierPartnerView\(null\)/, "phải xoá supplierPartnerView");
});

// ── ⑥ `purchasing` GIỮ nguyên 10 tab curated (quyết định user đã chốt) ──────────────────────
test("`purchasing` GIỮ danh sách curated 10 tab (⛔ không phá quyết định user)", () => {
  assert.equal(purchasingHubTabs.length, 10, "phải ĐÚNG 10 tab curated");
  assert.match(PAGE, /data-vntech=\{anchor\}/, "thanh tab phải có mỏ neo đo được");
  assert.match(PAGE, /activeGroup==="purchasing"\?"purchasing-hub-tabs"/,
    "nhóm Mua hàng phải giữ khoá mỏ neo cũ (⛔ không phá test hợp đồng)");
});

test("⛔ mọi mảng con THẬT đều có khoá `key` KHÔNG trùng nhau", () => {
  const seen = new Set();
  for (const [group, arr] of Object.entries(REAL_SOURCES)) {
    for (const item of arr) {
      assert.ok(!seen.has(item.key),
        `khoá mục «${item.key}» TRÙNG (gặp ở nhóm «${group}») ⇒ bấm tab sẽ nhảy nhầm màn`);
      seen.add(item.key);
    }
  }
});
