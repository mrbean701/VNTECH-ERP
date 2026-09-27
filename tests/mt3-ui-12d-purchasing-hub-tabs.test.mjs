// MT3-UI-12d — HỢP ĐỒNG: NHÓM «MUA HÀNG & CUNG ỨNG» có ĐÚNG 10 TAB cấp nhóm (MT3 §IV.1 + §E).
//
// §IV.1: «Chuyển các menu item cấp con vào màn hình của menu cha và hiển thị DƯỚI DẠNG TAB.»
// §E:    10 tab · «Loại bỏ menu trùng nhưng phải xác định rõ nội dung được chuyển vào tab nào».
// 📌 QUYẾT ĐỊNH USER 26/09/2026 (docs/dsh/MT3_USER_DECISIONS.md): （2） gộp 1 «Nhà cung cấp» ·
//    （3） «Xin giá vật tư» = tab riêng, ⛔ KHÔNG xây nghiệp vụ mới ·（4） đổi tên «Giao nhận công trường».
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { purchasingHubTabs, modules } from "../lib/menu-helpers.ts";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const page = read("app/page.tsx");
const helpers = read("lib/menu-helpers.ts");

test("MT3-UI-12d — nhóm «Mua hàng & Cung ứng» có ĐÚNG 10 tab (§E)", () => {
  assert.equal(purchasingHubTabs.length, 10, `§E yêu cầu 10 tab, đang có ${purchasingHubTabs.length}`);
});

test("MT3-UI-12d — ⛔ KHÔNG bịa khoá module mới: mọi tab trỏ MÀN ĐÃ CÓ", () => {
  const known = new Set(modules.map((m) => String(m.key)));
  for (const tab of purchasingHubTabs) {
    assert.ok(known.has(String(tab.key)), `tab «${tab.label}» trỏ khoá KHÔNG có trong danh mục module: ${tab.key}`);
  }
});

test("MT3-UI-12d — nhãn tab PHẢI có dấu tiếng Việt và đúng 4 quyết định của user", () => {
  const labels = purchasingHubTabs.map((t) => t.label);
  // （4） đổi tên theo quyết định user
  assert.ok(labels.includes("Giao nhận công trường"), "⛔ thiếu tab «Giao nhận công trường» (quyết định user #4)");
  assert.equal(labels.includes("Kế hoạch giao hàng"), false, "⛔ nhãn CŨ «Kế hoạch giao hàng» phải được đổi tên");
  // （2） gộp 1 nhà cung cấp
  assert.ok(labels.includes("Nhà cung cấp"), "⛔ thiếu tab «Nhà cung cấp»");
  assert.equal(labels.includes("Danh mục Nhà cung cấp"), false, "⛔ mục mã CŨ «Danh mục Nhà cung cấp» phải hết (đã ẩn khỏi menu)");
  // （3） xin giá vật tư = tab riêng
  assert.ok(labels.includes("Xin giá vật tư"), "⛔ «Xin giá vật tư» phải là TAB RIÊNG (quyết định user #3)");
  // ⛔ khử dấu là SAI (phải là tiếng Việt có dấu)
  for (const bad of ["Giao nhan cong truong", "Nha cung cap", "Xin gia vat tu"]) {
    assert.equal(labels.includes(bad), false, `⛔ nhãn mất dấu: «${bad}»`);
  }
});

test("MT3-UI-12d — ⛔ KHÔNG có tab «Báo cáo»: §E liệt kê nhưng user CHƯA chốt màn nào", () => {
  const labels = purchasingHubTabs.map((t) => t.label);
  assert.equal(labels.includes("Báo cáo"), false,
    "⛔ KHÔNG tự thêm tab «Báo cáo» khi chưa xác định được màn báo cáo nào của nhóm này");
  assert.match(helpers, /KHÔNG tự chọn, chưa đưa vào/, "phải ghi rõ lý do chưa đưa tab «Báo cáo» vào");
});

test("MT3-UI-12d — page.tsx VẼ thanh tab cấp nhóm (role=tablist) và điều hướng qua activateModule", () => {
  // ⚠️ CẬP NHẬT 27/09/2026 (lần 2) — QUYẾT ĐỊNH (b) CỦA USER ĐỔI HỢP ĐỒNG (đúng lý do duy nhất được phép sửa test):
  //   Nguyên văn user (27/09): «1. b» ⇒ chọn **(b) thanh menu CHỈ còn NHÓM CHA**, mọi mục con thành TAB.
  //   ⇒ Cơ chế DÙNG CHUNG nay là bản đồ **`hubChildrenByGroup`** (`app/page.tsx`) dựng từ CÁC MẢNG CON THẬT
  //     (`workMenuItems` · `warehouseMenuItems` · …) vì chúng **MANG `view`**; `modules` thì KHÔNG ⇒
  //     dùng `modules` sẽ khiến tab **trùng nhãn** + **mở nhầm màn** (đã mắc lỗi này 1 lần, đã sửa).
  //   ⇒ `hubTabsFor(active)` đã bị thay ⇒ assertion dưới đổi theo.
  //   ⛔ Vẫn GIỮ NGUYÊN mọi ràng buộc cũ: tablist + aria-selected + điều hướng qua `activateModule`
  //      + nhóm Mua hàng giữ nguyên khoá mỏ neo `purchasing-hub-tabs` (⛔ không phá hợp đồng cũ).
  assert.match(page, /const hubChildrenByGroup/, "phải dùng CƠ CHẾ DÙNG CHUNG cho mọi nhóm (§14)");
  assert.match(page, /purchasing-hub-tabs/, "nhóm Mua hàng vẫn giữ khoá mỏ neo cũ");
  assert.match(page, /role="tablist"/, "thanh tab phải có role=tablist (trợ năng)");
  assert.match(page, /aria-selected=\{active===item\.key\}/, "mỗi tab phải báo trạng thái chọn");
  assert.match(page, /onClick=\{\(\)=>activateModule\(item\.key\)\}/,
    "⛔ phải điều hướng qua activateModule (RBAC của màn là cổng chặn), ⛔ KHÔNG hard-code mở màn");
});

test("MT3-UI-12d — TÁI DÙNG lớp thanh tab có sẵn, ⛔ KHÔNG thêm CSS mới (MT3 §14)", () => {
  // ⚠️ CẬP NHẬT 27/09/2026 — `data-vntech` nay là BIẾN `{anchor}` (mọi nhóm có mỏ neo riêng)
  //   thay vì hằng chuỗi; ⛔ ràng buộc «DÙNG LẠI `.switch-tabs`» GIỮ NGUYÊN.
  assert.match(page, /<nav className="switch-tabs" data-vntech=\{anchor\}/,
    "phải DÙNG LẠI lớp `.switch-tabs` đã có trong CSS ⇒ ⛔ không phát sinh nợ CSS mới");
  const css = read("app/styles/canonical.css") + read("app/globals.css");
  assert.match(css, /\.switch-tabs/, "lớp `.switch-tabs` phải tồn tại trong CSS để không phải thêm luật mới");
});
