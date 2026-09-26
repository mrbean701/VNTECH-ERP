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

import { DataTable, ListToolbar, StatusBadge } from "@/app/components/ui";
import { statusLabel } from "@/lib/labels";
import { Empty, Kpi, UI_NOW_MS, date, format } from "@/lib/ui-shared";
import type { Row } from "@/lib/ui-shared";
import { useState } from "react";
function Requests({ rows, projects, project, onProject, open, inventory, exportRows, onPickShortage }: { rows: Row[]; projects: Row[]; project:string; onProject:(value:string)=>void; open: (name: string, row?: Row) => void; inventory: Row[]; exportRows: () => void; /** MT2-P8-08 (§6.7) — TỰ FILL: mở form «Lập phiếu đề nghị» với vật tư thiếu đã điền sẵn. ⚠️ TÙY CHỌN ⇒ nơi gọi cũ vẫn hợp lệ. */ onPickShortage?: (row: Row) => void }) {
  const [status,setStatus]=useState("ALL"); const [query,setQuery]=useState(""); const [fromDate,setFromDate]=useState(""); const [selectedId,setSelectedId]=useState<string>("");
  // MT2-P8-07 (§6.6) — [Sort] của toolbar PR. ⚠️ PHẢI SẮP XẾP THẬT (⛔ không chỉ hiện nút).
  const [sortKey,setSortKey]=useState("requestedAt");
  // MT2-P8-08 (§6.7) — mở/đóng MODAL danh sách vật tư thiếu (click CARD).
  const [shortageOpen,setShortageOpen]=useState(false);
  const now=UI_NOW_MS; const requestRows=rows.filter(row=>project==="ALL"||row.projectId===project); const pending=requestRows.filter((row)=>row.status==="pending_approval"); const ordering=requestRows.filter((row)=>["approved","po_created","ordered"].includes(String(row.status))); const delivered=requestRows.filter((row)=>Number(row.receivedQty)>0); const proposed=requestRows.filter((row)=>!["completed","cancelled","rejected"].includes(String(row.status)));
  // MT2-P8-08 (§6.7) — «kiểm tồn kho trên TOÀN BỘ các kho trong phạm vi hệ thống».
  // ⛔ BỎ hẳn bộ lọc theo `project` (⚠️ trước đây lọc sai §6.7 ③). ⚠️ backend `inventory` đã trả
  //    ĐÚNG phạm vi (`JOIN warehouses … w.type='site'` — BootstrapDataAdapter:305) ⇒ ⛔ KHÔNG sửa backend (§15).
  // ⛔ KHÔNG `.slice(0,5)`: CARD đếm TOÀN BỘ, MODAL liệt kê TOÀN BỘ (⚠️ chỉ 5 dòng nổi bật là ⛔ đủ §6.7).
  const lowStockHints=(inventory||[]).filter((row)=>Number(row.available??row.balance)>=0&&Number(row.available??row.balance)<Number(row.minStock||0)).sort((a,b)=>(Number(a.minStock||0)-Number(a.available??a.balance))-(Number(b.minStock||0)-Number(b.available??b.balance)));
  const filtered=requestRows.filter((row)=>(status==="ALL"||String(row.status)===status)&&(!fromDate||String(row.requestedAt||"").slice(0,10)>=fromDate)&&(!query||`${row.requestNo} ${row.projectCode} ${row.projectName} ${row.requestedBy}`.toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>{
    // §6.6 — SẮP XẾP THẬT theo `sortKey` (⚠️ giá trị rỗng luôn xuống cuối, không đảo lộn).
    const pick=(row:Row)=>sortKey==="requestNo"?String(row.requestNo||""):sortKey==="status"?String(row.status||""):String(row.requestedAt||"");
    const x=pick(a), y=pick(b);
    if (!x&&!y) return 0; if (!x) return 1; if (!y) return -1;
    return sortKey==="requestedAt" ? y.localeCompare(x) : x.localeCompare(y);
  }); const selected=filtered.find(row=>String(row.id)===selectedId)||filtered[0];
  return <div className="stack module-screen requests-screen approved-module-screen">
    <ListToolbar
      title="PHIẾU ĐỀ NGHỊ MUA HÀNG"
      note="Nhu cầu của dự án/BCH; không gắn Tổ đội tại bước đề nghị."
      count={filtered.length} total={requestRows.length} unit="phiếu"
      search={{ value: query, onChange: setQuery, placeholder: "Tìm số phiếu, vật tư, người tạo..." }}
      filters={[{ key: "status", label: "Trạng thái", value: status, onChange: setStatus, options: [
        { value: "ALL", label: "Tất cả" },
        { value: "pending_approval", label: "Chờ phê duyệt" },
        { value: "returned_to_requester", label: "Trả lại CHT" },
        { value: "approved", label: "Đã duyệt" },
        { value: "completed", label: "Đã giao đủ" },
      ] }]}
      sort={{ value: sortKey, onChange: setSortKey, options: [
        { value: "requestedAt", label: "Ngày đề nghị (mới nhất)" },
        { value: "requestNo", label: "Số phiếu" },
        { value: "status", label: "Trạng thái" },
      ] }}
      extra={<label className="list-toolbar-field"><span>Từ ngày</span><input type="date" value={fromDate} onChange={(event)=>setFromDate(event.target.value)}/></label>}
      actions={<>
        <button className="primary" onClick={()=>open("request")}>＋ Lập phiếu đề nghị</button>
        <button className="secondary" onClick={()=>open("request")}>⇧ Nhập Excel</button>
        <button className="secondary" onClick={exportRows}>⇩ Xuất Excel</button>
        <button className="secondary" disabled={!selected} onClick={()=>selected&&open("detail",selected)}>◉ Xem chi tiết</button>
      </>}
    />
    <div className="global-project-scope-chip">Dự án: {project==="ALL"?"Tất cả":projects.find(row=>row.id===project)?.code||project}</div>
    <div className="kpi-grid"><Kpi icon="MR" label="Đề nghị mua" value={format.format(proposed.length)} note="Nhu cầu đang mở"/><Kpi icon="PD" label="Chờ phê duyệt" value={format.format(pending.length)} note="Theo workflow đã cấu hình" tone="violet"/><Kpi icon="DH" label="Đang đặt hàng" value={format.format(ordering.length)} note="Đã duyệt / đang lập PO" tone="amber"/><Kpi icon="DG" label="Đã giao" value={format.format(delivered.length)} note="Có số lượng thực nhận" tone="green"/></div>
    {/* MT2-P8-08 (§6.7) — CARD dashboard «VẬT TƯ ĐANG THIẾU» (⛔ ĐÃ BỎ dòng `inline-alert`
        «Vật tư đang thiếu tồn trong phạm vi» đúng nguyên văn yêu cầu). ⚠️ `Kpi` ⛔ không có `onClick`
        ⇒ ✅ BỌC trong `<button>` (⛔ KHÔNG sửa `Kpi` — §41). ⚠️ Click ⇒ MODAL danh sách. */}
    {lowStockHints.length>0&&<button type="button" className="requests-shortage-card" onClick={()=>setShortageOpen(true)} title="Xem danh sách vật tư đang thiếu tồn"><Kpi icon="VT" label="VẬT TƯ ĐANG THIẾU" value={format.format(lowStockHints.length)} note={lowStockHints.slice(0,3).map((row)=>String(row.materialCode||"")).join(" · ")||"mã vật tư thiếu"} tone="red"/></button>}
    {shortageOpen&&<div className="overlay" onMouseDown={(event)=>event.target===event.currentTarget&&setShortageOpen(false)}>
      <section className="card requests-shortage-modal" role="dialog" aria-modal="true" aria-label="Vật tư đang thiếu tồn">
        <header><div><small className="document-name">VẬT TƯ ĐANG THIẾU</small><strong>{format.format(lowStockHints.length)} dòng thiếu tồn — toàn bộ kho trong phạm vi hệ thống</strong></div><button type="button" onClick={()=>setShortageOpen(false)} title="Đóng">×</button></header>
        <div className="table-wrap"><table><thead><tr>
          <th>Mã vật tư</th><th>Tên</th><th>Số lượng tồn</th><th>Tồn tối thiểu</th><th>Kho đang thiếu</th><th>Dự án</th><th>BOQ / Hợp đồng</th><th>Lập phiếu</th>
        </tr></thead><tbody>
          {lowStockHints.map((row,index)=><tr key={`${String(row.materialId)}-${String(row.warehouseId)}-${index}`}>
            <td><strong>{String(row.materialCode||"—")}</strong></td>
            <td>{String(row.materialName||"—")}</td>
            <td>{format.format(Number(row.balance||0))} {String(row.unit||"")}</td>
            <td>{format.format(Number(row.minStock||0))} {String(row.unit||"")}</td>
            <td>{String(row.warehouseName||row.warehouseCode||"—")}</td>
            <td>{String(row.projectCode||"—")}</td>
            {/* §6.7 «Project/BOQ/Contract liên quan NẾU CÓ» — ⚠️ payload `inventory` ⛔ KHÔNG có BOQ/contract
                ⇒ ✅ §18 DATA INTEGRITY: hiển thị «—», ⛔ KHÔNG bịa. TODO: bổ sung khi có nguồn. */}
            <td>—</td>
            <td><button type="button" className="export-mini" onClick={()=>{setShortageOpen(false);onPickShortage?onPickShortage(row):open("request");}} title="Lập phiếu đề nghị cho vật tư này">＋ Lập phiếu đề nghị</button></td>
          </tr>)}
        </tbody></table></div>
        <div className="row-actions"><button type="button" className="secondary" onClick={()=>setShortageOpen(false)}>Đóng</button></div>
      </section>
    </div>}
    {/* Bộ lọc đã gộp vào ListToolbar phía trên — không còn card lọc tách rời (§5). */}
    <section className="card request-list-card"><DataTable
      rows={filtered}
      rowKey={(row) => String(row.id)}
      tableClassName="data-table"
      emptyText="Không có phiếu phù hợp bộ lọc."
      onRowClick={(row) => setSelectedId(String(row.id))}
      rowClassName={(row) => (selected && String(selected.id) === String(row.id) ? "selected-row" : "")}
      columns={[
        { key: "pick", header: "", render: (row) => <input type="radio" readOnly checked={Boolean(selected && String(selected.id) === String(row.id))}/> },
        { key: "requestNo", header: "Số phiếu", render: (row) => <strong className="link">{row.requestNo}</strong> },
        { key: "project", header: "Dự án / Khu vực", render: (row) => <><strong>{row.projectCode}</strong><small>{row.projectName}</small></> },
        { key: "requestedBy", header: "Người đề nghị", render: (row) => <>{row.requestedBy}</> },
        { key: "requestedAt", header: "Ngày đề nghị", render: (row) => <>{date(row.requestedAt)}</> },
        { key: "itemCount", header: "Số dòng vật tư", render: (row) => <>{row.itemCount || row.items?.length || 0}</> },
        { key: "status", header: "Trạng thái", render: (row) => <StatusBadge value={statusLabel(row)}/> },
        { key: "sla", header: "SLA", render: (row) => <>{row.neededAt ? date(row.neededAt) : "—"}</> },
        { key: "actions", header: "Hành động", render: (row) => <div className="row-actions"><button className="icon-mini" onClick={(e) => { e.stopPropagation(); open("detail", row); }}>◉</button><button className="icon-mini" onClick={(e) => { e.stopPropagation(); open("detail", row); }}>✎</button></div> },
      ]}
    /><div className="table-pagination functional-summary"><span>Đang hiển thị toàn bộ {filtered.length} kết quả phù hợp bộ lọc.</span></div></section>
    {selected&&<section className="card approved-request-detail"><div className="table-toolbar"><div><strong>Chi tiết phiếu: <span className="link">{selected.requestNo}</span></strong><span>{selected.projectCode} · {selected.projectName}</span></div><div className="row-actions"><button className={selected.status==="returned_to_requester"?"primary":"secondary"} onClick={()=>open("detail",selected)}>{selected.status==="returned_to_requester"?"✎ Sửa / gửi lại":"◉ Xem phiếu"}</button><button className="secondary" onClick={()=>window.print()}>▣ In phiếu</button></div></div><div className="request-detail-summary"><div><small>Người đề nghị</small><strong>{selected.requestedBy}</strong></div><div><small>Ngày đề nghị</small><strong>{date(selected.requestedAt)}</strong></div><div><small>Số dòng vật tư</small><strong>{selected.itemCount||selected.items?.length||0}</strong></div><div><small>Trạng thái</small><StatusBadge value={statusLabel(selected)}/></div></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Mã vật tư</th><th>Tên vật tư</th><th>Đơn vị</th><th>Số lượng đề nghị</th><th>Ghi chú</th></tr></thead><tbody>{(selected.items||[]).slice(0,8).map((item:Row,index:number)=><tr key={item.id||index}><td>{index+1}</td><td>{item.materialCode||"—"}</td><td>{item.materialName||"—"}</td><td>{item.unit||"—"}</td><td>{format.format(Number(item.quantity??item.requestedQty??0))}</td><td>{item.note||"—"}</td></tr>)}{!(selected.items||[]).length&&<tr><td colSpan={6}><Empty text="Phiếu chưa có dòng vật tư."/></td></tr>}</tbody></table></div></section>}
  </div>;
}
export {
  Requests,
};