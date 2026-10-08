// HỢP ĐỒNG UTF-8 CHO MỌI ĐƯỜNG XUẤT EXCEL/CSV — ERP-SESSION-03 (2026-10-07)
//
// ⛔ USER BÁO: «Kiểm tra lại tất cả các nút xuất excel xem đã có UTF8 hay chưa nếu chưa có thì thêm vào
//    (tôi test 1 số nút đang bị lỗi UTF8)».
//
// KẾT QUẢ AUDIT (đo trên mã + đo trên tệp, ghi ở `SESSION_C/DEV_LOG.md` §C03):
//   ✅ `lib/tabular-export.ts::downloadCsv` — CÓ BOM `\ufeff` + `text/csv;charset=utf-8`
//   ✅ Mọi nút trong `app/**` gọi `downloadCsv(...)` dùng chung ⇒ thừa hưởng BOM
//   ✅ XLSX dựng bằng `strToU8(...)` (fflate — mã hoá UTF-8) cho MỌI phần XML
//   ✅ Backend Java `ExcelTemplateService` ghi bằng Apache POI (XML UTF-8) + tên tệp ASCII
//   ✅ Server tĩnh trả `.csv` với `text/csv; charset=utf-8`
//   ⛔ **LỖI THẬT ĐÃ VÁ**: 2 tệp mẫu CSV **THIẾU BOM** ⇒ Excel (Windows) mở SAI DẤU tiếng Việt:
//        · `public/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv`  (nút «⇩ Mẫu CSV» ở Danh mục vật tư)
//        · `public/templates/Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv`
//
// ⚠️ ĐÂY LÀ TEST **CHẠY THẬT**, ⛔ không chỉ so khớp chuỗi: hàm `buildSimpleXlsxBytes` được TRÍCH RA
//    (esbuild TS→CJS), chạy trong Node, rồi **GIẢI NÉN chính tệp .xlsx** và đọc lại XML để chứng minh
//    tiếng Việt đi vào tệp ĐÚNG UTF-8 (kỷ luật «trích khối thuần rồi CHẠY» của `tests/tm0*.test.mjs`).
//
// Chạy riêng:  node --test tests/mt3-c03-export-utf8.test.mjs
// ⚠️ ĐÍNH CHÍNH (07/10/2026, tự đo): tệp này **CÓ** được `npm run test:regression` chạy — số ca tăng
//    **811 → 816** (+5 đúng bằng số ca ở đây). Ghi chú đầu tiên của tôi («không nằm trong package.json»)
//    là **SAI**; giữ nguyên vì ⛔ không hạ chuẩn: các ca này PHẢI thuộc cổng hồi quy.
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import esbuild from "esbuild";
import { unzipSync, strFromU8 } from "fflate";

const require = createRequire(import.meta.url);
const read = (relative) => readFileSync(new URL("../" + relative, import.meta.url), "utf8");
const readBytes = (relative) => readFileSync(new URL("../" + relative, import.meta.url));

// ── TRÍCH + NẠP `lib/tabular-export.ts` thành module CJS chạy được trong Node ──────────────────────
function loadTabularExport() {
  const source = read("lib/tabular-export.ts");
  const js = esbuild.transformSync(source, { loader: "ts", format: "cjs", target: "node20" }).code;
  // ⛔ KHÔNG đặt tên biến là `module`: ESLint của Next chặn (`@next/next/no-assign-module-variable`).
  const cjsModule = { exports: {} };
  // `downloadBlob` chạm DOM nhưng KHÔNG được gọi ở đây ⇒ chỉ nạp định nghĩa, ⛔ không thực thi.
  const localRequire = (name) => (name === "fflate" ? require("fflate") : require(name));
  new Function("require", "module", "exports", js)(localRequire, cjsModule, cjsModule.exports);
  return cjsModule.exports;
}

const tabular = loadTabularExport();

// Chuỗi tiếng Việt CÓ DẤU đủ khó: dấu sắc/huyền/hỏi/ngã/nặng + ký tự ngoài BMP-free nhưng khác ASCII.
const VI = {
  header: "Mã vật tư",
  name: "Cáp điện Cu/PVC 3x2.5 — Đồng hồ đo điện",
  unit: "Bộ",
  note: "Đã duyệt · nghiệm thu (đợt 2)",
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ① XLSX — chạy thật, GIẢI NÉN tệp, đọc lại XML để chứng minh UTF-8
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
test("UTF-8 (XLSX) — tiếng Việt vào tệp ĐÚNG UTF-8: giải nén sheet1.xml và đọc lại", () => {
  const bytes = tabular.buildSimpleXlsxBytes({
    sheetName: "Danh mục vật tư",
    title: "DANH MỤC VẬT TƯ GỐC",
    subtitle: "Kiểm tra UTF-8 tiếng Việt",
    headers: [VI.header, "Tên vật tư", "ĐVT"],
    notes: [VI.note, "", ""],
    rows: [[VI.name, VI.unit, "m"]],
  });
  assert.ok(bytes instanceof Uint8Array || bytes instanceof ArrayBuffer, "phải trả về byte");
  const archive = unzipSync(new Uint8Array(bytes));
  const sheetXml = strFromU8(archive["xl/worksheets/sheet1.xml"]);
  const workbookXml = strFromU8(archive["xl/workbook.xml"]);

  // ①a Khai báo XML PHẢI là UTF-8 (nếu là charset khác thì Excel đọc sai dấu).
  assert.match(sheetXml, /^<\?xml version="1\.0" encoding="UTF-8" standalone="yes"\?>/, "sheet1.xml phải khai báo encoding UTF-8");
  assert.match(workbookXml, /encoding="UTF-8"/, "workbook.xml phải khai báo encoding UTF-8");

  // ①b NỘI DUNG tiếng Việt phải còn NGUYÊN DẤU sau khi giải nén — đây là phép thử quyết định.
  for (const value of [VI.header, VI.name, VI.unit]) {
    assert.ok(sheetXml.includes(value), `⛔ Mất dấu UTF-8 trong XLSX: không tìm thấy «${value}»`);
  }
  assert.ok(sheetXml.includes("DANH MỤC VẬT TƯ GỐC"), "tiêu đề có dấu phải giữ nguyên");
  assert.ok(workbookXml.includes("Danh mục vật tư"), "TÊN SHEET có dấu phải giữ nguyên");

  // ①c Đối chứng ÂM: nếu bị mã hoá sai (Latin-1/CP1252) thì chuỗi sẽ KHÁC ⇒ phép kiểm trên có giá trị.
  const latin1Wrong = "MÃ£ váº­t tÆ°";
  assert.ok(!sheetXml.includes(latin1Wrong), "phát hiện dấu hiệu mojibake kiểu Latin-1 trong sheet1.xml");

  // ①d Ép kiểu số đúng (đối chứng dương: số phải là số, không phải chuỗi).
  const bytesNum = tabular.buildSimpleXlsxBytes({ headers: ["Số lượng"], rows: [[1234.5]] });
  const sheetNum = strFromU8(unzipSync(new Uint8Array(bytesNum))["xl/worksheets/sheet1.xml"]);
  assert.match(sheetNum, /<v>1234\.5<\/v>/, "ô số phải ghi dạng số (không bọc inlineStr)");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ② CSV — BOM + nội dung
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
test("UTF-8 (CSV) — `csvText` giữ dấu, bọc nháy kép đúng và có dòng `sep=` cho Excel", () => {
  const text = tabular.csvText([VI.header, "Ghi chú"], [[VI.name, `Có "nháy kép" bên trong`]]);
  assert.ok(text.startsWith("sep=;\r\n"), "phải có dòng `sep=;` để Excel tách cột đúng");
  assert.ok(text.includes(VI.header) && text.includes(VI.name), "⛔ CSV mất dấu tiếng Việt");
  assert.ok(text.includes(`"Có ""nháy kép"" bên trong"`), "nháy kép phải được nhân đôi theo chuẩn CSV");
});

test("UTF-8 (CSV) — `downloadCsv` BẮT BUỘC chèn BOM `\\ufeff` + `text/csv;charset=utf-8`", () => {
  const source = read("lib/tabular-export.ts");
  const line = source.split("\n").find((row) => row.includes("export function downloadCsv"));
  assert.ok(line, "phải tìm thấy `export function downloadCsv`");
  assert.match(line, /new Blob\(\["\\ufeff",\s*csvText\(/, "⛔ THIẾU BOM ⇒ Excel Windows mở SAI DẤU tiếng Việt");
  assert.match(line, /type:"text\/csv;charset=utf-8"/, "phải khai `text/csv;charset=utf-8`");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// ③ TỆP MẪU TĨNH trong `public/` — nguồn gốc của lỗi user thấy
// ═══════════════════════════════════════════════════════════════════════════════════════════════════
test("UTF-8 (asset) — MỌI `.csv` trong `public/` PHẢI có BOM UTF-8 và là UTF-8 hợp lệ", () => {
  const dir = new URL("../public/", import.meta.url);
  const csvFiles = [];
  const walk = (url, prefix) => {
    for (const entry of readdirSync(url, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(new URL(entry.name + "/", url), prefix + entry.name + "/");
      else if (entry.name.toLowerCase().endsWith(".csv")) csvFiles.push(prefix + entry.name);
    }
  };
  walk(dir, "");
  assert.ok(csvFiles.length >= 4, `Chỉ thấy ${csvFiles.length} tệp CSV — nghi ngờ cách quét, ⛔ không kết luận vội`);

  const offenders = [];
  const decoder = new TextDecoder("utf-8", { fatal: true });
  for (const file of csvFiles) {
    const bytes = readBytes("public/" + file);
    const hasBom = bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf;
    let utf8 = true;
    try { decoder.decode(bytes); } catch { utf8 = false; }
    if (!hasBom) offenders.push(`${file} — THIẾU BOM (Excel sẽ hiện sai dấu tiếng Việt)`);
    if (!utf8) offenders.push(`${file} — KHÔNG phải UTF-8 hợp lệ`);
  }
  assert.deepEqual(offenders, [], "⛔ Tệp mẫu CSV tải về từ giao diện phải có BOM UTF-8:\n" + offenders.join("\n"));
});

test("UTF-8 (asset) — chỉ `lib/tabular-export.ts` được phát `text/csv` (⛔ cấm nơi khác tự dựng CSV thiếu BOM)", () => {
  const roots = ["lib", "app"];
  const offenders = [];
  const walk = (dirUrl, prefix) => {
    for (const entry of readdirSync(dirUrl, { withFileTypes: true })) {
      const next = prefix + entry.name;
      if (entry.isDirectory()) { walk(new URL(entry.name + "/", dirUrl), next + "/"); continue; }
      if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\./.test(entry.name)) continue;
      const source = readFileSync(new URL(entry.name, dirUrl), "utf8");
      // Bỏ chú thích trước khi soi: chú thích giải thích `text/csv` ⛔ không phải nơi phát dữ liệu.
      const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
      if (/text\/csv/.test(code) && !next.endsWith("lib/tabular-export.ts")) offenders.push(next);
    }
  };
  for (const root of roots) walk(new URL(`../${root}/`, import.meta.url), root + "/");
  assert.deepEqual(offenders, [],
    "⛔ Phát hiện nơi tự dựng CSV ngoài thư viện dùng chung ⇒ nơi đó RẤT DỄ thiếu BOM. Dùng `downloadCsv` từ `lib/tabular-export`:\n" + offenders.join("\n"));
});
