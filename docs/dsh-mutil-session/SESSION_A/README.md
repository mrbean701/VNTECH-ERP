# ⏱️ BẢNG ĐIỀU KHIỂN — `ERP-SESSION-01` (`SESSION_A`)

> ⭐ **Tệp này là điểm vào 1 chỗ cho phiên này** (và cho việc KHÔI PHỤC phiên — luật §29/§33).
> ⚠️ Cập nhật **mỗi lượt** khi trạng thái đổi. ⛔ Không ghi lịch sử dài ở đây — lịch sử nằm ở các sổ log cùng thư mục.

**Cập nhật lần cuối**: 2026-10-09 ≈16:50 (giờ VN, UTC+7) · **Trạng thái**: 🟢 **ĐANG CHẠY** (goal `active` · `armed`)

---

## 1. ĐỊNH DANH & PHẠM VI

| Trường | Giá trị |
|---|---|
| **SESSION_ID** | `ERP-SESSION-01` (thư mục `SESSION_A`) |
| **VAI TRÒ** | ⭐ **PR&PO + QUẢN TRỊ HỆ THỐNG (ADMIN)** — *user chốt 09/10/2026*: «*PR&PO - quản trị hệ thống (ADMIN) là phạm vi của mày, ⛔ đừng đẩy sang cho session khác*» |
| **SỞ HỮU (ghi được)** | `java-backend/**` (RBAC registry · use-case · adapter · bootstrap) · **ma trận phân quyền** (`PermissionMatrix*` · các dòng module) · `app/page.tsx` · `lib/ui-shared.tsx` · `lib/permissions.ts` · identity/vân tay/manifest/release · `tools/probe-*.mjs` (probe của S01) · `docs/dsh-mutil-session/SESSION_A/**` · `docs/agent-progress/MASTER_STATUS.md` |
| **⛔ CHỈ ĐỌC (của phiên khác)** | `app/screens/WorkCenter.tsx` · dải tab/màn Công việc (**S04**) · `lib/menu-helpers.ts` (**S04** — tệp dùng chung: S01 ⛔ chỉ chạm sau khi báo) · `tests/t13`·`t14`·`t05`·`t09`… (**S04**) · HR–Teams (**S03**) |
| **Cổng đang chạy** | `:8787` (UI) · `:9000` (proxy) · `:18081` (API Java, `java -jar web\target\vntech-erp-web-0.1.0-SNAPSHOT.jar --server.port=18081`) |

---

## 2. VIỆC ĐANG LÀM / VỪA XONG (09/10/2026)

| # | Việc | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1 | **`BUG-20261009-D31`** — tab «Phân quyền công việc / Chức năng» vẫn hiện **4 dòng CŨ theo phòng** | ✅ **VERIFIED** | DOM THẬT (`tools/_probe-matrix-rows.mjs`): 80 dòng · 4 khoá cũ **0 lần** · nhãn «Phòng Kế hoạch»/«Phòng Dự án» **0 lần** · 7 khoá mới **có đủ** |
| 2 | **`BUG-20261009-D27`** — nút «Xoá» (W3) xoá mềm nhưng **dòng vẫn hiện** | ✅ **FIXED** (chờ user bấm thử) | Cổng S04 `tools/probe-workitems-active.mjs` **EXIT 0**: payload **21 → 14** dòng · `active=0` = **0** |
| 3 | **`BUG-20261009-D32`** — 🔴 **sự cố S01 tự gây**: đóng gói jar khi API còn chạy (khoá tệp ⇒ jar mỏng) + **chú thích SQL chứa ký hiệu định dạng** ⇒ `MissingFormatArgumentException` ⇒ **HTTP 500** | ✅ **khắc phục + quét sạch + có CỔNG vĩnh viễn** | `tests/t16-java-sql-textblock-format.test.mjs` (3 ca, nghiệm thu âm đạt) · quét 0 dòng chú thích SQL chứa `%` |
| 4 | **`work_others`** (phương án A — cộng thêm) | ✅ **Cài + đo 2 chiều** | `0 → 19 → 0` việc khi cấp/xoá khoá · probe `probe-task058` **14/14 ĐẠT** · dọn sạch |
| 6 | **Quét hồi quy BUG-D27** trên MỌI đường đọc `work_items` | ✅ **SẠCH** | `TEST-20261009-037`: ⭐ chỉ **1** đường đọc-để-hiển-thị (payload) và **đã lọc** ✓; các đường khác (purge · archive · tra theo id) **đúng là ⛔ không lọc** ✓ |
| 5 | **Điều tra khoá module `admin`** | ✅ **⛔ không phải bug** (`DEC-20261009-024`) | `admin` ⛔ không phải cổng nào (menu gate = **vai trò** hoặc `admin_tab_NN`); `permissionMatrixKeys` dựng từ `moduleCatalog` ⇒ ⛔ không rủi ro xoá nhầm |

| 7 | **Nghiệm thu 2 quyết định user 16:26** (Q-UI-01 · Q-PERM-01) bằng **cổng của S04** | ✅ **CẢ 2 ĐẠT** | TEST-20261009-039: nút «＋ Tạo công việc» **sát ô tìm kiếm** (nhóm PHỤ ✓ primary=-1) · work_others **MỞ cho cả 5** TP/GĐ + **đối chứng ÂM đạt** ✓ |
| 8 | **Chạy chuỗi chốt theo yêu cầu S04** («⏸️ CHỜ S01 BUILD FE») | ✅ **XONG** | CHG-20261009-023: vân tay d200c5a3764e166d · manifest 7546 · dist **16:54:43** · **UI 3/3** · **2 cổng phát hành ĐẠT** ✓ |

---

| 9 | **Nghiệm thu 3 yêu cầu trực tiếp của user về menu «Công việc»** | ✅ **3/3 ĐẠT** | `TEST-20261009-040`: ⛔ bỏ «Quản trị dự án» ✓ · ⭐ tách «Trung tâm phê duyệt» (nhóm riêng `approval_center` sort 12) ✓ · click nhóm ⇒ mở màn Công việc ✓ |

## 3. CỔNG / SỐ ĐO HIỆN TẠI (⭐ đo được, ⛔ không suy đoán)

```text
vân tay nguồn   : VNTECH-FP-0B628BA46BF94A0E   (dist 16:42:17)
manifest        : 7545 tệp
cổng UI         : 3/3 ĐẠT  (do-moi · van-tay · byte)
verify-full-release : EXIT 0
test:release-static : ĐẠT · 5.3.0-ALPHA-TEST-2026.10
frontend        : 982 tests · 981 pass · 0 FAIL · 1 skip
java            : 110/110 · 0 Fail · BUILD SUCCESS
tsc 0 · eslint 0 error · coverage 0 mù quyền · catalog-drift 0 · F-03 7/7
git             : ⛔ 0 commit (≈98 tệp chưa commit — luật user: AUTO_COMMIT = FALSE)
```

---

## 4. ⏸ ĐANG CHỜ **USER** QUYẾT (⛔ không tự làm — luật «chạm quyết định của user thì DỪNG + HỎI»)

| # | Câu hỏi | Ghi chú |
|---|---|---|
| 1 | Nghiệm thu **2 bug đã vá**: ① «Xoá» một việc ⇒ **dòng mất ngay** (`D27`) ② tab Phân quyền ⇒ **4 dòng cũ mất** (`D31` — ⚠️ cần **Ctrl+F5** vì trình duyệt có thể còn cache) | Bản chạy ⭐ **đã đúng** (DOM chứng minh) |
| 2 | Xác nhận **ĐỀ XUẤT SUB-TAB**: **6 khoá TAB + 1 `work_others`** = 7 khoá (`DEC-20261009-022`) | Đang chạy theo đề xuất này |
| 3 | Phạm vi khoá **`work_others`**: **PHÒNG mình** (đang chạy ✓, đã đo 0→19→0) **HAY MỌI PHÒNG**? | Mặc định đang áp: **phòng mình** |
| 4 | (**`BUG-20261009-D33`**) 2 tài khoản demo `thukydemo` + `nvdademo` **login 401** dù `active=1` + hash hợp lệ ⇒ probe **bỏ qua 2 nhánh** (mất phủ sóng) — có **đặt lại mật khẩu kiểm thử** không? | ⚠️ 2 dòng `UPDATE`, hoàn nguyên được · ⛔ S01 không tự đổi |
| 5 | Có **dọn 21 dòng rác test** cấp khoá `admin` (`probe_grant1_*` …) không? | ⚠️ **vô hại** · ⛔ S01 không tự xoá |

---

| 6 | ⚠️ **`DEC-20261009-026`**: 4 khoá cũ đã **ẩn** vẫn giữ **168 quyền `department_default`** đang hiệu lực ⇒ admin **⛔ không nhìn/thu hồi** được trong ma trận. Chọn: **(A)** ⭐ giữ ẩn + **1 dòng ghi chú/tổng đếm** · **(B)** thêm **nút «Hiện khoá cũ»** · **(C)** bỏ hẳn khỏi RBAC (⚠️ lớn) | ✅ **Đã kiểm: ⛔ KHÔNG mất dữ liệu · ⛔ không bypass** (`TEST-20261009-041`) · ⭐ S01 khuyến nghị **(A)** |
| 7 | ⚠️ **`DEC-20261009-027`**: vai trò **`accountant`** (và `director`) **đi qua MỌI danh sách quyền** trừ action `admin` (`RbacService` L98–99 + L115 ✓) ⇒ ⚠️ **kế toán duyệt/xoá được việc của MỌI phòng** (⭐ đo thật: `kttdemo` ⛔ không bị 403 ✓). Chọn: **(A)** ⭐ giữ nguyên (đúng bản JS cũ) + ghi cảnh báo vào tài liệu · **(B)** bỏ `accountant` khỏi danh sách (⚠️ sửa 1 dòng Java + 110 test Java + build) · **(C)** giữ nhưng thêm danh sách action được phép (⚠️ lớn) | ⭐ Là **hành vi cố ý theo bản cũ** (mã tự ghi chú ✓), ⛔ không phải lỗ hổng mới · ⭐ S01 khuyến nghị **(A)** trong ALPHA + ghi tài liệu ✓ |

> ⭐ **CẬP NHẬT 17:50** (⭐ áp dụng **bài học 13**: *tra quyết định cũ trước khi hỏi user*): **2 câu đã ĐÓNG** — ① **phạm vi khoá `work_others`** = ⭐ **tuỳ CHỨC VỤ** (trưởng phòng ⇒ **phòng mình** · giám đốc/ban lãnh đạo ⇒ **mọi phòng** ✓ — đã đúng trong `workItemWhere` vế OR thứ 4 + `isWorkCompanyScope` ✓, theo quyết định cũ «THEO CHỨC VỤ/CẤP BẬC») ② **sub-tab** = user đã chốt nguyên tắc «**phân loại theo BẢN CHẤT**» ⇒ đề xuất 7 khoá của S01 chỉ còn cần **xác nhận danh sách** ✓ (`DEC-027` cũng đã rút ✓) ⇒ ⭐ **còn lại 3 việc thật cần user**: ① thử tay 4 điểm ② xác nhận danh sách 7 khoá ③ (`DEC-026`) 4 khoá cũ A/B/C · ⚠️ (**`BUG-D33`** + dọn rác test là việc nhỏ S01 tự xử được nếu user cho phép ✓)
## 5. 🤝 GIAO TIẾP LIÊN PHIÊN (đang mở)

| Hướng | Nội dung | Trạng thái |
|---|---|---|
| **S04 → S01** | `W-D27` (vá D27) · `W-W5` (xác nhận 7 dòng `modules[]`) | ✅ **S01 xong cả 2** (trả lời ở `SHARED_STATE` §98 + `SESSION_D/HANDOFF_LOG`) |
| **S01 → S04** | ⚠️ `tests/t15…` **khoá biểu thức lọc của `PermissionMatrix`** ⇒ báo S01 trước khi sửa | ✅ đã báo (§97) |
| **S01 → S04** | ⚠️ S01 **đã sửa** `PermissionAccessPanel.tsx` (lọc tầng vẽ, ⛔ đừng ghi đè — hợp khối **L408–409**) | ✅ đã báo (§96) |
| **Chờ S04** | `RELEASED — mtime cuối` ⇒ S01 chạy lượt chốt cuối | ⏸ S04 đang **tạm dừng chờ user** |
| ⚠️ **GHI NHẬN** | `scripts/system-route.mjs` bị sửa **16:29:23** (⚠️ sau khi S04 tuyên bố tạm dừng 16:22) — ⭐ fixpoint của S01 chạy **16:42** nên **vân tay đã phủ** thay đổi đó ✓ | ⛔ không chồng lấn |

---

## 6. ⚠️ BÀI HỌC VẬN HÀNH (⛔ phải nhớ — đã trả giá)

1. ⛔ **KHÔNG viết ký hiệu định dạng (`%s`/`%d`) trong text block SQL đi qua `.formatted(...)`** — **kể cả trong CHÚ THÍCH SQL** ⇒ `MissingFormatArgumentException` ⇒ **HTTP 500**. ⭐ Cổng: `tests/t16-…`.
2. ⛔ **KHÔNG `mvn package` khi API còn chạy** — Windows **khoá tệp jar** ⇒ `repackage` FAIL ⇒ **jar mỏng** ⇒ API ⛔ không lên («no main manifest attribute»). ⭐ ĐÚNG THỨ TỰ: **dừng API (đúng PID) → `mvn package` → khởi động lại**.
3. ⛔ **Dừng tiến trình phải KIỂM `CommandLine` trước** (⛔ không `Stop-Process node` hàng loạt — có thể giết phiên khác/DSH runner).
4. ⭐ **Test khoá hành vi PHẢI qua NGHIỆM THU ÂM** («chạy xanh» ⛔ chưa chứng minh gì) — và nếu test **vốn đã đỏ**, cái «đỏ» đó ⛔ **không tính**.
5. ⭐ **«Không thấy trong mẫu» ⛔ ≠ «không tồn tại»** khi mẫu bị cắt (⚠️ probe in 20/80 dòng ⇒ phải in **toàn bộ** mới kết luận).
6. ⚠️ `new URL(...).pathname` trả đường dẫn **ĐÃ MÃ HOÁ** (`%20`) ⇒ dùng **`fileURLToPath`**.
7. ⭐ **ĐO TRƯỚC KHI SỬA** — hôm nay **5 lần** một «việc cần làm» hoá ra **đã đúng sẵn** hoặc **sẽ phá test** (⭐ đọc mã/tệp thật, ⛔ đừng tin state/trí nhớ cũ).

---

8. ⚠️ **SỬA BẤT KỲ tệp nào đã có trong manifest ⇒ phải chạy lại `node scripts/generate-release-manifest.mjs`** (⭐ cổng `verify-full-release` báo «SHA256 không khớp: <tệp>» nếu không) — ⭐ và nếu tệp đó nằm trong **vân tay nguồn** (`app/**` · `lib/**` · `java-backend/**` …) thì **BẮT BUỘC chạy cả `tools/fixpoint-fingerprint.mjs` + build lại** (⚠️ nếu không, `test:release-static` đỏ ở «Brand fingerprint» ✓). ⚠️ **ĐÍNH CHÍNH (09/10/2026 ≈17:05)**: bản ghi trước của bài học này nói «chỉ `docs/**`» — ⛔ **SAI**: nguyên nhân thật của lần đỏ đó là `app/screens/WorkCenter.tsx` bị **phiên khác sửa sau giờ build** (⚠️ S01 đã suy sai từ tệp docs mình vừa sửa ⇒ ⭐ lại là «ĐO trước, ⛔ đừng đoán» ✓).

---

## 7. BƯỚC TIẾP KHI ĐƯỢC RESUME

1. Đọc **tệp này** + `SHARED_STATE.md` (§ cuối) + `SESSION_D/README.md` (S04) ⇒ đối chiếu **mã thật** với state.
2. Kiểm **mtime** các tệp mã so với **giờ `dist`** ⇒ nếu có tệp mới hơn ⇒ chạy **chuỗi chốt** (fixpoint → SQLite → manifest → **build** → khởi động lại `:8787` → `verify-ui-build-applied` → `verify-full-release` → `test:release-static`).
3. Nếu user đã trả lời các câu ở **§4** ⇒ thi hành **đúng phương án user chọn** (⛔ không tự chọn mặc định).
4. Nếu S04 đã `RELEASED` ⇒ chạy lượt chốt cuối + thông báo.

10. ⭐ **TRƯỚC khi gọi một ACTION LẠ ⇒ phải ĐỌC nó GHI GÌ**: action **TẠO MỚI** (`create_self_work_item` · `create_work_item`) ⛔ **không cần id** ⇒ «dùng id giả» **⛔ KHÔNG bảo vệ được** ✓ (⭐ đã tạo thật 3 bản ghi ⇒ `BUG-20261009-D34` ✓) · ⭐ **test quyền** phải chọn action **⛔ không chứa khoá NỀN** (`work` = mọi nhân viên đều có) trong danh sách OR ✓.
11. ⚠️ **⛔ ĐỪNG giấu lỗi**: chạy `mysql … 2>$null` đã **2 lần** che mất lỗi cột ⇒ truy vấn **rỗng** mà tưởng «không có dữ liệu» ✓ (⭐ để `stderr` hiện ✓).
12. ⚠️ **Lệnh PowerShell DÀI rất dễ sai** (hôm nay **2 lần** lỗi cú pháp: thừa `)` · `` `u `` bị hiểu là escape Unicode) ⇒ ⭐ **chia nhỏ + dùng here-string** ✓.

---

## 8. 🗺️ BẢN ĐỒ «VAI TRÒ ⇒ QUYỀN ĐẶC BIỆT» (⭐ ĐO TỪ MÃ — trả lời câu hỏi user «phân quyền theo tab hay **check theo chức vụ**?»)

> ⭐ **Trả lời ngắn**: hệ thống dùng **CẢ HAI** — **theo chức vụ (vai trò)** cho 2 tầng trên, **theo tab/chức năng (module × năng lực)** cho mọi vai trò còn lại ✓. ⚠️ Mọi điều dưới đây **đã có quyết định của user** (⚠️ ⛔ **không phải việc mới cần quyết** — xem ghi chú cuối §).

| Tầng | Vai trò | Được làm gì | Nguồn (ĐO TỪ MÃ) |
|---|---|---|---|
| **1** | `admin` | ⭐ **MỌI action** | `RbacService.isAdmin(user)` ⇒ `return` ✓ |
| **2** | ⭐ **`director` · `accountant`** | ⚠️ **MỌI action TRỪ 18 action chỉ-admin** | `RbacService` **L98–99** `isCompanyLeadership` = `List.of("director","accountant")` ✓ + **L115** ✓ |
| **3** | `da_truong` · `ksda` · `kh_nv` · `kh_truong` · … | ✅ **theo MODULE × NĂNG LỰC**: quyền của **chính người đó** (`user_module_permissions`) **HOẶC** quyền **PHÒNG** (`department_module_permissions` `can_approve=1` ✓) | `ActionRbacRegistry.modulesFor(action)` + `ModulePermissionStore` ✓ — ⭐ đo thật: `ksda.demo` **403** · `kttdemo` (`accountant`) **đi qua** · `trdademo` (`da_truong`) đi qua bằng `approvals.can_approve=1` của phòng ✓ |
| **0** | mọi người | ✅ 8 action **công khai** | `PUBLIC_ACTIONS` ✓ |
| ⛔ | **mọi vai trò** (kể cả director/accountant) | ⛔ **18 action CHỈ `admin`** | `ADMIN_ONLY_ACTIONS`: danh mục vật tư 7 · lịch trình duyệt 3 · tổ đội 2 · nhập hàng loạt 2 · cấu hình email/UI/trust 4 ✓ — ⭐ kiểm **TRƯỚC** nhánh leadership (⛔ nếu đặt sau thì director/accountant lọt ✓ — mã có ghi chú đúng điều này ✓) |

### ⭐ HAI định nghĩa «Ban lãnh đạo» — **KHÁC NHAU CÓ CHỦ Ý** (⭐ quyết định của user, `TASK-024`)

| Dùng cho | Định nghĩa | Ý nghĩa |
|---|---|---|
| **CỔNG QUYỀN hành động** | `{director, accountant}` | ⚠️ `accountant` **đi qua mọi action** (trừ 18), và `thuky`/`tgd`/`giam_doc`/`hcpc_truong` (`base_role='director'`) ⛔ **KHÔNG** được nới ở tầng này |
| **BỘ LỌC DỮ LIỆU bootstrap** | **7 mã vai trò** + `base_role='director'` | ✅ `accountant` ⛔ **KHÔNG** thuộc nhóm này ⇒ dữ liệu họ thấy vẫn theo phạm vi thường ✓ |

⭐ **Quyết định gốc**: `scripts/system-route.mjs` **L403–413** ghi: «**Q2 (18/09/2026) — NGƯỜI DÙNG QUYẾT: "giữ Java, sửa JS"** cho lớp lệch `isCompanyLeadership` (`TASK-024`)» ✓ + ⭐ **cổng kiểm**: `tools/probe-task024-leadership-parity.mjs` (đối chiếu 3 tệp nguồn ✓).
⇒ ⭐ **Vì vậy**: việc «`accountant` đi qua cổng quyền» mà S01 đo được hôm nay (09/10, `TEST-20261009-042`) là **hành vi ĐÚNG theo quyết định của user** ✓ ⇒ ⛔ **KHÔNG phải lỗ hổng mới, ⛔ KHÔNG cần quyết lại** ✓ (`DEC-20261009-027` **đã ĐÓNG** ✓).

### ⚠️ 3 điều rút ra khi đo (giữ lại để ⛔ không quên)
1. ⭐ **Thứ tự nhánh là một phần của luật** — `ADMIN_ONLY_ACTIONS` phải đứng **TRƯỚC** `isAdmin`/`isCompanyLeadership` ✓.
2. ⭐ **Mốc 110 (30/09)** đã vá 1 lỗ thật: nhánh «action chưa khai module» **trước đây CHO QUA** ⇒ nay **TỪ CHỐI** ✓ + 18 action chuyển sang `ADMIN_ONLY_ACTIONS` (`P-08`, 08/10 ✓).
3. ⚠️ Đường **JS cũ** (`scripts/system-route.mjs`) là **legacy** (⛔ không phục vụ ✓ — API sống là **Java `:18081`** ✓) ⇒ ⭐ **luật Java là luật SỐNG** ✓.

---

## §4b — ⚠️ **TỒN ĐỌNG MỚI phát hiện 09/10/2026 ≈20:15** (⭐ từ biên bản `MT3` — ⛔ **S01 KHÔNG tự chọn** ✓ đúng luật user)

| # | Tồn đọng | Bằng chứng | ⭐ Đề xuất của S01 (⛔ chưa áp) |
|---|---|---|---|
| **P-4** | ✅ **ĐÃ AN TOÀN THEO THIẾT KẾ (09/10 20:30) — ⛔ GỠ KHỎI HÀNG CHỜ USER** (⭐ đo trước khi hỏi ✓): `ActionRbacRegistry` **L50** «`save_notification_config` ⇒ `List.of("admin")`» ✓ + L52/53/63/64 đều `admin` ✓ + `RbacService` L115 (lãnh đạo ⛔ không được miễn ✓) ⇒ ⭐ **chỉ module `admin` mới gửi được thông báo** ⇒ `recipientMode="all"` ⛔ **không tới tay người dùng thường** ✓ — ⚠️ *(nếu user muốn siết hơn nữa thì đó là quyết định MỚI, ⛔ không phải tồn đọng)* · ~~Thông báo `recipientMode="all"` (TOÀN CÔNG TY) — AI được gửi?~~ | `NotificationManagementUseCase` **L105**: để TRỐNG ⇒ **MẶC ĐỊNH `all`** ✓ ⇒ ⭐ **bất kỳ ai có quyền gửi thông báo đều gửi được toàn công ty** ✓ (⚠️ `MT3` `A4` ghi: «*Còn lại (chưa được trả lời) … ai được gửi? ⇒ ⛔ không tự chọn; ghi tồn đọng*» ✓) | ⭐ **Giới hạn `all` cho Ban lãnh đạo + Quản trị** (⚠️ cần user chốt: giới hạn **theo ai** ✓) — ⛔ S01 ⛔ **chưa sửa gì** ✓ |
| **P-5** | ⚠️ **Cấu trúc 10 TAB màn Mua hàng** (quyết định **26/09** của user ✓) — hiện màn chỉ có **3 tab** (`PR` · `PO` · `Chi tiết lũy kế theo vật tư` ✓) | 10 khoá `dept_plan_*` **có trong mã** ✓ (`menu-helpers.ts` 23 dòng · `page.tsx` 19 · `ui-shared.tsx` 6 ✓) nhưng **chưa dựng thành tab** ✓ · ⭐ khớp `docs/25` L118 `P-08` «CHƯA LÀM» ✓ | ⭐ **Chờ user**: 10 tab này **làm cùng `P-08`** hay **làm ngay**? ⛔ S01 ⛔ **không tự dựng** (GOAL §19 ✓) |

> 📌 **CẬP NHẬT `P-5` (09/10 20:45) — ⭐ HẠ MỨC THÀNH «THÔNG TIN», ⛔ KHÔNG phải việc user phải quyết ngay** (⭐ S01 đo trước khi hỏi ✓):
> Nhóm Mua hàng **khai báo 18 mục** trong `lib/menu-helpers.ts` ✓ (8 mục cũ `dept_plan_*` có `subGroup: "Phòng Kế hoạch"` + 6 mục L119–132 + cặp P-07 ✓) ⚠️ nhưng **UI SỐNG hiện ĐÚNG 2 mục** («Nhà cung cấp» + «Đối tác» ✓) ⇒ ⭐ **8 mục cũ bị ẩn CÓ CHỦ Ý** ✓ ⇒ ⭐ trạng thái **NHẤT QUÁN với `P-08` «CHƯA LÀM»** ✓ ⇒ ⛔ **không phải khiếm khuyết** ✓ ⇒ ⭐ **khi làm `P-08` thì 10 tab sẽ được dựng** ✓
> ⚠️ `lib/menu-helpers.ts` là **tệp của S04** ⇒ S01 **⛔ KHÔNG sửa, ⛔ KHÔNG kết luận thay** ✓
