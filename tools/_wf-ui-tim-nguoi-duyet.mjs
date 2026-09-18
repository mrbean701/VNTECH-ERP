// [WF] Đặc tả người dùng (18/09): màn cấu hình workflow — CHỌN NGƯỜI DUYỆT BẰNG TÌM KIẾM.
// Thay khối "bày toàn bộ danh sách ứng viên" trong `WorkflowModal` bằng:
//   (1) ô TÌM KIẾM (lọc theo tên / mã NV / username / phòng ban, tối đa 8 gợi ý),
//   (2) danh sách NGƯỜI ĐÃ CHỈ ĐỊNH hiển thị Ở DƯỚI (kèm nút bỏ),
//   (3) cảnh báo vàng khi bước chưa có ai (đúng chế độ CHỈ CẢNH BÁO — không chặn lưu).
// Tự TỪ CHỐI GHI nếu mỏ neo không khớp đúng 1 lần.
import { readFileSync, writeFileSync } from "node:fs";
const FILE = "app/page.tsx";
const APPLY = process.argv.includes("--apply");
let text = readFileSync(FILE, "utf8");
const failures = [];
const patch = (label, find, repl) => {
  const n = text.split(find).length - 1;
  if (n !== 1) { failures.push(`[${label}] khớp ${n} lần (cần 1) ⇒ DỪNG`); return; }
  text = text.replace(find, repl);
};

// 1) State ô tìm kiếm (theo TỪNG bước).
patch("thêm state approverQuery",
  '  const [onlyPermitted, setOnlyPermitted] = useState(false);',
  '  const [onlyPermitted, setOnlyPermitted] = useState(false);\n  // [WF] Đặc tả 18/09: chọn người duyệt bằng TÌM KIẾM (không bày hết danh sách ⇒ modal gọn).\n  const [approverQuery, setApproverQuery] = useState<Record<string, string>>({});');

// 2) Hàm gợi ý (đặt ngay sau `moduleOptions` — mỏ neo DUY NHẤT trong WorkflowModal; mỏ neo cũ
//    `async function save(...)` khớp 2 lần trong tệp nên công cụ đã TỰ CHỐI ở lượt chạy khô đầu).
patch("thêm suggestionsFor",
  '  const moduleOptions = configuredModules(data).filter((m) => m.key !== "admin");',
  `  const moduleOptions = configuredModules(data).filter((m) => m.key !== "admin");
  // [WF] Đặc tả 18/09: gợi ý người duyệt theo TỪ KHOÁ (bỏ dấu như các màn khác) — tối đa 8 dòng cho modal gọn.
  const normApproverText = (value: unknown) => String(value || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
  const suggestionsFor = (stepKey: string): Row[] => {
    const query = normApproverText(approverQuery[stepKey] ?? "").trim();
    if (!query) return [];
    return shown.filter((u) => [u.fullName, u.employeeCode, u.username, u.organizationName, u.department].some((value) => normApproverText(value).includes(query))).slice(0, 8);
  };`);

// 3) LẤY MỎ NEO BẰNG MÁY (bài học: mỏ neo dài chép tay đã khớp 0 lần) rồi mới thay khối.
const startMark = '{shown.map((u) =>';
const endMark = 'Không có ứng viên nào.</div>}';
const sIdx = text.indexOf(startMark);
const eIdx = text.indexOf(endMark);
if (sIdx < 0 || eIdx < 0) { failures.push("[thay khối] không thấy mốc đầu/cuối ⇒ DỪNG"); }
else {
  const openIdx = text.lastIndexOf('<div className="admin-mini-list">', sIdx);   // mở khối bao ngoài
  const closeIdx = text.indexOf("</div>", eIdx + endMark.length);                 // đóng khối bao ngoài
  if (openIdx < 0 || closeIdx < 0) failures.push("[thay khối] không xác định được khối bao ngoài ⇒ DỪNG");
  else {
    const OLD = text.slice(openIdx, closeIdx + "</div>".length);
    const NEW = `            <label><span>Tìm người duyệt (gõ tên / mã nhân viên / phòng ban)</span>
              <input value={approverQuery[String(s.key)] ?? ""} onChange={(e) => setApproverQuery((q) => ({ ...q, [String(s.key)]: e.target.value }))} placeholder="Ví dụ: Nguyễn, NV001, Kế hoạch…" />
            </label>
            {(approverQuery[String(s.key)] ?? "").trim().length > 0 && <div className="admin-mini-list">
              {suggestionsFor(String(s.key)).map((u) => <button type="button" key={u.id} className={selected.includes(String(u.id)) ? "is-selected" : ""} onClick={() => toggleApprover(index, String(u.id))}>
                <i className="mini-avatar">{initials(String(u.fullName || "NV"))}</i>
                <span><strong>{u.fullName}</strong><small>{u.employeeCode || u.username} · {u.organizationName || u.department || "—"}</small></span>
                <b>{selected.includes(String(u.id)) ? "✓ Đã chọn" : u.hasApprovePermission ? "Có quyền duyệt" : "Chưa có quyền duyệt"}</b>
              </button>)}
              {!suggestionsFor(String(s.key)).length && <div className="menu-drop-empty">Không tìm thấy người phù hợp.</div>}
            </div>}
            <div className="admin-mini-list">
              {selected.map((userId) => {
                const person = candidates.find((c) => String(c.id) === String(userId));
                return <button type="button" key={userId} className="is-selected" onClick={() => toggleApprover(index, String(userId))} title="Bấm để bỏ khỏi bước này">
                  <i className="mini-avatar">{initials(String(person?.fullName || "NV"))}</i>
                  <span><strong>{person?.fullName || userId}</strong><small>{person ? \`\${person.employeeCode || person.username} · \${person.organizationName || person.department || "—"}\` : "Không còn trong danh sách ứng viên"}</small></span>
                  <b>✕ Bỏ</b>
                </button>;
              })}
              {!selected.length && <div className="menu-drop-empty">Chưa chỉ định người duyệt cho bước này.</div>}
            </div>
            {!selected.length && <div className="inline-alert">Bước {index + 1} chưa có người duyệt — theo chế độ CHỈ CẢNH BÁO, quy trình VẪN lưu được.</div>}`;
    text = text.slice(0, openIdx) + NEW + text.slice(closeIdx + "</div>".length);
    console.log(`  đã lấy mỏ neo BẰNG MÁY: khối cũ dài ${OLD.length} ký tự (${openIdx}..${closeIdx})`);
  }
}

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: mỏ neo khớp đủ ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
writeFileSync(FILE, text);
console.log("ĐÃ GHI: " + FILE);
