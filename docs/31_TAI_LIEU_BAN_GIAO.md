# TÀI LIỆU BÀN GIAO HỆ THỐNG — VNTECH ERP V5.3.0

Bản cập nhật: 23/09/2026 · Nội dung dành cho bên nhận bàn giao (vận hành & bảo trì).

---

## 1. THÔNG TIN SẢN PHẨM

| Hạng mục | Giá trị |
|---|---|
| Tên sản phẩm | VNTECH ERP V5.3.0 |
| Gói sản phẩm | `VNTECH_ERP_V5_3_0_MASTER_BASELINE_R1_1_1_PROJECT_NAV_FINAL_FP_FIXED_20260908` |
| Build | `5.3.0-MASTER-BASELINE-R1.1.1-FINAL-20260908` |
| Product ID | `VNTECH-KHO-MEP-001` |
| Phạm vi nghiệp vụ | Kho vật tư + M&E (Cơ – Điện): BOQ → chuẩn hóa vật tư → MR → duyệt 5 bậc → PO → GRN → kho → xuất/trả/lắp đặt → nghiệm thu → thu hồi vốn |
| Chế độ bản quyền | Trust Development Mode (chưa enforce license) |

---

## 2. KIẾN TRÚC ĐANG VẬN HÀNH

Hệ thống hiện tại chạy **song song hai lõi** (strangler-fig pattern) đi qua một cổng duy nhất:

```
Trình duyệt
   → http://127.0.0.1:9000   (cutover proxy: tools/cutover-proxy.mjs)
        ├── UI SPA monolith  :8787  (app/page.tsx, Next/React)
        └── Java backend API :18081 (Spring Boot 3.5, vntech-erp-web-0.1.0-SNAPSHOT.jar)
                └── MySQL 8.4 :3306 (CSDL vntech_erp, Flyway V1..V28)
```

| Thành phần | Công nghệ | Cổng |
|---|---|---|
| Giao diện người dùng | React 19 + TypeScript 5.9 + Vite/Next, SPA 1 file `app/page.tsx` | 8787 |
| Logic nghiệp vụ tham chiếu | `scripts/system-route.mjs` (monolith JS fallback) | — |
| Backend nghiệp vụ chính | Java 21 + Spring Boot 3.5, Maven đa module (domain → application → infrastructure → web) | 18081 |
| CSDL | MySQL 8.4, migration bằng Flyway (`V1`..`V28`), 114 bảng baseline | 3306 |
| CSDL phụ (fallback/dev) | SQLite (`warehouse.sqlite`) với chuỗi migration Drizzle `0000..0194` | — |
| Cổng điều phối | `tools/cutover-proxy.mjs` | 9000 |

**Bốn thành phần phải cùng sống:** 3306 (MySQL) · 18081 (Java API) · 8787 (Node SSR) · 9000 (proxy).

---

## 3. TÀI KHOẢN BÀN GIAO

| Tài khoản | Mật khẩu | Phạm vi |
|---|---|---|
| `admin` | `Admin123456@` | Quản trị toàn hệ thống |
| 8 user mẫu PRJ-DEMO-01 | `VnTech@123` | Xem `docs/16_HUONG_DAN_SEED_DEMO_VA_TAI_KHOAN_MO_RA.md` |

> Lưu ý vận hành: UI monolith (8787) có thể "tự ghi đè" mật khẩu admin giữa chừng. Nếu `admin` báo 401, chạy lại seed (reset hash PBKDF2 theo chuẩn Java) hoặc sửa thủ công như trong `java-backend/tools/seed-demo.mjs`.

---

## 4. HƯỚNG DẪN VẬN HÀNH

### 4.1 Khởi động / kiểm tra
```powershell
# Kiểm tra 4 cổng cùng sống
netstat -ano | Select-String "LISTENING" | Select-String ":3306|:18081|:8787|:9000"

# Kiểm tra sức khỏe Java API (phải HTTP 200 / UP)
Invoke-WebRequest "http://127.0.0.1:18081/actuator/health" -UseBasicParsing

# Kiểm tra chuỗi sống đầy đủ
node tools/probe-live-stack.mjs
```

### 4.2 Khởi động lại Java API (khi cần)
```powershell
$env:JAVA_HOME = "C:\Users\PC\.jdks\openjdk-26.0.2.1"
# dừng đúng PID cổng 18081
netstat -ano | Select-String "LISTENING" | Select-String ":18081"
Stop-Process -Id <PID_cua_18081> -Force
Set-Location java-backend
& "C:\Users\PC\.jdks\openjdk-26.0.2.1\bin\java.exe" -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081
```

> KHÔNG dùng `Start-Process` — tiến trình Java chết theo khi cửa sổ PowerShell đóng, proxy :9000 sẽ trả 502.

### 4.3 Seed dữ liệu demo
```powershell
node "java-backend/tools/seed-demo.mjs" "http://127.0.0.1:9000"
# Kết quả chuẩn: SEED DEMO: 61/61 PASS · 0 FAIL
```

### 4.4 Dữ liệu mẫu (bàn giao kèm theo)
- 6 đơn vị (VNTECH, BCH, DA-01, KH, TCKT...), dự án **PRJ-DEMO-01** active + kho + hợp đồng HD-PRJ-DEMO-01.
- Chuỗi 5 chứng từ hoàn chỉnh đã thông qua:
  | Chứng từ | Số | Trạng thái |
  |---|---|---|
  | DNMH | `DNMH-PRJ-DEMO-01-2026-0008` | approved (5/5) |
  | PO | `PO-PRJ-DEMO-01-2026-0005` | completed |
  | GRN | `GRN-PRJ-DEMO-01-2026-0005` | confirmed |
  | PX | `PX-PRJ-DEMO-01-2026-0007` | posted |
  | Hoàn trả | `RET-PRJ-DEMO-01-2026-0008` | received |
- Nhân sự, tài chính (sổ quỹ, kế hoạch giải ngân), nhật ký thi công, pháp chế (công văn `CV-2026-001`).

### 4.5 Backup / khôi phục
- Backup CSDL theo cơ chế hiện hành: dump MySQL định kỳ (pg_dump tương đương không áp dụng; dùng `mysqldump` trên CSDL `vntech_erp`).
- Dữ liệu SQLite/nghiệp vụ phụ nằm trong workspace; trước khi nâng cấp nên backup nguyên thư mục CSDL + file migration.

---

## 5. BẢO MẬT

- Mật khẩu băm bằng **PBKDF2-SHA256**; session băm sha256.
- **RBAC 3 lớp:** role → module/capability (canView/canUse/canCreate/canEdit/canDelete/canApprove) → scope dữ liệu (dự án/kho/đơn vị).
- **Login lockout:** 10 lần sai / 15 phút.
- **Audit toàn diện:** mọi hành động ghi audit_logs; thay đổi được truy vết trước/sau.
- **Integrity gate:** fingerprint nguồn (171 file), CSS baseline, MANIFEST SHA256; Trust Lock Ed25519 giữ ở chế độ development.
- Không có private key/PEM trong source.

---

## 6. NHỮNG ĐIỂM CẦN LƯU Ý KHI TIẾP NHẬN

1. **Hai lõi Java/JS song song:** một số action chưa triển khai ở Java (được phục vụ từ monolith JS). Khi sửa backend Java phải kiểm tra idempotency cả hai phía.
2. **Migration hai dòng:** MySQL dùng Flyway (`V1..V28`), SQLite dùng Drizzle (`0000..0194`). Khi thêm bảng/cột phải thêm **cả hai** (additive, KHÔNG sửa migration cũ).
3. **KHÔNG format/reformat code** trong danh sách fingerprint — làm vỡ gate cài đặt.
4. **SlaComplianceWorker** ở Java đang lỗi SQL (`supply_workflow_steps`) mỗi giờ — chưa phải lỗi chặn, đang theo dõi (TASK-025).
5. Có **166+ commit chưa push** trên nhánh `unity` (chính sách chờ nghiệm thu thủ công).
6. Xem chi tiết vận hành build tại `docs/29_RUNBOOK_BUILD_VA_CHAY_JAVA_BACKEND.md` và `docs/11_RUNBOOK_VAN_HANH_BACKEND_JAVA.md`.

---

## 7. DANH MỤC TÀI LIỆU KÈM THEO BỘ BÀN GIAO

| # | File | Nội dung |
|---|---|---|
| 30 | `docs/30_HUONG_DAN_NGUOI_DUNG.md` | Hướng dẫn sử dụng cho người dùng cuối |
| 31 | `docs/31_TAI_LIEU_BAN_GIAO.md` | Tài liệu này (bàn giao & vận hành) |
| 32 | `docs/32_TAI_LIEU_PHAN_TICH_HE_THONG.md` | Phân tích kiến trúc & hệ thống |
| 33 | `docs/33_MO_TA_CHUC_NANG_VA_HE_THONG.md` | Mô tả chức năng & hệ thống toàn diện |
| 34 | `docs/34_TAI_LIEU_DEV.md` | Hướng dẫn phát triển (dev) |
| 35 | `docs/35_DANH_SACH_TASK_DA_HOAN_THANH.md` | Danh sách task đã hoàn thành/đang làm (MT1+MT2) |
| — | `docs/01..29…` | Báo cáo phân tích, audit, roadmap, runbook gốc của dự án |

---
*Kết thúc tài liệu bàn giao. Lập 23/09/2026.*