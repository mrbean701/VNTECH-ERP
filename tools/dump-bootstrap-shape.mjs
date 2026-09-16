// Dump cấu trúc bootstrap để biết dữ liệu nào ĐÃ có sẵn (tránh viết API thừa).
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const login = await fetch(BASE + "/api/system", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
const cookie = (login.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
const body = await (await fetch(BASE + "/api/system", { headers: { cookie } })).json();
const d = body.data || {};

const want = ["project", "user", "team", "warehouse", "inventory", "scope", "staff", "member"];
console.log("=== KHÓA LIÊN QUAN DỰ ÁN / NHÂN SỰ / TỔ ĐỘI ===\n");
for (const k of Object.keys(d).sort()) {
  if (!want.some((w) => k.toLowerCase().includes(w))) continue;
  const v = d[k];
  const kind = Array.isArray(v) ? `Array(${v.length})` : (v === null ? "null" : typeof v);
  console.log(`${k.padEnd(34)} ${kind}`);
  if (Array.isArray(v) && v.length) console.log("   mẫu: " + JSON.stringify(v[0]).slice(0, 240));
}

console.log("\n=== users[0] (có trường dự án không?) ===");
console.log(JSON.stringify(d.users?.[0], null, 1).slice(0, 900));

console.log("\n=== projects[0] ===");
console.log(JSON.stringify(d.projects?.[0], null, 1).slice(0, 700));

console.log("\n=== warehouses ===");
console.log(JSON.stringify(d.warehouses?.slice(0, 3), null, 1).slice(0, 700));

console.log("\n=== teams[0] ===");
console.log(JSON.stringify(d.teams?.[0], null, 1).slice(0, 700));
