// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, "..");
const runtimeRoot = join(projectRoot, ".sites-runtime");
const vinextCli = join(projectRoot, "node_modules", "vinext", "dist", "cli.js");
await import("./preflight-source.mjs");
await import("./verify-vntech-fingerprint.mjs");
await import("./template-preflight.mjs");
await import("./openxml-preflight.mjs");
const { runStaticPreflight } = await import("./preflight-postgres-runtime.mjs");
runStaticPreflight();

if (!existsSync(vinextCli)) {
  console.error("Không tìm thấy thành phần tạo bản chạy. Hãy chạy lại bộ cài FULL W2.");
  process.exit(69);
}

for (const directory of [
  join(runtimeRoot, "home"),
  join(runtimeRoot, "npm-cache"),
  join(runtimeRoot, "xdg-config"),
  join(runtimeRoot, "tmp"),
  join(runtimeRoot, "wrangler", "logs"),
]) {
  mkdirSync(directory, { recursive: true });
}

const environment = {
  ...process.env,
  SITES_ENV_READY: "1",
  SITES_PROJECT_ROOT: projectRoot,
  XDG_CONFIG_HOME: join(runtimeRoot, "xdg-config"),
  WRANGLER_WRITE_LOGS: "false",
  WRANGLER_SEND_METRICS: "false",
  WRANGLER_LOG_PATH: join(runtimeRoot, "wrangler", "logs"),
  MINIFLARE_REGISTRY_PATH: join(runtimeRoot, "wrangler", "registry"),
};

if (process.platform !== "win32") {
  environment.HOME = join(runtimeRoot, "home");
  environment.TMPDIR = join(runtimeRoot, "tmp");
}

for (const name of [
  "npm_config_proxy",
  "npm_config_http_proxy",
  "npm_config_https_proxy",
  "NPM_CONFIG_PROXY",
  "NPM_CONFIG_HTTP_PROXY",
  "NPM_CONFIG_HTTPS_PROXY",
]) {
  delete environment[name];
}

console.log("Dang tao ban chay phan mem...");
const builder = spawn(process.execPath, [vinextCli, "build"], {
  cwd: projectRoot,
  env: environment,
  stdio: "inherit",
});

let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  builder.kill("SIGTERM");
}, Number(process.env.SITES_BUILD_TIMEOUT_MS || 600000));

const exitCode = await new Promise((resolveExit, reject) => {
  builder.once("error", reject);
  builder.once("exit", (code) => resolveExit(code));
});
clearTimeout(timer);

if (timedOut) {
  console.error("Qua trinh tao ban chay vuot qua 3 phut va da dung.");
  process.exit(70);
}
if (exitCode !== 0) process.exit(exitCode ?? 1);

writeFileSync(join(projectRoot, "dist", ".mep-version"), "5.3.0\n", "utf8");
await import("./validate-artifact.mjs");
console.log("Đã ghi dấu bản chạy VNTECH ERP V5.3.0 FULL W2.");
