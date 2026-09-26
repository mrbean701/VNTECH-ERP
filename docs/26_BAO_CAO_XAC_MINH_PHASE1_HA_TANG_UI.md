# BÁO CÁO XÁC MINH PHASE 1 — HẠ TẦNG THÀNH PHẦN GIAO DIỆN DÙNG CHUNG

Ngày: 16/09/2026 · Người thực hiện: AI agent (theo yêu cầu Master Task)
Định danh phát hành: `VNTECH-FP-3081F17F7474D2C9` · head migration `0103` · manifest 791 tệp

---

## 1. MỤC ĐÍCH

Xác minh PHASE 1 (hạ tầng thành phần giao diện dùng chung) **bằng bằng chứng đo được**, không
bằng suy luận. Gồm hai lớp:

- **Chức năng**: bộ 13 probe hồi quy (chạy trình duyệt thật).
- **Hình thức**: cổng so ảnh 28 ảnh chuẩn (7 màn × 4 kích thước).

Nguyên tắc áp dụng: **không báo "xong" khi chưa test**; mọi kết luận phải truy được tới lệnh
đã chạy và số đo cụ thể.

---

## 2. PHẠM VI ĐÃ LÀM

### 2.1 Thư viện dùng chung — `app/components/ui/` (8 tệp)

| Tệp | Mã | Nội dung |
|---|---|---|
| `StatusBadge.tsx` | U-05 | Nguồn duy nhất cho màu trạng thái. Render ĐÚNG markup `<Pill>` cũ nên thay tại chỗ không lệch giao diện. |
| `PermissionGuard.tsx` | U-04 | Ẩn/hiện theo quyền + `hasPermission()` dùng ngoài JSX. Ghi rõ: **không phải lớp bảo vệ** — backend vẫn kiểm. |
| `ListToolbar.tsx` | U-03 | Khuôn toolbar chuẩn §5: TIÊU ĐỀ + SỐ LƯỢNG ‖ TÌM · LỌC · SẮP XẾP · HÀNH ĐỘNG. |
| `DataTable.tsx` | U-02 | Bảng dùng chung: cột, sắp xếp, bấm cả dòng, 3 trạng thái RỖNG/ĐANG TẢI/LỖI. |
| `Timeline.tsx` | U-06 + U-07 | `ApprovalTimeline` đủ 6 thông tin mỗi bước (§8.1); `ActivityTimeline` cho mọi lịch sử. |
| `EntityDetailModal.tsx` | U-01 + U-10 | Một khung chi tiết cho User/Project/Warehouse/Team/Material/Supplier/Task; `max-height: min(88vh,1000px)` + vùng cuộn nội bộ ⇒ không bao giờ vượt viewport. |
| `index.ts` | — | Barrel export. |

### 2.2 CSS

Thêm **MỤC 14** vào `app/styles/canonical.css`. Dùng token thiết kế ở `tokens.css`,
không thêm giá trị cứng mới, không thêm khai báo ưu tiên cao.

### 2.3 Chứng minh thư viện chạy được trong ứng dụng thật

`MaterialListTable` chuyển từ `<Pill>` sang `<StatusBadge>` — markup giống hệt nên cổng so ảnh
cho **0 điểm ảnh lệch**.

---

## 3. LỖI PHÁT HIỆN ĐƯỢC VÀ ĐÃ SỬA

### 3.1 Xung đột tên lớp CSS — lỗi thật (đã sửa)

`app/globals.css:161` đã định nghĩa sẵn:

```css
.timeline { padding:14px; display:grid; grid-template-columns:repeat(3,1fr); gap:12px }
```

đó là **dải phê duyệt 3 cột đang chạy thật**.

Bản đầu của MỤC 14 lại khai báo `.timeline { display:flex; flex-direction:column }` ⇒ quy tắc
thêm sau **đè toàn cục**, biến dải phê duyệt 3 cột thành danh sách dọc.

**Đã sửa**: đổi toàn bộ họ lớp sang namespace `vt-timeline*` (12 lớp, cả `Timeline.tsx` và
`canonical.css`) và ghi **quy tắc bắt buộc** vào đầu MỤC 14: *lớp của thư viện dùng chung PHẢI
có tiền tố `vt-`, không dùng tên trần*.

**Đã rà soát xung đột** đối chiếu `globals.css` + `font-floor.css` + `tokens.css`:
`.dt-*` · `.list-toolbar*` · `.edm-*` · `.entity-detail-modal` → **0 xung đột**; `.timeline` → 1
(đã sửa).

### 3.2 ĐÍNH CHÍNH một kết luận sai của chính tôi

Ban đầu tôi kết luận xung đột `.timeline` là **nguyên nhân** của việc cổng so ảnh báo 28/28 ảnh
lệch. **Kết luận đó SAI.** Bằng chứng phản bác: số liệu lệch **giống hệt nhau** trước và sau khi
sửa (admin tablet vẫn đúng 13647 px / 1.7353%).

Sự thật: xung đột `.timeline` là **lỗi thật nhưng tiềm ẩn** — 7 màn trong bộ ảnh chuẩn không
render dải đó (dải chỉ hiện khi mở drawer phiếu), nên nó không lộ ra ở cổng ảnh. Bản sửa vẫn
đúng và cần thiết, nhưng **không phải** nguyên nhân của 28/28.

---

## 4. NGUYÊN NHÂN THẬT CỦA 28/28 ẢNH LỆCH: DỮ LIỆU ĐỔI

Truy vết bằng `--locate=x,y` (in chồng phần tử tại toạ độ) và OCR ảnh chuẩn:

| Cụm lệch | Phần tử thật được định vị |
|---|---|
| (1690,30) | `<button class="notify-button">` — nội dung **"7"** (huy hiệu thông báo) |
| (100,350) | `<button class="nav-child nav-child-my_work is-development">` trong `<section class="nav-tree-group has-active">` — nhóm "CÔNG VIỆC **7**" |

Và đối chiếu OCR ảnh chuẩn cũ (12:12) với DOM hiện tại:

| Màn | Ảnh chuẩn 12:12 | Hiện tại |
|---|---|---|
| `06-warehouse` | "**1 hồ sơ** đúng phạm vi dự án/kho" | "**5 hồ sơ** …" |
| `07-admin` | danh sách nhân sự cũ | "**12/12 tài khoản** · danh sách toàn màn hình" |

Kết luận: ảnh chuẩn chụp lúc 12:12 **trước khi** PHASE 0B tạo dữ liệu kiểm chứng — ~9 tài khoản
demo (`cha.ht`, `thukydemo`, `nvdademo`, `nvkhdemo`, `trdademo`, `trinhtrench`, `tkhodemo`,
`ksda.demo`, `engineer.demo`) và các phiếu nhập kho sinh ra khi kiểm chứng luồng mua hàng.
Điều hướng vẫn tới **đúng màn** (đã kiểm bằng `--locate`), nên đây **không phải** lỗi giao diện.

---

## 5. SÀN NHIỄU CỦA TRÌNH DUYỆT — ĐO, KHÔNG PHỎNG ĐOÁN

Cổng so ảnh chỉ dùng được nếu ảnh chụp có tính tất định. Đo bằng `--selftest` (chụp 2 lần
**cùng một màn**, cùng dữ liệu, rồi so):

| Màn | desktop | laptop | tablet | phone |
|---|---|---|---|---|
| `03-work` | 0 px | 0 px | 0 px | 0 px |
| `07-admin` | **2 px** | 0 px | 0 px | 0 px |

- **21 px đầu tiên** đã được truy đúng gốc: vùng 6×7 tại (1702,26) → `--locate=1705,29` cho
  `<B> rect=1696,21,18,18 "7"` trong `<BUTTON class="notify-button">`; `--crop=1685,15,50,50`
  cho các cặp màu `#ef2f8a→#f36464` · `#fbf2ff→#fee9e9` · `#f42f2f→#f25a5a` ⇒ **chữ số được vẽ
  khác đi giữa hai lần chụp cùng dữ liệu** (khử răng cưa lệch dưới một điểm ảnh), không phải
  số đổi giá trị, không phải lệch bố cục.
- **2 px còn lại**: vùng 203×1 tại (22,824) → `--locate=120,824` cho
  `<BUTTON class="sidebar-collapse-toggle">` rect 22,798,203,34 ⇒ hai điểm ảnh ở **hai mép nút**
  (viền bo góc vẽ lệch dưới một điểm ảnh).

**Quyết định về ngưỡng:**

- Loại trừ **ký tự số** của ba bộ đếm dữ liệu sống (`.nav-parent b`, `.nav-child b`,
  `.notify-button b`) bằng `visibility:hidden` — giữ nguyên bố cục, đúng tiền lệ đã có với
  `.theme-switch` / `.user-menu`. Đây là **số đếm sinh từ dữ liệu**, mà cổng này đo **hình thức**.
- Ngưỡng mặc định đặt bằng **đúng sàn nhiễu đo được (2 px)**, ghi rõ bằng chứng trong mã.
  **Không** nâng lên 21 px để né huy hiệu — làm vậy là bỏ lọt mọi lỗi nhỏ hơn 21 px trên toàn hệ
  thống. Hồi quy **thật** nhỏ nhất từng gặp trong dự án là **405 px**.
- Vẫn giữ `--max-diff-pixels=0` cho chế độ nghiêm ngặt tuyệt đối.

**Cải tiến công cụ trong bước này:**

1. `--selftest` nay in **vị trí nhiễu** (vùng lệch + các ô nặng nhất). Trước đây chỉ báo "21 px"
   mà không nói ở đâu — không biết chỗ thì chỉ còn cách nâng ngưỡng, mà nâng ngưỡng là làm yếu cổng.
2. Ghi đầy đủ bằng chứng loại trừ + lý do ngưỡng ngay trong `tools/probe-visual-regression.mjs`.

---

## 6. KẾT QUẢ XÁC MINH CUỐI CÙNG

| Hạng mục | Lệnh | Kết quả |
|---|---|---|
| Build | `node scripts/build-cross-platform.mjs` | **ĐẠT** — `BUILT ARTIFACT VALIDATION: ĐẠT` |
| Cổng ảnh — tính tất định | `node tools/probe-visual-regression.mjs --selftest` | 0 px (03-work) · 2 px (07-admin desktop) |
| Cổng ảnh — đối chiếu | `node tools/probe-visual-regression.mjs` | **ĐẠT ✅ 28/28 lệch 0 điểm ảnh** |
| Probe chức năng | 13 probe trong `tools/` | **13 ĐẠT / 0 KHÔNG ĐẠT** |
| Đối chiếu cũ→mới | `vision_pixel_diff` (ảnh chuẩn cũ vs mới) | Khác biệt **chỉ nằm ở dải bảng dữ liệu** (06-warehouse: y 810–1080; 07-admin: y 540–1080). Không vùng nào ở topbar/sidebar. |

Chuỗi xác minh được thiết kế **có điều kiện**: chỉ chụp lại ảnh chuẩn **nếu** `--selftest` chứng
minh được tính tất định. Ở lần chạy đầu, cổng đã **từ chối** chụp lại (vì còn 21 px nhiễu) — nếu
cứ chụp thì đã **đóng băng luôn sự bất định** và cổng mất khả năng bắt lỗi nhỏ về sau.

---

## 7. BÀI HỌC ĐÃ RÚT RA

1. **Đặt tên lớp CSS dùng chung phải có namespace.** Tên trần (`.timeline`) xung đột với CSS sẵn
   có và đè toàn cục. Quy tắc `vt-` đã được ghi vào chính file CSS để không tái diễn.
2. **Cổng so ảnh so với dữ liệu sống thì sẽ báo lỗi giả.** Ảnh chuẩn phải được chụp lại sau khi
   dữ liệu kiểm chứng thay đổi; và các bộ đếm dữ liệu phải được loại trừ khỏi phép đo **hình thức**.
3. **Số liệu lệch không đổi sau khi sửa ⇒ kết luận nguyên nhân trước đó là sai.** Phải so số đo
   trước/sau, không được suy từ "tôi vừa sửa chỗ này nên chắc là do nó".
4. **Kiểm tra dịch vụ phải dùng `netstat -ano`**, không dùng `Get-NetTCPConnection` (trả rỗng sai
   dưới sandbox) và không dùng `Get-CimInstance Win32_Process` (trả rỗng hoàn toàn).
5. **"Access to the path .local-data is denied" không phải chặn sandbox**: tiến trình Node SSR
   đang mở handle trên `.local-data\warehouse.sqlite`. Phải dừng đúng PID cổng 8787 và 9000
   trước khi build — tuyệt đối không kill toàn bộ tiến trình node.

---

## 8. VIỆC CÒN LẠI CỦA PHASE 1

| Mã | Việc | Ghi chú |
|---|---|---|
| `U-09` | Chuyển ~15 danh sách sang khuôn `ListToolbar` chuẩn (§5) | Phạm vi đã khảo sát: các khối dùng `.table-toolbar` · `.screen-actions` · `.staff-toolbar` · `.filter-grid` rải rác trong `app/page.tsx` |
| `U-10` | Sửa modal vượt viewport | **Khung đã xong** (`EntityDetailModal` giới hạn `max-height: min(88vh,1000px)` + vùng cuộn nội bộ), nhưng **chưa áp** cho toàn bộ 31 modal thực thể còn lại — việc áp dụng thuộc U-09/U-11 |
| `U-11` | Tách `app/page.tsx` (4.057 dòng, 218 hàm) thành module theo màn hình | Nền cho mọi phase sau |
| `U-12` | Loại `!important` theo từng nhóm; gộp selector trùng lặp | Phụ thuộc U-11 |

**Lưu ý về cổng ảnh khi làm U-09/U-11:** hai việc này **chủ ý** đổi bố cục, nên cổng sẽ báo lệch.
Quy trình đúng: chạy cổng trước để ghi nhận mức lệch dự kiến → xác nhận lệch nằm trong vùng
toolbar/danh sách → chụp lại ảnh chuẩn **kèm lý do ghi trong commit**.

---

## 9. CÂU HỎI CÒN CHỜ NGƯỜI DÙNG QUYẾT

1. **`tools/baseline/` (28 ảnh PNG, ~5,8 MB) và `tools/_diff/`** có nên giữ trong kho mã không?
   Ảnh chuẩn là dữ liệu nhị phân lớn; nếu không giữ thì cổng so ảnh cần cơ chế sinh lại ảnh chuẩn
   theo môi trường (`--update` ở lần chạy đầu).
2. **Có push các commit đang chờ không?** Commit #9 (`8b4a5da`) và #10 (`3c948cb`) hiện **chưa**
   được push lên remote.

---

## 10. PHÁT HIỆN 17/09/2026 — "ĐÃ TẠO" KHÔNG PHẢI "ĐÃ DÙNG": ROADMAP TRƯỚC ĐÓ BÁO QUÁ

Trong lúc kiểm tra lại tính trung thực của roadmap, tôi đo **số lần DÙNG THẬT** của thư viện dùng
chung trong ứng dụng (không tính chính thư viện). Công cụ: `tools/probe-ui-adoption.mjs`.

| Thành phần | Mã | Dùng thật | Kết luận |
|---|---|---|---|
| `ListToolbar` | U-03 | **10** | ĐANG DÙNG |
| `StatusBadge` | U-05 | **2** | ĐANG DÙNG (mới 2/88 chỗ) |
| `EntityDetailModal` | U-01 / U-10 | **0** | CHƯA ÁP DỤNG |
| `DataTable` | U-02 | **0** | CHƯA ÁP DỤNG |
| `PermissionGuard` | U-04 | **0** | CHƯA ÁP DỤNG |
| `ApprovalTimeline` | U-06 | **0** | CHƯA ÁP DỤNG |
| `ActivityTimeline` | U-07 | **0** | CHƯA ÁP DỤNG |

**Vấn đề:** roadmap từng đánh `DONE` cho U-01/U-02/U-04/U-06/U-07 — nhưng đó mới là **DỰNG KHUNG**,
chưa áp dụng vào ứng dụng lần nào. Đây đúng là điều MASTER TASK cảnh báo: *không được coi là xong
chỉ vì mã đã được sửa*.

**Đã tự sửa:**

- Cột TT của U-01…U-08 nay ghi theo **số đo thật**: `KHUNG-XONG / AP-DUNG 0` · `DONE / AP-DUNG 10` ·
  `DONE / AP-DUNG 2`.
- Tách phần **áp dụng** thành 4 việc riêng, kèm phạm vi đo được:
  - **U-14** `EntityDetailModal` — dùng thật 0; còn **4** chỗ tự viết `.overlay`
  - **U-15** `DataTable` + `StatusBadge` — DataTable dùng thật 0, còn **100** bảng tự viết và
    **100** trạng thái rỗng tự viết; StatusBadge mới **2/88** chỗ `<Pill>`
  - **U-16** `PermissionGuard` — dùng thật 0; còn **50** chỗ điều kiện quyền rải rác
  - **U-17** `ApprovalTimeline`/`ActivityTimeline` — dùng thật 0; còn **3** chỗ tự viết dải
- Ghi chú phát hiện ngay trong roadmap để người đọc sau không hiểu nhầm là đã xong.

**Định hướng thi công (khác với "quét một lần"):** khối lượng áp dụng rất lớn (hơn 300 điểm chạm).
Quét một lần sẽ tạo ra thay đổi khổng lồ, khó kiểm chứng và dễ phá giao diện — trái quy tắc không
viết lại mã đang chạy khi không cần thiết. Vì vậy nên **áp dụng theo từng màn, gắn vào các phase
nghiệp vụ tương ứng** (PHASE 2 trở đi), mỗi đợt đều chạy cổng ảnh + probe như đã làm với U-09.

**Quy mô tệp cần tách (U-11):** `app/page.tsx` = **4.140 dòng · 221 hàm top-level**.
