package com.vntech.erp.application.service;

import java.util.Collection;
import java.util.Map;

/**
 * Bộ ghi JSON tối giản, không phụ thuộc thư viện — dùng cho archive dự án offline.
 *
 * <p>Module {@code application} cố tình không kéo Jackson để giữ Clean Architecture thuần.
 * Định dạng khớp {@code JSON.stringify(value, null, 2)} của JS: object theo thứ tự chèn,
 * mảng giữ nguyên thứ tự, chuỗi escape đầy đủ, số không thêm đuôi.
 */
final class JsonWriter {

    private JsonWriter() {}

    static String write(Object value) {
        StringBuilder sb = new StringBuilder(4096);
        writeValue(sb, value, 0, true);
        return sb.toString();
    }

    private static void writeValue(StringBuilder sb, Object value, int indent, boolean pretty) {
        if (value == null) {
            sb.append("null");
        } else if (value instanceof String s) {
            writeString(sb, s);
        } else if (value instanceof Boolean || value instanceof Number) {
            sb.append(String.valueOf(value));
        } else if (value instanceof Map<?, ?> map) {
            writeObject(sb, map, indent, pretty);
        } else if (value instanceof Collection<?> list) {
            writeArray(sb, list, indent, pretty);
        } else if (value instanceof byte[] bytes) {
            // byte[] trong JDBC không nên lọt vào JSON; mã hoá base64 để không vỡ archive.
            writeString(sb, java.util.Base64.getEncoder().encodeToString(bytes));
        } else {
            writeString(sb, String.valueOf(value));
        }
    }

    private static void writeObject(StringBuilder sb, Map<?, ?> map, int indent, boolean pretty) {
        if (map.isEmpty()) {
            sb.append("{}");
            return;
        }
        sb.append('{');
        boolean first = true;
        for (Map.Entry<?, ?> entry : map.entrySet()) {
            if (!first) sb.append(',');
            first = false;
            newline(sb, indent + 1, pretty);
            writeString(sb, String.valueOf(entry.getKey()));
            sb.append(':');
            if (pretty) sb.append(' ');
            writeValue(sb, entry.getValue(), indent + 1, pretty);
        }
        newline(sb, indent, pretty);
        sb.append('}');
    }

    private static void writeArray(StringBuilder sb, Collection<?> list, int indent, boolean pretty) {
        if (list.isEmpty()) {
            sb.append("[]");
            return;
        }
        sb.append('[');
        boolean first = true;
        for (Object item : list) {
            if (!first) sb.append(',');
            first = false;
            newline(sb, indent + 1, pretty);
            writeValue(sb, item, indent + 1, pretty);
        }
        newline(sb, indent, pretty);
        sb.append(']');
    }

    private static void newline(StringBuilder sb, int indent, boolean pretty) {
        if (!pretty) return;
        sb.append('\n');
        sb.append("  ".repeat(indent));
    }

    private static void writeString(StringBuilder sb, String value) {
        sb.append('"');
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                default -> {
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
                }
            }
        }
        sb.append('"');
    }
}
