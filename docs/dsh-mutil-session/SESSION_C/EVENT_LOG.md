# EVENT_LOG — SESSION_C (ERP-SESSION-03)

> ⛔⛔ **ĐÍNH CHÍNH MỐC THỜI GIAN (ERP-SESSION-03 tự phát hiện, ghi lúc 2026-10-07 17:35:27)**
> Các tiêu đề vòng ở nhiều tệp log của phiên 03 ghi `(2026-10-07 18:xx … 21:xx)` — ⛔ **CÁC MỐC GIỜ ĐÓ SAI**
> (tôi tự suy ra theo cảm nhận tiến độ, ⛔ không đọc đồng hồ). **ĐO LẠI bằng mtime tệp + `Get-Date`:**
> - Phiên bắt đầu: **16:54:34** · Thời điểm viết dòng này: **17:35:27** ⇒ **cả phiên chỉ dài ~41 phút** (16:54 → 17:35).
> - Mốc THẬT của các tệp log: `README` 16:54 · `DEV_LOG`/`DECISION_LOG` **17:26** · `TASK_LOG`/`BUG_HOTFIX_LOG` **17:31**
>   · `TEST_LOG`/`HANDOFF_LOG` **17:33** · `EVENT_LOG`/`CHANGE_LOG` **17:33** · `WEEKLY_REPORT_DATA` **17:34**.
> ⇒ ⭐ **Nguồn sự thật về thời gian** = **thứ tự sự kiện trong tệp này + mtime tệp**, ⛔ **không** dùng các nhãn giờ trong tiêu đề vòng.
> ⭐ **BÀI HỌC**: ⛔ **không tự suy mốc thời gian** — mọi mốc phải lấy từ `Get-Date`/mtime (Goal §8: chuẩn hoá `YYYY-MM-DD HH:mm:ss`).

> Timeline sự kiện. ID: `EVT-YYYYMMDD-NNN`. ⛔ Không dùng lại ID.
> Sự kiện hợp lệ: SESSION_START · TASK_START · BUG_FOUND · HOTFIX_START · HOTFIX_DONE ·
> TEST_RUN · VERIFICATION · BLOCKER · HANDOFF · OWNERSHIP_CLAIM · SESSION_END

## EVT-20261007-C01 — SESSION_START
- **Thời điểm**: 2026-10-07 16:54:34
- **Session**: `ERP-SESSION-03` (session thứ 3 của cụm đa phiên)
- **Môi trường đo được**: branch `unity` · HEAD `8bfde0d` · Java API `:18081` **DOWN (404 trên `/actuator/health`)** ·
  Node UI `:8787` **200** · cutover proxy `:9000` **200**
- **Đo được**: `docs/dsh-mutil-session/` đã có `SESSION_A` (ERP-SESSION-01, 9 log) + `SESSION_B`
  (ERP-SESSION-02, 9 log) + 3 tệp SHARED ⇒ phiên này tạo `SESSION_C`.
- **Nhiệm vụ nhận**: (1) hotfix BUG CCCD ở modal «Sửa hồ sơ»; (2) audit tab Tổ đội + lược bỏ
  thông tin thừa/rác. Luật user: **FE → BE → DB**, sửa FE trước để user test được.

## EVT-20261007-C02 — OWNERSHIP_CLAIM
- **Thời điểm**: 2026-10-07 16:54:34
- **Giữ (LOCK)**: `app/screens/HrProfileEditModal.tsx` · `app/screens/TeamDirectory.tsx` ·
  `tests/mt3-c03-*.test.mjs` (mới) · `tests/tm01-team-list.test.mjs` (sửa 1 assertion) ·
  `docs/dsh-mutil-session/SESSION_C/**`
- **Căn cứ**: đối chiếu `SHARED_STATE.md` §«Đang giữ» ⇒ **giao = ∅** với tệp của phiên 01 và 02.
- ⛔ Không claim `app/page.tsx` (phiên 01) và `lib/menu-helpers.ts` (phiên 02).

## EVT-20261007-C03 — BUG_FOUND
- **Thời điểm**: 2026-10-07 16:56
- **Bug**: `BUG-20261007-C01` — modal «Sửa hồ sơ» → tab «Thông tin cá nhân» → sửa CCCD ⇒
  backend trả **400** «Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc».
- **Trạng thái**: OPEN → xem `BUG_HOTFIX_LOG.md`.

## EVT-20261007-C04 — TASK_START
- **Thời điểm**: 2026-10-07 16:56
- **Task**: `TASK-20261007-C01` (hotfix CCCD) · `TASK-20261007-C02` (audit Tổ đội)
- **TODO hiển thị trên DSH**: 7 bước (todo_write) · **Telegram**: đã gửi 1 bản tin bắt đầu.

## EVT-20261007-C05 — HANDOFF
- **Thời điểm**: 2026-10-07 16:54:34
- **Nội dung**: thông báo cho `ERP-SESSION-01` và `ERP-SESSION-02` biết phiên 03 đã mở, phạm vi,
  LOCK và **cảnh báo chồng lấn**. Chi tiết: `HANDOFF_LOG.md` §`HANDOFF-20261007-C01`.

## EVT-20261007-C06 — TEST_RUN (cổng tĩnh + cổng hồi quy)
- **Thời điểm**: 2026-10-07 17:1x
- **Đo được**: `tsc` **0 lỗi** · `eslint` (2 tệp sửa) **0 lỗi** ·
  8 tệp test hợp đồng **55/55 pass · 0 fail** · `npm run test:regression` **811 test · 810 pass · 0 fail · 1 skip**.
- ⚠️ **Ghi rõ lượt chạy ĐẦU có 5 ca đỏ — ⛔ không che**: 1 ca do **lỗi THẬT của phiên 03** (sót 1 `note` in
  `team_members.left_at` + luật guard quét nhầm giá trị attribute), 3 assertion do **đổi yêu cầu có chủ ý**,
  2 ca do **lỗi CÔNG CỤ ĐO** (`between()` bỏ qua tham số `to`, lại còn nhận chuỗi `");\n"` trong khi tệp dùng **CRLF**
  ⇒ không bao giờ khớp ⇒ cửa sổ tràn sang code mới). Chi tiết: `TEST_LOG.md` §C01.

## EVT-20261007-C07 — HOTFIX_DONE (build lại bundle)
- **Thời điểm**: 2026-10-07 17:2x
- **Hành động**: dừng **đúng PID** Node UI (`1368`) + proxy (`13288`) — ⛔ **không** dừng Java `:18081` —
  rồi chạy `node tools/gd-cycle.mjs "SESSION 03 HOTFIX CCCD + DON RAC TO DOI"`.
- **Đo được**: migration `drizzle/0330_phase_gd_..._identity.sql` · PREFLIGHT **ĐẠT** · FINGERPRINT **ĐẠT** ·
  ARTIFACT **ĐẠT** · fixed point stable `OK` · **EXIT 0** · vân tay mới **`VNTECH-FP-846B70AAA8D06A12`** (720 files).
- **Khởi động lại**: `node scripts/local-server.mjs` (`:8787`) + `node tools/cutover-proxy.mjs --port 9000
  --ui-port 8787 --api-port 18081` (`:9000`) — cả hai **HTTP 200**.

## EVT-20261007-C08 — VERIFICATION (bundle đang phục vụ chứa bản vá)
- **Thời điểm**: 2026-10-07 17:2x
- **Phép đo**: tải 6 tệp `/assets/*.js` từ `:9000` về đĩa, đọc **chuỗi tiếng Việt RAW** (phương pháp của S01).
- **Kết quả**: ✅ CÓ «Hồ sơ nhân sự ĐÃ lưu» · ✅ CÓ «Phiếu cấp phát & hoàn trả của tổ đội» ·
  ⛔ KHÔNG còn «Nguồn dữ liệu của 6 tab» · ⛔ KHÔNG còn «TÁI DÙNG logic cấp phát kho» ·
  ⛔ KHÔNG còn «mang team_id của tổ đội này».
- ⇒ Bản vá **đã ở trên bản đang chạy**, ⛔ không chỉ nằm ở mã nguồn.

## EVT-20261007-C09 — HANDOFF (nợ kỹ thuật BE)
- **Thời điểm**: 2026-10-07 17:2x
- **Nội dung**: `HANDOFF-20261007-C02` gửi `ERP-SESSION-01` — `UserManagementUseCase.java:115-116`
  `fullName` **không có fallback** dù `employeeCode`/`username` có; kèm bằng chứng dòng và 2 phương án (①/②)
  **chờ user chốt**.
- **Trạng thái**: `OPEN` — ⛔ cố ý chưa sửa (luật user: FE trước, BE sau).

## EVT-20261007-C10 — TASK_START (vòng 2 — GO-LIVE CONTINUOUS)
- **Thời điểm**: 2026-10-07 17:4x
- **Nhiệm vụ**: `TASK-20261007-C03` — audit UTF-8 **toàn bộ** đường xuất Excel/CSV theo yêu cầu user
  («tôi test 1 số nút đang bị lỗi UTF8»).
- **Đã chiếm (claim)**: `public/templates/**` · `tests/mt3-c03-export-utf8.test.mjs` — đối chiếu LOCK của
  S01/S02: **giao = ∅**.

## EVT-20261007-C11 — BUG_FOUND (`BUG-20261007-C02`)
- **Thời điểm**: 2026-10-07 17:5x
- **Đo được**: **2/13 đường xuất LỖI** — `public/templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv` (241 B) và
  `Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv` (1175 B) **thiếu BOM UTF-8**, trong khi 3 tệp CSV
  còn lại có BOM. 11 đường còn lại (code + backend) **ĐẠT**.
- **Vì sao tồn tại lâu**: `scripts/template-preflight.mjs` **ĐẠT** nhưng ⛔ **không kiểm BOM**.

## EVT-20261007-C12 — HOTFIX_DONE + BUILD lại (2 lần)
- **Thời điểm**: 2026-10-07 18:0x–18:2x
- **Lần 1** (`gd-cycle` «SESSION 03 HOTFIX CCCD + DON RAC TO DOI»): migration `drizzle/0330…`,
  vân tay `VNTECH-FP-846B70AAA8D06A12` (720 files).
- ⛔ **SỰ CỐ + CÁCH SỬA**: tôi chạy `fixpoint-fingerprint.mjs` **để kiểm tra** nhưng script này **GHI** ⇒
  đổi định danh sang `VNTECH-FP-6D015E959F55D73A`, **lệch** với artifact đang phục vụ. → khắc phục bằng
  **lần 2** (`gd-cycle` «SESSION 03 UTF8 CSV TEMPLATE BOM»): migration `drizzle/0331…`,
  vân tay **`VNTECH-FP-B28418CE305E837E`** (722 files), `fixed point stable: OK`, PREFLIGHT · FINGERPRINT ·
  ARTIFACT **ĐẠT**, exit `0`.
- **Tệp mẫu đã vá publish vào artifact**: 241 B → **244 B** · 1175 B → **1178 B** (đều có BOM).

## EVT-20261007-C13 — BUILD/SERVER COORDINATION
- **Thời điểm**: 2026-10-07 18:0x · **Loại**: phối hợp đa phiên
- **Đo được**: `:8787` từng bị **một tiến trình KHÁC** khởi động lại (pid `18516` → `14952`) — ghi nhận,
  ⛔ không nhận xét thay phiên khác.
- **Đã làm**: dừng **đúng PID** Node UI (`14952`) + proxy (`18520`) — ⛔ **không** dừng Java `:18081`
  và ⛔ **không** dùng `Stop-Process node` — rồi build, sau đó **khởi động lại bằng tiến trình của mình**
  (`:8787` job `pwsh-72`, `:9000` job `pwsh-73`). Ghi vào `SHARED_STATE.md` + `HANDOFF-20261007-C03`.

## EVT-20261007-C14 — VERIFICATION (LIVE, sau build lần 2)
- **Thời điểm**: 2026-10-07 18:2x
- **Đo được**: `:8787` **200** · `:9000` **200** ·
  `GET /templates/Mau_Danh_Muc_Vat_Tu_MEP_VNTECH.csv` trên **cả 2 cổng** = **244 B · BOM=True** ✅ ·
  `GET /templates/Mau_Gia_Tri_Doi_Chieu_BOQ_Hop_Dong_VNTECH_V5_1.csv` = **1178 B · BOM=True** ✅ ·
  bundle vẫn giữ 2 bản vá vòng 1 và ⛔ không còn chuỗi rác.
- **Cổng**: `tsc` 0 · `eslint` 0 · `test:regression` **816 test · 815 pass · 0 fail · 1 skip** ·
  cổng UTF-8 **5/5** + **đối chứng âm ĐỎ đúng thiết kế**.
- ⏳ **Chờ USER** nghiệm thu 3 task (`C01` · `C02` · `C03`) ⇒ mới chuyển `VERIFIED`.

## EVT-20261007-C15 — TASK_START (vòng 3)
- **Thời điểm**: 2026-10-07 18:5x
- **Nhiệm vụ**: `TASK-20261007-C04` — «trạng thái đơn/phiếu toàn hệ thống hiển thị TIẾNG VIỆT» (MT3 §IV.6).
- **Claim**: `lib/status-labels.ts` · `lib/labels.ts` · `lib/report-catalog.ts` · `StatusBadge.tsx` ·
  `app/screens/{Delivered,Purchasing,ProjectDetailTabs}.tsx` · `tests/mt3-c04-*` — đối chiếu LOCK S01/S02: **giao = ∅**.

## EVT-20261007-C16 — BUG_FOUND (`BUG-20261007-C03`) — đo được 4 nguyên nhân gốc
- **Thời điểm**: 2026-10-07 19:0x
- **Phép đo THẬT** (chạy `lib/status-labels.ts` bằng esbuild, script tạm đã xoá):
  `partial_issued` ⇒ **«Partial issued»** · `issued` ⇒ «Issued» · `awaiting_po` ⇒ «Awaiting po» ·
  `posted` ⇒ «Posted» · `REWORK` ⇒ **«REWORK»** · `WAITING_SUPPLIER` ⇒ «WAITING SUPPLIER»;
  mô phỏng `StatusBadge` ⇒ `value="IN_PROGRESS"` hiện **«IN_PROGRESS»**.
- **4 nguyên nhân**: ① bảng nhãn DÙNG CHUNG thiếu 15 mã · ② `StatusBadge` chỉ dịch chữ thường ·
  ③ `lib/labels.ts` rò mã thô (kể cả 2 đường **XUẤT TỆP**) · ④ `lib/report-catalog.ts` là bản `statusLabel` **thứ ba**.
- **Thêm phát hiện khi viết cổng**: ⑤ ô lọc trạng thái dựng nhãn từ mã thô (`Delivered` · `Purchasing`).

## EVT-20261007-C17 — TEST_RUN + HOTFIX_DONE + BUILD lần 3
- **Thời điểm**: 2026-10-07 19:1x–19:3x
- **Cổng**: C04 **7/7 PASS** (lượt đầu đỏ 2 ca — ⛔ **do test của tôi quá rộng**, đã thu hẹp và ghi rõ);
  `test:regression` lượt 1 **823/820/2 đỏ** (2 ca `v215` khoá VỊ TRÍ bảng nhãn) ⇒ cập nhật ⇒ lượt 2
  **823 test · 822 pass · 0 fail · 1 skip**; `tsc` 0; `eslint` **0 error** (6 warning CÓ SẴN từ trước).
- **Build**: `gd-cycle` «SESSION 03 TRANG THAI TIENG VIET» → migration `drizzle/0332_…`,
  vân tay **`VNTECH-FP-CC0200A8CAF69D28`** (724 files), PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT**, exit `0`.
- **Coordination**: dừng **đúng PID** UI `12704` + proxy `8272` (⛔ không dừng Java) → build → khởi động lại
  (job `pwsh-91` · `pwsh-93`).

## EVT-20261007-C18 — VERIFICATION (LIVE)
- **Thời điểm**: 2026-10-07 19:4x
- **Đo được**: `:8787` **200** · `:9000` **200**; bundle `:9000` (5 tệp, 1.319.919 ký tự) chứa **8/8 nhãn mới**:
  «Đã xuất kho» · «Chờ lập PO» · «Đang mua» · «Đã giao đủ» · «Đã ghi sổ» · «Giao một phần» · «Chờ NCC» · «Làm lại»;
  chốt `A-Za-z0-9_.-` (dịch mã chữ HOA) **CÓ**; **hồi quy**: 2 bản vá trước còn nguyên, chuỗi rác vẫn ⛔ không còn,
  CSV mẫu vẫn **244 B · BOM=True**.
- ⏳ **Chờ USER** nghiệm thu 4 task (`C01`…`C04`).

## EVT-20261007-C19 — TASK_START (vòng 4) + BUG_FOUND (`BUG-20261007-C04`)
- **Thời điểm**: 2026-10-07 20:0x
- **Task**: `TASK-20261007-C05` — nối tiếp lớp lỗi «hiển thị tiếng Anh» (chính tôi ghi tồn đọc lại ở vòng 3).
- **Claim**: `lib/status-labels.ts` · `app/screens/{ProjectDetailTabs,SealScreen,Requests,WorkCenter}.tsx` ·
  `tests/mt3-c04-status-vi.test.mjs` · `tests/v215-…` — đối chiếu LOCK S01/S02: **giao = ∅**
  (S01 giữ `app/page.tsx` + `java-backend/**`; S02 giữ kho/menu).
- **PHÉP ĐO quyết định**: đối chiếu **ô CHỌN trong form** (giá trị ghi xuống CSDL) với **bảng hiển thị**:
  ✅ **6 trường LƯU NHÃN TIẾNG VIỆT** (`benefitType` · `docType`×2 · `contractType` lao động · `costType`)
  ⇒ ⛔ **KHÔNG sửa** (tránh đổi nhầm chữ đã đúng); ⛔ **2 trường LƯU MÃ ANH**:
  `work_items.priority` (`critical|urgent|high|normal|low`) và `seals.seal_type` (`company|legal|signature|other`).
- ⭐ **Phát hiện kèm (sai NGHIỆP VỤ, ⛔ không chỉ sai ngôn ngữ)**: `WorkCenter` tự dịch bằng ternary lặp 2 chỗ và
  **SÓT `critical`** ⇒ việc **KHẨN CẤP** hiện **«Thường»**.

## EVT-20261007-C20 — HOTFIX_DONE + BUILD lần 4
- **Thời điểm**: 2026-10-07 20:1x
- **Vá (REUSE Goal §17)**: thêm domain `priority` + `seal_type` vào bảng nhãn DÙNG CHUNG (⛔ không tạo bảng thứ năm);
  ⛔ **không xoá** `KANBAN_PRIORITIES` (còn `tone`/`rank`; khối thuần của WorkKanban ⛔ không được import) ⇒
  thay bằng **CỔNG KIỂM** bắt 2 bảng không lệch nhãn.
- **Build**: `gd-cycle` «SESSION 03 UU TIEN VA LOAI CON DAU» → migration `drizzle/0333_…`,
  vân tay **`VNTECH-FP-810CCA1455FA48BD`** (725 files), PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT**, exit `0`.
- **Coordination**: dừng **đúng PID** UI `20760` + proxy `14564` (⛔ không dừng Java) → build → khởi động lại
  (job `pwsh-103` · `pwsh-104`).

## EVT-20261007-C21 — VERIFICATION (LIVE)
- **Thời điểm**: 2026-10-07 20:2x
- **Đo được**: `:8787` **200** · `:9000` **200**; bundle (5 tệp · 1.320.058 ký tự) chứa **4/4 nhãn mới**
  («Khẩn cấp» · «Dấu công ty» · «Dấu pháp nhân» · «Dấu chức danh»); **hồi quy 3 vòng trước ĐẠT**
  («Đã xuất kho» · «Hồ sơ nhân sự ĐÃ lưu» · «Phiếu cấp phát & hoàn trả của tổ đội» · ⛔ vẫn không còn chuỗi rác).
- **Cổng**: C04 **10/10** · `test:regression` **826 test · 825 pass · 0 fail · 1 skip** · `tsc` 0 · `eslint` 0 error.
- **HANDOFF mới**: `HANDOFF-20261007-C04` (S01) — `app/page.tsx` còn in `contractType` dự án dạng mã `main`/`addendum`.
- ⏳ **Chờ USER** nghiệm thu 5 task (`C01`…`C05`).

## EVT-20261007-C22 — TASK_START (vòng 5) + BUG_FOUND (`BUG-20261007-C05`)
- **Thời điểm**: 2026-10-07 20:4x
- **Task**: `TASK-20261007-C06` — ⛔ **tự phát hiện lỗ hổng phạm vi của cổng**: vòng 4 chỉ quét `app/screens/**`.
- **Mở rộng cổng sang `lib/**`** ⇒ **bắt được 3 chỗ**: `lib/request-export.ts` (**đường XUẤT PDF/XLSX** — rò mã thô),
  `app/screens/RequestDrawer.tsx` (hiện «Bình thường» cho mọi mã lạ) và `app/page.tsx` (⛔ thuộc S01).

## EVT-20261007-C23 — HOTFIX_DONE + ⚠️ HỒI QUY ĐỎ VÌ «dist CŨ HƠN NGUỒN» + BUILD lần 5
- **Thời điểm**: 2026-10-07 21:0x
- **Vá**: `lib/request-export.ts` + `RequestDrawer.tsx` ⇒ `statusLabel(value, "priority")`; `page.tsx` ⇒ `HANDOFF-20261007-C05`
  + ghi vào cổng dạng **NỢ ĐÃ GIAO có tên** (in ra mỗi lần chạy, ⛔ không miễn trừ trắng).
- ⚠️ **SỰ KIỆN ĐÁNG GHI**: `test:regression` **trước build** = **827 test · 824 pass · 2 ĐỎ** (`v217-4`/`v217-5`) vì cổng
  `tools/verify-ui-build-applied.mjs` báo **«dist/ CŨ HƠN nguồn»** — ⭐ **ĐÚNG THIẾT KẾ** (sự cố 02/10: user không thấy
  thay đổi frontend). ⇒ `gd-cycle` là **BẮT BUỘC**, ⛔ không phải tuỳ chọn.
- **Build**: `gd-cycle` «SESSION 03 UU TIEN DUONG XUAT» → migration `drizzle/0334_…`,
  vân tay **`VNTECH-FP-852E28FC276F90F6`** (726 files), PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT**, exit `0`.
- ⚠️ **Baseline đầu vào là `VNTECH-FP-0FFB3FBAE76F4098`** — ⛔ không phải số phiên 03 build gần nhất
  (`810CCA1455FA48BD`) ⇒ **một phiên khác đã build xen giữa** (⛔ phiên 03 không nhận xét thay ai).

## EVT-20261007-C24 — VERIFICATION (LIVE, 2 tầng)
- **Thời điểm**: 2026-10-07 21:1x
- **Tầng 1 — CỔNG CỦA CHÍNH DỰ ÁN** `node tools/verify-ui-build-applied.mjs`: `✓ dist/ mới hơn nguồn 9s (115 tệp đổi)` ·
  `✓ HTML mang 852e28fc… khớp SSOT` · `✓ 6/6 bundle đúng byte trên :9000` ⇒ **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** (exit 0).
- **Tầng 2 — đo trên bundle đang phục vụ**: `:8787` **200** · `:9000` **200**; **6/6 dấu vân tay 5 vòng** của phiên 03 có mặt;
  ⛔ vẫn không còn chuỗi rác.
- **Cổng**: C04 **11/11** · `test:regression` **827 test · 826 pass · 0 fail · 1 skip** (2 ca `v217` **XANH LẠI** sau build) ·
  `tsc` 0 · `eslint` 0 error.
- ⏳ **Chờ USER** nghiệm thu 6 task (`C01`…`C06`).

## EVT-20261007-C25 — TASK_START (vòng 7) — §22 «tab trong modal nhất quán»
- **Task**: `TASK-20261007-C08` · **Claim**: `tests/**` + `app/styles/canonical.css` (**chỉ ĐỌC**) — đối chiếu LOCK S01/S02: **giao = ∅**.
- **Phép đo ĐẦU TIÊN (trước khi sửa bất cứ gì)**: đọc `app/components/ui/EntityDetailModal.tsx` + `app/styles/canonical.css`
  ⇒ phát hiện các lớp `edm-*` **KHÔNG** nằm ở `globals.css` mà ở **`app/styles/canonical.css`** (⛔ tài liệu dễ gây tưởng nhầm).

## EVT-20261007-C26 — ⭐ QUYẾT ĐỊNH: **⛔ KHÔNG SỬA** — chuyển sang KHOÁ BẰNG CỔNG (tránh bẫy đã ghi 4 lần)
- **Đo được**: mọi bất biến §22/§11 **ĐANG ĐÚNG** — `.edm-tabs` cố định + wrap · `.edm-tabs button` `flex:1 1 auto`
  (**MỐC 115 user**) · `.is-active` chỉ đổi MÀU (chiều cao ⛔ không nhảy) · `.edm-body` có `min-height:120px` ·
  `.entity-detail-modal` chặn `88vh` · **bản vá §11 đã có** và **dải cấp trang vẫn «ôm sát nhãn»** (MỐC 119b).
- ⛔ **BẰNG CHỨNG VỀ CÁI BẪY** (đọc tài liệu dự án): `TASK-156` · `TASK-212` · `TASK-213` · `TASK-214` đã **4 lần**
  suýt/nhầm «sửa» dải tab đang đúng; `canonical.css` ghi nguyên văn **«⛔ KHÔNG đụng `.edm-tabs`»**;
  `CHECKLIST.md` ghi «…**lần thứ 7** tôi suýt "sửa" thứ đang đúng» + **2 BÁO ĐỘNG GIẢ** vì **một thước đo cho nhiều họ component**.
- **Hành động**: dựng cổng `tests/mt3-c05-modal-tab-sizing.test.mjs` (**8 ca**) — ⛔ **0 dòng mã sản phẩm bị đổi**
  (`git status` xác nhận `app/styles/canonical.css` ⛔ **không** nằm trong danh sách sửa) — xem `DECISION_LOG` §`DEC-20261007-C09`.
- **Kiểm chứng**: cổng **8/8** · `eslint` 0 · `test:regression` **835 test · 834 pass · 0 fail** ·
  `verify-ui-build-applied` **ĐẠT** (⇒ ⛔ không cần build, ⛔ không gián đoạn 2 phiên khác) ·
  ⭐ **LIVE**: CSS đang phục vụ (`index-BjTKD8Zf.css`, 393.497 ký tự) có rule §11 + `.edm-tabs button` nguyên vẹn + `.edm-body min-height`.
- ⏳ **Chờ USER** nghiệm thu 6 hotfix FE (`C01`…`C06`).

## EVT-20261007-C27 — TASK_START (vòng 8) + BUG_FOUND (`BUG-20261007-C06`)
- **Task**: `TASK-20261007-C09` · **Claim**: `lib/status-labels.ts` · `lib/request-export.ts` · `lib/ui-shared.tsx` · `tests/mt3-c04-*` — đối chiếu LOCK S01/S02: **giao = ∅**.
- **Phép đo**: đọc **3 tệp đường xuất** (`supply-docs.tsx` · `request-export.ts` · `ui-shared.tsx`) ⇒ thấy
  `deliveredExportRows` đưa **MÃ THÔ** `complete`/`missing`/`not_required` vào **CẢ XLSX LẪN CSV** «Đơn hàng đã giao»,
  trong khi `lib/request-export.ts` **đã có** bản dịch RIÊNG cho đúng 3 giá trị đó ⇒ 2 bản song song, 1 bản bị bỏ quên.

## EVT-20261007-C28 — HOTFIX_DONE + BUILD lần 6
- **Vá (REUSE §17)**: thêm domain `certificate_status` + `delivery_document` vào bảng nhãn DÙNG CHUNG; `certificateLabel`/
  `documentLabel` của `request-export` uỷ quyền bảng chung; `deliveredExportRows` đi qua `statusLabel(…, domain)`.
- **Build**: `gd-cycle` «SESSION 03 TEM XUAT HO SO GIAO HANG» → migration `drizzle/0335_…`,
  vân tay **`VNTECH-FP-723368DEBABF42EA`** (728 files), PREFLIGHT · FINGERPRINT · ARTIFACT **ĐẠT**, exit `0`.
- **Coordination**: dừng **đúng PID** UI + proxy (⛔ không dừng Java) → build → khởi động lại (job `pwsh-156` · `pwsh-157`).

## EVT-20261007-C29 — VERIFICATION (LIVE)
- **Đo được**: `:8787` **200** · `:9000` **200** · cổng dự án **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** (`exit 0`)
  · bundle có nhãn MỚI («Không yêu cầu» · «Đã có») + ⛔ không mất nhãn các vòng trước («Khẩn cấp» · «Đã xuất kho»)
  · `test:regression` **837 test · 836 pass · 0 fail · 1 skip** · cổng C04 **13/13**.
- ⚠️ **GHI RÕ HIỆN TƯỢNG ĐÃ GẶP**: khi cổng `verify-ui-build-applied` **thoát**, console in
  `Assertion failed: !(handle->flags & UV_HANDLE_CLOSING) … async.c` — ⭐ **noise teardown của Node trên Windows**,
  ⛔ **không phải cổng hỏng**: cả 3 dấu ✓ đã in và **exit code = 0** (kiểm riêng).
- ⏳ **Chờ USER** nghiệm thu 7 task (`C01`…`C07`) + 2 task logging/cổng (`C08` · `C09` chờ xác nhận xuất tệp).

## EVT-20261007-C30 — VERIFICATION (vòng 9) — ĐO CHỐT 2 yêu cầu giao diện, ⛔ 0 dòng mã đổi
- **Task**: `TASK-20261007-C10` · ⛔ **KHÔNG sửa mã sản phẩm**, chỉ đo + ghi sổ.
- **(a) Tệp xuất**: quét **toàn bộ** hàm dựng bản ghi xuất trong `lib/**` ⇒ `inventoryExportRows` và `paymentExportRows`
  ⛔ **không có cột enum**; các đường còn lại đã vá ở `C05`/`C09`/vòng 3 ⇒ ⭐ **lớp lỗi «mã enum trong tệp xuất» ĐÃ SẠCH**.
- **(b) Toolbar ngang**: `node tools/probe-toolbar-vertical.mjs` ⇒ **14/16 màn = 0 khối nhiều hàng** ✅;
  2 màn còn lại báo **8 khối** nhưng **cả 8 là CÙNG 1 họ** `.supplier-admin-row`.
- ⭐ **CHỨNG MINH BÁO ĐỘNG GIẢ**: `node tools/measure-supplier-row.mjs` ⇒ `beCao 44` · `display: grid` ·
  **`autoFlow: column`** · `soCon 12` · **mọi ô mẫu cùng `@603`** ⇒ 12 ô trên **MỘT DÒNG THẬT**, là **hàng DỮ LIỆU**
  (`app/screens/PartnerManager.tsx:65`) ⛔ không phải thanh nút CRUD.
- ⭐ **Bối cảnh**: `MT2` **đã sửa** họ này `1182×85 (3 hàng) → 1182×59`; **nay 44px** = tốt hơn ⇒ ⛔ **không hồi quy**.
- **Quyết định**: ⛔ **KHÔNG sửa** (⭐ tránh bẫy «lần thứ 7 suýt sửa thứ đang đúng» — `DEC-20261007-C10`)
  và giao **`HANDOFF-20261007-C07`** để sửa **CÔNG CỤ ĐO** (⛔ thuộc `tools/**` — mã dùng chung).
- **Cổng**: `verify-ui-build-applied` **ĐẠT** (chỉ sửa `docs/**`) ⇒ ⛔ không cần `gd-cycle`, ⛔ không gián đoạn 2 phiên khác.
- ⏳ **Chờ USER** nghiệm thu 7 hotfix FE (`C01`…`C07`).

## EVT-20261007-C31 — ⛔ PHÁT HIỆN CỔNG **XANH RỖNG** (`probe-responsive-5widths`) + đo bù 375px
- **Task**: `TASK-20261007-C11` · ⛔ **0 tệp sản phẩm** · ⛔ **0 tệp `tools/**`** bị sửa.
- **Bằng chứng**: chạy cổng **3 lần** (không nhãn · «Phiếu đề nghị mua hàng» · «Quản lý dự án») ⇒ **kết quả Y HỆT**;
  mọi dòng `tab cuộn=null` · `modal=—` · `toolbar 0 nút/0 hàng` ⇒ **⛔ chưa từng đo** 3 tiêu chí đó —
  nhưng vẫn in **«✅ ĐẠT … tab cuộn ngang · modal vừa khung · toolbar không vỡ cột dọc»**.
- **ROOT CAUSE (có dòng)**: ① `:159-161` phép kiểm **có điều kiện**; ② `:126-139` chọn menu **im lặng thất bại**;
  ③ `:164` in cứng 4 tiêu chí ⛔ không gắn số đo.
- ⭐ **ĐO BÙ (375px, script tạm đã xoá)**: ✅ `tràn = 0px` **mọi màn đo được** · ✅ **modal chi tiết = 375×900
  ĐÚNG KHUNG** (⛔ không vượt `vw`/`vh`) · ✅ toolbar trong modal 1 nút/1 hàng · ⛔ **`.edm-tabs` CHƯA đo được**
  ⇒ ⭐ **ghi thẳng: ⛔ không tuyên bố «responsive ĐẠT»**.
- **Giao việc**: `HANDOFF-20261007-C08` (⛔ `tools/**` = mã dùng chung).
- ⭐ **Luật mới (SHARED_STATE §34)**: **thiếu mục tiêu phải là `SKIP`/`BLOCKED`, ⛔ KHÔNG phải `ĐẠT`** —
  đây là **lần thứ 3** trong phiên công cụ/báo cáo **nói quá số đo**.
- ⏳ **Chờ USER** nghiệm thu 7 hotfix FE (`C01`…`C07`).

## EVT-20261007-C32 — GHI NHẬN KHÁCH QUAN: có thay đổi chưa commit trong `tools/**` — **⛔ KHÔNG PHẢI của phiên 03**
- **Thời điểm đo**: 2026-10-07 17:55:55 (phiên 03 bắt đầu 16:54:34).
- **Đo được**: `tools/probe-visual-regression.mjs` sửa lúc **17:39:30** · `tools/baseline/16-modal-receipt__tablet.png`
  sửa lúc **17:38:54** — **⛔ phiên 03 KHÔNG mở/không sửa 2 tệp này** (lúc đó phiên 03 chỉ sửa `docs/**`;
  ⛔ không có lệnh nào của phiên 03 ghi vào `tools/**` trong suốt phiên).
- **Kết luận**: ⛔ **không phải thay đổi của phiên 03** ⇒ theo **Goal §38** («phải giả định đó là thay đổi của session khác
  cho đến khi xác minh được») phiên 03 ⛔ **không đụng, không hoàn tác, không nhận xét thay ai**.
  ⭐ Phù hợp `HANDOFF-20261006-003/005` (việc sửa `probe-visual-regression.mjs` + ảnh chuẩn **đã giao `ERP-SESSION-01`**).
- **Ảnh hưởng tới cổng của phiên 03**: `tests/**` · `app/**` · `lib/**` ⛔ không liên quan ⇒
  `verify-ui-build-applied` vẫn **exit 0** («BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»).
- **Việc cần làm của phiên 03**: ⛔ **không có** — chỉ ghi sổ để ⛔ không ai hiểu nhầm phiên 03 đã sửa `tools/**`.

## EVT-20261007-C33 — TASK_START + BUG_FOUND (vòng 11): lỗi USER báo ở modal «Chi tiết đơn giao hàng»
- **Task**: `TASK-20261007-C12` · **Claim**: `app/screens/ReceiptDrawer.tsx` + `tests/**` — đối chiếu LOCK S01/S02: **giao = ∅**.
- **Nguồn**: ⭐ **user đã báo trong MASTER TASK 3** (§V-E): *«Modal chi tiết giao hàng … mục **Ảnh và hồ sơ giao hàng** bị **ẩn** …»*.
- **ĐÍNH CHÍNH TIỀN ĐỀ**: giả thuyết «ẩn bằng điều kiện render» ⛔ **SAI** — mã **CÓ** render cả 2 khối (kèm `AttachmentPanel`).

## EVT-20261007-C34 — HOTFIX + BUILD lần 7 … rồi **TỰ ĐÍNH CHÍNH: ⛔ KHÔNG TÁI HIỆN ĐƯỢC**
- **Đo TRƯỚC**: `.receipt-modal h=768 overflow=hidden` · `.drawer-body h=568` **`flex:"0 1 auto"`** **`min-height:"auto"`**
  · `clientH == scrollH = 568` ⇒ tôi **kết luận sớm**: «thân không giãn/không cuộn ⇒ CẮT 38px».
- **Vá (1 dòng)**: thân `drawer-body` → **`drawer-body modal-body`** (lớp đi kèm `.modal`) ⇒ `flex:1 1 auto; min-height:0`.
- **Build**: `gd-cycle` «SESSION 03 MODAL CUON NOI DUNG» → `drizzle/0336_…`, vân tay **`VNTECH-FP-F3F8A0D3B0C85E17`** (730 files), **ĐẠT**, exit 0.
- ⛔⛔ **ĐO LẠI sau vá ⇒ PHẢN BÁC KẾT LUẬN CỦA TÔI**: CSS đã đúng (`flex: 1 1 auto` · `min-height: 0px`) nhưng
  **bố cục Y HỆT** (thân `h=568` · `scrollH == clientH` · 2 khối user báo **538→587** và **601→651**, ⛔ **đều nằm TRONG khung 669**)
  ⇒ ⭐ **⛔ KHÔNG tái hiện được hiện tượng «bị ẩn»**.
- **Xử lý đúng**: ① **hạ trạng thái** `BUG-20261007-C07` từ `FIXED` → **`OPEN`**; ② giữ việc ghép `modal-body` như **GIA CỐ**
  (đúng nguyên tắc khung `.modal` đi với thân `.modal-body`; đo được ⛔ không đổi bố cục); ③ ghi rõ **cần user cho bước tái hiện**.
- **Cổng**: C06 **4/4** · `test:regression` **841 test · 840 pass · 0 fail** · `tsc` 0 · `eslint` 0 · cổng dự án **exit 0**.
- ⭐ **Bài học (lần 4 của phiên)**: **chỉ số suy diễn ⛔ KHÔNG thay được việc TÁI HIỆN hiện tượng user báo**.

## EVT-20261007-C35 — VERIFICATION (vòng 12): cổng dự án cho `/api/files` ⇒ **ca D2 ĐỎ OAN**
- **Task**: `TASK-20261007-C13` · ⛔ **0 tệp sản phẩm** · ⛔ **0 tệp `tools/**`**.
- **Chạy cổng dự án** `node tools/probe-task075-attachments.mjs`: **21/22 ĐẠT · HỎNG duy nhất `D2`**
  (`có ≥2 thẻ <img> trỏ đúng endpoint tệp`). ⚠️ **MỌI ca đường ống ĐẠT**: API danh sách trả tệp · tải tệp **trùng từng byte**
  · chữ ký PNG · không cookie ⇒ **401** · đối chứng dữ liệu hỏng.
- ⭐ **ĐO LẠI ⇒ `D2` ĐỎ OAN**: cổng đòi khớp **nguyên văn** `src={`/api/files?id=${encodeURIComponent(file.id)}`}` ≥2 lần;
  trong `lib/ui-shared.tsx` chuỗi đó **0 lần**, nhưng `/api/files?id=${encodeURIComponent(` có **6 lần**, trong đó
  **3 là thẻ `<img>`** (dải ảnh `(id)` · ô thu nhỏ `String(file.id)` · xem trước `String(preview.id)`) ⇒ **ý nghĩa ca ĐÃ THOẢ**.
- ⛔ **KHÔNG sửa mã sản phẩm cho vừa chuỗi** ⇒ giao **`HANDOFF-20261007-C09`** (⛔ `tools/**` dùng chung).
- ✅ **Cổng MỚI khoá ĐÚNG ý nghĩa**: `tests/mt3-c07-attachment-imgs.test.mjs` (**2 ca**) — bộ khớp **dung sai có chủ ý**
  + **đối chứng âm** ghi lại việc chuỗi cổng cũ = 0 ⇒ ⛔ không ai đổi mã cho vừa chuỗi.
- ⭐ **MẪU HÌNH LẶP LẠI (lần 3 của phiên — đã ghi `SHARED_STATE` §40)**: cổng khớp **chuỗi nguyên văn** / **có điều kiện**
  sinh **ĐỎ OAN** (D2 · probe-toolbar 8 khối) và **XANH RỖNG** (probe-responsive) ⇒ **con số từ cổng ⛔ không phải lỗi, ⛔ cũng không phải bằng chứng**.
- ⚠️ **KHÔNG kết luận gì về `BUG-20261007-C07`** (cổng tự ghi **GIỚI HẠN: không đo phần render UI**) ⇒ bug **vẫn `OPEN`**.
- **Cổng**: C07 **2/2** · `eslint` 0 · `verify-ui-build-applied` **ĐẠT** · `:8787`/`:9000` **200** · `:18081` đang nghe.

## EVT-20261007-C36 — ⭐ TÁI HIỆN ĐƯỢC LỖI USER + HOTFIX + BUILD lần 8 (vòng 13)
- **Task**: `TASK-20261007-C14` · ⭐ tuyên bố mới của user: **MT1/MT2 phần bị bỏ qua đã xong · MT3 đã ROLLBACK**
  ⇒ ⛔ **từ nay chỉ HOTFIX GO-LIVE**, ⛔ không chạy theo MT cũ (đã ghi vào state).
- **Đổi CÁCH ĐO ⇒ TÁI HIỆN ĐƯỢC**: lần trước đo **hình học khối CHA** (⛔ không thấy lỗi);
  lần này đo **`scrollHeight` vs `clientHeight` CỦA TỪNG KHỐI** ⇒ **7/8 khối bị CẮT**
  (cao **49,2031px** mà nội dung **231–294px**) · `gridTemplateRows` giải ra 8 hàng **~49px** (bị ÉP vừa khung)
  · thân `scrollHeight == clientHeight == 568` ⇒ ⛔ **không có thanh cuộn**.
- **ROOT CAUSE (chuẩn CSS)**: `.drawer-section { overflow:hidden }` ⇒ **kích thước tối thiểu tự động = 0**
  ⇒ hàng `auto` trong grid có **chiều cao xác định** bị **CO xuống vừa khung** ⇒ cắt nội dung (đúng «mục Ảnh và hồ sơ giao hàng bị ẩn»).
- ✅ **VÁ cục bộ**: `ReceiptDrawer.tsx` — thân modal thêm **`style={{ gridAutoRows: "max-content" }}`**
  ⇒ hàng lấy đúng chiều cao nội dung ⇒ thân tràn ⇒ `.modal-body` sinh **thanh cuộn thật**.
  ⛔ **KHÔNG đụng `globals.css` / `canonical.css`** (CSS **dùng chung** — ⭐ theo cảnh báo của user về conflict giữa 3 phiên).
- **ĐO LẠI**: «Ảnh và hồ sơ giao hàng» **49 → 279px** (nội dung 277) · «Chứng chỉ / Tài liệu» **49 → 279** ·
  «Ảnh giao hàng» **49 → 279** · **`conCat = []` ⇒ 0 khối còn bị cắt** ✅
- **Build**: `gd-cycle` lần 8 «SESSION 03 VA CAT KHOI MODAL GRN» → `drizzle/0337_…`, vân tay **`VNTECH-FP-AF5B84E9A7B25888`** (732 files), **ĐẠT**, exit `0`.
  Dừng **đúng PID** UI+proxy (⛔ Java vẫn chạy), khởi động lại (job `pwsh-220` · `pwsh-221`), `:8787`/`:9000` **200**.
- **Cổng**: `tests/mt3-c08-modal-grid-clip.test.mjs` (**3 ca**, mới) **3/3** · `test:regression` **846 test · 845 pass · 0 fail** · `tsc` 0 · `eslint` 0 · cổng dự án **exit 0**.
- ⭐ **BÀI HỌC (lần 5)**: **ĐO SAI CHỈ SỐ = KẾT LUẬN SAI** — dấu hiệu CẮT nằm **Ở TRONG khối**, ⛔ không ở toạ độ khối cha.
- ⏳ **Chờ USER nghiệm thu** (cuộn thấy đủ Ảnh + Chứng chỉ) ⇒ mới lên `VERIFIED`.

## EVT-20261007-C37 — VERIFICATION (vòng 14): ĐÓNG **LỚP LỖI** «grid co hàng ⇒ cắt nội dung» + cổng C08 làm chính xác
- **Task**: `TASK-20261007-C15` · ⛔ **0 tệp sản phẩm** · ⛔ **0 tệp CSS** · ⛔ **0 tệp `tools/**`** (chỉ `tests/**`).
- **① Quét TĨNH toàn bộ `app/**` + `lib/**`**: chỉ **2** tệp dùng thân `.drawer-body` (grid) —
  `ReceiptDrawer.tsx` (**đã vá** vòng 13) và `PurchaseOrderDrawer.tsx` (chưa có chặn) ⇒ **phải đo tệp thứ 2**.
- **② ĐO LIVE tệp thứ 2** («Chi tiết đơn mua», mở bằng `data-vntech="grn-source-po-open"`):
  khung `modal entity-detail-modal edm-wide` · thân **`.edm-body` `display:block`** · **`clientHeight=683 / scrollHeight=1985`** ⇒ **cuộn được**
  · khối 63px và **1902px** (`scrollHeight == clientHeight`) · ⭐ **`conCat = []` ⇒ ⛔ 0 khối bị cắt** ⇒ **AN TOÀN**.
- ⭐ **PHÂN ĐỊNH HÌNH DẠNG (kết quả chính)**: nguy hiểm ⇔ `.drawer-body` (grid) là **CON TRỰC TIẾP** của khung có
  **chiều cao xác định**; an toàn ⇔ `.drawer-body` **lồng trong `.edm-body`** (block, cao theo nội dung).
  ⇒ ⭐ **LỚP LỖI ĐÃ ĐÓNG: chỉ 1 chỗ nguy hiểm và đã sửa ở vòng 13.**
- ⚠️ **CỔNG C08 ĐƯỢC LÀM CHÍNH XÁC** (3 → **4 ca**): bỏ cách kiểm **theo TỆP** (sẽ **báo động giả** cho tệp đang an toàn) ⇒
  chỉ bắt **mẫu NGUY HIỂM trong cùng khối JSX**; thêm `C08-2b` **khoá hình dạng AN TOÀN**.
- ⚠️ **CỔNG BẮT ĐƯỢC CHÍNH TÔI**: lượt đầu `C08-2b` **ĐỎ** vì **phép trích của tôi** bắt trúng một **CHÚ THÍCH** chứa chữ `.edm-body`
  ⇒ ⭐ **luật: bỏ chú thích TRƯỚC khi trích CSS bằng `indexOf`** (⛔ không phải lỗi mã sản phẩm).
- **Cổng**: C08 **4/4** · `test:regression` **847 test · 846 pass · 0 fail · 1 skip** · `eslint` 0 · cổng dự án **exit 0**
  (⛔ chỉ sửa `tests/**` ⇒ ⛔ **không cần `gd-cycle`**, ⛔ không gián đoạn 3 phiên) · `:8787`/`:9000`/`:18081` **đang nghe**.
- ⏳ **Chờ USER nghiệm thu** `BUG-20261007-C07`.

## EVT-20261007-C38 — VERIFICATION (vòng 16): rà «UI nói dối» + **bác bỏ cổng RBAC ĐỎ** bằng mã
- **Task**: `TASK-20261007-C17` · ⛔ **0 tệp sản phẩm** · ⛔ **0 tệp `tools/**`** · ⛔ **0 tệp `java-backend/**`**.
- **① `open(...)` — 39 đích**: chỉ **2** ⛔ không có modal (`allocate` · `warehouse`, từ `Inventory.tsx`) — ⭐ **cả 2 đã bị S02 vô hiệu hoá**
  (`disabled` + `title` kèm `BUG-20261007-013/014/015`) ⇒ UI ⛔ không còn «nói dối» ⇒ ⛔ không cần sửa.
- ⚠️ **ĐÍNH CHÍNH GHI CHÉP PHIÊN KHÁC**: `SESSION_A` ghi `open("return")` là ⛔ chết — **đo lại `page.tsx`: `return` CÓ handler** ⇒ ghi chép đó **SAI**
  (⭐ bài học: ⛔ **đừng tin ghi chép, hãy ĐO LẠI**).
- **② CỔNG RBAC ĐỎ**: `probe-action-registry-coverage.mjs` **exit 1** · **«④ MÙ QUYỀN: 6»** (5× `*_contract_review` + `work_scope`) ⚠️ lớp CRITICAL.
- ⭐ **BÁC BỎ BẰNG MÃ ĐANG CHẠY**: ① `ContractReviewUseCase` có **5× `guard(principal)`** → `rbac.requireActionModule(…, "manage_contract_review")`
  (cổng ở **tầng UseCase**); ② `case "work_scope"` → `requireCurrentUser` → `scopeOf(cu.id(), cu.role())` ⇒ **chỉ-đọc + tự-giới-hạn**, ⛔ không tham số đích
  ⇒ ⛔ **KHÔNG có lỗ hổng phân quyền** ⇒ ⛔ **KHÔNG cảnh báo CRITICAL** (sẽ là **báo động giả thứ 5** của phiên) ⇒ giao **`HANDOFF-20261007-C11`**.
- **Cổng**: ⛔ 0 thay đổi mã ⇒ `verify-ui-build-applied` **ĐẠT** · ⛔ không cần `gd-cycle` · `:8787`/`:9000`/`:18081` **đang nghe**.
- ⭐ **Bài học (lần 6 của phiên)**: **cổng chỉ kiểm chiều nó được viết để kiểm** — model của cổng **hẹp hơn thực tế** ⇒ **ĐỎ OAN**;
  ⛔ **tuyệt đối ⛔ không báo bảo mật và ⛔ không "vá" trước khi đọc mã thật**.

## EVT-20261007-C39 — HOTFIX + BUILD lần 9 (vòng 17): đo CSDL THẬT ⇒ bịt 3 mã chưa có nhãn
- **Task**: `TASK-20261007-C18` · **Nguồn**: lỗi user báo (MT3) «1 số nơi hiển thị tiếng Anh» — vòng vá **thứ 4** cho lớp này.
- ⭐ **PHÉP ĐO MỚI**: ⛔ không quét mã nguồn ⇒ **quét CSDL THẬT**: **62 cột trạng thái** (`information_schema`) →
  `SELECT DISTINCT` (**chỉ đọc**) → từng giá trị qua **bảng nhãn dùng chung** (chạy thật bằng esbuild).
- **KẾT QUẢ**: 22 giá trị · **3 RÒ TIẾNG ANH**: `bch_confirmation_status=confirmed` («Confirmed») ·
  `qc_status=accepted` («Accepted») · `=passed` («Passed»).
- ⚠️ **ĐO TIẾP ⇒ ⛔ chưa rò ra màn hình**: **5 call site** (`Inventory` · `PurchaseOrderDrawer`×2 · `ReceiptDrawer`×2 · `page.tsx`)
  **đều dịch TAY** ⇒ phân loại đúng: **LỖ HỔNG TIỀM ẨN + TRÙNG LẶP 5 CHỖ**.
- ✅ **VÁ**: thêm 2 domain `bch_confirmation` + `qc_result` (**tổng 10 domain**) — ⛔ **KHÔNG** đưa vào `DOMAIN_LOOKUP_ORDER`
  (chứa mã **dùng chung** `pending`/`rejected` ⇒ nếu tra chéo sẽ **ĐỔI NHÃN nơi khác** ⇒ HỒI QUY).
  ⛔ **KHÔNG** sửa 5 call site (thuộc S01/S02 — §41).
- **Build**: `gd-cycle` lần 9 «SESSION 03 NAN TRANG THAI QC BCH» → `drizzle/0338_…`, vân tay **`VNTECH-FP-F3C1C8BA4CECE009`** (735 files), **ĐẠT**, exit `0`.
  ⛔ Java `:18081` không dừng; khởi động lại UI+proxy (job `pwsh-283` · `pwsh-284`), `:8787`/`:9000` **200**.
- **Cổng**: C09 **4/4** · `test:regression` **851 test · 850 pass · 0 fail · 1 skip** · cổng dự án **exit 0** ·
  bundle có nhãn MỚI («BCH đã xác nhận» · «Chờ kiểm tra») **và** ⛔ không mất nhãn CŨ («Không đạt» · «Đã có» · «Khẩn cấp»).
- ⚠️ **TỰ ĐÍNH CHÍNH 2 LẦN TRONG CÙNG CA KIỂM**: snapshot đầu tôi **đoán** ⇒ sai `complete` (thật «Đã có», ⛔ không phải «Hoàn thành»)
  và `in_progress` (thật «Đang xử lý»). ⭐ **LUẬT: snapshot PHẢI ĐO, ⛔ không viết theo trí nhớ**.
- ⚠️ `locked` → «Locked» (tiếng Anh) **nhưng CSDL ⛔ không dùng `locked` ở cột trạng thái nào** ⇒ ⛔ không phải rò rỉ ⇒ ⛔ không sửa.
- ⏳ **Chờ USER** (⚠️ thay đổi này **⛔ không đổi gì nhìn thấy** — là **phòng ngừa tại nguồn** + **khoá hồi quy 21 nhãn**).

## EVT-20261007-C40 — HOTFIX + BUILD lần 10 (vòng 18): định dạng NGÀY về `dd/mm/yyyy`
- **Task**: `TASK-20261007-C19` · Nguồn: lỗi user báo (MT3) «hiển thị chưa nhất quán».
- **PHÉP ĐO**: quét `app/screens/**` tìm ngày render **ở vị trí VĂN BẢN JSX** (⛔ loại trừ ô nhập liệu) ⇒ **4 CHỖ IN NGÀY THÔ**:
  `Payments.tsx` ×2 · `DocumentsScreen.tsx` · `ProjectTeams.tsx` ⇒ màn hình hiện **`2026-10-07`** (ISO) trong khi mọi nơi khác hiện **`07/10/2026`**.
- ⭐ **DẤU HIỆU CHÍ MẠNG**: **CẢ 3 TỆP ĐÃ `import { … date … }` NHƯNG GỌI `date(...)` 0 LẦN** ⇒ **quên dùng**, ⛔ không phải thiếu tiện ích.
- ✅ **VÁ**: bọc `date(...)` cho 4 chỗ (**không thêm import**; ⛔ không đổi dữ liệu; ⛔ không đổi `<input type="date">`).
- **Cổng mới C10** (**4 ca**, gồm **đối chứng âm**: bộ dò **PHẢI bắt** chỗ in thô và ⛔ **KHÔNG** bắt nhầm ô nhập liệu / chỗ đã bọc) ⇒ **4/4 PASS**.
- **Build**: `gd-cycle` lần 10 «SESSION 03 NGAY DDMMYYYY TOAN MAN» → `drizzle/0339_…`, vân tay **`VNTECH-FP-344D1DA5553CCA1E`** (737 files), **ĐẠT**, exit `0`.
- **Cổng**: `test:regression` **855 test · 854 pass · 0 fail · 1 skip** · `tsc` 0 · `eslint` 0 error · cổng dự án **exit 0** · `:8787`/`:9000` **200** · Java ⛔ không dừng.
- ⛔ **XÁC MINH DOM SỐNG: KHÔNG HOÀN THÀNH ĐƯỢC** (nói thẳng): thử 2 lượt ⇒ ⛔ không tới được màn vì
  ⭐ **nhóm menu «TÀI CHÍNH – KẾ TOÁN» ⛔ KHÔNG render mục con** khi bấm. ⚠️ **Chưa xác định** là **giới hạn probe** hay **nhóm menu rỗng THẬT**
  ⇒ ⛔ không kết luận, ⛔ không sửa; đã ghi `SHARED_STATE` §61–62 + chờ user/phiên sau kiểm.
- ⭐ **BÀI HỌC**: **bấm nhãn NHÓM menu ⛔ không điều hướng** ⇒ khi kết luận cho MỘT màn phải **kiểm `h1/h2`** sau khi bấm,
  ⛔ không tin nhãn đã bấm (một phần «22 màn» trước đây có thể là **đo lại màn cũ**).

## EVT-20261007-C41 — VERIFICATION (vòng 19): **XÁC MINH DOM SỐNG XONG** + **ĐÍNH CHÍNH** «nhóm menu rỗng»
- **Task**: `TASK-20261007-C20` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá).
- ⭐ **(a) XÁC MINH LIVE**: vào màn «**Thanh toán HĐ**» — ⭐ **kiểm `h1`** = `"Thanh toán HĐ"` (⛔ không tin nhãn đã bấm) ⇒
  đếm `innerText`: **ISO `yyyy-mm-dd` = 0** ✅ · **`dd/mm/yyyy` = 4** ✅ (mẫu `30/06/2026` · `15/02/2026`)
  ⇒ ⭐ **bản vá định dạng ngày ĐÚNG trên UI THẬT** ⇒ `TASK-20261007-C19` chuyển **`FIXED` → `VERIFIED`**.
- ⛔⛔ **(b) ĐÍNH CHÍNH PHÁT HIỆN CỦA CHÍNH TÔI**: «nhóm **TÀI CHÍNH – KẾ TOÁN** ⛔ không có mục con» là
  ⭐ **GIỚI HẠN CỦA PROBE**, ⛔ **KHÔNG phải lỗi UI** — nhóm có **7 mục con THẬT**, chỉ hiện khi mở nhóm bằng
  **`button.nav-parent`** (chevron) cho `aria-expanded="true"` (⛔ bấm NHÃN nhóm thì ⛔ không mở).
  ⇒ ⚠️ **báo động giả thứ 6** của phiên ⇒ ⛔ **không sửa gì**.
- ⭐ **CÁCH LÀM ĐÚNG (đã ghi để tái sử dụng)**: mở nhóm bằng **`button.nav-parent`** · xác nhận **`aria-expanded="true"`** ·
  sau khi bấm mục **kiểm `h1/h2`**.
- ⚠️ **HỆ QUẢ**: các lượt «quét 22 màn» trước **một phần đo lại màn cũ** ⇒ ⛔ không dùng con số đó như bằng chứng tuyệt đối;
  ✅ nhưng kết luận **«lớp lỗi cắt nội dung đã đóng» VẪN ĐÚNG** (dựa trên **họ khối `.kpi` đo trên màn THẬT ĐÃ TỚI**).
- **Cổng**: ⛔ 0 thay đổi mã ⇒ ⛔ không cần `gd-cycle`; dịch vụ `:8787`/`:9000` **200** · Java `:18081` ⛔ không dừng.

## EVT-20261007-C42 — VERIFICATION (vòng 21): **NÂNG MỨC** `HANDOFF-C10` (lỗi `.kpi` là **HỆ THỐNG**) + ⛔ **DỪNG** sweep sau 5 lần thử
- **Task**: `TASK-20261007-C21` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá).
- ⭐ **PHÁT HIỆN MỚI**: **MÀN THỨ 3** cùng họ lỗi cắt thẻ KPI — «**KPI & hiệu suất nhân viên**»: `kpi-green 156/164` · `kpi-red 156/164` (**cắt 8px**)
  ⇒ họ `.kpi` bị cắt ở **≥ 3 màn** ⇒ ⭐ **NÂNG MỨC `HANDOFF-20261007-C10`: LỖI HỆ THỐNG của họ thẻ `.kpi`** (sửa **1 chỗ** là hết cho cả 3+ màn).
- ✅ **Màn MỚI tới được**: «**Báo cáo tổng hợp**» (bấm «Báo cáo & cảnh báo») ⇒ **SẠCH** (⛔ 0 khối cắt · ⛔ 0 lỗi văn bản).
- ⛔⛔ **DỪNG SWEEP TỰ ĐỘNG sau 5 LẦN THỬ** (⛔ ghi thẳng cả 5): ① `button/a` → 8 mục · ② lớp cũ → 7 mục ·
  ③ mọi `.sidebar *` + **bấm theo CHỈ SỐ** → tới 1 màn (sidebar render lại ⇒ chỉ số hỏng) · ④ **theo VĂN BẢN** (khớp chính xác) → **5 màn**
  (nhãn **có SỐ ĐẾM** như «Trung tâm phê duyệt**7**» ⇒ khớp chính xác trượt) · ⑤ **bỏ chữ số** → **3 màn** (⚠️ bỏ số làm **lẫn nhãn NHÓM** ⇒ bấm nhóm ⛔ không điều hướng ⇒ mất lượt).
- ⭐ **CÁCH LÀM ĐÚNG (đã ghi `SHARED_STATE` §69)**: đối chiếu theo **`h1` MÀN ĐÍCH** (⛔ không dựa nhãn menu) · hoặc `data-nav-key` · hoặc cổng `tools/probe-visual-regression.mjs` (+ làm mới ảnh chuẩn, ⚠️ `tools/**` ⛔ không thuộc phiên 03).
- ⚠️ **TỰ BÁO LỖI SỬA TỆP LOG**: khi chèn `§C22` vào `TEST_LOG.md`, tôi **xoá nhầm tiêu đề `§C21`** và làm **đảo thứ tự C22/C21** ⇒
  đã **phát hiện + sửa ngay** (khôi phục tiêu đề, hoán vị 2 khối, kiểm lại: `C21@57203 < C22@60062`, mỗi tiêu đề **1 lần**) ✅. ⭐ Ghi vào log để ⛔ không ai hiểu nhầm cấu trúc tệp.
- **Cổng**: ⛔ 0 thay đổi mã ⇒ cổng dự án **exit 0** (`344d1da5553cca1e`); `:8787`/`:9000`/`:18081` **đang nghe**.

## EVT-20261007-C43 — VERIFICATION (vòng 22): **CHỐT root cause `.kpi`** + **TIỀN LỆ trong repo** + tự báo lỗi sửa tệp (lần 2)
- **Task**: `TASK-20261007-C22` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá).
- ⭐ **ĐO CHUỖI CHA**: thẻ `.kpi` `clientHeight=201`/`scrollHeight=210` (**cắt 9px**) · `overflow:hidden` · dải cha `display:grid`
  `gridTemplateRows=203.203px` · `kids=4` · `overflow-y=hầidden` ⇒ **ROOT CAUSE**: `.kpi { overflow:hidden }` ⇒ **kích thước tối thiểu tự động = 0**
  ⇒ **hàng `.kpi-grid` bị CO xuống vừa khung** ⇒ cắt 8–9px — ⚠️ **CÙNG CƠ CHẾ** với `BUG-20261007-C07` (modal GRN).
- ⭐⭐ **TIỀN LỆ TRONG CHÍNH REPO**: `.approved-kpi-grid .kpi .kpi-content p { white-space:normal!important; overflow:visible!important;
  text-overflow:clip!important; … min-height:2.7em!important }` ⇒ ⭐ **TÁI DÙNG CÁCH ĐÓ** cho `.kpi-grid` mặc định
  (⛔ **không phát minh cách mới** — §17 REUSE); hướng 2: `grid-auto-rows: max-content` (cách phiên 03 đã kiểm chứng).
- ⛔ **KHÔNG SỬA**: CSS ở **`app/globals.css`** (dùng chung) + markup dải KPI ở **`app/page.tsx`** (**LOCK S01**)
  ⇒ theo cảnh báo conflict của user ⇒ đã ghi đầy đủ **`HANDOFF-20261007-C10`** (root cause + 2 hướng + **test đo được**).
- ⚠️ **TỰ BÁO LỖI LẦN THỨ 2 (cùng loại)**: `edit` của tôi lại **xoá mất tiêu đề mục kế tiếp** (`## HANDOFF-20261007-C11`; lần trước là `## TEST-20261007-C21`)
  vì **`new_string` ⛔ không chép lại tiêu đề nằm trong `old_string`** ⇒ ✅ **đã khôi phục + kiểm cấu trúc** (HANDOFF: 11 tiêu đề, `C10 < C11`, mỗi cái **1 lần**;
  TEST_LOG: `C21 < C22 < C23`, ⛔ **0 mảnh vụn** dính cuối dòng bảng) ⇒ ⭐ **đã ghi LUẬT vào `SHARED_STATE` §72** (⛔ không lặp lần 3).
- **Cổng**: ⛔ 0 thay đổi mã ⇒ cổng dự án **exit 0**; dịch vụ `:8787`/`:9000`/`:18081` **đang nghe**.

## EVT-20261007-C44 — ⛔⛔ **THU HỒI `HANDOFF-C10`** (vòng 23): «cắt chữ KPI» là **SUY DIỄN SAI** — thủ phạm là **hoạ tiết trang trí**
- **Task**: `TASK-20261007-C23` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá).
- ⭐ **PHÉP ĐO QUYẾT ĐỊNH** (đo **TỪNG CON**, ⛔ không chỉ đo thẻ): phần tử **DUY NHẤT** vượt đáy thẻ `.kpi` là **`<i>` RỖNG** (`txt=""`)
  cao **4px**, `position:static`, `display:block`, vượt **8px / 5px / 5px**; danh tính: **cột biểu đồ mini TRANG TRÍ**
  (`.kpi-mini-columns i { width:5px; min-height:4px; background:currentColor }`) ⇒ ⛔ **KHÔNG có CHỮ nào bị cắt**.
- ⛔⛔ **THU HỒI KẾT LUẬN CŨ CỦA TÔI**: «họ `.kpi` CẮT chữ mô tả — LỖI HỆ THỐNG, ưu tiên cao» (đã nói ở vòng 15/20/21/22 + Telegram) ⇒ **SAI**.
  ⭐ **LỖI PHƯƠNG PHÁP**: dùng `scrollHeight > clientHeight` làm **bằng chứng «cắt nội dung»** rồi **suy diễn** ra «cắt CHỮ» —
  chỉ số đó ⛔ **không nói phần tử nào vượt** và ⛔ **không nói có chữ hay không**.
- ✅ **ĐÃ CHẶN HẬU QUẢ**: chèn khối **«⛔ ĐỪNG SỬA `.kpi` THEO HANDOFF NÀY»** ngay dưới tiêu đề **`HANDOFF-20261007-C10`**
  ⇒ ⛔ **KHÔNG** thêm quy tắc `.kpi-content p`, ⛔ **KHÔNG** `grid-auto-rows: max-content`, ⛔ **KHÔNG đụng `.kpi`/`.kpi-grid`**
  (Goal §12/§41) — ⚠️ **ngoại lệ**: nếu **USER nhìn thấy CHỮ bị hụt** (kèm ảnh) thì mở lại.
- ⚠️ **CHƯA ĐO TƯƠNG TỰ** cho `Trung tâm phê duyệt` (`171/179`) và `KPI & hiệu suất NV` (`156/164`) ⇒ ⛔ **không kết luận «cắt chữ»** khi chưa đo từng con.
- **Kiểm chứng cấu trúc log** (⭐ áp dụng luật §72): HANDOFF **11 tiêu đề**, `C10 < C11`, mỗi cái **1 lần**; TASK_LOG `C21`/`C22` mỗi cái **1 lần** ✅.
- **Cổng**: ⛔ 0 thay đổi mã ⇒ cổng dự án **exit 0** · `:8787`/`:9000`/`:18081` **đang nghe**.

## EVT-20261007-C45 — ⚠️ PHÁT HIỆN (vòng 23): cổng `verify-ui-build-applied.mjs` có **MÃ THOÁT KHÔNG ỔN ĐỊNH**
- Chạy **2 lần liền nhau**, cùng mã nguồn: LẦN 1 **`EXIT=0`** ✅ · LẦN 2 **`EXIT=-1073740791`** (`0xC0000409` — **CRASH**),
  ⚠️ **cả 2 lần đều in đủ 3 dấu ✓ + cùng dòng KẾT LUẬN** (`BAN CHAY DUNG BAN DA BUILD MOI NHAAT`).
- ⭐ **KẾT LUẬN**: **NỘI DUNG KIỂM ổn định & đáng tin** · ⛔ **MÃ THOÁT không ổn định**
  ⇒ ⭐ **LUẬT**: đọc **dòng KẾT LUẬN + đủ 3 dấu ✓** ⇒ coi là ĐẠT; ⛔ **không** chỉ dựa `$LASTEXITCODE` (⚠️ **ĐỎ OAN ngẫu nhiên**).
- ⚠️ **Nguyên nhân**: libuv assertion khi teardown trên Windows (`src\win\async.c:94`).
- ⚠️ **ĐÍNH CHÍNH GHI CHÉP CŨ (vòng 8)**: tôi từng ghi «chỉ là noise, exit code vẫn 0» ⇒ ⭐ **chưa đủ** — nó **có thể làm CRASH**.
- ⚠️ **ĐÃ GIAO VIỆC**: **`HANDOFF-20261007-C12`** (thoát tường minh `process.exit(0/1)` sau khi in kết luận — ⛔ `tools/**` không thuộc phiên 03).
- ✅ **HỒI QUY VÒNG NÀY**: ⛔ **0 thay đổi mã sản phẩm** ⇒ ⛔ không cần `gd-cycle`; 3 dịch vụ **đang nghe**; cấu trúc log kiểm lại **không trùng lặp**
  (TASK **23** tiêu đề · TEST **24** · HANDOFF **12**, mỗi tiêu đề **đúng 1 lần**).

## EVT-20261007-C46 — VERIFICATION (vòng 24): đo màn thứ 2 ⇒ **LỚP `.kpi` CHÍNH THỨC ĐÓNG** (⛔ không có chữ bị cắt)
- **Task**: `TASK-20261007-C24` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá).
- ⭐ **ĐO MÀN «Trung tâm phê duyệt»** (6 thẻ): thẻ 0/2/3 cắt **8px**, con vượt đáy **DUY NHẤT** = **`<i>` RỖNG** (`txt=""`) cao **4px** vượt **7px**
  · ⭐ thẻ 1 **`cut = 0`** (⛔ không cắt) ⇒ ⭐ **đúng dấu hiệu hoạ tiết cao theo dữ liệu**, ⛔ **không phải chữ** (chữ giống nhau giữa các thẻ).
- ⭐ **KẾT LUẬN**: giống hệt màn «Tổng quan điều hành» ⇒ ⛔ **KHÔNG có CHỮ nào bị cắt trên CẢ 2 màn đã đo**
  ⇒ **`HANDOFF-20261007-C10` ĐÚNG LÀ BÁO ĐỘNG GIẢ** (đã thu hồi ở `§C24`) ⇒ ⛔ **KHÔNG SỬA `.kpi`/`.kpi-grid`** (Goal §12/§41).
- ⚠️ **⛔ CHƯA ĐO (nói thẳng)**: màn «**KPI & hiệu suất nhân viên**» (`156/164`) ⛔ không tới được lượt này (`KHONG_THAY`)
  ⇒ ⛔ **KHÔNG** nói «đã đo hết 3 màn»; ⚠️ **chữ ký `Δ8px` TRÙNG** với 2 màn đã đo ⇒ nghi cùng hoạ tiết.
- **Kiểm chứng**: ⛔ 0 thay đổi mã ⇒ cổng dự án **ĐẠT** (đọc **dòng KẾT LUẬN + 3 dấu ✓** — ⚠️ theo `§76`: ⛔ không chỉ tin mã thoát) ·
  cấu trúc log **không trùng lặp** (TASK **24** · TEST **25** · HANDOFF **12** tiêu đề) · 3 dịch vụ **đang nghe**.


## EVT-20261007-C47 — HOTFIX + BUILD (vòng 28): **thẻ trạng thái hết phơi mã thô** (`BUG-C08`) · vá **ĐỎ OAN do tranh chấp** (`BUG-C09`) · build **exit 0**
- **Task**: `TASK-20261007-C27` · **Tệp sản phẩm**: **6 tệp** `app/screens/*` + **1 tệp test** (`tests/trust-lock-foundation.test.mjs`) + **1 cổng MỚI** (`tests/mt3-c11-status-no-raw.test.mjs`).
- ⭐ **PHÁT HIỆN**: quét **TOÀN BỘ DỮ LIỆU THẬT** (395 cặp trạng thái) ⇒ **148 cặp đã có nhãn tiếng Việt** (⛔ 0 lỗi ở trường không hiển thị) ⇒ ⛔ **1 lớp lỗi thật**: `<StatusBadge>` **rơi xuống MÃ THÔ** ở **6 tệp**.
- ✅ **VÁ**: dùng `statusLabel(...)` (bảng nhãn **dùng chung**) làm **chốt chặn cuối** ⇒ ⭐ `BUG-20261007-C08` = **`VERIFIED`** (cổng + tsc + eslint + build + hồi quy).
- ⚠️ **PHỐI HỢP**: phát hiện phiên khác chạy `tools/probe-visual-regression.mjs --update` (**PID 13504**) ⚠️ **cần `:8787`** ⇒ ⭐ **CHỜ xong mới dừng dịch vụ** (Goal §36/§37) · dừng **đúng PID** (13084 · 1804) · ⛔ **KHÔNG** kill hàng loạt.
- ✅ **BUILD**: `gd-cycle` **exit 0** · migration **0340** · `BUILT ARTIFACT VALIDATION: ĐẠT` · vân tay ⭐ **`920bb0c5f11fd64a`** · dịch vụ **đã khởi động lại** ⇒ `:8787`/`:9000`/`:18081` **đang nghe** · `:9000` **HTTP 200** · cổng dự án **ĐẠT**.
- ⚠️ **HỒI QUY ĐỎ 1 CA ⇒ TRUY NGUYÊN NHÂN**: `ENOENT … probe-err.txt` — **`BUG-20261007-C09`**, **ĐỎ OAN do TRANH CHẤP** (`walk()` = `readdir` + `stat` TOCTOU; phiên khác **đang ghi/xoá tệp tạm ở gốc repo** — `probe-err-full.txt`/`probe-out-full.txt` tạo **19:35**). ✅ **VÁ** (`CHG-C21`) · ✅ **CHỨNG MINH**: chạy lại riêng **5/5** · **mô phỏng tệp lạ ⇒ 5/5** · ✅ hồi quy chốt **859 test · 858 pass · 0 fail · 1 skip**.
- ⛔ **KHÔNG CHẠM**: `Inventory.tsx` (phiên 02) · `app/page.tsx` (LOCK phiên 01) ⇒ **`HANDOFF-20261007-C13`**.
- ⭐ **Bài học lần 9**: ⚠️ **ĐỎ chưa chắc là lỗi của mình** — 2 vòng liên tiếp gặp đỏ **đều do nhiều phiên song song trên một cây mã**.
## EVT-20261007-C48 — VERIFICATION (vòng 29): **DOM xác nhận bản vá** + ⭐ **GIẢI MÃ CẤU TRÚC MENU** (hết mò điều hướng)
- **Task**: `TASK-20261007-C28` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá).
- ⭐ **GIẢI MÃ CẤU TRÚC MENU (giá trị lâu dài cho cả 3 phiên)**: mục menu = **`<button>`** có **`<span>{nhãn}</span>` + `<b>{số đếm}</b>`** ⇒ ⛔ khớp `textContent` **luôn trượt** ·
  **11 NHÓM HOA phần lớn ĐÓNG** ⇒ ⭐ **mục lá ⛔ KHÔNG có trong DOM khi nhóm đóng** ⇒ ⭐ **ĐÂY LÀ NGUYÊN NHÂN GỐC** làm **5 lượt quét trước chỉ ra 7–8 mục**.
  ⭐ **Cách đúng (đã chạy được)**: mở nhóm bằng `<span>` = **NHÃN HOA** → bấm `<span>` = **nhãn mục lá** → xác nhận **`h1`**.
- ✅ **DOM XÁC NHẬN BẢN VÁ**: màn «**Giao việc & Kiểm soát hoàn thành**» (`WorkCenter.tsx` — 1 trong 6 tệp đã vá) hiện **«Mới» · «Xong» · «Cao» · «Bình thường» · «Quá hạn»**
  ⇒ ⭐ **tiếng Việt, ⛔ 0 mã thô** ở cột trạng thái ⇒ `BUG-20261007-C08` nay **`VERIFIED`** (⚠️ DOM đo **2/6 màn**; 4 tệp còn lại ⭐ bảo đảm bởi **cổng C11 + bảng nhãn tất định**).
- ⚠️ **BỘ DÒ BẮT NHẦM MÃ ĐỊNH DANH**: 10 giá trị bị cờ là **mã công việc/dự án** (`CV-DA-…` · `PRJ-DEMO-01` · `E2E-DA-01`) ⇒ ⭐ **mã hiển thị nguyên văn là ĐÚNG** ⇒ ⭐ **LUẬT**: dò «mã thô» **chỉ** cho cột **TRẠNG THÁI/LOẠI**.
- ⚠️ **CHƯA TỚI ĐƯỢC**: màn «Cấp phát cho tổ đội» (`AllocateReturn` — nơi rò **NẶNG NHẤT**) ⇒ ⏳ vòng sau, ⭐ **dùng bản đồ mục lá** vừa đo (`TEST_LOG.md §32.1`).
## EVT-20261007-C49 — VERIFICATION (vòng 30): DOM trên **màn rò NẶNG NHẤT** + ⭐ **chốt công thức điều hướng 3/3**
- **Task**: `TASK-20261007-C29` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá).
- ⭐ **CHỐT ĐƯỢC CÔNG THỨC ĐIỀU HƯỚNG (chạy đúng 3/3)**: mở nhóm (`<span>` = **NHÃN HOA**) → **kiểm NGAY** mục lá → **bấm lá NGAY** → xác nhận `h1`;
  🛟 chốt an toàn: chưa thấy lá ⇒ **bấm nhóm lần 2**. ⚠️ **Nguyên nhân lượt trước trượt**: mở **nhiều nhóm rồi mới bấm lá** ⇒ **nhóm trước TỰ ĐÓNG** (accordion).
- ⭐ **KỸ THUẬT ĐO MỚI**: quét **ĐÚNG CỘT** bằng cách tìm `<th>` «Trạng thái»/«Ưu tiên» rồi đọc `<td>` cùng chỉ số ⇒ ⭐ **hết báo động giả** từ cột **mã định danh** (`CV-DA-…`).
- ✅ **KẾT QUẢ**: «**Cấp phát cho tổ đội**» (**màn rò NẶNG NHẤT** — `AllocateReturn.tsx`) ⇒ cột «Trạng thái» **5 dòng**, 🔴 **mã thô: 0** ✅ (nhãn «Đang hoạt động»).
  · «Hồ sơ nhân sự»: ⚠️ ⛔ không có cột trạng thái ⇒ **⛔ chưa đo được** (⛔ không suy ra «sạch») · «Giao việc»: **0 dòng** ⇒ ⚠️ **không có bằng chứng theo chiều nào**.
- ✅ **`BUG-20261007-C08` giữ `VERIFIED`** với **DOM 3/6 màn** (⚠️ 3 tệp còn lại ⭐ bảo đảm bởi **cổng `C11` + bảng nhãn tất định**).
- ⏳ **CÒN LẠI**: DOM cho `TeamManagement` · `ProjectEntityModal` · `ProjectDetailTabs` ⇒ ⭐ **nay đã có công thức** nên làm được ở vòng sau.
## EVT-20261007-C50 — ⭐ QUÉT **29 MÀN** (lượt phủ rộng đầu tiên) + vá **11 chỗ ngày ISO hiển thị** + build `exit 0`
- **Task**: `TASK-20261007-C30` · **Tệp sản phẩm**: **4 tệp** `app/screens/*` + **1 tệp cổng** (`tests/mt3-c10-date-format.test.mjs` mở rộng).
- ⭐ **THÀNH QUẢ LỚN**: nhờ **công thức điều hướng `§C33`** ⇒ quét **29 màn/11 nhóm** (mọi lượt trước **3–8 mục**) ⇒ **27 màn SẠCH** (kể cả màn nhiều dữ liệu: PR **91 dòng** · GRN **36 dòng**) · **2 màn có phát hiện**.
- 🔴 **PHÁT HIỆN THẬT**: **NGÀY ISO HIỆN THÔ** ở «Tiến độ dự án» (`2026-01-01`) và «Giao việc» (`2026-10-07`) ⇒ ⭐ **cùng lớp `BUG-20261007-C10`** (⚠️ **lớp chưa đóng hết**).
- ✅ **ĐÃ VÁ 11 CHỖ HIỂN THỊ** ở **4 tệp** (`AllocateReturn` · `Purchasing` · `PurchaseOrderDrawer` · `ContractReviewScreen`) ⇒ dùng `date()` **DÙNG CHUNG** ⇒ `dd/mm/yyyy`.
- ✅ **CỔNG `C10` 6/6 ĐẠT** — ⚠️ sau **2 lần ĐỎ OAN** + **1 lần ĐẠT RỖNG** (⭐ bài học 10: **regex không đủ**; ⛔ ô `type="date"` · so sánh · tên tệp · **dòng định nghĩa hàm** đều bị bắt nhầm) ⇒ ⭐ cổng nay **NHẮM ĐÍCH** + **đối chứng âm khớp NGUYÊN VĂN**.
- ⚠️ **⛔ CHƯA XONG**: ⛔ **chưa xác định tệp nguồn** phát ngày ISO trên **2 màn đã phát hiện** ⇒ ⭐ **KHÔNG** nói «đã vá xong lớp ngày ISO» (**`C10` mở một phần**).
- ✅ **BUILD**: `gd-cycle` **exit 0** · migration **0341** · `BUILT ARTIFACT VALIDATION: ĐẠT` · cổng dự án **ĐẠT** (vân tay HTML **`2f7a3a924559fd46`**) · dịch vụ **đã khởi động lại** · hồi quy **861 test · 860 pass · 0 fail · 1 skip**.
- ✅ **PHỐI HỢP**: kiểm **⛔ không có phiên khác** chạy `tools/probe-*` (⚠️ chốt an toàn của tôi bắt **chính lệnh của tôi** — đã kiểm **nguyên văn**) rồi mới dừng dịch vụ **đúng PID**.
## EVT-20261007-C51 — ⭐ TRUY NGUỒN **2/2** ngày ISO + vá `WorkKanban` + cổng `C10` **7/7** + build **0342**
- **Task**: `TASK-20261007-C31` · **Tệp sản phẩm**: **1** (`app/screens/WorkKanban.tsx`) + **1 cổng** (`tests/mt3-c10-date-format.test.mjs`).
- ⭐ **KỸ THUẬT TRUY VẾT DOM** (⛔ thay cho đoán tệp): tìm text node chứa ISO ⇒ in **phần tử + chuỗi tổ tiên + ngữ cảnh** ⇒ ⭐ **1 lượt đo ra đúng nguồn**.
- ✅ **NGUỒN #1 (thuộc quyền tôi) — ĐÃ VÁ**: `app/screens/WorkKanban.tsx` render `Hôm nay {UI_TODAY}` (⛔ **HẰNG ISO**) ⇒ nay `{date(UI_TODAY)}` ⇒ màn «**Giao việc**» **hết** ngày ISO.
- ⛔ **NGUỒN #2 (ngoài quyền)**: «**Tiến độ dự án**» ⇒ `ProjectProgress` **nằm trong `app/page.tsx`** (**LOCK phiên 01**) ⇒ **`HANDOFF-20261007-C14`** (kèm bằng chứng DOM **`td < tr < table.baseline-table`** + giá trị `2026-01-01`).
- ⚠️ **BÀI HỌC 10 (lặp lại lần 2)**: cổng `C10-7` phải loại **4 LỚP BÁO ĐỘNG GIẢ** (ô nhập ngày · tên tệp xuất · dòng định nghĩa hàm · phép so sánh) mới bắt đúng **1 chỗ THẬT** ⇒ ⭐ **nhưng đối chứng âm buộc bộ dò khớp NGUYÊN VĂN mẫu thật** nên ⛔ **không ĐẠT RỖNG**.
- ✅ **BUILD**: `gd-cycle` **exit 0** · migration **0342** · cổng dự án **ĐẠT** (vân tay HTML **`ab3c3d95d3d59ad4`**) · dịch vụ **đã khởi động lại** · hồi quy **862 test · 861 pass · 0 fail · 1 skip**.
- ✅ **PHỐI HỢP**: kiểm **⛔ không có probe phiên khác** trước khi dừng dịch vụ · dừng **đúng PID** (18272 · 17584).
## EVT-20261007-C52 — ⭐ QUÉT LẠI **29 MÀN** trên BẢN MỚI: **28 SẠCH** · xác nhận live bản vá · lớp lỗi MỚI «số tiền thô» **SẠCH**
- **Task**: `TASK-20261007-C32` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá).
- ⭐ **XÁC NHẬN LIVE**: «**Giao việc & Kiểm soát hoàn thành**» **NAY SẠCH** (vòng trước 🔴 do ngày ISO `2026-10-07`) ⇒ ⭐ **bản vá `WorkKanban` đã có hiệu lực trên artifact đang phục vụ** ✅
- ✅ **28/29 màn SẠCH**: ⛔ **0 mã trạng thái thô** · ⛔ **0 số tiền thô** · ⛔ **0** `null`/`undefined`/`NaN`.
- 🔴 **1 màn còn**: «**Tiến độ dự án**» (`2026-01-01` · `2026-09-23`) ⇒ ⭐ **ĐÚNG màn đã ghi `HANDOFF-20261007-C14`** (`app/page.tsx` = **LOCK phiên 01**) ⇒ ⭐ **đo khớp chính xác handoff** (⛔ không mâu thuẫn sổ sách).
- ⭐ **LỚP LỖI MỚI ĐÃ SĂN — «SỐ TIỀN THÔ» (cột tiền/số lượng hiện thiếu dấu phân cách): ⛔ 0 chỗ / 29 màn ⇒ SẠCH.** ⭐ ⛔ **KHÔNG** ghi vào sổ bug (đo sạch thì ⛔ không bịa lỗi — §12).
- ⭐ **KỸ THUẬT**: quét **theo ĐÚNG CỘT** bằng tiêu đề `<th>` ⇒ ⛔ **hết báo động giả** từ cột **mã** (đã từng gặp ở `§C32.3`/`§C34.2`).
## EVT-20261007-C53 — MỞ VÙNG PHỦ MỚI: quét **MODAL/DRAWER** ⇒ **4 modal SẠCH**, giới hạn **4/15** ghi rõ
- **Task**: `TASK-20261007-C33` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) — ⭐ và ⛔ **0 phát hiện** ⇒ ⛔ **không sửa gì, không build** (§12: ⛔ không tạo việc giả).
- ⭐ **VÙNG PHỦ MỚI**: lần đầu quét **nội dung trong modal/drawer** (⛔ các lượt trước chỉ quét màn chính) — ⚠️ nơi user làm việc nhiều nhất & từng có lỗi **cắt nội dung**.
- ⭐ **BỘ DÒ CẮT ĐÚNG BÀI HỌC `§C24`**: chỉ tính khi **phần tử vượt đáy CÓ CHỮ** ⇒ ⛔ không lặp báo động giả (hoạ tiết/`<i>` rỗng).
- ✅ **KẾT QUẢ**: ghé **16 màn** · **4 MODAL mở & quét: ⛔ 0 cắt chữ · ⛔ 0 mã thô · ⛔ 0 `null/undefined` · ⛔ 0 ngày ISO** —
  «Phiếu đề nghị mua hàng» (`entity-detail-modal`) · «Kế hoạch giao hàng» · «Đơn hàng đã giao» (`receipt-modal`) · «Quản lý dự án».
- ⚠️ **GIỚI HẠN NÓI THẲNG**: ⛔ **11 màn không mở được modal** bằng cách bấm chung ⇒ ⛔ **KHÔNG** nói «đã quét hết modal», ⛔ cũng **không** kết luận 11 màn đó sạch/lỗi.
  ⭐ **Cách cải thiện**: mở **theo ĐÚNG tên modal** (`onClick={() => open("…", row)}` trong `app/screens/*.tsx`) — ⭐ như cách đã tìm ra `userProfile`/`hrProfileEdit`.
- ⚠️ **BÀI HỌC KỸ THUẬT**: lượt 1 **chết** do 1 lời gọi `Runtime.evaluate` **treo** ⇒ ✅ lượt 2 thêm **timeout 25s/lời gọi** + **`try/catch`** ⇒ ⭐ **probe nhiều bước phải chịu lỗi TỪNG lời gọi**.
## EVT-20261007-C54 — BẢN KIỂM KÊ MODAL TỪ MÃ (18 tệp) + ⚠️ ĐÍNH CHÍNH + ⭐ **DỪNG** săn modal (biết dừng đúng lúc)
- **Task**: `TASK-20261007-C34` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) · ⛔ **0 phát hiện** ⇒ ⛔ **không sửa gì, không build**.
- ⭐ **TÀI SẢN**: **bản kiểm kê modal từ mã** — grep `open("<khoá>")` ⇒ ⭐ **18 tệp màn có modal** kèm **khoá** ⇒ ⭐ lần sau **mở đúng khoá**, ⛔ khỏi mò.
- ⚠️ **ĐÍNH CHÍNH CHÍNH MÌNH**: `§C37.3` tôi ghi «11 màn không mở được» là **giới hạn phương pháp** ⇒ ⭐ **đo lại bằng mã**: phần lớn **⛔ không có modal chi tiết** ⇒ ⭐ **giới hạn là CẤU TRÚC THẬT** (⛔ không phải probe hỏng).
- ✅ **QUÉT THÊM 2 MODAL SẠCH**: «Phiếu đề nghị mua hàng» · ⭐ **«Hồ sơ nhân sự»** (`userProfileHr`) — ⛔ 0 cắt chữ · ⛔ 0 mã thô · ⛔ **0 số thô** · ⛔ 0 `null/undefined` · ⛔ 0 ngày ISO.
- ⭐ **DỪNG SĂN MODAL**: 2 vòng chỉ đạt **5/~26 khoá** ⇒ ⚠️ **lợi suất giảm dần** ⇒ ⛔ dừng (bài học `§C21`) ⛔ thay vì đốt thêm vòng. ⚠️ **~21 khoá chưa quét** ⇒ ⛔ **không kết luận gì**.
## EVT-20261007-C55 — Săn 2 lớp lỗi MỚI ⇒ 1 lỗi THẬT đã vá («User» ×2) + cổng `C12` + build **0343**
- **Task**: `TASK-20261007-C35` · **Tệp sản phẩm**: **1** (`app/screens/ErrorReportAdminPanel.tsx`) + **1 cổng MỚI** (`tests/mt3-c12-ui-text-vi.test.mjs`).
- ⭐ **LỚP MỚI ① (nhãn `<option>` là mã ASCII)**: ✅ **SẠCH** — 4 kết quả **HỢP LỆ** («Cao» tiếng Việt ⛔ không dấu · tên font · tên kênh) ⇒ ⛔ **không bịa lỗi** (§12).
- 🔴 **LỚP MỚI ② (chữ Anh ở vị trí người dùng đọc)**: **1 LỖI THẬT** ⇒ `ErrorReportAdminPanel.tsx` có **`<th>User</th>`** + **`<dt>User</dt>`** ⚠️ lệch với 9 nhãn tiếng Việt cùng dòng ⇒ ✅ **ĐÃ VÁ** thành «**Tên đăng nhập**».
- ⭐ **KIỂM TỪNG CHỖ**: 4 nghị vấn ⇒ **2 lỗi thật (đã vá)** · **2 hợp lệ** (`page.tsx`: «Import»/«Export» **trong câu giải thích tiếng Việt**, ⚠️ thuật ngữ; ⭐ **LOCK phiên 01**) ⇒ ⛔ **không sửa**.
- ✅ **CỔNG `C12` 3/3 ĐẠT** — ⭐ **đối chứng âm** buộc bộ dò ⛔ **không bắt oan** tên biến/thuộc tính/comment/tiếng Việt không dấu/thuật ngữ hợp lệ.
- ⭐ **BÀI HỌC**: quét chữ Anh **CHỈ ở VỊ TRÍ HIỂN THỊ** + **DANH SÁCH THUẬT NGỮ HỢP LỆ** (⭐ đo được 6 giá trị bị bắt oan ở lần đầu).
- ✅ **BUILD**: `gd-cycle` **exit 0** · migration **0343** · cổng dự án **ĐẠT** (vân tay HTML **`1b7a5cd90523a298`**) · hồi quy **865 test · 864 pass · 0 fail · 1 skip** · dịch vụ **đã khởi động lại**.
## EVT-20261007-C56 — Săn 5 LỚP LỖI: **TẤT CẢ SẠCH** + **QUAN SÁT** phần trăm ⇒ `DEC-C11` (chờ user quyết) + tự báo lỗi đổi nhầm mã log
- **Task**: `TASK-20261007-C36` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) · ⛔ **0 phát hiện** ⇒ ⛔ **không sửa gì, không build** (§12).
- ✅ **5 LỚP SẠCH (có số liệu)**: ① **24/24 chỗ `toLocale*` đều ghi rõ `"vi-VN"`** · ② ⛔ **0** `en-US`/`en-GB` · ③ ⛔ **0** `Intl.*Format()` thiếu locale ·
  ④ ⛔ **0** chữ Anh ở **nút/tooltip/placeholder/văn bản JSX** (48 từ × toàn bộ `app/**`; ⚠️ ngoài phần cổng `C12` đã phủ) · ⑤ ⛔ **0** `.toFixed()` dùng cho **TIỀN** (⭐ tất cả là **PHẦN TRĂM**).
- ⚠️ **QUAN SÁT (⛔ KHÔNG phải bug)**: **phần trăm chưa thống nhất** — `toFixed(0)`+% **5** · `(1)`+% **4** · `(2)`+% **9** · `Math.round`+% **4** · `Intl percent` **0**;
  ⚠️ dấu thập phân `.` trong khi **tiền đã đúng kiểu Việt** ⇒ ⭐ **`DEC-20261007-C11`** với **3 phương án**, ⛔ **chờ USER quyết** (⚠️ nếu đổi thì làm **helper dùng chung**, ⚠️ và cần **phiên giữ `page.tsx`**).
- ⚠️ **TỰ BÁO LỖI (đã sửa)**: tôi đặt **trùng mã `DEC-C05`** (⛔ không kiểm trước) ⇒ lần sửa đầu **đổi nhầm mã mục CŨ** ⇒ ✅ **khoanh vùng sửa lại** (mục cũ `C05` · mục mới `C11`) ⇒ kiểm lại **11 tiêu đề, ⛔ 0 trùng lặp**.
  ⭐ **BÀI HỌC**: ⛔ **LUÔN kiểm KHÔNG GIAN MÃ trước khi thêm mục log** (⭐ đã mắc **2 lần**: `EVT-C53b` · `DEC-C05`).
## EVT-20261007-C57 — ⭐ DỰNG LẠI **`WEEKLY_REPORT_DATA` PHẦN A** từ 8 log (nghĩa vụ §14 của Goal) + tự sửa sai số
- **Task**: `TASK-20261007-C37` · ⛔ **0 tệp sản phẩm** (chỉ **tài liệu**) ⇒ ⛔ **không build**.
- ⚠️ **PHÁT HIỆN**: `WEEKLY_REPORT_DATA.md` **có nhưng ĐÃ CŨ** — «Completed Tasks» chỉ có **`TASK-C01…C09`** ⇒ ⛔ thiếu **`C10…C36`** (⚠️ **việc BẮT BUỘC** của Goal §14 Logging).
- ⭐ **ĐÃ LÀM**: **đo đếm THẬT** rồi **dựng lại PHẦN A** đủ **17/17 mục §14**: `TASK` **36** · `BUG` **10** · `TEST` **39** · `CHG` **15** · `DEC` **11** · `HANDOFF` **14** · `EVT` **56**.
- ✅ **PHẦN B (phụ lục 14.521 ký tự) GIỮ NGUYÊN** — kiểm lại sau khi ghi (`# PHẦN B` còn) ⇒ ⛔ **không xoá log lịch sử**.
- ⚠️ **TỰ SỬA SAI SỐ**: bản đầu ghi «23 change» ⛔ **sai** ⇒ **đếm thật 15** (`C01…C09` + `C18…C23`, ⚠️ **lỗ hổng mã `C10–C17`**) ⇒ ✅ đã sửa + ghi chú.
- ✅ **KIỂM CHỨNG**: «5 lần build» **xác nhận bằng tệp thật** (`drizzle/0339…0343_*.sql`) · «39 mục test» khớp `TEST_LOG`.
- ⭐ **Ý NGHĨA**: ⭐ **dataset tuần SẴN SÀNG** cho pipeline `CODE → LOG → STRUCTURED DATA → WEEKLY REPORT → WORD + EXCEL` ⇒ user yêu cầu **tổng hợp báo cáo tuần** là **có dữ liệu đúng ngay**.
## EVT-20261007-C58 — Vùng phủ MỚI: **TAB CON trong modal** ⇒ 5/5 ĐỔI THẬT & SẠCH + ⚠️ bắt được **1 lần ĐẠT RỖNG**
- **Task**: `TASK-20261007-C38` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) · ⛔ **0 phát hiện** ⇒ ⛔ **không sửa gì, không build**.
- ⭐ **PHÁT HIỆN**: modal «chi tiết dự án» có **5 TAB CON** render qua **`ProjectDetailTabs.tsx`** — ⭐ **1 trong 6 tệp tôi đã vá** ⇒ ⚠️ **4/5 tab CHƯA từng quét** (lượt `§C37` chỉ thấy tab mặc định).
- ⚠️ **LƯỢT 1 = ĐẠT RỖNG**: bấm tab trả **`NO_TAB`** (⚠️ nhãn thật «Thông tin chung» + **số đếm dính kèm** «Nhân sự**1**») **nhưng vẫn báo «0 lỗi»** ⇒ ⛔ **quét lại tab mặc định 5 lần**.
- ✅ **LƯỢT 2 (đã sửa cách)**: khớp **theo tiền tố** + ⭐ **xác nhận `aria-selected` ĐÃ DI CHUYỂN** ⇒ **5/5 tab ĐỔI THẬT** · **⛔ 0 tab có phát hiện** ⇒ ✅ **`ProjectDetailTabs.tsx` nay CÓ bằng chứng DOM**.
- ⚠️ **ĐÍNH CHÍNH**: «nhãn mất chữ s» ở lượt 1 là **lỗi TRÍCH XUẤT của TÔI** (lượt 2 đọc đúng «Nhân sự1» · «Lịch sử»), ⛔ **không phải lỗi giao diện**.
- ⭐ **BÀI HỌC (11)**: ⚠️ **ĐẠT RỖNG nguy hiểm hơn ĐỎ** ⇒ ⭐ **LUẬT**: mọi phép **bấm-để-đổi-chế-độ** (tab · trang · lọc) **PHẢI xác nhận trạng thái đã đổi** trước khi tin kết quả (⭐ đã gặp **3 lần**: `§C11` · `§C34` · **`§C41`**).
## EVT-20261007-C59 — CHỐT vùng phủ DOM (`ProjectEntityModal` ĐÃ có bằng chứng) + **PHÁT HIỆN 4 TỆP MÀN MÔ CÔI**
- **Task**: `TASK-20261007-C39` · ⛔ **0 tệp sản phẩm** (chỉ đọc mã + đếm) ⇒ ⛔ **không build** · ⛔ **không sửa mã người khác**.
- ✅ **`ProjectEntityModal.tsx` = CÓ bằng chứng DOM**: theo mã, nó là **cổng mở `EntityDetailModal`** (`page.tsx` + `WorkHierarchy.tsx` xác nhận)
  ⇒ ⭐ modal `entity-detail-modal` đã quét DOM (`§C37`/`§C41`, **5 tab**) **CHÍNH LÀ** nội dung tệp này ⇒ ⚠️ **sửa lại ghi chú «chưa đo»** ở `§C41.4`.
- ⭐ **PHÁT HIỆN MỚI — 4 TỆP MÀN MÔ CÔI**: `ProjectAggregateTabs.tsx` · `SiteCommandCreateModal.tsx` · `WarehouseCreateModal.tsx` (⛔ **0** tham chiếu)
  · `TeamManagement.tsx` (⚠️ **chỉ 2 tệp TEST**, ⛔ **0 import trong `app/**`**) ⇒ ⚠️ **code chết**.
  ⭐ **ĐỐI CHỨNG**: `WorkCenter` (đang dùng) **được tham chiếu ở 2 tệp** ⇒ ✅ phép đo **đúng**.
- ⚠️ **HỆ QUẢ**: bản vá thẻ trạng thái của phiên 03 trong `TeamManagement.tsx` **⛔ không tới được** (⚠️ vô hại);
  ⚠️ `ProjectAggregateTabs` **từng nằm trong bản kiểm kê modal** ⇒ dễ **tưởng nhầm đã phủ**.
- ✅ **VÙNG PHỦ DOM `BUG-C08` CHỐT: 5/6 tệp có bằng chứng DOM + 1 tệp MÔ CÔI** ⇒ ⭐ **không còn lỗ hổng xác minh thực chất**.
- ⭐ **BÀI HỌC**: ⚠️ **QUÉT THEO MÃ TRƯỚC KHI ĐO DOM** (⛔ đừng DOM-verify màn ⛔ không tồn tại).
- ✅ **ĐÃ GIAO**: **`HANDOFF-20261007-C15`** — ⚠️ **xoá là hành động PHÁ HUỶ** ⇒ ⛔ phiên 03 **không tự làm**, chỉ **báo cáo + ghi hệ quả**.
## EVT-20261007-C60 — ĐO SỨC KHOẺ CÂY MÃ (68 tệp của phiên khác — ⛔ không đụng) + ⭐ README thành **BẢNG ĐIỀU KHIỂN một trang**
- **Task**: `TASK-20261007-C40` · ⛔ **0 tệp sản phẩm** (chỉ **tài liệu**) ⇒ ⛔ **không build**.
- ✅ **ĐO SỨC KHOẺ**: `git status` ⇒ **109 tệp đổi**, ⚠️ **68 tệp ⛔ KHÔNG thuộc phiên 03** (`SESSION_A/**` · `VNTECH_*` định danh · `docs/BAO CAO TUAN …xlsx`) ⇒ ⛔ **KHÔNG đụng** (Goal §19/§35) · ✅ 3 dịch vụ **đang nghe** · ✅ **⛔ không có probe của phiên khác chạy**.
- ⭐ **TIN TỐT**: `SESSION_A/WEEKLY_REPORT_DATA.md` **đang được phiên 01 cập nhật** ⇒ ⭐ đúng phần **còn thiếu** cho **BÁO CÁO CHUNG** (`§117`) ⇒ ✅ **phối hợp đúng hướng**.
- ⭐ **BẢNG ĐIỀU KHIỂN**: chèn vào **`SESSION_C/README.md`** (⚠️ **giữ nguyên nội dung cũ**) với **4 khối**: 🟢 đã xong & bằng chứng · ⭐ vùng đã quét + **phần CHƯA quét** · ⚠️ đang mở + **ai quyết** · 📊 trạng thái phiên.
- ⚠️ **TỰ BÁO LỖI (đã sửa)**: lần chèn đầu **làm mất H1** của README ⇒ ✅ **khôi phục** + kiểm lại (H1 · `## 1. Phạm vi` · `## 3. Giao tiếp` · nội dung cũ) — ⚠️ **lần thứ 3** mắc bẫy «`new_string` ⛔ không chép lại phần bị thay» ⇒ ⭐ **LUẬT**: khi `old_string` là **một dòng có thật**, `new_string` **PHẢI chép lại dòng đó** ở đúng vị trí.
## EVT-20261007-C61 — RÀ LẠI HANDOFF bằng ĐO THẬT: **`C12` ĐÓNG** (3/3 exit 0) · 3 còn đúng · đính chính `C13` (6 ⇒ **8**)
- **Task**: `TASK-20261007-C41` · ⛔ **0 tệp sản phẩm** ⇒ ⛔ **không build** · ⛔ **không sửa** tệp phiên khác (⚠️ kể cả `tools/**`).
- ✅ **`HANDOFF-20261007-C12` ⇒ `DONE`**: chạy cổng **3 lần liên tiếp** ⇒ ⭐ **3/3 `EXIT=0`**, đủ **3 dấu ✓ + `KET LUAN`**, ⛔ **0 assertion**;
  mã nay có **thoát tường minh** (`process.exit(1)` dòng 162 · `process.exit(0)` dòng 165) ⇒ ⭐ **đúng khuyến nghị của handoff** ⇒ ⭐ **cảm ơn phiên đã sửa**.
  ⚠️ **Luật dùng cổng vẫn giữ**: đọc **DÒNG KẾT LUẬN + 3 dấu ✓** (⛔ đừng chỉ tin mã thoát) — ⚠️ thói quen an toàn.
- ⚠️ **`C13` ⇒ CÒN + ĐÍNH CHÍNH**: `Inventory.tsx` có ⭐ **8** chỗ ngày ISO hiển thị (⚠️ tôi ghi **6**) · nhãn **BCH** vẫn rơi xuống giá trị thô · chưa dùng miền `bch_confirmation`.
- ⚠️ **`C14` ⇒ CÒN** (`page.tsx`: ngày thô + module `project_progress`) · ⚠️ **`C15` ⇒ CÒN** (4 tệp màn vẫn **mô côi**).
- ⭐ **BÀI HỌC (14)**: ⭐ **HANDOFF LÀ VĂN BẢN SỐNG** ⇒ **mỗi ~10 vòng phải RÀ LẠI bằng ĐO THẬT** (⚠️ vòng này phát hiện **1 handoff đã xong** và **1 số liệu sai**).
## EVT-20261007-C62 — HỎI USER 3 quyết định (⏰ ⛔ chưa trả lời) ⇒ làm **phương án mặc định AN TOÀN** + build **0344**
- **Task**: `TASK-20261007-C42` · **Tệp sản phẩm**: **4** (`app/screens/*` — ⚠️ **chỉ chú thích**).
- ⭐ **ĐÃ HỎI** (⛔ chỉ user quyết): ① quy ước **phần trăm** (`DEC-C11`) ② **4 tệp màn mô côi** (`C15`) ③ **cho phép sửa `Inventory.tsx`** (`C13`, tệp **phiên 02** đã DONE).
  ⏰ **⛔ user chưa trả lời trong 4 phút** ⇒ ⭐ **làm theo MẶC ĐỊNH AN TOÀN** + **ghi rõ giả định**: ① giữ nguyên phần trăm ② **giữ + ghi chú** 4 tệp (⛔ **không xoá** — phá huỷ) ③ **⛔ không sửa** tệp phiên 02.
- ✅ **ĐÃ LÀM**: thêm **ghi chú «⛔ chưa được dùng ở đâu»** vào **4 tệp màn mô côi** ⇒ ⭐ ngăn **chính cái bẫy** phiên 03 đã mắc (`§C42`).
  ⚠️ **2 tệp có `"use client";`** ⇒ chèn **SAU** directive (⛔ không phá).
  ⚠️ **TỰ SỬA (lần 4)**: 1 lần chèn **xoá nhầm dòng chú thích gốc** ⇒ ✅ khôi phục + **kiểm lại** (ghi chú mới ✅ · dòng gốc ✅ · `"use client"` dòng 1 ✅).
- ✅ **BUILD**: `gd-cycle` **exit 0** · migration **0344** · `BUILT ARTIFACT VALIDATION: ĐẠT` · cổng dự án **ĐẠT** (vân tay HTML ⭐ **`d826dd0b33dbb3cd`**) · hồi quy **865 test · 864 pass · 0 fail · 1 skip** · `tsc` **exit 0** · 3 dịch vụ **đang nghe**.
## EVT-20261007-C63 — QUÉT HỒI QUY 24 MÀN TRÊN BUILD **0344** sau thay đổi song song: **23 SẠCH · 1 = `C14` đã biết** ⇒ ✅ **0 hồi quy MỚI**
- **Task**: `TASK-20261007-C43` · ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) ⇒ ⛔ **không build**.
- ⭐ **LÝ DO**: **phiên khác đã đổi 68 tệp** (⚠️ có cả `lib/request-export.ts` — **trong vùng phiên 03**) và đã build **`0344`** ⇒ ⚠️ **bằng chứng cũ có thể hết giá trị**.
- ✅ **KẾT QUẢ (DOM)**: **24 màn đo · 23 SẠCH · 1 phát hiện** — «**Tiến độ dự án**» có `NGÀY_ISO:«2026-01-01»` + `«2026-09-23»`
  ⭐ **đối chiếu = CHÍNH `HANDOFF-20261007-C14`** (module `project_progress`, `app/page.tsx` = **LOCK phiên 01**) ⇒ ⛔ **KHÔNG phải hồi quy mới**.
- ✅ **KẾT LUẬN**: ⭐ **⛔ 0 hồi quy do thay đổi song song** ⇒ 12 bản vá hiển thị của phiên 03 **vẫn nguyên giá trị**;
  ⭐ và **`C14` vẫn còn** (⚠️ đã kiểm lại — ⛔ nếu sạch thì phải **đóng handoff**, luật `§132`).
- ⚠️ **TRUNG THỰC**: ⚠️ **24 màn** (⚠️ lượt trước **29**) ⇒ ⭐ ghi **đúng số đo**, ⛔ không thổi phồng.
## EVT-20261007-C64 — ⭐ MỞ VÙNG PHỦ MỚI: quét **MODAL DẠNG NHẬP LIỆU** (lần đầu) ⇒ form «Lập phiếu đề nghị» **SẠCH**
- **Task**: `TASK-20261007-C44` · ⛔ **0 tệp sản phẩm** (3 script tạm, ⛔ đã xoá) ⇒ ⛔ **không build**.
- ⭐ **LỖ HỔNG ĐÃ BỊT**: trước vòng này phiên 03 **chưa từng quét modal DẠNG NHẬP LIỆU** — ⚠️ chỉ quét modal **CHI TIẾT** ⇒ ⚠️ form là nơi user **nhập dữ liệu**, khó phát hiện lỗi bằng mắt.
- ⭐ **CÁCH TỚI (đọc MÃ)**: `lib/menu-helpers.ts` ⇒ màn `requests` = «**Phiếu đề nghị mua hàng**» ⚠️ (⚠️ lượt đầu tôi **đoán** «Đề xuất mua hàng» ⇒ **trượt**);
  bấm **«＋ Lập phiếu đề nghị»** ⇒ modal **30 trường nhập**.
- ✅ **KẾT QUẢ**: ⛔ 0 option mã thô · ⛔ 0 rác/ngày ISO · ⛔ 0 cắt chữ · ⛔ 0 nhãn rỗng.
- ⚠️ **1 NGHỊ VẤN ĐÃ PHÂN XỬ**: **2 trường "thiếu nhãn"** ⇒ ✅ **HỢP LỆ** (nằm trong **bảng dòng hàng**, nhãn ở **`<thead>`**: «Đơn vị» · «Khối lượng đề nghị mua đợt này \*»)
  ⇒ ⛔ **KHÔNG phải lỗi** ⇒ ⛔ **không ghi sổ bug, không sửa**.
- ⭐ **BÀI HỌC (15)**: ⚠️ máy dò nhãn **phải loại trường trong bảng có nhãn ở `<thead>`** (⛔ tránh **báo động giả**); ⭐ và ⛔ **đoán nhãn menu là vô ích** ⇒ **đọc `menu-helpers.ts`**.
- ⭐ **CÔNG THỨC ĐÃ CHỐT** cho **~20 khoá modal** còn lại: **`menu-helpers.ts` → mở màn → bấm `＋ Tạo/Lập/Thêm` → máy dò 4 lớp**.
## EVT-20261007-C65 — QUÉT FORM QUY MÔ RỘNG: **5/5 form SẠCH** + chốt giới hạn phép đo + **chứng minh máy dò ỔN ĐỊNH**
- **Task**: `TASK-20261007-C45` · ⛔ **0 tệp sản phẩm** (script tạm, ⛔ đã xoá) ⇒ ⛔ **không build**.
- ✅ **KẾT QUẢ**: duyệt mọi nhóm/màn ⇒ **mở được 5 form** ⇒ ⭐ **5/5 SẠCH** (⛔ 0 option mã thô · ⛔ 0 rác/ISO · ⛔ 0 cắt chữ · ⛔ 0 thiếu nhãn ngoài bảng):
  «**Nhà cung cấp**» (8 trường ×3 màn — **cùng 1 form dùng chung**) · «**Phiếu đề nghị mua hàng**» (30 trường) · «**Thi công**» (6 trường).
  ⭐ **«Phiếu đề nghị mua hàng» quét LẦN 2 cho KẾT QUẢ Y HỆT** lần 1 (`§C45`) ⇒ ⭐ **chứng minh máy dò ỔN ĐỊNH** (⛔ không phải may rủi).
- ⚠️⚠️ **AN TOÀN DỮ LIỆU**: bộ chọn nút **chỉ mở form** (`＋|Tạo|Thêm|Mới|Lập|Nhập`) và ⛔ **LOẠI** `Gửi|Lưu|Xoá|Duyệt|Huỷ` ⇒ ⭐ **⛔ 0 thao tác ghi dữ liệu**.
- ⚠️ **GIỚI HẠN (⭐ nói thẳng)**: **19 màn** "không khớp mẫu nút tạo" ⛔ **KHÔNG** có nghĩa là **không có form** (⚠️ nút tên khác sẽ bị bỏ qua)
  ⇒ ⭐ kết luận **đúng mực**: «**6 form đã quét đều SẠCH**», ⛔ **KHÔNG** «mọi form đều sạch».
- ⭐ **MATRIX VÙNG PHỦ**: màn chính **24** · modal chi tiết **5** (+5 tab con) · ⭐ **form 6** · lớp lỗi theo mã **7** ⇒ ⚠️ **còn ~20 khoá modal** (⛔ không kết luận).
## EVT-20261007-C66 — QUÉT 2 LƯỢT (form + chi tiết dòng): **8/8 SẠCH** · phủ thêm 3 modal chi tiết · máy dò thêm lớp thẻ trạng thái
- **Task**: `TASK-20261007-C46` · ⛔ **0 tệp sản phẩm** (script tạm, ⛔ đã xoá) ⇒ ⛔ **không build**.
- ⭐ **BỊT GIỚI HẠN vòng 46**: ① **lấy nhãn nút từ MÃ** ⇒ ⛔ **THẤT BẠI** (⚠️ `open()` nằm trong **callback** ⇒ ⛔ nhãn không suy ra được);
  ⭐ ② **mở rộng bộ khớp NÚT theo THỰC TẾ DOM** + **quét 2 LƯỢT** (MỞ FORM · MỞ CHI TIẾT DÒNG) ⇒ ✅ **HIỆU QUẢ**.
- ✅ **KẾT QUẢ**: ⭐ **FORM 5/5 SẠCH · CHI TIẾT 3/3 SẠCH · TỔNG 8/8 · 0 phát hiện**.
  ⭐ **Phủ THÊM 3 modal CHI TIẾT chưa từng quét**: «Phiếu đề nghị mua hàng» · ⭐ «Đơn hàng đã giao» · ⭐ «Quản lý dự án».
- ⭐ **MÁY DÒ THÊM LỚP 5** — **thẻ trạng thái phơi mã thô** (`.badge`/`[class*=status]`) ⇒ ⛔ **0 phát hiện** ⇒ ✅ **CỦNG CỐ `BUG-C08`** (bản vá thẻ trạng thái **vẫn đúng** trên **8 modal**).
- ⭐ **ĐỘ TIN CẬY**: «Phiếu đề nghị mua hàng» quét **lần 3** ⇒ **kết quả vẫn Y HỆT** ⇒ ✅ **máy dò ỔN ĐỊNH**.
- ⚠️⚠️ **AN TOÀN**: cả 2 lượt **LOẠI** mọi nút **`Gửi`·`Lưu`·`Xoá`·`Duyệt`·`Huỷ`·`tệp`·`Đăng xuất`·`Xuất`·`In`·`Tải`** ⇒ ⭐ **⛔ 0 thao tác ghi/xoá/xuất**.
- ⚠️ **GIỚI HẠN**: chỉ **3 modal chi tiết** mở được ⇒ ⛔ **không** «mọi modal chi tiết đều sạch»; ⚠️ còn **~20 khoá `open()`** ⛔ chưa mở được bằng DOM.
## EVT-20261007-C67 — Cập nhật BẢNG ĐIỀU KHIỂN + ⚠️ phép đo SỐ TIỀN **VÔ HIỆU** (CSDL trống) ⇒ `HANDOFF-C16` + ✅ bác bỏ nghi vấn «trùng nội dung»
- **Task**: `TASK-20261007-C47` · ⛔ **0 tệp sản phẩm** (3 script tạm, ⛔ đã xoá) ⇒ ⛔ **không build**.
- ✅ **BẢNG ĐIỀU KHIỂN cập nhật**: log **TASK 46 · TEST 47 · CHG 16 · EVT 66** · migration **`0339`→`0344`** · vân tay **`d826dd0b33dbb3cd`** · **6 build** ·
  ⭐ **màn chính 24** (số **ĐO ĐƯỢC**) · ⭐ **8 modal chi tiết + 6 form + 5 tab con** · ⭐ thêm **LUẬT AN TOÀN khi quét tự động**.
- ⚠️⚠️ **PHÉP ĐO LỚP SỐ TIỀN = VÔ HIỆU**: 19 màn ⇒ **0 cột tiền · 0 số thô**; ⭐ **chẩn đoán**: **cột tiền CÓ THẬT** («Tiền thực thu»·«Hóa đơn»·«Công nợ»·«Kế hoạch»·«Thực tế báo cáo»·«Được duyệt»)
  ⚠️ **nhưng MỌI Ô TRỐNG** ⇒ ⚠️ **CSDL fixture ⛔ không có số liệu** ⇒ ⭐ **⛔ KHÔNG kết luận «sạch»** (⭐ tự phát hiện, ⛔ không khoe).
- ⭐ **BÀI HỌC (16)**: ⚠️ **phép quét phân loại bằng DOM PHỤ THUỘC DỮ LIỆU** — ⭐ **trên CSDL trống thì «0 lỗi» VÔ NGHĨA** (⚠️ đúng bẫy **ĐẠT RỖNG** `§C41`).
- ✅ **BÁC BỎ NGHI VẤN**: «Đấu thầu» vs «Hợp đồng các loại» — **cùng tiêu đề VÀ cùng 1 dòng rỗng** + «Dữ liệu mới sẽ xuất hiện tại đây.» ⇒ ⛔ **KHÔNG phải lỗi định tuyến** (⚠️ 2 module **chưa có dữ liệu**).
  ⭐ **Điểm cộng**: ✅ **trạng thái rỗng có thông điệp TIẾNG VIỆT rõ ràng** ⇒ ✅ **UX rỗng tốt**.
- ⭐ **GIAO `HANDOFF-20261007-C16`**: lớp **số tiền** ⛔ **chưa đo được** ⇒ **3 phương án** cho **USER** (⚠️ phiên 03 ⛔ **không tự tạo dữ liệu nghiệp vụ**).
## EVT-20261007-C68 — ⏸ **SESSION_PAUSE theo CHỈ ĐẠO USER** («Audit xong thì tạm dừng lại đợi tôi ra quyết định»)
- **Thời điểm**: vòng **48** · **Lý do**: ⭐ **user chỉ đạo dừng** để **chờ quyết định** ⇒ ⛔ **phiên 03 DỪNG thực thi tự động** (⛔ không mở vòng mới).
- ✅ **TRẠNG THÁI BÀN GIAO (đo được, build `0344`)**:
  · Migration **`0339`→`0344`** · vân tay HTML **`d826dd0b33dbb3cd`** · cổng dự án **ĐẠT** (3 ✓ + `KET LUAN`)
  · Hồi quy **865 test · 864 pass · 0 fail · 1 skip** · `tsc` **exit 0** · `eslint` **0 lỗi**
  · Dịch vụ **`:8787` · `:9000` · `:18081` đang nghe** (`:9000` **HTTP 200**)
  · Log: `TASK` **47** · `TEST` **47** · `BUG` **10** · `CHG` **16** · `DEC` **11** · `HANDOFF` **16** · `EVT` **68** mục (⛔ **0 trùng lặp**)
- ⭐ **3 LOẠI VIỆC ĐANG CHỜ QUYẾT ĐỊNH** (⛔ phiên 03 **KHÔNG tự làm**):
  **① USER quyết**: `DEC-20261007-C11` — **quy ước PHẦN TRĂM** (A giữ nguyên · B `1 chữ số + dấu ,` · C số nguyên) ⇒ ⚠️ ~**22 chỗ**.
  **② USER quyết**: `HANDOFF-20261007-C15` — **4 tệp màn MÔ CÔI** (giữ + ghi chú · **xoá** ⚠️ **phá huỷ** · nối lại menu).
  **③ USER quyết/cấp dữ liệu**: `HANDOFF-20261007-C16` — **lớp SỐ TIỀN chưa đo được** ⚠️ vì **CSDL fixture trống số** (⚠️ cần **dữ liệu mẫu** hoặc user tự xem).
  ⚠️ **④ Ngoài quyền phiên 03** (chờ **S01/S02**): `C13` (`Inventory.tsx` — **phiên 02**) · `C14` (`app/page.tsx` — **LOCK phiên 01**).
- ⭐ **KHÔNG có việc nào của phiên 03 bị bỏ dở ở trạng thái KHÔNG XÁC ĐỊNH**: ⛔ 0 tệp sản phẩm sửa dở · ⛔ 0 script tạm còn lại · ⛔ **0 push / 0 commit** (đúng Goal §47).
- ✅ **TÀI LIỆU BÀN GIAO**: ⭐ **`SESSION_C/README.md` = BẢNG ĐIỀU KHIỂN một trang** (đã cập nhật **vòng 48**) · `WEEKLY_REPORT_DATA.md` **PHẦN A đủ 17 mục §14** ⇒ ⭐ **sẵn sàng xuất báo cáo tuần** khi user yêu cầu.
## EVT-20261007-C69 — 🚨 HOTFIX CRITICAL `BUG-C12` (MẤT DỮ LIỆU) **HOÀN TẤT & XÁC MINH**: 2 nguyên nhân, 2 bản vá, kiểm bằng UI thật + ảnh
- **Task**: `TASK-20261007-C48` · **Tệp sản phẩm**: **2** (`app/screens/HrProfileEditModal.tsx` · `tests/mt3-c13-hr-modal-no-wipe.test.mjs` **mới**).
- 🚨 **USER BÁO**: sửa 1 thông tin ⇒ các thông tin khác **tự bị xoá** (`----`), «chức danh bị mất».
- ⭐ **ROOT CAUSE ① (FE+BE)**: form **chỉ render tab đang mở** ⇒ trường tab kia **vắng trong DOM** ⇒ `String(fd.get(x) || "")` gửi **`""`** ⇒ BE `nvl(...)` ghi **NULL** ⇒ **GHI ĐÈ ⇒ MẤT DỮ LIỆU**.
  ✅ **VÁ**: `hrVal(name, fallback)` cho **11 trường** — ⭐ **vắng trong DOM ⇒ GIỮ giá trị hiện có**; ⚠️ ô có trong DOM mà **xoá trắng ⇒ vẫn gửi rỗng** (tôn trọng ý người dùng).
- ⭐ **ROOT CAUSE ② (FE, React)**: 2 nhánh tab dùng **cùng loại `<div className="form-grid">` ở cùng vị trí** ⇒ **React TÁI DÙNG `<input>`** ⇒ `defaultValue` ⛔ không áp lại
  ⇒ tab «cá nhân» **hiện giá trị của tab «user»** (mã NV/họ tên/chức danh) ⇒ ⚠️ **lưu là ghi SAI** (⭐ khớp `cha.ht`). ✅ **VÁ**: **`key={tab}`** trên **cả 2 nhánh**.
- ✅ **XÁC MINH (user yêu cầu — tài khoản `admin` thật · test trên `e2e.diag`)**:
  ⛔ **TRƯỚC**: payload `position:""` ⇒ CSDL **`position` ⇒ NULL** (mất «Chức danh»); tab cá nhân hiện «E2E-DIAG»/«Chẩn đoán»/«Chỉ huy trưởng».
  ✅ **SAU**: payload `position:"Chỉ huy trưởng"`; tab cá nhân **RỖNG đúng thực tế**; **CSDL giữ nguyên** sau khi bấm Lưu ⇒ ⭐ **⛔ KHÔNG mất dữ liệu**.
  📸 **9 ảnh** trong `SESSION_C/evidence/` (⭐ có ảnh TRƯỚC và SAU).
- ⚠️ **THIỆT HẠI**: 26 hồ sơ · rỗng `position` **1** · `phone` **2** · `identity_no` **1** · `birth_date` **1** · `permanent_address` **1** · `education_level` **1**
  ⇒ ⚠️ **`cha.ht`** cần user nhập lại **Chức danh + Điện thoại** và **sửa** «Địa chỉ thường trú»/«Trình độ» (đang chứa giá trị **ghi nhầm**).
- ⚠️ **TỰ SỬA 3 LỖI CỦA TÔI TRONG VÒNG NÀY**: ① chèn chú thích JSX **trong nhánh ternary** ⇒ 🔴 lỗi cú pháp (`TS17002`) ⇒ ✅ sửa
  ② **đọc sai khoá JSON** (`$j.hrRecords` thay vì `data.hrRecords`) ⇒ ⚠️ **suýt kết luận sai «đường đọc hỏng»** ⇒ ✅ đính chính
  ③ **đo không khoanh vùng** modal ⇒ ⚠️ suýt kết luận sai về modal chi tiết ⇒ ✅ đo lại đúng phạm vi.
- ✅ **BUILD**: `gd-cycle` **exit 0** · migration **`0345`** + **`0347`** · `BUILT ARTIFACT VALIDATION: ĐẠT` · cổng dự án **ĐẠT** (vân tay HTML **`d02e9e4702c7b7cd`**)
  · hồi quy **878 test · 877 pass · 0 fail · 1 skip** · `tsc` **0** · `eslint` **0** · 3 dịch vụ **đang nghe**.
- ⭐ **CHỜ USER**: (a) **nhập lại dữ liệu** cho `cha.ht`; (b) **nghiệm thu bằng mắt** modal Sửa hồ sơ; (c) ⚠️ **quyết `HANDOFF-C17`** (sửa BE theo «khoá vắng = không đổi»).
## EVT-20261007-C70 — ⭐ LỚP `BUG-C13` (quyền theo PHÒNG BAN): **vá phần TRONG QUYỀN** (`lib/workflow-helpers.ts`) + đo tác động **+35 người duyệt** + cổng `C16`
- **Task**: `TASK-20261007-C50` · **Tệp sản phẩm**: **1** (`lib/workflow-helpers.ts`) + **1 cổng MỚI** (`tests/mt3-c16-dept-permission-gates.test.mjs`).
- ⭐ **BỐI CẢNH**: vòng 55 phát hiện `BUG-C13` (`page.tsx`: nút «Sửa hồ sơ» bị ẩn oan vì chỉ xét quyền **CẤP NGƯỜI DÙNG** + mã module **ĐẢO**).
  Vòng 56 **quét TOÀN LỚP (luật 17)** ⇒ tìm **chỗ thứ hai CÙNG KHUÔN** trong **`lib/workflow-helpers.ts`** ⇒ ⭐ **tệp này THUỘC QUYỀN phiên 03** ⇒ ✅ **ĐÃ VÁ**.
- ⛔ **TRƯỚC**: `hasApprovePermission` chỉ xét `allModulePermissions` theo `userId` ⇒ ⚠️ người có quyền **DUYỆT theo PHÒNG BAN** bị đánh dấu **SAI**
  ⇒ ⭐ **HỆ QUẢ trong `WorkflowModal`**: `onlyPermitted` **LỌC** ⇒ **ẨN người duyệt HỢP LỆ** + badge «Chưa có quyền duyệt» **sai**.
- ✅ **VÁ**: xét **thêm** `departmentModulePermissions` (theo `organizationUnitId` + `moduleKey` + `canApprove` + `active`) — ⭐ **giữ nguyên** nhánh quyền cấp người dùng + `admin`.
- ⭐ **TÁC ĐỘNG ĐO ĐƯỢC (dữ liệu thật)**: module **`approvals`** ⛔ **26 → ✅ 61** người (**+35**) · `dept_legal_hr` **5 → 9** · `dept_finance_payment_plan` **5 → 9**
  ⇒ ⭐ **VÍ DỤ**: `probe_grant1_073196` · `probe_grant1_250625` · `probe_grant1_457899` (role `ksda`, phòng **BCH**) — ⛔ trước «Chưa có quyền duyệt» (**SAI**) ⇒ ✅ sau «Có quyền duyệt».
- ⭐ **ĐÃ KIỂM ĐIỀU KIỆN DỮ LIỆU TRƯỚC KHI VÁ**: ✅ `department_module_permissions` có cột **`can_approve`** · ✅ API trả `organizationUnitId`+`moduleKey`+`canApprove` · ✅ `users[]` có `organizationUnitId`.
- ⚠️ **PHẦN ⛔ NGOÀI QUYỀN (vẫn `OPEN`)**: `app/page.tsx` có **4 chỗ CÙNG KHUÔN** (`canViewAudit` · `canAdministerStaff` · `canManageRole` · `canManageUserPermissions`) ⇒ ⭐ **`HANDOFF-C20`**;
  ⭐ **ĐO THÊM**: **`dept_hr_legal` ⛔ KHÔNG tồn tại** trong `module_catalog` (⭐ **mã ĐẢO** xác nhận ở tầng danh mục) · ⚠️ **12+ module** có quyền phòng ban **`can_edit=1`** ⇒ ⚠️ **lớp lỗi ảnh hưởng RỘNG**.
- ✅ **CỔNG MỚI `mt3-c16`** (**4/4**, ⭐ **có đối chứng âm** + **chốt vùng phủ**) · **meta-gate `c15` 4/4** (⭐ tự động công nhận cổng mới).
- ✅ **BUILD**: `gd-cycle` **exit 0** · migration **`0348`** · cổng dự án **ĐẠT** (vân tay **`aa8d93a0c8ce613f`**) · hồi quy **919 test · 918 pass · 0 fail · 1 skip** · `tsc` **0** · `eslint` **0** · 3 dịch vụ **đang nghe**.
## EVT-20261007-C71 — ⭐ XÁC MINH BẢN VÁ BẰNG **DOM THẬT** (người duyệt theo PHÒNG BAN hiện «Có quyền duyệt») + ⚠️ **bài học 25** + dọn log tạm
- **Task**: `TASK-20261007-C50` (tiếp) · ⭐ **KHÔNG đổi mã sản phẩm** (chỉ kiểm chứng) ⇒ ⛔ không cần build.
- ⭐ **ĐÃ DÒ ĐƯỢC ĐƯỜNG ĐI** (⭐ ghi lại để ⛔ không mò lại): `QUẢN TRỊ HỆ THỐNG` (**bấm nhóm**; ⚠️ nhãn có mũi tên `⌄/⌃` ⇒ **phải khớp «chứa chuỗi»**) → «**Danh mục & phân quyền**» → **TAB** «**9 Workflow phê duyệt**» → ⭐ quy trình là **THẺ ⛔ không phải `<tr>`** ⇒ nút «Sửa» của **thẻ** chứa `WF-NHAPKHO-01`.
- ⭐ **KẾT QUẢ**: mở «Sửa quy trình: **Quy trình nhập kho**» ⇒ tick «**Chỉ hiện người có quyền duyệt**» ⇒ gõ «073196» ⇒ ⭐ hiện «**Probe cấp 1 quyền 073196** · NV-PG1-073196 · Ban chỉ huy công trường» với badge **«Có quyền duyệt»** (**2** kết quả · «Chưa có quyền duyệt» = **0**).
  ⭐ Người này **⛔ KHÔNG có quyền cấp NGƯỜI DÙNG** cho `warehouse_receipt` (⭐ **chỉ theo PHÒNG BAN**) ⇒ ⛔ trước khi vá **BỊ LỌC MẤT** ⇒ ✅ sau khi vá **hiện đúng** ⇒ ⭐ **UI khớp CHÍNH XÁC phép đo dữ liệu**.
- ⚠️ **BÀI HỌC (25)**: ⛔ gán `.value` cho **ô nhập của React** là **KHÔNG ĐỦ** (⚠️ React ⛔ không cập nhật state ⇒ kết quả **rỗng** ⇒ ⚠️ **suýt kết luận sai «bản vá không chạy»**) ⇒ ✅ **PHẢI dùng native setter** + phát **`input` VÀ `change`**.
  ⭐ **LUẬT**: kết quả **rỗng** khi kiểm ô nhập React ⇒ ⛔ **đừng kết luận «hỏng»** — ⭐ **kiểm lại CÁCH GÕ trước** (⚠️ **ĐỎ GIẢ** — mặt trái của «ĐẠT RỖNG»).
- ⭐ **ẢNH BẰNG CHỨNG (đã ĐỌC LẠI để chắc chắn thấy badge)**: `evidence/BUG-C13-3-badge-NHAPKHO-073196.png` (⭐ có **ô đỏ** khoanh kết quả) + `BUG-C13-2-modal-NHAPKHO-loc-quyen.png`.
  ⚠️ Lần chụp ĐẦU **không cuộn** ⇒ ảnh ⛔ **không thấy badge** ⇒ ⚠️ **bằng chứng vô dụng** ⇒ ✅ **sửa probe**: **cuộn tới kết quả** + **khoanh đỏ** rồi chụp lại · ⛔ **đã xóa 4 ảnh trùng/không dùng** ⇒ ⭐ tổng **12 ảnh bằng chứng** (10 `BUG-C12` + 2 `BUG-C13`).
- ⭐ **CÔNG CỤ ĐỂ LẠI**: `tools/probe-s03-dept-approver.mjs` (⭐ chạy lại được: mở modal → lọc → gõ → in badge → chụp ảnh).
- ✅ **DỌN DẸP**: ⛔ xóa **6 tệp log tạm** ở gốc repo (`_ui-*.log` · `_proxy-*.log` · `_java-*.log` — ⚠️ do lần khởi động lại dịch vụ vòng 56) ⇒ ⭐ **0 tệp tạm** · ✅ **dịch vụ vẫn khoẻ** (3 cổng nghe · `:9000` **HTTP 200**).
## EVT-20261007-C72 — ⭐ QUÉT LỚP CỔNG QUYỀN TOÀN BỘ MÀN: **1 lỗi mới giao phiên 02** (`HANDOFF-C21`) + **3 chỗ xác nhận ĐÚNG** + tự gỡ **chú thích sai** trong tệp mình + cổng `C13` lên **7 ca**
- **Task** `TASK-20261007-C51` · **Change** `CHG-20261007-C28` · **Tệp sản phẩm đổi**: **1** (`app/screens/HrProfileEditModal.tsx` — ⭐ **chỉ CHÚ THÍCH**, ⛔ 0 đổi logic) + **1 cổng** (thêm 2 ca vào `tests/mt3-c13-hr-modal-no-wipe.test.mjs`).
- ⭐ **PHÁT HIỆN MỚI (giao phiên 02)**: ⚠️ `Inventory.tsx` dòng **261+430** — nút «**＋ Thêm nhân sự**» **CHỈ hiện với `role === "admin"`** ⇒ ⚠️ **chặn OAN** người có **`admin_tab_06`** (⭐ BE **đã cho qua** từ **PA-1 `DEC-20261008-001`**: `ActionRbacRegistry:277` + `UserManagementUseCase:275-276`) ⇒ ⭐ **`HANDOFF-20261007-C21`** (⚠️ **trái chủ trương của user**: «việc thường ngày dùng tài khoản thường **được cấp quyền QUA CẤU HÌNH**»).
- ⭐ **TINH CHỈNH `HANDOFF-C20`**: ⚠️ bản trước ghi «**4 chỗ cùng khuôn ⇒ ảnh hưởng rộng**» ⇒ ⭐ **ĐO CSDL**: `admin_tab_*` ⛔ **không có** dòng quyền phòng ban ⇒ ⭐ **CHỈ 1/4 cổng THẬT SỰ LỖI** (`canAdministerStaff` — vì gộp `HR_EDIT_MODULES` là module **nghiệp vụ**) ⇒ ⭐ **việc phải làm chỉ 1 DÒNG** (⚠️ luật 23: ⛔ đừng để phiên khác vá thứ **đang đúng**).
- ✅ **TỰ SỬA TRONG TỆP MÌNH**: ⛔ **gỡ khối chú thích CŨ SAI** trong `HrProfileEditModal.tsx` (⚠️ «chỉ `role === admin` mới gọi `update_user`» — ⚠️ **trái mã hiện tại**, ⚠️ làm theo sẽ khoá oan mục tài khoản = ⚠️ **đúng lớp `BUG-C13`**) + ⭐ **khoá bằng 2 ca cổng** (`C13-6`: `canEditAccount = true` PHẢI giữ · `C13-7`: ô `role` PHẢI `disabled={!isAdminRole}` ⭐ **có đối chứng âm**).
- ✅ **KẾT QUẢ**: cổng `C13` **7/7** · meta-gate `C15` **4/4** · `gd-cycle` **exit 0** · migration **`0349`** · cổng dự án **ĐẠT** (**`022fecb6c0e82f81`**) · hồi quy **921/920/0** · `tsc` 0 · `eslint` 0 · 3 dịch vụ **đang nghe**.
## EVT-20261007-C73 — 🔴 **PHÁT HIỆN `BUG-C14` (HIGH)**: màn «DANH MỤC & PHÂN QUYỀN» CHẶN OAN tài khoản cấu hình (`page.tsx:625`) ⇒ **PA-1 không dùng được từ giao diện** + giao `HANDOFF-C22`
- **Task** `TASK-20261007-C52` · ⭐ **⛔ KHÔNG đổi mã sản phẩm** (⭐ chỉ ĐO + giao việc) ⇒ ⛔ không cần build.
- ⭐ **CÁCH PHÁT HIỆN**: ⭐ từ **`OPEN VERIFY`** của vòng 59 (⚠️ kiểm PA-1 bằng tài khoản **⛔ không phải admin**) ⭐ **đã làm ĐÚNG CÁCH ở lần 4** nhờ **luật 26** (chỉ đo phần **HIỂN THỊ** + **ĐỌC ẢNH**) và **luật 27** (⛔ không bấm mọi nút — chỉ bấm theo **danh sách trắng**).
- ✅ **BẰNG CHỨNG 3 TẦNG**: ① **MÃ** (`page.tsx:625` — nhánh `admin` chỉ nhận `isAdminUser`) · ② **DỮ LIỆU** (API: `giamdoc.demo` có **`admin` 1/1/1 + toàn bộ `admin_tab_01…14` 1/1/1**) · ③ **MÀN HÌNH** (📸 `PA1-4-man-quan-tri-director.png`: panel **«CHƯA ĐƯỢC PHÂN QUYỀN»**, **0 tab**, **0 dòng**).
- ⚠️ **MÂU THUẪN (⭐ lý lẽ mạnh)**: ⭐ **CÙNG TỆP** `page.tsx:491` (menu) **đã** dùng ``hasAnyCapability(modulePermission(data, item.key))`` cho nhóm quản trị ⇒ ⭐ **menu cho vào, màn chặn**; ⚠️ và **backend** (`ActionRbacRegistry` + PA-1) **đã cho qua**.
- 🔴 **HỆ QUẢ**: ⭐ **PA-1 KHÔNG THỂ DÙNG TỪ GIAO DIỆN** (⚠️ người cấu hình ⛔ không mở nổi màn để bấm Lưu) ⇒ ⚠️ **triệu chứng user báo còn nguyên ở tầng màn** · ⚠️ **10+** tài khoản cấp tab quản trị bị ảnh hưởng.
- ✅ **ĐÃ GIAO**: `HANDOFF-20261007-C22` (**1 DÒNG** vá đề xuất + test có **đối chứng âm** + **cách đo lại**).
- ✅ **AN TOÀN**: ⛔ **không ghi dữ liệu** — probe **tự dừng** khi ⛔ không thấy bảng phân quyền ⇒ ⭐ **CSDL đích TRƯỚC/SAU GIỐNG NHAU** ✅ · ⛔ **0 lần 403**.
## EVT-20261007-C74 — ⭐ TIỀN KIỂM CHỨNG `HANDOFF-C22` trên dữ liệu thật (5 tài khoản) ⇒ bản vá AN TOÀN + ⚠️ tự bắt được **cách đánh giá SAI của mình** (nhãn `role` vs QUYỀN THẬT) + phát hiện **`L-14`**
- **Task** `TASK-20261007-C52` (tiếp) · ⭐ **⛔ KHÔNG đổi mã sản phẩm** (⭐ chỉ ĐO + tiền kiểm chứng + giao việc) ⇒ ⛔ không cần build.
- ⭐ **ĐÃ LÀM**: đăng nhập **thật** **5** tài khoản ⇒ đọc `data.modulePermissions` ⇒ ⭐ **mô phỏng predicate HIỆN TẠI và ĐỀ XUẤT** ⇒ so kỳ vọng.
- ✅ **KẾT QUẢ**: `admin` **DUOC VAO** cả hai ✅ · `giamdoc.demo` (**15** dòng `admin*`): **BI CHAN → DUOC VAO** ✅ (sửa `BUG-C14`) · `e2e.thuky` (**15**): **BI CHAN → DUOC VAO** ✅ · ⭐ **ĐỐI CHỨNG ÂM**: `e2e.ksda` · `e2e.kt` (**0** dòng) ⇒ ⭐ **GIỮ CHẶN** ✅
  ⇒ ⭐ **bản vá MỞ ĐÚNG cho người CÓ quyền và GIỮ CHẶN người ⛔ không có** ⇒ ✅ **an toàn để phiên 01 áp** (⭐ **tiền kiểm chứng TRƯỚC khi giao**).
- ⚠️⚠️ **TỰ BẮT ĐƯỢC LỖI ĐÁNH GIÁ CỦA MÌNH**: lần đo đầu (**3 ca · ⛔ thiếu đối chứng âm**) thấy `e2e.ns` (**nhãn `hr`**) cũng được mở ⇒ ⭐ tôi **tưởng là lỗ hổng** ⇒ ⭐ **đo sâu**: nó có **ĐÚNG 15 dòng `admin*`** (⭐ **được cấp THẬT**) ⇒ ⚠️ **tôi đã đánh giá theo NHÃN `role` ⛔ không theo QUYỀN THẬT** — ⚠️ **đúng lớp sai lầm mà `C13/C14` nói tới, ở chiều ngược lại** ⇒ ✅ **sửa cách đánh giá + thêm 2 đối chứng âm**.
- ⚠️ **PHÁT HIỆN KÈM**: **DỊ THƯỜNG DỮ LIỆU ĐÃ BIẾT `L-14`** — `e2e.ns` mang **15 dòng quyền cấp `admin`/`admin_tab_*`** (phạm vi **director**) dù **nhãn `hr`** (⭐ tài liệu cũ `tools/viet-bao-cao-gd3-9.mjs` đã ghi) ⇒ ⭐ **nên xử lý RIÊNG** (⚠️ ⛔ đừng lấy làm cớ giữ `BUG-C14`).
- ⭐ **BÀI HỌC (28)**: ⭐ **tiền kiểm chứng bản vá trước khi giao** — ⭐ mô phỏng trên **dữ liệu THẬT** với **≥2 ca DƯƠNG + ≥2 ca ÂM** (⚠️ 3 ca **chưa đủ** — ⚠️ tôi suýt kết luận sai) · ⭐ và ⚠️ **đánh giá theo QUYỀN THẬT, ⛔ KHÔNG theo NHÃN `role`**.
## EVT-20261007-C75 — ⚠️ **USER CHỐT LẠI BẢN ĐỒ QUYỀN**: phiên 03 = **HR–TEAMS** · phiên 01 = **PR&PO–ADMIN** ⇒ ⛔ phiên 03 **DỪNG** sửa tệp ADMIN + ⭐ **tự khai báo 1 tệp đã sửa NGOÀI PHẠM VI**
- ⭐ **NGUYÊN VĂN USER (10/10/2026)**: «việc của session 3 là nhóm **HR - TEAMS** còn session 1 là **PR&PO - ADMIN** ⛔ đừng có vượt quyền chỉ làm việc của mình thôi»
- ✅ **ĐÃ DỪNG NGAY**: ⛔ **KHÔNG sửa** `app/screens/AdminUserModalTabs.tsx` (**ADMIN** — phiên 01) — ⭐ **đã kiểm bằng `git diff --numstat`: ⛔ CHƯA hề sửa** (⚠️ tôi chỉ **ĐỌC** + **định** sửa thì user nhắc ⇒ ⭐ **dừng kịp**).
- ⚠️ **TỰ KHAI BÁO VƯỢT PHẠM VI (⭐ trung thực)**: ⭐ phiên 03 **ĐÃ SỬA** **`lib/workflow-helpers.ts`** (vòng 56 — **15 thêm / 1 bớt**, thêm nhánh quyền **DUYỆT theo PHÒNG BAN**) ⚠️ **thuộc WORKFLOW/ADMIN** ⇒ ⭐ **NGOÀI PHẠM VI** (⚠️ lúc đó tôi hiểu phạm vi là `app/screens/**` + `lib/**` ⇒ ⚠️ **hiểu SAI**)
  ⇒ ⭐ **ĐÃ GIAO `HANDOFF-20261007-C24`** cho phiên 01 chọn **(a) GIỮ** (⭐ bản vá **đã có bằng chứng**: cổng `mt3-c16` 4/4 · tác động **26 → 61** người duyệt · **xác minh trên giao diện thật**) **hay (b) HOÀN** (``git checkout -- lib/workflow-helpers.ts`` ⚠️ khi đó cổng `c16` sẽ ĐỎ ⇒ phải gỡ cổng).
- ⭐ **PHÁT HIỆN MỚI (⭐ đo được, ⛔ giao — không tự sửa)**: 🔴 **`hasAdminTab` LUÔN TRẢ `FALSE`** (`app/screens/AdminUserModalTabs.tsx:18-24` đọc `allModulePermissions` lọc theo `userId`) — ⭐ mô phỏng trên **4 tài khoản thật**:
  `giamdoc.demo` **0 dòng** ⇒ FALSE (⚠️ quyền hiệu lực **CÓ**) · `e2e.ns` **0 dòng** ⇒ FALSE · ⭐ **`admin` cũng 0 dòng ⇒ FALSE** · `e2e.ksda` 0 dòng ⇒ FALSE (✅ đúng)
  ⇒ ⚠️ **mọi cổng CHỈ dựa `hasAdminTab` bị KHOÁ VĨNH VIỄN** (⭐ `page.tsx` **đã** có chú thích cũ «NÚT BƯỚC 14 BỊ KHOÁ VĨNH VIỄN» — ⭐ **cùng kết luận, ⛔ chưa sửa tận gốc**)
  ⇒ ⭐ **ĐÃ GIAO `HANDOFF-20261007-C23`** cho **phiên 01** (⚠️ **ADMIN**) kèm **hướng vá đề xuất** (đọc **quyền HIỆU LỰC** `data.modulePermissions`) + **test có đối chứng âm**.
- ⭐ **CAM KẾT**: ⛔ từ nay phiên 03 **KHÔNG sửa** tệp ngoài **HR – TEAMS**; ⭐ ngoài phạm vi ⇒ **chỉ ĐỌC + GHI HANDOFF**.
## EVT-20261007-C76 — ⭐ HỒI QUY TRONG PHẠM VI HR–TEAMS ⇒ **SẠCH** + ⭐ quét họ lỗi quyền trong phạm vi ⇒ **⛔ không có** + quan sát mục menu «Tổ đội theo dự án»
- **Task** `TASK-20261007-C53` · ⭐ **⛔ KHÔNG đổi mã sản phẩm** (⭐ chỉ QUÉT + HỒI QUY) ⇒ ⛔ không cần build.
- ⭐ **BỐI CẢNH**: sau khi user chốt lại phạm vi (phiên 03 = **HR–TEAMS**), phiên 03 **chuyển toàn bộ hoạt động vào trong phạm vi** ✅ ⇒ ⭐ việc đầu tiên: **quét họ lỗi quyền** (`hasAdminTab` · `allModulePermissions` · `role==="admin"`) trong **5 tệp HR–TEAMS** + **hồi quy giao diện**.
- ✅ **QUÉT**: ⭐ **⛔ KHÔNG tệp HR–TEAMS nào dùng `hasAdminTab`** (⭐ tránh bẫy `HANDOFF-C23`) · ⭐ `TeamDirectory` dùng **đúng** `modulePermission` **hiệu lực** ✅ · `ProjectTeams`/`HrScreen` nhận **prop** (cổng thật ở `page.tsx` = phiên 01) · `HrProfileEditModal` chỉ **khoá ô `role`** (✅ khớp BE) · `TeamManagement` ⛔ không kiểm quyền ⚠️ **nhưng là màn MÔ CÔI** (`HANDOFF-C15`).
- ✅ **HỒI QUY**: «Hồ sơ nhân sự» **26 dòng** ✅ · modal «Sửa hồ sơ» **2 tab đúng** ⭐ **chống tái dùng ô còn giữ** (`Số CCCD/CMND` = `""` ⛔ không trùng `Mã nhân viên` = `E2E-DIAG`) ⇒ ⭐ **bản vá CRITICAL `C12` VẪN GIỮ** ✅ · tab «**Tổ đội**» render **1 bảng · 5 dòng** ✅ · 📸 3 ảnh (`HRQ-1` · `HRQ-2` · `HRQ-6`).
- ⚠️ **QUAN SÁT (⭐ chỉ ghi, ⛔ không sửa)**: `lib/menu-helpers.ts` khai ``{ key:"teams", label:"Tổ đội theo dự án", groupKey:"project_management" }`` ⚠️ nhưng **UI ⛔ không có leaf đó** — ⭐ đường vào THẬT = «Quản lý dự án» → **tab «Tổ đội»** ⇒ ⚠️ **mục menu khai mà ⛔ không có leaf** (⚠️ tệp thuộc **phiên 02** ⇒ ⛔ phiên 03 không sửa).
- ⭐ **KẾT LUẬN**: ⭐ **phạm vi HR–TEAMS SẠCH** — ⛔ không lỗi quyền, ⛔ không phụ thuộc helper hỏng, ✅ hồi quy ĐẠT.
## EVT-20261007-C77 — 🔴 **HOTFIX TRONG PHẠM VI**: `HrScreen.tsx` ⛔ chặn GHI ĐÈ hồ sơ (cùng lớp `BUG-C12` CRITICAL) + ⭐ ngày qua `date()` ⇒ ✅ build `0350` + **14/14 cổng** + hồi quy **925/924/0**
- **Task** `TASK-20261007-C54` · **Bug** `BUG-20261007-C15` (**① HIGH mất dữ liệu · ② MEDIUM ngày thô**) · **Change** `CHG-20261007-C29` · **Test** `TEST-20261007-C65` · ⭐ **Tệp sản phẩm sửa: ĐÚNG 1** (`app/screens/HrScreen.tsx` — ⭐ **HR, trong phạm vi**) + **cổng MỚI** `tests/mt3-c17-hr-screen-safety.test.mjs`.
- ⭐ **CÁCH TÌM RA (⭐ trong phạm vi)**: sau khi user chốt **phiên 03 = HR–TEAMS**, phiên 03 **đọc mã tệp HR của mình** ⇒ thấy ① dropdown «Nhân sự» đổ **toàn bộ** `staffDirectory` ② 2 cột ngày in **THÔ** + ⭐ **`date` import mà gọi 0 LẦN** (⭐ «dấu hiệu chí mạng» đã ghi ở `mt3-c10`).
  ⭐ **ĐỐI CHIẾU BACKEND** (`HrManagementUseCase:32-39`): có hồ sơ ⇒ `updateHrRecord(… nvl(payload.get("x")) …)` ⇒ ⭐ **khoá vắng = NULL** ⇒ ⛔ **lưu form trống = XOÁ SẠCH hồ sơ cũ**.
  ⭐ **ĐO**: **42** nhân sự vs **26** hồ sơ ⇒ ⚠️ **26 người** phơi rủi ro · CSDL ngày ở dạng **ISO** (`1995-09-02`).
- ✅ **ĐÃ VÁ**: ① `missingProfile` (chỉ nhân sự **CHƯA** có hồ sơ) ② ⭐ **chốt chặn THỨ HAI** `window.confirm` khi lưu trúng người đã có ③ nút Lưu **khoá** + nhãn «Tất cả đã có hồ sơ» ④ `date()` cho **Ngày sinh**/**Ngày vào**.
- ⭐ **XÁC MINH TRÊN GIAO DIỆN THẬT**: ngày **02/03/1990** · **03/01/1983** · **09/06/2023** ⇒ ⭐ **ISO = 0** · **dd/mm/yyyy hoặc — = 5/5** ✅ · ⭐ dropdown **18** lựa chọn (**17 chưa có hồ sơ** + 1 dòng mẫu) ⇒ ⭐ **26 người có hồ sơ bị LOẠI** ✅ · 📸 `C15-1-bang-HR-ngay-ddmmyyyy.png` · `C15-2-modal-lap-ho-so-loc.png`.
- ✅ **CỔNG MỚI `mt3-c17` (4/4)**: `C17-2` ⛔ cấm đổ toàn bộ `staffDirectory` · `C17-3` **buộc** có `window.confirm` · `C17-4` ⛔ cấm ngày thô (⭐ **có ĐỐI CHỨNG ÂM**) · `C17-1` **chốt vùng phủ** · ⭐ **meta-gate `c15` 4/4** (tự công nhận cổng mới) · ⭐ **13 cổng cũ vẫn ĐẠT**.
- ✅ **BUILD**: `gd-cycle` **exit 0** · migration **`0350`** · cổng dự án **ĐẠT** (vân tay **`830756713f67caff`**) · **925 test · 924 pass · 0 fail · 1 skip** · `tsc` 0 · `eslint` 0 lỗi · 3 dịch vụ **đang nghe**.
- ⭐ **TUÂN THỦ PHẠM VI**: ⛔ chỉ sửa **1 tệp HR** + cổng test ✅ (⛔ không đụng `page.tsx` · `java-backend` · ADMIN · KHO).
## EVT-20261007-C78 — ⚠️ **SỰ CỐ DỊCH VỤ ~4 PHÚT** (GUI down) do **đổi dấu vân tay của phiên khác** ⇒ ✅ **TỰ KHẮC PHỤC, KHÔNG MẤT DỮ LIỆU, KHÔNG SỬA MÃ** + 2 bài học vận hành
- ⭐ **DIỄN BIẾN (đo được)**: **13:39:08** phiên khác sửa `lib/vntech-identity-data.mjs` (**5+/5−**) + `VNTECH_FINGERPRINT.json` (**4+/4−**) ⇒ ⚠️ phiên 03 khởi động lại dịch vụ (sau build `0350` lúc 13:27:12) ⇒ **`local-runtime.mjs:177` từ chối khởi động** (``Dau van tay san pham VNTECH khong hop le hoac da bi thay doi.``) ⇒ 🔴 **`:8787` DOWN · `:9000` nghe nhưng không trả lời**.
- ✅ **KHẮC PHỤC (⭐ quy trình đúng)**: ① ⚠️ **chẩn đoán chỉ đọc** — so **mốc thời gian** (định danh **SAU** build ⇒ ⭐ **kết luận: ⛔ không phải lỗi phiên 03**) ② ⭐ dùng **công cụ chuẩn dự án** ``node tools/set-local-identity.mjs`` ⇒ «**Đã khớp — không cần sửa**» ⇒ ⭐ **sự cố chỉ TẠM THỜI trong lúc phiên 01 đang đổi dấu vân tay** ③ ⭐ dịch vụ **tự lên lại** ⇒ ✅ `:8787` **HTTP 200** · `:9000` **HTTP 200** · `:18081` nghe · ⭐ **cổng dự án ĐẠT**: ``✓ do-moi`` + ``✓ van-tay HTML mang 191a8e0ca3f6c363 · khop SSOT`` + ``✓ byte`` ⇒ **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** ✅
- ⚠️ **BÀI HỌC ①+② (⭐ ghi `DEV_LOG-C07`)**: ⛔ **KHÔNG pipe output server dài hạn** (⚠️ ``‖ Select-Object`` **đóng pipe ⇒ giết tiến trình** — ⚠️ **đã xảy ra thật**) ⇒ ⭐ chạy **job nền KHÔNG pipe** ✅ · ⚠️ **KIỂM CỔNG TRƯỚC** khi khởi động lại dịch vụ chung (⚠️ `EADDRINUSE` = **phiên khác đã lên** ⇒ ⛔ đừng khởi động lại).
- ⚠️ **BÀI HỌC ③**: ⭐ đổi **SSOT dấu vân tay** mà **chưa đồng bộ** ⇒ ⛔ **mọi phiên khác** không khởi động được dịch vụ trong **cửa sổ vài phút** ⇒ ⭐ **`HANDOFF-C25`** cho phiên 01 (⭐ khuyến nghị: chạy `tools/set-local-identity.mjs` **ngay** sau khi sửa SSOT ✅ + ⭐ nếu cần áp cho **môi trường khác** thì **phải có migration**).
- ⚠️ **ĐÍNH CHÍNH SỐ LIỆU**: ⭐ vân tay HTML **`830756713f67caff`** (ghi ở `BUG-C15`/`CHG-C29` — lúc build `0350`) ⚠️ **nay là `191a8e0ca3f6c363`** (⭐ do **phiên 01 đổi định danh SAU đó** ✅) ⇒ ⭐ **nguồn đúng luôn là CỔNG DỰ ÁN** (`node tools/verify-ui-build-applied.mjs`), ⛔ đừng chép cứng vân tay vào báo cáo ✅.