// PHASE 2 (§19) — HỢP ĐỒNG «DẢI DUYỆT: THỜI ĐIỂM DUYỆT + BÌNH LUẬN».
//
// VÌ SAO CÓ TỆP NÀY: `docs/agent-progress/PHASE2-GAP-ANALYSIS.md` §19 kết luận
// «`ApprovalTimeline` có (`Timeline.tsx:70`, dùng ở `RequestDrawer`) + dải tự viết `page.tsx`
//  ⇒ **thiếu `decidedAt`/`comment`** ở dải tự viết» ⇒ người duyệt KHÔNG thấy ý kiến/lý do trả lại
// của các bước trước ngay trên màn Phê duyệt. Tệp này khoá ĐỦ 6 thông tin §19 ở cả hai dải:
//   §19 = Approver · Department · Step Order · Status · **Approval Time** · **Comment / Reason**
//
// ⚠️ NGUYÊN TẮC «KHÔNG BỊA»: chỗ payload KHÔNG có nguồn (`decidedAt`/`comment` thiếu) thì UI BẮT BUỘC
//    hiện nguyên văn «chưa có nguồn» kèm LÝ DO — tệp này chặn việc thay bằng số/ngày tự chế.
//
// ⚠️ TÊN TRƯỜNG THẬT ĐÃ ĐO (không đoán): `approvals.decided_at` → payload `decidedAt` ·
//    `approvals.comment` → payload `comment` (`BootstrapDataAdapter.java` dòng 88).
//
// Chạy riêng:  node --import tsx --test tests/p2-d4-approval-timeline.test.mjs
// (tệp CỐ Ý không nằm trong `package.json` → `test:regression` giữ nguyên 69 ca)
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NO_SOURCE_TEXT, approvalDecisionAtView, approvalDecisionCommentView } from "../lib/p2-approval-timeline.ts";

const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const page = read("app/page.tsx");
const requestDrawer = read("app/screens/RequestDrawer.tsx");
const timelineUi = read("app/components/ui/Timeline.tsx");

// ── DỮ LIỆU THẬT — đúng bản ghi đã đo trên LIVE (phiếu DNMH-PRJ-DEMO-01-2026-0125) ────────────────
const STEP_APPROVED = {
  stage: 4, department: "Phòng Kế hoạch", status: "approved",
  decidedAt: "2026-09-20T12:28:02.366Z", approverUserId: "USR_8869ca60-7c6a-4e7f-bebd-0547f38bcdb8",
  comment: "Người lập phiếu trùng vai trò duyệt của bước 4 (procurement) — không tự duyệt đơn của mình: Phòng Kế hoạch",
};
const STEP_PENDING = { stage: 2, department: "Thư ký Tổng giám đốc", status: "pending" };

/** Cắt khối nguồn theo dấu `data-vntech`. */
const block = (source, marker, nextMarker) => {
  const start = source.indexOf(`data-vntech="${marker}"`);
  assert.ok(start > 0, `THIẾU khối \`data-vntech="${marker}"\``);
  const end = nextMarker ? source.indexOf(`data-vntech="${nextMarker}"`, start) : source.length;
  assert.ok(!nextMarker || end > start, `Không cắt được khối \`${marker}\``);
  return source.slice(start, end);
};

test("§19 — tầng hàm thuần: thời điểm duyệt + bình luận đọc từ payload, THIẾU nguồn thì nói thẳng «chưa có nguồn»", () => {
  const at = approvalDecisionAtView(STEP_APPROVED);
  assert.equal(at.hasSource, true, "Bước đã duyệt CÓ `decidedAt` ⇒ `hasSource = true`");
  assert.match(at.value, /20\/09\/2026/, "Thời điểm duyệt phải là THỜI GIAN THẬT của `decidedAt` (định dạng ngày/tháng/năm)");
  assert.match(at.value, /19:28|12:28/, "Phải kèm GIỜ của `decidedAt` (giờ địa phương của chuỗi ISO)");

  const comment = approvalDecisionCommentView(STEP_APPROVED);
  assert.equal(comment.hasSource, true, "Bước đã duyệt CÓ `comment` ⇒ `hasSource = true`");
  assert.equal(comment.value, STEP_APPROVED.comment, "Bình luận phải là NGUYÊN VĂN `comment` của payload");

  // Bước CHƯA ra quyết định ⇒ KHÔNG có `decidedAt`/`comment` thật ⇒ không được bịa.
  const pendingAt = approvalDecisionAtView(STEP_PENDING);
  assert.equal(pendingAt.hasSource, false, "Bước chờ duyệt KHÔNG có `decidedAt` ⇒ `hasSource = false`");
  assert.equal(pendingAt.value, NO_SOURCE_TEXT, `Thiếu nguồn ⇒ BẮT BUỘC hiện «${NO_SOURCE_TEXT}»`);
  assert.ok(pendingAt.note.length > 5, "Thiếu nguồn ⇒ BẮT BUỘC kèm LÝ DO để người dùng hiểu vì sao");
  const pendingComment = approvalDecisionCommentView(STEP_PENDING);
  assert.equal(pendingComment.hasSource, false, "Bước chờ duyệt KHÔNG có `comment`");
  assert.equal(pendingComment.value, NO_SOURCE_TEXT, `Thiếu nguồn ⇒ BẮT BUỘC hiện «${NO_SOURCE_TEXT}»`);

  // Bước chưa có bản ghi `approvals` nào (bước cấu hình nhưng chưa tới lượt): vẫn phải nói rõ nguồn thiếu.
  const noneAt = approvalDecisionAtView(undefined);
  assert.equal(noneAt.hasSource, false, "Không có bản ghi `approvals` ⇒ `hasSource = false`");
  assert.equal(noneAt.value, NO_SOURCE_TEXT, "Không có bản ghi ⇒ «chưa có nguồn»");
  assert.equal(approvalDecisionCommentView(null).value, NO_SOURCE_TEXT, "Bản ghi null ⇒ «chưa có nguồn»");

  // `decidedAt` là chuỗi đã định dạng (không phải ISO) ⇒ trả NGUYÊN VĂN, không nuốt dữ liệu.
  assert.equal(approvalDecisionAtView({ status: "approved", decidedAt: "20/09/2026 19:28" }).value, "20/09/2026 19:28", "Chuỗi không parse được phải trả nguyên văn");
});

test("§19 — dải tự viết ở màn Phê duyệt (`app/page.tsx`) có ĐỦ thời điểm duyệt + bình luận", () => {
  const step = block(page, "approval-flow-step");
  assert.match(step, /data-vntech="approval-step-decided-at"/, "Thiếu dấu đo được cho THỜI ĐIỂM DUYỆT (`approval-step-decided-at`)");
  assert.match(step, /data-vntech="approval-step-comment"/, "Thiếu dấu đo được cho BÌNH LUẬN (`approval-step-comment`)");
  assert.match(step, /Thời điểm duyệt/, "Phải có NHÃN «Thời điểm duyệt» để người duyệt đọc được");
  assert.match(step, /Bình luận/, "Phải có NHÃN «Bình luận»");
  assert.match(step, /atView\.value/, "Phải RENDER giá trị thời điểm duyệt đã tính (không tự nối chuỗi trong JSX)");
  assert.match(step, /commentView\.value/, "Phải RENDER giá trị bình luận đã tính");
  assert.match(step, /!atView\.hasSource/, "Phải rẽ nhánh THIẾU NGUỒN cho thời điểm duyệt (kèm lý do), KHÔNG im lặng bỏ trống");
  assert.match(step, /!commentView\.hasSource/, "Phải rẽ nhánh THIẾU NGUỒN cho bình luận (kèm lý do)");
  assert.match(page, /import \{ approvalDecisionAtView, approvalDecisionCommentView \} from "@\/lib\/p2-approval-timeline"/, "page.tsx phải dùng hàm thuần dùng chung, KHÔNG tính chuỗi trong JSX");
  assert.match(page, /const atView=approvalDecisionAtView\(approval\);/, "Thời điểm duyệt phải đọc từ bản ghi `approval` THẬT của bước (payload `decidedAt`)");
  assert.match(page, /const commentView=approvalDecisionCommentView\(approval\);/, "Bình luận phải đọc từ bản ghi `approval` THẬT của bước (payload `comment`)");

  // §19 yêu cầu trạng thái lấy từ dữ liệu thật, KHÔNG hard-code (đã có `state` từ `approval?.status`).
  assert.match(page, /const state=approval\?\.status/, "Trạng thái bước phải suy từ `approval.status` của payload");
  assert.doesNotMatch(page, /decidedAt:\s*"/, "KHÔNG được hard-code `decidedAt` trong page.tsx");
});

test("§19 — dải dùng chung (`ApprovalTimeline`) ở chi tiết phiếu vẫn đủ 6 thông tin mỗi bước", () => {
  assert.match(requestDrawer, /<ApprovalTimeline/, "Chi tiết phiếu phải TÁI DÙNG `ApprovalTimeline` (không viết dải mới)");
  const timeline = block(requestDrawer, "request-child-pos", "child-po-row");
  assert.ok(timeline.length > 0, "Không cắt được vùng chi tiết phiếu");
  assert.match(requestDrawer, /at: approval\.decidedAt \|\| null/, "Phải truyền `decidedAt` THẬT vào tham số `at` của ApprovalTimeline");
  assert.match(requestDrawer, /comment: approval\.comment \|\| null/, "Phải truyền `comment` THẬT vào tham số `comment` của ApprovalTimeline");
  assert.match(requestDrawer, /approver: approval\.approverName/, "§19 Approver — phải lấy `approverName`");
  assert.match(requestDrawer, /department: approval\.department/, "§19 Department — phải lấy cột thật `approval.department`");
  assert.match(requestDrawer, /no: stageNo/, "§19 Step Order — phải lấy số bước thật");

  // Component dùng chung phải RENDER được cả hai trường (nếu không, truyền vào cũng vô nghĩa).
  assert.match(timelineUi, /export function ApprovalTimeline/, "`Timeline.tsx` phải còn `ApprovalTimeline`");
  assert.match(timelineUi, /vt-timeline-comment/, "`ApprovalTimeline` phải render bình luận (`.vt-timeline-comment`)");
  assert.match(timelineUi, /fmt\(s\.at\)/, "`ApprovalTimeline` phải render thời điểm quyết định (`s.at`)");
  assert.match(timelineUi, /STEP_LABEL\[s\.status\]/, "§19 Status — nhãn trạng thái phải suy từ `status`, KHÔNG hard-code");
  assert.ok(["approved", "rejected", "pending", "waiting", "skipped"].every((key) => timelineUi.includes(`${key}:`)), "§19 phải phản ánh đủ 5 trạng thái thật");
});
