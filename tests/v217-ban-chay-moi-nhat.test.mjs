// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
//
// VÒNG 217 — CỔNG «BẢN CHẠY CÓ MỚI HƠN MÃ NGUỒN KHÔNG?» (`tools/verify-ui-build-applied.mjs`).
//
// ⛔ VÌ SAO CÓ CỔNG NÀY (sự cố 02/10/2026 — người dùng: «không thấy bất cứ thay đổi gì ở frontend»):
//   `scripts/local-server.mjs:20` nạp `dist/server/index.js` MỘT LẦN lúc khởi động và
//   `scripts/local-runtime.mjs:180` phục vụ asset từ `dist/client`. ⇒ `:8787` là BẢN BUILD TĨNH,
//   KHÔNG có Vite dev server, KHÔNG có HMR. Sửa `.tsx` không lên trình duyệt tới khi
//   `npm run build` **và** khởi động lại `:8787`. Đã trả lời sai người dùng là «F5 là thấy».
//
// ⛔ CỔNG NÀY PHẢI TỰ CHỨNG MINH NÓ PHÁT HIỆN ĐƯỢC: mọi phép so đều được đo ngược —
//   đẩy mốc thời gian build về quá khứ và bắt nó phải báo «dist/ CŨ HƠN nguồn».
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");
const count = (hay, needle) => hay.split(needle).length - 1;

// ── ① Cổng tồn tại và KHÔNG có tác dụng phụ khi được import ────────────────
test("217-1 · cổng tồn tại, xuất hàm thuần, và không tự chạy khi import", () => {
  const xac = existsSync(new URL("tools/verify-ui-build-applied.mjs", root));
  assert.equal(xac, true, "thiếu tools/verify-ui-build-applied.mjs");
  const ma = read("tools/verify-ui-build-applied.mjs");
  // Phải có lớp hàm thuần để test gọi được, và có ranh giới "chạy khi gọi trực tiếp".
  assert.match(ma, /export function doDoMoi/);
  assert.match(ma, /export function htmlSourceFingerprint/);
  assert.match(ma, /export async function chayCong/);
  assert.match(ma, /import\.meta\.url === pathToFileURL\(process\.argv\[1\]\)\.href/);
});

// ── ② Nội dung cổng ghi đúng sự thật đã đo (⛔ §15: không mô tả sai) ────────
test("217-2 · cổng nêu đúng hai chỗ đã đo, không bịa thêm chuyện khác", () => {
  const ma = read("tools/verify-ui-build-applied.mjs");
  const localServer = read("scripts/local-server.mjs");
  const localRuntime = read("scripts/local-runtime.mjs");
  // Chỗ cổng dẫn phải thật, và phải dẫn đúng dòng.
  assert.match(localServer, /resolve\(projectRoot, "dist", "server", "index\.js"\)/);
  assert.match(localRuntime, /new LocalAssets\(join\(projectRoot, "dist", "client"\)\)/);
  // Cổng phải nói thẳng: không có HMR, sửa nguồn không tự lên.
  assert.match(ma, /KHÔNG có Vite dev server, KHÔNG có HMR/);
  assert.match(ma, /npm run build/);
  assert.match(ma, /khởi động lại `:8787`/);
  // ⛔ Không được hứa "chỉ cần F5" ở bất cỳ chỗ nào trong cổng.
  assert.equal(count(ma, "chỉ cần F5"), 0, "cổng không được hứa F5 là xong — đó chính là câu sai đã trả lời user");
});

// ── ③ Hàm thuần htmlSourceFingerprint — bắt được đủ 2 trường hợp ────────────
test("217-3 · htmlSourceFingerprint rút đúng meta, và trả rỗng khi thiếu", async () => {
  const { htmlSourceFingerprint } = await import(new URL("tools/verify-ui-build-applied.mjs", root).href);
  const fp = "fdcbf492f4832a5ac91dcb5b87c5183ba5ed39e2d1f33e891327bd2a7b9c0d39";
  const html = `<head><meta name="vntech-source-fingerprint" content="${fp}"/></head><body>x</body>`;
  assert.equal(htmlSourceFingerprint(html), fp);
  assert.equal(htmlSourceFingerprint("<html><head></head></html>"), "");
});

// ── ④ ĐỐI CHỨNG ÂM: cổng PHẢI bắt được dist/ cũ hơn mã nguồn ────────────────
test("217-4 · đẩy mốc build về TRƯỚC tệp nguồn mới nhất ⇒ cổng bắt được 'dist/ CŨ HƠN nguồn'", async () => {
  const { doDoMoi } = await import(new URL("tools/verify-ui-build-applied.mjs", root).href);
  // ⛔⛔ VÁ LỖI VỆ PHỤ THUỘC THỜI GIAN (phát hiện 05/10/2026 khi chạy cổng hồi quy trong giai đoạn GO-LIVE):
  //   Bản cũ ghim `mocThoiGianBuild: Date.now() - 24 * 3600 * 1000` rồi đòi `soiMoiMs > 0`.
  //   Vì `soiMoiMs = nguonMoiNhatMs - buildMs`, điều kiện đó tương đương
  //   «tệp nguồn mới nhất phải được sửa TRONG 24 GIỜ QUA» ⇒ vệ chỉ XANH khi có ai đó vừa chạm
  //   `app/|lib/|public/`. Giai đoạn GO-LIVE làm việc ở `scripts/`, `tests/`, Java và tài liệu,
  //   nên tệp nguồn mới nhất có thể đã hơn 50 giờ tuổi ⇒ **ĐỎ GIẢ dù hệ thống không có gì sai**.
  //   (Đo được lúc phát hiện: `lib/vntech-identity-data.mjs` có mtime cách 54,3 giờ > mốc 24 giờ.)
  //   Nay lấy mốc từ CHÍNH tệp nguồn mới nhất rồi lùi 1 giờ ⇒ TẤT ĐỊNH, không phụ thuộc đồng hồ,
  //   mà vẫn đúng nguyên ý nghĩa đối chứng âm: «bản build cũ hơn mã nguồn thì PHẢI bị bắt».
  const that = doDoMoi(process.cwd());
  assert.equal(that.coDist, true, "phai co dist/ để đo được");
  assert.ok(that.nguonMoiNhatMs > 0, "phai đo được mốc mtime của tệp nguồn mới nhất");
  const bay = doDoMoi(process.cwd(), { mocThoiGianBuild: that.nguonMoiNhatMs - 3600 * 1000 });
  assert.equal(bay.coDist, true, "phai co dist/ để đo được");
  assert.ok(bay.soNguon > 100, `phai quet được hàng trăm tệp nguồn, thay vi ${bay.soNguon}`);
  assert.ok(bay.soiMoiMs > 0, "mốc build TRƯỚC tệp nguồn mới nhất 1 giờ ⇒ dist/ BẮT BUỘC phải bị coi là cũ hơn nguồn");
  assert.ok(bay.nguonMoiNhat.length > 0, "phai chỉ ra tệp nguồn mới nhất để người đọc biết sửa gì");
});

// ── ⑤ ĐỐI CHỨNG ÂM: đẩy mốc build về tương lai ⇒ cổng báo ĐẠT ──────────────
test("217-5 · đẩy mốc build về tương lai ⇒ cổng KHÔNG báo động giả", async () => {
  const { doDoMoi } = await import(new URL("tools/verify-ui-build-applied.mjs", root).href);
  const tuongLai = doDoMoi(process.cwd(), { mocThoiGianBuild: Date.now() + 24 * 3600 * 1000 });
  assert.ok(tuongLai.soiMoiMs < 0, "mốc build 24h sau ⇒ dist/ mới hơn, phải báo ĐẠT");
});

// ── ⑥ SSOT của cổng phải trùng SSOT của toàn hệ thống ───────────────────────
test("217-6 · cổng đọc vân tay từ SSOT chứ không gõ tay (⛔ D-097a)", async () => {
  const { docSourceFingerprint } = await import(new URL("tools/verify-ui-build-applied.mjs", root).href);
  const ssot = docSourceFingerprint(process.cwd());
  assert.match(ssot, /^[0-9a-f]{64}$/);
  assert.equal(ssot, read("lib/vntech-identity-data.mjs").match(/sourceFingerprint:\s*"([0-9a-f]{64})"/)[1]);
  // Cổng không được chứa một mã vân tay gõ cứng bên cạnh (sẽ nhanh chóng lệch).
  const ma = read("tools/verify-ui-build-applied.mjs");
  assert.equal(count(ma.replace(ssot, ""), "fdcbf492"), 0, "cổng đang gõ cứng một vân tay");
});

// ── ⑦ Cổng phải nằm NGOÀI tập file tính vân tay nguồn (D-055) ───────────────
test("217-7 · đặt cổng trong tools/ để KHÔNG làm đổi vân tay nguồn (D-055)", () => {
  const ROOT_DIRS = ["app", "db", "deploy", "drizzle", "lib", "public", "scripts", "tests", "worker"];
  const duongDan = "tools/verify-ui-build-applied.mjs";
  const thuoc = ROOT_DIRS.some((d) => duongDan === d || duongDan.startsWith(d + "/"));
  assert.equal(thuoc, false, "cổng nằm trong tools/ — nếu đặt trong app|lib|scripts|tests thì sẽ tự làm vân tay đổi");
});