# TASK-192 — GO-LIVE ĐỢT 47: ⛔⛔ **ĐÍNH CHÍNH CON SỐ BAO PHỦ** — «93%» là **CẬN TRÊN GÂY HIỂU NHẦM**; ĐO ĐƯỢC **31%**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Việc** | ⭐ Chính tôi vòng trước đã **nêu giới hạn** của con số «93%» ⇒ ⭐ **vòng này ĐO cho đúng** |
| **Phát hiện** | ⭐⭐ Tôi **đã tự nêu** rằng «204/220 là **CẬN TRÊN**» — ⭐ **đo thật thì đúng như vậy, và tệ hơn tôi nghĩ** |
| **Số đo thật** | ⛔ **69/220 = 31%** action **từng gọi THÀNH CÔNG** · **151/220 = 69% CHƯA TỪNG** |
| **Sản phẩm** | `tools/e2e/bao-phu-that.mjs` (**công cụ thường trực**) |
| **Mã nguồn sản phẩm sửa** | ⛔ **KHÔNG** |

---

## ① ⭐ TÔI ĐÃ **TỰ NÊU** GIỚI HẠN Ở VÒNG TRƯỚC — VÀ VÒNG NÀY ĐO CHO ĐÚNG

**Vòng 45 tôi viết**: *«204/220 = 93% NHƯNG ⛔ «tên action có xuất hiện trong tệp test» ⛔ không đồng nghĩa «đã được gọi với dữ liệu có nghĩa» ⇒ ⭐ đây là CẬN TRÊN»* ✓
**Vòng 46 tôi viết**: *«Phép đo mạnh hơn — gọi action + kiểm kết quả — mới tìm ra 2 lỗi 500, còn ‹tên có xuất hiện› thì ⛔ không»* ✓

⇒ ⭐⭐ **Vòng này TÔI ĐO CÁI «MẠNH HƠN» ĐÓ** — ⭐ và **kết quả tệ hơn nhiều so với con số 93% gợi ý** ✓

---

## ② ⭐⭐ PHÁT HIỆN PHỤ: **DỮ LIỆU ĐÃ ĐƯỢC THU TỰ ĐỘNG TỪ LÂU**

Đọc `tools/e2e/client.mjs` thì thấy **`call()` đã tự ghi bằng chứng**:
```js
// client.mjs:71
ghi({ loai: "action", action, ok, status: r.status, loi: loi || null, nhan, user: asUser.current });
```
⇒ ⭐ **`tools/e2e/bien-chung.jsonl` — 747 KB** chứa **mọi lệnh gọi action** ✓
⭐⭐ **TÔI CHƯA BAO GIỜ PHÂN TÍCH NÓ** — ⭐ **dữ liệu để đo bao phủ THẬT đã nằm sẵn, tôi chỉ chưa đọc** ✓

---

## ③ ⛔⛔ SỐ ĐO THẬT — **69/220 = 31%**

| Phép đo | Số | Nghĩa |
|---|---|---|
| Tên action **xuất hiện** trong tệp test | **204/220 (93%)** | ⛔ **CẬN TRÊN** — chỉ là «có nhắc tên» |
| ⭐ **Action GỌI THÀNH CÔNG (`ok:true`)** | **69/220 (31%)** | ⭐ **ĐO ĐƯỢC** — «đường THÀNH CÔNG» đã chạy |
| ⛔ **CHƯA TỪNG GỌI THÀNH CÔNG** | **151/220 (69%)** | ⚠️ **chưa từng chứng minh chạy được** |

**Nguồn đo**: `bien-chung.jsonl` — **5567 dòng · 2162 lệnh gọi action** · khoảng **02/10 → 04/10** ⇒ ⚠️ **tích luỹ NHIỀU PHIÊN** (⛔ không phải chỉ phiên này) ✓

### ⭐ VÌ SAO CHÊNH LỆCH LỚN ĐẾN VẬY — **VÀ ĐÂY LÀ ĐIỀU QUAN TRỌNG NHẤT**
⭐ Phần lớn **151 action** đó **ĐÃ được gọi** — nhưng **chỉ với ID BỊA**, nên chúng **chỉ trả 400 «Không tìm thấy …»** ✓
Ví dụ đo được:
```text
delete_accounting_voucher      · chỉ từng lỗi: Không tìm thấy chứng từ.
delete_payment_plan            · chỉ từng lỗi: Không tìm thấy kế hoạch thanh toán.
approve_stock_count            · chỉ từng lỗi: Phiếu kiểm kê không tồn tại hoặc đã xử lý.
close_po_line                  · chỉ từng lỗi: Đóng thiếu phải có lý do được phê duyệt.
```
⇒ ⭐⭐⭐ **CÁC BÀI «ID BỊA ⇒ 400» — KỸ THUẬT TÔI DÙNG SUỐT PHIÊN NÀY — CHỈ CHẠY **ĐƯỜNG TỪ CHỐI**, ⛔ CHƯA TỪNG CHẠY **ĐƯỜNG THÀNH CÔNG** ✓
⭐⭐ **VÀ 2 LỖI THẬT CỦA PHIÊN NÀY** (`check_material_alias_conflicts` «chỉ từng lỗi: **Internal Server Error**» · `preview_material_dependencies`) **NẰM ĐÚNG TRONG NHÓM 151 ĐÓ** ✓✓✓

---

## ④ ⚠️⚠️ ĐỌC CON SỐ NÀY THẾ NÀO — **NÓI RÕ, ⛔ KHÔNG THỔI PHỒNG**

| ⛔ **KHÔNG** có nghĩa | ✅ **CÓ** nghĩa |
|---|---|
| ⛔ **151 action bị hỏng** | ✅ **151 action chưa từng được E2E chạy ĐƯỜNG THÀNH CÔNG** |
| ⛔ sản phẩm lỗi 69% | ✅ **ĐỘ PHỦ TEST của đường thành công là 31%** |
| ⛔ người dùng không dùng được | ✅ người dùng **vẫn dùng bình thường** qua UI (UI ⛔ không gửi ID bịa) |

⭐ **Bằng chứng cho dòng «vẫn dùng bình thường»**: nhiều action trong 151 **UI có gọi** và **có dữ liệu thật trong DB** (vd `materialNorms` · `paymentPlans` · `businessRoleGroups` đều **có dòng**) ⇒ ⭐ **chúng hoạt động, chỉ là E2E chưa chạy đường thành công** ✓
⭐⭐ **NHƯNG** — ⭐ **2 lỗi 500 nằm trong nhóm đó** ⇒ ⭐ **đây là RỦI RO THẬT của GO-LIVE: đường thành công chưa được kiểm rộng** ✓

---

## ⑤ ✅ SẢN PHẨM: CÔNG CỤ THƯỜNG TRỰC `tools/e2e/bao-phu-that.mjs`

```text
node tools/e2e/bao-phu-that.mjs            # tóm tắt + danh sách chưa từng thành công
node tools/e2e/bao-phu-that.mjs --chi-ok   # chỉ in các action ĐÃ thành công
```
⭐ Công cụ **tự đọc `bien-chung.jsonl`** (⛔ không gọi lại API) · **đối chiếu với 220 action thật** · và ⭐ **in CẢNH BÁO CÁCH ĐỌC** để ⛔ không ai hiểu nhầm lần nữa ✓

⭐ **Và nó lộ thêm chi tiết**: `create_transfer_grn` · `request_supplement` · `reset_*` · `factory_reset_*` … ⇒ ⭐ **«CHƯA TỪNG ĐƯỢC GỌI»** (⛔ không phải «chỉ từng lỗi») ✓

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Bao phủ «tên xuất hiện» (phép đo CŨ) | **204/220 = 93%** — ⛔ **cận trên gây hiểu nhầm** |
| ⭐ **Bao phủ «gọi THÀNH CÔNG» (phép đo MỚI)** | ⛔ **69/220 = 31%** |
| Chưa từng thành công | **151/220 = 69%** (phần lớn chỉ từng nhận 400 «Không tìm thấy…») |
| Nguồn | `bien-chung.jsonl` **5567 dòng · 2162 lệnh gọi** · ⚠️ tích luỹ nhiều phiên |
| Công cụ mới | ✅ `tools/e2e/bao-phu-that.mjs` |
| **2 lỗi 500 của phiên này** | ⭐ **nằm đúng trong nhóm 151 chưa từng thành công** ✓ |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-27251D9B7F076176` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **6 bản vá chưa lên sóng** |
| Tệp tạm | **0** |

---

## ⑦ BÀI HỌC

1. ⭐⭐⭐ **MỘT CON SỐ BAO PHỦ CÓ THỂ ĐÚNG MÀ VẪN GÂY HIỂU NHẦM NGHIÊM TRỌNG.** «204/220 tên có trong tệp test» **đúng về mặt kỹ thuật** nhưng ⛔ **che mất** việc **151 action chưa từng chạy đường thành công** ✓ ⭐ **Con số «93%» an toàn hơn nhiều so với sự thật «31%»** ✓
2. ⭐⭐⭐ **KỸ THUẬT «ID BỊA ⇒ 400» CHỈ KIỂM ĐƯỜNG TỪ CHỐI.** ⭐ Tôi đã dùng nó **suốt phiên** và **tự hào vì nó phủ rộng** — ⭐ **nhưng nó ⛔ không chứng minh action nào CHẠY ĐƯỢC** ✓ ⭐ **Phủ đường từ chối ⛔ không phải phủ đường thành công.**
3. ⭐⭐ **DỮ LIỆU ĐỂ ĐO ĐÃ NẰM SẴN — TÔI CHỈ CHƯA ĐỌC.** `client.mjs` **đã tự ghi bằng chứng từ lâu** (`bien-chung.jsonl` 747 KB) ⇒ ⭐ **trước khi viết công cụ mới, hãy tìm xem dữ liệu đã có chưa** ✓
4. ⭐⭐ **TỰ NÊU GIỚI HẠN RỒI TỰ ĐO LÀ CÁCH LÀM ĐÚNG.** Vòng 45 tôi **nêu** «93% là cận trên»; vòng này tôi **đo** ⇒ ⭐ **giới hạn được nêu ra thì đo được, ⛔ còn giới hạn bị che thì không** ✓
5. ⭐ **NÓI RÕ CON SỐ ⛔ KHÔNG CÓ NGHĨA GÌ.** 31% ⛔ **không phải** «sản phẩm hỏng 69%» — ⭐ **nó là «độ phủ test của đường thành công»** ✓ ⛔ **Thổi phồng theo hướng ngược lại cũng là sai.**

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **141 đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐⭐ **TRIỂN KHAI** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai` ⇒ **6 bản vá** — ⭐ sau đó tôi chạy lại E2E để **`VERIFY` end-to-end BUG-20261005-012**.
2. ⭐⭐⭐ **MỞ RỘNG E2E SANG ĐƯỜNG THÀNH CÔNG** — ⭐ **đây là việc lớn nhất còn lại của GO-LIVE**: hiện chỉ **31%** action từng chạy thành công; ⭐ đề xuất **ưu tiên 20–30 action nghiệp vụ chính** (tạo phiếu · duyệt · nhập/xuất kho · thanh toán) với **dữ liệu THẬT rồi DỌN SẠCH**.
3. ⭐⭐ **BUG-20261005-013** — **A** tạo migration hay **B** bỏ `mergedFrom`?
4. ⭐ **Xác nhận 5 bản vá CSS bằng mắt.**
5. ⭐⭐ **Cho phép 1 phép thử GHI** để chốt cơ chế quyền.
6. **Commit theo NHÓM hay gộp?** · **BUG-20261009** · **«ai nhận hàng ở kho đích»** · **dọn Transit** · **khoá ngoại**.
