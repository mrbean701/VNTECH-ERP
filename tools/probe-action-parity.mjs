// ĐO SAI LỆCH ACTION GIỮA HAI NGUỒN: bản JS tham chiếu và bản Java đã port
//
// VÌ SAO CẦN: báo cáo audit từng ghi "ACTION_CATALOG.json có 174 action, SystemController có 224
// nhánh case ⇒ catalog lệch 50 action". NHƯNG catalog được SINH từ `scripts/system-route.mjs`
// (bản JS tham chiếu) chứ không phải từ Java — nên đó là so SAI hai nguồn. Công cụ này so đúng:
//   • Tập action trong `scripts/system-route.mjs`      (bản JS tham chiếu)
//   • Tập action trong `SystemController.java`         (bản Java đã port)
// rồi phân loại: chỉ có ở JS · chỉ có ở Java · có ở cả hai.
//
// Phân loại này quyết định việc phải làm: action CHỈ CÓ Ở JAVA là tính năng thêm khi port (bình
// thường, nhưng phải có trong catalog để không mất dấu vết quyền); action CHỈ CÓ Ở JS là thiếu sót
// của bản Java.
//
//   node tools/probe-action-parity.mjs
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function findFile(dir, name, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (!["node_modules", "target", ".git", "dist"].includes(e.name)) findFile(p, name, out); }
    else if (e.name === name) out.push(p);
  }
  return out;
}

const jsPath = join(ROOT, "scripts", "system-route.mjs");
const javaHit = findFile(join(ROOT, "java-backend"), "SystemController.java");
if (!existsSync(jsPath)) { console.error("Không thấy scripts/system-route.mjs"); process.exit(1); }
if (!javaHit.length) { console.error("Không thấy SystemController.java"); process.exit(1); }
const javaPath = javaHit[0];

const jsText = readFileSync(jsPath, "utf8");
const javaText = readFileSync(javaPath, "utf8");

// Bản JS: các nhánh `if (action === "xxx")`
const jsActions = new Set();
for (const m of jsText.matchAll(/action\s*===\s*"([a-z0-9_]+)"/g)) jsActions.add(m[1]);

// Bản Java: các nhánh `case "xxx" ->` hoặc `case "xxx":`
// CẢNH BÁO: SystemController có NHIỀU switch, trong đó có switch duyệt TÊN CHỈ MỤC SQL. Nếu bắt
// hết mọi `case` thì sẽ đếm nhầm cả những tên như `users_username_uidx` hay `primary_key_f` thành
// action (đây chính là lỗi tôi từng mắc khi viết báo cáo audit). Vì vậy phải TÁCH hai nhóm.
const javaAllCases = new Set();
for (const m of javaText.matchAll(/case\s+"([a-z0-9_]+)"\s*(?:->|:)/g)) javaAllCases.add(m[1]);

// Tên trông giống chỉ mục/khoá SQL chứ không phải action nghiệp vụ.
const SQLISH = /(_uidx|_idx$|^primary_key|_key$|_no_uidx$)/;
const javaActions = new Set([...javaAllCases].filter((a) => !SQLISH.test(a)));
const javaNonActions = [...javaAllCases].filter((a) => SQLISH.test(a)).sort();

const onlyJs = [...jsActions].filter((a) => !javaActions.has(a)).sort();
const onlyJava = [...javaActions].filter((a) => !jsActions.has(a)).sort();
const both = [...jsActions].filter((a) => javaActions.has(a)).sort();

console.log("═".repeat(86));
console.log("  SAI LỆCH ACTION — bản JS tham chiếu  vs  bản Java đã port");
console.log("═".repeat(86));
console.log("  Nguồn JS   : " + jsPath.replace(ROOT + "\\", "").replace(/\\/g, "/"));
console.log("  Nguồn Java : " + javaPath.replace(ROOT + "\\", "").replace(/\\/g, "/"));
console.log("");
console.log("  Số action trong JS   : " + jsActions.size);
console.log("  Số nhánh case trong Java (thô) : " + javaAllCases.size);
console.log("  Trong đó là TÊN CHỈ MỤC SQL    : " + javaNonActions.length + " (KHÔNG phải action — bị regex bắt nhầm nếu không tách)");
console.log("  Số action thật trong Java      : " + javaActions.size);
console.log("  Có ở CẢ HAI          : " + both.length);
console.log("  CHỈ CÓ Ở JS          : " + onlyJs.length);
console.log("  CHỈ CÓ Ở JAVA        : " + onlyJava.length);

if (onlyJs.length) {
  console.log("");
  console.log("── CHỈ CÓ Ở JS (bản Java còn thiếu — cần port hoặc giải thích) ──");
  for (const a of onlyJs) console.log("   " + a);
}
if (onlyJava.length) {
  console.log("");
  console.log("── CHỈ CÓ Ở JAVA (thêm khi port — cần có trong catalog để không mất dấu vết quyền) ──");
  for (const a of onlyJava) console.log("   " + a);
}

// Đối chiếu với catalog đang có trên đĩa
const catPath = join(ROOT, "java-backend", "ACTION_CATALOG.json");
if (existsSync(catPath)) {
  const raw = JSON.parse(readFileSync(catPath, "utf8"));
  // Catalog có thể là mảng, hoặc object có khoá `actions` là mảng. ĐỌC SAI CHỖ NÀY sẽ cho ra
  // các khoá số 0,1,2... (lỗi tôi từng mắc) — phải lấy đúng mảng mục.
  const arr = Array.isArray(raw) ? raw : (Array.isArray(raw.actions) ? raw.actions : Object.values(raw.actions || raw));
  const catActions = new Set(arr.map((x) => (typeof x === "string" ? x : (x.action ?? x.name ?? x.id))));
  console.log("");
  console.log("── ĐỐI CHIẾU VỚI ACTION_CATALOG.json (sinh từ nguồn JS) ──");
  console.log("  Số mục trong catalog : " + catActions.size);
  const inJsNotCat = [...jsActions].filter((a) => !catActions.has(a));
  const inCatNotJs = [...catActions].filter((a) => !jsActions.has(a));
  console.log("  Có ở JS nhưng KHÔNG có trong catalog : " + inJsNotCat.length + (inJsNotCat.length ? " → " + inJsNotCat.slice(0, 10).join(", ") : ""));
  console.log("  Có trong catalog nhưng KHÔNG có ở JS : " + inCatNotJs.length + (inCatNotJs.length ? " → " + inCatNotJs.slice(0, 10).join(", ") : ""));
  if (!inJsNotCat.length && !inCatNotJs.length) console.log("  ⇒ Catalog KHỚP HOÀN TOÀN với nguồn JS.");
  const javaMissing = [...jsActions].filter((a) => !javaActions.has(a));
  console.log("");
  console.log("── PARITY BẢN PORT ──");
  console.log("  Action của JS mà Java THIẾU : " + javaMissing.length + (javaMissing.length ? " → " + javaMissing.join(", ") : " (không thiếu action nào)"));
}
console.log("═".repeat(86));
