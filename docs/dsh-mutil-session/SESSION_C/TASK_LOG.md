# TASK_LOG — SESSION_C (ERP-SESSION-03)

> Log QUAN TRỌNG NHẤT cho tiến độ — mỗi task 1 entry, đủ 13 trường.
> ID: `TASK-YYYYMMDD-CNN`. Status: OPEN | IN_PROGRESS | BLOCKED | FIXED | VERIFIED | DONE | CANCELLED.

---

## TASK-20261007-C01 — Hotfix FE: sửa CCCD ở modal «Sửa hồ sơ» không được báo lỗi trường tài khoản

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C01` |
| **Tên** | Modal «Sửa hồ sơ» → tab «Thông tin cá nhân» → sửa CCCD ⇒ hết lỗi «Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc» |
| **Category** | `HOTFIX` · `FRONTEND` |
| **Nguồn** | USER chỉ đạo trực tiếp 2026-10-07 (giai đoạn GO-LIVE, ưu tiên FE trước) |
| **Mô tả** | Tìm nguyên nhân + sửa để thao tác sửa CCCD (và mọi trường của tab «Thông tin cá nhân») lưu được bình thường |
| **Phạm vi tệp** | `app/screens/HrProfileEditModal.tsx` (sửa) · `tests/mt3-c03-hr-profile-edit.test.mjs` (**mới**) · `docs/dsh-mutil-session/SESSION_C/**` |
| **Liên kết bug** | `BUG-20261007-C01` |
| **Nguyên nhân** | FE gọi `update_user` với payload `{userId}` khi tab cá nhân đang mở (ô tài khoản rời DOM) ⇒ `fullName` rỗng ⇒ BE 400 |
| **Cách làm** | ① chỉ gọi `update_user` khi tab tài khoản thật sự được gửi; ② luôn gửi đủ trường bắt buộc (rỗng ⇒ lấy giá trị hiện có); ③ không đóng modal khi đồng bộ tài khoản thất bại + báo trung thực |
| **Kiểm chứng** | `npx tsc --noEmit` · `node --test tests/mt3-c03-hr-profile-edit.test.mjs` · `node --test tests/moc-96-105-no-regression.test.mjs` · `npm run test:regression` |
| **Status** | `FIXED` (chờ user nghiệm thu trên `:9000`) |
| **Ghi chú** | ⛔ Không sửa `java-backend/**` (thuộc phiên 01) — nợ kỹ thuật ghi ở `BUG_HOTFIX_LOG.md` §6 + `HANDOFF-20261007-C02` |

---

## TASK-20261007-C02 — Audit tab Tổ đội + lược bỏ thông tin thừa/rác khỏi các màn

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C02` |
| **Tên** | Audit `app/screens/TeamDirectory.tsx` — bỏ thông tin kỹ thuật (tên bảng/cột CSDL, khoá payload) đang in cho người dùng |
| **Category** | `UI_UX` · `FRONTEND` |
| **Nguồn** | USER chỉ đạo trực tiếp 2026-10-07 |
| **Mô tả** | Rà từng màn/tab của Tổ đội, phân loại **thông tin nghiệp vụ** (giữ) vs **rác kỹ thuật** (bỏ); giữ nguyên dữ liệu nghiệp vụ + quyền |
| **Phạm vi tệp** | `app/screens/TeamDirectory.tsx` (sửa phần RENDER) · `tests/tm01-team-list.test.mjs` (cập nhật 1 assertion theo yêu cầu mới) · `tests/mt3-c03-*.test.mjs` |
| **Tiền lệ áp dụng** | `TeamDirectory.tsx:458-462` — MỐC 116: **bỏ phần RENDER cột «Nguồn», ⛔ KHÔNG đụng `teamDetailTabs()[].source`** vì đó là DỮ LIỆU mà `tests/tm03` kiểm |
| **Status** | `IN_PROGRESS` |

### Phân loại RÁC cần bỏ (đo trên mã, có dòng)
| # | Vị trí | Nội dung đang in cho user | Loại |
|---|---|---|---|
| 1 | `TeamDirectory.tsx:472-480` | Card **«Nguồn dữ liệu của 6 tab»** — bảng 4 cột `Tab · Số dòng · Nguồn · Ghi chú` in tên bảng/cột CSDL | ⛔ RÁC (dev-only) |
| 2 | `TeamDirectory.tsx:665` | `<p data-team-source-notes="TM-01">` in `team_members…` · `stock_issues · material_returns…` · `teams WHERE active=1` | ⛔ RÁC |
| 3 | `TeamDirectory.tsx:523` | Note tab Kho: in `inventory[].balance · available · reserved` | ⛔ RÁC |
| 4 | `TeamDirectory.tsx:549,571` | Note tab Lịch sử: in `stock_issues.team_id + material_returns.team_id + audit_logs(…)` và `action issue_stock / return_stock` | ⛔ RÁC |
| 5 | `TeamDirectory.tsx:485,496,606` | Note/empty text in `payload bootstrap`, `scripts/system-route.mjs:756`, `BootstrapDataAdapter` | ⛔ RÁC |
| 6 | `TeamDirectory.tsx:511` | Note tab Dự án: `teams.project_id NOT NULL` | ⛔ RÁC |
| 7 | `TeamDirectory.tsx:585` | Note: `teamId trong payload luôn NULL… 0/4 phiếu` | ⛔ RÁC |
| 8 | `TeamDirectory.tsx:599` | Note: `audit_logs (entity_type='team') · team_settlements · team_subcontracts` | ⛔ RÁC |

### GIỮ (không phải rác)
- `TM-PURE` block (`:42-350`) — là **dữ liệu** cho 6 test hợp đồng, gồm `TEAM_LIST_COLUMNS`,
  `TEAM_TABS`, `teamDetailTabs().source`. ⛔ Không xoá (bài học MỐC 116).
- `:664` `data-team-sort-note="TM-02"` «ĐANG HOẠT ĐỘNG → hoạt động gần nhất ↓ → ngừng» — **quy tắc
  nghiệp vụ** cho người dùng + có test `tm02:101-104` kiểm nguyên văn ⇒ **GIỮ**.
- Nút «Xuất CSV» + `downloadCsv` (UTF-8/BOM) — tính năng thật, giữ.

---

## TASK-20261007-C03 — Audit UTF-8 toàn bộ nút xuất Excel/CSV + vá tệp mẫu thiếu BOM

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C03` |
| **Tên** | Rà mọi đường xuất Excel/CSV, thêm UTF-8 cho chỗ còn thiếu |
| **Category** | `UI_UX` · `BUGFIX` · `TESTING` |
| **Nguồn** | USER: *«Kiểm tra lại tất cả các nút xuất excel xem đã có UTF8 hay chưa nếu chưa có thì thêm vào (tôi test 1 số nút đang bị lỗi UTF8)»* |
| **Mô tả** | Lập bảng audit **13 đường xuất**, xác định đường nào thiếu UTF-8, vá và dựng cổng chống tái phát |
| **Phạm vi tệp** | `public/templates/*.csv` (2 tệp · thêm BOM) · `tests/mt3-c03-export-utf8.test.mjs` (**mới**) |
| **Liên kết bug** | `BUG-20261007-C02` |
| **Kết quả** | **2/13 đường LỖI** (đều là **tệp mẫu CSV tĩnh thiếu BOM**) — 11 đường còn lại ĐẠT (xem bảng ở `DEV_LOG.md` §C03) |
| **Kiểm chứng** | `node --test tests/mt3-c03-export-utf8.test.mjs` **5/5 PASS** · **đối chứng âm ĐỎ đúng thiết kế** · `test:regression` **816 test · 815 pass · 0 fail** · `tsc` 0 · `eslint` 0 · LIVE 2 cổng 200 + **CSV phục vụ đã có BOM** |
| **Status** | `FIXED` (chờ user nghiệm thu) |
| **Ghi chú** | ⚠️ `dist/client/templates/*.csv` **vẫn là bản CŨ** cho tới khi build lại ⇒ đã chạy `gd-cycle` (xem `EVENT_LOG` §C12) |

---

## TASK-20261007-C04 — Trạng thái đơn/phiếu toàn hệ thống hiển thị TIẾNG VIỆT

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C04` |
| **Tên** | Hợp nhất bảng nhãn trạng thái + dịch mã chữ HOA + bịt các nhánh rò mã thô |
| **Category** | `UI_UX` · `BUGFIX` |
| **Nguồn** | USER: *«Hiển thị trạng thái của tất cả các đơn - phiếu … (Hiện tại 1 số nơi hiển thị tiếng Anh)»* — MT3 §IV.6 |
| **Mô tả** | Đo hành vi thật → tìm **4 nguyên nhân gốc** → hợp nhất về MỘT bảng nhãn → cổng chống tái phát |
| **Phạm vi tệp** | `lib/status-labels.ts` · `lib/labels.ts` · `lib/report-catalog.ts` · `app/components/ui/StatusBadge.tsx` · `app/screens/{Delivered,Purchasing,ProjectDetailTabs}.tsx` · `tests/mt3-c04-status-vi.test.mjs` (**mới**) · `tests/v215-…` (2 assertion theo yêu cầu mới) |
| **Liên kết bug** | `BUG-20261007-C03` |
| **Kết quả** | **4 nguyên nhân gốc đã bịt**: ① bảng chung thiếu 15 mã ② StatusBadge không dịch mã CHỮ HOA ③ `lib/labels.ts` rò mã thô (kể cả vào TỆP XUẤT) ④ bản `statusLabel` thứ ba ở `lib/report-catalog.ts` ⑤ ô lọc dựng nhãn từ mã thô |
| **Kiểm chứng** | cổng mới **7/7 PASS** · `test:regression` **823 test · 822 pass · 0 fail · 1 skip** · `tsc` 0 · `eslint` 0 error · **LIVE**: bundle `:9000` chứa **8/8 nhãn tiếng Việt** + chốt chữ HOA |
| **Status** | `FIXED` (chờ user nghiệm thu) |
| **Ghi chú** | ⚠️ Tồn đọc lại **nêu thẳng**: 2 bảng nhãn PR/PO ở `Purchasing.tsx` giữ lại **có lý do** (nhãn PR ≠ PO; đã có fallback chung) · `priority` còn in mã thô — **ngoài phạm vi** trạng thái, để task sau |

---

## TASK-20261007-C05 — Hết mã tiếng Anh ở trường ƯU TIÊN và LOẠI CON DẤU

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C05` |
| **Tên** | Hợp nhất nhãn `priority` + `seal_type` về nguồn dùng chung; vá 4 màn còn in mã thô |
| **Category** | `UI_UX` · `BUGFIX` |
| **Nguồn** | Nối tiếp yêu cầu user «1 số nơi hiển thị tiếng Anh»; chính tôi ghi nhận tồn đọc lại ở `TASK-20261007-C04` |
| **Mô tả** | ĐO tập giá trị thật của 8 trường enum → xác định trường nào LƯU TIẾNG VIỆT (⛔ không lỗi) vs LƯU MÃ ANH (lỗi) → vá |
| **Phạm vi tệp** | `lib/status-labels.ts` · `app/screens/{ProjectDetailTabs,SealScreen,Requests,WorkCenter}.tsx` · `tests/mt3-c04-status-vi.test.mjs` (thêm 3 ca) · `tests/v215-…` (1 assertion) |
| **Liên kết bug** | `BUG-20261007-C04` |
| **Kết quả** | ✅ **2 trường LƯU MÃ ANH** (`work_items.priority`, `seals.seal_type`) ⇒ đã hợp nhất nhãn + vá 5 chỗ hiển thị · ⛔ **6 trường LƯU TIẾNG VIỆT** (`benefitType` · `docType`×2 · `contractType` lao động · `costType`) ⇒ **KHÔNG sửa** (⛔ tránh đổi nhầm chữ đã đúng) |
| **Kiểm chứng** | cổng C04 **10/10 PASS** (thêm 3 ca, gồm **đối chứng dương**: `critical` ⛔ không được hiện «Thường») · `test:regression` **826 test · 825 pass · 0 fail** · `tsc` 0 · `eslint` 0 error |
| **Status** | `FIXED` (chờ user nghiệm thu) |
| **Ghi chú** | ⭐ Phát hiện kèm: ternary ở `WorkCenter` **sót `critical`** ⇒ việc KHẨN CẤP từng hiện «Thường» — nay hết |

---

## TASK-20261007-C06 — Hết mã thô Ưu tiên ở ĐƯỜNG XUẤT TỆP + mở rộng cổng sang `lib/**`

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C06` |
| **Tên** | Vá bản dịch Ưu tiên thứ 5 (`lib/request-export.ts`) và thứ 6 (`RequestDrawer`) — lớp lỗi rò mã thô vào tệp xuất |
| **Category** | `UI_UX` · `BUGFIX` · `TESTING` |
| **Nguồn** | Vòng 4 tôi ⛔ **chỉ quét `app/screens/**`** nên **bỏ sót `lib/**`** — chính tôi ghi tồn đọc lại; vòng này bịt đúng lỗ hổng đó |
| **Mô tả** | Mở rộng cổng C04 sang `app/**` + `lib/**` → cổng **bắt được 3 chỗ mới**: `lib/request-export.ts` (đường XUẤT PDF/XLSX) · `RequestDrawer.tsx` · `app/page.tsx` (thuộc phiên 01) |
| **Liên kết bug** | `BUG-20261007-C05` |
| **Kết quả** | ✅ Vá 2 chỗ **trong quyền phiên 03** (đường xuất tệp + ô «Mức độ» của drawer) · ⛔ `app/page.tsx` **KHÔNG sửa** — ghi `HANDOFF-20261007-C05`, và đưa vào cổng dưới dạng **NỢ ĐÃ GIAO có tên** (in ra mỗi lần chạy, ⛔ không miễn trừ trắng) |
| **Kiểm chứng** | cổng C04 **11/11 PASS** (thêm 1 ca quét `lib/**`, có miễn trừ **duy nhất** cho `KANBAN_PRIORITIES` — đã bị ca ⑨ kiểm chống lệch nhãn) · `test:regression` **827 test · 0 fail** sau khi build · `tsc` 0 · `eslint` 0 error |
| **Status** | `FIXED` (chờ user nghiệm thu) |
| **Ghi chú** | ⚠️ Lượt hồi quy **TRƯỚC khi build** đỏ **2 ca `v217-4/217-5`** (cổng `verify-ui-build-applied` báo **«dist/ CŨ HƠN nguồn»**) — ⭐ **đúng như thiết kế**: sửa `lib/**` mà chưa `gd-cycle` thì cổng của chính dự án phải báo. ⇒ bài học: **build là BẮT BUỘC sau mỗi lần sửa mã nguồn**, ⛔ không phải tuỳ chọn |

---

## TASK-20261007-C07 — Chuẩn hoá `WEEKLY_REPORT_DATA` theo §14 + ĐÍNH CHÍNH mốc thời gian

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C07` |
| **Tên** | Đưa dữ liệu báo cáo tuần của phiên 03 về **đúng hợp đồng §14** (17 mục) và đính chính mốc giờ sai |
| **Category** | `DOCUMENTATION` |
| **Nguồn** | Goal §14 («Mỗi `WEEKLY_REPORT_DATA.md` phải có section tương ứng») + §8 (chuẩn hoá `YYYY-MM-DD HH:mm:ss`) + §22 «nếu log không khớp thực tế thì **sửa log theo thực tế**» |
| **Mô tả** | ① Dựng **PHẦN A — 17 mục chuẩn hoá** ở đầu tệp, ⛔ **KHÔNG xoá** dữ liệu cũ (giữ nguyên thành **PHẦN B phụ lục**, có ghi rõ «số tại thời điểm đó»); ② Đo lại mốc thời gian thật và **đính chính** |
| **Phạm vi tệp** | `docs/dsh-mutil-session/SESSION_C/WEEKLY_REPORT_DATA.md` · `EVENT_LOG.md` (khối đính chính) · `HANDOFF_LOG.md` (`HANDOFF-20261007-C06`) |
| **Kết quả** | ✅ `SESSION_C` nay **17/17 mục** §14 · ✅ Đo **3 phiên**: `SESSION_B` **0/17 thiếu** · `SESSION_C` **0/17 thiếu** · ⛔ **`SESSION_A` thiếu 6/17** ⇒ **handoff**, ⛔ không sửa tệp phiên khác |
| **⛔ TỰ NHẬN SAI SÓT** | Các tiêu đề vòng ở nhiều tệp log ghi `(2026-10-07 18:xx … 21:xx)` — ⛔ **SAI**: tôi tự suy mốc giờ theo cảm nhận, ⛔ **không đọc đồng hồ**. **ĐO LẠI**: phiên bắt đầu **16:54:34**, viết đính chính lúc **17:35:27** ⇒ **cả phiên chỉ ~41 phút**. ⇒ Nguồn sự thật về thời gian = **thứ tự sự kiện + mtime tệp**; ⛔ **không tự suy mốc giờ** (bài học ghi vào `EVENT_LOG` §ĐÍNH CHÍNH). |
| **Kiểm chứng** | `node tools/verify-ui-build-applied.mjs` **ĐẠT** («BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT» — vòng này ⛔ **chỉ sửa `docs/**`** nên **KHÔNG cần `gd-cycle`**, ⛔ không làm gián đoạn 2 cổng dùng chung) |
| **Status** | `DONE` |

---

## TASK-20261007-C08 — Cổng hợp đồng §22/§11: KHOÁ kích thước tab-trong-modal (⛔ KHÔNG sửa thứ đang đúng)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C08` |
| **Tên** | Dựng cổng hợp đồng bảo vệ bất biến §22 «tab trong modal nhất quán» + §11 «tab trong modal chia đều» |
| **Category** | `UI_UX` · `TESTING` |
| **Nguồn** | Goal §22 (UI/UX focus) + yêu cầu user trong MT3 («các tab trong cùng một modal phải có kích thước nhất quán») |
| **Mô tả** | ⛔ **KHÔNG sửa CSS**: đo trước, thấy các bất biến **ĐANG ĐÚNG** ⇒ chuyển sang **KHOÁ chúng bằng cổng** để chặn hồi quy **và** chặn báo động giả cho phiên sau |
| **Phạm vi tệp** | `tests/mt3-c05-modal-tab-sizing.test.mjs` (**MỚI**, 8 ca) — ⛔ **0 dòng CSS/mã sản phẩm bị đổi** |
| **Kết quả ĐO ĐƯỢC (nguồn: `app/styles/canonical.css`)** | ① `.edm-tabs { flex: 0 0 auto; flex-wrap: wrap }` ⇒ dải **CỐ ĐỊNH** kích thước ✅ ② `.edm-tabs button { flex: 1 1 auto; min-width: 0 }` ⇒ **MỐC 115 CỐ Ý** (basis `auto` để còn wrap) ✅ ③ `.edm-tabs button.is-active` **chỉ đổi MÀU/ĐỘ ĐẬM** + tab thường đã có `border-bottom: 2px solid transparent` ⇒ **chiều cao ⛔ KHÔNG nhảy** khi đổi tab ✅ ④ `.edm-body { min-height: 120px }` ⇒ tab NGẮN ⛔ không làm modal tụt chiều cao ✅ ⑤ `.entity-detail-modal { max-height: min(88vh,1000px) }` + `.modal>header { min-height }` ✅ ⑥ bản vá §11 (`.modal .project-scope-tabs > button, .modal .user-admin-tabs > button { flex: 1 1 0; min-width: 0 }`) **CÓ MẶT** ✅ ⑦ dải CẤP TRANG vẫn `flex: 0 0 auto` («ôm sát nhãn» — MỐC 119b) ✅ |
| ⭐ **VÌ SAO ⛔ KHÔNG SỬA** | Repo **đã ghi 4 lần** cái bẫy này (`TASK-156` · `TASK-212` · `TASK-213` · `TASK-214`); `CHECKLIST.md` ghi «…**lần thứ 7** tôi suýt "sửa" thứ đang đúng» + **2 BÁO ĐỘNG GIẢ** vì **áp MỘT thước đo lên NHIỀU họ component**. `canonical.css` ghi nguyên văn **«⛔ KHÔNG đụng `.edm-tabs`»** (quyết định user MỐC 115). ⇒ Sửa vào là **phá thiết kế đã được duyệt** (Goal §41 + §12). |
| **Kiểm chứng** | cổng mới **8/8 PASS** · `eslint` **0** · `test:regression` **835 test · 834 pass · 0 fail · 1 skip** · ⭐ **XÁC MINH LIVE**: CSS đang phục vụ (`/assets/index-BjTKD8Zf.css`, **393.497 ký tự**) **CÓ** rule §11, **CÓ** `.edm-tabs button`, **CÓ** `.edm-body … min-height` ⇒ ⛔ `.edm-tabs` **không bị đụng** |
| **Status** | `DONE` |
| **Ghi chú** | ⚠️ Vòng này **chỉ thêm tệp trong `tests/**`** ⇒ `node tools/verify-ui-build-applied.mjs` **ĐẠT** («BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT») ⇒ ⛔ **không cần `gd-cycle`**, ⛔ không gián đoạn `:8787`/`:9000` |

---

## TASK-20261007-C09 — Tệp xuất «Đơn hàng đã giao»: cột CO/CQ + giấy giao hàng hết mã tiếng Anh

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C09` |
| **Tên** | Hợp nhất nhãn `certificate_status` + `delivery_document` về nguồn dùng chung; vá 2 đường xuất tệp còn in mã thô |
| **Category** | `UI_UX` · `BUGFIX` · `TESTING` |
| **Nguồn** | Nối tiếp lớp lỗi «mã enum rò vào TỆP XUẤT» (vòng 5 đã vá `priority`; vòng này rà tiếp các đường xuất còn lại) |
| **Mô tả** | Đọc `lib/supply-docs.tsx` + `lib/request-export.ts` + `lib/ui-shared.tsx` ⇒ tìm chỗ còn đưa MÃ THÔ vào tệp người dùng tải về |
| **Phạm vi tệp** | `lib/status-labels.ts` (+2 domain) · `lib/request-export.ts` (uỷ quyền) · `lib/ui-shared.tsx` (`deliveredExportRows`) · `tests/mt3-c04-status-vi.test.mjs` (+2 ca) |
| **Liên kết bug** | `BUG-20261007-C06` |
| **Kết quả ĐO ĐƯỢC** | ✅ Vá **2 đường xuất**: ① `exportDeliveredXlsx` ② `exportDeliveredCsv` (cùng dùng `deliveredExportRows`) — 2 cột «Chứng chỉ / CO-CQ» và «Giấy giao hàng» nay hiện **«Đã có»/«Chưa có»/«Không yêu cầu»** thay vì `complete`/`missing`/`not_required` ✅ Hợp nhất bản dịch trùng lặp ở `lib/request-export.ts` (đường xuất PO/GRN) về **cùng 1 nguồn** |
| **Kiểm chứng** | cổng C04 **13/13 PASS** (thêm 2 ca, gồm **đối chứng âm**: ⛔ không được truyền thẳng `row.certificateStatus`) · `tsc` **0** · `eslint` **0 error** (3 warning `<img>` **có sẵn**) · `test:regression` + **xác minh LIVE** (ghi ở `TEST_LOG` §C09) |
| **Status** | `FIXED` (chờ user nghiệm thu) |
| **Ghi chú** | ⚠️ Sửa `lib/**` ⇒ **`gd-cycle` BẮT BUỘC** (luật đã trả giá 2 lần) — đã dừng **đúng PID** rồi build |

---

## TASK-20261007-C10 — Audit CHỐT 2 yêu cầu giao diện: (a) mã enum trong TỆP XUẤT · (b) nút chức năng 1 hàng ngang

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C10` |
| **Tên** | Chốt bằng ĐO ĐẠC: lớp lỗi «mã enum rò vào tệp xuất» đã sạch + cổng toolbar ngang chỉ còn **1 báo động GIẢ** đã chứng minh |
| **Category** | `UI_UX` · `TESTING` |
| **Nguồn** | 2 yêu cầu trực tiếp của user trong MASTER TASK 3: *«Kiểm tra lại tất cả các nút xuất excel… UTF8»* (đã làm ở `C03`) và *«các nút chức năng CRUD … sắp xếp lại thành 1 hàng ngang»* |
| **Phạm vi tệp** | ⛔ **0 tệp mã sản phẩm** — chỉ ĐO + ghi sổ (log + shared state) |
| **Kết quả (a) — TỆP XUẤT** | Quét **toàn bộ** hàm dựng bản ghi xuất trong `lib/**`: `deliveredExportRows` (đã vá `C09`) · `inventoryExportRows` · `paymentExportRows` ⇒ **`inventoryExportRows` và `paymentExportRows` ⛔ KHÔNG có cột enum** (chỉ mã/tên/ĐVT/kho/dự án/số/ngày/người) ⇒ ⭐ **lớp lỗi «mã enum trong tệp xuất» đã SẠCH trong phạm vi phiên 03** |
| **Kết quả (b) — TOOLBAR NGANG** | Chạy **cổng của chính dự án** `node tools/probe-toolbar-vertical.mjs`: **14/16 màn = 0 khối nhiều hàng**; chỉ 2 màn báo 8 khối — và **cả 8 đều là MỘT họ** `.supplier-admin-row` |
| ⭐ **CHỨNG MINH BÁO ĐỘNG GIẢ** | Đo trực tiếp bằng công cụ của dự án `node tools/measure-supplier-row.mjs` ⇒ `.supplier-admin-row`: `beCao 44` · `display: grid` · **`autoFlow: column`** · `soCon 12` · các ô mẫu **cùng toạ độ `@603`** ⇒ ⭐ **12 ô nằm TRÊN MỘT DÒNG THẬT** (44px = đúng 1 hàng). ⇒ ⛔ **KHÔNG phải "nút chức năng xếp hàng dọc"** mà là **hàng DỮ LIỆU nhà cung cấp** (mỗi dòng là 1 `<form className="supplier-admin-row">`) ⇒ ⛔ **KHÔNG sửa** |
| ⭐ **BỐI CẢNH ĐÃ ĐO TRƯỚC ĐÓ (không lặp lại việc cũ)** | `MT2` **đã sửa** họ này: `.supplier-admin-row` **1182×85 (3 hàng) → 1182×59** (ghi ở `tools/mt3-write-checklist-0928.mjs:52` + `tools/toolbar-horizontal-20260928.css:20`) ⇒ nay **44px** ⇒ **tốt hơn**, ⛔ không có hồi quy |
| **Kết luận** | ✅ Yêu cầu «nút CRUD 1 hàng ngang» **ĐẠT trên 14/16 màn** đo được · ✅ 2 màn còn lại là **hàng dữ liệu 1 dòng thật** (đo được), ⛔ **không phải khuyết điểm** |
| **Trạng thái** | `DONE` (⛔ không sửa mã; ⛔ không cần `gd-cycle`) |
| **Đề xuất (⛔ chưa làm — `tools/**` là mã dùng chung)** | Cổng `probe-toolbar-vertical.mjs` nên **bỏ qua `auto-flow: column`** (grid hàng dữ liệu) ⇒ tránh sinh **báo động giả** lần nữa cho phiên sau — ghi `HANDOFF-20261007-C07` |

---

## TASK-20261007-C11 — Phát hiện **cổng RESPONSIVE XANH RỖNG** + đo bù số liệu ở 375px

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C11` |
| **Tên** | Chứng minh `tools/probe-responsive-5widths.mjs` kết luận **ĐẠT mà ⛔ chưa hề đo** tab/modal/toolbar; đo bù bằng probe tạm |
| **Category** | `TESTING` · `UI_UX` |
| **Nguồn** | Yêu cầu user **«Đảm bảo responsive … nhiều kích thước màn hình»** (MT3 §IV.2) — cổng là bằng chứng DUY NHẤT |
| **Phạm vi tệp** | ⛔ **0 tệp sản phẩm** · ⛔ **0 tệp `tools/**` bị sửa** — chỉ ĐO + ghi sổ · `tests/` ⛔ không đổi |
| **Bằng chứng** | ① Chạy cổng **3 lần** (không nhãn · «Phiếu đề nghị mua hàng» · «Quản lý dự án») ⇒ **kết quả Y HỆT**, mọi dòng `tab cuộn=null · modal=— · toolbar 0 nút/0 hàng` = **⛔ chưa đo gì**; ② nhưng vẫn in **«✅ ĐẠT … tab cuộn ngang · modal vừa khung · toolbar không vỡ cột dọc»** |
| **Root cause (có dòng)** | ① `probe-responsive-5widths.mjs:159-161` 3 phép kiểm **có điều kiện** ⇒ thiếu mục tiêu ⇒ ⛔ không ghi vấn đề ⇒ ĐẠT; ② `:126-139` chọn menu **thất bại im lặng**; ③ `:164` in cứng 4 tiêu chí ⛔ không gắn với số đo |
| **Đo BÙ (đã làm)** | Script tạm ở 375px (⛔ **đã xoá** sau khi chạy) trên 10 mục menu đầu ⇒ ✅ **`tràn = 0px` ở mọi màn**; ✅ **modal chi tiết = 375×900 ĐÚNG khung** (⛔ không vượt `vw`/`vh`); ✅ toolbar trong modal 1 nút/1 hàng · ⛔ **dải `.edm-tabs` CHƯA đo được** ⇒ ⭐ **không coi là đã đạt** |
| **Hệ quả** | ⛔ **Không được dùng cổng responsive làm bằng chứng «responsive ĐẠT»** cho tới khi vá ⇒ giao **`HANDOFF-20261007-C08`** (⛔ thuộc `tools/**`) |
| ⭐ **Bài học** | **Lần thứ 3 trong phiên**: công cụ/báo cáo **nói quá số đo**. Luật chung đã ghi vào `SHARED_STATE` §34: **thiếu mục tiêu phải là `SKIP`/`BLOCKED`, ⛔ KHÔNG phải `ĐẠT`** |
| **Trạng thái** | `DONE` (⛔ không sửa mã; ⛔ không cần `gd-cycle`) |

---

## TASK-20261007-C12 — Modal «Chi tiết đơn giao hàng»: 2 khối «Ảnh giao hàng» + «Chứng chỉ/Tài liệu» bị **CẮT**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C12` |
| **Tên** | Vá lỗi bố cục modal: thân modal không giãn/không cuộn ⇒ nội dung cuối bị `overflow:hidden` CẮT mất |
| **Category** | `UI_UX` · `BUGFIX` |
| **Nguồn** | ⭐ **LỖI USER ĐÃ BÁO trong MASTER TASK 3** (§V-E «Đơn hàng đã giao»): *«Modal chi tiết giao hàng đang hiển thị sai, mục **Ảnh và hồ sơ giao hàng** đang bị **ẩn** đi không hiển thị đầy đủ»* |
| **Phạm vi tệp** | `app/screens/ReceiptDrawer.tsx` (**1 dòng class**) · `tests/mt3-c06-modal-body-scroll.test.mjs` (**MỚI**, 4 ca) |
| **Liên kết bug** | `BUG-20261007-C07` |
| ⭐ **ROOT CAUSE (ĐO ĐƯỢC)** | Khung là `.modal` (flex column, `overflow:hidden`) nhưng thân dùng **`.drawer-body`** — lớp của `.drawer`, ⛔ **KHÔNG có `flex:1 1 auto`**, ⛔ **KHÔNG có `min-height:0`**. Đo (Chrome headless 1440×900): `.receipt-modal` `h=768 overflow=hidden` · `.drawer-body` `h=568` **`flex:"0 1 auto"`** **`min-height:"auto"`** · khối CUỐI `bottom=707 > đáy thân 669` ⇒ **38px BỊ CẮT**; ⚠️ `clientH == scrollH = 568` ⇒ ⛔ **không có gì để cuộn** ⇒ phần bị cắt **KHÔNG THỂ TỚI** |
| **BẢN VÁ** | Ghép thêm lớp **`modal-body`** (`<div className="drawer-body modal-body">`) ⇒ thân **giãn hết khung + cuộn nội bộ**; giữ `drawer-body` để ⛔ không mất `display:grid; gap:14px` |
| ⭐ **PHẠM VI ẢNH HƯỞNG (đo được)** | Quét **toàn bộ** `app/**` + `lib/**`: **CHỈ DUY NHẤT `ReceiptDrawer.tsx`** ghép `.modal` với thân `.drawer-body` trần ⇒ lỗi **khu trú đúng modal user báo** |
| ⛔ **KHÔNG SỬA** | ⛔ không xoá 2 khối (cổng C06-3 khoá) · ⛔ không đụng `globals.css`/`canonical.css` (CSS dùng chung) · ⛔ không đổi dữ liệu/hành vi |
| **Kiểm chứng** | cổng C06 **4/4 PASS** · `tsc` 0 · `eslint` 0 · `gd-cycle` lần 7 **ĐẠT** · **ĐO LẠI LIVE sau build** (ghi ở `TEST_LOG` §C12) |
| **Status** | ⚠️ **`OPEN`** — ⛔ **CHƯA chứng minh được** lỗi user (không tái hiện). Chi tiết + tự đính chính: `BUG_HOTFIX_LOG.md` §«ĐÍNH CHÍNH BUG-20261007-C07» |
| **Kết luận trung thực** | Bản vá **có hiệu lực CSS** (`flex: 1 1 auto` · `min-height: 0px` ✅) nhưng **bố cục KHÔNG đổi** (thân vẫn `h=568`, `scrollH == clientH`, 2 khối user báo vẫn **nằm trong** khung) ⇒ giữ như **GIA CỐ**, ⛔ **không** coi là đã sửa lỗi ⇒ chờ user cho **bước tái hiện** (màn/đường đi · kích thước cửa sổ · ảnh chụp · có nhiều tệp hay không) |

---

## TASK-20261007-C13 — Khu vực «Ảnh và hồ sơ giao hàng»: chạy cổng dự án ⇒ phát hiện ca **D2 ĐỎ OAN**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C13` |
| **Tên** | Đo đường ống `/api/files` + panel ảnh; phân định ca `D2` là **lỗi thật** hay **cổng khớp chuỗi cứng** |
| **Category** | `TESTING` · `UI_UX` |
| **Nguồn** | Nối tiếp `BUG-20261007-C07` (user: *«mục Ảnh và hồ sơ giao hàng bị ẩn…»*) — điều tra **giả thuyết panel RỖNG** |
| **Phạm vi tệp** | `tests/mt3-c07-attachment-imgs.test.mjs` (**MỚI**, 2 ca) — ⛔ **0 tệp sản phẩm** · ⛔ **0 tệp `tools/**`** |
| **Kết quả ①** | Chạy cổng dự án `probe-task075-attachments.mjs`: **21/22 ĐẠT · HỎNG duy nhất `D2`** — ⚠️ các ca **đường ống đều ĐẠT**: API danh sách trả tệp · tải tệp **trùng từng byte** · đúng chữ ký PNG · không cookie ⇒ **401** · đối chứng dữ liệu hỏng |
| **Kết quả ② (ĐO LẠI)** | ⭐ **`D2` ĐỎ OAN**: cổng đòi khớp **nguyên văn** `src={`/api/files?id=${encodeURIComponent(file.id)}`}` ≥2 lần → trong `lib/ui-shared.tsx` chuỗi đó **0 lần**, NHƯNG `/api/files?id=${encodeURIComponent(` xuất hiện **6 lần**, trong đó **3 là thẻ `<img>`** (dải ảnh `(id)` · ô thu nhỏ `String(file.id)` · xem trước `String(preview.id)`) ⇒ **ý nghĩa ca đã thoả** |
| ⛔ **KHÔNG SỬA** | ⛔ **không** đổi mã sản phẩm cho vừa chuỗi của cổng (luật đã rút ra ở vòng 7/9/11) · ⛔ **không** sửa `tools/**` (tệp dùng chung) |
| **Cổng MỚI của phiên 03** | `tests/mt3-c07-attachment-imgs.test.mjs` — khoá **ĐÚNG ý nghĩa** bằng bộ khớp **dung sai có chủ ý** (≥2 `<img>` trỏ endpoint) + ghi lại **đối chứng âm** (chuỗi cổng cũ = 0) ⇒ ⛔ không ai đổi mã cho vừa chuỗi; khoá thêm hợp đồng panel (`mimeType` · báo lỗi tải · đánh dấu ảnh hỏng · dải ảnh · nạp lại) |
| **Kiểm chứng** | cổng C07 **2/2 PASS** · `eslint` 0 · cổng dự án `verify-ui-build-applied` **ĐẠT** (⛔ chỉ thêm `tests/**` ⇒ ⛔ không cần `gd-cycle`) |
| **Status** | `DONE` |
| ⚠️ **KHÔNG kết luận gì về `BUG-20261007-C07`** | Chính cổng dự án ghi **GIỚI HẠN: «KHÔNG đo phần render của UI»** ⇒ ⛔ **không** dùng kết quả này để đóng lỗi user; `BUG-20261007-C07` **vẫn `OPEN`**, chờ **bước tái hiện** |

---

## TASK-20261007-C14 — ⭐ **TÁI HIỆN + SỬA** lỗi user: khối trong modal «Chi tiết đơn giao hàng» bị **GRID CO rồi CẮT**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C14` |
| **Tên** | Vá `BUG-20261007-C07`: chặn grid co hàng ⇒ hiện đủ «Ảnh và hồ sơ giao hàng» + «Chứng chỉ / Tài liệu đã tải lên» |
| **Category** | `UI_UX` · `BUGFIX` |
| **Nguồn** | ⭐ **LỖI USER ĐÃ BÁO** (MASTER TASK 3 §V-E) — ⚠️ **không** theo checklist MT (user tuyên bố MT3 đã rollback; nay chỉ HOTFIX GO-LIVE) |
| **Phạm vi tệp** | `app/screens/ReceiptDrawer.tsx` (**1 thuộc tính inline**) · `tests/mt3-c08-modal-grid-clip.test.mjs` (**MỚI**, 3 ca) |
| ⭐ **ĐỔI CÁCH ĐO ⇒ TÁI HIỆN ĐƯỢC** | Lần trước đo **hình học khối CHA** ⇒ ⛔ không thấy lỗi. Lần này đo **`scrollHeight` vs `clientHeight` CỦA CHÍNH TỪNG KHỐI** ⇒ **7/8 khối bị CẮT**: cao **49,2031px** mà nội dung **231–294px**; `gridTemplateRows` giải ra 8 hàng **~49px** (bị ÉP vừa khung 568px); thân `scrollHeight == clientHeight == 568` ⇒ ⛔ **không có thanh cuộn** |
| **ROOT CAUSE** | `.drawer-section { overflow:hidden }` ⇒ theo chuẩn CSS **kích thước tối thiểu tự động = 0** ⇒ hàng `auto` trong grid có **chiều cao xác định** bị **CO xuống vừa khung** ⇒ cắt nội dung; vì grid không tràn nên `.drawer-body { overflow:auto }` ⛔ **không sinh thanh cuộn** ⇒ nội dung bị cắt **KHÔNG THỂ TỚI** (đúng nguyên văn user báo) |
| **BẢN VÁ** | Thân modal thêm **`style={{ gridAutoRows: "max-content" }}`** ⇒ hàng lấy **đúng chiều cao NỘI DUNG** ⇒ thân tràn ⇒ `.modal-body { overflow-y:auto }` sinh **thanh cuộn thật** |
| ⛔ **KHÔNG ĐỤNG** | ⛔ **KHÔNG** sửa `app/globals.css` · ⛔ **KHÔNG** sửa `app/styles/canonical.css` (CSS **DÙNG CHUNG** — ⭐ theo **cảnh báo của user về conflict** giữa 3 phiên đang chạy) · ⛔ không xoá khối nào |
| **ĐO LẠI SAU VÁ** | «Ảnh và hồ sơ giao hàng» **49 → 279px** (nội dung 277) · «Chứng chỉ / Tài liệu đã tải lên» **49 → 279** · «Ảnh giao hàng» **49 → 279** · Đối chiếu PO **49 → 296** · Lịch sử giao nhận **49 → 233** · ⭐ **`conCat = []` = 0 khối còn bị cắt** ✅ |
| **Kiểm chứng** | cổng C08 **3/3** · `tsc` 0 · `eslint` 0 · `test:regression` **846 test · 845 pass · 0 fail · 1 skip** · `gd-cycle` lần 8 **ĐẠT** (vân tay **`VNTECH-FP-AF5B84E9A7B25888`**, 732 files) · cổng dự án **exit 0** · `:8787`/`:9000` **200** |
| **Status** | ✅ `FIXED` — ⏳ **chờ USER nghiệm thu** ⇒ mới lên `VERIFIED` |
| ⭐ **BÀI HỌC (lần 5)** | **ĐO SAI CHỈ SỐ = KẾT LUẬN SAI**: dấu hiệu **CẮT nằm Ở TRONG khối** (`scrollHeight`/`clientHeight`), ⛔ **không** ở toạ độ khối cha |
| ⏳ **TỒN** | Rà cùng cơ chế cho các thân `.drawer-body` (grid) trong **`.drawer`** — cổng `C08-2` hiện chỉ phủ trường hợp `.modal` (đề xuất vòng sau) |

---

## TASK-20261007-C15 — Quét **toàn bộ** lớp lỗi «grid co hàng ⇒ cắt nội dung» + làm **chính xác** cổng C08 (chống báo động giả)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C15` |
| **Tên** | Đóng **lớp lỗi** của `BUG-20261007-C07`: xác minh hình dạng nào NGUY HIỂM, hình dạng nào AN TOÀN; sửa cổng cho đúng hình dạng |
| **Category** | `TESTING` · `UI_UX` |
| **Phạm vi tệp** | `tests/mt3-c08-modal-grid-clip.test.mjs` (3 → **4 ca**) — ⛔ **0 tệp sản phẩm** · ⛔ **0 tệp CSS** · ⛔ **0 tệp `tools/**`** |
| **① Quét tĩnh** | Toàn bộ `app/**` + `lib/**`: chỉ **2** tệp dùng thân `.drawer-body` (grid): `ReceiptDrawer.tsx` (**đã vá vòng 13**, có chặn co hàng) và `PurchaseOrderDrawer.tsx` (⛔ **chưa** có chặn). |
| **② Đo LIVE tệp thứ 2** | Mở «Chi tiết đơn mua» qua nút `data-vntech="grn-source-po-open"`: khung là **`.modal entity-detail-modal`** · thân **`.edm-body`** `display:block` · **`scrollHeight=1985 / clientHeight=683`** ⇒ **cuộn được** · các khối: 63px và **1902px**, `scrollHeight == clientHeight` ⇒ ⭐ **`conCat = []` — ⛔ 0 khối bị cắt** ⇒ **AN TOÀN** |
| ⭐ **KẾT LUẬN VỀ LỚP LỖI** | **HÌNH DẠNG NGUY HIỂM** = `.drawer-body` (grid) là **CON TRỰC TIẾP** của khung có **CHIỀU CAO XÁC ĐỊNH** (`.modal { max-height }` / `.drawer { height:100vh }`) ⇒ grid **co hàng** ⇒ cắt nội dung, ⛔ không sinh thanh cuộn.<br>**HÌNH DẠNG AN TOÀN** = `.drawer-body` **lồng trong `.edm-body`** (`display:block`, cao theo nội dung) ⇒ thân grid có **chiều cao AUTO** ⇒ ⛔ không co hàng (đo được ở `PurchaseOrderDrawer`). ⇒ ⭐ **lớp lỗi đã ĐÓNG: chỉ 1 chỗ nguy hiểm và đã vá.** |
| **③ Cổng được LÀM CHÍNH XÁC** | `C08-2` cũ kiểm **theo TỆP** (`có 'modal' && có 'drawer-body'`) ⇒ **quá thô**, về sau sẽ **báo động giả** cho `PurchaseOrderDrawer` (đang an toàn). ✅ Nay `C08-2` chỉ bắt **mẫu nguy hiểm** (`className="…modal…"`/`"drawer"` rồi tới `<div className="drawer-body` **trong cùng khối JSX**, trừ khi có `gridAutoRows: "max-content"`); thêm `C08-2b` **khoá hình dạng AN TOÀN** (`.drawer-body` lồng trong `.edm-body` phải giữ: `.edm-body` có `overflow-y:auto` và ⛔ **không** `display:grid`). |
| ⚠️ **Cổng BẮT ĐƯỢC CHÍNH TÔI** | Lượt chạy đầu `C08-2b` **ĐỎ** — ⭐ **do phép TRÍCH của tôi sai**: `indexOf(".edm-body")` bắt trúng một **CHÚ THÍCH** («/* phần cuộn nằm ở .edm-body */») ⇒ lấy nhầm thân quy tắc khác. ✅ Sửa: **bỏ chú thích TRƯỚC rồi mới trích** (đã ghi ngay trong ca kiểm). |
| **Kiểm chứng** | cổng C08 **4/4 PASS** · `eslint` 0 · `test:regression` **847 test · 846 pass · 0 fail · 1 skip** · cổng dự án `verify-ui-build-applied` **exit 0** (⛔ chỉ sửa `tests/**` ⇒ ⛔ **không cần `gd-cycle`**, ⛔ không gián đoạn 3 phiên) |
| **Status** | `DONE` |
| ⭐ **Bài học** | **Cổng kiểm theo TỆP là quá thô** — phải kiểm theo **HÌNH DẠNG (cấu trúc)**, nếu không sẽ tái diễn **báo động giả** (lần thứ 4 trong phiên); và ⛔ **khi trích CSS theo `indexOf` phải bỏ chú thích trước** |

---

## TASK-20261007-C16 — **Máy dò «nội dung bị cắt trong khối»** quét 22 màn + giao `HANDOFF-C10` (họ thẻ KPI)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C16` |
| **Tên** | Quét toàn ứng dụng tìm **lớp lỗi cắt nội dung**; phân loại chỗ phát hiện; ⛔ không sửa vùng ngoài quyền |
| **Category** | `TESTING` · `UI_UX` |
| **Phạm vi tệp** | ⛔ **0 tệp sản phẩm** · ⛔ **0 tệp CSS** · ⛔ **0 tệp `tools/**`** (chỉ script tạm, ⛔ đã xoá) |
| **① Máy dò** | Phép dò TRONG TRANG: `overflow-y ∈ {hidden,clip}` ∧ ⛔ không `-webkit-line-clamp` ∧ cao ≥40px ∧ rộng ≥120px ∧ `scrollHeight − clientHeight > 4px` ⇒ báo khối bị **cắt dọc** |
| **② Kết quả** | Quét **22 màn**: ✅ **16 màn = 0 khối bị cắt** · 🔴 6 màn có khối bị cắt · **TỔNG 25 khối — TẤT CẢ đều là `<article class="kpi …">`** ⇒ ⭐ **⛔ không còn loại khối nào khác** |
| ⭐ **KẾT LUẬN** | Lớp lỗi của `BUG-20261007-C07` («nội dung bị cắt trong khối») **đã ĐÓNG** — chỉ còn **họ thẻ KPI** với cơ chế **khác về nguyên nhân**: `.kpi` **cao CỐ ĐỊNH** + `overflow:hidden` ⇒ cắt khi dòng mô tả **xuống thêm 1 dòng** (đo được trạng thái A **cắt 9px** / trạng thái B **không cắt** tại 1440×900) |
| ⚠️ **GIỚI HẠN (nói thẳng)** | Phiên 03 **⛔ không đọc được ảnh** (model không nhận đầu vào ảnh) ⇒ **đã chụp** ảnh thẻ KPI nhưng **⛔ không có xác nhận bằng mắt** ⇒ phân loại **RỦI RO CÓ THẬT + ĐÃ ĐO 1 LẦN XẢY RA**, ⛔ không khẳng định «chắc chắn thấy chữ bị cắt» |
| ⛔ **KHÔNG SỬA (đúng quyền hạn)** | Việc sửa nằm ở **`app/globals.css`/`canonical.css`** (CSS **dùng chung**) hoặc **`app/page.tsx`** (**LOCK của S01**) ⇒ ⭐ theo **cảnh báo conflict của user**, phiên 03 ⛔ **không tự sửa** ⇒ giao **`HANDOFF-20261007-C10`** kèm 2 hướng sửa + test yêu cầu |
| **Status** | `DONE` |
| ⭐ **Giá trị** | Chứng minh **bằng phép đo toàn ứng dụng** rằng bản vá vòng 13 đã đóng đúng lớp lỗi, đồng thời phát hiện **1 rủi ro còn lại** và giao đúng người |

---

## TASK-20261007-C17 — Rà lớp «nút chết / gọi backend không tồn tại» ⇒ gặp **cổng RBAC ĐỎ** và **bác bỏ bằng mã** (⛔ không có lỗ hổng)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C17` |
| **Tên** | Kiểm 2 lớp lỗi «UI nói dối»: ① `open("X")` ⛔ không có modal · ② `action("X")` ⛔ không có xử lý/phân quyền |
| **Category** | `TESTING` · `RBAC` · `UI_UX` |
| **Phạm vi tệp** | ⛔ **0 tệp sản phẩm** · ⛔ **0 tệp `tools/**`** · ⛔ **0 tệp `java-backend/**`** (LOCK S01) — chỉ đo + ghi sổ |
| **① `open(...)` — 39 đích** | ⛔ Đúng **2 đích KHÔNG có modal**: `allocate` · `warehouse` (đều từ `Inventory.tsx`) ⚠️ **NHƯNG** cả 2 nút đã bị **SESSION_02 VÔ HIỆU HOÁ** (`disabled` + `title` ghi rõ `BUG-20261007-013`/`-014`/`-015`) ⇒ ⭐ **UI ⛔ không còn «nói dối»** ⇒ **⛔ không cần sửa** |
| ⚠️ **ĐÍNH CHÍNH GHI CHÉP CỦA PHIÊN KHÁC (đo lại mới biết)** | Sổ `SESSION_A/BUG_HOTFIX_LOG.md` ghi `«＋ Tạo phiếu hoàn trả»` gọi `open("return")` là **⛔ không mở được gì**. **ĐO LẠI trong `app/page.tsx`**: `return` có **1** handler (`modal === "return"`) ⇒ ⭐ **KHÔNG chết** ⇒ ghi chép đó **SAI** (⚠️ đúng bài học «⛔ đừng tin ghi chép, hãy đo lại»). |
| **② Cổng RBAC của dự án — ĐỎ** | `node tools/probe-action-registry-coverage.mjs` → **exit 1** · **«④ ⛔ MÙ QUYỀN: 6»** = 5× `*_contract_review` + `work_scope` ⇒ nếu tin ngay là **lớp CRITICAL (AUTHORIZATION BYPASS)** |
| ⭐ **BÁC BỎ BẰNG MÃ ĐANG CHẠY** | **① 5 action contract_review ĐÃ CÓ CỔNG**: `ContractReviewUseCase.java` có **5× `guard(principal)`** → `rbac.requireActionModule(currentUser(principal), "manage_contract_review")` ✅ (cổng ở tầng **UseCase**, ⛔ không khai ở controller).<br>**② `work_scope` chỉ-đọc + TỰ GIỚI HẠN**: `case "work_scope"` → `requireCurrentUser` → `workScope(principal)` → `workScope.scopeOf(cu.id(), cu.role())` ⇒ chỉ tính phạm vi **của chính người gọi**, ⛔ **không tham số đích** ⇒ ⛔ không có gì để phân quyền ngoài đăng nhập ✅ |
| **KẾT LUẬN** | ⭐ **⛔ KHÔNG có lỗ hổng phân quyền**; ⛔ **KHÔNG sửa `java-backend/**`**; ⛔ **KHÔNG cảnh báo CRITICAL** (nếu báo sẽ là **báo động giả thứ 5** của phiên) ⇒ giao **`HANDOFF-20261007-C11`** để thêm 2 LOẠI HỢP LỆ vào cổng (cổng-ở-UseCase · đọc-tự-giới-hạn) |
| **Kiểm chứng** | ⛔ **0 thay đổi mã** ⇒ cổng dự án `verify-ui-build-applied` **exit 0** (đã đo) · ⛔ không cần `gd-cycle` · dịch vụ `:8787`/`:9000`/`:18081` **đang nghe** |
| **Status** | `DONE` |
| ⭐ **Bài học (lần 6 của phiên)** | **Cổng chỉ kiểm chiều nó được viết để kiểm** — model của cổng **hẹp hơn thực tế** ⇒ sinh **ĐỎ OAN**; ⛔ **tuyệt đối ⛔ không báo bảo mật/không "vá" trước khi đọc mã thật** |

---

## TASK-20261007-C18 — Đo **GIÁ TRỊ THẬT TRONG CSDL** ⇒ bịt 3 mã chưa có nhãn + khoá snapshot 21 nhãn

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C18` |
| **Tên** | Bổ sung 2 domain nhãn (`bch_confirmation` · `qc_result`) cho **giá trị thật** trong CSDL; cổng C09 khoá hồi quy nhãn |
| **Category** | `UI_UX` · `BUGFIX` · `TESTING` |
| **Nguồn** | ⭐ Lỗi user báo (MASTER TASK 3): *«Hiện tại 1 số nơi hiển thị tiếng Anh»* — phiên 03 vá tiếp vòng **thứ 4** cho lớp này |
| **Phạm vi tệp** | `lib/status-labels.ts` (**+2 domain**) · `tests/mt3-c09-status-coverage.test.mjs` (**MỚI**, 4 ca) |
| ⭐ **PHÉP ĐO MỚI (⛔ chưa ai làm)** | ⛔ Không quét mã nguồn nữa mà **quét CSDL THẬT**: liệt kê **62 cột trạng thái** (`information_schema`) → `SELECT DISTINCT` **chỉ đọc** → đưa từng giá trị qua **bảng nhãn dùng chung** (chạy `lib/status-labels.ts` bằng esbuild) |
| **KẾT QUẢ ĐO** | 22 giá trị trạng thái · **3 giá trị RÒ TIẾNG ANH**: `goods_receipts.bch_confirmation_status=confirmed` → «**Confirmed**» · `goods_receipts.qc_status=accepted` → «**Accepted**» · `=passed` → «**Passed**» |
| ⚠️ **NHƯNG ⛔ CHƯA RÒ RA MÀN HÌNH (đo tiếp)** | **5 call site** đều **dịch TAY** bằng ternary: `Inventory.tsx` · `PurchaseOrderDrawer.tsx` (2 chỗ) · `ReceiptDrawer.tsx` (2 chỗ) · `app/page.tsx` ⇒ ⭐ đây là **LỖ HỔNG TIỀM ẨN + TRÙNG LẶP 5 CHỖ** (đúng lớp lỗi đã gây **4 bug** trong phiên) ⇒ vá **tại NGUỒN** |
| **BẢN VÁ** | Thêm **2 domain**: `bch_confirmation` (`pending`→«Chờ BCH xác nhận» · `confirmed`→«BCH đã xác nhận» · `rejected`→«BCH từ chối») và `qc_result` (`pending`→«Chờ kiểm tra» · `accepted`/`passed`→«Đạt» · `rejected`/`failed`→«Không đạt») — ⭐ tên `qc_result` **khớp cột thật** `goods_receipt_items.qc_result` (đo được) |
| ⛔ **QUYẾT ĐỊNH AN TOÀN (quan trọng)** | 2 domain mới **⛔ KHÔNG** đưa vào `DOMAIN_LOOKUP_ORDER` — vì chúng chứa mã **DÙNG CHUNG** (`pending` · `rejected`) ⇒ nếu vào thứ tự **tra chéo** thì **nhãn của mã dùng chung có thể ĐỔI** ở nơi khác ⇒ **HỒI QUY**. ⇒ Nay chúng **chỉ dùng khi người gọi truyền domain tường minh** ⇒ **0 thay đổi** cho mọi nhãn đang chạy |
| ⛔ **KHÔNG refactor tệp phiên khác** | ⛔ **KHÔNG** sửa 5 call site (thuộc S01/S02) — theo §41, việc dịch tay vẫn đúng; việc thêm nhãn ở nguồn là **phòng ngừa**, ⛔ không đổi câu chữ trên màn hình |
| **Cổng C09 (4 ca)** | `C09-1` 3 giá trị CSDL nay có nhãn tiếng Việt **+ đối chứng âm** (`statusLabel("confirmed")` ⛔ vẫn «Confirmed» khi ⛔ không truyền domain — đúng thiết kế) · `C09-2` ⛔ 2 domain mới **không được** vào `DOMAIN_LOOKUP_ORDER` · `C09-3` **snapshot 21 nhãn ĐO ĐƯỢC** (chống hồi quy) · `C09-4` mã lạ ⛔ không lộ mã thô |
| ⚠️ **TỰ ĐÍNH CHÍNH 2 LẦN TRONG CHÍNH CA NÀY** | Snapshot đầu tôi **đoán** ⇒ sai **2 lần**: `complete` (đoán «Hoàn thành», thật «**Đã có**») và `in_progress` (đoán «Đang thực hiện», thật «**Đang xử lý**»). ⭐ Sửa bằng cách **ĐO** (chạy `statusLabel` thật) rồi ghi lại — và thêm 1 phép đo CSDL để **chứng minh** `complete` chỉ dùng ở `certificate_status`/`delivery_document_status`/`document_status` (quét 62 cột) ⇒ «Đã có» **đúng** |
| **Phát hiện thêm (⛔ không phải lỗi)** | `statusLabel("locked")` → «**Locked**» (tiếng Anh) ⚠️ **NHƯNG đã kiểm CSDL: `locked` ⛔ KHÔNG phải giá trị trạng thái nào** ⇒ ⛔ không phải rò rỉ đang chạy ⇒ ⛔ **KHÔNG** đưa vào snapshot (tránh "khoá" một nhãn tiếng Anh) |
| **Kiểm chứng** | cổng C09 **4/4 PASS** · `tsc` 0 · `eslint` 0 · `test:regression` **851 test · 850 pass · 0 fail · 1 skip** · `gd-cycle` lần 9 + cổng dự án + **xác minh LIVE** (ghi ở `TEST_LOG` §C18) |
| **Status** | `FIXED` (⏳ chờ user nghiệm thu — vì **chưa có thay đổi nhìn thấy** trên màn hình, đây là **phòng ngừa + khoá hồi quy**) |

---

## TASK-20261007-C19 — Định dạng NGÀY hiển thị: vá **4 chỗ in ngày THÔ** (ISO) về `dd/mm/yyyy` dùng chung

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C19` |
| **Tên** | Bọc `date(...)` cho 4 chỗ in ngày thô ra bảng/thẻ; cổng C10 khoá không tái phát |
| **Category** | `UI_UX` · `BUGFIX` · `TESTING` |
| **Nguồn** | Lỗi user báo (MT3) «hiển thị chưa nhất quán / tiếng Anh» — phiên 03 rà tiếp **định dạng NGÀY** |
| **Phạm vi tệp** | `app/screens/Payments.tsx` (**2 chỗ**) · `app/screens/DocumentsScreen.tsx` (1) · `app/screens/ProjectTeams.tsx` (1) · `tests/mt3-c10-date-format.test.mjs` (**MỚI**, 4 ca) |
| ⭐ **PHÉP ĐO** | Quét `app/screens/**` tìm `{row\|r\|item\|receipt\|po.v.<…At\|…Date>}` **ở vị trí VĂN BẢN JSX** (⛔ loại trừ thuộc tính ô nhập liệu) ⇒ **4 chỗ IN NGÀY THÔ** |
| **HỆ QUẢ ĐO ĐƯỢC** | Giá trị ngày trong CSDL là **text `YYYY-MM-DD`** (+ `<input type="date">`) ⇒ màn hình hiện **`2026-10-07`** trong khi **mọi nơi khác** hiện **`07/10/2026`** (`date()` = `Intl.DateTimeFormat("vi-VN")`) ⇒ ⚠️ **KHÔNG NHẤT QUÁN ĐỊNH DẠNG NGÀY** |
| ⭐ **DẤU HIỆU CHÍ MẠNG (đo được)** | **CẢ 3 TỆP ĐÃ `import { … date … }` NHƯNG GỌI `date(...)` 0 LẦN** ⇒ ⛔ không phải thiếu tiện ích mà là **QUÊN DÙNG** (import thừa + in thô) |
| **BẢN VÁ** | Bọc `date(...)` cho **4 chỗ** — ⛔ **không thêm import nào** (đã có sẵn) ⇒ diff **tối thiểu**, ⛔ không đổi dữ liệu, ⛔ không đổi `<option>`/`<input>` |
| **Cổng C10 (4 ca)** | `C10-1` ⛔ không màn nào in ngày thô · `C10-2` `date()` phải `vi-VN` + rỗng ⇒ `—` + sai ⇒ nguyên chuỗi (⛔ không «Invalid Date») + có `T` ⇒ thêm giờ:phút · `C10-3` 4 chỗ đã vá **thực sự** gọi `date(...)` **và** 3 tệp ⛔ không còn `date` gọi 0 lần · `C10-4` ⭐ **ĐỐI CHỨNG ÂM**: bộ dò **PHẢI bắt** `<td>{row.paymentDate}</td>` **và ⛔ KHÔNG bắt nhầm** ô nhập liệu / chỗ đã bọc `date(...)` |
| **Kiểm chứng** | cổng C10 **4/4 PASS** · `tsc` 0 · `eslint` **0 error** (1 warning `'open' is defined but never used` — ⚠️ **có sẵn**, ⛔ không do lượt này) · `test:regression` **855 test · 854 pass · 0 fail · 1 skip** · `gd-cycle` lần 10 + cổng dự án + LIVE (ghi ở `TEST_LOG` §C19) |
| **Status** | `FIXED` (⏳ chờ user nghiệm thu — ⭐ **lần này CÓ thay đổi nhìn thấy được**: ngày hiện `dd/mm/yyyy`) |

---

## TASK-20261007-C20 — ⭐ **XÁC MINH DOM SỐNG** cho bản vá định dạng ngày + **ĐÍNH CHÍNH** «nhóm menu rỗng» là giới hạn PROBE

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C20` |
| **Tên** | Đóng 2 việc treo của vòng 18: (a) xác minh live định dạng ngày; (b) làm rõ «nhóm menu TÀI CHÍNH không có mục con» |
| **Category** | `TESTING` · `UI_UX` |
| **Phạm vi tệp** | ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) — chỉ ĐO + ghi sổ |
| **① XÁC MINH LIVE (a)** | Vào màn «**Thanh toán HĐ**» (⭐ **kiểm `h1`** = `"Thanh toán HĐ"`) ⇒ đếm `innerText`: **ISO `yyyy-mm-dd`: 0** ✅ · **`dd/mm/yyyy`: 4** ✅ (mẫu `30/06/2026` · `15/02/2026`) ⇒ ⭐ **CHỨNG MINH bản vá định dạng ngày đúng trên UI THẬT** ⇒ `TASK-C19`: **`FIXED` → `VERIFIED`** |
| **② ĐÍNH CHÍNH (b)** | ⛔⛔ **«nhóm TÀI CHÍNH – KẾ TOÁN rỗng» là GIỚI HẠN CỦA PROBE, ⛔ KHÔNG phải lỗi UI**: nhóm có **7 mục con THẬT** (Kế hoạch thanh toán · Tạm ứng/Hoàn ứng · Chi phí Ban chỉ huy · Sổ quỹ & Ngân hàng · Chứng từ kế toán · Thanh toán/Quyết toán · Thanh toán HĐ) — chỉ hiện khi bấm **`button.nav-parent`** (chevron) cho `aria-expanded="true"` |
| ⭐ **NGUYÊN NHÂN SAI** | Các lượt trước tôi bấm **phần tử chứa NHÃN nhóm** ⇒ ⛔ không mở nhóm ⇒ con ⛔ không render ⇒ tưởng «rỗng». ⚠️ **Báo động giả thứ 6** của phiên ⇒ ⛔ **không sửa gì** (⛔ không có lỗi) |
| ⭐ **CÁCH LÀM ĐÚNG (đã ghi `SHARED_STATE` §63)** | mở nhóm bằng **`button.nav-parent`** · xác nhận **`aria-expanded="true"`** · sau khi bấm mục **kiểm `h1/h2`** |
| **③ HỆ QUẢ (ghi thẳng)** | Các lượt «quét 22 màn» trước **một phần đo lại màn cũ** (nhóm chưa mở) ⇒ ⛔ **không dùng con số «22 màn» như bằng chứng tuyệt đối**. ✅ Kết luận §C16 (lớp lỗi cắt nội dung đã đóng) **vẫn đúng** vì dựa trên **họ khối `.kpi` đo trên màn THẬT ĐÃ TỚI** |
| **Status** | `DONE` |

---

## TASK-20261007-C21 — Sweep màn: **nâng mức `HANDOFF-C10`** (lỗi `.kpi` là HỆ THỐNG) + ⛔ **dừng sweep sau 5 lần thử**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C21` |
| **Tên** | Thực thi kỹ thuật quét đã rút ra (§21.5) ⇒ thu phát hiện mới, rồi **dừng đúng lúc** ⛔ không đốt ngân sách vào công cụ |
| **Category** | `TESTING` · `UI_UX` |
| **Phạm vi tệp** | ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) — chỉ ĐO + ghi sổ |
| ⭐ **PHÁT HIỆN MỚI (giá trị chính)** | **MÀN THỨ 3** cùng họ lỗi cắt thẻ KPI — «**KPI & hiệu suất nhân viên**»: `kpi-green 156/164` · `kpi-red 156/164` (**cắt 8px**, 2 thẻ) ⇒ họ `.kpi` bị cắt ở **≥ 3 màn** (Tổng quan điều hành · Trung tâm phê duyệt · KPI & hiệu suất NV) ⇒ ⭐ **NÂNG MỨC `HANDOFF-20261007-C10`: LỖI HỆ THỐNG** — **sửa 1 chỗ ở quy tắc `.kpi`** là hết cho cả 3+ màn, ⛔ không sửa từng màn |
| ✅ **Màn MỚI tới được** | «**Báo cáo tổng hợp**» (bấm «Báo cáo & cảnh báo») ⇒ **SẠCH**: ⛔ 0 khối bị cắt · ⛔ 0 lỗi văn bản |
| ⛔⛔ **DỪNG SWEEP SAU 5 LẦN THỬ** | ① `button/a` → **8** mục · ② lớp cũ `.nav-child`/`.nav-single-direct` → **7** mục · ③ mọi `.sidebar *` + bấm **theo CHỈ SỐ** → tới **1** màn (sidebar render lại ⇒ chỉ số hỏng) · ④ theo **VĂN BẢN** khớp chính xác → **5** màn (nhãn **có SỐ ĐẾM** như «Trung tâm phê duyệt**7**») · ⑤ **bỏ chữ số** → **3** màn (⚠️ lẫn nhãn **NHÓM** ⇒ bấm nhóm ⛔ không điều hướng) |
| ⭐ **CÁCH LÀM ĐÚNG (ghi lại)** | đối chiếu theo **`h1` MÀN ĐÍCH** (⛔ không dựa nhãn menu) · hoặc `data-nav-key` · hoặc cổng `tools/probe-visual-regression.mjs` (+ làm mới ảnh chuẩn) ⚠️ `tools/**` ⛔ không thuộc phiên 03 |
| ⚠️ **TỰ BÁO LỖI (đã sửa)** | khi chèn `§C22` vào `TEST_LOG.md`, tôi **xoá nhầm tiêu đề `§C21`** và làm **đảo thứ tự C22/C21** ⇒ **phát hiện + sửa ngay** (khôi phục tiêu đề, **hoán vị 2 khối**, kiểm lại: `C21@57203 < C22@60062`, mỗi tiêu đề **1 lần**) ✅ |
| **Kiểm chứng** | ⛔ 0 thay đổi mã ⇒ cổng dự án **exit 0** (`344d1da5553cca1e` · 6/6 bundle) · `:8787`/`:9000`/`:18081` **đang nghe** · ⛔ không còn tệp tạm |
| **Status** | `DONE` |
| ⭐ **Bài học (lần 7)** | **Biết DỪNG đúng lúc**: sau 5 lần thử công cụ, tôi dừng và **chốt bằng chứng đã có** thay vì tiếp tục đốt ngân sách — ⭐ nhưng vẫn thu được **1 phát hiện thật** (màn thứ 3) nhờ **kiểm `h1`** thay vì tin nhãn |

---

## TASK-20261007-C22 — CHỐT root cause `.kpi` bị cắt + **chỗ sửa** + **tiền lệ trong repo** (⛔ không sửa vì ngoài quyền)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C22` |
| **Tên** | Đo **chuỗi cha** của thẻ `.kpi` để chốt **đúng chỗ sửa** cho `HANDOFF-C10` (⚠️ tôi ⛔ không sửa: CSS dùng chung + `page.tsx` là LOCK của S01) |
| **Category** | `TESTING` · `UI_UX` |
| **Phạm vi tệp** | ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) — chỉ ĐO + ghi sổ |
| **① ĐO CHUỖI CHA** | thẻ `.kpi`: `clientHeight=201` / `scrollHeight=210` (**cắt 9px**) · `min-height` 112/122/124/156px · **`overflow:hidden`**<br>dải cha: `h=203` · **`display:grid`** · `gridTemplateRows` giải ra **`203.203px`** (1 hàng) · `kids=4` · `overflow-y:hidden`<br>cha nữa: `.dashboard-main-column` `display:grid` rows `203.203px 776.922px 311.75px` |
| **② ROOT CAUSE (chốt)** | `.kpi { overflow:hidden }` ⇒ **kích thước tối thiểu tự động = 0** ⇒ hàng của `.kpi-grid` **bị CO xuống vừa khung** ⇒ **cắt ~8–9px** ⇒ ⚠️ **CÙNG CƠ CHẾ** với `BUG-20261007-C07` (modal GRN) — ⭐ nên **cách vá đã kiểm chứng** |
| ⭐⭐ **③ TIỀN LỆ TRONG REPO (phát hiện quan trọng)** | Repo **ĐÃ sửa đúng lỗi này** cho `.approved-kpi-grid`: `.approved-kpi-grid .kpi .kpi-content p { white-space:normal!important; overflow:visible!important; … min-height:2.7em!important }` ⇒ ⭐ **TÁI DÙNG CHÍNH CÁCH ĐÓ** cho `.kpi-grid` mặc định (⛔ không phát minh cách mới — §17 REUSE) |
| **④ HAI HƯỚNG SỬA (chọn 1)** | **A (khuyến nghị)**: theo tiền lệ trên · **B**: `grid-auto-rows: max-content` cho `.kpi-grid` (cách phiên 03 đã kiểm chứng ở modal GRN) ⚠️ có thể cao thêm vài px ⇒ phải kiểm 3 màn |
| ⛔ **⑤ KHÔNG SỬA (đúng quyền hạn)** | CSS ở **`app/globals.css`** (dùng chung) · markup dải KPI ở **`app/page.tsx`** (**LOCK S01**) ⇒ theo **cảnh báo conflict của user**, phiên 03 ⛔ **không tự sửa** ⇒ nội dung đã nằm trong **`HANDOFF-20261007-C10`** (root cause + chỗ sửa + tiền lệ + test) |
| **⑥ TEST REQUIRED (đã ghi)** | sau khi sửa: mở 3 màn, đọc `clientHeight`/`scrollHeight` **từng** `article.kpi` ⇒ **⛔ 0 thẻ bị cắt** |
| ⚠️ **⑦ TỰ BÁO LỖI (LẦN THỨ 2 — cùng loại)** | khi chèn mục mới, `edit` của tôi **xoá mất tiêu đề mục kế tiếp** (`HANDOFF-C11` lần này; `§C21` lần trước) vì **`new_string` ⛔ không chép lại tiêu đề nằm trong `old_string`**. ✅ Đã khôi phục cả 2 + kiểm lại cấu trúc (`C10 < C11`, 11 tiêu đề, mỗi cái **1 lần**; TEST_LOG `C21 < C22 < C23`) ⇒ ⭐ **đã ghi LUẬT vào `SHARED_STATE` §72** để ⛔ không lặp lần thứ 3 |
| **Status** | `DONE` |


---

## TASK-20261007-C23 — ⛔ **THU HỒI `HANDOFF-C10`**: «cắt chữ mô tả» ở thẻ KPI là **SUY DIỄN SAI** (thủ phạm = **hoạ tiết trang trí**)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C23` |
| **Tên** | ⭐ **Kiểm chứng lại chính handoff của mình TRƯỚC khi người khác sửa** ⇒ phát hiện kết luận cũ **SAI** ⇒ **thu hồi** |
| **Category** | `TESTING` · `UI_UX` |
| **Phạm vi tệp** | ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) — chỉ ĐO + **THU HỒI** kết luận trong log |
| ⭐ **PHÉP ĐO QUYẾT ĐỊNH** | Đo **TỪNG CON** trong thẻ `.kpi` (⛔ không chỉ đo thẻ): phần tử **DUY NHẤT** vượt đáy là **`<i>` RỖNG** (`txt=""`) cao **4px**, `position:static`, `display:block`, vượt **8px / 5px / 5px** trên 3 thẻ |
| ⭐ **DANH TÍNH** | `app/globals.css`: `.kpi-mini-columns i { width:5px; min-height:4px; border-radius:2px 2px 0 0; background:currentColor; opacity:.88 }` ⇒ **cột của BIỂU ĐỒ MINI TRANG TRÍ** (⚠️ `.kpi-sparkline` đã bị `display:none!important`) |
| ⛔ **KẾT LUẬN ĐÚNG** | **⛔ KHÔNG có CHỮ nào bị cắt** — chỉ **vài px cuối của hoạ tiết** bị `overflow:hidden` cắt ⇒ **gần như chắc chắn là CỐ Ý** ⇒ ⛔ **không phải lỗi người dùng thấy được** |
| ⛔⛔ **THU HỒI (tự nhận)** | Tôi từng nói «họ `.kpi` **CẮT chữ mô tả** — LỖI HỆ THỐNG, ưu tiên cao» (vòng 15/20/21/22 + Telegram nhiều lần) ⇒ ⛔ **SAI**. ⭐ **LỖI PHƯƠNG PHÁP**: dùng `scrollHeight > clientHeight` làm bằng chứng «cắt nội dung» rồi **suy diễn** ra «cắt CHỮ» — chỉ số đó ⛔ **không nói phần tử nào vượt, cũng ⛔ không nói có chữ hay không** |
| ✅ **HÀNH ĐỘNG ĐÚNG** | đã chèn khối **«⛔ ĐỪNG SỬA `.kpi` THEO HANDOFF NÀY»** ngay dưới tiêu đề **`HANDOFF-20261007-C10`** (kèm ngoại lệ: chỉ mở lại nếu **USER nhìn thấy chữ bị hụt** + ảnh chụp) ⇒ ⛔ **KHÔNG** thêm quy tắc `.kpi-content p`, ⛔ **KHÔNG** `grid-auto-rows: max-content` |
| ⚠️ **CHƯA ĐO TƯƠNG TỰ** | 2 màn còn lại (`Trung tâm phê duyệt` `171/179` · `KPI & hiệu suất NV` `156/164`) ⇒ ⛔ **không kết luận «cắt chữ»** khi chưa **đo từng con** (⚠️ nhiều khả năng **cùng `<i>` trang trí**) |
| **Kiểm chứng cấu trúc log** | sau khi chèn: HANDOFF **11 tiêu đề**, `C10 < C11`, mỗi cái **1 lần** · TASK_LOG `C21`/`C22` mỗi cái **1 lần** ✅ |
| **Status** | `DONE` |
| ⭐ **GIÁ TRỊ** | ⭐ **Chặn được một thay đổi CSS DÙNG CHUNG vô ích + rủi ro** mà tôi suýt gây ra — ⭐ đúng tinh thần «⛔ không sửa thứ ⛔ không hỏng» (Goal §12/§41) |
---

## TASK-20261007-C24 — ĐO XÁC NHẬN màn thứ 2 ⇒ **LỚP `.kpi` CHÍNH THỨC ĐÓNG** (⛔ không có chữ bị cắt)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C24` |
| **Tên** | Hoàn tất việc đo còn dở của `§C24`: kiểm màn «Trung tâm phê duyệt» xem con vượt đáy là **CHỮ** hay **hoạ tiết** |
| **Category** | `TESTING` · `UI_UX` |
| **Phạm vi tệp** | ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) |
| **KẾT QUẢ ĐO** | Màn «Trung tâm phê duyệt», **6 thẻ**: thẻ 0/2/3 cắt **8px**, con vượt đáy **duy nhất** = **`<i>` RỖNG** (`txt=""`) cao **4px**, vượt **7px** · ⭐ thẻ 1 **`cut = 0`** (⛔ không cắt) |
| **KẾT LUẬN** | ⭐ **GIỐNG HỆT màn «Tổng quan điều hành»** ⇒ con vượt đáy là **cột biểu đồ mini TRANG TRÍ** (`.kpi-mini-columns i`), ⛔ **KHÔNG phải chữ** ⇒ ⛔ **KHÔNG có CHỮ nào bị cắt trên CẢ 2 màn đã đo** ⇒ ⭐ **`HANDOFF-C10` ĐÚNG LÀ BÁO ĐỘNG GIẢ** (đã thu hồi) |
| ⭐ **Chi tiết củng cố** | **thẻ 1 `cut = 0`** trong khi thẻ 0/2/3 cắt 8px ⇒ đúng dấu hiệu **hoạ tiết cao theo dữ liệu** (⛔ chữ giống nhau giữa các thẻ nên ⛔ không thể là chữ) |
| ⚠️ **⛔ CHƯA ĐO (nói thẳng)** | màn «**KPI & hiệu suất nhân viên**» (`156/164`) ⛔ **không tới được** lượt này (`KHONG_THAY`) ⇒ ⛔ **KHÔNG** nói «đã đo hết 3 màn»; ⚠️ **chữ ký `Δ8px` trùng** với 2 màn đã đo ⇒ nghi cùng hoạ tiết |
| ⛔ **KHÔNG SỬA** | ⛔ không đụng `.kpi`/`.kpi-grid` (Goal §12/§41) · ⭐ giữ khối «⛔ ĐỪNG SỬA» trong `HANDOFF-20261007-C10` · ⚠️ ngoại lệ: nếu **USER thấy CHỮ bị hụt** (kèm ảnh) ⇒ mở lại |
| **Kiểm chứng** | ⛔ 0 thay đổi mã ⇒ ⛔ không cần `gd-cycle` · cấu trúc log: TASK/TEST/HANDOFF **không trùng lặp** · 3 dịch vụ **đang nghe** |
| **Status** | `DONE` |
---

## TASK-20261007-C25 — XÁC MINH LIVE GOM 7 hotfix FE trong **bundle đang phục vụ** ⇒ chuyển `VERIFIED`

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C25` |
| **Tên** | Chứng minh **artifact người dùng đang được phục vụ** có đủ 7 hotfix FE (⛔ không chỉ «có trong mã nguồn») |
| **Category** | `TESTING` |
| **Phạm vi tệp** | ⛔ **0 tệp sản phẩm** (chỉ đọc bundle qua HTTP) |
| **PHƯƠNG PHÁP (⭐ tránh bẫy «probe nhiều bước hay hỏng»)** | đọc **5 tệp bundle** từ `GET :9000/` (**1.320.389 ký tự**) + kiểm **chuỗi đặc trưng** từng hotfix + tải **2 mẫu CSV qua HTTP** kiểm **BOM theo BYTE** |
| **KẾT QUẢ** | ⭐ **10/10 ĐẠT** — `C01` (`Hồ sơ nhân sự` + `update_user`) · `C02` (⛔ **không còn** `data-team-source-notes`) · `C04` (`Đã xuất kho` · `Chờ NCC` · `Làm lại`) · `C05` (`Khẩn cấp`) · `C06/C09` (`Không yêu cầu`) · `C07` (`gridAutoRows`) · `C10` (`vi-VN`) · `C03` (**BOM 244 · 1178 bytes**) — vân tay `344d1da5553cca1e` |
| **HỆ QUẢ** | ⭐ đủ điều kiện **`FIXED` → `VERIFIED`** cho **7 hotfix FE** (Goal §24: `VERIFIED = FIXED + RECHECK`) — 3 tầng: **cổng hợp đồng** + **artifact đang phục vụ** + **đo DOM sống** (`C10`) |
| ⚠️ **GIỚI HẠN (nói thẳng)** | ⛔ đây là **bằng chứng ARTIFACT** — ⛔ **không thay thế** **thao tác nghiệp vụ thật** (vd «sửa CCCD → Lưu không lỗi» qua **luồng UI nhiều bước**) ⚠️ **chưa làm** vòng này |
| **Kiểm chứng** | ⛔ 0 thay đổi mã ⇒ ⛔ không cần `gd-cycle` · cổng dự án **ĐẠT** (đọc **dòng KẾT LUẬN + 3 dấu ✓** theo `§76`) · cấu trúc log **không trùng lặp** |
| **Status** | `DONE` |
---

## TASK-20261007-C26 — ⭐ CHỨNG MINH `BUG-C01` **END-TO-END Ở TẦNG API** + tìm ra **đường đọc dữ liệu thật**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C26` |
| **Tên** | ⭐ **Đo lưu lượng mạng** để tìm đúng API (⛔ thay cho việc đoán tên) ⇒ chứng minh `BUG-C01` bằng **đối chứng âm + bản vá** |
| **Category** | `API` · `TESTING` |
| **Phạm vi tệp** | ⛔ **0 tệp sản phẩm** (chỉ script tạm, ⛔ đã xoá) |
| ⭐ **PHƯƠNG PHÁP ĐÚNG (bài học lần 8)** | **BẮT GÓI MẠNG** (CDP `Network.requestWillBeSent`) khi tải app ⇒ app gọi **1** request dữ liệu: ⭐ **`GET /api/system`** ⇒ ⛔ **kết luận âm của `§C28` là SAI DO PHƯƠNG PHÁP** (đã thử **11 tên action bằng POST**) |
| **KẾT QUẢ CHỨNG MINH** | ① `login` ⇒ **200** + cookie · ② **`GET /api/system` ⇒ 200 · 2.617.743 ký tự · 29 users** · ③ user đo `e2e.diag` (fixture)<br>④ ⛔ **ĐỐI CHỨNG ÂM** payload CŨ (`{action:"update_user", userId}`) ⇒ **HTTP 400** · `"Mã nhân viên, họ tên, tên đăng nhập và phòng/bộ phận là bắt buộc."` ⇒ ⭐ **tái hiện đúng lỗi user báo**<br>⑤ ✅ **BẢN VÁ** payload đầy đủ 6 trường ⇒ **HTTP 200** · `"Đã cập nhật tài khoản e2e.diag."`<br>⑥ ✅ **DỮ LIỆU GIỮ NGUYÊN** (gửi lại đúng giá trị hiện có) |
| **HỆ QUẢ** | ⭐ `BUG-20261007-C01` **ĐÓNG HOÀN TOÀN** — ⛔ **không cần** thao tác UI nhiều bước nữa (bằng chứng API **mạnh hơn**) |
| ⚠️ **GHI CHÚ DỮ LIỆU** | phép đo **có ghi** (`update_user` trên **1 user FIXTURE** `e2e.diag`) nhưng **gửi lại đúng giá trị hiện có** ⇒ ⛔ **không đổi dữ liệu thực chất** (đã kiểm bước ⑥) |
| **Status** | `DONE` |
---

## TASK-20261007-C27 — Vá lớp «**thẻ trạng thái phơi mã thô**» (6 màn) + vá **ĐỎ OAN do tranh chấp** + build

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C27` · **Category** `UI_UX` · `BUGFIX` · `TESTING` |
| **① NGUỒN PHÁT HIỆN** | ⭐ **Quét TOÀN BỘ DỮ LIỆU THẬT** (`GET /api/system` — đường đọc tìm được ở `TASK-C26`) ⇒ 395 cặp `(trường, giá trị)` kiểu trạng thái ⇒ **đọc chỗ render** để loại báo động giả |
| **② KẾT LUẬN QUÉT** | ✅ **148** cặp **đã có nhãn tiếng Việt** (khiếu nại «hiện tiếng Anh» **đã được xử lý phần lớn**) · ⛔ **0** lỗi ở các trường không hiển thị (`result`/`entityType`/`dataType`/`categoryCode`/`mappingStatus`/`systemLevel`/`overdue`) · ⛔ **1 lớp lỗi THẬT**: **thẻ trạng thái rơi xuống mã thô** |
| **③ VÁ** | **6 tệp** `app/screens/{AllocateReturn,WorkKanban,WorkCenter,TeamManagement,ProjectEntityModal,ProjectDetailTabs}.tsx` ⇒ dùng **chốt chặn cuối** `statusLabel(...)` của bảng nhãn **DÙNG CHUNG** (§17 REUSE) |
| **④ CỔNG MỚI** | `tests/mt3-c11-status-no-raw.test.mjs` — ✅ **4/4 ĐẠT**, gồm **đối chứng âm** (⛔ bắt nhầm `taskStatusLabel(String(...))` đã bị loại sau khi **hiệu chỉnh bộ dò**) |
| **⑤ PHÁT HIỆN THÊM (ngoài dự kiến)** | ⚠️ Hồi quy **ĐỎ 1 ca** ⇒ truy nguyên: **`BUG-20261007-C09`** — **ĐỎ OAN do TRANH CHẤP** (phiên khác ghi/xoá tệp tạm ở gốc repo, `readdir`+`stat` TOCTOU) ⇒ ✅ **đã vá** (`CHG-20261007-C21`) + **chứng minh bằng mô phỏng** |
| **⑥ BUILD** | ✅ `gd-cycle` **exit 0** · migration **0340** · vân tay **`920bb0c5f11fd64a`** · dịch vụ đã khởi động lại (`:8787`/`:9000`/`:18081` **đang nghe**) |
| **⑦ KIỂM CHỨNG** | ✅ cổng dự án **ĐẠT** (3 dấu ✓ + KẾT LUẬN) · ✅ `tsc` exit 0 · ✅ `eslint` 0 lỗi · ✅ **hồi quy 859 test · 858 pass · 0 fail · 1 skip** |
| **⑧ PHỐI HỢP** | ✅ **CHỜ** phiên khác xong `probe-visual-regression --update` mới dừng dịch vụ · ✅ dừng **đúng PID** · ⛔ **KHÔNG** chạm `Inventory.tsx` (phiên 02) hay `app/page.tsx` (LOCK phiên 01) ⇒ **`HANDOFF-20261007-C13`** |
| **Status** | `DONE` |
| ⭐ **Bài học (lần 9)** | ⚠️ **ĐỎ chưa chắc là lỗi của mình**: 2 vòng liên tiếp gặp đỏ **đều do nhiều phiên song song** ⇒ ⭐ quy trình: **đọc lỗi thật → chạy lại riêng → mô phỏng lại điều kiện → chỉ kết luận sau khi ĐO** |
---

## TASK-20261007-C28 — KIỂM DOM cho bản vá «thẻ trạng thái» + **GIẢI MÃ CẤU TRÚC MENU**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C28` · **Category** `TESTING` · `UI_UX` |
| **Mục tiêu** | Bịt nốt khoảng trống xác minh của vòng 28: **đo DOM** trên màn đã vá (`BUG-20261007-C08`) |
| ⭐ **PHÁT HIỆN LỚN (giá trị lâu dài)** | **GIẢI MÃ CẤU TRÚC MENU**: mục menu là **`<button>`** có **`<span>{nhãn}</span>` + `<b>{số đếm}</b>`** ⇒ ⛔ khớp `textContent` **luôn trượt** (lẫn số đếm) · **11 nhóm HOA phần lớn ĐÓNG** ⇒ ⭐ **mục lá ⛔ KHÔNG có trong DOM khi nhóm đóng** — ⭐ **đây chính là nguyên nhân gốc** làm **5 lượt quét trước chỉ ra 7–8 mục** |
| ⭐ **CÁCH ĐÚNG (đã chạy được)** | ① bấm `button` có `<span>` = **NHÃN HOA** (mở nhóm) → ② bấm `button` có `<span>` = **nhãn mục lá** → ③ **xác nhận `h1` đổi** |
| ⭐ **BẢN ĐỒ MỤC LÁ** | đã đo và ghi vào `TEST_LOG.md §32.1` (⛔ khỏi mò lại): CÔNG VIỆC ⇒ *Dashboard · Cá nhân · Phòng ban · Giao việc · Báo cáo* … |
| **KẾT QUẢ ĐO DOM** | màn «**Giao việc & Kiểm soát hoàn thành**» (`WorkCenter.tsx`): cột trạng thái/ưu tiên hiện **«Mới» · «Xong» · «Cao» · «Bình thường» · «Quá hạn»** ⇒ ⭐ **tiếng Việt, ⛔ 0 mã thô** · màn «Nhiệm vụ viên đang làm»: ✅ **0 mã thô** |
| ⚠️ **BÀI HỌC BỘ DÒ** | bộ dò «mã thô» **bắt nhầm MÃ ĐỊNH DANH** (`CV-DA-…`, `PRJ-DEMO-01`, `E2E-DA-01`) ⇒ ⭐ **LUẬT**: chỉ áp cho cột **TRẠNG THÁI/LOẠI**, ⛔ không áp cho cột **mã/tên** |
| **KẾT LUẬN** | `BUG-20261007-C08` ⇒ ✅ **`VERIFIED`** (cổng + build + hồi quy + **DOM thật**) — ⚠️ **DOM đo 2/6 màn**, 4 tệp còn lại ⭐ bảo đảm bởi **cổng C11 + bảng nhãn tất định** |
| **Status** | `DONE` |
---

## TASK-20261007-C29 — Đo DOM **màn rò NẶNG NHẤT** + ⭐ **chốt CÔNG THỨC ĐIỀU HƯỚNG 3/3**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C29` · **Category** `TESTING` · `UI_UX` |
| **Mục tiêu** | Bịt nốt khoảng trống `§32.5`: màn «**Cấp phát cho tổ đội**» (`AllocateReturn` — nơi rò **NẶNG NHẤT**) chưa bấm tới được |
| ⭐ **NGUYÊN NHÂN LƯỢT TRƯỚC TRƯỢT** | tôi **mở nhiều nhóm rồi mới bấm lá** ⇒ đo được **nhóm trước TỰ ĐÓNG** khi mở nhóm khác (accordion) |
| ⭐ **CÔNG THỨC ĐÚNG (chạy 3/3 ✅)** | ① mở nhóm (`<span>` = NHÃN HOA) → ② **kiểm NGAY** mục lá → ③ **bấm lá NGAY** → ④ xác nhận `h1` · 🛟 nếu chưa thấy lá ⇒ bấm nhóm **lần 2** |
| ⭐ **KỸ THUẬT ĐO CHÍNH XÁC** | tìm `<th>` «Trạng thái»/«Ưu tiên» rồi **chỉ đọc các `<td>` ở ĐÚNG CHỈ SỐ CỘT** ⇒ ⭐ **loại hẳn** báo động giả từ cột **MÃ** (`CV-DA-…`) |
| **KẾT QUẢ** | «**Cấp phát cho tổ đội**»: cột «Trạng thái» **5 dòng** · ⛔ **mã thô: 0** ✅ (nhãn «Đang hoạt động») · «Hồ sơ nhân sự»: ⚠️ ⛔ không có cột trạng thái ⇒ **⛔ chưa đo được** · «Giao việc»: 0 dòng ⇒ ⚠️ **không bằng chứng** |
| **HỆ QUẢ** | `BUG-20261007-C08` ✅ **`VERIFIED`** với DOM **3/6 màn** (thêm **màn rò nặng nhất**) — ⚠️ 3 tệp còn lại ⭐ bảo đảm bởi **cổng C11 + bảng nhãn tất định** (⛔ không nói «đã đo hết») |
| **Status** | `DONE` |
---

## TASK-20261007-C30 — QUÉT TOÀN BỘ **29 MÀN** (lượt đầu phủ rộng) + vá **11 chỗ hiển thị ngày ISO** + build

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C30` · **Category** `TESTING` · `UI_UX` · `BUGFIX` |
| ⭐ **THÀNH QUẢ** | nhờ **công thức điều hướng `§C33`** ⇒ quét được **29 màn / 11 nhóm** (mọi lượt trước **3–8 mục**) · **27 màn SẠCH** · **2 màn có phát hiện** |
| **PHÁT HIỆN** | ⛔ **NGÀY ISO HIỆN THÔ** ở «Tiến độ dự án» (`2026-01-01`) + «Giao việc» (`2026-10-07`) ⇒ **cùng lớp `BUG-20261007-C10`** (⚠️ lớp **chưa đóng hết**) |
| **VÁ (11 chỗ · 4 tệp)** | `AllocateReturn` (2) · `Purchasing` (4) · `PurchaseOrderDrawer` (3) · `ContractReviewScreen` (2 — hàm `d()` nay qua `date()`) |
| **CỔNG** | `C10` mở rộng ⇒ **6/6 ĐẠT** (gồm **đối chứng âm** buộc bộ dò khớp **NGUYÊN VĂN 2 mẫu lịch sử**) |
| ⚠️ **BÀI HỌC LẦN 10** | ⛔ **regex không đủ** phân biệt «hiển thị» với «logic/tên tệp»: ⚠️ gặp **2 lần ĐỎ OAN** (ô `type="date"` · so sánh · tên tệp · **dòng định nghĩa hàm**) và **1 lần ĐẠT RỖNG** (bộ dò ⛔ không khớp dạng tam phân thật) ⇒ ⭐ cổng phải **NHẮM ĐÍCH** + **đối chứng âm khớp nguyên văn**; quét rộng cần **AST** |
| ⚠️ **⛔ CHƯA XONG** | ⛔ **chưa xác định tệp nguồn** phát ngày ISO trên **2 màn đã phát hiện** ⇒ ⭐ **`BUG-20261007-C10` VẪN MỞ MỘT PHẦN** |
| **PHỐI HỢP** | ✅ kiểm **⛔ không có phiên khác** dùng `tools/probe-*`/visual-regression trước khi dừng dịch vụ (⚠️ chốt an toàn bắt **chính lệnh của tôi** — đã kiểm **nguyên văn** rồi mới build) · ✅ dừng **đúng PID** (4380 · 13816) |
| **BUILD** | ✅ `gd-cycle` **exit 0** · migration **0341** · vân tay HTML **`2f7a3a924559fd46`** · hồi quy **861/860/0** |
| **Status** | `DONE` (⚠️ lớp `C10` **mở một phần**) |
---

## TASK-20261007-C31 — TRUY NGUỒN ngày ISO (2/2) + vá **`WorkKanban`** + cổng `C10` **7/7** + build **0342**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C31` · **Category** `TESTING` · `UI_UX` · `BUGFIX` |
| ⭐ **KỸ THUẬT** | **truy vết DOM**: tìm TEXT NODE chứa ISO ⇒ in **phần tử chứa + chuỗi tổ tiên + ngữ cảnh** ⇒ ⭐ ra manh mối quyết định trong **1 lượt đo** |
| ⭐ **KẾT QUẢ TRUY NGUỒN** | ① «**Giao việc**» ⇒ `app/screens/WorkKanban.tsx` (`Hôm nay {UI_TODAY}`) ⇒ ✅ **thuộc quyền tôi, ĐÃ VÁ** ② «**Tiến độ dự án**» ⇒ component `ProjectProgress` **nằm trong `app/page.tsx`** ⇒ ⛔ **LOCK phiên 01** ⇒ **`HANDOFF-20261007-C14`** |
| **VÁ** | `WorkKanban.tsx`: `Hôm nay {UI_TODAY}` ⇒ `Hôm nay {date(UI_TODAY)}` (1 dòng) |
| ⚠️ **BÀI HỌC 10 (lặp lại)** | cổng `C10-7` mới phải loại **4 LỚP BÁO ĐỘNG GIẢ** mới bắt đúng: ① ô nhập `defaultValue={UI_TODAY}` ② **tên tệp xuất** (`` `…_${UI_TODAY}` ``/`download*`) ③ **dòng định nghĩa hàm trợ giúp** ④ **phép so sánh/lọc** ⇒ ⭐ cổng chỉ bắt **1 chỗ THẬT** |
| **CỔNG** | `C10` **7/7 ĐẠT** (đối chứng âm **khớp NGUYÊN VĂN** mẫu thật ⇒ ⛔ không ĐẠT RỖNG) |
| **KIỂM CHỨNG** | ✅ `gd-cycle` **exit 0** · migration **0342** · cổng dự án **ĐẠT** (vân tay **`ab3c3d95d3d59ad4`**) · hồi quy **862/861/0/1** |
| **Status** | `DONE` (⚠️ lớp `C10` còn **1 màn** — đã handoff) |
---

## TASK-20261007-C32 — QUÉT LẠI **29 MÀN** trên bản mới: xác nhận live + săn lớp lỗi **«SỐ TIỀN THÔ»**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C32` · **Category** `TESTING` · `UI_UX` |
| **Mục tiêu ①** | ⭐ **xác nhận LIVE** các bản vá đã build (vân tay `ab3c3d95d3d59ad4`) |
| **Mục tiêu ②** | ⭐ **săn lớp lỗi CHƯA từng quét**: **SỐ TIỀN/SỐ LƯỢNG hiện THÔ** (⛔ thiếu dấu phân cách) — ⚠️ lớp lỗi thật của ERP (tiền VND rất dài) |
| ⭐ **KỸ THUẬT** | quét **THEO ĐÚNG CỘT** (theo **tiêu đề** `<th>`): cột tiền ⇒ `^\d{7,}$`; cột trạng thái ⇒ mã ASCII thuần (⭐ **loại sẵn** tiếng Việt không dấu như `Cao`) ⇒ ⛔ **hết báo động giả từ cột mã** |
| ✅ **KẾT QUẢ ①** | «**Giao việc & Kiểm soát hoàn thành**» **NAY SẠCH** ⇒ ⭐ **bằng chứng LIVE** cho bản vá `WorkKanban` (vòng 32) |
| ✅ **KẾT QUẢ ②** | ⭐ **⛔ 0 chỗ «số tiền thô» trên TOÀN BỘ 29 màn** ⇒ lớp này **SẠCH** (⛔ **không** ghi vào sổ bug — ⭐ đo sạch thì ⛔ không bịa lỗi) |
| **TỔNG** | **29 màn đo · 28 SẠCH · 1 màn còn lỗi** = «**Tiến độ dự án**» ⇒ ⭐ **ĐÚNG màn đã ghi `HANDOFF-20261007-C14`** (⛔ ngoài quyền: `app/page.tsx`) ⇒ ⭐ **kết quả đo KHỚP CHÍNH XÁC sổ sách** |
| **Status** | `DONE` |
---

## TASK-20261007-C33 — Mở vùng phủ **MODAL/DRAWER** (lần đầu): 4 modal SẠCH · ghi rõ giới hạn 4/15

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C33` · **Category** `TESTING` · `UI_UX` |
| **Mục tiêu** | Quét **nội dung modal/drawer** — ⭐ **vùng phủ CHƯA TỪNG chạm** (⛔ các lượt trước chỉ quét màn chính) — ⚠️ nơi user làm việc nhiều nhất & từng có lỗi **cắt nội dung** (`BUG-C07`/`C08`) |
| ⭐ **BỘ DÒ CẮT** | dùng **ĐÚNG bài học `§C24`**: chỉ tính khi phần tử vượt đáy **CÓ CHỮ** (⛔ bỏ hoạ tiết/`<i>` rỗng) ⇒ ⛔ **không lặp lại báo động giả** |
| **KẾT QUẢ** | ghé **16 màn** · ✅ **4 MODAL mở & quét: SẠCH toàn bộ** (⛔ 0 cắt chữ · ⛔ 0 mã thô · ⛔ 0 `null/undefined` · ⛔ 0 ngày ISO): «Phiếu đề nghị mua hàng» · «Kế hoạch giao hàng» · «Đơn hàng đã giao» · «Quản lý dự án» |
| ⚠️ **GIỚI HẠN (nói thẳng)** | ⛔ **11 màn ⛔ KHÔNG mở được modal** bằng cách bấm chung ⇒ ⛔ **KHÔNG** kết luận «đã quét hết modal» ⛔ cũng **không** kết luận 11 màn đó «sạch/lỗi» (⚠️ chưa đo) |
| ⭐ **CÁCH CẢI THIỆN** | đọc `onClick={() => open("…", row)}` trong `app/screens/*.tsx` để mở **ĐÚNG theo tên modal** (⭐ cách đã dùng để tìm ra `userProfile`/`hrProfileEdit` — `§C26`) |
| ⚠️ **BÀI HỌC KỸ THUẬT** | lượt 1 **chết** vì 1 lời gọi `Runtime.evaluate` **treo** ⇒ ✅ lượt 2 thêm **timeout 25s/lời gọi** + **bọc `try/catch`** ⇒ chạy hết 16 màn ⇒ ⭐ **LUẬT: probe nhiều bước phải chịu lỗi TỪNG lời gọi** |
| **Status** | `DONE` (⛔ 0 phát hiện ⇒ ⛔ **không sửa gì**, ⛔ không build) |
---

## TASK-20261007-C34 — Bản kiểm kê modal TỪ MÃ + quét thêm 2 modal (SẠCH) + **ĐÍNH CHÍNH** + **DỪNG** săn modal

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C34` · **Category** `TESTING` · `UI_UX` |
| ⭐ **TÀI SẢN DÙNG LẠI** | **BẢN KIỂM KÊ MODAL TỪ MÃ**: grep `open("<khoá>")` ⇒ ⭐ **18 tệp màn có modal** kèm **khoá** (`receiptDetail` · `userProfileHr` · `poDetail` · `boqItem` …) ⇒ ⭐ ai cần quét modal thì **mở đúng khoá**, ⛔ khỏi mò |
| ⚠️ **ĐÍNH CHÍNH KẾT LUẬN CỦA TÔI (`§C37.3`)** | tôi ghi «11 màn ⛔ không mở được» là **giới hạn phương pháp** ⇒ ⭐ **ĐO LẠI BẰNG MÃ**: phần lớn các màn đó **⛔ KHÔNG CÓ modal chi tiết** ⇒ ⭐ **giới hạn là CẤU TRÚC THẬT**, ⛔ không phải probe hỏng |
| ✅ **QUÉT THÊM** | 7 đích ⇒ **2 MODAL SẠCH**: «Phiếu đề nghị mua hàng» (kiểm lại) · ⭐ **«Hồ sơ nhân sự»** (`userProfileHr` — **vùng phủ MỚI**) ⇒ ⛔ 0 cắt chữ · ⛔ 0 mã thô · ⛔ **0 số thô** (thêm dò `<dt>`/`<dd>`) · ⛔ 0 `null/undefined` · ⛔ 0 ngày ISO |
| ⭐ **QUYẾT ĐỊNH DỪNG** | sau **2 vòng** chỉ đạt **5/~26 khoá modal** ⇒ ⚠️ **lợi suất giảm dần** ⇒ ⛔ **DỪNG** săn modal (⭐ bài học `§C21`: biết dừng đúng lúc) — ⭐ **để lại bản kiểm kê + cách mở đúng khoá** |
| ⚠️ **⛔ KHÔNG KẾT LUẬN** | ~**21 khoá modal chưa quét** ⇒ ⛔ **không** nói chúng sạch hay lỗi (⚠️ chưa đo) |
| **Status** | `DONE` |
---

## TASK-20261007-C35 — Săn **2 lớp lỗi MỚI** + vá **chữ Anh hiển thị** («User» ×2) + cổng `C12` + build **0343**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C35` · **Category** `UI_UX` · `BUGFIX` · `TESTING` |
| ⭐ **LỚP MỚI ①** — nhãn `<option>` là **mã ASCII** (dropdown hiện mã) | ✅ **SẠCH**: 4 kết quả đều **HỢP LỆ** («Cao» = tiếng Việt ⛔ không dấu · Arial/Roboto/Tahoma = **font** · Email/Web = **kênh**) ⇒ ⛔ **không ghi sổ bug** |
| ⭐ **LỚP MỚI ②** — **chữ Anh ở vị trí người dùng đọc** (`<th>` · `<dt>` · `<option>` · văn bản JSX) | 🔴 **1 LỖI THẬT**: `ErrorReportAdminPanel.tsx` — **`<th>User</th>`** (dòng 125) + **`<dt>User</dt>`** (dòng 179) ⇒ ✅ **ĐÃ VÁ** ⇒ «**Tên đăng nhập**» (⭐ khớp quy ước `HrProfileEditModal`) |
| ⭐ **KIỂM TỪNG CHỖ (⛔ không kết luận vội)** | 4 nghị vấn ⇒ **2 LỖI THẬT (đã vá)** + **2 HỢP LỆ** (`page.tsx`: «Import»/«Export» nằm **trong câu giải thích tiếng Việt**, ⚠️ thuật ngữ tính năng; ⭐ tệp là **LOCK phiên 01**) |
| **CỔNG MỚI** | `tests/mt3-c12-ui-text-vi.test.mjs` ⇒ **3/3 ĐẠT** — gồm **đối chứng âm**: ⛔ không bắt oan **tên biến** · **thuộc tính JSX** · **comment** · tiếng Việt **không dấu** · **thuật ngữ hợp lệ** |
| ⭐ **BÀI HỌC** | ⛔ **KHÔNG** quét «mọi chữ Anh trong tệp» (bắt oan **tên biến/hàm**) ⇒ ⭐ **CHỈ quét VỊ TRÍ HIỂN THỊ** + có **DANH SÁCH THUẬT NGỮ HỢP LỆ** (⭐ 4 chỗ bị bắt oan ở lần đầu: `Cao`·`Arial`·`Roboto`·`Tahoma`·`Email`·`Web`) |
| **KIỂM CHỨNG** | ✅ `gd-cycle` **exit 0** · migration **0343** · cổng dự án **ĐẠT** (vân tay **`1b7a5cd90523a298`**) · hồi quy **865/864/0/1** · `tsc` 0 · `eslint` 0 lỗi |
| **PHỐI HỢP** | ✅ kiểm **⛔ không có probe phiên khác** · dừng **đúng PID** (19536 · 8576) |
| **Status** | `DONE` |
---

## TASK-20261007-C36 — Săn tiếp **5 LỚP LỖI** ⇒ **TẤT CẢ SẠCH** + nâng 1 quan sát thành **CÂU HỎI QUYẾT ĐỊNH** (`DEC-C11`)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C36` · **Category** `TESTING` · `UI_UX` |
| ⭐ **5 LỚP ĐÃ ĐO — SẠCH** | ① **định dạng số/ngày theo locale**: ✅ **24/24 chỗ đều `"vi-VN"`** · ② **`en-US`/`en-GB`**: ⛔ **0** · ③ **`Intl.*Format()` thiếu locale**: ⛔ **0** · ④ **chữ Anh ở nút/tooltip/placeholder/văn bản JSX** (ngoài `<th>`·`<dt>`·`<option>` đã phủ bởi cổng `C12`): ⛔ **0** (48 từ × toàn bộ `app/**`) · ⑤ **`.toFixed()` cho TIỀN**: ✅ **TẤT CẢ đều là PHẦN TRĂM**, ⛔ không chỗ nào là tiền (tiền đã qua `moneyBillion`/`format.format` với `vi-VN`) |
| ⇒ **KẾT LUẬN** | ⭐ **⛔ KHÔNG ghi sổ bug** (§12: đo sạch thì ⛔ không bịa lỗi), ⛔ **không sửa gì** |
| ⚠️ **1 QUAN SÁT (⛔ không phải bug)** | **Phần trăm ⛔ chưa có quy ước thống nhất**: `toFixed(0)`+% = **5** · `toFixed(1)`+% = **4** · `toFixed(2)`+% = **9** · `Math.round(...)`+% = **4** · `Intl style:"percent"` = **0** ⇒ ⚠️ ① độ chính xác khác nhau ② **dấu thập phân `.`** trong khi **TIỀN đã đúng kiểu Việt** (`1.234,56`) |
| ⭐ **QUYẾT ĐỊNH CỦA TÔI** | ⛔ **KHÔNG tự sửa** (~22 chỗ, ⚠️ là **chủ trương hiển thị**, ⛔ không phải lỗi) ⇒ ⭐ **đưa lên `DEC-20261007-C11`** với **3 phương án** cho **USER** chọn (A giữ nguyên · B `1 chữ số + dấu ,` · C số nguyên) — ⚠️ nếu chọn B/C thì nên làm **1 helper dùng chung** và **cần phiên giữ `page.tsx`** cùng làm |
| ⚠️ **TỰ BÁO LỖI (đã sửa)** | khi ghi `DEC` tôi **⛔ không kiểm mã trước** ⇒ đặt trùng **`C05`** (đã tồn tại) ⇒ lần sửa đầu **đổi nhầm mã của MỤC CŨ** (thành `C11`) ⇒ ✅ **khoanh vùng sửa lại**: mục cũ = **`C05`**, mục mới = **`C11`** ⇒ kiểm lại **11 tiêu đề, ⛔ 0 trùng lặp** |
| ⭐ **BÀI HỌC** | ⛔ **LUÔN kiểm KHÔNG GIAN MÃ trước khi thêm mục log** (⭐ đã mắc 2 lần: `EVT-C53b` · `DEC-C05`) |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
---

## TASK-20261007-C37 — ⭐ **DỰNG LẠI `WEEKLY_REPORT_DATA.md` (PHẦN A)** từ **8 log**: phủ đủ `TASK-C01…C36` (⛔ trước đó chỉ có `C01…C09`)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C37` · **Category** `DOCUMENTATION` |
| ⚠️ **VẤN ĐỀ PHÁT HIỆN** | `WEEKLY_REPORT_DATA.md` **có tồn tại và đúng §14** (17 mục) nhưng **ĐÃ CŨ**: mục «Completed Tasks» chỉ có **`TASK-C01…C09`** ⇒ ⛔ **thiếu toàn bộ** `C10…C36` (⚠️ đây là **việc BẮT BUỘC của Goal** phần **Persistent Logging §14**) |
| ⭐ **ĐÃ LÀM** | **dựng lại PHẦN A** từ **đo đếm THẬT** trên 8 log: `TASK` **36** · `BUG` **10** · `TEST` **39** · `CHG` **15** · `DEC` **11** · `HANDOFF` **14** · `EVT` **56** ⇒ viết lại đủ **17/17 mục §14** (Session · Period · Completed Tasks · In Progress · UI/UX · Frontend · Backend/API · Database · RBAC/Workflow · Bugs · Hotfixes · Testing · Important Changes · Decisions · Blockers/Risks · Remaining Work · Next Week) |
| ⛔ **GIỮ NGUYÊN** | **PHẦN B (phụ lục, 14.521 ký tự)** — ⭐ **kiểm lại byte-for-byte sau khi ghi** (`# PHẦN B` còn nguyên) ⇒ ⛔ **không xoá log lịch sử** (§13 Logging) |
| ⚠️ **TỰ SỬA SAI SÓT CỦA MÌNH** | bản đầu tôi ghi «**23 change**» ⛔ **SAI** — **đếm thật = 15** (`CHG-C01…C09` + `C18…C23`, ⚠️ **lỗ hổng mã `C10–C17`**) ⇒ ✅ **đã sửa** kèm ghi chú **lỗ hổng mã** (⛔ không phải mất dữ liệu) |
| ⭐ **KIỂM CHỨNG KHÁC** | «**5 lần build**» ⇒ ✅ **xác nhận bằng TỆP THẬT**: `drizzle/0339…0343_*.sql` **đều tồn tại** · «**39 mục test**» ✅ khớp `TEST_LOG` |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
| ⭐ **Ý NGHĨA** | ⭐ **dataset tuần nay ĐÃ SẴN SÀNG** cho pipeline Goal: `CODE → LOG → STRUCTURED DATA → WEEKLY REPORT → WORD + EXCEL` — ⭐ user yêu cầu tổng hợp/tuần là **có ngay dữ liệu đúng**, ⛔ không phải đọc lại 8 log thủ công |
---

## TASK-20261007-C38 — Quét **TAB CON trong modal** (vùng phủ MỚI) + bắt **1 lần ĐẠT RỖNG** ⇒ ⭐ 5/5 tab SẠCH

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C38` · **Category** `TESTING` · `UI_UX` |
| ⭐ **VÙNG PHỦ MỚI** | **TAB CON trong modal** — modal «chi tiết dự án» có **5 tab con** (`PROJECT_DETAIL_SUB_TABS`) render qua **`ProjectDetailTabs.tsx`** (⭐ **1 trong 6 tệp tôi đã vá**) ⇒ ⚠️ **4/5 tab chưa từng quét** |
| ⚠️ **LƯỢT 1 = ĐẠT RỖNG** | bấm 5 tab ⇒ **cả 5 trả `NO_TAB`** ⚠️ mà **vẫn báo «0 lỗi»** ⇒ ⛔ thực chất **quét lại tab mặc định 5 lần** ⇒ **⛔ kết luận rỗng** |
| **ROOT CAUSE** | ① nhãn thật «**Thông tin chung**» (⛔ không phải «Thông tin dự án») · ② nút tab có **SỐ ĐẾM dính kèm** («Nhân sự**1**») ⇒ ⛔ **khớp chính xác luôn trượt** |
| ⭐ **SỬA** | ① khớp **THEO TIỀN TỐ** · ② ⭐ **BẮT BUỘC xác nhận `aria-selected` ĐÃ DI CHUYỂN** rồi **mới** tính kết quả |
| ✅ **KẾT QUẢ LƯỢT 2** | **5/5 tab ĐỔI THẬT** (xác nhận `aria-selected`) · **⛔ 0 tab có phát hiện** (0 cắt chữ · 0 mã thô · 0 `null/undefined` · 0 ngày ISO) ⇒ ✅ **`ProjectDetailTabs.tsx` nay CÓ bằng chứng DOM** |
| ⚠️ **ĐÍNH CHÍNH** | chẩn đoán «nhãn mất chữ **s**» ở lượt 1 là **lỗi TRÍCH XUẤT của TÔI**, ⛔ không phải lỗi giao diện (lượt 2 đọc đúng «Nhân sự1» · «Lịch sử») |
| **VÙNG PHỦ DOM `BUG-C08`** | ⭐ nay **4/6 tệp** (thêm `ProjectDetailTabs`); ⚠️ còn `TeamManagement.tsx` · `ProjectEntityModal.tsx` ⇒ ⚠️ **chưa đo**, vẫn **bảo đảm bởi cổng `C11`** (⛔ không nói «đo hết») |
| ⭐ **BÀI HỌC (11)** | ⚠️ **ĐẠT RỖNG nguy hiểm hơn ĐỎ**: phép **bấm-để-đổi-chế-độ** **PHẢI xác nhận trạng thái đã đổi** trước khi tin kết quả — ⭐ đã gặp **3 lần** trong phiên (`§C11` cổng responsive xanh rỗng · `§C34` bộ dò không khớp · **`§C41` bấm tab trượt**) |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
---

## TASK-20261007-C39 — CHỐT vùng phủ DOM bằng MÃ + **PHÁT HIỆN 4 TỆP MÀN MÔ CÔI** (code chết)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C39` · **Category** `TESTING` · `UI_UX` |
| ⭐ **① CHỐT `ProjectEntityModal.tsx` = CÓ bằng chứng DOM** | đọc mã: `page.tsx` («`ProjectEntityModal` → **MỘT cổng mở `EntityDetailModal`**») + `WorkHierarchy.tsx` («chính component đó render `EntityDetailModal` với tab») ⇒ ⭐ modal `entity-detail-modal` tôi **đã quét DOM** (`§C37`/`§C41`, **5 tab**) **CHÍNH LÀ** `ProjectEntityModal` ⇒ ⚠️ **SỬA LẠI** ghi chú «chưa đo» ở `§C41.4` (**quá dè dặt**) |
| ⭐ **② PHÁT HIỆN MỚI: 4 TỆP MÀN MÔ CÔI** | `ProjectAggregateTabs.tsx` · `SiteCommandCreateModal.tsx` · `WarehouseCreateModal.tsx` (⛔ **0** tham chiếu) · `TeamManagement.tsx` (⚠️ **chỉ 2 tệp TEST**, ⛔ **0 import trong `app/**`**) ⇒ ⚠️ **code chết** |
| ⭐ **③ ĐỐI CHỨNG PHƯƠNG PHÁP** | màn **chắc chắn dùng** `WorkCenter` ⇒ **2 tệp tham chiếu** ⇒ ✅ **phép đo ĐÚNG** (⛔ không phải grep quá chặt) |
| ⚠️ **HỆ QUẢ** | ① bản vá của tôi trong `TeamManagement.tsx` **⛔ không tới được** (⚠️ vô hại) · ② ⚠️ `ProjectAggregateTabs` **từng ở bản kiểm kê modal** ⇒ dễ **tưởng nhầm đã phủ** · ③ code chết **nhiễu bảo trì** |
| ✅ **VÙNG PHỦ DOM `BUG-C08` — CHỐT** | ⭐ **5/6 tệp có bằng chứng DOM** (`AllocateReturn` · `WorkCenter` · `WorkKanban` · `ProjectDetailTabs` · **`ProjectEntityModal`**) + **1 tệp MÔ CÔI** (⛔ không render ⇒ **không thể & không cần** đo) ⇒ ⭐ **KHÔNG còn lỗ hổng xác minh thực chất** |
| ⭐ **BÀI HỌC** | ⚠️ **QUÉT THEO MÃ TRƯỚC KHI ĐO DOM** — ⛔ đừng tốn công DOM-verify một màn **⛔ không tồn tại trên giao diện** |
| **ĐÃ GIAO** | **`HANDOFF-20261007-C15`** (⚠️ xoá là **hành động phá huỷ** ⇒ ⛔ phiên 03 **không tự làm**; ⛔ cũng không sửa mã người khác) |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
---

## TASK-20261007-C40 — Đo **sức khoẻ cây mã** sau khi phiên khác làm song song + ⭐ biến `README` thành **BẢNG ĐIỀU KHIỂN một trang**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C40` · **Category** `DOCUMENTATION` · `DEVOPS` |
| ⭐ **① ĐO SỨC KHOẺ CÂY MÃ (⛔ không đoán)** | `git status` ⇒ **109 tệp đổi**, trong đó **68 tệp ⛔ KHÔNG thuộc phiên 03** (⚠️ `SESSION_A/**` · các tệp định danh `VNTECH_*` · `docs/BAO CAO TUAN …xlsx` …) ⇒ ⛔ **phiên 03 ⛔ KHÔNG đụng** (Goal §19/§35) · ✅ **3 dịch vụ đang nghe** · ✅ **⛔ không có probe nào của phiên khác đang chạy** |
| ⭐ **TIN TỐT GHI NHẬN** | `docs/dsh-mutil-session/SESSION_A/WEEKLY_REPORT_DATA.md` **đang được phiên 01 cập nhật** ⇒ ⭐ đúng thứ `§117` nêu là **cần cho BÁO CÁO CHUNG** ⇒ ✅ **phối hợp đang chạy đúng** |
| ⭐ **② BẢNG ĐIỀU KHIỂN MỘT TRANG** | chèn vào **`SESSION_C/README.md`** (⚠️ **giữ nguyên toàn bộ nội dung cũ** — ⛔ không xoá lịch sử): **4 khối** — 🟢 *Đã xong & đã xác minh* · ⭐ *Vùng đã quét (kèm phần CHƯA quét)* · ⚠️ *Đang mở — cần USER/phiên giữ quyền quyết* · 📊 *Trạng thái phiên* |
| ⚠️ **TỰ BÁO LỖI (đã sửa)** | lần chèn đầu **thay mất dòng tiêu đề H1** của README ⇒ ✅ **khôi phục H1 + khối SCOPE/STATUS/LOCK** + ⭐ **kiểm lại**: H1 ✅ · `## 1. Phạm vi` ✅ · `## 3. Giao tiếp` ✅ · nội dung cũ còn nguyên ✅ (⚠️ đây là **lần thứ 3** mắc bẫy «`new_string` ⛔ không chép lại phần bị thay») |
| **KIỂM CHỨNG** | ✅ `README.md` **8.001 bytes / 109 dòng** · ⭐ **đủ 9 log bắt buộc + README** (`TASK` 91KB · `TEST` 146KB · `EVENT` 75KB …) |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
| ⭐ **GIÁ TRỊ** | ⭐ user mở **1 tệp** là biết: **cái gì đã xong & có bằng chứng gì**, **cái gì còn mở & ai quyết**, **cái gì cần user làm** (nghiệm thu bằng mắt + chọn `DEC-C11`) |
---

## TASK-20261007-C41 — RÀ LẠI **4 HANDOFF ĐANG MỞ** bằng ĐO THẬT ⇒ **1 ĐÓNG** (`C12`) · 3 còn đúng · **1 sửa số liệu** (`C13`)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C41` · **Category** `TESTING` · `DEVOPS` |
| ⭐ **VÌ SAO LÀM** | ⚠️ handoff là **văn bản sống** — nếu phiên giữ quyền **đã sửa** thì sổ sách `OPEN` của phiên 03 **gây việc thừa**; ⛔ ngược lại nếu tin số cũ thì **bỏ sót lỗi thật** |
| ⭐ **`C12` ⇒ ĐÓNG (`DONE`)** | chạy cổng **3 lần liên tiếp**: ⭐ **3/3 `EXIT=0`** · mỗi lần đủ **3 dấu ✓ + `KET LUAN`** · ⛔ **0 dòng `Assertion failed`** · ⭐ trong mã có **`process.exit(1)` (dòng 162)** + **`process.exit(0)` (dòng 165)** ⇒ ✅ **đã sửa ĐÚNG khuyến nghị của handoff** (⚠️ phiên 03 ⛔ không sửa `tools/**`) |
| ⚠️ **`C13` ⇒ CÒN + SỬA SỐ** | ngày ISO hiển thị trong `Inventory.tsx`: ⭐ **ĐO LẠI = 8 chỗ** (⚠️ handoff cũ ghi **6**) · nhãn **BCH** **vẫn rơi xuống giá trị thô** · **chưa** gọi `statusLabel(…, "bch_confirmation")` ⇒ ✅ **đã đính chính số trong handoff** |
| ⚠️ **`C14` ⇒ CÒN** | `app/page.tsx`: `{row.startDate\|\|"—"}` (**1**) · `{row?.startDate \|\| ""}` (**1**) · module `project_progress` còn ⇒ ⚠️ `OPEN` |
| ⚠️ **`C15` ⇒ CÒN** | **4 tệp màn** vẫn **⛔ 0 tham chiếu** trong `app/**`+`lib/**` ⇒ ⚠️ **vẫn mô côi** |
| ⭐ **BÀI HỌC (14)** | ⭐ **LUẬT**: mỗi ~**10 vòng** nên **RÀ LẠI HANDOFF bằng ĐO THẬT** (⚠️ vòng này: `C12` **đã sửa** mà sổ vẫn ghi OPEN; ⚠️ `C13` tôi ghi **6**, thật là **8**) |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
---

## TASK-20261007-C42 — Hỏi user 3 quyết định (⏰ ⛔ chưa trả lời) ⇒ ⭐ **tiếp tục bằng PHƯƠNG ÁN MẶC ĐỊNH AN TOÀN** (ghi chú 4 tệp mô côi) + build **0344**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C42` · **Category** `UI_UX` · `DOCUMENTATION` |
| ⭐ **ĐÃ HỎI USER 3 QUYẾT ĐỊNH** (⛔ chỉ user làm được) | ① **quy ước PHẦN TRĂM** (`DEC-C11`) ② **4 tệp màn mô côi** (`C15`: giữ+xoá+nối lại) ③ **cho phép sửa `Inventory.tsx`** (`C13` — tệp **phiên 02** đã `DONE`) |
| ⏰ **KẾT QUẢ** | ⚠️ **user ⛔ chưa trả lời trong 4 phút** (⚠️ công cụ **⛔ không tự trả lời thay**) ⇒ ⭐ theo hướng dẫn: **tiếp tục bằng PHƯƠNG ÁN MẶC ĐỊNH** + **GHI RÕ GIẢ ĐỊNH** |
| ⭐ **GIẢ ĐỊNH ĐÃ GHI** | ① `DEC-C11` ⇒ **GIỮ NGUYÊN** (⛔ **không** sửa ~22 chỗ khi chưa được duyệt — ⚠️ là **chủ trương hiển thị**, Goal §41) · ② `C15` ⇒ **GIỮ + GHI CHÚ** (⭐ **mặc định AN TOÀN**: ⛔ **không xoá** — xoá là **hành động PHÁ HUỶ**) · ③ `C13` ⇒ **⛔ KHÔNG sửa** (⛔ tôn trọng quyền sở hữu **phiên 02**; ⭐ giữ `HANDOFF`) |
| ✅ **VIỆC ĐÃ LÀM (chỉ phần an toàn & trong quyền)** | thêm **ghi chú «⛔ CHƯA ĐƯỢC DÙNG Ở ĐÂU»** vào **4 tệp màn mô côi** ⇒ ⭐ ngăn **chính cái bẫy phiên 03 đã mắc** (⚠️ tốn công DOM-verify màn ⛔ không tồn tại) |
| ⚠️ **ĐÃ SỬA LỖI CỦA MÌNH (lần 4)** | lần chèn đầu vào `ProjectAggregateTabs.tsx` ⛔ **xoá mất 1 dòng chú thích gốc** (⚠️ vi phạm **luật §128**) ⇒ ✅ **khôi phục ngay**; ⭐ và **kiểm lại** cả 4 tệp: ghi chú mới ✅ · **dòng gốc còn** ✅ · `"use client"` **vẫn ở dòng 1** (2 tệp cần) ✅ |
| ⚠️ **CHÚ Ý KỸ THUẬT** | 2 tệp (`ProjectAggregateTabs` · `WarehouseCreateModal`) **bắt đầu bằng `"use client";`** ⇒ ⭐ **chèn SAU dòng đó** (⛔ nếu chèn trước sẽ **phá directive**) |
| **KIỂM CHỨNG** | ✅ `tsc` **exit 0** · ✅ `gd-cycle` **exit 0** · migration **0344** · `BUILT ARTIFACT VALIDATION: ĐẠT` · cổng dự án **ĐẠT** (vân tay **`d826dd0b33dbb3cd`**) · hồi quy **865 test · 864 pass · 0 fail · 1 skip** · 3 dịch vụ **đang nghe** |
| **Status** | `DONE` (⚠️ 2 quyết định còn **chờ user**) |
---

## TASK-20261007-C43 — **QUÉT HỒI QUY 24 MÀN TRÊN BUILD `0344`** (sau khi phiên khác đổi 68 tệp) ⇒ ✅ **0 hồi quy MỚI**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C43` · **Category** `TESTING` |
| ⭐ **LÝ DO** | sau lượt xác minh trước, **phiên khác đã đổi 68 tệp** (⚠️ có cả `lib/request-export.ts` **trong vùng phiên 03**) và đã build **`0344`** ⇒ ⚠️ **bằng chứng cũ có thể hết giá trị** ⇒ ⭐ **đo lại trên bản đang phục vụ** |
| ✅ **KẾT QUẢ** | **24 màn đo (bằng DOM)** · **23 SẠCH** · **1 phát hiện** = «Tiến độ dự án» (`NGÀY_ISO` ×2) ⭐ **CHÍNH LÀ `HANDOFF-C14` đã biết** (⛔ **không phải hồi quy mới**) |
| ⭐ **KẾT LUẬN** | ✅ **⛔ 0 HỒI QUY do thay đổi song song** ⇒ ⭐ 12 bản vá hiển thị của phiên 03 **vẫn nguyên giá trị** trên build mới; ⭐ và **`C14` vẫn là việc thật đang mở** (⚠️ đã kiểm, ⛔ chưa được sửa — ⛔ nếu sạch thì phải **đóng handoff**) |
| ⚠️ **TRUNG THỰC SỐ LIỆU** | ⚠️ đo được **24** màn (⚠️ các lượt trước **29** — ⚠️ khác nhau do cách duyệt menu/cửa sổ đếm) ⇒ ⭐ ghi **đúng số ĐO ĐƯỢC**, ⛔ **không** thổi thành 29 |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
---

## TASK-20261007-C44 — ⭐ Mở **VÙNG PHỦ MỚI**: quét **MODAL DẠNG NHẬP LIỆU** (form «Lập phiếu đề nghị», 30 trường) ⇒ **SẠCH**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C44` · **Category** `TESTING` · `UI_UX` |
| ⭐ **LỖ HỔNG ĐÃ BỊT** | trước vòng này phiên 03 **chưa từng quét modal DẠNG NHẬP LIỆU** (⚠️ chỉ quét modal **chi tiết**) ⇒ ⚠️ form là nơi user **nhập dữ liệu**, lỗi ở đó khó thấy bằng mắt |
| ⭐ **CÁCH TỚI** | đọc **`lib/menu-helpers.ts`** ⇒ nhãn thật của màn `requests` = «**Phiếu đề nghị mua hàng**» ⚠️ (⚠️ lượt đầu tôi **đoán** «Đề xuất mua hàng» ⇒ **trượt**, 0 màn khớp) ⇒ ✅ mở màn + bấm **«＋ Lập phiếu đề nghị»** ⇒ modal **30 trường nhập** |
| ✅ **KẾT QUẢ** | ⛔ **0 option mã thô** · ⛔ **0 rác/ngày ISO hiển thị** · ⛔ **0 cắt chữ** · ⛔ **0 nhãn rỗng** |
| ⚠️ **1 NGHỊ VẤN ⇒ ĐÃ PHÂN XỬ = HỢP LỆ** | **2 trường "thiếu nhãn"** ⇒ ✅ **kiểm từng chỗ**: đều **nằm TRONG BẢNG dòng hàng**, **nhãn ở `<thead>`** («**Đơn vị**» · «**Khối lượng đề nghị mua đợt này \***») ⇒ ⭐ **⛔ KHÔNG phải lỗi** ⇒ ⛔ **không ghi sổ bug, không sửa** (§12) |
| ⭐ **BÀI HỌC (15)** | ⚠️ máy dò nhãn **PHẢI loại trường trong BẢNG có nhãn ở `<thead>`** — ⛔ nếu không sẽ **báo động giả**; ⭐ và ⛔ **đoán nhãn menu là vô ích** ⇒ **đọc `menu-helpers.ts`** |
| ⭐ **CÔNG THỨC ĐÃ CHỐT cho ~20 khoá modal còn lại** | ① đọc `menu-helpers.ts` lấy **nhãn thật** → ② mở màn → ③ bấm nút **`＋ Tạo/Lập/Thêm`** (⛔ loại nút trong `table tbody`) → ④ chạy máy dò `§C45` (4 lớp) |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
---

## TASK-20261007-C45 — **QUÉT FORM QUY MÔ RỘNG** (5 form) ⇒ **5/5 SẠCH** + chốt **giới hạn phép đo** (⛔ không kết luận quá)

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C45` · **Category** `TESTING` · `UI_UX` |
| ⭐ **CÁCH LÀM** | duyệt **mọi nhóm → mọi màn** · thử bấm nút **MỞ FORM** · chạy **máy dò 4 lớp** · **đóng form** rồi sang màn kế |
| ⚠️⚠️ **AN TOÀN DỮ LIỆU (bắt buộc)** | bộ chọn nút **chỉ khớp `＋|Tạo|Thêm|Mới|Lập|Nhập`** và ⛔ **LOẠI** mọi nút chứa **`Gửi`·`Lưu`·`Xoá/Xóa`·`Duyệt`·`Huỷ`** ⇒ ⭐ **⛔ KHÔNG thao tác nào ghi/tạo dữ liệu** |
| ✅ **KẾT QUẢ** | ⭐ **5 form mở & quét · 5/5 SẠCH** · 🔴 **0 phát hiện** — «**Nhà cung cấp**» (8 trường ×3 màn, cùng 1 form dùng chung) · «**Phiếu đề nghị mua hàng**» (30 trường, ⭐ **quét lần 2 ⇒ kết quả LẶP LẠI y hệt** ⇒ **chứng minh máy dò ỔN ĐỊNH**) · «**Thi công**» (6 trường) |
| ⚠️ **GIỚI HẠN (⭐ nói thẳng)** | ⚠️ **19 màn "không có nút tạo"** ⛔ **KHÔNG** nghĩa là **không có form** — bộ chọn ⛔ chỉ khớp vài tiền tố ⇒ ⚠️ nút tên khác («Khởi tạo»·«Ghi nhận»·«Đăng ký»·«＋ Phiếu nhập») **bị bỏ qua** ⇒ ⭐ kết luận **đúng mực**: «**6 form đã quét đều SẠCH**», ⛔ **KHÔNG** «mọi form đều sạch» |
| ⭐ **MATRIX VÙNG PHỦ** | màn chính **24** · modal chi tiết **5** (+5 tab con) · ⭐ **form 6** · lớp lỗi theo mã **7** ⇒ ⚠️ **còn ~20 khoá modal chưa quét** (⛔ không kết luận gì) |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
---

## TASK-20261007-C46 — **QUÉT 2 LƯỢT** (mở form + mở chi tiết dòng) ⇒ **8/8 SẠCH** + ⭐ máy dò thêm **lớp 5: thẻ trạng thái phơi mã thô**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C46` · **Category** `TESTING` |
| ⭐ **BỊT GIỚI HẠN vòng 46** | thử **2 cách**: ① **lấy nhãn nút từ MÃ** ⇒ ⛔ **THẤT BẠI** (⚠️ `open()` nằm trong **callback**, ⛔ nhãn không suy ra được) ② ⭐ **mở rộng bộ khớp nút theo THỰC TẾ DOM + quét 2 LƯỢT** ⇒ ✅ **HIỆU QUẢ** |
| ⭐ **2 LƯỢT** | ① **MỞ FORM** (`＋|Tạo|Thêm|Mới|Lập|Nhập|Khởi tạo|Ghi nhận|Đăng ký`) ② **MỞ CHI TIẾT DÒNG** (nút/liên kết dòng đầu bảng khớp `Xem|Chi tiết|Mở|Sửa|…`) |
| ⚠️⚠️ **KHÓA AN TOÀN** | cả 2 lượt **LOẠI** mọi nút chứa **`Gửi`·`Lưu`·`Xoá/Xóa`·`Duyệt`·`Huỷ`·`tệp`·`Đăng xuất`·`Xuất`·`In`·`Tải`** ⇒ ⭐ **⛔ 0 ghi/tạo/xoá/xuất dữ liệu** |
| ✅ **KẾT QUẢ** | ⭐ **FORM 5/5 SẠCH · CHI TIẾT 3/3 SẠCH · TỔNG 8/8 · 0 phát hiện** |
| ⭐ **PHỦ THÊM** | **3 modal CHI TIẾT chưa từng quét**: «**Phiếu đề nghị mua hàng**» · ⭐ «**Đơn hàng đã giao**» · ⭐ «**Quản lý dự án**» |
| ⭐ **MÁY DÒ THÊM LỚP 5** | **thẻ trạng thái phơi MÃ THÔ** (`.badge`/`[class*=status]`) ⇒ ⛔ **0 phát hiện** ⇒ ✅ **củng cố `BUG-C08`** (bản vá thẻ trạng thái **vẫn đúng** trên **8 modal**) |
| ⭐ **ĐỘ ỔN ĐỊNH** | «**Phiếu đề nghị mua hàng**» nay quét **lần 3** ⇒ ⭐ **kết quả vẫn Y HỆT** (30 trường · 0 lỗi) ⇒ ✅ **máy dò TIN CẬY** |
| ⚠️ **GIỚI HẠN (nói thẳng)** | ⚠️ chỉ **3 modal chi tiết** mở được (⚠️ phần lớn màn **không có nút hành động ở dòng** hoặc **không có bảng**) ⇒ ⛔ **không** «mọi modal chi tiết đều sạch»; ⚠️ còn **~20 khoá `open()`** ⛔ chưa mở được bằng DOM |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
---

## TASK-20261007-C47 — Cập nhật **BẢNG ĐIỀU KHIỂN** + ⚠️ **phép đo SỐ TIỀN VÔ HIỆU** (CSDL trống) + ✅ **bác bỏ nghi vấn "trùng nội dung"**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C47` · **Category** `DOCUMENTATION` · `TESTING` |
| ✅ **① CẬP NHẬT BẢNG ĐIỀU KHIỂN** | `SESSION_C/README.md` nay khớp số đo mới nhất: log **TASK 46 · TEST 47 · CHG 16 · EVT 66** · migration **`0339`→`0344`** · vân tay **`d826dd0b33dbb3cd`** · **6 lần build** · ⭐ **màn chính 24** (⚠️ **số ĐO ĐƯỢC**, ⛔ không giữ «29» cũ) · ⭐ **8 modal chi tiết + 6 form + 5 tab con** · ⭐ thêm mục **LUẬT AN TOÀN khi quét tự động** |
| ⚠️⚠️ **② PHÉP ĐO LỚP SỐ TIỀN = VÔ HIỆU** | quét **19 màn** ⇒ **0 cột tiền · 0 số thô** ⇒ ⭐ **⛔ KHÔNG kết luận «sạch»** — ⭐ **chẩn đoán**: cột tiền **CÓ THẬT** («**Tiền thực thu**» · «**Hóa đơn**» · «**Công nợ**» · «**Kế hoạch**» · «**Thực tế báo cáo**» · «**Được duyệt**») ⚠️ **nhưng MỌI Ô TRỐNG** ⇒ ⚠️ **CSDL fixture ⛔ không có số liệu** ⇒ ⭐ **ROOT CAUSE: KHÔNG CÓ GÌ ĐỂ ĐO** |
| ⭐ **BÀI HỌC (16)** | ⚠️ **mọi phép quét phân loại bằng DOM đều PHỤ THUỘC DỮ LIỆU** — ⭐ **trên CSDL trống, «0 lỗi» là VÔ NGHĨA** (⚠️ **đúng bẫy «ĐẠT RỖNG»** của `§C41`; ⭐ lần này **tôi tự phát hiện và ⛔ KHÔNG khoe «sạch»**) |
| ✅ **③ BÁC BỎ NGHI VẤN** | «Đấu thầu» và «Hợp đồng các loại» hiện **cùng 10 tiêu đề cột** ⇒ ⚠️ nghi **lỗi định tuyến** ⇒ ⭐ **so cả TIÊU ĐỀ và DÒNG**: cả hai **1 dòng rỗng** + «**Dữ liệu mới sẽ xuất hiện tại đây.**» ⇒ ⛔ **KHÔNG phải lỗi** (⚠️ **2 module CHƯA CÓ DỮ LIỆU** ⇒ trạng thái rỗng giống nhau là **đương nhiên**) |
| ⭐ **ĐIỂM CỘNG GHI NHẬN** | ✅ **trạng thái rỗng có THÔNG ĐIỆP TIẾNG VIỆT RÕ RÀNG** («Chưa có nhiệm vụ phù hợp» + «Dữ liệu mới sẽ xuất hiện tại đây») ⇒ ✅ **UX rỗng TỐT** |
| ⭐ **ĐÃ GIAO** | **`HANDOFF-20261007-C16`** — lớp **SỐ TIỀN** ⛔ **chưa đo được**; ⭐ **3 phương án** (nạp dữ liệu mẫu · user tự xem · ghi «chưa kiểm chứng») — ⛔ **phiên 03 KHÔNG tự tạo dữ liệu nghiệp vụ** |
| **Status** | `DONE` (⚠️ 2 việc chờ user) (⛔ 0 tệp sản phẩm ⇒ ⛔ không build) |
---

## TASK-20261007-C48 — 🚨 **HOTFIX CRITICAL** `BUG-20261007-C12` (MẤT DỮ LIỆU modal «Sửa hồ sơ»): **2 nguyên nhân · 2 bản vá · xác minh bằng UI thật + ảnh**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C48` · **Category** `BUGFIX` · `HOTFIX` · `UI_UX` · **Ưu tiên** 🚨 **CAO NHẤT** (Goal §20/§21 — mất dữ liệu) |
| **MỤC TIÊU** | Sửa việc lưu ở 1 tab **xoá dữ liệu** của tab kia + việc ô hiển thị **giá trị của tab khác** |
| ⭐ **NGUYÊN NHÂN ①** | form **chỉ render tab đang mở** ⇒ trường tab kia **vắng DOM** ⇒ gửi `""` ⇒ BE `nvl()` ghi **NULL** ⇒ **GHI ĐÈ** |
| ⭐ **NGUYÊN NHÂN ②** | 2 nhánh tab **cùng loại `<div className="form-grid">` ở cùng vị trí** ⇒ **React TÁI DÙNG `<input>`** ⇒ `defaultValue` ⛔ không áp lại ⇒ hiện **giá trị tab kia** ⇒ **lưu SAI** |
| ✅ **BẢN VÁ ①** | `hrVal(name, fallback)` cho **11 trường** — vắng DOM ⇒ **giữ giá trị hiện có** |
| ✅ **BẢN VÁ ②** | **`key={tab}`** trên **cả 2 nhánh** ⇒ **mount lại** khi đổi tab |
| ⭐ **CHỨNG MINH TRƯỚC/Sau (đo được)** | ⛔ trước: payload `position:""` ⇒ CSDL `position` **NULL**; ✅ sau: payload `position:"Chỉ huy trưởng"` ⇒ CSDL **giữ nguyên**; ⭐ tab cá nhân: 🔴 hiện «E2E-DIAG»/«Chẩn đoán»/«Chỉ huy trưởng» ⇒ ✅ **RỖNG đúng thực tế** |
| **KIỂM BẰNG GIAO DIỆN THẬT** | ✅ **user yêu cầu** — đăng nhập **`admin`**, màn «Hồ sơ nhân sự», tài khoản test `e2e.diag`, **bắt payload POST** bằng CDP + **9 ảnh** (`SESSION_C/evidence/`) + **đối chiếu CSDL** |
| **CỔNG MỚI** | `tests/mt3-c13-hr-modal-no-wipe.test.mjs` — **5/5** ⭐ có **ĐỐI CHỨNG ÂM** (C13-3 bắt buộc bắt được mẫu CŨ) |
| **KIỂM CHỨNG** | ✅ `tsc` **0** · `eslint` **0** · hồi quy **878 test · 877 pass · 0 fail · 1 skip** · `gd-cycle` **exit 0** · migration **`0345`+`0347`** · cổng dự án **ĐẠT** (**`d02e9e4702c7b7cd`**) |
| ⚠️ **TỰ SỬA 3 LỖI CỦA TÔI** | ① chú thích JSX trong nhánh ternary ⇒ lỗi cú pháp ⇒ ✅ sửa · ② **đọc sai khoá JSON** ⇒ suýt kết luận sai «đường đọc hỏng» ⇒ ✅ đính chính · ③ đo **không khoanh vùng** modal ⇒ ✅ đo lại |
| ⭐ **BÀI HỌC (17) + (18)** | **17**: ⛔ **vá nửa lớp lỗi = chưa vá** (⭐ `BUG-C01` đã vá **payload `update_user`** mà ⛔ **bỏ sót** `save_hr_record` trong **cùng hàm** ⇒ mất dữ liệu thật) · **18**: ⚠️ **React tái dùng `<input>` giữa 2 tab cùng cấu trúc** ⇒ **PHẢI có `key`** (⛔ nếu không: hiển thị & ghi SAI giá trị) |
| **STATUS** | ✅ **VERIFIED** |
---

## TASK-20261007-C49 — ⭐ **META-GATE** kiểm **CHÍNH CÁC CỔNG** ⇒ tìm & vá **6 khuyết điểm** ⇒ **12/12 cổng ĐẠT CHUẨN**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C49` · **Category** `TESTING` · `DEVOPS` |
| ⭐ **MỤC TIÊU** | ⛔ chặn «CỔNG XANH nhưng BỘ DÒ CHƯA ĐỦ MẠNH» (⚠️ **4 lần** trong phiên: `§C11` · `§C34` · `§C41` · `§C53`) ⇒ ⭐ **thi hành LUẬT 21 bằng máy**, ⛔ không chỉ bằng tài liệu |
| ⭐ **ĐÃ LÀM** | ① **meta-gate mới** `tests/mt3-c15-gate-hygiene.test.mjs` (**4 ca**, ⭐ có **đối chứng âm của chính nó**) ② **audit 12 cổng** ⇒ phát hiện **6 khuyết điểm** ③ **vá hết** |
| ⚠️ **KHUYẾT ĐIỂM ĐÃ VÁ** | · **4 cổng thiếu ĐỐI CHỨNG ÂM** (`c03` · `c05` · `c06` · `c08`) ⇒ ⭐ thêm ca dùng **đúng biểu thức bộ dò của cổng** (⭐ mẫu lỗi lịch sử + mẫu đã vá) · **2 cổng thiếu CHỐT VÙNG PHỦ** (`c06` · `c08`) ⇒ thêm `assert.ok(files.length >= 40)` (⭐ và `c10` · `c11` · `c12` cũng được thêm) |
| ⚠️ **TỰ SỬA LỖI BỘ DÒ CỦA META-GATE** | lần đầu nó **báo oan** `c03`/`c05` vì regex `\*\*` khớp **chữ in đậm Markdown trong CHÚ THÍCH** ⇒ ✅ sửa thành `/readdirSync\(|walk\(new URL/` |
| ⚠️ **TỰ SỬA ĐỐI CHỨNG ÂM SAI LỚP** | đối chứng âm `C03-9` đời đầu dùng **mẫu kỹ thuật CHUNG** ⇒ chỉ **1/8** ⇒ ⚠️ suýt kết luận sai «bộ dò yếu»; đọc lại mã ⇒ `JARGON` **CỐ Ý HẸP** (nhắm **đúng chuỗi đã rò thật**) ⇒ ✅ sửa dùng **đúng lớp mẫu** ⇒ **8/8** |
| ⭐ **KẾT QUẢ** | ⭐ **12/12 cổng ĐẠT** (`C03` 9 · `C05` 9 · `C06` 5 · `C07` 2 · `C08` 5 · `C09` 4 · `C10` 7 · `C11` 4 · `C12` 3 · `C13` 5 · `C14` 3 · `C15` 4) · ⛔ 0 lỗi |
| **Status** | `DONE` (⛔ 0 tệp sản phẩm — chỉ `tests/**` ⇒ ⛔ không build) |
---

## TASK-20261007-C50 — ⭐ Quét **TOÀN LỚP `BUG-C13`** (luật 17) ⇒ tìm & **vá chỗ thứ hai trong quyền phiên 03** + đo tác động **+35 người duyệt** + cổng `C16`

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C50` · **Category** `BUGFIX` · `RBAC` · `TESTING` |
| ⭐ **PHƯƠNG PHÁP (luật 17)** | quét `app/**`+`lib/**` **mọi chỗ** dùng `allModulePermissions` (**14 chỗ**) + **mọi danh sách mã module cứng** (**3 chỗ**) ⇒ phân loại **cùng khuôn** vs **đúng thiết kế** |
| ⭐ **KẾT QUẢ PHÂN LOẠI** | ✅ **đúng thiết kế** (màn **quản trị** — đọc quyền **từng user** là đúng): `PermissionAccessPanel` · `AdminUserModalTabs` · `permsOf` · `userPermissionSpec` · …<br>⚠️ **CÙNG KHUÔN (gác nút cho user thường)**: **4 chỗ trong `app/page.tsx`** (+ `canAdministerStaff` đã báo) ⇒ ⛔ **ngoài quyền**<br>✅ **1 chỗ TRONG QUYỀN** ⇒ ⭐ **`lib/workflow-helpers.ts`** ⇒ ✅ **ĐÃ VÁ** |
| ✅ **KẾT QUẢ VÁ** | người duyệt **theo PHÒNG BAN** nay được công nhận: ⭐ `approvals` **26 → 61** (**+35**) · `dept_legal_hr` **5 → 9** · `dept_finance_payment_plan` **5 → 9** |
| ⭐ **KIỂM TRA DANH SÁCH MÃ CỨNG** | ✅ `WORK_DEPT_MODULE_KEYS` (`WorkCenter.tsx` — trong quyền phiên 03) — **mã ĐÚNG** ✅ **và có xét quyền phòng ban** ✅<br>⛔ `HR_EDIT_MODULES` (`page.tsx`) — chứa **`dept_hr_legal`** ⚠️ **KHÔNG tồn tại** trong `module_catalog` (⭐ **mã ĐẢO**) ⇒ ⭐ đã ghi trong `HANDOFF-C20` |
| **KIỂM CHỨNG** | ✅ cổng `C16` **4/4** (có **đối chứng âm** + **chốt vùng phủ**) · meta-gate `C15` **4/4** · `tsc` 0 · `eslint` 0 · `gd-cycle` **exit 0** · migration **`0348`** · cổng dự án **ĐẠT** (**`aa8d93a0c8ce613f`**) · hồi quy **919/918/0** |
| **STATUS** | ✅ `DONE` (⚠️ phần `page.tsx` vẫn `OPEN` ⇒ `HANDOFF-C20`) |
---

## TASK-20261007-C51 — ⭐ **QUÉT LỚP `BUG-C13` TRÊN TOÀN BỘ MÀN** (luật 17) ⇒ **1 chỗ tôi vá được (chú thích sai) · 1 chỗ giao phiên 02 · 3 chỗ xác nhận ĐÚNG**

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C51` · **Category** `RBAC` · `DOCUMENTATION` · `TESTING` |
| ⭐ **PHƯƠNG PHÁP** | ① quét **mọi cổng UI theo `role === "admin"` / `isAdminUser(`** trong `app/**` (⇒ ~20 chỗ) · ② quét **4 cổng `allModulePermissions`** của `page.tsx` (**đọc module từng cổng**) · ③ **đối chiếu CSDL**: module nào **có** quyền cấp **PHÒNG BAN** ⇒ mới bị «mù quyền phòng ban» · ④ đối chiếu **backend** (`ActionRbacRegistry` + `UserManagementUseCase`) xem **UI có khớp BE** không |
| ⭐ **KẾT QUẢ — ĐÚNG THIẾT KẾ ✅** | · **3 cổng** `page.tsx` (`canViewAudit` → `admin_tab_11` · `canManageRole` → `admin_tab_01` · `canManageUserPermissions` → `admin_tab_06`) ⭐ **`admin_tab_*` ⛔ KHÔNG có dòng quyền phòng ban (0 dòng)** ⇒ ✅ **đúng thiết kế**<br>· `Inventory.tsx:487` là **payload** (⭐ **không phải cổng**) ✅ · `WORK_DEPT_MODULE_KEYS` (tệp tôi) ✅ **đúng mã + có xét phòng ban** · `PROJECT_DETAIL_SUB_TAB_KEYS` = **khoá tab UI** ✅<br>· `HrProfileEditModal` dòng **179**: ô `role` **`disabled={!isAdminRole}`** ⭐ **khớp BE** (`:174-176` chỉ admin đổi vai trò) ✅ |
| ⛔ **LỖI PHÁT HIỆN — GIAO PHIÊN 02** | ⚠️ `Inventory.tsx` dòng **261+430**: nút «**＋ Thêm nhân sự**» **CHỈ hiện với `role === "admin"`** ⇒ ⚠️ **chặn OAN** người có **`admin_tab_06`** (⭐ BE **đã cho qua** từ **PA-1**) ⇒ ⭐ **`HANDOFF-20261007-C21`** |
| ✅ **VIỆC TÔI TỰ LÀM (trong quyền)** | ⛔ **gỡ khối chú thích CŨ SAI** trong `HrProfileEditModal.tsx` (⚠️ chú thích đó nếu bị làm theo sẽ khoá oan mục tài khoản — ⚠️ **đúng lớp `BUG-C13`**) + ⭐ **khoá bằng 2 ca cổng** (`C13-6` · `C13-7`, ⭐ có **đối chứng âm**) ⇒ ⛔ hết đường tái phát |
| **KIỂM CHỨNG** | ✅ `C13` **7/7** · meta-gate `C15` **4/4** · `tsc` 0 · `eslint` 0 · `gd-cycle` **exit 0** · migration **`0349`** · cổng dự án **ĐẠT** (**`022fecb6c0e82f81`**) · hồi quy **921/920/0** · 3 dịch vụ **đang nghe** |
| **STATUS** | ✅ `DONE` (⚠️ phần `Inventory.tsx` = `HANDOFF-C21` · phần `page.tsx` = `HANDOFF-C20`) |
---

## TASK-20261007-C53 — ⭐ **CHUYỂN TOÀN BỘ HOẠT ĐỘNG VÀO PHẠM VI HR–TEAMS** (user chốt 10/10/2026) ⇒ quét họ lỗi quyền trong phạm vi + hồi quy giao diện

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C53` · **Category** `TESTING` · `RBAC` · `DOCUMENTATION` |
| ⭐ **MỤC TIÊU** | ⭐ sau khi user chốt **phiên 03 = HR–TEAMS** ⇒ ⭐ **rà lại toàn bộ phạm vi của mình**: ① quét **họ lỗi quyền** (`hasAdminTab` · `allModulePermissions` · `role==="admin"`) trong **tệp HR–TEAMS** · ② **hồi quy giao diện** HR + Teams sau các build mới của phiên khác |
| ✅ **KẾT QUẢ ① (quét — 5 tệp)** | ⭐ **SẠCH**: ⛔ **không tệp nào dùng `hasAdminTab`** (⭐ tránh bẫy `HANDOFF-C23`) · ✅ `TeamDirectory` dùng **đúng** `modulePermission` **hiệu lực** · ✅ `HrScreen`/`ProjectTeams` nhận **prop** (cổng ở `page.tsx` của phiên 01) · ✅ `HrProfileEditModal` chỉ **khoá ô `role`** (khớp BE) · ⚠️ `TeamManagement` ⛔ không kiểm quyền ⚠️ **nhưng là màn MÔ CÔI** |
| ✅ **KẾT QUẢ ② (hồi quy)** | «Hồ sơ nhân sự» **26 dòng** ✅ · modal «Sửa hồ sơ» **2 tab đúng** ⭐ **chống tái dùng ô CÒN GIỮ** ⇒ ⭐ **`BUG-C12` (CRITICAL) vẫn được vá đúng** ✅ · tab «Tổ đội» render **1 bảng · 5 dòng** ✅ · 📸 3 ảnh |
| ⚠️ **PHÁT HIỆN KÈM (⭐ chỉ ghi — tệp thuộc phiên 02)** | ⚠️ `lib/menu-helpers.ts` khai ``label:"Tổ đội theo dự án"`` ⚠️ nhưng **UI ⛔ không có leaf đó** (⭐ đường vào thật: «Quản lý dự án» → tab «Tổ đội») ⇒ ⭐ nếu cần sửa ⇒ **giao phiên 02** |
| ⭐ **TUÂN THỦ PHẠM VI** | ⭐ vòng này phiên 03 **⛔ KHÔNG sửa tệp nào ngoài HR–TEAMS** ✅ (⚠️ chỉ ĐỌC `page.tsx`/`menu-helpers.ts` để phục vụ hồi quy) |
| **KIỂM CHỨNG** | ⭐ **⛔ 0 thay đổi mã sản phẩm** ⇒ ⛔ không cần build · 8 log **0 trùng lặp** · **19 ảnh bằng chứng** · ⛔ 0 tệp tạm · 3 dịch vụ **đang nghe** |
| **STATUS** | ✅ `DONE` |
---

## TASK-20261007-C54 — ⭐ **HOTFIX TRONG PHẠM VI HR–TEAMS**: `HrScreen.tsx` — chặn ghi đè hồ sơ (MẤT DỮ LIỆU) + ngày qua `date()`

| Trường | Nội dung |
|---|---|
| **ID** | `TASK-20261007-C54` · **Module** `HrScreen` (`app/screens/HrScreen.tsx`) · **Ưu tiên** 🔴 HIGH (Goal §21: mất dữ liệu) |
| ⭐ **CÁCH PHÁT HIỆN** | ⭐ **đọc mã tệp TRONG PHẠM VI** (sau khi user chốt phiên 03 = HR–TEAMS) ⇒ thấy ① dropdown đổ **toàn bộ** `staffDirectory` ② ngày in thô + ⭐ **`date` import mà gọi 0 lần** ⇒ ⭐ **đối chiếu backend** (`HrManagementUseCase:32-39` = `updateHrRecord(nvl(...))`) ⇒ ⭐ **kết luận mất dữ liệu** (⭐ ⛔ không suy đoán — đọc mã 2 phía) |
| ⭐ **ĐO TRƯỚC KHI VÁ** | **42** nhân sự hoạt động vs **26** hồ sơ ⇒ **26 người** phơi rủi ro · CSDL: `birth_date='1995-09-02'` (ISO) ⇒ ⭐ màn sẽ hiện **ISO** |
| ✅ **ĐÃ VÁ (2 chỗ, 3 lớp chặn)** | ① `missingProfile` (lọc người **chưa** có hồ sơ) cho dropdown · ② `window.confirm` **cảnh báo ghi đè** trong `saveHr` · ③ nút Lưu **khoá** + nhãn khi hết người · ④ `date(...)` cho 2 cột ngày |
| ⭐ **KIỂM CHỨNG (giao diện THẬT)** | ⭐ ngày = **02/03/1990** · **03/01/1983** · **09/06/2023** … ⇒ **ISO = 0** · **dd/mm/yyyy hoặc — = 5/5** ✅ · ⭐ dropdown = **18** lựa chọn (**17 chưa có hồ sơ** + 1 dòng mẫu) ⇒ ⭐ **26 người có hồ sơ BỊ LOẠI** ✅ · 📸 2 ảnh |
| **KIỂM CHỨNG KỸ THUẬT** | ✅ **cổng MỚI `mt3-c17` 4/4** (⭐ đối chứng âm + chốt vùng phủ) · ✅ **14/14 cổng ĐẠT** · `tsc` **0** · `eslint` **0 lỗi** · `gd-cycle` **exit 0** · migration **`0350`** · cổng dự án **ĐẠT** (**`830756713f67caff`**) · hồi quy **925 test · 924 pass · 0 fail · 1 skip** |
| ⭐ **TUÂN THỦ PHẠM VI** | ⭐ **tệp sửa duy nhất = `app/screens/HrScreen.tsx`** (⭐ **HR** — thuộc phiên 03 ✅) + **cổng test mới** · ⛔ **KHÔNG đụng** `page.tsx`/`java-backend`/ADMIN/KHO ✅ |
| **STATUS** | ✅ `DONE` + `VERIFIED` |