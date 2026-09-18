// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
import { VNTECH_IDENTITY } from "./vntech-identity.mjs";
import { normalizeMaterialText, tokenSimilarity, embedText, scoreMaterialCandidate, materialCandidateGate, MATERIAL_MATCH_THRESHOLDS, MATERIAL_MATCH_WEIGHTS } from "../lib/material-matching-v2.mjs";
import { verifyLicenseEnvelope } from "../lib/trust/license-verifier.mjs";
let env;
async function loadEnv() { env = globalThis.__MEP_LOCAL_ENV__; if (!env) throw new Error("Chưa khởi tạo môi trường dữ liệu cục bộ."); }
const COOKIE = "mep_session";
const SESSION_HOURS = 24;
const MODULE_KEYS = ["dashboard","dept_plan_tasks","dept_plan_assign","dept_plan_supply_plan","dept_plan_tender","dept_plan_rfq","dept_plan_purchasing","dept_plan_supply","dept_plan_contracts","dept_plan_suppliers","dept_plan_price_data","dept_plan_kpi","dept_plan_alerts","dept_project_tasks","dept_project_pda","dept_project_assign","dept_project_plan","dept_project_shop","dept_project_boq","dept_project_material","dept_project_issues","dept_project_asbuilt","dept_project_payment","dept_project_tender","dept_project_kpi","dept_project_alerts","dept_finance_payment_plan","dept_finance_recovery","dept_finance_advance","dept_finance_site_cost","dept_finance_cashbank","dept_finance_documents","dept_legal_hr","dept_legal_labor","dept_legal_correspondence","dept_legal_documents","dept_legal_seal","dept_legal_benefits","site_command","project_progress","construction","production","capital_recovery","requests","approvals","purchasing","supplier_catalog","receiving","delivered","warehouse_receipt","warehouse_issue","inventory","material_norms","central_warehouse","material_catalog","boq","payments","teams","stocktake","reports","admin"];
const ACTION_MODULE = {
    preview_request_import: "requests", create_request: "requests", update_returned_request: "requests", resubmit_request: "requests", delete_request: "requests", cancel_request: "requests", decide_approval: "approvals", create_po: "purchasing", save_supplier: "supplier_catalog", set_supplier_status: "supplier_catalog", delete_supplier: "supplier_catalog", save_contract_payment: "payments", import_contract_payments: "payments", delete_contract_payment: "payments", save_production_report: "production", approve_production_report: "production", save_construction_daily_log: "construction", approve_construction_daily_log: "construction", delete_construction_daily_log: "construction", save_capital_recovery: "capital_recovery", delete_capital_recovery: "capital_recovery",
    receive_goods: ["receiving","warehouse_receipt"], confirm_delivery: ["receiving","warehouse_receipt"], issue_stock: ["teams","warehouse_issue"], confirm_installation: "teams",
    close_po_line: "purchasing", return_stock: ["teams", "stocktake"], create_stock_count: "stocktake", approve_stock_count: "stocktake",
    save_material: "material_catalog", bulk_material_subcategory_action: "material_catalog", set_material_status: "material_catalog", delete_material: "material_catalog", delete_unused_materials: "material_catalog", delete_selected_materials: "material_catalog", preview_material_dependencies: "material_catalog", reset_material_catalog_test: "material_catalog", merge_material_master: "material_catalog", check_material_alias_conflicts: "material_catalog",
    save_project_contract: "boq", set_project_contract_status: "boq", delete_project_contract: "boq", save_boq_version: "boq", save_boq_item: "boq", set_boq_item_status: "boq", bulk_boq_item_action: "boq", delete_boq_item: "boq", clear_boq_version: "boq", replace_boq_items: "boq", update_boq_contract_prices: "boq", transfer_contract_ownership: "inventory", reconcile_contract_stock: "inventory",
    create_central_return: "central_warehouse", approve_central_return: "central_warehouse", receive_central_return: "central_warehouse",
    create_transfer_order: "inventory", approve_transfer_order: "inventory", ship_transfer_order: "inventory", receive_transfer_order: "inventory",
    create_work_item: ["dept_plan_assign","dept_project_assign"], update_work_item_status: ["dept_plan_tasks","dept_project_tasks","dept_plan_assign","dept_project_assign"], update_work_item_progress: ["dept_plan_tasks","dept_project_tasks"], reassign_work_item: ["dept_plan_assign","dept_project_assign"], mark_task_notification_read: ["dept_plan_tasks","dept_project_tasks"],
    compare_boq_materials: ["material_catalog","boq"], confirm_boq_material_mappings: ["material_catalog","boq"], request_material_master_from_boq: ["material_catalog","boq"],
    save_mar_approval: ["boq","purchasing"], save_material_external_code: "material_catalog", save_material_uom_conversion: "material_catalog", save_warehouse_location: ["inventory","central_warehouse"], reverse_stock_movement: ["inventory","stocktake"], set_project_status: "admin", factory_reset_preview: "admin", factory_reset_execute: "admin", set_organization_unit_member: "site_command", save_material_norm: "material_norms", set_material_norm_status: "material_norms", delete_material_norm: "material_norms", estimate_material_norms: "material_norms", save_payment_plan: "dept_finance_payment_plan", set_payment_plan_status: "dept_finance_payment_plan", delete_payment_plan: "dept_finance_payment_plan", save_advance_request: "dept_finance_advance", settle_advance_request: "dept_finance_advance", delete_advance_request: "dept_finance_advance", save_site_expense_claim: "dept_finance_site_cost", approve_site_expense_claim: "dept_finance_site_cost", delete_site_expense_claim: "dept_finance_site_cost", save_bank_account: "dept_finance_cashbank", save_cashbook_entry: "dept_finance_cashbank", delete_cashbook_entry: "dept_finance_cashbank", save_accounting_voucher: "dept_finance_documents", delete_accounting_voucher: "dept_finance_documents", save_hr_record: "dept_legal_hr", save_labor_contract: "dept_legal_labor", set_labor_contract_status: "dept_legal_labor", delete_labor_contract: "dept_legal_labor", save_correspondence: "dept_legal_correspondence", set_correspondence_status: "dept_legal_correspondence", delete_correspondence: "dept_legal_correspondence", save_legal_document: "dept_legal_documents", set_legal_document_status: "dept_legal_documents", delete_legal_document: "dept_legal_documents", save_seal: "dept_legal_seal", set_seal_status: "dept_legal_seal", delete_seal: "dept_legal_seal", save_benefit_record: "dept_legal_benefits", set_benefit_record_status: "dept_legal_benefits", delete_benefit_record: "dept_legal_benefits",
};
const ACTION_CAPABILITY = {
    preview_request_import: "canCreate", create_request: "canCreate", update_returned_request: "canEdit", resubmit_request: "canEdit", delete_request: "canEdit", cancel_request: "canEdit", decide_approval: "canApprove", create_po: "canCreate", save_supplier: "canEdit", set_supplier_status: "canEdit", delete_supplier: "canEdit", save_contract_payment: "canCreate", import_contract_payments: "canCreate", delete_contract_payment: "canEdit", save_production_report: "canCreate", approve_production_report: "canApprove", save_construction_daily_log: "canCreate", approve_construction_daily_log: "canApprove", delete_construction_daily_log: "canEdit", save_capital_recovery: "canCreate", delete_capital_recovery: "canEdit", close_po_line: "canApprove",
    receive_goods: "canCreate", confirm_delivery: "canApprove", issue_stock: "canCreate", confirm_installation: "canEdit", return_stock: "canCreate",
    create_stock_count: "canCreate", approve_stock_count: "canApprove", save_material: "canEdit", bulk_material_subcategory_action: "canEdit", set_material_status: "canEdit", delete_material: "canEdit", delete_unused_materials: "canEdit", delete_selected_materials: "canEdit", preview_material_dependencies: "canView", reset_material_catalog_test: "canEdit", merge_material_master: "canEdit", check_material_alias_conflicts: "canView",
    save_project_contract: "canEdit", set_project_contract_status: "canEdit", delete_project_contract: "canEdit", save_boq_version: "canEdit", save_boq_item: "canEdit", set_boq_item_status: "canEdit", bulk_boq_item_action: "canEdit", delete_boq_item: "canEdit", clear_boq_version: "canEdit", replace_boq_items: "canEdit", update_boq_contract_prices: "canEdit", transfer_contract_ownership: "canApprove", reconcile_contract_stock: "canApprove",
    create_central_return: "canCreate", approve_central_return: "canApprove", receive_central_return: "canApprove",
    create_transfer_order: "canCreate", approve_transfer_order: "canApprove", ship_transfer_order: "canEdit", receive_transfer_order: "canApprove",
    create_work_item: "canCreate", update_work_item_status: "canEdit", update_work_item_progress: "canEdit", reassign_work_item: "canEdit", mark_task_notification_read: "canView",
    compare_boq_materials: "canUse", confirm_boq_material_mappings: "canApprove", request_material_master_from_boq: "canCreate",
    save_mar_approval: "canApprove", save_material_external_code: "canEdit", save_material_uom_conversion: "canEdit", save_warehouse_location: "canEdit", reverse_stock_movement: "canApprove", set_project_status: "canEdit", factory_reset_preview: "canView", factory_reset_execute: "canEdit", set_organization_unit_member: "canEdit", save_material_norm: "canCreate", set_material_norm_status: "canEdit", delete_material_norm: "canEdit", estimate_material_norms: "canUse", save_payment_plan: "canCreate", set_payment_plan_status: "canEdit", delete_payment_plan: "canEdit", save_advance_request: "canCreate", settle_advance_request: "canApprove", delete_advance_request: "canEdit", save_site_expense_claim: "canCreate", approve_site_expense_claim: "canApprove", delete_site_expense_claim: "canEdit", save_bank_account: "canCreate", save_cashbook_entry: "canCreate", delete_cashbook_entry: "canEdit", save_accounting_voucher: "canCreate", delete_accounting_voucher: "canEdit", save_hr_record: "canCreate", save_labor_contract: "canCreate", set_labor_contract_status: "canEdit", delete_labor_contract: "canEdit", save_correspondence: "canCreate", set_correspondence_status: "canEdit", delete_correspondence: "canEdit", save_legal_document: "canCreate", set_legal_document_status: "canEdit", delete_legal_document: "canEdit", save_seal: "canCreate", set_seal_status: "canEdit", delete_seal: "canEdit", save_benefit_record: "canCreate", set_benefit_record_status: "canEdit", delete_benefit_record: "canEdit",
};
function now() { return new Date().toISOString(); }
function id(prefix) { return `${prefix}_${crypto.randomUUID()}`; }
function clean(value) { return String(value ?? "").trim(); }
function normalizeVietnamDate(value){
    const raw=clean(value);if(!raw)return "";
    if(/^\d+(?:\.\d+)?$/.test(raw)){const serial=Number(raw);if(serial>20000&&serial<80000){const d=new Date(Date.UTC(1899,11,30)+Math.round(serial*86400000));if(Number.isFinite(d.getTime()))return d.toISOString().slice(0,10);}}
    let m=raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);if(m)return `${m[1]}-${m[2].padStart(2,"0")}-${m[3].padStart(2,"0")}`;
    m=raw.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/);if(m)return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;
    return raw;
}
function validIsoDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const d=new Date(`${value}T00:00:00Z`);return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value;}
function canonicalMeCode(value) {
    const raw=clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/đ/gi,"d").toUpperCase().replace(/[^A-Z0-9]+/g,"");
    if(!raw) return "KHAC";
    if(["ELV","DNHE","DIENNHE"].includes(raw)||raw.startsWith("DNHE")||raw.startsWith("ELV")||raw.startsWith("DIENNHE")) return "DNHE";
    if(["DIEN","ELECTRICAL"].includes(raw)||raw.startsWith("DIEN")) return "DIEN";
    if(["CTN","NUOC","CAPTHOATNUOC","PLUMBING"].includes(raw)||raw.startsWith("CTN")) return "CTN";
    if(["HVAC","DIEUHOATHONGGIO"].includes(raw)||raw.startsWith("HVAC")) return "HVAC";
    if(["PCCC","FIRE"].includes(raw)||raw.startsWith("PCCC")) return "PCCC";
    if(raw==="KHAC"||raw==="OTHER") return "KHAC";
    return "KHAC";
}
function passwordPolicyError(value) {
    const password = String(value ?? "");
    if (password.length < 8) return "Mật khẩu phải có ít nhất 8 ký tự.";
    if (!/[A-Z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ hoa.";
    if (!/[a-z]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ thường.";
    if (!/[0-9]/.test(password)) return "Mật khẩu phải có ít nhất 1 chữ số.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Mật khẩu phải có ít nhất 1 ký tự đặc biệt.";
    return "";
}
function numberValue(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}
function strictNonNegativeNumber(value, label = "Giá trị") {
    const raw = clean(value);
    if (!raw) throw new Error(`${label} không được để trống.`);
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${label} không hợp lệ.`);
    return parsed;
}
function normalizeMaterialName(value) { return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/\b(phi|dn|d|ø)\s*(\d+)/g, "d$2").replace(/[^a-z0-9]+/g, " ").trim(); }
function internalGroupCode(value) { const base=normalizeMaterialName(value).replace(/\s+/g,"_").toUpperCase().replace(/[^A-Z0-9_]+/g,"").slice(0,48); return base||"CHUA_PHAN_NHOM"; }
function inferBoqRowRole(row) {
  const explicit=clean(row?.rowRole); if(["section","system","group","heading","description","material","component","subtotal","note"].includes(explicit)) return explicit;
  const name=clean(row?.materialName); const unit=clean(row?.unit); const qtyRaw=clean(row?.contractQty);
  if(!name) return "note";
  if(!unit && !qtyRaw) return "group";
  if(!unit && /^(chi phi|h[eệ] thong|ph[aầ]n |hang muc|h[aạ]ng m[uụ]c|khu v[uự]c|day cap dien trong nha|c[aá]p dien|thoat nuoc|c[aấ]p nuoc)/i.test(normalizeMaterialText(name))) return "group";
  return "material";
}

const REQUIRED_FIELD_FALLBACK = new Map([
    ["request_header:projectId", true], ["request_header:neededAt", true],
    ["request_line:materialName", true], ["request_line:quantity", true],
    ["boq:itemType", true], ["boq:materialName", true],
]);
async function formFieldRows(formKey, includeInactive = false) {
    const where = [formKey ? "form_key=?" : "1=1", includeInactive ? "1=1" : "active=1"].join(" AND ");
    return formKey
      ? await all(`SELECT id,form_key AS formKey,field_key AS fieldKey,display_name AS displayName,data_type AS dataType,source_kind AS sourceKind,visible,required,importable,exportable,editable,sort_order AS sortOrder,options_json AS optionsJson,system_locked AS systemLocked,active FROM form_field_config WHERE ${where} ORDER BY form_key,sort_order,display_name`, formKey)
      : await all(`SELECT id,form_key AS formKey,field_key AS fieldKey,display_name AS displayName,data_type AS dataType,source_kind AS sourceKind,visible,required,importable,exportable,editable,sort_order AS sortOrder,options_json AS optionsJson,system_locked AS systemLocked,active FROM form_field_config WHERE ${where} ORDER BY form_key,sort_order,display_name`);
}
async function isRequiredField(formKey, fieldKey, fallback = false) {
    const row = await first(`SELECT required FROM form_field_config WHERE form_key=? AND field_key=? AND active=1`, formKey, fieldKey);
    if (row) return Number(row.required) === 1;
    return REQUIRED_FIELD_FALLBACK.has(`${formKey}:${fieldKey}`) ? Boolean(REQUIRED_FIELD_FALLBACK.get(`${formKey}:${fieldKey}`)) : fallback;
}
function customFieldsObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return value;
}
function addHours(value, hours) {
    return new Date(new Date(value).getTime() + Math.max(1, hours) * 3600000).toISOString();
}
function emailsFrom(value) {
    return [...new Set(clean(value).split(/[;,\s]+/).map((item) => item.trim().toLowerCase()).filter((item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item)))];
}
function html(value) {
    return clean(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
function jsonError(message, status = 400) {
    return Response.json({ ok: false, error: message }, { status });
}
function getCookie(request, name) {
    const value = request.headers.get("cookie") ?? "";
    const match = value.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
    return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
function requestIp(request) {
    return clean(request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || null;
}
function sessionCookie(token, maxAge = SESSION_HOURS * 3600) {
    return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${env?.COOKIE_SECURE ? "; Secure" : ""}`;
}
function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i += 1)
        bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    return bytes;
}
async function sha256(value) {
    const result = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
    return bytesToHex(new Uint8Array(result));
}
const PASSWORD_PBKDF2_ITERATIONS = 600000;
async function hashPassword(password, saltHex = bytesToHex(crypto.getRandomValues(new Uint8Array(16))), iterations = PASSWORD_PBKDF2_ITERATIONS) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
    const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: hexToBytes(saltHex), iterations }, key, 256);
    return `pbkdf2$${iterations}$${saltHex}$${bytesToHex(new Uint8Array(bits))}`;
}
async function encryptEmailPassword(password) {
    if (!password)
        return null;
    const secret = clean(env.EMAIL_SECRET);
    if (!secret)
        return `plain$${password}`;
    const keyBytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
    const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(password));
    return `aesgcm$${bytesToHex(iv)}$${bytesToHex(new Uint8Array(encrypted))}`;
}
async function verifyPassword(password, stored) {
    const [kind, iterationsText, salt, expected] = String(stored || "").split("$");
    const iterations = Number(iterationsText);
    if (kind !== "pbkdf2" || !Number.isInteger(iterations) || iterations < 210000 || !salt || !expected) return false;
    const actual = await hashPassword(password, salt, iterations);
    return actual === stored;
}
async function first(sql, ...binds) {
    return env.DB.prepare(sql).bind(...binds).first();
}
async function all(sql, ...binds) {
    const result = await env.DB.prepare(sql).bind(...binds).all();
    return result.results ?? [];
}
async function audit(userId, action, entityType, entityId, before, after, request) {
    await env.DB.prepare(`INSERT INTO audit_logs (id,user_id,action,entity_type,entity_id,before_json,after_json,ip_address,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)`)
        .bind(id("AUD"), userId, action, entityType, entityId, before ? JSON.stringify(before) : null, after ? JSON.stringify(after) : null, requestIp(request), now()).run();
}
async function currentUser(request) {
    const email = request.headers.get("oai-authenticated-user-email");
    if (email) {
        const user = await first(`SELECT u.id,u.full_name AS fullName,u.username,u.email,u.role,COALESCE(rc.base_role,u.role) AS roleBase,COALESCE(rc.name,u.role) AS roleName,rc.warehouse_scope_kind AS warehouseScopeKind,u.department,u.avatar_url AS avatarUrl,u.must_change_password AS mustChangePassword FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE lower(u.email)=lower(?) AND u.active=1`, email);
        if (user)
            return user;
    }
    const token = getCookie(request, COOKIE);
    if (!token)
        return null;
    const tokenHash = await sha256(token);
    const user = await first(`SELECT u.id,u.full_name AS fullName,u.username,u.email,u.role,COALESCE(rc.base_role,u.role) AS roleBase,COALESCE(rc.name,u.role) AS roleName,rc.warehouse_scope_kind AS warehouseScopeKind,u.department,u.avatar_url AS avatarUrl,u.must_change_password AS mustChangePassword FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN role_catalog rc ON rc.code=u.role WHERE s.token_hash=? AND s.expires_at>? AND u.active=1`, tokenHash, now());
    if (user) await env.DB.prepare(`UPDATE sessions SET last_seen_at=? WHERE token_hash=?`).bind(now(), tokenHash).run();
    return user;
}
function effectiveRole(user) { return clean(user.roleBase || user.role); }
function canonicalRoleCode(value) { const code=clean(value); return ({engineer:"ksda",commander:"cht",project:"da_nv",procurement:"kh_nv",warehouse:"thu_kho"})[code] || code; }
function organizationLookupKey(value) {
    return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").replace(/\s+/g, " ").toUpperCase();
}
async function resolveOrganizationUnit(value, { includeInactive = false } = {}) {
    const key = clean(value);
    if (!key) return null;
    const direct = await first(`SELECT id,code,name,unit_type AS unitType,parent_id AS parentId,project_id AS projectId,active,archived_at AS archivedAt FROM organization_units WHERE (id=? OR upper(code)=upper(?) OR name=?) ${includeInactive ? "" : "AND active=1 AND archived_at IS NULL"}`, key, key, key);
    if (direct) return direct;
    const rows = await all(`SELECT id,code,name,unit_type AS unitType,parent_id AS parentId,project_id AS projectId,active,archived_at AS archivedAt FROM organization_units ${includeInactive ? "" : "WHERE active=1 AND archived_at IS NULL"}`);
    const normalized = organizationLookupKey(key);
    return rows.find((row) => [row.id, row.code, row.name].some((candidate) => organizationLookupKey(candidate) === normalized)) || null;
}
function organizationCodeForBaseRole(baseRole) {
    return ({ procurement: "KH", project: "DA", accountant: "TCKT", director: "BGD", engineer: "BCH", commander: "BCH", warehouse: "BCH", team: "BCH", admin: "VNTECH" })[clean(baseRole)] || "";
}
function isAdmin(user) { return effectiveRole(user) === "admin" || user.role === "admin"; }
function requireRole(user, roles) {
    if (!roles.includes(effectiveRole(user)) && !isAdmin(user))
        throw new Error("Tài khoản không có quyền thực hiện nghiệp vụ này.");
}
async function canAccessProject(user, projectId, write = false) {
    if (isAdmin(user))
        return true;
    const scope = await first(`SELECT permission FROM user_project_scopes WHERE user_id=? AND project_id=?`, user.id, projectId);
    if (!scope)
        return false;
    return !write || ["write", "approve", "admin"].includes(String(scope.permission));
}
async function canAccessWarehouse(user, warehouseId, write = false) {
    if (isAdmin(user)) return true;
    const warehouse = await first(`SELECT id,type,project_id AS projectId FROM warehouses WHERE id=? AND active=1`, warehouseId);
    if (!warehouse) return false;
    const role = effectiveRole(user);
    if (role === "warehouse") {
        const kind = clean(user.warehouseScopeKind || "site");
        if (kind === "site" && String(warehouse.type) !== "site") return false;
        if (kind === "central" && String(warehouse.type) !== "central") return false;
        const scope = await first(`SELECT permission FROM user_warehouse_scopes WHERE user_id=? AND warehouse_id=?`, user.id, warehouseId);
        if (!scope) return false;
        if (write && !["write","approve","admin"].includes(String(scope.permission))) return false;
        if (String(warehouse.type) === "site") return Boolean(warehouse.projectId) && await canAccessProject(user, String(warehouse.projectId), write);
        return true;
    }
    if (String(warehouse.type) === "central") {
        return await canUseModule(user, "central_warehouse", write ? "canUse" : "canView") || await canUseModule(user, "material_catalog", write ? "canUse" : "canView");
    }
    return Boolean(warehouse.projectId) && await canAccessProject(user, String(warehouse.projectId), write);
}

const TASK_STATUSES = new Set(["NEW","IN_PROGRESS","WAITING_SUPPLIER","WAITING_CLIENT","WAITING_APPROVAL","WAITING_PROJECT","BLOCKED","ON_HOLD","SUBMITTED","REWORK","COMPLETED","CANCELLED"]);
const TASK_WAITING = new Set(["WAITING_SUPPLIER","WAITING_CLIENT","WAITING_APPROVAL","WAITING_PROJECT","BLOCKED","ON_HOLD"]);
function departmentForRole(user){ const base=effectiveRole(user); if(base==="procurement") return "KH"; if(base==="project") return "DA"; return ""; }
function isDepartmentManager(user,department){ if(isAdmin(user)) return true; return department==="KH" ? ["kh_truong"].includes(clean(user.role)) : department==="DA" ? ["da_truong"].includes(clean(user.role)) : false; }
async function userCanReceiveDepartmentTask(userId,department,projectId=""){
  const assignee=await first(`SELECT u.id,u.full_name AS fullName,u.email,u.role,COALESCE(rc.base_role,u.role) AS roleBase,u.active FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE u.id=? AND u.active=1`,userId);
  if(!assignee) return null;
  const expected=department==="KH"?"procurement":department==="DA"?"project":"";
  if(expected && clean(assignee.roleBase)!==expected && clean(assignee.role)!=="admin") return null;
  if(projectId && clean(assignee.role)!=="admin") { const scope=await first(`SELECT 1 AS ok FROM user_project_scopes WHERE user_id=? AND project_id=?`,userId,projectId); if(!scope) return null; }
  return assignee;
}
async function defaultDepartmentAssignee(department,projectId=""){
  const base=department==="KH"?"procurement":"project";
  if(projectId){ const scoped=await first(`SELECT u.id,u.full_name AS fullName,u.email,u.role,COALESCE(rc.base_role,u.role) AS roleBase FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role JOIN user_project_scopes ups ON ups.user_id=u.id AND ups.project_id=? WHERE u.active=1 AND COALESCE(rc.base_role,u.role)=? ORDER BY CASE WHEN u.role IN ('kh_nv','da_nv') THEN 0 ELSE 1 END,u.full_name LIMIT 1`,projectId,base); if(scoped) return scoped; }
  return first(`SELECT u.id,u.full_name AS fullName,u.email,u.role,COALESCE(rc.base_role,u.role) AS roleBase FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE u.active=1 AND COALESCE(rc.base_role,u.role)=? ORDER BY CASE WHEN u.role IN ('kh_nv','da_nv') THEN 0 ELSE 1 END,u.full_name LIMIT 1`,base);
}
async function queueTaskNotice(task,assignee,actor,request){
  const stamp=now(); const title=`Công việc mới: ${clean(task.title)}`; const project=task.projectId?await first(`SELECT code,name FROM projects WHERE id=?`,task.projectId):null;
  const dueText=task.dueAt?new Date(task.dueAt).toLocaleString("vi-VN",{timeZone:"Asia/Ho_Chi_Minh"}):"Chưa đặt hạn";
  const body=`${task.taskNo} · ${project?`${project.code} - ${project.name}`:"Không gắn dự án"} · Hạn: ${dueText}`;
  await env.DB.prepare(`INSERT INTO task_notifications(id,work_item_id,user_id,channel,title,body,status,read_at,sent_at,last_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("NTF"),task.id,assignee.id,"in_app",title,body,"SENT",null,stamp,null,stamp,stamp).run();
  if(assignee.email){ const cfg=await first(`SELECT enabled,base_url AS baseUrl FROM email_settings WHERE id='EMAIL'`); const base=clean(cfg?.baseUrl).replace(/\/$/,"")||new URL(request.url).origin; const link=`${base}/?task=${encodeURIComponent(task.id)}`; const textBody=`Bạn được giao công việc mới.\nMã: ${task.taskNo}\nCông việc: ${task.title}\nDự án: ${project?`${project.code} - ${project.name}`:"—"}\nNgười giao: ${actor.fullName}\nThời điểm giao: ${stamp}\nHạn hoàn thành: ${dueText}\nƯu tiên: ${task.priority}\nMở nhiệm vụ: ${link}${task.sourceNo?`\nChứng từ gốc: ${task.sourceNo}`:""}`; const htmlBody=`<div style="font-family:Arial,sans-serif;max-width:680px;color:#173f58"><h2>${html(task.title)}</h2><p><b>${html(task.taskNo)}</b></p><p>Dự án: ${html(project?`${project.code} - ${project.name}`:"—")}</p><p>Người giao: ${html(actor.fullName)} · Hạn: <b>${html(dueText)}</b></p><p><a href="${html(link)}" style="background:#0b78be;color:white;text-decoration:none;padding:10px 16px;border-radius:6px">Mở nhiệm vụ</a></p></div>`; await env.DB.prepare(`INSERT INTO email_outbox(id,request_id,stage,event,recipients,subject,text_body,html_body,status,attempt_count,next_attempt_at,queued_at,sent_at,last_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MAIL"),null,null,"task_assigned",assignee.email,`[VNTECH ERP] ${task.taskNo} - ${task.title}`,textBody,htmlBody,"queued",0,stamp,stamp,null,null,stamp,stamp).run(); }
}
async function createDepartmentTask({department,workGroup,title,description="",projectId="",sourceModule="",sourceType="",sourceId="",sourceNo="",workStep="",assignedTo="",assignedBy,dueAt="",priority="normal",requiredOutput="",origin="automatic",dedupeKey=""},actor,request){
  const stamp=now(); const key=clean(dedupeKey)||`${department}:${sourceType||"MANUAL"}:${sourceId||crypto.randomUUID()}:${workStep||"GENERAL"}`; const existing=await first(`SELECT id,task_no AS taskNo,status FROM work_items WHERE dedupe_key=?`,key); if(existing) return existing;
  const assignee=assignedTo?await userCanReceiveDepartmentTask(assignedTo,department,projectId):await defaultDepartmentAssignee(department,projectId); if(!assignee) throw new Error(`Chưa có nhân sự ${department==="KH"?"Phòng Kế hoạch":"Phòng Dự án"} phù hợp/phạm vi dự án để giao việc.`);
  const taskId=id("TSK"), seq=await first(`SELECT COUNT(*)+1 AS n FROM work_items WHERE department_code=? AND substr(assigned_at,1,4)=?`,department,stamp.slice(0,4)), taskNo=`NV-${department}-${stamp.slice(0,4)}-${String(numberValue(seq?.n)||1).padStart(5,"0")}`;
  const task={id:taskId,taskNo,title,projectId,dueAt,priority,sourceNo};
  await env.DB.batch([
    env.DB.prepare(`INSERT INTO work_items(id,task_no,department_code,work_group,title,description,project_id,source_module,source_type,source_id,source_no,work_step,dedupe_key,task_origin,assigned_to,assigned_by,assigned_at,due_at,priority,status,progress,required_output,waiting_reason,waiting_started_at,submitted_at,completed_at,completed_by,cancelled_at,cancelled_by,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(taskId,taskNo,department,workGroup,title,description||null,projectId||null,sourceModule||null,sourceType||null,sourceId||null,sourceNo||null,workStep||"GENERAL",key,origin,assignee.id,assignedBy||actor.id,stamp,dueAt||null,priority,"NEW",0,requiredOutput||null,null,null,null,null,null,null,null,1,stamp,stamp),
    env.DB.prepare(`INSERT INTO work_item_events(id,work_item_id,event_type,from_status,to_status,actor_user_id,previous_assignee,new_assignee,reason,detail_json,occurred_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("EVT"),taskId,"ASSIGNED",null,"NEW",actor.id,null,assignee.id,null,JSON.stringify({assignedAt:stamp,dueAt:dueAt||null,sourceType,sourceId,workStep}),stamp,stamp)
  ]);
  await queueTaskNotice(task,assignee,actor,request); return task;
}
async function closeSourceTask(sourceType,sourceId,workStep,actor,request,status="COMPLETED"){
  const task=await first(`SELECT id,status FROM work_items WHERE source_type=? AND source_id=? AND work_step=? AND active=1`,sourceType,sourceId,workStep); if(!task||["COMPLETED","CANCELLED"].includes(clean(task.status))) return;
  const stamp=now(); await env.DB.batch([env.DB.prepare(`UPDATE work_items SET status=?,progress=?,completed_at=?,completed_by=?,active=CASE WHEN ?='CANCELLED' THEN 0 ELSE active END,updated_at=? WHERE id=?`).bind(status,status==="COMPLETED"?100:0,status==="COMPLETED"?stamp:null,status==="COMPLETED"?actor.id:null,status,stamp,task.id),env.DB.prepare(`INSERT INTO work_item_events(id,work_item_id,event_type,from_status,to_status,actor_user_id,previous_assignee,new_assignee,reason,detail_json,occurred_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("EVT"),task.id,"SOURCE_SYNC",task.status,status,actor.id,null,null,"Đồng bộ từ chứng từ gốc",null,stamp,stamp)]);
}
async function stockBalance(warehouseId, materialId) {
    const row = await first(`SELECT COALESCE(SUM(CASE WHEN to_warehouse_id=? THEN quantity ELSE 0 END)-SUM(CASE WHEN from_warehouse_id=? THEN quantity ELSE 0 END),0) AS balance FROM stock_movements WHERE material_id=?`, warehouseId, warehouseId, materialId);
    return numberValue(row?.balance);
}
async function reservedBalance(warehouseId, materialId, excludeRequestId = "") {
    const row = excludeRequestId
      ? await first(`SELECT COALESCE(SUM(quantity),0) AS qty FROM stock_reservations WHERE warehouse_id=? AND material_id=? AND status='active' AND COALESCE(request_id,'')<>?`, warehouseId, materialId, excludeRequestId)
      : await first(`SELECT COALESCE(SUM(quantity),0) AS qty FROM stock_reservations WHERE warehouse_id=? AND material_id=? AND status='active'`, warehouseId, materialId);
    return numberValue(row?.qty);
}
async function defaultContractForProject(projectId) {
    const pid=clean(projectId);
    let contract=await first(`SELECT id,project_id AS projectId,contract_no AS contractNo,contract_name AS contractName,status,is_primary AS isPrimary FROM project_contracts WHERE project_id=? AND status='active' ORDER BY is_primary DESC,created_at,id LIMIT 1`, pid);
    if(contract||!pid) return contract;
    // Upgrade compatibility: projects created after migration still receive one primary Contract lazily.
    const project=await first(`SELECT id,code,name,contract_no AS contractNo,contract_name AS contractName FROM projects WHERE id=?`,pid);
    if(!project) return null;
    const stamp=now(),contractNo=clean(project.contractNo)||`${clean(project.code)||pid}-HD01`,contractName=clean(project.contractName)||`Hợp đồng chính - ${clean(project.name)||clean(project.code)||pid}`;
    await env.DB.prepare(`INSERT OR IGNORE INTO project_contracts(id,project_id,contract_no,contract_name,contract_type,status,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(`PCON_LEGACY_${pid}`,pid,contractNo,contractName,'main','active',1,stamp,stamp).run();
    contract=await first(`SELECT id,project_id AS projectId,contract_no AS contractNo,contract_name AS contractName,status,is_primary AS isPrimary FROM project_contracts WHERE project_id=? AND status='active' ORDER BY is_primary DESC,created_at,id LIMIT 1`,pid);
    return contract;
}
async function resolveContractContext(projectId, requestedContractId = "", requestedBoqVersionId = "", { requireVersion = false } = {}) {
    const pid=clean(projectId); if(!pid) throw new Error("Thiếu dự án.");
    let contract=null; const cid=clean(requestedContractId);
    if(cid) contract=await first(`SELECT id,project_id AS projectId,contract_no AS contractNo,contract_name AS contractName,status,is_primary AS isPrimary FROM project_contracts WHERE id=? AND project_id=?`,cid,pid);
    else contract=await defaultContractForProject(pid);
    if(!contract||clean(contract.status)!=='active') throw new Error("Hợp đồng không tồn tại/đã ngừng áp dụng trong dự án này.");
    let version=null; const vid=clean(requestedBoqVersionId);
    if(vid) version=await first(`SELECT id,project_id AS projectId,contract_id AS contractId,version_no AS versionNo,version_code AS versionCode,version_name AS versionName,status,active FROM boq_versions WHERE id=? AND project_id=? AND contract_id=?`,vid,pid,contract.id);
    else version=await first(`SELECT id,project_id AS projectId,contract_id AS contractId,version_no AS versionNo,version_code AS versionCode,version_name AS versionName,status,active FROM boq_versions WHERE project_id=? AND contract_id=? AND active=1 ORDER BY version_no DESC LIMIT 1`,pid,contract.id);
    if(requireVersion&&!version) throw new Error("Hợp đồng chưa có phiên bản BOQ. Hãy tạo/import BOQ trước.");
    return {contract,version};
}
async function contractBalance(projectId, contractId, warehouseId, materialId) {
    const pid=clean(projectId),cid=clean(contractId),wid=clean(warehouseId),mid=clean(materialId);
    let row=await first(`SELECT COUNT(*) AS rows,COALESCE(SUM(quantity_delta),0) AS balance FROM contract_stock_ledger WHERE project_id=? AND warehouse_id=? AND material_id=?`,pid,wid,mid);
    // Upgrade compatibility: if legacy physical stock appears after migration without ownership rows,
    // assign the opening balance once to the project's primary/default Contract. Migration 0041 performs the
    // same backfill for existing production movements; this guard prevents old integrations/tests becoming orphan stock.
    if(Number(row?.rows||0)===0){const physical=await stockBalance(wid,mid);const primary=await defaultContractForProject(pid);if(physical>0&&primary&&clean(primary.id)===cid){const stamp=now();await contractLedgerStatement({projectId:pid,contractId:cid,warehouseId:wid,materialId:mid,movementType:"OPENING_LEGACY",quantityDelta:physical,occurredAt:stamp,referenceType:"legacy_balance_bootstrap",referenceId:`${wid}:${mid}`,actorUserId:null,note:"Legacy physical stock ownership bootstrap"}).run();}}
    row=await first(`SELECT COALESCE(SUM(quantity_delta),0) AS balance FROM contract_stock_ledger WHERE project_id=? AND contract_id=? AND warehouse_id=? AND material_id=?`,pid,cid,wid,mid);
    return numberValue(row?.balance);
}
async function resolveOwnershipContract(projectId, warehouseId, materialId, requestedContractId = "") {
    const pid=clean(projectId),wid=clean(warehouseId),mid=clean(materialId),requested=clean(requestedContractId);
    if(requested){const c=await first(`SELECT id,project_id AS projectId,status FROM project_contracts WHERE id=? AND project_id=?`,requested,pid);if(!c||clean(c.status)!=='active')throw new Error("Contract ownership không hợp lệ/đã ngừng áp dụng.");return c;}
    const owners=await all(`SELECT c.id,c.project_id AS projectId,c.contract_no AS contractNo,SUM(l.quantity_delta) AS balance FROM contract_stock_ledger l JOIN project_contracts c ON c.id=l.contract_id WHERE l.project_id=? AND l.warehouse_id=? AND l.material_id=? GROUP BY c.id,c.project_id,c.contract_no HAVING SUM(l.quantity_delta)>0.000001 ORDER BY SUM(l.quantity_delta) DESC`,pid,wid,mid);
    if(owners.length===1)return owners[0];if(owners.length>1)throw new Error("Vật tư tại kho đang thuộc nhiều Contract. Phải chọn Contract nguồn để tránh xuất/hoàn trả sai sở hữu.");const fallback=await defaultContractForProject(pid);if(!fallback)throw new Error("Dự án chưa có Contract ownership hợp lệ.");return fallback;
}
function contractLedgerStatement({projectId,contractId,warehouseId,materialId,movementType,quantityDelta,occurredAt,referenceType,referenceId,referenceItemId=null,counterpartyContractId=null,actorUserId,note=null}) {
    return env.DB.prepare(`INSERT INTO contract_stock_ledger(id,project_id,contract_id,warehouse_id,material_id,movement_type,quantity_delta,occurred_at,reference_type,reference_id,reference_item_id,counterparty_contract_id,actor_user_id,note,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("CSL"),clean(projectId),clean(contractId),clean(warehouseId),clean(materialId),clean(movementType),numberValue(quantityDelta),clean(occurredAt)||now(),clean(referenceType),clean(referenceId),clean(referenceItemId)||null,clean(counterpartyContractId)||null,clean(actorUserId)||null,clean(note)||null,now());
}
async function materialDependencySummary(materialId) {
    const mid=clean(materialId); const specs=[
      ["boq","project_boq_items","material_id"],["boqSource","boq_source_items","mapped_material_id"],["boqComponents","boq_material_components","material_id"],["mr","material_request_items","material_id"],["stock","stock_movements","material_id"],["issue","stock_issue_items","material_id"],["return","material_return_items","material_id"],["centralReturn","central_return_items","material_id"],["transfer","transfer_order_items","material_id"],["reservation","stock_reservations","material_id"],["stockCount","stock_count_items","material_id"],["mar","material_mar_approvals","material_id"],["mappingHistory","material_mapping_history","material_id"],["mappingAuditOld","boq_mapping_audit","old_material_id"],["mappingAuditNew","boq_mapping_audit","new_material_id"],["contractLedger","contract_stock_ledger","material_id"],["procurementAllocation","procurement_allocations","material_id"],["ownershipTransfer","contract_ownership_transfers","material_id"],["reconciliation","contract_stock_reconciliations","material_id"]
    ]; const detail={}; let total=0; for(const [key,table,column] of specs){const row=await first(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column}=?`,mid);const count=Number(row?.count||0);detail[key]=count;total+=count;} return {materialId:mid,total,detail,canHardDelete:total===0};
}

async function boqItemDependencySummary(boqItemId) {
    const bid=clean(boqItemId); if(!bid) return {boqItemId:"",total:0,detail:{},canHardDelete:true};
    const specs=[
      ["materialRequests","material_request_items","boq_item_id"],
      ["purchaseOrders","purchase_order_items","boq_item_id"],
      ["receipts","goods_receipt_items","boq_item_id"],
      ["allocations","procurement_allocations","boq_item_id"],
      ["priceHistory","boq_price_import_items","boq_item_id"]
    ];
    const detail={};let total=0;for(const [key,table,column] of specs){const row=await first(`SELECT COUNT(*) AS count FROM ${table} WHERE ${column}=?`,bid);const count=Number(row?.count||0);detail[key]=count;total+=count;}
    return {boqItemId:bid,total,detail,canHardDelete:total===0};
}
async function boqVersionDependencySummary(projectId,contractId,boqVersionId){
    const pid=clean(projectId),cid=clean(contractId),vid=clean(boqVersionId);const specs=[
      ["materialRequests","material_request_items"],["purchaseOrders","purchase_order_items"],["receipts","goods_receipt_items"],["allocations","procurement_allocations"]
    ];const detail={};let total=0;for(const [key,table] of specs){const row=await first(`SELECT COUNT(*) AS count FROM ${table} WHERE contract_id=? AND boq_version_id=?`,cid,vid);const count=Number(row?.count||0);detail[key]=count;total+=count;}
    const source=await first(`SELECT COUNT(*) AS count FROM boq_source_items WHERE project_id=? AND contract_id=? AND boq_version_id=? AND active=1`,pid,cid,vid);const operational=await first(`SELECT COUNT(*) AS count FROM project_boq_items WHERE project_id=? AND contract_id=? AND boq_version_id=? AND active=1`,pid,cid,vid);detail.sourceRows=Number(source?.count||0);detail.operationalRows=Number(operational?.count||0);
    return {projectId:pid,contractId:cid,boqVersionId:vid,total,detail,canReplaceOrPurge:total===0};
}
async function logBoqChange({projectId,contractId=null,boqVersionId=null,sourceItemId=null,projectBoqItemId=null,actionType,before=null,after=null,reason=null,actorUserId=null}){
    await env.DB.prepare(`INSERT INTO boq_change_history(id,project_id,contract_id,boq_version_id,source_item_id,project_boq_item_id,action_type,before_json,after_json,reason,actor_user_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("BQCH"),clean(projectId),clean(contractId)||null,clean(boqVersionId)||null,clean(sourceItemId)||null,clean(projectBoqItemId)||null,clean(actionType),before?JSON.stringify(before):null,after?JSON.stringify(after):null,clean(reason)||null,clean(actorUserId)||null,now()).run();
}
async function ensureBoqBatch(projectId,contractId,version,userId,sourceFileName="manual"){
    let batch=await first(`SELECT id,version_no AS versionNo FROM boq_import_batches WHERE project_id=? AND contract_id=? AND boq_version_id=? ORDER BY created_at DESC LIMIT 1`,projectId,contractId,version.id);
    if(batch)return batch;
    const stamp=now(),batchId=id("BOQB");await env.DB.prepare(`INSERT INTO boq_import_batches(id,project_id,contract_id,boq_version_id,version_no,source_file_name,active,row_count,imported_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(batchId,projectId,contractId,version.id,Number(version.versionNo||1),clean(sourceFileName)||"manual",Number(version.active||0)===1?1:0,0,userId,stamp,stamp).run();return{id:batchId,versionNo:Number(version.versionNo||1)};
}

async function materialFromGovernedCode({materialId="", internalCode="", contractCode="", approvedCode="", supplierCode="", ownerKey=""}={}) {
    if (clean(materialId)) {
      const row=await first(`SELECT id,code,name,unit,requires_cocq AS requiresCocq,requires_mar AS requiresMar FROM materials WHERE id=? AND active=1`,clean(materialId));
      if(row) return row;
    }
    if (clean(internalCode)) {
      const row=await first(`SELECT id,code,name,unit,requires_cocq AS requiresCocq,requires_mar AS requiresMar FROM materials WHERE upper(code)=upper(?) AND active=1`,clean(internalCode));
      if(row) return row;
    }
    for (const [type,code] of [["MAR",approvedCode],["CONTRACT",contractCode],["SUPPLIER",supplierCode]]) {
      if(!clean(code)) continue;
      const row=await first(`SELECT m.id,m.code,m.name,m.unit,m.requires_cocq AS requiresCocq,m.requires_mar AS requiresMar FROM material_external_codes x JOIN materials m ON m.id=x.material_id WHERE x.active=1 AND m.active=1 AND x.code_type=? AND upper(x.external_code)=upper(?) AND (x.owner_key='' OR x.owner_key=?) ORDER BY CASE WHEN x.owner_key=? THEN 0 ELSE 1 END LIMIT 1`,type,clean(code),clean(ownerKey),clean(ownerKey));
      if(row) return row;
    }
    return null;
}
const COMPANY_LEADERSHIP_ROLE_CODES = new Set(["director","tgd","ptgd","giam_doc","pho_giam_doc","thuky","thu_ky_tgd"]);
// Q2 (18/09/2026) — NGƯỜI DÙNG QUYẾT: "giữ Java, sửa JS" cho lớp lệch `isCompanyLeadership` (TASK-024).
// Java có **HAI** khái niệm "Ban lãnh đạo" KHÁC NHAU, JS trước đây chỉ có MỘT ⇒ lệch CẢ HAI CHIỀU:
//   • `RbacService.isCompanyLeadership` = `List.of("director","accountant")` → dùng cho CỔNG QUYỀN HÀNH ĐỘNG
//     (`requireActionModule` bỏ qua kiểm module) ⇒ Java cấp THỪA cho `accountant`, cấp THIẾU cho
//     `thuky`/`tgd`/`giam_doc`/`hcpc_truong` (base_role='director').
//   • `BootstrapDataAdapter.isCompanyLeadership` = **7 mã vai trò** + `base_role='director'` → dùng cho BỘ LỌC
//     DỮ LIỆU BOOTSTRAP (đã port khớp JS từ TASK-050).
// Nay JS phản chiếu ĐÚNG cả hai: cổng quyền dùng tập {director, accountant}; bộ lọc bootstrap giữ tập cũ.
// Bằng chứng: `tools/probe-task024-leadership-parity.mjs` (đối chiếu 3 tệp nguồn + in tài khoản ĐỔI quyền).
const COMPANY_LEADERSHIP_ACTION_CODES = new Set(["director","accountant"]);
function isCompanyLeadershipActionGate(user){ return COMPANY_LEADERSHIP_ACTION_CODES.has(clean(user?.role).toLowerCase()); }
// [WF] PHASE 8 (18/09) — CẢNH BÁO PHÊ DUYỆT: người dùng quyết **CHỈ CẢNH BÁO, KHÔNG chặn cứng**.
// Vì sao trả MẢNG thay vì ném lỗi: hành vi nghiệp vụ phải GIỮ NGUYÊN như hiện tại (đang chạy thật), còn việc
// "đã qua phê duyệt hay chưa" là thông tin để người dùng biết. MỌI lỗi tra cứu đều bị bắt ⇒ không thể làm hỏng nghiệp vụ.
async function approvalWarnings(entityType, entityId) {
  const type = clean(entityType), id = clean(entityId);
  if (!type || !id) return [];
  try {
    const row = await first(`SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END),0) AS approved FROM approvals WHERE entity_type=? AND entity_id=?`, type, id);
    const total = Number(row?.total || 0), approved = Number(row?.approved || 0);
    if (!total) return [`${type} ${id}: chưa có bản ghi phê duyệt nào (quy trình động chưa khởi tạo) — vẫn cho phép theo chế độ CHỈ CẢNH BÁO.`];
    if (approved < total) return [`${type} ${id}: còn ${total - approved}/${total} bước CHƯA duyệt — vẫn cho phép theo chế độ CHỈ CẢNH BÁO.`];
    return [];
  } catch { return []; }
}
function isCompanyLeadership(user){ return !isAdmin(user) && (COMPANY_LEADERSHIP_ROLE_CODES.has(clean(user?.role).toLowerCase()) || effectiveRole(user)==="director"); }
function departmentCodeForUser(user){ const dep=clean(user?.department).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase(); const role=clean(user?.role).toLowerCase(); const base=effectiveRole(user); if(dep.includes("ke hoach")||dep==="kh"||base==="procurement") return "KH"; if(dep.includes("du an")||dep==="da"||base==="project") return "DA"; if(dep.includes("tai chinh")||dep.includes("ke toan")||dep==="tckt"||base==="accountant") return "TCKT"; if(dep.includes("hanh chinh")||dep.includes("phap che")||dep==="hcpc"||role==="thuky"||role==="thu_ky_tgd") return "HCPC"; if(dep.includes("ban chi huy")||dep==="bch"||["commander","engineer","warehouse"].includes(base)) return "BCH"; return ""; }
function isDepartmentApprover(user,department){ const role=clean(user?.role).toLowerCase(); return department==="KH"?role==="kh_truong":department==="DA"?role==="da_truong":false; }

function splitBulkList(value){return clean(value).split(/[;,|\n]+/).map((item)=>clean(item)).filter(Boolean);}
function parseBulkPermissionSpec(value){const rows=[];for(const token of clean(value).split(/;/).map((item)=>clean(item)).filter(Boolean)){const [rawKey,rawRights="view,use,create,edit,approve,export"]=token.split(":",2);const moduleKey=clean(rawKey);if(!MODULE_KEYS.includes(moduleKey)||moduleKey==="admin")throw new Error(`Mã module quyền không hợp lệ: ${moduleKey}`);const rights=new Set(clean(rawRights).toLowerCase().split(/[,|+]/).map((item)=>clean(item)).filter(Boolean));const valid=new Set(["view","use","create","edit","approve","export"]);for(const right of rights)if(!valid.has(right))throw new Error(`Quyền ${right} của ${moduleKey} không hợp lệ.`);rows.push({moduleKey,canView:rights.has("view")?1:0,canUse:rights.has("use")?1:0,canCreate:rights.has("create")?1:0,canEdit:rights.has("edit")?1:0,canApprove:rights.has("approve")?1:0,canExport:rights.has("export")?1:0});}return rows;}
function normalizeBulkStatus(value){const status=clean(value||"ACTIVE").toUpperCase();if(["ACTIVE","DANG HOAT DONG","ĐANG HOẠT ĐỘNG","1","TRUE"].includes(status))return 1;if(["LOCKED","INACTIVE","DA KHOA","ĐÃ KHÓA","0","FALSE"].includes(status))return 0;throw new Error(`Trạng thái tài khoản không hợp lệ: ${value}`);}

function defaultDepartmentPermission(user,moduleKey){
    if(moduleKey==="dashboard") return {canView:1,canUse:1,canCreate:0,canEdit:0,canApprove:0,canExport:1};
    if(isCompanyLeadershipActionGate(user) && moduleKey!=="admin") return {canView:1,canUse:1,canCreate:1,canEdit:1,canApprove:1,canExport:1};
    const dep=departmentCodeForUser(user); let matches=false;
    if(dep==="KH") matches=moduleKey.startsWith("dept_plan_")||moduleKey==="supplier_catalog";
    else if(dep==="DA") matches=moduleKey.startsWith("dept_project_");
    else if(dep==="TCKT") matches=moduleKey.startsWith("dept_finance_");
    else if(dep==="HCPC") matches=moduleKey.startsWith("dept_legal_");
    else if(dep==="BCH") matches=moduleKey==="site_command";
    if(!matches) return {canView:0,canUse:0,canCreate:0,canEdit:0,canApprove:0,canExport:0};
    if(dep==="BCH") return {canView:1,canUse:1,canCreate:0,canEdit:0,canApprove:0,canExport:1};
    return {canView:1,canUse:1,canCreate:1,canEdit:1,canApprove:isDepartmentApprover(user,dep)?1:0,canExport:1};
}
async function replaceDepartmentDefaults(userId){
    const target=await first(`SELECT u.id,u.role,u.department,COALESCE(rc.base_role,u.role) AS roleBase FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE u.id=?`,userId); if(!target)return;
    await env.DB.prepare(`DELETE FROM user_module_permissions WHERE user_id=? AND permission_source='department_default'`).bind(userId).run();
    if(isAdmin(target)) return;
    const stamp=now(); const rows=await all(`SELECT module_key AS moduleKey FROM module_catalog WHERE active=1 AND module_key<>'admin' ORDER BY sort_order,module_key`); const statements=[];
    for(const row of rows){const moduleKey=clean(row.moduleKey);const caps=defaultDepartmentPermission(target,moduleKey);if(!Object.values(caps).some(Number))continue;statements.push(env.DB.prepare(`INSERT OR IGNORE INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("UMP"),userId,moduleKey,caps.canView,caps.canUse,caps.canCreate,caps.canEdit,caps.canApprove,caps.canExport,null,"department_default",stamp,stamp));}
    if(statements.length) await env.DB.batch(statements);
}
async function canUseModule(user, moduleKey, capability = "canUse") {
    if (isAdmin(user)) return true;
    if (isCompanyLeadershipActionGate(user) && moduleKey!=="admin") return true;
    const columns = { canView: "can_view", canUse: "can_use", canCreate: "can_create", canEdit: "can_edit", canApprove: "can_approve", canExport: "can_export" };
    const column = columns[capability] || columns.canUse;
    const row = await first(`SELECT ump.${column} AS allowed FROM user_module_permissions ump JOIN module_catalog mc ON mc.module_key=ump.module_key AND mc.active=1 LEFT JOIN menu_group_catalog mg ON mg.group_key=mc.group_key WHERE ump.user_id=? AND ump.module_key=? AND (ump.permission_expires_at IS NULL OR ump.permission_expires_at>?) AND (mc.group_key IS NULL OR mg.active=1)`, user.id, moduleKey, now());
    return Number(row?.allowed || 0) === 1;
}
async function requireActionModule(user, action) {
    const required = ACTION_MODULE[action];
    if (!required || isAdmin(user))
        return;
    const keys = Array.isArray(required) ? required : [required];
    const capability = ACTION_CAPABILITY[action] || "canUse";
    for (const key of keys)
        if (await canUseModule(user, key, capability))
            return;
    throw new Error("Tài khoản chưa được quản trị viên cấp đúng quyền cho thao tác này.");
}
async function approvalStages(activeOnly = true) {
    const where = activeOnly ? "WHERE active=1" : "";
    return all(`SELECT stage_no AS stageNo,name,description,allowed_role_codes AS allowedRoleCodes,approval_mode AS approvalMode,sla_hours AS slaHours,auto_approve_on_submit AS autoApproveOnSubmit,active,sort_order AS sortOrder FROM approval_stage_catalog ${where} ORDER BY stage_no`);
}
async function workflowAssignment(projectId, stageNo) {
    return first(`SELECT apa.project_id AS projectId,apa.stage,apa.owner_user_id AS ownerUserId,apa.cc_emails AS ccEmails,u.full_name AS ownerName,u.email AS ownerEmail,u.role AS ownerRole,u.active AS ownerActive FROM approval_project_assignments apa JOIN users u ON u.id=apa.owner_user_id WHERE apa.project_id=? AND apa.stage=? AND apa.active=1`, projectId, stageNo);
}
async function requireWorkflowAssignment(projectId, stage) {
    const assignment = await workflowAssignment(projectId, Number(stage.stageNo));
    if (!assignment || Number(assignment.ownerActive||0)!==1) throw new Error(`Dự án chưa được phân công 01 Owner hợp lệ cho Bước ${stage.stageNo} – ${stage.name}. Quản trị viên cần cấu hình “Phân công xử lý theo dự án”.`);
    const allowed = stageRoleCodes(stage);
    const ownerBase = await first(`SELECT u.role,COALESCE(rc.base_role,u.role) AS baseRole FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE u.id=?`, assignment.ownerUserId);
    if (allowed.length && !allowed.includes(clean(ownerBase?.role)) && !allowed.includes(clean(ownerBase?.baseRole))) throw new Error(`Owner ${assignment.ownerName} không thuộc vai trò được phép của Bước ${stage.stageNo} – ${stage.name}.`);
    const scoped = await first(`SELECT 1 AS ok FROM user_project_scopes WHERE user_id=? AND project_id=? AND permission IN ('read','write','approve','admin') LIMIT 1`, assignment.ownerUserId, projectId);
    const ownerAdmin = clean(ownerBase?.role)==='admin';
    if (!scoped && !ownerAdmin) throw new Error(`Owner ${assignment.ownerName} chưa được phân quyền dự án này.`);
    return assignment;
}
function stageRoleCodes(stage) { return clean(stage.allowedRoleCodes).split(",").map((v) => v.trim()).filter(Boolean); }
async function canApproveStage(user, stageNo) {
    if (isAdmin(user))
        return true;
    const stage = await first(`SELECT stage_no AS stageNo,name,description,allowed_role_codes AS allowedRoleCodes,approval_mode AS approvalMode,sla_hours AS slaHours,auto_approve_on_submit AS autoApproveOnSubmit,active,sort_order AS sortOrder FROM approval_stage_catalog WHERE stage_no=?`, stageNo);
    if (!stage)
        return false;
    const allowed = stageRoleCodes(stage);
    return allowed.includes(user.role) || allowed.includes(effectiveRole(user));
}
async function canApproveRequestStage(user, requestId, stageNo) {
    const stage = await first(`SELECT a.approver_user_id AS ownerUserId,COALESCE(NULLIF(a.allowed_role_codes_snapshot,''),cfg.allowed_role_codes,'') AS allowedRoleCodes,COALESCE(NULLIF(a.approval_mode_snapshot,''),cfg.approval_mode,'single') AS approvalMode FROM approvals a LEFT JOIN approval_stage_catalog cfg ON cfg.stage_no=a.stage WHERE a.request_id=? AND a.stage=?`, requestId, stageNo);
    if (!stage || !clean(stage.ownerUserId) || clean(stage.ownerUserId)!==clean(user.id)) return false;
    const allowed = stageRoleCodes(stage);
    return allowed.includes(user.role) || allowed.includes(effectiveRole(user));
}
function matchedApprovalRole(user, stage) {
    const allowed = stageRoleCodes(stage);
    if (allowed.includes(user.role)) return user.role;
    const base = effectiveRole(user);
    if (allowed.includes(base)) return base;
    return '';
}
async function supplySlaHours() {
    const row = await first(`SELECT po_sla_hours AS po,bch_confirmation_sla_hours AS bch FROM company_settings WHERE id='SETTINGS'`);
    return { po: Math.max(1, numberValue(row?.po) || 24), bch: Math.max(1, numberValue(row?.bch) || 8) };
}
function etaDeadline(value) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T23:59:59+07:00`).toISOString() : value;
}
async function approvalEmailStatement(context, stage, event, dueAt, request) {
    const targetStage = event === "approval_requested" ? stage : 101;
    const owner = await workflowAssignment(context.projectId, targetStage);
    const configured = await first(`SELECT emails FROM approval_email_recipients WHERE project_id=? AND stage=? AND active=1`, context.projectId, targetStage);
    const recipients = event === "approval_requested" ? emailsFrom(owner?.ownerEmail) : [];
    recipients.push(...emailsFrom(owner?.ccEmails), ...emailsFrom(configured?.emails));
    if (event !== "approval_requested" && context.requesterEmail)
        recipients.push(...emailsFrom(context.requesterEmail));
    const uniqueRecipients = [...new Set(recipients)];
    if (!uniqueRecipients.length)
        return null;
    const emailConfig = await first(`SELECT base_url AS baseUrl FROM email_settings WHERE id='EMAIL'`);
    const baseUrl = clean(emailConfig?.baseUrl).replace(/\/$/, "") || new URL(request.url).origin;
    const link = `${baseUrl}/?request=${encodeURIComponent(context.requestId)}`;
    const stageConfig = stage > 0 && stage < 100 ? await first(`SELECT name FROM approval_stage_catalog WHERE stage_no=?`, stage) : null;
    const department = stageConfig?.name || (stage === 101 ? "Mua hàng" : "Bộ phận xử lý");
    const eventTitle = event === "approval_requested" ? `Chờ duyệt bước ${stage} – ${department}` : event === "approved" ? "Đã hoàn tất luồng phê duyệt" : `Bị từ chối tại bước ${stage}`;
    const subject = event === "approval_requested" ? `[DNMH] ${context.requestNo} chờ ${department} duyệt` : event === "approved" ? `[DNMH] ${context.requestNo} đã hoàn tất phê duyệt` : `[DNMH] ${context.requestNo} bị từ chối`;
    const deadline = dueAt ? new Date(dueAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }) : "—";
    const textBody = `${eventTitle}\nPhiếu: ${context.requestNo}\nDự án: ${context.projectCode} - ${context.projectName}\nNgười đề nghị: ${context.requesterName}\nNgày cần: ${context.neededAt}\nKhu vực: ${context.area}\nSố dòng: ${context.itemCount}\nHạn xử lý: ${deadline}\nMở phiếu: ${link}`;
    const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:680px;color:#173f58"><div style="background:#0b78be;color:white;padding:16px 20px"><b>VNTECH ERP</b><div style="font-size:18px;margin-top:6px">${html(eventTitle)}</div></div><div style="border:1px solid #d9e4ea;padding:20px"><h2 style="margin:0 0 14px">${html(context.requestNo)}</h2><table style="width:100%;border-collapse:collapse"><tr><td style="padding:7px 0;color:#6b8190">Dự án</td><td><b>${html(context.projectCode)} · ${html(context.projectName)}</b></td></tr><tr><td style="padding:7px 0;color:#6b8190">Người đề nghị</td><td>${html(context.requesterName)}</td></tr><tr><td style="padding:7px 0;color:#6b8190">Ngày cần</td><td>${html(context.neededAt)}</td></tr><tr><td style="padding:7px 0;color:#6b8190">Khu vực</td><td>${html(context.area)}</td></tr><tr><td style="padding:7px 0;color:#6b8190">Số dòng / Giá trị</td><td>${context.itemCount} dòng · ${new Intl.NumberFormat("vi-VN").format(context.total)} đ</td></tr>${dueAt ? `<tr><td style="padding:7px 0;color:#6b8190">Hạn xử lý</td><td style="color:#b26d00"><b>${html(deadline)}</b></td></tr>` : ""}</table><p style="margin:20px 0 0"><a href="${html(link)}" style="background:#0b78be;color:white;text-decoration:none;padding:10px 16px;border-radius:6px">Mở phiếu trong phần mềm</a></p></div></div>`;
    const stamp = now();
    return env.DB.prepare(`INSERT INTO email_outbox (id,request_id,stage,event,recipients,subject,text_body,html_body,status,attempt_count,next_attempt_at,queued_at,sent_at,last_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MAIL"), context.requestId, stage || null, event, uniqueRecipients.join(","), subject, textBody, htmlBody, "queued", 0, stamp, stamp, null, null, stamp, stamp);
}
async function supplyEmailStatement(context, recipientStage, event, title, detail, request, includeRequester = false) {
    const owner = await workflowAssignment(context.projectId, recipientStage);
    const configured = await first(`SELECT emails FROM approval_email_recipients WHERE project_id=? AND stage=? AND active=1`, context.projectId, recipientStage);
    const recipients = emailsFrom(owner?.ownerEmail);
    recipients.push(...emailsFrom(owner?.ccEmails), ...emailsFrom(configured?.emails));
    if (includeRequester && context.requesterEmail)
        recipients.push(...emailsFrom(context.requesterEmail));
    const uniqueRecipients = [...new Set(recipients)];
    if (!uniqueRecipients.length)
        return null;
    const emailConfig = await first(`SELECT base_url AS baseUrl FROM email_settings WHERE id='EMAIL'`);
    const baseUrl = clean(emailConfig?.baseUrl).replace(/\/$/, "") || new URL(request.url).origin;
    const link = `${baseUrl}/?request=${encodeURIComponent(context.requestId)}`;
    const reference = context.receiptNo || context.poNo || context.requestNo;
    const subject = `[CUNG ỨNG] ${reference} – ${title}`;
    const eta = context.eta ? `\nNgày giao dự kiến: ${context.eta}` : "";
    const textBody = `${title}\nPhiếu: ${context.requestNo}\nPO: ${context.poNo || "—"}\nChuyến giao: ${context.receiptNo || "—"}\nDự án: ${context.projectCode} - ${context.projectName}${eta}\n${detail}\nMở hồ sơ: ${link}`;
    const htmlBody = `<div style="font-family:Arial,sans-serif;max-width:680px;color:#173f58"><div style="background:#0b78be;color:white;padding:16px 20px"><b>VNTECH ERP</b><div style="font-size:18px;margin-top:6px">${html(title)}</div></div><div style="border:1px solid #d9e4ea;padding:20px"><h2 style="margin:0 0 14px">${html(reference)}</h2><p><b>Phiếu nguồn:</b> ${html(context.requestNo)}</p><p><b>Dự án:</b> ${html(context.projectCode)} · ${html(context.projectName)}</p>${context.eta ? `<p><b>Ngày giao dự kiến:</b> ${html(context.eta)}</p>` : ""}<p>${html(detail)}</p><p style="margin:20px 0 0"><a href="${html(link)}" style="background:#0b78be;color:white;text-decoration:none;padding:10px 16px;border-radius:6px">Mở hồ sơ trong phần mềm</a></p></div></div>`;
    const stamp = now();
    return env.DB.prepare(`INSERT INTO email_outbox (id,request_id,stage,event,recipients,subject,text_body,html_body,status,attempt_count,next_attempt_at,queued_at,sent_at,last_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MAIL"), context.requestId, recipientStage, event, uniqueRecipients.join(","), subject, textBody, htmlBody, "queued", 0, stamp, stamp, null, null, stamp, stamp);
}
async function createSession(userId, request) {
    const token = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const expires = new Date(Date.now() + SESSION_HOURS * 3600000).toISOString();
    const stamp = now();
    await env.DB.prepare(`INSERT INTO sessions (id,user_id,token_hash,expires_at,ip_address,user_agent,last_seen_at,created_at) VALUES (?,?,?,?,?,?,?,?)`)
        .bind(id("SES"), userId, await sha256(token), expires, requestIp(request), request.headers.get("user-agent"), stamp, stamp).run();
    return token;
}
async function seedMasters(adminId, companyName) {
    const stamp = now();
    const statements = [
        env.DB.prepare(`INSERT INTO company_settings (id,company_name,updated_by,created_at,updated_at) VALUES (?,?,?,?,?)`).bind("SETTINGS", companyName, adminId, stamp, stamp),
        env.DB.prepare(`INSERT OR IGNORE INTO email_settings (id,enabled,smtp_port,security,sender_name,updated_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`).bind("EMAIL", 0, 587, "starttls", "VNTECH ERP", adminId, stamp, stamp),
        env.DB.prepare(`INSERT OR IGNORE INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind("WH-CENTRAL", "KHO-TONG", "Kho trung tâm", "central", null, null, adminId, 1, stamp, stamp),
    ];
    await env.DB.batch(statements);
}
async function bootstrap(user) {
    const projects = await all(`SELECT id,code,name,status,contract_no AS contractNo,contract_name AS contractName,start_date AS startDate,planned_end_date AS plannedEndDate FROM projects WHERE status='active' ORDER BY code`);
    const scopes = isAdmin(user) ? projects.map((project) => project.id) : (await all(`SELECT project_id AS id FROM user_project_scopes WHERE user_id=?`, user.id)).map((row) => row.id);
    const allowed = new Set(scopes.map(String));
    const visibleProjects = isAdmin(user) ? projects : projects.filter((project) => allowed.has(String(project.id)));
    const projectIds = visibleProjects.map((project) => String(project.id));
    const projectAccessAll = isAdmin(user);
    const where = projectIds.length ? ` WHERE mr.project_id IN (${projectIds.map(() => "?").join(",")})` : " WHERE 1=0";
    const requests = await all(`SELECT mr.id,mr.request_no AS requestNo,mr.project_id AS projectId,p.code AS projectCode,p.name AS projectName,mr.contract_id AS contractId,pc.contract_no AS contractNo,mr.boq_version_id AS boqVersionId,bv.version_code AS boqVersionCode,mr.team_id AS teamId,t.name AS teamName,u.full_name AS requestedBy,mr.requested_at AS requestedAt,mr.needed_at AS neededAt,mr.priority,mr.area,mr.purpose,mr.status,mr.supply_status AS supplyStatus,mr.approval_stage AS approvalStage,mr.total_estimated_value AS totalEstimatedValue,COALESCE(ri.item_count,0) AS itemCount,COALESCE(ri.total_qty,0) AS totalQty,COALESCE(ri.received_qty,0) AS receivedQty,COALESCE(ri.issued_qty,0) AS issuedQty FROM material_requests mr JOIN projects p ON p.id=mr.project_id LEFT JOIN project_contracts pc ON pc.id=mr.contract_id LEFT JOIN boq_versions bv ON bv.id=mr.boq_version_id LEFT JOIN teams t ON t.id=mr.team_id JOIN users u ON u.id=mr.requested_by LEFT JOIN (SELECT request_id,COUNT(*) AS item_count,COALESCE(SUM(requested_qty),0) AS total_qty,COALESCE(SUM(received_qty),0) AS received_qty,COALESCE(SUM(issued_qty),0) AS issued_qty FROM material_request_items GROUP BY request_id) ri ON ri.request_id=mr.id${where} ORDER BY mr.requested_at DESC LIMIT 500`, ...projectIds);
    const requestIds = requests.map((row) => String(row.id));
    let approvalRows = [];
    let itemRows = [];
    let supplyStepRows = [];
    if (requestIds.length) {
        const placeholders = requestIds.map(() => "?").join(",");
        approvalRows = await all(`SELECT a.request_id AS requestId,a.stage,a.department,a.status,a.approver_user_id AS approverUserId,u.full_name AS approverName,a.queued_at AS queuedAt,a.due_at AS dueAt,a.notified_at AS notifiedAt,a.reminder_sent_at AS reminderSentAt,a.decided_at AS decidedAt,a.comment,COALESCE(NULLIF(a.allowed_role_codes_snapshot,''),cfg.allowed_role_codes,'') AS allowedRoleCodes,COALESCE(NULLIF(a.approval_mode_snapshot,''),cfg.approval_mode,'single') AS approvalMode,CASE WHEN COALESCE(NULLIF(a.approval_mode_snapshot,''),cfg.approval_mode,'single')='all_roles' THEN (SELECT COUNT(*) FROM approval_stage_decisions d WHERE d.request_id=a.request_id AND d.stage=a.stage AND d.decision='approved') WHEN a.status='approved' THEN 1 ELSE 0 END AS jointApprovedCount FROM approvals a LEFT JOIN users u ON u.id=a.approver_user_id LEFT JOIN approval_stage_catalog cfg ON cfg.stage_no=a.stage WHERE a.request_id IN (${placeholders}) ORDER BY a.stage`, ...requestIds);
        itemRows = await all(`SELECT mri.id,mri.request_id AS requestId,mri.line_no AS lineNo,mri.boq_item_id AS boqItemId,COALESCE(m.code,'[MẤT MÃ]') AS materialCode,COALESCE(m.name,'Vật tư không còn trong Danh mục vật tư gốc') AS materialName,COALESCE(m.unit,'') AS unit,m.brand AS manufacturer,mri.material_id AS materialId,mri.work_package_code AS workPackageCode,mri.boq_code AS boqCode,mri.installation_area AS installationArea,mri.contract_line_no AS contractLineNo,mri.origin,mri.approved_supplier AS approvedSupplier,mri.note,mri.requested_qty AS requestedQty,mri.estimated_unit_price AS unitPrice,mri.stock_allocation_qty AS stockAllocationQty,mri.approved_purchase_qty AS approvedPurchaseQty,mri.ordered_qty AS orderedQty,mri.delivered_qty AS actualDeliveredQty,CASE WHEN mri.delivered_qty>mri.received_qty THEN mri.delivered_qty-mri.received_qty ELSE 0 END AS pendingBchQty,mri.received_qty AS receivedQty,mri.closed_qty AS closedQty,mri.close_reason AS closeReason,CASE WHEN mri.approved_purchase_qty>mri.received_qty+mri.closed_qty THEN mri.approved_purchase_qty-mri.received_qty-mri.closed_qty ELSE 0 END AS remainingQty,mri.issued_qty AS issuedQty,mri.installed_qty AS installedQty,mri.line_status AS lineStatus,(SELECT COALESCE(SUM(gri.rejected_qty),0) FROM goods_receipt_items gri JOIN purchase_order_items poi2 ON poi2.id=gri.purchase_order_item_id WHERE poi2.request_item_id=mri.id) AS rejectedQty,(SELECT COUNT(DISTINCT poi3.purchase_order_id) FROM purchase_order_items poi3 WHERE poi3.request_item_id=mri.id) AS linkedPoCount,(SELECT COUNT(DISTINCT gri2.receipt_id) FROM goods_receipt_items gri2 JOIN purchase_order_items poi4 ON poi4.id=gri2.purchase_order_item_id WHERE poi4.request_item_id=mri.id) AS linkedReceiptCount,(SELECT COUNT(*) FROM goods_receipts gr2 JOIN purchase_order_items poi5 ON poi5.purchase_order_id=gr2.purchase_order_id WHERE poi5.request_item_id=mri.id AND gr2.bch_confirmation_status='confirmed' AND (gr2.certificate_status='missing' OR gr2.delivery_document_status='missing')) AS missingDocumentCount FROM material_request_items mri LEFT JOIN materials m ON m.id=mri.material_id WHERE mri.request_id IN (${placeholders}) ORDER BY mri.request_id,mri.line_no`, ...requestIds);
        supplyStepRows = await all(`SELECT sws.id,sws.request_id AS requestId,sws.purchase_order_id AS purchaseOrderId,sws.receipt_id AS receiptId,sws.step,sws.status,sws.queued_at AS queuedAt,sws.due_at AS dueAt,sws.completed_at AS completedAt,sws.completed_by AS completedBy,u.full_name AS completedByName,sws.comment FROM supply_workflow_steps sws LEFT JOIN users u ON u.id=sws.completed_by WHERE sws.request_id IN (${placeholders}) ORDER BY sws.queued_at,sws.created_at`, ...requestIds);
        if (itemRows.length) {
            const itemIds = itemRows.map((row) => String(row.id));
            const customPlaceholders = itemIds.map(() => "?").join(",");
            const customRows = await all(`SELECT entity_id AS entityId,field_key AS fieldKey,value_text AS valueText FROM custom_field_values WHERE form_key='request_line' AND entity_id IN (${customPlaceholders})`, ...itemIds);
            const customByItem = customRows.reduce((acc,row)=>{ const key=String(row.entityId); (acc[key] ??= {})[String(row.fieldKey)] = String(row.valueText ?? ""); return acc; },{});
            itemRows = itemRows.map((row)=>({ ...row, customFields: customByItem[String(row.id)] || {} }));
        }
    }
    const approvalsByRequest = approvalRows.reduce((grouped, row) => { const key = String(row.requestId); (grouped[key] ??= []).push(row); return grouped; }, {});
    const itemsByRequest = itemRows.reduce((grouped, row) => { const key = String(row.requestId); (grouped[key] ??= []).push(row); return grouped; }, {});
    const supplyStepsByRequest = supplyStepRows.reduce((grouped, row) => { const key = String(row.requestId); (grouped[key] ??= []).push(row); return grouped; }, {});
    const enrichedRequests = requests.map((row) => ({ ...row, approvals: approvalsByRequest[String(row.id)] ?? [], items: itemsByRequest[String(row.id)] ?? [], supplySteps: supplyStepsByRequest[String(row.id)] ?? [] }));
    const projectWhere = projectIds.length ? `WHERE w.project_id IN (${projectIds.map(() => "?").join(",")})` : "WHERE 1=0";
    const teams = await all(`SELECT t.id,t.code,t.name,t.trade,t.project_id AS projectId,t.warehouse_id AS warehouseId FROM teams t WHERE t.project_id IN (${projectIds.map(() => "?").join(",") || "NULL"}) AND t.active=1 ORDER BY t.code`, ...projectIds);
    let warehouses = projectIds.length
        ? await all(`SELECT id,code,name,type,project_id AS projectId,parent_warehouse_id AS parentWarehouseId FROM warehouses WHERE active=1 AND (project_id IS NULL OR project_id IN (${projectIds.map(() => "?").join(",")})) ORDER BY code`, ...projectIds)
        : await all(`SELECT id,code,name,type,project_id AS projectId,parent_warehouse_id AS parentWarehouseId FROM warehouses WHERE active=1 AND project_id IS NULL ORDER BY code`);
    if (effectiveRole(user) === "warehouse" && !isAdmin(user)) {
        const warehouseScopes = await all(`SELECT warehouse_id AS warehouseId,permission FROM user_warehouse_scopes WHERE user_id=?`, user.id);
        const scopedIds = new Set(warehouseScopes.map((row)=>String(row.warehouseId)));
        const kind = clean(user.warehouseScopeKind || "site");
        warehouses = warehouses.filter((row)=>scopedIds.has(String(row.id)) && (kind === "central" ? String(row.type) === "central" : String(row.type) === "site"));
    }
    const transferWarehouses = await all(`SELECT w.id,w.code,w.name,w.type,w.project_id AS projectId,p.code AS projectCode,p.name AS projectName FROM warehouses w LEFT JOIN projects p ON p.id=w.project_id WHERE w.active=1 AND w.type<>'transit' ORDER BY CASE WHEN w.type='central' THEN 0 ELSE 1 END,COALESCE(p.code,''),w.code`);
    const materialCategories = await all(`SELECT id,code,name,description,sort_order AS sortOrder,active FROM material_categories WHERE active=1 ORDER BY sort_order,name`);
    const materialSubcategories = await all(`SELECT ms.id,ms.category_id AS categoryId,ms.code,ms.name,ms.description,ms.scope_examples AS scopeExamples,ms.review_status AS reviewStatus,ms.adjustment_note AS adjustmentNote,ms.sort_order AS sortOrder,ms.active,mc.code AS categoryCode,mc.name AS categoryName FROM material_subcategories ms JOIN material_categories mc ON mc.id=ms.category_id WHERE ms.active=1 AND mc.active=1 ORDER BY mc.sort_order,ms.sort_order,ms.name`);
    let materials = await all(`SELECT m.id,m.code,m.name,m.system,m.category_id AS categoryId,mc.code AS categoryCode,mc.name AS categoryName,m.subcategory_id AS subcategoryId,ms.code AS subcategoryCode,ms.name AS subcategoryName,m.specification,m.brand,m.unit,m.standard_price AS standardPrice,m.min_stock AS minStock,m.requires_cocq AS requiresCocq,m.requires_mar AS requiresMar FROM materials m LEFT JOIN material_categories mc ON mc.id=m.category_id LEFT JOIN material_subcategories ms ON ms.id=m.subcategory_id WHERE m.active=1 AND (m.category_id IS NULL OR mc.active=1) AND (m.subcategory_id IS NULL OR ms.active=1) ORDER BY COALESCE(mc.sort_order,999),COALESCE(ms.sort_order,9999),m.code`);
    const materialAliases=await all(`SELECT id,material_id AS materialId,alias_name AS aliasName,normalized_name AS normalizedName,verified,active FROM material_aliases WHERE active=1 ORDER BY alias_name`); const aliasesByMaterial=materialAliases.reduce((grouped,row)=>{const key=String(row.materialId);(grouped[key]??=[]).push(row);return grouped;},{}); materials=materials.map((row)=>({...row,aliases:aliasesByMaterial[String(row.id)]||[],aliasText:(aliasesByMaterial[String(row.id)]||[]).map((alias)=>alias.aliasName).join("; ")}));
    const suppliers = await all(`SELECT id,code,name,tax_code AS taxCode,contact_name AS contactName,phone,lead_time_days AS leadTimeDays,rating,active FROM suppliers WHERE active=1 ORDER BY code`);
    const adminSuppliers = isAdmin(user) ? await all(`SELECT id,code,name,tax_code AS taxCode,contact_name AS contactName,phone,lead_time_days AS leadTimeDays,rating,active FROM suppliers ORDER BY CASE WHEN active=1 THEN 0 ELSE 1 END,code`) : suppliers;
    let inventory = projectIds.length ? await all(`WITH movements AS (SELECT sm.material_id AS material_id,sm.to_warehouse_id AS warehouse_id,sm.quantity AS qty FROM stock_movements sm WHERE sm.to_warehouse_id IS NOT NULL UNION ALL SELECT sm.material_id,sm.from_warehouse_id,-sm.quantity FROM stock_movements sm WHERE sm.from_warehouse_id IS NOT NULL), balances AS (SELECT material_id,warehouse_id,COALESCE(SUM(qty),0) AS balance FROM movements GROUP BY material_id,warehouse_id), reservations AS (SELECT material_id,warehouse_id,COALESCE(SUM(quantity),0) AS reserved FROM stock_reservations WHERE status='active' GROUP BY material_id,warehouse_id) SELECT p.id AS projectId,p.code AS projectCode,p.name AS projectName,w.id AS warehouseId,w.code AS warehouseCode,w.name AS warehouseName,w.type,m.id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,m.min_stock AS minStock,COALESCE(mv.balance,0) AS balance,COALESCE(r.reserved,0) AS reserved,CASE WHEN COALESCE(mv.balance,0)-COALESCE(r.reserved,0)>0 THEN COALESCE(mv.balance,0)-COALESCE(r.reserved,0) ELSE 0 END AS available FROM projects p JOIN warehouses w ON w.active=1 AND w.project_id=p.id AND w.type='site' CROSS JOIN materials m LEFT JOIN balances mv ON mv.warehouse_id=w.id AND mv.material_id=m.id LEFT JOIN reservations r ON r.warehouse_id=w.id AND r.material_id=m.id WHERE p.id IN (${projectIds.map(() => "?").join(",")}) AND (COALESCE(mv.balance,0)<>0 OR COALESCE(r.reserved,0)<>0 OR w.type='site') ORDER BY p.code,w.code,m.code`, ...projectIds) : [];
    if (effectiveRole(user) === "warehouse" && !isAdmin(user)) { const allowedWarehouseIds=new Set(warehouses.map((row)=>String(row.id))); inventory=inventory.filter((row)=>allowedWarehouseIds.has(String(row.warehouseId))); }
    let purchaseOrders = await all(`SELECT po.id,po.po_no AS poNo,po.request_id AS requestId,mr.request_no AS requestNo,po.project_id AS projectId,p.code AS projectCode,s.name AS supplierName,po.receiving_warehouse_id AS receivingWarehouseId,po.ordered_at AS orderedAt,po.eta,po.delivery_queued_at AS deliveryQueuedAt,po.delivery_completed_at AS deliveryCompletedAt,po.status,po.total_value AS totalValue,COALESCE(poa.item_count,0) AS itemCount,COALESCE(poa.ordered_qty,0) AS orderedQty,COALESCE(poa.received_qty,0) AS receivedQty,COALESCE(gra.actual_delivered_qty,0) AS actualDeliveredQty,COALESCE(cert.certificate_count,0) AS certificateCount,COALESCE(atta.attachment_count,0) AS attachmentCount FROM purchase_orders po JOIN projects p ON p.id=po.project_id JOIN suppliers s ON s.id=po.supplier_id LEFT JOIN material_requests mr ON mr.id=po.request_id LEFT JOIN (SELECT purchase_order_id,COUNT(*) AS item_count,COALESCE(SUM(ordered_qty),0) AS ordered_qty,COALESCE(SUM(received_qty),0) AS received_qty FROM purchase_order_items GROUP BY purchase_order_id) poa ON poa.purchase_order_id=po.id LEFT JOIN (SELECT actual_poi.purchase_order_id,COALESCE(SUM(gri.received_qty),0) AS actual_delivered_qty FROM goods_receipt_items gri JOIN purchase_order_items actual_poi ON actual_poi.id=gri.purchase_order_item_id GROUP BY actual_poi.purchase_order_id) gra ON gra.purchase_order_id=po.id LEFT JOIN (SELECT gr2.purchase_order_id AS po_id,COUNT(*) AS certificate_count FROM goods_receipts gr2 WHERE gr2.certificate_status='complete' GROUP BY gr2.purchase_order_id) cert ON cert.po_id=po.id LEFT JOIN (SELECT gr3.purchase_order_id AS po_id,COUNT(att2.id) AS attachment_count FROM goods_receipts gr3 JOIN attachments att2 ON att2.entity_type='goods_receipt' AND att2.entity_id=gr3.id GROUP BY gr3.purchase_order_id) atta ON atta.po_id=po.id WHERE po.project_id IN (${projectIds.map(() => "?").join(",") || "NULL"}) ORDER BY po.ordered_at DESC LIMIT 300`, ...projectIds);
    const purchaseOrderIds = purchaseOrders.map((row) => String(row.id));
    if (purchaseOrderIds.length) {
        const placeholders = purchaseOrderIds.map(() => "?").join(",");
        const poItemRows = await all(`SELECT poi.id,poi.purchase_order_id AS purchaseOrderId,poi.request_item_id AS requestItemId,poi.line_no AS lineNo,poi.system_code AS systemCode,poi.planned_delivery_at AS plannedDeliveryAt,poi.ordered_qty AS orderedQty,poi.delivered_qty AS actualDeliveredQty,CASE WHEN poi.delivered_qty>poi.received_qty THEN poi.delivered_qty-poi.received_qty ELSE 0 END AS pendingBchQty,poi.received_qty AS receivedQty,poi.closed_qty AS closedQty,poi.close_reason AS closeReason,CASE WHEN poi.ordered_qty>poi.received_qty+poi.closed_qty THEN poi.ordered_qty-poi.received_qty-poi.closed_qty ELSE 0 END AS remainingQty,poi.unit_price AS unitPrice,poi.status,mri.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit FROM purchase_order_items poi JOIN material_request_items mri ON mri.id=poi.request_item_id JOIN materials m ON m.id=mri.material_id WHERE poi.purchase_order_id IN (${placeholders}) ORDER BY poi.purchase_order_id,poi.line_no`, ...purchaseOrderIds);
        const itemsByPo = poItemRows.reduce((grouped, row) => { const key = String(row.purchaseOrderId); (grouped[key] ??= []).push(row); return grouped; }, {});
        purchaseOrders = purchaseOrders.map((row) => ({ ...row, items: itemsByPo[String(row.id)] ?? [] }));
    }
    let receipts = await all(`SELECT gr.id,gr.receipt_no AS receiptNo,gr.purchase_order_id AS purchaseOrderId,po.request_id AS requestId,po.po_no AS poNo,p.id AS projectId,p.code AS projectCode,s.name AS supplierName,w.name AS warehouseName,gr.received_at AS receivedAt,gr.delivery_note_no AS deliveryNoteNo,gr.qc_status AS qcStatus,gr.document_status AS documentStatus,gr.certificate_status AS certificateStatus,gr.delivery_document_status AS deliveryDocumentStatus,gr.bch_confirmation_status AS bchConfirmationStatus,gr.bch_confirmed_at AS bchConfirmedAt,gr.bch_comment AS bchComment,confirmer.full_name AS bchConfirmedByName,gr.posting_status AS postingStatus,COALESCE(gra.item_count,0) AS itemCount,COALESCE(gra.actual_delivered_qty,0) AS actualDeliveredQty,COALESCE(gra.accepted_qty,0) AS acceptedQty,COALESCE(gra.rejected_qty,0) AS rejectedQty,COALESCE(atta.attachment_count,0) AS attachmentCount,CASE WHEN gr.certificate_status='complete' THEN 1 ELSE 0 END AS certificateCount FROM goods_receipts gr JOIN purchase_orders po ON po.id=gr.purchase_order_id JOIN projects p ON p.id=po.project_id JOIN suppliers s ON s.id=po.supplier_id JOIN warehouses w ON w.id=gr.warehouse_id LEFT JOIN users confirmer ON confirmer.id=gr.bch_confirmed_by LEFT JOIN (SELECT receipt_id,COUNT(*) AS item_count,COALESCE(SUM(received_qty),0) AS actual_delivered_qty,COALESCE(SUM(accepted_qty),0) AS accepted_qty,COALESCE(SUM(rejected_qty),0) AS rejected_qty FROM goods_receipt_items GROUP BY receipt_id) gra ON gra.receipt_id=gr.id LEFT JOIN (SELECT entity_id,COUNT(*) AS attachment_count FROM attachments WHERE entity_type='goods_receipt' GROUP BY entity_id) atta ON atta.entity_id=gr.id WHERE po.project_id IN (${projectIds.map(() => "?").join(",") || "NULL"}) ORDER BY gr.received_at DESC LIMIT 300`, ...projectIds);
    const receiptIds = receipts.map((row) => String(row.id));
    if (receiptIds.length) {
        const placeholders = receiptIds.map(() => "?").join(",");
        const receiptItemRows = await all(`SELECT gri.id,gri.receipt_id AS receiptId,gri.purchase_order_item_id AS purchaseOrderItemId,poi.ordered_qty AS orderedQty,gri.received_qty AS actualQty,gri.accepted_qty AS acceptedQty,gri.rejected_qty AS rejectedQty,gri.lot_no AS lotNo,gri.qc_result AS qcResult,m.code AS materialCode,m.name AS materialName,m.unit FROM goods_receipt_items gri JOIN purchase_order_items poi ON poi.id=gri.purchase_order_item_id JOIN material_request_items mri ON mri.id=poi.request_item_id JOIN materials m ON m.id=mri.material_id WHERE gri.receipt_id IN (${placeholders}) ORDER BY gri.receipt_id,poi.line_no`, ...receiptIds);
        const itemsByReceipt = receiptItemRows.reduce((grouped, row) => { const key = String(row.receiptId); (grouped[key] ??= []).push(row); return grouped; }, {});
        receipts = receipts.map((row) => ({ ...row, items: itemsByReceipt[String(row.id)] ?? [] }));
    }
    let issues = await all(`SELECT si.id,si.issue_no AS issueNo,si.project_id AS projectId,si.team_id AS teamId,p.code AS projectCode,t.name AS teamName,si.issued_at AS issuedAt,si.status,si.received_by_name AS receivedByName,COALESCE(sia.item_count,0) AS itemCount,COALESCE(sia.total_qty,0) AS totalQty,COALESCE(sia.installed_qty,0) AS installedQty FROM stock_issues si JOIN projects p ON p.id=si.project_id JOIN teams t ON t.id=si.team_id LEFT JOIN (SELECT issue_id,COUNT(*) AS item_count,COALESCE(SUM(quantity),0) AS total_qty,COALESCE(SUM(installed_qty),0) AS installed_qty FROM stock_issue_items GROUP BY issue_id) sia ON sia.issue_id=si.id WHERE si.project_id IN (${projectIds.map(() => "?").join(",") || "NULL"}) ORDER BY si.issued_at DESC LIMIT 200`, ...projectIds);
    const issueIds = issues.map((row) => String(row.id));
    if (issueIds.length) {
        const placeholders = issueIds.map(() => "?").join(",");
        const issueItemRows = await all(`SELECT sii.id,sii.issue_id AS issueId,sii.material_id AS materialId,sii.request_item_id AS requestItemId,m.code AS materialCode,m.name AS materialName,m.unit,sii.quantity,sii.installed_qty AS installedQty,sii.work_package_code AS workPackageCode,sii.installation_area AS installationArea FROM stock_issue_items sii JOIN materials m ON m.id=sii.material_id WHERE sii.issue_id IN (${placeholders}) ORDER BY sii.issue_id,sii.id`, ...issueIds);
        const itemsByIssue = issueItemRows.reduce((grouped, row) => { const key = String(row.issueId); (grouped[key] ??= []).push(row); return grouped; }, {});
        issues = issues.map((row) => ({ ...row, items: itemsByIssue[String(row.id)] ?? [] }));
    }
    const returns = await all(`SELECT mr.id,mr.return_no AS returnNo,mr.project_id AS projectId,mr.team_id AS teamId,p.code AS projectCode,t.name AS teamName,mr.returned_at AS returnedAt,mr.status,mr.returned_by_name AS returnedByName,COALESCE(mra.item_count,0) AS itemCount,COALESCE(mra.accepted_qty,0) AS acceptedQty FROM material_returns mr JOIN projects p ON p.id=mr.project_id JOIN teams t ON t.id=mr.team_id LEFT JOIN (SELECT return_id,COUNT(*) AS item_count,COALESCE(SUM(accepted_qty),0) AS accepted_qty FROM material_return_items GROUP BY return_id) mra ON mra.return_id=mr.id WHERE mr.project_id IN (${projectIds.map(() => "?").join(",") || "NULL"}) ORDER BY mr.returned_at DESC LIMIT 200`, ...projectIds);
    let centralReturns=await all(`SELECT cr.id,cr.return_no AS returnNo,cr.source_project_id AS sourceProjectId,p.code AS projectCode,p.name AS projectName,cr.source_warehouse_id AS sourceWarehouseId,sw.name AS sourceWarehouseName,cr.central_warehouse_id AS centralWarehouseId,cr.requested_at AS requestedAt,cr.approved_at AS approvedAt,cr.received_at AS receivedAt,cr.status,cr.note,u.full_name AS requestedBy,COALESCE(a.item_count,0) AS itemCount,COALESCE(a.proposed_qty,0) AS proposedQty,COALESCE(a.accepted_qty,0) AS acceptedQty,COALESCE(a.rejected_qty,0) AS rejectedQty,COALESCE(att.attachment_count,0) AS attachmentCount FROM central_returns cr JOIN projects p ON p.id=cr.source_project_id JOIN warehouses sw ON sw.id=cr.source_warehouse_id JOIN users u ON u.id=cr.requested_by LEFT JOIN (SELECT central_return_id,COUNT(*) AS item_count,SUM(proposed_qty) AS proposed_qty,SUM(accepted_qty) AS accepted_qty,SUM(rejected_qty) AS rejected_qty FROM central_return_items GROUP BY central_return_id) a ON a.central_return_id=cr.id LEFT JOIN (SELECT entity_id,COUNT(*) AS attachment_count FROM attachments WHERE entity_type='central_return' GROUP BY entity_id) att ON att.entity_id=cr.id WHERE cr.source_project_id IN (${projectIds.map(()=>"?").join(",")||"NULL"}) ORDER BY cr.requested_at DESC LIMIT 300`,...projectIds); if(centralReturns.length){const ids=centralReturns.map((row)=>String(row.id));const placeholders=ids.map(()=>"?").join(",");const rows=await all(`SELECT cri.id,cri.central_return_id AS centralReturnId,cri.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,cri.proposed_qty AS proposedQty,cri.counted_qty AS countedQty,cri.accepted_qty AS acceptedQty,cri.rejected_qty AS rejectedQty,cri.condition_status AS conditionStatus,cri.unit_cost AS unitCost,cri.rejection_reason AS rejectionReason FROM central_return_items cri JOIN materials m ON m.id=cri.material_id WHERE cri.central_return_id IN (${placeholders}) ORDER BY cri.central_return_id,m.code`,...ids);const byReturn=rows.reduce((grouped,row)=>{const key=String(row.centralReturnId);(grouped[key]??=[]).push(row);return grouped;},{});centralReturns=centralReturns.map((row)=>({...row,items:byReturn[String(row.id)]||[]}));}
    let centralInventory=(await all(`WITH movements AS (SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE to_warehouse_id='WH-CENTRAL' UNION ALL SELECT material_id,from_warehouse_id AS warehouse_id,-quantity FROM stock_movements WHERE from_warehouse_id='WH-CENTRAL'),balances AS (SELECT material_id,COALESCE(SUM(qty),0) AS balance FROM movements GROUP BY material_id) SELECT m.id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,m.system,m.min_stock AS minStock,COALESCE(b.balance,0) AS balance FROM materials m LEFT JOIN balances b ON b.material_id=m.id WHERE m.active=1 AND COALESCE(b.balance,0)<>0 ORDER BY m.code`)).map((row)=>({...row,aliasText:(aliasesByMaterial[String(row.materialId)]||[]).map((alias)=>alias.aliasName).join("; ")}));
    if (effectiveRole(user) === "warehouse" && clean(user.warehouseScopeKind || "site") === "site") { centralInventory = []; centralReturns = []; }
    const stockCounts = await all(`SELECT sc.id,sc.count_no AS countNo,sc.project_id AS projectId,p.code AS projectCode,sc.warehouse_id AS warehouseId,w.name AS warehouseName,sc.count_type AS countType,sc.counted_at AS countedAt,sc.status,COALESCE(sca.item_count,0) AS itemCount,COALESCE(sca.total_variance,0) AS totalVariance FROM stock_counts sc JOIN projects p ON p.id=sc.project_id JOIN warehouses w ON w.id=sc.warehouse_id LEFT JOIN (SELECT stock_count_id,COUNT(*) AS item_count,COALESCE(SUM(ABS(variance_qty)),0) AS total_variance FROM stock_count_items GROUP BY stock_count_id) sca ON sca.stock_count_id=sc.id WHERE sc.project_id IN (${projectIds.map(() => "?").join(",") || "NULL"}) ORDER BY sc.counted_at DESC LIMIT 200`, ...projectIds);
    const boqItems = projectIds.length ? await all(`SELECT pbi.id,pbi.project_id AS projectId,pbi.contract_id AS contractId,pbi.boq_version_id AS boqVersionId,p.code AS projectCode,p.name AS projectName,pbi.line_no AS lineNo,pbi.source_order AS sourceOrder,pbi.contract_line_ref AS contractLineRef,pbi.row_role AS rowRole,pbi.parent_source_order AS parentSourceOrder,pbi.outline_level AS outlineLevel,pbi.source_sheet AS sourceSheet,pbi.source_row AS sourceRow,pbi.boq_code AS boqCode,pbi.contract_code AS contractCode,pbi.contract_material_code AS contractMaterialCode,pbi.approved_material_code AS approvedMaterialCode,pbi.material_id AS materialId,m.code AS materialCode,COALESCE(bsi.contract_material_name,pbi.description) AS materialName,COALESCE(bsi.contract_material_name,pbi.description) AS contractMaterialName,m.name AS standardMaterialName,COALESCE(bsi.unit,m.unit) AS unit,COALESCE(NULLIF(bsi.source_system_code,''),m.system,'KHAC') AS systemCode,bsi.source_subgroup_name AS subgroupName,mc.name AS categoryName,pbi.description,pbi.item_type AS itemType,bsi.id AS sourceItemId,COALESCE(bsi.mapping_status,'legacy_mapped') AS mappingStatus,pbi.contract_qty AS contractQty,pbi.remeasured_qty AS remeasuredQty,pbi.unit_price AS unitPrice,pbi.variation_status AS variationStatus,pbi.variation_ref AS variationRef,pbi.variation_approved_at AS variationApprovedAt,pbi.note,
    COALESCE((SELECT SUM(mri.requested_qty) FROM material_request_items mri JOIN material_requests mr2 ON mr2.id=mri.request_id WHERE mr2.project_id=pbi.project_id AND mr2.contract_id=pbi.contract_id AND mr2.status<>'cancelled' AND (mri.boq_item_id=pbi.id OR (mri.boq_item_id IS NULL AND mri.material_id=pbi.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(pbi.boq_code,'')=COALESCE(mri.boq_code,'')) AND 1=(SELECT COUNT(*) FROM project_boq_items p2 WHERE p2.active=1 AND p2.project_id=pbi.project_id AND p2.contract_id=pbi.contract_id AND (pbi.boq_version_id IS NULL OR p2.boq_version_id=pbi.boq_version_id) AND p2.material_id=mri.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(p2.boq_code,'')=COALESCE(mri.boq_code,'')))))),0) AS requestedQty,
    COALESCE((SELECT SUM(mri.approved_purchase_qty) FROM material_request_items mri JOIN material_requests mr2 ON mr2.id=mri.request_id WHERE mr2.project_id=pbi.project_id AND mr2.contract_id=pbi.contract_id AND mr2.status<>'cancelled' AND (mri.boq_item_id=pbi.id OR (mri.boq_item_id IS NULL AND mri.material_id=pbi.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(pbi.boq_code,'')=COALESCE(mri.boq_code,'')) AND 1=(SELECT COUNT(*) FROM project_boq_items p2 WHERE p2.active=1 AND p2.project_id=pbi.project_id AND p2.contract_id=pbi.contract_id AND (pbi.boq_version_id IS NULL OR p2.boq_version_id=pbi.boq_version_id) AND p2.material_id=mri.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(p2.boq_code,'')=COALESCE(mri.boq_code,'')))))),0) AS approvedQty,
    COALESCE((SELECT SUM(mri.ordered_qty) FROM material_request_items mri JOIN material_requests mr2 ON mr2.id=mri.request_id WHERE mr2.project_id=pbi.project_id AND mr2.contract_id=pbi.contract_id AND mr2.status<>'cancelled' AND (mri.boq_item_id=pbi.id OR (mri.boq_item_id IS NULL AND mri.material_id=pbi.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(pbi.boq_code,'')=COALESCE(mri.boq_code,'')) AND 1=(SELECT COUNT(*) FROM project_boq_items p2 WHERE p2.active=1 AND p2.project_id=pbi.project_id AND p2.contract_id=pbi.contract_id AND (pbi.boq_version_id IS NULL OR p2.boq_version_id=pbi.boq_version_id) AND p2.material_id=mri.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(p2.boq_code,'')=COALESCE(mri.boq_code,'')))))),0) AS orderedQty,
    COALESCE((SELECT SUM(gri.accepted_qty) FROM goods_receipt_items gri JOIN goods_receipts gr ON gr.id=gri.receipt_id AND gr.bch_confirmation_status='confirmed' JOIN purchase_order_items poi ON poi.id=gri.purchase_order_item_id JOIN material_request_items mri ON mri.id=poi.request_item_id JOIN material_requests mr2 ON mr2.id=mri.request_id WHERE mr2.project_id=pbi.project_id AND mr2.contract_id=pbi.contract_id AND mr2.status<>'cancelled' AND (mri.boq_item_id=pbi.id OR (mri.boq_item_id IS NULL AND mri.material_id=pbi.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(pbi.boq_code,'')=COALESCE(mri.boq_code,'')) AND 1=(SELECT COUNT(*) FROM project_boq_items p2 WHERE p2.active=1 AND p2.project_id=pbi.project_id AND p2.contract_id=pbi.contract_id AND (pbi.boq_version_id IS NULL OR p2.boq_version_id=pbi.boq_version_id) AND p2.material_id=mri.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(p2.boq_code,'')=COALESCE(mri.boq_code,'')))))),0) AS receivedQty,
    COALESCE((SELECT SUM(mri.issued_qty) FROM material_request_items mri JOIN material_requests mr2 ON mr2.id=mri.request_id WHERE mr2.project_id=pbi.project_id AND mr2.contract_id=pbi.contract_id AND mr2.status<>'cancelled' AND (mri.boq_item_id=pbi.id OR (mri.boq_item_id IS NULL AND mri.material_id=pbi.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(pbi.boq_code,'')=COALESCE(mri.boq_code,'')) AND 1=(SELECT COUNT(*) FROM project_boq_items p2 WHERE p2.active=1 AND p2.project_id=pbi.project_id AND p2.contract_id=pbi.contract_id AND (pbi.boq_version_id IS NULL OR p2.boq_version_id=pbi.boq_version_id) AND p2.material_id=mri.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(p2.boq_code,'')=COALESCE(mri.boq_code,'')))))),0) AS issuedQty,
    COALESCE((SELECT SUM(mri.installed_qty) FROM material_request_items mri JOIN material_requests mr2 ON mr2.id=mri.request_id WHERE mr2.project_id=pbi.project_id AND mr2.contract_id=pbi.contract_id AND mr2.status<>'cancelled' AND (mri.boq_item_id=pbi.id OR (mri.boq_item_id IS NULL AND mri.material_id=pbi.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(pbi.boq_code,'')=COALESCE(mri.boq_code,'')) AND 1=(SELECT COUNT(*) FROM project_boq_items p2 WHERE p2.active=1 AND p2.project_id=pbi.project_id AND p2.contract_id=pbi.contract_id AND (pbi.boq_version_id IS NULL OR p2.boq_version_id=pbi.boq_version_id) AND p2.material_id=mri.material_id AND (COALESCE(mri.boq_code,'')='' OR COALESCE(p2.boq_code,'')=COALESCE(mri.boq_code,'')))))),0) AS installedQty,
    COALESCE((SELECT SUM(CASE WHEN sm.to_warehouse_id IN (SELECT w.id FROM warehouses w WHERE w.project_id=pbi.project_id AND w.type='site') THEN sm.quantity ELSE 0 END)-SUM(CASE WHEN sm.from_warehouse_id IN (SELECT w.id FROM warehouses w WHERE w.project_id=pbi.project_id AND w.type='site') THEN sm.quantity ELSE 0 END) FROM stock_movements sm WHERE sm.project_id=pbi.project_id AND sm.material_id=pbi.material_id),0) AS stockQty
    FROM project_boq_items pbi JOIN projects p ON p.id=pbi.project_id JOIN materials m ON m.id=pbi.material_id LEFT JOIN material_categories mc ON mc.id=m.category_id LEFT JOIN boq_source_items bsi ON bsi.project_boq_item_id=pbi.id AND bsi.active=1 LEFT JOIN boq_versions bv ON bv.id=pbi.boq_version_id WHERE pbi.active=1 AND (pbi.boq_version_id IS NULL OR bv.active=1) AND pbi.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY p.code,COALESCE(pbi.source_order,pbi.line_no),pbi.id`, ...projectIds) : [];
    if (boqItems.length) {
        const boqIds = boqItems.map((row)=>String(row.id));
        const placeholders = boqIds.map(()=>"?").join(",");
        const customRows = await all(`SELECT entity_id AS entityId,field_key AS fieldKey,value_text AS valueText FROM custom_field_values WHERE form_key='boq' AND entity_id IN (${placeholders})`, ...boqIds);
        const customByBoq = customRows.reduce((acc,row)=>{ const key=String(row.entityId); (acc[key] ??= {})[String(row.fieldKey)] = String(row.valueText ?? ""); return acc; },{});
        for (const row of boqItems) {
            row.customFields = customByBoq[String(row.id)] || {};
            row.orderedNotReceivedQty = Math.max(0, numberValue(row.orderedQty) - numberValue(row.receivedQty));
            row.varianceContract = numberValue(row.receivedQty) - numberValue(row.contractQty);
            row.varianceRemeasured = numberValue(row.receivedQty) - numberValue(row.remeasuredQty);
        }
    }
    const projectContracts=projectIds.length?await all(`SELECT c.id,c.project_id AS projectId,c.contract_no AS contractNo,c.contract_name AS contractName,c.contract_type AS contractType,c.parent_contract_id AS parentContractId,c.status,c.is_primary AS isPrimary,c.signed_at AS signedAt,c.effective_from AS effectiveFrom,c.effective_to AS effectiveTo,c.note,c.created_at AS createdAt,c.updated_at AS updatedAt FROM project_contracts c WHERE c.project_id IN (${projectIds.map(()=>"?").join(",")}) ORDER BY c.project_id,c.is_primary DESC,c.created_at,c.contract_no`,...projectIds):[];
    const boqVersions=projectIds.length?await all(`SELECT v.id,v.project_id AS projectId,v.contract_id AS contractId,v.version_no AS versionNo,v.version_code AS versionCode,v.version_name AS versionName,v.revision_type AS revisionType,v.source_file_name AS sourceFileName,v.status,v.active,v.effective_at AS effectiveAt,v.approved_at AS approvedAt,v.created_at AS createdAt,v.updated_at AS updatedAt FROM boq_versions v WHERE v.project_id IN (${projectIds.map(()=>"?").join(",")}) ORDER BY v.project_id,v.contract_id,v.version_no DESC`,...projectIds):[];
    const boqImportBatches=projectIds.length?await all(`SELECT id,project_id AS projectId,contract_id AS contractId,boq_version_id AS boqVersionId,version_no AS versionNo,source_file_name AS sourceFileName,active,row_count AS rowCount,imported_by AS importedBy,created_at AS createdAt FROM boq_import_batches WHERE project_id IN (${projectIds.map(()=>"?").join(",")}) ORDER BY project_id,contract_id,version_no DESC`,...projectIds):[];
    const boqChangeHistory=projectIds.length?await all(`SELECT h.id,h.project_id AS projectId,h.contract_id AS contractId,h.boq_version_id AS boqVersionId,h.source_item_id AS sourceItemId,h.project_boq_item_id AS projectBoqItemId,h.action_type AS actionType,h.reason,h.actor_user_id AS actorUserId,u.full_name AS actorName,h.created_at AS createdAt FROM boq_change_history h LEFT JOIN users u ON u.id=h.actor_user_id WHERE h.project_id IN (${projectIds.map(()=>"?").join(",")}) ORDER BY h.created_at DESC,h.id DESC LIMIT 1000`,...projectIds):[];
    const boqSourceItems=projectIds.length?await all(`SELECT bsi.id AS sourceItemId,bsi.id,bsi.batch_id AS batchId,bsi.project_id AS projectId,bsi.contract_id AS contractId,bsi.boq_version_id AS boqVersionId,bsi.source_order AS sourceOrder,bsi.source_row AS sourceRow,bsi.contract_line_ref AS contractLineRef,bsi.row_role AS rowRole,bsi.boq_code AS boqCode,bsi.contract_code AS contractCode,bsi.contract_material_code AS contractMaterialCode,bsi.approved_material_code AS approvedMaterialCode,bsi.contract_material_name AS materialName,bsi.contract_material_name AS contractMaterialName,bsi.unit,bsi.contract_qty AS contractQty,bsi.remeasured_qty AS remeasuredQty,bsi.unit_price AS unitPrice,bsi.item_type AS itemType,bsi.note,COALESCE(NULLIF(bsi.source_system_code,''),m.system,'KHAC') AS systemCode,bsi.source_subgroup_name AS subgroupName,bsi.mapping_status AS mappingStatus,bsi.mapped_material_id AS materialId,m.code AS materialCode,m.name AS standardMaterialName,m.specification,bsi.project_boq_item_id AS projectBoqItemId,bsi.active,bv.active AS versionActive,bv.status AS versionStatus,bv.version_no AS versionNo,bv.version_code AS versionCode FROM boq_source_items bsi JOIN boq_versions bv ON bv.id=bsi.boq_version_id LEFT JOIN materials m ON m.id=bsi.mapped_material_id WHERE bsi.project_id IN (${projectIds.map(()=>"?").join(",")}) ORDER BY bsi.project_id,bsi.contract_id,bv.version_no,bsi.source_order,bsi.id`,...projectIds):[];
    const contractStockLedger=projectIds.length?await all(`SELECT l.id,l.project_id AS projectId,l.contract_id AS contractId,c.contract_no AS contractNo,c.contract_name AS contractName,l.warehouse_id AS warehouseId,w.code AS warehouseCode,w.name AS warehouseName,l.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,l.movement_type AS movementType,l.quantity_delta AS quantityDelta,l.occurred_at AS occurredAt,l.reference_type AS referenceType,l.reference_id AS referenceId,l.reference_item_id AS referenceItemId,l.counterparty_contract_id AS counterpartyContractId,l.note FROM contract_stock_ledger l JOIN project_contracts c ON c.id=l.contract_id JOIN warehouses w ON w.id=l.warehouse_id JOIN materials m ON m.id=l.material_id WHERE l.project_id IN (${projectIds.map(()=>"?").join(",")}) ORDER BY l.occurred_at DESC,l.id DESC LIMIT 2000`,...projectIds):[];
    const contractStockBalances=projectIds.length?await all(`SELECT l.project_id AS projectId,l.contract_id AS contractId,c.contract_no AS contractNo,c.contract_name AS contractName,l.warehouse_id AS warehouseId,w.code AS warehouseCode,l.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,COALESCE(SUM(l.quantity_delta),0) AS balance FROM contract_stock_ledger l JOIN project_contracts c ON c.id=l.contract_id JOIN warehouses w ON w.id=l.warehouse_id JOIN materials m ON m.id=l.material_id WHERE l.project_id IN (${projectIds.map(()=>"?").join(",")}) GROUP BY l.project_id,l.contract_id,c.contract_no,c.contract_name,l.warehouse_id,w.code,l.material_id,m.code,m.name,m.unit HAVING ABS(COALESCE(SUM(l.quantity_delta),0))>0.0000001 ORDER BY l.project_id,c.contract_no,w.code,m.code`,...projectIds):[];
    const stockReconciliations=projectIds.length?await all(`SELECT r.id,r.project_id AS projectId,r.warehouse_id AS warehouseId,w.code AS warehouseCode,r.material_id AS materialId,m.code AS materialCode,m.name AS materialName,r.physical_qty AS physicalQty,r.contract_qty AS contractQty,r.difference_qty AS differenceQty,r.status,r.checked_at AS checkedAt,r.note FROM contract_stock_reconciliations r JOIN warehouses w ON w.id=r.warehouse_id JOIN materials m ON m.id=r.material_id WHERE r.project_id IN (${projectIds.map(()=>"?").join(",")}) ORDER BY r.checked_at DESC LIMIT 500`,...projectIds):[];
    const unmappedSourceRows=projectIds.length?await all(`SELECT bsi.id AS sourceItemId,bsi.id,bsi.project_id AS projectId,bsi.contract_id AS contractId,bsi.boq_version_id AS boqVersionId,p.code AS projectCode,p.name AS projectName,bsi.source_order AS sourceOrder,bsi.contract_line_ref AS contractLineRef,bsi.row_role AS rowRole,bsi.boq_code AS boqCode,bsi.contract_code AS contractCode,bsi.contract_material_code AS contractMaterialCode,bsi.approved_material_code AS approvedMaterialCode,bsi.contract_material_name AS materialName,bsi.contract_material_name AS contractMaterialName,bsi.unit,bsi.contract_qty AS contractQty,bsi.remeasured_qty AS remeasuredQty,bsi.unit_price AS unitPrice,bsi.item_type AS itemType,bsi.note,bsi.source_system_code AS systemCode,bsi.source_subgroup_name AS subgroupName,bsi.mapping_status AS mappingStatus,bsi.mapped_material_id AS materialId,bsi.standard_material_name_snapshot AS standardMaterialName FROM boq_source_items bsi JOIN boq_import_batches bib ON bib.id=bsi.batch_id AND bib.active=1 JOIN projects p ON p.id=bsi.project_id WHERE bsi.active=1 AND bsi.project_boq_item_id IS NULL AND bsi.project_id IN (${projectIds.map(()=>"?").join(",")}) ORDER BY p.code,bsi.source_order,bsi.id`,...projectIds):[];
    for(const row of unmappedSourceRows){boqItems.push({...row,materialCode:null,categoryName:null,requestedQty:0,approvedQty:0,orderedQty:0,receivedQty:0,issuedQty:0,installedQty:0,stockQty:0,orderedNotReceivedQty:0,varianceContract:-numberValue(row.contractQty),varianceRemeasured:-numberValue(row.remeasuredQty),customFields:{...(clean(row.systemCode)?{systemCode:clean(row.systemCode)}:{}),...(clean(row.subgroupName)?{subgroupName:clean(row.subgroupName)}:{})}});}
    boqItems.sort((a,b)=>clean(a.projectCode).localeCompare(clean(b.projectCode))||numberValue(a.sourceOrder)-numberValue(b.sourceOrder));
    const contractPayments = projectIds.length ? await all(`SELECT cp.id,cp.project_id AS projectId,p.code AS projectCode,p.name AS projectName,cp.recovery_record_id AS recoveryRecordId,cp.payment_date AS paymentDate,cp.reference_no AS referenceNo,cp.description,cp.amount,cp.note,cp.created_by AS createdBy,u.full_name AS createdByName,cp.created_at AS createdAt,cp.updated_at AS updatedAt FROM contract_payments cp JOIN projects p ON p.id=cp.project_id LEFT JOIN users u ON u.id=cp.created_by WHERE cp.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY cp.payment_date DESC,cp.created_at DESC`, ...projectIds) : [];
    const productionReports = projectIds.length ? await all(`SELECT pr.id,pr.project_id AS projectId,p.code AS projectCode,p.name AS projectName,pr.report_period AS reportPeriod,pr.reference_no AS referenceNo,pr.description,pr.planned_value AS plannedValue,pr.actual_value AS actualValue,pr.approved_value AS approvedValue,pr.status,pr.submitted_by AS submittedBy,us.full_name AS submittedByName,pr.approved_by AS approvedBy,ua.full_name AS approvedByName,pr.approved_at AS approvedAt,pr.created_at AS createdAt,pr.updated_at AS updatedAt FROM production_reports pr JOIN projects p ON p.id=pr.project_id LEFT JOIN users us ON us.id=pr.submitted_by LEFT JOIN users ua ON ua.id=pr.approved_by WHERE pr.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY pr.report_period DESC,pr.updated_at DESC`, ...projectIds) : [];
    const constructionDailyLogs = projectIds.length ? await all(`SELECT l.id,l.log_no AS logNo,l.project_id AS projectId,p.code AS projectCode,p.name AS projectName,l.warehouse_id AS warehouseId,l.work_date AS workDate,l.shift,l.weather,l.work_content AS workContent,l.labor_count AS laborCount,l.equipment_note AS equipmentNote,l.status,l.submitted_by AS submittedBy,us.full_name AS submittedByName,l.approved_by AS approvedBy,ua.full_name AS approvedByName,l.approved_at AS approvedAt,l.cancelled_by AS cancelledBy,l.cancelled_at AS cancelledAt,l.note,l.created_by AS createdBy,uc.full_name AS createdByName,l.created_at AS createdAt,l.updated_at AS updatedAt,COALESCE(x.item_count,0) AS itemCount,COALESCE(x.completed_qty,0) AS completedQty FROM construction_daily_logs l JOIN projects p ON p.id=l.project_id LEFT JOIN users us ON us.id=l.submitted_by LEFT JOIN users ua ON ua.id=l.approved_by LEFT JOIN users uc ON uc.id=l.created_by LEFT JOIN (SELECT log_id,COUNT(*) AS item_count,SUM(completed_qty) AS completed_qty FROM construction_daily_log_items GROUP BY log_id) x ON x.log_id=l.id WHERE l.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY l.work_date DESC,l.created_at DESC`, ...projectIds) : [];
    const constructionDailyLogItems = projectIds.length ? await all(`SELECT i.id,i.log_id AS logId,i.boq_item_id AS boqItemId,i.item_name AS itemName,i.location,i.planned_qty AS plannedQty,i.completed_qty AS completedQty,i.unit,i.labor_hours AS laborHours,i.photo_attachment_id AS photoAttachmentId,i.note FROM construction_daily_log_items i JOIN construction_daily_logs l ON l.id=i.log_id WHERE l.project_id IN (${projectIds.map(() => "?").join(",")})`, ...projectIds) : [];
    const capitalRecoveryRecords = projectIds.length ? await all(`SELECT cr.id,cr.project_id AS projectId,p.code AS projectCode,p.name AS projectName,cr.period_key AS periodKey,cr.reference_no AS referenceNo,cr.production_report_id AS productionReportId,pr.approved_value AS productionApprovedValue,cr.submitted_value AS submittedValue,cr.approved_value AS approvedValue,cr.invoice_no AS invoiceNo,cr.invoice_value AS invoiceValue,cr.due_date AS dueDate,cr.status,cr.note,cr.created_by AS createdBy,u.full_name AS createdByName,cr.created_at AS createdAt,cr.updated_at AS updatedAt,COALESCE((SELECT SUM(cp.amount) FROM contract_payments cp WHERE cp.recovery_record_id=cr.id),0) AS cashReceived FROM capital_recovery_records cr JOIN projects p ON p.id=cr.project_id LEFT JOIN production_reports pr ON pr.id=cr.production_report_id LEFT JOIN users u ON u.id=cr.created_by WHERE cr.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY cr.period_key DESC,cr.updated_at DESC`, ...projectIds) : [];
    const teamSubcontracts = projectIds.length ? await all(`SELECT sc.id,sc.project_id AS projectId,sc.team_id AS teamId,t.code AS teamCode,t.name AS teamName,sc.contract_no AS contractNo,sc.contract_name AS contractName,sc.scope_text AS scopeText,sc.contract_value AS contractValue,sc.start_date AS startDate,sc.end_date AS endDate,sc.status,sc.signed_at AS signedAt,sc.note,sc.created_at AS createdAt,sc.updated_at AS updatedAt FROM team_subcontracts sc JOIN teams t ON t.id=sc.team_id WHERE sc.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY sc.created_at DESC`, ...projectIds) : [];
    const teamProductionRecords = projectIds.length ? await all(`SELECT tp.id,tp.project_id AS projectId,tp.team_id AS teamId,t.name AS teamName,tp.subcontract_id AS subcontractId,sc.contract_no AS contractNo,tp.period_key AS periodKey,tp.reference_no AS referenceNo,tp.description,tp.submitted_value AS submittedValue,tp.approved_value AS approvedValue,tp.status,tp.approved_at AS approvedAt,tp.created_at AS createdAt FROM team_production_records tp JOIN teams t ON t.id=tp.team_id JOIN team_subcontracts sc ON sc.id=tp.subcontract_id WHERE tp.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY tp.period_key DESC,tp.created_at DESC`, ...projectIds) : [];
    const teamPayments = projectIds.length ? await all(`SELECT pay.id,pay.project_id AS projectId,pay.team_id AS teamId,t.name AS teamName,pay.subcontract_id AS subcontractId,sc.contract_no AS contractNo,pay.production_record_id AS productionRecordId,pay.payment_date AS paymentDate,pay.payment_type AS paymentType,pay.reference_no AS referenceNo,pay.description,pay.amount,pay.note,pay.created_at AS createdAt FROM team_payments pay JOIN teams t ON t.id=pay.team_id JOIN team_subcontracts sc ON sc.id=pay.subcontract_id WHERE pay.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY pay.payment_date DESC,pay.created_at DESC`, ...projectIds) : [];
    const teamSettlements = projectIds.length ? await all(`SELECT st.id,st.project_id AS projectId,st.team_id AS teamId,t.name AS teamName,st.subcontract_id AS subcontractId,sc.contract_no AS contractNo,st.settlement_no AS settlementNo,st.approved_production_value AS approvedProductionValue,st.adjustment_value AS adjustmentValue,st.final_value AS finalValue,st.paid_value AS paidValue,st.remaining_value AS remainingValue,st.status,st.settled_at AS settledAt,st.note FROM team_settlements st JOIN teams t ON t.id=st.team_id JOIN team_subcontracts sc ON sc.id=st.subcontract_id WHERE st.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY st.created_at DESC`, ...projectIds) : [];
    const settings = await first(`SELECT company_name AS companyName,stage_1_department AS stage1Department,stage_2_department AS stage2Department,stage_3_department AS stage3Department,approval_sla_hours AS approvalSlaHours,stage_1_sla_hours AS stage1SlaHours,stage_2_sla_hours AS stage2SlaHours,stage_3_sla_hours AS stage3SlaHours,po_sla_hours AS poSlaHours,bch_confirmation_sla_hours AS bchConfirmationSlaHours,slow_moving_days AS slowMovingDays,negative_stock_blocked AS negativeStockBlocked FROM company_settings WHERE id='SETTINGS'`);
    const productIdentity = await first(`SELECT id AS productId,legal_owner AS legalOwner,product_name AS productName,product_description AS productDescription,version,source_fingerprint AS sourceFingerprint,source_fingerprint_short AS sourceFingerprintShort FROM vntech_product_identity WHERE id=?`, VNTECH_IDENTITY.productId);
    const trustSettings = isAdmin(user) ? await first(`SELECT trust_mode AS trustMode,enforcement_enabled AS enforcementEnabled,tenant_id AS tenantId,company_code AS companyCode,key_id AS keyId,algorithm,brand_fingerprint AS brandFingerprint,release_fingerprint AS releaseFingerprint,machine_fingerprint AS machineFingerprint,hardware_binding_mode AS hardwareBindingMode,native_verifier_mode AS nativeVerifierMode,online_attestation_enabled AS onlineAttestationEnabled,license_server_url AS licenseServerUrl,last_attested_at AS lastAttestedAt,updated_at AS updatedAt FROM vntech_trust_settings WHERE id='TRUST-ROOT'`) : null;
    const installedLicense = isAdmin(user) ? await first(`SELECT license_id AS licenseId,tenant_id AS tenantId,company_code AS companyCode,product_id AS productId,key_id AS keyId,status,valid_from AS validFrom,valid_until AS validUntil,machine_fingerprint AS machineFingerprint,installed_at AS installedAt,last_verified_at AS lastVerifiedAt,revoked_at AS revokedAt FROM vntech_license_installations ORDER BY installed_at DESC LIMIT 1`) : null;
    const trustAudit = isAdmin(user) ? await all(`SELECT id,event_type AS eventType,actor_user_id AS actorUserId,trust_mode AS trustMode,enforcement_enabled AS enforcementEnabled,license_id AS licenseId,machine_fingerprint AS machineFingerprint,detail_json AS detailJson,occurred_at AS occurredAt FROM vntech_trust_audit ORDER BY occurred_at DESC LIMIT 50`) : [];
    const trustStatus = isAdmin(user) ? { foundationReady: true, trustSettings, installedLicense, audit: trustAudit, runtime: env.TRUST_STATE || { mode: VNTECH_IDENTITY.trust.mode, enforced: false, license: { status: installedLicense?.status || "missing" }, privateKeyPresent: false }, productionActivationAllowed: false, privateKeyPresent: false } : null;
    const engineRoleProfiles = await all(`SELECT id,engine_key AS engineKey,company_code AS companyCode,display_name AS displayName,description,active,sort_order AS sortOrder,system_locked AS systemLocked FROM business_role_engine_catalog ${isAdmin(user) ? "" : "WHERE active=1"} ORDER BY sort_order,display_name`);
    const businessScopes = await all(`SELECT id,code,name,description,active,sort_order AS sortOrder,system_locked AS systemLocked FROM business_scope_catalog ${isAdmin(user) ? "" : "WHERE active=1"} ORDER BY sort_order,name`);
    const businessRoleGroupScopes = await all(`SELECT brgs.id,brgs.business_group_id AS businessGroupId,brgs.business_scope_id AS businessScopeId,bs.code AS scopeCode,bs.name AS scopeName,brgs.is_primary AS isPrimary FROM business_role_group_scopes brgs JOIN business_scope_catalog bs ON bs.id=brgs.business_scope_id ${isAdmin(user) ? "" : "WHERE bs.active=1"} ORDER BY brgs.is_primary DESC,bs.sort_order,bs.name`);
    const rawBusinessRoleGroups = await all(`SELECT id,code,name,description,engine_role AS engineRole,active,sort_order AS sortOrder,system_locked AS systemLocked FROM business_role_group_catalog ${isAdmin(user) ? "" : "WHERE active=1"} ORDER BY sort_order,name`);
    const businessRoleGroups = rawBusinessRoleGroups.map((row)=>({...row,scopeIds:businessRoleGroupScopes.filter((item)=>String(item.businessGroupId)===String(row.id)).map((item)=>String(item.businessScopeId)),scopes:businessRoleGroupScopes.filter((item)=>String(item.businessGroupId)===String(row.id))}));
    const roleCatalog = await all(`SELECT rc.id,rc.code,rc.name,rc.description,rc.base_role AS baseRole,rc.business_group_id AS businessGroupId,COALESCE(bg.name,rc.base_role) AS businessGroupName,rc.default_organization_unit_id AS defaultOrganizationUnitId,ou.code AS defaultOrganizationCode,ou.name AS defaultOrganizationName,rc.active,rc.sort_order AS sortOrder,rc.system_locked AS systemLocked FROM role_catalog rc LEFT JOIN business_role_group_catalog bg ON bg.id=rc.business_group_id LEFT JOIN organization_units ou ON ou.id=rc.default_organization_unit_id ${isAdmin(user) ? "" : "WHERE rc.active=1"} ORDER BY rc.sort_order,rc.name`);
    const organizationUnits = await all(`SELECT ou.id,ou.code,ou.name,ou.unit_type AS unitType,ou.parent_id AS parentId,parent.name AS parentName,ou.project_id AS projectId,p.code AS projectCode,p.name AS projectName,ou.description,ou.effective_from AS effectiveFrom,ou.effective_to AS effectiveTo,ou.active,ou.archived_at AS archivedAt,ou.sort_order AS sortOrder,ou.system_locked AS systemLocked FROM organization_units ou LEFT JOIN organization_units parent ON parent.id=ou.parent_id LEFT JOIN projects p ON p.id=ou.project_id ${isAdmin(user) ? "" : "WHERE ou.active=1 AND ou.archived_at IS NULL"} ORDER BY ou.sort_order,ou.name`);
    const approvalStageCatalog = await all(`SELECT id,stage_no AS stageNo,name,description,allowed_role_codes AS allowedRoleCodes,approval_mode AS approvalMode,sla_hours AS slaHours,auto_approve_on_submit AS autoApproveOnSubmit,active,sort_order AS sortOrder FROM approval_stage_catalog ORDER BY stage_no`);
    const menuGroups = await all(`SELECT id,group_key AS groupKey,name,icon,active,sort_order AS sortOrder,collapsible,system_locked AS systemLocked FROM menu_group_catalog ${isAdmin(user) ? "" : "WHERE active=1"} ORDER BY sort_order,name`);
    const moduleCatalog = isAdmin(user)
      ? await all(`SELECT mc.module_key AS moduleKey,mc.label,mc.icon,mc.group_name AS groupName,mc.group_key AS groupKey,mc.active,mc.sort_order AS sortOrder,mc.system_locked AS systemLocked FROM module_catalog mc ORDER BY mc.sort_order,mc.module_key`)
      : await all(`SELECT mc.module_key AS moduleKey,mc.label,mc.icon,mc.group_name AS groupName,mc.group_key AS groupKey,mc.active,mc.sort_order AS sortOrder,mc.system_locked AS systemLocked FROM module_catalog mc LEFT JOIN menu_group_catalog mg ON mg.group_key=mc.group_key WHERE mc.active=1 AND (mc.group_key IS NULL OR mg.active=1) ORDER BY mc.sort_order,mc.module_key`);
    const activeModuleKeys = new Set(moduleCatalog.filter((row) => Number(row.active) === 1).map((row) => String(row.moduleKey)));
    const modulePermissions = isAdmin(user) ? MODULE_KEYS.filter((moduleKey) => activeModuleKeys.has(moduleKey) || moduleKey === "admin").map((moduleKey) => ({ userId: user.id, moduleKey, canView: 1, canUse: 1, canCreate:1, canEdit:1, canApprove:1, canExport:1,permissionSource:"admin" })) : isCompanyLeadership(user) ? MODULE_KEYS.filter((moduleKey)=>moduleKey!=="admin" && activeModuleKeys.has(moduleKey)).map((moduleKey)=>({userId:user.id,moduleKey,canView:1,canUse:1,canCreate:1,canEdit:1,canApprove:1,canExport:1,permissionSource:"company_leadership"})) : await all(`SELECT ump.user_id AS userId,ump.module_key AS moduleKey,ump.can_view AS canView,ump.can_use AS canUse,ump.can_create AS canCreate,ump.can_edit AS canEdit,ump.can_approve AS canApprove,ump.can_export AS canExport,ump.permission_expires_at AS permissionExpiresAt,COALESCE(ump.permission_source,'manual_override') AS permissionSource FROM user_module_permissions ump JOIN module_catalog mc ON mc.module_key=ump.module_key AND mc.active=1 LEFT JOIN menu_group_catalog mg ON mg.group_key=mc.group_key WHERE ump.user_id=? AND (ump.permission_expires_at IS NULL OR ump.permission_expires_at>?) AND (mc.group_key IS NULL OR mg.active=1) ORDER BY mc.sort_order,ump.module_key`, user.id, now());
    const presenceCutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
    const staffRows = await all(`SELECT u.id,u.employee_code AS employeeCode,u.full_name AS fullName,u.email,u.role,COALESCE(rc.name,u.role) AS roleName,u.department,u.organization_unit_id AS organizationUnitId,ou.code AS organizationCode,COALESCE(ou.name,u.department) AS organizationName,u.avatar_url AS avatarUrl,MAX(CASE WHEN s.expires_at>? THEN COALESCE(s.last_seen_at,s.created_at) ELSE NULL END) AS lastSeenAt FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role LEFT JOIN organization_units ou ON ou.id=u.organization_unit_id LEFT JOIN sessions s ON s.user_id=u.id WHERE u.active=1 GROUP BY u.id,u.employee_code,u.full_name,u.email,u.role,rc.name,u.department,u.organization_unit_id,ou.code,ou.name,u.avatar_url ORDER BY u.full_name`, now());
    const staffDirectory = staffRows.map((row) => ({ ...row, online: String(row.id) === String(user.id) || Boolean(row.lastSeenAt && String(row.lastSeenAt) >= presenceCutoff) }));
    const users = isAdmin(user) ? await all(`SELECT u.id,u.employee_code AS employeeCode,u.full_name AS fullName,u.username,u.email,u.role,COALESCE(rc.name,u.role) AS roleName,COALESCE(rc.base_role,u.role) AS roleBase,rc.warehouse_scope_kind AS warehouseScopeKind,u.department,u.organization_unit_id AS organizationUnitId,ou.code AS organizationCode,COALESCE(ou.name,u.department) AS organizationName,u.avatar_url AS avatarUrl,u.approval_limit AS approvalLimit,u.must_change_password AS mustChangePassword,u.password_reset_at AS passwordResetAt,u.active FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role LEFT JOIN organization_units ou ON ou.id=u.organization_unit_id ORDER BY u.full_name`) : [];
    const userWarehouseScopes = isAdmin(user) ? await all(`SELECT uws.user_id AS userId,uws.warehouse_id AS warehouseId,uws.permission,w.code AS warehouseCode,w.name AS warehouseName,w.type,w.project_id AS projectId FROM user_warehouse_scopes uws JOIN warehouses w ON w.id=uws.warehouse_id ORDER BY uws.user_id,w.code`) : [];
    const adminProjects = isAdmin(user) ? await all(`SELECT id,code,name,status,contract_no AS contractNo,contract_name AS contractName,start_date AS startDate,planned_end_date AS plannedEndDate FROM projects WHERE status<>'purged' ORDER BY CASE WHEN status='active' THEN 0 ELSE 1 END,code`) : [];
    const userScopes = isAdmin(user) ? await all(`SELECT ups.user_id AS userId,ups.project_id AS projectId,ups.permission,p.code AS projectCode,p.name AS projectName FROM user_project_scopes ups JOIN projects p ON p.id=ups.project_id ORDER BY ups.user_id,p.code`) : [];
    const allModulePermissions = isAdmin(user) ? await all(`SELECT user_id AS userId,module_key AS moduleKey,can_view AS canView,can_use AS canUse,can_create AS canCreate,can_edit AS canEdit,can_approve AS canApprove,can_export AS canExport,permission_expires_at AS permissionExpiresAt,COALESCE(permission_source,'manual_override') AS permissionSource FROM user_module_permissions ORDER BY user_id,module_key`) : [];
    const canEditCentral=isAdmin(user)||await canUseModule(user,"central_warehouse","canEdit");
    const adminMaterialCategories = canEditCentral ? await all(`SELECT id,code,name,description,sort_order AS sortOrder,active FROM material_categories ORDER BY CASE WHEN active=1 THEN 0 ELSE 1 END,sort_order,name`) : materialCategories;
    const adminMaterialSubcategories = canEditCentral ? await all(`SELECT ms.id,ms.category_id AS categoryId,ms.code,ms.name,ms.description,ms.scope_examples AS scopeExamples,ms.review_status AS reviewStatus,ms.adjustment_note AS adjustmentNote,ms.sort_order AS sortOrder,ms.active,mc.code AS categoryCode,mc.name AS categoryName FROM material_subcategories ms JOIN material_categories mc ON mc.id=ms.category_id ORDER BY CASE WHEN ms.active=1 THEN 0 ELSE 1 END,mc.sort_order,ms.sort_order,ms.name`) : materialSubcategories;
    let adminMaterials = canEditCentral ? await all(`SELECT m.id,m.code,m.name,m.system,m.category_id AS categoryId,mc.code AS categoryCode,mc.name AS categoryName,m.subcategory_id AS subcategoryId,ms.code AS subcategoryCode,ms.name AS subcategoryName,m.specification,m.brand,m.unit,m.standard_price AS standardPrice,m.min_stock AS minStock,m.requires_cocq AS requiresCocq,m.requires_mar AS requiresMar,m.active FROM materials m LEFT JOIN material_categories mc ON mc.id=m.category_id LEFT JOIN material_subcategories ms ON ms.id=m.subcategory_id ORDER BY CASE WHEN m.active=1 THEN 0 ELSE 1 END,COALESCE(mc.sort_order,999),COALESCE(ms.sort_order,9999),m.code`) : []; adminMaterials=adminMaterials.map((row)=>({...row,aliases:aliasesByMaterial[String(row.id)]||[],aliasText:(aliasesByMaterial[String(row.id)]||[]).map((alias)=>alias.aliasName).join("; ")}));
    const materialNorms = await all(`SELECT mn.id,mn.norm_code AS normCode,mn.project_id AS projectId,p.code AS projectCode,p.name AS projectName,mn.subcategory_id AS subcategoryId,ms.name AS subcategoryName,mn.item_name AS itemName,mn.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit AS materialUnit,mn.base_uom AS baseUom,mn.quantity_per_unit AS quantityPerUnit,mn.unit,mn.source_component_id AS sourceComponentId,mn.source_type AS sourceType,mn.notes,mn.status,mn.active,mn.created_by AS createdBy,u.full_name AS createdByName,mn.created_at AS createdAt,mn.updated_at AS updatedAt FROM material_norms mn LEFT JOIN projects p ON p.id=mn.project_id LEFT JOIN material_subcategories ms ON ms.id=mn.subcategory_id LEFT JOIN materials m ON m.id=mn.material_id LEFT JOIN users u ON u.id=mn.created_by ORDER BY mn.updated_at DESC,mn.norm_code`);
    const audits = isAdmin(user) ? await all(`SELECT al.id,al.action,al.entity_type AS entityType,al.entity_id AS entityId,al.occurred_at AS occurredAt,u.full_name AS userName FROM audit_logs al LEFT JOIN users u ON u.id=al.user_id ORDER BY al.occurred_at DESC LIMIT 100`) : [];
    const paymentPlans = projectIds.length ? await all(`SELECT pp.id,pp.plan_no AS planNo,pp.project_id AS projectId,p.code AS projectCode,p.name AS projectName,pp.contract_id AS contractId,pp.po_id AS poId,pp.milestone,pp.planned_date AS plannedDate,pp.planned_amount AS plannedAmount,pp.paid_amount AS paidAmount,pp.status,pp.note,pp.created_by AS createdBy,u.full_name AS createdByName,pp.created_at AS createdAt,pp.updated_at AS updatedAt FROM payment_plans pp JOIN projects p ON p.id=pp.project_id LEFT JOIN users u ON u.id=pp.created_by WHERE pp.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY pp.planned_date,pp.created_at DESC`, ...projectIds) : [];
    const advanceRequests = projectIds.length ? await all(`SELECT ar.id,ar.request_no AS requestNo,ar.project_id AS projectId,p.code AS projectCode,p.name AS projectName,ar.requester_id AS requesterId,u.full_name AS requesterName,u.department AS requesterDepartment,ar.amount,ar.purpose,ar.category,ar.status,ar.advance_paid AS advancePaid,ar.settlement_value AS settlementValue,ar.settled_at AS settledAt,ar.note,ar.created_by AS createdBy,uc.full_name AS createdByName,ar.created_at AS createdAt,ar.updated_at AS updatedAt FROM advance_requests ar LEFT JOIN projects p ON p.id=ar.project_id LEFT JOIN users u ON u.id=ar.requester_id LEFT JOIN users uc ON uc.id=ar.created_by WHERE ar.project_id IS NULL OR ar.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY ar.created_at DESC`, ...projectIds) : [];
    const siteExpenseClaims = projectIds.length ? await all(`SELECT sc.id,sc.claim_no AS claimNo,sc.project_id AS projectId,p.code AS projectCode,p.name AS projectName,sc.cost_type AS costType,sc.amount,sc.paid_by AS paidBy,pu.full_name AS paidByName,sc.claim_date AS claimDate,sc.description,sc.voucher_attachment_id AS voucherAttachmentId,sc.status,sc.approved_by AS approvedBy,au.full_name AS approvedByName,sc.approved_at AS approvedAt,sc.created_by AS createdBy,cu.full_name AS createdByName,sc.created_at AS createdAt,sc.updated_at AS updatedAt FROM site_expense_claims sc JOIN projects p ON p.id=sc.project_id LEFT JOIN users pu ON pu.id=sc.paid_by LEFT JOIN users au ON au.id=sc.approved_by LEFT JOIN users cu ON cu.id=sc.created_by WHERE sc.project_id IN (${projectIds.map(() => "?").join(",")}) ORDER BY sc.claim_date DESC,sc.created_at DESC`, ...projectIds) : [];
    const bankAccounts = await all(`SELECT b.id,b.code,b.bank_name AS bankName,b.account_no AS accountNo,b.branch,b.currency,b.opening_balance AS openingBalance,b.active,b.created_at AS createdAt FROM bank_accounts b ORDER BY b.active DESC,b.code`);
    const cashbookEntries = await all(`SELECT e.id,e.entry_no AS entryNo,e.entry_date AS entryDate,e.account_id AS accountId,b.code AS accountCode,b.bank_name AS bankName,e.entry_type AS entryType,e.amount,e.counterparty,e.reference_type AS referenceType,e.reference_id AS referenceId,e.note,e.created_by AS createdBy,u.full_name AS createdByName,e.created_at AS createdAt FROM cashbook_entries e LEFT JOIN bank_accounts b ON b.id=e.account_id LEFT JOIN users u ON u.id=e.created_by ORDER BY e.entry_date DESC,e.created_at DESC`);
    const accountingVouchers = await all(`SELECT v.id,v.voucher_no AS voucherNo,v.voucher_date AS voucherDate,v.voucher_type AS voucherType,v.project_id AS projectId,p.code AS projectCode,p.name AS projectName,v.description,v.total_amount AS totalAmount,v.status,v.files_json AS filesJson,v.created_by AS createdBy,u.full_name AS createdByName,v.created_at AS createdAt,v.updated_at AS updatedAt FROM accounting_vouchers v LEFT JOIN projects p ON p.id=v.project_id LEFT JOIN users u ON u.id=v.created_by ORDER BY v.voucher_date DESC,v.created_at DESC`);
    const hrRecords = await all(`SELECT h.id,h.user_id AS userId,u.full_name AS fullName,u.employee_code AS employeeCode,u.email,u.department,h.identity_no AS identityNo,h.identity_date AS identityDate,h.identity_place AS identityPlace,h.birth_date AS birthDate,h.birthplace,h.permanent_address AS permanentAddress,h.phone,h.education_level AS educationLevel,h.joined_date AS joinedDate,h.position,h.note FROM hr_records h LEFT JOIN users u ON u.id=h.user_id ORDER BY h.full_name`);
    const laborContracts = await all(`SELECT lc.id,lc.contract_no AS contractNo,lc.user_id AS userId,u.full_name AS fullName,u.employee_code AS employeeCode,lc.contract_type AS contractType,lc.start_date AS startDate,lc.end_date AS endDate,lc.signing_date AS signingDate,lc.salary,lc.status,lc.note FROM labor_contracts lc LEFT JOIN users u ON u.id=lc.user_id ORDER BY lc.start_date DESC`);
    const officialCorrespondence = await all(`SELECT c.id,c.doc_no AS docNo,c.direction,c.doc_type AS docType,c.issue_date AS issueDate,c.sender_name AS senderName,c.receiver_name AS receiverName,c.summary,c.internal_handler AS internalHandler,c.status,c.result_note AS resultNote,c.created_by AS createdBy,u.full_name AS createdByName,c.created_at AS createdAt FROM official_correspondence c LEFT JOIN users u ON u.id=c.created_by ORDER BY c.issue_date DESC,c.created_at DESC`);
    const legalDocuments = await all(`SELECT d.id,d.doc_no AS docNo,d.doc_type AS docType,d.title,d.issue_date AS issueDate,d.issuer,d.effective_date AS effectiveDate,d.expiry_date AS expiryDate,d.scope,d.attachment_id AS attachmentId,d.status,d.created_by AS createdBy,u.full_name AS createdByName,d.created_at AS createdAt FROM legal_documents d LEFT JOIN users u ON u.id=d.created_by ORDER BY d.issue_date DESC,d.created_at DESC`);
    const sealManagement = await all(`SELECT s.id,s.seal_no AS sealNo,s.seal_name AS sealName,s.seal_type AS sealType,s.custodian,s.registered_date AS registeredDate,s.status,s.usage_note AS usageNote FROM seal_management s ORDER BY s.seal_no`);
    const benefitRecords = await all(`SELECT b.id,b.benefit_no AS benefitNo,b.user_id AS userId,u.full_name AS fullName,b.benefit_type AS benefitType,b.provider,b.start_date AS startDate,b.end_date AS endDate,b.monthly_amount AS monthlyAmount,b.status,b.note FROM benefit_records b LEFT JOIN users u ON u.id=b.user_id ORDER BY b.start_date DESC`);
    const activeSessions = isAdmin(user) ? await all(`SELECT s.id,s.user_id AS userId,u.full_name AS userName,u.username,s.ip_address AS ipAddress,s.user_agent AS userAgent,s.created_at AS createdAt,s.expires_at AS expiresAt FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.expires_at>? ORDER BY s.created_at DESC LIMIT 300`, now()) : [];
    const companyAvailability = await all(`WITH movements AS (SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE to_warehouse_id IS NOT NULL UNION ALL SELECT material_id,from_warehouse_id,-quantity FROM stock_movements WHERE from_warehouse_id IS NOT NULL), balances AS (SELECT material_id,warehouse_id,SUM(qty) AS on_hand FROM movements GROUP BY material_id,warehouse_id), res AS (SELECT material_id,warehouse_id,SUM(quantity) AS reserved FROM stock_reservations WHERE status='active' GROUP BY material_id,warehouse_id) SELECT w.id AS warehouseId,w.code AS warehouseCode,w.name AS warehouseName,w.type,w.project_id AS projectId,p.code AS projectCode,b.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit,COALESCE(b.on_hand,0) AS onHand,COALESCE(r.reserved,0) AS reserved,CASE WHEN COALESCE(b.on_hand,0)-COALESCE(r.reserved,0)>0 THEN COALESCE(b.on_hand,0)-COALESCE(r.reserved,0) ELSE 0 END AS available FROM balances b JOIN warehouses w ON w.id=b.warehouse_id AND w.active=1 JOIN materials m ON m.id=b.material_id LEFT JOIN projects p ON p.id=w.project_id LEFT JOIN res r ON r.material_id=b.material_id AND r.warehouse_id=b.warehouse_id WHERE w.type<>'transit' AND COALESCE(b.on_hand,0)<>0 ORDER BY m.code,w.type,w.code`);
    let transferOrders = await all(`SELECT t.id,t.transfer_no AS transferNo,t.source_warehouse_id AS sourceWarehouseId,sw.code AS sourceWarehouseCode,sw.name AS sourceWarehouseName,t.destination_warehouse_id AS destinationWarehouseId,dw.code AS destinationWarehouseCode,dw.name AS destinationWarehouseName,t.source_project_id AS sourceProjectId,t.destination_project_id AS destinationProjectId,t.status,t.reason,t.note,t.requested_at AS requestedAt,t.approved_at AS approvedAt,t.shipped_at AS shippedAt,t.received_at AS receivedAt,COALESCE(x.item_count,0) AS itemCount,COALESCE(x.requested_qty,0) AS requestedQty,COALESCE(x.shipped_qty,0) AS shippedQty,COALESCE(x.received_qty,0) AS receivedQty FROM transfer_orders t JOIN warehouses sw ON sw.id=t.source_warehouse_id JOIN warehouses dw ON dw.id=t.destination_warehouse_id LEFT JOIN (SELECT transfer_order_id,COUNT(*) AS item_count,SUM(requested_qty) AS requested_qty,SUM(shipped_qty) AS shipped_qty,SUM(received_qty) AS received_qty FROM transfer_order_items GROUP BY transfer_order_id) x ON x.transfer_order_id=t.id ORDER BY t.requested_at DESC LIMIT 300`);
    if (effectiveRole(user)==='warehouse' && !isAdmin(user)) { transferOrders=transferOrders.filter((row)=>warehouses.some((w)=>String(w.id)===String(row.sourceWarehouseId)||String(w.id)===String(row.destinationWarehouseId))); }
    const workItemWhere = isAdmin(user) ? "1=1" : departmentForRole(user)==="KH" ? `(wi.department_code='KH' AND (wi.assigned_to=? OR EXISTS(SELECT 1 FROM role_catalog rc WHERE rc.code=? AND rc.code='kh_truong')))` : departmentForRole(user)==="DA" ? `(wi.department_code='DA' AND (wi.assigned_to=? OR EXISTS(SELECT 1 FROM role_catalog rc WHERE rc.code=? AND rc.code='da_truong')))` : departmentCodeForUser(user)==="BCH" ? `(wi.department_code='BCH' AND (wi.assigned_to=? OR wi.project_id IS NULL OR wi.project_id IN (${projectIds.length>0?projectIds.map(()=>"?").join(","):"NULL"})))` : `wi.assigned_to=?`;
    const workItemBinds = isAdmin(user) ? [] : departmentForRole(user) ? [user.id,user.role] : departmentCodeForUser(user)==="BCH" ? [user.id,...projectIds] : [user.id];
    const workItems = await all(`SELECT wi.id,wi.task_no AS taskNo,wi.department_code AS departmentCode,wi.work_group AS workGroup,wi.title,wi.description,wi.project_id AS projectId,p.code AS projectCode,p.name AS projectName,wi.source_module AS sourceModule,wi.source_type AS sourceType,wi.source_id AS sourceId,wi.source_no AS sourceNo,wi.work_step AS workStep,wi.task_origin AS taskOrigin,wi.assigned_to AS assignedTo,ua.full_name AS assignedToName,wi.assigned_by AS assignedBy,ub.full_name AS assignedByName,wi.assigned_at AS assignedAt,wi.due_at AS dueAt,wi.priority,wi.status,wi.progress,wi.required_output AS requiredOutput,wi.waiting_reason AS waitingReason,wi.waiting_started_at AS waitingStartedAt,wi.submitted_at AS submittedAt,wi.completed_at AS completedAt,wi.active FROM work_items wi LEFT JOIN projects p ON p.id=wi.project_id JOIN users ua ON ua.id=wi.assigned_to JOIN users ub ON ub.id=wi.assigned_by WHERE ${workItemWhere} ORDER BY CASE WHEN wi.status IN ('COMPLETED','CANCELLED') THEN 1 ELSE 0 END,CASE wi.priority WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,COALESCE(wi.due_at,'9999'),wi.assigned_at DESC LIMIT 1000`,...workItemBinds);
    const workItemIds=workItems.map((row)=>String(row.id)); let workItemEvents=[]; if(workItemIds.length){const ph=workItemIds.map(()=>'?').join(',');workItemEvents=await all(`SELECT e.id,e.work_item_id AS workItemId,e.event_type AS eventType,e.from_status AS fromStatus,e.to_status AS toStatus,e.actor_user_id AS actorUserId,u.full_name AS actorName,e.previous_assignee AS previousAssignee,e.new_assignee AS newAssignee,e.reason,e.detail_json AS detailJson,e.occurred_at AS occurredAt FROM work_item_events e LEFT JOIN users u ON u.id=e.actor_user_id WHERE e.work_item_id IN (${ph}) ORDER BY e.occurred_at DESC`,...workItemIds);}
    const taskNotifications=await all(`SELECT n.id,n.work_item_id AS workItemId,n.user_id AS userId,n.channel,n.title,n.body,n.status,n.read_at AS readAt,n.sent_at AS sentAt,n.last_error AS lastError,n.created_at AS createdAt FROM task_notifications n WHERE n.user_id=? ORDER BY CASE WHEN n.read_at IS NULL THEN 0 ELSE 1 END,n.created_at DESC LIMIT 100`,user.id);
    const serverInfo = isAdmin(user) ? { version: VNTECH_IDENTITY.version, releaseBuild: clean(process.env.VNTECH_RELEASE_BUILD || VNTECH_IDENTITY.release.build), deploymentMode: env.DEPLOYMENT_MODE || "unknown", databaseEngine: env.DATABASE_ENGINE || "unknown", storageMode: env.STORAGE_MODE || "unknown", publicUrl: env.PUBLIC_URL || null, redisEnabled: Boolean(env.REDIS), testDataResetEnabled: clean(process.env.VNTECH_ALLOW_TEST_DATA_RESET)==="1", factoryResetEnabled: clean(process.env.VNTECH_ALLOW_FACTORY_RESET)==="1" } : null;
    const emailSettings = isAdmin(user) ? await first(`SELECT enabled,smtp_host AS smtpHost,smtp_port AS smtpPort,security,username,sender_email AS senderEmail,sender_name AS senderName,base_url AS baseUrl,CASE WHEN password IS NOT NULL AND length(password)>0 THEN 1 ELSE 0 END AS passwordConfigured FROM email_settings WHERE id='EMAIL'`) : null;
    const emailRecipients = isAdmin(user) ? await all(`SELECT id,project_id AS projectId,stage,emails,active FROM approval_email_recipients ORDER BY project_id,stage`) : [];
    const workflowAssignments = isAdmin(user) ? await all(`SELECT apa.id,apa.project_id AS projectId,apa.stage,apa.owner_user_id AS ownerUserId,apa.cc_emails AS ccEmails,apa.active,u.full_name AS ownerName,u.email AS ownerEmail,u.role AS ownerRole FROM approval_project_assignments apa LEFT JOIN users u ON u.id=apa.owner_user_id ORDER BY apa.project_id,apa.stage`) : [];
    const emailOutbox = isAdmin(user) ? await all(`SELECT eo.id,eo.request_id AS requestId,eo.stage,eo.event,eo.recipients,eo.subject,eo.status,eo.attempt_count AS attemptCount,eo.queued_at AS queuedAt,eo.sent_at AS sentAt,eo.last_error AS lastError,mr.request_no AS requestNo FROM email_outbox eo LEFT JOIN material_requests mr ON mr.id=eo.request_id ORDER BY eo.queued_at DESC LIMIT 100`) : [];
    const formFieldConfigs = await formFieldRows(undefined, isAdmin(user));
    const uiDisplayRow=await first(`SELECT settings_json AS settingsJson FROM ui_display_settings WHERE scope_key='company_default'`);let uiDisplaySettings=null;try{uiDisplaySettings=uiDisplayRow?JSON.parse(clean(uiDisplayRow.settingsJson)||"{}"):null;}catch{uiDisplaySettings=null;}
    const result={ user, settings, uiDisplaySettings, staffDirectory, productIdentity: productIdentity || VNTECH_IDENTITY, trustStatus, formFieldConfigs, engineRoleProfiles, businessScopes, businessRoleGroupScopes, businessRoleGroups, roleCatalog, organizationUnits, approvalStages: approvalStageCatalog, menuGroups, moduleCatalog, emailSettings, emailRecipients, workflowAssignments, emailOutbox, projects: visibleProjects, projectAccessAll, adminProjects, teams, warehouses, transferWarehouses, materialCategories, adminMaterialCategories, materialSubcategories, adminMaterialSubcategories, materials, adminMaterials, materialAliases, materialNorms, paymentPlans, advanceRequests, siteExpenseClaims, bankAccounts, cashbookEntries, accountingVouchers, hrRecords, laborContracts, officialCorrespondence, legalDocuments, sealManagement, benefitRecords, suppliers, adminSuppliers, contractPayments, productionReports, constructionDailyLogs, constructionDailyLogItems, capitalRecoveryRecords, teamSubcontracts, teamProductionRecords, teamPayments, teamSettlements, requests: enrichedRequests, supplySteps: supplyStepRows, inventory, centralInventory, centralReturns, companyAvailability, transferOrders, workItems, workItemEvents, taskNotifications, boqItems, boqSourceItems, projectContracts, boqVersions, boqImportBatches, boqChangeHistory, contractStockLedger, contractStockBalances, stockReconciliations, purchaseOrders, receipts, issues, returns, stockCounts, users, userScopes, userWarehouseScopes, modulePermissions, allModulePermissions, audits, activeSessions, serverInfo };
    if(!isAdmin(user)){
      const view=new Set(modulePermissions.filter((row)=>Number(row.canView)===1).map((row)=>String(row.moduleKey))); const any=(keys)=>keys.some((key)=>view.has(key));
      if(!any(["dashboard","site_command","dept_legal_hr","dept_legal_labor","dept_legal_correspondence","dept_legal_documents","dept_legal_seal","dept_legal_benefits"])) { result.staffDirectory=[]; }
      if(!any(["requests","approvals","purchasing","supplier_catalog","receiving","delivered"])) { result.requests=[]; result.supplySteps=[]; result.purchaseOrders=[]; result.receipts=[]; }
      if(!any(["warehouse_receipt","warehouse_issue","inventory","stocktake","central_warehouse","material_catalog"])) { result.inventory=[]; result.contractStockLedger=[]; result.contractStockBalances=[]; result.stockReconciliations=[]; result.centralInventory=[]; result.centralReturns=[]; result.companyAvailability=[]; result.transferOrders=[]; result.issues=[]; result.returns=[]; result.stockCounts=[]; }
      if(!any(["boq","dept_project_boq","dept_project_material","project_progress","production","construction","capital_recovery","payments","dept_finance_recovery","dept_finance_payment_plan","dept_finance_advance","dept_finance_site_cost","dept_finance_cashbank","dept_finance_documents","dept_legal_correspondence","dept_legal_documents","dept_legal_seal","dept_legal_benefits","dept_legal_hr","dept_legal_labor"])) { result.boqItems=[]; result.boqSourceItems=[]; result.projectContracts=[]; result.boqVersions=[]; result.boqImportBatches=[]; result.boqChangeHistory=[]; result.contractPayments=[]; result.productionReports=[]; result.capitalRecoveryRecords=[]; result.constructionDailyLogs=[]; result.constructionDailyLogItems=[]; result.paymentPlans=[]; result.advanceRequests=[]; result.siteExpenseClaims=[]; result.bankAccounts=[]; result.cashbookEntries=[]; result.accountingVouchers=[]; result.officialCorrespondence=[]; result.legalDocuments=[]; result.sealManagement=[]; result.benefitRecords=[]; }
      if(!any(["teams","site_command","construction"])) { result.teams=[]; result.teamSubcontracts=[]; result.teamProductionRecords=[]; result.teamPayments=[]; result.teamSettlements=[]; }
      if(!any(["material_catalog","central_warehouse","boq","requests","purchasing","dept_project_material","material_norms"])) { result.materials=[]; result.materialCategories=[]; result.materialSubcategories=[]; result.materialAliases=[]; result.materialNorms=[]; }
      if(!any(["dept_plan_tasks","dept_plan_assign","dept_project_tasks","dept_project_assign","site_command"])) { result.workItems=[]; result.workItemEvents=[]; result.taskNotifications=[]; }
      result.adminProjects=[]; result.adminMaterials=[]; result.adminMaterialCategories=[]; result.adminMaterialSubcategories=[]; result.adminSuppliers=[]; result.users=[]; result.userScopes=[]; result.userWarehouseScopes=[]; result.allModulePermissions=[]; result.audits=[]; result.activeSessions=[]; result.serverInfo=null; result.trustStatus=null; result.emailSettings=null; result.emailRecipients=[]; result.emailOutbox=[];
    }
    return result;
}
async function handleSetup(payload, request) {
    const count = await first(`SELECT COUNT(*) AS count FROM users`);
    if (Number(count?.count ?? 0) > 0)
        return jsonError("Hệ thống đã được khởi tạo.", 409);
    const companyName = clean(payload.companyName);
    const fullName = clean(payload.fullName);
    const username = clean(payload.username).toLowerCase();
    const email = clean(payload.email).toLowerCase() || null;
    const password = clean(payload.password);
    if (!companyName || !fullName || !username)
        return jsonError("Cần nhập đủ tên công ty, quản trị viên và tên đăng nhập.");
    const passwordError = passwordPolicyError(password);
    if (passwordError) return jsonError(passwordError);
    const adminId = id("USR");
    const stamp = now();
    const rootOrganization = await resolveOrganizationUnit("VNTECH");
    await env.DB.prepare(`INSERT INTO users (id,employee_code,full_name,username,email,password_hash,role,department,organization_unit_id,approval_limit,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .bind(adminId, "ADMIN-001", fullName, username, email, await hashPassword(password), "admin", clean(rootOrganization?.name) || "Công ty VNTECH", rootOrganization?.id || null, 999999999999, 1, stamp, stamp).run();
    await seedMasters(adminId, companyName);
    await audit(adminId, "SYSTEM_SETUP", "company_settings", "SETTINGS", null, { companyName }, request);
    const token = await createSession(adminId, request);
    return Response.json({ ok: true }, { status: 201, headers: { "Set-Cookie": sessionCookie(token) } });
}
async function handleLogin(payload, request) {
    const username = clean(payload.username).toLowerCase();
    const password = clean(payload.password);
    const row = await first(`SELECT id,full_name AS fullName,username,email,role,department,password_hash AS passwordHash,must_change_password AS mustChangePassword FROM users WHERE lower(username)=? AND active=1`, username);
    if (!row?.passwordHash || !(await verifyPassword(password, row.passwordHash))) return jsonError("Tên đăng nhập hoặc mật khẩu không đúng.", 401);
    const [,storedIterations] = String(row.passwordHash).split("$");
    if (Number(storedIterations) < PASSWORD_PBKDF2_ITERATIONS) await env.DB.prepare(`UPDATE users SET password_hash=?,updated_at=? WHERE id=?`).bind(await hashPassword(password), now(), row.id).run();
    const token = await createSession(row.id, request);
    await audit(row.id, "LOGIN", "user", row.id, null, null, request);
    return Response.json({ ok: true, mustChangePassword: Boolean(row.mustChangePassword) }, { headers: { "Set-Cookie": sessionCookie(token) } });
}

function materialSemanticText(row,aliasText=""){return [row.name,row.specification,row.brand,aliasText].map(clean).filter(Boolean).join(" | ");}
async function materialEmbedding(row,aliasText=""){
    const textValue=materialSemanticText(row,aliasText),semanticHash=await sha256(normalizeMaterialText(textValue));
    const configuredProvider=clean(process.env.VNTECH_EMBEDDING_PROVIDER||"local_feature_v1").toLowerCase();
    const configuredModel=clean(process.env.VNTECH_EMBEDDING_MODEL||(configuredProvider==="ollama"?"nomic-embed-text":configuredProvider==="openai_compatible"?"text-embedding-3-small":"builtin-96"));
    const cached=await first(`SELECT id,vector_json AS vectorJson FROM material_embeddings WHERE material_id=? AND provider=? AND model=? AND semantic_hash=?`,row.id,configuredProvider,configuredModel,semanticHash);
    if(cached){try{const vector=JSON.parse(clean(cached.vectorJson));if(Array.isArray(vector)&&vector.length)return{provider:configuredProvider,model:configuredModel,vector,fallback:false,cached:true};}catch{}}
    const embedded=await embedText(textValue,{provider:configuredProvider,model:configuredModel});const actualHash=semanticHash,existing=await first(`SELECT id FROM material_embeddings WHERE material_id=? AND provider=? AND model=?`,row.id,embedded.provider,embedded.model);
    if(existing)await env.DB.prepare(`UPDATE material_embeddings SET semantic_hash=?,vector_json=?,dimension=?,updated_at=? WHERE id=?`).bind(actualHash,JSON.stringify(embedded.vector),embedded.vector.length,now(),existing.id).run();
    else await env.DB.prepare(`INSERT INTO material_embeddings(id,material_id,provider,model,semantic_hash,vector_json,dimension,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id("EMB"),row.id,embedded.provider,embedded.model,actualHash,JSON.stringify(embedded.vector),embedded.vector.length,now(),now()).run();
    return embedded;
}
async function materialSourceCandidates(source,materials,aliasesByMaterial,historyRows,topK=5){
    const sourceText=[source.contractMaterialName,source.note].map(clean).filter(Boolean).join(" | "); if(!sourceText)return[];
    const sourceEmbedding=await embedText(sourceText,{provider:clean(process.env.VNTECH_EMBEDDING_PROVIDER||"local_feature_v1")});const sourceNorm=normalizeMaterialText(sourceText);
    const historyMap=new Map(historyRows.filter((h)=>clean(h.sourceNormalized)===sourceNorm).map((h)=>[clean(h.materialId),Number(h.confirmCount||1)]));
    let pool=materials.filter((m)=>Number(m.active)!==0);const sourceSystem=canonicalMeCode(source.sourceSystemCode||"");if(sourceSystem&&sourceSystem!=="KHAC"){const same=pool.filter((m)=>canonicalMeCode(m.system)===sourceSystem);if(same.length)pool=same;}
    pool=pool.map((m)=>{const aliasText=(aliasesByMaterial.get(clean(m.id))||[]).join(" | "),textValue=materialSemanticText(m,aliasText);const gate=materialCandidateGate({...source,systemCode:source.sourceSystemCode},m,sourceText,textValue);const pre=tokenSimilarity(sourceText,textValue)+(source.unit&&m.unit&&normalizeMaterialText(source.unit)===normalizeMaterialText(m.unit)?.18:0)+(historyMap.has(clean(m.id))?.5:0);return{m,aliasText,textValue,pre,gate};}).filter((entry)=>entry.gate.accepted).sort((a,b)=>b.pre-a.pre).slice(0,60);
    const ranked=[];for(const entry of pool){const material=entry.m,candidateEmbedding=await materialEmbedding(material,entry.aliasText);ranked.push(scoreMaterialCandidate({source:{...source,systemCode:source.sourceSystemCode},material,sourceText,candidateText:entry.textValue,historyCount:historyMap.get(clean(material.id))||0,sourceEmbedding:sourceEmbedding.vector,candidateEmbedding:candidateEmbedding.vector,provider:sourceEmbedding.provider,providerFallback:Boolean(sourceEmbedding.fallback||candidateEmbedding.fallback)}));}
    return ranked.sort((a,b)=>b.finalScore-a.finalScore).slice(0,Math.max(1,Math.min(5,Number(topK)||5)));
}

async function handleAction(action, payload, user, request) {
    const stamp = now();
    if (action === "save_project_contract") {
      const projectId=clean(payload.projectId); if(!(await canAccessProject(user,projectId,true))) throw new Error("Không có quyền sửa hợp đồng dự án này.");
      const contractId=clean(payload.contractId); const contractNo=clean(payload.contractNo); const contractName=clean(payload.contractName); if(!contractNo||!contractName) throw new Error("Số hợp đồng và tên hợp đồng là bắt buộc.");
      const contractType=["main","addendum","other"].includes(clean(payload.contractType))?clean(payload.contractType):"main"; const parentContractId=clean(payload.parentContractId)||null; const note=clean(payload.note)||null;
      if(parentContractId){const parent=await first(`SELECT id FROM project_contracts WHERE id=? AND project_id=?`,parentContractId,projectId);if(!parent)throw new Error("Hợp đồng/phụ lục cha không thuộc dự án.");}
      if(contractId){const old=await first(`SELECT * FROM project_contracts WHERE id=? AND project_id=?`,contractId,projectId);if(!old)throw new Error("Không tìm thấy hợp đồng.");await env.DB.prepare(`UPDATE project_contracts SET contract_no=?,contract_name=?,contract_type=?,parent_contract_id=?,signed_at=?,effective_from=?,effective_to=?,note=?,updated_at=? WHERE id=?`).bind(contractNo,contractName,contractType,parentContractId,clean(payload.signedAt)||null,clean(payload.effectiveFrom)||null,clean(payload.effectiveTo)||null,note,stamp,contractId).run();await audit(user.id,"UPDATE","project_contract",contractId,old,{contractNo,contractName,contractType,parentContractId},request);return{message:"Đã cập nhật hợp đồng."};}
      const newId=id("PCON");const hasPrimary=await first(`SELECT id FROM project_contracts WHERE project_id=? AND is_primary=1`,projectId);await env.DB.prepare(`INSERT INTO project_contracts(id,project_id,contract_no,contract_name,contract_type,parent_contract_id,status,is_primary,signed_at,effective_from,effective_to,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,projectId,contractNo,contractName,contractType,parentContractId,"active",hasPrimary?0:1,clean(payload.signedAt)||null,clean(payload.effectiveFrom)||null,clean(payload.effectiveTo)||null,note,user.id,stamp,stamp).run();await audit(user.id,"CREATE","project_contract",newId,null,{projectId,contractNo,contractName,contractType,parentContractId},request);return{message:"Đã tạo hợp đồng cho dự án.",contractId:newId};
    }
    if (action === "set_project_contract_status") {
      const contractId=clean(payload.contractId),active=payload.active===true||["1","true","on"].includes(clean(payload.active).toLowerCase());const row=await first(`SELECT * FROM project_contracts WHERE id=?`,contractId);if(!row)throw new Error("Không tìm thấy hợp đồng.");if(!(await canAccessProject(user,row.project_id,true)))throw new Error("Không có quyền tại dự án này.");if(!active){const bal=await first(`SELECT COALESCE(SUM(ABS(balance)),0) AS residual FROM (SELECT warehouse_id,material_id,SUM(quantity_delta) AS balance FROM contract_stock_ledger WHERE contract_id=? GROUP BY warehouse_id,material_id HAVING ABS(SUM(quantity_delta))>0.0000001) x`,contractId);if(numberValue(bal?.residual)>0)throw new Error("Hợp đồng còn tồn kế toán theo Contract; phải điều chuyển/hoàn trả hết trước khi ngừng áp dụng.");}
      await env.DB.prepare(`UPDATE project_contracts SET status=?,updated_at=? WHERE id=?`).bind(active?"active":"inactive",stamp,contractId).run();await audit(user.id,active?"ACTIVATE":"DISABLE","project_contract",contractId,row,{status:active?"active":"inactive"},request);return{message:active?"Đã kích hoạt hợp đồng.":"Đã ngừng áp dụng hợp đồng."};
    }
    if (action === "delete_project_contract") {
      const contractId=clean(payload.contractId);const row=await first(`SELECT * FROM project_contracts WHERE id=?`,contractId);if(!row)throw new Error("Không tìm thấy hợp đồng.");if(!(await canAccessProject(user,row.project_id,true)))throw new Error("Không có quyền tại dự án này.");if(clean(payload.confirmText)!==`XOA ${clean(row.contract_no)}`)throw new Error(`Xác nhận chưa đúng. Hãy nhập “XOA ${clean(row.contract_no)}”.`);const usage=await first(`SELECT (SELECT COUNT(*) FROM project_contracts WHERE parent_contract_id=?)+(SELECT COUNT(*) FROM boq_versions WHERE contract_id=?)+(SELECT COUNT(*) FROM material_request_items WHERE contract_id=?)+(SELECT COUNT(*) FROM purchase_order_items WHERE contract_id=?)+(SELECT COUNT(*) FROM goods_receipt_items WHERE contract_id=?)+(SELECT COUNT(*) FROM contract_stock_ledger WHERE contract_id=? OR counterparty_contract_id=?) AS count`,contractId,contractId,contractId,contractId,contractId,contractId,contractId);if(Number(usage?.count||0)>0)throw new Error("Hợp đồng vẫn còn phụ lục/BOQ Version/giao dịch/lịch sử. Hãy xóa dữ liệu downstream trước, sau đó xóa lại hợp đồng.");const replacement=Number(row.is_primary||0)===1?await first(`SELECT id FROM project_contracts WHERE project_id=? AND id<>? ORDER BY status='active' DESC,created_at,id LIMIT 1`,row.project_id,contractId):null;const statements=[];if(replacement?.id)statements.push(env.DB.prepare(`UPDATE project_contracts SET is_primary=1,updated_at=? WHERE id=?`).bind(stamp,replacement.id));statements.push(env.DB.prepare(`DELETE FROM project_contracts WHERE id=?`).bind(contractId));await env.DB.batch(statements);await audit(user.id,"DELETE","project_contract",contractId,row,{replacementPrimaryContractId:replacement?.id||null},request);return{message:"Đã xóa hợp đồng sau khi xác nhận không còn phụ lục/BOQ Version/giao dịch; hợp đồng mặc định đã được chuyển tự động nếu cần."};
    }
    if (action === "save_boq_version") {
      const projectId=clean(payload.projectId);if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền BOQ dự án này.");const ctx=await resolveContractContext(projectId,payload.contractId);const current=await first(`SELECT COALESCE(MAX(version_no),0) AS maxVersion FROM boq_versions WHERE contract_id=?`,ctx.contract.id);const versionNo=Number(payload.versionNo||0)>0?Number(payload.versionNo):Number(current?.maxVersion||0)+1;const versionId=id("BQVER");if(payload.makeActive!==false)await env.DB.prepare(`UPDATE boq_versions SET active=0,status='superseded',updated_at=? WHERE contract_id=? AND active=1`).bind(stamp,ctx.contract.id).run();await env.DB.prepare(`INSERT INTO boq_versions(id,project_id,contract_id,version_no,version_code,version_name,revision_type,source_file_name,status,active,effective_at,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(versionId,projectId,ctx.contract.id,versionNo,clean(payload.versionCode)||`V${versionNo}`,clean(payload.versionName)||`BOQ V${versionNo}`,clean(payload.revisionType)||"revision",clean(payload.sourceFileName)||null,payload.makeActive===false?"draft":"active",payload.makeActive===false?0:1,clean(payload.effectiveAt)||null,user.id,stamp,stamp).run();await audit(user.id,"CREATE","boq_version",versionId,null,{projectId,contractId:ctx.contract.id,versionNo},request);return{message:`Đã tạo BOQ V${versionNo} cho ${ctx.contract.contractNo}.`,boqVersionId:versionId};
    }
    if (action === "preview_material_dependencies") {
      requireRole(user,["admin"]);const materialId=clean(payload.materialId);const material=await first(`SELECT id,code,name,active FROM materials WHERE id=?`,materialId);if(!material)throw new Error("Không tìm thấy mã vật tư.");const dependency=await materialDependencySummary(materialId);return{message:dependency.canHardDelete?"Mã chưa phát sinh dữ liệu, có thể xóa thật.":`Mã đang có ${dependency.total} tham chiếu/lịch sử. Có thể sửa, remap/merge hoặc ngừng sử dụng.`,material,dependency};
    }
    if (action === "delete_selected_materials") {
      requireRole(user,["admin"]);const ids=[...new Set((Array.isArray(payload.materialIds)?payload.materialIds:[]).map(clean).filter(Boolean))];if(!ids.length)throw new Error("Chưa chọn mã vật tư.");if(ids.length>5000)throw new Error("Mỗi lần xử lý tối đa 5.000 mã.");const allowed=[],blocked=[];for(const mid of ids){const m=await first(`SELECT id,code,name FROM materials WHERE id=?`,mid);if(!m)continue;const dep=await materialDependencySummary(mid);(dep.canHardDelete?allowed:blocked).push({...m,dependency:dep});}if(payload.preview===true||clean(payload.preview)==="1")return{message:`Có thể xóa ${allowed.length} mã; ${blocked.length} mã bị chặn do đã phát sinh dữ liệu.`,allowed,blocked};if(clean(payload.confirmText)!==`XOA ${allowed.length}`)throw new Error(`Xác nhận chưa đúng. Hãy nhập “XOA ${allowed.length}”.`);const statements=[];for(const row of allowed){for(const table of ["boq_mapping_candidates","material_embeddings","material_aliases","material_code_history","material_external_codes","material_uom_conversions"])statements.push(env.DB.prepare(`DELETE FROM ${table} WHERE material_id=?`).bind(row.id));statements.push(env.DB.prepare(`DELETE FROM materials WHERE id=?`).bind(row.id));}if(statements.length)await env.DB.batch(statements);await audit(user.id,"DELETE_SELECTED_UNUSED","material_catalog","SELECTION",null,{deleted:allowed.map(x=>x.code),blocked:blocked.map(x=>x.code)},request);return{message:`Đã xóa ${allowed.length} mã chưa phát sinh dữ liệu; ${blocked.length} mã được giữ lại để bảo toàn lịch sử.`,deleted:allowed.length,blocked:blocked.length};
    }
    if (action === "factory_reset_preview") {
      requireRole(user,["admin"]);
      const specs=[
        ["Dự án","projects"],["Hợp đồng","project_contracts"],["BOQ","project_boq_items"],["Mã vật tư","materials"],["Đề nghị mua hàng","material_requests"],["PO","purchase_orders"],["Phiếu nhận","goods_receipts"],["Giao dịch kho","stock_movements"],["Tổ đội","teams"],["Nhiệm vụ","work_items"],["Người dùng","users"]
      ];const counts={};let total=0;for(const[label,table]of specs){const row=await first(`SELECT COUNT(*) AS count FROM ${table}`);counts[label]=Number(row?.count||0);total+=counts[label];}
      return{enabled:clean(process.env.VNTECH_ALLOW_FACTORY_RESET)==="1",total,counts,message:clean(process.env.VNTECH_ALLOW_FACTORY_RESET)==="1"?"Factory Reset đã được mở trên server. Hãy tạo backup ngoài ứng dụng trước khi thực hiện.":"Factory Reset đang khóa. Chỉ mở trên môi trường test bằng VNTECH_ALLOW_FACTORY_RESET=1."};
    }
    if (action === "factory_reset_execute") {
      requireRole(user,["admin"]);
      if(clean(process.env.VNTECH_ALLOW_FACTORY_RESET)!=="1")throw new Error("Khôi phục cài đặt gốc đang khóa. Chỉ mở bằng VNTECH_ALLOW_FACTORY_RESET=1 trên môi trường test.");
      if(clean(payload.confirmText)!=="KHOI PHUC CAI DAT GOC")throw new Error("Thiếu chuỗi xác nhận KHOI PHUC CAI DAT GOC.");
      if(payload.backupConfirmed!==true)throw new Error("Phải xác nhận đã tạo backup PostgreSQL/dữ liệu trước khi Factory Reset.");
      const password=clean(payload.password);const current=await first(`SELECT password_hash AS passwordHash FROM users WHERE id=? AND active=1`,user.id);if(!current?.passwordHash||!(await verifyPassword(password,current.passwordHash)))throw new Error("Mật khẩu Quản trị viên không đúng. Factory Reset đã bị hủy.");
      // BOQ source/project rows have a deliberate bidirectional trace. Break only that trace before ordered deletion.
      await env.DB.batch([env.DB.prepare(`UPDATE boq_source_items SET project_boq_item_id=NULL`),env.DB.prepare(`UPDATE project_boq_items SET source_item_id=NULL`)]);
      const deleteTables=[
        "vntech_license_transfer_requests","task_notifications","work_item_events","approval_stage_decisions","boq_mapping_audit","boq_mapping_candidates","boq_mapping_runs","boq_material_components","boq_price_import_items","boq_price_import_batches","boq_change_history","material_mapping_history","procurement_allocations","contract_ownership_transfers","contract_stock_reconciliations","contract_stock_ledger","stock_reservations","transfer_order_items","transfer_orders","central_return_items","central_returns","material_return_items","material_returns","stock_issue_items","stock_issues","stock_count_items","stock_counts","stock_movements","supply_workflow_steps","email_outbox","request_comments","attachments","goods_receipt_items","goods_receipts","purchase_order_items","purchase_orders","approvals","material_request_items","material_requests","custom_field_values","project_boq_items","boq_source_items","boq_import_batches","boq_versions","project_contracts","contract_payments","capital_recovery_records","production_reports","team_payments","team_production_records","team_settlements","team_subcontracts","teams","work_items","project_close_checks","warehouse_locations","user_warehouse_scopes","user_project_scopes","user_module_permissions","sessions","audit_logs","material_aliases","material_embeddings","material_external_codes","material_uom_conversions","material_code_history","material_mar_approvals","materials","approval_email_recipients","document_sequences","warehouses","projects","company_settings","email_settings","users"
      ];
      const unique=[...new Set(deleteTables)];const statements=unique.map(table=>env.DB.prepare(`DELETE FROM ${table}`));await env.DB.batch(statements);
      // Restore only version-owned defaults. User/business data stays empty so the next request returns setupRequired, exactly like a fresh install after migrations.
      const stamp=now();
      await env.DB.batch([
        env.DB.prepare(`INSERT OR IGNORE INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind("WH-CENTRAL","KHO-TONG","Kho trung tâm","central",null,null,null,1,stamp,stamp),
        env.DB.prepare(`INSERT OR IGNORE INTO email_settings (id,enabled,smtp_port,security,sender_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`).bind("EMAIL",0,587,"starttls","VNTECH ERP",stamp,stamp)
      ]);
      return{message:"Đã khôi phục dữ liệu về trạng thái cài mới của phiên bản hiện tại. Phiên đăng nhập đã bị xóa; hãy tải lại trang để thực hiện thiết lập ban đầu.",setupRequired:true};
    }
    if (action === "reset_material_catalog_test") {
      requireRole(user,["admin"]);if(clean(process.env.VNTECH_ALLOW_TEST_DATA_RESET)!=="1")throw new Error("Reset dữ liệu test đang khóa. Chỉ mở bằng VNTECH_ALLOW_TEST_DATA_RESET=1 trên môi trường test.");if(clean(payload.confirmText)!=="RESET DANH MUC VAT TU TEST"||clean(payload.confirmHistory)!=="TOI HIEU SE XOA LICH SU LIEN QUAN")throw new Error("Thiếu xác nhận mạnh cho Reset danh mục vật tư test.");const usage=await first(`SELECT (SELECT COUNT(*) FROM material_request_items)+(SELECT COUNT(*) FROM purchase_order_items)+(SELECT COUNT(*) FROM goods_receipt_items)+(SELECT COUNT(*) FROM stock_movements)+(SELECT COUNT(*) FROM contract_stock_ledger) AS count`);if(Number(usage?.count||0)>0&&!payload.forceBusinessReset)throw new Error("Môi trường test đang có lịch sử nghiệp vụ. Muốn reset cả dữ liệu liên quan phải bật forceBusinessReset và xác nhận lại.");if(Number(usage?.count||0)>0)throw new Error("FULL W2 không tự phá chứng từ nghiệp vụ đã có. Hãy dùng Chuyển/Hợp nhất mã hoặc khôi phục database test sạch trước khi reset.");const count=await first(`SELECT COUNT(*) AS count FROM materials WHERE upper(code)<>'__BOQ_STRUCTURE__'`);await env.DB.batch([env.DB.prepare(`DELETE FROM material_aliases`),env.DB.prepare(`DELETE FROM material_embeddings`),env.DB.prepare(`DELETE FROM material_mapping_history`),env.DB.prepare(`DELETE FROM material_external_codes`),env.DB.prepare(`DELETE FROM material_uom_conversions`),env.DB.prepare(`DELETE FROM material_code_history`),env.DB.prepare(`DELETE FROM materials WHERE upper(code)<>'__BOQ_STRUCTURE__'`)]);await audit(user.id,"RESET_TEST","material_catalog","ALL",null,{deleted:Number(count?.count||0)},request);return{message:`Đã reset ${Number(count?.count||0)} mã vật tư test chưa có lịch sử nghiệp vụ.`};
    }
    if (action === "transfer_contract_ownership") {
      requireRole(user,["warehouse","commander","admin"]);const projectId=clean(payload.projectId),warehouseId=clean(payload.warehouseId),materialId=clean(payload.materialId),sourceContractId=clean(payload.sourceContractId),destinationContractId=clean(payload.destinationContractId),qty=numberValue(payload.quantity),reason=clean(payload.reason);if(!projectId||!warehouseId||!materialId||!sourceContractId||!destinationContractId||sourceContractId===destinationContractId||qty<=0||!reason)throw new Error("Điều chuyển sở hữu Contract cần đủ kho, vật tư, Contract nguồn/đích, số lượng và lý do.");if(!(await canAccessProject(user,projectId,true))||!(await canAccessWarehouse(user,warehouseId,true)))throw new Error("Không có quyền tại dự án/kho này.");const src=await first(`SELECT id,project_id AS projectId,contract_no AS contractNo,status FROM project_contracts WHERE id=?`,sourceContractId),dst=await first(`SELECT id,project_id AS projectId,contract_no AS contractNo,status FROM project_contracts WHERE id=?`,destinationContractId);if(!src||!dst||clean(src.status)!=='active'||clean(dst.status)!=='active')throw new Error("Contract nguồn/đích không hợp lệ hoặc đã ngừng áp dụng.");if(clean(src.projectId)!==projectId||clean(dst.projectId)!==projectId)throw new Error("Điều chuyển ownership A→B tại cùng kho chỉ áp dụng trong cùng dự án. Cross-project phải đi qua Phiếu điều chuyển vật lý/Transit.");const available=await contractBalance(projectId,sourceContractId,warehouseId,materialId);if(qty>available+1e-9)throw new Error(`Contract nguồn chỉ còn ${available} tại kho này.`);const seq=await first(`SELECT COUNT(*) AS count FROM contract_ownership_transfers`),transferNo=`COT-${stamp.slice(0,10).replaceAll('-','')}-${String(Number(seq?.count||0)+1).padStart(5,'0')}`,transferId=id("COT");await env.DB.batch([env.DB.prepare(`INSERT INTO contract_ownership_transfers(id,transfer_no,warehouse_id,material_id,source_project_id,source_contract_id,destination_project_id,destination_contract_id,quantity,reason,status,posted_by,posted_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(transferId,transferNo,warehouseId,materialId,projectId,sourceContractId,projectId,destinationContractId,qty,reason,"posted",user.id,stamp,stamp),contractLedgerStatement({projectId,contractId:sourceContractId,warehouseId,materialId,movementType:"OWNERSHIP_TRANSFER_OUT",quantityDelta:-qty,occurredAt:stamp,referenceType:"contract_ownership_transfer",referenceId:transferId,counterpartyContractId:destinationContractId,actorUserId:user.id,note:reason}),contractLedgerStatement({projectId,contractId:destinationContractId,warehouseId,materialId,movementType:"OWNERSHIP_TRANSFER_IN",quantityDelta:qty,occurredAt:stamp,referenceType:"contract_ownership_transfer",referenceId:transferId,counterpartyContractId:sourceContractId,actorUserId:user.id,note:reason})]);await audit(user.id,"TRANSFER_OWNERSHIP","contract_stock",transferId,null,{transferNo,projectId,warehouseId,materialId,sourceContractId,destinationContractId,quantity:qty,reason,physicalMovement:false},request);return{message:`Đã chuyển sở hữu ${qty} từ ${src.contractNo} sang ${dst.contractNo}; không tạo chuyển động kho vật lý.`,transferNo};
    }
    if (action === "reconcile_contract_stock") {
      requireRole(user,["warehouse","commander","admin"]);const projectId=clean(payload.projectId),warehouseId=clean(payload.warehouseId);if(!projectId||!warehouseId)throw new Error("Đối soát cần chọn đúng một dự án và kho.");if(!(await canAccessProject(user,projectId,false))||!(await canAccessWarehouse(user,warehouseId,false)))throw new Error("Không có quyền đối soát kho này.");const rows=await all(`WITH physical AS (SELECT material_id,COALESCE(SUM(CASE WHEN to_warehouse_id=? THEN quantity ELSE 0 END)-SUM(CASE WHEN from_warehouse_id=? THEN quantity ELSE 0 END),0) AS qty FROM stock_movements GROUP BY material_id),owned AS (SELECT material_id,COALESCE(SUM(quantity_delta),0) AS qty FROM contract_stock_ledger WHERE project_id=? AND warehouse_id=? GROUP BY material_id),ids AS (SELECT material_id FROM physical UNION SELECT material_id FROM owned) SELECT ids.material_id AS materialId,m.code AS materialCode,m.name AS materialName,COALESCE(physical.qty,0) AS physicalQty,COALESCE(owned.qty,0) AS contractQty,COALESCE(physical.qty,0)-COALESCE(owned.qty,0) AS differenceQty FROM ids JOIN materials m ON m.id=ids.material_id LEFT JOIN physical ON physical.material_id=ids.material_id LEFT JOIN owned ON owned.material_id=ids.material_id ORDER BY m.code`,warehouseId,warehouseId,projectId,warehouseId);const statements=[];let mismatch=0;for(const row of rows){const diff=numberValue(row.differenceQty),status=Math.abs(diff)<1e-7?"balanced":"mismatch";if(status==="mismatch")mismatch++;statements.push(env.DB.prepare(`INSERT INTO contract_stock_reconciliations(id,project_id,warehouse_id,material_id,physical_qty,contract_qty,difference_qty,status,checked_by,checked_at,note,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("REC"),projectId,warehouseId,row.materialId,numberValue(row.physicalQty),numberValue(row.contractQty),diff,status,user.id,stamp,clean(payload.note)||null,stamp));}if(statements.length)await env.DB.batch(statements);await audit(user.id,"RECONCILE","contract_stock",`${projectId}:${warehouseId}`,null,{rows:rows.length,mismatch},request);return{message:mismatch?`Đối soát xong: ${mismatch}/${rows.length} vật tư lệch giữa tồn vật lý và tổng ownership Contract.`:`Đối soát xong: ${rows.length} vật tư cân bằng.`,rows,mismatch};
    }
    if (action === "preview_request_import") {
      requireRole(user,["engineer","commander","admin"]);
      const projectId=clean(payload.projectId),inputLines=Array.isArray(payload.lines)?payload.lines:[];
      if(!projectId||!inputLines.length)throw new Error("Chọn dự án và file có ít nhất một dòng vật tư trước khi đối chiếu.");
      if(inputLines.length>100)throw new Error("Mỗi phiếu đề nghị được nhập tối đa 100 dòng vật tư.");
      if(!(await canAccessProject(user,projectId,true)))throw new Error("Tài khoản không được lập đơn cho dự án này.");
      const ctx=await resolveContractContext(projectId,payload.contractId,payload.boqVersionId,{requireVersion:true});
      const contractId=clean(ctx.contract.id),boqVersionId=clean(ctx.version.id);
      const boqRows=await all(`SELECT pbi.id,pbi.material_id AS materialId,pbi.contract_line_ref AS contractLineRef,pbi.line_no AS lineNo,pbi.boq_code AS boqCode,pbi.contract_material_code AS contractMaterialCode,pbi.approved_material_code AS approvedMaterialCode,pbi.description AS materialName,COALESCE(NULLIF(bsi.unit,''),m.unit) AS unit,pbi.contract_qty AS contractQty,pbi.item_type AS itemType,m.code AS materialCode,m.name AS standardMaterialName FROM project_boq_items pbi LEFT JOIN materials m ON m.id=pbi.material_id LEFT JOIN boq_source_items bsi ON bsi.id=pbi.source_item_id WHERE pbi.project_id=? AND pbi.contract_id=? AND pbi.boq_version_id=? AND pbi.active=1 AND pbi.row_role IN ('material','component')`,projectId,contractId,boqVersionId);
      const materials=await all(`SELECT id,code,name,unit,standard_price AS standardPrice FROM materials WHERE active=1`);
      const byId=new Map(materials.map(row=>[clean(row.id),row])),byCode=new Map(materials.map(row=>[clean(row.code).toUpperCase(),row]));
      const normalizedName=(v)=>normalizeMaterialText(v).replace(/\s+/g," ").trim();
      const inventoryRows=await all(`SELECT material_id AS materialId,COALESCE(SUM(CASE WHEN to_warehouse_id IN (SELECT id FROM warehouses WHERE project_id=? AND active=1) THEN quantity ELSE 0 END)-SUM(CASE WHEN from_warehouse_id IN (SELECT id FROM warehouses WHERE project_id=? AND active=1) THEN quantity ELSE 0 END),0) AS qty FROM stock_movements GROUP BY material_id`,projectId,projectId);
      const stockByMaterial=new Map(inventoryRows.map(row=>[clean(row.materialId),numberValue(row.qty)]));
      const cumulative=await all(`SELECT mri.boq_item_id AS boqItemId,COALESCE(SUM(CASE WHEN mr.status NOT IN ('cancelled','rejected') THEN mri.requested_qty ELSE 0 END),0) AS requestedQty,COALESCE(SUM(mri.ordered_qty),0) AS orderedQty,COALESCE(SUM(mri.received_qty),0) AS receivedQty FROM material_request_items mri JOIN material_requests mr ON mr.id=mri.request_id WHERE mr.project_id=? AND mri.contract_id=? AND mri.boq_version_id=? GROUP BY mri.boq_item_id`,projectId,contractId,boqVersionId);
      const cumulativeByBoq=new Map(cumulative.map(row=>[clean(row.boqItemId),row]));
      const results=[];
      for(let index=0;index<inputLines.length;index+=1){
        const source=inputLines[index]||{};const rawCode=clean(source.materialCode||source.internalMaterialCode).toUpperCase(),rawName=clean(source.materialName),rawUnit=clean(source.unit),rawLine=clean(source.contractLineNo),rawBoq=clean(source.boqCode),rawBoqId=clean(source.boqItemId);
        let material=byId.get(clean(source.materialId))||(rawCode?byCode.get(rawCode):null);
        if(!material&&rawName){const nameKey=normalizedName(rawName);const candidates=materials.filter(row=>normalizedName(row.name)===nameKey&&(!rawUnit||normalizedName(row.unit)===normalizedName(rawUnit)));if(candidates.length===1)material=candidates[0];}
        let candidates=boqRows.filter(row=>!rawBoqId||clean(row.id)===rawBoqId);
        if(rawLine)candidates=candidates.filter(row=>clean(row.contractLineRef||row.lineNo)===rawLine);
        if(rawBoq)candidates=candidates.filter(row=>clean(row.boqCode).toUpperCase()===rawBoq.toUpperCase());
        if(material)candidates=candidates.filter(row=>clean(row.materialId)===clean(material.id));
        if(!material&&rawCode)candidates=candidates.filter(row=>[row.materialCode,row.contractMaterialCode,row.approvedMaterialCode].some(v=>clean(v).toUpperCase()===rawCode));
        if(!material&&rawName){const n=normalizedName(rawName);const exactName=candidates.filter(row=>normalizedName(row.materialName||row.standardMaterialName)===n);if(exactName.length)candidates=exactName;}
        let matched=null,status="not_found",reason="Không tìm thấy dòng BOQ tương đồng trong Hợp đồng/BOQ Version đang chọn.";
        if(candidates.length===1){matched=candidates[0];status="exact";reason="Đã đối chiếu đúng một dòng BOQ.";}
        else if(candidates.length>1){status="review";reason=`Tìm thấy ${candidates.length} dòng có thể khớp; cần chọn đúng dòng BOQ.`;}
        if(matched&&!material&&matched.materialId)material=byId.get(clean(matched.materialId));
        const cum=matched?cumulativeByBoq.get(clean(matched.id)):null;const requestedQty=numberValue(cum?.requestedQty),orderedQty=numberValue(cum?.orderedQty),receivedQty=numberValue(cum?.receivedQty),contractQty=numberValue(matched?.contractQty),stockQty=material?numberValue(stockByMaterial.get(clean(material.id))):0,pendingDeliveryQty=Math.max(0,orderedQty-receivedQty),remainingRequestQty=Math.max(0,contractQty-requestedQty);
        results.push({...source,materialId:clean(material?.id)||clean(source.materialId),materialCode:clean(material?.code)||rawCode,materialName:clean(material?.name)||rawName,unit:clean(material?.unit)||rawUnit,unitPrice:numberValue(source.unitPrice)||numberValue(material?.standardPrice),boqItemId:clean(matched?.id),contractId,boqVersionId,contractLineNo:clean(matched?.contractLineRef||matched?.lineNo)||rawLine,boqCode:clean(matched?.boqCode)||rawBoq,contractQty,stockQty,requestedCumulativeQty:requestedQty,orderedCumulativeQty:orderedQty,receivedCumulativeQty:receivedQty,pendingDeliveryQty,remainingRequestQty,cumulativeAfterRequest:requestedQty+numberValue(source.quantity),matchStatus:status,matchReason:reason,matchCandidates:candidates.slice(0,12).map(row=>({boqItemId:row.id,contractLineNo:row.contractLineRef||row.lineNo,boqCode:row.boqCode,materialCode:row.materialCode,materialName:row.materialName,unit:row.unit,contractQty:row.contractQty}))});
      }
      return{message:`Đã đối chiếu ${results.length} dòng với ${ctx.contract.contractNo} · ${ctx.version.versionCode}.`,projectId,contractId,boqVersionId,lines:results,summary:{exact:results.filter(r=>r.matchStatus==="exact").length,review:results.filter(r=>r.matchStatus==="review").length,notFound:results.filter(r=>r.matchStatus==="not_found").length}};
    }
    if (action === "create_request") {
      requireRole(user, ["engineer", "commander", "admin"]);
      const projectId = clean(payload.projectId); const neededAt = clean(payload.neededAt); const area = clean(payload.area);
      // Source contract retained: projectId, null, sourceWarehouseId; team is assigned only at issue step.
      const lines = Array.isArray(payload.lines) ? payload.lines : [];
      if (!projectId || !lines.length) throw new Error("Phiếu đề nghị phải có dự án và ít nhất một dòng vật tư.");
      if (lines.length > 100) throw new Error("Mỗi phiếu đề nghị được nhập tối đa 100 dòng vật tư.");
      const headerValues = { neededAt, area, priority: clean(payload.priority), purpose: clean(payload.purpose) };
      for (const key of Object.keys(headerValues)) if (await isRequiredField("request_header", key, key === "neededAt") && !headerValues[key]) {
        const cfg = (await formFieldRows("request_header")).find((row) => clean(row.fieldKey) === key); throw new Error(`${clean(cfg?.displayName) || key} đang được Quản trị viên cấu hình bắt buộc.`);
      }
      if (!(await canAccessProject(user, projectId, true))) throw new Error("Tài khoản không được lập đơn cho dự án này.");
      const project = await first(`SELECT code,name FROM projects WHERE id=? AND status='active'`, projectId);
      if (!project) throw new Error("Dự án không tồn tại hoặc đã ngừng hoạt động.");
      const contractContext=await resolveContractContext(projectId,payload.contractId,payload.boqVersionId); const contractId=clean(contractContext.contract.id); const boqVersionId=clean(contractContext.version?.id)||null;
      const boqWhere = boqVersionId ? ` AND boq_version_id=?` : "";
      const projectBoqRows = await all(`SELECT id,material_id AS materialId,contract_id AS contractId,boq_version_id AS boqVersionId,contract_line_ref AS contractLineRef,line_no AS lineNo,boq_code AS boqCode FROM project_boq_items WHERE project_id=? AND contract_id=?${boqWhere} AND active=1 AND row_role IN ('material','component')`, projectId,contractId,...(boqVersionId?[boqVersionId]:[]));
      const year = /^\d{4}-/.test(neededAt) ? Number(neededAt.slice(0, 4)) : new Date().getFullYear();
      const sequenceKey = `DNMH:${projectId}:${year}`;
      const sequence = await first(`INSERT INTO document_sequences (id,document_type,project_id,year,last_number,updated_at) VALUES (?,?,?,?,1,?) ON CONFLICT(id) DO UPDATE SET last_number=document_sequences.last_number+1,updated_at=excluded.updated_at RETURNING document_sequences.last_number AS lastNumber`, sequenceKey, "DNMH", projectId, year, stamp);
      const requestNo = `DNMH-${String(project.code).toUpperCase()}-${year}-${String(Number(sequence?.lastNumber ?? 1)).padStart(4, "0")}`;
      const requestId = id("MR");
      const catalog = await all(`SELECT id,code,name,unit,system,category_id AS categoryId,subcategory_id AS subcategoryId,standard_price AS standardPrice FROM materials WHERE active=1`);
      const aliasRows = await all(`SELECT material_id AS materialId,alias_name AS aliasName FROM material_aliases`);
      const categories = await all(`SELECT id,code,name FROM material_categories WHERE active=1`);
      const subcategories = await all(`SELECT id,category_id AS categoryId,code,name FROM material_subcategories WHERE active=1`);
      const categoryByName = new Map(categories.flatMap((row) => [[clean(row.name).toLowerCase(), row], [clean(row.code).toLowerCase(), row]]));
      const fallbackSubcategoryByCategory = new Map(subcategories.filter((row) => clean(row.code).toUpperCase() === "CHUA_PHAN_NHOM").map((row) => [String(row.categoryId), row]));
      const byId = new Map(catalog.map((material) => [String(material.id), material]));
      const byCode = new Map(catalog.map((material) => [String(material.code).trim().toUpperCase(), material]));
      const byNameUnit = new Map(catalog.map((material) => [`${normalizeMaterialName(material.name)}|${normalizeMaterialName(material.unit)}`, material]));
      for (const alias of aliasRows) { const material = byId.get(clean(alias.materialId)); if (material) byNameUnit.set(`${normalizeMaterialName(alias.aliasName)}|${normalizeMaterialName(material.unit)}`, material); }
      const lineConfigs = await formFieldRows("request_line");
      const required = new Set(lineConfigs.filter((row) => Number(row.required) === 1 && Number(row.active) === 1).map((row) => clean(row.fieldKey)));
      const normalizedLines = [];
      for (let index = 0; index < lines.length; index += 1) {
        const line = lines[index]; const excelLine = index + 1;
        const quantity = numberValue(line.quantity); const materialIdInput = clean(line.materialId); const materialCodeInput = clean(line.materialCode).toUpperCase(); const materialNameInput = clean(line.materialName); const unitInput = clean(line.unit);
        if (required.has("quantity") && quantity <= 0) throw new Error(`Dòng ${excelLine}: Khối lượng đề nghị mua đợt này phải lớn hơn 0.`);
        if (required.has("materialCode") && !materialIdInput && !materialCodeInput) throw new Error(`Dòng ${excelLine}: Mã sản phẩm đang được cấu hình bắt buộc.`);
        if (required.has("materialName") && !materialIdInput && !materialNameInput) throw new Error(`Dòng ${excelLine}: Tên hàng đang được cấu hình bắt buộc.`);
        if (required.has("unit") && !materialIdInput && !unitInput) throw new Error(`Dòng ${excelLine}: Đơn vị đang được cấu hình bắt buộc.`);
        if (required.has("contractLineNo") && !numberValue(line.contractLineNo)) throw new Error(`Dòng ${excelLine}: Số thứ tự theo Hợp đồng đang được cấu hình bắt buộc.`);
        if (required.has("installationArea") && !clean(line.installationArea)) throw new Error(`Dòng ${excelLine}: Khu vực thi công đang được cấu hình bắt buộc.`);
        if (required.has("origin") && !clean(line.origin)) throw new Error(`Dòng ${excelLine}: Xuất xứ đang được cấu hình bắt buộc.`);
        if (required.has("approvedSupplier") && !clean(line.approvedSupplier)) throw new Error(`Dòng ${excelLine}: Nhà cung cấp được duyệt đang được cấu hình bắt buộc.`);
        if (required.has("note") && !clean(line.note)) throw new Error(`Dòng ${excelLine}: Ghi chú đang được cấu hình bắt buộc.`);
        let material = byId.get(materialIdInput) || (materialCodeInput ? byCode.get(materialCodeInput) : undefined);
        if (!material) material = await materialFromGovernedCode({ materialId: materialIdInput, internalCode: materialCodeInput, contractCode: clean(line.contractMaterialCode), approvedCode: clean(line.approvedMaterialCode), supplierCode: clean(line.supplierMaterialCode), ownerKey: projectId });
        if (!material) throw new Error(`Dòng ${excelLine}: vật tư chưa được mapping với Mã vật tư nội bộ. BOQ/Phiếu đề nghị không được tự tạo mã mới. Hãy tạo/mapping tại Danh mục mã vật tư trước khi nhập.`);
        let boqItemId = clean(line.boqItemId);
        if (boqItemId) {
          const exact = projectBoqRows.find((row) => clean(row.id) === boqItemId);
          if (!exact) throw new Error(`Dòng ${excelLine}: Mã dòng BOQ không thuộc Contract/BOQ Version đang chọn.`);
          if (clean(exact.materialId) !== clean(material.id)) throw new Error(`Dòng ${excelLine}: Mã dòng BOQ không khớp vật tư đã chọn.`);
        } else {
          const contractLine = clean(line.contractLineNo);
          const boqCode = clean(line.boqCode);
          const candidates = projectBoqRows.filter((row) => clean(row.materialId) === clean(material.id) && (!contractLine || clean(row.contractLineRef || row.lineNo) === contractLine) && (!boqCode || clean(row.boqCode) === boqCode));
          if (candidates.length === 1) boqItemId = clean(candidates[0].id);
          else if (candidates.length > 1) throw new Error(`Dòng ${excelLine}: vật tư khớp nhiều dòng BOQ. Hãy chọn đúng dòng BOQ trên phiếu để tránh cộng lũy kế trùng.`);
        }
        const outsideContract=["outside_contract","variation","phat_sinh"].includes(clean(line.itemType||line.scopeType).toLowerCase()) || line.outsideContract===true || clean(line.outsideContract)==="1";
        if(!boqItemId && !outsideContract) throw new Error(`Dòng ${excelLine}: chưa đối chiếu được đúng dòng BOQ/Hợp đồng. Hãy chọn dòng BOQ hoặc đánh dấu hợp lệ là Ngoài HĐ/Phát sinh kèm lý do trước khi gửi duyệt.`);
        if(outsideContract && !clean(line.note||line.reason)) throw new Error(`Dòng ${excelLine}: vật tư Ngoài HĐ/Phát sinh bắt buộc nhập lý do/ghi chú.`);
        const linkedBoq=boqItemId?projectBoqRows.find((row)=>clean(row.id)===boqItemId):null;
        normalizedLines.push({ ...line, boqItemId, contractId:clean(linkedBoq?.contractId)||contractId, boqVersionId:clean(linkedBoq?.boqVersionId)||boqVersionId, materialId: material.id, materialCode: material.code, materialName: material.name, unit: material.unit, quantity, boqCode: clean(line.boqCode), workPackageCode: clean(line.workPackageCode), unitPrice: numberValue(line.unitPrice) || numberValue(material.standardPrice), customFields: customFieldsObject(line.customFields) });
      }
      const total = normalizedLines.reduce((sum, line) => sum + numberValue(line.quantity) * numberValue(line.unitPrice), 0);
      const stages = await approvalStages(true); if (!stages.length) throw new Error("Chưa cấu hình bước phê duyệt đang hoạt động. Quản trị viên cần tạo ít nhất 1 bước.");
      const stageOwners = new Map(); for (const stage of stages) { if (Number(stage.autoApproveOnSubmit||0)!==1) stageOwners.set(Number(stage.stageNo), await requireWorkflowAssignment(projectId, stage)); }
      const firstStage = stages[0]; const autoFirst = Number(firstStage.autoApproveOnSubmit || 0) === 1; const currentStage = autoFirst ? (stages[1]?.stageNo ?? firstStage.stageNo) : firstStage.stageNo; const allAutoComplete = autoFirst && stages.length === 1;
      const statements = [];
      statements.push(env.DB.prepare(`INSERT INTO material_requests (id,request_no,project_id,contract_id,boq_version_id,team_id,source_warehouse_id,requested_by,requested_at,needed_at,priority,area,purpose,status,approval_stage,total_estimated_value,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(requestId, requestNo, projectId, contractId, boqVersionId, null, clean(payload.sourceWarehouseId) || null, user.id, stamp, neededAt || stamp.slice(0,10), clean(payload.priority) || "normal", area, clean(payload.purpose) || null, allAutoComplete ? "approved" : "pending_approval", currentStage, total, stamp, stamp));
      normalizedLines.forEach((line, index) => {
        const requestItemId = id("MRI");
        statements.push(env.DB.prepare(`INSERT INTO material_request_items (id,request_id,line_no,material_id,boq_item_id,contract_id,boq_version_id,work_package_code,boq_code,route_tag,installation_area,contract_line_no,origin,approved_supplier,note,requested_qty,estimated_unit_price,stock_allocation_qty,approved_purchase_qty,ordered_qty,received_qty,issued_qty,installed_qty,line_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(requestItemId, requestId, index + 1, clean(line.materialId), clean(line.boqItemId) || null, clean(line.contractId)||contractId, clean(line.boqVersionId)||boqVersionId, clean(line.workPackageCode) || null, clean(line.boqCode) || null, clean(line.routeTag) || null, clean(line.installationArea) || area || null, numberValue(line.contractLineNo) || null, clean(line.origin) || null, clean(line.approvedSupplier) || null, clean(line.note) || null, numberValue(line.quantity), numberValue(line.unitPrice), numberValue(line.stockAllocationQty), allAutoComplete ? Math.max(numberValue(line.quantity) - numberValue(line.stockAllocationQty), 0) : 0, 0, 0, 0, 0, allAutoComplete ? "approved" : "pending", stamp, stamp));
        statements.push(env.DB.prepare(`INSERT INTO procurement_allocations(id,project_id,contract_id,boq_version_id,boq_item_id,material_id,request_item_id,stage,quantity,reference_no,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("PAL"),projectId,clean(line.contractId)||contractId,clean(line.boqVersionId)||boqVersionId,clean(line.boqItemId)||null,clean(line.materialId),requestItemId,"MR",numberValue(line.quantity),requestNo,stamp,stamp));
        const customs = customFieldsObject(line.customFields); for (const [fieldKey,value] of Object.entries(customs)) if (clean(fieldKey) && value !== undefined && value !== null && clean(value) !== "") statements.push(env.DB.prepare(`INSERT INTO custom_field_values (id,form_key,entity_id,field_key,value_text,created_at,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(form_key,entity_id,field_key) DO UPDATE SET value_text=excluded.value_text,updated_at=excluded.updated_at`).bind(id("CFV"), "request_line", requestItemId, clean(fieldKey), clean(value), stamp, stamp));
      });
      for (let index = 0; index < stages.length; index += 1) { const stage = stages[index]; const isAutoApproved = index === 0 && autoFirst; const isQueued = isAutoApproved || (!allAutoComplete && stage.stageNo === currentStage); const dueAt = isQueued ? addHours(stamp, Number(stage.slaHours || 8)) : null; const snapshot = isAutoApproved ? JSON.stringify({ stage: stage.stageNo, decision: "approved", user: user.fullName, at: stamp, source: "request_submission" }) : null; const assignedOwner = isAutoApproved ? user.id : clean(stageOwners.get(Number(stage.stageNo))?.ownerUserId); statements.push(env.DB.prepare(`INSERT INTO approvals (id,request_id,stage,department,approver_user_id,status,queued_at,due_at,notified_at,reminder_sent_at,decided_at,comment,decision_snapshot,allowed_role_codes_snapshot,approval_mode_snapshot,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("APR"), requestId, stage.stageNo, stage.name, assignedOwner || null, isAutoApproved ? "approved" : "pending", isQueued ? stamp : null, dueAt, null, null, isAutoApproved ? stamp : null, isAutoApproved ? `Tự xác nhận khi gửi phiếu: ${stage.name}` : null, snapshot, clean(stage.allowedRoleCodes), assignedOwner ? "single" : (clean(stage.approvalMode) || "single"), stamp, stamp)); }
      const emailContext = { requestId, requestNo, projectId, projectCode: project.code, projectName: project.name, requesterName: user.fullName, requesterEmail: user.email, neededAt: neededAt || stamp.slice(0,10), area, itemCount: normalizedLines.length, total };
      if (allAutoComplete) { const supplySla = await supplySlaHours(); statements.push(env.DB.prepare(`UPDATE material_requests SET supply_status='awaiting_po',updated_at=? WHERE id=?`).bind(stamp, requestId)); statements.push(env.DB.prepare(`INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("SWF"), requestId, null, null, "po_creation", "pending", stamp, addHours(stamp, supplySla.po), null, null, "Tự chuyển từ phê duyệt sang chờ lập PO", stamp, stamp)); const completedMail = await approvalEmailStatement(emailContext, 101, "approved", null, request); if (completedMail) statements.push(completedMail); }
      else { const current = stages.find((item) => item.stageNo === currentStage); const dueAt = addHours(stamp, Number(current.slaHours || 8)); const emailStatement = await approvalEmailStatement(emailContext, currentStage, "approval_requested", dueAt, request); if (emailStatement) statements.push(emailStatement); }
      await env.DB.batch(statements); await audit(user.id, "CREATE", "material_request", requestId, null, { requestNo, projectId, contractId, boqVersionId, lineCount: normalizedLines.length, newMaterialCount: 0, mappingMode: "strict_internal_material", total, dynamicFields: true }, request);
      return { message: allAutoComplete ? `Đã lập phiếu ${requestNo}; luồng phê duyệt tự hoàn tất và chuyển sang Mua hàng & PO.` : `Đã lập phiếu ${requestNo} gồm ${normalizedLines.length} dòng và chuyển tới ${stages.find((item) => item.stageNo === currentStage)?.name || `bước ${currentStage}`}.` };
    }
    if (action === "update_returned_request") {
        const requestId=clean(payload.requestId);
        const mr=await first(`SELECT id,request_no AS requestNo,project_id AS projectId,requested_by AS requestedBy,status FROM material_requests WHERE id=?`,requestId);
        if(!mr)throw new Error("Không tìm thấy phiếu đề nghị.");
        if(String(mr.requestedBy)!==String(user.id)&&!isAdmin(user))throw new Error("Chỉ CHT/người lập phiếu hoặc Quản trị viên được sửa phiếu bị trả lại.");
        if(String(mr.status)!=="returned_to_requester")throw new Error("Chỉ phiếu đang chờ CHT xử lý mới được sửa.");
        const neededAt=normalizeVietnamDate(payload.neededAt);if(neededAt&&!validIsoDate(neededAt))throw new Error("Ngày cần hàng phải theo định dạng DD/MM/YYYY.");
        const lines=Array.isArray(payload.lines)?payload.lines:[];
        const statements=[env.DB.prepare(`UPDATE material_requests SET needed_at=?,priority=?,area=?,purpose=?,updated_at=? WHERE id=?`).bind(neededAt||null,clean(payload.priority)||"normal",clean(payload.area)||null,clean(payload.purpose)||null,stamp,requestId)];
        for(const line of lines){const itemId=clean(line.id),qty=numberValue(line.requestedQty);if(!itemId||qty<=0)throw new Error("Số lượng đề nghị phải lớn hơn 0.");statements.push(env.DB.prepare(`UPDATE material_request_items SET requested_qty=?,updated_at=? WHERE id=? AND request_id=?`).bind(qty,stamp,itemId,requestId));}
        statements.push(env.DB.prepare(`INSERT INTO request_comments (id,request_id,user_id,comment,visibility,created_at) VALUES (?,?,?,?,?,?)`).bind(id("RCM"),requestId,user.id,"CHT đã chỉnh sửa phiếu sau khi bị trả lại.","internal",stamp));
        await env.DB.batch(statements);await audit(user.id,"EDIT_RETURNED","material_request",requestId,mr,{neededAt,priority:clean(payload.priority),area:clean(payload.area),purpose:clean(payload.purpose),lineCount:lines.length},request);
        return {message:`Đã lưu chỉnh sửa ${mr.requestNo}. Kiểm tra lại trước khi gửi lại từ đầu.`};
    }
    if (action === "resubmit_request") {
        const requestId=clean(payload.requestId);
        const mr=await first(`SELECT id,request_no AS requestNo,project_id AS projectId,requested_by AS requestedBy,status FROM material_requests WHERE id=?`,requestId);
        if(!mr)throw new Error("Không tìm thấy phiếu đề nghị.");
        if(String(mr.requestedBy)!==String(user.id)&&!isAdmin(user))throw new Error("Chỉ CHT/người lập phiếu hoặc Quản trị viên được gửi lại phiếu.");
        if(String(mr.status)!=="returned_to_requester")throw new Error("Chỉ phiếu đã bị trả về CHT mới được gửi lại.");
        const stages=await approvalStages(true);
        if(!stages.length)throw new Error("Chưa cấu hình bước phê duyệt hoạt động.");
        const firstStage=stages[0];
        const autoFirst=Number(firstStage.autoApproveOnSubmit||0)===1;
        const currentStage=autoFirst?(stages[1]?.stageNo??firstStage.stageNo):firstStage.stageNo;
        const currentConfig=stages.find((item)=>Number(item.stageNo)===Number(currentStage))||firstStage;
        const due=addHours(stamp,Number(currentConfig.slaHours||8));
        const autoSnapshot=autoFirst?JSON.stringify({stage:firstStage.stageNo,decision:"approved",user:user.fullName,at:stamp,source:"request_resubmission"}):null;
        await env.DB.batch([
          env.DB.prepare(`UPDATE material_requests SET status='pending_approval',supply_status='approval_pending',approval_stage=?,updated_at=? WHERE id=?`).bind(currentStage,stamp,requestId),
          env.DB.prepare(`UPDATE approvals SET status=CASE WHEN stage=? AND ?=1 THEN 'approved' WHEN stage=? THEN 'pending' ELSE 'waiting' END,approver_user_id=CASE WHEN stage=? AND ?=1 THEN ? ELSE NULL END,queued_at=CASE WHEN stage=? AND ?=1 THEN ? WHEN stage=? THEN ? ELSE NULL END,due_at=CASE WHEN stage=? THEN ? ELSE NULL END,decided_at=CASE WHEN stage=? AND ?=1 THEN ? ELSE NULL END,comment=CASE WHEN stage=? AND ?=1 THEN ? ELSE NULL END,decision_snapshot=CASE WHEN stage=? AND ?=1 THEN ? ELSE NULL END,updated_at=? WHERE request_id=?`).bind(firstStage.stageNo,autoFirst?1:0,currentStage,firstStage.stageNo,autoFirst?1:0,user.id,firstStage.stageNo,autoFirst?1:0,stamp,currentStage,stamp,currentStage,due,firstStage.stageNo,autoFirst?1:0,stamp,firstStage.stageNo,autoFirst?1:0,`Tự xác nhận khi gửi lại phiếu: ${firstStage.name}`,firstStage.stageNo,autoFirst?1:0,autoSnapshot,stamp,requestId),
          env.DB.prepare(`DELETE FROM approval_stage_decisions WHERE request_id=?`).bind(requestId),
          env.DB.prepare(`INSERT INTO request_comments (id,request_id,user_id,comment,visibility,created_at) VALUES (?,?,?,?,?,?)`).bind(id("RCM"),requestId,user.id,`CHT GỬI LẠI: ${clean(payload.comment)||"Đã sửa phiếu; CHT xác nhận lại và khởi động lại luồng duyệt từ đầu."}`,"internal",stamp)
        ]);
        const project=await first(`SELECT p.code,p.name,u.full_name AS requesterName,u.email AS requesterEmail,mr.needed_at AS neededAt,mr.area,(SELECT COUNT(*) FROM material_request_items i WHERE i.request_id=mr.id) AS itemCount,mr.total_estimated_value AS total FROM material_requests mr JOIN projects p ON p.id=mr.project_id JOIN users u ON u.id=mr.requested_by WHERE mr.id=?`,requestId);
        if(project){const emailContext={requestId,requestNo:String(mr.requestNo),projectId:String(mr.projectId),projectCode:String(project.code),projectName:String(project.name),requesterName:String(project.requesterName),requesterEmail:project.requesterEmail?String(project.requesterEmail):null,neededAt:String(project.neededAt||""),area:String(project.area||""),itemCount:numberValue(project.itemCount),total:numberValue(project.total)};const emailStatement=await approvalEmailStatement(emailContext,currentStage,"approval_requested",due,request);if(emailStatement)await emailStatement.run();}
        await audit(user.id,"RESUBMIT","material_request",requestId,mr,{confirmedStage:firstStage.stageNo,restartStage:currentStage,comment:clean(payload.comment)},request);
        return {message:`Đã gửi lại ${mr.requestNo}; CHT đã xác nhận và hồ sơ chuyển sang ${currentConfig.name}.`};
    }
    if (action === "delete_request") {
        const requestId=clean(payload.requestId);
        const mr=await first(`SELECT id,request_no AS requestNo,project_id AS projectId,requested_by AS requestedBy,status FROM material_requests WHERE id=?`,requestId);
        if(!mr)throw new Error("Không tìm thấy phiếu đề nghị.");
        if(String(mr.requestedBy)!==String(user.id)&&!isAdmin(user))throw new Error("Chỉ người lập phiếu hoặc Quản trị viên được xóa phiếu bị trả lại.");
        if(!["returned_to_requester","rejected"].includes(String(mr.status)))throw new Error("Chỉ phiếu bị trả lại/từ chối và chưa phát sinh mua hàng mới được xóa.");
        const dep=await first(`SELECT COUNT(*) AS count FROM purchase_order_items poi JOIN material_request_items mri ON mri.id=poi.request_item_id WHERE mri.request_id=?`,requestId);
        if(Number(dep?.count||0)>0)throw new Error("Phiếu đã phát sinh PO nên không được xóa; hãy giữ lịch sử.");
        await audit(user.id,"DELETE_RETURNED","material_request",requestId,mr,{reason:clean(payload.reason)||"CHT xóa phiếu bị trả lại để lập mới"},request);
        await env.DB.batch([
          env.DB.prepare(`DELETE FROM approval_stage_decisions WHERE request_id=?`).bind(requestId),
          env.DB.prepare(`DELETE FROM approvals WHERE request_id=?`).bind(requestId),
          env.DB.prepare(`DELETE FROM request_comments WHERE request_id=?`).bind(requestId),
          env.DB.prepare(`DELETE FROM material_request_items WHERE request_id=?`).bind(requestId),
          env.DB.prepare(`DELETE FROM material_requests WHERE id=?`).bind(requestId)
        ]);
        return {message:`Đã xóa ${mr.requestNo}. CHT có thể lập phiếu mới.`};
    }
    if (action === "cancel_request") {
        const requestId = clean(payload.requestId);
        const reason = clean(payload.reason);
        if (!reason)
            throw new Error("Phải nhập lý do hủy phiếu.");
        const mr = await first(`SELECT id,request_no AS requestNo,project_id AS projectId,requested_by AS requestedBy,status FROM material_requests WHERE id=?`, requestId);
        if (!mr)
            throw new Error("Không tìm thấy phiếu đề nghị.");
        if (!(await canAccessProject(user, String(mr.projectId), true)))
            throw new Error("Tài khoản không có quyền tại dự án.");
        if (effectiveRole(user) !== "commander" && !isAdmin(user))
            throw new Error("Chỉ Chỉ huy trưởng được hủy phiếu bị trả lại.");
        if (String(mr.status) !== "returned_to_requester")
            throw new Error("Chỉ phiếu đã bị trả lại và đang chờ CHT xử lý mới được hủy/xóa.");
        const ordered = await first(`SELECT COUNT(*) AS count FROM purchase_order_items poi JOIN material_request_items mri ON mri.id=poi.request_item_id WHERE mri.request_id=?`, requestId);
        if (Number(ordered?.count ?? 0) > 0)
            throw new Error("Phiếu đã phát sinh PO nên không thể hủy.");
        await env.DB.batch([
            env.DB.prepare(`UPDATE material_requests SET status='cancelled',supply_status='cancelled',updated_at=? WHERE id=?`).bind(stamp, requestId),
            env.DB.prepare(`UPDATE approvals SET status=CASE WHEN status='pending' THEN 'cancelled' ELSE status END,comment=CASE WHEN status='pending' THEN ? ELSE comment END,updated_at=? WHERE request_id=?`).bind(`Hủy phiếu: ${reason}`, stamp, requestId),
            env.DB.prepare(`UPDATE supply_workflow_steps SET status='cancelled',completed_at=?,completed_by=?,comment=?,updated_at=? WHERE request_id=? AND status='pending'`).bind(stamp, user.id, `Hủy phiếu: ${reason}`, stamp, requestId),
        ]);
        await audit(user.id, "CANCEL", "material_request", requestId, mr, { reason }, request);
        return { message: `Đã hủy ${mr.requestNo}; số phiếu được giữ nguyên trong lịch sử.` };
    }
    if (action === "decide_approval") {
        const requestId = clean(payload.requestId);
        const stage = numberValue(payload.stage);
        const decision = clean(payload.decision);
        const mr = await first(`SELECT mr.id,mr.request_no AS requestNo,mr.project_id AS projectId,p.code AS projectCode,p.name AS projectName,mr.status,mr.approval_stage AS approvalStage,mr.needed_at AS neededAt,mr.area,mr.total_estimated_value AS total,u.full_name AS requesterName,u.email AS requesterEmail,(SELECT COUNT(*) FROM material_request_items mri WHERE mri.request_id=mr.id) AS itemCount FROM material_requests mr JOIN projects p ON p.id=mr.project_id JOIN users u ON u.id=mr.requested_by WHERE mr.id=?`, requestId);
        if (!mr)
            throw new Error("Không tìm thấy đơn yêu cầu.");
        if (!(await canApproveRequestStage(user, requestId, stage)))
            throw new Error("Bạn không phải Owner được phân công của bước này hoặc không đủ RBAC để phê duyệt.");
        if (Number(mr.approvalStage) !== stage || String(mr.status) !== "pending_approval")
            throw new Error("Hồ sơ chưa đến bước duyệt này hoặc đã được xử lý.");
        if (!(await canAccessProject(user, String(mr.projectId), true)))
            throw new Error("Tài khoản không có quyền tại dự án.");
        if (!['approved', 'rejected'].includes(decision))
            throw new Error("Quyết định không hợp lệ.");
        const stages = await all(`SELECT a.stage AS stageNo,a.department AS name,COALESCE(cfg.description,'') AS description,COALESCE(NULLIF(a.allowed_role_codes_snapshot,''),cfg.allowed_role_codes,'') AS allowedRoleCodes,COALESCE(NULLIF(a.approval_mode_snapshot,''),cfg.approval_mode,'single') AS approvalMode,COALESCE(cfg.sla_hours,8) AS slaHours,0 AS autoApproveOnSubmit,1 AS active,a.stage AS sortOrder FROM approvals a LEFT JOIN approval_stage_catalog cfg ON cfg.stage_no=a.stage WHERE a.request_id=? ORDER BY a.stage`, requestId);
        const stageIndex = stages.findIndex((item) => Number(item.stageNo) === stage);
        if (stageIndex < 0)
            throw new Error("Không tìm thấy bước phê duyệt trong luồng của hồ sơ này.");
        const comment = clean(payload.comment);
        const stageConfig = stages[stageIndex];
        const snapshot = JSON.stringify({ stage, decision, user: user.fullName, at: stamp, stageName: stageConfig.name });
        if (clean(stageConfig.approvalMode) === "all_roles" && decision === "approved") {
            const required = stageRoleCodes(stageConfig);
            const approvedRows = await all(`SELECT DISTINCT role_code AS roleCode FROM approval_stage_decisions WHERE request_id=? AND stage=? AND decision='approved'`, requestId, stage);
            const approved = new Set(approvedRows.map((row)=>String(row.roleCode)));
            const roleCode = matchedApprovalRole(user, stageConfig) || (isAdmin(user) ? required.find((code)=>!approved.has(code)) || "" : "");
            if (!roleCode) throw new Error("Không xác định được vai trò xác nhận của tài khoản tại bước này.");
            const duplicate = await first(`SELECT id FROM approval_stage_decisions WHERE request_id=? AND stage=? AND role_code=?`, requestId, stage, roleCode);
            if (duplicate) throw new Error("Vai trò này đã xác nhận bước phê duyệt song song.");
            await env.DB.prepare(`INSERT INTO approval_stage_decisions (id,request_id,stage,role_code,user_id,decision,comment,decided_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id("APD"),requestId,stage,roleCode,user.id,"approved",comment||null,stamp,stamp,stamp).run();
            approved.add(roleCode);
            const missing = required.filter((code)=>!approved.has(code));
            if (missing.length) {
                const progress = `Đã xác nhận ${approved.size}/${required.length}; còn chờ: ${missing.join(", ")}`;
                await env.DB.prepare(`UPDATE approvals SET comment=?,updated_at=? WHERE request_id=? AND stage=?`).bind(progress,stamp,requestId,stage).run();
                await audit(user.id,"APPROVE_PARTIAL","material_request",requestId,mr,{stage,stageName:stageConfig.name,roleCode,missing},request);
                return { message: `Đã ghi nhận xác nhận của ${user.fullName}; ${progress}.` };
            }
        }
        if (clean(stageConfig.approvalMode) === "all_roles" && decision === "rejected") {
            const roleCode = matchedApprovalRole(user, stageConfig) || clean(user.role) || effectiveRole(user);
            await env.DB.prepare(`INSERT OR IGNORE INTO approval_stage_decisions (id,request_id,stage,role_code,user_id,decision,comment,decided_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id("APD"),requestId,stage,roleCode,user.id,"rejected",comment||null,stamp,stamp,stamp).run();
        }
        const statements = [env.DB.prepare(`UPDATE approvals SET status=?,approver_user_id=?,decided_at=?,comment=?,decision_snapshot=?,updated_at=? WHERE request_id=? AND stage=?`).bind(decision, user.id, stamp, comment || null, snapshot, stamp, requestId, stage)];
        let emailStatement = null;
        const emailContext = { requestId, requestNo: String(mr.requestNo), projectId: String(mr.projectId), projectCode: String(mr.projectCode), projectName: String(mr.projectName), requesterName: String(mr.requesterName), requesterEmail: mr.requesterEmail ? String(mr.requesterEmail) : null, neededAt: String(mr.neededAt), area: String(mr.area), itemCount: numberValue(mr.itemCount), total: numberValue(mr.total) };
        if (decision === "rejected") {
            if (!comment) throw new Error("Bắt buộc nhập lý do trả lại / từ chối hồ sơ.");
            statements.push(env.DB.prepare(`UPDATE material_requests SET status='returned_to_requester',supply_status='returned',approval_stage=0,updated_at=? WHERE id=?`).bind(stamp, requestId));
            statements.push(env.DB.prepare(`UPDATE approvals SET status=CASE WHEN stage>? THEN 'waiting' ELSE status END,queued_at=CASE WHEN stage>? THEN NULL ELSE queued_at END,due_at=CASE WHEN stage>? THEN NULL ELSE due_at END,updated_at=? WHERE request_id=?`).bind(stage,stage,stage,stamp,requestId));
            statements.push(env.DB.prepare(`INSERT INTO request_comments (id,request_id,user_id,comment,visibility,created_at) VALUES (?,?,?,?,?,?)`).bind(id("RCM"),requestId,user.id,`TRẢ LẠI BƯỚC ${stage}: ${comment}`,"internal",stamp));
            emailStatement = await approvalEmailStatement(emailContext, stage, "rejected", null, request);
        }
        else {
            const nextStage = stages[stageIndex + 1];
            if (nextStage) {
                const nextDue = addHours(stamp, Number(nextStage.slaHours || 8));
                statements.push(env.DB.prepare(`UPDATE material_requests SET approval_stage=?,updated_at=? WHERE id=?`).bind(nextStage.stageNo, stamp, requestId));
                statements.push(env.DB.prepare(`UPDATE approvals SET queued_at=?,due_at=?,updated_at=? WHERE request_id=? AND stage=?`).bind(stamp, nextDue, stamp, requestId, nextStage.stageNo));
                emailStatement = await approvalEmailStatement(emailContext, nextStage.stageNo, "approval_requested", nextDue, request);
            }
            else {
                const supplySla = await supplySlaHours();
                statements.push(env.DB.prepare(`UPDATE material_requests SET status='approved',supply_status='awaiting_po',approval_stage=?,updated_at=? WHERE id=?`).bind(stage, stamp, requestId));
                statements.push(env.DB.prepare(`UPDATE material_request_items SET approved_purchase_qty=CASE WHEN requested_qty-stock_allocation_qty>0 THEN requested_qty-stock_allocation_qty ELSE 0 END,line_status='approved',updated_at=? WHERE request_id=?`).bind(stamp, requestId));
                const reserveWarehouse=await first(`SELECT source_warehouse_id AS warehouseId FROM material_requests WHERE id=?`,requestId);
                if(clean(reserveWarehouse?.warehouseId)){const reserveRows=await all(`SELECT id,material_id AS materialId,stock_allocation_qty AS qty FROM material_request_items WHERE request_id=? AND stock_allocation_qty>0`,requestId);for(const rr of reserveRows){statements.push(env.DB.prepare(`INSERT INTO stock_reservations (id,project_id,warehouse_id,material_id,request_id,request_item_id,quantity,status,reserved_at,released_at,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("RSV"),mr.projectId,reserveWarehouse.warehouseId,rr.materialId,requestId,rr.id,numberValue(rr.qty),"active",stamp,null,user.id,stamp,stamp));}}
                statements.push(env.DB.prepare(`INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("SWF"), requestId, null, null, "po_creation", "pending", stamp, addHours(stamp, supplySla.po), null, null, "Tự chuyển từ phê duyệt sang chờ lập PO", stamp, stamp));
                emailStatement = await approvalEmailStatement(emailContext, 101, "approved", null, request);
            }
        }
        if (emailStatement)
            statements.push(emailStatement);
        await env.DB.batch(statements);
        await audit(user.id, decision.toUpperCase(), "material_request", requestId, mr, { stage, stageName: stages[stageIndex].name, decision, comment }, request);
        const nextStage = stages[stageIndex + 1];
        if(decision==="rejected"){ await closeSourceTask("MR",requestId,"DA_MR_REVIEW",user,request,"CANCELLED"); await closeSourceTask("MR",requestId,"KH_MR_INTAKE",user,request,"CANCELLED"); await closeSourceTask("MR",requestId,"MR_TO_PO",user,request,"CANCELLED"); }
        else if(nextStage && Number(nextStage.stageNo)===2){ const a=await defaultDepartmentAssignee("DA",String(mr.projectId)); if(a) await createDepartmentTask({department:"DA",workGroup:"VẬT TƯ",title:`Kiểm soát đề nghị vật tư ${mr.requestNo}`,description:"Kiểm BOQ, khối lượng bóc lại, lũy kế, tồn kho, MAR/thông số trước khi chuyển Phòng Kế hoạch.",projectId:String(mr.projectId),sourceModule:"requests",sourceType:"MR",sourceId:requestId,sourceNo:String(mr.requestNo),workStep:"DA_MR_REVIEW",assignedTo:a.id,assignedBy:user.id,dueAt:addHours(stamp,Number(nextStage.slaHours||24)),priority:"high",requiredOutput:"Kết quả thẩm định khối lượng/kỹ thuật và cảnh báo nếu có",origin:"automatic",dedupeKey:`DA:MR:${requestId}:DA_MR_REVIEW`},user,request); }
        else if(nextStage && Number(nextStage.stageNo)===3){ await closeSourceTask("MR",requestId,"DA_MR_REVIEW",user,request); }
        else if(!nextStage){ await closeSourceTask("MR",requestId,"KH_MR_INTAKE",user,request); const a=await defaultDepartmentAssignee("KH",String(mr.projectId)); if(a) await createDepartmentTask({department:"KH",workGroup:"RFQ / MUA HÀNG",title:`Xin giá / lập PO cho ${mr.requestNo}`,description:"MR đã đủ phê duyệt. Ưu tiên tồn/điều chuyển trước mua; xử lý RFQ, NCC và PO.",projectId:String(mr.projectId),sourceModule:"purchasing",sourceType:"MR",sourceId:requestId,sourceNo:String(mr.requestNo),workStep:"MR_TO_PO",assignedTo:a.id,assignedBy:user.id,dueAt:addHours(stamp,24),priority:"high",requiredOutput:"PO hoặc quyết định điều chuyển/tận dụng tồn được phê duyệt",origin:"automatic",dedupeKey:`KH:MR:${requestId}:MR_TO_PO`},user,request); }
        return { message: decision === "approved" ? nextStage ? `Đã duyệt ${stages[stageIndex].name}; hồ sơ tự chuyển sang ${nextStage.name}.` : "Đã hoàn tất luồng phê duyệt; hồ sơ tự chuyển sang Mua hàng & PO và bắt đầu tính thời gian lập PO." : "Đã trả phiếu về CHT; bắt buộc sửa và gửi lại từ đầu hoặc xóa phiếu để lập mới." };
    }
    if (action === "create_work_item") {
        const department=clean(payload.departmentCode).toUpperCase(); if(!["KH","DA"].includes(department))throw new Error("Phòng ban không hợp lệ.");
        if(!isDepartmentManager(user,department)) throw new Error("Chỉ Trưởng phòng hoặc Quản trị viên được giao việc thủ công.");
        if(clean(payload.sourceId)||clean(payload.sourceType)||clean(payload.sourceModule)) throw new Error("Giao việc thủ công chỉ dùng cho công việc không có nghiệp vụ nguồn. Task từ ERP phải được hệ thống tự sinh.");
        const title=clean(payload.title); if(!title)throw new Error("Cần nhập nội dung công việc.");
        const projectId=clean(payload.projectId); if(projectId && !(await canAccessProject(user,projectId,true))) throw new Error("Không có quyền tại dự án.");
        const dueAt=clean(payload.dueAt); if(dueAt && Number.isNaN(new Date(dueAt).getTime()))throw new Error("Hạn hoàn thành không hợp lệ.");
        const task=await createDepartmentTask({department,workGroup:clean(payload.workGroup)||"GIAO_VIEC_BO_SUNG",title,description:clean(payload.description),projectId,workStep:"MANUAL",assignedTo:clean(payload.assignedTo),assignedBy:user.id,dueAt,priority:clean(payload.priority)||"normal",requiredOutput:clean(payload.requiredOutput),origin:"manual"},user,request);
        await audit(user.id,"CREATE","work_item",task.id,null,task,request); return {message:`Đã giao ${task.taskNo}. SLA/KPI tính ngay từ assigned_at và đã tạo thông báo cho nhân viên.`};
    }
    if (action === "update_work_item_progress") {
        const taskId=clean(payload.workItemId),progress=Math.max(0,Math.min(100,Math.round(numberValue(payload.progress)))); const task=await first(`SELECT * FROM work_items WHERE id=?`,taskId); if(!task)throw new Error("Không tìm thấy nhiệm vụ."); if(clean(task.assigned_to)!==clean(user.id)&&!isDepartmentManager(user,clean(task.department_code)))throw new Error("Không có quyền cập nhật nhiệm vụ này."); const stamp=now(); await env.DB.batch([env.DB.prepare(`UPDATE work_items SET progress=?,status=CASE WHEN status='NEW' AND ?>0 THEN 'IN_PROGRESS' ELSE status END,updated_at=? WHERE id=?`).bind(progress,progress,stamp,taskId),env.DB.prepare(`INSERT INTO work_item_events(id,work_item_id,event_type,from_status,to_status,actor_user_id,previous_assignee,new_assignee,reason,detail_json,occurred_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("EVT"),taskId,"PROGRESS",task.status,task.status==='NEW'&&progress>0?'IN_PROGRESS':task.status,user.id,null,null,null,JSON.stringify({progress}),stamp,stamp)]); return {message:`Đã cập nhật tiến độ ${progress}%.`};
    }
    if (action === "update_work_item_status") {
        const taskId=clean(payload.workItemId),next=clean(payload.status).toUpperCase(),reason=clean(payload.reason); if(!TASK_STATUSES.has(next))throw new Error("Trạng thái nhiệm vụ không hợp lệ."); const task=await first(`SELECT * FROM work_items WHERE id=?`,taskId); if(!task)throw new Error("Không tìm thấy nhiệm vụ."); const manager=isDepartmentManager(user,clean(task.department_code)); if(clean(task.assigned_to)!==clean(user.id)&&!manager)throw new Error("Không có quyền cập nhật nhiệm vụ này."); if(TASK_WAITING.has(next)&&!reason)throw new Error("Trạng thái Chờ/Blocked/On hold bắt buộc phải có lý do hoặc bằng chứng."); if(next==='COMPLETED'&&!manager)throw new Error("Người thực hiện chỉ Gửi kiểm tra; Trưởng phòng/người có thẩm quyền mới xác nhận Hoàn thành."); const stamp=now(); const progress=next==='COMPLETED'?100:numberValue(task.progress); await env.DB.batch([env.DB.prepare(`UPDATE work_items SET status=?,progress=?,waiting_reason=?,waiting_started_at=?,submitted_at=CASE WHEN ?='SUBMITTED' THEN ? ELSE submitted_at END,completed_at=CASE WHEN ?='COMPLETED' THEN ? ELSE completed_at END,completed_by=CASE WHEN ?='COMPLETED' THEN ? ELSE completed_by END,cancelled_at=CASE WHEN ?='CANCELLED' THEN ? ELSE cancelled_at END,cancelled_by=CASE WHEN ?='CANCELLED' THEN ? ELSE cancelled_by END,active=CASE WHEN ?='CANCELLED' THEN 0 ELSE active END,updated_at=? WHERE id=?`).bind(next,progress,TASK_WAITING.has(next)?reason:null,TASK_WAITING.has(next)?stamp:null,next,stamp,next,stamp,next,user.id,next,stamp,next,user.id,next,stamp,taskId),env.DB.prepare(`INSERT INTO work_item_events(id,work_item_id,event_type,from_status,to_status,actor_user_id,previous_assignee,new_assignee,reason,detail_json,occurred_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("EVT"),taskId,"STATUS",task.status,next,user.id,null,null,reason||null,null,stamp,stamp)]); return {message:`Đã chuyển ${task.task_no} sang ${next}. SLA gốc vẫn tính từ assigned_at; thời gian chờ hợp lệ được tách khỏi lỗi cá nhân.`};
    }
    if (action === "reassign_work_item") {
        const taskId=clean(payload.workItemId),nextUser=clean(payload.assignedTo),reason=clean(payload.reason); const task=await first(`SELECT * FROM work_items WHERE id=?`,taskId); if(!task)throw new Error("Không tìm thấy nhiệm vụ."); if(!isDepartmentManager(user,clean(task.department_code)))throw new Error("Chỉ Trưởng phòng/Quản trị viên được đổi người phụ trách."); if(!reason)throw new Error("Đổi người phụ trách phải có lý do."); const assignee=await userCanReceiveDepartmentTask(nextUser,clean(task.department_code),clean(task.project_id)); if(!assignee)throw new Error("Nhân sự mới không thuộc đúng phòng hoặc phạm vi dự án."); const stamp=now(); await env.DB.batch([env.DB.prepare(`UPDATE work_items SET assigned_to=?,assigned_by=?,assigned_at=?,status='NEW',progress=0,waiting_reason=NULL,waiting_started_at=NULL,updated_at=? WHERE id=?`).bind(nextUser,user.id,stamp,stamp,taskId),env.DB.prepare(`INSERT INTO work_item_events(id,work_item_id,event_type,from_status,to_status,actor_user_id,previous_assignee,new_assignee,reason,detail_json,occurred_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("EVT"),taskId,"REASSIGNED",task.status,"NEW",user.id,task.assigned_to,nextUser,reason,JSON.stringify({previousAssignedAt:task.assigned_at,newAssignedAt:stamp}),stamp,stamp)]); await queueTaskNotice({id:taskId,taskNo:task.task_no,title:task.title,projectId:task.project_id,dueAt:task.due_at,priority:task.priority,sourceNo:task.source_no},assignee,user,request); return {message:`Đã chuyển nhiệm vụ cho ${assignee.fullName}; SLA trách nhiệm mới bắt đầu ngay tại thời điểm giao lại và toàn bộ lịch sử được giữ.`};
    }
    if (action === "mark_task_notification_read") { const notificationId=clean(payload.notificationId); await env.DB.prepare(`UPDATE task_notifications SET read_at=COALESCE(read_at,?),updated_at=? WHERE id=? AND user_id=?`).bind(stamp,stamp,notificationId,user.id).run(); return {message:"Đã đánh dấu thông báo đã đọc."}; }
    if (action === "save_supplier") {
        const supplierId = clean(payload.supplierId), code = clean(payload.code).toUpperCase(), name = clean(payload.name);
        if (!code || !name) throw new Error("Nhà cung cấp phải có Mã NCC và Tên nhà cung cấp.");
        const existing = await first(`SELECT id FROM suppliers WHERE upper(code)=upper(?) AND id<>?`, code, supplierId || "__NEW__");
        if (existing) throw new Error("Mã nhà cung cấp đã tồn tại.");
        const taxCode = clean(payload.taxCode) || null, contactName = clean(payload.contactName) || null, phone = clean(payload.phone) || null;
        const leadTimeDays = Math.max(0, Math.trunc(numberValue(payload.leadTimeDays))), rating = Math.max(0, Math.min(5, numberValue(payload.rating))), active = payload.active === false || clean(payload.active) === "0" ? 0 : 1;
        if (supplierId) { const old = await first(`SELECT * FROM suppliers WHERE id=?`, supplierId); if (!old) throw new Error("Không tìm thấy nhà cung cấp."); await env.DB.prepare(`UPDATE suppliers SET code=?,name=?,tax_code=?,contact_name=?,phone=?,lead_time_days=?,rating=?,active=?,updated_at=? WHERE id=?`).bind(code,name,taxCode,contactName,phone,leadTimeDays,rating,active,stamp,supplierId).run(); await audit(user.id,"UPDATE","supplier",supplierId,old,{code,name,active},request); return { message: `Đã cập nhật nhà cung cấp ${code}.` }; }
        const newId = id("SUP"); await env.DB.prepare(`INSERT INTO suppliers (id,code,name,tax_code,contact_name,phone,lead_time_days,rating,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,code,name,taxCode,contactName,phone,leadTimeDays,rating,active,stamp,stamp).run(); await audit(user.id,"CREATE","supplier",newId,null,{code,name},request); return { message: `Đã thêm nhà cung cấp ${code}.` };
    }
    if (action === "set_supplier_status") { const supplierId=clean(payload.supplierId), active=payload.active===true||clean(payload.active)==="1"?1:0; const old=await first(`SELECT * FROM suppliers WHERE id=?`,supplierId);if(!old)throw new Error("Không tìm thấy nhà cung cấp.");await env.DB.prepare(`UPDATE suppliers SET active=?,updated_at=? WHERE id=?`).bind(active,stamp,supplierId).run();await audit(user.id,active?"ACTIVATE":"HIDE","supplier",supplierId,old,{active},request);return {message:active?"Đã kích hoạt nhà cung cấp.":"Đã ẩn nhà cung cấp khỏi danh sách lập PO."};
    }
    if (action === "delete_supplier") {
        if(!isAdmin(user) && !isDepartmentApprover(user,"KH")) throw new Error("Chỉ Quản trị viên hoặc Trưởng phòng Kế hoạch được phân quyền mới được xóa/ngừng sử dụng Nhà cung cấp.");
        const supplierId=clean(payload.supplierId); const old=await first(`SELECT * FROM suppliers WHERE id=?`,supplierId); if(!old) throw new Error("Không tìm thấy nhà cung cấp.");
        const usage=await first(`SELECT COUNT(*) AS count FROM purchase_orders WHERE supplier_id=?`,supplierId);
        if(Number(usage?.count||0)>0){await env.DB.prepare(`UPDATE suppliers SET active=0,updated_at=? WHERE id=?`).bind(stamp,supplierId).run();await audit(user.id,"DEACTIVATE_LINKED","supplier",supplierId,old,{active:0,purchaseOrders:Number(usage.count)},request);return {message:"Nhà cung cấp đã phát sinh PO nên không xóa vật lý; hệ thống đã chuyển sang Ngừng sử dụng."};}
        await env.DB.prepare(`DELETE FROM suppliers WHERE id=?`).bind(supplierId).run(); await audit(user.id,"DELETE","supplier",supplierId,old,null,request); return {message:"Đã xóa Nhà cung cấp chưa phát sinh PO."};
    }
    if (action === "save_production_report") {
        const productionReportId=clean(payload.productionReportId),projectId=clean(payload.projectId),reportPeriod=clean(payload.reportPeriod),referenceNo=clean(payload.referenceNo)||null,description=clean(payload.description)||null;
        const plannedValue=strictNonNegativeNumber(payload.plannedValue ?? 0,"Giá trị kế hoạch"),actualValue=strictNonNegativeNumber(payload.actualValue ?? 0,"Giá trị sản lượng thực tế");
        if(!projectId||!/^\d{4}-\d{2}$/.test(reportPeriod))throw new Error("Báo cáo sản lượng phải có dự án và kỳ YYYY-MM.");if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền cập nhật sản lượng tại dự án này.");
        if(productionReportId){const old=await first(`SELECT * FROM production_reports WHERE id=?`,productionReportId);if(!old)throw new Error("Không tìm thấy báo cáo sản lượng.");if(clean(old.project_id)!==projectId)throw new Error("Không được chuyển báo cáo sang dự án khác.");if(clean(old.status)==="approved"&&!isAdmin(user))throw new Error("Báo cáo đã duyệt; chỉ Quản trị được phép mở lại/sửa.");const dup=await first(`SELECT id FROM production_reports WHERE project_id=? AND report_period=? AND id<>?`,projectId,reportPeriod,productionReportId);if(dup)throw new Error("Dự án đã có báo cáo sản lượng cho kỳ này.");await env.DB.prepare(`UPDATE production_reports SET report_period=?,reference_no=?,description=?,planned_value=?,actual_value=?,approved_value=CASE WHEN status='approved' THEN approved_value ELSE 0 END,status=CASE WHEN status='approved' THEN status ELSE 'submitted' END,submitted_by=?,updated_at=? WHERE id=?`).bind(reportPeriod,referenceNo,description,plannedValue,actualValue,user.id,stamp,productionReportId).run();await audit(user.id,"UPDATE","production_report",productionReportId,old,{projectId,reportPeriod,plannedValue,actualValue},request);return {message:"Đã cập nhật báo cáo sản lượng để Phòng Dự án kiểm tra/phê duyệt."};}
        const duplicate=await first(`SELECT id FROM production_reports WHERE project_id=? AND report_period=?`,projectId,reportPeriod);if(duplicate)throw new Error("Dự án đã có báo cáo sản lượng cho kỳ này.");const newId=id("PRD");await env.DB.prepare(`INSERT INTO production_reports(id,project_id,report_period,reference_no,description,planned_value,actual_value,approved_value,status,submitted_by,approved_by,approved_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,projectId,reportPeriod,referenceNo,description,plannedValue,actualValue,0,"submitted",user.id,null,null,stamp,stamp).run();await audit(user.id,"CREATE","production_report",newId,null,{projectId,reportPeriod,plannedValue,actualValue},request);return {message:"Đã ghi nhận báo cáo sản lượng tháng; không lấy số xuất kho làm sản lượng."};
    }
    if (action === "approve_production_report") {
        const productionReportId=clean(payload.productionReportId),approvedValue=strictNonNegativeNumber(payload.approvedValue,"Giá trị sản lượng được duyệt");const old=await first(`SELECT * FROM production_reports WHERE id=?`,productionReportId);if(!old)throw new Error("Không tìm thấy báo cáo sản lượng.");if(!(await canAccessProject(user,clean(old.project_id),true)))throw new Error("Không có quyền tại dự án này.");if(approvedValue>numberValue(old.actual_value))throw new Error("Sản lượng được duyệt không được vượt sản lượng thực tế đã báo cáo.");await env.DB.prepare(`UPDATE production_reports SET approved_value=?,status='approved',approved_by=?,approved_at=?,updated_at=? WHERE id=?`).bind(approvedValue,user.id,stamp,stamp,productionReportId).run();await audit(user.id,"APPROVE","production_report",productionReportId,old,{approvedValue},request);return {message:"Đã phê duyệt sản lượng. Giá trị này là nguồn chuẩn cho thu hồi vốn/KPI."};
    }
    if (action === "save_construction_daily_log") {
        const logId=clean(payload.logId),projectId=clean(payload.projectId),workDate=clean(payload.workDate),shift=clean(payload.shift)||"sang",weather=clean(payload.weather)||null,workContent=clean(payload.workContent)||null,laborCount=Math.max(0,Math.trunc(numberValue(payload.laborCount))||0),equipmentNote=clean(payload.equipmentNote)||null,note=clean(payload.note)||null,warehouseId=clean(payload.warehouseId)||null;
        const items=Array.isArray(payload.items)?payload.items:[];
        if(!projectId||!/^\d{4}-\d{2}-\d{2}$/.test(workDate))throw new Error("Nhật ký thi công phải có dự án và ngày YYYY-MM-DD.");if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền cập nhật nhật ký thi công tại dự án này.");
        if(logId){const old=await first(`SELECT * FROM construction_daily_logs WHERE id=?`,logId);if(!old)throw new Error("Không tìm thấy nhật ký thi công.");if(clean(old.project_id)!==projectId)throw new Error("Không được chuyển nhật ký sang dự án khác.");if(clean(old.status)==="approved"&&!isAdmin(user))throw new Error("Nhật ký đã được duyệt; chỉ Quản trị được phép mở lại/sửa.");const nextStatus=clean(old.status)==="approved"?"approved":(payload.submit===true?"submitted":clean(old.status)||"draft");await env.DB.prepare(`UPDATE construction_daily_logs SET work_date=?,shift=?,weather=?,work_content=?,labor_count=?,equipment_note=?,note=?,warehouse_id=?,status=?,submitted_by=CASE WHEN ?='submitted' THEN ? ELSE submitted_by END,updated_at=? WHERE id=?`).bind(workDate,shift,weather,workContent,laborCount,equipmentNote,note,warehouseId,nextStatus,nextStatus,user.id,stamp,logId).run();await env.DB.prepare(`DELETE FROM construction_daily_log_items WHERE log_id=?`).bind(logId).run();for(const row of items){const itemName=clean(row.itemName),location=clean(row.location)||null,unit=clean(row.unit)||null,itemNote=clean(row.note)||null;if(!itemName)continue;await env.DB.prepare(`INSERT INTO construction_daily_log_items(id,log_id,boq_item_id,item_name,location,planned_qty,completed_qty,unit,labor_hours,photo_attachment_id,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("CDLI"),logId,clean(row.boqItemId)||null,itemName,location,strictNonNegativeNumber(row.plannedQty??0,"Khối lượng kế hoạch"),strictNonNegativeNumber(row.completedQty??0,"Khối lượng thực hiện"),unit,strictNonNegativeNumber(row.laborHours??0,"Giờ công"),clean(row.photoAttachmentId)||null,itemNote,stamp,stamp).run();}await audit(user.id,"UPDATE","construction_daily_log",logId,old,{projectId,workDate,items:items.length},request);return {message:nextStatus==="submitted"?"Đã cập nhật và gửi nhật ký để Ban chỉ huy/Phòng Dự án kiểm tra.":"Đã cập nhật nhật ký thi công."};}
        const newId=id("CDL"),seq=await first(`SELECT COUNT(*)+1 AS n FROM construction_daily_logs WHERE project_id=? AND substr(work_date,1,4)=?`,projectId,workDate.slice(0,4));const logNo=`CDL-${clean((await first(`SELECT code FROM projects WHERE id=?`,projectId))?.code)||"DA"}-${workDate.slice(0,4)}-${String(numberValue(seq?.n)||1).padStart(4,"0")}`;const status0=payload.submit===true?"submitted":"draft";await env.DB.batch([env.DB.prepare(`INSERT INTO construction_daily_logs(id,log_no,project_id,warehouse_id,work_date,shift,weather,work_content,labor_count,equipment_note,status,submitted_by,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,logNo,projectId,warehouseId,workDate,shift,weather,workContent,laborCount,equipmentNote,status0,payload.submit===true?user.id:null,user.id,stamp,stamp)]);for(const row of items){const itemName=clean(row.itemName),location=clean(row.location)||null,unit=clean(row.unit)||null,itemNote=clean(row.note)||null;if(!itemName)continue;await env.DB.prepare(`INSERT INTO construction_daily_log_items(id,log_id,boq_item_id,item_name,location,planned_qty,completed_qty,unit,labor_hours,photo_attachment_id,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("CDLI"),newId,clean(row.boqItemId)||null,itemName,location,strictNonNegativeNumber(row.plannedQty??0,"Khối lượng kế hoạch"),strictNonNegativeNumber(row.completedQty??0,"Khối lượng thực hiện"),unit,strictNonNegativeNumber(row.laborHours??0,"Giờ công"),clean(row.photoAttachmentId)||null,itemNote,stamp,stamp).run();}await audit(user.id,"CREATE","construction_daily_log",newId,null,{projectId,workDate,items:items.length},request);return {message:status0==="submitted"?"Đã ghi nhật ký thi công và gửi kiểm tra.":"Đã ghi nhật ký thi công (bản nháp)."};
    }
    if (action === "approve_construction_daily_log") {
        const logId=clean(payload.logId),old=await first(`SELECT * FROM construction_daily_logs WHERE id=?`,logId);if(!old)throw new Error("Không tìm thấy nhật ký thi công.");if(!(await canAccessProject(user,clean(old.project_id),true)))throw new Error("Không có quyền tại dự án này.");if(clean(old.status)==="approved")throw new Error("Nhật ký đã được duyệt.");await env.DB.prepare(`UPDATE construction_daily_logs SET status='approved',approved_by=?,approved_at=?,updated_at=? WHERE id=?`).bind(user.id,stamp,stamp,logId).run();await audit(user.id,"APPROVE","construction_daily_log",logId,old,{},request);return {message:"Đã duyệt nhật ký thi công; tiến độ thực hiện được dùng làm cơ sở đối chiếu nghiệm thu."};
    }
    if (action === "delete_construction_daily_log") {
        const logId=clean(payload.logId),old=await first(`SELECT * FROM construction_daily_logs WHERE id=?`,logId);if(!old)throw new Error("Không tìm thấy nhật ký thi công.");if(!(await canAccessProject(user,clean(old.project_id),true)))throw new Error("Không có quyền tại dự án này.");if(clean(old.status)==="approved"&&!isAdmin(user))throw new Error("Nhật ký đã duyệt; chỉ Quản trị được xóa.");await env.DB.batch([env.DB.prepare(`DELETE FROM construction_daily_log_items WHERE log_id=?`).bind(logId),env.DB.prepare(`DELETE FROM construction_daily_logs WHERE id=?`).bind(logId)]);await audit(user.id,"DELETE","construction_daily_log",logId,old,null,request);return {message:"Đã xóa nhật ký thi công."};
    }
    if (action === "save_capital_recovery") {
        const recoveryId=clean(payload.recoveryId),projectId=clean(payload.projectId),periodKey=clean(payload.periodKey),referenceNo=clean(payload.referenceNo)||null,productionReportId=clean(payload.productionReportId)||null;
        const submittedValue=strictNonNegativeNumber(payload.submittedValue ?? 0,"Giá trị hồ sơ trình"),approvedValue=strictNonNegativeNumber(payload.approvedValue ?? 0,"Giá trị được duyệt"),invoiceValue=strictNonNegativeNumber(payload.invoiceValue ?? 0,"Giá trị hóa đơn");
        const invoiceNo=clean(payload.invoiceNo)||null,dueDate=clean(payload.dueDate)||null,note=clean(payload.note)||null;
        if(!projectId||!/^\d{4}-\d{2}$/.test(periodKey))throw new Error("Thu hồi vốn phải có dự án và kỳ YYYY-MM.");if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền cập nhật thu hồi vốn tại dự án này.");
        if(approvedValue>submittedValue)throw new Error("Giá trị được duyệt không được vượt giá trị hồ sơ đã trình.");if(invoiceValue>approvedValue)throw new Error("Giá trị hóa đơn không được vượt giá trị đã được duyệt.");if(dueDate&&!/^\d{4}-\d{2}-\d{2}$/.test(dueDate))throw new Error("Hạn thanh toán phải theo định dạng DD/MM/YYYY.");
        if(productionReportId){const pr=await first(`SELECT id,project_id AS projectId,status,approved_value AS approvedValue FROM production_reports WHERE id=?`,productionReportId);if(!pr||clean(pr.projectId)!==projectId)throw new Error("Báo cáo sản lượng không thuộc dự án đang chọn.");if(clean(pr.status)!=="approved")throw new Error("Chỉ được liên kết báo cáo sản lượng đã phê duyệt.");}
        const status=invoiceValue>0?"invoiced":approvedValue>0?"approved":submittedValue>0?"submitted":"preparing";
        if(recoveryId){const old=await first(`SELECT * FROM capital_recovery_records WHERE id=?`,recoveryId);if(!old)throw new Error("Không tìm thấy hồ sơ thu hồi vốn.");if(clean(old.project_id)!==projectId)throw new Error("Không được chuyển hồ sơ sang dự án khác.");await env.DB.prepare(`UPDATE capital_recovery_records SET period_key=?,reference_no=?,production_report_id=?,submitted_value=?,approved_value=?,invoice_no=?,invoice_value=?,due_date=?,status=?,note=?,updated_at=? WHERE id=?`).bind(periodKey,referenceNo,productionReportId,submittedValue,approvedValue,invoiceNo,invoiceValue,dueDate,status,note,stamp,recoveryId).run();await audit(user.id,"UPDATE","capital_recovery",recoveryId,old,{projectId,periodKey,submittedValue,approvedValue,invoiceValue},request);return {message:"Đã cập nhật chuỗi thu hồi vốn."};}
        const newId=id("REC");await env.DB.prepare(`INSERT INTO capital_recovery_records(id,project_id,period_key,reference_no,production_report_id,submitted_value,approved_value,invoice_no,invoice_value,due_date,status,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,projectId,periodKey,referenceNo,productionReportId,submittedValue,approvedValue,invoiceNo,invoiceValue,dueDate,status,note,user.id,stamp,stamp).run();await audit(user.id,"CREATE","capital_recovery",newId,null,{projectId,periodKey,submittedValue,approvedValue,invoiceValue},request);return {message:"Đã tạo hồ sơ thu hồi vốn theo chuỗi Sản lượng → Hồ sơ → Duyệt → Hóa đơn → Tiền thực thu."};
    }
    if (action === "delete_capital_recovery") {
        const recoveryId=clean(payload.recoveryId),old=await first(`SELECT * FROM capital_recovery_records WHERE id=?`,recoveryId);if(!old)throw new Error("Không tìm thấy hồ sơ thu hồi vốn.");if(!(await canAccessProject(user,clean(old.project_id),true)))throw new Error("Không có quyền tại dự án này.");const linked=await first(`SELECT COUNT(*) AS count FROM contract_payments WHERE recovery_record_id=?`,recoveryId);if(Number(linked?.count||0)>0)throw new Error("Hồ sơ đã có tiền thực thu liên kết nên không được xóa.");await env.DB.prepare(`DELETE FROM capital_recovery_records WHERE id=?`).bind(recoveryId).run();await audit(user.id,"DELETE","capital_recovery",recoveryId,old,null,request);return {message:"Đã xóa hồ sơ thu hồi vốn chưa phát sinh tiền thu."};
    }
    if (action === "save_contract_payment") {
        const paymentId=clean(payload.paymentId), projectId=clean(payload.projectId), recoveryRecordId=clean(payload.recoveryRecordId)||null, paymentDate=clean(payload.paymentDate), referenceNo=clean(payload.referenceNo)||null, description=clean(payload.description), amount=strictNonNegativeNumber(payload.amount,"Giá trị thanh toán"), note=clean(payload.note)||null;
        if(!projectId||!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)||!description)throw new Error("Thanh toán phải có dự án, ngày thanh toán và nội dung.");if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền cập nhật thanh toán tại dự án này.");
        if(recoveryRecordId){const recovery=await first(`SELECT id,project_id AS projectId FROM capital_recovery_records WHERE id=?`,recoveryRecordId);if(!recovery||clean(recovery.projectId)!==projectId)throw new Error("Hồ sơ thu hồi vốn không thuộc dự án đang chọn.");}
        if(paymentId){const old=await first(`SELECT * FROM contract_payments WHERE id=?`,paymentId);if(!old)throw new Error("Không tìm thấy dòng thanh toán.");if(clean(old.project_id)!==projectId)throw new Error("Không được chuyển dòng thanh toán sang dự án khác.");await env.DB.prepare(`UPDATE contract_payments SET recovery_record_id=?,payment_date=?,reference_no=?,description=?,amount=?,note=?,updated_at=? WHERE id=?`).bind(recoveryRecordId,paymentDate,referenceNo,description,amount,note,stamp,paymentId).run();await audit(user.id,"UPDATE","contract_payment",paymentId,old,{projectId,recoveryRecordId,paymentDate,amount},request);return {message:"Đã cập nhật tiền thực thu/Thanh toán HĐ."};}
        const newId=id("PAY");await env.DB.prepare(`INSERT INTO contract_payments (id,project_id,recovery_record_id,payment_date,reference_no,description,amount,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,projectId,recoveryRecordId,paymentDate,referenceNo,description,amount,note,user.id,stamp,stamp).run();await audit(user.id,"CREATE","contract_payment",newId,null,{projectId,recoveryRecordId,paymentDate,amount},request);return {message:"Đã ghi nhận tiền thực thu/Thanh toán HĐ."};
    }
    if (action === "import_contract_payments") {
        const projectId=clean(payload.projectId), rows=Array.isArray(payload.rows)?payload.rows:[];if(!projectId||!rows.length)throw new Error("File thanh toán không có dữ liệu.");if(rows.length>5000)throw new Error("Mỗi lần chỉ nhập tối đa 5.000 dòng thanh toán.");if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền cập nhật thanh toán tại dự án này.");const statements=[];for(let i=0;i<rows.length;i+=1){const row=rows[i],paymentDate=clean(row.paymentDate),description=clean(row.description),amount=strictNonNegativeNumber(row.amount,`Dòng ${i+1}: Giá trị thanh toán`);if(!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)||!description)throw new Error(`Dòng ${i+1}: thiếu ngày thanh toán hoặc nội dung.`);statements.push(env.DB.prepare(`INSERT INTO contract_payments (id,project_id,payment_date,reference_no,description,amount,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id("PAY"),projectId,paymentDate,clean(row.referenceNo)||null,description,amount,clean(row.note)||null,user.id,stamp,stamp));}await env.DB.batch(statements);await audit(user.id,"IMPORT","contract_payment",projectId,null,{rowCount:rows.length},request);return {message:`Đã nhập ${rows.length} dòng thanh toán HĐ.`};
    }
    if (action === "delete_contract_payment") {
        const paymentId=clean(payload.paymentId),old=await first(`SELECT * FROM contract_payments WHERE id=?`,paymentId);if(!old)throw new Error("Không tìm thấy dòng thanh toán.");if(!(await canAccessProject(user,clean(old.project_id),true)))throw new Error("Không có quyền tại dự án này.");await env.DB.prepare(`DELETE FROM contract_payments WHERE id=?`).bind(paymentId).run();await audit(user.id,"DELETE","contract_payment",paymentId,old,null,request);return {message:"Đã xóa dòng thanh toán HĐ."};
    }
    if (action === "save_team_subcontract") {
        requireRole(user,["admin","commander","project"]); const projectId=clean(payload.projectId),teamId=clean(payload.teamId),contractNo=clean(payload.contractNo).toUpperCase(),contractName=clean(payload.contractName),scopeText=clean(payload.scopeText),contractValue=strictNonNegativeNumber(payload.contractValue,"Giá trị giao khoán"); if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền tại dự án này."); const team=await first(`SELECT id FROM teams WHERE id=? AND project_id=? AND active=1`,teamId,projectId); if(!team||!contractNo||!contractName)throw new Error("Hợp đồng giao khoán phải chọn đúng tổ đội, có số và tên hợp đồng."); const existing=await first(`SELECT id FROM team_subcontracts WHERE project_id=? AND upper(contract_no)=upper(?)`,projectId,contractNo); if(existing)throw new Error("Số hợp đồng giao khoán đã tồn tại trong dự án."); const newId=id("TSC"); await env.DB.prepare(`INSERT INTO team_subcontracts(id,project_id,team_id,contract_no,contract_name,scope_text,contract_value,start_date,end_date,status,signed_at,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,projectId,teamId,contractNo,contractName,scopeText||null,contractValue,clean(payload.startDate)||null,clean(payload.endDate)||null,"active",stamp,clean(payload.note)||null,user.id,stamp,stamp).run(); await audit(user.id,"CREATE","team_subcontract",newId,null,{projectId,teamId,contractNo,contractValue,independentFromMainContract:true},request); return {message:`Đã lập HĐ giao khoán ${contractNo}; nghiệp vụ độc lập với HĐ chính dự án.`};
    }
    if (action === "save_team_production") {
        requireRole(user,["admin","commander","project"]); const projectId=clean(payload.projectId),subcontractId=clean(payload.subcontractId),periodKey=clean(payload.periodKey),description=clean(payload.description),submittedValue=strictNonNegativeNumber(payload.submittedValue,"Giá trị trình"),approvedValue=strictNonNegativeNumber(payload.approvedValue,"Giá trị duyệt"); if(approvedValue>submittedValue+1e-9)throw new Error("Sản lượng duyệt không được vượt giá trị trình."); const sc=await first(`SELECT team_id AS teamId,project_id AS projectId,contract_value AS contractValue,status FROM team_subcontracts WHERE id=?`,subcontractId); if(!sc||clean(sc.projectId)!==projectId||!(await canAccessProject(user,projectId,true)))throw new Error("Hợp đồng giao khoán không thuộc phạm vi dự án."); const accumulated=await first(`SELECT COALESCE(SUM(approved_value),0) AS value FROM team_production_records WHERE subcontract_id=? AND status='approved'`,subcontractId); if(numberValue(accumulated?.value)+approvedValue>numberValue(sc.contractValue)+1e-9)throw new Error("Lũy kế sản lượng duyệt vượt giá trị HĐ giao khoán."); const pid=id("TPR"); await env.DB.prepare(`INSERT INTO team_production_records(id,project_id,team_id,subcontract_id,period_key,reference_no,description,submitted_value,approved_value,status,submitted_by,approved_by,approved_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(pid,projectId,sc.teamId,subcontractId,periodKey,clean(payload.referenceNo)||null,description,submittedValue,approvedValue,"submitted",user.id,null,null,stamp,stamp).run(); await audit(user.id,"CREATE","team_production",pid,null,{subcontractId,periodKey,submittedValue,approvedValue},request); return {message:"Đã ghi nhận sản lượng tổ đội; chờ duyệt."};
    }
    if (action === "approve_team_production") {
        requireRole(user,["admin","commander","project"]); const productionId=clean(payload.productionId); const rec=await first(`SELECT * FROM team_production_records WHERE id=?`,productionId); if(!rec||clean(rec.status)!=="submitted")throw new Error("Hồ sơ sản lượng không còn ở trạng thái chờ duyệt."); if(!(await canAccessProject(user,clean(rec.project_id),true)))throw new Error("Không có quyền tại dự án này."); const sc=await first(`SELECT contract_value AS contractValue FROM team_subcontracts WHERE id=?`,rec.subcontract_id); const acc=await first(`SELECT COALESCE(SUM(approved_value),0) AS value FROM team_production_records WHERE subcontract_id=? AND status='approved' AND id<>?`,rec.subcontract_id,productionId); if(numberValue(acc?.value)+numberValue(rec.approved_value)>numberValue(sc?.contractValue)+1e-9)throw new Error("Lũy kế sản lượng duyệt vượt giá trị HĐ giao khoán."); await env.DB.prepare(`UPDATE team_production_records SET status='approved',approved_by=?,approved_at=?,updated_at=? WHERE id=?`).bind(user.id,stamp,stamp,productionId).run(); await audit(user.id,"APPROVE","team_production",productionId,rec,{status:"approved"},request); return {message:"Đã duyệt sản lượng tổ đội."};
    }
    if (action === "save_team_payment") {
        requireRole(user,["admin","commander","accountant","project"]); const projectId=clean(payload.projectId),subcontractId=clean(payload.subcontractId),amount=strictNonNegativeNumber(payload.amount,"Số tiền thanh toán"),paymentDate=clean(payload.paymentDate),paymentType=clean(payload.paymentType)||"progress",description=clean(payload.description); const sc=await first(`SELECT team_id AS teamId,project_id AS projectId FROM team_subcontracts WHERE id=?`,subcontractId); if(!sc||clean(sc.projectId)!==projectId||!(await canAccessProject(user,projectId,true)))throw new Error("Hợp đồng giao khoán không thuộc phạm vi dự án."); const approved=await first(`SELECT COALESCE(SUM(approved_value),0) AS value FROM team_production_records WHERE subcontract_id=? AND status='approved'`,subcontractId); const paid=await first(`SELECT COALESCE(SUM(amount),0) AS value FROM team_payments WHERE subcontract_id=?`,subcontractId); if(paymentType!=="advance"&&numberValue(paid?.value)+amount>numberValue(approved?.value)+1e-9)throw new Error("Thanh toán lũy kế vượt sản lượng tổ đội đã duyệt."); const payId=id("TPAY"); await env.DB.prepare(`INSERT INTO team_payments(id,project_id,team_id,subcontract_id,production_record_id,payment_date,payment_type,reference_no,description,amount,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(payId,projectId,sc.teamId,subcontractId,clean(payload.productionRecordId)||null,paymentDate,paymentType,clean(payload.referenceNo)||null,description,amount,clean(payload.note)||null,user.id,stamp,stamp).run(); await audit(user.id,"CREATE","team_payment",payId,null,{subcontractId,paymentType,amount,independentFromMainContract:true},request); return {message:"Đã ghi thanh toán tổ đội vào sổ giao khoán độc lập."};
    }
    if (action === "settle_team_subcontract") {
        requireRole(user,["admin","commander","accountant"]); const subcontractId=clean(payload.subcontractId); const sc=await first(`SELECT * FROM team_subcontracts WHERE id=?`,subcontractId); if(!sc||!(await canAccessProject(user,clean(sc.project_id),true)))throw new Error("Không có quyền quyết toán hợp đồng này."); const teamStock=await first(`WITH mv AS (SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE to_warehouse_id IS NOT NULL UNION ALL SELECT material_id,from_warehouse_id,-quantity FROM stock_movements WHERE from_warehouse_id IS NOT NULL) SELECT COUNT(*) AS count FROM (SELECT material_id,SUM(qty) AS balance FROM mv WHERE warehouse_id=(SELECT warehouse_id FROM teams WHERE id=?) GROUP BY material_id HAVING ABS(SUM(qty))>0.000001) x`,sc.team_id); if(Number(teamStock?.count||0)>0)throw new Error("Tổ đội vẫn còn vật tư đang giữ; phải hoàn trả hoặc xác nhận lắp đặt trước quyết toán."); const approved=numberValue((await first(`SELECT COALESCE(SUM(approved_value),0) AS value FROM team_production_records WHERE subcontract_id=? AND status='approved'`,subcontractId))?.value); const paid=numberValue((await first(`SELECT COALESCE(SUM(amount),0) AS value FROM team_payments WHERE subcontract_id=?`,subcontractId))?.value); const adjustment=numberValue(payload.adjustmentValue),finalValue=Math.max(0,approved+adjustment),remaining=finalValue-paid; const settlementNo=clean(payload.settlementNo)||`QT-${clean(sc.contract_no)}`; const sid=id("TSET"); await env.DB.batch([env.DB.prepare(`INSERT INTO team_settlements(id,project_id,team_id,subcontract_id,settlement_no,approved_production_value,adjustment_value,final_value,paid_value,remaining_value,status,settled_at,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(sid,sc.project_id,sc.team_id,subcontractId,settlementNo,approved,adjustment,finalValue,paid,remaining,"closed",stamp,clean(payload.note)||null,user.id,stamp,stamp),env.DB.prepare(`UPDATE team_subcontracts SET status='settled',updated_at=? WHERE id=?`).bind(stamp,subcontractId)]); await audit(user.id,"SETTLE","team_subcontract",subcontractId,sc,{finalValue,paid,remaining},request); return {message:`Đã quyết toán ${settlementNo}; công nợ còn ${remaining}.`};
    }
    if (action === "save_mar_approval") {
        requireRole(user,["project","procurement","admin"]); const projectId=clean(payload.projectId),materialId=clean(payload.materialId),status=clean(payload.status); if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền tại dự án này."); if(!["pending","approved","rejected"].includes(status))throw new Error("Trạng thái MAR không hợp lệ."); const material=await first(`SELECT id FROM materials WHERE id=? AND active=1`,materialId); if(!material)throw new Error("Không tìm thấy vật tư."); const existing=await first(`SELECT id FROM material_mar_approvals WHERE project_id=? AND material_id=?`,projectId,materialId); if(existing)await env.DB.prepare(`UPDATE material_mar_approvals SET approval_no=?,status=?,approved_at=?,approved_by=?,note=?,updated_at=? WHERE id=?`).bind(clean(payload.approvalNo)||null,status,status==="approved"?stamp:null,status==="approved"?user.id:null,clean(payload.note)||null,stamp,existing.id).run(); else await env.DB.prepare(`INSERT INTO material_mar_approvals (id,project_id,material_id,approval_no,status,approved_at,approved_by,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id("MAR"),projectId,materialId,clean(payload.approvalNo)||null,status,status==="approved"?stamp:null,status==="approved"?user.id:null,clean(payload.note)||null,stamp,stamp).run(); await audit(user.id,"MAR_STATUS","material_mar",`${projectId}:${materialId}`,null,{status,approvalNo:clean(payload.approvalNo)},request); return {message:`Đã cập nhật MAR: ${status}.`};
    }
    if (action === "save_material_external_code") {
        requireRole(user,["admin"]); const materialId=clean(payload.materialId),codeType=clean(payload.codeType).toUpperCase(),ownerKey=clean(payload.ownerKey),externalCode=clean(payload.externalCode);
        if(!materialId||!["CONTRACT","MAR","SUPPLIER"].includes(codeType)||!externalCode) throw new Error("Mapping mã tham chiếu chưa hợp lệ.");
        const material=await first(`SELECT id,code FROM materials WHERE id=? AND active=1`,materialId); if(!material) throw new Error("Không tìm thấy mã vật tư nội bộ.");
        const existing=await first(`SELECT id,material_id AS materialId FROM material_external_codes WHERE code_type=? AND owner_key=? AND upper(external_code)=upper(?)`,codeType,ownerKey,externalCode);
        if(existing&&clean(existing.materialId)!==materialId) throw new Error("Mã tham chiếu này đã mapping sang một mã vật tư nội bộ khác.");
        if(existing) await env.DB.prepare(`UPDATE material_external_codes SET active=1,updated_at=? WHERE id=?`).bind(stamp,existing.id).run();
        else await env.DB.prepare(`INSERT INTO material_external_codes (id,material_id,code_type,owner_key,external_code,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`).bind(id("MEC"),materialId,codeType,ownerKey,externalCode,1,stamp,stamp).run();
        await audit(user.id,"MAP_EXTERNAL_CODE","material",materialId,null,{codeType,ownerKey,externalCode,internalCode:material.code},request); return {message:`Đã mapping ${codeType} ${externalCode} → ${material.code}.`};
    }
    if (action === "save_material_uom_conversion") {
        requireRole(user,["admin"]); const materialId=clean(payload.materialId),fromUom=clean(payload.fromUom),toUom=clean(payload.toUom),factor=numberValue(payload.factor);
        if(!materialId||!fromUom||!toUom||factor<=0) throw new Error("Quy đổi đơn vị chưa hợp lệ."); const material=await first(`SELECT id,unit FROM materials WHERE id=?`,materialId); if(!material) throw new Error("Không tìm thấy vật tư.");
        const existing=await first(`SELECT id FROM material_uom_conversions WHERE material_id=? AND lower(from_uom)=lower(?) AND lower(to_uom)=lower(?)`,materialId,fromUom,toUom);
        if(existing) await env.DB.prepare(`UPDATE material_uom_conversions SET factor=?,active=1,updated_at=? WHERE id=?`).bind(factor,stamp,existing.id).run(); else await env.DB.prepare(`INSERT INTO material_uom_conversions (id,material_id,from_uom,to_uom,factor,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`).bind(id("UOM"),materialId,fromUom,toUom,factor,1,stamp,stamp).run();
        await audit(user.id,"SAVE_UOM","material",materialId,null,{fromUom,toUom,factor},request); return {message:`Đã lưu quy đổi 1 ${fromUom} = ${factor} ${toUom}.`};
    }
    if (action === "save_warehouse_location") {
        const warehouseId=clean(payload.warehouseId),code=clean(payload.code).toUpperCase(),name=clean(payload.name),locationType=clean(payload.locationType)||"bin"; if(!(await canAccessWarehouse(user,warehouseId,true))) throw new Error("Không có quyền cấu hình vị trí tại kho này."); if(!code||!name) throw new Error("Mã và tên vị trí kho là bắt buộc.");
        const existing=await first(`SELECT id FROM warehouse_locations WHERE warehouse_id=? AND upper(code)=upper(?)`,warehouseId,code); if(existing) await env.DB.prepare(`UPDATE warehouse_locations SET name=?,location_type=?,secure=?,active=?,updated_at=? WHERE id=?`).bind(name,locationType,payload.secure?1:0,payload.active===false?0:1,stamp,existing.id).run(); else await env.DB.prepare(`INSERT INTO warehouse_locations (id,warehouse_id,code,name,location_type,secure,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id("LOC"),warehouseId,code,name,locationType,payload.secure?1:0,1,stamp,stamp).run(); await audit(user.id,"SAVE_LOCATION","warehouse",warehouseId,null,{code,name,locationType,secure:Boolean(payload.secure)},request); return {message:`Đã lưu vị trí ${code} tại kho.`};
    }
    if (action === "reverse_stock_movement") {
        requireRole(user,["warehouse","commander","admin"]);const movementId=clean(payload.movementId),reason=clean(payload.reason);if(!reason)throw new Error("Đảo giao dịch phải có lý do.");const mov=await first(`SELECT * FROM stock_movements WHERE id=?`,movementId);if(!mov)throw new Error("Không tìm thấy giao dịch kho.");if(mov.reversal_of_id)throw new Error("Không được đảo một giao dịch đảo.");const reversed=await first(`SELECT id FROM stock_movements WHERE reversal_of_id=?`,movementId);if(reversed)throw new Error("Giao dịch này đã được đảo trước đó.");if(mov.from_warehouse_id&&!(await canAccessWarehouse(user,clean(mov.from_warehouse_id),true)))throw new Error("Không có quyền tại kho nguồn.");if(mov.to_warehouse_id&&!(await canAccessWarehouse(user,clean(mov.to_warehouse_id),true)))throw new Error("Không có quyền tại kho đích.");const sourceContractId=clean(mov.contract_id),destinationContractId=clean(mov.destination_contract_id)||sourceContractId,sourceContract=sourceContractId?await first(`SELECT id,project_id AS projectId FROM project_contracts WHERE id=?`,sourceContractId):null,destinationContract=destinationContractId?await first(`SELECT id,project_id AS projectId FROM project_contracts WHERE id=?`,destinationContractId):null,reverseId=id("MOV"),statements=[env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(reverseId,mov.project_id,destinationContractId||null,sourceContractId||null,mov.material_id,mov.to_warehouse_id,mov.from_warehouse_id,`REV_${clean(mov.movement_type)}`,numberValue(mov.quantity),numberValue(mov.unit_cost),stamp,"reversal",reason,user.id,movementId,stamp,stamp)];if(mov.to_warehouse_id&&destinationContract)statements.push(contractLedgerStatement({projectId:destinationContract.projectId,contractId:destinationContract.id,warehouseId:mov.to_warehouse_id,materialId:mov.material_id,movementType:`REV_${clean(mov.movement_type)}`,quantityDelta:-numberValue(mov.quantity),occurredAt:stamp,referenceType:"reversal",referenceId:reverseId,referenceItemId:movementId,counterpartyContractId:sourceContractId||null,actorUserId:user.id,note:reason}));if(mov.from_warehouse_id&&sourceContract)statements.push(contractLedgerStatement({projectId:sourceContract.projectId,contractId:sourceContract.id,warehouseId:mov.from_warehouse_id,materialId:mov.material_id,movementType:`REV_${clean(mov.movement_type)}`,quantityDelta:numberValue(mov.quantity),occurredAt:stamp,referenceType:"reversal",referenceId:reverseId,referenceItemId:movementId,counterpartyContractId:destinationContractId||null,actorUserId:user.id,note:reason}));await env.DB.batch(statements);await audit(user.id,"REVERSE","stock_movement",movementId,mov,{reason,reverseId,p10ContractLedger:true},request);return{message:"Đã tạo giao dịch đảo; sổ vật lý và sổ Contract được đảo đồng thời, giao dịch gốc vẫn giữ nguyên."};
    }
    if (action === "create_po") {
        requireRole(user, ["procurement", "admin"]);
        const requestId=clean(payload.requestId), warehouseId=clean(payload.warehouseId), defaultEta=clean(payload.eta), defaultSupplierId=clean(payload.supplierId);
        const mr=await first(`SELECT mr.id,mr.request_no AS requestNo,mr.project_id AS projectId,mr.contract_id AS contractId,mr.boq_version_id AS boqVersionId,mr.status,mr.supply_status AS supplyStatus,p.code AS projectCode,p.name AS projectName,u.email AS requesterEmail FROM material_requests mr JOIN projects p ON p.id=mr.project_id JOIN users u ON u.id=mr.requested_by WHERE mr.id=?`,requestId);
        if(!mr||mr.status!=="approved")throw new Error("Chỉ được tạo PO từ MR đã duyệt đủ các cấp.");if(!(await canAccessProject(user,String(mr.projectId),true)))throw new Error("Tài khoản không có quyền mua hàng tại dự án này.");
        const targetWarehouse=await first(`SELECT id FROM warehouses WHERE id=? AND project_id=? AND active=1`,warehouseId,mr.projectId);if(!targetWarehouse)throw new Error("Kho nhận PO phải thuộc đúng dự án.");if(!(await canAccessWarehouse(user,warehouseId,true)))throw new Error("Tài khoản không có quyền thao tác kho nhận PO này.");
        const sourceItems=await all(`SELECT mri.id,mri.material_id AS materialId,mri.contract_id AS contractId,mri.boq_version_id AS boqVersionId,mri.boq_item_id AS boqItemId,mri.approved_purchase_qty AS approvedQty,mri.ordered_qty AS orderedQty,m.system,m.requires_mar AS requiresMar FROM material_request_items mri JOIN materials m ON m.id=mri.material_id WHERE mri.request_id=?`,requestId),sourceMap=new Map(sourceItems.map((row)=>[String(row.id),row]));
        const rawLines=Array.isArray(payload.lines)?payload.lines:[];if(!warehouseId||!rawLines.length)throw new Error("PO phải có kho nhận và ít nhất một dòng mua hàng.");const normalized=[],addedByItem=new Map();
        rawLines.forEach((line,index)=>{const requestItemId=clean(line.requestItemId),source=sourceMap.get(requestItemId),qty=numberValue(line.quantity);if(!source||qty<=0)throw new Error(`Dòng PO ${index+1} không hợp lệ.`);const supplierId=clean(line.supplierId)||defaultSupplierId;if(!supplierId)throw new Error(`Dòng PO ${index+1}: chưa chọn Nhà cung cấp.`);const plannedDeliveryAt=clean(line.plannedDeliveryAt)||defaultEta;if(!/^\d{4}-\d{2}-\d{2}$/.test(plannedDeliveryAt))throw new Error(`Dòng PO ${index+1}: ngày giao dự kiến không hợp lệ.`);const next=(addedByItem.get(requestItemId)||0)+qty;if(numberValue(source.orderedQty)+next>numberValue(source.approvedQty)+1e-9)throw new Error(`Dòng PO ${index+1}: số lượng đặt vượt số đã được duyệt mua.`);addedByItem.set(requestItemId,next);normalized.push({requestItemId,qty,supplierId,plannedDeliveryAt,systemCode:clean(line.systemCode)||clean(source.system)||"KHAC"});});
        for (const line of normalized) { const source=sourceMap.get(String(line.requestItemId)); if(Number(source?.requiresMar||0)===1){const mar=await first(`SELECT status FROM material_mar_approvals WHERE project_id=? AND material_id=?`,mr.projectId,source.materialId);if(clean(mar?.status)!=="approved")throw new Error(`Vật tư ${source.materialId} yêu cầu MAR nhưng chưa được phê duyệt. Hệ thống chặn lập PO.`);} }
        const availabilityOverrideReason=clean(payload.availabilityOverrideReason);
        for (const materialId of [...new Set(normalized.map(line=>clean(sourceMap.get(String(line.requestItemId))?.materialId)).filter(Boolean))]) {
            const other=await first(`WITH mv AS (SELECT to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE material_id=? AND to_warehouse_id IS NOT NULL UNION ALL SELECT from_warehouse_id AS warehouse_id,-quantity AS qty FROM stock_movements WHERE material_id=? AND from_warehouse_id IS NOT NULL), b AS (SELECT warehouse_id,COALESCE(SUM(qty),0) AS on_hand FROM mv GROUP BY warehouse_id), r AS (SELECT warehouse_id,COALESCE(SUM(quantity),0) AS reserved FROM stock_reservations WHERE material_id=? AND status='active' GROUP BY warehouse_id) SELECT w.id,w.code,w.name,w.type,p.code AS projectCode,CASE WHEN COALESCE(b.on_hand,0)-COALESCE(r.reserved,0)>0 THEN COALESCE(b.on_hand,0)-COALESCE(r.reserved,0) ELSE 0 END AS available FROM b JOIN warehouses w ON w.id=b.warehouse_id AND w.active=1 AND w.type<>'transit' LEFT JOIN r ON r.warehouse_id=w.id LEFT JOIN projects p ON p.id=w.project_id WHERE w.id<>? AND COALESCE(b.on_hand,0)-COALESCE(r.reserved,0)>0 ORDER BY CASE WHEN w.type='central' THEN 0 ELSE 1 END,available DESC LIMIT 1`,materialId,materialId,materialId,warehouseId);
            if(other&&!availabilityOverrideReason) throw new Error(`Trước khi mua mới phải xử lý tồn/điều chuyển: vật tư ${materialId} còn ${numberValue(other.available)} tại ${clean(other.name)||clean(other.code)}${other.projectCode?` (${other.projectCode})`:''}. Hãy tạo Phiếu điều chuyển hoặc nhập lý do ngoại lệ được phê duyệt.`);
        }
        const supplierIds=[...new Set(normalized.map((line)=>String(line.supplierId)))];for(const supplierId of supplierIds){const supplier=await first(`SELECT id FROM suppliers WHERE id=? AND active=1`,supplierId);if(!supplier)throw new Error("Có Nhà cung cấp đã bị ẩn hoặc không tồn tại. Hãy chọn lại NCC.");}
        const groups=new Map();normalized.forEach((line)=>{const key=String(line.supplierId);if(!groups.has(key))groups.set(key,[]);groups.get(key).push(line);});const poYear=Number(stamp.slice(0,4)),poNos=[],allStatements=[];let firstPoId="";
        for(const [supplierId,groupLines] of groups){const seqKey=`PO:${mr.projectId}:${poYear}`,seq=await first(`INSERT INTO document_sequences (id,document_type,project_id,year,last_number,updated_at) VALUES (?,?,?,?,1,?) ON CONFLICT(id) DO UPDATE SET last_number=document_sequences.last_number+1,updated_at=excluded.updated_at RETURNING document_sequences.last_number AS lastNumber`,seqKey,"PO",mr.projectId,poYear,stamp),poId=id("PO");if(!firstPoId)firstPoId=poId;const poNo=`PO-${clean(mr.projectCode).toUpperCase()}-${poYear}-${String(Number(seq?.lastNumber||1)).padStart(4,"0")}`;poNos.push(poNo);const eta=groupLines.map((line)=>clean(line.plannedDeliveryAt)).sort()[0]||defaultEta;allStatements.push(env.DB.prepare(`INSERT INTO purchase_orders (id,po_no,request_id,project_id,contract_id,boq_version_id,supplier_id,receiving_warehouse_id,buyer_user_id,ordered_at,eta,delivery_queued_at,delivery_completed_at,status,total_value,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(poId,poNo,requestId,mr.projectId,clean(mr.contractId)||null,clean(mr.boqVersionId)||null,supplierId,warehouseId,user.id,stamp,eta,stamp,null,"pending_approval",0,stamp,stamp));groupLines.forEach((line,index)=>{const source=sourceMap.get(String(line.requestItemId)),poiId=id("POI");allStatements.push(env.DB.prepare(`INSERT INTO purchase_order_items (id,purchase_order_id,request_item_id,contract_id,boq_version_id,boq_item_id,line_no,ordered_qty,unit_price,system_code,planned_delivery_at,delivered_qty,received_qty,closed_qty,status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(poiId,poId,clean(line.requestItemId),clean(source?.contractId)||clean(mr.contractId)||null,clean(source?.boqVersionId)||clean(mr.boqVersionId)||null,clean(source?.boqItemId)||null,index+1,numberValue(line.qty),0,clean(line.systemCode),clean(line.plannedDeliveryAt),0,0,0,"ordered",stamp,stamp));allStatements.push(env.DB.prepare(`INSERT INTO procurement_allocations(id,project_id,contract_id,boq_version_id,boq_item_id,material_id,request_item_id,purchase_order_item_id,stage,quantity,reference_no,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("PAL"),mr.projectId,clean(source?.contractId)||clean(mr.contractId),clean(source?.boqVersionId)||clean(mr.boqVersionId)||null,clean(source?.boqItemId)||null,clean(source?.materialId),clean(line.requestItemId),poiId,"PO",numberValue(line.qty),poNo,stamp,stamp));});allStatements.push(env.DB.prepare(`INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("SWF"),requestId,poId,null,"delivery","pending",stamp,etaDeadline(eta),null,null,"PO đã phát hành, chờ nhà cung cấp giao",stamp,stamp));const deliveryEmail=await supplyEmailStatement({requestId,requestNo:String(mr.requestNo),projectId:String(mr.projectId),projectCode:String(mr.projectCode),projectName:String(mr.projectName),requesterEmail:mr.requesterEmail?String(mr.requesterEmail):null,poNo,eta},102,"po_waiting_delivery","PO mới chờ giao hàng",`${poNo} đã phát hành và được tự chuyển sang Chờ giao hàng.`,request);if(deliveryEmail)allStatements.push(deliveryEmail);}
        for(const [requestItemId,qty] of addedByItem){const source=sourceMap.get(requestItemId),finalQty=numberValue(source.orderedQty)+qty;allStatements.push(env.DB.prepare(`UPDATE material_request_items SET ordered_qty=ordered_qty+?,line_status=?,updated_at=? WHERE id=?`).bind(qty,finalQty+1e-9>=numberValue(source.approvedQty)?"ordered":"approved",stamp,requestItemId));}
        const willComplete=sourceItems.every((source)=>numberValue(source.orderedQty)+(addedByItem.get(String(source.id))||0)+1e-9>=numberValue(source.approvedQty));allStatements.push(env.DB.prepare(`UPDATE material_requests SET supply_status=?,updated_at=? WHERE id=?`).bind(willComplete?"waiting_delivery":"awaiting_po",stamp,requestId));allStatements.push(env.DB.prepare(`INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM supply_workflow_steps WHERE request_id=? AND step='po_creation')`).bind(id("SWF"),requestId,firstPoId,null,"po_creation","completed",stamp,stamp,stamp,user.id,`${poNos.length} PO được phát hành`,stamp,stamp,requestId)); /* Bảo đảm luôn có bước po_creation */allStatements.push(env.DB.prepare(`UPDATE supply_workflow_steps SET purchase_order_id=COALESCE(purchase_order_id,?),status='completed',completed_at=?,completed_by=?,comment=?,updated_at=? WHERE request_id=? AND step='po_creation' AND status='pending'`).bind(firstPoId,stamp,user.id,`${poNos.length} PO được phát hành`,stamp,requestId));const supplySla=await supplySlaHours();if(!willComplete)allStatements.push(env.DB.prepare(`INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("SWF"),requestId,null,null,"po_creation","pending",stamp,addHours(stamp,supplySla.po),null,null,"Còn dòng chưa đặt đủ sau khi tách PO",stamp,stamp));await env.DB.batch(allStatements);await audit(user.id,"CREATE","purchase_order",firstPoId,null,{poNos,requestNo:mr.requestNo,projectId:mr.projectId,contractId:mr.contractId,boqVersionId:mr.boqVersionId,supplierCount:groups.size,lineCount:normalized.length,total:0,availabilityOverrideReason:availabilityOverrideReason||null},request);await closeSourceTask("MR",requestId,"MR_TO_PO",user,request);const supplyAssignee=await defaultDepartmentAssignee("KH",String(mr.projectId));if(supplyAssignee)await createDepartmentTask({department:"KH",workGroup:"CUNG ỨNG",title:`Theo dõi giao hàng ${poNos.join(", ")}`,description:"Theo dõi ETA, xác nhận NCC, vận chuyển, giao thiếu/giao bù và cảnh báo nguy cơ chậm.",projectId:String(mr.projectId),sourceModule:"receiving",sourceType:"PO",sourceId:firstPoId,sourceNo:poNos.join(", "),workStep:"PO_SUPPLY",assignedTo:supplyAssignee.id,assignedBy:user.id,dueAt:etaDeadline(defaultEta||normalized[0]?.plannedDeliveryAt||stamp.slice(0,10)),priority:"high",requiredOutput:"Giao hàng/GRN đúng kế hoạch hoặc cảnh báo có bằng chứng",origin:"automatic",dedupeKey:`KH:PO:${firstPoId}:PO_SUPPLY`},user,request);return { warnings: await approvalWarnings("purchase_order", poId), message:`Đã phát hành ${poNos.length} PO cho ${groups.size} nhà cung cấp: ${poNos.join(", ")}.`};
    }
    if (action === "close_po_line") {
        requireRole(user, ["procurement", "project", "admin"]);
        const poItemId=clean(payload.purchaseOrderItemId); const reason=clean(payload.reason);
        if (!reason) throw new Error("Đóng thiếu phải có lý do được phê duyệt.");
        const line=await first(`SELECT poi.id,poi.purchase_order_id AS purchaseOrderId,poi.request_item_id AS requestItemId,poi.ordered_qty AS orderedQty,poi.delivered_qty AS deliveredQty,poi.received_qty AS receivedQty,poi.closed_qty AS closedQty,po.project_id AS projectId,po.request_id AS requestId FROM purchase_order_items poi JOIN purchase_orders po ON po.id=poi.purchase_order_id WHERE poi.id=?`,poItemId);
        if(!line) throw new Error("Không tìm thấy dòng PO."); if(!(await canAccessProject(user,String(line.projectId),true))) throw new Error("Không có quyền tại dự án này.");
        const shortage=Math.max(0,numberValue(line.orderedQty)-numberValue(line.deliveredQty)-numberValue(line.closedQty)); if(shortage<=0) throw new Error("Dòng PO không còn số lượng thiếu để đóng.");
        await env.DB.batch([env.DB.prepare(`UPDATE purchase_order_items SET closed_qty=closed_qty+?,close_reason=?,closed_by=?,closed_at=?,status='closed_shortage',updated_at=? WHERE id=?`).bind(shortage,reason,user.id,stamp,stamp,poItemId),env.DB.prepare(`UPDATE material_request_items SET closed_qty=closed_qty+?,close_reason=?,line_status=CASE WHEN received_qty+closed_qty+?>=approved_purchase_qty THEN 'closed_shortage' ELSE line_status END,updated_at=? WHERE id=?`).bind(shortage,reason,shortage,stamp,line.requestItemId)]);
        const poOpen=await first(`SELECT COUNT(*) AS count FROM purchase_order_items WHERE purchase_order_id=? AND received_qty+closed_qty<ordered_qty`,line.purchaseOrderId); const requestOpen=await first(`SELECT COUNT(*) AS count FROM material_request_items WHERE request_id=? AND received_qty+closed_qty<approved_purchase_qty`,line.requestId);
        if(Number(poOpen?.count||0)===0) await env.DB.prepare(`UPDATE purchase_orders SET status='completed_with_shortage',delivery_completed_at=?,updated_at=? WHERE id=?`).bind(stamp,stamp,line.purchaseOrderId).run(); if(Number(requestOpen?.count||0)===0) await env.DB.prepare(`UPDATE material_requests SET supply_status='completed_with_shortage',updated_at=? WHERE id=?`).bind(stamp,line.requestId).run();
        await audit(user.id,"CLOSE_SHORTAGE","purchase_order_item",poItemId,line,{shortage,reason},request); return { message: `Đã đóng thiếu ${shortage} cho dòng PO; phiếu gốc vẫn giữ số lượng đề nghị và lý do chênh lệch.` };
    }
    if (action === "receive_goods") {
        requireRole(user, ["warehouse", "admin"]);
        const poId = clean(payload.purchaseOrderId);
        const lines = Array.isArray(payload.lines) ? payload.lines : [];
        const po = await first(`SELECT po.id,po.po_no AS poNo,po.request_id AS requestId,po.project_id AS projectId,po.contract_id AS contractId,po.boq_version_id AS boqVersionId,po.receiving_warehouse_id AS warehouseId,po.status,po.eta,mr.request_no AS requestNo,p.code AS projectCode,p.name AS projectName,u.email AS requesterEmail FROM purchase_orders po JOIN material_requests mr ON mr.id=po.request_id JOIN projects p ON p.id=po.project_id JOIN users u ON u.id=mr.requested_by WHERE po.id=?`, poId);
        if (!po || !lines.length)
            throw new Error("Phiếu nhập cần PO và ít nhất một dòng nhận hàng.");
        if (!(await canAccessProject(user, String(po.projectId), true)))
            throw new Error("Tài khoản không có quyền giao nhận tại dự án này.");
        if (!(await canAccessWarehouse(user, String(po.warehouseId), true)))
            throw new Error("Tài khoản không có quyền thao tác kho nhận hàng này.");
        const poItems = await all(`SELECT poi.id,poi.request_item_id AS requestItemId,poi.contract_id AS contractId,poi.boq_version_id AS boqVersionId,poi.boq_item_id AS boqItemId,poi.ordered_qty AS orderedQty,poi.delivered_qty AS deliveredQty,poi.received_qty AS receivedQty,poi.closed_qty AS closedQty,mri.material_id AS materialId FROM purchase_order_items poi JOIN material_request_items mri ON mri.id=poi.request_item_id WHERE poi.purchase_order_id=?`, poId);
        const map = new Map(poItems.map((row) => [String(row.id), row]));
        const receiptId = id("GRN"); const receiptYear=Number(stamp.slice(0,4)); const receiptSequenceKey=`GRN:${po.projectId}:${receiptYear}`; const receiptSequence=await first(`INSERT INTO document_sequences (id,document_type,project_id,year,last_number,updated_at) VALUES (?,?,?,?,1,?) ON CONFLICT(id) DO UPDATE SET last_number=document_sequences.last_number+1,updated_at=excluded.updated_at RETURNING document_sequences.last_number AS lastNumber`,receiptSequenceKey,"GRN",po.projectId,receiptYear,stamp);
        const receiptNo = `GRN-${clean(po.projectCode).toUpperCase()}-${receiptYear}-${String(Number(receiptSequence?.lastNumber||1)).padStart(4,"0")}`;
        if (!po.requestId)
            throw new Error("PO chưa liên kết được với phiếu đề nghị nguồn.");
        const certificateStatus = clean(payload.certificateStatus) || "missing";
        const deliveryDocumentStatus = clean(payload.deliveryDocumentStatus) || "missing";
        if (!["complete", "missing", "not_required"].includes(certificateStatus))
            throw new Error("Trạng thái chứng chỉ không hợp lệ.");
        if (!["complete", "missing"].includes(deliveryDocumentStatus))
            throw new Error("Trạng thái giấy tờ giao hàng không hợp lệ.");
        const requiresCocqRow=await first(`SELECT COUNT(*) AS count FROM goods_receipt_items gri JOIN purchase_order_items poi ON poi.id=gri.purchase_order_item_id JOIN material_request_items mri ON mri.id=poi.request_item_id JOIN materials m ON m.id=mri.material_id WHERE gri.receipt_id=? AND m.requires_cocq=1`,receiptId);
        if (deliveryDocumentStatus !== "complete") throw new Error("Thiếu giấy giao hàng/biên bản bắt buộc; không được xác nhận nhập kho.");
        if (Number(requiresCocqRow?.count||0)>0 && certificateStatus !== "complete") throw new Error("Có vật tư yêu cầu CO/CQ/chứng chỉ nhưng hồ sơ chưa đầy đủ; không được xác nhận nhập kho.");
        const documentsOk = deliveryDocumentStatus === "complete" && (Number(requiresCocqRow?.count||0)===0 || certificateStatus === "complete");
        const qcOk = Boolean(payload.qcOk);
        const posting = "pending_confirmation";
        const acceptedByItem = new Map();
        for (const line of lines) {
            const itemId = clean(line.purchaseOrderItemId);
            const source = map.get(itemId);
            const actualQty = numberValue(line.quantity);
            if (!source || actualQty <= 0 || acceptedByItem.has(itemId))
                throw new Error("Dòng giao hàng thực tế không hợp lệ hoặc bị trùng.");
            const remaining = Math.max(0, numberValue(source.orderedQty) - numberValue(source.deliveredQty) - numberValue(source.closedQty));
            acceptedByItem.set(itemId, qcOk ? Math.min(actualQty, remaining) : 0);
        }
        const isFullyDelivered = poItems.every((item) => numberValue(item.deliveredQty) + (acceptedByItem.get(String(item.id)) || 0) + numberValue(item.closedQty) >= numberValue(item.orderedQty) - 1e-9);
        const hasAnyAccepted = poItems.some((item) => numberValue(item.deliveredQty) + (acceptedByItem.get(String(item.id)) || 0) > 0);
        const nextStatus = isFullyDelivered ? "delivered_pending_confirmation" : hasAnyAccepted ? "partial_delivery" : "waiting_delivery";
        const supplySla = await supplySlaHours();
        const statements = [env.DB.prepare(`INSERT INTO goods_receipts (id,receipt_no,purchase_order_id,contract_id,boq_version_id,warehouse_id,received_by,received_at,delivery_note_no,qc_status,document_status,certificate_status,delivery_document_status,bch_confirmation_status,bch_confirmed_by,bch_confirmed_at,bch_comment,posting_status,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(receiptId, receiptNo, poId, clean(po.contractId)||null, clean(po.boqVersionId)||null, po.warehouseId, user.id, stamp, clean(payload.deliveryNoteNo) || null, qcOk ? "accepted" : "rejected", documentsOk ? "complete" : "missing", certificateStatus, deliveryDocumentStatus, "pending", null, null, null, posting, stamp, stamp)];
        let actualTotal = 0;
        let acceptedTotal = 0;
        lines.forEach((line) => {
            const source = map.get(clean(line.purchaseOrderItemId));
            const actualQty = numberValue(line.quantity);
            const accepted = acceptedByItem.get(String(source.id)) || 0;
            const rejected = actualQty - accepted;
            actualTotal += actualQty;
            acceptedTotal += accepted;
            const receiptItemId=id("GRNI"); statements.push(env.DB.prepare(`INSERT INTO goods_receipt_items (id,receipt_id,purchase_order_item_id,contract_id,boq_version_id,boq_item_id,received_qty,accepted_qty,rejected_qty,lot_no,qc_result,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(receiptItemId, receiptId, source.id, clean(source.contractId)||clean(po.contractId)||null, clean(source.boqVersionId)||clean(po.boqVersionId)||null, clean(source.boqItemId)||null, actualQty, accepted, rejected, clean(line.lotNo) || null, qcOk ? accepted < actualQty ? "accepted_with_variance" : "accepted" : "rejected", stamp, stamp));
            if(accepted>0) statements.push(env.DB.prepare(`INSERT INTO procurement_allocations(id,project_id,contract_id,boq_version_id,boq_item_id,material_id,request_item_id,purchase_order_item_id,receipt_item_id,stage,quantity,reference_no,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("PAL"),po.projectId,clean(source.contractId)||clean(po.contractId),clean(source.boqVersionId)||clean(po.boqVersionId)||null,clean(source.boqItemId)||null,clean(source.materialId),clean(source.requestItemId),source.id,receiptItemId,"RECEIPT",accepted,receiptNo,stamp,stamp));
            statements.push(env.DB.prepare(`UPDATE purchase_order_items SET delivered_qty=delivered_qty+?,status=CASE WHEN delivered_qty+?+closed_qty>=ordered_qty THEN 'delivered_pending_confirmation' WHEN delivered_qty+?>0 THEN 'partial_delivery' ELSE 'ordered' END,updated_at=? WHERE id=?`).bind(accepted, accepted, accepted, stamp, source.id));
            statements.push(env.DB.prepare(`UPDATE material_request_items SET delivered_qty=delivered_qty+?,line_status=CASE WHEN delivered_qty+?+closed_qty>=approved_purchase_qty THEN 'delivered_pending_confirmation' WHEN delivered_qty+?>0 THEN 'partial_delivery' ELSE line_status END,updated_at=? WHERE id=?`).bind(accepted, accepted, accepted, stamp, source.requestItemId));
        });
        statements.push(env.DB.prepare(`UPDATE purchase_orders SET status=?,delivery_completed_at=CASE WHEN ? THEN ? ELSE delivery_completed_at END,updated_at=? WHERE id=?`).bind(nextStatus, isFullyDelivered ? 1 : 0, stamp, stamp, poId));
        statements.push(env.DB.prepare(`UPDATE material_requests SET supply_status=?,updated_at=? WHERE id=?`).bind(isFullyDelivered ? "awaiting_bch_confirmation" : "partial_delivery", stamp, po.requestId));
        if (isFullyDelivered)
            statements.push(env.DB.prepare(`UPDATE supply_workflow_steps SET status='completed',completed_at=?,completed_by=?,comment='Đã giao đủ số lượng được chấp nhận',updated_at=? WHERE purchase_order_id=? AND step='delivery' AND status='pending'`).bind(stamp, user.id, stamp, poId));
        statements.push(env.DB.prepare(`INSERT INTO supply_workflow_steps (id,request_id,purchase_order_id,receipt_id,step,status,queued_at,due_at,completed_at,completed_by,comment,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("SWF"), po.requestId, poId, receiptId, "bch_confirmation", "pending", stamp, addHours(stamp, supplySla.bch), null, null, "Chờ BCH kiểm tra ảnh, số lượng và hồ sơ giao hàng", stamp, stamp));
        const bchEmail = await supplyEmailStatement({ requestId: String(po.requestId), requestNo: String(po.requestNo), projectId: String(po.projectId), projectCode: String(po.projectCode), projectName: String(po.projectName), requesterEmail: po.requesterEmail ? String(po.requesterEmail) : null, poNo: String(po.poNo), receiptNo, eta: po.eta ? String(po.eta) : null }, 103, "delivery_waiting_bch", "Chuyến giao chờ BCH xác nhận", `Thực giao ${actualTotal}; chấp nhận ${acceptedTotal}. Vui lòng kiểm tra ảnh, chứng chỉ và giấy giao hàng.`, request);
        if (bchEmail)
            statements.push(bchEmail);
        await env.DB.batch(statements);
        await audit(user.id, "POST", "goods_receipt", receiptId, null, { receiptNo, poNo: po.poNo, contractId:po.contractId, boqVersionId:po.boqVersionId, posting }, request);
        return { warnings: await approvalWarnings("goods_receipt", receiptId), message: posting === "posted" ? `Đã ghi nhận ${receiptNo}; đơn tự chuyển sang chờ BCH tải/kiểm tra ảnh và xác nhận.` : `${receiptNo} đã lưu nhưng bị chặn ghi sổ do QC hoặc hồ sơ chưa đạt; BCH vẫn phải xác nhận tình trạng thực tế.` };
    }
    if (action === "confirm_delivery") {
        requireRole(user, ["commander", "project", "admin"]);
        const receiptId = clean(payload.receiptId);
        const receipt = await first(`SELECT gr.id,gr.receipt_no AS receiptNo,gr.purchase_order_id AS purchaseOrderId,gr.contract_id AS contractId,gr.boq_version_id AS boqVersionId,gr.warehouse_id AS warehouseId,gr.qc_status AS qcStatus,gr.posting_status AS postingStatus,gr.bch_confirmation_status AS confirmationStatus,po.po_no AS poNo,po.eta,po.request_id AS requestId,po.project_id AS projectId,mr.request_no AS requestNo,p.code AS projectCode,p.name AS projectName,u.email AS requesterEmail FROM goods_receipts gr JOIN purchase_orders po ON po.id=gr.purchase_order_id JOIN material_requests mr ON mr.id=po.request_id JOIN projects p ON p.id=po.project_id JOIN users u ON u.id=mr.requested_by WHERE gr.id=?`, receiptId);
        if (!receipt || receipt.confirmationStatus !== "pending")
            throw new Error("Chuyến giao không tồn tại hoặc đã được BCH xác nhận.");
        if (!(await canAccessProject(user, String(receipt.projectId), true)))
            throw new Error("Tài khoản không có quyền xác nhận tại dự án này.");
        if (!(await canAccessWarehouse(user, String(receipt.warehouseId), true)))
            throw new Error("Tài khoản không có quyền xác nhận tại kho này.");
        const imageCount = await first(`SELECT COUNT(*) AS count FROM attachments WHERE entity_type='goods_receipt' AND entity_id=? AND lower(mime_type) LIKE 'image/%'`, receiptId);
        if (Number(imageCount?.count || 0) < 1)
            throw new Error("Phải tải ít nhất một ảnh giao hàng thực tế trước khi BCH xác nhận.");
        const certificateStatus = clean(payload.certificateStatus);
        const deliveryDocumentStatus = clean(payload.deliveryDocumentStatus);
        if (!["complete", "missing", "not_required"].includes(certificateStatus))
            throw new Error("BCH phải xác nhận trạng thái chứng chỉ/CO-CQ.");
        if (!["complete", "missing"].includes(deliveryDocumentStatus))
            throw new Error("BCH phải xác nhận tình trạng giấy giao hàng kèm theo.");
        const requiresCocqRow=await first(`SELECT COUNT(*) AS count FROM goods_receipt_items gri JOIN purchase_order_items poi ON poi.id=gri.purchase_order_item_id JOIN material_request_items mri ON mri.id=poi.request_item_id JOIN materials m ON m.id=mri.material_id WHERE gri.receipt_id=? AND m.requires_cocq=1`,receiptId);
        if (deliveryDocumentStatus !== "complete") throw new Error("Thiếu giấy giao hàng/biên bản bắt buộc; không được xác nhận nhập kho.");
        if (Number(requiresCocqRow?.count||0)>0 && certificateStatus !== "complete") throw new Error("Có vật tư yêu cầu CO/CQ/chứng chỉ nhưng hồ sơ chưa đầy đủ; không được xác nhận nhập kho.");
        const documentsOk = deliveryDocumentStatus === "complete" && (Number(requiresCocqRow?.count||0)===0 || certificateStatus === "complete");
        const receiptItems = await all(`SELECT gri.id,gri.purchase_order_item_id AS purchaseOrderItemId,gri.contract_id AS contractId,gri.boq_version_id AS boqVersionId,gri.boq_item_id AS boqItemId,gri.accepted_qty AS acceptedQty,gri.rejected_qty AS rejectedQty,poi.request_item_id AS requestItemId,mri.material_id AS materialId FROM goods_receipt_items gri JOIN purchase_order_items poi ON poi.id=gri.purchase_order_item_id JOIN material_request_items mri ON mri.id=poi.request_item_id WHERE gri.receipt_id=?`, receiptId);
        const currentAccepted = receiptItems.reduce((sum,item)=>sum+numberValue(item.acceptedQty),0);
        const poTotals = await first(`SELECT COALESCE(SUM(ordered_qty),0) AS orderedQty,COALESCE(SUM(received_qty),0) AS receivedQty,COALESCE(SUM(closed_qty),0) AS closedQty FROM purchase_order_items WHERE purchase_order_id=?`, receipt.purchaseOrderId);
        const requestTotals = await first(`SELECT COALESCE(SUM(approved_purchase_qty),0) AS approvedQty,COALESCE(SUM(received_qty),0) AS receivedQty,COALESCE(SUM(closed_qty),0) AS closedQty FROM material_request_items WHERE request_id=?`, receipt.requestId);
        const otherPending = await first(`SELECT COUNT(*) AS count FROM goods_receipts WHERE purchase_order_id=? AND id<>? AND bch_confirmation_status='pending'`, receipt.purchaseOrderId, receiptId);
        const otherExceptions = await first(`SELECT COUNT(*) AS count FROM goods_receipts WHERE purchase_order_id=? AND id<>? AND bch_confirmation_status='confirmed' AND (certificate_status='missing' OR delivery_document_status='missing')`, receipt.purchaseOrderId, receiptId);
        const requestExceptions = await first(`SELECT COUNT(*) AS count FROM goods_receipts gr JOIN purchase_orders po ON po.id=gr.purchase_order_id WHERE po.request_id=? AND gr.id<>? AND gr.bch_confirmation_status='confirmed' AND (gr.certificate_status='missing' OR gr.delivery_document_status='missing')`, receipt.requestId, receiptId);
        const fullyDelivered = numberValue(poTotals?.receivedQty) + currentAccepted + numberValue(poTotals?.closedQty) >= numberValue(poTotals?.orderedQty) - 1e-9;
        const hasAccepted = numberValue(poTotals?.receivedQty) + currentAccepted > 0;
        const allConfirmed = Number(otherPending?.count || 0) === 0;
        const hasExceptions = Number(otherExceptions?.count || 0) > 0 || !documentsOk;
        const completed = fullyDelivered && allConfirmed;
        const nextStatus = completed ? hasExceptions ? "completed_with_exceptions" : "completed" : fullyDelivered ? "delivered_pending_confirmation" : hasAccepted ? "partial_delivery" : "waiting_delivery";
        const requestCompleted = numberValue(requestTotals?.receivedQty) + currentAccepted + numberValue(requestTotals?.closedQty) >= numberValue(requestTotals?.approvedQty) - 1e-9;
        const requestHasExceptions = Number(requestExceptions?.count || 0) > 0 || !documentsOk;
        const nextRequestStatus = requestCompleted ? (requestHasExceptions ? "received_full_docs_pending" : "completed") : "partial_delivery";
        const statements = [
            env.DB.prepare(`UPDATE goods_receipts SET certificate_status=?,delivery_document_status=?,document_status=?,bch_confirmation_status='confirmed',bch_confirmed_by=?,bch_confirmed_at=?,bch_comment=?,posting_status=CASE WHEN qc_status='accepted' THEN 'posted' ELSE posting_status END,updated_at=? WHERE id=?`).bind(certificateStatus, deliveryDocumentStatus, documentsOk ? "complete" : "missing", user.id, stamp, clean(payload.comment) || null, stamp, receiptId),
            env.DB.prepare(`UPDATE supply_workflow_steps SET status='completed',completed_at=?,completed_by=?,comment=?,updated_at=? WHERE receipt_id=? AND step='bch_confirmation' AND status='pending'`).bind(stamp, user.id, clean(payload.comment) || "BCH đã xác nhận giao hàng", stamp, receiptId),
            env.DB.prepare(`UPDATE purchase_orders SET status=?,updated_at=? WHERE id=?`).bind(nextStatus, stamp, receipt.purchaseOrderId),
            env.DB.prepare(`UPDATE material_requests SET supply_status=?,updated_at=? WHERE id=?`).bind(nextRequestStatus, stamp, receipt.requestId),
        ];
        if (receipt.qcStatus === "accepted" && receipt.postingStatus !== "posted") {
            for (const item of receiptItems) {
                if (numberValue(item.acceptedQty) <= 0)
                    continue;
                statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) SELECT ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM stock_movements WHERE reference_type='goods_receipt' AND reference_id=? AND material_id=?)`).bind(id("MOV"), receipt.projectId, clean(item.contractId)||clean(receipt.contractId)||null, clean(item.contractId)||clean(receipt.contractId)||null, item.materialId, null, receipt.warehouseId, "GRN", item.acceptedQty, 0, stamp, "goods_receipt", receiptId, user.id, null, stamp, stamp, receiptId, item.materialId));
                const ownerContractId=clean(item.contractId)||clean(receipt.contractId);if(!ownerContractId)throw new Error("Phiếu nhập thiếu Contract ownership; dừng ghi sổ để tránh sai tồn kế toán.");statements.push(contractLedgerStatement({projectId:receipt.projectId,contractId:ownerContractId,warehouseId:receipt.warehouseId,materialId:item.materialId,movementType:"GRN",quantityDelta:item.acceptedQty,occurredAt:stamp,referenceType:"goods_receipt",referenceId:receiptId,referenceItemId:item.id,actorUserId:user.id,note:`Nhập theo ${receipt.poNo}`}));
                statements.push(env.DB.prepare(`UPDATE purchase_order_items SET received_qty=received_qty+?,status=CASE WHEN received_qty+?+closed_qty>=ordered_qty THEN 'received' ELSE 'partial_received' END,updated_at=? WHERE id=?`).bind(item.acceptedQty,item.acceptedQty,stamp,item.purchaseOrderItemId));
                statements.push(env.DB.prepare(`UPDATE material_request_items SET received_qty=received_qty+?,line_status=CASE WHEN received_qty+?+closed_qty>=approved_purchase_qty THEN 'received' ELSE 'partial_received' END,updated_at=? WHERE id=?`).bind(item.acceptedQty,item.acceptedQty,stamp,item.requestItemId));
            }
        }
        const nextRecipientStage = completed ? 101 : 102;
        const completionEmail = await supplyEmailStatement({ requestId: String(receipt.requestId), requestNo: String(receipt.requestNo), projectId: String(receipt.projectId), projectCode: String(receipt.projectCode), projectName: String(receipt.projectName), requesterEmail: receipt.requesterEmail ? String(receipt.requesterEmail) : null, poNo: String(receipt.poNo), receiptNo: String(receipt.receiptNo), eta: receipt.eta ? String(receipt.eta) : null }, nextRecipientStage, completed ? "delivery_completed" : "delivery_partial", completed ? "BCH đã xác nhận – đơn hoàn tất" : "BCH đã xác nhận – còn chờ giao thiếu", completed ? `Quy trình đã kết thúc${hasExceptions ? "; hồ sơ còn cảnh báo thiếu chứng từ." : " đầy đủ."}` : "PO chưa nhận đủ số lượng và tiếp tục ở hàng chờ giao.", request, completed);
        if (completionEmail)
            statements.push(completionEmail);
        await env.DB.batch(statements);
        await audit(user.id, "BCH_CONFIRM", "goods_receipt", receiptId, receipt, { certificateStatus, deliveryDocumentStatus, nextStatus }, request);
        return { message: completed ? `BCH đã xác nhận ${receipt.receiptNo}; quy trình PO đã kết thúc${hasExceptions ? " nhưng còn cảnh báo thiếu hồ sơ" : " đầy đủ"}.` : `BCH đã xác nhận ${receipt.receiptNo}; PO tiếp tục chờ giao phần còn thiếu.` };
    }
    if (action === "create_transfer_order") {
        const sourceWarehouseId=clean(payload.sourceWarehouseId),destinationWarehouseId=clean(payload.destinationWarehouseId),lines=Array.isArray(payload.lines)?payload.lines:[];if(!sourceWarehouseId||!destinationWarehouseId||sourceWarehouseId===destinationWarehouseId||!lines.length)throw new Error("Phiếu điều chuyển phải có kho nguồn, kho đích khác nhau và ít nhất một vật tư.");if(!(await canAccessWarehouse(user,sourceWarehouseId,true)))throw new Error("Không có quyền lập điều chuyển từ kho nguồn này.");const sw=await first(`SELECT id,type,project_id AS projectId FROM warehouses WHERE id=? AND active=1`,sourceWarehouseId),dw=await first(`SELECT id,type,project_id AS projectId FROM warehouses WHERE id=? AND active=1`,destinationWarehouseId);if(!sw||!dw||String(dw.type)==='transit')throw new Error("Kho nguồn/đích không hợp lệ.");const transit=await first(`SELECT id FROM warehouses WHERE type='transit' AND active=1 ORDER BY code LIMIT 1`);if(!transit)throw new Error("Thiếu kho Transit hệ thống.");const seq=await first(`INSERT INTO document_sequences (id,document_type,project_id,year,last_number,updated_at) VALUES (?,?,?,?,1,?) ON CONFLICT(id) DO UPDATE SET last_number=document_sequences.last_number+1,updated_at=excluded.updated_at RETURNING last_number AS lastNumber`,`TRANSFER:${new Date().getFullYear()}`,"TRANSFER",sw.projectId||dw.projectId||null,new Date().getFullYear(),stamp),transferId=id("TRF"),transferNo=`TRF-${new Date().getFullYear()}-${String(Number(seq?.lastNumber||1)).padStart(5,"0")}`,statements=[env.DB.prepare(`INSERT INTO transfer_orders (id,transfer_no,source_warehouse_id,destination_warehouse_id,source_project_id,destination_project_id,transit_warehouse_id,requested_by,requested_at,status,reason,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(transferId,transferNo,sourceWarehouseId,destinationWarehouseId,sw.projectId||null,dw.projectId||null,transit.id,user.id,stamp,"requested",clean(payload.reason)||"Điều chuyển nội bộ",clean(payload.note)||null,stamp,stamp)];
        for(const[index,line]of lines.entries()){const materialId=clean(line.materialId),qty=numberValue(line.quantity);if(!materialId||qty<=0)throw new Error(`Dòng ${index+1}: vật tư/số lượng không hợp lệ.`);const available=Math.max(0,(await stockBalance(sourceWarehouseId,materialId))-(await reservedBalance(sourceWarehouseId,materialId)));if(qty>available+1e-9)throw new Error(`Dòng ${index+1}: số lượng điều chuyển vượt tồn vật lý khả dụng (${available}).`);let sourceContractId=null,destinationContractId=null;if(clean(sw.projectId)){const owner=await resolveOwnershipContract(sw.projectId,sourceWarehouseId,materialId,clean(line.sourceContractId));sourceContractId=clean(owner.id);const ownerQty=await contractBalance(sw.projectId,sourceContractId,sourceWarehouseId,materialId);if(qty>ownerQty+1e-9)throw new Error(`Dòng ${index+1}: Contract nguồn chỉ còn ${ownerQty}.`);}if(clean(dw.projectId)){if(clean(line.destinationContractId)){const ctx=await resolveContractContext(dw.projectId,clean(line.destinationContractId),"",{requireVersion:false});destinationContractId=clean(ctx.contract.id);}else if(clean(sw.projectId)===clean(dw.projectId)&&sourceContractId)destinationContractId=sourceContractId;else{const dc=await defaultContractForProject(dw.projectId);if(!dc)throw new Error(`Dòng ${index+1}: dự án đích chưa có Contract hoạt động.`);destinationContractId=clean(dc.id);}}statements.push(env.DB.prepare(`INSERT INTO transfer_order_items (id,transfer_order_id,material_id,source_contract_id,destination_contract_id,requested_qty,approved_qty,shipped_qty,received_qty,rejected_qty,lost_qty,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("TRFI"),transferId,materialId,sourceContractId,destinationContractId,qty,0,0,0,0,0,clean(line.note)||null,stamp,stamp));}
        await env.DB.batch(statements);await audit(user.id,"CREATE","transfer_order",transferId,null,{transferNo,sourceWarehouseId,destinationWarehouseId,sourceProjectId:sw.projectId||null,destinationProjectId:dw.projectId||null,p10Ownership:true},request);return{message:`Đã tạo ${transferNo}; Contract ownership của từng dòng đã được khóa để chờ duyệt.`};
    }
    if (action === "approve_transfer_order") { const transferId=clean(payload.transferOrderId),t=await first(`SELECT * FROM transfer_orders WHERE id=?`,transferId);if(!t||clean(t.status)!=='requested')throw new Error("Phiếu điều chuyển không ở trạng thái chờ duyệt.");if(!(await canAccessWarehouse(user,clean(t.source_warehouse_id),true))&&!isAdmin(user))throw new Error("Không có quyền duyệt kho nguồn.");await env.DB.batch([env.DB.prepare(`UPDATE transfer_orders SET status='approved',approved_by=?,approved_at=?,updated_at=? WHERE id=?`).bind(user.id,stamp,stamp,transferId),env.DB.prepare(`UPDATE transfer_order_items SET approved_qty=requested_qty,updated_at=? WHERE transfer_order_id=?`).bind(stamp,transferId)]);await audit(user.id,"APPROVE","transfer_order",transferId,t,{status:"approved"},request);return {message:"Đã duyệt điều chuyển; kho nguồn có thể xuất hàng."}; }
    if (action === "ship_transfer_order") {
        const transferId=clean(payload.transferOrderId),t=await first(`SELECT id,transfer_no AS transferNo,source_warehouse_id AS sourceWarehouseId,destination_warehouse_id AS destinationWarehouseId,source_project_id AS sourceProjectId,destination_project_id AS destinationProjectId,transit_warehouse_id AS transitWarehouseId,status FROM transfer_orders WHERE id=?`,transferId);if(!t||clean(t.status)!=='approved')throw new Error("Phiếu chưa được duyệt hoặc đã xuất.");if(!(await canAccessWarehouse(user,t.sourceWarehouseId,true)))throw new Error("Chỉ thủ kho nguồn/đúng phạm vi mới được xác nhận xuất.");const items=await all(`SELECT id,material_id AS materialId,source_contract_id AS sourceContractId,destination_contract_id AS destinationContractId,approved_qty AS approvedQty FROM transfer_order_items WHERE transfer_order_id=?`,transferId),statements=[];
        for(const item of items){const qty=numberValue(item.approvedQty),available=Math.max(0,(await stockBalance(t.sourceWarehouseId,item.materialId))-(await reservedBalance(t.sourceWarehouseId,item.materialId)));if(qty<=0||qty>available+1e-9)throw new Error(`Không đủ tồn vật lý khả dụng để xuất ${item.materialId}; còn ${available}.`);if(clean(t.sourceProjectId)){const contractId=clean(item.sourceContractId);if(!contractId)throw new Error("Dòng điều chuyển thiếu Contract nguồn.");const ownerQty=await contractBalance(t.sourceProjectId,contractId,t.sourceWarehouseId,item.materialId);if(qty>ownerQty+1e-9)throw new Error(`Contract nguồn không đủ tồn để xuất ${item.materialId}; còn ${ownerQty}.`);statements.push(contractLedgerStatement({projectId:t.sourceProjectId,contractId,warehouseId:t.sourceWarehouseId,materialId:item.materialId,movementType:"TRF_SHIP",quantityDelta:-qty,occurredAt:stamp,referenceType:"transfer_order",referenceId:transferId,referenceItemId:item.id,actorUserId:user.id,note:"Xuất khỏi kho nguồn sang Transit"}),contractLedgerStatement({projectId:t.sourceProjectId,contractId,warehouseId:t.transitWarehouseId,materialId:item.materialId,movementType:"TRF_SHIP",quantityDelta:qty,occurredAt:stamp,referenceType:"transfer_order",referenceId:transferId,referenceItemId:item.id,actorUserId:user.id,note:"Transit giữ nguyên Contract nguồn"}));}statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),t.sourceProjectId||t.destinationProjectId,clean(item.sourceContractId)||null,clean(item.sourceContractId)||null,item.materialId,t.sourceWarehouseId,t.transitWarehouseId,"TRF_SHIP",qty,0,stamp,"transfer_order",transferId,user.id,null,stamp,stamp));statements.push(env.DB.prepare(`UPDATE transfer_order_items SET shipped_qty=?,updated_at=? WHERE id=?`).bind(qty,stamp,item.id));}
        statements.push(env.DB.prepare(`UPDATE transfer_orders SET status='in_transit',shipped_by=?,shipped_at=?,updated_at=? WHERE id=?`).bind(user.id,stamp,stamp,transferId));await env.DB.batch(statements);await audit(user.id,"SHIP","transfer_order",transferId,t,{status:"in_transit",ownershipPreserved:true},request);return{message:`${t.transferNo} đã xuất khỏi kho nguồn; Transit bảo toàn Contract ownership nguồn.`};
    }
    if (action === "receive_transfer_order") {
        const transferId=clean(payload.transferOrderId),t=await first(`SELECT id,transfer_no AS transferNo,source_warehouse_id AS sourceWarehouseId,destination_warehouse_id AS destinationWarehouseId,source_project_id AS sourceProjectId,destination_project_id AS destinationProjectId,transit_warehouse_id AS transitWarehouseId,status FROM transfer_orders WHERE id=?`,transferId);if(!t||clean(t.status)!=='in_transit')throw new Error("Phiếu chưa ở trạng thái đang vận chuyển.");if(!(await canAccessWarehouse(user,t.destinationWarehouseId,true)))throw new Error("Chỉ thủ kho đích/đúng phạm vi mới được xác nhận nhận.");const items=await all(`SELECT id,material_id AS materialId,source_contract_id AS sourceContractId,destination_contract_id AS destinationContractId,shipped_qty AS shippedQty,received_qty AS receivedQty FROM transfer_order_items WHERE transfer_order_id=?`,transferId),payloadLines=Array.isArray(payload.lines)?payload.lines:[],byId=new Map(payloadLines.map((r)=>[clean(r.transferOrderItemId),r])),statements=[];let lostTotal=0;
        for(const item of items){const line=byId.get(clean(item.id)),received=line?numberValue(line.receivedQty):numberValue(item.shippedQty),rejected=line?numberValue(line.rejectedQty):0;if(received<0||rejected<0||received+rejected>numberValue(item.shippedQty)+1e-9)throw new Error("Số nhận/từ chối vượt số đã xuất.");const lost=Math.max(0,numberValue(item.shippedQty)-received-rejected);lostTotal+=lost;const sourceContractId=clean(item.sourceContractId),destinationContractId=clean(item.destinationContractId)||sourceContractId;
          if(clean(t.sourceProjectId)&&sourceContractId){const transitOwner=await contractBalance(t.sourceProjectId,sourceContractId,t.transitWarehouseId,item.materialId);if(numberValue(item.shippedQty)>transitOwner+1e-9)throw new Error(`Transit thiếu Contract ownership cho ${item.materialId}; dừng nhận để tránh sai sổ.`);}
          if(received>0){statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),t.destinationProjectId||t.sourceProjectId,sourceContractId||null,destinationContractId||null,item.materialId,t.transitWarehouseId,t.destinationWarehouseId,"TRF_RECEIVE",received,0,stamp,"transfer_order",transferId,user.id,null,stamp,stamp));if(clean(t.sourceProjectId)&&sourceContractId)statements.push(contractLedgerStatement({projectId:t.sourceProjectId,contractId:sourceContractId,warehouseId:t.transitWarehouseId,materialId:item.materialId,movementType:"TRF_RECEIVE",quantityDelta:-received,occurredAt:stamp,referenceType:"transfer_order",referenceId:transferId,referenceItemId:item.id,counterpartyContractId:destinationContractId||null,actorUserId:user.id,note:"Rời Transit"}));if(clean(t.destinationProjectId)&&destinationContractId)statements.push(contractLedgerStatement({projectId:t.destinationProjectId,contractId:destinationContractId,warehouseId:t.destinationWarehouseId,materialId:item.materialId,movementType:"TRF_RECEIVE",quantityDelta:received,occurredAt:stamp,referenceType:"transfer_order",referenceId:transferId,referenceItemId:item.id,counterpartyContractId:sourceContractId||null,actorUserId:user.id,note:"Kho đích nhận ownership"}));if(sourceContractId&&destinationContractId&&(clean(t.sourceProjectId)!==clean(t.destinationProjectId)||sourceContractId!==destinationContractId))statements.push(env.DB.prepare(`INSERT INTO contract_ownership_transfers(id,transfer_no,warehouse_id,material_id,source_project_id,source_contract_id,destination_project_id,destination_contract_id,quantity,reason,source_reference_type,source_reference_id,status,posted_by,posted_at,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("COT"),`${t.transferNo}-${item.id}`.slice(0,120),t.destinationWarehouseId,item.materialId,t.sourceProjectId,sourceContractId,t.destinationProjectId,destinationContractId,received,"Điều chuyển vật lý qua Transit","transfer_order",transferId,"posted",user.id,stamp,stamp));}
          if(rejected>0){statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),t.sourceProjectId||t.destinationProjectId,sourceContractId||null,sourceContractId||null,item.materialId,t.transitWarehouseId,t.sourceWarehouseId,"TRF_REJECT",rejected,0,stamp,"transfer_order",transferId,user.id,null,stamp,stamp));if(clean(t.sourceProjectId)&&sourceContractId)statements.push(contractLedgerStatement({projectId:t.sourceProjectId,contractId:sourceContractId,warehouseId:t.transitWarehouseId,materialId:item.materialId,movementType:"TRF_REJECT",quantityDelta:-rejected,occurredAt:stamp,referenceType:"transfer_order",referenceId:transferId,referenceItemId:item.id,actorUserId:user.id,note:"Transit trả lại kho nguồn"}),contractLedgerStatement({projectId:t.sourceProjectId,contractId:sourceContractId,warehouseId:t.sourceWarehouseId,materialId:item.materialId,movementType:"TRF_REJECT",quantityDelta:rejected,occurredAt:stamp,referenceType:"transfer_order",referenceId:transferId,referenceItemId:item.id,actorUserId:user.id,note:"Kho nguồn nhận lại"}));}
          if(lost>0){statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),t.sourceProjectId||t.destinationProjectId,sourceContractId||null,null,item.materialId,t.transitWarehouseId,null,"TRF_LOSS",lost,0,stamp,"transfer_order",transferId,user.id,null,stamp,stamp));if(clean(t.sourceProjectId)&&sourceContractId)statements.push(contractLedgerStatement({projectId:t.sourceProjectId,contractId:sourceContractId,warehouseId:t.transitWarehouseId,materialId:item.materialId,movementType:"TRF_LOSS",quantityDelta:-lost,occurredAt:stamp,referenceType:"transfer_order",referenceId:transferId,referenceItemId:item.id,actorUserId:user.id,note:"Hao hụt/mất tại Transit"}));}statements.push(env.DB.prepare(`UPDATE transfer_order_items SET received_qty=?,rejected_qty=?,lost_qty=?,updated_at=? WHERE id=?`).bind(received,rejected,lost,stamp,item.id));}
        statements.push(env.DB.prepare(`UPDATE transfer_orders SET status=?,received_by=?,received_at=?,updated_at=? WHERE id=?`).bind(lostTotal>0?'received_with_loss':'received',user.id,stamp,stamp,transferId));await env.DB.batch(statements);await audit(user.id,"RECEIVE","transfer_order",transferId,t,{status:lostTotal>0?'received_with_loss':'received',lostTotal,p10Ownership:true},request);return{message:`Đã nhận ${t.transferNo}; tồn đích và Contract ownership được ghi theo số thực nhận.`};
    }
    if (action === "create_central_return") {
        const projectId=clean(payload.projectId),sourceWarehouseId=clean(payload.sourceWarehouseId),lines=Array.isArray(payload.lines)?payload.lines:[];if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền tại dự án này.");if(!(await canAccessWarehouse(user,sourceWarehouseId,true)))throw new Error("Không có quyền xuất tại kho dự án này.");const sourceWarehouse=await first(`SELECT id FROM warehouses WHERE id=? AND project_id=? AND active=1`,sourceWarehouseId,projectId);if(!sourceWarehouse||!lines.length)throw new Error("Phiếu trả Kho Tổng phải đúng kho dự án và có vật tư.");const central=await first(`SELECT id FROM warehouses WHERE type='central' AND active=1 ORDER BY code LIMIT 1`);if(!central)throw new Error("Chưa cấu hình Kho Tổng.");const project=await first(`SELECT code FROM projects WHERE id=?`,projectId),returnYear=new Date().getFullYear(),returnSequence=await first(`INSERT INTO document_sequences(id,document_type,project_id,year,last_number,updated_at) VALUES(?,?,?,?,1,?) ON CONFLICT(id) DO UPDATE SET last_number=document_sequences.last_number+1,updated_at=excluded.updated_at RETURNING last_number AS lastNumber`,`CENTRAL_RETURN:${projectId}:${returnYear}`,"CENTRAL_RETURN",projectId,returnYear,stamp),returnId=id("CRET"),returnNo=`KT-RET-${clean(project?.code).toUpperCase()}-${returnYear}-${String(Number(returnSequence?.lastNumber||1)).padStart(4,"0")}`,statements=[env.DB.prepare(`INSERT INTO central_returns (id,return_no,source_project_id,source_warehouse_id,central_warehouse_id,requested_by,requested_at,approved_by,approved_at,received_by,received_at,status,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(returnId,returnNo,projectId,sourceWarehouseId,central.id,user.id,stamp,null,null,null,null,"pending_approval",clean(payload.note)||null,stamp,stamp)];
        for(const[index,line]of lines.entries()){const materialId=clean(line.materialId),qty=numberValue(line.quantity),physical=await stockBalance(sourceWarehouseId,materialId);if(qty<=0||qty>physical+1e-9)throw new Error(`Dòng ${index+1}: số lượng đề nghị chuyển vượt tồn vật lý kho nguồn.`);const owner=await resolveOwnershipContract(projectId,sourceWarehouseId,materialId,clean(line.contractId)),contractId=clean(owner.id),ownerQty=await contractBalance(projectId,contractId,sourceWarehouseId,materialId);if(qty>ownerQty+1e-9)throw new Error(`Dòng ${index+1}: Contract chỉ còn ${ownerQty} tại kho nguồn.`);statements.push(env.DB.prepare(`INSERT INTO central_return_items (id,central_return_id,material_id,contract_id,proposed_qty,counted_qty,accepted_qty,rejected_qty,condition_status,unit_cost,rejection_reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("CRETI"),returnId,materialId,contractId,qty,0,0,0,clean(line.conditionStatus)||"usable",numberValue(line.unitCost),null,stamp,stamp));}
        await env.DB.batch(statements);await audit(user.id,"CREATE","central_return",returnId,null,{returnNo,projectId,lineCount:lines.length,p10ContractOwnership:true},request);return{message:`Đã lập ${returnNo}; Contract ownership từng dòng đã được khóa, chờ phê duyệt.`};
    }
    if (action === "approve_central_return") {
        const returnId=clean(payload.centralReturnId),reason=clean(payload.reason)||"Đồng ý chuyển vật tư dư về Kho Tổng",row=await first(`SELECT id,status,source_project_id AS projectId,source_warehouse_id AS sourceWarehouseId FROM central_returns WHERE id=?`,returnId);if(!row||row.status!=="pending_approval")throw new Error("Phiếu không còn ở trạng thái chờ duyệt.");if(!(await canAccessProject(user,String(row.projectId),true)))throw new Error("Không có quyền tại dự án này.");const full=await first(`SELECT cr.id,cr.return_no AS returnNo,cr.source_project_id AS projectId,cr.source_warehouse_id AS sourceWarehouseId FROM central_returns cr WHERE cr.id=?`,returnId),transit=await first(`SELECT id FROM warehouses WHERE type='transit' AND active=1 ORDER BY code LIMIT 1`);if(!transit)throw new Error("Thiếu kho Transit hệ thống.");const items=await all(`SELECT id,material_id AS materialId,contract_id AS contractId,proposed_qty AS proposedQty FROM central_return_items WHERE central_return_id=?`,returnId),statements=[];
        for(const item of items){const qty=numberValue(item.proposedQty),physical=await stockBalance(full.sourceWarehouseId,item.materialId),ownerQty=await contractBalance(full.projectId,item.contractId,full.sourceWarehouseId,item.materialId);if(qty>physical+1e-9||qty>ownerQty+1e-9)throw new Error("Tồn vật lý/Contract nguồn không đủ; dừng duyệt để tránh sai sổ.");statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),full.projectId,item.contractId,item.contractId,item.materialId,full.sourceWarehouseId,transit.id,"CENTRAL_RETURN_SHIP",qty,0,stamp,"central_return",returnId,user.id,null,stamp,stamp));statements.push(contractLedgerStatement({projectId:full.projectId,contractId:item.contractId,warehouseId:full.sourceWarehouseId,materialId:item.materialId,movementType:"CENTRAL_RETURN_SHIP",quantityDelta:-qty,occurredAt:stamp,referenceType:"central_return",referenceId:returnId,referenceItemId:item.id,actorUserId:user.id,note:"Xuất về Kho Tổng"}),contractLedgerStatement({projectId:full.projectId,contractId:item.contractId,warehouseId:transit.id,materialId:item.materialId,movementType:"CENTRAL_RETURN_SHIP",quantityDelta:qty,occurredAt:stamp,referenceType:"central_return",referenceId:returnId,referenceItemId:item.id,actorUserId:user.id,note:"Transit bảo toàn Contract nguồn"}));}
        statements.push(env.DB.prepare(`UPDATE central_returns SET status='in_transit',approved_by=?,approved_at=?,note=CASE WHEN note IS NULL THEN ? ELSE note||' | '||? END,updated_at=? WHERE id=?`).bind(user.id,stamp,reason,reason,stamp,returnId));await env.DB.batch(statements);await audit(user.id,"APPROVE","central_return",returnId,row,{status:"in_transit",reason,ownershipPreserved:true},request);return{message:"Đã duyệt và xuất khỏi kho nguồn; Transit giữ nguyên Contract ownership."};
    }
    if (action === "receive_central_return") {
        const returnId=clean(payload.centralReturnId),lines=Array.isArray(payload.lines)?payload.lines:[],row=await first(`SELECT id,return_no AS returnNo,status,source_project_id AS projectId,source_warehouse_id AS sourceWarehouseId,central_warehouse_id AS centralWarehouseId FROM central_returns WHERE id=?`,returnId);if(!row||row.status!=="in_transit"||!lines.length)throw new Error("Phiếu phải được duyệt và có kết quả kiểm đếm.");if(!(await canAccessWarehouse(user,String(row.centralWarehouseId),true)))throw new Error("Chỉ Thủ kho Tổng được nhận phiếu vào Kho Tổng.");const imageCount=await first(`SELECT COUNT(*) AS count FROM attachments WHERE entity_type='central_return' AND entity_id=? AND lower(mime_type) LIKE 'image/%'`,returnId);if(Number(imageCount?.count||0)<1)throw new Error("Phải tải ít nhất một ảnh kiểm đếm trước khi Kho Tổng xác nhận.");const sourceItems=await all(`SELECT id,material_id AS materialId,contract_id AS contractId,proposed_qty AS proposedQty FROM central_return_items WHERE central_return_id=?`,returnId),map=new Map(sourceItems.map(item=>[String(item.id),item])),transit=await first(`SELECT id FROM warehouses WHERE type='transit' AND active=1 ORDER BY code LIMIT 1`);if(!transit)throw new Error("Thiếu kho Transit hệ thống.");const statements=[];let acceptedTotal=0,rejectedTotal=0;
        for(const line of lines){const item=map.get(clean(line.centralReturnItemId)),counted=numberValue(line.countedQty),accepted=numberValue(line.acceptedQty),rejected=Math.max(0,counted-accepted);if(!item||counted<0||accepted<0||accepted>counted+1e-9||counted>numberValue(item.proposedQty)+1e-9)throw new Error("Kết quả kiểm đếm Kho Tổng không hợp lệ.");const transitBalance=await stockBalance(transit.id,item.materialId),transitOwner=await contractBalance(row.projectId,item.contractId,transit.id,item.materialId);if(numberValue(item.proposedQty)>transitBalance+1e-9||numberValue(item.proposedQty)>transitOwner+1e-9)throw new Error("Số liệu Transit vật lý/Contract không đủ; dừng nhận để tránh sai tồn.");const lost=Math.max(0,numberValue(item.proposedQty)-counted);acceptedTotal+=accepted;rejectedTotal+=rejected+lost;statements.push(env.DB.prepare(`UPDATE central_return_items SET counted_qty=?,accepted_qty=?,rejected_qty=?,condition_status=?,rejection_reason=?,updated_at=? WHERE id=?`).bind(counted,accepted,rejected+lost,clean(line.conditionStatus)||"usable",clean(line.rejectionReason)||(lost>0?`Thiếu khi vận chuyển: ${lost}`:null),stamp,item.id));
          if(accepted>0){statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),row.projectId,item.contractId,null,item.materialId,transit.id,row.centralWarehouseId,"CENTRAL_RETURN_RECEIVE",accepted,numberValue(line.unitCost),stamp,"central_return",returnId,user.id,null,stamp,stamp));statements.push(contractLedgerStatement({projectId:row.projectId,contractId:item.contractId,warehouseId:transit.id,materialId:item.materialId,movementType:"CENTRAL_RETURN_RECEIVE",quantityDelta:-accepted,occurredAt:stamp,referenceType:"central_return",referenceId:returnId,referenceItemId:item.id,actorUserId:user.id,note:"Kho Tổng nhận; kết thúc ownership của Contract dự án"}));}
          if(rejected>0){statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),row.projectId,item.contractId,item.contractId,item.materialId,transit.id,row.sourceWarehouseId,"CENTRAL_RETURN_REJECT",rejected,numberValue(line.unitCost),stamp,"central_return",returnId,user.id,null,stamp,stamp));statements.push(contractLedgerStatement({projectId:row.projectId,contractId:item.contractId,warehouseId:transit.id,materialId:item.materialId,movementType:"CENTRAL_RETURN_REJECT",quantityDelta:-rejected,occurredAt:stamp,referenceType:"central_return",referenceId:returnId,referenceItemId:item.id,actorUserId:user.id,note:"Kho Tổng từ chối"}),contractLedgerStatement({projectId:row.projectId,contractId:item.contractId,warehouseId:row.sourceWarehouseId,materialId:item.materialId,movementType:"CENTRAL_RETURN_REJECT",quantityDelta:rejected,occurredAt:stamp,referenceType:"central_return",referenceId:returnId,referenceItemId:item.id,actorUserId:user.id,note:"Trả lại ownership cho kho dự án"}));}
          if(lost>0){statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),row.projectId,item.contractId,null,item.materialId,transit.id,null,"CENTRAL_RETURN_LOSS",lost,numberValue(line.unitCost),stamp,"central_return",returnId,user.id,null,stamp,stamp));statements.push(contractLedgerStatement({projectId:row.projectId,contractId:item.contractId,warehouseId:transit.id,materialId:item.materialId,movementType:"CENTRAL_RETURN_LOSS",quantityDelta:-lost,occurredAt:stamp,referenceType:"central_return",referenceId:returnId,referenceItemId:item.id,actorUserId:user.id,note:"Hao hụt tại Transit"}));}}
        statements.push(env.DB.prepare(`UPDATE central_returns SET status=?,received_by=?,received_at=?,updated_at=? WHERE id=?`).bind(rejectedTotal>0?"received_with_rejection":"received",user.id,stamp,stamp,returnId));await env.DB.batch(statements);await audit(user.id,"RECEIVE","central_return",returnId,row,{acceptedTotal,rejectedTotal,p10Ownership:true},request);return{message:`Kho Tổng đã nhận ${acceptedTotal}; từ chối/thiếu ${rejectedTotal}. Contract ownership được kết chuyển đúng theo kết quả thực nhận.`};
    }
    if (action === "create_project_team") {
        requireRole(user,["commander","admin"]);
        const projectId=clean(payload.projectId),code=clean(payload.code).toUpperCase(),name=clean(payload.name),trade=clean(payload.trade);
        if(!projectId||!code||!name||!trade) throw new Error("Dự án, mã tổ đội, tên tổ đội và hạng mục là bắt buộc.");
        if(!isAdmin(user) && !(await canAccessProject(user,projectId,true))) throw new Error("CHT chỉ được tạo tổ đội trong dự án được phân quyền.");
        const project=await first(`SELECT id,code,name FROM projects WHERE id=? AND status='active'`,projectId); if(!project) throw new Error("Dự án không tồn tại hoặc đã đóng.");
        if(await first(`SELECT id FROM teams WHERE project_id=? AND (upper(code)=upper(?) OR lower(name)=lower(?))`,projectId,code,name)) throw new Error("Mã hoặc tên tổ đội đã tồn tại trong dự án này.");
        const globalCode=`${clean(project.code)}-${code}`.replace(/[^A-Za-z0-9_-]/g,"-").slice(0,48); if(await first(`SELECT id FROM teams WHERE code=?`,globalCode)) throw new Error("Mã tổ đội đã tồn tại. Hãy dùng mã khác.");
        const teamId=id("TEAM"),warehouseId=id("WHTEAM"),warehouseCode=`TD-${globalCode}`.slice(0,48); const site=await first(`SELECT id FROM warehouses WHERE project_id=? AND type='site' AND active=1 ORDER BY code LIMIT 1`,projectId);
        if(!site) throw new Error("Dự án chưa có kho dự án để liên kết tổ đội.");
        await env.DB.batch([
          env.DB.prepare(`INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(warehouseId,warehouseCode,`Kho tổ đội · ${name}`,"team",projectId,site.id,null,1,stamp,stamp),
          env.DB.prepare(`INSERT INTO teams (id,code,name,trade,project_id,warehouse_id,leader_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(teamId,globalCode,name,trade,projectId,warehouseId,null,1,stamp,stamp)
        ]);
        await audit(user.id,"CREATE","team",teamId,null,{projectId,code:globalCode,name,trade,warehouseId},request);
        return {message:`Đã tạo tổ đội ${name} trong dự án ${project.code}. CHT không có quyền xóa tổ đội.`};
    }
    if (action === "set_project_team_status") {
        requireRole(user,["admin"]); const teamId=clean(payload.teamId),active=payload.active===true||clean(payload.active)==="1"; const team=await first(`SELECT * FROM teams WHERE id=?`,teamId); if(!team) throw new Error("Không tìm thấy tổ đội.");
        await env.DB.batch([env.DB.prepare(`UPDATE teams SET active=?,updated_at=? WHERE id=?`).bind(active?1:0,stamp,teamId),env.DB.prepare(`UPDATE warehouses SET active=?,updated_at=? WHERE id=?`).bind(active?1:0,stamp,team.warehouse_id)]); await audit(user.id,"STATUS","team",teamId,team,{active},request); return {message:active?"Đã khôi phục tổ đội.":"Đã ngừng hoạt động tổ đội."};
    }
    if (action === "delete_project_team") {
        requireRole(user,["admin"]); const teamId=clean(payload.teamId); const team=await first(`SELECT * FROM teams WHERE id=?`,teamId); if(!team) throw new Error("Không tìm thấy tổ đội.");
        const checks=[`SELECT COUNT(*) AS count FROM stock_issues WHERE team_id=?`,`SELECT COUNT(*) AS count FROM material_returns WHERE team_id=?`,`SELECT COUNT(*) AS count FROM material_requests WHERE team_id=?`]; for(const sql of checks){const r=await first(sql,teamId);if(Number(r?.count||0)>0)throw new Error("Tổ đội đã phát sinh giao dịch; chỉ được ngừng hoạt động, không được xóa vật lý.");}
        await env.DB.batch([env.DB.prepare(`DELETE FROM teams WHERE id=?`).bind(teamId),env.DB.prepare(`DELETE FROM warehouses WHERE id=?`).bind(team.warehouse_id)]); await audit(user.id,"DELETE","team",teamId,team,null,request); return {message:"Đã xóa tổ đội chưa phát sinh giao dịch."};
    }
    if (action === "issue_stock") {
        requireRole(user,["warehouse","commander","admin"]);const projectId=clean(payload.projectId),fromWarehouseId=clean(payload.fromWarehouseId),teamId=clean(payload.teamId),requestId=clean(payload.requestId),lines=Array.isArray(payload.lines)?payload.lines:[];if(!(await canAccessProject(user,projectId,true)))throw new Error("Tài khoản không có quyền cấp phát tại dự án này.");const team=await first(`SELECT id,warehouse_id AS warehouseId FROM teams WHERE id=? AND project_id=?`,teamId,projectId),mr=await first(`SELECT id,status,contract_id AS contractId,boq_version_id AS boqVersionId FROM material_requests WHERE id=? AND project_id=?`,requestId,projectId);if(!team||!mr||!lines.length)throw new Error("Phiếu cấp phát phải đúng dự án, MR, tổ đội và có vật tư.");if(!['approved','ordered','partial_received','received','partial_issued'].includes(clean(mr.status)))throw new Error("MR chưa ở trạng thái cho phép cấp phát.");if(!(await canAccessWarehouse(user,fromWarehouseId,true)))throw new Error("Tài khoản không có quyền xuất tại kho này.");const sourceWarehouse=await first(`SELECT id FROM warehouses WHERE id=? AND project_id=? AND active=1`,fromWarehouseId,projectId);if(!sourceWarehouse)throw new Error("Kho nguồn cấp phát phải thuộc đúng dự án.");const issueId=id("ISS"),issueNo=`PX-${new Date().toISOString().slice(2,10).replaceAll("-","")}-${String(Date.now()).slice(-4)}`,statements=[env.DB.prepare(`INSERT INTO stock_issues (id,issue_no,project_id,from_warehouse_id,team_id,request_id,issued_by,received_by_name,approved_by,issued_at,status,signed_at,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(issueId,issueNo,projectId,fromWarehouseId,teamId,requestId,user.id,clean(payload.receivedByName),user.id,stamp,"posted",stamp,clean(payload.note)||null,stamp,stamp)];
        for(const[index,line]of lines.entries()){const materialId=clean(line.materialId),qty=numberValue(line.quantity),requestItemId=clean(line.requestItemId);const requestLine=await first(`SELECT requested_qty AS requestedQty,issued_qty AS issuedQty,contract_id AS contractId,boq_version_id AS boqVersionId FROM material_request_items WHERE id=? AND request_id=? AND material_id=?`,requestItemId,requestId,materialId);if(!requestLine||qty<=0)throw new Error(`Dòng ${index+1}: cấp phát không hợp lệ.`);const contractId=clean(line.contractId)||clean(requestLine.contractId)||clean(mr.contractId);if(!contractId)throw new Error(`Dòng ${index+1}: MR thiếu Contract ownership.`);const balanceQty=await stockBalance(fromWarehouseId,materialId),reservedOther=await reservedBalance(fromWarehouseId,materialId,requestId),availableQty=Math.max(0,balanceQty-reservedOther);if(qty>availableQty+1e-9)throw new Error(`Dòng ${index+1}: Không đủ tồn khả dụng / tồn vật lý khả dụng (còn ${availableQty}).`);const ownerQty=await contractBalance(projectId,contractId,fromWarehouseId,materialId);if(qty>ownerQty+1e-9)throw new Error(`Dòng ${index+1}: Contract không đủ tồn kế toán tại kho nguồn (còn ${ownerQty}).`);if(numberValue(requestLine.issuedQty)+qty>numberValue(requestLine.requestedQty)+1e-9)throw new Error(`Dòng ${index+1}: số lượng cấp lũy kế vượt nhu cầu MR.`);const issueItemId=id("SMII");statements.push(env.DB.prepare(`INSERT INTO stock_issue_items (id,issue_id,material_id,request_item_id,contract_id,quantity,installed_qty,work_package_code,installation_area,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(issueItemId,issueId,materialId,requestItemId,contractId,qty,0,clean(line.workPackageCode)||null,clean(line.installationArea)||null,stamp,stamp));statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),projectId,contractId,contractId,materialId,fromWarehouseId,team.warehouseId,"SMI",qty,0,stamp,"stock_issue",issueId,user.id,null,stamp,stamp));statements.push(contractLedgerStatement({projectId,contractId,warehouseId:fromWarehouseId,materialId,movementType:"SMI",quantityDelta:-qty,occurredAt:stamp,referenceType:"stock_issue",referenceId:issueId,referenceItemId:issueItemId,actorUserId:user.id,note:"Xuất cấp tổ đội"}),contractLedgerStatement({projectId,contractId,warehouseId:team.warehouseId,materialId,movementType:"SMI",quantityDelta:qty,occurredAt:stamp,referenceType:"stock_issue",referenceId:issueId,referenceItemId:issueItemId,actorUserId:user.id,note:"Tổ đội nhận vật tư"}));statements.push(env.DB.prepare(`UPDATE material_request_items SET issued_qty=issued_qty+?,line_status=CASE WHEN issued_qty+?>=requested_qty THEN 'issued' ELSE 'partial_issued' END,updated_at=? WHERE id=?`).bind(qty,qty,stamp,requestItemId));statements.push(env.DB.prepare(`UPDATE stock_reservations SET quantity=CASE WHEN quantity-?>0 THEN quantity-? ELSE 0 END,status=CASE WHEN quantity-?<=0 THEN 'released' ELSE status END,released_at=CASE WHEN quantity-?<=0 THEN ? ELSE released_at END,updated_at=? WHERE request_item_id=? AND warehouse_id=? AND material_id=? AND status='active'`).bind(qty,qty,qty,qty,stamp,stamp,requestItemId,fromWarehouseId,materialId));}
        await env.DB.batch(statements);await audit(user.id,"POST","stock_issue",issueId,null,{issueNo,requestId,teamId,p10ContractOwnership:true},request);return{message:`Đã cấp phát ${issueNo}; tồn vật lý và tồn Contract đã chuyển sang kho tổ đội.`,warnings:await approvalWarnings("stock_issue",issueId)};
    }
    if (action === "return_stock") {
        requireRole(user,["warehouse","team","admin"]);const projectId=clean(payload.projectId),teamId=clean(payload.teamId),toWarehouseId=clean(payload.toWarehouseId),lines=Array.isArray(payload.lines)?payload.lines:[];if(!(await canAccessProject(user,projectId,true)))throw new Error("Tài khoản không có quyền hoàn trả tại dự án này.");const team=await first(`SELECT id,warehouse_id AS warehouseId FROM teams WHERE id=? AND project_id=?`,teamId,projectId);if(!team||!lines.length)throw new Error("Phiếu hoàn trả cần đúng tổ đội và vật tư.");const destinationWarehouse=await first(`SELECT id FROM warehouses WHERE id=? AND project_id=? AND active=1`,toWarehouseId,projectId);if(!destinationWarehouse)throw new Error("Kho nhận hoàn trả phải thuộc đúng dự án.");if(!(await canAccessWarehouse(user,toWarehouseId,true)))throw new Error("Tài khoản không có quyền nhận hoàn trả tại kho này.");const returnId=id("RET"),returnNo=`RET-${new Date().toISOString().slice(2,10).replaceAll("-","")}-${String(Date.now()).slice(-4)}`,statements=[env.DB.prepare(`INSERT INTO material_returns (id,return_no,project_id,team_id,to_warehouse_id,returned_by_name,received_by,returned_at,status,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(returnId,returnNo,projectId,teamId,toWarehouseId,clean(payload.returnedByName),user.id,stamp,"received",clean(payload.note)||null,stamp,stamp)];
        for(const[index,line]of lines.entries()){const materialId=clean(line.materialId),qty=numberValue(line.quantity),physicalQty=await stockBalance(team.warehouseId,materialId);if(qty<=0||qty>physicalQty+1e-9)throw new Error(`Dòng ${index+1}: số lượng hoàn trả vượt tồn vật lý tổ đội.`);const owner=await resolveOwnershipContract(projectId,team.warehouseId,materialId,clean(line.contractId)),contractId=clean(owner.id),ownerQty=await contractBalance(projectId,contractId,team.warehouseId,materialId);if(qty>ownerQty+1e-9)throw new Error(`Dòng ${index+1}: số lượng hoàn trả vượt tồn Contract của tổ đội (còn ${ownerQty}).`);const condition=clean(line.condition)||"usable",accepted=condition==="usable"?qty:0,returnItemId=id("RETI");statements.push(env.DB.prepare(`INSERT INTO material_return_items (id,return_id,material_id,contract_id,quantity,accepted_qty,rejected_qty,condition,reason,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(returnItemId,returnId,materialId,contractId,qty,accepted,qty-accepted,condition,clean(line.reason)||null,stamp,stamp));if(accepted>0){statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),projectId,contractId,contractId,materialId,team.warehouseId,toWarehouseId,"RET",accepted,0,stamp,"material_return",returnId,user.id,null,stamp,stamp));statements.push(contractLedgerStatement({projectId,contractId,warehouseId:team.warehouseId,materialId,movementType:"RET",quantityDelta:-accepted,occurredAt:stamp,referenceType:"material_return",referenceId:returnId,referenceItemId:returnItemId,actorUserId:user.id,note:"Hoàn trả từ tổ đội"}),contractLedgerStatement({projectId,contractId,warehouseId:toWarehouseId,materialId,movementType:"RET",quantityDelta:accepted,occurredAt:stamp,referenceType:"material_return",referenceId:returnId,referenceItemId:returnItemId,actorUserId:user.id,note:"Kho dự án nhận hoàn trả"}));}}
        await env.DB.batch(statements);await audit(user.id,"POST","material_return",returnId,null,{returnNo,teamId,p10ContractOwnership:true},request);return{message:`Đã nhận hoàn trả ${returnNo}; Contract ownership được bảo toàn.`};
    }
    if (action === "confirm_installation") {
        requireRole(user,["team","warehouse","commander","admin"]);const issueItemId=clean(payload.issueItemId),quantity=numberValue(payload.quantity);const item=await first(`SELECT sii.id,sii.issue_id AS issueId,sii.material_id AS materialId,sii.contract_id AS contractId,sii.request_item_id AS requestItemId,sii.quantity,sii.installed_qty AS installedQty,si.project_id AS projectId,t.warehouse_id AS teamWarehouseId FROM stock_issue_items sii JOIN stock_issues si ON si.id=sii.issue_id JOIN teams t ON t.id=si.team_id WHERE sii.id=?`,issueItemId);if(!item||quantity<=0)throw new Error("Dòng xác nhận lắp đặt không hợp lệ.");if(!(await canAccessProject(user,String(item.projectId),true)))throw new Error("Tài khoản không có quyền tại dự án này.");if(numberValue(item.installedQty)+quantity>numberValue(item.quantity)+1e-9)throw new Error("Số lượng xác nhận lắp vượt số lượng tổ đội đã nhận.");const physicalQty=await stockBalance(item.teamWarehouseId,item.materialId);if(quantity>physicalQty+1e-9)throw new Error("Tồn vật lý tổ đội không đủ để xác nhận đã lắp.");const contractId=clean(item.contractId);if(!contractId)throw new Error("Dòng xuất kho thiếu Contract ownership; không thể xác nhận lắp.");const ownerQty=await contractBalance(item.projectId,contractId,item.teamWarehouseId,item.materialId);if(quantity>ownerQty+1e-9)throw new Error("Tồn Contract của tổ đội không đủ để xác nhận đã lắp.");const statements=[env.DB.prepare(`UPDATE stock_issue_items SET installed_qty=installed_qty+?,updated_at=? WHERE id=?`).bind(quantity,stamp,issueItemId),env.DB.prepare(`UPDATE material_request_items SET installed_qty=installed_qty+?,updated_at=? WHERE id=?`).bind(quantity,stamp,item.requestItemId),env.DB.prepare(`INSERT INTO stock_movements (id,project_id,contract_id,destination_contract_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"),item.projectId,contractId,null,item.materialId,item.teamWarehouseId,null,"STI",quantity,0,stamp,"stock_issue_item",issueItemId,user.id,null,stamp,stamp),contractLedgerStatement({projectId:item.projectId,contractId,warehouseId:item.teamWarehouseId,materialId:item.materialId,movementType:"STI",quantityDelta:-quantity,occurredAt:stamp,referenceType:"stock_issue_item",referenceId:issueItemId,referenceItemId:issueItemId,actorUserId:user.id,note:"Xác nhận vật tư đã lắp đặt/tiêu hao"})];await env.DB.batch(statements);await audit(user.id,"CONFIRM_INSTALLED","stock_issue_item",issueItemId,item,{quantity,contractId},request);return{message:`Đã xác nhận lắp đặt ${quantity}; tồn vật lý và tồn Contract tổ đội giảm tương ứng.`};
    }
    if (action === "create_stock_count") {
        requireRole(user, ["warehouse", "commander", "admin"]);
        const projectId = clean(payload.projectId);
        const warehouseId = clean(payload.warehouseId);
        const lines = Array.isArray(payload.lines) ? payload.lines : [];
        if (!(await canAccessProject(user, projectId, true)))
            throw new Error("Tài khoản không có quyền kiểm kê tại dự án này.");
        const warehouse = await first(`SELECT id,project_id AS projectId FROM warehouses WHERE id=?`, warehouseId);
        if (!warehouse || String(warehouse.projectId) !== projectId || !lines.length)
            throw new Error("Phiếu kiểm kê phải đúng dự án, kho và có dữ liệu đếm.");
        if (!(await canAccessWarehouse(user, warehouseId, true)))
            throw new Error("Tài khoản không có quyền kiểm kê kho này.");
        const countId = id("COUNT");
        const countNo = `KK-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${String(Date.now()).slice(-4)}`;
        const statements = [env.DB.prepare(`INSERT INTO stock_counts (id,count_no,project_id,warehouse_id,count_type,counted_at,status,approved_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(countId, countNo, projectId, warehouseId, clean(payload.countType) || "periodic", stamp, "pending_approval", null, stamp, stamp)];
        for (const line of lines) {
            const materialId = clean(line.materialId);
            const actualQty = numberValue(line.actualQty);
            const balance = await first(`SELECT COALESCE(SUM(CASE WHEN to_warehouse_id=? THEN quantity ELSE 0 END)-SUM(CASE WHEN from_warehouse_id=? THEN quantity ELSE 0 END),0) AS balance FROM stock_movements WHERE material_id=?`, warehouseId, warehouseId, materialId);
            const bookQty = numberValue(balance?.balance);
            const variance = actualQty - bookQty;
            statements.push(env.DB.prepare(`INSERT INTO stock_count_items (id,stock_count_id,material_id,book_qty_snapshot,actual_qty,variance_qty,reason,approved_adjustment_qty,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id("COUNTI"), countId, materialId, bookQty, actualQty, variance, clean(line.reason) || null, 0, stamp, stamp));
        }
        await env.DB.batch(statements);
        await audit(user.id, "CREATE", "stock_count", countId, null, { countNo, warehouseId, lineCount: lines.length }, request);
        return { message: `Đã lập ${countNo}; chênh lệch đang chờ duyệt điều chỉnh.` };
    }
    if (action === "approve_stock_count") {
        requireRole(user, ["commander", "project", "admin"]);
        const countId = clean(payload.countId);
        const count = await first(`SELECT id,project_id AS projectId,warehouse_id AS warehouseId,status FROM stock_counts WHERE id=?`, countId);
        if (!count || count.status !== "pending_approval")
            throw new Error("Phiếu kiểm kê không tồn tại hoặc đã xử lý.");
        if (!(await canAccessProject(user, String(count.projectId), true)))
            throw new Error("Tài khoản không có quyền duyệt kiểm kê tại dự án này.");
        if (!(await canAccessWarehouse(user, String(count.warehouseId), true)))
            throw new Error("Tài khoản không có quyền duyệt kiểm kê tại kho này.");
        const items = await all(`SELECT id,material_id AS materialId,variance_qty AS varianceQty FROM stock_count_items WHERE stock_count_id=?`, countId);
        const statements = [env.DB.prepare(`UPDATE stock_counts SET status='approved',approved_by=?,updated_at=? WHERE id=?`).bind(user.id, stamp, countId)];
        for (const item of items) {
            const variance = numberValue(item.varianceQty);
            statements.push(env.DB.prepare(`UPDATE stock_count_items SET approved_adjustment_qty=?,updated_at=? WHERE id=?`).bind(variance, stamp, item.id));
            if (variance !== 0)
                statements.push(env.DB.prepare(`INSERT INTO stock_movements (id,project_id,material_id,from_warehouse_id,to_warehouse_id,movement_type,quantity,unit_cost,occurred_at,reference_type,reference_id,posted_by,reversal_of_id,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MOV"), count.projectId, item.materialId, variance < 0 ? count.warehouseId : null, variance > 0 ? count.warehouseId : null, "ADJ", Math.abs(variance), 0, stamp, "stock_count", countId, user.id, null, stamp, stamp));
        }
        await env.DB.batch(statements);
        await audit(user.id, "APPROVE_ADJUSTMENT", "stock_count", countId, count, { itemCount: items.length }, request);
        return { message: "Đã duyệt kiểm kê và ghi sổ các điều chỉnh chênh lệch." };
    }
    if (action === "save_email_settings") {
        requireRole(user, ["admin"]);
        const enabled = payload.enabled === true || ["1", "true", "on"].includes(clean(payload.enabled).toLowerCase());
        const smtpHost = clean(payload.smtpHost);
        const smtpPort = Math.max(1, numberValue(payload.smtpPort) || 587);
        const security = ["starttls", "tls", "plain"].includes(clean(payload.security)) ? clean(payload.security) : "starttls";
        const username = clean(payload.username);
        const senderEmail = clean(payload.senderEmail).toLowerCase();
        const senderName = clean(payload.senderName) || VNTECH_IDENTITY.productName;
        const baseUrl = clean(payload.baseUrl).replace(/\/$/, "");
        const suppliedPassword = clean(payload.smtpPassword);
        const existing = await first(`SELECT password FROM email_settings WHERE id='EMAIL'`);
        const smtpPassword = suppliedPassword ? await encryptEmailPassword(suppliedPassword) : clean(existing?.password);
        if (enabled && (!smtpHost || !smtpPort || !username || !smtpPassword || !emailsFrom(senderEmail).length))
            throw new Error("Để bật gửi mail cần đủ máy chủ SMTP, tài khoản, mật khẩu ứng dụng và email người gửi.");
        if (baseUrl && !/^https?:\/\//i.test(baseUrl))
            throw new Error("Địa chỉ phần mềm trong email phải bắt đầu bằng http:// hoặc https://.");
        const poSla = Math.max(1, numberValue(payload.poSlaHours) || 24);
        const bchSla = Math.max(1, numberValue(payload.bchConfirmationSlaHours) || 8);
        const statements = [
            env.DB.prepare(`INSERT INTO email_settings (id,enabled,smtp_host,smtp_port,security,username,password,sender_email,sender_name,base_url,updated_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET enabled=excluded.enabled,smtp_host=excluded.smtp_host,smtp_port=excluded.smtp_port,security=excluded.security,username=excluded.username,password=excluded.password,sender_email=excluded.sender_email,sender_name=excluded.sender_name,base_url=excluded.base_url,updated_by=excluded.updated_by,updated_at=excluded.updated_at`).bind("EMAIL", enabled ? 1 : 0, smtpHost || null, smtpPort, security, username || null, smtpPassword || null, senderEmail || null, senderName, baseUrl || null, user.id, stamp, stamp),
            env.DB.prepare(`UPDATE company_settings SET po_sla_hours=?,bch_confirmation_sla_hours=?,updated_by=?,updated_at=? WHERE id='SETTINGS'`).bind(poSla, bchSla, user.id, stamp),
            env.DB.prepare(`DELETE FROM approval_email_recipients`),
        ];
        const assignmentsProvided = Array.isArray(payload.assignments);
        const assignments = assignmentsProvided ? payload.assignments : [];
        if (assignmentsProvided) statements.push(env.DB.prepare(`DELETE FROM approval_project_assignments`));
        for (const row of assignments) {
            const projectId = clean(row.projectId); const stage = Math.trunc(numberValue(row.stage)); const ownerUserId = clean(row.ownerUserId); const ccEmails = emailsFrom(row.ccEmails).join(",");
            if (!projectId || !stage || !ownerUserId) continue;
            const stageCfg = stage < 100 ? await first(`SELECT stage_no AS stageNo,name,allowed_role_codes AS allowedRoleCodes FROM approval_stage_catalog WHERE stage_no=? AND active=1`,stage) : {stageNo:stage,name:stage===101?'Lập & phát hành PO':stage===102?'Giao nhận':'BCH xác nhận giao hàng',allowedRoleCodes:stage===101?'procurement,kh_nv,kh_truong':stage===102?'warehouse,thu_kho':stage===103?'commander,cht':''};
            const owner = await first(`SELECT u.id,u.full_name AS fullName,u.role,COALESCE(rc.base_role,u.role) AS baseRole,u.active FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE u.id=?`,ownerUserId);
            if (!owner || Number(owner.active||0)!==1) throw new Error(`Owner được chọn cho ${stageCfg.name} không còn hoạt động.`);
            const allowed=stageRoleCodes(stageCfg); if (allowed.length && !allowed.includes(clean(owner.role)) && !allowed.includes(clean(owner.baseRole))) throw new Error(`${owner.fullName} không thuộc vai trò được phép của ${stageCfg.name}.`);
            const scoped=await first(`SELECT 1 AS ok FROM user_project_scopes WHERE user_id=? AND project_id=? LIMIT 1`,ownerUserId,projectId); if(!scoped && clean(owner.role)!=='admin') throw new Error(`${owner.fullName} chưa được phân quyền dự án.`);
            statements.push(env.DB.prepare(`INSERT INTO approval_project_assignments(id,project_id,stage,owner_user_id,cc_emails,active,updated_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id("APOWN"),projectId,stage,ownerUserId,ccEmails||null,1,user.id,stamp,stamp));
        }
        const recipients = Array.isArray(payload.recipients) ? payload.recipients : [];
        for (const row of recipients) {
            const projectId = clean(row.projectId);
            const stage = Math.trunc(numberValue(row.stage));
            const normalized = emailsFrom(row.emails).join(",");
            if (!projectId || !stage || !normalized)
                continue;
            statements.push(env.DB.prepare(`INSERT INTO approval_email_recipients (id,project_id,stage,emails,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?)`).bind(id("MAILTO"), projectId, stage, normalized, 1, stamp, stamp));
        }
        const testEmail = emailsFrom(payload.testEmail)[0];
        if (clean(payload.testEmail) && !testEmail)
            throw new Error("Email nhận thử không hợp lệ.");
        if (testEmail) {
            const subject = `[${VNTECH_IDENTITY.productName}] Kiểm tra cấu hình gửi email`;
            const textBody = `Cấu hình gửi email của ${VNTECH_IDENTITY.productName} (${VNTECH_IDENTITY.productId}) đã được lưu lúc ${new Date(stamp).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.`;
            const htmlBody = `<div style="font-family:Arial,sans-serif"><h2 style="color:#0b78be">${VNTECH_IDENTITY.productName} · ${VNTECH_IDENTITY.productId}</h2><p style="font-size:11px;color:#6b8190">${VNTECH_IDENTITY.legalOwner}</p><p>Cấu hình gửi email đã hoạt động. Đây là thư kiểm tra từ máy chủ nội bộ của công ty.</p></div>`;
            statements.push(env.DB.prepare(`INSERT INTO email_outbox (id,request_id,stage,event,recipients,subject,text_body,html_body,status,attempt_count,next_attempt_at,queued_at,sent_at,last_error,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MAIL"), null, null, "test", testEmail, subject, textBody, htmlBody, "queued", 0, stamp, stamp, null, null, stamp, stamp));
        }
        await env.DB.batch(statements);
        await audit(user.id, "UPDATE", "email_settings", "EMAIL", null, { enabled, smtpHost, smtpPort, security, senderEmail, baseUrl, poSla, bchSla, recipientCount: recipients.length, assignmentCount: assignments.length, testQueued: Boolean(testEmail) }, request);
        return { message: testEmail ? `Đã lưu cấu hình và xếp email thử gửi đến ${testEmail}.` : "Đã lưu cấu hình email, Owner theo dự án và CC thông báo." };
    }
    if (action === "retry_email") {
        requireRole(user, ["admin"]);
        const emailId = clean(payload.emailId);
        await env.DB.prepare(`UPDATE email_outbox SET status='queued',next_attempt_at=?,last_error=NULL,updated_at=? WHERE id=?`).bind(stamp, stamp, emailId).run();
        await audit(user.id, "RETRY", "email_outbox", emailId, null, null, request);
        return { message: "Đã xếp lại email để máy chủ gửi." };
    }
    if (action === "save_menu_group") {
        requireRole(user, ["admin"]);
        const groupId = clean(payload.groupId);
        const name = clean(payload.name);
        const icon = clean(payload.icon).slice(0, 4).toUpperCase() || "▦";
        const sortOrder = Math.trunc(numberValue(payload.sortOrder));
        const collapsible = payload.collapsible === true || clean(payload.collapsible) === "1" || clean(payload.collapsible) === "on";
        if (!name)
            throw new Error("Tên nhóm menu là bắt buộc.");
        if (groupId) {
            const before = await first(`SELECT id,group_key AS groupKey,name,icon,active,sort_order AS sortOrder,collapsible,system_locked AS systemLocked FROM menu_group_catalog WHERE id=?`, groupId);
            if (!before)
                throw new Error("Không tìm thấy nhóm menu.");
            await env.DB.prepare(`UPDATE menu_group_catalog SET name=?,icon=?,sort_order=?,collapsible=?,updated_at=? WHERE id=?`).bind(name, icon, sortOrder, collapsible ? 1 : 0, stamp, groupId).run();
            await env.DB.prepare(`UPDATE module_catalog SET group_name=?,updated_at=? WHERE group_key=?`).bind(name, stamp, before.groupKey).run();
            await audit(user.id, "UPDATE", "menu_group_catalog", groupId, before, { name, icon, sortOrder, collapsible }, request);
            return { message: `Đã cập nhật nhóm ${name}.` };
        }
        const groupKey = clean(payload.groupKey).toLowerCase();
        if (!/^[a-z0-9_-]{2,40}$/.test(groupKey))
            throw new Error("Mã nhóm gồm 2–40 ký tự a-z, số, gạch dưới hoặc gạch ngang.");
        const exists = await first(`SELECT id FROM menu_group_catalog WHERE group_key=?`, groupKey);
        if (exists)
            throw new Error("Mã nhóm menu đã tồn tại.");
        const newId = id("MGR");
        await env.DB.prepare(`INSERT INTO menu_group_catalog (id,group_key,name,icon,active,sort_order,collapsible,system_locked,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(newId, groupKey, name, icon, 1, sortOrder, collapsible ? 1 : 0, 0, stamp, stamp).run();
        await audit(user.id, "CREATE", "menu_group_catalog", newId, null, { groupKey, name, icon, sortOrder, collapsible }, request);
        return { message: `Đã thêm nhóm menu ${name}.` };
    }
    if (action === "set_menu_group_status") {
        requireRole(user, ["admin"]);
        const groupId = clean(payload.groupId);
        const active = payload.active === true || clean(payload.active) === "1";
        const before = await first(`SELECT id,group_key AS groupKey,name,active FROM menu_group_catalog WHERE id=?`, groupId);
        if (!before)
            throw new Error("Không tìm thấy nhóm menu.");
        if (!active) {
            const protectedModule = await first(`SELECT module_key AS moduleKey FROM module_catalog WHERE group_key=? AND module_key='admin' AND active=1`, before.groupKey);
            if (protectedModule)
                throw new Error("Không thể ẩn nhóm đang chứa Quản trị hệ thống. Hãy chuyển mục quản trị sang một nhóm đang hoạt động trước.");
        }
        await env.DB.prepare(`UPDATE menu_group_catalog SET active=?,updated_at=? WHERE id=?`).bind(active ? 1 : 0, stamp, groupId).run();
        await audit(user.id, "STATUS", "menu_group_catalog", groupId, before, { active }, request);
        return { message: active ? "Đã hiện nhóm menu." : "Đã ẩn nhóm menu và các mục con khỏi thanh điều hướng." };
    }
    if (action === "delete_menu_group") {
        requireRole(user, ["admin"]);
        const groupId = clean(payload.groupId);
        const before = await first(`SELECT id,group_key AS groupKey,name,system_locked AS systemLocked FROM menu_group_catalog WHERE id=?`, groupId);
        if (!before)
            throw new Error("Không tìm thấy nhóm menu.");
        if (Number(before.systemLocked) === 1)
            throw new Error("Nhóm hệ thống không được xóa. Có thể đổi tên, sắp xếp hoặc ẩn nếu không chứa mục quản trị.");
        const count = await first(`SELECT COUNT(*) AS count FROM module_catalog WHERE group_key=?`, before.groupKey);
        if (Number(count?.count || 0) > 0)
            throw new Error("Nhóm còn chức năng bên trong. Hãy chuyển các mục sang nhóm khác trước khi xóa.");
        await env.DB.prepare(`DELETE FROM menu_group_catalog WHERE id=?`).bind(groupId).run();
        await audit(user.id, "DELETE", "menu_group_catalog", groupId, before, null, request);
        return { message: `Đã xóa nhóm ${before.name}.` };
    }
    if (action === "reorder_menu_layout") {
        requireRole(user, ["admin"]);
        const groups = Array.isArray(payload.groups) ? payload.groups : [];
        const modules = Array.isArray(payload.modules) ? payload.modules : [];
        const validGroups = await all(`SELECT group_key AS groupKey,name FROM menu_group_catalog`);
        const groupMap = new Map(validGroups.map((row) => [String(row.groupKey), String(row.name)]));
        const statements = [];
        for (const row of groups) {
            const groupKey = clean(row.groupKey);
            if (!groupMap.has(groupKey)) continue;
            statements.push(env.DB.prepare(`UPDATE menu_group_catalog SET sort_order=?,updated_at=? WHERE group_key=?`).bind(Math.trunc(numberValue(row.sortOrder)), stamp, groupKey));
        }
        for (const row of modules) {
            const moduleKey = clean(row.moduleKey);
            const groupKey = clean(row.groupKey);
            if (!MODULE_KEYS.includes(moduleKey)) continue;
            if (groupKey && !groupMap.has(groupKey)) throw new Error(`Nhóm menu của ${moduleKey} không hợp lệ.`);
            if (moduleKey === "admin" && !groupKey) throw new Error("Mục Quản trị hệ thống phải nằm trong một nhóm để tránh mất đường truy cập quản trị.");
            const groupName = groupKey ? groupMap.get(groupKey) : null;
            statements.push(env.DB.prepare(`UPDATE module_catalog SET group_key=?,group_name=?,sort_order=?,updated_at=? WHERE module_key=?`).bind(groupKey || null, groupName, Math.trunc(numberValue(row.sortOrder)), stamp, moduleKey));
        }
        if (statements.length) await env.DB.batch(statements);
        await audit(user.id, "REORDER", "menu_layout", "SIDEBAR", null, { groups: groups.length, modules: modules.length }, request);
        return { message: "Đã lưu thứ tự và cấu trúc menu kéo/thả." };
    }
    if (action === "save_module_catalog") {
        requireRole(user, ["admin"]);
        const moduleKey = clean(payload.moduleKey);
        if (!MODULE_KEYS.includes(moduleKey))
            throw new Error("Mục chức năng không hợp lệ.");
        const before = await first(`SELECT module_key AS moduleKey,label,icon,group_name AS groupName,group_key AS groupKey,active,sort_order AS sortOrder FROM module_catalog WHERE module_key=?`, moduleKey);
        if (!before)
            throw new Error("Không tìm thấy mục chức năng.");
        const label = clean(payload.label);
        const icon = clean(payload.icon).slice(0, 4).toUpperCase();
        const groupKey = clean(payload.groupKey);
        const sortOrder = Math.trunc(numberValue(payload.sortOrder));
        if (!label || !icon)
            throw new Error("Tên hiển thị và ký hiệu menu là bắt buộc.");
        let groupName = null;
        if (groupKey) {
            const group = await first(`SELECT name,active FROM menu_group_catalog WHERE group_key=?`, groupKey);
            if (!group)
                throw new Error("Nhóm menu đã chọn không tồn tại.");
            groupName = group.name;
        }
        if (moduleKey === "admin" && !groupKey)
            throw new Error("Mục Quản trị hệ thống phải được đặt trong một nhóm menu.");
        await env.DB.prepare(`UPDATE module_catalog SET label=?,icon=?,group_name=?,group_key=?,sort_order=?,updated_at=? WHERE module_key=?`).bind(label, icon, groupName, groupKey || null, sortOrder, stamp, moduleKey).run();
        await audit(user.id, "UPDATE", "module_catalog", moduleKey, before, { label, icon, groupName, groupKey, sortOrder }, request);
        return { message: `Đã cập nhật mục ${label}.` };
    }
    if (action === "set_module_status") {
        requireRole(user, ["admin"]);
        const moduleKey = clean(payload.moduleKey);
        const active = payload.active === true || clean(payload.active) === "1";
        if (!MODULE_KEYS.includes(moduleKey))
            throw new Error("Mục chức năng không hợp lệ.");
        if (moduleKey === "admin" && !active)
            throw new Error("Không thể ẩn mục Danh mục & phân quyền vì đây là nơi khôi phục cấu hình hệ thống.");
        const before = await first(`SELECT module_key AS moduleKey,label,active FROM module_catalog WHERE module_key=?`, moduleKey);
        if (!before)
            throw new Error("Không tìm thấy mục chức năng.");
        await env.DB.prepare(`UPDATE module_catalog SET active=?,updated_at=? WHERE module_key=?`).bind(active ? 1 : 0, stamp, moduleKey).run();
        await audit(user.id, "STATUS", "module_catalog", moduleKey, before, { active }, request);
        return { message: active ? "Đã hiện lại mục chức năng." : "Đã ẩn mục chức năng trên thanh điều hướng và với người dùng." };
    }
    if(action==="save_engine_role_profile"){
        requireRole(user,["admin"]);const profileId=clean(payload.profileId),engineKey=clean(payload.engineKey),companyCode=clean(payload.companyCode).toLowerCase(),displayName=clean(payload.displayName),description=clean(payload.description),sortOrder=Math.trunc(numberValue(payload.sortOrder));const allowedEngines=["engineer","commander","project","procurement","accountant","warehouse","team","director"];if(!profileId||!allowedEngines.includes(engineKey))throw new Error("Không tìm thấy quyền nền cần cập nhật.");if(!/^[a-z0-9_-]{2,32}$/.test(companyCode))throw new Error("Mã quyền nền tại công ty gồm 2–32 ký tự a-z, số, gạch dưới hoặc gạch ngang.");if(!displayName)throw new Error("Tên quyền nền tại công ty không được để trống.");const before=await first(`SELECT id,engine_key AS engineKey,company_code AS companyCode,display_name AS displayName FROM business_role_engine_catalog WHERE id=? AND engine_key=?`,profileId,engineKey);if(!before)throw new Error("Quyền nền không tồn tại hoặc khóa liên kết không khớp.");if(await first(`SELECT id FROM business_role_engine_catalog WHERE company_code=? AND id<>?`,companyCode,profileId))throw new Error("Mã quyền nền tại công ty đã được sử dụng. Hãy nhập mã khác.");await env.DB.prepare(`UPDATE business_role_engine_catalog SET company_code=?,display_name=?,description=?,sort_order=?,updated_at=? WHERE id=?`).bind(companyCode,displayName,description||null,sortOrder,stamp,profileId).run();await audit(user.id,"UPDATE","business_role_engine",profileId,before,{engineKey,companyCode,displayName,description,sortOrder},request);return{message:`Đã đổi quyền nền thành ${companyCode} · ${displayName}. Các danh sách liên quan đã tự cập nhật.`};
    }
    if (action === "save_business_scope") {
        requireRole(user,["admin"]);const scopeId=clean(payload.scopeId),code=clean(payload.code).toLowerCase(),name=clean(payload.name),description=clean(payload.description),sortOrder=Math.trunc(numberValue(payload.sortOrder));if(!/^[a-z0-9_-]{2,40}$/.test(code))throw new Error("Mã phạm vi gồm 2–40 ký tự a-z, số, gạch dưới hoặc gạch ngang.");if(!name)throw new Error("Tên phạm vi nghiệp vụ là bắt buộc.");const duplicate=await first(`SELECT id FROM business_scope_catalog WHERE (code=? OR lower(trim(name))=lower(trim(?))) AND id<>COALESCE(?, '')`,code,name,scopeId||"");if(duplicate)throw new Error("Mã hoặc tên phạm vi nghiệp vụ đã tồn tại.");if(scopeId){const before=await first(`SELECT * FROM business_scope_catalog WHERE id=?`,scopeId);if(!before)throw new Error("Không tìm thấy phạm vi nghiệp vụ.");await env.DB.prepare(`UPDATE business_scope_catalog SET code=?,name=?,description=?,sort_order=?,updated_at=? WHERE id=?`).bind(code,name,description||null,sortOrder,stamp,scopeId).run();await audit(user.id,"UPDATE","business_scope",scopeId,before,{code,name,sortOrder},request);return{message:`Đã cập nhật phạm vi ${name}.`};}const newId=id("BSCOPE");await env.DB.prepare(`INSERT INTO business_scope_catalog(id,code,name,description,active,sort_order,system_locked,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(newId,code,name,description||null,1,sortOrder,0,stamp,stamp).run();await audit(user.id,"CREATE","business_scope",newId,null,{code,name,sortOrder},request);return{message:`Đã thêm phạm vi nghiệp vụ ${name}.`};
    }
    if(action==="set_business_scope_status"){requireRole(user,["admin"]);const scopeId=clean(payload.scopeId),active=payload.active===true||["1","true","on"].includes(clean(payload.active).toLowerCase());const before=await first(`SELECT * FROM business_scope_catalog WHERE id=?`,scopeId);if(!before)throw new Error("Không tìm thấy phạm vi nghiệp vụ.");if(!active){const used=await first(`SELECT COUNT(*) AS count FROM business_role_group_scopes brgs JOIN business_role_group_catalog bg ON bg.id=brgs.business_group_id WHERE brgs.business_scope_id=? AND bg.active=1`,scopeId);if(Number(used?.count||0)>0)throw new Error("Phạm vi đang được nhóm quyền hoạt động sử dụng. Hãy chuyển mapping trước khi ẩn.");}await env.DB.prepare(`UPDATE business_scope_catalog SET active=?,updated_at=? WHERE id=?`).bind(active?1:0,stamp,scopeId).run();await audit(user.id,active?"ACTIVATE":"ARCHIVE","business_scope",scopeId,before,{active},request);return{message:active?"Đã kích hoạt phạm vi nghiệp vụ.":"Đã ẩn phạm vi nghiệp vụ."};}
    if(action==="delete_business_scope"){requireRole(user,["admin"]);const scopeId=clean(payload.scopeId);const before=await first(`SELECT * FROM business_scope_catalog WHERE id=?`,scopeId);if(!before)throw new Error("Không tìm thấy phạm vi nghiệp vụ.");if(Number(before.system_locked||0)===1)throw new Error("Phạm vi gốc không được xóa cứng; có thể đổi tên sau khi bỏ bảo vệ ở release riêng hoặc dùng phạm vi tùy chỉnh.");const used=await first(`SELECT COUNT(*) AS count FROM business_role_group_scopes WHERE business_scope_id=?`,scopeId);if(Number(used?.count||0)>0)throw new Error("Phạm vi đang được nhóm quyền sử dụng. Hãy gỡ mapping trước khi xóa.");await env.DB.prepare(`DELETE FROM business_scope_catalog WHERE id=?`).bind(scopeId).run();await audit(user.id,"DELETE","business_scope",scopeId,before,null,request);return{message:"Đã xóa phạm vi nghiệp vụ chưa phát sinh liên kết."};}
    if (action === "save_business_role_group") {
        requireRole(user,["admin"]);const groupId=clean(payload.groupId),requestedCode=clean(payload.code).toLowerCase(),name=clean(payload.name),description=clean(payload.description),engineRole=clean(payload.engineRole),sortOrder=Math.trunc(numberValue(payload.sortOrder));const allowedEngines=["engineer","commander","project","procurement","accountant","warehouse","team","director"];const scopeIds=[...new Set((Array.isArray(payload.scopeIds)?payload.scopeIds:String(payload.scopeIds||"").split(",")).map(clean).filter(Boolean))];if(!name||!allowedEngines.includes(engineRole))throw new Error("Tên hoặc quyền nền của nhóm nghiệp vụ chưa hợp lệ.");if(!scopeIds.length)throw new Error("Nhóm quyền phải có ít nhất một Phạm vi nghiệp vụ.");for(const scopeId of scopeIds){if(!(await first(`SELECT id FROM business_scope_catalog WHERE id=? AND active=1`,scopeId)))throw new Error("Phạm vi nghiệp vụ được chọn không tồn tại hoặc đang bị ẩn.");}
        const persistScopes=async(targetId)=>{const statements=[env.DB.prepare(`DELETE FROM business_role_group_scopes WHERE business_group_id=?`).bind(targetId)];scopeIds.forEach((scopeId,index)=>statements.push(env.DB.prepare(`INSERT INTO business_role_group_scopes(id,business_group_id,business_scope_id,is_primary,created_at,updated_at) VALUES (?,?,?,?,?,?)`).bind(id("BRGS"),targetId,scopeId,index===0?1:0,stamp,stamp)));await env.DB.batch(statements);};
        if(groupId){const before=await first(`SELECT * FROM business_role_group_catalog WHERE id=?`,groupId);if(!before)throw new Error("Không tìm thấy nhóm nghiệp vụ.");if(clean(before.code)==="admin")throw new Error("Không được đổi mã nhóm Quản trị hệ thống.");const code=requestedCode||clean(before.code);if(!/^[a-z0-9_-]{2,32}$/.test(code))throw new Error("Mã nhóm gồm 2–32 ký tự a-z, số, gạch dưới hoặc gạch ngang.");if(await first(`SELECT id FROM business_role_group_catalog WHERE code=? AND id<>?`,code,groupId))throw new Error("Mã nhóm nghiệp vụ đã được sử dụng. Hãy nhập mã khác.");await env.DB.prepare(`UPDATE business_role_group_catalog SET code=?,name=?,description=?,engine_role=?,sort_order=?,updated_at=? WHERE id=?`).bind(code,name,description||null,engineRole,sortOrder,stamp,groupId).run();await persistScopes(groupId);await env.DB.prepare(`UPDATE role_catalog SET base_role=?,updated_at=? WHERE business_group_id=?`).bind(engineRole,stamp,groupId).run();await audit(user.id,"UPDATE","business_role_group",groupId,before,{code,name,engineRole,sortOrder,scopeIds},request);return{message:`Đã cập nhật ${code} · ${name}; phạm vi nghiệp vụ và chức danh liên kết đã đồng bộ.`};}
        const code=requestedCode;if(!/^[a-z0-9_-]{2,32}$/.test(code))throw new Error("Mã nhóm gồm 2–32 ký tự a-z, số, gạch dưới hoặc gạch ngang.");if(await first(`SELECT id FROM business_role_group_catalog WHERE code=?`,code))throw new Error("Mã nhóm nghiệp vụ đã được sử dụng. Hãy nhập mã khác.");const newId=id("BRG");await env.DB.prepare(`INSERT INTO business_role_group_catalog (id,code,name,description,engine_role,active,sort_order,system_locked,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(newId,code,name,description||null,engineRole,1,sortOrder,0,stamp,stamp).run();await persistScopes(newId);await audit(user.id,"CREATE","business_role_group",newId,null,{code,name,engineRole,sortOrder,scopeIds},request);return{message:`Đã thêm nhóm nghiệp vụ ${name}.`};
    }
    if(action==="set_business_role_group_status"){requireRole(user,["admin"]);const groupId=clean(payload.groupId),active=payload.active===true||clean(payload.active)==="1";const group=await first(`SELECT * FROM business_role_group_catalog WHERE id=?`,groupId);if(!group)throw new Error("Không tìm thấy nhóm nghiệp vụ.");if(clean(group.code)==="admin"&&!active)throw new Error("Không được ẩn nhóm Quản trị hệ thống.");await env.DB.prepare(`UPDATE business_role_group_catalog SET active=?,updated_at=? WHERE id=?`).bind(active?1:0,stamp,groupId).run();await audit(user.id,"STATUS","business_role_group",groupId,group,{active},request);return{message:active?"Đã hiện nhóm nghiệp vụ.":"Đã ẩn nhóm nghiệp vụ."};}
    if(action==="delete_business_role_group"){requireRole(user,["admin"]);const groupId=clean(payload.groupId);const group=await first(`SELECT * FROM business_role_group_catalog WHERE id=?`,groupId);if(!group)throw new Error("Không tìm thấy nhóm nghiệp vụ.");if(Number(group.system_locked||0)===1)throw new Error("Nhóm nghiệp vụ gốc không được xóa cứng; Quản trị viên có thể đổi tên hoặc ẩn nhóm.");const used=await first(`SELECT COUNT(*) AS count FROM role_catalog WHERE business_group_id=?`,groupId);if(Number(used?.count||0)>0)throw new Error("Nhóm đang được gán cho vai trò/chức danh. Hãy chuyển các vai trò sang nhóm khác trước khi xóa.");await env.DB.batch([env.DB.prepare(`DELETE FROM business_role_group_scopes WHERE business_group_id=?`).bind(groupId),env.DB.prepare(`DELETE FROM business_role_group_catalog WHERE id=?`).bind(groupId)]);await audit(user.id,"DELETE","business_role_group",groupId,group,null,request);return{message:"Đã xóa nhóm nghiệp vụ tùy chỉnh chưa phát sinh liên kết."};}
    if(action==="save_ui_display_settings"){requireRole(user,["admin"]);const allowedFonts=["Segoe UI","Arial","Tahoma","Roboto","Times New Roman"];const fontFamily=allowedFonts.includes(clean(payload.fontFamily))?clean(payload.fontFamily):"Segoe UI";const clamp=(value,min,max,fallback)=>Math.min(max,Math.max(min,numberValue(value)||fallback));const color=(value,fallback)=>/^#[0-9a-f]{6}$/i.test(clean(value))?clean(value):fallback;const settings={designVersion:VNTECH_IDENTITY.release.uiGeneration,fontFamily,baseFontSize:clamp(payload.baseFontSize,14,20,16),headingFontSize:clamp(payload.headingFontSize,22,34,28),materialNameSize:clamp(payload.materialNameSize,14,22,16),materialCodeSize:clamp(payload.materialCodeSize,13,20,15),textColor:color(payload.textColor,"#132238"),mutedColor:color(payload.mutedColor,"#63748b"),materialNameColor:color(payload.materialNameColor,"#132238"),materialCodeColor:color(payload.materialCodeColor,"#1769e0"),rowDensity:["compact","normal","comfortable"].includes(clean(payload.rowDensity))?clean(payload.rowDensity):"normal"};const before=await first(`SELECT settings_json AS settingsJson FROM ui_display_settings WHERE scope_key='company_default'`);await env.DB.prepare(`INSERT INTO ui_display_settings (id,scope_key,settings_json,updated_by,created_at,updated_at) VALUES ('UI-company','company_default',?,?,?,?) ON CONFLICT(scope_key) DO UPDATE SET settings_json=excluded.settings_json,updated_by=excluded.updated_by,updated_at=excluded.updated_at`).bind(JSON.stringify(settings),user.id,stamp,stamp).run();await audit(user.id,"UPDATE","ui_display_settings","company_default",before,settings,request);return{message:"Đã áp dụng cấu hình hiển thị toàn công ty."};}
    if (action === "install_license_foundation") {
        requireRole(user, ["admin"]);
        let envelope = payload.licenseEnvelope;
        if (typeof envelope === "string") {
            try { envelope = JSON.parse(envelope); }
            catch { throw new Error("Nội dung license không phải JSON hợp lệ."); }
        }
        const machineFingerprint = clean(env.TRUST_STATE?.machineFingerprint || (await first(`SELECT machine_fingerprint AS machineFingerprint FROM vntech_trust_settings WHERE id='TRUST-ROOT'`))?.machineFingerprint);
        const verification = await verifyLicenseEnvelope(envelope, {
            keyId: VNTECH_IDENTITY.trust.keyId,
            publicKeyPem: VNTECH_IDENTITY.trust.publicKeyPem,
            productId: VNTECH_IDENTITY.productId,
            tenantId: VNTECH_IDENTITY.company.tenantId,
            companyCode: VNTECH_IDENTITY.company.companyCode,
            machineFingerprint,
        });
        if (!verification.valid) {
            await env.DB.prepare(`INSERT INTO vntech_trust_audit(id,event_type,actor_user_id,trust_mode,enforcement_enabled,license_id,machine_fingerprint,detail_json,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id("TA"), "LICENSE_REJECTED", user.id, "development", 0, clean(envelope?.payload?.licenseId) || null, machineFingerprint || null, JSON.stringify({ reasons: verification.reasons }), stamp).run();
            throw new Error(`License không hợp lệ: ${verification.reasons.join("; ")}`);
        }
        const claims = verification.claims;
        await env.DB.batch([
            env.DB.prepare(`INSERT INTO vntech_license_installations(id,license_id,tenant_id,company_code,product_id,key_id,payload_json,signature_base64,status,valid_from,valid_until,machine_fingerprint,verification_detail_json,installed_by,installed_at,last_verified_at,revoked_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(license_id) DO UPDATE SET payload_json=excluded.payload_json,signature_base64=excluded.signature_base64,status=excluded.status,valid_from=excluded.valid_from,valid_until=excluded.valid_until,machine_fingerprint=excluded.machine_fingerprint,verification_detail_json=excluded.verification_detail_json,installed_by=excluded.installed_by,last_verified_at=excluded.last_verified_at,revoked_at=NULL,updated_at=excluded.updated_at`).bind(id("LIC"), claims.licenseId, claims.tenantId, claims.companyCode, claims.productId, envelope.keyId, JSON.stringify(claims), envelope.signature, "verified_development", claims.notBefore, claims.expiresAt, machineFingerprint || null, JSON.stringify({ signatureVerified: true, enforcement: false }), user.id, stamp, stamp, null, stamp),
            env.DB.prepare(`INSERT INTO vntech_trust_audit(id,event_type,actor_user_id,trust_mode,enforcement_enabled,license_id,machine_fingerprint,detail_json,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id("TA"), "LICENSE_VERIFIED", user.id, "development", 0, claims.licenseId, machineFingerprint || null, JSON.stringify({ enforcement: "disabled-by-design", keyId: envelope.keyId }), stamp),
        ]);
        return { message: "License đã được xác minh và lưu ở Development Mode; hệ thống vẫn chưa bật enforcement.", verification };
    }
    if (action === "request_license_transfer") {
        requireRole(user, ["admin"]);
        const licenseId = clean(payload.licenseId);
        const destinationMachineFingerprint = clean(payload.destinationMachineFingerprint).toLowerCase();
        const reason = clean(payload.reason);
        if (!reason) throw new Error("Yêu cầu chuyển/khôi phục license bắt buộc có lý do.");
        if (destinationMachineFingerprint && !/^[a-f0-9]{64}$/.test(destinationMachineFingerprint)) throw new Error("Machine fingerprint đích phải là SHA-256 64 ký tự.");
        const sourceMachineFingerprint = clean(env.TRUST_STATE?.machineFingerprint);
        const transferId = id("LTR");
        await env.DB.batch([
            env.DB.prepare(`INSERT INTO vntech_license_transfer_requests(id,license_id,source_machine_fingerprint,destination_machine_fingerprint,recovery_code_hash,reason,status,requested_by,requested_at,approved_at,completed_at,detail_json) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(transferId, licenseId || null, sourceMachineFingerprint || null, destinationMachineFingerprint || null, null, reason, "requested", user.id, stamp, null, null, JSON.stringify({ foundationOnly: true, automaticTransfer: false })),
            env.DB.prepare(`INSERT INTO vntech_trust_audit(id,event_type,actor_user_id,trust_mode,enforcement_enabled,license_id,machine_fingerprint,detail_json,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id("TA"), "TRANSFER_REQUESTED", user.id, "development", 0, licenseId || null, sourceMachineFingerprint || null, JSON.stringify({ transferId, destinationMachineFingerprint: destinationMachineFingerprint || null }), stamp),
        ]);
        return { message: "Đã ghi nhận yêu cầu chuyển/khôi phục. Foundation chưa tự động cấp hoặc thu hồi license.", transferId };
    }
    if (action === "save_trust_development_settings") {
        requireRole(user, ["admin"]);
        if (payload.enforcementEnabled === true || ["1", "true", "on"].includes(clean(payload.enforcementEnabled).toLowerCase())) throw new Error("Bản W2 đang khóa ở Development Mode. Chỉ được bật Production Enforcement bằng quy trình phát hành riêng sau khi chủ sản phẩm chốt.");
        const licenseServerUrl = clean(payload.licenseServerUrl) || null;
        if (licenseServerUrl && !/^https:\/\//i.test(licenseServerUrl)) throw new Error("License Server URL phải dùng HTTPS.");
        const before = await first(`SELECT license_server_url AS licenseServerUrl FROM vntech_trust_settings WHERE id='TRUST-ROOT'`);
        await env.DB.batch([
            env.DB.prepare(`UPDATE vntech_trust_settings SET trust_mode='development',enforcement_enabled=0,online_attestation_enabled=0,license_server_url=?,updated_at=? WHERE id='TRUST-ROOT'`).bind(licenseServerUrl, stamp),
            env.DB.prepare(`INSERT INTO vntech_trust_audit(id,event_type,actor_user_id,trust_mode,enforcement_enabled,license_id,machine_fingerprint,detail_json,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id("TA"), "DEVELOPMENT_SETTINGS_UPDATED", user.id, "development", 0, null, clean(env.TRUST_STATE?.machineFingerprint) || null, JSON.stringify({ before, licenseServerUrl, onlineAttestationEnabled: false }), stamp),
        ]);
        return { message: "Đã lưu cấu hình nền; License Enforcement và Online Attestation vẫn tắt theo thiết kế." };
    }
    if (action === "save_organization_unit") {
        requireRole(user, ["admin"]);
        const organizationUnitId = clean(payload.organizationUnitId);
        const code = clean(payload.code).toUpperCase();
        const name = clean(payload.name);
        const unitType = clean(payload.unitType).toLowerCase();
        const parentId = clean(payload.parentId) || null;
        const projectId = clean(payload.projectId) || null;
        const description = clean(payload.description) || null;
        const effectiveFrom = clean(payload.effectiveFrom) || null;
        const effectiveTo = clean(payload.effectiveTo) || null;
        const sortOrder = Math.trunc(numberValue(payload.sortOrder) || 100);
        if (!/^[A-Z0-9._-]{2,24}$/.test(code)) throw new Error("Mã đơn vị gồm 2–24 ký tự A-Z, số, dấu chấm, gạch dưới hoặc gạch ngang.");
        if (!name) throw new Error("Tên đơn vị là bắt buộc.");
        if (!["company", "department", "site_command"].includes(unitType)) throw new Error("Loại đơn vị tổ chức không hợp lệ.");
        if (effectiveFrom && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveFrom)) throw new Error("Ngày hiệu lực từ phải theo định dạng DD/MM/YYYY.");
        if (effectiveTo && !/^\d{4}-\d{2}-\d{2}$/.test(effectiveTo)) throw new Error("Ngày hiệu lực đến phải theo định dạng DD/MM/YYYY.");
        if (effectiveFrom && effectiveTo && effectiveTo < effectiveFrom) throw new Error("Ngày hiệu lực đến không được trước ngày hiệu lực từ.");
        if (unitType === "site_command" && code !== "BCH" && !projectId) throw new Error("BCH dự án phải gắn với một dự án cụ thể.");
        if (projectId && !(await first(`SELECT id FROM projects WHERE id=?`, projectId))) throw new Error("Dự án liên kết không tồn tại.");
        if (parentId) {
            if (parentId === organizationUnitId) throw new Error("Đơn vị không thể là cấp trên của chính nó.");
            const parent = await resolveOrganizationUnit(parentId);
            if (!parent) throw new Error("Đơn vị cấp trên không tồn tại hoặc đã bị ẩn.");
            if (organizationUnitId) {
                const descendant = await first(`WITH RECURSIVE descendants(id) AS (SELECT id FROM organization_units WHERE parent_id=? UNION ALL SELECT child.id FROM organization_units child JOIN descendants d ON child.parent_id=d.id) SELECT id FROM descendants WHERE id=? LIMIT 1`, organizationUnitId, parentId);
                if (descendant) throw new Error("Không thể chọn một đơn vị cấp dưới làm cấp trên.");
            }
        }
        const duplicateCode = await first(`SELECT id FROM organization_units WHERE code=? AND id<>COALESCE(?, '')`, code, organizationUnitId || "");
        if (duplicateCode) throw new Error(`Mã đơn vị ${code} đã tồn tại.`);
        const organizationNames = await all(`SELECT id,name FROM organization_units WHERE id<>COALESCE(?, '')`, organizationUnitId || "");
        const duplicateName = organizationNames.find((row) => organizationLookupKey(row.name) === organizationLookupKey(name));
        if (duplicateName) throw new Error(`Tên đơn vị “${name}” đã tồn tại.`);
        if (organizationUnitId) {
            const before = await first(`SELECT * FROM organization_units WHERE id=?`, organizationUnitId);
            if (!before) throw new Error("Không tìm thấy đơn vị tổ chức.");
            if (Number(before.system_locked || 0) === 1 && (clean(before.code) !== code || clean(before.unit_type) !== unitType)) throw new Error("Đơn vị gốc được phép đổi tên/mô tả nhưng không được đổi mã hoặc loại.");
            await env.DB.batch([
                env.DB.prepare(`UPDATE organization_units SET code=?,name=?,unit_type=?,parent_id=?,project_id=?,description=?,effective_from=?,effective_to=?,sort_order=?,updated_at=? WHERE id=?`).bind(code, name, unitType, parentId, projectId, description, effectiveFrom, effectiveTo, sortOrder, stamp, organizationUnitId),
                env.DB.prepare(`UPDATE users SET department=?,updated_at=? WHERE organization_unit_id=?`).bind(name, stamp, organizationUnitId),
            ]);
            await audit(user.id, "UPDATE", "organization_unit", organizationUnitId, before, { code, name, unitType, parentId, projectId, effectiveFrom, effectiveTo, sortOrder }, request);
            return { message: `Đã cập nhật đơn vị ${code} · ${name}; tên hiển thị của nhân sự liên kết đã đồng bộ.` };
        }
        const newId = id("ORG");
        await env.DB.prepare(`INSERT INTO organization_units(id,code,name,unit_type,parent_id,project_id,description,effective_from,effective_to,active,archived_at,sort_order,system_locked,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId, code, name, unitType, parentId, projectId, description, effectiveFrom, effectiveTo, 1, null, sortOrder, 0, stamp, stamp).run();
        await audit(user.id, "CREATE", "organization_unit", newId, null, { code, name, unitType, parentId, projectId, effectiveFrom, effectiveTo, sortOrder }, request);
        return { message: `Đã thêm đơn vị ${code} · ${name}.` };
    }
    if (action === "set_organization_unit_status") {
        requireRole(user, ["admin"]);
        const organizationUnitId = clean(payload.organizationUnitId);
        const active = payload.active === true || ["1", "true", "on"].includes(clean(payload.active).toLowerCase());
        const before = await first(`SELECT * FROM organization_units WHERE id=?`, organizationUnitId);
        if (!before) throw new Error("Không tìm thấy đơn vị tổ chức.");
        if (!active && Number(before.system_locked || 0) === 1) throw new Error("Đơn vị tổ chức gốc không được ngừng hoạt động.");
        if (!active) {
            const linkedUsers = await first(`SELECT COUNT(*) AS count FROM users WHERE organization_unit_id=? AND active=1`, organizationUnitId);
            if (Number(linkedUsers?.count || 0) > 0) throw new Error("Đơn vị còn nhân sự hoạt động. Hãy chuyển nhân sự sang đơn vị khác trước khi lưu trữ.");
            const activeChildren = await first(`SELECT COUNT(*) AS count FROM organization_units WHERE parent_id=? AND active=1`, organizationUnitId);
            if (Number(activeChildren?.count || 0) > 0) throw new Error("Đơn vị còn cấp dưới hoạt động. Hãy chuyển hoặc lưu trữ cấp dưới trước.");
        }
        await env.DB.prepare(`UPDATE organization_units SET active=?,archived_at=?,updated_at=? WHERE id=?`).bind(active ? 1 : 0, active ? null : stamp, stamp, organizationUnitId).run();
        await audit(user.id, active ? "ACTIVATE" : "ARCHIVE", "organization_unit", organizationUnitId, before, { active }, request);
        return { message: active ? "Đã kích hoạt đơn vị tổ chức." : "Đã lưu trữ đơn vị; dữ liệu lịch sử vẫn được giữ nguyên." };
    }
    if (action === "set_organization_unit_member") {
        const userId = clean(payload.userId);
        const organizationUnitId = clean(payload.organizationUnitId) || null;
        const target = await first(`SELECT id,full_name AS fullName,role,organization_unit_id AS organizationUnitId FROM users WHERE id=?`, userId);
        if (!target) throw new Error("Không tìm thấy nhân sự.");
        let unit = null;
        if (organizationUnitId) {
            unit = await first(`SELECT id,code,name,unit_type AS unitType,project_id AS projectId,active,archived_at AS archivedAt FROM organization_units WHERE id=?`, organizationUnitId);
            if (!unit || String(unit.unitType) !== "site_command") throw new Error("Đơn vị phải là Ban chỉ huy dự án (site_command).");
            if (Number(unit.active || 0) !== 1 || unit.archivedAt) throw new Error("Ban chỉ huy không còn hoạt động.");
        }
        if (!isAdmin(user)) {
            const projectId = clean(unit ? unit.projectId : "");
            if (!projectId || !(await canAccessProject(user, projectId, true))) throw new Error("Không có quyền quản lý Ban chỉ huy dự án này.");
        }
        const before = target;
        const stamp = now();
        if (organizationUnitId) {
            if (String(before.organizationUnitId || "") === organizationUnitId) throw new Error(`${target.fullName} đã thuộc Ban chỉ huy này.`);
            await env.DB.prepare(`UPDATE users SET organization_unit_id=?,department=(SELECT name FROM organization_units WHERE id=?),updated_at=? WHERE id=?`).bind(organizationUnitId, organizationUnitId, stamp, userId).run();
        } else {
            if (!before.organizationUnitId) throw new Error(`${target.fullName} không thuộc Ban chỉ huy nào để gỡ.`);
            await env.DB.prepare(`UPDATE users SET organization_unit_id=NULL,updated_at=? WHERE id=?`).bind(stamp, userId).run();
        }
        await replaceDepartmentDefaults(userId);
        await audit(user.id, organizationUnitId ? "ASSIGN_BCH" : "REMOVE_BCH", "organization_unit_member", userId, before, { organizationUnitId }, request);
        return { message: organizationUnitId ? `Đã thêm ${target.fullName} vào Ban chỉ huy.` : `Đã gỡ ${target.fullName} khỏi Ban chỉ huy.` };
    }
    if (action === "save_material_norm") {
        const normId=clean(payload.normId),projectId=clean(payload.projectId)||null,subcategoryId=clean(payload.subcategoryId)||null,itemName=clean(payload.itemName),materialId=clean(payload.materialId)||null,baseUom=clean(payload.baseUom)||null,quantityPerUnit=strictNonNegativeNumber(payload.quantityPerUnit ?? 0,"Định mức tiêu hao"),unit=clean(payload.unit)||null,sourceComponentId=clean(payload.sourceComponentId)||null,notes=clean(payload.notes)||null;
        if(!itemName)throw new Error("Hạng mục áp định mức là bắt buộc.");if(quantityPerUnit<=0)throw new Error("Định mức tiêu hao phải lớn hơn 0.");if(materialId&&!(await first(`SELECT id FROM materials WHERE id=? AND active=1`,materialId)))throw new Error("Mã vật tư không tồn tại hoặc đang bị ẩn.");
        if(normId){const old=await first(`SELECT * FROM material_norms WHERE id=?`,normId);if(!old)throw new Error("Không tìm thấy định mức.");await env.DB.prepare(`UPDATE material_norms SET project_id=?,subcategory_id=?,item_name=?,material_id=?,base_uom=?,quantity_per_unit=?,unit=?,source_component_id=?,notes=?,updated_at=? WHERE id=?`).bind(projectId,subcategoryId,itemName,materialId,baseUom,quantityPerUnit,unit,sourceComponentId,notes,stamp,normId).run();await audit(user.id,"UPDATE","material_norm",normId,old,{itemName,quantityPerUnit},request);return {message:"Đã cập nhật định mức vật tư."};}
        const newId=id("MNR"),seq=await first(`SELECT COUNT(*)+1 AS n FROM material_norms`);const normCode=`DM-${String(numberValue(seq?.n)||1).padStart(4,"0")}`;await env.DB.prepare(`INSERT INTO material_norms(id,norm_code,project_id,subcategory_id,item_name,material_id,base_uom,quantity_per_unit,unit,source_component_id,source_type,notes,status,active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,normCode,projectId,subcategoryId,itemName,materialId,baseUom,quantityPerUnit,unit,sourceComponentId,sourceComponentId?"boq_component":"manual",notes,"active",1,user.id,stamp,stamp).run();await audit(user.id,"CREATE","material_norm",newId,null,{itemName,quantityPerUnit},request);return {message:"Đã thêm định mức vật tư."};
    }
    if (action === "set_material_norm_status") {
        const normId=clean(payload.normId),active=payload.active===true||["1","true","on"].includes(clean(payload.active).toLowerCase());const old=await first(`SELECT * FROM material_norms WHERE id=?`,normId);if(!old)throw new Error("Không tìm thấy định mức.");await env.DB.prepare(`UPDATE material_norms SET active=?,status=CASE WHEN ? THEN 'active' ELSE 'inactive' END,updated_at=? WHERE id=?`).bind(active?1:0,active,stamp,normId).run();await audit(user.id,active?"ACTIVATE":"ARCHIVE","material_norm",normId,old,{active},request);return {message:active?"Đã kích hoạt định mức.":"Đã ẩn định mức."};
    }
    if (action === "delete_material_norm") {
        const normId=clean(payload.normId),old=await first(`SELECT * FROM material_norms WHERE id=?`,normId);if(!old)throw new Error("Không tìm thấy định mức.");await env.DB.prepare(`DELETE FROM material_norms WHERE id=?`).bind(normId).run();await audit(user.id,"DELETE","material_norm",normId,old,null,request);return {message:"Đã xóa định mức vật tư."};
    }
    if (action === "estimate_material_norms") {
        const projectId=clean(payload.projectId),quantity=strictNonNegativeNumber(payload.quantity ?? 0,"Khối lượng hạng mục");if(!projectId||quantity<=0)throw new Error("Ước lượng cần dự án và khối lượng hạng mục > 0.");const norms=await all(`SELECT mn.id,mn.item_name AS itemName,mn.material_id AS materialId,m.code AS materialCode,m.name AS materialName,m.unit AS materialUnit,mn.quantity_per_unit AS quantityPerUnit,mn.unit FROM material_norms mn LEFT JOIN materials m ON m.id=mn.material_id WHERE mn.active=1 AND mn.status='active' AND (mn.project_id=? OR mn.project_id IS NULL) ORDER BY mn.item_name`,projectId);return {rows:norms.map((n)=>({...n,requiredQuantity:Number(n.quantityPerUnit)*quantity}))};
    }
    if (action === "save_payment_plan") {
        const planId=clean(payload.planId),projectId=clean(payload.projectId),contractId=clean(payload.contractId)||null,poId=clean(payload.poId)||null,milestone=clean(payload.milestone)||null,plannedDate=clean(payload.plannedDate)||null,plannedAmount=strictNonNegativeNumber(payload.plannedAmount ?? 0,"Giá trị kế hoạch"),note=clean(payload.note)||null;
        if(!projectId)throw new Error("Kế hoạch thanh toán phải gắn dự án.");if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền cập nhật kế hoạch tại dự án này.");
        if(planId){const old=await first(`SELECT * FROM payment_plans WHERE id=?`,planId);if(!old)throw new Error("Không tìm thấy kế hoạch thanh toán.");if(clean(old.project_id)!==projectId)throw new Error("Không được chuyển kế hoạch sang dự án khác.");await env.DB.prepare(`UPDATE payment_plans SET contract_id=?,po_id=?,milestone=?,planned_date=?,planned_amount=?,note=?,updated_at=? WHERE id=?`).bind(contractId,poId,milestone,plannedDate,plannedAmount,note,stamp,planId).run();await audit(user.id,"UPDATE","payment_plan",planId,old,{projectId,plannedAmount},request);return {message:"Đã cập nhật kế hoạch thanh toán."};}
        const newId=id("PPL"),seq=await first(`SELECT COUNT(*)+1 AS n FROM payment_plans WHERE project_id=? AND substr(COALESCE(planned_date,''),1,4)=?`,projectId,(plannedDate||"").slice(0,4));const planNo=`PPL-${clean((await first(`SELECT code FROM projects WHERE id=?`,projectId))?.code)||"DA"}-${String(numberValue(seq?.n)||1).padStart(4,"0")}`;await env.DB.prepare(`INSERT INTO payment_plans(id,plan_no,project_id,contract_id,po_id,milestone,planned_date,planned_amount,paid_amount,status,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,planNo,projectId,contractId,poId,milestone,plannedDate,plannedAmount,0,plannedDate&&plannedDate<now().slice(0,10)?"overdue":"planned",note,user.id,stamp,stamp).run();await audit(user.id,"CREATE","payment_plan",newId,null,{projectId,plannedAmount},request);return {message:"Đã thêm kế hoạch thanh toán."};
    }
    if (action === "set_payment_plan_status") {
        const planId=clean(payload.planId),status=clean(payload.status),paidAmount=strictNonNegativeNumber(payload.paidAmount ?? 0,"Số tiền đã thanh toán");const old=await first(`SELECT * FROM payment_plans WHERE id=?`,planId);if(!old)throw new Error("Không tìm thấy kế hoạch thanh toán.");if(!(await canAccessProject(user,clean(old.project_id),true)))throw new Error("Không có quyền tại dự án này.");if(paidAmount>numberValue(old.planned_amount))throw new Error("Số tiền đã thanh toán không được vượt kế hoạch.");await env.DB.prepare(`UPDATE payment_plans SET status=?,paid_amount=?,updated_at=? WHERE id=?`).bind(status,paidAmount,stamp,planId).run();await audit(user.id,"STATUS","payment_plan",planId,old,{status,paidAmount},request);return {message:"Đã cập nhật trạng thái kế hoạch thanh toán."};
    }
    if (action === "delete_payment_plan") {
        const planId=clean(payload.planId),old=await first(`SELECT * FROM payment_plans WHERE id=?`,planId);if(!old)throw new Error("Không tìm thấy kế hoạch thanh toán.");if(!(await canAccessProject(user,clean(old.project_id),true)))throw new Error("Không có quyền tại dự án này.");if(Number(old.paid_amount||0)>0)throw new Error("Kế hoạch đã phát sinh thanh toán nên không được xóa; hãy đóng kế hoạch.");await env.DB.prepare(`DELETE FROM payment_plans WHERE id=?`).bind(planId).run();await audit(user.id,"DELETE","payment_plan",planId,old,null,request);return {message:"Đã xóa kế hoạch thanh toán."};
    }
    if (action === "save_advance_request") {
        const requestId=clean(payload.requestId),projectId=clean(payload.projectId)||null,requesterId=clean(payload.requesterId),amount=strictNonNegativeNumber(payload.amount ?? 0,"Số tiền tạm ứng"),purpose=clean(payload.purpose),category=clean(payload.category)||"purchase",note=clean(payload.note)||null;
        if(!requesterId||!amount||amount<=0||!purpose)throw new Error("Tạm ứng cần người nhận, số tiền > 0 và mục đích.");if(projectId&&!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền tại dự án này.");
        if(requestId){const old=await first(`SELECT * FROM advance_requests WHERE id=?`,requestId);if(!old)throw new Error("Không tìm thấy phiếu tạm ứng.");if(clean(old.status)==="settled"&&!isAdmin(user))throw new Error("Phiếu đã hoàn ứng; chỉ Quản trị được mở lại.");const nextStatus=payload.submit===true?(clean(old.status)==="approved"?"approved":"submitted"):clean(old.status)||"draft";await env.DB.prepare(`UPDATE advance_requests SET project_id=?,requester_id=?,amount=?,purpose=?,category=?,note=?,status=?,updated_at=? WHERE id=?`).bind(projectId,requesterId,amount,purpose,category,note,nextStatus,stamp,requestId).run();await audit(user.id,"UPDATE","advance_request",requestId,old,{projectId,amount},request);return {message:nextStatus==="submitted"?"Đã cập nhật và gửi tạm ứng để Phòng Tài chính duyệt.":"Đã cập nhật phiếu tạm ứng."};}
        const newId=id("ADV"),seq=await first(`SELECT COUNT(*)+1 AS n FROM advance_requests`);const requestNo=`TƯ-${String(numberValue(seq?.n)||1).padStart(5,"0")}`;const status0=payload.submit===true?"submitted":"draft";await env.DB.prepare(`INSERT INTO advance_requests(id,request_no,project_id,requester_id,amount,purpose,category,status,advance_paid,settlement_value,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,requestNo,projectId,requesterId,amount,purpose,category,status0,0,0,note,user.id,stamp,stamp).run();await audit(user.id,"CREATE","advance_request",newId,null,{projectId,amount},request);return {message:status0==="submitted"?"Đã tạo phiếu tạm ứng và gửi duyệt.":"Đã tạo phiếu tạm ứng (bản nháp)."};
    }
    if (action === "settle_advance_request") {
        const requestId=clean(payload.requestId),advancePaid=strictNonNegativeNumber(payload.advancePaid ?? 0,"Số tiền đã chi tạm ứng"),settlementValue=strictNonNegativeNumber(payload.settlementValue ?? 0,"Giá trị hoàn ứng");const old=await first(`SELECT * FROM advance_requests WHERE id=?`,requestId);if(!old)throw new Error("Không tìm thấy phiếu tạm ứng.");if(clean(old.status)!=="approved"&&clean(old.status)!=="submitted")throw new Error("Chỉ hoàn ứng phiếu đã duyệt.");if(settlementValue>numberValue(old.amount)+1e-9)throw new Error("Giá trị hoàn ứng không được vượt số tiền tạm ứng.");await env.DB.prepare(`UPDATE advance_requests SET advance_paid=?,settlement_value=?,status='settled',settled_at=?,updated_at=? WHERE id=?`).bind(advancePaid,settlementValue,stamp,stamp,requestId).run();await audit(user.id,"SETTLE","advance_request",requestId,old,{advancePaid,settlementValue},request);return {message:"Đã hoàn ứng phiếu tạm ứng; số dư tự động theo dõi."};
    }
    if (action === "delete_advance_request") {
        const requestId=clean(payload.requestId),old=await first(`SELECT * FROM advance_requests WHERE id=?`,requestId);if(!old)throw new Error("Không tìm thấy phiếu tạm ứng.");if(clean(old.status)==="settled")throw new Error("Phiếu đã hoàn ứng không được xóa.");await env.DB.prepare(`DELETE FROM advance_requests WHERE id=?`).bind(requestId).run();await audit(user.id,"DELETE","advance_request",requestId,old,null,request);return {message:"Đã xóa phiếu tạm ứng."};
    }
    if (action === "save_site_expense_claim") {
        const claimId=clean(payload.claimId),projectId=clean(payload.projectId),costType=clean(payload.costType),amount=strictNonNegativeNumber(payload.amount ?? 0,"Số chi phí"),paidBy=clean(payload.paidBy)||null,claimDate=clean(payload.claimDate)||null,description=clean(payload.description)||null,voucherAttachmentId=clean(payload.voucherAttachmentId)||null;
        if(!projectId||!costType||amount<=0)throw new Error("Chi phí hiện trường cần dự án, loại chi phí và số tiền > 0.");if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền tại dự án này.");
        if(claimId){const old=await first(`SELECT * FROM site_expense_claims WHERE id=?`,claimId);if(!old)throw new Error("Không tìm thấy chi phí.");if(clean(old.project_id)!==projectId)throw new Error("Không được chuyển chi phí sang dự án khác.");if(clean(old.status)==="approved"&&!isAdmin(user))throw new Error("Chi phí đã duyệt; chỉ Quản trị được mở lại.");const nextStatus=clean(old.status)==="approved"?"approved":(payload.submit===true?"submitted":clean(old.status)||"draft");await env.DB.prepare(`UPDATE site_expense_claims SET cost_type=?,amount=?,paid_by=?,claim_date=?,description=?,voucher_attachment_id=?,status=?,updated_at=? WHERE id=?`).bind(costType,amount,paidBy,claimDate,description,voucherAttachmentId,nextStatus,stamp,claimId).run();await audit(user.id,"UPDATE","site_expense_claim",claimId,old,{projectId,costType,amount},request);return {message:nextStatus==="submitted"?"Đã cập nhật và gửi chi phí để duyệt.":"Đã cập nhật chi phí hiện trường."};}
        const newId=id("SEC"),seq=await first(`SELECT COUNT(*)+1 AS n FROM site_expense_claims`);const claimNo=`CP-${clean((await first(`SELECT code FROM projects WHERE id=?`,projectId))?.code)||"DA"}-${String(numberValue(seq?.n)||1).padStart(4,"0")}`;const status0=payload.submit===true?"submitted":"draft";await env.DB.prepare(`INSERT INTO site_expense_claims(id,claim_no,project_id,cost_type,amount,paid_by,claim_date,description,voucher_attachment_id,status,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,claimNo,projectId,costType,amount,paidBy,claimDate,description,voucherAttachmentId,status0,user.id,stamp,stamp).run();await audit(user.id,"CREATE","site_expense_claim",newId,null,{projectId,costType,amount},request);return {message:status0==="submitted"?"Đã ghi chi phí và gửi duyệt.":"Đã ghi chi phí hiện trường (bản nháp)."};
    }
    if (action === "approve_site_expense_claim") {
        const claimId=clean(payload.claimId),old=await first(`SELECT * FROM site_expense_claims WHERE id=?`,claimId);if(!old)throw new Error("Không tìm thấy chi phí.");if(!(await canAccessProject(user,clean(old.project_id),true)))throw new Error("Không có quyền tại dự án này.");if(clean(old.status)==="approved")throw new Error("Chi phí đã duyệt.");await env.DB.prepare(`UPDATE site_expense_claims SET status='approved',approved_by=?,approved_at=?,updated_at=? WHERE id=?`).bind(user.id,stamp,stamp,claimId).run();await audit(user.id,"APPROVE","site_expense_claim",claimId,old,{},request);return {message:"Đã duyệt chi phí hiện trường."};
    }
    if (action === "delete_site_expense_claim") {
        const claimId=clean(payload.claimId),old=await first(`SELECT * FROM site_expense_claims WHERE id=?`,claimId);if(!old)throw new Error("Không tìm thấy chi phí.");if(!(await canAccessProject(user,clean(old.project_id),true)))throw new Error("Không có quyền tại dự án này.");if(clean(old.status)==="approved"&&!isAdmin(user))throw new Error("Chi phí đã duyệt; chỉ Quản trị được xóa.");await env.DB.prepare(`DELETE FROM site_expense_claims WHERE id=?`).bind(claimId).run();await audit(user.id,"DELETE","site_expense_claim",claimId,old,null,request);return {message:"Đã xóa chi phí hiện trường."};
    }
    if (action === "save_bank_account") {
        const accountId=clean(payload.accountId),code=clean(payload.code),bankName=clean(payload.bankName),accountNo=clean(payload.accountNo),branch=clean(payload.branch)||null,currency=clean(payload.currency)||"VND",openingBalance=strictNonNegativeNumber(payload.openingBalance ?? 0,"Số dư đầu kỳ");
        if(!code||!bankName||!accountNo)throw new Error("Tài khoản ngân hàng cần mã, ngân hàng và số tài khoản.");
        if(accountId){const old=await first(`SELECT * FROM bank_accounts WHERE id=?`,accountId);if(!old)throw new Error("Không tìm thấy tài khoản.");await env.DB.prepare(`UPDATE bank_accounts SET code=?,bank_name=?,account_no=?,branch=?,currency=?,opening_balance=?,updated_at=? WHERE id=?`).bind(code,bankName,accountNo,branch,currency,openingBalance,stamp,accountId).run();await audit(user.id,"UPDATE","bank_account",accountId,old,{code},request);return {message:"Đã cập nhật tài khoản ngân hàng."};}
        const dup=await first(`SELECT id FROM bank_accounts WHERE code=?`,code);if(dup)throw new Error("Mã tài khoản đã tồn tại.");const newId=id("BKA");await env.DB.prepare(`INSERT INTO bank_accounts(id,code,bank_name,account_no,branch,currency,opening_balance,active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,code,bankName,accountNo,branch,currency,openingBalance,1,user.id,stamp,stamp).run();await audit(user.id,"CREATE","bank_account",newId,null,{code},request);return {message:"Đã thêm tài khoản ngân hàng."};
    }
    if (action === "save_cashbook_entry") {
        const entryId=clean(payload.entryId),entryDate=clean(payload.entryDate),accountId=clean(payload.accountId),entryType=clean(payload.entryType),amount=strictNonNegativeNumber(payload.amount ?? 0,"Số tiền"),counterparty=clean(payload.counterparty)||null,referenceType=clean(payload.referenceType)||null,referenceId=clean(payload.referenceId)||null,note=clean(payload.note)||null;
        if(!entryDate||!accountId||!["IN","OUT"].includes(entryType)||amount<=0)throw new Error("Sổ quỹ cần ngày, tài khoản, loại Thu/Chi và số tiền > 0.");const acc=await first(`SELECT id FROM bank_accounts WHERE id=?`,accountId);if(!acc)throw new Error("Tài khoản không tồn tại.");
        if(entryId){const old=await first(`SELECT * FROM cashbook_entries WHERE id=?`,entryId);if(!old)throw new Error("Không tìm thấy bút toán.");await env.DB.prepare(`UPDATE cashbook_entries SET entry_date=?,account_id=?,entry_type=?,amount=?,counterparty=?,reference_type=?,reference_id=?,note=?,updated_at=? WHERE id=?`).bind(entryDate,accountId,entryType,amount,counterparty,referenceType,referenceId,note,stamp,entryId).run();await audit(user.id,"UPDATE","cashbook_entry",entryId,old,{entryType,amount},request);return {message:"Đã cập nhật bút toán sổ quỹ."};}
        const newId=id("CBE"),seq=await first(`SELECT COUNT(*)+1 AS n FROM cashbook_entries`);const entryNo=`SQ-${String(numberValue(seq?.n)||1).padStart(6,"0")}`;await env.DB.prepare(`INSERT INTO cashbook_entries(id,entry_no,entry_date,account_id,entry_type,amount,counterparty,reference_type,reference_id,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,entryNo,entryDate,accountId,entryType,amount,counterparty,referenceType,referenceId,note,user.id,stamp,stamp).run();await audit(user.id,"CREATE","cashbook_entry",newId,null,{entryType,amount},request);return {message:"Đã ghi sổ quỹ; số dư tự cập nhật."};
    }
    if (action === "delete_cashbook_entry") {
        const entryId=clean(payload.entryId),old=await first(`SELECT * FROM cashbook_entries WHERE id=?`,entryId);if(!old)throw new Error("Không tìm thấy bút toán.");await env.DB.prepare(`DELETE FROM cashbook_entries WHERE id=?`).bind(entryId).run();await audit(user.id,"DELETE","cashbook_entry",entryId,old,null,request);return {message:"Đã xóa bút toán sổ quỹ."};
    }
    if (action === "save_accounting_voucher") {
        const voucherId=clean(payload.voucherId),voucherDate=clean(payload.voucherDate),voucherType=clean(payload.voucherType),projectId=clean(payload.projectId)||null,description=clean(payload.description)||null,totalAmount=strictNonNegativeNumber(payload.totalAmount ?? 0,"Giá trị chứng từ"),filesJson=clean(payload.filesJson)||null;
        if(!voucherDate||!voucherType)throw new Error("Chứng từ kế toán cần ngày và loại chứng từ.");
        if(voucherId){const old=await first(`SELECT * FROM accounting_vouchers WHERE id=?`,voucherId);if(!old)throw new Error("Không tìm thấy chứng từ.");await env.DB.prepare(`UPDATE accounting_vouchers SET voucher_date=?,voucher_type=?,project_id=?,description=?,total_amount=?,files_json=?,updated_at=? WHERE id=?`).bind(voucherDate,voucherType,projectId,description,totalAmount,filesJson,stamp,voucherId).run();await audit(user.id,"UPDATE","accounting_voucher",voucherId,old,{voucherType,totalAmount},request);return {message:"Đã cập nhật chứng từ kế toán."};}
        const newId=id("AVC"),seq=await first(`SELECT COUNT(*)+1 AS n FROM accounting_vouchers WHERE substr(voucher_date,1,4)=?`,voucherDate.slice(0,4));const voucherNo=`CT-${voucherDate.slice(0,4)}-${String(numberValue(seq?.n)||1).padStart(4,"0")}`;await env.DB.prepare(`INSERT INTO accounting_vouchers(id,voucher_no,voucher_date,voucher_type,project_id,description,total_amount,status,files_json,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,voucherNo,voucherDate,voucherType,projectId,description,totalAmount,"draft",filesJson,user.id,stamp,stamp).run();await audit(user.id,"CREATE","accounting_voucher",newId,null,{voucherType,totalAmount},request);return {message:"Đã lập chứng từ kế toán."};
    }
    if (action === "delete_accounting_voucher") {
        const voucherId=clean(payload.voucherId),old=await first(`SELECT * FROM accounting_vouchers WHERE id=?`,voucherId);if(!old)throw new Error("Không tìm thấy chứng từ.");await env.DB.prepare(`DELETE FROM accounting_vouchers WHERE id=?`).bind(voucherId).run();await audit(user.id,"DELETE","accounting_voucher",voucherId,old,null,request);return {message:"Đã xóa chứng từ kế toán."};
    }
    if (action === "save_hr_record") {
        const userId=clean(payload.userId),fullName=clean(payload.fullName)||clean(payload.userFullName),identityNo=clean(payload.identityNo)||null,identityDate=clean(payload.identityDate)||null,identityPlace=clean(payload.identityPlace)||null,birthDate=clean(payload.birthDate)||null,birthplace=clean(payload.birthplace)||null,permanentAddress=clean(payload.permanentAddress)||null,phone=clean(payload.phone)||null,educationLevel=clean(payload.educationLevel)||null,joinedDate=clean(payload.joinedDate)||null,position=clean(payload.position)||null,note=clean(payload.note)||null;
        if(!userId||!fullName)throw new Error("Hồ sơ nhân sự cần nhân sự và họ tên.");const target=await first(`SELECT id FROM users WHERE id=?`,userId);if(!target)throw new Error("Nhân sự không tồn tại.");
        const existing=await first(`SELECT id FROM hr_records WHERE user_id=?`,userId);if(existing){const old=await first(`SELECT * FROM hr_records WHERE id=?`,existing.id);await env.DB.prepare(`UPDATE hr_records SET full_name=?,identity_no=?,identity_date=?,identity_place=?,birth_date=?,birthplace=?,permanent_address=?,phone=?,education_level=?,joined_date=?,position=?,note=?,updated_at=? WHERE id=?`).bind(fullName,identityNo,identityDate,identityPlace,birthDate,birthplace,permanentAddress,phone,educationLevel,joinedDate,position,note,stamp,existing.id).run();await audit(user.id,"UPDATE","hr_record",existing.id,old,{userId},request);return {message:"Đã cập nhật hồ sơ nhân sự."};}
        const newId=id("HR");await env.DB.prepare(`INSERT INTO hr_records(id,user_id,full_name,identity_no,identity_date,identity_place,birth_date,birthplace,permanent_address,phone,education_level,joined_date,position,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,userId,fullName,identityNo,identityDate,identityPlace,birthDate,birthplace,permanentAddress,phone,educationLevel,joinedDate,position,note,user.id,stamp,stamp).run();await audit(user.id,"CREATE","hr_record",newId,null,{userId},request);return {message:"Đã lập hồ sơ nhân sự."};
    }
    if (action === "save_labor_contract") {
        const contractId=clean(payload.contractId),userId=clean(payload.userId),contractType=clean(payload.contractType),startDate=clean(payload.startDate)||null,endDate=clean(payload.endDate)||null,signingDate=clean(payload.signingDate)||null,salary=strictNonNegativeNumber(payload.salary ?? 0,"Mức lương"),note=clean(payload.note)||null;
        if(!userId||!contractType)throw new Error("Hợp đồng lao động cần nhân sự và loại hợp đồng.");const target=await first(`SELECT id FROM users WHERE id=?`,userId);if(!target)throw new Error("Nhân sự không tồn tại.");
        if(contractId){const old=await first(`SELECT * FROM labor_contracts WHERE id=?`,contractId);if(!old)throw new Error("Không tìm thấy hợp đồng.");await env.DB.prepare(`UPDATE labor_contracts SET user_id=?,contract_type=?,start_date=?,end_date=?,signing_date=?,salary=?,note=?,updated_at=? WHERE id=?`).bind(userId,contractType,startDate,endDate,signingDate,salary,note,stamp,contractId).run();await audit(user.id,"UPDATE","labor_contract",contractId,old,{userId,contractType},request);return {message:"Đã cập nhật hợp đồng lao động."};}
        const newId=id("LBC"),seq=await first(`SELECT COUNT(*)+1 AS n FROM labor_contracts`);const contractNo=`HĐLĐ-${String(numberValue(seq?.n)||1).padStart(5,"0")}`;await env.DB.prepare(`INSERT INTO labor_contracts(id,contract_no,user_id,contract_type,start_date,end_date,signing_date,salary,status,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,contractNo,userId,contractType,startDate,endDate,signingDate,salary,"active",note,user.id,stamp,stamp).run();await audit(user.id,"CREATE","labor_contract",newId,null,{userId,contractType},request);return {message:"Đã lập hợp đồng lao động."};
    }
    if (action === "set_labor_contract_status") {
        const contractId=clean(payload.contractId),status=clean(payload.status);const old=await first(`SELECT * FROM labor_contracts WHERE id=?`,contractId);if(!old)throw new Error("Không tìm thấy hợp đồng.");await env.DB.prepare(`UPDATE labor_contracts SET status=?,updated_at=? WHERE id=?`).bind(status,stamp,contractId).run();await audit(user.id,"STATUS","labor_contract",contractId,old,{status},request);return {message:"Đã cập nhật trạng thái hợp đồng lao động."};
    }
    if (action === "delete_labor_contract") {
        const contractId=clean(payload.contractId),old=await first(`SELECT * FROM labor_contracts WHERE id=?`,contractId);if(!old)throw new Error("Không tìm thấy hợp đồng.");await env.DB.prepare(`DELETE FROM labor_contracts WHERE id=?`).bind(contractId).run();await audit(user.id,"DELETE","labor_contract",contractId,old,null,request);return {message:"Đã xóa hợp đồng lao động."};
    }
    if (action === "save_correspondence") {
        const corrId=clean(payload.corrId),docNo=clean(payload.docNo),direction=clean(payload.direction),docType=clean(payload.docType),issueDate=clean(payload.issueDate)||null,senderName=clean(payload.senderName)||null,receiverName=clean(payload.receiverName)||null,summary=clean(payload.summary)||null,internalHandler=clean(payload.internalHandler)||null,resultNote=clean(payload.resultNote)||null;
        if(!["IN","OUT"].includes(direction)||!docType)throw new Error("Công văn cần hướng đến/đi và loại văn bản.");if(!docNo)throw new Error("Số công văn là bắt buộc.");
        if(corrId){const old=await first(`SELECT * FROM official_correspondence WHERE id=?`,corrId);if(!old)throw new Error("Không tìm thấy công văn.");await env.DB.prepare(`UPDATE official_correspondence SET doc_no=?,direction=?,doc_type=?,issue_date=?,sender_name=?,receiver_name=?,summary=?,internal_handler=?,result_note=?,updated_at=? WHERE id=?`).bind(docNo,direction,docType,issueDate,senderName,receiverName,summary,internalHandler,resultNote,stamp,corrId).run();await audit(user.id,"UPDATE","correspondence",corrId,old,{docNo,direction},request);return {message:"Đã cập nhật công văn."};}
        const dup=await first(`SELECT id FROM official_correspondence WHERE doc_no=?`,docNo);if(dup)throw new Error("Số công văn đã tồn tại.");const newId=id("COR");await env.DB.prepare(`INSERT INTO official_correspondence(id,doc_no,direction,doc_type,issue_date,sender_name,receiver_name,summary,internal_handler,status,result_note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,docNo,direction,docType,issueDate,senderName,receiverName,summary,internalHandler,"received",resultNote,user.id,stamp,stamp).run();await audit(user.id,"CREATE","correspondence",newId,null,{docNo,direction},request);return {message:"Đã ghi nhận công văn "+(direction==="IN"?"đến":"đi")+"."};
    }
    if (action === "set_correspondence_status") {
        const corrId=clean(payload.corrId),status=clean(payload.status),resultNote=clean(payload.resultNote)||null;const old=await first(`SELECT * FROM official_correspondence WHERE id=?`,corrId);if(!old)throw new Error("Không tìm thấy công văn.");await env.DB.prepare(`UPDATE official_correspondence SET status=?,result_note=COALESCE(?,result_note),updated_at=? WHERE id=?`).bind(status,resultNote,stamp,corrId).run();await audit(user.id,"STATUS","correspondence",corrId,old,{status},request);return {message:"Đã cập nhật trạng thái công văn."};
    }
    if (action === "delete_correspondence") {
        const corrId=clean(payload.corrId),old=await first(`SELECT * FROM official_correspondence WHERE id=?`,corrId);if(!old)throw new Error("Không tìm thấy công văn.");await env.DB.prepare(`DELETE FROM official_correspondence WHERE id=?`).bind(corrId).run();await audit(user.id,"DELETE","correspondence",corrId,old,null,request);return {message:"Đã xóa công văn."};
    }
    if (action === "save_legal_document") {
        const docId=clean(payload.docId),docNo=clean(payload.docNo),docType=clean(payload.docType),title=clean(payload.title),issueDate=clean(payload.issueDate)||null,issuer=clean(payload.issuer)||null,effectiveDate=clean(payload.effectiveDate)||null,expiryDate=clean(payload.expiryDate)||null,scope=clean(payload.scope)||null,attachmentId=clean(payload.attachmentId)||null;
        if(!docNo||!docType||!title)throw new Error("Văn bản pháp lý cần số, loại và tiêu đề.");
        if(docId){const old=await first(`SELECT * FROM legal_documents WHERE id=?`,docId);if(!old)throw new Error("Không tìm thấy văn bản.");await env.DB.prepare(`UPDATE legal_documents SET doc_no=?,doc_type=?,title=?,issue_date=?,issuer=?,effective_date=?,expiry_date=?,scope=?,attachment_id=?,updated_at=? WHERE id=?`).bind(docNo,docType,title,issueDate,issuer,effectiveDate,expiryDate,scope,attachmentId,stamp,docId).run();await audit(user.id,"UPDATE","legal_document",docId,old,{docNo},request);return {message:"Đã cập nhật văn bản pháp lý."};}
        const dup=await first(`SELECT id FROM legal_documents WHERE doc_no=?`,docNo);if(dup)throw new Error("Số văn bản đã tồn tại.");const newId=id("LGD");await env.DB.prepare(`INSERT INTO legal_documents(id,doc_no,doc_type,title,issue_date,issuer,effective_date,expiry_date,scope,attachment_id,status,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,docNo,docType,title,issueDate,issuer,effectiveDate,expiryDate,scope,attachmentId,"active",user.id,stamp,stamp).run();await audit(user.id,"CREATE","legal_document",newId,null,{docNo},request);return {message:"Đã lưu văn bản pháp lý."};
    }
    if (action === "set_legal_document_status") {
        const docId=clean(payload.docId),status=clean(payload.status);const old=await first(`SELECT * FROM legal_documents WHERE id=?`,docId);if(!old)throw new Error("Không tìm thấy văn bản.");await env.DB.prepare(`UPDATE legal_documents SET status=?,updated_at=? WHERE id=?`).bind(status,stamp,docId).run();await audit(user.id,"STATUS","legal_document",docId,old,{status},request);return {message:"Đã cập nhật trạng thái văn bản pháp lý."};
    }
    if (action === "delete_legal_document") {
        const docId=clean(payload.docId),old=await first(`SELECT * FROM legal_documents WHERE id=?`,docId);if(!old)throw new Error("Không tìm thấy văn bản.");await env.DB.prepare(`DELETE FROM legal_documents WHERE id=?`).bind(docId).run();await audit(user.id,"DELETE","legal_document",docId,old,null,request);return {message:"Đã xóa văn bản pháp lý."};
    }
    if (action === "save_seal") {
        const sealId=clean(payload.sealId),sealNo=clean(payload.sealNo),sealName=clean(payload.sealName),sealType=clean(payload.sealType),custodian=clean(payload.custodian)||null,registeredDate=clean(payload.registeredDate)||null,usageNote=clean(payload.usageNote)||null;
        if(!sealNo||!sealName||!sealType)throw new Error("Con dấu cần số hiệu, tên và loại.");if(sealId){const old=await first(`SELECT * FROM seal_management WHERE id=?`,sealId);if(!old)throw new Error("Không tìm thấy con dấu.");await env.DB.prepare(`UPDATE seal_management SET seal_no=?,seal_name=?,seal_type=?,custodian=?,registered_date=?,usage_note=?,updated_at=? WHERE id=?`).bind(sealNo,sealName,sealType,custodian,registeredDate,usageNote,stamp,sealId).run();await audit(user.id,"UPDATE","seal",sealId,old,{sealNo},request);return {message:"Đã cập nhật con dấu."};}
        const dup=await first(`SELECT id FROM seal_management WHERE seal_no=?`,sealNo);if(dup)throw new Error("Số hiệu con dấu đã tồn tại.");const newId=id("SEL");await env.DB.prepare(`INSERT INTO seal_management(id,seal_no,seal_name,seal_type,custodian,registered_date,status,usage_note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,sealNo,sealName,sealType,custodian,registeredDate,"active",usageNote,user.id,stamp,stamp).run();await audit(user.id,"CREATE","seal",newId,null,{sealNo},request);return {message:"Đã đăng ký con dấu."};
    }
    if (action === "set_seal_status") {
        const sealId=clean(payload.sealId),status=clean(payload.status);const old=await first(`SELECT * FROM seal_management WHERE id=?`,sealId);if(!old)throw new Error("Không tìm thấy con dấu.");await env.DB.prepare(`UPDATE seal_management SET status=?,updated_at=? WHERE id=?`).bind(status,stamp,sealId).run();await audit(user.id,"STATUS","seal",sealId,old,{status},request);return {message:"Đã cập nhật trạng thái con dấu."};
    }
    if (action === "delete_seal") {
        const sealId=clean(payload.sealId),old=await first(`SELECT * FROM seal_management WHERE id=?`,sealId);if(!old)throw new Error("Không tìm thấy con dấu.");await env.DB.prepare(`DELETE FROM seal_management WHERE id=?`).bind(sealId).run();await audit(user.id,"DELETE","seal",sealId,old,null,request);return {message:"Đã xóa đăng ký con dấu."};
    }
    if (action === "save_benefit_record") {
        const benefitId=clean(payload.benefitId),userId=clean(payload.userId),benefitType=clean(payload.benefitType),provider=clean(payload.provider)||null,startDate=clean(payload.startDate)||null,endDate=clean(payload.endDate)||null,monthlyAmount=strictNonNegativeNumber(payload.monthlyAmount ?? 0,"Mức đóng hàng tháng"),note=clean(payload.note)||null;
        if(!userId||!benefitType)throw new Error("Bảo hiểm & chế độ cần nhân sự và loại.");const target=await first(`SELECT id FROM users WHERE id=?`,userId);if(!target)throw new Error("Nhân sự không tồn tại.");
        if(benefitId){const old=await first(`SELECT * FROM benefit_records WHERE id=?`,benefitId);if(!old)throw new Error("Không tìm thấy bản ghi.");await env.DB.prepare(`UPDATE benefit_records SET user_id=?,benefit_type=?,provider=?,start_date=?,end_date=?,monthly_amount=?,note=?,updated_at=? WHERE id=?`).bind(userId,benefitType,provider,startDate,endDate,monthlyAmount,note,stamp,benefitId).run();await audit(user.id,"UPDATE","benefit_record",benefitId,old,{userId,benefitType},request);return {message:"Đã cập nhật bảo hiểm & chế độ."};}
        const newId=id("BEN"),seq=await first(`SELECT COUNT(*)+1 AS n FROM benefit_records`);const benefitNo=`BH-${String(numberValue(seq?.n)||1).padStart(5,"0")}`;await env.DB.prepare(`INSERT INTO benefit_records(id,benefit_no,user_id,benefit_type,provider,start_date,end_date,monthly_amount,status,note,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,benefitNo,userId,benefitType,provider,startDate,endDate,monthlyAmount,"active",note,user.id,stamp,stamp).run();await audit(user.id,"CREATE","benefit_record",newId,null,{userId,benefitType},request);return {message:"Đã theo dõi bảo hiểm & chế độ."};
    }
    if (action === "set_benefit_record_status") {
        const benefitId=clean(payload.benefitId),status=clean(payload.status);const old=await first(`SELECT * FROM benefit_records WHERE id=?`,benefitId);if(!old)throw new Error("Không tìm thấy bản ghi.");await env.DB.prepare(`UPDATE benefit_records SET status=?,updated_at=? WHERE id=?`).bind(status,stamp,benefitId).run();await audit(user.id,"STATUS","benefit_record",benefitId,old,{status},request);return {message:"Đã cập nhật trạng thái."};
    }
    if (action === "delete_benefit_record") {
        const benefitId=clean(payload.benefitId),old=await first(`SELECT * FROM benefit_records WHERE id=?`,benefitId);if(!old)throw new Error("Không tìm thấy bản ghi.");await env.DB.prepare(`DELETE FROM benefit_records WHERE id=?`).bind(benefitId).run();await audit(user.id,"DELETE","benefit_record",benefitId,old,null,request);return {message:"Đã xóa bản ghi bảo hiểm & chế độ."};
    }
    if (action === "save_role_catalog") {
        requireRole(user, ["admin"]);
        const roleId = clean(payload.roleId);
        const requestedCode = clean(payload.code).toLowerCase();
        const name = clean(payload.name);
        const description = clean(payload.description);
        const businessGroupId=clean(payload.businessGroupId);const group=await first(`SELECT id,engine_role AS engineRole FROM business_role_group_catalog WHERE id=? AND active=1`,businessGroupId);if(requestedCode!=="admin"&&!group)throw new Error("Nhóm quyền nghiệp vụ không tồn tại hoặc đang bị ẩn.");const baseRole=clean(group?.engineRole)||"engineer";const defaultOrganizationUnitId=clean(payload.defaultOrganizationUnitId)||null;if(requestedCode!=="admin"&&!defaultOrganizationUnitId)throw new Error("Chức danh phải gắn Phòng/Bộ phận mặc định để đồng bộ import và phân quyền.");if(defaultOrganizationUnitId&&!(await first(`SELECT id FROM organization_units WHERE id=? AND active=1 AND archived_at IS NULL`,defaultOrganizationUnitId)))throw new Error("Phòng/Bộ phận mặc định không tồn tại hoặc đang bị ẩn.");
        const sortOrder = Math.trunc(numberValue(payload.sortOrder));
        if (!name)
            throw new Error("Tên vai trò là bắt buộc.");
        const roleNames = await all(`SELECT id,code,name FROM role_catalog WHERE id<>COALESCE(?, '')`, roleId || "");
        const duplicateName = roleNames.find((row) => organizationLookupKey(row.name) === organizationLookupKey(name));
        if(duplicateName) throw new Error(`Chức danh “${name}” đã tồn tại với mã ${duplicateName.code}. Không được tạo chức danh trùng tên.`);
        const allowedBases = ["engineer", "commander", "project", "procurement", "accountant", "warehouse", "team", "director"];
        if (!allowedBases.includes(baseRole) && requestedCode !== "admin")
            throw new Error("Nhóm quyền nghiệp vụ kế thừa chưa hợp lệ.");
        if (roleId) {
            const before = await first(`SELECT * FROM role_catalog WHERE id=?`, roleId);
            if (!before)
                throw new Error("Không tìm thấy vai trò.");
            const oldCode=clean(before.code),finalCode=oldCode==="admin"?"admin":requestedCode||oldCode;if(!/^[a-z0-9_-]{2,32}$/.test(finalCode))throw new Error("Mã vai trò gồm 2–32 ký tự a-z, số, gạch dưới hoặc gạch ngang.");if(await first(`SELECT id FROM role_catalog WHERE code=? AND id<>?`,finalCode,roleId))throw new Error("Mã vai trò đã được sử dụng. Hãy nhập mã khác.");
            const finalBase=finalCode==="admin"?"admin":baseRole;const finalGroupId=finalCode==="admin"?clean(before.business_group_id):businessGroupId;const finalOrganizationId=finalCode==="admin"?clean(before.default_organization_unit_id)||null:defaultOrganizationUnitId;const statements=[env.DB.prepare(`UPDATE role_catalog SET code=?,name=?,description=?,base_role=?,business_group_id=?,default_organization_unit_id=?,sort_order=?,updated_at=? WHERE id=?`).bind(finalCode,name,description||null,finalBase,finalGroupId||null,finalOrganizationId,sortOrder,stamp,roleId)];if(finalCode!==oldCode){statements.push(env.DB.prepare(`UPDATE users SET role=?,updated_at=? WHERE role=?`).bind(finalCode,stamp,oldCode));const stageRows=await all(`SELECT id,allowed_role_codes AS allowedRoleCodes FROM approval_stage_catalog WHERE ','||allowed_role_codes||',' LIKE ?`,`%,${oldCode},%`);for(const stage of stageRows){const codes=clean(stage.allowedRoleCodes).split(",").map(item=>item.trim()).filter(Boolean).map(item=>item===oldCode?finalCode:item);statements.push(env.DB.prepare(`UPDATE approval_stage_catalog SET allowed_role_codes=?,updated_at=? WHERE id=?`).bind([...new Set(codes)].join(","),stamp,stage.id));}}await env.DB.batch(statements);
            await audit(user.id, "UPDATE", "role_catalog", roleId, before, { code: finalCode, name, baseRole: finalBase, businessGroupId:finalGroupId, defaultOrganizationUnitId:finalOrganizationId, sortOrder }, request);
            return { message: `Đã cập nhật vai trò ${finalCode} · ${name}${finalCode!==oldCode?" và tự chuyển mã trong tài khoản/luồng duyệt":""}.` };
        }
        const code=requestedCode;if(!/^[a-z0-9_-]{2,32}$/.test(code))throw new Error("Mã vai trò gồm 2–32 ký tự a-z, số, gạch dưới hoặc gạch ngang.");if(await first(`SELECT id FROM role_catalog WHERE code=?`,code))throw new Error("Mã vai trò đã được sử dụng. Hãy nhập mã khác.");
        const newId = id("ROLE");
        await env.DB.prepare(`INSERT INTO role_catalog (id,code,name,description,base_role,business_group_id,default_organization_unit_id,active,sort_order,system_locked,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId,code,name,description||null,baseRole,businessGroupId||null,defaultOrganizationUnitId,1,sortOrder,0,stamp,stamp).run();
        await audit(user.id, "CREATE", "role_catalog", newId, null, { code, name, baseRole, businessGroupId, defaultOrganizationUnitId, sortOrder }, request);
        return { message: `Đã thêm vai trò ${name}.` };
    }
    if (action === "set_role_status") {
        requireRole(user, ["admin"]);
        const roleId = clean(payload.roleId);
        const active = payload.active === true || clean(payload.active) === "1";
        const role = await first(`SELECT id,code,name,system_locked AS systemLocked FROM role_catalog WHERE id=?`, roleId);
        if (!role)
            throw new Error("Không tìm thấy vai trò.");
        if (clean(role.code) === "admin" && !active)
            throw new Error("Không được vô hiệu hóa vai trò Quản trị hệ thống.");
        await env.DB.prepare(`UPDATE role_catalog SET active=?,updated_at=? WHERE id=?`).bind(active ? 1 : 0, stamp, roleId).run();
        await audit(user.id, "STATUS", "role_catalog", roleId, role, { active }, request);
        return { message: active ? "Đã kích hoạt vai trò." : "Đã ẩn vai trò khỏi danh sách tạo tài khoản; người dùng cũ vẫn giữ dữ liệu lịch sử." };
    }
    if (action === "delete_role_catalog") {
        requireRole(user, ["admin"]);
        const roleId = clean(payload.roleId);
        const role = await first(`SELECT id,code,name,system_locked AS systemLocked FROM role_catalog WHERE id=?`, roleId);
        if (!role)
            throw new Error("Không tìm thấy vai trò.");
        if (Number(role.systemLocked || 0) === 1)
            throw new Error("Vai trò hệ thống gốc không được xóa; có thể đổi tên hoặc ẩn (trừ Quản trị hệ thống).");
        const used = await first(`SELECT COUNT(*) AS count FROM users WHERE role=?`, role.code);
        if (Number(used?.count || 0) > 0)
            throw new Error("Vai trò đang được gán cho tài khoản nên chưa thể xóa. Hãy chuyển người dùng sang vai trò khác trước.");
        const stageUsed = await first(`SELECT COUNT(*) AS count FROM approval_stage_catalog WHERE ','||allowed_role_codes||',' LIKE ?`, `%,${role.code},%`);
        if (Number(stageUsed?.count || 0) > 0)
            throw new Error("Vai trò đang được dùng trong luồng phê duyệt. Hãy bỏ vai trò khỏi các bước duyệt trước.");
        await env.DB.prepare(`DELETE FROM role_catalog WHERE id=?`).bind(roleId).run();
        await audit(user.id, "DELETE", "role_catalog", roleId, role, null, request);
        return { message: "Đã xóa vai trò tùy chỉnh." };
    }
    if (action === "save_approval_stage") {
        requireRole(user, ["admin"]);
        const stageId = clean(payload.stageId);
        const name = clean(payload.name);
        const description = clean(payload.description);
        const stageNo = Math.max(1, Math.trunc(numberValue(payload.stageNo)));
        const sortOrder = Math.trunc(numberValue(payload.sortOrder) || stageNo * 10);
        const slaHours = Math.max(1, Math.trunc(numberValue(payload.slaHours) || 8));
        const rawRoles = Array.isArray(payload.allowedRoleCodes) ? payload.allowedRoleCodes.map(String) : clean(payload.allowedRoleCodes).split(",");
        const allowedRoles = [...new Set(rawRoles.map((item) => item.trim()).filter(Boolean))];
        if (!name || !allowedRoles.length)
            throw new Error("Bước phê duyệt phải có tên và ít nhất một vai trò được phép duyệt.");
        const validRoles = await all(`SELECT code FROM role_catalog WHERE active=1`);
        const validSet = new Set(validRoles.map((row) => row.code));
        for (const roleCode of allowedRoles)
            if (!validSet.has(roleCode))
                throw new Error(`Vai trò ${roleCode} không tồn tại hoặc đang bị ẩn.`);
        const approvalMode = clean(payload.approvalMode) === "all_roles" ? "all_roles" : "single";
        const autoApprove = payload.autoApproveOnSubmit === true || ["1", "true", "on"].includes(clean(payload.autoApproveOnSubmit).toLowerCase());
        if (autoApprove) {
            const earlier = await first(`SELECT COUNT(*) AS count FROM approval_stage_catalog WHERE active=1 AND id<>? AND stage_no<?`, stageId || "__NEW__", stageNo);
            if (Number(earlier?.count || 0) > 0)
                throw new Error("Tự xác nhận khi gửi phiếu chỉ được đặt cho bước đầu tiên của luồng. Hãy đưa bước này lên đầu hoặc bỏ tùy chọn tự xác nhận.");
        }
        if (stageId) {
            const before = await first(`SELECT * FROM approval_stage_catalog WHERE id=?`, stageId);
            if (!before)
                throw new Error("Không tìm thấy bước phê duyệt.");
            if (Number(before.stage_no) !== stageNo) {
                const history = await first(`SELECT COUNT(*) AS count FROM approvals WHERE stage=?`, before.stage_no);
                if (Number(history?.count || 0) > 0)
                    throw new Error("Bước đã có lịch sử phê duyệt nên không thể đổi số bước. Có thể đổi tên, vai trò, SLA hoặc thứ tự hiển thị.");
            }
            if (autoApprove)
                await env.DB.prepare(`UPDATE approval_stage_catalog SET auto_approve_on_submit=0,updated_at=? WHERE id<>?`).bind(stamp, stageId).run();
            await env.DB.prepare(`UPDATE approval_stage_catalog SET stage_no=?,name=?,description=?,allowed_role_codes=?,approval_mode=?,sla_hours=?,auto_approve_on_submit=?,sort_order=?,updated_at=? WHERE id=?`).bind(stageNo, name, description || null, allowedRoles.join(","), approvalMode, slaHours, autoApprove ? 1 : 0, sortOrder, stamp, stageId).run();
            await env.DB.prepare(`UPDATE approvals SET department=?,updated_at=? WHERE stage=? AND status='pending' AND decided_at IS NULL`).bind(name, stamp, stageNo).run();
            await audit(user.id, "UPDATE", "approval_stage_catalog", stageId, before, { stageNo, name, allowedRoles, slaHours, autoApprove, sortOrder }, request);
            return { message: `Đã cập nhật bước phê duyệt ${name}.` };
        }
        if (autoApprove)
            await env.DB.prepare(`UPDATE approval_stage_catalog SET auto_approve_on_submit=0,updated_at=?`).bind(stamp).run();
        const newId = id("ASTAGE");
        await env.DB.prepare(`INSERT INTO approval_stage_catalog (id,stage_no,name,description,allowed_role_codes,approval_mode,sla_hours,auto_approve_on_submit,active,sort_order,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(newId, stageNo, name, description || null, allowedRoles.join(","), approvalMode, slaHours, autoApprove ? 1 : 0, 1, sortOrder, stamp, stamp).run();
        await audit(user.id, "CREATE", "approval_stage_catalog", newId, null, { stageNo, name, allowedRoles, slaHours, autoApprove, sortOrder }, request);
        return { message: `Đã thêm bước phê duyệt ${name}. Phiếu mới sẽ áp dụng luồng mới; phiếu cũ giữ nguyên luồng đã tạo.` };
    }
    if (action === "set_approval_stage_status") {
        requireRole(user, ["admin"]);
        const stageId = clean(payload.stageId);
        const active = payload.active === true || clean(payload.active) === "1";
        const stage = await first(`SELECT id,stage_no AS stageNo,name FROM approval_stage_catalog WHERE id=?`, stageId);
        if (!stage)
            throw new Error("Không tìm thấy bước phê duyệt.");
        if (!active) {
            const pending = await first(`SELECT COUNT(*) AS count FROM approvals a JOIN material_requests mr ON mr.id=a.request_id WHERE a.stage=? AND a.status='pending' AND mr.status='pending_approval' AND mr.approval_stage=a.stage`, stage.stageNo);
            if (Number(pending?.count || 0) > 0)
                throw new Error("Bước này đang có hồ sơ chờ xử lý. Hãy xử lý hết hồ sơ hoặc giữ bước hoạt động; phiếu đang chạy không được cắt ngang.");
        }
        await env.DB.prepare(`UPDATE approval_stage_catalog SET active=?,updated_at=? WHERE id=?`).bind(active ? 1 : 0, stamp, stageId).run();
        const activeCount = await first(`SELECT COUNT(*) AS count FROM approval_stage_catalog WHERE active=1`);
        if (Number(activeCount?.count || 0) === 0) {
            await env.DB.prepare(`UPDATE approval_stage_catalog SET active=1,updated_at=? WHERE id=?`).bind(stamp, stageId).run();
            throw new Error("Hệ thống phải có ít nhất một bước phê duyệt đang hoạt động.");
        }
        await audit(user.id, "STATUS", "approval_stage_catalog", stageId, stage, { active }, request);
        return { message: active ? "Đã kích hoạt bước phê duyệt cho các phiếu mới." : "Đã ẩn bước khỏi luồng của các phiếu mới; lịch sử phiếu cũ vẫn giữ nguyên." };
    }
    if (action === "delete_approval_stage") {
        requireRole(user, ["admin"]);
        const stageId = clean(payload.stageId);
        const stage = await first(`SELECT id,stage_no AS stageNo,name FROM approval_stage_catalog WHERE id=?`, stageId);
        if (!stage)
            throw new Error("Không tìm thấy bước phê duyệt.");
        const history = await first(`SELECT COUNT(*) AS count FROM approvals WHERE stage=?`, stage.stageNo);
        if (Number(history?.count || 0) > 0)
            throw new Error("Bước đã có lịch sử hồ sơ nên không được xóa. Hãy dùng Ẩn để ngừng áp dụng cho phiếu mới.");
        const activeCount = await first(`SELECT COUNT(*) AS count FROM approval_stage_catalog WHERE active=1`);
        if (Number(activeCount?.count || 0) <= 1)
            throw new Error("Không thể xóa bước hoạt động cuối cùng.");
        await env.DB.prepare(`DELETE FROM approval_stage_catalog WHERE id=?`).bind(stageId).run();
        await audit(user.id, "DELETE", "approval_stage_catalog", stageId, stage, null, request);
        return { message: "Đã xóa bước phê duyệt chưa từng sử dụng." };
    }

    if (action === "bulk_import_projects") {
        requireRole(user, ["admin"]);
        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        if (!rows.length) throw new Error("File không có dự án để nhập.");
        if (rows.length > 300) throw new Error("Mỗi lần import tối đa 300 dự án.");
        const normalized = rows.map((input, index) => {
            const rowNo = Number(input.rowNo) || index + 1;
            const code = clean(input.code).toUpperCase();
            const name = clean(input.name);
            const startDate = normalizeVietnamDate(input.startDate);
            const plannedEndDate = normalizeVietnamDate(input.plannedEndDate);
            const statusInput = clean(input.status || "ACTIVE").toUpperCase();
            if (!code) throw new Error(`Dòng ${rowNo} · Cột “Mã dự án”: bắt buộc nhập.`);
            if (!/^[A-Z0-9._-]{2,24}$/.test(code)) throw new Error(`Dòng ${rowNo} · Cột “Mã dự án”: chỉ nhận 2–24 ký tự A-Z, số, dấu chấm, gạch dưới hoặc gạch ngang.`);
            if (!name) throw new Error(`Dòng ${rowNo} · Cột “Tên dự án”: bắt buộc nhập.`);
            if (startDate && !validIsoDate(startDate)) throw new Error(`Dòng ${rowNo} · Cột “Ngày bắt đầu”: phải là ngày hợp lệ theo định dạng DD/MM/YYYY.`);
            if (plannedEndDate && !validIsoDate(plannedEndDate)) throw new Error(`Dòng ${rowNo} · Cột “Dự kiến kết thúc”: phải là ngày hợp lệ theo định dạng DD/MM/YYYY.`);
            if (startDate && plannedEndDate && plannedEndDate < startDate) throw new Error(`Dòng ${rowNo} · Cột “Dự kiến kết thúc”: không được trước Ngày bắt đầu.`);
            if (!["ACTIVE", "INACTIVE", "ARCHIVED"].includes(statusInput)) throw new Error(`Dòng ${rowNo} · Cột “Trạng thái”: chỉ nhận ACTIVE, INACTIVE hoặc ARCHIVED.`);
            const warehouseCode = clean(input.warehouseCode).toUpperCase() || `KHO-${code}`;
            if (!/^[A-Z0-9._-]{2,32}$/.test(warehouseCode)) throw new Error(`Dòng ${rowNo} · Cột “Mã kho”: không đúng định dạng.`);
            return {
                ...input,
                rowNo,
                code,
                name,
                startDate,
                plannedEndDate,
                status: statusInput === "ACTIVE" ? "active" : "archived",
                warehouseCode,
                warehouseName: clean(input.warehouseName) || `Kho công trường ${code}`,
                contractNo: clean(input.contractNo) || null,
                contractName: clean(input.contractName) || null,
            };
        });
        const duplicateCode = normalized.find((row, index) => normalized.findIndex((candidate) => candidate.code === row.code) !== index);
        if (duplicateCode) throw new Error(`Dòng ${duplicateCode.rowNo} · Cột “Mã dự án”: trùng mã ${duplicateCode.code} trong cùng file.`);
        const duplicateWarehouse = normalized.find((row, index) => normalized.findIndex((candidate) => candidate.warehouseCode === row.warehouseCode) !== index);
        if (duplicateWarehouse) throw new Error(`Dòng ${duplicateWarehouse.rowNo} · Cột “Mã kho”: trùng mã ${duplicateWarehouse.warehouseCode} trong cùng file.`);

        // Preflight toàn bộ file trước khi ghi để một dòng sai không tạo bản import dở dang.
        const prepared = [];
        for (const row of normalized) {
            const existing = await first(`SELECT id,code,name,status FROM projects WHERE upper(code)=upper(?)`, row.code);
            const currentWarehouse = existing ? await first(`SELECT id,code,name FROM warehouses WHERE project_id=? AND type='site' ORDER BY created_at LIMIT 1`, existing.id) : null;
            const warehouseOwner = await first(`SELECT id,project_id AS projectId FROM warehouses WHERE upper(code)=upper(?)`, row.warehouseCode);
            if (warehouseOwner && (!currentWarehouse || String(warehouseOwner.id) !== String(currentWarehouse.id))) {
                throw new Error(`Dòng ${row.rowNo} · Cột “Mã kho”: ${row.warehouseCode} đã thuộc kho/dự án khác.`);
            }
            prepared.push({ row, existing, currentWarehouse });
        }

        let created = 0;
        let updated = 0;
        for (const item of prepared) {
            const { row, existing, currentWarehouse } = item;
            const warehouseActive = row.status === "active" ? 1 : 0;
            if (existing) {
                const statements = [env.DB.prepare(`UPDATE projects SET name=?,status=?,contract_no=?,contract_name=?,start_date=?,planned_end_date=?,updated_at=? WHERE id=?`).bind(row.name, row.status, row.contractNo, row.contractName, row.startDate || null, row.plannedEndDate || null, stamp, existing.id)];
                if (currentWarehouse?.id) statements.push(env.DB.prepare(`UPDATE warehouses SET code=?,name=?,active=?,updated_at=? WHERE id=?`).bind(row.warehouseCode, row.warehouseName, warehouseActive, stamp, currentWarehouse.id));
                else statements.push(env.DB.prepare(`INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id("WH"), row.warehouseCode, row.warehouseName, "site", existing.id, "WH-CENTRAL", user.id, warehouseActive, stamp, stamp));
                await env.DB.batch(statements);
                await audit(user.id, "BULK_UPDATE", "project", existing.id, existing, { code: row.code, name: row.name, status: row.status, sourceRow: row.rowNo, sourceFileName: clean(payload.sourceFileName) }, request);
                updated += 1;
            } else {
                const projectId = id("PRJ");
                const warehouseId = id("WH");
                await env.DB.batch([
                    env.DB.prepare(`INSERT INTO projects (id,code,name,status,manager_user_id,start_date,planned_end_date,contract_no,contract_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(projectId, row.code, row.name, row.status, user.id, row.startDate || null, row.plannedEndDate || null, row.contractNo, row.contractName, stamp, stamp),
                    env.DB.prepare(`INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(warehouseId, row.warehouseCode, row.warehouseName, "site", projectId, "WH-CENTRAL", user.id, warehouseActive, stamp, stamp),
                    env.DB.prepare(`INSERT OR IGNORE INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).bind(id("SCOPE"), user.id, projectId, "admin", stamp, stamp),
                ]);
                await audit(user.id, "BULK_CREATE", "project", projectId, null, { code: row.code, name: row.name, status: row.status, sourceRow: row.rowNo, sourceFileName: clean(payload.sourceFileName) }, request);
                created += 1;
            }
        }
        return {message:`Import dự án hoàn tất: tạo mới ${created}, cập nhật ${updated}.`};
    }
    if (action === "create_project") {
        requireRole(user, ["admin"]);
        const code = clean(payload.code).toUpperCase();
        const name = clean(payload.name);
        if (!/^[A-Z0-9._-]{2,24}$/.test(code) || !name)
            throw new Error("Mã dự án gồm 2–24 ký tự A-Z, số, dấu chấm/gạch; tên dự án là bắt buộc.");
        const projectId = id("PRJ");
        const warehouseId = id("WH");
        const warehouseCode = clean(payload.warehouseCode).toUpperCase() || `KHO-${code}`;
        const warehouseName = clean(payload.warehouseName) || `Kho công trường ${code}`;
        await env.DB.batch([
            env.DB.prepare(`INSERT INTO projects (id,code,name,status,manager_user_id,start_date,planned_end_date,contract_no,contract_name,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(projectId, code, name, "active", user.id, clean(payload.startDate) || null, clean(payload.plannedEndDate) || null, clean(payload.contractNo) || null, clean(payload.contractName) || null, stamp, stamp),
            env.DB.prepare(`INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(warehouseId, warehouseCode, warehouseName, "site", projectId, "WH-CENTRAL", user.id, 1, stamp, stamp),
            env.DB.prepare(`INSERT OR IGNORE INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).bind(id("SCOPE"), user.id, projectId, "admin", stamp, stamp),
        ]);
        await audit(user.id, "CREATE", "project", projectId, null, { code, name, warehouseCode, warehouseName }, request);
        return { message: `Đã tạo dự án ${code} và kho công trường riêng.` };
    }
    if (action === "update_project") {
        requireRole(user, ["admin"]);
        const projectId = clean(payload.projectId);
        const code = clean(payload.code).toUpperCase();
        const name = clean(payload.name);
        if (!projectId || !/^[A-Z0-9._-]{2,24}$/.test(code) || !name)
            throw new Error("Thông tin dự án chưa hợp lệ.");
        const before = await first(`SELECT * FROM projects WHERE id=?`, projectId);
        if (!before)
            throw new Error("Không tìm thấy dự án.");
        const currentWarehouse = await first(`SELECT id,code,name FROM warehouses WHERE project_id=? AND type='site' ORDER BY created_at LIMIT 1`, projectId);
        const warehouseCode = clean(payload.warehouseCode).toUpperCase() || clean(currentWarehouse?.code) || `KHO-${code}`;
        const warehouseName = clean(payload.warehouseName) || clean(currentWarehouse?.name) || `Kho công trường ${code}`;
        const statements = [env.DB.prepare(`UPDATE projects SET code=?,name=?,contract_no=?,contract_name=?,start_date=?,planned_end_date=?,updated_at=? WHERE id=?`).bind(code, name, clean(payload.contractNo) || null, clean(payload.contractName) || null, clean(payload.startDate) || null, clean(payload.plannedEndDate) || null, stamp, projectId)];
        if (currentWarehouse?.id)
            statements.push(env.DB.prepare(`UPDATE warehouses SET code=?,name=?,updated_at=? WHERE id=?`).bind(warehouseCode, warehouseName, stamp, currentWarehouse.id));
        else
            statements.push(env.DB.prepare(`INSERT INTO warehouses (id,code,name,type,project_id,parent_warehouse_id,keeper_user_id,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)`).bind(id("WH"), warehouseCode, warehouseName, "site", projectId, "WH-CENTRAL", user.id, 1, stamp, stamp));
        await env.DB.batch(statements);
        await audit(user.id, "UPDATE", "project", projectId, before, { code, name, warehouseCode, warehouseName }, request);
        return { message: `Đã cập nhật dự án ${code} và thông tin kho riêng.` };
    }
    if (action === "set_project_status") {
        requireRole(user, ["admin"]);
        const projectId = clean(payload.projectId);
        const status = clean(payload.status).toLowerCase();
        if (!["active","closing","closed","archived"].includes(status)) throw new Error("Trạng thái dự án không hợp lệ.");
        const before = await first(`SELECT id,code,name,status,updated_at AS updatedAt FROM projects WHERE id=?`, projectId);
        if (!before) throw new Error("Không tìm thấy dự án.");
        if (status === "closed") {
            const checks = [];
            const add = (key, count, detail) => checks.push({key,count:Number(count||0),detail});
            add("OPEN_MR", (await first(`SELECT COUNT(*) AS count FROM material_requests WHERE project_id=? AND COALESCE(supply_status,'') NOT IN ('completed','completed_with_shortage','cancelled','rejected')`, projectId))?.count, "Phiếu đề nghị/chương trình cung ứng chưa kết thúc");
            add("OPEN_PO", (await first(`SELECT COUNT(*) AS count FROM purchase_orders WHERE project_id=? AND status NOT IN ('completed','completed_with_shortage','cancelled','closed')`, projectId))?.count, "PO chưa đóng");
            add("OPEN_TRANSFER", (await first(`SELECT COUNT(*) AS count FROM transfer_orders WHERE (source_project_id=? OR destination_project_id=?) AND status NOT IN ('received','cancelled','rejected')`, projectId, projectId))?.count, "Phiếu điều chuyển chưa kết thúc");
            add("OPEN_COUNT", (await first(`SELECT COUNT(*) AS count FROM stock_counts WHERE project_id=? AND status NOT IN ('approved','cancelled')`, projectId))?.count, "Kiểm kê chưa duyệt");
            add("OPEN_CENTRAL_RETURN", (await first(`SELECT COUNT(*) AS count FROM central_returns WHERE source_project_id=? AND status NOT IN ('received','received_with_rejection','cancelled')`, projectId))?.count, "Hoàn trả Kho Tổng chưa kết thúc");
            add("OPEN_RESERVATION", (await first(`SELECT COUNT(*) AS count FROM stock_reservations WHERE project_id=? AND status='active' AND quantity>0.000001`, projectId))?.count, "Vẫn còn giữ chỗ tồn kho cho nhu cầu chưa kết thúc");
            add("OPEN_TEAM_SUBCONTRACT", (await first(`SELECT COUNT(*) AS count FROM team_subcontracts WHERE project_id=? AND status NOT IN ('settled','cancelled')`, projectId))?.count, "Hợp đồng giao khoán tổ đội chưa quyết toán");
            const balance = await first(`WITH m AS (SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE to_warehouse_id IS NOT NULL UNION ALL SELECT material_id,from_warehouse_id AS warehouse_id,-quantity AS qty FROM stock_movements WHERE from_warehouse_id IS NOT NULL) SELECT COUNT(*) AS count FROM (SELECT m.material_id,m.warehouse_id,SUM(m.qty) AS balance FROM m JOIN warehouses w ON w.id=m.warehouse_id WHERE w.project_id=? AND w.type='site' GROUP BY m.material_id,m.warehouse_id HAVING ABS(SUM(m.qty))>0.000001) x`, projectId);
            add("SITE_STOCK", balance?.count, "Kho dự án vẫn còn tồn cần quyết toán/điều chuyển");
            const teamBalance = await first(`WITH m AS (SELECT material_id,to_warehouse_id AS warehouse_id,quantity AS qty FROM stock_movements WHERE to_warehouse_id IS NOT NULL UNION ALL SELECT material_id,from_warehouse_id AS warehouse_id,-quantity AS qty FROM stock_movements WHERE from_warehouse_id IS NOT NULL) SELECT COUNT(*) AS count FROM (SELECT m.material_id,m.warehouse_id,SUM(m.qty) AS balance FROM m JOIN teams t ON t.warehouse_id=m.warehouse_id WHERE t.project_id=? GROUP BY m.material_id,m.warehouse_id HAVING ABS(SUM(m.qty))>0.000001) x`, projectId);
            add("TEAM_STOCK", teamBalance?.count, "Tổ đội vẫn còn vật tư chưa hoàn trả/xác nhận lắp đặt");
            const contractResidual=await first(`SELECT COUNT(*) AS count FROM (SELECT contract_id,warehouse_id,material_id,SUM(quantity_delta) AS balance FROM contract_stock_ledger WHERE project_id=? GROUP BY contract_id,warehouse_id,material_id HAVING ABS(SUM(quantity_delta))>0.000001) x`,projectId);
            add("CONTRACT_STOCK",contractResidual?.count,"Tồn kế toán theo Contract vẫn còn số dư cần đối chiếu/điều chuyển");
            const reconciliationGap=await first(`SELECT COUNT(*) AS count FROM contract_stock_reconciliations WHERE project_id=? AND status<>'balanced' AND checked_at=(SELECT MAX(r2.checked_at) FROM contract_stock_reconciliations r2 WHERE r2.project_id=contract_stock_reconciliations.project_id AND r2.warehouse_id=contract_stock_reconciliations.warehouse_id AND r2.material_id=contract_stock_reconciliations.material_id)`,projectId);
            add("CONTRACT_RECONCILIATION",reconciliationGap?.count,"Đối chiếu tồn vật lý ↔ tồn Contract còn chênh lệch");
            const failed = checks.filter(x=>x.count>0);
            const statements = checks.map(x=>env.DB.prepare(`INSERT INTO project_close_checks (id,project_id,check_key,status,detail,checked_by,checked_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(project_id,check_key) DO UPDATE SET status=excluded.status,detail=excluded.detail,checked_by=excluded.checked_by,checked_at=excluded.checked_at,updated_at=excluded.updated_at`).bind(id("PCC"),projectId,x.key,x.count>0?"failed":"passed",`${x.detail}: ${x.count}`,user.id,stamp,stamp,stamp));
            if (statements.length) await env.DB.batch(statements);
            if (failed.length) throw new Error(`Chưa thể đóng dự án: ${failed.map(x=>`${x.detail} (${x.count})`).join("; ")}. Hãy xử lý quyết toán kho trước.`);
            const archive=await first(`SELECT id,file_name AS fileName,sha256,generated_at AS generatedAt FROM project_archives WHERE project_id=? AND status='verified' AND generated_at>=? ORDER BY generated_at DESC LIMIT 1`,projectId,clean(before.updatedAt)||"0000");
            if(!archive)throw new Error("Trước khi Đóng dự án bắt buộc bấm ‘TẢI TOÀN BỘ DỮ LIỆU DỰ ÁN / LƯU TRỮ OFFLINE’ và tải gói archive đã kiểm tra PASS.");
        }
        await env.DB.prepare(`UPDATE projects SET status=?,updated_at=? WHERE id=?`).bind(status, stamp, projectId).run();
        if (status === "closed") await env.DB.prepare(`UPDATE warehouses SET active=0,updated_at=? WHERE project_id=? AND type='site'`).bind(stamp,projectId).run();
        if (status === "active") await env.DB.prepare(`UPDATE warehouses SET active=1,updated_at=? WHERE project_id=? AND type='site'`).bind(stamp,projectId).run();
        await audit(user.id, "STATUS", "project", projectId, before, { status }, request);
        const messages={active:"Đã kích hoạt lại dự án.",closing:"Dự án chuyển sang CLOSING để thực hiện quyết toán kho.",closed:"Đã đóng dự án sau khi toàn bộ kiểm tra kho đạt; kho dự án chuyển read-only.",archived:"Đã ẩn dự án khỏi nghiệp vụ hằng ngày; dữ liệu lịch sử vẫn giữ nguyên."};
        return { message: messages[status] };
    }
    if (action === "delete_project") {
        requireRole(user, ["admin"]);
        const projectId=clean(payload.projectId);
        const project=await first(`SELECT id,code,name,status,updated_at AS updatedAt FROM projects WHERE id=?`,projectId);
        if(!project)throw new Error("Không tìm thấy dự án.");
        if(!["closed","archived"].includes(clean(project.status).toLowerCase()))throw new Error("Chỉ dự án đã Đóng/Lưu trữ mới được Xóa/Purge khỏi hệ thống vận hành.");
        if(clean(payload.confirmCode)!==clean(project.code))throw new Error(`Xác nhận xóa không đúng. Hãy nhập chính xác mã dự án ${project.code}.`);
        const archive=await first(`SELECT id,file_name AS fileName,sha256,generated_at AS generatedAt,status FROM project_archives WHERE project_id=? AND status='verified' ORDER BY generated_at DESC LIMIT 1`,projectId);
        if(!archive)throw new Error("Trước khi Xóa/Purge phải có gói TOÀN BỘ DỮ LIỆU VERIFIED đã tạo trước khi đóng dự án. Không tìm thấy archive VERIFIED hợp lệ.");
        const attachmentRows=await all(`SELECT a.id,a.storage_key AS storageKey FROM attachments a WHERE (a.entity_type='material_request' AND a.entity_id IN (SELECT id FROM material_requests WHERE project_id=?)) OR (a.entity_type='goods_receipt' AND a.entity_id IN (SELECT g.id FROM goods_receipts g JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?)) OR (a.entity_type='central_return' AND a.entity_id IN (SELECT id FROM central_returns WHERE source_project_id=?))`,projectId,projectId,projectId);
        const statements=[
          env.DB.prepare(`UPDATE boq_source_items SET project_boq_item_id=NULL WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`UPDATE project_boq_items SET source_item_id=NULL WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM task_notifications WHERE work_item_id IN (SELECT id FROM work_items WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM work_item_events WHERE work_item_id IN (SELECT id FROM work_items WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM work_items WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM team_payments WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM team_settlements WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM team_production_records WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM team_subcontracts WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM stock_count_items WHERE stock_count_id IN (SELECT id FROM stock_counts WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM stock_counts WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM material_return_items WHERE return_id IN (SELECT id FROM material_returns WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM material_returns WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM stock_issue_items WHERE issue_id IN (SELECT id FROM stock_issues WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM stock_issues WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM stock_reservations WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM contract_stock_reconciliations WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM contract_stock_ledger WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM procurement_allocations WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM stock_movements WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM central_return_items WHERE central_return_id IN (SELECT id FROM central_returns WHERE source_project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM attachments WHERE entity_type='central_return' AND entity_id IN (SELECT id FROM central_returns WHERE source_project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM central_returns WHERE source_project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM supply_workflow_steps WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM goods_receipt_items WHERE receipt_id IN (SELECT g.id FROM goods_receipts g JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM attachments WHERE entity_type='goods_receipt' AND entity_id IN (SELECT g.id FROM goods_receipts g JOIN purchase_orders p ON p.id=g.purchase_order_id WHERE p.project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM goods_receipts WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM purchase_order_items WHERE purchase_order_id IN (SELECT id FROM purchase_orders WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM purchase_orders WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM email_outbox WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM approval_stage_decisions WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM approvals WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM request_comments WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM attachments WHERE entity_type='material_request' AND entity_id IN (SELECT id FROM material_requests WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM material_request_items WHERE request_id IN (SELECT id FROM material_requests WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM material_requests WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM boq_price_import_items WHERE batch_id IN (SELECT id FROM boq_price_import_batches WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM boq_price_import_batches WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM boq_mapping_candidates WHERE run_id IN (SELECT id FROM boq_mapping_runs WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM boq_mapping_audit WHERE run_id IN (SELECT id FROM boq_mapping_runs WHERE project_id=?) OR source_item_id IN (SELECT id FROM boq_source_items WHERE project_id=?)`).bind(projectId,projectId),
          env.DB.prepare(`DELETE FROM boq_mapping_runs WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM boq_material_components WHERE source_item_id IN (SELECT id FROM boq_source_items WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM boq_change_history WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM project_boq_items WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM boq_source_items WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM boq_import_batches WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM boq_versions WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM project_contracts WHERE project_id=? AND id NOT IN (SELECT source_contract_id FROM contract_ownership_transfers UNION SELECT destination_contract_id FROM contract_ownership_transfers)`).bind(projectId),
          env.DB.prepare(`DELETE FROM contract_payments WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM capital_recovery_records WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM production_reports WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM material_mar_approvals WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM project_close_checks WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM approval_email_recipients WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM document_sequences WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`DELETE FROM user_warehouse_scopes WHERE warehouse_id IN (SELECT id FROM warehouses WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM warehouse_locations WHERE warehouse_id IN (SELECT id FROM warehouses WHERE project_id=?)`).bind(projectId),
          env.DB.prepare(`DELETE FROM teams WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`UPDATE warehouses SET active=0,updated_at=? WHERE project_id=?`).bind(stamp,projectId),
          env.DB.prepare(`DELETE FROM user_project_scopes WHERE project_id=?`).bind(projectId),
          env.DB.prepare(`UPDATE organization_units SET active=0,archived_at=?,project_id=NULL,updated_at=? WHERE project_id=?`).bind(stamp,stamp,projectId),
          env.DB.prepare(`UPDATE projects SET status='purged',contract_no=NULL,contract_name=NULL,start_date=NULL,planned_end_date=NULL,updated_at=? WHERE id=?`).bind(stamp,projectId),
          env.DB.prepare(`UPDATE project_archives SET status='purged',purged_at=? WHERE id=?`).bind(stamp,archive.id)
        ];
        await env.DB.batch(statements);
        const objectCleanupFailed=[];for(const row of attachmentRows){try{await env.BUCKET.delete(row.storageKey);}catch{objectCleanupFailed.push(clean(row.storageKey));}}
        const auditId=id("AUD");await env.DB.prepare(`INSERT INTO audit_logs (id,user_id,action,entity_type,entity_id,before_json,after_json,ip_address,occurred_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(auditId,user.id,"PURGE_AFTER_OFFLINE_ARCHIVE","project",projectId,JSON.stringify(project),JSON.stringify({archiveId:archive.id,archiveFile:archive.fileName,archiveSha256:archive.sha256,status:"purged",crossProjectTracePreserved:true,objectCleanupFailed}),requestIp(request),stamp).run();
        await env.DB.prepare(`UPDATE project_archives SET purge_audit_id=? WHERE id=?`).bind(auditId,archive.id).run();
        return { message:`Đã xóa/purge dự án ${project.code} khỏi dữ liệu vận hành sau khi archive VERIFIED. Metadata tối thiểu và liên kết liên dự án được giữ để bảo toàn toàn vẹn tham chiếu.${objectCleanupFailed.length?` Có ${objectCleanupFailed.length} tệp object-storage chưa dọn được; dữ liệu đã có trong archive và lỗi dọn file đã được audit.`:""}`,archiveId:archive.id,archiveSha256:archive.sha256,objectCleanupFailed };
    }
    if (action === "save_material_category") {
        requireRole(user, ["admin"]);
        const categoryId = clean(payload.categoryId);
        const code = clean(payload.code).toUpperCase();
        const name = clean(payload.name);
        if (!code || !name)
            throw new Error("Mã hệ và tên hệ M&E là bắt buộc.");
        let savedId = categoryId;
        if (categoryId) {
            await env.DB.batch([
                env.DB.prepare(`UPDATE material_categories SET code=?,name=?,description=?,sort_order=?,updated_at=? WHERE id=?`).bind(code, name, clean(payload.description) || null, numberValue(payload.sortOrder), stamp, categoryId),
                env.DB.prepare(`UPDATE materials SET system=?,updated_at=? WHERE category_id=?`).bind(name, stamp, categoryId),
            ]);
        }
        else {
            savedId = id("CAT");
            const defaultSubId = id("SUB");
            await env.DB.batch([
                env.DB.prepare(`INSERT INTO material_categories (id,code,name,description,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`).bind(savedId, code, name, clean(payload.description) || null, numberValue(payload.sortOrder), 1, stamp, stamp),
                env.DB.prepare(`INSERT INTO material_subcategories (id,category_id,code,name,description,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(defaultSubId, savedId, "CHUA_PHAN_NHOM", "Chưa phân nhóm", "Nhóm mặc định", 9999, 1, stamp, stamp),
            ]);
        }
        await audit(user.id, categoryId ? "UPDATE" : "CREATE", "material_category", savedId || code, null, { code, name }, request);
        return { message: `Đã lưu hệ M&E ${name}.` };
    }
    if (action === "set_material_category_status") {
        requireRole(user, ["admin"]);
        const categoryId = clean(payload.categoryId);
        const active = payload.active === true || clean(payload.active) === "1";
        await env.DB.prepare(`UPDATE material_categories SET active=?,updated_at=? WHERE id=?`).bind(active ? 1 : 0, stamp, categoryId).run();
        return { message: active ? "Đã hiện lại hệ M&E." : "Đã ẩn hệ M&E khỏi danh sách chọn." };
    }
    if (action === "delete_material_category") {
        requireRole(user, ["admin"]);
        const categoryId = clean(payload.categoryId);
        const used = await first(`SELECT COUNT(*) AS count FROM materials WHERE category_id=?`, categoryId);
        if (Number(used?.count || 0) > 0)
            throw new Error("Hệ M&E đang có vật tư. Hãy chuyển vật tư sang hệ khác hoặc ẩn hệ để giữ lịch sử.");
        await env.DB.batch([
            env.DB.prepare(`DELETE FROM material_subcategories WHERE category_id=?`).bind(categoryId),
            env.DB.prepare(`DELETE FROM material_categories WHERE id=?`).bind(categoryId),
        ]);
        return { message: "Đã xóa hệ M&E và các nhóm con trống." };
    }
    if (action === "save_material_subcategory") {
        requireRole(user, ["admin"]);
        const subcategoryId = clean(payload.subcategoryId);
        const categoryId = clean(payload.categoryId);
        const name = clean(payload.name);
        const code = clean(payload.code).toUpperCase() || internalGroupCode(name);
        if (!categoryId || !name)
            throw new Error("Hệ M&E và tên nhóm vật tư là bắt buộc.");
        const category = await first(`SELECT id,code,name FROM material_categories WHERE id=?`, categoryId);
        if (!category)
            throw new Error("Hệ M&E không tồn tại.");
        const scopeExamples=clean(payload.scopeExamples)||clean(payload.description)||null; const reviewStatus=["proposed","pending","approved","rejected"].includes(clean(payload.reviewStatus))?clean(payload.reviewStatus):(subcategoryId?"approved":"proposed"); const adjustmentNote=clean(payload.adjustmentNote)||null;
        if (subcategoryId) {
            await env.DB.prepare(`UPDATE material_subcategories SET category_id=?,code=?,name=?,description=?,scope_examples=?,review_status=?,adjustment_note=?,sort_order=?,updated_at=? WHERE id=?`).bind(categoryId, code, name, clean(payload.description) || null, scopeExamples, reviewStatus, adjustmentNote, numberValue(payload.sortOrder), stamp, subcategoryId).run();
            await env.DB.prepare(`UPDATE materials SET category_id=?,system=?,updated_at=? WHERE subcategory_id=?`).bind(categoryId, canonicalMeCode(category.code), stamp, subcategoryId).run();
        }
        else {
            await env.DB.prepare(`INSERT INTO material_subcategories (id,category_id,code,name,description,scope_examples,review_status,adjustment_note,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("SUB"), categoryId, code, name, clean(payload.description) || null, scopeExamples, reviewStatus, adjustmentNote, numberValue(payload.sortOrder), 1, stamp, stamp).run();
        }
        await audit(user.id, subcategoryId ? "UPDATE" : "CREATE", "material_subcategory", subcategoryId || `${categoryId}:${code}`, null, { categoryId, code, name, scopeExamples, reviewStatus, adjustmentNote }, request);
        return { message: `Đã lưu nhóm vật tư ${name}.` };
    }
    if (action === "set_material_subcategory_status") {
        requireRole(user, ["admin"]);
        const subcategoryId = clean(payload.subcategoryId);
        const active = payload.active === true || clean(payload.active) === "1";
        await env.DB.prepare(`UPDATE material_subcategories SET active=?,updated_at=? WHERE id=?`).bind(active ? 1 : 0, stamp, subcategoryId).run();
        return { message: active ? "Đã hiện lại nhóm con." : "Đã ẩn nhóm con khỏi danh sách chọn." };
    }
    if (action === "delete_material_subcategory") {
        requireRole(user, ["admin"]);
        const subcategoryId = clean(payload.subcategoryId);
        const used = await first(`SELECT COUNT(*) AS count FROM materials WHERE subcategory_id=?`, subcategoryId);
        if (Number(used?.count || 0) > 0)
            throw new Error("Nhóm con đang có vật tư. Hãy chuyển vật tư sang nhóm khác trước khi xóa.");
        await env.DB.prepare(`DELETE FROM material_subcategories WHERE id=?`).bind(subcategoryId).run();
        return { message: "Đã xóa nhóm con chưa có vật tư." };
    }
    if (action === "bulk_material_subcategory_action") {
        requireRole(user,["admin"]); const ids=Array.isArray(payload.subcategoryIds)?[...new Set(payload.subcategoryIds.map(clean).filter(Boolean))]:[]; const operation=clean(payload.operation);
        if(!ids.length||!["hide","restore","delete"].includes(operation)) throw new Error("Thao tác nhóm con không hợp lệ.");
        const statements=[]; let deleted=0,archived=0,restored=0;
        for(const subcategoryId of ids){const row=await first(`SELECT id,code,name,active FROM material_subcategories WHERE id=?`,subcategoryId);if(!row)continue;
          if(operation==="hide"){statements.push(env.DB.prepare(`UPDATE material_subcategories SET active=0,updated_at=? WHERE id=?`).bind(stamp,subcategoryId));archived+=1;continue;}
          if(operation==="restore"){statements.push(env.DB.prepare(`UPDATE material_subcategories SET active=1,updated_at=? WHERE id=?`).bind(stamp,subcategoryId));restored+=1;continue;}
          const used=Number((await first(`SELECT COUNT(*) AS count FROM materials WHERE subcategory_id=?`,subcategoryId))?.count||0);
          if(used>0){statements.push(env.DB.prepare(`UPDATE material_subcategories SET active=0,updated_at=? WHERE id=?`).bind(stamp,subcategoryId));archived+=1;}else{statements.push(env.DB.prepare(`DELETE FROM material_subcategories WHERE id=?`).bind(subcategoryId));deleted+=1;}
        }
        if(statements.length)await env.DB.batch(statements); await audit(user.id,"BULK_ACTION","material_subcategory","MULTI",null,{operation,requested:ids.length,deleted,archived,restored},request);
        return {message:operation==="delete"?`Đã xóa ${deleted} nhóm trống; ${archived} nhóm đang được tham chiếu được chuyển sang Ẩn để giữ lịch sử.`:operation==="hide"?`Đã ẩn ${archived} nhóm con.`:`Đã khôi phục ${restored} nhóm con.`,deleted,archived,restored};
    }
    if (action === "import_material_catalog") {
        requireRole(user, ["admin"]);
        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        if (!rows.length)
            throw new Error("File danh mục vật tư không có dòng dữ liệu.");
        if (rows.length > 5000)
            throw new Error("Mỗi lần nhập tối đa 5.000 mã vật tư.");
        const existingCategories = await all(`SELECT id,code,name FROM material_categories`);
        const existingSubcategories = await all(`SELECT id,category_id AS categoryId,code,name FROM material_subcategories`);
        const categoryByCode = new Map(existingCategories.map((row) => [clean(row.code).toUpperCase(), row]));
        const subcategoryByKey = new Map(existingSubcategories.map((row) => [`${row.categoryId}:${clean(row.code).toUpperCase()}`, row]));
        const statements = [];
        let createdCategories = 0;
        let createdSubcategories = 0;
        for (let index = 0; index < rows.length; index += 1) {
            const row = rows[index];
            const code = clean(row.code).toUpperCase();
            const name = clean(row.name);
            const unit = clean(row.unit);
            const categoryCode = clean(row.categoryCode).toUpperCase() || "KHAC";
            const categoryName = clean(row.categoryName) || categoryCode;
            const subcategoryName = clean(row.subcategoryName) || "Chưa phân nhóm";
            const subcategoryCode = clean(row.subcategoryCode).toUpperCase() || internalGroupCode(subcategoryName);
            if (!code || !name || !unit)
                throw new Error(`Dòng ${index + 1}: cần đủ Mã vật tư, Tên vật tư và ĐVT.`);
            let category = categoryByCode.get(categoryCode);
            if (!category) {
                category = { id: id("CAT"), code: categoryCode, name: categoryName };
                categoryByCode.set(categoryCode, category);
                createdCategories += 1;
                statements.push(env.DB.prepare(`INSERT INTO material_categories (id,code,name,description,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)`).bind(category.id, category.code, category.name, "Tạo từ file danh mục vật tư V5.0.0", 999, 1, stamp, stamp));
            }
            else if (categoryName && category.name !== categoryName) {
                category = { ...category, name: categoryName };
                categoryByCode.set(categoryCode, category);
                statements.push(env.DB.prepare(`UPDATE material_categories SET name=?,active=1,updated_at=? WHERE id=?`).bind(categoryName, stamp, category.id));
            }
            const subKey = `${category.id}:${subcategoryCode}`;
            let subcategory = subcategoryByKey.get(subKey);
            if (!subcategory) {
                subcategory = { id: id("SUB"), categoryId: category.id, code: subcategoryCode, name: subcategoryName };
                subcategoryByKey.set(subKey, subcategory);
                createdSubcategories += 1;
                statements.push(env.DB.prepare(`INSERT INTO material_subcategories (id,category_id,code,name,description,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(subcategory.id, category.id, subcategory.code, subcategory.name, subcategoryCode === "CHUA_PHAN_NHOM" ? "Nhóm mặc định" : "Tạo từ file danh mục vật tư V5.0.0", subcategoryCode === "CHUA_PHAN_NHOM" ? 9999 : 999, 1, stamp, stamp));
            }
            else if (subcategoryName && subcategory.name !== subcategoryName) {
                subcategory = { ...subcategory, name: subcategoryName };
                subcategoryByKey.set(subKey, subcategory);
                statements.push(env.DB.prepare(`UPDATE material_subcategories SET name=?,active=1,updated_at=? WHERE id=?`).bind(subcategoryName, stamp, subcategory.id));
            }
            statements.push(env.DB.prepare(`INSERT INTO materials (id,code,name,system,category_id,subcategory_id,specification,brand,unit,standard_price,min_stock,requires_cocq,requires_mar,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(code) DO UPDATE SET name=excluded.name,system=excluded.system,category_id=excluded.category_id,subcategory_id=excluded.subcategory_id,specification=excluded.specification,brand=excluded.brand,unit=excluded.unit,standard_price=excluded.standard_price,min_stock=excluded.min_stock,requires_cocq=excluded.requires_cocq,requires_mar=excluded.requires_mar,active=1,updated_at=excluded.updated_at`).bind(id("MAT"), code, name, canonicalMeCode(category.code), category.id, subcategory.id, clean(row.specification) || null, clean(row.brand) || null, unit, 0, numberValue(row.minStock), 0, 0, 1, stamp, stamp));
        }
        await env.DB.batch(statements);
        await audit(user.id, "IMPORT", "material_catalog", `BATCH:${stamp}`, null, { rowCount: rows.length, createdCategories, createdSubcategories }, request);
        const extra = [createdCategories ? `${createdCategories} hệ M&E` : "", createdSubcategories ? `${createdSubcategories} nhóm con` : ""].filter(Boolean).join(" và ");
        return { message: `Đã nhập/cập nhật ${rows.length} mã vật tư${extra ? `; tạo mới ${extra}` : ""}.` };
    }
    if (action === "save_material") {
        const materialId = clean(payload.materialId);
        const code = clean(payload.code).toUpperCase();
        const name = clean(payload.name);
        const unit = clean(payload.unit);
        const categoryId = clean(payload.categoryId);
        let subcategoryId = clean(payload.subcategoryId);
        if (!code || !name || !unit || !categoryId)
            throw new Error("Mã vật tư, tên vật tư, ĐVT và hệ M&E là bắt buộc.");
        const category = await first(`SELECT id,code,name FROM material_categories WHERE id=?`, categoryId);
        if (!category)
            throw new Error("Hệ M&E không tồn tại.");
        if (!subcategoryId) {
            let fallback = await first(`SELECT id FROM material_subcategories WHERE category_id=? AND code='CHUA_PHAN_NHOM'`, categoryId);
            if (!fallback) {
                const fallbackId = id("SUB");
                await env.DB.prepare(`INSERT INTO material_subcategories (id,category_id,code,name,description,sort_order,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(fallbackId, categoryId, "CHUA_PHAN_NHOM", "Chưa phân nhóm", "Nhóm mặc định", 9999, 1, stamp, stamp).run();
                fallback = { id: fallbackId };
            }
            subcategoryId = clean(fallback.id);
        }
        const subcategory = await first(`SELECT id,name FROM material_subcategories WHERE id=? AND category_id=?`, subcategoryId, categoryId);
        if (!subcategory)
            throw new Error("Nhóm con không thuộc hệ M&E đã chọn.");
        const values = [code, name, canonicalMeCode(category.code), categoryId, subcategoryId, clean(payload.specification) || null, clean(payload.brand) || null, unit, 0, numberValue(payload.minStock), 0, 0];
        const targetId=materialId||id("MAT"); const before=materialId?await first(`SELECT id,code,name,unit FROM materials WHERE id=?`,materialId):null;
        const canonicalNormalized=normalizeMaterialName(name); const aliasMap=new Map();
        for(const alias of clean(payload.aliasText).split(/[;\n]+/).map((value)=>value.trim()).filter(Boolean)){ const normalized=normalizeMaterialName(alias); if(normalized&&normalized!==canonicalNormalized&&!aliasMap.has(normalized)) aliasMap.set(normalized,alias); }
        const normalizedAliases=[...aliasMap].map(([normalized,alias])=>({alias,normalized})); const aliases=normalizedAliases.map((item)=>item.alias);
        const catalog=await all(`SELECT id,code,name FROM materials WHERE id<>?`,targetId);
        const canonicalConflict=catalog.find((row)=>normalizeMaterialName(row.name)===canonicalNormalized)||await first(`SELECT ma.material_id AS materialId,m.code,m.name FROM material_aliases ma JOIN materials m ON m.id=ma.material_id WHERE ma.normalized_name=? AND ma.material_id<>?`,canonicalNormalized,targetId);
        if(canonicalConflict) throw new Error(`Tên gốc “${name}” đã thuộc hoặc tương đương mã ${canonicalConflict.code}; hãy chọn đúng mã gốc thay vì tạo vật tư trùng.`);
        for(const item of normalizedAliases){ const conflict=catalog.find((row)=>normalizeMaterialName(row.name)===item.normalized)||await first(`SELECT ma.material_id AS materialId,m.code,m.name FROM material_aliases ma JOIN materials m ON m.id=ma.material_id WHERE ma.normalized_name=? AND ma.material_id<>?`,item.normalized,targetId); if(conflict) throw new Error(`Tên tương đương “${item.alias}” đang thuộc mã ${conflict.code}; không được ghép hai vật tư khác thông số.`); }
        const statements=[]; if(materialId) statements.push(env.DB.prepare(`UPDATE materials SET code=?,name=?,system=?,category_id=?,subcategory_id=?,specification=?,brand=?,unit=?,standard_price=?,min_stock=?,requires_cocq=?,requires_mar=?,updated_at=? WHERE id=?`).bind(...values,stamp,materialId)); else statements.push(env.DB.prepare(`INSERT INTO materials (id,code,name,system,category_id,subcategory_id,specification,brand,unit,standard_price,min_stock,requires_cocq,requires_mar,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(targetId,...values,1,stamp,stamp));
        statements.push(env.DB.prepare(`DELETE FROM material_aliases WHERE material_id=?`).bind(targetId)); for(const item of normalizedAliases) statements.push(env.DB.prepare(`INSERT INTO material_aliases (id,material_id,alias_name,normalized_name,verified,active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id("MAL"),targetId,item.alias,item.normalized,1,1,user.id,stamp,stamp)); if(before&&clean(before.code)!==code){ const reason=clean(payload.codeChangeReason); if(!reason) throw new Error("Đổi mã gốc phải nhập lý do để lưu lịch sử."); statements.push(env.DB.prepare(`INSERT INTO material_code_history (id,material_id,old_code,new_code,reason,changed_by,changed_at) VALUES (?,?,?,?,?,?,?)`).bind(id("MCH"),targetId,before.code,code,reason,user.id,stamp)); }
        await env.DB.batch(statements); await audit(user.id, materialId ? "UPDATE" : "CREATE", "material", targetId, before, { code, name, unit, categoryId, subcategoryId, aliases }, request);
        return { message: `Đã lưu mã gốc ${code} · ${name} với ${aliases.length} tên tương đương.` };
    }
    if (action === "set_material_status") {
        const materialId = clean(payload.materialId);
        const active = payload.active === true || clean(payload.active) === "1";
        await env.DB.prepare(`UPDATE materials SET active=?,updated_at=? WHERE id=?`).bind(active ? 1 : 0, stamp, materialId).run();
        return { message: active ? "Đã kích hoạt lại vật tư." : "Đã ẩn vật tư khỏi các phiếu mới; lịch sử không thay đổi." };
    }
    if (action === "delete_unused_materials") {
        requireRole(user,["admin"]);
        const candidates=await all(`SELECT m.id,m.code,m.name FROM materials m WHERE upper(m.code)<>'__BOQ_STRUCTURE__' AND
          NOT EXISTS(SELECT 1 FROM material_request_items x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM stock_movements x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM stock_issue_items x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM material_return_items x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM stock_count_items x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM project_boq_items x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM central_return_items x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM stock_reservations x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM transfer_order_items x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM material_mar_approvals x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM boq_source_items x WHERE x.mapped_material_id=m.id) AND NOT EXISTS(SELECT 1 FROM boq_material_components x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM material_mapping_history x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM boq_mapping_audit x WHERE x.old_material_id=m.id OR x.new_material_id=m.id) AND NOT EXISTS(SELECT 1 FROM contract_stock_ledger x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM procurement_allocations x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM contract_ownership_transfers x WHERE x.material_id=m.id) AND NOT EXISTS(SELECT 1 FROM contract_stock_reconciliations x WHERE x.material_id=m.id)`);
        if(!candidates.length)return{message:"Không có mã vật tư chưa phát sinh dữ liệu để xóa.",deleted:0};if(payload.preview===true||clean(payload.preview)==="1")return{message:`Có ${candidates.length} mã chưa phát sinh dữ liệu có thể xóa.`,deleted:0,previewCount:candidates.length,preview:candidates.slice(0,200)};if(clean(payload.confirmText)!==`XOA ${candidates.length}`)throw new Error(`Xác nhận xóa chưa đúng. Hãy nhập “XOA ${candidates.length}”.`);
        const statements=[];for(const row of candidates){const mid=clean(row.id);statements.push(env.DB.prepare(`DELETE FROM boq_mapping_candidates WHERE material_id=?`).bind(mid),env.DB.prepare(`DELETE FROM material_embeddings WHERE material_id=?`).bind(mid),env.DB.prepare(`DELETE FROM material_aliases WHERE material_id=?`).bind(mid),env.DB.prepare(`DELETE FROM material_code_history WHERE material_id=?`).bind(mid),env.DB.prepare(`DELETE FROM material_external_codes WHERE material_id=?`).bind(mid),env.DB.prepare(`DELETE FROM material_uom_conversions WHERE material_id=?`).bind(mid),env.DB.prepare(`DELETE FROM materials WHERE id=?`).bind(mid));}await env.DB.batch(statements);await audit(user.id,"BULK_DELETE_UNUSED","material_catalog","ALL",null,{deleted:candidates.length,codes:candidates.slice(0,200).map(r=>r.code),dependencyGuard:true},request);return{message:`Đã xóa ${candidates.length} mã vật tư chưa phát sinh dữ liệu.`,deleted:candidates.length};
    }
    if (action === "merge_material_master") {
        requireRole(user,["admin"]);const sourceId=clean(payload.sourceMaterialId),targetId=clean(payload.targetMaterialId),reason=clean(payload.reason);if(!sourceId||!targetId||sourceId===targetId)throw new Error("Phải chọn hai mã vật tư khác nhau để hợp nhất.");if(!reason)throw new Error("Hợp nhất mã vật tư bắt buộc nhập lý do.");const source=await first(`SELECT * FROM materials WHERE id=?`,sourceId),target=await first(`SELECT * FROM materials WHERE id=?`,targetId);if(!source||!target)throw new Error("Không tìm thấy mã nguồn hoặc mã đích.");const sourceImpact=await materialDependencySummary(sourceId),targetImpact=await materialDependencySummary(targetId);if(payload.preview===true||clean(payload.preview)==="1")return{message:`Mã ${source.code} sẽ được hợp nhất vào ${target.code}.`,source:sourceImpact,target:targetImpact,sourceCode:source.code,targetCode:target.code};
        const statements=[];
        for(const table of ['material_request_items','stock_movements','material_return_items','stock_issue_items','project_boq_items','central_return_items','stock_reservations','transfer_order_items','procurement_allocations','contract_stock_ledger','contract_ownership_transfers','contract_stock_reconciliations'])statements.push(env.DB.prepare(`UPDATE ${table} SET material_id=? WHERE material_id=?`).bind(targetId,sourceId));
        statements.push(env.DB.prepare(`UPDATE boq_source_items SET mapped_material_id=?,standard_material_name_snapshot=?,updated_at=? WHERE mapped_material_id=?`).bind(targetId,target.name,stamp,sourceId),env.DB.prepare(`UPDATE boq_mapping_candidates SET material_id=? WHERE material_id=?`).bind(targetId,sourceId),env.DB.prepare(`UPDATE boq_mapping_audit SET old_material_id=? WHERE old_material_id=?`).bind(targetId,sourceId),env.DB.prepare(`UPDATE boq_mapping_audit SET new_material_id=? WHERE new_material_id=?`).bind(targetId,sourceId));
        for(const row of await all(`SELECT * FROM stock_count_items WHERE material_id=?`,sourceId)){const existing=await first(`SELECT * FROM stock_count_items WHERE stock_count_id=? AND material_id=?`,row.stock_count_id,targetId);if(existing)statements.push(env.DB.prepare(`UPDATE stock_count_items SET book_qty_snapshot=?,actual_qty=?,variance_qty=?,approved_adjustment_qty=?,reason=?,updated_at=? WHERE id=?`).bind(numberValue(existing.book_qty_snapshot)+numberValue(row.book_qty_snapshot),numberValue(existing.actual_qty)+numberValue(row.actual_qty),numberValue(existing.variance_qty)+numberValue(row.variance_qty),numberValue(existing.approved_adjustment_qty)+numberValue(row.approved_adjustment_qty),[clean(existing.reason),clean(row.reason)].filter(Boolean).join(" | ")||null,stamp,existing.id),env.DB.prepare(`DELETE FROM stock_count_items WHERE id=?`).bind(row.id));else statements.push(env.DB.prepare(`UPDATE stock_count_items SET material_id=?,updated_at=? WHERE id=?`).bind(targetId,stamp,row.id));}
        for(const row of await all(`SELECT * FROM material_mar_approvals WHERE material_id=?`,sourceId)){const dup=await first(`SELECT * FROM material_mar_approvals WHERE project_id=? AND material_id=?`,row.project_id,targetId);if(dup){const status=(clean(dup.status)==='approved'||clean(row.status)==='approved')?'approved':(clean(dup.status)==='pending'||clean(row.status)==='pending'?'pending':clean(dup.status)||clean(row.status));statements.push(env.DB.prepare(`UPDATE material_mar_approvals SET status=?,approval_no=COALESCE(approval_no,?),approved_at=COALESCE(approved_at,?),approved_by=COALESCE(approved_by,?),note=CASE WHEN note IS NULL THEN ? WHEN ? IS NULL THEN note ELSE note||' | '||? END,updated_at=? WHERE id=?`).bind(status,row.approval_no,row.approved_at,row.approved_by,row.note,row.note,row.note,stamp,dup.id),env.DB.prepare(`DELETE FROM material_mar_approvals WHERE id=?`).bind(row.id));}else statements.push(env.DB.prepare(`UPDATE material_mar_approvals SET material_id=?,updated_at=? WHERE id=?`).bind(targetId,stamp,row.id));}
        for(const row of await all(`SELECT * FROM material_mapping_history WHERE material_id=?`,sourceId)){const dup=await first(`SELECT * FROM material_mapping_history WHERE material_id=? AND source_normalized=?`,targetId,row.source_normalized);if(dup)statements.push(env.DB.prepare(`UPDATE material_mapping_history SET confirm_count=?,last_confirmed_at=?,updated_at=? WHERE id=?`).bind(numberValue(dup.confirm_count)+numberValue(row.confirm_count),String(dup.last_confirmed_at||'')>String(row.last_confirmed_at||'')?dup.last_confirmed_at:row.last_confirmed_at,stamp,dup.id),env.DB.prepare(`DELETE FROM material_mapping_history WHERE id=?`).bind(row.id));else statements.push(env.DB.prepare(`UPDATE material_mapping_history SET material_id=?,updated_at=? WHERE id=?`).bind(targetId,stamp,row.id));}
        for(const row of await all(`SELECT * FROM boq_material_components WHERE material_id=?`,sourceId)){const dup=await first(`SELECT id FROM boq_material_components WHERE source_item_id=? AND material_id=? AND component_type=?`,row.source_item_id,targetId,row.component_type);statements.push(dup?env.DB.prepare(`DELETE FROM boq_material_components WHERE id=?`).bind(row.id):env.DB.prepare(`UPDATE boq_material_components SET material_id=?,updated_at=? WHERE id=?`).bind(targetId,stamp,row.id));}
        for(const row of await all(`SELECT * FROM material_uom_conversions WHERE material_id=?`,sourceId)){const dup=await first(`SELECT id FROM material_uom_conversions WHERE material_id=? AND lower(from_uom)=lower(?) AND lower(to_uom)=lower(?)`,targetId,row.from_uom,row.to_uom);statements.push(dup?env.DB.prepare(`DELETE FROM material_uom_conversions WHERE id=?`).bind(row.id):env.DB.prepare(`UPDATE material_uom_conversions SET material_id=?,updated_at=? WHERE id=?`).bind(targetId,stamp,row.id));}
        statements.push(env.DB.prepare(`DELETE FROM material_embeddings WHERE material_id=?`).bind(sourceId));
        statements.push(env.DB.prepare(`UPDATE material_aliases SET material_id=?,updated_at=? WHERE material_id=?`).bind(targetId,stamp,sourceId));const oldNormalized=normalizeMaterialName(source.name),aliasExists=await first(`SELECT id FROM material_aliases WHERE normalized_name=?`,oldNormalized);if(oldNormalized&&oldNormalized!==normalizeMaterialName(target.name)&&!aliasExists)statements.push(env.DB.prepare(`INSERT INTO material_aliases(id,material_id,alias_name,normalized_name,verified,active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id("MAL"),targetId,source.name,oldNormalized,1,1,user.id,stamp,stamp));
        statements.push(env.DB.prepare(`UPDATE material_code_history SET material_id=? WHERE material_id=?`).bind(targetId,sourceId),env.DB.prepare(`UPDATE material_external_codes SET material_id=?,updated_at=? WHERE material_id=?`).bind(targetId,stamp,sourceId),env.DB.prepare(`DELETE FROM materials WHERE id=?`).bind(sourceId));
        await env.DB.batch(statements);await audit(user.id,"MERGE","material",targetId,source,{sourceMaterialId:sourceId,sourceCode:source.code,targetMaterialId:targetId,targetCode:target.code,reason,sourceImpact,targetImpact,p10Trace:true},request);return{message:`Đã hợp nhất ${source.code} vào ${target.code}. BOQ/MR/PO/Receipt/Kho/Contract ledger và lịch sử mapping đã được chuyển sang mã đích; mã nguồn đã được dọn sạch.`};
    }
    if (action === "check_material_alias_conflicts") {
        requireRole(user,["admin"]);
        const allAliases=await all(`SELECT ma.id,ma.alias_name AS aliasName,ma.normalized_name AS normalizedName,ma.material_id AS materialId,m.code,m.name,ma.active FROM material_aliases ma JOIN materials m ON m.id=ma.material_id ORDER BY ma.normalized_name`);
        const materials=await all(`SELECT id,code,name FROM materials WHERE active=1`);
        const byNormalized=new Map();
        for(const a of allAliases){const key=String(a.normalizedName||"").toLowerCase();if(!key)continue;if(!byNormalized.has(key))byNormalized.set(key,[]);byNormalized.get(key).push(a);}
        const duplicateAlias=[];for(const [key,rows] of byNormalized){if(rows.length>1){duplicateAlias.push({normalizedName:key,count:rows.length,materials:rows.map(r=>({materialId:r.materialId,code:r.code,name:r.name,aliasName:r.aliasName}))});}}
        const aliasClashWithName=[];for(const a of allAliases){const key=String(a.normalizedName||"").toLowerCase();const clash=materials.find((m)=>String(m.id)!==String(a.materialId)&&normalizeMaterialName(m.name)===key);if(clash)aliasClashWithName.push({materialId:a.materialId,code:a.code,aliasName:a.aliasName,clashMaterialId:clash.id,clashCode:clash.code,clashName:clash.name});}
        return{message:`Đã soát ${allAliases.length} alias.`,duplicateAlias:duplicateAlias.slice(0,100),aliasClashWithName:aliasClashWithName.slice(0,100),totalDuplicate:duplicateAlias.length,totalClash:aliasClashWithName.length};
    }
    if (action === "delete_material") {
        requireRole(user,["admin"]);const materialId=clean(payload.materialId),material=await first(`SELECT id,code,name FROM materials WHERE id=?`,materialId);if(!material)throw new Error("Không tìm thấy mã vật tư.");const impact=await materialDependencySummary(materialId);if(payload.preview===true||clean(payload.preview)==="1")return{message:impact.canHardDelete?`Mã ${material.code} chưa phát sinh dữ liệu và có thể xóa.`:`Mã ${material.code} đang có ${impact.total} liên kết; không được xóa cứng.`,impact};if(!impact.canHardDelete)throw new Error(`Vật tư đã phát sinh ${impact.total} liên kết nghiệp vụ. Hãy Chuyển/Hợp nhất mã hoặc Ngừng sử dụng; không được để tham chiếu rác.`);if(clean(payload.confirmText)&&clean(payload.confirmText)!==`XOA ${material.code}`)throw new Error(`Xác nhận xóa chưa đúng. Hãy nhập “XOA ${material.code}”.`);await env.DB.batch([env.DB.prepare(`DELETE FROM boq_mapping_candidates WHERE material_id=?`).bind(materialId),env.DB.prepare(`DELETE FROM material_embeddings WHERE material_id=?`).bind(materialId),env.DB.prepare(`DELETE FROM material_aliases WHERE material_id=?`).bind(materialId),env.DB.prepare(`DELETE FROM material_code_history WHERE material_id=?`).bind(materialId),env.DB.prepare(`DELETE FROM material_external_codes WHERE material_id=?`).bind(materialId),env.DB.prepare(`DELETE FROM material_uom_conversions WHERE material_id=?`).bind(materialId),env.DB.prepare(`DELETE FROM materials WHERE id=?`).bind(materialId)]);await audit(user.id,"DELETE","material",materialId,material,{hardDelete:true,dependencyChecked:true},request);return{message:`Đã xóa mã vật tư chưa sử dụng ${material.code}.`};
    }
    if (action === "save_form_field_config") {
      requireRole(user, ["admin"]);
      const formKey = clean(payload.formKey); const fieldKey = clean(payload.fieldKey); const displayName = clean(payload.displayName); const existingId = clean(payload.id);
      if (!["boq","boq_purchase","request_header","request_line"].includes(formKey)) throw new Error("Biểu mẫu cấu hình không hợp lệ.");
      if (!/^[A-Za-z][A-Za-z0-9_]*$/.test(fieldKey)) throw new Error("Khóa trường chỉ được dùng chữ, số và dấu gạch dưới, bắt đầu bằng chữ.");
      if (!displayName) throw new Error("Tên hiển thị của cột/trường không được để trống.");
      const existing = await first(`SELECT id,source_kind AS sourceKind,system_locked AS systemLocked FROM form_field_config WHERE form_key=? AND field_key=?`, formKey, fieldKey);
      const dataType = ["text","textarea","number","date","select","checkbox","money","percent"].includes(clean(payload.dataType)) ? clean(payload.dataType) : "text";
      const sourceKind = existing ? clean(existing.sourceKind) : "custom"; const systemLocked = existing ? numberValue(existing.systemLocked) : 0;
      const visible = payload.visible === true || clean(payload.visible) === "1"; const required = payload.required === true || clean(payload.required) === "1"; const importable = payload.importable === true || clean(payload.importable) === "1"; const exportable = payload.exportable === true || clean(payload.exportable) === "1"; const editableRequested = payload.editable === true || clean(payload.editable) === "1"; const editable = sourceKind === "system" ? 0 : (editableRequested ? 1 : 0); const active = payload.active === false || clean(payload.active) === "0" ? 0 : 1;
      const options = Array.isArray(payload.options) ? payload.options.map(clean).filter(Boolean) : clean(payload.optionsJson) ? clean(payload.optionsJson).split(/[;\n]+/).map((v)=>v.trim()).filter(Boolean) : [];
      const configId = clean(existing?.id) || existingId || id("FFC");
      await env.DB.prepare(`INSERT INTO form_field_config (id,form_key,field_key,display_name,data_type,source_kind,visible,required,importable,exportable,editable,sort_order,options_json,system_locked,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(form_key,field_key) DO UPDATE SET display_name=excluded.display_name,data_type=excluded.data_type,visible=excluded.visible,required=excluded.required,importable=excluded.importable,exportable=excluded.exportable,editable=excluded.editable,sort_order=excluded.sort_order,options_json=excluded.options_json,active=excluded.active,updated_at=excluded.updated_at`).bind(configId, formKey, fieldKey, displayName, dataType, sourceKind, visible?1:0, required?1:0, importable?1:0, exportable?1:0, editable, Math.trunc(numberValue(payload.sortOrder)), options.length ? JSON.stringify(options) : null, systemLocked, active, stamp, stamp).run();
      await audit(user.id,"CONFIG","form_field_config",`${formKey}:${fieldKey}`,existing,{displayName,dataType,visible,required,importable,exportable,editable,sortOrder:numberValue(payload.sortOrder),active},request);
      return { message: `Đã lưu cấu hình “${displayName}”. Mẫu Excel/CSV và giao diện sẽ dùng cấu hình mới.` };
    }
    if (action === "reorder_form_fields") {
      requireRole(user,["admin"]);const formKey=clean(payload.formKey);const items=Array.isArray(payload.items)?payload.items:[];if(!["boq","boq_purchase","request_header","request_line"].includes(formKey))throw new Error("Biểu mẫu cấu hình không hợp lệ.");if(!items.length||items.length>200)throw new Error("Danh sách cột cần có từ 1 đến 200 mục.");const fieldKeys=items.map(item=>clean(item.fieldKey));if(fieldKeys.some(key=>!/^[A-Za-z][A-Za-z0-9_]*$/.test(key))||new Set(fieldKeys).size!==fieldKeys.length)throw new Error("Khóa trường bị trống, trùng hoặc không hợp lệ.");const existingRows=await all(`SELECT id,field_key AS fieldKey,source_kind AS sourceKind,system_locked AS systemLocked FROM form_field_config WHERE form_key=?`,formKey);const existingByKey=new Map(existingRows.map(row=>[clean(row.fieldKey),row]));const statements=[];for(let index=0;index<items.length;index+=1){const item=items[index];const fieldKey=fieldKeys[index],displayName=clean(item.displayName);if(!displayName)throw new Error(`Tên hiển thị của trường ${fieldKey} không được để trống.`);const existing=existingByKey.get(fieldKey);const requestedSource=clean(item.sourceKind);const sourceKind=existing?clean(existing.sourceKind):(["core","system","custom"].includes(requestedSource)?requestedSource:"custom");const systemLocked=existing?numberValue(existing.systemLocked):(item.systemLocked===true||clean(item.systemLocked)==="1"?1:0);const dataType=["text","textarea","number","date","select","checkbox","money","percent"].includes(clean(item.dataType))?clean(item.dataType):"text";const visible=item.visible===true||clean(item.visible)==="1",required=item.required===true||clean(item.required)==="1",importable=item.importable===true||clean(item.importable)==="1",exportable=item.exportable===true||clean(item.exportable)==="1",editableRequested=item.editable===true||clean(item.editable)==="1",editable=sourceKind==="system"?0:(editableRequested?1:0),active=item.active===false||clean(item.active)==="0"?0:1;const options=Array.isArray(item.options)?item.options.map(clean).filter(Boolean):clean(item.optionsJson)?clean(item.optionsJson).split(/[;\n]+/).map(value=>value.trim()).filter(Boolean):[];const configId=clean(existing?.id)||clean(item.id)||id("FFC");statements.push(env.DB.prepare(`INSERT INTO form_field_config (id,form_key,field_key,display_name,data_type,source_kind,visible,required,importable,exportable,editable,sort_order,options_json,system_locked,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(form_key,field_key) DO UPDATE SET display_name=excluded.display_name,data_type=excluded.data_type,visible=excluded.visible,required=excluded.required,importable=excluded.importable,exportable=excluded.exportable,editable=excluded.editable,sort_order=excluded.sort_order,options_json=excluded.options_json,active=excluded.active,updated_at=excluded.updated_at`).bind(configId,formKey,fieldKey,displayName,dataType,sourceKind,visible?1:0,required?1:0,importable?1:0,exportable?1:0,editable,index+1,options.length?JSON.stringify(options):null,systemLocked,active,stamp,stamp));}await env.DB.batch(statements);await audit(user.id,"REORDER","form_field_config",formKey,{fieldKeys:existingRows.map(row=>row.fieldKey)},{fieldKeys},request);return{message:"Đã sắp xếp lại từ 1 đến hết. Giao diện và mẫu Excel/CSV đã dùng thứ tự mới."};
    }
    if (action === "delete_form_field_config") {
      requireRole(user,["admin"]); const formKey=clean(payload.formKey); const fieldKey=clean(payload.fieldKey); const existing=await first(`SELECT id,display_name AS displayName,system_locked AS systemLocked FROM form_field_config WHERE form_key=? AND field_key=?`,formKey,fieldKey); if(!existing) throw new Error("Không tìm thấy trường cấu hình.");
      if(numberValue(existing.systemLocked)===1) throw new Error("Đây là trường lõi hệ thống. Có thể đổi tên, ẩn hoặc bỏ bắt buộc nhưng không xóa khỏi cấu trúc dữ liệu.");
      await env.DB.prepare(`UPDATE form_field_config SET active=0,visible=0,updated_at=? WHERE form_key=? AND field_key=?`).bind(stamp,formKey,fieldKey).run();
      await audit(user.id,"DISABLE","form_field_config",`${formKey}:${fieldKey}`,existing,{active:0},request); return { message:`Đã bỏ trường “${clean(existing.displayName)}” khỏi biểu mẫu. Dữ liệu lịch sử vẫn được giữ.` };
    }
    if (action === "save_boq_item") {
      const projectId=clean(payload.projectId);if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền cập nhật BOQ dự án này.");
      const ctx=await resolveContractContext(projectId,clean(payload.contractId),clean(payload.boqVersionId),{requireVersion:true});const contractId=clean(ctx.contract.id),boqVersionId=clean(ctx.version.id);
      let sourceItemId=clean(payload.sourceItemId);const requestedBoqItemId=clean(payload.boqItemId);if(!sourceItemId&&requestedBoqItemId){const linked=await first(`SELECT source_item_id AS sourceItemId FROM project_boq_items WHERE id=? AND project_id=?`,requestedBoqItemId,projectId);sourceItemId=clean(linked?.sourceItemId);}
      const before=sourceItemId?await first(`SELECT * FROM boq_source_items WHERE id=? AND project_id=? AND contract_id=? AND boq_version_id=?`,sourceItemId,projectId,contractId,boqVersionId):null;if(sourceItemId&&!before)throw new Error("Dòng BOQ không thuộc Hợp đồng/Phiên bản đang chọn.");
      const allowedRoles=new Set(["section","system","group","heading","description","material","component","subtotal","note"]);let rowRole=clean(payload.rowRole);if(!allowedRoles.has(rowRole))rowRole=inferBoqRowRole(payload);const operative=["material","component"].includes(rowRole);
      const itemType=clean(payload.itemType)==="outside_contract"?"outside_contract":"contract",contractMaterialName=String(payload.materialName??payload.contractMaterialName??"").trim(),unit=String(payload.unit??"").trim(),contractMaterialCode=String(payload.contractMaterialCode??"").trim(),approvedMaterialCode=String(payload.approvedMaterialCode??"").trim(),systemCode=canonicalMeCode(payload.systemCode),subgroupName=String(payload.subgroupName??"").trim(),note=String(payload.note??"").trim();
      if(!contractMaterialName)throw new Error("Tên vật tư/tiêu đề BOQ không được để trống.");const contractQty=itemType==="outside_contract"?0:strictNonNegativeNumber(payload.contractQty??0,"Khối lượng BOQ/HĐ"),remeasuredQty=strictNonNegativeNumber(payload.remeasuredQty??contractQty,"Khối lượng bóc lại"),unitPrice=strictNonNegativeNumber(payload.unitPrice??0,"Đơn giá hợp đồng");
      let sourceOrder=Math.trunc(numberValue(payload.sourceOrder||payload.lineNo));if(!sourceOrder){const max=await first(`SELECT COALESCE(MAX(source_order),0) AS maxOrder FROM boq_source_items WHERE project_id=? AND contract_id=? AND boq_version_id=?`,projectId,contractId,boqVersionId);sourceOrder=Number(max?.maxOrder||0)+1;}
      let explicitMaterial=null;const explicitMaterialId=clean(payload.materialId),internalCode=clean(payload.internalMaterialCode).toUpperCase();if(explicitMaterialId||internalCode){explicitMaterial=explicitMaterialId?await first(`SELECT id,code,name,system,unit FROM materials WHERE id=? AND active=1`,explicitMaterialId):await first(`SELECT id,code,name,system,unit FROM materials WHERE upper(code)=upper(?) AND active=1`,internalCode);if(!explicitMaterial)throw new Error("Mã vật tư gốc được chọn không tồn tại hoặc đang bị ẩn.");}
      const existingPbiId=clean(before?.project_boq_item_id||requestedBoqItemId),existingMappedId=clean(before?.mapped_material_id);if(existingPbiId&&((explicitMaterial&&clean(explicitMaterial.id)!==existingMappedId)||(!operative&&existingMappedId))){const dep=await boqItemDependencySummary(existingPbiId);if(dep.total>0)throw new Error(`Dòng BOQ đã phát sinh ${dep.total} liên kết ĐNMH/PO/Nhập kho/đối chiếu. Không được đổi/xóa Mã vật tư gốc trực tiếp; hãy tạo phiên bản BOQ điều chỉnh hoặc dùng luồng remap có truy vết.`);}
      const variationStatusRaw=clean(payload.variationStatus);let variationStatus=["none","pending","approved","rejected"].includes(variationStatusRaw)?variationStatusRaw:"none";if((itemType==="outside_contract"||Math.abs(remeasuredQty-contractQty)>1e-9)&&variationStatus==="none")variationStatus="pending";
      const batch=before?{id:before.batch_id}:await ensureBoqBatch(projectId,contractId,ctx.version,user.id,"manual"),targetSourceId=sourceItemId||id("BQS");const mapped=operative?(explicitMaterial||(existingMappedId?await first(`SELECT id,code,name,system,unit FROM materials WHERE id=?`,existingMappedId):null)):null;const mappingStatus=mapped?(existingMappedId===clean(mapped.id)?clean(before?.mapping_status)||"confirmed":"mapped_manual"):"unmapped";
      const statements=[];
      if(before)statements.push(env.DB.prepare(`UPDATE boq_source_items SET source_order=?,source_row=?,contract_line_ref=?,row_role=?,boq_code=?,contract_code=?,contract_material_code=?,approved_material_code=?,contract_material_name=?,unit=?,contract_qty=?,remeasured_qty=?,unit_price=?,item_type=?,note=?,source_system_code=?,source_subgroup_name=?,mapped_material_id=?,standard_material_name_snapshot=?,mapping_status=?,mapped_by=?,mapped_at=?,active=1,updated_at=? WHERE id=?`).bind(sourceOrder,numberValue(payload.sourceRow)||before.source_row||null,clean(payload.contractLineRef||payload.lineNo)||null,rowRole,clean(payload.boqCode)||null,clean(payload.contractCode)||null,contractMaterialCode||null,approvedMaterialCode||null,contractMaterialName,unit||null,contractQty,remeasuredQty,unitPrice,itemType,note||null,systemCode||"KHAC",subgroupName||null,mapped?.id||null,mapped?.name||null,mappingStatus,mapped?user.id:null,mapped?stamp:null,stamp,targetSourceId));
      else statements.push(env.DB.prepare(`INSERT INTO boq_source_items(id,batch_id,project_id,contract_id,boq_version_id,source_order,source_row,contract_line_ref,row_role,boq_code,contract_code,contract_material_code,approved_material_code,contract_material_name,unit,contract_qty,remeasured_qty,unit_price,item_type,note,source_system_code,source_subgroup_name,raw_source_json,mapped_material_id,standard_material_name_snapshot,mapping_status,project_boq_item_id,mapped_by,mapped_at,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(targetSourceId,batch.id,projectId,contractId,boqVersionId,sourceOrder,numberValue(payload.sourceRow)||null,clean(payload.contractLineRef||payload.lineNo)||null,rowRole,clean(payload.boqCode)||null,clean(payload.contractCode)||null,contractMaterialCode||null,approvedMaterialCode||null,contractMaterialName,unit||null,contractQty,remeasuredQty,unitPrice,itemType,note||null,systemCode||"KHAC",subgroupName||null,JSON.stringify({manual:true}),mapped?.id||null,mapped?.name||null,mappingStatus,null,mapped?user.id:null,mapped?stamp:null,1,stamp,stamp));
      let pbiId=existingPbiId;
      if(operative&&mapped){if(!pbiId)pbiId=id("BOQ");if(existingPbiId)statements.push(env.DB.prepare(`UPDATE project_boq_items SET line_no=?,source_order=?,contract_line_ref=?,row_role=?,boq_code=?,contract_code=?,contract_material_code=?,approved_material_code=?,item_type=?,material_id=?,description=?,contract_qty=?,remeasured_qty=?,unit_price=?,variation_status=?,variation_ref=?,variation_approved_at=?,note=?,active=1,updated_at=? WHERE id=? AND project_id=? AND contract_id=? AND boq_version_id=?`).bind(sourceOrder,sourceOrder,clean(payload.contractLineRef||payload.lineNo)||null,rowRole,clean(payload.boqCode)||null,clean(payload.contractCode)||null,contractMaterialCode||null,approvedMaterialCode||null,itemType,mapped.id,contractMaterialName,contractQty,remeasuredQty,unitPrice,variationStatus,clean(payload.variationRef)||null,clean(payload.variationApprovedAt)||null,note||null,stamp,pbiId,projectId,contractId,boqVersionId));else statements.push(env.DB.prepare(`INSERT INTO project_boq_items(id,project_id,contract_id,boq_version_id,source_item_id,line_no,source_order,contract_line_ref,row_role,parent_source_order,outline_level,source_sheet,source_row,boq_code,contract_code,contract_material_code,approved_material_code,item_type,material_id,description,contract_qty,remeasured_qty,unit_price,variation_status,variation_ref,variation_approved_at,note,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(pbiId,projectId,contractId,boqVersionId,targetSourceId,sourceOrder,sourceOrder,clean(payload.contractLineRef||payload.lineNo)||null,rowRole,null,0,null,numberValue(payload.sourceRow)||null,clean(payload.boqCode)||null,clean(payload.contractCode)||null,contractMaterialCode||null,approvedMaterialCode||null,itemType,mapped.id,contractMaterialName,contractQty,remeasuredQty,unitPrice,variationStatus,clean(payload.variationRef)||null,clean(payload.variationApprovedAt)||null,note||null,1,stamp,stamp));statements.push(env.DB.prepare(`UPDATE boq_source_items SET project_boq_item_id=? WHERE id=?`).bind(pbiId,targetSourceId));}
      else if(existingPbiId)statements.push(env.DB.prepare(`UPDATE project_boq_items SET active=0,updated_at=? WHERE id=?`).bind(stamp,existingPbiId));
      await env.DB.batch(statements);await env.DB.prepare(`UPDATE boq_import_batches SET row_count=(SELECT COUNT(*) FROM boq_source_items WHERE batch_id=? AND active=1),updated_at=? WHERE id=?`).bind(batch.id,stamp,batch.id).run();
      const after=await first(`SELECT * FROM boq_source_items WHERE id=?`,targetSourceId);await logBoqChange({projectId,contractId,boqVersionId,sourceItemId:targetSourceId,projectBoqItemId:pbiId,actionType:before?"UPDATE":"CREATE",before,after,reason:clean(payload.reason)||"Điều chỉnh BOQ được người dùng xác nhận",actorUserId:user.id});await audit(user.id,before?"UPDATE":"CREATE","boq_source_item",targetSourceId,before,after,request);return{message:`Đã ${before?"cập nhật":"thêm"} dòng BOQ ${sourceOrder}; lịch sử thay đổi đã được lưu.`,sourceItemId:targetSourceId,boqItemId:pbiId||null};
    }
    if(action==="set_boq_item_status"){
      const sourceItemId=clean(payload.sourceItemId);const row=await first(`SELECT * FROM boq_source_items WHERE id=?`,sourceItemId);if(!row)throw new Error("Không tìm thấy dòng BOQ.");if(!(await canAccessProject(user,row.project_id,true)))throw new Error("Không có quyền tại dự án này.");const active=payload.active===true||["1","true","on"].includes(clean(payload.active).toLowerCase());const before={...row};const statements=[env.DB.prepare(`UPDATE boq_source_items SET active=?,updated_at=? WHERE id=?`).bind(active?1:0,stamp,sourceItemId)];if(clean(row.project_boq_item_id))statements.push(env.DB.prepare(`UPDATE project_boq_items SET active=?,updated_at=? WHERE id=?`).bind(active?1:0,stamp,row.project_boq_item_id));await env.DB.batch(statements);await logBoqChange({projectId:row.project_id,contractId:row.contract_id,boqVersionId:row.boq_version_id,sourceItemId,projectBoqItemId:row.project_boq_item_id,actionType:active?"RESTORE":"ARCHIVE",before,after:{active:active?1:0},reason:clean(payload.reason)||null,actorUserId:user.id});await audit(user.id,active?"RESTORE":"ARCHIVE","boq_source_item",sourceItemId,before,{active},request);return{message:active?"Đã khôi phục dòng BOQ.":"Đã xóa/ẩn dòng BOQ khỏi phiên bản hiện hành; dữ liệu và lịch sử vẫn được giữ để khôi phục."};
    }
    if(action==="bulk_boq_item_action"){
      const sourceItemIds=[...new Set((Array.isArray(payload.sourceItemIds)?payload.sourceItemIds:[]).map(clean).filter(Boolean))];if(!sourceItemIds.length)throw new Error("Chưa chọn dòng BOQ.");if(sourceItemIds.length>5000)throw new Error("Mỗi lần xử lý tối đa 5.000 dòng.");const mode=["archive","restore"].includes(clean(payload.mode))?clean(payload.mode):"archive",active=mode==="restore"?1:0;let changed=0;for(const sourceItemId of sourceItemIds){const row=await first(`SELECT * FROM boq_source_items WHERE id=?`,sourceItemId);if(!row)continue;if(!(await canAccessProject(user,row.project_id,true)))throw new Error("Danh sách có dòng BOQ ngoài phạm vi được cấp quyền.");const statements=[env.DB.prepare(`UPDATE boq_source_items SET active=?,updated_at=? WHERE id=?`).bind(active,stamp,sourceItemId)];if(clean(row.project_boq_item_id))statements.push(env.DB.prepare(`UPDATE project_boq_items SET active=?,updated_at=? WHERE id=?`).bind(active,stamp,row.project_boq_item_id));await env.DB.batch(statements);await logBoqChange({projectId:row.project_id,contractId:row.contract_id,boqVersionId:row.boq_version_id,sourceItemId,projectBoqItemId:row.project_boq_item_id,actionType:active?"RESTORE":"ARCHIVE",before:row,after:{active},reason:clean(payload.reason)||"Thao tác hàng loạt",actorUserId:user.id});changed+=1;}await audit(user.id,active?"RESTORE_SELECTED":"ARCHIVE_SELECTED","boq_source_item","SELECTION",null,{count:changed},request);return{message:active?`Đã khôi phục ${changed} dòng BOQ.`:`Đã xóa/ẩn ${changed} dòng BOQ; có thể khôi phục khi cần.`};
    }
    if(action==="delete_boq_item"){
      const sourceItemId=clean(payload.sourceItemId);const row=await first(`SELECT * FROM boq_source_items WHERE id=?`,sourceItemId);if(!row)throw new Error("Không tìm thấy dòng BOQ.");if(!(await canAccessProject(user,row.project_id,true)))throw new Error("Không có quyền tại dự án này.");const pbiId=clean(row.project_boq_item_id),dep=pbiId?await boqItemDependencySummary(pbiId):{total:0};if(dep.total>0){await env.DB.batch([env.DB.prepare(`UPDATE boq_source_items SET active=0,updated_at=? WHERE id=?`).bind(stamp,sourceItemId),env.DB.prepare(`UPDATE project_boq_items SET active=0,updated_at=? WHERE id=?`).bind(stamp,pbiId)]);await logBoqChange({projectId:row.project_id,contractId:row.contract_id,boqVersionId:row.boq_version_id,sourceItemId,projectBoqItemId:pbiId,actionType:"ARCHIVE",before:row,after:{active:0},reason:`Có ${dep.total} liên kết downstream nên xóa mềm`,actorUserId:user.id});return{message:`Dòng BOQ đã có ${dep.total} liên kết nghiệp vụ nên không xóa cứng. Hệ thống đã xóa/ẩn an toàn và giữ lịch sử để truy vết.`};}
      await env.DB.batch([env.DB.prepare(`UPDATE boq_source_items SET active=0,updated_at=? WHERE id=?`).bind(stamp,sourceItemId),...(pbiId?[env.DB.prepare(`UPDATE project_boq_items SET active=0,updated_at=? WHERE id=?`).bind(stamp,pbiId)]:[])]);await logBoqChange({projectId:row.project_id,contractId:row.contract_id,boqVersionId:row.boq_version_id,sourceItemId,projectBoqItemId:pbiId,actionType:"DELETE_SAFE",before:row,after:{active:0},reason:clean(payload.reason)||"Xóa dòng nhập sai",actorUserId:user.id});await audit(user.id,"DELETE_SAFE","boq_source_item",sourceItemId,row,{active:0},request);return{message:"Đã xóa dòng BOQ khỏi sử dụng. Dữ liệu được giữ ở trạng thái đã xóa để có thể khôi phục và chống mất lịch sử."};
    }
    if(action==="clear_boq_version"){
      const projectId=clean(payload.projectId);if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền tại dự án này.");const ctx=await resolveContractContext(projectId,clean(payload.contractId),clean(payload.boqVersionId),{requireVersion:true});const contractId=clean(ctx.contract.id),boqVersionId=clean(ctx.version.id),mode=["archive","restore","purge"].includes(clean(payload.mode))?clean(payload.mode):"archive";const dep=await boqVersionDependencySummary(projectId,contractId,boqVersionId);
      if(mode==="purge"){
        if(dep.total>0)throw new Error(`BOQ Version đã phát sinh ${dep.total} liên kết ĐNMH/PO/Nhập kho. Không được xóa vĩnh viễn; hãy Lưu trữ hoặc tạo phiên bản điều chỉnh.`);
        if(clean(payload.confirmText)!==`XOA ${clean(ctx.version.versionCode)}`)throw new Error(`Xác nhận chưa đúng. Hãy nhập “XOA ${clean(ctx.version.versionCode)}”.`);
        const sourceRows=await all(`SELECT id,project_boq_item_id AS projectBoqItemId FROM boq_source_items WHERE project_id=? AND contract_id=? AND boq_version_id=?`,projectId,contractId,boqVersionId),batchRows=await all(`SELECT id FROM boq_import_batches WHERE project_id=? AND contract_id=? AND boq_version_id=?`,projectId,contractId,boqVersionId);
        await env.DB.batch([
          env.DB.prepare(`UPDATE boq_source_items SET project_boq_item_id=NULL WHERE project_id=? AND contract_id=? AND boq_version_id=?`).bind(projectId,contractId,boqVersionId),
          env.DB.prepare(`UPDATE project_boq_items SET source_item_id=NULL WHERE project_id=? AND contract_id=? AND boq_version_id=?`).bind(projectId,contractId,boqVersionId)
        ]);
        for(const source of sourceRows){
          await env.DB.batch([env.DB.prepare(`DELETE FROM boq_mapping_candidates WHERE source_item_id=?`).bind(source.id),env.DB.prepare(`DELETE FROM boq_mapping_audit WHERE source_item_id=?`).bind(source.id),env.DB.prepare(`DELETE FROM boq_material_components WHERE source_item_id=?`).bind(source.id)]);
          if(clean(source.projectBoqItemId)){await env.DB.prepare(`DELETE FROM boq_price_import_items WHERE boq_item_id=?`).bind(source.projectBoqItemId).run();await env.DB.prepare(`DELETE FROM custom_field_values WHERE form_key='boq' AND entity_id=?`).bind(source.projectBoqItemId).run();}
        }
        await env.DB.prepare(`DELETE FROM boq_change_history WHERE project_id=? AND contract_id=? AND boq_version_id=?`).bind(projectId,contractId,boqVersionId).run();
        for(const batch of batchRows){await env.DB.prepare(`DELETE FROM boq_mapping_runs WHERE batch_id=?`).bind(batch.id).run();}
        await env.DB.prepare(`DELETE FROM boq_source_items WHERE project_id=? AND contract_id=? AND boq_version_id=?`).bind(projectId,contractId,boqVersionId).run();
        await env.DB.prepare(`DELETE FROM project_boq_items WHERE project_id=? AND contract_id=? AND boq_version_id=?`).bind(projectId,contractId,boqVersionId).run();
        await env.DB.prepare(`DELETE FROM boq_import_batches WHERE project_id=? AND contract_id=? AND boq_version_id=?`).bind(projectId,contractId,boqVersionId).run();
        await env.DB.prepare(`DELETE FROM boq_versions WHERE id=?`).bind(boqVersionId).run();
        await audit(user.id,"PURGE","boq_version",boqVersionId,ctx.version,{rows:sourceRows.length},request);
        return{message:`Đã xóa vĩnh viễn ${sourceRows.length} dòng của ${ctx.version.versionCode}; chỉ cho phép vì phiên bản chưa phát sinh nghiệp vụ.`};
      }
      const active=mode==="restore"?1:0;await env.DB.batch([env.DB.prepare(`UPDATE boq_source_items SET active=?,updated_at=? WHERE project_id=? AND contract_id=? AND boq_version_id=?`).bind(active,stamp,projectId,contractId,boqVersionId),env.DB.prepare(`UPDATE project_boq_items SET active=?,updated_at=? WHERE project_id=? AND contract_id=? AND boq_version_id=?`).bind(active,stamp,projectId,contractId,boqVersionId),env.DB.prepare(`UPDATE boq_import_batches SET active=?,updated_at=? WHERE project_id=? AND contract_id=? AND boq_version_id=?`).bind(active,stamp,projectId,contractId,boqVersionId),env.DB.prepare(`UPDATE boq_versions SET status=?,active=0,updated_at=? WHERE id=?`).bind(active?"draft":"archived",stamp,boqVersionId)]);await logBoqChange({projectId,contractId,boqVersionId,actionType:active?"RESTORE_VERSION":"ARCHIVE_VERSION",before:ctx.version,after:{status:active?"draft":"archived",rowActive:active},reason:clean(payload.reason)||null,actorUserId:user.id});await audit(user.id,active?"RESTORE":"ARCHIVE","boq_version",boqVersionId,ctx.version,{rows:dep.detail.sourceRows},request);return{message:active?`Đã khôi phục dữ liệu ${ctx.version.versionCode} ở trạng thái nháp; không tự thay phiên bản hiện hành.`:`Đã xóa/ẩn toàn bộ ${dep.detail.sourceRows} dòng của ${ctx.version.versionCode}; lịch sử vẫn được giữ và có thể khôi phục.`};
    }

    if(action==="compare_boq_materials"){
      const projectId=clean(payload.projectId);if(!(await canAccessProject(user,projectId,false)))throw new Error("Không có quyền xem/so sánh BOQ dự án này.");
      const requestedBatchId=clean(payload.batchId),requestedContractId=clean(payload.contractId),requestedBoqVersionId=clean(payload.boqVersionId);let batch=null;
      if(requestedBatchId) batch=await first(`SELECT id,project_id AS projectId,contract_id AS contractId,boq_version_id AS boqVersionId,version_no AS versionNo,source_file_name AS sourceFileName,active,row_count AS rowCount FROM boq_import_batches WHERE id=? AND project_id=?`,requestedBatchId,projectId);
      else {const ctx=await resolveContractContext(projectId,requestedContractId,requestedBoqVersionId,{requireVersion:false});batch=await first(`SELECT id,project_id AS projectId,contract_id AS contractId,boq_version_id AS boqVersionId,version_no AS versionNo,source_file_name AS sourceFileName,active,row_count AS rowCount FROM boq_import_batches WHERE project_id=? AND contract_id=? ${requestedBoqVersionId?"AND boq_version_id=?":"AND active=1"} ORDER BY version_no DESC LIMIT 1`,...(requestedBoqVersionId?[projectId,ctx.contract.id,requestedBoqVersionId]:[projectId,ctx.contract.id]));}
      if(!batch)throw new Error("Contract/BOQ Version chưa có BOQ nguồn để so sánh. Hãy nhập BOQ trước.");
      if(requestedContractId&&clean(batch.contractId)!==requestedContractId)throw new Error("BOQ batch không thuộc Contract đã chọn.");if(requestedBoqVersionId&&clean(batch.boqVersionId)!==requestedBoqVersionId)throw new Error("BOQ batch không thuộc BOQ Version đã chọn.");
      const scope=clean(payload.scope)==="all"?"all":"unmapped",topK=5;let sourceRows=await all(`SELECT id,batch_id AS batchId,project_id AS projectId,contract_id AS contractId,boq_version_id AS boqVersionId,source_order AS sourceOrder,source_row AS sourceRow,contract_line_ref AS contractLineRef,row_role AS rowRole,boq_code AS boqCode,contract_code AS contractCode,contract_material_code AS contractMaterialCode,approved_material_code AS approvedMaterialCode,contract_material_name AS contractMaterialName,unit,contract_qty AS contractQty,remeasured_qty AS remeasuredQty,unit_price AS unitPrice,item_type AS itemType,note,source_system_code AS sourceSystemCode,source_subgroup_name AS sourceSubgroupName,mapped_material_id AS mappedMaterialId,standard_material_name_snapshot AS standardMaterialNameSnapshot,mapping_status AS mappingStatus,project_boq_item_id AS projectBoqItemId FROM boq_source_items WHERE batch_id=? AND active=1 AND row_role IN ('material','component') AND trim(COALESCE(unit,''))<>'' AND trim(COALESCE(contract_material_name,''))<>'' ORDER BY source_order,id`,batch.id);if(scope==="unmapped")sourceRows=sourceRows.filter((r)=>!clean(r.mappedMaterialId));if(sourceRows.length>5000)throw new Error("Mỗi lần so sánh tối đa 5.000 dòng BOQ.");
      const materials=await all(`SELECT id,code,name,system,specification,brand,unit,active FROM materials WHERE active=1 AND upper(code)<>'__BOQ_STRUCTURE__' ORDER BY code`),aliasRows=await all(`SELECT material_id AS materialId,alias_name AS aliasName FROM material_aliases WHERE active=1 AND verified=1`),aliasesByMaterial=new Map();for(const a of aliasRows){const key=clean(a.materialId);if(!aliasesByMaterial.has(key))aliasesByMaterial.set(key,[]);aliasesByMaterial.get(key).push(clean(a.aliasName));}const historyRows=await all(`SELECT material_id AS materialId,source_normalized AS sourceNormalized,confirm_count AS confirmCount FROM material_mapping_history`);
      const runId=id("MAPRUN"),runCreated=now();let provider=clean(process.env.VNTECH_EMBEDDING_PROVIDER||"local_feature_v1"),providerFallback=0;await env.DB.prepare(`INSERT INTO boq_mapping_runs(id,batch_id,project_id,contract_id,boq_version_id,scope,provider,provider_fallback,top_k,thresholds_json,weights_json,run_by,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(runId,batch.id,projectId,batch.contractId,batch.boqVersionId,scope,provider,0,topK,JSON.stringify(MATERIAL_MATCH_THRESHOLDS),JSON.stringify(MATERIAL_MATCH_WEIGHTS),user.id,runCreated).run();
      const results=[];let candidateCount=0;for(const source of sourceRows){if(clean(source.mappedMaterialId)){results.push({...source,status:"already_mapped",candidates:[]});continue;}const candidates=await materialSourceCandidates(source,materials,aliasesByMaterial,historyRows,topK);if(candidates.some((c)=>c.providerFallback))providerFallback=1;if(candidates[0]?.provider)provider=candidates[0].provider;const statements=[];for(let i=0;i<candidates.length;i++){const c=candidates[i];candidateCount++;statements.push(env.DB.prepare(`INSERT INTO boq_mapping_candidates(id,run_id,source_item_id,material_id,rank_no,history_score,technical_score,system_score,uom_score,fuzzy_score,embedding_score,final_score,hard_conflict,conflict_reason,provider,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MAPC"),runId,source.id,c.materialId,i+1,c.historyScore,c.technicalScore,c.systemScore,c.uomScore,c.fuzzyScore,c.embeddingScore,c.finalScore,c.hardConflict?1:0,c.conflictReason||null,c.provider,c.status,runCreated));}if(statements.length)await env.DB.batch(statements);results.push({...source,status:candidates.length?candidates[0].status:"not_found",candidates});}
      await env.DB.prepare(`UPDATE boq_mapping_runs SET provider=?,provider_fallback=? WHERE id=?`).bind(provider,providerFallback,runId).run();await audit(user.id,"COMPARE","boq_material_mapping",runId,null,{projectId,contractId:batch.contractId,boqVersionId:batch.boqVersionId,batchId:batch.id,scope,rowCount:sourceRows.length,candidateCount,provider,providerFallback,topK},request);return{message:`Đã so sánh ${sourceRows.length} dòng BOQ.`,run:{id:runId,batchId:batch.id,contractId:batch.contractId,boqVersionId:batch.boqVersionId,versionNo:batch.versionNo,sourceFileName:batch.sourceFileName,scope,provider,providerFallback,topK,thresholds:MATERIAL_MATCH_THRESHOLDS,weights:MATERIAL_MATCH_WEIGHTS},items:results};
    }
    if(action==="confirm_boq_material_mappings"){
      const projectId=clean(payload.projectId);if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền cập nhật mapping BOQ dự án này.");const rows=Array.isArray(payload.mappings)?payload.mappings:[];if(!rows.length)throw new Error("Chưa chọn dòng mapping để cập nhật.");if(rows.length>5000)throw new Error("Mỗi lần xác nhận tối đa 5.000 dòng.");let confirmed=0,remapped=0;
      for(const [index,input] of rows.entries()){const sourceId=clean(input.sourceItemId),newMaterialId=clean(input.materialId),runId=clean(input.runId||payload.runId)||null;const source=await first(`SELECT * FROM boq_source_items WHERE id=? AND project_id=? AND active=1`,sourceId,projectId);if(!source)throw new Error(`Dòng ${index+1}: không tìm thấy dòng BOQ nguồn.`);if(clean(payload.contractId)&&clean(source.contract_id)!==clean(payload.contractId))throw new Error(`Dòng ${index+1}: nguồn BOQ không thuộc Contract đang chọn.`);if(clean(payload.boqVersionId)&&clean(source.boq_version_id)!==clean(payload.boqVersionId))throw new Error(`Dòng ${index+1}: nguồn BOQ không thuộc BOQ Version đang chọn.`);const material=await first(`SELECT id,code,name,system,unit,active FROM materials WHERE id=? AND active=1`,newMaterialId);if(!material)throw new Error(`Dòng ${index+1}: mã vật tư gốc không tồn tại/đã khóa.`);const oldMaterialId=clean(source.mapped_material_id),isRemap=Boolean(oldMaterialId&&oldMaterialId!==newMaterialId);if(isRemap&&!input.remap)throw new Error(`Dòng ${index+1}: BOQ đã có mã gốc; phải dùng thao tác ĐỔI MAPPING.`);if(isRemap&&!clean(input.reason))throw new Error(`Dòng ${index+1}: Đổi mapping bắt buộc nhập lý do.`);
        let candidate=null;if(runId)candidate=await first(`SELECT final_score AS finalScore,history_score AS historyScore,technical_score AS technicalScore,system_score AS systemScore,uom_score AS uomScore,fuzzy_score AS fuzzyScore,embedding_score AS embeddingScore,hard_conflict AS hardConflict,conflict_reason AS conflictReason,provider FROM boq_mapping_candidates WHERE run_id=? AND source_item_id=? AND material_id=?`,runId,sourceId,newMaterialId);if(Number(candidate?.hardConflict||0)===1)throw new Error(`Dòng ${index+1}: ứng viên có xung đột kỹ thuật (${candidate.conflictReason||"critical spec"}); không cho batch commit.`);if(candidate&&Number(candidate.finalScore||0)<0.80&&!input.manualConfirm)throw new Error(`Dòng ${index+1}: ứng viên dưới 80% không được batch xác nhận. Hãy kiểm tra thủ công.`);
        let operationalId=clean(source.project_boq_item_id);if(operationalId){await env.DB.prepare(`UPDATE project_boq_items SET material_id=?,contract_id=?,boq_version_id=?,source_item_id=?,updated_at=? WHERE id=? AND project_id=?`).bind(material.id,source.contract_id,source.boq_version_id,sourceId,stamp,operationalId,projectId).run();}else{operationalId=id("BOQ");const contractQty=numberValue(source.contract_qty),remeasuredQty=numberValue(source.remeasured_qty),itemType=clean(source.item_type)==="outside_contract"?"outside_contract":"contract",variationStatus=itemType==="outside_contract"||Math.abs(remeasuredQty-contractQty)>1e-9?"pending":"none";await env.DB.prepare(`INSERT INTO project_boq_items(id,project_id,contract_id,boq_version_id,source_item_id,line_no,source_order,contract_line_ref,row_role,parent_source_order,outline_level,source_sheet,source_row,boq_code,contract_code,contract_material_code,approved_material_code,item_type,material_id,description,contract_qty,remeasured_qty,unit_price,variation_status,variation_ref,variation_approved_at,note,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(operationalId,projectId,source.contract_id,source.boq_version_id,sourceId,numberValue(source.source_order)||index+1,numberValue(source.source_order)||index+1,clean(source.contract_line_ref)||null,clean(source.row_role)||"material",null,0,null,numberValue(source.source_row)||null,clean(source.boq_code)||null,clean(source.contract_code)||null,clean(source.contract_material_code)||null,clean(source.approved_material_code)||null,itemType,material.id,String(source.contract_material_name??"")||null,contractQty,remeasuredQty,numberValue(source.unit_price),variationStatus,null,null,String(source.note??"")||null,1,stamp,stamp).run();}
        await env.DB.prepare(`UPDATE boq_source_items SET mapped_material_id=?,standard_material_name_snapshot=?,source_system_code=?,mapping_status='confirmed',project_boq_item_id=?,mapped_by=?,mapped_at=?,updated_at=? WHERE id=?`).bind(material.id,material.name,canonicalMeCode(material.system),operationalId,user.id,stamp,stamp,sourceId).run();
        const scoreDetail=candidate?JSON.stringify({history:candidate.historyScore,technical:candidate.technicalScore,system:candidate.systemScore,uom:candidate.uomScore,fuzzy:candidate.fuzzyScore,embedding:candidate.embeddingScore,final:candidate.finalScore,conflict:Boolean(candidate.hardConflict)}):null;await env.DB.prepare(`INSERT INTO boq_mapping_audit(id,source_item_id,run_id,old_material_id,new_material_id,action_type,final_score,score_detail_json,provider,reason,save_alias,actor_user_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MAPA"),sourceId,runId,oldMaterialId||null,material.id,isRemap?"REMAP":"CONFIRM",candidate?.finalScore??null,scoreDetail,candidate?.provider||"manual",clean(input.reason)||null,input.saveAlias?1:0,user.id,stamp).run();
        const sourceText=String(source.contract_material_name??""),sourceNormalized=normalizeMaterialText(sourceText);if(sourceNormalized){const hist=await first(`SELECT id,confirm_count AS confirmCount FROM material_mapping_history WHERE material_id=? AND source_normalized=?`,material.id,sourceNormalized);if(hist)await env.DB.prepare(`UPDATE material_mapping_history SET confirm_count=?,last_confirmed_by=?,last_confirmed_at=?,updated_at=? WHERE id=?`).bind(Number(hist.confirmCount||0)+1,user.id,stamp,stamp,hist.id).run();else await env.DB.prepare(`INSERT INTO material_mapping_history(id,material_id,source_normalized,source_text,system_code,unit,confirm_count,last_confirmed_by,last_confirmed_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)`).bind(id("MAPH"),material.id,sourceNormalized,sourceText,clean(source.source_system_code)||null,String(source.unit??"")||null,1,user.id,stamp,stamp,stamp).run();if(input.saveAlias){const existingAlias=await first(`SELECT id,material_id AS materialId FROM material_aliases WHERE normalized_name=?`,sourceNormalized);if(existingAlias&&clean(existingAlias.materialId)!==material.id)throw new Error(`Dòng ${index+1}: alias đã thuộc mã vật tư khác; không tự ghi đè.`);if(!existingAlias)await env.DB.prepare(`INSERT INTO material_aliases(id,material_id,alias_name,normalized_name,verified,active,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(id("MAL"),material.id,sourceText,sourceNormalized,1,1,user.id,stamp,stamp).run();}}
        await env.DB.prepare(`UPDATE boq_material_components SET active=0,updated_at=? WHERE source_item_id=? AND component_type='main' AND active=1`).bind(stamp,sourceId).run();const existingMain=await first(`SELECT id FROM boq_material_components WHERE source_item_id=? AND material_id=? AND component_type='main'`,sourceId,material.id);if(existingMain)await env.DB.prepare(`UPDATE boq_material_components SET active=1,approved_by=?,approved_at=?,source_method=?,updated_at=? WHERE id=?`).bind(user.id,stamp,candidate?"matching_v2":"manual",stamp,existingMain.id).run();else await env.DB.prepare(`INSERT INTO boq_material_components(id,source_item_id,material_id,component_type,quantity_ratio,component_uom,is_required,source_method,approved_by,approved_at,note,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("BOQC"),sourceId,material.id,"main",1,String(source.unit??"")||material.unit||null,1,candidate?"matching_v2":"manual",user.id,stamp,null,1,stamp,stamp).run();confirmed++;if(isRemap)remapped++;
      }
      await audit(user.id,"CONFIRM","boq_material_mapping",projectId,null,{confirmed,remapped,runId:clean(payload.runId)||null,contractId:clean(payload.contractId)||null,boqVersionId:clean(payload.boqVersionId)||null},request);return{message:`Đã cập nhật ${confirmed} dòng BOQ; ${remapped} dòng remap. Tên vật tư theo HĐ được giữ nguyên.`};
    }
    if(action==="request_material_master_from_boq"){
      const projectId=clean(payload.projectId),sourceItemId=clean(payload.sourceItemId);if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền dự án.");const source=await first(`SELECT id,contract_material_name AS contractMaterialName FROM boq_source_items WHERE id=? AND project_id=? AND active=1`,sourceItemId,projectId);if(!source)throw new Error("Không tìm thấy dòng BOQ nguồn.");await env.DB.prepare(`UPDATE boq_source_items SET mapping_status='new_material_requested',updated_at=? WHERE id=?`).bind(stamp,sourceItemId).run();await audit(user.id,"REQUEST_NEW_MATERIAL","boq_source_item",sourceItemId,null,{projectId,contractMaterialName:source.contractMaterialName,note:clean(payload.note)},request);return{message:"Đã ghi nhận đề nghị tạo mã vật tư gốc mới. Hệ thống chưa tự tạo Material Master."};
    }

    if (action === "replace_boq_items") {
      const projectId=clean(payload.projectId);if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền cập nhật BOQ dự án này.");
      const rows=Array.isArray(payload.rows)?payload.rows:[];if(!rows.length)throw new Error("File BOQ không có dòng dữ liệu.");if(rows.length>5000)throw new Error("Mỗi lần nhập tối đa 5.000 dòng BOQ.");
      const importMode=["new_version","append","merge","replace_version"].includes(clean(payload.importMode))?clean(payload.importMode):"new_version";const baseCtx=await resolveContractContext(projectId,clean(payload.contractId),"",{requireVersion:false}),contractId=clean(baseCtx.contract.id);const catalog=await all(`SELECT id,code,name,system,unit FROM materials WHERE active=1`),byCode=new Map(catalog.map((r)=>[clean(r.code).toUpperCase(),r]));
      let version=null,batch=null,versionNo=0,boqVersionId="",batchId="",startOrder=0;let existing=[];
      if(importMode==="new_version"){
        const current=await first(`SELECT COALESCE(MAX(version_no),0) AS maxVersion FROM boq_versions WHERE contract_id=?`,contractId);versionNo=Number(current?.maxVersion||0)+1;boqVersionId=id("BQVER");const versionCode=clean(payload.versionCode)||`V${versionNo}`,versionName=clean(payload.versionName)||`BOQ ${versionCode}`,revisionType=["original","revision","addendum"].includes(clean(payload.revisionType))?clean(payload.revisionType):(versionNo===1?"original":"revision");
        await env.DB.batch([env.DB.prepare(`UPDATE boq_versions SET active=0,status=CASE WHEN status='active' THEN 'superseded' ELSE status END,updated_at=? WHERE contract_id=? AND active=1`).bind(stamp,contractId),env.DB.prepare(`UPDATE boq_import_batches SET active=0,updated_at=? WHERE contract_id=? AND active=1`).bind(stamp,contractId),env.DB.prepare(`INSERT INTO boq_versions(id,project_id,contract_id,version_no,version_code,version_name,revision_type,source_file_name,status,active,effective_at,approved_at,created_by,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(boqVersionId,projectId,contractId,versionNo,versionCode,versionName,revisionType,clean(payload.sourceFileName)||null,"active",1,clean(payload.effectiveAt)||stamp,null,user.id,stamp,stamp)]);version=await first(`SELECT id,project_id AS projectId,contract_id AS contractId,version_no AS versionNo,version_code AS versionCode,version_name AS versionName,status,active FROM boq_versions WHERE id=?`,boqVersionId);batch=await ensureBoqBatch(projectId,contractId,version,user.id,clean(payload.sourceFileName)||"import");batchId=clean(batch.id);
      }else{
        const ctx=await resolveContractContext(projectId,contractId,clean(payload.boqVersionId),{requireVersion:true});version=ctx.version;boqVersionId=clean(version.id);versionNo=Number(version.versionNo||0);if(clean(version.status)==="archived")throw new Error("Phiên bản BOQ đang được lưu trữ. Hãy khôi phục trước khi cập nhật.");batch=await ensureBoqBatch(projectId,contractId,version,user.id,clean(payload.sourceFileName)||"import");batchId=clean(batch.id);existing=await all(`SELECT * FROM boq_source_items WHERE project_id=? AND contract_id=? AND boq_version_id=? AND active=1 ORDER BY source_order,id`,projectId,contractId,boqVersionId);const max=existing.reduce((m,r)=>Math.max(m,Number(r.source_order||0)),0);startOrder=importMode==="append"?max:0;
        if(importMode==="replace_version"){const dep=await boqVersionDependencySummary(projectId,contractId,boqVersionId);if(dep.total>0)throw new Error(`Phiên bản ${version.versionCode} đã phát sinh ${dep.total} liên kết ĐNMH/PO/Nhập kho. Không được thay thế trực tiếp; hãy nhập thành phiên bản BOQ mới.`);if(clean(payload.confirmText)!==`THAY ${clean(version.versionCode)}`)throw new Error(`Xác nhận thay thế chưa đúng. Hãy nhập “THAY ${clean(version.versionCode)}”.`);await env.DB.batch([env.DB.prepare(`UPDATE boq_source_items SET active=0,updated_at=? WHERE project_id=? AND contract_id=? AND boq_version_id=? AND active=1`).bind(stamp,projectId,contractId,boqVersionId),env.DB.prepare(`UPDATE project_boq_items SET active=0,updated_at=? WHERE project_id=? AND contract_id=? AND boq_version_id=? AND active=1`).bind(stamp,projectId,contractId,boqVersionId)]);await logBoqChange({projectId,contractId,boqVersionId,actionType:"REPLACE_VERSION",before:{rowCount:existing.length},after:{rowCount:rows.length},reason:clean(payload.reason)||"Thay file BOQ nhập sai",actorUserId:user.id});existing=[];startOrder=0;}
      }
      const byLineRef=new Map(existing.filter(r=>clean(r.contract_line_ref)).map(r=>[clean(r.contract_line_ref).toLowerCase(),r])),byBoqCode=new Map(existing.filter(r=>clean(r.boq_code)).map(r=>[clean(r.boq_code).toLowerCase(),r])),byOrder=new Map(existing.map(r=>[Number(r.source_order||0),r]));let inserted=0,updated=0,explicitMapped=0;
      for(const[index,row]of rows.entries()){
        const fileOrder=Math.trunc(numberValue(row.sourceOrder))||index+1;let target=null;if(importMode==="merge"){const ref=clean(row.contractLineRef||row.lineNo).toLowerCase(),bc=clean(row.boqCode).toLowerCase();target=(ref&&byLineRef.get(ref))||(bc&&byBoqCode.get(bc))||byOrder.get(fileOrder)||null;}
        const sourceOrder=target?Number(target.source_order||fileOrder):startOrder+index+1,rowRole=inferBoqRowRole(row),itemType=clean(row.itemType)==="outside_contract"?"outside_contract":"contract",contractMaterialName=String(row.contractMaterialName??row.materialName??""),unit=String(row.unit??""),internalCode=clean(row.internalMaterialCode).toUpperCase(),contractQty=numberValue(row.contractQty),remeasuredQty=row.remeasuredQty===undefined||row.remeasuredQty===null||clean(row.remeasuredQty)===""?contractQty:numberValue(row.remeasuredQty),unitPrice=strictNonNegativeNumber(row.unitPrice??0,`Dòng ${index+1}: Đơn giá hợp đồng`);if(contractQty<0||remeasuredQty<0)throw new Error(`Dòng ${index+1}: khối lượng không được âm.`);
        const explicitMaterialId=clean(row.materialId);let mapped=null;if((internalCode||explicitMaterialId)&&["material","component"].includes(rowRole)){mapped=explicitMaterialId?catalog.find((m)=>clean(m.id)===explicitMaterialId):byCode.get(internalCode);if(!mapped)throw new Error(`Dòng ${index+1}: Mã vật tư gốc nhập rõ không tồn tại/không hoạt động.`);explicitMapped+=1;}
        if(target){
          const oldPbiId=clean(target.project_boq_item_id),oldMapped=clean(target.mapped_material_id);if(mapped&&oldPbiId&&oldMapped&&clean(mapped.id)!==oldMapped){const dep=await boqItemDependencySummary(oldPbiId);if(dep.total>0)throw new Error(`Dòng ${index+1}: mapping cũ đã phát sinh ${dep.total} liên kết nghiệp vụ. Không thể đổi Mã vật tư gốc bằng Merge; hãy tạo BOQ Version mới.`);}
          const finalMapped=mapped||(oldMapped?catalog.find(m=>clean(m.id)===oldMapped):null),mappingStatus=finalMapped?(mapped?"mapped_explicit":clean(target.mapping_status)||"confirmed"):"unmapped",sys=canonicalMeCode((!clean(row.systemCode)||canonicalMeCode(row.systemCode)==="KHAC")&&finalMapped?.system?finalMapped.system:row.systemCode);await env.DB.prepare(`UPDATE boq_source_items SET source_row=?,contract_line_ref=?,row_role=?,boq_code=?,contract_code=?,contract_material_code=?,approved_material_code=?,contract_material_name=?,unit=?,contract_qty=?,remeasured_qty=?,unit_price=?,item_type=?,note=?,source_system_code=?,source_subgroup_name=?,mapped_material_id=?,standard_material_name_snapshot=?,mapping_status=?,mapped_by=?,mapped_at=?,updated_at=? WHERE id=?`).bind(numberValue(row.sourceRow)||target.source_row||null,clean(row.contractLineRef||row.lineNo)||null,rowRole,clean(row.boqCode)||null,clean(row.contractCode)||null,String(row.contractMaterialCode??"")||null,String(row.approvedMaterialCode??"")||null,contractMaterialName||null,unit||null,contractQty,remeasuredQty,unitPrice,itemType,String(row.note??"")||null,sys||"KHAC",String(row.subgroupName??"")||null,finalMapped?.id||null,finalMapped?.name||null,mappingStatus,mapped?user.id:target.mapped_by||null,mapped?stamp:target.mapped_at||null,stamp,target.id).run();
          let pbiId=oldPbiId;if(["material","component"].includes(rowRole)&&finalMapped){const variationStatus=itemType==="outside_contract"||Math.abs(remeasuredQty-contractQty)>1e-9?"pending":"none";if(pbiId)await env.DB.prepare(`UPDATE project_boq_items SET line_no=?,source_order=?,contract_line_ref=?,row_role=?,boq_code=?,contract_code=?,contract_material_code=?,approved_material_code=?,item_type=?,material_id=?,description=?,contract_qty=?,remeasured_qty=?,unit_price=?,variation_status=?,note=?,active=1,updated_at=? WHERE id=?`).bind(sourceOrder,sourceOrder,clean(row.contractLineRef||row.lineNo)||null,rowRole,clean(row.boqCode)||null,clean(row.contractCode)||null,String(row.contractMaterialCode??"")||null,String(row.approvedMaterialCode??"")||null,itemType,finalMapped.id,contractMaterialName||null,contractQty,remeasuredQty,unitPrice,variationStatus,String(row.note??"")||null,stamp,pbiId).run();else{pbiId=id("BOQ");await env.DB.prepare(`INSERT INTO project_boq_items(id,project_id,contract_id,boq_version_id,source_item_id,line_no,source_order,contract_line_ref,row_role,parent_source_order,outline_level,source_sheet,source_row,boq_code,contract_code,contract_material_code,approved_material_code,item_type,material_id,description,contract_qty,remeasured_qty,unit_price,variation_status,note,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(pbiId,projectId,contractId,boqVersionId,target.id,sourceOrder,sourceOrder,clean(row.contractLineRef||row.lineNo)||null,rowRole,null,0,null,numberValue(row.sourceRow)||null,clean(row.boqCode)||null,clean(row.contractCode)||null,String(row.contractMaterialCode??"")||null,String(row.approvedMaterialCode??"")||null,itemType,finalMapped.id,contractMaterialName||null,contractQty,remeasuredQty,unitPrice,variationStatus,String(row.note??"")||null,1,stamp,stamp).run();await env.DB.prepare(`UPDATE boq_source_items SET project_boq_item_id=? WHERE id=?`).bind(pbiId,target.id).run();}}else if(oldPbiId){const dep=await boqItemDependencySummary(oldPbiId);if(dep.total>0)throw new Error(`Dòng ${index+1}: không thể đổi dòng đã phát sinh nghiệp vụ thành tiêu đề/mô tả.`);await env.DB.prepare(`UPDATE project_boq_items SET active=0,updated_at=? WHERE id=?`).bind(stamp,oldPbiId).run();}
          const after=await first(`SELECT * FROM boq_source_items WHERE id=?`,target.id);await logBoqChange({projectId,contractId,boqVersionId,sourceItemId:target.id,projectBoqItemId:pbiId,actionType:"MERGE_UPDATE",before:target,after,reason:clean(payload.reason)||"Import cập nhật/Merge",actorUserId:user.id});updated+=1;continue;
        }
        const sourceId=id("BQS"),sys=canonicalMeCode((!clean(row.systemCode)||canonicalMeCode(row.systemCode)==="KHAC")&&mapped?.system?mapped.system:row.systemCode),rawJson=JSON.stringify(row.rawSource&&typeof row.rawSource==="object"?row.rawSource:{});let pbiId=null,mappingStatus="unmapped";if(mapped&&["material","component"].includes(rowRole)){mappingStatus="mapped_explicit";pbiId=id("BOQ");const variationStatus=itemType==="outside_contract"||Math.abs(remeasuredQty-contractQty)>1e-9?"pending":"none";await env.DB.prepare(`INSERT INTO project_boq_items(id,project_id,contract_id,boq_version_id,source_item_id,line_no,source_order,contract_line_ref,row_role,parent_source_order,outline_level,source_sheet,source_row,boq_code,contract_code,contract_material_code,approved_material_code,item_type,material_id,description,contract_qty,remeasured_qty,unit_price,variation_status,note,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(pbiId,projectId,contractId,boqVersionId,null,sourceOrder,sourceOrder,clean(row.contractLineRef||row.lineNo)||null,rowRole,null,0,null,numberValue(row.sourceRow)||null,clean(row.boqCode)||null,clean(row.contractCode)||null,String(row.contractMaterialCode??"")||null,String(row.approvedMaterialCode??"")||null,itemType,mapped.id,contractMaterialName||null,contractQty,remeasuredQty,unitPrice,variationStatus,String(row.note??"")||null,1,stamp,stamp).run();}
        await env.DB.prepare(`INSERT INTO boq_source_items(id,batch_id,project_id,contract_id,boq_version_id,source_order,source_row,contract_line_ref,row_role,boq_code,contract_code,contract_material_code,approved_material_code,contract_material_name,unit,contract_qty,remeasured_qty,unit_price,item_type,note,source_system_code,source_subgroup_name,raw_source_json,mapped_material_id,standard_material_name_snapshot,mapping_status,project_boq_item_id,mapped_by,mapped_at,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(sourceId,batchId,projectId,contractId,boqVersionId,sourceOrder,numberValue(row.sourceRow)||null,clean(row.contractLineRef||row.lineNo)||null,rowRole,clean(row.boqCode)||null,clean(row.contractCode)||null,String(row.contractMaterialCode??"")||null,String(row.approvedMaterialCode??"")||null,contractMaterialName||null,unit||null,contractQty,remeasuredQty,unitPrice,itemType,String(row.note??"")||null,sys||"KHAC",String(row.subgroupName??"")||null,rawJson,mapped?.id||null,mapped?.name||null,mappingStatus,pbiId,mapped?user.id:null,mapped?stamp:null,1,stamp,stamp).run();if(pbiId)await env.DB.prepare(`UPDATE project_boq_items SET source_item_id=? WHERE id=?`).bind(sourceId,pbiId).run();await logBoqChange({projectId,contractId,boqVersionId,sourceItemId:sourceId,projectBoqItemId:pbiId,actionType:"IMPORT_CREATE",before:null,after:{sourceOrder,rowRole,contractMaterialName,unit,contractQty,systemCode:sys,mappedMaterialId:mapped?.id||null},reason:`Import ${importMode}`,actorUserId:user.id});inserted+=1;
      }
      const activeCount=await first(`SELECT COUNT(*) AS count FROM boq_source_items WHERE batch_id=? AND active=1`,batchId);await env.DB.prepare(`UPDATE boq_import_batches SET source_file_name=?,row_count=?,active=?,updated_at=? WHERE id=?`).bind(clean(payload.sourceFileName)||null,Number(activeCount?.count||0),Number(version?.active||0)===1?1:0,stamp,batchId).run();await env.DB.prepare(`UPDATE boq_versions SET source_file_name=?,updated_at=? WHERE id=?`).bind(clean(payload.sourceFileName)||null,stamp,boqVersionId).run();await audit(user.id,"IMPORT_SOURCE","project_boq",projectId,null,{contractId,boqVersionId,batchId,versionNo,importMode,rowCount:rows.length,inserted,updated,explicitMapped,sourceFileName:clean(payload.sourceFileName)},request);return{message:`Đã nhập BOQ ${baseCtx.contract.contractNo} · ${clean(version?.versionCode)||`V${versionNo}`}: ${inserted} dòng mới, ${updated} dòng cập nhật; ${explicitMapped} dòng có Mã vật tư gốc.`,contractId,boqVersionId,batchId,versionNo,inserted,updated};
    }

    if(action==="update_boq_contract_prices"){const projectId=clean(payload.projectId);if(!(await canAccessProject(user,projectId,true)))throw new Error("Không có quyền cập nhật BOQ dự án này.");if(!isAdmin(user)&&!(await canUseModule(user,"boq","canEdit")))throw new Error("Chưa được cấp quyền sửa BOQ/Hợp đồng.");const ctx=await resolveContractContext(projectId,clean(payload.contractId),clean(payload.boqVersionId),{requireVersion:true}),updates=Array.isArray(payload.updates)?payload.updates:[];if(!updates.length)throw new Error("File không có đơn giá hợp đồng để cập nhật.");if(updates.length>5000)throw new Error("Mỗi lần cập nhật tối đa 5.000 dòng.");const ids=updates.map(row=>clean(row.boqItemId));if(ids.some(v=>!v))throw new Error("File cập nhật giá có dòng thiếu Mã dòng BOQ.");if(new Set(ids).size!==ids.length)throw new Error("File cập nhật giá có Mã dòng BOQ bị trùng.");const before=await all(`SELECT id,unit_price AS unitPrice FROM project_boq_items WHERE project_id=? AND contract_id=? AND boq_version_id=? AND row_role IN ('material','component')`,projectId,ctx.contract.id,ctx.version.id),beforeMap=new Map(before.map(row=>[row.id,Number(row.unitPrice||0)]));const batchId=id("BPIB"),sourceFileName=clean(payload.sourceFileName)||null,statements=[];let changed=0;const prepared=[];for(const[index,row]of updates.entries()){const boqItemId=clean(row.boqItemId),unitPrice=strictNonNegativeNumber(row.unitPrice,`Dòng ${index+1}: Đơn giá hợp đồng`);if(!beforeMap.has(boqItemId))throw new Error(`Dòng ${index+1}: Mã dòng BOQ không thuộc Contract/BOQ Version hiện tại.`);const oldPrice=Number(beforeMap.get(boqItemId)||0),isChanged=Math.abs(oldPrice-unitPrice)>1e-9;if(isChanged)changed+=1;prepared.push({boqItemId,unitPrice,oldPrice,isChanged});}statements.push(env.DB.prepare(`INSERT INTO boq_price_import_batches (id,project_id,source_file_name,price_type,row_count,changed_count,unchanged_count,updated_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)`).bind(batchId,projectId,sourceFileName,"contract_and_approved_variation",updates.length,changed,updates.length-changed,user.id,stamp));for(const row of prepared){statements.push(env.DB.prepare(`INSERT INTO boq_price_import_items (id,batch_id,boq_item_id,old_unit_price,new_unit_price,changed,created_at) VALUES (?,?,?,?,?,?,?)`).bind(id("BPII"),batchId,row.boqItemId,row.oldPrice,row.unitPrice,row.isChanged?1:0,stamp));statements.push(env.DB.prepare(`UPDATE project_boq_items SET unit_price=?,updated_at=? WHERE id=? AND project_id=? AND contract_id=? AND boq_version_id=? AND row_role IN ('material','component')`).bind(row.unitPrice,stamp,row.boqItemId,projectId,ctx.contract.id,ctx.version.id));}await env.DB.batch(statements);await audit(user.id,"UPDATE_PRICE","project_boq",projectId,null,{contractId:ctx.contract.id,boqVersionId:ctx.version.id,batchId,rowCount:updates.length,changedCount:changed,unchangedCount:updates.length-changed,sourceFileName,priceType:"contract_and_approved_variation",orderKey:"boq_item_id"},request);return{message:`Đã cập nhật ${changed} dòng đơn giá; ${updates.length-changed} dòng không đổi. Nhật ký chi tiết: ${batchId}.`};}
    if (action === "save_user_access") {
        requireRole(user,["admin"]); const targetUserId=clean(payload.userId); if(!targetUserId) throw new Error("Thiếu tài khoản cần phân quyền.");
        const target=await first(`SELECT u.id,u.role,u.department,COALESCE(rc.base_role,u.role) AS roleBase FROM users u LEFT JOIN role_catalog rc ON rc.code=u.role WHERE u.id=?`,targetUserId); if(!target) throw new Error("Không tìm thấy tài khoản.");
        const projectScopes=Array.isArray(payload.projectScopes)?payload.projectScopes:[]; const warehouseScopes=Array.isArray(payload.warehouseScopes)?payload.warehouseScopes:[]; const moduleRows=Array.isArray(payload.modulePermissions)?payload.modulePermissions:[]; const stamp=now();
        const statements=[env.DB.prepare(`DELETE FROM user_project_scopes WHERE user_id=?`).bind(targetUserId),env.DB.prepare(`DELETE FROM user_warehouse_scopes WHERE user_id=?`).bind(targetUserId),env.DB.prepare(`DELETE FROM user_module_permissions WHERE user_id=?`).bind(targetUserId)];
        for(const row of projectScopes){const projectId=clean(row.projectId),permission=clean(row.permission||"read");if(projectId)statements.push(env.DB.prepare(`INSERT INTO user_project_scopes(id,user_id,project_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).bind(id("SCOPE"),targetUserId,projectId,permission,stamp,stamp));}
        for(const row of warehouseScopes){const warehouseId=clean(row.warehouseId),permission=clean(row.permission||"read");if(warehouseId)statements.push(env.DB.prepare(`INSERT INTO user_warehouse_scopes(id,user_id,warehouse_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).bind(id("UWS"),targetUserId,warehouseId,permission,stamp,stamp));}
        for(const row of moduleRows){const moduleKey=clean(row.moduleKey);if(!MODULE_KEYS.includes(moduleKey)||moduleKey==="admin")continue;const submitted={canView:row.canView?1:0,canUse:row.canUse?1:0,canCreate:row.canCreate?1:0,canEdit:row.canEdit?1:0,canApprove:row.canApprove?1:0,canExport:row.canExport?1:0};const defaults=defaultDepartmentPermission(target,moduleKey);const keys=["canView","canUse","canCreate","canEdit","canApprove","canExport"];const differs=keys.some((key)=>submitted[key]!==defaults[key]);const hasAny=keys.some((key)=>submitted[key]);const source=differs?"manual_override":"department_default";if(!hasAny&&!Object.values(defaults).some(Number)&&!differs)continue;const expiresAt=source==="manual_override"&&clean(row.permissionExpiresAt)?clean(row.permissionExpiresAt):null;statements.push(env.DB.prepare(`INSERT INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("UMP"),targetUserId,moduleKey,submitted.canView,submitted.canUse,submitted.canCreate,submitted.canEdit,submitted.canApprove,submitted.canExport,expiresAt,source,stamp,stamp));}
        await env.DB.batch(statements); await audit(user.id,"PERMISSION","user",targetUserId,null,{projectScopes:projectScopes.length,warehouseScopes:warehouseScopes.length,moduleRows:moduleRows.length,model:"department_default+manual_override"},request); return {message:"Đã lưu quyền hiệu lực: mặc định phòng + ngoại lệ cá nhân."};
    }
    if (action === "delete_user_module_override") {
        requireRole(user,["admin"]); const targetUserId=clean(payload.userId),moduleKey=clean(payload.moduleKey); if(!targetUserId||!MODULE_KEYS.includes(moduleKey)||moduleKey==="admin") throw new Error("Ngoại lệ cá nhân không hợp lệ.");
        const old=await first(`SELECT * FROM user_module_permissions WHERE user_id=? AND module_key=? AND permission_source='manual_override'`,targetUserId,moduleKey); if(!old) throw new Error("Không tìm thấy ngoại lệ cá nhân cần xóa.");
        await env.DB.prepare(`DELETE FROM user_module_permissions WHERE user_id=? AND module_key=? AND permission_source='manual_override'`).bind(targetUserId,moduleKey).run();
        await audit(user.id,"DELETE_OVERRIDE","user_module_permission",`${targetUserId}:${moduleKey}`,old,null,request); return {message:"Đã xóa ngoại lệ cá nhân; quyền hiệu lực quay về mặc định của phòng/bộ phận."};
    }
    if (action === "update_user") {
        requireRole(user, ["admin"]);
        const targetUserId = clean(payload.userId);
        const target = await first(`SELECT id,role,username,department,organization_unit_id AS organizationUnitId FROM users WHERE id=?`, targetUserId);
        if (!target)
            throw new Error("Không tìm thấy tài khoản.");
        const employeeCode = clean(payload.employeeCode);
        const fullName = clean(payload.fullName);
        const username = clean(payload.username).toLowerCase();
        const email = clean(payload.email).toLowerCase() || null;
        const role = canonicalRoleCode(payload.role);
        const active = payload.active === true || ["1", "true", "on"].includes(clean(payload.active).toLowerCase());
        const roleRow = await first(`SELECT code,base_role AS baseRole,default_organization_unit_id AS defaultOrganizationUnitId,active FROM role_catalog WHERE code=?`, role);
        if (!roleRow || Number(roleRow.active) !== 1)
            throw new Error("Vai trò không tồn tại hoặc đang bị ẩn trong danh mục.");
        let organization = await resolveOrganizationUnit(payload.organizationUnitId || payload.department);
        if (!organization && clean(roleRow.defaultOrganizationUnitId)) organization = await resolveOrganizationUnit(roleRow.defaultOrganizationUnitId);
        if (!organization) organization = await resolveOrganizationUnit(organizationCodeForBaseRole(roleRow.baseRole));
        const department = clean(organization?.name);
        if (!employeeCode || !fullName || !username || !organization || !department)
            throw new Error("Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc.");
        if (targetUserId === user.id && !active)
            throw new Error("Không thể tự khóa tài khoản quản trị đang đăng nhập.");
        if (clean(target.role) === "admin" && role !== "admin") {
            const admins = await first(`SELECT COUNT(*) AS count FROM users WHERE role='admin' AND active=1`);
            if (Number(admins?.count || 0) <= 1)
                throw new Error("Hệ thống phải còn ít nhất một tài khoản Quản trị hệ thống đang hoạt động.");
        }
        await env.DB.prepare(`UPDATE users SET employee_code=?,full_name=?,username=?,email=?,role=?,department=?,organization_unit_id=?,approval_limit=?,active=?,updated_at=? WHERE id=?`).bind(employeeCode, fullName, username, email, role, department, organization.id, numberValue(payload.approvalLimit), active ? 1 : 0, stamp, targetUserId).run();
        if(clean(target.department)!==department || clean(target.role)!==role) await replaceDepartmentDefaults(targetUserId);
        if(!active)await env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(targetUserId).run();
        const newPassword = clean(payload.newPassword);
        if (newPassword) {
            const passwordError = passwordPolicyError(newPassword);
            if (passwordError) throw new Error(passwordError);
            await env.DB.prepare(`UPDATE users SET password_hash=?,updated_at=? WHERE id=?`).bind(await hashPassword(newPassword), stamp, targetUserId).run();
        }
        await audit(user.id, "UPDATE", "user", targetUserId, target, { employeeCode, fullName, username, email, role, department, organizationUnitId: organization.id, active, passwordReset: Boolean(newPassword) }, request);
        return { message: `Đã cập nhật tài khoản ${username}${newPassword ? " và đặt lại mật khẩu" : ""}.` };
    }
    if (action === "reset_user_password") {
        requireRole(user,["admin"]);
        const targetUserId=clean(payload.userId);
        const target=await first(`SELECT id,username,full_name AS fullName,role,active FROM users WHERE id=?`,targetUserId);
        if(!target)throw new Error("Không tìm thấy tài khoản.");
        if(!Number(target.active))throw new Error("Tài khoản đang bị khóa. Hãy mở khóa trước khi reset mật khẩu.");
        const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        const random=new Uint8Array(14);crypto.getRandomValues(random);let body="";for(const b of random)body+=alphabet[b%alphabet.length];
        let temporaryPassword=`Vn@${body}9`;
        const testMode=["test","development","dev"].includes(clean(process.env.DEPLOYMENT_MODE||env.DEPLOYMENT_MODE).toLowerCase());
        if(testMode&&payload.useTestDefault===true)temporaryPassword="Admin123456@";
        const stamp=now();
        await env.DB.batch([
          env.DB.prepare(`UPDATE users SET password_hash=?,must_change_password=1,password_reset_at=?,password_reset_by=?,updated_at=? WHERE id=?`).bind(await hashPassword(temporaryPassword),stamp,user.id,stamp,targetUserId),
          env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(targetUserId)
        ]);
        await audit(user.id,"PASSWORD_RESET","user",targetUserId,null,{mustChangePassword:true,sessionsRevoked:true,temporaryPasswordExposedOnce:true},request);
        return{message:`Đã reset mật khẩu cho ${target.username}. Người dùng bắt buộc đổi mật khẩu khi đăng nhập lại.`,temporaryPassword,mustChangePassword:true};
    }
    if(action==="set_user_status"){requireRole(user,["admin"]);const targetUserId=clean(payload.userId),active=payload.active===true||["1","true","on"].includes(clean(payload.active).toLowerCase());const target=await first(`SELECT id,username,full_name AS fullName,role,active FROM users WHERE id=?`,targetUserId);if(!target)throw new Error("Không tìm thấy tài khoản.");if(targetUserId===user.id&&!active)throw new Error("Không thể tự khóa tài khoản Quản trị viên đang đăng nhập.");if(clean(target.role)==="admin"&&!active&&Number(target.active||0)===1){const admins=await first(`SELECT COUNT(*) AS count FROM users WHERE role='admin' AND active=1`);if(Number(admins?.count||0)<=1)throw new Error("Hệ thống phải còn ít nhất một tài khoản Quản trị viên đang hoạt động.");}await env.DB.prepare(`UPDATE users SET active=?,updated_at=? WHERE id=?`).bind(active?1:0,stamp,targetUserId).run();if(!active)await env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(targetUserId).run();await audit(user.id,active?"UNLOCK":"LOCK","user",targetUserId,target,{active,sessionsRevoked:!active},request);return{message:active?`Đã mở khóa tài khoản ${target.username}.`:`Đã khóa tài khoản ${target.username} và đăng xuất toàn bộ thiết bị.`};}
    if(action==="delete_user"){requireRole(user,["admin"]);const targetUserId=clean(payload.userId);const target=await first(`SELECT id,username,full_name AS fullName,role,active FROM users WHERE id=?`,targetUserId);if(!target)throw new Error("Không tìm thấy tài khoản.");if(targetUserId===user.id||clean(target.role)==="admin")throw new Error("Không được xóa tài khoản Quản trị viên. Có thể quản lý Quản trị viên khác bằng quy trình khóa/mở khóa.");if(Number(target.active||0)===1)throw new Error("Hãy khóa tài khoản trước khi xóa để tránh thao tác nhầm.");const historyChecks=[
      [`SELECT COUNT(*) AS count FROM projects WHERE manager_user_id=?`,1],[`SELECT COUNT(*) AS count FROM company_settings WHERE updated_by=?`,1],[`SELECT COUNT(*) AS count FROM warehouses WHERE keeper_user_id=?`,1],[`SELECT COUNT(*) AS count FROM teams WHERE leader_user_id=?`,1],[`SELECT COUNT(*) AS count FROM material_aliases WHERE created_by=?`,1],[`SELECT COUNT(*) AS count FROM material_code_history WHERE changed_by=?`,1],[`SELECT COUNT(*) AS count FROM material_requests WHERE requested_by=?`,1],[`SELECT COUNT(*) AS count FROM approvals WHERE approver_user_id=?`,1],[`SELECT COUNT(*) AS count FROM email_settings WHERE updated_by=?`,1],[`SELECT COUNT(*) AS count FROM request_comments WHERE user_id=?`,1],[`SELECT COUNT(*) AS count FROM purchase_orders WHERE buyer_user_id=?`,1],[`SELECT COUNT(*) AS count FROM purchase_order_items WHERE closed_by=?`,1],[`SELECT COUNT(*) AS count FROM central_returns WHERE requested_by=? OR approved_by=? OR received_by=?`,3],[`SELECT COUNT(*) AS count FROM goods_receipts WHERE received_by=? OR bch_confirmed_by=?`,2],[`SELECT COUNT(*) AS count FROM supply_workflow_steps WHERE completed_by=?`,1],[`SELECT COUNT(*) AS count FROM stock_movements WHERE posted_by=?`,1],[`SELECT COUNT(*) AS count FROM stock_issues WHERE issued_by=? OR approved_by=?`,2],[`SELECT COUNT(*) AS count FROM material_returns WHERE received_by=?`,1],[`SELECT COUNT(*) AS count FROM stock_counts WHERE approved_by=?`,1],[`SELECT COUNT(*) AS count FROM attachments WHERE uploaded_by=?`,1],[`SELECT COUNT(*) AS count FROM audit_logs WHERE user_id=?`,1],[`SELECT COUNT(*) AS count FROM ui_display_settings WHERE updated_by=?`,1]
    ];for(const[sql,parameterCount]of historyChecks){const usage=await first(sql,...Array(parameterCount).fill(targetUserId));if(Number(usage?.count||0)>0)throw new Error("Tài khoản đã có lịch sử nghiệp vụ nên không được xóa. Hãy giữ ở trạng thái Đã khóa để bảo toàn người lập/người duyệt trên chứng từ.");}await env.DB.batch([env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(targetUserId),env.DB.prepare(`DELETE FROM user_project_scopes WHERE user_id=?`).bind(targetUserId),env.DB.prepare(`DELETE FROM user_module_permissions WHERE user_id=?`).bind(targetUserId),env.DB.prepare(`DELETE FROM users WHERE id=?`).bind(targetUserId)]);await audit(user.id,"DELETE","user",targetUserId,target,null,request);return{message:`Đã xóa tài khoản chưa phát sinh ${target.username}.`};}

    if (action === "bulk_import_users") {
        requireRole(user, ["admin"]);
        const rows = Array.isArray(payload.rows) ? payload.rows : [];
        if (!rows.length) throw new Error("File không có tài khoản để nhập.");
        if (rows.length > 500) throw new Error("Mỗi lần import tối đa 500 tài khoản.");
        const normalized = rows.map((input, index) => {
            const rowNo = Number(input.rowNo) || index + 1;
            const username = clean(input.username).toLowerCase();
            const fullName = clean(input.fullName);
            const role = canonicalRoleCode(input.role);
            const department = clean(input.department);
            if (!fullName) throw new Error(`Dòng ${rowNo} · Cột “Họ và tên”: bắt buộc nhập.`);
            if (!username) throw new Error(`Dòng ${rowNo} · Cột “Tên đăng nhập”: bắt buộc nhập.`);
            if (!/^[a-z0-9._-]{3,64}$/.test(username)) throw new Error(`Dòng ${rowNo} · Cột “Tên đăng nhập”: chỉ nhận 3–64 ký tự a-z, số, dấu chấm, gạch dưới hoặc gạch ngang.`);
            if (!role) throw new Error(`Dòng ${rowNo} · Cột “Mã chức danh”: bắt buộc nhập.`);
            if (!department) throw new Error(`Dòng ${rowNo} · Cột “Phòng/Bộ phận”: bắt buộc chọn đơn vị trong danh mục tổ chức.`);
            let grantRows;
            let active;
            try { grantRows = parseBulkPermissionSpec(input.grantSpec); }
            catch (error) { throw new Error(`Dòng ${rowNo} · Cột “Ngoại lệ quyền cấp thêm”: ${error instanceof Error ? error.message : "không hợp lệ."}`); }
            try { active = normalizeBulkStatus(input.status); }
            catch (error) { throw new Error(`Dòng ${rowNo} · Cột “Trạng thái”: ${error instanceof Error ? error.message : "không hợp lệ."}`); }
            const revokeModules = splitBulkList(input.revokeSpec);
            for (const moduleKey of revokeModules) if (!MODULE_KEYS.includes(moduleKey) || moduleKey === "admin") throw new Error(`Dòng ${rowNo} · Cột “Ngoại lệ quyền thu hồi”: mã module không hợp lệ ${moduleKey}.`);
            return {
                ...input,
                rowNo,
                username,
                fullName,
                role,
                email: clean(input.email).toLowerCase() || null,
                employeeCode: clean(input.employeeCode),
                department,
                password: clean(input.password),
                projectCodes: splitBulkList(input.projectCodes).map((value) => value.toUpperCase()),
                warehouseCodes: splitBulkList(input.warehouseCodes).map((value) => value.toUpperCase()),
                grantRows,
                revokeModules,
                active,
            };
        });
        const duplicateUsername = normalized.find((row, index) => normalized.findIndex((candidate) => candidate.username === row.username) !== index);
        if (duplicateUsername) throw new Error(`Dòng ${duplicateUsername.rowNo} · Cột “Tên đăng nhập”: trùng ${duplicateUsername.username} trong cùng file.`);
        const duplicateEmployee = normalized.find((row, index) => row.employeeCode && normalized.findIndex((candidate) => candidate.employeeCode === row.employeeCode) !== index);
        if (duplicateEmployee) throw new Error(`Dòng ${duplicateEmployee.rowNo} · Cột “Mã nhân viên”: trùng ${duplicateEmployee.employeeCode} trong cùng file.`);

        // Preflight toàn bộ tham chiếu và chính sách trước khi ghi bất kỳ tài khoản nào.
        const prepared = [];
        for (const row of normalized) {
            const roleRow = await first(`SELECT code,base_role AS baseRole,warehouse_scope_kind AS warehouseScopeKind,default_organization_unit_id AS defaultOrganizationUnitId,active FROM role_catalog WHERE code=? AND active=1`, row.role);
            if (!roleRow || row.role === "admin") throw new Error(`Dòng ${row.rowNo} · Cột “Mã chức danh”: ${row.role} không hợp lệ/đã ẩn; tài khoản admin phải tạo thủ công.`);
            const organization = await resolveOrganizationUnit(row.department);
            if (!organization) throw new Error(`Dòng ${row.rowNo} · Cột “Phòng/Bộ phận”: không tìm thấy đơn vị hoạt động ${row.department}.`);
            row.department = clean(organization.name);
            const existing = await first(`SELECT id,username,full_name AS fullName,role,department,active FROM users WHERE username=?`, row.username);
            if (existing && clean(existing.role) === "admin") throw new Error(`Dòng ${row.rowNo} · Cột “Tên đăng nhập”: không cập nhật tài khoản admin ${row.username} bằng Excel.`);
            if (!existing && !row.password) throw new Error(`Dòng ${row.rowNo} · Cột “Mật khẩu”: tài khoản mới ${row.username} bắt buộc có mật khẩu.`);
            if (row.password) {
                const passwordError = passwordPolicyError(row.password);
                if (passwordError) throw new Error(`Dòng ${row.rowNo} · Cột “Mật khẩu”: ${passwordError}`);
            }
            const employeeOwner = row.employeeCode ? await first(`SELECT id,username FROM users WHERE employee_code=?`, row.employeeCode) : null;
            if (employeeOwner && (!existing || String(employeeOwner.id) !== String(existing.id))) throw new Error(`Dòng ${row.rowNo} · Cột “Mã nhân viên”: ${row.employeeCode} đã dùng bởi ${employeeOwner.username}.`);
            const projectRows = [];
            for (const code of row.projectCodes) {
                const projectRow = await first(`SELECT id,code FROM projects WHERE upper(code)=upper(?) AND status='active'`, code);
                if (!projectRow) throw new Error(`Dòng ${row.rowNo} · Cột “Mã dự án”: không tìm thấy dự án hoạt động ${code}.`);
                projectRows.push(projectRow);
            }
            const warehouseRows = [];
            for (const code of row.warehouseCodes) {
                const warehouse = await first(`SELECT id,code,type,project_id AS projectId FROM warehouses WHERE upper(code)=upper(?) AND active=1`, code);
                if (!warehouse) throw new Error(`Dòng ${row.rowNo} · Cột “Mã kho”: không tìm thấy kho hoạt động ${code}.`);
                warehouseRows.push(warehouse);
            }
            if (clean(roleRow.baseRole) === "warehouse") {
                const kind = clean(roleRow.warehouseScopeKind || "site");
                for (const warehouse of warehouseRows) {
                    if (kind === "site" && (String(warehouse.type) !== "site" || !projectRows.some((project) => String(project.id) === String(warehouse.projectId)))) throw new Error(`Dòng ${row.rowNo} · Cột “Mã kho”: Thủ kho dự án chỉ được gán kho thuộc dự án đã chọn.`);
                    if (kind === "central" && String(warehouse.type) !== "central") throw new Error(`Dòng ${row.rowNo} · Cột “Mã kho”: Thủ kho Tổng chỉ được gán Kho Tổng.`);
                }
            }
            prepared.push({ row, roleRow, organization, existing, projectRows, warehouseRows });
        }

        let created = 0;
        let updated = 0;
        for (const item of prepared) {
            const { row, existing, projectRows, warehouseRows, organization } = item;
            const userId = existing?.id || id("USR");
            if (existing) {
                await env.DB.prepare(`UPDATE users SET employee_code=?,full_name=?,email=?,role=?,department=?,organization_unit_id=?,active=?,updated_at=? WHERE id=?`).bind(row.employeeCode, row.fullName, row.email, row.role, row.department, organization.id, row.active, stamp, userId).run();
                if (row.password) await env.DB.prepare(`UPDATE users SET password_hash=?,updated_at=? WHERE id=?`).bind(await hashPassword(row.password), stamp, userId).run();
                if (!row.active) await env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(userId).run();
                updated += 1;
            } else {
                await env.DB.prepare(`INSERT INTO users (id,employee_code,full_name,username,email,password_hash,role,department,organization_unit_id,approval_limit,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(userId, row.employeeCode, row.fullName, row.username, row.email, await hashPassword(row.password), row.role, row.department, organization.id, 0, row.active, stamp, stamp).run();
                created += 1;
            }
            const scopeStatements = [env.DB.prepare(`DELETE FROM user_project_scopes WHERE user_id=?`).bind(userId), env.DB.prepare(`DELETE FROM user_warehouse_scopes WHERE user_id=?`).bind(userId)];
            for (const project of projectRows) scopeStatements.push(env.DB.prepare(`INSERT INTO user_project_scopes(id,user_id,project_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).bind(id("SCOPE"), userId, project.id, "read", stamp, stamp));
            for (const warehouse of warehouseRows) scopeStatements.push(env.DB.prepare(`INSERT INTO user_warehouse_scopes(id,user_id,warehouse_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).bind(id("UWS"), userId, warehouse.id, "read", stamp, stamp));
            await env.DB.batch(scopeStatements);
            await replaceDepartmentDefaults(userId);
            if (clean(row.grantSpec) || clean(row.revokeSpec)) {
                await env.DB.prepare(`DELETE FROM user_module_permissions WHERE user_id=? AND permission_source='manual_override'`).bind(userId).run();
                const permissionStatements = [];
                for (const grant of row.grantRows) permissionStatements.push(env.DB.prepare(`INSERT INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("UMP"), userId, grant.moduleKey, grant.canView, grant.canUse, grant.canCreate, grant.canEdit, grant.canApprove, grant.canExport, null, "manual_override", stamp, stamp));
                for (const moduleKey of row.revokeModules) permissionStatements.push(env.DB.prepare(`INSERT INTO user_module_permissions(id,user_id,module_key,can_view,can_use,can_create,can_edit,can_approve,can_export,permission_expires_at,permission_source,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(id("UMP"), userId, moduleKey, 0, 0, 0, 0, 0, 0, null, "manual_override", stamp, stamp));
                if (permissionStatements.length) await env.DB.batch(permissionStatements);
            }
            await audit(user.id, existing ? "BULK_UPDATE" : "BULK_CREATE", "user", userId, existing || null, { username: row.username, role: row.role, department: row.department, organizationCode: item.organization.code, projects: projectRows.length, warehouses: warehouseRows.length, sourceRow: row.rowNo, sourceFileName: clean(payload.sourceFileName), permissionModel: "department_default+manual_override" }, request);
        }
        return {message:`Import tài khoản hoàn tất: tạo mới ${created}, cập nhật ${updated}. Mật khẩu hiện tại không bao giờ được xuất.`};
    }
    if (action === "create_user") {
        requireRole(user, ["admin"]);
        const username = clean(payload.username).toLowerCase();
        const password = clean(payload.password);
        if (!username) throw new Error("Tên đăng nhập là bắt buộc.");
        const passwordError = passwordPolicyError(password);
        if (passwordError) throw new Error(passwordError);
        const userId = id("USR");
        const role = canonicalRoleCode(payload.role);
        const roleRow = await first(`SELECT code,base_role AS baseRole,warehouse_scope_kind AS warehouseScopeKind,default_organization_unit_id AS defaultOrganizationUnitId,active FROM role_catalog WHERE code=? AND active=1`, role);
        if (!roleRow || role === "admin")
            throw new Error("Vai trò chưa hợp lệ hoặc đang bị ẩn.");
        let organization = await resolveOrganizationUnit(payload.organizationUnitId || payload.department);
        if (!organization && clean(roleRow.defaultOrganizationUnitId)) organization = await resolveOrganizationUnit(roleRow.defaultOrganizationUnitId);
        if (!organization) organization = await resolveOrganizationUnit(organizationCodeForBaseRole(roleRow.baseRole));
        if (!organization) throw new Error("Phòng/bộ phận không tồn tại hoặc đã được lưu trữ.");
        const statements = [env.DB.prepare(`INSERT INTO users (id,employee_code,full_name,username,email,password_hash,role,department,organization_unit_id,approval_limit,active,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(userId, clean(payload.employeeCode), clean(payload.fullName), username, clean(payload.email).toLowerCase() || null, await hashPassword(password), role, clean(organization.name), organization.id, numberValue(payload.approvalLimit), 1, stamp, stamp)];
        const scopes = Array.isArray(payload.projectIds) ? payload.projectIds.map(String) : [];
        for (const projectId of scopes)
            statements.push(env.DB.prepare(`INSERT INTO user_project_scopes (id,user_id,project_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).bind(id("SCOPE"), userId, projectId, "read", stamp, stamp));
        const warehouseIds = Array.isArray(payload.warehouseIds) ? payload.warehouseIds.map(String).filter(Boolean) : [];
        if (clean(roleRow.baseRole) === "warehouse") {
            const kind = clean(roleRow.warehouseScopeKind || "site");
            for (const warehouseId of warehouseIds) {
                const warehouse = await first(`SELECT id,type,project_id AS projectId FROM warehouses WHERE id=? AND active=1`, warehouseId);
                if (!warehouse) throw new Error("Kho được chọn không tồn tại.");
                if (kind === "site" && (String(warehouse.type) !== "site" || !warehouse.projectId || !scopes.includes(String(warehouse.projectId)))) throw new Error("Thủ kho dự án chỉ được gán kho thuộc dự án đã chọn.");
                if (kind === "central" && String(warehouse.type) !== "central") throw new Error("Thủ kho Tổng chỉ được gán Kho Tổng.");
                statements.push(env.DB.prepare(`INSERT INTO user_warehouse_scopes (id,user_id,warehouse_id,permission,created_at,updated_at) VALUES (?,?,?,?,?,?)`).bind(id("UWS"),userId,warehouseId,"read",stamp,stamp));
            }
        }
        await env.DB.batch(statements);
        await replaceDepartmentDefaults(userId);
        await audit(user.id, "CREATE", "user", userId, null, { username, role, organizationUnitId: organization.id, projects: scopes.length, permissionModel: "department_default+manual_override" }, request);
        return { message: `Đã tạo tài khoản ${username} và tự cấp quyền mặc định theo Phòng/Bộ phận.` };
    }
    if (action === "revoke_session") {
        requireRole(user, ["admin"]);
        const sessionId = clean(payload.sessionId);
        if (!sessionId) throw new Error("Thiếu mã phiên đăng nhập.");
        const target = await first(`SELECT s.id,s.user_id AS userId,u.username FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=?`, sessionId);
        if (!target) throw new Error("Phiên đăng nhập không còn tồn tại.");
        await env.DB.prepare(`DELETE FROM sessions WHERE id=?`).bind(sessionId).run();
        await audit(user.id, "REVOKE_SESSION", "session", sessionId, target, null, request);
        return { message: `Đã thu hồi phiên đăng nhập của ${target.username}.` };
    }
    if (action === "revoke_user_sessions") {
        requireRole(user, ["admin"]);
        const targetUserId = clean(payload.userId);
        if (!targetUserId) throw new Error("Thiếu tài khoản cần thu hồi phiên.");
        const target = await first(`SELECT username FROM users WHERE id=?`, targetUserId);
        if (!target) throw new Error("Tài khoản không tồn tại.");
        await env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(targetUserId).run();
        await audit(user.id, "REVOKE_USER_SESSIONS", "user", targetUserId, target, null, request);
        return { message: `Đã đăng xuất toàn bộ thiết bị của ${target.username}.` };
    }
    if (action === "change_password") {
        const current = clean(payload.currentPassword);
        const next = clean(payload.newPassword);
        const row = await first(`SELECT password_hash AS passwordHash FROM users WHERE id=?`, user.id);
        if (!row?.passwordHash || !(await verifyPassword(current, row.passwordHash))) throw new Error("Mật khẩu hiện tại không đúng.");
        const passwordError = passwordPolicyError(next);
        if (passwordError) throw new Error(passwordError);
        if (current === next) throw new Error("Mật khẩu mới phải khác mật khẩu hiện tại.");
        await env.DB.prepare(`UPDATE users SET password_hash=?,must_change_password=0,password_reset_at=NULL,password_reset_by=NULL,updated_at=? WHERE id=?`).bind(await hashPassword(next), stamp, user.id).run();
        const cookieToken = clean((request.headers.get("cookie") || "").split(";").map(v=>v.trim()).find(v=>v.startsWith(`${COOKIE}=`))?.slice(COOKIE.length+1));
        const keepHash = cookieToken ? await sha256(decodeURIComponent(cookieToken)) : "";
        if (keepHash) await env.DB.prepare(`DELETE FROM sessions WHERE user_id=? AND token_hash<>?`).bind(user.id, keepHash).run();
        else await env.DB.prepare(`DELETE FROM sessions WHERE user_id=?`).bind(user.id).run();
        await audit(user.id, "PASSWORD_CHANGE", "user", user.id, null, { passwordPolicy: "8+ upper/lower/number/special", otherSessionsRevoked: true }, request);
        return { message: "Đã đổi mật khẩu và đăng xuất các thiết bị khác." };
    }
    if (action === "update_profile_avatar") {
        const avatarDataUrl = clean(payload.avatarDataUrl);
        if (avatarDataUrl && !/^data:image\/(png|jpeg|webp);base64,/i.test(avatarDataUrl)) throw new Error("Ảnh đại diện chỉ hỗ trợ JPG, PNG hoặc WebP.");
        if (avatarDataUrl.length > 2800000) throw new Error("Ảnh đại diện vượt quá giới hạn 2 MB.");
        await env.DB.prepare(`UPDATE users SET avatar_url=?,updated_at=? WHERE id=?`).bind(avatarDataUrl || null, stamp, user.id).run();
        await audit(user.id, "AVATAR_CHANGE", "user", user.id, null, { avatarUpdated: Boolean(avatarDataUrl) }, request);
        return { message: avatarDataUrl ? "Đã cập nhật ảnh đại diện." : "Đã xóa ảnh đại diện." };
    }
    throw new Error("Nghiệp vụ chưa được hỗ trợ.");
}
export async function GET(request) {
    try {
        await loadEnv();
        const count = await first(`SELECT COUNT(*) AS count FROM users`);
        if (Number(count?.count ?? 0) === 0)
            return Response.json({ ok: true, setupRequired: true });
        const user = await currentUser(request);
        if (!user)
            return Response.json({ ok: false, authenticated: false }, { status: 401 });
        return Response.json({ ok: true, authenticated: true, data: await bootstrap(user) });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Không thể đọc dữ liệu hệ thống.";
        const migrationMissing = /no such table|relation .* does not exist/i.test(message);
        return jsonError(migrationMissing ? "Cơ sở dữ liệu chưa được khởi tạo. Hãy chạy quy trình cài đặt nội bộ trước khi mở phần mềm." : message, 500);
    }
}
export async function POST(request) {
    try {
        await loadEnv();
        const payload = await request.json();
        const action = clean(payload.action);
        if (action === "setup")
            return handleSetup(payload, request);
        if (action === "login")
            return handleLogin(payload, request);
        if (action === "logout") {
            const token = getCookie(request, COOKIE);
            if (token)
                await env.DB.prepare(`DELETE FROM sessions WHERE token_hash=?`).bind(await sha256(token)).run();
            return Response.json({ ok: true }, { headers: { "Set-Cookie": sessionCookie("", 0) } });
        }
        const user = await currentUser(request);
        if (!user)
            return jsonError("Phiên đăng nhập đã hết hạn.", 401);
        if (Boolean(user.mustChangePassword) && action !== "change_password") return jsonError("Bạn phải đổi mật khẩu tạm thời trước khi sử dụng hệ thống.", 428);
        await requireActionModule(user, action);
        const result = await handleAction(action, payload, user, request);
        return Response.json({ ok: true, ...result });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Không thể xử lý nghiệp vụ.";
        const status = /không có quyền|không được phân quyền|không được phép|ngoài phạm vi/i.test(message)
            ? 403
            : /UNIQUE constraint|duplicate key|unique constraint/i.test(message)
                ? 409
                : 400;
        const internalDbError=/could not determine data type|syntax error at or near|bind message supplies|operator does not exist|column .* does not exist|relation .* does not exist|SQLITE_ERROR|SQLITE_CONSTRAINT/i.test(message);
        if(internalDbError){const errorCode=`ERP-${clean(action||"SYSTEM").toUpperCase().replace(/[^A-Z0-9]+/g,"-")}-DB`;console.error(`[${errorCode}]`,error);return jsonError(`Không thể xử lý nghiệp vụ do lỗi dữ liệu nội bộ. Vui lòng thử lại hoặc liên hệ Quản trị viên. Mã lỗi: ${errorCode}`,500);}
        return jsonError(message, status);
    }
}
