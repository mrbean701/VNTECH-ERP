// USER 28/09/2026 — SỬA HỢP ĐỒNG PR-03 (tab BCH 5 → 4) bằng REGEX để chịu CRLF.
import { readFileSync, writeFileSync } from "node:fs";

const T3 = "tests/pr03-project-detail-tabs.test.mjs";
let t3 = readFileSync(T3, "utf8");
const before = t3;

const RULES = [
  [/test\("PR-03 — màn dự án tái dụng component chi tiết \(PR-01 GIỮ NGUYÊN dải 6 tab\)"/,
   'test("PR-03 — màn dự án tái dụng component chi tiết (đã bỏ tab «Tổng quan» theo user 28/09/2026 ⇒ dải còn 5 mục)"'],
  [/\{\\tab === 5 && <SiteCommandScreen[\s\S]{0,120}?/,
   '{tab === 4 && <SiteCommandScreen/'],
];
let ok = 0, bad = 0;
for (const [rx, rep] of RULES) {
  if (!rx.test(t3)) { console.log("  🔴 không khớp: " + rx.source.slice(0, 60)); bad += 1; continue; }
  t3 = t3.replace(rx, rep); ok += 1;
  console.log("  ✅ " + rep.slice(0, 70));
}
if (bad > 0) { console.log("  ⛔ KHÔNG ghi."); process.exit(1); }
writeFileSync(T3, t3, "utf8");
console.log("  ✅ đã ghi " + T3);

// In lại phần vừa sửa để user đối chiếu bằng mắt
const after = readFileSync(T3, "utf8").split(/\r?\n/);
console.log("  ── đoạn đã sửa ──");
after.filter((l) => /PR-03 — màn dự án|SiteCommandScreen/.test(l)).forEach((l) => console.log("     " + l.trim().slice(0, 160)));
