# README — SESSION_C (ERP-SESSION-03)

`	ext
SCOPE   : hotfix FE giai đoạn GO-LIVE (thứ tự user chốt: FE → BE → DB)
STATUS  : 🟢 WORKING · 41 vòng · 0 push · 0 commit (theo Goal §47: AUTO_COMMIT=FALSE)
LOCK    : app/screens/** (trừ tệp phiên 02) · app/components/ui/* · lib/{status-labels,labels,report-catalog,request-export,ui-shared} · public/templates/* · tests/** · docs/dsh-mutil-session/SESSION_C/**
`

---

## ⭐ BẢNG ĐIỀU KHIỂN GO-LIVE — SESSION_C (cập nhật 2026-10-08 · **vòng 41/100**)

> ⭐ **MỘT TRANG ĐỂ USER NẮM TÌNH HÌNH.** ⛔ Mọi số liệu dưới đây **ĐO ĐƯỢC**, ⛔ không suy đoán.
> ⭐ Chi tiết: TASK_LOG **54** · TEST_LOG **65** · BUG_HOTFIX_LOG **14** · CHANGE_LOG **21** · DECISION_LOG **11** · HANDOFF_LOG **24** · EVENT_LOG **77** mục (⛔ 0 trùng lặp).

## 🟢 ĐÃ XONG & ĐÃ XÁC MINH (không cần user làm gì)
| Nhóm | Nội dung | Bằng chứng |
|---|---|---|
| **Lỗi user báo** | ① CCCD «Sửa hồ sơ» báo «… là bắt buộc» ② modal «Chi tiết đơn giao hàng» **cắt mất khối Ảnh/hồ sơ** | ⭐ ① **đối chứng âm API**: payload cũ ⇒ **400** · bản vá ⇒ **200** ② **đo DOM**: khối `49 → 279px`, `conCat = []` |
| **Tiếng Việt hoá** | Hết **mã tiếng Anh** ở **màn + tệp xuất + thẻ trạng thái** (`BUG-C03/C04/C05/C06/C08/C11`) | 9 **cổng hợp đồng** (`C03`·`C04` 13 ca·`C05`·`C06`·`C07`·`C08`·`C09`·`C10` 7 ca·`C11` 4 ca·`C12` 3 ca) + **DOM Thật** |
| **Định dạng ngày** | 12 chỗ hiển thị **`dd/mm/yyyy`** (hết ISO) | cổng `C10` **7/7** + **DOM** |
| **UTF-8** | 2 tệp mẫu CSV **có BOM** (Excel không sai dấu) | **đo BYTE** qua HTTP |
| **Chống tái phát** | **9 cổng** mới trong `tests/mt3-c0*.test.mjs` | ⭐ mỗi cổng có **ĐỐI CHỨNG ÂM** |
| 🚨 **LỖI MẤT DỮ LIỆU (09/10)** | **`BUG-20261007-C12` — modal «Sửa hồ sơ» XOÁ thông tin của tab không mở** ⇒ ✅ **ĐÃ VÁ 2 NGUYÊN NHÂN + VERIFIED** (⭐ kiểm bằng **giao diện thật** với tài khoản `admin`: payload POST + **9 ảnh** + đối chiếu CSDL) | ⛔ **trước**: payload `position:""` ⇒ CSDL `position` ⇒ **NULL** · ✅ **sau**: `position:"Chỉ huy trưởng"` ⇒ CSDL **giữ nguyên** |
| **Sức khoẻ** | Migration **`0339`→`0350`** · vân tay HTML **`830756713f67caff`** · hồi quy **901 test · 900 pass · 0 fail · 1 skip** · `tsc` 0 · `eslint` 0 lỗi | **11 lần `gd-cycle` exit 0** |

## ⭐ VÙNG ĐÃ QUÉT (⛔ nói thẳng phần CHƯA quét) — số đo mới nhất **vòng 48**
| Vùng | Đã quét | Kết quả |
|---|---|---|
| **Màn chính** | ⭐ **24 màn** *(lượt đo mới nhất trên build `0344`)* | **23 SẠCH** · 1 = `HANDOFF-C14` ⚠️ (ngoài quyền) |
| **Modal CHI TIẾT** | ⭐ **8** (+ **5 tab con** của modal dự án) | ⭐ **SẠCH 8/8** |
| ⭐ **Modal NHẬP LIỆU (form)** | ⭐ **6** *(mở bằng nút `＋ Tạo/Lập/Thêm`)* | ⭐ **SẠCH 6/6** — ⭐ **quét lặp 3 lần cho kết quả Y HỆT** ⇒ máy dò **ỔN ĐỊNH** |
| **Lớp lỗi theo mã** | **7 lớp** (locale · `en-US` · `Intl` · chữ Anh nút/tooltip · `.toFixed` tiền · nhãn dropdown · số tiền thô) **+ lớp thẻ trạng thái** | ⛔ **0 lỗi** ⇒ ⛔ không tạo việc giả |
| ⭐ **Kết luận đúng mực** | «**6 form + 8 modal chi tiết + 5 tab con đã quét đều SẠCH**» | ⛔ **KHÔNG** «mọi modal trong hệ đều sạch» |
| ⚠️ **Chưa quét** | ⚠️ **~20 khoá `open()`** (⚠️ đa số là form tạo mới ở màn ⛔ không có nút khớp mẫu) · 2 lớp cần AST | ⚠️ ⭐ **cần đọc mã tìm ĐÚNG màn + nút cho TỪNG khoá** (⛔ không quét mò) |

### ⚠️⚠️ LUẬT AN TOÀN khi quét tự động (⭐ mọi phiên phải tuân)
### ⭐ MỐC **60** VÒNG (09–10/10/2026) — bảng điều khiển nhanh
⭐ BUG **14** (⭐ **1 CRITICAL** mất dữ liệu — đã vá + VERIFIED · ⭐ **2 HIGH** phân quyền: C13 vá phần trong quyền + C14 màn quản trị chặn oan tài khoản cấu hình) · TASK **54** · TEST **65** · CHG **21** · HANDOFF **24** · ⭐ **15 cổng** (mt3-c03…c17) · **10 build** (migration 0339→0350) · ⭐ **21 ảnh bằng chứng** · hồi quy **925 test · 924 pass · 0 fail**.
⭐ **Audit luồng SỬA (UPSERT)**: trong quyền phiên 03 ⇒ ⭐ **⛔ 0 nguy cơ còn lại** (⚠️ 1 chỗ duy nhất là modal Sửa hồ sơ — đã vá); ⚠️ ngoài quyền: **HANDOFF-C18 = HIGH** (page.tsx: 3 chỗ có điều kiện + action **có nhánh UPDATE**).
⚠️ **ĐANG CHỜ USER QUYẾT 5 VIỆC** (⭐ xem mục «ĐANG MỞ» bên dưới).

### ⚠️⚠️ 4 LUẬT KỸ THUẬT MỚI (rút từ lỗi MẤT DỮ LIỆU 09/10 — ⭐ áp dụng cho MỌI phiên)
⭐ **17. ⛔ VÁ NỬA LỚP LỖI = CHƯA VÁ**: khi vá một lỗi «dạng mẫu» ⇒ **PHẢI `grep` TOÀN BỘ chỗ cùng mẫu trong CÙNG tệp/hàm**
   (⚠️ `BUG-C01` đã vá payload `update_user` mà ⛔ **bỏ sót** payload `save_hr_record` **trong cùng hàm `save()`** ⇒ 🔴 **mất dữ liệu THẬT**).
⭐ **18. REACT TÁI DÙNG `<input>` GIỮA 2 TAB**: hai nhánh tab render **cùng loại/cùng vị trí** ⇒ `defaultValue` ⛔ **không áp lại** ⇒ tab này **HIỆN giá trị tab kia** và ⚠️ **LƯU SAI**
   ⇒ ⭐ **MỌI form có tab render cùng cấu trúc PHẢI có `key={tab}` trên CẢ HAI nhánh**.
⭐ **19. KIỂM LẠI ĐƯỜNG ĐO TRƯỚC KHI KẾT LUẬN**: ⚠️ `GET /api/system` trả `{authenticated, data, ok}` ⇒ **mảng nằm ở `data.*`** (⚠️ đọc `.hrRecords` ra `null` ⇒ đếm sai thành **1**); ⚠️ và **khoanh vùng selector đúng modal** (⭐ modal sửa = `[data-vntech="hr-profile-edit"]`).
   ⚠️ Phiên 03 **suýt báo sai 2 lần trong cùng một vòng** vì 2 lý do này ⇒ ✅ **đã tự đính chính**.
⭐ **20. `{...new FormData()}` + backend `clean(payload.x)` = NGUY HIỂM**: ⚠️ **khoá VẮNG ⇒ backend coi như rỗng ⇒ ghi `""`/`NULL`**
   ⇒ ⭐ **form SỬA (UPSERT) ⛔ KHÔNG được dựa vào «khoá vắng = không đổi»** (⚠️ cho tới khi BE đổi sang **PATCH semantics**, xem HANDOFF-C17)
⭐ **21. ⛔ KHÔNG VIẾT CỔNG MÀ THIẾU «ĐỐI CHỨNG ÂM»** — ⚠️ **4 lần** trong phiên này «cổng xanh» nhưng **bộ dò chưa đủ mạnh** (`§C11` · `§C34` · `§C41` · **`§C53`**).
   ⭐ Và khi regex khớp **cấu trúc JSX 2 nhánh** (`? … : …`) ⇒ **PHẢI khớp CẢ HAI nhánh** (⚠️ lần này tôi **chỉ khớp `? (`** ⇒ suýt «ĐẠT RỖNG»).
   ⇒ ⭐ **CÁCH AN TOÀN**: gửi **ĐỦ trường**, ô không render ⇒ lấy **giá trị hiện có** (⭐ mẫu hrVal trong HrProfileEditModal.tsx).

⭐ Bộ chọn nút **CHỈ MỞ** (`＋|Tạo|Thêm|Mới|Lập|Nhập|Khởi tạo|Ghi nhận|Đăng ký` hoặc nút hành động ở dòng bảng) và ⛔ **PHẢI LOẠI** mọi nút chứa
**`Gửi` · `Lưu` · `Xoá/Xóa` · `Duyệt` · `Huỷ/Hủy` · `tệp` · `Đăng xuất` · `Xuất` · `In` · `Tải`** ⇒ ⭐ **⛔ 0 thao tác ghi/tạo/xoá/xuất dữ liệu**.

## ⚠️ ĐANG MỞ — ⭐ CẦN **USER** HOẶC PHIÊN GIỮ QUYỀN QUYẾT
| # | Việc | Ai | Ghi chú |
|---|---|---|---|
| ⭐ **0** | 🔴 **BUG-20261007-C13 (HIGH)** — nút «Sửa hồ sơ» **BỊ ẨN OAN** cho tài khoản cấp quyền **theo PHÒNG BAN** (⭐ đo được: tài khoản role hr CÓ dept_legal_hr.can_edit=1 mà ⛔ không thấy nút) ⇒ vá **1 DÒNG** bằng helper modulePermission(data, ...).canEdit | ⚠️ **S01** | ⭐ HANDOFF-20261007-C20 — ⛔ page.tsx = LOCK phiên 01 · ⚠️ chặn nghiệp vụ HR |
| 1 | ⭐ **`DEC-20261007-C11`**: chọn **quy ước PHẦN TRĂM** (A giữ nguyên · B `1 chữ số + dấu ,` · C số nguyên) | ⭐ **USER** | ⚠️ ~22 chỗ; ⛔ phiên 03 **không tự sửa** (là **chủ trương hiển thị**) |
| 2 | ⭐ **Nghiệm thu BẰNG MẮT** 3 bản vá UI: modal «Chi tiết đơn giao hàng» · thẻ trạng thái · nhãn «Tên đăng nhập» | ⭐ **USER** | ⚠️ phiên 03 ⛔ **không đọc được ảnh** ⇒ cần mắt người |
| 3 | **`HANDOFF-C15`**: **4 tệp màn MÔ CÔI** (code chết) — nối lại / xoá / ghi chú | ⭐ S01 hoặc USER | ⚠️ **xoá là hành động PHÁ HUỶ** ⇒ ⛔ phiên 03 không tự làm |
| 4 | **`HANDOFF-C13`**: `Inventory.tsx` (nhãn BCH + **6 chỗ ngày ISO**) | ⚠️ **S02** | ⛔ tệp phiên 02 |
| 5 | **`HANDOFF-C14`**: `app/page.tsx` (ngày ISO «Tiến độ dự án») | ⚠️ **S01** | ⛔ **LOCK phiên 01** — đã có **bằng chứng DOM** |
| 6 | **`HANDOFF-C12`**: mã thoát cổng dự án **không ổn định** (1 dòng `process.exit`) | ⚠️ S01/S02 | ⭐ luật tạm: **đọc DÒNG KẾT LUẬN + 3 dấu ✓** |
| 7 | `HANDOFF-C02` · `C04`–`C09` · `C11`: các **cổng/probe báo động giả** | ⚠️ S01/S02 | ⛔ **không phải lỗi sản phẩm** |
| 8 | ✅ **`DEC-20261008-001` (S01) — ĐÃ CHỐT PA-1**: nới backend theo **quyền cấu hình** `admin_tab_06` (khớp UI) | ✅ **USER đã quyết** | ✅ Đã thi hành: sửa **3 tầng** (registry · use-case · controller) — đo **EXIT 0** (`TEST-20261008-003`). ⭐ User chốt: `role=admin` = **break-glass toàn quyền**; việc thường ngày dùng tài khoản **ITM được cấp quyền theo CẤU HÌNH** |
| 9 | ✅ **`DEC-20261008-002` (S01) — USER ĐÃ CHỐT **S-1** (08/10/2026)**: chặn tự nâng quyền, ⛔ ngoại lệ `role=admin` | ✅ **ĐÃ THI HÀNH** | ✅ `CHG-20261008-003`: chốt ở `UserManagementUseCase.saveUserAccess` (⛔ trước `clearUserScopes`) + `RbacService.canUseModule`. ✅ ĐO 3 chiều `TEST-20261008-005` **EXIT 0**: tự cấp `admin` ⇒ **403** · giữ nguyên ⇒ **200** · cấp người khác ⇒ **200** · Java **86/86** |
| 10 | ✅ **`DEC-20261008-003` (S01) — USER ĐÃ CHỐT **M-2** (08/10/2026)**: «user chỉ cần có 1 quyền trong nhóm quản trị thì sẽ hiện menu quản trị» | ✅ **ĐÃ THI HÀNH** | ✅ `CHG-20261008-004` sửa **3 CỔNG** trong `page.tsx` (menu · `accessDenied` · render `<Admin/>`) + cập nhật `tests/m118-*` theo **ý định gốc MỐC 118**. ✅ E2E `TEST-20261008-006` **11/11**: cấp `admin_tab_06` ⇒ nav có `system_admin` · vào màn · **14 tab**. ⚠️ Bài học **D-096**: sửa 1 cổng thì menu hiện nhưng **thân màn TRỐNG** |

## 📊 TRẠNG THÁI CỦA PHIÊN
| | |
|---|---|
| Session | `ERP-SESSION-03` (`SESSION_C`) · **41 vòng** · vai trò **hotfix FE GO-LIVE** (⛔ không làm MT1/MT2/MT3 theo chỉ đạo user) |
| Tệp sản phẩm đã sửa | **21** `app/screens/*` + `app/components/ui/StatusBadge.tsx` + **4** `lib/*` + `public/templates/*` |
| Cổng đã thêm | **9** (`tests/mt3-c03…c12`) |
| Handoff | **15** (⚠️ 7 còn mở — ⛔ tất cả **ngoài quyền** phiên 03) |
| Sẵn sàng báo cáo tuần | ✅ **`WEEKLY_REPORT_DATA.md` PHẦN A đã dựng lại đủ 17 mục §14** (⚠️ báo cáo **chung** còn cần dữ liệu phiên 01 + 02 — ⭐ `SESSION_A` **đang cập nhật**) |

---


> Phiên thứ 3 trong cụm đa phiên `docs/dsh-mutil-session/`.
> **Session ID**: `ERP-SESSION-03` · **Bắt đầu**: 2026-10-07 16:54:34 (UTC+7)
> **Branch**: `unity` · **HEAD khi mở phiên**: `8bfde0d`
> Tuân theo quy ước chung ở `docs/dsh-mutil-session/README.md` (§4 — 9 loại log BẮT BUỘC).

## 1. Phạm vi (SCOPE) — chốt với user ngày 2026-10-07

User chỉ đạo: *dự án đang giai đoạn GO-LIVE ⇒ hotfix theo thứ tự ưu tiên **FE → BE → DB**, sửa
frontend trước để user test được ngay.*

| # | Việc | Loại | Ưu tiên |
|---|---|---|---|
| 1 | **BUG** modal «Sửa hồ sơ» → tab «Thông tin cá nhân» → sửa **CCCD** ⇒ báo lỗi «Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc» | HOTFIX FE | P0 |
| 2 | **Audit tab Tổ đội** + lược bỏ thông tin **thừa/rác** khỏi các màn | UI_UX | P1 |

## 2. RANH GIỚI TỆP — ⛔ KHÔNG giẫm lên phiên 01 / phiên 02

| Phiên | Tệp đang giữ (LOCK) | Nguồn |
|---|---|---|
| `ERP-SESSION-01` | `app/page.tsx` · `java-backend/**` | `SHARED_STATE.md` §«Đang giữ» |
| `ERP-SESSION-02` | `lib/warehouse-hub.ts` · `app/screens/Inventory.tsx` · `lib/menu-helpers.ts` · `tests/warehouse-hub.test.mjs` · `tests/w04-*` · `tests/w01-*` · `tests/mt3-ui-29-*` | `SHARED_STATE.md` §«Đang giữ» |
| **`ERP-SESSION-03` (tôi)** | `app/screens/HrProfileEditModal.tsx` · `app/screens/TeamDirectory.tsx` · `tests/mt3-c03-*.test.mjs` (**mới**) · `tests/tm01-team-list.test.mjs` (sửa assertion theo yêu cầu user) · `docs/dsh-mutil-session/SESSION_C/**` | `SESSION_C/HANDOFF_LOG.md` |

⛔ **KHÔNG sửa** `app/page.tsx` (phiên 01 giữ). Nếu buộc phải sửa ⇒ ghi `HANDOFF_LOG` **trước**.
⛔ **KHÔNG sửa** `java-backend/**` trong lượt này (luật FE-first của user).

## 3. Giao tiếp với 2 phiên còn lại

Kênh chính thức: **`SESSION_C/HANDOFF_LOG.md`** (theo `docs/dsh-state/00_GOAL_S4_MAPPING.md` §3
«Giao tiếp 2 phiên ⇒ `dsh-mutil-session/<SESSION>/HANDOFF_LOG.md`»).

Quy ước ghi:
1. Ghi vào **file của mình**, ⛔ không viết vào `SESSION_A/` hay `SESSION_B/`.
2. Tệp SHARED (`SESSION_REGISTRY.md` · `SHARED_STATE.md` · `SHARED_TODO.md`) ghi theo
   **READ → MODIFY CAREFULLY → PRESERVE OTHER SESSION DATA → WRITE → VERIFY**.
3. Mọi thông báo cho phiên khác phải có: `FROM · TO · TASK · LÝ DO · TỆP · TRẠNG THÁI ĐO ĐƯỢC ·
   VIỆC CẦN LÀM · RỦI RO · STATUS`.

## 4. Trạng thái log của phiên này

| Log | Trạng thái |
|---|---|
| `README.md` | ✅ (tệp này) |
| `EVENT_LOG.md` | ✅ |
| `TASK_LOG.md` | ✅ |
| `DEV_LOG.md` | ✅ |
| `CHANGE_LOG.md` | ✅ |
| `TEST_LOG.md` | ✅ |
| `BUG_HOTFIX_LOG.md` | ✅ |
| `DECISION_LOG.md` | ✅ |
| `HANDOFF_LOG.md` | ✅ |
| `WEEKLY_REPORT_DATA.md` | ✅ (tuần 2026-W41) |
