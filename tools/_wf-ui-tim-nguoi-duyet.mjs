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

// 2) Hàm gợi ý (đặt ngay sau `toggleApprover`) — lọc theo tên/mã NV/username/phòng ban, tối đa 8.
patch("thêm suggestionsFor",
  '  async function save(event: FormEvent<HTMLFormElement>) {',
  `  // [WF] Gợi ý người duyệt theo TỪ KHOÁ (bỏ dấu như các màn khác) — tối đa 8 dòng cho modal gọn.
  const normApproverText = (value: unknown) => String(value || "").toLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "");
  const suggestionsFor = (stepKey: string): Row[] => {
    const query = normApproverText(approverQuery[stepKey] ?? "").trim();
    if (!query) return [];
    return shown.filter((u) => [u.fullName, u.employeeCode, u.username, u.organizationName, u.department].some((value) => normApproverText(value).includes(query))).slice(0, 8);
  };
  async function save(event: FormEvent<HTMLFormElement>) {`);

// 3) Thay khối "bày toàn bộ danh sách ứng viên" bằng: ô tìm kiếm + gợi ý + DANH SÁCH ĐÃ CHỈ ĐỊNH Ở DƯỚI.
const OLD = `            <div className="admin-mini-list">
              {shown.map((u) => <button type="button" key={u.id} className={selected.includes(String(u.id)) ? "is-selected" : ""} onClick={() => toggleApprover(index, String(u.id))} style={selected.includes(String(u.id)) ? { outline: "2px solid #1769e0" } : undefined}>
                <i className="mini-avatar">{initials(String(u.fullName || "NV"))}</i>
                <span><strong>{u.fullName}</strong><small>{u.employeeCode || u.username} · {u.organizationName || u.department || "—"}</small></span>
                <b>{selected.includes(String(u.id)) ? "✓ Đã chọn" : u.hasApprovePermission ? "Có quyền duyệt" : "Chưa có quyền duyệt"}</b>
              </button>)}
              {!shown.length && <div className="menu-drop-empty">Không có ứng viên nào.</div>}
            </div>`;
const NEW = `            <label><span>Tìm người duyệt (gõ tên / mã nhân viên / phòng ban)</span>
              <input value={approverQuery[String(s.key)] ?? ""} onChange={(e) => setApproverQuery((q) => ({ ...q, [String(s.key)]: e.target.value }))} placeholder="Ví dụ: Nguyễn, NV001, Kế hoạch…" />
            </label>
            {(approverQuery[String(s.key)] ?? "").trim().length > 0 && <div className="admin-mini-list">
              {suggestionsFor(String(s.key)).map((u) => <button type="button" key={u.id} className={selected.includes(String(u.id)) ? "is-selected" : ""} onClick={() => toggleApprover(index, String(u.id))}>
                <i className="mini-avatar">{initials(String(u.fullName || "NV"))}</i>
                <span><strong>{u.fullName}</strong><small>{u.employeeCode || u.username} · {u.organizationName || u.department || "—"}</small></span>
                <b>{selected.includes(String(u.id)) ? "✓ Đã chọn" : u.hasApprovePermission ? "Có quyền duyệt" : "Chưa có quyền duyệt"}</b>
              </button>)}
              {!suggestionsFor(String(s.key)).length && <div className="menu-drop-empty">Không tìm thấy người phù hợp với “{approverQuery[String(s.key)]}”.</div>}
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
            {!selected.length && <div className="inline-alert">Bước {index + 1} chưa có người duyệt — theo chế độ CHỈ CẢNH BÁO, quy trình VẪN lưu được (hệ thống chỉ cảnh báo).</div>}`;
patch("thay khối chọn người duyệt", OLD, NEW);

if (failures.length) { console.error("KHÔNG GHI — có điều kiện không đạt:"); for (const f of failures) console.error("  ✖ " + f); process.exit(1); }
if (!APPLY) { console.log("CHẠY KHÔ: mỏ neo khớp đủ ⇒ sẵn sàng ghi (thêm --apply)."); process.exit(0); }
writeFileSync(FILE, text);
console.log("ĐÃ GHI: " + FILE);
