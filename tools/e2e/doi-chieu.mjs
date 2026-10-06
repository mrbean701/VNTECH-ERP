// ĐỐI CHIẾU — đo lại nhiều lần và đếm chính xác nhóm E2E, để biết con số nào là thật.
import { login, bootstrap, tieuDe } from "./client.mjs";

tieuDe("ĐỐI CHIẾU SỐ ĐẾM");
await login("admin", "Admin123456@");

for (let i = 1; i <= 3; i++) {
  const bs = await bootstrap();
  const e2eUser = bs.users.filter((u) => String(u.username || "").startsWith("e2e."));
  const e2ePrj = bs.projects.filter((p) => String(p.code || "").startsWith("E2E-"));
  const e2eTeam = bs.teams.filter((t) => String(t.code || "").startsWith("E2E-"));
  const e2eUnit = bs.organizationUnits.filter((u) => String(u.code || "").startsWith("E2E-"));
  console.log("  lan " + i + ": users=" + bs.users.length + " (e2e=" + e2eUser.length + ") · projects=" + bs.projects.length + " (e2e=" + e2ePrj.length + ") · teams=" + bs.teams.length + " (e2e=" + e2eTeam.length + ") · donVi=" + bs.organizationUnits.length + " (e2e=" + e2eUnit.length + ")");
}
const bs = await bootstrap();
console.log("\n  Danh sach tai khoan E2E:");
for (const u of bs.users.filter((x) => String(x.username || "").startsWith("e2e."))) {
  console.log("    " + u.username.padEnd(12) + " vai=" + String(u.role).padEnd(12) + " donVi=" + String(u.organizationName || u.department));
}
console.log("\n  Vai tro co that su trong roleCatalog: khac nhau.");
console.log("  Vai tro user dang dung: " + [...new Set(bs.users.map((u) => u.role))].sort().join(", "));
console.log("  Vai tro trong roleCatalog: " + bs.roleCatalog.map((r) => r.code).sort().join(", "));
console.log("\n  Du an E2E:");
for (const p of bs.projects.filter((x) => String(x.code || "").startsWith("E2E-"))) console.log("    " + p.id + "  " + p.code + "  " + p.name);