package com.vntech.erp.web.security;

import com.vntech.erp.application.service.AuthUseCase;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Cookie phiên đăng nhập — khớp sessionCookie() của monolith JS:
 * `mep_session=<token>; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400[; Secure]`.
 */
@Component
public class SessionCookieFactory {

    public static final String COOKIE_NAME = "mep_session";

    private final boolean cookieSecure;

    public SessionCookieFactory(org.springframework.core.env.Environment env) {
        this.cookieSecure = Boolean.parseBoolean(env.getProperty("vntech.cookie-secure", "false"));
    }

    public String create(String token) {
        return COOKIE_NAME + "=" + encode(token)
                + "; Path=/; HttpOnly; SameSite=Strict; Max-Age=" + (AuthUseCase.SESSION_HOURS * 3600)
                + (cookieSecure ? "; Secure" : "");
    }

    public String clear() {
        return COOKIE_NAME + "=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0" + (cookieSecure ? "; Secure" : "");
    }

    private static String encode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }

    public static String decode(String value) {
        return value == null ? null : java.net.URLDecoder.decode(value, java.nio.charset.StandardCharsets.UTF_8);
    }
}