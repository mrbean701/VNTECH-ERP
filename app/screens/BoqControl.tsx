// PHASE 1 (U-11) — MODULE DÙNG CHUNG TÁCH KHỎI `app/page.tsx`.
//
// Vì sao tách: `app/page.tsx` là MỘT tệp khổng lồ (hơn 4.000 dòng, hơn 250 khai báo top-level).
// Thứ tự cắt ĐÚNG (đã ghi ở `docs/agent-progress/U14-U11-KHAO-SAT.md` mục 2): tách HELPER DÙNG CHUNG trước
// (gỡ chặn IMPORT VÒNG), rồi mới tách từng màn.
//
// ⚠️ ĐIỀU KIỆN AN TOÀN (do `tools/tach-lat-cat-page.mjs` tự kiểm TRƯỚC KHI GHI): mọi tên mà các khối ở đây
// tham chiếu phải thuộc (a) khối cùng nằm trong tệp này, (b) tên có sẵn của JS, (c) tên đến từ `import` của
// `page.tsx` — công cụ SINH LẠI import đó ở đây, hoặc (d) kiểu của React ⇒ `import type … from "react"`.
// Không còn tên nào khác ⇒ KHÔNG thể tạo import vòng.

import { downloadBoqCsv, downloadBoqPdf, downloadBoqXlsx } from "@/lib/boq-export";
import { isBoqTemplateInstructionRow, normalizeBoqRowRole, normalizeBoqType } from "@/lib/boq-normalize";
import { mergedFormFields } from "@/lib/form-fields";
import type { FormFieldConfig } from "@/lib/form-fields";
import { parseSpreadsheetRows } from "@/lib/material-import";
import { BOQ_SYSTEM_CODES, Empty, Kpi, boqControlQty, boqSystemName, date, format, moneyBillion, normalizeBoqHeader, normalizeBoqSystemCode } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { ReactNode, useEffect, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
function BoqControl({ data, project, open, action, canUse }: { data: AppData; project: string; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean>; canUse: boolean }) {
  const selectedProject=project==="ALL"?null:data.projects.find((row)=>row.id===project);
  const contracts=(data.projectContracts||[]).filter((row)=>String(row.projectId)===String(selectedProject?.id||""));
  const contractSignature=contracts.map((row)=>`${row.id}:${row.status}:${row.isPrimary}`).join("|");
  const [contractId,setContractId]=useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{if(!selectedProject){setContractId("");return;}const current=contracts.find((row)=>String(row.id)===String(contractId));if(current)return;const preferred=contracts.find((row)=>Number(row.isPrimary)===1&&String(row.status)!=="inactive")||contracts.find((row)=>String(row.status)!=="inactive")||contracts[0];setContractId(String(preferred?.id||""));},[project,contractSignature]);
  const selectedContract=contracts.find((row)=>String(row.id)===String(contractId))||null;
  const versions=(data.boqVersions||[]).filter((row)=>String(row.projectId)===String(selectedProject?.id||"")&&String(row.contractId)===String(contractId));
  const versionSignature=versions.map((row)=>`${row.id}:${row.active}:${row.status}:${row.versionNo}`).join("|");
  const [boqVersionId,setBoqVersionId]=useState("");
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{const current=versions.find((row)=>String(row.id)===String(boqVersionId));if(current)return;const preferred=versions.find((row)=>Number(row.active)===1)||versions.slice().sort((a,b)=>Number(b.versionNo||0)-Number(a.versionNo||0))[0];setBoqVersionId(String(preferred?.id||""));},[contractId,versionSignature]);
  const selectedVersion=versions.find((row)=>String(row.id)===String(boqVersionId))||null;
  const changeHistory=(data.boqChangeHistory||[]).filter((row)=>String(row.projectId)===String(selectedProject?.id||"")&&String(row.contractId)===String(contractId)&&String(row.boqVersionId)===String(boqVersionId)).slice(0,50);
  const historyActionLabel:Record<string,string>={IMPORT_CREATE:"Nhập dòng",MERGE_UPDATE:"Cập nhật/Merge",UPDATE:"Sửa dòng",ARCHIVE:"Xóa/ẩn dòng",RESTORE:"Khôi phục dòng",DELETE_SAFE:"Xóa an toàn",REPLACE_VERSION:"Thay dữ liệu Version",ARCHIVE_VERSION:"Lưu trữ Version",RESTORE_VERSION:"Khôi phục Version"};
  const operationalBySource = new Map<string, Row>(
    (data.boqItems || [])
      .filter((row) => String(row.projectId) === String(selectedProject?.id || ""))
      .map((row): [string, Row] => [String(row.sourceItemId || ""), row as Row]),
  );
  const sourceRows: Row[] = (data.boqSourceItems || [])
    .filter((row) => String(row.projectId) === String(selectedProject?.id || "") && String(row.contractId) === String(contractId) && String(row.boqVersionId) === String(boqVersionId))
    .map((row): Row => {
      const op: Row = operationalBySource.get(String(row.sourceItemId || row.id)) || {};
      return {
        ...op,
        ...(row as Row),
        id: row.sourceItemId || row.id,
        sourceItemId: row.sourceItemId || row.id,
        projectBoqItemId: row.projectBoqItemId || op.id,
        variationStatus: op.variationStatus || "none",
        variationRef: op.variationRef,
        variationApprovedAt: op.variationApprovedAt,
        receivedQty: op.receivedQty || 0,
        orderedQty: op.orderedQty || 0,
        requestedQty: op.requestedQty || 0,
      };
    })
    .sort((a, b) => Number(a.sourceOrder || 0) - Number(b.sourceOrder || 0));
  const [showDeleted,setShowDeleted]=useState(false);const rows=sourceRows.filter((row)=>showDeleted||Number(row.active)!==0);const structuredRows=withBoqGroupContext(rows);
  const allFields=mergedFormFields(data.formFieldConfigs,"boq").filter((field)=>Boolean(field.visible));const [panelOpen,setPanelOpen]=useState(false);const [density,setDensity]=useState("normal");const [enabled,setEnabled]=useState<Record<string,boolean>>(()=>Object.fromEntries(allFields.map((field)=>[field.fieldKey,true])));const columnWidths=useResizableColumnWidths(`vntech-boq-column-widths-v1:${data.user.id}`);const [search,setSearch]=useState("");const [system,setSystem]=useState("ALL");const [subgroup,setSubgroup]=useState("ALL");const [contractType,setContractType]=useState("ALL");const [collapsedGroups,setCollapsedGroups]=useState<Set<string>>(()=>new Set());const [selectedRows,setSelectedRows]=useState<Set<string>>(()=>new Set());const [importMode,setImportMode]=useState("new_version");const [newVersionCode,setNewVersionCode]=useState("");const fields=allFields.filter((field)=>enabled[field.fieldKey]!==false);
  const systems=[...new Set((data.materialCategories||[]).map((row)=>normalizeBoqSystemCode(row.code)).filter((code)=>BOQ_SYSTEM_CODES.includes(code as typeof BOQ_SYSTEM_CODES[number])))];if(!systems.length)systems.push(...BOQ_SYSTEM_CODES);const groupNames=[...new Set(structuredRows.map((row)=>String(row.__boqGroupName||"")).filter(Boolean))];const subgroups=groupNames;const filtered=structuredRows.filter((row)=>(system==="ALL"||row.__boqHeading||normalizeBoqSystemCode(row.systemCode||row.customFields?.systemCode||"")===system)&&(subgroup==="ALL"||String(row.__boqGroupName||"")===subgroup)&&(contractType==="ALL"||row.__boqHeading||(contractType==="contract"?row.itemType!=="outside_contract":row.itemType==="outside_contract"))&&(!search||row.__boqHeading||normalizeBoqHeader(`${row.materialCode||""} ${row.materialName||""} ${row.contractLineRef||""} ${row.contractMaterialCode||""}`).includes(normalizeBoqHeader(search))));const visibleRows=filtered.filter((row)=>row.__boqHeading||!collapsedGroups.has(String(row.__boqGroupName||"")));
  const operative=rows.filter(row=>Number(row.active)!==0&&["material","component"].includes(String(row.rowRole||"material")));const totalValue=operative.reduce((sum,row)=>sum+boqControlQty(row)*Number(row.unitPrice||0),0);const inValue=operative.filter(row=>row.itemType!=="outside_contract").reduce((sum,row)=>sum+boqControlQty(row)*Number(row.unitPrice||0),0);const outValue=operative.filter(row=>row.itemType==="outside_contract").reduce((sum,row)=>sum+boqControlQty(row)*Number(row.unitPrice||0),0);
  const activeVisibleIds=visibleRows.filter((row)=>Number(row.active)!==0).map((row)=>String(row.sourceItemId||row.id));const allVisibleSelected=activeVisibleIds.length>0&&activeVisibleIds.every((id)=>selectedRows.has(id));
  async function importBoq(file?:File){if(!file||!selectedProject||!selectedContract)return;try{const parsed=mapBoqRows(await parseSpreadsheetRows(file),data.materials,data.formFieldConfigs);if(importMode!=="new_version"&&!selectedVersion)throw new Error("Hãy chọn BOQ Version trước khi cập nhật/thay thế.");let confirmText="";if(importMode==="replace_version"){const expected=`THAY ${String(selectedVersion?.versionCode||"")}`;confirmText=window.prompt(`Thay toàn bộ dữ liệu trong ${selectedVersion?.versionCode}? Chỉ thực hiện nếu phiên bản chưa phát sinh ĐNMH/PO/Nhập kho.\nNhập ${expected} để xác nhận:`)||"";if(confirmText!==expected)return;}else if(!window.confirm(importMode==="new_version"?`Nhập ${parsed.length} dòng thành BOQ Version MỚI của hợp đồng ${selectedContract.contractNo}? BOQ cũ vẫn được giữ nguyên.`:importMode==="append"?`Thêm ${parsed.length} dòng vào ${selectedVersion?.versionCode}?`:`Cập nhật/Merge ${parsed.length} dòng vào ${selectedVersion?.versionCode}? Hệ thống ưu tiên Mã dòng HĐ/Mã BOQ rồi STT nguồn.`))return;await action("replace_boq_items",{projectId:selectedProject.id,contractId:selectedContract.id,boqVersionId:selectedVersion?.id,rows:parsed,sourceFileName:file.name,importMode,versionCode:newVersionCode||undefined,confirmText,reason:`Import ${file.name}`});setSelectedRows(new Set());}catch(error){window.alert(error instanceof Error?error.message:"Không đọc được file BOQ.");}}
  async function bulk(mode:"archive"|"restore"){const ids=[...selectedRows];if(!ids.length)return;if(mode==="archive"&&!window.confirm(`Xóa/ẩn ${ids.length} dòng BOQ đã chọn? Dữ liệu vẫn được lưu lịch sử và có thể khôi phục.`))return;if(await action("bulk_boq_item_action",{sourceItemIds:ids,mode,reason:"Thao tác hàng loạt tại BOQ"}))setSelectedRows(new Set());}
  async function clearVersion(mode:"archive"|"restore"|"purge"){if(!selectedProject||!selectedContract||!selectedVersion)return;if(mode==="archive"&&!window.confirm(`XÓA TOÀN BỘ dữ liệu hiển thị của ${selectedContract.contractNo} · ${selectedVersion.versionCode}? Hệ thống sẽ lưu trữ để có thể khôi phục.`))return;let confirmText="";if(mode==="purge"){const expected=`XOA ${selectedVersion.versionCode}`;confirmText=window.prompt(`XÓA VĨNH VIỄN ${selectedVersion.versionCode} chỉ được phép nếu chưa phát sinh nghiệp vụ.\nNhập ${expected} để xác nhận:`)||"";if(confirmText!==expected)return;}await action("clear_boq_version",{projectId:selectedProject.id,contractId:selectedContract.id,boqVersionId:selectedVersion.id,mode,confirmText,reason:"Quản trị BOQ từ giao diện"});setSelectedRows(new Set());}
  async function deleteContract(){if(!selectedContract)return;const expected=`XOA ${selectedContract.contractNo}`;const confirmText=window.prompt(`Chỉ xóa được hợp đồng sau khi đã xóa vĩnh viễn toàn bộ BOQ Version và không còn giao dịch.\nNhập ${expected} để xác nhận:`)||"";if(confirmText!==expected)return;await action("delete_project_contract",{contractId:selectedContract.id,confirmText});}
  return <div className={`boq-layout baseline-screen approved-boq-screen density-${density} ${panelOpen?"has-panel":"no-panel"}`}><div className="boq-main stack">
    <section className="boq-scope-panel"><header><div><strong>PHẠM VI BOQ</strong><span>{selectedProject?`${selectedProject.code} · ${selectedProject.name}`:"Hãy chọn một dự án ở bộ lọc phía trên"}</span></div><div className="boq-scope-actions">{canUse&&selectedProject&&<button className="secondary" onClick={()=>open("projectContract",{projectId:selectedProject.id})}>＋ HỢP ĐỒNG</button>}{canUse&&selectedContract&&<button className="secondary" onClick={()=>open("projectContract",selectedContract)}>SỬA HỢP ĐỒNG</button>}{canUse&&selectedContract&&<button className="secondary" onClick={()=>action("set_project_contract_status",{contractId:selectedContract.id,active:String(selectedContract.status)==="inactive"})}>{String(selectedContract.status)==="inactive"?"KHÔI PHỤC HỢP ĐỒNG":"NGỪNG HỢP ĐỒNG"}</button>}{canUse&&selectedContract&&<button className="secondary danger" onClick={()=>void deleteContract()}>XÓA HỢP ĐỒNG</button>}</div></header><div className="approved-boq-selectors"><label><span>Hợp đồng *</span><select value={contractId} onChange={(e)=>setContractId(e.target.value)} disabled={!selectedProject}><option value="">Chọn hợp đồng</option>{contracts.map((row)=><option key={row.id} value={row.id}>{row.contractNo} · {row.contractName}{String(row.status)==="inactive"?" (đã ngừng)":""}</option>)}</select></label><label><span>BOQ Version *</span><select value={boqVersionId} onChange={(e)=>setBoqVersionId(e.target.value)} disabled={!contractId}><option value="">Chọn phiên bản</option>{versions.map((row)=><option key={row.id} value={row.id}>{row.versionCode||`V${row.versionNo}`} · {row.versionName||"BOQ"} · {row.status}{Number(row.active)===1?" · hiện hành":""}</option>)}</select></label></div><div className="boq-scope-create">{canUse&&selectedContract&&<button className="primary" onClick={()=>open("boqVersion",{projectId:selectedProject?.id,contractId:selectedContract.id})}>＋ BOQ VERSION</button>}{canUse&&selectedVersion&&<button className="secondary" onClick={()=>open("boqItem",{projectId:selectedProject?.id,contractId:selectedContract?.id,boqVersionId:selectedVersion.id})}>＋ DÒNG BOQ</button>}</div></section>
    <div className="inline-alert boq-source-alert"><b>ⓘ BOQ được quản lý theo Dự án → Hợp đồng → BOQ Version.</b><span>Nhập hợp đồng/phiên bản mới không ghi đè dữ liệu cũ. Tên vật tư pháp lý có thể sửa khi nhập sai nhưng mọi thay đổi đều lưu lịch sử.</span></div>
    {selectedVersion&&<details className="boq-history-panel"><summary><span>LỊCH SỬ THAY ĐỔI · {selectedVersion.versionCode}</span><b>{changeHistory.length} bản ghi gần nhất</b></summary><div className="table-wrap"><table><thead><tr><th>Thời gian</th><th>Thao tác</th><th>Dòng nguồn</th><th>Người thực hiện</th><th>Lý do</th></tr></thead><tbody>{changeHistory.map((row)=><tr key={row.id}><td>{date(row.createdAt)}</td><td><strong>{historyActionLabel[String(row.actionType)]||row.actionType}</strong></td><td>{row.sourceItemId||"Toàn phiên bản"}</td><td>{row.actorName||row.actorUserId||"—"}</td><td>{row.reason||"—"}</td></tr>)}{!changeHistory.length&&<tr><td colSpan={5}><Empty text="Phiên bản chưa có thay đổi được ghi nhận."/></td></tr>}</tbody></table></div></details>}
    <div className="kpi-grid"><Kpi icon="HD" label="Tổng giá trị hợp đồng" value={moneyBillion(totalValue)} note={selectedContract?.contractNo||"Chưa chọn hợp đồng"}/><Kpi icon="BOQ" label="Số dòng BOQ" value={format.format(rows.filter(r=>Number(r.active)!==0).length)} note={`${operative.length} dòng vật tư/cấu kiện`} tone="green"/><Kpi icon="TH" label="Trong hợp đồng" value={moneyBillion(inValue)} note={totalValue?`${(inValue/totalValue*100).toFixed(2)}% tổng giá trị HĐ`:"0%"} tone="violet"/><Kpi icon="NH" label="Ngoài hợp đồng" value={moneyBillion(outValue)} note={totalValue?`${(outValue/totalValue*100).toFixed(2)}% tổng giá trị HĐ`:"0%"} tone="amber"/></div>
    <div className="screen-actions boq-actions">{canUse&&selectedContract&&<><select value={importMode} onChange={(e)=>setImportMode(e.target.value)} title="Chế độ import BOQ"><option value="new_version">Nhập thành BOQ Version mới</option><option value="append" disabled={!selectedVersion}>Thêm dòng vào Version đang chọn</option><option value="merge" disabled={!selectedVersion}>Cập nhật/Merge Version đang chọn</option><option value="replace_version" disabled={!selectedVersion}>Thay Version đang chọn</option></select>{importMode==="new_version"&&<input value={newVersionCode} onChange={(e)=>setNewVersionCode(e.target.value)} placeholder="Mã Version, ví dụ V2 (tùy chọn)"/>}<label className="primary file-inline">＋ NHẬP BOQ/HĐ<input type="file" accept=".xlsx,.csv" onChange={(e)=>{void importBoq(e.target.files?.[0]);e.target.value="";}}/></label></>}<BoqExportButtons data={data} rows={rows.filter(r=>Number(r.active)!==0)} project={project}/><button className="secondary" onClick={()=>setPanelOpen((v)=>!v)}>▦ HIỂN THỊ CỘT</button><label className="secondary"><input type="checkbox" checked={showDeleted} onChange={(e)=>setShowDeleted(e.target.checked)}/> HIỆN ĐÃ XÓA</label>{selectedRows.size>0&&<><button className="secondary danger" onClick={()=>void bulk("archive")}>XÓA {selectedRows.size} DÒNG</button><button className="secondary" onClick={()=>void bulk("restore")}>KHÔI PHỤC ĐÃ CHỌN</button></>}{selectedVersion&&canUse&&<>{String(selectedVersion.status)!=="archived"&&<button className="secondary danger" onClick={()=>void clearVersion("archive")}>XÓA TOÀN BỘ VERSION</button>}{String(selectedVersion.status)==="archived"&&<><button className="secondary" onClick={()=>void clearVersion("restore")}>KHÔI PHỤC VERSION</button><button className="secondary danger" onClick={()=>void clearVersion("purge")}>XÓA VĨNH VIỄN VERSION</button></>}</>}{groupNames.length>0&&<><button className="secondary" onClick={()=>setCollapsedGroups(new Set(groupNames))}>Thu gọn nhóm</button><button className="secondary" onClick={()=>setCollapsedGroups(new Set())}>Mở tất cả</button></>}<button className="secondary" onClick={()=>{setEnabled(Object.fromEntries(allFields.map((field)=>[field.fieldKey,true])));setDensity("normal");setCollapsedGroups(new Set());columnWidths.reset();}}>↻ KHÔI PHỤC MẶC ĐỊNH</button></div>
    {!contracts.length&&selectedProject&&<div className="inline-alert"><b>Dự án chưa có hợp đồng.</b> Tạo Hợp đồng trước khi nhập BOQ để không trộn dữ liệu giữa nhiều hợp đồng.</div>}
    <section className="card boq-filter-card"><div className="filter-grid boq-filter-grid"><label><span>Hệ M&E</span><select value={system} onChange={(e)=>setSystem(e.target.value)}><option value="ALL">Tất cả</option>{systems.map((code)=><option key={code} value={code}>{code} · {boqSystemName(code)}</option>)}</select></label><label><span>Trong / Ngoài HĐ</span><select value={contractType} onChange={e=>setContractType(e.target.value)}><option value="ALL">Tất cả</option><option value="contract">Trong HĐ</option><option value="outside">Ngoài HĐ</option></select></label><label><span>Nhóm con</span><select value={subgroup} onChange={(e)=>setSubgroup(e.target.value)}><option value="ALL">Tất cả</option>{subgroups.map((name)=><option key={name}>{name}</option>)}</select></label><label><span>Tìm kiếm</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm mã vật tư, tên vật tư, mã HĐ..."/></label></div></section>
    <section className="card boq-workspace" data-contract="VNTECH_BOQ_HEADING_MATCHING_EXCLUSION_V1"><div className="table-wrap boq-table-wrap"><table className="baseline-table boq-tree-table resizable-data-table"><colgroup><col style={{width:42}}/>{fields.map(field=><col key={field.fieldKey} style={{width:columnWidths.widthFor(field.fieldKey,field.fieldKey==="materialName"?260:field.fieldKey==="sourceOrder"?92:150)}}/>)}<col style={{width:130}}/></colgroup><thead><tr><th><input type="checkbox" checked={allVisibleSelected} onChange={(e)=>setSelectedRows((current)=>{const next=new Set(current);activeVisibleIds.forEach((id)=>e.target.checked?next.add(id):next.delete(id));return next;})} aria-label="Chọn tất cả dòng đang hiển thị"/></th>{fields.map((field)=><th key={field.fieldKey} data-col-key={field.fieldKey}><span>{field.displayName}{field.required?" *":""}</span><i className="column-resize-handle" title="Kéo để đổi độ rộng · double-click để tự căn" onMouseDown={event=>columnWidths.resizeStart(event,field.fieldKey,field.fieldKey==="materialName"?260:150)} onDoubleClick={event=>columnWidths.autoFit(event,field.fieldKey,[field.displayName,...filtered.slice(0,250).map(row=>boqCellValue(row,field.fieldKey))],field.fieldKey==="materialName"?260:150)}/></th>)}<th>THAO TÁC</th></tr></thead><tbody>{visibleRows.map((row)=>{const role=String(row.rowRole||"material"),heading=Boolean(row.__boqHeading),groupName=String(row.__boqGroupName||""),id=String(row.sourceItemId||row.id),active=Number(row.active)!==0;return <tr key={id} className={`boq-row-${role} ${active?"":"is-hidden"}`} onClick={heading?()=>setCollapsedGroups((current)=>{const next=new Set(current);if(next.has(groupName))next.delete(groupName);else next.add(groupName);return next;}):undefined}><td onClick={(e)=>e.stopPropagation()}><input type="checkbox" checked={selectedRows.has(id)} onChange={(e)=>setSelectedRows((current)=>{const next=new Set(current);if(e.target.checked)next.add(id);else next.delete(id);return next;})}/></td>{fields.map((field)=><td key={field.fieldKey} data-col-key={field.fieldKey}>{field.fieldKey==="materialName"?<><strong>{heading?`${collapsedGroups.has(groupName)?"▶":"▼"} ${boqCellValue(row,field.fieldKey)}`:boqCellValue(row,field.fieldKey)}</strong>{["material","component"].includes(role)&&<small>{row.specification||row.standardMaterialName||""}</small>}</>:field.fieldKey==="sourceOrder"?<strong>{boqCellValue(row,field.fieldKey)}</strong>:boqCellValue(row,field.fieldKey) as ReactNode}</td>)}<td onClick={(e)=>e.stopPropagation()}><div className="row-actions"><button className="export-mini" onClick={()=>open("boqItem",row)}>Sửa</button>{active?<button className="export-mini danger" onClick={()=>window.confirm(`Xóa dòng BOQ ${row.contractLineRef||row.sourceOrder}?`)&&action("delete_boq_item",{sourceItemId:id,reason:"Người dùng xóa dòng nhập sai"})}>Xóa</button>:<button className="export-mini" onClick={()=>action("set_boq_item_status",{sourceItemId:id,active:1,reason:"Khôi phục dòng BOQ"})}>Khôi phục</button>}</div></td></tr>})}{!visibleRows.length&&<tr><td colSpan={Math.max(3,fields.length+2)}><Empty text={selectedVersion?"Chưa có BOQ/Hợp đồng cho Contract/Version đang chọn.":"Hãy chọn Hợp đồng và BOQ Version."}/></td></tr>}</tbody></table></div><div className="boq-pagination functional-summary"><span>Đang hiển thị {visibleRows.length}/{filtered.length} dòng · Contract {selectedContract?.contractNo||"—"} · Version {selectedVersion?.versionCode||"—"}. Dòng tiêu đề/ĐVT trống không tham gia Material Matching.</span></div></section>
    </div>{panelOpen&&<aside className="boq-column-panel user-display-panel"><header><h2>HIỂN THỊ CỘT</h2><button onClick={()=>setPanelOpen(false)}>×</button></header><p className="panel-note">Cá nhân hóa hiển thị của tài khoản. Tên/cấu trúc cột chỉ Quản trị viên được thay đổi tại Cấu hình danh mục.</p><h3>CỘT ĐƯỢC HIỂN THỊ</h3><div className="column-list">{allFields.map((field)=><label key={field.fieldKey}><span className="drag-handle">⠿</span><input type="checkbox" checked={enabled[field.fieldKey]!==false} onChange={(e)=>setEnabled((cur)=>({...cur,[field.fieldKey]:e.target.checked}))}/><span>{field.displayName}</span></label>)}</div><h3>MẬT ĐỘ DÒNG</h3><div className="density-options"><div><button className={density==="comfortable"?"active":""} onClick={()=>setDensity("comfortable")}>Thoáng</button><button className={density==="normal"?"active":""} onClick={()=>setDensity("normal")}>Vừa</button><button className={density==="compact"?"active":""} onClick={()=>setDensity("compact")}>Gọn</button></div></div><footer><button className="secondary" onClick={()=>setEnabled(Object.fromEntries(allFields.map((field)=>[field.fieldKey,true])))}>KHÔI PHỤC</button><button className="primary" onClick={()=>setPanelOpen(false)}>ÁP DỤNG</button></footer></aside>}</div>;
}


function BoqExportButtons({ data, rows, project, mode="boq" }: { data: AppData; rows: Row[]; project: string; mode?:"boq"|"boq_purchase" }) { const selected = project === "ALL" ? null : data.projects.find((item) => item.id === project); const doc = { projectCode: selected?.code, projectName: selected?.name, contractNo: selected?.contractNo, rows: boqExportRows(rows), fieldConfigs: data.formFieldConfigs, formKey:mode }; return <div className="row-actions"><button className="export-mini" onClick={() => downloadBoqXlsx(doc)}>Excel</button><button className="export-mini" onClick={() => downloadBoqCsv(doc)}>CSV</button><button className="export-mini" onClick={() => downloadBoqPdf(doc)}>PDF</button></div>; }

function boqCellValue(row: Row, key: string) {
  const custom = row.customFields && typeof row.customFields === "object" ? row.customFields as Row : {};
  switch (key) {
    case "sourceOrder": return row.sourceOrder || row.lineNo || "—";
    case "lineNo": return row.contractLineRef || row.lineNo || "—";
    case "rowRole": return row.rowRole === "section" ? "Tiêu đề phần" : row.rowRole === "system" ? "Tiêu đề hệ" : row.rowRole === "group" ? "Nhóm công việc" : row.rowRole === "component" ? "Cấu kiện" : row.rowRole === "subtotal" ? "Tổng cộng" : row.rowRole === "note" ? "Ghi chú" : "Vật tư";
    case "itemType": return row.itemType === "outside_contract" ? "Ngoài HĐ" : "Trong HĐ";
    case "internalMaterialCode": return row.internalMaterialCode || custom.internalMaterialCode || row.materialCode || "—";
    case "systemCode": return normalizeBoqSystemCode(row.systemCode || custom.systemCode || "KHAC");
    case "subgroupName": return row.subgroupName || custom.subgroupName || "—";
    case "contractMaterialCode": return row.contractMaterialCode || row.materialCode || "—";
    case "approvedMaterialCode": return row.approvedMaterialCode || row.materialCode || "—";
    case "materialName": return row.materialName || row.description || "—";
    case "unit": return row.unit || "—";
    case "contractQty": return format.format(Number(row.contractQty || 0));
    case "remeasuredQty": return format.format(Number(row.remeasuredQty || 0));
    case "unitPrice": return new Intl.NumberFormat("vi-VN").format(Number(row.unitPrice || 0));
    case "contractValue": return new Intl.NumberFormat("vi-VN").format(boqControlQty(row)*Number(row.unitPrice||0));
    case "receivedValue": return new Intl.NumberFormat("vi-VN").format(Math.min(boqControlQty(row),Number(row.receivedQty||0))*Number(row.unitPrice||0));
    case "remainingValue": return new Intl.NumberFormat("vi-VN").format(Math.max(0,boqControlQty(row)-Number(row.receivedQty||0))*Number(row.unitPrice||0));
    case "requestedQty": return format.format(Number(row.requestedQty || 0));
    case "approvedQty": return format.format(Number(row.approvedQty || 0));
    case "orderedQty": return format.format(Number(row.orderedQty || 0));
    case "receivedQty": return format.format(Number(row.receivedQty || 0));
    case "remainingContractQty": return format.format(Math.max(0,Number(row.contractQty||0)-Number(row.receivedQty||0)));
    case "remainingRemeasuredQty": return format.format(Math.max(0,Number(row.remeasuredQty||0)-Number(row.receivedQty||0)));
    case "remainingToBuy": return format.format(Math.max(0,boqControlQty(row)-Number(row.orderedQty||0)));
    case "assessment": return boqAssessment(row);
    case "varianceContract": { const v = Number(row.varianceContract ?? (Number(row.receivedQty || 0) - Number(row.contractQty || 0))); return `${v > 0 ? "+" : ""}${format.format(v)}`; }
    case "varianceRemeasured": { const v = Number(row.varianceRemeasured ?? (Number(row.receivedQty || 0) - Number(row.remeasuredQty || 0))); return `${v > 0 ? "+" : ""}${format.format(v)}`; }
    case "issuedQty": return format.format(Number(row.issuedQty || 0));
    case "stockQty": return format.format(Number(row.stockQty || 0));
    case "orderedNotReceivedQty": return format.format(Number(row.orderedNotReceivedQty ?? Math.max(0, Number(row.orderedQty || 0) - Number(row.receivedQty || 0))));
    case "note": return row.note || "—";
    default: return custom[key] ?? row[key] ?? "—";
  }
}

function mapBoqRows(rows: string[][], _materials: Row[], configs?: FormFieldConfig[]) {
  // BOQ source-ingestion contract:
  // - Tên vật tư theo HĐ được giữ nguyên ký tự/nội dung từ file nguồn.
  // - Không suy diễn hệ/nhóm/quy cách/alias/mã gốc/tên chuẩn khi import.
  // - Mô tả/đầu mục công việc có thể trống; AI matching là lớp riêng sau import.
  const fields=mergedFormFields(configs,"boq").filter((f)=>Boolean(f.importable));
  const aliases:Record<string,string[]>={
    sourceOrder:["thu tu nguon","thu tu excel","source order"], lineNo:["stt theo hop dong","stt hop dong","stt"], rowRole:["loai dong","vai tro dong","row role"], internalMaterialCode:["ma vat tu noi bo","ma noi bo","ma vt noi bo","ma vat tu goc","ma vt goc"], systemCode:["ma he","he me","he m e","he"], subgroupName:["nhom con","nhom hang muc","nhom vat tu","nhom"], itemType:["phan loai trong ngoai hop dong","phan loai","trong ngoai hop dong","loai"],
    contractMaterialCode:["ma vat tu theo hop dong","ma vt theo hop dong","ma vat tu hop dong","ma so"], approvedMaterialCode:["ma vat tu duoc phe duyet","ma vt duoc phe duyet","ma san pham"],
    materialName:["ten vat tu theo hd","ten vat tu theo hop dong","ten vat tu","ten hang","ten vat tu dau viec"], unit:["don vi","dvt","don vi tinh"], contractQty:["khoi luong boq hd","khoi luong boq","kl boq hd","kl hop dong","kl theo hop dong","khoi luong hop dong","khoi luong"],
    remeasuredQty:["khoi luong boc lai","kl boc lai","boc lai","khoi luong phat sinh","kl thuc te","khoi luong thuc te"], unitPrice:["don gia hop dong","don gia hd","don gia"], note:["ghi chu","ly do phat sinh","note"],
  };
  const fa=(f:FormFieldConfig)=>[normalizeBoqHeader(f.displayName),...(aliases[String(f.fieldKey)]||[])].filter(Boolean);
  const headerIndex=rows.findIndex((row)=>{const h=row.map(normalizeBoqHeader);return fields.some((f)=>fa(f).some((a)=>h.includes(a)));});
  if(headerIndex<0) throw new Error("Không tìm thấy dòng tiêu đề BOQ/Hợp đồng.");
  const headers=rows[headerIndex].map(normalizeBoqHeader); const indexes:Row={}; fields.forEach((f)=>indexes[f.fieldKey]=headers.findIndex((h)=>fa(f).includes(h)));
  // Không áp required cấu hình lên các cột mô tả/đầu mục khi import nguồn. File có cột nào thì lưu đúng cột đó.
  const result:Row[]=[]; const errors:string[]=[];
  const parse=(v:string)=>{if(!v)return null;const n=Number(v.replace(/\s/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",","."));return Number.isFinite(n)?n:null;};
  rows.slice(headerIndex+1).forEach((row,offset)=>{
    if(isBoqTemplateInstructionRow(row))return;
    const excelLine=headerIndex+offset+2; const getRaw=(key:string)=>Number(indexes[key])>=0?String(row[Number(indexes[key])]??""):""; const get=(key:string)=>getRaw(key).trim();
    const sourceValues:Row={}; fields.forEach((f)=>{if(Number(indexes[f.fieldKey])>=0)sourceValues[f.fieldKey]=String(row[Number(indexes[f.fieldKey])]??"");});
    if(!Object.values(sourceValues).some((v)=>String(v??"").trim()))return;
    const customFields:Row={}; fields.filter((f)=>String(f.sourceKind)==="custom"&&Number(indexes[f.fieldKey])>=0).forEach((f)=>{const value=String(row[Number(indexes[f.fieldKey])]??"");if(value!=="")customFields[f.fieldKey]=value;});
    const cqRaw=get("contractQty"),rqRaw=get("remeasuredQty"),unitPriceRaw=get("unitPrice");const contractQty=parse(cqRaw)??0,remeasuredQty=parse(rqRaw)??contractQty,parsedUnitPrice=parse(unitPriceRaw);
    if(contractQty<0||remeasuredQty<0)errors.push(`Dòng ${excelLine}: khối lượng không được âm.`);if(unitPriceRaw&&(parsedUnitPrice===null||parsedUnitPrice<0))errors.push(`Dòng ${excelLine}: Đơn giá hợp đồng không hợp lệ.`);
    const explicitRowRole=get("rowRole"); const sourceName=getRaw("materialName"),sourceUnit=getRaw("unit"); const rowRole=explicitRowRole?normalizeBoqRowRole(explicitRowRole):(!sourceName.trim()?"note":!sourceUnit.trim()?"group":"material");
    const explicitItemType=get("itemType"); const itemType=explicitItemType?normalizeBoqType(explicitItemType):"contract";
    const internalMaterialCode=get("internalMaterialCode").toUpperCase();
    result.push({
      sourceOrder:parse(get("sourceOrder"))??(offset+1), lineNo:get("lineNo"), contractLineRef:get("lineNo"), rowRole, sourceRow:excelLine,
      internalMaterialCode, systemCode:getRaw("systemCode"), subgroupName:getRaw("subgroupName"), itemType,
      contractMaterialCode:getRaw("contractMaterialCode"), approvedMaterialCode:getRaw("approvedMaterialCode"),
      // GIỮ NGUYÊN TÊN THEO HĐ: không trim/normalize/replace/fallback từ Material Master.
      materialName:getRaw("materialName"), unit:getRaw("unit"), contractQty, remeasuredQty, unitPrice:parsedUnitPrice??0, note:getRaw("note"),
      materialId:undefined, materialCode:internalMaterialCode||"", customFields, rawSource:sourceValues
    });
  });
  if(!result.length) throw new Error("File BOQ/Hợp đồng không có dòng dữ liệu."); if(errors.length)throw new Error(errors.slice(0,15).join("\n")); return result;
}

function useResizableColumnWidths(storageKey:string) {
  const [widths,setWidths]=useState<Record<string,number>>(()=>{if(typeof window==="undefined")return {};try{const raw=window.localStorage.getItem(storageKey);const parsed=raw?JSON.parse(raw):{};return parsed&&typeof parsed==="object"?parsed:{};}catch{return {};}});
  useEffect(()=>{try{window.localStorage.setItem(storageKey,JSON.stringify(widths));}catch{/* Trình duyệt có thể chặn localStorage. */}},[storageKey,widths]);
  const widthFor=(key:string,fallback=150)=>Math.max(72,Math.min(520,Number(widths[key]||fallback)));
  const resizeStart=(event:ReactMouseEvent<HTMLElement>,key:string,fallback=150)=>{event.preventDefault();event.stopPropagation();const startX=event.clientX,startWidth=widthFor(key,fallback);const move=(e:MouseEvent)=>setWidths(current=>({...current,[key]:Math.max(72,Math.min(520,startWidth+e.clientX-startX))}));const stop=()=>{window.removeEventListener("mousemove",move);window.removeEventListener("mouseup",stop);};window.addEventListener("mousemove",move);window.addEventListener("mouseup",stop);};
  const autoFit=(event:ReactMouseEvent<HTMLElement>,key:string,samples:unknown[],fallback=150)=>{event.preventDefault();event.stopPropagation();const maxChars=Math.max(...samples.map(value=>String(value??"").replace(/\s+/g," ").length),8);setWidths(current=>({...current,[key]:Math.max(80,Math.min(420,Math.round(maxChars*7.4+34)||fallback))}));};
  const reset=()=>{setWidths({});try{window.localStorage.removeItem(storageKey);}catch{/* ignore */}};
  return {widthFor,resizeStart,autoFit,reset,widths};
}


function withBoqGroupContext(rows: Row[]): Array<Row & { __boqGroupName: string; __boqHeading: boolean }> {
  let currentGroup = "";
  return rows.map((row) => {
    const role = String(row.rowRole || "material");
    const heading = ["section", "system", "group", "heading"].includes(role);
    const explicitGroup = String(row.subgroupName || row.customFields?.subgroupName || "").trim();
    if (heading) currentGroup = explicitGroup || String(row.materialName || row.contractMaterialName || row.description || "").trim();
    else if (explicitGroup) currentGroup = explicitGroup;
    return { ...row, __boqGroupName: currentGroup, __boqHeading: heading };
  });
}

function boqExportRows(rows: Row[]) { return rows.map((row) => { const controlQty = boqControlQty(row); return { ...row, variationQty: boqVariationQty(row), controlQty, remainingToBuy: controlQty - Number(row.orderedQty || 0), purchaseVariance: Number(row.orderedQty || 0) - controlQty, assessment: boqAssessment(row) }; }); }

function boqAssessment(row: Row) { const control = boqControlQty(row); const ordered = Number(row.orderedQty || 0); const variation = boqVariationQty(row); if ((row.itemType === "outside_contract" || Math.abs(variation) > 1e-9) && row.variationStatus === "pending") return "Có phát sinh chưa duyệt"; if (row.variationStatus === "rejected" && ordered > control + 1e-9) return "PO vượt phần được duyệt"; if (ordered > control + 1e-9) return "Mua vượt"; if (Math.abs(ordered - control) <= 1e-9 && control > 0) return "Đủ theo BOQ sau ĐC"; if (ordered < control - 1e-9) return "Còn thiếu"; return "Theo dõi"; }

function boqVariationQty(row: Row) { return row.itemType === "outside_contract" ? Number(row.remeasuredQty || 0) : Number(row.remeasuredQty || 0) - Number(row.contractQty || 0); }
export {
  BoqControl,
  BoqExportButtons,
  boqAssessment,
  boqCellValue,
  boqExportRows,
  boqVariationQty,
  mapBoqRows,
  useResizableColumnWidths,
  withBoqGroupContext,
};