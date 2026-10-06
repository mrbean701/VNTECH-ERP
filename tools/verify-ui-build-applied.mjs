// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
//
// CỔNG 1 — «BẢN CHẠY CÓ MỚI HƠN MÃ NGUỒN KHÔNG?».
//
// ⛔ VÌ SAO CẦN CỔNG NÀY (sự cố 02/10/2026):
//   `scripts/local-server.mjs:20` NẠP `dist/server/index.js` một lần lúc khởi động, và
//   `scripts/local-runtime.mjs:180` phục vụ asset từ `dist/client`. ⇒ `:8787` là **BẢN BUILD TĨNH**,
//   KHÔNG có Vite dev server, KHÔNG có HMR. Sửa `.tsx`/`.css` trên đĩa **KHÔNG** lên trình duyệt
//   cho tới khi `npm run build` **và** khởi động lại `:8787`.
//   Đã xảy ra: sửa xong, `tsc` xanh, `npm test` xanh, nhưng người dùng "không thấy thay đổi gì".
//   ⇒ Hỏi "bao giờ build lại?" PHẢI là một CỔNG CHẠY ĐƯỢC, không phải trí nhớ.
//
// BA CÁI ĐO (đều đo trên đĩa + HTTP thật theo D-052 quy tắc 6):
//   1. ĐỘ MỚI     — file nguồn mới nhất trong `app|lib|public` có già hơn `dist/client` không?
//   2. VÂN TAY    — `<meta name="vntech-source-fingerprint">` trong HTML do `:9000` trả về có
//                    khớp `lib/vntech-identity-data.mjs` không?
//   3. BYTE       — mọi bundle `:9000` phục vụ có giống hệt tệp trên `dist/` không?
//
// Dùng:  node tools/verify-ui-build-applied.mjs            (mặc định cổng :9000)
//        node tools/verify-ui-build-applied.mjs --port 8787
//        node tools/verify-ui-build-applied.mjs --offline   (chỉ đo 1 và 2 từ đĩa)
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";

const THU_MUC_NGUON = ["app", "lib", "public"];

// ── Hàm THUẦN (được `tests/v217-dist-freshness.test.mjs` gọi trực tiếp) ───────

/** Vân tay nguồn đọc từ SSOT — không gõ tay. */
export function docSourceFingerprint(root) {
  const noiDung = readFileSync(resolve(root, "lib", "vntech-identity-data.mjs"), "utf8");
  const khop = noiDung.match(/sourceFingerprint:\s*"([0-9a-f]{64})"/);
  if (!khop) throw new Error("Khong doc duoc sourceFingerprint tu lib/vntech-identity-data.mjs");
  return khop[1];
}

/** Vân tay nguồn nhúng trong HTML mà máy chủ đã render. */
export function htmlSourceFingerprint(html) {
  const khop = String(html).match(/vntech-source-fingerprint"\s+content="([0-9a-f]{64})"/);
  return khop ? khop[1] : "";
}

/** Mọi tệp nguồn có ảnh hưởng tới bản build, đệ quy. */
export function lietKeNguon(root, thuMuc = THU_MUC_NGUON) {
  const ra = [];
  const di = (dir) => {
    for (const muc of readdirSync(dir, { withFileTypes: true })) {
      if (muc.name === "node_modules" || muc.name.startsWith(".")) continue;
      const duongDanh = join(dir, muc.name);
      if (muc.isDirectory()) di(duongDanh);
      else if (/\.(tsx?|css|mjs|json|png|svg)$/.test(muc.name)) ra.push(duongDanh);
    }
  };
  for (const muc of thuMuc) {
    const duongDanh = resolve(root, muc);
    if (existsSync(duongDanh)) di(duongDanh);
  }
  return ra;
}

/**
 * So mới nhất của nguồn với của bản build.
 * ⛔ So trên **mili giây từ đầu thập phân** (epoch ms) — `File.GetItem().LastWriteTime`
 *    hay `new Date(string)` đều dễ lệch, còn `stat.mtimeMs` là số nguyên ổn định.
 */
export function doDoMoi(root, { mocThoiGianBuild = null } = {}) {
  const khach = resolve(root, "dist", "client");
  if (!existsSync(khach)) return { coDist: false, buildMs: 0, nguonMoiNhat: "", soiMoiMs: null, soNguon: 0 };
  const buildMs = mocThoiGianBuild ?? statSync(khach).mtimeMs;
  const tatCa = lietKeNguon(root);
  let moiNhatMs = 0, moiNhat = "";
  for (const f of tatCa) {
    const ms = statSync(f).mtimeMs;
    if (ms > moiNhatMs) { moiNhatMs = ms; moiNhat = f.slice(root.length + 1); }
  }
  return { coDist: true, buildMs, nguonMoiNhat: moiNhat, nguonMoiNhatMs: moiNhatMs, soiMoiMs: moiNhatMs - buildMs, soNguon: tatCa.length };
}

const bam = (buf) => createHash("sha256").update(buf).digest("hex");

/** Thư mục chứa bundle JS đã build. */
export function thuMucBundle(root) {
  const khach = resolve(root, "dist", "client", "assets");
  return existsSync(khach) ? readdirSync(khach).filter((f) => f.endsWith(".js")) : [];
}

/** Phục vụ đúng byte trên đĩa? — đo qua HTTP thật, không đoán. */
export async function doByteTrenHttp(base, tenFile) {
  const r = await fetch(base + "/assets/" + tenFile);
  if (r.status !== 200) return { ok: false, lyDo: "HTTP " + r.status };
  const buf = Buffer.from(await r.arrayBuffer());
  const dia = readFileSync(resolve("dist", "client", "assets", tenFile));
  return { ok: bam(buf) === bam(dia), lyDo: bam(buf) === bam(dia) ? "" : "lech byte" };
}

// ── Chạy cổng ───────────────────────────────────────────────────────────────
export async function chayCong({ root = process.cwd(), cong = 9000, offline = false } = {}) {
  const ketQua = [];
  const ghi = (ten, du, chiTiet = "") => ketQua.push({ ten, du, chiTiet });

  // 1 · Độ mới
  const moi = doDoMoi(root);
  if (!moi.coDist) {
    ghi("do-moi", false, "khong co dist/client — chua build bao gio");
  } else if (moi.soiMoiMs > 0) {
    ghi("do-moi", false, `dist/ CU HON nguon ${Math.round(moi.soiMoiMs / 1000)}s · nguon moi nhat: ${moi.nguonMoiNhat}`);
  } else {
    ghi("do-moi", true, `dist/ moi hon nguon ${Math.round(-moi.soiMoiMs / 1000)}s · ${moi.soNguon} tep nguon da doi`);
  }

  const ssot = docSourceFingerprint(root);

  if (offline) {
    ghi("van-tay", true, "bo qua (che do --offline)");
    ghi("byte", true, "bo qua (che do --offline)");
  } else {
    // 2 · Vân tay trong HTML
    const base = `http://127.0.0.1:${cong}`;
    let html = "";
    try { html = await (await fetch(base + "/")).text(); } catch (e) { ghi("van-tay", false, "khong goi duoc " + base + " — " + e.message); }
    if (html) {
      const fp = htmlSourceFingerprint(html);
      if (!fp) ghi("van-tay", false, "HTML khong co meta vntech-source-fingerprint");
      else if (fp === ssot) ghi("van-tay", true, `HTML mang ${fp.slice(0, 16)} · khop SSOT`);
      else ghi("van-tay", false, `HTML van mang van tay CU ${fp.slice(0, 16)} · SSOT la ${ssot.slice(0, 16)}`);
    }

    // 3 · Byte
    const files = thuMucBundle(root);
    if (!files.length) ghi("byte", false, "khong co bundle .js trong dist/client/assets");
    else {
      const ket = [];
      for (const f of files) ket.push({ f, ...(await doByteTrenHttp(base, f)) });
      const bad = ket.filter((k) => !k.ok);
      ghi("byte", bad.length === 0, bad.length === 0 ? `${files.length}/${files.length} bundle dung byte tren :${cong}` : `${bad.length} bundle lech: ${bad.map((b) => b.f).join(", ")}`);
    }
  }

  return ketQua;
}

const chinh = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (chinh) {
  const cong = Number((process.argv.find((a) => a.startsWith("--port=")) || "--port=9000").split("=")[1]);
  const offline = process.argv.includes("--offline");
  console.log("=== CONG: BAN CHAY CO MOI HON MA NGUON KHONG? ===");
  const ketQua = await chayCong({ cong, offline });
  let dung = true;
  for (const k of ketQua) {
    console.log(`  ${k.du ? "\u2713" : "\u2717"} ${k.ten.padEnd(9)} ${k.chiTiet}`);
    if (!k.du) dung = false;
  }
  console.log("");
  if (!dung) {
    console.log("KET LUAN: BAN CHAY CU — can `npm run build` roi khoi dong lai :8787 (xem D-052 quy tac 1 va D-099).");
    console.log("  1) node scripts/local-server.mjs se tat o PID cu: can dung PID cua chinh no,");
    console.log("     KHONG dung Stop-Process node hang loat (khong duoc dung Java / proxy / dsh).");
    console.log("  2) neu app vua doi van tay nguon, cap nhat .local-data/warehouse.sqlite");
    console.log("     bang DROP trigger -> UPDATE vntech_product_identity -> CREATE trigger truoc.");
    process.exit(1);
  }
  console.log("KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT.");
  process.exit(0);
}