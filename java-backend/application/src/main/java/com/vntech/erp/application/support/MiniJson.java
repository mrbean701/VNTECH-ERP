package com.vntech.erp.application.support;

import java.util.Map;

/**
 * TASK-046/047 — tương đương `JSON.stringify(value)` của JS, dùng cho `before_json`/`after_json` của
 * `audit_logs`. Cố ý viết tay trong tầng application (không kéo Jackson vào use-case) và **escape đúng**:
 * `before_json` chứa nguyên dòng dữ liệu nghiệp vụ (tiếng Việt, dấu ngoặc, xuống dòng).
 */
public final class MiniJson {

    private MiniJson() { }

    public static String stringify(Object value) {
        if (value == null) return "null";
        if (value instanceof Map<?, ?> map) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> e : map.entrySet()) {
                if (!first) sb.append(',');
                first = false;
                sb.append(stringify(String.valueOf(e.getKey()))).append(':').append(stringify(e.getValue()));
            }
            return sb.append('}').toString();
        }
        if (value instanceof Iterable<?> it) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object o : it) { if (!first) sb.append(','); first = false; sb.append(stringify(o)); }
            return sb.append(']').toString();
        }
        if (value instanceof Boolean) return value.toString();
        if (value instanceof Number n) {
            if (n instanceof Double d && (d.isNaN() || d.isInfinite())) return "null";
            return n.toString();
        }
        String s = String.valueOf(value);
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c)); else sb.append(c);
                }
            }
        }
        return sb.append('"').toString();
    }
}
