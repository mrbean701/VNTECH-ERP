# TASK-219 — GO-LIVE ĐỢT 74: ✅ **KIỂM TOÀN VỆN TRƯỚC TRIỂN KHAI** — 8/8 bản vá nguyên vẹn · 156/156 · dry-run sạch · **lùi JAR AN TOÀN**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ **Việc giá trị nhất còn lại ⛔ KHÔNG cần quyền**: ⭐ **chắc chắn lệnh triển khai 1 dòng của bạn ⛔ KHÔNG thất bại** |
| **Lý do** | ⭐ Tôi đã sửa nhiều tệp qua **nhiều vòng** ⚠️ ⇒ ⭐ **phải chứng minh 8 bản vá còn nguyên + vẫn biên dịch + công cụ vẫn sạch** |
| **Kết quả** | ✅ **8/8 bản vá CÒN NGUYÊN** · ✅ **`mvn -o test` 156/156 · BUILD SUCCESS** · ✅ **dry-run 8 bước · 22 bài nghiệm thu · có sao lưu JAR** · ⭐⭐ **LÙI JAR LÀ AN TOÀN** |
| **⛔ LỖI CỦA TÔI** | **0** |

---

## ① ✅ **8/8 BẢN VÁ CÒN NGUYÊN TRONG MÃ NGUỒN**

| # | Mã | ⭐ Dấu vết kiểm | ⭐ Tệp: dòng |
|---|---|---|---|
| ① | `BUG-20261005-003` | `permission_source` | `UserAdminStore.java:45` ✅ |
| ② | `BUG-20261005-005` | `contract_stock_ledger` | `WarehouseStockStore.java:75` ✅ |
| ③ | `BUG-20261005-008` | `markResolved` | `ErrorReportStore.java:54` ✅ |
| ④ | `BUG-20261010` | `deleteDepartmentPermission` | `UserAdminStore.java:88` ✅ |
| ⑤ | `BUG-20261011` | `deleteModuleOverride` | `UserAdminStore.java:55` ✅ |
| ⑥ | `BUG-20261005-012` | **`MIN(a.alias_name)`** | `MaterialCatalogStoreAdapter.java:309` ✅ |
| ⑦ | `BUG-20261005-014` | «Đã xóa hệ M&E và các nhóm con trống» | `MaterialCatalogManagementUseCase.java:309` ✅ |
| ⑧ | `BUG-20261005-015` | «Ngày chứng từ phải theo định dạng YYYY-MM-DD» | `FinanceManagementUseCase.java:315` ✅ |

⇒ ⭐⭐⭐ **KHÔNG bản vá nào bị mất hay bị hoàn nguyên nhầm** ✓✓✓

---

## ② ✅ **CHỨNG MINH VẪN BIÊN DỊCH + ⛔ KHÔNG PHÁ GÌ**

```text
[INFO] Tests run: 19, Failures: 0, Errors: 0, Skipped: 0
[INFO] Tests run: 38, Failures: 0, Errors: 0, Skipped: 0
[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
[INFO] Tests run: 86, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
MVN_EXIT=0
```
⇒ ⭐ **156 test · 0 fail · 0 error · BUILD SUCCESS** ✓ — ⭐ **8 bản vá biên dịch được và ⛔ không phá test nào** ✓

---

## ③ ✅ **DRY-RUN CÔNG CỤ TRIỂN KHAI** — ⭐ SẴN SÀNG

| Hạng mục | ⭐ Đo được |
|---|---|
| **Bài nghiệm thu tự chạy** | ✅ **22** (⭐ xác minh độc lập bằng đếm) ✓ |
| **Sao lưu JAR** | ✅ **CÓ** ✓ |
| **Chốt an toàn** | ✅ **6** (⭐ đã kiểm ở các vòng trước) ✓ |
| **Hướng dẫn lùi** | ✅ **CÓ** ✓ |
| ⛔ **Chế độ** | ⛔ **CHẠY THỬ** — ⭐ **chưa triển khai gì** ✓ |

---

## ④ ⭐⭐ **CAM KẾT AN TOÀN MỚI ĐO ĐƯỢC — LÙI JAR LÀ AN TOÀN**

⭐ Chính công cụ ghi rõ:
> «⛔ LƯU Ý: migration **V35/V37** khi đã áp vào DB thì **KHÔNG tự lùi** — nhưng **cả hai đều IDEMPOTENT**
> (**V35** = `UPDATE` khớp **0 dòng** · **V37** = `CREATE TABLE IF NOT EXISTS` + `INSERT IGNORE`) ⇒ **lùi JAR là an toàn**.»

⇒ ⭐⭐⭐ **NẾU BẢN MỚI CÓ VẤN ĐỀ, LÙI JAR LÀ ĐỦ** ✓✓✓ — ⭐ **⛔ không có migration nào phá dữ liệu** ✓
⭐⭐ **ĐIỀU NÀY QUAN TRỌNG**: ⭐ nó **hạ thấp rủi ro của việc triển khai xuống rất thấp** ⇒ ⭐ **quyết định triển khai nay dễ hơn** ✓

---

## ⑤ ⭐ TRẠNG THÁI HỆ THỐNG (⭐ đo cuối vòng)

| Hạng mục | ⭐ Giá trị |
|---|---|
| **JAR đang chạy** | **01/10 10:24** ⚠️ (⭐ bản cũ, ⛔ chưa có 8 bản vá) |
| **`:18081`** | ✅ **401 = KHOẺ** · PID **3784** ⛔ **không đụng tới** ✓ |
| **`:8787`** | ✅ **HTTP 200** ✓ |
| **Vân tay** | **ĐẠT** `VNTECH-FP-018A1FB2E849579E` · **713 tệp** ✓ |
| ⛔ **Chưa commit** | **169 đường** |
| Tệp tạm · `.snapshot` | **0 · 0** ✓ |

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⭐ **Bản vá còn nguyên** | ✅ **8/8** ✓ |
| ⭐ **`mvn -o test`** | ✅ **156/156 · BUILD SUCCESS · EXIT=0** ✓ |
| ⭐ **Dry-run triển khai** | ✅ **22 bài nghiệm thu · có sao lưu JAR · 6 chốt** ✓ |
| ⭐⭐ **Lùi JAR an toàn** | ✅ **CÓ** (⭐ V35/V37 đều IDEMPOTENT) ✓ |
| ⛔ **Lỗi của tôi** | **0** ✓ |
| Vân tay | **ĐẠT** `VNTECH-FP-018A1FB2E849579E` · 713 tệp ✓ |
| `:8787` · `:18081` | ✅ **200** · ✅ **401 = KHOẺ** ✓ |
| Tệp tạm · `.snapshot` | **0 · 0** ✓ |

---

## ⑦ BÀI HỌC

1. ⭐⭐⭐ **TRƯỚC KHI GIAO MỘT VIỆC GHI CHO NGƯỜI KHÁC, PHẢI CHỨNG MINH NÓ SẼ THÀNH CÔNG.** ⭐ Lệnh triển khai là **1 dòng của bạn** ⚠️ — ⭐ tôi **chịu trách nhiệm làm nó ⛔ không thất bại** ✓ ⇒ ⭐ **kiểm: bản vá còn nguyên · biên dịch được · công cụ sạch** ✓
2. ⭐⭐⭐ **KIỂM BẰNG DẤU VẾT CỤ THỂ, ⛔ KHÔNG BẰNG «TÔI NHỚ LÀ ĐÃ SỬA».** ⭐ Mỗi bản vá có **một dấu vết riêng** (⭐ `MIN(a.alias_name)` · «Ngày chứng từ phải theo định dạng YYYY-MM-DD»…) ⇒ ⭐ **8/8 xác nhận có tệp + dòng cụ thể** ✓
3. ⭐⭐⭐ **ĐỌC KỸ THÔNG ĐIỆP CỦA CÔNG CỤ CÓ THỂ PHÁT HIỆN CAM KẾT AN TOÀN QUAN TRỌNG.** ⭐ «**lùi JAR là an toàn**» (⭐ vì V35/V37 **IDEMPOTENT**) ⚠️ — ⭐ **tôi chỉ biết điều này khi CHẠY dry-run và ĐỌC kết quả** ✓
4. ⭐⭐ **MỘT VÒNG «KIỂM LẠI THỨ MÌNH ĐÃ LÀM» LÀ VÒNG CÓ GIÁ TRỊ.** ⭐ Nó ⛔ không tạo gì mới ⚠️ nhưng ⭐ **biến «tôi tin là ổn» thành «tôi ĐO được là ổn»** ✓
5. ⭐ **8 BẢN VÁ NAY ĐÃ SẴN SÀNG Ở MỨC CAO NHẤT CÓ THỂ MÀ ⛔ KHÔNG CẦN QUYỀN.** ⭐ Bước tiếp theo **chỉ còn chờ bạn** ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **169 đường**, hỗn hợp 2 phiên.
⭐⭐⭐ **8 BẢN VÁ ĐÃ SẴN SÀNG Ở MỨC TỐI ĐA** — ⭐ **chỉ còn 1 lệnh của bạn**:
```bash
node tools/deploy-java-backend.mjs --dong-y-trien-khai
```
⛔ **Cần user quyết** (⭐ theo §19):
1. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ** — ⭐ **nay đã chứng minh**: 8/8 nguyên vẹn · 156/156 · **22 bài nghiệm thu** · **có sao lưu** · ⭐ **lùi JAR AN TOÀN** ✓
2. ⭐⭐⭐ **CHO PHÉP DỌN TRANSIT** — `receive_central_return` ×5 + `receive_transfer_order` ×1 ✓
3. ⭐⭐ **TỒN Ở `KHO-E2E-01` (48) + `WHTEAM` (5)** — ⭐ giữ để test tiếp hay dọn? ✓
4. ⭐⭐ **CHO PHÉP DỌN 570 QUYỀN MỒ CÔI** ✓
5. ⭐⭐ **CÂU HỎI NGHIỆP VỤ**: ⭐ xoá nhân sự thì **giữ** hồ sơ HR / HĐLĐ / bảo hiểm không? ✓
6. ⭐⭐⭐ **XÁC NHẬN BẰNG MẮT** — 2 modal, tab đã đều chưa ✓
7. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` ✓
8. ⭐ **Commit theo NHÓM** ✓
