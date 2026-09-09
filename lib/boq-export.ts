// VNTECH PROPRIETARY SOURCE | BOQ import/export stabilized for V4.8 FINAL.
import { VNTECH_BRAND } from "@/lib/vntech-brand";
import { configuredFormFields, type FormFieldConfig } from "@/lib/form-fields";
import { blobBytes, buildSimpleXlsxBytes, csvText, downloadBlob, downloadCsv, safeDownloadName } from "@/lib/tabular-export";

type Row = Record<string, unknown>;
export type BoqExportRow = Row;
export type BoqExportDocument = { projectCode?: string; projectName?: string; contractNo?: string; rows: BoqExportRow[]; fieldConfigs?: FormFieldConfig[]; formKey?: "boq"|"boq_purchase"; };

const num=(v:unknown)=>{const n=Number(v);return Number.isFinite(n)?n:0;};
const qty=(v:unknown)=>new Intl.NumberFormat("vi-VN",{maximumFractionDigits:3}).format(num(v));
const safe=(value:string)=>safeDownloadName(value);
const fieldValue=(row:Row,key:string,index:number):string|number=>{
  const custom=(row.customFields&&typeof row.customFields==="object"&&!Array.isArray(row.customFields))?row.customFields as Row:{};
  switch(key){
    case "sourceOrder": return Number(row.sourceOrder||row.lineNo||index+1);
    case "lineNo": return String(row.contractLineRef||row.lineNo||"");
    case "rowRole": return String(row.rowRole)==="section"?"Tiêu đề phần":String(row.rowRole)==="system"?"Tiêu đề hệ":String(row.rowRole)==="group"?"Nhóm công việc":String(row.rowRole)==="component"?"Cấu kiện":String(row.rowRole)==="subtotal"?"Tổng cộng":String(row.rowRole)==="note"?"Ghi chú":"Vật tư";
    case "itemType": return String(row.itemType)==="outside_contract"?"Ngoài HĐ":"Trong HĐ";
    case "contractMaterialCode": return String(row.contractMaterialCode||row.materialCode||"");
    case "approvedMaterialCode": return String(row.approvedMaterialCode||row.materialCode||"");
    case "materialName": return String(row.materialName||row.description||"");
    case "unit": return String(row.unit||"");
    case "contractQty": return num(row.contractQty);
    case "remeasuredQty": return num(row.remeasuredQty);
    case "unitPrice": return num(row.unitPrice);
    case "contractValue": return num(row.contractQty)*num(row.unitPrice);
    case "receivedValue": return Math.min(num(row.contractQty),num(row.receivedQty))*num(row.unitPrice);
    case "remainingValue": return Math.max(0,num(row.contractQty)-num(row.receivedQty))*num(row.unitPrice);
    case "receivedQty": return num(row.receivedQty);
    case "varianceContract": return row.varianceContract==null?num(row.receivedQty)-num(row.contractQty):num(row.varianceContract);
    case "varianceRemeasured": return row.varianceRemeasured==null?num(row.receivedQty)-num(row.remeasuredQty):num(row.varianceRemeasured);
    case "issuedQty": return num(row.issuedQty);
    case "stockQty": return num(row.stockQty);
    case "requestedQty": return num(row.requestedQty);
    case "approvedQty": return num(row.approvedQty);
    case "orderedQty": return num(row.orderedQty);
    case "orderedNotReceivedQty": return row.orderedNotReceivedQty==null?Math.max(0,num(row.orderedQty)-num(row.receivedQty)):num(row.orderedNotReceivedQty);
    case "remainingContractQty": return Math.max(0,num(row.contractQty)-num(row.receivedQty));
    case "remainingRemeasuredQty": return Math.max(0,num(row.remeasuredQty)-num(row.receivedQty));
    case "remainingToBuy": return row.remainingToBuy==null?Math.max(0,num(row.controlQty??row.remeasuredQty??row.contractQty)-num(row.orderedQty)):num(row.remainingToBuy);
    case "assessment": return String(row.assessment||"");
    case "note": return String(row.note||"");
    default: return (custom[key] as string|number)??String(row[key]??"");
  }
};
export function boqConfiguredFields(configs?:FormFieldConfig[], mode:"template"|"export"="export", formKey:"boq"|"boq_purchase"="boq"){
  const all=configuredFormFields(configs,formKey);
  const selected=all.filter((field)=>Boolean(mode==="template"?field.importable:field.exportable));
  return selected.length?selected:all.filter((field)=>["lineNo","materialName","contractQty"].includes(String(field.fieldKey))).slice(0,3);
}
function fields(configs?:FormFieldConfig[], forTemplate=false, formKey:"boq"|"boq_purchase"="boq"){return boqConfiguredFields(configs,forTemplate?"template":"export",formKey);}
function notesFor(fieldsList:FormFieldConfig[]){return fieldsList.map(f=>String(f.sourceKind)==="system"?"Cột hệ thống - tự link/tính, không nhập tay":Boolean(f.required)?"Bắt buộc theo cấu hình Admin":"Không bắt buộc");}
function sampleValue(key:string):string|number{const map:Row={sourceOrder:1,lineNo:"IV.1.1",rowRole:"Vật tư",internalMaterialCode:"VTNB-EE-001",systemCode:"DIEN",subgroupName:"BUSWAY",itemType:"Trong HĐ",contractMaterialCode:"VT-EL-001",approvedMaterialCode:"VT-EL-001",materialName:"Thanh dẫn điện Nhôm (Feeder) 2500A",unit:"10m",contractQty:39.4,remeasuredQty:38.7,unitPrice:12500000,contractValue:"Tự tính",receivedQty:"",receivedValue:"",remainingValue:"",varianceContract:"",varianceRemeasured:"",issuedQty:"",stockQty:"",orderedNotReceivedQty:"",note:"Giữ nguyên thứ tự nguồn; STT HĐ được phép trống/lặp"};return (map[key] as string|number)??"";}

export function buildBoqXlsxBytes(doc:BoqExportDocument){
  const formKey=doc.formKey||"boq"; const fs=fields(doc.fieldConfigs,false,formKey); const headers=fs.map(f=>String(f.displayName)); const rows=doc.rows.map((r,i)=>fs.map(f=>fieldValue(r,String(f.fieldKey),i)));
  return buildSimpleXlsxBytes({sheetName:"BOQ Hop dong",title:`${VNTECH_BRAND.productName} · ${formKey==="boq_purchase"?"LŨY KẾ MUA HÀNG ĐỐI CHIẾU BOQ/HĐ":"BOQ/HỢP ĐỒNG"}`,subtitle:`${doc.projectCode||"Tất cả dự án"}${doc.projectName?` - ${doc.projectName}`:""}${doc.contractNo?` · HĐ ${doc.contractNo}`:""} · Lũy kế nhập = số thực nhận đã BCH/Thủ kho xác nhận`,headers,notes:notesFor(fs),rows,widths:headers.map((h,i)=>i===4?34:Math.min(30,Math.max(12,Math.ceil(h.length*.75))))});
}
export function downloadBoqXlsx(doc:BoqExportDocument){downloadBlob(new Blob([blobBytes(buildBoqXlsxBytes(doc))],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),`${safe(`${doc.formKey==="boq_purchase"?"Luy_Ke_Mua_Hang":"Xuat_BOQ_Hop_Dong"}_${doc.projectCode||"Tat_ca"}`)}.xlsx`);}
export function downloadBoqCsv(doc:BoqExportDocument){const fs=fields(doc.fieldConfigs,false,doc.formKey||"boq");downloadCsv(fs.map(f=>String(f.displayName)),doc.rows.map((r,i)=>fs.map(f=>fieldValue(r,String(f.fieldKey),i))),`${doc.formKey==="boq_purchase"?"Luy_Ke_Mua_Hang":"Xuat_BOQ_Hop_Dong"}_${doc.projectCode||"Tat_ca"}`);}
function listOptions(field:FormFieldConfig){try{const parsed=JSON.parse(String(field.optionsJson||"[]"));return Array.isArray(parsed)?parsed.map(value=>String(value).trim()).filter(Boolean):[];}catch{return [];}}
export function buildBoqTemplateXlsxBytes(configs?:FormFieldConfig[]){const fs=fields(configs,true,"boq");const headers=fs.map(f=>`${f.displayName}${f.required?" *":""}`);const rows=[fs.map(f=>sampleValue(String(f.fieldKey)))];const listValidations=fs.map((field,columnIndex)=>({field,columnIndex,values:listOptions(field)})).filter(item=>String(item.field.dataType)==="select"&&item.values.length).map(item=>({columnIndex:item.columnIndex,values:item.values,startRow:5,endRow:5000,promptTitle:String(item.field.displayName),prompt:`Chọn ${item.field.displayName} theo danh sách cấu hình.`}));return buildSimpleXlsxBytes({sheetName:"Mau BOQ Hop Dong",title:`${VNTECH_BRAND.productName} · MẪU NHẬP BOQ/HỢP ĐỒNG`,subtitle:`Sinh trực tiếp theo ${fs.length} cột đang bật IMPORT trong cấu hình BOQ/Hợp đồng đã lưu. Tên cột, thứ tự, Bắt buộc và Import là độc lập với cờ Hiện/Export. Các trường kiểu Danh sách có nút chọn ngay trong Excel.`,headers,notes:notesFor(fs),rows,widths:headers.map((h,i)=>String(fs[i]?.fieldKey)==="materialName"?40:Math.min(30,Math.max(12,Math.ceil(h.length*.8)))),listValidations});}
export function downloadBoqTemplateXlsx(configs?:FormFieldConfig[]){const bytes=buildBoqTemplateXlsxBytes(configs);downloadBlob(new Blob([blobBytes(bytes)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),"Mau_BOQ_Hop_Dong_Theo_Cau_Hinh_VNTECH.xlsx");}
export function buildBoqTemplateCsvText(configs?:FormFieldConfig[]){const fs=fields(configs,true,"boq");return csvText(fs.map(f=>`${f.displayName}${f.required?" *":""}`),[fs.map(f=>sampleValue(String(f.fieldKey)))],";");}
export function downloadBoqTemplateCsv(configs?:FormFieldConfig[]){const fs=fields(configs,true,"boq");downloadCsv(fs.map(f=>`${f.displayName}${f.required?" *":""}`),[fs.map(f=>sampleValue(String(f.fieldKey)))],"Mau_BOQ_Hop_Dong_Theo_Cau_Hinh_VNTECH_V5_3_0_FULL_W2");}
export function downloadBoqPriceTemplateXlsx(doc:BoqExportDocument){
  const rows=doc.rows.filter(r=>["material","component"].includes(String(r.rowRole||"material"))).sort((a,b)=>num(a.sourceOrder||a.lineNo)-num(b.sourceOrder||b.lineNo));
  const headers=["Thứ tự nguồn","Mã dòng BOQ","STT theo hợp đồng","Mã hệ","Mã vật tư (nội bộ)","Mã vật tư theo Hợp đồng","Tên vật tư","Đơn vị","Khối lượng BOQ/HĐ","Khối lượng làm cơ sở giá trị","Đơn giá hợp đồng / phát sinh","Thành tiền hợp đồng / phát sinh","Ghi chú"];
  const data=rows.map((r,i)=>{const effective=String(r.itemType)==="outside_contract"?(String(r.variationStatus)==="approved"?num(r.remeasuredQty):0):(String(r.variationStatus)==="approved"?num(r.remeasuredQty):num(r.contractQty));const excelRow=i+5;return[num(r.sourceOrder||r.lineNo||i+1),String(r.id||""),String(r.contractLineRef||r.lineNo||""),String(r.systemCode||(r.customFields as Row|undefined)?.systemCode||"KHAC"),String(r.internalMaterialCode||r.materialCode||""),String(r.contractMaterialCode||""),String(r.materialName||r.description||""),String(r.unit||""),num(r.contractQty),effective,num(r.unitPrice),{formula:`J${excelRow}*K${excelRow}`,value:effective*num(r.unitPrice)},String(r.itemType)==="outside_contract"?"Phát sinh ngoài HĐ – chỉ cộng khi đã duyệt":"Trong HĐ"]});
  const bytes=buildSimpleXlsxBytes({sheetName:"Gia tri BOQ",title:`${VNTECH_BRAND.productName} · CẬP NHẬT ĐƠN GIÁ HỢP ĐỒNG`,subtitle:`${doc.projectCode||"Dự án"}${doc.projectName?` - ${doc.projectName}`:""} · Chỉ sửa cột Đơn giá; Mã dòng BOQ là khóa đối chiếu, không được thay đổi.`,headers,notes:["Giữ nguyên","KHÓA ĐỐI CHIẾU","Giữ nguyên","Giữ nguyên","Giữ nguyên","Giữ nguyên","Tham chiếu","Tham chiếu","Tham chiếu","Hệ thống xác định","NHẬP GIÁ CHƯA VAT","Công thức tự tính","Tham chiếu"],rows:data,widths:[14,24,16,12,20,23,38,10,17,22,24,25,34]});
  downloadBlob(new Blob([blobBytes(bytes)],{type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}),`${safe(`Mau_Cap_Nhat_Gia_Tri_BOQ_${doc.projectCode||"Du_an"}`)}.xlsx`);
}
export function downloadBoqPriceTemplateCsv(doc:BoqExportDocument){
  const rows=doc.rows.filter(r=>["material","component"].includes(String(r.rowRole||"material"))).sort((a,b)=>num(a.sourceOrder||a.lineNo)-num(b.sourceOrder||b.lineNo));
  const headers=["Thứ tự nguồn","Mã dòng BOQ","STT theo hợp đồng","Mã hệ","Mã vật tư (nội bộ)","Mã vật tư theo Hợp đồng","Tên vật tư","Đơn vị","Khối lượng BOQ/HĐ","Khối lượng làm cơ sở giá trị","Đơn giá hợp đồng / phát sinh","Thành tiền hợp đồng / phát sinh","Ghi chú"];
  const data=rows.map((r,i)=>{const effective=String(r.itemType)==="outside_contract"?(String(r.variationStatus)==="approved"?num(r.remeasuredQty):0):(String(r.variationStatus)==="approved"?num(r.remeasuredQty):num(r.contractQty));return[num(r.sourceOrder||r.lineNo||i+1),String(r.id||""),String(r.contractLineRef||r.lineNo||""),String(r.systemCode||(r.customFields as Row|undefined)?.systemCode||"KHAC"),String(r.internalMaterialCode||r.materialCode||""),String(r.contractMaterialCode||""),String(r.materialName||r.description||""),String(r.unit||""),num(r.contractQty),effective,num(r.unitPrice),effective*num(r.unitPrice),String(r.itemType)==="outside_contract"?"Phát sinh ngoài HĐ – chỉ cộng khi đã duyệt":"Trong HĐ"]});
  downloadCsv(headers,data,`Mau_Cap_Nhat_Gia_Tri_BOQ_${doc.projectCode||"Du_an"}`);
}

function canvasJpegBytes(dataUrl:string){const binary=atob(dataUrl.split(",")[1]||"");const out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out;}
export function pdfFromJpegs(images:{bytes:Uint8Array;width:number;height:number}[]){const te=new TextEncoder();const text=(s:string)=>te.encode(s);const chunks:Uint8Array[]=[];const offsets:number[]=[0];let length=0;const push=(b:Uint8Array)=>{chunks.push(b);length+=b.length;};push(text("%PDF-1.4\n%VNTECH\n"));const count=2+images.length*3;const pagesId=1,catalogId=2;const pageIds=images.map((_,i)=>3+i*3),imageIds=images.map((_,i)=>4+i*3),contentIds=images.map((_,i)=>5+i*3);function obj(id:number,head:string,bin?:Uint8Array,tail=""){offsets[id]=length;push(text(`${id} 0 obj\n${head}`));if(bin){push(text("\nstream\n"));push(bin);push(text(`\nendstream\n${tail}`));}else push(text(tail));push(text("\nendobj\n"));}obj(pagesId,`<< /Type /Pages /Count ${images.length} /Kids [${pageIds.map(id=>`${id} 0 R`).join(" ")}] >>`);obj(catalogId,`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);images.forEach((im,i)=>{const pw=842,ph=595;obj(pageIds[i],`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /Im0 ${imageIds[i]} 0 R >> >> /Contents ${contentIds[i]} 0 R >>`);obj(imageIds[i],`<< /Type /XObject /Subtype /Image /Width ${im.width} /Height ${im.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${im.bytes.length} >>`,im.bytes);const stream=`q\n${pw} 0 0 ${ph} 0 0 cm\n/Im0 Do\nQ\n`;obj(contentIds[i],`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);});const xref=length;let x=`xref\n0 ${count+1}\n0000000000 65535 f \n`;for(let i=1;i<=count;i++)x+=`${String(offsets[i]||0).padStart(10,"0")} 00000 n \n`;x+=`trailer\n<< /Size ${count+1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;push(text(x));const out=new Uint8Array(length);let cursor=0;chunks.forEach(c=>{out.set(c,cursor);cursor+=c.length;});return out;}
function wrap(ctx:CanvasRenderingContext2D,value:string,x:number,y:number,w:number,lineH:number,max=4){const words=value.split(/\s+/);let line="";const lines:string[]=[];for(const word of words){const test=line?`${line} ${word}`:word;if(ctx.measureText(test).width>w&&line){lines.push(line);line=word;}else line=test;}if(line)lines.push(line);lines.slice(0,max).forEach((l,i)=>ctx.fillText(l,x,y+i*lineH));}
export function downloadBoqPdf(doc:BoqExportDocument){
  const fs=fields(doc.fieldConfigs,false,doc.formKey||"boq"); const maxCols=Math.max(1,fs.length); const pageW=1600,pageH=1130,margin=28,top=145,rowH=46,headH=60,per=Math.max(10,Math.floor((pageH-top-headH-55)/rowH));const pages=Math.max(1,Math.ceil(doc.rows.length/per));const canvases:HTMLCanvasElement[]=[];
  for(let pi=0;pi<pages;pi++){const c=document.createElement("canvas");c.width=pageW;c.height=pageH;const ctx=c.getContext("2d");if(!ctx)continue;ctx.fillStyle="#fff";ctx.fillRect(0,0,pageW,pageH);ctx.fillStyle="#13598B";ctx.fillRect(0,0,pageW,14);ctx.fillStyle="#14334b";ctx.textAlign="center";ctx.font="700 30px Arial";ctx.fillText(doc.formKey==="boq_purchase"?"LŨY KẾ MUA HÀNG - VNTECH ERP":"BOQ / HỢP ĐỒNG - VNTECH ERP",pageW/2,52);ctx.font="700 18px Arial";ctx.fillStyle="#13598B";ctx.fillText(`${doc.projectCode||"Tất cả dự án"}${doc.projectName?` - ${doc.projectName}`:""}${doc.contractNo?` · HĐ ${doc.contractNo}`:""}`,pageW/2,83);ctx.font="400 13px Arial";ctx.fillStyle="#64748b";ctx.fillText("Lũy kế nhập về chỉ tính số thực tế đã BCH/Thủ kho xác nhận",pageW/2,108);
    const usable=pageW-margin*2;const widths=fs.map(f=>String(f.fieldKey)==="materialName"?2.2: String(f.fieldKey)==="note"?1.6:1);const weight=widths.reduce((a,b)=>a+b,0);const cols=widths.map(w=>usable*w/weight);let xp=margin;const y=top;fs.forEach((f,i)=>{ctx.fillStyle="#13598B";ctx.fillRect(xp,y,cols[i],headH);ctx.strokeStyle="#b8d6e7";ctx.strokeRect(xp,y,cols[i],headH);ctx.fillStyle="#fff";ctx.font="700 12px Arial";ctx.textAlign="center";wrap(ctx,String(f.displayName),xp+5,y+18,cols[i]-10,15,3);xp+=cols[i];});
    const start=pi*per,end=Math.min(doc.rows.length,start+per);for(let ri=start;ri<end;ri++){xp=margin;const yy=y+headH+(ri-start)*rowH;fs.forEach((f,i)=>{ctx.fillStyle=String(f.sourceKind)==="system"?"#f1f5f9":"#fff";ctx.fillRect(xp,yy,cols[i],rowH);ctx.strokeStyle="#dbe5eb";ctx.strokeRect(xp,yy,cols[i],rowH);ctx.fillStyle="#17324a";ctx.font="400 11px Arial";const val=fieldValue(doc.rows[ri],String(f.fieldKey),ri);ctx.textAlign=typeof val==="number"?"right":"left";wrap(ctx,typeof val==="number"?qty(val):String(val),xp+(typeof val==="number"?cols[i]-5:5),yy+16,cols[i]-10,14,2);xp+=cols[i];});}
    ctx.fillStyle="#64748b";ctx.font="400 12px Arial";ctx.textAlign="left";ctx.fillText(`${VNTECH_BRAND.legalOwner} · ${VNTECH_BRAND.productId}`,margin,pageH-22);ctx.textAlign="right";ctx.fillText(`Trang ${pi+1}/${pages}`,pageW-margin,pageH-22);canvases.push(c);}
  const imgs=canvases.map(c=>({bytes:canvasJpegBytes(c.toDataURL("image/jpeg",.92)),width:c.width,height:c.height}));downloadBlob(new Blob([blobBytes(pdfFromJpegs(imgs))],{type:"application/pdf"}),`${safe(`${doc.formKey==="boq_purchase"?"Luy_Ke_Mua_Hang":"Xuat_BOQ_Hop_Dong"}_${doc.projectCode||"Tat_ca"}`)}.pdf`);
}
