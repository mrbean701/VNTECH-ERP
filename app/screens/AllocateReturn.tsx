// MT2-P9-06 (§7.6) — «Cấp phát — Hoàn trả» (MENU ITEM MỚI: `warehouse_allocate_return`).
//
// §7.6 NGUYÊN VĂN: `[ Cấp phát ] [ Hoàn trả ]` — mỗi tab hiển thị DANH SÁCH RIÊNG.
// Thông tin cơ bản: mã đơn · người tạo · tổ đội/người nhận · dự án · kho xuất · kho nhập (đối với hoàn trả).
// ⚠️ «Logic nghiệp vụ + workflow + quyền sẽ triển khai SAU khi business rule được xác định ⇒ hiện tại
//    CHỈ triển khai cấu trúc UI/list/tab/data foundation phù hợp. ⛔ Không tự suy diễn nghiệp vụ» (§14).
//
// DỮ LIỆU THẬT CÓ SẴN (BootstrapDataAdapter):
//   · Cấp phát ← `data.issues`: issueNo · projectCode · teamName · receivedByName · issuedAt · status ·
//     totalQty · installedQty — ⚠️ KHÔNG có "người tạo"/"kho xuất" ⇒ hiển thị "—" (§14, ⛔ không bịa).
//   · Hoàn trả ← `data.returns`: returnNo · projectCode · teamName · returnedByName · returnedAt · status ·
//     acceptedQty — ⚠️ KHÔNG có "kho nhập" ⇒ hiển thị "—" (§14, ⛔ không bịa).

import { DataTable, ListToolbar, StatusBadge } from "@/app/components/ui";
import { format } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import { useState } from "react";

const ALLOCATE_RETURN_TABS = ["Cấp phát", "Hoàn trả"] as const;

function AllocateReturn({ data, project }: { data: AppData; project: string }) {
  const [tab, setTab] = useState(0);
  const scopeIssues = (data.issues || []).filter((row) => project === "ALL" || row.projectId === project);
  const scopeReturns = (data.returns || []).filter((row) => project === "ALL" || row.projectId === project);

  return (
    <div className="stack baseline-screen">
      <section className="card inventory-tabs-card" data-vntech="allocate-return-screen">
        <ListToolbar
          title="CẤP PHÁT & HOÀN TRẢ VẬT TƯ"
          note="§7.6 — hai tab của cùng một màn; hiện tại CHỈ cấu trúc UI/list/tab/data foundation, ⛔ chưa triển khai nghiệp vụ/workflow/quyền."
          count={tab === 0 ? scopeIssues.length : scopeReturns.length}
          total={(tab === 0 ? scopeIssues : scopeReturns).length}
          unit={tab === 0 ? "phiếu cấp phát" : "phiếu hoàn trả"}
          extra={<div className="project-scope-tabs" role="tablist" aria-label="Cấp phát và hoàn trả">{ALLOCATE_RETURN_TABS.map((label, index) => <button type="button" key={label} role="tab" aria-selected={tab === index} className={tab === index ? "active" : ""} data-allocate-return-tab={String(index)} onClick={() => setTab(index)}>{label}</button>)}</div>}
        />
        {tab === 0 ? (
          <DataTable rows={scopeIssues} rowKey={(row, index) => String(`${row.id}-${index}`)} columns={[
            { key: "c1", header: "#", render: (row, index) => <>{index + 1}</> },
            { key: "c2", header: "Mã đơn", render: (row) => <><strong className="link">{row.issueNo}</strong></> },
            { key: "c3", header: "Người tạo", render: () => <span className="muted">—</span> },
            { key: "c4", header: "Tổ đội / người nhận", render: (row) => <>{row.teamName} · {row.receivedByName || "—"}</> },
            { key: "c5", header: "Dự án", render: (row) => <>{row.projectCode}</> },
            { key: "c6", header: "Kho xuất", render: () => <span className="muted">—</span> },
            { key: "c7", header: "Ngày xuất", render: (row) => <>{row.issuedAt ? String(row.issuedAt).slice(0, 10) : "—"}</> },
            { key: "c8", header: "SL xuất", render: (row) => <><strong>{format.format(row.totalQty || 0)}</strong></> },
            { key: "c9", header: "Trạng thái", render: (row) => <><StatusBadge value={String(row.status) === "issued" ? "Đã xuất" : String(row.status)} /></> },
          ]} emptyText="Chưa có phiếu cấp phát trong phạm vi." />
        ) : (
          <DataTable rows={scopeReturns} rowKey={(row, index) => String(`${row.id}-${index}`)} columns={[
            { key: "c1", header: "#", render: (row, index) => <>{index + 1}</> },
            { key: "c2", header: "Mã đơn", render: (row) => <><strong className="link">{row.returnNo}</strong></> },
            { key: "c3", header: "Người tạo / trả", render: (row) => <>{row.returnedByName || "—"}</> },
            { key: "c4", header: "Tổ đội / người nhận", render: (row) => <>{row.teamName} · {row.returnedByName || "—"}</> },
            { key: "c5", header: "Dự án", render: (row) => <>{row.projectCode}</> },
            { key: "c6", header: "Kho nhập", render: () => <span className="muted">—</span> },
            { key: "c7", header: "Ngày trả", render: (row) => <>{row.returnedAt ? String(row.returnedAt).slice(0, 10) : "—"}</> },
            { key: "c8", header: "SL nhận", render: (row) => <><strong>{format.format(row.acceptedQty || 0)}</strong></> },
            { key: "c9", header: "Trạng thái", render: (row) => <><StatusBadge value={String(row.status)} /></> },
          ]} emptyText="Chưa có phiếu hoàn trả trong phạm vi." />
        )}
        <div className="table-pagination functional-summary"><span>{tab === 0 ? `Hiển thị ${scopeIssues.length} phiếu cấp phát.` : `Hiển thị ${scopeReturns.length} phiếu hoàn trả.`}</span></div>
      </section>
    </div>
  );
}

export { AllocateReturn };