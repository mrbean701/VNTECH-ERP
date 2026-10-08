// HỢP ĐỒNG §22 — «TAB TRONG MODAL PHẢI CÓ KÍCH THƯỚC NHẤT QUÁN» — ERP-SESSION-03 (2026-10-07)
//
// ⛔ VÌ SAO CÓ TỆP NÀY (⭐ đọc trước khi sửa CSS — tránh lặp lại SAI LẦM ĐÃ GHI 4 LẦN):
//   Repo đã có **4 vòng** suýt/nhầm «sửa» dải tab đang ĐÚNG (TASK-156 · TASK-212 · TASK-213 · TASK-214);
//   `docs/dsh-state/CHECKLIST.md` ghi rõ: «…lần thứ **7** tôi suýt "sửa" thứ đang đúng» và
//   **2 BÁO ĐỘNG GIẢ** vì **áp MỘT thước đo lên NHIỀU họ component**.
//
// ⭐ HAI CHIẾN LƯỢC KHÁC NHAU, **CẢ HAI ĐỀU CỐ Ý** (⛔ đừng "thống nhất" chúng):
//   • `.edm-tabs` (dải tab trong `EntityDetailModal`) ⇒ **`flex: 1 1 auto`** — **MỐC 115** (user 01/10:
//     «tab cân đối và bằng nhau … vẫn phải hiển thị đầy đủ thông tin»); basis `auto` giữ độ rộng tự nhiên
//     nên **còn wrap được** khi màn hẹp. `canonical.css` ghi nguyên văn **«⛔ KHÔNG đụng `.edm-tabs`»**.
//   • `.project-scope-tabs` / `.user-admin-tabs` — **`flex-wrap: nowrap`** ⇒ **`flex: 1 1 0`** mới bằng nhau
//     TUYỆT ĐỐI; nhưng **dải CẤP TRANG cố ý `flex: none`** («thẻ ôm sát nhãn» — MỐC 119b: user nói bản giãn «xấu»)
//     ⇒ bản vá §11 **CHỈ áp TRONG `.modal`** (`.modal .project-scope-tabs > button, …`).
//
// ⭐ TỆP NÀY LÀM GÌ: **KHOÁ các bất biến đang đúng** ⇒ ⛔ không đổi một dòng CSS nào của sản phẩm, nhưng
//    (a) chặn hồi quy thật, và (b) **chặn báo động giả** cho phiên sau (mỗi quyết định «cố ý» đều được ghi ngay tại ca kiểm).
//
// Chạy riêng:  node --test tests/mt3-c05-modal-tab-sizing.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");
const CSS = read("app/styles/canonical.css");

/** Trích ĐÚNG thân của một quy tắc theo selector (⛔ không dùng regex tham lam toàn tệp). */
function ruleBody(selector) {
  const at = CSS.indexOf(selector);
  if (at < 0) return "";
  const open = CSS.indexOf("{", at);
  const close = CSS.indexOf("}", open);
  return open < 0 || close < 0 ? "" : CSS.slice(open + 1, close);
}
/** Trích quy tắc chứa `selector` khi selector bị XUỐNG DÒNG (vd `.modal .a > button,\n.modal .b > button {`). */
function ruleBodyMultiline(selector) {
  const at = CSS.indexOf(selector);
  if (at < 0) return "";
  const open = CSS.indexOf("{", at);
  const close = CSS.indexOf("}", open);
  return open < 0 || close < 0 ? "" : CSS.slice(open + 1, close);
}

// ── ① `.edm-tabs` — dải tab modal chi tiết: bản thân dải phải CỐ ĐỊNH kích thước ────────────────────
test("§22-1 · `.edm-tabs` là dải CỐ ĐỊNH (`flex: 0 0 auto`) và cho phép WRAP — ⛔ không co giãn theo nội dung", () => {
  const body = ruleBody(".edm-tabs {");
  assert.ok(body, "không tìm thấy quy tắc `.edm-tabs {` trong `app/styles/canonical.css`");
  assert.match(body, /flex:\s*0 0 auto/, "⛔ dải tab phải CỐ ĐỊNH kích thước (`flex: 0 0 auto`) để ⛔ không co theo nội dung tab");
  assert.match(body, /flex-wrap:\s*wrap/, "⛔ nhãn tab dài phải xuống dòng được (MỐC 115), ⛔ không bị cắt chữ");
});

test("§22-2 · `.edm-tabs button` giữ `flex: 1 1 auto` + `min-width: 0` — ⭐ **CỐ Ý (MỐC 115)**, ⛔ TUYỆT ĐỐI KHÔNG 'sửa' thành `1 1 0`", () => {
  const body = ruleBody(".edm-tabs button {");
  assert.ok(body, "không tìm thấy quy tắc `.edm-tabs button {`");
  // ⭐ BẤT BIẾN THEO QUYẾT ĐỊNH USER (MỐC 115) — `canonical.css` ghi «⛔ KHÔNG đụng». Nếu đổi thành `1 1 0`
  //    thì mất khả năng WRAP tự nhiên ⇒ vi phạm chính yêu cầu «vẫn phải hiển thị đầy đủ thông tin».
  assert.match(body, /flex:\s*1 1 auto/, "⛔ MỐC 115: `.edm-tabs button` PHẢI là `flex: 1 1 auto` (basis `auto` để còn wrap được)");
  assert.doesNotMatch(body, /flex:\s*1 1 0\b/, "⛔ ĐỔI SANG `flex: 1 1 0` LÀ SAI — mất wrap, vi phạm MỐC 115");
  assert.match(body, /min-width:\s*0/, "phải có `min-width: 0` để tab co được, ⛔ không tràn dải");
});

// ── ② TRẠNG THÁI ACTIVE ⛔ KHÔNG được đổi KÍCH THƯỚC (nguyên nhân lệch chuẩn nhất) ────────────────
test("§22-3 · tab `.is-active` chỉ đổi MÀU/ĐỘ ĐẬM — ⛔ KHÔNG đổi `padding`/`height`/`border-width` ⇒ ⛔ chiều cao không nhảy", () => {
  const body = ruleBody(".edm-tabs button.is-active {");
  assert.ok(body, "không tìm thấy quy tắc `.edm-tabs button.is-active {`");
  for (const bad of [/padding/, /height/, /border-width/, /font-size/]) {
    assert.doesNotMatch(body, bad, `⛔ tab active KHÔNG được đổi \`${bad}\` ⇒ sẽ làm nhảy kích thước khi đổi tab`);
  }
  // ĐỐI CHỨNG DƯƠNG: trạng thái thường đã có `border-bottom: 2px solid transparent` ⇒ khi active chỉ đổi MÀU
  //   viền (⛔ không đổi ĐỘ DÀY) ⇒ chiều cao giữ nguyên.
  const normal = ruleBody(".edm-tabs button {");
  assert.match(normal, /border-bottom:\s*2px solid transparent/, "⛔ tab thường phải có viền dưới TRONG SUỐT cùng độ dày ⇒ active chỉ đổi màu, ⛔ không đổi chiều cao");
});

// ── ③ NỘI DUNG ⛔ KHÔNG làm co modal khi tab ngắn (đồng bộ chiều cao giữa các tab) ───────────────
test("§22-4 · `.edm-body` có `min-height` ⇒ tab NGẮN ⛔ không làm modal co lại (kích thước đồng nhất giữa các tab)", () => {
  const body = ruleBody(".edm-body {");
  assert.ok(body, "không tìm thấy quy tắc `.edm-body {`");
  assert.match(body, /min-height:\s*\d/, "⛔ thiếu `min-height` ⇒ đổi sang tab ngắn là modal TỤT chiều cao ⇒ lệch hiển thị (§22)");
  assert.match(body, /overflow-y:\s*auto/, "thân modal phải là VÙNG CUỘN DUY NHẤT (U-10: modal ⛔ không vượt viewport)");
});

test("§22-5 · `.entity-detail-modal` ⛔ KHÔNG vượt viewport (U-10) và tiêu đề có `min-height`", () => {
  const modal = ruleBody(".entity-detail-modal {");
  assert.match(modal, /max-height:\s*min\(88vh/, "⛔ modal phải chặn chiều cao theo viewport (U-10)");
  assert.match(modal, /display:\s*flex/, "modal phải là flex column để thân cuộn được");
  // Tiêu đề modal: `globals.css` đặt `min-height` cho `.modal>header` ⇒ tiêu đề DÀI/NGẮN ⛔ không đổi vùng tiêu đề.
  const globals = read("app/globals.css");
  assert.match(globals, /\.modal>header[^{]*\{[^}]*min-height/, "⛔ `.modal>header` phải có `min-height` ⇒ ⛔ tiêu đề dài/ngắn không làm nhảy vùng tiêu đề (§22)");
});

// ── ④ BẢN VÁ §11 ĐÃ CÓ: tab trong MODAL chia đều — và ⛔ KHÔNG rò ra dải CẤP TRANG ────────────────
test("§11-1 · bản vá «tab trong MODAL chia đều»: `.modal .project-scope-tabs > button, .modal .user-admin-tabs > button { flex: 1 1 0; min-width: 0 }`", () => {
  const body = ruleBodyMultiline(".modal .project-scope-tabs > button,");
  assert.ok(body, "⛔ THIẾU bản vá §11 (v68/v69) — tab trong modal sẽ co theo độ dài nhãn ⇒ LỆCH HƠN GẤP ĐÔI");
  assert.match(body, /flex:\s*1 1 0/, "tab trong modal phải `flex: 1 1 0` (`nowrap` ⇒ mới bằng nhau TUYỆT ĐỐI)");
  assert.match(body, /min-width:\s*0/, "phải có `min-width: 0` để ⛔ không tràn");
});

test("§11-2 · ⛔ bản vá §11 KHÔNG được rò ra dải CẤP TRANG (MỐC 119b «thẻ ôm sát nhãn» phải giữ nguyên)", () => {
  // ⚠️ GHI RÕ GIÁ TRỊ THẬT (đo trong `app/styles/canonical.css`): dải cấp trang dùng
  //    `.project-scope-tabs > *, .inventory-tabs > *, .switch-tabs > * { flex: 0 0 auto; }`
  //    — ⛔ **KHÔNG** phải `flex: none` (bản minify cũ trong tài liệu ghi `flex:none` ⇒ ⛔ đừng tin tài liệu,
  //    **nguồn sự thật là MÃ ĐANG CHẠY** — Goal §16).
  const body = ruleBody(".project-scope-tabs > *");
  assert.ok(body, "không tìm thấy quy tắc `.project-scope-tabs > *` (dải tab CẤP TRANG)");
  assert.match(body, /flex:\s*0 0 auto/, "⛔ dải tab CẤP TRANG phải giữ «ôm sát nhãn» (`flex: 0 0 auto` — MỐC 119b, user chốt bản giãn là «xấu»)");
  assert.doesNotMatch(body, /flex:\s*1 1 0/, "⛔ bản vá §11 đã RÒ ra dải cấp trang ⇒ phá quyết định MỐC 119b của user");
  // Và bản vá phải được NEO bằng `.modal …` (⛔ không dùng selector bao trùm như `[role="tablist"]`
  //   vì `ProjectDetailTabs` cũng mang `role="tablist"` ⇒ sẽ chạm `.edm-tabs` — đúng cái bị CẤM).
  const cssNoComment = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(cssNoComment, /\[role="tablist"\]\s*>\s*button\s*\{[^}]*flex:\s*1 1 0/,
    "⛔ CẤM dùng `.modal [role=\"tablist\"] > button` — selector đó CHẠM `.edm-tabs` (bị cấm đụng)");
});

test("§11-3 · ⛔ `.edm-tabs` KHÔNG bị bản vá §11 chạm tới (tôn trọng cảnh báo «⛔ KHÔNG đụng»)", () => {
  const cssNoComment = CSS.replace(/\/\*[\s\S]*?\*\//g, "");
  // Bất kỳ quy tắc nào vừa nhắc `.edm-tabs` vừa đặt `flex: 1 1 0` cho BUTTON đều là XÂM PHẠM.
  const offenders = [...cssNoComment.matchAll(/[^{}]*\.edm-tabs[^{}]*\{[^{}]*\}/g)]
    .map((m) => m[0])
    .filter((rule) => /flex:\s*1 1 0/.test(rule));
  assert.deepEqual(offenders, [], "⛔ Có quy tắc `.edm-tabs` bị đổi sang `flex: 1 1 0` — VI PHẠM MỐC 115 + cảnh báo «⛔ KHÔNG đụng»:\n" + offenders.join("\n"));
});

test("C05-9 · ĐỐI CHỨNG ÂM: bộ dò của `§11-3` PHẢI bắt được quy tắc XÂM PHẠM thật (⛔ nếu không ⇒ cổng VÔ DỤNG)", () => {
  // ⭐ Dùng ĐÚNG biểu thức của `§11-3` (chống «ĐẠT RỖNG» — LUẬT 21):
  const radar = (css) => [...css.matchAll(/[^{}]*\.edm-tabs[^{}]*\{[^{}]*\}/g)]
    .map((m) => m[0])
    .filter((rule) => /flex:\s*1 1 0/.test(rule));
  // ⭐ MẪU LỖI THẬT: nếu bản vá §11 bị áp bừa lên `.edm-tabs` thì sinh ĐÚNG quy tắc này (VI PHẠM MỐC 115):
  assert.equal(radar(".modal .edm-tabs > button { flex: 1 1 0; }").length, 1,
    "⛔ bộ dò HỎNG: không bắt được quy tắc xâm phạm `.edm-tabs { flex: 1 1 0 }`");
  // ⛔ Và ⛔ KHÔNG báo oan quy tắc ĐÚNG (MỐC 115 giữ `flex: 1 1 auto`):
  assert.equal(radar(".edm-tabs button { flex: 1 1 auto; min-width: 0; }").length, 0,
    "⛔ báo OAN quy tắc ĐÚNG của MỐC 115");
});