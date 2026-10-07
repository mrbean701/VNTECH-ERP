// MỐC 121 · vòng 215 · NHÓM PR — mục 2.1 → 2.7 trên màn `app/screens/Requests.tsx`.
// Viết SAU khi sửa (§14: mọi thay đổi phải có test), và là KHOÁ HỒI QUY cho đúng những lỗi đã gặp:
//   ① D-093 — prop `permission` khai trong kiểu nhưng KHÔNG được truyền ở nơi gọi ⇒ `canCreate`/`canExport`
//      vĩnh viễn `false` ⇒ 3 nút biến mất im lặng. Test #7 khoá đúng lỗi đó.
//   ② D-094 — `material_requests.requested_by` lưu TÊN HIỂN THỊ, còn backend so với `user.id` (UUID)
//      ⇒ `delete_request`/`cancel_request` chỉ chạy được với admin. Test #8 khoá: UI KHÔNG được ship nút Xóa/Hủy.
//   ③ D-080 — không được bịa tên trường. Mọi trường dùng ở đây đã ĐO trên dữ liệu sống 02/10/2026:
//      `requestedBy` 84/84 (KHÔNG có `createdBy`), `approvalStage` {0,1,2,5}, `priority` {normal,high}.
//   ④ §15 — tài liệu/khoá cột không được mô tả sai: cột `neededAt` KHÔNG được gọi là «SLA».
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";

const root = new URL("../", import.meta.url);
const read = (p) => readFileSync(new URL(p, root), "utf8");

const REQ = read("app/screens/Requests.tsx").replaceAll("\r\n", "\n");
const PAGE = read("app/page.tsx").replaceAll("\r\n", "\n");
const LABELS = read("lib/labels.ts").replaceAll("\r\n", "\n");
const SHARED = read("lib/ui-shared.tsx").replaceAll("\r\n", "\n");
const REGISTRY = read("java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java").replaceAll("\r\n", "\n");
const count = (hay, needle) => hay.split(needle).length - 1;

// ── MỤC 2.1 · lược bỏ nhãn/label thừa ─────────────────────────────────────────────
test("2.1 — ListToolbar KHÔNG còn `note` kỹ thuật; dòng `functional-summary` đã bỏ", () => {
  const toolbar = REQ.slice(REQ.indexOf("<ListToolbar"), REQ.indexOf("/>\n", REQ.indexOf("<ListToolbar")) + 2);
  assert.ok(toolbar.length > 0, "phải còn khối ListToolbar để kiểm");
  assert.doesNotMatch(toolbar, /\bnote=/,
    "⛔ toolbar không được truyền `note` («Nhu cầu của dự án/BCH…») — nhãn thừa, mục 2.1 đã bỏ");
  assert.equal(count(REQ, "functional-summary"), 0,
    "⛔ dòng «Đang hiển thị toàn bộ N kết quả phù hợp bộ lọc» mang thông tin SONG ⇒ đã bỏ");
});

test("2.1 — 4 KPI mặc định KHÔNG còn `note`; `Kpi.note` đã thành TUỲ CHỌN và `<p>` chỉ render khi có nội dung", () => {
  const kpiLine = REQ.slice(REQ.indexOf('<div className="kpi-grid">'), REQ.indexOf("</div>", REQ.indexOf('<div className="kpi-grid">')));
  assert.equal(count(kpiLine, "note="), 0, "⛔ 4 KPI mặc định không được còn `note` thừa");
  assert.equal(count(kpiLine, "<Kpi "), 4, "phải còn nguyên 4 thẻ KPI");
  // Hộ tống: nếu `note` vẫn BẮT BUỘC thì TS2322 ⇒ màn này không biên dịch được.
  // ⛔ phải khoá ĐÚNG chữ ký của `Kpi`, không phải `note?: string` ở đâu đó trong file —
  // (`ui-shared.tsx` còn nhiều prop khác khai `note?: string` ⇒ regex rộng sẽ luôn xanh).
  const kpiSig = SHARED.slice(SHARED.indexOf("function Kpi("), SHARED.indexOf("function Kpi(") + 400);
  assert.ok(kpiSig.length > 40, "phải tìm thấy chữ ký `function Kpi(`");
  assert.match(kpiSig, /label: string; value: string; note\?: string; tone\?: string/,
    "`Kpi` phải khai `note` là TUỲ CHỌN (nếu BẮT BUỘC thì TS2322 ở màn này)");
  assert.match(SHARED, /\{note&&<p>\{note\}<\/p>\}/, "`Kpi` chỉ render `<p>` khi THỬC CÓ nội dung");
  // ⛔ đối chứng âm: mọi nơi khác truyền `note` vẫn phải render như cũ ⇒ không được xoá hẳn `<p>`.
  assert.doesNotMatch(SHARED, /<div className="kpi-content"><small>\{label\}<\/small><strong>\{value\}<\/strong>\s*<div>/,
    "⛔ `<p>` của KPI bị xoá hẳn ⇒ mọi màn khác mất chú thích");
});

test("2.1 — cột `neededAt` KHÔNG được gọi là «SLA» (nhãn cũ mô tả sai dữ liệu, §15)", () => {
  assert.match(REQ, /\{ key: "neededAt", header: "Ngày cần"/, "tiêu đề cột phải là «Ngày cần»");
  assert.doesNotMatch(REQ, /header: "SLA"/, "⛔ «SLA» mô tả sai: cột hiển thị `neededAt`, không phải số giờ quá hạn");
});

// ── MỤC 2.2 · nhóm nút CRUD đúng khuôn ListToolbar ────────────────────────────────
test("2.2 — «Xuất Excel» nằm ở `secondaryActions` (nhóm PHỤ, bên phải); nhóm `actions` giữ Tạo · Nhập · Xem/Sửa", () => {
  const actions = REQ.slice(REQ.indexOf("actions={<>"), REQ.indexOf("secondaryActions={<>"));
  const secondary = REQ.slice(REQ.indexOf("secondaryActions={<>"), REQ.indexOf("    />\n    {/* MT3 §IV.5"));
  assert.ok(actions.includes("＋ Lập phiếu đề nghị"), "nhóm CHÍNH phải giữ «Lập phiếu đề nghị»");
  assert.ok(actions.includes("⇧ Nhập Excel"), "nhóm CHÍNH phải giữ «Nhập Excel»");
  assert.ok(actions.includes("✎ Xem / Sửa phiếu"), "mục 2.2/2.5 yêu cầu có nút xem/sửa phiếu");
  assert.ok(secondary.includes("⇩ Xuất Excel"), "«Xuất Excel» phải chuyển sang `secondaryActions`");
  assert.ok(!actions.includes("⇩ Xuất Excel"), "⛔ «Xuất Excel» không được nằm lại trong `actions`");
});

test("2.2 — vẫn đúng 3 nút `<PermissionGuard allow={can…}>` (khoá `mt3-ui-28` không được đổi số)", () => {
  const guarded = (REQ.match(/<PermissionGuard allow=\{can(Create|Export)\}>/g) || []).length;
  assert.equal(guarded, 3, `phải đúng 3 nút được bảo vệ, đếm được ${guarded}`);
  // Nút PO dùng TÊN KHÁC (`canIssuePo`) để không làm sai regex của khoá cũ.
  assert.ok(REQ.includes("<PermissionGuard allow={canIssuePo}>"), "nút Phát hành PO cũng phải qua PermissionGuard");
});

// ── MỤC 2.3 · tìm kiếm + bộ lọc «Người tạo» ─────────────────────────────────────
test("2.3 — ô tìm kiếm nói rõ TÌM THEO CẢ MÃ PHIẾU LẪN TÊN NGƯỜI TẠO, và thực sự quét 2 trường đó", () => {
  assert.match(REQ, /placeholder: "Tìm theo mã phiếu hoặc tên người tạo/,
    "placeholder phải nêu cả hai trường (mục 2.3)");
  assert.match(REQ, /\$\{row\.requestNo\} \$\{row\.requestedBy\}/,
    "⛔ phải ghép `requestNo` + `requestedBy` vào chuỗi tìm kiếm");
});

test("2.3 — bộ lọc «Người tạo» lấy danh sách NGƯỜI THẬT từ dữ liệu, không hard-code danh sách tên", () => {
  assert.match(REQ, /const requesterOptions=Array\.from\(new Set\(requestRows\.map\(\(row\)=>String\(row\.requestedBy\|\|""\)\)/,
    "danh sách người tạo phải suy ra từ `requestRows`, không ghi cứng");
  assert.match(REQ, /\{ key: "requester", label: "Người tạo", value: requester, onChange: setRequester/,
    "bộ lọc phải tên là «Người tạo» và nối vào state `requester`");
  assert.match(REQ, /\(requester==="ALL"\|\|String\(row\.requestedBy\|\|""\)===requester\)/,
    "⛔ predicate phải thực sự lọc theo `requestedBy`");
  // ⛔ D-080: `material_requests` KHÔNG có `created_by` (đo 0/84) ⇒ không được bịa cột này.
  assert.doesNotMatch(REQ, /row\.createdBy|createdBy=/, "⛔ KHÔNG được dùng `createdBy` — cột đó không tồn tại (D-080)");
});

// ── MỤC 2.4 · sắp xếp + 2 bộ lọc mới ───────────────────────────────────────────
test("2.4 — SẮP XẾP THẬT: `totalEstimatedValue` so SỐ (không so chuỗi) và có khoá phụ theo số phiếu", () => {
  assert.match(REQ, /sortKey==="totalEstimatedValue"\) return \(Number\(b\.totalEstimatedValue\|\|0\)\)-\(Number\(a\.totalEstimatedValue\|\|0\)\)/,
    "⛔ phải ép `Number()` — so chuỗi sẽ xếp «1000000» trước «9» (sai thứ tự)");
  assert.match(REQ, /\|\| String\(a\.requestNo\|\|""\)\.localeCompare\(String\(b\.requestNo\|\|""\)\)/,
    "hai phiếu cùng giá trị phải có thứ tự ổn định theo số phiếu");
  assert.doesNotMatch(REQ, /sortKey==="totalEstimatedValue"\)\s*return x\.localeCompare\(y\)/,
    "⛔ cấm rơi về so sánh chuỗi cho giá trị tiền");
});

test("2.4 — 6 tuỳ chọn sắp xếp và 2 bộ lọc mới BẮT ĐƯỢC VÀO `filtered`", () => {
  for (const key of ["requestedAt", "neededAt", "requestNo", "totalEstimatedValue", "requestedBy", "status"]) {
    assert.ok(REQ.includes(`{ value: "${key}", label:`), `thiếu tuỳ chọn sắp xếp \`${key}\``);
  }
  assert.ok(REQ.includes('{ key: "stage", label: "Bước duyệt"'), "thiếu bộ lọc «Bước duyệt»");
  assert.ok(REQ.includes('{ key: "priority", label: "Ưu tiên"'), "thiếu bộ lọc «Ưu tiên»");
  const filtered = REQ.slice(REQ.indexOf("const filtered="), REQ.indexOf("}); const selected="));
  for (const cond of ['stage==="ALL"', 'priority==="ALL"', 'requester==="ALL"', 'status==="ALL"', '!fromDate', '!query']) {
    assert.ok(filtered.includes(cond), `⛔ predicate thiếu điều kiện \`${cond}\` — bộ lọc mới chỉ có nút mà không lọc`);
  }
  assert.ok(filtered.includes("sortKey"), "⛔ phải sắp xếp thật, không chỉ hiện nút");
});

test("2.4 — nhãn «Bước duyệt» dùng `approvalStage` (0 = chưa vào duyệt) và «Ưu tiên» dùng `priority`", () => {
  assert.match(REQ, /const stageOptions=Array\.from\(new Set\(requestRows\.map\(\(row\)=>String\(row\.approvalStage\?\?""\)\)\)\)/,
    "phải lấy `approvalStage` từ dữ liệu");
  assert.match(REQ, /const priorityOptions=Array\.from\(new Set\(requestRows\.map\(\(row\)=>String\(row\.priority\|\|""\)\)\)/,
    "phải lấy `priority` từ dữ liệu");
  assert.match(REQ, /n === "0" \? "Chưa vào duyệt" : `Bước \$\{n\}`/, "bước 0 phải hiện «Chưa vào duyệt», không phải «Bước 0»");
  assert.match(REQ, /n === "high" \? "Cao" : n === "normal" \? "Bình thường"/, "phải dịch `high`/`normal` sang tiếng Việt");
});

// ── MỤC 2.5 · vá D-093 (capability phải được TRUYỀN tới, không chỉ khai) ───────────
test("2.5 — D-093 ĐÃ VÁ: nơi gọi `<Requests>` phải truyền `permission={activePermission}`", () => {
  const call = PAGE.slice(PAGE.indexOf("<Requests "), PAGE.indexOf("/>", PAGE.indexOf("<Requests ")) + 2);
  assert.ok(call.includes("permission={activePermission}"),
    "⛔ prop `permission` khai mà không truyền ⇒ `canCreate`/`canExport` vĩnh viễn false ⇒ 3 nút biến mất im lặng (D-093)");
  assert.equal(count(PAGE, "<Requests "), 1, "⛔ chỉ được có MỘT nơi gọi `<Requests>` — nếu có nơi gọi khác thì phải truyền cả ở đó");
  assert.match(REQ, /const canCreate=Boolean\(permission\?\.canCreate\)/, "quyền phải đọc thẳng capability");
  assert.match(REQ, /const canExport=Boolean\(permission\?\.canExport\)/, "quyền phải đọc thẳng capability");
});

test("2.5 — nút biểu tượng ◉/✎ trong từng dòng có `title` giải thích (trước đây trần)", () => {
  assert.match(REQ, /title="Xem chi tiết phiếu"[^`]*?open\("detail", row\)/, "nút ◉ phải có tooltip «Xem chi tiết phiếu»");
  assert.match(REQ, /title="Sửa \/ gửi lại phiếu"/, "nút ✎ phải có tooltip");
});

// ── MỤC 2.6 · nút «Phát hành PO» + D-094 ────────────────────────────────────────
test("2.6 — `poPermission` khai, rút gọn VÀ truyền từ `page.tsx` bằng đúng module của `create_po`", () => {
  assert.match(REGISTRY, /Map\.entry\("create_po", List\.of\("purchasing"\)\)/,
    "⛔ hỏa tiền đề: backend gắn action `create_po` vào module `purchasing` — nếu đổi, test này phải đổi theo");
  assert.match(REQ, /permission\?: Row; poPermission\?: Row \}/, "phải khai `poPermission?: Row` trong kiểu");
  assert.match(REQ, /onPickShortage, permission, poPermission \}/, "⛔ phải có `poPermission` trong DANH SÁCH rút gọn, không chỉ khai kiểu");
  const call = PAGE.slice(PAGE.indexOf("<Requests "), PAGE.indexOf("/>", PAGE.indexOf("<Requests ")) + 2);
  assert.ok(call.includes('poPermission={modulePermission(data,"purchasing")}'),
    "⛔ nơi gọi phải truyền capability của MÔN `purchasing`, không phải `permission` của môn `requests`");
});

test("2.6 — điều kiện bật nút PO khớp ĐÚNG luật backend `create_po` (chỉ tạo PO từ phiếu ĐÃ DUYỆT)", () => {
  assert.match(REQ, /const canIssuePo=Boolean\(poPermission\?\.canCreate\)/, "quyền phát hành PO phải đọc `purchasing.canCreate`");
  assert.match(REQ, /const isPoReady=\(row:Row\)=>row\.status==="approved"&&row\.supplyStatus==="awaiting_po"/,
    "⛔ điều kiện phải là `approved` + `awaiting_po` — cùng hệt điều kiện `eligible` của `PoModal`");
  assert.match(REQ, /\{isPoReady\(row\)&&<button className="icon-mini" disabled=\{!canIssuePo\}/,
    "phải có nút PO trên TỪNG DÒNG, và tắt khi thiếu quyền (không chỉ ẩn)");
  assert.match(REQ, /\{isPoReady\(selected\)&&<PermissionGuard allow=\{canIssuePo\}>/,
    "phải có nút PO trong thẻ CHI TIẾT, có PermissionGuard");
  assert.match(REQ, /open\("po", row\)/, "nút trên dòng phải mở modal `po` với đúng phiếu");
  assert.match(REQ, /open\("po",selected\)/, "nút trong thẻ chi tiết phải mở modal `po` với phiếu đang chọn");
});

test("2.6 — ⛔ KHÔNG ship nút Xóa/Hủy phiếu (D-094: `requested_by` lưu TÊN, backend so với `user.id`)", () => {
  assert.doesNotMatch(REQ, /open\("(delete|cancel|resubmit)_/,
    "⛔ backend so `mr.requestedBy` với `user.id` (UUID) trong khi cột lưu TÊN ⇒ mọi nút xoá/hủy sẽ chỉ chạy được với admin");
  assert.doesNotMatch(REQ, /(Xoá|Xoá|Huỷ|Hủy)\s*(phiếu|phiêu)/i,
    "⛔ chưa có cách sửa `requested_by_id` ⇒ tuyệt đối không đặt nút xoá/hủy phiếu lên UI");
});

// ── MỤC 2.7 · dịch nhãn trạng thái ──────────────────────────────────────────────
test("2.7 — `statusLabel` dịch được `returned` · `issued` · `partial_issued` (trước đây lộ RAW)", () => {
  for (const [key, label] of [["returned", "Trả lại"], ["issued", "Đã xuất kho"], ["partial_issued", "Xuất một phần"]]) {
    assert.ok(LABELS.includes(`${key}: "${label}"`), `thiếu nhãn \`${key}: "${label}"\``);
  }
  assert.ok(LABELS.includes('returned_to_requester: "Trả lại"'), "«Trả lại CHT» phải đổi thành «Trả lại»");
  // ⛔ thứ tự ưu tiên phải giữ nguyên (supplyStatus > status > postingStatus) — không được đụng.
  assert.match(LABELS, /labels\[row\.supplyStatus\] \|\| labels\[row\.status\] \|\| labels\[row\.postingStatus\]/);
});

test("2.7 — không còn chuỗi «Trả lại CHT» ở bất kỳ đâu trong `app/` và `lib/`", () => {
  const files = listFiles("app").concat(listFiles("lib"));
  const offenders = files.filter((f) => read(f).includes("Trả lại CHT"));
  assert.deepEqual(offenders, [], "⛔ còn sót nhãn «Trả lại CHT»");
  assert.ok(REQ.includes('{ value: "returned_to_requester", label: "Trả lại" }'), "bộ lọc trạng thái cũng phải dùng «Trả lại»");
});

test("2.7 — mọi trạng thái mà BỘ LỌC của Requests dùng đều CÓ nhãn tiếng Việt", () => {
  // ⛔ chỉ quét khối `filters` — khối `sort` cũng có `{ value: "…", label: … }` nhưng KHÔNG phải trạng thái.
  // (`[a-z_]+` cố tình KHÔNG khớp `ALL` — nó là lựa chọn «Tất cả», không phải trạng thái.)
  const filters = REQ.slice(REQ.indexOf("filters={["), REQ.indexOf("      sort={{"));
  const values = [...filters.matchAll(/\{ value: "([a-z_]+)", label:/g)].map((m) => m[1]);
  assert.deepEqual(values, ["pending_approval", "returned_to_requester", "approved", "completed"],
    "bộ lọc trạng thái phải đúng 4 trạng thái tính được của phiếu đề nghị");
  for (const v of values) {
    assert.ok(LABELS.includes(`${v}: "`), `⛔ trạng thái \`${v}\` không có nhãn trong \`statusLabel\` ⇒ màn hàng sẽ lộ RAW STRING`);
  }
});

// ── HỒI QUY chung ──────────────────────────────────────────────────────────────
test("hồi quy — `Requests` KHÔNG được tự chế quyền từ role (UI không phải cổng bảo mật)", () => {
  assert.doesNotMatch(REQ, /canCreate\s*=\s*[^?]*\b(isAdmin|role)\b/i, "⛔ cấm tự suy quyền từ vai trò");
  assert.match(REQ, /KHÔNG thay thế backend/, "phải giữ ghi chú: UI không thay thế cổng RBAC thật ở backend");
});

test("hồi quy — KHÔNG còn dấu nháy đơn sót sau thẻ JSX (sẽ in thành ký tự vô nghĩa trên màn hình)", () => {
  // ⚠️ Sự cố đã xảy ra: khi khoang lấy lại 1 dòng từ kịch bản vá, cắt nhầm 1 ký tự ⇒ dòng JSX
  // kết thúc bằng `</button>'` ⇒ `tsc` VẪN XANH (dấu `'` chỉ là text node) nhưng màn hình hiện
  // thêm dấu nháy. Chỉ eslint (`react/no-unescaped-entities`) mới bắt được ⇒ khoá thêm ở đây.
  assert.doesNotMatch(REQ, /<\/[a-zA-Z]+>'\s*$/m, "⛔ có dấu `'` sót ngay sau thẻ JSX");
  assert.doesNotMatch(REQ, /\}'\s*$/m, "⛔ có dấu `'` sót ngay sau đóng ngoặc JSX");
});

function listFiles(dir) {
  const out = [];
  const walk = (d) => {
    for (const name of readdirSync(new URL(d, root), { withFileTypes: true })) {
      if (!name.isFile()) continue;
      if (name.name.endsWith(".ts") || name.name.endsWith(".tsx")) out.push(`${d}/${name.name}`);
    }
  };
  walk(dir);
  return out;
}