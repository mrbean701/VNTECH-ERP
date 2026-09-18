// Q3 — bóc payload `import_material_catalog` ở 3 phía (UI · JS route · Java) để biết chính xác lệch ở đâu.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync("app/page.tsx", "utf8").split("\n");
console.log("=== UI: app/page.tsx:1755 (importRows) ===");
console.log(page[1754].slice(0, 1400));

const route = readFileSync("scripts/system-route.mjs", "utf8").split("\n");
console.log("\n=== JS route: system-route.mjs 2561..2585 ===");
for (let i = 2560; i < 2586 && i < route.length; i++) console.log(`${i + 1}: ${route[i].slice(0, 220)}`);

console.log("\n=== Java: tệp chứa import (grep 'importMaterialCatalog') ===");
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!name.endsWith(".java")) continue;
    const text = readFileSync(p, "utf8");
    if (/importMaterialCatalog|import_material_catalog/.test(text)) {
      const lines = text.split("\n");
      console.log(`-- ${p} --`);
      lines.forEach((l, i) => { if (/categoryId|categoryCode|subcategory/i.test(l) && /import|categoryId|categoryCode|subcategory/i.test(lines[Math.max(0, i - 0)])) { if (/categoryId|categoryCode|subcategoryCode|findCategory|findSubcategory/.test(l)) console.log(`   ${i + 1}: ${l.trim().slice(0, 200)}`); } });
    }
  }
};
walk("java-backend");
