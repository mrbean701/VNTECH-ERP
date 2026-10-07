// USER 28/09/2026 — Liệt kê NGUYÊN VĂN mọi mục điều hướng (dùng làm danh sách để quét layout).
//
// ⚠️ 5 BÀI HỌC ĐÃ MẮC (ghi lại để không lặp):
//   ① heredoc PowerShell làm MẤT tiếng Việt ⇒ viết file bằng tool `write`, ⛔ không Set-Content
//   ② `:8787` / `:9000` có thể CHẾT ⇒ phải kiểm tra PORT trước, không kết luận giao diện hỏng
//   ③ đăng nhập bằng `fetch` rồi `Page.navigate` — GIỮ ĐÚNG thứ tự như probe đã chạy được
//   ④ ⛔ KHÔNG tự đổi selector đã biết là chạy được (`.sidebar button.nav-parent`)
//   ⑤ sidebar là ACCORDION: nhóm đang mở thì bấm lần nữa lại ĐÓNG ⇒ thử tối đa 2 lần/nhóm
import { spawn } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const exe = ["C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"].find((p) => existsSync(p));
if (!exe) { console.error("  [BLOCKED] khong tim thay Edge"); process.exit(2); }
const profile = join(tmpdir(), "vntech-nav2", `e-${Date.now()}`);
const PORT = 8600 + Math.floor(Math.random() * 25);
const child = spawn(exe, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  "--no-first-run", "--no-default-browser-check", "--disable-gpu", "--window-size=1586,761", BASE], { stdio: "ignore" });
process.on("exit", () => { try { child.kill(); } catch {} try { rmSync(profile, { recursive: true, force: true }); } catch {} });

let ws;
try {
  const u = await (async () => { for (let i = 0; i < 80; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); const p = l.find((t) => t.type === "page" && t.webSocketDebuggerUrl); if (p) return p.webSocketDebuggerUrl; } catch {} await sleep(500); } throw new Error("no CDP"); })();
  ws = new WebSocket(u); await new Promise((r) => ws.addEventListener("open", r, { once: true }));
  let s = 0; const p = new Map();
  ws.addEventListener("message", (e) => { const m = JSON.parse(e.data); if (m.id && p.has(m.id)) { p.get(m.id)(m); p.delete(m.id); } });
  const send = (me, pa = {}) => { const id = ++s; ws.send(JSON.stringify({ id, method: me, params: pa })); return new Promise((r, j) => { p.set(id, (x) => (x.error ? j(new Error("e")) : r(x.result))); setTimeout(() => p.has(id) && (p.delete(id), j(new Error("t"))), 60000); }); };
  const ev = async (e) => (await send("Runtime.evaluate", { expression: e, returnByValue: true, awaitPromise: true })).result.value;
  const wf = async (e, ms = 30000) => { const t = Date.now(); while (Date.now() - t < ms) { try { if (await ev(e)) return true; } catch {} await sleep(300); } return false; };

  await send("Page.enable"); await send("Runtime.enable");
  await wf(`document.readyState==="complete" && !!document.body`, 30000);
  const login = await ev(`(async()=>{const r=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"login",username:"admin",password:"Admin123456@"})});return await r.text();})()`);
  console.log("  dang nhap: " + String(login).slice(0, 44));
  await send("Page.navigate", { url: BASE });
  const ok = await wf(`!!document.querySelector(".sidebar button.nav-parent")`, 30000);
  if (!ok) {
    const d = await ev(`({n:document.querySelectorAll("button").length,t:document.title,txt:String(document.body.innerText||"").replace(/\\s+/g," ").trim().slice(0,110)})`);
    console.log("  KHONG VAO DUOC MAN CHINH · nut=" + d.n + " · " + d.t + " · " + d.txt);
    process.exit(1);
  }
  console.log("  MAN CHINH: OK");
  const n = await ev(`document.querySelectorAll(".sidebar button.nav-parent").length`);
  console.log("  SO NHOM CHA: " + n);
  const all = new Set();
  for (let g = 0; g < n; g++) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const before = await ev(`document.querySelectorAll(".sidebar button").length`);
      await ev(`(()=>{const b=document.querySelectorAll(".sidebar button.nav-parent")[${g}];if(b)b.click();})()`);
      await sleep(480);
      const after = await ev(`document.querySelectorAll(".sidebar button").length`);
      if (after > before) {
        // ⚠️ BÀI HỌC 6: ⛔ KHÔNG truyền hàm trực tiếp cho `.map(nn)` —
        //    Array.map gọi (value, index, array) ⇒ `nn` nhận nhầm index nên trả sai.
        //    ⇒ LUÔN bọc: `.map((x) => nn(x))`
        const kids = await ev(`(()=>{const nn=s=>String(s||"").replace(/\\s+/g," ").trim();
          return [...document.querySelectorAll(".sidebar button")].filter(x=>!x.classList.contains("nav-parent")).map((x)=>nn(x.textContent));})()`);
        kids.forEach((k) => all.add(k));
        break;
      }
    }
  }
  const list = [...all].filter(Boolean);
  for (const k of list) console.log("  - " + k);
  console.log("  TONG SO MUC: " + list.length);
  process.exit(0);
} catch (e) { console.log("  LOI: " + e.message); process.exit(1); }
finally { try { ws?.close(); } catch {} }
