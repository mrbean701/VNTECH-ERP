package com.vntech.erp.infrastructure.common;

import com.vntech.erp.application.port.out.IdGenerator;
import org.springframework.stereotype.Component;

import java.util.UUID;

/** Id dạng `<prefix>_<uuid>` — đúng định dạng monolith JS (id("USR") -> "USR_<uuid>"). */
@Component
public class UuidIdGenerator implements IdGenerator {

    @Override
    public String next(String prefix) {
        return prefix + "_" + UUID.randomUUID();
    }

    @Override
    public String nextRaw() {
        return UUID.randomUUID().toString();
    }
}