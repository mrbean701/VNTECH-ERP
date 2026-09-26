# DANH SÁCH TASK ĐÃ HOÀN THÀNH & ĐANG LÀM — VNTECH ERP V5.3.0 (MASTER TASK 1 + 2)

Bản cập nhật: 23/09/2026 · Bộ tài liệu bàn giao hệ thống.

Tài liệu này tổng hợp toàn bộ công việc của **Master Task 1 (110 mục / 12 phase)** và **Master Task 2 (thực thi chi tiết, TASK-xxx)** theo nguồn sự thật `docs/25_TODO_ROADMAP.md`, `docs/28_DANH_SACH_110_MUC_MASTER_TASK.md`, `docs/agent-progress/MASTER_STATUS.md`, `docs/agent-progress/TASK_INDEX.md`, `docs/agent-progress/MT2-PHASE-6-AUDIT.md`.

---

## 1. TỔNG QUAN TIẾN ĐỘ

### 1.1 Master Task 1 — 110 mục / 12 phase
| Nguồn đếm | DONE | TODO | BLOCKED | Tổng | Ghi chú |
|---|---|---:|---:|---:|---:|---|
| `25_TODO_ROADMAP.md` (cột TT — **nguồn sự thật**, cổng `probe-roadmap-progress.mjs` đọc) | **108** (98,2%) | 1 | 1 | 110 | F-01 BLOCKED duy nhất |
| `docs/28` (bản chụp 19/09 — CŨ, chưa cập nhật) | 48 (44%) | 61 | 1 | 110 | tài liệu đã lỗi thời, cần chạy lại generator |
| AGENTS.md mốc cũ 17/09 | 31 (28,2%) | — | 1 | 110 | lịch sử |

> ⚠️ **Mâu thuẫn số liệu đã được dung hoà:** con số tin cậy nhất hiện tại là **DONE 108 / BLOCKED 1 (F-01) / TODO 1**. `docs/28` là bản chụp cũ 19/09, không phản ánh các mục DONE sau đó (TASK-098, TASK-100…107, 117, 121…141). Mọi phase theo cột TT đã DONE trừ PHASE 10.

### 1.2 Tiến độ theo Phase (MASTER_STATUS đã xác minh)
| Phase | DONE/tổng | Trạng thái |
|---|---:|---|
| PHASE 0 — AUDIT | 16/16 | ĐÓNG |
| PHASE 0B — BẢO MẬT | 10/10 | ĐÓNG |
| PHASE 1 — UI/UX | 17/17 | ĐÓNG |
| PHASE 2 — MUA HÀNG | 9/9 | đóng (P-01 đã rollback theo yêu cầu user — chưa chốt) |
| PHASE 3 — CÔNG VIỆC | 10/10 | ĐÓNG |
| PHASE 4 — DỰ ÁN | 6/6 | ĐÓNG 20/09 (TASK-098) |
| PHASE 5 — KHO | 4/4 | ĐÓNG (W-03 xong 21/09 — gỡ chặn) |
| PHASE 6 — TỔ ĐỘI | 6/6 | ĐÓNG (TM-04 có BLOCKED nội bộ — nhánh sửa không có action) |
| PHASE 7 — QUẢN TRỊ | 16/16 | ĐÓNG hành chính; AD-14/AD-16 nay đã DONE (21/09) |
| PHASE 8 — WORKFLOW | 6/6 | ĐÓNG TRỌN |
| PHASE 9 — BÁO CÁO | 5/5 | ĐÓNG |
| PHASE 10 — TƯƠNG LAI | 3/5 | **F-01 BLOCKED** + 1 TODO |

---

## 2. PHẦN MỤC CHƯA HOÀN THÀNH (2 mục)

| Mục | Phase | Lý do chưa xong |
|---|---|---|
| **F-01 — MEP** | PHASE 10 | **BỊ CHẶN:** chờ người dùng làm rõ nghiệp vụ MEP (8 module chưa rõ phạm vi) — chờ spec |
| *(1 mục TODO còn lại)* | PHASE 10 | thuộc lô F-02…F-05, chưa có dữ liệu DONE trong cột TT |

---

## 3. MASTER TASK 2 — NHẬT KÝ THỰC THI TASK (TASK-001…141)

### 3.1 Phạm vi
- `docs/agent-progress/TASK_INDEX.md` phủ TASK-001…101 (+ vài mục khác).
- TASK-102…141 ghi ở các file riêng `docs/agent-progress/TASK-*.md`.
- TASK-104 · 118 · 119 · 120 · 129 · 136 · 138 **không tồn tại** (bỏ trống theo đánh số thực tế).
- Nguyên tắc: TASK-048…071 là nhánh **vá lỗi audit** (không ánh xạ 1-1 roadmap → cổng cố tình không cộng vào 110). Từ TASK-072 trở đi mới có ánh xạ 1-1 và được cộng.

### 3.2 Nhóm task theo miền
| Nhóm | Task | Nội dung | Trạng thái |
|---|---|---|---|
| **PHASE 1 UI nền tảng** | 072–090 | ListToolbar (19→25), DataTable 13 bảng, modal chuẩn không vượt viewport (U-10), tách page.tsx (U-11: 4037→3386 dòng), dọn mã chết cây workspace + 13 lớp CSS (U-09..U-12) | DONE |
| **PHASE 2 Mua hàng** | 103–115 → 117-141 | 30 bước audit phase2, PO con trong PR, duyệt động, 12/12 test case, P-07 tách NCC/Đối tác, P-08 liên kết, P-09 `requireRole` 5 call site | DONE (P-01 rollback) |
| **PHASE 3 Công việc** | T-02/T-03/T-04 | audit 32 cột `work_items`, 2 bảng mới `work_item_comments`/`work_item_participants` (Drizzle + Flyway V20), lọc `assigneeUserId` đúng | DONE |
| **PHASE 4 Dự án** | 098 | PR-01…06: 6 tab + toolbar, lọc 4 chiều, EntityDetailModal, CRUD BCH | DONE 20/09 |
| **PHASE 5 Kho** | 100 / 124 | W-01 tách 5 mục, W-02 audit 1:N, **W-03 "Tạo kho dự án?" GỠ CHẶN**, W-04 dashboard 8 chỉ số | DONE |
| **PHASE 6 Tổ đội** | 101 | TM-01…06: 6 tab, sort hoạt động→ngừng, tái dùng stock_issues/material_returns | DONE (TM-04 nội bộ) |
| **PHASE 7 Quản trị** | 102 / 107 | AD-01…16: 59 ca test (đỏ 25 → xanh 59); **AD-14** thêm cột `result` (drizzle 0162 + Flyway V22); **AD-16** quyết định user | 16/16 DONE |
| **PHASE 8+9 Workflow & Báo cáo** | 110 / 112 / 126 / 134 | duyệt động LIVE, 12/12 test case, 2 công cụ hiển thị audion/workflow, mô phỏng WF-MUAHANG-01 | DONE |
| **WF-XUẤT KHO** | 130–133 | WF-XUATKHO-01: pending_cht → issued → sinh GRN | DONE (nợ hiển thị issuedBy/approvedBy) |
| **PO/NCC/Đối tác** | 121–131 | tách menu NCC ↔ Đối tác, bảng `partners` riêng + màn quản lý + 3 action ghi, test 6 action NCC/Đối tác theo vai trò | DONE |
| **Sửa lỗi RBAC & form** | 135–141 | RBAC 3 action PO, 5 điểm form "Lập đề nghị cấp vật tư", explicit-empty contractId, F4 cổng duyệt owner, F3 PO đơn giá/tổng, phiếu không thuộc dự án hoạt động | DONE |
| **Java backend & Strangler Fig** | 042–069 / B01-B03 | retry_email, delete_project (ARCHIVE_FLOOR), audit 39 action, owner-checks, all_roles, đối chiếu tập cột 73 khoá, runbook build/chạy Java | DONE / đã ghi nhận |
| **Seed & dữ liệu thật** | 080 | department_module_permissions 51→480, user_module_permissions 484→926, team_members, work_items, 673.250.000 đúng | DONE |
| **Quyết định người dùng** | 092/093 | lô 9 quyết định Q1–Q7, Q9, Q10 (Q8 chờ chốt) | đa số xong |

### 3.3 Trạng thái riêng một số task quan trọng
| Task | Trạng thái | Ghi chú |
|---|---|---|
| TASK-086 (U-10) | DONE | modal chuẩn + vá 3 nút chết danh mục vật tư |
| TASK-088 (U-11) | DONE | tách page.tsx 4 vòng |
| TASK-090 | DONE | dọn cây workspace theo dự án (xử lý mục 7/5, TASK-031) |
| TASK-098 | DONE 20/09 | PHASE 4 đóng |
| TASK-102 | 14/16 (nay 16/16) | 14 DONE + AD-14/16 → DONE 21/09 |
| TASK-107 | DONE | AD-14 migration additive |
| TASK-112 | ĐẠT | 12/12 test case phase2 |
| TASK-117 | DONE 22/09 | P-09 `requireRole` 5 site + proof test 5/5 |
| TASK-121 / 122 / 123 | DONE | P-07 / Q1 Excel / P-08 |
| TASK-124 | DONE | W-03 gỡ chặn |
| TASK-125 | DONE CSDL+UI+JS | đường LIVE Java chưa (cấm build/restart) |
| TASK-126 / 127 | DONE | hiển thị audit/workflow; `partners` bootstrap |
| TASK-130 | GHI NHẬN | phát hiện issuedBy/approvedBy/status bind cứng "posted" — 2 nợ |
| TASK-132 / 133 | DONE | WF-XUATKHO-01 bước ①② / ③④⑤ |
| TASK-134 | HOÀN THÀNH (chờ xác nhận) | WF-MUAHANG-01 |
| TASK-135 | ĐÃ SỬA | RBAC 3 action PO |
| TASK-137 / 139 / 140 / 141 | ĐÃ SỬA | form, contractId, F4/F3, phiếu không thuộc dự án |

---

## 4. MASTER TASK 2 — TRẠNG THÁI THEO PHASE AUDIT (MT2-PHASE-6-AUDIT, 4482 dòng)

| Phase | Trạng thái |
|---|---|
| PHASE 0 — EXECUTION DIRECTIVE | tuân thủ |
| PHASE 2 một phần (đặc tả PR→Duyệt→PO→GRN, `phase2.md`) | phase2.md 19/31 (61,3%) — có ánh xạ một phần |
| PHASE 6 — Trung tâm phê duyệt | P6-01⇐P4-02, P6-05⇐P3-06, P6-06⇐P3-07 ✔; P6-04 đạt sẵn (chữ "Chưa tới lượt" ≠ "đang chờ" — thẩm mỹ) |
| PHASE 8 — Mua hàng | **11/11 DONE** |
| **PHASE 9 — KHO VẬT TƯ** | audit bước 1 xong 22/09 — **đang thực thi** |
| PHASE 10 — Tương lai (F-02..F-05) | F-03/F-04/F-05 audit DONE (TASK-116) — 6+8+7 câu nghiệp vụ chờ user |

### 4.1 PHASE 9 — Kho vật tư (đang làm)
| Mục | Nội dung | Trạng thái |
|---|---|---|
| P9-01 §7.1 (card kho) | card theo kho `[Kho A][Kho B][Kho C]` | **CHƯA ĐẠT** — đang hiện 4 KPI |
| P9-02 §7.2 | nhập/xuất modal + tabs TỒN KHO | **ĐẠT** (Receipt/Issue/Return/Transfer modal) |
| P9-03 §7.3 | CRUD + search/sort/filter danh sách kho | đang xử lý |
| P9-04 §7.4 | danh sách trang + 1 action: ①②③ DONE + LIVE; **④ chờ user quyết A/B** | BLOCKED một phần |
| P9-05 §7.5 | READ + Create + Search-Sort-Filter làm được; **UPDATE/DELETE chờ user** (OPTION A: BE đủ hiện tại — READ + Create; OPTION B: thêm BE mới) | chờ quyết định |
| P9-06 §7.6 | Cấp phát/Hoàn trả — menu chưa có `[Cấp phát][Hoàn trả]`; Stocktake.tsx đã có phiếu hoàn trả/kiểm kê/đối chiếu | chưa bắt đầu / một phần |

---

## 5. BLOCKED & CÂU HỎI CHỜ NGƯỜI DÙNG (QUAN TRỌNG ĐỂ TIẾP TỤC)

### 5.1 BLOCKED / tạm hoãn
| Hạng mục | Trạng thái |
|---|---|
| **F-01 — MEP** | chờ spec nghiệp vụ MEP |
| P9-04 §7.4 ④ — phương án A/B | chờ user quyết |
| P9-05 §7.5 ③④ UPDATE/DELETE | chờ user quyết (OPTION A vs B) |
| TM-04 — nhánh SỬA tổ đội | không có action ở cả 2 route; `scripts/**` cấm sửa |
| SLA thật 24h/8h | chờ xác nhận |
| License nhóm 6 (`vntech_license_*`) | tạm hoãn |
| SlaComplianceWorker lỗi SQL mỗi giờ | chưa xử lý (TASK-025) |
| Ghi chú `issuedBy/approvedBy` phiếu xuất | 2 nợ kỹ thuật |
| P-01 (tách MR·PR·PO 3 tab) | đã ROLLBACK 20/09 theo yêu cầu user |

### 5.2 Nhóm quyết định đang chờ (Lô 9 + PHASE 2, để chọn mục làm tiếp)
1. **Nhập kho (ST-1):** (A) thêm bước duyệt mới hay (B) nâng cấp `confirm_delivery`.
2. **Q8:** phương án duyệt giá R4 (đơn giá danh mục → PO).
3. **Q10-p2:** duyệt sửa 4 dòng `materials.system`.
4. **Q9-p2 / KP#83:** 1,5 tỷ thực thu > hợp đồng 673,25 triệu.
5. **KP#80 / KP#82:** cấp `can_create` phòng ban; đơn giá PO = 0 theo hợp đồng.
6. **KP#88/89/90:** bảng trần → DataTable; dọn mã chết; vá 3 nút vật tư.
7. **SLA 24h/8h + license nhóm 6.**
8. **D6 (TASK-055):** `approval_mode_snapshot` đóng băng `single` — giữ/sửa 2 phía/chỉ phiếu mới.
9. **P9-04 ④ + P9-05 (A/B) + P4-01 (`pho_giam_doc` chưa có role).**

---

## 6. NHỮNG TASK CHƯA CÓ FILE / KHOẢNG TRỐNG NHẬT KÝ
- Không có file: TASK-104, 118, 119, 120, 129, 136, 138.
- `TASK_INDEX.md` chỉ phủ tới TASK-101; các file riêng cho 102+ không thuộc index — cần ghép khi làm việc tiếp.

---

## 7. SỰ KIỆN SẮP TỚI & GHI CHÚ
- **166+ commit chưa push** trên nhánh `unity` (chính sách: chờ nghiệm thu thủ công; push sẽ thực hiện khi user cho phép).
- Nhánh song song `unity-p2-full-20260920` (TASK-122/126/137).
- PHASE 10 còn F-01 BLOCKED + 1 TODO — đây là **việc tiếp theo khả thi nhất** để đạt 110/110 sau khi có spec MEP.
- Cảnh báo khi viết báo cáo: **mục 113** khuyến cáo không trộn "PHASE 2 của master task" với `phase2.md` (đặc tả PR→PO) khi đếm tiến độ.

---
*Tài liệu thuộc bộ tài liệu bàn giao hệ thống VNTECH ERP V5.3.0 (23/09/2026). Nguồn: 25_TODO_ROADMAP.md, 28_DANH_SACH_110_MUC_MASTER_TASK.md, agent-progress/MASTER_STATUS.md, TASK_INDEX.md, MT2-PHASE-6-AUDIT.md.*