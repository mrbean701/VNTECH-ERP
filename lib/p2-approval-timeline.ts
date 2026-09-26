// PHASE 2 (§19) — LOGIC THUẦN CHO «THỜI ĐIỂM DUYỆT + BÌNH LUẬN» TRÊN DẢI DUYỆT.
//
// VÌ SAO TÁCH RA TỆP RIÊNG (không viết thẳng trong JSX):
//   1) `app/page.tsx` là tệp khổng lồ, dải duyệt nằm TRỌN trong MỘT dòng dài ⇒ logic nằm trong JSX thì
//      KHÔNG test được ở tầng dữ liệu (kỷ luật đã ghi ở `lib/p2-po-trace.ts` và `lib/approval-helpers.ts`);
//   2) tệp này KHÔNG import gì (không phụ thuộc `@/…`) ⇒ `tests/p2-d4-approval-timeline.test.mjs`
//      import TRỰC TIẾP được bằng `node --import tsx` và KHÔNG tạo import vòng vào `app/page.tsx`.
//
// ⚠️ TÊN TRƯỜNG LÀ TÊN THẬT ĐÃ ĐO TRÊN PAYLOAD BOOTSTRAP (không đoán):
//   · `approvals.decided_at` → payload `decidedAt`   (`BootstrapDataAdapter.java:88`)
//   · `approvals.comment`    → payload `comment`     (`BootstrapDataAdapter.java:88`)
//   · `approvals.status`     → payload `status`      (`approved`/`rejected`/`cancelled`/`pending`)
//   Nguồn: `docs/agent-progress/PHASE2-GAP-ANALYSIS.md` §19 + probe LIVE `tools/probe-p2-live-approval.mjs`.
//
// ⚠️ NGUYÊN TẮC «KHÔNG BỊA»: thiếu nguồn ⇒ trả về ĐÚNG chuỗi `NO_SOURCE_TEXT` («chưa có nguồn») kèm
//    LÝ DO, KHÔNG suy ra ngày hôm nay, KHÔNG lấy `queuedAt`/`dueAt` thay cho thời điểm quyết định.

/** Bản ghi bất kỳ đến từ payload bootstrap (giữ kiểu `Row` như `lib/p2-po-trace.ts`, không dùng `any`). */
export type Row = Record<string, unknown>;

/** Nguyên văn hiện lên UI khi payload KHÔNG có nguồn — dùng chung để test khoá được chuỗi. */
export const NO_SOURCE_TEXT = "chưa có nguồn";

export type DecisionField = {
  /** Chuỗi hiển thị: dữ liệu THẬT của payload, hoặc `NO_SOURCE_TEXT`. */
  value: string;
  /** `true` = có nguồn thật trong payload. */
  hasSource: boolean;
  /** LÝ DO khi thiếu nguồn (rỗng khi `hasSource = true`). */
  note: string;
};

/** Trạng thái đã RA QUYẾT ĐỊNH (có `decidedAt` thật trên CSDL) hay chưa. */
function isDecided(approval: Row | null | undefined): boolean {
  const status = String(approval?.status ?? "").trim().toLowerCase();
  return status === "approved" || status === "rejected" || status === "cancelled" || status === "skipped";
}

/** Chuỗi có nghĩa (đã cắt khoảng trắng). */
function hasText(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

/** Định dạng thời gian an toàn: nhận ISO/chuỗi bất kỳ, không bao giờ ném lỗi, không nuốt dữ liệu lạ. */
export function formatDecisionTime(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/**
 * THỜI ĐIỂM QUYẾT ĐỊNH của một bước duyệt (§19 — «Approval Time»).
 *
 * Thứ tự quyết định:
 *   1. Có `decidedAt` ⇒ trả THỜI GIAN THẬT (không đổi giá trị, không làm tròn).
 *   2. Không có bản ghi `approvals` ⇒ «chưa có nguồn» + lý do (bước cấu hình nhưng chưa tới lượt).
 *   3. Đã ra quyết định mà payload KHÔNG kèm `decidedAt` ⇒ «chưa có nguồn» + lý do (nói rõ là thiếu dữ liệu,
 *      KHÔNG thay bằng `queuedAt`/`dueAt`).
 *   4. Chưa tới lượt / đang chờ ⇒ «chưa có nguồn» + lý do.
 */
export function approvalDecisionAtView(approval: Row | null | undefined): DecisionField {
  if (!approval) {
    return { value: NO_SOURCE_TEXT, hasSource: false, note: "bước này chưa có bản ghi `approvals` trong payload" };
  }
  if (hasText(approval.decidedAt)) {
    return { value: formatDecisionTime(approval.decidedAt), hasSource: true, note: "" };
  }
  if (isDecided(approval)) {
    return { value: NO_SOURCE_TEXT, hasSource: false, note: "bản ghi đã ra quyết định nhưng payload không kèm `decidedAt`" };
  }
  return { value: NO_SOURCE_TEXT, hasSource: false, note: "bước chưa ra quyết định nên chưa có thời điểm duyệt" };
}

/**
 * BÌNH LUẬN / LÝ DO của một bước duyệt (§19 — «Comment / Reason»).
 *
 * Cùng thứ tự quyết định như `approvalDecisionAtView`: có `comment` ⇒ NGUYÊN VĂN của payload; thiếu ⇒
 * «chưa có nguồn» + lý do. KHÔNG chèn câu mô tả tự chế thay cho ý kiến của người duyệt.
 */
export function approvalDecisionCommentView(approval: Row | null | undefined): DecisionField {
  if (!approval) {
    return { value: NO_SOURCE_TEXT, hasSource: false, note: "bước này chưa có bản ghi `approvals` trong payload" };
  }
  if (hasText(approval.comment)) {
    return { value: String(approval.comment), hasSource: true, note: "" };
  }
  if (isDecided(approval)) {
    return { value: NO_SOURCE_TEXT, hasSource: false, note: "bản ghi đã ra quyết định nhưng người duyệt không để lại ý kiến" };
  }
  return { value: NO_SOURCE_TEXT, hasSource: false, note: "bước chưa ra quyết định nên chưa có ý kiến" };
}
