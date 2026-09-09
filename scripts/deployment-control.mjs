import { existsSync, readFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const profilePath=join(root,"deploy",".active-profile.json");
if(!existsSync(join(root,".env"))||!existsSync(profilePath)){console.error("Chưa cấu hình VNTECH ERP V5.3.0 FULL W2. Hãy chạy bộ cài máy chủ hoặc bộ nâng cấp giữ dữ liệu trước.");process.exit(2)}
const profile=JSON.parse(readFileSync(profilePath,"utf8"));
const base=["compose","--env-file",".env","-f","deploy/docker-compose.yml","-f",profile.composeOverlay];
function run(args,inherit=true){return spawnSync("docker",[...base,...args],{cwd:root,stdio:inherit?"inherit":"pipe",encoding:"utf8"})}
const cmd=process.argv[2]||"status";
if(cmd==="start"){const r=run(["up","-d"]);process.exit(r.status||0)}
if(cmd==="stop"){const r=run(["down"]);process.exit(r.status||0)}
if(cmd==="restart"){let r=run(["restart"]);process.exit(r.status||0)}
if(cmd==="status"){const r=run(["ps"]);process.exit(r.status||0)}
if(cmd==="logs"){const r=run(["logs","--tail","200","app"]);process.exit(r.status||0)}
if(cmd==="backup"){
  mkdirSync(join(profile.backupPath,"database"),{recursive:true});
  const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\..+/,"").replace("T","_");
  const script=`pg_dump --format=custom --compress=6 --file=/backups/database/manual_${stamp}.dump`;
  const r=run(["run","--rm","--entrypoint","sh","backup","-c",script]);
  if((r.status||0)===0) console.log(`Backup thủ công: ${profile.backupPath}/database/manual_${stamp}.dump`);
  process.exit(r.status||0)
}

if(cmd==="restore") {
  const dumpPath=process.argv[3];
  if(!dumpPath){console.error("Cách dùng: node scripts/deployment-control.mjs restore <file.dump>");process.exit(2)}
  const absolute=resolve(dumpPath);
  if(!existsSync(absolute)){console.error(`Không tìm thấy backup: ${absolute}`);process.exit(2)}
  console.log("CẢNH BÁO: phục hồi sẽ ghi đè database hiện tại.");
  run(["stop","app","backup"]);
  const mount=`${absolute}:/restore/vntech.dump:ro`;
  const r=run(["run","--rm","-v",mount,"--entrypoint","sh","backup","-c","pg_restore --clean --if-exists --no-owner --no-privileges --dbname=$PGDATABASE /restore/vntech.dump"]);
  if((r.status||0)!==0) process.exit(r.status||1);
  console.log("Áp dụng lại migration/identity/UI contract hiện hành sau khi phục hồi dump để không nạp cấu hình legacy.");
  const migrate=run(["run","--rm","--no-deps","--entrypoint","node","app","scripts/migrate-postgres.mjs"]);
  if((migrate.status||0)!==0){console.error("Migration sau restore thất bại. App vẫn đang dừng để bảo vệ dữ liệu.");process.exit(migrate.status||1)}
  const live=run(["run","--rm","--no-deps","--entrypoint","node","app","scripts/preflight-postgres-runtime.mjs","--live"]);
  if((live.status||0)!==0){console.error("Database sau restore không đạt runtime preflight. App vẫn đang dừng.");process.exit(live.status||1)}
  const up=run(["up","-d","app","backup"]); process.exit(up.status||0);
}
if(cmd==="migrate-v47") {
  const oldPath=process.argv[3];
  if(!oldPath){console.error("Cách dùng: node scripts/deployment-control.mjs migrate-v47 <thu-muc-.local-data-cu>");process.exit(2)}
  console.log("Dừng App/Backup trước khi chuyển dữ liệu...");
  run(["stop","app","backup"]);
  const mount=`${resolve(oldPath)}:/import/v47:ro`;
  const r=run(["run","--rm","-v",mount,"app","node","scripts/migrate-sqlite-to-postgres.mjs","/import/v47/warehouse.sqlite","/import/v47/files","/data/storage"]);
  if((r.status||0)!==0) process.exit(r.status||1);
  console.log("Khởi động lại App/Backup...");
  const up=run(["up","-d","app","backup"]); process.exit(up.status||0);
}
console.error("Lệnh hỗ trợ: start | stop | restart | status | logs | backup | restore <dump> | migrate-v47 <path>");process.exit(2)
