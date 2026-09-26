// VNTECH ERP V5.3.0 FULL W2 - Universal Central Server interactive installer
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { randomBytes, createHash } from "node:crypto";
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createServer as createNetServer } from "node:net";
import { mergeManagedEnv, encodeDatabasePassword } from "./installer-env.mjs";
import { inspectPostgresCluster, readInfrastructureState, infrastructureStateMatches, writeInfrastructureState } from "./installer-data-state.mjs";
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RELEASE_VERSION = VNTECH_IDENTITY.version;
const RELEASE_BUILD = VNTECH_IDENTITY.release.build;
const PACKAGE_ID = VNTECH_IDENTITY.release.packageId;
const UI_CONTRACT_ID = VNTECH_IDENTITY.release.uiContractId;
const UI_GENERATION = VNTECH_IDENTITY.release.uiGeneration;
const rl = createInterface({ input, output });
const isWin = process.platform === "win32";
const cleanInstall = process.env.VNTECH_FINAL_CLEAN_INSTALL === "1";
const winSystemDrive = String(process.env.SystemDrive || process.env.HOMEDRIVE || "C:").replace(/[\\/]+$/, "");
const normalize = (p) => isWin ? String(p).replaceAll("\\", "/") : String(p);
const secret = (bytes=24) => randomBytes(bytes).toString("base64url");
const composeProjectFor = (value) => `vntech-erp-${createHash("sha256").update(normalize(value).toLowerCase()).digest("hex").slice(0,10)}`;
const legacyComposeProjectFor = (value) => `kho-vntech-${createHash("sha256").update(normalize(value).toLowerCase()).digest("hex").slice(0,10)}`;
const imageForProject = (project) => `${project}:5.3.0-full-w2`;
function canBindPort(host, port) {
  return new Promise((resolvePort) => {
    const server=createNetServer();
    server.unref();
    server.once("error",()=>resolvePort(false));
    server.listen({host,port,exclusive:true},()=>server.close(()=>resolvePort(true)));
  });
}

function askChoice(text, options, def=1) {
  console.log(`\n${text}`); options.forEach((v,i)=>console.log(`  ${i+1}. ${v}`));
  return rl.question(`Chọn [${def}]: `).then(v => {
    const n = Number(v || def); return Number.isInteger(n) && n>=1 && n<=options.length ? n : def;
  });
}
async function ask(text, def="") {
  const v = await rl.question(`${text}${def ? ` [${def}]` : ""}: `); return String(v || def).trim();
}
function ensureDir(path) { mkdirSync(path, { recursive:true }); }
function dockerCompose(args, inherit=true) {
  // Docker Compose gives host environment variables precedence over --env-file.
  // Force the installer-managed .env values back into the Compose process so an
  // old Windows POSTGRES_PASSWORD/REDIS_PASSWORD cannot silently override the
  // credentials that were just written by this installer.
  const managed = parseEnvFile(join(root, ".env"));
  const childEnv = mergeManagedEnv(process.env, managed);
  const r = spawnSync("docker", ["compose", ...args], { cwd:root, stdio: inherit ? "inherit" : "pipe", encoding:"utf8", env:childEnv });
  return r;
}
function assertDocker() {
  const d = spawnSync("docker", ["--version"], { encoding:"utf8" });
  if (d.status !== 0) throw new Error("Không tìm thấy Docker. Hãy cài Docker Engine / Docker Desktop / Synology Container Manager trước.");
  const c = dockerCompose(["version"], false);
  if (c.status !== 0) throw new Error("Docker Compose chưa sẵn sàng.");
}
function assertPackageIdentity() {
  const marker=join(root,"VNTECH_FULL_W2_ID.txt");
  if(!existsSync(marker)) throw new Error("Thiếu VNTECH_FULL_W2_ID.txt - dừng để tránh chạy nhầm bộ cài VNTECH ERP.");
  const idText=readFileSync(marker,"utf8");
  if(!idText.includes(`PACKAGE=${PACKAGE_ID}`)||!idText.includes(`BUILD=${RELEASE_BUILD}`)) throw new Error(`Sai package identity. Yêu cầu ${PACKAGE_ID} / ${RELEASE_BUILD}.`);
  const active=readFileSync(join(root,"VNTECH_PACKAGE_ID.txt"),"utf8");
  if(!active.includes(`PACKAGE=${PACKAGE_ID}`)||!active.includes(`BUILD=${RELEASE_BUILD}`)) throw new Error("Active package identity không đồng nhất.");
  const runtime=readFileSync(join(root,"scripts/preflight-runtime-image.mjs"),"utf8");
  if(!runtime.includes("verify-built-ui-contract.mjs")||!runtime.includes("0049_master_baseline_identity_refresh_r1_1_1.sql")) throw new Error("Runtime preflight chưa khóa production UI contract/migration FULL W2.");
  const verify=spawnSync(process.execPath,["scripts/verify-full-release.mjs"],{cwd:root,stdio:"inherit"});
  if(verify.status!==0) throw new Error(`Package verification ${PACKAGE_ID} không đạt. Dừng trước Docker build.`);
  console.log(`Package identity: ${PACKAGE_ID} · ${RELEASE_BUILD} · verifier: ĐẠT.`);
}

function runFinalPreflight() {
  const checks = [
    ["scripts/preflight-source.mjs"],
    ["scripts/migrate-postgres.mjs", "--preflight"],
    ["scripts/preflight-postgres-runtime.mjs", "--static"],
    ["scripts/template-preflight.mjs"],
    ["scripts/openxml-preflight.mjs"],
    ["scripts/verify-vntech-fingerprint.mjs"],
  ];
  console.log("\nĐang kiểm tra toàn vẹn bộ cài FULL W2 trước khi tạo dữ liệu...");
  assertPackageIdentity();
  for (const args of checks) {
    const r = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
    if (r.status !== 0) throw new Error(`Bộ cài FULL W2 không đạt preflight: ${args.join(" ")}`);
  }
  console.log("Bộ cài FULL W2: ĐẠT toàn bộ preflight nguồn/migration/template.");
}
function envLine(k,v) { return `${k}=${String(v).replace(/\r?\n/g,"")}`; }
function parseEnvFile(file) {
  if (!existsSync(file)) return {};
  const out = {};
  for (const raw of readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const idx = line.indexOf("=");
    if (idx <= 0) continue;
    out[line.slice(0, idx).trim()] = line.slice(idx + 1);
  }
  return out;
}
function dirHasEntries(dir) {
  try { return existsSync(dir) && readdirSync(dir).length > 0; } catch { return true; }
}
function samePath(a, b) {
  if (!a || !b) return false;
  const aa = normalize(String(a)).replace(/\/+$/, "");
  const bb = normalize(String(b)).replace(/\/+$/, "");
  return isWin ? aa.toLowerCase() === bb.toLowerCase() : aa === bb;
}
async function waitServiceHealthy(composeArgs, service, seconds=90) {
  for (let i=0; i<Math.ceil(seconds/2); i+=1) {
    const q = dockerCompose([...composeArgs, "ps", "-q", service], false);
    const cid = String(q.stdout || "").trim();
    if (cid) {
      const inspect = spawnSync("docker", ["inspect", "--format", "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}", cid], { encoding:"utf8" });
      const state = String(inspect.stdout || "").trim();
      if (state === "healthy" || (service !== "postgres" && state === "running")) return true;
      if (["unhealthy","exited","dead"].includes(state)) return false;
    }
    await new Promise(r=>setTimeout(r,2000));
  }
  return false;
}
async function verifyHostRuntime(port) {
  const base=`http://127.0.0.1:${port}`;
  let health;
  try { health=await fetch(`${base}/healthz`,{cache:"no-store",headers:{"cache-control":"no-cache"}}); }
  catch(error){ throw new Error(`Máy Windows không truy cập được đúng App tại ${base}: ${error instanceof Error?error.message:String(error)}`); }
  const healthText=await health.text(); let body={}; try{body=JSON.parse(healthText);}catch{}
  if(!health.ok||body.version!==RELEASE_VERSION||body.build!==RELEASE_BUILD||body.package!==PACKAGE_ID||body.uiContract!==UI_CONTRACT_ID){
    throw new Error(`CỔNG ${port} đang phục vụ sai instance/build. Nhận được: ${healthText.slice(0,800)}`);
  }
  for(const [header,expected] of [["x-vntech-build",RELEASE_BUILD],["x-vntech-package",PACKAGE_ID],["x-vntech-ui-contract",UI_CONTRACT_ID]]){
    const got=health.headers.get(header)||""; if(got!==expected) throw new Error(`Host runtime header ${header} sai: ${got||"missing"}; cần ${expected}.`);
  }
  const home=await fetch(`${base}/?vntech_build=full-w2`,{cache:"no-store",headers:{"cache-control":"no-cache"}});
  const html=await home.text();
  if(!home.ok) throw new Error(`Không tải được giao diện thật từ ${base}: HTTP ${home.status}.`);
  for(const marker of [RELEASE_BUILD,PACKAGE_ID,UI_CONTRACT_ID,UI_GENERATION]){
    if(!html.includes(marker)) throw new Error(`HTML mà trình duyệt nhận tại cổng ${port} thiếu marker UI mới: ${marker}. Có thể đang trỏ vào instance/cache cũ.`);
  }
  console.log(`Host/browser route: ĐẠT · ${base} đang phục vụ đúng ${RELEASE_BUILD} / ${UI_GENERATION}.`);
  return base;
}

function removeManagedPath(p) {
  if (!p || !existsSync(p)) return;
  rmSync(p, { recursive:true, force:true });
}
function removeExistingProjectContainers(projectName) {
  const target = String(projectName || "").trim();
  if (!/^[-a-z0-9_]+$/.test(target)) throw new Error("Tên Docker project VNTECH ERP không hợp lệ.");
  const list = spawnSync("docker", ["ps", "-aq", "--filter", `label=com.docker.compose.project=${target}`], { encoding:"utf8" });
  if (list.status !== 0) throw new Error("Không kiểm tra được container của chính bộ cài hiện tại.");
  const ids = String(list.stdout || "").trim().split(/\s+/).filter(Boolean);
  if (!ids.length) return;
  console.log(`Đang dừng/xóa ${ids.length} container thuộc riêng Docker project ${target}...`);
  const rm = spawnSync("docker", ["rm", "-f", ...ids], { stdio:"inherit" });
  if (rm.status !== 0) throw new Error(`Không dừng/xóa được container thuộc ${target}.`);
}


console.log("==============================================================");
console.log(` VNTECH ERP V${RELEASE_VERSION} FULL W2 - UNIVERSAL CENTRAL SERVER EDITION`);
console.log(" Một bộ cài cho NAS / Server + NAS / Server độc lập");
console.log("==============================================================");

try {
  assertDocker();
  runFinalPreflight();
  const modeChoice = await askChoice("Môi trường triển khai", [
    "NAS All-in-One (Synology/QNAP/TrueNAS có Docker)",
    "Server riêng + NAS lưu hồ sơ/backup",
    "Server độc lập (toàn bộ dữ liệu trên server)",
    "Tùy chỉnh nâng cao",
  ], 2);
  const mode = ["nas-all-in-one","server-nas","server-standalone","custom"][modeChoice-1];
  const defaultRoot = isWin ? `${winSystemDrive}/${cleanInstall ? "VNTECH-ERP-SERVER-V530-FULL" : "VNTECH-ERP-SERVER"}` : (mode === "nas-all-in-one" ? "/volume1/VNTECH-ERP" : "/opt/vntech-erp");
  const localRoot = normalize(await ask("Thư mục dữ liệu máy chủ", defaultRoot));

  let storagePath, backupPath;
  if (mode === "server-nas") {
    const nasDefault = isWin ? "" : "/mnt/vntech-nas/VNTECH-ERP";
    const nasRoot = normalize(await ask("Thư mục NAS đã mount trên Server", nasDefault));
    if (!nasRoot) throw new Error("Phải nhập thư mục NAS đã mount trên Server; không dùng đường dẫn ổ đĩa cố định.");
    storagePath = `${nasRoot}/storage`; backupPath = `${nasRoot}/backups`;
  } else if (mode === "custom") {
    storagePath = normalize(await ask("Thư mục lưu ảnh/chứng từ", `${localRoot}/storage`));
    backupPath = normalize(await ask("Thư mục backup", `${localRoot}/backups`));
  } else {
    storagePath = `${localRoot}/storage`; backupPath = `${localRoot}/backups`;
  }

  const exposure = await askChoice("Cách người dùng truy cập", [
    "Trực tiếp IP/port trong LAN hoặc qua VPN",
    "Tên miền HTTPS công khai (Caddy reverse proxy)",
  ], mode === "server-standalone" ? 1 : 2);
  let publicHost = "", publicUrl = "", secureCookie = "0", composeOverlay = "deploy/compose.direct.yml";
  let appPort = "8787", bindAddress = "0.0.0.0";
  if (exposure === 2) {
    publicHost = await ask("Tên miền", "erp.vntech.vn");
    publicUrl = `https://${publicHost}`; secureCookie = "1"; composeOverlay = "deploy/compose.proxy.yml";
  } else {
    appPort = await ask("Cổng truy cập", "8787");
    bindAddress = await ask("Địa chỉ bind", "0.0.0.0");
    publicUrl = await ask("URL hiển thị trong email (có thể để trống)", "");
  }

  const nodeName = await ask("Tên máy chủ", mode === "nas-all-in-one" ? "VNTECH-NAS" : "VNTECH-SERVER-01");
  const poolMax = await ask("Số kết nối PostgreSQL tối đa cho App", "40");
  const retention = await ask("Giữ backup database bao nhiêu ngày", "30");
  const backupFiles = (await askChoice("Có tạo thêm file nén backup attachments hàng ngày? (NAS snapshot vẫn nên bật riêng)", ["Không", "Có"], 1)) === 2 ? "1" : "0";

  const dbData = `${localRoot}/postgres`;
  const redisData = `${localRoot}/redis`;
  const secrets = `${localRoot}/secrets`;
  const caddyData = `${localRoot}/caddy-data`;
  const caddyConfig = `${localRoot}/caddy-config`;
  const managedLocalPaths = [dbData, redisData, secrets, caddyData, caddyConfig];
  if (samePath(storagePath, `${localRoot}/storage`)) managedLocalPaths.push(storagePath);
  if (samePath(backupPath, `${localRoot}/backups`)) managedLocalPaths.push(backupPath);

  // IMPORTANT: classify the target data root BEFORE creating any directories or writing a new .env.
  // A package-local .env is NOT trusted as proof that an existing PostgreSQL cluster uses the same password,
  // because a failed install may already have overwritten that file with a new credential.
  const previousEnv = parseEnvFile(join(root, ".env"));
  const pgState = inspectPostgresCluster(dbData);
  const persistedInfrastructure = readInfrastructureState(localRoot);
  const persistedMatchesRoot = infrastructureStateMatches(persistedInfrastructure, dbData, "vntech_app", isWin);
  const persistedEnv = persistedMatchesRoot ? persistedInfrastructure.env : {};
  const persistedComposeProject = String(persistedEnv.VNTECH_COMPOSE_PROJECT || "").trim();
  const legacyComposeProject = legacyComposeProjectFor(localRoot);
  const composeProject = cleanInstall ? composeProjectFor(localRoot) : (persistedComposeProject || composeProjectFor(localRoot));
  const appImage = imageForProject(composeProject);
  const existingManaged = managedLocalPaths.filter(dirHasEntries);
  const canReuseExistingDb = pgState.initialized && persistedMatchesRoot;
  let reuseExistingInstall = false;
  let dataWasWiped = false;

  if (cleanInstall && pgState.initialized) {
    console.log(`\nPHÁT HIỆN POSTGRESQL ĐÃ KHỞI TẠO tại ${dbData}${pgState.version ? ` (PG ${pgState.version})` : ""}.`);
    if (canReuseExistingDb) {
      console.log(`Đã tìm thấy credential hạ tầng được lưu cùng thư mục dữ liệu: ${persistedInfrastructure.file}`);
      const retryChoice = await askChoice("Xử lý dữ liệu đã tồn tại", [
        "Tiếp tục bằng đúng credential đã lưu (dành cho lần cài trước bị gián đoạn)",
        "Dừng lại và chọn thư mục dữ liệu khác",
        "XÓA SẠCH dữ liệu cục bộ và cài mới hoàn toàn",
      ], 1);
      if (retryChoice === 1) {
        reuseExistingInstall = true;
        if (persistedComposeProject && persistedComposeProject !== composeProject) {
          console.log(`Đổi namespace runtime ${persistedComposeProject} → ${composeProject}; chỉ thay container, GIỮ NGUYÊN bind-mounted data.`);
          removeExistingProjectContainers(persistedComposeProject);
        }
        if (legacyComposeProject !== composeProject && legacyComposeProject !== persistedComposeProject) removeExistingProjectContainers(legacyComposeProject);
        console.log("Sẽ giữ PostgreSQL hiện tại và dùng lại credential hạ tầng đã lưu cùng data root.");
      } else if (retryChoice === 2) {
        throw new Error("Đã dừng trước Docker để bảo vệ dữ liệu. Hãy chạy lại và chọn thư mục dữ liệu khác.");
      } else {
        const confirm = await ask("Gõ chính xác XOA_SACH để xác nhận", "");
        if (confirm !== "XOA_SACH") throw new Error("Không nhận được xác nhận XOA_SACH. Không xóa dữ liệu.");
        removeExistingProjectContainers(composeProject);
        if (persistedComposeProject && persistedComposeProject !== composeProject) removeExistingProjectContainers(persistedComposeProject);
        if (legacyComposeProject !== composeProject && legacyComposeProject !== persistedComposeProject) removeExistingProjectContainers(legacyComposeProject);
        for (const p of existingManaged) removeManagedPath(p);
        dataWasWiped = true;
        console.log("Đã xóa dữ liệu cục bộ của lần cài trước theo xác nhận. Sẽ tạo credential mới.");
      }
    } else {
      console.log("KHÔNG tìm thấy credential hạ tầng đáng tin cậy đi kèm database này.");
      console.log("Bộ cài sẽ KHÔNG dùng .env nằm cạnh source vì file đó có thể đã bị ghi đè ở lần cài thất bại trước.");
      const orphanChoice = await askChoice("Bảo vệ database cũ", [
        "Dừng lại và giữ nguyên dữ liệu",
        "XÓA SẠCH dữ liệu cục bộ và cài mới hoàn toàn",
      ], 1);
      if (orphanChoice !== 2) throw new Error("Đã dừng TRƯỚC Docker/migration để bảo vệ PostgreSQL cũ. Hãy chọn thư mục mới hoặc xác nhận xóa sạch.");
      const confirm = await ask("Gõ chính xác XOA_SACH để xác nhận", "");
      if (confirm !== "XOA_SACH") throw new Error("Không nhận được xác nhận XOA_SACH. Không xóa dữ liệu.");
      removeExistingProjectContainers(composeProject);
      if (persistedComposeProject && persistedComposeProject !== composeProject) removeExistingProjectContainers(persistedComposeProject);
      if (legacyComposeProject !== composeProject && legacyComposeProject !== persistedComposeProject) removeExistingProjectContainers(legacyComposeProject);
      for (const p of existingManaged) removeManagedPath(p);
      dataWasWiped = true;
      console.log("Đã xóa cluster PostgreSQL cũ theo xác nhận. Sẽ cài mới với credential mới.");
    }
  } else if (cleanInstall && (pgState.partial || existingManaged.length > 0)) {
    console.log("\nCẢNH BÁO: Thư mục dữ liệu không sạch nhưng chưa xác nhận được một PostgreSQL cluster hoàn chỉnh:");
    existingManaged.forEach((p)=>console.log(`  - ${p}`));
    const cleanChoice = await askChoice("Xử lý dữ liệu cài đặt dở dang", [
      "Dừng lại để kiểm tra dữ liệu cũ",
      "XÓA SẠCH các thư mục dữ liệu cục bộ ở trên và cài mới",
    ], 1);
    if (cleanChoice !== 2) throw new Error("Đã dừng TRƯỚC Docker để bảo vệ dữ liệu cũ. Hãy chọn thư mục dữ liệu mới hoặc xác nhận xóa sạch.");
    const confirm = await ask("Gõ chính xác XOA_SACH để xác nhận", "");
    if (confirm !== "XOA_SACH") throw new Error("Không nhận được xác nhận XOA_SACH. Không xóa dữ liệu.");
    removeExistingProjectContainers(composeProject);
    if (persistedComposeProject && persistedComposeProject !== composeProject) removeExistingProjectContainers(persistedComposeProject);
    if (legacyComposeProject !== composeProject && legacyComposeProject !== persistedComposeProject) removeExistingProjectContainers(legacyComposeProject);
    for (const p of existingManaged) removeManagedPath(p);
    dataWasWiped = true;
    console.log("Đã xóa dữ liệu cài đặt dở dang theo xác nhận.");
  }

  // Check the requested host port only AFTER any explicitly authorized same-data-root legacy instance has been stopped.
  if (cleanInstall && exposure === 1) {
    let attempts=0;
    while (!(await canBindPort(bindAddress, Number(appPort)))) {
      attempts+=1;
      if (attempts>5) throw new Error("Không tìm được cổng truy cập trống sau 5 lần thử. Hãy kiểm tra dịch vụ/container khác đang chiếm cổng.");
      const suggested=String((Number(appPort)||8787)+1);
      console.log(`CẢNH BÁO: Cổng ${appPort} vẫn đang được dịch vụ KHÁC sử dụng sau khi xử lý instance VNTECH cùng data root.`);
      appPort = await ask("Chọn cổng khác cho bản cài này", suggested);
    }
  }

  for (const p of [localRoot, dbData, redisData, secrets, storagePath, backupPath, caddyData, caddyConfig]) ensureDir(p);

  const reuseCredentials = canReuseExistingDb && reuseExistingInstall && !dataWasWiped;
  const postgresPassword = reuseCredentials ? persistedEnv.POSTGRES_PASSWORD : secret(24);
  const redisPassword = reuseCredentials ? persistedEnv.REDIS_PASSWORD : secret(24);

  const env = [
    `# VNTECH ERP V${RELEASE_VERSION} FULL W2 - generated by Universal Installer`,
    envLine("VNTECH_RELEASE_BUILD", RELEASE_BUILD),
    envLine("VNTECH_PACKAGE_ID", PACKAGE_ID),
    envLine("VNTECH_UI_CONTRACT_ID", UI_CONTRACT_ID),
    envLine("VNTECH_TRUST_MODE", "development"),
    envLine("VNTECH_LICENSE_ENFORCEMENT", "0"),
    envLine("VNTECH_COMPOSE_PROJECT", composeProject),
    envLine("VNTECH_APP_IMAGE", appImage),
    envLine("VNTECH_DEPLOYMENT_MODE", mode),
    envLine("VNTECH_STORAGE_MODE", mode === "server-nas" ? "nas" : (mode === "nas-all-in-one" ? "nas-local" : "server-local")),
    envLine("VNTECH_NODE_NAME", nodeName),
    envLine("VNTECH_PUBLIC_HOST", publicHost),
    envLine("VNTECH_PUBLIC_URL", publicUrl),
    envLine("VNTECH_COOKIE_SECURE", secureCookie),
    envLine("VNTECH_BIND_ADDRESS", bindAddress),
    envLine("VNTECH_APP_PORT", appPort),
    envLine("VNTECH_DB_POOL_MAX", poolMax),
    envLine("VNTECH_DB_DATA_PATH", dbData),
    envLine("VNTECH_REDIS_DATA_PATH", redisData),
    envLine("VNTECH_STORAGE_HOST_PATH", storagePath),
    envLine("VNTECH_BACKUP_HOST_PATH", backupPath),
    envLine("VNTECH_SECRET_HOST_PATH", secrets),
    envLine("VNTECH_CADDY_DATA_PATH", caddyData),
    envLine("VNTECH_CADDY_CONFIG_PATH", caddyConfig),
    envLine("VNTECH_BACKUP_RETENTION_DAYS", retention),
    envLine("VNTECH_BACKUP_FILES_ENABLED", backupFiles),
    envLine("POSTGRES_DB", "vntech_erp"),
    envLine("POSTGRES_USER", "vntech_app"),
    envLine("POSTGRES_PASSWORD", postgresPassword),
    envLine("POSTGRES_PASSWORD_URLENCODED", encodeDatabasePassword(postgresPassword)),
    envLine("REDIS_PASSWORD", redisPassword),
    "",
  ].join("\n");
  writeFileSync(join(root,".env"), env, { encoding:"utf8", mode:0o600 });
  const infrastructureStatePath = writeInfrastructureState(localRoot, {
    VNTECH_DB_DATA_PATH: dbData,
    VNTECH_COMPOSE_PROJECT: composeProject,
    VNTECH_RELEASE_BUILD: RELEASE_BUILD,
    POSTGRES_DB: "vntech_erp",
    POSTGRES_USER: "vntech_app",
    POSTGRES_PASSWORD: postgresPassword,
    REDIS_PASSWORD: redisPassword,
  });
  console.log(`Credential hạ tầng được lưu cùng data root để lần cài sau không tự sinh sai mật khẩu: ${infrastructureStatePath}`);
  writeFileSync(join(root,"deploy",".active-profile.json"), JSON.stringify({ version:RELEASE_VERSION, releaseBuild:RELEASE_BUILD, packageId:PACKAGE_ID, uiContract:UI_CONTRACT_ID, composeProject, appImage, mode, composeOverlay, localRoot, storagePath, backupPath, publicUrl, publicHost, generatedAt:new Date().toISOString() }, null, 2)+"\n", "utf8");

  console.log("\nĐang kiểm tra cấu hình Docker Compose...");
  const check = dockerCompose(["--env-file", ".env", "-f", "deploy/docker-compose.yml", "-f", composeOverlay, "config"], false);
  if (check.status !== 0) throw new Error(`Cấu hình compose không hợp lệ:\n${check.stderr || check.stdout}`);
  console.log("Cấu hình: ĐẠT.");

  const start = await askChoice("Cài đặt/khởi động hệ thống ngay?", ["Có", "Chỉ lưu cấu hình"], 1);
  if (start === 1) {
    const composeArgs = ["--env-file", ".env", "-f", "deploy/docker-compose.yml", "-f", composeOverlay];
    if (cleanInstall) removeExistingProjectContainers(composeProject);
    console.log("\n[1/7] Khởi động PostgreSQL và Redis + kiểm tra credential...");
    let step = dockerCompose([...composeArgs, "up", "-d", "--force-recreate", "postgres", "redis"]);
    if (step.status !== 0) throw new Error("Không khởi động được PostgreSQL/Redis.");
    if (!(await waitServiceHealthy(composeArgs, "postgres", 120))) throw new Error("PostgreSQL không đạt trạng thái healthy.");
    if (!(await waitServiceHealthy(composeArgs, "redis", 90))) throw new Error("Redis không đạt trạng thái healthy.");

    const pgAuth = dockerCompose([...composeArgs, "exec", "-T", "postgres", "sh", "-lc", 'PGPASSWORD="$POSTGRES_PASSWORD" psql -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1 -Atqc "SELECT 1"'], false);
    if (pgAuth.status !== 0 || String(pgAuth.stdout || "").trim() !== "1") {
      dockerCompose([...composeArgs, "stop", "postgres", "redis"], false);
      throw new Error(`PostgreSQL credential không khớp với cluster tại ${dbData}. Installer đã dừng container và dừng TRƯỚC migration. Đây là trạng thái bất thường đã có guard; không được tự đổi mật khẩu hay tiếp tục migration.`);
    }
    const redisAuth = dockerCompose([...composeArgs, "exec", "-T", "redis", "redis-cli", "ping"], false);
    if (redisAuth.status !== 0 || String(redisAuth.stdout || "").trim() !== "PONG") {
      const detail = String(redisAuth.stderr || redisAuth.stdout || "").trim().slice(0, 600);
      throw new Error(`Redis credential kiểm tra không đạt${detail ? `: ${detail}` : "."}`);
    }
    console.log("Credential PostgreSQL/Redis: ĐẠT.");

    console.log(`[2/7] Dựng mới hoàn toàn App V${RELEASE_VERSION} (không dùng cache cũ)...`);
    step = dockerCompose([...composeArgs, "build", "--no-cache", "app"]);
    if (step.status !== 0) throw new Error("Build App không thành công.");
    const imageIdentity=spawnSync("docker",["image","inspect",appImage,"--format","{{index .Config.Labels \"org.opencontainers.image.version\"}}|{{index .Config.Labels \"org.opencontainers.image.revision\"}}|{{index .Config.Labels \"vntech.package.id\"}}|{{index .Config.Labels \"vntech.ui.contract\"}}"],{encoding:"utf8"});
    const expectedImageIdentity=`${RELEASE_VERSION}|${RELEASE_BUILD}|${PACKAGE_ID}|${UI_CONTRACT_ID}`;
    if(imageIdentity.status!==0||String(imageIdentity.stdout||"").trim()!==expectedImageIdentity)throw new Error("Ảnh ứng dụng vừa dựng không đúng định danh FULL W2. Bộ cài đã dừng.");

    console.log("Đang kiểm tra kết nối App → PostgreSQL bằng chính DATABASE_URL runtime...");
    const appPgAuth = dockerCompose([...composeArgs, "run", "--rm", "--no-deps", "--entrypoint", "node", "app", "--input-type=module", "-e", `import pg from 'pg'; const p=new pg.Pool({connectionString:process.env.DATABASE_URL,max:1,connectionTimeoutMillis:10000}); try{const r=await p.query('SELECT 1 AS ok'); if(String(r.rows?.[0]?.ok)!=='1') throw new Error('SELECT 1 khong dat'); console.log('APP_PG_OK');} finally {await p.end();}`], false);
    if (appPgAuth.status !== 0 || !String(appPgAuth.stdout || "").includes("APP_PG_OK")) {
      const detail = String(appPgAuth.stderr || appPgAuth.stdout || "").trim().slice(0, 1200);
      throw new Error(`Kết nối App → PostgreSQL không đạt trước migration${detail ? `: ${detail}` : "."}`);
    }
    console.log("Kết nối App → PostgreSQL: ĐẠT.");

    console.log("[3/7] Áp dụng migration PostgreSQL...");
    step = dockerCompose([...composeArgs, "run", "--rm", "--no-deps", "--entrypoint", "node", "app", "scripts/migrate-postgres.mjs"]);
    if (step.status !== 0) throw new Error("Migration PostgreSQL không thành công.");

    console.log("[4/7] Kiểm tra trực tiếp các truy vấn PostgreSQL nghiệp vụ...");
    step = dockerCompose([...composeArgs, "run", "--rm", "--no-deps", "--entrypoint", "node", "app", "scripts/preflight-postgres-runtime.mjs", "--live"]);
    if (step.status !== 0) throw new Error("PostgreSQL runtime query preflight không đạt.");

    console.log("[5/7] Chạy bootstrap smoke test có xác thực...");
    step = dockerCompose([...composeArgs, "run", "--rm", "--no-deps", "--entrypoint", "node", "app", "scripts/bootstrap-smoke-test.mjs"]);
    if (step.status !== 0) throw new Error("Bootstrap smoke test không đạt.");

    console.log("[6/7] Buộc thay container App cũ bằng bản vừa dựng...");
    step = dockerCompose([...composeArgs, "up", "-d", "--force-recreate", "app", "backup"]);
    if (step.status !== 0) throw new Error("Docker Compose không khởi động thành công.");
    step = dockerCompose([...composeArgs, "up", "-d"]);
    if (step.status !== 0) throw new Error("Không khởi động được lớp truy cập/proxy.");

    let appHealthy = false;
    console.log("Đang chờ riêng App đạt trạng thái healthy...");
    for (let i=0;i<60;i+=1) {
      const idResult = dockerCompose([...composeArgs, "ps", "-q", "app"], false);
      const cid = String(idResult.stdout || "").trim();
      if (cid) {
        const inspect = spawnSync("docker", ["inspect", "--format", "{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}", cid], { encoding:"utf8" });
        const state = String(inspect.stdout || "").trim();
        if (state === "healthy") { appHealthy = true; break; }
        if (["unhealthy","exited","dead"].includes(state)) break;
      }
      await new Promise(r=>setTimeout(r,2000));
    }
    if (!appHealthy) {
      dockerCompose([...composeArgs, "logs", "--tail", "200", "app"]);
      throw new Error("App không đạt trạng thái healthy sau khi khởi động.");
    }
    console.log(`[7/7] Xác nhận máy chủ đang phục vụ đúng ${RELEASE_BUILD}...`);
    const deployedVersion=dockerCompose([...composeArgs,"exec","-T","app","node","--input-type=module","-e",`const r=await fetch('http://127.0.0.1:8787/healthz',{cache:'no-store'});const j=await r.json();if(!r.ok||j.version!=='${RELEASE_VERSION}'||j.build!=='${RELEASE_BUILD}'||j.package!=='${PACKAGE_ID}'||j.uiContract!=='${UI_CONTRACT_ID}')throw new Error('Sai runtime '+JSON.stringify(j));console.log([j.build,j.package,j.uiContract].join('|'));`],false);
    const expectedRuntime=[RELEASE_BUILD,PACKAGE_ID,UI_CONTRACT_ID].join("|");
    if(deployedVersion.status!==0||String(deployedVersion.stdout||"").trim()!==expectedRuntime)throw new Error(`Health Check không xác nhận được đúng build/package/UI contract ${RELEASE_BUILD}; không báo cài đặt thành công.`);
    const builtUi=dockerCompose([...composeArgs,"exec","-T","app","node","scripts/verify-built-ui-contract.mjs","--runtime"],false);
    if(builtUi.status!==0)throw new Error(`Runtime UI contract không đạt: ${String(builtUi.stderr||builtUi.stdout||"").trim()}`);
    console.log("Đang xác nhận đúng cổng/HTML mà trình duyệt Windows sẽ nhận...");
    const browserBase=await verifyHostRuntime(appPort);
    console.log(`\nCÀI ĐẶT VNTECH ERP ${RELEASE_BUILD} HOÀN TẤT`);
    console.log(`Build đã xác nhận: ${RELEASE_BUILD}`);
    console.log(`Package đã xác nhận: ${PACKAGE_ID}`);
    console.log(`UI contract đã xác nhận: ${UI_CONTRACT_ID}`);
    console.log(`Docker project: ${composeProject}`);
    console.log(`Chế độ: ${mode}`);
    console.log(`Storage: ${storagePath}`);
    console.log(`Backup: ${backupPath}`);
    console.log(exposure === 2 ? `Địa chỉ: ${publicUrl}` : `Địa chỉ máy này: ${browserBase}/?vntech_build=full-w2`);
    if(exposure!==2) console.log(`LAN: http://<IP-MAY-CHU>:${appPort}/?vntech_build=full-w2`);
    console.log("File .env chứa mật khẩu hạ tầng. Chỉ quản trị IT được phép đọc.");
  } else {
    console.log(`\nĐÃ LƯU CẤU HÌNH ${RELEASE_BUILD}.`);
    console.log("CHƯA CÀI ĐẶT và CHƯA KHỞI ĐỘNG hệ thống.");
    console.log(`Docker project dành riêng cho cấu hình này: ${composeProject}`);
    console.log("Khi sẵn sàng, chạy lại bộ cài và chọn CÓ để build/migration/health-check.");
  }
} catch (error) {
  console.error(`\nLỖI CÀI ĐẶT: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
