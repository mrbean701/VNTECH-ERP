// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
/**
 * FIXPOINT VÂN TAY NGUỒN — công cụ THƯỜNG TRỰC (thay cho các probe `tmp-fixpoint.mjs` viết tay mỗi đợt).
 *
 * Chạy: `node tools/fixpoint-fingerprint.mjs`
 *
 * ⛔ VÌ SAO ĐẶT Ở `tools/`: `lib/trust/source-fingerprint.mjs` khai
 *    `ROOT_DIRS = {app, db, deploy, drizzle, lib, public, scripts, tests, worker}` —
 *    **`tools/` KHÔNG nằm trong đó** ⇒ công cụ này không tự làm vân tay đổi (D-055).
 *
 * ── CÁCH NÓ HOẠT ĐỘNG (đọc từ chính mô-đun, không đoán) ──────────────────────────────
 *   · `EXCLUDED = {"lib/vntech-identity-data.mjs"}` và `VNTECH_FINGERPRINT.json` KHÔNG nằm trong
 *     `ROOT_FILES` ⇒ **sửa hai tệp SSOT KHÔNG làm đổi vân tay**.
 *   · `normalizeText` thay mọi bản sao của `currentSourceFingerprint` + `LEGACY_SOURCE_FINGERPRINTS`
 *     bằng `<VNTECH_SOURCE_FINGERPRINT>`, nên vân tay cũ trong mã nguồn không làm vân tay trôi.
 *   ⇒ Nếu **không** tệp nguồn nào khác chứa vân tay thì fixpoint đạt sau **1 vòng**; nếu có (ví dụ
 *     một chú thích gõ cứng trong `scripts/`) thì cần vòng 2 — công cụ tự lặp tới khi bất động.
 *
 * ⛔ Chỉ GHI 2 tệp SSOT. Không đụng `migrationHead` / `release`.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { calculateSourceFingerprint } from "../lib/trust/source-fingerprint.mjs";
import { calculateBrandFingerprint } from "../lib/trust/fingerprint.mjs";
import { VNTECH_IDENTITY_DATA } from "../lib/vntech-identity-data.mjs";

const SSOT = "lib/vntech-identity-data.mjs";
const JSON_FILE = "VNTECH_FINGERPRINT.json";
const TOI_DA_VONG = 5;

const cu = {
  sourceFingerprint: VNTECH_IDENTITY_DATA.sourceFingerprint,
  sourceFingerprintShort: VNTECH_IDENTITY_DATA.sourceFingerprintShort,
  brandFingerprint: VNTECH_IDENTITY_DATA.brandFingerprint,
};
console.log("=== VÂN TAY CŨ ===");
console.log(`   source = ${cu.sourceFingerprint}`);
console.log(`   short  = ${cu.sourceFingerprintShort}`);
console.log(`   brand  = ${cu.brandFingerprint}`);

let vanTay = cu.sourceFingerprint, soVong = 0;
for (let vong = 1; vong <= TOI_DA_VONG; vong += 1) {
  const tinh = await calculateSourceFingerprint(process.cwd(), vanTay);
  if (tinh.fingerprint === vanTay) { soVong = vong - 1; break; }
  vanTay = tinh.fingerprint;
  soVong = vong;
  console.log(`   · vòng ${vong}: ${vanTay} (${tinh.fileCount} tệp)`);
}
if (!soVong) {
  console.log(`\nFIXPOINT: đã bất động — không cần ghi gì (${cu.sourceFingerprint})`);
  process.exit(0);
}

const shortMoi = `VNTECH-FP-${vanTay.slice(0, 16).toUpperCase()}`;
const brandMoi = await calculateBrandFingerprint({ ...VNTECH_IDENTITY_DATA, sourceFingerprint: vanTay });

console.log("\n=== VÂN TAY MỚI ===");
console.log(`   source = ${vanTay}`);
console.log(`   short  = ${shortMoi}`);
console.log(`   brand  = ${brandMoi}`);

for (const [tep, nhan] of [[SSOT, "SSOT"], [JSON_FILE, "JSON"]]) {
  const truoc = readFileSync(tep, "utf8");
  let sau = truoc
    .split(cu.sourceFingerprint).join(vanTay)
    .split(cu.sourceFingerprintShort).join(shortMoi)
    .split(cu.brandFingerprint).join(brandMoi);
  if (sau === truoc) throw new Error(`${nhan}: không có gì đổi — giá trị cũ trong SSOT có thể đã lệch`);
  // Giữ nguyên ký tự cuối tệp như bản gốc (chỉ thay chuỗi hex, không đụng xuống dòng).
  writeFileSync(tep, sau, "utf8");
  console.log(`   ${nhan}: ${truoc.length} → ${sau.length} ký tự`);
}

const lai = await calculateSourceFingerprint(process.cwd(), vanTay);
console.log("\n=== KIỂM ĐIỂM BẤT ĐỘNG ===");
console.log(`   tính lại = ${lai.fingerprint}`);
console.log(`   ${lai.fingerprint === vanTay ? `✔ FIXPOINT OK sau ${soVong} vòng` : "⛔ CHƯA BẤT ĐỘNG — chạy lại công cụ"}`);

const s2 = readFileSync(SSOT, "utf8");
console.log("\n=== KHẲNG ĐỊNH ===");
console.log(`   SSOT chứa vân tay mới  : ${s2.includes(vanTay)}`);
console.log(`   SSOT hết vân tay cũ    : ${!s2.includes(cu.sourceFingerprint)}`);
console.log(`   JSON chứa vân tay mới  : ${readFileSync(JSON_FILE, "utf8").includes(vanTay)}`);
console.log(`   migrationHead KHÔNG đổi: ${s2.includes(VNTECH_IDENTITY_DATA.release.migrationHead)}`);
console.log("\n   ⛔ BƯỚC TIẾP BẮT BUỘC: set-local-identity → npm run build → khởi động lại :8787 → cổng UI → npm test");
