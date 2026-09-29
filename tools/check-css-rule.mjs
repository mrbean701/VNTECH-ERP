// Kiểm tra luật "ẩn nhãn" có THẬT SỰ nằm trong bundle CSS đã build hay không.
import { readdirSync, readFileSync } from "node:fs";
const d = "dist/client/assets";
for (const f of readdirSync(d)) {
  if (!f.endsWith(".css")) continue;
  const t = readFileSync(d + "/" + f, "utf8");
  console.log("  tep: " + f + " · " + t.length + " bytes");
  const rules = t.match(/\.list-toolbar[^{}]*list-toolbar-field>span[^{}]*\{[^}]*\}/g) || [];
  console.log("  so luat chua 'list-toolbar-field>span': " + rules.length);
  for (const r of rules.slice(0, 4)) console.log("     " + r.replace(/\s+/g, " ").slice(0, 180));
  const hasNone = /\.list-toolbar[^{}]*list-toolbar-field>span[^{}]*\{[^}]*display:\s*none/.test(t);
  console.log("  co luat display:none cho span? " + (hasNone ? "✅ CO — CSS ĐÃ VÀO BUNDLE" : "🔴 KHONG"));
}
