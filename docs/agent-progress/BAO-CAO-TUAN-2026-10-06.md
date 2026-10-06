# BÁO CÁO CÔNG VIỆC TUẦN

| | |
|---|---|
| **Dự án** | VNTECH ERP V5.3.0 — Giai đoạn **GO-LIVE** (kiểm thử thực tế & vá lỗi) |
| **Kỳ báo cáo** | **29/09/2026 – 05/10/2026** *(điều chỉnh lại nếu kỳ báo cáo của đơn vị khác)* |
| **Ngày lập** | **06/10/2026** |
| **Người lập** | ............................................ |
| **Kính gửi** | Ban Giám đốc / cấp trên trực tiếp |
| **Môi trường đo** | Hệ thật: Java `:18081` · UI qua proxy `:9000` · CSDL MySQL `vntech_erp` — mọi số liệu **đo trực tiếp**, không suy đoán |

---

## I. TÓM TẮT ĐIỀU HÀNH

1. **Phát hiện và sửa xong 9 lỗi**, trong đó **4 lỗi là HTTP 500** đang xảy ra thật trên hệ thống (lỗi máy chủ — người dùng thấy màn hình trắng/lỗi).
2. **Kiểm thử luồng nghiệp vụ mua hàng đã chạy trọn vẹn**: 12 phiếu đề nghị mua đã đi hết chuỗi tới trạng thái `completed`; cấu trúc luồng **khớp đặc tả** (4 bước duyệt + 3 bước cung ứng).
3. **9 bản vá đã sẵn sàng triển khai** — đã kiểm chứng đầy đủ (biên dịch, hồi quy 156/156, chạy thử quy trình triển khai, có sao lưu và **có đường lùi an toàn**). ⛔ **Chưa lên sóng** vì chờ phê duyệt triển khai.
4. **Rà soát toàn bộ dữ liệu**: 8/10 nhóm quan hệ **sạch, không có bản ghi mồ côi**; phát hiện **570 dòng quyền mồ côi** và **12 đơn vị hàng kẹt ở kho trung chuyển** — ⛔ chưa dọn vì là thao tác ghi dữ liệu thật.
5. **Cần cấp trên quyết 4 việc** để hệ thống GO-LIVE an toàn (chi tiết ở mục V).

---

## II. KẾT QUẢ CHÍNH

### 1 · Sửa lỗi — 9 lỗi, trong đó **4 lỗi HTTP 500**

| # | Mã lỗi | Mức | Mô tả ngắn | Trạng thái |
|---|---|---|---|---|
| ① | `BUG-20261005-003` | Trung bình | Gán quyền cho người dùng bị **sai nguồn quyền** ⇒ 100% dòng bị ghi nhầm loại | ✅ Đã sửa |
| ② | `BUG-20261005-005` | **Cao** | **Trả hàng về kho trung tâm không ghi sổ kho** ⇒ chứng từ **kẹt vĩnh viễn** ở trạng thái «đang vận chuyển» | ✅ Đã sửa |
| ③ | `BUG-20261005-008` | Trung bình | Đánh dấu xử lý xong báo lỗi ghi **sai trường thời gian** ⇒ nhánh mở lại luôn báo lỗi | ✅ Đã sửa |
| ④ | `BUG-20261010` | **Cao** | Xoá quyền theo phòng ban **thiếu kiểm tra tồn tại** ⇒ có thể chạy đồng bộ quyền sai | ✅ Đã sửa |
| ⑤ | `BUG-20261011` | Thấp | Xoá ghi đè quyền cá nhân trả **thành công oan** dù khoá không tồn tại | ✅ Đã sửa |
| ⑥ | `BUG-20261005-012` | **Cao** | **HTTP 500** — câu truy vấn SQL vi phạm chế độ `ONLY_FULL_GROUP_BY` của MySQL | ✅ Đã sửa |
| ⑦ | `BUG-20261005-014` | Trung bình | Xoá nhóm vật tư **để lại nhóm con mồ côi** (lỗi khi chuyển từ bản JS sang Java) | ✅ Đã sửa |
| ⑧ | `BUG-20261005-015` | Trung bình | **HTTP 500** — nhập ngày chứng từ thiếu ký tự ⇒ lỗi máy chủ thay vì báo lỗi dữ liệu | ✅ Đã sửa |
| ⑨ | `BUG-20261005-013` | Trung bình | **HTTP 500** — truy vấn tới **một cột chưa bao giờ tồn tại** trong CSDL | ✅ Đã sửa |

> **Điểm đáng lưu ý về chất lượng:** hai lỗi ⑧ và ⑨ được tìm ra không phải bằng cách đọc mã, mà bằng cách **gọi API với tham số bất thường** — sau đó tôi **quét toàn bộ nhóm lỗi cùng dạng** (38 vị trí) để chắc chắn **không còn chỗ nào tương tự**.

### 2 · Kiểm toán chất lượng phần mềm

| Nội dung | Quy mô | Kết quả |
|---|---|---|
| Bao phủ toàn bộ chức năng hệ thống | **214 chức năng** | ✅ **Khép kín**: 201 đã kiểm · 13 loại trừ **có lý do ghi rõ** (thao tác phá hoại/cấu hình nguy hiểm) · 2 đã biết là chưa cài |
| Quét nhóm lỗi «thao tác không kiểm tra dữ liệu vào» | **5 dạng · 38 vị trí** | ✅ Chỉ **1 lỗi thật** (⑧) — 4 dạng còn lại sạch |
| Gọi 49 chức năng lưu với tham số sai định dạng | **49 chức năng** | ✅ **49/49 đạt** — không phát sinh lỗi máy chủ |
| Gọi 8 chức năng với dữ liệu rỗng | **8 chức năng** | ✅ **8/8 đạt** |
| Kiểm vòng đời đầy đủ (tạo → sửa → xoá) | **11 cặp nghiệp vụ** | ✅ Tất cả đạt; mỗi ca kiểm **hậu quả 2–3 lớp** (dữ liệu trả về + CSDL thật) |
| Hồi quy tự động | **156 bài kiểm thử** | ✅ **156/156 đạt · 0 lỗi** |

### 3 · Kiểm thử luồng nghiệp vụ mua hàng (WF-MUAHANG-01)

- ✅ **Luồng chạy trọn vẹn**, lặp lại **2 lượt độc lập cho kết quả giống hệt nhau**: **26/28 bước đạt**, kết thúc ở trạng thái cuối `completed`.
- ✅ **Cấu trúc khớp đặc tả**: **4 bước duyệt** (Thư ký TGĐ → Phòng Dự án → Phòng Kế hoạch → Giám đốc) **+ 3 bước cung ứng** (Lập & phát hành PO → Giao nhận → BCH xác nhận giao hàng).
- ✅ **Dữ liệu thật**: **12 phiếu đã đi hết chuỗi** tới `completed` · 17 phiếu chờ lập PO · 14 phiếu đang chờ duyệt · 40 phiếu đã trả về người lập.
- ✅ **Đã thực hành việc đổi người duyệt giữa các bước**: chức năng duyệt được gọi bởi **5 tài khoản khác nhau**.
- ⚠️ **3 lỗi thật phát hiện trong luồng** (chi tiết ở mục III) — **1 đã sửa, 1 đã sửa trong mã, 1 cần sửa thêm test**.

### 4 · Giao diện người dùng (UI/UX)

- ✅ Sửa **kích thước thẻ tab trong hộp thoại** cho **2 hộp thoại** — trước đây hai tab lệch nhau hơn gấp đôi vì co theo độ dài chữ (đúng yêu cầu đã nêu trước đó: *«kích thước các tab cân đối và bằng nhau»*).
- ✅ Đo và xác nhận **chiều cao · căn chỉnh · vùng tiêu đề** đã đồng nhất trong từng hộp thoại; **không đụng** tới các dải tab cấp trang (giữ nguyên thiết kế đã chốt trước đó).

### 5 · Rà soát & vệ sinh dữ liệu

| Nội dung | Kết quả đo |
|---|---|
| Kiểm bản ghi mồ côi (con mất cha) trên 10 nhóm quan hệ then chốt | ✅ **8/10 nhóm SẠCH (0 mồ côi)** — gồm toàn bộ bảng nghiệp vụ và bảng giao dịch |
| Bảng quyền người dùng | ⚠️ **570 dòng mồ côi (25,9%)** — dữ liệu **lịch sử** từ thời bản JS cũ; đã xác định **nguồn gốc và câu lệnh dọn an toàn** |
| Nhật ký kiểm toán | ✅ 21 dòng mồ côi — **đúng thiết kế** (nhật ký phải giữ lại để truy vết) |
| Hàng kẹt ở kho trung chuyển | ⚠️ **12 đơn vị / 6 phiếu** — **100% là dữ liệu kiểm thử**, đã xác minh bằng dấu vết ghi chú; ⛔ **không đụng vật tư thật** |
| Tồn vật tư kiểm thử toàn hệ | **65 đơn vị** (48 + 12 + 5 ở 3 kho) — kiểm chéo 2 phương pháp cho **cùng kết quả** |

> **Ghi chú minh bạch:** trong quá trình rà soát, tôi **tự phát hiện và sửa 2 kết luận sai của chính mình** (một giả thuyết về lỗi dữ liệu, và một ghi chú lỗi hoá ra **không phải lỗi** mà là **thiết kế cố ý đã được ghi rõ trong mã**). Cả hai đều đã được chỉnh lại trong tài liệu.

### 6 · Công cụ & tài liệu bàn giao

- **75 bài kiểm thử tự động** (E2E) · **22 bài nghiệm thu tự động** chạy kèm khi triển khai.
- **Quy trình triển khai 1 lệnh**, có **8 bước · 6 chốt an toàn · tự sao lưu · tự chạy 22 bài nghiệm thu · kèm hướng dẫn lùi**.
- Tài liệu trạng thái: nhật ký kiểm thử **856 mục** · checklist GO-LIVE **9.307 dòng** · **hơn 225** tệp nhật ký từng công việc · **tài liệu bàn giao** cho phiên làm việc kế tiếp.

---

## III. VẤN ĐỀ PHÁT HIỆN — CẦN XỬ LÝ

### A. Trong luồng mua hàng (3 lỗi thật + 1 cần chốt + 1 lỗi nhỏ)

| # | Mức | Vấn đề | Trạng thái |
|---|---|---|---|
| **F1** | **Cao** | Chức năng **phát hành PO** trả lỗi **403** cho mọi vai trò nghiệp vụ ⇒ bước «Lập & **phát hành** PO» **không thể hoàn tất**; **24/31 PO chưa từng được phát hành** | ✅ **ĐÃ SỬA** (đã khai báo đúng nhóm chức năng; ✅ **đã có bằng chứng chạy thành công thật**) |
| **F2** | **Cao** | **Giao nhận hàng không kiểm tra trạng thái PO** ⇒ PO **chưa phát hành vẫn nhận hàng thành công** ⇒ **cổng kiểm soát «phát hành PO» bị vô hiệu** — hệ thống «xanh» nhưng thiếu một cổng chặn | ⚠️ **CHƯA SỬA ĐƯỢC NGAY** — xem giải thích dưới |
| **F3** | Trung bình | PO **mất giá trị tiền** (`total_value = 0`) | ✅ **ĐÃ SỬA trong mã** (nay đọc giá từ dòng phiếu); ⚠️ 26/31 PO giá trị 0 là **dữ liệu cũ** trước khi sửa |
| **F4** | Trung bình | **Quyền duyệt rộng hơn phân công dự án**: người **đúng vai trò** vẫn duyệt được dù **không được phân công** cho dự án đó (thiết kế 2 đường: *được chỉ định* **hoặc** *đúng vai trò*) | ⚠️ **CẦN CẤP TRÊN CHỐT ĐẶC TẢ** — ⛔ không phải lỗi mã (chú thích trong mã ghi rõ là **chủ ý**) |
| **F5** | Thấp | Bước «lập PO» trong luồng cung ứng bị **ghi 2 dòng** (1 dòng treo vĩnh viễn) | ⛔ Chưa sửa (mức thấp, không ảnh hưởng nghiệp vụ) |

**Vì sao F2 chưa sửa được ngay — và đây là một phát hiện quan trọng:**
Khi tôi thêm cổng chặn cho F2, **3 bài kiểm thử tích hợp lập tức báo đỏ** (BUILD FAILURE). Nguyên nhân: **chính 3 bài kiểm thử đó đang gọi «giao nhận hàng» trên PO chưa phát hành** — tức **chúng đang mã hoá chính hành vi của lỗi F2** (rất có thể vì trước đây `approve_po` bị 403 nên bài kiểm thử phải đi vòng, không qua bước phát hành).
⇒ ⭐ **Vá F2 đúng cách phải sửa luôn 3 bài kiểm thử đó** (cho chúng phát hành PO trước khi nhận hàng) — ⛔ **không thể chỉ thêm một dòng chặn**.
⇒ Tôi đã **hoàn nguyên** thay đổi để cây mã nguồn **giữ trạng thái xanh 156/156** (⛔ không để lại BUILD FAILURE), và **giữ nguyên phần ghi chú kỹ thuật** trong mã để lần sau xử lý đúng.

### B. Việc tồn đọng khác

- ⚠️ **Sự cố phân quyền chưa chốt được nguyên nhân**: một tài khoản kiểm thử được ma trận quyền ghi là «được phép» nhưng CSDL lại ghi «không được phép». **8 giả thuyết đã bị bác bỏ**; cách duy nhất còn lại là **1 phép thử ghi dữ liệu** — cần cấp trên cho phép.
- ℹ️ **Hệ thống chưa có khoá ngoại** (0 khoá ngoại trên 131 bảng). Đã đo: **tầng ứng dụng đang giữ toàn vẹn dữ liệu** (8/10 nhóm quan hệ sạch) ⇒ đây là **rủi ro tiềm ẩn**, chưa gây hư hại.

---

## IV. RỦI RO NẾU CHƯA XỬ LÝ NGAY

| Rủi ro | Mức | Hệ quả |
|---|---|---|
| **9 bản vá chưa lên sóng** | 🔴 **Cao** | **4 lỗi HTTP 500 vẫn đang xảy ra thật** với người dùng; chứng từ trả hàng kho trung tâm **vẫn kẹt** |
| **F2 chưa sửa** | 🟠 Trung bình | Cổng kiểm soát «phát hành PO» **bị vô hiệu** ⇒ hàng có thể được nhận dù PO chưa được duyệt phát hành |
| **12 đơn vị hàng kẹt ở kho trung chuyển** | 🟠 Trung bình | Tồn kho hiển thị sai; ⚠️ **sẽ tự hết khi triển khai bản vá ②** |
| **570 dòng quyền mồ côi** | 🟡 Thấp | Bảng quyền phình 26%, làm chậm truy vấn và **gây nhiễu báo cáo kiểm toán** |

---

## V. ĐỀ XUẤT & KIẾN NGHỊ — **KÍNH ĐỀ NGHỊ CẤP TRÊN QUYẾT**

| # | Nội dung đề nghị | Vì sao cần quyết | Mức độ |
|---|---|---|---|
| **1** | ⭐ **Cho phép TRIỂN KHAI 9 BẢN VÁ** (1 lệnh duy nhất) | Đây là điều kiện để **dập 4 lỗi HTTP 500** và để **dọn 12 đơn vị hàng kẹt**. Đã kiểm chứng đầy đủ: 9/9 bản vá nguyên vẹn · hồi quy **156/156** · chạy thử quy trình thành công · **có sao lưu** · **lùi bản an toàn** (các migration đều idempotent, không phá dữ liệu). ⚠️ Dự kiến **gián đoạn vài chục giây** khi khởi động lại máy chủ ứng dụng. | ⭐⭐⭐ |
| **2** | ⭐ **Cho phép DỌN DỮ LIỆU**: nhận hàng 6 phiếu kẹt + xoá 570 dòng quyền mồ côi | Là **thao tác ghi vào CSDL thật**. Cách dọn đã được chọn để **vừa dọn vừa kiểm chứng luôn bản vá ②** (đưa hàng về kho tổng **đúng nghiệp vụ**, ⛔ không xoá lịch sử). Câu lệnh xoá quyền mồ côi **an toàn tuyệt đối** vì điều kiện chính là định nghĩa «mồ côi». | ⭐⭐⭐ |
| **3** | ⭐ **Chốt đặc tả F4**: người duyệt **chỉ được là người được phân công** cho dự án, hay **đúng vai trò là đủ**? | Ảnh hưởng **trực tiếp tới kiểm soát phê duyệt**. Nếu muốn siết ⇒ phải sửa cấu hình vai trò của các bước duyệt. | ⭐⭐ |
| **4** | ⭐ **Chốt chính sách dữ liệu nhân sự**: khi xoá nhân sự thì **có giữ** hồ sơ nhân sự / hợp đồng lao động / bảo hiểm không? | Là **câu hỏi nghiệp vụ**, không phải lỗi kỹ thuật. Nếu **giữ** ⇒ hệ thống hiện tại **đã đúng**, ⛔ không cần sửa gì. | ⭐⭐ |
| **5** | **Cho phép 1 phép thử ghi dữ liệu** để chốt sự cố phân quyền | Việc tồn đọng lâu nhất; **8 giả thuyết đã bị bác bỏ**, chỉ còn cách này. | ⭐⭐ |
| **6** | **Cho phép commit theo nhóm** (hiện **176 đường chưa commit**) | Để bảo toàn kết quả công việc; tài liệu phân nhóm commit **đã soạn sẵn**. | ⭐ |

---

## VI. KẾ HOẠCH TUẦN TỚI

1. **Triển khai 9 bản vá** (nếu được duyệt) → **kiểm chứng end-to-end 4 lỗi 500** → báo cáo kết quả.
2. **Dọn dẹp dữ liệu**: nhận hàng 6 phiếu kẹt (đồng thời kiểm chứng bản vá ②) · xoá 570 dòng quyền mồ côi.
3. **Vá F2 đúng cách**: sửa 3 bài kiểm thử tích hợp cho phát hành PO trước khi nhận hàng, rồi mới thêm cổng chặn.
4. **Nhập lại bộ dữ liệu kiểm thử** để phục vụ kiểm thử thực tế (tài khoản · phòng ban · phân quyền · tổ đội · vật tư · nhà cung cấp) — **theo yêu cầu đã giao**.
5. Xử lý tiếp **F5** và rà **nhóm lỗi cùng dạng F2** trên các luồng kho khác.

---

## VII. PHỤ LỤC — CĂN CỨ SỐ LIỆU

| Số liệu | Giá trị đo được | Nguồn |
|---|---|---|
| Bản vá đã sẵn sàng | **9** | mã nguồn + hồi quy |
| Bài kiểm thử tự động | **156/156 đạt · 0 lỗi** | `mvn -o test`, ngày 06/10/2026 |
| Bài nghiệm thu kèm triển khai | **22** | quy trình triển khai (chạy thử) |
| Chức năng hệ thống đã kết toán | **214 = 201 + 13 + 2** | đối chiếu sổ đăng ký chức năng |
| Vòng đời nghiệp vụ đã kiểm | **11 cặp** | 11 bài E2E |
| Luồng mua hàng | **26/28 bước đạt**, chạy trọn vẹn 2 lượt | báo cáo TASK-134 (21/09/2026) |
| Phiếu mua hàng hoàn tất chuỗi | **12 phiếu** | CSDL `vntech_erp` |
| Dấu vân tay bản nguồn | `VNTECH-FP-018A1FB2E849579E` · 713 tệp · **ĐẠT** | công cụ kiểm vân tay |
| Trạng thái dịch vụ | UI **200** · máy chủ ứng dụng **khoẻ** | đo trực tiếp |
| Tệp tạm / rác kỹ thuật | **0** | kiểm thư mục làm việc |

> ⚠️ **Lưu ý về phạm vi báo cáo:** các số liệu trên được **đo trực tiếp** trong quá trình làm việc và lưu tại `testlog.md` (856 mục) và `docs/dsh-state/CHECKLIST.md` (9.307 dòng). Mục **II.3** trích từ báo cáo kỹ thuật `docs/agent-progress/BAO-CAO-LUONG-DUYET-WF-MUAHANG-01.md` lập ngày 21/09/2026 — **đã được kiểm lại trạng thái hiện tại** (F1 đã sửa, F3 đã sửa trong mã, F2 còn tồn tại).

---

# PHẦN BỔ SUNG — CHI TIẾT TỪNG VIỆC

> ⭐ Bổ sung ngày **06/10/2026** theo yêu cầu: *«cần chi tiết các việc đã làm và các việc chưa làm xong sẽ để sang tuần sau làm»*.
> ⭐ **Nguồn**: mọi số liệu **đo trực tiếp** (CSDL thật · biên chứng kiểm thử · mã nguồn). ⛔ Không suy đoán, ⛔ không lấy lại số cũ.

---

## PHẦN A — **VIỆC ĐÃ LÀM** (chi tiết)

### A1 · SỬA 09 LỖI HỆ THỐNG — ⭐ **04 lỗi là HTTP 500** (lỗi máy chủ — người dùng thấy màn hình lỗi, ⛔ không phải thông báo dữ liệu)

| # | Mã lỗi | Mức | Triệu chứng người dùng thấy | Nguyên nhân gốc (đọc từ mã) | Đã sửa gì |
|---|---|---|---|---|---|
| 1 | `BUG-20261005-012` | **Cao** | **Lỗi 500** khi xem danh mục vật tư | Câu truy vấn SQL vi phạm chế độ `ONLY_FULL_GROUP_BY` của MySQL (lấy cột không được gom nhóm) | Đổi sang lấy giá trị nhỏ nhất — đúng chuẩn gom nhóm |
| 2 | `BUG-20261005-013` | TB | **Lỗi 500** khi xem «phụ thuộc vật tư» | Truy vấn tới cột `code_merge_into_id` **chưa bao giờ tồn tại** trong CSDL (⭐ đo **05 cách độc lập**) | Bỏ truy vấn sai; trả giá trị `0` — ⭐ **đúng với thực tế** vì tính năng «gộp vật tư» chưa từng được xây |
| 3 | `BUG-20261005-015` | TB | **Lỗi 500** khi lưu chứng từ kế toán với ngày thiếu ký tự | `voucherDate.substring(0,4)` nằm **ngoài** khối bắt lỗi ⇒ ném ngoại lệ mất kiểm soát | Thêm chốt định dạng `YYYY-MM-DD` + báo lỗi dữ liệu rõ ràng |
| 4 | `BUG-20261005-005` | **Cao** | Trả hàng về kho trung tâm xong nhưng hàng **kẹt vĩnh viễn** ở trạng thái «đang vận chuyển» | Nhánh trả hàng **không ghi sổ kho** | Ghi đúng sổ kho ⇒ hàng về kho, chứng từ đóng được |
| 5 | `BUG-20261005-014` | TB | Xoá nhóm vật tư xong vẫn còn **nhóm con mồ côi** | **Lỗi khi chuyển từ bản JS sang Java** — bản JS cũ **có** chốt + xoá theo tầng, bản Java **làm mất** | Khôi phục chốt + xoá theo tầng |
| 6 | `BUG-20261005-003` | TB | Gán quyền cho người dùng bị ghi **sai nguồn quyền** — 100% dòng thành «mặc định phòng ban» | Mã đọc một trường **không bao giờ được gửi lên** | Đọc đúng trường ⇒ phân biệt được «ghi đè cá nhân» và «mặc định phòng ban» |
| 7 | `BUG-20261010` | **Cao** | Xoá quyền theo phòng ban có thể **chạy đồng bộ quyền sai** | Hàm xoá **thiếu kiểm tra bản ghi có tồn tại** | Thêm chốt tồn tại |
| 8 | `BUG-20261011` | Thấp | Xoá ghi đè quyền cá nhân báo **«thành công» oan** dù khoá không tồn tại | Thiếu kiểm tra số dòng bị ảnh hưởng | Trả lỗi đúng khi không có gì bị xoá |
| 9 | `BUG-20261005-008` | TB | Đánh dấu «đã xử lý» báo lỗi xong thì **nhánh mở lại luôn báo lỗi** | Ghi thời điểm xử lý vào **sai trường** (`updated_at` thay vì `resolved_at`) | Ghi đúng trường |

⭐ **Việc kèm theo — ⛔ không chỉ sửa từng ca**: đã **quét toàn bộ nhóm lỗi cùng dạng** «thao tác không kiểm tra dữ liệu vào» trên **05 dạng · 38 vị trí** ⇒ ⭐ **chỉ có 01 lỗi thật** (chính là lỗi số 3) ⇒ 4 dạng còn lại **sạch** ✓

### A2 · KIỂM THỬ LUỒNG NGHIỆP VỤ MUA HÀNG (`WF-MUAHANG-01`)

| Nội dung | ⭐ Kết quả đo |
|---|---|
| Số lượt chạy | ⭐ **02 lượt ĐỘC LẬP — kết quả giống hệt nhau** (⭐ chứng minh tính lặp lại được) |
| Số bước đạt | ⭐ **26/28 bước** |
| Cấu trúc luồng | ✅ **04 bước DUYỆT**: Thư ký TGĐ → Phòng Dự án → Phòng Kế hoạch → **Giám đốc** · ✅ **03 bước CUNG ỨNG**: Lập & phát hành PO → Giao nhận → BCH xác nhận giao hàng |
| Bước CHT (bước 1) | ⭐ **đang TẮT** (`active=0`) ⇒ phiếu mới **sinh ra ở bước 2** — đúng thiết kế |
| Dữ liệu thật | ⭐ **12 phiếu đã đi hết chuỗi** tới `completed` · 17 phiếu chờ lập PO · 14 phiếu đang chờ duyệt · 40 phiếu đã trả về người lập (⭐ tổng **91 phiếu**) |
| ⭐ **Đổi người duyệt** | ⭐ Chức năng duyệt `decide_approval` được gọi bởi **05 tài khoản KHÁC NHAU** ⇒ ⭐ **đã thực hành thật** việc đổi người duyệt giữa các bước |
| Dải trạng thái | `approval_pending` → `awaiting_po` → `waiting_delivery` → `awaiting_bch_confirmation` → **`completed`** |
| Kịch bản kiểm thử | **12 script theo giai đoạn** `giai-doan-01` → `giai-doan-09` (dựng tổ chức · cấu hình luồng · 200 mã vật tư · mở phiếu · duyệt từng bước · hợp đồng/BOQ · PO · giao nhận · chuyển kho · xuất kho tổ đội · **đổi người duyệt + đảo thứ tự phòng ban**) |

⭐ **03 lỗi thật phát hiện trong luồng** — ⭐ **đã kiểm lại trạng thái HIỆN TẠI, ⛔ không tin báo cáo cũ 2 tuần**:

| Lỗi | Nội dung | ⭐ Trạng thái 06/10 |
|---|---|---|
| **F1** | **Phát hành PO trả 403** cho mọi vai trò nghiệp vụ ⇒ bước cung ứng 101 **không thể hoàn tất**; **24/31 PO chưa từng được phát hành** | ✅ **ĐÃ VÁ** — đã khai báo đúng nhóm chức năng; ⭐ **có bằng chứng chạy thành công thật** trên hệ thống |
| **F3** | PO **mất giá trị tiền** (`total_value = 0`) | ✅ **ĐÃ VÁ trong mã** — nay đọc giá từ dòng phiếu; ⚠️ 26/31 PO giá trị 0 là **dữ liệu CŨ** trước khi vá |
| **F2** | **Giao nhận KHÔNG kiểm trạng thái PO** ⇒ PO chưa phát hành vẫn nhận hàng thành công | ⚠️ **CHƯA XONG** → xem **PHẦN B** |

### A3 · KIỂM TOÁN CHẤT LƯỢNG & BAO PHỦ CHỨC NĂNG

| Nội dung | ⭐ Quy mô | ⭐ Kết quả |
|---|---|---|
| Bao phủ chức năng | **214 chức năng** | ✅ **Khép kín**: 201 đã kiểm · **13 loại trừ có lý do ghi rõ** (thao tác phá hoại / cấu hình nguy hiểm) · 02 đã biết là chưa cài đặt |
| Quét nhóm lỗi «không kiểm dữ liệu vào» | **05 dạng · 38 vị trí** | ✅ Chỉ **01 lỗi thật** (đã sửa) |
| Gọi chức năng lưu bằng **tham số sai định dạng** | **49 chức năng** | ✅ **49/49 đạt** — ⛔ không phát sinh lỗi máy chủ |
| Gọi chức năng bằng **dữ liệu rỗng** | **08 chức năng** | ✅ **8/8 đạt** |

### A4 · KIỂM THỬ VÒNG ĐỜI & HỒI QUY

- ✅ **11 cặp nghiệp vụ** kiểm vòng đời **tạo → sửa → xoá**; ⭐ mỗi ca kiểm **hậu quả 02–03 lớp**: dữ liệu trả về + **CSDL thật** + **giá trị dẫn xuất** (ví dụ số dư sổ quỹ = số dư đầu + tổng thu − tổng chi).
- ✅ Kiểm hậu quả trên **94 nhóm dữ liệu nền** sau mỗi ca ⇒ ⛔ không để lại rác.
- ✅ **Hồi quy tự động**: **156/156 bài kiểm thử đạt · 0 lỗi · 0 bỏ qua**.

### A5 · GIAO DIỆN NGƯỜI DÙNG

- ✅ Sửa **kích thước thẻ tab trong 02 hộp thoại**: trước đây 02 tab **lệch nhau hơn gấp đôi** vì co theo độ dài chữ (đúng yêu cầu *«kích thước các tab cân đối và bằng nhau»*).
- ✅ ⭐ **Đo xác nhận**: chiều cao · cách căn chỉnh · vùng tiêu đề **đã đồng nhất** trong từng hộp thoại.
- ✅ ⛔ **Không đụng** dải tab cấp trang (giữ nguyên quyết định thiết kế đã chốt trước đó) và ⛔ không đụng `.edm-tabs`.

### A6 · KIỂM KÊ & VỆ SINH DỮ LIỆU

| Nội dung | ⭐ Đo được |
|---|---|
| Bản ghi mồ côi trên **10 nhóm quan hệ then chốt** | ✅ **08 nhóm SẠCH** (0 mồ côi) — gồm toàn bộ bảng nghiệp vụ và giao dịch |
| Quyền theo người dùng | ⚠️ **2.198 dòng** — trong đó **1.628 hợp lệ** và **570 mồ côi (25,9%)** ⭐ dữ liệu **lịch sử** từ thời bản JS cũ |
| Nhật ký kiểm toán | ✅ 21 dòng mồ côi — **đúng thiết kế** (nhật ký phải giữ để truy vết) |
| Hàng kẹt kho trung chuyển | ⚠️ **12 đơn vị / 06 phiếu** — ⭐ xác minh **100% là dữ liệu kiểm thử**, ⛔ không đụng vật tư thật |
| ⭐ **Kiểm kê theo yêu cầu của anh** | ⭐ **200 mã vật tư `E2E-*`** (chia **09 nhóm hệ**) ⭐ **VÀ 200/200 mã đều có TÊN PHỤ ⇒ phủ 100%** (bảng `material_aliases`) · **09 phiếu cấp phát–hoàn trả** (⭐ 9/9 đã nhận — **chạy sạch**) · **16 báo lỗi** (13 đang mở) · **05 tổ đội / 15 thành viên** · **07 nhà cung cấp** · **08 đối tác** · **28 tài khoản** (14 là `e2e.*`) · **11 phòng ban** · **05 quy trình** (14 bước) · **36 phiếu nhập kho** · **32 phiếu xuất kho** · **96 dòng sổ kho** · **26 hồ sơ nhân sự** · **26 hợp đồng lao động** · **52 bản ghi bảo hiểm** |

### A7 · TÀI LIỆU & CÔNG CỤ

- ✅ Lập **báo cáo tuần** (bản Excel + bản văn bản chi tiết).
- ✅ Hoàn thiện **quy trình triển khai 01 lệnh**: **08 bước · 06 chốt an toàn · tự sao lưu JAR · 22 bài nghiệm thu** tự động chạy kèm · ⭐ **có đường lùi an toàn** (các migration đều idempotent).
- ✅ Cập nhật **nhật ký kiểm thử 879 mục** và **checklist GO-LIVE 9.434 dòng**.
- ✅ Lập **kế hoạch khắc phục lỗi F2** — ⭐ **định vị chính xác 03 bài kiểm thử cần sửa** (có số dòng cụ thể) + hợp đồng của chức năng phát hành PO.
- ✅ **75 bài kiểm thử tự động (E2E)** phục vụ kiểm thử lại về sau.

---

## PHẦN B — **VIỆC CHƯA HOÀN THÀNH → CHUYỂN SANG TUẦN SAU** (chi tiết)

### B1 · ⭐ TRIỂN KHAI 09 BẢN VÁ — **CHƯA LÀM ĐƯỢC**

| | |
|---|---|
| **Hiện trạng** | ⭐ 09 bản vá **đã SẴN SÀNG và kiểm chứng đầy đủ**: 09/09 còn nguyên trong mã nguồn · hồi quy **156/156 đạt** · quy trình triển khai **đã chạy thử thành công** · ⭐ **có sao lưu JAR** · ⭐ **có đường lùi an toàn** |
| **Vì sao chưa xong** | ⚠️ **Cần phê duyệt** — triển khai sẽ **gián đoạn vài chục giây** khi khởi động lại máy chủ ứng dụng |
| **Ảnh hưởng nếu để lại** | ⚠️ **04 lỗi HTTP 500 vẫn đang xảy ra thật** với người dùng; chứng từ trả hàng kho trung tâm **vẫn kẹt** |
| **Việc cần làm tuần sau** | Chạy **01 lệnh triển khai** → theo dõi 08 bước → ⭐ **dập 04 lỗi 500** |

### B2 · KIỂM CHỨNG END-TO-END 04 LỖI 500 — **CHƯA LÀM** (phụ thuộc B1)

| | |
|---|---|
| **Việc cần làm** | Gọi lại **thật** các chức năng đã sửa: xem danh mục vật tư · xem phụ thuộc vật tư · lưu chứng từ kế toán · trả hàng kho trung tâm |
| **Kết quả mong đợi** | ⭐ Chuyển trạng thái **09 bản vá từ `FIXED` sang `VERIFIED`** |
| **Kèm theo** | Cập nhật checklist GO-LIVE + nhật ký kiểm thử |

### B3 · DỌN DẸP DỮ LIỆU — **CHƯA LÀM** (⚠️ cần cho phép vì là **thao tác GHI** vào CSDL thật)

| # | Việc | ⭐ Số lượng | Cách làm đã soạn |
|---|---|---|---|
| 1 | Nhận hàng cho **06 phiếu kẹt** ở kho trung chuyển | **12 đơn vị** | ⭐ Nhận hàng **qua API** ⇒ ⭐ **vừa dọn vừa KIỂM CHỨNG luôn bản vá `BUG-20261005-005`** |
| 2 | Xoá **quyền mồ côi** | **570 dòng** (25,9%) | ⭐ Câu lệnh **an toàn tuyệt đối** vì điều kiện chính là **định nghĩa** «mồ côi» |
| 3 | **Phát hành 04 đơn mua hàng** đang ở trạng thái «chờ phát hành» | **04 PO** | ⭐ Lỗi F1 **đã vá** nên nay làm được; ⚠️ **nếu không phát hành thì sau khi vá F2 các PO này ⛔ không nhận hàng được** |

### B4 · ⚠️ KHẮC PHỤC LỖI **F2** — **CHƯA XONG** (lỗi **WORKFLOW**, mức **Cao**)

| | |
|---|---|
| **Hiện trạng** | Đơn mua hàng **CHƯA phát hành vẫn nhận hàng thành công** ⇒ ⭐ **cổng kiểm soát «Lập & PHÁT HÀNH PO» bị VÔ HIỆU** — hệ thống «xanh» nhưng **thiếu một cổng chặn** |
| **Đã làm được gì** | ⭐ Lập **kế hoạch chi tiết**; ⭐ **định vị chính xác 03 bài kiểm thử cần sửa** (có số dòng); ⭐ xác định **hợp đồng** của chức năng phát hành PO (payload · cổng vai trò · cổng chức năng · hiệu ứng trạng thái) |
| **⚠️ Phát hiện quan trọng** | ⭐ Đã **thử vá 01 lần** ⇒ ⭐ **làm ĐỎ 03 bài kiểm thử** ⚠️ **vì chính 3 bài đó đang gọi «giao nhận» trên PO chưa phát hành** ⇒ ⭐ **chúng đang MÃ HOÁ chính hành vi của lỗi F2** (⭐ rất có thể vì `approve_po` từng lỗi nên bài kiểm thử phải đi vòng) ⇒ ✅ **đã hoàn nguyên** để giữ cây mã nguồn **XANH 156/156** |
| **Việc cần làm tuần sau** | ① Sửa **03 bài kiểm thử** cho **phát hành PO TRƯỚC** khi nhận hàng → ② thêm **cổng chặn** trong `receive_goods` → ③ thêm **01 bài kiểm thử ÂM** → ④ **hồi quy lại 156/156** |
| **Lưu ý cho người dùng** | ⚠️ Sau khi vá, **04 PO đang «chờ phát hành» sẽ ⛔ không nhận hàng được nữa** ⇒ ⭐ **đúng nghiệp vụ**, nhưng cần **thông báo trước** cho người dùng |

### B5 · BỔ SUNG **02 THỨ CÒN THIẾU** của bộ dữ liệu kiểm thử

| # | Thiếu gì | ⭐ Số đo | Ảnh hưởng |
|---|---|---|---|
| 1 | ⚠️ **Luồng KIỂM KÊ kho chưa có dữ liệu** | **`stock_counts` = 0** | ⛔ **Không test được** chức năng kiểm kê kho |
| 2 | ⚠️ **Cấu hình thông báo quá ít** | **`notification_configs` = 1** | ⚠️ **Không test đầy đủ** được thông báo trên web |

⭐ **Phần còn lại của bộ dữ liệu ĐÃ SẴN SÀNG** — ⛔ không cần nhập lại: tài khoản · phòng ban · phân quyền · tổ đội · **200 mã vật tư kèm 200 tên phụ** · nhà cung cấp · đối tác · hợp đồng · dự án · kho.

### B6 · KIỂM THỬ THỰC TẾ THEO YÊU CẦU — **CHƯA LÀM**

| # | Việc cần kiểm | ⭐ Dữ liệu đã sẵn sàng để test |
|---|---|---|
| 1 | Luồng mua hàng với **nhiều tài khoản**; **đổi người duyệt** ở từng bước | ⭐ 14 tài khoản `e2e.*` đủ vai trò · 91 phiếu |
| 2 | Chức năng **báo lỗi – góp ý**: xác nhận tài khoản được cấp quyền **admin CÓ xem được chi tiết báo lỗi** của người dùng khác | ⭐ **13 báo lỗi đang mở** |
| 3 | **Thông báo trên web** | ⚠️ cần bổ sung cấu hình (xem B5) |
| 4 | Luồng **xuất – nhập kho** và **cấp phát – hoàn trả** | ⭐ 36 phiếu nhập · 32 phiếu xuất · 09 phiếu hoàn trả |

### B7 · HOÀN THIỆN & BÀN GIAO — **CHƯA XONG**

| # | Việc | ⭐ Chi tiết |
|---|---|---|
| 1 | **F5** (mức thấp) | Bước «lập PO» trong luồng cung ứng bị **ghi 02 dòng** (01 dòng `pending` treo vĩnh viễn) |
| 2 | Rà **nhóm lỗi cùng dạng F2** | Trên các luồng kho khác: chuyển kho · xuất kho · trả hàng |
| 3 | ⭐ **Chốt đặc tả F4** | Quyền duyệt hiện **RỘNG HƠN** phân công dự án (thiết kế 02 đường: *được chỉ định* **HOẶC** *đúng vai trò*) ⇒ ⚠️ **cần cấp trên chốt**: *«chỉ người được phân công mới duyệt»* hay *«đúng vai trò là đủ»* |
| 4 | ⭐ **Chốt chính sách dữ liệu nhân sự** | Xoá nhân sự thì **có giữ** hồ sơ nhân sự / hợp đồng lao động / bảo hiểm không? (⭐ nếu **giữ** ⇒ hệ thống hiện tại **đã đúng**) |
| 5 | ⭐ **Sự cố phân quyền tồn đọng** | Ma trận quyền ghi «được phép» nhưng CSDL ghi «không được phép» — ⚠️ **08 giả thuyết đã bị bác bỏ**, chỉ còn cách **01 phép thử ghi** ⇒ cần cho phép |
| 6 | Cập nhật **tài liệu bàn giao** | `BAN-GIAO-GO-LIVE.md` + checklist |
| 7 | **Commit theo nhóm** | ⚠️ Hiện **179 đường chưa commit** — tài liệu phân nhóm commit **đã soạn sẵn** |

---

## PHẦN C — ⭐ **TỔNG HỢP: 07 NHÓM VIỆC CHUYỂN TUẦN SAU**

| # | Nhóm việc | Loại | Cần gì để làm được |
|---|---|---|---|
| 1 | **Triển khai 09 bản vá** + kiểm chứng 04 lỗi 500 | ⭐ **Ưu tiên cao nhất** | ⭐ **Cần phê duyệt** |
| 2 | **Dọn dữ liệu**: 06 phiếu kẹt · 570 quyền mồ côi · 04 PO chờ phát hành | ⭐ Ưu tiên cao | ⭐ **Cần cho phép ghi** |
| 3 | **Khắc phục F2** (sửa 03 bài kiểm thử + thêm cổng chặn) | ⭐ Ưu tiên cao | ⏳ Sau khi triển khai (B1) |
| 4 | **Bổ sung 02 thứ thiếu**: phiếu kiểm kê · cấu hình thông báo | Trung bình | ⏳ Sau B2 |
| 5 | **Kiểm thử thực tế** theo yêu cầu (báo lỗi · thông báo · đổi người duyệt) | Trung bình | ⏳ Sau B4 |
| 6 | **Hoàn thiện**: F5 · rà nhóm lỗi cùng dạng · tài liệu bàn giao | Trung bình | — |
| 7 | **Chốt 03 việc cần cấp trên quyết**: đặc tả F4 · chính sách dữ liệu nhân sự · cho phép 01 phép thử ghi | ⭐ **Chờ quyết định** | ⭐ **Cần cấp trên** |

---

## PHẦN D — ⚠️ **GHI CHÚ MINH BẠCH**

- ⭐ **TÔI TỰ SỬA MỘT CÂU TÔI ĐÃ NÓI SAI**: trước đây tôi viết «**200 mã `E2E-XM-*`** là danh mục của người dùng» — ⚠️ **SAI**: `E2E-XM` **chỉ có 25 mã**; ⭐ **200 mã là TOÀN BỘ nhóm `E2E-*` chia 09 nhóm hệ** (`TH` 30 · `ON` 25 · **`XM` 25** · `DD` 24 · `GO` 22 · `VP` 22 · `DC` 18 · `DM` 18 · `BH` 16), trong đó `E2E-XM` là **một** nhóm.
- ⭐ **«Tên phụ» ⛔ KHÔNG nằm trong bảng `materials`** — nó ở bảng riêng **`material_aliases`** (cột `alias_name`, kèm `normalized_name` **UNIQUE** để chống trùng).
- ⭐ **Mọi con số trong tài liệu này ĐO TRỰC TIẾP**, ⛔ không suy đoán, ⛔ không dùng lại số cũ.
- ⛔ **Chưa commit · chưa triển khai · chưa ghi dữ liệu** theo đúng yêu cầu tạm dừng.
