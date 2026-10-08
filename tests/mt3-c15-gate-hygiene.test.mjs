// META-GATE — «MỌI CỔNG HỢP ĐỒNG PHẢI CÓ **ĐỐI CHỨNG ÂM** VÀ **CHỐT VÙNG PHỦ**» (ERP-SESSION-03 · **LUẬT 21**)
//
// ⛔ VÌ SAO CÓ TỆP NÀY (⭐ 4 lần trong phiên 2026-10-07/09 «CỔNG XANH» nhưng **BỘ DÒ CHƯA ĐỦ MẠNH**):
//   `§C11` cổng responsive «xanh rỗng» · `§C34` bộ dò không khớp dạng tam phân thật · `§C41` bấm tab **trượt** mà quét vẫn «sạch» ·
//   **`§C53`** cổng `C14` chỉ khớp **1 trong 2 nhánh JSX** ⇒ ⚠️ **chỉ ca ĐỐI CHỨNG ÂM thất bại mới phát hiện ra**.
//
// ⇒ ⭐ **LUẬT**: một cổng ⛔ **KHÔNG được coi là hợp lệ** nếu ⛔ **thiếu ĐỐI CHỨNG ÂM** (ca chứng minh bộ dò **BẮT ĐƯỢC mẫu lỗi thật**).
// ⇒ ⭐ Và cổng quét nhiều tệp **PHẢI có CHỐT VÙNG PHỦ** (⚠️ đảm bảo bộ quét **thực sự đọc được tệp**, ⛔ nếu không thì «0 vi phạm» là VÔ NGHĨA).
//
// Chạy riêng:  node --test tests/mt3-c15-gate-hygiene.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const TESTS_DIR = new URL("./", import.meta.url);
const SELF = "mt3-c15-gate-hygiene.test.mjs";

/** Danh sách cổng hợp đồng `mt3-c*.test.mjs` (⛔ trừ chính meta-gate). */
export function gateFiles() {
  return readdirSync(TESTS_DIR)
    .filter((n) => /^mt3-c\d+.*\.test\.mjs$/.test(n) && n !== SELF)
    .sort();
}

/** ⭐ Cổng có **ĐỐI CHỨNG ÂM** không? (⭐ quy ước: ca/khối có ghi «ĐỐI CHỨNG ÂM»). */
export const hasNegativeControl = (src) => /ĐỐI CHỨNG ÂM/i.test(src);

/** ⭐ Cổng có **CHỐT VÙNG PHỦ** không? (⭐ quy ước: khẳng định số tệp/tệp bắt buộc — «CHỐT VÙNG PHỦ» hoặc `includes(` + `length >=`). */
// ⚠️ BÀI HỌC (23): bản đầu đòi `.length >= N` **VÀ** `includes(` ⇒ ⚠️ **BÁO OAN** tệp dùng biến tên khác (`ds` · `sqlFiles`) hoặc dùng `>` thay `>=`
//   (⭐ đo được: 2/5 tệp của phiên khác bị báo oan). Nay chấp nhận **MỌI tên biến** + `>=` **hoặc** `>`.
export const hasCoverageGuard = (src) =>
  /CHỐT VÙNG PHỦ/i.test(src) || /\w+\.length\s*[<>]=?\s*\d+/.test(src);

/** Cổng có khẳng định THẬT không? (⛔ không phải tệp rỗng chỉ có import). */
export const hasAssertions = (src) => /assert\./.test(src);

test("C15-1 · ⭐ CHỐT VÙNG PHỦ của chính meta-gate (⛔ không ĐẠT RỖNG)", () => {
  const gates = gateFiles();
  assert.ok(gates.length >= 8, `⛔ CHỐT VÙNG PHỦ: chỉ thấy ${gates.length} cổng \`mt3-c*.test.mjs\` (kỳ vọng ≥ 8) ⇒ bộ liệt kê HỎNG ⇒ kết quả bên dưới VÔ NGHĨA`);
  assert.ok(gates.includes("mt3-c13-hr-modal-no-wipe.test.mjs"), "⛔ CHỐT VÙNG PHỦ: cổng C13 phải nằm trong danh sách");
  assert.ok(gates.includes("mt3-c14-tab-form-remount.test.mjs"), "⛔ CHỐT VÙNG PHỦ: cổng C14 phải nằm trong danh sách");
});

test("C15-2 · MỌI cổng PHẢI có **ĐỐI CHỨNG ÂM** + **KHẲNG ĐỊNH THẬT** (⭐ luật 21)", () => {
  const missing = [];
  for (const f of gateFiles()) {
    const src = readFileSync(new URL(f, TESTS_DIR), "utf8");
    if (!hasAssertions(src)) missing.push(`${f} → ⛔ KHÔNG có \`assert.\` nào (tệp rỗng/vô nghĩa)`);
    else if (!hasNegativeControl(src)) missing.push(`${f} → ⛔ THIẾU «ĐỐI CHỨNG ÂM» (⚠️ cổng có thể «ĐẠT RỖNG»)`);
  }
  assert.deepEqual(missing, [],
    "⛔ CỔNG CHƯA ĐỦ CHUẨN (luật 21 — ⛔ 4 lần «cổng xanh» nhưng bộ dò chưa đủ mạnh trong phiên này):\n" + missing.join("\n") +
    "\n⇒ thêm ca ĐỐI CHỨNG ÂM: nạp **MẪU LỖI THẬT** (lấy nguyên văn từ lịch sử) và khẳng định bộ dò **BẮT ĐƯỢC** nó (⛔ nếu bộ dò không bắt ⇒ cổng VÔ DỤNG).");
});

test("C15-3 · Cổng QUÉT NHIỀU TỆP phải có **CHỐT VÙNG PHỦ**", () => {
  const missing = [];
  for (const f of gateFiles()) {
    const src = readFileSync(new URL(f, TESTS_DIR), "utf8");
    const scansMany = /readdirSync\(|walk\(new URL/.test(src);   // ⚠️ KHÔNG dùng `\*\*` — nó khớp **chữ in đậm Markdown** trong chú thích ⇒ BÁO OAN (bài học: kiểm bộ dò)
    if (scansMany && !hasCoverageGuard(src)) missing.push(`${f} → ⛔ quét nhiều tệp mà THIẾU «CHỐT VÙNG PHỦ» (⚠️ «0 vi phạm» có thể do KHÔNG đọc được tệp nào)`);
  }
  assert.deepEqual(missing, [], "⛔ Thiếu chốt vùng phủ:\n" + missing.join("\n"));
});

test("C15-4 · ĐỐI CHỨNG ÂM của CHÍNH meta-gate: bộ dò PHẢI bắt tệp cổng «xanh rỗng» (⛔ nếu không ⇒ meta-gate VÔ DỤNG)", () => {
  // ⭐ MẪU THẬT: cổng KHÔNG có đối chứng âm (⚠️ đúng loại đã gây 4 lần «ĐẠT RỖNG»)
  const bad = `import test from "node:test";\nimport assert from "node:assert/strict";\ntest("C99-1 · quét", () => { const x = []; assert.deepEqual(x, []); });\n`;
  assert.equal(hasNegativeControl(bad), false, "⛔ bộ dò HỎNG: không nhận ra cổng THIẾU đối chứng âm");
  assert.equal(hasAssertions(bad), true, "⛔ bộ dò HỎNG: không nhận ra có assert");
  // ⭐ Và ⛔ KHÔNG báo oan cổng ĐỦ CHUẨN:
  const good = `import test from "node:test";\nimport assert from "node:assert/strict";\ntest("C99-3 · ĐỐI CHỨNG ÂM: bộ dò PHẢI bắt mẫu cũ", () => { assert.equal(1, 1); });\n`;
  assert.equal(hasNegativeControl(good), true, "⛔ báo OAN cổng đủ chuẩn");
  // ⭐ Chốt vùng phủ: mẫu quét nhiều tệp mà thiếu chốt ⇒ PHẢI bị bắt
  const noGuard = `import { readdirSync } from "node:fs";\nassert.deepEqual([], []);`;
  assert.equal(hasCoverageGuard(noGuard), false, "⛔ bộ dò HỎNG: không nhận ra thiếu CHỐT VÙNG PHỦ");
  const withGuard = `import { readdirSync } from "node:fs";\nassert.ok(files.length >= 40);\nassert.ok(files.includes("a.tsx"));`;
  assert.equal(hasCoverageGuard(withGuard), true, "⛔ báo OAN cổng có chốt vùng phủ");
});
