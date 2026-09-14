# 11 — RUNBOOK VẬN HÀNH: BACKEND JAVA (SPRING BOOT) + MYSQL 8.4

> Đi kèm `docs/09` (kiến trúc/tiến độ) và `docs/10` (cutover). Giả định đã migrate sang Java.

---

## 1. Khởi động / dừng

```bash
# Hạ tầng (MySQL 8.4 + Redis 7): java-backend/docker-compose.yml
cd java-backend
docker compose up -d mysql redis
docker compose ps                      # đợi cả hai healthy

# Ứng dụng (Flyway auto-migrate 114 bảng khi boot)
mvn -s settings-dev.xml -f pom.xml -pl web spring-boot:run            # dev (console)
java -jar web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar                # prod (jar)
#  - Cổng mặc định: ${PORT:8787} (đổi qua PORT=…)

# Dừng
docker compose stop                    # dừng MySQL/Redis giữ dữ liệu volume
# Ứng dụng: Ctrl+C hoặc kill PID; xem log: journalctl/console
```

## 2. Kiểm tra sức khỏe

| Endpoint | Ý nghĩa |
|---|---|
| `GET /actuator/health` | **200 UP** khi db/disk/ping OK. **503** khi 1 indicator DOWN (bình thường khi SMTP/Redis chưa có — xem 3). |
| `GET /actuator/health?show=details` | chi tiết từng component (db/database, diskSpace…) |
| `GET /api/system` | `{"setupRequired":true}` trước setup; sau setup cần session (401 nếu chưa login) |
| `POST /api/system {"action":"login",…}` | `{"ok":true,"mustChangePassword":false}` + cookie `mep_session` |

Đã kiểm chứng runtime thật (vòng 37/41): health UP với db=H2 (dev), api/system đúng contract.

## 3. Các indicator health & cách tắt khi thiếu hạ tầng

- **Mail (SMTP)**: Spring Boot tự kiểm tra `spring.mail.*` mỗi lần health → DOWN khi không có SMTP → 503.
- **Redis** (nếu bật `spring.data.redis`): DOWN khi không chạy Redis.
- Dev/demo chưa có SMTP/Redis: đã tắt trong `application-dev.yml` (`management.health.mail.enabled=false`, `…redis…false`) — health luôn UP.
- Production: bật SMTP thật (`VNTECH_SMTP_*`) + Redis, hoặc tắt indicator tương tự nếu chưa dùng tính năng email `@Scheduled` SLA.

## 4. Flyway migration

- Tự chạy khi boot: `spring.flyway.locations=classpath:db/migration` (V1 baseline 114 bảng).
- Luôn `ddl-auto: none` — mọi đổi schema qua migration mới `V2__…` trong `infrastructure/src/main/resources/db/migration/`.
- Kiểm tra trạng thái: `SELECT installed_rank, version, description, success FROM flyway_schema_history;`
- Lỗi migrate → app không boot (fail-fast đúng thiết kế); sửa script + `docker compose restart`, hoặc rollback bản migration vừa lỗi (xem 6).

## 5. Backup / restore

```bash
# Backup nóng (mysqldump trong container)
docker exec vntech-mysql mysqldump -uvntech -pvntech --single-transaction \
  --routines --triggers vntech_erp > backup/vntech_$(date +%F).sql

# Restore
docker exec -i vntech-mysql mysql -uvntech -pvntech vntech_erp < backup/vntech_<ngay>.sql
```
- Volume MySQL: `docker volume ls | grep vntech` (dữ liệu nằm trong volume, không mất khi container xóa).
- Định kỳ: cron hằng ngày + giữ 14 ngày (tùy chính sách dự án).

## 6. Rollback (liên quan cutover — đầy đủ ở docs/10 §3.4)

- **Trong 48h đầu sau cutover**: bật lại backend JS (dữ liệu Java ở bảng MySQL riêng, không xung đột file SQLite), UI trỏ lại như cũ.
- **Sau khi ổn định**: xóa dual-write flag; dữ liệu mới chỉ ở MySQL.
- Lỗi Flyway bản mới: `DELETE FROM flyway_schema_history WHERE version='Vn';` + sửa script + boot lại (chỉ khi bản đó chưa ảnh hưởng dữ liệu).

## 7. Hàng đợi/worker nền

- **SLA worker**: `@Scheduled(fixedDelay = 1h)` — mark supply steps quá hạn → `overdue`, payment_plans quá hạn → `overdue`, đếm BCH chờ. Log mỗi lượt: `SLA worker: …`.
- **Email hàng đợi**: `email_queue` — `retry_email` action admin để thử lại; SMTP thật cần cấu hình `save_email_settings`.
- Không có cron ngoài; tất cả scheduling nằm trong process — giữ ít nhất 1 instance chạy.

## 8. Nâng cấp phiên bản (an toàn)

1. `mvn -s settings-dev.xml -f pom.xml clean verify` (55 test 0 fail bắt buộc).
2. Viết `V2__…` migration (nếu đổi schema) — chạy thử trên bản sao trước.
3. Build jar, deploy, boot → Kiểm tra `flyway_schema_history` + health UP + login thật.
4. Không boot 2 phiên bản cùng lúc trên cùng DB khi có migration (Flyway lock).

## 9. Checklist hằng ngày (SRE)

- [ ] `docker compose ps`: mysql/redis healthy
- [ ] `GET /actuator/health` → UP; log không có `ERROR` tăng đột biến
- [ ] `SELECT COUNT(*) FROM flyway_schema_history WHERE success=0;` = 0
- [ ] Backup hằng ngày tồn tại (mục 5)
- [ ] SLA worker log mỗi giờ (mục 7)