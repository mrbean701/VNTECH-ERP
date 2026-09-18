// U-14 bước 3/6 — CHUYỂN `RequestDrawer` (page-mode) SANG `EntityDetailModal`.
//
// VÌ SAO DÙNG MỎ NEO + TỰ CHỐI: toàn bộ JSX của `RequestDrawer` nằm trong **MỘT dòng 9.254 ký tự**
// (`app/page.tsx:2894`). Sửa tay dòng khổng lồ là rủi ro cao ⇒ công cụ cắt theo mốc, và **TỪ CHỐI GHI**
// nếu bất kỳ điều kiện nào không đạt (bài học #21/#25: công cụ đo/sửa sai còn nguy hiểm hơn không làm).
//
// BẤT BIẾN "KHÔNG MẤT NỘI DUNG" (kiểm trước khi ghi):
//   • Nối (các khoảng trống + các `<section>`) phải **BẰNG ĐÚNG** thân `drawer-body` ban đầu;
//   • Số lượng `<section` · `onClick=` · `action(` · `<form` · `type="submit"` trong JSX MỚI phải **BẰNG** bản cũ;
//   • 3 nhãn nút ở footer (`Xóa phiếu & lập mới` · `Gửi lại từ đầu` · `⇩ Tải Excel`) phải còn.
//
//   node tools/chuyen-drawer-sang-edm.mjs [--apply]
import { readFileSync, writeFileSync } from "node:fs";

const PAGE = "app/page.tsx";
const APPLY = process.argv.includes("--apply");
const failures = [];
const notes = [];

const src = readFileSync(PAGE, "utf8");
const lines = src.split("\n");

// ── 1. Định vị hàm `RequestDrawer` và dòng JSX của nó ──────────────────────────────────────
const fnLine = lines.findIndex((l) => l.startsWith("function RequestDrawer("));
if (fnLine < 0) { console.error("✖ Không thấy `function RequestDrawer(` ⇒ DỪNG."); process.exit(1); }
const jsxLineIdx = lines.findIndex((l, i) => i > fnLine && l.includes('<div className={isPage ? "overlay page-mode" : "overlay"}'));
if (jsxLineIdx < 0) { console.error("✖ Không thấy dòng JSX của RequestDrawer ⇒ DỪNG."); process.exit(1); }
const line = lines[jsxLineIdx];
console.log(`RequestDrawer: hàm ở dòng ${fnLine + 1} · JSX ở dòng ${jsxLineIdx + 1} (${line.length} ký tự)`);

const countOnce = (needle, label) => {
  const n = line.split(needle).length - 1;
  if (n !== 1) failures.push(`[${label}] mốc "${needle}" xuất hiện ${n} lần (cần 1) ⇒ DỪNG`);
  return line.indexOf(needle);
};

// ── 2. Cắt 4 khối: mở đầu · header · body · footer · kết ────────────────────────────────────
const iHeaderOpen = countOnce("<header>", "mở header");
const iHeaderClose = countOnce("</header>", "đóng header");
const iBodyOpen = countOnce('<div className="drawer-body">', "mở drawer-body");
const iFooterOpen = countOnce("<footer", "mở footer");
const iFooterClose = countOnce("</footer>", "đóng footer");
const iAsideClose = countOnce("</aside>", "đóng aside");
if (failures.length) { console.error("✖ " + failures.join("\n✖ ")); process.exit(1); }

const head = line.slice(0, iHeaderOpen + "<header>".length);          // <div overlay><aside drawer><header>
const headerInner = line.slice(iHeaderOpen + "<header>".length, iHeaderClose);
const bodyInner = line.slice(iBodyOpen + '<div className="drawer-body">'.length, iFooterOpen);
const footerOpenTag = line.slice(iFooterOpen, line.indexOf(">", iFooterOpen) + 1);
const footerInner = line.slice(line.indexOf(">", iFooterOpen) + 1, iFooterClose);
const tail = line.slice(iFooterClose);                                 // </footer></aside></div>;

// ── 3. Bóc phần tiêu đề (nguyên văn) + nút hành động của header ─────────────────────────────
const titleMatch = headerInner.match(/<small className="document-name">([^<]+)<\/small>/);
const titleText = titleMatch ? titleMatch[1] : null;
const subMatch = headerInner.match(/<p>(\{request\.projectCode\} · \{request\.projectName\})<\/p>/);
const entityMatch = headerInner.match(/<strong>(\{request\.requestNo\})<\/strong>/);
if (!titleText || !subMatch || !entityMatch) failures.push("[header] không bóc được title/subtitle/entityId nguyên văn ⇒ DỪNG");
const collapseBtn = headerInner.match(/\{isPage && <button type="button" className="page-collapse"[\s\S]*?<\/button>\}/);
if (!collapseBtn) failures.push("[header] không thấy nút thu gọn khối để chuyển sang `actions` ⇒ DỪNG");
const actionsJsx = collapseBtn ? collapseBtn[0].replace(/\{isPage && /, "").replace(/\}$/, "") : "";

// ── 4. Tách thân thành [khoảng trống] + [section] theo thứ tự, kiểm "không mất nội dung" ────
const segs = [];
let cursor = 0;
const sections = [];
while (true) {
  const s = bodyInner.indexOf("<section", cursor);
  if (s < 0) break;
  const e = bodyInner.indexOf("</section>", s);
  if (e < 0) { failures.push("[body] có <section> không có </section> ⇒ DỪNG"); break; }
  sections.push({ start: s, end: e + "</section>".length });
  cursor = e + "</section>".length;
}
if (!sections.length) failures.push("[body] không tìm thấy <section> nào ⇒ DỪNG");
let pos = 0;
for (const sec of sections) {
  if (sec.start > pos) segs.push({ kind: "gap", text: bodyInner.slice(pos, sec.start) });
  segs.push({ kind: "section", text: bodyInner.slice(sec.start, sec.end) });
  pos = sec.end;
}
if (pos < bodyInner.length) segs.push({ kind: "gap", text: bodyInner.slice(pos) });
const rebuilt = segs.map((s) => s.text).join("");
if (rebuilt !== bodyInner) failures.push("[body] nối các đoạn KHÔNG bằng thân gốc ⇒ DỪNG (nguy cơ mất nội dung)");
notes.push(`thân drawer-body ${bodyInner.length} ký tự → ${segs.length} đoạn (${sections.length} section + ${segs.filter((s) => s.kind === "gap").length} khoảng)`);

const labelFor = (text) => {
  if (text.includes("Tiến trình phê duyệt")) return "Phê duyệt";
  if (text.includes("Tổng hợp giao nhận")) return "Giao nhận";
  if (text.includes("CHT sửa phiếu")) return "Sửa phiếu";
  if (text.includes("Mục đích / Ghi chú")) return "Ghi chú";
  if (text.includes("Ảnh / Hồ sơ")) return "Hồ sơ";
  if (text.includes("summary-grid request-summary")) return "Tổng quan";
  return null;
};
const tabs = [];
for (const s of segs) {
  if (s.kind === "gap" && !s.text.trim()) continue;                       // khoảng trống ⇒ bỏ
  const label = labelFor(s.text);
  if (!label) failures.push(`[tab] không suy được NHÃN cho đoạn ${s.kind} dài ${s.text.length} ký tự (bắt đầu: ${JSON.stringify(s.text.slice(0, 80))}) ⇒ DỪNG`);
  else tabs.push({ key: label.toLowerCase().replace(/\s+/g, "-"), label, jsx: s.text });
}
if (!tabs.length) failures.push("[tab] không dựng được tab nào ⇒ DỪNG");

// ── 5. Dựng JSX mới ───────────────────────────────────────────────────────────────────────
const tabsJsx = tabs.map((t) => `{ key: ${JSON.stringify(t.key)}, label: ${JSON.stringify(t.label)}, content: <>${t.jsx}</> }`).join(", ");
const newJsx = `return <EntityDetailModal open onClose={close} title=${JSON.stringify(titleText)} subtitle={<>{${subMatch[1].replace(/^\{|\}$/g, "")}}</>} entityId={request.requestNo} actions={<>${actionsJsx}<StatusBadge value={statusLabel(request)} /></>} tabs={[${tabsJsx}]} footer={<>${footerInner}</>} />;`;

// ── 6. BẤT BIẾN "KHÔNG MẤT NỘI DUNG" ─────────────────────────────────────────────────────
const count = (text, needle) => text.split(needle).length - 1;
for (const needle of ["<section", "onClick=", "action(", "<form", 'type="submit"', "CardHead"]) {
  const a = count(line, needle), b = count(newJsx, needle);
  if (a !== b) failures.push(`[bất biến] "${needle}": bản cũ ${a} → bản mới ${b} ⇒ DỪNG`);
}
for (const label of ["Xóa phiếu & lập mới", "Gửi lại từ đầu", "⇩ Tải Excel", "⇩ Tải PDF"]) {
  if (!newJsx.includes(label)) failures.push(`[bất biến] mất nút "${label}" ⇒ DỪNG`);
}
for (const gone of ["drawer-body", "request-drawer", "page-mode", "overlay"]) {
  if (newJsx.includes(gone)) failures.push(`[bất biến] JSX mới còn "${gone}" ⇒ DỪNG`);
}
if (!newJsx.includes("request.requestNo")) failures.push("[bất biến] mất `request.requestNo` ⇒ DỪNG");

// ── 7. In kế hoạch ───────────────────────────────────────────────────────────────────────
console.log(`\n=== KẾ HOẠCH CHUYỂN (dòng ${jsxLineIdx + 1}) ===`);
for (const n of notes) console.log("  • " + n);
console.log(`  • tiêu đề (nguyên văn): ${JSON.stringify(titleText)} · subtitle: {${subMatch[1].replace(/^\{|\}$/g, "")}} · entityId: {request.requestNo}`);
console.log(`  • ${tabs.length} TAB: ${tabs.map((t) => `${t.label}(${t.jsx.length} ký tự)`).join(" · ")}`);
console.log(`  • footer giữ nguyên ${footerInner.length} ký tự · actions = nút thu gọn + StatusBadge`);
console.log(`  • JSX mới: ${newJsx.length} ký tự (cũ ${line.length})`);
if (failures.length) {
  console.error("\nKHÔNG GHI TỆP — có điều kiện không đạt:");
  for (const f of failures) console.error("  ✖ " + f);
  process.exit(1);
}
if (!APPLY) { console.log("\nCHẠY KHÔ: chưa ghi tệp. Thêm --apply để ghi."); process.exit(0); }
lines[jsxLineIdx] = newJsx;
writeFileSync(PAGE, lines.join("\n"));
console.log(`\nĐÃ GHI: ${PAGE} (dòng ${jsxLineIdx + 1} thay bằng EntityDetailModal)`);
