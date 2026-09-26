// VNTECH ERP — TỰ ĐỘNG HOÁ CHU KỲ GIAI ĐOẠN (GĐ)
//
// Mỗi khi sửa file trong ROOT_DIRS (app/ lib/ scripts/ drizzle/ ...) thì quy trình
// bắt buộc là:
//   1. tạo file migration drizzle MỚI (script refresh từ chối chạy lại file đã có
//      fingerprint thật)
//   2. node tools/refresh-phase-identity.mjs <file> "<nhãn>"
//   3. build lại giao diện
// Bước 3 CHỈ chạy được khi Node UI + Proxy đã DỪNG và `.local-data` đã tạm chuyển ra
// ngoài (preflight-source.mjs quét file khoá bí mật).
//
//   node tools/gd-cycle.mjs "<NHÃN GIAI ĐOẠN>" [--no-build]
//
// tools/ KHÔNG thuộc ROOT_DIRS nên file này không ảnh hưởng fingerprint.
import { execFileSync } from "node:child_process";
import { readdirSync, writeFileSync, existsSync, renameSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const label = process.argv[2];
const noBuild = process.argv.includes("--no-build");
if (!label) {
  console.error('Cần nhãn giai đoạn. Ví dụ: node tools/gd-cycle.mjs "GIAI DOAN 1 - SAN CO CHU"');
  process.exit(64);
}

const slug = label.toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 40);

// 1) số thứ tự kế tiếp
const files = readdirSync(join(root, "drizzle")).filter((f) => /^\d{4}_.+\.sql$/.test(f));
const maxN = files.reduce((m, f) => Math.max(m, parseInt(f.slice(0, 4), 10)), 0);
const nextN = String(maxN + 1).padStart(4, "0");
const newFile = `${nextN}_phase_gd_${slug}_identity.sql`;

const body = `-- VNTECH ERP V5.3.0 ${label.toUpperCase()} (metadata identity refresh)
-- Không đổi nghiệp vụ và không đổi schema. Chỉ cập nhật source fingerprint sau khi
-- thay đổi mã nguồn giao diện/logic trong ROOT_DIRS.
--
-- Nhãn: ${label}

-- Giai đoạn này không thay đổi cấu trúc dữ liệu.
`;
writeFileSync(join(root, "drizzle", newFile), body, "utf8");
console.log(`[1/3] Tạo migration mới: drizzle/${newFile}`);

// 2) refresh identity
console.log("[2/3] refresh-phase-identity...");
const out = execFileSync(process.execPath, [join(root, "tools", "refresh-phase-identity.mjs"), newFile, label], {
  cwd: root, encoding: "utf8",
});
console.log(out.split("\n").filter((l) => /SOURCE|SHORT|RELEASE|HEAD|fixed point|COMPLETE/i.test(l)).join("\n"));

if (noBuild) { console.log("[3/3] Bỏ qua build (--no-build)."); process.exit(0); }

// 3) build — cần UI dừng + .local-data tạm chuyển
//
// ⚠️ HAI BẪY ĐÃ GẶP THẬT:
//   (a) KHÔNG dùng %TEMP%: mỗi phiên pwsh có %TEMP% riêng (dsh-XXXXXX) và bị xoá
//       khi phiên kết thúc → mất dữ liệu.
//   (b) KHÔNG dùng LOCALAPPDATA (ổ C:): workspace nằm ổ D: nên renameSync báo
//       EXDEV "cross-device link not permitted".
// → Thư mục tạm phải CÙNG Ổ với workspace và nằm NGOÀI workspace (để không lọt
//   vào manifest/fingerprint).
const ld = join(root, ".local-data");
const stash = join(dirname(root), "_vntech-buildstash");
let moved = false;
if (existsSync(ld)) {
  if (existsSync(stash)) execFileSync("cmd", ["/c", "rmdir", "/s", "/q", stash], { stdio: "ignore" });
  mkdirSync(dirname(stash), { recursive: true });
  renameSync(ld, stash);
  moved = true;
  console.log(`      (.local-data tạm chuyển -> ${stash})`);
}
try {
  console.log("[3/3] build-cross-platform...");
  const b = execFileSync(process.execPath, [join(root, "scripts", "build-cross-platform.mjs")], {
    cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024,
  });
  const tail = b.split("\n").filter((l) => /BUILT ARTIFACT|Build complete|DẠT|ĐẠT/i.test(l));
  console.log(tail.length ? tail.join("\n") : "(build xong, không thấy dòng xác nhận)");
} finally {
  if (moved) { renameSync(stash, ld); console.log("      (.local-data đã khôi phục)"); }
}
console.log("\nXONG. Nhớ khởi động lại Node UI + Proxy.");
