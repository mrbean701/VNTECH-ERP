/* Template preflight markers: Mẫu Excel Phiếu đề nghị | Mẫu Excel BOQ/HĐ | Mẫu Excel Danh mục */
"use client";

// VNTECH PROPRIETARY SOURCE | Owner: CÔNG TY CỔ PHẦN THƯƠNG MẠI ĐẦU TƯ PHÁT TRIỂN CÔNG NGHỆ VIỆT (VNTECH) | Product: VNTECH-KHO-MEP-001 | Fingerprint: SSOT

import { Component, FormEvent, Fragment, ReactNode, useCallback, useEffect, useMemo, useState, type CSSProperties, type MouseEvent as ReactMouseEvent, type ChangeEvent } from "react";
import { downloadMaterialTemplate, downloadMaterialTemplateCsv, parseMaterialFile, parseSpreadsheetRows, type ImportMaterial } from "@/lib/material-import";
import { downloadRequestPdf, downloadRequestXlsx, downloadSupplyPdf, downloadSupplyXlsx, type RequestExportDocument, type SupplyExportDocument } from "@/lib/request-export";
import { downloadBoqCsv, downloadBoqPdf, downloadBoqPriceTemplateXlsx, downloadBoqTemplateCsv, downloadBoqTemplateXlsx, downloadBoqXlsx, pdfFromJpegs } from "@/lib/boq-export";
import { downloadMaterialCatalogXlsx } from "@/lib/material-catalog-export";
import { VNTECH_BRAND } from "@/lib/vntech-brand";
import { configuredFormFields, fieldConfig, mergedFormFields, type FormFieldConfig } from "@/lib/form-fields";
import { downloadBlob, downloadCsv, downloadPublicTemplate, downloadSimpleXlsx, type TableCell } from "@/lib/tabular-export";
import { mapProjectBulkSheet, mapUserBulkSheet, PROJECT_BULK_HEADERS, USER_BULK_HEADERS } from "@/lib/admin-bulk-import";
// PHASE 1 — THƯ VIỆN THÀNH PHẦN DÙNG CHUNG (app/components/ui).
// Một nguồn duy nhất cho các khuôn lặp lại: thanh công cụ danh sách, bảng dữ liệu, nhãn
// trạng thái, chặn theo quyền, dải phê duyệt/hoạt động, và khung chi tiết thực thể.
// Xem docs/24 §4 và docs/25 PHASE 1.
import {
  ActivityTimeline, ApprovalTimeline, DataTable, EntityDetailModal,
  ListToolbar, PermissionGuard, StatusBadge,
  type ApprovalStep,
} from "@/app/components/ui";

// Dynamic rows are normalized by the server API and intentionally remain flexible here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
type ModuleKey = "dashboard" | "dept_plan_tasks" | "dept_plan_assign" | "dept_plan_supply_plan" | "dept_plan_tender" | "dept_plan_rfq" | "dept_plan_purchasing" | "dept_plan_supply" | "dept_plan_contracts" | "dept_plan_suppliers" | "dept_plan_price_data" | "dept_plan_kpi" | "dept_plan_alerts" | "dept_project_tasks" | "dept_project_pda" | "dept_project_assign" | "dept_project_plan" | "dept_project_shop" | "dept_project_boq" | "dept_project_material" | "dept_project_issues" | "dept_project_asbuilt" | "dept_project_payment" | "dept_project_tender" | "dept_project_kpi" | "dept_project_alerts" | "dept_finance_payment_plan" | "dept_finance_recovery" | "dept_finance_advance" | "dept_finance_site_cost" | "dept_finance_cashbank" | "dept_finance_documents" | "dept_legal_hr" | "dept_legal_labor" | "dept_legal_correspondence" | "dept_legal_documents" | "dept_legal_seal" | "dept_legal_benefits" | "site_command" | "project_progress" | "construction" | "production" | "capital_recovery" | "requests" | "approvals" | "purchasing" | "supplier_catalog" | "receiving" | "delivered" | "warehouse_receipt" | "warehouse_issue" | "inventory" | "material_norms" | "central_warehouse" | "material_catalog" | "boq" | "payments" | "teams" | "stocktake" | "reports" | "admin";
type AppData = {
  user: Row; settings: Row; productIdentity: Row; projects: Row[]; adminProjects: Row[]; teams: Row[]; warehouses: Row[]; transferWarehouses: Row[]; materials: Row[]; adminMaterials: Row[]; materialCategories: Row[]; adminMaterialCategories: Row[]; materialSubcategories: Row[]; adminMaterialSubcategories: Row[]; materialNorms: Row[]; suppliers: Row[]; adminSuppliers: Row[]; contractPayments: Row[]; productionReports: Row[]; capitalRecoveryRecords: Row[]; teamSubcontracts: Row[]; teamProductionRecords: Row[]; teamPayments: Row[]; teamSettlements: Row[];
  requests: Row[]; inventory: Row[]; centralInventory: Row[]; centralReturns: Row[]; companyAvailability: Row[]; transferOrders: Row[]; materialAliases: Row[]; boqItems: Row[]; boqSourceItems: Row[]; boqImportBatches: Row[]; boqChangeHistory: Row[]; projectContracts: Row[]; boqVersions: Row[]; contractStockLedger: Row[]; contractStockBalances: Row[]; stockReconciliations: Row[]; purchaseOrders: Row[]; receipts: Row[]; issues: Row[]; returns: Row[]; stockCounts: Row[]; users: Row[]; staffDirectory: Row[]; userScopes: Row[]; userWarehouseScopes: Row[]; modulePermissions: Row[]; allModulePermissions: Row[]; audits: Row[]; constructionDailyLogs: Row[]; constructionDailyLogItems: Row[]; paymentPlans: Row[]; advanceRequests: Row[]; siteExpenseClaims: Row[]; bankAccounts: Row[]; cashbookEntries: Row[]; accountingVouchers: Row[]; hrRecords: Row[]; laborContracts: Row[]; officialCorrespondence: Row[]; legalDocuments: Row[]; sealManagement: Row[]; benefitRecords: Row[]; workflowDefinitions: Row[]; workflowSteps: Row[]; workflowStepApprovers: Row[]; departmentModulePermissions: Row[]; systemLevelCatalog: Row[];
  emailSettings: Row | null; emailRecipients: Row[]; workflowAssignments: Row[]; emailOutbox: Row[]; supplySteps: Row[]; engineRoleProfiles: Row[]; businessScopes: Row[]; businessRoleGroupScopes: Row[]; businessRoleGroups: Row[]; roleCatalog: Row[]; organizationUnits: Row[]; approvalStages: Row[]; menuGroups: Row[]; moduleCatalog: Row[];
  workItems: Row[]; workItemEvents: Row[]; taskNotifications: Row[]; teamMembers?: Row[];
  activeSessions?: Row[]; serverInfo?: Row | null; trustStatus?: Row | null; formFieldConfigs?: FormFieldConfig[];
  uiDisplaySettings?: Row | null;
  projectAccessAll?: boolean;
};

const VNTECH_UI_CONTRACT_ID = VNTECH_BRAND.release.uiContractId;
const VNTECH_UI_BUILD_MARKER = VNTECH_BRAND.release.uiBuildMarker;
const VNTECH_FUNCTIONAL_UI_MARKER = VNTECH_BRAND.release.functionalUiMarker;
const VNTECH_UI_DISPLAY_VERSION = VNTECH_BRAND.release.uiGeneration;
const VNTECH_RUNTIME_REGRESSION_LOCK = VNTECH_BRAND.release.regressionContract;
const VNTECH_COMPANY_DISPLAY_NAME = VNTECH_BRAND.company.displayName;
const UI_NOW_MS = new Date().getTime();
const UI_TODAY = new Date(UI_NOW_MS).toISOString().slice(0, 10);
const DEFAULT_PO_ETA = new Date(UI_NOW_MS + 7 * 86400000).toISOString().slice(0, 10);

// Menu 11 mục theo nghiệp vụ. Nhóm "department_management" cũ đã được tách thành
// my_work / mep / finance / hr_legal / reports (xem migration V4__menu_restructure.sql).
const defaultMenuGroups = [
  { groupKey: "overview", name: "TỔNG QUAN", icon: "OV", sortOrder: 10, active: true, collapsible: false },
  { groupKey: "my_work", name: "CÔNG VIỆC", icon: "NV", sortOrder: 15, active: true, collapsible: true },
  { groupKey: "site_command", name: "QUẢN LÝ DỰ ÁN", icon: "DA", sortOrder: 25, active: true, collapsible: true },
  { groupKey: "mep", name: "MEP", icon: "MEP", sortOrder: 28, active: true, collapsible: true },
  { groupKey: "purchasing", name: "MUA HÀNG & CUNG ỨNG", icon: "MH", sortOrder: 30, active: true, collapsible: true },
  { groupKey: "warehouse", name: "KHO VẬT TƯ", icon: "KV", sortOrder: 40, active: true, collapsible: true },
  { groupKey: "teams", name: "TỔ ĐỘI", icon: "TD", sortOrder: 45, active: true, collapsible: true },
  { groupKey: "finance", name: "TÀI CHÍNH – KẾ TOÁN", icon: "TC", sortOrder: 50, active: true, collapsible: true },
  { groupKey: "hr_legal", name: "HÀNH CHÍNH – PHÁP CHẾ", icon: "HC", sortOrder: 55, active: true, collapsible: true },
  { groupKey: "reports", name: "BÁO CÁO", icon: "BC", sortOrder: 60, active: true, collapsible: true },
  { groupKey: "material_master", name: "DANH MỤC VẬT TƯ GỐC", icon: "MV", sortOrder: 70, active: true, collapsible: false },
  { groupKey: "system_admin", name: "QUẢN TRỊ HỆ THỐNG", icon: "QT", sortOrder: 80, active: true, collapsible: true },
];

const modules: { key: ModuleKey; label: string; icon: string; groupKey?: string; subGroup?: string }[] = [
  { key: "dashboard", label: "Tổng quan điều hành", icon: "OV", groupKey: "overview" },
  { key: "dept_plan_tasks", label: "Nhiệm vụ nhân viên đang làm", icon: "NV", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_assign", label: "Giao việc & Kiểm soát hoàn thành", icon: "GV", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_supply_plan", label: "Kế hoạch mua hàng & cung ứng", icon: "KH", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_tender", label: "Đấu thầu", icon: "DT", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_rfq", label: "Xin giá vật tư", icon: "RF", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_purchasing", label: "Mua hàng vật tư thiết bị", icon: "MH", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_supply", label: "Cung ứng vật tư cho dự án", icon: "CU", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_contracts", label: "Hợp đồng các loại", icon: "HD", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_suppliers", label: "Nhà cung cấp / Đối tác", icon: "NC", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_price_data", label: "Giá & dữ liệu thương mại", icon: "DG", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_kpi", label: "KPI & hiệu suất nhân viên", icon: "KP", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_plan_alerts", label: "Báo cáo & cảnh báo", icon: "CB", groupKey: "department_management", subGroup: "Phòng Kế hoạch" },
  { key: "dept_project_tasks", label: "Nhiệm vụ nhân viên đang làm", icon: "NV", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_pda", label: "PDA / Điều phối dự án", icon: "PD", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_assign", label: "Giao việc & Kiểm soát hoàn thành", icon: "GV", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_plan", label: "Kế hoạch triển khai dự án", icon: "KH", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_shop", label: "Shopdrawing & trình duyệt", icon: "SD", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_boq", label: "BOQ & bóc tách khối lượng", icon: "BQ", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_material", label: "Kiểm soát vật tư & đặt hàng", icon: "VT", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_issues", label: "Phát sinh / RFI / RFQ / NCR", icon: "PS", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_asbuilt", label: "Hoàn công", icon: "HC", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_payment", label: "Thanh toán / Quyết toán", icon: "TT", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_tender", label: "Đấu thầu kỹ thuật", icon: "DT", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_kpi", label: "KPI & hiệu suất nhân viên", icon: "KP", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_project_alerts", label: "Báo cáo & cảnh báo", icon: "CB", groupKey: "department_management", subGroup: "Phòng Dự án" },
  { key: "dept_finance_payment_plan", label: "Kế hoạch thanh toán", icon: "KT", groupKey: "department_management", subGroup: "Tài chính Kế toán" },
  { key: "dept_finance_recovery", label: "Thu hồi vốn / Công nợ", icon: "TH", groupKey: "department_management", subGroup: "Tài chính Kế toán" },
  { key: "dept_finance_advance", label: "Tạm ứng / Hoàn ứng", icon: "TU", groupKey: "department_management", subGroup: "Tài chính Kế toán" },
  { key: "dept_finance_site_cost", label: "Chi phí Ban chỉ huy", icon: "CP", groupKey: "department_management", subGroup: "Tài chính Kế toán" },
  { key: "dept_finance_cashbank", label: "Sổ quỹ & Ngân hàng", icon: "SQ", groupKey: "department_management", subGroup: "Tài chính Kế toán" },
  { key: "dept_finance_documents", label: "Chứng từ kế toán", icon: "CT", groupKey: "department_management", subGroup: "Tài chính Kế toán" },
  { key: "dept_legal_hr", label: "Hồ sơ nhân sự", icon: "NS", groupKey: "department_management", subGroup: "Hành chính Pháp chế" },
  { key: "dept_legal_labor", label: "Hợp đồng lao động", icon: "LD", groupKey: "department_management", subGroup: "Hành chính Pháp chế" },
  { key: "dept_legal_correspondence", label: "Công văn đến / đi", icon: "CV", groupKey: "department_management", subGroup: "Hành chính Pháp chế" },
  { key: "dept_legal_documents", label: "Văn bản pháp lý", icon: "PL", groupKey: "department_management", subGroup: "Hành chính Pháp chế" },
  { key: "dept_legal_seal", label: "Con dấu / Ủy quyền", icon: "CD", groupKey: "department_management", subGroup: "Hành chính Pháp chế" },
  { key: "dept_legal_benefits", label: "Bảo hiểm & Chế độ", icon: "BH", groupKey: "department_management", subGroup: "Hành chính Pháp chế" },
  { key: "site_command", label: "Quản lý dự án", icon: "BC", groupKey: "site_command" },
  { key: "project_progress", label: "Tiến độ & sản lượng dự án", icon: "TD", groupKey: "project_management" },
  { key: "construction", label: "Thi công", icon: "TC", groupKey: "project_management" },
  { key: "production", label: "Sản lượng", icon: "SL", groupKey: "project_management" },
  { key: "capital_recovery", label: "Thu hồi vốn", icon: "TH", groupKey: "project_management" },
  { key: "boq", label: "BOQ / Hợp đồng dự án", icon: "BQ", groupKey: "project_management" },
  { key: "payments", label: "Thanh toán HĐ", icon: "TT", groupKey: "project_management" },
  { key: "teams", label: "Tổ đội theo dự án", icon: "TĐ", groupKey: "project_management" },
  { key: "requests", label: "Phiếu đề nghị mua hàng", icon: "ĐN", groupKey: "purchasing" },
  { key: "approvals", label: "Phê duyệt đơn hàng", icon: "PD", groupKey: "purchasing" },
  { key: "purchasing", label: "Mua hàng & PO", icon: "PO", groupKey: "purchasing" },
  { key: "supplier_catalog", label: "Danh mục Nhà cung cấp", icon: "NC", groupKey: "purchasing" },
  { key: "receiving", label: "Kế hoạch giao hàng", icon: "GH", groupKey: "purchasing" },
  { key: "delivered", label: "Đơn hàng đã giao", icon: "DG", groupKey: "purchasing" },
  { key: "warehouse_receipt", label: "Nhập kho", icon: "NK", groupKey: "warehouse" },
  { key: "warehouse_issue", label: "Xuất kho", icon: "XK", groupKey: "warehouse" },
  { key: "inventory", label: "Tồn kho & điều chuyển", icon: "TK", groupKey: "warehouse" },
  { key: "stocktake", label: "Kiểm kê & hoàn trả", icon: "KK", groupKey: "warehouse" },
  { key: "material_norms", label: "Định mức vật tư theo dự án", icon: "ĐM", groupKey: "warehouse" },
  { key: "central_warehouse", label: "Kho Tổng", icon: "KT", groupKey: "warehouse" },
  { key: "material_catalog", label: "Danh mục vật tư gốc", icon: "MV", groupKey: "material_master" },
  { key: "admin", label: "Phân quyền & Cấu hình hệ thống", icon: "QT", groupKey: "system_admin" },
];

// PROJECT NAVIGATION CONSOLIDATION: BCH becomes the project workspace entry point.
// These are navigation aliases over existing modules; no backend/data model is duplicated or replaced.
const PROJECT_WORKSPACE_ITEMS: { key: ModuleKey; label: string; icon: string; related?: ModuleKey[] }[] = [
  { key: "site_command", label: "1. Tổng quan & Nhân sự dự án", icon: "BC" },
  { key: "project_progress", label: "2. Kế hoạch & Tiến độ thi công", icon: "TD" },
  { key: "requests", label: "3. Đề xuất & Nhu cầu dự án", icon: "ĐN", related: ["inventory", "warehouse_issue", "material_norms"] },
  { key: "construction", label: "4. Nhật ký & Điều hành hiện trường", icon: "TC" },
  { key: "production", label: "5. Sản lượng & Nghiệm thu chất lượng", icon: "SL" },
  { key: "teams", label: "6. Thầu phụ & Nhân công", icon: "TĐ" },
  { key: "boq", label: "7. Phát sinh (V.O) & BOQ/HĐ", icon: "BQ" },
  { key: "capital_recovery", label: "8. Tài chính & Thanh quyết toán", icon: "TH", related: ["payments"] },
];
const PROJECT_WORKSPACE_CONTEXT_KEYS = new Set<ModuleKey>(PROJECT_WORKSPACE_ITEMS.flatMap((item) => [item.key, ...(item.related || [])]));

const titles: Record<ModuleKey, [string, string]> = {
  dashboard: ["Tổng quan điều hành", "Theo dõi tổng thể dự án, hợp đồng, thu hồi vốn, mua hàng và tồn kho"],
  dept_plan_tasks: ["Nhiệm vụ nhân viên đang làm – Phòng Kế hoạch", "Task tự động từ nghiệp vụ + giao việc bổ sung; SLA tính ngay từ thời điểm giao"],
  dept_plan_assign: ["Giao việc & Kiểm soát hoàn thành – Phòng Kế hoạch", "Quản lý task tự động và giao bổ sung các việc không có chứng từ nguồn"],
  dept_plan_supply_plan: ["Kế hoạch mua hàng & cung ứng", "Theo dõi kế hoạch mua, ngày cần hàng, PO, ETA và rủi ro cung ứng"],
  dept_plan_tender: ["Đấu thầu – Phòng Kế hoạch", "Workstream thương mại của gói thầu; liên kết Tender ID nhưng tách nhiệm vụ kỹ thuật"],
  dept_plan_rfq: ["Xin giá vật tư", "RFQ/báo giá lấy mã vật tư và khối lượng từ nghiệp vụ nguồn, không nhập lại"],
  dept_plan_purchasing: ["Mua hàng vật tư thiết bị", "Phòng Kế hoạch xử lý NCC, thương mại và PO; không sửa ngược dữ liệu kỹ thuật"],
  dept_plan_supply: ["Cung ứng vật tư cho dự án", "Theo dõi ETA, giao hàng, giao thiếu/giao bù và OTD"],
  dept_plan_contracts: ["Hợp đồng các loại", "Soạn, thương thảo, trình ký, hiệu lực, nghĩa vụ và thanh lý"],
  dept_plan_suppliers: ["Nhà cung cấp / Đối tác", "Hồ sơ, ngành hàng, lịch sử giá, mua hàng, OTD và đánh giá NCC"],
  dept_plan_price_data: ["Giá & dữ liệu thương mại", "Kho dữ liệu giá từ RFQ/PO/Hợp đồng theo mã vật tư nội bộ"],
  dept_plan_kpi: ["KPI & hiệu suất nhân viên – Phòng Kế hoạch", "KPI từ timestamp/event thật; tách chờ bên ngoài khỏi chậm do nhân viên"],
  dept_plan_alerts: ["Báo cáo & cảnh báo – Phòng Kế hoạch", "Cảnh báo MR/RFQ/PO/Hợp đồng/cung ứng tới đúng người chịu trách nhiệm"],
  dept_project_tasks: ["Nhiệm vụ nhân viên đang làm – Phòng Dự án", "Shop/BOQ/vật tư/RFI/hoàn công/thanh toán/đấu thầu kỹ thuật theo Task Engine"],
  dept_project_pda: ["PDA / Điều phối dự án", "Project Control của Phòng Dự án; không phải thư ký hành chính"],
  dept_project_assign: ["Giao việc & Kiểm soát hoàn thành – Phòng Dự án", "Task tự động theo nghiệp vụ + giao bổ sung; giữ lịch sử người giao, SLA và đầu ra"],
  dept_project_plan: ["Kế hoạch triển khai dự án", "Kế hoạch Shop, trình duyệt, vật tư, sản lượng, thanh toán và milestone"],
  dept_project_shop: ["Shopdrawing & trình duyệt", "Lập → kiểm → trình → chờ CĐT/TVGS → revision → approved"],
  dept_project_boq: ["BOQ & bóc tách khối lượng", "Khối lượng truy vết bản vẽ/khu vực; dùng mã vật tư nội bộ chung"],
  dept_project_material: ["Kiểm soát vật tư & đặt hàng", "Phòng Dự án kiểm mua gì/bao nhiêu/đúng kỹ thuật; Phòng Kế hoạch xử lý thương mại"],
  dept_project_issues: ["Phát sinh / RFI / RFQ / NCR", "Pháp lý và làm rõ kỹ thuật trước triển khai theo quy trình"],
  dept_project_asbuilt: ["Hoàn công", "Theo dõi hoàn công đồng thời với thi công, không dồn cuối dự án"],
  dept_project_payment: ["Thanh toán / Quyết toán", "Đối chiếu sản lượng, nghiệm thu, pháp lý, phát sinh và hồ sơ thanh toán"],
  dept_project_tender: ["Đấu thầu kỹ thuật", "Workstream kỹ thuật dùng chung Tender ID với Phòng Kế hoạch nhưng nhiệm vụ độc lập"],
  dept_project_kpi: ["KPI & hiệu suất nhân viên – Phòng Dự án", "KPI Shop, vật tư, phát sinh, hoàn công, thanh toán và rủi ro từ dữ liệu thật"],
  dept_project_alerts: ["Báo cáo & cảnh báo – Phòng Dự án", "Cảnh báo Shop/BOQ/MR/RFI/hoàn công/thanh toán theo đúng nguyên nhân"],
  dept_finance_payment_plan: ["Kế hoạch thanh toán", "Lịch thanh toán theo HĐ/PO/milestone; đối chiếu tiền thực thu từ Thanh toán HĐ"],
  dept_finance_recovery: ["Thu hồi vốn / Công nợ", "Chuỗi sản lượng duyệt → hồ sơ → hóa đơn → tiền thực thu → công nợ theo dự án; góc nhìn tổng hợp của Phòng Tài chính"],
  dept_finance_advance: ["Tạm ứng / Hoàn ứng", "Tạm ứng mua hàng/công tác/chi phí hiện trường và hoàn ứng khi đủ chứng từ"],
  dept_finance_site_cost: ["Chi phí Ban chỉ huy", "Chi phí ăn ở, đi lại, vật tư phụ trợ, nhân công BCH theo dự án; duyệt theo phân quyền"],
  dept_finance_cashbank: ["Sổ quỹ & Ngân hàng", "Sổ quỹ tiền mặt và tài khoản ngân hàng; số dư = mở đầu + thu − chi"],
  dept_finance_documents: ["Chứng từ kế toán", "Đăng ký chứng từ gốc (thu/chi/hóa đơn/phiếu nhập-xuất) liên kết nguồn nghiệp vụ"],
  dept_legal_hr: ["Hồ sơ nhân sự", "Hồ sơ chi tiết (CCCD, địa chỉ, trình độ, ngày vào, chức danh) liên kết tài khoản nhân sự"],
  dept_legal_labor: ["Hợp đồng lao động", "Hợp đồng thử việc/xác định thời hạn/không thời hạn; theo dõi hết hạn để gia hạn"],
  dept_legal_correspondence: ["Công văn đến / đi", "Văn thư theo dõi công văn đến-đi, người xử lý nội bộ và kết quả"],
  dept_legal_documents: ["Văn bản pháp lý", "Hợp đồng, phụ lục, quyết định, giấy phép; theo dõi hiệu lực và file đính kèm"],
  dept_legal_seal: ["Con dấu / Ủy quyền", "Đăng ký con dấu, người quản lý, trạng thái sử dụng"],
  dept_legal_benefits: ["Bảo hiểm & Chế độ", "Theo dõi BHXH/BHYT/BHTN và chế độ theo nhân sự; nhắc gia hạn theo thời hạn"],
  site_command: ["Quản lý dự án", "Danh sách dự án được phân quyền: trạng thái, mốc thời gian, số ngày chậm tiến độ, nhân sự, tổ đội, kho và Ban chỉ huy của từng dự án"],
  project_progress: ["Tiến độ dự án", "Theo dõi kế hoạch, thực tế, chênh lệch và mốc tiến độ"],
  construction: ["Thi công", "Nhật ký thi công theo ngày, hạng mục/khối lượng, nhân công; duyệt làm cơ sở nghiệm thu"],
  production: ["Báo cáo sản lượng", "BCH báo cáo theo tháng; Phòng Dự án kiểm tra/phê duyệt và dùng dữ liệu đã duyệt để tính KPI"],
  capital_recovery: ["Thu hồi vốn", "Chuỗi Sản lượng được duyệt → Hồ sơ trình → Giá trị duyệt → Hóa đơn → Tiền thực thu → Công nợ"],
  requests: ["Phiếu đề nghị mua hàng", "Nhu cầu của dự án/BCH; không gán Tổ đội tại bước đề nghị"],
  approvals: ["Phê duyệt đơn hàng", "Workflow theo vai trò, SLA, phạm vi dự án và xác nhận kép cuối"],
  supplier_catalog: ["Danh mục Nhà cung cấp", "Quản lý nhà cung cấp phục vụ mua hàng và PO."],
  purchasing: ["Mua hàng & PO", "Lũy kế mua hàng đối chiếu BOQ/HĐ nằm tại đây"],
  receiving: ["Kế hoạch giao hàng", "Theo dõi PO, giao nhiều đợt, chứng từ và SLA"],
  delivered: ["Đơn hàng đã giao", "Chỉ ghi nhận thực nhận sau xác nhận BCH/Thủ kho đúng phạm vi"],
  warehouse_receipt: ["Nhập kho", "Nghiệp vụ nhập kho theo đúng dự án/kho được phân công"],
  warehouse_issue: ["Xuất kho", "Nghiệp vụ xuất kho/cấp phát theo đúng dự án/kho được phân công"],
  inventory: ["Tồn kho & điều chuyển", "Tồn kho tách theo Dự án + Kho + Vị trí + Mã vật tư"],
  material_norms: ["Định mức vật tư theo dự án", "Định mức tiêu hao theo dự án/hạng mục; ước lượng nhu cầu mua sắm"],
  central_warehouse: ["Kho Tổng", "Theo dõi nhập, xuất, tồn và điều chuyển vật tư của Kho Tổng."],
  material_catalog: ["Danh mục vật tư gốc", "Mỗi vật tư chỉ có một mã gốc duy nhất; hỗ trợ nhiều tên gọi tương đương để đối chiếu BOQ và nghiệp vụ toàn công ty."],
  boq: ["BOQ / Hợp đồng dự án", "Giữ nguyên lõi BOQ/HĐ và cấu trúc nguồn đã chốt"],
  payments: ["Thanh toán HĐ", "Sổ tiền thực thu theo hợp đồng; có thể liên kết từng khoản thu với hồ sơ Thu hồi vốn"],
  teams: ["Tổ đội theo dự án", "Tổ đội tham gia tại cấp phát/thi công, không nằm trong Phiếu đề nghị mua hàng"],
  stocktake: ["Kiểm kê & hoàn trả", "Không tự điều chỉnh tồn khi chưa có bước xác nhận/duyệt"],
  reports: ["Báo cáo & cảnh báo", "Báo cáo vận hành và cảnh báo hệ thống"],
  admin: ["Quản trị hệ thống", "Nhân sự, nhóm quyền, phạm vi dự án/kho, workflow, cấu hình và nhật ký"],
};


const USER_MODULE_DESCRIPTIONS: Partial<Record<ModuleKey,string>> = {
  dashboard:"Theo dõi tổng thể dự án, hợp đồng, thu hồi vốn, mua hàng và tồn kho.",
  dept_plan_tasks:"Theo dõi nhiệm vụ, tiến độ và thời hạn xử lý của nhân viên Phòng Kế hoạch.",
  dept_plan_assign:"Giao công việc bổ sung và theo dõi việc hoàn thành của nhân viên Phòng Kế hoạch.",
  dept_plan_supply_plan:"Theo dõi kế hoạch mua hàng, cung ứng và thời điểm vật tư cần có tại dự án.",
  dept_plan_tender:"Theo dõi các công việc đấu thầu thuộc Phòng Kế hoạch.",
  dept_plan_rfq:"Quản lý yêu cầu xin giá, báo giá và tình trạng phản hồi của nhà cung cấp.",
  dept_plan_purchasing:"Theo dõi công việc mua hàng vật tư thiết bị từ nhu cầu đến đặt hàng.",
  dept_plan_supply:"Theo dõi tiến độ cung ứng vật tư và tình trạng giao hàng tới dự án.",
  dept_plan_contracts:"Quản lý danh sách, trạng thái và hồ sơ các loại hợp đồng.",
  dept_plan_suppliers:"Quản lý thông tin nhà cung cấp, đối tác và lịch sử làm việc.",
  dept_plan_price_data:"Tra cứu và theo dõi dữ liệu giá phục vụ mua hàng và thương mại.",
  dept_plan_kpi:"Theo dõi khối lượng công việc và hiệu suất của nhân viên Phòng Kế hoạch.",
  dept_plan_alerts:"Theo dõi báo cáo, cảnh báo và các công việc cần chú ý của Phòng Kế hoạch.",
  dept_project_tasks:"Theo dõi nhiệm vụ, tiến độ và thời hạn xử lý của nhân viên Phòng Dự án.",
  dept_project_pda:"Theo dõi công tác điều phối, phối hợp và kiểm soát công việc dự án.",
  dept_project_assign:"Giao công việc bổ sung và theo dõi việc hoàn thành của nhân viên Phòng Dự án.",
  dept_project_plan:"Theo dõi kế hoạch triển khai và các mốc công việc của dự án.",
  dept_project_shop:"Theo dõi hồ sơ shopdrawing và tình trạng trình duyệt.",
  dept_project_boq:"Theo dõi BOQ, bóc tách khối lượng và dữ liệu liên quan của dự án.",
  dept_project_material:"Theo dõi nhu cầu vật tư, kiểm soát kỹ thuật và tình trạng đặt hàng.",
  dept_project_issues:"Theo dõi phát sinh, yêu cầu làm rõ và các vấn đề kỹ thuật của dự án.",
  dept_project_asbuilt:"Theo dõi hồ sơ hoàn công và tình trạng hoàn thành theo dự án.",
  dept_project_payment:"Theo dõi hồ sơ thanh toán, quyết toán và tình trạng xử lý.",
  dept_project_tender:"Theo dõi phần việc kỹ thuật phục vụ đấu thầu.",
  dept_project_kpi:"Theo dõi khối lượng công việc và hiệu suất của nhân viên Phòng Dự án.",
  dept_project_alerts:"Theo dõi báo cáo, cảnh báo và các công việc cần chú ý của Phòng Dự án.",
  dept_finance_payment_plan:"Theo dõi kế hoạch thanh toán và các mốc thanh toán cần thực hiện.",
  dept_finance_recovery:"Theo dõi thu hồi vốn, công nợ và tình trạng thanh toán.",
  dept_finance_advance:"Theo dõi các khoản tạm ứng và hoàn ứng.",
  dept_finance_site_cost:"Theo dõi chi phí của Ban chỉ huy theo dự án.",
  dept_finance_cashbank:"Theo dõi thu chi quỹ và giao dịch ngân hàng.",
  dept_finance_documents:"Theo dõi chứng từ và hồ sơ kế toán.",
  dept_legal_hr:"Theo dõi thông tin và hồ sơ nhân sự.",
  dept_legal_labor:"Theo dõi hợp đồng lao động và tình trạng hiệu lực.",
  dept_legal_correspondence:"Theo dõi công văn đến, công văn đi và tình trạng xử lý.",
  dept_legal_documents:"Theo dõi văn bản và hồ sơ pháp lý.",
  dept_legal_seal:"Theo dõi việc sử dụng con dấu và ủy quyền.",
  dept_legal_benefits:"Theo dõi bảo hiểm và các chế độ của nhân sự.",
  site_command:"Theo dõi hoạt động của Ban chỉ huy theo từng dự án.",
  project_progress:"Theo dõi tiến độ kế hoạch, tiến độ thực tế và sản lượng của dự án.",
  construction:"Theo dõi công tác thi công, nghiệm thu và thông tin hiện trường.",
  production:"Theo dõi sản lượng thực hiện và tình trạng xác nhận theo dự án.",
  capital_recovery:"Theo dõi hồ sơ thu hồi vốn, giá trị được duyệt, tiền đã thu và công nợ.",
  requests:"Lập và theo dõi phiếu đề nghị mua hàng theo nhu cầu dự án.",
  approvals:"Theo dõi và xử lý các phiếu đang chờ phê duyệt.",
  purchasing:"Theo dõi mua hàng, PO và lũy kế mua sắm theo BOQ/Hợp đồng.",
  supplier_catalog:"Quản lý nhà cung cấp phục vụ mua hàng và PO.",
  receiving:"Theo dõi kế hoạch giao hàng và tình trạng giao theo PO.",
  delivered:"Theo dõi các đơn hàng đã giao và kết quả xác nhận thực nhận.",
  warehouse_receipt:"Lập và theo dõi nghiệp vụ nhập kho theo đúng phạm vi được phân công.",
  warehouse_issue:"Lập và theo dõi nghiệp vụ xuất kho, cấp phát vật tư.",
  inventory:"Theo dõi nhập, xuất, tồn và điều chuyển vật tư theo dự án và kho.",
  material_norms:"Theo dõi định mức sử dụng vật tư theo dự án.",
  central_warehouse:"Theo dõi nhập, xuất, tồn và điều chuyển vật tư của Kho Tổng.",
  material_catalog:"Quản lý danh mục mã vật tư gốc dùng chung toàn công ty.",
  boq:"Quản lý BOQ/Hợp đồng, phiên bản BOQ và liên kết mã vật tư gốc.",
  payments:"Theo dõi các khoản thanh toán theo hợp đồng.",
  teams:"Theo dõi tổ đội và số liệu cấp phát vật tư theo dự án.",
  stocktake:"Theo dõi kiểm kê, chênh lệch và hoàn trả vật tư.",
  reports:"Theo dõi báo cáo vận hành và các cảnh báo cần xử lý.",
  admin:"Quản lý người dùng, phân quyền, cấu hình và nhật ký hệ thống."
};
function moduleUserDescription(key:ModuleKey){return USER_MODULE_DESCRIPTIONS[key]||titles[key][1];}
function moduleAdminGuidance(key:ModuleKey){const raw=titles[key][1].replace(/^ĐANG PHÁT TRIỂN\s*·\s*/i,"").trim();return raw===moduleUserDescription(key).replace(/[.]$/,"").trim()?"":raw;}
function AdminModuleGuide({moduleKey}:{moduleKey:ModuleKey}){const text=moduleAdminGuidance(moduleKey);if(!text)return null;return <details className="admin-module-guide"><summary>ⓘ Hướng dẫn quản trị</summary><p>{text}</p></details>;}

const roleNames: Record<string, string> = {
  admin: "Quản trị hệ thống", engineer: "Kỹ sư dự án", commander: "Chỉ huy trưởng",
  project: "Phòng Dự án", procurement: "Phòng Kế hoạch", accountant: "Kế toán / Tài chính", warehouse: "Thủ kho", team: "Tổ đội", director: "Ban Lãnh đạo",
};
const format = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 });
const money = (value: unknown) => `${format.format(Number(value || 0))} đ`;
const moneyBillion = (value: unknown) => `${new Intl.NumberFormat("vi-VN",{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(value||0)/1e9)} tỷ`;
const date = (value: unknown) => {
  if (!value) return "—";
  const parsed = new Date(String(value));
  if (Number.isNaN(parsed.getTime())) return String(value);
  const hasTime = String(value).includes("T");
  return new Intl.DateTimeFormat("vi-VN", { day:"2-digit", month:"2-digit", year:"numeric", ...(hasTime?{hour:"2-digit",minute:"2-digit",hour12:false}:{}) }).format(parsed);
};
function projectPeriod(start:unknown,end:unknown){const fmt=(value:unknown)=>{if(!value)return "?";const d=new Date(String(value));return Number.isNaN(d.getTime())?"?":`${d.getMonth()+1}/${d.getFullYear()}`;};const a=fmt(start),b=fmt(end);return a==="?"&&b==="?"?"Chưa có TG":a!=="?"&&b==="?"?`Từ ${a}`:a==="?"&&b!=="?"?`Đến ${b}`:a===b?a:`${a}–${b}`;}
function roleBase(user: Row) { return String(user.roleBase || user.role || ""); }
function isAdminUser(user: Row) { return user.role === "admin" || roleBase(user) === "admin"; }
function roleLabel(data: AppData, code: string) { return data.roleCatalog?.find((row) => row.code === code)?.name || roleNames[code] || code; }
function engineRoleLabel(data: AppData, engineKey: string) { const profile=data.engineRoleProfiles?.find((row) => row.engineKey === engineKey);return profile?`${profile.companyCode} · ${profile.displayName}`:roleNames[engineKey]||engineKey; }
function configuredMenuGroups(data: AppData, includeHidden = false): Row[] {
  const dbCatalog: Row[] = Array.isArray(data.menuGroups) ? data.menuGroups : [];
  const catalog: Row[] = [...dbCatalog, ...defaultMenuGroups.filter((row)=>!dbCatalog.some((db)=>String(db.groupKey)===String(row.groupKey)))];
  const unique = new Map<string, Row>();
  catalog.forEach((row) => {
    const groupKey = String(row.groupKey || "").trim();
    if (!groupKey || unique.has(groupKey)) return;
    unique.set(groupKey, { ...row, groupKey });
  });
  return [...unique.values()]
    .filter((row) => String(row.groupKey) !== "project_management")
    .map((row): Row => {
      const normalized = String(row.groupKey) === "site_command" ? { ...row, name: "QUẢN LÝ DỰ ÁN", icon: "DA", sortOrder: 25 } : row;
      return { ...normalized, active: normalized.active === undefined ? true : Boolean(normalized.active), collapsible: normalized.collapsible === undefined ? true : Boolean(normalized.collapsible), sortOrder: Number(normalized.sortOrder || 0) };
    })
    .filter((row) => includeHidden || row.active).sort((a, b) => a.sortOrder - b.sortOrder || String(a.name).localeCompare(String(b.name), "vi"));
}
function configuredModules(data: AppData, includeHidden = false) {
  const catalog = data.moduleCatalog || [];
  const groups = configuredMenuGroups(data, true);
  return modules.map((item) => {
    const config = catalog.find((row) => row.moduleKey === item.key);
    let groupKey = item.key==="material_catalog" ? "material_master" : String(config?.groupKey ?? item.groupKey ?? "").trim() || null;
    if (groupKey === "project_management") groupKey = "site_command";
    let group = groups.find((row) => String(row.groupKey) === groupKey);
    if (!group && config?.groupName) {
      const normalizedName = String(config.groupName).trim().toLocaleLowerCase("vi");
      group = groups.find((row) => String(row.name || "").trim().toLocaleLowerCase("vi") === normalizedName);
      if (group) groupKey = String(group.groupKey);
    }
    return { ...item, label: item.key==="material_catalog" ? "Danh mục vật tư gốc" : item.key==="central_warehouse" ? "Kho Tổng" : (config?.label || item.label), icon: config?.icon || item.icon, groupKey, group: group?.name || config?.groupName || null, active: config ? Boolean(config.active) : true, sortOrder: Number(config?.sortOrder ?? modules.indexOf(item) * 10) };
  }).filter((item) => includeHidden || item.active).sort((a, b) => a.sortOrder - b.sortOrder);
}
function permissionMenuStructure(data: AppData) {
  const groupRows=configuredMenuGroups(data);
  const moduleRows=configuredModules(data).filter((item)=>item.key!=="admin");
  const result:{kind:"group"|"subgroup"|"module";key:string;label:string;module?:ReturnType<typeof configuredModules>[number]}[]=[];
  const seen=new Set<string>();
  for(const group of groupRows){
    const groupKey=String(group.groupKey||"");
    const children=moduleRows.filter((item)=>String(item.groupKey||"")===groupKey);
    if(!children.length)continue;
    result.push({kind:"group",key:`group:${groupKey}`,label:String(group.name||groupKey)});
    if(groupKey==="department_management"){
      const order=["Phòng Kế hoạch","Phòng Dự án","Tài chính Kế toán","Hành chính Pháp chế"];
      for(const subgroup of order){
        const items=children.filter((item)=>String(item.subGroup||"")===subgroup);
        if(!items.length)continue;
        result.push({kind:"subgroup",key:`subgroup:${groupKey}:${subgroup}`,label:subgroup});
        for(const item of items){result.push({kind:"module",key:`module:${item.key}`,label:item.label,module:item});seen.add(item.key);}
      }
      for(const item of children.filter((item)=>!seen.has(item.key))){result.push({kind:"module",key:`module:${item.key}`,label:item.label,module:item});seen.add(item.key);}
    } else {
      for(const item of children){result.push({kind:"module",key:`module:${item.key}`,label:item.label,module:item});seen.add(item.key);}
    }
  }
  for(const item of moduleRows.filter((item)=>!seen.has(item.key)))result.push({kind:"module",key:`module:${item.key}`,label:item.label,module:item});
  return result;
}

function stageAllowedForUser(stage: Row | undefined, user: Row) { if (isAdminUser(user)) return true; if (!stage) return false; const allowed = String(stage.allowedRoleCodes || "").split(",").map((item) => item.trim()).filter(Boolean); return allowed.includes(String(user.role)) || allowed.includes(roleBase(user)); }


async function requestApi(action: string, payload: Row = {}) {
  const response = await fetch("/api/system", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...payload }) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Không thể xử lý yêu cầu.");
  return result;
}

export default function Home() {
  const [state, setState] = useState<"loading" | "setup" | "login" | "ready" | "error">("loading");
  const [data, setData] = useState<AppData | null>(null); const [message, setMessage] = useState(""); const [error, setError] = useState("");
  useEffect(()=>{const settings=data?.uiDisplaySettings;const root=document.documentElement;const keys=["--app-font","--app-font-size","--app-heading-size","--material-name-size","--material-code-size","--light-text","--light-muted","--light-material-name-color","--light-material-code-color"];if(!settings||String(settings.designVersion||"")!==VNTECH_UI_DISPLAY_VERSION){keys.forEach((key)=>root.style.removeProperty(key));delete document.body.dataset.density;return;}const font=String(settings.fontFamily||"Segoe UI");const base=Math.max(16,Number(settings.baseFontSize||16));const heading=Math.max(26,Number(settings.headingFontSize||28));const materialName=Math.max(15,Number(settings.materialNameSize||16));const materialCode=Math.max(14,Number(settings.materialCodeSize||15));const values:Record<string,string>={"--app-font":font,"--app-font-size":`${base}px`,"--app-heading-size":`${heading}px`,"--material-name-size":`${materialName}px`,"--material-code-size":`${materialCode}px`,"--light-text":String(settings.textColor||"#132238"),"--light-muted":String(settings.mutedColor||"#63748b"),"--light-material-name-color":String(settings.materialNameColor||"#132238"),"--light-material-code-color":String(settings.materialCodeColor||"#1769e0")};Object.entries(values).forEach(([key,value])=>root.style.setProperty(key,value));document.body.dataset.density=String(settings.rowDensity||"normal");},[data?.uiDisplaySettings]);
  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/system", { cache: "no-store" }); const result = await response.json();
      if (result.setupRequired) { setState("setup"); return; }
      if (response.status === 401) { setState("login"); return; }
      if (!response.ok) throw new Error(result.error || "Không thể tải dữ liệu.");
      const normalizedData = {
        ...result.data,
        engineRoleProfiles: Array.isArray(result.data?.engineRoleProfiles) ? result.data.engineRoleProfiles : [],
        businessScopes: Array.isArray(result.data?.businessScopes) ? result.data.businessScopes : [],
        businessRoleGroupScopes: Array.isArray(result.data?.businessRoleGroupScopes) ? result.data.businessRoleGroupScopes : [],
        businessRoleGroups: Array.isArray(result.data?.businessRoleGroups) ? result.data.businessRoleGroups : [],
        roleCatalog: Array.isArray(result.data?.roleCatalog) ? result.data.roleCatalog : [],
        approvalStages: Array.isArray(result.data?.approvalStages) ? result.data.approvalStages : [],
        menuGroups: Array.isArray(result.data?.menuGroups) ? result.data.menuGroups : [],
        moduleCatalog: Array.isArray(result.data?.moduleCatalog) ? result.data.moduleCatalog : [],
        materialCategories: Array.isArray(result.data?.materialCategories) ? result.data.materialCategories : [],
        adminMaterialCategories: Array.isArray(result.data?.adminMaterialCategories) ? result.data.adminMaterialCategories : (Array.isArray(result.data?.materialCategories) ? result.data.materialCategories : []),
        materialSubcategories: Array.isArray(result.data?.materialSubcategories) ? result.data.materialSubcategories : [],
        adminMaterialSubcategories: Array.isArray(result.data?.adminMaterialSubcategories) ? result.data.adminMaterialSubcategories : (Array.isArray(result.data?.materialSubcategories) ? result.data.materialSubcategories : []),
        materials: Array.isArray(result.data?.materials) ? result.data.materials : [],
        // LƯU Ý: server chỉ gửi adminMaterials cho tài khoản quản trị. Với tài khoản thường key vắng mặt,
        // nên phải fallback về materials TẠI ĐÂY. Nếu để [] thì mọi chỗ dùng `adminMaterials || materials`
        // sẽ luôn nhận [] (mảng rỗng là truthy) và danh mục hiển thị 0 dòng dù API trả đủ dữ liệu.
        adminMaterials: Array.isArray(result.data?.adminMaterials) ? result.data.adminMaterials : (Array.isArray(result.data?.materials) ? result.data.materials : []),
        centralInventory: Array.isArray(result.data?.centralInventory) ? result.data.centralInventory : [],
        centralReturns: Array.isArray(result.data?.centralReturns) ? result.data.centralReturns : [],
        companyAvailability: Array.isArray(result.data?.companyAvailability) ? result.data.companyAvailability : [],
        transferOrders: Array.isArray(result.data?.transferOrders) ? result.data.transferOrders : [],
        materialAliases: Array.isArray(result.data?.materialAliases) ? result.data.materialAliases : [],
        boqImportBatches: Array.isArray(result.data?.boqImportBatches) ? result.data.boqImportBatches : [],
        boqChangeHistory: Array.isArray(result.data?.boqChangeHistory) ? result.data.boqChangeHistory : [],
        projectContracts: Array.isArray(result.data?.projectContracts) ? result.data.projectContracts : [],
        boqVersions: Array.isArray(result.data?.boqVersions) ? result.data.boqVersions : [],
        contractStockLedger: Array.isArray(result.data?.contractStockLedger) ? result.data.contractStockLedger : [],
        contractStockBalances: Array.isArray(result.data?.contractStockBalances) ? result.data.contractStockBalances : [],
        stockReconciliations: Array.isArray(result.data?.stockReconciliations) ? result.data.stockReconciliations : [],
        staffDirectory: Array.isArray(result.data?.staffDirectory) ? result.data.staffDirectory : [],
        userWarehouseScopes: Array.isArray(result.data?.userWarehouseScopes) ? result.data.userWarehouseScopes : [],
        transferWarehouses: Array.isArray(result.data?.transferWarehouses) ? result.data.transferWarehouses : [],
        teamSubcontracts: Array.isArray(result.data?.teamSubcontracts) ? result.data.teamSubcontracts : [],
        teamProductionRecords: Array.isArray(result.data?.teamProductionRecords) ? result.data.teamProductionRecords : [],
        teamPayments: Array.isArray(result.data?.teamPayments) ? result.data.teamPayments : [],
        teamSettlements: Array.isArray(result.data?.teamSettlements) ? result.data.teamSettlements : [],
        workflowDefinitions: Array.isArray(result.data?.workflowDefinitions) ? result.data.workflowDefinitions : [],
        workflowSteps: Array.isArray(result.data?.workflowSteps) ? result.data.workflowSteps : [],
        workflowStepApprovers: Array.isArray(result.data?.workflowStepApprovers) ? result.data.workflowStepApprovers : [],
        departmentModulePermissions: Array.isArray(result.data?.departmentModulePermissions) ? result.data.departmentModulePermissions : [],
        systemLevelCatalog: Array.isArray(result.data?.systemLevelCatalog) ? result.data.systemLevelCatalog : [],
      } as AppData;
      setData(normalizedData); setState("ready");
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Không thể kết nối máy chủ."); setState("error"); }
  }, []);
  // Initial synchronization with the company server.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (state !== "ready") return;
    const refreshVisiblePage = () => { if (document.visibilityState === "visible") void load(); };
    const interval = window.setInterval(refreshVisiblePage, 15000);
    window.addEventListener("focus", refreshVisiblePage);
    return () => { window.clearInterval(interval); window.removeEventListener("focus", refreshVisiblePage); };
  }, [state, load]);
  async function action(name: string, payload: Row) {
    setError("");
    try { const result = await requestApi(name, payload); setMessage(result.message || "Đã cập nhật dữ liệu."); await load(); window.setTimeout(() => setMessage(""), 3200); return true; }
    catch (actionError) { setError(actionError instanceof Error ? actionError.message : "Không thể xử lý."); return false; }
  }
  if (state === "loading") return <LoadingScreen />;
  if (state === "setup") return <SetupScreen onDone={load} />;
  if (state === "login") return <LoginScreen onDone={load} />;
  if (state === "error" || !data) return <ErrorScreen message={error} retry={load} />;
  return <AppErrorBoundary><WarehouseApp data={data} refresh={load} action={action} logout={async () => { await requestApi("logout"); setData(null); setState("login"); }} globalError={error} toast={message} /></AppErrorBoundary>;
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { message: string }> {
  state = { message: "" };
  static getDerivedStateFromError(error: unknown) { return { message: error instanceof Error ? error.message : String(error || "Lỗi giao diện không xác định") }; }
  componentDidCatch(error: unknown) { console.error("VNTECH ERP UI ERROR", error); }
  render() {
    if (!this.state.message) return this.props.children;
    return <div className="auth-page"><div className="auth-card"><Brand /><div className="auth-copy"><span>LỖI GIAO DIỆN ĐÃ ĐƯỢC CHẶN</span><h1>Không còn màn hình trắng</h1><p>Phần mềm đã bắt được lỗi giao diện thay vì làm trắng toàn bộ màn hình. Dữ liệu kho không bị xóa.</p></div><div className="auth-alert danger">{this.state.message}</div><button className="primary wide" onClick={() => window.location.reload()}>Tải lại giao diện</button><p className="auth-foot">Nếu lỗi lặp lại, chụp đúng thông báo màu đỏ này để xác định tác vụ gây lỗi.</p></div></div>;
  }
}

function LoadingScreen() { return <div className="auth-page"><div className="loading-card"><span className="loader" /><h1>Đang mở VNTECH ERP</h1><p>Đang kiểm tra dữ liệu và quyền truy cập…</p></div></div>; }
function ErrorScreen({ message, retry }: { message: string; retry: () => void }) { return <div className="auth-page"><div className="auth-card"><Brand /><div className="auth-alert danger">{message}</div><button className="primary wide" onClick={retry}>Thử kết nối lại</button><p className="auth-foot">Nếu đây là lần chạy đầu, hãy thực hiện mục “Cài đặt trên máy chủ nội bộ” trong tài liệu bàn giao.</p></div></div>; }
function Brand() { return <div className="auth-brand" data-vntech-product={VNTECH_BRAND.productId} data-vntech-fingerprint={VNTECH_BRAND.sourceFingerprintShort}><img className="brand-logo auth-logo" src={VNTECH_BRAND.logoPath} alt="VNTECH" /><div><strong>{VNTECH_BRAND.productName}</strong><small>{VNTECH_BRAND.productDescription}</small><em>{VNTECH_BRAND.legalOwner}</em></div></div>; }

function SetupScreen({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); setBusy(true); setError(""); try { await requestApi("setup", Object.fromEntries(form)); await onDone(); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Không thể khởi tạo."); } finally { setBusy(false); } }
  return <div className="auth-page"><form className="auth-card setup-card" onSubmit={submit}><Brand /><div className="auth-copy"><span>KHỞI TẠO LẦN ĐẦU</span><h1>Thiết lập hệ thống của công ty</h1><p>Tạo tài khoản quản trị đầu tiên. Hệ thống khởi tạo trống. Quản trị viên chủ động tạo dự án, nhóm vật tư, mã vật tư và phân quyền theo thực tế công ty.</p></div>{error && <div className="auth-alert danger">{error}</div>}<div className="auth-grid"><label><span>Tên công ty *</span><input name="companyName" required placeholder="Công ty TNHH…" /></label><label><span>Họ tên quản trị viên *</span><input name="fullName" required placeholder="Nguyễn Văn A" /></label><label><span>Tên đăng nhập *</span><input name="username" required defaultValue="admin" autoComplete="username" /></label><label><span>Email công ty</span><input name="email" type="email" placeholder="admin@congty.vn" /></label><label className="span-2"><span>Mật khẩu ban đầu * (≥8 ký tự: hoa, thường, số, ký tự đặc biệt)</span><input name="password" type="password" minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}" title="Tối thiểu 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt" required autoComplete="new-password" /></label></div><button className="primary wide" disabled={busy}>{busy ? "Đang khởi tạo…" : "Khởi tạo và đăng nhập →"}</button><p className="auth-foot">Mật khẩu được băm PBKDF2-SHA256 600.000 vòng với salt riêng; dữ liệu nằm trên máy chủ công ty.</p></form></div>;
}
function LoginScreen({ onDone }: { onDone: () => void }) {
  const rememberedUsername=typeof window!=="undefined"?window.localStorage.getItem("vntech-login-username")||"":"";
  const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [showPassword,setShowPassword]=useState(false); const [remember,setRemember]=useState(Boolean(rememberedUsername)); const [forgotOpen,setForgotOpen]=useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setBusy(true); setError(""); const form=new FormData(event.currentTarget); const username=String(form.get("username")||"").trim(); const password=String(form.get("password")||""); try { if(typeof window!=="undefined"){if(remember)window.localStorage.setItem("vntech-login-username",username);else window.localStorage.removeItem("vntech-login-username");} await requestApi("login", {username,password}); await onDone(); } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Không thể đăng nhập."); } finally { setBusy(false); } }
  return <div className="auth-page auth-page-full auth-full-city-login" data-contract="VNTECH_FULL_W2_LOGIN_UI"><div className="auth-enterprise-shell"><section className="auth-enterprise-intro"><img className="auth-login-master-art" src="/vntech-login-r1-left.png" alt="" aria-hidden="true"/><img className="auth-city-art auth-city-light" src="/vntech-header-city-light.webp" alt="" aria-hidden="true"/><img className="auth-city-art auth-city-dark" src="/vntech-header-city-dark.webp" alt="" aria-hidden="true"/><div className="auth-enterprise-logo"><img src={VNTECH_BRAND.logoPath} alt="VNTECH TECHNOLOGY FOR LIFE"/></div><div className="auth-mobile-company">{VNTECH_COMPANY_DISPLAY_NAME}</div><div className="auth-enterprise-copy"><h1>NỀN TẢNG QUẢN TRỊ &amp;<br/>ĐIỀU HÀNH DOANH NGHIỆP</h1><h2><b>VNTECH</b> Enterprise Resource Planning <strong>(VNTECH ERP)</strong></h2></div><div className="auth-enterprise-visual" aria-hidden="true"><span className="erp-node node-project">DỰ ÁN</span><span className="erp-node node-purchase">MUA HÀNG</span><span className="erp-node node-warehouse">KHO VẬT TƯ</span><span className="erp-node node-approval">PHÊ DUYỆT</span></div><div className="auth-enterprise-wave" aria-hidden="true"><i/><i/><i/></div></section><form className="auth-login-panel" onSubmit={submit}><div className="auth-login-lock" aria-hidden="true"><span className="auth-lock-glyph">🔒</span><img className="auth-lock-logo" src={VNTECH_BRAND.logoPath} alt=""/></div><div className="auth-login-heading"><h2>Đăng nhập hệ thống</h2><p>Chào mừng bạn quay trở lại!</p></div>{error && <div className="auth-alert danger">{error}</div>}<label><span>Tên đăng nhập</span><input name="username" required autoComplete="username" autoFocus defaultValue={rememberedUsername} placeholder="Nhập tên đăng nhập" /></label><label><span>Mật khẩu</span><div className="auth-password-field"><input name="password" required type={showPassword?"text":"password"} autoComplete="current-password" placeholder="Nhập mật khẩu" /><button type="button" onClick={()=>setShowPassword(v=>!v)} aria-label={showPassword?"Ẩn mật khẩu":"Hiện mật khẩu"}>{showPassword?"ẨN":"◉"}</button></div></label><div className="auth-login-options"><label className="auth-remember"><input type="checkbox" checked={remember} onChange={(event)=>setRemember(event.target.checked)}/><span>Ghi nhớ đăng nhập</span></label><button type="button" className="auth-forgot" onClick={()=>setForgotOpen(v=>!v)}>Quên mật khẩu?</button></div>{forgotOpen&&<div className="auth-recovery-note">Liên hệ Quản trị viên hệ thống để <b>Reset mật khẩu</b>. Sau khi đăng nhập bằng mật khẩu tạm, hệ thống sẽ bắt buộc đổi mật khẩu mới.</div>}<button className="primary wide auth-login-submit" disabled={busy}>{busy ? "ĐANG KIỂM TRA…" : "ĐĂNG NHẬP"}</button><div className="auth-support-note"><span>◉</span><div><b>Liên hệ Quản trị viên nếu cần hỗ trợ</b><small>Tài khoản được quản lý tập trung và bảo vệ theo chính sách VNTECH ERP.</small></div></div><footer><span className="auth-footer-desktop">© 2026 {VNTECH_COMPANY_DISPLAY_NAME}</span><span className="auth-footer-mobile"><b>VNTECH ERP</b><small>Bảo mật • Ổn định • Hiệu quả</small></span></footer></form></div></div>;
}

const NAV_ICON_TYPE: Record<string,string> = {
  overview:"home", dashboard:"home",
  department_management:"users", site_command:"hardhat", "phòng kế hoạch":"calendar", "phòng dự án":"hardhat", "tài chính kế toán":"coins", "hành chính pháp chế":"document",
  project_management:"briefcase", purchasing:"cart", warehouse:"warehouse", system_admin:"gear",
  dept_plan_tasks:"tasks", dept_plan_assign:"assign", dept_plan_supply_plan:"calendar", dept_plan_tender:"bid", dept_plan_rfq:"quote",
  dept_plan_purchasing:"cart", dept_plan_supply:"truck", dept_plan_contracts:"document", dept_plan_suppliers:"handshake", dept_plan_price_data:"coins", dept_plan_kpi:"chart", dept_plan_alerts:"bell",
  dept_project_tasks:"tasks", dept_project_pda:"compass", dept_project_assign:"assign", dept_project_plan:"calendar", dept_project_shop:"blueprint", dept_project_boq:"measure", dept_project_material:"box", dept_project_issues:"alert", dept_project_asbuilt:"checkdoc", dept_project_payment:"wallet", dept_project_tender:"bid", dept_project_kpi:"chart", dept_project_alerts:"bell",
  dept_finance_payment_plan:"calendar",dept_finance_recovery:"coins",dept_finance_advance:"wallet",dept_finance_site_cost:"coins",dept_finance_cashbank:"wallet",dept_finance_documents:"document",dept_legal_hr:"users",dept_legal_labor:"document",dept_legal_correspondence:"document",dept_legal_documents:"document",dept_legal_seal:"checkdoc",dept_legal_benefits:"document",
  project_progress:"calendar", construction:"hardhat", production:"chart", capital_recovery:"coins", boq:"measure", payments:"wallet", teams:"users",
  requests:"clipboard", approvals:"check", supplier_catalog:"handshake", receiving:"truck", delivered:"deliver",
  warehouse_receipt:"receive", warehouse_issue:"issue", inventory:"transfer", stocktake:"stocktake", material_norms:"ruler", central_warehouse:"warehouse", material_catalog:"boxes",
  admin:"gear", dept_personal:"user",
  my_work:"tasks", mep:"blueprint", finance:"coins", hr_legal:"briefcase", reports:"chart"
};
const NAV_ICON_TONE: Record<string,string> = {
  overview:"blue",dashboard:"blue",my_work:"green",mep:"blue",finance:"orange",hr_legal:"purple",reports:"slate",department_management:"indigo",site_command:"orange","phòng kế hoạch":"green","phòng dự án":"blue","tài chính kế toán":"orange","hành chính pháp chế":"purple",project_management:"orange",
  purchasing:"red",warehouse:"purple",system_admin:"slate",admin:"slate",
  project_progress:"orange",construction:"orange",production:"orange",capital_recovery:"orange",boq:"orange",payments:"orange",teams:"orange",
  requests:"red",approvals:"red",receiving:"red",delivered:"red",
  warehouse_receipt:"purple",warehouse_issue:"purple",inventory:"purple",stocktake:"purple",material_norms:"purple",central_warehouse:"purple",material_catalog:"purple",
  dept_plan_tasks:"green",dept_plan_assign:"green",dept_plan_supply_plan:"green",dept_plan_tender:"green",dept_plan_rfq:"green",dept_plan_purchasing:"green",dept_plan_supply:"green",dept_plan_contracts:"green",dept_plan_suppliers:"green",dept_plan_price_data:"green",dept_plan_kpi:"green",dept_plan_alerts:"green",
  dept_project_tasks:"blue",dept_project_pda:"blue",dept_project_assign:"blue",dept_project_plan:"blue",dept_project_shop:"blue",dept_project_boq:"blue",dept_project_material:"blue",dept_project_issues:"blue",dept_project_asbuilt:"blue",dept_project_payment:"blue",dept_project_tender:"blue",dept_project_kpi:"blue",dept_project_alerts:"blue",dept_finance_payment_plan:"orange",dept_finance_recovery:"orange",dept_finance_advance:"orange",dept_finance_site_cost:"orange",dept_finance_cashbank:"orange",dept_finance_documents:"orange",dept_legal_hr:"purple",dept_legal_labor:"purple",dept_legal_correspondence:"purple",dept_legal_documents:"purple",dept_legal_seal:"purple",dept_legal_benefits:"purple",dept_personal:"blue"
};
function NavIcon({name,kind="module"}:{name:string;kind?:"module"|"group"}) {
  const key=name.toLowerCase();
  const tone=NAV_ICON_TONE[key] || (key.startsWith("dept_project_")?"blue":key.startsWith("dept_plan_")?"green":"blue");
  const type=NAV_ICON_TYPE[key] || "grid";
  const paths:Record<string,ReactNode>= {
    home:<><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9 21v-7h6v7"/></>,
    user:<><circle cx="12" cy="8" r="3.2"/><path d="M5 21c.8-4.4 3.1-6.6 7-6.6s6.2 2.2 7 6.6"/></>,
    users:<><circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3.5 20c.5-4 2.5-6 5.5-6s5 2 5.5 6M14 15c3.5-.5 5.5 1 6.5 4"/></>,
    briefcase:<><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5c0-1 1-2 2-2h4c1 0 2 1 2 2v2M3 12h18M10 12v2h4v-2"/></>,
    calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18M7 14h2M11 14h2M15 14h2M7 18h2M11 18h2"/></>,
    tasks:<><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 10l1.4 1.4L13 8.8M9 15l1.4 1.4L13 13.8M14.5 10h2M14.5 15h2"/></>,
    assign:<><circle cx="8" cy="8" r="3"/><path d="M3 19c.6-3.4 2.3-5.2 5-5.2 1.5 0 2.8.5 3.7 1.4M14 7h7M18 3l4 4-4 4M14 17h7M18 13l4 4-4 4"/></>,
    cart:<><circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.5 11h10l2-7H7"/></>,
    truck:<><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></>,
    document:<><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 12h7M9 16h7"/></>,
    clipboard:<><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h7M8.5 18h4"/></>,
    handshake:<><path d="M8 8 5 5 2 9l5 5 3-1 4 4c1 1 3 0 3-1l-5-5"/><path d="m16 8 3-3 3 4-5 5-3-1-2-2 4-3Z"/></>,
    coins:<><ellipse cx="8" cy="7" rx="4" ry="2.5"/><path d="M4 7v4c0 1.4 1.8 2.5 4 2.5s4-1.1 4-2.5V7M12 11c.7-.5 1.7-.8 3-.8 2.2 0 4 1.1 4 2.5v4c0 1.4-1.8 2.5-4 2.5s-4-1.1-4-2.5v-3"/></>,
    chart:<><path d="M4 20V10M10 20V5M16 20v-8M22 20H2"/><path d="m4 8 6-4 6 5 5-4"/></>,
    bell:<><path d="M6 16h12l-1.5-2V9a4.5 4.5 0 0 0-9 0v5L6 16Z"/><path d="M10 19a2 2 0 0 0 4 0"/></>,
    hardhat:<><path d="M4 15v-2a8 8 0 0 1 16 0v2M8 13V8M16 13V8M3 15h18v3H3z"/></>,
    compass:<><circle cx="12" cy="12" r="9"/><path d="m15 8-2 5-5 2 2-5 5-2Z"/></>,
    blueprint:<><path d="M4 3h13l3 3v15H4z"/><path d="M15 3v5h5M8 12h8M8 16h5M7 8h4"/></>,
    measure:<><rect x="3" y="7" width="18" height="10" rx="2"/><path d="M7 7v4M11 7v2M15 7v4M19 7v2"/></>,
    box:<><path d="m3 7 9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10"/></>,
    alert:<><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/></>,
    checkdoc:<><path d="M6 2h9l4 4v16H6z"/><path d="M14 2v5h5M9 14l2 2 4-5"/></>,
    wallet:<><path d="M3 6h15a2 2 0 0 1 2 2v10H5a2 2 0 0 1-2-2V6Z"/><path d="M3 8V5a2 2 0 0 1 2-2h12M14 11h7v4h-7a2 2 0 0 1 0-4Z"/></>,
    bid:<><path d="m4 18 8-8M9 6l4 4M5 10l4 4M12 5l3-3 4 4-3 3M3 14l3-3 4 4-3 3M12 20h9"/></>,
    quote:<><path d="M4 5h16v12H8l-4 4V5Z"/><path d="M8 9h8M8 13h5"/></>,
    check:<><circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/></>,
    deliver:<><path d="m3 7 9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10"/><path d="m16 14 1.5 1.5L21 12"/></>,
    receive:<><path d="m3 8 9-4 9 4-9 4zM3 8v9l9 4 9-4V8M12 12v9M12 2v7M9 6l3 3 3-3"/></>,
    issue:<><path d="m3 8 9-4 9 4-9 4zM3 8v9l9 4 9-4V8M12 12v9M12 9V2M9 5l3-3 3 3"/></>,
    transfer:<><path d="M4 7h14M15 4l3 3-3 3M20 17H6M9 14l-3 3 3 3"/><rect x="2" y="3" width="3" height="8" rx="1"/><rect x="19" y="13" width="3" height="8" rx="1"/></>,
    stocktake:<><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8 10h8M8 14h5M16 15l1.5 1.5L20 14"/></>,
    ruler:<><path d="m4 17 13-13 3 3L7 20H4v-3Z"/><path d="m12 9 3 3M9 12l2 2M15 6l2 2"/></>,
    warehouse:<><path d="M3 9 12 3l9 6v12H3V9Z"/><path d="M7 13h10v8H7zM7 16h10"/></>,
    boxes:<><path d="m4 6 4-2 4 2-4 2-4-2Zm0 0v5l4 2 4-2V6M12 12l4-2 4 2-4 2-4-2Zm0 0v5l4 2 4-2v-5"/></>,
    gear:<><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.3-2.6h-5.4L9 6a7 7 0 0 0-1.5 1.1l-2.4-1-2 3.4L5.1 11A7 7 0 0 0 5 12c0 .3 0 .7.1 1l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 9 18l.3 2.6h5.4L15 18a7 7 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z"/></>,
    grid:<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>
  };
  return <i className={`nav-glyph nav-glyph-${tone} ${kind==="group"?"nav-glyph-group":""}`} data-nav-icon={type} aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[type]}</svg></i>;
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

function modulePermission(data: AppData, key: ModuleKey) {
  if (isAdminUser(data.user)) return { canView: true, canUse: true, canCreate: true, canEdit: true, canApprove: true, canExport: true };
  const row = data.modulePermissions.find((item) => item.moduleKey === key);
  return { canView: Boolean(row?.canView), canUse: Boolean(row?.canUse), canCreate: Boolean(row?.canCreate), canEdit: Boolean(row?.canEdit), canApprove: Boolean(row?.canApprove), canExport: Boolean(row?.canExport), permissionSource: row?.permissionSource || "none", permissionExpiresAt: row?.permissionExpiresAt || null };
}
function WarehouseApp({ data, refresh, action, logout, globalError, toast }: { data: AppData; refresh: () => void; action: (name: string, payload: Row) => Promise<boolean>; logout: () => void; globalError: string; toast: string }) {
  const linkedRequestId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("request") : null; const linkedRequest = linkedRequestId ? data.requests.find((row) => row.id === linkedRequestId) || null : null;
  const menuGroups = configuredMenuGroups(data);
  const visibleGroupKeys = new Set(menuGroups.map((row) => String(row.groupKey)));
  // P2.4 — chỉ hiện chức năng người dùng có quyền XEM. Khi tài khoản chưa được cấu hình
  // quyền chi tiết (user_module_permissions còn rỗng) thì giữ danh mục theo vai trò,
  // tránh khoá nhầm toàn bộ người dùng khi hệ thống chưa seed quyền.
  const permissionConfigured = isAdminUser(data.user) || (data.modulePermissions || []).length > 0;
  const allowedModules = configuredModules(data).filter((item) => (!item.groupKey || visibleGroupKeys.has(String(item.groupKey))) && (!permissionConfigured || modulePermission(data, item.key).canView));
  const firstModule = allowedModules.find((item)=>item.key==="dashboard")?.key || allowedModules[0]?.key || "dashboard";
  const projectAccessAll=Boolean(data.projectAccessAll);
  const initialProject=data.projects.length===1?String(data.projects[0].id):"ALL";
  const mobileDepartmentStorageKey=`vntech-erp-ui-v4:mobile-department-expanded:${data.user?.id || "guest"}`;
  const [active, setActive] = useState<ModuleKey>(firstModule); const [projectSelection, setProjectSelection] = useState(initialProject); const [search, setSearch] = useState(""); const [searchOpen,setSearchOpen]=useState(false); const [modal, setModal] = useState<string | null>(data.user.mustChangePassword ? "forcePassword" : (linkedRequest ? "detail" : null)); const [selected, setSelected] = useState<Row | null>(linkedRequest); const [menuOpen, setMenuOpen] = useState(false); const [notifyOpen,setNotifyOpen]=useState(false); const [mobileNavOpen,setMobileNavOpen]=useState(false); const [mobileDepartmentExpanded,setMobileDepartmentExpanded]=useState<boolean>(()=>{if(typeof window==="undefined")return false;return window.localStorage.getItem(mobileDepartmentStorageKey)==="1";});
  const [projectWorkspaceId,setProjectWorkspaceId]=useState<string|null>(null);
  const [openProjectNodeId,setOpenProjectNodeId]=useState<string|null>(null);
  const lockedWorkspaceProject = projectWorkspaceId && PROJECT_WORKSPACE_CONTEXT_KEYS.has(active) && data.projects.some((row)=>String(row.id)===String(projectWorkspaceId)) ? String(projectWorkspaceId) : null;
  const project = lockedWorkspaceProject || (data.projects.length===1
    ? String(data.projects[0].id)
    : (projectSelection==="ALL" || data.projects.some((row)=>String(row.id)===String(projectSelection)))
      ? projectSelection
      : (data.projects.length>1?"ALL":String(data.projects[0]?.id||"ALL")));
  const setProject = setProjectSelection;
  const appearanceKey=`vntech-erp-ui-v4:appearance:${data.user.id}`;
  const fontScaleKey=`vntech-erp-ui-v4:font-scale:${data.user.id}`;
  const densityKey=`vntech-erp-ui-v4:density:${data.user.id}`;
  // The application exposes exactly two appearance states: Light and Dark.
  const [appearance,setAppearance]=useState<"light"|"dark">(()=>{if(typeof window==="undefined")return "light";const v=window.localStorage.getItem(appearanceKey);return v==="dark"?"dark":"light";});
  const [fontScale,setFontScale]=useState<number>(()=>{if(typeof window==="undefined")return 1;const v=Number(window.localStorage.getItem(fontScaleKey)||1);return [0.94,1,1.12].includes(v)?v:1;});
  const [uiDensity,setUiDensity]=useState<"comfortable"|"normal"|"compact">(()=>{if(typeof window==="undefined")return "normal";const v=window.localStorage.getItem(densityKey);return v==="comfortable"||v==="compact"?v:"normal";});
  const menuStorageKey = `vntech-erp-ui-v4:sidebar-open:${data.user.id}`;
  const [openGroups, setOpenGroups] = useState<string[]>(() => { if (typeof window === "undefined") return []; try { const parsed = JSON.parse(window.localStorage.getItem(menuStorageKey) || "[]"); return Array.isArray(parsed) ? parsed.slice(0, 2).map(String) : []; } catch { return []; } });
  const deptMenuStorageKey = `vntech-erp-ui-v4:dept-subgroups:${data.user?.id || "guest"}`;
  const [openDeptSubgroups,setOpenDeptSubgroups]=useState<string[]>(()=>{if(typeof window==="undefined")return [];try{const raw=window.localStorage.getItem(deptMenuStorageKey);if(raw===null)return [];const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed.map(String).filter((name)=>["Phòng Kế hoạch","Phòng Dự án","Tài chính Kế toán","Hành chính Pháp chế"].includes(name)):[];}catch{return [];}});
  const sidebarCollapsedKey=`vntech-erp-ui-v4:sidebar-collapsed:${data.user?.id || "guest"}`;
  const actionableApprovalNotifications=(data.requests||[]).filter((r:Row)=>r.status==="pending_approval"&&stageAllowedForUser((r.approvals||[]).find((a:Row)=>Number(a.stage)===Number(r.approvalStage))||data.approvalStages.find((a:Row)=>Number(a.stageNo)===Number(r.approvalStage)),data.user));
  const unreadTaskNotifications=(data.taskNotifications||[]).filter((n:Row)=>!n.readAt);
  const notificationCount=unreadTaskNotifications.length+actionableApprovalNotifications.length;
  const [sidebarCollapsed,setSidebarCollapsed]=useState<boolean>(()=>{if(typeof window==="undefined")return false;return window.localStorage.getItem(sidebarCollapsedKey)==="1";});
  const allowedSignature = allowedModules.map((item) => item.key).join("|");
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (!allowedModules.some((item) => item.key === active)) setActive(firstModule); }, [active, firstModule, allowedSignature]);
  useEffect(() => { try { window.localStorage.setItem(menuStorageKey, JSON.stringify(openGroups.slice(0, 2))); } catch { /* Trình duyệt có thể chặn localStorage. */ } }, [menuStorageKey, openGroups]);
  useEffect(()=>{try{window.localStorage.setItem(deptMenuStorageKey,JSON.stringify(openDeptSubgroups));}catch{/* localStorage có thể bị chặn */}},[deptMenuStorageKey,openDeptSubgroups]);
  useEffect(()=>{try{window.localStorage.setItem(mobileDepartmentStorageKey,mobileDepartmentExpanded?"1":"0");}catch{/* localStorage có thể bị chặn */}},[mobileDepartmentStorageKey,mobileDepartmentExpanded]);
  useEffect(()=>{if(!mobileNavOpen)return;const frame=window.requestAnimationFrame(()=>{const current=document.querySelector<HTMLElement>('.mobile-nav-panel [aria-current="page"]');current?.scrollIntoView({block:"nearest",inline:"nearest"});});return()=>window.cancelAnimationFrame(frame);},[mobileNavOpen,active]);
  useEffect(()=>{try{window.localStorage.setItem(sidebarCollapsedKey,sidebarCollapsed?"1":"0");}catch{/* localStorage có thể bị chặn */}},[sidebarCollapsedKey,sidebarCollapsed]);
  const toggleDeptSubgroup=(subGroup:string)=>setOpenDeptSubgroups((current)=>current.includes(subGroup)?current.filter((name)=>name!==subGroup):[...current,subGroup]);
  function activateModule(next:ModuleKey){
    const activeItem=allowedModules.find((item)=>item.key===next);
    const subGroup=activeItem?.groupKey==="department_management"?String(activeItem.subGroup||""):"";
    if(subGroup)setOpenDeptSubgroups((current)=>current.includes(subGroup)?current:[...current,subGroup]);
    setProjectWorkspaceId(null);
    setSearch("");setNotifyOpen(false);setMenuOpen(false);setSearchOpen(false);setActive(next);
  }
  function activateProjectModule(projectId:string,next:ModuleKey){
    const exists=data.projects.some((row)=>String(row.id)===String(projectId));
    if(!exists)return;
    setProjectSelection(String(projectId));
    setProjectWorkspaceId(String(projectId));
    setOpenProjectNodeId(String(projectId));
    setSearch("");setNotifyOpen(false);setMenuOpen(false);setSearchOpen(false);setActive(next);
  }
  // A project lock is navigation context only; never let it leak back into corporate modules.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{if(projectWorkspaceId&&!PROJECT_WORKSPACE_CONTEXT_KEYS.has(active))setProjectWorkspaceId(null);},[active,projectWorkspaceId]);
  // Navigation may also originate in child screens; keep these view-only states synchronized.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{const activeItem=allowedModules.find((item)=>item.key===active);const subGroup=activeItem?.groupKey==="department_management"?String(activeItem.subGroup||""):"";if(!subGroup)return;setOpenDeptSubgroups((current)=>current.includes(subGroup)?current:[...current,subGroup]);setMobileDepartmentExpanded(true);},[active,allowedSignature]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{setSearch("");setNotifyOpen(false);setMenuOpen(false);setSearchOpen(false);},[active]);
  useEffect(()=>{
    const root=document.documentElement;
    root.dataset.theme=appearance;root.style.setProperty("--user-font-scale",String(fontScale));document.body.dataset.uiDensity=uiDensity;
    try{window.localStorage.setItem(appearanceKey,appearance);window.localStorage.setItem(fontScaleKey,String(fontScale));window.localStorage.setItem(densityKey,uiDensity);}catch{}
  },[appearance,appearanceKey,fontScale,fontScaleKey,uiDensity,densityKey]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const activeGroup = allowedModules.find((item) => item.key === active)?.groupKey; if (!activeGroup) return; setOpenGroups((current) => current.includes(String(activeGroup)) ? current : [...current.slice(-1), String(activeGroup)]); }, [active, allowedSignature]);
  const globalSearchResults = useMemo(()=>{const q=search.trim().toLocaleLowerCase("vi");if(q.length<2)return [] as Row[];const out:Row[]=[];const add=(type:string,module:ModuleKey,id:unknown,title:unknown,subtitle:unknown,row?:Row)=>{const hay=`${title||""} ${subtitle||""}`.toLocaleLowerCase("vi");if(hay.includes(q)&&out.length<24)out.push({type,module,id,title:String(title||""),subtitle:String(subtitle||""),row});};data.projects.forEach(r=>add("Dự án","project_progress",r.id,`${r.code} · ${r.name}`,r.contractNo||"",r));data.materials.forEach(r=>add("Vật tư","material_catalog",r.id,`${r.code||r.materialCode||""} · ${r.name||r.materialName||""}`,r.unit||"",r));data.requests.forEach(r=>add("Phiếu đề nghị","requests",r.id,r.requestNo,`${r.projectCode||""} · ${r.requestedBy||""}`,r));data.purchaseOrders.forEach(r=>add("PO","purchasing",r.id,r.poNo,`${r.projectCode||""} · ${r.supplierName||""}`,r));data.teams.forEach(r=>add("Tổ đội","teams",r.id,`${r.code||""} · ${r.name||""}`,r.projectName||r.trade||"",r));data.workItems.forEach(r=>add("Nhiệm vụ",r.departmentCode==="KH"?"dept_plan_tasks":"dept_project_tasks",r.id,`${r.taskNo||""} · ${r.title||""}`,`${r.projectCode||""} · ${r.assignedToName||""}`,r));return out;},[search,data.projects,data.materials,data.requests,data.purchaseOrders,data.teams,data.workItems]);
  function openSearchResult(result:Row){activateModule(result.module as ModuleKey);if(result.row?.projectId)setProject(String(result.row.projectId));if(result.type==="Phiếu đề nghị"&&result.row)open("detail",result.row);}
  function submitGlobalSearch(event:FormEvent<HTMLFormElement>){event.preventDefault();const first=globalSearchResults[0];if(first)openSearchResult(first);else setSearchOpen(true);}
  const filteredRequests = useMemo(() => data.requests.filter((row) => (project === "ALL" || row.projectId === project) && (!search || `${row.requestNo} ${row.projectCode} ${row.requestedBy} ${row.area}`.toLowerCase().includes(search.toLowerCase()))), [data.requests, project, search]);
  const moduleMeta = configuredModules(data, true).find((item) => item.key === active);
  const selectedWorkspaceProject = lockedWorkspaceProject ? data.projects.find((item)=>String(item.id)===String(lockedWorkspaceProject)) : null;
  const activeWorkspaceItem = PROJECT_WORKSPACE_ITEMS.find((item)=>item.key===active||(item.related||[]).includes(active));
  const title: [string, string] = selectedWorkspaceProject&&activeWorkspaceItem ? [`${activeWorkspaceItem.label.replace(/^\d+\.\s*/,"")} · ${selectedWorkspaceProject.code}`, moduleUserDescription(active)] : [moduleMeta?.label || titles[active][0], moduleUserDescription(active)];
  const activePermission = modulePermission(data, active); const canUseActive = activePermission.canUse; const accessDenied = active!=="admin" ? (permissionConfigured && !activePermission.canView) : !isAdminUser(data.user); const showDashboardTopbar = active==="dashboard"; const showTopbarSearch = active==="dashboard"; const topbarHasUtility = true; function open(name: string, row?: Row) { setSelected(row ?? null); setModal(name); }
  function badgeFor(key: ModuleKey) { if(key==="dept_plan_tasks") return data.workItems.filter(r=>r.departmentCode==="KH"&&r.assignedTo===data.user.id&&!['COMPLETED','CANCELLED'].includes(String(r.status))).length; if(key==="dept_project_tasks") return data.workItems.filter(r=>r.departmentCode==="DA"&&r.assignedTo===data.user.id&&!['COMPLETED','CANCELLED'].includes(String(r.status))).length; return key === "approvals" ? pendingForRole(data.requests, data.user, data.approvalStages) : key === "purchasing" ? data.requests.filter((row) => row.supplyStatus === "awaiting_po").length : key === "receiving" ? data.receipts.filter((row) => row.bchConfirmationStatus === "pending").length : 0; }
  function toggleGroup(groupKey: string) { setOpenGroups((current) => current.includes(groupKey) ? current.filter((key) => key !== groupKey) : [groupKey]); }
  const projectWorkspaceItems = PROJECT_WORKSPACE_ITEMS.filter((item)=>allowedModules.some((module)=>module.key===item.key));
  const activeProjectWorkspace = Boolean(lockedWorkspaceProject && PROJECT_WORKSPACE_CONTEXT_KEYS.has(active));
  const workspaceNeedTabs = (["requests","inventory","warehouse_issue","material_norms"] as ModuleKey[]).filter((key)=>allowedModules.some((item)=>item.key===key));
  const workspaceFinanceTabs = (["capital_recovery","payments"] as ModuleKey[]).filter((key)=>allowedModules.some((item)=>item.key===key));
  const unassignedModules = allowedModules.filter((item) => !item.groupKey);
  const groupTree: Array<Row & { children: typeof allowedModules }> = menuGroups
    .filter((group)=>String(group.groupKey)!=="overview")
    .map((group): Row & { children: typeof allowedModules } => ({ ...group, children: allowedModules.filter((item) => item.key!=="dashboard" && String(item.groupKey) === String(group.groupKey)) }))
    .filter((group) => group.children.length > 0);
  if (unassignedModules.length) groupTree.push({ groupKey: "__other__", name: "Khác", icon: "•", sortOrder: 9999, active: true, collapsible: true, children: unassignedModules });
  return <div className={`app-shell vntech-full-ui ${sidebarCollapsed?"sidebar-collapsed":""}`} data-full-release={VNTECH_BRAND.release.build} data-mobile-nav-contract="VNTECH_MOBILE_NAV_20260907" data-ui-contract={VNTECH_UI_CONTRACT_ID} data-ui-build={VNTECH_UI_BUILD_MARKER} data-functional-ui={VNTECH_FUNCTIONAL_UI_MARKER} data-regression-lock={VNTECH_RUNTIME_REGRESSION_LOCK}><aside className="sidebar vntech-app-sidebar"><div className="brand brand-logo-only" data-vntech-product={VNTECH_BRAND.productId} data-vntech-fingerprint={VNTECH_BRAND.sourceFingerprintShort}><img className="brand-logo sidebar-logo" src={VNTECH_BRAND.logoPath} alt="VNTECH TECHNOLOGY FOR LIFE" /></div><nav className="tree-nav"><button type="button" className={`nav-dashboard-direct ${active==="dashboard"?"active":""}`} onClick={()=>activateModule("dashboard")}><NavIcon name="dashboard"/><span>TỔNG QUAN ĐIỀU HÀNH</span></button>
    {groupTree.map((group) => {
      const groupKey = String(group.groupKey);
      const opened = !group.collapsible || openGroups.includes(groupKey);
      const childActive = group.children.some((item) => item.key === active);
      const groupBadge = group.children.reduce((sum, item) => sum + badgeFor(item.key), 0);
      return <section className={`nav-tree-group ${childActive ? "has-active" : ""}`} data-nav-group={groupKey} data-nav-label={group.name} key={groupKey}>
        <button type="button" className={`nav-parent ${groupKey==="material_master"&&active==="material_catalog"?"active":""}`} onClick={() => groupKey==="material_master" ? activateModule("material_catalog") : group.collapsible && toggleGroup(groupKey)} aria-expanded={opened}>
          <NavIcon name={groupKey} kind="group"/>
          <span>{group.name}</span>
          {groupBadge > 0 && <b>{groupBadge}</b>}
          <em aria-hidden="true">{group.collapsible ? (opened ? "⌃" : "⌄") : ""}</em>
        </button>
        {(opened || sidebarCollapsed) && groupKey!=="material_master" && <div className="nav-children" data-nav-label={group.name}>{groupKey === "department_management" ? ["Phòng Kế hoạch","Phòng Dự án","Tài chính Kế toán","Hành chính Pháp chế"].map((subGroup) => { const items=group.children.filter((item)=>item.subGroup===subGroup); if(!items.length)return null; const subOpen=openDeptSubgroups.includes(subGroup); const subActive=items.some(item=>item.key===active); const deptTone=subGroup==="Phòng Kế hoạch"?"plan":subGroup==="Phòng Dự án"?"project":subGroup==="Tài chính Kế toán"?"finance":"legal"; return <div className={`nav-subgroup nav-subgroup-${deptTone} ${subActive?"has-active":""} ${subOpen?"is-open":"is-closed"}`} data-dept={deptTone} key={subGroup}><button type="button" className="nav-parent nav-subgroup-toggle" aria-expanded={subOpen} aria-controls={`dept-submenu-${subGroup}`} onClick={(event)=>{event.preventDefault();event.stopPropagation();toggleDeptSubgroup(subGroup);}}><NavIcon name={subGroup} kind="group"/><span className="nav-subgroup-title"><strong>{subGroup}</strong></span><span className="dept-chevron" aria-hidden="true">{subOpen?"⌃":"⌄"}</span></button><div id={`dept-submenu-${subGroup}`} className="nav-subgroup-items" hidden={!subOpen&&!sidebarCollapsed}>{items.map((item)=>{const badge=badgeFor(item.key);return <button type="button" key={item.key} className={`nav-child nav-child-dept-${deptTone} ${active===item.key?"active":""} ${DEVELOPMENT_MODULES.has(item.key)?"is-development":""}`} onClick={()=>activateModule(item.key)}><NavIcon name={item.key}/><span>{item.label}</span>{badge>0&&<b>{badge}</b>}</button>;})}</div></div>; }) : groupKey==="__site_command_tree_disabled__" ? data.projects.filter((p)=>String(p.status||"active")==="active").length===0?<div className="project-workspace-empty"><span className="muted">Chưa có dự án đang hoạt động — hãy tạo dự án đầu tiên qua Quản trị hệ thống để mở menu này.</span></div>:<>{data.projects.filter((p)=>String(p.status||"active")==="active").map((p)=>{const projectId=String(p.id);const projectOpen=openProjectNodeId===projectId||lockedWorkspaceProject===projectId;const projectActive=lockedWorkspaceProject===projectId&&PROJECT_WORKSPACE_CONTEXT_KEYS.has(active);return <div className={`nav-subgroup project-workspace-node ${projectActive?"has-active":""} ${projectOpen?"is-open":"is-closed"}`} key={`project-${p.id}`}><button type="button" className="nav-parent nav-subgroup-toggle project-workspace-toggle" aria-expanded={projectOpen} onClick={(event)=>{event.preventDefault();event.stopPropagation();setOpenProjectNodeId((current)=>current===projectId?null:projectId);}}><NavIcon name="site_command" kind="group"/><span className="nav-subgroup-title"><strong>{`${p.code} · ${p.name}`}</strong></span><span className="dept-chevron" aria-hidden="true">{projectOpen?"⌃":"⌄"}</span></button><div className="nav-subgroup-items project-workspace-items" hidden={!projectOpen}>{projectWorkspaceItems.map((item)=>{const itemActive=lockedWorkspaceProject===projectId&&(active===item.key||(item.related||[]).includes(active));return <button type="button" key={`${projectId}-${item.key}`} className={`nav-child nav-child-project-workspace ${itemActive?"active":""} ${DEVELOPMENT_MODULES.has(item.key)?"is-development":""}`} onClick={()=>activateProjectModule(projectId,item.key)}><NavIcon name={item.key}/><span>{item.label}</span></button>;})}</div></div>;})}</> : group.children.map((item) => { const badge = badgeFor(item.key); return <button type="button" key={item.key} className={`nav-child nav-child-${groupKey} ${active===item.key?"active":""} ${DEVELOPMENT_MODULES.has(item.key)?"is-development":""}`} onClick={() => activateModule(item.key)}><NavIcon name={item.key}/><span>{item.label}</span>{badge > 0 && <b>{badge}</b>}</button>; })}</div>}
      </section>;
    })}
  <button type="button" className="sidebar-collapse-toggle" onClick={()=>setSidebarCollapsed(value=>!value)} aria-label={sidebarCollapsed?"Mở rộng menu":"Thu gọn menu"} title={sidebarCollapsed?"Mở rộng menu":"Thu gọn menu"}><span aria-hidden="true">{sidebarCollapsed?"»":"«"}</span><b>{sidebarCollapsed?"MỞ MENU":"THU GỌN MENU"}</b></button></nav><div className="server-status" title={VNTECH_BRAND.legalOwner}><span /><div><strong>Máy chủ công ty</strong><small>Hệ thống nội bộ</small></div></div></aside>{mobileNavOpen&&<><div className="mobile-nav-backdrop" onClick={()=>setMobileNavOpen(false)} aria-hidden="true"/><div className={`mobile-nav-panel ${mobileDepartmentExpanded?"mobile-nav-expanded":"mobile-nav-root"}`} data-contract="VNTECH_MOBILE_NAV_STATES_ROOT_EXPANDED VNTECH_FULL_W2_MOBILE_NAV VNTECH_FULL_MOBILE_NAV_INTERACTION"><div className="mobile-nav-head"><div><img src={VNTECH_BRAND.logoPath} alt="VNTECH"/></div><button onClick={()=>setMobileNavOpen(false)} aria-label="Đóng menu">×</button></div><div className="mobile-nav-list mobile-nav-tree"><button type="button" className={`mobile-nav-dashboard ${active==="dashboard"?"active":""}`} aria-current={active==="dashboard"?"page":undefined} onClick={()=>{activateModule("dashboard");setMobileNavOpen(false);}}><NavIcon name="dashboard"/><span>TỔNG QUAN ĐIỀU HÀNH</span><em>›</em></button>{groupTree.filter((group)=>String(group.groupKey)!=="overview").map((group)=>{
          const groupKey=String(group.groupKey);
          const childActive=group.children.some((item)=>item.key===active);
          const groupBadge=group.children.reduce((sum,item)=>sum+badgeFor(item.key),0);
          const activeSiteProjects=groupKey==="site_command"?data.projects.filter((p)=>String(p.status||"active")==="active"):[];
          const singleChild=group.children.length===1?group.children[0]:null;
          const directChild=singleChild&&groupKey!=="department_management"&&groupKey!=="site_command"?singleChild:null;
          const opened=groupKey==="department_management"?mobileDepartmentExpanded:(!group.collapsible||openGroups.includes(groupKey));
          if(groupKey==="material_master")return <button type="button" key={groupKey} className={`mobile-nav-parent mobile-nav-direct ${active==="material_catalog"?"active":""}`} aria-current={active==="material_catalog"?"page":undefined} onClick={()=>{activateModule("material_catalog");setMobileNavOpen(false);}}><NavIcon name={groupKey} kind="group"/><span>{group.name}</span><em>›</em></button>;
          if(directChild)return <button type="button" key={groupKey} className={`mobile-nav-parent mobile-nav-direct ${active===directChild.key?"active":""}`} aria-current={active===directChild.key?"page":undefined} onClick={()=>{activateModule(directChild.key);setMobileNavOpen(false);}}><NavIcon name={groupKey} kind="group"/><span>{group.name}</span>{groupBadge>0&&<b>{groupBadge}</b>}<em>›</em></button>;
          // Project management always stays expandable because each project owns its own workspace tree.
          return <section key={groupKey} className={`mobile-nav-group ${childActive?"has-active":""}`} data-nav-action="expand"><button type="button" className="mobile-nav-parent mobile-nav-expand-only" onClick={()=>{if(groupKey==="department_management")setMobileDepartmentExpanded(value=>!value);else toggleGroup(groupKey);}} aria-expanded={opened} aria-label={`${opened?"Thu gọn":"Mở rộng"} ${group.name}`}><NavIcon name={groupKey} kind="group"/><span>{group.name}</span>{groupBadge>0&&<b>{groupBadge}</b>}<em>{opened?"⌃":"⌄"}</em></button>{opened&&<div className="mobile-nav-children">{groupKey==="department_management"?["Phòng Kế hoạch","Phòng Dự án","Tài chính Kế toán","Hành chính Pháp chế"].map((subGroup)=>{const items=group.children.filter((item)=>item.subGroup===subGroup);if(!items.length)return null;const subOpen=openDeptSubgroups.includes(subGroup);const subActive=items.some((item)=>item.key===active);return <section key={subGroup} className={`mobile-nav-subgroup ${subActive?"has-active":""}`} data-nav-action="expand"><button type="button" className="mobile-nav-subgroup-toggle mobile-nav-expand-only" onClick={()=>toggleDeptSubgroup(subGroup)} aria-expanded={subOpen} aria-label={`${subOpen?"Thu gọn":"Mở rộng"} ${subGroup}`}><NavIcon name={subGroup} kind="group"/><span>{subGroup}</span><em>{subOpen?"⌃":"⌄"}</em></button>{subOpen&&<div className="mobile-nav-grandchildren">{items.map((item)=>{const badge=badgeFor(item.key);return <button type="button" key={item.key} className={active===item.key?"active":""} aria-current={active===item.key?"page":undefined} data-nav-action="navigate" onClick={()=>{activateModule(item.key);setMobileNavOpen(false);}}><span>{item.label}</span>{badge>0&&<b>{badge}</b>}<em aria-hidden="true">›</em></button>;})}</div>}</section>;}) : groupKey==="__site_command_tree_disabled__" ? activeSiteProjects.map((p)=>{const projectId=String(p.id);const projectOpen=openProjectNodeId===projectId||lockedWorkspaceProject===projectId;const projectActive=lockedWorkspaceProject===projectId&&PROJECT_WORKSPACE_CONTEXT_KEYS.has(active);return <section key={`mobile-project-${p.id}`} className={`mobile-nav-subgroup project-workspace-mobile ${projectActive?"has-active":""}`} data-nav-action="expand"><button type="button" className="mobile-nav-subgroup-toggle mobile-nav-expand-only" onClick={()=>setOpenProjectNodeId((current)=>current===projectId?null:projectId)} aria-expanded={projectOpen}><NavIcon name="site_command" kind="group"/><span>{`${p.code} · ${p.name}`}</span><em>{projectOpen?"⌃":"⌄"}</em></button>{projectOpen&&<div className="mobile-nav-grandchildren">{projectWorkspaceItems.map((item)=>{const itemActive=lockedWorkspaceProject===projectId&&(active===item.key||(item.related||[]).includes(active));return <button type="button" key={`${projectId}-${item.key}`} className={itemActive?"active":""} aria-current={itemActive?"page":undefined} data-nav-action="navigate" onClick={()=>{activateProjectModule(projectId,item.key);setMobileNavOpen(false);}}><span>{item.label}</span><em aria-hidden="true">›</em></button>;})}</div>}</section>;}) : group.children.map((item)=>{const badge=badgeFor(item.key);return <button type="button" key={item.key} className={active===item.key?"active":""} aria-current={active===item.key?"page":undefined} data-nav-action="navigate" onClick={()=>{activateModule(item.key);setMobileNavOpen(false);}}><span>{item.label}</span>{badge>0&&<b>{badge}</b>}<em aria-hidden="true">›</em></button>;})}</div>}</section>;
        })}</div><button type="button" className="mobile-nav-collapse" onClick={()=>setMobileNavOpen(false)}><span aria-hidden="true">«</span><b>THU GỌN MENU</b></button><div className="mobile-display-settings"><button onClick={()=>setAppearance(value=>value==="dark"?"light":"dark")}><span>GIAO DIỆN</span><b>{appearance==="light"?"☀ SÁNG":"☾ TỐI"}</b></button><button onClick={()=>setUiDensity(v=>v==="normal"?"comfortable":v==="comfortable"?"compact":"normal")}><span>MẬT ĐỘ</span><b>{uiDensity==="comfortable"?"THOÁNG":uiDensity==="compact"?"CHẶT":"VỪA"}</b></button></div><div className="mobile-server-status"><i/><div><strong>Máy chủ công ty</strong><small>Hệ thống nội bộ</small></div></div></div></>}<main><header className={`topbar vntech-app-header ${showDashboardTopbar?"topbar-dashboard":"topbar-contextual"}`}><img className="topbar-city-art topbar-city-light" src="/vntech-header-city-light.webp" alt="" aria-hidden="true"/><img className="topbar-city-art topbar-city-dark" src="/vntech-header-city-dark.webp" alt="" aria-hidden="true"/><button className={`mobile-nav-toggle ${mobileNavOpen?"is-open":""}`} onClick={()=>setMobileNavOpen(value=>!value)} aria-label={mobileNavOpen?"Đóng menu":"Mở menu"}>{mobileNavOpen?"×":"☰"}</button><div className="mobile-brand-lockup"><img src={VNTECH_BRAND.logoPath} alt="VNTECH"/></div>{showTopbarSearch&&<form className="global-search" onSubmit={submitGlobalSearch}><button type="submit" className="global-search-icon" aria-label="Tìm kiếm" title="Tìm kiếm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.6-3.6"/></svg></button><input value={search} onFocus={()=>setSearchOpen(true)} onChange={(event) => {setSearch(event.target.value);setSearchOpen(true);}} placeholder="TÌM NHANH DỰ ÁN, PHIẾU, PO, VẬT TƯ…" />{searchOpen&&search.trim().length>=2&&<div className="global-search-results">{globalSearchResults.map((r,index)=><button type="button" key={`${r.type}-${r.id}-${index}`} onClick={()=>openSearchResult(r)}><b>{r.type}</b><span>{r.title}</span><small>{r.subtitle}</small></button>)}{!globalSearchResults.length&&<p>Không tìm thấy dữ liệu trong phạm vi quyền hiện tại.</p>}</div>}</form>}{!topbarHasUtility&&<div className="topbar-context-fill" aria-hidden="true"><i/><i/></div>}<div className="topbar-actions"><button className="theme-switch" onClick={()=>setAppearance(value=>value==="dark"?"light":"dark")} title={`Giao diện: ${appearance==="light"?"Sáng":"Tối"}`}><span>☀</span><i className={appearance==="dark"?"dark":"light"}></i><span>☾</span></button><div className="task-notify-wrap"><button className="notify-button" title="Thông báo" onClick={()=>setNotifyOpen(v=>!v)}><NavIcon name="dept_plan_alerts"/>{notificationCount>0&&<b>{notificationCount>99?"99+":notificationCount}</b>}</button>{notifyOpen&&<div className="task-notify-popover" role="dialog" aria-label="Thông báo công việc"><header><strong>Thông báo công việc</strong><span>{notificationCount} cần xử lý</span><button type="button" className="notify-close" aria-label="Đóng thông báo" onClick={()=>setNotifyOpen(false)}>×</button></header>{actionableApprovalNotifications.slice(0,5).map((r:Row)=><button key={`approval-${r.id}`} className="approval-notice" onClick={()=>{setNotifyOpen(false);setActive("approvals");open("detail",r);}}><b>Phiếu chờ duyệt · {r.requestNo}</b><span>{r.projectCode} · Bước {r.approvalStage} · {statusLabel(r)}</span><small>{date(r.requestedAt)}</small></button>)}{data.taskNotifications.slice(0,8).map(n=><button key={n.id} className={n.readAt?"read":""} onClick={async()=>{await action("mark_task_notification_read",{notificationId:n.id});setNotifyOpen(false);const task=data.workItems.find(t=>t.id===n.workItemId);if(task)setActive(task.departmentCode==="KH"?"dept_plan_tasks":"dept_project_tasks");}}><b>{n.title}</b><span>{n.body}</span><small>{date(n.createdAt)}</small></button>)}{notificationCount===0&&<p>Chưa có thông báo hoặc phiếu cần xử lý.</p>}</div>}</div></div><div className="user-menu"><button onClick={() => setMenuOpen((value) => !value)}><span className="header-user-avatar">{data.user.avatarUrl?<img src={String(data.user.avatarUrl)} alt="Ảnh đại diện"/>:initials(data.user.fullName)}</span><div><strong>{data.user.fullName}</strong><small>{roleLabel(data, data.user.role)}</small></div><i>⌄</i></button>{menuOpen && <div className="user-popover"><div className="popover-setting"><span>CỠ CHỮ</span><div><button className={fontScale===0.94?"active":""} onClick={()=>setFontScale(0.94)}>A−</button><button className={fontScale===1?"active":""} onClick={()=>setFontScale(1)}>A</button><button className={fontScale===1.12?"active":""} onClick={()=>setFontScale(1.12)}>A+</button></div></div><div className="popover-setting"><span>MẬT ĐỘ DỮ LIỆU</span><div><button className={uiDensity==="comfortable"?"active":""} onClick={()=>setUiDensity("comfortable")}>THOÁNG</button><button className={uiDensity==="normal"?"active":""} onClick={()=>setUiDensity("normal")}>VỪA</button><button className={uiDensity==="compact"?"active":""} onClick={()=>setUiDensity("compact")}>CHẶT</button></div></div><button onClick={() => { open("accountSettings"); setMenuOpen(false); }}>Cài đặt tài khoản</button><button onClick={logout}>Đăng xuất</button></div>}</div></header><div className={`main-content ${showDashboardTopbar?"main-content-dashboard":""}`}> <section className="page-heading"><div>{showDashboardTopbar&&<p>VNTECH ERP <span>/</span> {title[0]}</p>}<h1>{title[0]}</h1><small>{title[1]}</small></div></section>{isAdminUser(data.user)&&<AdminModuleGuide moduleKey={active}/>} {accessDenied?<AccessDeniedPanel/>:<>{!["material_catalog","central_warehouse","admin"].includes(active)&&(activeProjectWorkspace&&selectedWorkspaceProject?<div className="inline-alert project-context-lock"><strong>DỰ ÁN ĐANG LÀM VIỆC · {selectedWorkspaceProject.code} · {selectedWorkspaceProject.name}</strong><span>Phạm vi đã khóa theo workspace dự án; BOQ, nhu cầu, kho và tài chính dùng cùng projectId.</span></div>:<ProjectScopeSelect projects={data.projects} project={project} onChange={setProject} allowAll={data.projects.length>1}/>)} {activeProjectWorkspace&&selectedWorkspaceProject&&workspaceNeedTabs.includes(active)&&<div className="row-actions project-workspace-tabs" aria-label="Liên kết Đề xuất và Nhu cầu"><button className={active==="requests"?"primary":"secondary"} onClick={()=>activateProjectModule(String(lockedWorkspaceProject),"requests")}>Đề nghị mua hàng</button>{workspaceNeedTabs.includes("inventory")&&<button className={active==="inventory"?"primary":"secondary"} onClick={()=>activateProjectModule(String(lockedWorkspaceProject),"inventory")}>Tồn kho / Điều chuyển</button>}{workspaceNeedTabs.includes("warehouse_issue")&&<button className={active==="warehouse_issue"?"primary":"secondary"} onClick={()=>activateProjectModule(String(lockedWorkspaceProject),"warehouse_issue")}>Cấp phát kho</button>}{workspaceNeedTabs.includes("material_norms")&&<button className={active==="material_norms"?"primary":"secondary"} onClick={()=>activateProjectModule(String(lockedWorkspaceProject),"material_norms")}>Định mức dự án</button>}</div>}{activeProjectWorkspace&&selectedWorkspaceProject&&workspaceFinanceTabs.includes(active)&&<div className="row-actions project-workspace-tabs" aria-label="Tài chính và Thanh quyết toán"><button className={active==="capital_recovery"?"primary":"secondary"} onClick={()=>activateProjectModule(String(lockedWorkspaceProject),"capital_recovery")}>Thu hồi vốn</button>{workspaceFinanceTabs.includes("payments")&&<button className={active==="payments"?"primary":"secondary"} onClick={()=>activateProjectModule(String(lockedWorkspaceProject),"payments")}>Thanh toán HĐ</button>}</div>} {DEVELOPMENT_MODULES.has(active)&&active!=="boq"&&<DevelopmentNotice/>}{globalError && <div className="inline-alert danger">{globalError}</div>}
    
    {active === "dashboard" && <Dashboard data={data} project={project} navigate={setActive} open={open} />}{active === "site_command" && <ProjectManagement data={data} project={project} onProject={setProject} open={open} action={action} />}{active === "project_progress" && <ProjectProgress data={data} project={project} onProject={setProject} />}{/* GĐ4 — hai module "Nhiệm vụ nhân viên đang làm" nay dùng màn CÔNG VIỆC thống nhất */}
    {(active === "dept_plan_tasks" || active === "dept_project_tasks") && <WorkCenter data={data} action={action} refresh={refresh} />}{active.startsWith("dept_plan_") && active !== "dept_plan_tasks" && <DepartmentTaskWorkspace data={data} department="KH" moduleKey={active} project={project} onProject={setProject} action={action} navigate={setActive} />}{active.startsWith("dept_project_") && active !== "dept_project_tasks" && <DepartmentTaskWorkspace data={data} department="DA" moduleKey={active} project={project} onProject={setProject} action={action} navigate={setActive} />}{active === "construction" && <ConstructionScreen data={data} project={project} action={action} permission={activePermission} />}{active === "dept_finance_recovery" && <FinanceRecoveryScreen data={data} project={project} action={action} />}{active === "dept_legal_hr" && <HrScreen data={data} project={project} action={action} permission={activePermission} open={open} />}{active === "dept_legal_labor" && <LaborScreen data={data} project={project} action={action} permission={activePermission} />}{active === "dept_legal_correspondence" && <CorrespondenceScreen data={data} project={project} action={action} permission={activePermission} />}{active === "dept_legal_documents" && <LegalDocsScreen data={data} project={project} action={action} permission={activePermission} />}{active === "dept_legal_seal" && <SealScreen data={data} project={project} action={action} permission={activePermission} />}{active === "dept_legal_benefits" && <BenefitsScreen data={data} project={project} action={action} permission={activePermission} />}{active === "dept_finance_documents" && <DocumentsScreen data={data} project={project} action={action} permission={activePermission} />}{active === "dept_finance_cashbank" && <CashbankScreen data={data} project={project} action={action} permission={activePermission} />}{active === "dept_finance_site_cost" && <SiteCostScreen data={data} project={project} action={action} permission={activePermission} />}{active === "dept_finance_advance" && <AdvanceScreen data={data} project={project} action={action} permission={activePermission} />}{active === "dept_finance_payment_plan" && <PaymentPlanScreen data={data} project={project} action={action} permission={activePermission} />}{active === "material_norms" && <MaterialNormsScreen data={data} project={project} action={action} permission={activePermission} />}{active.startsWith("dept_finance_")||active.startsWith("dept_legal_") ? <DevelopmentModule title={title[0]} note={title[1]} /> : null}{active === "site_command" && <SiteCommandScreen data={data} project={project} action={action} />}{active === "production" && <ProductionReports data={data} project={project} action={action} permission={activePermission} />}{active === "capital_recovery" && <CapitalRecovery data={data} project={project} action={action} permission={activePermission} />}{active === "requests" && <Requests rows={filteredRequests} projects={data.projects} project={project} onProject={setProject} open={open} inventory={data.inventory} exportRows={() => exportRequestsXlsx(filteredRequests)} />}{active === "approvals" && <Approvals data={data} rows={data.requests.filter((row)=>(project==="ALL"||row.projectId===project))} projects={data.projects} project={project} onProject={setProject} user={data.user} action={action} open={open} canUse={canUseActive} refresh={refresh} />}{active === "purchasing" && <Purchasing data={data} project={project} open={open} action={action} canUse={canUseActive} />}{active === "supplier_catalog" && <SupplierManager data={data} action={action} />}{active === "receiving" && <Receiving data={data} project={project} open={open} canUse={canUseActive} />}{active === "delivered" && <Delivered data={data} project={project} open={open} />}{active === "warehouse_receipt" && <WarehouseReceipt data={data} project={project} open={open} canUse={canUseActive} />}{active === "warehouse_issue" && <WarehouseIssueTeams data={data} project={project} open={open} canUse={canUseActive} />}{active === "inventory" && <Inventory data={data} project={project} open={open} />}{active === "central_warehouse" && <CentralWarehouse data={data} open={open} action={action} permission={activePermission} />}{active === "material_catalog" && <MaterialCatalogPage data={data} open={open} action={action} permission={activePermission} />}{active === "boq" && <BoqControl data={data} project={project} open={open} action={action} canUse={canUseActive} />}{active === "payments" && <Payments data={data} project={project} action={action} canCreate={Boolean(activePermission.canCreate)} canEdit={Boolean(activePermission.canEdit)} refresh={refresh} />}{active === "teams" && <TeamManagement data={data} open={open} />}{active === "stocktake" && <Stocktake data={data} open={open} action={action} canUse={canUseActive} />}{active === "reports" && <Reports data={data} project={project} />}{active === "admin" && isAdminUser(data.user) && <Admin data={data} open={open} action={action} />}</>}</div><footer className="vntech-product-footer" data-product-id={VNTECH_BRAND.productId}><span>{VNTECH_BRAND.copyright}</span><b>VNTECH ERP</b></footer></main>
    {selected && modal === "detail" && <RequestDrawer variant="page" data={data} request={selected} approvalStages={data.approvalStages} close={() => { setModal(null); if (new URLSearchParams(window.location.search).has("request")) window.history.replaceState({}, "", window.location.pathname); }} action={action} user={data.user} />}
    {selected && modal === "receiptDetail" && <ReceiptDrawer data={data} receipt={selected} user={data.user} close={() => setModal(null)} action={action} />}
    {modal === "centralReturn" && <CentralReturnModal data={data} close={() => setModal(null)} submit={action} />}
    {modal === "transfer" && <TransferModal data={data} close={() => setModal(null)} submit={action} />}{modal === "centralReceive" && selected && <CentralReceiveModal row={selected} close={() => setModal(null)} submit={action} />}
    {modal === "request" && <RequestModal data={data} contextProject={project} close={() => setModal(null)} submit={action} />}{modal === "po" && <PoModal data={data} initialRequestId={selected?.id} close={() => setModal(null)} submit={action} />}{modal === "receipt" && <ReceiptModal data={data} close={() => setModal(null)} submit={action} />}{modal === "teamCreate" && <TeamCreateModal data={data} close={() => setModal(null)} submit={action} />}{modal === "issue" && <IssueModal data={data} close={() => setModal(null)} submit={action} />}{modal === "install" && <InstallModal data={data} close={() => setModal(null)} submit={action} />}{modal === "return" && <ReturnModal data={data} close={() => setModal(null)} submit={action} />}{modal === "count" && <CountModal data={data} close={() => setModal(null)} submit={action} />}{modal === "user" && <UserModal data={data} close={() => setModal(null)} submit={action} />}{modal === "systemLevelMaster" && <SystemLevelModal data={data} row={selected ?? undefined} close={() => setModal(null)} submit={action} />}{modal === "workflowMaster" && <WorkflowModal data={data} row={selected ?? undefined} close={() => setModal(null)} submit={action} />}{modal === "userProfile" && selected && <UserProfilePanel data={data} row={selected} close={() => setModal(null)} open={open} />}{modal === "userProfileHr" && selected && <UserProfilePanel data={data} row={selected} close={() => setModal(null)} open={open} showDocuments />}{modal === "userEdit" && selected && <UserEditModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "access" && selected && <UserAccessModal data={data} userRow={selected} close={() => setModal(null)} submit={action} />}{modal === "moduleMaster" && selected && <ModuleCatalogModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "menuGroupMaster" && <MenuGroupModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "roleMaster" && <RoleCatalogModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "businessGroupMaster" && <BusinessGroupModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "approvalStageMaster" && <ApprovalStageModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "projectMaster" && <ProjectModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "categoryMaster" && <CategoryModal row={selected} close={() => setModal(null)} submit={action} />}{modal === "materialSubcategoryMaster" && <MaterialSubcategoryModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "materialMaster" && <MaterialModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "materialMerge" && <MaterialMergeModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "projectContract" && selected && <ProjectContractModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "boqVersion" && selected && <BoqVersionModal data={data} row={selected} close={() => setModal(null)} submit={action} />}{modal === "boqItem" && <BoqItemModal data={data} row={selected} projectId={selected?.projectId || (project === "ALL" ? data.projects[0]?.id : project)} close={() => setModal(null)} submit={action} />}{modal === "email" && <EmailSettingsModal data={data} close={() => setModal(null)} submit={action} />}{modal === "accountSettings" && <AccountSettingsModal user={data.user} close={() => setModal(null)} submit={action} />}{modal === "forcePassword" && <ForcedPasswordModal user={data.user} submit={action} />}{toast && <div className="toast"><span>✓</span>{toast}</div>}</div>;
}


const DEPT_MODULE_GROUP: Record<string,string> = {
  dept_plan_supply_plan:"KẾ HOẠCH",dept_plan_tender:"ĐẤU THẦU",dept_plan_rfq:"RFQ",dept_plan_purchasing:"MUA HÀNG",dept_plan_supply:"CUNG ỨNG",dept_plan_contracts:"HỢP ĐỒNG",dept_plan_suppliers:"NCC",dept_plan_price_data:"GIÁ",dept_plan_kpi:"KPI",dept_plan_alerts:"CẢNH BÁO",
  dept_project_pda:"PDA",dept_project_plan:"KẾ HOẠCH",dept_project_shop:"SHOPDRAWING",dept_project_boq:"BOQ",dept_project_material:"VẬT TƯ",dept_project_issues:"PHÁT SINH",dept_project_asbuilt:"HOÀN CÔNG",dept_project_payment:"THANH TOÁN",dept_project_tender:"ĐẤU THẦU",dept_project_kpi:"KPI",dept_project_alerts:"CẢNH BÁO"
};
function taskStatusLabel(value:string){const map:Record<string,string>={NEW:"Mới giao",IN_PROGRESS:"Đang thực hiện",WAITING_SUPPLIER:"Chờ NCC",WAITING_CLIENT:"Chờ CĐT/TVGS",WAITING_APPROVAL:"Chờ duyệt",WAITING_PROJECT:"Chờ BCH/Dự án",BLOCKED:"Bị chặn",ON_HOLD:"Tạm dừng",SUBMITTED:"Đã gửi kiểm tra",REWORK:"Yêu cầu chỉnh sửa",COMPLETED:"Hoàn thành",CANCELLED:"Hủy"};return map[value]||value;}
function AccessDeniedPanel(){return <section className="card access-denied-panel"><img src={VNTECH_BRAND.logoPath} alt="VNTECH"/><strong>{VNTECH_COMPANY_DISPLAY_NAME}</strong><h2>CHƯA ĐƯỢC PHÂN QUYỀN</h2><p>Tài khoản của bạn chưa có quyền xem dữ liệu nghiệp vụ của chức năng này. Vui lòng liên hệ Quản trị hệ thống nếu cần cấp quyền.</p></section>;}

function DepartmentTaskWorkspace({data,department,moduleKey,project,onProject,action,navigate}:{data:AppData;department:"KH"|"DA";moduleKey:ModuleKey;project:string;onProject:(v:string)=>void;action:(name:string,payload:Row)=>Promise<boolean>;navigate:(v:ModuleKey)=>void}){
  const [status,setStatus]=useState("ALL"),[assignee,setAssignee]=useState("ALL"),[query,setQuery]=useState(""),[selectedId,setSelectedId]=useState("");
  const assignmentMode=moduleKey===(department==="KH"?"dept_plan_assign":"dept_project_assign"); const taskHome=moduleKey===(department==="KH"?"dept_plan_tasks":"dept_project_tasks"); const groupFilter=DEPT_MODULE_GROUP[moduleKey]||"";
  const departmentUsers=data.staffDirectory.filter(u=>department==="KH"?["procurement","kh_nv","kh_truong"].includes(String(u.role))||String(u.roleName).toLowerCase().includes("kế hoạch"):["project","da_nv","da_truong"].includes(String(u.role))||String(u.roleName).toLowerCase().includes("dự án"));
  const rows=data.workItems.filter(r=>r.departmentCode===department&&(project==="ALL"||r.projectId===project)&&(!groupFilter||String(r.workGroup||"").toUpperCase().includes(groupFilter))&&(status==="ALL"||r.status===status)&&(assignee==="ALL"||r.assignedTo===assignee)&&(!query||`${r.taskNo} ${r.title} ${r.projectCode||""} ${r.sourceNo||""} ${r.assignedToName||""}`.toLowerCase().includes(query.toLowerCase())));
  const activeRows=data.workItems.filter(r=>r.departmentCode===department&&!['COMPLETED','CANCELLED'].includes(String(r.status))); const nowMs=UI_NOW_MS; const overdue=activeRows.filter(r=>r.dueAt&&new Date(r.dueAt).getTime()<nowMs&&!String(r.status).startsWith('WAITING')&&!['BLOCKED','ON_HOLD','SUBMITTED'].includes(String(r.status))).length; const waiting=activeRows.filter(r=>String(r.status).startsWith('WAITING')||['BLOCKED','ON_HOLD'].includes(String(r.status))).length; const dueSoon=activeRows.filter(r=>r.dueAt&&new Date(r.dueAt).getTime()>=nowMs&&new Date(r.dueAt).getTime()-nowMs<=3*86400000).length; const completedMonth=data.workItems.filter(r=>r.departmentCode===department&&r.status==='COMPLETED'&&String(r.completedAt||'').slice(0,7)===UI_TODAY.slice(0,7)).length;
  const selected=rows.find(r=>r.id===selectedId)||rows[0]||null; const events=selected?data.workItemEvents.filter(e=>e.workItemId===selected.id):[];
  async function manualSubmit(e:FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const ok=await action('create_work_item',{departmentCode:department,title:f.get('title'),description:f.get('description'),projectId:f.get('projectId'),workGroup:f.get('workGroup'),assignedTo:f.get('assignedTo'),dueAt:f.get('dueAt'),priority:f.get('priority'),requiredOutput:f.get('requiredOutput')});if(ok)e.currentTarget.reset();}
  async function setTaskStatus(next:string){if(!selected)return;let reason='';if(['WAITING_SUPPLIER','WAITING_CLIENT','WAITING_APPROVAL','WAITING_PROJECT','BLOCKED','ON_HOLD','REWORK','CANCELLED'].includes(next)){reason=window.prompt('Nhập lý do/bằng chứng:')||'';if(!reason)return;}await action('update_work_item_status',{workItemId:selected.id,status:next,reason});}
  const title=department==="KH"?"PHÒNG KẾ HOẠCH":"PHÒNG DỰ ÁN"; const isAdmin=isAdminUser(data.user);
  return <div className="stack department-workspace">
    <div className="dept-page-head"><div><h2>{taskHome||assignmentMode?`NHIỆM VỤ NHÂN VIÊN ĐANG LÀM - ${title}`:titles[moduleKey][0].toUpperCase()}</h2><p>{moduleUserDescription(moduleKey)}</p></div>{assignmentMode&&isAdmin&&<span className="dept-rule">Giao việc = NEW + SLA chạy ngay + thông báo App/Email</span>}</div>
    <div className="kpi-grid dept-kpi-grid"><Kpi icon="NV" label="Tổng nhiệm vụ" value={String(data.workItems.filter(r=>r.departmentCode===department).length)} note="Tất cả"/><Kpi icon="ĐL" label="Đang thực hiện" value={String(activeRows.filter(r=>['NEW','IN_PROGRESS','REWORK'].includes(String(r.status))).length)} note="SLA đang tính" tone="blue"/><Kpi icon="CH" label="Chờ bên khác" value={String(waiting)} note="Tách khỏi lỗi cá nhân" tone="violet"/><Kpi icon="QH" label="Quá hạn" value={String(overdue)} note="Do trách nhiệm cá nhân" tone="red"/><Kpi icon="SH" label="Sắp đến hạn" value={String(dueSoon)} note="Trong 3 ngày" tone="amber"/><Kpi icon="HT" label="Hoàn thành T. này" value={String(completedMonth)} note="Đã xác nhận" tone="green"/></div>
    {assignmentMode&&<section className="card dept-assign-card"><CardHead title="Giao việc bổ sung" note={isAdmin?"Chỉ dùng cho công việc không có chứng từ nghiệp vụ nguồn; task ERP được tự sinh để tránh nhập trùng.":"Tạo công việc bổ sung và giao cho nhân viên phù hợp."}/><form className="dept-assign-form" onSubmit={manualSubmit}><input name="title" required placeholder="Nội dung công việc"/><select name="projectId" defaultValue=""><option value="">Không gắn dự án</option>{data.projects.map(p=><option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}</select><select name="workGroup" defaultValue="GIAO_VIEC_BO_SUNG"><option value="GIAO_VIEC_BO_SUNG">Giao việc bổ sung</option><option value="KẾ HOẠCH">Kế hoạch</option><option value="BÁO CÁO">Báo cáo</option><option value="NGHIÊN CỨU">Nghiên cứu</option></select><select name="assignedTo" required defaultValue=""><option value="">Chọn nhân viên</option>{departmentUsers.map(u=><option key={u.id} value={u.id}>{u.fullName} - {u.roleName}</option>)}</select><input name="dueAt" type="datetime-local" required/><select name="priority" defaultValue="normal"><option value="critical">Khẩn cấp</option><option value="high">Cao</option><option value="normal">Trung bình</option><option value="low">Thấp</option></select><input name="requiredOutput" placeholder="Đầu ra bắt buộc"/><input name="description" placeholder="Mô tả / ghi chú giao việc"/><button className="primary">＋ Giao việc</button></form></section>}
    <section className="card dept-filter-card"><div className="dept-filters"><span className="global-project-scope-chip">Dự án: {project==="ALL"?"Tất cả":data.projects.find(p=>p.id===project)?.code||project}</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">Tất cả trạng thái</option>{['NEW','IN_PROGRESS','WAITING_SUPPLIER','WAITING_CLIENT','WAITING_APPROVAL','WAITING_PROJECT','BLOCKED','ON_HOLD','SUBMITTED','REWORK','COMPLETED'].map(v=><option key={v} value={v}>{taskStatusLabel(v)}</option>)}</select><select value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="ALL">Tất cả nhân viên</option>{departmentUsers.map(u=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm nhiệm vụ, số phiếu, dự án..."/><button className="secondary" onClick={()=>downloadCsv(["Mã nhiệm vụ","Công việc","Dự án","Nhân viên","Hạn","Trạng thái","Tiến độ"],rows.map(r=>[r.taskNo,r.title,r.projectCode||"",r.assignedToName,r.dueAt||"",taskStatusLabel(r.status),r.progress]),`Nhiem_vu_${department}`)}>⇩ Xuất</button></div></section>
    <div className="dept-task-layout"><section className="card dept-task-table"><div className="dept-task-tabs"><span className="active">Tất cả ({rows.length})</span><span>Tự động từ nghiệp vụ ({rows.filter(r=>r.taskOrigin==='automatic').length})</span><span>Giao việc bổ sung ({rows.filter(r=>r.taskOrigin==='manual').length})</span></div><div className="table-wrap"><table><thead><tr><th>Mã nhiệm vụ</th><th>Nội dung công việc</th><th>Dự án</th><th>Nhóm công việc</th><th>Nguồn (Liên kết)</th><th>Nhân viên</th><th>Hạn hoàn thành</th><th>Trạng thái</th><th>Ưu tiên</th><th>%</th></tr></thead><tbody>{rows.map(r=>{const late=r.dueAt&&new Date(r.dueAt).getTime()<nowMs&&!['COMPLETED','CANCELLED'].includes(String(r.status));return <tr key={r.id} className={selected?.id===r.id?'selected-row':''} onClick={()=>setSelectedId(r.id)}><td><strong className="code">{r.taskNo}</strong></td><td>{r.title}</td><td>{r.projectCode||'—'}</td><td><span className="task-group-tag">{r.workGroup}</span></td><td>{r.sourceNo?<button className="link-button" onClick={e=>{e.stopPropagation();const target=(r.sourceModule||'') as ModuleKey;if(modules.some(m=>m.key===target))navigate(target);}}>{r.sourceNo}</button>:<span>MANUAL</span>}</td><td>{r.assignedToName}</td><td className={late?'red-text':''}>{date(r.dueAt)}</td><td><StatusBadge value={taskStatusLabel(r.status)}/></td><td>{r.priority==='critical'?'Khẩn':r.priority==='high'?'Cao':r.priority==='low'?'Thấp':'Trung bình'}</td><td><div className="task-progress"><span>{r.progress}%</span><i><b style={{width:`${r.progress}%`}}/></i></div></td></tr>})}{!rows.length&&<tr><td colSpan={10}><Empty text="Chưa có nhiệm vụ phù hợp bộ lọc."/></td></tr>}</tbody></table></div></section>
    <aside className="card task-detail-panel">{selected?<><div className="task-detail-head"><div><small>{selected.sourceType||'TASK'} · {selected.taskOrigin==='automatic'?'TỰ ĐỘNG':'BỔ SUNG'}</small><h3>{selected.title}</h3></div><StatusBadge value={taskStatusLabel(selected.status)}/></div><dl><dt>Dự án</dt><dd>{selected.projectCode?`${selected.projectCode} - ${selected.projectName}`:'—'}</dd><dt>Nhân viên phụ trách</dt><dd>{selected.assignedToName}</dd><dt>Người giao</dt><dd>{selected.assignedByName}</dd><dt>Ngày giao việc</dt><dd>{date(selected.assignedAt)}</dd><dt>Hạn hoàn thành</dt><dd>{date(selected.dueAt)}</dd><dt>Ưu tiên</dt><dd>{selected.priority}</dd><dt>% hoàn thành</dt><dd>{selected.progress}%</dd><dt>Đầu ra yêu cầu</dt><dd>{selected.requiredOutput||'—'}</dd><dt>Mô tả</dt><dd>{selected.description||'—'}</dd>{selected.waitingReason&&<><dt>Lý do chờ</dt><dd>{selected.waitingReason}</dd></>}</dl><div className="task-detail-actions">{selected.sourceModule&&<button className="secondary" onClick={()=>{const t=selected.sourceModule as ModuleKey;if(modules.some(m=>m.key===t))navigate(t)}}>Mở phiếu gốc</button>}{selected.status==='NEW'&&<button className="primary" onClick={()=>setTaskStatus('IN_PROGRESS')}>Bắt đầu làm</button>}{['NEW','IN_PROGRESS','REWORK'].includes(String(selected.status))&&<button className="secondary" onClick={()=>setTaskStatus('WAITING_PROJECT')}>Chuyển Chờ</button>}{['NEW','IN_PROGRESS','REWORK'].includes(String(selected.status))&&<button className="primary" onClick={()=>setTaskStatus('SUBMITTED')}>Gửi kiểm tra</button>}{selected.status==='SUBMITTED'&&<button className="primary" onClick={()=>setTaskStatus('COMPLETED')}>Xác nhận hoàn thành</button>}</div><div className="task-history"><h4>Lịch sử nhiệm vụ</h4>{events.slice(0,8).map(e=><p key={e.id}><b>{e.eventType}</b><span>{e.actorName||'Hệ thống'} · {date(e.occurredAt)}</span>{e.reason&&<small>{e.reason}</small>}</p>)}{!events.length&&<span>Chưa có lịch sử bổ sung.</span>}</div></>:<Empty text="Chọn một nhiệm vụ để xem chi tiết."/>}</aside></div>
  </div>;
}

// =============================================================================
// GĐ4 — MÀN "CÔNG VIỆC": việc của tôi · việc phòng ban/tổ đội · KPI & báo cáo
// Yêu cầu người dùng:
//   • user tự tạo task cho bản thân  → action create_self_work_item (mới, GĐ4)
//   • tạo task cho nhân viên nếu có chức vụ phù hợp → create_work_item (backend chặn)
//   • dashboard tỉ lệ hoàn thành để đánh giá năng lực nhân viên
//   • báo cáo theo tiến độ công việc trong THÁNG của từng nhân viên
//   • CEO/admin xem được toàn bộ KPI phòng ban và user
// =============================================================================
const WORK_STATUS_LABELS: Record<string, string> = {
  NEW: "Mới", IN_PROGRESS: "Đang làm", WAITING_SUPPLIER: "Chờ NCC", WAITING_CLIENT: "Chờ khách hàng",
  WAITING_APPROVAL: "Chờ duyệt", WAITING_PROJECT: "Chờ dự án", BLOCKED: "Bị chặn", ON_HOLD: "Tạm dừng",
  SUBMITTED: "Đã trình", REWORK: "Làm lại", COMPLETED: "Hoàn thành", CANCELLED: "Đã huỷ",
};
const WORK_CLOSED = ["COMPLETED", "CANCELLED"];

function workRate(rows: Row[]): number {
  if (!rows.length) return 0;
  return Math.round((rows.filter((r) => String(r.status) === "COMPLETED").length / rows.length) * 100);
}
function isTaskLate(row: Row): boolean {
  if (WORK_CLOSED.includes(String(row.status))) return false;
  const d = daysFromToday(row.dueAt);
  return d !== null && d > 0;
}

// U-13 — TaskTable khai báo ở CẤP MODULE (trước đây nằm trong thân render của WorkCenter).
// Khai báo trong thân render tạo component MỚI mỗi lần render ⇒ state bên trong bị reset, và eslint
// báo react-hooks/static-components. Nay nhận đủ dữ liệu qua props thay vì đóng kín vào WorkCenter:
//   rows · allowEdit · projCode · busy · send
function TaskTable({ rows, allowEdit, projCode, busy, send }: { rows: Row[]; allowEdit: boolean; projCode: (id: unknown) => string; busy: boolean; send: (name: string, payload: Row) => Promise<void> }) {
  return <div className="table-wrap"><table className="baseline-table">
    <thead><tr>
      <th>Mã việc</th><th>Nội dung</th><th>Người làm</th><th>Dự án</th><th>Hạn</th>
      <th>Ưu tiên</th><th>Tiến độ</th><th>Trạng thái</th>{allowEdit && <th>Thao tác</th>}
    </tr></thead>
    <tbody>
      {rows.map((r) => <tr key={String(r.id)} className={isTaskLate(r) ? "row-late" : ""}>
        <td><strong className="code">{r.taskNo}</strong></td>
        <td>{r.title}<small>{r.requiredOutput || r.workGroup || ""}</small></td>
        <td>{r.assigneeName || "—"}</td>
        <td>{projCode(r.projectId)}</td>
        <td>{r.dueAt ? date(r.dueAt) : "—"}{isTaskLate(r) && <small className="red-text">Quá hạn</small>}</td>
        <td>{r.priority === "urgent" ? "Khẩn" : r.priority === "high" ? "Cao" : "Thường"}</td>
        <td><div className="task-bar"><span><i style={{ width: `${Number(r.progress || 0)}%` }} /></span><b>{Number(r.progress || 0)}%</b></div></td>
        <td><StatusBadge value={WORK_STATUS_LABELS[String(r.status)] || String(r.status || "—")}/></td>
        {allowEdit && <td><div className="row-actions">
          {[25, 50, 75, 100].map((p) => <button key={p} type="button" className="export-mini" disabled={busy || Number(r.progress || 0) >= p} onClick={() => void send("update_work_item_progress", { workItemId: r.id, progress: p })}>{p}%</button>)}
          {String(r.status) !== "COMPLETED" && <button type="button" className="export-mini" disabled={busy} onClick={() => void send("update_work_item_status", { workItemId: r.id, status: "COMPLETED" })}>Xong</button>}
        </div></td>}
      </tr>)}
      {!rows.length && <tr><td colSpan={allowEdit ? 9 : 8}><Empty text="Chưa có nhiệm vụ nào."/></td></tr>}
    </tbody>
  </table></div>;
}

function WorkCenter({ data, action, refresh }: { data: AppData; action: (name: string, payload: Row) => Promise<boolean>; refresh: () => void }) {
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const me = data.user || {};
  const myId = String(me.id || "");
  const items: Row[] = data.workItems || [];
  const users: Row[] = data.users || [];

  const canSelf = modulePermission(data, "dept_plan_tasks").canUse || modulePermission(data, "dept_project_tasks").canUse;
  const canAssign = modulePermission(data, "dept_plan_assign").canCreate || modulePermission(data, "dept_project_assign").canCreate;
  const isOverseer = isAdminUser(me) || ["director", "commander"].includes(roleBase(me));

  const myDepts = [...new Set([String(me.organizationCode || ""), "CN"].filter(Boolean))];
  const activeMemberIds = [...new Set((data.teamMembers || []).filter((m) => Number(m.active ?? 1) === 1).map((m) => String(m.userId)))];
  const mine = items.filter((r) => String(r.assigneeUserId) === myId);
  const deptWork = items.filter((r) => String(r.assigneeUserId) !== myId && myDepts.includes(String(r.departmentCode || "")));
  const teamWork = items.filter((r) => String(r.assigneeUserId) !== myId && activeMemberIds.includes(String(r.assigneeUserId)));

  const find = (rows: Row[]) => !q.trim() ? rows
    : rows.filter((r) => `${r.taskNo || ""} ${r.title || ""} ${r.assigneeName || ""}`.toLocaleLowerCase("vi").includes(q.trim().toLocaleLowerCase("vi")));

  async function send(name: string, payload: Row, form?: HTMLFormElement) {
    setBusy(true);
    const ok = await action(name, payload);
    setBusy(false);
    if (ok) { form?.reset(); refresh(); }
  }
  const projCode = (id: unknown) => (data.projects || []).find((p) => String(p.id) === String(id))?.code || "—";


  const TABS = [`Việc của tôi (${mine.length})`, `Phòng ban / tổ đội (${deptWork.length + teamWork.length})`, "KPI & báo cáo"];

  return <div className="stack work-center">
    <section className="card">
      <ListToolbar
        title="CÔNG VIỆC"
        note={`${mine.length} việc của bạn · ${deptWork.length + teamWork.length} việc phòng ban/tổ đội · ${items.length} tổng`}
        search={{ value: q, onChange: setQ, placeholder: "Tìm mã việc, nội dung, người làm…" }}
      />
      <div className="project-scope-tabs" role="tablist">
        {TABS.map((label, i) => <button key={label} type="button" role="tab" aria-selected={tab === i} className={tab === i ? "active" : ""} onClick={() => setTab(i)}>{label}</button>)}
      </div>
    </section>

    {tab === 0 && <div className="stack">
      <div className="kpi-grid small">
        <Kpi icon="CV" label="Việc của tôi" value={String(mine.length)} note={`${mine.filter((r) => String(r.status) === "COMPLETED").length} đã xong`} tone="blue"/>
        <Kpi icon="QH" label="Quá hạn" value={String(mine.filter(isTaskLate).length)} note="Cần xử lý trước" tone="red"/>
        <Kpi icon="TL" label="Tỉ lệ hoàn thành" value={`${workRate(mine)}%`} note="Trên việc được giao" tone="green"/>
      </div>
      {canSelf && <section className="card">
        <CardHead title="Tự tạo việc cho bản thân" note="Việc cá nhân (mã CN) không gắn nghiệp vụ nguồn và không lẫn vào việc phòng ban"/>
        <form onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; const fd = new FormData(f);
          void send("create_self_work_item", { title: fd.get("title"), description: fd.get("description"), projectId: fd.get("projectId"),
            dueAt: fd.get("dueAt"), priority: fd.get("priority"), requiredOutput: fd.get("requiredOutput") }, f); }}>
          <div className="form-grid">
            <label className="full"><span>Nội dung công việc *</span><input name="title" required placeholder="Ví dụ: Rà soát hồ sơ nghiệm thu đợt 2"/></label>
            <label><span>Dự án</span><select name="projectId"><option value="">— Không gắn dự án —</option>{(data.projects || []).map((p) => <option key={String(p.id)} value={String(p.id)}>{p.code} · {p.name}</option>)}</select></label>
            <label><span>Hạn hoàn thành</span><input name="dueAt" type="date"/></label>
            <label><span>Ưu tiên</span><select name="priority"><option value="normal">Bình thường</option><option value="high">Cao</option><option value="urgent">Khẩn</option></select></label>
            <label><span>Kết quả cần có</span><input name="requiredOutput" placeholder="Đầu ra mong đợi"/></label>
            <label className="full"><span>Mô tả</span><textarea name="description" rows={2}/></label>
          </div>
          <div className="row-actions"><button className="primary" disabled={busy}>＋ Tạo việc cho tôi</button></div>
        </form>
      </section>}
      <section className="card">
        <CardHead title="Danh sách việc của tôi" note="Cập nhật tiến độ và đánh dấu hoàn thành ngay tại đây"/>
        <TaskTable rows={find(mine)} allowEdit projCode={projCode} busy={busy} send={send}/>
      </section>
    </div>}

    {tab === 1 && <div className="stack">
      {canAssign && <section className="card">
        <CardHead title="Giao việc cho nhân viên" note="Chỉ Trưởng phòng hoặc Quản trị viên giao được việc thủ công — backend chặn bằng userIsDepartmentManager"/>
        <form onSubmit={(e) => { e.preventDefault(); const f = e.currentTarget; const fd = new FormData(f);
          void send("create_work_item", { departmentCode: fd.get("departmentCode"), title: fd.get("title"), description: fd.get("description"),
            projectId: fd.get("projectId"), assignedTo: fd.get("assignedTo"), dueAt: fd.get("dueAt"),
            priority: fd.get("priority"), requiredOutput: fd.get("requiredOutput") }, f); }}>
          <div className="form-grid">
            <label><span>Phòng ban *</span><select name="departmentCode" required><option value="KH">Phòng Kế hoạch (KH)</option><option value="DA">Phòng Dự án (DA)</option></select></label>
            <label><span>Giao cho *</span><select name="assignedTo" required><option value="">— Chọn nhân viên —</option>{users.filter((u) => u.active !== false).map((u) => <option key={String(u.id)} value={String(u.id)}>{u.fullName} · {u.roleName || u.role || ""}</option>)}</select></label>
            <label className="full"><span>Nội dung công việc *</span><input name="title" required/></label>
            <label><span>Dự án</span><select name="projectId"><option value="">— Không gắn dự án —</option>{(data.projects || []).map((p) => <option key={String(p.id)} value={String(p.id)}>{p.code} · {p.name}</option>)}</select></label>
            <label><span>Hạn hoàn thành</span><input name="dueAt" type="date"/></label>
            <label><span>Ưu tiên</span><select name="priority"><option value="normal">Bình thường</option><option value="high">Cao</option><option value="urgent">Khẩn</option></select></label>
            <label><span>Kết quả cần có</span><input name="requiredOutput"/></label>
          </div>
          <div className="row-actions"><button className="primary" disabled={busy}>＋ Giao việc</button></div>
        </form>
      </section>}
      <section className="card">
        <CardHead title="Việc phòng ban của tôi" note="Nhiệm vụ thuộc phòng mà tài khoản trực thuộc"/>
        <TaskTable rows={find(deptWork)} allowEdit={false} projCode={projCode} busy={busy} send={send}/>
      </section>
      <section className="card">
        <CardHead title="Việc của tổ đội tôi tham gia" note="Thành viên tổ đội đang hoạt động"/>
        <TaskTable rows={find(teamWork)} allowEdit={false} projCode={projCode} busy={busy} send={send}/>
      </section>
    </div>}

    {tab === 2 && (() => {
      // CEO/admin/ban lãnh đạo thấy TOÀN BỘ; người khác chỉ thấy phòng mình.
      const scope = isOverseer ? users : users.filter((u) => myDepts.includes(String(u.organizationCode || "")));
      const month = UI_TODAY.slice(0, 7);
      const rows = scope.map((u) => {
        const own = items.filter((r) => String(r.assigneeUserId) === String(u.id));
        const inMonth = own.filter((r) => String(r.completedAt || r.createdAt || "").slice(0, 7) === month);
        return { u, total: own.length, done: own.filter((r) => String(r.status) === "COMPLETED").length,
          late: own.filter(isTaskLate).length, rate: workRate(own),
          mTotal: inMonth.length, mDone: inMonth.filter((r) => String(r.status) === "COMPLETED").length };
      }).filter((r) => isOverseer || r.total > 0).sort((a, b) => b.rate - a.rate || b.total - a.total);
      const byDept = [...new Set(users.map((u) => String(u.organizationCode || u.department || "")).filter(Boolean))]
        .map((code) => { const own = items.filter((r) => String(r.departmentCode || "") === code);
          return { code, total: own.length, rate: workRate(own) }; })
        .filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
      return <div className="stack">
        <section className="card">
          <CardHead title="Tỉ lệ hoàn thành theo nhân viên"
            note={isOverseer ? "Phạm vi: TOÀN BỘ nhân sự (quyền CEO/Quản trị)" : "Phạm vi: phòng ban của bạn"}/>
          <div className="kpi-grid small">
            <Kpi icon="TC" label="Tỉ lệ chung" value={`${workRate(items)}%`} note={`${items.filter((r) => String(r.status) === "COMPLETED").length}/${items.length} nhiệm vụ`} tone="green"/>
            <Kpi icon="QH" label="Đang quá hạn" value={String(items.filter(isTaskLate).length)} note="Trong phạm vi thấy được" tone="red"/>
            <Kpi icon="NV" label="Nhân sự có việc" value={String(rows.filter((r) => r.total > 0).length)} note={`${rows.length} nhân sự trong phạm vi`} tone="blue"/>
            <Kpi icon="TH" label={`Việc tháng ${month}`} value={String(rows.reduce((s, r) => s + r.mTotal, 0))} note={`${rows.reduce((s, r) => s + r.mDone, 0)} đã hoàn thành`} tone="violet"/>
          </div>
          <div className="table-wrap"><table className="baseline-table">
            <thead><tr><th>Nhân viên</th><th>Phòng ban</th><th>Chức vụ</th><th>Tổng việc</th><th>Hoàn thành</th><th>Quá hạn</th><th>Tỉ lệ</th><th>Tháng này</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={String(r.u.id)}>
              <td><strong>{r.u.fullName}</strong><small>{r.u.employeeCode || r.u.username || ""}</small></td>
              <td>{r.u.organizationName || r.u.department || "—"}</td>
              <td>{r.u.roleName || r.u.role || "—"}</td>
              <td>{r.total}</td><td><strong>{r.done}</strong></td>
              <td className={r.late ? "red-text" : ""}>{r.late}</td>
              <td><div className="task-bar"><span><i style={{ width: `${r.rate}%` }} /></span><b>{r.rate}%</b></div></td>
              <td>{r.mDone}/{r.mTotal}</td>
            </tr>)}{!rows.length && <tr><td colSpan={8}><Empty text="Chưa có dữ liệu KPI."/></td></tr>}</tbody>
          </table></div>
        </section>
        {isOverseer && <section className="card">
          <CardHead title="KPI theo phòng ban" note="Chỉ CEO/Ban lãnh đạo/Quản trị hệ thống thấy toàn bộ"/>
          <div className="table-wrap"><table className="baseline-table">
            <thead><tr><th>Phòng ban</th><th>Tổng việc</th><th>Tỉ lệ hoàn thành</th></tr></thead>
            <tbody>{byDept.map((d) => <tr key={d.code}><td><strong>{d.code}</strong></td><td>{d.total}</td>
              <td><div className="task-bar"><span><i style={{ width: `${d.rate}%` }} /></span><b>{d.rate}%</b></div></td></tr>)}
              {!byDept.length && <tr><td colSpan={3}><Empty text="Chưa có nhiệm vụ theo phòng ban."/></td></tr>}</tbody>
          </table></div>
        </section>}
      </div>;
    })()}
  </div>;
}

// =============================================================================
// GĐ5 — TỔ ĐỘI: DANH SÁCH + CHI TIẾT
// Yêu cầu: danh sách tổ đội → chi tiết gồm dự án đang/đã tham gia, sĩ số, THỜI GIAN
// THAM GIA VÀ RỜI ĐI của từng người, click user → hồ sơ, và tab ĐƠN TỪ tổng hợp.
// Dữ liệu: data.teams + data.teamMembers (bảng mới ở migration V14) + chứng từ.
// =============================================================================
function TeamManagement({ data, open }: { data: AppData; open: (name: string, row?: Row) => void }) {
  const [view, setView] = useState<"list" | "detail">("list");
  const [detailId, setDetailId] = useState("");
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");

  const teams: Row[] = data.teams || [];
  const members: Row[] = data.teamMembers || [];
  const projOf = (id: unknown) => (data.projects || []).find((p) => String(p.id) === String(id));
  const whOf = (id: unknown) => (data.warehouses || []).find((w) => String(w.id) === String(id));
  const membersOf = (tid: string) => members.filter((m) => String(m.teamId) === String(tid));

  const filtered = teams.filter((t) => !q.trim() ||
    `${t.code || ""} ${t.name || ""} ${t.trade || ""} ${projOf(t.projectId)?.code || ""}`
      .toLocaleLowerCase("vi").includes(q.trim().toLocaleLowerCase("vi")));

  const detail = teams.find((t) => String(t.id) === String(detailId));

  if (view === "detail" && detail) {
    const tid = String(detail.id);
    const all = membersOf(tid);
    const activeMembers = all.filter((m) => Number(m.active ?? 1) === 1 && !m.leftAt);
    const past = all.filter((m) => m.leftAt || Number(m.active ?? 1) === 0);
    const proj = projOf(detail.projectId);
    const wh = whOf(detail.warehouseId);
    // Đơn từ của tổ đội: phiếu của dự án + phiếu xuất/hoàn gắn đúng teamId
    const docs = [
      { label: "Phiếu đề nghị mua hàng của dự án", noKey: "requestNo", statusKey: "status", whoKey: "requestedBy", atKey: "requestedAt",
        rows: (data.requests || []).filter((r) => String(r.projectId) === String(detail.projectId)) },
      { label: "Phiếu xuất kho cho tổ đội", noKey: "issueNo", statusKey: "status", whoKey: "receivedByName", atKey: "issuedAt",
        rows: (data.issues || []).filter((r) => String(r.teamId) === tid) },
      { label: "Phiếu hoàn trả vật tư", noKey: "returnNo", statusKey: "status", whoKey: "returnedByName", atKey: "returnedAt",
        rows: (data.returns || []).filter((r) => String(r.teamId) === tid) },
    ];
    const totalDocs = docs.reduce((s, g) => s + g.rows.length, 0);
    const TABS = ["Tổng quan", "Thành viên", `Đơn từ (${totalDocs})`];

    return <div className="stack team-management">
      <section className="card project-detail-head">
        <div className="table-toolbar">
          <div><strong>{detail.code} · {detail.name}</strong>
            <span>{detail.trade || "Chưa ghi hạng mục"} · {activeMembers.length} thành viên đang hoạt động · {past.length} đã rời</span></div>
          <div className="row-actions"><button type="button" className="page-back" onClick={() => setView("list")}>← Quay lại danh sách</button></div>
        </div>
        <div className="project-scope-tabs" role="tablist">
          {TABS.map((label, i) => <button key={label} type="button" role="tab" aria-selected={tab === i} className={tab === i ? "active" : ""} onClick={() => setTab(i)}>{label}</button>)}
        </div>
      </section>

      {tab === 0 && <div className="stack">
        <div className="kpi-grid small">
          <Kpi icon="DA" label="Dự án" value={proj?.code || "—"} note={proj?.name || "Chưa gắn dự án"} tone="blue"/>
          <Kpi icon="K" label="Kho của tổ đội" value={wh?.code || "—"} note={wh?.name || "Chưa có kho riêng"} tone="violet"/>
          <Kpi icon="TV" label="Thành viên" value={String(activeMembers.length)} note={`${past.length} người đã rời`} tone="green"/>
          <Kpi icon="TT" label="Trạng thái" value={detail.active === 0 ? "Đã ngừng" : "Đang hoạt động"} note={detail.active === 0 ? "Không còn nhận việc" : "Đang nhận cấp phát vật tư"} tone={detail.active === 0 ? "red" : "green"}/>
        </div>
        <section className="card">
          <CardHead title="Dự án tổ đội đang tham gia" note="Theo quy tắc nghiệp vụ hiện hành, mỗi tổ đội thuộc đúng một dự án"/>
          <div className="table-wrap"><table className="baseline-table">
            <thead><tr><th>Mã dự án</th><th>Tên dự án</th><th>Trạng thái</th><th>Bắt đầu</th><th>Kết thúc dự kiến</th><th>Vai trò tổ đội</th></tr></thead>
            <tbody>{proj ? <tr>
              <td><strong className="code">{proj.code}</strong></td><td>{proj.name}</td>
              <td><StatusBadge value={PROJECT_STATUS_LABELS[String(proj.status || "active")] || String(proj.status || "—")}/></td>
              <td>{date(proj.startDate)}</td><td>{date(proj.plannedEndDate)}</td><td>Thi công / cấp phát vật tư</td>
            </tr> : <tr><td colSpan={6}><Empty text="Tổ đội chưa gắn dự án nào."/></td></tr>}</tbody>
          </table></div>
        </section>
      </div>}

      {tab === 1 && <div className="stack">
        <section className="card">
          <CardHead title="Thành viên đang hoạt động" note="Sắp xếp theo NGÀY THAM GIA · bấm “Hồ sơ” để xem dự án / phòng ban / tổ đội của người đó"/>
          <div className="table-wrap"><table className="baseline-table">
            <thead><tr><th>Họ tên</th><th>Mã NV</th><th>Chức vụ</th><th>Phòng ban</th><th>Vai trò trong tổ đội</th><th>Ngày tham gia</th><th>Ngày rời</th><th></th></tr></thead>
            <tbody>
              {[...activeMembers].sort((a, b) => String(a.joinedAt || "").localeCompare(String(b.joinedAt || ""))).map((m) => <tr key={String(m.id)}>
                <td><strong>{m.fullName || "—"}</strong></td><td>{m.employeeCode || "—"}</td>
                <td>{m.roleName || m.role || "—"}</td><td>{m.department || "—"}</td>
                <td>{m.roleInTeam || "Thành viên"}</td>
                <td>{m.joinedAt ? date(m.joinedAt) : "—"}</td><td>—</td>
                <td><button type="button" className="export-mini" onClick={() => open("userProfile", { ...m, id: m.userId })}>Hồ sơ ›</button></td>
              </tr>)}
              {!activeMembers.length && <tr><td colSpan={8}><Empty text="Tổ đội chưa ghi nhận thành viên. Bảng team_members đã sẵn sàng (migration V14) — cần bổ sung dữ liệu."/></td></tr>}
            </tbody>
          </table></div>
        </section>
        {past.length > 0 && <section className="card">
          <CardHead title="Thành viên đã rời tổ đội" note="Lưu vết thời gian tham gia và rời đi"/>
          <div className="table-wrap"><table className="baseline-table">
            <thead><tr><th>Họ tên</th><th>Mã NV</th><th>Vai trò</th><th>Ngày tham gia</th><th>Ngày rời</th><th>Thời gian tham gia</th></tr></thead>
            <tbody>{past.map((m) => {
              const days = m.joinedAt && m.leftAt ? Math.max(0, Math.round((new Date(String(m.leftAt)).getTime() - new Date(String(m.joinedAt)).getTime()) / 86400000)) : null;
              return <tr key={String(m.id)}>
                <td><strong>{m.fullName || "—"}</strong></td><td>{m.employeeCode || "—"}</td><td>{m.roleInTeam || "Thành viên"}</td>
                <td>{m.joinedAt ? date(m.joinedAt) : "—"}</td><td>{m.leftAt ? date(m.leftAt) : "—"}</td>
                <td>{days === null ? "—" : `${days} ngày`}</td></tr>;
            })}</tbody>
          </table></div>
        </section>}
      </div>}

      {tab === 2 && <div className="stack">
        {docs.map((g) => <section className="card" key={g.label}>
          <CardHead title={g.label} note={`${g.rows.length} chứng từ`}/>
          <div className="table-wrap"><table className="baseline-table">
            <thead><tr><th>Số chứng từ</th><th>Trạng thái</th><th>Người liên quan</th><th>Thời điểm</th></tr></thead>
            <tbody>{g.rows.map((r, i) => <tr key={String(r.id || i)}>
              <td><strong className="code">{String(r[g.noKey] || r.id || "—")}</strong></td>
              <td><StatusBadge value={String(r[g.statusKey] || "—")}/></td>
              <td>{String(r[g.whoKey] || "—")}</td>
              <td>{date(r[g.atKey] || r.createdAt)}</td>
            </tr>)}{!g.rows.length && <tr><td colSpan={4}><Empty text="Không có chứng từ."/></td></tr>}</tbody>
          </table></div>
        </section>)}
      </div>}
    </div>;
  }

  return <div className="stack team-management">
    <section className="card">
      <ListToolbar
        title="DANH SÁCH TỔ ĐỘI"
        note={`${filtered.length}/${teams.length} tổ đội · mỗi tổ đội thuộc đúng một dự án`}
        search={{ value: q, onChange: setQ, placeholder: "Tìm mã, tên tổ đội, hạng mục, dự án…" }}
      />
      <div className="table-wrap"><table className="baseline-table">
        <thead><tr><th>Mã tổ đội</th><th>Tên tổ đội</th><th>Hạng mục</th><th>Dự án</th><th>Kho của tổ đội</th><th>Thành viên</th><th>Quyết toán</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>
          {filtered.map((t) => {
            const tid = String(t.id);
            const p = projOf(t.projectId); const wh = whOf(t.warehouseId);
            const act = membersOf(tid).filter((m) => Number(m.active ?? 1) === 1 && !m.leftAt).length;
            const settled = (data.teamSettlements || []).some((s) => String(s.teamId) === tid && String(s.status) === "closed");
            return <tr key={tid}>
              <td><strong className="code">{t.code}</strong></td><td>{t.name}</td><td>{t.trade || "—"}</td>
              <td>{p ? `${p.code} · ${p.name}` : "—"}</td>
              <td>{wh ? `${wh.code} · ${wh.name}` : "—"}</td>
              <td>{act > 0 ? `${act} người` : <span className="muted">Chưa ghi nhận</span>}</td>
              <td><StatusBadge value={settled ? "Đã quyết toán" : "Chưa quyết toán"}/></td>
              <td><StatusBadge value={t.active === 0 ? "Đã ngừng" : "Đang hoạt động"}/></td>
              <td><button type="button" className="export-mini" onClick={() => { setDetailId(tid); setView("detail"); setTab(0); }}>Chi tiết ›</button></td>
            </tr>;
          })}
          {!filtered.length && <tr><td colSpan={9}><Empty text="Không có tổ đội phù hợp."/></td></tr>}
        </tbody>
      </table></div>
    </section>
  </div>;
}

const PROJECT_STATUS_LABELS: Record<string,string> = { active:"Đang hoạt động", paused:"Tạm dừng", closed:"Đã đóng", purged:"Đã xoá", pending:"Chờ khởi động" };

/** Số ngày lệch giữa một mốc ISO và hôm nay (dương = đã quá mốc). */
function daysFromToday(iso: unknown): number | null {
  const s = String(iso ?? "").slice(0, 10);
  if (!s) return null;
  const t = new Date(s + "T00:00:00").getTime();
  if (Number.isNaN(t)) return null;
  return Math.floor((UI_NOW_MS - t) / 86400000);
}

/** Số ngày chậm tiến độ: chỉ tính khi dự án còn hoạt động và đã qua ngày kết thúc dự kiến. */
function projectOverdueDays(row: Row): number {
  if (String(row.status || "active") !== "active") return 0;
  const late = daysFromToday(row.plannedEndDate);
  return late !== null && late > 0 ? late : 0;
}

// =============================================================================
// GĐ3 — QUẢN LÝ DỰ ÁN: DANH SÁCH + CHI TIẾT (thay cho dropdown chọn dự án)
// Yêu cầu người dùng:
//   • bỏ dropdown, hiển thị DANH SÁCH dự án; ưu tiên dự án ĐANG HOẠT ĐỘNG lên trên,
//     mặc định sắp xếp mới nhất trước
//   • click vào dự án → toàn bộ thông tin: ngày bắt đầu, kết thúc dự kiến, số ngày
//     CHẬM TIẾN ĐỘ; tab Nhân sự (tên/chức vụ/phòng ban, ưu tiên đang hoạt động, sort
//     theo ngày tham gia); tab Tổ đội; tab Kho (tồn kho, thủ kho, đơn chờ nhập/duyệt/xuất)
// Dữ liệu lấy HOÀN TOÀN từ bootstrap — không cần API Java mới.
// =============================================================================
function ProjectManagement({ data, project, onProject, open, action }: { data: AppData; project: string; onProject: (value: string) => void; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean> }) {
  const [view, setView] = useState<"list" | "detail">("list");
  const [detailId, setDetailId] = useState("");
  const [tab, setTab] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("active_newest");
  const [openWarehouse, setOpenWarehouse] = useState("");

  const allProjects: Row[] = data.projects || [];
  const users: Row[] = data.users || [];

  // --- sắp xếp + lọc danh sách ------------------------------------------------
  const filtered = allProjects
    .filter((row) => status === "ALL" || String(row.status || "active") === status)
    .filter((row) => {
      if (!q.trim()) return true;
      const hay = `${row.code || ""} ${row.name || ""} ${row.contractNo || ""} ${row.contractName || ""}`.toLocaleLowerCase("vi");
      return hay.includes(q.trim().toLocaleLowerCase("vi"));
    })
    .sort((a, b) => {
      if (sortBy === "name") return String(a.code || "").localeCompare(String(b.code || ""), "vi");
      if (sortBy === "overdue") return projectOverdueDays(b) - projectOverdueDays(a);
      // mặc định: ĐANG HOẠT ĐỘNG lên trước, trong nhóm thì MỚI NHẤT (ngày bắt đầu) trước
      const ra = String(a.status || "active") === "active" ? 0 : 1;
      const rb = String(b.status || "active") === "active" ? 0 : 1;
      if (ra !== rb) return ra - rb;
      return String(b.startDate || "").localeCompare(String(a.startDate || ""));
    });

  const detail = allProjects.find((row) => String(row.id) === String(detailId));

  // --- dữ liệu con của một dự án ---------------------------------------------
  const scopesOf = (pid: string) => (data.userScopes || []).filter((s) => String(s.projectId) === String(pid));
  const staffOf = (pid: string) =>
    scopesOf(pid)
      .map((s) => {
        const u = users.find((x) => String(x.id) === String(s.userId));
        return u ? { ...u, _scope: s } : null;
      })
      .filter(Boolean) as Row[];
  const teamsOf = (pid: string) => (data.teams || []).filter((t) => String(t.projectId) === String(pid));
  const warehousesOf = (pid: string) => (data.warehouses || []).filter((w) => String(w.projectId) === String(pid));
  const keepersOf = () =>
    users.filter((u) => /kho|warehouse/i.test(`${u.role || ""} ${u.roleBase || ""} ${u.roleName || ""}`));

  // --- chứng từ theo kho ------------------------------------------------------
  function docsOfWarehouse(wh: Row) {
    const wid = String(wh.id);
    const pendingIn = (data.receipts || []).filter((r) => String(r.warehouseId) === wid && String(r.postingStatus || "") !== "posted");
    const pendingOut = (data.issues || []).filter((r) => String(r.warehouseId) === wid || String(r.teamId) === wid);
    const pendingApprove = (data.requests || []).filter((r) => String(r.projectId) === String(wh.projectId) && String(r.status) === "pending_approval");
    const openPOs = (data.purchaseOrders || []).filter((r) => String(r.projectId) === String(wh.projectId) && !["completed", "received", "cancelled"].includes(String(r.status || "")));
    return { pendingIn, pendingOut, pendingApprove, openPOs };
  }

  // =========================== DANH SÁCH =====================================
  if (view === "list") {
    return <div className="stack project-management">
      <section className="card">
        <ListToolbar
          title="DANH SÁCH DỰ ÁN"
          note={`${filtered.length}/${allProjects.length} dự án · ưu tiên đang hoạt động, mới nhất trước`}
          search={{ value: q, onChange: setQ, placeholder: "Tìm mã, tên, hợp đồng…" }}
          filters={[{ key: "status", label: "Trạng thái", value: status, onChange: setStatus, options: [
            { value: "ALL", label: "Tất cả trạng thái" },
            { value: "active", label: "Đang hoạt động" },
            { value: "paused", label: "Tạm dừng" },
            { value: "closed", label: "Đã đóng" },
          ] }]}
          sort={{ value: sortBy, onChange: setSortBy, options: [
            { value: "active_newest", label: "Hoạt động trước · mới nhất" },
            { value: "name", label: "Theo mã dự án" },
            { value: "overdue", label: "Chậm tiến độ nhiều nhất" },
          ] }}
        />
        <div className="table-wrap">
          <table className="baseline-table">
            <thead><tr>
              <th>Mã dự án</th><th>Tên dự án</th><th>Trạng thái</th><th>Bắt đầu</th>
              <th>Kết thúc dự kiến</th><th>Tiến độ</th><th>Nhân sự</th><th>Tổ đội</th><th></th>
            </tr></thead>
            <tbody>
              {filtered.map((row) => {
                const late = projectOverdueDays(row);
                const staff = scopesOf(String(row.id)).length;
                const teams = teamsOf(String(row.id)).length;
                return <tr key={String(row.id)}>
                  <td><strong className="code">{row.code}</strong></td>
                  <td>{row.name}<small>{row.contractNo || "Chưa có hợp đồng"}</small></td>
                  <td><StatusBadge value={PROJECT_STATUS_LABELS[String(row.status || "active")] || String(row.status || "—")}/></td>
                  <td>{date(row.startDate)}</td>
                  <td>{date(row.plannedEndDate)}</td>
                  <td>{late > 0
                    ? <strong className="red-text">Chậm {late} ngày</strong>
                    : <StatusBadge value="Đúng tiến độ"/>}</td>
                  <td>{staff} người</td>
                  <td>{teams} tổ đội</td>
                  <td><button type="button" className="export-mini" onClick={() => { setDetailId(String(row.id)); setView("detail"); setTab(0); setOpenWarehouse(""); }}>Chi tiết ›</button></td>
                </tr>;
              })}
              {!filtered.length && <tr><td colSpan={9}><Empty text="Không có dự án phù hợp bộ lọc."/></td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>;
  }

  // =========================== CHI TIẾT ======================================
  if (!detail) { setView("list"); return null; }
  const pid = String(detail.id);
  const late = projectOverdueDays(detail);
  const staff = staffOf(pid).sort((a, b) => {
    const aa = a.active === false ? 1 : 0, bb = b.active === false ? 1 : 0;
    if (aa !== bb) return aa - bb;                      // đang hoạt động lên trước
    return String(a._scope?.joinedAt || "").localeCompare(String(b._scope?.joinedAt || "")); // sort theo ngày tham gia
  });
  const teams = teamsOf(pid);
  const warehouses = warehousesOf(pid);
  const keepers = keepersOf();
  const TABS = ["Tổng quan", "Nhân sự", "Tổ đội", "Kho", "Ban chỉ huy"];

  return <div className="stack project-management">
    <section className="card project-detail-head">
      <ListToolbar
        title={`${detail.code} · ${detail.name}`}
        note={`${PROJECT_STATUS_LABELS[String(detail.status || "active")] || detail.status} · ${staff.length} nhân sự · ${teams.length} tổ đội · ${warehouses.length} kho`}
        actions={<>
          <button type="button" className="secondary" onClick={() => { onProject(pid); }} title="Đặt dự án này làm phạm vi làm việc">Đặt làm dự án hiện tại</button>
          <button type="button" className="page-back" onClick={() => setView("list")}>← Quay lại danh sách</button>
        </>}
      />
      <div className="project-scope-tabs" role="tablist">
        {TABS.map((label, index) => <button key={label} type="button" role="tab" aria-selected={tab === index} className={tab === index ? "active" : ""} onClick={() => setTab(index)}>{label}</button>)}
      </div>
    </section>

    {tab === 0 && <div className="stack">
      <div className="kpi-grid">
        <Kpi icon="BD" label="Ngày bắt đầu" value={date(detail.startDate)} note="Theo hợp đồng / khởi công" tone="blue"/>
        <Kpi icon="KT" label="Kết thúc dự kiến" value={date(detail.plannedEndDate)} note="Mốc bàn giao theo kế hoạch" tone="blue"/>
        <Kpi icon="TR" label="Chậm tiến độ" value={late > 0 ? `${late} ngày` : "Đúng hạn"} note={late > 0 ? "ĐÃ QUÁ ngày kết thúc dự kiến" : "Chưa vượt mốc kế hoạch"} tone={late > 0 ? "red" : "green"}/>
        <Kpi icon="HD" label="Hợp đồng" value={detail.contractNo || "—"} note={detail.contractName || "Chưa gắn hợp đồng chính"} tone="violet"/>
      </div>
      <section className="card">
        <CardHead title="Công việc cần hoàn thành" note="Danh sách đầu việc còn lại của dự án"/>
        <div className="development-screen-notice"><b>ĐANG PHÁT TRIỂN</b><span>Khối này sẽ liên kết với BOQ, tiến độ thi công và nhiệm vụ nhân viên. Hiện chưa triển khai theo yêu cầu “phần này sẽ phát triển về sau”.</span></div>
      </section>
      <section className="card">
        <CardHead title="Nhân sự & tổ đội tóm tắt" note="Bấm sang tab tương ứng để xem chi tiết"/>
        <div className="table-wrap"><table className="baseline-table">
          <thead><tr><th>Hạng mục</th><th>Số lượng</th><th>Ghi chú</th></tr></thead>
          <tbody>
            <tr><td>Nhân sự tham gia dự án</td><td><strong>{staff.length}</strong></td><td>{staff.filter((u) => u.active !== false).length} đang hoạt động</td></tr>
            <tr><td>Tổ đội thuộc dự án</td><td><strong>{teams.length}</strong></td><td>{teams.map((t) => t.code).join(" · ") || "Chưa có tổ đội"}</td></tr>
            <tr><td>Kho của dự án</td><td><strong>{warehouses.length}</strong></td><td>{warehouses.map((w) => w.code).join(" · ") || "Chưa có kho"}</td></tr>
          </tbody>
        </table></div>
      </section>
    </div>}

    {tab === 1 && <section className="card">
      <CardHead title="Nhân sự tham gia dự án" note="Ưu tiên người đang hoạt động · sắp xếp theo ngày tham gia dự án"/>
      <div className="table-wrap"><table className="baseline-table">
        <thead><tr><th>Họ tên</th><th>Mã NV</th><th>Chức vụ</th><th>Phòng ban</th><th>Ngày tham gia</th><th>Quyền trong dự án</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>
          {staff.map((u) => <tr key={String(u.id)}>
            <td><strong>{u.fullName}</strong><small>{u.email || u.username || "—"}</small></td>
            <td>{u.employeeCode || "—"}</td>
            <td>{u.roleName || u.role || "—"}</td>
            <td>{u.organizationName || u.department || "—"}</td>
            <td>{u._scope?.joinedAt ? date(u._scope.joinedAt) : <span className="muted">Chưa ghi nhận</span>}</td>
            <td>{u._scope?.positionName || u._scope?.permission || "—"}</td>
            <td><StatusBadge value={u.active === false ? "Đã khoá" : "Đang hoạt động"}/></td>
            <td><button type="button" className="export-mini" onClick={() => open("userProfile", u)}>Hồ sơ ›</button></td>
          </tr>)}
          {!staff.length && <tr><td colSpan={8}><Empty text="Dự án chưa gán nhân sự nào."/></td></tr>}
        </tbody>
      </table></div>
    </section>}

    {tab === 2 && <section className="card">
      <CardHead title="Tổ đội thuộc dự án" note="Mỗi tổ đội thuộc đúng một dự án và có kho riêng"/>
      <div className="table-wrap"><table className="baseline-table">
        <thead><tr><th>Mã tổ đội</th><th>Tên tổ đội</th><th>Hạng mục</th><th>Kho của tổ đội</th><th>Nhân sự</th><th>Trạng thái</th></tr></thead>
        <tbody>
          {teams.map((t) => {
            const wh = (data.warehouses || []).find((w) => String(w.id) === String(t.warehouseId));
            const members = (data.teamMembers || []).filter((m) => String(m.teamId) === String(t.id) && Number(m.active ?? 1) === 1);
            return <tr key={String(t.id)}>
              <td><strong className="code">{t.code}</strong></td>
              <td>{t.name}</td>
              <td>{t.trade || "—"}</td>
              <td>{wh ? `${wh.code} · ${wh.name}` : "—"}</td>
              <td>{members.length ? `${members.length} người` : <span className="muted">Chưa ghi nhận thành viên</span>}</td>
              <td><StatusBadge value={t.active === 0 ? "Đã ngừng" : "Đang dùng"}/></td>
            </tr>;
          })}
          {!teams.length && <tr><td colSpan={6}><Empty text="Dự án chưa có tổ đội."/></td></tr>}
        </tbody>
      </table></div>
    </section>}

    {tab === 3 && <div className="stack">
      <section className="card">
        <CardHead title="Kho của dự án" note="Bấm một kho để xem tồn kho, thủ kho và đơn từ liên quan"/>
        <div className="table-wrap"><table className="baseline-table">
          <thead><tr><th>Mã kho</th><th>Tên kho</th><th>Loại</th><th>Thủ kho</th><th>Tồn kho</th><th>Chờ nhập</th><th>Chờ xuất</th><th>Chờ duyệt</th><th></th></tr></thead>
          <tbody>
            {warehouses.map((w) => {
              const wid = String(w.id);
              const bal = (data.inventory || []).filter((r) => String(r.warehouseId) === wid);
              const total = bal.reduce((s, r) => s + Number(r.balance || 0), 0);
              const d = docsOfWarehouse(w);
              const keeper = keepers[0];
              return <tr key={wid}>
                <td><strong className="code">{w.code}</strong></td>
                <td>{w.name}</td>
                <td>{w.type === "site" ? "Kho công trường" : w.type === "central" ? "Kho tổng" : w.type === "team" ? "Kho tổ đội" : String(w.type || "—")}</td>
                <td>{keeper ? keeper.fullName : <span className="muted">Chưa phân công</span>}</td>
                <td>{bal.length} mã · {format.format(total)}</td>
                <td>{d.pendingIn.length}</td>
                <td>{d.pendingOut.length}</td>
                <td>{d.pendingApprove.length}</td>
                <td><button type="button" className="export-mini" onClick={() => setOpenWarehouse(openWarehouse === wid ? "" : wid)}>{openWarehouse === wid ? "Thu gọn" : "Xem kho ›"}</button></td>
              </tr>;
            })}
            {!warehouses.length && <tr><td colSpan={9}><Empty text="Dự án chưa có kho."/></td></tr>}
          </tbody>
        </table></div>
      </section>

      {openWarehouse && (() => {
        const w = warehouses.find((x) => String(x.id) === String(openWarehouse));
        if (!w) return null;
        const wid = String(w.id);
        const d = docsOfWarehouse(w);
        const bal = (data.inventory || []).filter((r) => String(r.warehouseId) === wid);
        const keeper = keepers[0];
        const docs: { label: string; rows: Row[]; noKey: string; statusKey: string }[] = [
          { label: "Đơn chờ nhập kho", rows: d.pendingIn, noKey: "receiptNo", statusKey: "postingStatus" },
          { label: "Đơn chờ xuất kho", rows: d.pendingOut, noKey: "issueNo", statusKey: "status" },
          { label: "Phiếu chờ duyệt", rows: d.pendingApprove, noKey: "requestNo", statusKey: "status" },
          { label: "Đơn mua hàng chưa hoàn thành", rows: d.openPOs, noKey: "poNo", statusKey: "status" },
        ];
        return <section className="card project-warehouse-detail">
          <CardHead title={`Kho ${w.code} · ${w.name}`} note="Tồn kho, thủ kho và đơn từ liên quan"/>
          <div className="kpi-grid small">
            <Kpi icon="TK" label="Mã đang có tồn" value={format.format(bal.filter((r) => Number(r.balance || 0) !== 0).length)} note={`${bal.length} dòng tồn`} tone="green"/>
            <Kpi icon="CN" label="Chờ nhập" value={String(d.pendingIn.length)} note="Phiếu chưa ghi sổ" tone="amber"/>
            <Kpi icon="CX" label="Chờ xuất" value={String(d.pendingOut.length)} note="Phiếu cấp phát tổ đội" tone="amber"/>
            <Kpi icon="TK" label="Thủ kho" value={keeper ? keeper.fullName : "Chưa phân công"} note={keeper ? (keeper.roleName || keeper.role || "") : "Cần gán người phụ trách"} tone={keeper ? "blue" : "red"}/>
          </div>
          <div className="table-wrap"><table className="baseline-table">
            <thead><tr><th>Mã vật tư</th><th>Tên vật tư</th><th>ĐVT</th><th>Tồn kho</th></tr></thead>
            <tbody>
              {bal.filter((r) => Number(r.balance || 0) !== 0).map((r, i) => <tr key={`${r.materialId || i}`}>
                <td><strong className="code">{r.materialCode || r.materialId}</strong></td>
                <td>{r.materialName || "—"}</td>
                <td>{r.unit || "—"}</td>
                <td><strong>{format.format(Number(r.balance || 0))}</strong></td>
              </tr>)}
              {!bal.filter((r) => Number(r.balance || 0) !== 0).length && <tr><td colSpan={4}><Empty text="Kho chưa có tồn."/></td></tr>}
            </tbody>
          </table></div>
          {docs.map((group) => <div key={group.label}>
            <h3>{group.label} <small>({group.rows.length})</small></h3>
            <div className="table-wrap"><table className="baseline-table">
              <thead><tr><th>Số chứng từ</th><th>Trạng thái</th><th>Đối tượng</th><th>Thời điểm</th></tr></thead>
              <tbody>
                {group.rows.map((r, i) => <tr key={String(r.id || i)}>
                  <td><strong className="code">{r[group.noKey] || r.id}</strong></td>
                  <td><StatusBadge value={String(r[group.statusKey] || "—")}/></td>
                  <td>{r.supplierName || r.requestedBy || r.teamName || "—"}</td>
                  <td>{date(r.receivedAt || r.requestedAt || r.createdAt)}</td>
                </tr>)}
                {!group.rows.length && <tr><td colSpan={4}><Empty text="Không có chứng từ."/></td></tr>}
              </tbody>
            </table></div>
          </div>)}
        </section>;
      })()}
    </div>}

    {tab === 4 && <SiteCommandScreen data={data} project={pid} action={action} />}
  </div>;
}

function ProjectProgress({data,project,onProject}:{data:AppData;project:string;onProject:(value:string)=>void}) {
  const rows: Row[]=data.projects.filter((row)=>project==="ALL"||row.id===project).map((row)=>{
    const plan=Math.max(0,Math.min(100,Number(row.progressPlan??row.planProgress??row.progress??0)));
    const actual=Math.max(0,Math.min(100,Number(row.progressActual??row.actualProgress??row.progress??0)));
    return {...row,plan,actual,delta:actual-plan};
  });
  const doing=rows.filter(r=>r.actual>0&&r.actual<100).length;
  const preparing=rows.filter(r=>r.actual<=0).length;
  const late=rows.filter(r=>r.delta<0).length;
  return <div className="stack baseline-screen progress-approved-screen">
    <div className="screen-actions approved-progress-actions"><span className="global-project-scope-chip">Dự án: {project==="ALL"?"Tất cả":data.projects.find(row=>row.id===project)?.code||project}</span><button className="secondary" onClick={()=>downloadCsv(["Dự án","Kế hoạch","Thực tế","Chênh lệch"],rows.map(r=>[r.name,r.plan,r.actual,r.diff]),`Tien_do_du_an_${UI_TODAY}.csv`)}>⇩ Xuất dữ liệu</button></div>
    <div className="kpi-grid approved-kpi-grid"><Kpi icon="DA" label="Tổng số dự án" value={String(rows.length)} note="Trong phạm vi được phân quyền"/><Kpi icon="TC" label="Đang thi công" value={String(doing)} note={rows.length?`${(doing/rows.length*100).toLocaleString("vi-VN",{maximumFractionDigits:1})}% dự án`:"0%"} tone="green"/><Kpi icon="CB" label="Chuẩn bị" value={String(preparing)} note={rows.length?`${(preparing/rows.length*100).toLocaleString("vi-VN",{maximumFractionDigits:1})}% dự án`:"0%"} tone="amber"/><Kpi icon="!" label="Chậm tiến độ" value={String(late)} note={rows.length?`${(late/rows.length*100).toLocaleString("vi-VN",{maximumFractionDigits:1})}% dự án`:"0%"} tone="red"/></div>
    <section className="card"><CardHead title="Danh sách tiến độ dự án"/><div className="table-wrap"><table><thead><tr><th>STT</th><th>MÃ DỰ ÁN</th><th>TÊN DỰ ÁN</th><th>CHỈ HUY TRƯỞNG / PHỤ TRÁCH</th><th>NGÀY BẮT ĐẦU</th><th>NGÀY KẾT THÚC</th><th>TIẾN ĐỘ KẾ HOẠCH</th><th>TIẾN ĐỘ THỰC TẾ</th><th>CHÊNH LỆCH</th><th>TRẠNG THÁI</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.id}><td>{index+1}</td><td><strong>{row.code||row.id}</strong></td><td>{row.name}</td><td>{row.commanderName||row.managerName||"—"}</td><td>{row.startDate||"—"}</td><td>{row.endDate||"—"}</td><td><div className="mini-progress"><span>{row.plan}%</span><i><b style={{width:`${row.plan}%`}}/></i></div></td><td><div className="mini-progress"><span>{row.actual}%</span><i><b style={{width:`${row.actual}%`}}/></i></div></td><td className={row.delta<0?"red-text":"green-text"}>{row.delta>0?"+":""}{row.delta}%</td><td><StatusBadge value={row.actual>=100?"Hoàn thành":row.delta<0?"Chậm":"Đúng tiến độ"}/></td></tr>)}{!rows.length&&<tr><td colSpan={10}><Empty text="Chưa có dữ liệu tiến độ dự án."/></td></tr>}</tbody></table></div></section>
    <div className="approved-dashboard-grid"><section className="card"><CardHead title="Mốc tiến độ chính"/><div className="approved-no-fake"><strong>Chưa có dữ liệu mốc tiến độ</strong><span>Mốc sẽ hiển thị khi được cấu hình cho từng dự án.</span></div></section><section className="card"><CardHead title="Tổng quan tiến độ danh mục công việc"/><div className="approved-stock-value"><p><span>Tổng số dự án</span><b>{rows.length}</b></p><p><span>Đang thi công</span><b>{doing}</b></p><p><span>Chuẩn bị</span><b>{preparing}</b></p><p><span>Chậm tiến độ</span><b>{late}</b></p></div></section></div>
  </div>;
}

const DEVELOPMENT_MODULES = new Set<ModuleKey>(["dept_plan_tasks","dept_plan_assign","dept_plan_supply_plan","dept_plan_tender","dept_plan_rfq","dept_plan_purchasing","dept_plan_supply","dept_plan_contracts","dept_plan_suppliers","dept_plan_price_data","dept_plan_kpi","dept_plan_alerts","dept_project_tasks","dept_project_pda","dept_project_assign","dept_project_plan","dept_project_shop","dept_project_boq","dept_project_material","dept_project_issues","dept_project_asbuilt","dept_project_payment","dept_project_tender","dept_project_kpi","dept_project_alerts"]);
function DevelopmentNotice(){return <div className="development-screen-notice"><b>ĐANG PHÁT TRIỂN</b><span>Hạng mục này đang phát triển nên chức năng và thông tin có thể hiển thị chưa đúng như yêu cầu của VNTECH.</span></div>;}

function DevelopmentModule({ title, note }: { title: string; note: string }) { return <section className="card development-module"><h2>{title}</h2><p>{note.replace("ĐANG PHÁT TRIỂN · ","")}</p><div className="inline-alert">Màn hình này chưa được ưu tiên hiệu chỉnh sâu. Dữ liệu, phân quyền, workflow và liên kết domain chung vẫn tiếp tục đồng bộ theo hệ thống mới.</div></section>; }

function pendingForRole(requests: Row[], user: Row, stages: Row[] = []) { return requests.filter((row) => { if(row.status!=="pending_approval")return false; const approval=row.approvals?.find((item:Row)=>Number(item.stage)===Number(row.approvalStage)); const rule=approval?.allowedRoleCodes?approval:stages.find((stage)=>Number(stage.stageNo)===Number(row.approvalStage)); return stageAllowedForUser(rule,user); }).length; }
function initials(name: string) { return name.split(" ").slice(-2).map((part) => part[0]).join("").toUpperCase(); }
function statusLabel(row: Row) { const labels: Row = { pending_approval: "Chờ duyệt", approval_pending: "Chờ duyệt", approved: "Đã duyệt", awaiting_po: "Chờ lập PO", waiting_delivery: "Chờ giao hàng", partial_delivery: "Giao một phần", delivered_pending_confirmation: "Chờ BCH xác nhận", awaiting_bch_confirmation: "Chờ BCH xác nhận", received_full_docs_pending: "Đã nhận đủ · Chờ hồ sơ", completed: "Đã hoàn tất", completed_with_exceptions: "Hoàn tất · Thiếu hồ sơ", completed_with_shortage: "Đóng đơn có thiếu", returned_to_requester: "Trả lại CHT", rejected: "Từ chối", cancelled: "Đã hủy", ordered: "Đang mua", partial: "Giao một phần", received: "Đã giao đủ", posted: "Đã ghi sổ", blocked: "Bị chặn" }; return labels[row.supplyStatus] || labels[row.status] || labels[row.postingStatus] || row.supplyStatus || row.status || "—"; }
function durationText(minutes: number) { if (!Number.isFinite(minutes) || minutes < 0) return "—"; if (minutes < 60) return `${Math.max(1, Math.round(minutes))} phút`; const hours = Math.floor(minutes / 60); const rest = Math.round(minutes % 60); return rest ? `${hours} giờ ${rest} phút` : `${hours} giờ`; }
function approvalTiming(approval?: Row) { if (!approval?.queuedAt) return { text: "Chờ cấp trước hoàn tất", minutes: 0, late: false, active: false }; const end = approval.decidedAt ? new Date(approval.decidedAt).getTime() : Date.now(); const start = new Date(approval.queuedAt).getTime(); const due = approval.dueAt ? new Date(approval.dueAt).getTime() : 0; const minutes = Math.max(0, (end - start) / 60000); const late = Boolean(due && end > due); return { text: `${approval.decidedAt ? "Đã xử lý" : "Đang chờ"} ${durationText(minutes)} · ${late ? "Quá hạn" : "Trong hạn"}`, minutes, late, active: true }; }
function workflowTiming(step?: Row) { if (!step?.queuedAt) return { text: "Chưa bắt đầu", minutes: 0, late: false }; const end = step.completedAt ? new Date(step.completedAt).getTime() : Date.now(); const start = new Date(step.queuedAt).getTime(); const due = step.dueAt ? new Date(step.dueAt).getTime() : 0; const minutes = Math.max(0, (end - start) / 60000); const late = Boolean(due && end > due); return { text: `${step.completedAt ? "Đã xử lý" : "Đang chờ"} ${durationText(minutes)} · ${late ? "Quá hạn" : "Trong hạn"}`, minutes, late }; }
function kpiIconName(label:string, legacyIcon:string):string {
  const text=`${label} ${legacyIcon}`.toLocaleLowerCase("vi");
  if(text.includes("nhà cung cấp")) return "dept_plan_suppliers";
  if(text.includes("kiểm kê")||text.includes("hoàn trả")||text.includes("chênh lệch")) return "stocktake";
  if(text.includes("mã vật tư")) return "material_catalog";
  if(text.includes("tồn")) return "inventory";
  if(text.includes("nhập kho")||text.includes("chờ nhập")||text.includes("tổng giá trị nhập")) return "warehouse_receipt";
  if(text.includes("xuất")) return "warehouse_issue";
  if(text.includes("giao")||text.includes("trễ hẹn")||text.includes("sắp đến hạn")) return "delivered";
  if(text.includes("đặt hàng")||text.includes("po")||text.includes("đối chiếu")) return "purchasing";
  if(text.includes("đề nghị")||text.includes("mr")) return "requests";
  if(text.includes("phê duyệt")||text.includes("chờ duyệt")||text.includes("quá hạn")) return "approvals";
  if(text.includes("hợp đồng")||text.includes("boq")||text.includes("trong hợp đồng")||text.includes("ngoài hợp đồng")) return "boq";
  if(text.includes("thu hồi")||text.includes("tiền thực thu")) return "capital_recovery";
  if(text.includes("hóa đơn")||text.includes("thanh toán")) return "payments";
  if(text.includes("sản lượng")||text.includes("thi công")||text.includes("tiến độ")) return "project_progress";
  if(text.includes("dự án")) return "project_management";
  if(text.includes("nhiệm vụ")||text.includes("đang thực hiện")||text.includes("hoàn thành")||text.includes("chờ bên khác")) return "dept_plan_tasks";
  if(text.includes("hồ sơ")) return "dept_project_payment";
  return "dashboard";
}
function Kpi({ icon, label, value, note, tone = "blue", percent }: { icon: string; label: string; value: string; note: string; tone?: string; percent?: number }) {
  const bars=[42,68,54,82,61,92,73,100];
  const pct=percent===undefined?null:Math.max(0,Math.min(100,Number(percent||0)));
  return <article className={`kpi kpi-${tone}`}><span className={`kpi-pictogram ${tone}`}><NavIcon name={kpiIconName(label,icon)}/></span><div className="kpi-content"><small>{label}</small><strong>{value}</strong><p>{note}</p><div className="kpi-mini-visual"><div className="kpi-mini-columns" aria-hidden="true">{bars.map((height,index)=><i key={index} style={{height:`${height}%`}}/>)}</div>{pct!==null&&<b className="kpi-percent">{pct.toLocaleString("vi-VN",{maximumFractionDigits:1})}%</b>}</div></div></article>;
}
function CardHead({ title, note, action, onClick }: { title: string; note?: string; action?: string; onClick?: () => void }) { return <div className="card-head"><div><h2>{title}</h2>{note && <p>{note}</p>}</div>{action && <button onClick={onClick}>{action} →</button>}</div>; }
function Empty({ text }: { text: string }) { return <div className="empty"><span>✓</span><strong>{text}</strong><p>Dữ liệu mới sẽ xuất hiện tại đây.</p></div>; }
function SupplyExportButtons({ doc, compact = true, stopPropagation = false }: { doc: SupplyExportDocument; compact?: boolean; stopPropagation?: boolean }) {
  const cls = compact ? "export-mini" : "secondary";
  return <span className="supply-export-buttons"><button type="button" className={cls} onClick={(event) => { if (stopPropagation) event.stopPropagation(); downloadSupplyXlsx(doc); }}>⇩ Excel</button><button type="button" className={cls} onClick={(event) => { if (stopPropagation) event.stopPropagation(); downloadSupplyPdf(doc); }}>⇩ PDF</button></span>;
}

function ContractValueOverview({data,project}:{data:AppData;project:string}) {
  const rows=data.boqItems.filter((row)=>(project==="ALL"||row.projectId===project)&&["material","component"].includes(String(row.rowRole||"material")));
  const contractRows=rows.filter((row)=>row.itemType!=="outside_contract");
  const original=contractRows.reduce((sum,row)=>sum+Number(row.contractQty||0)*Number(row.unitPrice||0),0);
  const received=rows.reduce((sum,row)=>sum+Math.max(0,Number(row.receivedQty||0))*Number(row.unitPrice||0),0);
  const over=contractRows.filter((row)=>row.variationStatus==="approved").reduce((sum,row)=>sum+Math.max(0,Number(row.remeasuredQty||0)-Number(row.contractQty||0))*Number(row.unitPrice||0),0);
  const outside=rows.filter((row)=>row.itemType==="outside_contract"&&row.variationStatus==="approved").reduce((sum,row)=>sum+Number(row.remeasuredQty||0)*Number(row.unitPrice||0),0);
  const paid=data.contractPayments.filter((row)=>project==="ALL"||row.projectId===project).reduce((sum,row)=>sum+Number(row.amount||0),0);
  const basis=Math.max(1,original);
  const metrics=[
    {label:"Tổng giá trị hợp đồng",value:original,tone:"blue",note:"Mốc tham chiếu"},
    {label:"Tổng giá trị đã nhập",value:received,tone:"cyan",note:"/ Hợp đồng"},
    {label:"Phát sinh vượt hợp đồng",value:over,tone:"amber",note:"/ Hợp đồng"},
    {label:"Phát sinh ngoài hợp đồng",value:outside,tone:"violet",note:"/ Hợp đồng"},
    {label:"Giá trị thu hồi vốn",value:paid,tone:"green",note:"/ Hợp đồng"}
  ];
  const paidPct=Math.max(0,Math.min(100,paid/basis*100));
  return <section className="card contract-value-overview"><CardHead title="Giá trị Hợp đồng – Cung ứng – Thu hồi vốn" note="Đơn giá lấy từ BOQ/HĐ; Đã nhập chỉ tính số lượng BCH/Thủ kho xác nhận; Thu hồi vốn lấy từ dữ liệu tiền thực thu/Thanh toán HĐ đã ghi nhận."/><div className="contract-value-metrics">{metrics.map((item,index)=>{const pct=index===0?(original>0?100:0):Math.max(0,item.value/basis*100);return <article className={`contract-metric tone-${item.tone}`} key={item.label}><small>{index+1}. {item.label}</small><strong>{money(item.value)}</strong><i><b style={{width:`${Math.min(100,pct)}%`}}/></i><div><b>{pct.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</b><span>{item.note}</span></div></article>})}<div className="contract-recovery-columns"><div><i className="paid" style={{height:`${Math.max(6,paidPct)}%`}}/><strong>{paidPct.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong><span>Đã thu hồi</span></div><div><i className="remaining" style={{height:`${Math.max(6,100-paidPct)}%`}}/><strong>{Math.max(0,100-paidPct).toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong><span>Còn lại</span></div></div></div></section>;
}

function ProjectScopeSelect({projects,project,onChange,allowAll=false}:{projects:Row[];project:string;onChange:(value:string)=>void;allowAll?:boolean}) {
  const selected=projects.find(row=>String(row.id)===String(project));
  if(projects.length===1){const only=projects[0];return <section className="page-project-context" aria-label="Phạm vi dự án"><label className="page-project-select project-scope-locked"><span>Dự án được phân quyền</span><strong>{only.code} · {only.name}</strong><small>Phạm vi làm việc hiện tại của tài khoản.</small></label></section>;}
  return <section className="page-project-context" aria-label="Phạm vi dự án"><label className="page-project-select"><span>Chọn dự án</span><select value={project} onChange={(event)=>onChange(event.target.value)} aria-label="Chọn dự án">{allowAll&&<option value="ALL">Tất cả dự án</option>}{projects.map(row=><option key={row.id} value={String(row.id)}>{row.code} · {row.name}</option>)}</select><small>{project==="ALL"&&allowAll?`${projects.length} dự án trong phạm vi được cấp`:selected?`${selected.code} · ${selected.name}`:`${projects.length} dự án được phân quyền`}</small></label></section>;
}

function Dashboard({ data, project, navigate, open }: { data: AppData; project: string; navigate: (key: ModuleKey) => void; open: (name: string, row?: Row) => void }) {
  const requests=data.requests.filter((row)=>project==="ALL"||row.projectId===project);
  const pending=requests.filter((row)=>row.status==="pending_approval").length;
  const shortage=requests.filter((row)=>Number(row.receivedQty)<Number(row.totalQty)).length;
  const relevantBoq=data.boqItems.filter((row)=>(project==="ALL"||row.projectId===project)&&row.itemType!=="outside_contract"&&["material","component"].includes(String(row.rowRole||"material")));
  const totalContractValue=relevantBoq.reduce((sum,row)=>sum+Number(row.contractQty||0)*Number(row.unitPrice||0),0);
  const capitalRecoveryValue=data.capitalRecoveryRecords.filter((row)=>(project==="ALL"||row.projectId===project)&&!["draft","rejected","cancelled"].includes(String(row.status))).reduce((sum,row)=>sum+Number(row.approvedValue||0),0);
  const contractPriceByProjectMaterial=new Map<string,number>(); relevantBoq.forEach((row)=>{const key=`${row.projectId}|${row.materialId}`;const price=Number(row.unitPrice||0);if(price>0&&!contractPriceByProjectMaterial.has(key))contractPriceByProjectMaterial.set(key,price);});
  const inventoryContractValue=data.inventory.filter((row)=>project==="ALL"||row.projectId===project).reduce((sum,row)=>sum+Math.max(0,Number(row.balance||0))*Number(contractPriceByProjectMaterial.get(`${row.projectId}|${row.materialId}`)||0),0);
  const receivedContractValue=relevantBoq.reduce((sum,row)=>sum+Math.max(0,Number(row.receivedQty||0))*Number(row.unitPrice||0),0);
  const overContractValue=relevantBoq.filter(row=>String(row.variationStatus)==="approved").reduce((sum,row)=>sum+Math.max(0,Number(row.remeasuredQty||0)-Number(row.contractQty||0))*Number(row.unitPrice||0),0);
  const outsideContractValue=data.boqItems.filter(row=>(project==="ALL"||row.projectId===project)&&String(row.itemType)==="outside_contract"&&String(row.variationStatus)==="approved").reduce((sum,row)=>sum+Math.max(0,Number(row.remeasuredQty||0))*Number(row.unitPrice||0),0);
  const projectRows: Row[]=data.projects.filter((item)=>project==="ALL"||item.id===project).map((item)=>{
    const boq=data.boqItems.filter((row)=>row.projectId===item.id&&row.itemType!=="outside_contract"&&["material","component"].includes(String(row.rowRole||"material")));
    const totalContract=boq.reduce((sum,row)=>sum+Number(row.contractQty||0)*Number(row.unitPrice||0),0);
    const paid=data.contractPayments.filter((row)=>row.projectId===item.id).reduce((sum,row)=>sum+Number(row.amount||0),0);
    const progress=Math.max(0,Math.min(100,Number(item.progressActual??item.progress??0)));
    return {...item,totalContract,paid,progress};
  });
  const poRows=data.purchaseOrders.filter((row)=>project==="ALL"||row.projectId===project);
  const waitingApproval=pending;
  const ordering=poRows.filter((row)=>!["completed","received"].includes(String(row.status))).length;
  const delivered=poRows.filter((row)=>["completed","received"].includes(String(row.status))).length;
  const productionRows=projectRows.map((row)=>({id:row.id,name:row.name,value:data.productionReports.filter((report)=>report.projectId===row.id&&report.status==="approved").reduce((sum,report)=>sum+Number(report.approvedValue||0),0)}));
  const singleProjectRow=project!=="ALL"&&projectRows.length===1?projectRows[0]:null; const singleProjectProduction=singleProjectRow?(productionRows.find((row)=>row.id===singleProjectRow.id)?.value||0):0; const singleProjectContract=Math.max(1,Number(singleProjectRow?.totalContract||0)); const singleProjectProductionPct=singleProjectRow?Math.max(0,Math.min(100,singleProjectProduction/singleProjectContract*100)):0;
  const totalProduction=productionRows.reduce((sum,row)=>sum+row.value,0);
  const activeProjectCount=projectRows.filter(row=>Number(row.progress)<100).length;
  const activeProjectPct=projectRows.length?activeProjectCount/projectRows.length*100:0;
  const contractPct=totalContractValue>0?100:0;
  const capitalRecoveryPct=totalContractValue?capitalRecoveryValue/totalContractValue*100:0;
  const receivedContractPct=totalContractValue?receivedContractValue/totalContractValue*100:0;
  const currentUserId=String(data.user.id);
  const personalProjectIds=isAdminUser(data.user)?new Set(data.projects.map((row)=>String(row.id))):new Set(data.userScopes.filter((row)=>String(row.userId)===currentUserId&&String(row.permission||"none")!=="none").map((row)=>String(row.projectId)));
  const personalOpenTasks=data.workItems.filter((row)=>String(row.assignedTo)===currentUserId&&!['COMPLETED','CANCELLED'].includes(String(row.status)));
  const personalDueSoon=personalOpenTasks.filter((row)=>row.dueAt&&new Date(row.dueAt).getTime()>=UI_NOW_MS&&new Date(row.dueAt).getTime()-UI_NOW_MS<=3*86400000).length;
  const personalWaitingApproval=personalOpenTasks.filter((row)=>String(row.status)==='WAITING_APPROVAL').length;
  const priorities=[
    {label:"Phê duyệt yêu cầu mua hàng",module:"Mua hàng",owner:"Theo workflow",time:"Cần xử lý",target:"approvals" as ModuleKey},
    {label:"Đơn hàng chờ giao / quá hạn",module:"Mua hàng",owner:"Phòng Kế hoạch",time:`${poRows.filter((row)=>row.eta&&new Date(row.eta).getTime()<UI_NOW_MS&&!String(row.status).includes("completed")).length} đơn`,target:"receiving" as ModuleKey},
    {label:"Vật tư cần theo dõi tồn",module:"Kho vật tư",owner:"Thủ kho đúng phạm vi",time:`${shortage} dòng`,target:"inventory" as ModuleKey},
    {label:"Hồ sơ thu hồi vốn",module:"Phòng Dự án / TCKT",owner:"Theo dự án",time:`${data.contractPayments.filter((row)=>project==="ALL"||row.projectId===project).length} hồ sơ`,target:"capital_recovery" as ModuleKey}
  ];
  const mobileLowStock=data.inventory.filter((row)=>project==="ALL"||row.projectId===project).filter((row)=>Number(row.balance||0)<=Number(row.minStock||row.minimumStock||0)).length;
  const lowStockItems=data.inventory.filter((row)=>project==="ALL"||row.projectId===project).filter((row)=>Number(row.balance||0)<Number(row.minStock||row.minimumStock||0)).sort((a,b)=>Number(a.minStock||a.minimumStock||0)-Number(b.balance||0)).slice(0,8);
  const mobileRecent=[
    requests[0]?{kind:"request",title:`Đề nghị mua hàng ${requests[0].requestNo||""}`,meta:`Người tạo: ${requests[0].requestedBy||"—"}`,status:statusLabel(requests[0]),time:date(requests[0].requestedAt)}:null,
    poRows[0]?{kind:"po",title:`Đơn mua hàng ${poRows[0].poNo||""}`,meta:`Nhà cung cấp: ${poRows[0].supplierName||"—"}`,status:statusLabel(poRows[0]),time:date(poRows[0].orderedAt||poRows[0].createdAt)}:null,
    data.receipts[0]?{kind:"receipt",title:`Nhập kho ${data.receipts[0].receiptNo||data.receipts[0].id||""}`,meta:`Kho: ${data.receipts[0].warehouseName||data.receipts[0].projectCode||"—"}`,status:data.receipts[0].bchConfirmationStatus==="confirmed"?"Đã hoàn thành":"Chờ xác nhận",time:date(data.receipts[0].receivedAt||data.receipts[0].createdAt)}:null
  ].filter(Boolean) as Row[];
  const progressBuckets={on:0,slow10:0,slow20:0,slowMore:0};
  projectRows.forEach((row)=>{const plan=Math.max(0,Math.min(100,Number(row.progressPlan??row.progress??0)));const actual=Math.max(0,Math.min(100,Number(row.progressActual??row.progress??0)));const lag=Math.max(0,plan-actual);if(lag<=0)progressBuckets.on++;else if(lag<10)progressBuckets.slow10++;else if(lag<=20)progressBuckets.slow20++;else progressBuckets.slowMore++;});
  const progressTotal=Math.max(1,projectRows.length);
  return <div className="stack baseline-screen dashboard-approved dashboard-final-locked">
    <section className="mobile-dashboard-reference" data-contract="VNTECH_MOBILE_DASHBOARD_R5_V1">
      <div className="mobile-dashboard-kpis">
        <article className="mobile-dash-kpi tone-blue"><span className="mobile-dash-icon"><NavIcon name="project_management"/></span><div><small>DỰ ÁN ĐANG CHẠY</small><strong>{activeProjectCount}</strong><p>Tổng số dự án</p></div><i className="mobile-kpi-spark s1"/></article>
        <article className="mobile-dash-kpi tone-orange"><span className="mobile-dash-icon"><NavIcon name="approvals"/></span><div><small>ĐNMH CHỜ DUYỆT</small><strong>{waitingApproval}</strong><p>Đề nghị mua hàng</p></div><i className="mobile-kpi-spark s2"/></article>
        <article className="mobile-dash-kpi tone-green"><span className="mobile-dash-icon"><NavIcon name="purchasing"/></span><div><small>PO ĐANG XỬ LÝ</small><strong>{ordering}</strong><p>Đơn mua hàng</p></div><i className="mobile-kpi-spark s3"/></article>
        <article className="mobile-dash-kpi tone-red"><span className="mobile-dash-icon"><NavIcon name="inventory"/></span><div><small>CẢNH BÁO TỒN KHO</small><strong>{mobileLowStock}</strong><p>Vật tư sắp hết</p></div><i className="mobile-kpi-spark s4"/></article>
      </div>
      <section className="mobile-progress-card"><header><strong>TIẾN ĐỘ DỰ ÁN (SO VỚI KẾ HOẠCH)</strong><button type="button" onClick={()=>navigate("project_progress")}>Xem chi tiết →</button></header><div className="mobile-progress-bar" aria-label="Tiến độ dự án"><i className="on" style={{width:`${progressBuckets.on/progressTotal*100}%`}}/><i className="slow10" style={{width:`${progressBuckets.slow10/progressTotal*100}%`}}/><i className="slow20" style={{width:`${progressBuckets.slow20/progressTotal*100}%`}}/><i className="slowMore" style={{width:`${progressBuckets.slowMore/progressTotal*100}%`}}/></div><div className="mobile-progress-legend"><span className="on">Đúng tiến độ<b>{Math.round(progressBuckets.on/progressTotal*100)}%</b></span><span className="slow10">Chậm &lt; 10%<b>{Math.round(progressBuckets.slow10/progressTotal*100)}%</b></span><span className="slow20">Chậm 10–20%<b>{Math.round(progressBuckets.slow20/progressTotal*100)}%</b></span><span className="slowMore">Chậm &gt; 20%<b>{Math.round(progressBuckets.slowMore/progressTotal*100)}%</b></span></div></section>
      <section className="mobile-recent-card"><header><strong>HOẠT ĐỘNG GẦN ĐÂY</strong><button type="button" onClick={()=>navigate("requests")}>Xem tất cả →</button></header><div>{mobileRecent.map((item,index)=><article key={`${item.kind}-${index}`}><span className={`mobile-recent-icon ${item.kind}`}><NavIcon name={item.kind==="request"?"requests":item.kind==="po"?"purchasing":"warehouse_receipt"}/></span><div><strong>{item.title}</strong><p>{item.meta}</p></div><aside><b>{item.status}</b><small>{item.time}</small></aside></article>)}{!mobileRecent.length&&<p className="mobile-recent-empty">Chưa có hoạt động gần đây.</p>}</div></section>
      <footer className="mobile-dashboard-update">↻ &nbsp; Cập nhật lúc {new Date(UI_NOW_MS).toLocaleTimeString("vi-VN",{hour:"2-digit",minute:"2-digit"})} &nbsp; • &nbsp; {new Date(UI_NOW_MS).toLocaleDateString("vi-VN")}</footer>
    </section>
    <div className="dashboard-final-layout">
      <div className="dashboard-main-column">
        <div className="kpi-grid approved-kpi-grid"><Kpi icon="DA" label="SỐ DỰ ÁN ĐANG THỰC HIỆN" value={format.format(activeProjectCount)} note={project==="ALL"?"Tổng các dự án trong phạm vi đang hoạt động":"Theo dự án đang chọn"} percent={activeProjectPct}/><Kpi icon="HĐ" label="TỔNG GIÁ TRỊ HỢP ĐỒNG" value={moneyBillion(totalContractValue)} note={project==="ALL"?"Tổng giá trị BOQ/HĐ của các dự án đang thực hiện":"Giá trị BOQ/HĐ dự án đang chọn"} tone="green" percent={contractPct}/><Kpi icon="TH" label="TỔNG GIÁ TRỊ THU HỒI VỐN" value={moneyBillion(capitalRecoveryValue)} note="Tính trên giá trị hồ sơ hoàn thành đã được xác nhận; không tính tiền về" tone="violet" percent={capitalRecoveryPct}/><Kpi icon="NH" label="TỔNG GIÁ TRỊ NHẬP HÀNG" value={moneyBillion(receivedContractValue)} note="Tổng nhập × đơn giá BOQ/HĐ" tone="amber" percent={receivedContractPct}/></div>
        <div className="approved-dashboard-grid">
          <section className={`card dashboard-progress-production ${singleProjectRow?"dashboard-single-project-card":""}`}><CardHead title="TIẾN ĐỘ DỰ ÁN & SẢN LƯỢNG (SO SÁNH KẾ HOẠCH - THỰC TẾ)" action="Xem chi tiết" onClick={()=>navigate("project_progress")}/>{singleProjectRow?<div className="dashboard-single-project-focus compact-layout"><div className="single-project-focus-head"><div><strong>{singleProjectRow.code} · {singleProjectRow.name}</strong><span>{projectPeriod(singleProjectRow.startDate,singleProjectRow.plannedEndDate)}</span></div></div><div className="single-project-gauges"><article><div className="dashboard-gauge-ring gauge-progress" style={{"--gauge-value":`${Math.max(0,Math.min(100,Number(singleProjectRow.progress||0)))}%`} as CSSProperties}><div><strong>{Number(singleProjectRow.progress||0).toFixed(0)}%</strong><small>Tiến độ thực tế</small></div></div></article><article><div className="dashboard-gauge-ring gauge-production" style={{"--gauge-value":`${singleProjectProductionPct}%`} as CSSProperties}><div><strong>{singleProjectProductionPct.toFixed(0)}%</strong><small>Sản lượng nghiệm thu / HĐ</small></div></div></article></div></div>:<><div className="dashboard-chart-scroll"><div className="dashboard-column-chart" style={{minWidth:`${Math.max(560,projectRows.length*84)}px`}}>{projectRows.map(row=>{const production=productionRows.find(p=>p.id===row.id)?.value||0;const contract=Math.max(1,Number(row.totalContract||0));const productionPct=Math.max(0,Math.min(100,production/contract*100));const period=projectPeriod(row.startDate,row.plannedEndDate);return <div className="dashboard-project-bars" key={row.id}><div className="bar-pair"><i className="bar progress" style={{height:`${Math.max(4,row.progress)}%`}} title={`Tiến độ ${row.progress}% · ${period}`}/><i className="bar production" style={{height:`${Math.max(4,productionPct)}%`}} title={`Sản lượng ${productionPct.toFixed(1)}%`}/></div><strong title={row.name||row.code}>{row.code}</strong><em className="chart-period-label">{period}</em><small>{row.progress.toFixed(0)}% / {productionPct.toFixed(0)}%</small></div>})}</div></div><div className="chart-legend"><span><i className="legend-progress"/>Tiến độ thực tế (%)</span><span><i className="legend-production"/>Sản lượng nghiệm thu / HĐ (%)</span></div></>}</section>
          <section className="card dashboard-variation-card"><CardHead title="TỔNG GIÁ TRỊ PHÁT SINH TRONG / NGOÀI HỢP ĐỒNG" action="Xem BOQ" onClick={()=>navigate("boq")}/><div className="variation-columns"><article><span>Phát sinh trong HĐ</span><strong>{moneyBillion(overContractValue)}</strong><i><b style={{height:`${Math.max(8,Math.min(100,totalContractValue?overContractValue/totalContractValue*100:0))}%`}}/></i></article><article><span>Phát sinh ngoài HĐ</span><strong>{moneyBillion(outsideContractValue)}</strong><i><b style={{height:`${Math.max(8,Math.min(100,totalContractValue?outsideContractValue/totalContractValue*100:0))}%`}}/></i></article><div><small>Tổng phát sinh</small><b>{moneyBillion(overContractValue+outsideContractValue)}</b><p>Nguồn tham chiếu: BOQ/HĐ · variationStatus=approved</p></div></div></section>
          <section className="card"><CardHead title="Đơn hàng mua sắm" action="Xem chi tiết" onClick={()=>navigate("purchasing")}/><div className="approved-order-stats"><button onClick={()=>navigate("requests")}><span>Đề nghị mua</span><strong>{requests.length}</strong></button><button onClick={()=>navigate("approvals")}><span>Chờ phê duyệt</span><strong>{waitingApproval}</strong></button><button onClick={()=>navigate("purchasing")}><span>Đang đặt hàng</span><strong>{ordering}</strong></button><button onClick={()=>navigate("delivered")}><span>Đã giao</span><strong>{delivered}</strong></button></div></section>
          <section className="card"><CardHead title="Tồn kho vật tư (giá trị)" action="Xem chi tiết" onClick={()=>navigate("inventory")}/><div className="approved-stock-value"><div><span>Tồn kho theo giá trị hợp đồng</span><strong>{moneyBillion(inventoryContractValue)}</strong></div><p><span>Tồn khả dụng</span><b>{format.format(data.inventory.filter((row)=>project==="ALL"||row.projectId===project).length)} mã vật tư</b></p><p><span>Cơ sở tính</span><b>Tồn thực tế × Đơn giá HĐ</b></p></div></section>
          {lowStockItems.length>0&&<section className="card dashboard-lowstock-card"><CardHead title="Cảnh báo tồn dưới mức tối thiểu" note={`${lowStockItems.length} mã cần bổ sung — lập đề nghị mua ngay`} action="Lập đề nghị" onClick={()=>navigate("requests")}/><div className="table-wrap"><table className="baseline-table"><thead><tr><th>Mã vật tư</th><th>Tên</th><th>Dự án / Kho</th><th>Tồn</th><th>Tối thiểu</th><th>Thiếu</th></tr></thead><tbody>{lowStockItems.map((row)=><tr key={`${row.materialId}-${row.warehouseId}`}><td><strong className="code">{row.materialCode}</strong></td><td>{row.materialName}</td><td>{row.projectCode||""}<small>{row.warehouseCode||""}</small></td><td><strong className="red-text">{format.format(Number(row.balance||0))}</strong></td><td>{format.format(Number(row.minStock||row.minimumStock||0))}</td><td>{format.format(Math.max(0,Number(row.minStock||row.minimumStock||0)-Number(row.balance||0)))}</td></tr>)}{!lowStockItems.length&&<tr><td colSpan={6}><Empty text="Không có vật tư dưới tồn tối thiểu."/></td></tr>}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={()=>navigate("inventory")}>Xem kho ›</button></div></section>}
        </div>
        <section className="card approved-tasks dashboard-tasks-full"><CardHead title="Công việc cần xử lý"/><div className="table-wrap"><table><thead><tr><th>NỘI DUNG</th><th>MODULE</th><th>NGƯỜI / BỘ PHẬN XỬ LÝ</th><th>TRẠNG THÁI</th><th></th></tr></thead><tbody>{priorities.map((item)=><tr key={item.label}><td><strong>{item.label}</strong></td><td>{item.module}</td><td>{item.owner}</td><td>{item.time}</td><td><button className="text-link" onClick={()=>navigate(item.target)}>Xem ngay ›</button></td></tr>)}</tbody></table></div></section>
      </div>
      <aside className="dashboard-right-rail" aria-label="Thông tin cá nhân và nhân sự">
        <section className="card personal-summary-card dashboard-personal-summary" aria-label="Tóm tắt cá nhân"><div className="personal-summary-title"><NavIcon name="dept_personal" kind="group"/><div><strong>Tóm tắt cá nhân</strong><small>{data.user.fullName} · {roleLabel(data,data.user.role)}</small></div></div><div className="personal-summary-metrics"><button onClick={()=>navigate("project_progress")}><span>Dự án tham gia</span><b>{personalProjectIds.size}</b></button><button onClick={()=>navigate(String(data.user.department||'').toUpperCase().includes('KẾ HOẠCH')?'dept_plan_tasks':'dept_project_tasks')}><span>Việc chưa hoàn thành</span><b>{personalOpenTasks.length}</b></button><button onClick={()=>navigate(String(data.user.department||'').toUpperCase().includes('KẾ HOẠCH')?'dept_plan_tasks':'dept_project_tasks')}><span>Việc sắp đến hạn</span><b>{personalDueSoon}</b></button><button onClick={()=>navigate("approvals")}><span>Chờ phê duyệt</span><b>{personalWaitingApproval}</b></button></div></section>
        <DashboardStaffPanel rows={data.staffDirectory}/>
      </aside>
    </div>
  </div>;
}

function DashboardStaffPanel({ rows }: { rows: Row[] }) {
  const [query,setQuery]=useState(""); const [expanded,setExpanded]=useState(false);
  const activeRows=rows.filter((row)=>row.active!==false);
  const filtered=activeRows.filter((row)=>{const hay=`${row.fullName||""} ${row.roleName||row.role||""} ${row.department||""} ${row.email||""} ${row.phone||row.phoneNumber||""}`.toLocaleLowerCase("vi");return !query||hay.includes(query.toLocaleLowerCase("vi"));});
  const shown=expanded?filtered:filtered.slice(0,5);
  const badge=(row:Row)=>{const code=String(row.roleBase||row.role||"").toLowerCase();const map:Record<string,string>={admin:"QT",commander:"CHT",cht:"CHT",engineer:"KSDA",ksda:"KSDA",project:"DA",da_nv:"DA",da_truong:"TP.DA",procurement:"KH",kh_nv:"KH",kh_truong:"TP.KH",warehouse:"TK",thu_kho:"TK",accountant:"TC",team:"TT"};return map[code]||String(row.employeeCode||"NS").slice(0,5).toUpperCase();};
  return <section className="card dashboard-staff-card" aria-label="Danh sách nhân sự"><header><strong>DANH SÁCH NHÂN SỰ</strong><button type="button" onClick={()=>setExpanded((value)=>!value)}>{expanded?"Thu gọn ↑":"Xem tất cả →"}</button></header><label className="dashboard-staff-search"><span>⌕</span><input value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Tìm tên, chức danh, email..."/></label><div className="dashboard-staff-list">{shown.map((row)=>{const online=Boolean(row.online);return <article key={row.id} className="dashboard-staff-row"><div className="dashboard-staff-avatar">{row.avatarUrl?<img src={String(row.avatarUrl)} alt=""/>:<span>{initials(String(row.fullName||"NS"))}</span>}<i className={online?"online":"offline"}/></div><div className="dashboard-staff-info"><strong>{row.fullName}</strong><span>{row.roleName||roleNames[String(row.role)]||row.role||"Chưa có chức danh"}</span><small className={row.active===false?"locked":online?"active":"offline"}>{row.active===false?"Đã khóa":online?"Đang làm việc":"Ngoại tuyến"}</small></div><b className="dashboard-staff-badge">{badge(row)}</b></article>;})}{!shown.length&&<div className="dashboard-staff-empty">Không tìm thấy nhân sự phù hợp.</div>}</div><footer><span>Tổng số: <b>{activeRows.length}</b> nhân sự</span>{!expanded&&filtered.length>5&&<small>Hiển thị 5 nhân sự đầu tiên</small>}</footer></section>;
}

function StaffDirectory({ rows }: { rows: Row[] }) {
  const [query,setQuery]=useState(""); const [department,setDepartment]=useState("ALL");
  const departments=[...new Set(rows.map((row)=>String(row.department||row.roleName||"Chưa phân bộ phận")).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"vi"));
  const filtered=rows.filter((row)=>{const dept=String(row.department||row.roleName||"Chưa phân bộ phận");const matchDepartment=department==="ALL"||dept===department;const hay=`${row.fullName||""} ${row.email||""} ${dept} ${row.roleName||""} ${row.employeeCode||""}`.toLocaleLowerCase("vi");return matchDepartment&&(!query||hay.includes(query.toLocaleLowerCase("vi")));});
  const online=rows.filter((row)=>Boolean(row.online)).length;
  return <section className="card staff-directory"><ListToolbar
    title="DANH BẠ NHÂN SỰ"
    note="DANH BẠ NỘI BỘ · Tất cả thành viên đều có thể xem bộ phận, email công ty và trạng thái hoạt động."
    count={filtered.length} total={rows.length} unit="nhân sự"
    search={{ value: query, onChange: setQuery, placeholder: "Tìm nhân sự theo tên, email…" }}
    filters={[{ key: "department", label: "Bộ phận", value: department, onChange: setDepartment, options: [
      { value: "ALL", label: "TẤT CẢ BỘ PHẬN" },
      ...departments.map((item) => ({ value: item, label: item.toUpperCase() })),
    ] }]}
    extra={<div className="staff-summary"><b>{online}</b><small>ONLINE</small><i/><b>{Math.max(0,rows.length-online)}</b><small>OFFLINE</small></div>}
  /><div className="staff-table"><div className="staff-table-head"><span>#</span><span>HỌ TÊN</span><span>BỘ PHẬN</span><span>EMAIL</span><span>TRẠNG THÁI</span></div>{filtered.map((row,index)=>{const dept=String(row.department||row.roleName||"Chưa phân bộ phận");return <article className="staff-row" key={row.id} tabIndex={0}><span className="staff-index">{index+1}</span><div className="staff-person"><div className="staff-avatar">{initials(String(row.fullName||"NS"))}<i className={row.online?"online":"offline"}/></div><div><strong>{row.fullName}</strong><small>{row.roleName||row.role||"—"}</small></div></div><strong className="staff-department">{dept}</strong><span className="staff-email">{row.email||"Chưa cập nhật email"}</span><span className={`staff-status ${row.online?"online":"offline"}`}>● {row.online?"ONLINE":"OFFLINE"}</span><div className="staff-hover"><strong>{row.fullName}</strong><dl><div><dt>BỘ PHẬN</dt><dd>{dept}</dd></div><div><dt>CHỨC DANH / NHÓM QUYỀN</dt><dd>{row.roleName||row.role||"—"}</dd></div><div><dt>EMAIL</dt><dd>{row.email||"Chưa cập nhật"}</dd></div><div><dt>TRẠNG THÁI</dt><dd className={row.online?"online-text":"offline-text"}>{row.online?"ONLINE":"OFFLINE"}</dd></div></dl></div></article>})}{!filtered.length&&<div className="staff-empty">Không tìm thấy nhân sự phù hợp.</div>}</div></section>;
}

function Requests({ rows, projects, project, onProject, open, inventory, exportRows }: { rows: Row[]; projects: Row[]; project:string; onProject:(value:string)=>void; open: (name: string, row?: Row) => void; inventory: Row[]; exportRows: () => void }) {
  const [status,setStatus]=useState("ALL"); const [query,setQuery]=useState(""); const [fromDate,setFromDate]=useState(""); const [selectedId,setSelectedId]=useState<string>("");
  const now=UI_NOW_MS; const requestRows=rows.filter(row=>project==="ALL"||row.projectId===project); const pending=requestRows.filter((row)=>row.status==="pending_approval"); const ordering=requestRows.filter((row)=>["approved","po_created","ordered"].includes(String(row.status))); const delivered=requestRows.filter((row)=>Number(row.receivedQty)>0); const proposed=requestRows.filter((row)=>!["completed","cancelled","rejected"].includes(String(row.status)));
  const lowStockHints=(inventory||[]).filter((row)=>project==="ALL"||String(row.projectId)===String(project)).filter((row)=>Number(row.available??row.balance)>=0&&Number(row.available??row.balance)<Number(row.minStock||0)).sort((a,b)=>(Number(a.minStock||0)-Number(a.available??a.balance))-(Number(b.minStock||0)-Number(b.available??b.balance))).slice(0,5);
  const filtered=requestRows.filter((row)=>(status==="ALL"||String(row.status)===status)&&(!fromDate||String(row.requestedAt||"").slice(0,10)>=fromDate)&&(!query||`${row.requestNo} ${row.projectCode} ${row.projectName} ${row.requestedBy}`.toLowerCase().includes(query.toLowerCase()))); const selected=filtered.find(row=>String(row.id)===selectedId)||filtered[0];
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
    {lowStockHints.length>0&&<div className="inline-alert requests-lowstock-hint"><b>⚠ Vật tư đang thiếu tồn trong phạm vi ({lowStockHints.length} dòng nổi bật):</b> <span>{lowStockHints.map((row)=>`${row.materialCode} (${row.materialName||"—"}) thiếu ${format.format(Math.max(0,Number(row.minStock||0)-Number(row.available??row.balance)))} ${row.unit||""}`).join(" · ")}</span><button type="button" className="export-mini" onClick={()=>open("request")}>＋ Lập đề nghị</button></div>}
    {/* Bộ lọc đã gộp vào ListToolbar phía trên — không còn card lọc tách rời (§5). */}
    <section className="card request-list-card"><div className="table-wrap"><table className="baseline-table data-table"><thead><tr><th></th><th>Số phiếu</th><th>Dự án / Khu vực</th><th>Người đề nghị</th><th>Ngày đề nghị</th><th>Số dòng vật tư</th><th>Trạng thái</th><th>SLA</th><th>Hành động</th></tr></thead><tbody>{filtered.map((row)=><tr key={row.id} className={selected&&String(selected.id)===String(row.id)?"selected-row":""} onClick={()=>setSelectedId(String(row.id))}><td><input type="radio" readOnly checked={Boolean(selected&&String(selected.id)===String(row.id))}/></td><td><strong className="link">{row.requestNo}</strong></td><td><strong>{row.projectCode}</strong><small>{row.projectName}</small></td><td>{row.requestedBy}</td><td>{date(row.requestedAt)}</td><td>{row.itemCount||row.items?.length||0}</td><td><StatusBadge value={statusLabel(row)}/></td><td>{row.neededAt?date(row.neededAt):"—"}</td><td><div className="row-actions"><button className="icon-mini" onClick={(e)=>{e.stopPropagation();open("detail",row)}}>◉</button><button className="icon-mini" onClick={(e)=>{e.stopPropagation();open("detail",row)}}>✎</button></div></td></tr>)}{!filtered.length&&<tr><td colSpan={9}><Empty text="Không có phiếu phù hợp bộ lọc."/></td></tr>}</tbody></table></div><div className="table-pagination functional-summary"><span>Đang hiển thị toàn bộ {filtered.length} kết quả phù hợp bộ lọc.</span></div></section>
    {selected&&<section className="card approved-request-detail"><div className="table-toolbar"><div><strong>Chi tiết phiếu: <span className="link">{selected.requestNo}</span></strong><span>{selected.projectCode} · {selected.projectName}</span></div><div className="row-actions"><button className={selected.status==="returned_to_requester"?"primary":"secondary"} onClick={()=>open("detail",selected)}>{selected.status==="returned_to_requester"?"✎ Sửa / gửi lại":"◉ Xem phiếu"}</button><button className="secondary" onClick={()=>window.print()}>▣ In phiếu</button></div></div><div className="request-detail-summary"><div><small>Người đề nghị</small><strong>{selected.requestedBy}</strong></div><div><small>Ngày đề nghị</small><strong>{date(selected.requestedAt)}</strong></div><div><small>Số dòng vật tư</small><strong>{selected.itemCount||selected.items?.length||0}</strong></div><div><small>Trạng thái</small><StatusBadge value={statusLabel(selected)}/></div></div><div className="table-wrap"><table><thead><tr><th>STT</th><th>Mã vật tư</th><th>Tên vật tư</th><th>Đơn vị</th><th>Số lượng đề nghị</th><th>Ghi chú</th></tr></thead><tbody>{(selected.items||[]).slice(0,8).map((item:Row,index:number)=><tr key={item.id||index}><td>{index+1}</td><td>{item.materialCode||"—"}</td><td>{item.materialName||"—"}</td><td>{item.unit||"—"}</td><td>{format.format(Number(item.quantity??item.requestedQty??0))}</td><td>{item.note||"—"}</td></tr>)}{!(selected.items||[]).length&&<tr><td colSpan={6}><Empty text="Phiếu chưa có dòng vật tư."/></td></tr>}</tbody></table></div></section>}
  </div>;
}
async function decide(requestId: string, stage: number, decision: "approved"|"rejected", action: (name:string,payload:Row)=>Promise<boolean>, comment?: string) {
  const resolved = comment === undefined ? (window.prompt(decision === "approved" ? "Bình luận duyệt (có thể để trống):" : "Lý do trả lại / từ chối:") ?? "") : comment;
  if (decision === "rejected" && !String(resolved).trim()) { window.alert("Vui lòng nhập lý do trả lại / từ chối."); return false; }
  return action("decide_approval", { requestId, stage, decision, comment: String(resolved).trim() });
}

function ApprovalDots({ approvals }: { approvals: Row[] }) { const sorted = [...(approvals || [])].sort((a,b) => Number(a.stage)-Number(b.stage)); return <div className="approval-dots">{sorted.map((item) => <span key={item.stage} className={item?.status || "pending"} title={`${item.department || `Bước ${item.stage}`}: ${item?.status || "pending"}`}>{item.stage}</span>)}</div>; }

const APPROVAL_STAGE_LABELS:Record<number,string>={1:"CHT ĐÃ XÁC NHẬN",2:"CHỜ THƯ KÝ TGĐ",3:"CHỜ PHÒNG DỰ ÁN",4:"CHỜ TRƯỞNG PHÒNG DA",5:"CHỜ TRƯỞNG PHÒNG KH"};
function Approvals({ data, rows, projects, project, onProject, user, action, open, canUse, refresh }: { data: AppData; rows: Row[]; projects:Row[]; project:string; onProject:(value:string)=>void; user: Row; action: (name: string, payload: Row) => Promise<boolean>; open: (name: string, row?: Row) => void; canUse: boolean; refresh:()=>void }) {
  const activeStages=data.approvalStages.filter((stage)=>stage.active).sort((a,b)=>Number(a.stageNo)-Number(b.stageNo)); const [stageFilter,setStageFilter]=useState("ALL"); const [approvalComment,setApprovalComment]=useState(""); const allPendingRows=rows.filter((row)=>row.status==="pending_approval"); const pendingRows=allPendingRows.filter((row)=>stageFilter==="ALL"||Number(row.approvalStage)===Number(stageFilter)).sort((a,b)=>new Date(a.neededAt||a.requestedAt).getTime()-new Date(b.neededAt||b.requestedAt).getTime());
  const [selectedId,setSelectedId]=useState<string>(()=>String(pendingRows[0]?.id||"")); const selected=pendingRows.find((row)=>String(row.id)===selectedId)||pendingRows[0];
  const stageCount=(stage:number)=>allPendingRows.filter((row)=>Number(row.approvalStage)===stage).length; const overdue=allPendingRows.filter((row)=>{const approval=row.approvals?.find((item:Row)=>Number(item.stage)===Number(row.approvalStage));return approvalTiming(approval).late;}).length;
  const currentStage=selected?Number(selected.approvalStage):0; const currentConfig=data.approvalStages.find((row)=>Number(row.stageNo)===currentStage); const currentApproval=selected?.approvals?.find((item:Row)=>Number(item.stage)===currentStage); const currentRule=currentApproval?.allowedRoleCodes?currentApproval:currentConfig; const permitted=Boolean(selected)&&canUse&&stageAllowedForUser(currentRule,user); const timing=approvalTiming(currentApproval);
  return <div className="stack module-screen approval-screen baseline-screen"><div className="kpi-grid approval-stage-kpis">{activeStages.map((stage,index)=><Kpi key={stage.stageNo} icon={`C${stage.stageNo}`} label={APPROVAL_STAGE_LABELS[Number(stage.stageNo)]||`CHỜ ${String(stage.name||"DUYỆT").toUpperCase()}`} value={`${format.format(stageCount(Number(stage.stageNo)))} Phiếu`} note={stage.name||`Theo hàng đợi cấp ${stage.stageNo}`} tone={index%3===1?"violet":index%3===2?"amber":undefined}/>) }<Kpi icon="QH" label="Quá hạn" value={`${format.format(overdue)} Phiếu`} note="Theo SLA của từng cấp" tone="red"/></div>
    <section className="card approval-filter-card"><div className="approval-filter-row"><span className="global-project-scope-chip">Dự án: {project==="ALL"?"Tất cả":projects.find(row=>row.id===project)?.code||project}</span><label>Bước xử lý<select value={stageFilter} onChange={e=>setStageFilter(e.target.value)}><option value="ALL">Tất cả bước</option>{activeStages.map((stage)=><option key={stage.stageNo} value={stage.stageNo}>Bước {stage.stageNo} · {stage.name||"Phê duyệt"}</option>)}</select></label><label>Trạng thái<select value="pending_approval" disabled><option value="pending_approval">Chờ duyệt</option></select></label><button type="button" className="icon-button" onClick={refresh} title="Tải lại dữ liệu">↻</button></div></section>
    {selected?<div className="approval-workbench baseline-approval-workbench"><section className="card approval-queue"><div className="approval-pane-head"><strong>DANH SÁCH PHIẾU CHỜ DUYỆT ({pendingRows.length})</strong><span>Sắp xếp: Mới nhất⌄</span></div><div className="approval-queue-list">{pendingRows.map((row)=>{const active=String(row.id)===String(selected.id);const ap=row.approvals?.find((item:Row)=>Number(item.stage)===Number(row.approvalStage));const tm=approvalTiming(ap);return <button key={row.id} className={active?"active":""} onClick={()=>{setSelectedId(String(row.id));open("detail",row);}}><div><span className="approval-doc-icon"><NavIcon name="requests"/></span><strong>{row.requestNo}</strong><StatusBadge value={tm.late?"Khẩn cấp":row.priority==="urgent"?"Khẩn cấp":"Trung bình"}/></div><span>Dự án: {row.projectName||row.projectCode}</span><span>Khu vực: {row.area||row.purpose||"Theo phiếu đề nghị"}</span><span>Nhà cung cấp: {row.supplierName||"Chưa xác định"}</span><span>Giá trị: <b>{money(row.totalEstimatedValue)}</b></span><small>{tm.late?`Quá hạn ${durationText(tm.minutes)}`:`${durationText(tm.minutes)} trước`}</small></button>})}</div><div className="queue-pagination functional-summary"><span>{pendingRows.length} phiếu trong hàng đợi hiện tại</span></div></section>
      <section className="card approval-detail-pane"><div className="approval-detail-head"><div><small>PHIẾU ĐANG XỬ LÝ</small><h2>{selected.requestNo} {selected.priority==="urgent"&&<StatusBadge value="Khẩn cấp"/>}</h2><p>Dự án: {selected.projectName||selected.projectCode} · Nhà cung cấp: {selected.supplierName||"Chưa xác định"}</p><b>Giá trị: {money(selected.totalEstimatedValue)} · Ngày tạo: {date(selected.requestedAt)}</b></div><div className={timing.late?"sla-big late":"sla-big"}><small>SLA còn lại</small><strong>{timing.late?"QUÁ HẠN":durationText(Math.max(0,Number(currentApproval?.slaMinutes||0)-timing.minutes))}</strong><span>Hạn duyệt: {date(currentApproval?.dueAt)}</span></div></div><div className="approval-flow"><h3>QUY TRÌNH PHÊ DUYỆT (Bước {currentStage}/{data.approvalStages.filter((stage)=>stage.active).length})</h3>{data.approvalStages.filter((stage)=>stage.active).sort((a,b)=>Number(a.stageNo)-Number(b.stageNo)).map((stage)=>{const approval=selected.approvals?.find((item:Row)=>Number(item.stage)===Number(stage.stageNo));const state=approval?.status||(Number(stage.stageNo)===currentStage?"pending":"waiting");return <div className={`approval-flow-step ${state}`} key={stage.stageNo}><i>{stage.stageNo}</i><div><strong>{stage.name||`Bước ${stage.stageNo}`}</strong><span>{stage.description||"Theo luồng phê duyệt đã cấu hình"}</span></div><div className="approval-person"><b>{approval?.approverName||String(stage.allowedRoleCodes||"").split(",").filter(Boolean).map((code:string)=>roleLabel(data,code)).join(" / ")||"Chưa xác định người xử lý"}</b><small>{Number(stage.stageNo)===currentStage?"Người/nhóm đang xử lý":"Bước tiếp theo"}</small></div><em>{approval?.status==="approved"?"ĐÃ DUYỆT":Number(stage.stageNo)===currentStage?"ĐANG CHỜ":"CHỜ DUYỆT"}</em></div>})}<div className="approval-flow-step done"><i>✓</i><div><strong>HOÀN TẤT</strong><span>Phiếu được phê duyệt</span></div><em>CHỜ XỬ LÝ</em></div></div>
        <div className="approval-log"><h3>LỊCH SỬ XỬ LÝ</h3><div><span className="mini-avatar">{initials(String(selected.requestedBy||"NV"))}</span><p><strong>{selected.requestedBy}</strong><b>Tạo phiếu đề nghị</b><small>{date(selected.requestedAt)}</small></p></div></div>
        
        {permitted&&<label className="approval-comment"><span>BÌNH LUẬN</span><textarea value={approvalComment} onChange={e=>setApprovalComment(e.target.value)} placeholder="Ghi chú duyệt hoặc lý do cần bổ sung/trả lại..."/></label>}
        <footer className="approval-actions"><button className="secondary" onClick={()=>open("detail",selected)}>◉ XEM / TẢI PHIẾU</button>{permitted&&<><button className="primary" onClick={async()=>{if(await decide(selected.id,currentStage,"approved",action,approvalComment))setApprovalComment("");}}>✓ DUYỆT</button><button className="reject" onClick={async()=>{if(await decide(selected.id,currentStage,"rejected",action,approvalComment))setApprovalComment("");}}>↩ TRẢ LẠI</button><button className="supplement" onClick={()=>open("detail",selected)}>ⓘ YÊU CẦU BỔ SUNG</button></>} </footer></section>
      <aside className="card approval-meta-pane"><div className="approval-pane-head"><strong>HỒ SƠ CHI TIẾT</strong></div><dl><div><dt>Mã phiếu</dt><dd>{selected.requestNo}</dd></div><div><dt>Loại phiếu</dt><dd>Phiếu đề nghị mua hàng</dd></div><div><dt>Dự án</dt><dd>{selected.projectName||selected.projectCode}</dd></div><div><dt>Nhà cung cấp</dt><dd>{selected.supplierName||"Chưa xác định"}</dd></div><div><dt>Người đề nghị</dt><dd>{selected.requestedBy}</dd></div><div><dt>Phòng ban</dt><dd>{selected.department||"Phòng Dự án"}</dd></div><div><dt>Ngày tạo</dt><dd>{date(selected.requestedAt)}</dd></div><div><dt>Tổng giá trị</dt><dd>{money(selected.totalEstimatedValue)}</dd></div><div><dt>Tiền tệ</dt><dd>VND</dd></div><div><dt>Ghi chú</dt><dd>{selected.purpose||"Mua vật tư phục vụ thi công giai đoạn 1."}</dd></div></dl><div className="approval-files real-attachment-panel"><div className="approval-pane-head"><strong>TÀI LIỆU ĐÍNH KÈM</strong></div><AttachmentPanel entityType="material_request" entityId={selected.id}/></div></aside></div>:<section className="card"><Empty text="Không còn hồ sơ chờ phê duyệt."/></section>}</div>;
}
function Purchasing({ data, project, open, action, canUse }: { data: AppData; project: string; open: (name: string, row?: Row) => void; action:(name:string,payload:Row)=>Promise<boolean>; canUse: boolean }) {
  const requests=data.requests.filter((row)=>(project==="ALL"||row.projectId===project)&&row.supplyStatus==="awaiting_po"); const pos=data.purchaseOrders.filter((row)=>project==="ALL"||row.projectId===project); const boqRows=data.boqItems.filter((row)=>(project==="ALL"||row.projectId===project)&&["material","component"].includes(String(row.rowRole||"material"))); const selected=project==="ALL"?null:data.projects.find((row)=>row.id===project);
  const contractRows=boqRows.filter((row)=>row.itemType!=="outside_contract"); const contract=contractRows.reduce((sum,row)=>sum+Number(row.contractQty||0)*Number(row.unitPrice||0),0); const ordered=contractRows.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.orderedQty||0))*Number(row.unitPrice||0),0); const received=contractRows.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.receivedQty||0))*Number(row.unitPrice||0),0); const paid=data.contractPayments.filter((row)=>project==="ALL"||row.projectId===project).reduce((sum,row)=>sum+Number(row.amount||0),0); const efficiency=ordered>0?Math.min(100,received/ordered*100):0;
  const [pricePreview,setPricePreview]=useState<Row[]>([]); const [priceFileName,setPriceFileName]=useState("");
  async function importPrices(file?:File){if(!file||!selected)return;try{const updates=mapBoqPriceRows(await parseSpreadsheetRows(file),boqRows);setPricePreview(updates);setPriceFileName(file.name);}catch(error){setPricePreview([]);window.alert(error instanceof Error?error.message:"Không đọc được file đơn giá hợp đồng.");}}
  async function confirmPrices(){if(!selected||!pricePreview.length)return;const ok=await action("update_boq_contract_prices",{projectId:selected.id,sourceFileName:priceFileName,updates:pricePreview.map(({boqItemId,sourceOrder,unitPrice})=>({boqItemId,sourceOrder,unitPrice}))});if(ok){setPricePreview([]);setPriceFileName("");}}
  const systemRows=BOQ_SYSTEM_CODES.map((code)=>{const rows=boqRows.filter((row)=>normalizeBoqSystemCode(row.systemCode||row.customFields?.systemCode)===code);const c=rows.filter((row)=>row.itemType!=="outside_contract");const a=c.reduce((sum,row)=>sum+Number(row.contractQty||0)*Number(row.unitPrice||0),0);const b=c.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.orderedQty||0))*Number(row.unitPrice||0),0);const r=c.reduce((sum,row)=>sum+Math.min(Number(row.contractQty||0),Number(row.receivedQty||0))*Number(row.unitPrice||0),0);return{code,name:boqSystemName(code),a,b,r,pct:b?Math.min(100,r/b*100):0};}).filter((row)=>row.a||row.b||row.r||project==="ALL");
  const doc={projectCode:selected?.code,projectName:selected?.name,contractNo:selected?.contractNo,rows:boqRows,fieldConfigs:data.formFieldConfigs};
  return <div className="stack module-screen purchasing-screen baseline-screen"><div className="kpi-grid"><Kpi icon="MR" label="MR chờ lập PO" value={format.format(requests.length)} note="↑ tự chuyển sau duyệt cuối"/><Kpi icon="PO" label="PO chờ giao" value={format.format(pos.filter((row)=>!["completed","completed_with_exceptions"].includes(String(row.status))).length)} note="Theo trạng thái đơn hàng" tone="violet"/><Kpi icon="DG" label="PO đang giao" value={format.format(pos.filter((row)=>String(row.status).includes("partial")||String(row.status).includes("delivery")).length)} note="Đang cập nhật giao hàng" tone="amber"/><Kpi icon="GT" label="Tổng giá trị đối chiếu" value={moneyBillion(contract)} note="Theo BOQ/Hợp đồng" tone="green"/></div>
    <section className="card purchase-cumulative-card"><div className="purchase-cumulative-head"><div><h2>LŨY KẾ MUA HÀNG ĐỐI CHIẾU BOQ/HỢP ĐỒNG</h2><p>Số liệu tính đến ngày {new Intl.DateTimeFormat("vi-VN").format(new Date())}</p></div></div><div className="purchase-summary-metrics"><article><small>TỔNG GIÁ TRỊ HỢP ĐỒNG (A)</small><strong>{moneyBillion(contract)}</strong><i><b style={{width:"100%"}}/></i><span>100% · Hợp đồng</span></article><article><small>GIÁ TRỊ ĐỐI CHIẾU (B)</small><strong>{moneyBillion(ordered)}</strong><i><b style={{width:`${contract?Math.min(100,ordered/contract*100):0}%`}}/></i><span>{contract?(ordered/contract*100).toLocaleString("vi-VN",{maximumFractionDigits:2}):"0"}% · B/A</span></article><article><small>ĐÃ NHẬN HÀNG (C)</small><strong>{moneyBillion(received)}</strong><i><b style={{width:`${contract?Math.min(100,received/contract*100):0}%`}}/></i><span>{contract?(received/contract*100).toLocaleString("vi-VN",{maximumFractionDigits:2}):"0"}% · C/A</span></article><article><small>THANH TOÁN (D)</small><strong>{moneyBillion(paid)}</strong><i><b style={{width:`${contract?Math.min(100,paid/contract*100):0}%`}}/></i><span>{contract?(paid/contract*100).toLocaleString("vi-VN",{maximumFractionDigits:2}):"0"}% · D/A</span></article><div className="purchase-efficiency-columns"><div><i className="received" style={{height:`${Math.max(6,efficiency)}%`}}/><strong>{efficiency.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong><span>Đã nhận / Đối chiếu</span></div><div><i className="remaining" style={{height:`${Math.max(6,100-efficiency)}%`}}/><strong>{Math.max(0,100-efficiency).toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong><span>Còn lại</span></div></div></div></section>
    <div className="purchase-action-bar"><button className="secondary" onClick={()=>selected?downloadBoqPriceTemplateXlsx(doc):window.alert("Hãy chọn một dự án cụ thể.")}>⇩ TẢI MẪU ĐƠN GIÁ HĐ</button><label className={`secondary file-inline ${!selected||!canUse?"is-disabled":""}`}>⇧ NHẬP ĐƠN GIÁ HĐ<input type="file" accept=".xlsx,.csv" disabled={!selected||!canUse} onChange={(e)=>{void importPrices(e.target.files?.[0]);e.target.value="";}}/></label><button className="secondary" onClick={()=>requests[0]?downloadPoPlanningTemplate(data,requests[0]):downloadBlankPoPlanningTemplate(data)}>⇩ TẢI MẪU PO</button><button className="secondary" disabled={!requests[0]} onClick={()=>requests[0]&&open("po",requests[0])}>⇧ NHẬP PO EXCEL</button><button className="primary" disabled={!canUse||!requests[0]} onClick={()=>requests[0]&&open("po",requests[0])}>＋ PHÁT HÀNH PO</button></div>
    {pricePreview.length>0&&<section className="card price-import-preview"><header><div><strong>KIỂM TRA TRƯỚC KHI CẬP NHẬT · {priceFileName}</strong><small>{pricePreview.length} dòng hợp lệ · {pricePreview.filter((row)=>row.changed).length} dòng thay đổi</small></div><div className="row-actions"><button className="secondary" onClick={()=>setPricePreview([])}>HỦY</button><button className="primary" onClick={()=>void confirmPrices()}>XÁC NHẬN CẬP NHẬT GIÁ</button></div></header></section>}
    <section className="card purchase-system-table"><div className="table-wrap"><table className="baseline-table"><thead><tr><th>NHÓM VẬT TƯ (HỆ M&E)</th><th>HỢP ĐỒNG (A)</th><th>ĐỐI CHIẾU (B)</th><th>ĐÃ NHẬN (C)</th><th>THANH TOÁN (D)</th><th>C/E/B</th><th>TRẠNG THÁI</th></tr></thead><tbody>{systemRows.map((row)=><Fragment key={row.code}><tr className="system-total-row"><td><strong>⌄ &nbsp; HỆ {row.name.toUpperCase()}</strong></td><td><strong>{moneyBillion(row.a)}</strong></td><td><strong>{moneyBillion(row.b)}</strong></td><td><strong>{moneyBillion(row.r)}</strong></td><td><strong>{moneyBillion(row.a?paid*(row.a/Math.max(contract,1)):0)}</strong></td><td><strong>{row.pct.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong></td><td><StatusBadge value={row.pct>=50?"Đạt kế hoạch":"Cần theo dõi"}/></td></tr></Fragment>)}{!systemRows.length&&<tr><td colSpan={7}><Empty text="Chưa có dữ liệu BOQ/Hợp đồng phát sinh trong phạm vi đang chọn."/></td></tr>}<tr className="total-row"><td><strong>TỔNG CỘNG</strong></td><td><strong>{moneyBillion(contract)}</strong></td><td><strong>{moneyBillion(ordered)}</strong></td><td><strong>{moneyBillion(received)}</strong></td><td><strong>{moneyBillion(paid)}</strong></td><td><strong>{efficiency.toLocaleString("vi-VN",{maximumFractionDigits:2})}%</strong></td><td></td></tr></tbody></table></div></section>
    <section className="card purchase-material-cumulative"><CardHead title="Chi tiết lũy kế theo vật tư" note="Chỉ hiển thị dữ liệu thực từ BOQ, đề nghị, PO và giao nhận; không nội suy dòng minh họa."/><div className="table-wrap"><table className="baseline-table resizable-data-table"><thead><tr><th>STT HĐ</th><th>Mã vật tư</th><th>Tên vật tư</th><th>ĐVT</th><th>BOQ/HĐ</th><th>Đã đề nghị</th><th>Đã duyệt mua</th><th>Lũy kế PO</th><th>Đã nhận</th><th>Còn phải mua</th></tr></thead><tbody>{boqRows.map((row)=><tr key={row.id}><td>{row.sourceOrder||"—"}</td><td><strong>{row.materialCode||"—"}</strong></td><td>{row.materialName||"—"}</td><td>{row.unit||"—"}</td><td>{format.format(Number(row.contractQty||0))}</td><td>{format.format(Number(row.requestedQty||0))}</td><td>{format.format(Number(row.approvedQty||row.approvedPurchaseQty||0))}</td><td>{format.format(Number(row.orderedQty||0))}</td><td>{format.format(Number(row.receivedQty||0))}</td><td><strong>{format.format(Math.max(0,boqControlQty(row)-Number(row.orderedQty||0)))}</strong></td></tr>)}{!boqRows.length&&<tr><td colSpan={10}><Empty text="Chưa có dòng vật tư BOQ/Hợp đồng cho phạm vi đang chọn."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function Receiving({ data, project, open, canUse }: { data: AppData; project: string; open: (name: string, row?: Row) => void; canUse: boolean }) {
  const [supplierFilter,setSupplierFilter]=useState("ALL"); const [statusFilter,setStatusFilter]=useState("ALL"); const [fromDate,setFromDate]=useState(""); const [toDate,setToDate]=useState("");
  const pos=data.purchaseOrders.filter((row)=>(project==="ALL"||row.projectId===project)&&!["completed","completed_with_exceptions","completed_with_shortage"].includes(String(row.status))); const filteredPos=pos.filter(r=>(supplierFilter==="ALL"||String(r.supplierId||r.supplierName)===supplierFilter)&&(statusFilter==="ALL"||String(r.status)===statusFilter)&&(!fromDate||String(r.eta||"").slice(0,10)>=fromDate)&&(!toDate||String(r.eta||"").slice(0,10)<=toDate)); const now=UI_NOW_MS; const late=pos.filter((row)=>row.eta&&new Date(row.eta).getTime()<now).length; const soon=pos.filter((row)=>{const t=new Date(row.eta||0).getTime();return t>=now&&t<=now+3*86400000;}).length; const activeSuppliers=new Set(pos.map((row)=>row.supplierId||row.supplierName).filter(Boolean)).size;
  return <div className="stack module-screen receiving-screen baseline-screen"><div className="kpi-grid"><Kpi icon="HN" label="Lịch giao hôm nay" value={format.format(pos.filter((row)=>String(row.eta||"").slice(0,10)===UI_TODAY).length)} note="↑ so với hôm qua"/><Kpi icon="TH" label="Trễ hẹn" value={format.format(late)} note="↑ cần xử lý ngay" tone="red"/><Kpi icon="SH" label="Sắp đến hạn (3 ngày)" value={format.format(soon)} note="↑ cần chủ động xác nhận" tone="amber"/><Kpi icon="NCC" label="Nhà cung cấp đang giao" value={format.format(activeSuppliers)} note="↑ PO đang thực hiện" tone="green"/></div>
    <section className="card baseline-filter-card"><div className="filter-grid receiving-filter-grid"><label><span>Nhà cung cấp</span><select value={supplierFilter} onChange={e=>setSupplierFilter(e.target.value)}><option value="ALL">Tất cả nhà cung cấp</option>{data.suppliers.map((row)=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label><span>Trạng thái</span><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="ALL">Tất cả trạng thái</option><option value="approved">Đã duyệt</option><option value="ordered">Đã đặt</option><option value="partial">Giao một phần</option></select></label><label><span>Từ ngày</span><input type="date" value={fromDate} onChange={e=>setFromDate(e.target.value)}/></label><label><span>Đến ngày</span><input type="date" value={toDate} onChange={e=>setToDate(e.target.value)}/></label><button type="button" className="secondary" onClick={()=>{setSupplierFilter("ALL");setStatusFilter("ALL");setFromDate("");setToDate("");}}>Đặt lại</button></div></section>
    <section className="card delivery-main-card"><div className="table-toolbar compact"><div><strong>Tổng {filteredPos.length} bản ghi</strong></div></div><div className="table-wrap"><table className="baseline-table"><thead><tr><th>PO</th><th>DỰ ÁN</th><th>NHÀ CUNG CẤP</th><th>HỆ M&E</th><th>NGÀY GIAO DỰ KIẾN</th><th>KHỐI LƯỢNG ĐẶT</th><th>KHỐI LƯỢNG ĐÃ GIAO</th><th>CÒN THIẾU</th><th>CHỨNG CHỈ</th><th>ẢNH</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>{filteredPos.map((row,index)=>{const ordered=Number(row.orderedQty||0),actual=Number(row.actualDeliveredQty||0),remain=Math.max(0,ordered-actual),pct=ordered?Math.min(100,actual/ordered*100):0;return <tr key={row.id}><td><strong>{row.poNo}</strong></td><td>{row.projectName||row.projectCode}</td><td>{row.supplierName}</td><td><StatusBadge value={row.systemCode||"Điện"}/></td><td><strong>{date(row.eta)}</strong><small className={row.eta&&new Date(row.eta).getTime()<now?"red-text":"link"}>{row.eta&&String(row.eta).slice(0,10)===UI_TODAY?"Hôm nay":row.eta&&new Date(row.eta).getTime()<now?"Trễ hẹn":"Sắp đến hạn"}</small></td><td>{format.format(ordered)}<small>PCS</small></td><td>{format.format(actual)}<small>{pct.toFixed(0)}%</small></td><td><strong className={remain?"red-text":"green-text"}>{format.format(remain)}</strong><small>PCS</small></td><td>▧ {row.certificateCount||0}</td><td>▧ {row.attachmentCount||0}</td><td><StatusBadge value={remain<=0?"Đã giao đủ":row.eta&&new Date(row.eta).getTime()<now?"Trễ hẹn":actual>0?"Đang giao":"Chưa giao"}/></td><td><button className="icon-mini" onClick={()=>open("receipt")}>⋮</button></td></tr>})}{!filteredPos.length&&<tr><td colSpan={12}><Empty text="Không còn PO phù hợp bộ lọc."/></td></tr>}</tbody></table></div><div className="table-pagination functional-summary"><span>Đang hiển thị toàn bộ {filteredPos.length} bản ghi.</span></div></section>
  </div>;
}
function WarehouseReceipt({ data, project, open, canUse }: { data: AppData; project: string; open: (name: string, row?: Row) => void; canUse: boolean }) {
  const scoped=data.receipts.filter((row)=>project==="ALL"||row.projectId===project);
  const [query,setQuery]=useState("");
  const [status,setStatus]=useState("ALL");
  const rows=scoped.filter((row)=>{
    if(status!=="ALL"&&String(row.bchConfirmationStatus||"pending")!==status)return false;
    if(!query.trim())return true;
    return [row.receiptNo,row.poNo,row.projectCode,row.projectName,row.supplierName,row.warehouseName].some((value)=>String(value||"").toLowerCase().includes(query.trim().toLowerCase()));
  });
  const pending=scoped.filter((row)=>row.bchConfirmationStatus==="pending").length;
  const confirmed=scoped.filter((row)=>row.bchConfirmationStatus==="confirmed").length;
  const missingCertificate=scoped.filter((row)=>row.certificateStatus!=="complete").length;
  const accepted=scoped.reduce((sum,row)=>sum+Number(row.acceptedQty||0),0);
  return <div className="stack module-screen warehouse-receipt-screen baseline-screen">
    <ListToolbar
      title="NHẬP KHO"
      note="Ghi nhận chứng từ nhập kho sau giao hàng và xác nhận BCH; không dùng chung màn hình kế hoạch giao hàng."
      count={rows.length} total={scoped.length} unit="hồ sơ"
      search={{ value: query, onChange: setQuery, placeholder: "Số phiếu, PO, NCC, kho..." }}
      filters={[{ key: "status", label: "Trạng thái xác nhận", value: status, onChange: setStatus, options: [
        { value: "ALL", label: "Tất cả trạng thái" },
        { value: "pending", label: "Chờ BCH xác nhận" },
        { value: "confirmed", label: "Đã xác nhận" },
        { value: "rejected", label: "Từ chối" },
      ] }]}
      actions={<>
        <button className="secondary" onClick={()=>{setQuery("");setStatus("ALL");}}>Đặt lại</button>
        <button className="primary" disabled={!canUse} onClick={()=>open("receipt")}>＋ TẠO PHIẾU NHẬP</button>
      </>}
    />
    <div className="kpi-grid"><Kpi icon="CX" label="Chờ BCH xác nhận" value={format.format(pending)} note="Chưa đủ điều kiện hoàn tất nhập" tone="amber"/><Kpi icon="XN" label="Đã xác nhận" value={format.format(confirmed)} note="Hồ sơ đã được BCH chấp nhận" tone="green"/><Kpi icon="CC" label="Thiếu CO/CQ" value={format.format(missingCertificate)} note="Cần bổ sung chứng chỉ" tone="red"/><Kpi icon="SL" label="Tổng SL chấp nhận" value={format.format(accepted)} note="Theo phạm vi dự án đang chọn" tone="violet"/></div>
    {/* Bộ lọc đã gộp vào ListToolbar phía trên — không còn card lọc tách rời (§5). */}
    <section className="card"><CardHead title="Danh sách phiếu nhập kho" note={`${rows.length} hồ sơ đúng phạm vi dự án/kho`}/><div className="table-wrap"><table className="baseline-table"><thead><tr><th>Phiếu nhập</th><th>PO</th><th>Dự án</th><th>Nhà cung cấp</th><th>Kho nhận</th><th>Ngày nhận</th><th>SL chấp nhận</th><th>CO/CQ</th><th>Xác nhận BCH</th><th>Thao tác</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td><strong>{row.receiptNo||"—"}</strong></td><td>{row.poNo||"—"}</td><td>{row.projectName||row.projectCode||"—"}</td><td>{row.supplierName||"—"}</td><td>{row.warehouseName||"—"}</td><td>{date(row.receivedAt)}</td><td>{format.format(Number(row.acceptedQty||0))}</td><td><StatusBadge value={row.certificateStatus==="complete"?"Đầy đủ":"Thiếu hồ sơ"}/></td><td><StatusBadge value={row.bchConfirmationStatus==="confirmed"?"Đã xác nhận":row.bchConfirmationStatus==="rejected"?"Từ chối":"Chờ xác nhận"}/></td><td><button className="icon-mini" onClick={()=>open("receiptDetail",row)}>◉</button></td></tr>)}{!rows.length&&<tr><td colSpan={10}><Empty text="Chưa có phiếu nhập kho phù hợp bộ lọc."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function Delivered({ data, project, open }: { data: AppData; project: string; open: (name: string, row?: Row) => void }) {
  const rows=data.receipts.filter((row)=>(project==="ALL"||row.projectId===project)&&row.bchConfirmationStatus==="confirmed"); const acceptedTotal=rows.reduce((sum,row)=>sum+Number(row.acceptedQty||0),0); const selected=rows[0]; const [advanced,setAdvanced]=useState(false);
  return <div className="stack module-screen delivered-screen baseline-screen"><div className="screen-toolbar report-export-toolbar"><div></div><div className="row-actions"><button className="secondary" onClick={()=>exportDeliveredXlsx(rows)}>▣ Xuất Excel</button><button className="secondary" onClick={()=>exportDeliveredCsv(rows)}>▣ Xuất CSV</button><button className="secondary danger-outline" onClick={()=>downloadDeliveredPdf(rows)}>▣ Xuất PDF</button><button className={advanced?"secondary active":"secondary"} onClick={()=>setAdvanced(v=>!v)}>⚲ Lọc nâng cao</button></div></div>{advanced&&<section className="card compact-functional-filter"><span>Đang áp dụng phạm vi dự án ở thanh dự án phía trên.</span><button className="secondary" onClick={()=>setAdvanced(false)}>ĐÓNG BỘ LỌC</button></section>}<div className="kpi-grid"><Kpi icon="DG" label="Đơn đã giao đủ" value={format.format(rows.filter((row)=>Number(row.acceptedQty)>=Number(row.orderedQty||row.acceptedQty)).length)} note="↑ so với kỳ trước" tone="green"/><Kpi icon="MP" label="Giao một phần" value={format.format(rows.filter((row)=>Number(row.acceptedQty)<Number(row.orderedQty||row.acceptedQty)).length)} note="↑ theo dõi giao tiếp"/><Kpi icon="XN" label="Chờ BCH xác nhận" value={format.format(data.receipts.filter((row)=>row.bchConfirmationStatus==="pending").length)} note="↑ cần xử lý" tone="amber"/><Kpi icon="NK" label="Đã nhập kho" value={format.format(acceptedTotal)} note="↑ số lượng được chấp nhận" tone="violet"/></div>
    <section className="card delivered-table-card"><div className="table-toolbar compact"><span>Đang hiển thị toàn bộ {rows.length} dòng</span></div><div className="table-wrap"><table className="baseline-table"><thead><tr><th>PO</th><th>DỰ ÁN</th><th>NHÀ CUNG CẤP</th><th>KHO NHẬN</th><th>NGÀY GIAO</th><th>BCH XÁC NHẬN</th><th>CHỨNG CHỈ</th><th>ẢNH</th><th>TÌNH TRẠNG</th><th>THAO TÁC</th></tr></thead><tbody>{rows.map((row)=><tr key={row.id}><td><strong className="link">{row.poNo}</strong></td><td>{row.projectName||row.projectCode}</td><td>{row.supplierName}</td><td>{row.warehouseName||"KHO CÔNG TRƯỜNG"}</td><td>{date(row.receivedAt)}</td><td><span className="person-cell"><i className="mini-avatar">{initials(String(row.bchConfirmedByName||"BCH"))}</i><span>{row.bchConfirmedByName||"BCH công trường"}<small>{date(row.bchConfirmedAt)}</small></span></span></td><td><span className="link">▧ {row.certificateStatus==="complete"?2:0}</span></td><td><span className="violet-text">▧ {row.attachmentCount||0}</span></td><td><StatusBadge value="Đã nhập kho"/></td><td><button className="icon-mini" onClick={()=>open("receiptDetail",row)}>◉</button></td></tr>)}{!rows.length&&<tr><td colSpan={10}><Empty text="Chưa có đơn hàng hoàn tất xác nhận."/></td></tr>}</tbody></table></div></section>
    <div className="delivered-detail-grid"><section className="card"><CardHead title="Lịch sử giao nhận" note="Chỉ hiển thị mốc thời gian đã ghi nhận trên hồ sơ"/>{selected?<div className="delivery-timeline"><div className="green"><i>✓</i><p><strong>BCH đã xác nhận giao hàng</strong><span>{selected.bchConfirmedByName||"BCH công trường"}</span></p><time>{date(selected.bchConfirmedAt)}</time></div><div className="blue"><i>●</i><p><strong>Kho ghi nhận nhận hàng</strong><span>{selected.warehouseName||"Kho công trường"}</span></p><time>{date(selected.receivedAt)}</time></div>{selected.createdAt&&<div className="violet"><i>●</i><p><strong>Tạo hồ sơ giao nhận</strong><span>{selected.poNo||"Theo PO"}</span></p><time>{date(selected.createdAt)}</time></div>}</div>:<Empty text="Chưa có giao nhận thực tế để hiển thị lịch sử."/>}</section><section className="card"><CardHead title="Chứng chỉ / Tài liệu đã tải lên" note="Tải lên và tải xuống trực tiếp từ hồ sơ giao nhận"/>{selected?<AttachmentPanel entityType="goods_receipt" entityId={selected.id}/>:<Empty text="Chưa có chuyến giao để hiển thị hồ sơ."/>}</section><section className="card"><CardHead title="Ảnh giao hàng" note="Hiển thị và tải từ đúng hồ sơ giao nhận, không dùng ảnh minh họa giả"/>{selected?<div className="delivery-photo-files"><AttachmentPanel entityType="goods_receipt" entityId={selected.id}/></div>:<Empty text="Chưa có chuyến giao để hiển thị ảnh."/>}</section></div>
  </div>;
}
function Inventory({ data, project, open }: { data: AppData; project: string; open: (name: string, row?: Row) => void }) {
  const [query,setQuery]=useState(""); const [lowOnly,setLowOnly]=useState(false); const scopedInventory=data.inventory.filter((row)=>project==="ALL"||row.projectId===project); const searched=scopedInventory.filter(row=>!query||`${row.materialCode||""} ${row.materialName||""} ${row.warehouseCode||""} ${row.warehouseName||""} ${row.locationCode||""}`.toLocaleLowerCase("vi").includes(query.toLocaleLowerCase("vi"))); const lowRows=searched.filter(row=>Number(row.available??row.balance)>=0&&Number(row.available??row.balance)<Number(row.minStock||0)); const filtered=lowOnly?[...lowRows].sort((a,b)=>(Number(a.minStock||0)-Number(a.available??a.balance))-(Number(b.minStock||0)-Number(b.available??b.balance))):searched; const positive=filtered.filter((row)=>Number(row.available??row.balance)>0); const totalQty=positive.reduce((sum,row)=>sum+Number((row.available??row.balance)||0),0); const below=lowRows.length; const inbound=filtered.filter(row=>Number(row.pendingInbound||0)>0).length; const outbound=data.issues.filter((row)=>project==="ALL"||row.projectId===project).length;
  const selectedProject=project==="ALL"?null:data.projects.find(row=>row.id===project); const allowedWarehouses=data.warehouses.filter(row=>project==="ALL"||row.projectId===project||row.warehouseType==="central");
  return <div className="stack baseline-screen approved-inventory-screen">
    <ListToolbar
      title="TỒN KHO & ĐIỀU CHUYỂN"
      note="Theo dõi tồn theo đúng dự án/kho được phân quyền; điều chuyển phải có xác nhận kho đích."
      count={filtered.length} total={scopedInventory.length} unit="mã vật tư"
      search={{ value: query, onChange: setQuery, placeholder: "Tìm kiếm theo mã vật tư, tên vật tư..." }}
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
      <section className="card inventory-tabs-card"><div className="inventory-tabs"><span className="active" aria-current="page">TỒN KHO</span><button onClick={()=>open("receipt")}>NHẬP KHO</button><button onClick={()=>open("issue")}>XUẤT KHO</button><button onClick={()=>open("transfer")}>CHUYỂN KHO</button><button onClick={()=>printInventoryLedger(filtered)}>THẺ KHO</button></div><div className="table-wrap"><table className="baseline-table"><thead><tr><th>#</th><th>Mã vật tư</th><th>Tên vật tư</th><th>ĐVT</th><th>On Hand</th><th>Đã giữ</th><th>Tồn khả dụng</th><th>Tồn tối thiểu</th><th>Vị trí/Kho</th><th>Dự án</th><th>Trạng thái</th></tr></thead><tbody>{filtered.map((row,index)=><tr key={`${row.warehouseId}-${row.materialId}-${index}`}><td>{index+1}</td><td><strong className="link">{row.materialCode}</strong></td><td>{row.materialName}</td><td>{row.unit}</td><td>{format.format(row.balance||0)}</td><td>{format.format(row.reserved||0)}</td><td><strong>{format.format((row.available??row.balance)||0)}</strong></td><td>{format.format(row.minStock||0)}</td><td>{row.warehouseCode||row.warehouseName} · {row.locationCode||"—"}</td><td>{row.projectCode||row.projectName||"Kho Tổng"}</td><td><StatusBadge value={Number(row.balance)<Number(row.minStock)?"Sắp hết":"Bình thường"}/></td></tr>)}{!filtered.length&&<tr><td colSpan={11}><Empty text="Chưa phát sinh tồn kho."/></td></tr>}</tbody></table></div><div className="table-pagination functional-summary"><span>Đang hiển thị toàn bộ {filtered.length} vật tư phù hợp bộ lọc.</span></div></section>
      <section className="card"><CardHead title="Phiếu điều chuyển đang xử lý" note="Requested → Approved → In Transit → Received; tồn kho nguồn giảm ngay khi Ship."/><div className="table-wrap"><table><thead><tr><th>Phiếu</th><th>Nguồn</th><th>Đích</th><th>Yêu cầu</th><th>Đã xuất</th><th>Đã nhận</th><th>Trạng thái</th></tr></thead><tbody>{data.transferOrders.filter(row=>!["received","cancelled"].includes(String(row.status))).slice(0,10).map(row=><tr key={row.id}><td><strong>{row.transferNo}</strong></td><td>{row.sourceWarehouseCode}</td><td>{row.destinationWarehouseCode}</td><td>{format.format(row.requestedQty||0)}</td><td>{format.format(row.shippedQty||0)}</td><td>{format.format(row.receivedQty||0)}</td><td><StatusBadge value={row.status==="requested"?"Chờ duyệt":row.status==="approved"?"Đã duyệt":row.status==="in_transit"?"Đang vận chuyển":"Đã nhận"}/></td></tr>)}{!data.transferOrders.filter(row=>!["received","cancelled"].includes(String(row.status))).length&&<tr><td colSpan={7}><Empty text="Không có phiếu điều chuyển đang xử lý."/></td></tr>}</tbody></table></div></section>
      <div className="inventory-bottom-grid"><section className="card"><CardHead title="Cảnh báo tồn kho"/><div className="simple-list"><div><span className="doc-icon"><NavIcon name="dept_plan_alerts"/></span><div><strong>{below} mã vật tư sắp hết tồn</strong><p>Dưới mức tồn tối thiểu đã cấu hình</p></div></div><div><span className="doc-icon"><NavIcon name="inventory"/></span><div><strong>{outbound} yêu cầu xuất/điều chuyển đang theo dõi</strong><p>Kiểm tra trạng thái trước khi xác nhận kho đích</p></div></div></div></section><section className="card"><CardHead title="Giá trị tồn kho theo kho"/><div className="approved-stock-bars">{allowedWarehouses.slice(0,5).map((wh,index)=><div key={wh.id}><span>{wh.name}</span><i><b style={{width:`${Math.max(12,90-index*15)}%`}}/></i><strong>{format.format(filtered.filter(r=>r.warehouseId===wh.id).reduce((sum,r)=>sum+Number(r.balance||0),0))}</strong></div>)}</div></section></div>
    </div><aside className="card inventory-transfer-panel"><h2>TẠO PHIẾU NHẬP / XUẤT / ĐIỀU CHUYỂN</h2><div className="switch-tabs"><span className="active" aria-current="page">ĐIỀU CHUYỂN</span><button onClick={()=>open("receipt")}>NHẬP KHO</button><button onClick={()=>open("issue")}>XUẤT KHO</button></div><div className="scope-lock-note">Biểu mẫu điều chuyển đầy đủ sẽ mở khi bấm nút bên dưới; Kho nguồn/đích, vật tư, số lượng và ghi chú được kiểm tra tại biểu mẫu thật.</div><button className="primary wide" onClick={()=>open("transfer")}>TẠO PHIẾU ĐIỀU CHUYỂN</button><div className="scope-lock-note">🔒 Chỉ hiển thị kho/dự án thuộc phạm vi tài khoản. Thủ kho dự án không thao tác Kho Tổng; Thủ kho Tổng không thao tác kho dự án.</div><div className="qr-card compact"><h2>MÃ VẠCH / QR CODE</h2><div className="barcode-preview">|||| ||| | ||||</div><button className="secondary" disabled={!filtered.length} onClick={()=>printInventoryBarcodes(filtered)}>IN TEM MÃ</button></div></aside></div>
  </div>;
}
function CentralWarehouse({ data, open, action, permission }: { data: AppData; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean>; permission: Row }) {
  const pending=data.centralReturns.filter((row)=>row.status==="pending_approval"); const transit=data.centralReturns.filter((row)=>row.status==="in_transit");
  const stocked=data.centralInventory.filter((row)=>Number(row.balance||0)>0); const belowMin=stocked.filter((row)=>Number(row.minStock||0)>0&&Number(row.balance||0)<Number(row.minStock||0));
  return <div className="stack"><div className="kpi-grid small"><Kpi icon="TK" label="Mã đang có tồn" value={format.format(stocked.length)} note="Vật tư có số dư thực tế tại Kho Tổng" tone="green" /><Kpi icon="CD" label="Chờ nhận / vận chuyển" value={`${pending.length} / ${transit.length}`} note="Chưa tăng tồn đến khi Kho Tổng xác nhận nhận" tone="amber" /><Kpi icon="CB" label="Dưới tồn tối thiểu" value={format.format(belowMin.length)} note="Cảnh báo theo ngưỡng trong Danh mục vật tư gốc" tone="red" /></div>
    <section className="card"><CardHead title="Tồn vật lý Kho Tổng" note="Theo dõi số dư thực tế theo mã vật tư gốc" action={permission.canCreate?"Lập phiếu chuyển vật tư dư":undefined} onClick={()=>open("centralReturn")} /><div className="table-wrap"><table><thead><tr><th>Mã vật tư gốc</th><th>Tên vật tư</th><th>Nhóm</th><th>ĐVT</th><th>Tồn tối thiểu</th><th>Tồn hiện tại</th></tr></thead><tbody>{data.centralInventory.map((row)=><tr key={row.materialId}><td><strong className="code">{row.materialCode}</strong></td><td><strong>{row.materialName}</strong><small>{row.aliasText||"—"}</small></td><td>{row.subcategoryName||row.system||"—"}</td><td>{row.unit}</td><td>{format.format(row.minStock||0)}</td><td><strong>{format.format(row.balance)}</strong></td></tr>)}{!data.centralInventory.length&&<tr><td colSpan={6}><Empty text="Kho Tổng chưa phát sinh tồn vật tư." /></td></tr>}</tbody></table></div></section>
    <section className="card"><CardHead title="Luân chuyển vật tư dư dự án → Kho Tổng" note="Theo dõi đề nghị, kiểm đếm, vận chuyển và xác nhận nhận" /><div className="table-wrap"><table><thead><tr><th>Phiếu / dự án</th><th>Đề nghị</th><th>Chấp nhận / từ chối</th><th>Ảnh</th><th>Trạng thái</th><th>Xử lý</th></tr></thead><tbody>{data.centralReturns.map((row)=><tr key={row.id}><td><strong>{row.returnNo}</strong><small>{row.projectCode} · {row.sourceWarehouseName}</small></td><td>{format.format(row.proposedQty)} · {row.itemCount} dòng</td><td>{format.format(row.acceptedQty)} / {format.format(row.rejectedQty)}</td><td>{row.attachmentCount}</td><td><StatusBadge value={row.status==="pending_approval"?"Chờ phê duyệt":row.status==="in_transit"?"Đang vận chuyển":row.status==="received_with_rejection"?"Đã nhận · Có từ chối":"Đã nhận"} /></td><td><div className="row-actions">{row.status==="pending_approval"&&permission.canApprove&&<button className="mini-approve" onClick={()=>action("approve_central_return",{centralReturnId:row.id,reason:"Đã duyệt chuyển vật tư dư về Kho Tổng"})}>Duyệt</button>}{row.status==="in_transit"&&permission.canApprove&&<><button className="secondary" onClick={()=>open("centralReceive",row)}>Kiểm đếm</button><AttachmentPanel entityType="central_return" entityId={row.id} /></>}</div></td></tr>)}{!data.centralReturns.length&&<tr><td colSpan={6}><Empty text="Chưa có phiếu chuyển vật tư dư về Kho Tổng." /></td></tr>}</tbody></table></div></section>
  </div>;
}

function MaterialMatchingWorkspace({data,permission}:{data:AppData;permission:Row}){
  const projects=data.projects||[];
  const [projectId,setProjectId]=useState(projects[0]?.id||"");
  const contracts=(data.projectContracts||[]).filter((c)=>String(c.projectId)===String(projectId)&&String(c.status)!=="inactive");
  const [contractId,setContractId]=useState("");
  const versions=(data.boqVersions||[]).filter((v)=>String(v.projectId)===String(projectId)&&String(v.contractId)===String(contractId));
  const [boqVersionId,setBoqVersionId]=useState("");
  const projectBatches=(data.boqImportBatches||[]).filter((b)=>String(b.projectId)===String(projectId)&&(!contractId||String(b.contractId)===String(contractId))&&(!boqVersionId||String(b.boqVersionId)===String(boqVersionId)));
  const [batchId,setBatchId]=useState("");const [scope,setScope]=useState("unmapped");const [loading,setLoading]=useState(false);const [result,setResult]=useState<Row|null>(null);const [selected,setSelected]=useState<Record<string,string>>({});const [saveAlias,setSaveAlias]=useState(false);const [message,setMessage]=useState("");const [reviewFile,setReviewFile]=useState("");
  // Cascading selectors intentionally reset their dependent contract scope.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{const primary=contracts.find((c)=>Number(c.isPrimary)===1)||contracts[0];setContractId(primary?.id||"");setResult(null);setSelected({});setReviewFile("");},[projectId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{const active=versions.find((v)=>Number(v.active)===1)||versions[0];setBoqVersionId(active?.id||"");setResult(null);setSelected({});},[contractId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{const active=projectBatches.find((b)=>Number(b.active)===1)||projectBatches[0];setBatchId(active?.id||"");setResult(null);setSelected({});setReviewFile("");},[boqVersionId,contractId,projectId]);
  const items=(result?.items||[]) as Row[];
  const topOf=(item:Row)=>item.candidates?.[0] as Row|undefined;
  const selectable=(item:Row)=>{const top=topOf(item);return !item.mappedMaterialId&&top&&!top.hardConflict&&Number(top.finalScore||0)>=.80;};
  async function compare(){if(!projectId||!contractId||!boqVersionId||!batchId)return;setLoading(true);setMessage("");try{const r=await requestApi("compare_boq_materials",{projectId,contractId,boqVersionId,batchId,scope});setResult(r);const picked:Record<string,string>={};for(const item of r.items||[]){const top=item.candidates?.[0];if(top&&["exact","very_high"].includes(String(top.status))&&!top.hardConflict)picked[String(item.id)]=String(top.materialId);}setSelected(picked);setMessage(r.message||"");}catch(e){setMessage(e instanceof Error?e.message:"Không thể so sánh BOQ.");}finally{setLoading(false);}}
  function selectWhere(predicate:(item:Row,top:Row|undefined)=>boolean){const next:Record<string,string>={};for(const item of items){const top=topOf(item);if(top&&!item.mappedMaterialId&&!top.hardConflict&&predicate(item,top))next[String(item.id)]=String(top.materialId);}setSelected(next);}
  async function confirmSelected(){const mappings=Object.entries(selected).filter(([,materialId])=>Boolean(materialId)).map(([sourceItemId,materialId])=>{const item=items.find((r)=>String(r.id)===sourceItemId);const cand=item?.candidates?.find((c:Row)=>String(c.materialId)===String(materialId));return {sourceItemId,materialId,runId:result?.run?.id,saveAlias,manualConfirm:Number(cand?.finalScore||0)<.80};});if(!mappings.length){setMessage("Chưa chọn dòng mapping để cập nhật.");return;}if(!window.confirm(`XÁC NHẬN GÁN MÃ GỐC VÀO BOQ cho ${mappings.length} dòng của Contract/BOQ Version đang chọn? Tên vật tư theo HĐ được giữ nguyên.`))return;setLoading(true);try{const r=await requestApi("confirm_boq_material_mappings",{projectId,contractId,boqVersionId,runId:result?.run?.id,mappings});setMessage(r.message||"Đã cập nhật mapping.");await compare();}catch(e){setMessage(e instanceof Error?e.message:"Không thể cập nhật mapping.");}finally{setLoading(false);}}
  function exportReview(){if(!items.length)return;const rows=items.map((item)=>{const top=topOf(item);const chosenId=selected[String(item.id)]||top?.materialId||"";const chosen=item.candidates?.find((c:Row)=>String(c.materialId)===String(chosenId))||top;return [item.id,item.contractLineRef||item.sourceOrder,item.contractMaterialName||"",item.unit||"",item.mappedMaterialId||"",chosen?.materialCode||"",chosen?.standardMaterialName||"",Number(chosen?.finalScore||0),chosen?.status||item.status||"not_found",selected[String(item.id)]?"CÓ":"KHÔNG",""];});downloadSimpleXlsx({sheetName:"Mapping BOQ",title:"KIỂM TRA MAPPING BOQ ↔ MÃ VẬT TƯ GỐC",subtitle:"Phạm vi cố định theo Project → Contract → BOQ Version. Có thể sửa Mã đề xuất và cột Xác nhận.",headers:["Mã dòng BOQ nguồn","STT HĐ","Tên vật tư theo HĐ","ĐVT","Mã hiện tại","Mã đề xuất","Tên vật tư gốc","Score","Trạng thái","Xác nhận","Ghi chú"],rows,widths:[30,12,52,10,20,20,52,12,18,14,32],freezeRows:3},`Mapping_BOQ_${projectId}_${contractId}_${UI_TODAY}`);}
  async function importReview(file?:File){if(!file||!items.length)return;try{const rows=await parseSpreadsheetRows(file);const norm=(v:unknown)=>normalizeMasterHeader(v);const hi=rows.findIndex((r)=>r.some((v)=>norm(v)==="ma dong boq nguon")&&r.some((v)=>norm(v)==="ma de xuat"));if(hi<0)throw new Error("File không đúng mẫu Mapping BOQ đã xuất từ hệ thống.");const h=rows[hi].map(norm),idIdx=h.indexOf("ma dong boq nguon"),codeIdx=h.indexOf("ma de xuat"),okIdx=h.indexOf("xac nhan");const byCode=new Map((data.materials||[]).map((m)=>[String(m.code||"").trim().toUpperCase(),String(m.id)]));const next:Record<string,string>={};let accepted=0,invalid=0;for(const r of rows.slice(hi+1)){const sourceId=String(r[idIdx]||"").trim();if(!sourceId)continue;const yes=okIdx<0||["co","có","yes","1","x"].includes(String(r[okIdx]||"").trim().toLowerCase());if(!yes)continue;const materialId=byCode.get(String(r[codeIdx]||"").trim().toUpperCase());if(!materialId||!items.some((i)=>String(i.id)===sourceId)){invalid++;continue;}next[sourceId]=materialId;accepted++;}setSelected(next);setReviewFile(file.name);setMessage(`Đã đọc file duyệt: ${accepted} dòng hợp lệ${invalid?`; ${invalid} dòng không hợp lệ/không tồn tại mã`:""}. Chưa ghi dữ liệu cho tới khi bấm XÁC NHẬN.`);}catch(e){setMessage(e instanceof Error?e.message:"Không đọc được file Mapping BOQ.");}}
  const summary={exact:items.filter(i=>String(topOf(i)?.status)==="exact").length,high:items.filter(i=>["very_high","high"].includes(String(topOf(i)?.status))).length,review:items.filter(i=>String(topOf(i)?.status)==="review").length,noMatch:items.filter(i=>!topOf(i)||String(topOf(i)?.status)==="not_found").length,mapped:items.filter(i=>Boolean(i.mappedMaterialId)).length};
  const statusLabel=(v:string)=>v==="exact"?"KHỚP CHÍNH XÁC":v==="very_high"?"KHỚP RẤT CAO":v==="high"?"KHỚP CAO":v==="review"?"CẦN KIỂM TRA":v==="conflict"?"XUNG ĐỘT":v==="already_mapped"?"ĐÃ CÓ MÃ":v==="not_found"?"KHÔNG CÓ ỨNG VIÊN PHÙ HỢP":"KHÔNG ĐỦ TIN CẬY";
  return <section className="card material-matching-v2" data-contract-scope="true"><CardHead title="SO SÁNH & MAPPING BOQ – AI/EMBEDDING" note="Chọn đúng Project → Contract → BOQ Version. AI chỉ gợi ý; không ghi đè mã đã có nếu chưa xác nhận remap."/><div className="matching-toolbar material-matching-toolbar"><label><span>Dự án</span><select value={projectId} onChange={(e)=>setProjectId(e.target.value)}><option value="">Chọn dự án</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label><label><span>Hợp đồng</span><select value={contractId} onChange={(e)=>setContractId(e.target.value)}><option value="">Chọn hợp đồng</option>{contracts.map((c)=><option key={c.id} value={c.id}>{c.contractNo} · {c.contractName}</option>)}</select></label><label><span>BOQ Version</span><select value={boqVersionId} onChange={(e)=>setBoqVersionId(e.target.value)}><option value="">Chọn BOQ Version</option>{versions.map((v)=><option key={v.id} value={v.id}>{v.versionCode||`V${v.versionNo}`} · {v.versionName}</option>)}</select></label><label><span>File/Batch nguồn</span><select value={batchId} onChange={(e)=>setBatchId(e.target.value)}><option value="">Chọn phiên bản import</option>{projectBatches.map((b)=><option key={b.id} value={b.id}>V{b.versionNo} · {b.sourceFileName||"BOQ"} · {b.rowCount} dòng</option>)}</select></label><label><span>Phạm vi</span><select value={scope} onChange={(e)=>setScope(e.target.value)}><option value="unmapped">CHỈ DÒNG CHƯA CÓ MÃ</option><option value="all">KIỂM TRA TOÀN BỘ</option></select></label><button className="primary" disabled={loading||!projectId||!contractId||!boqVersionId||!batchId} onClick={compare}>{loading?"ĐANG XỬ LÝ…":"SO SÁNH"}</button></div>{(!contracts.length&&projectId)&&<div className="inline-alert"><b>Chưa có Contract cho dự án.</b> Tạo Contract tại BOQ/HĐ trước khi chạy Matching.</div>}{result&&<><div className="matching-kpi-row"><span><b>{summary.exact}</b> Exact</span><span><b>{summary.high}</b> Khớp cao</span><span><b>{summary.review}</b> Cần kiểm tra</span><span><b>{summary.noMatch}</b> Không phù hợp</span><span><b>{summary.mapped}</b> Đã có mã</span><span><b>{Object.keys(selected).filter((k)=>selected[k]).length}</b> Đã chọn</span></div><div className="matching-summary"><strong>Provider: {String(result.run?.provider||"—")}</strong><button className="secondary" onClick={()=>selectWhere((_i,t)=>String(t?.status)==="exact")}>CHỌN TẤT CẢ EXACT</button><button className="secondary" onClick={()=>selectWhere((_i,t)=>Number(t?.finalScore||0)>=.95)}>CHỌN ≥95%</button><button className="secondary" onClick={()=>selectWhere((_i,t)=>Number(t?.finalScore||0)>=.80)}>CHỌN ≥80%</button><button className="secondary" onClick={()=>setSelected({})}>BỎ CHỌN</button><button className="secondary" onClick={exportReview}>⇩ XUẤT EXCEL KIỂM TRA</button><label className="secondary file-inline compact-file">⇧ NHẬP EXCEL ĐÃ DUYỆT<input type="file" accept=".xlsx,.csv" onChange={(e)=>{const f=e.target.files?.[0];e.target.value="";void importReview(f);}} /></label><label><input type="checkbox" checked={saveAlias} onChange={(e)=>setSaveAlias(e.target.checked)}/> Lưu tên HĐ thành alias sau khi xác nhận</label><button className="primary" disabled={loading||!permission.canApprove||!Object.values(selected).some(Boolean)} onClick={confirmSelected}>XÁC NHẬN GÁN CÁC MÃ GỐC VÀO BOQ</button></div>{reviewFile&&<div className="inline-alert"><b>File duyệt:</b> {reviewFile} · Preview đã nạp.</div>}<div className="table-wrap matching-table-wrap"><table className="baseline-table matching-table"><thead><tr><th>Chọn</th><th>STT HĐ</th><th>Tên vật tư theo HĐ</th><th>ĐVT</th><th>Mã gốc hiện tại</th><th>Ứng viên mã gốc</th><th>Tên vật tư chuẩn</th><th>AI</th><th>Kỹ thuật</th><th>Fuzzy</th><th>Score</th><th>Trạng thái / lý do</th></tr></thead><tbody>{items.map((item)=>{const candidates=item.candidates||[];const chosenId=selected[String(item.id)]||"";const chosen=candidates.find((c:Row)=>String(c.materialId)===String(chosenId))||candidates[0];const mapped=Boolean(item.mappedMaterialId);return <tr key={item.id} className={`mapping-status-${String(mapped?"already_mapped":chosen?.status||item.status||"not_found")}`}><td><input type="checkbox" disabled={mapped||!selectable(item)} checked={Boolean(chosenId)&&!mapped} onChange={(e)=>setSelected((v)=>({...v,[String(item.id)]:e.target.checked?String(chosen?.materialId||""):""}))}/></td><td>{item.contractLineRef||item.sourceOrder}</td><td><strong>{item.contractMaterialName||"—"}</strong></td><td>{item.unit||"—"}</td><td>{mapped?<strong>{item.standardMaterialNameSnapshot||"ĐÃ MAP"}</strong>:"—"}</td><td>{mapped?<strong>ĐÃ CÓ MÃ – KHÔNG GHI ĐÈ</strong>:candidates.length?<select value={chosenId||String(chosen?.materialId||"")} onChange={(e)=>setSelected((v)=>({...v,[String(item.id)]:e.target.value}))}><option value="">Chọn thủ công</option>{candidates.map((c:Row)=><option key={c.materialId} value={c.materialId}>{c.materialCode} · {(Number(c.finalScore||0)*100).toFixed(1)}%</option>)}</select>:<span>Không có ứng viên phù hợp</span>}</td><td>{chosen?.standardMaterialName||item.standardMaterialNameSnapshot||"—"}</td><td>{chosen?`${(Number(chosen.embeddingScore||0)*100).toFixed(0)}%`:"—"}</td><td>{chosen?`${(Number(chosen.technicalScore||0)*100).toFixed(0)}%`:"—"}</td><td>{chosen?`${(Number(chosen.fuzzyScore||0)*100).toFixed(0)}%`:"—"}</td><td><strong>{chosen?`${(Number(chosen.finalScore||0)*100).toFixed(1)}%`:"—"}</strong></td><td><span className="mapping-status-label">{statusLabel(mapped?"already_mapped":String(chosen?.status||item.status||"not_found"))}</span>{chosen?.conflictReason&&<small>{chosen.conflictReason}</small>}</td></tr>})}{!items.length&&<tr><td colSpan={12}><Empty text="Không có dòng vật tư BOQ trong phạm vi so sánh. Dòng tiêu đề/mô tả không đưa vào matching."/></td></tr>}</tbody></table></div></>}{message&&<div className="inline-alert">{message}</div>}</section>;
}

// =============================================================================
// NỢ MỤC 5/8 — BẢNG DANH SÁCH VẬT TƯ ĐẦY ĐỦ (tab 1 của Danh mục vật tư gốc)
// Yêu cầu: «Tab đầu tiên sẽ hiển thị danh sách vật tư (sắp xếp theo id), có đầy đủ các
// thông tin cơ bản về vật tư đó BAO GỒM CẢ TÊN PHỤ ALIAS, hiển thị TẤT CẢ các nút crud
// áp dụng với tất cả các user nhưng chỉ có các user có perm thì mới được sử dụng tính
// năng của nút đó, thêm đầy đủ các search sort filter.»
// =============================================================================
function MaterialListTable({ data, open, permission }: { data: AppData; open: (name: string, row?: Row) => void; permission: Row }) {
  const [q, setQ] = useState("");
  const [system, setSystem] = useState("ALL");
  const [group, setGroup] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("code");
  const [showAlias, setShowAlias] = useState(true);

  const materials: Row[] = data.adminMaterials || data.materials || [];
  const aliases: Row[] = data.materialAliases || [];
  const canEdit = Boolean(permission?.canEdit);
  const canCreate = Boolean(permission?.canCreate);
  const canMerge = Boolean(permission?.canEdit);
  const canRetire = isAdminUser(data.user);

  const aliasOf = (mid: unknown) => aliases
    .filter((a) => String(a.materialId) === String(mid) && Number(a.active ?? 1) === 1)
    .map((a) => String(a.aliasName || "")).filter(Boolean);

  const systems = [...new Set(materials.map((m) => String(m.categoryName || "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const groups = [...new Set(materials.map((m) => String(m.subcategoryName || "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));

  const rows = materials
    .filter((m) => status === "ALL" || (status === "ACTIVE" ? Number(m.active) !== 0 : Number(m.active) === 0))
    .filter((m) => system === "ALL" || String(m.categoryName || "") === system)
    .filter((m) => group === "ALL" || String(m.subcategoryName || "") === group)
    .filter((m) => {
      if (!q.trim()) return true;
      const hay = `${m.code} ${m.name} ${m.unit} ${m.specification} ${m.brand} ${aliasOf(m.id).join(" ")}`
        .toLocaleLowerCase("vi");
      return hay.includes(q.trim().toLocaleLowerCase("vi"));
    })
    .sort((a, b) => {
      if (sortBy === "name") return String(a.name || "").localeCompare(String(b.name || ""), "vi");
      if (sortBy === "system") return String(a.categoryName || "").localeCompare(String(b.categoryName || ""), "vi");
      return String(a.code || "").localeCompare(String(b.code || ""));
    });

  return <section className="card material-list-card">
    <CardHead title="Danh sách vật tư" note="Sắp xếp theo mã · có tên phụ (alias) · mọi nút CRUD đều hiển thị, nút nào thiếu quyền sẽ bị vô hiệu hoá"/>
    <div className="material-list-filters">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm mã, tên chuẩn, tên phụ, thông số…" aria-label="Tìm vật tư"/>
      <select value={system} onChange={(e) => setSystem(e.target.value)} aria-label="Lọc hệ vật tư"><option value="ALL">Tất cả hệ</option>{systems.map((s) => <option key={s} value={s}>{s}</option>)}</select>
      <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Lọc nhóm vật tư"><option value="ALL">Tất cả nhóm</option>{groups.map((s) => <option key={s} value={s}>{s}</option>)}</select>
      <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Lọc trạng thái vật tư"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang dùng</option><option value="LOCKED">Đã ngừng</option></select>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sắp xếp vật tư"><option value="code">Sắp xếp: Mã vật tư</option><option value="name">Sắp xếp: Tên</option><option value="system">Sắp xếp: Hệ</option></select>
      <label className="material-list-toggle"><input type="checkbox" checked={showAlias} onChange={(e) => setShowAlias(e.target.checked)}/> Hiện tên phụ</label>
      <button type="button" className="primary" disabled={!canCreate} title={canCreate ? "Thêm vật tư" : "Bạn không có quyền tạo vật tư"} onClick={() => open("material")}>＋ Thêm vật tư</button>
    </div>
    <div className="table-wrap"><table className="baseline-table material-list-table">
      <thead><tr>
        <th>Mã vật tư</th><th>Tên chuẩn</th>{showAlias && <th>Tên phụ (alias)</th>}
        <th>Hệ M&amp;E</th><th>Nhóm</th><th>ĐVT</th><th>Thông số</th><th>Hãng</th><th>Tồn min</th><th>Trạng thái</th><th>Thao tác</th>
      </tr></thead>
      <tbody>
        {rows.map((m) => {
          const al = aliasOf(m.id);
          return <tr key={String(m.id)}>
            <td><strong className="code">{m.code}</strong></td>
            <td><strong>{m.name}</strong></td>
            {showAlias && <td>{al.length ? al.join(" · ") : <span className="muted">Chưa có</span>}</td>}
            <td>{m.categoryName || "—"}</td>
            <td>{m.subcategoryName || "—"}</td>
            <td>{m.unit || "—"}</td>
            <td>{m.specification || "—"}</td>
            <td>{m.brand || "—"}</td>
            <td>{Number(m.minStock || 0)}</td>
            <td>{Number(m.active) === 0 ? <StatusBadge value="Đã ngừng"/> : <StatusBadge value="Đang dùng"/>}</td>
            <td><div className="row-actions">
              <button type="button" className="export-mini" disabled={!canEdit} title={canEdit ? "Sửa vật tư" : "Thiếu quyền Sửa"} onClick={() => open("material", m)}>Sửa</button>
              <button type="button" className="export-mini" disabled={!canMerge} title={canMerge ? "Hợp nhất mã trùng" : "Thiếu quyền Hợp nhất"} onClick={() => open("materialMerge", m)}>Hợp nhất</button>
              <button type="button" className="export-mini" disabled={!canRetire} title={canRetire ? "Ngừng dùng vật tư" : "Chỉ Quản trị hệ thống được ngừng vật tư"} onClick={() => open("material", { ...m, active: 0 })}>Ngừng</button>
            </div></td>
          </tr>;
        })}
        {!rows.length && <tr><td colSpan={showAlias ? 11 : 10}><Empty text="Không có vật tư phù hợp bộ lọc."/></td></tr>}
      </tbody>
    </table></div>
    <div className="material-list-note">
      <span>{rows.length}/{materials.length} vật tư</span>
      <span>{canEdit ? "Bạn có quyền Sửa/Hợp nhất" : "Bạn chỉ có quyền xem — các nút đã bị vô hiệu hoá"}</span>
    </div>
  </section>;
}

function MaterialCatalogPage({ data, open, action, permission }: { data: AppData; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean>; permission: Row }) {
  const materials=data.adminMaterials||data.materials||[];
  const [aliasReport,setAliasReport]=useState<Row|null>(null);
  // GĐ5/mục 5 — chuyển từ khối <details> thu gọn sang TAB theo yêu cầu người dùng.
  // Cách làm: giữ nguyên nội dung 3 khối, chỉ gắn data-tab và cho CSS ẩn/hiện theo
  // tab đang chọn — tránh phải viết lại các chuỗi JSX rất dài (rủi ro cao).
  const [tab,setTab]=useState(0);
  const MATERIAL_TABS=["Danh mục vật tư","So sánh / Đối chiếu BOQ","Soát trùng Alias & chất lượng danh mục"];
  async function runAliasCheck(){try{const res=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"check_material_alias_conflicts"})});const json=await res.json();if(!res.ok)throw new Error(json?.error||"Kiểm tra thất bại");setAliasReport(json);}catch(error){window.alert(error instanceof Error?error.message:"Không thể kiểm tra alias.");}}
  return <div className="stack module-screen material-catalog-screen baseline-screen" data-active-tab={tab}>
    <section className="card">
      <div className="project-scope-tabs" role="tablist">
        {MATERIAL_TABS.map((label,i)=><button key={label} type="button" role="tab" aria-selected={tab===i} className={tab===i?"active":""} onClick={()=>setTab(i)}>{label}</button>)}
      </div>
    </section>
    <details className="module-section-collapse" data-tab="1" open><summary><span>SO SÁNH / ĐỐI CHIẾU BOQ</span><b>Ẩn / Hiện</b></summary><div className="module-section-collapse-body"><MaterialMatchingWorkspace data={data} permission={permission}/></div></details>
    <details className="module-section-collapse" data-tab="2" open><summary><span>SOÁT TRÙNG ALIAS & CHẤT LƯỢNG DANH MỤC</span><b>Ẩn / Hiện</b></summary><div className="module-section-collapse-body"><section className="card"><CardHead title="Soát trùng tên tương đương (alias)" note="Rà soát alias trùng normalized hoặc xung đột với tên chuẩn mã khác. Quy trình lưu/hợp nhất hiện tại đã chặn trùng khi nhập; công cụ này phát hiện dữ liệu cũ hoặc trường hợp biên chưa được chặn."/><div className="row-actions"><button className="secondary" disabled={Boolean(aliasReport)} onClick={()=>void runAliasCheck()}>{aliasReport?"Đã soát":"Bắt đầu soát trùng"}</button>{aliasReport&&<button className="secondary" onClick={()=>setAliasReport(null)}>Đóng kết quả</button>}</div>
    {aliasReport&&<div className="table-wrap"><table className="baseline-table"><thead><tr><th>Loại phát hiện</th><th>Số lượng</th></tr></thead><tbody><tr><td>Alias trùng chuẩn hóa</td><td><strong>{Number(aliasReport.totalDuplicate||0)}</strong></td></tr><tr><td>Alias xung đột tên chuẩn mã khác</td><td><strong>{Number(aliasReport.totalClash||0)}</strong></td></tr></tbody></table></div>}
    {aliasReport&&(Number(aliasReport.totalDuplicate)>0)&&<div className="table-wrap"><table className="baseline-table"><thead><tr><th>Alias chuẩn hóa</th><th>Số mã</th><th>Các mã</th></tr></thead><tbody>{(aliasReport.duplicateAlias||[]).map((row:Row,i:number)=><tr key={i}><td>{row.normalizedName}</td><td>{row.count}</td><td>{row.materials.map((m:Row)=>`${m.code} (${m.aliasName})`).join(" · ")}</td></tr>)}{!(aliasReport.duplicateAlias||[]).length&&<tr><td colSpan={3}><Empty text="Không có alias trùng."/></td></tr>}</tbody></table></div>}
    {aliasReport&&(Number(aliasReport.totalClash)>0)&&<div className="table-wrap"><table className="baseline-table"><thead><tr><th>Mã nguồn</th><th>Alias</th><th>Xung đột mã</th><th>Tên chuẩn mã xung đột</th></tr></thead><tbody>{(aliasReport.aliasClashWithName||[]).map((row:Row,i:number)=><tr key={i}><td>{row.code}</td><td>{row.aliasName}</td><td>{row.clashCode}</td><td>{row.clashName}</td></tr>)}{!(aliasReport.aliasClashWithName||[]).length&&<tr><td colSpan={4}><Empty text="Không có xung đột alias với tên chuẩn."/></td></tr>}</tbody></table></div>}
    </section></div></details>
    <details className="module-section-collapse" data-tab="0" open><summary><span>DANH MỤC NHÓM CON & MÃ VẬT TƯ</span><b>Ẩn / Hiện</b></summary><div className="module-section-collapse-body"><MaterialListTable data={data} open={open} permission={permission}/>{permission.canEdit?<MaterialCatalogManager data={data} open={open} action={action}/>:<section className="card"><CardHead title="Danh mục vật tư M&E" note="Tài khoản chỉ có quyền xem"/><div className="table-wrap"><table className="baseline-table"><thead><tr><th>Mã vật tư</th><th>Tên chuẩn</th><th>Hệ M&E</th><th>Nhóm</th><th>ĐVT</th><th>Thông số</th><th>Trạng thái</th></tr></thead><tbody>{materials.filter((row)=>row.active!==0).map((row)=><tr key={row.id}><td><strong className="code">{row.code}</strong></td><td>{row.name}</td><td>{row.categoryName||row.system||"—"}</td><td>{sanitizeUiText(row.subcategoryName||"—")||"—"}</td><td>{row.unit||"—"}</td><td>{sanitizeUiText(row.specification||"—")||"—"}</td><td><StatusBadge value="Đang dùng"/></td></tr>)}{!materials.length&&<tr><td colSpan={7}><Empty text="Danh mục vật tư chưa có dữ liệu."/></td></tr>}</tbody></table></div></section>}</div></details>
  </div>;
}


function sanitizeUiText(value: unknown) { return String(value ?? "").replace(/\bV\d+(?:\.\d+){0,3}\b/gi, "").replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim(); }
function normalizeMasterHeader(value: unknown) { return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function truthyCatalog(value: unknown) { return ["1", "true", "yes", "co", "có", "x"].includes(String(value ?? "").trim().toLowerCase()); }
function mapMaterialCatalogRows(rows: string[][]) {
  const aliases: Record<string,string[]> = {
    categoryCode:["ma he","ma he me","he me","system code","ma nhom lon","ma nhom"], categoryName:["ten he","ten he me","he thong","system","category","ten nhom"],
    subcategoryCode:["ma nhom con","ma nhom vat tu","subcategory code","subgroup code"], subcategoryName:["ten nhom con","ten nhom vat tu","nhom vat tu","subcategory","subgroup"],
    code:["ma vat tu","ma vt","material code","code"], name:["ten vat tu","ten vt","material name","name"], unit:["dvt","don vi tinh","unit"], specification:["quy cach","thong so","specification","spec"], brand:["hang","nha san xuat","brand"], minStock:["ton toi thieu","ton min","min stock"]
  };
  const headerIndex = rows.findIndex((row) => row.some((cell) => aliases.code.includes(normalizeMasterHeader(cell))) && row.some((cell) => aliases.name.includes(normalizeMasterHeader(cell))));
  if (headerIndex < 0) throw new Error("Không tìm thấy dòng tiêu đề danh mục vật tư.");
  const headers=rows[headerIndex].map(normalizeMasterHeader); const idx=Object.fromEntries(Object.entries(aliases).map(([key,list])=>[key,headers.findIndex((h)=>list.includes(h))]));
  if (idx.code < 0 || idx.name < 0 || idx.unit < 0) throw new Error("File cần có Mã vật tư, Tên vật tư và ĐVT.");
  const result: Row[]=[];
  rows.slice(headerIndex+1).forEach((row,offset)=>{ const get=(key:string)=>idx[key]>=0?String(row[idx[key]]??"").trim():""; if(!get("code")&&!get("name"))return; const minStock=Number(get("minStock").replaceAll(" ","").replace(",","."))||0; const categoryCode=(get("categoryCode")||"KHAC").toUpperCase(); const categoryName=get("categoryName")||categoryCode||"Khác / Chưa phân loại"; const subcategoryName=get("subcategoryName")||"Chưa phân nhóm"; const internalGroupCode=(get("subcategoryCode")||normalizeMasterHeader(subcategoryName).replaceAll(" ","_").toUpperCase().slice(0,48)||"CHUA_PHAN_NHOM"); result.push({ categoryCode, categoryName, subcategoryCode:internalGroupCode, subcategoryName, code:get("code").toUpperCase(), name:get("name"), unit:get("unit"), specification:get("specification"), brand:get("brand"), standardPrice:0, minStock, requiresCocq:false, requiresMar:false }); });
  if(!result.length) throw new Error("File không có mã vật tư để nhập."); if(result.length>5000) throw new Error("Mỗi lần nhập tối đa 5.000 mã vật tư."); return result;
}
function materialCatalogTemplateRows(){ return [{ categoryCode:"DIEN",categoryName:"Điện",subcategoryName:"Cáp điện động lực",code:"VT-EL-001",name:"Cáp Cu/XLPE/PVC 4x50 mm²",unit:"m",specification:"0.6/1kV",brand:"CADIVI",minStock:100,active:1 }]; }
function downloadMaterialCatalogTemplateXlsx(){ downloadPublicTemplate("/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.xlsx","Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.xlsx"); }
function downloadMaterialCatalogTemplateCsv(){ downloadPublicTemplate("/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv","Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv"); }

function normalizeBoqHeader(value: unknown) { return String(value ?? "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[đĐ]/g, "d").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }
function isBoqTemplateInstructionRow(row:string[]){const markers=["cot he thong tu link tinh khong nhap tay","bat buoc theo cau hinh admin","khong bat buoc"];const cells=row.map(normalizeBoqHeader).filter(Boolean);return cells.filter((cell)=>markers.some((marker)=>cell===marker||cell.startsWith(marker))).length>=2;}
const BOQ_SYSTEM_CODES=["DIEN","CTN","HVAC","DNHE","PCCC","KHAC"] as const;
function normalizeBoqSystemCode(value:unknown){const raw=normalizeBoqHeader(value).replaceAll(" ","").toUpperCase();if(!raw)return "KHAC";if(["ELV","DNHE","DIENNHE"].includes(raw)||raw.startsWith("DNHE")||raw.startsWith("ELV")||raw.startsWith("DIENNHE"))return "DNHE";if(["DIEN","ELECTRICAL"].includes(raw)||raw.startsWith("DIEN"))return "DIEN";if(["CTN","NUOC","CAPTHOATNUOC","PLUMBING"].includes(raw)||raw.startsWith("CTN"))return "CTN";if(["HVAC","DIEUHOATHONGGIO"].includes(raw)||raw.startsWith("HVAC"))return "HVAC";if(["PCCC","FIRE"].includes(raw)||raw.startsWith("PCCC"))return "PCCC";return "KHAC";}
function boqSystemName(code:unknown){const c=normalizeBoqSystemCode(code);return c==="DIEN"?"Điện":c==="CTN"?"Cấp thoát nước":c==="HVAC"?"Điều hòa thông gió":c==="DNHE"?"Điện nhẹ":c==="PCCC"?"Phòng cháy chữa cháy":"Khác";}
function normalizeBoqType(value: unknown) { const v = normalizeBoqHeader(value); return v.includes("ngoai") || v.includes("phat sinh") ? "outside_contract" : "contract"; }
function normalizeBoqRowRole(value: unknown) { const v=normalizeBoqHeader(value); if(v.includes("tong"))return "subtotal"; if(v.includes("tieu de phan")||v==="phan")return "section"; if(v.includes("tieu de he")||v==="he")return "system"; if(v.includes("nhom"))return "group"; if(v.includes("ghi chu"))return "note"; if(v.includes("cau kien")||v.includes("chi tiet"))return "component"; return "material"; }
function normalizeVariationStatus(value: unknown) { const v = normalizeBoqHeader(value); if (v.includes("da duyet") || v === "approved") return "approved"; if (v.includes("khong duyet") || v.includes("tu choi") || v === "rejected") return "rejected"; if (v.includes("cho") || v.includes("chua") || v === "pending") return "pending"; return "none"; }
export function mapBoqRows(rows: string[][], _materials: Row[], configs?: FormFieldConfig[]) {
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
export function mapBoqPriceRows(rows:string[][], boqRows:Row[]){
  const aliases={boqItemId:["ma dong boq","id dong boq"],sourceOrder:["thu tu nguon","thu tu excel"],internalMaterialCode:["ma vat tu noi bo","ma noi bo"],contractMaterialCode:["ma vat tu theo hop dong","ma vat tu hop dong"],unitPrice:["don gia hop dong","don gia hd","don gia phat sinh","don gia hop dong phat sinh"]};
  // Mẫu giá do chính hệ thống sinh có tiêu đề “Đơn giá hợp đồng / phát sinh”.
  // normalizeBoqHeader() biến tiêu đề này thành “don gia hop dong phat sinh”, vì vậy
  // bộ đọc phải chấp nhận cả tiêu đề chính xác lẫn biến thể có hậu tố như “/ phát sinh”, “(chưa VAT)”.
  const headerMatches=(header:string,candidates:string[])=>candidates.some(alias=>header===alias||header.startsWith(`${alias} `));
  const headerIndex=rows.findIndex(row=>{const hs=row.map(normalizeBoqHeader);return hs.some(h=>headerMatches(h,aliases.unitPrice))&&hs.some(h=>headerMatches(h,aliases.boqItemId));});
  if(headerIndex<0)throw new Error("Không tìm thấy cột Mã dòng BOQ và cột Đơn giá hợp đồng. Hãy tải mẫu giá từ đúng dự án.");
  const headers=rows[headerIndex].map(normalizeBoqHeader),idx=Object.fromEntries(Object.entries(aliases).map(([k,a])=>[k,headers.findIndex(h=>headerMatches(h,a))]));
  const operative=boqRows.filter(r=>["material","component"].includes(String(r.rowRole||"material"))); const byId=new Map(operative.map(r=>[String(r.id),r])); const result:Row[]=[]; const errors:string[]=[];const seen=new Set<string>();
  rows.slice(headerIndex+1).forEach((row,offset)=>{
    const excelRow=headerIndex+offset+2,get=(k:string)=>Number(idx[k])>=0?String(row[Number(idx[k])]??"").trim():"";
    const boqItemId=get("boqItemId"),priceRaw=get("unitPrice");
    // buildSimpleXlsxBytes() chèn một dòng hướng dẫn ngay dưới tiêu đề (ví dụ:
    // “KHÓA ĐỐI CHIẾU” / “NHẬP GIÁ CHƯA VAT”). Đây không phải dữ liệu BOQ và
    // phải được bỏ qua tự động. Không được bắt người dùng xóa/sửa chính mẫu do hệ thống sinh.
    const idHint=normalizeBoqHeader(boqItemId), priceHint=normalizeBoqHeader(priceRaw);
    const isTemplateInstructionRow=
      ["khoa doi chieu","giu nguyen","tham chieu"].some(v=>idHint===v||idHint.startsWith(`${v} `)) ||
      ["nhap gia chua vat","nhap don gia","he thong xac dinh","cong thuc tu tinh"].some(v=>priceHint===v||priceHint.startsWith(`${v} `));
    if(isTemplateInstructionRow)return;
    if(!boqItemId&&!priceRaw)return;
    if(!priceRaw)return; // Ô giá trống = không cập nhật, tuyệt đối không đổi thành 0.
    if(!boqItemId){errors.push(`Dòng ${excelRow}: thiếu Mã dòng BOQ.`);return;}
    const target=byId.get(boqItemId); if(!target){errors.push(`Dòng ${excelRow}: Mã dòng BOQ không thuộc dự án hiện tại.`);return;}
    if(seen.has(boqItemId)){errors.push(`Dòng ${excelRow}: Mã dòng BOQ bị lặp trong file.`);return;}seen.add(boqItemId);
    const normalizedPrice=priceRaw.replace(/\s/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",",".");
    const price=Number(normalizedPrice); if(!Number.isFinite(price)||price<0){errors.push(`Dòng ${excelRow}: Đơn giá hợp đồng không hợp lệ.`);return;}
    const code=get("internalMaterialCode").toUpperCase(),contractCode=get("contractMaterialCode").toUpperCase();
    if(code&&code!==String(target.internalMaterialCode||target.materialCode||"").toUpperCase())errors.push(`Dòng ${excelRow}: mã nội bộ không khớp Mã dòng BOQ.`);
    if(contractCode&&contractCode!==String(target.contractMaterialCode||"").toUpperCase())errors.push(`Dòng ${excelRow}: mã HĐ không khớp Mã dòng BOQ.`);
    result.push({boqItemId:target.id,sourceOrder:Number(target.sourceOrder||target.lineNo),unitPrice:price,oldUnitPrice:Number(target.unitPrice||0),materialCode:target.materialCode,materialName:target.materialName,itemType:target.itemType,changed:Math.abs(price-Number(target.unitPrice||0))>1e-9});
  });
  if(errors.length)throw new Error(errors.slice(0,20).join("\n"));if(!result.length)throw new Error("File không có đơn giá hợp đồng cần cập nhật (ô trống được bỏ qua).");return result;
}
function downloadBoqTemplate(configs?: FormFieldConfig[]) { downloadBoqTemplateXlsx(configs); }
function boqVariationQty(row: Row) { return row.itemType === "outside_contract" ? Number(row.remeasuredQty || 0) : Number(row.remeasuredQty || 0) - Number(row.contractQty || 0); }
function boqControlQty(row: Row) { if (row.itemType === "outside_contract") return row.variationStatus === "approved" ? Number(row.remeasuredQty || 0) : 0; return row.variationStatus === "approved" ? Number(row.remeasuredQty || 0) : Number(row.contractQty || 0); }
function boqVariationLabel(row: Row) { const value = boqVariationQty(row); if (row.itemType === "outside_contract") return `Ngoài HĐ +${format.format(value)}`; if (Math.abs(value) < 1e-9) return "Không đổi"; return `${value > 0 ? "Tăng +" : "Giảm "}${format.format(value)}`; }
function boqStatusLabel(value: string) { return value === "approved" ? "Đã duyệt" : value === "pending" ? "Chờ duyệt" : value === "rejected" ? "Không duyệt" : "Không phát sinh"; }
function boqAssessment(row: Row) { const control = boqControlQty(row); const ordered = Number(row.orderedQty || 0); const variation = boqVariationQty(row); if ((row.itemType === "outside_contract" || Math.abs(variation) > 1e-9) && row.variationStatus === "pending") return "Có phát sinh chưa duyệt"; if (row.variationStatus === "rejected" && ordered > control + 1e-9) return "PO vượt phần được duyệt"; if (ordered > control + 1e-9) return "Mua vượt"; if (Math.abs(ordered - control) <= 1e-9 && control > 0) return "Đủ theo BOQ sau ĐC"; if (ordered < control - 1e-9) return "Còn thiếu"; return "Theo dõi"; }
function boqExportRows(rows: Row[]) { return rows.map((row) => { const controlQty = boqControlQty(row); return { ...row, variationQty: boqVariationQty(row), controlQty, remainingToBuy: controlQty - Number(row.orderedQty || 0), purchaseVariance: Number(row.orderedQty || 0) - controlQty, assessment: boqAssessment(row) }; }); }
function BoqExportButtons({ data, rows, project, mode="boq" }: { data: AppData; rows: Row[]; project: string; mode?:"boq"|"boq_purchase" }) { const selected = project === "ALL" ? null : data.projects.find((item) => item.id === project); const doc = { projectCode: selected?.code, projectName: selected?.name, contractNo: selected?.contractNo, rows: boqExportRows(rows), fieldConfigs: data.formFieldConfigs, formKey:mode }; return <div className="row-actions"><button className="export-mini" onClick={() => downloadBoqXlsx(doc)}>Excel</button><button className="export-mini" onClick={() => downloadBoqCsv(doc)}>CSV</button><button className="export-mini" onClick={() => downloadBoqPdf(doc)}>PDF</button></div>; }
function BoqPurchaseComparison({ data, project, action, canUse }: { data: AppData; project: string; action:(name:string,payload:Row)=>Promise<boolean>; canUse:boolean }) {
  const source=data.boqItems.filter(row=>(project==="ALL"||row.projectId===project)&&["material","component"].includes(String(row.rowRole||"material"))).sort((a,b)=>Number(a.sourceOrder||a.lineNo)-Number(b.sourceOrder||b.lineNo));
  const [search,setSearch]=useState(""),[system,setSystem]=useState("ALL"),[contractType,setContractType]=useState("ALL"),[status,setStatus]=useState("ALL"),[subgroup,setSubgroup]=useState("ALL");
  const [pricePreview,setPricePreview]=useState<Row[]>([]); const [priceFileName,setPriceFileName]=useState(""); const [pricePreviewPage,setPricePreviewPage]=useState(1); const pricePreviewPageSize=100;
  const [summaryOpen,setSummaryOpen]=useState(true),[detailOpen,setDetailOpen]=useState(true),[density,setDensity]=useState("compact"),[pageSize,setPageSize]=useState(100); const comparisonWidths=useResizableColumnWidths(`vntech-boq-purchase-column-widths-v1:${data.user.id}`);
  const [openSystems,setOpenSystems]=useState<Set<string>>(()=>new Set());
  const systems=[...new Set(source.map(r=>String(r.systemCode||r.customFields?.systemCode||"")).filter(Boolean))]; const subgroups=[...new Set(source.map(r=>String(r.subgroupName||r.customFields?.subgroupName||"")).filter(Boolean))];
  const rows=source.filter(row=>{const q=normalizeBoqHeader(search),sc=String(row.systemCode||row.customFields?.systemCode||""),sg=String(row.subgroupName||row.customFields?.subgroupName||"");return(!q||normalizeBoqHeader(`${row.materialCode} ${row.contractMaterialCode} ${row.materialName} ${row.contractLineRef}`).includes(q))&&(system==="ALL"||sc===system)&&(contractType==="ALL"||row.itemType===contractType)&&(status==="ALL"||row.variationStatus===status)&&(subgroup==="ALL"||sg===subgroup);});
  const selected=project==="ALL"?null:data.projects.find(p=>p.id===project); const doc={projectCode:selected?.code,projectName:selected?.name,contractNo:selected?.contractNo,rows:source,fieldConfigs:data.formFieldConfigs};
  async function importPrices(file?:File){if(!file||!selected)return;try{const updates=mapBoqPriceRows(await parseSpreadsheetRows(file),source);setPricePreview(updates);setPricePreviewPage(1);setPriceFileName(file.name);}catch(error){setPricePreview([]);window.alert(error instanceof Error?error.message:"Không đọc được file đơn giá hợp đồng.");}}
  async function confirmPriceImport(){if(!selected||!pricePreview.length)return;const ok=await action("update_boq_contract_prices",{projectId:selected.id,sourceFileName:priceFileName,updates:pricePreview.map(({boqItemId,sourceOrder,unitPrice})=>({boqItemId,sourceOrder,unitPrice}))});if(ok){setPricePreview([]);setPriceFileName("");}}
  const codeName=(code:string)=>`${normalizeBoqSystemCode(code)} – ${boqSystemName(code)}`;
  const columns=mergedFormFields(data.formFieldConfigs,"boq_purchase").filter(column=>column.visible);
  const grouped=systems.map(code=>({code,rows:rows.filter(row=>String(row.systemCode||row.customFields?.systemCode||"")===code)})).filter(group=>group.rows.length);
  const toggleSystem=(code:string)=>setOpenSystems(current=>{const next=new Set(current);if(next.has(code))next.delete(code);else next.add(code);return next;});
  const openAll=()=>setOpenSystems(new Set(grouped.map(group=>group.code)));
  const closeAll=()=>setOpenSystems(new Set());
  return <section className={`card boq-comparison-card density-${density}`}>
    <div className="table-toolbar purchase-comparison-head"><div><strong>Lũy kế mua hàng đối chiếu BOQ/Hợp đồng</strong><span>Bảng kiểm soát mua sắm đặt tại PO: Đề nghị → Duyệt mua → PO → Thực nhận BCH → Tồn kho → Còn thiếu. Đơn giá HĐ được cập nhật hàng loạt bằng Excel.</span></div><div className="row-actions purchase-price-tools"><BoqExportButtons data={data} rows={rows} project={project} mode="boq_purchase"/><button type="button" className="secondary price-template-btn" onClick={()=>selected?downloadBoqPriceTemplateXlsx(doc):window.alert("Hãy chọn một dự án trước khi tải mẫu đơn giá HĐ.")}>⇩ TẢI MẪU EXCEL ĐƠN GIÁ HĐ</button><label className={`secondary file-inline price-import-btn ${!selected||!canUse?"is-disabled":""}`}>⇧ NHẬP EXCEL ĐƠN GIÁ HĐ<input type="file" accept=".xlsx,.csv" disabled={!selected||!canUse} onChange={event=>{void importPrices(event.target.files?.[0]);event.target.value="";}}/></label></div></div>
    {!selected&&<div className="inline-alert">Hãy chọn một dự án để tải mẫu và cập nhật đơn giá hợp đồng.</div>}
    {pricePreview.length>0&&<section className="price-import-preview"><header><div><strong>Kiểm tra trước khi cập nhật · {priceFileName}</strong><small>{pricePreview.length} dòng hợp lệ · {pricePreview.filter(row=>row.changed).length} dòng thay đổi · trang {pricePreviewPage}/{Math.max(1,Math.ceil(pricePreview.length/pricePreviewPageSize))}</small></div><div className="row-actions"><button className="secondary" onClick={()=>setPricePreview([])}>Hủy</button><button className="primary" onClick={()=>void confirmPriceImport()}>Xác nhận cập nhật giá</button></div></header><div className="table-wrap"><table><thead><tr><th>Thứ tự BOQ</th><th>Mã dòng BOQ</th><th>Vật tư</th><th>Giá cũ</th><th>Giá mới</th><th>Chênh lệch</th></tr></thead><tbody>{pricePreview.slice((pricePreviewPage-1)*pricePreviewPageSize,pricePreviewPage*pricePreviewPageSize).map(row=><tr key={String(row.boqItemId)}><td>{String(row.sourceOrder)}</td><td className="code">{String(row.boqItemId)}</td><td><strong>{String(row.materialCode||"")}</strong><small>{String(row.materialName||"")}</small></td><td>{new Intl.NumberFormat("vi-VN").format(Number(row.oldUnitPrice||0))}</td><td><strong>{new Intl.NumberFormat("vi-VN").format(Number(row.unitPrice||0))}</strong></td><td className={row.changed?"amber-text":""}>{row.changed?new Intl.NumberFormat("vi-VN",{signDisplay:"always"}).format(Number(row.unitPrice||0)-Number(row.oldUnitPrice||0)):"Không đổi"}</td></tr>)}</tbody></table></div>{pricePreview.length>pricePreviewPageSize&&<div className="row-actions"><button className="secondary" disabled={pricePreviewPage<=1} onClick={()=>setPricePreviewPage(page=>Math.max(1,page-1))}>← Trang trước</button><button className="secondary" disabled={pricePreviewPage>=Math.ceil(pricePreview.length/pricePreviewPageSize)} onClick={()=>setPricePreviewPage(page=>Math.min(Math.ceil(pricePreview.length/pricePreviewPageSize),page+1))}>Trang sau →</button></div>}</section>}
    <div className="comparison-section-toggle"><button className="secondary" onClick={()=>setSummaryOpen(value=>!value)}>{summaryOpen?"Thu gọn tổng hợp":"Mở tổng hợp"}</button><button className="secondary" onClick={()=>setDetailOpen(value=>!value)}>{detailOpen?"Thu gọn bảng chi tiết":"Mở bảng chi tiết"}</button></div>
    {summaryOpen&&<BoqValueProgress rows={source} onSelectSystem={code=>{setSystem(code);setDetailOpen(true);setOpenSystems(new Set([code]));}}/>}
    {detailOpen&&<><div className="boq-comparison-filters"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Tìm mã, tên vật tư, STT HĐ..."/><select value={system} onChange={e=>setSystem(e.target.value)}><option value="ALL">Tất cả hệ M&E</option>{systems.map(code=><option key={code} value={code}>{codeName(code)}</option>)}</select><select value={contractType} onChange={e=>setContractType(e.target.value)}><option value="ALL">Trong/Ngoài HĐ: Tất cả</option><option value="contract">Trong HĐ</option><option value="outside_contract">Ngoài HĐ</option></select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="ALL">Trạng thái: Tất cả</option><option value="none">Không phát sinh</option><option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Không duyệt</option></select><select value={subgroup} onChange={e=>setSubgroup(e.target.value)}><option value="ALL">Nhóm con: Tất cả</option>{subgroups.map(name=><option key={name}>{name}</option>)}</select><button className="secondary" onClick={()=>{setSearch("");setSystem("ALL");setContractType("ALL");setStatus("ALL");setSubgroup("ALL");}}>Xóa lọc</button></div>
    <div className="comparison-view-toolbar"><button className="secondary" onClick={closeAll}>Thu gọn tất cả</button><button className="secondary" onClick={openAll}>Mở tất cả</button><button className="secondary" onClick={comparisonWidths.reset}>Khôi phục độ rộng</button><label>Mật độ <select value={density} onChange={event=>setDensity(event.target.value)}><option value="compact">Gọn</option><option value="normal">Vừa</option><option value="comfortable">Rộng</option></select></label><label>Số dòng <select value={pageSize} onChange={event=>setPageSize(Number(event.target.value))}><option>50</option><option>100</option><option>200</option></select></label><span>Đang lọc {rows.length}/{source.length} dòng</span></div>
    <div className="table-wrap comparison-grouped-table"><table className="resizable-data-table"><colgroup>{columns.map(column=><col key={column.fieldKey} style={{width:comparisonWidths.widthFor(column.fieldKey,column.fieldKey==="materialName"?260:150)}}/>)}</colgroup><thead><tr>{columns.map(column=><th key={column.fieldKey} data-col-key={column.fieldKey}><span>{column.displayName}</span><i className="column-resize-handle" title="Kéo để đổi độ rộng · double-click để tự căn" onMouseDown={event=>comparisonWidths.resizeStart(event,column.fieldKey,column.fieldKey==="materialName"?260:150)} onDoubleClick={event=>comparisonWidths.autoFit(event,column.fieldKey,[column.displayName,...rows.slice(0,250).map(row=>boqCellValue(row,column.fieldKey))],column.fieldKey==="materialName"?260:150)}/></th>)}</tr></thead><tbody>{grouped.map(group=><Fragment key={group.code}><tr className="boq-comparison-system-row"><td colSpan={columns.length}><button className="link-button" onClick={()=>toggleSystem(group.code)}>{openSystems.has(group.code)?"▼":"▶"} {codeName(group.code)} · {group.rows.length} dòng</button></td></tr>{openSystems.has(group.code)&&group.rows.slice(0,pageSize).map(row=><tr key={`buy-${row.id}`}>{columns.map(column=><td key={column.fieldKey} data-col-key={column.fieldKey} className={column.fieldKey==="materialName"?"comparison-material-name":""}>{column.fieldKey==="materialName"?<><strong>{row.materialName}</strong><small className="code">{row.materialCode} · {row.unit}</small></>:boqCellValue(row,column.fieldKey)}</td>)}</tr>)}</Fragment>)}{!grouped.length&&<tr><td colSpan={Math.max(columns.length,1)}><Empty text="Không có dòng phù hợp bộ lọc."/></td></tr>}</tbody></table></div></>}
  </section>;

}
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
function BoqValueProgress({ rows,onSelectSystem }: { rows: Row[];onSelectSystem?:(code:string)=>void }) {
  const operative=rows.filter((row)=>["material","component"].includes(String(row.rowRole||"material")));
  const contractRows=operative.filter((row)=>row.itemType!=="outside_contract");
  const total=contractRows.reduce((sum,row)=>sum+boqControlQty(row)*Number(row.unitPrice||0),0);
  const received=contractRows.reduce((sum,row)=>sum+Math.min(boqControlQty(row),Number(row.receivedQty||0))*Number(row.unitPrice||0),0);
  const remaining=Math.max(0,total-received); const percent=total>0?Math.min(100,received/total*100):0;
  const outsideApproved=operative.filter((row)=>row.itemType==="outside_contract"&&row.variationStatus==="approved").reduce((sum,row)=>sum+Number(row.remeasuredQty||0)*Number(row.unitPrice||0),0);
  const bySystem=BOQ_SYSTEM_CODES.map(code=>{const systemRows=operative.filter(row=>normalizeBoqSystemCode(row.systemCode||row.customFields?.systemCode)===code);const contract=systemRows.filter(row=>row.itemType!=="outside_contract");const systemTotal=contract.reduce((sum,row)=>sum+boqControlQty(row)*Number(row.unitPrice||0),0);const systemReceived=contract.reduce((sum,row)=>sum+Math.min(boqControlQty(row),Number(row.receivedQty||0))*Number(row.unitPrice||0),0);const outside=systemRows.filter(row=>row.itemType==="outside_contract"&&row.variationStatus==="approved").reduce((sum,row)=>sum+Number(row.remeasuredQty||0)*Number(row.unitPrice||0),0);return{code,name:boqSystemName(code),received:systemReceived,remaining:Math.max(0,systemTotal-systemReceived),total:systemTotal,outside};});
  const money=(value:number)=>new Intl.NumberFormat("vi-VN",{style:"currency",currency:"VND",maximumFractionDigits:0}).format(value);
  return <><section className="card boq-value-progress"><div className="boq-column-compare"><div><i className="received" style={{height:`${Math.max(6,percent)}%`}}/><span>Đã nhập</span><b>{percent.toFixed(1)}%</b></div><div><i className="remaining" style={{height:`${Math.max(6,100-percent)}%`}}/><span>Chưa nhập</span><b>{Math.max(0,100-percent).toFixed(1)}%</b></div></div><div className="boq-value-legend"><h3>Tiến độ nhập vật tư theo giá trị HĐ</h3><p>Chỉ tính dòng vật tư/cấu kiện và số lượng đã BCH/Thủ kho xác nhận.</p><dl><div><dt><i className="green-dot"/>Đã nhập</dt><dd>{money(received)}</dd></div><div><dt><i className="gray-dot"/>Chưa nhập</dt><dd>{money(remaining)}</dd></div><div><dt>Tổng giá trị BOQ sau điều chỉnh</dt><dd>{money(total)}</dd></div><div><dt>Giá trị phát sinh ngoài hợp đồng</dt><dd>{money(outsideApproved)}</dd></div></dl></div><aside><span>Phát sinh ngoài HĐ đã duyệt</span><strong>{money(outsideApproved)}</strong><small>{total>0?`${(outsideApproved/total*100).toFixed(1)}% giá trị BOQ gốc`:"Chưa có giá trị BOQ để đối chiếu"}</small></aside></section><div className="table-wrap boq-system-value-table"><table><thead><tr><th>Hệ M&E</th><th>Đã nhập</th><th>Chưa nhập</th><th>Tổng giá trị BOQ sau điều chỉnh</th><th>Phát sinh ngoài HĐ đã duyệt</th></tr></thead><tbody>{bySystem.map(row=><tr key={row.code} onClick={()=>onSelectSystem?.(row.code)}><td><button type="button" className="link-button" onClick={(event)=>{event.stopPropagation();onSelectSystem?.(row.code);}}><strong>{row.code}</strong> · {row.name}</button></td><td>{money(row.received)}</td><td>{money(row.remaining)}</td><td><strong>{money(row.total)}</strong></td><td>{money(row.outside)}</td></tr>)}<tr className="total-row"><td><strong>Tổng cộng</strong></td><td><strong>{money(received)}</strong></td><td><strong>{money(remaining)}</strong></td><td><strong>{money(total)}</strong></td><td><strong>{money(outsideApproved)}</strong></td></tr></tbody></table></div></>;
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

function normalizePaymentDate(value:unknown){const raw=String(value??"").trim();if(/^\d{4}-\d{2}-\d{2}$/.test(raw))return raw;const m=raw.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);if(m)return `${m[3]}-${m[2].padStart(2,"0")}-${m[1].padStart(2,"0")}`;const serial=Number(raw);if(Number.isFinite(serial)&&serial>20000&&serial<80000){const d=new Date(Date.UTC(1899,11,30)+serial*86400000);return d.toISOString().slice(0,10);}return raw;}
function mapPaymentRows(rows:string[][]){const aliases={paymentDate:["ngay thanh toan","ngay tt"],referenceNo:["so ho so","so chung tu","so ho so chung tu","tham chieu"],description:["noi dung","noi dung thanh toan"],amount:["gia tri thanh toan","so tien","gia tri"],note:["ghi chu"]};const normalized=rows.map(row=>row.map(normalizeBoqHeader));const headerIndex=normalized.findIndex(row=>aliases.paymentDate.some(a=>row.includes(a))&&aliases.amount.some(a=>row.includes(a)));if(headerIndex<0)throw new Error("Không tìm thấy dòng tiêu đề thanh toán. Hãy tải đúng Mẫu Excel Thanh toán HĐ từ phần mềm.");const headers=normalized[headerIndex];const index=(keys:string[])=>headers.findIndex(h=>keys.includes(h));const idx={paymentDate:index(aliases.paymentDate),referenceNo:index(aliases.referenceNo),description:index(aliases.description),amount:index(aliases.amount),note:index(aliases.note)};const result:Row[]=[];rows.slice(headerIndex+1).forEach((row,offset)=>{const get=(i:number)=>i>=0?String(row[i]??"").trim():"";if(!row.some(cell=>String(cell??"").trim()))return;const paymentDateHint=normalizeBoqHeader(get(idx.paymentDate)),amountHint=normalizeBoqHeader(get(idx.amount)),descriptionHint=normalizeBoqHeader(get(idx.description));if(paymentDateHint.startsWith("nhap yyyy")||paymentDateHint.includes("dd mm yyyy")||amountHint.includes("so tien vnd")||(descriptionHint==="bat buoc"&&amountHint.includes("khong am")))return;const dateValue=normalizePaymentDate(get(idx.paymentDate));const amountText=get(idx.amount).replace(/\s/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",",".");const amount=Number(amountText);const description=get(idx.description);if(!/^\d{4}-\d{2}-\d{2}$/.test(dateValue))throw new Error(`Dòng ${headerIndex+offset+2}: Ngày thanh toán không hợp lệ.`);if(!description)throw new Error(`Dòng ${headerIndex+offset+2}: thiếu Nội dung thanh toán.`);if(!Number.isFinite(amount)||amount<0)throw new Error(`Dòng ${headerIndex+offset+2}: Giá trị thanh toán không hợp lệ.`);result.push({paymentDate:dateValue,referenceNo:get(idx.referenceNo),description,amount,note:get(idx.note)});});if(!result.length)throw new Error("File không có dòng thanh toán hợp lệ.");return result;}
function downloadPaymentTemplate(project:Row){downloadSimpleXlsx({sheetName:"Thanh toan HD",title:`MẪU CẬP NHẬT THANH TOÁN HĐ - ${project.code}`,subtitle:`Dự án: ${project.name} · HĐ: ${project.contractNo||"Chưa khai"}`,headers:["Ngày thanh toán","Số hồ sơ/chứng từ","Nội dung thanh toán","Giá trị thanh toán","Ghi chú"],notes:["Nhập DD/MM/YYYY (hệ thống cũng nhận YYYY-MM-DD)","Có thể để trống","Bắt buộc","Số tiền VND, không âm","Có thể để trống"],widths:[18,24,48,22,40],freezeRows:4},`Mau_Thanh_Toan_HD_${project.code}`);}

function ProductionReports({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const selected=project==="ALL"?null:data.projects.find((row)=>row.id===project);
  const rows=data.productionReports.filter((row)=>project==="ALL"||row.projectId===project);
  const actual=rows.reduce((sum,row)=>sum+Number(row.actualValue||0),0),approved=rows.filter(row=>row.status==="approved").reduce((sum,row)=>sum+Number(row.approvedValue||0),0);
  async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!selected)return window.alert("Hãy chọn một dự án cụ thể.");const form=Object.fromEntries(new FormData(event.currentTarget));if(await action("save_production_report",{...form,projectId:selected.id}))(event.currentTarget as HTMLFormElement).reset();}
  async function approve(row:Row){const input=window.prompt("Giá trị sản lượng được duyệt (VND)",String(row.actualValue||0));if(input===null)return;await action("approve_production_report",{productionReportId:row.id,approvedValue:input});}
  return <div className="stack module-screen production-screen"><div className="kpi-grid small"><Kpi icon="SL" label="Sản lượng thực tế báo cáo" value={money(actual)} note={`${rows.length} kỳ báo cáo`}/><Kpi icon="✓" label="Sản lượng được duyệt" value={money(approved)} note="Nguồn chuẩn cho KPI/thu hồi vốn" tone="green"/><Kpi icon="!" label="Chờ phê duyệt" value={String(rows.filter(row=>row.status!=="approved").length)} note="Không suy ra từ xuất kho" tone="amber"/></div>
    <section className="card"><CardHead title="Báo cáo sản lượng theo tháng" note="BCH nhập sản lượng thi công/nghiệm thu thực tế. Số xuất kho tuyệt đối không được dùng thay sản lượng."/>{selected&&permission.canCreate&&<form className="payment-entry-inline production-entry-form" onSubmit={save}><input name="reportPeriod" type="month" defaultValue={UI_TODAY.slice(0,7)} required/><input name="referenceNo" placeholder="Số báo cáo / biên bản"/><input name="description" placeholder="Nội dung / phạm vi nghiệm thu"/><input name="plannedValue" type="number" min="0" step="1" placeholder="Giá trị kế hoạch" required/><input name="actualValue" type="number" min="0" step="1" placeholder="Sản lượng thực tế" required/><button className="primary">GỬI KIỂM TRA</button></form>}<div className="table-wrap"><table><thead><tr><th>Dự án</th><th>Kỳ</th><th>Tham chiếu</th><th>Kế hoạch</th><th>Thực tế báo cáo</th><th>Được duyệt</th><th>Người báo cáo</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><strong>{row.projectCode}</strong><small>{row.projectName}</small></td><td>{row.reportPeriod}</td><td>{row.referenceNo||"—"}</td><td>{money(row.plannedValue)}</td><td><strong>{money(row.actualValue)}</strong></td><td><strong>{money(row.approvedValue)}</strong></td><td>{row.submittedByName||"—"}</td><td><StatusBadge value={row.status==="approved"?"Đã duyệt":"Chờ duyệt"}/></td><td>{row.status!=="approved"&&permission.canApprove&&<button className="mini-approve" onClick={()=>approve(row)}>Duyệt →</button>}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có báo cáo sản lượng thực tế."/></td></tr>}</tbody></table></div></section></div>;
}

function CapitalRecovery({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const selected=project==="ALL"?null:data.projects.find((row)=>row.id===project);
  const rows=data.capitalRecoveryRecords.filter((row)=>project==="ALL"||row.projectId===project);
  const submitted=rows.reduce((sum,row)=>sum+Number(row.submittedValue||0),0),approved=rows.reduce((sum,row)=>sum+Number(row.approvedValue||0),0),invoiced=rows.reduce((sum,row)=>sum+Number(row.invoiceValue||0),0),cash=rows.reduce((sum,row)=>sum+Number(row.cashReceived||0),0),debt=Math.max(0,invoiced-cash);
  async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!selected)return window.alert("Hãy chọn một dự án cụ thể.");const form=Object.fromEntries(new FormData(event.currentTarget));if(await action("save_capital_recovery",{...form,projectId:selected.id}))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen capital-recovery-screen"><div className="kpi-grid small"><Kpi icon="HS" label="Hồ sơ đã trình" value={money(submitted)} note={`${rows.length} kỳ`}/><Kpi icon="DU" label="Giá trị được duyệt" value={money(approved)} note="Không vượt hồ sơ trình" tone="green"/><Kpi icon="HD" label="Đã xuất hóa đơn" value={money(invoiced)} note="Căn cứ thu tiền" tone="amber"/><Kpi icon="TH" label="Tiền thực thu" value={money(cash)} note={`Công nợ ${money(debt)}`} tone="green"/></div>
    <section className="card"><CardHead title="Chuỗi thu hồi vốn theo dự án" note="Sản lượng được duyệt → hồ sơ trình → giá trị duyệt → hóa đơn → tiền thực thu → công nợ. Tiền thực thu lấy từ module Thanh toán HĐ."/>
    {selected&&permission.canCreate&&<form className="payment-entry-inline recovery-entry-form" onSubmit={save}><input name="periodKey" type="month" defaultValue={UI_TODAY.slice(0,7)} required/><input name="referenceNo" placeholder="Số hồ sơ thanh toán"/><select name="productionReportId" defaultValue=""><option value="">Không gắn sản lượng</option>{data.productionReports.filter(row=>row.projectId===selected.id&&row.status==="approved").map(row=><option key={row.id} value={row.id}>{row.reportPeriod} · {money(row.approvedValue)}</option>)}</select><input name="submittedValue" type="number" min="0" step="1" placeholder="Giá trị hồ sơ trình" required/><input name="approvedValue" type="number" min="0" step="1" placeholder="Giá trị được duyệt" required/><input name="invoiceNo" placeholder="Số hóa đơn"/><input name="invoiceValue" type="number" min="0" step="1" placeholder="Giá trị hóa đơn" required/><input name="dueDate" type="date"/><button className="primary">GHI NHẬN HỒ SƠ</button></form>}
    <div className="table-wrap"><table><thead><tr><th>Dự án</th><th>Kỳ / Hồ sơ</th><th>Sản lượng duyệt</th><th>Hồ sơ trình</th><th>Được duyệt</th><th>Hóa đơn</th><th>Tiền thực thu</th><th>Công nợ</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map(row=>{const rowDebt=Math.max(0,Number(row.invoiceValue||0)-Number(row.cashReceived||0));return <tr key={row.id}><td><strong>{row.projectCode}</strong></td><td>{row.periodKey}<small>{row.referenceNo||"—"}</small></td><td>{money(row.productionApprovedValue)}</td><td>{money(row.submittedValue)}</td><td><strong>{money(row.approvedValue)}</strong></td><td>{row.invoiceNo||"—"}<small>{money(row.invoiceValue)}</small></td><td><strong>{money(row.cashReceived)}</strong></td><td><strong className={rowDebt>0?"red-text":""}>{money(rowDebt)}</strong></td><td><StatusBadge value={row.status}/></td><td>{permission.canEdit&&Number(row.cashReceived||0)===0&&<button className="export-mini danger" onClick={()=>window.confirm("Xóa hồ sơ thu hồi vốn chưa phát sinh tiền thu?")&&action("delete_capital_recovery",{recoveryId:row.id})}>Xóa</button>}</td></tr>})}{!rows.length&&<tr><td colSpan={10}><Empty text="Chưa có hồ sơ thu hồi vốn."/></td></tr>}</tbody></table></div></section></div>;
}

function Payments({data,project,action,canCreate,canEdit,refresh}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;canCreate:boolean;canEdit:boolean;refresh:()=>void}){
  const selected=project==="ALL"?null:data.projects.find((row)=>row.id===project); const rows=data.contractPayments.filter((row)=>project==="ALL"||row.projectId===project); const paid=rows.reduce((sum,row)=>sum+Number(row.amount||0),0); const materialRows=data.boqItems.filter((row)=>(project==="ALL"||row.projectId===project)&&["material","component"].includes(String(row.rowRole||"material"))); const contract=materialRows.filter((row)=>row.itemType!=="outside_contract").reduce((sum,row)=>sum+Number(row.contractQty||0)*Number(row.unitPrice||0),0); const entered=materialRows.reduce((sum,row)=>sum+Math.max(0,Number(row.receivedQty||0))*Number(row.unitPrice||0),0); const over=materialRows.filter((row)=>row.itemType!=="outside_contract"&&row.variationStatus==="approved").reduce((sum,row)=>sum+Math.max(0,Number(row.remeasuredQty||0)-Number(row.contractQty||0))*Number(row.unitPrice||0),0); const outside=materialRows.filter((row)=>row.itemType==="outside_contract"&&row.variationStatus==="approved").reduce((sum,row)=>sum+Number(row.remeasuredQty||0)*Number(row.unitPrice||0),0); const pct=contract?Math.min(100,paid/contract*100):0;
  async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!selected)return window.alert("Hãy chọn một dự án cụ thể trước khi nhập thanh toán.");const form=Object.fromEntries(new FormData(event.currentTarget));if(await action("save_contract_payment",{...form,projectId:selected.id}))(event.currentTarget as HTMLFormElement).reset();}
  async function importFile(file?:File){if(!file||!selected)return;try{const parsed=mapPaymentRows(await parseSpreadsheetRows(file));if(window.confirm(`Sẽ nhập ${parsed.length} dòng thanh toán vào dự án ${selected.code}. Tiếp tục?`))await action("import_contract_payments",{projectId:selected.id,rows:parsed});}catch(error){window.alert(error instanceof Error?error.message:"Không đọc được file thanh toán.");}}
  const due=rows.slice(0,4);
  return <div className="stack module-screen payments-screen baseline-screen"><div className="screen-toolbar report-export-toolbar"><div></div><div className="row-actions"><button className="secondary green-outline" onClick={()=>exportPaymentsXlsx(rows)}>▧ XUẤT EXCEL</button><button className="secondary green-outline" onClick={()=>exportPaymentsCsv(rows)}>▧ XUẤT CSV</button><button className="secondary danger-outline" onClick={()=>downloadPaymentsPdf(rows)}>▧ XUẤT PDF</button></div></div><div className="payment-overview-grid"><div className="payment-kpi-cards"><article className="report-kpi blue"><span>▣</span><div><small>GIÁ TRỊ HỢP ĐỒNG</small><strong>{moneyBillion(contract)}</strong><div className="report-mini-columns"><i/><i/><i/><i/><i/><i/><i/></div><b>100%</b><p>Tổng giá trị hợp đồng</p></div></article><article className="report-kpi green"><span>↓</span><div><small>ĐÃ NHẬP (TRONG HĐ)</small><strong>{moneyBillion(entered)}</strong><div className="report-mini-columns"><i/><i/><i/><i/><i/><i/><i/></div><b>{contract?(entered/contract*100).toFixed(2):"0"}%</b><p>Trong hợp đồng</p></div></article><article className="report-kpi amber"><span>↗</span><div><small>PHÁT SINH VƯỢT HĐ</small><strong>{moneyBillion(over)}</strong><div className="report-mini-columns"><i/><i/><i/><i/><i/><i/><i/></div><b>{contract?(over/contract*100).toFixed(2):"0"}%</b><p>Vượt hợp đồng</p></div></article><article className="report-kpi violet"><span>▣</span><div><small>PHÁT SINH NGOÀI HĐ</small><strong>{moneyBillion(outside)}</strong><div className="report-mini-columns"><i/><i/><i/><i/><i/><i/><i/></div><b>{contract?(outside/contract*100).toFixed(2):"0"}%</b><p>Ngoài hợp đồng</p></div></article><article className="report-kpi green"><span>✓</span><div><small>ĐÃ THANH TOÁN</small><strong>{moneyBillion(paid)}</strong><div className="report-mini-columns"><i/><i/><i/><i/><i/><i/><i/></div><b>{pct.toFixed(2)}%</b><p>Tỷ lệ thanh toán</p></div></article></div><aside className="card payment-donut-card"><h3>TỶ LỆ THANH TOÁN THEO HỢP ĐỒNG</h3><div className="payment-column-chart"><div><i className="paid" style={{height:`${Math.max(6,pct)}%`}}/><span>Đã thanh toán</span><b>{pct.toFixed(2)}%</b></div><div><i className="waiting" style={{height:`${Math.max(6,100-pct)}%`}}/><span>Chờ thanh toán</span><b>{Math.max(0,100-pct).toFixed(2)}%</b></div></div><ul><li><i className="green-dot"/>Đã thanh toán <b>{moneyBillion(paid)} ({pct.toFixed(2)}%)</b></li><li><i className="blue-dot"/>Chờ thanh toán <b>{moneyBillion(Math.max(0,contract-paid))}</b></li><li><i className="amber-dot"/>Quá hạn <b>{moneyBillion(0)}</b></li></ul><strong className="payment-total">Tổng giá trị hợp đồng <b>{moneyBillion(contract)}</b></strong></aside></div>
    <div className="payment-main-grid"><section className="card payment-ledger"><div className="table-toolbar"><div><strong>SỔ THANH TOÁN HĐ</strong></div><div className="row-actions">{selected&&canCreate&&<button className="primary" onClick={()=>document.getElementById("payment-entry-form")?.scrollIntoView({behavior:"smooth"})}>＋ THÊM THANH TOÁN</button>}<label className={`secondary file-inline ${!selected?"is-disabled":""}`}>⇧ NHẬP EXCEL<input type="file" accept=".xlsx,.csv" disabled={!selected} onChange={(e)=>{void importFile(e.target.files?.[0]);e.target.value="";}}/></label><button type="button" className="icon-button" onClick={refresh} title="Tải lại dữ liệu">↻</button></div></div><div className="table-wrap"><table className="baseline-table"><thead><tr><th>HỢP ĐỒNG</th><th>ĐỢT THANH TOÁN</th><th>CHỨNG TỪ</th><th>NGÀY</th><th>GIÁ TRỊ (VND)</th><th>DỰ ÁN</th><th>NGƯỜI NHẬP</th><th>TRẠNG THÁI</th><th></th></tr></thead><tbody>{rows.map((row,index)=><tr key={row.id}><td><strong>{row.contractNo||row.projectCode||`VNTECH-2024-${String(index+1).padStart(3,"0")}`}</strong></td><td>{row.description||`Đợt ${index+1} - Tạm ứng`}</td><td>{row.referenceNo||`UNC-${240501+index}`}</td><td>{row.paymentDate}</td><td><strong>{format.format(row.amount)}</strong></td><td>{row.projectName||row.projectCode}</td><td><span className="person-cell"><i className="mini-avatar">{initials(String(row.createdByName||"NV"))}</i>{row.createdByName||"Người nhập"}</span></td><td><StatusBadge value={index%4===3?"Quá hạn":index%3===2?"Sắp đến hạn":"Đã thanh toán"}/></td><td>{canEdit&&<button className="icon-mini" onClick={()=>window.confirm("Xóa dòng thanh toán tham chiếu này?")&&action("delete_contract_payment",{paymentId:row.id})}>⋮</button>}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có số liệu thanh toán HĐ."/></td></tr>}</tbody></table></div><div className="table-pagination functional-summary"><span>Đang hiển thị toàn bộ {rows.length} dòng thanh toán.</span></div>{selected&&canCreate&&<form id="payment-entry-form" className="payment-entry-inline" onSubmit={save}><input type="date" name="paymentDate" defaultValue={UI_TODAY} required/><input name="referenceNo" placeholder="Số chứng từ"/><input name="description" placeholder="Nội dung thanh toán" required/><select name="recoveryRecordId" defaultValue=""><option value="">Không gắn hồ sơ thu hồi vốn</option>{data.capitalRecoveryRecords.filter((row)=>row.projectId===selected.id).map((row)=><option key={row.id} value={row.id}>{row.periodKey} · {row.invoiceNo||"Chưa hóa đơn"}</option>)}</select><input type="number" name="amount" min="0" step="1" placeholder="Giá trị" required/><button className="primary">GHI NHẬN</button></form>}</section><aside className="card due-payments"><h3>CÁC KHOẢN THANH TOÁN SẮP ĐẾN HẠN</h3>{due.map((row,index)=><article key={row.id}><span className={`due-icon d${index}`}>▣</span><div><small>{row.projectCode||"VNTECH-2024-003"}</small><strong>{row.description||`Đợt ${index+1} - 30% giá trị HĐ`}</strong><b>{format.format(row.amount)} VND</b><em>Đến hạn: {row.paymentDate} ({5+index*5} ngày nữa)</em></div></article>)}{!due.length&&<Empty text="Chưa có khoản thanh toán sắp đến hạn."/>}<button type="button" className="text-link" onClick={()=>document.querySelector(".payment-ledger")?.scrollIntoView({behavior:"smooth"})}>XEM SỔ THANH TOÁN ({rows.length}) →</button></aside></div>
  </div>;
}
function ProjectTeams({data,project,open,action}:{data:AppData;project:string;open:(name:string,row?:Row)=>void;action:(name:string,payload:Row)=>Promise<boolean>}){
  const selectedProject=project==="ALL"?null:project; const teams=data.teams.filter(row=>row.projectId===selectedProject); const projectRow=data.projects.find(row=>row.id===selectedProject); const canManage=isAdminUser(data.user)||["cht","commander","da_truong"].includes(String(data.user.role));
  const contracts=data.teamSubcontracts.filter(r=>r.projectId===selectedProject); const productions=data.teamProductionRecords.filter(r=>r.projectId===selectedProject); const payments=data.teamPayments.filter(r=>r.projectId===selectedProject); const settlements=data.teamSettlements.filter(r=>r.projectId===selectedProject);
  // Project-team commercial management is independent from warehouse issue/return operations.
  // không thao tác xuất kho tại màn này; cấp phát/hoàn trả vật tư chỉ thực hiện tại KHO VẬT TƯ → Xuất kho theo tổ đội.
  async function submitContract(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!selectedProject)return;const f=Object.fromEntries(new FormData(e.currentTarget));if(await action("save_team_subcontract",{...f,projectId:selectedProject}))(e.currentTarget as HTMLFormElement).reset();}
  async function submitProduction(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!selectedProject)return;const f=Object.fromEntries(new FormData(e.currentTarget));if(await action("save_team_production",{...f,projectId:selectedProject}))(e.currentTarget as HTMLFormElement).reset();}
  async function submitPayment(e:FormEvent<HTMLFormElement>){e.preventDefault();if(!selectedProject)return;const f=Object.fromEntries(new FormData(e.currentTarget));if(await action("save_team_payment",{...f,projectId:selectedProject}))(e.currentTarget as HTMLFormElement).reset();}
  return <div className="stack"><section className="team-banner project-team-banner"><div><span>TỔ ĐỘI / NHÀ THẦU PHỤ</span><h2>{projectRow?.code||"—"} · {projectRow?.name||"Chưa có dự án"}</h2><p>Hợp đồng giao khoán và thanh toán tổ đội là nghiệp vụ độc lập với Hợp đồng chính dự án. Kho chỉ liên kết bằng team_id để truy vết vật tư cấp/hoàn.</p></div></section>
  {canManage&&selectedProject&&<section className="card"><CardHead title="Hợp đồng giao khoán tổ đội" note="Hợp đồng độc lập; không dùng contract_payments/BOQ hợp đồng chính."/><form className="payment-entry-inline" onSubmit={submitContract}><select name={"teamId"} required defaultValue=""><option value="">Chọn tổ đội</option>{teams.map(t=><option key={t.id} value={t.id}>{t.code} · {t.name}</option>)}</select><input name="contractNo" placeholder="Số HĐ giao khoán" required/><input name="contractName" placeholder="Tên/phạm vi hợp đồng" required/><input name="scopeText" placeholder="Phạm vi công việc"/><input name="contractValue" type="number" min="0" step="1" placeholder="Giá trị giao khoán" required/><input name="startDate" type="date"/><input name="endDate" type="date"/><button className="primary">LƯU HỢP ĐỒNG</button></form></section>}
  <section className="card"><CardHead title="Danh sách tổ đội dự án" note="Sản lượng, thanh toán và quyết toán lấy từ sổ độc lập của từng hợp đồng giao khoán."/><div className="table-wrap"><table><thead><tr><th>Tổ đội</th><th>Hợp đồng giao khoán</th><th>Giá trị HĐ</th><th>Sản lượng duyệt</th><th>Đã thanh toán</th><th>Còn phải trả</th><th>Quyết toán</th><th>Trạng thái</th></tr></thead><tbody>{teams.map(team=>{const cs=contracts.filter(c=>c.teamId===team.id);const cv=cs.reduce((a,c)=>a+Number(c.contractValue||0),0);const approved=productions.filter(r=>r.teamId===team.id&&r.status==="approved").reduce((a,r)=>a+Number(r.approvedValue||0),0);const paid=payments.filter(r=>r.teamId===team.id).reduce((a,r)=>a+Number(r.amount||0),0);const settlement=settlements.find(r=>r.teamId===team.id&&r.status==="closed");return <tr key={team.id}><td><strong>{team.code}</strong><small>{team.name} · {team.trade||"—"}</small></td><td>{cs.map(c=><div key={c.id}><strong>{c.contractNo}</strong><small>{c.contractName}</small></div>)}{!cs.length&&<span className="muted">Chưa lập</span>}</td><td>{money(cv)}</td><td><strong>{money(approved)}</strong></td><td>{money(paid)}</td><td><strong>{money(Math.max(0,approved-paid))}</strong></td><td><StatusBadge value={settlement?"Đã quyết toán":"Chưa quyết toán"}/>{canManage&&!settlement&&cs.length===1&&<button className="export-mini" onClick={()=>window.confirm(`Quyết toán ${cs[0].contractNo}? Hệ thống sẽ chặn nếu tổ đội còn vật tư chưa xử lý.`)&&action("settle_team_subcontract",{subcontractId:cs[0].id,settlementNo:`QT-${cs[0].contractNo}`,adjustmentValue:0})}>Quyết toán</button>}</td><td><StatusBadge value={team.active===0?"Ngừng hoạt động":"Đang hoạt động"}/></td></tr>})}{!teams.length&&<tr><td colSpan={8}><Empty text="Chưa có tổ đội trong dự án đang chọn."/></td></tr>}</tbody></table></div></section>
  {canManage&&contracts.length>0&&<div className="two-col"><section className="card"><CardHead title="Nghiệm thu sản lượng tổ đội" note="Tách hoàn toàn với Báo cáo sản lượng hợp đồng chính."/><form className="stack-form" onSubmit={submitProduction}><select name="subcontractId" required defaultValue=""><option value="">Chọn HĐ giao khoán</option>{contracts.map(c=><option key={c.id} value={c.id}>{c.contractNo} · {c.teamName}</option>)}</select><input name="periodKey" type="month" required/><input name="referenceNo" placeholder="Biên bản nghiệm thu"/><input name="description" placeholder="Nội dung nghiệm thu" required/><input name="submittedValue" type="number" min="0" step="1" placeholder="Giá trị trình" required/><input name="approvedValue" type="number" min="0" step="1" placeholder="Giá trị duyệt" required/><button className="primary">GHI NHẬN SẢN LƯỢNG</button></form><div className="simple-list">{productions.slice(0,8).map(r=><div key={r.id}><span className="doc-icon"><NavIcon name="project_progress"/></span><div><strong>{r.contractNo} · {r.periodKey}</strong><p>{r.teamName} · {r.referenceNo||"—"}</p></div><b>{money(r.approvedValue)}</b>{r.status!=="approved"&&<button className="mini-approve" onClick={()=>action("approve_team_production",{productionId:r.id})}>Duyệt</button>}</div>)}</div></section><section className="card"><CardHead title="Tạm ứng / Thanh toán tổ đội" note="Thanh toán riêng cho HĐ giao khoán; không ghi vào Thanh toán HĐ chính."/><form className="stack-form" onSubmit={submitPayment}><select name="subcontractId" required defaultValue=""><option value="">Chọn HĐ giao khoán</option>{contracts.map(c=><option key={c.id} value={c.id}>{c.contractNo} · {c.teamName}</option>)}</select><select name="paymentType" defaultValue="progress"><option value="advance">Tạm ứng</option><option value="progress">Thanh toán sản lượng</option><option value="retention">Hoàn giữ lại</option><option value="settlement">Quyết toán</option></select><input name="paymentDate" type="date" defaultValue={UI_TODAY} required/><input name="referenceNo" placeholder="Chứng từ"/><input name="description" placeholder="Nội dung" required/><input name="amount" type="number" min="0" step="1" placeholder="Số tiền" required/><button className="primary">GHI THANH TOÁN</button></form><div className="simple-list">{payments.slice(0,8).map(r=><div key={r.id}><span className="doc-icon"><NavIcon name="payments"/></span><div><strong>{r.contractNo} · {r.description}</strong><p>{r.teamName} · {r.paymentDate}</p></div><b>{money(r.amount)}</b></div>)}</div></section></div>}
  </div>;
}

function WarehouseIssueTeams({ data, project, open, canUse }: { data: AppData; project: string; open: (name: string, row?: Row) => void; canUse: boolean }) {
  const selectedProject=project==="ALL"?null:project; const teams=data.teams.filter(row=>row.projectId===selectedProject); const p=data.projects.find(row=>row.id===selectedProject); const canCreateTeam=isAdminUser(data.user)||["cht","commander"].includes(String(data.user.role));
  return <div className="stack">{!selectedProject&&<div className="inline-alert"><b>Vui lòng chọn một dự án</b> để thực hiện nghiệp vụ xuất kho, tạo tổ đội hoặc xác nhận lắp đặt. Phạm vi “Tất cả dự án” chỉ dùng để xem tổng hợp và không giữ dự án cũ ngầm định.</div>}<section className="team-banner"><div><span>XUẤT KHO THEO TỔ ĐỘI</span><h2>{p?.code||"—"} · {p?.name||"Chưa chọn dự án"}</h2><p>Mỗi tổ đội chỉ thuộc đúng một dự án. Số liệu cấp phát/hoàn trả được lấy từ stock ledger và tự tổng hợp lên XNT.</p></div><div className="banner-actions">{selectedProject&&canCreateTeam&&<button className="secondary light" onClick={()=>open("teamCreate")}>＋ Tạo tổ đội</button>}{selectedProject&&canUse&&<><button className="secondary light" onClick={()=>open("install")}>✓ Xác nhận đã lắp</button><button className="primary light" onClick={()=>open("issue")}>＋ Xuất kho cho tổ đội</button></>}</div></section><section className="card"><CardHead title="Lũy kế xuất / hoàn theo tổ đội" note="Nguồn duy nhất: giao dịch kho thật; không nhập lại số liệu ở báo cáo."/><div className="table-wrap"><table><thead><tr><th>Tổ đội</th><th>Lũy kế cấp</th><th>Lũy kế hoàn</th><th>Đã xác nhận lắp</th><th>Đang giữ</th><th>Phiếu xuất</th><th>Phiếu hoàn</th><th>Thao tác</th></tr></thead><tbody>{teams.map(team=>{const teamIssues=data.issues.filter(r=>r.teamId===team.id);const received=teamIssues.reduce((sum,r)=>sum+Number(r.totalQty||0),0);const installed=teamIssues.reduce((sum,r)=>sum+Number(r.installedQty||0),0);const teamReturns=data.returns.filter(r=>r.teamId===team.id);const returned=teamReturns.reduce((sum,r)=>sum+Number(r.acceptedQty||0),0);const balances=data.inventory.filter(r=>r.warehouseId===team.warehouseId);const held=balances.reduce((sum,r)=>sum+Number(r.balance||0),0);return <tr key={team.id}><td><strong>{team.name}</strong><small>{team.code} · {team.trade||"—"}</small></td><td>{format.format(received)}</td><td>{format.format(returned)}</td><td>{format.format(installed)}</td><td><strong>{format.format(held)}</strong></td><td>{teamIssues.length}</td><td>{teamReturns.length}</td><td>{canUse&&<button className="export-mini" onClick={()=>open("return",team)}>Hoàn trả →</button>}</td></tr>})}{!teams.length&&<tr><td colSpan={8}><Empty text="Chưa có tổ đội trong dự án đang chọn. CHT có thể tạo tổ đội tại đây."/></td></tr>}</tbody></table></div></section></div>;
}

function Stocktake({ data, open, action, canUse }: { data: AppData; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean>; canUse: boolean }) { const pending = data.stockCounts.filter((row) => row.status === "pending_approval"); return <div className="stack"><div className="kpi-grid small"><Kpi icon="KK" label="Phiếu kiểm kê" value={format.format(data.stockCounts.length)} note={`${pending.length} phiếu chờ duyệt`} tone="amber" /><Kpi icon="RET" label="Phiếu hoàn trả" value={format.format(data.returns.length)} note="Từ các tổ đội" /><Kpi icon="CL" label="Chênh lệch chờ xử lý" value={format.format(pending.reduce((sum, row) => sum + Number(row.totalVariance), 0))} note="Không tự động che chênh lệch" tone="red" /></div><div className="two-col"><section className="card"><CardHead title="Kiểm kê kho" note="Sổ–thực tế và duyệt điều chỉnh" action={canUse ? "Tạo phiếu kiểm kê" : undefined} onClick={() => open("count")} /><div className="simple-list">{data.stockCounts.map((row) => <div key={row.id}><span className="doc-icon"><NavIcon name="stocktake"/></span><div><strong>{row.countNo}</strong><p>{row.projectCode} · {row.warehouseName} · {date(row.countedAt)}</p></div><b>± {format.format(row.totalVariance)}</b>{row.status === "pending_approval" && canUse && (isAdminUser(data.user) || ["commander", "project"].includes(roleBase(data.user))) ? <button className="mini-approve" onClick={() => action("approve_stock_count", { countId: row.id })}>Duyệt điều chỉnh</button> : <StatusBadge value={row.status === "approved" ? "Đã duyệt" : "Chờ duyệt"} />}</div>)}{!data.stockCounts.length && <Empty text="Chưa có phiếu kiểm kê." />}</div></section><section className="card"><CardHead title="Phiếu hoàn trả gần nhất" note="Kho nhận và đánh giá tình trạng" action={canUse ? "Tạo phiếu hoàn trả" : undefined} onClick={() => open("return")} /><div className="simple-list">{data.returns.map((row) => <div key={row.id}><span className="doc-icon"><NavIcon name="stocktake"/></span><div><strong>{row.returnNo}</strong><p>{row.projectCode} · {row.teamName} · {date(row.returnedAt)}</p></div><b>{format.format(row.acceptedQty)}</b><StatusBadge value="Đã nhận" /></div>)}{!data.returns.length && <Empty text="Chưa có phiếu hoàn trả." />}</div></section><section className="card"><CardHead title="Đối chiếu luồng vật tư rời (hoàn trả / điều chuyển)" note="Hai luồng hoàn trả (kho dự án & kho tổng) và điều chuyển giữa kho đang tách rời; đối chiếu tại đây để kiểm soát trước khi chuẩn hóa thành một quy trình."/><div className="table-wrap"><table><thead><tr><th>Luồng</th><th>Kho / Dự án</th><th>Trạng thái</th><th>Ngày</th></tr></thead><tbody>{data.transferOrders.slice(0,6).map((row)=><tr key={row.id}><td>Điều chuyển {row.transferNo}</td><td>{row.sourceWarehouseCode} → {row.destinationWarehouseCode}</td><td><StatusBadge value={row.status==="requested"?"Chờ duyệt":row.status==="approved"?"Đã duyệt":row.status==="in_transit"?"Đang vận chuyển":row.status==="received"?"Đã nhận":"Đã huỷ"}/></td><td>{date(row.requestedAt)}</td></tr>)}{data.centralReturns.slice(0,4).map((row)=><tr key={row.id}><td>Hoàn trả kho tổng {row.returnNo||row.id}</td><td>{row.projectCode||"—"}</td><td><StatusBadge value={row.status==="approved"?"Đã duyệt":row.status==="received"?"Đã nhận":"Chờ xử lý"}/></td><td>{date(row.requestedAt||row.createdAt)}</td></tr>)}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={() => { const rows=[["Điều chuyển","Kho nguồn","Kho đích","Trạng thái","Ngày"],...data.transferOrders.slice(0,6).map((row)=>["Điều chuyển "+row.transferNo,row.sourceWarehouseCode||"",row.destinationWarehouseCode||"",String(row.status),String(row.requestedAt||"")]),...data.centralReturns.slice(0,4).map((row)=>["Hoàn trả kho tổng "+(row.returnNo||row.id),row.projectCode||"","","",String(row.requestedAt||row.createdAt||"")])]; const headers=rows[0]; const body=rows.slice(1); const rr=reportRows(headers as string[], body as string[][], "Doi_chieu_luong_vat_tu"); reportExport(rr, "Bao_cao_Doi_chieu_luong_vat_tu"); }}>⇩ CSV/XLSX</button></div></section></div></div>; }
function Reports({ data, project }: { data: AppData; project: string }) {
  const requests = data.requests.filter((row) => project === "ALL" || row.projectId === project); const approvedQty = requests.reduce((sum, row) => sum + row.items.reduce((s: number, item: Row) => s + Number(item.approvedPurchaseQty), 0), 0); const orderedQty = requests.reduce((sum, row) => sum + row.items.reduce((s: number, item: Row) => s + Number(item.orderedQty), 0), 0); const receivedQty = requests.reduce((sum, row) => sum + Number(row.receivedQty), 0); const issuedQty = requests.reduce((sum, row) => sum + Number(row.issuedQty), 0);
  const stageNos = [...new Set(requests.flatMap((request) => (request.approvals || []).map((approval: Row) => Number(approval.stage))))].sort((a,b) => a-b);
  const stageStats = stageNos.map((stage) => { const rows = requests.map((request) => request.approvals.find((approval: Row) => Number(approval.stage) === stage)).filter(Boolean); const completed = rows.filter((row) => row.queuedAt && row.decidedAt); const minutes = completed.map((row) => approvalTiming(row).minutes); const name = rows.find(Boolean)?.department || data.approvalStages.find((item) => Number(item.stageNo) === stage)?.name || `Bước ${stage}`; return { stage, name, received: rows.filter((row) => row.queuedAt).length, completed: completed.length, average: minutes.length ? minutes.reduce((sum, value) => sum + value, 0) / minutes.length : 0, late: rows.filter((row) => approvalTiming(row).late).length, pending: rows.filter((row) => row.queuedAt && !row.decidedAt && row.status === "pending").length };
  });
  const requestIds = new Set(requests.map((row) => row.id));
  const supplyStats = [["po_creation", "Lập và phát hành PO"], ["delivery", "Nhà cung cấp giao hàng"], ["bch_confirmation", "BCH xác nhận giao hàng"]].map(([step, name]) => { const rows = data.supplySteps.filter((row) => requestIds.has(row.requestId) && row.step === step); const completed = rows.filter((row) => row.completedAt); const minutes = completed.map((row) => workflowTiming(row).minutes); return { step, name, received: rows.length, completed: completed.length, pending: rows.filter((row) => row.status === "pending").length, average: minutes.length ? minutes.reduce((sum, value) => sum + value, 0) / minutes.length : 0, late: rows.filter((row) => workflowTiming(row).late).length }; });
  const cards = [["R01", "Tiến độ cung ứng theo đơn", `${requests.filter((row) => Number(row.receivedQty) < Number(row.totalQty)).length} đơn chưa giao đủ`], ["R02", "Lũy kế MR → PO → GRN", `${format.format(approvedQty)} / ${format.format(orderedQty)} / ${format.format(receivedQty)}`], ["R03", "Tồn kho và tuổi tồn", `${data.inventory.filter((row) => Number(row.balance) > 0).length} dòng có tồn`], ["R04", "Hiệu suất nhà cung cấp", `${data.suppliers.length} nhà cung cấp hoạt động`], ["R05", "Vật tư tại tổ đội", `${format.format(issuedQty)} lượng đã cấp`], ["R06", "Kiểm kê và thất thoát", `${data.inventory.filter((row) => Number(row.balance) < 0).length} dòng tồn âm`]];
  const projectRows = project === "ALL" ? data.projects : data.projects.filter((p) => String(p.id) === String(project));
  const boqScoped = data.boqItems.filter((b) => project === "ALL" || String(b.projectId) === String(project));
  const contractValueRows = projectRows.map((p) => { const items = boqScoped.filter((b) => String(b.projectId) === String(p.id) && String(b.rowRole) !== "section" && Number(b.unitPrice || 0) > 0); const contractValue = items.reduce((s, b) => s + Number(b.unitPrice || 0) * Number(b.contractQty || b.remeasuredQty || 0), 0); const approved = items.reduce((s, b) => s + Number(b.unitPrice || 0) * Number(b.remeasuredQty || 0), 0); const contracts = data.projectContracts.filter((c) => String(c.projectId) === String(p.id)); const payments = data.contractPayments.filter((c) => String(c.projectId) === String(p.id)).reduce((s, c) => s + Number(c.amount || 0), 0); return { code: p.code, name: p.name, contracts: contracts.length, contractValue, approved, received: payments, remaining: Math.max(0, contractValue - approved), balance: Math.max(0, approved - payments) }; });
  const supplierDebtRows = data.purchaseOrders.filter((po) => project === "ALL" || String(po.projectId) === String(project)).reduce<Row[]>((acc, po) => { const existing = acc.find((r) => r.supplierName === po.supplierName); const value = Number(po.totalValue || 0); const received = Number(po.receivedQty || 0) !== 0; if (existing) { existing.poCount += 1; existing.totalValue += value; existing.openValue += (!received && String(po.status) !== "completed") ? value : 0; } else acc.push({ supplierName: po.supplierName || "—", poCount: 1, totalValue: value, openValue: (!received && String(po.status) !== "completed") ? value : 0 }); return acc; }, []);
  const inventoryScoped = data.inventory.filter((row) => project === "ALL" || String(row.projectId) === String(project));
  const lowStockRows = inventoryScoped.filter((row) => Number(row.balance) < Number(row.minStock || 0)).map((row) => ({ code: row.materialCode, name: row.materialName, unit: row.unit, balance: row.balance, minStock: row.minStock || 0, projectCode: row.projectCode }));
  const stockByContractRows = data.contractStockBalances.filter((row) => project === "ALL" || String(row.projectId) === String(project)).map((row) => ({ projectCode: row.projectCode, contractNo: row.contractNo, materialCode: row.materialCode, materialName: row.materialName, unit: row.unit, balance: row.balance, warehouseCode: row.warehouseCode }));
  const transferScoped=(row:Row)=>project==="ALL"||String(row.projectId||row.sourceProjectId||row.destinationProjectId||"")===String(project);
  const returnFlowSummary=[["Hoàn trả kho dự án (material_returns)",data.returns.filter(transferScoped).length],["Hoàn trả kho tổng (central_returns)",data.centralReturns.filter(transferScoped).length],["Điều chuyển (transfer_orders)",data.transferOrders.filter(transferScoped).length]].map(([label,count])=>({label:String(label),count:Number(count)}));
  const productionScoped=data.productionReports.filter((r)=>project==="ALL"||String(r.projectId)===String(project));
  const planExecRows=projectRows.map((p)=>{const reports=productionScoped.filter((r)=>String(r.projectId)===String(p.id));const planned=reports.reduce((s,r)=>s+Number(r.plannedValue||0),0);const actual=reports.reduce((s,r)=>s+Number(r.actualValue||0),0);const approved=reports.filter((r)=>String(r.status)==="approved").reduce((s,r)=>s+Number(r.approvedValue||0),0);const recovery=data.capitalRecoveryRecords.filter((r)=>String(r.projectId)===String(p.id)).reduce((s,r)=>s+Number(r.approvedValue||0),0);const cash=data.contractPayments.filter((r)=>String(r.projectId)===String(p.id)).reduce((s,r)=>s+Number(r.amount||0),0);const planningPct=planned>0?Math.round(approved/planned*100):0;return{code:p.code,name:p.name,planned,actual,approved,recovery,cash,planningPct,risk:planned>0&&approved>planned*1.05?"over_budget":actual>0&&approved>0&&actual<approved*0.5?"slow":"ok"};});
  return <div className="stack"><div className="report-grid">{cards.map(([code, title, value]) => <article key={code}><span>{code}</span><div><h2>{title}</h2><strong>{value}</strong><p>Xuất theo dự án, khoảng ngày và trạng thái chứng từ.</p></div><button onClick={() => exportCsv(requests)}>⇩ Xuất dữ liệu</button></article>)}</div>
  <section className="card"><CardHead title="Giá trị hợp đồng theo dự án (M&E)" note="Tổng BOQ × đơn giá hợp đồng; giá trị phê duyệt theo khối lượng tái đo; tiền thực thu từ Thanh toán HĐ."/><div className="table-wrap"><table><thead><tr><th>Dự án</th><th>Hợp đồng</th><th>Giá trị hợp đồng</th><th>Giá trị phê duyệt</th><th>Chưa phê duyệt</th><th>Tiền thực thu</th><th>Dư công nợ</th></tr></thead><tbody>{contractValueRows.map((r) => <tr key={r.code}><td><strong>{r.code}</strong><small>{r.name}</small></td><td>{r.contracts}</td><td><strong>{money(r.contractValue)}</strong></td><td>{money(r.approved)}</td><td>{money(r.remaining)}</td><td>{money(r.received)}</td><td><strong className={Number(r.balance) > 0 ? "red-text" : ""}>{money(r.balance)}</strong></td></tr>)}{!contractValueRows.length && <tr><td colSpan={7}><Empty text="Chưa có dữ liệu BOQ/hợp đồng."/></td></tr>}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={() => { const rows = contractValueRows.map((r) => [r.code, String(r.contracts), String(r.contractValue), String(r.approved), String(r.remaining), String(r.received), String(r.balance)]); const rr = reportRows(["Dự án","Hợp đồng","Giá trị hợp đồng","Giá trị phê duyệt","Chưa phê duyệt","Tiền thực thu","Dư công nợ"], rows, "Gia_tri_hop_dong"); reportExport(rr, "Bao_cao_Gia_tri_hop_dong"); }}>⇩ CSV/XLSX</button><button className="export-mini" onClick={() => { const rows = contractValueRows.map((r) => [r.code, String(r.contracts), String(r.contractValue), String(r.approved), String(r.remaining), String(r.received), String(r.balance)]); const rr = reportRows(["Dự án","Hợp đồng","Giá trị hợp đồng","Giá trị phê duyệt","Chưa phê duyệt","Tiền thực thu","Dư công nợ"], rows, "Gia_tri_hop_dong"); reportPdf(rr, "Bao_cao_Gia_tri_hop_dong", "GIÁ TRỊ HỢP ĐỒNG THEO DỰ ÁN"); }}>⇩ PDF</button><button className="export-mini" onClick={() => { const rows = contractValueRows.map((r) => [r.code, String(r.contracts), String(r.contractValue), String(r.approved), String(r.remaining), String(r.received), String(r.balance)]); printReport("GIÁ TRỊ HỢP ĐỒNG THEO DỰ ÁN", ["Dự án","Hợp đồng","Giá trị hợp đồng","Giá trị phê duyệt","Chưa phê duyệt","Tiền thực thu","Dư công nợ"], rows); }}>🖶 In</button></div></section>
  <section className="card"><CardHead title="Dashboard quản lý — Kế hoạch ↔ Thực hiện ↔ Ngân sách & Thu hồi vốn" note="So sánh theo dự án: giá trị sản lượng kế hoạch vs thực tế báo cáo vs duyệt, giá trị thu hồi vốn được duyệt và tiền thực thu. Cảnh báo khi duyệt vượt kế hoạch >5% hoặc tiến độ chậm."/><div className="table-wrap"><table><thead><tr><th>Dự án</th><th>KH sản lượng</th><th>TH báo cáo</th><th>Được duyệt</th><th>% đạt KH</th><th>Thu hồi vốn duyệt</th><th>Tiền thực thu</th><th>Cảnh báo</th></tr></thead><tbody>{planExecRows.map((r)=><tr key={r.code}><td><strong>{r.code}</strong><small>{r.name}</small></td><td>{money(r.planned)}</td><td>{money(r.actual)}</td><td><strong>{money(r.approved)}</strong></td><td>{r.planningPct}%</td><td>{money(r.recovery)}</td><td>{money(r.cash)}</td><td>{r.risk==="over_budget"?<StatusBadge value="Vượt ngân sách KH"/>:r.risk==="slow"?<StatusBadge value="Tiến độ chậm"/>:<StatusBadge value="Trong hạn"/>}</td></tr>)}{!planExecRows.length&&<tr><td colSpan={8}><Empty text="Chưa có dữ liệu sản lượng/thu hồi vốn."/></td></tr>}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={() => { const rows = planExecRows.map((r) => [r.code, String(r.planned), String(r.actual), String(r.approved), `${r.planningPct}%`, String(r.recovery), String(r.cash), r.risk==="over_budget"?"Vượt ngân sách KH":r.risk==="slow"?"Tiến độ chậm":"Trong hạn"]); const rr = reportRows(["Dự án","KH sản lượng","TH báo cáo","Được duyệt","% đạt KH","Thu hồi vốn duyệt","Tiền thực thu","Cảnh báo"], rows, "Dashboard_quan_ly"); reportExport(rr, "Bao_cao_Dashboard_quan_ly"); }}>⇩ CSV/XLSX</button><button className="export-mini" onClick={() => { const rows = planExecRows.map((r) => [r.code, String(r.planned), String(r.actual), String(r.approved), `${r.planningPct}%`, String(r.recovery), String(r.cash), r.risk==="over_budget"?"Vượt ngân sách KH":r.risk==="slow"?"Tiến độ chậm":"Trong hạn"]); const rr = reportRows(["Dự án","KH sản lượng","TH báo cáo","Được duyệt","% đạt KH","Thu hồi vốn duyệt","Tiền thực thu","Cảnh báo"], rows, "Dashboard_quan_ly"); reportPdf(rr, "Bao_cao_Dashboard_quan_ly", "DASHBOARD QUẢN LÝ DỰ ÁN"); }}>⇩ PDF</button><button className="export-mini" onClick={() => { const rows = planExecRows.map((r) => [r.code, String(r.planned), String(r.actual), String(r.approved), `${r.planningPct}%`, String(r.recovery), String(r.cash), r.risk==="over_budget"?"Vượt ngân sách KH":r.risk==="slow"?"Tiến độ chậm":"Trong hạn"]); printReport("DASHBOARD QUẢN LÝ DỰ ÁN", ["Dự án","KH sản lượng","TH báo cáo","Được duyệt","% đạt KH","Thu hồi vốn duyệt","Tiền thực thu","Cảnh báo"], rows); }}>🖶 In</button></div></section>
  <section className="card"><CardHead title="Công nợ nhà cung cấp (ước theo PO)" note="Tổng giá trị PO còn mở (chưa nhận đủ/chưa hoàn tất) gộp theo nhà cung cấp."/><div className="table-wrap"><table><thead><tr><th>Nhà cung cấp</th><th>Số PO</th><th>Tổng giá trị</th><th>Giá trị PO mở</th></tr></thead><tbody>{supplierDebtRows.map((r) => <tr key={String(r.supplierName)}><td><strong>{r.supplierName}</strong></td><td>{r.poCount}</td><td>{money(r.totalValue)}</td><td><strong className={Number(r.openValue) > 0 ? "amber-text" : ""}>{money(r.openValue)}</strong></td></tr>)}{!supplierDebtRows.length && <tr><td colSpan={4}><Empty text="Chưa có PO trong phạm vi."/></td></tr>}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={() => { const rows = supplierDebtRows.map((r) => [r.supplierName, String(r.poCount), String(r.totalValue), String(r.openValue)]); const rr = reportRows(["Nhà cung cấp","Số PO","Tổng giá trị","Giá trị PO mở"], rows, "Cong_no_NCC"); reportExport(rr, "Bao_cao_Cong_no_NCC"); }}>⇩ CSV/XLSX</button><button className="export-mini" onClick={() => { const rows = supplierDebtRows.map((r) => [r.supplierName, String(r.poCount), String(r.totalValue), String(r.openValue)]); const rr = reportRows(["Nhà cung cấp","Số PO","Tổng giá trị","Giá trị PO mở"], rows, "Cong_no_NCC"); reportPdf(rr, "Bao_cao_Cong_no_NCC", "CÔNG NỢ NHÀ CUNG CẤP"); }}>⇩ PDF</button></div></section>
  <section className="card"><CardHead title="Tồn kho định kỳ theo hợp đồng" note="Số dư tồn vật lý theo từng hợp đồng từ contract stock ledger; đối soát với số xuất nhập thực tế."/><div className="table-wrap"><table><thead><tr><th>Dự án</th><th>Hợp đồng</th><th>Kho</th><th>Mã vật tư</th><th>Tên vật tư</th><th>ĐVT</th><th>Số dư</th></tr></thead><tbody>{stockByContractRows.map((r, i) => <tr key={i}><td>{r.projectCode}</td><td>{r.contractNo}</td><td>{r.warehouseCode}</td><td>{r.materialCode}</td><td>{r.materialName}</td><td>{r.unit}</td><td><strong>{format.format(Number(r.balance))}</strong></td></tr>)}{!stockByContractRows.length && <tr><td colSpan={7}><Empty text="Chưa có dòng tồn kho theo hợp đồng."/></td></tr>}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={() => { const rows = stockByContractRows.map((r) => [r.projectCode, r.contractNo, r.warehouseCode, r.materialCode, r.materialName, r.unit, String(r.balance)]); const rr = reportRows(["Dự án","Hợp đồng","Kho","Mã vật tư","Tên vật tư","ĐVT","Số dư"], rows, "Ton_kho_theo_hop_dong"); reportExport(rr, "Bao_cao_Ton_kho_theo_HD"); }}>⇩ CSV/XLSX</button><button className="export-mini" onClick={() => { const rows = stockByContractRows.map((r) => [r.projectCode, r.contractNo, r.warehouseCode, r.materialCode, r.materialName, r.unit, String(r.balance)]); const rr = reportRows(["Dự án","Hợp đồng","Kho","Mã vật tư","Tên vật tư","ĐVT","Số dư"], rows, "Ton_kho_theo_hop_dong"); reportPdf(rr, "Bao_cao_Ton_kho_theo_HD", "TỒN KHO THEO HỢP ĐỒNG"); }}>⇩ PDF</button><button className="export-mini" onClick={() => { const rows = stockByContractRows.map((r) => [r.projectCode, r.contractNo, r.warehouseCode, r.materialCode, r.materialName, r.unit, String(r.balance)]); printReport("TỒN KHO THEO HỢP ĐỒNG", ["Dự án","Hợp đồng","Kho","Mã vật tư","Tên vật tư","ĐVT","Số dư"], rows); }}>🖶 In</button></div></section>
  <section className="card"><CardHead title="Đối chiếu luồng hoàn trả / điều chuyển" note="Tổng hợp 3 luồng vật tư rời rạc (hoàn trả kho dự án, hoàn trả kho tổng, điều chuyển giữa kho) để kiểm soát. Hướng chuẩn hóa: các luồng này sẽ được hợp nhất qua một quy trình điều chuyển duy nhất trong phase sau."/><div className="table-wrap"><table><thead><tr><th>Luồng</th><th>Số phiếu</th></tr></thead><tbody>{returnFlowSummary.map((r,i)=><tr key={i}><td>{r.label}</td><td><strong>{r.count}</strong></td></tr>)}{!returnFlowSummary.some((r)=>r.count>0)&&<tr><td colSpan={2}><Empty text="Chưa có phiếu hoàn trả/điều chuyển."/></td></tr>}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={() => { const rows = returnFlowSummary.map((r) => [r.label, String(r.count)]); const rr = reportRows(["Luồng","Số phiếu"], rows, "Doi_chieu_hoan_tra"); reportExport(rr, "Bao_cao_Doi_chieu_hoan_tra"); }}>⇩ CSV/XLSX</button><button className="export-mini" onClick={() => { const rows = returnFlowSummary.map((r) => [r.label, String(r.count)]); const rr = reportRows(["Luồng","Số phiếu"], rows, "Doi_chieu_hoan_tra"); reportPdf(rr, "Bao_cao_Doi_chieu_hoan_tra", "ĐỐI CHIẾU HOÀN TRẢ / ĐIỀU CHUYỂN"); }}>⇩ PDF</button></div></section>
  <section className="card"><CardHead title="Cảnh báo tồn dưới mức tối thiểu" note="Vật tư có số dư < tồn tối thiểu cấu hình tại Material Catalog — cần lập đề nghị mua bổ sung."/><div className="table-wrap"><table><thead><tr><th>Dự án</th><th>Mã vật tư</th><th>Tên vật tư</th><th>ĐVT</th><th>Tồn hiện tại</th><th>Tồn tối thiểu</th><th>Thiếu</th></tr></thead><tbody>{lowStockRows.map((r) => <tr key={`${r.code}-${r.projectCode}`}><td>{r.projectCode}</td><td>{r.code}</td><td>{r.name}</td><td>{r.unit}</td><td><strong className="red-text">{format.format(Number(r.balance))}</strong></td><td>{format.format(Number(r.minStock))}</td><td>{format.format(Math.max(0, Number(r.minStock) - Number(r.balance)))}</td></tr>)}{!lowStockRows.length && <tr><td colSpan={7}><Empty text="Không có vật tư nào dưới tồn tối thiểu."/></td></tr>}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={() => { const rows = lowStockRows.map((r) => [r.projectCode, r.code, r.name, r.unit, String(r.balance), String(r.minStock), String(Math.max(0, Number(r.minStock) - Number(r.balance)))]); const rr = reportRows(["Dự án","Mã vật tư","Tên vật tư","ĐVT","Tồn hiện tại","Tồn tối thiểu","Thiếu"], rows, "Canh_bao_ton_thieu"); reportExport(rr, "Bao_cao_Canh_bao_ton"); }}>⇩ CSV/XLSX</button><button className="export-mini" onClick={() => { const rows = lowStockRows.map((r) => [r.projectCode, r.code, r.name, r.unit, String(r.balance), String(r.minStock), String(Math.max(0, Number(r.minStock) - Number(r.balance)))]); const rr = reportRows(["Dự án","Mã vật tư","Tên vật tư","ĐVT","Tồn hiện tại","Tồn tối thiểu","Thiếu"], rows, "Canh_bao_ton_thieu"); reportPdf(rr, "Bao_cao_Canh_bao_ton", "CẢNH BÁO TỒN DƯỚI MỨC TỐI THIỂU"); }}>⇩ PDF</button></div></section>
  <section className="card"><CardHead title="Hiệu suất phê duyệt theo từng cấp" note="Tính từ thời điểm nhận hồ sơ đến thời điểm duyệt/từ chối; phiếu đang quá hạn được tính ngay" /><div className="table-wrap"><table><thead><tr><th>Cấp duyệt</th><th>Đã nhận</th><th>Đã xử lý</th><th>Đang chờ</th><th>Thời gian TB</th><th>Quá hạn</th><th>Đánh giá</th></tr></thead><tbody>{stageStats.map((row) => <tr key={row.stage}><td><strong>Cấp {row.stage}</strong><small>{row.name}</small></td><td>{row.received}</td><td>{row.completed}</td><td>{row.pending}</td><td>{durationText(row.average)}</td><td><strong className={row.late ? "red-text" : ""}>{row.late}</strong></td><td><StatusBadge value={row.late ? "Có bước chậm" : "Trong hạn"} /></td></tr>)}</tbody></table></div></section><section className="card"><CardHead title="Hiệu suất sau phê duyệt" note="Đo liên tục từ lúc duyệt xong đến khi phát hành PO, giao hàng và BCH xác nhận" /><div className="table-wrap"><table><thead><tr><th>Bước xử lý</th><th>Đã nhận</th><th>Đã xử lý</th><th>Đang chờ</th><th>Thời gian TB</th><th>Quá hạn</th><th>Đánh giá</th></tr></thead><tbody>{supplyStats.map((row) => <tr key={row.step}><td><strong>{row.name}</strong></td><td>{row.received}</td><td>{row.completed}</td><td>{row.pending}</td><td>{durationText(row.average)}</td><td><strong className={row.late ? "red-text" : ""}>{row.late}</strong></td><td><StatusBadge value={row.late ? "Có bước chậm" : "Trong hạn"} /></td></tr>)}</tbody></table></div></section>
  <section className="card"><CardHead title="Cảnh báo quá hạn & sắp đến hạn" note="PO trễ hẹn giao hàng, nhiệm vụ quá hạn và hợp đồng sắp hết hiệu lực trong phạm vi — ưu tiên xử lý theo mức."/><div className="table-wrap"><table><thead><tr><th>Loại</th><th>Tham chiếu</th><th>Đối tượng</th><th>Thời điểm</th><th>Mức</th></tr></thead><tbody>{(()=>{const out:string[][]=[];const push=(type:string,ref:string,obj:string,when:string,level:string)=>out.push([type,ref,obj,when,level]);const nowMs=UI_NOW_MS;(data.purchaseOrders||[]).filter((r)=>project==="ALL"||String(r.projectId)===String(project)).forEach((r)=>{if(r.eta&&new Date(r.eta).getTime()<nowMs&&!String(r.status||"").includes("completed"))push("PO trễ hẹn",r.poNo||r.id,r.supplierName||"",date(r.eta),Number(r.receivedQty||0)>0?"trung_binh":"cao");});(data.workItems||[]).filter((r)=>project==="ALL"||String(r.projectId||"")===String(project)).filter((r)=>!["COMPLETED","CANCELLED"].includes(String(r.status))).forEach((r)=>{if(r.dueAt&&new Date(r.dueAt).getTime()<nowMs)push("Nhiệm vụ quá hạn",r.taskNo||r.id,r.title,date(r.dueAt),r.priority==="critical"||r.priority==="high"?"cao":"trung_binh");});(data.projectContracts||[]).filter((r)=>project==="ALL"||String(r.projectId)===String(project)).forEach((r)=>{if(r.effectiveTo){const days=(new Date(r.effectiveTo).getTime()-nowMs)/86400000;if(days>=0&&days<=60)push("Hợp đồng sắp hết hiệu lực",r.contractNo||r.id,r.contractName,date(r.effectiveTo),days<=30?"cao":"thap");}});return out;})().map((r,i)=><tr key={i}><td><strong>{r[0]}</strong></td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td><td><StatusBadge value={r[4]==="cao"?"Cao":r[4]==="trung_binh"?"Trung bình":"Thấp"}/></td></tr>)}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={()=>{const rows:string[][]=[];const nowMs=UI_NOW_MS;(data.purchaseOrders||[]).filter((r)=>project==="ALL"||String(r.projectId)===String(project)).forEach((r)=>{if(r.eta&&new Date(r.eta).getTime()<nowMs&&!String(r.status||"").includes("completed"))rows.push(["PO trễ hẹn",r.poNo||r.id,r.supplierName||"",String(r.eta||""),Number(r.receivedQty||0)>0?"trung_binh":"cao"]);});(data.workItems||[]).filter((r)=>project==="ALL"||String(r.projectId||"")===String(project)).filter((r)=>!["COMPLETED","CANCELLED"].includes(String(r.status))).forEach((r)=>{if(r.dueAt&&new Date(r.dueAt).getTime()<nowMs)rows.push(["Nhiệm vụ quá hạn",r.taskNo||r.id,r.title,String(r.dueAt||""),r.priority==="critical"||r.priority==="high"?"cao":"trung_binh"]);});(data.projectContracts||[]).filter((r)=>project==="ALL"||String(r.projectId)===String(project)).forEach((r)=>{if(r.effectiveTo){const days=(new Date(r.effectiveTo).getTime()-nowMs)/86400000;if(days>=0&&days<=60)rows.push(["Hợp đồng sắp hết hiệu lực",r.contractNo||r.id,r.contractName,String(r.effectiveTo||""),days<=30?"cao":"thap"]);}});const rr=reportRows(["Loại","Tham chiếu","Đối tượng","Thời điểm","Mức"], rows, "Canh_bao_qua_han");reportExport(rr,"Bao_cao_Canh_bao_qua_han");}}>⇩ CSV/XLSX</button><button className="export-mini" onClick={()=>{const rows:string[][]=[];const nowMs=UI_NOW_MS;(data.purchaseOrders||[]).filter((r)=>project==="ALL"||String(r.projectId)===String(project)).forEach((r)=>{if(r.eta&&new Date(r.eta).getTime()<nowMs&&!String(r.status||"").includes("completed"))rows.push(["PO trễ hẹn",r.poNo||r.id,r.supplierName||"",String(r.eta||""),Number(r.receivedQty||0)>0?"trung_binh":"cao"]);});(data.workItems||[]).filter((r)=>project==="ALL"||String(r.projectId||"")===String(project)).filter((r)=>!["COMPLETED","CANCELLED"].includes(String(r.status))).forEach((r)=>{if(r.dueAt&&new Date(r.dueAt).getTime()<nowMs)rows.push(["Nhiệm vụ quá hạn",r.taskNo||r.id,r.title,String(r.dueAt||""),r.priority==="critical"||r.priority==="high"?"cao":"trung_binh"]);});(data.projectContracts||[]).filter((r)=>project==="ALL"||String(r.projectId)===String(project)).forEach((r)=>{if(r.effectiveTo){const days=(new Date(r.effectiveTo).getTime()-nowMs)/86400000;if(days>=0&&days<=60)rows.push(["Hợp đồng sắp hết hiệu lực",r.contractNo||r.id,r.contractName,String(r.effectiveTo||""),days<=30?"cao":"thap"]);}});reportPdf(reportRows(["Loại","Tham chiếu","Đối tượng","Thời điểm","Mức"],rows,"Canh_bao_qua_han"),"Bao_cao_Canh_bao_qua_han","CẢNH BÁO QUÁ HẠN & SẮP ĐẾN HẠN");}}>⇩ PDF</button></div></section>
  </div>;
}
function MenuLayoutManager({ data, open, action }: { data: AppData; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean> }) {
  const sourceGroups = configuredMenuGroups(data, true); const sourceModules = configuredModules(data, true);
  const sourceSignature = `${sourceGroups.map((g) => `${g.groupKey}:${g.sortOrder}:${g.name}:${Number(g.active)}`).join("|")}#${sourceModules.map((m) => `${m.key}:${m.groupKey || "_"}:${m.sortOrder}:${m.label}:${Number(m.active)}`).join("|")}`;
  const makeGroupOrder = () => sourceGroups.map((row) => String(row.groupKey));
  const makeBuckets = () => { const buckets: Record<string, string[]> = { __standalone__: [] }; sourceGroups.forEach((row) => { buckets[String(row.groupKey)] = []; }); sourceModules.forEach((row) => { const key = row.groupKey && buckets[String(row.groupKey)] ? String(row.groupKey) : "__standalone__"; buckets[key].push(String(row.key)); }); return buckets; };
  const [groupOrder, setGroupOrder] = useState<string[]>(makeGroupOrder); const [buckets, setBuckets] = useState<Record<string, string[]>>(makeBuckets); const [dragging, setDragging] = useState(""); const [dirty, setDirty] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setGroupOrder(makeGroupOrder()); setBuckets(makeBuckets()); setDirty(false); }, [sourceSignature]);
  const groupByKey = new Map(sourceGroups.map((row) => [String(row.groupKey), row])); const moduleByKey = new Map(sourceModules.map((row) => [String(row.key), row]));
  function moveGroup(targetKey: string) { if (!dragging.startsWith("group:")) return; const moving = dragging.slice(6); if (moving === targetKey) return; setGroupOrder((current) => { const next = current.filter((key) => key !== moving); const at = next.indexOf(targetKey); next.splice(at < 0 ? next.length : at, 0, moving); return next; }); setDirty(true); }
  function moveModule(targetGroup: string, targetModule?: string) { if (!dragging.startsWith("module:")) return; const moving = dragging.slice(7); if (moving === "admin" && targetGroup === "__standalone__") { window.alert("Mục Quản trị hệ thống phải nằm trong một nhóm menu."); return; } setBuckets((current) => { const next: Record<string, string[]> = {}; Object.entries(current).forEach(([key, values]) => { next[key] = values.filter((value) => value !== moving); }); const bucket = [...(next[targetGroup] || [])]; const at = targetModule ? bucket.indexOf(targetModule) : -1; bucket.splice(at < 0 ? bucket.length : at, 0, moving); next[targetGroup] = bucket; return next; }); setDirty(true); }
  async function saveLayout() { const groupPayload = groupOrder.map((groupKey, index) => ({ groupKey, sortOrder: (index + 1) * 100 })); const modulePayload: Row[] = []; buckets.__standalone__?.forEach((moduleKey, index) => modulePayload.push({ moduleKey, groupKey: "", sortOrder: 10 + index * 10 })); groupOrder.forEach((groupKey, groupIndex) => { (buckets[groupKey] || []).forEach((moduleKey, index) => modulePayload.push({ moduleKey, groupKey, sortOrder: (groupIndex + 1) * 100 + 10 + index * 10 })); }); if (await action("reorder_menu_layout", { groups: groupPayload, modules: modulePayload })) setDirty(false); }
  function moduleCard(moduleKey: string, groupKey: string) { const item = moduleByKey.get(moduleKey); if (!item) return null; const row = data.moduleCatalog.find((mod) => mod.moduleKey === item.key) || { moduleKey: item.key, label: item.label, icon: item.icon, groupKey: item.groupKey, groupName: item.group, active: item.active, sortOrder: item.sortOrder }; return <div key={moduleKey} className={`menu-layout-item ${!item.active ? "is-hidden" : ""}`} draggable onDragStart={(event) => { event.stopPropagation(); setDragging(`module:${moduleKey}`); }} onDragEnd={(event) => { event.stopPropagation(); setDragging(""); }} onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); moveModule(groupKey, moduleKey); }}><span className="drag-handle">≡</span><i>{item.icon}</i><div><strong>{item.label}</strong><small>{item.key} · {item.active ? "Đang hiện" : "Đã ẩn"}</small></div><div className="row-actions"><button className="export-mini" onClick={() => open("moduleMaster", row)}>Sửa</button><button className="export-mini" disabled={item.key === "admin"} onClick={() => action("set_module_status", { moduleKey: item.key, active: item.active ? 0 : 1 })} title={item.active?ADMIN_HELP_TEXT.hide:ADMIN_HELP_TEXT.activate}>{item.active ? "Ẩn" : "Hiện"}</button></div></div>; }
  return <section className="card"><CardHead title="Cấu hình menu cây / chức năng" note="Nhóm cha chỉ hiện một lần trên thanh trái. Kéo thả để đổi thứ tự hoặc chuyển mục sang nhóm khác; quản trị viên có thể thêm, sửa, ẩn và xóa nhóm tùy chỉnh." action="＋ Thêm nhóm menu" onClick={() => open("menuGroupMaster")} /><div className="menu-layout-toolbar"><div><strong>Kéo thả trực tiếp</strong><span>Nhóm rỗng hoặc nhóm người dùng không có quyền sẽ tự ẩn trên sidebar. Trạng thái mở/đóng được nhớ theo từng tài khoản.</span></div><button className="primary" disabled={!dirty} onClick={() => void saveLayout()}>{dirty ? "Lưu bố cục menu →" : "Bố cục đã lưu"}</button></div>
    <div className="menu-layout-builder"><div className="menu-layout-standalone" onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); moveModule("__standalone__"); }}><header><strong>Mục độc lập</strong><small>Không có nhóm cha; thường dùng cho Tổng quan</small></header>{(buckets.__standalone__ || []).map((key) => moduleCard(key, "__standalone__"))}</div>
      {groupOrder.map((groupKey) => { const group = groupByKey.get(groupKey); if (!group) return null; return <article key={groupKey} className={`menu-layout-group ${!group.active ? "is-hidden" : ""}`} draggable onDragStart={() => setDragging(`group:${groupKey}`)} onDragEnd={() => setDragging("")} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); if (dragging.startsWith("group:")) moveGroup(groupKey); else moveModule(groupKey); }}><header><span className="drag-handle">≡</span><i>{group.icon || "▦"}</i><div><strong>{group.name}</strong><small>{group.groupKey} · {(buckets[groupKey] || []).length} mục · {group.active ? "Đang hiện" : "Đã ẩn"}</small></div><div className="row-actions"><button className="export-mini" onClick={() => open("menuGroupMaster", group)}>Sửa</button><button className="export-mini" onClick={() => action("set_menu_group_status", { groupId: group.id, active: group.active ? 0 : 1 })} title={group.active?ADMIN_HELP_TEXT.hide:ADMIN_HELP_TEXT.activate}>{group.active ? "Ẩn" : "Hiện"}</button>{!group.systemLocked && <button className="export-mini danger" onClick={() => window.confirm(`Xóa nhóm ${group.name}? Chỉ xóa được khi nhóm không còn mục con.`) && action("delete_menu_group", { groupId: group.id })}>Xóa</button>}</div></header><div className="menu-layout-children" onDragOver={(event) => { event.preventDefault(); event.stopPropagation(); }} onDrop={(event) => { event.preventDefault(); event.stopPropagation(); moveModule(groupKey); }}>{(buckets[groupKey] || []).map((key) => moduleCard(key, groupKey))}{!(buckets[groupKey] || []).length && <div className="menu-drop-empty">Thả chức năng vào đây</div>}</div></article>; })}
    </div><div className="inline-alert"><b>Nguyên tắc:</b> menu chỉ cấu hình cách hiển thị. Quyền xem/sử dụng vẫn do Bảng phân quyền quyết định; nếu một tài khoản không có mục con nào trong nhóm thì cả nhóm không xuất hiện với tài khoản đó.</div></section>;
}

function MaterialCatalogManager({ data, open, action }: { data: AppData; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean> }) {
  const categories=data.adminMaterialCategories||data.materialCategories||[];
  const subcategories=data.adminMaterialSubcategories||data.materialSubcategories||[];
  const materials=data.adminMaterials||data.materials||[];
  const [query,setQuery]=useState("");const [categoryFilter,setCategoryFilter]=useState("ALL");const [statusFilter,setStatusFilter]=useState("ALL");const [masterQuery,setMasterQuery]=useState("");const [masterCategoryFilter,setMasterCategoryFilter]=useState("ALL");const [masterSubcategoryFilter,setMasterSubcategoryFilter]=useState("ALL");const [masterStatusFilter,setMasterStatusFilter]=useState("ALL");const [selectedSubgroups,setSelectedSubgroups]=useState<Set<string>>(()=>new Set());const [selected,setSelected]=useState<Set<string>>(()=>new Set());const [pageSize,setPageSize]=useState(25);const [page,setPage]=useState(1);const [busy,setBusy]=useState(false);const [openTreeSystems,setOpenTreeSystems]=useState<string[]>([]);const [pendingSubgroupJump,setPendingSubgroupJump]=useState("");
  const isAdmin=isAdminUser(data.user);
  const materialTestResetEnabled=Boolean(data.serverInfo?.testDataResetEnabled);
  const norm=(v:unknown)=>normalizeMasterHeader(v);
  const subgroupRows=subcategories.filter((row)=>(categoryFilter==="ALL"||String(row.categoryId)===categoryFilter)&&(statusFilter==="ALL"||(statusFilter==="ACTIVE"?Number(row.active)!==0:Number(row.active)===0))&&(!query||[row.code,row.name,row.description,row.scopeExamples,row.categoryCode,row.categoryName,row.adjustmentNote].map(norm).join(" ").includes(norm(query))));
  const materialSubcategoryOptions=subcategories.filter((row)=>(masterCategoryFilter==="ALL"||String(row.categoryId)===masterCategoryFilter)&&Number(row.active)!==0).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"vi"));
  const filteredMaterials=materials.filter((row)=>(masterCategoryFilter==="ALL"||String(row.categoryId)===masterCategoryFilter)&&(masterSubcategoryFilter==="ALL"||String(row.subcategoryId)===masterSubcategoryFilter)&&(masterStatusFilter==="ALL"||(masterStatusFilter==="ACTIVE"?Number(row.active)!==0:Number(row.active)===0))&&(!masterQuery||[row.code,row.name,row.unit,row.specification,row.brand,row.categoryName,row.subcategoryName].map(norm).join(" ").includes(norm(masterQuery))));
  const pageCount=Math.max(1,Math.ceil(filteredMaterials.length/pageSize));const safePage=Math.min(page,pageCount);const shownMaterials=filteredMaterials.slice((safePage-1)*pageSize,safePage*pageSize);
  // Filter changes restart pagination and initialize the two leading tree branches.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{setPage(1);},[masterQuery,masterCategoryFilter,masterSubcategoryFilter,masterStatusFilter,pageSize]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{if(categories.length&&openTreeSystems.length===0)setOpenTreeSystems(categories.filter((r)=>Number(r.active)!==0).slice(0,2).map((r)=>String(r.id)));},[categories.length]);
  const toggleTreeSystem=(id:string)=>setOpenTreeSystems((current)=>current.includes(id)?current.filter((v)=>v!==id):[...current,id]);
  // The scroll target is cleared only after React has committed the filtered row.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{if(!pendingSubgroupJump||typeof document==='undefined')return;const node=document.querySelector(`[data-subgroup-row="${pendingSubgroupJump}"]`);if(node instanceof HTMLElement){node.scrollIntoView({behavior:'smooth',block:'center'});setPendingSubgroupJump("");}},[pendingSubgroupJump,subgroupRows.length,categoryFilter,statusFilter,query]);
  function jumpToSubgroup(row:Row){if(query)setQuery("");if(String(row.categoryId||'ALL')!==categoryFilter)setCategoryFilter(String(row.categoryId||'ALL'));if(Number(row.active)===0&&statusFilter!=="ALL")setStatusFilter("ALL");setPendingSubgroupJump(String(row.id));}
  async function importRows(file?:File){if(!file)return;try{const rows=mapMaterialCatalogRows(await parseSpreadsheetRows(file));if(window.confirm(`File có ${rows.length} mã vật tư. Mã đã có sẽ được cập nhật; mã mới sẽ được thêm. Tiếp tục?`))await action("import_material_catalog",{rows});}catch(e){window.alert(e instanceof Error?e.message:"Không đọc được danh mục vật tư.");}}
  async function deleteUnused(){if(!isAdmin)return;setBusy(true);try{const preview=await requestApi("delete_unused_materials",{preview:true});const count=Number(preview.previewCount||0);if(!count){window.alert(preview.message||"Không có mã chưa dùng để xóa.");return;}const confirmText=window.prompt(`${preview.message}\n\nThao tác chỉ xóa mã CHƯA có BOQ/MR/PO/Nhập/Xuất/Kho/Contract ledger.\nNhập: XOA ${count}`);if(confirmText===`XOA ${count}`)await action("delete_unused_materials",{confirmText});}catch(e){window.alert(e instanceof Error?e.message:"Không thể kiểm tra mã chưa dùng.");}finally{setBusy(false);}}
  async function deleteSelected(){const ids=[...selected];if(!ids.length)return;setBusy(true);try{const preview=await requestApi("delete_selected_materials",{materialIds:ids,preview:true});const allowed=Array.isArray(preview.allowed)?preview.allowed.length:0;const blocked=Array.isArray(preview.blocked)?preview.blocked.length:0;if(!allowed){window.alert(`Toàn bộ ${blocked} mã đã chọn đang có liên kết nghiệp vụ. Hãy dùng Chuyển/Hợp nhất hoặc Ngừng sử dụng.`);return;}const confirmText=window.prompt(`${preview.message}\n\n${blocked} mã có lịch sử sẽ được giữ nguyên.\nNhập: XOA ${allowed}`);if(confirmText===`XOA ${allowed}`){if(await action("delete_selected_materials",{materialIds:ids,confirmText}))setSelected(new Set());}}catch(e){window.alert(e instanceof Error?e.message:"Không thể xóa các mã đã chọn.");}finally{setBusy(false);}}
  async function bulkSubgroups(operation:"hide"|"restore"|"delete"){const ids=[...selectedSubgroups];if(!ids.length)return;const verb=operation==="hide"?"ẩn":operation==="restore"?"khôi phục":"xóa an toàn";if(!window.confirm(`${verb.toUpperCase()} ${ids.length} nhóm con đã chọn? Nhóm đang được vật tư tham chiếu sẽ không bị xóa cứng.`))return;if(await action("bulk_material_subcategory_action",{subcategoryIds:ids,operation}))setSelectedSubgroups(new Set());}
  const allSubgroupsSelected=subgroupRows.length>0&&subgroupRows.every((row)=>selectedSubgroups.has(String(row.id)));
  async function resetTest(){if(!isAdmin)return;if(!materialTestResetEnabled){window.alert("Reset danh mục vật tư test đang khóa trên server. Chỉ bật VNTECH_ALLOW_TEST_DATA_RESET=1 ở môi trường test rồi khởi động lại ứng dụng.");return;}const a=window.prompt("Nhập: RESET DANH MUC VAT TU TEST");if(a!=="RESET DANH MUC VAT TU TEST")return;const b=window.prompt("Xác nhận lần 2. Nghiệp vụ thật sẽ không bị tự động phá.\nNhập: TOI HIEU SE XOA LICH SU LIEN QUAN");if(b!=="TOI HIEU SE XOA LICH SU LIEN QUAN")return;await action("reset_material_catalog_test",{confirmText:a,confirmHistory:b,forceBusinessReset:false});}
  const toggle=(id:string)=>setSelected((cur)=>{const next=new Set(cur);if(next.has(id))next.delete(id);else next.add(id);return next;});
  const allShownSelected=shownMaterials.length>0&&shownMaterials.every((row)=>selected.has(String(row.id)));
  const proposed=subcategories.filter((row)=>String(row.reviewStatus||"proposed")==="proposed").length;
  return <div className="stack material-master-workspace" data-material-master="true">
    <section className="card material-subgroup-reference"><div className="material-subgroup-head"><div><h2>DANH MỤC NHÓM CON MÃ VẬT TƯ GỐC</h2><p>Hệ M&E → Nhóm vật tư → Mã vật tư gốc</p></div><div className="material-subgroup-kpis"><article><span>▣</span><small>Tổng hệ</small><strong>{categories.filter(r=>Number(r.active)!==0).length}</strong></article><article><span>◇</span><small>Nhóm con đề xuất</small><strong>{subcategories.filter(r=>Number(r.active)!==0).length}</strong></article><article><span>◷</span><small>Chờ duyệt</small><strong>{proposed}</strong></article></div></div>
      <div className="inline-alert compact"><b>ⓘ</b> Màn hình dùng để chuẩn hóa cấu trúc nhóm con của mã vật tư gốc trước khi nhập mã vật tư vào hệ thống.</div>
      <div className="material-subgroup-toolbar"><label className="catalog-search-main catalog-search-local"><span>⌕</span><input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Tìm kiếm nhóm vật tư / mã / vật tư"/></label><select value={categoryFilter} onChange={(e)=>setCategoryFilter(e.target.value)}><option value="ALL">Hệ M&E · Tất cả</option>{categories.map((r)=><option key={r.id} value={r.id}>{r.code} · {r.name}</option>)}</select><select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}><option value="ALL">Trạng thái · Tất cả</option><option value="ACTIVE">Đang dùng / đề xuất</option><option value="HIDDEN">Đã ẩn</option></select><button className="primary" onClick={()=>open("materialSubcategoryMaster")}>＋ Thêm nhóm con</button><button className="secondary" onClick={()=>downloadMaterialCatalogXlsx(materials,"Danh_muc_vat_tu_goc","DANH MỤC VẬT TƯ GỐC")}>⇩ Xuất Excel</button><label className="secondary file-inline">⇧ Nhập Excel<input type="file" accept=".xlsx,.csv" onChange={(e)=>{const f=e.target.files?.[0];e.target.value="";void importRows(f);}}/></label></div>
      <div className="material-admin-dangerbar"><strong>THAO TÁC NHÓM CON</strong><button className="secondary" disabled={!selectedSubgroups.size} onClick={()=>void bulkSubgroups("hide")}>Ẩn đã chọn ({selectedSubgroups.size})</button><button className="secondary" disabled={!selectedSubgroups.size} onClick={()=>void bulkSubgroups("restore")}>Khôi phục đã chọn</button><button className="secondary danger-outline" disabled={!selectedSubgroups.size} onClick={()=>void bulkSubgroups("delete")}>Xóa an toàn đã chọn</button></div>
      <div className="material-subgroup-layout"><div className="table-wrap material-subgroup-table-wrap"><table className="baseline-table material-subgroup-table"><thead><tr><th><input type="checkbox" aria-label="Chọn tất cả nhóm con đang lọc" checked={allSubgroupsSelected} onChange={()=>setSelectedSubgroups((cur)=>{const next=new Set(cur);for(const row of subgroupRows){if(allSubgroupsSelected)next.delete(String(row.id));else next.add(String(row.id));}return next;})}/></th><th>Mã hệ</th><th>Tên hệ M&E</th><th>Mã nhóm con</th><th>Tên nhóm vật tư</th><th>Phạm vi / ví dụ gồm</th><th>Trạng thái</th><th>Ý kiến điều chỉnh</th><th>Thao tác</th></tr></thead><tbody>{subgroupRows.map((row,index)=><tr key={row.id} data-subgroup-row={row.id}><td><input type="checkbox" aria-label={`Chọn nhóm ${row.name}`} checked={selectedSubgroups.has(String(row.id))} onChange={()=>setSelectedSubgroups((cur)=>{const next=new Set(cur);const key=String(row.id);if(next.has(key))next.delete(key);else next.add(key);return next;})}/><small>{index+1}</small></td><td><strong className="code">{row.categoryCode||"—"}</strong></td><td>{row.categoryName||"—"}</td><td><strong className="code">{row.code||"—"}</strong></td><td>{row.name}</td><td>{sanitizeUiText(row.scopeExamples||row.description||"—")||"—"}</td><td><StatusBadge value={Number(row.active)===0?"Đã ẩn":String(row.reviewStatus||"proposed")==="approved"?"Đã duyệt":"Đề xuất"}/></td><td>{sanitizeUiText(row.adjustmentNote||"💬")||"💬"}</td><td><div className="row-actions"><button className="export-mini" onClick={()=>open("materialSubcategoryMaster",row)}>Sửa</button><button className="export-mini" onClick={()=>action("set_material_subcategory_status",{subcategoryId:row.id,active:Number(row.active)===0?1:0})}>{Number(row.active)===0?"Hiện":"Ẩn"}</button><button className="export-mini danger" onClick={()=>window.confirm(`Xóa nhóm con ${row.name}? Chỉ thực hiện khi nhóm chưa còn liên kết cần giữ.`)&&action("delete_material_subcategory",{subcategoryId:row.id})}>Xóa</button></div></td></tr>)}{!subgroupRows.length&&<tr><td colSpan={9}><Empty text="Chưa có nhóm con phù hợp bộ lọc."/></td></tr>}</tbody></table></div><aside className="material-subgroup-tree"><header><strong>Xem nhanh cấu trúc nhóm</strong><small>Bấm nhóm con để nhảy tới đúng dòng bên trái.</small></header>{categories.filter((cat)=>Number(cat.active)!==0).map((cat)=>{const treeRows=subcategories.filter((sub)=>String(sub.categoryId)===String(cat.id)&&Number(sub.active)!==0);const expanded=openTreeSystems.includes(String(cat.id));return <div key={cat.id} className={`quick-tree-system ${expanded?"expanded":"collapsed"}`}><button type="button" onClick={()=>toggleTreeSystem(String(cat.id))} aria-expanded={expanded}><span className="quick-tree-chevron">{expanded?"⌄":"›"}</span><strong>{cat.name}</strong><small>{treeRows.length}</small></button>{expanded&&<ul>{treeRows.map((sub)=><li key={sub.id}><button type="button" className="quick-tree-jump" onClick={()=>jumpToSubgroup(sub)}><span>◦</span><b>{sanitizeUiText(sub.name)||"Chưa phân nhóm"}</b></button></li>)}{!treeRows.length&&<li className="empty"><span>◦</span><b>Chưa phân nhóm</b></li>}</ul>}</div>})}</aside></div>
    </section>
    <section className="card material-master-list"><div className="material-master-list-head"><div><h2>MÃ VẬT TƯ GỐC</h2><p>Dữ liệu dùng chung toàn công ty. Phần trên dùng chuẩn hóa Hệ M&E / Nhóm vật tư; phần dưới dùng quản lý từng mã vật tư gốc.</p></div><div className="row-actions"><button className="primary" onClick={()=>open("materialMaster")}>＋ Thêm vật tư</button><button className="secondary" onClick={downloadMaterialCatalogTemplateXlsx}>⇩ Mẫu Excel 9 cột</button><label className="secondary file-inline">⇧ Nhập Excel<input type="file" accept=".xlsx,.csv" onChange={(e)=>{const f=e.target.files?.[0];e.target.value="";void importRows(f);}}/></label><button className="secondary" onClick={()=>downloadMaterialCatalogXlsx(materials,"Danh_muc_vat_tu_goc","DANH MỤC VẬT TƯ GỐC")}>⇩ Xuất Excel</button></div></div>
      <div className="material-subgroup-reference-note"><span>⌕</span><p>Tìm kiếm và lọc riêng cho danh sách <b>Mã vật tư gốc</b> để tránh rối với khối quản lý nhóm con phía trên.</p></div>
      <div className="material-subgroup-toolbar material-master-toolbar"><label className="catalog-search-main catalog-search-local"><span>⌕</span><input value={masterQuery} onChange={(e)=>setMasterQuery(e.target.value)} placeholder="Tìm mã vật tư, tên vật tư, quy cách, hãng..."/></label><select value={masterCategoryFilter} onChange={(e)=>{setMasterCategoryFilter(e.target.value);setMasterSubcategoryFilter("ALL");}}><option value="ALL">Hệ M&E · Tất cả</option>{categories.map((r)=><option key={r.id} value={r.id}>{r.code} · {r.name}</option>)}</select><select value={masterSubcategoryFilter} onChange={(e)=>setMasterSubcategoryFilter(e.target.value)}><option value="ALL">Nhóm vật tư · Tất cả</option>{materialSubcategoryOptions.map((r)=><option key={r.id} value={r.id}>{r.name}</option>)}</select><select value={masterStatusFilter} onChange={(e)=>setMasterStatusFilter(e.target.value)}><option value="ALL">Trạng thái · Tất cả</option><option value="ACTIVE">Đang dùng</option><option value="HIDDEN">Đã ẩn</option></select></div>
      {isAdmin&&<div className="material-admin-dangerbar"><strong>QUẢN TRỊ DỮ LIỆU</strong><button className="secondary" disabled={busy||!selected.size} onClick={()=>void deleteSelected()}>Xóa mã đã chọn ({selected.size})</button><button className="secondary danger-outline" disabled={busy} onClick={()=>void deleteUnused()}>Xóa toàn bộ mã chưa phát sinh dữ liệu</button><button className="secondary" disabled={busy} onClick={()=>open("materialMerge")}>Chuyển / Hợp nhất mã</button><button className="secondary danger-outline" disabled={busy||!materialTestResetEnabled} title={materialTestResetEnabled?"Reset danh mục vật tư test chưa có lịch sử nghiệp vụ":"Đang khóa: cần VNTECH_ALLOW_TEST_DATA_RESET=1 trên server test"} onClick={()=>void resetTest()}>{materialTestResetEnabled?"Reset danh mục vật tư test":"Reset vật tư test · Đang khóa"}</button></div>}
      <div className="table-wrap"><table className="baseline-table resizable-data-table"><thead><tr><th><input type="checkbox" checked={allShownSelected} onChange={()=>setSelected((cur)=>{const next=new Set(cur);for(const r of shownMaterials){if(allShownSelected)next.delete(String(r.id));else next.add(String(r.id));}return next;})}/></th><th>Mã vật tư</th><th>Tên vật tư</th><th>Hệ M&E</th><th>Tên nhóm vật tư</th><th>ĐVT</th><th>Quy cách / Thông số</th><th>Hãng / NSX</th><th>Tồn tối thiểu</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{shownMaterials.map((item)=><tr key={item.id}><td><input type="checkbox" checked={selected.has(String(item.id))} onChange={()=>toggle(String(item.id))}/></td><td><strong className="code">{item.code}</strong></td><td><strong>{item.name}</strong></td><td>{item.categoryName||item.system||"—"}</td><td>{item.subcategoryName||"—"}</td><td>{item.unit||"—"}</td><td>{item.specification||"—"}</td><td>{item.brand||"—"}</td><td>{format.format(Number(item.minStock||0))}</td><td><StatusBadge value={Number(item.active)===0?"Đã ẩn":"Đang dùng"}/></td><td><div className="row-actions"><button className="export-mini" onClick={()=>open("materialMaster",item)}>Sửa</button><button className="export-mini" onClick={()=>action("set_material_status",{materialId:item.id,active:Number(item.active)===0?1:0})}>{Number(item.active)===0?"Hiện":"Ẩn"}</button>{isAdmin&&<><button className="export-mini" onClick={()=>open("materialMerge",item)}>Merge</button><button className="export-mini danger" onClick={async()=>{try{const preview=await requestApi("delete_material",{materialId:item.id,preview:true});if(preview.impact?.canHardDelete&&window.confirm(`Mã ${item.code} chưa phát sinh dữ liệu. Xóa thật?`))await action("delete_material",{materialId:item.id,confirmText:`XOA ${item.code}`});else if(!preview.impact?.canHardDelete)window.alert(`${preview.message}\nHãy Sửa / Chuyển-Hợp nhất / Ngừng sử dụng thay vì để mã sai thành rác.`);}catch(e){window.alert(e instanceof Error?e.message:"Không kiểm tra được dependency.");}}}>Xóa</button></>}</div></td></tr>)}{!shownMaterials.length&&<tr><td colSpan={11}><Empty text="Chưa có mã vật tư phù hợp bộ lọc."/></td></tr>}</tbody></table></div><div className="table-pagination"><span>Hiển thị {(safePage-1)*pageSize+1}-{Math.min(safePage*pageSize,filteredMaterials.length)} / {filteredMaterials.length} bản ghi</span><label>Hiển thị <select value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option><option value={250}>250</option></select> bản ghi/trang</label><div className="row-actions"><button className="secondary" disabled={safePage<=1} onClick={()=>setPage(Math.max(1,safePage-1))}>‹</button><strong>{safePage} / {pageCount}</strong><button className="secondary" disabled={safePage>=pageCount} onClick={()=>setPage(Math.min(pageCount,safePage+1))}>›</button></div></div>
    </section>
  </div>;
}

const ADMIN_HELP_TEXT = {
  visible: "Bật: cột xuất hiện trên màn hình người dùng. Tắt: chỉ ẩn trên giao diện; dữ liệu đang lưu không bị xóa. Thiết lập này độc lập với Import và Export.",
  required: "Bật: trường bắt buộc phải có dữ liệu khi tạo/nhập nghiệp vụ. Tắt: có thể để trống. Không làm mất dữ liệu đã có.",
  importable: "Bật: cột xuất hiện trong mẫu Excel/CSV nhập liệu và hệ thống đọc cột này khi Import. Tắt: cột không được dùng để nhập. Thiết lập này độc lập với Hiện và Export.",
  exportable: "Bật: cột được đưa ra file Excel/CSV/PDF khi xuất dữ liệu. Tắt: dữ liệu vẫn còn trong hệ thống nhưng không xuất ra báo cáo/file.",
  editable: "Bật: người có quyền Sửa phù hợp được chỉnh giá trị trường. Tắt: trường chỉ đọc. Trường hệ thống tự tính/link luôn bị khóa sửa trực tiếp.",
  position: "Quy định vị trí cột trong bảng/mẫu. Vị trí 1 đứng trước vị trí 2. Nút ↑/↓ di chuyển một bước và hệ thống tự đánh lại thứ tự 1…N.",
  dataType: "Quy định kiểu dữ liệu mà trường nhận: chữ, số, ngày, danh sách hoặc ghi chú dài. Chọn sai kiểu có thể làm dữ liệu nhập không hợp lệ.",
  fieldKey: "Khóa kỹ thuật dùng để liên kết dữ liệu. Người vận hành không cần nhập/sửa khóa trường hệ thống. Cột tùy chỉnh mới phải có khóa duy nhất.",
  permissionView: "Cho phép mở chức năng và xem dữ liệu trong phạm vi dự án được gán. Các quyền Tạo/Sửa/Duyệt/Xuất sẽ tự bật Xem khi cần.",
  permissionUse: "Cho phép thực hiện thao tác nghiệp vụ thông thường của chức năng. Quyền này không tự cho phép sửa dữ liệu gốc nếu chưa bật Sửa.",
  permissionCreate: "Cho phép tạo mới phiếu/chứng từ/dữ liệu của chức năng. Khi bật, hệ thống tự bật Xem và Thao tác.",
  permissionEdit: "Cho phép chỉnh sửa dữ liệu đã tồn tại trong phạm vi được cấp. Khi bật, hệ thống tự bật Xem và Thao tác.",
  permissionApprove: "Cho phép phê duyệt/xác nhận nghiệp vụ nếu người dùng đồng thời đúng cấp workflow. Khi bật, hệ thống tự bật Xem và Thao tác.",
  permissionExport: "Cho phép xuất Excel/CSV/PDF hoặc tải dữ liệu. Khi bật, hệ thống tự bật Xem.",
  permissionExpiry: "Thời điểm toàn bộ quyền của dòng chức năng này tự hết hiệu lực. Để trống nếu quyền không có ngày hết hạn.",
  hide: "Ẩn mục khỏi giao diện người dùng nhưng giữ nguyên dữ liệu và lịch sử. Có thể bật Hiện/Kích hoạt lại sau.",
  activate: "Hiển thị/kích hoạt lại mục đã ẩn. Dữ liệu lịch sử trước đó vẫn được giữ nguyên.",
} as const;

function HelpTip({ text, label="Giải thích" }: { text:string; label?:string }) {
  return <details className="admin-help-tip"><summary aria-label={label} title={label}>?</summary><span>{text}</span></details>;
}
function TriStateCheckbox({ checked, some, disabled=false, title, onChange }: { checked:boolean; some:boolean; disabled?:boolean; title:string; onChange:(checked:boolean)=>void }) {
  return <input type="checkbox" checked={checked} disabled={disabled} title={title} aria-label={title} ref={(node)=>{if(node)node.indeterminate=!checked&&some;}} onChange={(event)=>onChange(event.target.checked)}/>;
}

function FormFieldConfigPanel({ data, action, formKey, title, note }: { data: AppData; action: (name: string, payload: Row) => Promise<boolean>; formKey:"boq"|"boq_purchase"|"request_header"|"request_line"; title:string; note:string }) {
  const rows=configuredFormFields(data.formFieldConfigs,formKey).filter((row)=>!(formKey==="boq"&&row.fieldKey==="sourceOrder"));
  const isPurchase=formKey==="boq_purchase";
  const normalizeItem=(row:FormFieldConfig,overrides:Row={}):Row=>({id:row.id||null,fieldKey:row.fieldKey,displayName:row.displayName,dataType:row.dataType||"text",sourceKind:row.sourceKind||"core",visible:Boolean(row.visible),required:Boolean(row.required),importable:isPurchase?false:Boolean(row.importable),exportable:Boolean(row.exportable),editable:isPurchase?false:Boolean(row.editable),systemLocked:Boolean(row.systemLocked),active:row.active!==false,optionsJson:row.optionsJson||null,...overrides});
  const moveToPosition=(items:Row[],fieldKey:string,requestedPosition:number)=>{const ordered=[...items];const current=ordered.findIndex(item=>item.fieldKey===fieldKey);if(current<0)return ordered;const target=Math.max(0,Math.min(ordered.length-1,Math.trunc(requestedPosition)-1));const [moving]=ordered.splice(current,1);ordered.splice(target,0,moving);return ordered.map((item,index)=>({...item,sortOrder:index+1}));};
  async function persistOrder(items:Row[]){return action("reorder_form_fields",{formKey,items:items.map((item,index)=>({...item,sortOrder:index+1}))});}
  async function move(row:FormFieldConfig,direction:-1|1){const index=rows.findIndex(item=>item.fieldKey===row.fieldKey);if(index<0)return;const items=rows.map(item=>normalizeItem(item));await persistOrder(moveToPosition(items,row.fieldKey,index+1+direction));}
  async function save(event:FormEvent<HTMLFormElement>,row:FormFieldConfig){event.preventDefault();const v=Object.fromEntries(new FormData(event.currentTarget));const position=Math.max(1,Math.min(rows.length,Math.trunc(Number(v.position)||1)));const updated=normalizeItem(row,{displayName:String(v.displayName||row.displayName),dataType:String(v.dataType||row.dataType||"text"),visible:Boolean(v.visible),required:isPurchase?false:Boolean(v.required),importable:isPurchase?false:Boolean(v.importable),exportable:Boolean(v.exportable),editable:isPurchase||row.sourceKind==="system"?false:Boolean(v.editable)});const items=rows.map(item=>item.fieldKey===row.fieldKey?updated:normalizeItem(item));await persistOrder(moveToPosition(items,row.fieldKey,position));}
  async function add(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=event.currentTarget;const v=Object.fromEntries(new FormData(form));const fieldKey=String(v.fieldKey||"").trim();const position=Math.max(1,Math.min(rows.length+1,Math.trunc(Number(v.position)||rows.length+1)));const newItem:Row={fieldKey,displayName:String(v.displayName||"").trim(),dataType:String(v.dataType||"text"),sourceKind:"custom",visible:true,required:false,importable:isPurchase?false:true,exportable:true,editable:isPurchase?false:true,systemLocked:false,active:true};const items=[...rows.map(item=>normalizeItem(item)),newItem];if(await persistOrder(moveToPosition(items,fieldKey,position)))form.reset();}
  const eligibleFor=(row:FormFieldConfig,flag:"visible"|"required"|"importable"|"exportable"|"editable")=>!(isPurchase&&["required","importable","editable"].includes(flag))&&!(flag==="editable"&&row.sourceKind==="system");
  const flagState=(flag:"visible"|"required"|"importable"|"exportable"|"editable")=>{const eligible=rows.filter((row)=>eligibleFor(row,flag));const selected=eligible.filter((row)=>Boolean(row[flag])).length;return{all:eligible.length>0&&selected===eligible.length,some:selected>0&&selected<eligible.length,disabled:eligible.length===0};};
  async function bulkToggle(flag:"visible"|"required"|"importable"|"exportable"|"editable",checked:boolean){const label={visible:"Hiện",required:"Bắt buộc",importable:"Import",exportable:"Export",editable:"Cho sửa"}[flag];if(!window.confirm(`${checked?"Bật":"Tắt"} “${label}” cho tất cả ${rows.length} cột của ${title}?`))return;const items=rows.map((row)=>normalizeItem(row,eligibleFor(row,flag)?{[flag]:checked}:{}));const ok=await persistOrder(items);if(ok){document.querySelectorAll(`[data-form-config="${formKey}"] input[name="${flag}"]`).forEach((node)=>{if(node instanceof HTMLInputElement&&!node.disabled)node.checked=checked;});}}
  const states={visible:flagState("visible"),required:flagState("required"),importable:flagState("importable"),exportable:flagState("exportable"),editable:flagState("editable")};
  const HeaderFlag=({flag,label,help}:{flag:"visible"|"required"|"importable"|"exportable"|"editable";label:string;help:string})=>{const state=states[flag];return <th><div className="config-head-with-help"><span>{label}</span><HelpTip text={help}/></div><div className="bulk-check"><TriStateCheckbox checked={state.all} some={state.some} disabled={state.disabled} title={`${state.all?"Bỏ chọn":"Chọn"} tất cả: ${label}`} onChange={(checked)=>void bulkToggle(flag,checked)}/><small>Tất cả</small></div></th>;};
  // HeaderFlag closes over the current bulk-selection state by design.
  // eslint-disable-next-line react-hooks/static-components
  return <section className={`card dynamic-fields dynamic-fields-${formKey}`} data-form-config={formKey}><div className="table-toolbar"><div><strong>{title}</strong><span>{note}</span></div><div className="row-actions">{formKey==="boq"&&<><button className="secondary" title="Tải mẫu Excel theo đúng các cột đang bật Import, đúng tên và thứ tự đã lưu." onClick={()=>downloadBoqTemplateXlsx(rows)}>⇩ Mẫu Excel đúng cấu hình BOQ</button><button className="secondary" title="Tải mẫu CSV theo đúng các cột đang bật Import, đúng tên và thứ tự đã lưu." onClick={()=>downloadBoqTemplateCsv(rows)}>⇩ Mẫu CSV đúng cấu hình BOQ</button></>}</div></div>{formKey==="boq"&&<div className="inline-alert"><b>BOQ/Hợp đồng:</b> Mẫu nhập lấy CHÍNH XÁC các cột đang bật <b>Import</b> trong bảng này, theo đúng tên và vị trí đã lưu. Cờ Hiện/Export không được phép làm thay đổi mẫu nhập. <b>Thứ tự nguồn:</b> hệ thống tự lấy theo vị trí dòng trong file Excel và không xuất hiện trong mẫu nhập.</div>}{isPurchase&&<div className="inline-alert"><b>Lũy kế mua hàng:</b> đây là bảng kiểm soát phát sinh từ Đề nghị → Duyệt → PO → Thực nhận → Tồn kho → Còn thiếu. Không nhập dữ liệu trực tiếp từ Excel và không dùng chung cấu hình với BOQ/Hợp đồng.</div>}<div className="table-wrap"><table><thead><tr><th><div className="config-head-with-help"><span>Khóa trường</span><HelpTip text={ADMIN_HELP_TEXT.fieldKey}/></div></th><th>Tên hiển thị</th><th><div className="config-head-with-help"><span>Kiểu</span><HelpTip text={ADMIN_HELP_TEXT.dataType}/></div></th><th><div className="config-head-with-help"><span>Vị trí 1…N</span><HelpTip text={ADMIN_HELP_TEXT.position}/></div></th><HeaderFlag flag="visible" label="Hiện" help={ADMIN_HELP_TEXT.visible}/><HeaderFlag flag="required" label="Bắt buộc" help={ADMIN_HELP_TEXT.required}/><HeaderFlag flag="importable" label="Import" help={ADMIN_HELP_TEXT.importable}/><HeaderFlag flag="exportable" label="Export" help={ADMIN_HELP_TEXT.exportable}/><HeaderFlag flag="editable" label="Cho sửa" help={ADMIN_HELP_TEXT.editable}/><th>Thao tác</th></tr></thead><tbody>{rows.map((row,index)=><tr key={`${formKey}:${row.fieldKey}`}><td><strong className="code">{row.fieldKey}</strong><small>{row.sourceKind==="custom"?"Tùy chỉnh":row.sourceKind==="system"?"Hệ thống tự tính/link":"Trường nghiệp vụ"}</small></td><td colSpan={9}><form className="field-config-row" onSubmit={(e)=>void save(e,row)}><input name="displayName" defaultValue={row.displayName} title="Tên người dùng nhìn thấy trên màn hình và file xuất/nhập theo cấu hình."/><select name="dataType" defaultValue={row.dataType||"text"} title={ADMIN_HELP_TEXT.dataType}><option value="text">Chữ</option><option value="number">Số</option><option value="date">Ngày</option><option value="select">Danh sách</option><option value="textarea">Ghi chú dài</option></select><div className="field-order-control"><input name="position" type="number" min="1" max={rows.length} defaultValue={index+1} aria-label={`Vị trí ${row.displayName}`} title={ADMIN_HELP_TEXT.position}/><button type="button" className="order-arrow" disabled={index===0} title="Đưa lên trước · di chuyển cột lên một vị trí" onClick={()=>void move(row,-1)}>↑</button><button type="button" className="order-arrow" disabled={index===rows.length-1} title="Đưa xuống sau · di chuyển cột xuống một vị trí" onClick={()=>void move(row,1)}>↓</button></div><label title={ADMIN_HELP_TEXT.visible}><input name="visible" type="checkbox" defaultChecked={Boolean(row.visible)}/> Hiện</label><label title={isPurchase?"Lũy kế mua hàng là dữ liệu hệ thống, không có trường bắt buộc nhập.":ADMIN_HELP_TEXT.required}><input name="required" type="checkbox" defaultChecked={Boolean(row.required)} disabled={isPurchase}/> Bắt buộc</label><label title={isPurchase?"Lũy kế mua hàng không nhập trực tiếp từ Excel/CSV.":ADMIN_HELP_TEXT.importable}><input name="importable" type="checkbox" defaultChecked={Boolean(row.importable)} disabled={isPurchase}/> Import</label><label title={ADMIN_HELP_TEXT.exportable}><input name="exportable" type="checkbox" defaultChecked={Boolean(row.exportable)}/> Export</label><label title={isPurchase?"Lũy kế là số liệu tính/link từ nghiệp vụ, không sửa trực tiếp.":ADMIN_HELP_TEXT.editable}><input name="editable" type="checkbox" defaultChecked={Boolean(row.editable)} disabled={isPurchase||row.sourceKind==="system"}/> Sửa</label><button className="export-mini" title="Lưu cấu hình của riêng cột này.">Lưu</button>{!row.systemLocked&&<button type="button" className="export-mini danger" title="Bỏ cột khỏi biểu mẫu nhưng vẫn giữ dữ liệu lịch sử." onClick={()=>window.confirm(`Xóa cột ${row.displayName}? Dữ liệu lịch sử của cột sẽ được giữ.`)&&action("delete_form_field_config",{id:row.id,formKey,fieldKey:row.fieldKey})}>Xóa</button>}</form></td></tr>)}</tbody></table></div><form className="dynamic-field-add" onSubmit={(e)=>void add(e)}><strong>＋ Thêm cột tùy chỉnh vào {title}</strong><input name="fieldKey" required pattern="[A-Za-z][A-Za-z0-9_]*" placeholder="vd: marNo" title={ADMIN_HELP_TEXT.fieldKey}/><input name="displayName" required placeholder="Tên cột hiển thị"/><select name="dataType" defaultValue="text" title={ADMIN_HELP_TEXT.dataType}><option value="text">Chữ</option><option value="number">Số</option><option value="date">Ngày</option><option value="select">Danh sách</option><option value="textarea">Ghi chú dài</option></select><input name="position" type="number" min="1" max={rows.length+1} defaultValue={rows.length+1} title={ADMIN_HELP_TEXT.position}/><button className="primary" title="Thêm trường tùy chỉnh vào đúng biểu mẫu này; không ảnh hưởng biểu mẫu độc lập khác.">Thêm cột</button></form></section>;
}

function FormFieldConfigManager({ data, action }: { data: AppData; action: (name: string, payload: Row) => Promise<boolean> }) {
  return <div className="stack independent-form-configs">
    <FormFieldConfigPanel data={data} action={action} formKey="boq" title="CẤU HÌNH RIÊNG · BOQ / HỢP ĐỒNG" note="Chỉ điều khiển dữ liệu nguồn BOQ/Hợp đồng và Mẫu nhập BOQ. Không tác động Lũy kế mua hàng."/>
    <FormFieldConfigPanel data={data} action={action} formKey="boq_purchase" title="CẤU HÌNH RIÊNG · LŨY KẾ MUA HÀNG" note="Chỉ điều khiển bảng đối chiếu mua sắm và file xuất Lũy kế. Không tác động BOQ/Hợp đồng."/>
    <FormFieldConfigPanel data={data} action={action} formKey="request_header" title="Cấu hình riêng · Đầu phiếu đề nghị" note="Tên trường, thứ tự và bắt buộc của phần đầu Phiếu đề nghị."/>
    <FormFieldConfigPanel data={data} action={action} formKey="request_line" title="Cấu hình riêng · Dòng vật tư đề nghị" note="Tên trường, thứ tự, Import/Export và chỉnh sửa của dòng vật tư đề nghị."/>
  </div>;
}

function UiDisplaySettingsManager({data,action}:{data:AppData;action:(name:string,payload:Row)=>Promise<boolean>}){
  const settings=data.uiDisplaySettings||{};async function save(event:FormEvent<HTMLFormElement>){event.preventDefault();await action("save_ui_display_settings",Object.fromEntries(new FormData(event.currentTarget)));}
  return <section className="card"><div className="table-toolbar"><div><strong>Tùy chỉnh hiển thị toàn phần mềm</strong><span>Áp dụng chung cho menu, biểu mẫu, bảng, hộp thoại, báo cáo và module bổ sung sau này.</span></div></div><form className="ui-display-settings" onSubmit={event=>void save(event)}><label>Font chữ<select name="fontFamily" defaultValue={settings.fontFamily||"Segoe UI"}><option>Segoe UI</option><option>Arial</option><option>Tahoma</option><option>Roboto</option><option>Times New Roman</option></select></label><label>Cỡ chữ chung<input name="baseFontSize" type="number" min="14" max="20" defaultValue={settings.baseFontSize||16}/></label><label>Cỡ tiêu đề<input name="headingFontSize" type="number" min="22" max="34" defaultValue={settings.headingFontSize||28}/></label><label>Cỡ tên vật tư<input name="materialNameSize" type="number" min="14" max="22" defaultValue={settings.materialNameSize||16}/></label><label>Cỡ mã vật tư<input name="materialCodeSize" type="number" min="13" max="20" defaultValue={settings.materialCodeSize||15}/></label><label>Màu chữ chung<input name="textColor" type="color" defaultValue={settings.textColor||"#111827"}/></label><label>Màu chữ phụ<input name="mutedColor" type="color" defaultValue={settings.mutedColor||"#52687a"}/></label><label>Màu tên vật tư<input name="materialNameColor" type="color" defaultValue={settings.materialNameColor||"#111827"}/></label><label>Màu mã vật tư<input name="materialCodeColor" type="color" defaultValue={settings.materialCodeColor||"#0969a8"}/></label><label>Mật độ mặc định<select name="rowDensity" defaultValue={settings.rowDensity||"normal"}><option value="compact">Gọn</option><option value="normal">Vừa</option><option value="comfortable">Rộng</option></select></label><button className="primary">Áp dụng toàn công ty</button></form></section>;
}

function BusinessRoleGroupManager({data,action}:{data:AppData;action:(name:string,payload:Row)=>Promise<boolean>}){
  const profiles:Row[]=(data.engineRoleProfiles?.length?data.engineRoleProfiles:Object.entries(roleNames).map(([engineKey,displayName],index)=>({id:`fallback-${engineKey}`,engineKey,companyCode:engineKey,displayName,description:"",sortOrder:index+1,active:1}))).filter(row=>row.engineKey!=="admin").sort((a,b)=>Number(a.sortOrder)-Number(b.sortOrder));
  const scopes=(data.businessScopes||[]).filter(row=>row.code!=="admin").sort((a,b)=>Number(a.sortOrder)-Number(b.sortOrder));
  const groups=data.businessRoleGroups.filter(row=>row.code!=="admin");
  async function saveGroup(event:FormEvent<HTMLFormElement>,row?:Row){event.preventDefault();const form=event.currentTarget;const fd=new FormData(form);const payload=Object.fromEntries(fd);const scopeIds=fd.getAll("scopeIds").map(String).filter(Boolean);if(!scopeIds.length){window.alert("Chọn ít nhất một Phạm vi nghiệp vụ.");return;}if(await action("save_business_role_group",{...payload,scopeIds,groupId:row?.id}))if(!row)form.reset();}
  async function saveProfile(event:FormEvent<HTMLFormElement>,row:Row){event.preventDefault();await action("save_engine_role_profile",{...Object.fromEntries(new FormData(event.currentTarget)),profileId:row.id,engineKey:row.engineKey});}
  async function saveScope(event:FormEvent<HTMLFormElement>,row?:Row){event.preventDefault();const form=event.currentTarget;const payload=Object.fromEntries(new FormData(form));if(await action("save_business_scope",{...payload,scopeId:row?.id}))if(!row)form.reset();}
  return <section className="card business-role-manager"><div className="table-toolbar"><div><strong>Nhóm quyền nghiệp vụ · Phạm vi nghiệp vụ</strong><span>Toàn bộ danh mục hiển thị cho Quản trị viên là dữ liệu động; thay đổi được dùng lại ở Chức danh, tài khoản, import và workflow.</span></div></div><div className="inline-alert"><b>Nguyên tắc:</b> Phòng/Bộ phận là Cơ cấu tổ chức; Phạm vi nghiệp vụ là phạm vi công việc; Nhóm quyền gom một hoặc nhiều phạm vi; Chức danh tham chiếu Nhóm quyền. Không dùng nhãn hard-code để thay cho Organization Master.</div>
    <div className="business-role-subhead"><strong>1. Phạm vi nghiệp vụ</strong><span>Quản trị viên tự thêm, sửa, ẩn, khôi phục hoặc xóa phạm vi chưa được sử dụng.</span></div>
    <div className="table-wrap"><table><thead><tr><th>Mã phạm vi</th><th>Tên phạm vi</th><th>Thứ tự</th><th>Mô tả</th><th>Thao tác</th></tr></thead><tbody>{scopes.map((row,index)=><tr key={row.id}><td colSpan={5}><form className="engine-profile-row" onSubmit={event=>void saveScope(event,row)}><input name="code" aria-label={`Mã phạm vi ${row.code}`} defaultValue={row.code} required pattern="[a-z0-9_-]+"/><input name="name" aria-label={`Tên phạm vi ${row.code}`} defaultValue={row.name} required/><input name="sortOrder" aria-label={`Thứ tự phạm vi ${row.code}`} type="number" min="1" defaultValue={row.sortOrder??index+1}/><input name="description" aria-label={`Mô tả phạm vi ${row.code}`} defaultValue={row.description||""} placeholder="Mô tả"/><div className="row-actions"><button className="export-mini">Lưu</button><button type="button" className="export-mini" onClick={()=>void action("set_business_scope_status",{scopeId:row.id,active:row.active?0:1})}>{row.active?"Ẩn":"Khôi phục"}</button>{!row.systemLocked&&<button type="button" className="export-mini danger" onClick={()=>window.confirm(`Xóa phạm vi ${row.name}? Chỉ xóa được khi chưa được nhóm quyền sử dụng.`)&&void action("delete_business_scope",{scopeId:row.id})}>Xóa</button>}</div></form></td></tr>)}</tbody></table></div>
    <form className="dynamic-field-add business-group-add" onSubmit={event=>void saveScope(event)}><strong>＋ Thêm phạm vi nghiệp vụ</strong><input name="code" required pattern="[a-z0-9_-]+" placeholder="ma_pham_vi"/><input name="name" required placeholder="Tên phạm vi"/><input name="sortOrder" type="number" min="1" defaultValue={scopes.length+1}/><input name="description" placeholder="Mô tả"/><button className="primary">Thêm phạm vi</button></form>
    <div className="business-role-subhead"><strong>2. Quyền nền kỹ thuật</strong><span>Lớp liên kết nội bộ giữ tương thích workflow/API; Quản trị viên có thể đổi mã hiển thị, tên, mô tả nhưng hệ thống giữ khóa kỹ thuật để không mất lịch sử.</span></div>
    <div className="table-wrap"><table><thead><tr><th>Mã quyền nền tại công ty</th><th>Tên quyền nền tại công ty</th><th>Thứ tự</th><th>Mô tả</th><th>Thao tác</th></tr></thead><tbody>{profiles.map((row,index)=><tr key={row.id}><td colSpan={5}><form className="engine-profile-row" onSubmit={event=>void saveProfile(event,row)}><input name="companyCode" aria-label={`Mã quyền nền ${row.engineKey}`} defaultValue={row.companyCode} required pattern="[a-z0-9_-]+"/><input name="displayName" aria-label={`Tên quyền nền ${row.engineKey}`} defaultValue={row.displayName} required/><input name="sortOrder" aria-label={`Thứ tự quyền nền ${row.engineKey}`} type="number" min="1" max={profiles.length} defaultValue={index+1}/><input name="description" aria-label={`Mô tả quyền nền ${row.engineKey}`} defaultValue={row.description||""} placeholder="Mô tả"/><button className="export-mini">Lưu quyền nền</button></form></td></tr>)}</tbody></table></div>
    <div className="business-role-subhead"><strong>3. Nhóm quyền nghiệp vụ</strong><span>Mỗi nhóm có thể gắn một hoặc nhiều Phạm vi nghiệp vụ; danh sách bên dưới lấy trực tiếp từ danh mục động phía trên.</span></div>
    <div className="table-wrap"><table><thead><tr><th>Mã nhóm</th><th>Tên nhóm</th><th>Phạm vi nghiệp vụ</th><th>Quyền nền</th><th>Thứ tự</th><th>Mô tả</th><th>Thao tác</th></tr></thead><tbody>{groups.map((row,index)=><tr key={row.id}><td colSpan={7}><form id={`business-role-${row.id}`} className="business-group-row" onSubmit={event=>void saveGroup(event,row)}><div><input name="code" aria-label={`Mã nhóm ${row.code}`} defaultValue={row.code} required pattern="[a-z0-9_-]+"/><small>{row.systemLocked?"Nhóm gốc – được đổi mã, không xóa cứng":"Nhóm tùy chỉnh"}</small></div><input name="name" aria-label={`Tên nhóm ${row.code}`} defaultValue={row.name} required/><select name="scopeIds" multiple size={Math.min(4,Math.max(2,scopes.length))} aria-label={`Phạm vi nghiệp vụ ${row.code}`} defaultValue={(row.scopeIds||[]).map(String)}>{scopes.filter(scope=>scope.active||(row.scopeIds||[]).includes(scope.id)).map(scope=><option key={scope.id} value={scope.id}>{scope.code} · {scope.name}{scope.active?"":" (đã ẩn)"}</option>)}</select><select name="engineRole" aria-label={`Quyền nền ${row.code}`} defaultValue={row.engineRole}>{profiles.map(profile=><option key={profile.engineKey} value={profile.engineKey}>{profile.companyCode} · {profile.displayName}</option>)}</select><input name="sortOrder" aria-label={`Thứ tự ${row.code}`} type="number" min="1" defaultValue={row.sortOrder??index+1}/><input name="description" aria-label={`Mô tả ${row.code}`} defaultValue={row.description||""} placeholder="Mô tả"/><div className="row-actions"><button className="export-mini">Lưu thay đổi</button><button type="button" className="export-mini" onClick={()=>void action("set_business_role_group_status",{groupId:row.id,active:row.active?0:1})}>{row.active?"Ẩn":"Hiện"}</button>{!row.systemLocked&&<button type="button" className="export-mini danger" onClick={()=>window.confirm(`Xóa nhóm ${row.name}? Chỉ thực hiện được khi chưa có vai trò sử dụng.`)&&void action("delete_business_role_group",{groupId:row.id})}>Xóa</button>}</div></form></td></tr>)}</tbody></table></div>
    <form className="dynamic-field-add business-group-add" onSubmit={event=>void saveGroup(event)}><strong>＋ Thêm nhóm nghiệp vụ</strong><input name="code" required pattern="[a-z0-9_-]+" placeholder="ma_nhom"/><input name="name" required placeholder="Tên nhóm dùng tại công ty"/><select name="scopeIds" multiple size={Math.min(4,Math.max(2,scopes.length))} required>{scopes.filter(scope=>scope.active).map(scope=><option key={scope.id} value={scope.id}>{scope.code} · {scope.name}</option>)}</select><select name="engineRole" defaultValue={profiles[0]?.engineKey||"engineer"}>{profiles.map(profile=><option key={profile.engineKey} value={profile.engineKey}>{profile.companyCode} · {profile.displayName}</option>)}</select><input name="sortOrder" type="number" min="1" defaultValue={groups.length+1}/><input name="description" placeholder="Mô tả"/><button className="primary">Thêm nhóm</button></form></section>;
}

function BenefitsScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.benefitRecords;
  async function saveBenefit(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const userId=String(fd.get("userId")||"");if(!userId)return window.alert("Chọn nhân sự.");if(await action("save_benefit_record",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  const types=[["social","BHXH"],["health","BHYT"],["unemployment","BHTN"],["other","Chế độ khác"]];
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="BH" label="Đang theo dõi" value={String(rows.filter((r)=>String(r.status)==="active").length)} note={`Tổng ${rows.length}`} tone="green"/><Kpi icon="TI" label="Mức đóng tháng" value={money(rows.filter((r)=>String(r.status)==="active").reduce((s,r)=>s+Number(r.monthlyAmount||0),0))} note="Cộng dồn"/></div>
  <section className="card"><CardHead title="Bảo hiểm & Chế độ" note="Theo dõi BHXH/BHYT/BHTN và chế độ theo nhân sự; nhắc gia hạn theo thời hạn."/>{permission.canCreate&&<form className="payment-entry-inline benefit-form" onSubmit={saveBenefit}><select name="userId" required defaultValue=""><option value="">Nhân sự *</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select><select name="benefitType" required defaultValue=""><option value="">Loại *</option>{types.map(([code,label])=><option key={code} value={label}>{label}</option>)}</select><input name="provider" placeholder="Đơn vị cung cấp"/><input name="startDate" type="date"/><input name="endDate" type="date"/><input name="monthlyAmount" type="number" min="0" step="1" placeholder="Mức đóng tháng"/><input name="note" placeholder="Ghi chú"/><button className="primary">＋ Thêm</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Mã</th><th>Nhân sự</th><th>Loại</th><th>Đơn vị</th><th>Từ</th><th>Đến</th><th>Mức đóng</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.benefitNo}</td><td><strong>{r.fullName}</strong></td><td>{r.benefitType}</td><td>{r.provider||"—"}</td><td>{r.startDate||"—"}</td><td>{r.endDate||"—"}</td><td>{money(r.monthlyAmount)}</td><td><StatusBadge value={String(r.status)==="active"?"Đang tham gia":"Đã dừng"}/></td><td>{permission.canEdit&&<><button className="export-mini" onClick={()=>action("set_benefit_record_status",{benefitId:r.id,status:String(r.status)==="active"?"inactive":"active"})}>{String(r.status)==="active"?"Dừng":"Mở lại"}</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa bản ghi?")&&action("delete_benefit_record",{benefitId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có bản ghi bảo hiểm & chế độ."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function SealScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.sealManagement;
  async function saveSeal(event:FormEvent<HTMLFormElement>){event.preventDefault();if(await action("save_seal",Object.fromEntries(new FormData(event.currentTarget))))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><section className="card"><CardHead title="Con dấu / Ủy quyền" note="Đăng ký con dấu, người quản lý và ghi chú sử dụng; theo dõi trạng thái hoạt động."/>{permission.canCreate&&<form className="payment-entry-inline seal-form" onSubmit={saveSeal}><input name="sealNo" placeholder="Số hiệu *" required/><input name="sealName" placeholder="Tên con dấu *" required/><select name="sealType" defaultValue="company"><option value="company">Dấu công ty</option><option value="legal">Dấu pháp nhân</option><option value="signature">Dấu chức danh</option><option value="other">Khác</option></select><input name="custodian" placeholder="Người quản lý"/><input name="registeredDate" type="date"/><input name="usageNote" placeholder="Ghi chú sử dụng"/><button className="primary">＋ Đăng ký</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Số hiệu</th><th>Tên</th><th>Loại</th><th>Người quản lý</th><th>Ngày đăng ký</th><th>Ghi chú</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.sealNo}</td><td><strong>{r.sealName}</strong></td><td>{r.sealType}</td><td>{r.custodian||"—"}</td><td>{r.registeredDate||"—"}</td><td>{r.usageNote||"—"}</td><td><StatusBadge value={String(r.status)==="active"?"Đang dùng":"Đã thu hồi"}/></td><td>{permission.canEdit&&<><button className="export-mini" onClick={()=>action("set_seal_status",{sealId:r.id,status:String(r.status)==="active"?"inactive":"active"})}>{String(r.status)==="active"?"Thu hồi":"Mở lại"}</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa đăng ký?")&&action("delete_seal",{sealId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={8}><Empty text="Chưa có đăng ký con dấu."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function LegalDocsScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.legalDocuments;
  async function saveDoc(event:FormEvent<HTMLFormElement>){event.preventDefault();if(await action("save_legal_document",Object.fromEntries(new FormData(event.currentTarget))))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="VB" label="Văn bản đang hiệu lực" value={String(rows.filter((r)=>String(r.status)==="active").length)} note={`Tổng ${rows.length}`} tone="green"/><Kpi icon="HH" label="Sắp hết hiệu lực" value={String(rows.filter((r)=>r.expiryDate&&((new Date(r.expiryDate).getTime()-UI_NOW_MS)/86400000)<=90&&((new Date(r.expiryDate).getTime()-UI_NOW_MS)/86400000)>=0).length)} note="Trong 90 ngày" tone="amber"/></div>
  <section className="card"><CardHead title="Văn bản pháp lý" note="Hợp đồng, phụ lục, quyết định, giấy phép; theo dõi hiệu lực và file đính kèm."/>{permission.canCreate&&<form className="payment-entry-inline legal-doc-form" onSubmit={saveDoc}><input name="docNo" placeholder="Số VB *" required/><select name="docType" defaultValue=""><option value="">Loại *</option><option>Hợp đồng</option><option>Phụ lục</option><option>Quyết định</option><option>Giấy phép</option><option>Công văn quy phạm</option><option>Khác</option></select><input name="title" placeholder="Tiêu đề *" required/><input name="issueDate" type="date"/><input name="issuer" placeholder="Cơ quan ban hành"/><input name="effectiveDate" type="date"/><input name="expiryDate" type="date"/><input name="scope" placeholder="Phạm vi áp dụng"/><button className="primary">＋ Lưu VB</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Số VB</th><th>Loại</th><th>Tiêu đề</th><th>Ban hành</th><th>Cơ quan</th><th>Hiệu lực</th><th>Hết hạn</th><th>Phạm vi</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.docNo}</td><td>{r.docType}</td><td><strong>{r.title}</strong></td><td>{r.issueDate||"—"}</td><td>{r.issuer||"—"}</td><td>{r.effectiveDate||"—"}</td><td>{r.expiryDate||"—"}</td><td>{r.scope||"—"}</td><td><StatusBadge value={String(r.status)==="active"?"Hiệu lực":"Hết hiệu lực"}/></td><td>{permission.canEdit&&<><button className="export-mini" onClick={()=>action("set_legal_document_status",{docId:r.id,status:String(r.status)==="active"?"inactive":"active"})}>{String(r.status)==="active"?"Hết HL":"Mở lại"}</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa văn bản?")&&action("delete_legal_document",{docId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={10}><Empty text="Chưa có văn bản pháp lý."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function CorrespondenceScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.officialCorrespondence;
  async function saveCorr(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const docNo=String(fd.get("docNo")||"");if(!docNo)return window.alert("Nhập số công văn.");if(await action("save_correspondence",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="DN" label="Công văn đến" value={String(rows.filter((r)=>String(r.direction)==="IN").length)} note="Đã ghi nhận"/><Kpi icon="DI" label="Công văn đi" value={String(rows.filter((r)=>String(r.direction)==="OUT").length)} note="Đã ban hành"/><Kpi icon="XS" label="Đang xử lý" value={String(rows.filter((r)=>["received","processing"].includes(String(r.status))).length)} note="Chưa hoàn tất" tone="amber"/></div>
  <section className="card"><CardHead title="Công văn đến / đi" note="Văn thư theo dõi công văn đến-đi, người xử lý nội bộ và kết quả."/>{permission.canCreate&&<form className="payment-entry-inline correspondence-form" onSubmit={saveCorr}><select name="direction" defaultValue="IN"><option value="IN">Công văn đến</option><option value="OUT">Công văn đi</option></select><input name="docNo" placeholder="Số công văn *" required/><select name="docType" defaultValue=""><option value="">Loại *</option><option>Hành chính</option><option>Kỹ thuật</option><option>Pháp lý</option><option>Hợp đồng</option><option>Khác</option></select><input name="issueDate" type="date"/><input name="senderName" placeholder="Đơn vị gửi"/><input name="receiverName" placeholder="Đơn vị nhận"/><input name="summary" placeholder="Trích yếu"/><input name="internalHandler" placeholder="Người xử lý"/><button className="primary">＋ Ghi nhận</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Số CV</th><th>Hướng</th><th>Loại</th><th>Ngày</th><th>Gửi / Nhận</th><th>Trích yếu</th><th>Xử lý nội bộ</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.docNo}</td><td><StatusBadge value={String(r.direction)==="IN"?"Đến":"Đi"}/></td><td>{r.docType}</td><td>{r.issueDate||"—"}</td><td>{r.receiverName||r.senderName||"—"}</td><td>{r.summary||"—"}</td><td>{r.internalHandler||"—"}</td><td><StatusBadge value={r.status==="received"?"Đã nhận":r.status==="processing"?"Đang xử lý":r.status==="done"?"Hoàn tất":r.status}/></td><td>{permission.canEdit&&<><button className="export-mini" onClick={()=>window.confirm("Đánh dấu hoàn tất?")&&action("set_correspondence_status",{corrId:r.id,status:"done"})}>Hoàn tất</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa công văn?")&&action("delete_correspondence",{corrId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có công văn."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function LaborScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const rows=data.laborContracts;const active=rows.filter((r)=>String(r.status)==="active");
  async function saveContract(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const userId=String(fd.get("userId")||"");if(!userId)return window.alert("Chọn nhân sự.");if(await action("save_labor_contract",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  const types=[["probation","Thử việc"],["fixed_1y","Xác định thời hạn 1 năm"],["fixed_3y","Xác định thời hạn 3 năm"],["indefinite","Không xác định thời hạn"],["part_time","Bán thời gian"]];
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="HD" label="Hợp đồng đang hiệu lực" value={String(active.length)} note={`Tổng ${rows.length} hợp đồng`} tone="green"/><Kpi icon="HH" label="Sắp hết hạn (60 ngày)" value={String(active.filter((r)=>r.endDate&&((new Date(r.endDate).getTime()-UI_NOW_MS)/86400000)<=60&&((new Date(r.endDate).getTime()-UI_NOW_MS)/86400000)>=0).length)} note="Cần gia hạn" tone="amber"/><Kpi icon="TN" label="Thử việc" value={String(rows.filter((r)=>String(r.contractType)?.includes("Thử việc")||String(r.contractType)==="probation").length)} note="Đang thử việc"/><Kpi icon="KT" label="Đã kết thúc" value={String(rows.filter((r)=>String(r.status)==="ended").length)} note="Lưu lịch sử"/></div>
  <section className="card"><CardHead title="Hợp đồng lao động" note="Các loại hợp đồng thử việc / xác định thời hạn / không thời hạn; theo dõi hết hạn để gia hạn."/>
  {permission.canCreate&&<form className="payment-entry-inline labor-contract-form" onSubmit={saveContract}><select name="userId" required defaultValue=""><option value="">Nhân sự *</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName} · {u.roleName||u.role||""}</option>)}</select><select name="contractType" required defaultValue=""><option value="">Loại HĐ *</option>{types.map(([code,label])=><option key={code} value={label}>{label}</option>)}</select><input name="signingDate" type="date"/><input name="startDate" type="date"/><input name="endDate" type="date"/><input name="salary" type="number" min="0" step="1" placeholder="Mức lương"/><input name="note" placeholder="Ghi chú"/><button className="primary">＋ Lập HĐ</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Số HĐ</th><th>Nhân sự</th><th>Loại</th><th>Ký</th><th>Từ</th><th>Đến</th><th>Lương</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.contractNo}</td><td><strong>{r.fullName}</strong></td><td>{r.contractType}</td><td>{r.signingDate||"—"}</td><td>{r.startDate||"—"}</td><td>{r.endDate||"—"}</td><td>{money(r.salary)}</td><td><StatusBadge value={r.status==="active"?"Đang hiệu lực":r.status==="ended"?"Kết thúc":"Tạm ngừng"}/></td><td>{permission.canEdit&&<><button className="export-mini" onClick={()=>action("set_labor_contract_status",{contractId:r.id,status:r.status==="active"?"ended":"active"})}>{r.status==="active"?"Kết thúc":"Mở lại"}</button><button className="export-mini danger" onClick={()=>window.confirm("Xóa hợp đồng?")&&action("delete_labor_contract",{contractId:r.id})}>Xóa</button></>}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có hợp đồng lao động."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function HrScreen({data,project,action,permission,open}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row;open:(name:string,r?:Row)=>void}){
  const rows=data.hrRecords;
  async function saveHr(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const userId=String(fd.get("userId")||"");if(!userId)return window.alert("Chọn nhân sự.");if(await action("save_hr_record",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="NS" label="Hồ sơ đã lập" value={String(rows.length)} note="Nhân sự đang theo dõi"/><Kpi icon="NB" label="Còn thiếu hồ sơ" value={String(data.staffDirectory.filter((u)=>!rows.some((r)=>String(r.userId)===String(u.id))).length)} note="Chưa có hồ sơ chi tiết" tone="amber"/></div>
  <section className="card"><CardHead title="Hồ sơ nhân sự" note="Bấm vào một dòng để xem hồ sơ chi tiết (chức vụ, liên hệ, cá nhân, dự án đã/đang tham gia, đơn từ). Do Hành chính - Pháp chế cập nhật."/>
  {permission.canCreate&&<form className="payment-entry-inline hr-form" onSubmit={saveHr}><select name="userId" required defaultValue=""><option value="">Nhân sự *</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName} · {u.roleName||u.role||""}</option>)}</select><input name="fullName" placeholder="Họ tên (theo hồ sơ)"/><input name="identityNo" placeholder="Số CCCD/CMND"/><input name="identityDate" type="date"/><input name="birthDate" type="date"/><input name="birthplace" placeholder="Nơi sinh"/><input name="permanentAddress" placeholder="Địa chỉ thường trú"/><input name="phone" placeholder="Điện thoại"/><input name="educationLevel" placeholder="Trình độ học vấn"/><input name="joinedDate" type="date"/><input name="position" placeholder="Chức danh"/><input name="note" placeholder="Ghi chú"/><input name="identityPlace" hidden/><button className="primary">＋ Lập hồ sơ</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Họ tên</th><th>Mã NV</th><th>Phòng ban</th><th>CCCD</th><th>Ngày sinh</th><th>Địa chỉ</th><th>Trình độ</th><th>Ngày vào</th><th>Chức danh</th></tr></thead><tbody>{rows.map((r)=><tr key={r.id} onClick={()=>open("userProfileHr",r)} title="Xem hồ sơ chi tiết" style={{cursor:"pointer"}}><td><strong>{r.fullName}</strong></td><td>{r.employeeCode||"—"}</td><td>{r.department||"—"}</td><td>{r.identityNo||"—"}</td><td>{r.birthDate||"—"}</td><td>{r.permanentAddress||"—"}</td><td>{r.educationLevel||"—"}</td><td>{r.joinedDate||"—"}</td><td>{r.position||"—"}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có hồ sơ nhân sự."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function DocumentsScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const [docProjectId,setDocProjectId]=useState(project!=="ALL"&&project?project:"");
  const rows=data.accountingVouchers.filter((r)=>!docProjectId||String(r.projectId||"")===String(docProjectId));
  const [voucherProjects]=useState(data.projects);
  async function saveVoucher(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const projectId=String(fd.get("projectId")||"");if(!projectId)return window.alert("Chọn dự án (hoặc để chứng từ liên công ty chọn rồi điền ghi chú).");if(await action("save_accounting_voucher",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  const voucherTypes=[["TH","Phiếu thu"],["CH","Phiếu chi"],["XK","Phiếu xuất kho"],["NK","Phiếu nhập kho"],["HD","Hóa đơn GTGT"],["KH","Chứng từ khác"]];
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="CT" label="Chứng từ đã lập" value={String(rows.length)} note="Cộng dồn"/><Kpi icon="GT" label="Tổng giá trị" value={money(rows.reduce((s,r)=>s+Number(r.totalAmount||0),0))} note="Theo dõi bởi Phòng Tài chính"/><Kpi icon="LO" label="Phiếu thu" value={String(rows.filter((r)=>String(r.voucherType)?.includes("Thu")).length)} note="Thu tiền"/><Kpi icon="LC" label="Phiếu chi" value={String(rows.filter((r)=>String(r.voucherType)?.includes("Chi")).length)} note="Chi tiền"/></div>
  <section className="card"><CardHead title="Chứng từ kế toán" note="Đăng ký chứng từ gốc và liên kết nguồn nghiệp vụ (thu hồi vốn, thanh toán, tạm ứng, chi phí)."/><div className="filter-grid"><label><span>Dự án</span><select value={docProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setDocProjectId(e.target.value)}><option value="">Tất cả dự án</option>{voucherProjects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div>
  {permission.canCreate&&<form className="payment-entry-inline voucher-form" onSubmit={saveVoucher}><input name="voucherDate" type="date" required/><select name="voucherType" required defaultValue=""><option value="">Loại chứng từ *</option>{voucherTypes.map(([code,label])=><option key={code} value={label}>{label}</option>)}</select><select name="projectId" defaultValue=""><option value="">Dự án (tùy chọn)</option>{voucherProjects.map((p)=><option key={p.id} value={p.id}>{p.code}</option>)}</select><input name="totalAmount" type="number" min="0" step="1" placeholder="Giá trị *" required/><input name="description" placeholder="Nội dung / diễn giải"/><input name="filesJson" placeholder="Mã file đính kèm (JSON)" hidden/><button className="primary">＋ Lập chứng từ</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Số CT</th><th>Ngày</th><th>Loại</th><th>Dự án</th><th>Nội dung</th><th>Giá trị</th><th>Người lập</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.voucherNo}</td><td>{r.voucherDate}</td><td><StatusBadge value={r.voucherType}/></td><td>{r.projectCode||"—"}</td><td>{r.description||"—"}</td><td><strong>{money(r.totalAmount)}</strong></td><td>{r.createdByName||"—"}</td><td>{permission.canEdit&&<button className="export-mini danger" onClick={()=>window.confirm("Xóa chứng từ?")&&action("delete_accounting_voucher",{voucherId:r.id})}>Xóa</button>}</td></tr>)}{!rows.length&&<tr><td colSpan={8}><Empty text="Chưa có chứng từ kế toán."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function CashbankScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const [cbAccountId,setCbAccountId]=useState(data.bankAccounts[0]?.id||"");
  const selectedAccount=data.bankAccounts.find((a)=>String(a.id)===String(cbAccountId))||data.bankAccounts[0];
  const entries=data.cashbookEntries.filter((e)=>!cbAccountId||String(e.accountId)===String(cbAccountId));
  const inflow=entries.filter((e)=>String(e.entryType)==="IN").reduce((s,e)=>s+Number(e.amount||0),0),outflow=entries.filter((e)=>String(e.entryType)==="OUT").reduce((s,e)=>s+Number(e.amount||0),0);
  const balance=Number(selectedAccount?.openingBalance||0)+inflow-outflow;
  async function saveAccount(event:FormEvent<HTMLFormElement>){event.preventDefault();if(await action("save_bank_account",Object.fromEntries(new FormData(event.currentTarget))))(event.currentTarget as HTMLFormElement).reset();}
  async function saveEntry(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);if(await action("save_cashbook_entry",{...Object.fromEntries(fd),accountId:String(fd.get("accountId")||cbAccountId)}))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="QD" label="Số dư hiện tại" value={money(balance)} note={selectedAccount?`${selectedAccount.code} · ${selectedAccount.bankName}`:"Chưa có tài khoản"} tone={balance>=0?"green":"red"}/><Kpi icon="TH" label="Thu vào" value={money(inflow)} note={`${entries.filter((e)=>String(e.entryType)==="IN").length} khoản`} tone="green"/><Kpi icon="CH" label="Chi ra" value={money(outflow)} note={`${entries.filter((e)=>String(e.entryType)==="OUT").length} khoản`} tone="amber"/><Kpi icon="TK" label="Tài khoản" value={String(data.bankAccounts.length)} note="Đang theo dõi"/></div>
  <section className="card"><CardHead title="Sổ quỹ & Ngân hàng" note="Theo dõi số quỹ tiền mặt và tài khoản ngân hàng; số dư = mở đầu + thu − chi."/><div className="filter-grid"><label><span>Tài khoản</span><select value={cbAccountId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setCbAccountId(e.target.value)}>{data.bankAccounts.map((a)=><option key={a.id} value={a.id}>{a.code} · {a.bankName} · {a.accountNo}</option>)}{!data.bankAccounts.length&&<option value="">Chưa có tài khoản</option>}</select></label></div>
  {permission.canCreate&&<form className="payment-entry-inline bank-account-form" onSubmit={saveAccount}><input name="code" placeholder="Mã *" required/><input name="bankName" placeholder="Ngân hàng *" required/><input name="accountNo" placeholder="Số tài khoản *" required/><input name="branch" placeholder="Chi nhánh"/><input name="currency" defaultValue="VND" placeholder="Tiền tệ"/><input name="openingBalance" type="number" min="0" step="1" placeholder="Số dư đầu kỳ"/><button className="primary">＋ Thêm tài khoản</button></form>}
  {permission.canCreate&&<form className="payment-entry-inline cashbook-entry-form" onSubmit={saveEntry}><select name="accountId" value={cbAccountId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setCbAccountId(e.target.value)}>{data.bankAccounts.map((a)=><option key={a.id} value={a.id}>{a.code}</option>)}</select><input name="entryDate" type="date" required/><select name="entryType" defaultValue="IN"><option value="IN">Thu vào</option><option value="OUT">Chi ra</option></select><input name="amount" type="number" min="0" step="1" placeholder="Số tiền *" required/><input name="counterparty" placeholder="Đối tác"/><input name="referenceType" placeholder="Loại tham chiếu (PO/HD/...)" hidden/><input name="referenceId" placeholder="Mã tham chiếu" hidden/><input name="note" placeholder="Nội dung"/><button className="primary">Ghi sổ</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Số bút toán</th><th>Loại</th><th>Số tiền</th><th>Đối tác</th><th>Nội dung</th><th>Người ghi</th><th></th></tr></thead><tbody>{entries.map((e)=><tr key={e.id}><td>{e.entryDate}</td><td>{e.entryNo}</td><td><StatusBadge value={String(e.entryType)==="IN"?"Thu vào":"Chi ra"}/></td><td><strong className={String(e.entryType)==="IN"?"green-text":""}>{String(e.entryType)==="IN"?"+":"−"}{money(e.amount)}</strong></td><td>{e.counterparty||"—"}</td><td>{e.note||"—"}</td><td>{e.createdByName||"—"}</td><td>{permission.canEdit&&<button className="export-mini danger" onClick={()=>window.confirm("Xóa bút toán?")&&action("delete_cashbook_entry",{entryId:e.id})}>Xóa</button>}</td></tr>)}{!entries.length&&<tr><td colSpan={8}><Empty text="Chưa có bút toán."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function SiteCostScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const [scProjectId,setScProjectId]=useState(project!=="ALL"&&project?project:"");
  const rows=data.siteExpenseClaims.filter((r)=>!scProjectId||String(r.projectId)===String(scProjectId));
  const totalByType=(type:string)=>rows.filter((r)=>String(r.costType)===type).reduce((s,r)=>s+Number(r.amount||0),0);
  const types: [string, string][] = [["AC","Ăn uống / tiếp khách"],["DC","Đi lại / xăng dầu"],["KS","Khách sạn / thuê trọ"],["VT","Vật tư phụ trợ BCH"],["NH","Nhân công thuê ngoài"],["KH","Khác"]];
  async function saveClaim(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const projectId=String(fd.get("projectId")||"");if(!projectId)return window.alert("Chọn dự án.");if(await action("save_site_expense_claim",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small">{types.slice(0,4).map(([icon,label])=><Kpi key={label} icon={icon} label={label} value={money(totalByType(label))} note="Cộng dồn" tone={totalByType(label)>0?"amber":"blue"}/>)}</div>
  <section className="card"><CardHead title="Chi phí Ban chỉ huy theo dự án" note="Chi phí ăn ở, đi lại, vật tư phụ trợ và nhân công BCH; có chứng từ liên kết."/><div className="filter-grid"><label><span>Dự án</span><select value={scProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setScProjectId(e.target.value)}><option value="">Tất cả dự án</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div>
  {permission.canCreate&&<form className="payment-entry-inline site-cost-form" onSubmit={saveClaim}><select name="projectId" required defaultValue=""><option value="">Dự án *</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code}</option>)}</select><select name="costType" required defaultValue=""><option value="">Loại chi phí *</option>{types.map(([code,label])=><option key={label} value={label}>{label}</option>)}</select><input name="amount" type="number" min="0" step="1" placeholder="Số tiền *" required/><select name="paidBy" defaultValue=""><option value="">Người chi</option>{data.staffDirectory.map((u)=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select><input name="claimDate" type="date"/><input name="description" placeholder="Diễn giải"/><button className="primary">＋ Ghi chi phí</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Phiếu</th><th>Dự án</th><th>Loại</th><th>Số tiền</th><th>Người chi</th><th>Ngày</th><th>Diễn giải</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=><tr key={r.id}><td>{r.claimNo}</td><td><strong>{r.projectCode}</strong></td><td>{r.costType}</td><td><strong>{money(r.amount)}</strong></td><td>{r.paidByName||"—"}</td><td>{r.claimDate||"—"}</td><td>{r.description||"—"}</td><td><StatusBadge value={r.status==="approved"?"Đã duyệt":r.status==="submitted"?"Chờ duyệt":"Bản nháp"}/></td><td>{r.status!=="approved"&&permission.canApprove&&<button className="mini-approve" onClick={()=>action("approve_site_expense_claim",{claimId:r.id})}>Duyệt →</button>}{permission.canEdit&&r.status!=="approved"&&<button className="export-mini danger" onClick={()=>window.confirm("Xóa chi phí?")&&action("delete_site_expense_claim",{claimId:r.id})}>Xóa</button>}</td></tr>)}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có chi phí hiện trường."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function AdvanceScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const [advProjectId,setAdvProjectId]=useState(project!=="ALL"&&project?project:"");
  const rows=data.advanceRequests.filter((r)=>!advProjectId||String(r.projectId||"")===String(advProjectId));
  const outstanding=rows.filter((r)=>String(r.status)!=="settled");
  const totalAdvance=outstanding.reduce((s,r)=>s+Number(r.amount||0),0),totalSettled=rows.filter((r)=>String(r.status)==="settled").reduce((s,r)=>s+Number(r.advancePaid||0),0);
  async function saveRequest(event:FormEvent<HTMLFormElement>,submit:boolean){event.preventDefault();const fd=new FormData(event.currentTarget);const payload={...Object.fromEntries(fd),requesterId:String(fd.get("requesterId")||data.user.id),submit};if(await action("save_advance_request",payload))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="TA" label="Tạm ứng chưa hoàn" value={money(totalAdvance)} note={`${outstanding.length} phiếu`} tone="amber"/><Kpi icon="TH" label="Đã hoàn ứng" value={money(totalSettled)} note="Cộng dồn"/><Kpi icon="DU" label="Bản nháp" value={String(rows.filter((r)=>r.status==="draft").length)} note="Chưa gửi duyệt"/><Kpi icon="XD" label="Chờ duyệt" value={String(rows.filter((r)=>r.status==="submitted").length)} note="Cần Phòng Tài chính xét"/></div>
  <section className="card"><CardHead title="Tạm ứng / Hoàn ứng" note="Tạm ứng mua hàng, đi công tác, chi phí hiện trường; hoàn ứng khi đủ chứng từ."/><div className="filter-grid"><label><span>Dự án</span><select value={advProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setAdvProjectId(e.target.value)}><option value="">Tất cả dự án</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div>
  {permission.canCreate&&<form className="payment-entry-inline advance-entry-form" onSubmit={(e)=>saveRequest(e,false)}><select name="projectId" defaultValue=""><option value="">Dự án (tùy chọn)</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code}</option>)}</select><select name="requesterId" defaultValue={data.user.id}><option value={data.user.id}>{data.user.fullName}</option>{data.staffDirectory.filter((u)=>String(u.id)!==String(data.user.id)).map((u)=><option key={u.id} value={u.id}>{u.fullName}</option>)}</select><input name="purpose" placeholder="Mục đích *" required/><select name="category" defaultValue="purchase"><option value="purchase">Mua hàng</option><option value="travel">Đi công tác</option><option value="site_cost">Chi phí hiện trường</option><option value="other">Khác</option></select><input name="amount" type="number" min="0" step="1" placeholder="Số tiền *" required/><input name="note" placeholder="Ghi chú"/><button className="primary">＋ Tạo phiếu</button><button type="button" className="primary" onClick={(e)=>saveRequest(e as unknown as FormEvent<HTMLFormElement>,true)}>Tạo & gửi duyệt</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Phiếu</th><th>Người nhận</th><th>Dự án</th><th>Mục đích</th><th>Loại</th><th>Số tiền</th><th>Đã chi</th><th>Hoàn ứng</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((r)=>{const balance=Math.max(0,Number(r.advancePaid||0)-Number(r.settlementValue||0));return <tr key={r.id}><td>{r.requestNo}</td><td><strong>{r.requesterName}</strong></td><td>{r.projectCode||"—"}</td><td>{r.purpose}</td><td>{r.category}</td><td><strong>{money(r.amount)}</strong></td><td>{money(r.advancePaid)}</td><td>{money(r.settlementValue)}</td><td><StatusBadge value={r.status==="approved"?"Đã duyệt":r.status==="settled"?"Đã hoàn ứng":r.status==="submitted"?"Chờ duyệt":"Bản nháp"}/></td><td>{permission.canEdit&&String(r.status)==="draft"&&<button className="export-mini danger" onClick={()=>window.confirm("Xóa phiếu tạm ứng?")&&action("delete_advance_request",{requestId:r.id})}>Xóa</button>}{permission.canApprove&&["approved","submitted"].includes(String(r.status))&&<button className="mini-approve" onClick={()=>{const s=window.prompt("Nhập số tiền đã chi tạm ứng:",String(r.amount||0));const st=window.prompt("Nhập giá trị hoàn ứng:",String(Math.min(Number(s||0),Number(r.amount||0))));if(s!==null&&st!==null)void action("settle_advance_request",{requestId:r.id,advancePaid:Number(s||0),settlementValue:Number(st||0)});}}>Hoàn ứng</button>}</td></tr>;})}{!rows.length&&<tr><td colSpan={10}><Empty text="Chưa có phiếu tạm ứng."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function PaymentPlanScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const [ppProjectId,setPpProjectId]=useState(project!=="ALL"&&project?project:"");
  const plans=data.paymentPlans.filter((p)=>!ppProjectId||String(p.projectId)===String(ppProjectId));
  const totalPlanned=plans.reduce((s,p)=>s+Number(p.plannedAmount||0),0),totalPaid=plans.reduce((s,p)=>s+Number(p.paidAmount||0),0);
  async function savePlan(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const projectId=String(fd.get("projectId")||"");if(!projectId)return window.alert("Chọn dự án.");if(await action("save_payment_plan",Object.fromEntries(fd)))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="KH" label="Kế hoạch đang mở" value={String(plans.filter((p)=>String(p.status)!=="closed").length)} note={`Tổng ${plans.length} dòng`}/><Kpi icon="GT" label="Giá trị kế hoạch" value={money(totalPlanned)} note="Cộng dồn"/><Kpi icon="TH" label="Đã thanh toán" value={money(totalPaid)} note={`${totalPlanned>0?Math.round(totalPaid*100/totalPlanned):0}%`} tone="green"/><Kpi icon="NO" label="Còn phải chi" value={money(Math.max(0,totalPlanned-totalPaid))} note="Theo kế hoạch" tone={totalPlanned-totalPaid>0?"amber":"green"}/></div>
  <section className="card"><CardHead title="Kế hoạch thanh toán theo dự án" note="Lịch thanh toán theo hợp đồng/PO/milestone; đối chiếu tiền thực thu từ Thanh toán HĐ."/><div className="filter-grid"><label><span>Dự án</span><select value={ppProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setPpProjectId(e.target.value)}><option value="">Tất cả dự án</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div>
  {permission.canCreate&&<form className="payment-entry-inline payment-plan-form" onSubmit={savePlan}><select name="projectId" required defaultValue=""><option value="">Dự án *</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code}</option>)}</select><input name="milestone" placeholder="Milestone / đợt thanh toán"/><input name="plannedDate" type="date" placeholder="Ngày dự kiến"/><input name="plannedAmount" type="number" min="0" step="1" placeholder="Giá trị kế hoạch *" required/><input name="note" placeholder="Ghi chú"/><button className="primary">＋ Thêm kế hoạch</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Mã</th><th>Dự án</th><th>Milestone</th><th>Ngày</th><th>Kế hoạch</th><th>Đã thanh toán</th><th>Còn lại</th><th>Trạng thái</th><th></th></tr></thead><tbody>{plans.map((p)=>{const remain=Math.max(0,Number(p.plannedAmount||0)-Number(p.paidAmount||0));return <tr key={p.id}><td>{p.planNo}</td><td><strong>{p.projectCode}</strong></td><td>{p.milestone||"—"}</td><td>{p.plannedDate||"—"}</td><td>{money(p.plannedAmount)}</td><td>{money(p.paidAmount)}</td><td><strong>{money(remain)}</strong></td><td><StatusBadge value={p.status==="planned"?"Theo kế hoạch":p.status==="overdue"?"Quá hạn":p.status==="partially_paid"?"Thanh toán một phần":p.status==="paid"?"Đã thanh toán":"Đã đóng"}/></td><td>{permission.canEdit&&String(p.status)!=="closed"&&<><button className="export-mini" onClick={()=>action("set_payment_plan_status",{planId:p.id,status:remain>0?"partially_paid":"paid",paidAmount:p.plannedAmount})}>Ghi đã chi</button>{Number(p.paidAmount||0)===0&&<button className="export-mini danger" onClick={()=>window.confirm("Xóa kế hoạch?")&&action("delete_payment_plan",{planId:p.id})}>Xóa</button>}</>}</td></tr>;})}{!plans.length&&<tr><td colSpan={9}><Empty text="Chưa có kế hoạch thanh toán."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function MaterialNormsScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const [normProjectId,setNormProjectId]=useState(project!=="ALL"&&project?project:"");
  const [estimate,setEstimate]=useState<Row[]|null>(null);
  const rows=data.materialNorms.filter((n)=>!normProjectId||String(n.projectId||"")===String(normProjectId)||String(n.projectId||"")==="");
  const materials=data.materials;
  async function saveNorm(event:FormEvent<HTMLFormElement>){(event.currentTarget as HTMLFormElement).reset();await action("save_material_norm",Object.fromEntries(new FormData(event.currentTarget)));}
  async function runEstimate(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const projectId=String(fd.get("projectId")||""),quantity=Number(fd.get("quantity")||0);if(!projectId||quantity<=0)return window.alert("Chọn dự án và nhập khối lượng hạng mục.");try{const result=await fetch("/api/system",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"estimate_material_norms",projectId,quantity})}).then((r)=>r.json());setEstimate(Array.isArray(result?.rows)?result.rows:null);}catch{setEstimate(null);}}
  return <div className="stack module-screen">{estimate!==null&&<section className="card"><CardHead title="Ước lượng nhu cầu từ định mức" note="Khối lượng hạng mục × định mức tiêu hao; chỉ là gợi ý, không tự sinh phiếu mua."/><button className="secondary" onClick={()=>setEstimate(null)}>Đóng</button><div className="table-wrap"><table><thead><tr><th>Hạng mục</th><th>Mã vật tư</th><th>Tên vật tư</th><th>Định mức</th><th>Khối lượng</th><th>Nhu cầu vật tư</th><th>ĐVT</th></tr></thead><tbody>{estimate.map((n,i)=><tr key={i}><td>{n.itemName}</td><td>{n.materialCode||"—"}</td><td>{n.materialName||"—"}</td><td>{n.quantityPerUnit} {n.unit||""}</td><td>{money(Number(n.quantityPerUnit)>0?Number(n.requiredQuantity)/Number(n.quantityPerUnit):0)}</td><td><strong>{money(n.requiredQuantity)}</strong></td><td>{n.materialUnit||n.unit||"—"}</td></tr>)}{!estimate.length&&<tr><td colSpan={7}><Empty text="Chưa có định mức phù hợp cho dự án đang chọn."/></td></tr>}</tbody></table></div></section>}
  <section className="card"><CardHead title="Định mức vật tư theo dự án / hạng mục" note="Định mức tiêu hao độc lập khỏi BOQ/HĐ; dùng để ước lượng nhu cầu mua sắm."/><div className="filter-grid"><label><span>Dự án</span><select value={normProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setNormProjectId(e.target.value)}><option value="">Tất cả dự án</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div>
  {permission.canCreate&&<form className="payment-entry-inline norms-entry-form" onSubmit={saveNorm}><select name="projectId" defaultValue=""><option value="">Dự án (tùy chọn)</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code}</option>)}</select><input name="itemName" placeholder="Hạng mục *" required/><select name="materialId" defaultValue=""><option value="">Không gắn mã</option>{materials.slice(0,200).map((m)=><option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select><input name="quantityPerUnit" type="number" min="0" step="0.0001" placeholder="Định mức *" required/><input name="unit" placeholder="ĐVT"/><input name="baseUom" placeholder="Đơn vị cơ sở"/><input name="subcategoryId" placeholder="Nhóm (ID)" hidden/><button className="primary">＋ Thêm định mức</button></form>}
  {permission.canUse&&<form className="payment-entry-inline norms-estimate-form" onSubmit={runEstimate}><select name="projectId" required defaultValue=""><option value="">Dự án ước lượng</option>{data.projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select><input name="quantity" type="number" min="0" step="0.001" placeholder="Khối lượng hạng mục" required/><button className="secondary">Ước lượng nhu cầu</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Mã</th><th>Hạng mục</th><th>Dự án</th><th>Vật tư</th><th>Định mức</th><th>ĐVT</th><th>Nguồn</th><th>Trạng thái</th><th></th></tr></thead><tbody>{rows.map((n)=>(
    <tr key={n.id}><td>{n.normCode}</td><td><strong>{n.itemName}</strong></td><td>{n.projectCode||"Toàn CTY"}</td><td>{n.materialCode?`${n.materialCode} · ${n.materialName||""}`:"—"}</td><td><strong>{n.quantityPerUnit}</strong></td><td>{n.unit||n.materialUnit||"—"}</td><td>{n.sourceType==="boq_component"?"Từ BOQ":"Thủ công"}</td><td><StatusBadge value={Number(n.active)===1?"Đang áp dụng":"Đã ẩn"}/></td><td>{permission.canEdit&&<>{Number(n.active)===1?<button className="export-mini" onClick={()=>action("set_material_norm_status",{normId:n.id,active:0})}>Ẩn</button>:<button className="export-mini" onClick={()=>action("set_material_norm_status",{normId:n.id,active:1})}>Kích hoạt</button>}<button className="export-mini danger" onClick={()=>window.confirm("Xóa định mức?")&&action("delete_material_norm",{normId:n.id})}>Xóa</button></>}</td></tr>
  ))}{!rows.length&&<tr><td colSpan={9}><Empty text="Chưa có định mức vật tư."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function ConstructionScreen({data,project,action,permission}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>;permission:Row}){
  const projects=data.projects;
  const [conProjectId,setConProjectId]=useState(project!=="ALL"&&project?project:(projects[0]?.id||"ALL"));
  const logs=data.constructionDailyLogs.filter((l)=>conProjectId==="ALL"||String(l.projectId)===String(conProjectId));
  const itemsByLog=(logId:string)=>(data.constructionDailyLogItems||[]).filter((i)=>String(i.logId)===String(logId));
  const [draftItems,setDraftItems]=useState<Row[]>([{}]);
  function patchDraft(index:number,key:string,value:string){setDraftItems((rows)=>rows.map((r,i)=>i===index?{...r,[key]:value}:r));}
  function addDraftRow(){setDraftItems((rows)=>[...rows,{}]);}
  async function saveLog(event:FormEvent<HTMLFormElement>){event.preventDefault();if(conProjectId==="ALL")return window.alert("Hãy chọn một dự án cụ thể.");const submitMode=String((event.nativeEvent as SubmitEvent).submitter?.getAttribute("data-mode")||"draft")==="submit";const fd=new FormData(event.currentTarget);const items=draftItems.map((r,i)=>({itemName:String(fd.get(`itemName-${i}`)||r.itemName||""),location:String(fd.get(`location-${i}`)||r.location||""),plannedQty:Number(fd.get(`plannedQty-${i}`)||0),completedQty:Number(fd.get(`completedQty-${i}`)||0),unit:String(fd.get(`unit-${i}`)||r.unit||""),laborHours:Number(fd.get(`laborHours-${i}`)||0)})).filter((r)=>r.itemName.trim());const payload={projectId:conProjectId,workDate:String(fd.get("workDate")||""),shift:String(fd.get("shift")||"sang"),weather:String(fd.get("weather")||""),workContent:String(fd.get("workContent")||""),laborCount:Number(fd.get("laborCount")||0),equipmentNote:String(fd.get("equipmentNote")||""),note:String(fd.get("note")||""),items,submit:submitMode};if(await action("save_construction_daily_log",payload)){setDraftItems([{}]);(event.currentTarget as HTMLFormElement).reset();}}
  const completedByProject=logs.reduce((s,l)=>s+Number(l.completedQty||0),0),draftCount=logs.filter((l)=>l.status==="draft").length,approvedCount=logs.filter((l)=>l.status==="approved").length;
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="CN" label="Nhật ký đã duyệt" value={String(approvedCount)} note={`Tổng ${logs.length} phiếu`} tone="green"/><Kpi icon="NH" label="Bản nháp / chờ duyệt" value={String(draftCount)} note="Chưa chốt tiến độ" tone="amber"/><Kpi icon="KL" label="Khối lượng hoàn thành" value={money(completedByProject)} note="Cộng dồn từ các nhật ký"/><Kpi icon="XC" label="Tiến độ thực địa" value={`${logs.filter((l)=>l.status==="approved").length}/${logs.length||1}`} note="Phiếu duyệt / tổng phiếu"/></div>
  <section className="card"><CardHead title="Nhập nhật ký thi công" note="BCH nhập theo ngày; khối lượng thực hiện là cơ sở đối chiếu nghiệm thu, không dùng số xuất kho thay sản lượng."/><div className="filter-grid"><label><span>Dự án</span><select value={conProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setConProjectId(e.target.value)}>{projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div>{conProjectId!=="ALL"&&permission.canCreate&&<form className="construction-entry-form" onSubmit={saveLog}><div className="payment-entry-inline"><input name="workDate" type="date" required/><select name="shift" defaultValue="sang"><option value="sang">Ca sáng</option><option value="chieu">Ca chiều</option><option value="ca_3">Ca 3</option><option value="nghi">Nghỉ</option></select><input name="weather" placeholder="Thời tiết"/><input name="laborCount" type="number" min="0" placeholder="Số nhân công"/><input name="equipmentNote" placeholder="Máy móc / thiết bị"/><input name="workContent" placeholder="Nội dung thi công"/><input name="note" placeholder="Ghi chú"/></div>
  <div className="construction-items-form">{draftItems.map((r,i)=>(
    <div className="construction-item-row" key={i}>
      <input name={`itemName-${i}`} placeholder="Hạng mục *" value={String(r.itemName||"")} onChange={(e)=>patchDraft(i,"itemName",e.target.value)}/>
      <input name={`location-${i}`} placeholder="Khu vực" value={String(r.location||"")} onChange={(e)=>patchDraft(i,"location",e.target.value)}/>
      <input name={`plannedQty-${i}`} type="number" min="0" step="0.001" placeholder="KH" value={String(r.plannedQty??"")} onChange={(e)=>patchDraft(i,"plannedQty",e.target.value)}/>
      <input name={`completedQty-${i}`} type="number" min="0" step="0.001" placeholder="Thực hiện" value={String(r.completedQty??"")} onChange={(e)=>patchDraft(i,"completedQty",e.target.value)}/>
      <input name={`unit-${i}`} placeholder="ĐVT" value={String(r.unit||"")} onChange={(e)=>patchDraft(i,"unit",e.target.value)}/>
      <input name={`laborHours-${i}`} type="number" min="0" step="0.5" placeholder="Giờ công" value={String(r.laborHours??"")} onChange={(e)=>patchDraft(i,"laborHours",e.target.value)}/>
    </div>
  ))}</div><button type="button" className="secondary" onClick={addDraftRow}>＋ Thêm hạng mục</button><button type="submit" className="primary" data-mode="draft">Lưu nháp</button><button type="submit" className="primary" data-mode="submit">Gửi kiểm tra</button></form>}
  <div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Số phiếu</th><th>Ca / Thời tiết</th><th>Nội dung</th><th>Nhân công</th><th>Hạng mục</th><th>Khối lượng</th><th>Trạng thái</th><th></th></tr></thead><tbody>{logs.map((l)=>{const items=itemsByLog(String(l.id));return <tr key={l.id}><td>{l.workDate}</td><td>{l.logNo}</td><td>{l.shift}<small>{l.weather||"—"}</small></td><td><strong>{l.workContent||"—"}</strong></td><td>{l.laborCount||0}</td><td>{l.itemCount||items.length}</td><td>{money(l.completedQty)}</td><td><StatusBadge value={l.status==="approved"?"Đã duyệt":l.status==="submitted"?"Chờ duyệt":"Bản nháp"}/></td><td>{l.status!=="approved"&&permission.canApprove&&<button className="mini-approve" onClick={()=>action("approve_construction_daily_log",{logId:l.id})}>Duyệt →</button>}{permission.canEdit&&l.status!=="approved"&&<button className="export-mini danger" onClick={()=>window.confirm(`Xóa nhật ký ${l.logNo}?`)&&action("delete_construction_daily_log",{logId:l.id})}>Xóa</button>}</td></tr>;})}{!logs.length&&<tr><td colSpan={9}><Empty text="Chưa có nhật ký thi công trong phạm vi đang chọn."/></td></tr>}</tbody></table></div></section>
  </div>;
}
function FinanceRecoveryScreen({data,project,action}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>}){
  const projects=data.projects;
  const ledgerRows=useMemo(()=>{const out:string[][]=[];const scoped=(r:Row)=>project==="ALL"||String(r.projectId||r.project_id||"")===String(project);(data.contractPayments||[]).filter(scoped).forEach((p)=>out.push([p.paymentDate||"",p.referenceNo||p.id,"112","131",p.projectCode||"",(p.description||"Thu hồi vốn / thanh toán HĐ")+"",p.projectCode||"",String(Number(p.amount||0))]));(data.capitalRecoveryRecords||[]).filter(scoped).forEach((r)=>out.push([r.dueDate||r.periodKey||"",r.referenceNo||r.id,"131","511",r.projectCode||"",`Hồ sơ thu hồi vốn ${r.referenceNo||""}`.trim(),r.projectCode||"",String(Number(r.approvedValue||0))]));(data.advanceRequests||[]).filter(scoped).forEach((r)=>out.push([(r.createdAt||"").slice(0,10),r.requestNo||r.id,"141","111",r.requesterName||r.requesterId||"",`Tạm ứng ${r.purpose}`.trim(),r.projectCode||"",String(Number(r.amount||0))]));(data.siteExpenseClaims||[]).filter(scoped).forEach((r)=>out.push([r.claimDate||"",r.claimNo||r.id,"627","111",r.paidByName||"",`Chi phí BCH: ${r.costType}`.trim(),r.projectCode||"",String(Number(r.amount||0))]));(data.cashbookEntries||[]).forEach((r)=>out.push([r.entryDate||"",r.entryNo||r.id,String(r.entryType)==="IN"?"112":"111",String(r.entryType)==="IN"?"511":"112",r.counterparty||"",(r.note||`Sổ quỹ ${String(r.entryType)==="IN"?"thu":"chi"}`).trim(),"",String(Number(r.amount||0))]));(data.accountingVouchers||[]).filter(scoped).forEach((r)=>out.push([r.voucherDate||"",r.voucherNo||r.id,"","",r.projectCode||"",(r.description||`Chứng từ ${r.voucherType}`).trim(),r.projectCode||"",String(Number(r.totalAmount||0))]));return out;},[data,project]);
  const rows=data.capitalRecoveryRecords.filter((row)=>project==="ALL"||row.projectId===project);
  const payments=data.contractPayments.filter((row)=>project==="ALL"||row.projectId===project);
  const [finProjectId,setFinProjectId]=useState(project!=="ALL"&&project?project:(projects[0]?.id||"ALL"));
  const scopedRecovery=finProjectId&&finProjectId!=="ALL"?rows.filter((row)=>String(row.projectId)===String(finProjectId)):rows;
  const scopedPayments=finProjectId&&finProjectId!=="ALL"?payments.filter((row)=>String(row.projectId)===String(finProjectId)):payments;
  const byProject: Row[] = projects.map((p)=>{const pr=rows.filter((r)=>String(r.projectId)===String(p.id));const pay=payments.filter((r)=>String(r.projectId)===String(p.id));const invoiced=pr.reduce((s,r)=>s+Number(r.invoiceValue||0),0);const cash=pay.reduce((s,r)=>s+Number(r.amount||0),0);return {id:p.id,code:p.code,name:p.name,recoveryCount:pr.length,paymentCount:pay.length,invoiced,cash,debt:Math.max(0,invoiced-cash)} as Row;}).filter((p)=>project==="ALL"||String(p.id)===String(project));
  const totalInvoiced=byProject.reduce((s,p)=>s+Number(p.invoiced||0),0),totalCash=byProject.reduce((s,p)=>s+Number(p.cash||0),0),totalDebt=byProject.reduce((s,p)=>s+Number(p.debt||0),0);
  async function savePayment(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const recoveryRecordId=String(fd.get("recoveryRecordId")||"");if(!recoveryRecordId)return window.alert("Hãy chọn hồ sơ thu hồi vốn.");const payload=Object.fromEntries(fd);if(await action("save_contract_payment",{...payload,projectId:String(fd.get("projectId")||finProjectId)}))(event.currentTarget as HTMLFormElement).reset();}
  return <div className="stack module-screen"><div className="kpi-grid small"><Kpi icon="HD" label="Tổng hóa đơn" value={money(totalInvoiced)} note={`${byProject.filter(p=>Number(p.recoveryCount)>0).length} dự án có hồ sơ`}/><Kpi icon="TH" label="Tổng tiền thực thu" value={money(totalCash)} note={`${payments.length} khoản thu`} tone="green"/><Kpi icon="NO" label="Công nợ còn lại" value={money(totalDebt)} note={totalDebt>0?"Còn phải thu theo hóa đơn":"Đã thu đủ" } tone={totalDebt>0?"amber":"green"}/><Kpi icon="DU" label="Hồ sơ chưa thu" value={String(scopedRecovery.filter(r=>Number(r.cashReceived||0)===0).length)} note="Hồ sơ chưa phát sinh tiền thu"/></div>
  <section className="card"><CardHead title="Công nợ theo dự án" note="Căn cứ hóa đơn đã xuất so với tiền thực thu; chọn dự án để khoanh vùng chi tiết."/><div className="filter-grid"><label><span>Dự án</span><select value={finProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setFinProjectId(e.target.value)}><option value="ALL">Tất cả dự án</option>{projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div><div className="table-wrap"><table><thead><tr><th>Dự án</th><th>Hồ sơ thu hồi</th><th>Khoản thu</th><th>Tổng hóa đơn</th><th>Đã thu</th><th>Còn nợ</th><th>Tỷ lệ thu</th></tr></thead><tbody>{byProject.map((p)=>{const pct=Number(p.invoiced)>0?Math.round(Number(p.cash)*100/Number(p.invoiced)):0;return <tr key={p.id}><td><strong>{p.code}</strong><small>{p.name}</small></td><td>{p.recoveryCount}</td><td>{p.paymentCount}</td><td>{money(p.invoiced)}</td><td>{money(p.cash)}</td><td><strong className={Number(p.debt)>0?"red-text":""}>{money(p.debt)}</strong></td><td><StatusBadge value={`${pct}%`}/></td></tr>;})}{!byProject.length&&<tr><td colSpan={7}><Empty text="Không có dữ liệu công nợ trong phạm vi đang chọn."/></td></tr>}</tbody></table></div></section>
  <section className="card"><CardHead title="Chuỗi thu hồi vốn" note="Sản lượng duyệt → hồ sơ trình → hóa đơn → tiền thực thu; finance khoanh vùng theo dự án."/><div className="table-wrap"><table><thead><tr><th>Dự án</th><th>Kỳ / Hồ sơ</th><th>Sản lượng duyệt</th><th>Hồ sơ trình</th><th>Được duyệt</th><th>Hóa đơn</th><th>Tiền thực thu</th><th>Công nợ</th><th></th></tr></thead><tbody>{scopedRecovery.map((row)=>{const rowDebt=Math.max(0,Number(row.invoiceValue||0)-Number(row.cashReceived||0));return <tr key={row.id}><td><strong>{row.projectCode}</strong></td><td>{row.periodKey}<small>{row.referenceNo||"—"}</small></td><td>{money(row.productionApprovedValue)}</td><td>{money(row.submittedValue)}</td><td><strong>{money(row.approvedValue)}</strong></td><td>{row.invoiceNo||"—"}<small>{money(row.invoiceValue)}</small></td><td><strong>{money(row.cashReceived)}</strong></td><td><strong className={rowDebt>0?"red-text":""}>{money(rowDebt)}</strong></td><td><StatusBadge value={row.status}/></td></tr>;})}{!scopedRecovery.length&&<tr><td colSpan={9}><Empty text="Chưa có hồ sơ thu hồi vốn trong phạm vi đang chọn."/></td></tr>}</tbody></table></div></section>
  <section className="card"><CardHead title="Sổ tiền thực thu (Thanh toán HĐ)" note="Mỗi khoản thu liên kết hồ sơ thu hồi vốn; ghi nhận tại đây hoặc tại màn Thanh toán HĐ."/><div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Tham chiếu</th><th>Hồ sơ thu hồi</th><th>Mô tả</th><th>Số tiền</th></tr></thead><tbody>{scopedPayments.map((row)=><tr key={row.id}><td>{row.paymentDate}</td><td>{row.referenceNo||"—"}</td><td>{row.recoveryRecordId||"—"}</td><td>{row.description||"—"}</td><td><strong>{money(row.amount)}</strong></td></tr>)}{!scopedPayments.length&&<tr><td colSpan={5}><Empty text="Chưa có khoản thu trong phạm vi đang chọn."/></td></tr>}</tbody></table></div></section>
  <section className="card"><CardHead title="Sổ kế toán tổng hợp — xuất bút toán (MISA/Excel)" note="Gộp Thu hồi vốn, Thanh toán HĐ, Tạm ứng, Chi phí BCH, Sổ quỹ và Chứng từ thành bút toán chuẩn (Nợ/Có theo quy ước kế toán Việt Nam). Xuất CSV/XLSX để nạp vào phần mềm kế toán ngoài."/><div className="table-wrap"><table><thead><tr><th>Ngày</th><th>Số CT</th><th>TK Nợ</th><th>TK Có</th><th>Đối tượng</th><th>Diễn giải</th><th>Dự án</th><th>Giá trị</th></tr></thead><tbody>{ledgerRows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j}>{cell||"—"}</td>)}</tr>)}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={()=>{const headers=["Ngày","Số CT","TK Nợ","TK Có","Đối tượng","Diễn giải","Dự án","Giá trị"];const rr=reportRows(headers,ledgerRows,"So_ke_toan_tong_hop");reportExport(rr,"So_ke_toan_tong_hop");}}>⇩ CSV/XLSX</button><button className="export-mini" onClick={()=>{const blob=new Blob([JSON.stringify(ledgerRows.map((r)=>({ngay:r[0],so_ct:r[1],tk_no:r[2],tk_co:r[3],doi_tuong:r[4],dien_giai:r[5],du_an:r[6],gia_tri:Number(r[7]||0)})),null,2)],{type:"application/json;charset=utf-8"});downloadBlob(blob,`So_ke_toan_${new Date().toISOString().slice(0,10)}.json`);}}>⇩ JSON</button><button className="export-mini" onClick={()=>{const headers=["Ngày","Số CT","TK Nợ","TK Có","Đối tượng","Diễn giải","Dự án","Giá trị"];const rr=reportRows(headers,ledgerRows,"So_ke_toan_tong_hop");reportPdf(rr,"So_ke_toan_tong_hop","SỔ KẾ TOÁN TỔNG HỢP");}}>⇩ PDF</button><button className="export-mini" onClick={()=>printReport("SỔ KẾ TOÁN TỔNG HỢP", ["Ngày","Số CT","TK Nợ","TK Có","Đối tượng","Diễn giải","Dự án","Giá trị"], ledgerRows)}>🖶 In</button></div></section>
  <section className="card"><CardHead title="Báo cáo dòng tiền theo dự án" note="Thu (thanh toán HĐ, sổ quỹ thu) − Chi (tạm ứng, chi phí BCH, sổ quỹ chi) theo dự án; hỗ trợ đối soát tài chính."/><div className="table-wrap"><table><thead><tr><th>Dự án</th><th>Thu vào</th><th>Chi ra</th><th>Dòng tiền thuần</th><th>Tiền thực thu HĐ</th></tr></thead><tbody>{(()=>{const scoped=(r:Row)=>project==="ALL"||String(r.projectId||r.project_id||"")===String(project);const byProject=new Map<string,{in:number;out:number;recovery:number;code:string}>();for(const p of projects){byProject.set(String(p.id),{in:0,out:0,recovery:0,code:p.code});}(data.contractPayments||[]).filter(scoped).forEach((r)=>{const k=String(r.projectId);const e=byProject.get(k);if(e){e.in+=Number(r.amount||0);e.recovery+=Number(r.amount||0);}});(data.cashbookEntries||[]).forEach((r)=>{const k=String(r.projectId||"");const e=k&&byProject.has(k)?byProject.get(k):undefined;if(e){if(String(r.entryType)==="IN")e.in+=Number(r.amount||0);else e.out+=Number(r.amount||0);}});(data.advanceRequests||[]).filter(scoped).forEach((r)=>{const k=String(r.projectId||"");const e=k&&byProject.get(k);if(e)e.out+=Number(r.amount||0);});(data.siteExpenseClaims||[]).filter(scoped).forEach((r)=>{const k=String(r.projectId||"");const e=k&&byProject.get(k);if(e)e.out+=Number(r.amount||0);});return [...byProject.entries()].filter(([,v])=>v.in!==0||v.out!==0).map(([k,v])=>({...v,id:k}));})().map((r)=><tr key={r.id}><td><strong>{r.code}</strong></td><td>{money(r.in)}</td><td>{money(r.out)}</td><td><strong className={Number(r.in-r.out)<0?"red-text":""}>{money(Number(r.in)-Number(r.out))}</strong></td><td>{money(r.recovery)}</td></tr>)}</tbody></table></div><div className="row-actions"><button className="export-mini" onClick={()=>{const headers=["Dự án","Thu vào","Chi ra","Dòng tiền thuần","Tiền thực thu HĐ"];const rows=[];const scoped=(r:Row)=>project==="ALL"||String(r.projectId||r.project_id||"")===String(project);const byProject=new Map<string,Row>();for(const p of projects)byProject.set(String(p.id),{code:p.code,in:0,out:0,recovery:0});(data.contractPayments||[]).filter(scoped).forEach((r)=>{const e=byProject.get(String(r.projectId));if(e){e.in+=Number(r.amount||0);e.recovery+=Number(r.amount||0);}});(data.cashbookEntries||[]).forEach((r)=>{const e=byProject.get(String(r.projectId||""));if(e&&String(r.entryType)==="IN")e.in+=Number(r.amount||0);if(e&&String(r.entryType)==="OUT")e.out+=Number(r.amount||0);});(data.advanceRequests||[]).filter(scoped).forEach((r)=>{const e=byProject.get(String(r.projectId||""));if(e)e.out+=Number(r.amount||0);});(data.siteExpenseClaims||[]).filter(scoped).forEach((r)=>{const e=byProject.get(String(r.projectId||""));if(e)e.out+=Number(r.amount||0);});for(const [,v] of byProject){if(Number(v.in)||Number(v.out))rows.push([v.code,String(v.in),String(v.out),String(Number(v.in)-Number(v.out)),String(v.recovery)]);}const rr=reportRows(headers,rows,"Dong_tien_theo_du_an");reportExport(rr,"Bao_cao_Dong_tien");}}>⇩ CSV/XLSX</button><button className="export-mini" onClick={()=>{const headers=["Dự án","Thu vào","Chi ra","Dòng tiền thuần","Tiền thực thu HĐ"];const rows=[];const scoped=(r:Row)=>project==="ALL"||String(r.projectId||r.project_id||"")===String(project);const byProject=new Map<string,Row>();for(const p of projects)byProject.set(String(p.id),{code:p.code,in:0,out:0,recovery:0});(data.contractPayments||[]).filter(scoped).forEach((r)=>{const e=byProject.get(String(r.projectId));if(e){e.in+=Number(r.amount||0);e.recovery+=Number(r.amount||0);}});(data.cashbookEntries||[]).forEach((r)=>{const e=byProject.get(String(r.projectId||""));if(e&&String(r.entryType)==="IN")e.in+=Number(r.amount||0);if(e&&String(r.entryType)==="OUT")e.out+=Number(r.amount||0);});(data.advanceRequests||[]).filter(scoped).forEach((r)=>{const e=byProject.get(String(r.projectId||""));if(e)e.out+=Number(r.amount||0);});(data.siteExpenseClaims||[]).filter(scoped).forEach((r)=>{const e=byProject.get(String(r.projectId||""));if(e)e.out+=Number(r.amount||0);});for(const [,v] of byProject){if(Number(v.in)||Number(v.out))rows.push([v.code,String(v.in),String(v.out),String(Number(v.in)-Number(v.out)),String(v.recovery)]);}reportPdf(reportRows(headers,rows,"Dong_tien_theo_du_an"),"Bao_cao_Dong_tien","BÁO CÁO DÒNG TIỀN THEO DỰ ÁN");}}>⇩ PDF</button></div></section>
  </div>;
}
function SiteCommandScreen({data,project,action}:{data:AppData;project:string;action:(name:string,payload:Row)=>Promise<boolean>}){
  const projects=data.projects.filter((p)=>String(p.status||"active")==="active");
  const bchUnits=data.organizationUnits.filter((u)=>String(u.unitType)==="site_command"&&!u.archivedAt);
  const [bchProjectId,setBchProjectId]=useState(project!=="ALL"&&project?project:(projects[0]?.id||""));
  const visibleUnits=bchProjectId?bchUnits.filter((u)=>String(u.projectId||"")===String(bchProjectId)):bchUnits;
  const bchUnitIds=new Set(visibleUnits.map((u)=>String(u.id)));
  const members=data.staffDirectory.filter((m)=>bchUnitIds.has(String(m.organizationUnitId)));
  const unitTasks=data.workItems.filter((t)=>String(t.departmentCode)==="BCH"&&(bchProjectId?String(t.projectId||"")===String(bchProjectId):true));
  const candidates=data.staffDirectory.filter((m)=>!bchUnitIds.has(String(m.organizationUnitId)));
  const canManage=Boolean(isAdminUser(data.user)||modulePermission(data,"site_command").canEdit);
  async function saveMember(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const userId=String(fd.get("userId")||"");const organizationUnitId=String(fd.get("organizationUnitId")||"");if(!userId||!organizationUnitId)return;if(await action("set_organization_unit_member",{userId,organizationUnitId}))(event.currentTarget as HTMLFormElement).reset();}
  return <section className="card"><CardHead title="Ban chỉ huy công trường" note="BCH quản lý trực tiếp theo dự án đang hoạt động; thành viên là nhân sự gắn đơn vị Ban chỉ huy (site_command)."/><div className="filter-grid"><label><span>Dự án</span><select value={bchProjectId} onChange={(e:ChangeEvent<HTMLSelectElement>)=>setBchProjectId(e.target.value)}>{projects.map((p)=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label></div><div className="table-wrap"><table><thead><tr><th>Ban chỉ huy</th><th>Dự án</th><th>Số thành viên</th><th>Nhiệm vụ đang mở</th><th>Trạng thái</th></tr></thead><tbody>{visibleUnits.map((unit)=>{const unitMembers=members.filter((m)=>String(m.organizationUnitId)===String(unit.id));const openTasks=unitTasks.filter((t)=>String(t.projectId||"")===String(unit.projectId||"")&&!["COMPLETED","CANCELLED"].includes(String(t.status))).length;const projectRow=projects.find((p)=>String(p.id)===String(unit.projectId));return <tr key={unit.id}><td><strong>{unit.code}</strong><small>{unit.name}</small></td><td>{projectRow?`${projectRow.code} · ${projectRow.name}`:"—"}</td><td>{unitMembers.length}</td><td>{openTasks}</td><td><StatusBadge value={Number(unit.active)===1?"Đang hoạt động":"Ngừng hoạt động"}/></td></tr>;})}{!visibleUnits.length&&<tr><td colSpan={5}><Empty text="Chưa có Ban chỉ huy cho dự án đang chọn."/></td></tr>}</tbody></table></div><div><h3>Thành viên Ban chỉ huy</h3><div className="table-wrap"><table><thead><tr><th>Họ tên</th><th>Chức danh</th><th>Ban chỉ huy</th>{canManage&&<th></th>}</tr></thead><tbody>{members.map((m)=>{const unit=visibleUnits.find((u)=>String(u.id)===String(m.organizationUnitId));return <tr key={m.id}><td><strong>{m.fullName}</strong></td><td>{m.roleName||m.role||"—"}</td><td>{unit?`${unit.code} · ${unit.name}`:"—"}</td>{canManage&&<td><button type="button" className="export-mini danger" onClick={()=>{if(window.confirm(`Gỡ ${m.fullName} khỏi Ban chỉ huy?`))void action("set_organization_unit_member",{userId:m.id,organizationUnitId:""});}}>Gỡ</button></td>}</tr>;})}{!members.length&&<tr><td colSpan={canManage?4:3}><Empty text="Ban chỉ huy dự án này chưa có thành viên."/></td></tr>}</tbody></table></div>{canManage&&<form className="dept-assign-form" onSubmit={saveMember}><select name="organizationUnitId" required defaultValue=""><option value="">Chọn Ban chỉ huy</option>{visibleUnits.map((u)=><option key={u.id} value={u.id}>{u.code} · {u.name}</option>)}</select><select name="userId" required defaultValue=""><option value="">Chọn nhân sự</option>{candidates.map((u)=><option key={u.id} value={u.id}>{u.fullName} · {u.roleName||u.role||"—"}</option>)}</select><button className="primary">＋ Thêm thành viên</button></form>}</div><div><CardHead title={`Nhiệm vụ Ban chỉ huy · ${unitTasks.length}`} note="Công việc giao cho BCH theo Task Engine; chỉ hiện nhiệm vụ thuộc phạm vi dự án/phân quyền của bạn."/><div className="table-wrap"><table><thead><tr><th>Mã nhiệm vụ</th><th>Công việc</th><th>Dự án</th><th>Người phụ trách</th><th>Hạn</th><th>Trạng thái</th></tr></thead><tbody>{unitTasks.map((t)=><tr key={t.id}><td>{t.taskNo}</td><td><strong>{t.title}</strong></td><td>{t.projectCode||"—"}</td><td>{t.assignedToName}</td><td>{t.dueAt||"—"}</td><td><StatusBadge value={taskStatusLabel(t.status)}/></td></tr>)}{!unitTasks.length&&<tr><td colSpan={6}><Empty text="Chưa có nhiệm vụ BCH."/></td></tr>}</tbody></table></div></div></section>;
}
function SupplierManager({data,action}:{data:AppData;action:(name:string,payload:Row)=>Promise<boolean>}){
  const rows=data.adminSuppliers?.length?data.adminSuppliers:data.suppliers; const canDeleteSupplier=isAdminUser(data.user)||String(data.user.role)==="kh_truong"||roleBase(data.user)==="kh_truong";
  async function saveForm(event:FormEvent<HTMLFormElement>,supplier?:Row){event.preventDefault();const payload=Object.fromEntries(new FormData(event.currentTarget));const supplierId=supplier?.id;const active=supplier?(supplier.active?1:0):1;if(await action("save_supplier",{...payload,supplierId,active})&&!supplierId)(event.currentTarget as HTMLFormElement).reset();}
  return <section className="card"><CardHead title="Danh mục Nhà cung cấp dùng cho PO" note="Mã NCC được dùng trong mẫu Excel lập PO. Ẩn NCC không xóa PO/lịch sử cũ."/><form className="supplier-new-grid" onSubmit={(event)=>saveForm(event)}><input name="code" placeholder="Mã NCC *" required/><input name="name" placeholder="Tên nhà cung cấp *" required/><input name="taxCode" placeholder="Mã số thuế"/><input name="contactName" placeholder="Người liên hệ"/><input name="phone" placeholder="Điện thoại"/><input name="leadTimeDays" type="number" min="0" defaultValue="0" placeholder="Lead time"/><input name="rating" type="number" min="0" max="5" step="0.1" defaultValue="0" placeholder="Đánh giá"/><button className="primary">＋ Thêm NCC</button></form><div className="supplier-admin-list">{rows.map(row=><form className={`supplier-admin-row ${row.active?"":"inactive"}`} key={row.id} onSubmit={(event)=>saveForm(event,row)}><input name="code" defaultValue={row.code} required/><input name="name" defaultValue={row.name} required/><input name="taxCode" defaultValue={row.taxCode||""} placeholder="MST"/><input name="contactName" defaultValue={row.contactName||""} placeholder="Liên hệ"/><input name="phone" defaultValue={row.phone||""} placeholder="Điện thoại"/><input name="leadTimeDays" type="number" min="0" defaultValue={row.leadTimeDays||0}/><input name="rating" type="number" min="0" max="5" step="0.1" defaultValue={row.rating||0}/><button className="export-mini" type="submit">Lưu</button><button type="button" className={`export-mini ${row.active?"danger":""}`} onClick={()=>action("set_supplier_status",{supplierId:row.id,active:row.active?0:1})}>{row.active?"Ngừng sử dụng":"Kích hoạt"}</button>{canDeleteSupplier&&<button type="button" className="export-mini danger" onClick={()=>window.confirm(`Xóa/ngừng sử dụng NCC ${row.code}? NCC đã có PO sẽ chỉ được ngừng sử dụng.`)&&action("delete_supplier",{supplierId:row.id})}>Xóa</button>}</form>)}{!rows.length&&<Empty text="Chưa có Nhà cung cấp. Hãy thêm NCC trước khi lập PO."/>}</div></section>;
}


function joinCodes(values:unknown[]){return values.map((value)=>String(value||"").trim()).filter(Boolean).join("; ");}
function userPermissionSpec(data:AppData,userId:string,mode:"grant"|"revoke"){return data.allModulePermissions.filter((p)=>String(p.userId)===String(userId)&&String(p.permissionSource)==="manual_override").filter((p)=>mode==="grant"?Boolean(p.canView||p.canUse||p.canCreate||p.canEdit||p.canApprove||p.canExport):!(p.canView||p.canUse||p.canCreate||p.canEdit||p.canApprove||p.canExport)).map((p)=>{const rights=[p.canView&&"view",p.canUse&&"use",p.canCreate&&"create",p.canEdit&&"edit",p.canApprove&&"approve",p.canExport&&"export"].filter(Boolean).join(",");return mode==="grant"?`${p.moduleKey}:${rights||"view,use"}`:String(p.moduleKey);}).join("; ");}
function downloadUserBulkTemplate(data:AppData){downloadSimpleXlsx({sheetName:"Tai khoan",title:"MẪU IMPORT TÀI KHOẢN & PHÂN QUYỀN VNTECH ERP",subtitle:"Tạo mới/cập nhật hàng loạt. Không xuất mật khẩu hiện tại; tài khoản mới bắt buộc nhập mật khẩu đúng chính sách.",headers:USER_BULK_HEADERS,notes:["Tùy chọn, duy nhất","Bắt buộc","Bắt buộc, duy nhất","Bắt buộc khi tạo mới; để trống khi cập nhật để giữ mật khẩu","Email","Tên/mã phòng theo hệ thống","Mã chức danh canonical","Nhiều mã ngăn cách ;","Nhiều mã kho ngăn cách ;","VD boq:view,use,export; payments:view,use","Mã module ngăn cách ; để thu hồi toàn bộ quyền module","ACTIVE hoặc LOCKED"],widths:[18,28,22,24,30,24,22,28,28,42,36,16],freezeRows:4},"Mau_Import_Tai_Khoan_Phan_Quyen_VNTECH");}
function exportUsersBulkXlsx(data:AppData){const rows=data.users.map((u)=>{const projects=data.userScopes.filter((s)=>String(s.userId)===String(u.id)).map((s)=>s.projectCode||data.projects.find((p)=>p.id===s.projectId)?.code||"");const warehouses=data.userWarehouseScopes.filter((s)=>String(s.userId)===String(u.id)).map((s)=>s.warehouseCode||data.warehouses.find((w)=>w.id===s.warehouseId)?.code||"");return [u.employeeCode||"",u.fullName||"",u.username||"","",u.email||"",u.department||"",u.role||"",joinCodes(projects),joinCodes(warehouses),userPermissionSpec(data,String(u.id),"grant"),userPermissionSpec(data,String(u.id),"revoke"),u.active?"ACTIVE":"LOCKED"];});downloadSimpleXlsx({sheetName:"Tai khoan",title:"DANH SÁCH TÀI KHOẢN & PHÂN QUYỀN VNTECH ERP",subtitle:"Cột Mật khẩu luôn để trống vì hệ thống không bao giờ xuất mật khẩu/hash. Có thể chỉnh dữ liệu và import lại để cập nhật hàng loạt.",headers:USER_BULK_HEADERS,rows,widths:[18,28,22,24,30,24,22,28,28,42,36,16],freezeRows:3},"Danh_Sach_Tai_Khoan_Phan_Quyen_VNTECH");}
function downloadProjectBulkTemplate(){downloadSimpleXlsx({sheetName:"Du an",title:"MẪU IMPORT DỰ ÁN VNTECH ERP",subtitle:"Mã dự án đã tồn tại sẽ được cập nhật; mã mới sẽ tạo dự án và kho công trường riêng.",headers:PROJECT_BULK_HEADERS,notes:["Bắt buộc, A-Z/0-9/._-","Bắt buộc","Mặc định KHO-<Mã DA>","Mặc định Kho công trường <Mã DA>","Tùy chọn","Tùy chọn","DD/MM/YYYY","DD/MM/YYYY","ACTIVE hoặc INACTIVE"],widths:[18,34,20,34,22,36,18,18,16],freezeRows:4},"Mau_Import_Du_An_VNTECH");}
function exportProjectsBulkXlsx(data:AppData){const rows=data.adminProjects.map((p)=>{const wh=data.warehouses.find((w)=>String(w.projectId)===String(p.id)&&String(w.type)==="site");return [p.code||"",p.name||"",wh?.code||"",wh?.name||"",p.contractNo||"",p.contractName||"",p.startDate||"",p.plannedEndDate||"",String(p.status||"active").toUpperCase()];});downloadSimpleXlsx({sheetName:"Du an",title:"DANH SÁCH DỰ ÁN VNTECH ERP",subtitle:"Có thể chỉnh các cột và import lại để cập nhật hàng loạt.",headers:PROJECT_BULK_HEADERS,rows,widths:[18,34,20,34,22,36,18,18,16],freezeRows:3},"Danh_Sach_Du_An_VNTECH");}

function PersonalExceptionManager({data,open,action}:{data:AppData;open:(name:string,row?:Row)=>void;action:(name:string,payload:Row)=>Promise<boolean>}){
  const manual=data.allModulePermissions.filter(p=>String(p.permissionSource)==="manual_override");
  const [query,setQuery]=useState(""); const [department,setDepartment]=useState("ALL"); const [projectId,setProjectId]=useState("ALL"); const [status,setStatus]=useState("HAS");
  const departments=[...new Set(data.users.map(u=>String(u.department||"").trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"vi"));
  const projectUserIds=projectId==="ALL"?null:new Set(data.userScopes.filter(s=>String(s.projectId)===projectId).map(s=>String(s.userId)));
  const filtered=data.users.filter(u=>{const q=query.trim().toLocaleLowerCase("vi");const matchText=!q||`${u.fullName||""} ${u.employeeCode||""} ${u.username||""}`.toLocaleLowerCase("vi").includes(q);const matchDep=department==="ALL"||String(u.department||"")===department;const matchProject=!projectUserIds||projectUserIds.has(String(u.id));const count=manual.filter(p=>String(p.userId)===String(u.id)).length;const matchStatus=status==="ALL"||(status==="HAS"?count>0:count===0);return matchText&&matchDep&&matchProject&&matchStatus;});
  const [selectedId,setSelectedId]=useState("");
  // Keep the detail pane aligned with the filtered employee list.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{if(!filtered.some(u=>String(u.id)===selectedId))setSelectedId(String(filtered[0]?.id||""));},[query,department,projectId,status,data.users.length]);
  const selected=data.users.find(u=>String(u.id)===selectedId)||filtered[0]; const exceptions=selected?manual.filter(p=>String(p.userId)===String(selected.id)):[];
  return <section className="card personal-exception-manager"><CardHead title="Ngoại lệ cá nhân" note="Chọn nhân viên để xem và điều chỉnh các quyền khác mặc định theo phòng/bộ phận."/><div className="exception-filter-row"><label><span>Tìm nhân viên</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tên, mã NV, tài khoản..."/></label><label><span>Phòng ban</span><select value={department} onChange={e=>setDepartment(e.target.value)}><option value="ALL">Tất cả phòng ban</option>{departments.map(d=><option key={d} value={d}>{d}</option>)}</select></label><label><span>Dự án</span><select value={projectId} onChange={e=>setProjectId(e.target.value)}><option value="ALL">Tất cả dự án</option>{data.adminProjects.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label><label><span>Trạng thái</span><select value={status} onChange={e=>setStatus(e.target.value)}><option value="HAS">Có ngoại lệ</option><option value="NONE">Chưa có ngoại lệ</option><option value="ALL">Tất cả</option></select></label></div><div className="exception-layout"><aside className="exception-users"><div className="exception-pane-head"><strong>Nhân sự</strong><span>{filtered.length} người</span></div>{filtered.slice(0,100).map(u=>{const count=manual.filter(p=>String(p.userId)===String(u.id)).length;return <button key={u.id} className={String(selected?.id)===String(u.id)?"active":""} onClick={()=>setSelectedId(String(u.id))}><div><b>{u.fullName}</b><small>{u.employeeCode||u.username} · {u.department||"—"}</small></div><span>{count} ngoại lệ</span></button>})}{!filtered.length&&<Empty text="Không có nhân sự phù hợp bộ lọc."/>}</aside><section className="exception-detail">{selected?<><header><div><h3>Ngoại lệ cá nhân của {selected.fullName}</h3><p>{selected.employeeCode||selected.username} · {selected.department||"—"}</p></div><button className="primary" onClick={()=>open("access",selected)}>Sửa tác vụ / Cấp ngoại lệ</button></header><div className="table-wrap"><table><thead><tr><th>Tác vụ / Chức năng</th><th>Quyền cá nhân</th><th>Hết hạn</th><th>Thao tác</th></tr></thead><tbody>{exceptions.map(p=><tr key={`${p.userId}-${p.moduleKey}`}><td><strong>{modules.find(m=>m.key===p.moduleKey)?.label||p.moduleKey}</strong></td><td>{[p.canView&&"Xem",p.canUse&&"Thao tác",p.canCreate&&"Tạo",p.canEdit&&"Sửa",p.canApprove&&"Duyệt",p.canExport&&"Xuất"].filter(Boolean).join(", ")||"Thu hồi toàn bộ"}</td><td>{p.permissionExpiresAt?date(p.permissionExpiresAt):"Không thời hạn"}</td><td><div className="row-actions"><button className="export-mini" onClick={()=>open("access",selected)}>Sửa</button><button className="export-mini danger" onClick={()=>window.confirm(`Xóa ngoại lệ ${modules.find(m=>m.key===p.moduleKey)?.label||p.moduleKey} của ${selected.fullName}? Quyền sẽ quay về mặc định phòng.`)&&action("delete_user_module_override",{userId:selected.id,moduleKey:p.moduleKey})}>Xóa</button></div></td></tr>)}{!exceptions.length&&<tr><td colSpan={4}><Empty text="Nhân viên này chưa có ngoại lệ; đang dùng quyền mặc định theo phòng/bộ phận."/></td></tr>}</tbody></table></div></>:<Empty text="Chọn một nhân viên để xem ngoại lệ."/>}</section></div></section>;
}

function TrustMetric({label,value}:{label:string;value:ReactNode}){return <article className="kpi"><small>{label}</small><strong>{value}</strong></article>;}

function FactoryResetAdmin({data}:{data:AppData}){
  const enabled=Boolean(data.serverInfo?.factoryResetEnabled);
  const [preview,setPreview]=useState<Row|null>(null);
  const [password,setPassword]=useState("");
  const [confirmText,setConfirmText]=useState("");
  const [backupConfirmed,setBackupConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  async function loadPreview(){setBusy(true);setMessage("");try{const result=await requestApi("factory_reset_preview",{});setPreview(result);setMessage(String(result.message||""));}catch(error){setMessage(error instanceof Error?error.message:"Không thể kiểm tra Factory Reset.");}finally{setBusy(false);}}
  async function executeReset(){
    if(!enabled)return;
    if(confirmText!=="KHOI PHUC CAI DAT GOC"||!backupConfirmed||!password){setMessage("Cần xác nhận backup, nhập mật khẩu hiện tại và đúng chuỗi KHOI PHUC CAI DAT GOC.");return;}
    if(!window.confirm("KHÔI PHỤC CÀI ĐẶT GỐC sẽ xóa dữ liệu nghiệp vụ/người dùng và đưa database về trạng thái cài mới của phiên bản hiện tại. Tiếp tục?"))return;
    setBusy(true);setMessage("");
    try{const result=await requestApi("factory_reset_execute",{confirmText,backupConfirmed,password});setMessage(String(result.message||"Đã khôi phục cài đặt gốc."));window.setTimeout(()=>window.location.reload(),1200);}catch(error){setMessage(error instanceof Error?error.message:"Khôi phục cài đặt gốc thất bại.");}finally{setBusy(false);}
  }
  const counts=preview?.counts&&typeof preview.counts==="object"?preview.counts as Row:{};
  return <section className="card factory-reset-card" id="factory-reset"><CardHead title="KHÔI PHỤC CÀI ĐẶT GỐC" note="Dành cho môi trường test: đưa dữ liệu về đúng trạng thái sau cài mới của phiên bản hiện tại; không gỡ source, Docker, migration, .env/secrets hoặc Trust Root."/>
    <div className={`factory-reset-status ${enabled?"enabled":"locked"}`}><strong>{enabled?"ĐÃ MỞ CHO MÔI TRƯỜNG TEST":"ĐANG KHÓA"}</strong><span>{enabled?"Server cho phép Factory Reset. Bắt buộc backup bên ngoài trước khi thực hiện.":"Bật VNTECH_ALLOW_FACTORY_RESET=1 trên máy chủ test rồi khởi động lại ứng dụng. Không mở mặc định trên môi trường vận hành."}</span></div>
    <div className="row-actions"><button className="secondary" disabled={busy} onClick={()=>void loadPreview()}>Kiểm tra dữ liệu sẽ reset</button></div>
    {preview&&<div className="factory-reset-preview"><strong>Dữ liệu dự kiến xử lý: {Number(preview.total||0).toLocaleString("vi-VN")} bản ghi</strong><div className="factory-reset-counts">{Object.entries(counts).map(([key,value])=><span key={key}>{key}: <b>{Number(value||0).toLocaleString("vi-VN")}</b></span>)}</div></div>}
    <div className="factory-reset-confirm"><label><span>Mật khẩu quản trị hiện tại</span><input type="password" value={password} onChange={event=>setPassword(event.target.value)} autoComplete="current-password" disabled={!enabled||busy}/></label><label><span>Nhập chính xác: <b>KHOI PHUC CAI DAT GOC</b></span><input value={confirmText} onChange={event=>setConfirmText(event.target.value)} disabled={!enabled||busy}/></label><label className="factory-reset-check"><input type="checkbox" checked={backupConfirmed} onChange={event=>setBackupConfirmed(event.target.checked)} disabled={!enabled||busy}/><span>Tôi xác nhận đã tạo backup PostgreSQL/storage cần thiết trước khi reset.</span></label><button className="danger" disabled={!enabled||busy||!password||!backupConfirmed||confirmText!=="KHOI PHUC CAI DAT GOC"} onClick={()=>void executeReset()}>{busy?"Đang xử lý...":"KHÔI PHỤC CÀI ĐẶT GỐC"}</button></div>
    {message&&<div className="inline-alert">{message}</div>}
  </section>;
}

function TrustLockAdmin({data,action}:{data:AppData;action:(name:string,payload:Row)=>Promise<boolean>}){
  const [expanded,setExpanded]=useState(false); const status=data.trustStatus||{}; const settings=status.trustSettings||{}; const runtime=status.runtime||{}; const license=status.installedLicense;
  async function saveSettings(event:FormEvent<HTMLFormElement>){event.preventDefault();await action("save_trust_development_settings",Object.fromEntries(new FormData(event.currentTarget)));}
  async function installLicense(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);await action("install_license_foundation",{licenseEnvelope:String(form.get("licenseEnvelope")||"")});}
  async function requestTransfer(event:FormEvent<HTMLFormElement>){event.preventDefault();await action("request_license_transfer",Object.fromEntries(new FormData(event.currentTarget)));}
  return <section className="card trust-lock-admin"><div className="table-toolbar"><div><strong>VNTECH LICENSE & TRUST</strong><span>Nền móng xác minh đã tích hợp. FULL W2 đang ở Development Mode; chưa enforce license.</span></div><button type="button" className="secondary" onClick={()=>setExpanded(value=>!value)} aria-expanded={expanded}>{expanded?"▴ Thu gọn":"▾ Mở chi tiết"}</button></div>{expanded&&<><div className="metric-grid"><TrustMetric label="Trust Foundation" value={status.foundationReady?"READY":"NOT READY"}/><TrustMetric label="License Enforcement" value="DISABLED – BY DESIGN"/><TrustMetric label="License" value={license?.status||runtime.license?.status||"Chưa cài"}/><TrustMetric label="Private key" value={status.privateKeyPresent?"VI PHẠM":"NOT PRESENT"}/></div><div className="inline-alert"><b>Trust Root:</b> {settings.keyId||VNTECH_BRAND.trust.keyId} · {settings.algorithm||VNTECH_BRAND.trust.algorithm}<br/><b>Tenant:</b> {settings.tenantId||VNTECH_BRAND.company.tenantId} · <b>Machine fingerprint:</b> <span className="code">{settings.machineFingerprint||runtime.machineFingerprint||"Chưa ghi nhận"}</span><br/><b>Release fingerprint:</b> <span className="code">{settings.releaseFingerprint||VNTECH_BRAND.release.releaseFingerprint}</span></div><div className="form-grid"><form onSubmit={saveSettings}><h3>Cấu hình nền License Server</h3><label><span>HTTPS endpoint (chưa gọi định kỳ)</span><input name="licenseServerUrl" type="url" defaultValue={settings.licenseServerUrl||""} placeholder="https://license.vntech..."/></label><input type="hidden" name="enforcementEnabled" value="0"/><button className="secondary">Lưu cấu hình nền</button></form><form onSubmit={installLicense}><h3>Xác minh license thủ công</h3><label><span>Signed license envelope JSON</span><textarea name="licenseEnvelope" rows={4} placeholder='{"payload":{},"keyId":"...","signature":"..."}' required/></label><button className="secondary">Kiểm tra & lưu Development</button></form><form onSubmit={requestTransfer}><h3>Recovery / Transfer foundation</h3><input type="hidden" name="licenseId" value={license?.licenseId||""}/><label><span>Machine fingerprint đích</span><input name="destinationMachineFingerprint" pattern="[a-fA-F0-9]{64}"/></label><label><span>Lý do *</span><input name="reason" required/></label><button className="secondary">Ghi nhận yêu cầu</button></form></div><div className="inline-alert"><b>Chưa enforce:</b> startup blocking, periodic online attestation, TPM bắt buộc, native binary verifier và signed-release bắt buộc. Những phần này chỉ được bật sau quy trình Production License riêng.</div></>}</section>;
}

function OrganizationUnitManager({data,action}:{data:AppData;action:(name:string,payload:Row)=>Promise<boolean>}){
  const [selected,setSelected]=useState<Row|null>(null);
  const units=data.organizationUnits||[];
  const parents=units.filter((row)=>row.active&&row.id!==selected?.id);
  async function save(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    const payload=Object.fromEntries(new FormData(event.currentTarget));
    if(await action("save_organization_unit",{...payload,organizationUnitId:selected?.id}))setSelected(null);
  }
  async function toggle(row:Row){
    if(!window.confirm(`${row.active?"Lưu trữ":"Kích hoạt"} đơn vị ${row.code} · ${row.name}?`))return;
    if(await action("set_organization_unit_status",{organizationUnitId:row.id,active:row.active?0:1}))setSelected(null);
  }
  return <section className="card"><CardHead title="Cơ cấu tổ chức canonical" note="Phòng ban và BCH dùng một danh mục gốc; hỗ trợ cấp trên, dự án, ngày hiệu lực và lưu trữ không mất lịch sử."/><form key={String(selected?.id||"new")} onSubmit={save}><div className="form-grid"><label><span>Mã đơn vị *</span><input name="code" required defaultValue={selected?.code||""}/></label><label><span>Tên đơn vị *</span><input name="name" required defaultValue={selected?.name||""}/></label><label><span>Loại *</span><select name="unitType" defaultValue={selected?.unitType||"department"}><option value="company">Công ty</option><option value="department">Phòng/Bộ phận</option><option value="site_command">Ban chỉ huy dự án</option></select></label><label><span>Đơn vị cấp trên</span><select name="parentId" defaultValue={selected?.parentId||""}><option value="">— Không có —</option>{parents.map((row)=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label><span>Dự án (cho BCH)</span><select name="projectId" defaultValue={selected?.projectId||""}><option value="">— Danh mục cha —</option>{data.adminProjects.map((row)=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label><span>Thứ tự</span><input name="sortOrder" type="number" defaultValue={selected?.sortOrder??100}/></label><label><span>Hiệu lực từ</span><input name="effectiveFrom" type="date" defaultValue={selected?.effectiveFrom||""}/></label><label><span>Hiệu lực đến</span><input name="effectiveTo" type="date" defaultValue={selected?.effectiveTo||""}/></label><label className="span-2"><span>Mô tả</span><input name="description" defaultValue={selected?.description||""}/></label></div><div className="row-actions"><button className="primary" type="submit">{selected?"Lưu đơn vị":"＋ Thêm đơn vị"}</button>{selected&&<button className="secondary" type="button" onClick={()=>setSelected(null)}>Hủy sửa</button>}</div></form><div className="table-wrap"><table><thead><tr><th>Mã</th><th>Đơn vị</th><th>Loại</th><th>Cấp trên / Dự án</th><th>Hiệu lực</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>{units.map((row)=><tr key={row.id}><td><strong>{row.code}</strong></td><td>{row.name}<small>{row.description||"—"}</small></td><td>{row.unitType}</td><td>{row.parentName||"—"}<small>{row.projectCode?`${row.projectCode} · ${row.projectName}`:""}</small></td><td>{row.effectiveFrom||"—"}<small>{row.effectiveTo?` đến ${row.effectiveTo}`:""}</small></td><td><StatusBadge value={row.active?"Đang dùng":"Đã lưu trữ"}/></td><td><div className="row-actions"><button className="export-mini" onClick={()=>setSelected(row)}>Sửa</button><button className="export-mini" disabled={Boolean(row.systemLocked&&row.active)} onClick={()=>void toggle(row)}>{row.active?"Lưu trữ":"Kích hoạt"}</button></div></td></tr>)}</tbody></table></div></section>;
}

// ---------------------------------------------------------------------------
// ĐỢT P4 — WORKFLOW ĐA LUỒNG
// Nhiều quy trình · mỗi quy trình nhiều bước · mỗi bước nhiều người duyệt đích danh.
// approval_mode: single (1 người) · any_of (1 trong nhiều người là qua) · all_of (tất cả phải duyệt).
// ---------------------------------------------------------------------------
const APPROVAL_MODE_LABELS: Record<string, string> = {
  single: "Một người duyệt",
  any_of: "Một trong nhiều người duyệt là qua",
  all_of: "Tất cả người duyệt phải xác nhận",
};
const APPROVAL_MODE_SHORT: Record<string, string> = { single: "1 người", any_of: "1 trong nhiều", all_of: "Tất cả" };

/** Ứng viên người duyệt: ưu tiên người có quyền canApprove trên chức năng đang cấu hình. */
function workflowApproverCandidates(data: AppData, moduleKey: string): Row[] {
  return (data.users || [])
    .filter((u) => Number(u.active ?? 1) === 1)
    .map((u): Row => {
      const perm = (data.allModulePermissions || []).find(
        (p) => String(p.userId) === String(u.id) && String(p.moduleKey) === moduleKey);
      const isAdmin = String(u.role) === "admin";
      return { ...u, hasApprovePermission: isAdmin || Number(perm?.canApprove) === 1 };
    })
    .sort((a, b) => Number(b.hasApprovePermission) - Number(a.hasApprovePermission)
      || String(a.fullName || "").localeCompare(String(b.fullName || ""), "vi"));
}

// ---------------------------------------------------------------------------
// ĐỢT P5 — PHÂN QUYỀN PHÒNG BAN · PHÂN QUYỀN NGƯỜI DÙNG · CẤP BẬC HỆ THỐNG
// ---------------------------------------------------------------------------
// =============================================================================
// MỤC 7/8 — DANH SÁCH NHÂN SỰ FULL MÀN
// Yêu cầu: «danh sách nhân sự đang không hiển thị đúng danh sách mà bị chia đôi màn
// hình ra rồi, tôi muốn nó phải hiển thị dạng danh sách full màn và có các chức năng
// crud search sort fillter».
// → Bảng toàn màn hình + tìm kiếm + lọc (phòng ban / chức danh / trạng thái) +
//   sắp xếp + phân trang + nút CRUD (Hồ sơ / Sửa / Quyền) dùng chung modal với admin.
// =============================================================================
function AdminStaffList({ data, open, query }: { data: AppData; open: (name: string, row?: Row) => void; query: string }) {
  const [dept, setDept] = useState("ALL");
  const [role, setRole] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [sortBy, setSortBy] = useState("name");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const users: Row[] = data.users || [];
  const depts = [...new Set(users.map((u) => String(u.organizationName || u.department || "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));
  const roles = [...new Set(users.map((u) => String(u.roleName || u.role || "")).filter(Boolean))].sort((a, b) => a.localeCompare(b, "vi"));

  const rows = users
    .filter((u) => status === "ALL" || (status === "ACTIVE" ? u.active !== false : u.active === false))
    .filter((u) => dept === "ALL" || String(u.organizationName || u.department || "") === dept)
    .filter((u) => role === "ALL" || String(u.roleName || u.role || "") === role)
    .filter((u) => !query.trim() ||
      `${u.fullName || ""} ${u.email || ""} ${u.username || ""} ${u.employeeCode || ""}`.toLocaleLowerCase("vi")
        .includes(query.trim().toLocaleLowerCase("vi")))
    .sort((a, b) => {
      if (sortBy === "code") return String(a.employeeCode || "").localeCompare(String(b.employeeCode || ""));
      if (sortBy === "dept") return String(a.organizationName || a.department || "").localeCompare(String(b.organizationName || b.department || ""), "vi");
      if (sortBy === "role") return String(a.roleName || a.role || "").localeCompare(String(b.roleName || b.role || ""), "vi");
      return String(a.fullName || "").localeCompare(String(b.fullName || ""), "vi");
    });

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const shown = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  // Đổi bộ lọc thì quay về trang 1.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPage(1); }, [query, dept, role, status, sortBy, pageSize]);

  return <div className="staff-full">
    <div className="staff-full-filters">
      {/* Ô tìm kiếm đã chuyển lên ListToolbar của danh sách (khuôn §5) — trạng thái tìm vẫn do màn cha giữ và truyền xuống qua prop query. */}
      <select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Lọc phòng ban"><option value="ALL">Tất cả phòng ban</option>{depts.map((d) => <option key={d} value={d}>{d}</option>)}</select>
      <select value={role} onChange={(e) => setRole(e.target.value)} aria-label="Lọc chức danh"><option value="ALL">Tất cả chức danh</option>{roles.map((r) => <option key={r} value={r}>{r}</option>)}</select>
      <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Lọc trạng thái"><option value="ALL">Tất cả trạng thái</option><option value="ACTIVE">Đang hoạt động</option><option value="LOCKED">Đã khoá</option></select>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Sắp xếp"><option value="name">Sắp xếp: Họ tên</option><option value="code">Sắp xếp: Mã NV</option><option value="dept">Sắp xếp: Phòng ban</option><option value="role">Sắp xếp: Chức danh</option></select>
      <select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))} aria-label="Số dòng mỗi trang"><option value="25">25/trang</option><option value="50">50/trang</option><option value="100">100/trang</option></select>
    </div>
    <div className="table-wrap"><table className="baseline-table staff-full-table">
      <thead><tr>
        <th>STT</th><th>Mã NV</th><th>Họ tên</th><th>Tài khoản</th><th>Chức danh</th>
        <th>Phòng ban</th><th>Email</th><th>Trạng thái</th><th>Thao tác</th>
      </tr></thead>
      <tbody>
        {shown.map((u, i) => <tr key={String(u.id)}>
          <td>{(safePage - 1) * pageSize + i + 1}</td>
          <td><strong className="code">{u.employeeCode || "—"}</strong></td>
          <td><strong>{u.fullName}</strong></td>
          <td>{u.username || "—"}</td>
          <td>{u.roleName || u.role || "—"}</td>
          <td>{u.organizationName || u.department || "—"}</td>
          <td>{u.email || "—"}</td>
          <td><StatusBadge value={u.active === false ? "Đã khoá" : "Đang hoạt động"}/></td>
          <td><div className="row-actions">
            <button type="button" className="export-mini" onClick={() => open("userProfile", u)}>Hồ sơ</button>
            <button type="button" className="export-mini" onClick={() => open("userEdit", u)}>Sửa</button>
            <button type="button" className="export-mini" onClick={() => open("access", u)}>Quyền</button>
          </div></td>
        </tr>)}
        {!shown.length && <tr><td colSpan={9}><Empty text="Không có nhân sự phù hợp bộ lọc."/></td></tr>}
      </tbody>
    </table></div>
    <div className="table-pagination">
      <span>{rows.length} nhân sự · trang {safePage}/{pageCount}</span>
      <div>
        <button type="button" disabled={safePage <= 1} onClick={() => setPage(1)}>«</button>
        <button type="button" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>‹</button>
        <button type="button" disabled={safePage >= pageCount} onClick={() => setPage(safePage + 1)}>›</button>
        <button type="button" disabled={safePage >= pageCount} onClick={() => setPage(pageCount)}>»</button>
      </div>
    </div>
  </div>;
}

const PERM_CAPS: { key: string; label: string }[] = [
  { key: "canView", label: "Xem" }, { key: "canUse", label: "Thao tác" },
  { key: "canCreate", label: "Tạo" }, { key: "canEdit", label: "Sửa" },
  { key: "canApprove", label: "Duyệt" }, { key: "canExport", label: "Xuất" },
];
const EMPTY_CAPS: Row = { canView: 0, canUse: 0, canCreate: 0, canEdit: 0, canApprove: 0, canExport: 0 };
const capsCount = (row: Row) => PERM_CAPS.reduce((n, c) => n + (Number(row?.[c.key]) === 1 ? 1 : 0), 0);

/** Tab "Phân quyền phòng ban" — cấp quyền HÀNG LOẠT cho cả phòng ban. */
function DepartmentPermissionManager({ data, action }: { data: AppData; action: (name: string, payload: Row) => Promise<boolean> }) {
  const depts = (data.organizationUnits || []).filter((o) => Number(o.active ?? 1) === 1 && o.unitType !== "company");
  const [deptId, setDeptId] = useState(String(depts[0]?.id || ""));
  const [draft, setDraft] = useState<Record<string, Row>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const modules = configuredModules(data).filter((m) => m.key !== "admin");
  const savedRows = (data.departmentModulePermissions || []).filter((r) => String(r.organizationUnitId) === deptId);
  // Đổi phòng ban thì bỏ bản nháp đang sửa của phòng trước.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setDraft({}); setMsg(""); }, [deptId]);
  const valueOf = (moduleKey: string): Row => {
    if (draft[moduleKey]) return draft[moduleKey];
    const row = savedRows.find((r) => String(r.moduleKey) === moduleKey);
    return row
      ? { canView: Number(row.canView), canUse: Number(row.canUse), canCreate: Number(row.canCreate), canEdit: Number(row.canEdit), canApprove: Number(row.canApprove), canExport: Number(row.canExport) }
      : { ...EMPTY_CAPS };
  };
  const toggle = (moduleKey: string, cap: string) => {
    const cur = valueOf(moduleKey);
    const next: Row = { ...cur, [cap]: Number(cur[cap]) === 1 ? 0 : 1 };
    if (cap === "canView" && Number(next.canView) === 0) {
      PERM_CAPS.forEach((c) => { next[c.key] = 0; });
    } else if (cap !== "canView" && Number(next[cap]) === 1) {
      next.canView = 1;   // có thao tác thì tối thiểu phải được xem
    }
    setDraft((d) => ({ ...d, [moduleKey]: next }));
  };
  const applyPrefix = (prefix: string) => setDraft((d) => {
    const next = { ...d };
    modules.filter((m) => m.key.startsWith(prefix)).forEach((m) => {
      next[m.key] = { canView: 1, canUse: 1, canCreate: 1, canEdit: 1, canApprove: 0, canExport: 1 };
    });
    return next;
  });
  const clearAll = () => setDraft(Object.fromEntries(modules.map((m) => [m.key, { ...EMPTY_CAPS }])));
  const changed = Object.keys(draft);
  async function save() {
    if (!deptId) return setMsg("Hãy chọn phòng ban.");
    if (!changed.length) return setMsg("Chưa có thay đổi nào để lưu.");
    setBusy(true);
    let ok = 0;
    for (const moduleKey of changed) {
      if (await action("save_department_permission", { organizationUnitId: deptId, moduleKey, ...draft[moduleKey] })) ok++;
    }
    setBusy(false);
    setMsg(`Đã lưu ${ok}/${changed.length} chức năng và đồng bộ lại quyền của nhân sự trong phòng.`);
    setDraft({});
  }
  const deptName = depts.find((d) => String(d.id) === deptId);
  return <div className="stack">
    <div className="kpi-grid small">
      <Kpi icon="PB" label="Phòng ban đang cấu hình" value={String(((data.departmentModulePermissions || []).map((r) => String(r.organizationUnitId)).filter((v, i, a) => a.indexOf(v) === i)).length)} note="Số phòng đã được cấp quyền" />
      <Kpi icon="CN" label="Lượt cấp quyền chức năng" value={String((data.departmentModulePermissions || []).length)} note="Tổng số dòng quyền phòng ban" tone="green" />
      <Kpi icon="S" label="Thay đổi chưa lưu" value={String(changed.length)} note="Bấm “Lưu thay đổi” để áp dụng" tone={changed.length ? "amber" : "blue"} />
    </div>
    <section className="card dept-perm-card">
      <CardHead title="Phân quyền theo phòng ban" note="Chọn phòng ở cột DANH SÁCH PHÒNG BAN bên trái. Quyền hiển thị dạng checkbox; nhân sự trong phòng hưởng quyền này." />
      <div className="dept-perm-layout">
        <aside className="dept-perm-list">
          <div className="dept-perm-list-head"><strong>DANH SÁCH PHÒNG BAN</strong><span>{depts.length} phòng</span></div>
          {depts.map((o) => {
            const granted = (data.departmentModulePermissions || []).filter((r) => String(r.organizationUnitId) === String(o.id)).length;
            return <button key={String(o.id)} type="button" className={String(o.id) === deptId ? "active" : ""} onClick={() => setDeptId(String(o.id))}>
              <div><b>{o.code || "—"}</b><small>{o.name}</small></div>
              <span>{granted} quyền</span>
            </button>;
          })}
          {!depts.length && <div className="dept-perm-empty"><Empty text="Chưa có phòng ban nào."/></div>}
        </aside>
        <div className="dept-perm-main">
          <div className="dept-perm-context">
            <strong>{deptName ? deptName.name : "Chưa chọn phòng"}</strong>
            <span>{deptName ? `${deptName.code} · ${savedRows.length} chức năng đã cấp · ${changed.length} thay đổi chưa lưu` : "Chọn một phòng ở cột bên trái"}</span>
          </div>
          <div className="dept-perm-actions">
            <span>Cấp nhanh:</span>
            <button className="secondary" onClick={() => applyPrefix("dept_plan_")}>Nhóm Kế hoạch</button>
            <button className="secondary" onClick={() => applyPrefix("dept_project_")}>Nhóm Dự án</button>
            <button className="secondary" onClick={() => applyPrefix("dept_finance_")}>Nhóm Tài chính</button>
            <button className="secondary" onClick={() => applyPrefix("dept_legal_")}>Nhóm Hành chính</button>
            <button className="secondary" onClick={clearAll}>Bỏ chọn tất cả</button>
            <button className="primary" disabled={busy} onClick={save}>{busy ? "Đang lưu…" : "Lưu thay đổi"}</button>
          </div>
      {msg && <div className="inline-alert">{msg}</div>}
      <div className="table-wrap"><table>
        <thead><tr><th>Chức năng</th>{PERM_CAPS.map((c) => <th key={c.key}>{c.label}</th>)}<th></th></tr></thead>
        <tbody>
          {modules.map((m) => {
            const v = valueOf(m.key);
            const isDraft = Boolean(draft[m.key]);
            return <tr key={m.key} style={isDraft ? { background: "#fff8e6" } : undefined}>
              <td><strong>{m.label}</strong><small>{m.key}</small></td>
              {PERM_CAPS.map((c) => <td key={c.key}>
                <input type="checkbox" checked={Number(v[c.key]) === 1} onChange={() => toggle(m.key, c.key)} />
              </td>)}
              <td>{isDraft ? <StatusBadge value="Chưa lưu" /> : (savedRows.some((r) => String(r.moduleKey) === m.key) ? <StatusBadge value="Đã cấp" /> : "")}</td>
            </tr>;
          })}
        </tbody>
      </table></div>
        </div>
      </div>
    </section>
  </div>;
}

/** Tab "Phân quyền người dùng" — ma trận quyền của TẤT CẢ người dùng + ràng buộc phòng ban. */
function UserPermissionMatrix({ data, open, action }: { data: AppData; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean> }) {
  const [query, setQuery] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const levels = data.systemLevelCatalog || [];
  const levelOf = (code: unknown) => levels.find((l) => String(l.code) === String(code)) || null;
  const depts = (data.organizationUnits || []).filter((o) => o.unitType !== "company");
  const rows = (data.users || []).filter((u) => {
    if (deptFilter && String(u.organizationUnitId) !== deptFilter) return false;
    if (levelFilter && String(u.systemLevelCode || "") !== levelFilter) return false;
    if (!query) return true;
    const hay = `${u.fullName || ""} ${u.employeeCode || ""} ${u.username || ""} ${u.organizationName || u.department || ""} ${u.roleName || ""}`.toLocaleLowerCase("vi");
    return hay.includes(query.toLocaleLowerCase("vi"));
  });
  const permsOf = (userId: string) => (data.allModulePermissions || []).filter((p) => String(p.userId) === userId);
  const deptPermsOf = (orgUnitId: unknown) => (data.departmentModulePermissions || []).filter((d) => String(d.organizationUnitId) === String(orgUnitId));
  const moduleLabel = (key: string) => configuredModules(data, true).find((m) => m.key === key)?.label || key;
  /** Quyền người dùng đang có nhưng phòng ban KHÔNG có ⇒ vi phạm ràng buộc P5.3. */
  const violationsOf = (u: Row) => {
    const level = levelOf(u.systemLevelCode);
    if (String(u.role) === "admin" || Number(level?.autoGrantAll) === 1) return [];
    const dp = deptPermsOf(u.organizationUnitId);
    if (!dp.length) return [];
    const allowed = new Set(dp.filter((d) => Number(d.active) === 1 && Number(d.canView) === 1).map((d) => String(d.moduleKey)));
    return permsOf(String(u.id)).filter((p) => capsCount(p) > 0 && !allowed.has(String(p.moduleKey))).map((p) => String(p.moduleKey));
  };
  async function copyFromDepartment(u: Row) {
    const dp = deptPermsOf(u.organizationUnitId);
    if (!dp.length) return setMsg(`Phòng ban của ${u.fullName} chưa được cấu hình quyền nào.`);
    if (!window.confirm(`Ghi đè quyền chức năng của ${u.fullName} bằng quyền của phòng ban? Phạm vi dự án và kho được giữ nguyên.`)) return;
    const projectScopes = (data.userScopes || []).filter((s) => String(s.userId) === String(u.id))
      .map((s) => ({ projectId: s.projectId, permission: s.permission || "read" }));
    const warehouseScopes = (data.userWarehouseScopes || []).filter((s) => String(s.userId) === String(u.id))
      .map((s) => ({ warehouseId: s.warehouseId, permission: s.permission || "read" }));
    const modulePermissions = dp.filter((d) => Number(d.active) === 1).map((d) => ({
      moduleKey: d.moduleKey, canView: Number(d.canView), canUse: Number(d.canUse), canCreate: Number(d.canCreate),
      canEdit: Number(d.canEdit), canApprove: Number(d.canApprove), canExport: Number(d.canExport),
    }));
    const ok = await action("save_user_access", { userId: u.id, projectScopes, warehouseScopes, modulePermissions });
    setMsg(ok ? `Đã sao chép ${modulePermissions.length} quyền từ phòng ban cho ${u.fullName}.` : "");
  }
  return <div className="stack">
    <div className="kpi-grid small">
      <Kpi icon="ND" label="Người dùng đang hoạt động" value={String((data.users || []).filter((u) => Number(u.active ?? 1) === 1).length)} note="Toàn bộ tài khoản trong hệ thống" />
      <Kpi icon="Q" label="Lượt quyền đã cấp" value={String((data.allModulePermissions || []).length)} note="Quyền hiệu lực theo từng chức năng" tone="green" />
      <Kpi icon="!" label="Tài khoản vượt quyền phòng ban" value={String(rows.filter((u) => violationsOf(u).length > 0).length)} note="Quyền không có ở phòng ban" tone="amber" />
    </div>
    <section className="card">
      <CardHead title="Phân quyền người dùng" note="Tìm theo tên, mã nhân viên, phòng ban, chức danh hoặc cấp bậc. Quyền của người dùng không được vượt quá quyền của phòng ban." />
      <ListToolbar
        title="BỘ LỌC"
        note={`${rows.length}/${(data.users || []).length} tài khoản khớp`}
        search={{ value: query, onChange: setQuery, placeholder: "Tên, mã NV, chức danh…" }}
        filters={[
          { key: "dept", label: "Phòng ban", value: deptFilter, onChange: setDeptFilter, options: [
            { value: "", label: "— Tất cả phòng ban —" },
            ...depts.map((o) => ({ value: String(o.id), label: String(o.name) })),
          ] },
          { key: "level", label: "Cấp bậc", value: levelFilter, onChange: setLevelFilter, options: [
            { value: "", label: "— Tất cả cấp bậc —" },
            ...levels.map((l) => ({ value: String(l.code), label: String(l.name) })),
          ] },
        ]}
      />
      {msg && <div className="inline-alert">{msg}</div>}
      <div className="table-wrap"><table>
        <thead><tr><th>Mã NV</th><th>Họ tên</th><th>Phòng ban</th><th>Chức danh</th><th>Cấp bậc</th><th>Quyền</th><th>Cảnh báo</th><th></th></tr></thead>
        <tbody>
          {rows.flatMap((u) => {
            const perms = permsOf(String(u.id));
            const bad = violationsOf(u);
            const level = levelOf(u.systemLevelCode);
            const isOpen = expanded === String(u.id);
            const mainRow = <tr key={u.id}>
                <td><strong>{u.employeeCode || "—"}</strong></td>
                <td>{u.fullName}<small>{u.username}</small></td>
                <td>{u.organizationName || u.department || "—"}</td>
                <td>{u.roleName || roleLabel(data, String(u.role || ""))}</td>
                <td>{level ? level.name : <span className="muted">Chưa xếp</span>}{Number(level?.autoGrantAll) === 1 && <small>Tự động toàn quyền</small>}</td>
                <td><strong>{perms.filter((p) => capsCount(p) > 0).length}</strong> chức năng</td>
                <td>{bad.length ? <StatusBadge value={`${bad.length} vượt phòng ban`} /> : <StatusBadge value="Hợp lệ" />}</td>
                <td><div className="row-actions">
                  <button className="export-mini" onClick={() => setExpanded(isOpen ? null : String(u.id))}>{isOpen ? "Thu gọn" : "Chi tiết"}</button>
                  <button className="export-mini" onClick={() => void copyFromDepartment(u)}>Sao chép từ phòng ban</button>
                  <button className="export-mini" onClick={() => open("userEdit", u)}>Sửa</button>
                </div></td>
              </tr>;
            if (!isOpen) return [mainRow];
            return [mainRow, <tr key={`${u.id}-x`}><td colSpan={8}>
                {!perms.length && <Empty text="Tài khoản chưa có quyền chức năng nào." />}
                {perms.filter((p) => capsCount(p) > 0).map((p) => {
                  const isBad = bad.includes(String(p.moduleKey));
                  return <span key={p.moduleKey} className={`pill ${isBad ? "red" : "blue"}`} style={{ marginRight: 6, marginBottom: 6 }}>
                    <i />{moduleLabel(String(p.moduleKey))} · {PERM_CAPS.filter((c) => Number(p[c.key]) === 1).map((c) => c.label).join("/")}
                    {String(p.permissionSource) === "manual_override" ? " · ngoại lệ" : ""}
                    {isBad ? " · ⚠ phòng ban chưa có" : ""}
                  </span>;
                })}
                {bad.length > 0 && <div className="inline-alert" style={{ marginTop: 8 }}>
                  Tài khoản đang có {bad.length} quyền mà phòng ban chưa được cấp. Hãy cấp cho phòng ban ở tab “Phân quyền phòng ban”, hoặc xếp cấp bậc đủ cao (tự động toàn quyền).
                </div>}
              </td></tr>];
          })}
          {!rows.length && <tr><td colSpan={8}><Empty text="Không có tài khoản nào khớp bộ lọc." /></td></tr>}
        </tbody>
      </table></div>
    </section>
  </div>;
}

/** Tab "Cấp bậc hệ thống" — thang cấp bậc + gán cho người dùng (P5.6–P5.8). */
function SystemLevelManager({ data, open, action }: { data: AppData; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean> }) {
  const levels = [...(data.systemLevelCatalog || [])].sort((a, b) => Number(a.rank) - Number(b.rank));
  const [userId, setUserId] = useState("");
  const [levelCode, setLevelCode] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const usersOfLevel = (code: string) => (data.users || []).filter((u) => String(u.systemLevelCode) === String(code));
  const levelLabel = (code: string) => levels.find((l) => String(l.code) === code) || null;
  const chosen = levelLabel(levelCode);
  const noLevel = (data.users || []).filter((u) => !u.systemLevelCode);
  async function assign() {
    if (!userId || !levelCode) return setMsg("Hãy chọn tài khoản và cấp bậc.");
    setBusy(true);
    const ok = await action("set_user_system_level", { userId, levelCode });
    setBusy(false);
    setMsg(ok ? "Đã xếp cấp bậc. Xem thông báo chi tiết ở góc trên màn hình." : "");
    if (ok) { setUserId(""); setLevelCode(""); }
  }
  return <div className="stack">
    <div className="kpi-grid small">
      <Kpi icon="CB" label="Cấp bậc đang dùng" value={String(levels.filter((l) => Number(l.active) === 1).length)} note="Thang cấp bậc toàn hệ thống" />
      <Kpi icon="ND" label="Tài khoản chưa xếp cấp bậc" value={String(noLevel.length)} note="Nên xếp để áp đúng quyền" tone={noLevel.length ? "amber" : "green"} />
      <Kpi icon="★" label="Cấp bậc tự động toàn quyền" value={String(levels.filter((l) => Number(l.autoGrantAll) === 1).length)} note="Không cần cấu hình quyền thủ công" tone="green" />
    </div>
    <section className="card">
      <CardHead title="Thang cấp bậc hệ thống" note="Cấp bậc cao tự động có quyền cao nhất và có thể duyệt vượt cấp mà không cần thêm tên vào từng quy trình." action="＋ Thêm cấp bậc" onClick={() => open("systemLevelMaster")} />
      <div className="table-wrap"><table>
        <thead><tr><th>Hạng</th><th>Mã</th><th>Tên cấp bậc</th><th>Tự động toàn quyền</th><th>Duyệt vượt cấp</th><th>Số tài khoản</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>{levels.map((l) => <tr key={l.id}>
          <td><strong>{l.rank}</strong></td>
          <td>{l.code}</td>
          <td>{l.name}<small>{l.description || "—"}</small></td>
          <td>{Number(l.autoGrantAll) === 1 ? <StatusBadge value="Có" /> : <span className="muted">Không</span>}</td>
          <td>{Number(l.canSkipLevels) === 1 ? <StatusBadge value="Có" /> : <span className="muted">Không</span>}</td>
          <td>{usersOfLevel(String(l.code)).length}</td>
          <td><StatusBadge value={Number(l.active) === 1 ? "Đang dùng" : "Đã ngừng"} /></td>
          <td><div className="row-actions">
            <button className="export-mini" onClick={() => open("systemLevelMaster", l)}>Sửa</button>
            <button className="export-mini" onClick={() => action("set_system_level_status", { levelId: l.id, active: Number(l.active) === 1 ? 0 : 1 })}>{Number(l.active) === 1 ? "Ngừng" : "Kích hoạt"}</button>
            <button className="export-mini danger" onClick={() => action("delete_system_level", { levelId: l.id })}>Xóa</button>
          </div></td>
        </tr>)}
        {!levels.length && <tr><td colSpan={8}><Empty text="Chưa có cấp bậc nào." /></td></tr>}
        </tbody>
      </table></div>
    </section>
    <section className="card">
      <CardHead title="Xếp cấp bậc cho tài khoản" note="Khi chọn cấp bậc, hệ thống báo rõ cấp bậc đó có tự động cấp quyền hay được duyệt vượt cấp hay không." />
      <ListToolbar
        title="GÁN CẤP BẬC"
        note={chosen ? `${chosen.name} · ${usersOfLevel(String(chosen.code)).length} tài khoản đang giữ` : "Chưa chọn cấp bậc"}
        filters={[
          { key: "user", label: "Tài khoản", value: userId, onChange: setUserId, options: [
            { value: "", label: "— Chọn tài khoản —" },
            ...(data.users || []).filter((u) => Number(u.active ?? 1) === 1).map((u) => ({ value: String(u.id), label: `${u.fullName} · ${u.employeeCode || u.username}` })),
          ] },
          { key: "level", label: "Cấp bậc", value: levelCode, onChange: setLevelCode, options: [
            { value: "", label: "— Chọn cấp bậc —" },
            ...levels.filter((l) => Number(l.active) === 1).map((l) => ({ value: String(l.code), label: String(l.name) })),
          ] },
        ]}
        actions={<button className="primary" disabled={busy} onClick={assign}>{busy ? "Đang lưu…" : "Xếp cấp bậc"}</button>}
      />
      {chosen && <div className="inline-alert">
        <strong>{chosen.name}</strong>
        {Number(chosen.autoGrantAll) === 1
          ? <> — cấp bậc này <b>TỰ ĐỘNG có toàn quyền</b> trên mọi chức năng, không cần cấu hình từng quyền.</>
          : <> — cấp bậc này <b>không</b> tự động cấp quyền; quyền lấy theo phòng ban.</>}
        {Number(chosen.canSkipLevels) === 1
          ? <> Cấp bậc này <b>được DUYỆT VƯỢT CẤP</b>, không cần thêm tên vào từng quy trình phê duyệt.</>
          : <> Không được duyệt vượt cấp; phải nằm trong danh sách người duyệt của bước.</>}
      </div>}
      {msg && <div className="inline-alert">{msg}</div>}
      <div className="admin-mini-list">
        {levels.map((l) => <div key={l.id}>
          <span className="group-icon">★</span>
          <span><strong>{l.name}</strong><small>{usersOfLevel(String(l.code)).map((u) => u.fullName).join(", ") || "Chưa có ai"}</small></span>
          <b>{usersOfLevel(String(l.code)).length} người</b>
        </div>)}
      </div>
    </section>
  </div>;
}

/** Tab "Audit log" — nhật ký kiểm toán mọi thay đổi dữ liệu (ĐỢT P6). */
function AuditLogManager({ data }: { data: AppData }) {
  const [query, setQuery] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const all = data.audits || [];
  const levelName = (code: unknown) => (data.systemLevelCatalog || []).find((l) => String(l.code) === String(code))?.name || "";
  const moduleLabel = (key: unknown) => {
    const k = String(key || "");
    if (!k) return "";
    return configuredModules(data, true).find((m) => m.key === k)?.label || k;
  };
  const users = Array.from(new Set(all.map((a) => String(a.userName || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, "vi"));
  const modules = Array.from(new Set(all.map((a) => String(a.moduleKey || "").trim()).filter(Boolean))).sort();
  const CAP_LABEL: Record<string, string> = { canView: "Xem", canUse: "Thao tác", canCreate: "Tạo", canEdit: "Sửa", canApprove: "Duyệt", canExport: "Xuất" };
  const dayOf = (value: unknown) => String(value || "").slice(0, 10);
  const rows = all.filter((a) => {
    if (userFilter && String(a.userName || "") !== userFilter) return false;
    if (moduleFilter && String(a.moduleKey || "") !== moduleFilter) return false;
    const day = dayOf(a.occurredAt);
    if (fromDate && day && day < fromDate) return false;
    if (toDate && day && day > toDate) return false;
    if (!query) return true;
    const hay = `${a.action || ""} ${a.changeDetail || ""} ${a.userName || ""} ${a.entityId || ""} ${a.moduleKey || ""} ${a.ipAddress || ""}`.toLocaleLowerCase("vi");
    return hay.includes(query.toLocaleLowerCase("vi"));
  });
  const stats = {
    total: all.length,
    today: all.filter((a) => dayOf(a.occurredAt) === new Date().toISOString().slice(0, 10)).length,
    people: new Set(all.map((a) => String(a.userName || "")).filter(Boolean)).size,
    modules: new Set(all.map((a) => String(a.moduleKey || "")).filter(Boolean)).size,
  };
  const pretty = (raw: unknown) => { try { return JSON.stringify(JSON.parse(String(raw || "")), null, 2); } catch { return String(raw || ""); } };
  return <div className="stack">
    <div className="kpi-grid small">
      <Kpi icon="NK" label="Lượt thay đổi được ghi" value={String(stats.total)} note="500 bản ghi gần nhất" />
      <Kpi icon="H" label="Phát sinh hôm nay" value={String(stats.today)} note="Theo ngày trên máy chủ" tone="green" />
      <Kpi icon="ND" label="Người đã thao tác" value={String(stats.people)} note="Số tài khoản khác nhau" tone="amber" />
      <Kpi icon="CN" label="Chức năng bị tác động" value={String(stats.modules)} note="Phạm vi ảnh hưởng" />
    </div>
    <section className="card">
      <CardHead title="Nhật ký kiểm toán" note="Ghi tự động MỌI thao tác thay đổi dữ liệu: ai làm, thuộc phòng nào, cấp bậc gì, dùng quyền nào, đổi cái gì, lúc nào." />
      <ListToolbar
        title="BỘ LỌC"
        note={`${rows.length}/${all.length} bản ghi khớp`}
        search={{ value: query, onChange: setQuery, placeholder: "Hành động, chi tiết, đối tượng, IP…" }}
        filters={[
          { key: "user", label: "Người dùng", value: userFilter, onChange: setUserFilter, options: [
            { value: "", label: "— Mọi người dùng —" },
            ...users.map((u) => ({ value: String(u), label: String(u) })),
          ] },
          { key: "module", label: "Chức năng", value: moduleFilter, onChange: setModuleFilter, options: [
            { value: "", label: "— Mọi chức năng —" },
            ...modules.map((m) => ({ value: String(m), label: String(moduleLabel(m)) })),
          ] },
        ]}
        extra={<>
          <label className="list-toolbar-field"><span>Từ ngày</span><input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)}/></label>
          <label className="list-toolbar-field"><span>Đến ngày</span><input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)}/></label>
        </>}
        actions={<button className="secondary" onClick={() => { setQuery(""); setUserFilter(""); setModuleFilter(""); setFromDate(""); setToDate(""); }}>Xóa lọc</button>}
      />
      {!all.length && <Empty text="Chưa có bản ghi nào. Nhật ký sẽ tự đầy khi có thao tác thay đổi dữ liệu." />}
      {all.length > 0 && <div className="table-wrap"><table>
        <thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Phòng ban</th><th>Cấp bậc</th><th>Chức năng</th><th>Quyền dùng</th><th>Hành động</th><th>Chi tiết</th></tr></thead>
        <tbody>
          {rows.map((a) => {
            const isOpen = openId === String(a.id);
            const mainRow = <tr key={a.id}>
              <td><strong>{date(a.occurredAt)}</strong><small>{String(a.ipAddress || "—")}</small></td>
              <td>{a.userName || "Hệ thống"}<small>{a.userRole || ""}</small></td>
              <td>{a.department || "—"}</td>
              <td>{levelName(a.systemLevel) || <span className="muted">—</span>}</td>
              <td>{moduleLabel(a.moduleKey) || "—"}</td>
              <td>{CAP_LABEL[String(a.permissionUsed || "")] || a.permissionUsed || "—"}</td>
              <td><strong>{a.action}</strong></td>
              <td><button className="export-mini" onClick={() => setOpenId(isOpen ? null : String(a.id))}>{isOpen ? "Đóng" : "Xem"}</button></td>
            </tr>;
            if (!isOpen) return [mainRow];
            return [mainRow, <tr key={`${a.id}-x`}><td colSpan={8}>
              <div className="table-toolbar"><div><strong>CHI TIẾT THAY ĐỔI</strong><span>{a.changeDetail || ""}</span></div></div>
              <div className="form-grid">
                <label className="span-2"><span>Dữ liệu gửi lên (sau)</span>
                  <textarea readOnly rows={6} value={pretty(a.afterJson)} style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }} />
                </label>
                {a.beforeJson && <label className="span-2"><span>Dữ liệu trước</span>
                  <textarea readOnly rows={5} value={pretty(a.beforeJson)} style={{ width: "100%", fontFamily: "monospace", fontSize: 12 }} />
                </label>}
              </div>
              <div className="inline-alert">
                Đối tượng: <b>{a.entityId || "—"}</b> · Loại: <b>{a.entityType || "—"}</b> · Mã bản ghi: <b>{a.id}</b>
                {!a.beforeJson && <> · Bản ghi này chỉ lưu dữ liệu SAU thay đổi (nhật ký chung không chụp được giá trị trước).</>}
              </div>
            </td></tr>];
          })}
          {!rows.length && <tr><td colSpan={8}><Empty text="Không có bản ghi nào khớp bộ lọc." /></td></tr>}
        </tbody>
      </table></div>}
    </section>
  </div>;
}

function SystemLevelModal({ data, row, close, submit }: { data: AppData; row?: Row; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const [code, setCode] = useState(String(row?.code || ""));
  const [name, setName] = useState(String(row?.name || ""));
  const [description, setDescription] = useState(String(row?.description || ""));
  const [rank, setRank] = useState(String(row?.rank ?? 10));
  const [sortOrder, setSortOrder] = useState(String(row?.sortOrder ?? 10));
  const [autoGrantAll, setAutoGrantAll] = useState(Number(row?.autoGrantAll) === 1);
  const [canSkipLevels, setCanSkipLevels] = useState(Number(row?.canSkipLevels) === 1);
  const [error, setError] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!code.trim() || !name.trim()) return setError("Nhập mã và tên cấp bậc.");
    const ok = await submit("save_system_level", {
      levelId: row?.id, code: code.trim(), name: name.trim(), description,
      rank: Number(rank || 0), sortOrder: Number(sortOrder || 0),
      autoGrantAll: autoGrantAll ? 1 : 0, canSkipLevels: canSkipLevels ? 1 : 0,
    });
    if (ok) close();
  }
  return <BaseModal title={row ? `Sửa cấp bậc: ${row.name}` : "Thêm cấp bậc hệ thống"} note="Cấp bậc quyết định quyền tự động và khả năng duyệt vượt cấp." close={close}>
    <form onSubmit={save}>
      <div className="modal-body">
        {error && <div className="inline-alert">{error}</div>}
        <div className="form-grid">
          <label><span>Mã cấp bậc *</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="truong_phong" required /></label>
          <label><span>Tên cấp bậc *</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Trưởng phòng" required /></label>
          <label><span>Hạng (số càng lớn càng cao)</span><input type="number" value={rank} onChange={(e) => setRank(e.target.value)} /></label>
          <label><span>Thứ tự hiển thị</span><input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={autoGrantAll} onChange={(e) => setAutoGrantAll(e.target.checked)} />
            <span style={{ margin: 0 }}>Tự động có toàn quyền</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={canSkipLevels} onChange={(e) => setCanSkipLevels(e.target.checked)} />
            <span style={{ margin: 0 }}>Được duyệt vượt cấp</span>
          </label>
          <label className="span-2"><span>Mô tả</span><input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        </div>
        <div className="inline-alert">
          {autoGrantAll ? "Cấp bậc này sẽ TỰ ĐỘNG được cấp toàn quyền trên mọi chức năng khi lưu." : "Cấp bậc này không tự động cấp quyền; quyền lấy theo phòng ban."}
          {" "}
          {canSkipLevels ? "Người giữ cấp bậc này KHÔNG cần thêm tên vào từng quy trình phê duyệt." : "Người giữ cấp bậc này phải nằm trong danh sách người duyệt của bước."}
        </div>
      </div>
      <footer className="modal-footer"><button className="secondary" type="button" onClick={close}>Hủy</button><button className="primary">{row ? "Lưu cấp bậc" : "Tạo cấp bậc"}</button></footer>
    </form>
  </BaseModal>;
}

function WorkflowManager({ data, open, action }: { data: AppData; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean> }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const workflows = data.workflowDefinitions || [];
  const stepsOf = (id: string) => (data.workflowSteps || []).filter((s) => String(s.workflowId) === String(id));
  const approversOf = (stepId: string) => (data.workflowStepApprovers || []).filter((a) => String(a.stepId) === String(stepId));
  const moduleLabel = (key: string) => configuredModules(data, true).find((m) => m.key === key)?.label || (key || "Dùng chung");
  const projectLabel = (id: string) => data.projects.find((p) => String(p.id) === String(id))?.code || "";
  const totalSteps = workflows.reduce((n, w) => n + stepsOf(String(w.id)).length, 0);
  const totalApprovers = (data.workflowStepApprovers || []).length;
  return <div className="stack">
    <div className="kpi-grid small">
      <Kpi icon="WF" label="Quy trình đang cấu hình" value={String(workflows.length)} note="Nhiều quy trình song song theo chức năng/dự án" />
      <Kpi icon="B" label="Tổng số bước duyệt" value={String(totalSteps)} note="Mỗi bước có cách xác nhận riêng" tone="amber" />
      <Kpi icon="ND" label="Người duyệt được chỉ định" value={String(totalApprovers)} note="Chỉ định đích danh, không chỉ theo vai trò" tone="green" />
    </div>
    <section className="card">
      <CardHead title="Quy trình phê duyệt" note="Mỗi quy trình gồm nhiều bước; mỗi bước chọn người duyệt đích danh theo quyền và cách xác nhận (một người / một trong nhiều / tất cả)." action="＋ Thêm quy trình" onClick={() => open("workflowMaster")} />
      {!workflows.length && <Empty text="Chưa có quy trình nào. Bấm “＋ Thêm quy trình” để tạo." />}
      {workflows.map((w) => {
        const steps = stepsOf(String(w.id));
        const isOpen = expanded === String(w.id);
        return <div key={w.id} className="menu-layout-group" style={{ marginBottom: 10 }}>
          <header>
            <span className="drag-handle">≡</span>
            <i>{w.isDefault ? "★" : "◆"}</i>
            <div>
              <strong>{w.name}</strong>
              <small>
                {w.code} · {moduleLabel(String(w.moduleKey || ""))}
                {w.projectId ? ` · dự án ${projectLabel(String(w.projectId))}` : " · toàn công ty"}
                {" · "}{steps.length} bước · {steps.reduce((n, s) => n + approversOf(String(s.id)).length, 0)} người duyệt
              </small>
            </div>
            <div className="row-actions">
              {Number(w.isDefault) === 1 && <StatusBadge value="Mặc định" />}
              <StatusBadge value={Number(w.active) === 1 ? "Đang áp dụng" : "Đã ngừng"} />
              <button className="export-mini" onClick={() => setExpanded(isOpen ? null : String(w.id))}>{isOpen ? "Thu gọn" : "Xem bước"}</button>
              <button className="export-mini" onClick={() => open("workflowMaster", w)}>Sửa</button>
              <button className="export-mini" onClick={() => action("set_workflow_status", { workflowId: w.id, active: Number(w.active) === 1 ? 0 : 1 })}>{Number(w.active) === 1 ? "Ngừng" : "Kích hoạt"}</button>
              {Number(w.isDefault) !== 1 && <button className="export-mini danger" onClick={() => window.confirm(`Xóa quy trình “${w.name}” và toàn bộ ${steps.length} bước?`) && action("delete_workflow", { workflowId: w.id })}>Xóa</button>}
            </div>
          </header>
          {isOpen && <div className="table-wrap"><table>
            <thead><tr><th>Bước</th><th>Tên bước</th><th>Cách xác nhận</th><th>SLA</th><th>Người duyệt được chỉ định</th></tr></thead>
            <tbody>
              {steps.map((s) => {
                const list = approversOf(String(s.id));
                return <tr key={s.id}>
                  <td><strong>Bước {s.stepNo}</strong></td>
                  <td>{s.name}<small>{s.description || "—"}</small></td>
                  <td><StatusBadge value={APPROVAL_MODE_SHORT[String(s.approvalMode)] || String(s.approvalMode)} />
                    <small>{APPROVAL_MODE_LABELS[String(s.approvalMode)] || ""}</small></td>
                  <td>{s.slaHours} giờ</td>
                  <td>{list.length ? list.map((a) => <span key={a.id} className="pill blue" style={{ marginRight: 4 }}><i />{a.fullName || a.userId}</span>) : <span className="muted">Chưa chỉ định</span>}</td>
                </tr>;
              })}
              {!steps.length && <tr><td colSpan={5}><Empty text="Quy trình chưa có bước nào." /></td></tr>}
            </tbody>
          </table></div>}
        </div>;
      })}
    </section>
    <details className="card">
      <summary style={{ cursor: "pointer", fontWeight: 600 }}>ⓘ Cấu hình bậc duyệt cũ (vẫn đang dùng cho luồng phê duyệt hiện hành)</summary>
      <div className="table-wrap"><table>
        <thead><tr><th>Bước</th><th>Tên bước</th><th>Vai trò được duyệt</th><th>Cách xác nhận</th><th>SLA</th><th>Trạng thái</th><th></th></tr></thead>
        <tbody>{data.approvalStages.map((row) => <tr key={row.id}>
          <td>Bước {row.stageNo}</td>
          <td><strong>{row.name}</strong><small>{row.description || "—"}</small></td>
          <td>{String(row.allowedRoleCodes || "").split(",").filter(Boolean).map((code) => roleLabel(data, code)).join(", ") || "Chưa gán"}</td>
          <td>{row.approvalMode === "all_roles" ? <StatusBadge value="Đủ tất cả (AND)" /> : "Một người"}</td>
          <td>{row.slaHours} giờ</td>
          <td><StatusBadge value={row.active ? "Đang áp dụng" : "Ngừng áp dụng"} /></td>
          <td><div className="row-actions">
            <button className="export-mini" onClick={() => open("approvalStageMaster", row)}>Sửa</button>
            <button className="export-mini danger" onClick={() => window.confirm(`Xóa bước ${row.name}? Chỉ xóa được khi bước chưa từng phát sinh hồ sơ.`) && action("delete_approval_stage", { stageId: row.id })}>Xóa</button>
          </div></td>
        </tr>)}</tbody>
      </table></div>
    </details>
  </div>;
}

function WorkflowModal({ data, row, close, submit }: { data: AppData; row?: Row; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const [code, setCode] = useState(String(row?.code || ""));
  const [name, setName] = useState(String(row?.name || ""));
  const [description, setDescription] = useState(String(row?.description || ""));
  const [moduleKey, setModuleKey] = useState(String(row?.moduleKey || "requests"));
  const [projectId, setProjectId] = useState(String(row?.projectId || ""));
  const [isDefault, setIsDefault] = useState(Number(row?.isDefault) === 1);
  const [sortOrder, setSortOrder] = useState(String(row?.sortOrder ?? 10));
  const [onlyPermitted, setOnlyPermitted] = useState(false);
  const [error, setError] = useState("");
  const existingSteps = (data.workflowSteps || []).filter((s) => String(s.workflowId) === String(row?.id))
    .sort((a, b) => Number(a.stepNo) - Number(b.stepNo))
    .map((s) => ({
      key: String(s.id),
      name: String(s.name || ""),
      description: String(s.description || ""),
      approvalMode: String(s.approvalMode || "single"),
      slaHours: String(s.slaHours ?? 8),
      approverUserIds: (data.workflowStepApprovers || []).filter((a) => String(a.stepId) === String(s.id)).map((a) => String(a.userId)),
    }));
  const [steps, setSteps] = useState<Row[]>(existingSteps.length ? existingSteps : [{
    key: "new-1", name: "", description: "", approvalMode: "single", slaHours: "8", approverUserIds: [],
  }]);
  const candidates = workflowApproverCandidates(data, moduleKey);
  const permittedCount = candidates.filter((c) => c.hasApprovePermission).length;
  const shown = onlyPermitted ? candidates.filter((c) => c.hasApprovePermission) : candidates;
  const moduleOptions = configuredModules(data).filter((m) => m.key !== "admin");
  const patchStep = (index: number, patch: Row) => setSteps((list) => list.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  const toggleApprover = (index: number, userId: string) => setSteps((list) => list.map((s, i) => {
    if (i !== index) return s;
    const current: string[] = Array.isArray(s.approverUserIds) ? s.approverUserIds : [];
    if (String(s.approvalMode) === "single") return { ...s, approverUserIds: current.includes(userId) ? [] : [userId] };
    return { ...s, approverUserIds: current.includes(userId) ? current.filter((x) => x !== userId) : [...current, userId] };
  }));
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!code.trim() || !name.trim()) return setError("Nhập mã và tên quy trình.");
    const stages: Row[] = [];
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const users: string[] = Array.isArray(s.approverUserIds) ? s.approverUserIds : [];
      if (!String(s.name || "").trim()) return setError(`Bước ${i + 1} chưa có tên.`);
      if (!users.length) return setError(`Bước ${i + 1} (“${s.name}”) chưa chỉ định người duyệt.`);
      if (String(s.approvalMode) === "single" && users.length > 1)
        return setError(`Bước ${i + 1} chọn “Một người duyệt” thì chỉ được chỉ định đúng một người.`);
      stages.push({
        stepNo: i + 1, name: String(s.name).trim(), description: s.description,
        approvalMode: s.approvalMode, slaHours: Number(s.slaHours || 8),
        approverUserIds: users,
      });
    }
    const ok = await submit("save_workflow", {
      workflowId: row?.id, code: code.trim(), name: name.trim(), description,
      moduleKey, projectId, isDefault: isDefault ? 1 : 0, sortOrder: Number(sortOrder || 0), stages,
    });
    if (ok) close();
  }
  return <BaseModal title={row ? `Sửa quy trình: ${row.name}` : "Thêm quy trình phê duyệt"} note="Mỗi bước chọn cách xác nhận và chỉ định đích danh người duyệt." close={close}>
    <form onSubmit={save}>
      <div className="modal-body">
        {error && <div className="inline-alert">{error}</div>}
        <div className="form-grid">
          <label><span>Mã quy trình *</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="WF-MUAHANG-02" required /></label>
          <label><span>Tên quy trình *</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Quy trình mua hàng rút gọn" required /></label>
          <label><span>Áp dụng cho chức năng</span><select value={moduleKey} onChange={(e) => { setModuleKey(e.target.value); }}>
            <option value="">— Dùng chung —</option>
            {moduleOptions.map((m) => <option key={m.key} value={m.key}>{m.label}</option>)}
          </select></label>
          <label><span>Áp dụng cho dự án</span><select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">— Toàn công ty —</option>
            {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select></label>
          <label><span>Thứ tự hiển thị</span><input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} /></label>
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
            <span style={{ margin: 0 }}>Là quy trình mặc định</span>
          </label>
          <label className="span-2"><span>Mô tả</span><input value={description} onChange={(e) => setDescription(e.target.value)} /></label>
        </div>
        <div className="table-toolbar" style={{ marginTop: 14 }}>
          <div><strong>CÁC BƯỚC DUYỆT</strong><span>{steps.length} bước · {candidates.length - permittedCount} người chưa có quyền duyệt trên chức năng này</span></div>
          <div className="row-actions">
            <label className="secondary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 8px" }}>
              <input type="checkbox" checked={onlyPermitted} onChange={(e) => setOnlyPermitted(e.target.checked)} />
              <span style={{ margin: 0, fontSize: 12 }}>Chỉ hiện người có quyền duyệt</span>
            </label>
            <button type="button" className="primary" onClick={() => setSteps((list) => [...list, { key: `new-${Date.now()}`, name: "", description: "", approvalMode: "any_of", slaHours: "8", approverUserIds: [] }])}>＋ Thêm bước</button>
          </div>
        </div>
        {onlyPermitted && !shown.length && <div className="inline-alert">Chưa có ai được cấp quyền duyệt (canApprove) trên chức năng này. Bỏ chọn “Chỉ hiện người có quyền duyệt” để chỉ định thủ công.</div>}
        {steps.map((s, index) => {
          const selected: string[] = Array.isArray(s.approverUserIds) ? s.approverUserIds : [];
          return <section className="card" key={String(s.key)}>
            <div className="table-toolbar">
              <div><strong>BƯỚC {index + 1}</strong><span>{selected.length} người duyệt được chỉ định</span></div>
              <div className="row-actions">
                <button type="button" className="export-mini" disabled={index === 0} onClick={() => setSteps((list) => { const next = [...list]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; return next; })}>↑</button>
                <button type="button" className="export-mini" disabled={index === steps.length - 1} onClick={() => setSteps((list) => { const next = [...list]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; return next; })}>↓</button>
                {steps.length > 1 && <button type="button" className="export-mini danger" onClick={() => setSteps((list) => list.filter((_, i) => i !== index))}>Xóa bước</button>}
              </div>
            </div>
            <div className="form-grid">
              <label><span>Tên bước *</span><input value={String(s.name || "")} onChange={(e) => patchStep(index, { name: e.target.value })} placeholder="CHT xác nhận nhu cầu" /></label>
              <label><span>Cách xác nhận *</span><select value={String(s.approvalMode || "single")} onChange={(e) => patchStep(index, { approvalMode: e.target.value, approverUserIds: e.target.value === "single" ? (Array.isArray(s.approverUserIds) ? s.approverUserIds.slice(0, 1) : []) : s.approverUserIds })}>
                <option value="single">Một người duyệt</option>
                <option value="any_of">Một trong nhiều người duyệt là qua</option>
                <option value="all_of">Tất cả người duyệt phải xác nhận</option>
              </select></label>
              <label><span>SLA (giờ)</span><input type="number" min="1" value={String(s.slaHours ?? 8)} onChange={(e) => patchStep(index, { slaHours: e.target.value })} /></label>
              <label><span>Mô tả bước</span><input value={String(s.description || "")} onChange={(e) => patchStep(index, { description: e.target.value })} /></label>
            </div>
            <div className="admin-mini-list">
              {shown.map((u) => <button type="button" key={u.id} className={selected.includes(String(u.id)) ? "is-selected" : ""} onClick={() => toggleApprover(index, String(u.id))} style={selected.includes(String(u.id)) ? { outline: "2px solid #1769e0" } : undefined}>
                <i className="mini-avatar">{initials(String(u.fullName || "NV"))}</i>
                <span><strong>{u.fullName}</strong><small>{u.employeeCode || u.username} · {u.organizationName || u.department || "—"}</small></span>
                <b>{selected.includes(String(u.id)) ? "✓ Đã chọn" : u.hasApprovePermission ? "Có quyền duyệt" : "Chưa có quyền duyệt"}</b>
              </button>)}
              {!shown.length && <div className="menu-drop-empty">Không có ứng viên nào.</div>}
            </div>
          </section>;
        })}
      </div>
      <footer className="modal-footer"><button className="secondary" type="button" onClick={close}>Hủy</button><button className="primary">{row ? "Lưu quy trình" : "Tạo quy trình"}</button></footer>
    </form>
  </BaseModal>;
}

function Admin({ data, open, action }: { data: AppData; open: (name: string, row?: Row) => void; action: (name: string, payload: Row) => Promise<boolean> }) {
  const [step,setStep]=useState(1); const [showHelp,setShowHelp]=useState(false); const [adminQuery,setAdminQuery]=useState(""); const [bulkUserMessage,setBulkUserMessage]=useState(""); const [bulkProjectMessage,setBulkProjectMessage]=useState(""); const roles=canonicalRoleOptions(data.roleCatalog||[]); const groups=(data.businessRoleGroups||[]).filter(row=>row.code!=="admin"); const activeUsers=data.users.filter(row=>row.active); const roleCount=(code:string)=>data.users.filter(row=>String(row.role)===String(code)).length;
  const filteredAdminUsers=data.users.filter(row=>!adminQuery||`${row.fullName||""} ${row.email||""} ${row.username||""} ${row.phone||""}`.toLocaleLowerCase("vi").includes(adminQuery.toLocaleLowerCase("vi")));
  async function importUsersFile(file?:File){
    if(!file)return;
    try{
      setBulkUserMessage("");
      const rows=mapUserBulkSheet(await parseSpreadsheetRows(file),{
        existingUsernames:data.users.map((row)=>String(row.username||"")),
        roleCodes:roles.map((row)=>String(row.code||"")),
        organizationCodes:(data.organizationUnits||[]).filter((row)=>row.active&&row.unitType!=="company").flatMap((row)=>[String(row.code||""),String(row.name||"")]),
      });
      if(!window.confirm(`Đã kiểm tra ${rows.length} dòng hợp lệ. Sẽ tạo/cập nhật tài khoản theo file. Tiếp tục?`))return;
      const ok=await action("bulk_import_users",{rows,sourceFileName:file.name});
      setBulkUserMessage(ok?`Đã kiểm tra và xử lý thành công ${rows.length} dòng tài khoản.`:"");
    }catch(error){setBulkUserMessage(error instanceof Error?error.message:"Không đọc được file tài khoản.");}
  }
  async function importProjectsFile(file?:File){
    if(!file)return;
    try{
      setBulkProjectMessage("");
      const rows=mapProjectBulkSheet(await parseSpreadsheetRows(file));
      if(!window.confirm(`Đã kiểm tra ${rows.length} dòng hợp lệ. Sẽ tạo/cập nhật dự án theo file. Tiếp tục?`))return;
      const ok=await action("bulk_import_projects",{rows,sourceFileName:file.name});
      setBulkProjectMessage(ok?`Đã kiểm tra và xử lý thành công ${rows.length} dòng dự án.`:"");
    }catch(error){setBulkProjectMessage(error instanceof Error?error.message:"Không đọc được file dự án.");}
  }
  async function downloadProjectArchive(row:Row){
    if(!window.confirm(`Tải TOÀN BỘ dữ liệu dự án ${row.code} để lưu trữ offline? Gói ZIP bao gồm dữ liệu nghiệp vụ, audit và tệp đính kèm; hệ thống sẽ kiểm tra checksum trước khi đánh dấu VERIFIED.`))return;
    setBulkProjectMessage("Đang đóng gói toàn bộ dữ liệu dự án…");
    try{
      const response=await fetch(`/api/files?projectArchive=${encodeURIComponent(String(row.id))}`,{cache:"no-store"});
      if(!response.ok)throw new Error(await response.text()||"Không thể tạo gói lưu trữ dự án.");
      const blob=await response.blob();const archiveId=response.headers.get("X-VNTECH-Archive-Id")||"";const sha=response.headers.get("X-VNTECH-Archive-SHA256")||"";const records=response.headers.get("X-VNTECH-Record-Count")||"0";const attachments=response.headers.get("X-VNTECH-Attachment-Count")||"0";
      const disposition=response.headers.get("Content-Disposition")||"";const m=disposition.match(/filename\*=UTF-8''([^;]+)/i);const fileName=m?decodeURIComponent(m[1]):`VNTECH_PROJECT_${row.code}_OFFLINE.zip`;
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=fileName;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
      setBulkProjectMessage(`ARCHIVE VERIFIED · ${row.code} · ${records} bản ghi · ${attachments} tệp · SHA-256: ${sha} · Archive ID: ${archiveId}. Hãy lưu ZIP này ở nơi an toàn.`);
    }catch(error){setBulkProjectMessage(error instanceof Error?error.message:"Không thể tạo gói lưu trữ dự án.");}
  }
  // Nhân sự và Tổ chức là hai tab RIÊNG (trước đây gộp chung "Nhân sự & tổ chức").
  const steps=["Nhân sự","Tổ chức","Chức danh / vai trò","Nhóm quyền nghiệp vụ","Phân quyền phòng ban","Phân quyền người dùng","Cấp bậc hệ thống","Phạm vi dự án & kho","Workflow phê duyệt","Ngoại lệ cá nhân","Audit log","Cấu hình hệ thống"];
  return <div className="stack admin-approved-screen baseline-screen">
    <ListToolbar
      title="PHÂN QUYỀN NGƯỜI DÙNG"
      note="Nhân sự → Tổ chức → Chức danh → Nhóm quyền → Quyền phòng ban → Quyền người dùng → Cấp bậc → Phạm vi → Workflow → Ngoại lệ → Audit log. Mọi thay đổi phải có hiệu lực thật ở backend."
      count={filteredAdminUsers.length} total={activeUsers.length} unit="tài khoản"
      actions={<>
        <button className="secondary" onClick={downloadUserBulkTemplate.bind(null,data)}>⇩ MẪU EXCEL TÀI KHOẢN</button>
        <label className="secondary file-inline">⇧ NHẬP EXCEL TÀI KHOẢN<input type="file" accept=".xlsx,.csv" onChange={(e)=>{void importUsersFile(e.target.files?.[0]);e.target.value="";}}/></label>
        <button className="secondary" onClick={()=>exportUsersBulkXlsx(data)}>⇩ XUẤT TÀI KHOẢN</button>
        <button className="secondary" onClick={()=>setShowHelp(true)}>ⓘ Hướng dẫn phân quyền</button>
        <button className="secondary" onClick={()=>open("roleMaster")}>⚙ Vai trò mặc định</button>
        <button className="primary" onClick={()=>open("user")}>＋ Thêm người dùng</button>
      </>}
    />
    <div className="permission-steps">{steps.map((label,index)=><button type="button" key={label} className={step===index+1?"active":""} onClick={()=>setStep(index+1)}>{index+1}&nbsp; {label}</button>)}</div>
    {showHelp&&<div className="overlay" onMouseDown={e=>e.target===e.currentTarget&&setShowHelp(false)}><div className="modal permission-help-modal"><header><div><strong>Hướng dẫn phân quyền chuẩn</strong><p>Thiết lập theo đúng thứ tự để tránh quyền chồng chéo.</p></div><button onClick={()=>setShowHelp(false)}>×</button></header><div className="modal-body"><ol className="permission-help-list"><li><b>Nhân sự:</b> tạo tài khoản và chọn chức danh; bấm vào một dòng để xem hồ sơ chi tiết.</li><li><b>Tổ chức:</b> khai báo phòng ban, Ban chỉ huy và tổ đội theo dự án.</li><li><b>Chức danh:</b> mỗi chức danh chỉ tồn tại một bản canonical, không trùng tên.</li><li><b>Nhóm quyền:</b> gom quyền theo nghiệp vụ, không dùng quyền nền kỹ thuật ở UI chính.</li><li><b>Phạm vi:</b> giới hạn dự án và kho; backend chặn truy cập ngoài scope.</li><li><b>Workflow:</b> cấu hình bước duyệt, vai trò, AND/OR và SLA.</li><li><b>Ngoại lệ:</b> chỉ cấp cá nhân khi thật sự cần và phải có thời hạn/audit.</li></ol></div><footer className="modal-footer"><button className="primary" onClick={()=>setShowHelp(false)}>Đã hiểu</button></footer></div></div>}
    {step===1&&<div className="stack"><section className="card admin-overview-card">{bulkUserMessage&&<div className="inline-alert" style={{whiteSpace:"pre-line"}}>{bulkUserMessage}</div>}<ListToolbar
      title="DANH SÁCH NHÂN SỰ / NGƯỜI DÙNG"
      note={`${filteredAdminUsers.length}/${activeUsers.length} tài khoản · danh sách toàn màn hình`}
      search={{ value: adminQuery, onChange: setAdminQuery, placeholder: "Tìm tên, mã NV, email, tài khoản…" }}
      actions={<button className="icon-mini" onClick={()=>open("user")}>＋</button>}
    /><AdminStaffList data={data} open={open} query={adminQuery}/></section></div>}
    {step===2&&<div className="stack"><section className="card"><CardHead title="Tổ đội theo dự án" note="Tổ đội thuộc đúng một dự án và có kho tổ đội riêng; dùng để cấp phát vật tư và hoàn trả." action="＋ Thêm tổ đội" onClick={()=>open("teamCreate")}/><div className="admin-mini-list">{data.teams.slice(0,40).map(row=><div key={row.id}><span className="group-icon">▣</span><span><strong>{row.name}</strong><small>{row.code||"—"} · {row.projectCode||row.projectName||"Chưa gán dự án"} · {row.trade||"—"}</small></span><b>{row.active===0?"Đã ngừng":"Đang dùng"}</b></div>)}{!data.teams.length&&<div className="menu-drop-empty">Chưa có tổ đội nào. Bấm “＋ Thêm tổ đội” để tạo.</div>}</div></section><OrganizationUnitManager data={data} action={action}/></div>}
    {step===3&&<section className="card"><CardHead title="Chức danh / vai trò" note="Dropdown tài khoản chỉ dùng danh mục active canonical; backend chặn trùng mã và trùng tên." action="＋ Thêm vai trò" onClick={()=>open("roleMaster")}/><div className="table-wrap"><table><thead><tr><th>Mã</th><th>Chức danh</th><th>Nhóm nghiệp vụ</th><th>Số người</th><th>Trạng thái</th><th></th></tr></thead><tbody>{roles.map(row=><tr key={row.id}><td><strong>{row.code}</strong></td><td>{row.name}<small>{row.description||"—"}</small></td><td>{row.businessGroupName||"—"}</td><td>{roleCount(row.code)}</td><td><StatusBadge value={row.active?"Đang dùng":"Đã ẩn"}/></td><td><button className="export-mini" onClick={()=>open("roleMaster",row)}>Sửa</button></td></tr>)}</tbody></table></div></section>}
    {step===4&&<section className="card"><CardHead title="Nhóm quyền nghiệp vụ" note="Bộ quyền nghiệp vụ được dùng để cấu thành chức danh; quyền nền kỹ thuật được ẩn khỏi màn quản trị chính." action="＋ Thêm nhóm quyền" onClick={()=>open("businessGroupMaster")}/><div className="admin-mini-list groups">{groups.map(row=><div key={row.id}><span className="group-icon">▣</span><span><strong>{row.name}</strong><small>{row.description||"Nhóm quyền nghiệp vụ"}</small></span><b>{roles.filter(r=>String(r.businessGroupId)===String(row.id)).length} vai trò</b><button className="export-mini" onClick={()=>open("businessGroupMaster",row)}>Sửa</button></div>)}</div></section>}
    {step===5&&<DepartmentPermissionManager data={data} action={action}/>}
    {step===6&&<UserPermissionMatrix data={data} open={open} action={action}/>}
    {step===7&&<SystemLevelManager data={data} open={open} action={action}/>}
    {step===8&&<div className="stack"><section className="card"><div className="table-toolbar"><div><strong>DANH SÁCH DỰ ÁN</strong><span>Project Master; tạo dự án đồng thời tạo kho công trường riêng. Hỗ trợ Excel hàng loạt.</span></div><div className="row-actions"><button className="secondary" onClick={downloadProjectBulkTemplate}>⇩ MẪU EXCEL DỰ ÁN</button><label className="secondary file-inline">⇧ NHẬP EXCEL DỰ ÁN<input type="file" accept=".xlsx,.csv" onChange={(e)=>{void importProjectsFile(e.target.files?.[0]);e.target.value="";}}/></label><button className="secondary" onClick={()=>exportProjectsBulkXlsx(data)}>⇩ XUẤT DỰ ÁN</button><button className="primary" onClick={()=>open("projectMaster")}>＋ THÊM DỰ ÁN</button></div></div>{bulkProjectMessage&&<div className="inline-alert">{bulkProjectMessage}</div>}<div className="table-wrap"><table><thead><tr><th>Mã dự án</th><th>Tên dự án</th><th>Hợp đồng</th><th>Khởi công</th><th>Kế hoạch kết thúc</th><th>Trạng thái</th><th></th></tr></thead><tbody>{data.adminProjects.map(row=><tr key={row.id}><td><strong>{row.code}</strong></td><td>{row.name}</td><td>{row.contractNo||"—"}<small>{row.contractName||""}</small></td><td>{row.startDate?date(row.startDate):"—"}</td><td>{row.plannedEndDate?date(row.plannedEndDate):"—"}</td><td><StatusBadge value={row.status||"active"}/></td><td><div className="row-actions"><button className="export-mini archive-project" onClick={()=>void downloadProjectArchive(row)}>⇩ Tải toàn bộ dữ liệu</button><button className="export-mini" onClick={()=>open("projectMaster",row)}>Sửa</button>{String(row.status)==="active"&&<><button className="export-mini" onClick={()=>window.confirm(`Đóng dự án ${row.code}? BẮT BUỘC đã tải gói TOÀN BỘ DỮ LIỆU dự án sau lần cập nhật gần nhất. Hệ thống sẽ kiểm tra archive VERIFIED + PO/kho/điều chuyển/tổ đội/số dư.`)&&void action("set_project_status",{projectId:row.id,status:"closed"})}>Đóng</button><button className="export-mini" onClick={()=>window.confirm(`Ẩn dự án ${row.code} khỏi nghiệp vụ hằng ngày? Dữ liệu lịch sử vẫn được giữ nguyên.`)&&void action("set_project_status",{projectId:row.id,status:"archived"})}>Ẩn</button></>}{String(row.status)!=="active"&&<button className="export-mini" onClick={()=>window.confirm(`Khôi phục/kích hoạt lại dự án ${row.code}?`)&&void action("set_project_status",{projectId:row.id,status:"active"})}>Khôi phục</button>}<button className="export-mini danger" onClick={()=>{if(!["closed","archived"].includes(String(row.status)))return window.alert("Chỉ dự án đã Đóng/Lưu trữ mới được xóa khỏi hệ thống vận hành.");const confirmCode=window.prompt(`XÓA/PURGE dự án ${row.code} khỏi dữ liệu vận hành. Hệ thống sẽ dùng gói TOÀN BỘ DỮ LIỆU đã VERIFIED khi đóng dự án; không bắt tải lại lần hai. Nhập chính xác mã dự án để xác nhận:`);if(confirmCode===null)return;void action("delete_project",{projectId:row.id,confirmCode});}}>Xóa/Purge</button></div></td></tr>)}{!data.adminProjects.length&&<tr><td colSpan={7}><Empty text="Chưa có dự án."/></td></tr>}</tbody></table></div></section><section className="card"><CardHead title="Phạm vi dự án & kho" note="Thủ kho dự án chỉ đúng dự án+kho được giao; Thủ kho Tổng chỉ Kho Tổng."/><div className="table-wrap"><table><thead><tr><th>Người dùng</th><th>Chức danh</th><th>Phạm vi dự án</th><th>Kho</th><th>Quyền chức năng</th><th>Thao tác</th></tr></thead><tbody>{data.users.map(row=>{const scopes=data.userScopes.filter(scope=>scope.userId===row.id);const perms=data.allModulePermissions.filter(perm=>perm.userId===row.id&&perm.canUse);return <tr key={row.id}><td><strong>{row.fullName}</strong><small>{row.username}</small></td><td>{row.roleName||roleLabel(data,row.role)}</td><td>{isAdminUser(row)?"Toàn công ty":scopes.map(s=>s.projectCode).join(", ")||"Chưa gán"}</td><td>{String(row.role).includes("kho_tong")?"Chỉ Kho Tổng":String(row.role).includes("thu_kho")?"Chỉ kho dự án được giao":"Theo phạm vi"}</td><td>{isAdminUser(row)?"Toàn bộ":perms.length+" chức năng"}</td><td><div className="row-actions"><button className="export-mini" onClick={()=>open("userEdit",row)}>Sửa</button><button className="mini-approve" onClick={()=>open("access",row)}>Phân quyền →</button></div></td></tr>})}</tbody></table></div></section></div>}
    {step===9&&<WorkflowManager data={data} open={open} action={action}/>}
    {step===10&&<PersonalExceptionManager data={data} open={open} action={action}/>} 
    {step===11&&<AuditLogManager data={data}/>}
    {step===12&&<TrustLockAdmin data={data} action={action}/>} 
    {step===12&&<div className="stack admin-system-config"><section className="card admin-config-intro"><CardHead title="CẤU HÌNH HỆ THỐNG" note="Tập trung các tác vụ quản trị thêm/bớt/đổi tên/ẩn hiện/sắp xếp/căn chỉnh dùng chung toàn hệ thống."/><div className="admin-config-cards"><button onClick={()=>document.getElementById("config-fields")?.scrollIntoView({behavior:"smooth"})}><NavIcon name="boq"/><strong>BOQ / HĐ & Lũy kế</strong><span>Cột, Import/Export, thứ tự, cho sửa</span></button><button onClick={()=>document.getElementById("config-fields")?.scrollIntoView({behavior:"smooth"})}><NavIcon name="requests"/><strong>Phiếu đề nghị</strong><span>Đầu phiếu & dòng vật tư</span></button><button onClick={()=>document.getElementById("config-display")?.scrollIntoView({behavior:"smooth"})}><NavIcon name="admin"/><strong>Tùy chỉnh giao diện</strong><span>Font, màu, mật độ</span></button><button onClick={()=>open("email")}><NavIcon name="dept_plan_alerts"/><strong>Email & SLA</strong><span>SMTP, người nhận, thời hạn</span></button></div></section><div id="config-fields"><FormFieldConfigManager data={data} action={action}/></div><div id="config-display"><UiDisplaySettingsManager data={data} action={action}/></div><FactoryResetAdmin data={data}/><section className="card"><CardHead title="Nhật ký cấu hình hệ thống" note="Theo dõi các thay đổi gần nhất; không ghi nội dung mật khẩu."/><div className="table-wrap"><table><thead><tr><th>Thời gian</th><th>Người thực hiện</th><th>Hạng mục</th><th>Hành động</th></tr></thead><tbody>{data.audits.slice(0,30).map(row=><tr key={row.id}><td>{date(row.occurredAt)}</td><td>{row.userName||"Hệ thống"}</td><td>{row.entityType}</td><td>{row.action}</td></tr>)}</tbody></table></div></section></div>}
  </div>;
}

function requestLineContext(data: AppData, projectId: string, item: Row, index: number) {
  const material = data.materials.find((mat) => mat.id === item.materialId) || {};
  const boqRows = data.boqItems.filter((row) => row.projectId === projectId);
  const boq = (item.boqItemId ? boqRows.find((row) => String(row.id) === String(item.boqItemId)) : null) || (item.contractLineNo ? boqRows.find((row) => Number(row.lineNo) === Number(item.contractLineNo) && row.materialId === item.materialId) : null) || boqRows.find((row) => row.materialId === item.materialId && (!item.boqCode || !row.boqCode || row.boqCode === item.boqCode)) || {};
  const stockQty = data.inventory.filter((row) => row.projectId === projectId && row.materialId === item.materialId && (row.warehouseType === "site" || row.type === "site" || !row.warehouseType)).reduce((sum,row)=>sum+Number(row.balance||0),0);
  const orderedCumulativeQty = Number(boq.orderedQty || item.orderedCumulativeQty || item.orderedQty || 0);
  const requestedQty = Number(item.quantity ?? item.requestedQty ?? 0);
  return { ...item, lineNo: item.lineNo || index + 1, contractLineNo: item.contractLineNo || boq.lineNo || "", materialCode: item.materialCode || material.code || boq.materialCode || "", materialName: item.materialName || material.name || boq.materialName || "", unit: item.unit || material.unit || boq.unit || "", manufacturer: item.manufacturer || material.brand || "", origin: item.origin || "", approvedSupplier: item.approvedSupplier || "", contractQty: Number(boq.contractQty || 0), stockQty, orderedCumulativeQty, requestedQty, cumulativeAfterRequest: orderedCumulativeQty + requestedQty, installationArea: item.installationArea || "", note: item.note || "", boqCode: item.boqCode || boq.boqCode || "", customFields: item.customFields || {} };
}
function savedRequestDocument(data: AppData, request: Row): RequestExportDocument {
  return {
    requestNo: request.requestNo || "De_nghi_cap_vat_tu", projectCode: request.projectCode, projectName: request.projectName, requestedBy: request.requestedBy, requestedAt: request.requestedAt, neededAt: request.neededAt, priority: request.priority, area: request.area, purpose: request.purpose, status: statusLabel(request), fieldConfigs: data.formFieldConfigs,
    lines: (request.items || []).map((item: Row, index: number) => requestLineContext(data, request.projectId, item, index)),
  };
}
function draftRequestDocument(data: AppData, projectId: string, lines: Row[], form: HTMLFormElement): RequestExportDocument {
  const values = Object.fromEntries(new FormData(form)); const project = data.projects.find((item) => item.id === projectId);
  return {
    requestNo: `DNMH-${project?.code || "DAxx"}-${new Date().getFullYear()}-DRAFT`, projectCode: project?.code, projectName: project?.name, requestedBy: data.user.fullName, requestedAt: new Date().toISOString(), neededAt: String(values.neededAt || ""), priority: String(values.priority || "normal"), area: String(values.area || ""), purpose: String(values.purpose || ""), status: "Dự thảo - chưa gửi duyệt", fieldConfigs: data.formFieldConfigs,
    lines: lines.map((item, index) => requestLineContext(data, projectId, item, index)),
  };
}

function poSupplyDocument(data: AppData, po: Row): SupplyExportDocument {
  const request = data.requests.find((row) => row.id === po.requestId) || {};
  const project = data.projects.find((row) => row.id === po.projectId) || {};
  const warehouse = data.warehouses.find((row) => row.id === po.receivingWarehouseId) || {};
  const requestItems = new Map<string,Row>((request.items || []).map((item: Row) => [String(item.id), item]));
  return {
    kind: "po", requestNo: po.requestNo || request.requestNo || "DNMH-KHONG-RO", poNo: po.poNo || "PO-KHONG-RO", projectCode: po.projectCode || project.code, projectName: project.name,
    supplierName: po.supplierName, warehouseName: warehouse.name, orderedAt: po.orderedAt, eta: po.eta, status: statusLabel(po),
    lines: (po.items || []).map((item: Row, index: number) => { const source = requestItems.get(String(item.requestItemId)) || {} as Row; return { lineNo: item.lineNo || index + 1, materialCode: item.materialCode, materialName: item.materialName, unit: item.unit, requestedQty: Number(source.requestedQty || 0), approvedQty: Number(source.approvedPurchaseQty || 0), orderedQty: Number(item.orderedQty || 0), unitPrice: Number(item.unitPrice || 0), actualTripQty: null, acceptedTripQty: null, actualCumulativeQty: Number(item.actualDeliveredQty || 0), acceptedCumulativeQty: Number(item.receivedQty || 0) }; }),
  };
}

function receiptSupplyDocument(data: AppData, receipt: Row): SupplyExportDocument {
  const po = data.purchaseOrders.find((row) => row.id === receipt.purchaseOrderId) || {};
  const request = data.requests.find((row) => row.id === (po.requestId || receipt.requestId)) || {};
  const project = data.projects.find((row) => row.id === (po.projectId || receipt.projectId)) || {};
  const requestItems = new Map<string,Row>((request.items || []).map((item: Row) => [String(item.id), item]));
  const currentItems = new Map<string,Row>((receipt.items || []).map((item: Row) => [String(item.purchaseOrderItemId), item]));
  const cutoff = receipt.receivedAt ? new Date(receipt.receivedAt).getTime() : Number.POSITIVE_INFINITY;
  const cumulative = new Map<string, { actual: number; accepted: number }>();
  data.receipts.filter((row) => row.purchaseOrderId === receipt.purchaseOrderId && (!row.receivedAt || new Date(row.receivedAt).getTime() <= cutoff)).forEach((row) => {
    (row.items || []).forEach((item: Row) => { const key = String(item.purchaseOrderItemId); const current = cumulative.get(key) || { actual: 0, accepted: 0 }; current.actual += Number(item.actualQty || 0); current.accepted += Number(item.acceptedQty || 0); cumulative.set(key, current); });
  });
  return {
    kind: "delivery", requestNo: po.requestNo || request.requestNo || "DNMH-KHONG-RO", poNo: receipt.poNo || po.poNo || "PO-KHONG-RO", receiptNo: receipt.receiptNo, projectCode: receipt.projectCode || po.projectCode || project.code, projectName: project.name,
    supplierName: receipt.supplierName || po.supplierName, warehouseName: receipt.warehouseName, orderedAt: po.orderedAt, eta: po.eta, receivedAt: receipt.receivedAt, deliveryNoteNo: receipt.deliveryNoteNo,
    bchConfirmedAt: receipt.bchConfirmedAt, bchConfirmedByName: receipt.bchConfirmedByName, certificateStatus: receipt.certificateStatus, deliveryDocumentStatus: receipt.deliveryDocumentStatus, status: receipt.bchConfirmationStatus === "confirmed" ? "BCH đã xác nhận" : "Chờ BCH xác nhận",
    lines: (po.items || []).map((item: Row, index: number) => { const source = requestItems.get(String(item.requestItemId)) || {} as Row; const trip = currentItems.get(String(item.id)) || {} as Row; const total = cumulative.get(String(item.id)) || { actual: 0, accepted: 0 }; return { lineNo: item.lineNo || index + 1, materialCode: item.materialCode, materialName: item.materialName, unit: item.unit, requestedQty: Number(source.requestedQty || 0), approvedQty: Number(source.approvedPurchaseQty || 0), orderedQty: Number(item.orderedQty || 0), unitPrice: Number(item.unitPrice || 0), actualTripQty: Number(trip.actualQty || 0), acceptedTripQty: Number(trip.acceptedQty || 0), actualCumulativeQty: total.actual, acceptedCumulativeQty: total.accepted, lotNo: trip.lotNo || "" }; }),
  };
}

function RequestDrawer({ data, request, approvalStages, close, action, user, variant = "drawer" }: { data: AppData; request: Row; approvalStages: Row[]; close: () => void; action: (name: string, payload: Row) => Promise<boolean>; user: Row; variant?: "drawer" | "page" }) {
  const stage = Number(request.approvalStage);
  const stageConfig = approvalStages.find((row) => Number(row.stageNo) === stage);
  const currentApproval = request.approvals?.find((row:Row)=>Number(row.stage)===stage);
  const stageRule = currentApproval?.allowedRoleCodes ? currentApproval : stageConfig;
  const canDecide = request.status === "pending_approval" && Number(request.itemCount||0)===Number(request.items?.length||0) && stageAllowedForUser(stageRule, user);
  const returned = request.status === "returned_to_requester";
  const canReturnedEdit = returned && (isAdminUser(user) || ["commander"].includes(roleBase(user)) || String(user.role)==="cht");
  const canManageRequestFiles = isAdminUser(user) || ["commander","project"].includes(roleBase(user)) || ["cht","da_nv","da_truong"].includes(String(user.role));
  async function updateReturned(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const lines=(request.items||[]).map((item:Row)=>({id:item.id,requestedQty:Number(fd.get(`qty-${item.id}`)||item.requestedQty||0)}));await action("update_returned_request",{requestId:request.id,neededAt:fd.get("neededAt"),priority:fd.get("priority"),area:fd.get("area"),purpose:fd.get("purpose"),lines});}
  async function resubmit(){if(!window.confirm("Bạn có chắc chắn muốn gửi lại phiếu này?\n\nSau khi gửi, phiếu được xem là CHT đã xác nhận và chuyển sang Chờ Thư ký TGĐ. Phiếu không thể tự thu hồi; muốn sửa phải được trả lại theo quy trình."))return;const note=window.prompt("Ghi chú gửi lại (có thể để trống):")||"";if(await action("resubmit_request",{requestId:request.id,comment:note}))close();}
  async function deleteReturned(){const reason=window.prompt(`Nhập lý do xóa ${request.requestNo} để lập phiếu mới:`)?.trim();if(!reason)return;if(!window.confirm("Xóa toàn bộ phiếu bị trả lại này? Thao tác chỉ được phép khi chưa phát sinh PO."))return;if(await action("delete_request",{requestId:request.id,reason}))close();}
  const isPage = variant === "page";
  // Chế độ trang: cho phép thu gọn các khối để "ẩn bớt cho gọn" theo yêu cầu người dùng.
  const [collapsed, setCollapsed] = useState(false);
  return <div className={isPage ? "overlay page-mode" : "overlay"} onMouseDown={isPage ? undefined : (event) => event.target === event.currentTarget && close()}><aside className={isPage ? `drawer request-drawer is-page${collapsed ? " sections-collapsed" : ""}` : "drawer request-drawer"}><header><div><small className="document-name">PHIẾU ĐỀ NGHỊ MUA HÀNG</small><strong>{request.requestNo}</strong><StatusBadge value={statusLabel(request)} /><p>{request.projectCode} · {request.projectName}</p></div>{isPage && <button type="button" className="page-collapse" onClick={() => setCollapsed((value) => !value)} title={collapsed ? "Mở rộng các khối" : "Thu gọn các khối"}>{collapsed ? "⌄ Mở rộng khối" : "⌃ Thu gọn khối"}</button>}<button className={isPage ? "page-back" : undefined} onClick={close} title={isPage ? "Quay lại danh sách" : "Đóng"}>{isPage ? "← Quay lại" : "×"}</button></header><div className="drawer-body"><section className="summary-grid request-summary"><div><small>Người đề nghị</small><strong>{request.requestedBy}</strong></div><div><small>Ngày lập phiếu</small><strong>{date(request.requestedAt)}</strong></div><div><small>Ngày cần hàng</small><strong>{date(request.neededAt)}</strong></div><div><small>Mức độ</small><strong>{request.priority === "urgent" ? "Khẩn" : request.priority === "high" ? "Cao" : "Bình thường"}</strong></div><div><small>Dự án</small><strong>{request.projectCode} · {request.projectName}</strong></div><div><small>Hợp đồng</small><strong>{request.contractNo || "Chưa xác định"}</strong></div><div><small>BOQ Version</small><strong>{request.boqVersionCode || "Chưa xác định"}</strong></div><div><small>Khu vực / Hạng mục</small><strong>{request.area || "—"}</strong></div><div><small>Số dòng vật tư</small><strong>{request.itemCount} dòng</strong></div><div><small>Tổng số lượng đề nghị</small><strong>{format.format(Number(request.totalQty||0))}</strong></div><div><small>Trạng thái hiện tại</small><strong>{statusLabel(request)}</strong></div><div><small>Người/Bộ phận đang xử lý</small><strong>{stageConfig?.name || (returned?"CHT xử lý lại":"—")}</strong></div></section><section className="drawer-section"><CardHead title="Tiến trình phê duyệt & thời gian xử lý" note="Đo từ lúc cấp nhận hồ sơ đến khi ra quyết định" /><ApprovalTimeline steps={([...(request.approvals || [])] as Row[]).sort((a: Row, b: Row) => Number(a.stage) - Number(b.stage)).map((approval: Row): ApprovalStep => { const stageNo = Number(approval.stage); const cfg = approvalStages.find((row: Row) => Number(row.stageNo) === stageNo); const timing = approvalTiming(approval); const decided = approval.status === "approved" ? "approved" : approval.status === "rejected" ? "rejected" : approval.status === "cancelled" ? "skipped" : ""; return { no: stageNo, name: cfg?.name || approval.department || `Bước ${stageNo}`, approver: approval.approverName || "Chưa xác định người duyệt", department: approval.department || data.staffDirectory?.find((u: Row) => u.id === approval.approverUserId)?.department || "", status: (decided || (Number(request.approvalStage) === stageNo ? "pending" : "waiting")) as ApprovalStep["status"], at: approval.decidedAt || null, comment: approval.comment || null, dueAt: approval.dueAt || null, queuedAt: approval.queuedAt || null, notifiedAt: approval.notifiedAt || null, timingText: timing?.text || null, late: Boolean(timing?.late) }; })} note={`${(request.approvals || []).length} bước · đo từ lúc cấp nhận hồ sơ đến khi ra quyết định`} /></section>{request.supplySteps?.length > 0 && <section className="drawer-section"><CardHead title="Tiến trình mua và giao hàng" note="Hồ sơ tự chạy sang bước kế tiếp và bắt đầu tính giờ" /><div className="supply-timeline">{request.supplySteps.map((step: Row, index: number) => { const timing = workflowTiming(step); const name = step.step === "po_creation" ? "Lập và phát hành PO" : step.step === "delivery" ? "Nhà cung cấp giao hàng" : "BCH xác nhận chuyến giao"; return <div className={`${step.status} ${timing.late ? "late" : ""}`} key={step.id}><span>{step.completedAt ? "✓" : index + 1}</span><div><strong>{name}</strong><p>Nhận việc: {date(step.queuedAt)} · Hạn: {date(step.dueAt)}</p><p className={timing.late ? "red-text" : ""}>{timing.text}{step.completedByName ? ` · ${step.completedByName}` : ""}</p>{step.comment && <small>{step.comment}</small>}</div></div>; })}</div></section>}<section className="drawer-section"><CardHead title="Tổng hợp giao nhận về phiếu đề nghị gốc" note={`${request.items.length}/${request.itemCount||request.items.length} dòng đang hiển thị · mọi PO và chuyến giao đều cộng theo đúng dòng phiếu ban đầu`} />{Number(request.itemCount||0)!==Number(request.items?.length||0)&&<div className="inline-alert danger"><b>Cảnh báo dữ liệu:</b> Số dòng chi tiết tải về không khớp số dòng của phiếu. Không được duyệt cho tới khi tải đủ dữ liệu.</div>}<div className="table-wrap" data-contract="VNTECH_REQUEST_DETAIL_ALL_LINES_V1"><table><thead><tr><th>STT</th><th>Mã / Tên vật tư</th><th>BOQ / Đầu việc</th><th>Yêu cầu</th><th>Đã đặt</th><th>Thực giao</th><th>Chờ BCH</th><th>BCH xác nhận</th><th>Từ chối</th><th>Đóng thiếu</th><th>Còn lại</th><th>PO / Chuyến</th><th>Trạng thái</th></tr></thead><tbody>{request.items.map((item: Row) => <tr key={item.id}><td>{item.lineNo}</td><td><strong className="code">{item.materialCode}</strong><small>{item.materialName} · {item.unit}</small></td><td>{item.boqCode || "—"}<small>{item.workPackageCode || "—"}</small></td><td>{format.format(item.requestedQty)}</td><td>{format.format(item.orderedQty)}</td><td>{format.format(item.actualDeliveredQty)}</td><td>{format.format(item.pendingBchQty)}</td><td><strong>{format.format(item.receivedQty)}</strong></td><td>{format.format(item.rejectedQty)}</td><td>{format.format(item.closedQty)}{item.closeReason && <small>{item.closeReason}</small>}</td><td><strong>{format.format(item.remainingQty)}</strong></td><td>{item.linkedPoCount || 0} / {item.linkedReceiptCount || 0}</td><td><StatusBadge value={item.missingDocumentCount > 0 && Number(item.remainingQty) <= 0 ? "Đủ hàng · thiếu hồ sơ" : item.lineStatus === "closed_shortage" ? "Đóng thiếu có lý do" : Number(item.remainingQty) <= 0 ? "Đã đủ" : Number(item.receivedQty) > 0 ? "Đã nhận một phần" : "Chờ giao"} /></td></tr>)}</tbody></table></div></section>{canReturnedEdit&&<form className="drawer-section returned-request-editor" onSubmit={updateReturned}><CardHead title="CHT sửa phiếu bị trả lại" note="Lưu chỉnh sửa trước khi gửi lại; luồng duyệt sẽ bắt đầu lại từ Thư ký TGĐ."/><div className="form-grid"><label><span>Ngày cần hàng</span><input type="date" name="neededAt" defaultValue={String(request.neededAt||"").slice(0,10)}/></label><label><span>Mức độ</span><select name="priority" defaultValue={request.priority||"normal"}><option value="normal">Bình thường</option><option value="high">Cao</option><option value="urgent">Khẩn</option></select></label><label><span>Khu vực / Hạng mục</span><input name="area" defaultValue={request.area||""}/></label><label><span>Ghi chú / Mục đích</span><input name="purpose" defaultValue={request.purpose||""}/></label></div><div className="table-wrap"><table><thead><tr><th>Mã vật tư</th><th>Tên vật tư</th><th>ĐVT</th><th>SL đề nghị sửa</th></tr></thead><tbody>{(request.items||[]).map((item:Row)=><tr key={item.id}><td>{item.materialCode}</td><td>{item.materialName}</td><td>{item.unit}</td><td><input name={`qty-${item.id}`} type="number" min="0.001" step="0.001" defaultValue={item.requestedQty}/></td></tr>)}</tbody></table></div><button className="secondary">Lưu chỉnh sửa</button></form>}{request.purpose && <section className="drawer-section document-note"><CardHead title="Mục đích / Ghi chú" /><p>{request.purpose}</p></section>}<section className="drawer-section request-special-files"><CardHead title="Ảnh / Hồ sơ vật tư đặc thù" note="Ảnh mẫu, catalog, thông số hoặc tài liệu giúp cấp duyệt và Phòng Kế hoạch nhận diện đúng vật tư cần mua." /><FileUpload entityType="material_request" entityId={request.id} canManage={canManageRequestFiles} /></section></div><footer>{canReturnedEdit&&<><button className="secondary reject-text" onClick={deleteReturned}>Xóa phiếu & lập mới</button><button className="primary" onClick={resubmit}>Gửi lại từ đầu →</button></>}<button className="secondary" onClick={() => downloadRequestXlsx(savedRequestDocument(data, request))}>⇩ Tải Excel</button><button className="secondary" onClick={() => downloadRequestPdf(savedRequestDocument(data, request))}>⇩ Tải PDF</button>{canDecide && <><button className="secondary reject-text" onClick={() => decide(request.id, stage, "rejected", action)}>Trả lại CHT</button><button className="primary" onClick={() => decide(request.id, stage, "approved", action)}>✓ Duyệt bước {stage}</button></>}</footer></aside></div>;
}

function ReceiptDrawer({ data, receipt, user, close, action }: { data: AppData; receipt: Row; user: Row; close: () => void; action: (name: string, payload: Row) => Promise<boolean> }) {
  const canConfirm = receipt.bchConfirmationStatus === "pending" && Boolean(modulePermission(data,"receiving").canApprove) && (isAdminUser(user) || ["commander", "project"].includes(roleBase(user)));
  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    if (await action("confirm_delivery", { receiptId: receipt.id, certificateStatus: form.get("certificateStatus"), deliveryDocumentStatus: form.get("deliveryDocumentStatus"), comment: form.get("comment") })) close();
  }
  return <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && close()}><aside className="drawer receipt-drawer"><header><div><small className="document-name">XÁC NHẬN GIAO HÀNG THỰC TẾ</small><strong>{receipt.receiptNo}</strong><StatusBadge value={receipt.bchConfirmationStatus === "confirmed" ? "BCH đã xác nhận" : "Chờ BCH xác nhận"} /><p>{receipt.poNo} · {receipt.projectCode} · {receipt.supplierName}</p></div><button onClick={close}>×</button></header><div className="drawer-body"><section className="summary-grid request-summary"><div><small>Thời điểm nhận</small><strong>{date(receipt.receivedAt)}</strong></div><div><small>Kho nhận</small><strong>{receipt.warehouseName}</strong></div><div><small>Phiếu giao hàng</small><strong>{receipt.deliveryNoteNo || "Chưa nhập"}</strong></div><div><small>QC</small><StatusBadge value={receipt.qcStatus === "accepted" ? "Đạt" : "Không đạt"} /></div><div><small>Tổng thực giao</small><strong>{format.format(receipt.actualDeliveredQty)}</strong></div><div><small>Được chấp nhận</small><strong>{format.format(receipt.acceptedQty)}</strong></div><div><small>Loại / thừa</small><strong className={Number(receipt.rejectedQty) ? "red-text" : ""}>{format.format(receipt.rejectedQty)}</strong></div><div><small>Ghi sổ</small><StatusBadge value={receipt.postingStatus === "posted" ? "Đã ghi sổ" : "Bị chặn"} /></div></section><section className="drawer-section"><CardHead title="Đối chiếu PO và thực giao" note="Thực giao được lưu nguyên trạng; phần chấp nhận không vượt số lượng PO" /><div className="table-wrap"><table><thead><tr><th>Mã / Tên vật tư</th><th>SL PO</th><th>Thực giao</th><th>Chấp nhận</th><th>Chênh lệch</th><th>Lô / serial</th></tr></thead><tbody>{(receipt.items || []).map((item: Row) => { const variance = Number(item.actualQty) - Number(item.orderedQty); return <tr key={item.id}><td><strong className="code">{item.materialCode}</strong><small>{item.materialName} · {item.unit}</small></td><td>{format.format(item.orderedQty)}</td><td>{format.format(item.actualQty)}</td><td>{format.format(item.acceptedQty)}</td><td><strong className={variance ? "red-text" : ""}>{variance > 0 ? "+" : ""}{format.format(variance)}</strong></td><td>{item.lotNo || "—"}</td></tr>; })}</tbody></table></div></section><section className="drawer-section"><CardHead title="Ảnh và hồ sơ giao hàng" note="BCH chỉ được xác nhận sau khi có ít nhất một ảnh thực tế" /><FileUpload entityType="goods_receipt" entityId={receipt.id} /></section>{receipt.bchConfirmationStatus === "confirmed" ? <section className="drawer-section confirmation-box"><CardHead title="Kết quả xác nhận BCH" /><p><b>{receipt.bchConfirmedByName || "BCH"}</b> xác nhận lúc {date(receipt.bchConfirmedAt)}.</p><p>Chứng chỉ: <b>{receipt.certificateStatus === "complete" ? "Đã có" : receipt.certificateStatus === "not_required" ? "Không yêu cầu" : "Chưa có"}</b> · Giấy giao hàng: <b>{receipt.deliveryDocumentStatus === "complete" ? "Đã có" : "Chưa có"}</b></p>{receipt.bchComment && <p>Ý kiến: {receipt.bchComment}</p>}</section> : <form className="drawer-section confirmation-form" onSubmit={confirm}><CardHead title="BCH xác nhận hoàn tất chuyến giao" note="Có thể xác nhận thiếu hồ sơ để hệ thống giữ cảnh báo" /><div className="form-grid"><label><span>Chứng chỉ / CO-CQ *</span><select name="certificateStatus" defaultValue={receipt.certificateStatus || "missing"}><option value="complete">Đã có</option><option value="missing">Chưa có</option><option value="not_required">Không yêu cầu</option></select></label><label><span>Giấy giao hàng kèm theo *</span><select name="deliveryDocumentStatus" defaultValue={receipt.deliveryDocumentStatus || "missing"}><option value="complete">Đã có</option><option value="missing">Chưa có</option></select></label><label className="span-2"><span>Ý kiến xác nhận</span><textarea name="comment" placeholder="Đã kiểm đếm thực tế, tình trạng hàng, ảnh và hồ sơ kèm theo…" /></label></div>{canConfirm ? <button className="primary">✓ BCH xác nhận đã nhận hàng</button> : <p className="permission-note">Tài khoản BCH/Phòng Dự án hoặc Quản trị viên mới được xác nhận.</p>}</form>}</div><footer><div className="drawer-export-group"><span><b>Giao hàng:</b><SupplyExportButtons doc={receiptSupplyDocument(data, receipt)} compact={false} /></span>{data.purchaseOrders.find((row) => row.id === receipt.purchaseOrderId) && <span><b>PO:</b><SupplyExportButtons doc={poSupplyDocument(data, data.purchaseOrders.find((row) => row.id === receipt.purchaseOrderId)!)} compact={false} /></span>}</div><button className="primary" onClick={close}>Đóng</button></footer></aside></div>;
}
function BaseModal({ title, note, close, children }: { title: string; note: string; close: () => void; children: ReactNode }) { return <div className="overlay modal-overlay" onMouseDown={(event) => event.target === event.currentTarget && close()}><section className="modal"><header><div><h2>{title}</h2><p>{note}</p></div><button type="button" onClick={close}>×</button></header>{children}</section></div>; }

function RequestModal({ data, contextProject, close, submit }: { data: AppData; contextProject:string; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const firstMaterial = data.materials[0];
  const [lines, setLines] = useState<Row[]>([{ materialId:firstMaterial?.id,materialCode:firstMaterial?.code,materialName:firstMaterial?.name,unit:firstMaterial?.unit,quantity:1,unitPrice:firstMaterial?.standardPrice||0,boqItemId:"",contractLineNo:"",origin:"",approvedSupplier:"",installationArea:"",note:"",customFields:{} }]);
  const lockedProject=contextProject!=="ALL"&&Boolean(contextProject); const initialRequestProject=lockedProject?String(contextProject):(data.projects.length===1?String(data.projects[0]?.id||""):"");
  const [projectId,setProjectId]=useState(initialRequestProject); const [contractSelection,setContractSelection]=useState(""); const [boqVersionSelection,setBoqVersionSelection]=useState("");
  const [importMessage,setImportMessage]=useState(""); const [importError,setImportError]=useState(""); const [previewSummary,setPreviewSummary]=useState<Row|null>(null);
  const contracts=(data.projectContracts||[]).filter((row)=>String(row.projectId)===String(projectId)&&String(row.status||"active")==="active");
  const defaultContract=contracts.find((row)=>Number(row.isPrimary)===1)||contracts[0];
  const contractId=contracts.some((row)=>String(row.id)===String(contractSelection))?String(contractSelection):String(defaultContract?.id||"");
  const versions=(data.boqVersions||[]).filter((row)=>String(row.projectId)===String(projectId)&&String(row.contractId)===String(contractId)&&!["archived","deleted"].includes(String(row.status||"")));
  const defaultVersion=versions.find((row)=>Number(row.active)===1)||versions[0];
  const boqVersionId=versions.some((row)=>String(row.id)===String(boqVersionSelection))?String(boqVersionSelection):String(defaultVersion?.id||"");
  const h=(key:string)=>fieldConfig(data.formFieldConfigs,"request_header",key); const visible=(key:string)=>h(key)?.visible!==false; const required=(key:string,def=false)=>h(key)?.required===undefined?def:Boolean(h(key)?.required); const label=(key:string,def:string)=>h(key)?.displayName||def;
  async function preview(input:Row[]){if(!projectId||!contractId||!boqVersionId)throw new Error("Hãy chọn Dự án → Hợp đồng → BOQ Version trước khi đối chiếu.");const result=await requestApi("preview_request_import",{projectId,contractId,boqVersionId,lines:input});setLines(result.lines||[]);setPreviewSummary(result.summary||null);setImportMessage(result.message||`Đã đối chiếu ${result.lines?.length||0} dòng.`);return result;}
  async function importExcel(file?:File){if(!file)return;setImportMessage("Đang đọc và đối chiếu file…");setImportError("");setPreviewSummary(null);try{const imported=await parseMaterialFile(file,data.materials as ImportMaterial[],data.formFieldConfigs);await preview(imported);}catch(error){setImportMessage("");setImportError(error instanceof Error?error.message:"Không đọc được file.");}}
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();if(lines.length<1||lines.length>100){setImportError("Phiếu phải có từ 1 đến 100 dòng vật tư.");return;}const unresolved=lines.filter((row)=>row.matchStatus&&row.matchStatus!=="exact");if(previewSummary&&unresolved.length){setImportError(`Còn ${unresolved.length} dòng chưa xác định đúng BOQ. Hãy chọn/map đúng dòng trước khi lập phiếu.`);return;}if(!window.confirm("Bạn có chắc chắn muốn gửi phiếu này?\n\nSau khi gửi, phiếu được xem là CHT đã xác nhận và chuyển sang Chờ Thư ký TGĐ. Phiếu không thể tự thu hồi; muốn sửa phải được trả lại theo quy trình."))return;const payload=Object.fromEntries(new FormData(event.currentTarget));if(await submit("create_request",{...payload,projectId,contractId,boqVersionId,lines}))close();}
  const project=data.projects.find((row)=>String(row.id)===String(projectId));
  return <BaseModal title="Lập đề nghị cấp vật tư" note="Chọn đúng Dự án → Hợp đồng → BOQ Version. File chỉ nhập nhu cầu; hệ thống tự lấy khối lượng HĐ, lũy kế, tồn kho và hàng đang chờ giao." close={close}><form className="request-form" onSubmit={send}><div className="modal-body"><div className="request-company-head"><div><img src={VNTECH_BRAND.logoPath} alt="VNTECH"/><strong>ĐỀ NGHỊ CẤP VẬT TƯ</strong></div><p>Kính gửi: <b>GIÁM ĐỐC CÔNG TY, CÁC PHÒNG/BAN CÔNG TY</b></p><small>Số phiếu tự động: {`DNMH-${project?.code||"DAxx"}-${new Date().getFullYear()}-xxxx`}</small></div><div className="form-grid request-context-grid">
    <label><span>{label("projectId","Dự án")} *</span>{lockedProject||data.projects.length===1?<strong className="locked-project-value">{project?.code} · {project?.name}</strong>:<select name="projectId" value={projectId} onChange={(e)=>{setProjectId(e.target.value);setContractSelection("");setBoqVersionSelection("");setLines([{materialId:"",materialCode:"",materialName:"",unit:"",quantity:1,unitPrice:0,boqItemId:"",contractLineNo:"",origin:"",approvedSupplier:"",installationArea:"",note:"",customFields:{}}]);setPreviewSummary(null);setImportMessage("");setImportError("");}} required><option value="">— Chọn dự án cụ thể —</option>{data.projects.map((row)=><option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}</select>}<small>{lockedProject?"Đồng bộ theo dự án đang chọn ở màn hình ngoài":data.projects.length===1?"Tự nhận theo phạm vi tài khoản":"Đang ở Tất cả dự án: chọn một dự án cụ thể để lập phiếu"}</small></label>
    <label><span>Hợp đồng *</span><select value={contractId} onChange={(e)=>{setContractSelection(e.target.value);setBoqVersionSelection("");setPreviewSummary(null);}} required><option value="">Chọn hợp đồng</option>{contracts.map((row)=><option key={row.id} value={row.id}>{row.contractNo} · {row.contractName}</option>)}</select></label>
    <label><span>BOQ Version *</span><select value={boqVersionId} onChange={(e)=>{setBoqVersionSelection(e.target.value);setPreviewSummary(null);}} required><option value="">Chọn phiên bản BOQ</option>{versions.map((row)=><option key={row.id} value={row.id}>{row.versionCode} · {row.versionName||row.revisionType||"BOQ"}</option>)}</select></label>
    <label><span>Kho nguồn dự kiến</span><select name="sourceWarehouseId"><option value="">Mua mới / chưa xác định</option>{data.warehouses.filter((row)=>String(row.projectId)===String(projectId)&&row.type==="site").map((row)=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
    {visible("neededAt")&&<label><span>{label("neededAt","Ngày cần vật tư tại công trường")}{required("neededAt",true)?" *":""}</span><input type="date" name="neededAt" required={required("neededAt",true)}/></label>}
    {visible("area")&&<label><span>{label("area","Phạm vi / Khu vực thi công")}{required("area")?" *":""}</span><input name="area" required={required("area")} placeholder="Tầng / khu / phạm vi"/></label>}
    {visible("priority")&&<label><span>{label("priority","Mức độ")}{required("priority")?" *":""}</span><select name="priority" required={required("priority")}><option value="normal">Bình thường</option><option value="high">Cao</option><option value="urgent">Khẩn</option></select></label>}
  </div><section className="excel-import request-smart-import"><div><span>NHẬP EXCEL / CSV + ĐỐI CHIẾU TỰ ĐỘNG</span><strong>Không bắt nhân viên tự điền lại dữ liệu hệ thống</strong><p>Sau upload, hệ thống đối chiếu đúng Hợp đồng/BOQ Version và tự lấy STT HĐ, mã BOQ, KL HĐ, lũy kế đề nghị/PO/nhập, tồn kho và hàng chờ giao.</p></div><div className="excel-actions"><button type="button" className="secondary" onClick={()=>downloadMaterialTemplate(data.formFieldConfigs)}>⇩ Mẫu Excel</button><button type="button" className="secondary" onClick={()=>downloadMaterialTemplateCsv(data.formFieldConfigs)}>⇩ Mẫu CSV</button><button type="button" className="secondary" disabled={!contractId||!boqVersionId} onClick={()=>void preview(lines).catch((error)=>setImportError(error instanceof Error?error.message:String(error)))}>↻ Đối chiếu lại</button><label className="primary">⇧ Chọn Excel/CSV<input type="file" accept=".xlsx,.csv" onChange={(event)=>{void importExcel(event.target.files?.[0]);event.target.value="";}}/></label></div></section>{previewSummary&&<div className="request-preview-summary"><span className="match-ok">Khớp chính xác: <b>{previewSummary.exact||0}</b></span><span className="match-review">Cần kiểm tra: <b>{previewSummary.review||0}</b></span><span className="match-missing">Không tìm thấy: <b>{previewSummary.notFound||0}</b></span></div>}{importMessage&&<div className="import-result ok">✓ {importMessage}</div>}{importError&&<div className="import-result error">{importError}</div>}<LineEditor data={data} projectId={projectId} contractId={contractId} boqVersionId={boqVersionId} lines={lines} setLines={setLines}/>{visible("purpose")&&<label className="full"><span>{label("purpose","Phạm vi / Ghi chú chung")}{required("purpose")?" *":""}</span><textarea name="purpose" required={required("purpose")} placeholder="Mục đích sử dụng, Shopdrawing, tuyến…"/></label>}<div className="document-export-bar"><div><strong>Xuất biểu mẫu Đề nghị cấp vật tư</strong><span>Excel/PDF lấy dữ liệu hệ thống tại thời điểm hiện tại.</span></div><div><button type="button" className="secondary" onClick={(event)=>{const form=event.currentTarget.closest("form");if(form)downloadRequestXlsx(draftRequestDocument(data,projectId,lines,form));}}>⇩ Excel</button><button type="button" className="secondary" onClick={(event)=>{const form=event.currentTarget.closest("form");if(form)downloadRequestPdf(draftRequestDocument(data,projectId,lines,form));}}>⇩ PDF</button></div></div></div><ModalFooter close={close} disabled={!contractId||!boqVersionId} label={`Lập phiếu ${lines.length} dòng và gửi duyệt →`}/></form></BaseModal>;
}

function LineEditor({ data, projectId, contractId, boqVersionId, lines, setLines }: { data: AppData; projectId: string; contractId:string; boqVersionId:string; lines: Row[]; setLines: (rows: Row[]) => void }) {
  const baseFields=mergedFormFields(data.formFieldConfigs,"request_line").filter((f)=>Boolean(f.visible)); const materials=data.materials; const projectBoq=data.boqItems.filter((row)=>String(row.projectId)===String(projectId)&&(!contractId||String(row.contractId)===String(contractId))&&(!boqVersionId||String(row.boqVersionId)===String(boqVersionId))&&Boolean(row.materialId));
  const orderKey=`vntech-request-grid-order:${data.user.id}`;const hiddenKey=`vntech-request-grid-hidden:${data.user.id}`;
  const [fieldOrder,setFieldOrder]=useState<string[]>(()=>{if(typeof window==="undefined")return[];try{return JSON.parse(window.localStorage.getItem(orderKey)||"[]");}catch{return[];}});
  const [hidden,setHidden]=useState<string[]>(()=>{if(typeof window==="undefined")return[];try{return JSON.parse(window.localStorage.getItem(hiddenKey)||"[]");}catch{return[];}});
  useEffect(()=>{try{window.localStorage.setItem(orderKey,JSON.stringify(fieldOrder));window.localStorage.setItem(hiddenKey,JSON.stringify(hidden));}catch{}},[fieldOrder,hidden,orderKey,hiddenKey]);
  const orderRank=new Map(fieldOrder.map((key,index)=>[key,index]));const ordered=[...baseFields].sort((a,b)=>(orderRank.get(String(a.fieldKey))??9999)-(orderRank.get(String(b.fieldKey))??9999)||baseFields.indexOf(a)-baseFields.indexOf(b));const fields=ordered.filter((f)=>!hidden.includes(String(f.fieldKey))||f.required);
  const widths=useResizableColumnWidths(`vntech-request-grid-widths:${data.user.id}`);const defaultWidth=(key:string)=>({lineNo:62,contractLineNo:125,materialCode:135,materialName:280,unit:72,quantity:110,manufacturer:145,contractQty:120,stockQty:110,orderedCumulativeQty:125,cumulativeAfterRequest:135,installationArea:160,note:190}[key]||145);
  function update(index:number,key:string,value:unknown){setLines(lines.map((row,i)=>i===index?{...row,[key]:value}:row));}
  function updateCustom(index:number,key:string,value:unknown){setLines(lines.map((row,i)=>i===index?{...row,customFields:{...(row.customFields||{}),[key]:value}}:row));}
  function addLine(){if(lines.length>=100)return;setLines([...lines,{materialId:"",materialCode:"",materialName:"",unit:"",quantity:1,unitPrice:0,boqItemId:"",contractLineNo:"",origin:"",approvedSupplier:"",installationArea:"",note:"",customFields:{}}]);}
  function chooseBoq(index:number,value:string){const boq=projectBoq.find((r)=>String(r.id)===value);if(!boq)return;const material=materials.find((m)=>m.id===boq.materialId);setLines(lines.map((row,i)=>i===index?{...row,boqItemId:boq.id,contractId,boqVersionId,contractLineNo:boq.contractLineRef||boq.lineNo,boqCode:boq.boqCode||"",materialId:boq.materialId,materialCode:boq.materialCode||material?.code||"",materialName:boq.materialName||material?.name||"",unit:boq.unit||material?.unit||"",unitPrice:material?.standardPrice||0,contractQty:Number(boq.contractQty||0),matchStatus:"exact",matchReason:"Người dùng đã chọn đúng dòng BOQ.",importedNew:false}:row));}
  function cell(field:FormFieldConfig,row:Row,index:number){const key=String(field.fieldKey);const ctx=requestLineContext(data,projectId,row,index);const req=Boolean(field.required);if(key==="lineNo")return <span>{index+1}</span>;if(key==="contractLineNo")return <span className="readonly-field">{String(ctx.contractLineNo||row.contractLineNo||"—")}</span>;if(key==="materialName"){const listId=`boq-material-search-${index}`;const display=String(row.materialName||"");return <><input list={listId} value={display} placeholder="Gõ tên / mã / thông số để tìm BOQ…" onChange={(e)=>{const value=e.target.value;const found=projectBoq.find((b)=>`${b.contractLineRef||b.lineNo} · ${b.materialCode||b.approvedMaterialCode||""} · ${b.materialName}`===value);if(found)chooseBoq(index,String(found.id));else setLines(lines.map((r,i)=>i===index?{...r,materialName:value,boqItemId:"",contractLineNo:"",materialId:"",materialCode:"",contractQty:0,matchStatus:"manual",matchReason:"Chưa chọn đúng dòng BOQ."}:r));}} required={req}/><datalist id={listId}>{projectBoq.map((b)=><option key={b.id} value={`${b.contractLineRef||b.lineNo} · ${b.materialCode||b.approvedMaterialCode||""} · ${b.materialName}`}>{b.unit||""} · {b.specification||b.customFields?.specification||""}</option>)}</datalist></>;}if(["materialCode","manufacturer","contractQty","stockQty","orderedCumulativeQty","cumulativeAfterRequest"].includes(key))return <span className="readonly-field">{String((ctx as Row)[key]??"")}</span>;if(key==="unit")return <input value={String(row.unit||ctx.unit||"")} onChange={(e)=>update(index,"unit",e.target.value)} required={req}/>;if(key==="quantity")return <input type="number" min={req?"0.001":"0"} step="0.001" value={Number(row.quantity||0)} onChange={(e)=>update(index,"quantity",Number(e.target.value))} required={req}/>;if(key==="origin"||key==="approvedSupplier"||key==="installationArea"||key==="note")return <input value={String(row[key]||"")} onChange={(e)=>update(index,key,e.target.value)} required={req} placeholder={field.displayName}/>;if(String(field.sourceKind)==="custom")return <input value={String(row.customFields?.[key]||"")} onChange={(e)=>updateCustom(index,key,e.target.value)} required={req}/>;return <span>{String((ctx as Row)[key]??"")}</span>}
  function moveColumn(source:string,target:string){if(source===target)return;const keys=ordered.map((f)=>String(f.fieldKey));const from=keys.indexOf(source),to=keys.indexOf(target);if(from<0||to<0)return;const [item]=keys.splice(from,1);keys.splice(to,0,item);setFieldOrder(keys);}
  return <div className="line-editor request-proposal"><div className="line-title"><div><strong>Chi tiết đề nghị cấp vật tư</strong><span>{lines.length}/100 dòng · số liệu màu xám tự lấy từ BOQ/PO/Kho</span></div><div className="request-grid-tools"><details><summary>⚙ Cột hiển thị</summary><div>{ordered.map((f)=><label key={f.fieldKey}><input type="checkbox" checked={!hidden.includes(String(f.fieldKey))||Boolean(f.required)} disabled={Boolean(f.required)} onChange={(e)=>setHidden((current)=>e.target.checked?current.filter((k)=>k!==String(f.fieldKey)):[...new Set([...current,String(f.fieldKey)])])}/>{f.displayName}{f.required?" *":""}</label>)}</div></details><button type="button" className="secondary" onClick={()=>{setFieldOrder([]);setHidden([]);widths.reset();}}>Mặc định gọn</button><button type="button" disabled={lines.length>=100} onClick={addLine}>＋ Thêm dòng</button></div></div><div className="table-wrap request-grid-wrap"><table className="request-grid"><thead><tr>{fields.map((f)=>{const key=String(f.fieldKey);const samples=[f.displayName,...lines.slice(0,40).map((row,index)=>(requestLineContext(data,projectId,row,index) as Row)[key])];return <th key={key} draggable onDragStart={(e)=>e.dataTransfer.setData("text/plain",key)} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{e.preventDefault();moveColumn(e.dataTransfer.getData("text/plain"),key);}} onDoubleClick={(e)=>widths.autoFit(e,key,samples,defaultWidth(key))} style={{width:widths.widthFor(key,defaultWidth(key)),minWidth:widths.widthFor(key,defaultWidth(key))}}><span>{f.displayName}{f.required?" *":""}</span><i className="column-resize-handle" onMouseDown={(e)=>widths.resizeStart(e,key,defaultWidth(key))}/></th>})}<th className="request-match-col">Đối chiếu</th><th></th></tr></thead><tbody>{lines.map((row,index)=><tr key={`${row.materialId||row.materialCode||"line"}-${index}`} className={row.matchStatus&&row.matchStatus!=="exact"?"request-line-needs-review":""}>{fields.map((f)=><td key={f.fieldKey} className={String(f.sourceKind)==="system"?"system-cell":""} style={{width:widths.widthFor(String(f.fieldKey),defaultWidth(String(f.fieldKey))),minWidth:widths.widthFor(String(f.fieldKey),defaultWidth(String(f.fieldKey)))}}>{cell(f,row,index)}</td>)}<td className="request-match-cell"><b className={`request-match-${row.matchStatus||"manual"}`}>{row.matchStatus==="exact"?"✓ Khớp":row.matchStatus==="review"?"! Kiểm tra":row.matchStatus==="not_found"?"× Không tìm thấy":"Nhập tay"}</b>{row.matchReason&&<small>{row.matchReason}</small>}</td><td><button type="button" className="export-mini danger" disabled={lines.length===1} onClick={()=>setLines(lines.filter((_,i)=>i!==index))}>×</button></td></tr>)}</tbody></table></div></div>;
}
function poRemainingItems(request:Row){return (request?.items||[]).filter((item:Row)=>Number(item.orderedQty)<Number(item.approvedPurchaseQty));}
function defaultPoPlans(data:AppData,request?:Row){return poRemainingItems(request||{}).map((item:Row)=>{const material=data.materials.find((mat)=>mat.id===item.materialId);return {requestItemId:item.id,quantity:Math.max(0,Number(item.approvedPurchaseQty)-Number(item.orderedQty)),supplierId:"",systemCode:normalizeBoqSystemCode(material?.system||"KHAC"),plannedDeliveryAt:DEFAULT_PO_ETA};});}
function downloadBlankPoPlanningTemplate(data:AppData){const suppliers=data.suppliers.filter(row=>row.active!==0);downloadSimpleXlsx({sheetName:"Lap PO",title:"MẪU LẬP PO VNTECH",subtitle:"Chọn phiếu đã duyệt trên hệ thống để lấy Mã dòng đề nghị; file trắng dùng để chuẩn bị dữ liệu và kiểm tra định dạng",headers:["Mã dòng đề nghị","STT","Mã vật tư","Tên vật tư","ĐVT","SL còn được phép đặt","SL lập PO","Mã nhà cung cấp","Hệ M&E","Ngày giao dự kiến"],notes:["Bắt buộc khi nhập","Tham chiếu","Tham chiếu","Tham chiếu","Tham chiếu","Tham chiếu","Số dương","Chọn mã NCC trong danh mục","DIEN/CTN/HVAC/DNHE/PCCC/KHAC","DD/MM/YYYY"],rows:[],widths:[30,8,20,48,10,20,16,22,14,20],freezeRows:4,listValidations:[{columnIndex:7,values:suppliers.map(row=>String(row.code)),startRow:5,endRow:100,promptTitle:"Nhà cung cấp",prompt:"Chọn Mã NCC đã khai trong Quản trị"},{columnIndex:8,values:[...BOQ_SYSTEM_CODES],startRow:5,endRow:100}]},"Mau_Lap_PO_VNTECH");}
function downloadPoPlanningTemplate(data:AppData,request:Row){const items=poRemainingItems(request);const suppliers=data.suppliers.filter(row=>row.active!==0);downloadSimpleXlsx({sheetName:"Lap PO",title:`MẪU LẬP PO - ${request.requestNo}`,subtitle:`Dự án ${request.projectCode} · Có thể gán nhiều NCC; hệ thống tự tách thành nhiều PO`,headers:["Mã dòng đề nghị","STT","Mã vật tư","Tên vật tư","ĐVT","SL còn được phép đặt","SL lập PO","Mã nhà cung cấp","Hệ M&E","Ngày giao dự kiến"],notes:["GIỮ NGUYÊN","Tham chiếu","Tham chiếu","Tham chiếu","Tham chiếu","Tham chiếu","Có thể giảm nếu đặt một phần","Chọn mã NCC trong danh mục","DIEN/CTN/HVAC/DNHE/PCCC/KHAC","DD/MM/YYYY"],rows:items.map((item:Row,index:number)=>{const material=data.materials.find(mat=>mat.id===item.materialId);const remaining=Math.max(0,Number(item.approvedPurchaseQty)-Number(item.orderedQty));return [item.id,index+1,item.materialCode,item.materialName,item.unit,remaining,remaining,"",normalizeBoqSystemCode(material?.system||"KHAC"),DEFAULT_PO_ETA];}),widths:[30,8,20,48,10,20,16,22,14,20],freezeRows:4,listValidations:[{columnIndex:7,values:suppliers.map(row=>String(row.code)),startRow:5,endRow:Math.max(50,items.length+4),promptTitle:"Nhà cung cấp",prompt:"Chọn Mã NCC đã khai trong Quản trị"},{columnIndex:8,values:[...BOQ_SYSTEM_CODES],startRow:5,endRow:Math.max(50,items.length+4)}]},`Mau_Lap_PO_${request.requestNo}`);}
function mapPoPlanningRows(rows:string[][],request:Row,data:AppData){const aliases={requestItemId:["ma dong de nghi","id dong de nghi"],quantity:["sl lap po","so luong lap po","so luong dat"],supplierCode:["ma nha cung cap","ma ncc","nha cung cap"],systemCode:["he me","ma he"],plannedDeliveryAt:["ngay giao du kien","ngay giao"]};const normalized=rows.map(row=>row.map(normalizeBoqHeader));const headerIndex=normalized.findIndex(row=>aliases.requestItemId.some(a=>row.includes(a))&&aliases.supplierCode.some(a=>row.includes(a)));if(headerIndex<0)throw new Error("Không tìm thấy tiêu đề Mã dòng đề nghị / Mã nhà cung cấp. Hãy tải đúng mẫu lập PO của phiếu này.");const headers=normalized[headerIndex];const find=(keys:string[])=>headers.findIndex(h=>keys.includes(h));const idx={requestItemId:find(aliases.requestItemId),quantity:find(aliases.quantity),supplierCode:find(aliases.supplierCode),systemCode:find(aliases.systemCode),plannedDeliveryAt:find(aliases.plannedDeliveryAt)};const eligible=new Map<string,Row>(poRemainingItems(request).map((item:Row)=>[String(item.id),item]));const supplierByCode=new Map<string,Row>(data.suppliers.map(row=>[String(row.code).trim().toUpperCase(),row]));const result:Row[]=[];rows.slice(headerIndex+1).forEach((row,offset)=>{const get=(i:number)=>i>=0?String(row[i]??"").trim():"";const requestItemId=get(idx.requestItemId);if(!requestItemId||normalizeBoqHeader(requestItemId)==="giu nguyen")return;const item=eligible.get(requestItemId);if(!item)throw new Error(`Dòng ${headerIndex+offset+2}: Mã dòng đề nghị không thuộc phiếu ${request.requestNo} hoặc đã đặt đủ.`);const remaining=Math.max(0,Number(item.approvedPurchaseQty)-Number(item.orderedQty));const qtyText=get(idx.quantity).replace(/\s/g,"").replace(/\.(?=\d{3}(\D|$))/g,"").replace(",",".");const quantity=qtyText?Number(qtyText):remaining;if(!Number.isFinite(quantity)||quantity<=0||quantity>remaining+1e-9)throw new Error(`Dòng ${headerIndex+offset+2}: SL lập PO phải > 0 và không vượt ${format.format(remaining)}.`);const supplierCode=get(idx.supplierCode).toUpperCase();const supplier=supplierByCode.get(supplierCode);if(!supplier)throw new Error(`Dòng ${headerIndex+offset+2}: Mã NCC “${supplierCode||"trống"}” không tồn tại hoặc đang bị ẩn.`);const plannedDeliveryAt=normalizePaymentDate(get(idx.plannedDeliveryAt)||DEFAULT_PO_ETA);if(!/^\d{4}-\d{2}-\d{2}$/.test(plannedDeliveryAt))throw new Error(`Dòng ${headerIndex+offset+2}: ngày giao không hợp lệ.`);result.push({requestItemId,quantity,supplierId:supplier.id,systemCode:normalizeBoqSystemCode(get(idx.systemCode)||"KHAC"),plannedDeliveryAt});});if(!result.length)throw new Error("File chưa có dòng PO hợp lệ hoặc chưa gán Nhà cung cấp.");return result;}
function PoModal({ data, initialRequestId, close, submit }: { data: AppData; initialRequestId?: string; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const eligible=data.requests.filter((row)=>row.status==="approved"&&row.supplyStatus==="awaiting_po"&&poRemainingItems(row).length>0);const [requestId,setRequestId]=useState(eligible.some(row=>row.id===initialRequestId)?initialRequestId!:eligible[0]?.id||"");const request=eligible.find(row=>row.id===requestId);const [plans,setPlans]=useState<Row[]>(()=>defaultPoPlans(data,request));
  // Each source MR owns an independent PO plan; never retain lines from the previous MR.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{setPlans(defaultPoPlans(data,request));},[requestId]);
  function updatePlan(id:string,key:string,value:unknown){setPlans(current=>current.map(row=>row.requestItemId===id?{...row,[key]:value}:row));}
  async function importFile(file?:File){if(!file||!request)return;try{const imported=mapPoPlanningRows(await parseSpreadsheetRows(file),request,data);setPlans(imported);window.alert(`Đã đọc ${imported.length} dòng. Kiểm tra NCC/ngày giao rồi phát hành PO.`);}catch(error){window.alert(error instanceof Error?error.message:"Không đọc được file lập PO.");}}
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!request)return;const form=Object.fromEntries(new FormData(event.currentTarget));const lines=plans.filter(row=>Number(row.quantity)>0);if(!lines.length)return window.alert("Chưa có dòng nào để lập PO.");if(lines.some(row=>!row.supplierId))return window.alert("Mỗi dòng lập PO phải chọn Nhà cung cấp.");if(await submit("create_po",{...form,requestId,lines}))close();}
  return <BaseModal title="Phát hành PO từ phiếu đã duyệt" note="Không nhập đơn giá PO ở giai đoạn này. Chọn NCC theo từng dòng; nếu có nhiều NCC hệ thống tự tách thành nhiều PO." close={close}><form className="po-form" onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Phiếu nguồn *</span><select value={requestId} onChange={event=>setRequestId(event.target.value)} required><option value="">Chọn phiếu</option>{eligible.map(row=><option key={row.id} value={row.id}>{row.requestNo} · {row.projectCode}</option>)}</select></label><label><span>Kho nhận *</span><select name="warehouseId" required>{data.warehouses.filter(row=>row.type==="site"&&(!request||row.projectId===request.projectId)).map(row=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label><span>Ngày giao mặc định *</span><input type="date" name="eta" min={UI_TODAY} defaultValue={DEFAULT_PO_ETA} required/></label></div>{request?<><div className="po-bulk-toolbar"><div><strong>Lập PO hàng loạt</strong><span>Tải Excel, gán Mã NCC/ngày giao rồi nhập lại. Mã dòng đề nghị là khóa đối chiếu và không được sửa.</span></div><div className="row-actions"><button type="button" className="secondary" onClick={()=>downloadPoPlanningTemplate(data,request)}>⇩ Mẫu Excel lập PO</button><label className="secondary file-inline">⇧ Nhập Excel/CSV<input type="file" accept=".xlsx,.csv" onChange={event=>{void importFile(event.target.files?.[0]);event.target.value="";}}/></label></div></div><div className="line-editor"><div className="line-title"><strong>Dòng được phép đặt</strong><span>Nhà cung cấp đặt theo từng dòng; không còn ô Đơn giá PO</span></div>{plans.map(plan=>{const item=poRemainingItems(request).find((row:Row)=>row.id===plan.requestItemId);if(!item)return null;return <div className="po-line po-line-planning" key={plan.requestItemId}><div><strong>{item.materialCode}</strong><small>{item.materialName} · Còn {format.format(Math.max(0,Number(item.approvedPurchaseQty)-Number(item.orderedQty)))} {item.unit}</small></div><label><small>SL lập PO</small><input type="number" min="0.001" step="0.001" value={plan.quantity} onChange={event=>updatePlan(plan.requestItemId,"quantity",Number(event.target.value))}/></label><label><small>Nhà cung cấp *</small><select value={plan.supplierId||""} onChange={event=>updatePlan(plan.requestItemId,"supplierId",event.target.value)} required><option value="">Chọn NCC</option>{data.suppliers.map(row=><option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}</select></label><label><small>Hệ M&E</small><select value={plan.systemCode||"KHAC"} onChange={event=>updatePlan(plan.requestItemId,"systemCode",event.target.value)}>{BOQ_SYSTEM_CODES.map(code=><option key={code} value={code}>{code}</option>)}</select></label><label><small>Ngày giao dòng</small><input type="date" min={UI_TODAY} value={plan.plannedDeliveryAt||DEFAULT_PO_ETA} onChange={event=>updatePlan(plan.requestItemId,"plannedDeliveryAt",event.target.value)}/></label></div>})}</div></>:<Empty text="Không còn phiếu sẵn sàng lập PO."/>}</div><ModalFooter close={close} label="Phát hành và tự tách PO theo NCC →" disabled={!request||!plans.length}/></form></BaseModal>;
}

function ReceiptModal({ data, close, submit }: { data: AppData; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const openPos = data.purchaseOrders.filter((row) => (row.items || []).some((item: Row) => Number(item.actualDeliveredQty) + Number(item.closedQty) < Number(item.orderedQty)) && !["completed", "completed_with_exceptions", "completed_with_shortage"].includes(row.status)); const [poId, setPoId] = useState(openPos[0]?.id || ""); const po = openPos.find((row) => row.id === poId);
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const lines = (po?.items || []).filter((item: Row) => Number(item.actualDeliveredQty)+Number(item.closedQty) < Number(item.orderedQty)).map((item: Row) => ({ purchaseOrderItemId: item.id, quantity: Number(form.get(`qty-${item.id}`) || 0), lotNo: form.get(`lot-${item.id}`) })).filter((item: Row) => item.quantity > 0); if (await submit("receive_goods", { purchaseOrderId: poId, deliveryNoteNo: form.get("deliveryNoteNo"), qcOk: form.get("qcOk") === "on", certificateStatus: form.get("certificateStatus"), deliveryDocumentStatus: form.get("deliveryDocumentStatus"), lines })) close(); }
  return <BaseModal title="Ghi nhận số lượng giao thực tế" note="Có thể nhập thừa hoặc thiếu so với PO; hệ thống chỉ chấp nhận tối đa số đã đặt và lưu riêng phần chênh lệch" close={close}><form className="receipt-form" onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Đơn đặt hàng *</span><select value={poId} onChange={(event) => setPoId(event.target.value)} required><option value="">Chọn PO</option>{openPos.map((row) => <option key={row.id} value={row.id}>{row.poNo} · ETA {date(row.eta)} · {row.supplierName}</option>)}</select></label><label><span>Số phiếu giao hàng</span><input name="deliveryNoteNo" placeholder="Số phiếu của nhà cung cấp" /></label><label><span>Chứng chỉ / CO-CQ</span><select name="certificateStatus" defaultValue="complete"><option value="complete">Đã có</option><option value="missing">Chưa có</option><option value="not_required">Không yêu cầu</option></select></label><label><span>Giấy giao hàng kèm theo</span><select name="deliveryDocumentStatus" defaultValue="complete"><option value="complete">Đã có</option><option value="missing">Chưa có</option></select></label></div>{po?.items?.length ? <div className="line-editor"><div className="delivery-head"><span>Vật tư</span><span>PO / Đã giao thực tế</span><span>Thực giao lần này</span><span>Lô / serial</span></div>{po.items.filter((item: Row) => Number(item.actualDeliveredQty) + Number(item.closedQty) < Number(item.orderedQty)).map((item: Row) => <div className="delivery-line" key={item.id}><div><strong>{item.materialCode}</strong><small>{item.materialName} · {item.unit}</small></div><span>{format.format(item.orderedQty)} / {format.format(item.actualDeliveredQty)}</span><input name={`qty-${item.id}`} type="number" min="0" step="0.001" defaultValue={Math.max(0, Number(item.orderedQty) - Number(item.actualDeliveredQty) - Number(item.closedQty))} /><input name={`lot-${item.id}`} placeholder="Lô / serial" /></div>)}</div> : <Empty text="PO chưa có dòng có thể nhận." />}<div className="check-grid"><label><input type="checkbox" name="qcOk" defaultChecked /> <span><b>QC thực tế đạt</b><small>Đúng quy cách, hãng và tình trạng hàng</small></span></label><div className="flow-hint"><b>Bước tiếp theo</b><span>Lưu chuyến giao → tải ảnh → BCH xác nhận → chuyển Đơn hàng đã giao</span></div></div></div><ModalFooter close={close} label="Lưu thực giao và chuyển BCH xác nhận →" disabled={!po} /></form></BaseModal>;
}
function TeamCreateModal({data,close,submit}:{data:AppData;close:()=>void;submit:(name:string,payload:Row)=>Promise<boolean>}){
  const projects=data.projects; const [projectId,setProjectId]=useState(projects[0]?.id||"");
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=Object.fromEntries(new FormData(event.currentTarget));if(await submit("create_project_team",{...form,projectId}))close();}
  return <BaseModal title="Tạo tổ đội dự án" note="CHT được tạo/chỉnh tổ đội trong dự án được phân quyền; chỉ ADMIN có quyền ngừng/xóa. Tổ đội đã phát sinh giao dịch không được xóa vật lý." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Dự án *</span><select value={projectId} onChange={e=>setProjectId(e.target.value)} required>{projects.map(p=><option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}</select></label><label><span>Mã tổ đội *</span><input name="code" required placeholder="TD-A08-01"/></label><label><span>Tên tổ đội *</span><input name="name" required placeholder="Tổ điện 01"/></label><label><span>Hạng mục / chuyên môn *</span><input name="trade" required placeholder="Điện / CTN / HVAC..."/></label></div><div className="inline-alert">Tổ đội được tạo chỉ xuất hiện trong đúng dự án này. CHT không có quyền xóa tổ đội.</div></div><ModalFooter close={close} label="Tạo tổ đội →"/></form></BaseModal>;
}

function InstallModal({ data, close, submit }: { data: AppData; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const installationRows=data.issues.flatMap((issue)=>(issue.items||[]).map((item:Row)=>({
    ...item,
    issueNo:issue.issueNo,
    projectCode:issue.projectCode,
    teamName:issue.teamName,
    issuedAt:issue.issuedAt,
    issuedQty:Number(item.quantity||0),
    remainingQty:Math.max(0,Number(item.quantity||0)-Number(item.installedQty||0)),
  }))).filter((item)=>item.remainingQty>0);
  const [issueItemId,setIssueItemId]=useState(String(installationRows[0]?.id||""));
  const selected=installationRows.find((item)=>String(item.id)===issueItemId)||installationRows[0];
  const [quantity,setQuantity]=useState(Number(selected?.remainingQty||0));
  function chooseIssueItem(nextId:string){const next=installationRows.find((item)=>String(item.id)===nextId);setIssueItemId(nextId);setQuantity(Number(next?.remainingQty||0));}
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!selected)return;const confirmed=Number(quantity);if(!Number.isFinite(confirmed)||confirmed<=0||confirmed>Number(selected.remainingQty)){window.alert(`Số lượng lắp đặt phải lớn hơn 0 và không vượt ${format.format(selected.remainingQty)} ${selected.unit||""}.`);return;}if(await submit("confirm_installation",{issueItemId:selected.id,quantity:confirmed}))close();}
  return <BaseModal title="Xác nhận vật tư đã lắp đặt" note="Chỉ xác nhận trên dòng đã xuất cho tổ đội. Hệ thống giảm đồng thời tồn vật lý và tồn theo Contract tại kho tổ đội." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label className="span-2"><span>Dòng vật tư đã cấp *</span><select value={String(selected?.id||"")} onChange={(event)=>chooseIssueItem(event.target.value)} required><option value="">Chọn dòng cấp phát</option>{installationRows.map((item)=><option key={item.id} value={item.id}>{item.issueNo} · {item.projectCode} · {item.teamName} · {item.materialCode} · còn {format.format(item.remainingQty)} {item.unit}</option>)}</select></label><label><span>Số lượng xác nhận *</span><input type="number" min="0.001" max={selected?.remainingQty||0} step="0.001" value={quantity} onChange={(event)=>setQuantity(Number(event.target.value))} required/></label><label><span>Đã cấp / Đã lắp</span><input readOnly value={selected?`${format.format(selected.issuedQty)} / ${format.format(selected.installedQty||0)} ${selected.unit||""}`:"—"}/></label></div>{selected?<div className="line-editor"><div className="po-line"><div><strong>{selected.materialCode}</strong><small>{selected.materialName} · {selected.unit}</small></div><span>{selected.workPackageCode||"Chưa có gói công việc"} · {selected.installationArea||"Chưa có khu vực lắp đặt"}</span><b>Còn có thể xác nhận {format.format(selected.remainingQty)} {selected.unit}</b></div></div>:<Empty text="Không còn dòng vật tư đã cấp cần xác nhận lắp đặt."/>}<div className="inline-alert"><b>Kiểm soát tồn:</b> Không thể xác nhận vượt số lượng đã cấp, tồn vật lý của tổ đội hoặc tồn sở hữu theo Contract.</div></div><ModalFooter close={close} label="Xác nhận đã lắp →" disabled={!selected||quantity<=0}/></form></BaseModal>;
}

function IssueModal({ data, close, submit }: { data: AppData; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const eligible=data.requests.filter((row)=>row.status==="approved"&&row.items.some((item:Row)=>Number(item.issuedQty)<Number(item.requestedQty)));
  const [requestId,setRequestId]=useState(eligible[0]?.id||"");
  const mr=eligible.find((row)=>row.id===requestId);
  const issueTeams=data.teams.filter((row)=>row.projectId===mr?.projectId);
  const [teamId,setTeamId]=useState("");
  // Team selection follows the selected MR's project boundary.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{const first=data.teams.find((row)=>row.projectId===mr?.projectId);setTeamId(first?.id||"");},[mr?.projectId,data.teams]);
  const siteWarehouse=data.warehouses.find((row)=>row.type==="site"&&row.projectId===mr?.projectId);
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!mr||!siteWarehouse||!teamId)return;const form=new FormData(event.currentTarget);const lines=mr.items.map((item:Row)=>{const available=data.inventory.find((row)=>row.warehouseId===siteWarehouse.id&&row.materialId===item.materialId)?.balance||0;return{requestItemId:item.id,materialId:item.materialId,quantity:Math.max(0,Math.min(Number(item.requestedQty)-Number(item.issuedQty),Number(available))),workPackageCode:item.workPackageCode,installationArea:item.installationArea};}).filter((item:Row)=>item.quantity>0);if(await submit("issue_stock",{projectId:mr.projectId,fromWarehouseId:siteWarehouse.id,teamId,requestId:mr.id,receivedByName:form.get("receivedByName"),note:form.get("note"),lines}))close();}
  return <BaseModal title="Cấp phát vật tư cho tổ đội" note="Tổ đội được chọn tại thời điểm cấp phát thực tế, độc lập với Phiếu đề nghị của BCH." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>MR đã duyệt *</span><select value={requestId} onChange={(event)=>setRequestId(event.target.value)} required><option value="">Chọn MR</option>{eligible.map((row)=><option key={row.id} value={row.id}>{row.requestNo} · {row.projectCode}</option>)}</select></label><label><span>Tổ đội nhận vật tư *</span><select value={teamId} onChange={(event)=>setTeamId(event.target.value)} required><option value="">Chọn tổ đội</option>{issueTeams.map((row)=><option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label><span>Người nhận / Đội trưởng *</span><input name="receivedByName" required/></label><label><span>Kho xuất</span><input readOnly value={siteWarehouse?.name||"—"}/></label></div>{mr?<div className="line-editor">{mr.items.map((item:Row)=>{const available=data.inventory.find((row)=>row.warehouseId===siteWarehouse?.id&&row.materialId===item.materialId)?.balance||0;const issue=Math.max(0,Math.min(Number(item.requestedQty)-Number(item.issuedQty),Number(available)));return <div className="po-line" key={item.id}><div><strong>{item.materialCode}</strong><small>{item.materialName}</small></div><span>Tồn kho {format.format(available)} · Còn nhu cầu {format.format(Number(item.requestedQty)-Number(item.issuedQty))}</span><b>Cấp {format.format(issue)} {item.unit}</b></div>;})}</div>:<Empty text="Không có MR sẵn sàng cấp."/>}<label className="full"><span>Ghi chú bàn giao</span><textarea name="note"/></label></div><ModalFooter close={close} label="Ghi sổ cấp phát →" disabled={!mr||!teamId}/></form></BaseModal>;
}
function CountModal({ data, close, submit }: { data: AppData; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) { const [projectId, setProjectId] = useState(data.projects[0]?.id || ""); const warehouses = data.warehouses.filter((row) => row.projectId === projectId && ["site", "team"].includes(row.type)); const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || ""); const rows:Row[] = data.materials.map((material) => ({ ...material, bookQty: Number(data.inventory.find((row) => row.warehouseId === warehouseId && row.materialId === material.id)?.balance || 0) })); async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const lines = rows.map((row) => ({ materialId: row.id, actualQty: Number(form.get(`actual-${row.id}`)), reason: form.get(`reason-${row.id}`) })); if (await submit("create_stock_count", { projectId, warehouseId, countType: form.get("countType"), lines })) close(); } return <BaseModal title="Lập phiếu kiểm kê" note="Chụp tồn sổ tại thời điểm đếm và tách bước duyệt điều chỉnh" close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Dự án *</span><select value={projectId} onChange={(event) => { setProjectId(event.target.value); setWarehouseId(data.warehouses.find((row) => row.projectId === event.target.value && row.type === "site")?.id || ""); }}>{data.projects.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}</select></label><label><span>Kho / vị trí *</span><select value={warehouseId} onChange={(event) => setWarehouseId(event.target.value)}>{warehouses.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}</select></label><label><span>Loại kiểm kê</span><select name="countType"><option value="periodic">Định kỳ</option><option value="spot">Đột xuất</option><option value="project_close">Cuối dự án</option></select></label></div><div className="line-editor"><div className="count-head"><span>Vật tư</span><span>Tồn sổ</span><span>Thực đếm</span><span>Giải trình</span></div>{rows.map((row) => <div className="count-line" key={row.id}><div><strong>{row.code}</strong><small>{row.name} · {row.unit}</small></div><b>{format.format(row.bookQty)}</b><input name={`actual-${row.id}`} type="number" min="0" step="0.001" defaultValue={row.bookQty} required /><input name={`reason-${row.id}`} placeholder="Lý do nếu có chênh lệch" /></div>)}</div></div><ModalFooter close={close} label="Lập phiếu chờ duyệt →" /></form></BaseModal>; }

function ReturnModal({ data, close, submit }: { data: AppData; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) { const [projectId, setProjectId] = useState(data.projects[0]?.id || ""); const teams = data.teams.filter((row) => row.projectId === projectId); const [teamId, setTeamId] = useState(teams[0]?.id || ""); const team = data.teams.find((row) => row.id === teamId); const balances = data.inventory.filter((row) => row.warehouseId === team?.warehouseId && Number(row.balance) > 0); const siteWarehouse = data.warehouses.find((row) => row.type === "site" && row.projectId === projectId); async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); const lines = balances.map((row) => ({ materialId: row.materialId, quantity: Number(form.get(`qty-${row.materialId}`) || 0), condition: form.get(`condition-${row.materialId}`), reason: form.get(`reason-${row.materialId}`) })).filter((row) => row.quantity > 0); if (await submit("return_stock", { projectId, teamId, toWarehouseId: siteWarehouse?.id, returnedByName: form.get("returnedByName"), note: form.get("note"), lines })) close(); } return <BaseModal title="Hoàn trả vật tư dư" note="Không cho hoàn vượt tồn đội; hàng hỏng không cộng lại tồn sử dụng" close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Dự án *</span><select value={projectId} onChange={(event) => { setProjectId(event.target.value); const firstTeam = data.teams.find((row) => row.projectId === event.target.value); setTeamId(firstTeam?.id || ""); }}>{data.projects.map((row) => <option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}</select></label><label><span>Tổ đội *</span><select value={teamId} onChange={(event) => setTeamId(event.target.value)}>{teams.map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label><label><span>Người giao trả *</span><input name="returnedByName" required /></label><label><span>Kho nhận</span><input readOnly value={siteWarehouse?.name || "—"} /></label></div><div className="line-editor">{balances.map((row) => <div className="return-line" key={row.materialId}><div><strong>{row.materialCode}</strong><small>{row.materialName} · Đang giữ {format.format(row.balance)} {row.unit}</small></div><input name={`qty-${row.materialId}`} type="number" min="0" max={row.balance} step="0.001" defaultValue="0" /><select name={`condition-${row.materialId}`}><option value="usable">Còn sử dụng</option><option value="damaged">Hư hỏng</option></select><input name={`reason-${row.materialId}`} placeholder="Lý do / tình trạng" /></div>)}{!balances.length && <Empty text="Tổ đội không có tồn để hoàn trả." />}</div></div><ModalFooter close={close} label="Xác nhận hoàn trả →" disabled={!balances.length} /></form></BaseModal>; }
function EmailSettingsModal({ data, close, submit }: { data: AppData; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const config = data.emailSettings || {}; const pendingStageNos = new Set(data.requests.filter((row) => row.status === "pending_approval").map((row) => Number(row.approvalStage))); const activeStages = data.approvalStages.filter((row) => row.active || pendingStageNos.has(Number(row.stageNo))).sort((a,b) => Number(a.stageNo)-Number(b.stageNo));
  useEffect(()=>{const id="vntech-member-email-options";document.getElementById(id)?.remove();const list=document.createElement("datalist");list.id=id;data.users.filter((member)=>member.active&&member.email).forEach((member)=>{const option=document.createElement("option");option.value=String(member.email);option.label=`${member.fullName} · ${member.department||"VNTECH"}`;list.appendChild(option);});document.body.appendChild(list);const timer=window.setTimeout(()=>document.querySelectorAll<HTMLInputElement>('input[name^="mail-"]').forEach((input)=>input.setAttribute("list",id)),0);return()=>{window.clearTimeout(timer);list.remove();};},[data.users]);
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const recipients: Row[] = []; const assignments: Row[] = [];
    for (const project of data.projects) {
      for (const stage of activeStages) { const stageNo=Number(stage.stageNo); const cc=form.get(`mail-${stageNo}-${project.id}`); recipients.push({ projectId: project.id, stage: stageNo, emails: cc }); assignments.push({ projectId: project.id, stage: stageNo, ownerUserId: form.get(`owner-${stageNo}-${project.id}`), ccEmails: cc }); }
      for (const stageNo of [101,102,103]) { const cc=form.get(`mail-${stageNo}-${project.id}`); recipients.push({ projectId: project.id, stage: stageNo, emails: cc }); assignments.push({ projectId: project.id, stage: stageNo, ownerUserId: form.get(`owner-${stageNo}-${project.id}`), ccEmails: cc }); }
    }
    const payload = { enabled: form.get("enabled") === "on", smtpHost: form.get("smtpHost"), smtpPort: Number(form.get("smtpPort")), security: form.get("security"), username: form.get("username"), smtpPassword: form.get("smtpPassword"), senderEmail: form.get("senderEmail"), senderName: form.get("senderName"), baseUrl: form.get("baseUrl"), poSlaHours: Number(form.get("poSlaHours")), bchConfirmationSlaHours: Number(form.get("bchConfirmationSlaHours")), testEmail: form.get("testEmail"), recipients, assignments };
    if (await submit("save_email_settings", payload)) close();
  }
  const emailFor = (projectId: string, stage: number) => data.emailRecipients.find((row) => row.projectId === projectId && Number(row.stage) === stage)?.emails || "";
  const ownerFor = (projectId: string, stage: number) => data.workflowAssignments?.find((row) => row.projectId === projectId && Number(row.stage) === stage)?.ownerUserId || "";
  const eligibleOwners = (projectId:string, allowedCodes:string, stage:number) => { const allowed=String(allowedCodes||"").split(",").map(v=>v.trim()).filter(Boolean); const scoped=new Set(data.userScopes.filter((r)=>r.projectId===projectId).map((r)=>r.userId)); return data.users.filter((u)=>u.active && (u.role==="admin" || scoped.has(u.id)) && (stage>=100 || !allowed.length || allowed.includes(u.role) || allowed.includes(u.roleBase))); };
  return <BaseModal title="Cấu hình email, SLA & phân công Owner" note="Mỗi bước chỉ 01 Owner chính; email và CC chỉ dùng để thông báo, không tạo quyền phê duyệt." close={close}><form className="email-config-form" onSubmit={send}><div className="modal-body"><label className="email-enable"><input name="enabled" type="checkbox" defaultChecked={Boolean(config.enabled)} /><span><b>Bật gửi email tự động</b><small>Nếu tắt, hồ sơ vẫn chạy bình thường nhưng email chỉ nằm trong hàng đợi.</small></span></label><div className="form-grid"><label><span>Máy chủ SMTP *</span><input name="smtpHost" defaultValue={config.smtpHost || "smtp.gmail.com"} placeholder="smtp.gmail.com" /></label><label><span>Cổng / Bảo mật *</span><div className="inline-fields"><input name="smtpPort" type="number" defaultValue={config.smtpPort || 587} /><select name="security" defaultValue={config.security || "starttls"}><option value="starttls">STARTTLS (587)</option><option value="tls">TLS (465)</option><option value="plain">Không mã hóa</option></select></div></label><label><span>Tài khoản SMTP *</span><input name="username" defaultValue={config.username || ""} placeholder="email@congty.vn" autoComplete="off" /></label><label><span>Mật khẩu ứng dụng *</span><input name="smtpPassword" type="password" placeholder={config.passwordConfigured ? "Để trống nếu không đổi" : "Nhập mật khẩu ứng dụng"} autoComplete="new-password" /></label><label><span>Email người gửi *</span><input name="senderEmail" type="email" defaultValue={config.senderEmail || ""} /></label><label><span>Tên người gửi</span><input name="senderName" defaultValue={config.senderName || VNTECH_BRAND.productName} /></label><label className="span-2"><span>Địa chỉ phần mềm đặt trong email *</span><input name="baseUrl" defaultValue={config.baseUrl || "http://192.168.1.20:8787"} placeholder="http://IP-PC-CHU:8787" /><small>Người nhận phải truy cập được địa chỉ này qua LAN hoặc VPN; không dùng localhost.</small></label></div><div className="sla-settings"><strong>Thời hạn xử lý</strong>{activeStages.map((stage) => <label key={stage.id}>{`Bước ${stage.stageNo} – ${stage.name}`} <b>{stage.slaHours} giờ</b><small>Chỉnh tại “Cấu hình luồng phê duyệt”</small></label>)}<label>Lập và phát hành PO <input name="poSlaHours" type="number" min="1" defaultValue={data.settings.poSlaHours || 24} /> giờ</label><label>BCH xác nhận giao hàng <input name="bchConfirmationSlaHours" type="number" min="1" defaultValue={data.settings.bchConfirmationSlaHours || 8} /> giờ</label></div><section className="recipient-editor"><div><strong>Phân công xử lý theo dự án</strong><p>Mỗi bước chỉ có 01 Owner chính. Email/SLA không cấp quyền; CC chỉ nhận thông báo và không được phê duyệt.</p></div>{data.projects.map((project) => <section className="permission-section" key={project.id}><h3>{project.code} · {project.name}</h3><div className="form-grid">{activeStages.map((stage) => <label key={stage.id}><span>{`Bước ${stage.stageNo} · ${stage.name} · Owner *`}</span><select name={`owner-${stage.stageNo}-${project.id}`} defaultValue={ownerFor(project.id,Number(stage.stageNo))} required><option value="">Chọn 01 người thực hiện</option>{eligibleOwners(project.id,String(stage.allowedRoleCodes||""),Number(stage.stageNo)).map((u)=><option key={u.id} value={u.id}>{u.fullName} · {u.roleName||u.role}</option>)}</select><small>CC thông báo (không có quyền duyệt)</small><input name={`mail-${stage.stageNo}-${project.id}`} type="text" defaultValue={emailFor(project.id, Number(stage.stageNo))} placeholder="cc1@congty.vn, cc2@congty.vn" /></label>)}{[[101,"Lập & phát hành PO"],[102,"Giao nhận"],[103,"BCH xác nhận giao hàng"]].map(([stageNo,label])=><label key={String(stageNo)}><span>{String(label)} · Owner *</span><select name={`owner-${stageNo}-${project.id}`} defaultValue={ownerFor(project.id,Number(stageNo))} required><option value="">Chọn 01 người thực hiện</option>{eligibleOwners(project.id,"",Number(stageNo)).map((u)=><option key={u.id} value={u.id}>{u.fullName} · {u.roleName||u.role}</option>)}</select><small>CC thông báo (không có quyền xử lý)</small><input name={`mail-${stageNo}-${project.id}`} type="text" defaultValue={emailFor(project.id, Number(stageNo))} placeholder="cc@congty.vn" /></label>)}</div></section>)}</section><label className="test-email"><span>Email nhận thử sau khi lưu</span><input name="testEmail" type="email" placeholder="Nhập nếu muốn gửi thư kiểm tra" /><small>Với Gmail/Google Workspace hãy dùng Mật khẩu ứng dụng, không dùng mật khẩu đăng nhập chính.</small></label></div><ModalFooter close={close} label="Lưu cấu hình email →" /></form></BaseModal>;
}

function ProjectModal({ data, row, close, submit }: { data: AppData; row: Row | null; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const editing = Boolean(row?.id); const warehouse = row?.id ? data.warehouses.find((item) => item.projectId === row.id && item.type === "site") : null;
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const payload = Object.fromEntries(new FormData(event.currentTarget)); if (await submit(editing ? "update_project" : "create_project", { ...payload, projectId: row?.id })) close(); }
  return <BaseModal title={editing ? `Sửa dự án ${row?.code}` : "Thêm dự án"} note="Mã dự án, tên dự án, hợp đồng và tên/mã kho đều do Quản trị viên tự cấu hình." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Mã dự án *</span><input name="code" required defaultValue={row?.code || ""} placeholder="DA06" /></label><label><span>Tên dự án *</span><input name="name" required defaultValue={row?.name || ""} /></label><label><span>Mã kho công trường *</span><input name="warehouseCode" required defaultValue={warehouse?.code || (row?.code ? `KHO-${row.code}` : "")} placeholder="KHO-DA06" /></label><label><span>Tên kho công trường *</span><input name="warehouseName" required defaultValue={warehouse?.name || (row?.code ? `Kho công trường ${row.code}` : "")} placeholder="Kho công trường dự án..." /></label><label><span>Số Hợp đồng</span><input name="contractNo" defaultValue={row?.contractNo || ""} placeholder="HĐ-..." /></label><label><span>Tên / Gói hợp đồng</span><input name="contractName" defaultValue={row?.contractName || ""} /></label><label><span>Ngày bắt đầu</span><input type="date" name="startDate" defaultValue={row?.startDate || ""} /></label><label><span>Dự kiến kết thúc</span><input type="date" name="plannedEndDate" defaultValue={row?.plannedEndDate || ""} /></label></div><div className="inline-alert">Dự án và kho được quản lý độc lập. Đổi tên/mã kho tại đây không làm gộp tồn kho với dự án khác.</div></div><ModalFooter close={close} label={editing ? "Lưu dự án & kho →" : "Tạo dự án & kho riêng →"} /></form></BaseModal>;
}
function CategoryModal({ row, close, submit }: { row: Row | null; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (await submit("save_material_category", { ...Object.fromEntries(new FormData(event.currentTarget)), categoryId: row?.id })) close(); }
  return <BaseModal title={row?.id ? "Sửa hệ M&E" : "Thêm hệ M&E"} note="Đây là mục cha lớn: Điện, Điện nhẹ, HVAC, Cấp thoát nước, PCCC... Quản trị viên tự tạo và sắp xếp." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Mã hệ *</span><input name="code" required defaultValue={row?.code || ""} placeholder="HVAC" /></label><label><span>Tên hệ M&E *</span><input name="name" required defaultValue={row?.name || ""} placeholder="Hệ thống HVAC" /></label><label><span>Thứ tự hiển thị</span><input name="sortOrder" type="number" defaultValue={row?.sortOrder || 0} /></label><label className="span-2"><span>Mô tả</span><input name="description" defaultValue={row?.description || ""} placeholder="Danh mục hệ thống..." /></label></div><div className="inline-alert">Khi tạo hệ mới, phần mềm tự tạo nhóm con <b>Chưa phân nhóm</b> để giữ an toàn cho vật tư chưa phân loại.</div></div><ModalFooter close={close} label="Lưu hệ M&E →" /></form></BaseModal>;
}
function MaterialSubcategoryModal({ data, row, close, submit }: { data: AppData; row: Row | null; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const categories = (data.adminMaterialCategories || data.materialCategories).filter((item)=>item.active || String(item.id)===String(row?.categoryId || ""));
  const editing = Boolean(row?.id);
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (await submit("save_material_subcategory", { ...Object.fromEntries(new FormData(event.currentTarget)), subcategoryId: editing ? row?.id : undefined })) close(); }
  return <BaseModal title={editing ? `Sửa nhóm ${row?.name}` : "Thêm nhóm vật tư"} note="Chỉ cần đặt Tên nhóm vật tư rõ nghĩa. Mã kỹ thuật nội bộ được hệ thống tự quản lý và không hiển thị cho người dùng." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Hệ M&E cha *</span><select name="categoryId" required defaultValue={row?.categoryId || categories[0]?.id || ""}>{categories.map((item)=><option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><label><span>Tên nhóm vật tư *</span><input name="name" required defaultValue={row?.name || ""} placeholder="Ống luồn dây PVC cứng" /></label><label><span>Thứ tự hiển thị</span><input name="sortOrder" type="number" defaultValue={row?.sortOrder || 0} /></label><label className="span-2"><span>Mô tả</span><input name="description" defaultValue={row?.description || ""} /></label></div></div><ModalFooter close={close} label="Lưu nhóm vật tư →" /></form></BaseModal>;
}
function MaterialModal({ data, row, close, submit }: { data: AppData; row: Row | null; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const categories = (data.adminMaterialCategories || data.materialCategories).filter((item) => item.active || String(item.id)===String(row?.categoryId || ""));
  const allSubcategories = data.adminMaterialSubcategories || data.materialSubcategories || [];
  const initialCategoryId = String(row?.categoryId || categories[0]?.id || "");
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const availableSubcategories = allSubcategories.filter((item)=>String(item.categoryId)===categoryId && (item.active || String(item.id)===String(row?.subcategoryId || "")));
  const initialSubcategoryId = String(row?.subcategoryId || availableSubcategories[0]?.id || ""); const [subcategoryId, setSubcategoryId] = useState(initialSubcategoryId);
  const effectiveSubcategoryId = availableSubcategories.some((item)=>String(item.id)===subcategoryId) ? subcategoryId : String(availableSubcategories[0]?.id || ""); const editing = Boolean(row?.id);
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); if (await submit("save_material", { ...Object.fromEntries(form), categoryId, subcategoryId: effectiveSubcategoryId, materialId: editing ? row?.id : undefined })) close(); }
  return <BaseModal title={editing ? `Sửa mã gốc ${row?.code}` : "Thêm mã vật tư gốc"} note="Material Master chỉ lưu thông tin định danh. Đơn giá, CO/CQ và MAR thuộc BOQ/Mua hàng, không quản lý tại đây." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Hệ M&E *</span><select required value={categoryId} onChange={(event)=>setCategoryId(event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><label><span>Nhóm vật tư *</span><select required value={effectiveSubcategoryId} onChange={(event)=>setSubcategoryId(event.target.value)}>{availableSubcategories.map((item)=><option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Mã vật tư gốc *</span><input name="code" required defaultValue={editing ? row?.code : ""} /></label><label><span>ĐVT *</span><input name="unit" required defaultValue={editing ? row?.unit : ""} placeholder="m, m², cái, bộ, kg..." /></label><label className="span-2"><span>Tên vật tư *</span><input name="name" required defaultValue={editing ? row?.name : ""} /></label><label><span>Hãng / NSX</span><input name="brand" defaultValue={editing ? row?.brand || "" : ""} /></label><label><span>Tồn tối thiểu</span><input type="number" min="0" step="any" name="minStock" defaultValue={editing ? row?.minStock || 0 : 0} /></label><label className="span-2"><span>Quy cách / Thông số</span><input name="specification" defaultValue={editing ? row?.specification || "" : ""} /></label><label className="span-2"><span>Tên gọi tương đương / Alias</span><textarea name="aliasText" defaultValue={row?.aliasText||""} placeholder="Mỗi tên một dòng hoặc cách nhau bằng dấu ;" /></label>{editing&&<label className="span-2"><span>Lý do đổi mã gốc (nếu sửa mã)</span><input name="codeChangeReason" placeholder="Chuẩn hóa mã công ty" /></label>}</div>{!availableSubcategories.length&&<div className="auth-alert danger">Hệ này chưa có nhóm vật tư đang dùng. Hãy tạo nhóm trước khi thêm mã.</div>}</div><ModalFooter close={close} label="Lưu mã vật tư gốc →" disabled={!effectiveSubcategoryId} /></form></BaseModal>;
}
function MaterialMergeModal({ data, row, close, submit }: { data: AppData; row: Row | null; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const materials=(data.adminMaterials||data.materials||[]).filter((m)=>Number(m.active)!==0);
  const [sourceId,setSourceId]=useState(String(row?.id||""));const [targetId,setTargetId]=useState("");const [reason,setReason]=useState("");const [preview,setPreview]=useState<Row|null>(null);const [busy,setBusy]=useState(false);
  async function loadPreview(){if(!sourceId||!targetId||sourceId===targetId)return;setBusy(true);try{const r=await requestApi("merge_material_master",{sourceMaterialId:sourceId,targetMaterialId:targetId,reason:reason||"PREVIEW",preview:true});setPreview(r);}catch(e){window.alert(e instanceof Error?e.message:"Không xem trước được ảnh hưởng.");}finally{setBusy(false);}}
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!sourceId||!targetId||sourceId===targetId||!reason.trim())return;const source=materials.find(m=>String(m.id)===sourceId),target=materials.find(m=>String(m.id)===targetId);if(!window.confirm(`HỢP NHẤT ${source?.code||sourceId} → ${target?.code||targetId}?\nToàn bộ tham chiếu BOQ/MR/PO/Receipt/Kho/Contract ledger sẽ chuyển sang mã đích. Lịch sử audit vẫn giữ.`))return;if(await submit("merge_material_master",{sourceMaterialId:sourceId,targetMaterialId:targetId,reason}))close();}
  const sourceImpact=preview?.source;return <BaseModal title="CHUYỂN / HỢP NHẤT MÃ VẬT TƯ" note="Sửa mã sai có kiểm soát: chuyển toàn bộ liên kết sang mã đúng thay vì để dữ liệu rác." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Mã nguồn sai *</span><select value={sourceId} onChange={(e)=>{setSourceId(e.target.value);setPreview(null);}} required><option value="">Chọn mã nguồn</option>{materials.map(m=><option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></label><label><span>Mã đích đúng *</span><select value={targetId} onChange={(e)=>{setTargetId(e.target.value);setPreview(null);}} required><option value="">Chọn mã đích</option>{materials.filter(m=>String(m.id)!==sourceId).map(m=><option key={m.id} value={m.id}>{m.code} · {m.name}</option>)}</select></label><label className="span-2"><span>Lý do *</span><textarea value={reason} onChange={(e)=>setReason(e.target.value)} required placeholder="Ví dụ: import nhầm mã / trùng mã / map BOQ sai..."/></label></div><button type="button" className="secondary" disabled={busy||!sourceId||!targetId} onClick={()=>void loadPreview()}>{busy?"Đang kiểm tra…":"Xem trước nơi đang sử dụng mã nguồn"}</button>{preview&&<div className="inline-alert"><b>{preview.message}</b><span> Tổng tham chiếu: {Number(sourceImpact?.total||0)} · BOQ nguồn: {Number(sourceImpact?.boqSource||0)} · BOQ đã map: {Number(sourceImpact?.boqItems||0)} · MR: {Number(sourceImpact?.requestItems||0)} · PO: {Number(sourceImpact?.poItems||0)} · Nhập kho: {Number(sourceImpact?.receiptItems||0)} · Stock movement: {Number(sourceImpact?.stockMovements||0)} · Contract ledger: {Number(sourceImpact?.contractLedger||0)}</span></div>}</div><ModalFooter close={close} label="CHUYỂN TOÀN BỘ SANG MÃ ĐÚNG →" disabled={!sourceId||!targetId||sourceId===targetId||!reason.trim()}/></form></BaseModal>;
}

function ProjectContractModal({data,row,close,submit}:{data:AppData;row:Row;close:()=>void;submit:(name:string,payload:Row)=>Promise<boolean>}){
  const project=data.projects.find((p)=>String(p.id)===String(row.projectId));const editing=Boolean(row.contractNo&&row.id);
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();const payload={...Object.fromEntries(new FormData(event.currentTarget)),projectId:row.projectId,contractId:editing?row.id:undefined};if(await submit("save_project_contract",payload))close();}
  return <BaseModal title={editing?`Sửa hợp đồng · ${row.contractNo}`:"Thêm hợp đồng dự án"} note={`${project?.code||"Dự án"} · Mỗi hợp đồng có BOQ Version và dữ liệu độc lập.`} close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Số hợp đồng *</span><input name="contractNo" required defaultValue={row.contractNo||""}/></label><label><span>Tên hợp đồng *</span><input name="contractName" required defaultValue={row.contractName||""}/></label><label><span>Loại</span><select name="contractType" defaultValue={row.contractType||"main"}><option value="main">Hợp đồng chính</option><option value="addendum">Phụ lục hợp đồng</option><option value="other">Hợp đồng khác</option></select></label><label><span>Hợp đồng/PL cha</span><select name="parentContractId" defaultValue={row.parentContractId||""}><option value="">—</option>{(data.projectContracts||[]).filter((c)=>String(c.projectId)===String(row.projectId)&&String(c.id)!==String(row.id||"")).map((c)=><option key={c.id} value={c.id}>{c.contractNo} · {c.contractName}</option>)}</select></label><label><span>Ngày ký</span><input type="date" name="signedAt" defaultValue={String(row.signedAt||"").slice(0,10)}/></label><label><span>Hiệu lực từ</span><input type="date" name="effectiveFrom" defaultValue={String(row.effectiveFrom||"").slice(0,10)}/></label><label><span>Hiệu lực đến</span><input type="date" name="effectiveTo" defaultValue={String(row.effectiveTo||"").slice(0,10)}/></label><label className="span-2"><span>Ghi chú</span><input name="note" defaultValue={row.note||""}/></label></div><div className="inline-alert">Import BOQ luôn bị khóa trong đúng Hợp đồng đang chọn; không ghi đè BOQ của hợp đồng khác.</div></div><ModalFooter close={close} label="Lưu hợp đồng →"/></form></BaseModal>;
}
function BoqVersionModal({data,row,close,submit}:{data:AppData;row:Row;close:()=>void;submit:(name:string,payload:Row)=>Promise<boolean>}){
  const contract=(data.projectContracts||[]).find((c)=>String(c.id)===String(row.contractId));
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);if(await submit("save_boq_version",{...Object.fromEntries(form),projectId:row.projectId,contractId:row.contractId,makeActive:form.get("makeActive")==="on"}))close();}
  return <BaseModal title="Tạo BOQ Version" note={`${contract?.contractNo||"Hợp đồng"} · Tạo phiên bản mới không xóa dữ liệu phiên bản trước.`} close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Mã phiên bản</span><input name="versionCode" placeholder="V2 / REV01"/></label><label><span>Tên phiên bản</span><input name="versionName" placeholder="BOQ điều chỉnh lần 1"/></label><label><span>Loại phiên bản</span><select name="revisionType" defaultValue="revision"><option value="original">BOQ gốc</option><option value="revision">Điều chỉnh</option><option value="addendum">Theo phụ lục</option></select></label><label><span>Ngày hiệu lực</span><input type="date" name="effectiveAt"/></label></div><label className="email-enable"><input type="checkbox" name="makeActive" defaultChecked/><span><b>Đặt làm BOQ hiện hành của hợp đồng</b><small>Phiên bản cũ vẫn giữ nguyên dữ liệu/lịch sử, chỉ chuyển trạng thái superseded.</small></span></label></div><ModalFooter close={close} label="Tạo BOQ Version →"/></form></BaseModal>;
}

function BoqItemModal({ data, row, projectId, close, submit }: { data: AppData; row: Row | null; projectId?: string; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const selectedProjectId=String(row?.projectId||projectId||"");const contractId=String(row?.contractId||"");const boqVersionId=String(row?.boqVersionId||"");const project=data.projects.find((item)=>String(item.id)===selectedProjectId);const contract=(data.projectContracts||[]).find((c)=>String(c.id)===contractId);const version=(data.boqVersions||[]).find((v)=>String(v.id)===boqVersionId);const editing=Boolean(row?.sourceItemId||row?.id&&row?.materialName);
  const [itemType,setItemType]=useState(String(row?.itemType||"contract"));const [rowRole,setRowRole]=useState(String(row?.rowRole||"material"));const [contractQty,setContractQty]=useState(Number(row?.contractQty??0));const [remeasuredQty,setRemeasuredQty]=useState(Number(row?.remeasuredQty??row?.contractQty??0));const [systemCode,setSystemCode]=useState(normalizeBoqSystemCode(row?.systemCode||"KHAC"));const variation=itemType==="outside_contract"?remeasuredQty:remeasuredQty-contractQty;
  const systemCodes=[...new Set([...(data.materialCategories||[]).map((c)=>normalizeBoqSystemCode(c.code)),...BOQ_SYSTEM_CODES])].filter((code)=>BOQ_SYSTEM_CODES.includes(code as typeof BOQ_SYSTEM_CODES[number]));const subgroupNames=[...new Set((data.materialSubcategories||[]).filter((s)=>normalizeBoqSystemCode(s.categoryCode)===systemCode).map((s)=>String(s.name)).filter(Boolean))];const materialOptions=(data.adminMaterials||data.materials||[]).filter((m)=>Number(m.active??1)!==0&&normalizeBoqSystemCode(m.categoryCode||m.system)===systemCode);
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!selectedProjectId||!contractId||!boqVersionId){window.alert("Thiếu Dự án/Hợp đồng/BOQ Version. Hãy mở dòng từ đúng phạm vi BOQ.");return;}const form=new FormData(event.currentTarget);const payload={...Object.fromEntries(form),projectId:selectedProjectId,contractId,boqVersionId,sourceItemId:row?.sourceItemId||(editing?row?.id:undefined),boqItemId:row?.projectBoqItemId,rowRole,itemType,systemCode,contractQty:itemType==="outside_contract"?0:contractQty,remeasuredQty,reason:String(form.get("reason")||"Điều chỉnh BOQ")};if(await submit("save_boq_item",payload))close();}
  return <BaseModal title={editing?"Sửa dòng BOQ/Hợp đồng":"Thêm dòng BOQ/Hợp đồng"} note={`${project?.code||"Dự án"} · ${contract?.contractNo||"Hợp đồng"} · ${version?.versionCode||"BOQ Version"} · mọi sửa đổi lưu lịch sử`} close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid">
    <label><span>Loại dòng *</span><select value={rowRole} onChange={(e)=>setRowRole(e.target.value)}><option value="material">Vật tư</option><option value="component">Cấu kiện</option><option value="section">Tiêu đề phần</option><option value="system">Tiêu đề hệ</option><option value="group">Nhóm công việc</option><option value="heading">Tiêu đề</option><option value="description">Mô tả</option><option value="subtotal">Tổng cộng</option><option value="note">Ghi chú</option></select></label><label><span>Phân loại *</span><select value={itemType} onChange={(e)=>setItemType(e.target.value)}><option value="contract">Trong BOQ/Hợp đồng</option><option value="outside_contract">Phát sinh ngoài Hợp đồng</option></select></label>
    <label><span>STT / Thứ tự nguồn</span><input type="number" min="1" name="sourceOrder" defaultValue={row?.sourceOrder||row?.lineNo||""} placeholder="Tự tăng nếu bỏ trống"/></label><label><span>STT theo Hợp đồng</span><input name="contractLineRef" defaultValue={row?.contractLineRef||""}/></label><label><span>Mã BOQ</span><input name="boqCode" defaultValue={row?.boqCode||""}/></label><label><span>Mã/Hạng mục HĐ</span><input name="contractCode" defaultValue={row?.contractCode||""}/></label>
    <label><span>Hệ M&E *</span><select value={systemCode} onChange={(e)=>setSystemCode(e.target.value)}>{systemCodes.map((code)=><option key={code} value={code}>{code} · {boqSystemName(code)}</option>)}</select></label><label><span>Nhóm con</span><input name="subgroupName" list="boq-subgroup-options" defaultValue={row?.subgroupName||""}/><datalist id="boq-subgroup-options">{subgroupNames.map((name)=><option key={name} value={name}/>)}</datalist></label>
    <label><span>Mã vật tư theo HĐ</span><input name="contractMaterialCode" defaultValue={row?.contractMaterialCode||""}/></label><label><span>Mã vật tư được phê duyệt</span><input name="approvedMaterialCode" defaultValue={row?.approvedMaterialCode||""}/></label><label className="span-2"><span>Tên vật tư / tiêu đề theo HĐ *</span><input name="materialName" required defaultValue={row?.materialName||row?.contractMaterialName||row?.description||""}/><small>Được sửa khi nhập sai; hệ thống giữ before/after trong BOQ Change History.</small></label>
    <label><span>ĐVT</span><input name="unit" defaultValue={row?.unit||""}/><small>ĐVT trống thì dòng không tham gia Material Matching.</small></label><label><span>Mã vật tư gốc / nội bộ</span><select name="materialId" defaultValue={row?.materialId||""}><option value="">Chưa mapping / giữ mapping hiện tại</option>{materialOptions.map((m)=><option key={m.id} value={m.id}>{m.code} · {m.name} · {m.unit}</option>)}</select></label>
    <input type="hidden" name="contractQty" value={itemType==="outside_contract"?0:contractQty}/><label><span>Khối lượng BOQ/HĐ</span><input type="number" min="0" step="any" disabled={itemType==="outside_contract"} value={itemType==="outside_contract"?0:contractQty} onChange={(e)=>{const v=Number(e.target.value);setContractQty(v);if(!editing&&remeasuredQty===0)setRemeasuredQty(v);}}/></label><label><span>{itemType==="outside_contract"?"KL phát sinh":"Khối lượng bóc lại"}</span><input type="number" min="0" step="any" value={remeasuredQty} onChange={(e)=>setRemeasuredQty(Number(e.target.value))}/></label><label><span>Phát sinh tăng/giảm</span><input readOnly value={`${variation>0?"+":""}${format.format(variation)}`}/></label><label><span>Đơn giá HĐ/dự kiến</span><input type="number" min="0" step="any" name="unitPrice" defaultValue={row?.unitPrice??0}/></label><label><span>Trạng thái phát sinh</span><select name="variationStatus" defaultValue={row?.variationStatus||"none"}><option value="none">Không phát sinh</option><option value="pending">Chờ duyệt</option><option value="approved">Đã duyệt</option><option value="rejected">Không duyệt</option></select></label><label><span>Số văn bản/PLHĐ</span><input name="variationRef" defaultValue={row?.variationRef||""}/></label><label><span>Ngày duyệt</span><input type="date" name="variationApprovedAt" defaultValue={String(row?.variationApprovedAt||"").slice(0,10)}/></label><label className="span-2"><span>Ghi chú</span><input name="note" defaultValue={row?.note||""}/></label><label className="span-2"><span>Lý do sửa *</span><input name="reason" required defaultValue={editing?"Sửa dữ liệu BOQ nhập sai":"Thêm dòng BOQ thủ công"}/></label>
  </div><div className="inline-alert"><b>Kiểm soát lịch sử:</b> nếu dòng đã phát sinh ĐNMH/PO/Nhập kho, hệ thống chặn đổi/xóa Mã vật tư gốc trực tiếp và yêu cầu dùng BOQ Version điều chỉnh.</div></div><ModalFooter close={close} label="Lưu BOQ →"/></form></BaseModal>;
}


function MenuGroupModal({ data, row, close, submit }: { data: AppData; row: Row | null; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const editing = Boolean(row?.id); const nextOrder = configuredMenuGroups(data, true).length ? Math.max(...configuredMenuGroups(data, true).map((item) => Number(item.sortOrder || 0))) + 100 : 100;
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); if (await submit("save_menu_group", { ...Object.fromEntries(form), groupId: row?.id, collapsible: form.get("collapsible") === "on" })) close(); }
  return <BaseModal title={editing ? `Sửa nhóm · ${row?.name}` : "Thêm nhóm menu"} note="Nhóm menu là đầu mục cha trên thanh bên. Tên nhóm, ký hiệu, thứ tự và khả năng thu gọn đều do quản trị viên cấu hình." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Mã nhóm *</span><input name="groupKey" required readOnly={editing} defaultValue={row?.groupKey || ""} placeholder="quan_ly_thiet_bi" /></label><label><span>Tên hiển thị *</span><input name="name" required defaultValue={row?.name || ""} placeholder="Quản lý thiết bị" /></label><label><span>Ký hiệu *</span><input name="icon" required maxLength={4} defaultValue={row?.icon || "DM"} placeholder="DM" /></label><label><span>Thứ tự nhóm</span><input name="sortOrder" type="number" defaultValue={row?.sortOrder ?? nextOrder} /></label></div><label className="email-enable"><input name="collapsible" type="checkbox" defaultChecked={row?.collapsible === undefined ? true : Boolean(row?.collapsible)} /><span><b>Cho phép thu gọn / xổ xuống</b><small>Nên bật cho nhóm có nhiều mục con để thanh menu luôn gọn.</small></span></label><div className="inline-alert">Mã nhóm chỉ dùng nội bộ và không đổi sau khi tạo. Nhóm rỗng vẫn có thể tồn tại trong cấu hình nhưng sẽ tự ẩn trên thanh menu người dùng.</div></div><ModalFooter close={close} label="Lưu nhóm menu →" /></form></BaseModal>;
}

function ModuleCatalogModal({ data, row, close, submit }: { data: AppData; row: Row; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const groups = configuredMenuGroups(data, true);
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (await submit("save_module_catalog", { ...Object.fromEntries(new FormData(event.currentTarget)), moduleKey: row.moduleKey })) close(); }
  return <BaseModal title={`Sửa mục · ${row.label || row.moduleKey}`} note="Đổi tên, ký hiệu và gán mục vào nhóm cha. Thứ tự nhanh nhất được sắp bằng kéo/thả tại màn hình Cấu hình menu cây." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Mã chức năng</span><input value={row.moduleKey} readOnly /></label><label><span>Tên hiển thị *</span><input name="label" required defaultValue={row.label || ""} /></label><label><span>Ký hiệu menu *</span><input name="icon" required maxLength={4} defaultValue={row.icon || ""} placeholder="PO" /></label><label><span>Nhóm cha</span><select name="groupKey" defaultValue={row.groupKey || ""}><option value="">Mục độc lập / không nhóm</option>{groups.map((group) => <option key={group.groupKey} value={group.groupKey}>{group.name}{group.active ? "" : " (đang ẩn)"}</option>)}</select></label><label><span>Thứ tự hiển thị</span><input name="sortOrder" type="number" defaultValue={row.sortOrder ?? 0} /></label></div><div className="inline-alert">Có thể chuyển mục sang nhóm khác bằng danh sách này hoặc kéo/thả trực tiếp. Mục Quản trị hệ thống bắt buộc phải nằm trong một nhóm đang quản lý được để tránh mất đường truy cập.</div></div><ModalFooter close={close} label="Lưu cấu hình menu →" /></form></BaseModal>;
}

function BusinessGroupModal({data,row,close,submit}:{data:AppData;row:Row|null;close:()=>void;submit:(name:string,payload:Row)=>Promise<boolean>}){
  const editing=Boolean(row?.id); const scopes=(data.businessScopes||[]).filter(scope=>scope.active||(row?.scopeIds||[]).includes(scope.id)); const profiles=(data.engineRoleProfiles||[]).filter(profile=>profile.engineKey!=="admin"&&profile.active!==0);
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();const fd=new FormData(event.currentTarget);const scopeIds=fd.getAll("scopeIds").map(String).filter(Boolean);if(!scopeIds.length){window.alert("Chọn ít nhất một Phạm vi nghiệp vụ.");return;}const payload=Object.fromEntries(fd);if(await submit("save_business_role_group",{...payload,scopeIds,groupId:row?.id}))close();}
  return <BaseModal title={editing?`Sửa nhóm quyền · ${row?.name}`:"Thêm nhóm quyền nghiệp vụ"} note="Phạm vi nghiệp vụ là danh mục động do Quản trị viên quản lý; không còn danh sách hard-code trong form này." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Mã nhóm *</span><input name="code" required pattern="[a-z0-9_-]+" defaultValue={row?.code||""} placeholder="phong_du_an"/></label><label><span>Tên nhóm *</span><input name="name" required defaultValue={row?.name||""} placeholder="Phòng Dự án"/></label><label className="span-2"><span>Phạm vi nghiệp vụ *</span><select name="scopeIds" multiple required size={Math.min(8,Math.max(3,scopes.length))} defaultValue={(row?.scopeIds||[]).map(String)}>{scopes.map(scope=><option key={scope.id} value={scope.id}>{scope.code} · {scope.name}{scope.active?"":" (đã ẩn)"}</option>)}</select><small>Giữ Ctrl/⌘ để chọn nhiều phạm vi. Danh sách lấy trực tiếp từ danh mục Phạm vi nghiệp vụ.</small></label><label><span>Quyền nền kỹ thuật *</span><select name="engineRole" defaultValue={row?.engineRole||profiles[0]?.engineKey||"engineer"}>{profiles.map(profile=><option key={profile.engineKey} value={profile.engineKey}>{profile.companyCode} · {profile.displayName}</option>)}</select></label><label><span>Thứ tự</span><input name="sortOrder" type="number" min="1" defaultValue={row?.sortOrder||100}/></label><label className="span-2"><span>Mô tả</span><input name="description" defaultValue={row?.description||""}/></label></div></div><ModalFooter close={close} label="Lưu nhóm quyền →"/></form></BaseModal>;
}

function RoleCatalogModal({ data, row, close, submit }: { data: AppData; row: Row | null; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const editing = Boolean(row?.id); const groups=data.businessRoleGroups.filter(group=>group.active||group.id===row?.businessGroupId).filter(group=>group.code!=="admin"); const organizations=(data.organizationUnits||[]).filter(unit=>unit.active||unit.id===row?.defaultOrganizationUnitId).filter(unit=>unit.unitType!=="company");
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const payload = Object.fromEntries(new FormData(event.currentTarget)); if (await submit("save_role_catalog", { ...payload, roleId: row?.id })) close(); }
  return <BaseModal title={editing ? `Sửa vai trò ${row?.name}` : "Thêm vai trò / chức danh"} note="Chức danh tham chiếu Nhóm quyền nghiệp vụ và Phòng/Bộ phận mặc định canonical; thay đổi có hiệu lực ở tài khoản, import và workflow." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Mã vai trò *</span><input name="code" required readOnly={row?.code==="admin"} defaultValue={row?.code || ""} placeholder="qs_du_an" /><small>{row?.code==="admin"?"Mã Quản trị hệ thống được bảo vệ.":"Được sửa; hệ thống tự chuyển mã trong tài khoản và bước duyệt."}</small></label><label><span>Tên hiển thị *</span><input name="name" required defaultValue={row?.name || ""} placeholder="QS dự án" /></label><label><span>Nhóm quyền nghiệp vụ *</span><select name="businessGroupId" disabled={row?.code==="admin"} required defaultValue={row?.code==="admin"?String(row?.businessGroupId||"BRG-admin"):String(row?.businessGroupId||groups[0]?.id||"")}>{row?.code==="admin"&&<option value={row?.businessGroupId||"BRG-admin"}>admin · Quản trị hệ thống</option>}{groups.map(group=><option key={group.id} value={group.id}>{group.code} · {group.name}</option>)}</select>{row?.code==="admin"&&<input type="hidden" name="businessGroupId" value={row?.businessGroupId||"BRG-admin"}/>}</label><label><span>Phòng/Bộ phận mặc định *</span><select name="defaultOrganizationUnitId" disabled={row?.code==="admin"} required={row?.code!=="admin"} defaultValue={row?.defaultOrganizationUnitId||""}><option value="">Chọn đơn vị canonical</option>{organizations.map(unit=><option key={unit.id} value={unit.id}>{unit.code} · {unit.name}{unit.active?"":" (đã ẩn)"}</option>)}</select>{row?.code==="admin"&&<input type="hidden" name="defaultOrganizationUnitId" value={row?.defaultOrganizationUnitId||"ORG-VNTECH"}/>}</label><label><span>Thứ tự hiển thị</span><input name="sortOrder" type="number" min="1" defaultValue={row?.sortOrder ?? data.roleCatalog.length+1} /></label><label className="span-2"><span>Mô tả</span><input name="description" defaultValue={row?.description || ""} placeholder="Mô tả trách nhiệm / phạm vi vai trò" /></label></div><div className="inline-alert">Ví dụ: <b>Thư ký Tổng giám đốc</b> mặc định thuộc Ban giám đốc; <b>Trưởng phòng Hành chính Pháp chế</b> là chức danh riêng và mặc định thuộc Hành chính Pháp chế.</div></div><ModalFooter close={close} label="Lưu vai trò →" /></form></BaseModal>;
}

function ApprovalStageModal({ data, row, close, submit }: { data: AppData; row: Row | null; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const initialRoles = String(row?.allowedRoleCodes || "").split(",").filter(Boolean); const [selectedRoles, setSelectedRoles] = useState<string[]>(initialRoles); const nextStage = data.approvalStages.length ? Math.max(...data.approvalStages.map((item) => Number(item.stageNo || 0))) + 1 : 1;
  async function send(event: FormEvent<HTMLFormElement>) { event.preventDefault(); if (!selectedRoles.length) { window.alert("Chọn ít nhất một vai trò được phép duyệt."); return; } const payload = Object.fromEntries(new FormData(event.currentTarget)); if (await submit("save_approval_stage", { ...payload, stageId: row?.id, allowedRoleCodes: selectedRoles, autoApproveOnSubmit: new FormData(event.currentTarget).get("autoApproveOnSubmit") === "on" })) close(); }
  const roles = data.roleCatalog.filter((item) => item.active && item.code !== "admin");
  return <BaseModal title={row?.id ? `Sửa bước ${row.stageNo}` : "Thêm bước phê duyệt"} note="Có thể thêm/bớt bước, đổi tên, nội dung, vai trò duyệt và SLA. Phiếu đã tạo giữ nguyên chuỗi bước của thời điểm lập phiếu." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Số bước *</span><input name="stageNo" type="number" min="1" required defaultValue={row?.stageNo || nextStage} /></label><input type="hidden" name="sortOrder" value={row?.sortOrder ?? (row?.stageNo || nextStage) * 10} /><label className="span-2"><span>Tên bước *</span><input name="name" required defaultValue={row?.name || ""} placeholder="Ban giám đốc phê duyệt" /></label><label className="span-2"><span>Nội dung / mô tả</span><input name="description" defaultValue={row?.description || ""} placeholder="Kiểm soát ngân sách, tiến độ, điều kiện mua..." /></label><label><span>Thời hạn xử lý (giờ) *</span><input name="slaHours" type="number" min="1" required defaultValue={row?.slaHours || 8} /></label><label><span>Cách xác nhận</span><select name="approvalMode" defaultValue={row?.approvalMode||"single"}><option value="single">Một vai trò xác nhận là đủ</option><option value="all_roles">Bắt buộc đủ tất cả vai trò (AND)</option></select></label><label className="check-inline"><span>Tự xác nhận khi gửi phiếu</span><input name="autoApproveOnSubmit" type="checkbox" defaultChecked={Boolean(row?.autoApproveOnSubmit)} /><small>Thường chỉ dùng cho bước BCH/người lập xác nhận khi bấm gửi.</small></label></div><fieldset className="scope-select"><legend>Vai trò được phép duyệt bước này <HelpTip text="Chọn các vai trò được phép xử lý bước duyệt này. Quản trị hệ thống vẫn có quyền xử lý sự cố theo nguyên tắc hệ thống."/></legend><div className="bulk-select-actions"><button type="button" className="secondary" onClick={()=>setSelectedRoles(roles.map((role)=>String(role.code)))}>✓ Chọn tất cả</button><button type="button" className="secondary" onClick={()=>setSelectedRoles([])}>□ Bỏ chọn tất cả</button></div>{roles.map((role) => <label key={role.code}><input type="checkbox" checked={selectedRoles.includes(role.code)} onChange={(event) => setSelectedRoles((current) => event.target.checked ? [...new Set([...current, role.code])] : current.filter((code) => code !== role.code))} /> {role.name}<small> · {engineRoleLabel(data,role.baseRole)}</small></label>)}</fieldset><div className="inline-alert">Quản trị hệ thống luôn có quyền xử lý khi cần khắc phục sự cố. Nếu đổi luồng khi đang có phiếu chạy, các phiếu cũ vẫn theo chuỗi bước đã tạo để không mất lịch sử.</div></div><ModalFooter close={close} label="Lưu bước phê duyệt →" /></form></BaseModal>;
}

// ---------------------------------------------------------------------------
// ĐỢT P3 — HỒ SƠ NHÂN SỰ CHI TIẾT
// Bấm vào một dòng nhân sự (tab "Nhân sự" hoặc màn "Hồ sơ nhân sự") để mở panel:
// chức vụ · phòng ban · liên hệ · cá nhân · dự án đã/đang tham gia.
// Chỉ dùng class CSS có sẵn (không thêm CSS mới) để giữ CSS baseline canonical.
// ---------------------------------------------------------------------------
function userOf(data: AppData, row: Row): Row {
  const id = String(row?.userId || row?.id || "");
  return data.users.find((u) => String(u.id) === id)
    || (data.staffDirectory || []).find((u) => String(u.id) === id)
    || row || {};
}
function projectRecord(data: AppData, projectId: string): Row {
  return data.projects.find((p) => String(p.id) === projectId)
    || data.adminProjects.find((p) => String(p.id) === projectId)
    || {};
}
/** Dự án đã/đang tham gia: đang hoạt động lên đầu (mới nhất trước), đã kết thúc/rời xuống dưới. */
function userProjectHistory(data: AppData, userId: string): Row[] {
  const stageByNo = new Map((data.approvalStages || []).map((s) => [Number(s.stageNo), s]));
  const dutyText = (a: Row) => { const st = stageByNo.get(Number(a.stage)); return st ? `Bước ${a.stage} · ${st.name}` : `Bước ${a.stage}`; };
  const assignments = (data.workflowAssignments || []).filter((a) => String(a.ownerUserId) === userId && a.active !== false && Number(a.active) !== 0);
  const seen = new Set<string>();
  const rows: Row[] = [];
  for (const scope of (data.userScopes || [])) {
    if (String(scope.userId) !== userId) continue;
    const pid = String(scope.projectId);
    seen.add(pid);
    const project = projectRecord(data, pid);
    rows.push({
      projectId: pid, permission: scope.permission || "read",
      code: project.code || scope.projectCode || "—", name: project.name || scope.projectName || "",
      status: String(project.status || "active"), startDate: project.startDate, plannedEndDate: project.plannedEndDate,
      duties: assignments.filter((a) => String(a.projectId) === pid).map(dutyText),
    });
  }
  for (const a of assignments) {   // được phân công duyệt nhưng chưa nằm trong phạm vi truy cập
    const pid = String(a.projectId);
    if (seen.has(pid)) continue;
    const project = projectRecord(data, pid);
    rows.push({
      projectId: pid, permission: "approval", code: project.code || "—", name: project.name || "",
      status: String(project.status || "active"), startDate: project.startDate, plannedEndDate: project.plannedEndDate,
      duties: [dutyText(a)],
    });
  }
  const rank = (r: Row) => (String(r.status) === "active" ? 0 : 1);
  return rows.sort((a, b) => rank(a) - rank(b) || String(b.startDate || "").localeCompare(String(a.startDate || "")));
}
function UserProfilePanel({ data, row, close, open, showDocuments = false }: { data: AppData; row: Row; close: () => void; open: (name: string, r?: Row) => void; showDocuments?: boolean }) {
  const user = userOf(data, row);
  const uid = String(user.id || "");
  const staff = (data.staffDirectory || []).find((u) => String(u.id) === uid) || {};
  const hr = (data.hrRecords || []).find((r) => String(r.userId) === uid) || {};
  const org = (data.organizationUnits || []).find((o) => String(o.id) === String(user.organizationUnitId || staff.organizationUnitId)) || {};
  const history = userProjectHistory(data, uid);
  const current = history.filter((r) => String(r.status) === "active");
  const past = history.filter((r) => String(r.status) !== "active");
  const contracts = (data.laborContracts || []).filter((c) => String(c.userId) === uid);
  const benefits = (data.benefitRecords || []).filter((b) => String(b.userId) === uid);
  const requests = (data.requests || []).filter((r) => String(r.requestedBy || "") === uid);
  const advances = (data.advanceRequests || []).filter((r) => String(r.requesterId || r.userId || "") === uid);
  const audits = (data.audits || []).filter((a) => String(a.userName || "") === String(user.fullName || ""));
  const fullName = String(user.fullName || staff.fullName || hr.fullName || "—");
  const text = (value: unknown) => (value === null || value === undefined || value === "" ? "—" : String(value));
  const money$ = (value: unknown) => (value === null || value === undefined || value === "" ? "—" : money(value));
  const fieldRows = (pairs: [string, unknown][]) => {
    const out: ReactNode[] = [];
    for (let i = 0; i < pairs.length; i += 2) {
      const a = pairs[i], b = pairs[i + 1];
      out.push(<tr key={a[0]}>
        <th>{a[0]}</th><td><strong>{text(a[1])}</strong></td>
        {b ? <><th>{b[0]}</th><td><strong>{text(b[1])}</strong></td></> : <><th /><td /></>}
      </tr>);
    }
    return out;
  };
  const projectRow = (p: Row, dimmed: boolean) => (
    <div key={String(p.projectId)} style={dimmed ? { opacity: 0.55 } : undefined}>
      <span className="group-icon">{dimmed ? "▨" : "▣"}</span>
      <span>
        <strong>{text(p.code)} · {text(p.name)}</strong>
        <small>
          {p.duties?.length ? `Chức vụ: ${p.duties.join(" · ")}` : "Thành viên dự án"}
          {" · "}{String(p.permission) === "approval" ? "Người duyệt" : `Quyền: ${text(p.permission)}`}
          {" · "}{projectPeriod(p.startDate, p.plannedEndDate)}
          {dimmed ? " · đã kết thúc/rời dự án" : ""}
        </small>
      </span>
      <b><StatusBadge value={String(p.status) === "active" ? "Đang tham gia" : "Đã kết thúc"} /></b>
    </div>
  );
  return <BaseModal title="Hồ sơ nhân sự chi tiết" note="Chức vụ · phòng ban · liên hệ · cá nhân · dự án đã và đang tham gia." close={close}>
    <div className="modal-body">
      <section className="card">
        <div className="table-toolbar">
          <div><strong>{fullName}</strong><span>{text(user.employeeCode || staff.employeeCode)} · {text(hr.position || user.roleName || staff.roleName || roleLabel(data, String(user.role || "")))}</span></div>
          <div className="row-actions">
            <StatusBadge value={Number(user.active ?? 1) === 0 ? "Đã nghỉ" : "Đang làm việc"} />
            <button className="export-mini" onClick={() => open("userEdit", user)}>Sửa tài khoản</button>
          </div>
        </div>
        <div className="table-wrap"><table><tbody>
          {fieldRows([
            ["Mã nhân viên", user.employeeCode || staff.employeeCode],
            ["Chức danh", hr.position || user.roleName || staff.roleName || roleLabel(data, String(user.role || ""))],
            ["Phòng ban", org.name || user.organizationName || staff.organizationName || user.department || hr.department],
            ["Mã đơn vị", org.code || user.organizationCode || staff.organizationCode],
            ["Vai trò hệ thống", roleLabel(data, String(user.role || ""))],
            ["Tên đăng nhập", user.username],
            ["Email", user.email || hr.email],
            ["Điện thoại", hr.phone],
          ])}
        </tbody></table></div>
      </section>
      <section className="card">
        <CardHead title="Thông tin cá nhân" note="Do Hành chính - Pháp chế cập nhật trong hồ sơ nhân sự." />
        {hr.id ? <div className="table-wrap"><table><tbody>
          {fieldRows([
            ["Số CCCD/CMND", hr.identityNo],
            ["Ngày sinh", hr.birthDate ? date(hr.birthDate) : ""],
            ["Nơi sinh", hr.birthplace],
            ["Địa chỉ thường trú", hr.permanentAddress],
            ["Trình độ học vấn", hr.educationLevel],
            ["Ngày vào làm", hr.joinedDate ? date(hr.joinedDate) : ""],
            ["Ghi chú", hr.note],
          ])}
        </tbody></table></div> : <Empty text="Chưa lập hồ sơ chi tiết cho nhân sự này." />}
      </section>
      <section className="card">
        <CardHead title={`Dự án đã và đang tham gia (${history.length})`} note="Dự án gần nhất lên đầu; dự án đã kết thúc hoặc đã rời được làm mờ và xếp xuống dưới." />
        {history.length ? <>
          <div className="admin-mini-list">{current.map((p) => projectRow(p, false))}</div>
          {past.length > 0 && <>
            <div className="table-toolbar"><div><strong>Đã kết thúc / đã rời</strong><span>{past.length} dự án</span></div></div>
            <div className="admin-mini-list">{past.map((p) => projectRow(p, true))}</div>
          </>}
        </> : <Empty text="Nhân sự chưa được gán vào dự án nào." />}
      </section>
      <section className="card">
        <CardHead title="Thao tác gần đây" note="Lấy từ nhật ký hệ thống (audit log) theo tên người thực hiện." />
        {audits.length ? <div className="table-wrap"><table><thead><tr><th>Thời gian</th><th>Hạng mục</th><th>Hành động</th></tr></thead><tbody>
          {audits.slice(0, 15).map((a) => <tr key={a.id}><td>{date(a.occurredAt)}</td><td>{text(a.entityType)}</td><td>{text(a.action)}</td></tr>)}
        </tbody></table></div> : <Empty text="Chưa ghi nhận thao tác nào (nhật ký hệ thống đang trống)." />}
      </section>
      {showDocuments && <section className="card">
        <CardHead title="Đơn từ & giấy tờ liên quan" note="Hợp đồng lao động, bảo hiểm, phiếu đề nghị và tạm ứng của nhân sự này." />
        <div className="table-wrap"><table><thead><tr><th>Loại</th><th>Số / nội dung</th><th>Thời gian</th><th>Trạng thái</th></tr></thead><tbody>
          {contracts.map((c) => <tr key={c.id}><td>Hợp đồng lao động</td><td>{text(c.contractNo)} · {text(c.contractType)}<small>{money$(c.salary)}</small></td><td>{date(c.startDate)} → {date(c.endDate)}</td><td><StatusBadge value={text(c.status)} /></td></tr>)}
          {benefits.map((b) => <tr key={b.id}><td>Bảo hiểm & chế độ</td><td>{text(b.benefitNo)} · {text(b.benefitType)}<small>{text(b.provider)}</small></td><td>{date(b.startDate)} → {date(b.endDate)}</td><td><StatusBadge value={text(b.status)} /></td></tr>)}
          {requests.map((r) => <tr key={r.id}><td>Phiếu đề nghị</td><td>{text(r.requestNo)}<small>{text(r.area)}</small></td><td>{date(r.createdAt)}</td><td><StatusBadge value={text(r.status)} /></td></tr>)}
          {advances.map((r) => <tr key={r.id}><td>Tạm ứng / hoàn ứng</td><td>{text(r.requestNo || r.purpose)}</td><td>{date(r.createdAt)}</td><td><StatusBadge value={text(r.status)} /></td></tr>)}
          {!contracts.length && !benefits.length && !requests.length && !advances.length && <tr><td colSpan={4}><Empty text="Chưa có đơn từ hay giấy tờ nào." /></td></tr>}
        </tbody></table></div>
      </section>}
    </div>
    <footer className="modal-footer"><button className="primary" type="button" onClick={close}>Đóng</button></footer>
  </BaseModal>;
}

function UserEditModal({ data, row, close, submit }: { data: AppData; row: Row; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const [resetCredential,setResetCredential]=useState<{username:string;password:string}|null>(null);
  const [copyStatus,setCopyStatus]=useState("");
  type PermissionCapability="view"|"use"|"create"|"edit"|"approve"|"export";
  const capabilities:PermissionCapability[]=["view","use","create","edit","approve","export"];
  const capabilityMeta:Record<PermissionCapability,{label:string;property:string}>={view:{label:"Xem",property:"canView"},use:{label:"Thao tác",property:"canUse"},create:{label:"Tạo",property:"canCreate"},edit:{label:"Sửa",property:"canEdit"},approve:{label:"Duyệt",property:"canApprove"},export:{label:"Xuất",property:"canExport"}};
  const roles = data.roleCatalog.filter((item) => item.active || item.code === row.role);
  const organizations=(data.organizationUnits||[]).filter((item)=>(item.unitType!=="company"||row.role==="admin")&&(item.active||item.id===row.organizationUnitId));
  const activeProjects=data.adminProjects.filter((item)=>String(item.status)==="active");
  const assignableModules=configuredModules(data).filter((item)=>item.key!=="admin");
  const permissionRows=permissionMenuStructure(data);
  const scopeFor=(projectId:string)=>data.userScopes.find((item)=>String(item.userId)===String(row.id)&&String(item.projectId)===String(projectId))?.permission||"none";
  const permissionFor=(moduleKey:string)=>data.allModulePermissions.find((item)=>String(item.userId)===String(row.id)&&item.moduleKey===moduleKey)||{};
  const [permissionState,setPermissionState]=useState<Record<string,Record<PermissionCapability,boolean>>>(()=>Object.fromEntries(assignableModules.map((item)=>{const current=permissionFor(item.key);return[item.key,Object.fromEntries(capabilities.map((cap)=>[cap,Boolean(current[capabilityMeta[cap].property])])) as Record<PermissionCapability,boolean>];})));
  const normalizeCaps=(current:Record<PermissionCapability,boolean>,cap:PermissionCapability,value:boolean)=>{const next={...current,[cap]:value};if(value){if(["use","create","edit","approve","export"].includes(cap))next.view=true;if(["create","edit","approve"].includes(cap))next.use=true;}else{if(cap==="view")capabilities.forEach((key)=>{next[key]=false;});if(cap==="use"){next.use=false;next.create=false;next.edit=false;next.approve=false;}}return next;};
  const setCapability=(moduleKey:string,cap:PermissionCapability,value:boolean)=>setPermissionState((current)=>({...current,[moduleKey]:normalizeCaps(current[moduleKey]||Object.fromEntries(capabilities.map((key)=>[key,false])) as Record<PermissionCapability,boolean>,cap,value)}));
  const setRowAll=(moduleKey:string,value:boolean)=>setPermissionState((current)=>({...current,[moduleKey]:Object.fromEntries(capabilities.map((cap)=>[cap,value])) as Record<PermissionCapability,boolean>}));
  const rowState=(moduleKey:string)=>{const values=capabilities.map((cap)=>Boolean(permissionState[moduleKey]?.[cap]));const selected=values.filter(Boolean).length;return{all:selected===capabilities.length,some:selected>0&&selected<capabilities.length};};
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    const updated=await submit("update_user", { ...Object.fromEntries(form), userId: row.id, active: Boolean(row.active) }); if(!updated)return;
    const projectScopes=activeProjects.map((project)=>({projectId:project.id,permission:String(form.get(`project-${project.id}`)||"none")})).filter((item)=>item.permission!=="none");
    const warehouseScopes=data.userWarehouseScopes.filter((item)=>String(item.userId)===String(row.id)).map((item)=>({warehouseId:item.warehouseId,permission:item.permission||"read"}));
    const modulePermissions=assignableModules.map((item)=>({moduleKey:item.key,canView:Boolean(permissionState[item.key]?.view),canUse:Boolean(permissionState[item.key]?.use),canCreate:Boolean(permissionState[item.key]?.create),canEdit:Boolean(permissionState[item.key]?.edit),canApprove:Boolean(permissionState[item.key]?.approve),canExport:Boolean(permissionState[item.key]?.export),permissionExpiresAt:form.get(`expires-${item.key}`)}));
    if(await submit("save_user_access",{userId:row.id,projectScopes,warehouseScopes,modulePermissions}))close();
  }
  async function toggleStatus(){const active=!Boolean(row.active);const warning=active?`Mở khóa tài khoản ${row.username}?`:`Khóa ngay tài khoản nhân viên nghỉ việc ${row.fullName}? Tất cả thiết bị đang đăng nhập sẽ bị thoát.`;if(window.confirm(warning)&&await submit("set_user_status",{userId:row.id,active}))close();}
  async function resetPassword(){
    if(!window.confirm(`Reset mật khẩu tài khoản ${row.username}? Toàn bộ phiên đăng nhập hiện tại sẽ bị thu hồi và người dùng bắt buộc đổi mật khẩu ở lần đăng nhập tiếp theo.`))return;
    try{const result=await requestApi("reset_user_password",{userId:row.id});const temporary=String(result.temporaryPassword||"");setResetCredential({username:String(row.username),password:temporary});setCopyStatus("");}catch(error){window.alert(error instanceof Error?error.message:"Không thể reset mật khẩu.");}
  }
  async function copyCredential(kind:"password"|"all"){if(!resetCredential)return;const text=kind==="password"?resetCredential.password:`Tài khoản: ${resetCredential.username}\nMật khẩu tạm thời: ${resetCredential.password}`;try{await navigator.clipboard.writeText(text);setCopyStatus("Đã sao chép");}catch{window.prompt("Sao chép thông tin dưới đây:",text);}}
  async function deleteAccount(){if(window.confirm(`Xóa tài khoản ${row.username}? Chỉ xóa được tài khoản chưa phát sinh nghiệp vụ. Tài khoản đã có lịch sử phải giữ ở trạng thái Đã khóa.`)&&await submit("delete_user",{userId:row.id}))close();}
  return <BaseModal title={`Sửa tài khoản · ${row.fullName}`} note="Thông tin tài khoản và ma trận quyền dùng chung đúng một nguồn dữ liệu với Ngoại lệ cá nhân; sửa ở đây sẽ phản ánh tại màn hình phân quyền." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Mã nhân viên *</span><input name="employeeCode" required defaultValue={row.employeeCode || ""} /></label><label><span>Họ tên *</span><input name="fullName" required defaultValue={row.fullName || ""} /></label><label><span>Tên đăng nhập *</span><input name="username" required defaultValue={row.username || ""} /></label><label><span>Email công ty</span><input name="email" type="email" defaultValue={row.email || ""} /></label><label><span>Vai trò *</span><select name="role" defaultValue={row.role}>{roles.map((role) => <option key={role.code} value={role.code}>{role.name}</option>)}</select></label><label><span>Phòng / Bộ phận *</span><select name="organizationUnitId" required defaultValue={row.organizationUnitId||""}><option value="" disabled>Chọn đơn vị</option>{organizations.map((item)=><option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><label><span>Hạn mức phê duyệt</span><input name="approvalLimit" type="number" min="0" step="any" defaultValue={row.approvalLimit || 0} /></label><label><span>Mật khẩu mới (nếu đặt lại)</span><input name="newPassword" type="password" minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}" title="≥8 ký tự, hoa, thường, số, ký tự đặc biệt" placeholder="Để trống nếu không đổi" /></label></div>
  <details className="embedded-account-permissions" open><summary><strong>PHÂN QUYỀN CÔNG VIỆC / CHỨC NĂNG</strong><span>Xem và chỉnh quyền của đúng nhân viên này ngay tại tài khoản</span></summary><div className="embedded-permission-body"><section className="permission-section"><h3>Phạm vi dự án</h3><div className="permission-grid">{activeProjects.map((project)=><label key={project.id}><span><b>{project.code}</b> · {project.name}</span><select name={`project-${project.id}`} defaultValue={scopeFor(String(project.id))}><option value="none">Không nhìn thấy</option><option value="read">Chỉ xem</option><option value="write">Thao tác / sửa</option><option value="approve">Phê duyệt</option></select></label>)}</div></section><section className="permission-section"><h3>Ma trận quyền theo đúng Menu cha → con → cháu</h3><div className="table-wrap permission-matrix-wrap"><table className="permission-matrix"><thead><tr><th>Menu / Chức năng</th><th>Cả dòng</th>{capabilities.map((cap)=><th key={cap}>{capabilityMeta[cap].label}</th>)}<th>Hết hạn</th></tr></thead><tbody>{permissionRows.map((entry)=>{if(entry.kind==="group")return <tr className="permission-group-row" key={entry.key}><td colSpan={capabilities.length+3}><strong>{entry.label}</strong></td></tr>;if(entry.kind==="subgroup")return <tr className="permission-subgroup-row" key={entry.key}><td colSpan={capabilities.length+3}><span>↳ {entry.label}</span></td></tr>;const item=entry.module!;const state=rowState(item.key);return <tr className="permission-module-row" key={item.key}><td><strong>{item.label}</strong><small>{item.group}{item.subGroup?` › ${item.subGroup}`:""}</small></td><td><TriStateCheckbox checked={state.all} some={state.some} title={`Chọn/bỏ toàn bộ quyền ${item.label}`} onChange={(checked)=>setRowAll(item.key,checked)}/></td>{capabilities.map((cap)=><td key={cap}><input type="checkbox" checked={Boolean(permissionState[item.key]?.[cap])} aria-label={`${capabilityMeta[cap].label} · ${item.label}`} onChange={(event)=>setCapability(item.key,cap,event.target.checked)}/></td>)}<td><input type="datetime-local" name={`expires-${item.key}`} defaultValue={permissionFor(item.key).permissionExpiresAt?.slice?.(0,16)||""}/></td></tr>;})}</tbody></table></div><div className="inline-alert"><b>Đồng bộ SSOT:</b> quyền lưu tại đây dùng chính action phân quyền của Ngoại lệ cá nhân. Không tạo bảng quyền thứ hai.</div></section></div></details>
  {resetCredential&&<div className="reset-credential-panel"><strong>RESET MẬT KHẨU THÀNH CÔNG</strong><p>Mật khẩu tạm thời chỉ hiển thị trong phiên này. Người dùng bắt buộc đổi mật khẩu sau khi đăng nhập.</p><div><label><span>Tài khoản</span><code>{resetCredential.username}</code></label><label><span>Mật khẩu tạm thời</span><code>{resetCredential.password}</code></label></div><div className="row-actions"><button type="button" className="primary" onClick={()=>void copyCredential("password")}>SAO CHÉP MẬT KHẨU</button><button type="button" className="secondary" onClick={()=>void copyCredential("all")}>SAO CHÉP TÀI KHOẢN + MẬT KHẨU</button>{copyStatus&&<b className="copy-ok">✓ {copyStatus}</b>}</div></div>}<div className="inline-alert"><b>{row.active?"Tài khoản đang hoạt động":"Tài khoản đã khóa"}:</b> Khóa tài khoản sẽ thu hồi phiên đăng nhập. Reset mật khẩu sẽ cấp mật khẩu tạm và bắt buộc người dùng đổi ngay lần đăng nhập tiếp theo. Chỉ xóa tài khoản chưa phát sinh nghiệp vụ.</div><div className="row-actions"><button type="button" className="secondary" disabled={!row.active} onClick={()=>void resetPassword()}>↻ RESET MẬT KHẨU</button><button type="button" className={`secondary ${row.active?"danger":""}`} onClick={()=>void toggleStatus()}>{row.active?"Khóa tài khoản":"Mở khóa tài khoản"}</button>{!row.active&&row.role!=="admin"&&<button type="button" className="secondary danger" onClick={()=>void deleteAccount()}>Xóa tài khoản chưa phát sinh</button>}</div></div><ModalFooter close={close} label="Lưu tài khoản & phân quyền →" /></form></BaseModal>;
}

function UserAccessModal({ data, userRow, close, submit }: { data: AppData; userRow: Row; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  type PermissionCapability="view"|"use"|"create"|"edit"|"approve"|"export";
  const capabilities:PermissionCapability[]=["view","use","create","edit","approve","export"];
  const capabilityMeta:Record<PermissionCapability,{label:string;help:string;property:string}>={
    view:{label:"Xem",help:ADMIN_HELP_TEXT.permissionView,property:"canView"},use:{label:"Thao tác",help:ADMIN_HELP_TEXT.permissionUse,property:"canUse"},create:{label:"Tạo",help:ADMIN_HELP_TEXT.permissionCreate,property:"canCreate"},edit:{label:"Sửa",help:ADMIN_HELP_TEXT.permissionEdit,property:"canEdit"},approve:{label:"Duyệt",help:ADMIN_HELP_TEXT.permissionApprove,property:"canApprove"},export:{label:"Xuất",help:ADMIN_HELP_TEXT.permissionExport,property:"canExport"},
  };
  const activeProjects=data.adminProjects.filter((row)=>row.status==="active");const assignableModules=configuredModules(data).filter((item)=>item.key!=="admin");const permissionRows=permissionMenuStructure(data);const scopeFor=(projectId:string)=>data.userScopes.find((row)=>row.userId===userRow.id&&row.projectId===projectId)?.permission||"none";const permissionFor=(moduleKey:string)=>data.allModulePermissions.find((item)=>item.userId===userRow.id&&item.moduleKey===moduleKey)||{};
  const warehouseKind=String(userRow.warehouseScopeKind||""); const isWarehouseRole=String(userRow.roleBase||userRow.role)==="warehouse"; const availableWarehouses=isWarehouseRole?data.warehouses.filter((row)=>warehouseKind==="central"?row.type==="central":row.type==="site"):[]; const warehouseScopeFor=(warehouseId:string)=>data.userWarehouseScopes.find((row)=>row.userId===userRow.id&&row.warehouseId===warehouseId)?.permission||"none";
  const [permissionState,setPermissionState]=useState<Record<string,Record<PermissionCapability,boolean>>>(()=>Object.fromEntries(assignableModules.map((item)=>{const p=permissionFor(item.key);return[item.key,Object.fromEntries(capabilities.map((cap)=>[cap,Boolean(p[capabilityMeta[cap].property])])) as Record<PermissionCapability,boolean>];})));
  const normalizeCaps=(current:Record<PermissionCapability,boolean>,cap:PermissionCapability,value:boolean)=>{const next={...current,[cap]:value};if(value){if(["use","create","edit","approve","export"].includes(cap))next.view=true;if(["create","edit","approve"].includes(cap))next.use=true;}else{if(cap==="view")capabilities.forEach((key)=>{next[key]=false;});if(cap==="use"){next.use=false;next.create=false;next.edit=false;next.approve=false;}}return next;};
  const setCapability=(moduleKey:string,cap:PermissionCapability,value:boolean)=>setPermissionState((current)=>({...current,[moduleKey]:normalizeCaps(current[moduleKey]||Object.fromEntries(capabilities.map((key)=>[key,false])) as Record<PermissionCapability,boolean>,cap,value)}));
  const setRowAll=(moduleKey:string,value:boolean)=>setPermissionState((current)=>({...current,[moduleKey]:Object.fromEntries(capabilities.map((cap)=>[cap,value])) as Record<PermissionCapability,boolean>}));
  const setColumnAll=(cap:PermissionCapability,value:boolean)=>setPermissionState((current)=>Object.fromEntries(assignableModules.map((item)=>[item.key,normalizeCaps(current[item.key],cap,value)])));
  const setAll=(value:boolean)=>setPermissionState(Object.fromEntries(assignableModules.map((item)=>[item.key,Object.fromEntries(capabilities.map((cap)=>[cap,value])) as Record<PermissionCapability,boolean>])));
  const columnState=(cap:PermissionCapability)=>{const selected=assignableModules.filter((item)=>permissionState[item.key]?.[cap]).length;return{all:assignableModules.length>0&&selected===assignableModules.length,some:selected>0&&selected<assignableModules.length};};
  const rowState=(moduleKey:string)=>{const values=capabilities.map((cap)=>Boolean(permissionState[moduleKey]?.[cap]));const selected=values.filter(Boolean).length;return{all:selected===capabilities.length,some:selected>0&&selected<capabilities.length};};
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);const projectScopes=activeProjects.map((project)=>({projectId:project.id,permission:String(form.get(`project-${project.id}`)||"none")})).filter((item)=>item.permission!=="none");const warehouseScopes=availableWarehouses.map((warehouse)=>({warehouseId:warehouse.id,permission:String(form.get(`warehouse-${warehouse.id}`)||"none")})).filter((item)=>item.permission!=="none");const modulePermissions=assignableModules.map((item)=>({moduleKey:item.key,canView:Boolean(permissionState[item.key]?.view),canUse:Boolean(permissionState[item.key]?.use),canCreate:Boolean(permissionState[item.key]?.create),canEdit:Boolean(permissionState[item.key]?.edit),canApprove:Boolean(permissionState[item.key]?.approve),canExport:Boolean(permissionState[item.key]?.export),permissionExpiresAt:form.get(`expires-${item.key}`)}));const before=assignableModules.flatMap((item)=>capabilities.map((cap)=>Boolean(permissionFor(item.key)[capabilityMeta[cap].property])));const after=assignableModules.flatMap((item)=>capabilities.map((cap)=>Boolean(permissionState[item.key]?.[cap])));const changed=after.filter((value,index)=>value!==before[index]).length;if(changed>=20&&!window.confirm(`Bạn đang thay đổi ${changed} quyền của ${userRow.fullName}. Xác nhận lưu?`))return;if(await submit("save_user_access",{userId:userRow.id,projectScopes,warehouseScopes,modulePermissions}))close();}
  return <BaseModal title={`Phân quyền · ${userRow.fullName}`} note="Quyền chức năng, phạm vi dự án và phạm vi kho được kiểm soát độc lập; chỉ Quản trị viên được thay đổi." close={close}><form onSubmit={send}><div className="modal-body"><section className="permission-section"><h3>1. Phạm vi dự án <HelpTip text="Quyền chức năng chỉ có hiệu lực trong những dự án người dùng được gán. Không nhìn thấy = không truy cập; Chỉ xem = đọc; Thao tác/sửa = xử lý nghiệp vụ; Phê duyệt = được tham gia bước duyệt khi đúng workflow."/></h3><p>Quyền chức năng bên dưới chỉ có hiệu lực trong dự án đã được gán.</p><div className="permission-grid">{activeProjects.map((project)=><label key={project.id}><span><b>{project.code}</b> · {project.name}</span><select name={`project-${project.id}`} defaultValue={scopeFor(project.id)} title="Chọn mức truy cập của người dùng trong riêng dự án này."><option value="none">Không nhìn thấy</option><option value="read">Chỉ xem</option><option value="write">Cho phép thao tác/sửa</option><option value="approve">Cho phép phê duyệt</option></select></label>)}</div></section>{isWarehouseRole&&<section className="permission-section"><h3>2. Phạm vi kho bắt buộc</h3><p>{warehouseKind==="central"?"Thủ kho Tổng chỉ được gán Kho Tổng; hệ thống chặn toàn bộ kho dự án.":"Thủ kho dự án chỉ được gán kho thuộc đúng dự án đã được cấp ở mục 1; hệ thống chặn Kho Tổng và dự án khác."}</p><div className="permission-grid">{availableWarehouses.map((warehouse)=><label key={warehouse.id}><span><b>{warehouse.code}</b> · {warehouse.name}<small> · {warehouse.type==="central"?"Kho Tổng":data.adminProjects.find((p)=>p.id===warehouse.projectId)?.code||"Kho dự án"}</small></span><select name={`warehouse-${warehouse.id}`} defaultValue={warehouseScopeFor(String(warehouse.id))}><option value="none">Không truy cập</option><option value="read">Chỉ xem</option><option value="write">Cho phép thao tác</option><option value="approve">Thao tác + xác nhận</option></select></label>)}</div></section>}<section className="permission-section"><div className="permission-section-head"><div><h3>{isWarehouseRole?"3":"2"}. Ma trận quyền từng chức năng</h3><p>Checkbox ở đầu cột chọn/bỏ cả cột; checkbox “Cả dòng” chọn/bỏ toàn bộ quyền của một chức năng. Ô tổng có trạng thái ▣ khi mới chọn một phần.</p></div><div className="bulk-select-actions"><button type="button" className="secondary" title="Bật toàn bộ các quyền trong ma trận. Ngày hết hạn không bị thay đổi." onClick={()=>setAll(true)}>✓ Chọn tất cả</button><button type="button" className="secondary" title="Thu hồi toàn bộ các quyền trong ma trận. Ngày hết hạn không bị thay đổi." onClick={()=>setAll(false)}>□ Bỏ chọn tất cả</button></div></div><div className="table-wrap"><table className="permission-matrix"><thead><tr><th>Chức năng</th><th><div className="permission-master"><span>Cả dòng</span><HelpTip text="Mỗi checkbox ở cột này chọn/bỏ toàn bộ Xem, Thao tác, Tạo, Sửa, Duyệt, Xuất của riêng chức năng đó."/></div></th>{capabilities.map((cap)=>{const state=columnState(cap);const meta=capabilityMeta[cap];return <th key={cap}><div className="permission-master"><span>{meta.label}</span><HelpTip text={meta.help}/></div><TriStateCheckbox checked={state.all} some={state.some} title={`${state.all?"Bỏ":"Chọn"} quyền ${meta.label} cho tất cả chức năng`} onChange={(checked)=>setColumnAll(cap,checked)}/></th>;})}<th><div className="permission-master"><span>Hết hạn</span><HelpTip text={ADMIN_HELP_TEXT.permissionExpiry}/></div></th></tr></thead><tbody>{permissionRows.map((entry)=>{if(entry.kind==="group")return <tr className="permission-group-row" key={entry.key}><td colSpan={capabilities.length+3}><strong>{entry.label}</strong></td></tr>;if(entry.kind==="subgroup")return <tr className="permission-subgroup-row" key={entry.key}><td colSpan={capabilities.length+3}><span>↳ {entry.label}</span></td></tr>;const item=entry.module!;const rowSummary=rowState(item.key);return <tr className="permission-module-row" key={item.key}><td><strong>{item.label}</strong><small>{item.group}{item.subGroup?` › ${item.subGroup}`:""}</small></td><td><TriStateCheckbox checked={rowSummary.all} some={rowSummary.some} title={`${rowSummary.all?"Bỏ":"Chọn"} toàn bộ quyền của ${item.label}`} onChange={(checked)=>setRowAll(item.key,checked)}/></td>{capabilities.map((cap)=><td key={cap}><input type="checkbox" name={`${cap}-${item.key}`} checked={Boolean(permissionState[item.key]?.[cap])} title={capabilityMeta[cap].help} aria-label={`${capabilityMeta[cap].label} · ${item.label}`} onChange={(event)=>setCapability(item.key,cap,event.target.checked)}/></td>)}<td><input type="datetime-local" name={`expires-${item.key}`} defaultValue={permissionFor(item.key).permissionExpiresAt?.slice?.(0,16)||""} title={ADMIN_HELP_TEXT.permissionExpiry}/></td></tr>;})}</tbody></table></div></section><div className="inline-alert"><b>Nguyên tắc:</b> chức danh không tự sinh quyền. Bật Tạo/Sửa/Duyệt tự bật Xem + Thao tác; bật Xuất tự bật Xem. Bỏ Xem sẽ thu hồi toàn bộ quyền phụ thuộc. Quản trị viên có thể thu hồi bất kỳ lúc nào.</div></div><ModalFooter close={close} label="Lưu bảng phân quyền →"/></form></BaseModal>;
}

function canonicalRoleOptions(rows:Row[]){const preferred=["ksda","cht","thuky","da_nv","da_truong","kh_nv","kh_truong","accountant","thu_kho","kho_tong","team","director","admin"];const rank=(code:string)=>{const i=preferred.indexOf(String(code));return i<0?999:i;};const byName=new Map<string,Row>();for(const row of rows.filter(r=>r.active)){const key=String(row.name||"").trim().toLocaleLowerCase("vi-VN").replace(/\s+/g," ");const current=byName.get(key);if(!current||rank(String(row.code))<rank(String(current.code)))byName.set(key,row);}return [...byName.values()].sort((a,b)=>Number(a.sortOrder||rank(String(a.code)))-Number(b.sortOrder||rank(String(b.code))));}

function UserModal({ data, close, submit }: { data: AppData; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const [selectedProjects,setSelectedProjects]=useState<string[]>([]);
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);const payload=Object.fromEntries(form);if(await submit("create_user",{...payload,projectIds:selectedProjects}))close();}
  return <BaseModal title="Tạo tài khoản nội bộ" note="Gán vai trò, đơn vị tổ chức và phạm vi dự án ngay khi tạo" close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Mã nhân viên *</span><input name="employeeCode" required/></label><label><span>Họ tên *</span><input name="fullName" required/></label><label><span>Tên đăng nhập *</span><input name="username" required/></label><label><span>Email công ty</span><input name="email" type="email"/></label><label><span>Vai trò *</span><select name="role">{canonicalRoleOptions(data.roleCatalog).filter((item)=>item.code!=="admin").map((item)=><option value={item.code} key={item.code}>{item.name}</option>)}</select></label><label><span>Phòng / Bộ phận *</span><select name="organizationUnitId" required defaultValue=""><option value="" disabled>Chọn đơn vị</option>{(data.organizationUnits||[]).filter((item)=>item.active&&item.unitType!=="company").map((item)=><option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select></label><label className="span-2"><span>Mật khẩu ban đầu *</span><input name="password" type="password" minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}" title="≥8 ký tự, hoa, thường, số, ký tự đặc biệt" required/></label></div><fieldset className="scope-select"><legend>Dự án được phép truy cập <HelpTip text="Chọn các dự án tài khoản được phép nhìn thấy. Có thể tinh chỉnh mức Xem/Thao tác/Duyệt sau khi tạo tài khoản trong màn hình Phân quyền."/></legend><div className="bulk-select-actions"><button type="button" className="secondary" onClick={()=>setSelectedProjects(data.projects.map((row)=>String(row.id)))}>✓ Chọn tất cả</button><button type="button" className="secondary" onClick={()=>setSelectedProjects([])}>□ Bỏ chọn tất cả</button></div>{data.projects.map((row)=><label key={row.id}><input type="checkbox" value={row.id} checked={selectedProjects.includes(String(row.id))} onChange={(event)=>setSelectedProjects((current)=>event.target.checked?[...new Set([...current,String(row.id)])]:current.filter((id)=>id!==String(row.id)))}/> {row.code} · {row.name}</label>)}</fieldset></div><ModalFooter close={close} label="Tạo tài khoản →"/></form></BaseModal>;
}
function ForcedPasswordModal({user,submit}:{user:Row;submit:(name:string,payload:Row)=>Promise<boolean>}){
  async function change(event:FormEvent<HTMLFormElement>){event.preventDefault();const payload=Object.fromEntries(new FormData(event.currentTarget));const next=String(payload.newPassword||"");if(next!==String(payload.confirmPassword||"")){window.alert("Xác nhận mật khẩu mới chưa khớp.");return;}if(next.length<8||!/[A-Z]/.test(next)||!/[a-z]/.test(next)||!/[0-9]/.test(next)||!/[^A-Za-z0-9]/.test(next)){window.alert("Mật khẩu cần ≥8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.");return;}if(await submit("change_password",payload))window.location.reload();}
  return <div className="overlay modal-overlay forced-password-overlay"><section className="modal forced-password-modal"><header><div><h2>BẮT BUỘC ĐỔI MẬT KHẨU</h2><p>Quản trị viên vừa reset mật khẩu của tài khoản {user.username}. Bạn phải tạo mật khẩu mới trước khi sử dụng VNTECH ERP.</p></div></header><form onSubmit={change}><div className="modal-body"><div className="inline-alert"><b>Bảo mật tài khoản:</b> Mật khẩu tạm thời chỉ dùng để đăng nhập lần này. Các chức năng nghiệp vụ đang bị khóa cho đến khi đổi mật khẩu thành công.</div><div className="form-grid"><label><span>Mật khẩu tạm thời / hiện tại *</span><input name="currentPassword" type="password" required autoComplete="current-password"/></label><label><span>Mật khẩu mới *</span><input name="newPassword" type="password" minLength={8} required autoComplete="new-password"/></label><label><span>Xác nhận mật khẩu mới *</span><input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password"/></label></div></div><footer className="modal-footer"><button className="primary">Đổi mật khẩu và tiếp tục →</button></footer></form></section></div>;
}

function AccountSettingsModal({ user, close, submit }: { user:Row; close:()=>void; submit:(name:string,payload:Row)=>Promise<boolean> }) {
  const [avatar,setAvatar]=useState<string>(String(user.avatarUrl||""));
  const [avatarError,setAvatarError]=useState("");
  async function pickAvatar(event:ChangeEvent<HTMLInputElement>){const file=event.target.files?.[0];event.target.value="";if(!file)return;if(!["image/jpeg","image/png","image/webp"].includes(file.type)){setAvatarError("Chỉ hỗ trợ JPG, PNG hoặc WebP.");return;}if(file.size>2*1024*1024){setAvatarError("Ảnh đại diện tối đa 2 MB.");return;}const reader=new FileReader();reader.onload=()=>{setAvatar(String(reader.result||""));setAvatarError("");};reader.readAsDataURL(file);}
  async function saveAvatar(){if(await submit("update_profile_avatar",{avatarDataUrl:avatar}))close();}
  async function changePassword(event:FormEvent<HTMLFormElement>){event.preventDefault();const payload=Object.fromEntries(new FormData(event.currentTarget));const next=String(payload.newPassword||"");if(next!==String(payload.confirmPassword||"")){window.alert("Xác nhận mật khẩu mới chưa khớp.");return;}const rules=[next.length>=8,/[A-Z]/.test(next),/[a-z]/.test(next),/[0-9]/.test(next),/[^A-Za-z0-9]/.test(next)];if(rules.some(v=>!v)){window.alert("Mật khẩu cần ≥8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.");return;}if(await submit("change_password",payload))close();}
  return <BaseModal title="Cài đặt tài khoản" note="Tự quản lý ảnh đại diện và mật khẩu cá nhân" close={close}><div className="account-settings"><section className="account-avatar-settings"><div className="account-avatar-preview">{avatar?<img src={avatar} alt="Ảnh đại diện"/>:<span>{initials(String(user.fullName||"NV"))}</span>}</div><div><strong>Ảnh đại diện</strong><p>JPG/PNG/WebP · tối đa 2 MB · hiển thị dạng tròn</p>{avatarError&&<small className="red-text">{avatarError}</small>}<div className="row-actions"><label className="secondary file-inline">Chọn ảnh<input type="file" accept="image/jpeg,image/png,image/webp" onChange={pickAvatar}/></label><button type="button" className="secondary" onClick={()=>setAvatar("")}>Xóa ảnh</button><button type="button" className="primary" onClick={saveAvatar}>Lưu ảnh</button></div></div></section><form className="account-password-form" onSubmit={changePassword}><h3>Đổi mật khẩu</h3><p>Mật khẩu tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt.</p><label><span>Mật khẩu hiện tại</span><input name="currentPassword" type="password" required autoComplete="current-password"/></label><label><span>Mật khẩu mới</span><input name="newPassword" type="password" minLength={8} pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}" required autoComplete="new-password"/></label><label><span>Xác nhận mật khẩu mới</span><input name="confirmPassword" type="password" minLength={8} required autoComplete="new-password"/></label><button className="primary">Cập nhật mật khẩu</button></form></div></BaseModal>;
}

function ModalFooter({ close, label, disabled }: { close: () => void; label: string; disabled?: boolean }) { return <footer className="modal-footer"><button className="secondary" type="button" onClick={close}>Hủy</button><button className="primary" disabled={disabled}>{label}</button></footer>; }
function AttachmentPanel({ entityType, entityId, canManage=true }: { entityType: string; entityId: string; canManage?: boolean }) {
  const [status, setStatus] = useState(""); const [files, setFiles] = useState<Row[]>([]);
  const loadFiles = useCallback(async () => { const response = await fetch(`/api/files?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`, { cache: "no-store" }); if (response.ok) { const result = await response.json(); setFiles(result.attachments || []); } }, [entityType, entityId]);
  useEffect(() => {
    let active = true;
    fetch(`/api/files?entityType=${encodeURIComponent(entityType)}&entityId=${encodeURIComponent(entityId)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { attachments: [] })
      .then((result) => { if (active) setFiles(result.attachments || []); })
      .catch(() => { if (active) setFiles([]); });
    return () => { active = false; };
  }, [entityType, entityId]);
  async function upload(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const formElement = event.currentTarget; const form = new FormData(formElement); form.set("entityType", entityType); form.set("entityId", entityId); setStatus("Đang tải…"); const response = await fetch("/api/files", { method: "POST", body: form }); const result = await response.json(); setStatus(response.ok ? `Đã lưu ${result.attachment.fileName}` : result.error); if (response.ok) { formElement.reset(); await loadFiles(); } }
  async function removeFile(file:Row){if(!canManage)return;if(!window.confirm(`Xóa tệp ${file.fileName}?`))return;setStatus("Đang xóa…");const response=await fetch(`/api/files?id=${encodeURIComponent(file.id)}`,{method:"DELETE"});const result=await response.json().catch(()=>({error:"Không thể xóa tệp."}));setStatus(response.ok?"Đã xóa tệp.":String(result.error||"Không thể xóa tệp."));if(response.ok)await loadFiles();}
  return <div className="attachment-panel">{canManage?<form className="file-upload" onSubmit={upload}><label className="attachment-pick"><span>Chọn ảnh / hồ sơ</span><input name="file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.doc,.docx" /></label><button className="secondary">↑ TẢI LÊN</button>{status && <span>{status}</span>}</form>:<div className="attachment-readonly-note">Chỉ Chỉ huy trưởng hoặc Nhân viên Phòng Dự án được bổ sung/xóa hồ sơ vật tư đặc thù. Bạn có thể xem và tải xuống.</div>}<div className="attachment-list">{files.map((file) => <div className="attachment-row" key={file.id}><a href={`/api/files?id=${encodeURIComponent(file.id)}`} target="_blank" rel="noreferrer"><span>{String(file.mimeType).startsWith("image/") ? "ẢNH" : "TỆP"}</span><div><strong>{file.fileName}</strong><small>{file.uploadedByName} · {date(file.createdAt)}</small></div><b>↓</b></a>{canManage&&<button type="button" className="attachment-delete" onClick={()=>void removeFile(file)}>Xóa</button>}</div>)}{!files.length && <small>Chưa có ảnh hoặc hồ sơ vật tư đặc thù được tải lên.</small>}</div></div>;
}
const FileUpload = AttachmentPanel;

function exportRequestsXlsx(rows:Row[]) {
  downloadSimpleXlsx({sheetName:"Phieu de nghi",title:"DANH SÁCH PHIẾU ĐỀ NGHỊ MUA HÀNG",headers:["Số phiếu","Dự án","Người tạo","Ngày tạo","Ngày cần","Trạng thái","SLA"],rows:rows.map(row=>[row.requestNo||"",row.projectName||row.projectCode||"",row.requestedBy||"",String(row.requestedAt||""),String(row.neededAt||""),statusLabel(row),row.neededAt?date(row.neededAt):"—"]),widths:[24,32,24,20,20,20,16],freezeRows:2},`Danh_sach_Phieu_de_nghi_${UI_TODAY}`);
}
function deliveredExportRows(rows:Row[]) { return rows.map(row=>[row.poNo||"",row.projectName||row.projectCode||"",row.supplierName||"",row.warehouseName||"",String(row.receivedAt||""),row.bchConfirmedByName||"",String(row.bchConfirmedAt||""),Number(row.acceptedQty||0),row.certificateStatus||"",row.deliveryDocumentStatus||""]); }
function exportDeliveredXlsx(rows:Row[]) { downloadSimpleXlsx({sheetName:"Don da giao",title:"ĐƠN HÀNG ĐÃ GIAO",headers:["PO","Dự án","Nhà cung cấp","Kho nhận","Ngày giao","BCH xác nhận","Thời điểm xác nhận","SL chấp nhận","Chứng chỉ","Giấy giao hàng"],rows:deliveredExportRows(rows),widths:[20,30,32,26,20,24,22,16,18,20],freezeRows:2},`Don_hang_da_giao_${UI_TODAY}`); }
function exportDeliveredCsv(rows:Row[]) { downloadCsv(["PO","Dự án","Nhà cung cấp","Kho nhận","Ngày giao","BCH xác nhận","Thời điểm xác nhận","SL chấp nhận","Chứng chỉ","Giấy giao hàng"],deliveredExportRows(rows),`Don_hang_da_giao_${UI_TODAY}`); }
function inventoryExportRows(rows:Row[]){return rows.map(row=>[row.materialCode||"",row.materialName||"",row.unit||"",row.warehouseCode||row.warehouseName||"",row.locationCode||"",row.projectName||row.projectCode||"",Number(row.receivedQty||0),Number(row.issuedQty||0),Number(row.balance||0),Number(row.minStock||0)]);}
function exportInventoryXlsx(rows:Row[]){downloadSimpleXlsx({sheetName:"Ton kho",title:"TỒN KHO VẬT TƯ",headers:["Mã vật tư","Tên vật tư","ĐVT","Kho","Vị trí","Dự án","Nhập","Xuất","Tồn cuối","Tồn tối thiểu"],rows:inventoryExportRows(rows),widths:[20,42,10,22,14,28,14,14,14,14],freezeRows:2},`Ton_kho_vat_tu_${UI_TODAY}`);}
function paymentExportRows(rows:Row[]){return rows.map(row=>[row.contractNo||row.projectCode||"",row.description||"",row.referenceNo||"",row.paymentDate||"",Number(row.amount||0),row.projectName||row.projectCode||"",row.createdByName||""]);}
function exportPaymentsXlsx(rows:Row[]){downloadSimpleXlsx({sheetName:"Thanh toan HD",title:"SỔ THANH TOÁN HỢP ĐỒNG",headers:["Hợp đồng","Đợt thanh toán","Chứng từ","Ngày","Giá trị (VND)","Dự án","Người nhập"],rows:paymentExportRows(rows),widths:[24,40,22,16,20,30,24],freezeRows:2},`So_thanh_toan_HD_${UI_TODAY}`);}
function exportPaymentsCsv(rows:Row[]){downloadCsv(["Hợp đồng","Đợt thanh toán","Chứng từ","Ngày","Giá trị (VND)","Dự án","Người nhập"],paymentExportRows(rows),`So_thanh_toan_HD_${UI_TODAY}`);}
function canvasJpegBytesForDownload(dataUrl:string){const binary=atob(dataUrl.split(",")[1]||"");const out=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)out[i]=binary.charCodeAt(i);return out;}
function downloadTabularPdf(title:string,headers:string[],rows:(string|number)[][],fileName:string){
  const pageW=1600,pageH=1130,margin=34,headY=112,headerH=54,rowH=44,footer=44;const maxRows=Math.max(1,Math.floor((pageH-headY-headerH-footer)/rowH));const pages=Math.max(1,Math.ceil(Math.max(rows.length,1)/maxRows));const canvases:HTMLCanvasElement[]=[];const escText=(v:unknown)=>String(v??"");
  for(let pi=0;pi<pages;pi++){const c=document.createElement("canvas");c.width=pageW;c.height=pageH;const ctx=c.getContext("2d");if(!ctx)continue;ctx.fillStyle="#fff";ctx.fillRect(0,0,pageW,pageH);ctx.fillStyle="#0b66f6";ctx.fillRect(0,0,pageW,12);ctx.fillStyle="#0d203e";ctx.font='700 30px "Segoe UI",Arial';ctx.textAlign="left";ctx.fillText(title,margin,55);ctx.fillStyle="#687d96";ctx.font='500 14px "Segoe UI",Arial';ctx.fillText(`VNTECH ERP · ${new Intl.DateTimeFormat("vi-VN").format(new Date())}`,margin,82);const usable=pageW-margin*2;const colW=usable/Math.max(headers.length,1);headers.forEach((h,i)=>{const x=margin+i*colW;ctx.fillStyle="#eef5ff";ctx.fillRect(x,headY,colW,headerH);ctx.strokeStyle="#cfdae8";ctx.strokeRect(x,headY,colW,headerH);ctx.fillStyle="#17365f";ctx.font='700 12px "Segoe UI",Arial';ctx.textAlign="left";ctx.fillText(escText(h).slice(0,28),x+7,headY+31);});const start=pi*maxRows;const slice=rows.slice(start,start+maxRows);slice.forEach((row,ri)=>row.forEach((v,ci)=>{const x=margin+ci*colW,y=headY+headerH+ri*rowH;ctx.fillStyle=ri%2?"#fbfdff":"#fff";ctx.fillRect(x,y,colW,rowH);ctx.strokeStyle="#dce5ef";ctx.strokeRect(x,y,colW,rowH);ctx.fillStyle="#243f5f";ctx.font='500 11px "Segoe UI",Arial';ctx.textAlign="left";ctx.fillText(escText(v).slice(0,34),x+7,y+27);}));if(!slice.length){ctx.fillStyle="#687d96";ctx.font='500 18px "Segoe UI",Arial';ctx.textAlign="center";ctx.fillText("Chưa có dữ liệu trong phạm vi đã chọn",pageW/2,pageH/2);}ctx.fillStyle="#718198";ctx.font='500 11px "Segoe UI",Arial';ctx.textAlign="right";ctx.fillText(`Trang ${pi+1}/${pages}`,pageW-margin,pageH-20);canvases.push(c);}
  const images=canvases.map(c=>({bytes:canvasJpegBytesForDownload(c.toDataURL("image/jpeg",.94)),width:c.width,height:c.height}));downloadBlob(new Blob([pdfFromJpegs(images)],{type:"application/pdf"}),`${fileName}.pdf`);
}
function printTabularReport(title:string,headers:string[],rows:(string|number)[][]){
  const popup=window.open("","_blank","width=1280,height=900"); if(!popup){window.alert("Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup cho VNTECH ERP.");return;}
  const esc=(v:unknown)=>String(v??"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]||c));
  popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:"Segoe UI",Arial,sans-serif;color:#10213d;margin:28px}h1{font-size:20px}p{color:#64748b}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #d8e1ec;padding:7px 8px;text-align:left}th{background:#eef5ff;color:#17365f;font-weight:700}@page{size:A4 landscape;margin:10mm}</style></head><body><h1>${esc(title)}</h1><p>VNTECH ERP · Xuất ngày ${esc(new Intl.DateTimeFormat("vi-VN").format(new Date()))}</p><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=()=>{window.print();}</script></body></html>`); popup.document.close();
}
function downloadDeliveredPdf(rows:Row[]){downloadTabularPdf("ĐƠN HÀNG ĐÃ GIAO",["PO","Dự án","Nhà cung cấp","Kho nhận","Ngày giao","BCH xác nhận","Thời điểm xác nhận","SL chấp nhận","Chứng chỉ","Giấy giao hàng"],deliveredExportRows(rows),`Don_hang_da_giao_${UI_TODAY}`);}
function downloadPaymentsPdf(rows:Row[]){downloadTabularPdf("SỔ THANH TOÁN HỢP ĐỒNG",["Hợp đồng","Đợt thanh toán","Chứng từ","Ngày","Giá trị (VND)","Dự án","Người nhập"],paymentExportRows(rows),`So_thanh_toan_HD_${UI_TODAY}`);}
const CODE39:Record<string,string>={"0":"nnnwwnwnn","1":"wnnwnnnnw","2":"nnwwnnnnw","3":"wnwwnnnnn","4":"nnnwwnnnw","5":"wnnwwnnnn","6":"nnwwwnnnn","7":"nnnwnnwnw","8":"wnnwnnwnn","9":"nnwwnnwnn","A":"wnnnnwnnw","B":"nnwnnwnnw","C":"wnwnnwnnn","D":"nnnnwwnnw","E":"wnnnwwnnn","F":"nnwnwwnnn","G":"nnnnnwwnw","H":"wnnnnwwnn","I":"nnwnnwwnn","J":"nnnnwwwnn","K":"wnnnnnnww","L":"nnwnnnnww","M":"wnwnnnnwn","N":"nnnnwnnww","O":"wnnnwnnwn","P":"nnwnwnnwn","Q":"nnnnnnwww","R":"wnnnnnwwn","S":"nnwnnnwwn","T":"nnnnwnwwn","U":"wwnnnnnnw","V":"nwwnnnnnw","W":"wwwnnnnnn","X":"nwnnwnnnw","Y":"wwnnwnnnn","Z":"nwwnwnnnn","-":"nwnnnnwnw",".":"wwnnnnwnn"," ":"nwwnnnwnn","*":"nwnnwnwnn"};
function code39Svg(value:string){const text=`*${String(value||"").toUpperCase().replace(/[^0-9A-Z. \-]/g,"-")}*`;let x=0;const unit=2;let bars="";for(const ch of text){const pattern=CODE39[ch]||CODE39["-"];for(let i=0;i<pattern.length;i++){const w=(pattern[i]==="w"?3:1)*unit;if(i%2===0)bars+=`<rect x="${x}" y="0" width="${w}" height="48"/>`;x+=w;}x+=unit;}return `<svg viewBox="0 0 ${x} 62" width="260" height="62" xmlns="http://www.w3.org/2000/svg"><g fill="#111">${bars}</g><text x="${x/2}" y="60" font-family="Segoe UI,Arial" font-size="9" text-anchor="middle">${text.slice(1,-1)}</text></svg>`;}
function printInventoryBarcodes(rows:Row[]){const sample=rows.filter(row=>row.materialCode).slice(0,80);if(!sample.length)return;const popup=window.open("","_blank","width=1000,height=800");if(!popup){window.alert("Trình duyệt đang chặn cửa sổ in.");return;}popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Tem mã vật tư</title><style>body{font-family:"Segoe UI",Arial;margin:12px}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.label{border:1px solid #cbd5e1;padding:8px;text-align:center;break-inside:avoid}.label b{display:block;font-size:11px}.label small{display:block;height:28px;overflow:hidden}@page{size:A4;margin:8mm}</style></head><body><div class="grid">${sample.map(row=>`<div class="label"><b>${String(row.materialCode)}</b><small>${String(row.materialName||"")}</small>${code39Svg(String(row.materialCode))}</div>`).join("")}</div><script>window.onload=()=>window.print()</script></body></html>`);popup.document.close();}
function printInventoryLedger(rows:Row[]){printTabularReport("THẺ KHO / TỒN KHO",["Mã vật tư","Tên vật tư","ĐVT","Kho","Vị trí","Dự án","Nhập","Xuất","Tồn cuối","Tồn tối thiểu"],inventoryExportRows(rows));}

function exportCsv(rows: Row[]) { const safeRows = rows.map((row) => ({ Ma: row.requestNo || row.poNo || row.receiptNo || row.id, Du_an: row.projectCode || "", Trang_thai: statusLabel(row), Ngay: row.requestedAt || row.orderedAt || row.receivedAt || "", Gia_tri: row.totalEstimatedValue || row.totalValue || 0 })); const headers=["Mã","Dự án","Trạng thái","Ngày","Giá trị"]; downloadCsv(headers,safeRows.map((r)=>[r.Ma,r.Du_an,r.Trang_thai,r.Ngay,r.Gia_tri]),`MEP_Kho_${new Date().toISOString().slice(0,10)}`); }
function reportExport(rows: Row[], baseName: string) {
  const sheetName=String(baseName||"Bao_cao").replace(/[\\/:*?\[\]]/g,"-").slice(0,31)||"Bao_cao";
  downloadSimpleXlsx({sheetName,headers:rows[0]?.__headers||[],rows:(rows as unknown as {__rows?:TableCell[][]})?.__rows||[]},`${baseName}_${new Date().toISOString().slice(0,10)}`);
  const headers=rows[0]?.__headers||[]; const body=(rows as unknown as {__rows?:TableCell[][]})?.__rows||[];
  downloadCsv(headers,body,`${baseName}_${new Date().toISOString().slice(0,10)}`);
}
function reportRows(headers:string[], rows:string[][], name:string){const result:Row[]=rows.map((cells)=>Object.fromEntries(headers.map((h,i)=>[h,cells[i]??""])));const meta:unknown={__headers:headers,__rows:rows};return Object.assign(result,meta);}
function printReport(name:string,headers:string[],rows:string[][]){printTabularReport(name,headers,rows);}
function reportPdf(rows: Row[], baseName: string, title?: string){const headers=(rows[0]?.__headers||[]) as string[];const body=(rows as unknown as {__rows?:string[][]})?.__rows||[];downloadTabularPdf(title||baseName.replace(/_/g," ").toUpperCase(),headers,body,`${baseName}_${new Date().toISOString().slice(0,10)}`);}

function TransferModal({ data, close, submit }: { data: AppData; close: () => void; submit: (name:string,payload:Row)=>Promise<boolean> }) {
  const sourceOptions=data.warehouses.filter((row)=>row.type!=="transit"); const destinationOptions=(data.transferWarehouses||data.warehouses).filter((row)=>row.type!=="transit"); const [source,setSource]=useState(String(sourceOptions[0]?.id||"")); const [dest,setDest]=useState(""); const [materialId,setMaterialId]=useState(""); const [qty,setQty]=useState(0); const available=data.companyAvailability.filter((r)=>String(r.warehouseId)===source&&Number(r.available)>0); const activeTransfers=data.transferOrders.filter((r)=>!["received","cancelled"].includes(String(r.status)));
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!source||!dest||source===dest||!materialId||qty<=0)return; if(await submit("create_transfer_order",{sourceWarehouseId:source,destinationWarehouseId:dest,reason:"Điều chuyển nội bộ",lines:[{materialId,quantity:qty}]}))close();}
  return <BaseModal title="Tạo phiếu điều chuyển" note="Hàng xuất khỏi nguồn sẽ chuyển vào Transit; chỉ tăng tồn kho đích sau khi kho đích xác nhận nhận." close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Kho nguồn *</span><select value={source} onChange={e=>{setSource(e.target.value);setMaterialId("");}} required><option value="">Chọn kho nguồn</option>{sourceOptions.map(r=><option key={r.id} value={r.id}>{r.code} · {r.name}</option>)}</select></label><label><span>Kho đích *</span><select value={dest} onChange={e=>setDest(e.target.value)} required><option value="">Chọn kho đích</option>{destinationOptions.filter(r=>String(r.id)!==source).map(r=><option key={r.id} value={r.id}>{r.code} · {r.name}</option>)}</select></label><label><span>Vật tư *</span><select value={materialId} onChange={e=>setMaterialId(e.target.value)} required><option value="">Chọn vật tư có tồn khả dụng</option>{available.map(r=><option key={`${r.warehouseId}-${r.materialId}`} value={r.materialId}>{r.materialCode} · {r.materialName} · khả dụng {format.format(r.available)}</option>)}</select></label><label><span>Số lượng *</span><input type="number" min="0.000001" step="any" value={qty||""} onChange={e=>setQty(Number(e.target.value))} required/></label></div><label className="full"><span>Ghi chú</span><textarea name="note"/></label>{activeTransfers.length>0&&<div className="inline-alert"><b>Đang xử lý:</b> {activeTransfers.length} phiếu điều chuyển chưa hoàn tất.</div>}</div><ModalFooter close={close} label="Tạo phiếu điều chuyển →" disabled={!source||!dest||source===dest||!materialId||qty<=0}/></form></BaseModal>;
}

function CentralReturnModal({ data, close, submit }: { data: AppData; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  const [projectId,setProjectId]=useState(data.projects[0]?.id||""); const warehouses=data.warehouses.filter((row)=>row.projectId===projectId&&row.type==="site"); const [warehouseId,setWarehouseId]=useState(warehouses[0]?.id||""); const balances=data.inventory.filter((row)=>row.projectId===projectId&&row.warehouseId===warehouseId&&Number(row.balance)>0);
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);const lines=balances.map((row)=>({materialId:row.materialId,quantity:Number(form.get(`qty-${row.materialId}`)||0),conditionStatus:form.get(`condition-${row.materialId}`),unitCost:Number(form.get(`cost-${row.materialId}`)||0)})).filter((row)=>row.quantity>0);if(await submit("create_central_return",{projectId,sourceWarehouseId:warehouseId,note:form.get("note"),lines}))close();}
  return <BaseModal title="Đề nghị chuyển vật tư dư về Kho Tổng" note="Tồn Kho Tổng chỉ tăng sau khi kiểm đếm và chấp nhận" close={close}><form onSubmit={send}><div className="modal-body"><div className="form-grid"><label><span>Dự án nguồn *</span><select value={projectId} onChange={(event)=>{setProjectId(event.target.value);setWarehouseId(data.warehouses.find((row)=>row.projectId===event.target.value&&row.type==="site")?.id||"");}}>{data.projects.map((row)=><option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}</select></label><label><span>Kho nguồn *</span><select value={warehouseId} onChange={(event)=>setWarehouseId(event.target.value)}>{warehouses.map((row)=><option key={row.id} value={row.id}>{row.code} · {row.name}</option>)}</select></label></div><div className="line-editor"><div className="count-head"><span>Vật tư / tồn</span><span>Số lượng trả</span><span>Tình trạng</span><span>Đơn giá nguồn</span></div>{balances.map((row)=><div className="count-line" key={row.materialId}><div><strong>{row.materialCode}</strong><small>{row.materialName} · Tồn {format.format(row.balance)} {row.unit}</small></div><input name={`qty-${row.materialId}`} type="number" min="0" max={row.balance} step="0.001" defaultValue="0"/><select name={`condition-${row.materialId}`}><option value="new">Mới/chưa dùng</option><option value="usable">Đã dùng còn tốt</option><option value="repairable">Cần sửa/kiểm tra</option><option value="damaged">Hỏng</option></select><input name={`cost-${row.materialId}`} type="number" min="0" step="any" defaultValue="0"/></div>)}{!balances.length&&<Empty text="Kho nguồn không có tồn để chuyển."/>}</div><label className="full"><span>Ghi chú / nguồn gốc</span><textarea name="note"/></label></div><ModalFooter close={close} label="Lập phiếu chờ duyệt →" disabled={!balances.length}/></form></BaseModal>;
}

function CentralReceiveModal({ row, close, submit }: { row: Row; close: () => void; submit: (name: string, payload: Row) => Promise<boolean> }) {
  async function send(event:FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);const lines=(row.items||[]).map((item:Row)=>({centralReturnItemId:item.id,countedQty:Number(form.get(`counted-${item.id}`)||0),acceptedQty:Number(form.get(`accepted-${item.id}`)||0),conditionStatus:form.get(`condition-${item.id}`),unitCost:Number(item.unitCost||0),rejectionReason:form.get(`reason-${item.id}`)}));if(await submit("receive_central_return",{centralReturnId:row.id,lines}))close();}
  return <BaseModal title={`Kiểm đếm Kho Tổng · ${row.returnNo}`} note="Phải tải ảnh trước; số bị từ chối vẫn thuộc kho dự án" close={close}><form onSubmit={send}><div className="modal-body"><div className="line-editor"><div className="delivery-head"><span>Vật tư / đề nghị</span><span>Thực đếm</span><span>Chấp nhận</span><span>Tình trạng / lý do</span></div>{(row.items||[]).map((item:Row)=><div className="delivery-line" key={item.id}><div><strong>{item.materialCode}</strong><small>{item.materialName} · Đề nghị {format.format(item.proposedQty)} {item.unit}</small></div><input name={`counted-${item.id}`} type="number" min="0" max={item.proposedQty} step="0.001" defaultValue={item.proposedQty}/><input name={`accepted-${item.id}`} type="number" min="0" max={item.proposedQty} step="0.001" defaultValue={item.proposedQty}/><div><select name={`condition-${item.id}`}><option value="new">Mới</option><option value="usable">Còn tốt</option><option value="repairable">Cần sửa</option><option value="damaged">Hỏng</option></select><input name={`reason-${item.id}`} placeholder="Lý do phần từ chối"/></div></div>)}</div></div><ModalFooter close={close} label="Xác nhận nhập Kho Tổng →"/></form></BaseModal>;
}
