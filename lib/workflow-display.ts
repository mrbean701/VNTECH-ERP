// TASK-126 · `Q3` = PHƯƠNG ÁN (B) — «GIỮ SNAPSHOT, HIỂN THỊ MÃ/PHIÊN BẢN» của LUỒNG PHÊ DUYỆT.
// **CHỈ ĐỔI CÁCH HIỂN THỊ** — ⛔ KHÔNG sửa dữ liệu, KHÔNG thêm cột, KHÔNG chế trường mới.
//
// VÌ SAO TÁCH TỆP RIÊNG (đúng khuôn `lib/boq-line-display.ts` · `lib/p2-approval-timeline.ts`):
//   `app/page.tsx` khổng lồ và dải duyệt nằm trong JSX ⇒ logic trong JSX KHÔNG test được ở tầng dữ liệu;
//   tệp này KHÔNG import gì ⇒ `tests/q1-q3-display.test.mjs` import trực tiếp bằng `node --import tsx`.
//
// ⚠️ MÃ ĐỊNH DANH — CÓ NGUỒN THẬT (đo, không đoán):
//   · payload `workflowDefinitions` · `BootstrapDataAdapter.java:946-949`:
//     `SELECT id,code,name,description,module_key AS moduleKey,project_id AS projectId,is_default AS isDefault,
//      active,sort_order AS sortOrder,created_by AS createdBy FROM workflow_definitions`
//   · MySQL thật `vntech_erp` (chỉ-đọc 2026-09-18): 4 luồng, `code` = `WF-MUAHANG-01` · `WF-PO-01` ·
//     `WF-XUATKHO-01` · `WF-NHAPKHO-01`.
//
// ⛔ PHIÊN BẢN — **KHÔNG CÓ NGUỒN NÀO** (đo bằng 3 đường độc lập, KHÔNG suy diễn):
//   1) payload bootstrap KHÔNG chọn cột `version` (`BootstrapDataAdapter.java:946-949`, xem danh sách trên);
//   2) MySQL thật: `information_schema.columns` của `workflow_definitions` = `id,code,name,description,
//      module_key,project_id,is_default,active,sort_order,created_by,created_at,updated_at` ⇒ **KHÔNG có
//      `version`** (cột đã bị **Flyway V19** xoá: `V19__drop_workflow_definitions_version.sql`);
//      0 bảng khớp `%workflow_version%`; `approvals` · `approval_stage_catalog` **không có** `workflow_id`/
//      `workflow_version`; payload `requests` chỉ có `approvalStage` (một con số).
//   ⇒ Theo đúng luật «KHÔNG BỊA»: phiên bản trả về ĐÚNG chuỗi `NO_SOURCE_TEXT` («chưa có nguồn») kèm LÝ DO,
//     KHÔNG lấy `sortOrder`/`stage`/số bước thay cho phiên bản, KHÔNG tự đặt `V1`.

/** Bản ghi bất kỳ đến từ payload bootstrap (giữ kiểu `Row` như `lib/p2-po-trace.ts`, không dùng `any`). */
export type Row = Record<string, unknown>;

/** Nguyên văn hiện lên UI khi payload KHÔNG có nguồn — dùng chung với `lib/p2-approval-timeline.ts`. */
export const NO_SOURCE_TEXT = "chưa có nguồn";

/** Mã định danh + phiên bản của MỘT luồng phê duyệt (mọi trường đều kèm cờ `hasSource`). */
export type WorkflowIdentity = {
  /** Mã luồng (`workflow_definitions.code`); thiếu nguồn ⇒ «chưa có nguồn». */
  code: string;
  /** `true` = mã lấy từ trường THẬT của payload. */
  codeHasSource: boolean;
  /** Phiên bản luồng; thiếu nguồn ⇒ «chưa có nguồn». */
  version: string;
  /** `true` = phiên bản có nguồn thật (hiện tại **luôn** `false` — xem đầu tệp). */
  versionHasSource: boolean;
  /** LÝ DO khi thiếu nguồn (rỗng khi có đủ nguồn) — hiện lên `title` để người đọc biết vì sao trống. */
  note: string;
};

/** KHOÁ KỸ THUẬT (GUID/UUID, có hoặc không tiền tố miền) — bất biến: KHÔNG BAO GIỜ được hiển thị. */
const TECHNICAL_ID = /^(?:[A-Z]{2,6}_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Chuỗi đã cắt khoảng trắng; GUID ⇒ `""` (coi như không có nguồn hiển thị được). */
function safeText(value: unknown): string {
  const raw = value === null || value === undefined ? "" : String(value).trim();
  return raw === "" || TECHNICAL_ID.test(raw) ? "" : raw;
}

/** Lấy giá trị THẬT đầu tiên không rỗng trong danh sách khoá. */
function firstText(row: Row | null | undefined, keys: string[]): string {
  if (!row) return "";
  for (const key of keys) {
    const found = safeText(row[key]);
    if (found !== "") return found;
  }
  return "";
}

/** Lý do KHÔNG có phiên bản — nói thẳng cột nào không tồn tại, để người đọc không tưởng là lỗi hiển thị. */
const NO_VERSION_REASON =
  "payload/CSDL không có cột phiên bản luồng: `workflow_definitions.version` đã bị xoá (Flyway V19), 0 bảng `*workflow_version*`, và `requests`/`approvals` không có `workflow_id`/`workflow_version` (BootstrapDataAdapter.java:946-949)";

/**
 * MÃ ĐỊNH DANH + PHIÊN BẢN của luồng phê duyệt (§7 — Case 9, phương án B: «giữ snapshot, hiển thị mã/phiên bản»).
 *
 * @param row Bản ghi luồng (`workflowDefinitions[]`) HOẶC bản ghi phiếu (`requests[]` — thật ra KHÔNG có
 *            trường luồng nào, nên hàm trả «chưa có nguồn»; đó là cách nói ĐÚNG sự thật, không phải lỗi).
 *
 * Thứ tự: `workflowCode` → `code` (mã) · `workflowVersion` → `version` (phiên bản). Giá trị rỗng hoặc GUID
 * bị coi là KHÔNG có nguồn. ⛔ KHÔNG suy phiên bản từ `sortOrder`, số bước, `approvalStage` hay ngày tạo.
 */
export function workflowIdentityView(row: Row | null | undefined): WorkflowIdentity {
  const code = firstText(row, ["workflowCode", "workflow_code", "code"]);
  const version = firstText(row, ["workflowVersion", "workflow_version", "version"]);

  const reasons: string[] = [];
  if (code === "") reasons.push("bản ghi không có trường mã luồng (`workflowCode`/`code`)");
  if (version === "") reasons.push(NO_VERSION_REASON);

  return {
    code: code !== "" ? code : NO_SOURCE_TEXT,
    codeHasSource: code !== "",
    version: version !== "" ? version : NO_SOURCE_TEXT,
    versionHasSource: version !== "",
    note: reasons.join(" · "),
  };
}

/** Chuỗi hiển thị gọn «Mã luồng: … · Phiên bản: …» — dùng chung cho mọi chỗ hiển thị luồng/lịch sử duyệt. */
export function workflowIdentityText(row: Row | null | undefined): string {
  const view = workflowIdentityView(row);
  return `Mã luồng: ${view.code} · Phiên bản: ${view.version}`;
}
