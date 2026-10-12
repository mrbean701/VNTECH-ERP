// HỢP ĐỒNG — ⛔ «KHỐI TRONG THÂN MODAL KHÔNG ĐƯỢC BỊ GRID CO RỒI CẮT NỘI DUNG» (ERP-SESSION-03, 07/10/2026)
//
// ⛔ LỖI USER BÁO (`BUG-20261007-C07`, MASTER TASK 3 §V-E):
//   «Modal chi tiết giao hàng … mục **Ảnh và hồ sơ giao hàng** đang bị **ẩn** đi không hiển thị đầy đủ».
//
// ⭐ TÁI HIỆN + ĐO ĐƯỢC (Chrome headless 1440×900, mở ĐÚNG modal «Chi tiết đơn giao hàng»):
//   TRƯỚC VÁ: thân `display:grid` · `grid-auto-rows:auto` · `height=567,594px` · `scrollHeight == clientHeight == 568`
//     `gridTemplateRows` GIẢI RA: 47.19 · 49.20 · 49.20 · 49.20 · 91.19 · 49.20 · 49.20 · 49.20 px  ← 8 hàng bị ÉP vừa khung
//     `.drawer-section` cao **49,2031px** nhưng `scrollHeight` là **231…294px** ⇒ 7/8 khối bị CẮT; riêng khối
//     «Ảnh và hồ sơ giao hàng» cao 49px trong khi con của nó là `.card-head` 71px + `.attachment-panel` **190px**
//     (đặt ở `top=395`, dưới đáy khối `357`) ⇒ **panel ảnh/hồ sơ KHÔNG hiển thị** — đúng nguyên văn user báo.
//
// ⭐ ROOT CAUSE: `.drawer-section { overflow:hidden }` ⇒ theo chuẩn CSS **kích thước tối thiểu tự động = 0**
//   ⇒ trong grid có **CHIỀU CAO XÁC ĐỊNH**, hàng `auto` **bị co xuống vừa khung** ⇒ cắt nội dung;
//   ⛔ và vì grid **không tràn** nên `.drawer-body { overflow:auto }` **⛔ KHÔNG sinh thanh cuộn** ⇒ nội dung KHÔNG THỂ TỚI.
//
// ✅ BẢN VÁ: `gridAutoRows: "max-content"` (inline, **cục bộ** `ReceiptDrawer.tsx`) ⇒ hàng lấy đúng chiều cao NỘI DUNG
//   ⇒ thân tràn ⇒ `.modal-body { overflow-y:auto }` sinh thanh cuộn thật.
//   ⭐ ĐO LẠI SAU VÁ: `conCat = []` (⛔ 0 khối bị cắt) · «Ảnh và hồ sơ giao hàng» **49 → 279px** (nội dung 277)
//   · «Chứng chỉ / Tài liệu đã tải lên» **49 → 279** · «Ảnh giao hàng» **49 → 279**.
//
// Chạy riêng:  node --test tests/mt3-c08-modal-grid-clip.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

test("C08-1 · thân modal của `ReceiptDrawer` phải chặn GRID CO HÀNG (`grid-auto-rows: max-content`)", () => {
  const src = read("app/screens/ReceiptDrawer.tsx");
  assert.match(src, /className="drawer-body modal-body"/,
    "tiền đề: thân modal dùng cặp lớp `drawer-body modal-body` (`.drawer-body` đặt `display:grid`)");
  assert.match(src, /style=\{\{\s*gridAutoRows:\s*"max-content"\s*\}\}/,
    "⛔ THIẾU `gridAutoRows: \"max-content\"` ⇒ grid có chiều cao xác định sẽ CO các hàng `auto` xuống vừa khung " +
    "(vì `.drawer-section` có `overflow:hidden` ⇒ kích thước tối thiểu tự động = 0) ⇒ CẮT nội dung khối Ảnh/Chứng chỉ và KHÔNG sinh thanh cuộn");
  // ⛔ KHÔNG được "vá" bằng cách xoá nội dung: 2 khối user báo phải còn.
  assert.match(src, /Ảnh và hồ sơ giao hàng/, "⛔ KHÔNG được xoá khối «Ảnh và hồ sơ giao hàng»");
  assert.match(src, /<AttachmentPanel entityType="goods_receipt" entityId=\{receipt\.id\} \/>/, "⛔ khối hồ sơ phải vẫn render `AttachmentPanel`");
});

test("C08-2 · ⛔ KHÔNG tệp nào dùng thân `.drawer-body` (grid) làm CON TRỰC TIẾP của khung `.modal` mà thiếu chặn co hàng", () => {
  // ⭐ VÒNG 14 — CỔNG NÀY ĐÃ ĐƯỢC LÀM CHÍNH XÁC HƠN (⛔ tránh BÁO ĐỘNG GIẢ đúng lớp lỗi đã gặp 3 lần trong phiên):
  //   Bản đầu kiểm theo **TỆP** (`có 'modal' && có 'drawer-body'`) ⇒ quá thô: `PurchaseOrderDrawer.tsx` có cả hai
  //   NHƯNG ⛔ KHÔNG nguy hiểm — ĐO ĐƯỢC (1440×900, mở «Xem chi tiết đơn mua nguồn»): `.drawer-body` ở đó nằm
  //   **TRONG TAB** của `EntityDetailModal`, tức bên trong `.edm-body` (`display:block`, cao theo nội dung)
  //   ⇒ `.drawer-body` có **chiều cao AUTO** ⇒ ⛔ không bị co hàng: đo được khối **1902px**, `scrollHeight == clientHeight`,
  //   và `conCat = []` (⛔ 0 khối bị cắt).
  //   ⇒ HÌNH DẠNG NGUY HIỂM là: `.drawer-body` là **CON TRỰC TIẾP** của khung `.modal`/`.drawer` (khung có CHIỀU CAO XÁC ĐỊNH
  //     ⇒ grid co hàng ⇒ cắt nội dung). Cổng dưới đây chỉ bắt ĐÚNG hình dạng đó.
  const files = [];
  const walk = (dirUrl, prefix) => {
    for (const e of readdirSync(dirUrl, { withFileTypes: true })) {
      const next = prefix + e.name;
      if (e.isDirectory()) { walk(new URL(e.name + "/", dirUrl), next + "/"); continue; }
      if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name)) files.push(next);
    }
  };
  for (const root of ["app", "lib"]) walk(new URL(`../${root}/`, import.meta.url), root + "/");
  // ⭐ CHỐT VÙNG PHỦ (⭐ chống «ĐẠT RỖNG» — LUẬT 21): ⛔ nếu bộ quét không đọc được tệp nào thì «0 vi phạm» VÔ NGHĨA.
  assert.ok(files.length >= 40, `⛔ CHỐT VÙNG PHỦ: chỉ quét được ${files.length} tệp (kỳ vọng ≥ 40) ⇒ bộ quét HỎNG`);
  const offenders = [];
  for (const f of files) {
    const code = read(f).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    const guarded = /gridAutoRows:\s*"max-content"/.test(code);
    if (guarded) continue;
    // mẫu nguy hiểm: khung `.modal`/`.drawer` rồi tới thân `.drawer-body` NGAY TRONG CÙNG KHỐI JSX (⛔ không qua `EntityDetailModal`)
    const risky = /className="(?:[^"]*\bmodal\b[^"]*|drawer)"[\s\S]{0,3000}?<div className="drawer-body/.test(code);
    if (risky) offenders.push(f);
  }
  assert.deepEqual(offenders, [],
    "⛔ Tệp có thân `.drawer-body` (grid) là CON TRỰC TIẾP của khung `.modal`/`.drawer` mà KHÔNG đặt " +
    "`gridAutoRows: \"max-content\"` ⇒ các khối bên trong sẽ bị co và CẮT nội dung như `BUG-20261007-C07`:\n" + offenders.join("\n"));
});

test("C08-2b · ✅ HÌNH DẠNG AN TOÀN phải được giữ: `.drawer-body` lồng TRONG `.edm-body` (block) ⇒ cao theo nội dung", () => {
  // ⭐ Ghi lại bằng chứng đo được để phiên sau ⛔ không "sửa" thứ đang đúng (bài học đã trả giá 3 lần trong phiên 03):
  //   `PurchaseOrderDrawer.tsx` — `.drawer-body` nằm trong tab của `EntityDetailModal` ⇒ cha là `.edm-body { display:block }`
  //   ⇒ `.drawer-body` cao AUTO (đo: 1902px · `scrollHeight == clientHeight` · ⛔ 0 khối bị cắt).
  const po = read("app/screens/PurchaseOrderDrawer.tsx");
  assert.match(po, /EntityDetailModal/, "tiền đề: `PurchaseOrderDrawer` render qua `EntityDetailModal` (khung `.edm-body` là block)");
  assert.match(po, /<div className="drawer-body">/, "tiền đề: thân khối chi tiết PO dùng `.drawer-body` (được phép vì cha là block auto height)");
  const edm = read("app/components/ui/EntityDetailModal.tsx");
  assert.match(edm, /edm-body/, "tiền đề: `EntityDetailModal` dùng `.edm-body`");
  // ⚠️ BÀI HỌC KHI VIẾT CA NÀY: `indexOf(".edm-body")` bắt trúng một **CHÚ THÍCH** có chữ `.edm-body`
  //    («/* phần cuộn nằm ở .edm-body */») ⇒ phải **BỎ CHÚ THÍCH TRƯỚC** rồi mới trích quy tắc (⛔ không trích bằng indexOf thô).
  const css = read("app/styles/canonical.css").replace(/\/\*[\s\S]*?\*\//g, "");
  const at = css.indexOf(".edm-body {");
  assert.ok(at >= 0, "`.edm-body {` phải có quy tắc trong `app/styles/canonical.css` (sau khi bỏ chú thích)");
  const body = css.slice(css.indexOf("{", at) + 1, css.indexOf("}", at));
  assert.match(body, /overflow-y:\s*auto/, "⛔ `.edm-body` phải là vùng CUỘN ⇒ nếu mất, mọi tab dài sẽ bị cắt");
  assert.doesNotMatch(body, /display:\s*grid/, "⚠️ nếu `.edm-body` chuyển sang `grid` thì hình dạng AN TOÀN này thành NGUY HIỂM ⇒ đọc lại `BUG-20261007-C07`");
});

test("C08-3 · `.drawer-section` vẫn `overflow:hidden` (⭐ lý do khiến phải chặn co hàng — ⛔ đừng bỏ ghi chú này)", () => {
  const css = read("app/globals.css");
  const at = css.indexOf(".drawer-section {");
  assert.ok(at >= 0, "không tìm thấy quy tắc `.drawer-section {`");
  const body = css.slice(css.indexOf("{", at) + 1, css.indexOf("}", at));
  assert.match(body, /overflow:\s*hidden/,
    "⚠️ nếu `.drawer-section` KHÔNG còn `overflow:hidden` thì căn nguyên đã đổi ⇒ đọc lại `BUG-20261007-C07` trước khi sửa test này");
});

test("C08-9 · ĐỐI CHỨNG ÂM: bộ dò của `C08-2` PHẢI bắt được HÌNH DẠNG NGUY HIỂM thật (⛔ nếu không ⇒ cổng VÔ DỤNG)", () => {
  // ⭐ Dùng ĐÚNG 2 biểu thức của `C08-2`:
  const guarded = (code) => /gridAutoRows:\s*"max-content"/.test(code);
  const risky = (code) => /className="(?:[^"]*\bmodal\b[^"]*|drawer)"[\s\S]{0,3000}?<div className="drawer-body/.test(code);
  const danger = `<div className="modal"><div className="drawer-body"><div className="drawer-section">x</div></div></div>`;
  assert.equal(risky(danger), true, "⛔ bộ dò HỎNG: không bắt được «.drawer-body là CON TRỰC TIẾP của khung .modal»");
  assert.equal(guarded(danger), false, "⛔ bộ dò HỎNG: mẫu nguy hiểm lại bị coi là ĐÃ chặn");
  // ⛔ Và ⛔ KHÔNG báo oan khi ĐÃ có chặn co hàng (`gridAutoRows: "max-content"`):
  const safe = `<div className="modal"><div className="drawer-body" style={{ gridAutoRows: "max-content" }}>x</div></div>`;
  assert.equal(guarded(safe), true, "⛔ báo OAN: mẫu đã chặn co hàng lại bị coi là nguy hiểm");
});