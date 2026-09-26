// In nội dung bảng role_catalog từ payload bootstrap (nguồn: đường chạy thật của UI).
// Dùng để đối chiếu các test khẳng định cứng về tên vai trò / đơn vị mặc định.
//
// Chạy: node tools/show-role-catalog.mjs [base] [code,code,...]
const BASE = process.argv[2] || "http://127.0.0.1:9000";
const WANT = (process.argv[3] || "").split(",").map((s) => s.trim()).filter(Boolean);

const login = await fetch(`${BASE}/api/system`, {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ action: "login", username: "admin", password: "Admin123456@" }),
});
const cookie = (login.headers.getSetCookie?.() ?? [login.headers.get("set-cookie")])
  .filter(Boolean).map((c) => c.split(";")[0]).join("; ");
const d = (await (await fetch(`${BASE}/api/system`, { headers: { cookie } })).json()).data;

const rows = (d.roleCatalog || []).filter((r) => !WANT.length || WANT.includes(r.code));
console.log(`role_catalog: ${(d.roleCatalog || []).length} dòng · in ${rows.length} dòng\n`);
console.log("  code".padEnd(18) + "baseRole".padEnd(14) + "name".padEnd(58) + "defaultOrgCode  active");
for (const r of rows) {
  console.log("  " + String(r.code).padEnd(16) + String(r.baseRole).padEnd(14)
    + String(r.name).padEnd(58) + String(r.defaultOrganizationCode ?? "(rỗng)").padEnd(16) + r.active);
}

// Đối chiếu ĐÚNG điều mà tests/runtime-admin-boq-regression.test.mjs:65 khẳng định.
const t = (d.roleCatalog || []).find((x) => x.code === "thuky");
console.log("\nKhẳng định của test: roleCatalog có code='thuky' && name='Thư ký Tổng giám đốc' && defaultOrganizationCode='BGD'");
if (!t) console.log("  -> KHÔNG có dòng code='thuky' ⇒ test sai vì thiếu dữ liệu");
else {
  const okName = t.name === "Thư ký Tổng giám đốc";
  const okOrg = t.defaultOrganizationCode === "BGD";
  console.log(`  -> name      : "${t.name}"  ${okName ? "KHỚP" : "KHÔNG KHỚP"}`);
  console.log(`  -> defaultOrg: "${t.defaultOrganizationCode}"  ${okOrg ? "KHỚP" : "KHÔNG KHỚP"}`);
  console.log(`  -> KẾT LUẬN: ${okName && okOrg ? "test đúng" : "test LỆCH so với dữ liệu thật"}`);
}

// Truy nguyên: field defaultOrganizationCode sinh từ JOIN default_organization_unit_id.
// Nếu đơn vị 'BGD' TỒN TẠI mà mọi vai trò đều không trỏ tới ⇒ LỖ HỔNG LIÊN KẾT, không phải thiếu đơn vị.
const orgs = d.organizationUnits || [];
const linked = (d.roleCatalog || []).filter((r) => r.defaultOrganizationUnitId);
console.log(`\nĐơn vị tổ chức: ${orgs.length} dòng`);
for (const o of orgs) console.log(`  ${String(o.code).padEnd(12)} ${String(o.name).padEnd(34)} unitType=${o.unitType} active=${o.active}`);
console.log(`\nVai trò CÓ trỏ đơn vị mặc định: ${linked.length}/${(d.roleCatalog || []).length}`);
const bgd = orgs.find((o) => o.code === "BGD");
console.log(bgd
  ? `Đơn vị 'BGD' TỒN TẠI (${bgd.name}) nhưng ${linked.length === 0 ? "KHÔNG vai trò nào trỏ tới ⇒ LỖ HỔNG LIÊN KẾT" : "có vai trò trỏ tới"}`
  : "Đơn vị 'BGD' KHÔNG tồn tại trong organization_units");

