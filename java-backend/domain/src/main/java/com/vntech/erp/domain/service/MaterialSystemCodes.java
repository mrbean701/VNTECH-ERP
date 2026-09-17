package com.vntech.erp.domain.service;

import java.text.Normalizer;
import java.util.List;

/**
 * Mã hệ M&amp;E dùng chung — port nguyên trạng từ JS {@code scripts/system-route.mjs:44-54} và {@code :76}.
 *
 * <p><b>VÌ SAO TÁCH RA ĐÂY (TASK-040 nhóm 3b):</b> {@code canonicalMeCode} đã tồn tại trong
 * {@code BoqManagementUseCase} nhưng <b>KHÁC JS</b>: JS khớp theo <b>TIỀN TỐ</b> ({@code raw.startsWith("DIEN")}),
 * bản cũ chỉ so <b>ĐÚNG BẰNG</b> ({@code List.contains}). Đo được <b>7/28 đầu vào lệch</b>
 * ({@code tools/probe-canonical-me-code-drift.mjs}) — ví dụ {@code Điện lực}, {@code DIEN123}, {@code ELV-1},
 * {@code PCCC-01} đều bị xếp vào {@code KHAC} thay vì đúng hệ M&amp;E. Sai ở đây làm vật tư nhập vào mang
 * {@code system} sai.
 *
 * <p>Đặt ở tầng domain để <b>một nguồn sự thật duy nhất</b> (GOAL §5): nhập BOQ và nhập danh mục vật tư
 * phải cho cùng kết quả.
 */
public final class MaterialSystemCodes {

    private MaterialSystemCodes() {
    }

    /**
     * Port nguyên trạng JS {@code canonicalMeCode} (system-route.mjs:44-54), <b>kể cả các nhánh
     * {@code startsWith}</b>.
     */
    public static String canonicalMeCode(String value) {
        // ⚠ `(?i)đ` KHÔNG dùng được: cờ `(?i)` của Java chỉ case-fold ASCII (trừ khi bật UNICODE_CASE),
        // nên `Đ` (U+0110) sẽ KHÔNG khớp `đ` (U+0111) ⇒ "Điện lực" rơi về KHAC. Phải thay cả hai ký tự.
        // (Đã bị chính unit test bắt: MaterialSystemCodesTest.canonicalMeCode_khopDungBang.)
        String raw = Normalizer.normalize(clean(value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace("đ", "d").replace("Đ", "D")
                .toUpperCase(java.util.Locale.ROOT)
                .replaceAll("[^A-Z0-9]+", "");
        if (raw.isEmpty()) return "KHAC";
        if (contains(List.of("ELV", "DNHE", "DIENNHE"), raw)
                || raw.startsWith("DNHE") || raw.startsWith("ELV") || raw.startsWith("DIENNHE")) return "DNHE";
        if (contains(List.of("DIEN", "ELECTRICAL"), raw) || raw.startsWith("DIEN")) return "DIEN";
        if (contains(List.of("CTN", "NUOC", "CAPTHOATNUOC", "PLUMBING"), raw) || raw.startsWith("CTN")) return "CTN";
        if (contains(List.of("HVAC", "DIEUHOATHONGGIO"), raw) || raw.startsWith("HVAC")) return "HVAC";
        if (contains(List.of("PCCC", "FIRE"), raw) || raw.startsWith("PCCC")) return "PCCC";
        if (raw.equals("KHAC") || raw.equals("OTHER")) return "KHAC";
        return "KHAC";
    }

    /**
     * Port nguyên trạng JS {@code internalGroupCode} (system-route.mjs:76): chuẩn hoá tên nhóm thành mã nội bộ,
     * tối đa 48 ký tự, rỗng thì trả {@code CHUA_PHAN_NHOM}.
     */
    public static String internalGroupCode(String value) {
        String base = normalizeMaterialName(value)
                .replaceAll("\\s+", "_")
                .toUpperCase(java.util.Locale.ROOT)
                .replaceAll("[^A-Z0-9_]+", "");
        if (base.length() > 48) base = base.substring(0, 48);
        return base.isEmpty() ? "CHUA_PHAN_NHOM" : base;
    }

    /**
     * Port nguyên trạng JS {@code normalizeMaterialName} (system-route.mjs:75) — khác
     * {@link MaterialMatcherV2#normalizeMaterialText} ở chỗ JS còn gộp {@code phi|dn|d|ø + số} thành {@code d<số>}
     * và thay mọi ký tự không phải chữ-số bằng khoảng trắng.
     */
    public static String normalizeMaterialName(String value) {
        return Normalizer.normalize(clean(value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace("đ", "d").replace("Đ", "D")
                .toLowerCase(java.util.Locale.ROOT)
                .replaceAll("\\b(phi|dn|d|ø)\\s*(\\d+)", "d$2")
                .replaceAll("[^a-z0-9]+", " ")
                .trim();
    }

    private static String clean(String v) {
        return v == null ? "" : v.trim();
    }

    private static boolean contains(List<String> list, String v) {
        return list.contains(v);
    }
}
