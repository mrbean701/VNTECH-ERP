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

// PHASE 5 (`W-01` + `W-04`) — MÀN TỒN KHO NAY CÓ 2 TAB: «Tồn kho» (giữ NGUYÊN toàn bộ hành vi cũ) và
// «Dashboard tồn kho» (mục #5 của nhóm menu KHO, 8 chỉ số theo §19 — `app/screens/WarehouseDashboard.tsx`).
// `view` do MỤC MENU quyết định (`lib/menu-helpers.ts` → `warehouseMenuViewFor` → `app/page.tsx`): mục
// «Dashboard tồn kho» truyền `view="dashboard"`, bốn mục còn lại KHÔNG truyền ⇒ rơi về tab «Tồn kho».
// KHÔNG thêm khoá module, KHÔNG route mới, KHÔNG màn mới.

import { DataTable, ListToolbar, StatusBadge } from "@/app/components/ui";
import { WarehouseDashboard } from "@/app/screens/WarehouseDashboard";
import type { WarehouseMenuView } from "@/lib/menu-helpers";
import { CardHead, Empty, Kpi, NavIcon, exportInventoryXlsx, format, printInventoryBarcodes, printInventoryLedger } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { useState } from "react";
// Dải 2 tab của màn Tồn kho — thứ tự CỐ ĐỊNH, tab «Tồn kho» là mặc định (hành vi cũ không đổi).
const WAREHOUSE_TABS = ["Tồn kho", "Dashboard tồn kho"];
function Inventory({ data, project, open, view = null }: { data: AppData; project: string; open: (name: string, row?: Row) => void; view?: WarehouseMenuView | null }) {
  const [tab, setTab] = useState(view === "dashboard" ? 1 : 0);
  const showDashboard = tab === 1;
  const [query,setQuery]=useState(""); const [lowOnly,setLowOnly]=useState(false);
  // MT2-P9-01 (§7.1) — «Chưa chọn kho ⇒ dashboard TỔNG HỢP. Click kho ⇒ dashboard chuyển sang dữ liệu
  // của kho được chọn.» ⚠️ Lọc ngay tại GỐC `scopedInventory` ⇒ mọi thứ downstream (KPI · bảng · export ·
  // «Giá trị tồn kho theo kho») tự đúng theo kho đang chọn. `""` = TỔNG HỢP (hành vi cũ không đổi).
  const [wh,setWh]=useState("");
  // MT2-P9-03 (§7.3) — «Thêm **Sort · Filter**». ⚠️ Lọc/sắp xếp THẬT trên dữ liệu, ⛔ không hình thức (§25).
  const [sortKey,setSortKey]=useState("code"); const [whFilter,setWhFilter]=useState("ALL");
  // MT2-P9-05 (§7.5) — «Thêm CRUD · Search · Sort · Filter. Hiển thị danh sách phiếu xuất · đơn xuất kho.»
  // ⚠️ BE CHỈ có `issue_stock` (CREATE); ⛔ KHÔNG có update/delete/cancel (đã đo ActionRbacRegistry +
  // SystemController) ⇒ §14/§20: ⛔ KHÔNG bịa nghiệp vụ sửa/xoá ⇒ phần này = READ + Search·Sort·Filter.
  const [issueQuery,setIssueQuery]=useState(""); const [issueSortKey,setIssueSortKey]=useState("issuedAt"); const [issueStatus,setIssueStatus]=useState("ALL");
  const scopeIssues=(data.issues||[]).filter(row=>project==="ALL"||row.projectId===project);
  const issueSearched=scopeIssues.filter(row=>!issueQuery||`${row.issueNo||""} ${row.projectCode||""} ${row.teamName||""} ${row.receivedByName||""}`.toLocaleLowerCase("vi").includes(issueQuery.toLocaleLowerCase("vi")));
  const issueStatusFiltered=issueSearched.filter(row=>issueStatus==="ALL"||String(row.status)===issueStatus);
  const issueRows=[...issueStatusFiltered].sort((a,b)=>{switch(issueSortKey){case "issueNo":return String(a.issueNo||"").localeCompare(String(b.issueNo||""),"vi"); case "project":return String(a.projectCode||"").localeCompare(String(b.projectCode||""),"vi"); case "qty_desc":return (Number(b.totalQty||0)-Number(a.totalQty||0)); default:return String(a.issuedAt||"").localeCompare(String(b.issuedAt||""));}});
  const issueStatusOptions=Array.from(new Set(scopeIssues.map(r=>String(r.status)).filter(Boolean)));
  const scopedInventory=data.inventory.filter((row)=>(project==="ALL"||row.projectId===project)&&(!wh||String(row.warehouseId)===wh)); const searched=scopedInventory.filter(row=>!query||`${row.materialCode||""} ${row.materialName||""} ${row.warehouseCode||""} ${row.warehouseName||""} ${row.locationCode||""}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))); const lowRows=searched.filter(row=>Number(row.available??row.balance)>=0&&Number(row.available??row.balance)<Number(row.minStock||0)); const base=lowOnly?lowRows:searched; const whFiltered=base.filter(row=>whFilter==="ALL"||String(row.warehouseId)===whFilter); const filtered=[...whFiltered].sort((a,b)=>{const av=Number(a.available??a.balance)||0, bv=Number(b.available??b.balance)||0; switch(sortKey){case "name":return String(a.materialName||"").localeCompare(String(b.materialName||""),"vi"); case "avail_desc":return bv-av; case "avail_asc":return av-bv; case "min_desc":return (Number(b.minStock||0)-Number(b.minStock||0))+(Number(b.minStock||0)-Number(a.minStock||0)); case "wh":return String(a.warehouseCode||a.warehouseName||"").localeCompare(String(b.warehouseCode||b.warehouseName||""),"vi"); default:return String(a.materialCode||"").localeCompare(String(b.materialCode||""),"vi");}}); const positive=filtered.filter((row)=>Number(row.available??row.balance)>0); const totalQty=positive.reduce((sum,row)=>sum+Number((row.available??row.balance)||0),0); const below=lowRows.length; const inbound=filtered.filter(row=>Number(row.pendingInbound||0)>0).length; const outbound=data.issues.filter((row)=>project==="ALL"||row.projectId===project).length;
  const selectedProject=project==="ALL"?null:data.projects.find(row=>row.id===project); const allowedWarehouses=data.warehouses.filter(row=>project==="ALL"||row.projectId===project||row.warehouseType==="central");
  // PHASE 5 (`W-01`/`W-04`) — dải tab dùng CHUNG cho cả 2 tab, đặt trong màn Tồn kho (không tạo màn/route mới).
  const tabBar = <section className="card inventory-tabs-card"><ListToolbar title="KHO VẬT TƯ"
    note="Hai tab của cùng một màn: «Tồn kho» (nghiệp vụ) và «Dashboard tồn kho» (8 chỉ số §19). Mục menu «Dashboard tồn kho» mở thẳng tab thứ hai."
    extra={<label className="list-toolbar-field"><span>Phạm vi dự án</span><strong className="filter-control">{selectedProject?`${selectedProject.code} – ${selectedProject.name}`:"Tất cả dự án được phân quyền"}</strong></label>}/>
    <div className="project-scope-tabs" role="tablist" aria-label="Kho vật tư">
      {WAREHOUSE_TABS.map((label,index)=><button type="button" key={label} role="tab" aria-selected={tab===index} className={tab===index?"active":""} data-warehouse-tab={index===0?"inventory":"dashboard"} onClick={()=>setTab(index)}>{label}</button>)}
    </div>
  </section>;
  if (showDashboard) return <div className="stack baseline-screen approved-inventory-screen">
    {tabBar}
    <WarehouseDashboard data={data} project={project}/>
  </div>;
  return <div className="stack baseline-screen approved-inventory-screen">
    {tabBar}
    <ListToolbar
      title="TỒN KHO & ĐIỀU CHUYỂN"
      note="Theo dõi tồn theo đúng dự án/kho được phân quyền; điều chuyển phải có xác nhận kho đích."
      count={filtered.length} total={scopedInventory.length} unit="mã vật tư"
      search={{ value: query, onChange: setQuery, placeholder: "Tìm kiếm theo mã vật tư, tên vật tư..." }}
      sort={{ value: sortKey, onChange: setSortKey, options: [{ value: "code", label: "Mã vật tư" }, { value: "name", label: "Tên vật tư" }, { value: "avail_desc", label: "Tồn khả dụng — cao nhất" }, { value: "avail_asc", label: "Tồn khả dụng — thấp nhất" }, { value: "min_desc", label: "Tồn tối thiểu — cao nhất" }, { value: "wh", label: "Kho / vị trí" }] }}
      filters={[
        { key: "warehouse", label: "Kho", value: whFilter, onChange: setWhFilter, options: [{ value: "ALL", label: "Tất cả kho" }, ...allowedWarehouses.map((w) => ({ value: String(w.id), label: w.name }))] },
        { key: "low", label: "Mức tồn", value: lowOnly ? "low" : "ALL", onChange: (v: string) => setLowOnly(v === "low"), options: [{ value: "ALL", label: "Tất cả mức tồn" }, { value: "low", label: `Chỉ tồn dưới mức tối thiểu (${below})` }] },
      ]}
      extra={<>
        <label className="list-toolbar-field"><span>Phạm vi dự án</span><strong className="filter-control">{selectedProject?`${selectedProject.code} – ${selectedProject.name}`:"Tất cả dự án được phân quyền"}</strong></label>
        <label className="list-toolbar-field check-inline"><input type="checkbox" checked={lowOnly} onChange={e=>setLowOnly(e.target.checked)}/><span>Chỉ hiện tồn dưới mức tối thiểu ({below})</span></label>
      </>}
      actions={<>
        {lowOnly&&<button className="secondary" onClick={()=>{setLowOnly(false);setQuery("");}}>Đặt lại</button>}
        <button className="secondary" onClick={()=>exportInventoryXlsx(filtered)}>⇩ Xuất Excel</button>
        <button className="secondary" disabled={!filtered.length} onClick={()=>printInventoryBarcodes(filtered)}>▥ In mã Barcode</button>
      </>}
    />
    <div className="inventory-approved-grid"><div className="inventory-approved-main stack"><div className="kpi-grid"><Kpi icon="TK" label="Tồn khả dụng" value={format.format(totalQty)} note="mã/đơn vị tồn trong phạm vi"/><Kpi icon="CN" label="Chờ nhập" value={format.format(inbound)} note="theo PO đang giao" tone="violet"/><Kpi icon="CX" label="Chờ xuất" value={format.format(outbound)} note="theo yêu cầu cấp phát" tone="amber"/><Kpi icon="CB" label="Cảnh báo tồn thấp" value={`${format.format(below)} mặt hàng`} note="dưới mức tồn tối thiểu" tone="red"/></div>
      {/* Bộ lọc đã gộp vào ListToolbar phía trên — không còn card lọc tách rời (§5). */}
      <section className="card inventory-tabs-card"><div className="inventory-tabs"><span className="active" aria-current="page">TỒN KHO</span><button onClick={()=>open("receipt")}>NHẬP KHO</button><button onClick={()=>open("issue")}>XUẤT KHO</button><button onClick={()=>open("transfer")}>CHUYỂN KHO</button><button onClick={()=>printInventoryLedger(filtered)}>THẺ KHO</button></div><DataTable rows={filtered} rowKey={(row, index) => String(`${row.warehouseId}-${row.materialId}-${index}`)} columns={[{ key: "c1", header: "#", render: (row, index) => <>{index+1}</> }, { key: "c2", header: "Mã vật tư", render: (row) => <><strong className="link">{row.materialCode}</strong></> }, { key: "c3", header: "Tên vật tư", render: (row) => <>{row.materialName}</> }, { key: "c4", header: "ĐVT", render: (row) => <>{row.unit}</> }, { key: "c5", header: "On Hand", render: (row) => <>{format.format(row.balance||0)}</> }, { key: "c6", header: "Đã giữ", render: (row) => <>{format.format(row.reserved||0)}</> }, { key: "c7", header: "Tồn khả dụng", render: (row) => <><strong>{format.format((row.available??row.balance)||0)}</strong></> }, { key: "c8", header: "Tồn tối thiểu", render: (row) => <>{format.format(row.minStock||0)}</> }, { key: "c9", header: "Vị trí/Kho", render: (row) => <>{row.warehouseCode||row.warehouseName} · {row.locationCode||"—"}</> }, { key: "c10", header: "Dự án", render: (row) => <>{row.projectCode||row.projectName||"Kho Tổng"}</> }, { key: "c11", header: "Trạng thái", render: (row) => <><StatusBadge value={Number(row.balance)<Number(row.minStock)?"Sắp hết":"Bình thường"}/></> }]} emptyText="Chưa phát sinh tồn kho." /><div className="table-pagination functional-summary"><span>Đang hiển thị toàn bộ {filtered.length} vật tư phù hợp bộ lọc.</span></div></section>
      <section className="card"><CardHead title="Phiếu điều chuyển đang xử lý" note="Requested → Approved → In Transit → Received; tồn kho nguồn giảm ngay khi Ship."/><div className="table-wrap"><table><thead><tr><th>Phiếu</th><th>Nguồn</th><th>Đích</th><th>Yêu cầu</th><th>Đã xuất</th><th>Đã nhận</th><th>Trạng thái</th></tr></thead><tbody>{data.transferOrders.filter(row=>!["received","cancelled"].includes(String(row.status))).slice(0,10).map(row=><tr key={row.id}><td><strong>{row.transferNo}</strong></td><td>{row.sourceWarehouseCode}</td><td>{row.destinationWarehouseCode}</td><td>{format.format(row.requestedQty||0)}</td><td>{format.format(row.shippedQty||0)}</td><td>{format.format(row.receivedQty||0)}</td><td><StatusBadge value={row.status==="requested"?"Chờ duyệt":row.status==="approved"?"Đã duyệt":row.status==="in_transit"?"Đang vận chuyển":"Đã nhận"}/></td></tr>)}{!data.transferOrders.filter(row=>!["received","cancelled"].includes(String(row.status))).length&&<tr><td colSpan={7}><Empty text="Không có phiếu điều chuyển đang xử lý."/></td></tr>}</tbody></table></div></section>
      <div className="inventory-bottom-grid"><section className="card"><CardHead title="Cảnh báo tồn kho"/><div className="simple-list"><div><span className="doc-icon"><NavIcon name="dept_plan_alerts"/></span><div><strong>{below} mã vật tư sắp hết tồn</strong><p>Dưới mức tồn tối thiểu đã cấu hình</p></div></div><div><span className="doc-icon"><NavIcon name="inventory"/></span><div><strong>{outbound} yêu cầu xuất/điều chuyển đang theo dõi</strong><p>Kiểm tra trạng thái trước khi xác nhận kho đích</p></div></div></div></section><section className="card inventory-warehouse-cards-card" data-vntech="inventory-warehouse-cards"><CardHead title="Giá trị tồn kho theo kho" note="§7.1 — bấm 1 kho để dashboard chuyển sang dữ liệu của kho đó; bấm «TỔNG HỢP» để xem toàn bộ"/><div className="warehouse-card-row"><button type="button" className={`warehouse-card${wh===""?" is-active":""}`} data-vntech="inventory-wh-card-all" onClick={()=>setWh("")}><span>TỔNG HỢP</span><strong>{format.format(data.inventory.filter((r)=>(project==="ALL"||r.projectId===project)).reduce((sum,r)=>sum+Number(r.balance||0),0))}</strong><small>{data.inventory.filter((r)=>(project==="ALL"||r.projectId===project)).length} dòng tồn</small></button>{allowedWarehouses.map((w,index)=><button type="button" key={w.id} className={`warehouse-card${wh===String(w.id)?" is-active":""}`} data-vntech="inventory-wh-card" data-wh-id={String(w.id)} onClick={()=>setWh(String(w.id))}><span>{w.name}</span><strong>{format.format(data.inventory.filter((r)=>String(r.warehouseId)===String(w.id)).reduce((sum,r)=>sum+Number(r.balance||0),0))}</strong><small>{data.inventory.filter((r)=>String(r.warehouseId)===String(w.id)).length} dòng tồn</small><i><b style={{width:`${Math.max(12,90-index*15)}%`}}/></i></button>)}</div></section></div>
    </div><aside className="card inventory-transfer-panel"><h2>TẠO PHIẾU NHẬP / XUẤT / ĐIỀU CHUYỂN</h2><div className="switch-tabs"><span className="active" aria-current="page">ĐIỀU CHUYỂN</span><button onClick={()=>open("receipt")}>NHẬP KHO</button><button onClick={()=>open("issue")}>XUẤT KHO</button></div><div className="scope-lock-note">Biểu mẫu điều chuyển đầy đủ sẽ mở khi bấm nút bên dưới; Kho nguồn/đích, vật tư, số lượng và ghi chú được kiểm tra tại biểu mẫu thật.</div><button className="primary wide" onClick={()=>open("transfer")}>TẠO PHIẾU ĐIỀU CHUYỂN</button><div className="scope-lock-note">🔒 Chỉ hiển thị kho/dự án thuộc phạm vi tài khoản. Thủ kho dự án không thao tác Kho Tổng; Thủ kho Tổng không thao tác kho dự án.</div><div className="qr-card compact"><h2>MÃ VẠCH / QR CODE</h2><div className="barcode-preview">|||| ||| | ||||</div><button className="secondary" disabled={!filtered.length} onClick={()=>printInventoryBarcodes(filtered)}>IN TEM MÃ</button></div></aside></div>
    <section className="card" data-vntech="issue-list-screen">
      <ListToolbar
        title="DANH SÁCH PHIẾU XUẤT · ĐƠN XUẤT KHO"
        note="§7.5 — phiếu xuất kho cho tổ đội (nguồn: stock_issues + stock_issue_items). Tạo mới qua nút «XUẤT KHO» phía trên. ⛔ Không có sửa/xoá phiếu xuất: backend chưa khai báo action — không bịa nghiệp vụ (§14/§20)."
        count={issueRows.length} total={scopeIssues.length} unit="phiếu"
        search={{ value: issueQuery, onChange: setIssueQuery, placeholder: "Tìm phiếu xuất · dự án · tổ đội · người nhận..." }}
        sort={{ value: issueSortKey, onChange: setIssueSortKey, options: [{ value: "issuedAt", label: "Ngày xuất" }, { value: "issueNo", label: "Số phiếu" }, { value: "project", label: "Dự án" }, { value: "qty_desc", label: "Số lượng — cao nhất" }] }}
        filters={[{ key: "status", label: "Trạng thái", value: issueStatus, onChange: setIssueStatus, options: [{ value: "ALL", label: "Tất cả trạng thái" }, ...issueStatusOptions.map((s) => ({ value: s, label: s }))] }]}
      />
      <DataTable rows={issueRows} rowKey={(row, index) => String(`${row.id}-${index}`)} columns={[
        { key: "c1", header: "#", render: (row, index) => <>{index + 1}</> },
        { key: "c2", header: "Số phiếu xuất", render: (row) => <><strong className="link">{row.issueNo}</strong></> },
        { key: "c3", header: "Dự án", render: (row) => <>{row.projectCode}</> },
        { key: "c4", header: "Tổ đội nhận", render: (row) => <>{row.teamName}</> },
        { key: "c5", header: "Người nhận", render: (row) => <>{row.receivedByName || "—"}</> },
        { key: "c6", header: "Ngày xuất", render: (row) => <>{row.issuedAt ? String(row.issuedAt).slice(0, 10) : "—"}</> },
        { key: "c7", header: "SL xuất", render: (row) => <><strong>{format.format(row.totalQty || 0)}</strong></> },
        { key: "c8", header: "Đã lắp đặt", render: (row) => <>{format.format(row.installedQty || 0)}</> },
        { key: "c9", header: "Trạng thái", render: (row) => <><StatusBadge value={String(row.status) === "issued" ? "Đã xuất" : String(row.status)} /></> },
      ]} emptyText="Chưa có phiếu xuất kho nào trong phạm vi." />
      <div className="table-pagination functional-summary"><span>Hiển thị {issueRows.length}/{scopeIssues.length} phiếu xuất phù hợp bộ lọc.</span></div>
    </section>
  </div>;
}
export {
  Inventory,
};