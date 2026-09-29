// Do so THAT tren MySQL cho W-02. ⛔ KHONG sua DB.
import { execSync } from "node:child_process";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (s) => {
  try { return execSync(`"${MYSQL}" -u vntech -pvntech -N -B vntech_erp -e "${s}"`, { encoding: "utf8", shell: "cmd.exe" }).trim(); }
  catch (e) { return "LOI: " + String(e.stdout || e.stderr || e.message).slice(0, 160); }
};
const rules = [
  ["TONG SO KHO", "SELECT COUNT(*) FROM warehouses;"],
  ["TONG SO DU AN", "SELECT COUNT(*) FROM projects;"],
  ["KHO GAN DU AN", "SELECT COUNT(*) FROM warehouses WHERE project_id IS NOT NULL;"],
  ["KHO KHONG GAN (project_id IS NULL)", "SELECT COUNT(*) FROM warehouses WHERE project_id IS NULL;"],
  ["MO COI (project_id khong ton tai)", "SELECT COUNT(*) FROM warehouses w LEFT JOIN projects p ON p.id=w.project_id WHERE w.project_id IS NOT NULL AND p.id IS NULL;"],
  ["KHO THEO DU AN", "SELECT p.code, COUNT(w.id) FROM projects p LEFT JOIN warehouses w ON w.project_id=p.id GROUP BY p.id, p.code ORDER BY p.code;"],
];
for (const [n, s] of rules) console.log("  " + n.padEnd(38) + " = " + q(s));
console.log("  --- danh sach kho ---");
console.log("  " + q("SELECT w.code, w.type, IFNULL(p.code,'(khong gan)') FROM warehouses w LEFT JOIN projects p ON p.id=w.project_id ORDER BY w.code;").split("\n").map((x) => "    " + x).join("\n"));
console.log("  --- du an ---");
console.log("  " + q("SELECT code, name, status FROM projects ORDER BY code;").split("\n").map((x) => "    " + x).join("\n"));
