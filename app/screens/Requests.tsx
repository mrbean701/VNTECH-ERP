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

import { DataTable, ListToolbar, PermissionGuard, StatusBadge } from "@/app/components/ui";
import { statusLabel } from "@/lib/labels";
import { Empty, Kpi, UI_NOW_MS, date, format } from "@/lib/ui-shared";
import type { Row } from "@/lib/ui-shared";
import { useState } from "react";
/** MỐC 121 (vòng 215 · mục 2.6) — capability của môn `purchasing`, TÁCH RIÊNG vì action `create_po`
 *  được `ActionRbacRegistry:88/362` gắn vào module `purchasing` (⛔ KHÔNG phải `requests`) ⇒ `permission`
 *  ở trên không dùng được cho nút này. ⛔ UI KHÔNG thay thế cổng RBAC thật ở backend. */
function Requests({ rows, projects, project, onProject, open, inventory, exportRows, onPickShortage, permission, poPermission }: { rows: Row[]; projects: Row[]; project:string; onProject:(value:string)=>void; open: (name: string, row?: Row) => void; inventory: Row[]; exportRows: () => void; /** MT2-P8-08 (§6.7) — TỰ FILL: mở form «Lập phiếu đề nghị» với vật tư thiếu đã điền sẵn. ⚠️ TÙY CHỌN ⇒ nơi gọi cũ vẫn hợp lệ. */ onPickShortage?: (row: Row) => void; /** MT3 ma trận #9 — capability của môn `requests`. ⛔ UI KHÔNG thay thế backend (`ActionRbacRegistry:89/343` `create_request→canCreate` + `RbacService` vẫn là cổng chặn thật). */ permission?: Row; poPermission?: Row }) {
  // MT3 ma trận #9 — ⛔ ĐỌC THẲNG capability từ `permission`, ⛔ KHÔNG tự đoán quyền (đúng khuôn `MaterialListTable`).
  const canCreate=Boolean(permission?.canCreate);
  const canExport=Boolean(permission?.canExport);
  const [status,setStatus]=useState("ALL"); const [requester,setRequester]=useState("ALL"); const [stage,setStage]=useState("ALL"); const [priority,setPriority]=useState("ALL"); const [query,setQuery]=useState(""); const [fromDate,setFromDate]=useState(""); const [selectedId,setSelectedId]=useState<string>("");
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

  // ── MỐC 121 · vòng 215 (nhóm PR 2.1–2.7) ───────────────────────────────────────────
  // ⛔ MỌI TÊN TRƯỜNG DÙNG Ở ĐÂY ĐÃ ĐO THẬT trên dữ liệu sống ngày 02/10/2026 (D-080) — KHÔNG bịa cột:
  //   • `material_requests` KHÔNG có `created_by`: đo 84/84 phiếu CÓ `requestedBy`, 0/84 CÓ `createdBy`
  //     ⇒ «người tạo» CHÍNH LÀ `requestedBy`. (Mà `RequestModal` ghi `requestedBy: data.user.fullName`
  //     ⇒ đây là TÊN hiển thị, KHÔNG phải user id — xem DECISIONS D-094 về hệ quả với `delete_request`.)
  //   • `approvalStage` đo được {0,1,2,5} và `priority` đo được {normal,high} ⇒ đủ dựng 2 bộ lọc.
  const requesterOptions=Array.from(new Set(requestRows.map((row)=>String(row.requestedBy||"")).filter(Boolean))).sort((a,b)=>a.localeCompare(b));
  const stageOptions=Array.from(new Set(requestRows.map((row)=>String(row.approvalStage??"")))).sort((a,b)=>Number(a)-Number(b));
  const priorityOptions=Array.from(new Set(requestRows.map((row)=>String(row.priority||"")))).sort((a,b)=>a.localeCompare(b));
  // MỐC 121 · mục 2.6 — «Phát hành PO» chỉ bật khi trùng CẢ 3 điều kiện sau:
  //   ① `status==="approved"` ② `supplyStatus==="awaiting_po"` — đúng bằng điều kiện `eligible` của
  //      `PoModal` (`app/page.tsx`) và đúng luật backend `create_po` («Chỉ được tạo PO từ MR đã duyệt»);
  //      đo được 17/84 phiếu thoả. ③ quyền `purchasing.canCreate` (`ActionRbacRegistry:88/362` gắn
  //      action `create_po` vào module `purchasing` ⇒ ⛔ KHÔNG dùng được `permission` của môn `requests`).
  //   ⛔ KHÔNG thêm điều kiện «mọi bước duyệt phải approved»: đo 17/17 phiếu thoả (9 phiếu có
  //      `approvals: []`, 8 phiếu mọi bước `approved`) ⇒ thêm vào chỉ làm nút tắt oan, chặn không được gì.
  const canIssuePo=Boolean(poPermission?.canCreate);
  const isPoReady=(row:Row)=>row.status==="approved"&&row.supplyStatus==="awaiting_po";
  const filtered=requestRows.filter((row)=>(status==="ALL"||String(row.status)===status)&&(stage==="ALL"||String(row.approvalStage??"")===stage)&&(priority==="ALL"||String(row.priority||"")===priority)&&(requester==="ALL"||String(row.requestedBy||"")===requester)&&(!fromDate||String(row.requestedAt||"").slice(0,10)>=fromDate)&&(!query||`${row.requestNo} ${row.requestedBy} ${row.projectCode} ${row.projectName}`.toLowerCase().includes(query.toLowerCase()))).sort((a,b)=>{
    // §6.6 — SẮP XẾP THẬT theo `sortKey` (⚠️ giá trị rỗng luôn xuống cuối, không đảo lộn).
    // MỐC 121 · mục 2.4 — thêm `neededAt` (Ngày cần) · `totalEstimatedValue` (Giá trị) · `requestedBy` (Người tạo).
    // ⚠️ `totalEstimatedValue` là SỐ ⇒ phải so số; so chuỗi sẽ ra "1000000" < "9" ⇒ sai thứ tự.
    if (sortKey==="totalEstimatedValue") return (Number(b.totalEstimatedValue||0))-(Number(a.totalEstimatedValue||0)) || String(a.requestNo||"").localeCompare(String(b.requestNo||""));
    const desc=sortKey==="requestedAt"||sortKey==="neededAt";
    const pick=(row:Row)=>sortKey==="requestNo"?String(row.requestNo||""):sortKey==="status"?String(row.status||""):sortKey==="neededAt"?String(row.neededAt||""):sortKey==="requestedBy"?String(row.requestedBy||""):String(row.requestedAt||"");
    const x=pick(a), y=pick(b);
    if (!x&&!y) return 0; if (!x) return 1; if (!y) return -1;
    return desc ? y.localeCompare(x) : x.localeCompare(y);
  }); const selected=filtered.find(row=>String(row.id)===selectedId)||filtered[0];
  return <div className="stack module-screen requests-screen approved-module-screen">
    <ListToolbar
      title="PHIẾU ĐỀ NGHỊ MUA HÀNG"
      count={filtered.length} total={requestRows.length} unit="phiếu"
      search={{ value: query, onChange: setQuery, placeholder: "Tìm theo mã phiếu hoặc tên người tạo…" }}
      filters={[
        { key: "status", label: "Trạng thái", value: status, onChange: setStatus, options: [
          { value: "ALL", label: "Tất cả" },
          { value: "pending_approval", label: "Chờ phê duyệt" },
          { value: "returned_to_requester", label: "Trả lại" },
          { value: "approved", label: "Đã duyệt" },
          { value: "completed", label: "Đã giao đủ" },
        ] },
        { key: "requester", label: "Người tạo", value: requester, onChange: setRequester, options: [{ value: "ALL", label: "Tất cả" }, ...requesterOptions.map((name) => ({ value: name, label: name }))] },
        { key: "stage", label: "Bước duyệt", value: stage, onChange: setStage, options: [{ value: "ALL", label: "Tất cả" }, ...stageOptions.map((n) => ({ value: n, label: n === "0" ? "Chưa vào duyệt" : `Bước ${n}` }))] },
        { key: "priority", label: "Ưu tiên", value: priority, onChange: setPriority, options: [{ value: "ALL", label: "Tất cả" }, ...priorityOptions.map((n) => ({ value: n, label: n === "high" ? "Cao" : n === "normal" ? "Bình thường" : n }))] },
      ]}
      sort={{ value: sortKey, onChange: setSortKey, options: [
        { value: "requestedAt", label: "Ngày đề nghị (mới nhất)" },
        { value: "neededAt", label: "Ngày cần (gần nhất)" },
        { value: "requestNo", label: "Số phiếu" },
        { value: "totalEstimatedValue", label: "Giá trị ước tính (cao → thấp)" },
        { value: "requestedBy", label: "Người tạo" },
        { value: "status", label: "Trạng thái" },
      ] }}
      extra={<>
        {/* MT3 §IV.5 — «Dự án» chuyển vào TOOLBAR (⛔ bỏ khối chọn dự án rời ở đầu trang). */}
        <label className="list-toolbar-field"><span>Dự án</span>
          <select value={project} onChange={(event)=>onProject(event.target.value)}>
            <option value="ALL">Tất cả dự án</option>
            {(projects||[]).map((row)=> <option key={String(row.id)} value={String(row.id)}>{String(row.code||row.name||row.id)}</option>)}
          </select>
        </label>
        <label className="list-toolbar-field"><span>Từ ngày</span><input type="date" value={fromDate} onChange={(event)=>setFromDate(event.target.value)}/></label>
      </>}
      actions={<>
        {/* MT3 §IV.4 — NHÓM CRUD: thứ tự chuẩn `Tạo mới → Sửa` nằm BÊN TRÁI (khối `actions`),
            hành động PHỤ (`Xuất Excel`) nằm bên phải (khối `secondaryActions`). ⛔ Mục 2.2 hỏi
            «nhóm nút CRUD» ⇒ dùng đúng khuôn CÓ SẴN của ListToolbar, KHÔNG tự chế lớp CSS mới. */}
        <PermissionGuard allow={canCreate}>
          <button className="primary" disabled={!canCreate} title={canCreate ? "Lập phiếu đề nghị mua hàng" : "Bạn không có quyền tạo phiếu đề nghị"} onClick={()=>open("request")}>＋ Lập phiếu đề nghị</button>
        </PermissionGuard>
        <PermissionGuard allow={canCreate}>
          <button className="secondary" disabled={!canCreate} title={canCreate ? "Nhập phiếu đề nghị từ tệp Excel" : "Bạn không có quyền nhập phiếu đề nghị"} onClick={()=>open("request")}>⇧ Nhập Excel</button>
        </PermissionGuard>
        <button className="secondary" disabled={!selected} title={selected ? `Xem / sửa phiếu ${selected.requestNo}` : "Chọn một phiếu trong bảng bên dưới"} onClick={()=>selected&&open("detail",selected)}>✎ Xem / Sửa phiếu</button>
        {/* MỐC 121 · vòng 215 · mục 2.5 — CHỈ ĐẠO MỚI, THAY THẾ MỘT PHẦN MT3 §E: yêu cầu «thêm nút
            xem chi tiết phiếu · nút tạo phiếu». Nên thanh công cụ CÓ nút «✎ Xem / Sửa phiếu» cho DÒNG
            ĐANG CHỌN, và 2 nút biểu tượng ◉/✎ trong từng dòng nay có `title` (trước đây trần, không giải thích).
            ⛔ Cột ◉/✎ từng dòng KHÔNG bỏ — MT3 §E vẫn đúng: chi tiết mở được TỪ TỪNG DÒNG.
            ⛔ Nút «Tạo phiếu» và «Phát hành PO» vẫn là cổng thật ở backend; xem D-091 (mục 1.4) về
            cách ghi «chỉ đạo mới thay chỉ đạo cũ» — mục này ghi theo đúng khuôn đó. */}
      </>}
      secondaryActions={<>
        <PermissionGuard allow={canExport}>
          <button className="secondary" disabled={!canExport} title={canExport ? "Xuất danh sách phiếu ra Excel" : "Bạn không có quyền xuất dữ liệu"} onClick={exportRows}>⇩ Xuất Excel</button>
        </PermissionGuard>
      </>}
    />
    {/* MT3 §IV.5 — ⛔ ĐÃ BỎ dải chip «Dự án: …» rời ở đầu trang; lựa chọn dự án
        nay nằm trong TOOLBAR CRUD (bộ lọc «Dự án»). Phạm vi dự án và quyền truy cập GIỮ NGUYÊN. */}
    <div className="kpi-grid"><Kpi icon="MR" label="Đề nghị mua" value={format.format(proposed.length)}/><Kpi icon="PD" label="Chờ phê duyệt" value={format.format(pending.length)} tone="violet"/><Kpi icon="DH" label="Đang đặt hàng" value={format.format(ordering.length)} tone="amber"/><Kpi icon="DG" label="Đã giao" value={format.format(delivered.length)} tone="green"/></div>
    {/* MT2-P8-08 (§6.7) — CARD dashboard «VẬT TƯ ĐANG THIẾU» (⛔ ĐÃ BỎ dòng `inline-alert`
        «Vật tư đang thiếu tồn trong phạm vi» đúng nguyên văn yêu cầu). ⚠️ `Kpi` ⛔ không có `onClick`
        ⇒ ✅ BỌC trong `<button>`. ⚠️ Click ⇒ MODAL danh sách.
        ⚠️ MỐC 121 · vòng 215 · mục 2.1 ĐÃ SỬA `Kpi` (`lib/ui-shared.tsx`): cho `note` thành TUỲ CHỌN
        và chỉ render `<p>` khi có nội dung ⇒ bỏ được 4 dòng chú thích thừa dưới KPI mà KHÔNG đổi
        hành vi với màn nào đang truyền `note` (mọi nơi khác vẫn truyền ⇒ `<p>` vẫn render như cũ). */}
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
    {/* Bộ lọc đã gộp vào ListToolbar phía trên — không còn card lọc tách rời (§5).
        MỐC 121 · vòng 215 · mục 2.1 — cột `key:"sla"` / tiêu đề «SLA» ĐÃ ĐỔI thành
        `key:"neededAt"` / «Ngày cần»: nó hiển thị `neededAt`, KHÔNG phải số giờ quá hạn ⇒ nhãn cũ
        mô tả sai dữ liệu (§15). ⛔ Giữ nguyên cách gọi «Ngày cần» đã dùng ở `RequestModal`
        và bản in (kiểm chứng bởi `tests/task136-request-form-optional-fields.test.mjs`). */}
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
        { key: "neededAt", header: "Ngày cần", render: (row) => <>{row.neededAt ? date(row.neededAt) : "—"}</> },
        { key: "actions", header: "Hành động", render: (row) => <div className="row-actions"><button className="icon-mini" title="Xem chi tiết phiếu" onClick={(e) => { e.stopPropagation(); open("detail", row); }}>◉</button><button className="icon-mini" title="Sửa / gửi lại phiếu" onClick={(e) => { e.stopPropagation(); open("detail", row); }}>✎</button>{isPoReady(row)&&<button className="icon-mini" disabled={!canIssuePo} title={canIssuePo?"Phát hành PO từ phiếu này":"Bạn không có quyền phát hành PO"} onClick={(e) => { e.stopPropagation(); open("po", row); }}>＋</button>}</div> },
      ]}
    /></section>
    {selected&&<section className="card approved-request-detail"><div className="table-toolbar"><div><strong>Chi tiết phiếu: <span className="link">{selected.requestNo}</span></strong><span>{selected.projectCode} · {selected.projectName}</span></div><div className="row-actions"><button className={selected.status==="returned_to_requester"?"primary":"secondary"} onClick={()=>open("detail",selected)}>{selected.status==="returned_to_requester"?"✎ Sửa / gửi lại":"◉ Xem phiếu"}</button><button className="secondary" onClick={()=>window.print()}>▣ In phiếu</button>{isPoReady(selected)&&<PermissionGuard allow={canIssuePo}><button className="primary" disabled={!canIssuePo} title={canIssuePo?"Tạo đơn mua hàng từ phiếu này":"Bạn không có quyền phát hành PO"} onClick={()=>open("po",selected)}>＋ Phát hành PO</button></PermissionGuard>}</div></div><div className="request-detail-summary"><div><small>Người đề nghị</small><strong>{selected.requestedBy}</strong></div><div><small>Ngày đề nghị</small><strong>{date(selected.requestedAt)}</strong></div><div><small>Số dòng vật tư</small><strong>{selected.itemCount||selected.items?.length||0}</strong></div><div><small>Trạng thái</small><StatusBadge value={statusLabel(selected)}/></div></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Mã vật tư</th><th>Tên vật tư</th><th>Đơn vị</th><th>Số lượng đề nghị</th><th>Ghi chú</th></tr></thead><tbody>{(selected.items||[]).slice(0,8).map((item:Row,index:number)=><tr key={item.id||index}><td>{index+1}</td><td>{item.materialCode||"—"}</td><td>{item.materialName||"—"}</td><td>{item.unit||"—"}</td><td>{format.format(Number(item.quantity??item.requestedQty??0))}</td><td>{item.note||"—"}</td></tr>)}{!(selected.items||[]).length&&<tr><td colSpan={6}><Empty text="Phiếu chưa có dòng vật tư."/></td></tr>}</tbody></table></div></section>}
  </div>;
}
export {
  Requests,
};