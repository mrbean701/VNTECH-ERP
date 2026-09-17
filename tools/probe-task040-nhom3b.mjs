// Kiểm chứng LÚC CHẠY cho TASK-040 nhóm 3b phần 2 — `import_material_catalog`.
//
// BA THỨ ĐƯỢC KIỂM (theo đúng hợp đồng dữ liệu của UI `app/page.tsx:1909-1921`):
//   A. NHÓM: UI gửi `categoryCode`/`subcategoryCode`, KHÔNG gửi `categoryId`/`subcategoryId`.
//      Bản Java cũ đọc `categoryId` ⇒ vật tư nhập vào MẤT NHÓM. Nay phải tự tra/tạo nhóm từ mã.
//   B. SYSTEM: JS đặt `system = canonicalMeCode(category.code)`. Bản cũ đọc khoá `"system"` (UI không gửi)
//      ⇒ luôn "KHAC". Dùng mã nhóm `DIEN LUC` để kiểm luôn nhánh TIỀN TỐ vừa vá ở #52.
//   C. THÔNG ĐIỆP + UPSERT: thông điệp nguyên văn JS; nhập lại cùng mã thì CẬP NHẬT chứ không tạo trùng.
//
// AN TOÀN DỮ LIỆU: probe tạo 1 nhóm + 1 nhóm con + 1 mã vật tư có tiền tố `ZZPROBE040` rồi XOÁ SẠCH bằng MySQL
// ở bước riêng (script chỉ gọi HTTP, không tự xoá — người chạy phải chạy tiếp lệnh dọn ở cuối).
//
// Chạy: node tools/probe-task040-nhom3b.mjs [base]
const BASE = process.argv[2] || "http://127.0.0.1:18081";

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

const boot = async () => (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data ?? {};
async function call(action, payload = {}) {
  const res = await fetch(`${BASE}/api/system`, {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let body = {};
  try { body = await res.json(); } catch { /* bỏ qua */ }
  return { status: res.status, message: String(body.message ?? ""), error: String(body.error ?? "") };
}

const d0 = await boot();
const matBefore = (d0.adminMaterials ?? d0.materials ?? []).length;
const catBefore = (d0.adminMaterialCategories ?? d0.materialCategories ?? []).length;
const subBefore = (d0.adminMaterialSubcategories ?? d0.materialSubcategories ?? []).length;
console.log(`TRƯỚC: materials=${matBefore} · categories=${catBefore} · subcategories=${subBefore}\n`);

// ---- 1) payload Y HỆT UI gửi (mọi giá trị là chuỗi; `standardPrice`/`requires*` như mapMaterialCatalogRows) ----
// LỖI CỦA CHÍNH TÔI ĐÃ SỬA: bản đầu tôi đặt categoryCode = "ZZPROBE040 DIEN LUC" rồi kỳ vọng system='DIEN'.
// Sai — `canonicalMeCode` bỏ hết ký tự không phải chữ-số nên mã thành "ZZPROBE040DIENLUC", KHÔNG bắt đầu
// bằng "DIEN" ⇒ trả 'KHAC' là ĐÚNG (JS cũng vậy). Nay dùng mã BẮT ĐẦU bằng `DIEN` để kiểm đúng nhánh tiền tố
// đã vá ở #52, và giữ hậu tố probe để không đụng dữ liệu thật.
const row = {
  categoryCode: "DIENLUC-ZZPROBE040",   // bắt đầu bằng DIEN ⇒ canonicalMeCode phải trả 'DIEN'
  categoryName: "Hệ điện lực (probe TASK-040)",
  subcategoryCode: "ZZPROBE040_NHOMCON",
  subcategoryName: "Nhóm con probe TASK-040",
  code: "ZZPROBE040-VT-001",
  name: "Vật tư probe TASK-040",
  unit: "cái",
  specification: "spec probe",
  brand: "brand probe",
  standardPrice: 0,
  minStock: 12,
  requiresCocq: false,
  requiresMar: false,
};
console.log("--- 1) Nhập 1 dòng bằng ĐÚNG payload của UI ---");
const imp = await call("import_material_catalog", { rows: [row] });
console.log(`  HTTP ${imp.status}  ${imp.message || imp.error}`);
check("A. import KHÔNG còn 500", imp.status !== 500, `HTTP ${imp.status} ${imp.error}`);
check("C. trả 200 + thông điệp có phần 'tạo mới'",
  imp.status === 200 && /^Đã nhập\/cập nhật 1 mã vật tư; tạo mới /.test(imp.message), `"${imp.message}"`);
check("C. thông điệp nêu đủ '1 hệ M&E' và '1 nhóm con'",
  imp.message.includes("1 hệ M&E") && imp.message.includes("1 nhóm con"), imp.message);

const d1 = await boot();
const mat = (d1.adminMaterials ?? d1.materials ?? []).find((m) => m.code === row.code);
check("A. vật tư có trong danh mục sau khi nhập", Boolean(mat), mat ? `id=${mat.id}` : "không thấy");
check("A. CÓ category_id (không còn NULL như bản cũ)", Boolean(mat?.categoryId), String(mat?.categoryId));
check("A. CÓ subcategory_id (không còn NULL như bản cũ)", Boolean(mat?.subcategoryId), String(mat?.subcategoryId));
check("B. system = 'DIEN' nhờ canonicalMeCode khớp TIỀN TỐ 'DIEN LUC'",
  String(mat?.system).toUpperCase() === "DIEN", String(mat?.system));
check("A. nhóm được TỰ TẠO từ categoryCode trong tệp",
  (d1.adminMaterialCategories ?? d1.materialCategories ?? []).some((c) => c.code === row.categoryCode && c.name === row.categoryName),
  `tổng nhóm ${(d1.adminMaterialCategories ?? d1.materialCategories ?? []).length}`);
check("A. nhóm con được TỰ TẠO từ subcategoryCode trong tệp",
  (d1.adminMaterialSubcategories ?? d1.materialSubcategories ?? []).some((s) => s.code === row.subcategoryCode),
  `tổng nhóm con ${(d1.adminMaterialSubcategories ?? d1.materialSubcategories ?? []).length}`);
check("A. brand ghi được (UI có gửi `brand`)", String(mat?.brand ?? "") === row.brand, String(mat?.brand));
check("A. min_stock ghi được (UI có gửi `minStock`)", Number(mat?.minStock) === 12, String(mat?.minStock));

// ---- 2) nhập LẠI cùng mã ⇒ cập nhật, không tạo trùng; thông điệp KHÔNG còn 'tạo mới' ----
console.log("\n--- 2) Nhập lại cùng mã (kiểm upsert + thông điệp) ---");
const imp2 = await call("import_material_catalog", { rows: [{ ...row, name: "Vật tư probe TASK-040 (đã sửa)", minStock: 7 }] });
console.log(`  HTTP ${imp2.status}  ${imp2.message || imp2.error}`);
check("C. nhập lại trả 200", imp2.status === 200, `HTTP ${imp2.status} ${imp2.error}`);
check("C. thông điệp KHÔNG còn phần 'tạo mới' (không tạo nhóm mới)",
  imp2.status === 200 && imp2.message === "Đã nhập/cập nhật 1 mã vật tư.", `"${imp2.message}"`);
const d2 = await boot();
const mats = (d2.adminMaterials ?? d2.materials ?? []).filter((m) => m.code === row.code);
check("C. KHÔNG tạo trùng mã (đúng hợp đồng ON CONFLICT(code))", mats.length === 1, `${mats.length} dòng cùng mã`);
check("C. tên + min_stock đã cập nhật", mats[0]?.name === "Vật tư probe TASK-040 (đã sửa)" && Number(mats[0]?.minStock) === 7,
  `${mats[0]?.name} · minStock=${mats[0]?.minStock}`);

// ---- 3) các nhánh CHẶN ----
console.log("\n--- 3) Các nhánh chặn (nguyên văn JS) ---");
const empty = await call("import_material_catalog", { rows: [] });
check("rows rỗng -> 400 đúng thông điệp",
  empty.status === 400 && empty.error === "File danh mục vật tư không có dòng dữ liệu.", `HTTP ${empty.status} "${empty.error}"`);
const noUnit = await call("import_material_catalog", { rows: [{ code: "ZZPROBE040-X", name: "Thiếu ĐVT" }] });
check("thiếu ĐVT -> 400 đúng thông điệp",
  noUnit.status === 400 && noUnit.error === "Dòng 1: cần đủ Mã vật tư, Tên vật tư và ĐVT.", `HTTP ${noUnit.status} "${noUnit.error}"`);

console.log("\n=== KẾT QUẢ ===");
const ok = results.every((r) => r.ok);
console.log(`${results.filter((r) => r.ok).length}/${results.length} mục ĐẠT`);
console.log("\n=== DỌN DẸP (chạy bằng mysql, KHÔNG tự động) ===");
console.log(`DELETE FROM materials WHERE code='${row.code}';`);
console.log(`DELETE FROM material_subcategories WHERE code='${row.subcategoryCode}';`);
console.log(`DELETE FROM material_categories WHERE code='${row.categoryCode}';`);
console.log("Sau đó chạy lại probe này để xác nhận nó tạo lại được từ đầu (tính lặp lại).");
console.log("\nGIỚI HẠN: probe chỉ kiểm tầng HTTP; cột thật trong MySQL phải đối chiếu bằng mysql sau khi chạy.");
process.exitCode = ok ? 0 : 1;
