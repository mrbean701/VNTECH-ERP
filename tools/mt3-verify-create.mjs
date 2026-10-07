// Xac nhan 2 nut Tao da vao ma + 4 cong.
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const t = readFileSync("app/page.tsx", "utf8");
const agg = readFileSync("app/screens/ProjectAggregateTabs.tsx", "utf8");
console.log("  === KIEM TRA MA NGUON ===");
const CHECKS = [
  ["bien canCreateProject", t.includes("const canCreateProject =")],
  ["nut 「＋ Tạo dự án」", t.includes("＋ Tạo dự án")],
  ["goi modal open(projectMaster)", t.includes('open("projectMaster")')],
  ["gate !canCreateProject", t.includes("disabled={!canCreateProject}")],
  ["nut XUAT con nguyen (pr01)", t.includes("disabled={!canExport}")],
  ["fragment </> dong", t.includes("</button></>}\n        />")],
  ["truyen open cho aggregate", t.includes("openEntity={openEntity} open={open}")],
  ["nut 「＋ Tạo tổ đội」", agg.includes("＋ Tạo tổ đội")],
  ["gate canCreateTeam", agg.includes("{canCreateTeam && (")],
];
let bad = 0;
for (const [n, ok] of CHECKS) { if (!ok) bad += 1; console.log("   " + (ok ? "OK  " : "FAIL") + " " + n); }
console.log("  === " + (CHECKS.length - bad) + "/" + CHECKS.length + " ===");

console.log("  === 4 CONG ===");
const run = (cmd) => { try { return execSync(cmd, { encoding: "utf8", shell: "cmd.exe" }); } catch (e) { return (e.stdout || "") + (e.stderr || ""); } };
const tsc = run("npx tsc --noEmit");
console.log("   tsc  : " + (tsc.trim() ? "LOI >>> " + tsc.trim().slice(0, 160) : "EXIT=0 OK"));
const c = run("node --import tsx --test tests/*.test.mjs");
const gl = (re) => (c.match(re) || [])[1] || "?";
console.log("   contract: tests=" + gl(/tests (\d+)/) + " pass=" + gl(/pass (\d+)/) + " fail=" + gl(/fail (\d+)/));
const r = run("npm run test:regression");
const rl = (re) => (r.match(re) || [])[1] || "?";
console.log("   regress : tests=" + rl(/tests (\d+)/) + " pass=" + rl(/pass (\d+)/) + " fail=" + rl(/fail (\d+)/));
process.exit(bad === 0 && !tsc.trim() ? 0 : 1);
