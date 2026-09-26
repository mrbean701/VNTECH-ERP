// Chẩn đoán: vì sao cổng ảnh không kết nối được CDP của Edge?
//
// Cổng ảnh spawn Edge với `stdio: "ignore"` nên mọi lỗi khởi động của Edge bị nuốt mất, và
// triệu chứng duy nhất nhìn thấy là "Không kết nối được CDP của Edge" — không phân biệt được:
//   (a) Edge không chạy được (thiếu quyền / bị chặn),
//   (b) Edge chạy nhưng cổng debug không mở,
//   (c) fetch tới 127.0.0.1:<port> bị chặn.
// Script này tách bạch 3 khả năng đó: ghi stderr/stdout của Edge ra TỆP (không dùng pipe),
// in mã thoát/ tín hiệu, và thử lại nhiều cổng.
//
// Chạy: node tools/diag-edge-cdp.mjs
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, openSync, closeSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));

if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }
console.log(`Edge: ${EDGE}`);

const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PORT = 9500 + Math.floor(Math.random() * 300);
const logPath = join(ART, `edge-diag-${Date.now()}.log`);
const profile = join(ART, `edge-diag-profile-${Date.now()}`);
const fd = openSync(logPath, "w");   // TỆP, không phải pipe

console.log(`Cổng CDP thử: ${PORT}`);
console.log(`Tệp log của Edge: ${logPath}\n`);

const child = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--window-size=1920,1080", "http://127.0.0.1:9000",
], { stdio: ["ignore", fd, fd], detached: false });

let exited = null;
child.on("exit", (code, signal) => { exited = { code, signal }; });
child.on("error", (e) => { exited = { error: String(e && e.message || e) }; });

// (b)+(c): cổng debug có mở không, và fetch localhost có tới được không?
let cdp = null, lastErr = null;
for (let i = 0; i < 40; i++) {
  if (exited) break;
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/version`);
    if (r.ok) { cdp = await r.json(); break; }
    lastErr = `HTTP ${r.status}`;
  } catch (e) { lastErr = String(e && e.message || e); }
  await sleep(500);
}

console.log("=== KẾT QUẢ ===");
if (cdp) {
  console.log("  (b)+(c) OK — CDP TRẢ LỜI ĐƯỢC:");
  console.log(`     Browser : ${cdp.Browser}`);
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
    const pages = list.filter((t) => t.type === "page");
    console.log(`     Trang   : ${pages.length} (cần >= 1 để cổng ảnh chạy)`);
    for (const p of pages.slice(0, 3)) console.log(`       - ${p.url}`);
  } catch (e) { console.log(`     ! /json/list lỗi: ${e.message}`); }
} else {
  console.log(`  (b)+(c) THẤT BẠI — không lấy được CDP. Lỗi cuối: ${lastErr}`);
  console.log(`  Tiến trình Edge: ${exited ? JSON.stringify(exited) : "vẫn đang chạy nhưng không mở cổng"}`);
}

try { child.kill(); } catch { /* bỏ qua */ }
closeSync(fd);

const log = existsSync(logPath) ? readFileSync(logPath, "utf8").trim() : "";
console.log(`\n=== LOG CỦA EDGE (${log ? log.split("\n").length : 0} dòng) ===`);
console.log(log ? log.split("\n").slice(-15).join("\n") : "(rỗng — Edge không ghi gì)");
