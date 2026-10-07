// USER 28/09/2026 — SỬA 2 HỢP ĐỒNG TEST CŨ cho khớp YÊU CẦU MỚI của user:
//   ① `pr02-project-filters.test.mjs` — bỏ chiều lọc «Phòng ban» (user: «loại bỏ filter phòng ban»)
//   ② `pr03-project-detail-tabs.test.mjs` — bỏ tab «Tổng quan» ⇒ tab BCH dịch 5 → 4
// ⚠️ ĐÂY LÀ HỢP ĐỒNG CŨ BỊ YÊU CẦU MỚI BÁC BỎ — sửa hợp đồng KHÔNG phải sửa lỗi sản phẩm.
// ⚠️ Bài học #43: tự kiểm phải copy NGUYÊN VĂN điều kiện CÒN LẠI, ⛔ không tự đặt lại kỳ vọng.
import { readFileSync, writeFileSync } from "node:fs";

const T2 = "tests/pr02-project-filters.test.mjs";
const T3 = "tests/pr03-project-detail-tabs.test.mjs";
let t2 = readFileSync(T2, "utf8");
let t3 = readFileSync(T3, "utf8");
let ok = 0, bad = 0;
const ap = (buf, label, from, to) => {
  const n = buf.split(from).length - 1;
  if (n !== 1) { console.log("  🔴 " + label + ": khớp " + n + " lần"); bad += 1; return buf; }
  console.log("  ✅ " + label); ok += 1; return buf.replace(from, to);
};

// ── ① PR-02: bỏ chiều «Phòng ban» ──────────────────────────────────────────
t2 = ap(t2, "tiêu đề hợp đồng (bỏ Phòng ban)",
  `test("PR-02 — toolbar DANH SÁCH có ĐỦ 4 CHIỀU lọc (Trạng thái · Quản lý dự án · Phòng ban · Ngày)", () => {`,
  `test("PR-02 — toolbar DANH SÁCH có 3 CHIỀU lọc (Trạng thái · Quản lý dự án · Ngày) — ĐÃ BỎ «Phòng ban» theo yêu cầu user 28/09", () => {`, t2);
t2 = ap(t2, "vòng lặp 3 nhãn (bỏ «Phòng ban»)",
  `  for (const label of ["Trạng thái", "Quản lý dự án", "Phòng ban"]) {`,
  `  for (const label of ["Trạng thái", "Quản lý dự án"]) {`, t2);
// thêm phần ĐỐI CHỨNG: phải KHÔNG còn «Phòng ban» trong filters
t2 = ap(t2, "thêm đối chứng: ⛔ đã bỏ «Phòng ban»",
  `    assert.match(listBranch, new RegExp('label: "' + label + '"'), \`Thiếu chiều lọc "\${label}" trong filters của ListToolbar\`);`,
  `    assert.match(listBranch, new RegExp('label: "' + label + '"'), \`Thiếu chiều lọc "\${label}" trong filters của ListToolbar\`);
  }
  // ĐỐI CHỨNG ÂM (user 28/09/2026): đã BỎ chiều lọc «Phòng ban» ⇒ KHÔNG được xuất hiện nữa.
  assert.doesNotMatch(listBranch, /label: "Phòng ban"/, "Chiều lọc «Phòng ban» đã bị user yêu cầu bỏ nhưng vẫn còn trong toolbar");
  {`, t2);

// ── ② PR-03: tab BCH 5 → 4 + tiêu đề 6 tab → 5 tab ───────────────────────
t3 = ap(t3, "tiêu đề hợp đồng (6 tab → 5 tab)",
  `test("PR-03 — màn dự án tái dùng component chi tiết (PR-01 GIỮ NGUYÊN dải 6 tab)", () => {`,
  `test("PR-03 — màn dự án tái dụng component chi tiết (đã bỏ tab «Tổng quan» theo user 28/09 ⇒ dải còn 5 mục)", () => {`, t3);
t3 = ap(t3, "tab BCH 5 → 4",
  `  assert.match(detailBranch, /\\{tab === 5 && <SiteCommandScreen/, "Tab BCH (chỉ số 5) phải giữ nguyên như PR-01");`,
  `  assert.match(detailBranch, /\\{tab === 4 && <SiteCommandScreen/, "Tab BCH dịch từ chỉ số 5 sang 4 sau khi bỏ tab «Tổng quan»");`, t3);

if (bad > 0) { console.log("  ⛔ KHÔNG ghi tệp — còn " + bad + " chỗ chưa khớp."); process.exit(1); }
writeFileSync(T2, t2, "utf8");
writeFileSync(T3, t3, "utf8");
console.log("  ✅ đã ghi 2 tệp hợp đồng · " + ok + " thay đổi");
