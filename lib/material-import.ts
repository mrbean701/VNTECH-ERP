import { strFromU8, unzipSync } from "fflate";

export type ImportMaterial = {
  id: string;
  code: string;
  name: string;
  unit: string;
  system?: string;
  standardPrice?: number;
  aliasText?: string;
  aliases?: Array<{ aliasName?: string }>;
};

export type ImportLine = {
  materialId?: string;
  materialCode: string;
  materialName: string;
  unit: string;
  system?: string;
  boqCode?: string;
  workPackageCode?: string;
  installationArea?: string;
  quantity: number;
  unitPrice: number;
  contractLineNo?: number;
  origin?: string;
  approvedSupplier?: string;
  note?: string;
  customFields?: Record<string, unknown>;
  importedNew?: boolean;
};

function normalized(value: unknown) {
  // NFD removes Vietnamese tone marks, but đ/Đ is a separate letter and does not decompose.
  // Convert it explicitly so headers such as “ĐVT”, “Đơn giá dự kiến” match aliases.
  return String(value ?? "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parseCsv(text: string) {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  const delimiter = [",", ";", "\t"].sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') { cell += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell); cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && source[index + 1] === "\n") index += 1;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += char;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

function parseXlsx(bytes: Uint8Array) {
  const archive = unzipSync(bytes);
  const decoder = (path: string) => archive[path] ? strFromU8(archive[path]) : "";
  const workbookText = decoder("xl/workbook.xml");
  const relationshipText = decoder("xl/_rels/workbook.xml.rels");
  const workbook = new DOMParser().parseFromString(workbookText, "application/xml");
  const relationships = new DOMParser().parseFromString(relationshipText, "application/xml");
  const elements = (root: Document | Element, localName: string) => Array.from(root.getElementsByTagNameNS("*", localName));
  const firstSheet = elements(workbook, "sheet")[0];
  if (!firstSheet) throw new Error("File Excel không có trang dữ liệu.");
  const relationshipId = firstSheet?.getAttribute("r:id") || firstSheet?.getAttributeNS("http://schemas.openxmlformats.org/officeDocument/2006/relationships", "id");
  const relationship = elements(relationships, "Relationship").find((item) => item.getAttribute("Id") === relationshipId);
  const target = relationship?.getAttribute("Target")?.replace(/^\/+/, "").replace(/^\.\.\//, "") || "worksheets/sheet1.xml";
  const sheetPath = target.startsWith("xl/") ? target : `xl/${target}`;
  const sheet = new DOMParser().parseFromString(decoder(sheetPath), "application/xml");
  const sharedDocument = new DOMParser().parseFromString(decoder("xl/sharedStrings.xml"), "application/xml");
  const shared = elements(sharedDocument, "si").map((item) => elements(item, "t").map((text) => text.textContent ?? "").join(""));
  const sheetData = elements(sheet, "sheetData")[0];
  if (!sheetData) throw new Error("Không đọc được vùng dữ liệu trong file Excel.");
  const rows: string[][] = [];
  elements(sheetData, "row").forEach((row) => {
    const values: string[] = [];
    elements(row, "c").forEach((cell) => {
      const reference = cell.getAttribute("r") || "A1";
      const letters = reference.match(/[A-Z]+/i)?.[0]?.toUpperCase() || "A";
      let index = 0;
      for (const letter of letters) index = index * 26 + letter.charCodeAt(0) - 64;
      const type = cell.getAttribute("t");
      const raw = elements(cell, "v")[0]?.textContent ?? "";
      const value = type === "s" ? shared[Number(raw)] ?? "" : type === "inlineStr" ? elements(cell, "t").map((item) => item.textContent ?? "").join("") : raw;
      values[index - 1] = value;
    });
    // Preserve the real Excel row number. Sheet XML can omit empty rows (for example row 3),
    // otherwise validation errors are reported one row too early.
    const rowNumber = Number(row.getAttribute("r"));
    const targetIndex = Number.isFinite(rowNumber) && rowNumber > 0 ? rowNumber - 1 : rows.length;
    rows[targetIndex] = values;
  });
  return Array.from({ length: rows.length }, (_, index) => rows[index] ?? []);
}

export type RequestImportConfig = import("./form-fields").FormFieldConfig;
type ImportFieldConfig = { fieldKey:string; displayName:string; importable?:boolean|number; required?:boolean|number; sourceKind?:string; sortOrder?:number; formKey?:string; active?:boolean|number; };

const requestAliases: Record<string, string[]> = {
  contractLineNo: ["so thu tu theo hop dong", "stt theo hop dong", "stt hop dong", "contract line", "contract line no"],
  materialName: ["ten hang", "ten vat tu", "ten vt", "material name", "name"],
  unit: ["dvt", "don vi tinh", "don vi", "unit"],
  materialCode: ["ma san pham", "ma vat tu", "ma vt", "material code", "code"],
  manufacturer: ["nha san xuat", "hang", "brand", "manufacturer"],
  origin: ["xuat xu", "origin"],
  approvedSupplier: ["nha cung cap duoc duyet", "nha cung cap", "approved supplier", "supplier"],
  quantity: ["khoi luong de nghi mua dot nay", "so luong de nghi mua dot nay", "khoi luong de nghi", "so luong", "sl", "quantity", "qty"],
  installationArea: ["khu vuc thi cong", "khu vuc lap dat", "khu vuc", "vi tri", "hang muc"],
  note: ["ghi chu", "note", "ly do"],
  system: ["he thong", "bo mon", "system"],
  boqCode: ["ma boq", "boq", "ma du toan", "du toan", "ma boq du toan", "boq du toan"],
  workPackageCode: ["ma dau viec", "dau viec", "work package", "wbs"],
  unitPrice: ["don gia du kien", "don gia", "unit price", "price"],
};

function configBool(value: unknown, fallback: boolean) { return value === undefined || value === null ? fallback : value === true || Number(value) === 1; }
function requestFieldConfigs(configs?: RequestImportConfig[]) {
  const defaults: ImportFieldConfig[] = [
    { fieldKey:"contractLineNo", displayName:"Số thứ tự theo Hợp đồng", importable:true, required:false, sourceKind:"core" },
    { fieldKey:"materialName", displayName:"Tên hàng", importable:true, required:true, sourceKind:"core" },
    { fieldKey:"unit", displayName:"Đơn vị", importable:true, required:false, sourceKind:"core" },
    { fieldKey:"materialCode", displayName:"Mã sản phẩm", importable:true, required:false, sourceKind:"core" },
    { fieldKey:"manufacturer", displayName:"Nhà sản xuất", importable:false, required:false, sourceKind:"system" },
    { fieldKey:"origin", displayName:"Xuất xứ", importable:true, required:false, sourceKind:"core" },
    { fieldKey:"approvedSupplier", displayName:"Nhà cung cấp được duyệt", importable:true, required:false, sourceKind:"core" },
    { fieldKey:"quantity", displayName:"Khối lượng đề nghị mua đợt này", importable:true, required:true, sourceKind:"core" },
    { fieldKey:"installationArea", displayName:"Khu vực thi công", importable:true, required:false, sourceKind:"core" },
    { fieldKey:"note", displayName:"Ghi chú", importable:true, required:false, sourceKind:"core" },
  ];
  const supplied: ImportFieldConfig[]=(configs||[]).filter((c)=>c.formKey==="request_line" && (c.active===undefined || configBool(c.active,true))).map((c)=>({ ...c, fieldKey:String(c.fieldKey), displayName:String(c.displayName), sortOrder:Number(c.sortOrder||0) }));
  const byKey=new Map(defaults.map((d)=>[d.fieldKey,{...d}]));
  supplied.forEach((c)=>byKey.set(String(c.fieldKey),{...(byKey.get(String(c.fieldKey))||{}),...c}));
  return [...byKey.values()].filter((c)=>configBool(c.importable,true)).sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0));
}
function fieldAliases(field: { fieldKey?: string; displayName?: string }) {
  return [...new Set([normalized(field.displayName||""), ...(requestAliases[String(field.fieldKey)]||[])].filter(Boolean))];
}
function parseNumber(value: unknown) { const raw=String(value??"").trim().replace(/\s/g,"").replace(",", "."); if(!raw) return null; const v=Number(raw); return Number.isFinite(v)?v:null; }

export function mapMaterialRows(rows: string[][], materials: ImportMaterial[], configs?: RequestImportConfig[]) {
  const fields=requestFieldConfigs(configs);
  const headerIndex=rows.findIndex((row)=>{
    const normalizedRow=row.map(normalized);
    return fields.some((field)=>fieldAliases(field).some((alias)=>normalizedRow.includes(alias)));
  });
  if(headerIndex<0) throw new Error("Không tìm thấy dòng tiêu đề. Hãy dùng file mẫu Excel/CSV tải trực tiếp từ phần mềm.");
  const headers=rows[headerIndex].map(normalized);
  const indexes:Record<string,number>={};
  fields.forEach((field)=>{ indexes[String(field.fieldKey)]=headers.findIndex((header)=>fieldAliases(field).includes(header)); });
  // Backward-compatible optional columns from older templates.
  for(const key of ["system","boqCode","workPackageCode","unitPrice"]){ if(indexes[key]===undefined) indexes[key]=headers.findIndex((header)=>(requestAliases[key]||[]).includes(header)); }
  const missingRequired=fields.filter((field)=>configBool(field.required,false)&&indexes[String(field.fieldKey)]<0);
  if(missingRequired.length) throw new Error(`File thiếu cột đang được Quản trị viên cấu hình bắt buộc: ${missingRequired.map((f)=>f.displayName).join(", ")}.`);
  const byCode=new Map(materials.map((m)=>[m.code.trim().toUpperCase(),m]));
  const byNameUnit=new Map<string,ImportMaterial>();
  for (const material of materials) {
    const names = [
      material.name,
      ...(material.aliases || []).map((alias) => alias.aliasName || ""),
      ...String(material.aliasText || "").split(/[;\n]+/),
    ];
    for (const name of names) {
      const key = `${normalized(name)}|${normalized(material.unit)}`;
      if (normalized(name) && !byNameUnit.has(key)) byNameUnit.set(key, material);
    }
  }
  const imported:ImportLine[]=[]; const errors:string[]=[];
  rows.slice(headerIndex+1).forEach((row,offset)=>{
    const excelLine=headerIndex+offset+2;
    const get=(key:string)=>indexes[key]>=0?String(row[indexes[key]]??"").trim():"";
    const raw:Record<string,string>={}; fields.forEach((field)=>raw[String(field.fieldKey)]=get(String(field.fieldKey)));
    const customFields:Record<string,unknown>={};
    fields.filter((field)=>String(field.sourceKind)==="custom").forEach((field)=>{ if(raw[String(field.fieldKey)]!=="") customFields[String(field.fieldKey)]=raw[String(field.fieldKey)]; });
    const hasData=Object.values(raw).some(Boolean)||["boqCode","workPackageCode"].some((k)=>get(k)!==""); if(!hasData)return;
    const materialCode=get("materialCode").toUpperCase(); const materialName=get("materialName"); const unit=get("unit");
    const existing=(materialCode?byCode.get(materialCode):undefined)||byNameUnit.get(`${normalized(materialName)}|${normalized(unit)}`);
    for(const field of fields.filter((f)=>configBool(f.required,false))){
      const key=String(field.fieldKey);
      if(key==="quantity"){
        const q=parseNumber(get(key));
        if(q===null||q<=0) errors.push(`Dòng ${excelLine}: ${field.displayName} phải lớn hơn 0.`);
      } else if(!get(key) && !(existing && ["materialCode","materialName","unit"].includes(key))) {
        errors.push(`Dòng ${excelLine}: thiếu ${field.displayName}.`);
      }
    }
    const quantity=parseNumber(get("quantity"))??0;
    imported.push({
      materialId:existing?.id, materialCode:materialCode||existing?.code||"", materialName:materialName||existing?.name||"", unit:unit||existing?.unit||"", system:get("system")||existing?.system||"Chưa phân loại",
      boqCode:get("boqCode"), workPackageCode:get("workPackageCode"), installationArea:get("installationArea"), quantity, unitPrice:parseNumber(get("unitPrice"))??existing?.standardPrice??0, importedNew:!existing,
      contractLineNo: parseNumber(get("contractLineNo")) ?? undefined, origin:get("origin"), approvedSupplier:get("approvedSupplier"), note:get("note"), customFields,
    } as ImportLine & Record<string, unknown>);
  });
  if(!imported.length) throw new Error("File không có dòng vật tư để nhập.");
  if(imported.length>100) errors.push(`File có ${imported.length} dòng; mỗi phiếu chỉ nhận tối đa 100 dòng.`);
  if(errors.length) throw new Error(errors.slice(0,12).join("\n"));
  return imported;
}

export async function parseSpreadsheetRows(file: File) {
  const extension=file.name.split(".").pop()?.toLowerCase();
  if(!extension||!["xlsx","csv"].includes(extension)) throw new Error("Chỉ nhận file Excel .xlsx hoặc .csv.");
  return extension==="csv"?parseCsv(await file.text()):parseXlsx(new Uint8Array(await file.arrayBuffer()));
}

export async function parseMaterialFile(file: File, materials: ImportMaterial[], configs?: RequestImportConfig[]) {
  return mapMaterialRows(await parseSpreadsheetRows(file),materials,configs);
}

export function downloadMaterialTemplate(_configs?: RequestImportConfig[]) {
  void import("./tabular-export").then(({ downloadPublicTemplate }) => {
    downloadPublicTemplate("/templates/Mau_Phieu_De_Nghi_Cap_Vat_Tu_VNTECH.xlsx", "Mau_Phieu_De_Nghi_Cap_Vat_Tu_VNTECH.xlsx");
  });
}
export function downloadMaterialTemplateCsv(_configs?: RequestImportConfig[]) {
  void import("./tabular-export").then(({ downloadPublicTemplate }) => {
    downloadPublicTemplate("/templates/Mau_Phieu_De_Nghi_Cap_Vat_Tu_VNTECH.csv", "Mau_Phieu_De_Nghi_Cap_Vat_Tu_VNTECH.csv");
  });
}
