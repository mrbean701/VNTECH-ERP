// Kiểm chứng SỐNG: `me` trả roleBase/roleName/warehouseScopeKind đúng nguồn role_catalog chưa.
//
// Đây là phép kiểm trực tiếp cho TASK-021. Trước khi sửa, Java trả roleBase = MÃ CHUẨN (u.role),
// làm hỏng 6 chốt quyền phía giao diện. Sau khi sửa, roleBase phải là MÃ ENGINE (role_catalog.base_role):
//   cht→commander · da_nv, da_truong→project · ksda→engineer
//   kh_nv, kh_truong→procurement · thu_kho, kho_tong→warehouse · thuky, hcpc_truong→director
const BASE = process.argv[2] || "http://127.0.0.1:18081";

const ACCOUNTS = [
  ["admin", "Admin123456@"],
  ["ksda.demo", "Vntech@2026"],
  ["thukydemo", "Vntech@2026"],
  ["nvdademo", "Vntech@2026"],
  ["nvkhdemo", "Vntech@2026"],
  ["trdademo", "Vntech@2026"],
  ["tkhodemo", "Vntech@2026"],
  ["cha.ht", "Vntech@2026"],
  ["engineer.demo", "Vntech@2026"],
  ["trinhtrench", "Vntech@2026"],
];

async function login(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  if (!res.ok) return { error: `HTTP ${res.status}` };
  const cookie = (res.headers.getSetCookie?.() ?? [res.headers.get("set-cookie")])
    .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
  return { cookie };
}

// ⚠️ MT2-P14-03c (23/09/2026) — ĐO LẠI: `POST {action:"me"}` trên `/api/system` nay trả **HTTP 403** (nvkhdemo)
// và **HTTP 400** (admin) ⇒ action này ⛔ không còn tồn tại ở dạng đó; bản cũ vì thế đọc ra role/roleBase RỖNG cho
// **CẢ 10 tài khoản** (kể cả `admin`) và kết luận oan «còn tài khoản trả roleBase sai».
// Danh tính phiên nay lấy bằng **GET `/api/system` ⇒ `data.user`** (đo được: kh_nv/procurement · admin/admin ⇒ ĐÚNG).
async function me(cookie) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "GET",
    headers: { cookie },
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { __raw: text.slice(0, 200) }; }
}

// Ánh xạ chuẩn để đối chiếu (nguồn: drizzle/0029_v530_erp_permissions_workflow.sql:71-80)
const EXPECTED = {
  cht: "commander", da_nv: "project", da_truong: "project", ksda: "engineer",
  kh_nv: "procurement", kh_truong: "procurement", thu_kho: "warehouse", kho_tong: "warehouse",
  thuky: "director", hcpc_truong: "director", admin: "admin", director: "director",
  accountant: "accountant", team: "team", procurement: "procurement", engineer: "engineer",
  project: "project", commander: "commander", warehouse: "warehouse",
};

const rows = [];
let checked = 0, bad = 0, skipped = 0;
for (const [username, password] of ACCOUNTS) {
  const { cookie, error } = await login(username, password);
  if (error) { rows.push(`  ?  ${username.padEnd(16)} đăng nhập lỗi (${error})`); skipped++; continue; }
  const payload = await me(cookie);
  const user = payload.user ?? payload.data?.user ?? payload;
  const role = String(user.role ?? "");
  const roleBase = String(user.roleBase ?? "");
  const roleName = String(user.roleName ?? "");
  const scope = String(user.warehouseScopeKind ?? "");
  const expected = EXPECTED[role];
  checked++;
  let verdict = "OK ";
  if (!roleBase) { verdict = "THIẾU"; bad++; }
  else if (expected && roleBase !== expected) { verdict = "SAI "; bad++; }
  else if (!expected) { verdict = "?? "; }
  rows.push(`  ${verdict} ${username.padEnd(16)} role=${role.padEnd(12)} roleBase=${roleBase.padEnd(14)} `
    + `roleName=${roleName.padEnd(22)} scope=${scope || "(rỗng)"}`);
}

console.log(`Nguồn: ${BASE} · ${ACCOUNTS.length} tài khoản\n`);
console.log(rows.join("\n"));
console.log(`\nĐã kiểm: ${checked} · Sai/thiếu: ${bad} · Bỏ qua (không đăng nhập được): ${skipped}`);
console.log(bad === 0 && checked > 0
  ? "KẾT LUẬN: roleBase trả về ĐÚNG mã ENGINE ✅ (TASK-021 có hiệu lực thật)"
  : "KẾT LUẬN: còn tài khoản trả roleBase sai ⚠");
process.exit(bad === 0 && checked > 0 ? 0 : 1);
