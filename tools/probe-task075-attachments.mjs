// TASK-075 (§8.3) — CỔNG: ảnh/hồ sơ vật tư đặc thù có XEM ĐƯỢC không, và có bị TRÀN KHUNG không?
//
// Vấn đề gốc (docs/24 §15 dòng 5): "Hồ sơ vật tư đặc thù: ảnh/tệp đính kèm khó xem, tràn khung".
//
// ĐO ĐÚNG ĐƯỜNG NGƯỜI DÙNG DÙNG: `tools/cutover-proxy.mjs:39` xếp `/api/files` vào nhóm
// API_PREFIXES ⇒ sau proxy `:9000`, `/api/files` do **JAVA (:18081)** phục vụ, KHÔNG phải Node.
// (Đã đo: đăng nhập ở :8787 trả 401 vì runtime Node dùng SQLite riêng.) ⇒ cổng này đo trên :18081.
//
// 5 lớp đo:
//   A. HỢP ĐỒNG TÊN TRƯỜNG UI ↔ API — lớp lỗi IM LẶNG: UI đọc `file.mimeType` còn API trả
//      `mime_type` thì ảnh KHÔNG BAO GIỜ hiện mà không có lỗi nào để thấy.
//   B. BYTE ẢNH THẬT — không tin `Content-Type`: đọc CHỮ KÝ TỆP → chứng minh `<img>` có ảnh thật.
//   C. ĐƯỜNG KHÔNG COOKIE — chứng minh (B) chạy trên đường ĐÃ ĐĂNG NHẬP, không phải endpoint mở.
//   D. KIỂM TĨNH — "không tràn khung" phải là BIÊN CỨNG trong CSS/JSX, không phải lời hứa.
//   E. ĐỐI CHỨNG — phép kiểm chữ ký PHẢI báo sai với dữ liệu cố ý hỏng (bài học #25 của dự án).
//
// FIXTURE TẠM: vì dữ liệu thật hiện KHÔNG có tệp nào tới được (xem phần GHI NHẬN ở cuối), cổng
// cắm 1 dòng `attachments` + 1 tệp PNG hợp lệ vào đúng chủ dự án, đo, rồi DỌN SẠCH trong `finally`
// và KHẲNG ĐỊNH đã sạch (mức nền trở lại).

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { deflateSync } from "node:zlib";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const FILES_ROOT = process.argv[3] || join("java-backend", "data", "files");
const ATT_ID = "PRB075-ATT";
const FILE_NAME = "PRB075-anh.png";
const STORAGE_KEY = `goods_receipt/FIXTURE_PRJ/PRB075-ATT-PRB075-anh.png`.replace("FIXTURE_PRJ", "PRJ-PRB075");

const sqlRows = (query) => execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech",
  "vntech_erp", "--batch", "--raw", "--skip-column-names", "-e", query], { encoding: "utf8" })
  .trim().split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sql = (query) => execFileSync(MYSQL, ["--default-character-set=utf8mb4", "-uvntech", "-pvntech",
  "vntech_erp", "--batch", "--raw", "-e", query], { encoding: "utf8" });
const q = (v) => `'${String(v).replace(/'/g, "''")}'`;

const results = [];
const check = (name, ok, detail) => { results.push({ name, ok }); console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`); };
const note = (m) => console.log(`  (ghi nhận)  ${m}`);

/** PNG 8×8 RGB hợp lệ, dựng tại chỗ — không phụ thuộc tệp nào của kho. */
function makePng() {
  const crc32 = (buf) => { let crc = 0xffffffff; for (const b of buf) { crc ^= b; for (let k = 0; k < 8; k++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); } return (crc ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const w = 8, h = 8;
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const raw = Buffer.alloc(h * (1 + w * 3));
  for (let y = 0; y < h; y++) {
    const off = y * (1 + w * 3);
    raw[off] = 0;
    for (let x = 0; x < w; x++) { raw[off + 1 + x * 3] = x * 32; raw[off + 2 + x * 3] = y * 32; raw[off + 3 + x * 3] = 128; }
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0)),
  ]);
}

function signatureOf(bytes) {
  const b = (i) => bytes[i];
  if (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4e && b(3) === 0x47) return "image/png";
  if (b(0) === 0xff && b(1) === 0xd8 && b(2) === 0xff) return "image/jpeg";
  if (String.fromCharCode(b(0), b(1), b(2), b(3)) === "RIFF" && String.fromCharCode(b(8), b(9), b(10), b(11)) === "WEBP") return "image/webp";
  if (String.fromCharCode(b(0), b(1), b(2), b(3), b(4)) === "%PDF-") return "application/pdf";
  if (b(0) === 0x50 && b(1) === 0x4b) return "application/zip(ooxml)";
  return "không nhận dạng được";
}

async function login(username, password) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username, password }),
  });
  return { cookie: (res.headers.get("set-cookie") || "").split(";")[0], status: res.status };
}

let receiptId = "";
let rootPath = "";
let fixtureWritten = false;
let baselineAttachments = -1;

try {
  console.log("═══ TASK-075 (§8.3) · CỔNG ẢNH / HỒ SƠ VẬT TƯ ĐẶC THÙ ═══\n");
  rootPath = join(process.cwd(), FILES_ROOT);

  baselineAttachments = Number(sqlRows("SELECT COUNT(*) FROM attachments")[0][0]);
  note(`mức nền: attachments = ${baselineAttachments} dòng · kho tệp: ${existsSync(rootPath) ? "có" : "CHƯA CÓ"} (${FILES_ROOT})`);

  // Chủ dự án phải HỢP LỆ: Java tra qua `JOIN purchase_orders` (FileStoreAdapter:77-79),
  // nên chứng từ có `purchase_order_id` mồ côi sẽ bị 403 dù chính nó tồn tại.
  const valid = sqlRows(`SELECT gr.id,gr.receipt_no FROM goods_receipts gr JOIN purchase_orders po ON po.id=gr.purchase_order_id ORDER BY gr.receipt_no LIMIT 1`);
  if (!valid.length) { console.log("KHÔNG THỂ ĐO: không có chứng từ nào có purchase_order hợp lệ — không tính là ĐẠT."); process.exit(2); }
  receiptId = valid[0][0];
  const adminId = sqlRows("SELECT id FROM users WHERE username='admin'")[0][0];
  console.log(`Chứng từ dùng làm mốc: ${valid[0][1]} (${receiptId})\n`);

  // ── CẮM FIXTURE ───────────────────────────────────────────────────────────────
  const png = makePng();
  const diskPath = join(rootPath, STORAGE_KEY);
  mkdirSync(dirname(diskPath), { recursive: true });
  writeFileSync(diskPath, png);
  fixtureWritten = true;
  const stamp = new Date().toISOString().slice(0, 23).replace("T", " ");
  sql(`INSERT INTO attachments (id,entity_type,entity_id,file_name,storage_key,mime_type,uploaded_by,created_at,updated_at) VALUES (${q(ATT_ID)},'goods_receipt',${q(receiptId)},${q(FILE_NAME)},${q(STORAGE_KEY)},'image/png',${q(adminId)},${q(stamp)},${q(stamp)})`);
  check("C0 · cắm fixture (1 dòng attachments + 1 tệp PNG hợp lệ trên đĩa)", Number(sqlRows(`SELECT COUNT(*) FROM attachments WHERE id=${q(ATT_ID)}`)[0][0]) === 1 && existsSync(diskPath),
    `PNG ${png.length} byte · chữ ký=${signatureOf(png)}`);

  const admin = await login("admin", "Admin123456@");
  check("C1 · đăng nhập admin trên :18081", admin.status === 200 && Boolean(admin.cookie), `HTTP ${admin.status}`);

  // ── A. HỢP ĐỒNG TÊN TRƯỜNG ────────────────────────────────────────────────────
  const listRes = await fetch(`${BASE}/api/files?entityType=goods_receipt&entityId=${encodeURIComponent(receiptId)}`, { headers: { cookie: admin.cookie } });
  const list = await listRes.json().catch(() => ({}));
  const item = (list.attachments || []).find((a) => String(a.id) === ATT_ID);
  check("A1 · API danh sách trả 200 và CÓ tệp fixture", listRes.status === 200 && Boolean(item), `HTTP ${listRes.status} · ${(list.attachments || []).length} tệp`);
  if (item) {
    check("A2 · tập trường API = {createdAt,fileName,id,mimeType,uploadedByName}", Object.keys(item).sort().join(",") === "createdAt,fileName,id,mimeType,uploadedByName", Object.keys(item).sort().join(","));
    check("A3 · `mimeType` = `image/png` ⇒ UI lọc ảnh theo ĐÚNG tên trường", item.mimeType === "image/png", `API=${item.mimeType}`);
    check("A4 · `fileName` hiển thị đúng tên tệp", item.fileName === FILE_NAME, `API=${item.fileName}`);
  } else note("A2–A4 KHÔNG thực hiện được vì A1 không đạt — không tính là ĐẠT.");

  // ── B. BYTE ẢNH THẬT ──────────────────────────────────────────────────────────
  const fileRes = await fetch(`${BASE}/api/files?id=${encodeURIComponent(ATT_ID)}`, { headers: { cookie: admin.cookie } });
  const buf = new Uint8Array(await fileRes.arrayBuffer());
  const declared = fileRes.headers.get("content-type") || "";
  check("B1 · tải được tệp bằng cookie đã đăng nhập", fileRes.status === 200 && buf.length === png.length, `HTTP ${fileRes.status} · ${buf.length} byte (gửi ${png.length})`);
  check("B2 · `Content-Type` = image/png", declared.startsWith("image/png"), `header=${declared}`);
  check("B3 · BYTE THẬT đúng là ảnh PNG (chữ ký tệp), không phải trang lỗi", signatureOf(buf) === "image/png", `chữ ký=${signatureOf(buf)}`);
  check("B4 · byte tải về TRÙNG KHỚP từng byte với tệp đã lưu", buf.length === png.length && Buffer.from(buf).equals(png), "so từng byte");

  // ── C. ĐƯỜNG KHÔNG COOKIE ─────────────────────────────────────────────────────
  const anon = await fetch(`${BASE}/api/files?id=${encodeURIComponent(ATT_ID)}`);
  check("C2 · KHÔNG có cookie ⇒ bị chặn (phép đo ở B chạy trên đường đã đăng nhập thật)", anon.status === 401 || anon.status === 403, `HTTP ${anon.status}`);

  // ── E. ĐỐI CHỨNG ──────────────────────────────────────────────────────────────
  check("ĐC1 · dữ liệu cố ý hỏng (HTML) KHÔNG bị nhận là ảnh", signatureOf(new Uint8Array([0x3c, 0x21, 0x44, 0x4f, 0x43])) !== "image/png", "“<!DOC”");
  check("ĐC2 · PNG thật vẫn được nhận đúng", signatureOf(new Uint8Array([0x89, 0x50, 0x4e, 0x47])) === "image/png", "4 byte đầu PNG");
  check("ĐC3 · phân biệt được PNG với JPEG", signatureOf(new Uint8Array([0x89, 0x50, 0x4e, 0x47])) !== signatureOf(new Uint8Array([0xff, 0xd8, 0xff])), "png↔jpeg");
  check("ĐC4 · PNG dựng tại chỗ của cổng là ẢNH HỢP LỆ theo chữ ký", signatureOf(png) === "image/png", `${png.length} byte`);

  // ── D. KIỂM TĨNH ──────────────────────────────────────────────────────────────
  // ⚠️ MT2-P14-03c (23/09/2026) — VÁ TỆP ĐÍCH (⛔ KHÔNG hạ nhẹ phép kiểm): khối ĐÍNH KÈM đã được **TÁI SỬ DỤNG**
  // và CHUYỂN sang thư viện dùng chung **`lib/ui-shared.tsx`** (xem `CorrespondenceScreen.tsx:24`: «đã có sẵn ở
  // `lib/ui-shared.tsx:295`, `input multiple` + `/api/files`»). Bản cũ chỉ đọc `app/page.tsx` ⇒ báo ❌ OAN 3 mục
  // (D1/D2/D6) dù ĐO ĐƯỢC trong `lib/ui-shared.tsx`: D1 **1** khớp · D2 (ảnh `src`) **2** khớp · D6 (nhãn rỗng) **1** khớp.
  // Nay đọc **CẢ HAI** tệp (giữ nguyên toàn bộ nội dung phép kiểm).
  const page = readFileSync("app/page.tsx", "utf8") + "\n" + readFileSync("lib/ui-shared.tsx", "utf8");
  // CSS nằm ở HAI tệp: `app/globals.css` bị ĐÓNG BĂNG (cổng `master-baseline-gate.mjs` cấm append
  // sau mốc R1.1.1 END và chặn > 400653 byte) nên luật mới của TASK-075 nằm ở
  // `app/styles/canonical.css` — stylesheet của thư viện dùng chung.
  const css = readFileSync("app/globals.css", "utf8") + readFileSync("app/styles/canonical.css", "utf8");
  check("D1 · UI lọc ảnh theo `file.mimeType` (đúng tên trường API trả)", page.includes('String(file.mimeType || "").startsWith("image/")'));
  check("D2 · có ≥2 thẻ <img> trỏ đúng endpoint tệp (dải ảnh + ô thu nhỏ)", (page.split('src={`/api/files?id=${encodeURIComponent(file.id)}`}').length - 1) >= 2);
  check("D3 · ảnh bị chặn cứng chiều cao + `object-fit:cover` ⇒ không tràn khung", /\.attachment-photo img\{[^}]*height:118px[^}]*object-fit:cover/.test(css) && /\.attachment-thumb\{[^}]*object-fit:cover/.test(css));
  check("D4 · tên tệp dài NGẮT được (`overflow-wrap:anywhere`) ⇒ không đẩy tràn cột", css.includes("overflow-wrap:anywhere!important"));
  check("D5 · dải ảnh tự co theo bề rộng khung (`auto-fill` + `minmax`)", /\.attachment-photos\{[^}]*repeat\(auto-fill,minmax\(\d+px,1fr\)\)/.test(css));
  check("D6 · có trạng thái rỗng cho danh sách tệp", page.includes("Chưa có ảnh hoặc hồ sơ vật tư đặc thù được tải lên."));

  // ── GHI NHẬN DỮ LIỆU THẬT (không phải phép kiểm ĐẠT/HỎNG) ─────────────────────
  const orphans = sqlRows(`SELECT COUNT(*) FROM attachments a WHERE (a.entity_type='goods_receipt' AND NOT EXISTS(SELECT 1 FROM goods_receipts gr JOIN purchase_orders po ON po.id=gr.purchase_order_id WHERE gr.id=a.entity_id)) OR (a.entity_type='material_request' AND NOT EXISTS(SELECT 1 FROM material_requests m WHERE m.id=a.entity_id))`)[0][0];
  note(`DỮ LIỆU: ${orphans}/${baselineAttachments} dòng \`attachments\` KHÔNG tới được qua API (chứng từ đích mồ côi) — người dùng cần quyết định dọn hay giữ.`);
  note("GIỚI HẠN: cổng đo ĐƯỜNG ỐNG + hợp đồng trường + byte ảnh + biên CSS trong NGUỒN; KHÔNG đo phần render của UI (instance đang phục vụ `dist` cũ — TASK-034).");
} catch (error) {
  check("NGOẠI LỆ khi chạy", false, String((error && error.message) || error));
} finally {
  if (fixtureWritten) {
    try {
      sql(`DELETE FROM attachments WHERE id=${q(ATT_ID)}`);
      rmSync(join(rootPath, STORAGE_KEY), { force: true });
      const after = Number(sqlRows("SELECT COUNT(*) FROM attachments")[0][0]);
      check("C3 · DỌN SẠCH fixture — số dòng trở về mức nền và tệp đã xoá",
        after === baselineAttachments && !existsSync(join(rootPath, STORAGE_KEY)), `attachments=${after} (nền ${baselineAttachments})`);
    } catch (error) {
      check("C3 · dọn sạch fixture", false, String((error && error.message) || error));
    }
  } else note("Không có fixture nào được cắm ⇒ không cần dọn.");
  const failed = results.filter((r) => !r.ok);
  console.log(`\nKẾT QUẢ: ${results.length - failed.length}/${results.length} ĐẠT`);
  if (failed.length) console.log("HỎNG: " + failed.map((r) => r.name).join(" · "));
  process.exitCode = failed.length ? 1 : 0;
}
