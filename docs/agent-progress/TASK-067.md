# TASK-067 — Cổng chống "BẪY THỨ TỰ" + BÁC BỎ BÁO ĐỘNG GIẢ "128 action thiếu audit" + xác minh lại TASK-025

**Trạng thái:** ✅ DONE — 3 phần, đều có bằng chứng; đã commit
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Cổng:** `tools/probe-put-order.mjs` (mới) · `tools/probe-audit-coverage.mjs` (vá để tự đối chiếu dữ liệu)

> **Bài học chung của task này:** hai hạng mục trong TODO của tôi — *"SlaComplianceWorker hỏng âm thầm mỗi giờ"* và *"audit trail thiếu 128 action"* — **đều SAI**. Cả hai đã được kiểm bằng dữ liệu/log thật và bị bác bỏ. **Không được truyền tiếp một con số đã cũ mà không đo lại.**

---

## 1. Cổng chống BẪY THỨ TỰ (`tools/probe-put-order.mjs`)

**Vì sao:** TASK-066 vừa vá một lỗi thật đúng dạng này — `data.put("engineRoleProfiles", data.get("businessRoleEngineProfiles"))`
đặt **trước** dòng ghi khoá nguồn ⇒ `engineRoleProfiles = null` cho **mọi** tài khoản, kể cả admin (Known Problems #50).
Cổng theo TÊN KHOÁ và cổng theo TẬP CỘT đều **mù** với lớp lỗi này: khoá CÓ, cột CÓ, chỉ **THỨ TỰ** sai.

**Phép đo:** dựng bảng dòng của mọi `data.put("K", …)`, rồi với mỗi phép gán `data.put("X", data.get("Y"))` /
`data.getOrDefault("Y", …)` kiểm `lineOf(Y) < lineOf(X)`.

**Cổng phải tự chứng minh (bài học #103):** chạy 3 ca **dựng sẵn có đáp án biết trước** —
đúng thứ tự ⇒ phải IM · ngược thứ tự ⇒ phải BẮT · khoá nguồn không hề được ghi ⇒ phải BẮT. **3/3 ĐẠT.**

**Kết quả trên mã thật:** 96 khoá `data.put` · **3 phép gán phụ thuộc thứ tự** · **0 vi phạm**:
| Dòng | Phép gán | Nguồn ở dòng |
|---|---|---|
| 836 | `approvalStages` ← `approvalStageCatalog` | 706 ✓ |
| 1692 | `adminMaterialCategories` ← `materialCategories` | 172 ✓ |
| 1693 | `adminMaterialSubcategories` ← `materialSubcategories` | 175 ✓ |

**Phát hiện thêm (10 khoá bị GHI NHIỀU LẦN):** đã kiểm 3 ca đáng nghi nhất —
`workItemEvents` (1490/1493) là **nhánh `if (workItems.isEmpty())`** · `centralInventory`/`centralReturns` (1610/1611)
là **bộ lọc theo vai trò kho-site** (JS `:622`) — **đều hợp lệ**, không phải ghi đè nhầm.

**Giới hạn:** chỉ bắt dạng gán **TRỰC TIẾP** qua `data.get*`; gán qua biến trung gian không bị bắt;
và cổng **không** kiểm được phép gán nằm trong nhánh điều kiện (`if (admin)`) — đó là lớp
*"khoá có nhưng rỗng theo vai trò"*, do `probe-task066-role-shape.mjs` đo.

---

## 2. BÁC BỎ BÁO ĐỘNG GIẢ: "128 action thiếu audit"

**Con số cũ:** `probe-audit-coverage.mjs` báo *"KHE HỞ: JS ghi nhật ký mà lớp use-case Java KHÔNG ghi: **128 action**"*.
Con số này từng bị đọc thành *"128 action không được ghi nhật ký"* và suýt dẫn tới việc **port hàng loạt `audit(...)` không cần thiết**.

**Kiểm bằng dữ liệu thật:**

| Phép đo | Kết quả |
|---|---|
| `audit_logs` tổng | **825 dòng** · **39 action** khác nhau |
| Dòng mang `module_key` + `ip_address` (hai cột **chỉ `AuditTrailFilter` điền**) | **427** |
| `decide_approval` | **173** dòng — **173/173** do FILTER ghi, use-case 0 |
| `create_self_work_item` | **28/28** do FILTER |
| `update_boq_contract_prices` | **9/9** do FILTER |
| `save_email_settings` | **6/6** do FILTER |
| `set_material_norm_status` | **6/6** do FILTER |
| Trong 128 action "khe hở": có dòng nhật ký | **11** (8 trong đó do FILTER) |

⇒ **Nhật ký KHÔNG thiếu.** `AuditTrailFilter` (tầng web, P6) ghi **một dòng cho MỌI POST `/api/system` thành công**
(trừ 7 action trong `SKIP_ACTIONS`: login/logout/setup/system_level_impact/check_login/heartbeat/ping).

**Cổng đã được vá để không ai hiểu sai lần nữa:** `probe-audit-coverage.mjs` nay
(a) đổi nhãn thành **"KHE HỞ Ở TẦNG USE-CASE"** kèm cảnh báo **"KHÔNG có nghĩa là action đó không có dòng nhật ký nào"**,
(b) **tự truy vấn `audit_logs`** và in số action trong danh sách "khe hở" **thực sự có dòng**, cùng ví dụ cụ thể,
(c) nói rõ **chỉ đối chiếu được các action ĐÃ từng chạy**.

### 2b. CÒN LẠI THẬT (mới, chưa vá): GHI TRÙNG + LỆCH TỪ VỰNG

| | JS | Java |
|---|---|---|
| Số dòng mỗi thao tác | **1** | **2** (khi action vừa có use-case audit vừa qua FILTER) |
| Mã hành động | mã nghiệp vụ (`CREATE`, `UPDATE`, `APPROVE_PARTIAL`…) | FILTER ghi **tên action thô** (`create_request`, `save_email_settings`…) |
| `entity_type` / `entity_id` | khai **tường minh** | FILTER **suy đoán** (moduleKey + id đầu tiên trong payload) |
| `after_json` | object chi tiết đã lọc | payload thô (đã che bí mật) |

**Bằng chứng đo được:** `create_request` **80 dòng** (FILTER) **+ `CREATE` 58 dòng** (use-case) — **cùng một nghiệp vụ, hai mã khác nhau**.

⚠️ **Vì sao CHƯA sửa:** cách sửa hiển nhiên là cho FILTER bỏ qua các action đã có audit ở tầng use-case.
Nhưng cổng đo theo **LỚP use-case**, không theo từng METHOD — bỏ dòng FILTER của một action mà use-case
**không thực sự ghi** ⇒ **MẤT dấu vết pháp lý**. **Không đánh cược vào một tính năng an toàn** ⇒ phải kiểm
mức METHOD cho từng action trước (hạng mục riêng, TASK-068).

---

## 3. Xác minh lại TASK-025 (`SlaComplianceWorker`) — dòng TODO bị CŨ

TODO ghi *"SlaComplianceWorker hỏng âm thầm mỗi giờ (cột `overdue_at` không tồn tại)"*. Thực tế **đã sửa ở commit #34**:

* mã nay là `UPDATE supply_workflow_steps SET status='overdue',updated_at=? WHERE id=? AND status='pending'` (không còn `overdue_at`) và `TASK-025.md` ghi DONE;
* **log thật hôm nay:** `INFO c.v.e.i.worker.SlaComplianceWorker : SLA worker: 0 supply steps quá hạn; 0 payment plans quá hạn; 4 BCH chờ xác nhận.` — chạy **60 giây sau khi khởi động**, không còn dòng `WARN` nào;
* **đối chiếu DB:** `supply_workflow_steps` = **29 `overdue`** · 27 `completed` · **0 `pending` quá hạn** ⇒ worker đã và đang dọn đúng; `payment_plans` = 2 `overdue`; `company_settings` = `po_sla_hours 24` / `bch_confirmation_sla_hours 8`.

⇒ Đã sửa dòng TODO cũ trong `MASTER_STATUS.md` (đánh dấu **ĐÃ XONG Ở #34**, kèm bằng chứng đo lại).

---

## 4. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `tools/probe-put-order.mjs` | **mới** — cổng chống bẫy thứ tự, có đối chứng dựng sẵn 3/3 |
| `tools/probe-audit-coverage.mjs` | đổi nhãn "khe hở" + **tự đối chiếu `audit_logs`** để con số không bị đọc sai |
| `docs/agent-progress/MASTER_STATUS.md` | bác bỏ báo động giả kèm bằng chứng số · ghi nhận GHI TRÙNG · sửa dòng TODO TASK-025 đã cũ · CURRENT TASK → TASK-068 |
