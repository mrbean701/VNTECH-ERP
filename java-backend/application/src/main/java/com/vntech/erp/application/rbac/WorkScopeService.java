package com.vntech.erp.application.rbac;

import com.vntech.erp.application.port.out.OpsTaskStore;

/**
 * MT2-P4-01 / P5-03 / P5-04 (§3.2) — <b>PHẠM VI XEM &amp; GIAO CÔNG VIỆC THEO CẤP BẬC</b>.
 *
 * <p><b>VÌ SAO CẦN LỚP NÀY (đo được, ⛔ không suy diễn):</b> MASTER_TASK_2.md §3.2 (dòng 41-42) yêu cầu:
 * <pre>
 * | Trưởng phòng trở lên | xem công việc của nhân viên <b>thuộc phòng ban mình</b> · xem trạng thái
 *                        hoàn thành · xem tiến độ · giao việc trong phạm vi được phép |
 * | Phó giám đốc trở lên | xem công việc <b>toàn bộ phòng ban</b> · xem công việc <b>toàn bộ nhân viên
 *                        công ty</b> · giao việc <b>toàn công ty</b> theo quyền |
 * </pre>
 * Nhưng trước đây tầng application <b>⛔ không có</b> khái niệm phạm vi theo cấp bậc:
 * {@code createWorkItem} chỉ gọi {@code userIsDepartmentManager(userId, department)} (boolean),
 * {@code directorPendingApprovals} dùng ngưỡng cứng {@code level_rank >= 30} viết thẳng trong use-case
 * ⇒ tầng «phó GĐ» <b>không tồn tại</b>, người dùng không có đường nào biết mình được xem/giao tới đâu.
 *
 * <p><b>NGƯỠNG — ĐO TỪ CSDL {@code system_level_catalog} (⛔ không đoán):</b>
 * {@code nhan_vien}=10 · {@code truong_nhom}=20 · {@code truong_phong}=<b>30</b> ·
 * {@code pho_giam_doc}=<b>35</b> (thêm ở {@code V30__mt2_p4_01_add_pho_giam_doc_level.sql}) ·
 * {@code giam_doc}=40 · {@code tong_giam_doc}=50.
 * ⇒ {@link #PHO_GIAM_DOC_MIN_RANK}=35 nằm <b>giữa</b> trưởng phòng(30) và giám đốc(40) ⇒ đúng nghĩa
 * «trên trưởng phòng, dưới giám đốc» như MT2 §3.2 viết.
 *
 * <p><b>AN TOÀN (⛔ không mở rộng quyền):</b> tài khoản <b>không có</b> cấp bậc ({@code level_rank}
 * = {@code null}) hoặc phòng ban rỗng ⇒ rơi về {@link Kind#SELF} (chỉ việc của chính mình) — ⛔ KHÔNG
 * mặc định mở quyền. {@code admin} là ngoại lệ <b>duy nhất</b> được {@link Kind#COMPANY}, vì đã có sẵn
 * quy ước toàn quyền của hệ thống.
 */
public final class WorkScopeService {

    /** Phạm vi xem/giao công việc. */
    public enum Kind {
        /** Chỉ công việc được giao cho chính mình (nhân viên). */
        SELF,
        /** Công việc của nhân viên <b>thuộc phòng ban mình</b> (trưởng phòng trở lên, dưới phó GĐ). */
        DEPARTMENT,
        /** Công việc <b>toàn bộ phòng ban / toàn công ty</b> (phó giám đốc trở lên). */
        COMPANY
    }

    /** Kết quả phạm vi của một người dùng (dùng cho cả quyết định backend lẫn payload cho UI). */
    public record Scope(Kind kind, Integer levelRank, String department) {
        /** JSON-friendly (UI hiển thị «quyền xem/giao theo cấp» — MT2-P5-03). */
        public java.util.Map<String, Object> toMap() {
            java.util.Map<String, Object> out = new java.util.LinkedHashMap<>();
            out.put("scope", kind.name());
            out.put("levelRank", levelRank);
            out.put("department", department);
            out.put("canViewCompanyWork", kind == Kind.COMPANY);
            // ⚠️ Sửa (26/09/2026): trước đây ghi `kind == Kind.DEPARTMENT` ⇒ phó GĐ (COMPANY) báo SAI là
            // ⛔ không xem được việc phòng ban, dù `canViewDepartment()` trả TRUE cho họ. Nay: tầng nào
            // ≠ SELF đều xem được việc phòng ban (DEPARTMENT: phòng mình · COMPANY: mọi phòng).
            out.put("canViewDepartmentWork", kind != Kind.SELF);
            out.put("canViewOwnWork", true);
            out.put("canAssignCompanyWide", kind == Kind.COMPANY);
            out.put("canAssignDepartment", kind == Kind.SELF ? Boolean.FALSE : Boolean.TRUE);
            return out;
        }
    }

    /** `level_rank` của `truong_phong` — ĐO từ CSDL (30). */
    public static final int TRUONG_PHONG_MIN_RANK = 30;
    /** `level_rank` của `pho_giam_doc` — ĐO từ CSDL sau V30 (35). */
    public static final int PHO_GIAM_DOC_MIN_RANK = 35;

    private final OpsTaskStore store;

    public WorkScopeService(OpsTaskStore store) {
        this.store = store;
    }

    /**
     * Phạm vi của một người dùng. ⛔ <b>Quy ước an toàn:</b> thiếu cấp bậc ⇒ {@link Kind#SELF}.
     *
     * @param userId id người dùng (có thể rỗng ⇒ {@link Kind#SELF})
     * @param role   mã vai trò (chỉ {@code admin} là ngoại lệ toàn công ty)
     */
    public Scope scopeOf(String userId, String role) {
        if (userId == null || userId.isBlank()) {
            return new Scope(Kind.SELF, null, "");
        }
        if ("admin".equals(role)) {
            return new Scope(Kind.COMPANY, store.userLevelRank(userId), safeDepartment(store.userDepartment(userId)));
        }
        Integer rank = store.userLevelRank(userId);
        String department = safeDepartment(store.userDepartment(userId));
        if (rank != null && rank >= PHO_GIAM_DOC_MIN_RANK) {
            return new Scope(Kind.COMPANY, rank, department);
        }
        if (rank != null && rank >= TRUONG_PHONG_MIN_RANK && !department.isEmpty()) {
            return new Scope(Kind.DEPARTMENT, rank, department);
        }
        // ⛔ Cấp bậc null, HOẶC dưới trưởng phòng, HOẶC trưởng phòng mà không rõ phòng ban ⇒ chỉ việc của chính mình.
        return new Scope(Kind.SELF, rank, department);
    }

    /**
     * Chuẩn hoá phòng ban: {@code null} ⇔ rỗng, kèm bỏ khoảng trắng thừa.
     *
     * <p>⚠️ <b>Ca test đã BẮT ĐƯỢC lỗi này</b> ({@code WorkScopeServiceTest.truongPhong_nhungKhongRoPhongBan_roiVeSELF}):
     * cột {@code users.department} là {@code TEXT NOT NULL} nhưng adapter có thể trả {@code null} khi không
     * tìm thấy dòng ⇒ gọi {@code department.isEmpty()} trực tiếp gây {@code NullPointerException}
     * ⇒ 500 thay vì trả về phạm vi an toàn. Vì vậy chuẩn hoá ở đây (⛔ KHÔNG sửa test để "cho qua").
     */
    private static String safeDepartment(String department) {
        return department == null ? "" : department.trim();
    }

    /**
     * Có được phép <b>xem</b> công việc của {@code departmentCode} không (MT2 §3.2 tầng XEM).
     * ⛔ Không phân biệt «của tôi» ở đây — quyền xem việc CỦA CHÍNH MÌNH do use-case khác xử lý.
     */
    public boolean canViewDepartment(Scope scope, String departmentCode) {
        if (scope == null) return false;
        if (scope.kind() == Kind.COMPANY) return true;
        if (scope.kind() == Kind.DEPARTMENT) {
            return departmentCode != null && !departmentCode.isBlank()
                    && departmentCode.trim().equalsIgnoreCase(scope.department());
        }
        return false;
    }

    /**
     * Có được phép <b>giao việc</b> cho phòng ban {@code departmentCode} không (MT2 §3.2 tầng GIAO).
     * ⛔ Phó GĐ «giao việc toàn công ty **theo quyền**» ⇒ vẫn phải qua kiểm tra quyền module ở tầng trên
     * (RBAC), ở đây chỉ chặn/thả theo <b>phạm vi phòng ban</b>.
     */
    public boolean canAssignDepartment(Scope scope, String departmentCode) {
        return canViewDepartment(scope, departmentCode);
    }
}
