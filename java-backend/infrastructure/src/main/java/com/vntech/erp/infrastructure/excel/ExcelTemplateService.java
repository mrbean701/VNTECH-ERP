package com.vntech.erp.infrastructure.excel;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;

/**
 * ExcelTemplateService — sinh file .xlsx template cho các luồng import (Apache POI).
 * Kinds: boq (4 modes), material_catalog, projects, users, payments.
 * Cột khớp chính xác với parser JS của từng import action.
 */
@Component
public class ExcelTemplateService {

    public record TemplateFile(String filename, byte[] content) {
    }

    public TemplateFile generate(String kind) throws IOException {
        switch (kind == null ? "" : kind) {
            case "boq": return build("template_boq.xlsx", "BOQ",
                    List.of("sourceOrder", "contractLineRef", "boqCode", "contractCode", "contractMaterialCode",
                            "approvedMaterialCode", "materialName", "unit", "contractQty", "remeasuredQty",
                            "unitPrice", "itemType", "systemCode", "subgroupName", "internalMaterialCode",
                            "materialId", "rowRole", "note"),
                    List.of("Số thứ tự file", "Ref dòng HĐ", "Mã BOQ", "Mã HĐ", "Mã vật tư HĐ", "Mã vật tư được duyệt",
                            "Tên vật tư/tiêu đề", "Đơn vị", "KL hợp đồng", "KL bóc lại", "Đơn giá HĐ", "Loại dòng (contract/outside_contract)",
                            "Hệ thống (DIEN/CTN/HVAC/DNHE/PCCC/KHAC)", "Phân nhóm nguồn", "Mã vật tư gốc", "Mã vật tư gốc (id)", "Vai trò dòng", "Ghi chú"));
            case "material_catalog": return build("template_material_catalog.xlsx", "Material",
                    List.of("code", "name", "specification", "brand", "unit", "system", "categoryId", "subcategoryId",
                            "standardPrice", "requiresMar", "isComponent"),
                    List.of("Mã vật tư (*)", "Tên vật tư (*)", "Quy cách", "Hãng", "Đơn vị", "Hệ thống", "Mã nhóm", "Mã nhóm con",
                            "Đơn giá chuẩn", "Cần MAR (1/0)", "Là linh kiện (1/0)"));
            case "projects": return build("template_projects.xlsx", "Projects",
                    List.of("code", "name", "startDate", "plannedEndDate", "status", "warehouseCode", "warehouseName",
                            "contractNo", "contractName"),
                    List.of("Mã dự án (*)", "Tên dự án (*)", "Ngày bắt đầu (DD/MM/YYYY)", "Dự kiến kết thúc (DD/MM/YYYY)",
                            "Trạng thái (ACTIVE/INACTIVE/ARCHIVED)", "Mã kho", "Tên kho", "Số HĐ", "Tên HĐ"));
            case "users": return build("template_users.xlsx", "Users",
                    List.of("email", "username", "fullName", "role", "department", "active"),
                    List.of("Email (*)", "Tên đăng nhập", "Họ tên (*)", "Vai trò", "Phòng ban", "Hoạt động (1/0)"));
            case "payments": return build("template_payments.xlsx", "Payments",
                    List.of("paymentDate", "referenceNo", "description", "amount", "note"),
                    List.of("Ngày thanh toán (* YYYY-MM-DD)", "Số tham chiếu", "Nội dung (*)", "Giá trị (*)", "Ghi chú"));
            default:
                throw new IllegalArgumentException("Loại template không hợp lệ: " + kind);
        }
    }

    private TemplateFile build(String filename, String sheetName, List<String> keys, List<String> headers)
            throws IOException {
        try (Workbook wb = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = wb.createSheet(sheetName);
            CellStyle headerStyle = wb.createCellStyle();
            headerStyle.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            Row header = sheet.createRow(0);
            for (int i = 0; i < headers.size(); i++) {
                var cell = header.createCell(i);
                cell.setCellValue((i < keys.size() ? keys.get(i) + " — " : "") + headers.get(i));
                cell.setCellStyle(headerStyle);
                sheet.setColumnWidth(i, 32 * 256);
            }
            Row sample = sheet.createRow(1);
            if (sample.getSheet().getSheetName().equals("BOQ")) {
                sample.createCell(0).setCellValue(1);
                sample.createCell(1).setCellValue("1.1");
                sample.createCell(6).setCellValue("Ví dụ tên vật tư");
                sample.createCell(8).setCellValue(100);
                sample.createCell(9).setCellValue(100);
                sample.createCell(10).setCellValue(0);
            }
            wb.write(out);
            return new TemplateFile(filename, out.toByteArray());
        }
    }
}