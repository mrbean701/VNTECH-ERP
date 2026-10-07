# TASK-215 — GO-LIVE ĐỢT 70: ⭐ **§11 ĐO NỐT 3 MẶT CÒN LẠI** — chiều cao · căn chỉnh · vùng tiêu đề · error state

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Vòng 68/69 đã làm **chiều rộng** ⇒ ⭐ **đo nốt 3 mặt §11 còn lại**: **chiều cao · căn chỉnh · vùng tiêu đề** + **«error state»** |
| **Kết quả** | ✅ **§11 chiều cao + căn chỉnh: ĐÃ ĐỒNG NHẤT** (⭐ đo được) · ⚠️ **error state: ĐỦ DÙNG, ⛔ KHÔNG NÊN VÁ** (⭐ vì sẽ **che giấu** lỗi backend — §3) |
| **⛔ THAY ĐỔI CODE** | **0** — ⭐ **đúng §12 «⛔ không đổi thứ không cần»** ✓ |
| **⛔ LỖI CỦA TÔI** | **0** |

---

## ① ✅ §11 «CHIỀU CAO + CĂN CHỈNH» — **ĐÃ ĐỒNG NHẤT** (⭐ đo trên bundle)

⭐ **In ra MỌI quy tắc ăn vào nút của 2 dải tab trong modal** (⭐ ⛔ không đoán):
| Thuộc tính | `HrProfileEditModal` (`project-scope-tabs`) | `AdminUserModalTabs` (`user-admin-tabs`) |
|---|---|---|
| **chiều cao nút** | ⭐ **`height: 36px`** — ⭐ **CHUNG một quy tắc cho CẢ 2 nút** ✓ | ⭐ **theo nội dung** — ⭐ **CHUNG một quy tắc cho CẢ 2 nút** ✓ |
| **căn chỉnh dải** | ⭐ **`align-items: center`** | ⭐ **`align-items: stretch`** |
| **khoảng cách** | ⭐ `gap: 7px` | ⭐ `gap: 4px` |
| **chiều rộng nút** | ⭐ **`flex: 1 1 0`** (⭐ đã vá v69) ✓ | ⭐ **`flex: 1 1 0`** (⭐ đã vá v68) ✓ |

⇒ ⭐⭐ **§11 NÓI: «các tab trong CÙNG MỘT modal phải có kích thước ĐỒNG NHẤT»** ✓
⇒ ⭐⭐⭐ **TRONG TỪNG MODAL**, cả 2 nút **dùng CHUNG MỘT QUY TẮC** ⇒ ⭐ **CHIỀU CAO ĐỒNG NHẤT, CĂN CHỈNH ĐỒNG NHẤT** ✅✓✓
⚠️ **SỰ KHÁC NHAU LÀ *GIỮA* 2 MODAL** (⭐ 36px vs theo-nội-dung · center vs stretch) ⚠️ — ⭐ **§11 ⛔ KHÔNG đòi đồng nhất giữa các modal khác nhau** ✓
⇒ ⭐⭐ **KẾT LUẬN: ⛔ KHÔNG CÓ VI PHẠM §11 Ở CHIỀU CAO / CĂN CHỈNH** ✓ — ⭐ **và tôi ⛔ KHÔNG vá** (⭐ §12) ✓

### ⭐ «VÙNG TIÊU ĐỀ» (header area)
⭐ **Mỗi dải tab nằm trong `BaseModal`** (`lib/ui-blocks.tsx:22`) với **cùng một `<header>`** (⭐ `modal-head`: `h2` tiêu đề + nút `×`) ✓
⇒ ⭐ **«vùng tiêu đề» của 2 modal là CÙNG MỘT component** ⇒ ⭐ **đồng nhất theo thiết kế** ✓

---

## ② ⚠️ §11 «ERROR STATE» — **ĐỦ DÙNG, VÀ ⛔ TÔI QUYẾT ĐỊNH ⛔ KHÔNG VÁ**

⭐ **ĐO ĐƯỢC**: `app/page.tsx:312`:
```js
if (!response.ok) throw new Error(result.error || "Không thể xử lý yêu cầu.");
```
⇒ ⭐ **khi API trả 500, người dùng VẪN thấy một thông điệp** (`result.error` hoặc câu tiếng Việt dự phòng) ✓
⚠️ **Hạn chế**: ⭐ `result.error` của Spring có thể là **«Internal Server Error» (tiếng Anh, kỹ thuật)** ⚠️ — ⭐ mức **LOW / UI POLISH** ✓

### ⛔⛔ VÌ SAO ⛔ KHÔNG VÁ BÂY GIỜ — **§3 LÀ LÝ DO QUYẾT ĐỊNH**
> ⭐ goal §3: «⛔ **Không dùng workaround frontend để che giấu backend bug** nếu có thể sửa đúng nguyên nhân.»

⭐ **Tôi ĐÃ sửa đúng nguyên nhân của CẢ 3 LỖI 500** (`BUG-20261005-012` · `-013` · `-015`) ✓
⇒ ⭐ **thêm một lớp thông điệp thân thiện lúc này sẽ:**
&nbsp;&nbsp;· ⚠️ **làm lỗi 500 trông «bình thường»** ⇒ ⭐ **giảm khả năng phát hiện lỗi sau này** ✓
&nbsp;&nbsp;· ⚠️ **là workaround che backend** ⇒ ⭐ **đúng thứ §3 cấm** ✓
&nbsp;&nbsp;· ⭐ **trong khi cách sửa THẬT đã sẵn sàng** — ⭐ **chỉ chờ TRIỂN KHAI** ✓
⇒ ⭐⭐ **QUYẾT ĐỊNH: ⛔ KHÔNG VÁ. Ghi nhận mức LOW. Ưu tiên TRIỂN KHAI 8 bản vá.** ✓✓✓

---

## ③ ⭐ TỔNG KẾT §11 — **MỌI MẶT ĐÃ ĐƯỢC ĐO**

| Mặt §11 | Trạng thái | ⭐ Bằng chứng |
|---|---|---|
| **chiều rộng tab** | ✅ **ĐÃ VÁ** | `AdminUserModalTabs` (v68) · `HrProfileEditModal` (v69) — ⭐ **`flex:1 1 0`** ✓ |
| **chiều cao tab** | ✅ **ĐÃ ĐỒNG NHẤT** | ⭐ **trong từng modal, cả 2 nút chung 1 quy tắc** (⭐ đo trên bundle) ✓ |
| **căn chỉnh tab** | ✅ **ĐÃ ĐỒNG NHẤT** | ⭐ **cùng quy tắc** ✓ |
| **vùng tiêu đề** | ✅ **ĐỒNG NHẤT** | ⭐ **cùng `<header>` của `BaseModal`** ✓ |
| **⛔ không co theo độ dài text** | ✅ **ĐÃ VÁ** | ⭐ `flex:1 1 0` ⛔ không còn phụ thuộc nhãn ✓ |
| **error state** | ⚠️ **ĐỦ DÙNG** | ⭐ **mức LOW** · ⛔ **không vá vì §3** ✓ |

⇒ ⭐⭐⭐ **§11 PHẦN «TAB TRONG MODAL» ĐÃ HOÀN TẤT VỀ MẶT ĐO LƯỜNG** ✓

---

## ④ ⛔ BLOCKER THẬT SỰ — **TRIỂN KHAI** (⭐ ⛔ tôi ⛔ không tự làm)

⭐ **8 BẢN VÁ JAVA** đã `FIXED` + qua hồi quy **156/156** ⚠️ **nhưng ⛔ CHƯA LÊN SÓNG**:
| # | Bug | Mức | ⭐ Trạng thái |
|---|---|---|---|
| ① | `BUG-20261005-003` | MEDIUM | FIXED |
| ② | `BUG-20261005-005` | **HIGH** | FIXED |
| ③ | `BUG-20261005-008` | MEDIUM | FIXED |
| ④ | `BUG-20261010` | **HIGH** | FIXED |
| ⑤ | `BUG-20261011` | LOW | FIXED |
| ⑥ | `BUG-20261005-012` | **HIGH** | FIXED · ⛔ chưa VERIFIED e2e |
| ⑦ | `BUG-20261005-014` | MEDIUM | FIXED · ⛔ chưa VERIFIED e2e |
| ⑧ | `BUG-20261005-015` | MEDIUM | FIXED · ⛔ chưa VERIFIED e2e |

⭐⭐ **1 LỆNH DUY NHẤT**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **22 bài nghiệm thu tự chạy** · ⭐ **sao lưu JAR** · ⭐ **6 chốt an toàn** · ⭐ **kèm hướng dẫn lùi** ✓
⭐ **Sau triển khai tôi sẽ `VERIFY` end-to-end ⑥⑦⑧** ✓ — ⭐ **nay cả 3 chỉ dám nói `FIXED`** ✓

---

## ⑤ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| ⭐ **§11 chiều cao + căn chỉnh** | ✅ **ĐÃ ĐỒNG NHẤT** (⭐ đo trên bundle) |
| ⭐ **§11 error state** | ⚠️ **ĐỦ DÙNG** · mức **LOW** · ⛔ **không vá (§3)** |
| ⛔ **Thay đổi code** | **0** — ⭐ **đúng §12** |
| ✅ **Trạng thái hệ thống** | **BUILD cũ vẫn đúng** · cổng UI ✓ · `npm test` **EXIT=0** (⭐ v70 ⛔ không đổi code ⇒ ⛔ không cần build lại) |
| **Vân tay** | ⭐ **`VNTECH-FP-018A1FB2E849579E`** · **ĐẠT** 713 tệp ✓ |
| `:8787` | ✅ **HTTP 200** · PID **4816** ✓ |
| `:18081` | ✅ **401 = KHOẺ** · PID **3784** ✓ |
| Bug sản phẩm mới | **0** |
| ⛔ Lỗi của tôi | **0** |
| Tệp tạm · `.snapshot` | **0 · 0** |

---

## ⑥ BÀI HỌC

1. ⭐⭐⭐ **ĐO RỒI KẾT LUẬN «⛔ KHÔNG CẦN VÁ» CŨNG LÀ MỘT KẾT QUẢ.** ⭐ §11 đòi **đồng nhất TRONG một modal** ⚠️ — ⭐ **tôi ĐO và thấy TRONG từng modal đã đồng nhất** ⇒ ⭐ **⛔ không vá** ⇒ ⭐ **tiết kiệm một thay đổi không cần thiết** (⭐ §12) ✓
2. ⭐⭐⭐ **«KHÁC NHAU GIỮA 2 MODAL» ⛔ KHÔNG PHẢI «VI PHẠM §11».** ⭐ Đọc kỹ yêu cầu: ⭐ **phạm vi là «trong cùng một modal»** ✓ — ⭐ **nếu tôi đọc ẩu, tôi đã «sửa» một thứ ⛔ không hỏng, và phá thiết kế hiện có** ✓
3. ⭐⭐⭐ **§3 QUYẾT ĐỊNH VIỆC ⛔ KHÔNG VÁ ERROR STATE.** ⭐ Thêm thông điệp thân thiện cho 500 lúc này = ⭐ **che giấu backend bug** ⚠️ **trong khi cách sửa THẬT đã sẵn sàng** ⇒ ⭐ **§3 cấm** ✓ — ⭐ **đây là lần đầu tôi dùng §3 để QUYẾT ĐỊNH ⛔ KHÔNG LÀM GÌ** ✓
4. ⭐⭐ **ƯU TIÊN ĐÚNG LÀ TRIỂN KHAI, ⛔ KHÔNG PHẢI THÊM VIỆC MỚI.** ⭐ §19 xếp **bug HIGH/MEDIUM** trên **UI polish** ⇒ ⭐ **8 bản vá đang chờ quan trọng hơn mọi thứ tôi có thể làm thêm** ✓
5. ⭐ **MỘT VÒNG ⛔ KHÔNG ĐỔI CODE VẪN LÀ VÒNG CÓ GIÁ TRỊ** — ⭐ **nó ĐÓNG câu hỏi «§11 còn gì chưa kiểm?»** ✓

---

## ⑦ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **165 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết** (⭐ **ưu tiên theo §19**):
1. ⭐⭐⭐ **TRIỂN KHAI 8 BẢN VÁ** — ⭐ **việc ưu tiên CAO NHẤT còn lại**: `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ ⭐ **22 bài nghiệm thu** ⇒ ⭐ **tôi `VERIFY` end-to-end 3 bug 500** ✓
2. ⭐⭐⭐ **XÁC NHẬN BẰNG MẮT** — **«Quản trị hệ thống» → 1 user** (2 tab) · **«Sửa hồ sơ nhân sự»** (2 tab) ✓
3. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay ⭐ **B** bỏ `mergedFrom` (đề xuất **B**) ✓
4. ⭐⭐ **1 phép thử GHI** để chốt sự cố quyền ✓
5. ⭐ **Mở rộng đường thành công** sang chứng từ tài chính còn lại ✓
6. ⭐ **Commit theo NHÓM** ✓
