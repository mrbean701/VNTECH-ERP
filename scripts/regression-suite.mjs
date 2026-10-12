// CỔNG HỒI QUY — `npm run test:regression`
//
// VÌ SAO TÁCH RA THÀNH TỆP RIÊNG (vòng 197 — đóng D-063)
//   Trước đây cổng là MỘT CHUỖI TĨNH ghi trong `package.json`. Nó chỉ chạy 14 tệp
//   trong khi `tests/` có 119 ⇒ 105 tệp KHÔNG chạy ở BẤT KỲ đâu, kể cả CI.
//   Chuỗi tĩnh còn tự lệch âm thầm: thêm tệp thử mới ⇒ không tệp nào báo động.
//   ⇒ Danh sách cổng nay được SUY RA từ thư mục `tests/` + danh sách `KNOWN_RED`.
//     Không còn cách nào để một tệp thử lọt khỏi cổng mà không ai biết.
//
// ⛔ `KNOWN_RED` = NỢ CŨ ĐÃ BIẾT (giống `KNOWN_DEAD_CANONICAL` của `verify:css-baseline`)
//   • NỢ CŨ thì GHI NHẬN, không xoá.
//   • NỢ MỚI thì KHÔNG THỂ giấu: mọi tệp không nằm trong `KNOWN_RED` đều BẮT BUỘC xanh.
//
// ⚠️ BẮT BUỘC khi chạy: `node --import tsx --test`.
//   Bỏ `--import tsx` thì mọi tệp import `.tsx` chết với ERR_UNKNOWN_FILE_EXTENSION
//   ⇒ báo đỏ một cách GIẢ (đã dính 1 lần ở vòng 193).
import { readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

// ─────────── NỢ CŨ ĐÃ BIẾT ───────────
// Mỗi mục: tên tệp · vì sao đỏ · mốc sẽ gỡ. ⛔ KHÔNG xoá mục nào ở đây khi chưa xử lý xong.
// 📌 VÒNG 196 — phân loại lại theo bằng chứng (tên test đỏ + vị trí lỗi): 8 tệp đỏ vì
//   ĐỢT MT3 ĐÃ ROLLBACK (7 tệp `mt3-*` + `p2-d4`, vì test đỏ của nó mang dấu MT3-B.2 ngay
//   trong tên). Không còn tệp đỏ không-MT3 nào. `pr03` đã xanh (khẳng định sót từ PR-01).
// 🧊🛑 CHỐT 09/10/2026 — `DEC-20261008-015` (QUYẾT ĐỊNH USER, nguyên văn):
//   «MT3 đã rollback không lấy MT3 làm căn cứ cho công việc sắp tới nữa»
//   ⇒ 8 mục dưới đây = **NỢ CŨ ĐÓNG BĂNG (MT3)**: giữ để cổng ⛔ KHÔNG giấu nợ mới,
//     ⚠️ nhưng ⛔ KHÔNG phải «việc cần làm» và ⛔ KHÔNG là căn cứ cho công việc sắp tới ✓
//   📏 Đo được: `git log unity..backup/mt3-head-20260928` = 0 commit · `git diff --shortstat` = rỗng
//     ⇒ khôi phục MT3 = ⛔ không đổi gì (lựa chọn (b) bất khả thi) ✓
export const KNOWN_RED = [
  ["mt3-be-05-material-alias-search.test.mjs", "MT3 ĐÓNG BĂNG (DEC-20261008-015) — ĐÍNH CHÍNH 09/10: lib/material-alias.ts CÓ ở CẢ HAI nhánh; đỏ vì thiếu HÀNH VI alias, KHÔNG phải thiếu tệp", "MT3-BE-05"],
  ["mt3-ui-04-no-project-block.test.mjs", "thuộc đợt MT3 đã rollback", "MT3-UI-04"],
  ["mt3-ui-12d-purchasing-hub-tabs.test.mjs", "thuộc đợt MT3 đã rollback", "MT3-UI-12d"],
  ["mt3-ui-13-material-alias.test.mjs", "thuộc đợt MT3 đã rollback", "MT3-UI-13"],
  ["mt3-ui-14-admin-notification.test.mjs", "modal thông báo thiếu ô tìm/lọc + danh sách đã chọn; chỉ có ở nhánh MT3 đã rollback", "MT3-UI-14"],
  ["mt3-ui-25-all-groups-tabs.test.mjs", "thuộc đợt MT3 đã rollback", "MT3-UI-25"],
  ["mt3-ui-28-requests-permission.test.mjs", "thuộc đợt MT3 đã rollback", "MT3-UI-28"],
  ["p2-d4-approval-timeline.test.mjs", "test đỏ mang dấu MT3-B.2 ngay trong TÊN + thông điệp ⇒ thuộc đợt MT3 đã rollback, KHÔNG phải hồi quy P2-D4", "P2-D4"],
];
export const knownRedNames = new Set(KNOWN_RED.map((row) => row[0]));

export const TEST_RE = /\.test\.(mjs|ts|tsx|js|cjs|mts|cts)$/;
export const allTests = () => readdirSync("tests").filter((f) => TEST_RE.test(f)).sort();
/** Mọi tệp thử KHÔNG phải nợ đã biết ⇒ đều phải chạy trong cổng và đều phải xanh. */
export const gateTests = () => allTests().filter((f) => !knownRedNames.has(f));

export function main() {
  const cua = allTests();
  const chay = gateTests();
  const trong = new Set(cua);
  // 📌 Ràng buộc có THẬT: mọi mục `KNOWN_RED` phải còn tệp thật.
  //   Mục trỏ tới tệp đã bị xoá ⇒ hợp đồng đã chết mà danh sách vẫn tỏ ra đang bao phủ.
  //   (Ràng buộc "tệp nào chưa được gán vào đâu" là VÔ ĐỊNH — `chay` đã bằng `cua` trừ
  //   `KNOWN_RED`, nên nó luôn rỗng và luôn xanh. Đã viết rồi gỡ.)
  const cu = [...knownRedNames].filter((name) => !trong.has(name));
  if (cu.length) {
    console.error("❌ `KNOWN_RED` có mục trỏ tới tệp KHÔNG tồn tại — xoá mục đó trong scripts/regression-suite.mjs:");
    for (const name of cu) console.error("   " + name);
    process.exit(1);
  }
  if (!chay.length) {
    console.error("❌ Gate rong — `node --test` se XANH gia cho khong chay tep nao.");
    process.exit(1);
  }
  console.log("🚪 CỔNG HỒI QUY — " + chay.length + "/" + cua.length + " tệp (trừ " + knownRedNames.size + " tệp nợ đã biết)\n");
  const r = spawnSync("node", ["--import", "tsx", "--test", ...chay.map((f) => "tests/" + f)], {
    stdio: "inherit",
  });
  process.exit(r.status === null ? 1 : r.status);
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) main();
