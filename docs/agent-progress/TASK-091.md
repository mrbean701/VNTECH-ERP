# TASK-091 — `U-14`: CHUYỂN `drawer` CHI TIẾT PHIẾU SANG `EntityDetailModal` (bước 1/6 XONG: khảo sát + bằng chứng TRƯỚC)

- **Ngày mở:** 18/09/2026 · **Trạng thái:** `DANG-LAM 1/6` (khảo sát xong, **chưa đụng mã**)
- **Nguồn:** MASTER TASK PHASE 1 UI/UX (`U-14`) · KP #92 · công thức chuyển ở `U14-U11-KHAO-SAT.md` §1.4

## 1. Vì sao việc này làm được AN TOÀN ngay bây giờ

1. **4 quyết định treo đã chốt xong** (KP #88 · hover · KP #89 · KP #96) ⇒ không còn thay đổi lớn nào chồng lên.
2. **Cổng ảnh đã phủ đúng màn này và đang ĐẠT:** `12-drawer-request-detail` — màn có bước `{ click }` mở drawer,
   **4/4 kích thước lệch 0 px** (đo lại 18/09 trước khi sửa: `tools/probe-visual-regression.mjs --only=12-`).
3. **Cổng đo khung** (`getBoundingClientRect`) sẽ **từ chối ĐẠT** nếu khung mới tràn khung nhìn.

## 2. Bản đồ kỹ thuật ĐO ĐƯỢC (không suy đoán)

| Thành phần | Vị trí | Ghi chú |
|---|---|---|
| `EntityDetailModal` | `app/components/ui/EntityDetailModal.tsx:44` | API: `open` · `onClose` · `title` · `subtitle` · `entityId` · `tabs[]` (`key`/`label`/`content`/`badge`/`permission`) · `footer` · `actions` · `width` · `loading` · `error` · `emptyText` · `canView`. Có **Esc để đóng**; tab mặc định = `visibleTabs[0]`; tự lọc tab theo `permission`. |
| **`RequestDrawer`** (ứng viên thật) | `app/page.tsx:2894` | **TOÀN BỘ JSX NẰM TRONG MỘT DÒNG 9.254 ký tự** (`<div className={isPage ? "overlay page-mode" : "overlay"} …><aside className={isPage ? \`drawer request-drawer is-page…\`}>…`). Hàm chỉ có 2 dòng vật lý (2894 JSX + 2895 `}`). |
| `ReceiptDrawer` | `app/page.tsx:2903` | drawer "XÁC NHẬN GIAO HÀNG THỰC TẾ" — **1 dòng 4.635 ký tự**; **cũng là chi tiết thực thể** ⇒ **ứng viên thứ 2** (khảo sát ở bước 2). |
| `BaseModal` | `app/page.tsx:2905` | ⛔ KHÔNG đụng (khung chung ~31 modal, CSS đóng băng). |

**Hệ quả kỹ thuật quan trọng:** vì mỗi drawer là **một dòng khổng lồ**, mọi sửa đổi phải dùng **mỏ neo + splice**
(cùng kỷ luật `tools/don-kp96-cay-du-an.mjs`: công cụ **TỰ CHỐI GHI** nếu mỏ neo không khớp đúng 1 lần) và
`tsc`/eslint/cổng ảnh làm trọng tài.

## 3. Công thức chuyển (6 bước, theo `U14-U11-KHAO-SAT.md` §1.4)

1. `open={true}` · `onClose={close}` · `title` = **nguyên văn** chữ trong `<header>` hiện có.
2. `subtitle={<>{request.projectCode} · {request.projectName}</>}` · `entityId={request.requestNo}`.
3. `tabs` = tách **đúng các `<section>` đang có** — dự kiến: `overview` (summary-grid) · `items` (bảng dòng vật tư) ·
   `approvals` (dải phê duyệt **đang dùng `ApprovalTimeline`** — giữ nguyên) · `files` (khối tệp/ảnh).
4. `footer` = **chuyển y nguyên** cụm nút (kể cả nút in phiếu); nút `type="submit"` của `<form>` ⇒ dùng
   **`<button form="<id-form>">`** (HTML hợp lệ, không cần `onClick`).
5. Giữ **mọi** `onClick`/`stopPropagation`/`action(...)`; **không đổi payload**.
6. Kiểm chứng: `tsc` · eslint · `npm run build` · **cổng ảnh `--only=12-`** (so ảnh chuẩn bản CŨ) ·
   `probe-modal-branch-coverage` (không phát sinh nút chết) · **đo khung không tràn**.

## 4. Bằng chứng TRƯỚC khi sửa (đã lưu)

```
▸ 12-drawer-request-detail  —  Phiếu đề nghị — drawer chi tiết
   ✅ desktop  lệch 0 px · ✅ laptop 0 px · ✅ tablet 0 px · ✅ phone 0 px
KẾT LUẬN: ĐẠT ✅ — không có vùng lệch nào (4 ảnh đã đối chiếu)
```

⇒ Sau khi chuyển, cổng **buộc phải LỆCH** ở màn này (đây là thay đổi giao diện **có chủ đích**): cách đọc kết quả là
**so vùng lệch + đo khung + kiểm bằng mắt ảnh mới**, **không** kỳ vọng 0 px. Sau khi xác nhận đúng ⇒ `--update`
riêng màn này để chốt ảnh chuẩn mới (ghi rõ trong hồ sơ là **thay đổi có chủ đích**).

## 5. Việc kế tiếp (bước 2/6)

1. ~~Đọc trọn dòng 2894~~ → **ĐÃ THỬ bằng công cụ bóc cấu trúc: THẤT BẠI, ghi lại trung thực.**
   `tools/boc-cau-truc-jsx.mjs` (bản tự viết, **đã xoá**) chạy trên dòng 2894 chỉ bóc được **41 mục và DỪNG ở offset ~2.000/9.254**
   ⇒ bộ đếm ngoặc nhọn **bị kẹt ở mức > 0** nên **phần lớn thẻ bị bỏ qua**, và nhãn thẻ **ghép cặp SAI**.
2. **Bước 2/6 — HOÀN TẤT bằng BẢN ĐỒ VĂN BẢN** (`tools/ban-do-khoi-drawer.mjs`, mỗi mốc **có offset** để dùng làm mỏ neo):

```
dòng 2894 · 9.254 ký tự
@161   <aside>
@288   <header>                                  → tiêu đề + nút thu gọn/Quay lại (…@728)
@882   </header>
@891   <div class="drawer-body">
@920   <section class="summary-grid request-summary">            … @2109 </section>   → TAB "Tổng quan"  (10 ô)
@2119  <section class="drawer-section">  CardHead "Tiến trình phê duyệt & thời gian xử lý"  … @3488 → TAB "Phê duyệt"
@4296  <section class="drawer-section">  CardHead "Tổng hợp giao nhận về phiếu đề nghị gốc"  … @4963 → TAB "Giao nhận"
@5074  CardHead "CHT sửa phiếu bị trả lại"  … (nút "Lưu chỉnh sửa" @6200 — nút submit của <form>) → TAB "Sửa phiếu" (chỉ khi bị trả lại)
@6280  <section class="drawer-section document-note">  CardHead "Mục đích / Ghi chú"  … @6393   → TAB "Ghi chú"
@6404  <section class="drawer-section request-special-files">  CardHead "Ảnh / Hồ sơ vật tư đặc thù" … @6721 → TAB "Hồ sơ"
@6737  <footer>  "Xóa phiếu & lập mới" @6765 · "Gửi lại từ đầu →" @6860 … @7442 </footer>
@7451  </aside>
```

3. ⚠️ **Hai lỗi của công cụ AST đã ghi lại trong CHÍNH tệp công cụ** (`tools/boc-cau-truc-jsx-ast.mjs`):
   (a) truyền `depth` không `+1` ⇒ mọi nút là depth 0; (b) lọc theo độ sâu **AST** thì JSX nằm ở depth ~8 nên bị chặn hết.
   Đã sửa cả hai (tách `jsxDepth`), **nhưng bộ lọc theo thẻ vẫn chưa in ra được** ⇒ công cụ AST **giữ ở trạng thái "chưa dùng được"**;
   bước 2 đã hoàn tất bằng bản đồ văn bản nên **không chặn** công việc.
4. **Bước 3/6 — công cụ chuyển ĐÃ VIẾT và ĐÃ CHẠY KHÔ: nó TỰ CHỐI GHI (đúng thiết kế).**
   `tools/chuyen-drawer-sang-edm.mjs` — cắt 4 khối (`header`/`drawer-body`/`footer`/đuôi), bóc **tiêu đề nguyên văn**
   (`"PHIẾU ĐỀ NGHỊ MUA HÀNG"`), `subtitle`, `entityId`, dựng `tabs[]` + `footer` + `actions`, và **kiểm bất biến
   "không mất nội dung"** trước khi ghi. Lượt chạy khô đầu tiên **DỪNG, không ghi tệp**, với **4 lỗi thật**:
   * **`gap` 798 ký tự KHÔNG nằm trong `<section>`** — khối `{request.supplySteps?.length > 0 && <ActivityTimeline
     title="Tiến trình mua và giao hàng" …>}` ⇒ cần nhãn/tab riêng ("Tiến trình mua").
   * **`gap` 1 ký tự `}` và 6 ký tự `</div>`** ⇒ **các khối CÓ ĐIỀU KIỆN bị cắt đôi giữa hai đoạn**
     (`{cond && <section …>` mở ở đoạn trước, `}` đóng ở đoạn sau) ⇒ cách tách theo `<section>` cho ra JSX
     **LỆCH NGOẶC** (nếu ghi thì `tsc` sẽ đỏ hoặc tệ hơn là giao diện hỏng im lặng).
   * **`onClick=` 9 → 8** ⇒ mất 1 handler nếu ghép sai.
   ⇒ **Đây chính là giá trị của cơ chế tự chối: nó chặn một bản sửa SAI trước khi vào mã.**
5. **Bước 3/6 — lượt sửa thứ ba: ĐÃ ĐÚNG HƯỚNG, còn 1 lỗi bất biến.**
   Đã thêm **theo dõi độ sâu thẻ JSX** (chỉ `{` ở độ sâu 0 mới là mốc con) ⇒ bộ tách cho ra **6 con** (thay vì 48)
   và công cụ dựng được **5 tab**: `Phê duyệt`(2.578) · `Tiến trình mua`(798) · `Giao nhận`(677) · `Sửa phiếu`(1.287) · `Ghi chú`(477).
   **NHƯNG vẫn DỪNG, không ghi tệp**, với **1 lỗi bất biến**: `onClick=` **9 → 8** (mất 1 handler) — và 2 khối bị "hút" vào tab khác:
   * **`Tổng quan` (summary-grid) MẤT**: vì `<section summary-grid>` và `<section drawer-section>` **liền nhau không có biểu thức ở giữa**
     ⇒ bộ tách gộp cả hai vào **cùng một run markup** ⇒ thành một tab `Phê duyệt` 2.578 ký tự;
   * **`Hồ sơ` (Ảnh/Hồ sơ) bị hút** vào `Ghi chú` (477 ký tự).
   **Cách sửa đã xác định (việc kế tiếp, rất cụ thể):** chuyển sang **lai**: ranh giới tab lấy theo **mốc khối đã có trong bản đồ văn bản**
   (`<section …>` ở độ sâu 0 **VÀ** các biểu thức `{…}` ở độ sâu 0), tức là **bắt buộc cắt tại MỌI `<section` mức 0** (không chỉ tại biểu thức),
   rồi mới gộp con vụn — và **vẫn giữ 2 bất biến** (`nối lại === thân gốc` + `onClick=` 9→9, `<form` 1→1, `type="submit"` 1→1).
   Đây là bước cuối để bước 3/6 xanh; sau đó mới `--apply` và sang bước 4–6.
6. Kiểm chứng bước 6 (mục 3.6) rồi `--update` **riêng màn** `12-drawer-request-detail` (thay đổi **có chủ đích**).
7. Khảo sát `ReceiptDrawer` (`page.tsx:2903`, 4.635 ký tự — ứng viên thứ 2) **sau khi** màn đầu xong ⇒ tách vòng riêng.

## 6. Trạng thái bàn giao (để vòng sau tiếp tục ngay)

```
CURRENT TASK   : TASK-091 — U-14 chuyển RequestDrawer sang EntityDetailModal
CURRENT STEP   : 2/6 (bản đồ cấu trúc ĐÚNG) — bước 1/6 đã xong và đã commit #195
COMPLETED      : khảo sát · API EntityDetailModal · công thức 6 bước · bằng chứng TRƯỚC (4 ảnh ĐẠT 0 px)
IN PROGRESS    : công cụ bóc cấu trúc JSX (bản đầu SAI — đã dán cảnh báo, phải thay bằng AST `typescript`)
REMAINING      : bước 3 → 6 (công cụ chuyển · áp dụng · kiểm chứng · chốt ảnh chuẩn màn 12 · khảo sát ReceiptDrawer)
NEXT ACTION    : viết `tools/boc-cau-truc-jsx-ast.mjs` bằng `ts.createSourceFile`
BLOCKER        : không (10 việc chờ người dùng duyệt KHÔNG chặn U-14)
FILES CHANGED  : docs/agent-progress/TASK-091.md · tools/boc-cau-truc-jsx.mjs (mới) · MASTER_STATUS · TASK_INDEX
LATEST COMMIT  : #195 (docs checkpoint) → #196 (docs + cảnh báo công cụ)
```


## 6. `U-14` — NGUYÊN NHÂN GỐC ĐÃ KHOANH ĐƯỢC (18/09, sau lượt `--apply` bị `tsc` bắt)

* Lượt `--apply` **đã ghi** một JSX **lệch cân** dù mọi **bất biến ĐẾM** đều qua; `tsc` bắt được `TS17015` và em **đã `git checkout` hoàn tác** (cây sạch, `tsc` về 0).
* **Đã thêm TỰ KIỂM BẰNG PARSER** vào công cụ ⇒ nay **không thể** ghi JSX sai (lượt chạy khô báo *"18 lỗi cú pháp ⇒ TỪ CHỐI GHI"*).
* **Chẩn đoán gốc** (`tools/_u14-tim-offset.mjs`): lỗi `TS17015@505204` — quy đổi ra thì offset nằm **SAU** dòng 2894 (dòng mới chỉ **7.337** ký tự) ⇒ **không phải lỗi bên trong dòng mới mà là "còn thiếu thẻ đóng"** ⇒ xác nhận **fragment hụt**.
* **NGUYÊN NHÂN:** `splitChildren()` chỉ theo dõi **độ sâu THẺ** (`tagDepth`), **chưa theo dõi độ sâu FRAGMENT**. Với thân có **fragment `<>…</>` ở mức ngoài cùng bọc nhiều khối**, bộ tách cắt tại mỗi `<section`/`{…}` mức ngoài cùng ⇒ **`<>` rơi vào tab này, `</>` rơi vào tab khác** ⇒ JSX lệch cân.
* **CÁCH SỬA (đã xác định chính xác — việc kế tiếp):** thêm biến `fragDepth` trong `splitChildren`:
  1. khi gặp `<` mà không phải thẻ có tên: nếu là `<>` ⇒ `fragDepth++`; nếu là `</>` ⇒ `fragDepth = Math.max(0, fragDepth - 1)`;
  2. đổi điều kiện mốc biểu thức thành `if (tagDepth === 0 && fragDepth === 0 && text[i] === "{")`;
  3. đổi điều kiện cắt `section` thành `if (!close && tagDepth === 0 && fragDepth === 0 && /^<\s*section\b/i.test(tagText) && buf)`.
  Sau đó chạy khô: **kỳ vọng tự kiểm PARSE báo HỢP LỆ (0 lỗi)** ⇒ mới `--apply`.
* **Kỷ luật đã giữ:** mọi bước **chạy khô trước**, công cụ **tự chối ghi** khi có lỗi, và lượt hỏng duy nhất đã được **hoàn tác tức thì** bằng `git checkout` (không có mã sai nào nằm lại trong cây).
