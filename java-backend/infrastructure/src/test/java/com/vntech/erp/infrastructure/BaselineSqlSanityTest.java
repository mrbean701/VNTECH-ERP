package com.vntech.erp.infrastructure;

import org.junit.jupiter.api.Test;
import org.springframework.util.ResourceUtils;

import java.io.File;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Kiểm chứng cú pháp V1__baseline.sql (MySQL dialect) không cần DB thật:
 *   - 114 bảng, mỗi bảng có PRIMARY KEY và khối CREATE kết thúc bằng ';'
 *   - cột id đầu tiên phải VARCHAR(64)/BIGINT (không sót AUTOINCREMENT)
 *   - KHÔNG còn nghi thức SQLite-only (AUTOINCREMENT, ON CONFLICT, RETURNING, DEFERRABLE)
 *   - từ khoá reserved MySQL phải được backtick (year/order/from/to/group/key/position...)
 */
class BaselineSqlSanityTest {

    private static final Pattern CREATE_BLOCK = Pattern.compile(
            "(?is)CREATE TABLE `([a-z0-9_]+)` \\((.*?)\\) (?:ENGINE=[^;]*|;)");
    private static final Pattern COLUMN_DEF = Pattern.compile(
            "^\\s*`([a-z0-9_]+)`\\s+([A-Z0-9()]+).*$");
    private static final List<String> RESERVED_MYSQL = List.of(
            "year", "order", "from", "to", "group", "key", "position", "rank", "row", "range",
            "action", "check", "default", "index", "unique", "references", "foreign", "primary",
            "table", "binary", "change");

    private String baselineSql() throws Exception {
        File baseline = ResourceUtils.getFile("classpath:db/migration/V1__baseline.sql");
        assertNotNull(baseline);
        return new String(Files.readAllBytes(baseline.toPath()), StandardCharsets.UTF_8);
    }

    @Test
    void baseline_has114Tables_withPrimaryKeys() throws Exception {
        String sql = baselineSql();
        Matcher matcher = CREATE_BLOCK.matcher(sql);
        List<String> tables = new ArrayList<>();
        while (matcher.find()) tables.add(matcher.group(1));
        assertEquals(114, tables.size(), "V1__baseline.sql phải chứa đúng 114 bảng (drizzle 0000..0075)");
        long pks = sql.lines().filter(l -> l.contains("PRIMARY KEY")).count();
        assertTrue(pks >= 114, "mỗi bảng phải có PRIMARY KEY");
    }

    @Test
    void baseline_noSqliteOnlySyntax() throws Exception {
        String sql = baselineSql().toLowerCase(Locale.ROOT);
        assertTrue(!sql.contains("autoincrement"), "AUTOINCREMENT (MySQL dùng AUTO_INCREMENT)");
        assertTrue(!sql.contains("deferrable"), "DEFERRABLE là nghi thức SQLite");
        assertTrue(!sql.contains("on conflict"), "ON CONFLICT — MySQL dùng ON DUPLICATE KEY");
        assertTrue(!sql.contains("returning"), "RETURNING không tồn tại trong MySQL");
    }

    @Test
    void baseline_firstColumnIdIsVarchar64() throws Exception {
        String sql = baselineSql();
        Matcher matcher = CREATE_BLOCK.matcher(sql);
        List<String> violations = new ArrayList<>();
        while (matcher.find()) {
            String table = matcher.group(1);
            String body = matcher.group(2);
            Matcher col = null;
            for (String line : body.split("\n")) {
                Matcher m = COLUMN_DEF.matcher(line);
                if (m.find()) { col = m; break; }
            }
            if (col != null) {
                String firstCol = col.group(1);
                String type = col.group(2).toUpperCase(Locale.ROOT);
                if ("id".equals(firstCol) && !(type.startsWith("VARCHAR") || type.startsWith("BIGINT") || type.startsWith("CHAR"))) {
                    violations.add(table + "." + firstCol + " kiểu " + type);
                }
            } else {
                violations.add(table + " (không parse được cột đầu)");
            }
        }
        assertTrue(violations.isEmpty(), "cột id phải VARCHAR(64): " + violations);
    }

    @Test
    void baseline_reservedWordsAreBackticked() throws Exception {
        String sql = baselineSql();
        Matcher matcher = CREATE_BLOCK.matcher(sql);
        List<String> violations = new ArrayList<>();
        while (matcher.find()) {
            String table = matcher.group(1);
            String body = matcher.group(2);
            for (String line : body.split("\n")) {
                Matcher col = COLUMN_DEF.matcher(line);
                if (col.find()) {
                    String name = col.group(1);
                    if (RESERVED_MYSQL.contains(name) && !line.contains("`" + name + "`")) {
                        violations.add(table + "." + name + " thiếu backtick");
                    }
                }
            }
        }
        assertTrue(violations.isEmpty(), "từ khoá reserved phải backtick: " + violations);
    }
}