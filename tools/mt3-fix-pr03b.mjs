// USER 28/09/2026 — SỬA HỢP ĐỒNG PR-03: tab BCH dịch 5 → 4 (sau khi bỏ tab «Tổng quan»).
// ⚠️ Dùng thay CHUỖI ĐƠN GIẢN (⛔ không regex) vì regex trước không khớp — tránh mọi ký tự đặc biệt.
import { readFileSync, writeFileSync } from "node:fs";

const T3 = "tests/pr03-project-detail-tabs.test.mjs";
let t3 = readFileSync(T3, "utf8");

// ① điều kiện THEN CHẤT (bắt buộc phải sửa để test xanh)
const OLD = "{tab === 5 && <SiteCommandScreen";
const NEW = "{tab === 4 && <SiteCommandScreen";
const n = t3.split(OLD).length - 1;
if (n === 0) { console.log("  🔴 không tìm thấy: " + OLD); process.exit(1); }
if (n > 1) { console.log("  🔴 khớp " + n + " lần — DỪNG"); process.exit(1); }
t3 = t3.replace(OLD, NEW);
console.log("  ✅ " + OLD + "  ->  " + NEW);

// ② câu chữ giải thích (không ảnh hưởng test)
const OLD2 = "Tab BCH (chỉ số 5) phải giữ nguyên như PR-01";
const NEW2 = "Tab BCH dịch từ chỉ số 5 sang 4 sau khi bỏ tab Tổng quan";
if (t3.includes(OLD2)) { t3 = t3.replace(OLD2, NEW2); console.log("  ✅ cập nhật câu chữ"); }
else console.log("  (không tìm thấy câu chữ — bỏ qua, không ảnh hưởng test)");

writeFileSync(T3, t3, "utf8");
console.log("  ✅ đã ghi " + T3);
readFileSync(T3, "utf8").split(/\r?\n/).filter((l) => l.includes("SiteCommandScreen")).forEach((l) => console.log("     " + l.trim().slice(0, 165)));
