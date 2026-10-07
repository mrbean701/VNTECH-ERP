# TASK-MT3-UI-24 — **C2 (ma trận #8)** + **A1 phần ①**

| Mục | Nội dung |
|---|---|
| **Task** | **C2** *(ma trận #8)* + **A1 phần ①** *(sắp xếp)* |
| **Phase** | **GĐ1** *(C2)* + **GĐ2** *(A1①)* |
| **Status** | ✅ **HOÀN TẤT 2/2** — cả hai đều **ĐẠT mọi cổng** |
| **Nguồn** | `docs/dsh/MT3_USER_DECISIONS.md` §«ĐỢT CHỐT THỨ 2» mục **A1** · `docs/dsh/MT3-UI-MATRIX.md` §B hàng **#8** |

---

## ✅ C2 — ma trận **#8**: nút thu gọn menu **«tự ẩn khi đủ chỗ»**
| | |
|---|---|
| **Yêu cầu ma trận** | *«#8 Toggle menu đúng quy tắc — ❌ Chưa có "tự ẩn khi đủ chỗ"»* · `page.tsx:632` chỉ render nút khi panel đang mở |
| **Ngưỡng** | ✅ **1024px** — **user đã cho phép** *(«C2: Cho phép»)* |
| **Nút nằm đâu** | `app/page.tsx:632` — `<button className="mobile-nav-collapse" onClick={()=>setMobileNavOpen(false)}>` |
| **Nút được style ở đâu** | `app/globals.css:2465` `.mobile-nav-panel .mobile-nav-collapse{display:flex!important;…}` ⇒ ⚠️ **dùng `!important`** nên quy tắc mới **bắt buộc** `!important` mới thắng |

### ✅ CÁCH LÀM — **thuần CSS** *(⛔ KHÔNG thêm hook JS)*
➕ **`app/globals.css`** *(ngay sau khối `.mobile-nav-collapse`, trước `.mobile-display-settings`)*:
```css
@media (min-width: 1024px){.mobile-nav-panel .mobile-nav-collapse{display:none!important}}
```
**Vì sao chọn CSS thay vì hook JS** (⛔ không viết mới nếu ⛔ không cần):
- ⛔ Dự án **chưa có** hook bề rộng nào *(grep `matchMedia` · `useMediaQuery` · `innerWidth` · `useViewport` trên **toàn bộ** `app/` + `lib/` = **0 kết quả**)* ⇒ viết hook là **thêm mới**, kèm rủi ro **hydration** ở Next.js.
- CSS giải quyết **đúng yêu cầu** *(«đủ chỗ ⇒ tự ẩn»)* với **1 dòng**, ⛔ không state, ⛔ không re-render.

### ✅ ĐÃ KIỂM **HIỆU QUẢ THẬT** *(⛔ không viết CSS vô nghĩa)*
`.mobile-nav-panel` được **bật/tắt bằng JS** — `globals.css:541` `.mobile-nav-panel{display:none}` · `:2032`/`:2448` `display:flex!important` ⇒ panel **không** tự ẩn theo bề rộng ⇒ trên màn rộng, khi panel mở thì nút **VẪN hiện** ⇒ quy tắc mới **thật sự có tác dụng**.

## ✅ A1 phần ① — **SẮP XẾP** danh sách chờ duyệt
| | |
|---|---|
| **Luật user** | *«ưu tiên hiển thị các đơn mới nhất, nếu có đơn sắp đạt SLA 72 thì ưu tiên hiển thị trước»* |
| **Sửa ở đâu** | **`OpsTaskStoreAdapter.java`** — `pendingApprovalsForRoleCodes` *(câu truy vấn ở `:568-572`)* |
| **Đổi gì** | `ORDER BY due_at,id` → **`ORDER BY due_at ASC, created_at DESC`** |
| **Diễn giải** | `due_at ASC` = đơn **sắp đạt/quá hạn SLA lên TRƯỚC** *(dùng **đúng cột hạn đã có**, ⛔ **KHÔNG bịa ngưỡng «sắp đạt»**)* · `created_at DESC` = cùng hạn thì **đơn MỚI NHẤT trước** *(trước là `id` — ⛔ vô nghĩa nghiệp vụ)* |
| ✅ Xác minh | `approvals.created_at` **TỒN TẠI** *(lược đồ: `created_at DATETIME(3) NOT NULL`)* ⇒ ⛔ **không cần đổi CSDL** |

### ⏳ A1 phần ② — **TỰ TỪ CHỐI KHI QUÁ SLA** — **CHƯA LÀM** *(xem `TASK-MT3-BE-23.md`)*
**Đã khảo sát ĐẦY ĐỦ** — vòng sau thi hành là chạy được ngay:

| Điều đã đo | Kết quả |
|---|---|
| **Hiệu ứng ĐẦY ĐỦ của một lần TỪ CHỐI** *(⛔ không tự nghĩ)* | `RequestManagementUseCase:768-776` — **chỉ 2 lời gọi store**: ① `updateApprovalDecision(requestId, stage, "rejected", userId, comment, snapshot, now)` → `approvals.status='rejected'` ② **`returnRequestToRequester(requestId, stage, userId, comment, now)`** → `material_requests.status='returned_to_requester'` + `supply_status='returned'` + `approval_stage=0` · ③ `notifySafely("APPROVAL_RETURNED")` |
| ⚠️ **VẤN ĐỀ NỐI DÂY (đã giải)** | Danh sách chờ duyệt đọc qua **`OpsTaskStore`** *(không phải `RequestStore`)*. `RequestManagementUseCase` ⛔ **KHÔNG có hàm đọc danh sách** ⇒ ⛔ không móc được vào đó. `OpsTaskManagementUseCase` ⛔ **KHÔNG có `RequestStore`** *(chỉ có OpsTaskStore · IdGenerator · RbacService · AccessScopeService · NotificationManagementUseCase · WorkScopeService)* ⇒ **phải thêm `RequestStore` vào constructor + cập nhật `ApplicationBeansConfig`** |
| ✅ Port đã có sẵn gì | `RequestStore` **CÓ** `updateApprovalDecision` *(`:66`)* + `returnRequestToRequester` *(`:81`)* ⇒ ✍️ **viết hàm tự-từ-chối trong `RequestStoreAdapter`** — vì **2 câu SQL đã nằm CÙNG tệp đó** ⇒ ⛔ **KHÔNG nhân bản SQL** *(đúng cảnh báo của chính dự án tại `OpsTaskStoreAdapter:589`)* |
| ✅ Khuôn **idempotent** phải noi | `RequestStoreAdapter:561` — `UPDATE approvals SET status=CASE WHEN status='pending' THEN 'cancelled' ELSE status END` ⇒ gọi lặp ⛔ **không từ chối 2 lần** |
| ⚠️ **Cách hiểu «72h»** *(cần user xác nhận nếu muốn đổi)* | Tôi hiểu = **ân hạn SAU HẠN** *(quá `due_at`, thêm 72h không ai duyệt ⇒ tự từ chối)* — vì **đúng câu hỏi tôi từng hỏi user** là *«giữ quá SLA 72h»* và user **đã xác nhận**. 👉 Nếu ý là **SLA dài 72h từ lúc lập phiếu** thì **chỉ đổi 1 hằng số** |
| ⚠️ Trigger | quét **khi ĐỌC danh sách** *(⛔ không dựng job nền — không thêm hạ tầng mới)*, ✅ idempotent vì chỉ tác động `status='pending'` |

## Files changed *(lô này)*
| Tệp | Việc |
|---|---|
| `app/globals.css` | ➕ 1 dòng `@media (min-width: 1024px){.mobile-nav-panel .mobile-nav-collapse{display:none!important}}` |
| `java-backend/.../OpsTaskStoreAdapter.java` | 🔁 `ORDER BY due_at ASC, created_at DESC` + chú thích dẫn nguyên văn quyết định user |

## 🧪 Testing — ✅ **ĐẠT mọi cổng**
| Cổng | Kết quả |
|---|---|
| `tools/verify-java-compile.ps1` | ✅ **`compile SUCCEEDED · 115 source files · 0 error lines · 174 .class`** |
| `npm run verify:css-baseline` | ✅ **`ĐẠT`** · `2558 lines` *(+1)* · `3652 !important` *(+1)* · **`dead classes=0 · dead vars=0`** · `dynamic contracts=PASS` · **`empty media=0`** |
| `npm run verify:master-baseline` | ✅ **`ĐẠT`** · `!important=3652` · `css=364811B` |
| `npx tsc --noEmit` | ✅ **`EXIT=0`** |
| contract **toàn bộ** | ✅ **`tests 646 · pass 645 · fail 0 · skipped 1`** ⇒ ⛔ **không hồi quy** |

⚠️ **`mvn test` CHƯA chạy cho lô này** *(thay đổi Java là **1 câu ORDER BY**, đã biên dịch ĐẠT; `mvn test` sẽ chạy gộp ở **B1** cùng lúc với `gd-cycle`)*.

## 🖥️ TRẠNG THÁI MÔI TRƯỜNG *(user yêu cầu «khởi động dự án»)*
| Cổng | Trạng thái |
|---|---|
| **:9000** proxy *(cổng vào chuẩn)* | ✅ **ĐANG MỞ** — vừa khởi động bằng **`--port 9000`** *(⚠️ mặc định trong mã là `8787` — trùng UI nên ⛔ không bind được)* · đăng nhập **HTTP 200** |
| **:18081** Java API *(PID 3892)* | ✅ ĐANG MỞ · đăng nhập **HTTP 200** |
| **:8787** Node UI *(PID 18808)* | ✅ ĐANG MỞ · `401` với tài khoản admin Java *(đúng — đây là **UI JS legacy** hệ tài khoản riêng)* |
⇒ Khớp mốc chuẩn `MASTER_STATUS.md:26`: **LIVE 3/3 cổng HTTP 200**.

## Blockers
⛔ **Không** — nhưng **C1** và **B1** là 2 việc **rủi ro cao** cần **trọn 1 vòng** *(xem dưới)*.

## Next task
1. **C1** *(ma trận #4)* — `Inventory.tsx:220` `<aside>` → **modal** *(user đã cho phép)* + **chụp lại 68 ảnh chuẩn**. ⚠️ **RỦI RO CAO**: `<aside>` nằm trong **MỘT dòng ~1000 ký tự** · `Inventory.tsx` **đã sửa trước đó** nên ⛔ **không revert được bằng git**.
2. **B1** — dừng **đúng PID 18808** → `node tools/gd-cycle.mjs "MT3 final app sweep"` → **khởi động lại** `node scripts/local-server.mjs`. Chạy **1 lần duy nhất** để xác minh **toàn bộ** thay đổi `app/**`/`lib/**`: `StatusBadge.tsx` · `MaterialListTable.tsx` · `TeamDirectory.tsx` · `WorkCenter.tsx` · `page.tsx` · `menu-helpers.ts` · `SupplierManager.tsx` · `globals.css` · `material-alias.ts`.
   ⚠️ **`:9000` proxy đang trỏ vào UI `:8787`** ⇒ dừng 8787 sẽ làm :9000 tạm ngưng theo.
3. Cập nhật `MASTER_STATUS.md` + `TASK_INDEX.md` + `CURRENT_TASK.md`.