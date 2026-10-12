# DECISION_LOG — SESSION_C (ERP-SESSION-03)

> Quyết định ảnh hưởng hệ thống/quy trình. ID: `DEC-YYYYMMDD-CNN`.

---

## DEC-20261007-C01 — Hotfix GO-LIVE theo thứ tự **FE → BE → DB**, phiên 03 chỉ làm FE trong lượt này
- **Ngày**: 2026-10-07 · **Người quyết**: USER (chỉ đạo trực tiếp) · **Ghi bởi**: ERP-SESSION-03
- **Nội dung**: *«dự án đang đến giai đoạn golive, toàn bộ bug sẽ được hot fix theo thứ tự ưu tiên
  fe -> be -> db, ưu tiên chỉnh sửa frontend trước để user có thể test.»*
- **Hệ quả áp dụng**:
  1. `BUG-20261007-C01` vá **hoàn toàn ở FE** (`app/screens/HrProfileEditModal.tsx`).
  2. ⛔ **Không** sửa `java-backend/**` trong lượt này — dù đã chứng minh được gốc BE
     (`UserManagementUseCase.java:115-116` thiếu fallback `fullName`).
  3. Nợ BE ghi lại thành `HANDOFF-20261007-C02` cho phiên giữ `java-backend/**`.
- **Lý do kỹ thuật ủng hộ**: bản vá FE không chỉ che lỗi — nó **xoá đúng nguyên nhân trực tiếp**
  (lời gọi `update_user` thừa khi tab cá nhân đang mở). Gốc BE chỉ là **phòng thủ chiều sâu**.
- **Trạng thái**: `DONE`

---

## DEC-20261007-C02 — Mở `SESSION_C` cho phiên 03, ⛔ không ghi vào log của phiên 01/02
- **Ngày**: 2026-10-07 · **Người quyết**: USER (*«m là session 03 … hãy tự tạo folder để lưu log và
  giao tiếp với 2 session còn lại theo goal»*) · **Ghi bởi**: ERP-SESSION-03
- **Nội dung**: tạo `docs/dsh-mutil-session/SESSION_C/` với **đủ 9 loại log bắt buộc** theo
  `docs/dsh-mutil-session/README.md` §4; giao tiếp qua `SESSION_C/HANDOFF_LOG.md`; đăng ký vào 3 tệp
  SHARED bằng **append + giữ nguyên dữ liệu phiên khác**.
- **Hệ quả**: 3 phiên có 3 vùng log tách biệt; ⛔ không overwrite, ⛔ không sửa `TASK_LOG` /
  `WEEKLY_REPORT_DATA` của phiên khác (README §7).
- **Trạng thái**: `DONE`

---

## DEC-20261007-C03 — Áp **tiền lệ MỐC 116** cho việc lược bỏ thông tin rác ở tab Tổ đội
- **Ngày**: 2026-10-07 · **Ghi bởi**: ERP-SESSION-03
- **Bối cảnh**: user yêu cầu *«lược bỏ các thông tin bị thừa - rác ra khỏi các màn»*, trong khi
  6 test hợp đồng (`tests/tm0*.test.mjs`) **kiểm chính các chuỗi nguồn dữ liệu** đó.
- **Quyết định**: phân tách **DỮ LIỆU** vs **RENDER**:
  - **GIỮ** khối thuần `TM-PURE-BEGIN/END` (`TEAM_LIST_COLUMNS` · `TEAM_TABS` · `teamDetailTabs()`)
    và **mọi trường `source`** — đó là dữ liệu test trích ra và chạy thật.
  - **BỎ** phần **in ra màn hình** cho người dùng (bảng «Nguồn dữ liệu của 6 tab», `<p>` ghi nguồn,
    các `note` chứa tên bảng/cột CSDL, `payload`, tên action, đường dẫn file mã nguồn).
- **Căn cứ**: chính chú thích đã có trong mã — `TeamDirectory.tsx:458-462` (MỐC 116, user 01/10):
  *«BỎ CỘT «NGUỒN» … thứ CHỈ ĐỂ DEV TEST, không phải thông tin nghiệp vụ ⇒ không hiện cho người dùng.
  ⛔ KHÔNG đụng vào `teamDetailTabs()[].source`… Chỉ gỡ phần RENDER.»*
- **Hệ quả**: `tests/tm01-team-list.test.mjs:115` (khẳng định UI **phải** in `data-team-source-notes`)
  **mâu thuẫn trực tiếp** với chỉ đạo mới ⇒ **cập nhật assertion đó** thành khẳng định **ÂM**
  (UI ⛔ không được in tên bảng/cột CSDL). Đây là *đổi yêu cầu có chủ ý*, ⛔ **không** hạ chuẩn test.
- **Trạng thái**: `DONE`

---

## DEC-20261007-C04 — CSV tiếng Việt **BẮT BUỘC** có BOM UTF-8; cổng kiểm đặt ở `tests/`
- **Ngày**: 2026-10-07 · **Ghi bởi**: ERP-SESSION-03
- **Bối cảnh**: user báo «1 số nút đang bị lỗi UTF8». Đo được **2/13 đường xuất** lỗi — đều là **tệp mẫu CSV
  tĩnh thiếu BOM**; `scripts/template-preflight.mjs` **ĐẠT** vì cổng đó ⛔ **không kiểm BOM**.
- **Quyết định**:
  1. **Mọi** tệp `.csv` phục vụ người dùng (trong `public/**`) **PHẢI** có BOM `EF BB BF` + là UTF-8 hợp lệ.
     Lý do: **Excel bản Windows không tự dò UTF-8** ⇒ thiếu BOM là **mất dấu**, ⛔ không phụ thuộc bản Excel.
  2. Cổng kiểm đặt tại **`tests/mt3-c03-export-utf8.test.mjs`** (⛔ **không** sửa `scripts/template-preflight.mjs`):
     `tests/**` là nơi dự án đã đặt hợp đồng, và ⛔ không đụng mã dùng chung của 3 phiên khi chưa cần.
  3. Mọi đường xuất mới **phải** đi qua `downloadCsv` / `buildSimpleXlsxBytes` của `lib/tabular-export.ts`
     (nơi duy nhất được phát `text/csv`) ⇒ cổng số 5 chặn việc tự dựng CSV thiếu BOM.
- **Trạng thái**: `DONE`

---

## DEC-20261007-C05 — Chính sách sau SAI LẦM chạy `fixpoint-fingerprint.mjs` khi chỉ muốn KIỂM TRA
- **Ngày**: 2026-10-07 · **Ghi bởi**: ERP-SESSION-03 · **Loại**: quy trình (⛔ tự nhận lỗi)
- **Sự việc**: tôi chạy `node tools/fixpoint-fingerprint.mjs` **để kiểm tra** tính nhất quán vân tay.
  ⛔ **Tên tệp gây hiểu nhầm**: script **GHI** định danh mới ⇒ nó đã đổi state dùng chung sang
  `VNTECH-FP-6D015E959F55D73A`, **lệch** với artifact đang phục vụ (dựng dưới `846B70…`).
- **Quyết định / luật rút ra**:
  1. ⛔ **KHÔNG** chạy `fixpoint-fingerprint.mjs` như một lệnh CHỈ ĐỌC. Muốn kiểm tra ⇒ đọc
     `VNTECH_PRODUCT_IDENTITY.txt` / `VNTECH_FINGERPRINT.json`, hoặc chạy **`gd-cycle`** (đơn vị duy nhất
     được phép refresh định danh, vì nó làm **đủ chuỗi**: migration → refresh → build).
  2. Sau khi đã lỡ ghi ⇒ **bắt buộc chạy nốt `gd-cycle`** để artifact ↔ định danh khớp lại (đã thi hành).
  3. ⛔ Không tự sửa `tools/**` (mã dùng chung 3 phiên) — **đề xuất** thêm cảnh báo ở đầu tệp; ghi vào
     `HANDOFF_LOG.md` §`HANDOFF-20261007-C03` để user/phiên khác quyết.
- **Bằng chứng khắc phục**: `gd-cycle` lần 2 báo `fixed point stable: OK`, `VNTECH FINGERPRINT: ĐẠT`
  (`VNTECH-FP-B28418CE305E837E` · 722 files), `BUILT ARTIFACT VALIDATION: ĐẠT`, exit `0`.
- **Trạng thái**: `DONE`

---

## DEC-20261007-C06 — Hợp nhất bảng nhãn trạng thái về MỘT nguồn; cho phép bảng ĐẶC THÙ PHÂN HỆ có điều kiện
- **Ngày**: 2026-10-07 · **Ghi bởi**: ERP-SESSION-03 · **Liên kết**: `BUG-20261007-C03` · MT3 §IV.6 · Goal §17
- **Bối cảnh**: đo được **3 bản** `statusLabel` khác nhau (`lib/status-labels.ts` · `lib/labels.ts` ·
  `lib/report-catalog.ts`), trong đó **2 bản rò mã thô tiếng Anh**; và `StatusBadge` chỉ dịch mã chữ thường.
- **Quyết định**:
  1. **MỘT nguồn duy nhất**: `lib/status-labels.ts` (bảng chung + các domain `project` · `work_item` ·
     `approval_step` · `supply`). ⛔ Cấm chép lại bảng của **mã dùng chung**.
  2. **Cho phép** bảng nhãn **ĐẶC THÙ PHÂN HỆ** (`PR_STATUS_LABEL` · `PO_STATUS_LABEL`…) — vì nhãn PR ≠ nhãn PO
     cho cùng mã — ⛔ **nhưng** phải có **fallback về bảng dùng chung** (⛔ cấm `|| value`).
     Cổng C04 kiểm đúng vế này (miễn trừ **có điều kiện**, ⛔ không miễn trừ trắng).
  3. **Tra chéo domain theo thứ tự CỐ ĐỊNH** (`project → work_item → approval_step → supply`) khi mã không có ở
     bảng chung ⇒ mã như `partial_issued`/`REWORK` dịch được **mà ⛔ không cần người gọi truyền domain**.
     ⛔ **Bảng chung LUÔN thắng** ⇒ ⛔ không đổi nghĩa các mã đã có nhãn (vd `pending` vẫn «Chờ xử lý», ⛔ không thành «Chờ khởi động»).
  4. **Cập nhật 2 ca của `tests/v215-…`**: chúng khoá **VỊ TRÍ** bảng nhãn ⇒ trỏ về nơi nhãn đang sống.
     ⛔ **Không** hạ chuẩn, ⛔ không xoá ca, ⛔ không đổi điều cần chứng minh.
  5. **Màu badge** suy từ **chữ đang hiển thị** (⛔ không từ mã thô) ⇒ sửa luôn hệ quả «mọi badge vừa dịch đều thành `blue`».
- **Trạng thái**: `DONE`

---

## DEC-20261007-C07 — ⛔ KHÔNG gộp `KANBAN_PRIORITIES`; thay bằng CỔNG KIỂM chống lệch nhãn
- **Ngày**: 2026-10-07 · **Ghi bởi**: ERP-SESSION-03 · **Liên kết**: `BUG-20261007-C04` · Goal §17/§41
- **Bối cảnh**: ưu tiên có **4 bản dịch song song** (Kanban · WorkCenter×2 · Requests · +1 chỗ ⛔ không dịch).
  Cách «đẹp» là gộp tất cả về `lib/status-labels.ts` — nhưng `KANBAN_PRIORITIES` còn giữ **`tone`** (màu) +
  **`rank`** (thứ tự), và nó nằm trong **khối thuần** mà **`tests/t07` TRÍCH RA CHẠY** (khối đó ⛔ **không được import**).
- **Quyết định**:
  1. Bảng **DÙNG CHUNG** (`status-labels.ts`, domain `priority`) là **nguồn NHÃN** duy nhất.
  2. ⛔ **KHÔNG** xoá/gộp `KANBAN_PRIORITIES` (nó là nguồn **MÀU + THỨ TỰ**, và gộp mã sẽ **phá kiến trúc test**
     `t07` — vi phạm Goal §41 «⛔ không refactor rộng giữa GO-LIVE»).
  3. Thay vào đó thêm **CỔNG KIỂM**: 2 bảng ⛔ **không được lệch nhãn** (chống «sửa một nơi quên nơi kia»).
- **Trạng thái**: `DONE`

---

## DEC-20261007-C08 — ⛔ KHÔNG sửa `lib/**`/`app/**` SAU khi đã `gd-cycle`
- **Ngày**: 2026-10-07 · **Ghi bởi**: ERP-SESSION-03 · **Loại**: quy trình (⛔ tự nhận lỗi lần 2)
- **Sự việc**: sau **build lần 4**, tôi thêm domain `contract_type` vào `lib/status-labels.ts` (để S01 dùng cho
  `app/page.tsx`). ⛔ Việc đó làm **vân tay nguồn LỆCH** so với artifact đang phục vụ — đúng lớp lỗi tôi đã tự
  cảnh báo ở vòng 2. **Đã hoàn tác ngay** (kiểm lại `contract_type` = **0 lần**, cổng C04 **10/10**, `tsc` **0**).
- **Luật chốt cho cả 3 phiên**:
  1. Mọi thay đổi `lib/**` · `app/**` · `public/**` phải **XONG TRƯỚC** `gd-cycle`; ⛔ không sửa sau.
  2. Nếu buộc phải sửa sau ⇒ **phải chạy lại `gd-cycle`** để artifact ↔ định danh khớp, ⛔ không để lệch.
  3. Nhãn chưa cần dùng ngay thì **để trong HANDOFF** cho người sửa tệp đó, ⛔ không «thêm sẵn» vào mã dùng chung.
- **Trạng thái**: `DONE`

---

## DEC-20261007-C09 — §22/§11 «tab trong modal nhất quán»: **KHOÁ BẰNG CỔNG**, ⛔ KHÔNG sửa lại CSS
- **Ngày**: 2026-10-07 · **Ghi bởi**: ERP-SESSION-03 · **Liên kết**: `TASK-20261007-C08` · Goal §22/§41 · tiền lệ `TASK-156/212/213/214`
- **Bối cảnh**: Goal §22 yêu cầu «tab trong cùng một modal phải có kích thước nhất quán». Tôi **đo trước** (đọc `app/styles/canonical.css`) và thấy **các bất biến đang ĐÚNG**:
  `.edm-tabs` cố định + wrap · `.edm-tabs button` `flex: 1 1 auto` (basis `auto` để còn wrap) · tab `.is-active` chỉ đổi MÀU · `.edm-body` có `min-height:120px` · `.entity-detail-modal` chặn `88vh` · bản vá §11 (`.modal .project-scope-tabs > button, .modal .user-admin-tabs > button { flex: 1 1 0; min-width: 0 }`) **đã có**.
- **Quyết định**:
  1. ⛔ **KHÔNG sửa một dòng CSS nào.** Sửa vào = **phá hai quyết định ĐÃ ĐƯỢC USER DUYỆT**: MỐC 115 (`flex: 1 1 auto` cho `.edm-tabs` — user 01/10: «tab cân đối và bằng nhau … vẫn phải hiển thị đầy đủ thông tin») và MỐC 119b (dải CẤP TRANG cố ý «ôm sát nhãn», user nói bản giãn là «xấu»).
  2. Thay vào đó **KHOÁ BẰNG CỔNG**: `tests/mt3-c05-modal-tab-sizing.test.mjs` (**8 ca**) khẳng định từng bất biến — kèm **ca chống báo động giả** (⛔ cấm đổi `.edm-tabs button` sang `flex: 1 1 0`; ⛔ cấm dùng selector bao trùm `[role="tablist"] > button`; ⛔ cấm để bản vá §11 rò ra dải cấp trang).
  3. ⭐ **BÀI HỌC LẶP LẠI CỦA DỰ ÁN (lần thứ 5 trong repo, lần đầu của phiên 03)**: **ĐỪNG ÁP MỘT THƯỚC ĐO LÊN NHIỀU HỌ COMPONENT.** `.edm-tabs` đạt «bằng nhau» bằng `flex: 1 1 auto`, `.project-scope-tabs` (trong modal) bằng `flex: 1 1 0`, còn dải **cấp trang** thì **cố ý** `flex: 0 0 auto`. Một thước đo duy nhất sinh **2 báo động giả** như tài liệu dự án đã ghi.
- **Nguồn sự thật đã dùng**: **MÃ ĐANG CHẠY** (`canonical.css`) chứ ⛔ không phải tài liệu — tài liệu cũ ghi `flex:none`, mã thật ghi `flex: 0 0 auto` (Goal §16).
- **Trạng thái**: `DONE`

---

## DEC-20261007-C10 — Cổng báo «8 khối nhiều HÀNG»: **ĐO LẠI rồi mới kết luận** — kết quả là **BÁO ĐỘNG GIẢ**, ⛔ không sửa
- **Ngày**: 2026-10-07 · **Ghi bởi**: ERP-SESSION-03 · **Liên kết**: `TASK-20261007-C10` · `HANDOFF-20261007-C07` · Goal §16/§41
- **Sự việc**: cổng `tools/probe-toolbar-vertical.mjs` (cổng của chính dự án cho yêu cầu «nút CRUD 1 hàng ngang»)
  in **«TỔNG: 8 khối nhiều HÀNG»** ⇒ nếu tin ngay con số đó thì sẽ **"sửa" CSS đang đúng**.
- **Quyết định**:
  1. ⛔ **KHÔNG sửa** mã sản phẩm. **ĐO LẠI bằng công cụ thứ hai** của chính dự án
     (`tools/measure-supplier-row.mjs`): `.supplier-admin-row` cao **44px**, `display: grid`, **`autoFlow: column`**,
     12 con, **mọi ô mẫu cùng toạ độ `@603`** ⇒ **12 ô trên MỘT DÒNG THẬT**.
  2. Bản chất khối bị gắn cờ là **hàng DỮ LIỆU nhà cung cấp** (mỗi dòng = 1 `<form className="supplier-admin-row">`),
     ⛔ **không phải thanh nút chức năng** ⇒ nằm **ngoài** phạm vi yêu cầu «nút CRUD 1 hàng ngang».
  3. Kết luận **ĐẠT**: **14/16 màn = 0 khối**, phù hợp yêu cầu user. Việc cần làm là sửa **CÔNG CỤ ĐO**
     (⛔ thuộc `tools/**` — mã dùng chung) ⇒ giao `HANDOFF-20261007-C07`, ⛔ phiên 03 không tự sửa.
- ⭐ **LUẬT RÚT RA (lần thứ 2 của phiên 03)**: **MỘT CON SỐ ĐỎ TỪ CỔNG ⛔ KHÔNG PHẢI LÀ MỘT LỖI** —
  phải **đo bằng công cụ thứ hai** và **đọc bản chất khối** trước khi sửa. Cổng chỉ chắc bằng **giả thiết nó được viết ra**;
  ở đây giả thiết «mọi khối nhiều hàng = thanh nút» **sai với hàng dữ liệu dạng lưới**.
- ⭐ **BỐI CẢNH ĐÃ ĐO (⛔ tránh làm lại việc cũ)**: `MT2` **đã** sửa họ `.supplier-admin-row` từ `1182×85` (3 hàng) → `1182×59`;
  nay **44px** ⇒ **tốt hơn**, ⛔ **không hồi quy**.
- **Trạng thái**: `DONE`

---

## DEC-20261007-C11 — ⚠️ **QUY ƯỚC HIỂN THỊ PHẦN TRĂM** (⛔ chưa thống nhất) ⇒ ⭐ **CẦN USER QUYẾT**

| Trường | Nội dung |
|---|---|
| **Mã** | `DEC-20261007-C11` · **Ngày / Phiên** 2026-10-08 · `ERP-SESSION-03` |
| **Loại** | `UI/UX` · **Trạng thái** ⚠️ **CHỜ QUYẾT ĐỊNH** |
| ⭐ **SỐ LIỆU ĐO ĐƯỢC** | trong `app/**` + `lib/**`: `toFixed(0)`+`%` = **5** · `toFixed(1)`+`%` = **4** · `toFixed(2)`+`%` = **9** · `Math.round(...)`+`%` = **4** · `Intl` `style:"percent"` = **0** |
| **VẤN ĐỀ** | ① **độ chính xác khác nhau** (0/1/2 chữ số thập phân) cho cùng khái niệm «phần trăm» · ② **dấu thập phân là `.`** (vd `83.33%`) trong khi **TIỀN đã đúng kiểu Việt** (`1.234,56`) ⇒ ⚠️ **trong cùng màn có thể lệch nhau** |
| ⛔ **VÌ SAO ⛔ KHÔNG TỰ SỬA** | ⚠️ là **chủ trương hiển thị**, ⛔ không phải lỗi kỹ thuật · ảnh hưởng **~22 chỗ / nhiều màn** ⇒ ⛔ sửa hàng loạt **đi ngược Goal §41**; ⚠️ và ⛔ không có khiếu nại nào của user về phần trăm |
| ⭐ **PHƯƠNG ÁN ĐỀ XUẤT (chọn 1)** | **A.** Giữ nguyên (⛔ không đổi gì) · **B.** Chuẩn hoá **1 chữ số thập phân + dấu `,`** (vd `83,3%`) ở **các màn có tiền** ⇒ ⭐ **nhất quán với tiền** · **C.** Chuẩn hoá **số nguyên `%`** (vd `83%`) toàn hệ ⇒ gọn, ⚠️ mất chi tiết nhỏ |
| ⭐ **NẾU CHỌN B/C** | nên làm **1 helper dùng chung** (vd `pct()` trong `lib/ui-shared.tsx`) rồi thay dần ⛔ **không sửa rải rác**; ⚠️ **cần phiên giữ `page.tsx`** cùng làm (⚠️ `page.tsx` là **LOCK phiên 01** và có **5 chỗ**) |
| **RỦI RO** | **THẤP** (chỉ chuỗi hiển thị) — ⚠️ nhưng **chạm nhiều màn** ⇒ làm theo đợt, có cổng kiểm |