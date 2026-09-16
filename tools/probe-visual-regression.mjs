// GĐ0 — CỔNG CHẶN HỒI QUY THỊ GIÁC
//
// Chụp từng màn hình ở 4 kích thước bằng trình duyệt THẬT (Edge headless qua CDP),
// rồi so điểm ảnh với ảnh chuẩn. Dùng để chứng minh GĐ0–GĐ3 KHÔNG đổi hình thức.
//
//   node tools/probe-visual-regression.mjs                 # so với ảnh chuẩn
//   node tools/probe-visual-regression.mjs --update        # chụp lại ảnh chuẩn
//   node tools/probe-visual-regression.mjs --selftest      # đo "nhiễu nền": chụp 2 lần rồi so
//   node tools/probe-visual-regression.mjs --max-diff-pixels=100
//   node tools/probe-visual-regression.mjs --max-diff-pixels=0     # nghiêm ngặt tuyệt đối
//   node tools/probe-visual-regression.mjs --only=03-work
//   node tools/probe-visual-regression.mjs --locate=1705,29        # phần tử tại toạ độ
//   node tools/probe-visual-regression.mjs --crop=1685,15,50,50    # soi 1 vùng, phóng to 3×
//
// Ngưỡng mặc định 2 px = sàn nhiễu đo được của trình duyệt (xem chú thích ở MAX_DIFF_PIXELS).
//
// Vì sao có bộ giải mã PNG tự viết: dự án KHÔNG có thư viện ảnh nào (không sharp/pngjs/
// pixelmatch). Chỉ có `fflate` nên ta tự bóc PNG (inflate + gỡ filter) rồi so từng điểm ảnh.
//
// Ảnh chuẩn nằm ở tools/baseline/ — mỗi màn × mỗi kích thước một tệp PNG.
import { spawn } from "node:child_process";
import { mkdirSync, existsSync, readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { unzlibSync } from "fflate";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_DIR = join(ROOT, "tools", "baseline");
const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const USER = process.env.PROBE_USER || "admin";
const PASS = process.env.PROBE_PASS || "Admin123456@";

const args = process.argv.slice(2);
const hasFlag = (f) => args.includes(f);
const argValue = (f) => { const a = args.find((x) => x.startsWith(f + "=")); return a ? a.slice(f.length + 1) : null; };

const MODE_UPDATE = hasFlag("--update");
const MODE_SELFTEST = hasFlag("--selftest");
// Ngưỡng mặc định = 2 điểm ảnh — ĐÃ ĐO bằng --selftest, không phải phỏng đoán.
//
// Bằng chứng (sau khi loại ký tự số của các bộ đếm dữ liệu ở FREEZE_CSS):
//   03-work : desktop · laptop · tablet · phone = 0 px
//   07-admin: desktop = 2 px — vùng 203×1 tại (22,824); ba kích thước còn lại = 0 px
//   --locate=120,824 → <BUTTON class="sidebar-collapse-toggle"> rect=22,798,203,34
//   ⇒ 2 điểm ảnh nằm ở HAI MÉP của nút: viền bo góc được vẽ lệch dưới một điểm ảnh.
//     Không phải lệch bố cục, không phải đổi nội dung.
//
// Vì sao đặt mặc định bằng sàn nhiễu: đây là nhiễu của CHÍNH TRÌNH DUYỆT, không phải của sản
// phẩm. Hồi quy THẬT nhỏ nhất từng gặp trong dự án đã là 405 px, nên ngưỡng 2 px vẫn bắt được
// mọi thay đổi hình thức có ý nghĩa. (Nâng ngưỡng lên 21 px để né huy hiệu đếm sẽ bỏ lọt lỗi
// nhỏ — nên huy hiệu đã được loại trừ riêng, còn ngưỡng giữ ở mức sàn nhiễu.)
// Muốn nghiêm ngặt tuyệt đối: --max-diff-pixels=0
const MAX_DIFF_PIXELS = Number(argValue("--max-diff-pixels") ?? 2);
const ONLY = argValue("--only");
const LOCATE = argValue("--locate"); // "x,y" — in ra chồng phần tử tại toạ độ đó
const CROP = argValue("--crop");     // "x,y,w,h" — chụp 2 lần vùng này, phóng to, ghi ra tệp để soi

// ---------- Bộ giải mã PNG (8-bit, không xen kẽ) ----------
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("Không phải tệp PNG.");
  let off = 8, width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  const idat = [];
  while (off < buf.length - 8) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString("latin1", off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === "IDAT") idat.push(data);
    else if (type === "IEND") break;
    off += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`PNG bitDepth=${bitDepth}, chỉ hỗ trợ 8.`);
  if (interlace !== 0) throw new Error("PNG xen kẽ (interlaced) không được hỗ trợ.");
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  if (!channels) throw new Error(`PNG colorType=${colorType} không được hỗ trợ.`);

  // IDAT của PNG là zlib (2 byte đầu 78xx) — phải dùng unzlibSync.
  // `inflateSync` chỉ nhận raw deflate nên trả về dữ liệu rác (đã kiểm chứng:
  // 62.748 byte thay vì 6.221.880 byte, filter byte đầu là 147 vô lệ).
  const raw = unzlibSync(new Uint8Array(Buffer.concat(idat)));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let pos = 0;
  for (let y = 0; y < height; y++) {
    const ft = raw[pos++];
    const line = raw.subarray(pos, pos + stride); pos += stride;
    const cur = out.subarray(y * stride, (y + 1) * stride);
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev ? prev[x] : 0;
      const c = prev && x >= channels ? prev[x - channels] : 0;
      let v = line[x];
      if (ft === 1) v = (v + a) & 255;
      else if (ft === 2) v = (v + b) & 255;
      else if (ft === 3) v = (v + ((a + b) >> 1)) & 255;
      else if (ft === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        v = (v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      } else if (ft !== 0) throw new Error(`Filter type ${ft} không hợp lệ.`);
      cur[x] = v;
    }
  }
  return { width, height, channels, data: out };
}

// ---------- So sánh hai ảnh ----------
// tolerance: sai lệch kênh tối đa được bỏ qua (mặc định 0 = nghiêm ngặt tuyệt đối).
export function diffImages(a, b, tolerance = 0, cellSize = 64) {
  if (a.width !== b.width || a.height !== b.height) {
    return { sizeMismatch: true, a: [a.width, a.height], b: [b.width, b.height] };
  }
  const { width, height, channels } = a;
  let diffPixels = 0;
  let minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
  const cells = new Map();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      let differs = false;
      for (let ch = 0; ch < Math.min(channels, 3); ch++) {
        if (Math.abs(a.data[i + ch] - b.data[i + ch]) > tolerance) { differs = true; break; }
      }
      if (!differs) continue;
      diffPixels++;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      const key = `${Math.floor(x / cellSize)},${Math.floor(y / cellSize)}`;
      cells.set(key, (cells.get(key) || 0) + 1);
    }
  }
  const total = width * height;
  const top = [...cells.entries()]
    .sort((p, q) => q[1] - p[1]).slice(0, 8)
    .map(([k, n]) => { const [cx, cy] = k.split(",").map(Number); return { x: cx * cellSize, y: cy * cellSize, px: n }; });
  return {
    sizeMismatch: false,
    width, height, total,
    diffPixels,
    diffPercent: total ? (diffPixels / total) * 100 : 0,
    bbox: maxX >= 0 ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : null,
    topCells: top,
  };
}

// ---------- 4 kích thước màn hình ----------
const VIEWPORTS = [
  { id: "desktop", name: "1920×1080 desktop", w: 1920, h: 1080 },
  { id: "laptop",  name: "1366×768  laptop",  w: 1366, h: 768  },
  { id: "tablet",  name: "768×1024  tablet",  w: 768,  h: 1024 },
  { id: "phone",   name: "390×844   phone",   w: 390,  h: 844  },
];

// ---------- Màn hình chụp ----------
// steps: bung nhóm menu [data-nav-group] rồi bấm .nav-child theo chỉ số.
// Điều hướng lấy đúng theo mẫu đã kiểm chứng trong các probe đang ĐẠT.
const SCREENS = [
  { id: "01-dashboard", label: "Tổng quan điều hành", steps: [] },
  { id: "02-project",   label: "Quản lý dự án",       steps: [{ group: "site_command",  child: 0 }] },
  { id: "03-work",      label: "Công việc",           steps: [{ group: "my_work",       child: 0 }] },
  { id: "04-team",      label: "Tổ đội",              steps: [{ group: "teams",         child: 0 }] },
  { id: "05-material",  label: "Danh mục vật tư gốc", steps: [{ group: "material_master", child: 0 }] },
  { id: "06-warehouse", label: "Kho Tổng",            steps: [{ group: "warehouse",     child: 0 }] },
  { id: "07-admin",     label: "Danh mục & phân quyền", steps: [{ group: "system_admin", child: 0 }] },
];

const SCREENS_TO_RUN = ONLY ? SCREENS.filter((s) => s.id.includes(ONLY)) : SCREENS;
if (!SCREENS_TO_RUN.length) { console.error(`--only=${ONLY} không khớp màn nào.`); process.exit(1); }

// ---------- Trình duyệt ----------
const EDGE = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].find((p) => existsSync(p));
if (!EDGE) { console.error("Không tìm thấy Microsoft Edge."); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9500 + Math.floor(Math.random() * 300);
const ART = join(tmpdir(), "vntech-artifacts");
mkdirSync(ART, { recursive: true });
mkdirSync(BASELINE_DIR, { recursive: true });

const profile = join(ART, `edge-vr-${Date.now()}`);
const child = spawn(EDGE, [
  "--headless=new", `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`, "--no-first-run", "--no-default-browser-check",
  "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
  "--window-size=1920,1080", BASE,
], { stdio: "ignore", detached: false });

async function cdpTarget() {
  for (let i = 0; i < 80; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const page = (await r.json()).find((t) => t.type === "page" && t.webSocketDebuggerUrl);
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
    setTimeout(() => pending.has(id) && (pending.delete(id), rej(new Error(method + " timeout"))), 90000);
  });
}
async function evaluate(expr) {
  const r = await send("Runtime.evaluate", { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description || ""));
  return r.result.value;
}

// Đóng băng hoạt ảnh + ẩn con trỏ nháy để ảnh chụp có tính tất định.
// CHỈ tiêm trong lúc đo — không đụng vào sản phẩm.
//
// HAI PHẦN TỬ ĐƯỢC LOẠI TRỪ CÓ CHỦ Ý (không phải che lỗi):
//   .theme-switch — nút đổi sáng/tối (icon ☀☾). Trạng thái hiển thị phụ thuộc chế độ
//                   màu đã dò/đã lưu nên KHÁC NHAU giữa các lần nạp trang.
//   .user-menu    — khối người dùng ở topbar (avatar gradient + tên + vai trò).
//
// Bằng chứng loại trừ (tools/probe-visual-regression.mjs --crop=1600,15,320,60):
//   hai lần chụp CÙNG một màn vẫn lệch đúng 1001 px tại vùng trang (1619,27) 274×27,
//   với các cặp màu #fffff4/#0c2e9c/#0c89d3 (icon vàng & xanh đậm) đổi thành xám
//   #f9fafb/#4c657e/#8798a9 — tức là ĐỔI TRẠNG THÁI CHỦ ĐỀ, không phải lệch bố cục.
//   Trong khi đó 27/28 ảnh còn lại lệch 0 px.
// Dùng `visibility:hidden` (KHÔNG dùng `display:none`) để giữ nguyên bố cục topbar.
//
// BA BỘ ĐẾM DỮ LIỆU SỐNG — LOẠI TRỪ KÝ TỰ SỐ, KHÔNG LOẠI TRỪ PHẦN TỬ:
//   .nav-parent b     — số đếm của nhóm menu (vd "CÔNG VIỆC 7")
//   .nav-child b      — số đếm của từng mục menu
//   .notify-button b  — số thông báo ở topbar (vd "7")
//
// Vì sao: đây là SỐ ĐẾM SINH RA TỪ DỮ LIỆU, không phải hình thức. Cổng này đo HÌNH THỨC,
// nên chỉ cần một công việc đổi trạng thái là con số đổi và cổng báo lỗi giả — đúng như
// lần 28/28 ảnh lệch khi PHASE 0B tạo dữ liệu kiểm chứng (xem drizzle/0103).
//
// Bằng chứng đo được (node tools/probe-visual-regression.mjs --only=03-work --selftest):
//   desktop = 21 px nhiễu, vùng 6×7 tại (1702,26); laptop/tablet/phone = 0 px.
//   --locate=1705,29 → <B> rect=1696,21,18,18 "7" nằm trong <BUTTON .notify-button>.
//   --crop=1685,15,50,50 → cặp màu #ef2f8a→#f36464 · #fbf2ff→#fee9e9 · #f42f2f→#f25a5a
//   tức chữ số được VẼ KHÁC ĐI giữa hai lần chụp CÙNG dữ liệu (khử răng cưa ở vị trí lệch
//   dưới một điểm ảnh), KHÔNG phải số đổi giá trị và KHÔNG phải lệch bố cục.
//   ⇒ Nếu cứ chụp lại ảnh chuẩn thì đóng băng luôn sự bất định và cổng mất khả năng bắt lỗi nhỏ.
//
// Chỉ ẩn KÝ TỰ SỐ trong các bộ đếm: nút, nền, biểu tượng và bố cục vẫn được đối chiếu bình
// thường — không giấu lỗi giao diện nào.
const FREEZE_CSS = `*{animation:none!important;transition:none!important;caret-color:transparent!important;}
html{scroll-behavior:auto!important}
.theme-switch,.user-menu{visibility:hidden!important}
.nav-parent b,.nav-child b,.notify-button b{visibility:hidden!important}`;

async function freeze() {
  await evaluate(`(()=>{let s=document.getElementById('__vr_freeze');if(!s){s=document.createElement('style');s.id='__vr_freeze';document.head.appendChild(s);}s.textContent=${JSON.stringify(FREEZE_CSS)};window.scrollTo(0,0);document.querySelectorAll('.table-wrap,.stack,.main,.content').forEach(e=>{e.scrollTop=0;e.scrollLeft=0;});return 1;})()`);
  await sleep(400);
}

async function clickSteps(steps) {
  for (const st of steps) {
    const expand = await evaluate(`(()=>{const s=document.querySelector('[data-nav-group="${st.group}"]');if(!s)return 'NO_GROUP';
      const p=s.querySelector('.nav-parent');if(p&&p.getAttribute('aria-expanded')==='false')p.click();return 'OK';})()`);
    if (expand !== "OK") return expand;
    await sleep(700);
    const clicked = await evaluate(`(()=>{const s=document.querySelector('[data-nav-group="${st.group}"]');if(!s)return 'NO_GROUP';
      const kids=[...s.querySelectorAll('.nav-child')];
      // Nhóm chỉ có 1 module được render thành LIÊN KẾT TRỰC TIẾP (không có .nav-child)
      // ví dụ material_master. Khi đó phải bấm chính .nav-parent, nếu không ảnh chụp
      // sẽ là màn cũ chứ không phải màn đích.
      if(!kids.length){const p=s.querySelector('.nav-parent')||s.querySelector('button,a');if(!p)return 'NO_TARGET';
        p.click();return 'DIRECT:'+(p.innerText||'').replace(/\\s+/g,' ').trim().slice(0,40);}
      const k=kids[${st.child}];if(!k)return 'NO_CHILD('+kids.length+')';
      k.click();return 'CLICKED:'+(k.innerText||'').replace(/\\s+/g,' ').trim().slice(0,40);})()`);
    if (!clicked.startsWith("CLICKED") && !clicked.startsWith("DIRECT")) return clicked;
    await sleep(2200);
  }
  return "OK";
}

async function capture(screen, vp) {
  await send("Emulation.setDeviceMetricsOverride", {
    width: vp.w, height: vp.h, deviceScaleFactor: 1, mobile: vp.id === "phone",
  });
  await send("Page.navigate", { url: BASE });
  await sleep(5200);
  const nav = await clickSteps(screen.steps);
  await freeze();
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  return { png: Buffer.from(shot.data, "base64"), nav };
}

console.log("═".repeat(78));
console.log(`  CỔNG CHẶN HỒI QUY THỊ GIÁC${MODE_UPDATE ? "  [CHỤP ẢNH CHUẨN]" : MODE_SELFTEST ? "  [ĐO NHIỄU NỀN]" : ""}`);
console.log(`  ${SCREENS_TO_RUN.length} màn × ${VIEWPORTS.length} kích thước = ${SCREENS_TO_RUN.length * VIEWPORTS.length} ảnh`);
if (!MODE_UPDATE && !MODE_SELFTEST) console.log(`  Ngưỡng cho phép: ${MAX_DIFF_PIXELS} điểm ảnh lệch`);
console.log("═".repeat(78));

await send("Page.enable");
await send("Runtime.enable");
// Cố định chế độ màu: `.theme-switch` và `.user-menu` trong topbar đổi hình theo
// prefers-color-scheme, nên nếu không ghim thì 2 nút này lệch nhau giữa các lần chụp.
await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "light" }] });
await sleep(2000);

// đăng nhập
const loginStatus = await evaluate(`(async()=>{const r=await fetch('/api/system',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'login',username:${JSON.stringify(USER)},password:${JSON.stringify(PASS)}})});return r.status;})()`);
console.log(`  Đăng nhập ${USER}: HTTP ${loginStatus}`);

// Chế độ soi vùng: chụp 2 lần CÙNG một vùng rồi ghi ảnh phóng to để xem bằng mắt.
// Dùng khi cổng so ảnh báo lệch mà không rõ phần tử nào gây ra.
if (CROP) {
  const [cx, cy, cw, ch] = CROP.split(",").map(Number);
  const outDir = join(ROOT, "tools", "_diff");
  mkdirSync(outDir, { recursive: true });
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  const screen = SCREENS_TO_RUN[0];
  const shots = [];
  for (let i = 0; i < 2; i++) {
    await send("Page.navigate", { url: BASE });
    await sleep(5200);
    if (screen) { const nav = await clickSteps(screen.steps); if (i === 0) console.log(`  nav ${screen.id}: ${nav}`); await sleep(2200); }
    await freeze();
    const s = await send("Page.captureScreenshot", {
      format: "png", clip: { x: cx, y: cy, width: cw, height: ch, scale: 3 }, captureBeyondViewport: false,
    });
    shots.push(Buffer.from(s.data, "base64"));
  }
  const A = decodePng(shots[0]), B = decodePng(shots[1]);
  const d = diffImages(A, B, 0);
  writeFileSync(join(outDir, "crop-1.png"), shots[0]);
  writeFileSync(join(outDir, "crop-2.png"), shots[1]);
  console.log(`\n  Vùng ${cw}×${ch} tại (${cx},${cy}) · phóng to 3×`);
  console.log(`  Lệch giữa 2 lần chụp: ${d.diffPixels} px (${d.diffPercent.toFixed(3)}%)`);
  if (d.bbox) console.log(`  Vùng lệch trong ảnh cắt: ${d.bbox.w}×${d.bbox.h} tại (${d.bbox.x},${d.bbox.y}) — toạ độ trang: (${cx + Math.floor(d.bbox.x / 3)},${cy + Math.floor(d.bbox.y / 3)})`);

  // Phân tích bản chất khác biệt: cặp màu đổi và dải dòng bị lệch.
  if (!d.sizeMismatch) {
    const hex = (p) => "#" + [p[0], p[1], p[2]].map((v) => v.toString(16).padStart(2, "0")).join("");
    const pairs = new Map();
    const rowHits = new Map();
    for (let y = 0; y < A.height; y++) {
      for (let x = 0; x < A.width; x++) {
        const i = (y * A.width + x) * A.channels;
        const pa = [A.data[i], A.data[i + 1], A.data[i + 2]];
        const pb = [B.data[i], B.data[i + 1], B.data[i + 2]];
        if (pa[0] === pb[0] && pa[1] === pb[1] && pa[2] === pb[2]) continue;
        const k = `${hex(pa)} → ${hex(pb)}`;
        pairs.set(k, (pairs.get(k) || 0) + 1);
        rowHits.set(y, (rowHits.get(y) || 0) + 1);
      }
    }
    console.log("  Cặp màu thay đổi nhiều nhất:");
    for (const [k, n] of [...pairs.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6)) {
      console.log(`     ${k.padEnd(24)} ${n} px`);
    }
    const rows = [...rowHits.keys()].sort((a, b) => a - b);
    if (rows.length) {
      const contiguous = [];
      let start = rows[0], prev = rows[0];
      for (const r of rows.slice(1)) {
        if (r === prev + 1) { prev = r; continue; }
        contiguous.push([start, prev]); start = r; prev = r;
      }
      contiguous.push([start, prev]);
      console.log(`  Dải dòng bị lệch (trong ảnh cắt 3×): ${contiguous.map(([a, b]) => a === b ? `${a}` : `${a}-${b}`).join(", ")}`);
    }
  }
  console.log(`  Đã ghi: tools/_diff/crop-1.png và tools/_diff/crop-2.png`);
  try { ws.close(); } catch { /* bỏ qua */ }
  child.kill();
  process.exit(0);
}

const results = [];
let failures = 0;

// Chế độ định vị: tìm phần tử tại một toạ độ, phục vụ việc khoanh vùng nội dung động
// (ví dụ đồng hồ/mốc thời gian do UI_NOW_MS sinh ra mỗi lần SSR).
if (LOCATE) {
  const [lx, ly] = LOCATE.split(",").map(Number);
  await send("Emulation.setDeviceMetricsOverride", { width: 1920, height: 1080, deviceScaleFactor: 1, mobile: false });
  await send("Page.navigate", { url: BASE });
  await sleep(5200);
  const screen = SCREENS_TO_RUN[0];
  if (screen) { const nav = await clickSteps(screen.steps); console.log(`  nav ${screen.id}: ${nav}`); await sleep(2200); }
  const stack = await evaluate(`(()=>{const els=document.elementsFromPoint(${lx},${ly});
    return JSON.stringify(els.slice(0,8).map(e=>{const r=e.getBoundingClientRect();
      return {tag:e.tagName,cls:String(e.className).slice(0,70),txt:(e.textContent||'').replace(/\\s+/g,' ').trim().slice(0,60),
        rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]};}));})()`);
  console.log(`\n  Phần tử tại (${lx},${ly}) — trên xuống dưới:`);
  for (const e of JSON.parse(stack)) {
    console.log(`   • <${e.tag}> .${e.cls}`);
    console.log(`     rect=${e.rect.join(",")}  "${e.txt}"`);
  }
  try { ws.close(); } catch { /* bỏ qua */ }
  child.kill();
  process.exit(0);
}

for (const screen of SCREENS_TO_RUN) {
  console.log(`\n▸ ${screen.id}  —  ${screen.label}`);
  for (const vp of VIEWPORTS) {
    const file = join(BASELINE_DIR, `${screen.id}__${vp.id}.png`);
    let cap;
    try {
      cap = await capture(screen, vp);
    } catch (e) {
      console.log(`   ❌ ${vp.id.padEnd(8)} lỗi chụp: ${e.message.slice(0, 90)}`);
      failures++; results.push({ screen: screen.id, vp: vp.id, status: "loi-chup" });
      continue;
    }

    if (MODE_UPDATE) {
      writeFileSync(file, cap.png);
      console.log(`   ✅ ${vp.id.padEnd(8)} đã ghi ảnh chuẩn (${Math.round(cap.png.length / 1024)} KB) · nav=${cap.nav}`);
      results.push({ screen: screen.id, vp: vp.id, status: "da-ghi" });
      continue;
    }

    if (!existsSync(file)) {
      console.log(`   ⚠️  ${vp.id.padEnd(8)} CHƯA CÓ ảnh chuẩn — chạy --update trước`);
      failures++; results.push({ screen: screen.id, vp: vp.id, status: "thieu-anh-chuan" });
      continue;
    }

    const before = decodePng(readFileSync(file));
    const after = decodePng(cap.png);
    const d = diffImages(before, after, 0);

    if (MODE_SELFTEST) {
      const second = await capture(screen, vp);
      const d2 = diffImages(decodePng(second.png), after, 0);
      const noise = d2.sizeMismatch ? "KÍCH THƯỚC KHÁC" : `${d2.diffPixels} px (${d2.diffPercent.toFixed(4)}%)`;
      console.log(`   ${d2.sizeMismatch || d2.diffPixels > 0 ? "⚠️ " : "✅"} ${vp.id.padEnd(8)} nhiễu nền giữa 2 lần chụp: ${noise}`);
      // Chỉ thẳng ra CHỖ nhiễu: nếu không biết nó nằm ở đâu thì không thể sửa gốc, chỉ có thể
      // nâng ngưỡng — mà nâng ngưỡng thì cổng mất khả năng bắt lỗi nhỏ.
      if (!d2.sizeMismatch && d2.diffPixels > 0 && d2.bbox) {
        console.log(`        vùng nhiễu ${d2.bbox.w}×${d2.bbox.h} tại (${d2.bbox.x},${d2.bbox.y})`
          + (d2.topCells?.length ? ` · nặng nhất: ${d2.topCells.slice(0, 4).map((c) => `(${c.x},${c.y}) ${c.px}px`).join(" · ")}` : ""));
      }
      results.push({ screen: screen.id, vp: vp.id, status: "selftest", diffPixels: d2.sizeMismatch ? -1 : d2.diffPixels });
      continue;
    }

    if (d.sizeMismatch) {
      console.log(`   ❌ ${vp.id.padEnd(8)} KÍCH THƯỚC ẢNH KHÁC: chuẩn ${d.a.join("×")} vs nay ${d.b.join("×")}`);
      failures++; results.push({ screen: screen.id, vp: vp.id, status: "khac-kich-thuoc" });
      continue;
    }

    const ok = d.diffPixels <= MAX_DIFF_PIXELS;
    console.log(`   ${ok ? "✅" : "❌"} ${vp.id.padEnd(8)} lệch ${d.diffPixels} px (${d.diffPercent.toFixed(4)}%)`
      + (d.bbox ? ` · vùng lệch ${d.bbox.w}×${d.bbox.h} tại (${d.bbox.x},${d.bbox.y})` : ""));
    if (!ok && d.topCells.length) {
      console.log(`        vùng lệch nặng nhất: ${d.topCells.slice(0, 4).map((c) => `(${c.x},${c.y}) ${c.px}px`).join(" · ")}`);
    }
    if (!ok) failures++;
    results.push({ screen: screen.id, vp: vp.id, status: ok ? "khop" : "lech", diffPixels: d.diffPixels, bbox: d.bbox });
  }
}

try { ws.close(); } catch { /* bỏ qua */ }
child.kill();

console.log("\n" + "═".repeat(78));
if (MODE_UPDATE) {
  const n = results.filter((r) => r.status === "da-ghi").length;
  console.log(`KẾT LUẬN: ĐÃ GHI ${n} ẢNH CHUẨN vào tools/baseline/`);
  console.log("═".repeat(78));
  process.exit(0);
}
if (MODE_SELFTEST) {
  const worst = results.reduce((m, r) => Math.max(m, r.diffPixels ?? 0), 0);
  console.log(`KẾT LUẬN: NHIỄU NỀN LỚN NHẤT = ${worst} điểm ảnh`);
  console.log(worst === 0
    ? "  → Ảnh chụp TẤT ĐỊNH tuyệt đối. Cổng so ảnh dùng được ở ngưỡng 0."
    : `  → Ảnh chụp có nhiễu. Phải đặt --max-diff-pixels >= ${worst} hoặc loại màn gây nhiễu.`);
  console.log("═".repeat(78));
  process.exit(worst === 0 ? 0 : 1);
}
console.log(failures === 0
  ? `KẾT LUẬN: ĐẠT ✅ — không có vùng lệch nào (${results.length} ảnh đã đối chiếu)`
  : `KẾT LUẬN: KHÔNG ĐẠT ❌ — ${failures}/${results.length} ảnh lệch`);
console.log("═".repeat(78));
process.exit(failures === 0 ? 0 : 1);
