// PHASE 1 — THƯ VIỆN THÀNH PHẦN DÙNG CHUNG
//
// Một nguồn duy nhất cho các thành phần lặp lại khắp hệ thống. Mục tiêu (theo yêu cầu §4):
// nhiều màn có cùng khuôn thì KHÔNG tạo nhiều implementation độc lập.
//
//   import { ListToolbar, DataTable, StatusBadge, PermissionGuard,
//            ApprovalTimeline, ActivityTimeline, EntityDetailModal } from "@/app/components/ui";

export { StatusBadge, toneOf, type Tone } from "./StatusBadge";
export { PermissionGuard, hasPermission } from "./PermissionGuard";
export { ListToolbar, type ToolbarFilter, type Option } from "./ListToolbar";
export { DataTable, type Column } from "./DataTable";
export { ApprovalTimeline, ActivityTimeline, type ApprovalStep, type ApprovalStepStatus, type ActivityItem } from "./Timeline";
export { EntityDetailModal, GuardedEntityModal, type DetailTab } from "./EntityDetailModal";
