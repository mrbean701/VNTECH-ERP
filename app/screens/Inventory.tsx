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
import { CardHead, Empty, Kpi, NavIcon, exportInventoryXlsx, format, printInventoryBarcodes, printInventoryLedger, AttachmentPanel } from "@/lib/ui-shared";
// MT3 §IV.6 — nguồn ánh xạ trạng thái dùng chung (⛔ không lộ mã thô).
import { statusLabel } from "@/lib/status-labels";
// MT3 §IV.7 — xuất CSV UTF-8 có BOM để Excel trên Windows đọc đúng tiếng Việt.
import { downloadCsv } from "@/lib/tabular-export";
import type { AppData, Row } from "@/lib/ui-shared";
import { useState } from "react";
// Dải 2 tab của màn Tồn kho — thứ tự CỐ ĐỊNH, tab «Tồn kho» là mặc định (hành vi cũ không đổi).
// MT3 §F — 4 TAB CẤP CAO của màn Kho, đúng thứ tự yêu cầu.
// (Trước MT3: màn này chỉ có 2 tab «Tồn kho» / «Dashboard tồn kho», các mục Nhập/Xuất/Cấp phát
//  là NÚT thao tác rời, ⛔ không phải tab.)
const WAREHOUSE_TABS = ["Kho", "Nhập kho & Xuất kho", "Tồn kho", "Cấp phát & hoàn trả"];
function Inventory({ data, project, open, action, view = null }: { data: AppData; project: string; open: (name: string, row?: Row) => void; action?: (name: string, payload: Row) => Promise<boolean>; view?: WarehouseMenuView | null }) {
  // MT3 §F — tab cấp cao (0 Kho · 1 Nhập & Xuất · 2 Tồn kho · 3 Cấp phát & hoàn trả) + sub-tab Nhập/Xuất.
  const [tab, setTab] = useState(view === "dashboard" ? 2 : 0);
  const [ioTab, setIoTab] = useState<"issue" | "receipt">("issue");
  // MT3 §F — click CARD KHO mở modal chi tiết (thủ kho · lịch sử xuất/nhập · cấp phát/hoàn trả · danh mục vật tư).
  const [openWarehouseId, setOpenWarehouseId] = useState<string>("");
  // MT3 ma trận #4 — «Modal thay side panel» (user cho phép 27/09/2026).
  //   ⚠️ TRƯỚC ĐÂY bảng «TẠO PHIẾU NHẬP / XUẤT / ĐIỀU CHUYỂN» là `<aside>` render THẲNG trong trang
  //   (luôn chiếm chỗ, đẩy lệch bố cục). Nay đưa vào **hộp thoại**, mở bằng nút ở thanh công cụ.
  //   ✅ GIỮ NGUYÊN mọi chức năng bên trong: 3 tab ĐIỀU CHUYỂN/NHẬP KHO/XUẤT KHO + nút TẠO PHIẾU
  //      ĐIỀU CHUYỂN + khối MÃ VẠCH/QR + nút IN TEM MÃ.
  const [transferPanelOpen, setTransferPanelOpen] = useState(false);
  // MT3 §F — toolbar CRUD kho: tìm / sắp xếp / chọn kho đang chọn (cho nút Sửa · Xóa) + xuất Excel.
  const [whQuery, setWhQuery] = useState("");
  const [whSortKey, setWhSortKey] = useState("name_asc");
  const [selectedWhId, setSelectedWhId] = useState<string>("");
  const showDashboard = tab === 2;
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
  // MT3 §F — toolbar CRUD kho: tìm theo tên/mã + sắp xếp; ⛔ chỉ lọc HIỂN THỊ, ⛔ không đổi phạm vi quyền.
  const visibleWarehouses=[...allowedWarehouses]
    .filter((w:Row)=>!whQuery||`${w.warehouseName||""} ${w.warehouseCode||""}`.toLocaleLowerCase("vi").includes(whQuery.toLocaleLowerCase("vi")))
    .sort((a:Row,b:Row)=>{const an=String(a.warehouseName||a.warehouseCode||""),bn=String(b.warehouseName||b.warehouseCode||"");
      if(whSortKey==="name_desc")return bn.localeCompare(an,"vi");
      if(whSortKey==="items_desc")return scopedInventory.filter((r:Row)=>String(r.warehouseId)===String(b.id)).length-scopedInventory.filter((r:Row)=>String(r.warehouseId)===String(a.id)).length;
      return an.localeCompare(bn,"vi");});
  // MT3 §IV.7 — xuất CSV UTF-8 có BOM (Excel Windows đọc đúng tiếng Việt).
  function exportWarehousesCsv(source:Row[]){downloadCsv(["Mã kho","Tên kho","Loại","Số vật tư","Số phiếu xuất"],
    source.map((w:Row)=>[String(w.warehouseCode||""),String(w.warehouseName||""),String(w.warehouseType==="central"?"Kho":w.warehouseType==="site"?"Kho công trường":"Kho tổ đội"),
      scopedInventory.filter((r:Row)=>String(r.warehouseId)===String(w.id)).length,(data.issues||[]).filter((r:Row)=>String(r.warehouseId)===String(w.id)).length]),
    `Danh_sach_kho_${new Date().toISOString().slice(0,10)}`);}
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
      {/* ══ MT3 §F — TAB CẤP CAO: Kho · Nhập kho & Xuất kho · Tồn kho · Cấp phát & hoàn trả ══ */}
      <div className="project-scope-tabs" role="tablist" aria-label="Kho vật tư — tab cấp cao (MT3 §F)">
        {WAREHOUSE_TABS.map((label,index)=><button type="button" key={label} role="tab" aria-selected={tab===index} className={tab===index?"active":""} data-vntech={`warehouse-main-tab-${index}`} onClick={()=>setTab(index)}>{label}</button>)}
      </div>

      {/* ── MT3 §F — TAB 1 «KHO»: danh sách kho dạng CARD, bấm card mở modal chi tiết ── */}
      {tab===0&&<section className="card" data-vntech="warehouse-cards">
        {/* MT3 §F — TOOLBAR CRUD CHO KHO (Tạo · Sửa · Xóa · Tìm · Sắp xếp · Lọc · Xuất Excel). */}
        <ListToolbar title="KHO" note="Danh sách kho trong phạm vi dự án bạn được phân quyền. Bấm một thẻ để xem thủ kho, lịch sử xuất/nhập, lịch sử cấp phát/hoàn trả và danh mục vật tư trong kho."
          count={visibleWarehouses.length} total={allowedWarehouses.length} unit="kho"
          search={{value:whQuery,onChange:setWhQuery,placeholder:"Tìm theo tên hoặc mã kho..."}}
          sort={{value:whSortKey,onChange:setWhSortKey,options:[{value:"name_asc",label:"Tên A→Z"},{value:"name_desc",label:"Tên Z→A"},{value:"items_desc",label:"Nhiều vật tư trước"}]}}
          actions={<>
            <button type="button" className="primary" onClick={()=>open("warehouse")}>＋ Tạo kho</button>
            <button type="button" className="secondary" disabled={!selectedWhId} onClick={()=>{const w=allowedWarehouses.find((x:Row)=>String(x.id)===selectedWhId);if(w)open("warehouse",w);}}>✎ Sửa</button>
            <button type="button" className="secondary" disabled={!selectedWhId} onClick={()=>{const w=allowedWarehouses.find((x:Row)=>String(x.id)===selectedWhId);if(w&&action&&window.confirm(`Xóa kho ${String(w.warehouseName||w.warehouseCode)}?`))void action("delete_warehouse",{warehouseId:w.id});}}>🗑 Xóa</button>
          </>}
          secondaryActions={<button type="button" className="secondary" onClick={()=>exportWarehousesCsv(visibleWarehouses)}>⇩ Xuất Excel</button>}
        />
        {/* MT3 §F — số liệu TỔNG HỢP toàn phạm vi được phép (⛔ không chỉ một kho). */}
        <div className="kpi-grid small">
          <Kpi icon="TK" label="Số kho" value={String(allowedWarehouses.length)} note="Trong phạm vi bạn được phân quyền" tone="blue"/>
          <Kpi icon="VT" label="Vật tư đang có" value={String(scopedInventory.length)} note="Tổng các kho trong phạm vi" tone="green"/>
          <Kpi icon="PX" label="Phiếu xuất" value={String((data.issues||[]).length)} note="Tổng phiếu xuất trong phạm vi" tone="amber"/>
        </div>
        <div className="warehouse-card-grid">
          {visibleWarehouses.map((w:Row)=>{
            const whRows=scopedInventory.filter((r:Row)=>String(r.warehouseId)===String(w.id));
            const whIssued=data.issues.filter((r:Row)=>String(r.warehouseId)===String(w.id));
            return <button type="button" className={selectedWhId===String(w.id)?"warehouse-card is-selected":"warehouse-card"} key={String(w.id)} data-vntech="warehouse-card"
              aria-pressed={selectedWhId===String(w.id)}
              onClick={()=>setSelectedWhId(String(w.id))}
              onDoubleClick={()=>setOpenWarehouseId(String(w.id))}>
              <b>{String(w.warehouseName||w.warehouseCode||w.id)}</b>
              <span className="muted">{String(w.warehouseCode||"")} · {w.warehouseType==="central"?"Kho":w.warehouseType==="site"?"Kho công trường":"Kho tổ đội"}</span>
              <small>{whRows.length} vật tư · {whIssued.length} phiếu xuất</small>
              <em className="warehouse-card-hint">Bấm để chọn · bấm đúp để xem chi tiết</em>
            </button>;
          })}
          {!visibleWarehouses.length&&<Empty text={whQuery?"Không có kho nào khớp từ khoá tìm kiếm.":"Chưa có kho nào trong phạm vi bạn được phân quyền."}/>}
          {/* MT3 §F — bấm thẻ để CHỌN (cho Sửa/Xóa); nút này mở MODAL CHI TIẾT kho đang chọn. */}
          <button type="button" className="secondary" data-vntech="warehouse-open-detail" disabled={!selectedWhId} onClick={()=>{if(selectedWhId)setOpenWarehouseId(selectedWhId);}}>◉ Xem chi tiết kho đang chọn</button>
        </div>
      </section>}

      {/* ── MT3 §F — TAB 2 «NHẬP KHO & XUẤT KHO»: gộp 2 mục cũ, có 2 sub-tab ── */}
      {tab===1&&<section className="card" data-vntech="warehouse-io-tab">
        <CardHead title="NHẬP KHO & XUẤT KHO" note="Gộp hai mục cũ theo MT3 §F; chọn sub-tab bên dưới."/>
        <div className="project-scope-tabs" role="tablist" aria-label="Nhập kho và Xuất kho">
          <button type="button" role="tab" aria-selected={ioTab==="issue"} className={ioTab==="issue"?"active":""} onClick={()=>setIoTab("issue")}>Xuất kho</button>
          <button type="button" role="tab" aria-selected={ioTab==="receipt"} className={ioTab==="receipt"?"active":""} onClick={()=>setIoTab("receipt")}>Nhập kho</button>
        </div>
        <div className="warehouse-io-actions">
          <button type="button" className="primary" onClick={()=>open(ioTab==="issue"?"issue":"receipt")}>{ioTab==="issue"?"⭳ Tạo phiếu xuất kho":"⭱ Tạo phiếu nhập kho"}</button>
        </div>
      </section>}

      {/* ── MT3 §F — TAB 3 «CẤP PHÁT & HOÀN TRẢ» ── */}
      {tab===3&&<section className="card" data-vntech="warehouse-allocate-tab">
        <CardHead title="CẤP PHÁT & HOÀN TRẢ" note="Phiếu cấp phát vật tư cho tổ đội, hoàn trả lại kho, và LUÂN CHUYỂN VẬT TƯ DƯ về kho."/>
        <ListToolbar title="CẤP PHÁT & HOÀN TRẢ" note="MT3 §F — tab cấp cao của màn Kho."
          secondaryActions={<button type="button" className="secondary" onClick={()=>open("allocate")}>＋ Tạo phiếu cấp phát</button>}/>
        <div className="warehouse-io-actions"><button type="button" className="secondary" onClick={()=>open("return")}>↩ Tạo phiếu hoàn trả</button></div>
        {/* ⛔ QUYẾT ĐỊNH USER (26/09/2026): «Luân chuyển vật tư dư» LÀ MỘT PHẦN của Cấp phát & hoàn trả
            – Nhập/Xuất kho ⇒ chuyển danh sách này từ màn «Kho tổng» về ĐÂY. ⛔ Không xoá nghiệp vụ. */}
        <h3 className="section-subhead">LUÂN CHUYỂN VẬT TƯ DƯ DỰ ÁN → KHO</h3>
        <div className="table-wrap"><table><thead><tr><th>Phiếu / dự án</th><th>Đề nghị</th><th>Chấp nhận / từ chối</th><th>Ảnh</th><th>Trạng thái</th><th>Xử lý</th></tr></thead>
          <tbody>{(data.centralReturns||[]).map((row:Row)=><tr key={String(row.id)}>
            <td><strong>{String(row.returnNo||"")}</strong><small>{String(row.projectCode||"")} · {String(row.sourceWarehouseName||"")}</small></td>
            <td>{format.format(row.proposedQty||0)} · {String(row.itemCount||0)} dòng</td>
            <td>{format.format(row.acceptedQty||0)} / {format.format(row.rejectedQty||0)}</td>
            <td>{String(row.attachmentCount||0)}</td>
            <td><StatusBadge value={row.status==="pending_approval"?"Chờ phê duyệt":row.status==="in_transit"?"Đang vận chuyển":row.status==="received_with_rejection"?"Đã nhận · Có từ chối":"Đã nhận"}/></td>
            <td><div className="row-actions">
              {row.status==="pending_approval"&&action&&<button className="mini-approve" onClick={()=>void action("approve_central_return",{centralReturnId:row.id,reason:"Đã duyệt chuyển vật tư dư về kho"})}>Duyệt</button>}
              {row.status==="in_transit"&&<button className="secondary" onClick={()=>open("centralReceive",row)}>Kiểm đếm</button>}
              {row.status==="in_transit"&&<AttachmentPanel entityType="central_return" entityId={String(row.id)} />}
            </div></td></tr>)}
          {!(data.centralReturns||[]).length&&<tr><td colSpan={6}><Empty text="Chưa có phiếu chuyển vật tư dư nào."/></td></tr>}
          </tbody></table></div>
      </section>}

      {/* ⛔ MT3 §F: các nút NHẬP KHO / XUẤT KHO / CHUYỂN KHO đã thành TAB & sub-tab ở trên ⇒ bỏ khỏi dải này.
          Giữ lại THẺ KHO (in thẻ kho — hành động độc lập, không trùng tab nào). */}
      <section className="card inventory-tabs-card"><div className="inventory-tabs"><span className={tab===2?"active":""} aria-current="page">TỒN KHO</span><button onClick={()=>open("transfer")}>CHUYỂN KHO</button><button onClick={()=>printInventoryLedger(filtered)}>THẺ KHO</button></div><DataTable rows={filtered} rowKey={(row, index) => String(`${row.warehouseId}-${row.materialId}-${index}`)} columns={[{ key: "c1", header: "#", render: (row, index) => <>{index+1}</> }, { key: "c2", header: "Mã vật tư", render: (row) => <><strong className="link">{row.materialCode}</strong></> }, { key: "c3", header: "Tên vật tư", render: (row) => <>{row.materialName}</> }, { key: "c4", header: "ĐVT", render: (row) => <>{row.unit}</> }, { key: "c5", header: "On Hand", render: (row) => <>{format.format(row.balance||0)}</> }, { key: "c6", header: "Đã giữ", render: (row) => <>{format.format(row.reserved||0)}</> }, { key: "c7", header: "Tồn khả dụng", render: (row) => <><strong>{format.format((row.available??row.balance)||0)}</strong></> }, { key: "c8", header: "Tồn tối thiểu", render: (row) => <>{format.format(row.minStock||0)}</> }, { key: "c9", header: "Vị trí/Kho", render: (row) => <>{row.warehouseCode||row.warehouseName} · {row.locationCode||"—"}</> }, { key: "c10", header: "Dự án", render: (row) => <>{row.projectCode||row.projectName||"Kho"}</> }, { key: "c11", header: "Trạng thái", render: (row) => <><StatusBadge value={Number(row.balance)<Number(row.minStock)?"Sắp hết":"Bình thường"}/></> }]} emptyText="Chưa phát sinh tồn kho." /><div className="table-pagination functional-summary"><span>Đang hiển thị toàn bộ {filtered.length} vật tư phù hợp bộ lọc.</span></div></section>
      <section className="card"><CardHead title="Phiếu điều chuyển đang xử lý" note="Requested → Approved → In Transit → Received; tồn kho nguồn giảm ngay khi Ship."/><div className="table-wrap"><table><thead><tr><th>Phiếu</th><th>Nguồn</th><th>Đích</th><th>Yêu cầu</th><th>Đã xuất</th><th>Đã nhận</th><th>Trạng thái</th></tr></thead><tbody>{data.transferOrders.filter(row=>!["received","cancelled"].includes(String(row.status))).slice(0,10).map(row=><tr key={row.id}><td><strong>{row.transferNo}</strong></td><td>{row.sourceWarehouseCode}</td><td>{row.destinationWarehouseCode}</td><td>{format.format(row.requestedQty||0)}</td><td>{format.format(row.shippedQty||0)}</td><td>{format.format(row.receivedQty||0)}</td><td><StatusBadge value={row.status==="requested"?"Chờ duyệt":row.status==="approved"?"Đã duyệt":row.status==="in_transit"?"Đang vận chuyển":"Đã nhận"}/></td></tr>)}{!data.transferOrders.filter(row=>!["received","cancelled"].includes(String(row.status))).length&&<tr><td colSpan={7}><Empty text="Không có phiếu điều chuyển đang xử lý."/></td></tr>}</tbody></table></div></section>
      <div className="inventory-bottom-grid"><section className="card"><CardHead title="Cảnh báo tồn kho"/><div className="simple-list"><div><span className="doc-icon"><NavIcon name="dept_plan_alerts"/></span><div><strong>{below} mã vật tư sắp hết tồn</strong><p>Dưới mức tồn tối thiểu đã cấu hình</p></div></div><div><span className="doc-icon"><NavIcon name="inventory"/></span><div><strong>{outbound} yêu cầu xuất/điều chuyển đang theo dõi</strong><p>Kiểm tra trạng thái trước khi xác nhận kho đích</p></div></div></div></section><section className="card inventory-warehouse-cards-card" data-vntech="inventory-warehouse-cards"><CardHead title="Giá trị tồn kho theo kho" note="§7.1 — bấm 1 kho để dashboard chuyển sang dữ liệu của kho đó; bấm «TỔNG HỢP» để xem toàn bộ"/><div className="warehouse-card-row"><button type="button" className={`warehouse-card${wh===""?" is-active":""}`} data-vntech="inventory-wh-card-all" onClick={()=>setWh("")}><span>TỔNG HỢP</span><strong>{format.format(data.inventory.filter((r)=>(project==="ALL"||r.projectId===project)).reduce((sum,r)=>sum+Number(r.balance||0),0))}</strong><small>{data.inventory.filter((r)=>(project==="ALL"||r.projectId===project)).length} dòng tồn</small></button>{allowedWarehouses.map((w,index)=><button type="button" key={w.id} className={`warehouse-card${wh===String(w.id)?" is-active":""}`} data-vntech="inventory-wh-card" data-wh-id={String(w.id)} onClick={()=>setWh(String(w.id))}><span>{w.name}</span><strong>{format.format(data.inventory.filter((r)=>String(r.warehouseId)===String(w.id)).reduce((sum,r)=>sum+Number(r.balance||0),0))}</strong><small>{data.inventory.filter((r)=>String(r.warehouseId)===String(w.id)).length} dòng tồn</small><i><b style={{width:`${Math.max(12,90-index*15)}%`}}/></i></button>)}</div></section></div>
      {/* ── MT3 §F — MODAL CHI TIẾT KHO: thủ kho · lịch sử xuất/nhập · cấp phát/hoàn trả · danh mục vật tư ── */}
      {openWarehouseId&&(()=>{const w:Row=allowedWarehouses.find((x:Row)=>String(x.id)===openWarehouseId)||{};
        const keeper=(data.staffDirectory||[]).find((u:Row)=>String(u.warehouseId)===String(w.id))||null;
        const whRows=scopedInventory.filter((r:Row)=>String(r.warehouseId)===String(w.id));
        const whIssues=(data.issues||[]).filter((r:Row)=>String(r.warehouseId)===String(w.id));
        return <div className="overlay" onMouseDown={(e)=>e.target===e.currentTarget&&setOpenWarehouseId("")}><div className="modal card" data-vntech="warehouse-detail-modal">
          <div className="modal-head"><strong>CHI TIẾT KHO · {String(w.warehouseName||w.warehouseCode||"")}</strong><button type="button" onClick={()=>setOpenWarehouseId("")} aria-label="Đóng">✕</button></div>
          <div className="modal-body">
            <dl className="kv">
              <div><dt>Thủ kho</dt><dd>{keeper?String(keeper.fullName||keeper.username||keeper.id):<span className="muted">Chưa phân công</span>}</dd></div>
              <div><dt>Mã kho</dt><dd>{String(w.warehouseCode||"—")}</dd></div>
              <div><dt>Số vật tư đang có</dt><dd>{whRows.length}</dd></div>
              <div><dt>Số phiếu xuất</dt><dd>{whIssues.length}</dd></div>
            </dl>
            <h4>Lịch sử xuất kho</h4>
            <div className="table-wrap"><table><thead><tr><th>Số phiếu</th><th>Ngày</th><th>Vật tư</th><th>SL</th></tr></thead><tbody>{whIssues.slice(0,20).map((r:Row)=><tr key={String(r.id)}><td>{String(r.issueNo||"—")}</td><td>{String(r.issuedAt||"").slice(0,10)||"—"}</td><td>{String(r.materialName||r.materialCode||"—")}</td><td>{format.format(r.issuedQty||r.qty||0)}</td></tr>)}</tbody></table></div>
            {!whIssues.length&&<small className="muted">Kho chưa có phiếu xuất.</small>}
            <h4>Danh mục vật tư trong kho</h4>
            <div className="table-wrap"><table><thead><tr><th>Mã</th><th>Tên vật tư</th><th>Tồn khả dụng</th><th>ĐVT</th></tr></thead><tbody>{whRows.slice(0,50).map((r:Row)=><tr key={String(`${r.warehouseId}-${r.materialId}`)}><td><strong>{String(r.materialCode||"—")}</strong></td><td>{String(r.materialName||"—")}</td><td>{format.format((r.available??r.balance)||0)}</td><td>{String(r.unit||"—")}</td></tr>)}</tbody></table></div>
            {!whRows.length&&<small className="muted">Kho chưa có vật tư nào.</small>}
          </div>
          <footer className="modal-actions"><button type="button" className="secondary" onClick={()=>setOpenWarehouseId("")}>Đóng</button></footer>
        </div></div>;})()}
    </div>{transferPanelOpen&&<div className="overlay" onMouseDown={(event)=>{if(event.target===event.currentTarget)setTransferPanelOpen(false);}}><div className="modal" role="dialog" aria-modal="true" aria-label="Tạo phiếu nhập / xuất / điều chuyển"><aside className="card inventory-transfer-panel"><h2>TẠO PHIẾU NHẬP / XUẤT / ĐIỀU CHUYỂN</h2><div className="switch-tabs"><span className="active" aria-current="page">ĐIỀU CHUYỂN</span><button onClick={()=>open("receipt")}>NHẬP KHO</button><button onClick={()=>open("issue")}>XUẤT KHO</button></div><div className="scope-lock-note">Biểu mẫu điều chuyển đầy đủ sẽ mở khi bấm nút bên dưới; Kho nguồn/đích, vật tư, số lượng và ghi chú được kiểm tra tại biểu mẫu thật.</div><button className="primary wide" onClick={()=>open("transfer")}>TẠO PHIẾU ĐIỀU CHUYỂN</button><div className="scope-lock-note">🔒 Chỉ hiển thị kho/dự án thuộc phạm vi tài khoản. Thủ kho dự án không thao tác Kho Tổng; Thủ kho Tổng không thao tác kho dự án.</div><div className="qr-card compact"><h2>MÃ VẠCH / QR CODE</h2><div className="barcode-preview">|||| ||| | ||||</div><button className="secondary" disabled={!filtered.length} onClick={()=>printInventoryBarcodes(filtered)}>IN TEM MÃ</button></div></aside><footer className="modal-actions"><button type="button" className="secondary" data-vntech="close-transfer-panel" onClick={()=>setTransferPanelOpen(false)}>Đóng</button></footer></div></div>}</div>
    <section className="card" data-vntech="issue-list-screen">
      <ListToolbar
        title="DANH SÁCH PHIẾU XUẤT · ĐƠN XUẤT KHO"
        note="§7.5 — phiếu xuất kho cho tổ đội (nguồn: stock_issues + stock_issue_items). Tạo mới qua nút «XUẤT KHO» phía trên. ⛔ Không có sửa/xoá phiếu xuất: backend chưa khai báo action — không bịa nghiệp vụ (§14/§20)."
        count={issueRows.length} total={scopeIssues.length} unit="phiếu"
        search={{ value: issueQuery, onChange: setIssueQuery, placeholder: "Tìm phiếu xuất · dự án · tổ đội · người nhận..." }}
        sort={{ value: issueSortKey, onChange: setIssueSortKey, options: [{ value: "issuedAt", label: "Ngày xuất" }, { value: "issueNo", label: "Số phiếu" }, { value: "project", label: "Dự án" }, { value: "qty_desc", label: "Số lượng — cao nhất" }] }}
        filters={[{ key: "status", label: "Trạng thái", value: issueStatus, onChange: setIssueStatus, options: [{ value: "ALL", label: "Tất cả trạng thái" }, ...issueStatusOptions.map((s) => ({ value: s, label: s }))] }]}
        actions={<button type="button" className="primary" data-vntech="open-transfer-panel" onClick={()=>setTransferPanelOpen(true)}>＋ TẠO PHIẾU NHẬP / XUẤT / ĐIỀU CHUYỂN</button>}
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
        { key: "c9", header: "Trạng thái", render: (row) => <><StatusBadge value={String(row.status) === "issued" ? "Đã xuất" : statusLabel(row.status)} /></> },
      ]} emptyText="Chưa có phiếu xuất kho nào trong phạm vi." />
      <div className="table-pagination functional-summary"><span>Hiển thị {issueRows.length}/{scopeIssues.length} phiếu xuất phù hợp bộ lọc.</span></div>
    </section>
  </div>;
}
export {
  Inventory,
};