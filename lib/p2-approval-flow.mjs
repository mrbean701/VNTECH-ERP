// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH)
//
// PHASE 2 (§6 · §23 · §24) — LOGIC THUẦN CHO «LUỒNG DUYỆT ĐỘNG» CỦA PHIẾU ĐỀ NGHỊ MUA HÀNG (PR/MR).
//
// VÌ SAO TÁCH RA TỆP .mjs (không phải .ts): `scripts/system-route.mjs` là ESM thuần và chỉ import được
// `.mjs` (xem 2 import đầu tệp đó). Tách ở đây để có MỘT nguồn sự thật cho việc suy luồng duyệt, dùng chung
// cho: (a) tạo phiếu mới, (b) gửi lại phiếu bị trả về, (c) test hợp đồng (hàm thuần ⇒ test được bằng dữ liệu).
//
// CHỈ ĐẠO NGƯỜI DÙNG (21/09/2026):
//   (1) «luồng duyệt chính là workflow động, bao nhiêu bước không quan trọng chỉ cần nó có khả năng flexible…
//        workflow thay đổi thì luồng duyệt cũng thay đổi theo.»
//   (2) «mỗi tác nhân đóng vai trò như 1 người duyệt, không tính người tạo đơn (canCreatePR).»
//
// ⇒ TỆP NÀY KHÔNG CHỨA BƯỚC DUYỆT NÀO. Nó chỉ ĐỌC dữ liệu cấu hình (`approval_stage_catalog`) và trả về luồng.
//    Đổi dữ liệu ⇒ đổi luồng, không phải sửa mã nguồn (§23).

/** Loại bước: `approval` = bước duyệt HỒ SƠ (chuỗi PR); `supply` = bước CUNG ỨNG/xử lý (PO, giao nhận, BCH). */
export const STAGE_KIND_APPROVAL = "approval";
export const STAGE_KIND_SUPPLY = "supply";

/**
 * Chuẩn hoá loại bước của một dòng catalog. Dữ liệu cũ (trước khi có cột `stage_kind`) mặc định là `approval`
 * ⇒ TƯƠNG THÍCH NGƯỢC (§24): bản ghi cũ không đổi hành vi.
 * @param {unknown} value
 * @returns {string}
 */
export function stageKindOf(value) {
  return String(value ?? "").trim().toLowerCase() === STAGE_KIND_SUPPLY ? STAGE_KIND_SUPPLY : STAGE_KIND_APPROVAL;
}

/**
 * Tách danh sách mã vai trò được phép duyệt từ cột `allowed_role_codes` (chuỗi phân cách bởi dấu phẩy).
 * @param {unknown} value
 * @returns {string[]}
 */
export function parseStageRoles(value) {
  const seen = new Set();
  const out = [];
  for (const raw of String(value ?? "").split(",")) {
    const code = raw.trim();
    if (!code || seen.has(code)) continue;
    seen.add(code);
    out.push(code);
  }
  return out;
}

/**
 * Mã vai trò của NGƯỜI TẠO khớp với bước duyệt (khớp mã vai trò trực tiếp hoặc vai trò nền `base_role`).
 * Trả về "" nếu không khớp — nghĩa là người này KHÔNG được miễn bước.
 * @param {object} stage dòng catalog (allowed_role_codes)
 * @param {object} creator người lập phiếu (role, roleBase)
 * @returns {string}
 */
export function matchedStageRole(stage, creator) {
  const allowed = stageRolesOf(stage);
  if (!allowed.length || !creator) return "";
  const role = String(creator.role ?? "").trim();
  const base = String(creator.roleBase ?? creator.role ?? "").trim();
  for (const candidate of [role, base]) if (candidate && allowed.includes(candidate)) return candidate;
  return "";
}

function numberOr(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function truthyFlag(value) {
  return value === true || value === 1 || ["1", "true", "on"].includes(String(value ?? "").trim().toLowerCase());
}

/**
 * Đọc một trường của dòng catalog theo CẢ HAI cách đặt tên (snake_case của CSDL và camelCase của alias SQL).
 * VÌ SAO CẦN: `approvalStages()` trong `scripts/system-route.mjs` trả alias camelCase
 * (`stageNo`/`allowedRoleCodes`/`approvalMode`/`slaHours`/`autoApproveOnSubmit`/`sortOrder`), còn bảng
 * `approval_stage_catalog` và các tệp migration dùng snake_case. Chỉ đọc một kiểu ⇒ mọi bước thành
 * `stageNo = 0` và luồng thật hỏng (đã từng xảy ra: 1 ca `test:regression` đỏ).
 * @param {object} row
 * @param {string} snake
 * @param {string} camel
 */
function fieldOf(row, snake, camel) {
  if (!row) return undefined;
  const value = row[snake];
  return value === undefined || value === null ? row[camel] : value;
}
/** Số bước (đọc cả `stage_no` và `stageNo`). */
function stageNoOf(stage) {
  return numberOr(fieldOf(stage, "stage_no", "stageNo"), 0);
}
/** Danh sách vai trò được duyệt (đọc cả `allowed_role_codes` và `allowedRoleCodes`). */
function stageRolesOf(stage) {
  return parseStageRoles(fieldOf(stage, "allowed_role_codes", "allowedRoleCodes"));
}
/** Loại bước (đọc cả `stage_kind` và `stageKind`). */
function stageKindOfRow(stage) {
  return stageKindOf(fieldOf(stage, "stage_kind", "stageKind"));
}

/**
 * SUY LUỒNG DUYỆT từ dữ liệu cấu hình.
 *
 * Quy tắc (thứ tự quyết định):
 *   1. Chỉ lấy bước `active` VÀ `stage_kind='approval'` (bước cung ứng 101/102/103 KHÔNG thuộc chuỗi duyệt phiếu).
 *   2. Thứ tự = `sort_order`, cùng hạng thì theo `stage_no` (dữ liệu quyết định, không phải mã nguồn).
 *   3. Bước `auto_approve_on_submit=1` ⇒ tự duyệt khi gửi (hành vi cũ, giữ nguyên).
 *   4. NGƯỜI TẠO TRÙNG VAI TRÒ DUYỆT ⇒ không tự duyệt đơn của mình:
 *        · `approval_mode='single'`  ⇒ bỏ qua (đánh dấu đã duyệt) CẢ BƯỚC — «mỗi tác nhân = 1 người duyệt».
 *        · `approval_mode='all_roles'` ⇒ chỉ MIỄN vai trò của người tạo (`waivedRoleCodes`); nếu mọi vai trò
 *          của bước đều bị miễn thì bỏ qua cả bước.
 *   5. Bước chờ đầu tiên (không tự duyệt/bị miễn) = bước đang xử lý (`currentStageNo`). Không còn bước nào ⇒
 *      `complete = true` (hồ sơ hoàn tất ngay khi gửi, giống bước cuối cũ).
 *
 * @param {Array<object>} stages các dòng `approval_stage_catalog` (đã lọc hoặc chưa — hàm tự lọc)
 * @param {object} creator người lập phiếu: { id, fullName, role, roleBase }
 * @returns {{steps: Array<object>, currentStageNo: number, complete: boolean, approverStageCount: number}}
 */
export function resolveApprovalFlow(stages, creator) {
  const active = (Array.isArray(stages) ? stages : [])
    .filter((stage) => stage && truthyFlag(stage.active ?? 1) && stageKindOfRow(stage) === STAGE_KIND_APPROVAL)
    .sort((a, b) => {
      const orderA = numberOr(fieldOf(a, "sort_order", "sortOrder"), stageNoOf(a));
      const orderB = numberOr(fieldOf(b, "sort_order", "sortOrder"), stageNoOf(b));
      const orderDiff = orderA - orderB;
      return orderDiff !== 0 ? orderDiff : stageNoOf(a) - stageNoOf(b);
    });

  const steps = [];
  let currentStageNo = 0;
  for (const stage of active) {
    const allowed = stageRolesOf(stage);
    const allowedRoleCodes = allowed.join(",");
    const approvalMode = String(fieldOf(stage, "approval_mode", "approvalMode") ?? "").trim() === "all_roles" ? "all_roles" : "single";
    const matched = matchedStageRole(stage, creator);
    const waivedRoleCodes = matched ? [matched] : [];
    const autoBySubmit = truthyFlag(fieldOf(stage, "auto_approve_on_submit", "autoApproveOnSubmit"));
    const skipWholeStage = autoBySubmit || (matched && (approvalMode === "single" || allowed.every((code) => code === matched)));
    const autoApproved = Boolean(skipWholeStage);
    const stageNo = stageNoOf(stage);
    const step = {
      id: stage.id ?? null,
      stageNo,
      name: String(stage.name ?? ""),
      description: String(stage.description ?? ""),
      allowedRoleCodes,
      approvalMode,
      slaHours: Math.max(1, Math.trunc(numberOr(fieldOf(stage, "sla_hours", "slaHours"), 8))),
      autoApproveOnSubmit: autoBySubmit,
      autoApproved,
      autoApproveReason: autoBySubmit
        ? "Tự xác nhận khi gửi phiếu"
        : autoApproved
          ? `Người lập phiếu trùng vai trò duyệt của bước ${stageNo} (${waivedRoleCodes.join(",")}) — không tự duyệt đơn của mình`
          : "",
      // Vai trò của người tạo bị MIỄN ở bước song song (chỉ có nghĩa khi không bỏ qua cả bước).
      waivedRoleCodes: autoApproved ? [] : waivedRoleCodes,
      queued: false,
    };
    steps.push(step);
    if (!autoApproved && !currentStageNo) currentStageNo = stageNo;
  }
  for (const step of steps) if (step.stageNo === currentStageNo) step.queued = true;
  return {
    steps,
    currentStageNo,
    complete: steps.length > 0 && !currentStageNo,
    approverStageCount: steps.filter((step) => !step.autoApproved).length,
  };
}

/**
 * Vai trò cần xác nhận của một bước song song, SAU KHI trừ các vai trò đã bị miễn vì trùng người lập phiếu.
 * Dùng ở `decide_approval` để bước `all_roles` không bị treo vĩnh viễn.
 * @param {object} stage cấu hình bước (allowed_role_codes / allowedRoleCodes)
 * @param {string[]} waivedRoleCodes vai trò đã bị miễn (từ `approval_stage_decisions.decision='waived_requester'`)
 * @returns {string[]}
 */
export function requiredStageRoles(stage, waivedRoleCodes) {
  const waived = new Set(Array.isArray(waivedRoleCodes) ? waivedRoleCodes.map((code) => String(code).trim()) : []);
  return stageRolesOf(stage).filter((code) => !waived.has(code));
}
