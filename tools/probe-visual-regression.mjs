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
// Ngưỡng mặc định = 8 điểm ảnh — ĐÃ ĐO, không phỏng đoán. Trần này vẫn cách xa hồi quy THẬT
// nhỏ nhất từng gặp trong dự án (405 px) khoảng 50 lần, nên không che được lỗi có ý nghĩa.
//
// BẰNG CHỨNG 1 — nhiễu nền TRONG một phiên chụp (--selftest, chụp 2 lần cùng màn):
//   01-dashboard · 03-work · 06-warehouse · 07-admin: cả 4 kích thước = 0 px
//   ⇒ trong cùng một phiên, ảnh chụp tất định tuyệt đối.
//
// BẰNG CHỨNG 2 — dao động GIỮA các phiên (chạy đối chiếu 3 lần liên tiếp, màn 07-admin):
//   lần 1: 0 px · lần 2: 2 px · lần 3: 0 px
//   và một lần chạy đủ 28 ảnh đã báo 2 ảnh vượt ngưỡng 2 px (lần chạy sau lại ĐẠT).
//   Vị trí: vùng 203×1 tại (22,824) — --locate=120,824 cho
//   <BUTTON class="sidebar-collapse-toggle"> rect=22,798,203,34
//   ⇒ vài điểm ảnh ở HAI MÉP nút: viền bo góc vẽ lệch dưới một điểm ảnh tuỳ phiên.
//     Không phải lệch bố cục, không phải đổi nội dung.
//
// VÌ SAO 8: ngưỡng 2 px đặt ở lần đo trước quá sát nên cổng báo lỗi GIẢ (2/28) ở một lần chạy —
// cổng hay báo lỗi giả thì không còn được tin để chặn thật. 8 px hấp thụ được dao động viền bo
// góc mà vẫn nhỏ hơn hồi quy thật nhỏ nhất (405 px) gần 50 lần.
//
// KHÔNG nâng lên 21 px để né huy hiệu đếm: làm vậy là bỏ lọt mọi lỗi nhỏ hơn 21 px trên toàn hệ
// thống — huy hiệu đếm đã được loại trừ RIÊNG ở FREEZE_CSS (chỉ ẩn ký tự số, giữ nguyên bố cục).
// Muốn nghiêm ngặt tuyệt đối: --max-diff-pixels=0
const MAX_DIFF_PIXELS = Number(argValue("--max-diff-pixels") ?? 8);
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
  // 08-requests: màn Phiếu đề nghị mua hàng — nhóm MUA HÀNG & CUNG ỨNG, module đầu tiên.
  // Thêm 18/09/2026 (TASK-083 bảng 15) vì màn này gồm bảng chọn dòng `selected-row` mà 7 màn trên KHÔNG phủ.
  { id: "08-requests",  label: "Phiếu đề nghị mua hàng", steps: [{ group: "purchasing",   child: 0 }] },
  // 09/10: màn phòng ban "Giao việc & Kiểm soát hoàn thành" (DepartmentTaskWorkspace) — bảng 10 cột,
  // có CHỌN DÒNG (`selected-row`), ô hạn có `red-text`, cột nguồn là `link-button`, cột % có thanh tiến độ.
  // ⚠️ Nhóm "department_management" KHÔNG còn tồn tại — đã tách thành my_work/mep/finance/hr_legal/reports
  // (migration V4__menu_restructure.sql, ghi chú ở page.tsx:49). Trong nhóm `my_work` thứ tự sort_order:
  // dept_plan_tasks(10) · dept_project_tasks(20) · **dept_plan_assign(30) → con 2** ·
  // **dept_project_assign(40) → con 3** · approvals(50).
  // Hai màn được chụp vì dữ liệu thật KHÁC NHAU: 7 việc thật đều thuộc phòng DA ⇒ màn KH là **trạng thái rỗng**,
  // màn DA có **7 dòng** ⇒ phủ cả hai đường render (rỗng + có dữ liệu).
  { id: "09-dept-assign-kh", label: "Phòng Kế hoạch — Giao việc (trạng thái rỗng)", steps: [{ group: "my_work", child: 2 }], fullPage: true },
  { id: "10-dept-assign-da", label: "Phòng Dự án — Giao việc (7 việc thật)", steps: [{ group: "my_work", child: 3 }], fullPage: true },
  // 11/12: KIỂM BẤT BIẾN "KHUNG KHÔNG VƯỢT VIEWPORT" (U-10). Bước `{ click: "<selector>" }` mở khung rồi mới chụp;
  // cổng tự đo `getBoundingClientRect()` của `.modal`/`.drawer` và TỪ CHỐI ĐẠT nếu khung tràn khung nhìn,
  // hoặc nếu nội dung cao hơn thân khung mà thân khung KHÔNG cuộn được (⇒ mất nội dung).
  { id: "11-modal-request", label: "Phiếu đề nghị — modal lập phiếu (rộng nhất)", steps: [{ group: "purchasing", child: 0 }, { click: ".list-toolbar-actions button.primary" }] },
  { id: "12-drawer-request-detail", label: "Phiếu đề nghị — drawer chi tiết", steps: [{ group: "purchasing", child: 0 }, { click: ".request-list-card .icon-mini" }] },
  { id: "13-modal-material", label: "Danh mục vật tư — modal thêm/sửa vật tư", steps: [{ group: "material_master", child: 0 }, { click: ".material-list-filters button.primary" }] },
  { id: "16-modal-receipt", label: "Nhập kho — modal tạo phiếu nhập", steps: [{ group: "warehouse", child: 0 }, { click: ".list-toolbar-actions button.primary" }] },
  // Q7 (18/09/2026) — ĐÃ KHẢO SÁT NÚT THẬT cho 2 khung còn thiếu (trước đây cổng báo NO_CLICK_TARGET):
  //   • PO: nút thật nằm ở `.purchase-action-bar` của `app/screens/Purchasing.tsx:28` — `＋ PHÁT HÀNH PO`
  //     (`<button className="primary" … onClick={()=>requests[0]&&open("po",requests[0])}>`), KHÔNG phải toolbar danh sách.
  //   • Tổ đội: nút do `CardHead` render (`<div className="card-head">…<button>＋ Thêm tổ đội →</button>`) nên KHÔNG có
  //     lớp riêng ⇒ phải bấm theo NHÃN (`clickText`), và nút nằm ở **bước 2** của wizard Quản trị
  //     (`.permission-steps button:nth-child(2)`).
  { id: "17-modal-po", label: "Mua hàng & PO — modal phát hành PO", settleMs: 6000, steps: [{ group: "purchasing", child: 1 }, { click: ".purchase-action-bar button.primary" }] },
  // R-01 (20/09) — MÀN BÁO CÁO DÙNG CHUNG (nav nhóm reports). Bằng chứng RUNTIME cho R-01.
  // P-01 (20/09) — MÀN MUA HÀNG: 3 TAB MR · PR · PO (nav nhóm purchasing, child 1). Bằng chứng runtime cho P-01.
  { id: "20-purchasing-tabs", label: "Mua hàng — 3 tab MR/PR/PO (P-01)", settleMs: 3000, steps: [{ group: "purchasing", child: 1 }], fullPage: true },
  { id: "19-report-center", label: "Báo cáo tổng hợp — màn dùng chung (R-01)", settleMs: 3000, steps: [{ group: "reports", child: 4 }], fullPage: true },
  { id: "18-modal-team-create", label: "Quản trị — modal tạo tổ đội dự án (bước 2)", steps: [{ group: "system_admin", child: 0 }, { click: ".permission-steps button:nth-child(2)" }, { clickText: "Thêm tổ đội" }] },
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
// Ô TÌM KIẾM TOÀN CỤC TRÊN TOPBAR — loại trừ phần tử, có bằng chứng đo được:
//   Một lần chạy cổng báo lệch 1096 px trong vùng 213×14 tại (1330,34) khi màn 01-dashboard
//   KHÔNG hề bị sửa gì; --locate=1420,41 cho <INPUT> nằm trong <FORM class="global-search">
//   rect=1282,22,320,38 ⇒ vùng lệch đúng bằng dòng chữ gợi ý của ô tìm kiếm.
//   Các lần chạy khác CÙNG màn đó lệch đúng 0 px; ba lần liên tiếp cho 0 px · 20 px · 0 px.
//   Đã thử sửa bằng cách chờ `document.fonts.ready` trước khi chụp — KHÔNG đủ, lần chạy sau vẫn
//   lệch đúng 1096 px tại đúng toạ độ đó. Vì vậy đây KHÔNG phải lỗi giao diện của 7 màn được
//   kiểm, mà là yếu tố không tất định của CHÍNH KHUNG CHUNG.
//   ⇒ Loại trừ phần tử này khỏi phép đo (giữ nguyên kích thước nên bố cục topbar không đổi).
//   ĐÂY LÀ ĐIỀU TRA CÒN MỞ: chưa xác định được nguyên nhân gốc, chỉ khoanh vùng được phần tử.
const FREEZE_CSS = `*{animation:none!important;transition:none!important;caret-color:transparent!important;}
html{scroll-behavior:auto!important}
.theme-switch,.user-menu{visibility:hidden!important}
.nav-parent b,.nav-child b,.notify-button b{visibility:hidden!important}
.global-search{visibility:hidden!important}`;

async function freeze() {
  // CHỜ FONT TẢI XONG trước khi chụp — đây là gốc rễ của việc cổng "lúc đạt lúc không".
  // Nếu chụp lúc font còn đang tải, chữ được vẽ bằng FONT DỰ PHÒNG nên khác hoàn toàn về điểm
  // ảnh. Bằng chứng đo được (17/09/2026): một lần chạy lệch 1096 px chỉ trong MỘT vùng chữ
  // 213×14 của ô tìm kiếm topbar (--locate=1420,41 → <INPUT> trong <FORM .global-search>),
  // trong khi các lần chạy khác CÙNG màn đó lệch đúng 0 px; ba lần chạy liên tiếp cho
  // 0 px · 20 px tại (734,190) · 0 px. Đó là lỗi GIẢ của cổng, không phải lỗi giao diện.
  await evaluate(`(async()=>{try{await document.fonts.ready;}catch(e){}return 1;})()`);
  await evaluate(`(()=>{let s=document.getElementById('__vr_freeze');if(!s){s=document.createElement('style');s.id='__vr_freeze';document.head.appendChild(s);}s.textContent=${JSON.stringify(FREEZE_CSS)};window.scrollTo(0,0);document.querySelectorAll('.table-wrap,.stack,.main,.content').forEach(e=>{e.scrollTop=0;e.scrollLeft=0;});return 1;})()`);
  await sleep(600);
}

async function clickSteps(steps) {
  for (const st of steps) {
    // BƯỚC MỞ MODAL/DRAWER (U-10) — KHÔNG có `group` nên phải xử lý TRƯỚC khối điều hướng,
    // nếu không `[data-nav-group="undefined"]` sẽ trả NO_GROUP (lỗi đã gặp thật 18/09).
    if (st.click || st.clickText) {
      // Chẩn đoán rõ: không tìm thấy · BỊ VÔ HIỆU (thiếu quyền) · nút không phải <button> ⇒ mỗi ca một kết luận khác nhau.
      // Q7 (18/09/2026) — thêm `clickText`: nhiều nút thật KHÔNG có lớp CSS riêng (ví dụ nút do `CardHead`
      // render: `<div className="card-head">…<button>＋ Thêm tổ đội →</button>`); bấm theo NHÃN NÚT là cách
      // duy nhất không phải đoán selector. So khớp sau khi bỏ khoảng trắng/ký tự trang trí để không phụ thuộc
      // dấu `＋`/`→` hay khoảng trắng.
      const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "");
      const target = st.clickText ? norm(st.clickText) : null;
      const hit = await evaluate(`(()=>{const wanted=${JSON.stringify(target)};
        const norm=(s)=>String(s).toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').replace(/[^a-z0-9]+/g,'');
        const el = wanted
          ? [...document.querySelectorAll('button,a,label')].find((b)=>norm(b.textContent||'').includes(wanted))
          : document.querySelector(${JSON.stringify(st.click || "")});
        if(!el)return 'NO_CLICK_TARGET';
        if(el.disabled)return 'CLICK_TARGET_DISABLED';
        el.click();return 'CLICKED_UI';})()`);
      if (hit !== "CLICKED_UI") return hit;
      await sleep(1600);
      continue;
    }
    if (!st.group) continue;
    const expand = await evaluate(`(()=>{const s=document.querySelector('[data-nav-group="${st.group}"]');
      if(!s)return 'NO_GROUP('+[...document.querySelectorAll('[data-nav-group]')].map(e=>e.getAttribute('data-nav-group')).join('|')+')';
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
  const shot = await send("Page.captureScreenshot", {
    format: "png",
    // SÀN DƯỚI MÀN HÌNH: các màn phòng ban có bảng nằm DƯỚI nếp gấp (page head + 6 thẻ KPI + form giao việc
    // + card lọc đẩy bảng xuống khỏi 1080 px) ⇒ chụp mặc định KHÔNG thấy bảng ⇒ cổng "xanh" mà không đo gì.
    // Màn nào đặt `fullPage: true` thì chụp TOÀN TRANG. Mặc định vẫn là khung nhìn, để 32 ảnh chuẩn cũ không đổi.
    captureBeyondViewport: screen.fullPage === true,
  });
  // U-10 — ĐO KHUNG MODAL/DRAWER (nếu màn có mở khung) để biến "modal vượt viewport" thành BẤT BIẾN ĐO ĐƯỢC.
  const modal = await evaluate(`(()=>{const m=document.querySelector('.modal,.drawer');if(!m)return null;
    const r=m.getBoundingClientRect();
    const body=m.querySelector('.modal-body,.drawer-body');
    const cs=body?getComputedStyle(body):null;
    return { t:Math.round(r.top), b:Math.round(r.bottom), l:Math.round(r.left), r:Math.round(r.right),
      vh:window.innerHeight, vw:window.innerWidth,
      scrollH: body?Math.round(body.scrollHeight):0, clientH: body?Math.round(body.clientHeight):0,
      overflowY: cs?cs.overflowY:"" };})()`);
  return { png: Buffer.from(shot.data, "base64"), nav, modal };
}

/** U-10 — bất biến: khung modal/drawer PHẢI nằm TRỌN trong khung nhìn. Trả về chuỗi mô tả lỗi hoặc "". */
function modalOverflow(m) {
  if (!m) return "";
  const bad = [];
  if (m.t < -1) bad.push(`top=${m.t} < 0`);
  if (m.l < -1) bad.push(`left=${m.l} < 0`);
  if (m.b > m.vh + 1) bad.push(`bottom=${m.b} > khung nhìn ${m.vh}`);
  if (m.r > m.vw + 1) bad.push(`right=${m.r} > khung nhìn ${m.vw}`);
  // Nội dung cao hơn khung thì thân khung BẮT BUỘC phải cuộn được, nếu không là MẤT nội dung.
  if (m.scrollH > m.clientH + 1 && !["auto", "scroll"].includes(String(m.overflowY))) {
    bad.push(`nội dung ${m.scrollH}px > thân ${m.clientH}px mà overflow-y=${m.overflowY} ⇒ mất nội dung`);
  }
  return bad.join(" · ");
}
const modalText = (m) => (m ? `${m.l},${m.t} → ${m.r},${m.b} (khung nhìn ${m.vw}×${m.vh})` : "không mở khung");

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
    if (screen) { const nav = await clickSteps(screen.steps); if (i === 0) console.log(`  nav ${screen.id}: ${nav}`); await sleep(2200 + (screen?.settleMs || 0)); }
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
  if (screen) { const nav = await clickSteps(screen.steps); console.log(`  nav ${screen.id}: ${nav}`); await sleep(2200 + (screen?.settleMs || 0)); }
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
      const ov = modalOverflow(cap.modal);
      console.log(`   ${ov ? "⚠️ " : "✅"} ${vp.id.padEnd(8)} đã ghi ảnh chuẩn (${Math.round(cap.png.length / 1024)} KB) · nav=${cap.nav} · khung=${modalText(cap.modal)}${ov ? ` · VƯỢT VIEWPORT: ${ov}` : ""}`);
      results.push({ screen: screen.id, vp: vp.id, status: "da-ghi" });
      continue;
    }

    // U-10 — kiểm bất biến khung modal TRƯỚC khi so ảnh: khung vượt khung nhìn là LỖI, không phải "lệch ảnh".
    const overflow = modalOverflow(cap.modal);
    if (overflow) {
      console.log(`   ❌ ${vp.id.padEnd(8)} KHUNG VƯỢT VIEWPORT: ${overflow} · khung=${modalText(cap.modal)}`);
      failures++;
      results.push({ screen: screen.id, vp: vp.id, status: "khung-vuot-viewport" });
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

    let use = d;
    let retried = false;
    if (d.diffPixels > MAX_DIFF_PIXELS) {
      // CHỐNG LỖI GIẢ — lệch MỘT lần chưa đủ để kết luận.
      // Chụp lại lần hai và chỉ kết luận LỆCH khi CẢ HAI lần đều vượt ngưỡng. Hồi quy THẬT thì
      // tái hiện được; hiện tượng không tất định của trình duyệt thì không.
      // Bằng chứng đo được (17/09/2026): trên CÙNG một màn, CÙNG dữ liệu, các lần chạy cho
      // 0 px · 20 px tại (734,190) · 0 px, và 1096 px tại ô tìm kiếm topbar xen kẽ với 0 px —
      // trong khi bộ --selftest (chụp 2 lần liền nhau) luôn cho 0 px.
      const again = await capture(screen, vp);
      const d2 = diffImages(decodePng(readFileSync(file)), decodePng(again.png), 0);
      retried = true;
      if (!d2.sizeMismatch && d2.diffPixels < use.diffPixels) use = d2;
    }

    const ok = use.diffPixels <= MAX_DIFF_PIXELS;
    console.log(`   ${ok ? "✅" : "❌"} ${vp.id.padEnd(8)} lệch ${use.diffPixels} px (${use.diffPercent.toFixed(4)}%)`
      + (use.bbox ? ` · vùng lệch ${use.bbox.w}×${use.bbox.h} tại (${use.bbox.x},${use.bbox.y})` : "")
      + (retried ? ` · đã chụp lại (lần đầu ${d.diffPixels} px)` : ""));
    if (!ok && use.topCells.length) {
      console.log(`        vùng lệch nặng nhất: ${use.topCells.slice(0, 4).map((c) => `(${c.x},${c.y}) ${c.px}px`).join(" · ")}`);
    }
    if (!ok) failures++;
    results.push({ screen: screen.id, vp: vp.id, status: ok ? "khop" : "lech", diffPixels: use.diffPixels, bbox: use.bbox });
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
