#!/usr/bin/env node
/** Soi cấu trúc DOM thật của panel hồ sơ nhân sự để tìm vì sao thiếu chữ. */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const URL_ = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";
const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync);
const profile = resolve(process.env.TEMP || ".", "vntech-artifacts", "probe-dbg");
rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const PORT = 9357;
const b = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--window-size=1600,1200", "about:blank"], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function target() {
  for (let i = 0; i < 40; i++) { try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const p = list.find((x) => x.type === "page"); if (p?.webSocketDebuggerUrl) return p;
  } catch {} await sleep(500); } throw new Error("no cdp");
}
const t = await target();
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
let seq = 0; const pending = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const send = (method, params = {}) => new Promise((res) => { const my = ++seq; pending.set(my, res); ws.send(JSON.stringify({ id: my, method, params })); });
const ev = async (x) => (await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable"); await send("Runtime.enable");
await send("Page.navigate", { url: URL_ }); await sleep(7000);
await ev(`(()=>{const i=[...document.querySelectorAll('input')];const u=i.find(x=>x.type!=='password'),p=i.find(x=>x.type==='password');const s=Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set;s.call(u,${JSON.stringify(USER)});u.dispatchEvent(new Event('input',{bubbles:true}));s.call(p,${JSON.stringify(PASS)});p.dispatchEvent(new Event('input',{bubbles:true}));const b=[...document.querySelectorAll('button')].find(x=>/đăng nhập/i.test(x.innerText||''));b&&b.click();return 1})()`);
await sleep(10000);
await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="system_admin"]');if(!g)return 0;const p=g.querySelector('.nav-parent');if(p.getAttribute('aria-expanded')==='false')p.click();return 1})()`);
await sleep(900);
await ev(`(()=>{const g=document.querySelector('.nav-tree-group[data-nav-group="system_admin"]');const c=[...g.querySelectorAll('.nav-child')].find(x=>/phân quyền/i.test(x.innerText||''));if(c){c.click();return 1}return 0})()`);
await sleep(3500);
await ev(`(()=>{const b=[...document.querySelectorAll('.permission-steps button')][0];if(b)b.click();return 1})()`);
await sleep(2000);
await ev(`(()=>{const b=document.querySelector('.admin-mini-list button');if(b){b.click();return 1}return 0})()`);
await sleep(2500);

console.log("số .modal-body :", await ev(`document.querySelectorAll('.modal-body').length`));
console.log("số .modal      :", await ev(`document.querySelectorAll('.modal').length`));
console.log("số .card trong modal:", await ev(`document.querySelectorAll('.modal .card').length`));
console.log("số bảng trong modal :", await ev(`document.querySelectorAll('.modal table').length`));
console.log("số <tr> trong modal :", await ev(`document.querySelectorAll('.modal tbody tr').length`));
console.log("số <th> trong modal :", await ev(`document.querySelectorAll('.modal th').length`));
console.log("");
console.log("--- innerText của từng .modal-body ---");
console.log(await ev(`[...document.querySelectorAll('.modal-body')].map((e,i)=>i+': len='+e.innerText.length+' | display='+getComputedStyle(e).display).join('\\n')`));
console.log("");
console.log("--- innerText .modal (500 đầu) ---");
console.log(String(await ev(`document.querySelector('.modal').innerText`)).slice(0, 500));
console.log("");
console.log("--- HTML vùng bảng đầu tiên (900 ký tự) ---");
console.log(String(await ev(`(()=>{const t=document.querySelector('.modal .table-wrap');return t?t.outerHTML.slice(0,900):'(không có .table-wrap)'})()`)));
console.log("");
console.log("--- HTML .modal 700 ký tự đầu ---");
console.log(String(await ev(`document.querySelector('.modal').outerHTML.slice(0,700)`)));
ws.close(); b.kill();
