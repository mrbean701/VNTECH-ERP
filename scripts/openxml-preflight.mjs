import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sources = ["lib/request-export.ts", "lib/tabular-export.ts", "lib/material-catalog-export.ts"];
for (const rel of sources) {
  const p = join(root, rel);
  if (!existsSync(p)) throw new Error(`missing source: ${rel}`);
  const s = readFileSync(p, "utf8");
  if (/mergeCells[\s\S]{0,500}autoFilter/.test(s)) {
    throw new Error(`OpenXML order invalid in ${rel}: mergeCells appears before autoFilter.`);
  }
  if (s.includes("<autoFilter") && !s.includes("<mergeCells")) {
    // Allowed for generic sheets without merged cells.
  }
}
const tabular = readFileSync(join(root, "lib/tabular-export.ts"), "utf8");
for (const marker of ['cache: "no-store"', 'vntech_hf09=${Date.now()}', 'downloadBlob(blob, fileName)']) {
  if (!tabular.includes(marker)) throw new Error(`cache-busting marker missing: ${marker}`);
}
const templates = [
  "public/templates/Mau_Phieu_De_Nghi_Cap_Vat_Tu_VNTECH.xlsx",
  "public/templates/Mau_BOQ_Hop_Dong_VNTECH.xlsx",
  "public/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.xlsx",
  "public/templates/Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.xlsx",
  "public/Mau_nhap_phieu_de_nghi_mua_hang.xlsx",
];
for (const rel of templates) {
  const p = join(root, rel); if (!existsSync(p)) throw new Error(`missing template: ${rel}`);
  const b = readFileSync(p); if (b.length < 10000 || b[0] !== 0x50 || b[1] !== 0x4b) throw new Error(`invalid XLSX package: ${rel}`);
}
console.log("OpenXML preflight: DAT · Excel 2016 order + cache-busting + 5 XLSX packages.");
