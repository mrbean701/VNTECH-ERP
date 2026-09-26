// Vá bổ sung lô 4: asPurchasePrincipal THIẾU override warehouseScopeKind().
//
// Lần chạy batch4 bỏ qua nhầm vì phép kiểm dùng cửa sổ 1000 ký tự kể từ chữ ký helper, mà
// asStockPrincipal nằm ngay sau và ĐÃ có override đó ⇒ cửa sổ bắt sang helper kế tiếp.
// Lần này neo vào một mẫu 3 dòng chỉ xuất hiện DUY NHẤT ở asPurchasePrincipal, và KIỂM SỐ LẦN
// xuất hiện trước khi sửa — khác 1 là dừng.
import { readFileSync, writeFileSync } from "node:fs";

const F = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const raw = readFileSync(F, "utf8");
const crlf = raw.includes("\r\n");
let text = raw.replace(/\r\n/g, "\n");

// Helper duy nhất có chữ ký này. Neo PHẢI gồm cả chữ ký vì mẫu 3 dòng
// (roleBase → fullName → email) còn xuất hiện ở asReqPrincipal và asOpsTaskPrincipal.
const ANCHOR = `    private static PurchaseManagementUseCase.Principal asPurchasePrincipal(AuthUseCase.CurrentUser cu) {\n`
             + `        return new PurchaseManagementUseCase.Principal() {\n`
             + `            @Override public String userId() { return cu.id(); }\n`
             + `            @Override public String role() { return cu.role(); }\n`
             + `            @Override public String roleBase() { return cu.roleBase(); }\n`;

const count = text.split(ANCHOR).length - 1;
console.log(`Số lần xuất hiện mẫu neo: ${count}`);
if (count !== 1) {
  console.log("  X   KHONG PHAI 1 — dung, khong sua (tranh va sai helper).");
  process.exit(1);
}
if (text.includes("asPurchasePrincipal") && /asPurchasePrincipal[\s\S]{0,600}warehouseScopeKind\(\)/.test(text)) {
  console.log("  BO  asPurchasePrincipal da co warehouseScopeKind()");
  process.exit(0);
}

const insertAt = text.indexOf(ANCHOR) + ANCHOR.indexOf("\n") + 1;
text = text.slice(0, insertAt)
  + `            @Override public String warehouseScopeKind() { return cu.warehouseScopeKind(); }\n`
  + text.slice(insertAt);

writeFileSync(F, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");
console.log("  APD asPurchasePrincipal truyen warehouseScopeKind");
process.exit(0);
