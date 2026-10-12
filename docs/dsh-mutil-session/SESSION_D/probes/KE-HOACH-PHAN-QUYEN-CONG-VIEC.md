# 📐 ĐẶC TẢ PHÂN QUYỀN CÔNG VIỆC (theo USER) — ĐỐI CHIẾU HIỆN TRẠNG + KẾ HOẠCH

- **Ngày:** 08/10/2026 · **Phiên ghi:** `ERP-SESSION-04` (`SESSION_D`)
- **Nguồn:** **USER cung cấp trực tiếp** (nguyên văn bên dưới) · **Trạng thái:** ⏳ **CHỜ USER CHỐT 2 điểm (B1/B2 + công tắc xoá)** rồi thi hành.

---

## 1. NGUYÊN VĂN ĐẶC TẢ CỦA USER (⛔ không diễn giải lại)

> **logic Công việc sẽ như thế này:**
> - **Cá nhân** sở hữu danh sách công việc, có 2 loại là **việc của bản thân** và **việc được giao**.
> - **Cá nhân là trưởng phòng + được cấp quyền giao việc**, có thêm 1 việc là **danh sách công việc đã giao**, có quyền **xem danh sách công việc của người khác thuộc phòng ban của mình**.
> - **Cá nhân là giám đốc - admin**: có thêm quyền **xem tất cả các danh sách công việc của user không thuộc phòng ban của mình (toàn bộ user trong hệ thống)**, cũng có khả năng **giao việc cho bất cứ ai trong hệ thống**.
>
> **như vậy ma trận phân quyền sẽ cần phải có:**
> quyền **tạo** công việc (công việc của bản thân, công việc giao cho người khác) · quyền **sửa** (của bản thân, của người khác) · quyền **xóa** công việc (của bản thân) · quyền **xem** công việc (công việc của bản thân, công việc của người khác) · quyền **duyệt** (duyệt công việc đã hoàn thành của bản thân hoặc của người khác).

---

## 2. ĐỐI CHIẾU HIỆN TRẠNG (⭐ ĐO TỪ MÃ, ⛔ không suy đoán)

**Nguồn đo:** `java-backend/.../rbac/ActionRbacRegistry.java` (module + capability) · `WorkCenter.tsx` (`PERSONAL_GROUPS`) · `RbacService` (6 công tắc ma trận).

| # | Quyền trong đặc tả của user | Action thật | Công tắc ma trận | Kết luận |
|---|---|---|---|---|
| 1 | **Tạo — việc của BẢN THÂN** | `create_self_work_item` | **`canUse`** | ✅ **ĐÃ CÓ** |
| 2 | **Tạo — giao cho NGƯỜI KHÁC** | `create_work_item` | **`canCreate`** | ✅ **ĐÃ CÓ** |
| 3 | **Sửa — của BẢN THÂN** | `update_work_item_status` · `update_work_item_progress` | **`canEdit`** | ✅ **ĐÃ CÓ** |
| 4 | **Sửa — của NGƯỜI KHÁC** | (cùng 2 action trên) | (cùng `canEdit`) ⚠️ **phạm vi do MÁY CHỦ suy theo vai trò**: trưởng phòng → phòng mình; giám đốc/admin → toàn hệ thống (`isDepartmentManager` — đã làm ở `BUG-D23`) | ⚠️ **CHẠY ĐÚNG nhưng ⛔ KHÔNG có công tắc riêng trên ma trận** |
| 5 | **XOÁ công việc (của bản thân)** | 🔴 **⛔ KHÔNG TỒN TẠI** (registry **không có action xoá công việc nào**; `delete_workflow` là luồng duyệt, ⛔ không liên quan) | 🔴 **⛔ không có** | 🔴 **THIẾU HẲN — TÍNH NĂNG MỚI** |
| 6 | **Xem — của BẢN THÂN** | `mark_task_notification_read` · `work_scope` | **`canView`** | ✅ **ĐÃ CÓ** |
| 7 | **Xem — của NGƯỜI KHÁC (phòng mình)** | `work_scope` (payload lọc động) | (`canView`) ⚠️ phạm vi do máy chủ suy (`organization_units` + `isDepartmentManager`) | ⚠️ **ĐÚNG LUẬT mục 2 của user** nhưng ⛔ **không có công tắc riêng** |
| 8 | **Xem — TOÀN HỆ THỐNG (giám đốc/admin)** | `work_scope` | (`canView`) ⚠️ do vai trò admin/giám đốc | ⚠️ **ĐÚNG LUẬT mục 3** nhưng ⛔ **không có công tắc riêng** |
| 9 | **Duyệt — của BẢN THÂN / của NGƯỜI KHÁC** | `approve_work_item` | **`canApprove`** | ⚠️ **có** nhưng ⛔ **không tách «của mình / của người khác»** |
| 10 | **Danh sách: của tôi · được giao · đã giao** | `PERSONAL_GROUPS` = `mine` · `assigned` · `created` | — | ✅ **ĐÃ CÓ** |

➡️ **KẾT LUẬN: 7/10 mục đã chạy đúng** — trong đó **2 luật cốt lõi của user đã đúng** (trưởng phòng = phòng mình · giám đốc/admin = toàn hệ thống), nhờ bản vá phạm vi động `BUG-D23`.
➡️ **3 mục cần làm**: ① **XOÁ công việc** (thiếu hẳn) ② **công tắc cho «của NGƯỜI KHÁC»** (xem/sửa/duyệt) ③ (tuỳ chọn) tách «duyệt của mình / của người khác».

---

## 3. ✅ ĐÃ CHỐT (USER, 08/10/2026) — PHÂN QUYỀN THUỘC **PHIÊN 01**; PHIÊN 04 LÀM PHẦN CHỨC NĂNG

> **Nguyên văn chỉ đạo của user:** «*việc phân quyền như nào sẽ thuộc về session 1 hãy làm công việc của mình theo đặc tả tôi vừa gửi*»

⇒ **⛔ KHÔNG cần user chốt B1/B2 nữa** (2 phương án dưới đây là **quyết định của PHIÊN 01**, ⛔ phiên 04 không tự quyết).
⇒ **PHIÊN 04 (tôi) làm phần CHỨC NĂNG trên màn Công việc** theo đặc tả — **3 việc, đo được ngày 08/10/2026**:

| Mã | Việc (phạm vi phiên 04) | Trạng thái ĐO ĐƯỢC | Ghi chú |
|---|---|---|---|
| **W1** | Nhóm danh sách **«đã giao»** đúng nghĩa đặc tả = *việc TÔI giao cho NGƯỜI KHÁC* | ⚠️ **ĐANG LỆCH NHẸ**: `PERSONAL_GROUPS` có `created` nhãn «Do tôi tạo» = *việc tôi giao/tạo (cho người khác **hoặc cho chính tôi**)` ⇒ cần tách đúng «đã giao» | `WorkCenter.tsx:130-133` |
| **W2** | **Xem danh sách công việc của NGƯỜI KHÁC** theo phạm vi (trưởng phòng → người **trong phòng mình**; giám đốc/admin → **mọi người**) | ✅ **ĐÃ LÀM XONG (09/10/2026 — `CHG-D27` · test `t14` 8/8)**: khối thuần `workByOwnerGroups` + bộ chọn «Nhóm của tôi / **Theo người**» (mặc định ⛔ không đổi hành vi cũ) · xem §5e | `WorkCenter.tsx` (`W2-PURE` + tab 1) |
| **W3** | Nút **XOÁ** việc của bản thân (phần **giao diện**) | ✅ **ĐÃ LÀM XONG (09/10/2026 — `CHG-D28` · test `t13-E`)**: S01 đã xong action `delete_work_item` (`work`+`canEdit`) ⇒ nút «Xoá» hiện **CHỈ KHI đủ 2 cổng** (có `work.canEdit` ∧ tôi là người giao/tạo ∧ chưa đóng) + `window.confirm` | `WorkCenter.tsx` (`ProgressCell` + 3 bảng) |

### 3b. Hai phương án thể hiện «của bản thân / của người khác» — **PHIÊN 01 QUYẾT** (⛔ phiên 04 không chốt thay)

### (A) Thể hiện «của bản thân» vs «của người khác» TRÊN MA TRẬN
Hiện ma trận có **1 dòng `work`** với **6 công tắc** (`canView · canUse · canCreate · canEdit · canApprove · canExport`).

| | Cách làm | Ưu | Nhược |
|---|---|---|---|
| **B1** ⭐ *(phiên 04 đề xuất)* | Thêm **1 DÒNG ma trận mới** `work_others` = «Việc của người khác (xem · sửa · duyệt)» | ✅ nhanh, **đúng cách đã làm cho khoá `work`** · ⛔ **không đổi lược đồ CSDL** · admin tick rõ theo người/đơn vị | ⚠️ gộp 3 quyền (xem/sửa/duyệt) vào 1 dòng — ⛔ không tách rời từng quyền |
| **B2** | Thêm **cặp công tắc mới**: `canViewOthers` · `canEditOthers` · `canApproveOthers` · `canDeleteOwn` | ✅ chi tiết **đúng từng chữ** của user | 🔴 **phải đổi LƯỢC ĐỒ CSDL** (thêm cột vào `user_module_permissions` + `department_module_permissions`) + Java + ma trận + **migration `drizzle`** ⇒ lớn, cần phiên 01 build |

### (B) Công tắc nào cho **XOÁ việc của bản thân**?
| | Cách | Lưu ý |
|---|---|---|
| **`canEdit`** ⭐ *(đề xuất)* | Sửa được ⇒ xoá được (**chỉ với việc của chính mình**) | ✅ ⛔ không đổi CSDL, ⛔ không thêm cột |
| **`canDelete` (mới)** | Tách riêng quyền xoá | 🔴 thuộc **B2** ⇒ đổi CSDL + migration |

---

## 4. KẾ HOẠCH THI HÀNH (sau khi user chốt) — **kèm CHỦ SỞ HỮU** để ⛔ tránh conflict

| # | Việc | Tệp | **Ai** |
|---|---|---|---|
| 1 | Action **`delete_work_item`**: xoá **chỉ việc do mình tạo/giao**; ⛔ không xoá việc người khác; ⛔ không xoá việc đã `COMPLETED` (hoặc chuyển `CANCELLED` nếu đã hoàn thành) | `scripts/system-route.mjs` (**đường JS** — ⚠️ giữ **F-03: 0 dòng ròng**) · `java-backend/**` (bản chạy) | 🔹 JS: **phiên 04** · 🔹 Java + registry: **phiên 01** |
| 2 | Gắn capability cho action mới (`canEdit` hoặc `canDelete`) | `ActionRbacRegistry.java` | 📤 **phiên 01** |
| 3 | Nút **«Xoá»** trong màn Công việc (**chỉ hiện với việc của mình**) + hộp xác nhận | `app/screens/WorkCenter.tsx` | 🔹 **phiên 04** (`CLAIM` — đã từng sửa, có ghi phối hợp) |
| 4 | (Nếu **B1**) **1 dòng ma trận** `work_others` + 1 dòng `module_catalog` + 2 bản đồ kiểu TS | `lib/menu-helpers.ts` · `app/page.tsx` · `lib/ui-shared.tsx` · CSDL | 🔹 **phiên 04** (⭐ đúng cách đã làm cho `work` và `project_admin`) |
| 5 | (Nếu **B2**) thêm 4 cột capability + migration `drizzle` | CSDL + `drizzle/**` | 📤 **phiên 01** (⚠️ đổi vân tay gói) |
| 6 | Test khoá lại (⛔ không để «mù quyền»: `probe-action-registry-coverage` **exit 0**) + **đo LIVE** 4 ca: ① xoá việc của mình = **OK** ② xoá việc người khác = **403** ③ trưởng phòng xem việc phòng mình = **OK** ④ trưởng phòng xem việc phòng khác = **⛔ CHẶN** | `tests/**` + probe | 🔹 **phiên 04** |
| 7 | Ma trận UI: dòng mới hiện đúng, ⛔ không phá 4 dòng đã ẩn; ⛔ không mất quyền (`permissionMatrixKeys` giữ đủ) | `PermissionMatrix.tsx` | 🔹 **phiên 04** |

## 5. ⛔ RÀNG BUỘC GIỮ NGUYÊN (⛔ không được vi phạm khi thi hành)

1. ⭐ **Phạm vi vẫn do MÁY CHỦ quyết** — ⛔ **không** nới quyền ở giao diện (giao diện chỉ **hiện/ẩn** theo quyền đã cấp).
2. ⛔ **Không** để action nào rơi vào «⛔ MÙ QUYỀN» (bài học `P-08`/`BUG-D22`): sau khi thêm action ⇒ `probe-action-registry-coverage` **PHẢI exit 0**.
3. ⭐ **Cấp ban đầu = 0**: dòng/công tắc mới ⛔ **không** tick sẵn cho ai ⇒ hành vi hiện tại **⛔ không đổi** cho tới khi admin chủ động cấp.
4. ⛔ Không sửa `java-backend/**` nếu chưa có phối hợp (phạm vi phiên 01) · ⛔ không sửa CSS dùng chung (ngân sách CSS vượt trần).
5. ⭐ Mọi tuyên bố trạng thái phải kèm **phép đo** (`VERIFIED` = có đo lại; ⛔ không cảnh báo «lỗi» khi chưa đo — luật phiên 04 tự áp sau `BUG-D25`).

---

## 5b. ⚠️ SỰ CỐ ĐÃ XẢY RA + ĐÃ TỰ SỬA (lượt 115–119, `ERP-SESSION-04`) — BÀI HỌC BẮT BUỘC ĐỌC

| Bước | Việc | Kết quả ĐO ĐƯỢC |
|---|---|---|
| 1 | Tôi làm **W1**: đổi nhóm 3 thành «Đã giao» = **chỉ** việc tôi giao cho **NGƯỜI KHÁC** (`assignedBy===me && assignedTo!==me`) + viết test riêng `t13b` | tsc 0 · 4 tệp test liên quan xanh ⇒ tôi **đã tuyên bố FIXED** (⚠️ SAI QUY TRÌNH: chưa chạy hồi quy đầy đủ) |
| 2 | Chạy `npm run test:regression` | 🔴 **exit 1 — 5 test `T-05` ĐỔ**: «BA NHÓM … nhãn đúng **ĐỀ BÀI**: của tôi · được giao · **do tôi tạo**» ✖ · «bộ lọc riêng» ✖ (`actual [1,0,0]` vs `expected [1,0,1]`) · «bộ đếm riêng» ✖ · «hợp đồng tên trường» ✖ · «**[đối chứng âm]** tên trường giả» ✖ |
| 3 | **Nguyên nhân gốc**: nhãn «**Do tôi tạo**» là theo **ĐỀ BÀI USER ĐÃ CHỐT TRƯỚC ĐÓ** (tiêu đề test ghi rõ «nhãn đúng ĐỀ BÀI») ⇒ W1 là **suy diễn quá mức** của tôi về chữ «đã giao» | ⛔ Không phải lỗi cũ, không phải bug — **xung đột hợp đồng do tôi tạo ra** |
| 4 | **Tự sửa**: hoàn nguyên `WorkCenter.tsx` (nhãn + bộ lọc về bản cũ, có ghi chú lý do) + xoá `tests/t13b-work-groups.test.mjs` | ✅ `tsc` **0 lỗi** · **hồi quy exit 0 · FAIL 0 — repo XANH lại** |

**⭐ Bài học (đã tự áp dụng từ nay):**
1. ⛔ **KHÔNG tuyên bố FIXED** cho thay đổi trong `WorkCenter.tsx` nếu **chưa chạy `npm run test:regression`** (lệnh chuẩn: `node scripts/regression-suite.mjs`). Chạy vài tệp test liên quan là **KHÔNG ĐỦ**.
2. ⛔ **KHÔNG suy diễn nghĩa nghiệp vụ** từ một chữ trong đặc tả khi **đã có hợp đồng test** khoá nghĩa khác — phải **hỏi user trước**.
3. `node --test tests` (nạp **thư mục**) ⛔ **SAI** ⇒ `ERR_MODULE_NOT_FOUND`; phải dùng `npm run test:regression`.

**❓ CÂU HỎI ĐANG CHỜ USER (quyết định nghiệp vụ, ⛔ phiên 04 không tự quyết):**
> Nhóm thứ 3 («Do tôi tạo» theo đề bài cũ — đặc tả mới gọi là «**danh sách công việc đã giao**») có **loại trừ việc tôi tự giao cho CHÍNH MÌNH** hay không?
> **A** = có loại trừ ⇒ phiên 04 làm lại + **cập nhật 5 test `T-05`** (tests/** thuộc phạm vi phiên 04) + ghi `CHANGE_LOG` nêu hợp đồng cũ bị thay thế.
> **B** = ⭐ **giữ nguyên** nghĩa cũ (hiện trạng: repo **XANH**) — chỉ cần đổi **nhãn hiển thị** nếu user muốn chữ «Đã giao».

---

## 5c. ✅ QUYẾT ĐỊNH CUỐI CÙNG CỦA USER = **2 NHÓM** (08/10/2026) — ⛔ MỌI PHƯƠNG ÁN KHÁC ĐÃ HỦY

> **⚠️ ĐỌC DÒNG NÀY TRƯỚC — TRẠNG THÁI CUỐI CÙNG** (⛔ đừng đọc phần «3 nhóm»/«4 nhóm» bên dưới như thể còn hiệu lực):
>
> **Nguyên văn chỉ đạo CUỐI CÙNG:** «*gộp lại thành 2 nhóm cho gọn*» · «**Của tôi**» = *việc của bản thân tự tạo **và** việc của người khác giao* · «**Đã giao**» = *tất cả các việc mà bản thân đã giao cho người khác*.
>
> | Nhãn | `key` | Điều kiện (ĐO từ mã, ⛔ không đoán) |
> |---|---|---|
> | «Của tôi» | `mine` | `assignedTo === tôi` (TOÀN BỘ việc của bản thân) |
> | «Đã giao» | `assignedOut` | `assignedBy === tôi` ⛔ **VÀ** `assignedTo !== tôi` |
>
> ⛔ **ĐÃ HỦY vĩnh viễn, ⛔ không thi hành lại:** ① kế hoạch **4 nhóm** ② phương án **3 nhóm** («của tôi · được giao · do tôi tạo»).
>
> **✅ ĐÃ ĐO (vòng 126):** mã `app/screens/WorkCenter.tsx` **đã 2 nhóm** ✓ · hợp đồng test **đã khớp**: `t05` **6/6 PASS** · `t13` **18/18 PASS** · `t01` 9/9 · `t07` 8/8 · `p5-01` 4/4 · ⭐ **hồi quy đầy đủ FAIL 0 · exit 0**.
> **📜 LỊCH SỬ (⛔ không thi hành):** ① «giữ nguyên 3 nhóm» → ② đề xuất 4 nhóm (hủy) → ③ **chốt 2 nhóm** ⭐.
>
> <details><summary>⚠️ NỘI DUNG CŨ (ĐÃ HỦY — chỉ tra cứu, ⛔ KHÔNG thi hành)</summary>

## 5c-cũ. ~~KẾ HOẠCH 4 NHÓM~~ / ~~3 NHÓM~~ (ĐÃ HỦY)

> **⚠️ TOÀN BỘ MỤC NÀY (danh sách sửa 4 nhóm bên dưới) ⛔ KHÔNG ĐƯỢC THI HÀNH.** Ngay sau đó user đã chốt lại:
>
> **Nguyên văn chỉ đạo CUỐI CÙNG của user:** «*Không cần tách thành 4 nhóm mà **giữ nguyên như hiện tại**. «**Của tôi**» hiển thị danh sách **toàn bộ** công việc của bản thân **bao gồm cả việc người khác giao cho**, «**Được giao**» là 1 danh sách các việc của **người khác giao cho bản thân**, «**Do tôi tạo**» chính là công việc **được tạo bởi bản thân bao gồm cả việc giao cho người khác**.»*

### ✅ ĐỐI CHIẾU: mã hiện tại **ĐÃ ĐÚNG** — ⛔ **không cần sửa 1 dòng nào**

| Nhãn | Nghĩa user chốt | Mã hiện tại (`WorkCenter.tsx`) | Khớp? |
|---|---|---|---|
| «Của tôi» | **toàn bộ** việc của bản thân (gồm cả việc người khác giao) | `:157` `mine = rows.filter(row => String(row.assignedTo) === myId)` | ✅ **ĐÚNG** |
| «Được giao» | việc **người khác** giao cho bản thân | `:158` `assigned = mine.filter(row => String(row.assignedBy) !== myId)` | ✅ **ĐÚNG** |
| «Do tôi tạo» | việc **do bản thân tạo**, gồm cả giao cho người khác | `:159` `created = rows.filter(row => String(row.assignedBy) === myId)` | ✅ **ĐÚNG** |

⇒ ⭐ **Trạng thái cuối = `B` (giữ nguyên)** · repo **XANH** (`tsc` 0 · hồi quy **FAIL 0**) · hợp đồng `T-05` (3 nhóm) **giữ nguyên, ⛔ không sửa** · ⛔ **không** cần `CHANGE_LOG` vì **không có thay đổi nào** được thi hành.
⇒ 🔴 **Bài học:** tôi đã 2 lần suy diễn nghĩa nghiệp vụ (W1 lượt 115, kế hoạch 4 nhóm lượt 122) trong khi **mã + hợp đồng test đã đúng** ⇒ từ nay: **đo mã hiện tại + hỏi 1 câu** trước khi thiết kế lại.

---
<details><summary>⚠️ NỘI DUNG CŨ (ĐÃ HỦY — giữ lại chỉ để tra cứu lịch sử, ⛔ KHÔNG thi hành)</summary>

## 5c-cũ. KẾ HOẠCH 4 NHÓM (ĐÃ HỦY)

> **Nguyên văn chỉ đạo của user:** «*Công việc **Do tôi tạo**, ví dụ như user A tạo công việc **cho bản thân** thì được tính là **Do tôi tạo**, còn **Đã giao** là user A tạo công việc **cho người khác**.»*

⇒ ⭐ **Đây CHÍNH LÀ phương án A tôi từng suy luận** (và đã hoàn nguyên vì chưa có xác nhận) — nay **đã được user xác nhận bằng văn bản** ⇒ **thi hành**.
⇒ ⚠️ Nhưng **cần 2 NHÓM riêng biệt**, ⛔ không phải đổi nhãn 1 nhóm: ba nhóm cũ (`mine` · `assigned` · `created`) trở thành **BỐN**:

| # | Nhãn | `key` | Điều kiện (ĐO, ⛔ không đoán) |
|---|---|---|---|
| 1 | «Của tôi» | `mine` | `assignedTo === tôi` (giữ nguyên) |
| 2 | «Được giao» | `assigned` | `assignedTo === tôi` ⛔ **VÀ** `assignedBy !== tôi` (giữ nguyên) |
| 3 | «**Do tôi tạo**» | `created` | `assignedBy === tôi` ⛔ **VÀ** `assignedTo === tôi` ⭐ **MỚI: chỉ việc cho BẢN THÂN** |
| 4 | «**Đã giao**» | `assignedOut` ⭐ MỚI | `assignedBy === tôi` ⛔ **VÀ** `assignedTo !== tôi` ⇒ user A tạo cho NGƯỜI KHÁC |

### 📋 DANH SÁCH SỬA CHÍNH XÁC (đã ĐO từng dòng — thi hành ở vòng sau)

**A. `app/screens/WorkCenter.tsx`**
| Dòng (hiện tại) | Sửa gì |
|---|---|
| `:133` `{ key: "created", label: "Do tôi tạo", note: "Việc tôi giao/tạo (cho người khác hoặc cho chính tôi)" }` | Đổi `note` ⇒ «Việc tôi **TỰ TẠO CHO BẢN THÂN**» · **THÊM** dòng thứ 4: `{ key: "assignedOut", label: "Đã giao", note: "Việc tôi giao CHO NGƯỜI KHÁC" }` |
| `:159` `const created = rows.filter((row) => String(row.assignedBy) === myId);` | Tách 3 dòng: `const createdByMe = …=== myId);` · `const created = createdByMe.filter((row) => String(row.assignedTo) === myId);` · `const assignedOut = createdByMe.filter((row) => String(row.assignedTo) !== myId);` |
| `:160-164` khối `return [ …PERSONAL_GROUPS[0..2] … ]` | Thêm phần tử thứ 4: `{ ...PERSONAL_GROUPS[3], rows: assignedOut, count: assignedOut.length }` |

**B. `tests/t05-personal-work.test.mjs`** (⚠️ **thuộc phạm vi phiên 04** — `tests/**`) — cập nhật hợp đồng theo quyết định mới của user:
| Dòng | Nội dung hiện tại → sửa thành |
|---|---|
| `:1` | «BA NHÓM RIÊNG» → «**BỐN NHÓM RIÊNG**: của tôi · được giao · **do tôi tạo (cho bản thân)** · **đã giao (cho người khác)**» |
| `:75` | `groups.length === 3` → **`4`** |
| `:76` | nhãn `["Của tôi","Được giao","Do tôi tạo"]` → **`[…, "Đã giao"]`** |
| `:77` | khoá `["mine","assigned","created"]` → **`[…, "assignedOut"]`** |
| `:78` | `PERSONAL_GROUPS.map(label)` → **4 nhãn** |
| `:79` | `Set(...).size === 3` → **`4`** |
| `:87` | `created.rows === ["A","C"]` → **`["A"]`** (⛔ chỉ A = tự tạo cho mình) **+ THÊM** khẳng định nhóm 4 `assignedOut.rows === ["C"]` |
| `:99` | `counts === [2,1,2]` → **`[2,1,1,1]`** (⚠️ **phải đo lại từ fixtures** trước khi chốt số) |
| fixtures `:48-50` | Giữ nguyên (A = tự tạo cho mình · C = tôi giao cho người khác) — chúng **đã đúng** cho 4 nhóm mới |

**C. Bắt buộc sau khi sửa** (⭐ luật mới sau sự cố lượt 115): chạy `tsc` **và** `npm run test:regression` **NGAY**, ⛔ không chờ cuối; chỉ kết luận `FIXED` khi **FAIL 0**.

**D. Nhật ký**: ghi `CHANGE_LOG` (hợp đồng 3 nhóm bị **thay thế bằng 4 nhóm** theo quyết định user) + `TEST_LOG` cho `t05` + `t13b` nếu tạo lại.

---

## 5d. 🚨 BÀN GIAO: **BUILD ĐỎ** DO PHIÊN KHÁC ĐANG SỬA DỞ (lượt 122–123) — ⛔ phiên 04 **KHÔNG** sở hữu

**Số đo (⛔ không suy đoán):**
| Thời điểm | `npm run typecheck` | Ghi chú |
|---|---|---|
| Lượt 119 (trước) | ✅ **0 lỗi** | repo xanh |
| Lượt 122 (đo lần 1) | 🔴 **8 khoá thiếu** trong `ModuleKey`: `code` · `duties` · `work_assign` · `work_department` · `work_list` · `work_others` · `work_project` · `work_reports` | `app/page.tsx` sửa lúc **10-09 14:24:28** (SAU lượt sửa cuối của phiên 04 lúc 14:13:43) |
| Lượt 122–124 (đo lại nhiều lần) | 🔴 **1 lỗi hiện ra mỗi lần**: `work_dashboard` → (sau khi tôi vá) `work_list` → … → cuối cùng `TS2739` | ⚠️ **ĐÍNH CHÍNH (tự sửa):** tôi từng ghi «số lỗi giảm 8→1 = bằng chứng phiên khác đang sửa» — ⛔ **SAI**: **TypeScript chỉ báo 1 thuộc tính lạ mỗi lần** cho cùng một object literal, và **8→1 là do CHÍNH TÔI vá**. ⭐ Bằng chứng thật về phiên khác: **mốc thời gian tệp** `app/page.tsx` = **10-09 14:24:28** (⛔ chưa sửa lại kể từ đó tới 14:32) ⇒ họ **đã dừng/ngưng**, để lại build đỏ. |
| Lượt 123 (sau khi trả nguyên) | 🔴 **1 lỗi**: `app/page.tsx(138,3) TS2353 'work_dashboard' does not exist in type Record<ModuleKey,…>` | ✅ đúng nguyên trạng phiên kia để lại |

**Phiên 04 ĐÃ THỬ GÌ rồi TỰ TRẢ NGUYÊN (⛔ để không tạo conflict merge cho phiên kia):**
1. Thêm `"work_dashboard"` vào `ModuleKey` (`lib/ui-shared.tsx`) ⇒ lỗi 138 hết, **lộ `work_list`**.
2. Thêm nốt **7 khoá** còn lại ⇒ **8 lỗi TS2353 hết**, nhưng lộ **`app/page.tsx(125,7) TS2739`**: `titles` nay **thiếu khoá** so với `Record<ModuleKey,…>` ⇒ ⚠️ **thiết kế của phiên kia còn dở** (họ phải thêm cả mục `titles` lẫn thành viên `ModuleKey`).
3. ⇒ **TRẢ NGUYÊN** dòng `ModuleKey` về đúng bản gốc: `… | "work" | "project_admin" | "admin";` ✅ (đã xác nhận bằng đo lại).

**⛔ KHÔNG tự làm tiếp** vì: ① `app/page.tsx` + `lib/ui-shared.tsx` là **vùng phiên khác đang mở** (họ đang sửa, số lỗi đang giảm) ② sửa nửa vời chỉ **đổi 8 lỗi thành 1 lỗi**, build **vẫn đỏ** ⇒ vô ích mà còn rủi ro chồng lấn ③ luật đa phiên §7/§18: ⛔ không chiếm việc của phiên khác.

**🚧 HỆ QUẢ (⛔ nghiêm trọng):** `tsc` đỏ ⇒ **`npm run build` / rebuild ⛔ KHÔNG chạy được cho MỌI phiên** ⇒ **6 sửa FE** đang chờ của phiên 04 (`WorkCenter.tsx`: bật Bình luận · ẩn tab «Được giao» · căn giữa 2 modal · khoá `work` ở tab · danh sách 11 phòng ban động · dòng ma trận `project_admin`) **⛔ chưa thể tới người dùng**.

**📤 CẦN PHIÊN ĐANG SỬA `app/page.tsx` (hoặc phiên 01):** hoàn tất cặp đôi **`ModuleKey` ↔ `titles`** cho đủ (7 khoá còn lại + `work_dashboard`) rồi chạy `npm run typecheck` tới **0 lỗi** ⇒ sau đó rebuild được.
**⚠️ RỦI RO CHỒNG LẤN:** `app/screens/WorkCenter.tsx` (tệp phiên 04 đang giữ) ⚠️ **nằm trong vùng tái cấu trúc MENU CÔNG VIỆC** của phiên kia (6/8 khoá thiếu là `work_*`) ⇒ **cần xác nhận ai sở hữu menu Công việc** để ⛔ tránh 2 phiên sửa chồng.

---

## 5e. ✅ **W2 ĐÃ THI HÀNH XONG** (09/10/2026) — khối «xem danh sách công việc của NGƯỜI KHÁC» (⛔ KHÔNG đổi máy chủ)

> **⚠️ ĐỌC DÒNG NÀY TRƯỚC (TRẠNG THÁI CUỐI)**: ⭐ **W2 ĐÃ XONG** (`CHG-D27` · `tests/t14-work-owner-view.test.mjs` **8/8**) · **W3 ĐÃ XONG** (`CHG-D28` · `tests/t13` test `E`) · ⭐ cổng `probe-catalog-drift` **ĐỎ → XANH** (`CHG-D29`) · ⭐ `tsc` **0** · `eslint` **0** · hồi quy **970 test · 969 pass · FAIL 0** · ⭐ **`RELEASED — mtime cuối 14:51:12`** đã ghi cho S01 build (`HANDOFF-20261009-A13`).
> ⚠️ **CÁC MỤC 1–6 BÊN DƯỚI LÀ BẢN KẾ HOẠCH GỐC** (giữ để tra cứu) — ⚠️ **1 chỗ ĐÃ CŨ so với mã**: kế hoạch viết «nhóm 3 / ba nhóm», nhưng mã hiện tại (sau quyết định 2 nhóm của user) là **2 nhóm** (`mine` · `assignedOut`) ⇒ ⭐ **đã đọc lại mã trước khi sửa** (⛔ không làm theo ký ức — đúng cảnh báo cuối mục này).
> ✅ **KHÁC BIỆT so với kế hoạch (đo được)**: ① nguồn gom = **`scopedWork`** (tập đã thu hẹp) — ⛔ không dùng `items` thô ⇒ ⛔ không nới quyền ② nhóm theo **`assignedTo`** (khoá định danh, ⛔ không theo tên ⇒ 2 người **trùng tên = 2 nhóm**) ③ «Theo người» là **CHỈ XEM** việc của người khác (`allowEdit` chỉ bật khi người đang chọn = chính mình) ④ có trạng thái rỗng + tên trường hợp đồng đúng (`assignedToName`) ✓

> **Yêu cầu user:** «*trưởng phòng có quyền xem danh sách công việc của người khác thuộc phòng ban của mình*» · «*giám đốc-admin… xem tất cả các danh sách công việc của user… toàn bộ user trong hệ thống*»

**⭐ PHÁT HIỆN QUYẾT ĐỊNH (đo được, ⛔ không suy đoán):** **MÁY CHỦ ĐÃ LỌC PHẠM VI RỒI** — payload `workItems` mà admin nhận về gồm **21 dòng của NHIỀU NGƯỜI KHÁC** (ví dụ `assignedTo` = `USR_76575c08…` «Nhân viên Dự án E», `assignedBy` = «Trưởng phòng Dự án C»; `assignedTo`/`assignedBy` **có giá trị ở 21/21 dòng**).
⇒ Nghĩa là: **ai được xem việc của ai đã do máy chủ quyết** (`work_scope` + `isDepartmentManager`: trưởng phòng → phòng mình · giám đốc/admin → toàn hệ thống — đã `VERIFIED` ở các vòng trước).
⇒ **W2 chỉ cần làm ở GIAO DIỆN**: nhóm các dòng **đã nằm trong payload** theo **người thực hiện** ⇒ ⛔ **KHÔNG cần** thêm API, ⛔ **KHÔNG cần** đổi `system-route.mjs`, ⛔ **KHÔNG đụng quyền** ⇒ **rủi ro thấp, cô lập, hoàn nguyên dễ** (đúng ưu tiên SAFE/SMALL/ISOLATED/REVERSIBLE).

**Kế hoạch thi hành (tệp `app/screens/WorkCenter.tsx` — tệp phiên 04 phụ trách):**
1. Thêm hàm thuần **`workByOwnerGroups(rows)`**: nhóm theo `assignedTo` → nhãn `assignedToName`, bộ đếm = số dòng, sắp xếp giảm dần (⭐ sao chép đúng khuôn `projectWorkGroups` **đã có sẵn trong cùng tệp** ⇒ tái dùng thay vì viết mới — luật §17 SHARED COMPONENT: REUSE).
2. Thêm bộ chọn **«Xem theo: ○ Nhóm của tôi ○ Theo người»** trong tab «Danh sách công việc» (⭐ tái dùng đúng khuôn `personalGroup`/`setPersonalGroup` đang có).
3. Khi chọn «Theo người»: hiện dải nhóm **mỗi người một thẻ** (tên + bộ đếm) và bảng việc của người đó — ⛔ chỉ gồm dòng **payload đã trả về** ⇒ ⛔ không nới quyền.
4. ⛔ **KHÔNG** thêm nhãn «của người khác» cho người ⛔ không có phạm vi (máy chủ đã chặn ⇒ danh sách rỗng, ⛔ không tự bịa dữ liệu).
5. Test khoá mới (`tests/t13…` hoặc tệp mới): ① hàm nhóm trả đúng số người + bộ đếm khớp dòng ② ⛔ không đọc tên trường giả ③ bộ chọn có tồn tại và mặc định vẫn là «Nhóm của tôi».
6. **BẮT BUỘC sau khi sửa**: `npm run typecheck` **và** `npm run test:regression` ⇒ chỉ kết luận `FIXED` khi **FAIL 0** (⭐ luật tự áp sau sự cố lượt 115).

**⚠️ CẦN ĐO TRƯỚC KHI SỬA:** xác nhận `WorkCenter.tsx` **hiện tại** còn đúng cấu trúc đã ghi ở đây (⚠️ tệp này **đã bị phiên khác sửa 2 lần**: 14:35 và trước đó) — ⛔ đừng sửa theo ký ức, phải đọc lại.

---

## 6. VIỆC ĐANG CHỜ KHÁC (⛔ không liên quan nhưng chặn việc thấy kết quả)

- 🔑 **1 lượt rebuild** (phiên 01) để **6 sửa FE** hiện ra — ĐO: `:8787` vẫn là bản `13:34`, gói phục vụ ⛔ chưa có thay đổi nào của phiên 04.
- 🔑 **Bản vá `project_admin`** (`create/update/delete_project`) — bản vá sẵn sàng ở `KE-HOACH-A3-CRUD-PROJECT.md` §8.
