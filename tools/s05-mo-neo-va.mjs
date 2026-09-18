// [PHASE 0B · S-05] Lấy mỏ neo vá: FileStore (port) + FileUseCase (field/ctor) + ApplicationBeansConfig (đấu dây).
import { readFileSync } from "node:fs";
const dump = (file, re, label, max = 12) => {
  console.log(`\n===== ${label} =====`);
  try {
    const lines = readFileSync(file, "utf8").split("\n");
    let n = 0;
    lines.forEach((l, i) => { const t = l.trim(); if (n < max && t && re.test(t)) { console.log(`${i + 1}: ${t.slice(0, 165)}`); n++; } });
    if (!n) console.log("  (không khớp)");
  } catch (e) { console.log("  lỗi: " + e.message); }
};
const app = "java-backend/application/src/main/java/com/vntech/erp/application/";
dump(app + "port/out/FileStore.java", /^\w|interface|List<|Optional|void|Map</, "FileStore (port) — chữ ký method", 16);
dump(app + "service/FileUseCase.java", /private final|public FileUseCase|accessScope|AccessScope|requireProjectAccess|requireWarehouseAccess/, "FileUseCase — field/ctor/dấu hiệu kiểm phạm vi", 12);
dump("java-backend/web/src/main/java/com/vntech/erp/web/config/ApplicationBeansConfig.java", /FileUseCase|FileStore|new FileUseCase/, "ApplicationBeansConfig — đấu dây file", 8);
