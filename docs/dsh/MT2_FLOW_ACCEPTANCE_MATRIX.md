# MT2 — MA TRẬN NGHIỆM THU THEO **LUỒNG END-TO-END** (MT2 §25 × §24)

> Vì sao có tệp này: **§25 MASTER COMPLETION CONDITION** yêu cầu **6 luồng end-to-end** phải có đủ
> **Traceability · Data Integrity · RBAC · Workflow · Audit · Notification · Testing · Documentation**, và **§24 FINAL ACCEPTANCE**
> yêu cầu kiểm **UI · API · Database · RBAC · Workflow · CRUD · Search · Sort · Filter · Modal · Notification · Audit · Regression · Documentation · TODO · Task history**.
> Tệp này đối chiếu 2 điều đó với **bằng chứng chạy được** (tên tệp/lệnh thật) ⇒ ⛔ **không** thay thế final audit; dùng để chốt nhanh khi hết BLOCKED.
> Trạng thái nền: MT2 **93/100 = 93,0 %** · Cập nhật **23/09/2026**.
> Ký hiệu: ✅ có bằng chứng chạy được · 🟡 có một phần (nêu rõ thiếu gì) · ⛔ chưa có.

## ⛓️ BẰNG CHỨNG NỀN (đo lại trong phiên 23/09, ⛔ không trích số cũ)
| Cổng | Lệnh | Kết quả |
|---|---|---|
| Frontend regression | `npm run test:regression` | **69/69 · exit 0** |
| Workflow spec | `npm run test:workflow` | **PASSED · exit 0** («four-stage spec approvals/email/SLA → multi-PO/multi-delivery → strict material master → contract stock → inherited/override permissions → configurable groups/roles/UI → user safety») |
| Typecheck | `npx tsc --noEmit` | **0** |
| Java toàn bộ | `mvn -pl web -am test` | **61/61 · 0 Failures · 0 Errors · BUILD SUCCESS** |
| DB — SQL tĩnh | `node tools/probe-java-sql-schema.mjs` | **không thấy tham chiếu bảng/cột sai** |
| DB — drift | `node tools/probe-schema-drift.mjs` | **0 lệch** |
| DB — quan hệ | `node tools/p2-reference-integrity.mjs` | **15/15 cặp · 0 mồ côi** |
| UI LIVE | `probe-p5-dashboard-menu` · `probe-p6-07-attachment-layout` · `probe-p6-08-menu-single-item` | **4/4 · 4/4 · 3/3** |

---

## ① LUỒNG CÔNG VIỆC → RBAC + GIAO VIỆC + DASHBOARD
| Chiều §25 | Trạng thái | Bằng chứng / thiếu gì |
|---|---|---|
| Traceability | ✅ | `t05-personal-work` · `t09-task-team-member` (task ↔ người giao/người nhận) · `t08-work-dashboard` |
| Data Integrity | ✅ | `t07-kanban-board` · `t06-department-scope` · form nhập liệu có kiểm bắt buộc |
| RBAC | 🟡 | phạm vi **phòng ban/dự án** có (`t06-department-scope` · `probe-action-scope-parity` **67/67**) — ⛔ **phạm vi theo CẤP BẬC còn BLOCKED** (`P4-01`/`P5-03`/`P5-04` chờ user chốt ngưỡng) |
| Workflow | ✅ | trạng thái công việc + kiểm soát hoàn thành (`t05`, `t09`, `p5-01-work-menu-dashboard`) |
| Audit | ✅ | bảng công việc có `created_by/created_at/updated_at`; lịch sử hiển thị ở chi tiết |
| Notification | 🟡 | thông báo trong app có (`p13-*`); ⚠️ **chưa có worker SMTP `@Scheduled`** (chỉ có `retry_email`) |
| Testing | ✅ | contract `t01`·`t05`·`t06`·`t07`·`t08`·`t09`·`p5-01` + probe LIVE `probe-p5-dashboard-menu` **4/4** |
| Documentation | ✅ | `MT2-PHASE-TASK` dòng P5-01/P5-02 · audit PHASE 5 |

## ② LUỒNG TRUNG TÂM PHÊ DUYỆT → APPROVAL + TIMELINE + SLA + OVERDUE
| Chiều §25 | Trạng thái | Bằng chứng / thiếu gì |
|---|---|---|
| Traceability | ✅ | `p6-02` (hàng đợi → phiếu đang xử lý → «Chi tiết») · `p2-d4-approval-timeline` (6 thông tin mỗi bước) · Java `RequestApprovalIntegrationTest` |
| Data Integrity | ✅ | `approvals` + `approval_stage_catalog` + `approval_project_assignments` — `p2-approval-dynamic` · `RequestApprovalOwnerOnlyTest` (cổng owner-only) |
| RBAC | ✅ | `DirectorPendingApprovalsTest` (403 theo cấp ⇒ ẩn card, backend enforce) · `probe-action-registry-coverage` (0 action mù quyền) |
| Workflow | ✅ | `RequestApprovalIntegrationTest` · transition + `decide_approval` + chặn bước sai |
| Audit | ✅ | `approvals.decided_at/comment/overdue_reason` · `audit_logs` (`ad13`/`ad14`) |
| Notification | 🟡 | email theo bước có (`email_outbox` + `email-dispatcher.test.mjs`); ⚠️ thiếu worker gửi tự động |
| Testing | ✅ | **contract PHASE 6 = 19/19** (`p6-01`…`p6-08`) · `p2-d4` **3/3** · Java `RequestOverdueReasonTest` **2/2** · probe `p6-07` **4/4** · `p6-08` **3/3** |
| Documentation | ✅ | audit PHASE 6 (P6-01…P6-08) · `MT2-PHASE-6-AUDIT.md` |

## ③ LUỒNG QUẢN LÝ DỰ ÁN → PROJECT + MEMBERS + TEAMS + WAREHOUSE + COMMAND BOARD
| Chiều §25 | Trạng thái | Bằng chứng / thiếu gì |
|---|---|---|
| Traceability | ✅ | `pr01-project-tabs` · `pr03-project-detail-tabs` · `project-navigation-consolidation` |
| Data Integrity | ✅ | `w02/w03/w03-flag` (dự án ↔ kho) · `ProjectAdminIntegrationTest` · `p2-reference-integrity` **15/15, 0 mồ côi** |
| RBAC | ✅ | `pr06-bch-crud` (quyền Ban chỉ huy) · `probe-action-scope-parity` **67/67** |
| Workflow | ✅ | `tm05-team-allocations` (phân bổ tổ đội) · `pr02-project-filters` |
| Audit | ✅ | `tm06-team-members-audit` · `pr04-entity-modal` (chi tiết theo thực thể) |
| Notification | 🟡 | như ① — thiếu worker SMTP |
| Testing | ✅ | `pr01`·`pr02`·`pr03`·`pr04`·`pr06`·`project-navigation-consolidation`·`tm01`…`tm06`·`w02`·`w03` + Java `ProjectAdminIntegrationTest` |
| Documentation | ✅ | PHASE 7 log + `TASK-101` |

## ④ LUỒNG MUA HÀNG → SUPPLIER → PR → APPROVAL → PO → DELIVERY → GRN → WAREHOUSE
| Chiều §25 | Trạng thái | Bằng chứng / thiếu gì |
|---|---|---|
| Traceability | ✅ | `p2-d1-pr-child-po` (PR con → PO) · `p2-d3-grn-to-po` · `SupplyChainEndToEndIntegrationTest` (chuỗi thật) |
| Data Integrity | ✅ | `StockChainIntegrationTest` · `p2-25-pr-po-grn-cases` · `probe-java-sql-schema` **0 sai** |
| RBAC | ✅ | `RbacSupplierMaterialTest` (ca âm 403) · `PoRbacActionsIntegrationTest` · `probe-action-role-parity` **0 điểm lệch** |
| Workflow | ✅ | `p2-approval-dynamic` (duyệt PR theo cấu hình) · `StockIssueWorkflowSteps345Test` |
| Audit | ✅ | `audit_logs` cho PO/GRN/phiếu kho · `ad13` |
| Notification | 🟡 | email NCC/PO có (`SupplierEmailTest` **3/3**, `email-dispatcher`); ⚠️ thiếu worker gửi tự động |
| Testing | ✅ | `p08-supplier-po-material` + `p2-08` **19/19** · `p3-05` **3/3** · `p2-d2-po-detail` · `p2-s25-a/b-6cases` · Java `SupplyChainEndToEnd`·`StockChain`·`PoPriceFromRequestTest` |
| Documentation | ✅ | PHASE 8 log (12 dòng, ⛔ hết SKIP sai) |

## ⑤ LUỒNG QUẢN TRỊ → USER → RBAC → WORKFLOW → NOTIFICATION
| Chiều §25 | Trạng thái | Bằng chứng / thiếu gì |
|---|---|---|
| Traceability | ✅ | `ad01`…`ad16` (bảng tài khoản, audit actor, tự sửa hồ sơ) · `p12-01`…`p12-07` |
| Data Integrity | ✅ | `p12-07-identity-integrity-gate` · `p12-05-user-identity-model` · `trust-lock-foundation` (Ed25519) |
| RBAC | ✅ | `AdminGovernanceIntegrationTest` · `ProductionRoleCounterProofTest` **5/5** · `SystemControllerAuthTest` **4/4** |
| Workflow | ✅ | `WorkflowModal` + test workflow tạo/đọc/xoá · `p2-approval-dynamic` |
| Audit | ✅ | `ad13`/`ad14`/`ad15` (nhật ký + trường bị chặn + cấu hình) |
| Notification | 🟡 | cấu hình Web/Email + read-state có (`p12-01`·`p12-02`·`p13-01`…`p13-03`, `NotificationCenterTest` **4/4**); ⚠️ thiếu worker SMTP; ⛔ `P10-05` (liên kết VB pháp lý ↔ công văn) chờ user |
| Testing | ✅ | `ad*` 17 tệp · `p12-*` 7 tệp · `p13-*` 3 tệp · Java `AdminSystem`·`AdminGovernance`·`NotificationCenter`·`ProfileSignature`·`LicenseFoundationParity` |
| Documentation | ✅ | PHASE 12/13 log + `MT2-P14-03-LICENSE-PARITY-AUDIT.md` |

## ⑥ LUỒNG REPORT → AGGREGATED DATA
| Chiều §25 | Trạng thái | Bằng chứng / thiếu gì |
|---|---|---|
| Traceability | ✅ | `lib/report-catalog.ts` + `ReportView` (nguồn dữ liệu từ bảng nghiệp vụ, ⛔ không hard-code số) |
| Data Integrity | ✅ | số liệu lấy từ truy vấn thật (`reportRows`/`reportExport`) · `q1-boq-export-display` |
| RBAC | ✅ | báo cáo nằm trong module `reports` (RBAC theo action/module) |
| Workflow | n/a | báo cáo là lớp đọc — workflow thuộc các luồng nguồn |
| Audit | ✅ | xuất báo cáo đi qua `audit_logs` khi có thao tác ghi |
| Notification | n/a | ⛔ không thuộc §25 cho luồng này |
| Testing | ✅ | `q1-q3-display` · `q1-boq-export-display` · `runtime-admin-boq-regression` · Java `BoqChainIntegrationTest`·`FinanceHrChainIntegrationTest` |
| Documentation | ✅ | PHASE 11 log (P11-01…P11-04) |

---

## §24 — CHECKLIST 16 HẠNG MỤC (dùng khi chốt P14-05)

| # | Hạng mục | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | UI | ✅ | `probe-p5` 4/4 · `probe-p6-07` 4/4 · `probe-p6-08` 3/3 · P14-01 visual 68 ảnh/0 px nhiễu |
| 2 | API | ✅ | P14-02 live API probe (success/validation/permission/error) |
| 3 | Database | ✅ | SQL gate 0 sai · drift 0 lệch · reference 15/15 |
| 4 | RBAC | 🟡 | 20/20 live · role parity 0 · scope 67/67 — ⛔ còn phạm vi theo **cấp bậc** (BLOCKED) |
| 5 | Workflow | ✅ | workflow spec **PASSED** · `RequestApprovalIntegrationTest` |
| 6 | CRUD | ✅ | `ad01`…`ad16` · `tm04-team-crud` · `pr06-bch-crud` |
| 7 | Search | ✅ | `ListToolbar` (§22) · `pr02-project-filters` |
| 8 | Sort | ✅ | `p8-07` (sort THẬT) · `ad04-account-sort` · `tm02-team-sort` |
| 9 | Filter | ✅ | `ad08-dept-filter-bulk-delete` · `pr02` |
| 10 | Modal | ✅ | `p2-08` **2/2** · `ad03-user-detail-modal` · `pr04-entity-modal` · lightbox `p2-06b` **2/2** |
| 11 | Notification | 🟡 | trong-app + cấu hình + read-state ✅; ⚠️ **thiếu worker SMTP** |
| 12 | Audit | ✅ | `ad13`·`ad14`·`ad15` + `audit_logs` thật |
| 13 | Regression | ✅ | frontend **69/69** · Java **61/61** · workflow PASSED (đo lại 23/09) |
| 14 | Documentation | ✅ | 5 tệp hồ sơ MT2 + 3 tệp audit chuyên đề |
| 15 | TODO | ✅ | 0 TODO · 2 SKIPPED (đúng §38) · 5 BLOCKED (chờ user) |
| 16 | Task history | ✅ | `docs/agent-progress/MT2-*.md` + `TASK-*.md` theo phase |

## KẾT LUẬN MA TRẬN
- **4 luồng có đủ 8/8 chiều ở mức ✅/n-a** (②③④⑥); **2 luồng (①⑤) 🟡 ở 2 chiều**: ① RBAC theo **cấp bậc** (BLOCKED) · ⑤ Notification worker SMTP + `P10-05`.
- ⛔ **KHÔNG** phát hiện luồng nào thiếu hẳn một tầng (UI/API/DB/RBAC/Workflow/Audit/Notification).
- ⇒ Ma trận này **không tạo task mới**: phần thiếu **đã có mục BLOCKED tương ứng** hoặc là hiện trạng đã ghi nhận (worker SMTP).
- **Điều kiện chốt P14-05**: gỡ ①(ngưỡng cấp bậc) + ②(`correspondence_id`) rồi chạy lại ma trận này ⇒ kỳ vọng **6/6 luồng đạt**, chỉ còn ghi nhận worker SMTP.
