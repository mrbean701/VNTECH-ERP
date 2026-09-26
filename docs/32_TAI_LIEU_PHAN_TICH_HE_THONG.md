# TÀI LIỆU PHÂN TÍCH HỆ THỐNG — VNTECH ERP V5.3.0

Bản cập nhật: 23/09/2026 · Bộ tài liệu bàn giao hệ thống.

Tài liệu này mô tả **kiến trúc, thành phần, mô hình dữ liệu và luồng vận hành** của hệ thống. Đọc cùng `docs/33_MO_TA_CHUC_NANG_VA_HE_THONG.md` (góc chức năng) và `docs/34_TAI_LIEU_DEV.md` (góc phát triển).

---

## 1. BỐI CẢNH & MỤC TIÊU

**VNTECH ERP** là nền tảng quản trị & điều hành nội bộ của Công ty CP TM ĐT PT Công nghệ Việt (VNTECH), tập trung nghiệp vụ **Kho vật tư + M&E (Cơ – Điện)**:

```
Bản vẽ → Bóc khối lượng BOQ → Chuẩn hóa mã vật tư → Đề nghị mua (MR)
→ Phê duyệt 5 bậc → Đặt hàng (PO) → Nhận hàng (GRN)
→ Tồn kho theo hợp đồng → Xuất/Trả/Lắp đặt → Nghiệm thu → Thu hồi vốn
```

Sản phẩm qua nhiều vòng chuẩn hóa: MASTER BASELINE CLEANUP R1.1 → R1.1.1 safe-clean CSS → PROJECT NAVIGATION CONSOLIDATION → FINGERPRINT FIX. Bản hiện tại là **FULL SOURCE** độc lập (không cần replay patch cũ).

---

## 2. KIẾN TRÚC TỔNG THỂ

### 2.1 Sơ đồ tầng
```
┌─────────────────────────────────────────────────────────────┐
│  Trình duyệt (React 19 + TS 5.9, SPA app/page.tsx)          │
└──────────────────────────┬──────────────────────────────────┘
                           │ http
┌──────────────────────────▼──────────────────────────────────┐
│  Cutover Proxy  :9000 (tools/cutover-proxy.mjs)             │
└──────┬───────────────────────────────────┬──────────────────┘
       │                                   │
┌──────▼──────────────────────┐   ┌────────▼────────────────────┐
│ UI SPA monolith    :8787    │   │ Java backend API   :18081   │
│ (app/page.tsx)              │   │ Spring Boot 3.5 / Java 21   │
│ scripts/system-route.mjs    │   │ Clean/Hexagonal Arch        │
│ = backend JS tham chiếu     │   │ RBAC 3 lớp, ~200 action     │
└──────┬──────────────────────┘   └────────┬────────────────────┘
       │                                   │
       │            ┌──────────────────────▼───────────────┐
       │            │   MySQL 8.4  (vntech_erp)            │
       │            │   Flyway V1..V28 · 114 bảng baseline │
       └──────────┬─┘ SQLite (warehouse.sqlite, Drizzle       │
                  │   0000..0194) — fallback/dev path        │
                  └──────────────────────────────────────────┘
```

### 2.2 Vì sao có "hai lõi"?
Hệ thống đang trong lộ trình **strangler-fig**: logic nghiệp vụ đang được chuyển dần từ monolith JS sang **Java Clean Architecture**. Trong giai đoạn chuyển đổi, một số action chưa triển khai ở Java nên được phục vụ từ lõi cũ — điều này đảm bảo **zero-downtime** và khả năng so sánh đối chứng hai lõi. Xem `docs/09_KE_HOACH_CHUYEN_SANG_JAVA_MYSQL.md`, `docs/10_KẾ_HOẠCH_CUTOVER_BACKEND_JAVA.md`, `docs/13_KE_HOACH_CHUYEN_DOI_HOAN_TOAN_SANG_JAVA_BACKEND.md`.

---

## 3. BACKEND JAVA — CLEAN ARCHITECTURE

### 3.1 Maven đa module (luồng phụ thuộc một chiều)
```
vntech-erp-domain  (entity + domain sự kiện)
   → vntech-erp-application (use-case, port in/out, RBAC)
        → vntech-erp-infrastructure (adapter: JPA/MySQL, bootstrap, workers)
             → vntech-erp-web  (REST controller: SystemController + Web)
```
Artifact gói thực thi: `java-backend/web/target/vntech-erp-web-0.1.0-SNAPSHOT.jar` (~90 MB fat jar).

### 3.2 Quy ước Ports & Adapters
- **Domain:** chỉ có entity thuần (không phụ thuộc framework/DB).
- **Application:** chứa các `*UseCase.java` (~20 use-case), 31 port `out` (interface), dịch vụ RBAC.
- **Infrastructure:** adapter JPA/MySQL triển khai port, bootstrap dữ liệu, worker nền (Ví dụ: `SlaComplianceWorker`, migration Flyway).
- **Web:** `SystemController` — điểm nạp action (~224 `case` action), xác thực session, phân quyền, log.

### 3.3 RBAC 3 lớp
| Lớp | Thành phần | Ý nghĩa |
|---|---|---|
| 1. Vai trò | `role_catalog`, hệ mã role (ENGINE/CHT/KH/DA/TCKT/...) | Người dùng thuộc vai trò nào |
| 2. Module + capability | `ActionRbacRegistry` + `RbacService`; capability `canView/canUse/canCreate/canEdit/canDelete/canApprove` | Thao tác nào được phép |
| 3. Phạm vi dữ liệu | `AccessScopeService`, `user_project_scopes`, `department_module_permissions` | Dữ liệu dự án/kho/đơn vị nào được nhìn |

Nguyên tắc: **backend-first** — mọi kiểm tra quyền thực hiện ở backend, frontend chỉ render theo dữ liệu trả về.

### 3.4 Luồng 1 request tiêu biểu
```
UI (app/page.tsx) --POST {action, ...}--> proxy :9000
   → SystemController -> nạp case action
   → RBAC (RbacService: action cap + scope data)
   → UseCase (business rule)
   → Port out → Adapter JPA → MySQL
   → trả payload: data + allowedCapabilities + audit
```

---

## 4. MÔ HÌNH DỮ LIỆU

### 4.1 CSDL chính — MySQL (vntech_erp), Flyway V1..V28
- **V1 baseline:** 114 bảng (từ `DATA_MODEL_REFERENCE.json`, tableCount=114).
- Các version sau (V2..V28) bổ sung thêm theo từng task (bảng mới `work_item_comments`, `work_item_participants`, `partners`, cột `metadata`, ...).

### 4.2 Nhóm bảng chính (114 bảng)
| Nhóm | Đại diện |
|---|---|
| Master data | projects, project_contracts, boq_versions, suppliers, teams, materials, categories, role_catalog, org units |
| Kho / tồn kho | warehouses, stock_movements, goods_receipts, stock_issues, transfer_orders, central_returns, contract_stock_ledger |
| Mua hàng | material_requests, material_request_items, purchase_orders, approvals, supply_workflow_steps |
| BOQ / mapping | project_boq_items, boq_source_items, material_embeddings, boq_mapping_candidates |
| Quy trình | work_items, work_item_comments, work_item_participants, work_item_events, task_notifications |
| Security/audit | users, sessions, user_project_scopes, user_module_permissions, department_module_permissions, audit_logs, email_outbox |
| Thông báo | notifications (web, read-once), notification recipients |
| Tài chính/đội | payments, capital_recovery_records, production_reports, team contracts |
| Trust/license | vntech_product_identity, vntech_trust_settings, vntech_license_installations |

### 4.3 Điểm thiết kế cốt lõi
- **Tách tồn vật lý (warehouse) khỏi sở hữu kế toán (contract):** `procurement_allocations` + `contract_stock_ledger` truy vết MR→PO→GRN→BOQ tới từng hợp đồng (multi-contract có thể cùng sở hữu 1 mã vật tư).
- **Approval flow động:** `approval_stage_catalog` + `approval_project_assignments` + `approval_mode_snapshot`; phiếu không thuộc dự án (project_id NULL/'') luôn nhìn thấy và duyệt được.
- **Audit trước/sau:** thay đổi dữ liệu ghi cả giá trị trước và sau (`before_json`/`after_json`/`metadata`).

### 4.4 CSDL phụ — SQLite + Drizzle
- Chuỗi migration `drizzle/0000..0194`, dùng `node:sqlite` (runtime Node), adapter `PostgresD1Database` viết tay cho mục đích dev/fallback.
- ⚠️ Cảnh báo thiết kế cũ (`docs/02`): `db/schema.ts` chỉ khớp **67/99 bảng** (không đầy đủ) — không dùng `drizzle-kit generate` bừa bãi.

---

## 5. THÀNH PHẦN NGHIỆP VỤ NỔI BẬT

### 5.1 Material Matching V2
Không cần ML bên ngoài: embedding cục bộ 96 chiều (FNV-1a + hashing trick), **6 tiêu chí chấm điểm** (history/technical/system/UOM/fuzzy/embedding), Candidate Gate chống gán sai, fallback Ollama/OpenAI khi có env.

### 5.2 BOQ Workspace
Bản vẽ → bóc khối lượng → chuẩn hóa → mua sắm; cộng dồn request/approved/ordered/received/remaining.

### 5.3 Form động
Cấu hình field `visible/required/importable/exportable/editable` theo form key — không cần sửa code.

### 5.4 Bulk import
User (12 cột) / Project (9 cột): preflight nguyên tử, tạo BCH động theo dự án.

### 5.5 Trust Lock
Fingerprint máy + license Ed25519; giữ development mode (chưa enforce); không có private key trong source.

---

## 6. AN TOÀN & TOÀN VẸN

1. **Integrity gate chuỗi build:** preflight-source → css-baseline-audit → verify-vntech-fingerprint (171 file) → master-baseline-gate → release-static-gate.
2. **Fingerprint hoạt động hiện tại:** source `31cb2728…` / brand `f7867695…` / release `add41b0f…` (giá trị đúng nhất lấy từ `lib/vntech-identity-data.mjs` + gate, KHÔNG dựa bản chụp cũ trong README).
3. **CSS baseline:** chặn thêm style sau marker `VNTECH_MASTER_BASELINE_CSS_R1_1_1_END`.
4. **Quét cấm:** secret/PEM/.key/.p12/.pfx trong source; artifact node_modules/dist/.env trong gói.

---

## 7. SỰ KIỆN NỀN & WORKER

- **SlaComplianceWorker** (Java): rà SLA phê duyệt; hiện đang báo lỗi SQL mỗi giờ (`UPDATE supply_workflow_steps ... status='overdue'`) — lỗi lược đồ chưa xử lý, theo dõi tại TASK-025.
- **Bootstrap dữ liệu nền:** khởi tạo danh mục chuẩn, role, action registry khi khởi động.

---

## 8. HẠN CHẾ ĐÃ BIẾT (TỪ AUDIT 16/09 + THEO DÕI)

| Hạng mục | Trạng thái |
|---|---|
| Duy trì monolith: `system-route.mjs` ~2900 dòng, `page.tsx` ~2916 dòng/598 KB | Kiến trúc tách file là lộ trình dài hạn (`docs/04_KE_HOACH_PHAT_TRIEN.md`) |
| `me`/`bootstrap` chưa triển khai ở Java (Strangler Fig) | Giao diện được phục vụ qua JS; đã được phân tích TASK-B03 |
| SlaComplianceWorker lỗi SQL | Chưa xử lý (TASK-025) |
| 15 màn "ĐANG PHÁT TRIỂN" (Định mức, một số màn Tài chính/Pháp chế) | Theo thiết kế, chờ triển khai |
| Không có down-migration ở cả hai dòng DB | Chỉ append, đúng quy trình |

---
*Tài liệu thuộc bộ tài liệu bàn giao hệ thống VNTECH ERP V5.3.0 (23/09/2026). Nguồn tham khảo: `docs/01`, `docs/06_KIEN_TRUC_MUC_TIEU_JAVA_CLEAN_ARCH.md`, `docs/10`, `docs/11`, `docs/24_SYSTEM_AUDIT_REPORT.md`.*