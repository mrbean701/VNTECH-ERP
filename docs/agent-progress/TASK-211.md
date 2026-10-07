# TASK-211 — GO-LIVE ĐỢT 66: ⭐ **UI §11 — TAB TRONG MODAL PHẢI ĐỒNG NHẤT KÍCH THƯỚC** — đã vá + build + xác minh

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ **§11 UI/UX** — «Các tab trong cùng một modal phải có **kích thước ĐỒNG NHẤT**… ⛔ **không để kích thước tab thay đổi bất thường theo độ dài text**» |
| **Kết quả** | ✅ **ĐÃ VÁ** (`app/globals.css`) · ✅ **BUILD THÀNH CÔNG** · ✅ **CỔNG UI ĐẠT** · ✅ **`npm test` fail 0 · skipped 1 · EXIT=0** · ✅ **XÁC MINH quy tắc mới CÓ trong bundle đang phục vụ** |
| **⛔ LỖI CỦA TÔI** | **1** — ⭐ **tra sai đường dẫn** (⭐ rẻ, tự phát hiện ngay) · ⚠️ **1 phép tìm quá chặt** (⭐ tự phát hiện) |

---

## ① ⭐ LỖI §11 — ĐO ĐƯỢC, ⛔ KHÔNG PHẢI SUY ĐOÁN

| Nơi | Kích thước tab đồng nhất? |
|---|---|
| **`app/screens/AdminUserModalTabs.tsx`** (modal quản trị user) | ⛔ **KHÔNG** — 2 tab: «Sửa tài khoản» (**13 ký tự** ≈ 110px) vs «Phân quyền công việc / Chức năng» (**31 ký tự** ≈ 250px) ⚠️ **không có width** ⇒ ⭐ `flex:0 0 auto` ⇒ **chiều rộng = độ dài chữ** ⇒ ⭐⚠️ **LỆCH HƠN GẤP ĐÔI** ✓ |
| **`app/screens/ContractReviewScreen.tsx`** (modal duyệt hợp đồng) | ✅ **CÓ** — `style={{ width: t.width, minWidth: t.width, maxWidth: t.width }}` với `REVIEW_TABS` = **240px / 200px** ✓ |

---

## ② ⭐⭐⭐ CHÍNH MÃ NGUỒN ĐÃ GHI LẠI LỖI NÀY — NHƯNG VÁ CHƯA XONG

⭐ `app/screens/AdminUserModalTabs.tsx` (chú thích **«MỐC 115»**):
> «…dải thẻ NÀY nằm trong modal nên không thuộc scope `.project-management`/`.work-center`/`.team-management` của `project-scope-tabs`, chỉ nhận rule chung `[role="tablist"]` (`flex: 0 0 auto`) ⇒ **2 thẻ co theo độ dài chữ, lệch nhau rõ**.»

⇒ ⭐ **Một phiên TRƯỚC đã tìm ra ĐÚNG lỗi này và ghi lại** ✓
⚠️ **NHƯNG cách vá cũ CHỈ THÊM LỚP** (`user-admin-tabs` + rule trong `globals.css`) ⛔ **chưa ĐẶT KÍCH THƯỚC** ⇒ ⭐ **lỗi vẫn còn** ✓✓✓
⇒ ⭐⭐ **BÀI HỌC**: ⭐ **một chú thích mô tả đúng lỗi ⛔ KHÔNG có nghĩa là lỗi đã được vá** ✓

---

## ③ ⭐ MẪU NHÀ ĐÃ CÓ SẴN — VÀ TÔI DÙNG LẠI NÓ

⭐ **`ContractReviewScreen`** đặt **width cố định cho từng tab** (`REVIEW_TABS` = `240px` / `200px`) ✓
⇒ ⭐ **NHÀ ĐÃ Ý THỨC việc phải CỐ ĐỊNH chiều rộng tab** ✓

### 🔧 BẢN VÁ — `flex: 1 1 0` (chia ĐỀU), ⛔ **không bịa con số pixel nào**
```css
/* trước: flex:0 0 auto  ⇒ chiều rộng theo độ dài chữ */
.review-modal .user-admin-tabs>button{flex:1 1 0;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:inline-flex;align-items:center;justify-content:center;text-align:center;box-sizing:border-box}
```
⭐ **VÌ SAO `flex:1 1 0` mà ⛔ không phải `width: 240px`**:
- ⭐ §11 đòi **«ĐỒNG NHẤT»** ⇒ ⭐ **chia đều bảo đảm ĐỒNG NHẤT TUYỆT ĐỐI** ✓
- ⭐ **⛔ không bịa số** (⭐ tôi ⛔ không biết bề rộng modal ở mọi màn hình) ✓
- ⭐ **tự thích ứng** bề rộng modal / màn hình ✓
- ⭐ `white-space:nowrap` + `overflow:hidden` + `text-overflow:ellipsis` **giữ nguyên** (⭐ mẫu nhà đã có) ⇒ ⚠️ nhãn dài có thể rút gọn «…» — ⭐ **đúng hành vi nhà đã chấp nhận** ✓

⭐ **`SMALL SAFE FIX` §12**: **sửa 1 thuộc tính trong 1 quy tắc có sẵn** + 12 dòng chú thích ✓

---

## ④ ✅ XÁC MINH ĐẦY ĐỦ — ⛔ KHÔNG SUY ĐOÁN

| Tầng | Kết quả |
|---|---|
| **Chuỗi build** | ✅ chạy đủ: dọn `tmp-*` → fixpoint → set-local-identity → **`npm run build`** → khởi động lại `:8787` **theo đúng PID** (⭐ đã kiểm cmdline khớp `local-server\.mjs`) |
| **Vân tay** | ⚠️ **ĐÃ ĐỔI** — `VNTECH-FP-27251D9B7F076176` → ⭐ **`VNTECH-FP-ED3A8EC67C44C7F9`** (⭐ vì `app/globals.css` **nằm TRONG `ROOT_DIRS`**) · ✅ **ĐẠT** `source:713 files` |
| **`npm run build`** | ✅ `BUILD SUCCESS` · `BUILT ARTIFACT VALIDATION: ĐẠT` · `BUILD_EXIT=0` |
| **`:8787`** | ✅ **HTTP 200** · PID mới **22212** ✓ |
| ⭐ **CỔNG UI** | ✅ **3 dấu ✓** (`do-moi` · `van-tay` · `byte 6/6`) ⇒ **«BẢN CHẠY ĐÚNG BẢN ĐÃ BUILD MỚI NHẤT»** ✓ |
| ⭐ **`npm test`** | ✅ **fail 0 · cancelled 0 · skipped 1 · todo 0 · EXIT=0** ✓ |
| ⭐⭐ **QUY TẮC MỚI TRONG BUNDLE** | ✅ `dist/client/assets/index-YqlvF3k_.css`: `…box-sizing:border-box;`**`flex:1 1 0`**`;justify-content:center;align-items:center;`**`min-width:0`**`;display:inline-flex;overflow:hidden}` ✓ |
| ⭐ **QUY TẮC CŨ ĐÃ BIẾN MẤT** | ✅ **`flex:0 0 auto` KHÔNG còn trong quy tắc** ✓ |

---

## ⑤ ⚠️ HAI PHÉP ĐO SAI CỦA TÔI — TỰ PHÁT HIỆN VÀ SỬA

| # | Phép đo sai | ⭐ Cách sửa |
|---|---|---|
| 1 | ⭐ **Tra sai đường dẫn** — tôi đọc `app\components\AdminUserModalTabs.tsx` ⚠️ nhưng tệp ở **`app\screens\`** | ⭐ dùng `Get-ChildItem -Recurse` để **tìm đúng tệp** thay vì **đoán đường dẫn** ✓ |
| 2 | ⭐ **Phép tìm quá chặt** — tôi tìm `user-admin-tabs>button\{flex:1 1 0` ⇒ ⛔ **không thấy** ⇒ ⚠️ **suýt kết luận «bản vá ⛔ không vào bundle»** | ⭐ **SỰ THẬT**: ⭐ **minify ĐẢO THỨ TỰ thuộc tính** ⇒ `flex` **không còn đứng đầu** ✓ ⇒ ⭐ **sửa: tìm `flex:\s*1\s+1\s+0` TRONG TOÀN BỘ QUY TẮC**, ⛔ không đòi vị trí ✓ |

⇒ ⭐⭐ **BÀI HỌC**: ⭐ **khi tìm trong bundle ĐÃ MINIFY, ⛔ ĐỪNG giả định THỨ TỰ thuộc tính** ✓ — ⭐ **minify có quyền đảo thứ tự** ✓
⭐⭐ **VÀ** điều đã cứu tôi: ⭐ **tôi in RA QUY TẮC ĐẦY ĐỦ** thay vì kết luận từ một phép khớp chuỗi ✓

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⭐ **Lỗi §11** | ✅ **ĐÃ VÁ** (`flex:0 0 auto` → `flex:1 1 0` + `min-width:0`) |
| **Build · Cổng UI · Test** | ✅ **BUILD SUCCESS** · ✅ **3 ✓ + «đúng bản mới nhất»** · ✅ **fail 0 · skipped 1 · EXIT=0** |
| ⭐ **Xác minh bundle** | ✅ **quy tắc mới CÓ**, ⛔ **quy tắc cũ KHÔNG còn** |
| ⚠️ **Vân tay** | ⚠️ **ĐÃ ĐỔI** → ⭐ **`VNTECH-FP-ED3A8EC67C44C7F9`** (⭐ `app/globals.css` **trong `ROOT_DIRS`**) · ✅ ĐẠT 713 tệp |
| `:8787` | ✅ **HTTP 200** · PID **22212** |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | ⚠️ **2 phép đo sai** — ⭐ **cả hai tự phát hiện và sửa** |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **8 bản vá chưa lên sóng** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑦ BÀI HỌC

1. ⭐⭐⭐ **MỘT CHÚ THÍCH MÔ TẢ ĐÚNG LỖI ⛔ KHÔNG CÓ NGHĨA LÀ LỖI ĐÃ ĐƯỢC VÁ.** ⭐ `AdminUserModalTabs.tsx` **ghi rõ** «2 thẻ co theo độ dài chữ, lệch nhau rõ» ⚠️ — ⭐ **nhưng cách vá chỉ THÊM LỚP, ⛔ chưa ĐẶT KÍCH THƯỚC** ⇒ ⭐ **lỗi còn nguyên** ✓ — ⭐ **đọc chú thích ⛔ không thay được ĐO LẠI** ✓
2. ⭐⭐⭐ **KHI TÌM TRONG BUNDLE ĐÃ MINIFY, ⛔ ĐỪNG GIẢ ĐỊNH THỨ TỰ THUỘC TÍNH.** ⭐ Minify **đảo thứ tự** ⇒ ⭐ **phép khớp theo vị trí sẽ ⛔ không thấy** ✓ — ⭐ **và tôi suýt kết luận sai «bản vá không vào bundle»** ✓
3. ⭐⭐ **MẪU NHÀ LÀ NGUỒN GIÁ TRỊ TỐT NHẤT.** ⭐ `ContractReviewScreen` **đã** cố định width tab ⇒ ⭐ **tôi biết ngay hướng đúng**, ⛔ không phải tự nghĩ ✓
4. ⭐⭐ **`flex:1 1 0` TỐT HƠN MỘT CON SỐ PIXEL** khi yêu cầu là **«ĐỒNG NHẤT»** — ⭐ **chia đều bảo đảm đồng nhất tuyệt đối** và ⭐ **⛔ không cần bịa số** ✓
5. ⭐⭐ **SỬA 1 QUY TẮC CSS CŨNG PHẢI CHẠY TRỌN CHUỖI BUILD** — ⭐ `app/globals.css` **nằm trong `ROOT_DIRS`** ⇒ ⭐ **vân tay ĐỔI** và ⭐ **phải build lại + khởi động lại + cổng UI + `npm test`** ✓
6. ⭐ **ĐỌC LẠI CHÍNH QUY TẮC ĐẦY ĐỦ ĐÃ CỨU TÔI** khỏi kết luận sai ở §⑤ ✓

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **176 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết** (⭐ chi tiết trong `docs/agent-progress/BAN-GIAO-GO-LIVE.md`):
1. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **22 bài nghiệm thu** ⇒ ⭐ **sau đó tôi `VERIFY` end-to-end BUG-012 · BUG-014 · BUG-015** ✓
2. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` (đề xuất **B**) ✓
3. ⭐⭐ **XÁC NHẬN BẰNG MẮT** — ⭐ **nay có 6 bản vá CSS** trên `:8787`: `.modal-head` · `.receiving-kpi-button` · `.requests-shortage-card` · `.page-collapse` · `.stack-form` · ⭐ **`.user-admin-tabs > button` (mới)** ⇒ ⭐ **mở modal quản trị user** xem **2 tab đã ĐỀU NHAU chưa** ✓
4. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
5. ⭐ **Mở rộng đường thành công** sang các chứng từ tài chính còn lại ✓
6. ⭐ **Commit theo NHÓM** ✓
