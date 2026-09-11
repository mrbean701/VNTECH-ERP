package com.vntech.erp.application.port.out;

import java.util.List;

/** Port đọc scope dự án của user (user_project_scopes) — dùng cho bootstrap/giấy phép dữ liệu. */
public interface ProjectScopeStore {

    List<String> findProjectIdsByUserId(String userId);
}