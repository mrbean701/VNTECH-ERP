import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { boqConfiguredFields, buildBoqTemplateXlsxBytes } from "../lib/boq-export";
import type { FormFieldConfig } from "../lib/form-fields";

const configs:FormFieldConfig[]=[
  {formKey:"boq",fieldKey:"lineNo",displayName:"STT hợp đồng tùy chỉnh",visible:true,importable:true,exportable:true,required:false,sortOrder:1},
  {formKey:"boq",fieldKey:"rowRole",displayName:"LOẠI DÒNG THEO ADMIN",visible:false,importable:true,exportable:false,required:false,sortOrder:2},
  {formKey:"boq",fieldKey:"materialName",displayName:"Tên thiết bị M&E",visible:true,importable:true,exportable:true,required:true,sortOrder:3},
  {formKey:"boq",fieldKey:"customMar",displayName:"Số MAR",sourceKind:"custom",dataType:"text",visible:true,importable:true,exportable:true,required:false,sortOrder:4},
  {formKey:"boq",fieldKey:"note",displayName:"Cột ẩn UI nhưng được Import",visible:false,importable:true,exportable:true,required:false,sortOrder:5},
  {formKey:"boq",fieldKey:"unitPrice",displayName:"Đơn giá đang HIỆN nhưng KHÔNG IMPORT",visible:true,importable:false,exportable:true,required:false,sortOrder:6},
];
const exactFields=boqConfiguredFields(configs,"template","boq");
assert.deepEqual(exactFields.map((field)=>field.fieldKey),["lineNo","rowRole","materialName","customMar","note"],"Mẫu BOQ phải lấy đúng và chỉ các cột Import đã lưu, theo đúng thứ tự Admin.");
const bytes=buildBoqTemplateXlsxBytes(configs);
const parts=unzipSync(bytes);const xml=Object.values(parts).map(part=>new TextDecoder().decode(part)).join("\n");
assert(xml.includes("STT hợp đồng tùy chỉnh"),"Không tìm thấy tiêu đề động trong XLSX.");
assert(xml.includes("LOẠI DÒNG THEO ADMIN"),"rowRole ẩn UI nhưng bật Import phải xuất hiện trong mẫu.");
assert(xml.includes("Tên thiết bị M&amp;E"));
assert(xml.includes("Số MAR"));
assert(xml.includes("Cột ẩn UI nhưng được Import"),"Cột Import phải có trong mẫu dù đang ẩn trên UI.");
assert(!xml.includes("Đơn giá đang HIỆN nhưng KHÔNG IMPORT"),"Cột Hiện nhưng không bật Import không được xuất vào mẫu nhập.");
assert(xml.indexOf("STT hợp đồng tùy chỉnh")<xml.indexOf("LOẠI DÒNG THEO ADMIN"));
assert(xml.indexOf("LOẠI DÒNG THEO ADMIN")<xml.indexOf("Tên thiết bị M&amp;E"));
const defaultBytes=buildBoqTemplateXlsxBytes();
const defaultParts=unzipSync(defaultBytes);const defaultXml=Object.values(defaultParts).map(part=>new TextDecoder().decode(part)).join("\n");
assert(!defaultXml.includes("Thứ tự nguồn"),"Mẫu BOQ không được yêu cầu người dùng nhập Thứ tự nguồn tự động.");
assert(defaultXml.includes("Loại dòng"),"Loại dòng đang bật Import phải có trong mẫu dù mặc định ẩn trên giao diện.");
assert(defaultXml.includes("DIEN"),"Mẫu BOQ phải có dữ liệu mẫu Mã hệ theo cấu hình.");
console.log("Dynamic BOQ Excel template passed: exact saved Admin config controls headers/order/import independently from visibility/export.");
