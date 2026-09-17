#!/usr/bin/env node
// VNTECH ERP V5.3.0 — CỔNG CHẶN: MỌI `open("X")` PHẢI CÓ NHÁNH `modal === "X"` (TASK-083 · U-10)
//
// VÌ SAO CÓ CỔNG NÀY (phát hiện thật 18/09/2026):
// Trong `app/page.tsx`, khung modal ở cấp ứng dụng là một chuỗi 36 nhánh `{modal === "X" && <…/>}`.
// Nút chỉ gọi `open("material")` (đặt `modal = "material"`) — nhưng **KHÔNG hề có nhánh `modal === "material"`**.
// Hệ quả ĐO ĐƯỢC: bấm "＋ Thêm vật tư" (và nút "Sửa" / "Ngừng" từng dòng) ở màn **Danh mục vật tư**:
//   • nút KHÔNG bị vô hiệu (đo: `el.disabled === false`),
//   • nhưng KHÔNG khung nào mở ra (đo: `document.querySelector('.modal,.drawer') === null`).
// Đây là lớp lỗi **im lặng**: không exception, không log, `tsc`/eslint đều xanh — chỉ mắt người mới thấy.
// Cổng này biến nó thành phép kiểm tự động, chạy được trong vài mili-giây.
//
// Cách chạy:  node tools/probe-modal-branch-coverage.mjs
// Exit 0 = mọi tên đều có nhánh. Exit 1 = có tên gọi mà không có nhánh (NÚT CHẾT).
//
// ĐỐI CHỨNG DƯƠNG (chống "cổng in hằng số"): cổng tự kiểm 2 điều kiện nền —
//   (1) phải đọc được ÍT NHẤT 20 nhánh modal (nếu 0 ⇒ bộ tách hỏng, không được kết luận ĐẠT);
//   (2) phải đọc được ÍT NHẤT 15 tên `open(...)`.
// Ngoài ra cổng in **số nhánh modal** và **danh sách tên thiếu nhánh** để người đọc tự kiểm.
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FILES = ["app/page.tsx"];
const MIN_BRANCHES = 20;
const MIN_OPENS = 15;

let pass = 0;
let fail = 0;
let gap = 0;
const kq = [];
const check = (ten, ok, chiTiet) => {
  if (ok) { pass++; kq.push(`  [DAT ] ${ten}${chiTiet ? " :: " + chiTiet : ""}`); }
  else { fail++; kq.push(`  [HONG] ${ten}${chiTiet ? " :: " + chiTiet : ""}`); }
};
const ghiNhan = (ten, chiTiet) => { gap++; kq.push(`  [GHI NHAN] ${ten}${chiTiet ? " :: " + chiTiet : ""}`); };

let src = "";
for (const rel of FILES) src += readFileSync(join(root, rel), "utf8") + "\n";

const branches = [...new Set([...src.matchAll(/modal === "([a-zA-Z0-9_]+)"/g)].map((m) => m[1]))].sort();
const opens = [...new Set([...src.matchAll(/open\("([a-zA-Z0-9_]+)"/g)].map((m) => m[1]))].sort();

console.log(`  Tệp quét: ${FILES.join(" · ")}`);
console.log(`  Nhánh modal cấp ứng dụng: ${branches.length} → ${branches.join(" · ")}`);
console.log(`  Tên gọi qua open(...): ${opens.length} → ${opens.join(" · ")}`);

// (1) ĐỐI CHỨNG DƯƠNG: bộ tách có thật sự đọc được gì không
check("ĐỐI CHỨNG DƯƠNG: đọc được ≥ 20 nhánh modal", branches.length >= MIN_BRANCHES, `${branches.length} nhánh`);
check("ĐỐI CHỨNG DƯƠNG: đọc được ≥ 15 tên open(...)", opens.length >= MIN_OPENS, `${opens.length} tên`);

const missing = opens.filter((n) => !branches.includes(n));
check(
  "Mọi open(\"X\") đều có nhánh modal === \"X\" (không có nút chết)",
  missing.length === 0,
  missing.length ? `THIẾU NHÁNH: ${missing.join(" · ")}` : "không tên nào thiếu nhánh"
);

// (2) Chiều ngược lại: nhánh không ai gọi — KHÔNG tính là HỎNG (có thể mở bằng đường khác), chỉ GHI NHẬN.
const unused = branches.filter((n) => !opens.includes(n));
if (unused.length) ghiNhan("Nhánh modal chưa thấy nơi gọi bằng chuỗi literal (có thể mở bằng biến/đường khác)", `${unused.join(" · ")}`);

// (3) Nút chết cụ thể đã gặp: ghi rõ để người sau tra nhanh
if (missing.includes("material")) {
  kq.push("  [CHI TIET] open(\"material\") KHÔNG có nhánh ⇒ các nút 'Thêm vật tư' / 'Sửa' / 'Ngừng' ở");
  kq.push("           MaterialCatalogPage KHÔNG mở khung nào (đã đo thật 18/09/2026). Nhánh đúng là \"materialMaster\".");
}

console.log("");
for (const line of kq) console.log(line);
console.log("");
console.log(`  KẾT QUẢ: ${pass} ĐẠT · ${fail} HỎNG · ${gap} GHI NHẬN`);
console.log("═".repeat(78));
process.exit(fail ? 1 : 0);
