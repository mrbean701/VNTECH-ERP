package com.vntech.erp.web.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health check — tương đương /healthz, /api/health ở server JS.
 * Contract: { ok, product, version, checks: { database, redis, storage }, time }.
 */
@RestController
@RequestMapping("/api/health")
public class HealthController {

    private final String product = "VNTECH-KHO-MEP-001";
    private final String version = "java-0.1.0";

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> health() {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("ok", true);
        body.put("product", product);
        body.put("version", version);
        body.put("backend", "java-clean-arch");
        body.put("time", Instant.now().toString());
        return body;
    }
}