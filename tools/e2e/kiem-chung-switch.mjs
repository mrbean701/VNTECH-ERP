// KIỂM CHỨNG CHÉO tập action — chạy SAU tools/e2e/trich-xuat-action.mjs.
//
// Mục đích: tìm bằng CÁCH KHÁC rồi so kết quả, để chắc chắn không sót nhánh case nào.
//   (a) quét tự do: mọi dòng có `case "` trong khoảng switch..default (kể cả dạng `}case "..." ->`)
//   (b) đối chiếu với action-registry.json
// Nếu (a) == (b) == 220 thì danh sách trong JSON là đầy đủ.
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const F = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const dong = readFileSync(resolve(GOC, F), "utf8").split(/\r?\n/);
const duLieu = JSON.parse(readFileSync(resolve(GOC, "tools/e2e/action-registry.json"), "utf8"));

const batDau = dong.findIndex((l) => /^\s*switch\s*\(\s*action\s*\)\s*\{\s*$/.test(l));
const ketThuc = dong.findIndex((l, i) => i > batDau && /^\s*default\s*->/.test(l));
console.log(`switch bắt đầu dòng ${batDau + 1} · nhánh default dòng ${ketThuc + 1}`);

// (a) quét tự do — chấp nhận `case "x" ->` và biến thể `}case "x" ->` (gặp ở dòng 1170).
const quet = [];
for (let i = batDau; i < ketThuc; i++) {
  const m = dong[i].match(/case\s+"([a-z0-9_]+)"\s*->/);
  if (m) quet.push({ ten: m[1], dong: i + 1 });
}
const lap = [...new Set(quet.map((a) => a.ten))].filter((t) => quet.filter((a) => a.ten === t).length > 1);
const trongJson = duLieu.actions.map((a) => a.ten);
const thieu = quet.filter((a) => !trongJson.includes(a.ten));
const thua = trongJson.filter((t) => !quet.some((a) => a.ten === t));
const saiDong = duLieu.actions.filter((a) => quet.find((b) => b.ten === a.ten)?.dong !== a.dong);

console.log(`(a) quét tự do trong switch : ${quet.length} nhánh case (${new Set(quet.map((a) => a.ten)).size} tên khác nhau)`);
console.log(`(b) action-registry.json    : ${trongJson.length} action`);
console.log(`tên bị lặp trong switch     : ${lap.length ? lap.join(", ") : "không có"}`);
console.log(`thiếu trong JSON            : ${thieu.length ? thieu.map((a) => a.ten + "@" + a.dong).join(", ") : "không có"}`);
console.log(`thừa trong JSON             : ${thua.length ? thua.join(", ") : "không có"}`);
console.log(`sai số dòng                 : ${saiDong.length ? saiDong.map((a) => a.ten + " (" + a.dong + "≠" + quet.find((b) => b.ten === a.ten)?.dong + ")").join(", ") : "không có"}`);
const ok = thieu.length === 0 && thua.length === 0 && saiDong.length === 0 && lap.length === 0;
console.log("");
console.log(ok ? "KẾT LUẬN: ĐẠT — danh sách trong action-registry.json khớp 100% với mã nguồn."
  : "KẾT LUẬN: HỎNG — có sai lệch, phải sửa lại tệp trích xuất.");
if (!ok) process.exitCode = 1;
