// BỘ SINH DOCX THUẦN NODE — không phụ thuộc ngoài (không pandoc, không python-docx, không node_modules).
// Bám ĐÚNG chuẩn của 36 tài liệu bàn giao sẵn có:
//   trang A4 11906×16838 twip · cạnh 1134 twip (2 cm) · Calibri 11pt · East Asian Times New Roman
//   Title 22pt #1F4E79 · H1 16pt #1F4E79 · H2 13pt #2E74B5 · H3 11,5pt #404040 · đường viền bảng #999999
import { deflateRawSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const A4 = [11906, 16838], CANH_LE = 1134, HEADER_FOOTER = 708;
const MAU = { tieuDe: "1F4E79", h1: "1F4E79", h2: "2E74B5", h3: "404040", duong: "999999" };

// ── CRC32 ────────────────────────────────────────────────────────────────────
const BANG_CRC = (() => {
  const b = new Int32Array(256);
  for (let i = 0; i < 256; i++) { let c = i; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; b[i] = c; }
  return b;
})();
const crc32 = (buf) => { let c = -1; for (let i = 0; i < buf.length; i++) c = BANG_CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); return (c ^ -1) >>> 0; };

// ── ZIP (nén deflate) ────────────────────────────────────────────────────────
const DOS_TIME = 0, DOS_DATE = ((2026 - 1980) << 9) | (10 << 5) | 1; // cố định để sinh lại ra kết quả giống nhau
function zip(teu) {
  const local = [], central = [];
  let offset = 0;
  for (const [ten, noiDung] of teu) {
    const tenBuf = Buffer.from(ten, "utf8");
    const duLieu = Buffer.from(noiDung, "utf8");
    const nen = deflateRawSync(duLieu, { level: 9 });
    const crc = crc32(duLieu);
    const h = Buffer.alloc(30);
    h.writeUInt32LE(0x04034b50, 0); h.writeUInt16LE(20, 4); h.writeUInt16LE(0, 6); h.writeUInt16LE(8, 8);
    h.writeUInt16LE(DOS_TIME, 10); h.writeUInt16LE(DOS_DATE, 12); h.writeUInt32LE(crc, 14);
    h.writeUInt32LE(nen.length, 18); h.writeUInt32LE(duLieu.length, 22);
    h.writeUInt16LE(tenBuf.length, 26); h.writeUInt16LE(0, 28);
    local.push(h, tenBuf, nen);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(20, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0, 8); c.writeUInt16LE(8, 10);
    c.writeUInt16LE(DOS_TIME, 12); c.writeUInt16LE(DOS_DATE, 14); c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(nen.length, 20); c.writeUInt32LE(duLieu.length, 24);
    c.writeUInt16LE(tenBuf.length, 28); c.writeUInt16LE(0, 30); c.writeUInt16LE(0, 32);
    c.writeUInt16LE(0, 34); c.writeUInt16LE(0, 36); c.writeUInt32LE(0, 38); c.writeUInt32LE(offset, 42);
    central.push(c, tenBuf);
    offset += h.length + tenBuf.length + nen.length;
  }
  const cd = Buffer.concat(central);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(0, 4); eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(teu.length, 8); eocd.writeUInt16LE(teu.length, 10);
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16); eocd.writeUInt16LE(0, 20);
  return Buffer.concat([...local, cd, eocd]);
}

// ── XML ──────────────────────────────────────────────────────────────────────
const thoat = (s) => String(s ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
  // ⛔ Ký tự điều khiển XML làm tệp Word báo lỗi ⇒ loại bỏ.
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");

const STYLE_ID = { tieuDe: "Title", h1: "Heading1", h2: "Heading2", h3: "Heading3", doan: "BodyText", code: "CodeLine" };
const RUN = (text, { bold = false, color = null, size = null, font = null, italic = false } = {}) => {
  const rPr = (bold ? "<w:b/>" : "") + (italic ? "<w:i/>" : "")
    + (color ? `<w:color w:val="${color}"/>` : "") + (size ? `<w:sz w:val="${size}"/>` : "")
    + (font ? `<w:rFonts w:ascii="${font}" w:hAnsi="${font}"/>` : "");
  return `<w:r>${rPr ? `<w:rPr>${rPr}</w:rPr>` : ""}<w:t xml:space="preserve">${thoat(text)}</w:t></w:r>`;
};
const P = (runs, { style = "BodyText", align = null, spacing = null } = {}) => {
  const pPr = (style ? `<w:pStyle w:val="${STYLE_ID[style] || style}"/>` : "")
    + (align ? `<w:jc w:val="${align}"/>` : "") + (spacing || "");
  return `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ""}${runs}</w:p>`;
};

const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:eastAsia="Times New Roman"/><w:sz w:val="22"/><w:lang w:val="vi-VN"/></w:rPr></w:rPrDefault><w:pPrDefault/></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="BodyText"><w:name w:val="Normal"/><w:qFormat/></w:style>
<w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:pPr><w:spacing w:before="240" w:after="240"/><w:jc w:val="center"/></w:pPr><w:rPr><w:b/><w:sz w:val="44"/><w:color w:val="${MAU.tieuDe}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="BodyText"/><w:pPr><w:spacing w:before="240" w:after="120"/></w:pPr><w:rPr><w:b/><w:sz w:val="32"/><w:color w:val="${MAU.h1}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="BodyText"/><w:pPr><w:spacing w:before="200" w:after="100"/></w:pPr><w:rPr><w:b/><w:sz w:val="26"/><w:color w:val="${MAU.h2}"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="BodyText"/><w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr><w:rPr><w:b/><w:sz w:val="23"/><w:color w:val="${MAU.h3}"/></w:rPr></w:style>
<w:style w:type="character" w:styleId="CodeLine"><w:name w:val="Code Line"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr></w:style>
<w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="${MAU.duong}"/><w:bottom w:val="single" w:sz="4" w:color="${MAU.duong}"/><w:left w:val="single" w:sz="4" w:color="${MAU.duong}"/><w:right w:val="single" w:sz="4" w:color="${MAU.duong}"/><w:insideH w:val="single" w:sz="4" w:color="${MAU.duong}"/><w:insideV w:val="single" w:sz="4" w:color="${MAU.duong}"/></w:tblBorders><w:tblCellMar><w:top w:w="40" w:type="dxa"/><w:bottom w:w="40" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr></w:style>
</w:styles>`;

const CONTENT_TYPES = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/>
<Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>
</Types>`;

const RELS_ROOT = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/>
<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/>
</Relationships>`;

const RELS_DOC = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;

/** Tạo một tài liệu Word. `khoiTao` nhận `kh` và trả về nội dung. */
export function taoDocx(duongDan, { tieuDe, phuDe = null, khoiTao, ngay = "01/10/2026" }) {
  const thanh = [];
  const kh = {
    tieuDe: (s) => thanh.push(P(RUN(s), { style: "tieuDe" })),
    h1: (s) => thanh.push(P(RUN(s), { style: "h1" })),
    h2: (s) => thanh.push(P(RUN(s), { style: "h2" })),
    h3: (s) => thanh.push(P(RUN(s), { style: "h3" })),
    doan: (s) => thanh.push(P(RUN(s), { style: "doan", spacing: '<w:spacing w:after="120"/>' })),
    ghiChu: (s) => thanh.push(P(RUN(s, { italic: true, color: MAU.h3 }), { style: "doan", spacing: '<w:spacing w:after="120"/>' })),
    doiDong: () => thanh.push(P("", { style: "doan" })),
    trang: () => thanh.push(P(RUN(""), { style: "doan" }).replace("<w:p>", '<w:p><w:r><w:br w:type="page"/></w:r>')),
    danhSach: (ds) => { for (const x of ds) thanh.push(P(RUN("•  " + x), { style: "doan", spacing: '<w:spacing w:after="60"/>', align: "both" })); },
    /** Bảng: `tieuDeCot` là hàng đầu tiên, tiếp theo là các hàng dữ liệu. */
    bang: (tieuDeCot, hang, { rong = null } = {}) => {
      const n = tieuDeCot.length;
      const w = rong ? rong.join(",") : Array(n).fill(Math.floor(9000 / n)).join(",");
      const td = (s, { bold = false, nhan = false } = {}) =>
        `<w:tc><w:tcPr><w:tcW w:w="0" w:type="auto"/>${nhan ? '<w:shd w:val="clear" w:fill="DCE6F1"/>' : ""}<w:vAlign w:val="center"/></w:tcPr>`
        + P(RUN(s, { bold, color: nhan ? "000000" : null }), { style: "doan" }) + "</w:tc>";
      const dong = (cells, nhan) => `<w:tr>${nhan ? '<w:trPr><w:tblHeader/></w:trPr>' : ""}${cells.map((c) => td(c, { bold: nhan, nhan })).join("")}</w:tr>`;
      thanh.push(
        `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/><w:tblW w:w="5000" w:type="pct"/>`
        + `<w:tblGrid>${Array(n).fill("<w:gridCol/>").join("")}</w:tblGrid></w:tblPr>`
        + dong(tieuDeCot, true) + hang.map((r) => dong(r)).join("") + "</w:tbl>");
      thanh.push(P("", { style: "doan", spacing: '<w:spacing w:after="120"/>' }));
    },
  };
  khoiTao(kh);

  const sect = `<w:sectPr><w:pgSz w:w="${A4[0]}" w:h="${A4[1]}"/>`
    + `<w:pgMar w:top="${CANH_LE}" w:right="${CANH_LE}" w:bottom="${CANH_LE}" w:left="${CANH_LE}" w:header="${HEADER_FOOTER}" w:footer="${HEADER_FOOTER}" w:gutter="0"/></w:sectPr>`;
  const thanhTieuDe = phuDe
    ? P(RUN(phuDe, { italic: true, color: MAU.h3 }), { style: "doan", align: "center", spacing: '<w:spacing w:after="240"/>' })
    : "";
  const doc = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>`
    + thanhTieuDe + thanh.join("") + sect + "</w:body></w:document>";

  const core = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">
<dc:title>${thoat(tieuDe)}</dc:title><dc:subject>Báo cáo kiểm thử hành vi hệ thống VNTECH ERP V5.3.0</dc:subject>
<cp:keywords>VNTECH ERP; kiểm thử; E2E</cp:keywords>
<dcterms:created xsi:type="dcterms:W3CDTF">2026-10-01T00:00:00Z</dcterms:created>
<dcterms:modified xsi:type="dcterms:W3CDTF">2026-10-01T00:00:00Z</dcterms:modified>
</cp:coreProperties>`;
  const app = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>VNTECH E2E Report Builder</Application><Company>VNTECH</Company></Properties>`;

  const buf = zip([
    ["[Content_Types].xml", CONTENT_TYPES],
    ["_rels/.rels", RELS_ROOT],
    ["word/document.xml", doc],
    ["word/styles.xml", STYLES_XML],
    ["word/_rels/document.xml.rels", RELS_DOC],
    ["docProps/core.xml", core],
    ["docProps/app.xml", app],
  ]);
  writeFileSync(duongDan, buf);
  return { duongDan, byte: buf.length };
}