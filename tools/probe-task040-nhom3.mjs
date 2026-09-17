// Kiểm chứng LÚC CHẠY cho TASK-040 nhóm 3 — định mức vật tư (`material_norms`) + vật tư (`materials`).
//
// BA THỨ ĐƯỢC KIỂM:
//   A. SQL: `insertNorm`/`updateNorm`/`setNormActive` ghi ĐÚNG cột thật của `material_norms`
//      (trước đây ghi name/unit_rate/scope_project_id/description/approved_by/approved_at — 6 cột KHÔNG tồn tại ⇒ 500).
//   B. HỢP ĐỒNG PAYLOAD: UI (app/page.tsx:2519) gửi itemName/quantityPerUnit/projectId/baseUom/subcategoryId.
//      Trước đây Java đọc name/unitRate/scopeProjectId và BẮT BUỘC normCode (UI không bao giờ gửi)
//      ⇒ action hỏng ngay ở validate. Nay phải nhận đúng payload của UI.
//   C. NGHIỆP VỤ: norm_code tự sinh `DM-%04d`; `status='active'`; `source_type` suy từ sourceComponentId;
//      đổi trạng thái là BẬT/TẮT `active` (không phải ghi cột duyệt); thông điệp nguyên văn JS.
//
// AN TOÀN DỮ LIỆU: `material_norms` đang có **0 dòng** (đã đo trước) nên probe tạo → sửa → đổi trạng thái →
// XOÁ, và kết thúc bằng việc xác nhận bảng trở lại 0 dòng. Không đụng bảng `materials`.
//
// Chạy: node tools/probe-task040-nhom3.mjs [base]
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
const norms = async () => (await boot()).materialNorms ?? [];

// So SÁNH NGHIÊM (không ép kiểu): payload bootstrap trả `active` dạng BOOLEAN thật, không phải số 1/0.
// Bài học từ chính probe này: `Number(false) === 0` là ĐÚNG nên phép kiểm cũ có thể ĐẠT OAN nếu dùng ép kiểu.
const isOn = (v) => v === true || v === 1 || v === "1";
const isOff = (v) => v === false || v === 0 || v === "0";

const d0 = await boot();
console.log(`TRƯỚC: materialNorms = ${d0.materialNorms === undefined ? "(THIẾU KHÓA)" : JSON.stringify(d0.materialNorms)}`);
console.log(`TRƯỚC: materials = ${(d0.materials ?? []).length} dòng\n`);
check("B. bootstrap CÓ khoá materialNorms (đường đọc của UI)", d0.materialNorms !== undefined,
  d0.materialNorms === undefined ? "khoá thiếu" : `mảng ${d0.materialNorms.length} phần tử`);
const before = (await norms()).length;

// ---------- A+B: TẠO — payload Y HỆT form UI gửi (mọi giá trị là CHUỖI như FormData) ----------
console.log("--- 1) Tạo định mức bằng ĐÚNG payload của form UI ---");
const create = await call("save_material_norm", {
  projectId: "", itemName: "Hạng mục kiểm thử TASK-040", materialId: "",
  quantityPerUnit: "2.5", unit: "m", baseUom: "m", subcategoryId: "",
});
console.log(`  HTTP ${create.status}  ${create.message || create.error}`);
check("A. save_material_norm KHÔNG còn 500", create.status !== 500, `HTTP ${create.status} ${create.error}`);
check("A. tạo mới trả 200 + thông điệp JS", create.status === 200 && create.message === "Đã thêm định mức vật tư.",
  `HTTP ${create.status} "${create.message}"`);

const afterCreate = await norms();
const made = afterCreate.find((n) => n.itemName === "Hạng mục kiểm thử TASK-040");
check("C. norm_code tự sinh đúng dạng DM-%04d", /^DM-\d{4}$/.test(String(made?.normCode ?? "")), String(made?.normCode ?? "(không có)"));
check("C. quantity_per_unit ghi đúng cột thật", Number(made?.quantityPerUnit) === 2.5, String(made?.quantityPerUnit));
check("C. status = 'active' (không phải 'pending' như bản cũ)", String(made?.status) === "active", String(made?.status));
check("C. source_type = 'manual' khi không có sourceComponentId", String(made?.sourceType) === "manual", String(made?.sourceType));
check("B. base_uom ghi được (UI gửi baseUom)", String(made?.baseUom ?? "") === "m", String(made?.baseUom));

// ---------- C: nhánh source_type = 'boq_component' ----------
console.log("\n--- 2) Nhánh source_component_id (JS: source_type='boq_component') ---");
const comp = await call("save_material_norm", {
  projectId: "", itemName: "Hạng mục từ BOQ TASK-040", materialId: "",
  quantityPerUnit: "1", unit: "cái", sourceComponentId: "BOQ-TEST-040",
});
check("C. gọi kèm sourceComponentId trả 200", comp.status === 200, `HTTP ${comp.status} ${comp.error}`);
const madeComp = (await norms()).find((n) => n.itemName === "Hạng mục từ BOQ TASK-040");
check("C. source_type = 'boq_component' khi có sourceComponentId",
  String(madeComp?.sourceType) === "boq_component", String(madeComp?.sourceType));

// ---------- A: SỬA ----------
console.log("\n--- 3) Sửa định mức ---");
const upd = await call("save_material_norm", {
  normId: made?.id, projectId: "", itemName: "Hạng mục kiểm thử TASK-040 (đã sửa)", materialId: "",
  quantityPerUnit: "3.75", unit: "cái", baseUom: "", subcategoryId: "",
});
console.log(`  HTTP ${upd.status}  ${upd.message || upd.error}`);
check("A. sửa trả 200 + thông điệp JS", upd.status === 200 && upd.message === "Đã cập nhật định mức vật tư.",
  `HTTP ${upd.status} "${upd.message}"`);
const afterUpd = (await norms()).find((n) => n.id === made?.id);
check("C. item_name đã sửa", String(afterUpd?.itemName).includes("(đã sửa)"), String(afterUpd?.itemName));
check("C. quantity_per_unit đã sửa", Number(afterUpd?.quantityPerUnit) === 3.75, String(afterUpd?.quantityPerUnit));
check("C. unit đã sửa", String(afterUpd?.unit) === "cái", String(afterUpd?.unit));
check("C. norm_code KHÔNG bị đổi khi sửa (đúng JS — bản cũ có đổi)", afterUpd?.normCode === made?.normCode,
  `${made?.normCode} -> ${afterUpd?.normCode}`);

// ---------- A+C: TRẠNG THÁI ----------
console.log("\n--- 4) Bật/tắt định mức (UI gửi {normId, active}) ---");
const off = await call("set_material_norm_status", { normId: made?.id, active: 0 });
console.log(`  HTTP ${off.status}  ${off.message || off.error}`);
check("C. ẩn định mức trả 200 + thông điệp JS", off.status === 200 && off.message === "Đã ẩn định mức.",
  `HTTP ${off.status} "${off.message}"`);
const afterOff = (await norms()).find((n) => n.id === made?.id);
check("C. active = 0 (so nghiêm, không ép kiểu)", isOff(afterOff?.active), JSON.stringify(afterOff?.active));
check("C. status = 'inactive'", String(afterOff?.status) === "inactive", String(afterOff?.status));

const on = await call("set_material_norm_status", { normId: made?.id, active: 1 });
check("C. kích hoạt trả 200 + thông điệp JS", on.status === 200 && on.message === "Đã kích hoạt định mức.",
  `HTTP ${on.status} "${on.message}"`);
const afterOn = (await norms()).find((n) => n.id === made?.id);
check("C. active = 1 và status = 'active'",
  isOn(afterOn?.active) && String(afterOn?.status) === "active",
  `active=${JSON.stringify(afterOn?.active)} status=${afterOn?.status}`);

// ---------- C: các phép chặn nghiệp vụ ----------
console.log("\n--- 5) Các phép chặn nghiệp vụ (nguyên văn JS) ---");
const noItem = await call("save_material_norm", { itemName: "", quantityPerUnit: "1" });
check("C. thiếu hạng mục -> 400 đúng thông điệp",
  noItem.status === 400 && noItem.error === "Hạng mục áp định mức là bắt buộc.", `HTTP ${noItem.status} "${noItem.error}"`);
const zero = await call("save_material_norm", { itemName: "X", quantityPerUnit: "0" });
check("C. định mức 0 -> 400 đúng thông điệp",
  zero.status === 400 && zero.error === "Định mức tiêu hao phải lớn hơn 0.", `HTTP ${zero.status} "${zero.error}"`);
const badMat = await call("save_material_norm", { itemName: "X", quantityPerUnit: "1", materialId: "MAT_KHONG_TON_TAI" });
check("C. mã vật tư sai -> 400 đúng thông điệp",
  badMat.status === 400 && badMat.error === "Mã vật tư không tồn tại hoặc đang bị ẩn.",
  `HTTP ${badMat.status} "${badMat.error}"`);
const badNorm = await call("set_material_norm_status", { normId: "MNR_KHONG_TON_TAI", active: 1 });
check("C. định mức không tồn tại -> 400 đúng thông điệp",
  badNorm.status === 400 && badNorm.error === "Không tìm thấy định mức.", `HTTP ${badNorm.status} "${badNorm.error}"`);

// ---------- DỌN DẸP ----------
console.log("\n--- 6) Dọn dẹp (trả bảng về đúng số dòng ban đầu) ---");
for (const n of await norms()) {
  const del = await call("delete_material_norm", { normId: n.id });
  if (del.status !== 200) console.log(`  ⚠ không xoá được ${n.id}: HTTP ${del.status} ${del.error}`);
}
const finalNorms = await norms();
check("A. xoá sạch định mức kiểm thử, bảng về đúng số dòng ban đầu",
  finalNorms.length === before, `${before} -> ${finalNorms.length}`);

console.log("\n=== KẾT QUẢ ===");
const ok = results.every((r) => r.ok);
console.log(`${results.filter((r) => r.ok).length}/${results.length} mục ĐẠT`);
console.log(ok ? "KẾT LUẬN: định mức vật tư đã hết 500, đúng hợp đồng payload của UI và đúng nghiệp vụ JS ✅"
  : "KẾT LUẬN: còn mục KHÔNG ĐẠT ⚠");
process.exitCode = ok ? 0 : 1;
