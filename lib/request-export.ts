// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT
// VNTECH FINAL: Excel 2016 requires worksheet child elements in OpenXML schema order (autoFilter before mergeCells).
import { strToU8, zipSync } from "fflate";
import { VNTECH_BRAND } from "@/lib/vntech-brand";
import { mergedFormFields, type FormFieldConfig } from "@/lib/form-fields";

export type RequestExportLine = {
  lineNo?: number; contractLineNo?: number; materialCode?: string; materialName?: string; unit?: string;
  manufacturer?: string; origin?: string; approvedSupplier?: string; contractQty?: number; stockQty?: number;
  orderedCumulativeQty?: number; requestedQty?: number; cumulativeAfterRequest?: number; installationArea?: string; note?: string;
  system?: string; boqCode?: string; workPackageCode?: string; unitPrice?: number; approvedPurchaseQty?: number|null; orderedQty?: number|null; receivedQty?: number|null;
  customFields?: Record<string,unknown>;
};
export type RequestExportDocument = {
  requestNo: string; projectCode?: string; projectName?: string; requestedBy?: string; requestedAt?: string; neededAt?: string; priority?: string;
  area?: string; purpose?: string; status?: string; lines: RequestExportLine[]; fieldConfigs?: FormFieldConfig[];
};

type XlsxCell={value:string|number;style?:number;type?:"s"|"n"};
function text(value: unknown) { return String(value ?? "").trim(); }
function number(value: unknown) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; }
function safeFileName(value: string) { return value.replace(/[\\/:*?"<>|]+/g, "-").replace(/\s+/g, "_").slice(0, 90) || "De_nghi_cap_vat_tu"; }
function blobBytes(bytes: Uint8Array): ArrayBuffer { return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer; }
function xml(value: unknown) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;"); }
function priorityLabel(value?: string) { return value === "urgent" ? "Khẩn" : value === "high" ? "Cao" : value === "normal" ? "Bình thường" : text(value) || "Bình thường"; }
function viDate(value?: string) { if (!value) return ""; const date = new Date(value); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: value.includes("T") ? "2-digit" : undefined, minute: value.includes("T") ? "2-digit" : undefined }).format(date); }
function money(value: number) { return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value); }
function qty(value: number) { return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 3 }).format(value); }
function downloadBlob(blob: Blob, fileName: string) { const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200); }
function colName(index: number) { let result="";let value=index;while(value>0){value-=1;result=String.fromCharCode(65+(value%26))+result;value=Math.floor(value/26);}return result; }
function cellXml(row:number,col:number,cell:XlsxCell){const ref=`${colName(col)}${row}`;const s=cell.style?` s="${cell.style}"`:"";const type=cell.type??(typeof cell.value==="number"?"n":"s");if(type==="n"&&typeof cell.value==="number")return `<c r="${ref}"${s}><v>${Number.isFinite(cell.value)?cell.value:0}</v></c>`;return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${xml(cell.value)}</t></is></c>`;}

function requestFields(configs?:FormFieldConfig[]){const all=mergedFormFields(configs,"request_line");const selected=all.filter(f=>Boolean(f.visible)&&Boolean(f.exportable));return selected.length?selected:all.filter(f=>["lineNo","materialName","quantity"].includes(String(f.fieldKey))).slice(0,3);}
function requestLineValue(line:RequestExportLine,key:string,index:number):string|number{
  const custom=line.customFields||{};
  switch(key){case"lineNo":return line.lineNo??index+1;case"contractLineNo":return line.contractLineNo??"";case"materialName":return text(line.materialName);case"unit":return text(line.unit);case"materialCode":return text(line.materialCode);case"manufacturer":return text(line.manufacturer);case"origin":return text(line.origin);case"approvedSupplier":return text(line.approvedSupplier);case"contractQty":return number(line.contractQty);case"stockQty":return number(line.stockQty);case"orderedCumulativeQty":return number(line.orderedCumulativeQty??line.orderedQty);case"requestedQty":case"quantity":return number(line.requestedQty);case"cumulativeAfterRequest":return number(line.cumulativeAfterRequest??(number(line.orderedCumulativeQty??line.orderedQty)+number(line.requestedQty)));case"installationArea":return text(line.installationArea);case"note":return text(line.note);default:return (custom[key] as string|number)??"";}
}

export function buildRequestXlsxBytes(doc:RequestExportDocument){
  const fs=requestFields(doc.fieldConfigs); const cols=Math.max(1,fs.length); const end=colName(cols); const rows:string[]=[]; const add=(r:number,cells:XlsxCell[],height?:number)=>rows.push(`<row r="${r}"${height?` ht="${height}" customHeight="1"`:""}>${cells.map((cell,i)=>cellXml(r,i+1,cell)).join("")}</row>`);
  add(1,[{value:"VNTECH\nTECHNOLOGY FOR LIFE",style:1},{value:"",style:1},{value:"",style:1},{value:"ĐỀ NGHỊ CẤP VẬT TƯ",style:2}],34);
  add(2,[{value:"",style:1},{value:"",style:1},{value:"",style:1},{value:`Kính gửi: GIÁM ĐỐC CÔNG TY, CÁC PHÒNG/BAN CÔNG TY`,style:6}],24);
  add(3,[{value:`Công tác tại / Dự án: ${doc.projectCode||""} ${doc.projectName||""}`,style:6}],22);
  add(4,[{value:`Phạm vi / Khu vực: ${doc.area||""}`,style:6}],22);
  add(5,[{value:`Ngày cần vật tư tại công trường: ${viDate(doc.neededAt)}`,style:6}],22);
  add(6,[{value:`Số phiếu: ${doc.requestNo} · Ngày lập: ${viDate(doc.requestedAt)} · Người lập: ${doc.requestedBy||""} · ${priorityLabel(doc.priority)}`,style:6}],22);
  add(7,fs.map(f=>({value:String(f.displayName),style:3})),52);
  doc.lines.forEach((line,i)=>add(8+i,fs.map(f=>{const value=requestLineValue(line,String(f.fieldKey),i);return{value,style:String(f.sourceKind)==="system"?5:4,type:typeof value==="number"?"n":"s"};}),24));
  const last=Math.max(7+doc.lines.length,8); const mergeEnd=end; const merges=cols>=4?[`A1:C1`,`D1:${mergeEnd}1`,`A2:${mergeEnd}2`,`A3:${mergeEnd}3`,`A4:${mergeEnd}4`,`A5:${mergeEnd}5`,`A6:${mergeEnd}6`]:[`A1:${mergeEnd}1`,`A2:${mergeEnd}2`,`A3:${mergeEnd}3`,`A4:${mergeEnd}4`,`A5:${mergeEnd}5`,`A6:${mergeEnd}6`];
  const widths=fs.map(f=>{const k=String(f.fieldKey);if(k==="materialName")return 34;if(k==="note")return 28;if(["manufacturer","approvedSupplier","installationArea"].includes(k))return 20;return 14;}).map((w,i)=>`<col min="${i+1}" max="${i+1}" width="${w}" customWidth="1"/>`).join("");
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${end}${last}"/><sheetViews><sheetView workbookViewId="0"><pane ySplit="7" topLeftCell="A8" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${widths}</cols><sheetData>${rows.join("")}</sheetData><autoFilter ref="A7:${end}${last}"/><mergeCells count="${merges.length}">${merges.map(r=>`<mergeCell ref="${r}"/>`).join("")}</mergeCells><pageMargins left="0.2" right="0.2" top="0.3" bottom="0.3" header="0.2" footer="0.2"/><pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/></worksheet>`;
  const styles=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="5"><font><sz val="10"/><name val="Times New Roman"/></font><font><b/><sz val="16"/><color rgb="FF144DA0"/><name val="Arial"/></font><font><b/><sz val="16"/><name val="Times New Roman"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Times New Roman"/></font><font><i/><sz val="10"/><name val="Times New Roman"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF13598B"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF7FBFE"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8EEF5"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FF202020"/></left><right style="thin"><color rgb="FF202020"/></right><top style="thin"><color rgb="FF202020"/></top><bottom style="thin"><color rgb="FF202020"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="7"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="4" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`;
  const archive:Record<string,Uint8Array>={"[Content_Types].xml":strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),"_rels/.rels":strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),"xl/workbook.xml":strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="De nghi cap vat tu" sheetId="1" r:id="rId1"/></sheets></workbook>`),"xl/_rels/workbook.xml.rels":strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),"xl/styles.xml":strToU8(styles),"xl/worksheets/sheet1.xml":strToU8(sheet)};
  return zipSync(archive,{level:6});
}
export function downloadRequestXlsx(doc:RequestExportDocument){downloadBlob(new Blob([blobBytes(buildRequestXlsxBytes(doc))],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),`${safeFileName(`Phieu_De_Nghi_Cap_Vat_Tu_${doc.requestNo||doc.projectCode||"Nhap"}`)}.xlsx`);}

function wrapText(ctx:CanvasRenderingContext2D,value:string,maxWidth:number,maxLines=2){const words=value.split(/\s+/);const lines:string[]=[];let current="";for(const word of words){const test=current?`${current} ${word}`:word;if(ctx.measureText(test).width>maxWidth&&current){lines.push(current);current=word;}else current=test;}if(current)lines.push(current);return lines.slice(0,maxLines);}
function drawCell(ctx:CanvasRenderingContext2D,x:number,y:number,width:number,height:number,value:string,options:{bold?:boolean;align?:"left"|"center"|"right";fontSize?:number;fill?:string;color?:string;maxLines?:number}={}){ctx.fillStyle=options.fill||"#fff";ctx.fillRect(x,y,width,height);ctx.strokeStyle="#334155";ctx.strokeRect(x,y,width,height);ctx.fillStyle=options.color||"#172b3a";ctx.font=`${options.bold?"700":"400"} ${options.fontSize||11}px Arial`;ctx.textAlign=options.align||"left";ctx.textBaseline="top";const pad=4;const tx=options.align==="center"?x+width/2:options.align==="right"?x+width-pad:x+pad;wrapText(ctx,value,width-pad*2,options.maxLines||3).forEach((line,i)=>ctx.fillText(line,tx,y+pad+i*(options.fontSize||11)*1.2));}
function requestPdfCanvases(doc:RequestExportDocument){const fs=requestFields(doc.fieldConfigs);const W=1684,H=1190,margin=28,tableY=225,headH=72,rowH=50,per=Math.max(8,Math.floor((H-tableY-headH-60)/rowH));const pages=Math.max(1,Math.ceil(doc.lines.length/per));const weights=fs.map(f=>String(f.fieldKey)==="materialName"?2.6:String(f.fieldKey)==="note"?1.7:1);const sum=weights.reduce((a,b)=>a+b,0);const widths=weights.map(w=>(W-margin*2)*w/sum);const out:HTMLCanvasElement[]=[];for(let p=0;p<pages;p++){const c=document.createElement("canvas");c.width=W;c.height=H;const x=c.getContext("2d");if(!x)continue;x.fillStyle="#fff";x.fillRect(0,0,W,H);x.fillStyle="#144DA0";x.font="700 31px Arial";x.textAlign="left";x.fillText("VNTECH",margin,35);x.font="700 11px Arial";x.fillText("TECHNOLOGY FOR LIFE",margin,68);x.fillStyle="#111827";x.textAlign="center";x.font="700 30px Times New Roman";x.fillText("ĐỀ NGHỊ CẤP VẬT TƯ",W/2,42);x.font="700 15px Times New Roman";x.fillText("Kính gửi: GIÁM ĐỐC CÔNG TY, CÁC PHÒNG/BAN CÔNG TY",W/2,82);x.textAlign="left";x.font="italic 15px Times New Roman";x.fillText(`Công tác tại / Dự án: ${doc.projectCode||""} ${doc.projectName||""}`,margin,118);x.fillText(`Phạm vi / Khu vực: ${doc.area||""}`,margin,143);x.font="700 15px Times New Roman";x.fillText(`Ngày cần vật tư tại công trường: ${viDate(doc.neededAt)}`,margin,168);x.textAlign="right";x.fillText(`Ngày lập phiếu: ${viDate(doc.requestedAt)}`,W-margin,118);let xp=margin;fs.forEach((f,i)=>{drawCell(x,xp,tableY,widths[i],headH,String(f.displayName),{bold:true,align:"center",fontSize:11,fill:"#13598B",color:"#fff",maxLines:4});xp+=widths[i];});const start=p*per,end=Math.min(doc.lines.length,start+per);for(let ri=start;ri<end;ri++){xp=margin;const yy=tableY+headH+(ri-start)*rowH;fs.forEach((f,i)=>{const val=requestLineValue(doc.lines[ri],String(f.fieldKey),ri);drawCell(x,xp,yy,widths[i],rowH,typeof val==="number"?qty(val):String(val),{align:typeof val==="number"?"right":"left",fontSize:10,fill:String(f.sourceKind)==="system"?"#eef2f6":"#fff",maxLines:3});xp+=widths[i];});}x.fillStyle="#64748b";x.font="400 12px Arial";x.textAlign="left";x.fillText(`${doc.requestNo} · ${doc.status||""} · ${VNTECH_BRAND.productId}`,margin,H-25);x.textAlign="right";x.fillText(`Trang ${p+1}/${pages}`,W-margin,H-25);out.push(c);}return out;}
function dataUrlBytes(dataUrl:string){const binary=atob(dataUrl.split(",")[1]||"");const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);return bytes;}
function concatBytes(chunks:Uint8Array[]){const length=chunks.reduce((s,c)=>s+c.length,0);const result=new Uint8Array(length);let o=0;chunks.forEach(c=>{result.set(c,o);o+=c.length;});return result;}
function ascii(value:string){return new TextEncoder().encode(value);}
function pdfFromJpegs(images:{bytes:Uint8Array;width:number;height:number}[]){const parts:Uint8Array[]=[];const offsets:number[]=[0];let size=0;const push=(b:Uint8Array)=>{parts.push(b);size+=b.length;};push(ascii(`%PDF-1.4\n%KHO-VNTECH|${VNTECH_BRAND.productId}|${VNTECH_BRAND.sourceFingerprintShort}\n`));const totalObjects=2+images.length*3;const pageIds=images.map((_,i)=>3+i*3),imageIds=images.map((_,i)=>4+i*3),contentIds=images.map((_,i)=>5+i*3);function obj(id:number,body:string,bin?:Uint8Array){offsets[id]=size;push(ascii(`${id} 0 obj\n${body}`));if(bin){push(ascii("\nstream\n"));push(bin);push(ascii("\nendstream"));}push(ascii("\nendobj\n"));}obj(1,`<< /Type /Pages /Count ${images.length} /Kids [${pageIds.map(id=>`${id} 0 R`).join(" ")}] >>`);obj(2,`<< /Type /Catalog /Pages 1 0 R >>`);images.forEach((im,i)=>{const pw=842,ph=595;obj(pageIds[i],`<< /Type /Page /Parent 1 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${imageIds[i]} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`);obj(imageIds[i],`<< /Type /XObject /Subtype /Image /Width ${im.width} /Height ${im.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>`,im.bytes);const stream=`q\n${pw} 0 0 ${ph} 0 0 cm\n/Im0 Do\nQ\n`;obj(contentIds[i],`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);});const xref=size;let x=`xref\n0 ${totalObjects+1}\n0000000000 65535 f \n`;for(let i=1;i<=totalObjects;i++)x+=`${String(offsets[i]||0).padStart(10,"0")} 00000 n \n`;x+=`trailer\n<< /Size ${totalObjects+1} /Root 2 0 R >>\nstartxref\n${xref}\n%%EOF`;push(ascii(x));return concatBytes(parts);}
export function downloadRequestPdf(doc:RequestExportDocument){const imgs=requestPdfCanvases(doc).map(c=>({bytes:dataUrlBytes(c.toDataURL("image/jpeg",.93)),width:c.width,height:c.height}));downloadBlob(new Blob([blobBytes(pdfFromJpegs(imgs))],{type:"application/pdf"}),`${safeFileName(`Phieu_De_Nghi_Cap_Vat_Tu_${doc.requestNo||doc.projectCode||"Nhap"}`)}.pdf`);}

export type SupplyExportLine = {
  lineNo?: number;
  materialCode?: string;
  materialName?: string;
  unit?: string;
  requestedQty?: number;
  approvedQty?: number;
  orderedQty?: number;
  unitPrice?: number;
  actualTripQty?: number | null;
  acceptedTripQty?: number | null;
  actualCumulativeQty?: number;
  acceptedCumulativeQty?: number;
  lotNo?: string;
};

export type SupplyExportDocument = {
  kind: "po" | "delivery";
  requestNo: string;
  poNo: string;
  receiptNo?: string;
  projectCode?: string;
  projectName?: string;
  supplierName?: string;
  warehouseName?: string;
  orderedAt?: string;
  eta?: string;
  receivedAt?: string;
  deliveryNoteNo?: string;
  bchConfirmedAt?: string;
  bchConfirmedByName?: string;
  certificateStatus?: string;
  deliveryDocumentStatus?: string;
  status?: string;
  lines: SupplyExportLine[];
};

function supplyTitle(doc: SupplyExportDocument) {
  return doc.kind === "po" ? "ĐƠN ĐẶT HÀNG (PO) - ĐỐI CHIẾU CHUỖI CUNG ỨNG" : "PHIẾU GIAO HÀNG - ĐỐI CHIẾU CHUỖI CUNG ỨNG";
}
function certificateLabel(value?: string) { return value === "complete" ? "Đã có" : value === "not_required" ? "Không yêu cầu" : value === "missing" ? "Chưa có" : text(value) || "—"; }
function documentLabel(value?: string) { return value === "complete" ? "Đã có" : value === "missing" ? "Chưa có" : text(value) || "—"; }
function lineVariance(line: SupplyExportLine) { return number(line.actualCumulativeQty) - number(line.orderedQty); }
function lineRemaining(line: SupplyExportLine) { return Math.max(0, number(line.orderedQty) - number(line.acceptedCumulativeQty)); }
function lineAssessment(line: SupplyExportLine) {
  const variance = lineVariance(line); const remaining = lineRemaining(line);
  if (variance > 0) return `Thừa thực giao ${qty(variance)}`;
  if (remaining > 0) return `Thiếu ${qty(remaining)}`;
  return "Đủ theo PO";
}

function supplyXlsxRows(doc: SupplyExportDocument) {
  const rows: XlsxCell[][] = [];
  rows.push([{ value: `${VNTECH_BRAND.productName} · ${supplyTitle(doc)}`, style: 1 }]);
  rows.push([{ value: `${VNTECH_BRAND.legalOwner} · ${VNTECH_BRAND.productId} · ${VNTECH_BRAND.sourceFingerprintShort}`, style: 3 }]);
  rows.push([
    { value: "Mã đơn gốc", style: 2 }, { value: doc.requestNo, style: 3 },
    { value: "Số PO", style: 2 }, { value: doc.poNo, style: 3 },
    { value: "Phiếu giao", style: 2 }, { value: doc.receiptNo || "—", style: 3 },
    { value: "Trạng thái", style: 2 }, { value: doc.status || "—", style: 3 },
  ]);
  rows.push([
    { value: "Dự án", style: 2 }, { value: `${doc.projectCode || ""}${doc.projectName ? ` - ${doc.projectName}` : ""}`, style: 3 },
    { value: "Nhà cung cấp", style: 2 }, { value: doc.supplierName || "", style: 3 },
    { value: "Kho nhận", style: 2 }, { value: doc.warehouseName || "", style: 3 },
    { value: "ETA", style: 2 }, { value: viDate(doc.eta), style: 3 },
  ]);
  rows.push([
    { value: "Ngày đặt PO", style: 2 }, { value: viDate(doc.orderedAt), style: 3 },
    { value: "Thời điểm giao", style: 2 }, { value: viDate(doc.receivedAt), style: 3 },
    { value: "Phiếu giao NCC", style: 2 }, { value: doc.deliveryNoteNo || "—", style: 3 },
    { value: "BCH xác nhận", style: 2 }, { value: doc.bchConfirmedAt ? `${viDate(doc.bchConfirmedAt)}${doc.bchConfirmedByName ? ` - ${doc.bchConfirmedByName}` : ""}` : "—", style: 3 },
  ]);
  rows.push([
    { value: "Chứng chỉ / CO-CQ", style: 2 }, { value: certificateLabel(doc.certificateStatus), style: 3 },
    { value: "Giấy giao hàng", style: 2 }, { value: documentLabel(doc.deliveryDocumentStatus), style: 3 },
  ]);
  rows.push([]);
  const headers = ["STT", "Mã vật tư", "Tên vật tư", "ĐVT", "SL đề nghị", "SL duyệt", "SL PO", "Đơn giá PO", "Thành tiền PO", "Thực giao chuyến", "Chấp nhận chuyến", "Thực giao lũy kế", "Chấp nhận lũy kế", "CL thực giao LK - PO", "Còn thiếu PO", "Lô / Serial", "Đánh giá"];
  rows.push(headers.map((value) => ({ value, style: 4 })));
  doc.lines.forEach((line, index) => {
    const ordered = number(line.orderedQty); const unitPrice = number(line.unitPrice); const tripActual = line.actualTripQty; const tripAccepted = line.acceptedTripQty;
    rows.push([
      { value: line.lineNo || index + 1, style: 5, type: "n" },
      { value: text(line.materialCode), style: 6 }, { value: text(line.materialName), style: 6 }, { value: text(line.unit), style: 5 },
      { value: number(line.requestedQty), style: 7, type: "n" }, { value: number(line.approvedQty), style: 7, type: "n" }, { value: ordered, style: 7, type: "n" },
      { value: unitPrice, style: 8, type: "n" }, { value: ordered * unitPrice, style: 8, type: "n" },
      { value: tripActual == null ? "" : number(tripActual), style: tripActual == null ? 5 : 7, type: tripActual == null ? "s" : "n" },
      { value: tripAccepted == null ? "" : number(tripAccepted), style: tripAccepted == null ? 5 : 7, type: tripAccepted == null ? "s" : "n" },
      { value: number(line.actualCumulativeQty), style: 7, type: "n" }, { value: number(line.acceptedCumulativeQty), style: 7, type: "n" },
      { value: lineVariance(line), style: 7, type: "n" }, { value: lineRemaining(line), style: 7, type: "n" },
      { value: text(line.lotNo), style: 6 }, { value: lineAssessment(line), style: 6 },
    ]);
  });
  const totalPo = doc.lines.reduce((sum, line) => sum + number(line.orderedQty) * number(line.unitPrice), 0);
  rows.push([{ value: "TỔNG GIÁ TRỊ PO", style: 9 }, { value: totalPo, style: 10, type: "n" }]);
  return rows;
}

export function buildSupplyXlsxBytes(doc: SupplyExportDocument) {
  const rows = supplyXlsxRows(doc); const lastRow = rows.length;
  const sheetRows = rows.map((cells, rowIndex) => `<row r="${rowIndex + 1}"${rowIndex === 0 ? ' ht="28" customHeight="1"' : ""}>${cells.map((cell, colIndex) => cellXml(rowIndex + 1, colIndex + 1, cell)).join("")}</row>`).join("");
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:Q${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="7" topLeftCell="A8" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <cols>
    <col min="1" max="1" width="6" customWidth="1"/><col min="2" max="2" width="16" customWidth="1"/><col min="3" max="3" width="34" customWidth="1"/><col min="4" max="4" width="8" customWidth="1"/>
    <col min="5" max="7" width="12" customWidth="1"/><col min="8" max="9" width="17" customWidth="1"/><col min="10" max="15" width="14" customWidth="1"/><col min="16" max="16" width="16" customWidth="1"/><col min="17" max="17" width="22" customWidth="1"/>
  </cols>
  <sheetData>${sheetRows}</sheetData>
  <autoFilter ref="A8:Q${Math.max(8, lastRow - 1)}"/>
  <mergeCells count="2"><mergeCell ref="A1:Q1"/><mergeCell ref="A2:Q2"/></mergeCells>
  <pageMargins left="0.2" right="0.2" top="0.35" bottom="0.35" header="0.2" footer="0.2"/>
  <pageSetup orientation="landscape" paperSize="9" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="2"><numFmt numFmtId="164" formatCode="#,##0.###"/><numFmt numFmtId="165" formatCode="#,##0"/></numFmts>
  <fonts count="4"><font><sz val="10"/><name val="Aptos"/></font><font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Aptos Display"/></font><font><b/><sz val="10"/><name val="Aptos"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Aptos"/></font></fonts>
  <fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0B6FA4"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFD9EEF9"/><bgColor indexed="64"/></patternFill></fill></fills>
  <borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFB8C8D2"/></left><right style="thin"><color rgb="FFB8C8D2"/></right><top style="thin"><color rgb="FFB8C8D2"/></top><bottom style="thin"><color rgb="FFB8C8D2"/></bottom><diagonal/></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="11">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf><xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="1" xfId="0" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
    <xf numFmtId="165" fontId="2" fillId="3" borderId="1" xfId="0" applyNumberFormat="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
  const archive: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Đối chiếu cung ứng" sheetId="1" r:id="rId1"/></sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    "xl/styles.xml": strToU8(stylesXml), "xl/worksheets/sheet1.xml": strToU8(sheetXml),
  };
  return zipSync(archive, { level: 6 });
}

function supplyBaseName(doc: SupplyExportDocument) {
  const parts = [doc.requestNo, doc.poNo, doc.kind === "delivery" ? doc.receiptNo || "GIAO-HANG" : "PO"];
  return safeFileName(parts.filter(Boolean).join("__"));
}
export function downloadSupplyXlsx(doc: SupplyExportDocument) {
  const bytes = buildSupplyXlsxBytes(doc);
  downloadBlob(new Blob([blobBytes(bytes)], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${supplyBaseName(doc)}.xlsx`);
}

function supplyPdfCanvases(doc: SupplyExportDocument) {
  const pageWidth = 1684; const pageHeight = 1191; const margin = 42; const headerHeight = 250; const tableHeaderHeight = 66; const rowHeight = 54; const footerHeight = 44;
  const columns = [45, 110, 285, 58, 82, 82, 82, 92, 92, 92, 92, 84, 90, 120];
  const labels = ["STT", "Mã VT", "Tên vật tư", "ĐVT", "Đề nghị", "Duyệt", "PO", "Giao chuyến", "Nhận chuyến", "Giao LK", "Nhận LK", "CL LK-PO", "Còn thiếu", "Đánh giá"];
  const available = pageHeight - margin - headerHeight - tableHeaderHeight - footerHeight - margin; const rowsPerPage = Math.max(1, Math.floor(available / rowHeight));
  const totalPages = Math.max(1, Math.ceil(doc.lines.length / rowsPerPage)); const pages: HTMLCanvasElement[] = [];
  const totalPo = doc.lines.reduce((sum, line) => sum + number(line.orderedQty) * number(line.unitPrice), 0);
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex += 1) {
    const canvas = document.createElement("canvas"); canvas.width = pageWidth; canvas.height = pageHeight; const ctx = canvas.getContext("2d"); if (!ctx) continue;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, pageWidth, pageHeight); ctx.fillStyle = "#0b6fa4"; ctx.fillRect(0, 0, pageWidth, 18);
    ctx.fillStyle = "#12334b"; ctx.textAlign = "center"; ctx.font = "700 30px Arial, sans-serif"; ctx.fillText(supplyTitle(doc), pageWidth / 2, 62);
    ctx.font = "700 22px Arial, sans-serif"; ctx.fillStyle = "#0b6fa4"; ctx.fillText(`Mã đơn: ${doc.requestNo}   |   PO: ${doc.poNo}${doc.receiptNo ? `   |   Giao: ${doc.receiptNo}` : ""}`, pageWidth / 2, 102);
    ctx.font = "400 12px Arial, sans-serif"; ctx.fillStyle = "#6b8190"; ctx.fillText(`${VNTECH_BRAND.legalOwner} · ${VNTECH_BRAND.productId}`, pageWidth / 2, 124);
    ctx.textAlign = "left"; ctx.fillStyle = "#17324a"; ctx.font = "400 17px Arial, sans-serif"; const left = margin; const mid = 575; const right = 1115;
    ctx.fillText(`Dự án: ${doc.projectCode || ""}${doc.projectName ? ` - ${doc.projectName}` : ""}`, left, 145); ctx.fillText(`Nhà cung cấp: ${doc.supplierName || "—"}`, left, 176); ctx.fillText(`Kho nhận: ${doc.warehouseName || "—"}`, left, 207);
    ctx.fillText(`Ngày đặt PO: ${viDate(doc.orderedAt) || "—"}`, mid, 145); ctx.fillText(`ETA: ${viDate(doc.eta) || "—"}`, mid, 176); ctx.fillText(`Thời điểm giao: ${viDate(doc.receivedAt) || "—"}`, mid, 207);
    ctx.fillText(`Trạng thái: ${doc.status || "—"}`, right, 145); ctx.fillText(`Tổng PO: ${money(totalPo)} đ`, right, 176); ctx.fillText(doc.kind === "delivery" ? `CO/CQ: ${certificateLabel(doc.certificateStatus)} · Phiếu giao: ${documentLabel(doc.deliveryDocumentStatus)}` : "Đối chiếu theo cùng mã ĐNMH", right, 207);
    if (doc.kind === "delivery" && doc.bchConfirmedAt) { ctx.fillStyle = "#52697a"; ctx.font = "italic 15px Arial, sans-serif"; ctx.fillText(`BCH: ${doc.bchConfirmedByName || "—"} · ${viDate(doc.bchConfirmedAt)}`, margin, 238); }
    let x = margin; const tableY = margin + headerHeight;
    labels.forEach((label, index) => { drawCell(ctx, x, tableY, columns[index], tableHeaderHeight, label, { bold: true, align: "center", fontSize: 14, fill: "#0b6fa4", color: "#ffffff", maxLines: 2 }); x += columns[index]; });
    const start = pageIndex * rowsPerPage; const end = Math.min(doc.lines.length, start + rowsPerPage);
    for (let rowIndex = start; rowIndex < end; rowIndex += 1) {
      const line = doc.lines[rowIndex]; const assessment = line.lotNo ? `${lineAssessment(line)} · Lô ${line.lotNo}` : lineAssessment(line);
      const values = [String(line.lineNo || rowIndex + 1), text(line.materialCode), text(line.materialName), text(line.unit), qty(number(line.requestedQty)), qty(number(line.approvedQty)), qty(number(line.orderedQty)), line.actualTripQty == null ? "—" : qty(number(line.actualTripQty)), line.acceptedTripQty == null ? "—" : qty(number(line.acceptedTripQty)), qty(number(line.actualCumulativeQty)), qty(number(line.acceptedCumulativeQty)), qty(lineVariance(line)), qty(lineRemaining(line)), assessment];
      x = margin; const y = tableY + tableHeaderHeight + (rowIndex - start) * rowHeight; values.forEach((value, index) => { drawCell(ctx, x, y, columns[index], rowHeight, value, { fontSize: index === 2 ? 14 : 13, align: [0, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].includes(index) ? "center" : "left", maxLines: 2 }); x += columns[index]; });
    }
    ctx.fillStyle = "#52697a"; ctx.font = "400 15px Arial, sans-serif"; ctx.textAlign = "left"; ctx.fillText(`Xuất từ ${VNTECH_BRAND.productName} V${VNTECH_BRAND.version} · ${VNTECH_BRAND.productId} · ${VNTECH_BRAND.sourceFingerprintShort} · ${new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date())}`, margin, pageHeight - 30); ctx.textAlign = "right"; ctx.fillText(`Trang ${pageIndex + 1}/${totalPages}`, pageWidth - margin, pageHeight - 30); pages.push(canvas);
  }
  return pages;
}

export function downloadSupplyPdf(doc: SupplyExportDocument) {
  const canvases = supplyPdfCanvases(doc); const images = canvases.map((canvas) => ({ bytes: dataUrlBytes(canvas.toDataURL("image/jpeg", 0.93)), width: canvas.width, height: canvas.height })); const pdf = pdfFromJpegs(images);
  downloadBlob(new Blob([blobBytes(pdf)], { type: "application/pdf" }), `${supplyBaseName(doc)}.pdf`);
}
