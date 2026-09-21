// VNTECH FULL W2 dynamic form/column configuration.
export type FormKey = "boq" | "boq_purchase" | "request_header" | "request_line";
export type FieldDataType = "text" | "number" | "date" | "select" | "textarea";
export type FormFieldConfig = {
  id?: string;
  formKey: FormKey | string;
  fieldKey: string;
  displayName: string;
  dataType?: FieldDataType | string;
  sourceKind?: "core" | "system" | "custom" | string;
  visible?: boolean | number;
  required?: boolean | number;
  importable?: boolean | number;
  exportable?: boolean | number;
  editable?: boolean | number;
  sortOrder?: number;
  optionsJson?: string | null;
  systemLocked?: boolean | number;
  active?: boolean | number;
};

export const BOQ_DEFAULT_FIELDS: FormFieldConfig[] = [
  { formKey:"boq", fieldKey:"sourceOrder", displayName:"Thứ tự nguồn", dataType:"number", sourceKind:"system", visible:false, required:false, importable:false, exportable:false, editable:false, sortOrder:0, systemLocked:true },
  { formKey:"boq", fieldKey:"lineNo", displayName:"STT theo hợp đồng", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:10, systemLocked:true },
  { formKey:"boq", fieldKey:"rowRole", displayName:"Loại dòng", dataType:"select", sourceKind:"core", visible:false, required:false, importable:true, exportable:true, editable:true, sortOrder:11, optionsJson:JSON.stringify(["Vật tư","Cấu kiện","Tiêu đề phần","Tiêu đề hệ","Nhóm công việc","Tổng cộng","Ghi chú"]), systemLocked:true },
  { formKey:"boq", fieldKey:"internalMaterialCode", displayName:"Mã vật tư (nội bộ)", dataType:"text", sourceKind:"custom", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:12, systemLocked:true },
  { formKey:"boq", fieldKey:"systemCode", displayName:"Mã hệ", dataType:"select", sourceKind:"custom", visible:true, required:true, importable:true, exportable:true, editable:true, sortOrder:14, optionsJson:JSON.stringify(["DIEN","CTN","HVAC","ELV","PCCC","KHAC"]), systemLocked:true },
  { formKey:"boq", fieldKey:"subgroupName", displayName:"Nhóm con (tùy chọn)", dataType:"text", sourceKind:"custom", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:16, systemLocked:true },
  { formKey:"boq", fieldKey:"itemType", displayName:"Phân loại trong / ngoài hợp đồng", dataType:"select", sourceKind:"core", visible:true, required:true, importable:true, exportable:true, editable:true, sortOrder:20, optionsJson:JSON.stringify(["Trong HĐ","Ngoài HĐ"]), systemLocked:true },
  { formKey:"boq", fieldKey:"contractMaterialCode", displayName:"Mã vật tư theo Hợp đồng", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:30, systemLocked:true },
  { formKey:"boq", fieldKey:"approvedMaterialCode", displayName:"Mã vật tư được phê duyệt", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:40, systemLocked:true },
  { formKey:"boq", fieldKey:"materialName", displayName:"Tên vật tư", dataType:"text", sourceKind:"core", visible:true, required:true, importable:true, exportable:true, editable:true, sortOrder:50, systemLocked:true },
  { formKey:"boq", fieldKey:"unit", displayName:"Đơn vị", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:60, systemLocked:true },
  { formKey:"boq", fieldKey:"contractQty", displayName:"Khối lượng BOQ/HĐ", dataType:"number", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:70, systemLocked:true },
  { formKey:"boq", fieldKey:"remeasuredQty", displayName:"Khối lượng bóc lại", dataType:"number", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:80, systemLocked:true },
  { formKey:"boq", fieldKey:"unitPrice", displayName:"Đơn giá hợp đồng", dataType:"number", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:82, systemLocked:true },
  { formKey:"boq", fieldKey:"contractValue", displayName:"Thành tiền hợp đồng", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:84, systemLocked:true },
  { formKey:"boq", fieldKey:"note", displayName:"Ghi chú", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:140, systemLocked:true },
];


export const BOQ_PURCHASE_DEFAULT_FIELDS: FormFieldConfig[] = [
  { formKey:"boq_purchase", fieldKey:"lineNo", displayName:"STT theo hợp đồng", dataType:"text", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:10, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"systemCode", displayName:"Mã hệ", dataType:"text", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:20, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"subgroupName", displayName:"Nhóm con", dataType:"text", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:30, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"itemType", displayName:"Trong/Ngoài HĐ", dataType:"text", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:40, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"internalMaterialCode", displayName:"Mã vật tư nội bộ", dataType:"text", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:50, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"contractMaterialCode", displayName:"Mã vật tư theo HĐ", dataType:"text", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:60, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"approvedMaterialCode", displayName:"Mã vật tư được phê duyệt", dataType:"text", sourceKind:"system", visible:false, required:false, importable:false, exportable:true, editable:false, sortOrder:70, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"materialName", displayName:"Tên vật tư", dataType:"text", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:80, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"unit", displayName:"Đơn vị", dataType:"text", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:90, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"contractQty", displayName:"KL BOQ/HĐ", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:100, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"remeasuredQty", displayName:"KL bóc lại / PS đã duyệt", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:110, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"requestedQty", displayName:"Lũy kế đã đề nghị", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:120, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"approvedQty", displayName:"Lũy kế đã duyệt mua", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:130, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"orderedQty", displayName:"Lũy kế PO đã đặt", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:140, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"receivedQty", displayName:"THỰC TẾ đã nhập về dự án", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:150, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"orderedNotReceivedQty", displayName:"Đã đặt nhưng chưa về", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:160, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"stockQty", displayName:"Tồn kho DA (mã vật tư)", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:170, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"remainingContractQty", displayName:"Còn thiếu so BOQ/HĐ", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:180, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"remainingRemeasuredQty", displayName:"Còn thiếu so bóc lại", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:190, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"remainingToBuy", displayName:"Còn phải mua", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:200, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"unitPrice", displayName:"Đơn giá HĐ", dataType:"number", sourceKind:"system", visible:false, required:false, importable:false, exportable:true, editable:false, sortOrder:210, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"contractValue", displayName:"Giá trị BOQ sau điều chỉnh", dataType:"number", sourceKind:"system", visible:false, required:false, importable:false, exportable:true, editable:false, sortOrder:220, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"receivedValue", displayName:"Giá trị đã nhập", dataType:"number", sourceKind:"system", visible:false, required:false, importable:false, exportable:true, editable:false, sortOrder:230, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"remainingValue", displayName:"Giá trị còn thiếu", dataType:"number", sourceKind:"system", visible:false, required:false, importable:false, exportable:true, editable:false, sortOrder:240, systemLocked:true },
  { formKey:"boq_purchase", fieldKey:"assessment", displayName:"Đánh giá", dataType:"text", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:250, systemLocked:true },
];

export const REQUEST_HEADER_DEFAULT_FIELDS: FormFieldConfig[] = [
  { formKey:"request_header", fieldKey:"projectId", displayName:"Dự án", dataType:"select", sourceKind:"core", visible:true, required:false, importable:false, exportable:true, editable:true, sortOrder:10, systemLocked:true },
  { formKey:"request_header", fieldKey:"area", displayName:"Ghi chú", dataType:"text", sourceKind:"core", visible:true, required:false, importable:false, exportable:true, editable:true, sortOrder:30, systemLocked:true },
  { formKey:"request_header", fieldKey:"neededAt", displayName:"Ngày cần", dataType:"date", sourceKind:"core", visible:true, required:true, importable:false, exportable:true, editable:true, sortOrder:40, systemLocked:true },
  { formKey:"request_header", fieldKey:"priority", displayName:"Mức độ", dataType:"select", sourceKind:"core", visible:true, required:false, importable:false, exportable:true, editable:true, sortOrder:50, systemLocked:true },
  { formKey:"request_header", fieldKey:"purpose", displayName:"Phạm vi / Ghi chú chung", dataType:"textarea", sourceKind:"core", visible:true, required:false, importable:false, exportable:true, editable:true, sortOrder:60, systemLocked:true },
];

export const REQUEST_LINE_DEFAULT_FIELDS: FormFieldConfig[] = [
  { formKey:"request_line", fieldKey:"lineNo", displayName:"Thứ tự", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:10, systemLocked:true },
  { formKey:"request_line", fieldKey:"contractLineNo", displayName:"Số thứ tự theo Hợp đồng", dataType:"number", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:20, systemLocked:true },
  { formKey:"request_line", fieldKey:"materialName", displayName:"Tên hàng", dataType:"text", sourceKind:"core", visible:true, required:true, importable:true, exportable:true, editable:true, sortOrder:30, systemLocked:true },
  { formKey:"request_line", fieldKey:"unit", displayName:"Đơn vị", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:40, systemLocked:true },
  { formKey:"request_line", fieldKey:"materialCode", displayName:"Mã sản phẩm", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:50, systemLocked:true },
  { formKey:"request_line", fieldKey:"manufacturer", displayName:"Nhà sản xuất", dataType:"text", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:60, systemLocked:true },
  { formKey:"request_line", fieldKey:"origin", displayName:"Xuất xứ", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:70, systemLocked:true },
  { formKey:"request_line", fieldKey:"approvedSupplier", displayName:"Nhà cung cấp được duyệt", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:80, systemLocked:true },
  { formKey:"request_line", fieldKey:"contractQty", displayName:"KL theo Hợp đồng", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:90, systemLocked:true },
  { formKey:"request_line", fieldKey:"stockQty", displayName:"Tồn kho", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:100, systemLocked:true },
  { formKey:"request_line", fieldKey:"orderedCumulativeQty", displayName:"KL đã mua lũy kế", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:110, systemLocked:true },
  { formKey:"request_line", fieldKey:"quantity", displayName:"Khối lượng đề nghị mua đợt này", dataType:"number", sourceKind:"core", visible:true, required:true, importable:true, exportable:true, editable:true, sortOrder:120, systemLocked:true },
  { formKey:"request_line", fieldKey:"cumulativeAfterRequest", displayName:"Lũy kế khối lượng đợt này", dataType:"number", sourceKind:"system", visible:true, required:false, importable:false, exportable:true, editable:false, sortOrder:130, systemLocked:true },
  { formKey:"request_line", fieldKey:"installationArea", displayName:"Khu vực thi công", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:140, systemLocked:true },
  { formKey:"request_line", fieldKey:"note", displayName:"Ghi chú", dataType:"text", sourceKind:"core", visible:true, required:false, importable:true, exportable:true, editable:true, sortOrder:150, systemLocked:true },
];

export const DEFAULT_FORM_FIELDS: FormFieldConfig[] = [...BOQ_DEFAULT_FIELDS, ...BOQ_PURCHASE_DEFAULT_FIELDS, ...REQUEST_HEADER_DEFAULT_FIELDS, ...REQUEST_LINE_DEFAULT_FIELDS];

function bool(value: unknown, fallback: boolean) { return value === undefined || value === null ? fallback : Boolean(Number(value) || value === true); }
export function mergedFormFields(configs: FormFieldConfig[] | undefined, formKey: FormKey): FormFieldConfig[] {
  const defaults = DEFAULT_FORM_FIELDS.filter((row) => row.formKey === formKey);
  const supplied = (configs || []).filter((row) => row.formKey === formKey);
  const byKey = new Map(defaults.map((row) => [row.fieldKey, { ...row }]));
  supplied.forEach((row) => byKey.set(row.fieldKey, { ...(byKey.get(row.fieldKey) || {}), ...row } as FormFieldConfig));
  return [...byKey.values()].filter((row) => row.active === undefined || bool(row.active, true)).map((row) => ({
    ...row,
    visible: bool(row.visible, true), required: bool(row.required, false), importable: bool(row.importable, true), exportable: bool(row.exportable, true), editable: bool(row.editable, true), systemLocked: bool(row.systemLocked, false), sortOrder: Number(row.sortOrder || 0),
  })).sort((a,b) => Number(a.sortOrder||0)-Number(b.sortOrder||0) || a.displayName.localeCompare(b.displayName,"vi"));
}

export function configuredFormFields(configs: FormFieldConfig[] | undefined, formKey: FormKey): FormFieldConfig[] {
  const supplied=(configs||[]).filter((row)=>row.formKey===formKey && (row.active===undefined || bool(row.active,true)));
  const source=supplied.length?supplied:DEFAULT_FORM_FIELDS.filter((row)=>row.formKey===formKey);
  return source.map((row)=>({
    ...row,
    visible:bool(row.visible,true), required:bool(row.required,false), importable:bool(row.importable,true), exportable:bool(row.exportable,true), editable:bool(row.editable,true), systemLocked:bool(row.systemLocked,false), sortOrder:Number(row.sortOrder||0),
  })).sort((a,b)=>Number(a.sortOrder||0)-Number(b.sortOrder||0)||a.displayName.localeCompare(b.displayName,"vi"));
}

export function fieldConfig(configs: FormFieldConfig[] | undefined, formKey: FormKey, fieldKey: string) {
  return mergedFormFields(configs, formKey).find((row) => row.fieldKey === fieldKey);
}
