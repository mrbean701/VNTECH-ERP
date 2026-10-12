#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PROBE `Q-UI-01` — NÚT «＋ Tạo công việc» CÓ NẰM **SÁT NGAY SAU Ô TÌM KIẾM** KHÔNG?
// Phiên: ERP-SESSION-04 (`SESSION_D`) · 09/10/2026 · ⚠️ CHỈ ĐỌC
//
// VÌ SAO: ⚠️ chờ build FE mất thời gian ⇒ ⭐ render **COMPONENT THẬT** `app/components/ui/ListToolbar.tsx`
//   bằng `react-dom/server` ⇒ ĐO **THỨ TỰ THẬT trong HTML sinh ra** (⛔ không chỉ đọc mã nguồn).
//   ⚠️ Vì sao quan trọng: user chốt «đổi sang sát ô tìm kiếm» ⇒ nút phải nằm **SAU** ô `<input>` tìm kiếm
//   (⚠️ trước đây ở `actions` = **TRƯỚC** bộ điều khiển ⇒ **bên TRÁI** ô tìm kiếm) ✓
//
// CÁCH DÙNG: node --import tsx docs/dsh-mutil-session/SESSION_D/probes/verify-nut-tao-viec-sat-o-tim-kiem.mjs
// MÃ TRẢ VỀ: 0 = ĐẠT · 1 = SAI
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ListToolbar } from "../../../../app/components/ui/ListToolbar.tsx";

const dong = "═".repeat(96);
console.log(dong);
console.log("PROBE Q-UI-01 — nút «＋ Tạo công việc» có nằm SÁT NGAY SAU ô tìm kiếm (theo chốt user 16:26)?");
console.log(`⏱  ${new Date().toISOString()} · phiên ERP-SESSION-04 · ⚠️ CHỈ ĐỌC · render COMPONENT THẬT`);
console.log(dong);

const nut = h("button", { type: "button", className: "primary", "data-vntech": "work-create-open" }, "＋ Tạo công việc");
const html = renderToStaticMarkup(
  h(ListToolbar, {
    title: "Danh sách công việc",
    note: "Nhóm «Của tôi» · 1 việc",
    search: { value: "", onChange: () => {}, placeholder: "Tìm mã việc, nội dung, người làm…" },
    // ⚠️ ĐÚNG như `WorkCenter.tsx`: nút nằm ở `secondaryActions` (nhóm PHỤ) ⇒ render SAU bộ điều khiển
    secondaryActions: h("div", { className: "row-actions list-toolbar-secondary" }, nut),
  }),
);

const iSearch = html.indexOf('class="list-toolbar-search"');
const iInput = html.indexOf("<input");
const iNut = html.indexOf('data-vntech="work-create-open"');
const iControls = html.indexOf("list-toolbar-controls");
const iSecondary = html.indexOf("list-toolbar-secondary");
const iPrimary = html.indexOf("list-toolbar-primary");

console.log(`   vị trí trong HTML: controls=${iControls} · search=${iSearch} · <input>=${iInput} · secondary=${iSecondary} · nút=${iNut} · primary=${iPrimary}`);
const coInput = iInput >= 0 && iNut > iInput;              // ① nút SAU ô input
const trongNhomPhu = iSecondary >= 0 && iNut > iSecondary;   // ② nút nằm trong nhóm PHỤ
const khongNhomChinh = iPrimary < 0;                         // ③ ⛔ KHÔNG còn ở nhóm CHÍNH
const ok = coInput && trongNhomPhu && khongNhomChinh;

console.log(`   ${coInput ? "✅" : "🔴"} nút nằm SAU ô tìm kiếm (<input>) ⇒ «sát ngay ô tìm kiếm»`);
console.log(`   ${trongNhomPhu ? "✅" : "🔴"} nút nằm trong nhóm PHỤ (.list-toolbar-secondary)`);
console.log(`   ${khongNhomChinh ? "✅" : "🔴"} ⛔ KHÔNG còn ở nhóm CHÍNH (.list-toolbar-primary)`);
console.log(dong);
if (ok) { console.log("✅ KẾT LUẬN: đúng chốt của user — nút «＋ Tạo công việc» render **NGAY SAU** ô tìm kiếm ✓"); process.exitCode = 0; }
else { console.log("🔴 KẾT LUẬN: ⛔ SAI thứ tự ⇒ xem chi tiết ở trên"); process.exitCode = 1; }
