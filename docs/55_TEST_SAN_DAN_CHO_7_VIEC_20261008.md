# TEST SẴN DÁN cho 7 việc (L3 · L4 · L5 · L6) — ⛔ chưa tạo tệp (chờ shell/uy quyền)

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · Nối tiếp `docs/50` (test-impact) · `docs/54` (runbook)
Lý do có tài liệu này: ⭐ **quy ước repo = mỗi thay đổi phải đi kèm test**; nhưng `tests/**` thuộc **vùng vân tay** ⇒ thêm tệp ⇒ buộc `gd-cycle` ⇒ ⛔ **không được tạo khi shell còn hỏng**. Vì vậy mã test để **sẵn dán**.

---

## 0. KHUÔN KẾ THỪA (đọc từ `tests/t08-work-dashboard.test.mjs:1-26` — ⛔ không tự nghĩ ra)
```js
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
```
⭐ **Quy ước quan trọng đã ghi trong `t08:11`**: *«tệp này CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên số ca»* + *«Chạy riêng: `node --test tests/t08-work-dashboard.test.mjs`»* ⇒ ⭐ **tệp mới dưới đây cũng ⛔ không thêm vào `package.json`** (giữ mốc hồi quy `865·864·0·1`).

---

## 1. ⛔⚠️ TRẠNG THÁI CỦA BỘ TEST NÀY — **ĐỎ trước khi vá, XANH sau khi vá** (đúng ý đồ)
Đây là **test khoá hành vi MỚI** (kiểu TDD): nó ⛔ **sẽ đỏ nếu chạy trước khi áp L3/L4/L5/L6** — ⛔ **đó là ý đồ**, ⛔ không phải lỗi.
⇒ **Chỉ dán + chạy SAU khi đã áp** các lượt tương ứng trong `docs/54`; hoặc dán trước rồi **chấp nhận đỏ** để làm mốc TDD (⚠️ khi đó ⛔ **đừng** kết luận «hồi quy hỏng»).

## 2. ⚠️ KIỂM TRƯỚC KHI DÁN
```text
[ ] chưa có tệp `tests/t11-*.test.mjs`  (đã rà 08/10: các số đang dùng tới `t10-approval-center`) ⇒ nếu trùng thì đổi số
[ ] đã áp L3 (nhập % + SUBMITTED) và L4 (dải 7 tab) ⇒ 2 nhóm test đầu mới xanh
[ ] L5/L6 tuỳ chọn (nếu ⛔ chưa áp thì 2 nhóm cuối sẽ đỏ — bình thường)
```

---

## 3. 📄 `tests/t11-work-progress-approval.test.mjs` — **mã HOÀN CHỈNH, dán là chạy**
```js
// PHASE GO-LIVE (08/10/2026) — HỢP ĐỒNG «TIẾN ĐỘ & XÁC NHẬN CÔNG VIỆC» theo yêu cầu user 7 việc.
//
// Vì sao có tệp này:
//   (1) `BUG-20261008-D05` (SEVERITY HIGH): nút «Xong» cũ gửi `status: "COMPLETED"` cho MỌI user, trong khi
//       backend CHẶN người thực hiện (`OpsTaskManagementUseCase:369-370`: «Người thực hiện chỉ Gửi kiểm tra;
//       Trưởng phòng/người có thẩm quyền mới xác nhận Hoàn thành.») ⇒ nút HỨA việc hệ thống ⛔ không cho.
//   (2) User yêu cầu: bỏ nút «Thao tác» preset ⇒ cho NHẬP % hoàn thành; người thực hiện «Gửi kiểm tra»,
//       trưởng phòng «Duyệt xong» / «Yêu cầu làm lại».
//   (3) Chốt 2 QUY ƯỚC của repo đã đo được (docs/53 §5): modal dùng `.modal-head` + nút đóng `aria-label="Đóng"`;
//       nút trông như liên kết dùng class `.link-cell` (⛔ KHÔNG tự bịa class mới).
//
// ⛔ Tệp này CỐ Ý KHÔNG nằm trong `package.json` → `test:regression` giữ nguyên số ca.
// Chạy riêng:  node --test tests/t11-work-progress-approval.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const workCenter = read("app/screens/WorkCenter.tsx");

/** Trích 1 khối hàm ở cấp module (từ `function X` tới `function` kế tiếp) — ⛔ không đọc cả tệp cho khẳng định hẹp. */
function block(name) {
  const start = workCenter.indexOf(`function ${name}`);
  assert.ok(start > 0, `⛔ không tìm thấy \`function ${name}\` trong WorkCenter.tsx`);
  const rest = workCenter.slice(start + 10);
  const next = rest.indexOf("\nfunction ");
  return next < 0 ? workCenter.slice(start) : workCenter.slice(start, start + 10 + next);
}

// ── 0. ĐỐI CHỨNG ÂM (BẮT BUỘC): mọi mẫu dưới đây phải THẬT SỰ khớp/không khớp trên mẫu dựng sẵn ─────────
test("ĐỐI CHỨNG ÂM — các mẫu kiểm phải có hiệu lực (⛔ không được là mẫu rỗng/vô nghĩa)", () => {
  const positive = `async function send(){ await action("update_work_item_status", { workItemId: r.id, status: "SUBMITTED" }); }
function ProgressCell({ canApprove }) { return canApprove ? null : null; }
<div className="modal-head"><strong>X</strong><button aria-label="Đóng">✕</button></div>`;
  assert.match(positive, /status: "SUBMITTED"/, "mẫu SUBMITTED phải khớp mẫu dựng sẵn");
  assert.match(positive, /canApprove/, "mẫu canApprove phải khớp mẫu dựng sẵn");
  assert.match(positive, /aria-label="Đóng"/, "mẫu nút đóng phải khớp mẫu dựng sẵn");
  // và phải BẮT ĐƯỢC cái SAI: mẫu «xấu» (preset % + Completed vô điều kiện) phải khớp mẫu «xấu»
  const bad = `{[25, 50, 75, 100].map((p) => <button>{p}%</button>)}`;
  assert.match(bad, /\[25, 50, 75, 100\]\.map/, "mẫu preset % phải bắt được dạng CŨ (nếu ⛔ không, khẳng định dưới là vô nghĩa)");
});

// ── 1. `BUG-20261008-D05` — ⛔ CẤM quay lại trạng thái «nút Xong gửi COMPLETED cho mọi user» ────────────
test("D05 — ⛔ KHÔNG còn 4 nút preset 25/50/75/100% (đã thay bằng ô NHẬP %)", () => {
  assert.doesNotMatch(workCenter, /\[25, 50, 75, 100\]\.map/,
    "còn nút preset % ⇒ chưa làm việc 3 (cho user nhập % hoàn thành)");
});

test("D05 — `ProgressCell` phải tồn tại, ở CẤP MODULE (bài học U-13: ⛔ không khai trong thân render)", () => {
  const cell = block("ProgressCell");
  assert.match(cell, /update_work_item_progress/, "ProgressCell phải gọi action thật `update_work_item_progress`");
  assert.match(cell, /type="number"/, "ProgressCell phải cho NHẬP số (không dùng 4 nút preset)");
});

test("D05 — người THỰC HIỆN gửi `SUBMITTED`; `COMPLETED` chỉ nằm trong nhánh TRƯỞNG PHÒNG", () => {
  const cell = block("ProgressCell");
  assert.match(cell, /status: "SUBMITTED"/,
    "thiếu `SUBMITTED` ⇒ người thực hiện ⛔ không báo được hoàn thành (đúng lỗi D05)");
  // `COMPLETED` CHỈ được xuất hiện SAU khi đã rẽ nhánh theo `canApprove`
  const iApprove = cell.indexOf("canApprove");
  const iCompleted = cell.indexOf('status: "COMPLETED"');
  assert.ok(iApprove > -1, "ProgressCell phải có cờ `canApprove` (phân biệt trưởng phòng)");
  assert.ok(iCompleted > iApprove,
    "`COMPLETED` phải nằm SAU nhánh `canApprove` ⇒ ⛔ không được gửi COMPLETED cho người thực hiện");
});

test("D05 — `WorkCenter` phải truyền `canApproveRow` và suy từ luật TRƯỞNG PHÒNG (⛔ không hardcode admin)", () => {
  assert.match(workCenter, /canApproveRow/, "thiếu `canApproveRow` ⇒ TaskTable ⛔ không biết ai được duyệt");
  assert.match(workCenter, /managerDepartments/, "`canApproveRow` phải dựa trên `managerDepartments` (đúng luật `userIsDepartmentManager`)");
});

// ── 2. VIỆC 2 · 3 — search xuống + tab Dashboard hiện việc của tôi ────────────────────────────────────────
test("Việc 2 — tên «Danh sách công việc» phải xuất hiện (đổi tên khỏi «Danh sách việc của tôi»)", () => {
  assert.match(workCenter, /"Danh sách công việc"/, "chưa đổi tên danh sách công việc");
  assert.doesNotMatch(workCenter, /Danh sách việc của tôi/, "vẫn còn tiêu đề CŨ");
});

test("Việc 3 — tab Dashboard phải render `TaskTable` cho `mine` (việc CỦA CHÍNH user)", () => {
  const dashboardTab = workCenter.slice(workCenter.indexOf('data-vntech="work-dashboard-tab"') > -1
    ? workCenter.indexOf('data-vntech="work-dashboard-tab"')
    : workCenter.indexOf("Dashboard công việc"));
  assert.ok(dashboardTab > -1, "không tìm thấy khối tab «Dashboard»");
  assert.match(dashboardTab, /TaskTable/, "tab Dashboard chưa hiện danh sách việc của user");
});

// ── 3. VIỆC 6 — tab «Được giao» ─────────────────────────────────────────────────────────────────────────
test("Việc 6 — có tab «Được giao» dùng LẠI `personalGroups[1].rows` (⛔ không viết lại logic)", () => {
  assert.match(workCenter, /data-vntech="work-assigned-tab"/, "thiếu tab «Được giao»");
  assert.match(workCenter, /personalGroups\[1\]\.rows/, "tab «Được giao» phải DÙNG LẠI nhóm `assigned` đã có (khối T05)");
});

// ── 4. VIỆC 5 — modal chi tiết + nút Nhận xét có CỔNG (⛔ không ship nút chết) ───────────────────────────
test("Việc 5 — modal chi tiết theo QUY ƯỚC repo: `.modal-head` + nút đóng `aria-label=\"Đóng\"`", () => {
  assert.match(workCenter, /className="modal-head"/, "modal chi tiết chưa dùng `.modal-head` (đã sửa ở docs/53 §3.2)");
  assert.match(workCenter, /aria-label="Đóng"/, "modal thiếu nút đóng có nhãn a11y");
  assert.doesNotMatch(workCenter, /className="link-like"/, "còn class CSS BỊA `link-like` ⇒ phải là `.link-cell`");
});

test("Việc 5 — ô Nhận xét phải bị CỔNG bởi `COMMENTS_READY` (BE `add_work_item_comment` CHƯA CÀI ⇒ 400)", () => {
  assert.match(workCenter, /const COMMENTS_READY = false/,
    "thiếu cổng `COMMENTS_READY=false` ⇒ nút «Nhận xét» sẽ gọi action chưa cài ⇒ 400 (nút chết)");
});
```

---

## 4. 📄 `tests/t12-work-tabs-and-modal-convention.test.mjs` — **mã HOÀN CHỈNH** (khoá cấu trúc MỚI + quy ước)
```js
// PHASE GO-LIVE (08/10/2026) — KHOÁ CẤU TRÚC DẢI TAB MỚI + QUY ƯỚC MODAL/NÚT-LIÊN-KẾT CỦA REPO.
// ⚠️ Tệp này THAY THẾ vai trò của 4 khẳng định cũ (t01:98 · t07:157 · t08:144 · t09:163) khi dải tab đổi 6→7.
// ⛔ KHÔNG thêm vào `package.json` (giữ mốc `test:regression`).
// Chạy riêng:  node --test tests/t12-work-tabs-and-modal-convention.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const workCenter = read("app/screens/WorkCenter.tsx");

// ⚠️⚠️ CHỈNH DÒNG `NEW_TABS` CHO KHỚP **THỨ TỰ TAB MÀ USER CHỐT** — chuỗi dưới đây là **ĐỀ XUẤT** của
//    `docs/49` §2.1 (⏳ chưa được user xác nhận). Nếu user chốt thứ tự khác ⇒ sửa ĐÚNG dòng này, ⛔ đừng tắt khẳng định.
const NEW_TABS = 'const WORK_TABS = ["Dashboard", "Danh sách công việc", "Được giao", "Phòng ban/ Tổ đội", "Giao việc", "Dự án", "Báo cáo"];';

test("L4 — dải tab MỚI xuất hiện ĐÚNG 1 LẦN (Dashboard đầu)", () => {
  assert.equal(workCenter.split(NEW_TABS).length - 1, 1,
    "⛔ chưa có dải 7 tab đúng như chốt (hoặc bị khai trùng)");
  assert.doesNotMatch(workCenter, /const WORK_TABS = \["Cá nhân"/, "vẫn còn dải tab CŨ");
});

test("L4 — `WORK_TAB_OF_VIEW` giữ alias `kpi` (tương thích ngược) và trỏ Dashboard = 0", () => {
  const map = workCenter.match(/const WORK_TAB_OF_VIEW[^;]+;/);
  assert.ok(map, "thiếu `WORK_TAB_OF_VIEW`");
  assert.match(map[0], /dashboard: 0/, "`dashboard` phải trỏ tab 0");
  assert.match(map[0], /kpi: 0/, "`kpi` phải GIỮ và trỏ cùng tab Dashboard (tương thích ngược)");
});

test("L4 — ⛔ KHÔNG còn nhánh `tab === …` lớn hơn số tab (chống sót khi đổi chỉ số)", () => {
  const used = [...workCenter.matchAll(/\{tab === (\d+)/g)].map((m) => Number(m[1]));
  assert.ok(used.length >= 6, `chỉ thấy ${used.length} nhánh \`tab ===\` ⇒ thiếu nhánh render`);
  assert.ok(Math.max(...used) <= 6, `có nhánh \`tab === ${Math.max(...used)}\` vượt quá 7 tab ⇒ chưa cập nhật chỉ số`);
});

test("BẪY `workCenterViewFor` — `view === \"dashboard\"` phải kiểm TRƯỚC nhánh `dept_plan_tasks`", () => {
  const page = read("app/page.tsx");
  const fn = page.slice(page.indexOf("function workCenterViewFor"), page.indexOf("function workCenterViewFor") + 900);
  const iDash = fn.indexOf('if (view === "dashboard") return "dashboard";');
  const iTasks = fn.indexOf('if (active === "dept_plan_tasks"');
  assert.ok(iDash > 0 && iTasks > 0, "không đọc được 2 nhánh của `workCenterViewFor`");
  assert.ok(iDash < iTasks,
    "⛔ nhánh `dept_plan_tasks` đang CHẶN TRƯỚC ⇒ bấm «Công việc» sẽ mở tab CÁ NHÂN thay vì Dashboard");
});

test("Quy ước repo — nút trông như LIÊN KẾT phải dùng `.link-cell` (⛔ không tự bịa class)", () => {
  assert.doesNotMatch(workCenter, /link-like/, "còn class bịa `link-like`");
});
```

---

## 5. ⚙️ SAU KHI DÁN — chạy và ghi bằng chứng (⛔ không gộp với `test:regression`)
```bash
node --test tests/t11-work-progress-approval.test.mjs
node --test tests/t12-work-tabs-and-modal-convention.test.mjs
# rồi mới: npx tsc --noEmit && npm run test:regression   (mốc 865·864·0·1) && node tools/gd-cycle.mjs "WORKCENTER L3-L7"
```
📌 **Khi port BE `add_work_item_comment` xong** ⇒ đổi `COMMENTS_READY = true` **và** cập nhật khẳng định trong `t11` (cổng canary đổi chiều: từ «phải là `false`» ⇒ «phải là `true`») — ⛔ để cổng **luôn phản ánh thực tế**, ⛔ không tắt cổng.

## 6. ⚠️ GHI NHỚ
- 2 tệp trên **khoá hành vi MỚI** ⇒ ⛔ **đỏ trước khi vá là ĐÚNG**; chỉ dán khi đã/đang áp `docs/54`.
- ⛔ **không** thêm 2 tệp này vào `package.json` (giữ nguyên số ca hồi quy) — đúng quy ước đã ghi ở `tests/t08:11`.
- ⭐ **ĐỐI CHỨNG ÂM bắt buộc** đã có ở test 0 của `t11` (mẫu phải bắt được cả dạng CŨ lẫn dạng MỚI) ⇒ ⛔ không có cổng «xanh rỗng».
