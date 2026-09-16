// GĐ1 — Đo lường vấn đề layout/scrollbar trên giao diện THẬT.
// Mục đích: có bằng chứng TRƯỚC khi sửa CSS, và kiểm chứng SAU khi sửa.
//
//   node tools/probe-layout-audit.mjs [base] [user] [pass]
//
// Đo tại 3 kích thước màn hình. In bảng + exit 0 nếu không còn vi phạm.
import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const PORT = 9401 + Math.floor(Math.random() * 200);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });

const VIEWPORTS = [
  { name: "1920x1080 (desktop)", w: 1920, h: 1080 },
  { name: "1366x768  (laptop)", w: 1366, h: 768 },
  { name: "768x1024  (tablet)", w: 768, h: 1024 },
];

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const profile = join(ART, `edge-layout-${Date.now()}`);
const child = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--window-size=1920,1080", BASE,
], { stdio: "ignore", detached: false });

async function cdpTarget() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json();
      const page = list.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (page) return page.webSocketDebuggerUrl;
    } catch { /* chưa lên */ }
    await sleep(500);
  }
  throw new Error("Không kết nối được CDP của Edge.");
}

const ws = new WebSocket(await cdpTarget());
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let seq = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function send(method, params = {}) {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, (m) => (m.error ? rej(new Error(JSON.stringify(m.error))) : res(m.result)));
    setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + " timeout"))), 60000);
  });
}
async function evaluate(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}
// AUDIT trả JSON string (tránh lỗi serialize object qua CDP).
async function audit() {
  const raw = await evaluate(AUDIT);
  return typeof raw === "string" ? JSON.parse(raw) : raw;
}

await send("Page.enable");
await send("Runtime.enable");

// đăng nhập
await sleep(2500);
await evaluate(`(async()=>{const r=await fetch('/api/system',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return r.status;})()`);
await send("Page.navigate", { url: BASE });
await sleep(6000);

// Điều hướng vào màn hình nhiều bảng để phép đo có ý nghĩa.
const CLICK_BY_TEXT = (label) => `(() => {
  const norm = (s) => String(s||'').replace(/\\s+/g,' ').trim().toLowerCase();
  const want = norm(${JSON.stringify(label)});
  const cands = [...document.querySelectorAll('button, a, .nav-item, .tree-nav *, [role="button"], summary, li')];
  const hit = cands.find((el) => norm(el.textContent) === want) || cands.find((el) => norm(el.textContent).includes(want) && norm(el.textContent).length < want.length + 40);
  if (!hit) return 'NOT_FOUND';
  hit.click();
  return 'CLICKED:' + norm(hit.textContent).slice(0, 40);
})()`;

for (const label of ["Danh mục vật tư gốc", "Quản lý dự án", "Tổ đội"]) {
  try {
    const r = await evaluate(CLICK_BY_TEXT(label));
    console.log(`[nav] ${label} -> ${r}`);
    await sleep(2500);
  } catch (e) { console.log(`[nav] ${label} -> LỖI ${e.message}`); }
}

// Đo trong ngữ cảnh trang
const AUDIT = `(() => {
  const docEl = document.documentElement;
  const out = { viewport: [window.innerWidth, window.innerHeight], scrollRegions: [], overflowX: null, tinyText: 0, blocks: [] };

  // 1) Vùng cuộn: có overflow nhưng thanh cuộn không dùng được / không nhìn thấy
  document.querySelectorAll('.table-wrap, .boq-table-wrap, .matching-table-wrap, .material-subgroup-table-wrap, .staff-table, .dashboard-chart-scroll, .boq-main, .sidebar .tree-nav').forEach((el) => {
    const cs = getComputedStyle(el);
    const canScrollY = el.scrollHeight > el.clientHeight + 2;
    const canScrollX = el.scrollWidth > el.clientWidth + 2;
    if (!canScrollY && !canScrollX) return;
    const oy = cs.overflowY, ox = cs.overflowX;
    const blockedY = canScrollY && (oy === 'hidden' || oy === 'clip' || oy === 'visible');
    const blockedX = canScrollX && (ox === 'hidden' || ox === 'clip' || ox === 'visible');
    const hasBarY = canScrollY && el.offsetWidth - el.clientWidth > 1;
    const hasBarX = canScrollX && el.offsetHeight - el.clientHeight > 1;
    out.scrollRegions.push({
      sel: el.className.split(' ').slice(0,2).join('.') || el.tagName,
      scroll: [canScrollX, canScrollY],
      overflow: [ox, oy],
      scrollbarVisible: [hasBarX, hasBarY],
      blocked: [blockedX, blockedY],
      maxH: cs.maxHeight,
    });
  });

  // 2) Tràn ngang toàn trang (nguyên nhân "không hiển thị hết")
  if (docEl.scrollWidth > window.innerWidth + 2) {
    const culprits = [];
    document.querySelectorAll('*').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > window.innerWidth + 2 && r.height > 0) {
        culprits.push({ tag: el.tagName, cls: String(el.className).split(' ').slice(0,2).join('.'), w: Math.round(r.width) });
      }
    });
    out.overflowX = { page: docEl.scrollWidth, win: window.innerWidth, culprits: culprits.slice(-6) };
  }

  // 3) Chữ quá nhỏ (dấu hiệu phải thu nhỏ để nhét vừa) — ghi rõ phần tử nào
  const tinyMap = new Map();
  document.querySelectorAll('*').forEach((el) => {
    if (el.children.length) return;
    const t = (el.textContent || '').trim();
    if (!t) return;
    const cs = getComputedStyle(el);
    const fs = parseFloat(cs.fontSize);
    if (!fs || fs >= 9) return;
    const view = el.closest('.table-wrap, .card, .stack, .sidebar, .modal, .drawer');
    const key = el.tagName + '.' + String(el.className).split(' ').filter(Boolean).slice(0,2).join('.')
      + ' @' + fs + 'px in ' + (view ? String(view.className).split(' ')[0] : 'body');
    tinyMap.set(key, (tinyMap.get(key) || 0) + 1);
  });
  out.tinyText = [...tinyMap.values()].reduce((a, b) => a + b, 0);
  out.tinyDetail = [...tinyMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12).map(([k, n]) => ({ k, n }));

  // 4) Khối "dính liền": khoảng cách dọc giữa các card liền kề
  const cards = [...document.querySelectorAll('.stack > .card, .stack > section')].slice(0, 12);
  for (let i = 1; i < cards.length; i++) {
    const a = cards[i-1].getBoundingClientRect(), b = cards[i].getBoundingClientRect();
    const gap = Math.round(b.top - a.bottom);
    if (gap >= 0 && gap < 6) out.blocks.push({ gap, a: String(cards[i-1].className).split(' ')[0], b: String(cards[i].className).split(' ')[0] });
  }
  out.gapValues = [...new Set([...document.querySelectorAll('.stack')].map((e) => getComputedStyle(e).gap))];
  return JSON.stringify(out);
})()`;

const results = [];
for (const vp of VIEWPORTS) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.w < 800,
  });
  await sleep(1200);
  let data;
  try { data = await audit(); }
  catch (e) { data = { error: String(e.message) }; }
  results.push({ vp, data });
}

// ---- báo cáo ----
let violations = 0;
console.log("═".repeat(74));
console.log("  GĐ1 — KIỂM TOÁN LAYOUT / SCROLLBAR / RESPONSIVE");
console.log("═".repeat(74));
for (const { vp, data } of results) {
  console.log(`\n▸ ${vp.name}`);
  if (data.error) { console.log("   LỖI: " + data.error); violations++; continue; }
  console.log(`   .stack gap nhận được: ${JSON.stringify(data.gapValues)}`);
  if (data.gapValues && data.gapValues.length > 1) {
    console.log(`   ⚠️  ${data.gapValues.length} giá trị gap khác nhau cho cùng lớp .stack`);
    violations++;
  }
  for (const s of data.scrollRegions) {
    const badY = s.blocked[1], badX = s.blocked[0];
    const noBar = (s.scroll[1] && !s.scrollbarVisible[1]) || (s.scroll[0] && !s.scrollbarVisible[0]);
    if (badY || badX) {
      console.log(`   ❌ ${s.sel}: bị chặn cuộn (overflow=${s.overflow}) scroll=${s.scroll} maxH=${s.maxH}`);
      violations++;
    } else if (noBar) {
      console.log(`   ⚠️  ${s.sel}: cuộn được nhưng KHÔNG thấy thanh cuộn (maxH=${s.maxH})`);
      violations++;
    }
  }
  if (data.overflowX) {
    console.log(`   ❌ TRÀN NGANG: trang ${data.overflowX.page}px > màn ${data.overflowX.win}px`);
    for (const c of (data.overflowX.culprits || [])) console.log(`        ${c.tag}.${c.cls} = ${c.w}px`);
    violations++;
  } else {
    console.log("   ✅ Không tràn ngang");
  }
  if (data.tinyText > 0) {
    console.log(`   ⚠️  ${data.tinyText} phần tử chữ < 9px:`);
    for (const d of (data.tinyDetail || [])) console.log(`        ×${String(d.n).padStart(3)}  ${d.k}`);
    violations++;
  }
  if (data.blocks.length) { console.log(`   ⚠️  ${data.blocks.length} cặp khối dính liền (gap<6px)`); violations++; }
}
console.log("\n" + "═".repeat(74));
console.log(`KẾT LUẬN: ${violations === 0 ? "ĐẠT ✅" : violations + " VI PHẠM ❌"}`);
console.log("Ảnh chụp / profile: " + ART);
console.log("═".repeat(74));

try { ws.close(); } catch {}
try { child.kill(); } catch {}
spawnSync("taskkill", ["/F", "/T", "/PID", String(child.pid)], { stdio: "ignore" });
process.exit(violations === 0 ? 0 : 2);
