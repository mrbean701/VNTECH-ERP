// ĐỌC LẠI tools/e2e/action-registry.json và in báo cáo cho người đọc.
//
// In ra:
//   1. Tổng số action.
//   2. Số action theo từng nhóm nghiệp vụ.
//   3. Danh sách ĐẦY ĐỦ action của 4 nhóm quan trọng nhất: mua-hang, kho, workflow, quan-tri
//      (kèm số dòng trong SystemController.java để tra nhanh).
//   4. Danh sách action của 2 nhóm còn lại (nhan-su, ke-toan-vat-tu) cho đủ bộ.
//   5. Các lưu ý quan trọng về những action KHÔNG tồn tại (tách PO, đặt PO, workflow...).
//   6. Danh sách chênh lệch so với bản Node legacy.
//
// CHẠY: node tools/e2e/bao-cao-action.mjs
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
const duongDan = resolve(GOC, "tools/e2e/action-registry.json");
const duLieu = JSON.parse(readFileSync(duongDan, "utf8"));

const dong = (t) => t.padEnd(46, " ");
const ke = (s, n) => (s + " ".repeat(n)).slice(0, n);

console.log("════════════════════════════════════════════════════════════════════════════");
console.log("  BÁO CÁO ACTION API  POST http://127.0.0.1:9000/api/system");
console.log("  Nguồn: " + duLieu.switchJava.file);
console.log("         switch(action) tại dòng " + duLieu.switchJava.dongSwitch
  + " · nhánh default tại dòng " + duLieu.switchJava.dongNhanhDefault);
console.log("════════════════════════════════════════════════════════════════════════════");
console.log("");
console.log("TỔNG SỐ ACTION: " + duLieu.tongSoAction);
console.log("");
console.log("── SỐ ACTION THEO TỪNG NHÓM ─────────────────────────────────────────────────");
const tong = duLieu.tongSoAction;
for (const [nhom, so] of Object.entries(duLieu.theoNhom)) {
  const thanh = Math.round((so / tong) * 40);
  console.log(`  ${ke(nhom, 18)} ${ke(String(so), 5)} ${"█".repeat(thanh)}  ${duLieu.moTaNhom[nhom]}`);
}

const nhomQuanTrong = ["mua-hang", "kho", "workflow", "quan-tri"];
for (const nhom of nhomQuanTrong) {
  const ds = duLieu.actions.filter((a) => a.nhom === nhom);
  console.log("");
  console.log(`── NHÓM ${nhom.toUpperCase()} (${ds.length} action) ${"─".repeat(Math.max(0, 52 - nhom.length))}`);
  for (const a of ds) {
    const rbac = a.moduleRbac ? ` · module ${a.moduleRbac}` : (a.moduleRbac === "" ? " · (không gắn module)" : "");
    const p = a.congKhai ? " · công khai" : "";
    console.log(`  ${ke(a.ten, 46)} dòng ${String(a.dong).padStart(4)}${rbac}${p}`);
    if (a.ghiChu) console.log(`      ↳ ${a.ghiChu.slice(0, 150)}`);
  }
}

for (const nhom of ["ke-toan-vat-tu", "nhan-su", "khac"]) {
  const ds = duLieu.actions.filter((a) => a.nhom === nhom);
  console.log("");
  console.log(`── NHÓM ${nhom.toUpperCase()} (${ds.length} action) — chỉ liệt kê tên ────────`);
  let line = "  ";
  for (const a of ds) {
    if (line.length + a.ten.length + 2 > 100) { console.log(line); line = "  "; }
    line += a.ten + "  ";
  }
  if (line.trim()) console.log(line);
}

console.log("");
console.log("── LƯU Ý QUAN TRỌNG (những action KHÔNG tồn tại trong mã nguồn) ──────────────");
for (const l of duLieu.luuYQuanTrong) {
  console.log(`  ▸ ${l.tinhHuong}`);
  console.log(`      action: ${l.action.join(", ")}`);
  console.log(`      ${l.chiTiet}`);
}

console.log("");
console.log("── CHÊNH LỆCH SO VỚI BẢN NODE LEGACY scripts/system-route.mjs ─────────────────");
console.log("  Chỉ có ở JS, không có trong switch Java:");
for (const a of duLieu.chiCoTrongJsKhongCoTrongJava) {
  console.log(`      ${ke(a.ten, 40)} ${a.file}:${a.dongJs}`);
}
console.log("  Có trong ma trận RBAC nhưng không có nhánh case trong switch Java:");
for (const a of duLieu.chiCoTrongRbacKhongCoTrongJava) {
  console.log(`      ${ke(a.ten, 40)} ${a.file}:${a.dong} · module ${a.module}`);
}
console.log("");
console.log("── NGUỒN ĐÃ DÙNG ───────────────────────────────────────────────────────────");
for (const n of duLieu.nguon) console.log("  • " + n);
console.log("");
