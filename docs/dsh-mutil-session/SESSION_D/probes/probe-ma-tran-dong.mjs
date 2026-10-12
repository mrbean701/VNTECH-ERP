// ⚠️ CHỈ ĐỌC — đo dữ liệu THẬT để thiết kế ma trận phân quyền ĐỘNG (⛔ không hardcode phòng ban).
// ⛔ TUYỆT ĐỐI KHÔNG gọi action ghi nào (chỉ login + GET /api/system).
// Mục đích: trả lời 4 câu hỏi bằng SỐ ĐO:
//   ① Công ty THỰC SỰ có bao nhiêu đơn vị/phòng ban (không đếm theo mã hardcode).
//   ② `work_items.department_code` đang chứa những mã phòng nào (dữ liệu đã ĐỘNG chưa).
//   ③ Nhân sự các phòng KHÁC KH/DA có tồn tại không (nếu có ⇒ họ đang ⛔ không có quyền Work).
//   ④ `department_module_permissions` cấp 4 khoá Work cho MẤY đơn vị.
const BASE = process.argv[2] || "http://127.0.0.1:9000";

const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: u, password: p }),
  });
  return { ok: r.status === 200, cookie: (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ") };
};
const boot = async (cookie) =>
  (await fetch(BASE + "/api/system", { headers: { cookie } }).then((r) => r.json()).catch(() => null))?.data || {};

const a = await login("admin", "Admin123456@");
if (!a.ok) { console.log("⛔ không đăng nhập được"); process.exit(1); }
const d = await boot(a.cookie);

const WORK_KEYS = ["dept_plan_tasks", "dept_project_tasks", "dept_plan_assign", "dept_project_assign"];
const line = (s) => console.log("\n" + "─".repeat(78) + "\n" + s);

line("① ĐƠN VỊ / PHÒNG BAN THỰC TẾ");
const users = d.users || [];
const units = new Map();
for (const u of users) {
  const id = String(u.organizationUnitId ?? "");
  if (!id) continue;
  if (!units.has(id)) units.set(id, new Set());
  units.get(id).add(String(u.department ?? ""));
}
console.log(`tổng user = ${users.length} · số organizationUnitId KHÁC NHAU (từ users) = ${units.size}`);
for (const [id, deps] of [...units.entries()].sort()) console.log(`  · ${id}  → department: ${[...deps].join(" | ") || "(rỗng)"}`);

const dmp = d.departmentModulePermissions || [];
const unitIdsDmp = new Set(dmp.map((r) => String(r.organizationUnitId)));
console.log(`\ndepartment_module_permissions: ${dmp.length} dòng · ${unitIdsDmp.size} đơn vị phân biệt`);

line("④ KHOÁ WORK ĐƯỢC CẤP CHO MẤY ĐƠN VỊ (đây là chỗ HARDCODE 2 phòng)");
for (const k of WORK_KEYS) {
  const rows = dmp.filter((r) => String(r.moduleKey) === k);
  const uids = [...new Set(rows.map((r) => String(r.organizationUnitId)))];
  const view1 = rows.filter((r) => Number(r.canView) === 1).length;
  console.log(`  ${k.padEnd(22)} = ${String(rows.length).padStart(3)} dòng · ${uids.length} đơn vị · canView=1: ${view1}`);
}
const anyWork = dmp.filter((r) => WORK_KEYS.includes(String(r.moduleKey)));
console.log(`  ⇒ HỢP 4 khoá Work: ${anyWork.length} dòng · ${new Set(anyWork.map((r) => String(r.organizationUnitId))).size} đơn vị`);

line("③ NHÂN SỰ THEO PHÒNG — ai ĐANG BỊ CHẶN khỏi Work (phòng ⛔ không có khoá Work)");
const workUnits = new Set(anyWork.map((r) => String(r.organizationUnitId)));
const byUnit = new Map();
for (const u of users) {
  const id = String(u.organizationUnitId ?? "(không đơn vị)");
  byUnit.set(id, (byUnit.get(id) || 0) + 1);
}
for (const [id, n] of [...byUnit.entries()].sort((x, y) => y[1] - x[1])) {
  console.log(`  ${id.padEnd(40)} ${String(n).padStart(3)} user   ${workUnits.has(id) ? "✅ có khoá Work" : "⛔ KHÔNG có khoá Work"}`);
}

line("② work_items.department_code — DỮ LIỆU ĐÃ ĐỘNG CHƯA");
const wi = d.workItems || [];
const byDep = new Map();
for (const r of wi) {
  const k = String(r.departmentCode ?? "(rỗng)");
  byDep.set(k, (byDep.get(k) || 0) + 1);
}
console.log(`tổng work_items (admin thấy hết) = ${wi.length}`);
for (const [k, n] of [...byDep.entries()].sort((x, y) => y[1] - x[1])) console.log(`  department_code=${k.padEnd(12)} ${String(n).padStart(4)} việc`);

line("⑤ organization_units — MÃ ĐƠN VỊ THẬT (để ánh xạ động, ⛔ không hardcode)");
const ous = d.organizationUnits || [];
console.log(`tổng organization_units = ${ous.length}`);
for (const u of ous) {
  console.log(`  code=${String(u.code).padEnd(12)} unitType=${String(u.unitType).padEnd(12)} active=${u.active}  ${u.name}`);
}

line("⑥ ÁNH XẠ ĐỘNG: user.organizationCode → work_items.department_code (khớp được không?)");
const userCodes = new Map();
for (const u of users) {
  const c = String(u.organizationCode ?? "(trống)");
  if (!userCodes.has(c)) userCodes.set(c, { n: 0, roles: new Set() });
  const e = userCodes.get(c);
  e.n += 1;
  e.roles.add(String(u.role));
}
const depCodes = new Set([...byDep.keys()]);
for (const [c, e] of [...userCodes.entries()].sort()) {
  console.log(`  organizationCode=${c.padEnd(12)} ${String(e.n).padStart(3)} user · role: ${[...e.roles].join(",")}   ${depCodes.has(c) ? "✅ KHỚP department_code" : "⚠️ không thấy trong work_items"}`);
}
console.log(`\n  work_items.department_code = ${[...depCodes].join(", ")}`);
console.log(`  organization_units.code    = ${ous.map((u) => String(u.code)).join(", ")}`);
const orphan = [...depCodes].filter((c) => !ous.some((u) => String(u.code) === c));
console.log(`  ⇒ mã phòng trong work_items ⛔ KHÔNG có trong organization_units: ${orphan.join(", ") || "(không)"}`);

line("KẾT LUẬN ĐO ĐƯỢC");
console.log(`  · Số đơn vị trong dữ liệu quyền : ${unitIdsDmp.size}`);
console.log(`  · Số đơn vị có khoá Work        : ${workUnits.size} / ${unitIdsDmp.size}`);
console.log(`  · Mã phòng trong work_items     : ${[...byDep.keys()].join(", ") || "(chưa có việc)"}`);
