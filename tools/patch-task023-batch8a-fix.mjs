// Vá bổ sung lô 8a: asAdminPrincipal THIẾU override warehouseScopeKind().
//
// Đây là lần THỨ HAI gặp cùng một dương tính giả: phép kiểm "đã có override chưa" dùng CỬA SỔ 900 KÝ TỰ
// kể từ chữ ký helper, mà helper liền sau cũng có override đó ⇒ cửa sổ bắt sang helper khác.
// Lần này neo vào chữ ký + 2 dòng đầu của chính helper (duy nhất), và KIỂM SỐ LẦN XUẤT HIỆN trước khi sửa.
import { readFileSync, writeFileSync } from "node:fs";

const F = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const raw = readFileSync(F, "utf8");
const crlf = raw.includes("\r\n");
let text = raw.replace(/\r\n/g, "\n");

const ANCHOR =
    `    private static AdminSystemUseCase.Principal asAdminPrincipal(AuthUseCase.CurrentUser cu) {\n`
  + `        return new AdminSystemUseCase.Principal() {\n`
  + `            @Override public String userId() { return cu.id(); }\n`
  + `            @Override public String role() { return cu.role(); }\n`;

const n = text.split(ANCHOR).length - 1;
console.log(`So lan xuat hien neo (chi asAdminPrincipal): ${n}`);
if (n !== 1) { console.log("  X   KHONG PHAI 1 — dung, khong sua."); process.exit(1); }

// Kiem chung thuc su: trong than helper nay da co warehouseScopeKind chua?
const bodyStart = text.indexOf(ANCHOR);
const bodyEnd = text.indexOf("};", bodyStart);
const helperBody = text.slice(bodyStart, bodyEnd < 0 ? bodyStart + 400 : bodyEnd);
if (helperBody.includes("warehouseScopeKind()")) {
  console.log("  BO  asAdminPrincipal da co warehouseScopeKind()");
  process.exit(0);
}

const insertAt = text.indexOf(ANCHOR) + ANCHOR.length;
text = text.slice(0, insertAt)
  + `            @Override public String warehouseScopeKind() { return cu.warehouseScopeKind(); }\n`
  + text.slice(insertAt);

// Kiem chung sau khi sua: override phai nam TRONG than asAdminPrincipal
const afterStart = text.indexOf(ANCHOR);
const afterEnd = text.indexOf("};", afterStart);
const afterBody = text.slice(afterStart, afterEnd);
const ok = afterBody.includes("warehouseScopeKind()") && (text.split("asAdminPrincipal(AuthUseCase").length - 1) === 1;
console.log(`Sau khi sua: override nam trong asAdminPrincipal = ${ok}`);
if (!ok) { console.log("  X   KIEM CHUNG THAT BAI — khong ghi tep."); process.exit(1); }

writeFileSync(F, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");
console.log("  APD asAdminPrincipal truyen warehouseScopeKind");
process.exit(0);
