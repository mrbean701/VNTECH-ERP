# 🎯 BÀN GIAO — VNTECH ERP GO-LIVE (viết 05/10/2026 · **cập nhật vòng 84 — 06/10/2026**)

> ⭐ **Tệp này trả lời 4 câu hỏi trong 2 phút**: ⭐ **Đang ở đâu?** · ⭐ **Có gì đang chờ?** · ⭐ **Cần quyết gì?** · ⭐ **Làm gì tiếp?**
> ⭐ Mọi con số ở đây **đã được ĐO trong vòng 84**, ⛔ không suy đoán.
> ⚠️ **ĐÍNH CHÍNH**: bản cũ (vòng 70) ghi **sai 12 chỗ** — ⭐ vân tay cũ · «7 bản vá» (nay **9**) · «16 bài nghiệm thu» (nay **22**) · CHECKLIST **8101** (nay **9512**) · testlog **723** (nay **894**) · và ⭐ **BUG-20261005-013 ghi «chờ quyết» trong khi ĐÃ VÁ XONG**. ⭐ Bản này đã sửa hết.

---

## 1. ⭐ ĐANG Ở ĐÂU — SỨC KHOẺ ĐO ĐƯỢC (vòng 84)

| Hạng mục | Số đo | Đánh giá |
|---|---|---|
| **Vân tay nguồn** | ⭐ **`VNTECH-FP-FC5EF3638B86E74D`** · **713 tệp** | ✅ **ĐẠT** |

> ⚠️ **VÂN TAY ĐÃ ĐỔI NGÀY 06/10/2026**: `VNTECH-FP-018A1FB2E849579E` ⇒ ⭐ **`VNTECH-FP-FC5EF3638B86E74D`**
> ⭐ **Nguyên nhân**: vá **`BUG-20261006-001`** trong `app/screens/ErrorReportAdminPanel.tsx` (⭐ tầng **UI** — ⛔ không phải Java)
> ⚠️ **Mọi tài liệu cũ ghi vân tay `018A1FB2E849579E` là ĐÃ LỖI THỜI** — ⭐ vân tay đúng hiện tại là **`FC5EF3638B86E74D`** ✓
| **Nhánh / HEAD** | `unity` · **`cae2815`** (01/10) | ⛔ **183 đường chưa commit** |
| **`:8787`** (dev, SQLite) | **HTTP 200** | ✅ chạy |
| **`:9000`** (proxy → Java) | **HTTP 200** | ✅ chạy |
| **`:18081`** (Java, MySQL thật) | ⭐ **PID 3784 SỐNG** · `POST /api/system` ⇒ **401** | ✅ **KHOẺ** |
| **JAR đang chạy** | build **01/10 10:24** | ⛔ **CHƯA có 9 bản vá** |
| **Kiểm thử backend** | `mvn -o test` = **156 test · 0 fail · 0 error · EXIT=0** | ✅ |
| **Tài liệu trạng thái** | `CURRENT_STATE` **1426** · `MASTER_STATUS` **783** · `CHECKLIST` ⭐ **9512** · `testlog` ⭐ **894** dòng | ✅ |
| **Nhật ký task** | ⭐ **242** tệp `TASK-*.md` — ⚠️ **số lớn nhất là `TASK-221`** (⭐ xem ghi chú ⚠️ bên dưới) | ✅ |
| **Công cụ E2E** | ⭐ **75** bài `tools/e2e/*.mjs` | ✅ |
| **Có gì bẩn không?** | tệp tạm **0** · `.snapshot` **0** · rác CSDL do bài kiểm tạo **0** | ✅ |

ⓘ ⭐ **Cách kiểm sức khoẻ ĐÚNG** (⭐ đã đo): gọi **`POST /api/system`** ⇒ kỳ vọng **401** (thiếu phiên) hoặc **200**.
⛔ **ĐỪNG gọi `/`** — backend **thuần API**, `/` trả **404** ⇒ ⭐ **dễ đọc nhầm thành «backend chết»** ✓ (⭐ tôi đã mắc đúng lỗi này ở vòng 59)

### ⚠️ GHI CHÚ KHOẢNG TRỐNG — tệp `TASK-*.md` ⛔ chưa đủ cho các vòng 77→84

⭐ **SỰ THẬT ĐO ĐƯỢC**: ⛔ **`TASK-222.md` · `TASK-223.md` · `TASK-224.md` ⛔ KHÔNG TỒN TẠI** ⚠️ — ⭐ tôi **đã ghi nhãn các số đó trong `CHECKLIST.md`** nhưng ⛔ **chưa tạo tệp** ✓
⇒ ⭐ **NHƯNG TRI THỨC ⛔ KHÔNG BỊ MẤT**: ⭐ các vòng **77 → 84** đã được ghi **ĐẦY ĐỦ** trong:
- ⭐ `docs/dsh-state/CHECKLIST.md` — ⭐ **các mục «VÒNG 76» → «VÒNG 78»** (⭐ có bảng + bài học)
- ⭐ `testlog.md` — ⭐ **các mục 587 → 610**
⇒ ⭐ **PHIÊN SAU: ⛔ đừng tìm `TASK-224.md`** — ⭐ **đọc `CHECKLIST.md` mục «VÒNG 78» và `testlog.md` mục 587→610** là đủ ✓
⇒ ⭐ **NẾU MUỐN BỔ SUNG**: tạo `TASK-222.md` → `TASK-224.md` cho các vòng đó là việc **tuỳ chọn** (⭐ nội dung đã có sẵn trong CHECKLIST) ✓

---

## 2. ⛔ ĐANG CHỜ — ⭐ **9 BẢN VÁ JAVA CHƯA LÊN SÓNG** (⭐ 4 bản dập lỗi HTTP 500)

⭐ **Tất cả đã `FIXED` + qua `mvn -o test` 156/156** — ⛔ **chỉ chờ 1 lệnh triển khai**:

```bash
node tools/deploy-java-backend.mjs --dong-y-trien-khai
```

| # | Mã | Mức | Nội dung | Trạng thái |
|---|---|---|---|---|
| ① | `BUG-20261005-003` | MEDIUM | `saveUserAccess` đọc trường `isOverride` **chết** ⇒ 100% dòng thành `department_default` | ⭐ FIXED |
| ② | `BUG-20261005-005` | **HIGH** | Trả hàng kho trung tâm **không ghi sổ kho** ⇒ chứng từ kẹt `in_transit` | ⭐ FIXED |
| ③ | `BUG-20261005-008` | MEDIUM | `markResolved` đặt `resolvedAt` vào `updated_at` (NOT NULL) ⇒ nhánh mở lại luôn ném lỗi | ⭐ FIXED |
| ④ | `BUG-20261010` | **HIGH** | `deleteDepartmentPermission` **thiếu chốt tồn tại** + chạy `syncDepartmentUsers` vô điều kiện | ⭐ FIXED |
| ⑤ | `BUG-20261011` | LOW | `deleteUserModuleOverride` trả **200** với khoá bịa | ⭐ FIXED |
| ⑥ | `BUG-20261005-012` | **HIGH** | ⭐ **HTTP 500**: SQL **1055** `ONLY_FULL_GROUP_BY` | ⭐ FIXED · ⛔ chưa VERIFIED e2e |
| ⑦ | `BUG-20261005-014` | MEDIUM | Xoá nhóm vật tư **để lại nhóm con MỒ CÔI** (lỗi chuyển ngữ) | ⭐ FIXED · ⛔ chưa VERIFIED e2e |
| ⑧ | `BUG-20261005-015` | MEDIUM | ⭐ **HTTP 500**: `voucherDate` ngắn <4 ký tự ⇒ `substring` ở **NGOÀI** `try` | ⭐ FIXED · ⛔ chưa VERIFIED e2e |
| ⑨ | `BUG-20261005-013` | MEDIUM | ⭐ **HTTP 500**: cột `code_merge_into_id` **CHƯA BAO GIỜ TỒN TẠI** (⭐ đo **5 cách**) ⇒ ⭐ **ĐÃ VÁ PHƯƠNG ÁN B** (`0 AS mergedFrom` — ⭐ **sự thật**, ⛔ không phải workaround: cột chưa từng có ⇒ `merged` luôn 0) | ⭐ FIXED · ⛔ chưa VERIFIED e2e |

**Công cụ triển khai đã kiểm bằng DRY-RUN**: 8 bước · 6 chốt an toàn ✅ · **sao lưu JAR** ✅ · ⭐ **22 bài nghiệm thu tự chạy** ✅ · **hướng dẫn lùi** ✅ · ⭐ **LÙI JAR AN TOÀN** (V35/V37 **idempotent**).
⚠️ **Gián đoạn**: UI `:9000` sẽ lỗi vài chục giây khi khởi động lại Java.
⭐ **Sau khi triển khai, phải `VERIFY` end-to-end ⑥⑦⑧⑨** (⭐ hiện chỉ dám nói `FIXED`, ⛔ chưa `VERIFIED`).

---

## 2b. ⭐ LUỒNG MUA HÀNG — **03 LỖI PHÁT HIỆN** (⭐ đã kiểm lại trạng thái HIỆN TẠI, ⛔ không tin báo cáo cũ 2 tuần)

| Lỗi | Mức | Nội dung | ⭐ Trạng thái 06/10 |
|---|---|---|---|
| **F1** | **Cao** | `approve_po` trả **403** mọi vai trò ⇒ bước «Lập & PHÁT HÀNH PO» không thể hoàn tất; **24/31 PO chưa từng phát hành** | ✅ **ĐÃ VÁ** — `ActionRbacRegistry:26` nay `List.of("purchasing")` · ⭐ **có bằng chứng chạy thật** (`approve_po` ok) |
| **F3** | TB | PO **mất giá trị tiền** (`total_value = 0`) | ✅ **ĐÃ VÁ trong mã** — `createPo:124` đọc `estimatedUnitPrice`; ⚠️ 26/31 PO giá trị 0 là **dữ liệu CŨ** |
| **F2** | **Cao** | `receive_goods` **⛔ không kiểm trạng thái PO** ⇒ PO chưa phát hành **vẫn nhận hàng 200** ⇒ **cổng kiểm soát bị VÔ HIỆU** | ⚠️ **CHƯA VÁ** — ⭐ **kế hoạch chi tiết**: `docs/agent-progress/KE-HOACH-VA-F2.md` |
| **F4** | TB | Quyền duyệt **RỘNG HƠN** phân công dự án (thiết kế 2 đường) | ⚠️ **CẦN CHỐT ĐẶC TẢ** — ⛔ **không phải lỗi mã** (chú thích mã ghi là **chủ ý**) |
| **F5** | Thấp | Bước `po_creation` ghi **2 dòng** (1 dòng `pending` treo) | ⛔ còn |

⚠️⚠️ **BÀI HỌC LỚN VỀ F2 — ĐỌC TRƯỚC KHI VÁ**: ⭐ **đã thử vá 01 lần và làm ĐỎ 03 bài kiểm thử** (`StockChainIntegrationTest` 2/2 · `SupplyChainEndToEndIntegrationTest` 1/1) ⚠️ **vì chính 3 bài đó gọi `receive_goods` trên PO CHƯA PHÁT HÀNH** ⇒ ⭐ **chúng đang MÃ HOÁ CHÍNH HÀNH VI CỦA LỖI F2** ✓ ⇒ ⭐ **vá F2 đúng cách PHẢI SỬA LUÔN 3 BÀI KIỂM THỬ ĐÓ** (⭐ cho phát hành PO trước khi nhận hàng) — ⛔ **không thể chỉ thêm 1 dòng chốt** ✓ ⭐ Đã **hoàn nguyên** để giữ cây mã nguồn **XANH 156/156**.
⚠️ ⛔ **TUYỆT ĐỐI ⛔ KHÔNG đặt chốt trong `findPoForReceiving`** — ⭐ hàm đó phục vụ **3 nơi**, trong đó **`decidePo` CẦN PO ở `pending_approval`** ⇒ ⭐ **đặt ở đó sẽ KHOÁ CHẾT đường phát hành PO** ✓ (⭐ đã kiểm 3 nơi gọi trước khi sửa)

---

## 2c. 🐞 **BUG-20261006-001** — USER BÁO: «PHẦN BÁO LỖI ⛔ CHƯA HIỂN THỊ DANH SÁCH» — ⭐ **ĐÃ VÁ (tầng UI)**

| | |
|---|---|
| **Mức** | ⭐ **CAO** (High) — ⭐ **gây HIỂU SAI**, ⛔ không chỉ thiếu dữ liệu |
| **Triệu chứng** | ⭐ Quản trị viên mở tab «Báo lỗi» ⇒ ⛔ thấy **«Chưa có báo lỗi nào.»** |
| **Truy vết 6 tầng** | ✅ **DATABASE**: `error_reports` có **16 dòng** ✓ · ✅ **API**: gọi bằng `admin` ⇒ **200 · đủ 16 report** ✓ · ⛔ **PERMISSION**: `error_reports` gắn module **`admin`** (`ActionRbacRegistry:61`) ⇒ tài khoản thường **403** ✓ · ⛔ **UI = GỐC** |
| **Nguyên nhân gốc** | ⛔ `ErrorReportAdminPanel` (bản cũ) gọi `void fetchReports().then(...)` ⚠️ **KHÔNG có `.catch()`** ⇒ ⭐ **403 bị NUỐT IM LẶNG** ⇒ `reports` ở lại `[]` ⇒ ⭐ hiện «Chưa có báo lỗi nào» ⚠️ |
| **Bản vá** | ⭐ **TẦNG UI** (`app/screens/ErrorReportAdminPanel.tsx`) — thêm `loadError` + `try/catch` + `.catch()` + ⭐ **hiện khối `.inline-alert` nói rõ** «Không tải được danh sách báo lỗi … chỉ dành cho quản trị viên …» · ⛔ **không hiện «Chưa có báo lỗi nào» khi có lỗi** |
| **Trạng thái** | ✅ **`FIXED`** · ✅ **`npm test` 780/780 đạt · 0 lỗi** · ✅ **cổng UI 3/3 ✓** · ⛔ **chưa `VERIFIED`** (⭐ cần **mắt user** xác nhận) |
| ⚠️ **Còn tồn** | ⭐ **BUG-B (mức TB)**: tab «Báo lỗi» **vẫn hiện** cho người ⛔ không có quyền ⇒ ⚠️ **nên ẩn tab** hoặc **cấp quyền xem** — ⭐ **chờ user chốt** |
| **Nhật ký** | ⭐ `docs/agent-progress/TASK-225.md` · `testlog.md` mục **616 → 620** |

⛔ **LƯU Ý**: lỗi này **⛔ KHÔNG nằm trong 9 bản vá Java** ⇒ ⭐ **đã lên sóng ngay trên `:8787`** (⭐ và `:9000` phục vụ **cùng bundle**) ⇒ ⭐ **user kiểm được NGAY, ⛔ không cần chờ triển khai** ✓

---

## 3. ⛔ CẦN BẠN QUYẾT — ⭐ **9 VIỆC** (xếp theo thứ tự ưu tiên §19)

| # | Việc | Vì sao cần bạn | Mặc định đề xuất |
|---|---|---|---|
| **1** | ⭐⭐⭐ **TRIỂN KHAI 9 BẢN VÁ** | ⛔ **đã cam kết ⛔ không tự triển khai** khi chưa có mắt người | ✅ **cho phép** — 1 lệnh, đã kiểm dry-run · ⭐ **dập 4 lỗi 500** |
| **2** | ⭐⭐⭐ **DỌN DỮ LIỆU** (⚠️ **thao tác GHI**) | ⛔ tôi ⛔ không ghi vào CSDL thật khi chưa được phép | ✅ **cho phép** — gồm: **06 phiếu kẹt** (12 đơn vị, ⭐ dọn đồng thời **kiểm chứng luôn bản vá ②**) · **570 dòng quyền mồ côi** (25,9%) · **04 PO** chờ phát hành |
| **3** | ⭐⭐⭐ **KHẮC PHỤC F2** | ⚠️ **lỗi WORKFLOW mức Cao** — cổng kiểm soát bị vô hiệu | ✅ **cho phép** — ⭐ **kế hoạch đã lập sẵn** `KE-HOACH-VA-F2.md` (⭐ phải sửa **3 bài kiểm thử** trước) |
| **4** | ⭐⭐ **CHỐT ĐẶC TẢ F4** | ⭐ câu hỏi **nghiệp vụ**, ⛔ không phải lỗi mã | ⭐ bạn chốt: *«chỉ người được phân công mới duyệt»* hay *«đúng vai trò là đủ»* |
| **5** | ⭐⭐ **CHỐT CHÍNH SÁCH DỮ LIỆU NHÂN SỰ** | ⭐ câu hỏi **nghiệp vụ** | ⭐ xoá nhân sự thì **có giữ** hồ sơ HR / HĐLĐ / bảo hiểm không? (⭐ nếu **giữ** ⇒ hiện tại **đã đúng**) |
| **6** | ⭐⭐ **XÁC NHẬN BẰNG MẮT** 6 bản vá CSS trên `:8787` | ⭐ **cần MẮT NGƯỜI** | ✅ mở 2 hộp thoại có tab: «Quản trị hệ thống → 1 user» và «Sửa hồ sơ nhân sự» |
| **7** | ⭐ **1 phép thử GHI** để chốt cơ chế quyền | ⭐ **8 giả thuyết đã bị bác bỏ**; ⭐ **chỉ còn cách này** | ✅ **cho phép 1 lần ghi** |
| **8** | ⭐ **Commit thế nào?** | ⛔ bạn đã nói «chưa commit, để tôi xem trước» | ⭐ **commit theo NHÓM** — có sẵn `GO-LIVE-phan-nhom-commit.md` |
| **9** | ⭐ **`BUG-20261006-001` — xác nhận bằng mắt + chốt BUG-B** | ⭐ lỗi **user vừa báo** đã vá (⛔ **chưa `VERIFIED`**) · ⚠️ **BUG-B còn**: tab «Báo lỗi» vẫn hiện cho người ⛔ không có quyền | ⭐ **mở `:9000` → tab «Báo lỗi»** xem đã hiện đúng chưa · ⭐ và chốt: **ẩn tab** hay **cấp quyền xem báo lỗi** cho vai trò khác |

---

## 4. ⭐ LÀM GÌ TIẾP — ĐỀ XUẤT THEO THỨ TỰ

1. ⭐⭐⭐ **Triển khai 9 bản vá** ⇒ ⭐ **`VERIFY` end-to-end ⑥⑦⑧⑨** ⇒ ⭐ **4 lỗi 500 vào sổ `VERIFIED`** ✓
2. ⭐⭐⭐ **Dọn TRANSIT** (06 phiếu kẹt) — ⭐ **đồng thời kiểm chứng bản vá ②** ✓
3. ⭐⭐ **Phát hành 04 PO** + **dọn 570 quyền mồ côi** ✓
4. ⭐⭐ **Khắc phục F2** theo kế hoạch (⭐ **sửa 3 bài kiểm thử trước**) ✓
5. ⭐⭐ **Bổ sung 2 thứ còn thiếu** của dữ liệu test: **phiếu kiểm kê** (`stock_counts = 0`) · **cấu hình thông báo** (`notification_configs = 1`) ✓
6. ⭐⭐ **Bàn giao để user test** — ⭐ **kịch bản đã soạn**: `docs/agent-progress/KICH-BAN-KIEM-THUC.md` (**7 kịch bản · 47 bước**) ✓
7. ⭐ **Xác nhận 6 bản vá CSS bằng mắt** · **1 phép thử GHI** · **commit theo nhóm** ✓

---

## 5. ⭐ TÀI LIỆU — ĐỌC GÌ KHI CẦN GÌ

| Cần gì | Đọc tệp |
|---|---|
| ⭐ **Trạng thái toàn cục** | `docs/agent-progress/MASTER_STATUS.md` (**783 dòng**) |
| ⭐ **Nhật ký hotfix & lịch sử bug** | `docs/dsh-state/CHECKLIST.md` (⭐ **9512 dòng**) |
| ⭐ **Nhật ký từng vòng** | `docs/agent-progress/TASK-*.md` (⭐ **242 tệp** · ⭐ dòng GO-LIVE: **`TASK-190`→`TASK-221`**) — ⚠️ **xem ghi chú khoảng trống bên dưới** |
| ⭐ **Bằng chứng từng bước chạy** | `testlog.md` (⭐ **894 dòng**) + `tools/e2e/bien-chung.jsonl` (**5965 dòng**) |
| ⭐⭐ **BÁO CÁO TUẦN (gửi cấp trên)** | ⭐ `docs/BAO-CAO-TUAN-06-10-2026.xlsx` (sheet 2) · ⭐ `.pdf` (6 trang) · ⭐ `docs/agent-progress/BAO-CAO-TUAN-2026-10-06.md` (**338 dòng**) |
| ⭐⭐ **KIỂM KÊ DỮ LIỆU KIỂM THỬ** | ⭐ `docs/agent-progress/KIEM-KE-DU-LIEU-TEST.md` — ⭐ **13/13 yêu cầu ĐÃ CÓ SẴN** |
| ⭐⭐ **KỊCH BẢN KIỂM THỬ cho user** | ⭐ `docs/agent-progress/KICH-BAN-KIEM-THUC.md` (**7 kịch bản · 47 bước**) |
| ⭐⭐ **KẾ HOẠCH VÁ F2** | ⭐ `docs/agent-progress/KE-HOACH-VA-F2.md` |
| ⭐ **Luồng duyệt mua hàng (báo cáo gốc)** | `docs/agent-progress/BAO-CAO-LUONG-DUYET-WF-MUAHANG-01.md` (**438 dòng**) |
| ⭐ **Phân nhóm commit** | `docs/agent-progress/GO-LIVE-phan-nhom-commit.md` (**150 dòng**) |
| ⭐ **Chuyện lớp CSS** | `docs/agent-progress/GO-LIVE-lop-thieu-css.md` (**291 dòng**) |
| ⭐ **Bàn giao (tệp này)** | `docs/agent-progress/BAN-GIAO-GO-LIVE.md` |

---

## 6. ⭐ PHƯƠNG PHÁP — KỸ THUẬT ĐÃ CHỨNG MINH (dùng lại được ngay)

| Kỹ thuật | Công dụng | Đã chứng minh |
|---|---|---|
| ⭐⭐ **ĐỌC DÒNG GÁN** (`x = raw.get("KEY")`), ⛔ không chỉ dòng DÙNG (`x.isEmpty()`) | ⭐ **biết ĐÚNG tên trường** | vòng 57 |
| ⭐⭐ **SO TẬP ID TRƯỚC/SAU** | ⭐ tìm id mới khi **API ⛔ không trả về id** | vòng 55 · 56 |
| ⭐⭐ **KIỂM CHỐT CHẶN THEO CHIỀU ÂM** | ⭐ **chứng minh chốt chặn HOẠT ĐỘNG** | vòng 54→57 |
| ⭐⭐ **KIỂM CHỨNG TỰ THÂN** («xoá lần 2 ⇒ 400») | ⭐ chứng minh **đã ghi/xoá THẬT** | vòng 48 · 49 |
| ⭐⭐ **CHỐT CHỐNG TRÙNG** (tạo 2 lần cùng mã ⇒ 400) | ⭐ chứng minh **đã ghi thật** mà ⛔ **không cần id** | vòng 49 |
| ⭐⭐ **LỌC RÁC THEO DẤU VẾT RIÊNG CỦA BÀI KIỂM** | ⛔ **tránh báo động giả** | vòng 50 · 55 · **73** |
| ⭐⭐ **KIỂM HẬU QUẢ HAI LỚP**: 94 mảng bootstrap **+** MySQL | ⛔ **bootstrap có ĐIỂM MÙ** | vòng 50 |
| ⭐⭐ **SO VỚI NGUỒN GỐC JS** (`scripts/system-route.mjs`) | ⭐ lộ **LỖI CHUYỂN NGỮ** + **cách vá ĐÚNG** | vòng 51 |
| ⭐⭐ **ĐỌC HẾT NGƯỜI GỌI CỦA HÀM TRƯỚC KHI THÊM CHỐT** | ⛔ tránh **khoá chết đường hợp lệ** | **vòng 76** (F2) |
| ⭐⭐ **KIỂM RỦI RO CỦA BẢN VÁ**, ⛔ không chỉ kiểm «lỗi đã hết» | ⭐ phát hiện **đường tới `hardDeleteMaterial`** | **vòng 75** (BUG-013) |
| ⭐⭐ **GHI TIẾNG VIỆT QUA `write` RỒI BƠM VÀO OFFICE BẰNG COM** | ⛔ **pwsh LÀM HỎNG tiếng Việt** | **vòng 77** |
| ⭐ **ĐO 5 CÁCH ĐỘC LẬP** trước khi kết luận «cột không tồn tại» | ⭐ kết luận chắc chắn | **vòng 75** |

---

## 7. ⛔ NHỮNG ĐIỀU ⛔ KHÔNG NÊN LÀM (⭐ đã trả giá để biết)

| ⛔ Đừng | ⭐ Vì sao (⭐ bằng chứng đo được) |
|---|---|
| ⛔ **Gọi `/` để kiểm backend** | `/` trả **404** ⇒ ⭐ **dễ đọc nhầm thành «chết»** — ⭐ dùng `POST /api/system` |
| ⛔ **Quét MỌI mảng bootstrap** để tìm id | ⭐ mảng **`audits` chứa MỌI mã** ⇒ **luôn cho id SAI** |
| ⛔ **Lọc rác theo trường chung** (`user_id`, `code LIKE 'E2E%'`) | ⭐ **khớp cả dữ liệu THẬT của user** ⇒ **báo động giả** (⭐ **đã mắc 3 lần**: vòng 50 · 55 · **73**) |
| ⛔ **Tin `mvn -o test` 156/156 là đã kiểm SQL** | ⭐ **H2 dễ dãi hơn MySQL** ⇒ **lỗi SQL 500 lọt qua** |
| ⛔ **Tự nghĩ ra cách vá** trước khi đọc JS gốc | ⭐ **BUG-014 là LỖI CHUYỂN NGỮ** — JS gốc quy định **đúng cả 2 hành vi** |
| ⛔ **Đoán tên trường** | ⭐ đã gây **≥5 lỗi payload** ⇒ ⭐ **ĐỌC DÒNG GÁN** |
| ⛔ **Viết lời gọi hàm theo trí nhớ** | ⭐ **vòng 80**: viết sai chữ ký `postAction` ⇒ ⭐ **phải đọc CHỮ KÝ HÀM** |
| ⛔ **Vá CSS mà ⛔ chưa chứng minh selector trúng phần tử** | ⭐ **vòng 66**: vá sai selector, phải hoàn nguyên |
| ⛔ **Xoá tệp ĐẦU VÀO trong khối `finally`** | ⭐ **vòng 77**: script hỏng ⇒ **mất luôn dữ liệu vào** |
| ⛔ **Để lại BUILD FAILURE khi tạm dừng** | ⭐ **vòng 79**: phải hoàn nguyên để cây mã nguồn **XANH** |
| ⛔ **Tin báo cáo cũ mà ⛔ không kiểm lại** | ⭐ **vòng 76**: báo cáo 2 tuần ghi F1/F3 là lỗi ⚠️ nhưng **đã vá rồi** |
| ⛔ **Chạy `save_user_access` / `save_department_permission` / `delete_department_permission`** bằng payload rỗng | ⛔ **REPLACE-ALL quyền** / **sync quyền hàng loạt** |
| ⛔ **Commit / push** | ⭐ bạn nói «chưa commit, để tôi xem trước» |
| ⛔ **Dừng Java `:18081`** ngoài lệnh triển khai | ⭐ đang phục vụ **dữ liệu THẬT** |
| ⛔ **Ghi dữ liệu / triển khai khi user đã yêu cầu TẠM DỪNG** | ⭐ **vòng 76–84**: user yêu cầu tạm dừng ⇒ ⭐ **chỉ làm việc ⛔ không ghi** (phân tích · tài liệu · báo cáo) |
