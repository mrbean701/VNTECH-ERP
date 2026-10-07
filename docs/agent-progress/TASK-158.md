# TASK-158 — GO-LIVE ĐỢT 13: BUG-20261005-008 — NÚT «MỞ LẠI BÁO LỖI» HỎNG 100%

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **BUG** | **BUG-20261005-008** (MEDIUM — chức năng luôn hỏng) |
| **Trạng thái** | ✅ **FIXED · VERIFIED** (test Java + **đối chứng âm**) · ⛔ **CHƯA TRIỂN KHAI** |
| **Tệp sửa** | `ErrorReportStore.java` (port) · `ErrorReportUseCase.java` · `ErrorReportStoreAdapter.java` |
| **Tệp test mới** | `java-backend/web/src/test/…/ErrorReportResolveIntegrationTest.java` (2 vệ) |
| **Tệp E2E mới** | `tools/e2e/go-live-bao-loi-danh-dau-xong.mjs` |
| **Vân tay** | ⛔ Không đổi (`java-backend/` + `tools/` ngoài `ROOT_DIRS`) |

---

## ① CÁCH TÌM RA — QUÉT «ĐƯỜNG CHƯA HỀ ĐƯỢC KIỂM»

Quét **214 action** trong `ActionRbacRegistry`, đối chiếu **548 tệp nguồn** (`tools/` · `tests/` · `scripts/` · `app/`):

| Kết quả | Số |
|---|---|
| Đã được gọi ở đâu đó | **212** |
| **CHƯA TỪNG được tham chiếu** | **2** |

Hai action đó:

| Action | Handler (`SystemController`) | UI gọi | Kết luận |
|---|---|---|---|
| **`mark_error_report_resolved`** | ✅ dòng **1474** | ✅ `ErrorReportAdminPanel.tsx:52` | ⭐ **ĐƯỜNG THẬT chưa hề được kiểm** ⇒ đi kiểm |
| `manage_contract_review` | ⛔ **KHÔNG có** | ⛔ không | **ĐĂNG KÝ THỪA** (ghi nhận riêng — xem §⑤) |

⭐ **Đây chính là cách tìm bug rẻ nhất: đi tìm đường CHƯA TỪNG CHẠY.** Và nó **đổ ngay ra một lỗi thật** — đúng như dự đoán «action chưa từng chạy = nơi dễ có bug ẩn».

---

## ② LỖI ĐƯỢC VÁ

| | |
|---|---|
| **TRIỆU CHỨNG** | `mark_error_report_resolved` với **`resolved=false` (MỞ LẠI)** **LUÔN thất bại**: «*Dữ liệu vi phạm ràng buộc của hệ thống (trùng hoặc thiếu tham chiếu). Vui lòng kiểm tra lại thông tin vừa nhập.*» |
| **AI GẶP** | **Quản trị viên** ở tab 14 «Báo lỗi»: bấm nút tick ✓ vào một report **đã xong** ⇒ UI gọi `next = String(r.status) !== "resolved"` = **`false`** ⇒ rơi **đúng** nhánh hỏng ⇒ **nút «mở lại» hỏng 100%** |
| **ROOT CAUSE** | `ErrorReportStoreAdapter.markResolved` truyền **`resolvedAt` vào cột `updated_at`** (lỗi copy-paste — tham số thứ 4 đúng ra phải là **thời điểm cập nhật**):<br>`SET status=?,resolved_at=?,resolution_note=?,updated_at=?` ← tham số 4 = `resolvedAt` |
| **VÌ SAO NỔ** | `updated_at` là **`varchar(32) NOT NULL`** trên MySQL. Khi **mở lại** thì `resolvedAt = null` ⇒ ghi **`NULL`** vào cột NOT NULL ⇒ `DataIntegrityViolationException` |
| **VÌ SAO THÔNG BÁO SAI LỆCH** | Ngoại lệ rơi vào bộ bắt `DataIntegrityViolationException` dùng chung (`SystemController:1488`) ⇒ báo «**dữ liệu của bạn** vi phạm ràng buộc» — trong khi **lỗi hoàn toàn ở phía máy chủ** |
| **HỆ QUẢ** | ⛔ Không có cách **hoàn tác** việc đánh dấu xong; ⛔ người dùng bị dẫn sai hướng đi kiểm tra dữ liệu của mình |
| **SEVERITY** | **MEDIUM** (nhánh chính «đánh dấu xong» vẫn chạy; chỉ nhánh «mở lại» hỏng — nhưng hỏng **100%**) |

---

## ③ ĐÃ VÁ GÌ (3 tầng, ⛔ không đổi hành vi nào khác)

| Tầng | Sửa |
|---|---|
| **Port** `ErrorReportStore` | `markResolved(reportId, resolvedAt, note)` → **`markResolved(reportId, resolvedAt, updatedAt, note)`** + tài liệu hoá lý do |
| **Use case** `ErrorReportUseCase.resolve` | truyền **`LocalDateTime.now().format(STAMP)`** cho `updatedAt` |
| **Adapter** `ErrorReportStoreAdapter.markResolved` | cột `updated_at` lấy từ **tham số riêng**, ⛔ không lấy `resolvedAt` |

⭐ `STAMP` = `"yyyy-MM-dd HH:mm:ss"` — **đúng khuôn** mà chính use case này dùng cho `created_at`/`updated_at` khi `save()` (`ErrorReportUseCase:27,58,75,76`) ⇒ ⛔ không phát minh định dạng mới.

---

## ④ KIỂM CHỨNG — CÓ ĐỐI CHỨNG ÂM

### Vệ mới `ErrorReportResolveIntegrationTest` (chạy đường API thật + H2)
| Vệ | Kiểm |
|---|---|
| `moLaiBaoLoi_khongDuocGhiNULLVaoUpdatedAt` | ① đánh dấu xong ⇒ `status=resolved` + có `resolved_at` + ghi `resolution_note` · ② **mở lại ⇒ `status=open` + `resolved_at` NULL + `updated_at` KHÁC NULL** ← *khẳng định của bản vá* |
| `doiChungAm_maSaiVaThieuMaDeuBiChan` | mã sai ⇒ «Không tìm thấy report» · thiếu mã ⇒ «Thiếu mã report» |

### ĐỐI CHỨNG ÂM CHẠY THẬT
| Bước | Kết quả đo được |
|---|---|
| **Cài lại lỗi cũ** (đổi tham số 4 về `resolvedAt`) | **ĐỎ**: `AssertionFailedError: MỞ LẠI không được ghi NULL vào 'updated_at' (MySQL: NOT NULL) — trước bản vá adapter lấy 'resolvedAt' gán cho cột này nên hỏng 100%` |
| **Khôi phục bản vá** (tệp giống **100%**) | **XANH**: `Tests run: 2, Failures: 0, Errors: 0` · BUILD SUCCESS |

### HỒI QUY TOÀN BỘ (§10)
`mvn -o test` ⇒ Domain **19** · Application **38** · Infrastructure **13** · Web **80** = **150 test · 0 failure · 0 error · BUILD SUCCESS · EXIT=0**

### BÀI E2E `go-live-bao-loi-danh-dau-xong.mjs` — ĐO TRÊN HỆ THỐNG ĐANG CHẠY
Chạy trên `:9000` → Java `:18081` (**JAR cũ, chưa có bản vá**) ⇒ **4/5 ĐẠT**, ⛔ **B3 «mở lại» ĐỎ** — **đúng như dự kiến**, vì đây là **bằng chứng lỗi còn nguyên trên bản đang chạy**:
- ✔ B2 đánh dấu xong: `status = resolved` · `resolvedAt = 2026-10-05 03:04:49` · ghi được `note` ✔
- ⛔ B3 mở lại: «Dữ liệu vi phạm ràng buộc của hệ thống…»
- ✔ B4 đối chứng âm: mã sai + thiếu mã đều bị chặn
- ✔ B5 đối chứng âm **quyền**: `e2e.kh` (người thường) bị chặn đúng

⭐ **Bài E2E này sẽ XANH sau khi triển khai** ⇒ nó là **phép thử nghiệm thu cho lần triển khai tới**.

---

## ⑤ HAI PHÁT HIỆN PHỤ (đã ghi, ⛔ chưa sửa)

| # | Phát hiện | Mức | Ghi chú |
|---|---|---|---|
| 1 | **`manage_contract_review` là ĐĂNG KÝ THỪA** — có trong `ActionRbacRegistry:212` và `ContractReviewUseCase:132` nhưng **KHÔNG có handler** trong `SystemController` và **không UI nào gọi** | LOW | Đăng ký thừa gây nhiễu khi rà soát quyền; ⛔ chưa xoá vì cần chắc không có client ngoài dùng |
| 2 | ⭐ **Schema H2 KÉM CHẶT HƠN MySQL**: `error_reports.updated_at` là **`NULL`-able** trong `schema-h2.sql` còn **`NOT NULL`** trên MySQL | ⚠️ **quan trọng** | ⇒ **CẢ MỘT LỚP LỖI `NOT NULL` KHÔNG THỂ bị test H2 bắt**. Vì vậy vệ mới khẳng định **hành vi quan sát được** (`updated_at` ≠ NULL) thay vì dựa vào ràng buộc — ⛔ nếu chỉ dựa vào ràng buộc thì vệ đã XANH GIẢ |

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| `mvn -o test` | **150 test · 0 failure · 0 error · BUILD SUCCESS · EXIT=0** |
| Đối chứng âm vệ mới | **ĐỎ ↔ XANH đúng** |
| E2E trên bản đang chạy | **4/5** — ⛔ B3 ĐỎ **đúng dự kiến** (JAR cũ chưa có bản vá) |
| Action chưa từng được kiểm | **2/214** (1 đã kiểm xong, 1 là đăng ký thừa) |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ nay **3 bản vá chưa lên sóng** (BUG-003 · BUG-005 · BUG-008) |

---

## ⑦ BÀI HỌC

1. ⭐⭐ **ĐI TÌM «ĐƯỜNG CHƯA TỪNG CHẠY» LÀ CÁCH TÌM BUG RẺ NHẤT.** Đo 214 action ↔ 548 tệp nguồn mất vài phút, và **đổ ngay ra một lỗi thật 100%**. Đây là phép đo **tổng quát**, lặp lại được, ⛔ không phụ thuộc may mắn.
2. ⭐ **LỖI COPY-PASTE Ở THAM SỐ THỨ 4.** `note, resolvedAt, reportId` — chỉ **một** tham số sai vị trí, mà hậu quả là **cả một nhánh chức năng hỏng 100%**. Khi đọc `jdbcTemplate.update`, phải **đối chiếu TỪNG tham số với TỪNG dấu `?`**.
3. ⭐ **THÔNG BÁO LỖI DÙNG CHUNG CHE MẤT NGUYÊN NHÂN.** Bộ bắt `DataIntegrityViolationException` báo «**dữ liệu của bạn** vi phạm ràng buộc» trong khi lỗi ở **phía máy chủ** ⇒ người dùng bị dẫn sai hướng. ⛔ Đừng tin thông báo lỗi; hãy đọc tầng dưới.
4. ⭐⭐ **SCHEMA TEST KÉM CHẶT HƠN SCHEMA THẬT ⇒ TEST KHÔNG BẮT ĐƯỢC LỖI.** H2 để `updated_at` NULL-able còn MySQL `NOT NULL` ⇒ vệ dựa vào ràng buộc sẽ **XANH GIẢ**. Phải khẳng định **hành vi quan sát được**.
5. ⭐ **BÀI E2E ĐỎ TRÊN BẢN CHƯA TRIỂN KHAI LÀ ĐÚNG** — ⛔ không phải thất bại; nó là **bằng chứng lỗi còn nguyên** và là **phép thử nghiệm thu** cho lần triển khai.

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — mục 1 nay có 3 BẢN VÁ chưa lên sóng:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — **3 bản vá chưa lên sóng** (BUG-003 · BUG-005 · **BUG-008**); pre-flight đã chứng minh **AN TOÀN** (TASK-155); làm việc này **ghi luôn `V35`+`V37`** vào `flyway_schema_history`. **Sau khi triển khai, chạy `go-live-bao-loi-danh-dau-xong.mjs` ⇒ kỳ vọng 5/5.**
2. **BUG-20261005-007** — 130 lớp thiếu CSS: xử lý theo màn hay để lại?
3. **Chốt bất đồng** «ai được nhận hàng ở kho đích» (`receive_transfer_order` ↔ `e2e.tk`).
4. **4 phiếu trả Kho Tổng kẹt `in_transit` + 9 đơn vị kẹt ở `WH-TRANSIT`** — dọn thế nào?
5. Xoá đăng ký thừa `manage_contract_review`? · 6. Mở task «thêm thành viên tổ đội»? · 7. Commit?
