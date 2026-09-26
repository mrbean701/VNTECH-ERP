// KHO VNTECH Docker build guard.
// npm can occasionally omit transitive optional native packages from a clean
// Linux install. Tailwind/PostCSS then fails only inside Docker even though a
// host build passes. Repair and verify the exact Debian/glibc packages before
// the application build starts.
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

if (process.platform !== "linux") {
  console.log(`Native Docker build dependencies: SKIP (${process.platform}).`);
  process.exit(0);
}

const architecture = process.arch === "x64" ? "x64" : process.arch === "arm64" ? "arm64" : "";
if (!architecture) {
  throw new Error(`Kiến trúc Docker Linux chưa được hỗ trợ: ${process.arch}.`);
}

const nativePackages = [
  { id: `lightningcss-linux-${architecture}-gnu`, version: "1.31.1" },
  { id: `@tailwindcss/oxide-linux-${architecture}-gnu`, version: "4.2.1" },
];
const packages = nativePackages.map(({ id, version }) => `${id}@${version}`);

function verify() {
  require(`lightningcss-linux-${architecture}-gnu`);
  require(`@tailwindcss/oxide-linux-${architecture}-gnu`);
  require("lightningcss");
  require("@tailwindcss/oxide");
}

function verifyInFreshProcess() {
  const source = [
    `require("lightningcss-linux-${architecture}-gnu")`,
    `require("@tailwindcss/oxide-linux-${architecture}-gnu")`,
    'require("lightningcss")',
    'require("@tailwindcss/oxide")',
  ].join(";");
  const result = spawnSync(process.execPath, ["-e", source], { cwd: root, stdio: "inherit", env: process.env });
  if (result.status !== 0) throw new Error(`Dependency native đã cài nhưng không nạp được trong tiến trình mới (${result.status ?? "không rõ"}).`);
}

try {
  verify();
  console.log(`Native Docker build dependencies: ĐẠT sẵn (${process.platform}/${process.arch}/glibc).`);
} catch (firstError) {
  console.warn(`Native Docker build dependencies còn thiếu; đang cài bắt buộc: ${packages.join(", ")}`);
  const staging = mkdtempSync(join(tmpdir(), "vntech-native-deps-"));
  try {
    writeFileSync(join(staging, "package.json"), '{"name":"vntech-native-deps","private":true}\n', "utf8");
    const cache = join(tmpdir(), "vntech-npm-cache");
    mkdirSync(cache, { recursive: true });
    const result = spawnSync("npm", [
      "install",
      "--no-save",
      "--no-package-lock",
      "--include=optional",
      "--no-audit",
      "--no-fund",
      ...packages,
    ], { cwd: staging, stdio: "inherit", env: { ...process.env, npm_config_cache: cache } });
    if (result.status !== 0) {
      throw new Error(`Không cài được dependency native Linux (${result.status ?? "không rõ"}): ${firstError instanceof Error ? firstError.message : String(firstError)}`);
    }
    for (const { id } of nativePackages) {
      const segments = id.split("/");
      const source = join(staging, "node_modules", ...segments);
      const target = join(root, "node_modules", ...segments);
      mkdirSync(dirname(target), { recursive: true });
      cpSync(source, target, { recursive: true, force: true });
    }
  } finally {
    rmSync(staging, { recursive: true, force: true });
  }
  // The first failed require can be negatively cached by Node. Validate from
  // the same clean-process boundary used by the following Docker build step.
  verifyInFreshProcess();
  console.log(`Native Docker build dependencies: ĐÃ SỬA VÀ ĐẠT (${process.platform}/${process.arch}/glibc).`);
}
