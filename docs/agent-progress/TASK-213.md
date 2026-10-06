# TASK-213 — GO-LIVE ĐỢT 68: ✅ **§11 VÁ ĐÚNG PHẠM VI** — tab trong modal đồng nhất, dải cấp trang giữ nguyên

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ **Vá lại §11 cho ĐÚNG** sau khi vòng 67 phát hiện bản vá vòng 66 **sai chỗ** |
| **⭐ QUY TẮC MỚI ĐƯỢC ÁP DỤNG** | ⭐⭐ **«Vá CSS phải CHỨNG MINH selector trúng phần tử có lỗi TRƯỚC khi vá»** (TASK-212 §⑤) |
| **Kết quả** | ✅ **VÁ ĐÚNG PHẠM VI** · ✅ **BUILD SUCCESS** · ✅ **CỔNG UI 3 ✓** · ✅ **`npm test` fail 0 · skipped 1 · EXIT=0** · ✅ **XÁC MINH trên bundle thật** |
| **⛔ LỖI CỦA TÔI** | **0** — ⭐ **quy tắc mới đã ngăn được lỗi lặp lại** |
| **⭐ ĐIỂM ĐẶC BIỆT** | ⭐⭐ **Phạm vi CHÍNH XÁC: chỉ tab TRONG MODAL** — ⛔ **không phá quyết định «ôm sát nhãn» của dải cấp trang**, ⛔ **không đụng `.edm-tabs`** |

---

## ① ⭐⭐ BƯỚC 1 — **CHỨNG MINH SELECTOR TRÚNG PHẦN TỬ** (⭐ quy tắc mới, ⛔ không đoán)

⭐ **Truy vết `BaseModal`** (⭐ ⛔ không đoán lớp):
| Bước | Kết quả |
|---|---|
| `AdminUserModalTabs` render ở đâu? | `app/page.tsx:3233`, `:3251` — trong **`<BaseModal>`** ✓ |
| `BaseModal` định nghĩa ở đâu? | ⭐ **`lib/ui-blocks.tsx:22`** ✓ |
| ⭐ **Nó render lớp gì?** | ⭐⭐ **`<div className="overlay modal-overlay">` → `<section className="modal">` → `<header>…</header> → `{children}`** ✓ |

⇒ ⭐⭐⭐ **LỚP BAO NGOÀI THẬT = `.modal`** ⇒ ⭐ **selector ĐÚNG = `.modal .user-admin-tabs > button`** ✓✓✓

### ⭐ Phạm vi đã kiểm (⭐ 3 điều của quy tắc mới)
| Câu hỏi | Trả lời |
|---|---|
| **(a)** Lớp bao ngoài **thật** của phần tử có lỗi? | ⭐ **`.modal`** (⭐ đo từ `lib/ui-blocks.tsx:22`) ✓ |
| **(b)** Các quy tắc **đang áp dụng**? | `.user-admin-tabs > button { flex: 0 0 auto }` (`canonical.css:1248`, ⭐ specificity **0,1,1**) ✓ |
| **(c)** Quy tắc nào **ĐANG THẮNG**? | ⭐ Quy tắc mới `.modal .user-admin-tabs > button` (**0,2,1**) ⇒ ⭐ **thắng** ✓ |

### ⭐ Blast radius — đo từng cái
| Đối tượng | Bị ảnh hưởng? | ⭐ Vì sao |
|---|---|---|
| ⭐ **`AdminUserModalTabs`** (⭐ **chỗ có lỗi**) | ✅ **CÓ** — ⭐ **đúng mục tiêu** | nằm trong `.modal` ✓ |
| ⛔ **Dải tab CẤP TRANG** (`page.tsx:3081` `USER_PROFILE_TABS`) | ⛔ **KHÔNG** | ⛔ không nằm trong `.modal` ⇒ ⭐ **quyết định «thẻ ôm sát nhãn» của nhà ĐƯỢC GIỮ NGUYÊN** ✓ |
| ⛔ **`.edm-tabs`** (modal chi tiết dự án) | ⛔ **KHÔNG** | ⭐ lớp khác ⇒ ⭐ **tôn trọng cảnh báo «⛔ KHÔNG đụng» của nhà** ✓ |
| ⚠️ **`ContractReviewScreen`** (`ContractReviewScreen.tsx:158`) | ⚠️ **CÓ khớp** — ⚠️ **nhưng hành vi ⛔ KHÔNG đổi** | nằm trong **cả** `.review-modal` và `.modal` ⚠️ — ⭐ **nhưng tab ở đó ĐÃ có width cố định** (`style={{width,minWidth,maxWidth}}`, `REVIEW_TABS` = **240px/200px**) ⇒ ⭐ **width inline THẮNG** ✓ |

---

## ② 🔧 BẢN VÁ — **1 quy tắc, đặt NGAY CẠNH quy tắc gốc**

```css
/* app/styles/canonical.css — ngay sau `.user-admin-tabs > button` (dòng 1257) */
.modal .user-admin-tabs > button {
  flex: 1 1 0;
  min-width: 0;
}
```
⭐ **VÌ SAO `flex:1 1 0` mà ⛔ không phải `width:240px`**: ⭐ §11 đòi **«ĐỒNG NHẤT»** ⇒ **chia đều bảo đảm ĐỒNG NHẤT TUYỆT ĐỐI** ✓ · ⛔ **không bịa con số pixel** ✓ · **tự thích ứng** bề rộng modal ✓
⭐ **GIỮ NGUYÊN** `white-space:nowrap` + `overflow:hidden` + `text-overflow:ellipsis` (⭐ **kế thừa** quy tắc trên) ⇒ ⚠️ nhãn dài có thể rút gọn «…» — ⭐ **đúng hành vi nhà đã chấp nhận** ở `.review-modal` ✓
⭐ **`SMALL SAFE FIX` §12**: **1 quy tắc mới** · ⛔ **không sửa quy tắc cũ nào** ✓

---

## ③ ✅ XÁC MINH TRÊN **BUNDLE THẬT** — ⭐ đủ 3 điều của quy tắc mới

```text
bundle = dist/client/assets/index-xEBotNX-.css

1. ✅ .modal .user-admin-tabs>button{flex:1 1 0;min-width:0}                    ← ⭐ QUY TẮC MỚI CÓ
2. ✅ .user-admin-tabs>button{…;flex:none;…}                                     ← ⭐ dải CẤP TRANG giữ nguyên
3. ✅ .edm-tabs{border-bottom:…;flex-wrap:wrap;flex:none;gap:2px;display:…}       ← ⛔ KHÔNG bị đụng
4. ✅ .review-modal .user-admin-tabs>button{…;flex:none;…}                       ← ⛔ hành vi KHÔNG đổi
```
⇒ ⭐⭐⭐ **VÁ ĐÚNG PHẠM VI, ⛔ KHÔNG PHÁ GÌ** ✓✓✓

### ✅ CÁC CỔNG
| Tầng | Kết quả |
|---|---|
| **`npm run build`** | ✅ `BUILT ARTIFACT VALIDATION: ĐẠT` · `BUILD_EXIT=0` ✓ |
| ⭐ **Vân tay** | ⚠️ **ĐÃ ĐỔI** → ⭐ **`VNTECH-FP-D8D7CECB74BF9C00`** (⭐ vì `app/styles/canonical.css` **trong `ROOT_DIRS`**) · ✅ **ĐẠT** 713 tệp ✓ |
| **`:8787`** | ✅ **HTTP 200** · PID **736** ✓ |
| ⭐ **Cổng UI** | ✅ **3 dấu ✓** ⇒ **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** ✓ |
| **`npm test`** | ✅ **fail 0 · cancelled 0 · skipped 1 · todo 0 · EXIT=0** ✓ |
| Tệp tạm · `.snapshot` | **0 · 0** ✓ |

---

## ④ ⭐⭐ BÀI HỌC MINIFY — LẦN THỨ HAI TRONG HAI VÒNG

⚠️ Phép kiểm `flex:0 0 auto` trong bundle trả **`False`** ⚠️ ⇒ ⭐ **thoạt trông như «quy tắc gốc đã biến mất»** ✓
⭐⭐ **SỰ THẬT**: ⭐ **minify VIẾT LẠI `flex: 0 0 auto` → `flex: none`** — ⭐ **HAI CÁCH VIẾT TƯƠNG ĐƯƠNG** ✓
⇒ ⭐ **ngữ nghĩa ⛔ KHÔNG đổi** (⭐ `flex:none` = `0 0 auto`) ✓✓✓
⇒ ⭐⭐⭐ **BÀI HỌC (⭐ mở rộng bài học vòng 67)**: ⭐ **trong bundle đã minify, ⛔ ĐỪNG giả định:**
&nbsp;&nbsp;· ⭐ **thứ tự thuộc tính** (⭐ vòng 67: minify **đảo thứ tự**)
&nbsp;&nbsp;· ⭐ **cách viết giá trị** (⭐ vòng 68: minify **đổi sang dạng tương đương ngắn hơn**)
⇒ ⭐⭐ **KIỂM ĐÚNG CÁCH**: ⭐ **soi NGỮ NGHĨA** (`flex:none` ≡ `flex:0 0 auto`), ⛔ **không so CHUỖI** ✓

⭐ **Bằng chứng cho thấy lần này tôi đã làm đúng**: ⭐ tôi **in RA toàn bộ quy tắc** cho **cả 4 đối tượng** ⇒ ⭐ **thấy được `flex:none` và hiểu ngay đó là bản viết khác của `flex:0 0 auto`** ✓ — ⛔ **không kết luận từ một phép khớp chuỗi** ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⭐ **§11 — tab trong modal** | ✅ **ĐÃ VÁ ĐÚNG PHẠM VI** (`.modal .user-admin-tabs > button`) |
| ⭐ **Dải tab cấp trang** | ✅ **GIỮ NGUYÊN** quyết định «ôm sát nhãn» của nhà ✓ |
| ⛔ **`.edm-tabs`** | ✅ **⛔ không bị đụng** (⭐ tôn trọng cảnh báo của nhà) ✓ |
| **Build · Cổng UI · Test** | ✅ **BUILD SUCCESS** · ✅ **3 ✓** · ✅ **fail 0 · skipped 1 · EXIT=0** |
| ⭐ **Xác minh bundle** | ✅ **4/4 đối tượng đúng như thiết kế** ✓ |
| ⚠️ **Vân tay** | ⚠️ **ĐÃ ĐỔI** → ⭐ **`VNTECH-FP-D8D7CECB74BF9C00`** · ✅ ĐẠT 713 tệp |
| `:8787` | ✅ **HTTP 200** · PID **736** |
| Bug sản phẩm mới | **0** |
| ⛔ **Lỗi của tôi** | **0** — ⭐⭐ **quy tắc mới (TASK-212 §⑤) đã ngăn được lỗi lặp lại** ✓ |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑥ BÀI HỌC

1. ⭐⭐⭐ **QUY TẮC MỚI ĐÃ TRẢ LÃI NGAY VÒNG SAU.** ⭐ Vòng 67 tôi ghi «**vá CSS phải chứng minh selector trúng phần tử TRƯỚC**» ⇒ ⭐ vòng này tôi **truy vết `BaseModal` tới `lib/ui-blocks.tsx:22` và đo ra `.modal`** ⛔ **trước khi viết một dòng CSS nào** ⇒ ⭐ **vá đúng ngay lần đầu** ✓ — ⭐ **⛔ không lặp lại lỗi vòng 66** ✓
2. ⭐⭐⭐ **PHẠM VI CHÍNH XÁC LÀ MỘT PHẦN CỦA BẢN VÁ.** ⭐ Cùng một yêu cầu §11, ⭐ **hai phạm vi cho hai kết quả hoàn toàn khác**: ⭐ **`.user-admin-tabs` toàn cục** ⇒ **phá thiết kế cấp trang** ✗ · ⭐ **`.modal .user-admin-tabs`** ⇒ **đúng chỗ, ⛔ không phá gì** ✓
3. ⭐⭐⭐ **TRONG BUNDLE MINIFY, SOI NGỮ NGHĨA, ⛔ KHÔNG SO CHUỖI.** ⭐ Minify **đảo thứ tự thuộc tính** (v67) **và viết lại giá trị tương đương** (v68: `0 0 auto` → `none`) ✓
4. ⭐⭐ **TÔN TRỌNG GHI CHÚ CẢNH BÁO TRONG MÃ.** ⭐ `canonical.css` ghi «⛔ KHÔNG đụng `.edm-tabs`» ⇒ ⭐ **tôi ⛔ không đụng, và đã XÁC MINH là ⛔ không đụng** ✓
5. ⭐ **`SMALL SAFE FIX`: 1 quy tắc mới, ⛔ không sửa quy tắc cũ nào.** ⭐ Blast radius **đo được từng đối tượng** ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **164 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết**:
1. ⭐⭐⭐ **XÁC NHẬN BẰNG MẮT** — ⭐ **nay có 6 bản vá CSS** trên `:8787` ⇒ ⭐ **mở «Quản trị hệ thống» → chọn 1 user** xem **2 tab đã ĐỀU NHAU chưa** ✓
2. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **22 bài nghiệm thu** ⇒ ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 · BUG-014 · BUG-015** ✓
3. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` (đề xuất **B**) ✓
4. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
5. ⭐ **Mở rộng đường thành công** sang chứng từ tài chính còn lại ✓
6. ⭐ **Commit theo NHÓM** ✓
