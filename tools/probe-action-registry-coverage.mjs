// MT2-P4-05 (§21, GOAL §17) — RÀ MỌI ACTION `/api/system` CÓ KHAI QUYỀN TRONG `ActionRbacRegistry`.
// Bài học F1: `Map.entry(action, List.of())` = **MẶC ĐỊNH TỪ CHỐI 403** cho mọi non-admin
// (trừ `RbacService.PUBLIC_ACTIONS`) ⇒ action cần cho user thường mà để `List.of()` là LỖI CHỨC NĂNG.
// Script phân loại từng action đang dispatch ở controller và BÁO LỖI nếu có action KHÔNG khai gì
// (không public, không module, không có capability) — nhóm "mù quyền" thật sự.
//
// Chạy: node tools/probe-action-registry-coverage.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(join(root, p), "utf8");

const registry = read("java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java");
const rbac = read("java-backend/application/src/main/java/com/vntech/erp/application/rbac/RbacService.java");
const controller = read("java-backend/web/src/main/java/com/vntech/erp/web/controller/SystemController.java");

// ── 1) Action dispatch thật ở controller: `case "x" -> {` ───────────────────────────────────────
// ⚠️ BẪY ĐÃ TRẢ GIÁ: regex `case "x" ->` cũng khớp các `switch` trên **TÊN RÀNG BUỘC CSDL**
// (`*_uidx_*`, `*_pkey`, `*_fkey`, `primary_key_f`…) ⇒ PHẢI lọc, nếu không ~47 "action mù quyền" GIẢ.
const RANG_BUOC_CSDL = /(_uidx|_pkey|_fkey|_check|_unique|primary_key|_idx|_no$)/;
const dispatched = new Set();
for (const match of controller.matchAll(/case\s+"([a-z0-9_]+)"\s*->/g)) {
  if (!RANG_BUOC_CSDL.test(match[1])) dispatched.add(match[1]);
}

// ── 2) Khai module trong registry: Map.entry("action", List.of("mod", …)) ───────────────────────
const declared = new Map();          // action -> [modules]
for (const match of registry.matchAll(/Map\.entry\("([a-z0-9_]+)",\s*List\.of\(([^)]*)\)\)/g)) {
  const mods = [...match[2].matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]);
  declared.set(match[1], mods);
}

// ── 3) Action có capability: Map.entry("action", "canXxx") ─────────────────────────────────────
const withCapability = new Set();
for (const match of registry.matchAll(/Map\.entry\("([a-z0-9_]+)",\s*"(can[A-Za-z]+)"\)/g)) withCapability.add(match[1]);

// ── 4) PUBLIC_ACTIONS của RbacService (miễn kiểm module, kiểm TRƯỚC registry) ──────────────────
const publicBlock = rbac.slice(rbac.indexOf("PUBLIC_ACTIONS"));
const publicActions = new Set([...publicBlock.slice(0, 1200).matchAll(/"([a-z0-9_]+)"/g)].map((m) => m[1]));

// ── 5) Phân loại ───────────────────────────────────────────────────────────────────────────────
// LỚP 3b: action KHÔNG khai module nhưng `case` ở controller đã gọi `requireRequireAdmin`/`requireAdmin`
//   ⇒ admin-only NGAY TẦNG CONTROLLER (defense-in-depth), ⛔ KHÔNG phải "mù quyền".
const caseBodies = new Map();
{
  const marks = [...controller.matchAll(/case\s+"([a-z0-9_]+)"\s*->/g)];
  marks.forEach((mark, index) => {
    const start = mark.index;
    const end = index + 1 < marks.length ? marks[index + 1].index : Math.min(controller.length, start + 6000);
    caseBodies.set(mark[1], controller.slice(start, end));
  });
}
const adminGatedAtController = (action) => /requireRequireAdmin|requireAdmin\s*\(/.test(caseBodies.get(action) || "");

const buckets = { public: [], module: [], adminOnly: [], adminGated: [], muQuyen: [] };
for (const action of [...dispatched].sort()) {
  if (publicActions.has(action)) { buckets.public.push(action); continue; }
  const mods = declared.get(action);
  if (mods && mods.length > 0) { buckets.module.push(action); continue; }
  if (mods && mods.length === 0) { buckets.adminOnly.push(action); continue; }
  if (adminGatedAtController(action)) { buckets.adminGated.push(action); continue; }
  buckets.muQuyen.push(action);
}

const line = (label, arr) => `  ${label}: ${arr.length}${arr.length ? ` — ${arr.slice(0, 8).join(", ")}${arr.length > 8 ? ", …" : ""}` : ""}`;
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log("  MT2-P4-05 — RÀ KHAI QUYỀN CHO MỌI ACTION `/api/system`");
console.log("══════════════════════════════════════════════════════════════════════════════");
console.log(line("Action dispatch ở controller", [...dispatched]));
console.log(line("① PUBLIC_ACTIONS (mọi user đã đăng nhập)", buckets.public));
console.log(line("② Khai MODULE trong ActionRbacRegistry", buckets.module));
console.log(line("③ ADMIN-ONLY trong registry (`List.of()` + admin bypass)", buckets.adminOnly));
console.log(line("③b ADMIN-GATED ngay tại controller (`requireRequireAdmin`)", buckets.adminGated));
console.log(line("④ ⛔ MÙ QUYỀN (không public · không module · không admin-gated)", buckets.muQuyen));
const thieuCapability = [...dispatched].filter((a) => buckets.module.includes(a) && !withCapability.has(a));
console.log(line("⑤ Khai MODULE nhưng THIẾU capability", thieuCapability));
console.log("══════════════════════════════════════════════════════════════════════════════");

const ok = buckets.muQuyen.length === 0 && thieuCapability.length === 0;
console.log(ok
  ? "  KẾT LUẬN: mọi action đều thuộc 1 trong 4 nhóm hợp lệ (public · module+capability · admin-only · admin-gated) ✅"
  : "  KẾT LUẬN: CÒN ACTION MÙ QUYỀN / THIẾU CAPABILITY ⇒ phải vá ✗");
process.exit(ok ? 0 : 1);
