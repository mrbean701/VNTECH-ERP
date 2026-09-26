package com.vntech.erp.domain.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Unit test {@link MaterialSystemCodes} — kiểm chứng port Java KHỚP hành vi JS
 * {@code scripts/system-route.mjs:44-54} ({@code canonicalMeCode}) và {@code :75-76}
 * ({@code normalizeMaterialName} / {@code internalGroupCode}).
 *
 * <p><b>VÌ SAO CÓ TEST NÀY (TASK-040 nhóm 3b):</b> bản {@code canonicalMeCode} cũ trong
 * {@code BoqManagementUseCase} chỉ so <b>ĐÚNG BẰNG</b> trong khi JS khớp <b>TIỀN TỐ</b>. Đo bằng
 * {@code tools/probe-canonical-me-code-drift.mjs} cho <b>7/28 đầu vào lệch</b>. Các ca dưới đây CHÍNH LÀ
 * những ca từng lệch — nếu ai bỏ mất nhánh {@code startsWith}, test sẽ đỏ ngay.
 */
class MaterialSystemCodesTest {

    @Test
    void canonicalMeCode_khopDungBang() {
        assertEquals("DIEN", MaterialSystemCodes.canonicalMeCode("DIEN"));
        assertEquals("DIEN", MaterialSystemCodes.canonicalMeCode("Điện"));
        assertEquals("DNHE", MaterialSystemCodes.canonicalMeCode("dien-nhe"));
        assertEquals("DNHE", MaterialSystemCodes.canonicalMeCode("DIENNHE"));
        assertEquals("DNHE", MaterialSystemCodes.canonicalMeCode("ELV"));
        assertEquals("CTN", MaterialSystemCodes.canonicalMeCode("PLUMBING"));
        assertEquals("CTN", MaterialSystemCodes.canonicalMeCode("Cấp thoát nước"));
        assertEquals("HVAC", MaterialSystemCodes.canonicalMeCode("Điều hoà thông gió"));
        assertEquals("PCCC", MaterialSystemCodes.canonicalMeCode("Fire"));
    }

    /** Đúng những ca đã LỆCH trước khi port (JS dùng {@code raw.startsWith(...)}). */
    @Test
    void canonicalMeCode_khopTienTo_nhungCaTungLech() {
        assertEquals("DIEN", MaterialSystemCodes.canonicalMeCode("DIEN LUC"));
        assertEquals("DIEN", MaterialSystemCodes.canonicalMeCode("Điện lực"));
        assertEquals("DIEN", MaterialSystemCodes.canonicalMeCode("DIEN123"));
        assertEquals("DIEN", MaterialSystemCodes.canonicalMeCode("DIEN.TU"));
        assertEquals("DNHE", MaterialSystemCodes.canonicalMeCode("ELV-1"));
        assertEquals("DNHE", MaterialSystemCodes.canonicalMeCode("DNHE_2"));
        assertEquals("PCCC", MaterialSystemCodes.canonicalMeCode("PCCC-01"));
    }

    @Test
    void canonicalMeCode_roiVeKHAC() {
        assertEquals("KHAC", MaterialSystemCodes.canonicalMeCode(""));
        assertEquals("KHAC", MaterialSystemCodes.canonicalMeCode("   "));
        assertEquals("KHAC", MaterialSystemCodes.canonicalMeCode(null));
        assertEquals("KHAC", MaterialSystemCodes.canonicalMeCode("XYZ"));
        assertEquals("KHAC", MaterialSystemCodes.canonicalMeCode("Vật tư khác"));
        assertEquals("KHAC", MaterialSystemCodes.canonicalMeCode("OTHER"));
    }

    @Test
    void normalizeMaterialName_gopKyHieuKyThuat() {
        assertEquals("d20", MaterialSystemCodes.normalizeMaterialName("Phi 20"));
        assertEquals("d25", MaterialSystemCodes.normalizeMaterialName("DN25"));
        assertEquals("cap dien", MaterialSystemCodes.normalizeMaterialName("Cáp điện"));
        // KỲ VỌNG SAI CỦA CHÍNH TÔI ĐÃ SỬA: bản đầu tôi viết "Ø 20" -> "d20". Kiểm lại mã JS thì
        // `\b` của JS **cũng** chỉ tính [A-Za-z0-9_] là ký tự chữ, mà "Ø" không thuộc tập đó ⇒ `\b` không khớp
        // ở đầu chuỗi ⇒ JS **cũng** cho "20". Việc đổi "ø" thành " d " nằm ở hàm KHÁC
        // (`normalizeMaterialText`, dùng cho so khớp tên vật tư) chứ không phải `normalizeMaterialName`.
        // Giữ nguyên hành vi JS: "Ø 20" -> "20".
        assertEquals("20", MaterialSystemCodes.normalizeMaterialName("Ø 20"));
    }

    @Test
    void internalGroupCode_sinhMaNhom() {
        assertEquals("CAP_DIEN_DONG_LUC", MaterialSystemCodes.internalGroupCode("Cáp điện động lực"));
        assertEquals("CHUA_PHAN_NHOM", MaterialSystemCodes.internalGroupCode(""));
        assertEquals("CHUA_PHAN_NHOM", MaterialSystemCodes.internalGroupCode("   "));
        // Giới hạn 48 ký tự như JS `.slice(0,48)`
        String longName = "Nhóm vật tư có tên rất dài để kiểm tra giới hạn bốn mươi tám ký tự của hàm";
        assertEquals(48, MaterialSystemCodes.internalGroupCode(longName).length());
    }
}
