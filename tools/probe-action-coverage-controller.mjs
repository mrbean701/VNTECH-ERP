// Liệt kê action mà JS/UI CÓ GỌI nhưng `SystemController.java` KHÔNG có nhánh `case`.
//
// VÌ SAO CẦN (phát hiện ở TASK-040 nhóm 5): action `settle_subcontract` có câu lệnh SQL trong
// `ProductionStoreAdapter` và có trong `ActionRbacRegistry`, NHƯNG không có `case "settle_subcontract"`
// trong controller ⇒ gọi vào sẽ nhận HTTP 400 *"chưa được triển khai trên backend Java (Strangler Fig)"*.
// Nghĩa là câu SQL tôi vừa vá là **MÃ CHẾT**, và các cổng cũ (so danh mục / so thanh ghi RBAC) KHÔNG phát hiện
// được vì chúng không đối chiếu với chính các nhánh `case` đang phục vụ request.
//
// Ba tập được so:
//   A. Java phục vụ : các `case "..."` trong SystemController.java
//   B. JS có mã     : các `action === "..."` trong scripts/system-route.mjs
//   C. UI gọi       : các `action("...")` / `requestApi("...")` trong app/page.tsx
//
// Chạy: node tools/probe-action-coverage-controller.mjs
import { readFileSync } from "node:fs";

const CONTROLLER = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const JS_ROUTE = "scripts/system-route.mjs";
const UI_PAGE = "app/page.tsx";

const read = (p) => readFileSync(p, "utf8");
const names = (src, re) => new Set([...src.matchAll(re)].map((m) => m[1]));

const javaCases = names(read(CONTROLLER), /case\s+"([a-z0-9_]+)"\s*->/g);
const jsActions = names(read(JS_ROUTE), /action\s*===\s*"([a-z0-9_]+)"/g);
const uiActions = new Set([
  ...names(read(UI_PAGE), /\baction\(\s*"([a-z0-9_]+)"/g),
  ...names(read(UI_PAGE), /\brequestApi\(\s*"([a-z0-9_]+)"/g),
]);

console.log(`Java phục vụ (case trong controller) : ${javaCases.size}`);
console.log(`JS có mã (action === "…")            : ${jsActions.size}`);
console.log(`UI gọi (action("…"))                 : ${uiActions.size}\n`);

const sort = (s) => [...s].sort();

// 1) UI gọi mà Java KHÔNG có case ⇒ bấm nút sẽ nhận 400 "chưa được triển khai"
const uiMissing = sort(new Set([...uiActions].filter((a) => !javaCases.has(a))));
console.log(`── UI GỌI mà JAVA KHÔNG có nhánh case (${uiMissing.length}) ──`);
if (!uiMissing.length) console.log("  (không có)");
for (const a of uiMissing) {
  console.log(`  ${a}${jsActions.has(a) ? "   [JS có mã — chạy được trên Node]" : "   [!] KHÔNG có mã ở cả JS lẫn Java"}`);
}
console.log("");

// 2) JS có mã mà Java không có case (có thể là chủ ý còn lại ở Node — nhưng phải biết là bao nhiêu)
const jsMissing = sort(new Set([...jsActions].filter((a) => !javaCases.has(a))));
console.log(`── JS CÓ MÃ mà JAVA KHÔNG có nhánh case (${jsMissing.length}) ──`);
for (const a of jsMissing) console.log(`  ${a}${uiActions.has(a) ? "   [UI có gọi]" : ""}`);
console.log("");

// 3) Java có case mà JS không có (đã biết: action Java-only)
const javaOnly = sort(new Set([...javaCases].filter((a) => !jsActions.has(a))));
console.log(`── JAVA có case mà JS không có mã (${javaOnly.length}) ──`);
for (const a of javaOnly) console.log(`  ${a}`);
console.log("");

console.log(`TỔNG: ${uiMissing.length} action UI gọi sẽ hỏng trên đường Java (HTTP 400).`);
process.exitCode = uiMissing.length ? 1 : 0;
