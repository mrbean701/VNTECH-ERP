// KIỂM KÊ SỨC KHOẺ BỘ TEST — chạy tay: `npm run audit:tests`
//
// VÌ SAO CÓ TỆP NÀY (phát hiện 01/10/2026, vòng 193)
//   `tests/` có 115 tệp nhưng `test:regression` (package.json) chỉ chạy 10.
//   ⇒ 105 tệp KHÔNG được chạy ở BẤT KỲ đâu, kể cả CI. Trong đó có những tệp ĐANG ĐỎ.
//   Một tệp đỏ ngoài cổng = hỏng âm thầm: không ai thấy, không ai biết, hợp đồng chết đi.
//   (Bằng chứng: `tests/mt3-ui-14-admin-notification.test.mjs` đỏ ít nhất từ 27/09/2026.)
//
// NGUYÊN TẮC (giống hệt `KNOWN_DEAD_CANONICAL` trong `verify:css-baseline`)
//   • NỢ CŨ thì GHI NHẬN, không xoá: danh sách `KNOWN_RED` nằm trong `scripts/regression-suite.mjs`.
//   • NỢ MỚI thì CHẶN: một tệp đỏ KHÔNG nằm trong `KNOWN_RED` ⇒ script trả exit ≠ 0.
//   ⇒ Cổng bảo vệ "đừng làm hỏng thêm", đồng thời bảo vệ "đừng giấu nợ cũ đi".
//
// ⛔ CỐ Ý KHÔNG nằm trong `npm test`: chạy 115 tiến trình node mất vài phút,
//   quá nặng cho mỗi lần sửa. Chạy tay trước khi chốt mốc.
//
// ⚠️ BẮT BUỘC khi chạy: `node --import tsx --test <tệp>`.
//   Bỏ `--import tsx` thì mọi tệp import `.tsx` sẽ chết với ERR_UNKNOWN_FILE_EXTENSION
//   ⇒ báo đỏ 16 tệp một cách GIẢ. Đã dính lỗi này 1 lần (vòng 193), không lặp lại.
import { execFileSync } from "node:child_process";
import { knownRedNames, allTests, gateTests } from "./regression-suite.mjs";

// 📌 VÔNG 197 — `KNOWN_RED` và danh sách cổng ĐÃ CHUYỂN sang `scripts/regression-suite.mjs`
//   (nguồn sự thật duy nhất) để tệp kiểm kê này và cổng `npm run test:regression` không thể lệch nhau.
//   Trước đây danh sách cổng đượC bóc bằng regex từ chuỗi `test:regression` trong `package.json`
//   — vừta dễ vừta im lặng bỏ sót tệp thử mới.
// 📌 VÔNG 196 — ĐÃ PHÂN LOạI LẠI các tệp đệ theo bằng chứng: 8 tệp đệ vì ĐợT MT3 ĐÃ ROLLBACK
//   (7 tệp `mt3-*` + `p2-d4`, vì test đệ của nó mang dấu MT3-B.2 ngay trong tên). KHÔNG còn tệp đệ không-MT3 nào.
//   `pr03` đã xanh (khẳng định sót từ PR-01, đột biến 6/6).

// ────────── ĐọC cổNG để biết tệp nào đượC CHẢY THẬT ──────────
const inGate = new Set(gateTests());

const files = allTests();
const num = (text, key) => {
  const m = text.match(new RegExp("\\u2139\\s+" + key + "\\s+(\\d+)"));
  return m ? Number(m[1]) : null;
};

const rows = [];
for (const file of files) {
  let out = "";
  try {
    out = execFileSync("node", ["--import", "tsx", "--test", "tests/" + file], {
      encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 180000, maxBuffer: 64e6,
    });
  } catch (e) {
    out = (e.stdout || "") + (e.stderr || "");
  }
  const total = num(out, "tests");
  const failed = num(out, "fail");
  rows.push({ file, total, failed, green: !failed, gate: inGate.has(file) });
}

const red = rows.filter((r) => !r.green);
const newRed = red.filter((r) => !knownRedNames.has(r.file));
const staleKnown = [...knownRedNames].filter((name) => rows.find((r) => r.file === name)?.green);
const uncovered = rows.filter((r) => !r.gate);
// 📌 VÒNG 197 — tệp ngoài cổng thì ĐƯỢC PHÉP, nhưng chỉ khi đã ghi trong `KNOWN_RED`.
//   Tệp ngoài cổng mà KHÔNG có trong `KNOWN_RED` = tệp lọt khỏi cổng ⇒ báo đỏ.
const uncoveredNo = uncovered.filter((r) => !knownRedNames.has(r.file));

const line = (r) => "  " + (r.green ? "xanh" : "DO  ") + "  " + String(r.failed ?? "?").padStart(3) + "/" + String(r.total ?? "?").padEnd(3) + " ca  " + (r.gate ? "[TRONG GATE]" : "[ngoai gate]") + "  " + r.file;

console.log("KIEM KE SUC KHOE BO TEST — " + new Date().toISOString().slice(0, 10));
console.log("=".repeat(92));
for (const r of red) console.log(line(r));
console.log("=".repeat(92));
console.log("Tong tep       : " + rows.length + " tep · " + rows.reduce((s, r) => s + (r.total || 0), 0) + " test case");
console.log("Xanh           : " + rows.filter((r) => r.green).length + " tep");
console.log("DO             : " + red.length + " tep · " + red.reduce((s, r) => s + (r.failed || 0), 0) + " test case");
console.log("Trong gate     : " + rows.filter((r) => r.gate).length + " tep · " + rows.filter((r) => r.gate).reduce((s, r) => s + (r.total || 0), 0) + " test case");
console.log("Ngoai gate     : " + uncovered.length + " tep / " + uncovered.reduce((s, r) => s + (r.total || 0), 0) + " test case — DEBIT DA BIET, co y khong chay trong cong (xem `KNOWN_RED`)");

if (newRed.length) {
  console.log("\n❌ NO MOI — phai xu ly hoac ghi nhan vao KNOWN_RED truoc khi chot moc:");
  for (const r of newRed) console.log("   " + r.file + " (" + r.failed + "/" + r.total + " ca)");
  console.log("\n❌ Cung do: cac tep sau xanh lai — hay XOA khoi KNOWN_RED de nen no khong bi gia bao");
  for (const f of staleKnown) console.log("   " + f);
}
if (red.some((r) => r.gate)) {
  console.log("\n❌ Co tep DO nhung lai NAM TRONG CUNG — phai sua ngay:");
  for (const r of red.filter((r) => r.gate)) console.log("   " + r.file);
}
if (uncoveredNo.length) {
  console.log("\n❌ Co tep NGOAI CONG nhung CHUA duoc ghi trong `KNOWN_RED` — xem `scripts/regression-suite.mjs`:");
  for (const r of uncoveredNo) console.log("   " + r.file);
  console.log("   (Tep thu KHONG duoc chay o dau = hop dong chet di im lang. Sua hoac ghi nhan no.)");
}
if (!newRed.length && !red.some((r) => r.gate) && !staleKnown.length && !uncoveredNo.length) {
  console.log("\n✅ DAT: khong co test do MOI · khong co test do nam trong cung · KNOWN_RED van dung hien luc.");
  console.log("   MOI tep thu deu duoc chay trong cong. No cu con lai da duoc ghi nhan: " + red.length + " tep / " + red.reduce((s, r) => s + (r.failed || 0), 0) + " ca.");
}
process.exit(newRed.length || red.some((r) => r.gate) || uncoveredNo.length ? 1 : 0);