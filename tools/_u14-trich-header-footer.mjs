// U-14 bước 3/6 — trích 3 đoạn cần để dựng `EntityDetailModal`: header (→ title/subtitle/actions) và footer.
import { readFileSync } from "node:fs";
const LINE = Number(process.argv[2] || 2894);
const line = readFileSync("app/page.tsx", "utf8").split("\n")[LINE - 1];
const slice = (a, b) => line.slice(a, b);
const find1 = (needle, from = 0) => { const i = line.indexOf(needle, from); if (i < 0) throw new Error(`không thấy ${needle}`); return i; };

const headerOpen = find1("<header>"), headerClose = find1("</header>", headerOpen);
const bodyOpen = find1('<div className="drawer-body">', headerClose);
const footerOpen = find1("<footer", bodyOpen), footerClose = find1("</footer>", footerOpen);
console.log("=== HEADER (giữa <header> và </header>) ===");
console.log(slice(headerOpen + 8, headerClose));
console.log("\n=== FOOTER (giữa <footer…> và </footer>) ===");
const gt = line.indexOf(">", footerOpen);
console.log(slice(gt + 1, footerClose));
console.log("\n=== 3 dòng đầu của drawer-body (ngay sau khi mở) ===");
console.log(slice(bodyOpen, bodyOpen + 120));
