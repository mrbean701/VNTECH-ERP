// KHÁCH E2E — nói chuyện với hệ thống đúng như UI: /api/system qua proxy :9000.
// ⛔ KHÔNG `require`, KHÔNG `node -e`. Mọi log bằng tiếng Việt thật, không dùng \uXXXX.
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export const BASE = process.env.E2E_BASE || "http://127.0.0.1:9000";
export const EVIDENCE = process.env.E2E_EVIDENCE || "tools/e2e/bien-chung.jsonl";

let cookie = "";
export const asUser = { current: "admin" };

/** Ghi một dòng bằng chứng — để mọi khẳng định trong báo cáo đều truy vết được. */
export function ghi(event) {
  mkdirSync(dirname(EVIDENCE), { recursive: true });
  appendFileSync(EVIDENCE, JSON.stringify({ ts: new Date().toISOString(), ...event }) + "\n", "utf8");
}

async function raw(method, body) {
  const opt = { method, headers: { accept: "application/json" } };
  if (cookie) opt.headers.cookie = cookie;
  if (body !== undefined) {
    opt.headers["content-type"] = "application/json";
    opt.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + "/api/system", opt);
  const sc = res.headers.get("set-cookie");
  if (sc) cookie = sc.split(";")[0];
  const txt = await res.text();
  let json;
  try { json = JSON.parse(txt); } catch { json = { raw: txt.slice(0, 400) }; }
  return { status: res.status, json };
}

/**
 * Tải tệp lên `POST /api/files` (multipart) — endpoint RIÊNG, KHÔNG phải `/api/system`.
 * Cần cho `confirm_delivery`: bắt buộc ≥ 1 ảnh trong bảng `attachments`
 * (`entity_type='goods_receipt'`) trước khi BCH xác nhận (PurchaseManagementUseCase:412).
 */
export async function taiTep(entityType, entityId, tenTep, mime, bytes) {
  const fd = new FormData();
  fd.append("file", new Blob([bytes], { type: mime }), tenTep);
  fd.append("entityType", entityType);
  fd.append("entityId", entityId);
  const res = await fetch(BASE + "/api/files", { method: "POST", headers: { cookie }, body: fd });
  const txt = await res.text();
  let j;
  try { j = JSON.parse(txt); } catch { j = { raw: txt.slice(0, 300) }; }
  ghi({ loai: "upload", entityType, entityId, tenTep, status: res.status, ok: res.status < 400, user: asUser.current });
  if (res.status >= 400) throw new Error(`taiTep ${entityType}/${entityId} → HTTP ${res.status} ${txt.slice(0, 200)}`);
  return j;
}

/** Đăng nhập 1 tài khoản và giữ cookie phiên. */
export async function login(username, password) {
  const r = await raw("POST", { action: "login", username, password });
  if (r.status !== 200) throw new Error(`đăng nhập ${username} thất bại: HTTP ${r.status} ${JSON.stringify(r.json).slice(0, 200)}`);
  asUser.current = username;
  ghi({ loai: "login", username, status: r.status });
  return r.json;
}

/** Gọi một action.
 *  ⛔ `boQuaLoi: true` CHỈ khiến KHÔNG ném — người gọi VẪN PHẢI tự kiểm `ok` trong kết quả.
 *      (Vòng 198 ghi nhận: dùng `lenient` che lỗi khiến 6/11 lệnh ghi báo "ĐẠT" mà không ghi gì.)
 *  Mặc định (không truyền cờ) là ném lỗi — đây là đường đi an toàn. */
export async function call(action, payload = {}, { boQuaLoi = false, nhan = "" } = {}) {
  const r = await raw("POST", { action, ...payload });
  const j = r.json || {};
  const loi = j.error || (r.status >= 400 ? "HTTP " + r.status + (j.message ? " " + j.message : "") : null);
  const ok = !loi && r.status === 200;
  ghi({ loai: "action", action, ok, status: r.status, loi: loi || null, nhan, user: asUser.current });
  if (!ok && !boQuaLoi) throw new Error(`${action} → ${loi}`);
  return { ok, status: r.status, ...j, _loi: loi || null };
}

/** Gọi một action và BẮT BUỘC phải thành công — ném lỗi nếu máy chủ trả về lỗi.
 *  Đây là cách gọi mặc định cho mọi bước E2E có ghi dữ liệu. */
export async function coThat(action, payload = {}, nhan = "") {
  return call(action, payload, { nhan });
}

/** Chạy một bước E2E, tự phân loại ĐẠT/LOI theo `ok` THẬT của máy chủ (không suy từ việc có ném lỗi hay không).
 *  Trả về kết quả; ghi vào `baoCao` để cuối buổi in tổng. */
export async function buoc(ten, ham, baoCao = []) {
  let r = null, loi = null;
  try { r = await ham(); } catch (e) { loi = String(e?.message || e); }
  const ok = loi === null && r?.ok !== false;
  baoCao.push({ ten, ok, loi: loi || r?._loi || null });
  ghi({ loai: "buoc", ten, ok, loi: loi || r?._loi || null });
  console.log("  [" + (ok ? "DAT" : "LOI") + "] " + ten + (ok ? "" : " :: " + (loi || r?._loi)));
  return r;
}

/** In bảng tổng kết của một giai đoạn. */
export function tomTatBuoc(tenGiaiDoan, baoCao) {
  const dat = baoCao.filter((b) => b.ok).length, loi = baoCao.length - dat;
  console.log("\n  KET QUA " + tenGiaiDoan + ": dat " + dat + "/" + baoCao.length + " · that bai " + loi);
  for (const b of baoCao.filter((x) => !x.ok)) console.log("    ! " + b.ten + " :: " + b.loi);
  return "\n";
}

/** Đọc toàn bộ dữ liệu bootstrap (dùng GET, KHÔNG dùng POST action:"bootstrap").
 *  Góc bọc là { ok, authenticated, data } ⇒ trả về đã bóc sẵn `data`. */
export async function bootstrap() {
  const r = await raw("GET");
  const j = r.json || {};
  if (r.status !== 200 || !j.authenticated) throw new Error("GET /api/system → HTTP " + r.status + " " + JSON.stringify(j).slice(0, 200));
  const d = j.data || {};
  ghi({ loai: "bootstrap", status: r.status, khoa: Object.keys(d).length });
  return d;
}

/** Đếm phần tử mảng trong bootstrap. */
export function dem(bs, khoa) {
  const v = bs[khoa];
  return Array.isArray(v) ? v.length : v ? 1 : 0;
}

/** Tóm tắt toàn bộ khoá bootstrap — dùng để lập bản đồ hệ thống. */
export function tomTat(bs) {
  const ra = {};
  for (const [k, v] of Object.entries(bs)) ra[k] = Array.isArray(v) ? v.length : typeof v;
  return ra;
}

export function tieuDe(ten) {
  console.log("\n" + "=".repeat(78) + "\n" + ten + "\n" + "=".repeat(78));
}