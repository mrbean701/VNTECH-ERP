// Vá bổ sung lô 2: thêm warehouseScopeKind() vào Principal của StockManagementUseCase.
// (Mẫu cũ giả định thân interface 3 dòng, nhưng TASK-021b đã thêm roleBase() vào đó trước.)
import { readFileSync, writeFileSync } from "node:fs";

const F = "java-backend/application/src/main/java/com/vntech/erp/application/service/StockManagementUseCase.java";
const raw = readFileSync(F, "utf8");
const crlf = raw.includes("\r\n");
let text = raw.replace(/\r\n/g, "\n");

const FROM = `        default String roleBase() { return role(); }
    }`;
const TO = `        default String roleBase() { return role(); }

        /**
         * Loại phạm vi kho của tài khoản (role_catalog.warehouse_scope_kind: "site" | "central").
         * Nhánh kho của canAccessWarehouse dùng giá trị này để chặn thủ kho dự án thao tác Kho Tổng
         * và ngược lại. Mặc định rỗng ⇒ AccessScopeService coi như "site" (đúng JS).
         */
        default String warehouseScopeKind() { return ""; }
    }`;

let msg;
if (text.includes(FROM)) {
  text = text.replace(FROM, TO);
  writeFileSync(F, crlf ? text.replace(/\n/g, "\r\n") : text, "utf8");
  msg = "  APD them warehouseScopeKind() vao Principal cua StockManagementUseCase";
} else if (text.includes("default String warehouseScopeKind()")) {
  msg = "  BO  da co warehouseScopeKind()";
} else {
  msg = "  X   KHONG KHOP";
  writeFileSync(F, raw, "utf8");
  console.log(msg);
  process.exit(1);
}
console.log(msg);
process.exit(0);
