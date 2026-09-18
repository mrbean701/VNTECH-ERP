// [U-14] KHOANH VỊ TRÍ JSX LỆCH: chạy công cụ chuyển (chạy khô), đọc chẩn đoán của tự kiểm PARSER,
// quy đổi offset tuyệt đối về vị trí TRONG DÒNG 2894 rồi in ngữ cảnh + đuôi JSX mới để biết chỗ hụt thẻ.
// (Viết tệp .mjs theo đúng bài học: KHÔNG dùng `node -e` vì PowerShell phá dấu nháy.)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const PAGE = "app/page.tsx";
const LINE = 2894;
let out = "";
try { out = execFileSync(process.execPath, ["tools/chuyen-drawer-sang-edm.mjs"], { encoding: "utf8" }); }
catch (e) { out = `${e.stdout || ""}${e.stderr || ""}`; }

const diag = out.split("\n").find((l) => l.includes("TS17015")) || "";
console.log("chẩn đoán:", diag.trim().slice(0, 220));

const src = readFileSync(PAGE, "utf8");
const lines = src.split("\n");
const lineStart = lines.slice(0, LINE - 1).reduce((s, l) => s + l.length + 1, 0);
const m = diag.match(/TS17015@(\d+)/);
if (m) {
  const rel = Number(m[1]) - lineStart;
  console.log(`offset tuyệt đối ${m[1]} ⇒ trong dòng ${LINE}: ký tự ${rel}`);
  const line = lines[LINE - 1];
  console.log("ngữ cảnh (trước/sau):");
  console.log("  …" + line.slice(Math.max(0, rel - 200), rel + 80) + "…");
}

// Đuôi JSX mới: nếu thiếu `</>` thì lỗi "fragment chưa đóng" nằm ở cuối.
const tail = out.split("\n").filter((l) => l.includes("JSX mới:"));
console.log("\n" + (tail[0] || "").trim());
const plan = out.split("\n").filter((l) => l.includes("TAB:"));
if (plan[0]) {
  console.log("\nPHÂN BỔ TAB (độ dài từng tab):");
  console.log("  " + plan[0].trim());
}
// Đếm cân đối fragment trong phần thân được tách (giả thuyết: con bị cắt giữa `<>…</>`)
const bodyStart = lines[LINE - 1].indexOf('<div className="drawer-body">');
const footerAt = lines[LINE - 1].indexOf("<footer");
if (bodyStart >= 0 && footerAt > bodyStart) {
  const body = lines[LINE - 1].slice(bodyStart, footerAt);
  const openFrag = (body.match(/<>/g) || []).length;
  const closeFrag = (body.match(/<\/>/g) || []).length;
  console.log(`\ncân đối FRAGMENT trong thân drawer-body: mở <> = ${openFrag} · đóng </> = ${closeFrag}` + (openFrag !== closeFrag ? "  ⇒ LỆCH (đây là nguyên nhân)" : " ⇒ cân"));
}
