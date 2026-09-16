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
const detailBtn = await ev(`(()=>{
  const norm=(s)=>String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const btns=[...document.querySelectorAll('button')];
  const b=btns.find(x=>norm(x.textContent).includes('xem chi tiết'));
  if(!b) return 'NO_BUTTON';
  if(b.disabled) return 'DISABLED';
  b.click(); return 'CLICKED';
})()`);
console.log("   nút Xem chi tiết: " + detailBtn);
await sleep(3000);

// 3) đo chế độ hiển thị
console.log("\n▸ Đo chế độ hiển thị chi tiết");
const metrics = await ev(`(()=>{
  const el=document.querySelector('.request-drawer.is-page');
  if(!el) return JSON.stringify({found:false, anyDrawer: !!document.querySelector('.request-drawer')});
  const r=el.getBoundingClientRect();
  const head=el.querySelector('header');
  const back=el.querySelector('.page-back');
  const overlay=el.parentElement;
  const cs=getComputedStyle(el);
  return JSON.stringify({
    found:true,
    w:Math.round(r.width), h:Math.round(r.height),
    vw:window.innerWidth, vh:window.innerHeight,
    left:Math.round(r.left), top:Math.round(r.top),
    borderRadius:cs.borderRadius,
    hasBack: !!back,
    backText: back ? back.textContent.trim() : null,
    overlayClass: overlay ? overlay.className : null,
    headSticky: head ? getComputedStyle(head).position : null,
    bodyScrollable: (()=>{const b=el.querySelector('.drawer-body'); if(!b) return null; const c=getComputedStyle(b); return {overflowY:c.overflowY, scrollH:b.scrollHeight, clientH:b.clientHeight};})(),
  });
})()`);
const m = JSON.parse(metrics);
console.log("   " + JSON.stringify(m));

if (!m.found) {
  check("Chi tiết mở ở CHẾ ĐỘ TRANG (.request-drawer.is-page)", false,
    m.anyDrawer ? "có drawer nhưng KHÔNG có class is-page" : "không thấy chi tiết nào mở");
} else {
  check("Chi tiết mở ở CHẾ ĐỘ TRANG (.request-drawer.is-page)", true);
  const wide = m.w >= m.vw * 0.9;
  check("Chiếm gần hết chiều ngang", wide, `${m.w}px / màn ${m.vw}px`);
  const tall = m.h >= m.vh * 0.9;
  check("Chiếm gần hết chiều dọc", tall, `${m.h}px / màn ${m.vh}px`);
  check("Không còn bo góc kiểu drawer", m.borderRadius === "0px" || m.borderRadius === "0", m.borderRadius);
  check("Có nút quay lại", m.hasBack, m.backText);
  check("Nút ghi rõ 'Quay lại'", /quay lại/i.test(String(m.backText || "")), m.backText);
  check("Đầu trang dính (sticky)", m.headSticky === "sticky", m.headSticky);
}

// 4) thu gọn / mở rộng khối
console.log("\n▸ Thu gọn khối");
const before = await ev(`(()=>{const s=document.querySelector('.request-drawer.is-page .drawer-section');return s?Math.round(s.getBoundingClientRect().height):null;})()`);
const collapseClick = await ev(`(()=>{
  const b=document.querySelector('.request-drawer.is-page .page-collapse');
  if(!b) return 'NO_BUTTON';
  b.click(); return 'CLICKED';
})()`);
await sleep(900);
const after = await ev(`(()=>{const s=document.querySelector('.request-drawer.is-page .drawer-section');return s?Math.round(s.getBoundingClientRect().height):null;})()`);
const cls = await ev(`(()=>{const el=document.querySelector('.request-drawer.is-page');return el?el.className:null;})()`);
check("Có nút thu gọn khối", collapseClick === "CLICKED", collapseClick);
if (before !== null && after !== null) {
  check("Thu gọn làm khối thấp đi", after < before, `${before}px → ${after}px`);
}
check("Có class sections-collapsed", /sections-collapsed/.test(String(cls)), cls);

// mở rộng lại để trạng thái sạch trước khi test nút quay lại
await ev(`(()=>{const b=document.querySelector('.request-drawer.is-page .page-collapse');if(b)b.click();return 1;})()`);
await sleep(700);
const reopened = await ev(`(()=>{const el=document.querySelector('.request-drawer.is-page');return el?!/sections-collapsed/.test(el.className):false;})()`);
check("Mở rộng lại được", reopened === true);

// 5) bấm nút quay lại → phải đóng trang
console.log("\n▸ Bấm '← Quay lại'");
const backOk = await ev(`(()=>{
  const b=document.querySelector('.request-drawer.is-page .page-back');
  if(!b) return 'NO_BUTTON';
  b.click();
  return 'CLICKED';
})()`);
await sleep(1800);
const stillOpen = await ev(`Boolean(document.querySelector('.request-drawer.is-page'))`);
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
