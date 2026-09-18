// [U-14] Thêm DUMP_HEAD: in 520 ký tự ĐẦU của JSX mới (chỗ nghi có `<>` không đóng) — manh mối 6.3.
import { readFileSync, writeFileSync } from "node:fs";
const FILE = "tools/chuyen-drawer-sang-edm.mjs";
const APPLY = process.argv.includes("--apply");
let text = readFileSync(FILE, "utf8");
const find = '  const ts = createRequire(import.meta.url)("typescript");';
const n = text.split(find).length - 1;
if (n !== 1) { console.error(`✖ mỏ neo khớp ${n} lần (cần 1) ⇒ DỪNG`); process.exit(1); }
const repl = `  if (process.env.DUMP_HEAD) {
    console.log("=== ĐẦU JSX MỚI (520 ký tự) ===");
    console.log(newJsx.slice(0, 520));
    // Cân đối fragment CỦA CẢ JSX MỚI (không chỉ từng con) — đây là phép đo quyết định.
    const o = (newJsx.match(/<>/g) || []).length, c = (newJsx.match(/<\\/>/g) || []).length;
    console.log(\`=== đếm <> = \${o} · </> = \${c}\${o !== c ? "  ⟵ LỆCH FRAGMENT" : "  ⇒ fragment cân"} ===\`);
  }
${find}`;
text = text.replace(find, repl);
if (!APPLY) { console.log("CHẠY KHÔ: mỏ neo khớp đủ ⇒ sẵn sàng (thêm --apply)."); process.exit(0); }
writeFileSync(FILE, text);
console.log("ĐÃ GHI: " + FILE + " (thêm DUMP_HEAD)");
