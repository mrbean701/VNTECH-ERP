import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const required=["Dockerfile","deploy/docker-compose.yml","deploy/compose.direct.yml","deploy/compose.proxy.yml","scripts/universal-runtime.mjs","scripts/universal-server.mjs","scripts/postgres-d1.mjs","scripts/migrate-postgres.mjs","drizzle/0015_universal_central_server.sql"];
for(const rel of required) if(!existsSync(join(root,rel))) throw new Error(`Thiếu thành phần VNTECH ERP V5.3.0 FULL W2: ${rel}`);
if(existsSync(join(root,".env"))&&existsSync(join(root,"deploy/.active-profile.json"))){
  const profile=JSON.parse(readFileSync(join(root,"deploy/.active-profile.json"),"utf8"));
  const r=spawnSync("docker",["compose","--env-file",".env","-f","deploy/docker-compose.yml","-f",profile.composeOverlay,"config"],{cwd:root,encoding:"utf8"});
  if(r.status!==0) throw new Error(`Docker Compose config lỗi: ${r.stderr||r.stdout}`);
}
console.log("Kiểm tra Universal Central Server VNTECH ERP V5.3.0 FULL W2: ĐẠT.");
