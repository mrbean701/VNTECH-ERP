> **VNTECH ERP — BỘ TÀI LIỆU PHIÊN BẢN `ALPHA TEST`**
> · Phiên bản tài liệu: **`DOC-ALPHA-TEST-2026.10`** · Ngày cập nhật: **08/10/2026** · Phiên soạn: `ERP-SESSION-01`
> · Sản phẩm: `V5.3.0-MASTER-BASELINE-R1.1.1` · Cổng: `:8787` (UI) · `:9000` (cutover) · `:18081` (API Java)
> · ⚠️ Trạng thái: **ALPHA TEST** — tài liệu phản ánh bản ĐANG CHẠY; ⛔ chưa phải bản phát hành chính thức.
> · 📌 Nguồn sự thật: **mã nguồn + CSDL thật** (mọi số liệu đều ĐO được, ⛔ không suy đoán).

# 58 — BIÊN BẢN NGHIỆM THU 7 VIỆC KHỐI «CÔNG VIỆC» (08/10/2026)

> **SESSION**: `ERP-SESSION-04` · **NGÀY**: 2026-10-08 · **MODE**: GO-LIVE CONTINUOUS EXECUTION
> **MỤC ĐÍCH**: gom **TOÀN BỘ bằng chứng** để nghiệm thu / bàn giao go-live cho 7 việc user giao ngày 08/10/2026.
> ⛔ Tài liệu này **chỉ ghi điều ĐÃ ĐO ĐƯỢC** — ⛔ không suy diễn, ⛔ không báo thành quả chưa xác minh (Goal §22/§24).

---

## §1. TÓM TẮT ĐIỀU HÀNH — 7/7 VIỆC ĐÃ LÊN BẢN CHẠY

| # | Việc user yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| **1** | Gom menu thành **hub «Công việc»**, click ⇒ Dashboard, **tab Dashboard lên đầu** | ✅ **`VERIFIED`** | Sidebar nhóm «CÔNG VIỆC» mở ra **ĐÚNG 1 mục con «Công việc»** (tổng nút sidebar **21 → 17**); bấm mục con ⇒ **`active = "Dashboard"`**; dải tab `["Dashboard","Danh sách công việc","Được giao","Phòng ban/ Tổ đội","Giao việc","Dự án","Báo cáo"]` — đọc thẳng DOM trên `:9000` |
| **2** | Thanh search **hạ xuống ngay trên** danh sách · «Danh sách việc của tôi» → **«Danh sách công việc»** | ✅ **`VERIFIED`** | Tab 1 hiện tiêu đề «Danh sách công việc»; **«Danh sách việc của tôi» = KHÔNG CÒN** trong bundle phục vụ |
| **3** | Dashboard hiện **việc của user** · **bỏ nút «Thao tác»** ⇒ **cho nhập % hoàn thành** | ✅ **`VERIFIED`** (đường ghi % đã kiểm chứng bằng **tài khoản NHÂN VIÊN THẬT** — `TEST-D39`) | ✅ **Bỏ 4 nút preset 25/50/75/100 + nút «Xong»** (`BUG-D05` đã sửa); ✅ **phân quyền đúng trên UI thật**: tài khoản `admin` thấy **«Duyệt xong»**, **«Gửi kiểm tra» ẨN** (đúng vai người duyệt); ⭐ **`TEST-D39` (probe END-TO-END, vòng 71)**: tài khoản **nhân viên `da_nv`** (admin giao việc cho) gọi `update_work_item_progress` ⇒ **HTTP 200** · CSDL ghi **`progress=45`** · tự chuyển **`IN_PROGRESS`** ⇒ ⭐ **đường ghi % chạy THẬT** ✅ · ⏳ còn **ảnh màn hình ô nhập % của nhân viên** — chờ **BUILD** (việc 4 của user) |
| **4** | «Tự tạo việc cho bản thân» ⇒ **MODAL «Tạo công việc»** | ✅ **`VERIFIED`** | Mở **modal thật**: `role="dialog"` · `aria-modal="true"` · `aria-label="Tạo công việc"` · nút ✕ `aria-label="Đóng"` · **6 trường**: Nội dung công việc\* · Dự án · Hạn hoàn thành · Ưu tiên · Kết quả cần có · Mô tả · nút **«Huỷ»** + **«＋ Tạo việc cho tôi»** → ảnh `SESSION_D/uat-modal-tao-cong-viec.png` |
| **5** | Mọi việc có **nút nhận xét** · **click việc ⇒ modal chi tiết** · trưởng phòng **duyệt / yêu cầu làm lại** | ✅ **`VERIFIED`** | Bấm **1 DÒNG** ⇒ modal `work-detail-modal` mở: `role="dialog"` · `aria-modal` · `aria-label="Chi tiết công việc"` · **tiêu đề = mã việc thật `CV-DA-260917-3436`** · có «Tiến độ» + «Trạng thái» · ⚠️ **«Nhận xét» TẠM ẨN** (hiện dòng thông báo `work-comment-pending`) — **đúng quyết định của user** |
| **6** | Tab **«Được giao»**: xem chi tiết · **thông báo web khi được giao** · người giao nhận thông báo khi xong · người được giao có nút **«Hoàn thành»** | ⚠️ **MỘT PHẦN** (đo lại **vòng 64**) | ✅ Tab **«Được giao»** RIÊNG (`data-vntech="work-assigned-tab"`) · ✅ người được giao có **«Gửi kiểm tra» (`SUBMITTED`)** · ✅ **6b «báo khi ĐƯỢC GIAO» — CÓ THẬT**: `queueTaskNotice` (`system-route.mjs:277-283`) ghi `task_notifications` (**channel `in_app`**) + `email_outbox` (**event `task_assigned`**), gọi ở `:293` (tạo) & `:1278` (giao lại) · 🔴 **6c «người giao nhận thông báo khi việc HOÀN THÀNH» ⛔ CHƯA CÓ**: handler `update_work_item_status` (`:1274-1275`) ⛔ **không gọi hàm thông báo nào**; ⚠️ **Java cũng thiếu** ⇒ **thiếu ở CẢ 2 đường** (`BUG-D12`) |
| **7** | Tab **«Phòng ban/ Tổ đội»** + **2 sub-tab** (phòng ban · tổ đội) + audit tab | ✅ **`VERIFIED`** | Tab «Phòng ban/ Tổ đội» + **2 SUB-TAB KÈM BỘ ĐẾM**: «Việc phòng ban của tôi **· 16**» + «Việc của tổ đội tôi tham gia **· 8**» + **3 nút «Chế độ xem»: Bảng · Kanban · Cây** (mặc định «Bảng») → ảnh `SESSION_D/uat-tab7-phongban-todoi.png` |

**Tổng**: **7/7 việc ĐÃ ĐƯỢC KIỂM CHỨNG** (6/7 trên UI thật + **việc 3 nay kiểm chứng được ĐƯỜNG GHI % bằng tài khoản nhân viên thật** — `TEST-D39`) · ⏳ duy nhất còn **ảnh màn hình ô nhập % của nhân viên** ⇒ chờ **BUILD**.

---

## §2. SỐ LIỆU CHỐT (đo bằng lệnh thật, 08/10/2026)

| Hạng mục | Giá trị |
|---|---|
| `npx tsc --noEmit` | **0** (đo sau mỗi lượt L1→L7 + sau fix `BUG-D09`) |
| `npm run test:regression` | ⭐⭐ **`931 test · 930 pass · FAIL 0 · 1 skip`** — **0 LỖI TOÀN BỘ** (cập nhật vòng 58; trước đó `930·928·FAIL 1` với 1 lỗi `F-03`/`BUG-D08` của **phiên khác** — **nay đã XANH**) ⇒ ⭐ **0 lỗi do phiên này** |
| `tests/t13-work-progress-cell.test.mjs` | **6/6 PASS** (khoá ô nhập % · luồng `SUBMITTED`/`COMPLETED`/`REWORK` · `stopPropagation` · tiêu đề trang · **mọi khoá `fd.get(…)` phải có ô `name=…`**) |
| Tệp/khối test của phiên này | `tests/t13-work-progress-cell.test.mjs` (**5/5 PASS**, mới) · cập nhật **8 tệp** khoá cấu trúc cũ |
| `verify:fingerprint` | **ĐẠT** · `VNTECH-FP-7DFD3E8BEA628F78` (762 files) — ⚠️ **phiên khác đã refresh tiếp** thành `12EB928FC5C211BA` |
| `gd-cycle` | ✅ **exit 0** (head `0352`) — `FULL W2 SOURCE PREFLIGHT: ĐẠT` · `BUILT ARTIFACT VALIDATION: ĐẠT` |
| `verify-ui-build-applied` | ✅ **`✓ do-moi` · `✓ van-tay` · `✓ byte 6/6`** → `KET LUAN: BAN CHAY DUNG BAN DA BUILD MOI NHAAT` (tại thời điểm build của phiên này) |
| Dịch vụ | `:8787` **HTTP 200** · `:9000` **HTTP 200** |
| Kiểm **bundle đang phục vụ** | ✅ 5 tệp `/assets/*.js` (**1.339.923 ký tự**) chứa **đủ 10/10** dấu hiệu mới («Danh sách công việc» · «Được giao» · «Phòng ban/ Tổ đội» · «Tạo công việc» · «Gửi kiểm tra» · «Duyệt xong» · «Yêu cầu làm lại» · `work-detail-modal` · `work-assigned-tab` · `work-dept-subtab`) và **KHÔNG còn** «Danh sách việc của tôi» / «Tự tạo việc cho bản thân» |

---

## §3. BẰNG CHỨNG THÔ (dán lại được)

### 3.1. Dải tab + tab Dashboard đầu (đọc DOM)
```json
{ "coWorkCenter": true,
  "tabs": ["Dashboard","Danh sách công việc","Được giao","Phòng ban/ Tổ đội","Giao việc","Dự án","Báo cáo"],
  "active": ["Dashboard"] }
```

### 3.2. Tab «Phòng ban/ Tổ đội»
```json
{ "activeTab": "Phòng ban/ Tổ đội",
  "subDept": "Việc phòng ban của tôi · 16",
  "subTeam": "Việc của tổ đội tôi tham gia · 8",
  "cheDoXem": ["Bảng","Kanban","Cây"],
  "soDong": 16, "soNutTrongBang": 16 }
```
⭐ **16 dòng = đúng 16 nút** (chỉ nút mã việc) ⇒ chứng minh **`allowEdit={false}` ⛔ không render ô nhập %/nút duyệt** (đúng vai).

### 3.3. Modal chi tiết (việc 5)
```json
{ "hasModal": true, "ariaLabel": "Chi tiết công việc", "role": "dialog", "ariaModal": "true",
  "tieuDe": "CV-DA-260917-3436", "coNutDuyet": true, "coNutGuiKiemTra": false,
  "coThongBaoNhanXet": true, "coNutDong": true }
```
⭐ `coNutDuyet=true` + `coNutGuiKiemTra=false` với tài khoản `admin` ⇒ **phân quyền đúng vai trên bản chạy**.

### 3.4. Ảnh chụp màn hình (go-live evidence)
| Ảnh | Nội dung |
|---|---|
| `docs/dsh-mutil-session/SESSION_D/uat-tab7-phongban-todoi.png` | Tab «Phòng ban/ Tổ đội»: 1 mục hub · 7 tab · 2 sub-tab «·16»/«·8» · Bảng/Kanban/Cây · cột cuối «TIẾN ĐỘ & XÁC NHẬN» = «—» |
| `docs/dsh-mutil-session/SESSION_D/uat-modal-tao-cong-viec.png` | Modal «Tạo công việc»: khuôn chuẩn · 6 trường 2 cột · «Huỷ» + «＋ Tạo việc cho tôi» |

---

## §4. VIỆC CÒN LẠI (⛔ phiên này KHÔNG tự làm) — có chủ sở hữu

| # | Việc | Vì sao chưa xong | Cần ai |
|---|---|---|---|
| **1** | ✅ **ĐÃ NGHIỆM THU (vòng 71 · `TEST-D39`)** — **ô NHẬP % chạy thật**: tài khoản **NHÂN VIÊN** (`da_nv`, do admin giao việc) gọi `update_work_item_progress` ⇒ **HTTP 200** + CSDL **`progress=45`** + tự chuyển **`IN_PROGRESS`**; ✅ **`6b`** nhân viên nhận «Công việc mới». ⚠️ `admin` vẫn 0 việc nên UI của admin chỉ có **«Duyệt xong»** (đúng vai) | ⏳ Chỉ còn **ảnh màn hình** ô nhập % của nhân viên ⇒ **cần BUILD** (việc 4 của user) |
| **2** | **`BUG-D09`** (tiêu đề `<h1>` luôn «KPI…») | **ĐÃ SỬA** (code+test) nhưng ⏳ **chưa build lại** ⇒ UI chưa thấy | ⭐ **`gd-cycle` MỘT LẦN khi MỌI phiên dừng sửa** (⚠️ mỗi lần chạy lại SINH THÊM 1 migration identity ⇒ làm `BUG-D06` nặng thêm) |
| **3** | **`BUG-D08`** — `F-03` đỏ **23 mục** | ✅ **ĐÃ XANH (vòng 58)**: phiên đang sửa `java-backend` đã cập nhật xong ⇒ hồi quy **`931·930·FAIL 0·1`** ⇒ **`CLOSED`** (⛔ phiên này không tự đánh `VERIFIED` cho việc của phiên khác) | — (đã hết) |
| **3b** | **`BUG-D10`** — form giao việc **thiếu ô «Mô tả»** ⇒ trường gửi đi **luôn RỖNG** | ✅ **ĐÃ SỬA (vòng 58)**: thêm ô `<textarea name="description">` + ⭐ **test khoá CẢ LỚP LỖI** («mọi khoá `fd.get(…)` phải có ô `name=…`») | ⏳ `VERIFIED` chờ **build** |
| **4** | **`REWORK` thiếu trong Java** | Node có (`system-route.mjs:260`), Java ⛔ không (`OpsTaskManagementUseCase:23-24`) ⇒ nút «Yêu cầu làm lại» sẽ **400** nếu chạy backend Java | ⭐ Chủ `java-backend` (**đã bàn giao** `HANDOFF-D05`) |
| **5** | **`BUG-D06`** 40 nhóm trùng số migration · **`BUG-D07`** 19 class CSS chết | Chặn `test:release-static` / `verify:release` / `verify:css-baseline` | ⭐ Chủ `drizzle/**` và `app/globals.css` (**đã bàn giao** `HANDOFF-D06/D07`) |
| **5b** | ⚠️ **Nút «NHẬN XÉT» cho MỌI việc** (phần đầu của **việc 5**) ⛔ **CHƯA CÓ trên UI** | 🔴 BE ⛔ **chưa có handler** `add_work_item_comment` (**Java** — gọi vào trả **400** «chưa được triển khai trên backend Java»); Node ✅ đã có (`system-route.mjs:1286`) ⇒ ⭐ **quyết định của user**: **TẠM ẨN** nút (hiện **dòng thông báo** `work-comment-pending`) để ⛔ **không có nút chết** (xem `DEC-D12`, **supersede `DEC-D08`**) | ⭐ **Chủ `java-backend/**`** — **mã port dán sẵn ở `docs/57 §4.4`** (⚠️ chưa được uỷ quyền cho phiên này) |
| **7** | 🔴 **`BUG-20261008-D01` / `P-08` (HIGH — CÒN MỞ, đo lại vòng 67) — 18 action «MỒ CÔI QUYỀN»** ⇒ **403 với MỌI tài khoản không phải `admin`/`director`/`accountant`** | ⭐ **ĐO LẠI HÔM NAY — VẪN RỖNG `List.of()`**: **`create_project`** (`ActionRbacRegistry.java:89`) · **`update_project`** (`:322`) · **`delete_project`** (`:135`) · **`bulk_import_projects`** (`:75`) + 14 action khác (danh mục vật tư **7** · tổ đội **2** · lịch trình duyệt **3** · cấu hình **4**) ⇒ ⚠️ **NGHẼN NGHIỆP VỤ DỰ ÁN** (non-admin ⛔ không tạo/sửa/xoá dự án). ✅ **AN TOÀN — fail-closed** (`RbacService.java:84` danh sách rỗng ⇒ **TỪ CHỐI**, bản vá PHASE 0B S-03) ⛔ **KHÔNG phải lỗ hổng** · ⚠️ **NGOẠI LỆ ĐÃ ĐÚNG**: các action TỰ-PHỤC-VỤ nằm trong **allowlist ĐÓNG** `PUBLIC_ACTIONS` (`:57-72`: `change_password` · `mark_notification_read…` · `update_profile_signature` · `save_error_report`) ⇒ ⛔ không bị 403 | ⭐ **CẦN QUYẾT ĐỊNH NGHIỆP VỤ CỦA USER** (mỗi thao tác thuộc module nào — spec `docs/42`, **patch dán sẵn `docs/47`** §A module + §B capability + §C admin-only ⚠️ **P-11: phải sửa CẢ capability**, chỉ thêm module là **cấp quyền QUÁ RỘNG**) + **uỷ quyền `java-backend/**`** để dán |
| **8** | ✅ **`BUG-D12` — ĐÃ THI HÀNH (USER UỶ QUYỀN)**: **Node ✅** (`queueCompletionNotice` + gọi khi `COMPLETED`) · **Java ✅** (`queueCompletionNotice` ở **cuối lớp** + gọi **inline 1:1** tại `notifySafely(...)`) ⇒ ⭐ ghi **TRỰC TIẾP** `task_notifications` (`in_app`) + `email_outbox` (`task_completed`) cho **NGƯỜI GIAO** · ⚠️ bỏ qua 2 ca (không có người giao · người xác nhận chính là người giao) | ✅ **`FIXED`** = code + **BIÊN DỊCH 0 lỗi** (`javac` 72 tệp `domain`+`application`, ⛔ không cần Maven) + hồi quy **`952·951·FAIL 0·1`** ⭐ 0 LỖI | ⏳ **`VERIFIED`** cần **runtime 2 tài khoản** (giao việc ⇒ «Duyệt xong» ⇒ người giao thấy thông báo) · ⚠️ còn nên chạy `mvn -q compile` khi có Maven (⛔ chưa biên dịch `infrastructure`/`web`) |
| **9** | ✅ **`BUG-D13` — ĐÃ SỬA**: email «giao việc» bản **text** ghi SAI tên người giao (`OpsTaskManagementUseCase:258` dùng `sv(contact,"fullName")` = **tên NGƯỜI NHẬN**) ⇒ nay **`actor.fullName()`** (**thay 1:1 ⇒ ⛔ 0 dòng dịch**) | ✅ `FIXED` (code + biên dịch 0 lỗi + hồi quy 0 lỗi) | LOW — ⛔ không ảnh hưởng dữ liệu/luồng |
| **6** | 🔴 **`BUG-D12`** — ⛔ **THIẾU thông báo cho NGƯỜI GIAO khi việc chuyển `COMPLETED`** (đúng **yêu cầu 6c** của user) | ⭐ **Đo được**: `queueTaskNotice` **chỉ được gọi khi GIAO** (`system-route.mjs:293` tạo việc · `:1278` giao lại); handler `update_work_item_status` (`:1274-1275`) ⛔ **không gọi hàm thông báo nào**; ⚠️ **Java cũng thiếu** (mã dán sẵn ở `docs/57 §4.4`) ⇒ **thiếu ở CẢ 2 đường** | ⭐ **Chủ `scripts/**` (Node) + `java-backend/**`** (**đã bàn giao** `HANDOFF-D10`) — ⛔ phiên này không được uỷ quyền |
> ⚠️ **ĐÍNH CHÍNH (vòng 65)**: câu *«Java cũng thiếu»* ở dòng trên là **SAI** ⇒ **Java ✅ CÓ** phát thông báo khi `COMPLETED` (`OpsTaskManagementUseCase.java:385` **`notifySafely("TASK_COMPLETED")`**) nhưng là **thông báo THEO CẤU HÌNH** (`notification_configs`; ⚠️ không có cấu hình khớp thì ⛔ không phát) ⇒ ⛔ **không đảm bảo đúng người giao**. ⇒ 🔴 **Node ⛔ thiếu hoàn toàn (Node kém hơn Java)** · ⚠️ **đường Java cần CẤU HÌNH event `TASK_COMPLETED`** (việc ops) · ⭐ khuyến nghị **cả hai đường ghi thêm hàng `task_notifications` cho `assigned_by`** để ⛔ không phụ thuộc cấu hình |

---

## §5. BỔ SUNG CHO KỊCH BẢN UAT (`docs/56`) — các bước MỚI sau khi nghiệm thu tự động

1. **Kiểm tiêu đề trang** (sau khi build lại, cho `BUG-D09`): bấm «Công việc» ⇒ `<h1>` phải là **«Công việc»** ⛔ **không** phải «KPI & hiệu suất nhân viên».
2. **Kiểm ô nhập %** (việc 3 — dùng **tài khoản NHÂN VIÊN có việc**): mở tab **«Được giao»** hoặc **«Danh sách công việc»** của chính họ ⇒ cột **«TIẾN ĐỘ & XÁC NHẬN»** phải có **ô số** (0..100) + nút **«Lưu %»**; nhập 40 ⇒ bấm «Lưu %» ⇒ thanh tiến độ đổi **40%**.
3. **Kiểm 2 vai** (việc 6): nhân viên bấm **«Gửi kiểm tra»** ⇒ trạng thái **«Đã gửi kiểm tra — chờ trưởng phòng»**; trưởng phòng thấy **«Duyệt xong»** / **«Yêu cầu làm lại»** (⚠️ **phải nhập lý do**, nút mới bật).
4. **Kiểm chế độ xem** (việc 7): ở tab «Phòng ban/ Tổ đội» bấm **«Kanban»** ⇒ hiện bảng Kanban; bấm **«Cây»** ⇒ hiện khối phân cấp; bấm **«Bảng»** ⇒ về bảng.
5. **Kiểm «—» đúng vai**: tài khoản `admin` mở tab «Phòng ban/ Tổ đội» ⇒ cột «TIẾN ĐỘ & XÁC NHẬN» phải là **«—»** (⛔ không cho sửa việc của phòng khác) — **đã đạt**.

---

## §6. TỰ KIỂM LẠI (copy/paste)

```powershell
npx tsc --noEmit                                   # phải = 0
node --import tsx --test tests/t13-work-progress-cell.test.mjs   # phải 5/5 PASS
npm run test:regression                            # ⚠️ lỗi còn lại phải là F-03/BUG-D08 (không phải của phiên này)
node tools/verify-ui-build-applied.mjs             # phải ✓ do-moi · ✓ van-tay · ✓ byte
```

---

## §6b. BỔ SUNG 08/10/2026 (vòng 63) — **3 SỬA UI THEO YÊU CẦU MỚI CỦA USER**

| # | Yêu cầu user | Thực hiện | Bằng chứng |
|---|---|---|---|
| 1 | **Bỏ dải «ĐANG PHÁT TRIỂN»** trong module «Công việc» (*«module Công việc gần như đã hoàn thiện»*) | `app/page.tsx`: `DevelopmentNotice` nay chỉ hiện khi **`workCenterView === null`** ⇒ ⛔ ẩn trong **TOÀN module** (⭐ ⛔ **không đụng** danh sách dùng chung `DEVELOPMENT_MODULES` ⇒ ⛔ không ảnh hưởng 24 module khác) | `tsc` 0 · `CHG-D10` |
| 2 | **Bỏ filter «Chọn dự án»** (*«nếu cần thì tôi sẽ quyết định tab nào được filter»*) | `app/page.tsx`: `ProjectScopeSelect` cũng chỉ hiện khi **`workCenterView === null`** ⇒ ⛔ ẩn trong module; ⭐ **user sẽ chốt tab nào cần filter sau** | `tsc` 0 · `CHG-D10` |
| 3 | **Bỏ nút «Xuất CSV» ở MỌI tab** | `app/screens/WorkCenter.tsx`: gỡ nút `data-vntech="work-export-csv"` khỏi `ListToolbar` + **gỡ import** `downloadCsv` (⚠️ thư viện `lib/tabular-export.ts` **vẫn còn**, ⛔ chỉ gỡ import) + cập nhật chú thích | `tsc` 0 · `CHG-D10` |

⛔ **KHÔNG đổi**: nghiệp vụ · API/payload · RBAC. ✅ `tsc` = **0**.
⚠️ **Hồi quy `932 · 930 · FAIL 1`** — lỗi duy nhất = **`W-02`** (*«CSDL THẬT: 0 dòng mồ côi + số dòng khớp tệp audit»*, `kho=14 · dự án=5 · kho gắn dự án=10`) ⇒ ⭐ **đã chứng minh ⛔ KHÔNG do phiên này**: test đó chỉ đọc `docs/agent-progress/W-02-…md` + **truy vấn MySQL**, ⛔ không đọc UI; nó vừa chuyển đỏ vì **phiên khác vừa thêm kho/dự án** (đã bàn giao `EVENT-D261`).

> ⚠️ **LƯU Ý NGHIỆM THU**: cả 3 sửa **⛔ chưa thấy trên UI** vì **chưa build lại** (⛔ cố ý: `gd-cycle` mỗi lần chạy **sinh thêm 1 migration identity** ⇒ gộp **MỘT LẦN** khi mọi phiên dừng — xem `DEC-D15`).

---

## §7. CAM KẾT PHẠM VI & AN TOÀN (multi-session)

- ✅ **Tệp phiên này ĐÃ SỬA**: `app/screens/WorkCenter.tsx` · `lib/menu-helpers.ts` · `app/page.tsx` (**3 đoạn nhỏ**: đảo nhánh `workCenterViewFor` + `let title` + ghi đè tiêu đề) · `tests/{t01,t05,t06,t07,t08,t09,p5-01,t10,t13}` · `docs/**` của `SESSION_D`.
- ⛔ **KHÔNG sửa**: `java-backend/**` (ngoài uỷ quyền) · `tools/**` · `scripts/**` · CSS dùng chung · log của phiên khác.
- ⛔ **KHÔNG commit · KHÔNG push** (luật user: `AUTO_COMMIT = FALSE` · `AUTO_PUSH = FALSE`).
- ⛔ **KHÔNG xoá/ghi đè** thay đổi của phiên khác; ⛔ **không** `git reset/checkout/clean`; ⛔ **không** kill tiến trình dùng chung.
- ⚠️ **Bài học vận hành**: `gd-cycle` lỗi `EPERM` là do **KHÓA FILE Windows** (máy chủ đang mở `.local-data\warehouse.sqlite`) — ⛔ **không phải sandbox**; cách đúng: **xác định ĐÚNG PID** (`scripts/local-server.mjs`) ⇒ dừng ⇒ chạy `gd-cycle` ⇒ ⚠️ **`gd-cycle` KHÔNG tự khởi động lại** ⇒ phải chạy lại `node scripts/local-server.mjs`.
