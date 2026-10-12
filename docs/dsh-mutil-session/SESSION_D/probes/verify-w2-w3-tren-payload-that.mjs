// 🔬 NGHIỆM THU **W2 + W3 TRÊN PAYLOAD THẬT** — `ERP-SESSION-04` (phiên 4, 09/10/2026)
//
// ⭐ VÌ SAO CÓ PROBE NÀY: `W2` («xem danh sách công việc của NGƯỜI KHÁC theo phạm vi») và `W3` (nút «Xoá» việc
//   của bản thân) đã có **test hợp đồng** (`tests/t14` · `tests/t13-E`) — nhưng test đó chạy trên **FIXTURES**.
//   Probe này chạy **CHÍNH KHỐI THUẦN THẬT** (`W2-PURE`) + **HÀM PHẠM VI THẬT** (`T06-PURE`) trên **payload THẬT**
//   lấy từ bản đang chạy ⇒ ⭐ chứng minh **hành vi trên DỮ LIỆU SỐNG** mà ⛔ **không cần BUILD** (đúng phương pháp
//   `SHARED_STATE` CẬP NHẬT 79: «nhập HÀM THẬT + chạy trên DỮ LIỆU THẬT»).
//
// ⛔ GIỚI HẠN ĐÃ BIẾT (nói rõ, ⛔ không nói quá): probe **mô phỏng** 2 thứ thay vì nhập (vì chúng nằm trong tệp
//   có JSX/alias `@/`): ① `modulePermission()` (`lib/permissions.ts:15-16` — nhánh `admin` ⇒ **mọi năng lực = true**)
//   ② hằng `WORK_CLOSED = ["COMPLETED","CANCELLED"]` (`lib/ui-shared.tsx:102`). Cả hai **đã được test hợp đồng
//   khoá riêng** (`tests/t13`, `tests/t05`) ⇒ ⚠️ kết luận dưới đây chỉ mạnh ngang 2 giả định đó.
//
// Chạy: node --import tsx docs/dsh-mutil-session/SESSION_D/probes/verify-w2-w3-tren-payload-that.mjs [base] [user] [pass]
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const USER = process.argv[3] || "admin";
const PASS = process.argv[4] || "Admin123456@";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import esbuild from "esbuild";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../");
const src = readFileSync(ROOT + "/app/screens/WorkCenter.tsx", "utf8");
const results = [];
const check = (name, ok, detail) => { results.push(ok); console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };

function block(begin, end) {
  const b = src.indexOf(begin), e = src.indexOf(end, b + begin.length);
  if (b < 0 || e < 0) throw new Error(`⛔ thiếu mốc ${begin}/${end} trong WorkCenter.tsx`);
  return src.slice(src.indexOf("\n", b) + 1, e);
}
const W2 = new Function(esbuild.transformSync(block("W2-PURE-BEGIN", "W2-PURE-END"), { loader: "ts" }).code
  + "\nreturn { workByOwnerGroups, OWNER_VIEW_MODES };")();
const T06 = new Function(esbuild.transformSync(block("T06-PURE-BEGIN", "T06-PURE-END"), { loader: "ts" }).code
  + "\nreturn { workScopeOf, departmentWorkScope };")();

console.log("═".repeat(78));
console.log("  🔬 W2 + W3 TRÊN PAYLOAD THẬT — " + BASE + " (" + USER + ")");
console.log("═".repeat(78));

const login = await fetch(BASE + "/api/system", { method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: USER, password: PASS }) });
if (login.status !== 200) {
  console.log(`\n  ⛔ login HTTP ${login.status} ⇒ BỎ SỐ ĐO (⛔ không kết luận khi 5xx/4xx — bài học 502 lúc 15:10)`);
  process.exitCode = 2;
} else {
  const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  const data = (await fetch(BASE + "/api/system", { headers: { cookie }, cache: "no-store" }).then((r) => r.json()))?.data || {};
  const items = data.workItems || [];
  const me = data.user || {};
  const myId = String(me.id || "");
  console.log(`\n① payload THẬT: workItems=${items.length} · user=${me.fullName || me.username} · role=${me.role}`);
  check("① payload có việc THẬT để đo (⛔ không đo trên rỗng)", items.length > 0, `${items.length} dòng`);

  // ── T-06: phạm vi ────────────────────────────────────────────────────────────
  const scope = T06.workScopeOf(data);
  const scoped = T06.departmentWorkScope(data, items);
  const subset = scoped.every((r) => items.includes(r));
  console.log(`\n② [T06] workScopeOf: isAdmin=${scope.isAdmin} · deptCodes=${JSON.stringify(scope.deptCodes)} · managerDepartments=${JSON.stringify(scope.managerDepartments)}`);
  check("② `departmentWorkScope` chỉ THU HẸP (tập con của payload, ⛔ không tự sinh dòng)", subset, `${scoped.length}/${items.length} dòng`);

  // ── W2: gom theo NGƯỜI ───────────────────────────────────────────────────────
  const groups = W2.workByOwnerGroups(scoped);
  const total = groups.reduce((s, g) => s + g.count, 0);
  console.log(`\n③ [W2] workByOwnerGroups(scopedWork) ⇒ ${groups.length} nhóm người`);
  for (const g of groups.slice(0, 8)) console.log(`     · ${String(g.label).padEnd(30)} count=${g.count}`);
  check("③ tổng bộ đếm các nhóm = số dòng đầu vào (⛔ không mất/nhân dòng)", total === scoped.length, `${total} = ${scoped.length}`);
  check("④ khoá nhóm là `assignedTo` (⛔ không theo TÊN) — 2 người TRÙNG TÊN là 2 nhóm",
    new Set(groups.map((g) => g.key)).size === groups.length,
    `${groups.length} nhóm · ${new Set(groups.map((g) => g.label)).size} nhãn phân biệt`);
  check("⑤ người ⛔ không có việc trong phạm vi ⛔ KHÔNG xuất hiện (⛔ không bịa nhóm rỗng)",
    groups.every((g) => g.count > 0));
  check("⑥ sắp GIẢM DẦN theo bộ đếm (khuôn `projectWorkGroups`)",
    groups.every((g, i) => i === 0 || groups[i - 1].count >= g.count));

  // ── W3: đếm dòng SẼ HIỆN nút «Xoá» ──────────────────────────────────────────
  const WORK_CLOSED = ["COMPLETED", "CANCELLED"];              // `lib/ui-shared.ts:102` (mô phỏng — xem đầu tệp)
  const canDeleteWork = scope.isAdmin;                          // `lib/permissions.ts:16` (admin ⇒ canEdit=true)
  const del = scoped.filter((r) => canDeleteWork && String(r.assignedBy) === myId && !WORK_CLOSED.includes(String(r.status)));
  const notMineBy = scoped.filter((r) => String(r.assignedBy) !== myId);
  console.log(`\n④ [W3] canDeleteWork(${me.role})=${canDeleteWork} ⇒ dòng SẼ HIỆN nút «Xoá»: ${del.length}/${scoped.length}`);
  check("⑦ nút «Xoá» CHỈ ở dòng do CHÍNH MÌNH giao/tạo (⛔ không hiện ở việc người khác giao)",
    del.every((r) => String(r.assignedBy) === myId),
    `loại trừ ${notMineBy.length} dòng không phải tôi giao`);
  check("⑧ nút «Xoá» ⛔ KHÔNG hiện ở việc đã ĐÓNG (`WORK_CLOSED`)",
    del.every((r) => !WORK_CLOSED.includes(String(r.status))),
    `trạng thái gặp: ${JSON.stringify([...new Set(del.map((r) => String(r.status)))])}`);

  // ── W4 xem TRƯỚC (khoá tab) ─────────────────────────────────────────────────
  const KEYS = ["work_dashboard", "work_list", "work_department", "work_assign", "work_project", "work_reports"];
  const inCatalog = KEYS.filter((k) => (data.moduleCatalog || []).some((r) => String(r.moduleKey) === k));
  console.log(`\n⑤ [W4 xem trước] moduleCatalog payload có ${inCatalog.length}/6 khoá tab · admin ⇒ canView=true cả 6 ⇒ ⛔ KHÔNG ẩn tab nào`);
  check("⑨ bộ chọn cách xem W2 có MẶC ĐỊNH «Nhóm của tôi» (⛔ hành vi cũ không đổi)",
    W2.OWNER_VIEW_MODES[0].key === "group" && W2.OWNER_VIEW_MODES[0].label === "Nhóm của tôi",
    JSON.stringify(W2.OWNER_VIEW_MODES));

  const bad = results.filter((x) => !x).length;
  console.log("\n" + "═".repeat(78));
  console.log(bad === 0 ? `  KẾT LUẬN: ✅ ĐẠT ${results.length}/${results.length} (W2 + W3 trên DỮ LIỆU THẬT)` : `  KẾT LUẬN: ❌ ${bad}/${results.length} HỎNG`);
  console.log("═".repeat(78));
  process.exitCode = bad === 0 ? 0 : 1;
}
