# TASK-176 — GO-LIVE ĐỢT 31: KHÉP ĐIỀU TRA QUYỀN — **TÌM RA THỦ PHẠM: CÔNG CỤ CỦA CHÍNH TÔI**

| | |
|---|---|
| **Ngày** | 05/10/2026 |
| **Nhánh** | `unity` (⛔ **chưa commit**) |
| **Tiếp nối** | **TASK-175** (tôi đã gửi **cảnh báo khẩn sai** rồi đính chính) |
| **Kết luận** | ✅ **⛔ KHÔNG hỏng dữ liệu** · ✅ **⛔ KHÔNG phải sự cố sản xuất** · 🐞 **một KHIẾM KHUYẾT THẬT trong công cụ cài đặt E2E** |
| **Tệp sửa** | `tools/e2e/cap-quyen-chuc-nang.mjs` (**1 dòng + chú thích**) — ⛔ **không đụng hệ thống thật** |
| **Vân tay** | ⛔ **không đổi** (`tools/` ngoài `ROOT_DIRS`) |

---

## ① ✅ TÌM RA THỦ PHẠM — **CHÍNH CÔNG CỤ CỦA TÔI**, ⛔ KHÔNG PHẢI XÂM HẠI

Đo được **23 dòng mẫu phòng ban** bị sửa hôm nay, chia **tuần tự theo từng phòng ban**:

| Đơn vị | Số dòng sửa | Thời gian |
|---|---|---|
| Phòng Dự án | **10** | 00:56:42 → 00:57:36 |
| Ban giám đốc | **5** | 00:57:42 → 00:58:03 |
| Phòng Kế hoạch | **4** | 00:58:09 → 00:58:26 |
| Phòng Tài chính – Kế toán | **4** | 00:58:33 → 00:58:55 |
| **Tổng** | **23** | ⭐ khớp **chính xác** 23 lần `save_department_permission` trong `audit_logs` |

⇒ ⭐ **ĐỐI CHIẾU MÃ NGUỒN** `tools/e2e/cap-quyen-chuc-nang.mjs`:
```js
// BƯỚC 8.1 (dòng 106-116): mỗi phòng ban × mỗi module ⇒ gọi save_department_permission
save_department_permission({ organizationUnitId: org, moduleKey: k,
                             canView: 1, canUse: 0, canCreate: 0, canEdit: 0, canApprove: 0, canExport: 0 })
// BƯỚC 8.2 (dòng 120+): 9 tài khoản trong VAI_TRO ⇒ gọi save_user_access
```
⇒ ⭐⭐ **KHỚP 100% cả về SỐ LƯỢNG (23 + 9), HÌNH DẠNG (`canView=1, canUse=0…`) và THỨ TỰ THỜI GIAN** ⇒ ⭐ **đây là **BƯỚC CÀI ĐẶT E2E THEO THIẾT KẾ**, ⛔ không phải ghi đè phá hoại** ✓✓

---

## ② ✅ ⛔ KHÔNG HỎNG DỮ LIỆU — QUYỀN **KHỚP HOÀN TOÀN** MẪU PHÒNG BAN

| Module (của `e2e.to`) | Mẫu phòng ban | Quyền thực | |
|---|---|---|---|
| `central_warehouse` | view=1, **use=0** | view=1, **use=0** | **KHỚP** |
| `dept_plan_rfq` · `dept_project_boq` | 1, 1 | 1, 1 | **KHỚP** |
| `inventory` · `purchasing` · `requests` | view=1, **use=0** | view=1, **use=0** | **KHỚP** |

⇒ ⭐ **Hệ thống NHẤT QUÁN NỘI TẠI** — ⛔ không có dòng nào lệch mẫu ⇒ ⛔ **không hỏng dữ liệu** ✓

---

## ③ ✅ ⛔ KHÔNG PHẢI SỰ CỐ SẢN XUẤT — TÀI KHOẢN THẬT ⛔ KHÔNG BỊ ẢNH HƯỞNG

| Nhóm | Số TK | Số dòng | `can_use=1` | `can_create=1` | `can_approve=1` |
|---|---|---|---|---|---|
| **e2e (test)** | 14 | 836 | **726** | **683** | **111** |
| **THẬT (người dùng)** | 14 | 792 | **725** | **686** | **140** |

⇒ ⭐ **Tài khoản E2E có 726 dòng `can_use=1` — NGANG tài khoản thật** ⇒ ⛔ **KHÔNG bị xoá trắng** ✓
⇒ ⭐⭐ **PHẠM VI ẢNH HƯỞNG = CHỈ TÀI KHOẢN TEST** ⇒ ⛔ **KHÔNG phải sự cố sản xuất** ✓

⚠️ **TÔI ĐÃ KẾT LUẬN SAI VỀ MỨC ĐỘ** ở TASK-175 vì **chỉ lấy mẫu 5–6 module KHO** của 2 tài khoản ⇒ suy ra «xoá trắng». ⛔ **Mẫu nhỏ ở đúng chỗ đang nghi vấn là mẫu THIÊN LỆCH.**

---

## ④ 🐞 KHIẾM KHUYẾT **THẬT** (hẹp) — BƯỚC 8.2 KHAI SAI `permissionSource`

### Triệu chứng đo được
`e2e.to` **và** `e2e.tk` có **`can_use = 0` trên MỌI module kho**:

| Module | `e2e.to` | Ma trận `VAI_TRO` đáng lẽ cấp |
|---|---|---|
| `teams` | view=1, **use=0, create=0** | `{canView:1, canUse:1, canCreate:1}` |
| `warehouse_issue` | view=1, **use=0** | `{canView:1, canUse:1}` |
| `stocktake` · `receiving` · `inventory` | view=1, **use=0** | `{canView:1, canUse:1}` |

`e2e.tk` (thủ kho công trường — đáng lẽ **GHI**) cũng `use=0, create=0, edit=0` trên `receiving` · `warehouse_receipt` · `inventory` · `warehouse_issue`.

### Nguyên nhân
```js
// BƯỚC 8.1 đặt SÀN cho phòng ban: canUse: 0, canCreate: 0, …
// BƯỚC 8.2 cấp cờ RIÊNG cho người — nhưng lại khai:
permissionSource: "department_default",   // ⛔ «người này HƯỞNG THEO phòng ban»
```
⇒ ⭐ Hệ thống hiểu dòng cấp riêng là **«hưởng theo phòng ban»** ⇒ **cờ cấp riêng ⛔ không có hiệu lực**, người dùng chỉ còn **đúng mức sàn `can_use=0`** ⇒ **403** ở `issue_stock_confirm` (cần `warehouse_issue · canCreate`) · `confirm_stock_issue` (`canEdit`) · `receive_goods` · `return_stock` …

⇒ ⭐⭐ **ĐÂY CHÍNH LÀ NGUYÊN NHÂN 2 BÀI E2E TỤT ĐIỂM**: `giai-doan-09` (từng **10/10**) và `go-live-chuoi-kho` (từng **9/9**) ✓

⚠️ **GIẢ THUYẾT TÔI ĐÃ THỬ VÀ ⛔ BỊ BÁC BỎ**: «backend ⛔ không lưu cờ» — ⛔ **SAI**: có **1989/2198 dòng `can_use=1`** và **1866 dòng `can_create=1`** ⇒ backend **CÓ** lưu cờ ✓ ⭐ **Thử giả thuyết trước khi kết luận đã cứu tôi khỏi sai thêm lần nữa.**

### ⛔ ĐIỀU CHƯA CHỨNG MINH ĐƯỢC
⛔ **Cơ chế CHÍNH XÁC** khiến cờ không vào DB (payload? backend tính lại theo `permissionSource`? thứ tự ghi?) — tôi **chưa** chứng minh. ⭐ **Điều CHẮC CHẮN**: cờ **đáng lẽ có** thì **⛔ không có trong DB**, và dòng cấp riêng **đang khai `department_default`** — ⛔ **hai điều đó không khớp ngữ nghĩa**.

---

## ⑤ 🔧 ĐÃ VÁ (chỉ mã nguồn — ⛔ không đụng hệ thống thật)

`tools/e2e/cap-quyen-chuc-nang.mjs`, bước 8.2:
```diff
- permissionSource: "department_default",
+ // ⭐ cờ cấp RIÊNG cho từng người, ⛔ không được để đồng bộ phòng ban ghi đè
+ permissionSource: "manual_override",
```
⭐ **Vì sao đúng**: bước 8.2 **cố ý NÂNG cờ cho từng người** (chú thích gốc: «Chỉ NÂNG cờ, không hạ») ⇒ ngữ nghĩa **phải là `manual_override`**, ⛔ không phải `department_default` ✓
⛔ **KHÔNG chạy lại công cụ** — vì nó gọi `save_user_access` (replace-all) trên hệ thật, mà tôi **đã cam kết ⛔ không chạy** khi chưa có mắt người.

---

## ⑥ ⛔ BA LẦN TÔI SAI TRONG CÙNG MỘT CUỘC ĐIỀU TRA

| # | Tôi đã kết luận | Sự thật | Bài học |
|---|---|---|---|
| 1 | «**BUG-20261010** do `delete_department_permission`» ⇒ **gửi cảnh báo khẩn** | ⛔ **KHÔNG có bản ghi nào** của action đó trong `audit_logs` | ⛔ **ĐỌC NHẬT KÝ TRƯỚC KHI GÁN TỘI** |
| 2 | «Bị gán mẫu của **mọi phòng ban** ⇒ hỏng» | Mẫu **dùng chung 8 × 60**, ⛔ đúng thiết kế | ⛔ **ĐỪNG SUY SỰ THẬT TỪ «TRÔNG CÓ VẺ SAI»** |
| 3 | «Tài khoản bị **xoá trắng quyền**» | **726 dòng `can_use=1`** — ngang tài khoản thật | ⛔ **MẪU NHỎ Ở ĐÚNG CHỖ NGHI VẤN LÀ MẪU THIÊN LỆCH** |

⭐ **Cả ba lần đều do CÙNG MỘT THÓI: KẾT LUẬN TRƯỚC, ĐO SAU.** ⭐ Và lần thứ 3 chỉ được sửa nhờ **đo lại trên TOÀN BỘ nhóm** thay vì 2 tài khoản.

---

## ⑦ ĐO CUỐI VÒNG

| Phép đo | Kết quả |
|---|---|
| Thủ phạm | ✅ **`tools/e2e/cap-quyen-chuc-nang.mjs` bước 8.1 + 8.2** (cài đặt E2E theo thiết kế) |
| Hỏng dữ liệu | ⛔ **KHÔNG** — quyền khớp mẫu 100% |
| Ảnh hưởng tài khoản thật | ⛔ **KHÔNG** — 725 dòng `can_use=1`, ngang E2E |
| Khiếm khuyết thật | 🐞 **1**: bước 8.2 khai sai `permissionSource` ⇒ cờ cấp riêng ⛔ không hiệu lực |
| Đã vá | ✅ **1 dòng** trong `tools/e2e/cap-quyen-chuc-nang.mjs` |
| Hồi quy backend | ✅ **156/156 · EXIT=0** |
| Bug sản phẩm mới | **0** |
| Vân tay | **ĐẠT** `VNTECH-FP-C1B45AAAF31BFCF2` · 713 tệp — ⛔ không đổi |
| `:18081` | ⛔ vẫn **JAR cũ** ⇒ **5 bản vá chưa lên sóng** |

---

## ⑧ BÀI HỌC

1. ⭐⭐ **KẾT LUẬN TRƯỚC — ĐO SAU LÀ NGUỒN CỦA MỌI SAI LẦM.** Cả **ba** lần sai trong cuộc điều tra này đều cùng một thói. ⭐ **Nhật ký kiểm toán và phép đo toàn nhóm là hai thứ PHẢI chạy TRƯỚC khi nói «thủ phạm là…»**
2. ⭐⭐ **MẪU NHỎ Ở ĐÚNG CHỖ NGHI VẤN LÀ MẪU THIÊN LỆCH.** Tôi lấy 2 tài khoản × 5 module **kho** (đúng chỗ đang nghi) ⇒ thấy toàn số 0 ⇒ kết luận «xoá trắng». ⭐ **Đo toàn nhóm mới thấy 726 dòng `can_use=1`.**
3. ⭐ **THỬ GIẢ THUYẾT TRƯỚC KHI KẾT LUẬN — LẦN NÀY ĐÃ CỨU TÔI.** Giả thuyết «backend ⛔ không lưu cờ» **bị bác bỏ** bằng **1989 dòng `can_use=1`** ⇒ ⛔ không sai thêm lần thứ tư.
4. ⭐ **MỘT CÔNG CỤ CÀI ĐẶT KHAI SAI NGỮ NGHĨA SẼ HỎNG ÂM THẦM.** Bước 8.2 **gọi thành công** (9 bản ghi kiểm toán!) và **trả về 200** — nhưng **cờ ⛔ không có hiệu lực**. ⭐ **Thành công của lời gọi ⛔ KHÔNG đồng nghĩa hiệu quả của kết quả** — phải **kiểm trạng thái sau khi ghi**.
5. ⭐ **PHẠM VI LÀ MỘT PHÉP ĐO, ⛔ KHÔNG PHẢI SUY LUẬN.** «Có hỏng không» và «hỏng tới đâu» là **hai câu hỏi khác nhau**; tôi trả lời câu thứ hai bằng **suy luận** thay vì **đo**, nên đã **thổi phồng mức nghiêm trọng** trong cảnh báo khẩn.

---

## ⑨ BLOCKER / CHỜ USER

⛔ **Chưa commit** — **123+ đường**, hỗn hợp 2 phiên.
⛔ **Cần user quyết:**
1. ⭐⭐ **Cho chạy lại `tools/e2e/cap-quyen-chuc-nang.mjs`** để khôi phục quyền cho **14 tài khoản `e2e.*`**? — công cụ đã vá; ⚠️ nó gọi `save_user_access` (replace-all) **chỉ trên tài khoản `e2e.*`** ⇒ ⭐ **cần bạn cho phép** vì tôi đã cam kết ⛔ không chạy khi chưa có mắt người.
2. ⭐ **Cho phép triển khai 5 bản vá Java** (1 lệnh): `node tools/deploy-java-backend.mjs --dong-y-trien-khai`.
3. ⭐ **Xác nhận 4 bản vá CSS bằng mắt**.
4. `stack-form` · **commit theo nhóm** · BUG-20261009 · «ai nhận hàng ở kho đích» · dọn Transit · CRUD 6 thực thể · khoá ngoại.
