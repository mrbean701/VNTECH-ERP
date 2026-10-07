// GO-LIVE 05/10/2026 — KIỂM MỌI ACTION ĐỌC CÒN LẠI (TASK-210).
//
// ⭐⭐ VÌ SAO BÀI NÀY — **2 TRONG 3 LỖI 500 CỦA PHIÊN LÀ ACTION ĐỌC**:
//   · BUG-20261005-012 `check_material_alias_conflicts` — SQL 1055 (⚙️ đọc, ⛔ không ghi)
//   · BUG-20261005-013 `preview_material_dependencies` — SQL 1054 (⚙️ đọc, ⛔ không ghi)
//   ⇒ ⭐ **ACTION ĐỌC LÀ NƠI LỖI SQL ẨN** ✓
//   ⭐⭐ **VÀ CHÚNG ⛔ KHÔNG TẠO DỮ LIỆU** ⇒ ⭐ **KIỂM ĐƯỢC RẤT AN TOÀN** ✓
//
// ⭐ CÁCH LÀM: lấy **MỌI action** trong `ActionRbacRegistry`, ⛔ loại:
//   · action ĐÃ KIỂM (có trong các bài E2E khác — ⭐ đo bằng khớp RANH GIỚI)
//   · ⛔ **LOẠI TRỪ CÓ LÝ DO**: action PHÁ HOẠI / CẤU HÌNH / BẢO MẬT / PHIÊN / EMAIL
//     (`factory_reset_*` · `reset_*` · `rebuild_department_permissions` · `revoke_*` · `retry_email`
//      · `reorder_menu_layout` · `save_*` cấu hình · `update_profile_signature` · `delete_unused_materials`
//      · `request_license_transfer` · `request_material_master_from_boq` · `save_user_access`
//      · `save_department_permission` · `delete_department_permission`)
//   ⇒ ⭐ **CÒN LẠI = ACTION ĐỌC / TIỆN ÍCH CHƯA KIỂM** ⇒ gọi với **payload RỖNG** rồi **tham số MÉO `"1"`**
//      ⇒ ⛔ **kỳ vọng KHÔNG 5xx** ✓
//
// ⛔ KỶ LUẬT: `chup-so-dong.mjs --truoc/--sau` + đối chiếu MỌI mảng bootstrap (⭐ đọc ⇒ ⛔ phải KHÔNG đổi)
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { login, call, bootstrap, buoc, tomTatBuoc, tieuDe } from "./client.mjs";

const MK = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8")).matKhau;
const BC = [];

// ── BƯỚC 1: lấy mọi action trong registry, loại cái đã kiểm + cái loại-trừ-có-lý-do ────────
const reg = readFileSync("java-backend/application/src/main/java/com/vntech/erp/application/rbac/ActionRbacRegistry.java", "utf8");
const moiAction = [...new Set([...reg.matchAll(/Map\.entry\("([a-z][\w]+)"/g)].map((m) => m[1]))].sort();

// ⭐ action ĐÃ KIỂM: gom mọi tên action xuất hiện trong các bài E2E khác (khớp RANH GIỚI)
const bai = readdirSync("tools/e2e").filter((f) => f.endsWith(".mjs") && !f.startsWith("tmp-"))
  .map((f) => readFileSync(join("tools/e2e", f), "utf8")).join("\n");
const daKiem = new Set(moiAction.filter((a) => bai.includes(`"${a}"`)));

// ⛔ LOẠI TRỪ CÓ LÝ DO
const LOAI_TRU = /^(factory_reset_|reset_|rebuild_|revoke_|retry_email|reorder_menu_layout|request_license|request_material_master|delete_unused_materials|update_profile_signature|save_user_access|save_department_permission|delete_department_permission)/;
const conLai = moiAction.filter((a) => !daKiem.has(a) && !LOAI_TRU.test(a));

tieuDe(`KIỂM ${conLai.length} ACTION CHƯA KIỂM — payload RỖNG + tham số MÉO ⇒ ⛔ KHÔNG 5xx`);
console.log(`   ⓘ registry: ${moiAction.length} action · đã kiểm: ${daKiem.size} · ⛔ loại trừ: ${moiAction.filter((a) => LOAI_TRU.test(a)).length} ⇒ ⭐ còn: ${conLai.length}`);
console.log(`   ⭐ danh sách: ${conLai.join(" · ")}\n`);

await login("admin", "Admin123456@");
const bs0 = await bootstrap();
const KHOA = Object.keys(bs0).filter((k) => Array.isArray(bs0[k]));
const d0 = Object.fromEntries(KHOA.map((k) => [k, (bs0[k] || []).length]));

// ⭐ tham số MÉO: khoá thường gặp, giá trị `"1"` (⭐ không rỗng nhưng sai định dạng)
const KHOA_MEO = ["id", "code", "date", "year", "type", "status", "projectId", "contractId", "userId",
  "materialId", "supplierId", "partnerId", "teamId", "warehouseId", "groupId", "workflowId", "stageId",
  "logId", "entryId", "voucherId", "docId", "corrId", "planId", "sealId", "normId", "benefitId", "level"];
const meo = () => Object.fromEntries(KHOA_MEO.map((k) => [k, "1"]));

for (const a of conLai) {
  await buoc(`${a} — payload RỖNG ⇒ ⛔ không 5xx`, async () => {
    const r = await call(a, {}, { boQuaLoi: true });
    const ma = r?.status ?? r?.statusCode ?? r?._status;
    if (typeof ma === "number" && ma >= 500) throw new Error(`⚠️⚠️ ${ma} — 500 với payload RỖNG`);
    const loi = String(r?._loi || r?.message || "");
    if (/Exception|Internal Server Error|SQLSyntax|1054|1055|1048/i.test(loi)) throw new Error(`⚠️ NGHI 5xx/SQL: «${loi.slice(0, 85)}»`);
    return r.ok ? "200" : `400 · ${loi.slice(0, 40)}`;
  }, BC);

  await buoc(`${a} — tham số MÉO "1" ⇒ ⛔ không 5xx`, async () => {
    const r = await call(a, meo(), { boQuaLoi: true });
    const ma = r?.status ?? r?.statusCode ?? r?._status;
    if (typeof ma === "number" && ma >= 500) throw new Error(`⚠️⚠️ ${ma} — 500 với tham số MÉO "1"`);
    const loi = String(r?._loi || r?.message || "");
    if (/Exception|Internal Server Error|SQLSyntax|1054|1055|1048/i.test(loi)) throw new Error(`⚠️ NGHI 5xx/SQL: «${loi.slice(0, 85)}»`);
    return r.ok ? "200" : `400 · ${loi.slice(0, 40)}`;
  }, BC);
}

// ── KIỂM HẬU QUẢ (⭐ action đọc ⇒ ⛔ phải KHÔNG đổi gì) ─────────────────────────────────
const bs9 = await bootstrap();
const d9 = Object.fromEntries(KHOA.map((k) => [k, (bs9[k] || []).length]));
const doi = KHOA.filter((k) => d0[k] !== d9[k]);
console.log(`\n   HẬU QUẢ — ${KHOA.length} mảng bootstrap: ${doi.length === 0 ? "✔ KHÔNG mảng nào đổi (action đọc ⇒ ⛔ không ghi)" : "⚠️ " + doi.map((k) => `${k}: ${d0[k]}→${d9[k]}`).join(" · ")}`);

console.log("\n" + tomTatBuoc(`KIỂM ${conLai.length} ACTION CHƯA KIỂM (RỖNG + MÉO)`, BC));
process.exitCode = BC.some((b) => b.loi) ? 1 : 0;
