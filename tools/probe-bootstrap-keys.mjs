// Cổng TASK-048b — QUÉT KHOÁ BOOTSTRAP: giao diện đọc `data.<khoá>` nào mà backend KHÔNG trả?
//
// VÌ SAO: lớp lỗi *"đường ĐỌC thiếu khoá"* đã bắt được **8 lần** (TASK-039 `scope_key='GLOBAL'`,
// TASK-040 nhóm 1 `emailRecipients`, nhóm 3 `source_type`, nhóm 3b `adminMaterials`…). Mỗi lần đều
// phát hiện THỦ CÔNG sau khi người dùng thấy màn hình trống. Cổng này quét MỘT LƯỢT toàn bộ khoá.
//
// ══ TASK-019 — SỬA PHẠM VI ĐỌC (xem D-065) ══
// Bản cũ đọc `app/page.tsx` DUY NHẤT. Sau khi mã tách ra 34 tệp `app/screens/*.tsx`, cổng mù hoàn toàn
// với 4/5 giao diện: nó báo "UI đọc 83 khoá" trong khi thực tế là 96 — 13 khoá nằm ngoài tầm mắt.
// Hậu quả đo được: `workItemParticipants` + `workItemComments` (đọc ở `app/screens/WorkHierarchy.tsx`)
// không bao giờ được hỏi tới, và bản Java bootstrap cũng thiếu chúng.
//   → nay quét TOÀN BỘ `app/**` (không chừa thư viện) và toàn bộ `java-backend/**` adapter+bootstrap.
//
// ══ CHẾ ĐỘ SỐNG (`--live`) — bắt cái mà phép đo tĩnh không bắt được ══
// So khớp TÊN CHUỖI với mã Java chỉ nói được "có khai báo hay không". Nó KHÔNG nói được
// khoá đó có THỰC SỰ tới tay người dùng không — và chính điều đó đã giấu 2 khoá thiếu cho tới
// khi đo trực tiếp. Vì vậy: nếu dịch vụ đang chạy, cổng hỏi luôn chính bootstrap sống.
//
// GIỚI HẠN (nói rõ): phép đo tĩnh là SO KHỚP TÊN CHUỖI, không phải phân tích kiểu dữ liệu —
//   • UI có thể đọc `data.X` ở nhánh chỉ chạy cho dữ liệu JS-only ⇒ phải đọc mã trước khi kết luận;
//   • Java có thể trả khoá qua lớp khác (JPA/controller) mà cổng không thấy;
//   • khoá lồng trong object con (`settings.foo`) không được kiểm ở đây.
//
//   node tools/probe-bootstrap-keys.mjs          # tĩnh
//   node tools/probe-bootstrap-keys.mjs --live   # tĩnh + hỏi bootstrap sống
import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const LIVE = process.argv.includes("--live");
const BASE = process.env.PROBE_BASE || "http://127.0.0.1:9000";
const ROOT = process.cwd();

// ---------- phía UI: TOÀN BỘ app/**, không chỉ app/page.tsx ----------
function walk(dir, pred, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p, pred, out);
    else if (pred(e.name)) out.push(p);
  }
  return out;
}
const uiFiles = walk(join(ROOT, "app"), (n) => /\.tsx?$/.test(n)).sort();
const uiKeys = new Map();                       // khoá -> tập tệp đọc nó (để báo "ai đọc khoá này")
for (const f of uiFiles) {
  const t = readFileSync(f, "utf8");
  for (const m of t.matchAll(/\bdata\.([A-Za-z_][A-Za-z0-9_]*)/g)) {
    if (!uiKeys.has(m[1])) uiKeys.set(m[1], new Set());
    uiKeys.get(m[1]).add(relative(ROOT, f).replace(/\\/g, "/"));
  }
}

// ---------- phía Java: mọi adapter/bootstrap trong java-backend, không chỉ 1 thư mục ----------
const javaFiles = walk(join(ROOT, "java-backend"), (n) => /\.java$/.test(n))
  .filter((f) => /Adapter\.java$/.test(f) || /Bootstrap[A-Za-z]*\.java$/.test(f));
const javaKeys = new Map();
for (const f of javaFiles) {
  const t = readFileSync(f, "utf8");
  for (const m of t.matchAll(/\.put\(\s*"([A-Za-z_][A-Za-z0-9_]*)"/g)) {
    if (!javaKeys.has(m[1])) javaKeys.set(m[1], new Set());
    javaKeys.get(m[1]).add(relative(ROOT, f).replace(/\\/g, "/"));
  }
}

// ---------- khoá nội bộ: `.filter/.map/...` KHÔNG phải khoá bootstrap ----------
const INTERNAL = new Set(["length", "filter", "map", "find", "reduce", "some", "every", "forEach", "slice", "id", "code", "name"]);
const real = [...uiKeys.keys()].filter((k) => !INTERNAL.has(k)).sort();
const inPage = real.filter((k) => uiKeys.get(k).has("app/page.tsx"));
const onlyScreens = real.filter((k) => !uiKeys.get(k).has("app/page.tsx"));

console.log(`PHẠM VI ĐỌC (TASK-019): ${uiFiles.length} tệp app/** · ${javaFiles.length} tệp adapter/bootstrap trong java-backend/**`);
console.log(`UI đọc ${real.length} khoá \`data.*\` (${inPage.length} có trong app/page.tsx · ${onlyScreens.length} CHỈ nằm ở tệp khác)`);
console.log(`Java khai ${javaKeys.size} khoá qua \`.put("…")\``);

// ---------- PHẦN 1 — tĩnh ----------
const missingStatic = real.filter((k) => !javaKeys.has(k));
console.log(`\n═══ [TĨNH] KHOÁ UI ĐỌC MÀ KHÔNG THẤY JAVA KHAI BÁO: ${missingStatic.length} ═══`);
for (const k of missingStatic) {
  const onlyOutside = !uiKeys.get(k).has("app/page.tsx");
  console.log(`  ${k}${onlyOutside ? "   ← CHỈ có trong tệp khác, app/page.tsx không hề có" : ""}`);
  console.log(`      đọc tại: ${[...uiKeys.get(k)].slice(0, 3).join(" · ")}`);
}

// ---------- PHẦN 2 — sống ----------
let missingLive = null;
if (LIVE) {
  try {
    const login = await fetch(BASE + "/api/system", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
    });
    const ck = (login.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
    if (!ck) throw new Error("login khong tra cookie");
    const r = await fetch(BASE + "/api/system", { headers: { cookie: ck } });
    const j = await r.json();
    const d = j?.data;
    if (!d) throw new Error("bootstrap khong co truong `data`");
    const live = new Set(Object.keys(d));
    missingLive = real.filter((k) => !live.has(k));
    console.log(`\n═══ [SỐNG] bootstrap trả ${live.size} khoá ═══`);
    console.log(`KHOÁ UI ĐỌC MÀ BOOTSTRAP SỐNG KHÔNG TRẢ: ${missingLive.length}`);
    for (const k of missingLive) {
      console.log(`  ${k}   <- ${[...uiKeys.get(k)].slice(0, 2).join(", ")}`);
    }
    // Khoá Java khai báo mà vẫn không có trên dương: chỉ ra giới hạn của phép đo tĩnh.
    const staticSaidOk = real.filter((k) => javaKeys.has(k) && !live.has(k));
    if (staticSaidOk.length) {
      console.log(`\n⚠ JAVA KHAI \`.put()\` NHƯNG SỐNG KHÔNG CÓ (phép đo tĩnh chỉ đọc MỘT NƠ): ${staticSaidOk.length}`);
      for (const k of staticSaidOk.slice(0, 10)) console.log(`    ${k}`);
    }
  } catch (e) {
    console.log(`\n═══ [SỐNG] BỎ QUA — không gọi được bootstrap: ${e.message}`);
    console.log(`    (đây là thông tin, KHÔNG phải kết luận lỗi)`);
  }
} else {
  console.log(`\n(hint: chạy \`node tools/probe-bootstrap-keys.mjs --live\` để hỏi luôn bootstrap sống —`);
  console.log(` phép đo tĩnh KHÔNG bảo đảm khoá tới được tay người dùng)`);
}

console.log(`\nGHI CHÚ: đây là danh sách ĐỂ RÀ, không phải kết luận lỗi — mỗi khoá phải mở mã xác nhận`);
console.log(`(một số khoá do lớp khác trả, một số chỉ dùng ở nhánh dữ liệu JS).`);
// KHÔNG dùng `process.exit(0)`: ở chế độ `--live` còn socket của `fetch` đang đóng, ép thoát ngay
// làm Node đụng libuv trên Windows — `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING)`
// và **thoát với mã 1**, tức là cổng "đạt" lại báo HỎNG. Đặt `exitCode` rồi để vòng lặp sự kiện tự tắt.
process.exitCode = 0;