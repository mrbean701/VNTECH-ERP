package com.vntech.erp.application.port.out;

import com.vntech.erp.domain.entity.User;

import java.util.Optional;

/** Port repository tài khoản — infrastructure implement bằng JPA/MySQL. */
public interface UserRepository {

    long count();

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findById(String id);

    User save(User user);

    /**
     * Thông tin role_catalog theo mã vai trò — port nguyên trạng truy vấn phiên của monolith JS
     * ({@code LEFT JOIN role_catalog rc ON rc.code=u.role}), lấy đúng 3 cột mà JS trả về:
     * {@code COALESCE(rc.base_role,u.role) AS roleBase}, {@code COALESCE(rc.name,u.role) AS roleName},
     * {@code rc.warehouse_scope_kind AS warehouseScopeKind}.
     *
     * <p>{@code base_role} là "mã engine" mà JS dùng cho phân quyền: mã vai trò chuẩn ánh xạ
     * NHIỀU-VỀ-MỘT sang nó (cht→commander, da_nv &amp; da_truong→project, kh_nv &amp; kh_truong→procurement,
     * thu_kho &amp; kho_tong→warehouse, ksda→engineer, thuky→director).
     *
     * <p>Không có dòng role_catalog ⇒ trả empty để tầng gọi tự rơi về chính mã vai trò (đúng JS).
     */
    Optional<RoleCatalogInfo> findRoleCatalogInfo(String roleCode);

    /** Bản ghi role_catalog cần cho phiên đăng nhập. */
    record RoleCatalogInfo(String baseRole, String name, String warehouseScopeKind) { }
}