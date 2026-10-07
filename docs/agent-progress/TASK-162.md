# TASK-162 — GO-LIVE ĐỢT 17: KIỂM HỌ `save_*` + CÔNG CỤ «KIỂM HẬU QUẢ» THƯỜNG TRỰC

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Kết quả** | ✅ **10/10 `save_*` chặn payload rỗng** · ⛔ **0 × 500** · ✅ **không bảng nào sinh dữ liệu rác** ⇒ **không có bug mới** |
| **Sản phẩm mới** | `tools/e2e/chup-so-dong.mjs` — **công cụ thường trực** |
| **Tệp mới** | `tools/e2e/go-live-kiem-save-payload-rong.mjs` |
| **Mã nguồn sửa** | ⛔ **KHÔNG** ⇒ vân tay không đổi, ⛔ không cần build lại |

---

## ① KỸ THUẬT — PAYLOAD RỖNG + **ĐO SỐ DÒNG TRƯỚC/SAU**

Sau `delete_*` (vòng 14) và `update_*`/`set_*_status`/`bulk_*` (vòng 15), còn họ **`save_*` (12 action UI gọi mà chưa hề được kiểm)**.

**Nguyên tắc an toàn:** chỉ gửi payload **RỖNG `{}`** ⇒ action **CÓ** kiểm tra sẽ trả **400** và ⛔ không tạo gì. Nếu action **THIẾU** kiểm tra thì nó tạo **bản ghi RÁC** — và phép đo số dòng sẽ **PHÁT HIỆN**.

⛔ **VÌ SAO PHẢI ĐO SỐ DÒNG** (không suy bảng đích từ mã): tôi đã thử suy bảng đích tĩnh — **THẤT BẠI**, vì use case gọi `store.insertXxx(...)` chứ ⛔ không có `INSERT INTO` tường minh. **Chụp toàn schema (131 bảng)** là cách **chắc hơn** và phủ **mọi** bảng.

⛔ **HAI ACTION BỊ LOẠI TRỪ — CÓ LÝ DO, ⛔ không phải bỏ sót:** `save_ui_display_settings` và `save_trust_development_settings` là **cấu hình dạng SINGLETON** ⇒ gửi `{}` có thể **GHI ĐÈ cấu hình thật** mà tôi ⛔ **không có cách khôi phục** ⇒ ⛔ **KHÔNG chạy** (§12: ⛔ không đánh cược vào cấu hình thật khi chưa chắc).

---

## ② KẾT QUẢ — 10/10 CHẶN SẠCH, KIỂM TRA TỐT

| Action | HTTP | Thông báo |
|---|---|---|
| `save_business_role_group` | 400 | Tên hoặc quyền nền của nhóm nghiệp vụ chưa hợp… |
| `save_business_scope` | 400 | Mã phạm vi gồm 2–40 ký tự a-z, số, gạch dưới… |
| `save_construction_daily_log` | 400 | Nhật ký thi công phải có dự án và ngày YYYY-MM… |
| `save_engine_role_profile` | 400 | Không tìm thấy quyền nền cần cập nhật. |
| `save_material_norm` | 400 | Định mức tiêu hao không được để trống. |
| `save_module_catalog` | 400 | Mục chức năng không hợp lệ. |
| `save_role_catalog` | 400 | Tên vai trò là bắt buộc. |
| `save_system_level` | 400 | Cấp bậc cần mã và tên. |
| `save_team_payment` | 400 | Số tiền thanh toán không được để trống. |
| `save_team_production` | 400 | Giá trị trình không được để trống. |

**Tổng: chặn sạch 10/10 · ⛔ nhận payload rỗng 0 · ⛔ 500 = 0**

⭐ **Kết quả ÂM có giá trị**: mọi action đều có **kiểm tra đầu vào** với thông báo **tiếng Việt đọc được** ⇒ chất lượng validate của họ `save_*` là **tốt**.

---

## ③ ⭐ KIỂM HẬU QUẢ — CHỤP 131 BẢNG TRƯỚC/SAU

| | |
|---|---|
| **TRƯỚC** | 131 bảng · tổng **12403** dòng |
| **SAU** | 131 bảng · tổng **12404** dòng |
| **Bảng đổi** | **`sessions`** 3152 → **3153** (+1) |

⭐ **Giải thích được ngay**: đó là **phiên đăng nhập của chính tôi** khi chạy thí nghiệm — ⛔ **không phải bản ghi rác**.
⇒ **KHÔNG bảng nghiệp vụ nào sinh dữ liệu** ⇒ 10 action `save_*` ⛔ **không tạo gì từ payload rỗng** ✔

⭐ **Phép đo hoạt động ĐÚNG THIẾT KẾ** — nó bắt được **đúng 1 thay đổi** và tôi giải thích được thay đổi đó.

---

## ④ ⭐ SẢN PHẨM MỚI — CÔNG CỤ THƯỜNG TRỰC `tools/e2e/chup-so-dong.mjs`

Kỷ luật «**KIỂM HẬU QUẢ**» (rút ra ở TASK-161 §⑥) nay được **cụ thể hoá thành công cụ** thay vì làm tay mỗi lần:

```text
node tools/e2e/chup-so-dong.mjs --truoc    # chụp TRƯỚC khi chạy thí nghiệm
... chạy thí nghiệm ...
node tools/e2e/chup-so-dong.mjs --sau      # in ra bảng nào đổi số dòng
```

| Đặc điểm | |
|---|---|
| Phạm vi | **toàn bộ bảng** của `vntech_erp` ⇒ ⛔ không cần biết trước bảng đích |
| Chống dùng sai | ⛔ từ chối `--truoc` khi đã có snapshot cũ · ⛔ từ chối `--sau` khi chưa có `--truoc` |
| Tự dọn | xoá snapshot sau khi so |
| Nhắc đúng chỗ | «tăng ở `sessions` là **BÌNH THƯỜNG** khi thí nghiệm có đăng nhập» |
| Đã thử | chụp → không làm gì → so ⇒ **«✔ KHÔNG bảng nào đổi số dòng»** ✔ |

**DẶN DÒ trong mã:** ⛔ mọi bảng **KHÁC** `sessions` mà tăng ⇒ **phải tìm bản ghi đó và DỌN SẠCH trước khi kết luận**.

---

## ⑤ TIẾN ĐỘ PHỦ KIỂM THỬ (92 action UI gọi mà chưa hề được kiểm)

| Vòng | Họ action | Số | Kết quả |
|---|---|---|---|
| 13 | `mark_notification_all_read` · `change_password` | 2 | 1 ĐẠT · 1 phát hiện MEDIUM (BUG-20261009) |
| 14 | `delete_*` (8 mẫu) | 8 | **1 bug HIGH (BUG-20261010)** + 7 vững |
| 15 | `update_*`/`set_*_status`/`bulk_*` | 11 | **11/11 vững** |
| 16 | `save_*` | 10 | **10/10 vững** |
| **Tổng** | | **31** | **2 bug thật** (1 HIGH · 1 MEDIUM) + **29 vững** |

⭐ **Tỉ lệ tìm được bug thật ≈ 2/31 ≈ 6,5%** ⇒ kỹ thuật **đáng làm tiếp**.

---

## ⑥ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| `save_*` payload rỗng | **10/10 chặn sạch** · 0 nhận · **0 × 500** |
| Số dòng toàn schema | **12403 → 12404** — chỉ `sessions` +1 (phiên của tôi) |
| Dữ liệu rác sinh ra | **0** |
| Bug sản phẩm mới | **0** |
| Công cụ mới | `tools/e2e/chup-so-dong.mjs` (đã tự thử) |
| Vân tay | **ĐẠT** `VNTECH-FP-AC3AEB863B93A5E6` · **713 tệp** — ⛔ không đổi |
| Tệp tạm | **0** (đã dọn cả `tools/e2e/tmp-*`) |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **4 bản vá chưa lên sóng** |

---

## ⑦ BÀI HỌC

1. ⭐⭐ **KHI KHÔNG SUY ĐƯỢC BẢNG ĐÍCH, HÃY ĐO **TẤT CẢ**.** Suy tĩnh **thất bại** (`store.insertXxx` ⛔ không có `INSERT INTO`) — nhưng chụp **131 bảng** thì **chắc hơn** và ⛔ không cần biết trước gì. ⭐ Cách «đo rộng» thắng cách «suy hẹp» khi suy không chắc.
2. ⭐⭐ **BIẾN KỶ LUẬT THÀNH CÔNG CỤ.** «Kiểm hậu quả» rút ra ở vòng trước, vòng này **thành `chup-so-dong.mjs`** ⇒ ⛔ không phải làm tay, ⛔ không quên, và phiên sau **dùng lại được**. ⭐ Công cụ có **chống dùng sai** + **tự dọn** + **nhắc đúng chỗ** (`sessions`).
3. ⭐⭐ **KẾT QUẢ ÂM LẦN THỨ HAI LIÊN TIẾP — VÀ VẪN ĐÁNG BÁO CÁO.** 10/10 validate tốt là **bằng chứng chất lượng**. ⛔ Không «thổi» thành lỗi cho có chuyện.
4. ⛔ **LOẠI TRỪ PHẢI CÓ LÝ DO GHI LẠI.** Tôi ⛔ bỏ 2 action cấu hình singleton — và **ghi rõ vì sao** (§12: ⛔ không đánh cược vào cấu hình thật khi chưa có cách khôi phục). ⛔ Bỏ im lặng = che giấu lỗ hổng phủ.
5. ⭐ **GIẢI THÍCH ĐƯỢC MỌI THAY ĐỔI ĐO ĐƯỢC.** Phép đo báo `sessions` +1 — tôi chỉ ra ngay đó là **phiên của chính mình**. ⛔ Một thay đổi không giải thích được thì ⛔ chưa được kết luận.

---

## ⑧ BLOCKER / CHỜ USER

⛔ **Chưa commit**.
⛔ **Cần user quyết — 4 BẢN VÁ chưa lên sóng:**
1. ⭐ **Cho phép `mvn -o -DskipTests package` + khởi động lại Java `:18081`** — **BUG-003 · BUG-005 · BUG-008 · BUG-20261010**; pre-flight đã chứng minh **AN TOÀN**; ghi luôn `V35`+`V37`.
2. **BUG-20261009** — «đọc tất cả» có nên xoá cả thông báo công việc?
3. **BUG-20261005-007** — 130 lớp thiếu CSS: xử lý theo màn hay để lại?
4. **Chốt bất đồng** «ai được nhận hàng ở kho đích».
5. **4 phiếu trả Kho Tổng kẹt + 9 đơn vị kẹt ở `WH-TRANSIT`**.
6. **~61 action UI gọi còn lại chưa được kiểm** (đã lấp **31**) — lấp tiếp? Tỉ lệ tìm bug **≈ 6,5%**.
7. ⭐ **Có bổ sung KHOÁ NGOẠI cho 131 bảng?** (hiện **0 FK**).
8. Xoá đăng ký thừa `manage_contract_review`? · 9. Mở task «thêm thành viên tổ đội»? · 10. Commit?
