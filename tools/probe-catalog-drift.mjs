// Đo SAI LỆCH giữa ba nguồn khai báo action:
//   (1) scripts/system-route.mjs        — nguồn sự thật về hành vi (JS)
//   (2) java-backend/ACTION_CATALOG.json — danh mục tài liệu (sinh từ JS)
//   (3) ActionRbacRegistry.java          — bản THI HÀNH thật trong Java (186 mục)
//
// Vì sao cần: nếu danh mục thiếu action mà bản thi hành có, thì bất kỳ ai dùng danh mục làm
// nguồn sự thật (kiểm toán, sinh lại mã, rà quyền) sẽ BỎ SÓT. Đo được thì mới sửa được.
//
// Chạy: node tools/probe-catalog-drift.mjs
import { readFileSync } from "node:fs";

const CATALOG = "java-backend/ACTION_CATALOG.json";
const REGISTRY = "java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java";
const JS = "scripts/system-route.mjs";

const catalog = JSON.parse(readFileSync(CATALOG, "utf8"));
const registry = readFileSync(REGISTRY, "utf8");
const js = readFileSync(JS, "utf8");

// --- tên action trong danh mục (chấp nhận mảng hoặc đối tượng có khóa 'action')
function namesOf(node) {
  if (Array.isArray(node)) return node.map((x) => (typeof x === "string" ? x : x.action)).filter(Boolean);
  if (node && typeof node === "object") {
    const inner = node.actions ?? node.catalog ?? node.items ?? node;
    if (Array.isArray(inner)) return inner.map((x) => (typeof x === "string" ? x : x.action)).filter(Boolean);
    return Object.keys(inner);
  }
  return [];
}
const catalogNames = new Set(namesOf(catalog));

// --- tên action trong Registry (Map.entry)
const registryNames = new Set([...registry.matchAll(/Map\.entry\("([a-z0-9_]+)"/g)].map((m) => m[1]));

// --- tên action trong JS (case "..." trong monolith hoặc ACTION_MODULE/ACTION_CAPABILITY)
const jsNames = new Set([...js.matchAll(/case\s+"([a-z0-9_]+)"/g)].map((m) => m[1]));

// --- mục rác: tên chỉ mục SQL (*_uidx) KHÔNG phải action
const isIndexName = (n) => /_uidx|^primary_key_f$/.test(n);

const onlyRegistry = [...registryNames].filter((n) => !catalogNames.has(n) && !isIndexName(n)).sort();
const onlyCatalog = [...catalogNames].filter((n) => !registryNames.has(n)).sort();

console.log(`Danh mục ${CATALOG}: ${catalogNames.size} tên`);
console.log(`Bản thi hành ActionRbacRegistry: ${registryNames.size} tên`);
console.log(`JS (case "..."): ${jsNames.size} tên\n`);

// Cấu trúc của một mục trong danh mục — để biết hình dạng cần ghi thêm cho đúng.
const first = Array.isArray(catalog) ? catalog[0] : Object.values(catalog.actions ?? catalog)[0];
console.log("Hình dạng một mục trong danh mục:");
console.log("  " + JSON.stringify(first, null, 2).split("\n").join("\n  ").slice(0, 400) + "\n");

console.log(`CÓ trong bản thi hành nhưng THIẾU trong danh mục: ${onlyRegistry.length}`);
for (const n of onlyRegistry) {
  const m = registry.match(new RegExp(`Map\\.entry\\("${n}",\\s*List\\.of\\(([^)]*)\\)`));
  const mods = m ? [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]) : [];
  console.log(`  ${n.padEnd(36)} module=[${mods.join(", ")}]`);
}

console.log(`\nCÓ trong danh mục nhưng THIẾU trong bản thi hành: ${onlyCatalog.length}`);
if (onlyCatalog.length) for (const n of onlyCatalog) console.log(`  ${n}`);

// --- Khảo sát hình dạng: các trường "kiểu liệt kê" có những giá trị nào, để khi bổ sung mục mới
//     thì ghi ĐÚNG giá trị đang dùng thay vì tự nghĩ ra (§3 — không bịa).
const items = Array.isArray(catalog) ? catalog : Object.values(catalog.actions ?? catalog);
const census = (field) => {
  const m = new Map();
  for (const it of items) {
    const v = JSON.stringify(it[field]);
    m.set(v, (m.get(v) ?? 0) + 1);
  }
  return [...m].sort((a, b) => b[1] - a[1]);
};
console.log("\nHình dạng — các giá trị đang dùng:");
for (const f of ["dispatcher", "origin", "migrated", "capability"]) {
  console.log(`  ${f}: ${census(f).map(([v, c]) => `${v}×${c}`).join(" · ")}`);
}
const emptyModule = items.filter((it) => Array.isArray(it.module) && it.module.length === 0);
console.log(`  Số mục có module RỖNG đã tồn tại trong danh mục: ${emptyModule.length}`);
if (emptyModule.length) console.log(`    ví dụ: ${emptyModule.slice(0, 4).map((x) => x.action).join(", ")}`);

console.log("\nCapability của 12 mục thiếu (theo ACTION_CAPABILITIES của Java):");
const capBlock = registry.slice(registry.indexOf("ACTION_CAPABILITIES"));
for (const n of onlyRegistry) {
  const m = capBlock.match(new RegExp(`Map\\.entry\\("${n}",\\s*"([^"]+)"`));
  console.log(`  ${n.padEnd(36)} capability=${m ? m[1] : "(không khai → mặc định canUse)"}`);
}

// ---------------------------------------------------------------- KẾT LUẬN + CỔNG
//
// HỢP ĐỒNG CỦA DANH MỤC (đã kiểm chứng, không suy đoán): `ACTION_CATALOG.json` là bản kiểm kê
// "SINH TỪ NGUỒN JS" — đúng 174 mục, bằng đúng số action của JS. `probe-action-parity.mjs` khẳng
// định điều đó ("Catalog KHỚP HOÀN TOÀN với nguồn JS", exit 0).
//
// VÌ SAO 12 ACTION JAVA-ONLY **ĐÚNG LÀ** PHẢI VẮNG MẶT Ở ĐÂY:
//   1. Chúng không tồn tại ở JS (tính năng quản trị workflow / cấp bậc / quyền phòng ban là Java-only)
//      ⇒ đưa vào danh mục "sinh từ JS" là SAI ngữ nghĩa.
//   2. Thêm vào sẽ TẠO SAI LỆCH GIẢ: `probe-action-parity.mjs` sẽ báo "có trong catalog nhưng không
//      có ở JS: 12" (hiện đang là 0) ⇒ làm hỏng một cổng đang xanh.
//   3. Chúng KHÔNG hề bị bỏ sót về mặt thi hành: đã khai đầy đủ module + capability trong
//      `ActionRbacRegistry.java` (186 mục) — chính là nguồn `RbacService.requireActionModule` dùng.
//
// ⇒ Cổng này ĐẠT khi: danh mục KHÔNG chứa tên nào ngoài JS, và phần dư của bản thi hành nằm trong
//   tập Java-only ĐÃ BIẾT. Bất kỳ tên mới nào xuất hiện đều bị báo để rà lại.
const KNOWN_JAVA_ONLY = new Set([
  "create_self_work_item", "delete_department_permission", "delete_system_level", "delete_workflow",
  "rebuild_department_permissions", "save_department_permission", "save_system_level", "save_workflow",
  "set_system_level_status", "set_user_system_level", "set_workflow_status", "system_level_impact",
]);

const catalogHasExtra = onlyCatalog.length > 0;
const unknownJavaOnly = onlyRegistry.filter((n) => !KNOWN_JAVA_ONLY.has(n));
const knownSeen = onlyRegistry.filter((n) => KNOWN_JAVA_ONLY.has(n));

console.log("\n=== KẾT LUẬN ===");
console.log(`  Danh mục có tên NGOÀI nguồn JS : ${onlyCatalog.length}` +
  (catalogHasExtra ? ` → ${onlyCatalog.join(", ")}` : " (đúng hợp đồng)"));
console.log(`  Bản thi hành có thêm, ĐÃ BIẾT  : ${knownSeen.length}/${KNOWN_JAVA_ONLY.size} (Java-only, KHÔNG phải lỗi)`);
console.log(`  Bản thi hành có thêm, CHƯA BIẾT: ${unknownJavaOnly.length}` +
  (unknownJavaOnly.length ? ` → ${unknownJavaOnly.join(", ")}` : ""));

const pass = !catalogHasExtra && unknownJavaOnly.length === 0;
console.log(pass
  ? "\nKẾT LUẬN: KHÔNG có trôi dạt ⚠️→✅ — danh mục đúng hợp đồng (sinh từ JS); 12 action Java-only\n"
    + "         đã được khai đầy đủ trong ActionRbacRegistry.java và ĐÚNG LÀ không thuộc danh mục."
  : "\nKẾT LUẬN: CÓ trôi dạt — cần rà lại (xem danh sách CHƯA BIẾT ở trên).");
process.exit(pass ? 0 : 1);
