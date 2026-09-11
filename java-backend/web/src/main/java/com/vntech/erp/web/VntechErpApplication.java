package com.vntech.erp.web;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * VNTECH ERP — Backend Java (Clean Architecture).
 * Entry point của ứng dụng web. Scan toàn bộ package com.vntech.erp (domain/application/infrastructure/web).
 * JPA repositories & entities nằm ở infrastructure -> khai báo tường minh vùng quét.
 */
@SpringBootApplication(scanBasePackages = "com.vntech.erp")
@EntityScan(basePackages = "com.vntech.erp.infrastructure.persistence.jpa")
@EnableJpaRepositories(basePackages = "com.vntech.erp.infrastructure.persistence.jpa")
@EnableScheduling
public class VntechErpApplication {

    public static void main(String[] args) {
        SpringApplication.run(VntechErpApplication.class, args);
    }
}