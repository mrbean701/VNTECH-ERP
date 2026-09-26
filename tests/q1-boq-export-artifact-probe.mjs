// PROBE TASK-122 (chỉ đọc, KHÔNG ghi dữ liệu) — đo ĐẦU-CUỐI trên HÀM XUẤT THẬT + DÒNG BOQ THẬT.
//
// Điều DUY NHẤT probe này đo được mà test hợp đồng (`tests/q1-boq-export-display.test.mjs`) không đo:
//   BYTES `.xlsx` THẬT do `buildBoqXlsxBytes` sinh ra (ZIP nén DEFLATE) — phải giải nén mới đọc được chuỗi ô.
// Nhánh `downloadBoqPriceTemplate*` có DOM (`Blob`/`document`) nên không import trực tiếp trong Node được;
// 2 mảng dòng của nhánh đó đã được đo ở tầng nguồn tại test hợp đồng ① và ④.
//
//   node --import tsx tests/q1-boq-export-artifact-probe.mjs
import { readFileSync } from "node:fs";
import { unzipSync, strFromU8 } from "fflate";
import { buildBoqXlsxBytes } from "../lib/boq-export.ts";
import { boqLineDisplayCode } from "../lib/boq-line-display.ts";

const payload = JSON.parse(readFileSync(new URL("./q1-boq-lines-payload.json", import.meta.url), "utf8"));
let pass = 0;
let fail = 0;
const check = (ok, text) => { console.log(`${ok ? "  ✔" : "  ✘"} ${text}`); if (ok) pass++; else fail++; };

console.log("═══ TASK-122 · Q1-A — ĐO BYTES .XLSX THẬT (chỉ đọc) ═══");
console.log(`Nguồn dòng BOQ: tests/q1-boq-lines-payload.json (${payload.length} dòng THẬT, đo LIVE GET /api/system)`);

// `.xlsx` là ZIP nén DEFLATE (fflate `zipSync`) ⇒ PHẢI giải nén mới đọc được chuỗi ô; quét bytes thô là VÔ NGHĨA.
const sheetTextOf = (bytes) => strFromU8(unzipSync(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes))["xl/worksheets/sheet1.xml"]);

const doc = { projectCode: "PRJ-DEMO-01", projectName: "Dự án mẫu chuẩn hóa quy trình VNTECH", rows: payload };
const bytes = buildBoqXlsxBytes(doc);
const sheet = sheetTextOf(bytes);
console.log(`\n1) Nhánh XLSX — ${bytes.length} byte nén → ${sheet.length} ký tự XML sheet; quét chuỗi ô thật:`);
const leaked = payload.filter((row) => sheet.includes(String(row.id)));
check(leaked.length === 0, `0/${payload.length} GUID dòng BOQ xuất hiện trong sheet XML`);
check(!sheet.includes("BOQ_") && !sheet.includes("BQS_"), "sheet XML KHÔNG còn chuỗi khoá kỹ thuật `BOQ_`/`BQS_`");
check(sheet.includes("KHAC-VLXD-004"), "sheet XML CÓ mã vật tư thật «KHAC-VLXD-004» (dữ liệu nghiệp vụ vẫn ghi ra bình thường)");
check(sheet.includes("Thép hộp 40x40"), "sheet XML CÓ tên vật tư thật «Thép hộp 40x40»");

console.log("\n2) ĐỐI CHỨNG ÂM — dòng CHỈ có `id` GUID (không nguồn nào khác):");
const orphan = { id: payload[0].id, projectCode: "PRJ-DEMO-01" };
check(boqLineDisplayCode(orphan) === "chưa có nguồn", `hàm thuần trả ĐÚNG «chưa có nguồn» (nhận «${boqLineDisplayCode(orphan)}»)`);
const orphanSheet = sheetTextOf(buildBoqXlsxBytes({ ...doc, rows: [orphan] }));
check(!orphanSheet.includes("36a50087"), "sheet XML của dòng thiếu nguồn KHÔNG chứa GUID");
// ⚠️ `buildBoqXlsxBytes` là hàm xuất BOQ THEO CẤU HÌNH CỘT (không có cột «Mã dòng BOQ»). Nên ở nhánh này
// KHÔNG kỳ vọng chuỗi «chưa có nguồn»: dòng mồ côi phải để các ô nghiệp vụ TRỐNG thay vì nhét GUID vào.
check(!orphanSheet.includes("KHAC-VLXD-004") && !orphanSheet.includes("Thép hộp 40x40"), "dòng chỉ có `id` ⇒ các ô nghiệp vụ TRỐNG (không mượn dữ liệu dòng khác)");

const shown = payload.map((row) => boqLineDisplayCode(row));
console.log(`\n3) Mã hiển thị mà Excel nhận được cho ${payload.length} dòng thật:`);
shown.forEach((value, index) => console.log(`   dòng ${index + 1}: «${value}»`));

console.log(`\n═══ KẾT QUẢ: ${pass} ĐẠT · ${fail} HỎNG ═══`);
process.exit(fail ? 1 : 0);
