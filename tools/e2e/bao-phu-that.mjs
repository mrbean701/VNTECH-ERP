// GO-LIVE 05/10/2026 — CÔNG CỤ THƯỜNG TRỰC: **BAO PHỦ THẬT** (action đã GỌI THÀNH CÔNG).
//
// ⛔⛔ VÌ SAO CÓ CÔNG CỤ NÀY — PHÉP ĐO CŨ CỦA TÔI GÂY HIỂU NHẦM NGHIÊM TRỌNG:
//   Phép đo cũ chỉ hỏi «**tên action có XUẤT HIỆN trong tệp test không**» ⇒ cho **204/220 = 93%**
//   ⇒ ⛔ **nghe rất tốt nhưng NGHĨA HẸP HƠN NHIỀU**: nó ⛔ **không phân biệt** giữa
//      · một bài test **GỌI THÀNH CÔNG** action, và
//      · một bài test **gọi với ID BỊA để kiểm đường TỪ CHỐI** (400 «Không tìm thấy …»).
//   ⭐ ĐO THẬT (công cụ này, trên `tools/e2e/bien-chung.jsonl` — 5567 dòng · 2162 lệnh gọi):
//      **chỉ 69/220 = 31%** action **từng gọi THÀNH CÔNG** (`ok:true`);
//      **151/220 CHỈ TỪNG NHẬN LỖI** ⇒ ⭐ **đường THÀNH CÔNG chưa từng chạy**.
//   ⚠️ VÀ 2 LỖI THẬT của phiên này (`check_material_alias_conflicts` · `preview_material_dependencies`)
//      **nằm đúng trong nhóm 151 đó** ⇒ ⭐ **đường từ chối được phủ rộng ⛔ KHÔNG có nghĩa đường thành công đã chạy**.
//
// CÁCH DÙNG:  node tools/e2e/bao-phu-that.mjs            # in tóm tắt + danh sách chưa từng thành công
//             node tools/e2e/bao-phu-that.mjs --chi-ok   # chỉ in các action ĐÃ thành công
//
// ⓘ NGUỒN: `tools/e2e/client.mjs` đã tự ghi bằng chứng từ mọi lệnh gọi (`ghi({loai:"action", …})`)
//   ⇒ ⭐ dữ liệu này **đã được thu tự động**, ⛔ không cần gọi lại API.
// ⚠️ Tệp bằng chứng tích luỹ qua NHIỀU PHIÊN ⇒ «đã từng thành công» là phép đo **tích luỹ**, ⛔ không phải của riêng phiên này.
import { readFileSync, existsSync } from "node:fs";

const TEP = "tools/e2e/bien-chung.jsonl";
const CHI_OK = process.argv.includes("--chi-ok");
if (!existsSync(TEP)) { console.log("⛔ không thấy " + TEP); process.exit(1); }

const dong = readFileSync(TEP, "utf8").split("\n").filter(Boolean);
const suKien = dong.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
const goi = suKien.filter((e) => e.loai === "action" && e.action);

const ok = new Set(), loi = new Map(), soLan = new Map();
for (const e of goi) {
  soLan.set(e.action, (soLan.get(e.action) || 0) + 1);
  if (e.ok) ok.add(e.action);
  else if (!loi.has(e.action)) loi.set(e.action, String(e.loi || e.status || "").slice(0, 70));
}

// Đối chiếu với danh sách action THẬT trong controller (bỏ khoá ánh xạ lỗi MySQL)
const cc = readFileSync("java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java", "utf8");
const that = [...new Set([...cc.matchAll(/case\s+((?:"[a-z][\w]+"\s*,?\s*)+)->/g)]
  .flatMap((m) => [...m[1].matchAll(/"([a-z][\w]+)"/g)].map((x) => x[1])))]
  .filter((a) => !/_uidx|_no_uidx|^primary_key/.test(a)).sort();

const chua = that.filter((a) => !ok.has(a));
const ts = suKien.map((e) => e.ts).filter(Boolean).sort();

console.log("=".repeat(80));
console.log("BAO PHỦ THẬT — action đã GỌI THÀNH CÔNG (⛔ không phải «có nhắc tên trong tệp test»)");
console.log("=".repeat(80));
console.log(`   Nguồn : ${TEP} · ${dong.length} dòng · ${goi.length} lệnh gọi action`);
if (ts.length) console.log(`   Khoảng: ${ts[0]} → ${ts[ts.length - 1]}  ⚠️ tích luỹ nhiều phiên`);
console.log("");
console.log(`   Tổng action THẬT trong controller       : ${that.length}`);
console.log(`   ✅ ĐÃ GỌI THÀNH CÔNG (ok:true)          : ${ok.size}  (${Math.round(ok.size / that.length * 100)}%)`);
console.log(`   ⛔ CHƯA TỪNG GỌI THÀNH CÔNG            : ${chua.length}  (${Math.round(chua.length / that.length * 100)}%)`);
console.log("");
console.log("   ⛔⛔ CẢNH BÁO CÁCH ĐỌC: con số «tên action xuất hiện trong tệp test» (đo cách khác)");
console.log("      cho ~93% — ⭐ NHƯNG đó là CẬN TRÊN, vì bài «ID BỊA ⇒ 400» chỉ chạy ĐƯỜNG TỪ CHỐI.");
if (CHI_OK) {
  console.log(`\n=== ✅ ĐÃ THÀNH CÔNG (${ok.size}) ===`);
  for (const a of [...ok].sort()) console.log(`   ${a.padEnd(34)} gọi ${soLan.get(a)} lần`);
} else {
  console.log(`\n=== ⛔ CHƯA TỪNG THÀNH CÔNG (${chua.length}) ===`);
  for (const a of chua) console.log(`   ${a.padEnd(34)} ${loi.has(a) ? "· chỉ từng lỗi: " + loi.get(a) : "· CHƯA TỪNG ĐƯỢC GỌI"}`);
}
console.log("\n   ⓘ Mỗi dòng vẫn cần đọc ngữ cảnh: «chỉ từng lỗi» có thể là do bài test CỐ Ý kiểm đường từ chối.");
