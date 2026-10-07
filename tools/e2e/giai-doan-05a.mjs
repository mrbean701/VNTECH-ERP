// BƯỚC 5A — CHUẨN BỊ HỢP ĐỒNG + BOQ CHO DỰ ÁN E2E
// `create_request` cho phép để trống HĐ/BOQ, nhưng kịch bản thật của anh là mua hàng THEO HỢP ĐỒNG CÓ BOQ,
// và bước "đối chiếu khối lượng" chỉ chạy được khi có đủ Dự án → Hợp đồng → BOQ Version.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { login, bootstrap, coThat, buoc, tomTatBuoc, ghi, tieuDe } from "./client.mjs";

const BC = [];
const tt = JSON.parse(readFileSync("tools/e2e/trang-thai-01.json", "utf8"));
const HN = "E2E-HĐ-001";
const BV = "V1";

tieuDe("BƯỚC 5A — CHUẨN BỊ HỢP ĐỒNG + BOQ");
await login("admin", "Admin123456@");
let bs = await bootstrap();
ghi({ giaiDoan: "5A", buoc: "bat-dau" });

// ── 5A.1 HỢP ĐỒNG ───────────────────────────────────────────────────────────
console.log("[5A.1] Hợp đồng dự án:");
let hd = bs.projectContracts.find((c) => c.contractNo === HN);
if (hd) {
  console.log("      đã có: " + hd.contractNo + " · " + hd.contractName + " (" + hd.id + ") → dùng lại");
} else {
  await buoc("save_project_contract " + HN, () => coThat("save_project_contract", {
    projectId: tt.duAn,
    contractNo: HN, contractName: "Hợp đồng thi công chính — kiểm thử E2E",
    contractType: "main", signedAt: "2026-09-01", effectiveFrom: "2026-09-01", effectiveTo: "2027-09-01",
    note: "Hợp đồng tạo cho kịch bản kiểm thử E2E",
  }), BC);
  bs = await bootstrap();
  hd = bs.projectContracts.find((c) => c.contractNo === HN);
  console.log("      sau khi ghi: " + (hd ? hd.contractNo + " · " + hd.id : "KHÔNG THẤY TRONG DỮ LIỆU MÁY CHỦ"));
  if (!hd) { console.log("      [LOI] lệnh báo thành công nhưng không có hợp đồng tương ứng"); process.exitCode = 1; }
}

// ── 5A.2 BOQ VERSION ────────────────────────────────────────────────────────
console.log("\n[5A.2] Phiên bản BOQ:");
if (!hd) { console.log("      [LOI] thiếu hợp đồng → dừng"); process.exitCode = 1; }
else {
  let bv = bs.boqVersions.find((v) => v.contractId === hd.id && v.versionCode === BV);
  if (bv) {
    console.log("      đã có: " + bv.versionCode + " · " + bv.versionName + " (" + bv.id + ") → dùng lại");
  } else {
    await buoc("save_boq_version " + BV, () => coThat("save_boq_version", {
      projectId: tt.duAn, contractId: hd.id, versionCode: BV, versionName: "BOQ gốc E2E",
      revisionType: "original", effectiveAt: "2026-09-01", makeActive: true,
    }), BC);
    bs = await bootstrap();
    bv = bs.boqVersions.find((v) => v.contractId === hd.id && v.versionCode === BV);
    console.log("      sau khi ghi: " + (bv ? bv.versionCode + " · " + bv.id + " · active=" + bv.active : "KHÔNG THẤY"));
    if (!bv) { console.log("      [LOI] lệnh báo thành công nhưng không có BOQ version"); process.exitCode = 1; }
  }

  // ── 5A.3 DÒNG BOQ — cần có mã vật tư E2E trước ───────────────────────────
  console.log("\n[5A.3] Dòng BOQ:");
  const vtE2E = bs.materials.filter((m) => String(m.code || "").startsWith("E2E-"));
  const coBoq = bs.boqItems.filter((b) => b.boqVersionId === bv?.id && b.materialCode != null);
  console.log("      mã vật tư E2E hiện có: " + vtE2E.length + " · dòng BOQ đã có: " + coBoq.length);
  if (!vtE2E.length) {
    console.log("      ⏳ CHƯA CÓ mã vật tư E2E (Giai đoạn 4 chưa xong) — bỏ qua bước này, chạy lại sau.");
  } else if (!coBoq.length) {
    const lay = vtE2E.slice(0, 12);
    let okc = 0;
    for (let i = 0; i < lay.length; i++) {
      const m = lay[i];
      const r = await buoc("save_boq_item " + m.code, () => coThat("save_boq_item", {
        projectId: tt.duAn, contractId: hd.id, boqVersionId: bv.id,
        rowRole: "material", itemType: "contract", systemCode: m.system || "KHAC",
        materialId: m.id, materialCode: m.code, materialName: m.name, unit: m.unit || "cái",
        contractQty: 100 + i * 10, remeasuredQty: 100 + i * 10, unitPrice: m.standardPrice || 100000,
        lineNo: i + 1, reason: "Dựng dòng BOQ cho kiểm thử E2E",
      }), BC);
      if (r?.ok !== false) okc++;
    }
    bs = await bootstrap();
    // ⛔ Chi dem DONG THAT da ghi (co `materialCode`). `boqItems` con gop them dong nguon
    //    chua anh xa — dong do `materialCode = null` nen khong so voi `lay.length` duoc.
    const n = bs.boqItems.filter((b) => b.boqVersionId === bv.id && b.materialCode != null).length;
    console.log("      lệnh ghi " + lay.length + " · đếm lại từ máy chủ = " + n + " dòng BOQ");
    if (n !== lay.length) { console.log("      [LOI] số dòng ghi ra khác số dòng đếm được"); process.exitCode = 1; }
    void okc;
  } else {
    console.log("      đã có " + coBoq.length + " dòng → dùng lại");
  }
}

const thu = { ...tt, hopDongId: hd?.id || null, hopDongNo: hd?.contractNo || null, boqVersionId: bs.boqVersions.find((v) => v.contractId === hd?.id && v.versionCode === BV)?.id || null };
writeFileSync("tools/e2e/trang-thai-01.json", JSON.stringify(thu, null, 2), "utf8");
if (!existsSync("tools/e2e/trang-thai-01.json")) process.exitCode = 1;
ghi({ giaiDoan: "5A", buoc: "ket-thuc", hopDong: hd?.id, thatBai: BC.filter((x) => !x.ok).map((x) => x.ten) });
tomTatBuoc("BƯỚC 5A", BC);