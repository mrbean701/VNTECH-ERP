// [PHASE 8 · B1] Tiêm bean RequestStore vào SystemController bằng @Autowired (tránh sửa constructor dài 20+ tham số).
// Mỏ neo: field accessScopeService (dòng ~75). TỰ CHỐI nếu không khớp đúng 1 lần hoặc đã có requestStore.
import { readFileSync, writeFileSync } from "node:fs";
const CTL = "java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java";
const APPLY = process.argv.includes("--apply");
let ctl = readFileSync(CTL, "utf8");
if (/private\s+com\.vntech\.erp\.application\.port\.out\.RequestStore\s+requestStore/.test(ctl)) { console.log("(đã có requestStore — bỏ qua)"); process.exit(0); }
const anchor = "    private final com.vntech.erp.application.rbac.AccessScopeService accessScopeService;";
const n = ctl.split(anchor).length - 1;
if (n !== 1) { console.error("✖ mỏ neo khớp " + n + " lần (cần 1) ⇒ DỪNG"); process.exit(1); }
const injected = anchor + "\n\n" +
  "    /** [WF] PHASE 8 (B1, 18/09) — bean cho CẢNH BÁO phê duyệt (CHỈ CẢNH BÁO, KHÔNG chặn).\n" +
  "     *  Dùng TIÊM TRƯỜNG để không phải sửa constructor dài; Spring tự tiêm theo kiểu. */\n" +
  "    @org.springframework.beans.factory.annotation.Autowired\n" +
  "    private com.vntech.erp.application.port.out.RequestStore requestStore;";
ctl = ctl.replace(anchor, injected);
if (!APPLY) { console.log("CHẠY KHÔ: mỏ neo khớp đủ ⇒ sẵn sàng tiêm (thêm --apply)."); process.exit(0); }
writeFileSync(CTL, ctl);
console.log("ĐÃ GHI: " + CTL + " (tiêm @Autowired RequestStore requestStore)");
