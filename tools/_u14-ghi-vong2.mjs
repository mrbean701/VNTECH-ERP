// Ghi TIẾP kết quả vòng sửa fragDepth (giả thuyết SAI) + NGHI PHẠM MỚI vào TASK-091.md.
import { readFileSync, appendFileSync } from "node:fs";
const FILE = "docs/agent-progress/TASK-091.md";
const MARKER = "### 6.1. Vòng sửa `fragDepth` — GIẢ THUYẾT SAI + NGHI PHẠM MỚI";
const text = readFileSync(FILE, "utf8");
if (text.includes(MARKER)) { console.error("✖ Đã có mục này ⇒ DỪNG."); process.exit(1); }
appendFileSync(FILE, `
${MARKER} (18/09)

* **ĐÃ THỬ:** thêm \`fragDepth\` (độ sâu fragment) vào \`splitChildren\` — 4 mỏ neo khớp đủ, công cụ sửa thành công
  (\`tools/_u14-them-fragdepth.mjs\`, có \`--apply\` + tự chối).
* **KẾT QUẢ: KHÔNG GIẢI QUYẾT.** Chạy khô vẫn báo **đúng 18 lỗi cú pháp**, **cùng offset \`TS17015@505204\`**
  ⇒ **giả thuyết "fragment bị cắt đôi" là SAI** (ghi lại trung thực, không giấu).
* **NGHI PHẠM MỚI (rõ hơn, có căn cứ từ bản đồ khối):** bản đồ khối cho thấy có **mảnh vụn \`</div>\`** (6 ký tự) nằm giữa các khối.
  Bộ tách coi đó là *"con vụn"* (\`isFragmentary\`) và **GỘP vào con trước**, NHƯNG **thẻ MỞ của nó (\`<div className="drawer-body">\`)
  đã bị BỎ** khi dựng modal ⇒ **thẻ ĐÓNG THỪA** ⇒ JSX lệch cân ⇒ lỗi *"Expected corresponding closing tag"*.
* **CÁCH SỬA ĐỀ XUẤT (việc kế tiếp):** khi dựng các con, **LOẠI BỎ** (không gộp) các mảnh chỉ gồm **thẻ đóng của khung đã bỏ**
  (\`</div>\` …), và đổi bất biến "không mất nội dung" thành \`nối các con === bodyInner ĐÃ LÀM SẠCH\` (ghi rõ phần đã loại bỏ),
  thay vì so với \`bodyInner\` nguyên bản. Sau đó chạy khô: **kỳ vọng tự kiểm PARSE báo HỢP LỆ** ⇒ mới \`--apply\` → \`tsc\`.
* **Bằng chứng công cụ an toàn:** suốt 2 vòng sửa, công cụ **luôn tự chối ghi** khi tự kiểm PARSE phát hiện lỗi ⇒
  \`app/page.tsx\` **vẫn nguyên vẹn** (chỉ có 1 lượt ghi hỏng ở vòng đầu, đã \`git checkout\` hoàn tác).
`);
console.log("ĐÃ GHI mục 6.1 vào " + FILE);
