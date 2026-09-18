// [PHASE 8 · WF-04-followup] CHUAN HOA TU VUNG bang BANG CHUNG, KHONG ghi de lieu lieu lieu.
// Su that do duoc: hai token deu dang SONG o hai duong KHAC NHAU => ghi de se lam vo mot duong.
//   - `all_roles`: token cua duong PHIEU DE NGHI (RequestManagementUseCase:583,625 qua stageConfig).
//   - `all_of`   : token cua ENGINE CHUNG (OpsTaskManagementUseCase:553 = {single,any_of,all_of}) + UI.
//   - Duong phieu CON hieu ca `all_of` (RequestManagementUseCase:635 qua store.stageApprovalMode).
// Ke hoach: (a) kiem bang ma nguon rang CA HAI token deu duoc hieu; (b) dien required_permission='canApprove'
// cho 5 buoc cua dinh nghia `requests` (MySQL + SQLite) de dong nhat voi 3 module moi; (c) ghi file hoan tac.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const q = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "--default-character-set=utf8mb4", "-N", "-B", "vntech_erp", "-e", sql], { encoding: "utf8" }).trim();
const APPLY = process.argv.includes("--apply");
const checks = [];
const check = (ok, label, ev) => { checks.push(ok); console.log("  [" + (ok ? "DAT " : "HONG") + "] " + label + " :: " + ev); };

const rm = readFileSync("java-backend/application/src/main/java/com/vntech/erp/application/service/RequestManagementUseCase.java", "utf8");
const ops = readFileSync("java-backend/application/src/main/java/com/vntech/erp/application/service/OpsTaskManagementUseCase.java", "utf8");
const js = readFileSync("scripts/system-route.mjs", "utf8");
check(/\"all_roles\"\.equals\(sv\(stageConfig, \"approvalMode\"\)\)/.test(rm), "duong PHIEU hieu token 'all_roles' (RequestManagementUseCase:583/625)", "thay 'all_roles'.equals(sv(stageConfig, \"approvalMode\"))");
check(/\"all_of\"\.equals\(store\.stageApprovalMode/.test(rm), "duong PHIEU hieu CA token 'all_of' (RequestManagementUseCase:635)", "thay 'all_of'.equals(store.stageApprovalMode(...))");
check(/Set\.of\(\"single\", \"any_of\", \"all_of\"\)/.test(ops), "ENGINE CHUNG validate bo token {single, any_of, all_of} (OpsTaskManagementUseCase:553)", "thay Set.of(\"single\", \"any_of\", \"all_of\")");
check(/all_roles/.test(js), "ban JS co nhanh 'all_roles' (parity)", "thay 'all_roles' trong scripts/system-route.mjs");

const wfId = q("SELECT id FROM workflow_definitions WHERE module_key='requests' LIMIT 1;");
const steps = q("SELECT COUNT(*) FROM workflow_steps WHERE workflow_id='" + wfId + "';");
const needFill = q("SELECT COUNT(*) FROM workflow_steps WHERE workflow_id='" + wfId + "' AND COALESCE(required_permission,'')='';");
console.log("\ndinh nghia requests: id=" + wfId + " · " + steps + " buoc · thieu required_permission: " + needFill);

if (!APPLY) { console.log("\n(CHAY KHO) se dien required_permission='canApprove' cho " + needFill + " buoc (MySQL) + SQLite tuong ung."); }
else {
  const before = q("SELECT id FROM workflow_steps WHERE workflow_id='" + wfId + "' AND COALESCE(required_permission,'')='';").split(/\r?\n/).filter(Boolean);
  q("UPDATE workflow_steps SET required_permission='canApprove' WHERE workflow_id='" + wfId + "' AND COALESCE(required_permission,'')='';");
  const after = q("SELECT COALESCE(required_permission,'(trong)') FROM workflow_steps WHERE workflow_id='" + wfId + "' ORDER BY step_no;");
  console.log("\nSAU khi dien (doc lai): " + after.split(/\r?\n/).join(" · "));
  check(after.split(/\r?\n/).every((v) => v === "canApprove"), "MySQL: moi buoc cua dinh nghia requests deu co required_permission", after.split(/\r?\n/).join(" · "));
  const rb = before.map((id) => "UPDATE workflow_steps SET required_permission=NULL WHERE id='" + id + "';").join("\n");
  writeFileSync("docs/agent-progress/TASK-094-wf04-followup-rollback.sql", "-- WF-04-followup ROLLBACK (18/09)\n" + rb + "\n");
  console.log("file hoan tac: docs/agent-progress/TASK-094-wf04-followup-rollback.sql");

  // PARITY SQLite (chuoi drizzle) — cung mot thao tac, idempotent (chi dien o cho dang trong).
  try {
    const { DatabaseSync } = await import("node:sqlite");
    const db = new DatabaseSync(".local-data/warehouse.sqlite");
    const rows = db.prepare("SELECT id FROM workflow_steps WHERE workflow_id=? AND COALESCE(required_permission,'')=''").all(wfId);
    const upd = db.prepare("UPDATE workflow_steps SET required_permission='canApprove' WHERE id=?");
    for (const r of rows) upd.run(String(r.id));
    const afterSqlite = db.prepare("SELECT COALESCE(required_permission,'(trong)') AS p FROM workflow_steps WHERE workflow_id=? ORDER BY step_no").all(wfId).map((r) => String(r.p));
    db.close();
    check(afterSqlite.length > 0 && afterSqlite.every((v) => v === "canApprove"), "SQLite (parity): moi buoc cua dinh nghia requests deu co required_permission", afterSqlite.join(" · "));
  } catch (e) {
    check(false, "SQLite (parity): khong cap nhat duoc", String(e.message).slice(0, 100));
  }
}
const bad = checks.filter((c) => !c).length;
console.log("\n=== WF-04-followup: " + (checks.length - bad) + "/" + checks.length + " DAT · " + bad + " HONG ===");
process.exit(bad ? 1 : 0);
