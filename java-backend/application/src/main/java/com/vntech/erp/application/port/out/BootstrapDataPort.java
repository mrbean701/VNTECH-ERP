package com.vntech.erp.application.port.out;

import java.util.List;
import java.util.Map;

/**
 * Port đọc toàn bộ dữ liệu bootstrap cho UI (GET /api/system) — port từ bootstrap(user) monolith JS.
 * Infrastructure implement bằng JdbcTemplate + native SQL (giữ nguyên alias camelCase của JS
 * để shape JSON khớp 100% với SPA hiện tại). Không cần JPA entity cho từng bảng.
 *
 * Lưu ý Clean Architecture: DTO dùng Map/List là lựa chọn cố ý cho hợp đồng động này;
 * mọi câu SQL nằm ở infrastructure.
 */
public interface BootstrapDataPort {

    /** Ngữ cảnh cần thiết để tính quyền/hiển thị (giống các biến trong bootstrap JS). */
    record Context(
            String userId,
            boolean admin,
            List<String> visibleProjectIds,   // projectIds sau khi lọc scope
            List<String> allProjectIds         // mọi project id (admin) hoặc trùng visible
    ) { }

    /** Trả về Map toàn bộ `data` khối bootstrap(user) — key camelCase như JS. */
    Map<String, Object> load(Context ctx);
}