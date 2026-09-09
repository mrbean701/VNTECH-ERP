import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const xlsxFiles = [
  ["public/templates/Mau_Phieu_De_Nghi_Cap_Vat_Tu_VNTECH.xlsx", "ĐỀ NGHỊ"],
  ["public/templates/Mau_BOQ_Hop_Dong_VNTECH_V5.xlsx", "BOQ"],
  ["public/templates/Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5.xlsx", "GIÁ TRỊ"],
  ["public/templates/Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.xlsx", "GIÁ TRỊ"],
  ["public/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.xlsx", "DANH MỤC"],
];
const csvFiles = [
  ["public/templates/Mau_Phieu_De_Nghi_Cap_Vat_Tu_VNTECH.csv", "Khối lượng đề nghị mua đợt này"],
  ["public/templates/Mau_BOQ_Hop_Dong_VNTECH_V5.csv", "Loại dòng"],
  ["public/templates/Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv", "Mã dòng BOQ"],
  ["public/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv", "Mã vật tư"],
];
const names = [...xlsxFiles, ...csvFiles].map(([rel]) => rel.split("/").pop());
if (new Set(names).size !== names.length) throw new Error("template filenames are not unique.");
for (const [rel] of xlsxFiles) {
  const path = join(root, rel);
  if (!existsSync(path)) throw new Error(`missing XLSX template: ${rel}`);
  const bytes = readFileSync(path);
  if (bytes.length < 2500 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw new Error(`invalid XLSX template: ${rel}`);
}
for (const [rel, marker] of csvFiles) {
  const path = join(root, rel);
  if (!existsSync(path)) throw new Error(`missing CSV template: ${rel}`);
  const text = readFileSync(path, "utf8");
  if (!text.includes("sep=;") || !text.includes(marker)) throw new Error(`invalid CSV template: ${rel}`);
}
const page = readFileSync(join(root, "app/page.tsx"), "utf8");
for (const marker of ["Mẫu Excel Phiếu đề nghị", "Mẫu Excel BOQ/HĐ", "Mẫu Excel Danh mục"]) {
  if (!page.includes(marker)) throw new Error(`UI marker missing: ${marker}`);
}
console.log("template preflight: DAT · 5 XLSX + 4 CSV · unique filenames · non-empty content.");
