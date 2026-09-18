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
import { createRequire } from "node:module";

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

// ── 4. Tách thân thành các CON MỨC NGOÀI CÙNG bằng ĐẾM NGOẶC (sửa lỗi của bản tách theo `<section>`) ────
// Vì sao: bản đầu tách theo cặp `<section>…</section>` ⇒ các khối **CÓ ĐIỀU KIỆN** (`{cond && <section …>…}`)
// bị cắt đôi giữa hai đoạn (`}` thừa ở đoạn sau) ⇒ JSX lệch ngoặc. Nay tách theo **biểu thức `{…}` có đếm ngoặc
// + chuỗi/template**, phần còn lại là các "run" markup ⇒ nối lại LUÔN bằng thân gốc (kiểm bên dưới).
function splitChildren(text) {
  const out = [];
  let buf = "";
  let i = 0;
  let tagDepth = 0;
  let fragDepth = 0;   // độ sâu FRAGMENT `<>…</>` (bài học: chỉ theo dõi thẻ là CHƯA ĐỦ)   // ⚠️ LỖI ĐÃ GẶP: bản trước KHÔNG theo dõi độ sâu thẻ nên coi cả `{…}` nằm TRONG markup
                      // (ví dụ ô `summary-grid`: `<small>…</small><strong>{request.requestedBy}</strong>`) là con
                      // mức ngoài cùng ⇒ xé rời nội dung. Nay chỉ coi `{` là mốc khi **độ sâu thẻ = 0**.
  while (i < text.length) {
    if (tagDepth === 0 && fragDepth === 0 && text[i] === "{") {
      let depth = 0, j = i, q = null, tpl = false;
      for (; j < text.length; j++) {
        const c = text[j];
        if (q) { if (c === "\\") { j++; continue; } if (c === q) q = null; continue; }
        if (tpl) { if (c === "\\") { j++; continue; } if (c === "`") tpl = false; continue; }
        if (c === '"' || c === "'") { q = c; continue; }
        if (c === "`") { tpl = true; continue; }
        if (c === "{") depth++;
        else if (c === "}") { depth--; if (depth === 0) { j++; break; } }
      }
      if (depth !== 0) { failures.push("[thân] có `{` không có `}` đóng ⇒ DỪNG"); break; }
      if (buf) out.push({ kind: "markup", text: buf });
      out.push({ kind: "expr", text: text.slice(i, j) });
      buf = "";
      i = j;
      continue;
    }
    if (text[i] === "<") {
      const close = text.startsWith("</", i);
      const m = text.slice(i).match(close ? /^<\/\s*([A-Za-z][\w.:-]*)/ : /^<\s*([A-Za-z][\w.:-]*)/);
      if (!m) { if (text.startsWith("<>", i)) fragDepth++; else if (text.startsWith("</>", i)) fragDepth = Math.max(0, fragDepth - 1); buf += text[i]; i++; continue; }                    // `<>` / `</>` (fragment) ⇒ bỏ qua, không đổi độ sâu
      let j = i + 1, q = null, brace = 0;
      for (; j < text.length; j++) {
        const c = text[j];
        if (q) { if (c === "\\") { j++; continue; } if (c === q) q = null; continue; }
        if (c === '"' || c === "'") { q = c; continue; }
        if (c === "{") brace++;
        else if (c === "}") brace--;
        else if (c === ">" && brace === 0) break;
      }
      const tagText = text.slice(i, j + 1);
      // ⚠️ LỖI ĐÃ GẶP: chỉ cắt tại biểu thức `{…}` ⇒ hai `<section>` LIỀN NHAU (không có biểu thức ở giữa) bị gộp
      // vào CÙNG một con ⇒ tab "Tổng quan" và "Hồ sơ" biến mất (bị hút vào tab khác). Nay **cắt tại MỌI `<section`
      // ở độ sâu 0** (tức `tagDepth === 0` TRƯỚC khi tăng) — đúng như bản đồ khối văn bản.
      if (!close && tagDepth === 0 && fragDepth === 0 && /^<\s*section\b/i.test(tagText) && buf) {
        out.push({ kind: "markup", text: buf });
        buf = "";
      }
      if (close) tagDepth = Math.max(0, tagDepth - 1);
      else if (!/\/>$/.test(tagText)) tagDepth++;
      buf += tagText; i = j + 1; continue;
    }
    buf += text[i]; i++;
  }
  if (buf) out.push({ kind: "markup", text: buf });
  return out;
}
const children = splitChildren(bodyInner);
const rebuilt = children.map((c) => c.text).join("");
if (rebuilt !== bodyInner) failures.push("[body] nối các con KHÔNG bằng thân gốc ⇒ DỪNG (nguy cơ mất nội dung)");
notes.push(`thân drawer-body ${bodyInner.length} ký tự → ${children.length} con (${children.filter((c) => c.kind === "expr").length} biểu thức {…} + ${children.filter((c) => c.kind === "markup").length} run markup)`);

const labelFor = (text) => {
  if (text.includes("Tổng hợp giao nhận")) return "Giao nhận";
  if (text.includes("Tiến trình phê duyệt")) return "Phê duyệt";
  if (text.includes("CHT sửa phiếu")) return "Sửa phiếu";
  if (text.includes("Mục đích / Ghi chú")) return "Ghi chú";
  if (text.includes("Ảnh / Hồ sơ")) return "Hồ sơ";
  if (text.includes("summary-grid request-summary")) return "Tổng quan";
  if (text.includes("Tiến trình mua và giao hàng")) return "Tiến trình mua";
  return null;
};
// Con "vụn" (chỉ khoảng trắng hoặc chỉ thẻ đóng) ⇒ GỘP vào con trước để không sinh tab rác và không mất nội dung.
const isFragmentary = (text) => !text.trim() || /^(\s*<\/?[a-zA-Z][^>]*>\s*)+$/.test(text);
const tabs = [];
for (const c of children) {
  if (tabs.length && isFragmentary(c.text)) { tabs[tabs.length - 1].jsx += c.text; continue; }
  const label = labelFor(c.text);
  if (!label) {
    if (isFragmentary(c.text)) continue;
    failures.push(`[tab] không suy được NHÃN cho con ${c.kind} dài ${c.text.length} ký tự (bắt đầu: ${JSON.stringify(c.text.slice(0, 90))}) ⇒ DỪNG`);
    continue;
  }
  tabs.push({ key: label.toLowerCase().replace(/\s+/g, "-"), label, jsx: c.text });
}
if (!tabs.length) failures.push("[tab] không dựng được tab nào ⇒ DỪNG");

// ── 5. Dựng JSX mới ───────────────────────────────────────────────────────────────────────
const tabsJsx = tabs.map((t) => `{ key: ${JSON.stringify(t.key)}, label: ${JSON.stringify(t.label)}, content: <>${t.jsx}</> }`).join(", ");
const newJsx = `return <EntityDetailModal open onClose={close} title=${JSON.stringify(titleText)} subtitle={<>{${subMatch[1].replace(/^\{|\}$/g, "")}}</>} entityId={request.requestNo} actions={<>${actionsJsx}<StatusBadge value={statusLabel(request)} /></>} tabs={[${tabsJsx}]} footer={<>${footerInner}</>} />;`;

// ── 6. BẤT BIẾN "KHÔNG MẤT NỘI DUNG" ─────────────────────────────────────────────────────
const count = (text, needle) => text.split(needle).length - 1;
for (const needle of ["<section", "action(", "<form", 'type="submit"', "CardHead"]) {
  const a = count(line, needle), b = count(newJsx, needle);
  if (a !== b) failures.push(`[bất biến] "${needle}": bản cũ ${a} → bản mới ${b} ⇒ DỪNG`);
}
// `onClick` GIẢM ĐÚNG 1 là CÓ CHỦ ĐÍCH: nút "← Quay lại" trong `<header>` bị thay bằng nút × của
// `EntityDetailModal` (chuỗi `close` KHÔNG mất — nay nằm ở `onClose={close}`). Nếu giảm khác 1 ⇒ DỪNG.
const onClickOld = count(line, "onClick="), onClickNew = count(newJsx, "onClick=");
const hasBackButton = /className=\{isPage \? "page-back"/.test(headerInner);
const expectedNew = onClickOld - (hasBackButton ? 1 : 0);
if (onClickNew !== expectedNew) failures.push(`[bất biến] "onClick=": bản cũ ${onClickOld} → bản mới ${onClickNew} (kỳ vọng ${expectedNew}; chỉ được giảm 1 do nút "← Quay lại" thay bằng × của modal) ⇒ DỪNG`);
if (!newJsx.includes("onClose={close}")) failures.push("[bất biến] mất dây nối `onClose={close}` ⇒ DỪNG");
for (const label of ["Xóa phiếu & lập mới", "Gửi lại từ đầu", "⇩ Tải Excel", "⇩ Tải PDF"]) {
  if (!newJsx.includes(label)) failures.push(`[bất biến] mất nút "${label}" ⇒ DỪNG`);
}
for (const gone of ["drawer-body", "request-drawer", "page-mode", "overlay"]) {
  if (newJsx.includes(gone)) failures.push(`[bất biến] JSX mới còn "${gone}" ⇒ DỪNG`);
}
if (!newJsx.includes("request.requestNo")) failures.push("[bất biến] mất `request.requestNo` ⇒ DỪNG");

// ── 7. In kế hoạch ─────────────────────────────────────────────────────────────────────── (bài học đã trả giá: bất biến ĐẾM là chưa đủ)
// Lượt `--apply` đầu tiên ĐÃ GHI một JSX **LỆCH CÂN** (fragment/thẻ) mà mọi bất biến đếm đều qua;
// `tsc` mới là thứ bắt được (`TS1109/TS1005/TS2657`). Nay công cụ **tự parse bản JSX mới** trước khi ghi:
// nếu `typescript` báo bất kỳ lỗi cú pháp nào ⇒ **TỪ CHỐI GHI** và in chẩn đoán.
try {
  const ts = createRequire(import.meta.url)("typescript");
  const draft = lines.slice(); draft[jsxLineIdx] = newJsx;
  const sf = ts.createSourceFile(PAGE, draft.join("\n"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const diags = (sf.parseDiagnostics || []).map((d) => `TS${d.code}@${d.start}: ${ts.flattenDiagnosticMessageText(d.messageText, " ")}`);
  if (diags.length) {
    failures.push(`[tự kiểm PARSE] JSX mới có ${diags.length} lỗi cú pháp ⇒ TỪ CHỐI GHI. Đầu tiên: ${diags.slice(0, 4).join(" · ")}`);
    notes.push("⚠️ Đây chính là lớp lỗi đã lọt qua bất biến ĐẾM ở lượt --apply đầu (đã hoàn tác bằng git checkout).");
  } else notes.push("tự kiểm PARSE: JSX mới HỢP LỆ (0 lỗi cú pháp)");
} catch (e) { failures.push(`[tự kiểm PARSE] không chạy được typescript: ${String(e.message).slice(0, 80)}`); }


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
