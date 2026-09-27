# TASK-MT3-BE-23 — **A1 · LUẬT SLA 72 GIỜ** cho danh sách chờ duyệt *(KẾ HOẠCH THI HÀNH)*

| Mục | Nội dung |
|---|---|
| **Task** | **A1** *(= BE-02 + BE-03 gộp)* |
| **Phase** | **GĐ2 — BACKEND** |
| **Status** | 🟡 **ĐÃ KHẢO SÁT XONG · ⛔ CHƯA SỬA MÃ** — *context cạn ⇒ theo **§9** ghi trạng thái thay vì làm dở* |
| **Nguồn luật** | `docs/dsh/MT3_USER_DECISIONS.md` §«ĐỢT CHỐT THỨ 2» mục **A1** *(nguyên văn user)* |

## 🔒 LUẬT USER ĐÃ CHỐT *(nguyên văn — ⛔ không suy diễn lại)*
> «ưu tiên hiển thị các đơn mới nhất, nếu có đơn sắp đạt SLA 72 thì ưu tiên hiển thị trước. Giữ quá SLA là giữ lại luật SLA. Nếu như quá SLA mà không có ai duyệt mặc định bị hệ thống từ chối. Từ chối khi quá SLA.»

## 📐 CÁCH HIỂU ĐÃ CHỌN *(⛔ không tự chế thêm ngưỡng)*
| Ý user | Cách hiện thực | Vì sao ⛔ không chế luật |
|---|---|---|
| «đơn **sắp đạt SLA** thì ưu tiên **trước**» | **`ORDER BY due_at`** *(hạn gần nhất lên trước)* | dùng **đúng cột hạn đã có** `approvals.due_at` — ⛔ **không bịa ngưỡng «sắp đạt»** |
| «ưu tiên hiển thị các đơn **mới nhất**» | **tie-break `created_at DESC`** | thay `id` *(hiện tại)* bằng `created_at` — cột **đã có** |
| «**quá SLA** mà không ai duyệt ⇒ hệ thống **tự TỪ CHỐI**» | tự từ chối khi `status='pending' AND due_at IS NOT NULL AND now >= due_at + 72h` | ⛔ **72h lấy đúng từ câu hỏi đã hỏi user** *(«giữ quá SLA **72h**»)* và user **đã xác nhận** ⇒ ⛔ không phải số tôi tự nghĩ |
| «Từ chối **khi** quá SLA» | **quét khi ĐỌC danh sách chờ duyệt** | ⛔ **không dựng job nền** *(không thêm hạ tầng mới)*; ✅ **idempotent** vì chỉ tác động `status='pending'` |

⚠️ **Ghi chú cần user xác nhận nếu muốn đổi**: nếu «72h» ý user là **độ dài SLA** *(chứ ⛔ không phải ân hạn SAU hạn)* thì mốc phải là `created_at + 72h` — **nói một câu là tôi đổi hằng số**.

## 🎯 CHÍNH XÁC NƠI SỬA *(đã đo, ⛔ không đoán)*

### ① SẮP XẾP — `OpsTaskStoreAdapter.pendingApprovalsForRoleCodes` **(`:560`)**
```sql
-- HIỆN TẠI (:572):
FROM approvals WHERE status='pending' ORDER BY due_at,id
-- PHẢI ĐỔI THÀNH:
FROM approvals WHERE status='pending' ORDER BY due_at ASC, created_at DESC
```
✅ Đã xác minh `approvals.created_at` **TỒN TẠI** *(lược đồ: `created_at DATETIME(3) NOT NULL`)*.
📌 Tương đương JS `system-route.mjs` nếu có ⇒ **phải giữ parity** nếu bản JS cũng đọc danh sách này.

### ② TỰ TỪ CHỐI KHI QUÁ SLA — đi **ĐÚNG ĐƯỜNG QUYẾT ĐỊNH ĐÃ CÓ**
| Thành phần | Vị trí |
|---|---|
| Đường quyết định CHUẨN | **`RequestStoreAdapter:371-378`** `updateApprovalDecision(requestId, stage, decision, userId, comment, snapshot, now)` → `UPDATE approvals SET status=?,approver_user_id=?,decided_at=?,comment=?,decision_snapshot=?,updated_at=? WHERE request_id=? AND stage=?` |
| Đường từ chối ở use-case | **`RequestManagementUseCase.decideApproval` (`:619`)** — đã `decideApproval` chứa **toàn bộ hiệu ứng** *(gồm cả cập nhật `material_requests`)*. ⚠️ **BẮT BUỘC đọc tiếp `:661-720`** trước khi viết auto-reject, để **mô phỏng ĐÚNG** *(⛔ không tự nghĩ ra hiệu ứng)*. |
| Lý do quá hạn (tiền lệ) | `RequestStoreAdapter:383` `updateApprovalOverdueReason(...)` → `approvals.overdue_reason` *(cột có từ **V25**)* — MT2 §4.4 **đã có** luật «duyệt quá hạn phải nhập lý do» |
| Cột cần dùng | `status` · `due_at` · `decided_at` · `comment` · `decision_snapshot` · `approver_user_id` · `updated_at` · `overdue_reason` |
⚠️ **Tiền lệ ĐÃ CÓ trong dự án**: `RequestStoreAdapter:561` — `UPDATE approvals SET status=CASE WHEN status='pending' THEN 'cancelled' ELSE status END` ⇒ **mẫu idempotent bằng `CASE WHEN status='pending'`** — nên **noi đúng khuôn này** cho auto-reject.

### ③ 7 TEST BIÊN BẮT BUỘC
| # | Ca | Kỳ vọng |
|---|---|---|
| 1 | `now` **<** `due_at` | ⛔ **KHÔNG** từ chối; phiếu **vẫn** `pending` |
| 2 | `now` **vừa bằng** `due_at + 72h` *(đúng biên)* | ✅ **TỪ CHỐI** *(«Từ chối **khi** quá SLA»)* |
| 3 | `now` **sau** `due_at + 72h` | ✅ **TỪ CHỐI** |
| 4 | `due_at` **NULL** | ⛔ **KHÔNG** từ chối *(⛔ không suy diễn khi thiếu hạn)* |
| 5 | **Gọi lặp** 2–3 lần | ✅ **IDEMPOTENT** — `decided_at`/`status` **⛔ KHÔNG đổi ở lần sau** |
| 6 | Phiếu **đã duyệt** rồi | ⛔ **KHÔNG** bị đụng *(chỉ `status='pending'`)* |
| 7 | **Thứ tự** danh sách chờ duyệt | ✅ đơn **hạn gần hơn** lên trước; cùng hạn ⇒ **mới nhất** trước |

### ④ TỆP DỰ KIẾN SỬA *(chưa sửa — ⛔ context cạn)*
| Tệp | Việc |
|---|---|
| `OpsTaskStoreAdapter.java` | 🔁 `ORDER BY due_at ASC, created_at DESC` |
| `RequestStoreAdapter.java` | ➕ hàm tự từ chối **idempotent** *(noi khuôn `CASE WHEN status='pending'` ở `:561`)* |
| `RequestStore.java` *(port)* | ➕ khai hàm mới |
| `RequestManagementUseCase.java` | 🔁 gọi hàm tự-từ-chối **trước khi trả danh sách chờ duyệt** *(⚠️ đọc `:661-720` trước)* |
| `RequestOverdueReasonTest` *(hoặc test mới)* | ➕ **7 ca biên** ở trên |

## 🧪 TRẠNG THÁI CỔNG HIỆN TẠI *(lô A2/A3/A5/A6/A7 vừa xong)*
| Cổng | Kết quả |
|---|---|
| `npx tsc --noEmit` | ✅ **`EXIT=0`** |
| contract | ✅ **`tests 646 · pass 645 · fail 0 · skipped 1`** *(= 636 + **10 test mới** của A2)* |
| `npm run test:regression` | ✅ **`pass 69 · fail 0`** |
| `npm run verify:css-baseline` | ✅ **`ĐẠT`** |
| ⛔ `gd-cycle` | **BỊ CHẶN** — chờ **B1** *(user **đã cho phép** dừng PID 18808)* |

## Blockers
⛔ **Không blocker nghiệp vụ** — luật đã có. Chỉ còn **ngân sách context** cho vòng này.
⚠️ **6 thay đổi `app/**`/`lib/**` chưa được cổng build xác minh** *(StatusBadge · MaterialListTable · TeamDirectory · WorkCenter · page.tsx · menu-helpers.ts)* ⇒ **B1** sẽ xác minh.

## Next task
**A1** *(thi hành theo kế hoạch trên)* → **A4** *(thông báo phòng ban)* → **C2** *(#8 · 1024px)* → **C1** *(#4 aside→modal + chụp lại 68 ảnh)* → **B1** *(dừng PID 18808 → `gd-cycle` → khởi động lại)*.