# KẾ HOẠCH 7 VIỆC KHỐI «CÔNG VIỆC» + AUDIT TAB «PHÒNG BAN»

Phiên: `ERP-SESSION-04` (`SESSION_D`) · Ngày: **08/10/2026** · Yêu cầu: user giao 7 việc (08/10)
Trạng thái: **KẾ HOẠCH + AUDIT** — ⛔ **chưa sửa mã** (lý do ở §5)

---

## 0. TL;DR (30 giây)

| | |
|---|---|
| **5/7 việc là FE thuần** | việc **1 · 2 · 3 · 4 · 7** — chỉ sửa `app/screens/WorkCenter.tsx` + `lib/menu-helpers.ts` + `app/page.tsx` |
| **Việc 6 cũng FE thuần** | vì BE **đã có** luật duyệt + thông báo (xem §4) |
| ⛔ **Chỉ 1 việc cần BE MỚI** | **việc 5 — nút «Nhận xét»**: action `add_work_item_comment` **đăng ký RBAC nhưng ⛔ CHƯA CÀI ở Java** ⇒ gọi vào trả **400** *«chưa được triển khai trên backend Java (Strangler Fig)»* |
| ⭐ **Tin rất tốt** | luật nghiệp vụ anh yêu cầu ở việc 5 & 6 **đã được cài sẵn ở backend** — nguyên văn: *«Người thực hiện chỉ Gửi kiểm tra; Trưởng phòng/người có thẩm quyền mới xác nhận Hoàn thành.»* |
| **2 chặn** | ① shell DSH hỏng (vòng 10) ⇒ ⛔ không `tsc`/`lint`/`gd-cycle` ② 3 tệp đích **thuộc 3 phiên khác** (`page.tsx`=S01 · `menu-helpers.ts`=S02 · `WorkCenter.tsx`=S03) |

---

## 1. 🕵️ AUDIT TAB «PHÒNG BAN» (việc 7) — vì sao anh thấy «rất nhiều thông tin»

Tab này hiện có **4 khối** (`WorkCenter.tsx:361-376`) — và ⭐ **3 trong 4 khối là 3 CÁCH NHÌN của CÙNG MỘT tập dữ liệu** (`scopedWork`):

| # | Khối (dòng) | Hiển thị gì | Dữ liệu | Bấm/kéo có ghi gì không | Tác dụng THẬT | Đề xuất |
|---|---|---|---|---|---|---|
| 1 | **«Việc phòng ban của tôi»** (`:363-365`) | Bảng nhiệm vụ của phòng user trực thuộc (`TaskTable`, `allowEdit=false`) | `deptWork` (đã lọc phạm vi) | ⛔ chỉ đọc | Danh sách việc phòng mình | ✅ **GIỮ** → thành **sub-tab 1** |
| 2 | **«Việc của tổ đội tôi tham gia»** (`:367-369`) | Bảng nhiệm vụ của tổ đội đang hoạt động (`TaskTable`, `allowEdit=false`) | `teamWork` | ⛔ chỉ đọc | Danh sách việc tổ đội | ✅ **GIỮ** → thành **sub-tab 2** |
| 3 | **`WorkKanban`** (`:370-371`) | **Board kéo-thả 3 chiều**: Ưu tiên × Trạng thái × Phân công | ⭐ **cùng `scopedWork`** | ✅ **GHI THẬT**: mỗi lần kéo gọi action `update_work_item_status` (`WorkKanban.tsx:193` — ⛔ không đổi state cục bộ) | Cùng tập việc, nhưng **đổi trạng thái nhanh bằng kéo-thả** | ⚠️ **ĐỀ XUẤT: chuyển thành nút "Chế độ xem: Bảng / Kanban"** (hoặc bỏ khỏi tab này) — ⛔ không xoá code (là phase `T-07`) |
| 4 | **`WorkHierarchy`** (`:375`) | **Cây 4 cấp**: Task → Team → Thành viên → **Hỗ trợ liên phòng** | ⭐ **cùng `scopedWork`** + teams/users | Bấm Team/Nhân sự mở `EntityDetailModal` (cổng `ProjectEntityModal`) | Xem **ai thuộc tổ đội nào**, ai **hỗ trợ liên phòng** | ⚠️ xem cảnh báo dưới |

### ⚠️ Vì sao khối 4 (`WorkHierarchy`) dễ thấy «không rõ tác dụng»
Phần **«Hỗ trợ liên phòng»** dựa trên bảng `work_item_participants` — mà action ghi bảng đó là **`set_work_item_participant`** ⛔ **CŨNG đăng ký mà CHƯA CÀI ở Java** (trả **400**, cùng lớp với `add_work_item_comment`).
⇒ Hiện tại: **chỉ XEM được ai hỗ trợ, ⛔ KHÔNG gán được** ⇒ đó là lý do khối này «có mà không dùng được».
⇒ **Đề xuất**: giữ nếu anh muốn xem; **hoặc** bỏ khỏi tab này và ghi vào nợ kỹ thuật (port `set_work_item_participant`).

### Kết luận audit
⭐ **Anh thấy nhiều thông tin vì 3 khối trình bày CÙNG 1 tập việc theo 3 dạng**: bảng · board · cây — ⛔ không phải 3 nghiệp vụ khác nhau. Yêu cầu mới (2 sub-tab) sẽ **giải quyết đúng gốc** vấn đề này.

---

## 2. KẾ HOẠCH 7 VIỆC (toạ độ chính xác)

| # | Việc anh yêu cầu | Sửa ở đâu (dòng hiện tại) | Loại |
|---|---|---|---|
| **1** | **Gom 5 mục menu thành 1 mục «Công việc» (hub)**, click → **Dashboard**, và **Dashboard lên đầu** | `lib/menu-helpers.ts:125-133` (5 mục → **1 mục** `key:"work"`, `view:"dashboard"`) · `WorkCenter.tsx:92` (`WORK_TABS`) · `:96` (`WORK_TAB_OF_VIEW`) · `app/page.tsx:442-457` (`workCenterViewFor`) · `:499-503` (`workMenuChildren`) | **FE** |
| **2** | **Đưa thanh search xuống ngay trên «danh sách công việc của bản thân»** | `WorkCenter.tsx:266-296` (bỏ `search` khỏi `ListToolbar`) → thêm ô tìm **trong tab Danh sách công việc** (trước bảng ở `:335-338`) | **FE** |
| **3** | Tab Dashboard hiển thị **việc của user đó**; **bỏ nút «Thao tác»**, cho **nhập % hoàn thành** | `WorkCenter.tsx:443-445` (cột c9: 4 nút `25/50/75/100%` + nút `Xong` → **input %** + nút Lưu) · tab Dashboard `:402-420` (thêm bảng việc của tôi) | **FE** — ✅ BE `update_work_item_progress` đã có |
| **4** | **Chuyển «tự tạo việc cho bản thân» vào MODAL, đổi tên «Tạo công việc»** | `WorkCenter.tsx:319-334` (form inline → **modal nội bộ**; tiền lệ `Inventory.tsx:442+` dùng `overlay`+`modal`, ⛔ không cần đụng `page.tsx`) | **FE** — ✅ BE `create_self_work_item` đã có |
| **5** | Đổi tên «Danh sách việc của tôi» → **«Danh sách công việc»**; **nút Nhận xét cho mọi việc**; **click việc → modal chi tiết**; **Trưởng phòng duyệt Hoàn thành / yêu cầu làm lại** | `WorkCenter.tsx:335-338` (tiêu đề + 2 nút mới) + modal chi tiết mới | **FE** + 🔴 **BE MỚI** (xem §4.2) — duyệt/làm lại ✅ đã có |
| **6** | **Tab «Được giao»** (đang là **nhóm con** trong tab Cá nhân — `:136-145`), click xem chi tiết, **thông báo** khi giao & khi hoàn thành, **nút «Hoàn thành»** cho người được giao | `WorkCenter.tsx:92/96` (thêm tab) · `:136-145` (`personalWorkGroups`) · nút Hoàn thành **phải gửi `SUBMITTED`** ⛔ không phải `COMPLETED` | **FE** — ✅ BE thông báo + luật duyệt đã có |
| **7** | Đổi tên tab → **«Phòng ban/ Tổ đội»**, **2 sub-tab** (việc phòng ban · việc tổ đội) + audit | `WorkCenter.tsx:92` (nhãn) · `:361-376` (2 bảng → 2 sub-tab; Kanban/Hierarchy xử theo §1) | **FE** |

### 2.1 Đề xuất THỨ TỰ TAB MỚI (⚠️ cần anh xác nhận trước khi làm)
```text
0. Dashboard            ← mặc định khi bấm «Công việc»
1. Danh sách công việc  ← (cũ: «Cá nhân») còn nhóm con «Do tôi tạo»
2. Được giao            ← TÁCH RA từ nhóm con (việc 6)
3. Phòng ban/ Tổ đội    ← 2 sub-tab (việc 7)
4. Giao việc
5. Dự án                ← tab cũ, giữ nguyên (⛔ anh ⛔ không nhắc tới)
6. Báo cáo
```

---

## 3. ⚠️ RỦI RO KỸ THUẬT ĐÃ ĐO ĐƯỢC (phải xử khi làm)

| # | Rủi ro | Bằng chứng | Cách xử |
|---|---|---|---|
| 1 | **`TaskTable` dùng CHUNG 2 nơi** ⇒ đổi cột «Thao tác» ảnh hưởng cả màn **Giao việc** | `page.tsx:107` import `TaskTable`; dùng trong `DepartmentTaskWorkspace` | Kiểm **cả 2 nơi** trước khi đổi; hoặc thêm prop `mode` để màn Giao việc giữ nguyên |
| 2 | **Test cũ có thể gãy** khi đổi cấu trúc tab/toolbar | `tests/t01-work-menu` · `t05-personal-work` · `t06-department-scope` · `t07-kanban-board` · `t08-work-dashboard` · `p5-01-work-menu-dashboard` | Cập nhật test **cùng lượt** + chạy `test:regression` |
| 3 | **Đổi `WORK_TABS`/`WORK_TAB_OF_VIEW` phải khớp `activateModule(key, view)`** | `page.tsx:598-609` (đặt `workView` + `setActive`) · `:653` (`workCenterViewFor`) | Sửa **đồng thời** 2 tệp; ⛔ không lệch chỉ số tab |
| 4 | Vùng này **3 phiên cùng giữ** | `SESSION_REGISTRY` (S01 `page.tsx` · S02 `menu-helpers.ts` · S03 `WorkCenter.tsx`) | Cần **uỷ quyền phạm vi** (xem §5) |

---

## 4. BACKEND: CÁI GÌ **ĐÃ CÓ** / CÁI GÌ **PHẢI PORT**

### 4.1 ✅ ĐÃ CÓ SẴN (đọc mã, có dòng)
| Năng lực | Bằng chứng | Phục vụ việc |
|---|---|---|
| **Nhập % hoàn thành** + tự `NEW→IN_PROGRESS` | `OpsTaskManagementUseCase.updateWorkItemProgress:338-355` | **3** |
| **Trưởng phòng duyệt Hoàn thành / yêu cầu làm lại** ⭐ nguyên văn luật: *«Người thực hiện chỉ Gửi kiểm tra; Trưởng phòng/người có thẩm quyền mới xác nhận Hoàn thành.»* | `updateWorkItemStatus:357-388` (`:369-370`); trạng thái `SUBMITTED` cho «gửi kiểm tra», `REWORK` cho «làm lại» (`page.tsx:767` đã gọi kèm lý do) | **5 · 6** |
| **Thông báo khi GIAO việc** (trong app + email) | `createWorkItem:209-212` → event `ASSIGNED` + `queueTaskNotice()` (bảng `task_notifications` + `email_outbox`) | **6** |
| **Thông báo khi HOÀN THÀNH / đổi trạng thái** | `updateWorkItemStatus:385` → `notifySafely("TASK_COMPLETED")` / `"TASK_STATUS_CHANGED"` | **6** |
| **Giao việc thủ công đúng phạm vi phòng/dự án** | `createWorkItem:149-180` (`userIsDepartmentManager` · `userCanReceiveDepartmentTask`) | **3 · 5 · 6** |
| **Tự tạo việc cho bản thân** | `createSelfWorkItem:307` | **4** |
| **Đổi người phụ trách + lý do** | `reassignWorkItem:390-407` | 5 |

### 4.2 🔴 PHẢI PORT (⛔ chưa cài ở Java — gọi vào trả **400**)
| Action | Hiện trạng | Bản để port | Phục vụ |
|---|---|---|---|
| **`add_work_item_comment`** | đăng ký RBAC (`ActionRbacRegistry:16`, 4 module · `canUse`) **nhưng ⛔ không có `case`** ở `SystemController` ⇒ **400** *«chưa được triển khai trên backend Java»* | ⭐ **JS có sẵn**: `scripts/system-route.mjs:1286` + test `tests/work-item-comment-participant.test.ts` | **việc 5 (nút Nhận xét)** |
| `set_work_item_participant` | cùng lớp ⇒ **400** | `scripts/system-route.mjs` (cùng nhóm) | 「hỗ trợ liên phòng」 của `WorkHierarchy` (§1) |
> 📌 Đây **⛔ không phải phát hiện mới** — dự án đã ghi: `MASTER_STATUS:732`, `CHECKLIST:7100/:8518`, `TASK-187`, `TASK-210`, và 4 dòng bằng chứng trong `tools/e2e/bien-chung.jsonl` (04–06/10/2026).

---

## 5. 🚧 2 CHẶN + 3 LỰA CHỌN CẦN ANH QUYẾT

**Chặn 1 — shell DSH hỏng (vòng 10).** Đã thử lại mỗi vòng; `node`/`npm` đều chết: `ERR_MODULE_NOT_FOUND: @deepseek-ai/dsh-scope` ⇒ ⛔ không `tsc`/`lint`/`test:regression`/`gd-cycle`. Và **mọi sửa mã ⇒ đổi vân tay ⇒ buộc `gd-cycle`** ⇒ ⛔ nếu sửa bây giờ, **cổng build của CẢ CỤM sẽ đỏ** cho tới khi chạy được `gd-cycle`.

**Chặn 2 — 3 tệp đích thuộc 3 phiên khác** (`page.tsx`=S01 · `menu-helpers.ts`=S02 · `WorkCenter.tsx`=S03) ⇒ theo luật đa phiên ⛔ tôi không tự sửa khi chưa có uỷ quyền.

| Lựa chọn | Nội dung | Ưu / nhược |
|---|---|---|
| **(A) ⭐ KHUYẾN NGHỊ** | Anh **sửa profile DSH trước** (5–15 phút: khôi phục gói `@deepseek-ai/dsh-scope`, xác nhận `node -v`) ⇒ tôi làm **7 việc một mạch, verify từng bước** (`tsc` → test → `gd-cycle` → chạy UI) | An toàn nhất; chậm 15 phút |
| **(B)** | Anh **uỷ quyền phạm vi** cho tôi nhận 3 tệp (coi S01/S02/S03 **STALE** cho vùng này) và **cho làm ngay** | Nhanh, nhưng ⛔ **không verify được** và ⛔ **cổng build cụm sẽ đỏ** tới khi chạy `gd-cycle` |
| **(C)** | Tôi làm tiếp phần **không đụng tệp bị khoá** (đã xong audit §1) + **bản thiết kế UI chi tiết** cho 7 việc; code chờ (A) | ⛔ không tạo giá trị mới đáng kể |

📌 **Tôi khuyến nghị (A)** — vì đây là **7 việc sửa 3 tệp lớn** (`page.tsx` ~3.600 dòng · `WorkCenter.tsx` 470 dòng · `menu-helpers.ts` 455 dòng) + **có test cũ có thể gãy** ⇒ làm **không có `tsc`/test** là rủi ro cao cho go-live.

---

## 6. VIỆC CẦN ANH XÁC NHẬN (ngoài lựa chọn A/B/C)
1. **Thứ tự tab** ở §2.1 — có đúng ý anh không (đặc biệt: giữ tab **«Dự án»** và **«Báo cáo»** nguyên vị trí?).
2. **Kanban + Cây tổ chức** ở tab Phòng ban/Tổ đội: **bỏ khỏi tab** hay **để dạng nút «Chế độ xem»**? (§1)
3. **Nút «Nhận xét» (việc 5)**: cần **port BE `add_work_item_comment`** — anh muốn **port ngay** (thêm vào phạm vi) hay **tạm ẩn nút** tới sau go-live?
