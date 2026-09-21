// TASK-122 · `Q1` = PHƯƠNG ÁN (A) — ĐỔI CÁCH **HIỂN THỊ** MÃ DÒNG BOQ, **KHÔNG sửa dữ liệu**.
//
// VÌ SAO TÁCH TỆP RIÊNG (đúng kỷ luật `lib/p2-po-trace.ts` + `lib/p2-approval-timeline.ts`):
//   1) Cột «Mã dòng BOQ» của 2 nhánh xuất (`lib/boq-export.ts`) đang ghi `String(r.id)` ⇒ người dùng tải
//      Excel/CSV về là thấy `BOQ_36a50087-88f4-49e3-ac5a-fff0631b733d` — GUID vô nghĩa với người đọc;
//   2) tệp này KHÔNG import gì ⇒ `tests/q1-boq-export-display.test.mjs` import TRỰC TIẾP được bằng
//      `node --import tsx` và KHÔNG tạo import vòng vào `app/page.tsx`;
//   3) khoá kỹ thuật `id` GIỮ NGUYÊN trong CSDL (phương án A **không** đụng dữ liệu) — chỉ đổi giá trị GHI RA.
//
// ⚠️ TÊN TRƯỜNG LÀ TÊN THẬT ĐÃ ĐO, KHÔNG ĐOÁN — payload LIVE `GET /api/system` (8 dòng `boqItems`, dự án
//    `PRJ-DEMO-01`, lưu nguyên văn tại `tests/q1-boq-lines-payload.json`):
//      · `code`             → **KHÔNG tồn tại** trong dòng BOQ (0/8 dòng có khoá này)
//      · `boqCode`          → cột thật `project_boq_items.boq_code` (có khoá, **8/8 dòng = `null`** hiện tại)
//      · `lineRef`          → **KHÔNG tồn tại** trong dòng BOQ
//      · `contractLineRef`  → cột thật `project_boq_items.contract_line_ref` (có khoá, **8/8 dòng = `null`**)
//      · `no`               → **KHÔNG tồn tại** trong dòng BOQ
//      · `lineNo`           → cột thật `project_boq_items.line_no` (**8/8 dòng có giá trị**, ví dụ `1`)
//      · `materialCode`     → cột thật `materials.code` (**8/8 dòng**, ví dụ `KHAC-VLXD-004`)
//      · `materialName`     → tên vật tư (**8/8 dòng**, ví dụ `Thép hộp 40x40`)
//      · `sourceOrder`      → thứ tự nguồn (**8/8 dòng**)
//      · `id`               → `BOQ_<GUID>` — KHOÁ KỸ THUẬT, **không bao giờ** được trả về để hiển thị
//    Nguồn: `java-backend/infrastructure/.../BootstrapDataAdapter.java:445-628` (bản Java của
//    `scripts/system-route.mjs:711-742`) + probe chỉ-đọc `tests/q1-boq-line-source-probe.mjs`.
//
// ⚠️ NGUYÊN TẮC «KHÔNG BỊA»: hết nguồn thật ⇒ trả `NO_SOURCE_TEXT` («chưa có nguồn»), KHÔNG chế mã mới,
//    KHÔNG rơi về `id`/`sourceItemId` (GUID), KHÔNG suy ra từ dữ liệu khác hàng.

/** Bản ghi bất kỳ đến từ payload bootstrap (giữ kiểu `Row` như `lib/p2-po-trace.ts`, không dùng `any`). */
export type Row = Record<string, unknown>;

/** Nguyên văn hiện lên tệp xuất khi dòng BOQ KHÔNG có nguồn mã/tên nào — dùng chung với `lib/p2-approval-timeline.ts`. */
export const NO_SOURCE_TEXT = "chưa có nguồn";

/** Chuỗi đã cắt khoảng trắng; `null`/`undefined`/rỗng/khoảng trắng ⇒ `""` (KHÔNG phải nguồn). */
function text(value: unknown): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

/** Đọc trường theo TÊN THẬT, bỏ qua giá trị rỗng. Trả `""` khi thiếu nguồn. */
function firstText(row: Row, keys: string[]): string {
  for (const key of keys) {
    const found = text(row[key]);
    if (found !== "") return found;
  }
  return "";
}

/** `Dòng <số>` từ `lineNo` (dòng nguồn thật) — dùng khi KHÔNG có mã dòng/hợp đồng. */
function lineLabel(row: Row): string {
  const lineNo = firstText(row, ["lineNo", "sourceOrder"]);
  return lineNo === "" ? "" : `Dòng ${lineNo}`;
}

/**
 * MÃ HIỂN THỊ của một DÒNG BOQ khi xuất Excel/CSV (cột «Mã dòng BOQ»).
 *
 * Thứ tự ưu tiên (chỉ những trường CÓ THẬT trong payload bootstrap):
 *   1. Mã dòng BOQ / số dòng hợp đồng: `code` → `boqCode` → `lineRef` → `contractLineRef` → `no`
 *      (đúng phương án A đã chốt: *«đổi cột "Mã dòng BOQ" sang `contract_line_ref`/`boq_code`»*).
 *   2. Dòng CHƯA khai mã dòng (đo thật: 8/8 dòng `boqCode = contractLineRef = null`) ⇒ dùng **dữ liệu thật
 *      ĐÃ LƯU** của chính dòng đó: mã vật tư (`materialCode`) + số dòng nguồn (`lineNo`/`sourceOrder`),
 *      ví dụ `KHAC-VLXD-004 · Dòng 1`. Đây KHÔNG phải mã mới được chế ra — chỉ là 2 giá trị có sẵn trong
 *      payload, đủ để người đọc đối chiếu ngược về dòng BOQ trong hệ thống.
 *   3. Không có cả mã vật tư ⇒ dùng TÊN vật tư thật (`materialName`) + số dòng nguồn.
 *   4. Hết nguồn thật ⇒ `NO_SOURCE_TEXT` («chưa có nguồn»).
 *
 * ⛔ TUYỆT ĐỐI KHÔNG trả `id`/`sourceItemId` (dạng `BOQ_…`/`BQS_…` = GUID thô) — đây chính là lý do TASK-122
 *    tồn tại; khoá kỹ thuật vẫn NGUYÊN trong CSDL nhưng không được lộ ra tệp xuất.
 */
export function boqLineDisplayCode(row: Row | null | undefined): string {
  if (!row) return NO_SOURCE_TEXT;
  // 1. Mã dòng BOQ / số dòng theo hợp đồng.
  const lineCode = firstText(row, ["code", "boqCode", "lineRef", "contractLineRef", "no"]);
  if (lineCode !== "") return lineCode;
  // 2. Mã vật tư thật của dòng + số dòng nguồn.
  const materialCode = firstText(row, ["materialCode", "contractMaterialCode", "approvedMaterialCode", "internalMaterialCode"]);
  const line = lineLabel(row);
  if (materialCode !== "") return line === "" ? materialCode : `${materialCode} · ${line}`;
  // 3. Tên vật tư thật của dòng + số dòng nguồn.
  const materialName = firstText(row, ["materialName", "description", "contractMaterialName", "standardMaterialName"]);
  if (materialName !== "") return line === "" ? materialName : `${materialName} · ${line}`;
  // 4. Hết nguồn thật — KHÔNG bịa, KHÔNG rơi về GUID.
  return NO_SOURCE_TEXT;
}
