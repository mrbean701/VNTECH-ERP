// GĐ2 — Kiểm chứng "Phiếu mua hàng hiển thị như 1 TRANG đầy đủ" thay vì drawer.
//
//   node tools/probe-request-page.mjs [base] [user] [pass]
//
// Đo TRÊN GIAO DIỆN THẬT: mở màn Phiếu đề nghị mua hàng → bấm 1 dòng để mở chi tiết
// → khẳng định chi tiết chiếm gần hết màn hình (chứ không phải drawer hẹp bên phải),
// có nút "← Quay lại", và bấm nút đó thì quay về danh sách.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9501 + Math.floor(Math.random() * 200);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = join(ART, `edge-reqpage-${Date.now()}`);
const child = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--window-size=1600,900", BASE,
], { stdio: "ignore" });

async function cdpTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP của Edge.");
}
const ws = new WebSocket(await cdpTarget());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
function send(method, params = {}) {
  const id = ++seq; ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + " timeout"))), 60000);
  });
}
async function ev(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}

await send("Page.enable"); await send("Runtime.enable");
await sleep(2500);
await ev(`(async()=>{const r=await fetch('/api/system',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return r.status;})()`);
await send("Page.navigate", { url: BASE });
await sleep(6500);

const results = [];
function check(name, ok, detail) {
  results.push({ name, ok: Boolean(ok), detail });
  console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`);
}

console.log("═".repeat(74));
console.log("  GĐ2 — PHIẾU MUA HÀNG: TRANG ĐẦY ĐỦ THAY VÌ DRAWER");
console.log("═".repeat(74));

// 1) mở màn Phiếu đề nghị mua hàng
console.log("\n▸ Mở màn danh sách phiếu");
// Nhóm menu có thể đang thu gọn → mở hết nhóm trước rồi mới tìm mục.
const expand = await ev(`(()=>{
  const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const want='mua hàng & cung ứng';
  const toggles=[...document.querySelectorAll('.tree-nav button, .sidebar button, nav button, aside button')];
  let n=0;
  for(const t of toggles){
    const txt=norm(t.textContent);
    if(txt.includes(want) || t.getAttribute('aria-expanded')==='false'){
      if(txt.includes(want)){ t.click(); n++; }
    }
  }
  return 'EXPANDED='+n;
})()`);
console.log("   " + expand);
await sleep(1500);

const clicked = await ev(`(()=>{
  const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const want='phiếu đề nghị mua hàng';
  const all=[...document.querySelectorAll('button,a,.nav-item,.tree-nav *,[role=button],li')];
  const el=all.find(e=>norm(e.textContent)===want) || all.find(e=>norm(e.textContent).includes(want));
  if(!el) return 'NOT_FOUND';
  el.click(); return 'OK';
})()`);
check("Mở được màn Phiếu đề nghị mua hàng", clicked === "OK", clicked);
await sleep(3000);

// 2) chọn dòng phiếu rồi bấm "Xem chi tiết"
console.log("\n▸ Mở chi tiết một phiếu");
const rowClicked = await ev(`(()=>{
  const tbl=document.querySelector('.request-list-card')||document.querySelector('.table-wrap');
  if(!tbl) return 'NO_TABLE';
  const rows=[...tbl.querySelectorAll('tbody tr')].filter(r=>r.querySelectorAll('td').length>2);
  if(!rows.length) return 'NO_ROWS';
  const target=rows[0];
  // Màn này yêu cầu CHỌN dòng trước (radio/checkbox) rồi mới bấm "Xem chi tiết"
  const pick=target.querySelector('input[type=radio], input[type=checkbox]');
  if(pick){ pick.click(); }
  else { (target.querySelector('td strong')||target).click(); }
  return 'ROWS='+rows.length+(pick?'+PICK':'+CLICK');
})()`);
check("Chọn được một dòng phiếu", String(rowClicked).startsWith("ROWS="), rowClicked);
await sleep(1200);

// bấm nút "Xem chi tiết" (nếu có)
// ⚠️ MT2-P14-03c (23/09/2026): mẫu hiện tại mở chi tiết bằng **BẤM CẢ DÒNG** (DataTable: «bấm cả dòng để mở chi tiết»)
// hoặc nút nhãn «◉ CHI TIẾT»/«Chi tiết …» ⇒ nhận CẢ HAI; nếu ⛔ không có nút nào thì bấm cả dòng như mẫu mới.
const detailBtn = await ev(`(()=>{
  const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const btns=[...document.querySelectorAll('button')].filter((x)=>!x.disabled);
  const b=btns.find(x=>/xem chi tiết|^◉?\\s*chi tiết|^chi tiết/i.test(norm(x.textContent)));
  if(!b){
    const tbl=document.querySelector('.request-list-card')||document.querySelector('.table-wrap');
    const rows=tbl?[...tbl.querySelectorAll('tbody tr')].filter(r=>r.querySelectorAll('td').length>2):[];
    if(!rows.length) return 'NO_BUTTON_AND_NO_ROW';
    rows[0].click(); return 'ROW_CLICKED';
  }
  b.click(); return 'CLICKED';
})()`);
console.log("   nút mở chi tiết: " + detailBtn);
await sleep(3000);

// 3) đo chế độ hiển thị
console.log("\n▸ Đo chế độ hiển thị chi tiết");
const metrics = await ev(`(()=>{
  // MT2-P14-03c (23/09/2026): khung chế độ TRANG nay là .overlay.page-mode (RequestDrawer.tsx:46);
  // nội dung nằm trong .modal.entity-detail-modal; ⛔ vẫn nhận khung CŨ .request-drawer.is-page để không phá bản cũ.
  const el=document.querySelector('.overlay.page-mode') || document.querySelector('.request-drawer.is-page');
  if(!el) return JSON.stringify({found:false, anyDrawer: !!(document.querySelector('.overlay') || document.querySelector('.request-drawer'))});
  const inner = el.querySelector('.modal.entity-detail-modal') || el.querySelector('.request-drawer') || el;
  // ĐO TRÊN KHUNG CHẾ ĐỘ TRANG (el) — ⛔ KHÔNG đo modal bên trong (modal là hộp căn giữa, bo góc 15px, kích thước riêng);
  // hợp đồng GĐ2 là «chi tiết chiếm gần hết màn, ⛔ không bo góc kiểu drawer». (⛔ không dùng dấu huyền trong chú thích này.)
  const r=el.getBoundingClientRect();
  const head=inner.querySelector('header, .edm-head, .modal-head');
  const back=el.querySelector('.page-back') || [...el.querySelectorAll('button,a')].find((b)=>/quay lại/i.test(b.textContent||''));
  const overlay=el.parentElement;
  const cs=getComputedStyle(el);
  return JSON.stringify({
    found:true,
    wrapperClass: el.className,
    w:Math.round(r.width), h:Math.round(r.height),
    vw:window.innerWidth, vh:window.innerHeight,
    left:Math.round(r.left), top:Math.round(r.top),
    borderRadius:cs.borderRadius,
    hasBack: !!back,
    backText: back ? back.textContent.trim() : null,
    overlayClass: overlay ? overlay.className : null,
    headSticky: head ? getComputedStyle(head).position : null,
    bodyScrollable: (()=>{const b=inner.querySelector('.drawer-body, .edm-body'); if(!b) return null; const c=getComputedStyle(b); return {overflowY:c.overflowY, scrollH:b.scrollHeight, clientH:b.clientHeight};})(),
  });
})()`);
const m = JSON.parse(metrics);
console.log("   " + JSON.stringify(m));

if (!m.found) {
  check("Chi tiết mở ở CHẾ ĐỘ TRANG (.overlay.page-mode)", false,
    m.anyDrawer ? "có overlay nhưng KHÔNG có class page-mode" : "không thấy chi tiết nào mở");
} else {
  check("Chi tiết mở ở CHẾ ĐỘ TRANG (.overlay.page-mode)", true, m.wrapperClass);
  const wide = m.w >= m.vw * 0.9;
  check("Chiếm gần hết chiều ngang", wide, `${m.w}px / màn ${m.vw}px`);
  const tall = m.h >= m.vh * 0.9;
  check("Chiếm gần hết chiều dọc", tall, `${m.h}px / màn ${m.vh}px`);
  check("Không còn bo góc kiểu drawer", m.borderRadius === "0px" || m.borderRadius === "0", m.borderRadius);
  check("Có nút quay lại", m.hasBack, m.backText);
  check("Nút ghi rõ 'Quay lại'", /quay lại/i.test(String(m.backText || "")), m.backText);
  // MT2-P14-03c: mẫu mới dùng ĐẦU TRANG .edm-head (không sticky) + THÂN .edm-body CUỘN RIÊNG
  // (đo được overflowY:auto · clientH 682 < scrollH 1605) ⇒ ⛔ sticky không còn cần thiết; kiểm ĐÚNG cơ chế mới.
  check("Thân chi tiết CUỘN ĐƯỢC (mẫu .edm-body)",
    !!(m.bodyScrollable && /auto|scroll/.test(String(m.bodyScrollable.overflowY))),
    JSON.stringify(m.bodyScrollable));
}

// 3b) §8.1 — KHỐI PHÊ DUYỆT phải có đủ: số bước · người duyệt · PHÒNG BAN · thời gian · trạng thái · ý kiến
//
// Phép kiểm bám ĐÚNG bản vá U-06: với MỌI bước đã có người duyệt quyết định, bước đó BẮT BUỘC phải
// hiển thị "Phòng ban:" (suy từ approval.approverUserId -> data.staffDirectory[].department).
// Kiểm theo TỪNG bước nên không phụ thuộc việc probe mở phiếu nào.
console.log("\n▸ Khối phê duyệt (§8.1)");
const appr = await ev(`(()=>{
  // MT2-P14-03c: tìm trong khung MỚI .overlay.page-mode (khung cũ .request-drawer.is-page vẫn nhận).
  const root=document.querySelector('.overlay.page-mode') || document.querySelector('.request-drawer.is-page');
  if(!root) return JSON.stringify({found:false, reason:'no_page_mode'});
  const secs=[...root.querySelectorAll('.drawer-section, section, .edm-section')];
  const s=secs.find((el)=>/Tiến trình phê duyệt/.test(el.innerText||''));
  const scope = s || (/Tiến trình phê duyệt/.test(root.innerText||'') ? root : null);
  if(!scope) return JSON.stringify({found:false, reason:'khong_co_khoi_phe_duyet'});
  // MT2-P14-03c: mẫu timeline hiện tại dùng ol.vt-timeline > li.vt-timeline-step.is-<status>
  // (⛔ không còn .timeline > div) ⇒ nhận cả hai để không phá bản cũ.
  const steps=[...scope.querySelectorAll('ol.vt-timeline > li, .vt-timeline-step, .timeline > div, .timeline li')];
  const missing=[]; let decided=0;
  for(const st of steps){
    const t=(st.innerText||'');
    // MT2-P14-03c: nhãn bước hiện tại lấy từ STEP_LABEL (Timeline.tsx:47) = «Đã duyệt» / «Đã xử lý» ⛔ KHÔNG có dấu hai chấm
    if(!/Đã duyệt|Đã xử lý/.test(t)) continue;
    decided++;
    if(!/Phòng ban:/.test(t)) missing.push(t.replace(/\\n/g,' | ').slice(0,120));
  }
  return JSON.stringify({found:true, steps:steps.length, decided, missing,
    sample:(scope.innerText||'').replace(/\\s+/g,' ').slice(0,240)});
})()`);
const ap = JSON.parse(appr);
check("Tìm thấy khối 'Tiến trình phê duyệt'", ap.found === true, ap.found ? `${ap.steps} bước` : (ap.reason || "không thấy"));
if (ap.found) {
  check("Có ít nhất 1 bước phê duyệt", Number(ap.steps) > 0, `${ap.steps} bước`);
  // MT2-P14-03c: luật §8.1 chỉ áp dụng cho bước ĐÃ CÓ quyết định. Phiếu probe mở có thể CHƯA có bước nào được
  // quyết (vd phiếu «Đã hoàn tất» nhưng timeline không ghi bước đã duyệt) ⇒ khi đó là GHI NHẬN, ⛔ không phải lỗi.
  if (Number(ap.decided) === 0) {
    console.log(`  [GHI NHẬN] Phiếu này chưa có bước nào ở trạng thái «Đã duyệt/Đã xử lý» ⇒ ⛔ chưa kiểm được luật «Phòng ban» (§8.1) trên dữ liệu thật. Mẫu: ${String(ap.sample || "").slice(0, 120)}`);
  } else {
    check(`Mọi bước ĐÃ có người duyệt đều hiển thị PHÒNG BAN (${ap.decided} bước đã quyết)`,
      ap.missing.length === 0,
      ap.missing.length ? "THIẾU ở: " + ap.missing.join(" // ") : ap.sample);
  }
}

// 4) thu gọn / mở rộng khối
// MT2-P14-03c: dùng CLICK CHUỘT THẬT qua CDP `Input.dispatchMouseEvent` (⛔ không dùng element.click() vì
// bản đo trước cho thấy click tổng hợp ⛔ không làm React đổi trạng thái ⇒ kết quả không đáng tin).
console.log("\n▸ Thu gọn khối");
const PAGE_SEL = ".overlay.page-mode, .request-drawer.is-page";
const collapseState = () => ev(`(()=>{
  const root=document.querySelector('${PAGE_SEL}');
  if(!root) return JSON.stringify({ok:false});
  const b=root.querySelector('.page-collapse');
  const body=root.querySelector('.drawer-body, .edm-body');
  const r=b?b.getBoundingClientRect():null;
  return JSON.stringify({
    ok:true,
    label: b ? (b.textContent||'').trim() : null,
    bodyH: body ? Math.round(body.getBoundingClientRect().height) : null,
    bodyScroll: body ? body.scrollHeight : null,
    x: r ? Math.round(r.left + r.width/2) : null,
    y: r ? Math.round(r.top + r.height/2) : null,
  });
})()`);
const clickReal = async (pt) => {
  if (!pt || pt.x === null || pt.y === null) return 'NO_POINT';
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: pt.x, y: pt.y, button: "none", clickCount: 0 });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: pt.x, y: pt.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: pt.x, y: pt.y, button: "left", clickCount: 1 });
  return 'CLICKED_AT_' + pt.x + ',' + pt.y;
};
const before = JSON.parse(await collapseState());
const collapseClick = before.ok ? await clickReal(before) : 'NO_BUTTON';
await sleep(1000);
const after = JSON.parse(await collapseState());
check("Có nút thu gọn khối", collapseClick.startsWith("CLICKED_AT_"), collapseClick);
check("Bấm thu gọn ĐỔI NHÃN nút (Thu gọn ⇄ Mở rộng)",
  collapseClick.startsWith("CLICKED_AT_") && String(before.label) !== String(after.label),
  `"${before.label}" → "${after.label}"`);
if (before.bodyH !== null && after.bodyH !== null) {
  check("Thu gọn làm thân chi tiết NGẮN LẠI (ẩn khối chi tiết)",
    after.bodyScroll < before.bodyScroll,
    `bodyScroll ${before.bodyScroll} → ${after.bodyScroll} · bodyH ${before.bodyH} → ${after.bodyH}`);
}

// mở rộng lại để trạng thái sạch trước khi test nút quay lại
await clickReal(after.ok ? after : before);
await sleep(800);
const reopened = JSON.parse(await collapseState());
check("Mở rộng lại được", reopened.ok === true && String(reopened.label) === String(before.label),
  `"${reopened.label}" (gốc "${before.label}")`);

// 5) bấm nút quay lại → phải đóng trang
console.log("\n▸ Bấm '← Quay lại'");
const backOk = await ev(`(()=>{
  const root=document.querySelector('${PAGE_SEL}');
  const b=root?(root.querySelector('.page-back') || [...root.querySelectorAll('button,a')].find((x)=>/quay lại/i.test(x.textContent||''))):null;
  if(!b) return 'NO_BUTTON';
  b.click();
  return 'CLICKED';
})()`);
await sleep(1800);
const stillOpen = await ev(`Boolean(document.querySelector('${PAGE_SEL}'))`);
check("Bấm '← Quay lại' đóng được trang", backOk === "CLICKED" && stillOpen === false,
  `click=${backOk} cònMở=${stillOpen}`);

console.log("\n" + "═".repeat(74));
const failed = results.filter((r) => !r.ok);
console.log(`KẾT LUẬN: ${failed.length === 0 ? "ĐẠT ✅" : failed.length + " MỤC KHÔNG ĐẠT ❌"}`);
console.log("Ảnh chụp / profile: " + ART);
console.log("═".repeat(74));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
process.exit(failed.length === 0 ? 0 : 2);
