// [PHASE 1 · U-14 bước B] Đổi vỏ `<aside class="drawer request-drawer">` ⇒ `EntityDetailModal` NGAY TRONG page.tsx.
// AN TOÀN: chỉ sửa MỘT dòng return của RequestDrawer; TÌM MỐC + TỰ CHỐI nếu mốc không rõ; mặc định CHẠY KHÔ.
import { readFileSync, writeFileSync } from "node:fs";
const F = "app/page.tsx";
const APPLY = process.argv.includes("--apply");
const raw = readFileSync(F, "utf8");
const NL = raw.includes("\r\n") ? "\r\n" : "\n";
const L = raw.split(/\r?\n/);

// 1) tìm khối RequestDrawer rồi dòng return
const fn = L.findIndex((l) => l.startsWith("function RequestDrawer("));
if (fn < 0) { console.error("✖ không thấy function RequestDrawer( ⇒ DỪNG"); process.exit(1); }
const ret = L.findIndex((l, i) => i > fn && l.trimStart().startsWith("return <div className={isPage"));
if (ret < 0) { console.error("✖ không thấy dòng return của RequestDrawer ⇒ DỪNG"); process.exit(1); }
const line = L[ret];
console.log(`RequestDrawer @ dòng ${fn + 1}; return @ dòng ${ret + 1} (dài ${line.length} ký tự)`);

// 2) kiểm các MỐC bắt buộc, mỗi mốc phải xuất hiện ĐÚNG 1 lần
const marks = {
  asideOpen: "<aside className={isPage ? `drawer request-drawer is-page",
  asideOpenAlt: "<aside className={isPage ? `drawer request-drawer is-page${collapsed ? \" sections-collapsed\" : \"\"}` : \"drawer request-drawer\"}>",
  drawerBodyOpen: '<div className="drawer-body">',
  asideClose: "</aside>",
  summaryModal: "<EntityDetailModal open={summaryOpen}",
};
const count = (s) => line.split(s).length - 1;
for (const [k, s] of Object.entries(marks)) console.log(`  mốc ${k.padEnd(15)} xuất hiện ${count(s)} lần`);
const need = ["asideOpenAlt", "drawerBodyOpen", "asideClose", "summaryModal"];
const bad = need.filter((k) => count(marks[k]) !== 1);
if (bad.length) { console.error(`✖ mốc không rõ (cần đúng 1 lần): ${bad.join(", ")} ⇒ DỪNG (không sửa).`); process.exit(1); }

// 3) tách phần THÂN (giữa > của <aside …> và </aside>)
const aOpen = line.indexOf(marks.asideOpenAlt) + marks.asideOpenAlt.length;
const aClose = line.indexOf(marks.asideClose);
if (aClose < aOpen) { console.error("✖ thứ tự mốc sai ⇒ DỪNG"); process.exit(1); }
const inner = line.slice(aOpen, aClose);              // gồm <header>…</header><div class="drawer-body">…</div><footer>…</footer>
const head = line.slice(0, line.indexOf(marks.asideOpenAlt));
const tail = line.slice(aClose + marks.asideClose.length); // bắt đầu bằng <EntityDetailModal open={summaryOpen} …
console.log(`  tách: đầu ${head.length} ký tự · thân ${inner.length} ký tự · đuôi ${tail.length} ký tự`);

// 4) dựng dòng mới: bọc thân vào EntityDetailModal (giữ NGUYÊN thân + giữ modal tổng hợp ở đuôi)
const novo =
  head +
  '<EntityDetailModal open onClose={close} title={`PHIẾU ĐỀ NGHỊ MUA HÀNG · ${request.requestNo}`} ' +
  'subtitle={<>{request.projectCode} · {request.projectName} · {statusLabel(request)}</>} entityId={request.requestNo} width="wide" ' +
  'tabs={[{ key: "request-detail", label: "Chi tiết phiếu", content: <>' +
  inner +
  "</> }]} />" +
  tail;
L[ret] = novo;
console.log(`  dòng mới dài ${novo.length} ký tự (thay đổi ${novo.length - line.length})`);
if (!novo.includes('data-contract="VNTECH_REQUEST_DETAIL_ALL_LINES_V1"')) { console.error("✖ MẤT data-contract của khối tổng hợp ⇒ DỪNG"); process.exit(1); }
for (const must of ["Trả lại CHT", "Duyệt bước", "Tải Excel", "Tải PDF"]) if (!novo.includes(must)) { console.error(`✖ MẤT nút "${must}" ⇒ DỪNG`); process.exit(1); }
console.log("  kiểm nội dung: data-contract ✔ · 4 nút hành động ✔");

if (!APPLY) { console.log("CHẠY KHÔ: mốc hợp lệ, nội dung đủ ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
writeFileSync(F, L.join(NL));
console.log("ĐÃ GHI: app/page.tsx — RequestDrawer nay render qua EntityDetailModal.");
