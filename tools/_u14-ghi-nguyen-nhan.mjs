// Ghi NGUYÊN NHÂN GỐC của U-14 vào cuối `docs/agent-progress/TASK-091.md` (tự chối nếu đã ghi rồi).
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
const FILE = "docs/agent-progress/TASK-091.md";
const MARKER = "## 6. `U-14` — NGUYÊN NHÂN GỐC ĐÃ KHOANH ĐƯỢC";
const text = readFileSync(FILE, "utf8");
if (text.includes(MARKER)) { console.error("✖ Đã có mục nguyên nhân ⇒ DỪNG (không ghi lặp)."); process.exit(1); }
const SECTION = `
${MARKER} (18/09, sau lượt \`--apply\` bị \`tsc\` bắt)

* Lượt \`--apply\` **đã ghi** một JSX **lệch cân** dù mọi **bất biến ĐẾM** đều qua; \`tsc\` bắt được \`TS17015\` và em **đã \`git checkout\` hoàn tác** (cây sạch, \`tsc\` về 0).
* **Đã thêm TỰ KIỂM BẰNG PARSER** vào công cụ ⇒ nay **không thể** ghi JSX sai (lượt chạy khô báo *"18 lỗi cú pháp ⇒ TỪ CHỐI GHI"*).
* **Chẩn đoán gốc** (\`tools/_u14-tim-offset.mjs\`): lỗi \`TS17015@505204\` — quy đổi ra thì offset nằm **SAU** dòng 2894 (dòng mới chỉ **7.337** ký tự) ⇒ **không phải lỗi bên trong dòng mới mà là "còn thiếu thẻ đóng"** ⇒ xác nhận **fragment hụt**.
* **NGUYÊN NHÂN:** \`splitChildren()\` chỉ theo dõi **độ sâu THẺ** (\`tagDepth\`), **chưa theo dõi độ sâu FRAGMENT**. Với thân có **fragment \`<>…</>\` ở mức ngoài cùng bọc nhiều khối**, bộ tách cắt tại mỗi \`<section\`/\`{…}\` mức ngoài cùng ⇒ **\`<>\` rơi vào tab này, \`</>\` rơi vào tab khác** ⇒ JSX lệch cân.
* **CÁCH SỬA (đã xác định chính xác — việc kế tiếp):** thêm biến \`fragDepth\` trong \`splitChildren\`:
  1. khi gặp \`<\` mà không phải thẻ có tên: nếu là \`<>\` ⇒ \`fragDepth++\`; nếu là \`</>\` ⇒ \`fragDepth = Math.max(0, fragDepth - 1)\`;
  2. đổi điều kiện mốc biểu thức thành \`if (tagDepth === 0 && fragDepth === 0 && text[i] === "{")\`;
  3. đổi điều kiện cắt \`section\` thành \`if (!close && tagDepth === 0 && fragDepth === 0 && /^<\\s*section\\b/i.test(tagText) && buf)\`.
  Sau đó chạy khô: **kỳ vọng tự kiểm PARSE báo HỢP LỆ (0 lỗi)** ⇒ mới \`--apply\`.
* **Kỷ luật đã giữ:** mọi bước **chạy khô trước**, công cụ **tự chối ghi** khi có lỗi, và lượt hỏng duy nhất đã được **hoàn tác tức thì** bằng \`git checkout\` (không có mã sai nào nằm lại trong cây).
`;
appendFileSync(FILE, SECTION);
console.log("ĐÃ GHI mục nguyên nhân vào " + FILE);
