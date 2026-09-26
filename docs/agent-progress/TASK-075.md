# TASK-075 (P-06 / MASTER TASK §8.3) — Ảnh/hồ sơ vật tư đặc thù: **XEM ĐƯỢC**, **KHÔNG TRÀN KHUNG**

**Trạng thái:** ✅ DONE (mã) — `tsc` **exit 0** · cổng §8.3 **22/22 ĐẠT** · `master-baseline-gate` **ĐẠT** · eslint **0 error**
⚠️ **Chưa kiểm được phần render** vì bundle đang chạy cũ hơn nguồn ~13 giờ (**TASK-034**) — xem mục 6.
**Ngày:** 17/09/2026 · **Nhánh:** `unity`
**Nguồn đặc tả:** `docs/24` §15 dòng 5 — *"Hồ sơ vật tư đặc thù: ảnh/tệp đính kèm **khó xem**, **tràn khung**"* (nguồn ghi: §8.3) · roadmap `P-06`.

---

## 1. Hiện trạng trước khi sửa — đúng cả hai nửa của vấn đề

`AttachmentPanel` (cũng là `FileUpload`, `app/page.tsx:4077`) — component dùng cho **cả** "Ảnh / Hồ sơ vật tư đặc thù"
(phiếu đề nghị) **và** "Chứng chỉ / Tài liệu", "Ảnh giao hàng" (hồ sơ giao nhận) — chỉ có:

* một dòng danh sách với **chip CHỮ** `ẢNH`/`TỆP` + liên kết tải ⇒ **không hề thấy ảnh** (*"khó xem"*);
* tên tệp trong `<strong>` **không có luật ngắt dòng** ⇒ tên dài không có dấu cách **đẩy tràn cột** (*"tràn khung"*).

## 2. Đã sửa — ảnh xem được, khung có biên cứng

| Phần | Trước | Sau |
|---|---|---|
| **Xem ảnh** | chip chữ `ẢNH` + link tải | **dải ảnh xem trước** (`.attachment-photos`) cho mọi tệp `image/*`, mở tab mới khi bấm |
| **Ô nhận diện trong danh sách** | chip chữ `ẢNH` | **ảnh thu nhỏ 42px** (`.attachment-thumb`); tệp không phải ảnh **giữ nguyên chữ `TỆP`** |
| **Chống tràn khung** | không có | `.attachment-photo img` **chặn cứng** `height:118px` + `object-fit:cover`; lưới `repeat(auto-fill,minmax(132px,1fr))` tự co; tên tệp `overflow-wrap:anywhere`; `.attachment-row>a{overflow:hidden}` |

**Không cắt nội dung:** mọi tệp vẫn nằm trong danh sách cũ (tên, người tải, ngày, nút Xóa, trạng thái rỗng) —
ảnh chỉ **thêm** cách xem. Chữ hiển thị **không tự đặt mới**: `TỆP` giữ nguyên, tên tệp là dữ liệu.
Dùng lại **đúng endpoint** `/api/files` mà danh sách vốn dùng ⇒ không thêm đường mạng mới.

## 3. 🔴 BÀI HỌC QUAN TRỌNG — `app/globals.css` BỊ ĐÓNG BĂNG, CSS mới phải vào `app/styles/canonical.css`

Lượt đầu tôi nối khối CSS vào `app/globals.css` ⇒ **`scripts/master-baseline-gate.mjs` CHẶN NGAY**, 2 luật:

* dòng 44: *"Không được append CSS sau canonical R1.1.1 END"*;
* dòng 51: `byteSize > 400653` ⇒ khối +1600 byte làm tệp thành **402.239 byte** ⇒ **vượt hạn mức**.

**Đã sửa:** **rút nguyên khối** khỏi `globals.css` (trả về **đúng 400.639 byte**, `git diff` không còn dòng nào cho tệp này)
và chuyển sang **`app/styles/canonical.css`** (stylesheet của thư viện dùng chung). Sau đó cổng nền:
`MASTER BASELINE GATE: ĐẠT · … · !important=4950 · css=400643B`.

⚠️ **Con số đáng chú ý:** `!important=4950` **đúng bằng trần** cho phép ⇒ `globals.css` **không nhận thêm được
một `!important` nào**. Đây là ràng buộc thật cho mọi việc giao diện về sau (liên quan `U-12`).

## 4. Đo trên ĐÚNG đường người dùng dùng — không phải đường tôi đoán

`tools/cutover-proxy.mjs:39` xếp `/api/files` vào `API_PREFIXES` ⇒ sau proxy `:9000`, `/api/files` do **JAVA (:18081)**
phục vụ, **không phải** Node. Bằng chứng đo được khi tôi thử sai đường: đăng nhập ở `:8787` trả **401**
(*"Tên đăng nhập hoặc mật khẩu không đúng"*) vì runtime Node dùng **SQLite riêng** (`.local-data/warehouse.sqlite`)
còn Java dùng **MySQL**. Cổng vì vậy đo trên `:18081`.

## 5. Cổng mới `tools/probe-task075-attachments.mjs` — **22/22 ĐẠT**

Vì dữ liệu thật **không có tệp nào tới được** (mục 6.1), cổng **cắm fixture tạm** (1 dòng `attachments` + 1 **PNG 8×8
hợp lệ dựng tại chỗ** bằng `zlib`, 163 byte) vào chứng từ **có `purchase_order` hợp lệ**, đo, rồi **dọn sạch** và
**khẳng định đã sạch** (số dòng về mức nền, tệp đã xoá).

| Nhóm | Phép kiểm | Kết quả |
|---|---|---|
| **A. Hợp đồng tên trường** | API trả đúng `{createdAt,fileName,id,mimeType,uploadedByName}`; `mimeType`=image/png; `fileName` đúng | **4/4 ĐẠT** |
| **B. Byte ảnh thật** | tải 200 · `Content-Type: image/png` · **chữ ký tệp PNG** · **trùng khớp từng byte** với tệp đã lưu | **4/4 ĐẠT** |
| **C. Đường có/không cookie** | có cookie ⇒ 200; **không cookie ⇒ 401** (chứng minh B chạy trên đường đã đăng nhập) | **2/2 ĐẠT** |
| **D. Kiểm tĩnh** | UI lọc theo `file.mimeType` · ≥2 `<img>` trỏ đúng endpoint · `height:118px`+`object-fit:cover` · `overflow-wrap:anywhere` · `auto-fill/minmax` · có trạng thái rỗng | **6/6 ĐẠT** |
| **E. Đối chứng** | HTML cố ý hỏng **không** bị nhận là ảnh · PNG thật vẫn nhận đúng · **phân biệt PNG ↔ JPEG** · PNG của cổng hợp lệ | **4/4 ĐẠT** |
| **Fixture** | cắm đúng 1 dòng + 1 tệp · **dọn về đúng mức nền** | **2/2 ĐẠT** |

> **Vì sao lớp A quan trọng nhất:** UI đọc `file.mimeType` — nếu API trả `mime_type` thì **ảnh không bao giờ hiện
> mà không có lỗi nào để thấy**. Cổng này biến lớp lỗi im lặng đó thành phép đo có đối chứng.

## 6. Giới hạn & phát hiện dữ liệu (ghi rõ, không giấu)

1. **DỮ LIỆU THẬT: 1/1 dòng `attachments` KHÔNG tới được qua API.** Dòng duy nhất trỏ tới
   `GRN_b1cbfe5f-…` — chứng từ **có tồn tại** nhưng `purchase_order_id` của nó **trỏ tới PO không tồn tại**
   (`LEFT JOIN purchase_orders` ⇒ `po_ton_tai = NULL`). Java tra chủ dự án qua `JOIN purchase_orders`
   (`FileStoreAdapter:77-79`) ⇒ **rỗng ⇒ 403** *"Chứng từ không tồn tại hoặc loại hồ sơ không được hỗ trợ."*
   ⇒ **đây là bản ghi mồ côi, không phải lỗi mã**; người dùng cần quyết định **dọn hay giữ** (giống nhóm D1/D5).
2. **Kho tệp có 11 tệp nhưng chỉ 1 dòng trong DB**, và cả 11 tệp **đều 70 byte** (PNG 1×1 rất nhỏ) trỏ tới các
   chứng từ **không còn trong DB** ⇒ dấu vết của các lượt thử trước. **Không tự xoá.**
3. **Chưa đo được phần RENDER** (ảnh có hiển thị đúng bố cục không): bundle đang chạy cũ hơn nguồn ~13 giờ
   (**TASK-034**). Cổng ảnh 28 ảnh **không phủ** màn chi tiết phiếu/hồ sơ (Known Problem #68).
4. **`Content-Disposition: attachment`** khi tải tệp: trình duyệt **bỏ qua** header này với `<img>` (chỉ áp dụng cho
   điều hướng/tải xuống) nên ảnh vẫn hiển thị; **chưa kiểm chứng bằng mắt** vì lý do (3).
5. Chỉ đo **đường ĐỌC + tải tệp**; phần **TẢI LÊN** (POST) và **XOÁ** (DELETE) không nằm trong phạm vi §8.3.

## 7. Tệp thay đổi

| Tệp | Thay đổi |
|---|---|
| `app/page.tsx` | `AttachmentPanel`: +`imageFiles` · +dải ảnh xem trước · ô 42px đổi từ chip chữ sang **ảnh thu nhỏ** (**+671 ký tự**; số URL tệp 2 → 5) |
| `app/styles/canonical.css` | +13 dòng luật `.attachment-photos/.attachment-photo/.attachment-thumb` + chống tràn khung (**+1600 byte**) |
| `app/globals.css` | **không đổi** — khối sai chỗ đã được **rút ra** để tôn trọng mốc đóng băng R1.1.1 |
| `tools/probe-task075-attachments.mjs` | **MỚI** — cổng 22 phép kiểm (fixture + đối chiếu byte + 4 đối chứng + dọn dẹp) |
| `docs/25_TODO_ROADMAP.md` · `docs/agent-progress/{MASTER_STATUS,TASK_INDEX}.md` | `P-06` → DONE · mốc trạng thái |
