// VNTECH ERP V5.3.0 FULL W2 - data-preserving upgrade with automatic rollback.
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { mergeManagedEnv, encodeDatabasePassword } from "./installer-env.mjs";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";

const RELEASE_VERSION=VNTECH_IDENTITY.version;
const RELEASE_BUILD=VNTECH_IDENTITY.release.build;
const PACKAGE_ID=VNTECH_IDENTITY.release.packageId;
const UI_CONTRACT_ID=VNTECH_IDENTITY.release.uiContractId;
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const rl=createInterface({input,output});
const docker=(args,inherit=true)=>{const envPath=join(root,".env");const managed=existsSync(envPath)?parseEnvText(readFileSync(envPath,"utf8")):{};const childEnv=mergeManagedEnv(process.env,managed);return spawnSync("docker",args,{cwd:root,stdio:inherit?"inherit":"pipe",encoding:"utf8",env:childEnv});};
const compose=(base,args,inherit=true)=>docker(["compose",...base,...args],inherit);
const sleep=(ms)=>new Promise(resolveWait=>setTimeout(resolveWait,ms));
function findInstallCandidates(){const candidates=[];for(const p of [root,...readdirSync(dirname(root),{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>join(dirname(root),e.name))])if(existsSync(join(p,".env"))&&existsSync(join(p,"deploy",".active-profile.json")))candidates.push(p);return[...new Set(candidates)];}
function runPreflight(){for(const args of [["scripts/verify-full-release.mjs"],["scripts/preflight-source.mjs"],["scripts/migrate-postgres.mjs","--preflight"],["scripts/preflight-postgres-runtime.mjs","--static"],["scripts/template-preflight.mjs"],["scripts/openxml-preflight.mjs"],["scripts/verify-vntech-fingerprint.mjs"]]){const r=spawnSync(process.execPath,args,{cwd:root,stdio:"inherit"});if(r.status!==0)throw new Error(`Bộ cài không đạt kiểm tra: ${args.join(" ")}`);}}
async function waitHealthy(base,service,seconds=120){for(let n=0;n<Math.ceil(seconds/2);n+=1){const q=compose(base,["ps","-q",service],false),cid=String(q.stdout||"").trim();if(cid){const i=docker(["inspect","--format","{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}",cid],false),state=String(i.stdout||"").trim();if(state==="healthy"||(service!=="app"&&state==="running"))return true;if(["unhealthy","exited","dead"].includes(state))return false;}await sleep(2000);}return false;}
function must(r,message){if(r.status!==0)throw new Error(message);return r;}
function parseEnvText(text){const out={};for(const raw of String(text||"").split(/\r?\n/)){const line=raw.trim();if(!line||line.startsWith("#"))continue;const i=line.indexOf("=");if(i>0)out[line.slice(0,i).trim()]=line.slice(i+1);}return out;}
function setEnvValue(text,key,value){const line=`${key}=${String(value).replace(/\r?\n/g,"")}`;const re=new RegExp(`^${key.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}=.*$`,`m`);return re.test(text)?text.replace(re,line):`${text.replace(/\s*$/,"")}\n${line}\n`;}


let base=null,backupName="",backupCreated=false,migrationApplied=false,oldImageId="",rollbackTag="",appImage="";
async function rollback(){
  if(!base)return false;
  console.error("\n[ROLLBACK] Đang khôi phục bản trước nâng cấp...");
  compose(base,["stop","app"],true);
  let dbOk=true,imageOk=true,appOk=true;
  if(migrationApplied&&backupCreated&&backupName){
    const restore=compose(base,["run","--rm","--entrypoint","sh","backup","-c",`pg_restore --clean --if-exists --no-owner --no-privileges --dbname=\"$PGDATABASE\" /backups/database/${backupName}`],true);
    dbOk=restore.status===0;
    console.error(dbOk?"[ROLLBACK] Database đã khôi phục từ backup.":"[ROLLBACK] LỖI khôi phục database; giữ file backup để xử lý thủ công.");
  }
  if(oldImageId){
    const tag=docker(["tag",oldImageId,appImage],true);imageOk=tag.status===0;
    if(imageOk){compose(base,["up","-d","--no-deps","--force-recreate","app"],true);appOk=await waitHealthy(base,"app",120);}
  }
  console.error(`[ROLLBACK] DB=${dbOk?"OK":"FAIL"} · IMAGE=${imageOk?"OK":"FAIL"} · APP=${appOk?"OK":"FAIL"}`);
  return dbOk&&imageOk&&appOk;
}

console.log("===============================================================");
console.log(` VNTECH ERP V${RELEASE_VERSION} FULL W2 - NÂNG CẤP GIỮ DỮ LIỆU`);
console.log(" Có backup DB + rollback tự động nếu migration/build/health thất bại.");
console.log("===============================================================");
try{
  must(docker(["--version"],false),"Không tìm thấy Docker.");must(docker(["compose","version"],false),"Docker Compose chưa sẵn sàng.");runPreflight();
  const candidates=findInstallCandidates(),suggested=process.env.VNTECH_OLD_INSTALL_DIR||candidates.find(p=>p!==root)||candidates[0]||"";
  console.log("\nNhập thư mục CHƯƠNG TRÌNH CŨ đang chạy, nơi có .env và deploy\\.active-profile.json.");
  const answer=String(await rl.question(`Thư mục bản cũ${suggested?` [${suggested}]`:""}: `)||suggested).trim(),oldRoot=resolve(answer||root),oldEnv=join(oldRoot,".env"),oldProfile=join(oldRoot,"deploy",".active-profile.json");
  if(!existsSync(oldEnv)||!existsSync(oldProfile))throw new Error("Không tìm thấy .env hoặc deploy/.active-profile.json. Đã dừng để bảo vệ dữ liệu.");
  const profile=JSON.parse(readFileSync(oldProfile,"utf8")),overlay=String(profile.composeOverlay||"deploy/compose.direct.yml");if(!existsSync(join(root,overlay)))throw new Error(`Không tìm thấy ${overlay} trong bộ mới.`);
  console.log(`\nDữ liệu GIỮ NGUYÊN:\n- PostgreSQL: ${profile.localRoot||"theo .env cũ"}\n- Storage: ${profile.storagePath||"theo .env cũ"}\n- Backup: ${profile.backupPath||"theo .env cũ"}`);
  if(String(await rl.question("Gõ NANG_CAP để tiếp tục: ")).trim()!=="NANG_CAP")throw new Error("Chưa xác nhận NANG_CAP. Không có thay đổi nào được thực hiện.");
  let envText=readFileSync(oldEnv,"utf8");const oldEnvValues=parseEnvText(envText);const composeProject=oldEnvValues.VNTECH_COMPOSE_PROJECT||profile.composeProject||"vntech-erp";appImage=`${composeProject}:5.3.0-full-w2`;envText=setEnvValue(envText,"VNTECH_COMPOSE_PROJECT",composeProject);envText=setEnvValue(envText,"VNTECH_APP_IMAGE",appImage);envText=setEnvValue(envText,"VNTECH_RELEASE_BUILD",RELEASE_BUILD);envText=setEnvValue(envText,"VNTECH_PACKAGE_ID",PACKAGE_ID);envText=setEnvValue(envText,"VNTECH_UI_CONTRACT_ID",UI_CONTRACT_ID);envText=setEnvValue(envText,"VNTECH_TRUST_MODE","development");envText=setEnvValue(envText,"VNTECH_LICENSE_ENFORCEMENT","0");if(oldEnvValues.POSTGRES_PASSWORD&&!oldEnvValues.POSTGRES_PASSWORD_URLENCODED)envText=setEnvValue(envText,"POSTGRES_PASSWORD_URLENCODED",encodeDatabasePassword(oldEnvValues.POSTGRES_PASSWORD));writeFileSync(join(root,".env"),envText,"utf8");mkdirSync(join(root,"deploy"),{recursive:true});writeFileSync(join(root,"deploy",".active-profile.json"),JSON.stringify({...profile,version:RELEASE_VERSION,releaseBuild:RELEASE_BUILD,packageId:PACKAGE_ID,uiContract:UI_CONTRACT_ID,composeProject,appImage,upgradedFrom:oldRoot,upgradedAt:new Date().toISOString()},null,2)+"\n","utf8");
  base=["--env-file",".env","-f","deploy/docker-compose.yml","-f",overlay];
  console.log("\n[1/9] Kiểm tra PostgreSQL/Redis và giữ image App hiện tại...");must(compose(base,["up","-d","postgres","redis"]),"Không khởi động được PostgreSQL/Redis.");if(!(await waitHealthy(base,"postgres")))throw new Error("PostgreSQL không healthy.");if(!(await waitHealthy(base,"redis",90)))throw new Error("Redis không healthy.");
  const oldContainer=compose(base,["ps","-q","app"],false),oldCid=String(oldContainer.stdout||"").trim();if(oldCid){const oldInspect=docker(["inspect","--format","{{.Image}}",oldCid],false);oldImageId=String(oldInspect.stdout||"").trim();if(oldImageId){rollbackTag=`vntech-erp:pre-full-w2-${Date.now()}`;must(docker(["tag",oldImageId,rollbackTag]),"Không giữ được image App cũ để rollback.");}}
  console.log("[2/9] Backup database trước nâng cấp...");const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\..+/,"").replace("T","_");backupName=`pre_upgrade_full_w2_${stamp}.dump`;must(compose(base,["run","--rm","--entrypoint","sh","backup","-c",`mkdir -p /backups/database && pg_dump --format=custom --compress=6 --file=/backups/database/${backupName}`]),"Không tạo được backup trước nâng cấp.");backupCreated=true;
  console.log("[3/9] Dừng riêng App cũ...");must(compose(base,["stop","app"]),"Không dừng được App cũ.");
  console.log("[4/9] Build App V5.3.0 FULL W2 không dùng cache...");must(compose(base,["build","--no-cache","app"]),"Không dựng được App mới.");const iv=docker(["image","inspect",appImage,"--format","{{index .Config.Labels \"org.opencontainers.image.version\"}}|{{index .Config.Labels \"org.opencontainers.image.revision\"}}|{{index .Config.Labels \"vntech.package.id\"}}|{{index .Config.Labels \"vntech.ui.contract\"}}"],false);const expectedImage=`${RELEASE_VERSION}|${RELEASE_BUILD}|${PACKAGE_ID}|${UI_CONTRACT_ID}`;if(iv.status!==0||String(iv.stdout||"").trim()!==expectedImage)throw new Error("Image vừa dựng không đúng định danh FULL W2.");
  console.log("[5/9] Áp dụng migration giữ dữ liệu...");must(compose(base,["run","--rm","--no-deps","--entrypoint","node","app","scripts/migrate-postgres.mjs"]),"Migration thất bại.");migrationApplied=true;
  console.log("[6/9] PostgreSQL live preflight...");must(compose(base,["run","--rm","--no-deps","--entrypoint","node","app","scripts/preflight-postgres-runtime.mjs","--live"]),"PostgreSQL sau migration không đạt.");
  console.log("[7/9] Thay container App...");must(compose(base,["up","-d","--force-recreate","app","backup"]),"Không thay được container App.");must(compose(base,["up","-d"]),"Không khởi động được lớp truy cập/proxy.");if(!(await waitHealthy(base,"app",150))){compose(base,["logs","--tail","200","app"]);throw new Error("App V5.3.0 FULL W2 không healthy.");}
  console.log(`[8/9] Xác nhận build ${RELEASE_BUILD} qua /healthz...`);const verified=compose(base,["exec","-T","app","node","--input-type=module","-e",`const r=await fetch('http://127.0.0.1:8787/healthz',{cache:'no-store'});const j=await r.json();if(!r.ok||j.version!=='${RELEASE_VERSION}'||j.build!=='${RELEASE_BUILD}'||j.package!=='${PACKAGE_ID}'||j.uiContract!=='${UI_CONTRACT_ID}')throw new Error('Sai runtime '+JSON.stringify(j));console.log([j.build,j.package,j.uiContract].join('|'));`],false);const expected=[RELEASE_BUILD,PACKAGE_ID,UI_CONTRACT_ID].join("|");if(verified.status!==0||String(verified.stdout||"").trim()!==expected)throw new Error(`Máy chủ chưa phục vụ đúng ${RELEASE_BUILD}/${PACKAGE_ID}.`);const builtUi=compose(base,["exec","-T","app","node","scripts/verify-built-ui-contract.mjs","--runtime"],false);if(builtUi.status!==0)throw new Error("Runtime UI contract FULL W2 không đạt.");
  console.log("[9/9] Hoàn tất; giữ backup rollback...");console.log(`\nNÂNG CẤP VNTECH ERP ${RELEASE_BUILD} THÀNH CÔNG.`);console.log(`Backup trước nâng cấp: ${backupName}`);console.log("Dữ liệu cũ được giữ nguyên; nhấn Ctrl+F5 một lần.");
}catch(error){console.error(`\nLỖI NÂNG CẤP: ${error instanceof Error?error.message:String(error)}`);const ok=await rollback();console.error(ok?"ĐÃ ROLLBACK về App/DB trước nâng cấp.":"ROLLBACK chưa hoàn tất; KHÔNG tiếp tục vận hành cho đến khi kiểm tra backup/log.");process.exitCode=1;}finally{rl.close();}
