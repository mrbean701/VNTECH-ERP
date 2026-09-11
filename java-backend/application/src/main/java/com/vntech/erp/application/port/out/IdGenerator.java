package com.vntech.erp.application.port.out;

/** Sinh id tương thích định dạng JS: `<prefix>_<uuid>` (vd USR_..., SES_...). */
public interface IdGenerator {

    String next(String prefix);

    /** UUID thuần không prefix — dùng cho session token (JS: uuid()+uuid()). */
    String nextRaw();
}