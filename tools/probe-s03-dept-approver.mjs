// Probe cuoi: mo modal WF-NHAPKHO (module warehouse_receipt) -> tick loc quyen -> tim nguoi duyet -> doc badge.
import { spawn } from "node:child_process";
import { existsSync, rmSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = "http://127.0.0.1:9000";
const EV = "docs/dsh-mutil-session/SESSION_C/evidence";
mkdirSync(EV, { recursive: true });
const exe = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));
const profile = join(tmpdir(), "cprobe-wf-" + Date.now());
const PORT = 9971;
const child = spawn(exe, ["--headless=new", "--remote-debugging-port=" + PORT, "--user-data-dir=" + profile,
  "--no-first-run", "--disable-gpu", "--window-size=1500,950", BASE], { stdio: "ignore" });

const wsUrl = await (async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const l = await (await fetch("http://127.0.0.1:" + PORT + "/json/list")).json();
      const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl);
      if (p) return p.webSocketDebuggerUrl;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("CDP fail");
})();
const ws = new WebSocket(wsUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
let seq = 0;
const pending = new Map();
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
});
const send = (method, params = {}) => {
  const id = ++seq;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((res, rej) => {
    pending.set(id, (x) => (x.error ? rej(new Error("CDPERR")) : res(x.result)));
    setTimeout(() => { if (pending.has(id)) { pending.delete(id); rej(new Error("TIMEOUT")); } }, 30000);
  });
};
const ev = async (expr) => {
  try {
    const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
    return r.exceptionDetails ? "JSERR" : r.result.value;
  } catch { return "ERR"; }
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = async (name) => {
  try {
    const r = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(EV, name), Buffer.from(r.data, "base64"));
    console.log("  ANH: " + name);
  } catch {}
};
const clickSidebar = (needle) =>
  "(function(){var b=[].slice.call(document.querySelectorAll('.sidebar button')).find(function(x){return String(x.textContent||'').replace(/[\\s\\u2304\\u2303]+$/,'').indexOf(" +
  JSON.stringify(needle) + ")>=0;});if(!b)return 'NO';b.click();return 'OK';})()";

await send("Page.enable");
await send("Runtime.enable");
for (let i = 0; i < 40; i++) { if ((await ev("document.readyState==='complete'")) === true) break; await sleep(500); }
for (let a = 0; a < 3; a++) {
  const st = await ev("(async function(){try{var r=await fetch('/api/system',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:'admin',password:'Admin123456@'})});return r.status;}catch(e){return 0;}})()");
  if (st === 200) break;
  await sleep(1500);
}
await send("Page.navigate", { url: BASE });
for (let i = 0; i < 60; i++) { if ((await ev("!!document.querySelector('.sidebar')")) === true) break; await sleep(700); }
await sleep(3200);

console.log("  buoc1 nhom: " + (await ev(clickSidebar("QUẢN TRỊ HỆ THỐNG"))));
await sleep(1800);
console.log("  buoc2 muc : " + (await ev(clickSidebar("Danh mục"))));
await sleep(3000);
await ev("(function(){var b=[].slice.call(document.querySelectorAll('button,[role=tab]')).find(function(x){return /Workflow phê duyệt/i.test(String(x.textContent||''));});if(b)b.click();return 'ok';})()");
await sleep(2800);

const openCard = "(function(){var btns=[].slice.call(document.querySelectorAll('button')).filter(function(b){return /^Sửa$/.test(String(b.textContent||'').trim());});" +
  "for(var i=0;i<btns.length;i++){var p=btns[i];for(var k=0;k<6&&p;k++){p=p.parentElement;if(!p)break;var t=String(p.textContent||'');" +
  "var codes=(t.match(/WF-[A-Z0-9-]+/g)||[]).length;if(codes===1&&/Quy trình nhập kho/i.test(t)){btns[i].click();return 'OK k='+k;}if(codes>1)break;}}return 'KHONG';})()";
console.log("  mo the NHAPKHO: " + (await ev(openCard)));
await sleep(3000);
console.log("  tieu de modal: " + JSON.stringify(await ev("[].slice.call(document.querySelectorAll('.modal h1,.modal h2,.modal h3,.modal-title')).map(function(x){return String(x.textContent||'').trim().slice(0,60);})")));

const tick = "(function(){var cs=[].slice.call(document.querySelectorAll('input[type=checkbox]'));var c=cs.find(function(x){var l=x.closest('label');return /Chỉ hiện người có quyền duyệt/i.test(String(l?l.textContent:''));});" +
  "if(!c)return 'KHONG_CHECKBOX';if(!c.checked)c.click();return c.checked?'DA_TICK':'CHUA_TICK';})()";
console.log("  tick loc quyen: " + (await ev(tick)));
await sleep(1500);

const typeIn = "(function(){var ins=[].slice.call(document.querySelectorAll('input')).filter(function(i){return /Ví dụ: Nguyễn/i.test(String(i.placeholder||''));});" +
  "if(!ins.length)return 'KHONG_O';var setter=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;var n=0;" +
  "ins.forEach(function(t){setter.call(t,'073196');t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));n++;});return 'DA_NHAP '+n;})()";
console.log("  nhap tim (native setter): " + (await ev(typeIn)));
await sleep(2500);

const readBlock = "(function(){var ins=[].slice.call(document.querySelectorAll('input')).filter(function(i){return /Ví dụ: Nguyễn/i.test(String(i.placeholder||''));});" +
  "if(!ins.length)return '(khong co o)';var p=ins[0];for(var k=0;k<5&&p;k++){p=p.parentElement;if(p&&/quyền duyệt/i.test(String(p.textContent||'')))return String(p.textContent||'').replace(/\\s+/g,' ').slice(0,260);}return '(khong thay khoi)';})()";
console.log("  khoi buoc 1: " + JSON.stringify(await ev(readBlock)));

const badges = await ev("[].slice.call(document.querySelectorAll('b')).map(function(b){return String(b.textContent||'').trim();}).filter(function(t){return /quyền duyệt/.test(t);})");
console.log("  BADGE: " + JSON.stringify(badges));
const arr = Array.isArray(badges) ? badges : [];
console.log("  TONG: Co = " + arr.filter((b) => b === "Có quyền duyệt").length + " | Chua = " + arr.filter((b) => b === "Chưa có quyền duyệt").length);

// ⭐ CUON toi ket qua roi moi chup (⚠️ lan dau chup khong cuon ⇒ anh KHONG thay badge ⇒ bang chung vo dung)
const scrolled = await ev("(function(){var b=[].slice.call(document.querySelectorAll('b')).find(function(x){return /quyền duyệt/.test(String(x.textContent||''));});" +
  "if(!b)return 'KHONG_THAY_BADGE';b.scrollIntoView({block:'center'});return 'DA_CUON';})()");
console.log("  cuon toi ket qua: " + scrolled);
await sleep(1200);
// ⭐ VE o sang BOX quanh ket qua de anh lam bang chung RO RANG
await ev("(function(){var b=[].slice.call(document.querySelectorAll('b')).find(function(x){return /quyền duyệt/.test(String(x.textContent||''));});" +
  "if(!b)return 'no';var box=b.closest('div')||b.parentElement;if(box){box.style.outline='3px solid #d40000';box.style.background='#fff6f6';}return 'ok';})()");
await sleep(600);
await shot("BUG-C13-3-badge-NHAPKHO-073196.png");
try { ws.close(); } catch {}
try { child.kill(); } catch {}
try { rmSync(profile, { recursive: true, force: true }); } catch {}
