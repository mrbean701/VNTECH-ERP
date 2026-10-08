// HỢP ĐỒNG HỒI QUY — ERP-SESSION-03 (07/10/2026) · 2 việc hotfix FE giai đoạn GO-LIVE
//
// ① `BUG-20261007-C01` — modal «Sửa hồ sơ» (`HrProfileEditModal.tsx`):
//    Sửa CCCD ở tab «Thông tin cá nhân» từng báo **400** «Mã nhân viên, họ tên, tên đăng nhập và
//    phòng/bộ phận là bắt buộc» vì form CHỈ render phần của TAB ĐANG MỞ ⇒ lời gọi `update_user`
//    gửi payload `{ userId }` (thiếu `fullName`) ⇒ backend `UserManagementUseCase.java:115-125` ném 400.
//    Hợp đồng dưới đây KHOÁ 3 điều, nếu ai đó gỡ ra thì lỗi tái phát NGAY:
//      (a) chỉ gọi `update_user` khi TAB TÀI KHOẢN thật sự được gửi (`fd.has("fullName")`);
//      (b) khi gọi thì **luôn gửi đủ** 5 trường định danh, rỗng ⇒ lấy giá trị HIỆN CÓ;
//      (c) đồng bộ tài khoản thất bại ⇒ ⛔ KHÔNG đóng modal + báo trung thực «hồ sơ ĐÃ lưu».
//
// ② `TASK-20261007-C02` — màn Tổ đội (`TeamDirectory.tsx`): user yêu cầu «lược bỏ thông tin thừa - rác».
//    Guard quét **CHUỖI HIỂN THỊ** (không quét mã) của phần RENDER để chặn tái phát việc in tên
//    bảng/cột CSDL, khoá payload, tên action, đường dẫn tệp mã nguồn cho người dùng cuối.
//    ⚠️ Cố ý CHỈ soi phần SAU khối `TM-PURE-END`: khối thuần giữ các chuỗi nguồn dữ liệu là HỢP ĐỒNG
//    (6 test `tests/tm0*.test.mjs` trích và chạy thật) ⇒ ⛔ không được coi là rác.
//
// Chạy riêng:  node --test tests/mt3-c03-hotfix-ui.test.mjs
// ⚠️ ĐÍNH CHÍNH (07/10/2026, tự đo): tệp này **CÓ** được `npm run test:regression` chạy — số ca tăng
//    **803 → 811** (+8 đúng bằng số ca ở đây). Ghi chú đầu tiên («không nằm trong package.json») là **SAI**.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");

/** Gỡ chú thích — ⛔ BẮT BUỘC trước mọi khẳng định về phần render, nếu không chính chú thích GIẢI THÍCH
 *  việc gỡ (có nhắc tên bảng/cột) sẽ tự làm test đỏ oan. */
const stripComments = (code) => code
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ① HOTFIX CCCD — `app/screens/HrProfileEditModal.tsx`
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
const HR_RAW = read("app/screens/HrProfileEditModal.tsx");
const HR = stripComments(HR_RAW);

test("C01 — form CHỈ render 1 tab ⇒ hợp đồng phải có cổng `fd.has(\"fullName\")`", () => {
  // Tiền đề của ROOT CAUSE (phải còn đúng, nếu không thì kết luận đã cũ):
  assert.match(HR, /\{tab === "user" \? \(/, "Tiền đề: form render có điều kiện theo tab — nếu đổi cấu trúc thì PHẢI đọc lại root cause");
  assert.match(HR, /const accountTabSubmitted = fd\.has\("fullName"\);/,
    "Thiếu cổng: ⛔ phải chỉ gọi `update_user` khi TAB TÀI KHOẢN thật sự được gửi (có ô `fullName` trong FormData)");
  assert.match(HR, /if \(accountTabSubmitted && canEditAccount\) \{/,
    "Cổng `accountTabSubmitted` chưa được dùng để chặn lời gọi `update_user` ⇒ lỗi 400 sẽ tái phát khi sửa CCCD");
});

test("C01 — khi gọi `update_user` thì LUÔN gửi đủ 5 trường định danh (rỗng ⇒ giá trị hiện có)", () => {
  assert.match(HR, /const accountText = \(name: string, fallback: string\) => \{/,
    "Thiếu helper lấy giá trị có fallback ⇒ ô rỗng sẽ gửi chuỗi rỗng lên backend");
  for (const [field, fallback] of [
    ["employeeCode", /String\(row\.employeeCode \?\? ""\)/],
    ["username", /String\(row\.username \?\? ""\)/],
    ["fullName", /fullName\)/],
    ["email", /String\(row\.email \?\? ""\)/],
    ["organizationUnitId", /String\(row\.organizationUnitId \?\? ""\)/],
  ]) {
    assert.match(HR, new RegExp(`${field}: accountText\\("${field}", `),
      `Payload thiếu trường bắt buộc \`${field}\` ⇒ backend 400 «… là bắt buộc»`);
    assert.match(HR, new RegExp(`${field}: accountText\\("${field}", ${fallback.source}`),
      `Trường \`${field}\` chưa có FALLBACK theo hồ sơ hiện có`);
  }
});

test("C01 — ⛔ KHÔNG còn lời gọi `update_user` trần (bỏ qua kết quả) + thất bại thì KHÔNG đóng modal", () => {
  assert.doesNotMatch(HR, /^\s*await submit\("update_user"/m,
    "Lời gọi `update_user` trần đã quay lại ⇒ (a) bỏ qua kết quả, (b) vẫn đóng modal khi lỗi ⇒ user tưởng MẤT DỮ LIỆU");
  assert.match(HR, /const accountOk = await submit\("update_user", accountPayload\);/,
    "Phải GIỮ giá trị trả về của `update_user` để xử lý khi thất bại");
  assert.match(HR, /if \(!accountOk\) \{/, "Thiếu nhánh xử lý khi đồng bộ tài khoản thất bại");
  const failBlock = HR.slice(HR.indexOf("if (!accountOk) {"), HR.indexOf("if (!accountOk) {") + 700);
  assert.match(failBlock, /setError\(/, "Nhánh thất bại PHẢI báo cho người dùng biết (⛔ không im lặng)");
  assert.match(failBlock, /ĐÃ lưu/, "Thông báo PHẢI nói rõ hồ sơ ĐÃ lưu ⇒ tránh người dùng tưởng mất dữ liệu");
  assert.match(failBlock, /return;/, "Nhánh thất bại phải RETURN ⇒ ⛔ không chạy tiếp tới `close()`");
});

test("C01 — ⛔ không được gửi `role` (chống leo thang đặc quyền) qua đường hồ sơ", () => {
  assert.doesNotMatch(HR, /accountPayload\.role\s*=/, "⛔ Modal hồ sơ KHÔNG được gửi `role` — đổi vai trò là việc của Quản trị hệ thống");
  assert.doesNotMatch(HR, /accountPayload\["role"\]/, "⛔ Không được gán `role` động vào payload cập nhật tài khoản");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ② MÀN TỔ ĐỘI — chặn tái phát "rác kỹ thuật" trên giao diện
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
const TEAM_RAW = read("app/screens/TeamDirectory.tsx");
const END_PURE = /^\/\/ TM-PURE-END$/m;
const END_AT = TEAM_RAW.search(END_PURE);
const RENDER = stripComments(TEAM_RAW.slice(END_AT));

// Chuỗi HIỂN THỊ của phần render (chỉ chuỗi ≥ 4 ký tự, không xuống dòng) — quét RÁC trong đó.
const RENDER_STRINGS = [...RENDER.matchAll(/"([^"\\\n]{4,})"/g)].map((match) => match[1]);

const JARGON = [
  [/inventory\[\]/, "khoá payload `inventory[]`"],
  [/team_members/, "tên bảng `team_members`"],
  [/stock_issues/, "tên bảng `stock_issues`"],
  [/material_returns/, "tên bảng `material_returns`"],
  [/audit_logs/, "tên bảng `audit_logs`"],
  [/team_settlements|team_subcontracts/, "tên bảng quyết toán/hợp đồng giao khoán"],
  [/teams\.(code|name|trade|project_id|warehouse_id|active)/, "tên cột `teams.*`"],
  [/projects\[\]|warehouses\[\]|requests\[\]/, "khoá payload dạng `x[]`"],
  [/payload/, "từ nội bộ «payload»"],
  [/NOT NULL/, "ràng buộc CSDL `NOT NULL`"],
  [/BootstrapDataAdapter|system-route\.mjs|Java-only/, "tên tệp/lớp mã nguồn"],
  [/action\s+(issue_stock|return_stock|create_project_team)/, "tên action backend"],
  // ⚠️ CỐ Ý KHÔNG liệt kê `TM-0\d`: `data-team-sort-note="TM-02"` chỉ là GIÁ TRỊ ATTRIBUTE (không hiển thị)
  //    và là điểm neo cho test `tm02` ⇒ ⛔ không được coi là rác. Chỉ chặn mã mục tài liệu in ra CHỮ.
  [/MT3 §/, "mã mục kỹ thuật của tài liệu (MT3 §…)"],
  [/bootstrap/, "cơ chế nội bộ «bootstrap»"],
];

test("C02 — phần RENDER của màn Tổ đội ⛔ KHÔNG được chứa thông tin kỹ thuật (bảng/cột CSDL, payload, action)", () => {
  assert.ok(END_AT > 0, "Không tìm thấy mốc `// TM-PURE-END` — cấu trúc tệp đã đổi, phải đọc lại test");
  assert.ok(RENDER_STRINGS.length > 30, `Chỉ trích được ${RENDER_STRINGS.length} chuỗi render — nghi ngờ cách trích, ⛔ không kết luận vội`);
  const offenders = [];
  for (const value of RENDER_STRINGS) {
    for (const [pattern, label] of JARGON) {
      if (pattern.test(value)) offenders.push(`«${value}» ⇒ ${label}`);
    }
  }
  assert.deepEqual(offenders, [],
    "⛔ Người dùng cuối KHÔNG được thấy thông tin kỹ thuật. Đưa các chuỗi này vào `note`/empty-state TIẾNG VIỆT nghiệp vụ:\n" + offenders.join("\n"));
});

test("C02 — ⛔ KHÔNG xoá DỮ LIỆU hợp đồng: khối TM-PURE + 6 tab còn nguyên", () => {
  assert.equal((TEAM_RAW.match(/^\/\/ TM-PURE-BEGIN$/gm) || []).length, 1, "Mốc TM-PURE-BEGIN phải còn đúng 1 dòng riêng");
  assert.equal((TEAM_RAW.match(/^\/\/ TM-PURE-END$/gm) || []).length, 1, "Mốc TM-PURE-END phải còn đúng 1 dòng riêng");
  for (const symbol of ["TEAM_LIST_COLUMNS", "TEAM_TABS", "teamDetailTabs", "teamListSourceNotes", "teamHistoryRows", "tmCompare"]) {
    assert.match(TEAM_RAW, new RegExp(`(function|const) ${symbol}\\b`), `⛔ Đã xoá DỮ LIỆU hợp đồng \`${symbol}\` — chỉ được gỡ phần RENDER`);
  }
  assert.match(TEAM_RAW, /const TEAM_TABS = \["Thông tin", "Nhân sự", "Dự án", "Kho", "Lịch sử"\];/, "Danh sách tab phải giữ ĐÚNG 5 tab theo MT3 §G");
});

test("C02 — GIỮ quy tắc nghiệp vụ cho người dùng: ghi chú thứ tự ưu tiên (TM-02)", () => {
  assert.match(RENDER, /data-team-sort-note="TM-02"/, "Ghi chú quy tắc ưu tiên là THÔNG TIN NGHIỆP VỤ ⇒ phải GIỮ");
  assert.match(TEAM_RAW, /ĐANG HOẠT ĐỘNG<\/strong> → hoạt động gần nhất ↓ → ngừng/, "Chuỗi quy tắc phải khớp nguyên văn yêu cầu TM-02");
});

test("C02 — thông tin rác đã bị gỡ: card «Nguồn dữ liệu của 6 tab» và khối ghi nguồn danh sách", () => {
  assert.doesNotMatch(RENDER, /Nguồn dữ liệu của 6 tab/, "Card «Nguồn dữ liệu của 6 tab» (bảng Tab/Số dòng/Nguồn/Ghi chú) phải bị gỡ khỏi giao diện");
  assert.doesNotMatch(RENDER, /data-team-source-notes/, "Khối `<p data-team-source-notes>` phải bị gỡ khỏi giao diện");
});

test("C03-9 · ĐỐI CHỨNG ÂM: bộ dò `JARGON` PHẢI bắt được chuỗi KỸ THUẬT thật (⛔ nếu không ⇒ cổng VÔ DỤNG)", () => {
  // ⭐ Chống «ĐẠT RỖNG» (LUẬT 21): nếu danh sách `JARGON` bị rút rỗng/quá yếu thì cổng `C02` sẽ XANH vô nghĩa.
  // ⚠️ BÀI HỌC (đã mắc): mẫu thử PHẢI thuộc **ĐÚNG LỚP** mà cổng nhắm tới — `JARGON` **cố ý HẸP** (⭐ nhắm **các chuỗi ĐÃ RÒ THẬT** ở `TeamDirectory.tsx`),
  //    ⛔ KHÔNG phải «mọi từ kỹ thuật» ⇒ dùng mẫu sai lớp sẽ **báo oan một bộ dò ĐÚNG** (⭐ lần đầu tôi thử `save_hr_record`/`JSON`/`API` ⇒ chỉ 1/8 ⇒ ⛔ kết luận sai là «bộ dò yếu»).
  const candidates = ["inventory[]", "team_members", "stock_issues", "material_returns", "payload", "NOT NULL", "bootstrap", "MT3 §"];
  const caught = candidates.filter((c) => JARGON.some(([pattern]) => pattern.test(c)));
  assert.ok(caught.length >= 4,
    `⛔ ĐỐI CHỨNG ÂM THẤT BẠI: bộ dò \`JARGON\` chỉ bắt ${caught.length}/${candidates.length} mẫu RÒ THẬT (${JSON.stringify(caught)}) ⇒ bộ dò QUÁ YẾU ⇒ cổng C02 VÔ NGHĨA.`);
  // ⛔ Và ⛔ KHÔNG báo oan câu nghiệp vụ tiếng Việt bình thường:
  const clean = "Chưa có tổ đội nào — bấm «Thêm tổ đội» để tạo mới.";
  assert.equal(JARGON.some(([pattern]) => pattern.test(clean)), false, "⛔ báo OAN câu nghiệp vụ tiếng Việt");
});