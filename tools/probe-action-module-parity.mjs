// Đối chiếu BẢN ĐỒ action -> module + capability giữa JS (nguồn sự thật) và Java.
//
// Vì sao cần: tầng 1 RBAC (requireActionModule) quyết định CHO/CHẶN dựa trên bản đồ này cộng với
// dữ liệu user_module_permissions. Nếu bản đồ Java khác JS thì mọi kết luận "chặn oan" đều vô nghĩa.
// ActionRbacRegistry.java được sinh tự động từ ACTION_CATALOG.json (nguồn: JS), nên phép kiểm này
// bảo vệ khỏi TRÔI DẠT giữa lúc sinh và lúc JS đổi.
//
// Chạy: node tools/probe-action-module-parity.mjs
import { readFileSync } from "node:fs";

const JS = "scripts/system-route.mjs";
const JAVA = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java";

const js = readFileSync(JS, "utf8");
const java = readFileSync(JAVA, "utf8");

// --- JS: cắt từ "const ACTION_MODULE = {" đến dấu "};" cân bằng
function sliceObject(text, marker) {
  const at = text.indexOf(marker);
  if (at < 0) throw new Error(`Không thấy ${marker}`);
  const open = text.indexOf("{", at);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    const c = text[i];
    if (c === "{") depth++;
    else if (c === "}") { depth--; if (depth === 0) return text.slice(open, i + 1); }
    else if (c === '"' || c === "'" || c === "`") {
      const q = c; i++;
      while (i < text.length && text[i] !== q) { if (text[i] === "\\") i++; i++; }
    } else if (c === "/" && text[i + 1] === "/") { while (i < text.length && text[i] !== "\n") i++; }
  }
  throw new Error("Không cân bằng được ngoặc");
}

// Khóa của JS KHÔNG có nháy kép (vd: preview_request_import: "requests") nên không dùng JSON.parse.
// Phân tích bằng regex, chấp nhận cả giá trị chuỗi đơn và mảng chuỗi.
const stripComments = (s) => s.replace(/\/\/[^\n]*/g, "");
function parseJsMap(text, marker) {
  const body = stripComments(sliceObject(text, marker));
  const out = {};
  const re = /([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(\[[^\]]*\]|"[^"]*")/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    const key = m[1];
    const raw = m[2];
    out[key] = raw.startsWith("[")
      ? [...raw.matchAll(/"([^"]+)"/g)].map((x) => x[1])
      : [raw.slice(1, -1)];
  }
  return out;
}
const jsModules = parseJsMap(js, "const ACTION_MODULE =");
const jsCaps = parseJsMap(js, "const ACTION_CAPABILITY =");

// --- Java: Map.entry("action", List.of("a","b"))
function parseJavaMap(text, name) {
  const at = text.indexOf(name);
  if (at < 0) throw new Error(`Không thấy ${name}`);
  const body = text.slice(at, text.indexOf(");", at));
  const out = {};
  // Hai dạng giá trị trong Java: List.of("a","b") và chuỗi đơn "canCreate".
  const re = /Map\.entry\(\s*"([^"]+)"\s*,\s*(List\.of\([^)]*\)|"[^"]*")\s*\)/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    out[m[1]] = m[2].startsWith("List.of")
      ? [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1])
      : [m[2].slice(1, -1)];
  }
  return out;
}
const javaModules = parseJavaMap(java, "ACTION_MODULES");
const javaCaps = parseJavaMap(java, "ACTION_CAPABILITIES");

// --- JS: giá trị module có thể là chuỗi hoặc mảng -> chuẩn hoá về mảng
const norm = (v) => (Array.isArray(v) ? v : [v]);

let bad = 0;
const cmp = (label, a, b, keys) => {
  let ok = 0;
  for (const k of keys) {
    const av = norm(a[k]), bv = norm(b[k]);
    if (av.join("|") !== bv.join("|")) {
      console.log(`  LỆCH ${label} ${k}: JS=[${av.join(",")}] Java=[${bv.join(",")}]`);
      bad++;
    } else ok++;
  }
  console.log(`  ${label}: khớp ${ok}/${keys.length}`);
};

const keysM = [...new Set([...Object.keys(jsModules), ...Object.keys(javaModules)])].sort();
const keysC = [...new Set([...Object.keys(jsCaps), ...Object.keys(javaCaps)])].sort();

// CHUẨN HOÁ NGỮ NGHĨA (nếu không sẽ báo lệch giả hàng loạt):
//  - JS: action thiếu trong ACTION_MODULE  -> không kiểm module  ≡ Java List.of() (rỗng)
//  - JS: action thiếu trong ACTION_CAPABILITY -> dùng mặc định "canUse" (system-route.mjs)
//        Java khai báo tường minh "canUse" cho đúng những action đó.
const jsModulesEff = {};
for (const k of keysM) jsModulesEff[k] = norm(jsModules[k] ?? []);
const jsCapsEff = {};
for (const k of keysC) jsCapsEff[k] = norm(jsCaps[k] ?? "canUse");

console.log(`JS  : ACTION_MODULE ${Object.keys(jsModules).length} · ACTION_CAPABILITY ${Object.keys(jsCaps).length}`);
console.log(`Java: ACTION_MODULES ${Object.keys(javaModules).length} · ACTION_CAPABILITIES ${Object.keys(javaCaps).length}\n`);
cmp("MODULE    ", jsModulesEff, javaModules, keysM);
cmp("CAPABILITY", jsCapsEff, javaCaps, keysC);

console.log(bad === 0
  ? "\nKẾT LUẬN: bản đồ module/capability KHỚP HOÀN TOÀN ✅"
  : `\nKẾT LUẬN: ${bad} điểm LỆCH ⚠`);
process.exit(bad === 0 ? 0 : 1);
