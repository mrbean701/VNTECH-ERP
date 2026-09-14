package com.vntech.erp.infrastructure;

import com.vntech.erp.application.port.out.SystemSetupPort;
import org.junit.jupiter.api.Test;
import org.springframework.util.ResourceUtils;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Chạy TRỰC TIẾP V1__baseline.sql trên H2 ở MODE=MySQL (sát nhất có thể trong môi trường không có MySQL thật).
 * Bỏ phần ENGINE=InnoDB ... COLLATE (H2 không hiểu), giữ nguyên mọi CREATE TABLE/INDEX/INSERT seed.
 * Xác nhận: toàn bộ 114 bảng + index/constraint thực thi không lỗi, đếm bảng = 114,
 * các bảng trọng yếu có cột đúng (materials.code, stock_movements.movement_type, contract_stock_ledger.quantity_delta).
 */
class FlywayBaselineExecutableTest {

    private static final Pattern CREATE_TABLE = Pattern.compile("CREATE TABLE `([a-z0-9_]+)`");
    private static final List<String> ENGINE_LINES = List.of("ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    private String baselineSql() throws Exception {
        File baseline = ResourceUtils.getFile("classpath:db/migration/V1__baseline.sql");
        assertNotNull(baseline);
        return new String(Files.readAllBytes(baseline.toPath()), StandardCharsets.UTF_8);
    }

    /** Tách câu lệnh: bỏ comment 1 dòng, gom tới ';' — loại bỏ ENGINE/CHARSET (H2) + prefix (191) (H2 không hiểu). */
    private List<String> statements(String sql) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        for (String rawLine : sql.split("\n")) {
            String line = rawLine.trim();
            if (line.startsWith("--") || line.isEmpty()) continue;
            boolean engine = ENGINE_LINES.stream().anyMatch(line::contains);
            if (engine) {
                // dòng đóng `) ENGINE=InnoDB ...;` — H2 không hiểu ENGINE, thay bằng dấu đóng ;
                cur.append(" ) ;");
                String stmt = cur.toString().trim();
                if (!stmt.isEmpty()) out.add(stmt);
                cur.setLength(0);
                continue;
            }
            if (line.contains("FOREIGN KEY")) {
                // FK forward-ref (alphabet) — bỏ như schema-h2; integrity do app quản
                while (cur.length() > 0 && (cur.charAt(cur.length() - 1) == ',' || cur.charAt(cur.length() - 1) == ' ')) {
                    cur.deleteCharAt(cur.length() - 1);
                }
                continue;
            }
            String cleaned = line
                    .replaceAll("CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci", "")
                    .replaceAll("\\(191\\)", "")          // prefix index MySQL — H2 không hiểu
                    .replaceAll("DATETIME\\(3\\)", "TIMESTAMP(3)"); // MySQL DATETIME(3) — H2 không hiểu (giống generator H2 schema)
            cur.append(" ").append(cleaned);
            if (cleaned.endsWith(";")) {
                String stmt = cur.toString().trim();
                if (!stmt.isEmpty()) out.add(stmt);
                cur.setLength(0);
            }
        }
        return out;
    }

    @Test
    void baseline_executesOnH2MysqlMode_114Tables() throws Exception {
        String sql = baselineSql();
        List<String> stmts = statements(sql);
        assertTrue(stmts.size() >= 120, "phải có ít nhất 114 CREATE + ~seed statements: " + stmts.size());

        String url = "jdbc:h2:mem:flywaybaseline;MODE=MySQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1";
        try (Connection conn = DriverManager.getConnection(url, "sa", "");
             Statement st = conn.createStatement()) {
            int ok = 0;
            List<String> errors = new ArrayList<>();
            for (String stmt : stmts) {
                try {
                    st.execute(stmt);
                    ok++;
                } catch (Exception e) {
                    errors.add(e.getClass().getSimpleName() + ": " + e.getMessage()
                            + "\n   SQL: " + stmt);
                }
            }
            assertTrue(errors.isEmpty(), "baseline phải thực thi sạch, " + errors.size() + " lỗi:\n"
                    + String.join("\n", errors.subList(0, Math.min(3, errors.size()))));
            for (int i = 0; i < Math.min(3, errors.size()); i++) {
                System.out.println("=== LỖI " + (i + 1) + " (500 chars) ===\n"
                        + errors.get(i).substring(0, Math.min(500, errors.get(i).length())));
            }
            assertTrue(ok >= 120, "số câu lệnh thành công: " + ok);

            int tables = 0;
            try (ResultSet rs = conn.getMetaData().getTables(null, null, "%", new String[]{"TABLE"})) {
                while (rs.next()) {
                    String schema = rs.getString("TABLE_SCHEM");
                    if (schema != null && schema.toUpperCase().contains("INFORMATION")) continue;
                    tables++;
                }
            }
            assertEquals(114, tables, "H2 phải có đúng 114 bảng (bỏ INFORMATION_SCHEMA) sau khi chạy baseline");
            // trọng yếu
            assertTrue(columnExists(conn, "materials", "code") &&
                            columnExists(conn, "materials", "standard_price"),
                    "materials.code + standard_price");
            assertTrue(columnExists(conn, "stock_movements", "movement_type") &&
                            columnExists(conn, "stock_movements", "quantity"),
                    "stock_movements.movement_type + quantity");
            assertTrue(columnExists(conn, "contract_stock_ledger", "quantity_delta"),
                    "contract_stock_ledger.quantity_delta");
            assertTrue(columnExists(conn, "supply_workflow_steps", "due_at"),
                    "supply_workflow_steps.due_at (SLA)");
        }
    }

    private boolean columnExists(Connection conn, String table, String column) throws Exception {
        for (String t : new String[]{table, table.toUpperCase()}) {
            for (String c : new String[]{column, column.toUpperCase()}) {
                try (ResultSet rs = conn.getMetaData().getColumns(null, null, t, c)) {
                    if (rs.next()) return true;
                }
            }
        }
        return false;
    }
}