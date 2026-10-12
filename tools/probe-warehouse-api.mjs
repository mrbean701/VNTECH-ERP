// ĐO HỢP ĐỒNG API KHO — `save_warehouse` · `set_warehouse_status` (HANDOFF-20261008-009).
//
// ⭐ VÌ SAO CẦN PROBE NÀY: `app/screens/WarehouseFormModal.tsx:85` gửi payload
//     submit("save_warehouse", { warehouseId, projectId, code, name })
//   ⚠️ Nhưng backend S01 viết ban đầu đọc `payload.get("id")` ⇒ ⭐ «SỬA KHO» ⛔ bị coi là TẠO MỚI ⇒ trùng mã ⇒ 400.
//   ⛔ Không thể bấm qua UI để đo: nút «Tạo kho» trong `app/screens/Inventory.tsx` đang `disabled`
//   (⚠️ phiên 02 TẠM KHOÁ với lý do «app/page.tsx chưa có modal warehouse» — ⭐ việc bật nút là của PHIÊN 02).
//   ⇒ ĐO Ở TẦNG API BẰNG **ĐÚNG PAYLOAD MÀ MODAL GỬI** (kể cả `undefined` bị JSON bỏ đi như thật) ✓
//
//   node tools/probe-warehouse-api.mjs [base] [adminUser] [adminPass]

const BASE = process.argv[2] || "http://127.0.0.1:9000";
const ADMIN = process.argv[3] || "admin";
const ADMIN_PASS = process.argv[4] || "Admin123456@";
const stamp = Date.now().toString().slice(-6);

const login = async (u, p) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "login", username: u, password: p }),
  });
  const cookie = (r.headers.getSetCookie?.() || []).map((c) => c.split(";")[0]).join("; ");
  return { ok: r.status === 200, cookie, status: r.status };
};
const post = async (cookie, action, payload = {}) => {
  const r = await fetch(BASE + "/api/system", {
    method: "POST", headers: { "content-type": "application/json", cookie },
    body: JSON.stringify({ action, ...payload }),
  });
  let j = null;
  try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};
const boot = async (cookie) => {
  const r = await fetch(BASE + "/api/system", { headers: { cookie } });
  let j = null;
  try { j = await r.json(); } catch {}
  return { status: r.status, json: j };
};

const steps = [];
const check = (name, ok, detail) => { steps.push({ name, ok, detail }); console.log(`  ${ok ? "✅" : "❌"} ${name}${detail ? " — " + detail : ""}`); };

console.log("═".repeat(78));
console.log("  ĐO HỢP ĐỒNG API KHO (payload y hệt modal gửi)");
console.log("═".repeat(78));

const adm = await login(ADMIN, ADMIN_PASS);
console.log(`  Đăng nhập «${ADMIN}»: HTTP ${adm.status}`);
if (!adm.ok) { console.error("  ⛔ Không đăng nhập được ⇒ DỪNG (không kết luận)."); process.exit(1); }

const before = await boot(adm.cookie);
const whBefore = before.json?.data?.warehouses || [];
console.log(`  Kho hiện có: ${whBefore.length}`);

// ⚠️⚠️ BÀI HỌC 08/10/2026 (⭐ lỗi CỦA CHÍNH PROBE NÀY): bản đầu **TẠO MỘT KHO MỚI MỖI LẦN CHẠY**
//   ⇒ sau 2 lượt, CSDL thật 12 → **14 kho**, làm cổng `W-02` ĐỎ
//   («Số đo lại khác con số đã chép trong audit (kho=14 …)») ⚠️ — vì hệ thống **CỐ Ý ⛔ KHÔNG có API xoá kho**
//   ⇒ probe ⛔ KHÔNG THỂ tự dọn bằng API. ⭐ Đã phải xoá tay 2 dòng rác (0 tham chiếu con).
//   ✅ NAY: MẶC ĐỊNH dùng **KHO CÓ SẴN** và **TRẢ LẠI NGUYÊN TRẠNG** (tên + trạng thái) ⇒ ⛔ không tạo rác.
//   ⚠️ Chỉ tạo mới khi bật rõ ràng: `ALLOW_CREATE=1` (⭐ khi đó PHẢI tự dọn DB sau, xem cảnh báo cuối).
const ALLOW_CREATE = process.env.ALLOW_CREATE === "1";
const CO_SAN = whBefore[0];
if (!ALLOW_CREATE && !CO_SAN) { console.error("  ⛔ Không có kho nào để đo ⇒ DỪNG."); process.exit(1); }
const CODE = ALLOW_CREATE ? `WH-E2E-${stamp}` : String(CO_SAN.code);
const TEN_GOC = ALLOW_CREATE ? null : String(CO_SAN.name || "");
console.log(`  Chế độ: ${ALLOW_CREATE ? "TẠO MỚI (⚠️ để lại rác — phải tự dọn)" : `DÙNG KHO CÓ SẴN «${CODE}» (⭐ hoàn nguyên sau)`}`);

// ── W1 — TẠO MỚI, payload ĐÚNG như modal ở nhánh `editing=false` (warehouseId/projectId = undefined ⇒ bị bỏ) ──
//    ⚠️ Ở chế độ MẶC ĐỊNH thì ⛔ không tạo (tránh rác) — dùng chính kho có sẵn làm đích.
const w1 = ALLOW_CREATE
  ? await post(adm.cookie, "save_warehouse", { warehouseId: undefined, projectId: undefined, code: CODE, name: `Kho E2E ${stamp}` })
  : { status: 200, json: { skipped: true } };
console.log(`  [W1] TẠO (payload y modal): ${ALLOW_CREATE ? `HTTP ${w1.status}${w1.json?.error ? " · " + w1.json.error : ""}` : "BỎ QUA (chế độ dùng kho có sẵn ⇒ ⛔ không tạo rác)"}`);
const after1 = await boot(adm.cookie);
const created = ALLOW_CREATE
  ? (after1.json?.data?.warehouses || []).find((w) => String(w.code) === CODE)
  : CO_SAN;
check("W1 đích đo sẵn sàng (tạo mới hoặc dùng kho có sẵn)", Boolean(created), `id=${created?.id || "?"}`);

// ── W2 — ⭐ CA QUYẾT ĐỊNH: SỬA bằng `warehouseId` (đúng như modal ở nhánh `editing=true`) ──
//    ⛔ Nếu backend còn đọc `id` thì ca này = TẠO MỚI ⇒ TRÙNG MÃ ⇒ 400 «Mã kho … đã tồn tại.»
const TEN_MOI = ALLOW_CREATE ? `Kho E2E ${stamp} (đã sửa)` : `${TEN_GOC} · probe`;
const w2 = await post(adm.cookie, "save_warehouse", {
  warehouseId: created?.id, code: CODE, name: TEN_MOI,
  // ⚠️⚠️ BÀI HỌC ĐẮT (08/10/2026 — LỖI CỦA CHÍNH PROBE NÀY): `save_warehouse` ghi `project_id = NULL`
  //   khi payload **THIẾU `projectId`** ⇒ ⭐ lần đầu tôi ⛔ KHÔNG gửi ⇒ **XOÁ liên kết dự án của một kho THẬT**
  //   (`KHO-DA-MAU-01`) ⇒ số «kho gắn dự án» 10 → **9** ⇒ cổng `W-02` ĐỎ. ⭐ Đã khôi phục thủ công.
  //   ✅ LUẬT TỪ NAY: probe ⛔ **KHÔNG được bỏ trống trường mà nó không định đổi** — phải **GỬI LẠI giá trị gốc**.
  projectId: created?.projectId ?? undefined,
});
console.log(`  [W2] SỬA (warehouseId = id thật): HTTP ${w2.status}${w2.json?.error ? " · " + w2.json.error : ""}`);
const after2 = await boot(adm.cookie);
const edited = (after2.json?.data?.warehouses || []).find((w) => String(w.id) === String(created?.id));
const soLuong = (after2.json?.data?.warehouses || []).filter((w) => String(w.code) === CODE).length;
check("W2 SỬA theo `warehouseId` ⇒ 200 (⛔ KHÔNG 400 trùng mã)", w2.status === 200, w2.status === 400 ? "⇒ LỆCH KHOÁ `id`/`warehouseId` VẪN CÒN" : "");
check("W2 tên ĐÃ ĐỔI + ⛔ KHÔNG sinh bản ghi thứ hai", String(edited?.name || "") === TEN_MOI && soLuong === 1, `tên=«${edited?.name}» · số bản ghi cùng mã=${soLuong}`);

// ── W3/W4 — ĐỔI TRẠNG THÁI (dùng `warehouseId` như nhà) + ⭐ CHỐT CHỐNG BẪY `findWarehouse` lọc active=1 ──
// ⚠️ SỬA PHÉP ĐO (lần 1 hỏng): bootstrap dựng bằng `FROM warehouses WHERE active=1` ⇒ ⭐ kho NGỪNG
//    **BIẾN MẤT khỏi danh sách** (⛔ không trả về `active=0`) ⇒ đọc `w.active` luôn ra `undefined` ✓
//    ⇒ ĐO ĐÚNG HIỆN TƯỢNG QUAN SÁT ĐƯỢC: có/không có trong danh sách bootstrap của chính người dùng.
const coTrongDanhSach = async () => {
  const b = await boot(adm.cookie);
  return (b.json?.data?.warehouses || []).some((w) => String(w.id) === String(created?.id));
};
const w3 = await post(adm.cookie, "set_warehouse_status", { warehouseId: created?.id, active: false });
const conSauW3 = await coTrongDanhSach();
check("W3 NGỪNG hoạt động ⇒ 200 + BIẾN MẤT khỏi danh sách kho đang dùng", w3.status === 200 && !conSauW3, `còn trong danh sách? ${conSauW3}`);

const w4 = await post(adm.cookie, "set_warehouse_status", { warehouseId: created?.id, active: true });
const conSauW4 = await coTrongDanhSach();
console.log(`  [W4] BẬT LẠI kho vừa ngừng: HTTP ${w4.status}${w4.json?.error ? " · " + w4.json.error : ""}`);
check("W4 ⭐ BẬT LẠI được (⛔ không 400) + QUAY LẠI danh sách — chốt chống bẫy `findWarehouse`", w4.status === 200 && conSauW4, w4.status === 400 ? "⇒ BẪY ĐÃ QUAY LẠI" : `quay lại danh sách? ${conSauW4}`);

// ── W5 — ĐỐI CHỨNG ÂM: mã trùng ⇒ 400 ──
const w5 = await post(adm.cookie, "save_warehouse", { warehouseId: undefined, code: CODE, name: "Trùng mã" });
check("W5 ĐỐI CHỨNG ÂM: mã trùng ⇒ 400", w5.status === 400, `HTTP ${w5.status}${w5.json?.error ? " · " + w5.json.error : ""}`);

// ── DỌN — ⭐ HOÀN NGUYÊN NGUYÊN TRẠNG (⛔ không để lại rác làm lệch cổng `W-02`) ──
if (ALLOW_CREATE) {
  // ⚠️ Hệ thống CỐ Ý ⛔ không có API xoá kho ⇒ ⛔ không thể tự dọn bằng API.
  await post(adm.cookie, "set_warehouse_status", { warehouseId: created?.id, active: false });
  console.log(`\n  ⛔⚠️ ĐÃ TẠO kho «${CODE}» và ⛔ KHÔNG THỂ xoá bằng API (đúng chốt ALLOW_DELETE_WAREHOUSE=false).`);
  console.log("     ⚠️ PHẢI tự xoá khỏi CSDL, nếu không cổng `W-02` sẽ ĐỎ (số kho lệch tệp audit):");
  console.log(`       mysql -uvntech -pvntech vntech_erp -e "DELETE FROM warehouses WHERE code LIKE 'WH-E2E-%';"`);
} else {
  // ⭐ Trả lại TÊN GỐC + ⭐ **project_id GỐC** + TRẠNG THÁI HOẠT ĐỘNG như trước khi đo.
  // ⚠️ Phải gửi `projectId` GỐC — bỏ trống là ⛔ XOÁ liên kết dự án (xem bài học ở ca W2).
  await post(adm.cookie, "save_warehouse", { warehouseId: created?.id, code: CODE, name: TEN_GOC, projectId: created?.projectId ?? undefined });
  await post(adm.cookie, "set_warehouse_status", { warehouseId: created?.id, active: true });
  const cuoi = await boot(adm.cookie);
  const lai = (cuoi.json?.data?.warehouses || []).find((w) => String(w.id) === String(created?.id));
  const hoanNguyen = String(lai?.name || "") === TEN_GOC;
  console.log(`\n  ⓘ Dọn (⭐ HOÀN NGUYÊN): kho «${CODE}» — tên trả về nguyên trạng? ${hoanNguyen ? "✅" : "❌"} · còn trong danh sách hoạt động? ${Boolean(lai)}`);
  check("DỌN: kho có sẵn được HOÀN NGUYÊN (⛔ không để lại rác)", hoanNguyen && Boolean(lai), `tên=«${lai?.name}»`);
}

console.log("\n" + "─".repeat(78));
const failed = steps.filter((s) => !s.ok);
console.log(`  KẾT QUẢ: ${steps.length - failed.length}/${steps.length} phép kiểm ĐẠT`);
for (const f of failed) console.log(`    ❌ ${f.name}`);
process.exitCode = failed.length === 0 ? 0 : 2;
