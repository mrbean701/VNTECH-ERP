# TASK-214 — GO-LIVE ĐỢT 69: ✅ **§11 QUÉT CẢ HỌ DẢI TAB TRONG MODAL** — phát hiện + vá `HrProfileEditModal`

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ **Áp dụng «quét CẢ HỌ» vào §11**: tìm **CHÍNH XÁC** những dải tab **NẰM TRONG MODAL** (⭐ ⛔ không đoán) |
| **⚠️ PHÁT HIỆN** | ⚠️ **`HrProfileEditModal.tsx` — dải tab `project-scope-tabs` NẰM TRONG `BaseModal`** ⇒ ⭐ **§11 áp dụng** ⚠️ **và bản vá vòng 68 ⛔ KHÔNG phủ nó** (⭐ vì nó ⛔ không dùng `user-admin-tabs`) |
| **Kết quả** | ✅ **ĐÃ MỞ RỘNG bản vá** · ✅ **BUILD SUCCESS** · ✅ **CỔNG UI ✓** · ✅ **`npm test` EXIT=0** · ✅ **XÁC MINH trên bundle** |
| **⛔ LỖI CỦA TÔI** | ⚠️ **1 phép đo sai** (⭐ regex quá chặt — ⭐ **lần thứ BA**, ⭐ nguyên nhân MỚI ở §④) |

---

## ① ⭐⭐ ĐO CHÍNH XÁC — DẢI TAB NÀO **NẰM TRONG MODAL**?

⭐ **Phương pháp**: ⭐ đọc **ngữ cảnh render** của từng tệp, ⛔ **không đoán theo tên lớp** ✓
| Tệp | Trong `BaseModal`? | Lớp dải tab |
|---|---|---|
| ⭐ **`AdminUserModalTabs.tsx`** | ✅ **CÓ** | `project-scope-tabs user-admin-tabs` ⇒ ✅ **đã vá (v68)** |
| ⚠️ **`HrProfileEditModal.tsx`** | ✅ **CÓ** | **`project-scope-tabs`** ⇒ ⚠️ **CHƯA PHỦ** ✓ |
| ⚠️ `ProjectDetailTabs.tsx` | ✅ **CÓ** | `edm-tabs` ⇒ ⛔ **nhà đã cảnh báo «⛔ KHÔNG đụng»** ✓ |
| ⛔ `AllocateReturn` · `Inventory` · `Purchasing` · `TeamDirectory` · `TeamManagement` · `WorkCenter` | ⛔ **KHÔNG** | ⭐ dải **cấp trang/màn hình** ⇒ ⭐ **quyết định «ôm sát nhãn» của nhà ĐƯỢC GIỮ** ✓ |
| ⛔ `EntityDetailModal.tsx` | ⛔ **KHÔNG** dùng `BaseModal` | `edm-tabs` ⭐ (⭐ modal riêng) ✓ |

⇒ ⭐⭐ **KẾT LUẬN**: ⭐ **chỉ `HrProfileEditModal` là dải tab TRONG MODAL chưa được phủ** ✓

---

## ② ⭐⭐⭐ NHÀ ĐÃ GHI LẠI **CHÍNH YÊU CẦU CỦA USER** — VÀ §11 LÀ YÊU CẦU ĐÓ

⭐ `canonical.css` (⭐ ngay tại `.edm-tabs button`) ghi:
> «**MỐC 115 — user 01/10**: "chỉnh kích thước các tab sao cho **cân đối và bằng nhau** … nhưng vẫn phải hiển thị đầy đủ thông tin".
> Trước đây nút KHÔNG có width ⇒ mỗi tab co theo độ dài nhãn ⇒ "Dự án tham gia" (13 ký tự) rộng hơn hẳn "Kho" (3 ký tự), nhìn lệch.
> `flex: 1 1 auto` (**KHÔNG phải `1 1 0`**): basis `auto` vẫn giữ độ rộng tự nhiên nên flex-wrap…»

⇒ ⭐⭐⭐ **§11 CHÍNH LÀ YÊU CẦU MỐC 115 CỦA USER** ✓✓✓
⚠️ **VÀ nhà chọn `flex:1 1 auto` cho `.edm-tabs` vì nó `flex-wrap: wrap`** ✓ — ⭐ basis `auto` **giữ độ rộng tự nhiên để wrap đẹp** ✓
⭐ **CÒN `.user-admin-tabs` / `.project-scope-tabs` là `flex-wrap: nowrap`** (⭐ `canonical.css:1112`, `:1247`) ⇒ ⭐ **`flex: 1 1 0` mới cho BẰNG NHAU TUYỆT ĐỐI** ✓ — ⭐ **⛔ không mâu thuẫn với ghi chú của nhà**, ⭐ **mà là hệ quả của `nowrap`** ✓

---

## ③ 🔧 BẢN VÁ — **GỘP 1 QUY TẮC, LIỆT KÊ RÕ 2 LỚP**

```css
/* app/styles/canonical.css — dòng 1294 */
.modal .project-scope-tabs > button,
.modal .user-admin-tabs > button {
  flex: 1 1 0;
  min-width: 0;
}
```
### ⭐⛔ VÌ SAO **⛔ KHÔNG** DÙNG `[role="tablist"]` (⭐ quyết định quan trọng)
⭐ `ProjectDetailTabs.tsx` (`edm-tabs`) **CŨNG trong modal** ⚠️ **và CŨNG mang `role="tablist"`** ✓
⇒ ⭐ **`.modal [role="tablist"] > button` SẼ CHẠM `.edm-tabs`** ⇒ ⛔ **vi phạm cảnh báo «⛔ KHÔNG đụng» của nhà** ✓
⇒ ⭐⭐ **LIỆT KÊ RÕ 2 LỚP, ⛔ KHÔNG dùng selector bao trùm** ✓✓✓
⭐ **`SMALL SAFE FIX` §12**: ⭐ **gộp vào 1 quy tắc 2 selector** (⭐ ⛔ không thêm quy tắc rời) ✓

---

## ④ ⚠️ PHÉP ĐO SAI CỦA TÔI — **LẦN THỨ BA**, VÀ **NGUYÊN NHÂN MỚI**

⚠️ Phép kiểm đầu của tôi báo **⛔** cho **2 đối tượng** ⇒ ⭐ **suýt kết luận «bản vá ⛔ không vào bundle»** ✓
⭐⭐ **SỰ THẬT** (⭐ in ra **mọi** quy tắc chứa `project-scope-tabs`):
```text
• .modal .project-scope-tabs>button,.modal .user-admin-tabs>button{flex:1 1 0;min-width:0}   ← ⭐ CÓ!
• .project-scope-tabs>*,.inventory-tabs>*,.switch-tabs>*{flex:none}                            ← ⭐ giữ nguyên
```
⚠️ **NGUYÊN NHÂN**: ⭐ **minify GỘP 2 SELECTOR của tôi vào MỘT quy tắc** ✓ — ⭐ regex của tôi đòi `{` **ngay sau** `>button` ⚠️ **nhưng có `,.modal .user-admin-tabs>button` xen giữa** ✓

### ⭐⭐⭐ BÀI HỌC MINIFY — **MỞ RỘNG LẦN THỨ BA**
| Vòng | ⭐ Minify làm gì | ⭐ Điều ⛔ không được giả định |
|---|---|---|
| 67 | ⭐ **ĐẢO THỨ TỰ** thuộc tính | ⭐ thứ tự property |
| 68 | ⭐ **VIẾT LẠI GIÁ TRỊ** (`flex:0 0 auto` → `flex:none`) | ⭐ cách viết value |
| **69** | ⭐ **GỘP SELECTOR** vào 1 quy tắc | ⭐ **số lượng selector / hình dạng quy tắc** ✓ |

⇒ ⭐⭐⭐ **CÁCH KIỂM ĐÚNG (⭐ đã đúc kết)**: ⭐ **TÌM CHUỖI SELECTOR**, ⛔ **KHÔNG khớp CẢ QUY TẮC bằng regex** ✓✓✓
⭐ **VÀ** — ⭐ **điều cứu tôi lần thứ ba**: ⭐ **IN RA VĂN BẢN THẬT** thay vì kết luận từ một phép khớp ✓

---

## ⑤ ✅ XÁC MINH ĐẦY ĐỦ TRÊN BUNDLE

```text
bundle = dist/client/assets/index-BjTKD8Zf.css

1. ✅ .modal .project-scope-tabs>button,.modal .user-admin-tabs>button{flex:1 1 0;min-width:0}   ← QUY TẮC MỚI CÓ
2. ✅ .project-scope-tabs>*,.inventory-tabs>*,.switch-tabs>*{flex:none}                            ← GIỮ NGUYÊN
3. ✅ .edm-tabs button{…}                                                                          ← ⛔ KHÔNG BỊ ĐỤNG
4. ✅ IndexOf(".modal .project-scope-tabs") = 385030                                               ← TÌM THẤY
```
| Tầng | Kết quả |
|---|---|
| **`npm run build`** | ✅ `BUILT ARTIFACT VALIDATION: ĐẠT` · `BUILD_EXIT=0` ✓ |
| ⚠️ **Vân tay** | ⚠️ **ĐÃ ĐỔI** → ⭐ **`VNTECH-FP-018A1FB2E849579E`** · ✅ **ĐẠT** 713 tệp ✓ |
| **`:8787`** | ✅ **HTTP 200** · PID **4816** ✓ |
| ⭐ **Cổng UI** | ✅ **`van-tay` ✓** · **`byte 6/6` ✓** ⇒ **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** ✓ |
| **`npm test`** | ✅ **fail 0 · skipped 1 · EXIT=0** ✓ |
| Tệp tạm · `.snapshot` | **0 · 0** ✓ |

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⭐ **Dải tab TRONG MODAL đã phủ** | ✅ **2/2** (`AdminUserModalTabs` v68 · **`HrProfileEditModal` v69**) |
| ⛔ **Dải cấp trang** | ✅ **GIỮ NGUYÊN** «ôm sát nhãn» ✓ |
| ⛔ **`.edm-tabs`** | ✅ **⛔ không bị đụng** (⭐ đã chọn selector để ⛔ không chạm) ✓ |
| **Build · Cổng UI · Test** | ✅ **BUILD SUCCESS** · ✅ **✓** · ✅ **EXIT=0** |
| ⚠️ **Vân tay** | ⚠️ → ⭐ **`VNTECH-FP-018A1FB2E849579E`** · 713 tệp |
| Bug sản phẩm mới | **0** |
| ⚠️ **Lỗi của tôi** | ⚠️ **1 phép đo sai** (⭐ lần thứ BA) — ⭐ **tự phát hiện + mở rộng bài học minify** ✓ |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑦ BÀI HỌC

1. ⭐⭐⭐ **§11 CHÍNH LÀ YÊU CẦU MỐC 115 CỦA USER** — ⭐ nhà đã ghi lại nguyên văn ⇒ ⭐ **tôi ⛔ không phải suy đoán ý định** ✓
2. ⭐⭐⭐ **CHỌN SELECTOR PHẢI TÍNH CẢ CÁI ⛔ KHÔNG MUỐN CHẠM.** ⭐ `.modal [role="tablist"]` **ngắn hơn** ⚠️ **nhưng sẽ chạm `.edm-tabs`** ⇒ ⭐ **liệt kê rõ 2 lớp** ✓
3. ⭐⭐⭐ **BÀI HỌC MINIFY MỞ RỘNG LẦN THỨ BA** — ⭐ thứ tự property (v67) · cách viết value (v68) · **GỘP selector (v69)** ⇒ ⭐ **TÌM CHUỖI SELECTOR, ⛔ không khớp cả quy tắc** ✓
4. ⭐⭐ **`flex:1 1 0` vs `1 1 auto` PHỤ THUỘC `flex-wrap`** — ⭐ `nowrap` ⇒ **`1 1 0` cho bằng nhau tuyệt đối** · ⭐ `wrap` ⇒ **`1 1 auto` giữ độ rộng tự nhiên** ✓
5. ⭐⭐ **«QUÉT CẢ HỌ» PHẢI DỰA TRÊN NGỮ CẢNH, ⛔ KHÔNG DỰA TÊN LỚP.** ⭐ Tôi tìm theo **nơi render**, ⛔ không theo tên ⇒ ⭐ **mới thấy `HrProfileEditModal`** ✓
6. ⭐ **IN RA VĂN BẢN THẬT ĐÃ CỨU TÔI LẦN THỨ BA** ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **165 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết**:
1. ⭐⭐⭐ **XÁC NHẬN BẰNG MẮT** — ⭐ **mở «Quản trị hệ thống» → chọn 1 user** (2 tab) **và mở «Sửa hồ sơ nhân sự»** (2 tab) xem **đã ĐỀU NHAU chưa** ✓
2. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **22 bài nghiệm thu** ⇒ ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 · BUG-014 · BUG-015** ✓
3. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` (đề xuất **B**) ✓
4. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
5. ⭐ **Mở rộng đường thành công** sang chứng từ tài chính còn lại ✓
6. ⭐ **Commit theo NHÓM** ✓
