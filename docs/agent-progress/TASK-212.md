# TASK-212 — GO-LIVE ĐỢT 67: ⚠️ **TỰ SỬA SAI CỦA MÌNH** — bản vá §11 vòng 66 **SAI CHỖ** ⇒ **ĐÃ HOÀN NGUYÊN** + ghi rõ lỗi còn tồn tại

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Áp dụng bài học **«quét CẢ HỌ»** (TASK-209/210) **vào UI** ⇒ ⭐ **kiểm TOÀN BỘ dải tab** |
| **⚠️ PHÁT HIỆN** | ⚠️ **Bản vá vòng 66 (TASK-211) NHẮM SAI CHỖ** — ⭐ nó ⛔ **không sửa được lỗi nó định sửa**, ⚠️ **lại ghi đè một quyết định thiết kế CỐ Ý có ghi chú rõ của nhà** |
| **✅ HÀNH ĐỘNG** | ✅ **HOÀN NGUYÊN** `app/globals.css` về **byte-identical bản gốc** · ✅ build lại · ✅ cổng UI · ✅ `npm test` |
| **⛔ LỖI CÒN TỒN TẠI** | ⛔ **`AdminUserModalTabs` (trong `BaseModal`) — 2 tab lệch hơn gấp đôi** ⇒ ⭐ **ĐÃ GHI RÕ, ⛔ CHƯA VÁ** (⭐ ⛔ không tuyên bố §11 đã xong) |
| **⛔ LỖI CỦA TÔI** | ⚠️ **1 lỗi phương pháp** — ⭐ **vá CSS mà ⛔ chưa xác minh selector trúng đúng phần tử** |

---

## ① ⚠️ PHÁT HIỆN — BẢN VÁ VÒNG 66 SAI CHỖ

⭐ **Tôi đã sửa** `globals.css`: `.review-modal .user-admin-tabs>button` → `flex:1 1 0;min-width:0` ✓
⚠️ **NHƯNG kiểm lại thì**:
| Điều tôi tưởng | ⭐ SỰ THẬT |
|---|---|
| Nó sửa dải tab của `AdminUserModalTabs` | ⛔ **KHÔNG** — ⭐ `AdminUserModalTabs` **được render trong `<BaseModal>`** (`page.tsx:3233`, `:3251`), ⛔ **không nằm trong `.review-modal`** ⇒ ⭐ **quy tắc của tôi ⛔ KHÔNG áp dụng cho nó** |
| Nó sửa tab của `ContractReviewScreen` | ✅ **CÓ áp dụng** ⚠️ — ⭐ **nhưng chỗ đó ĐÃ có width cố định bằng `style={{width,minWidth,maxWidth}}`** ⇒ ⭐ **⛔ không cần sửa gì** |

⇒ ⭐⭐ **KẾT LUẬN**: ⭐ **bản vá của tôi ⛔ KHÔNG sửa được lỗi nó định sửa, mà chỉ ghi đè một chỗ vốn đã đúng** ✓✓✓

---

## ② ⚠️ VÀ NÓ GHI ĐÈ MỘT **QUYẾT ĐỊNH THIẾT KẾ CỐ Ý, CÓ GHI CHÚ RÕ** CỦA NHÀ

⭐ `app/styles/canonical.css` (~dòng 1240-1246) ghi **quyết định đã cân nhắc**:
> «✅ Nay về `flex: 0 0 auto` + `white-space: nowrap`: **thẻ ôm sát nhãn**, xếp thành MỘT dải ngang — y hệt dải 5 thẻ của modal «Hồ sơ nhân sự chi tiết» (`app/page.tsx` `USER_PROFILE_TABS`, cùng class `project-scope-tabs`) ⇒ **KHÔNG phát minh giao diện mới, chỉ cho nó đồng nhất với tham chiếu**.»
> «⛔ **KHÔNG đụng `.edm-tabs`** (dải thẻ modal chi tiết dự án): `flex: 1 1 auto` chia đều ở đó là **CỐ Ý** theo yêu cầu **MỐC 115 khác** — giữ nguyên.»

⇒ ⭐⭐ **NHÀ CÓ **HAI** LỰA CHỌN CỐ Ý, KHÁC NHAU**:
| Dải tab | Nhà CHỌN | Lý do ghi rõ |
|---|---|---|
| `project-scope-tabs` / `user-admin-tabs` (**cấp trang**) | ⭐ **`flex:0 0 auto`** — «thẻ ôm sát nhãn» | ⭐ **đồng nhất với `USER_PROFILE_TABS`** |
| **`edm-tabs`** (modal chi tiết dự án) | ⭐ **`flex:1 1 auto`** — **chia đều** | ⭐ **«CỐ Ý»** |

⚠️ ⇒ ⭐ **bản vá của tôi ⛔ vi phạm §12 («⛔ không refactor lớn / ⛔ không đổi thứ không cần»)** ✓

---

## ③ ✅ HÀNH ĐỘNG ĐÚNG — **HOÀN NGUYÊN** (⛔ không giữ một bản vá sai chỗ)

⭐ **LÝ DO HOÀN NGUYÊN**:
1. ⛔ **Nó ⛔ không sửa lỗi nó định sửa** ✓
2. ⚠️ **Nó ghi đè một quyết định thiết kế CỐ Ý có ghi chú** ✓
3. ⭐ **§12: ⛔ không thay đổi ngoài phạm vi** ✓
4. ⭐⭐ **§17 ⛔ KHÔNG HOÀN THÀNH GIẢ**: ⭐ **giữ nó lại sẽ khiến tôi ⛔ dễ tuyên bố «§11 đã xong» trong khi ⛔ CHƯA** ✓
5. ⭐⭐ ***Một lỗi CHƯA VÁ nhưng ĐÃ GHI RÕ thì TỐT HƠN một bản vá SAI CHỖ làm lệch thiết kế cố ý*** ✓

### ✅ XÁC MINH HOÀN NGUYÊN
| Tầng | Kết quả |
|---|---|
| ⭐ **Vân tay** | ✅ **VỀ ĐÚNG BẢN GỐC** — `VNTECH-FP-27251D9B7F076176` (⭐ khớp chính xác trước vòng 66) · ĐẠT 713 tệp |
| ⭐ **`globals.css` byte-identical?** | ✅ **`flex:0 0 auto` (gốc) = True** · ✅ **`flex:1 1 0` (bản vá) = False** · ✅ **khối chú thích vá = False** |
| **`npm run build`** | ✅ `BUILT ARTIFACT VALIDATION: ĐẠT` · `BUILD_EXIT=0` |
| **`:8787`** | ✅ **HTTP 200** · PID **19012** |
| ⭐ **Cổng UI** | ✅ **3 dấu ✓** ⇒ **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** ✓ (⚠️ dòng `Assertion failed…UV_HANDLE_CLOSING` là tiếng ồn lúc thoát, **sau khi KET LUAN đã in** — ⭐ D-103: kết luận từ 3 dấu ✓) |
| **`npm test`** | ✅ **fail 0 · skipped 1 · EXIT=0** |
| **Tệp tạm · `.snapshot`** | **0 · 0** |

---

## ④ ⛔ LỖI §11 **CÒN TỒN TẠI** — ĐÃ GHI RÕ, ⛔ CHƯA VÁ

```text
⛔ app/screens/AdminUserModalTabs.tsx — dải tab TRONG <BaseModal> (page.tsx:3233, :3251)
   · «Sửa tài khoản»                 — 13 ký tự
   · «Phân quyền công việc / Chức năng» — 31 ký tự
   · nhận `.user-admin-tabs > button { flex: 0 0 auto }` (canonical.css:1248)
   ⇒ chiều rộng = ĐỘ DÀI CHỮ ⇒ LỆCH HƠN GẤP ĐÔI ⇒ ⛔ VI PHẠM §11
   📍 chính mã nguồn ghi «2 thẻ co theo độ dài chữ, lệch nhau rõ» (chú thích «MỐC 115»)
```

### ⭐⭐ CÁCH VÁ ĐÚNG (⭐ cho phiên sau / user quyết)
1. ⭐ **Xác định lớp bao ngoài THẬT của `BaseModal`** (⭐ tôi ⛔ chưa tìm ra trong phạm vi vòng này)
2. ⭐ **Thêm quy tắc CHỈ TRONG MODAL** — ⭐ ví dụ `<lớp-modal> .user-admin-tabs > button { flex: 1 1 0; min-width: 0 }`
3. ⛔ **TUYỆT ĐỐI ⛔ KHÔNG sửa `.user-admin-tabs` toàn cục** (⭐ sẽ phá quyết định «ôm sát nhãn» của dải tab **cấp trang**) ✓
4. ⛔ **⛔ KHÔNG đụng `.edm-tabs`** (⭐ nhà đã cảnh báo rõ) ✓
5. ✅ **Ranh giới đúng**: ⭐ **§11 chỉ nói «tab trong cùng một MODAL»** ⇒ ⭐ **chỉ sửa tab TRONG MODAL** ✓

---

## ⑤ ⚠️ BÀI HỌC CỦA TÔI — LỖI PHƯƠNG PHÁP

⭐⭐⭐ **TÔI VÁ CSS MÀ ⛔ CHƯA XÁC MINH SELECTOR TRÚNG ĐÚNG PHẦN TỬ.**
⭐ Tôi thấy **một dải tab lệch nhau** ⇒ ⭐ **viết ngay một quy tắc** ⚠️ — ⭐ **mà ⛔ không kiểm quy tắc đó có áp dụng cho dải tab đó không** ✓
⇒ ⭐⭐ **QUY TẮC MỚI**:
> ⭐ **TRƯỚC KHI VÁ CSS, PHẢI CHỨNG MINH SELECTOR TRÚNG PHẦN TỬ CÓ LỖI** —
> ⭐ **kiểm (a) lớp bao ngoài THẬT của phần tử, (b) các quy tắc đang áp dụng, (c) quy tắc nào ĐANG THẮNG.**

⭐⭐ **VÀ** — ⭐ **điều suýt khiến tôi ⛔ không phát hiện**: ⭐ **bundle vẫn chứa quy tắc mới của tôi** ⇒ ⭐ **«vá đã vào bundle» ✅** ⚠️ **nhưng «vá có tác dụng đúng chỗ» ⛔ lại là câu hỏi KHÁC** ✓
⇒ ⭐⭐ **BÀI HỌC**: ⭐ **«đã triển khai» ⛔ KHÁC «đã sửa đúng»** ✓ — ⭐ **giống hệt `FIXED` ⛔ khác `VERIFIED`** ✓✓✓

---

## ⑥ ĐIỀU TÔI **KHÔNG** LÀM (⭐ và vì sao)

| ⛔ Không làm | ⭐ Vì sao |
|---|---|
| ⛔ Giữ bản vá sai chỗ | ⭐ nó **ghi đè thiết kế cố ý** mà **⛔ không sửa lỗi** |
| ⛔ Sửa `.user-admin-tabs` toàn cục | ⭐ **phá quyết định «ôm sát nhãn»** của dải tab **cấp trang** |
| ⛔ Đụng `.edm-tabs` | ⭐ **nhà đã cảnh báo rõ** «⛔ KHÔNG đụng» |
| ⛔ Tuyên bố «§11 đã xong» | ⭐ **§17 ⛔ không hoàn thành giả** — ⭐ **lỗi VẪN CÒN** ✓ |
| ⛔ Vá mò theo một lớp đoán | ⭐ **lớp `BaseModal` ⛔ chưa xác định** ⇒ ⭐ **vá mò sẽ lặp lại đúng lỗi vừa mắc** ✓ |

---

## ⑦ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⚠️ **Bản vá sai chỗ** | ✅ **ĐÃ HOÀN NGUYÊN** (⭐ **byte-identical**, vân tay **về đúng gốc**) |
| ⛔ **Lỗi §11** | ⛔ **CÒN TỒN TẠI** — ⭐ **đã ghi rõ + cách vá đúng** ⇒ ⭐ **⛔ không tuyên bố đã xong** |
| **Build · Cổng UI · Test** | ✅ **BUILD SUCCESS** · ✅ **3 ✓** · ✅ **fail 0 · skipped 1 · EXIT=0** |
| **Vân tay** | ✅ **`VNTECH-FP-27251D9B7F076176`** — **về đúng bản gốc** · 713 tệp |
| `:8787` | ✅ **HTTP 200** · PID **19012** |
| Bug sản phẩm mới | **0** |
| ⚠️ **Lỗi của tôi** | ⚠️ **1 lỗi phương pháp** — ⭐ **vá ⛔ chưa xác minh selector** ⇒ ✅ **tự phát hiện + tự hoàn nguyên + ghi quy tắc mới** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **162 đường** (⭐ **đã về đúng số trước vòng 66**).
⛔ **Cần user quyết**:
1. ⭐⭐⭐ **§11 — tab trong `BaseModal`**: ⭐ **cho tôi xác định lớp thật của `BaseModal` rồi thêm quy tắc CHỈ TRONG MODAL** ✓ (⭐ **cách vá đã ghi ở §④**)
2. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **22 bài nghiệm thu** ⇒ ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 · BUG-014 · BUG-015** ✓
3. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` (đề xuất **B**) ✓
4. ⭐⭐ **5 bản vá CSS** (⭐ **vòng 66 ⛔ không tính** vì đã hoàn nguyên) — ⭐ **cần mắt người** ✓
5. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
6. ⭐ **Commit theo NHÓM** ✓
