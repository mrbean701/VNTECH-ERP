// SỬA LỖI do patch-task023-batch4b chèn sai vị trí.
//
// Lỗi: dùng `text.indexOf(ANCHOR) + ANCHOR.indexOf("\n") + 1` (sau dòng ĐẦU của neo) thay vì
// `+ ANCHOR.length` (sau dòng CUỐI). Hệ quả: dòng override nằm ngay sau chữ ký phương thức,
// trước `return new ...` ⇒ sai cú pháp.
//
// Sửa: đặt lại đúng thứ tự — override warehouseScopeKind() nằm trong khối khởi tạo vô danh,
// ngay sau roleBase().
import { readFileSync, writeFileSync } from "node:fs";

const F = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const raw = readFileSync(F, "utf8");
const crlf = raw.includes("\r\n");
let text = raw.replace(/\r\n/g, "\n");

const WRONG = `    private static PurchaseManagementUseCase.Principal asPurchasePrincipal(AuthUseCase.CurrentUser cu) {\n`
            + `            @Override public String warehouseScopeKind() { return cu.warehouseScopeKind(); }\n`
            + `        return new PurchaseManagementUseCase.Principal() {\n`
            + `            @Override public String userId() { return cu.id(); }\n`
            + `            @Override public String role() { return cu.role(); }\n`
            + `            @Override public String roleBase() { return cu.roleBase(); }\n`;

const RIGHT = `    private static PurchaseManagementUseCase.Principal asPurchasePrincipal(AuthUseCase.CurrentUser cu) {\n`
            + `        return new PurchaseManagementUseCase.Principal() {\n`
            + `            @Override public String userId() { return cu.id(); }\n`
            + `            @Override public String role() { return cu.role(); }\n`
            + `            @Override public String roleBase() { return cu.roleBase(); }\n`
            + `            @Override public String warehouseScopeKind() { return cu.warehouseScopeKind(); }\n`;

if (text.includes(WRONG)) {
  text = text.replace(WRONG, RIGHT);
  writeFileSync(F, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");
  console.log("  APD sua vi tri chen: asPurchasePrincipal nay dung thu tu");
  process.exit(0);
}
if (text.includes(RIGHT)) {
  console.log("  BO  da dung thu tu roi");
  process.exit(0);
}
console.log("  X   KHONG KHOP — khong sua");
process.exit(1);
