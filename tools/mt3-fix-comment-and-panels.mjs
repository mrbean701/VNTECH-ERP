// USER 28/09/2026 — SỬA 2 LỖI BỐ CỤC Ở MÀN «PHIẾU CHỜ DUYỆT».
//   ① KHUNG NHẬP BÌNH LUẬN bị chồng lấn: đo thật cho thấy `.approval-comment` có `display:inline`
//      (mặc định của `<label>`) và ⛔ KHÔNG có luật CSS nào ⇒ `<span>BÌNH LUẬN</span>` và `<textarea>`
//      nằm CẠNH NHAU, textarea nhảy lên trên. Sửa: `display:grid` + `textarea{width:100%}`.
//   ② 3 KHUNG bên trái–giữa–phải lệch chiều cao (đo: 770 / 590 / 786 ⇒ lệch 196px) vì
//      `.approval-workbench{align-items:start}` ⇒ mỗi khóm cao theo nội dung riêng.
//      Sửa: `align-items:stretch` + `.card{height:100%}`.
//   ➕ Phòng thủ: `value={approvalComment ?? ""}` để KHÔNG BAO GIỜ lộ chữ "null" trong ô nhập.
import { readFileSync, writeFileSync } from "node:fs";

const END_MARK = "/* VNTECH_MASTER_BASELINE_CSS_R1_1_1_END */";

// ── ① + ②: CSS ──────────────────────────────────────────────────────────────
const CSS_FILE = "app/globals.css";
let css = readFileSync(CSS_FILE, "utf8");
const TAG = "/* USER 28/09/2026: BINH LUAN + 3 KHUNG BANG NHAU */";
if (css.includes(TAG)) {
  console.log("  (CSS đã có — bỏ qua)");
} else {
  const BLOCK = [
    TAG,
    "// ① <label> mặc định là `display:inline` ⇒ <span> và <textarea> nằm CẠNH NHAU và textarea",
    "//    nhảy lên trên (đo thật: span y=1134 · textarea y=1100 ⇒ CHỒNG LẤN). `display:grid`",
    "//    xếp dọc: label ở trên, ô nhập ở dưới — đúng như yêu cầu.",
    ".approval-comment{display:grid!important;grid-template-columns:minmax(0,1fr)!important;gap:6px!important;padding:12px 16px 0!important;}",
    ".approval-comment>span{font-size:calc(8.3px * var(--user-font-scale))!important;font-weight:850!important;color:#61748b!important;letter-spacing:.02em!important;}",
    ".approval-comment>textarea{display:block!important;width:100%!important;min-height:62px!important;max-height:220px!important;resize:vertical!important;box-sizing:border-box!important;padding:8px 10px!important;border:1px solid #dce5ef!important;border-radius:8px!important;background:#fff!important;color:inherit!important;font:inherit!important;font-size:calc(9px * var(--user-font-scale))!important;line-height:1.45!important;}",
    'html[data-theme="dark"] .approval-comment>textarea{background:#131c2b!important;border-color:#2a3a55!important;}',
    ".approval-comment>textarea:focus{outline:2px solid #b7cef0!important;outline-offset:1px!important;}",
    "// ② 3 KHUNG BẰNG NHAU: `align-items:stretch` (mặc định của grid) cho 3 khóm cùng cao",
    "//    bằng khóm cao nhất; `.card{height:100%}` để thẻ bên trong lấp đúng chiều cao đó.",
    ".approval-workbench,.baseline-approval-workbench{align-items:stretch!important;}",
    ".approval-workbench>.card,.baseline-approval-workbench>.card{height:100%!important;}",
    "",
  ].join("\n");
  const hits = css.split(END_MARK).length - 1;
  if (hits !== 1) {
    console.log("  🔴 dấu kết thúc xuất hiện " + hits + " lần — KHÔNG chèn CSS");
  } else {
    css = css.replace(END_MARK, BLOCK + END_MARK);
    writeFileSync(CSS_FILE, css, "utf8");
    console.log("  ✅ đã chèn CSS (① khung bình luận · ② 3 khung bằng nhau) · globals.css " + css.split("\n").length + " dòng");
  }
}

// ── ➕ phòng thủ chữ "null" ─────────────────────────────────────────────────
const TS_FILE = "app/page.tsx";
let ts = readFileSync(TS_FILE, "utf8");
const OLD_VAL = '<textarea value={approvalComment}';
const NEW_VAL = '<textarea value={approvalComment ?? ""}';
const n = ts.split(OLD_VAL).length - 1;
if (n === 0) {
  console.log("  (textarea đã có phòng thủ — bỏ qua)");
} else if (n === 1) {
  ts = ts.replace(OLD_VAL, NEW_VAL);
  writeFileSync(TS_FILE, ts, "utf8");
  console.log("  ✅ đã thêm phòng thủ `?? \"\"` cho ô BÌNH LUẬN (1 chỗ)");
} else {
  console.log("  🔴 khớp " + n + " chỗ `<textarea value={approvalComment}` — KHÔNG sửa");
}
