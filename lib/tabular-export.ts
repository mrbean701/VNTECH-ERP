// VNTECH PROPRIETARY SOURCE | Stable browser downloads for Excel/CSV templates.
// VNTECH FINAL: Excel 2016 requires worksheet child elements in OpenXML schema order (autoFilter before mergeCells).
import { strToU8, zipSync } from "fflate";

export type FormulaCell = { formula:string; value?:number };
export type TableCell = string | number | FormulaCell | null | undefined;
export type SimpleXlsxListValidation = {
  columnIndex: number;
  values: string[];
  startRow?: number;
  endRow?: number;
  promptTitle?: string;
  prompt?: string;
};
export type SimpleXlsxOptions = {
  sheetName?: string;
  title?: string;
  subtitle?: string;
  headers: string[];
  notes?: string[];
  rows?: TableCell[][];
  widths?: number[];
  freezeRows?: number;
  listValidations?: SimpleXlsxListValidation[];
};

function xml(value: unknown) { return String(value ?? "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;"); }
function colName(index: number) { let result=""; let value=index; while(value>0){value-=1;result=String.fromCharCode(65+(value%26))+result;value=Math.floor(value/26);} return result; }
function safeSheetName(value: string) { return value.replace(/[\\/*?:\[\]]/g,"-").slice(0,31)||"Du lieu"; }
export function safeDownloadName(value: string) { return value.replace(/[\\/:*?"<>|]+/g,"-").replace(/\s+/g,"_").slice(0,100)||"VNTECH"; }
export function blobBytes(bytes: Uint8Array): ArrayBuffer { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer; }
export function downloadBlob(blob: Blob, fileName: string) { const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=fileName; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),1200); }

export function downloadPublicTemplate(publicPath: string, fileName: string) {
  const separator = publicPath.includes("?") ? "&" : "?";
  const url = `${publicPath}${separator}vntech_hf09=${Date.now()}`;
  void fetch(url, { cache: "no-store" })
    .then((response) => { if (!response.ok) throw new Error(`HTTP ${response.status}`); return response.blob(); })
    .then((blob) => downloadBlob(blob, fileName))
    .catch(() => {
      const a = document.createElement("a");
      a.href = url; a.download = fileName; a.rel = "noopener";
      document.body.appendChild(a); a.click(); a.remove();
    });
}

export function buildSimpleXlsxBytes(options: SimpleXlsxOptions) {
  const headers=options.headers;
  const title=options.title||""; const subtitle=options.subtitle||""; const notes=options.notes||[]; const data=options.rows||[];
  const startHeader=(title?1:0)+(subtitle?1:0)+1;
  const allRows: {cells:TableCell[]; style:number}[]=[];
  if(title) allRows.push({cells:[title],style:1});
  if(subtitle) allRows.push({cells:[subtitle],style:5});
  allRows.push({cells:headers,style:2});
  if(notes.length) allRows.push({cells:headers.map((_,i)=>notes[i]||""),style:4});
  data.forEach((row)=>allRows.push({cells:row,style:3}));
  const rowXml=allRows.map((entry,rIdx)=>{
    const r=rIdx+1;
    const cells=entry.cells.map((value,cIdx)=>{
      const ref=`${colName(cIdx+1)}${r}`; const style=` s="${entry.style}"`;
      if(value&&typeof value==="object"&&"formula" in value)return `<c r="${ref}"${style}><f>${xml(value.formula)}</f><v>${Number(value.value||0)}</v></c>`;
      if(typeof value==="number" && Number.isFinite(value)) return `<c r="${ref}"${style}><v>${value}</v></c>`;
      return `<c r="${ref}" t="inlineStr"${style}><is><t xml:space="preserve">${xml(value)}</t></is></c>`;
    }).join("");
    const height=entry.style===1?' ht="28" customHeight="1"':entry.style===2?' ht="42" customHeight="1"':entry.style===4?' ht="58" customHeight="1"':'';
    return `<row r="${r}"${height}>${cells}</row>`;
  }).join("");
  const colXml=headers.map((_,i)=>`<col min="${i+1}" max="${i+1}" width="${options.widths?.[i]||18}" customWidth="1"/>`).join("");
  const endRow=Math.max(1,allRows.length); const endCol=colName(headers.length);
  const merges:string[]=[]; if(title) merges.push(`A1:${endCol}1`); if(subtitle) merges.push(`A${title?2:1}:${endCol}${title?2:1}`);
  const validationXml=(options.listValidations||[]).map((rule)=>{
    const col=colName(Math.max(1,Math.min(headers.length,Math.trunc(rule.columnIndex)+1)));
    const start=Math.max(1,Math.trunc(rule.startRow||endRow+1));
    const finish=Math.max(start,Math.trunc(rule.endRow||5000));
    const values=(rule.values||[]).map((value)=>String(value).trim()).filter(Boolean);
    if(!values.length||values.some((value)=>value.includes(',')))return '';
    const literal=values.join(',').replace(/"/g,'""');
    if(literal.length>250)return '';
    const promptTitle=rule.promptTitle?` promptTitle="${xml(rule.promptTitle)}"`:'';
    const prompt=rule.prompt?` prompt="${xml(rule.prompt)}"`:'';
    return `<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorStyle="stop" errorTitle="Giá trị không hợp lệ" error="Hãy chọn một giá trị trong danh sách." showInputMessage="1"${promptTitle}${prompt} sqref="${col}${start}:${col}${finish}"><formula1>&quot;${xml(literal)}&quot;</formula1></dataValidation>`;
  }).filter(Boolean);
  const frozen=options.freezeRows ?? startHeader;
  const sheetXml=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${endCol}${Math.max(endRow,...(options.listValidations||[]).map(rule=>rule.endRow||0))}"/><sheetViews><sheetView workbookViewId="0">${frozen?`<pane ySplit="${frozen}" topLeftCell="A${frozen+1}" activePane="bottomLeft" state="frozen"/>`:""}</sheetView></sheetViews><cols>${colXml}</cols><sheetData>${rowXml}</sheetData><autoFilter ref="A${startHeader}:${endCol}${endRow}"/>${merges.length?`<mergeCells count="${merges.length}">${merges.map(ref=>`<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`:""}${validationXml.length?`<dataValidations count="${validationXml.length}">${validationXml.join("")}</dataValidations>`:""}<pageMargins left="0.25" right="0.25" top="0.4" bottom="0.4" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="4"><font><sz val="10"/><name val="Aptos"/></font><font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Aptos Display"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font><font><i/><sz val="9"/><color rgb="FF334155"/><name val="Aptos"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF13598B"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF6FC"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFCFEAF7"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF7DB9DB"/></left><right style="thin"><color rgb="FF7DB9DB"/></right><top style="thin"><color rgb="FF7DB9DB"/></top><bottom style="thin"><color rgb="FF7DB9DB"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const sheetName=safeSheetName(options.sheetName||"Du lieu");
  const archive:Record<string,Uint8Array>={
    "[Content_Types].xml":strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    "_rels/.rels":strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml":strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets><sheet name="${xml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels":strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/styles.xml":strToU8(styles),"xl/worksheets/sheet1.xml":strToU8(sheetXml),
  };
  return zipSync(archive,{level:6});
}

export function downloadSimpleXlsx(options: SimpleXlsxOptions, fileName: string) { const bytes=buildSimpleXlsxBytes(options); downloadBlob(new Blob([blobBytes(bytes)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),`${safeDownloadName(fileName)}.xlsx`); }
export function csvText(headers:string[], rows:TableCell[][], delimiter=";") { const esc=(value:TableCell)=>`"${String(value??"").replaceAll('"','""')}"`; return `sep=${delimiter}\r\n${[headers,...rows].map(row=>row.map(esc).join(delimiter)).join("\r\n")}`; }
export function downloadCsv(headers:string[], rows:TableCell[][], fileName:string, delimiter=";") { downloadBlob(new Blob(["\ufeff",csvText(headers,rows,delimiter)],{type:"text/csv;charset=utf-8"}),`${safeDownloadName(fileName)}.csv`); }
