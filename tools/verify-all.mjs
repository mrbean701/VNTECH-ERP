// USER 28/09/2026 — `tools/verify-all.mjs` — GỘP 4 CỔNG + CỔNG CHẶN CSS THÀNH 1 LỆNH.
//
// VÌ SAO: 4 cổng trước đây phải GÕ TAY từng lệnh mỗi vòng ⇒ dễ quên ⇒ dễ báo "xong" khi
//        thực ra chưa chạy cổng nào (goal §20 — cấm tuyên bố hoàn thành giả).
//        ⇒ 1 lệnh chạy ĐỦ, in BẢNG TỔNG KẾT, EXIT khác 0 nếu BẤT KỲ cổng nào đỏ.
//
// CÁCH DÙNG:  node tools/verify-all.mjs           → 4 cổng + css-guard
//             node tools/verify-all.mjs --quick   → bỏ qua `tsc` (nhanh hơn khi lặp nhanh)
//
// ⚠️ KHÔNG tự sửa lỗi. Chỉ BÁO. Việc sửa là của người đọc báo cáo.
import { spawnSync } from "node:child_process";

const QUICK = process.argv.includes("--quick");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const npx = process.platform === "win32" ? "npx.cmd" : "npx";
// ⛔ KHONG dung `shell:true` cho lenh Node — duong dan co khoang trang se VO ("C:\Program").
const runNode = (args) => spawnSync(process.execPath, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const runNpm = (args) => spawnSync(npm, args, { encoding: "utf8", shell: true, maxBuffer: 64 * 1024 * 1024 });
const out = (r) => String(r.stdout || "") + String(r.stderr || "");
const pick = (s, re) => (String(s).match(re) || [])[1] || null;

const results = [];
function record(name, ok, detail) { results.push({ name, ok, detail }); console.log(`  ${ok ? "✅" : "❌"} ${name.padEnd(22)} ${detail}`); }

// ── 0. CỔNG CHẶN CSS (chạy TRƯỚC, vì lỗi này làm mọi thứ sau đó vô nghĩa) ──
const guard = runNode(["tools/css-comment-guard.mjs"]);
record("css-comment-guard", guard.status === 0, guard.status === 0 ? "OK — không có ghi chú //" : out(guard).trim().split("\n").slice(0, 2).join(" "));

// ── 1. TypeScript ──
if (!QUICK) {
  const t = runNpm(["exec", "--", "tsc", "--noEmit"]);
  const e = t.status === 0 ? "EXIT=0" : out(t).trim().split("\n")[0].slice(0, 150);
  record("tsc --noEmit", t.status === 0, e);
}

// ── 2. HỢP ĐỒNG (tests/*.test.mjs) ──
const c = runNode(["--import", "tsx", "--test", "tests/*.test.mjs"]);
const cs = out(c);
const ct = pick(cs, /tests (\d+)/), cp = pick(cs, /pass (\d+)/), cf = pick(cs, /fail (\d+)/);
record("contract", c.status === 0, `${ct ?? "?"} tests · ${cp ?? "?"} pass · ${cf ?? "?"} FAIL`);

// ── 3. HỒI QUY ──
const r = runNpm(["run", "test:regression"]);
const rs = out(r);
record("regression", r.status === 0, `${pick(rs, /tests (\d+)/) ?? "?"} tests · ${pick(rs, /pass (\d+)/) ?? "?"} pass · ${pick(rs, /fail (\d+)/) ?? "?"} FAIL`);

// ── 4. KIỂM ĐỊNH CSS ──
const v = runNpm(["run", "verify:css-baseline"]);
const vs = out(v);
const okCss = /CSS BASELINE AUDIT:\s*(ĐẠT|PASS)/i.test(vs);
record("css-baseline", okCss, (vs.match(/CSS BASELINE AUDIT:[^\r\n]*/) || ["(không đọc được)"])[0].slice(0, 120));

// ── TỔNG KẾT ──
const bad = results.filter((x) => !x.ok);
console.log("  " + "─".repeat(66));
if (bad.length) {
  console.log(`  ❌ ${bad.length}/${results.length} CỔNG ĐỎ: ${bad.map((x) => x.name).join(", ")}`);
  console.log("  ⛔ KHÔNG được báo 'xong' khi còn cổng đỏ (goal §20).");
  process.exit(1);
}
console.log(`  ✅ TẤT CẢ ${results.length} CỔNG XANH${QUICK ? " (bỏ qua tsc — --quick)" : ""}`);
process.exit(0);
