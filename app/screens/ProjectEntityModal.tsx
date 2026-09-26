"use client";

// PHASE 4 (`PR-04` + `PR-06`) — MỘT CỔNG DUY NHẤT MỞ `EntityDetailModal` CHO 4 THỰC THỂ CỦA MÀN DỰ ÁN.
//
// Nguồn yêu cầu: `docs/25_TODO_ROADMAP.md` PHASE 4 dòng `PR-04` — nguyên văn:
//   "Bấm vào Project/User/Warehouse/Team → mở **EntityDetailModal**"
// và dòng `PR-06` phần "link entity mở modal".
//
// Vì sao gom vào MỘT tệp: màn dự án trước đây mở 3 loại cửa sổ khác nhau (`open("userProfile", …)`,
// `open("teamCreate", …)`, khối `openWarehouse` tự dựng) ⇒ cùng một thực thể mà mỗi chỗ một kiểu.
// Nay mọi chỗ bấm Project/User/Warehouse/Team đều đi qua CÙNG một component dùng chung `EntityDetailModal`
// (U-01) — có tab động, trạng thái rỗng/lỗi/không-có-quyền và giới hạn chiều cao (U-10).
//
// DỮ LIỆU: chỉ đọc các bảng ĐANG CÓ trong bootstrap (`projects`, `users/staffDirectory`, `user_project_scopes`,
// `teams`, `team_members`, `warehouses`, `inventory`, `goods_receipts`, `material_requests`, `purchase_orders`).

import { EntityDetailModal, StatusBadge, type DetailTab } from "@/app/components/ui";
import { Empty, date, format, money, PROJECT_STATUS_LABELS } from "@/lib/ui-shared";
import type { AppData, Row } from "@/lib/ui-shared";
import type { ReactNode } from "react";

export type ProjectEntityKind = "project" | "user" | "warehouse" | "team";
export type ProjectEntity = { kind: ProjectEntityKind; row: Row };

type ProjectEntityModalProps = {
  data: AppData;
  entity: ProjectEntity | null;
  onClose: () => void;
  permission: Row;
};

/** Bảng 2 cột "Hạng mục | Giá trị" — dùng lại cho mọi loại thực thể. */
function InfoTable({ rows }: { rows: { label: string; value: ReactNode; source: string }[] }) {
  return <div className="table-wrap"><table className="baseline-table">
    <thead><tr><th>Hạng mục</th><th>Giá trị</th><th>Nguồn</th></tr></thead>
    <tbody>
      {rows.map((item) => <tr key={item.label}><td>{item.label}</td><td><strong>{item.value === "" || item.value === undefined || item.value === null ? "—" : item.value}</strong></td><td><small>{item.source}</small></td></tr>)}
    </tbody>
  </table></div>;
}

/** Bảng dữ liệu đơn giản (tiêu đề cột + các dòng ô). */
function SimpleTable({ headers, rows, emptyText }: { headers: string[]; rows: ReactNode[][]; emptyText: string }) {
  if (!rows.length) return <Empty text={emptyText} />;
  return <div className="table-wrap"><table className="baseline-table">
    <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
    <tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody>
  </table></div>;
}

/**
 * Cổng modal thực thể của màn dự án. `entity = null` ⇒ không render gì.
 * Trả về `null` sớm nên KHÔNG dùng hook nào ⇒ an toàn với quy tắc hook của React.
 */
function ProjectEntityModal({ data, entity, onClose, permission }: ProjectEntityModalProps) {
  if (!entity) return null;
  const row: Row = entity.row;
  const directory: Row[] = data.staffDirectory || [];
  // QUYỀN=CHECK: quyền xem đi từ module đang mở (`site_command`), thiếu thì `EntityDetailModal` tự
  // hiển thị màn từ chối — KHÔNG ẩn modal để người dùng biết vì sao.
  const canView = permission?.canView === undefined ? true : Boolean(permission.canView) || Boolean(permission.canUse);

  let title = "Chi tiết thực thể";
  let subtitle: string = String(row.code || row.fullName || row.id || "");
  let tabs: DetailTab[] = [];

  switch (entity.kind) {
    case "project": {
      const pid = String(row.id);
      const staff = (data.userScopes || []).filter((scope) => String(scope.projectId) === pid).map((scope) => directory.find((user) => String(user.id) === String(scope.userId))).filter(Boolean) as Row[];
      const teams = (data.teams || []).filter((team) => String(team.projectId) === pid);
      const warehouses = (data.warehouses || []).filter((warehouse) => String(warehouse.projectId) === pid);
      title = `Chi tiết dự án · ${row.code || pid}`;
      subtitle = String(row.name || "");
      tabs = [
        { key: "info", label: "Thông tin chung", content: <InfoTable rows={[
          { label: "Mã dự án", value: row.code, source: "projects.code" },
          { label: "Tên dự án", value: row.name, source: "projects.name" },
          { label: "Trạng thái", value: <StatusBadge value={PROJECT_STATUS_LABELS[String(row.status || "active")] || String(row.status || "—")}/>, source: "projects.status" },
          { label: "Số hợp đồng", value: row.contractNo, source: "projects.contract_no" },
          { label: "Tên hợp đồng", value: row.contractName, source: "projects.contract_name" },
          { label: "Bắt đầu", value: date(row.startDate), source: "projects.start_date" },
          { label: "Kết thúc dự kiến", value: date(row.plannedEndDate), source: "projects.planned_end_date" },
        ]}/> },
        { key: "staff", label: "Nhân sự", badge: staff.length, content: staff.length ? <SimpleTable headers={["Họ tên", "Mã NV", "Chức vụ", "Phòng ban"]} rows={staff.map((user) => [user.fullName, user.employeeCode || "—", user.roleName || user.role || "—", user.organizationName || user.department || "—"])} emptyText="Dự án chưa gán nhân sự."/> : <Empty text="Dự án chưa gán nhân sự nào."/> },
        { key: "teams", label: "Tổ đội", badge: teams.length, content: teams.length ? <SimpleTable headers={["Mã", "Tên", "Hạng mục"]} rows={teams.map((team) => [team.code, team.name, team.trade || "—"])} emptyText="Dự án chưa có tổ đội."/> : <Empty text="Dự án chưa có tổ đội."/> },
        { key: "warehouses", label: "Kho", badge: warehouses.length, content: warehouses.length ? <SimpleTable headers={["Mã kho", "Tên kho", "Loại"]} rows={warehouses.map((warehouse) => [warehouse.code, warehouse.name, warehouse.type === "site" ? "Kho công trường" : String(warehouse.type || "—")])} emptyText="Dự án chưa có kho."/> : <Empty text="Dự án chưa có kho."/> },
        { key: "history", label: "Lịch sử", content: <InfoTable rows={[
          { label: "Nhân sự tham gia", value: `${staff.length} người`, source: "user_project_scopes" },
          { label: "Tổ đội", value: `${teams.length} tổ đội`, source: "teams" },
          { label: "Kho", value: `${warehouses.length} kho`, source: "warehouses" },
          { label: "% tiến độ", value: "Chưa có nguồn dữ liệu (chờ nghiệp vụ NHẬT KÝ THI CÔNG)", source: "projects không có cột tiến độ" },
        ]}/> },
      ];
      break;
    }
    case "user": {
      const userId = String(row.id);
      const userScopes = (data.userScopes || []).filter((scope) => String(scope.userId) === userId);
      const teams = (data.teamMembers || []).filter((member) => String(member.userId) === userId);
      const warehouses = (data.userWarehouseScopes || []).filter((scope) => String(scope.userId) === userId);
      title = `Chi tiết nhân sự · ${row.fullName || userId}`;
      subtitle = `${row.employeeCode || row.username || ""}${row.roleName ? ` · ${row.roleName}` : ""}`;
      tabs = [
        { key: "info", label: "Hồ sơ", content: <InfoTable rows={[
          { label: "Họ tên", value: row.fullName, source: "users.full_name" },
          { label: "Mã nhân viên", value: row.employeeCode, source: "users.employee_code" },
          { label: "Tài khoản", value: row.username, source: "users.username" },
          { label: "Email", value: row.email, source: "users.email" },
          { label: "Chức danh", value: row.roleName || row.role, source: "role_catalog.name" },
          { label: "Phòng ban", value: row.organizationName || row.department, source: "organization_units.name" },
          { label: "Cấp hệ thống", value: row.systemLevelCode, source: "users.system_level_code" },
          { label: "Trạng thái", value: <StatusBadge value={row.active === false ? "Đã khoá" : "Đang hoạt động"}/>, source: "users.active" },
        ]}/> },
        { key: "projects", label: "Dự án tham gia", badge: userScopes.length, content: userScopes.length ? <SimpleTable headers={["Dự án", "Phạm vi", "Ngày tham gia"]} rows={userScopes.map((scope) => [scope.projectCode || scope.projectId, scope.permission || "—", scope.joinedAt ? date(scope.joinedAt) : "—"])} emptyText="Chưa tham gia dự án nào."/> : <Empty text="Chưa tham gia dự án nào."/> },
        { key: "teams", label: "Tổ đội", badge: teams.length, content: teams.length ? <SimpleTable headers={["Tổ đội", "Vai trò", "Tham gia"]} rows={teams.map((member) => [member.teamId, member.roleInTeam || "—", member.joinedAt ? date(member.joinedAt) : "—"])} emptyText="Chưa vào tổ đội nào."/> : <Empty text="Chưa vào tổ đội nào."/> },
        { key: "warehouses", label: "Kho phụ trách", badge: warehouses.length, content: warehouses.length ? <SimpleTable headers={["Kho", "Phạm vi"]} rows={warehouses.map((scope) => [scope.warehouseCode || scope.warehouseId, scope.permission || scope.scope || "—"])} emptyText="Chưa gán kho nào."/> : <Empty text="Chưa gán kho nào."/> },
      ];
      break;
    }
    case "warehouse": {
      const wid = String(row.id);
      const inventory = (data.inventory || []).filter((item) => String(item.warehouseId) === wid && Number(item.balance || 0) !== 0);
      const receipts = (data.receipts || []).filter((item) => String(item.warehouseId) === wid);
      const issues = (data.issues || []).filter((item) => String(item.warehouseId) === wid);
      const requests = (data.requests || []).filter((item) => String(item.projectId) === String(row.projectId || ""));
      title = `Chi tiết kho · ${row.code || wid}`;
      subtitle = String(row.name || "");
      tabs = [
        { key: "info", label: "Thông tin", content: <InfoTable rows={[
          { label: "Mã kho", value: row.code, source: "warehouses.code" },
          { label: "Tên kho", value: row.name, source: "warehouses.name" },
          { label: "Loại", value: row.type === "site" ? "Kho công trường" : row.type === "central" ? "Kho tổng" : row.type === "team" ? "Kho tổ đội" : row.type, source: "warehouses.type" },
          { label: "Dự án", value: (data.projects || []).find((project) => String(project.id) === String(row.projectId))?.code || "—", source: "warehouses.project_id" },
          { label: "Kho cha", value: row.parentWarehouseId, source: "warehouses.parent_warehouse_id" },
        ]}/> },
        { key: "stock", label: "Tồn kho", badge: inventory.length, content: inventory.length ? <SimpleTable headers={["Mã vật tư", "Tên vật tư", "ĐVT", "Tồn"]} rows={inventory.map((item) => [item.materialCode || item.materialId, item.materialName || "—", item.unit || "—", format.format(Number(item.balance || 0))])} emptyText="Kho chưa có tồn."/> : <Empty text="Kho chưa có tồn."/> },
        { key: "docs", label: "Đơn từ", badge: receipts.length + issues.length + requests.length, content: <InfoTable rows={[
          { label: "Phiếu nhập kho", value: `${receipts.length} phiếu`, source: "goods_receipts.warehouse_id" },
          { label: "Phiếu xuất kho", value: `${issues.length} phiếu`, source: "goods_issues.warehouse_id" },
          { label: "Phiếu đề nghị của dự án", value: `${requests.length} phiếu`, source: "material_requests.project_id" },
          { label: "Giá trị PO chưa hoàn thành", value: money((data.purchaseOrders || []).filter((po) => String(po.projectId) === String(row.projectId || "") && !["completed", "received", "cancelled"].includes(String(po.status || ""))).reduce((sum, po) => sum + Number(po.totalValue || 0), 0)), source: "purchase_orders" },
        ]}/> },
      ];
      break;
    }
    case "team": {
      const tid = String(row.id);
      const members = (data.teamMembers || []).filter((member) => String(member.teamId) === tid);
      const warehouse = (data.warehouses || []).find((item) => String(item.id) === String(row.warehouseId));
      title = `Chi tiết tổ đội · ${row.code || tid}`;
      subtitle = String(row.name || "");
      tabs = [
        { key: "info", label: "Thông tin", content: <InfoTable rows={[
          { label: "Mã tổ đội", value: row.code, source: "teams.code" },
          { label: "Tên tổ đội", value: row.name, source: "teams.name" },
          { label: "Hạng mục", value: row.trade, source: "teams.trade" },
          { label: "Dự án", value: (data.projects || []).find((project) => String(project.id) === String(row.projectId))?.code || "—", source: "teams.project_id" },
          { label: "Kho của tổ đội", value: warehouse ? `${warehouse.code} · ${warehouse.name}` : "—", source: "teams.warehouse_id" },
          { label: "Trạng thái", value: row.active === 0 ? "Đã ngừng" : "Đang dùng", source: "teams.active" },
        ]}/> },
        { key: "members", label: "Thành viên", badge: members.length, content: members.length ? <SimpleTable headers={["Họ tên", "Mã NV", "Vai trò", "Tham gia"]} rows={members.map((member) => [member.fullName || member.userId, member.employeeCode || "—", member.roleInTeam || "—", member.joinedAt ? date(member.joinedAt) : "—"])} emptyText="Tổ đội chưa ghi nhận thành viên."/> : <Empty text="Tổ đội chưa ghi nhận thành viên."/> },
        { key: "warehouse", label: "Kho", content: warehouse ? <SimpleTable headers={["Mã kho", "Tên kho", "Loại"]} rows={[[warehouse.code, warehouse.name, warehouse.type === "site" ? "Kho công trường" : String(warehouse.type || "—")]]} emptyText="Chưa gắn kho."/> : <Empty text="Tổ đội chưa gắn kho."/> },
      ];
      break;
    }
  }

  return <EntityDetailModal
    open
    onClose={onClose}
    title={title}
    subtitle={subtitle}
    entityId={String(row.code || row.id || "")}
    width="wide"
    canView={canView}
    tabs={tabs}
    footer={<div className="row-actions"><button type="button" className="secondary" onClick={onClose}>Đóng</button></div>}
  />;
}

export { ProjectEntityModal, InfoTable, SimpleTable };
export default ProjectEntityModal;
