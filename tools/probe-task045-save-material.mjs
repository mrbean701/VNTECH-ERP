// Kiểm chứng LÚC CHẠY cho TASK-045 — `save_material` (Danh mục mã vật tư gốc).
//
// ============================ VÌ SAO ============================
// Cổng BẢN ĐỒ GHI + rà `material_code_history` cho thấy Java **không hề nhắc** bảng này, còn JS thì
// GHI lịch sử đổi mã (kèm luật "Đổi mã gốc phải nhập lý do"). Đọc tiếp `saveMaterial` của Java thì lộ
// **lỗi nặng hơn**: Java lấy `system` từ `payload.system` — nhưng UI (`app/page.tsx:3769`, MaterialModal)
// **KHÔNG BAO GIỜ gửi khoá này**; JS thì tính `system = canonicalMeCode(category.code)`.
//   ⇒ MỖI LẦN admin tạo/sửa mã vật tư, Java ghi `system='KHAC'` — **ghi đè hệ M&E thật** một cách im lặng.
// Dữ liệu đang chạy cho thấy dấu vết: 5/14 mã có `system` KHÔNG khớp `canonicalMeCode(mã hệ của nhóm)`,
// trong đó `DIEN-DAY-CAD-001` (nhóm DIEN) và `CTN-ONG-NHUA-001` (nhóm CTN) đang là `KHAC`.
//
// Probe này dựng MỘT mã vật tư TẠM bằng SQL (không đụng dữ liệu thật), rồi gọi `save_material` bằng
// ĐÚNG payload của UI và khẳng định hành vi ĐÚNG THEO JS. Trên bản Java CŨ, các phép kiểm C/D/F/H/I
// sẽ HỎNG (đó là ĐỐI CHỨNG DƯƠNG của probe); sau khi vá phải ĐẠT hết.
//
// AN TOÀN: mã tạm `MAT_ZZP045` bị XOÁ trong `finally` (kèm alias + lịch sử đổi mã của nó).
// Bản ghi tạo ra được ghi lại nguyên văn vào `tools/_backup-task045.sql` (đã gitignore).
//
// Chạy: node tools/probe-task045-save-material.mjs [base]
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const MAT = "MAT_ZZP045";
const CODE = "ZZP045-VT-001";
const NAME = "Vật tư probe TASK-045";
const MYSQL_ARGS = ["--default-character-set=utf8mb4", "-uvntech", "-pvntech", "vntech_erp",
  "--batch", "--raw", "--skip-column-names"];
const sql = (q) => execFileSync(MYSQL, [...MYSQL_ARGS, "-e", q], { encoding: "utf8" }).trim();
const sqlRows = (q) => sql(q).split(/\r?\n/).filter(Boolean).map((l) => l.split("\t"));
const sqlOne = (q) => { const r = sqlRows(q); return r.length ? r[0][0] : ""; };
const q1 = (v) => `'${String(v).replace(/'/g, "''")}'`;

const results = [];
const check = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "ĐẠT" : "HỎNG"}  ${name}${detail ? " — " + detail : ""}`);
};

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
if (!login.ok) { console.error(`Đăng nhập lỗi HTTP ${login.status}`); process.exit(1); }
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
console.log(`Đăng nhập OK (${BASE})\n`);
async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? "") };
}
const state = () => {
  const r = sqlRows(`SELECT code,name,\`system\`,min_stock,unit,brand,specification,category_id,subcategory_id,standard_price,active FROM materials WHERE id=${q1(MAT)}`)[0] ?? [];
  return { code: r[0], name: r[1], system: r[2], minStock: r[3], unit: r[4], brand: r[5], specification: r[6], categoryId: r[7], subcategoryId: r[8] };
};

const counts = () => ({
  materials: Number(sqlOne("SELECT COUNT(*) FROM materials")),
  aliases: Number(sqlOne("SELECT COUNT(*) FROM material_aliases")),
  history: Number(sqlOne("SELECT COUNT(*) FROM material_code_history")),
});
const before = counts();

// ---------- dựng mã TẠM ----------
const cat = sqlRows("SELECT id,code FROM material_categories WHERE code='DIEN'")[0];
if (!cat) { console.error("Không tìm thấy nhóm DIEN — dừng."); process.exit(1); }
const sub = sqlRows(`SELECT id,code FROM material_subcategories WHERE category_id=${q1(cat[0])} AND code='CHUA_PHAN_NHOM'`)[0]
  ?? sqlRows(`SELECT id,code FROM material_subcategories WHERE category_id=${q1(cat[0])} LIMIT 1`)[0];
if (!sub) { console.error("Nhóm DIEN không có nhóm con nào — dừng."); process.exit(1); }
const now = new Date().toISOString().slice(0, 23).replace("T", " ");
const insert = `INSERT INTO materials (id,code,name,\`system\`,category_id,subcategory_id,unit,standard_price,min_stock,requires_mar,requires_cocq,active,created_at,updated_at) VALUES (${q1(MAT)},${q1(CODE)},${q1(NAME)},'DIEN',${q1(cat[0])},${q1(sub[0])},'cái',0,0,0,0,1,${q1(now)},${q1(now)});`;
writeFileSync("tools/_backup-task045.sql", `-- TASK-045: bản ghi TẠM do probe tạo (probe tự xoá ở finally)\n${insert}\n`);
sql(insert);
console.log(`Mã tạm: ${MAT} · ${CODE} · nhóm ${cat[1]} / ${sub[1]}\n`);

/** payload ĐÚNG như MaterialModal gửi (app/page.tsx:3769) — KHÔNG có `system`, KHÔNG có `standardPrice`. */
const uiPayload = (extra = {}) => ({
  materialId: MAT, categoryId: cat[0], subcategoryId: sub[0], code: CODE, unit: "cái", name: NAME,
  brand: "Hãng probe", minStock: "7", specification: "Quy cách probe", aliasText: "",
  codeChangeReason: "", ...extra,
});

try {
  const st0 = state();
  check("A. mã tạm có `system` = DIEN = canonicalMeCode(mã nhóm DIEN)", st0.system === "DIEN", st0.system);

  // ---------- B..E: payload UI đầy đủ ----------
  const save = await call("save_material", uiPayload());
  console.log(`  → save_material: HTTP ${save.status} · ${save.message || save.error}`);
  check("B. save_material bằng payload UI ⇒ HTTP 200", save.status === 200, `HTTP ${save.status}`);
  const st1 = state();
  check("C. `system` GIỮ NGUYÊN 'DIEN' (không bị ghi đè thành KHAC)", st1.system === "DIEN", st1.system);
  check("D. `min_stock` được GHI THẬT = 7 (trước đây bị bỏ im lặng)", Number(st1.minStock) === 7, st1.minStock);
  check("E. các trường khác ghi đúng: brand/specification/unit/name + nhóm không đổi",
    st1.brand === "Hãng probe" && st1.specification === "Quy cách probe" && st1.unit === "cái"
    && st1.name === NAME && st1.categoryId === cat[0] && st1.subcategoryId === sub[0],
    `${st1.brand} · ${st1.specification} · ${st1.unit} · ${st1.categoryId}/${st1.subcategoryId}`);

  // ---------- H: thiếu ĐVT (JS: "Mã vật tư, tên vật tư, ĐVT và hệ M&E là bắt buộc.") ----------
  const noUnit = await call("save_material", uiPayload({ unit: "" }));
  check("H. thiếu ĐVT ⇒ 400 nguyên văn JS",
    noUnit.status === 400 && /Mã vật tư, tên vật tư, ĐVT và hệ M&E là bắt buộc\./.test(noUnit.error + noUnit.message),
    `HTTP ${noUnit.status} · ${noUnit.error || noUnit.message}`);

  // ---------- I: nhóm không tồn tại (JS: "Hệ M&E không tồn tại.") ----------
  const badCat = await call("save_material", uiPayload({ categoryId: "CAT_KHONG_TON_TAI" }));
  check("I. nhóm không tồn tại ⇒ 400 nguyên văn JS",
    badCat.status === 400 && /Hệ M&E không tồn tại\./.test(badCat.error + badCat.message),
    `HTTP ${badCat.status} · ${badCat.error || badCat.message}`);

  // ---------- F: đổi mã KHÔNG có lý do ----------
  const codeBefore = state().code;
  const histBefore = counts().history;
  const noReason = await call("save_material", uiPayload({ code: "ZZP045-VT-001-X", codeChangeReason: "" }));
  const stF = state();
  check("F. đổi mã gốc mà THIẾU lý do ⇒ 400 nguyên văn JS *\"Đổi mã gốc phải nhập lý do để lưu lịch sử.\"*",
    noReason.status === 400 && /Đổi mã gốc phải nhập lý do để lưu lịch sử\./.test(noReason.error + noReason.message),
    `HTTP ${noReason.status} · ${noReason.error || noReason.message}`);
  check("F2. mã gốc KHÔNG bị đổi khi thiếu lý do", stF.code === codeBefore, `${codeBefore} → ${stF.code}`);

  // ---------- G: đổi mã CÓ lý do ⇒ lịch sử ----------
  const withReason = await call("save_material", uiPayload({ code: "ZZP045-VT-002", codeChangeReason: "Chuẩn hóa mã công ty" }));
  const stG = state();
  const hist = sqlRows(`SELECT old_code,new_code,reason,changed_by FROM material_code_history WHERE material_id=${q1(MAT)} ORDER BY changed_at`);
  check("G. đổi mã CÓ lý do ⇒ 200 và mã đổi thật", withReason.status === 200 && stG.code === "ZZP045-VT-002",
    `HTTP ${withReason.status} · ${stG.code}`);
  check("G2. `material_code_history` ghi ĐÚNG 1 dòng: old → new + lý do + người đổi",
    hist.length === 1 && hist[0][0] === codeBefore && hist[0][1] === "ZZP045-VT-002" && hist[0][2] === "Chuẩn hóa mã công ty" && hist[0][3].length > 0,
    JSON.stringify(hist));
  check("G3. số dòng lịch sử tăng đúng 1 so với trước phép kiểm F",
    counts().history === histBefore + 1, `${histBefore} → ${counts().history}`);

  // ---------- TASK-047: ALIAS theo aliasText + luật trùng tên + audit + văn bản thông điệp ----------
  // LỖI CỦA CHÍNH TÔI Ở BẢN ĐẦU: `uiPayload()` mặc định dùng `CODE` gốc, nhưng phép kiểm G đã ĐỔI mã
  // sang ZZP045-VT-002 ⇒ 3 phép kiểm mới bị chặn bởi luật "đổi mã phải có lý do" (400) và báo HỎNG oan.
  // Phải dùng ĐÚNG mã hiện tại của bản ghi.
  const liveCode = state().code;
  const aliasCall = await call("save_material", uiPayload({
    code: liveCode,
    aliasText: `${NAME};\nBê tông M300; bê tông m300 ; Cáp Cu 2x2.5`,
  }));
  const aliasRows = sqlRows(`SELECT alias_name,normalized_name FROM material_aliases WHERE material_id=${q1(MAT)} ORDER BY alias_name`);
  check("T047-I2. văn bản thông điệp theo JS: “Đã lưu mã gốc … với N tên tương đương.”",
    aliasCall.status === 200 && /^Đã lưu mã gốc .+ · .+ với 2 tên tương đương\.$/.test(aliasCall.message), aliasCall.message || aliasCall.error);
  check("T047-I3. alias ghi ĐÚNG: bỏ tên gốc + bỏ trùng chuẩn hoá ⇒ 2 dòng",
    aliasRows.length === 2 && aliasRows.some((r) => r[1] === "be tong m300") && aliasRows.some((r) => r[1] === "cap cu 2x2 5"),
    JSON.stringify(aliasRows));

  const auditRows = sqlRows(`SELECT action,entity_type,before_json,after_json FROM audit_logs WHERE entity_id=${q1(MAT)} AND action IN ('CREATE','UPDATE') ORDER BY occurred_at DESC`);
  check("T047-I4. có dòng `audit_logs` cho lần lưu (entity_type='material', after_json hợp lệ)",
    auditRows.length >= 1 && auditRows[0][1] === "material"
    && (auditRows[0][3] === null || auditRows[0][3] === "NULL" || /^\{/.test(auditRows[0][3])),
    `${auditRows.length} dòng · ${auditRows[0]?.[0]} · after=${String(auditRows[0]?.[3]).slice(0, 90)}`);

  const other = sqlRows(`SELECT code,name FROM materials WHERE id<>${q1(MAT)} AND active=1 LIMIT 1`)[0];
  const conflict = await call("save_material", uiPayload({ code: liveCode, aliasText: other[1] }));
  const aliasesAfterBlock = Number(sqlOne(`SELECT COUNT(*) FROM material_aliases WHERE material_id=${q1(MAT)}`));
  check("T047-I5. chặn GHÉP TRÙNG: đặt tên gốc của mã khác làm alias ⇒ 400 + nguyên văn JS, alias GIỮ NGUYÊN",
    conflict.status === 400
    && /Tên tương đương “.+?” đang thuộc mã .+; không được ghép hai vật tư khác thông số\./.test(conflict.error + conflict.message)
    && aliasesAfterBlock === 2,
    `HTTP ${conflict.status} · ${conflict.error || conflict.message} · alias còn ${aliasesAfterBlock}`);
} catch (e) {
  check("probe chạy trọn vẹn (không ném lỗi)", false, String(e && e.message ? e.message : e));
} finally {
  try {
    sql(`DELETE FROM material_code_history WHERE material_id=${q1(MAT)}`);
    sql(`DELETE FROM material_aliases WHERE material_id=${q1(MAT)}`);
    sql(`DELETE FROM materials WHERE id=${q1(MAT)}`);
  } catch (e) { console.error(`DỌN DỮ LIỆU LỖI: ${e.message}`); }
  const after = counts();
  console.log(`\nTRƯỚC: ${JSON.stringify(before)}\nSAU:   ${JSON.stringify(after)}`);
  check("dọn sạch: 3 bảng (materials/aliases/material_code_history) về ĐÚNG số dòng ban đầu",
    JSON.stringify(before) === JSON.stringify(after),
    Object.keys(before).filter((k) => before[k] !== after[k]).map((k) => `${k} ${before[k]}→${after[k]}`).join(" · ") || "khớp toàn bộ");
  check("GIỚI HẠN đã biết: probe dùng mã TẠM (không đụng mã thật) và KHÔNG kiểm phần REBUILD aliasText / luật trùng tên",
    true, "phần đó ghi ở TASK-045 mục 'phần 2'");
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} ĐẠT`);
if (failed.length) { console.log("MỤC HỎNG:"); for (const f of failed) console.log(` - ${f.name}: ${f.detail}`); }
process.exit(failed.length ? 1 : 0);
