#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PROBE `BUG-20261009-D27` — VIỆC ĐÃ XOÁ MỀM (`active=0`) CÒN LỌT VÀO PAYLOAD `workItems`
// Phiên: ERP-SESSION-04 (`SESSION_D`) · 09/10/2026 · ⚠️ CHỈ ĐỌC — ⛔ không sửa gì
//
// VÌ SAO CÓ PROBE NÀY: nút **«Xoá»** (W3) gọi `delete_work_item` ⇒ CSDL đặt `active=0` (xoá MỀM) — nhưng cả 2
// đường đọc payload ⛔ KHÔNG lọc `active` ⇒ ⚠️ user xoá xong **dòng VẪN NẰM TRÊN MÀN** ⇒ tưởng nút hỏng.
// Bản vá (1 chỗ/đường): thêm **`AND wi.active=1`** vào `WHERE` — ⛔ **KHÔNG lọc theo `status`**
// (`COMPLETED` có `active=1` và **PHẢI HIỆN**).
//
// CÁCH DÙNG (⚠️ sau khi S01 vá ⇒ chạy lại, kỳ vọng **exit 0**):
//   node tools/probe-workitems-active.mjs            # đo PAYLOAD THẬT (:9000 → Java) + đọc mã 2 đường
//   node tools/probe-workitems-active.mjs --no-net   # chỉ đọc mã (⛔ không gọi mạng)
//
// MÃ TRẢ VỀ: 0 = ĐẠT (⛔ không còn dòng `active=0` VÀ cả 2 đường đã lọc) · 1 = CÒN LỖI · 2 = ⛔ không đo được
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

import { readFileSync } from "node:fs";

const NO_NET = process.argv.includes("--no-net");
const BASE = process.env.VNTECH_API || "http://127.0.0.1:9000";
const LOGIN = { username: "admin", password: "Admin123456@" };

// ⭐ Cho phép TRỎ TỆP NGUỒN KHÁC qua biến môi trường — chỉ để **ĐỐI CHỨNG ÂM** (⚠️ fixture tạm có `wi.active=1`)
//   mà ⛔ KHÔNG phải sửa mã thật của S01/S04 ⇒ ⭐ chứng minh probe **thật sự phân biệt** ĐÃ VÁ / CHƯA VÁ ✓
const JAVA_SRC = process.env.VNTECH_JAVA_SRC || "java-backend/infrastructure/src/main/java/com/vntech/erp/infrastructure/persistence/BootstrapDataAdapter.java";
const JS_SRC = process.env.VNTECH_JS_SRC || "scripts/system-route.mjs";

/** Đọc mã nguồn 1 đường và kiểm `WHERE` của truy vấn `workItems` có `wi.active=1` hay ⛔ không.
 *  ⚠️⚠️ BÀI HỌC TỰ BẮT (09/10/2026 16:26): bản đầu dùng **cửa sổ 600 ký tự** từ mốc `FROM work_items wi`
 *  ⇒ ⛔ **QUÁ NGẮN** (danh sách SELECT của truy vấn dài ~1.500 ký tự) ⇒ ⭐ **BÁO THIẾU LỌC SAI** (false negative)
 *  ⇒ nay quét tới **hết câu truy vấn** (`LIMIT 1000` với Java · hết template string với JS) ✓ */
function kiemDuongDoc(ten, file, mocBatDau, mocKetThuc, cuaSoToiDa = 4000) {
  let src;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    return { duong: ten, doDuoc: false, coLoc: null, ghiChu: "⛔ không đọc được tệp" };
  }
  const i = mocBatDau ? src.indexOf(mocBatDau) : 0;
  if (i < 0) return { duong: ten, doDuoc: false, coLoc: null, ghiChu: `⛔ không thấy mốc «${mocBatDau}»` };
  const endRaw = mocKetThuc ? src.indexOf(mocKetThuc, i) : -1;
  const end = endRaw > i && endRaw - i <= cuaSoToiDa ? endRaw : i + cuaSoToiDa;
  const doan = src.slice(i, end);
  return {
    duong: ten,
    doDuoc: true,
    coLoc: /wi\.active\s*=\s*1/.test(doan),
    ghiChu: `đoạn truy vấn \`workItems\` (${doan.length} ký tự — tới hết câu)`,
  };
}

async function doPayload() {
  const login = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", ...LOGIN }),
  });
  // ⚠️ 5xx ⇒ S01 đang restart ⇒ SỐ ĐO VÔ HIỆU (bài học đã ghi trong TEST_LOG của SESSION_D) ⇒ ⛔ không kết luận
  if (login.status >= 500) return { doDuoc: false, ghiChu: `login HTTP ${login.status} (máy chủ đang bận/khởi động lại) ⇒ ⛔ BỎ SỐ ĐO` };
  if (login.status !== 200) return { doDuoc: false, ghiChu: `login HTTP ${login.status}` };
  const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  const res = await fetch(`${BASE}/api/system`, { headers: { cookie }, cache: "no-store" });
  if (res.status >= 500) return { doDuoc: false, ghiChu: `payload HTTP ${res.status} ⇒ ⛔ BỎ SỐ ĐO` };
  const data = (await res.json())?.data || {};
  const items = Array.isArray(data.workItems) ? data.workItems : [];
  const xoaMem = items.filter((r) => Number(r.active) === 0);
  return {
    doDuoc: true,
    tong: items.length,
    soXoaMem: xoaMem.length,
    ma: xoaMem.map((r) => String(r.taskNo || r.task_no || r.id)).slice(0, 12),
    ghiChu: "payload `workItems` THẬT (⚠️ đã lọc theo phạm vi của `admin`)",
  };
}

const dong = "═".repeat(96);
console.log(dong);
console.log("PROBE BUG-20261009-D27 — việc đã XOÁ MỀM (`active=0`) còn lọt vào payload `workItems`?");
console.log(`⏱  ${new Date().toISOString()} · phiên ERP-SESSION-04 · ⚠️ CHỈ ĐỌC`);
console.log(dong);

// ① ĐỌC MÃ 2 ĐƯỜNG (⛔ không phụ thuộc mạng)
const java = kiemDuongDoc("Java (đang phục vụ :18081 qua proxy :9000)", JAVA_SRC, "FROM work_items wi", "LIMIT 1000");
const js = kiemDuongDoc("JS (đường cũ `scripts/**` — ⚠️ hiện ⛔ không phục vụ)", JS_SRC, "SELECT wi.id,wi.task_no AS taskNo", "const workItems = await");
for (const d of [java, js]) {
  const kq = d.doDuoc ? (d.coLoc ? "✅ ĐÃ lọc `wi.active=1`" : "🔴 ⛔ THIẾU `AND wi.active=1`") : `⚠️ ${d.ghiChu}`;
  console.log(`① MÃ  · ${d.duong.padEnd(48)} ⇒ ${kq}`);
}

// ② ĐO PAYLOAD THẬT (tuỳ chọn)
let pl = { doDuoc: false, ghiChu: "⛔ bỏ qua (--no-net)" };
if (!NO_NET) {
  try {
    pl = await doPayload();
  } catch (e) {
    pl = { doDuoc: false, ghiChu: `⛔ lỗi mạng: ${e?.message || e}` };
  }
}
if (pl.doDuoc) {
  console.log(`② PAYLOAD · tổng \`workItems\` = ${pl.tong} · ⚠️ dòng \`active=0\` = ${pl.soXoaMem}` +
    (pl.soXoaMem ? ` ⇒ 🔴 CÒN LỌT: ${pl.ma.join(", ")}` : " ⇒ ✅ ĐÃ SẠCH"));
} else {
  console.log(`② PAYLOAD · ${pl.ghiChu}`);
}

console.log(dong);
const loiMa = [java, js].filter((d) => d.doDuoc && d.coLoc === false).map((d) => d.duong);
const loiPayload = pl.doDuoc && pl.soXoaMem > 0;
// ⚠️⚠️ LUẬT CỦA CHÍNH PROBE NÀY — **3 NHÁNH LOẠI TRỪ NHAU** (if / else if / else):
//   ① ⛔ KHÔNG dùng `process.exit()` ở giữa (⚠️ Node/Windows **crash `uv async.c`** khi thoát lúc `fetch` còn mở
//      — đã gặp THẬT ở lần chạy đầu 16:18) ✓
//   ② ⛔ TUYỆT ĐỐI không để nhánh SAU **ghi đè `exitCode`** của nhánh TRƯỚC ⇒ ⚠️ sẽ **BÁO ĐẠT GIẢ** (đã gặp THẬT
//      khi tôi sửa bằng `-replace`: probe in CẢ «VẪN CÒN» lẫn «ĐÃ VÁ» rồi thoát **0**) ⇒ ⭐ đây là lớp lỗi
//      «cổng kiểm thử nói ĐẠT trong khi lỗi còn» — nguy hiểm nhất trong GO-LIVE ✓
if (loiMa.length || loiPayload) {
  // ⭐ PHÂN BIỆT 2 CA (⚠️ rất khác nhau về HÀNH ĐỘNG cần làm):
  if (!loiMa.length && loiPayload) {
    console.log("⚠️ KẾT LUẬN: **MÃ ĐÃ VÁ ĐỦ 2 ĐƯỜNG** — ⛔ NHƯNG **BẢN CHẠY CHƯA NẠP**: payload vẫn còn " + pl.soXoaMem + " dòng `active=0`");
    console.log("   · HÀNH ĐỘNG: cần **BUILD LẠI + RESTART** tiến trình API (jar Java) rồi chạy lại cổng này ⇒ kỳ vọng **exit 0** ✓");
    console.log("   · ⛔ KHÔNG phải lỗi mã nữa — ⛔ đừng «vá» thêm lần nữa (⚠️ sẽ tạo hồi quy) ✓");
  } else {
    console.log("🔴 KẾT LUẬN: BUG-D27 ⛔ VẪN CÒN — nút «Xoá» (W3) sẽ XOÁ MỀM nhưng dòng ⛔ VẪN HIỆN ⇒ user tưởng nút hỏng.");
    if (loiMa.length) console.log(`   · Đường THIẾU lọc: ${loiMa.join(" · ")}`);
    if (loiPayload) console.log(`   · Payload còn ${pl.soXoaMem} dòng \`active=0\` ⇒ ⭐ BẰNG CHỨNG NGƯỜI DÙNG THẤY ĐƯỢC`);
    console.log("   · BẢN VÁ: thêm `AND wi.active=1` vào `WHERE` (⚠️ ⛔ KHÔNG lọc theo `status` — `COMPLETED` vẫn phải hiện)");
  }
  process.exitCode = 1;
} else if (!java.doDuoc || !js.doDuoc || (!NO_NET && !pl.doDuoc)) {
  console.log("⚠️ KẾT LUẬN: ⛔ KHÔNG ĐỦ SỐ ĐO (⚠️ 5xx/mạng/tệp) ⇒ ⛔ KHÔNG kết luận ĐẠT — chạy lại sau.");
  process.exitCode = 2;
} else {
  console.log("✅ KẾT LUẬN: BUG-D27 ĐÃ ĐƯỢC VÁ — cả 2 đường có `wi.active=1`" + (pl.doDuoc ? " và payload ⛔ không còn dòng `active=0`" : "") + ".");
  process.exitCode = 0;
}
