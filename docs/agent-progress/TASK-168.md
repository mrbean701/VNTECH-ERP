# TASK-168 — GO-LIVE ĐỢT 23: RÀ SOÁT §18 TOÀN BỘ 114 ĐƯỜNG CHƯA COMMIT

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Mục đích** | §18: «Trước khi hoàn thành hotfix: **kiểm tra git diff**; kiểm tra file thay đổi; **đảm bảo không có thay đổi ngoài phạm vi**» |
| **Kết quả** | ✅ **Thay đổi CỦA TÔI đều trong phạm vi** · ⛔ không có debug/TODO · ⭐ **phát hiện: hỗn hợp 2 phiên** |
| **Mã nguồn sửa** | ⛔ **KHÔNG** ⇒ vân tay không đổi |

---

## ① ĐO ĐƯỢC — 114 ĐƯỜNG CHƯA COMMIT, PHÂN NHÓM

| Nhóm gốc | Số tệp | Nhóm gốc | Số tệp |
|---|---|---|---|
| `docs` | **39** | `tools` | 10 |
| `tests` | **23** | `app` | 9 |
| `java-backend` | **18** | `scripts` | 6 |
| `lib` | 4 | `package.json` · `testlog.md` · `drizzle` | 1 · 1 · 1 |
| `VNTECH_FINGERPRINT.json` · `VNTECH_PRODUCT_IDENTITY.txt` | 1 · 1 | | |

**64 tệp MỚI · 50 tệp SỬA** (tổng **114**).

---

## ② ⭐⭐ PHÁT HIỆN QUAN TRỌNG — ĐÂY LÀ **HỖN HỢP HAI PHIÊN**

⛔ Theo ghi chép đầu phiên: «**86 đường chưa commit**» **ĐÃ CÓ TỪ TRƯỚC**. Nay là **114** ⇒ **~28 đường là của phiên này**, còn lại **thuộc phiên trước**.

**KIỂM CHỨNG BẰNG DẤU THỜI GIAN TỆP** — với các tệp tôi **⛔ không nhận ra là mình sửa**:

| Tệp | Sửa lúc | Kết luận |
|---|---|---|
| `scripts/system-route.mjs` | **02/10 15:34** | ⛔ **không phải của tôi** |
| `BootstrapDataAdapter.java` (+28/−3) | **01/10 22:02** | ⛔ **không phải của tôi** |
| `BoqStoreAdapter.java` (+3/−3) | **02/10 11:02** | ⛔ **không phải của tôi** |
| `tools/probe-bootstrap-keys.mjs` · `lib/menu-helpers.ts` | **01/10 22:02** | ⛔ **không phải của tôi** |
| `tools/probe-java-sql-schema.mjs` · `probe-schema-drift.mjs` | 02/10 10:14–10:15 | ⛔ **không phải của tôi** |
| `app/globals.css` | 02/10 15:11 | ⛔ **không phải của tôi** |
| **`tools/deploy-java-backend.mjs`** | **05/10 03:58** | ✅ của tôi |
| **`UserManagementUseCase.java`** | **05/10 03:45** | ✅ của tôi |
| **`docs/agent-progress/TASK-167.md`** | **05/10 03:59** | ✅ của tôi |

⇒ ⭐ **Phân định rõ ràng bằng DẤU THỜI GIAN**: tệp phiên trước **01–02/10**, tệp của tôi **05/10 03:4x–03:5x**.

⭐⭐ **HỆ QUẢ CẦN NÓI RÕ VỚI USER:**
> Đống chưa commit **⛔ KHÔNG phải toàn bộ là việc của phiên này**. Nếu commit gộp một lần, **việc của phiên trước sẽ bị trộn vào** ⇒ ⛔ **khó rà soát và khó lùi**. ⭐ **Nên commit theo NHÓM**, tách «việc phiên trước» khỏi «việc GO-LIVE phiên này».

---

## ③ RÀ NỘI DUNG — THAY ĐỔI **CỦA TÔI** ĐỀU TRONG PHẠM VI

### Quy mô (nhỏ và tập trung)
| Tệp (Java — của tôi) | +/− |
|---|---|
| `ErrorReportStore.java` | +6 / −1 |
| `ErrorReportUseCase.java` | +4 / −1 |
| `ErrorReportStoreAdapter.java` | +9 / −2 |
| `UserAdminStore.java` | +12 / −1 |
| `UserAdminStoreAdapter.java` | +4 / −2 |
| `UserManagementUseCase.java` | +63 / −2 *(phần lớn là chú thích giải thích lỗi)* |
| `StockManagementUseCase.java` | +6 / −1 |
| `WarehouseStockStoreAdapter.java` | +76 / −2 *(2 khối ghi sổ + chú thích)* |
| `StockChainIntegrationTest.java` | +68 / −0 *(vệ mới)* |
| `schema-h2.sql` | +63 / −0 *(3 bảng V37)* |

⭐ **Mọi thay đổi đều ≤ 76 dòng và gắn trực tiếp với một bug đã ghi** — ⛔ không có «sửa lan man».

### ⛔ TÌM DẤU HIỆU ĐÁNG NGỜ — **KHÔNG CÓ**
| Mẫu tìm | Kết quả |
|---|---|
| `System.out.print` · `printStackTrace` | ✔ **không có** |
| `console.log` (trong mã nguồn app/lib) | ✔ **không có** |
| `TODO` · `FIXME` · `XXX` · `DEBUG` · `HACK` | ✔ **không có** |

⇒ ⭐ Phần **thêm mới** ⛔ không mang theo mã gỡ lỗi hay ghi chú tạm.

---

## ④ VIỆC CÒN LẠI CỦA §18 (nói thẳng)

| Việc | Trạng thái |
|---|---|
| Kiểm tra `git diff` | ✅ **đã làm** |
| Kiểm tra file thay đổi | ✅ **đã làm** (114 đường, phân nhóm, định tuổi) |
| Đảm bảo ⛔ không có thay đổi ngoài phạm vi | ✅ **cho phần CỦA TÔI** |
| ⛔ **Rà phần của PHIÊN TRƯỚC** | ⛔ **chưa làm** — đó là việc của phiên đó; tôi ⛔ **không tự ý sửa/lùi** công việc người khác |

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Đường chưa commit | **114** (64 mới · 50 sửa) |
| Thay đổi của tôi ngoài phạm vi | **0** |
| Dấu hiệu debug/TODO trong phần thêm | **0** |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑥ BÀI HỌC

1. ⭐⭐ **DẤU THỜI GIAN TỆP LÀ CÁCH PHÂN ĐỊNH CÔNG VIỆC RẺ VÀ CHẮC.** ⛔ Tôi đã định coi `system-route.mjs` / `BootstrapDataAdapter.java` là «thay đổi đáng ngờ» — đo mtime thì rõ chúng thuộc **phiên trước**. ⭐ **Trước khi nghi ngờ, hãy ĐỊNH TUỔI.**
2. ⭐⭐ **ĐỐNG CHƯA COMMIT CÓ THỂ LÀ HỖN HỢP NHIỀU PHIÊN** — ⛔ đừng giả định «tất cả là của mình». Ghi chép đầu phiên («86 đường đã có») là **dữ liệu vàng** để phân định.
3. ⭐ **RÀ NỘI DUNG, ⛔ KHÔNG CHỈ ĐẾM SỐ TỆP.** Kiểm **quy mô từng tệp** + **tìm mẫu debug/TODO** ⇒ khẳng định được «thay đổi nhỏ, tập trung, ⛔ không có mã gỡ lỗi».
4. ⭐ **NÓI RÕ VIỆC ⛔ CHƯA LÀM.** Tôi ⛔ **không** rà phần của phiên trước — ⛔ không giả vờ đã rà hết, và cũng ⛔ **không tự ý sửa/lùi công việc người khác**.
5. ⭐ **KHUYẾN NGHỊ HÀNH ĐỘNG RÚT RA**: commit **theo NHÓM** (việc phiên trước ⟂ việc GO-LIVE phiên này) ⇒ dễ rà soát, dễ lùi.

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **114 đường**, ⭐ **hỗn hợp 2 phiên**.
⛔ **Cần user quyết:**
1. ⭐ **Cho phép triển khai** (nay chỉ **1 lệnh**): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` — **5 bản vá**: BUG-003 · 005 · 008 · 20261010 · 20261011; công cụ có **sao lưu + hướng dẫn lùi + nghiệm thu tự động**.
2. ⭐ **Commit theo NHÓM hay gộp?** — khuyến nghị **tách**: (a) việc phiên trước (01–02/10) · (b) việc GO-LIVE phiên này (05/10). Tôi **sẵn sàng** liệt kê chính xác đường nào thuộc nhóm nào.
3. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
4. **BUG-20261005-007** — 130 lớp thiếu CSS.
5. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
6. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
7. ⭐ **Tiếp tục vòng đời CRUD cho 6 thực thể còn lại?**
8. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
9. Xoá đăng ký thừa `manage_contract_review`? · 10. Mở task «thêm thành viên tổ đội»?
