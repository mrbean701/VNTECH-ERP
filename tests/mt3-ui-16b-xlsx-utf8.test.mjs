// MT3-UI-16b — HỢP ĐỒNG: XLSX phải GHI ĐÚNG UTF-8 (chứng minh bằng FILE THẬT + GIẢI NÉN ĐỌC LẠI).
//
// MT3 §VII: «Kiểm tra ít nhất MỘT FILE THẬT từ từng cơ chế export. Mở/đọc lại file và đối chiếu:
//   Tên file · Tên sheet · Header tiếng Việt · Nội dung tiếng Việt · Dữ liệu số/ngày».
//
// ⚠️ BÀI HỌC ĐÃ MẮC: kiểm bằng cách tìm chuỗi UTF-8 **thô** trong gói XLSX cho ÂM GIẢ 100%,
//    vì XLSX là ZIP **nén DEFLATE**. ⇒ Phải SINH FILE → GIẢI NÉN → đọc XML bên trong.
//    Test này dùng `zlib.inflateRawSync` để tự giải nén entry ZIP ⇒ kiểm được ngay trong Node,
//    ⛔ không cần công cụ ngoài và ⛔ không gọi mạng.
import test from "node:test";
import assert from "node:assert/strict";
import { inflateRawSync } from "node:zlib";
import { buildSimpleXlsxBytes } from "../lib/tabular-export.ts";

/** Giải nén mọi entry ZIP (phương thức 8 = DEFLATE, 0 = stored) → trả về { tênEntry: nội dung UTF-8 }. */
function unzipEntries(buf) {
  const out = {};
  // Quét chữ ký local file header: PK\x03\x04
  for (let i = 0; i + 30 < buf.length; i++) {
    if (!(buf[i] === 0x50 && buf[i + 1] === 0x4b && buf[i + 2] === 0x03 && buf[i + 3] === 0x04)) continue;
    const method = buf.readUInt16LE(i + 8);
    const compSize = buf.readUInt32LE(i + 18);
    const nameLen = buf.readUInt16LE(i + 26);
    const extraLen = buf.readUInt16LE(i + 28);
    const name = buf.subarray(i + 30, i + 30 + nameLen).toString("utf8");
    const dataStart = i + 30 + nameLen + extraLen;
    if (!compSize) continue;                                   // ⛔ bỏ entry ghi bằng data descriptor (không có size)
    const raw = buf.subarray(dataStart, dataStart + compSize);
    try {
      out[name] = (method === 8 ? inflateRawSync(raw) : raw).toString("utf8");
    } catch { /* entry không giải nén được thì bỏ qua */ }
  }
  return out;
}

const VI_TITLE = "BÁO CÁO VẬT TƯ — THÁNG 9/2026";
const VI_SHEET = "Vật tư tồn";
const VI_ROWS = [
  ["VT-001", "Thép hộp mạ kẽm 40×40×1.8mm", "m", 125000, "2026-09-14"],
  ["VT-002", "Ống gió vuông Đồng Tâm — Cấp 1", "m²", 98000, "2026-09-15"],
  ["VT-003", "Dây LAN RJ45 CAT6e (ĐVT: cuộn)", "cuộn", 1450000, "2026-09-16"],
];

function build() {
  return Buffer.from(buildSimpleXlsxBytes({
    sheetName: VI_SHEET, title: VI_TITLE, subtitle: "Bản chứng minh Unicode — VNTECH ERP",
    headers: ["Mã vật tư", "Tên vật tư", "ĐVT", "Đơn giá", "Ngày nhập"],
    rows: VI_ROWS, freezeRows: 1,
  }));
}

test("MT3-UI-16b — file XLSX sinh ra là gói ZIP hợp lệ và ⛔ KHÔNG chèn BOM", () => {
  const buf = build();
  assert.ok(buf.length > 1000, `file quá nhỏ (${buf.length} bytes) — nghi không phải gói thật`);
  assert.deepEqual([...buf.subarray(0, 4)], [0x50, 0x4b, 0x03, 0x04], "phải có chữ ký ZIP PK\\x03\\x04");
  assert.notDeepEqual([...buf.subarray(0, 3)], [0xef, 0xbb, 0xbf], "⛔ XLSX KHÔNG được chèn BOM (chỉ CSV mới cần)");
});

test("MT3-UI-16b — GIẢI NÉN gói và đối chiếu: tên sheet + tiêu đề + header + nội dung tiếng Việt", () => {
  const entries = unzipEntries(build());
  const names = Object.keys(entries);
  assert.ok(names.length >= 4, `phải giải nén được nhiều entry, chỉ có: ${names.join(", ")}`);
  const wb = entries["xl/workbook.xml"] ?? "";
  const sheet = entries["xl/worksheets/sheet1.xml"] ?? "";
  assert.ok(wb.length > 0, `thiếu xl/workbook.xml (có: ${names.join(", ")})`);
  assert.ok(sheet.length > 0, `thiếu xl/worksheets/sheet1.xml (có: ${names.join(", ")})`);

  // TÊN SHEET (tiếng Việt, có dấu)
  assert.ok(wb.includes(VI_SHEET), `tên sheet «${VI_SHEET}» KHÔNG còn nguyên trong workbook.xml`);
  // TIÊU ĐỀ + HEADER + NỘI DUNG (gồm ký tự khó: × · ² · — · Đ/đ)
  for (const text of [VI_TITLE, "Mã vật tư", "ĐVT", ...VI_ROWS.map((r) => String(r[1]))]) {
    assert.ok(sheet.includes(text), `chuỗi «${text}» KHÔNG còn nguyên trong sheet1.xml ⇒ hỏng Unicode`);
  }
});

test("MT3-UI-16b — dữ liệu SỐ và NGÀY còn nguyên trong file", () => {
  const sheet = unzipEntries(build())["xl/worksheets/sheet1.xml"] ?? "";
  assert.ok(sheet.length > 0, "không giải nén được sheet1.xml");
  assert.ok(sheet.includes("125000"), "số 125000 không còn trong file");
  assert.ok(sheet.includes("2026-09-14"), "ngày 2026-09-14 không còn trong file");
});

test("MT3-UI-16b — ⛔ KHÔNG được mất dấu: kiểm phản chứng (chuỗi KHÔNG dấu phải VẮNG)", () => {
  const sheet = unzipEntries(build())["xl/worksheets/sheet1.xml"] ?? "";
  // Nếu bị mã hoá sai (mất dấu) thì chuỗi không dấu sẽ xuất hiện thay cho chuỗi có dấu.
  for (const broken of ["Vat tu ton", "Ma vat tu", "Thep hop ma kem", "Ong gio vuong Dong Tam"]) {
    assert.equal(sheet.includes(broken), false, `⛔ nghi mất dấu: thấy «${broken}» trong file`);
  }
});
