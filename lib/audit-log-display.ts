// TASK-126 · `Q1` = PHƯƠNG ÁN (A) — MÀN «NHẬT KÝ KIỂM TOÁN» HẾT LỘ GUID: **CHỈ ĐỔI CÁCH HIỂN THỊ**,
// ⛔ KHÔNG sửa dữ liệu (`audit_logs.entity_id` giữ NGUYÊN khoá kỹ thuật trong CSDL).
//
// VÌ SAO TÁCH TỆP RIÊNG (đúng khuôn `lib/boq-line-display.ts` · `lib/p08-nav-trace.ts` · `lib/p2-po-trace.ts`):
//   1) `app/page.tsx` là tệp khổng lồ; logic nằm trong JSX thì KHÔNG test được ở tầng dữ liệu;
//   2) tệp này KHÔNG import gì ⇒ `tests/q1-q3-display.test.mjs` import TRỰC TIẾP bằng `node --import tsx`,
//      không tạo import vòng vào `app/page.tsx`.
//
// ⚠️ DỮ LIỆU THẬT ĐÃ ĐO (MySQL `vntech_erp`, chỉ-đọc, 2026-09-18 — 909 dòng `audit_logs`):
//   · `audit_logs.entity_type` là chuỗi TỰ DO, KHÔNG phải tên bảng: `requests` 155 · `approvals` 182 ·
//     `material_request` 147 · `update` 109 · `save` 94 · `create` 41 · `delete` 14 · `material` 12 …
//   · `audit_logs.entity_id` chứa KHOÁ KỸ THUẬT có tiền tố miền: `PRJ_<guid>` · `MR_<guid>` · `PO_<guid>` ·
//     `MAT_<guid>` · `USR_<guid>` (đo bằng JOIN thật: entity_id khớp `projects` 104 dòng · `users` 114 dòng ·
//     `material_requests` 56 dòng · `materials` 2 dòng · `purchase_orders` 0 dòng hiện tại)
//   · ⚠️ 37/909 dòng có `entity_id` RỖNG (`create_user`, `dept_plan_tasks` …) ⇒ hết nguồn ⇒ «chưa có nguồn».
//   · Có dòng `entity_type='requests'` nhưng `entity_id` lại là `PRJ_…` (khoá DỰ ÁN) ⇒ KHÔNG tra theo
//     `entity_type` suông mà phải tra CHÍNH XÁC `id` trong các danh mục payload (xem `resolveRecord`).
//
// ⚠️ NGUYÊN TẮC «KHÔNG BỊA»: tra không ra ⇒ trả `NO_SOURCE_TEXT` («chưa có nguồn»). Hàm này
//    **KHÔNG BAO GIỜ** trả về chuỗi dạng GUID/khoá kỹ thuật (xem `isTechnicalId`) — đó chính là lý do tệp tồn tại.

/** Bản ghi bất kỳ đến từ payload bootstrap (giữ kiểu `Row` như `lib/p2-po-trace.ts`, không dùng `any`). */
export type Row = Record<string, unknown>;

/** Nguyên văn hiện lên UI khi KHÔNG tra được nguồn — dùng chung với `lib/p2-approval-timeline.ts`. */
export const NO_SOURCE_TEXT = "chưa có nguồn";

/** Các danh mục payload dùng để tra mã nghiệp vụ của bản ghi bị tác động (đều là trường THẬT của bootstrap). */
export type AuditSources = {
  projects?: Row[];
  requests?: Row[];
  purchaseOrders?: Row[];
  materials?: Row[];
  users?: Row[];
};

/** Kết quả hiển thị cho MỘT dòng nhật ký: nhãn loại đối tượng + mã nghiệp vụ của bản ghi bị tác động. */
export type AuditEntityDisplay = {
  /** Nhãn tiếng Việt của LOẠI đối tượng («Phiếu đề nghị mua hàng», «Dự án»…); hết nguồn ⇒ «chưa có nguồn». */
  subjectLabel: string;
  /** `true` = nhãn lấy từ danh mục/bản ghi THẬT. */
  subjectHasSource: boolean;
  /** MÃ NGHIỆP VỤ của bản ghi bị tác động; hết nguồn ⇒ «chưa có nguồn». KHÔNG BAO GIỜ là GUID. */
  recordCode: string;
  /** `true` = mã tra được trong payload. */
  recordHasSource: boolean;
  /** Nhãn loại của bản ghi ĐÃ TRA ĐƯỢC (rỗng khi không tra được). */
  recordKind: string;
  /** LÝ DO khi thiếu nguồn (rỗng khi tra được đủ) — hiện lên `title` để người đọc biết vì sao trống. */
  note: string;
};

/** Chuỗi đã cắt khoảng trắng; `null`/`undefined`/rỗng ⇒ `""` (KHÔNG phải nguồn). */
function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

/**
 * KHOÁ KỸ THUẬT (GUID/UUID, có hoặc không tiền tố miền `PRJ_`/`MR_`/`PO_`/`MAT_`/`USR_`).
 * Đây là bất biến chống hồi quy: mọi giá trị người dùng nhìn thấy đều phải đi qua `safeText`.
 */
const TECHNICAL_ID = /^(?:[A-Z]{2,6}_)?[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** `true` nếu giá trị là khoá kỹ thuật (GUID/UUID) — TUYỆT ĐỐI không được hiển thị cho người dùng. */
export function isTechnicalId(value: unknown): boolean {
  return TECHNICAL_ID.test(text(value));
}

/** Chuỗi hiển thị an toàn: rỗng hoặc là GUID ⇒ `""` (coi như KHÔNG có nguồn). */
function safeText(value: unknown): string {
  const raw = text(value);
  return raw === "" || isTechnicalId(raw) ? "" : raw;
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

type Collection = {
  /** Khoá trong payload bootstrap (`AppData`). */
  key: keyof AuditSources;
  /** Nhãn tiếng Việt của loại đối tượng. */
  label: string;
  /** Tên trường mã nghiệp vụ trên bản ghi (tên THẬT đã đo — xem đầu tệp). */
  codeKeys: string[];
  /** `entity_type` (chuỗi tự do trong `audit_logs`) ánh xạ về danh mục này. */
  types: string[];
};

const COLLECTIONS: Collection[] = [
  { key: "projects", label: "Dự án", codeKeys: ["code", "projectCode"], types: ["project", "projects", "du_an"] },
  { key: "requests", label: "Phiếu đề nghị mua hàng", codeKeys: ["requestNo", "code"], types: ["request", "requests", "material_request", "material_requests", "purchase_request"] },
  { key: "purchaseOrders", label: "Đơn hàng mua sắm (PO)", codeKeys: ["poNo", "code"], types: ["purchaseorder", "purchaseorders", "purchase_order", "purchase_orders", "po", "order"] },
  { key: "materials", label: "Vật tư", codeKeys: ["code", "materialCode"], types: ["material", "materials", "material_catalog", "materialcatalog", "vat_tu"] },
  { key: "users", label: "Người dùng", codeKeys: ["employeeCode", "username", "fullName"], types: ["user", "users", "nguoi_dung", "admin", "account"] },
];

/** Chuẩn hoá `entity_type` để so khớp ánh xạ (bỏ `_`/`-`, hạ chữ). */
function normalizeType(value: unknown): string {
  return text(value).toLowerCase().replace(/[\s_-]+/g, "");
}

/** Danh mục suy từ `entity_type` (undefined khi `entity_type` là giá trị tự do không ánh xạ được). */
function collectionOfType(entityType: unknown): Collection | undefined {
  const key = normalizeType(entityType);
  if (key === "") return undefined;
  return COLLECTIONS.find((collection) => collection.types.some((type) => normalizeType(type) === key));
}

/** Tra bản ghi theo ĐÚNG khoá kỹ thuật `id` trong một danh mục payload. */
function findById(rows: Row[] | undefined, recordId: string): Row | null {
  if (!Array.isArray(rows) || recordId === "") return null;
  return rows.find((row) => text(row?.id) === recordId) || null;
}

type ResolvedRecord = { collection: Collection; row: Row };

/**
 * Tra bản ghi bị tác động: ưu tiên danh mục suy từ `entity_type`, sau đó quét NỐT các danh mục còn lại
 * bằng khoá `id` (cần thiết vì dữ liệu thật có dòng `entity_type='requests'` nhưng `entity_id='PRJ_…'`).
 */
function resolveRecord(entityType: unknown, recordId: string, data: AuditSources): ResolvedRecord | null {
  const mapped = collectionOfType(entityType);
  const order = mapped ? [mapped, ...COLLECTIONS.filter((collection) => collection.key !== mapped.key)] : COLLECTIONS;
  for (const collection of order) {
    const row = findById(data[collection.key], recordId);
    if (row) return { collection, row };
  }
  return null;
}

/**
 * HIỂN THỊ ĐỐI TƯỢNG + MÃ BẢN GHI của MỘT dòng «Nhật ký kiểm toán» (phương án A — chỉ đổi hiển thị).
 *
 * @param entityType `audit_logs.entity_type` (chuỗi tự do) — dùng để lấy NHÃN TIẾNG VIỆT của loại đối tượng.
 * @param recordId   `audit_logs.entity_id` — KHOÁ KỸ THUẬT, chỉ dùng để TRA, KHÔNG BAO GIỜ trả về để hiển thị.
 * @param data       payload bootstrap (chỉ ĐỌC): `projects` · `requests` · `purchaseOrders` · `materials` · `users`.
 *
 * Thứ tự quyết định:
 *   1. Danh mục suy từ `entity_type` (nếu ánh xạ được) ⇒ nhãn tiếng Việt tương ứng.
 *   2. Tra ĐÚNG `id` trong danh mục đó ⇒ lấy mã nghiệp vụ thật (`code` · `requestNo` · `poNo` · `code` · `employeeCode`).
 *   3. Không thấy ở danh mục suy ra ⇒ quét nốt các danh mục còn lại bằng `id` (dữ liệu thật có dòng lệch loại).
 *   4. Không tra được bản ghi ⇒ «chưa có nguồn» + lý do; bản ghi CÓ mà KHÔNG có mã nghiệp vụ ⇒ «chưa có nguồn» + lý do.
 */
export function auditLogDisplay(entityType: unknown, recordId: unknown, data: AuditSources = {}): AuditEntityDisplay {
  const id = text(recordId);
  const resolved = resolveRecord(entityType, id, data);
  const mapped = collectionOfType(entityType);
  const kindLabel = resolved ? resolved.collection.label : mapped ? mapped.label : "";
  const code = resolved ? firstText(resolved.row, resolved.collection.codeKeys) : "";

  const subjectLabel = mapped ? mapped.label : kindLabel || NO_SOURCE_TEXT;
  const recordCode = code !== "" ? code : NO_SOURCE_TEXT;

  let note = "";
  if (id === "") {
    note = "bản ghi nhật ký không có `entity_id` (cột thật `audit_logs.entity_id` để trống)";
  } else if (!resolved) {
    note = "không tìm thấy bản ghi có `id` này trong dữ liệu đang tải (dự án · phiếu đề nghị · đơn hàng · vật tư · người dùng)";
  } else if (code === "") {
    note = `đã tìm thấy bản ghi trong danh mục «${resolved.collection.label}» nhưng bản ghi không có mã nghiệp vụ (${resolved.collection.codeKeys.join(" · ")})`;
  } else if (mapped && mapped.key !== resolved.collection.key) {
    note = `loại ghi trong nhật ký là «${mapped.label}» nhưng khoá kỹ thuật trỏ tới «${resolved.collection.label}» — nhãn hiển thị lấy theo bản ghi TRA ĐƯỢC`;
  }

  return {
    subjectLabel,
    subjectHasSource: subjectLabel !== NO_SOURCE_TEXT,
    recordCode,
    recordHasSource: code !== "",
    recordKind: kindLabel,
    note,
  };
}
