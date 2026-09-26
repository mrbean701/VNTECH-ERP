// Kiểm chứng LÚC CHẠY cho TASK-041 phần 3 — `save_material_subcategory`.
//
// BỐN THỨ ĐƯỢC KIỂM:
//   A. HỢP ĐỒNG PAYLOAD: form UI (`app/page.tsx:3758`) chỉ gửi `categoryId,name,sortOrder,description`
//      (+ `subcategoryId` khi sửa). Bản Java cũ BẮT BUỘC `code` ⇒ LUÔN HTTP 400.
//      JS tự sinh mã bằng `internalGroupCode(name)`.
//   B. BA CỘT BỊ BỎ: `scope_examples` (mặc định = description), `review_status`
//      (mặc định `proposed` khi TẠO, `approved` khi SỬA), `adjustment_note`.
//   C. ĐỒNG BỘ VẬT TƯ CON: khi nhóm con ĐỔI nhóm cha, JS cập nhật `materials.category_id` +
//      `system = canonicalMeCode(category.code)`. Thiếu ⇒ vật tư trỏ nhóm cha cũ (mâu thuẫn dữ liệu).
//   D. ĐƯỜNG ĐỌC: bootstrap phải trả `scopeExamples`/`reviewStatus`/`adjustmentNote` (UI hiển thị 3 cột này).
//
// AN TOÀN: dữ liệu thử đều là bản ghi TẠM (tiền tố ZZP3) do script tạo bằng SQL và TỰ XOÁ ở `finally`.
//
// BÀI HỌC ĐÃ TRẢ GIÁ (lần chạy đầu của chính script này):
//   · MySQL CLI mặc định dùng charset **cp850** ⇒ chuỗi TIẾNG VIỆT trong `WHERE` bị hỏng, tra không ra dòng,
//     làm script tạo thêm 3 dòng rác thay vì sửa. Đã thêm `--default-character-set=utf8mb4`
//     và tra bằng KHOÁ ASCII (`code`) thay vì tên tiếng Việt.
//   · `Set-Content` của PowerShell mặc định ghi ANSI ⇒ làm hỏng tệp có tiếng Việt. Dùng công cụ ghi UTF-8.
//
// Chạy: node tools/probe-task041-subcat.mjs [base]
import { execFileSync } from "node:child_process";

const BASE = process.argv[2] || "http://127.0.0.1:18081";
const MYSQL = "C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysql.exe";
const mysql = (sql) => execFileSync(MYSQL, ["-uvntech", "-pvntech", "-D", "vntech_erp",
  "--default-character-set=utf8mb4", "--batch", "--raw", "--skip-column-names", "-e", sql],
  { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

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
async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? "") };
}
const boot = async () => (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data ?? {};

// ---- DỰNG dữ liệu tạm: 2 hệ M&E tạm ----
const CAT_A = "CAT_ZZP3_A", CAT_B = "CAT_ZZP3_B", MAT = "MAT_ZZP3";
const cleanup = () => {
  mysql(`DELETE FROM materials WHERE id='${MAT}' OR subcategory_id IN (SELECT id FROM material_subcategories WHERE category_id LIKE 'CAT_ZZP3%')`);
  mysql("DELETE FROM material_subcategories WHERE category_id LIKE 'CAT_ZZP3%'");
  mysql("DELETE FROM material_categories WHERE id LIKE 'CAT_ZZP3%'");
};
let cleaned = false;
const doCleanup = () => { if (cleaned) return; cleanup(); cleaned = true; };

const countExpr = "SELECT CONCAT((SELECT COUNT(*) FROM materials),'/',(SELECT COUNT(*) FROM material_subcategories),'/',(SELECT COUNT(*) FROM material_categories))";
const beforeCounts = mysql(countExpr);
console.log(`TRƯỚC: materials/subcategories/categories = ${beforeCounts}\n`);
mysql(`INSERT INTO material_categories (id,code,name,description,sort_order,active,created_at,updated_at)
       VALUES ('${CAT_A}','ZZP3-HE-A','Hệ tạm A','',998,1,NOW(3),NOW(3)),
              ('${CAT_B}','ZZP3-HE-B','Hệ tạm B','',998,1,NOW(3),NOW(3))`);

try {
  // ---- A + B: TẠO bằng ĐÚNG payload form UI (KHÔNG có `code`) ----
  console.log("--- 1) Tạo nhóm con bằng đúng payload UI (không có `code`) ---");
  const created = await call("save_material_subcategory", {
    categoryId: CAT_A, name: "Nhóm tạm P3", sortOrder: 12, description: "Mô tả nhóm tạm P3",
  });
  console.log(`  HTTP ${created.status}  ${created.message || created.error}`);
  check("A. KHÔNG còn 400 vì thiếu `code`", created.status === 200, `HTTP ${created.status} "${created.error}"`);
  check("A. thông điệp nguyên văn JS",
    created.status === 200 && created.message === "Đã lưu nhóm vật tư Nhóm tạm P3.", `"${created.message}"`);

  const rowId = mysql("SELECT id FROM material_subcategories WHERE code='NHOM_TAM_P3'");
  const row = rowId
    ? mysql(`SELECT CONCAT(code,'|',IFNULL(scope_examples,''),'|',IFNULL(review_status,''),'|',IFNULL(adjustment_note,''))
             FROM material_subcategories WHERE id='${rowId}'`)
    : "";
  const [code, scope, review, note] = row.split("|");
  check("A. mã tự sinh bằng internalGroupCode(name)", code === "NHOM_TAM_P3", code || "(không tìm thấy dòng)");
  check("B. scope_examples lấy mặc định từ description", scope === "Mô tả nhóm tạm P3", scope);
  check("B. review_status = 'proposed' khi TẠO", review === "proposed", review);
  check("B. adjustment_note = NULL (UI không gửi)", note === "", `"${note}"`);

  // ---- D: đường ĐỌC ----
  const d1 = await boot();
  const adminSub = (d1.adminMaterialSubcategories ?? []).find((s) => s.id === rowId);
  check("D. bootstrap có scopeExamples/reviewStatus/adjustmentNote",
    adminSub !== undefined && "scopeExamples" in adminSub && "reviewStatus" in adminSub && "adjustmentNote" in adminSub,
    JSON.stringify(adminSub ?? null).slice(0, 150));
  check("D. bootstrap CÓ categoryCode/categoryName (adminMaterialSubcategories)",
    adminSub !== undefined && adminSub.categoryCode === "ZZP3-HE-A" && Boolean(adminSub.categoryName),
    `${adminSub?.categoryCode} / ${adminSub?.categoryName}`);

  // ---- B: SỬA → review_status phải thành 'approved'; scope_examples theo description mới ----
  console.log("\n--- 2) Sửa nhóm con (payload UI có subcategoryId) ---");
  const upd = await call("save_material_subcategory", {
    subcategoryId: rowId, categoryId: CAT_A, name: "Nhóm tạm P3 (đã sửa)", sortOrder: 13,
    description: "Mô tả mới P3",
  });
  console.log(`  HTTP ${upd.status}  ${upd.message || upd.error}`);
  check("B. sửa trả 200 + nguyên văn JS",
    upd.status === 200 && upd.message === "Đã lưu nhóm vật tư Nhóm tạm P3 (đã sửa).", `"${upd.message}"`);
  const after = (mysql(`SELECT CONCAT(IFNULL(scope_examples,''),'|',IFNULL(review_status,''),'|',name,'|',sort_order)
                        FROM material_subcategories WHERE id='${rowId}'`) || "").split("|");
  check("B. scope_examples theo description MỚI", after[0] === "Mô tả mới P3", after[0]);
  check("B. *** review_status = 'approved' khi SỬA *** (bản cũ không bao giờ ghi)",
    after[1] === "approved", after[1]);
  check("name + sort_order đã sửa", after[2] === "Nhóm tạm P3 (đã sửa)" && after[3] === "13", `${after[2]} / ${after[3]}`);
  check("KHÔNG tạo thêm dòng khi sửa (không lọt sang nhánh INSERT)",
    mysql("SELECT COUNT(*) FROM material_subcategories WHERE category_id LIKE 'CAT_ZZP3%'") === "1",
    mysql("SELECT COUNT(*) FROM material_subcategories WHERE category_id LIKE 'CAT_ZZP3%'"));

  // ---- C: đồng bộ vật tư con khi ĐỔI nhóm cha ----
  console.log("\n--- 3) Đổi nhóm con sang HỆ M&E khác ⇒ vật tư con phải đi theo ---");
  mysql(`INSERT INTO materials (id,code,name,\`system\`,category_id,subcategory_id,unit,standard_price,
                                min_stock,requires_cocq,requires_mar,active,created_at,updated_at)
         VALUES ('${MAT}','ZZP3-VT-001','Vật tư tạm P3','ZZP3-HE-A','${CAT_A}','${rowId}','cái',0,0,0,0,1,NOW(3),NOW(3))`);
  console.log(`  trước khi chuyển: ${mysql(`SELECT CONCAT(category_id,'|',\`system\`) FROM materials WHERE id='${MAT}'`)}`);
  const move = await call("save_material_subcategory", {
    subcategoryId: rowId, categoryId: CAT_B, name: "Nhóm tạm P3 (đã sửa)", sortOrder: 13,
    description: "Mô tả mới P3",
  });
  check("chuyển nhóm cha trả 200", move.status === 200, `HTTP ${move.status} ${move.error}`);
  const afterMove = mysql(`SELECT CONCAT(category_id,'|',\`system\`) FROM materials WHERE id='${MAT}'`);
  console.log(`  sau khi chuyển:  ${afterMove}`);
  check("C. *** vật tư con đã theo sang hệ M&E mới ***", afterMove.startsWith(`${CAT_B}|`), afterMove);
  check("C. `system` của vật tư tính lại bằng canonicalMeCode(mã hệ mới)",
    afterMove.split("|")[1] === "KHAC",
    afterMove.split("|")[1] + "  (mã ZZP3-HE-B không khớp hệ M&E chuẩn nên đúng là KHAC)");

  // ---- các nhánh chặn ----
  console.log("\n--- 4) Nhánh chặn (nguyên văn JS) ---");
  const noName = await call("save_material_subcategory", { categoryId: CAT_A, name: "" });
  check("thiếu tên -> 400 đúng nguyên văn JS",
    noName.status === 400 && noName.error === "Hệ M&E và tên nhóm vật tư là bắt buộc.", `"${noName.error}"`);
  const badCat = await call("save_material_subcategory", { categoryId: "CAT_KHONG_TON_TAI", name: "X" });
  check("hệ M&E không tồn tại -> 400 đúng nguyên văn JS",
    badCat.status === 400 && badCat.error === "Hệ M&E không tồn tại.", `"${badCat.error}"`);
} finally {
  doCleanup();
  const afterCounts = mysql(countExpr);
  check("dọn sạch: số dòng trở về đúng ban đầu", afterCounts === beforeCounts, `${beforeCounts} -> ${afterCounts}`);
}

console.log("\n=== KẾT QUẢ ===");
const ok = results.every((r) => r.ok);
console.log(`${results.filter((r) => r.ok).length}/${results.length} mục ĐẠT`);
process.exitCode = ok ? 0 : 1;
