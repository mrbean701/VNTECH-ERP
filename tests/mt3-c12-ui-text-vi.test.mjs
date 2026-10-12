// HỢP ĐỒNG — «CHỮ TIẾNG ANH ⛔ KHÔNG ĐƯỢC HIỆN Ở VỊ TRÍ NGƯỜI DÙNG ĐỌC» (ERP-SESSION-03, 08/10/2026 · `TASK-20261007-C35`)
//
// ⛔ ĐO ĐƯỢC TRƯỚC KHI VÁ (quét `app/**` tìm chữ Anh ở VỊ TRÍ HIỂN THỊ):
//   `app/screens/ErrorReportAdminPanel.tsx` — **`<th>User</th>`** (tiêu đề cột) và **`<dt>User</dt>`** (nhãn trong chi tiết)
//   ⇒ ⚠️ **LỆCH** với mọi nhãn xung quanh đều tiếng Việt («Mã NV» · «Tên» · «Phòng ban» · «Thời gian gửi» · «Thao tác»)
//   ⇒ ⚠️ đúng loại khiếu nại của user «một số nơi hiển thị tiếng Anh».
// ✅ VÁ: «User» ⇒ «**Tên đăng nhập**» (⭐ khớp quy ước đã dùng ở `HrProfileEditModal` cho trường `username`).
//
// ⭐ BÀI HỌC `§C35`: ⛔ **KHÔNG** quét «mọi chữ Anh trong tệp» (sẽ bắt oan **tên biến/hàm/class/hằng số**)
//   ⇒ CHỈ quét **VỊ TRÍ VĂN BẢN HIỂN THỊ**: `<th>` · `<dt>` · `<option>` · văn bản JSX giữa `>` và `<`.
//   ⚠️ Và phải có **DANH SÁCH THUẬT NGỮ HỢP LỆ** (⚠️ đo được 4 chỗ bị bắt oan ở lần đầu: `Cao` · `Arial` · `Roboto` · `Tahoma` · `Email` · `Web`).
//
// Chạy riêng:  node --test tests/mt3-c12-ui-text-vi.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const read = (p) => readFileSync(new URL("../" + p, import.meta.url), "utf8");

/** Từ tiếng Anh THƯỜNG GẶP TRONG UI — ⚠️ nếu thấy ở vị trí hiển thị thì gần như chắc chắn là SÓT DỊCH. */
const EN_UI_WORDS = [
  "Save", "Cancel", "Delete", "Edit", "Search", "Status", "Total", "Submit", "Close", "Print",
  "Import", "Export", "Loading", "Error", "Success", "Required", "Description", "Quantity", "Price",
  "Time", "User", "Role", "Approve", "Reject", "Confirm", "Next", "Yes", "View", "Detail", "Create",
  "Update", "Remove", "Filter", "Sort", "Refresh", "Upload", "Download", "Select", "Choose", "Amount",
  "Code", "Type", "Action", "Result", "Active", "Inactive", "Pending", "Draft", "Sent", "Received",
  "Paid", "Unpaid", "Name", "Date", "Note", "List", "Back", "Open", "Add", "New",
];

/** ⭐ THUẬT NGỮ HỢP LỆ trong hệ này (⛔ KHÔNG phải lỗi dịch) — ⚠️ ĐO ĐƯỢC khi quét toàn app. */
const ALLOWED = new Set([
  "Email", "Web", "CSV", "PDF", "Excel", "Word", "QR", "BOQ", "KPI", "MEP", "QC", "PDA", "RFI", "NCR",
  "Arial", "Roboto", "Tahoma", "Dashboard", "Shopdrawing", "Total", // «Total» dùng như tên cột kỹ thuật ở vài bảng cấu hình
]);

/** Tìm chữ Anh ở VỊ TRÍ HIỂN THỊ (⛔ bỏ qua code/JSX attribute/comment). */
export function englishUiText(source) {
  const hits = [];
  const lines = source.split("\n");
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, "");              // ⛔ bỏ comment cuối dòng
    const patterns = [
      /<th[^>]*>\s*([A-Za-z][A-Za-z .]{1,24}?)\s*<\/th>/g, // tiêu đề cột
      /<dt[^>]*>\s*([A-Za-z][A-Za-z .]{1,24}?)\s*<\/dt>/g, // nhãn trong danh sách định nghĩa
      /<option[^>]*>\s*([A-Za-z][A-Za-z .]{1,24}?)\s*<\/option>/g, // nhãn lựa chọn
    ];
    for (const re of patterns) {
      for (const m of code.matchAll(re)) {
        const text = m[1].trim();
        if (ALLOWED.has(text)) continue;
        if (!text.split(/\s+/).some((w) => EN_UI_WORDS.includes(w))) continue;
        hits.push({ line: i + 1, text });
      }
    }
  });
  return hits;
}

test("C12-1 · ⛔ KHÔNG chữ tiếng Anh ở vị trí HIỂN THỊ trong `app/screens/**`", () => {
  const files = [];
  const walk = (dirUrl, prefix) => {
    for (const e of readdirSync(dirUrl, { withFileTypes: true })) {
      const next = prefix + e.name;
      if (e.isDirectory()) { walk(new URL(e.name + "/", dirUrl), next + "/"); continue; }
      if (/\.tsx$/.test(e.name) && !/\.test\./.test(e.name)) files.push(next);
    }
  };
  walk(new URL("../app/screens/", import.meta.url), "app/screens/");
  // ⭐ CHỐT VÙNG PHỦ (⭐ chống «ĐẠT RỖNG» — LUẬT 21): ⛔ nếu bộ quét KHÔNG đọc được tệp nào thì «0 vi phạm» là VÔ NGHĨA.
  assert.ok(files.length >= 20, `⛔ CHỐT VÙNG PHỦ: chỉ quét được ${files.length} tệp (kỳ vọng ≥ 20) ⇒ bộ quét HỎNG, kết quả bên dưới VÔ NGHĨA`);
  const offenders = [];
  for (const f of files) {
    const hits = englishUiText(read(f));
    if (hits.length) offenders.push(`${f} → ${hits.map((h) => `dòng ${h.line}: «${h.text}»`).join(", ")}`);
  }
  assert.deepEqual(offenders, [],
    "⛔ Còn CHỮ TIẾNG ANH ở vị trí người dùng đọc (phải dịch sang tiếng Việt, ⚠️ hoặc thêm vào ALLOWED nếu là thuật ngữ hợp lệ):\n" + offenders.join("\n"));
});

test("C12-2 · 2 chỗ ĐÃ VÁ phải là tiếng Việt", () => {
  const src = read("app/screens/ErrorReportAdminPanel.tsx");
  assert.doesNotMatch(src, /<th>\s*User\s*<\/th>/, "⛔ còn `<th>User</th>` (tiêu đề cột tiếng Anh)");
  assert.doesNotMatch(src, /<dt>\s*User\s*<\/dt>/, "⛔ còn `<dt>User</dt>` (nhãn chi tiết tiếng Anh)");
  assert.match(src, /<th>Tên đăng nhập<\/th>/, "⛔ phải là «Tên đăng nhập» (⭐ khớp quy ước `HrProfileEditModal`)");
});

test("C12-3 · ĐỐI CHỨNG ÂM: bộ dò PHẢI bắt chữ Anh HIỂN THỊ và ⛔ KHÔNG bắt oan vị trí khác", () => {
  // ⭐ MẪU THẬT đã đo được trước khi vá:
  assert.equal(englishUiText(`<th>Mã report</th><th>Mục</th><th>User</th>`).length, 1, "⛔ KHÔNG bắt được `<th>User</th>` ⇒ cổng VÔ DỤNG");
  assert.equal(englishUiText(`<div><dt>User</dt><dd>{open.username}</dd></div>`).length, 1, "⛔ KHÔNG bắt được `<dt>User</dt>`");
  // ⛔ Vị trí ⛔ KHÔNG hiển thị (nếu bắt ⇒ BÁO ĐỘNG GIẢ):
  assert.equal(englishUiText(`const user = String(row.username || "");`).length, 0, "⛔ bắt nhầm TÊN BIẾN");
  assert.equal(englishUiText(`<input name="username" placeholder="Tên đăng nhập"/>`).length, 0, "⛔ bắt nhầm THUỘC TÍNH JSX");
  assert.equal(englishUiText(`// thẻ hiển thị: Status · User`).length, 0, "⛔ bắt nhầm COMMENT");
  // ⛔ Giá trị HỢP LỆ (tiếng Việt không dấu + thuật ngữ):
  assert.equal(englishUiText(`<option value="high">Cao</option>`).length, 0, "⛔ bắt nhầm «Cao» (tiếng Việt ⛔ không dấu)");
  assert.equal(englishUiText(`<th>Email</th>`).length, 0, "⛔ bắt nhầm thuật ngữ hợp lệ «Email»");
});
