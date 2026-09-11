package com.vntech.erp.application.port.out;

import com.vntech.erp.domain.entity.User;

import java.util.Optional;

/** Port repository tài khoản — infrastructure implement bằng JPA/MySQL. */
public interface UserRepository {

    long count();

    Optional<User> findByUsernameIgnoreCase(String username);

    Optional<User> findById(String id);

    User save(User user);
}