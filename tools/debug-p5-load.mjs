#!/usr/bin/env node
/** Chẩn đoán: trang có hydrate được không, lỗi console là gì. */
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const URL_ = process.argv[2] || "http://127.0.0.1:9000";
const EDGE = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find(existsSync);
const profile = join(tmpdir(), "vntech-artifacts", "dbg-p5-load");
rmSync(profile, { recursive: true, force: true }); mkdirSync(profile, { recursive: true });
const PORT = 9363;
const b = spawn(EDGE, ["--headless=new", "--disable-gpu", "--no-sandbox", "--no-first-run",
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--window-size=1400,1000", "about:blank"], { stdio: "ignore" });
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
let seq = 0; const pending = new Map(); const logs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  if (m.method === "Runtime.consoleAPICalled")
    logs.push(`[${m.params.type}] ` + (m.params.args || []).map((a) => a.value ?? a.description ?? "").join(" ").slice(0, 260));
  if (m.method === "Runtime.exceptionThrown")
    logs.push("[EXC] " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text || "").slice(0, 400));
  if (m.method === "Log.entryAdded" && m.params.entry.level === "error")
    logs.push("[log] " + String(m.params.entry.text).slice(0, 260));
  if (m.method === "Network.loadingFailed")
    logs.push("[net-fail] " + m.params.errorText + " " + (m.params.type || ""));
};
const send = (method, params = {}) => new Promise((res) => { const my = ++seq; pending.set(my, res); ws.send(JSON.stringify({ id: my, method, params })); });
const ev = async (x) => (await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;

await send("Page.enable"); await send("Runtime.enable"); await send("Log.enable"); await send("Network.enable");
await send("Page.navigate", { url: URL_ }); await sleep(14000);
console.log("=== trạng thái trang ===");
console.log("  có .brand (React đã mount):", await ev(`!!document.querySelector('.brand')`));
console.log("  có form login            :", await ev(`!!document.querySelector('input[type="password"]')`));
console.log("  số <script>              :", await ev(`document.querySelectorAll('script').length`));
console.log("  body 400 ký tự đầu       :", String(await ev(`document.body.innerText`)).slice(0, 400).replace(/\n+/g, " | "));
console.log("  API trong trang          :", JSON.stringify(await ev(`(async()=>{try{const r=await fetch('/api/system');return {status:r.status,head:(await r.text()).slice(0,90)}}catch(e){return{err:String(e)}}})()`)));
console.log("\n=== log trình duyệt (tối đa 20) ===");
logs.slice(0, 20).forEach((l) => console.log("  " + l));
if (!logs.length) console.log("  (không có log)");
ws.close(); b.kill();
